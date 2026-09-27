import { X509Certificate } from "node:crypto";
import { compactVerify, importX509, decodeJwt, decodeProtectedHeader } from "jose";

// Server-side verification of StoreKit 2 signed transactions (JWSTransaction).
//
// A real Apple-signed JWS carries its certificate chain in the `x5c` header:
//   [ leaf, intermediate, Apple Root CA - G3 ].
// We (1) pin Apple's Root CA - G3 by SHA-256 fingerprint, (2) cryptographically
// verify each link of the chain and its validity window, then (3) verify the JWS
// signature with the leaf certificate's public key. Only then do we trust the
// payload (productId / expiresDate / originalTransactionId / bundleId).
//
// Local Xcode `.storekit` testing produces transactions in the "Xcode"
// environment that are NOT signed by Apple's root. Those are accepted ONLY when
// STOREKIT_ALLOW_XCODE=1 is set (dev machines), and never in Sandbox/Production.

// openssl x509 -inform der -in AppleRootCA-G3.cer -noout -fingerprint -sha256
const APPLE_ROOT_CA_G3_FP =
  "63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79";

export type TxPayload = {
  productId?: string;
  originalTransactionId?: string;
  transactionId?: string;
  bundleId?: string;
  expiresDate?: number; // ms since epoch
  revocationDate?: number;
  environment?: string; // "Xcode" | "Sandbox" | "Production"
};

export type VerifyResult = { payload: TxPayload; verified: boolean; environment: string };

export class VerifyError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
  }
}

function certValidNow(cert: X509Certificate): boolean {
  const from = new Date(cert.validFrom).getTime();
  const to = new Date(cert.validTo).getTime();
  const now = Date.now();
  return Number.isFinite(from) && Number.isFinite(to) && now >= from && now <= to;
}

/**
 * Verify a StoreKit 2 JWS transaction. Throws VerifyError on any failure.
 * `expectedBundleId` (when provided) is enforced against the payload.
 */
export async function verifyTransaction(
  jws: string,
  expectedBundleId?: string,
): Promise<VerifyResult> {
  // Peek (unverified) at the environment to branch dev vs. real.
  let peek: TxPayload;
  try {
    peek = decodeJwt(jws) as TxPayload;
  } catch {
    throw new VerifyError("invalid_jws", "could not decode JWS payload");
  }
  const environment = String(peek.environment ?? "");

  // --- Local Xcode testing: no Apple chain; gated by explicit dev flag. ---
  if (environment === "Xcode") {
    if (process.env.STOREKIT_ALLOW_XCODE !== "1") {
      throw new VerifyError("xcode_not_allowed", "Xcode transactions rejected (set STOREKIT_ALLOW_XCODE=1 for local dev)");
    }
    if (expectedBundleId && peek.bundleId && peek.bundleId !== expectedBundleId) {
      throw new VerifyError("bundle_mismatch", `bundleId ${peek.bundleId}`);
    }
    return { payload: peek, verified: false, environment };
  }

  // --- Sandbox / Production: full Apple chain + signature verification. ---
  let header: { alg?: string; x5c?: string[] };
  try {
    header = decodeProtectedHeader(jws) as { alg?: string; x5c?: string[] };
  } catch {
    throw new VerifyError("invalid_header", "could not decode JWS header");
  }
  if (header.alg !== "ES256") throw new VerifyError("bad_alg", `alg ${header.alg}`);
  const x5c = header.x5c;
  if (!Array.isArray(x5c) || x5c.length < 2) {
    throw new VerifyError("missing_x5c", "transaction is not Apple-signed");
  }

  // Build the certificate chain (leaf → … → root).
  let chain: X509Certificate[];
  try {
    chain = x5c.map((b64) => new X509Certificate(Buffer.from(b64, "base64")));
  } catch {
    throw new VerifyError("bad_cert", "could not parse x5c certificate");
  }

  // Root must be the pinned Apple Root CA - G3.
  const root = chain[chain.length - 1];
  if (root.fingerprint256 !== APPLE_ROOT_CA_G3_FP) {
    throw new VerifyError("untrusted_root", "root is not Apple Root CA - G3");
  }

  // Every certificate must be currently valid, and each must be signed by its issuer.
  for (let i = 0; i < chain.length; i++) {
    if (!certValidNow(chain[i])) throw new VerifyError("cert_expired", `cert ${i} outside validity window`);
    if (i < chain.length - 1) {
      const issuer = chain[i + 1];
      if (!chain[i].checkIssued(issuer) || !chain[i].verify(issuer.publicKey)) {
        throw new VerifyError("broken_chain", `cert ${i} not signed by cert ${i + 1}`);
      }
    }
  }
  // Root is self-signed; confirm it.
  if (!root.verify(root.publicKey)) throw new VerifyError("bad_root", "root self-signature invalid");

  // Verify the JWS signature with the leaf certificate's public key.
  const leafKey = await importX509(chain[0].toString(), "ES256");
  let payload: TxPayload;
  try {
    const { payload: raw } = await compactVerify(jws, leafKey);
    payload = JSON.parse(new TextDecoder().decode(raw)) as TxPayload;
  } catch {
    throw new VerifyError("bad_signature", "JWS signature does not verify against leaf key");
  }

  if (expectedBundleId && payload.bundleId && payload.bundleId !== expectedBundleId) {
    throw new VerifyError("bundle_mismatch", `bundleId ${payload.bundleId}`);
  }

  return { payload, verified: true, environment: String(payload.environment ?? environment) };
}
