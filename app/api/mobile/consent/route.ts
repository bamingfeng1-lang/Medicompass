import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";

// GET  /api/mobile/consent  — the caller's recorded consents (latest per type)
// POST /api/mobile/consent  — record one or more consent acceptances / revocations
//   body: { items: [{ type, version?, accepted? }] }  (accepted defaults to true)
//
// Consent types: privacy | agreement | disclaimer | sensitive | crossborder.
// Acceptances are idempotent per (type, version) so re-syncing on each login
// does not create duplicate rows. A revocation (accepted:false) always appends.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = ["privacy", "agreement", "disclaimer", "sensitive", "crossborder"];

export async function GET(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();
  const consents = await prisma.consent.findMany({
    where: { userId: user.id },
    orderBy: { acceptedAt: "desc" },
  });
  return Response.json({ consents });
}

export async function POST(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();

  let body: { items?: Array<{ type?: string; version?: string; accepted?: boolean }> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  const clean = items
    .filter((it) => typeof it?.type === "string" && TYPES.includes(it.type))
    .map((it) => ({
      type: String(it.type),
      version: typeof it.version === "string" && it.version ? it.version : "1.0",
      accepted: it.accepted !== false, // default true
    }));

  if (clean.length === 0) {
    return Response.json({ error: "no_valid_items" }, { status: 400 });
  }

  const now = new Date();
  for (const it of clean) {
    if (it.accepted) {
      // Idempotent: skip if an identical un-revoked acceptance already exists.
      const existing = await prisma.consent.findFirst({
        where: { userId: user.id, type: it.type, version: it.version, accepted: true, revokedAt: null },
      });
      if (!existing) {
        await prisma.consent.create({
          data: { userId: user.id, type: it.type, version: it.version, accepted: true, acceptedAt: now },
        });
      }
    } else {
      // Revocation: mark any active acceptance of this type revoked, and log the event.
      await prisma.consent.updateMany({
        where: { userId: user.id, type: it.type, accepted: true, revokedAt: null },
        data: { revokedAt: now },
      });
      await prisma.consent.create({
        data: { userId: user.id, type: it.type, version: it.version, accepted: false, acceptedAt: now, revokedAt: now },
      });
    }
  }

  const consents = await prisma.consent.findMany({
    where: { userId: user.id },
    orderBy: { acceptedAt: "desc" },
  });
  return Response.json({ ok: true, consents });
}
