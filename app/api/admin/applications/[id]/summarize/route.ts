import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { summarizeApplication } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 300;

// Admin-only (guarded by middleware): (re)generate the AI summary and return it.
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const exists = await prisma.application.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await summarizeApplication(params.id);

  const app = await prisma.application.findUnique({
    where: { id: params.id },
    select: { aiSummary: true, aiSummaryStatus: true, aiSummaryError: true },
  });
  return NextResponse.json(app);
}
