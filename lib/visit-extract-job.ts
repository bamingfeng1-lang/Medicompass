import { promises as fs } from "fs";
import { prisma } from "@/lib/db";
import { extractVisits } from "@/lib/visit-extract";

// Fire-and-forget AI extraction for a MobileVisitJob. Mirrors lib/report-ai.ts:
// reads the job's persisted photos, runs the (never-throwing) vision extraction,
// and writes the resulting draft groups + status back to the job row. Safe to
// call with `void` — any failure lands as status "failed" with an error message.

export async function runVisitExtractJob(jobId: string): Promise<void> {
  const job = await prisma.mobileVisitJob.findUnique({
    where: { id: jobId },
    include: { files: { orderBy: { idx: "asc" } } },
  });
  if (!job) return;

  try {
    const images = [];
    for (const f of job.files) {
      const data = await fs.readFile(f.storedPath);
      images.push({ data, mime: f.mimeType, name: f.originalName });
    }
    const groups = await extractVisits(images, job.locale);
    await prisma.mobileVisitJob.update({
      where: { id: jobId },
      data: { status: "done", drafts: JSON.stringify(groups), error: "" },
    });
  } catch (err) {
    await prisma.mobileVisitJob.update({
      where: { id: jobId },
      data: { status: "failed", error: err instanceof Error ? err.message : String(err) },
    });
  }
}
