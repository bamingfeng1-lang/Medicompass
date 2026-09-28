import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { UPLOAD_ROOT } from "@/lib/storage";
import type { VisitGroupDraft, LabResult } from "@/lib/visit-extract";

// Shared helpers for the 就诊记录 AI 后台任务 (MobileVisitJob) routes. Lives
// outside the route modules because Next.js route files may only export HTTP
// handlers + config. Covers the job wire-shape plus the "commit reviewed drafts
// into real MobileVisit rows" logic (copies the job's stored photos into each
// new visit's own attachments so they survive the job being cleaned up).

const VISIT_TYPES = ["outpatient", "emergency", "inpatient", "checkup", "other"];

/** Parse the persisted VisitGroupDraft[] JSON; tolerant of empty/garbage. */
export function parseDrafts(raw: string): VisitGroupDraft[] {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? (v as VisitGroupDraft[]) : [];
  } catch {
    return [];
  }
}

type JobFileRow = { id: string; idx: number; mimeType: string; size: number; originalName: string };
type JobRow = {
  id: string; status: string; reviewed: boolean; error: string; locale: string;
  fileCount: number; drafts: string; createdAt: Date; updatedAt: Date; files: JobFileRow[];
};

/** Wire shape for a visit job. Never leaks storedPath (bytes via the files route). */
export function shapeVisitJob(j: JobRow) {
  return {
    id: j.id,
    status: j.status,
    reviewed: j.reviewed,
    error: j.error,
    locale: j.locale,
    fileCount: j.fileCount,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
    drafts: parseDrafts(j.drafts),
    files: [...j.files]
      .sort((a, b) => a.idx - b.idx)
      .map((f) => ({ id: f.id, idx: f.idx, mimeType: f.mimeType, size: f.size, originalName: f.originalName })),
  };
}

export type CommitVisit = {
  visitType: string; patientName: string; hospital: string; department: string;
  doctor: string; visitDate: string; diagnosis: string; notes: string;
  labResults: LabResult[];
  imageIndexes: number[];
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function numOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
/** Validate client-echoed labResults the same way the extractor does. */
function parseLabResults(v: unknown): LabResult[] {
  if (!Array.isArray(v)) return [];
  const out: LabResult[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const name = str(r.name);
    const value = numOrNull(r.value);
    if (!name || value == null) continue;
    out.push({ name, value, unit: str(r.unit), refLow: numOrNull(r.refLow), refHigh: numOrNull(r.refHigh) });
    if (out.length >= 20) break;
  }
  return out;
}
function parseVisitDate(raw: string): Date {
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Upsert a 关注指标 (MobileMetricItem) per extracted lab result and append a
 * reading at the visit's date. Dedup items by (userId, name); backfills the
 * reference range / unit only when the existing item lacked them. Best-effort:
 * a single bad result must not abort the commit.
 */
async function recordLabResults(userId: string, visitDate: Date, labs: LabResult[]): Promise<void> {
  for (const lab of labs) {
    try {
      const existing = await prisma.mobileMetricItem.findFirst({ where: { userId, name: lab.name } });
      let itemId: string;
      if (existing) {
        itemId = existing.id;
        const data: { unit?: string; targetLow?: number; targetHigh?: number } = {};
        if (!existing.unit && lab.unit) data.unit = lab.unit;
        if (existing.targetLow == null && lab.refLow != null) data.targetLow = lab.refLow;
        if (existing.targetHigh == null && lab.refHigh != null) data.targetHigh = lab.refHigh;
        if (Object.keys(data).length > 0) {
          await prisma.mobileMetricItem.update({ where: { id: itemId }, data });
        }
      } else {
        const created = await prisma.mobileMetricItem.create({
          data: {
            userId,
            name: lab.name,
            unit: lab.unit,
            targetLow: lab.refLow,
            targetHigh: lab.refHigh,
            source: "visit",
          },
        });
        itemId = created.id;
      }
      await prisma.mobileMetricReading.create({
        data: { itemId, value: lab.value, measuredAt: visitDate, note: "" },
      });
    } catch {
      // Best-effort per lab result.
    }
  }
}

/** Copy a stored job file's bytes into the given visit's own upload folder. */
async function copyToVisit(visitId: string, src: JobFileRow & { storedPath: string }): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, `visit-${visitId}`);
  await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, `${Date.now()}-${path.basename(src.storedPath)}`);
  await fs.copyFile(src.storedPath, dest);
  return dest;
}

/**
 * Creates MobileVisit rows from reviewed drafts, attaching the job's photos by
 * index, then marks the job reviewed. Returns the created visits (with
 * attachments) for reshaping. Verifies ownership; throws "not_found" otherwise.
 */
export async function commitJobVisits(userId: string, jobId: string, visits: unknown): Promise<string[]> {
  const job = await prisma.mobileVisitJob.findFirst({
    where: { id: jobId, userId },
    include: { files: { orderBy: { idx: "asc" } } },
  });
  if (!job) throw new Error("not_found");

  const byIdx = new Map(job.files.map((f) => [f.idx, f]));
  const list: CommitVisit[] = Array.isArray(visits)
    ? (visits as Record<string, unknown>[]).map((v) => ({
        visitType: VISIT_TYPES.includes(str(v.visitType)) ? str(v.visitType) : "outpatient",
        patientName: str(v.patientName),
        hospital: str(v.hospital),
        department: str(v.department),
        doctor: str(v.doctor),
        visitDate: str(v.visitDate),
        diagnosis: str(v.diagnosis),
        notes: str(v.notes),
        labResults: parseLabResults(v.labResults),
        imageIndexes: Array.isArray(v.imageIndexes)
          ? (v.imageIndexes as unknown[]).map((n) => Number(n)).filter((n) => Number.isInteger(n))
          : [],
      }))
    : [];

  const createdIds: string[] = [];
  for (const v of list) {
    const visit = await prisma.mobileVisit.create({
      data: {
        userId,
        visitType: v.visitType,
        patientName: v.patientName,
        hospital: v.hospital,
        department: v.department,
        doctor: v.doctor,
        diagnosis: v.diagnosis,
        notes: v.notes,
        visitDate: parseVisitDate(v.visitDate),
      },
    });
    createdIds.push(visit.id);

    // Surface any extracted lab values as 关注指标 readings for this patient.
    if (v.labResults.length > 0) {
      await recordLabResults(userId, visit.visitDate, v.labResults);
    }

    for (const idx of v.imageIndexes) {
      const file = byIdx.get(idx);
      if (!file) continue;
      try {
        const storedPath = await copyToVisit(visit.id, file);
        await prisma.mobileVisitAttachment.create({
          data: {
            visitId: visit.id,
            originalName: file.originalName,
            storedPath,
            mimeType: file.mimeType,
            size: file.size,
          },
        });
      } catch {
        // Best-effort: a missing source photo shouldn't abort the whole commit.
      }
    }
  }

  await prisma.mobileVisitJob.update({ where: { id: job.id }, data: { reviewed: true } });
  return createdIds;
}
