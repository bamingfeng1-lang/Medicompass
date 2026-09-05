import { promises as fs } from "fs";
import path from "path";

// Local disk storage for uploaded attachments. Files live under
// data/uploads/<applicationId>/; the DB only stores metadata + storedPath.
// Not suitable for serverless deploys (ephemeral FS) — swap for object
// storage (S3/R2) there.

export const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB per file

// Types Claude can read directly (PDF documents + images). Other types are
// still stored, but skipped when building the AI summary.
export const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type SavedFile = {
  originalName: string;
  storedPath: string;
  mimeType: string;
  size: number;
};

function sanitize(name: string): string {
  const base = path.basename(name).replace(/[^\w.\-一-龥]+/g, "_");
  return base.slice(0, 180) || "file";
}

/** Persist a single uploaded File to disk under the application's folder. */
export async function saveUpload(
  applicationId: string,
  file: File,
): Promise<SavedFile> {
  const dir = path.join(UPLOAD_ROOT, applicationId);
  await fs.mkdir(dir, { recursive: true });

  const safeName = sanitize(file.name);
  const storedPath = path.join(dir, `${Date.now()}-${safeName}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storedPath, buffer);

  return {
    originalName: file.name,
    storedPath,
    mimeType: file.type || "application/octet-stream",
    size: buffer.length,
  };
}

export function isAllowed(file: File): boolean {
  return ALLOWED_MIME.has(file.type) && file.size <= MAX_FILE_BYTES;
}
