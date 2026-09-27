import { getMobileUser, unauthorized } from "@/lib/mobile-auth";
import { prisma } from "@/lib/db";
import { PRODUCT_TIER } from "@/lib/products";
import { verifyTransaction, VerifyError } from "@/lib/appstore-verify";

// POST /api/mobile/subscription/verify  body: { jws: string }
//   `jws` is a StoreKit 2 signed transaction (JWSTransaction). We CRYPTOGRAPHICALLY
//   verify it (Apple x5c chain pinned to Apple Root CA - G3 + JWS signature) before
//   trusting productId / expiresDate / originalTransactionId and updating the tier.
//   Local Xcode `.storekit` transactions are accepted only with STOREKIT_ALLOW_XCODE=1.
//   The client no longer dictates sandbox/environment — it is read from the verified
//   payload, so a forged body cannot grant a tier.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPECTED_BUNDLE_ID = process.env.APPLE_BUNDLE_ID || "com.medicomai.medicompass";

export async function POST(req: Request): Promise<Response> {
  const user = await getMobileUser(req);
  if (!user) return unauthorized();

  let body: { jws?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!body.jws) return Response.json({ error: "missing_jws" }, { status: 400 });

  // Verify the signed transaction against Apple's root before trusting anything.
  let verified;
  try {
    verified = await verifyTransaction(body.jws, EXPECTED_BUNDLE_ID);
  } catch (e) {
    const code = e instanceof VerifyError ? e.code : "verify_failed";
    return Response.json({ error: "verification_failed", reason: code }, { status: 400 });
  }
  const payload = verified.payload;

  const productId = payload.productId ?? "";
  const tier = PRODUCT_TIER[productId];
  if (!tier) return Response.json({ error: "unknown_product", productId }, { status: 422 });

  const expiresAt = payload.expiresDate ? new Date(payload.expiresDate) : null;
  const revoked = !!payload.revocationDate;
  const active = !revoked && (!expiresAt || expiresAt.getTime() > Date.now());
  const status = revoked ? "refunded" : active ? "active" : "expired";

  const env = verified.environment.toLowerCase();
  const source = env === "xcode" ? "xcode" : env === "sandbox" ? "sandbox" : "storekit";

  await prisma.subscription.create({
    data: {
      userId: user.id,
      tier,
      productId,
      status,
      originalTxId: payload.originalTransactionId ?? null,
      expiresAt,
      source,
    },
  });

  // Reflect the entitlement on the user (downgrade to free if not active).
  const newTier = active ? tier : "free";
  const updated = await prisma.mobileUser.update({
    where: { id: user.id },
    data: { tier: newTier },
  });

  return Response.json({ tier: updated.tier, status });
}
