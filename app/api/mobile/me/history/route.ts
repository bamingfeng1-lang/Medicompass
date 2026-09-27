import { resolveProfile } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// GET /api/mobile/me/history — the medical-profile edit history for the ACTIVE
// profile (honors X-Profile-Id so a caregiver sees a managed profile's trail).
// Read-only transparency for the patient/caregiver; `changes` is decrypted by
// the Prisma field-encryption extension before it reaches here.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Change = { field: string; from: string | null; to: string | null };

export async function GET(req: Request): Promise<Response> {
  const res = await resolveProfile(req);
  if (!res.ok) return res.response;

  const rows = await prisma.profileAudit.findMany({
    where: { userId: res.profile.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const entries = rows.map((r) => {
    let changes: Change[] = [];
    try {
      const parsed = JSON.parse(r.changes);
      if (Array.isArray(parsed)) changes = parsed as Change[];
    } catch {
      // Corrupt/undecryptable payload — surface an empty change set, not a 500.
    }
    return {
      id: r.id,
      action: r.action,
      actorName: r.actorName,
      actorIsSelf: r.actorId === res.profile.id,
      changes,
      createdAt: r.createdAt,
    };
  });

  return Response.json({ entries });
}
