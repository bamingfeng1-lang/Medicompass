import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Application-layer field encryption for the most sensitive free-text PHI at
// rest (AES-256-GCM). This protects against theft of the raw SQLite file
// (stolen backup, lost disk, exfiltrated DB) — it does NOT protect against a
// full-server compromise where the attacker also has the key/env. That deeper
// posture needs a KMS/HSM-held key + full-disk encryption (out of scope).
//
// Scope (minimal set, per product decision): ChatTurn.content,
// MobileReport.aiInterpretation, ConsultMessage.text. These fields are never
// used in a `where`/`orderBy`, so non-deterministic (random-IV) encryption is
// safe and breaks no query.
//
// Stored format: `enc:v1:` + base64(iv[12] | authTag[16] | ciphertext).
// Reads pass through any value lacking the prefix (legacy plaintext), so no
// backfill is required.
// ---------------------------------------------------------------------------

const PREFIX = "enc:v1:";
const IV_LEN = 12;
const TAG_LEN = 16;

let cachedKey: Buffer | null = null;

/** Load (once) the 32-byte AES key. Prefers a dedicated `ENCRYPTION_KEY`
 *  (base64 or hex); falls back to deriving one from `AUTH_SECRET` so the app
 *  runs out of the box. Production should set a dedicated `ENCRYPTION_KEY`. */
function loadKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.ENCRYPTION_KEY;
  if (raw && raw.length > 0) {
    // Try base64 then hex; accept only if it yields exactly 32 bytes.
    const b64 = tryDecode(raw, "base64");
    if (b64?.length === 32) return (cachedKey = b64);
    const hex = tryDecode(raw, "hex");
    if (hex?.length === 32) return (cachedKey = hex);
    // Otherwise stretch whatever was provided to 32 bytes.
    cachedKey = scryptSync(raw, "medicompass-field-enc-v1", 32);
    return cachedKey;
  }

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret || authSecret.length < 16) {
    throw new Error(
      "Field encryption needs ENCRYPTION_KEY (or a valid AUTH_SECRET fallback) in .env.",
    );
  }
  cachedKey = scryptSync(authSecret, "medicompass-field-enc-v1", 32);
  return cachedKey;
}

function tryDecode(s: string, enc: "base64" | "hex"): Buffer | null {
  try {
    const b = Buffer.from(s, enc);
    return b.length ? b : null;
  } catch {
    return null;
  }
}

/** Encrypt a plaintext string. Empty strings are stored as-is (nothing to
 *  hide, and it keeps `@default("")` columns clean). */
export function encryptField(plain: string): string {
  if (!plain) return plain;
  if (plain.startsWith(PREFIX)) return plain; // already encrypted
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", loadKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

/** Decrypt a stored value. Values without the prefix (legacy plaintext) are
 *  returned unchanged. Decryption failures fall back to the raw value so a
 *  bad/rotated key never turns a read into a 500. */
export function decryptField(stored: string): string {
  if (!stored || !stored.startsWith(PREFIX)) return stored;
  try {
    const buf = Buffer.from(stored.slice(PREFIX.length), "base64");
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const ct = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv("aes-256-gcm", loadKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    return stored;
  }
}

// ---------------------------------------------------------------------------
// Prisma client extension: transparently encrypt on write and decrypt on read.
// ---------------------------------------------------------------------------

/** Fields encrypted per model. */
const ENCRYPTED_FIELDS: Record<string, string[]> = {
  ChatTurn: ["content"],
  MobileReport: ["aiInterpretation"],
  ConsultMessage: ["text"],
  ProfileAudit: ["changes"], // old→new snapshot may contain allergies/病史 PHI
  AdverseEventReport: ["description"], // free text may name symptoms / drugs (PHI)
};

/** Nested relation → child model, so writes that create related rows inline
 *  (e.g. `Consult.create({ data: { messages: { create: { text } } } })`)
 *  still get encrypted. */
const RELATIONS: Record<string, Record<string, string>> = {
  Consult: { messages: "ConsultMessage" },
  ChatThread: { turns: "ChatTurn" },
};

const WRITE_OPS = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
]);

/** Encrypt the mapped fields on a single data object in place. */
function encryptObjectFields(obj: unknown, fields: string[]): void {
  if (!obj || typeof obj !== "object") return;
  const rec = obj as Record<string, unknown>;
  for (const f of fields) {
    const v = rec[f];
    if (typeof v === "string") rec[f] = encryptField(v);
  }
}

/** Encrypt this model's fields inside one `data`/`create`/`update` payload,
 *  then descend into any inline relation creates. */
function encryptDataPayload(model: string, data: unknown): void {
  if (!data || typeof data !== "object") return;

  const own = ENCRYPTED_FIELDS[model];
  if (Array.isArray(data)) {
    for (const item of data) encryptDataPayload(model, item);
    return;
  }
  if (own) encryptObjectFields(data, own);

  const rels = RELATIONS[model];
  if (rels) {
    const rec = data as Record<string, unknown>;
    for (const [relField, childModel] of Object.entries(rels)) {
      const nested = rec[relField];
      if (!nested || typeof nested !== "object") continue;
      const n = nested as Record<string, unknown>;
      if (n.create) encryptDataPayload(childModel, n.create);
      if (n.createMany && typeof n.createMany === "object") {
        encryptDataPayload(childModel, (n.createMany as Record<string, unknown>).data);
      }
    }
  }
}

/** Apply write-side encryption to a Prisma operation's args. */
function encryptWrites(model: string, operation: string, args: unknown): void {
  if (!args || typeof args !== "object") return;
  const a = args as Record<string, unknown>;
  if (operation === "upsert") {
    encryptDataPayload(model, a.create);
    encryptDataPayload(model, a.update);
  } else {
    encryptDataPayload(model, a.data);
  }
}

/** Recursively decrypt any `enc:v1:` string anywhere in a query result. This
 *  is model-agnostic so it transparently covers nested `include` relations. */
function decryptResult(value: unknown, seen = new Set<object>()): void {
  if (!value || typeof value !== "object") return;
  if (value instanceof Date || Buffer.isBuffer(value)) return;
  if (seen.has(value)) return;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) decryptResult(item, seen);
    return;
  }
  const rec = value as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    const v = rec[k];
    if (typeof v === "string") {
      if (v.startsWith(PREFIX)) rec[k] = decryptField(v);
    } else if (v && typeof v === "object") {
      decryptResult(v, seen);
    }
  }
}

/** The extension mounted on the shared client in lib/db.ts. */
export const fieldEncryption = Prisma.defineExtension({
  name: "field-encryption",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (model && WRITE_OPS.has(operation)) {
          encryptWrites(model, operation, args);
        }
        const result = await query(args);
        decryptResult(result);
        return result;
      },
    },
  },
});
