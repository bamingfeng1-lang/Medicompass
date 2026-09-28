import { prisma } from "@/lib/db";

// Assembles a localized summary of a user's recent visit + report records.
// Shared by the AI chat system prompt and the doctor-consult sync flow, so the
// two never drift. Kept in lib/ (not a route.ts) because route files may only
// export handlers + config.

/**
 * Builds the "recent visits / reports" summary block for a user, or `null` when
 * there is nothing to show. Pulls the 8 most recent `MobileVisit` and
 * `MobileReport` rows, localized zh/en.
 */
export async function buildMedicalRecordsText(
  locale: string,
  userId: string,
): Promise<string | null> {
  const zh = (locale || "").startsWith("zh");
  const [visits, reports] = await Promise.all([
    prisma.mobileVisit.findMany({
      where: { userId },
      orderBy: { visitDate: "desc" },
      take: 8,
    }),
    prisma.mobileReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);
  if (!visits.length && !reports.length) return null;

  const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
  const lines: string[] = [];

  if (visits.length) {
    lines.push(zh ? "就诊记录（近期）：" : "Recent visit records:");
    for (const v of visits) {
      const parts = [
        fmtDate(v.visitDate),
        v.hospital || null,
        v.department || null,
        v.doctor || null,
        v.diagnosis ? (zh ? `诊断：${v.diagnosis}` : `Dx: ${v.diagnosis}`) : null,
        v.notes ? (zh ? `备注：${v.notes}` : `Notes: ${v.notes}`) : null,
      ].filter(Boolean);
      lines.push(`- ${parts.join(" · ")}`);
    }
  }

  if (reports.length) {
    lines.push(zh ? "上传的报告 / 化验单：" : "Uploaded reports / lab sheets:");
    for (const r of reports) {
      const reading =
        r.aiStatus === "done" && r.aiInterpretation
          ? r.aiInterpretation.replace(/\s+/g, " ").slice(0, 400)
          : zh ? "（尚无 AI 解读）" : "(no AI reading yet)";
      const tag = r.reviewed ? (zh ? "已医生审核" : "doctor-reviewed") : r.aiStatus;
      lines.push(`- ${fmtDate(r.createdAt)} · ${r.category} · ${r.originalName} [${tag}]: ${reading}`);
    }
  }

  return lines.join("\n");
}

/**
 * Appends the medical-records summary to a base system prompt (AI chat use).
 * No-ops when the user has no records. Preserves the original chat wording.
 */
export async function withMedicalRecords(
  base: string,
  locale: string,
  userId: string,
): Promise<string> {
  const text = await buildMedicalRecordsText(locale, userId);
  if (!text) return base;
  const zh = (locale || "").startsWith("zh");
  const header = zh
    ? "\n\n以下是用户的就诊与报告记录，可在分析时参考：\n"
    : "\n\nHere are the user's visit and report records — reference them when relevant:\n";
  return base + header + text;
}
