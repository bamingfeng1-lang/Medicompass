// Encrypted-PDF handling for uploaded medical records. The backend has no PDF
// renderer otherwise — raw bytes are base64'd straight to Anthropic — so a
// password-protected PDF would reach the model as unreadable ciphertext. Here
// we detect encryption up front and, given the right password, re-serialize a
// DECRYPTED copy (encrypt=none) whose bytes the model can read.
//
// Backed by mupdf (pure WASM, no system binary — safe on this local-disk
// deploy). Imported dynamically so its WASM only loads when a PDF is handled.

export class PdfPasswordRequiredError extends Error {
  constructor() {
    super("pdf_password_required");
    this.name = "PdfPasswordRequiredError";
  }
}

export class PdfPasswordWrongError extends Error {
  constructor() {
    super("pdf_password_wrong");
    this.name = "PdfPasswordWrongError";
  }
}

/** True if the PDF needs a password to read its contents. */
export async function isEncryptedPdf(bytes: Buffer | Uint8Array): Promise<boolean> {
  const mupdf = await import("mupdf");
  const doc = mupdf.Document.openDocument(new Uint8Array(bytes), "application/pdf");
  try {
    return doc.needsPassword();
  } finally {
    doc.destroy();
  }
}

/**
 * Return decrypted, password-free PDF bytes for an encrypted PDF.
 * - Throws `PdfPasswordRequiredError` if no password was supplied.
 * - Throws `PdfPasswordWrongError` if the password doesn't authenticate.
 * The bytes are re-serialized with `encrypt=none` so downstream readers
 * (page count, Anthropic document block) see a plain PDF.
 */
export async function decryptPdf(
  bytes: Buffer | Uint8Array,
  password: string | undefined,
): Promise<Buffer> {
  const mupdf = await import("mupdf");
  const doc = mupdf.Document.openDocument(new Uint8Array(bytes), "application/pdf");
  try {
    if (!doc.needsPassword()) return Buffer.from(bytes);
    if (!password) throw new PdfPasswordRequiredError();
    // authenticatePassword returns 0 on failure, non-zero on success.
    if (!doc.authenticatePassword(password)) throw new PdfPasswordWrongError();
    const pdf = doc.asPDF();
    if (!pdf) throw new Error("not_a_pdf");
    const out = pdf.saveToBuffer("encrypt=none");
    return Buffer.from(out.asUint8Array());
  } finally {
    doc.destroy();
  }
}

export type PdfGateResult =
  | { ok: true; files: File[] }
  | { ok: false; error: "pdf_password_required" | "pdf_password_wrong"; fileNames: string[] };

/**
 * Screen a batch of uploads for encrypted PDFs, decrypting where a password is
 * available. Returns the effective files (encrypted PDFs replaced by decrypted
 * copies) or, if any PDF still can't be read, the gate error + the offending
 * file names — so the route can 409 WITHOUT creating a job/report or metering.
 * Non-PDFs pass through untouched.
 */
export async function resolvePdfUploads(
  files: File[],
  passwords: Record<string, string>,
): Promise<PdfGateResult> {
  const required: string[] = [];
  const wrong: string[] = [];
  const out: File[] = [];
  for (const f of files) {
    if (f.type !== "application/pdf") {
      out.push(f);
      continue;
    }
    const bytes = Buffer.from(await f.arrayBuffer());
    const pw = passwords[f.name] ?? passwords["*"];
    try {
      const decrypted = await decryptPdf(bytes, pw);
      // decryptPdf returns the original bytes untouched when not encrypted.
      out.push(decrypted.equals(bytes) ? f : new File([new Uint8Array(decrypted)], f.name, { type: "application/pdf" }));
    } catch (e) {
      if (e instanceof PdfPasswordWrongError) wrong.push(f.name);
      else if (e instanceof PdfPasswordRequiredError) required.push(f.name);
      else throw e;
    }
  }
  if (required.length) return { ok: false, error: "pdf_password_required", fileNames: required };
  if (wrong.length) return { ok: false, error: "pdf_password_wrong", fileNames: wrong };
  return { ok: true, files: out };
}

/**
 * Parse per-file passwords from a multipart form. Accepts a JSON `passwords`
 * field (`{ "<filename>": "<pw>" }`) and/or a single `password` field applied
 * as a wildcard ("*") to any encrypted PDF without a specific entry.
 */
export function parsePasswords(form: FormData): Record<string, string> {
  const map: Record<string, string> = {};
  const json = form.get("passwords");
  if (typeof json === "string" && json) {
    try {
      const obj = JSON.parse(json);
      if (obj && typeof obj === "object") {
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === "string") map[k] = v;
        }
      }
    } catch {
      // ignore malformed passwords blob — treated as no passwords
    }
  }
  const single = form.get("password");
  if (typeof single === "string" && single) map["*"] = single;
  return map;
}
