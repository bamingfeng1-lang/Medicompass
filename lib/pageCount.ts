// Lightweight page counter for uploaded reports, used to meter the monthly
// report-interpretation quota. Images count as 1 page. For PDFs we do a cheap
// byte-level heuristic (count page objects) — no external dependency. This can
// under/over-count exotic PDFs (object streams, linearized); it's a billing
// approximation, not a renderer, and always returns at least 1.

const PAGE_OBJ = /\/Type\s*\/Page[^s]/g;
const COUNT_ENTRY = /\/Count\s+(\d+)/g;

export async function countReportPages(file: File): Promise<number> {
  if (file.type !== "application/pdf") return 1;
  try {
    const text = Buffer.from(await file.arrayBuffer()).toString("latin1");

    // Prefer the largest /Count in the page-tree root when present.
    let maxCount = 0;
    let m: RegExpExecArray | null;
    COUNT_ENTRY.lastIndex = 0;
    while ((m = COUNT_ENTRY.exec(text)) !== null) {
      maxCount = Math.max(maxCount, parseInt(m[1], 10) || 0);
    }
    // Fall back to counting page objects.
    const pageObjs = (text.match(PAGE_OBJ) || []).length;

    return Math.max(1, maxCount || pageObjs);
  } catch {
    return 1;
  }
}
