"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";

export const DEFAULT_MAX_FILE_BYTES = 15 * 1024 * 1024;
export const IMAGE_PDF_ACCEPT = "application/pdf,image/*";

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Match a MIME type against an accept string ("application/pdf,image/*"). */
export function isAcceptedMime(mime: string, accept: string): boolean {
  const patterns = accept
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (patterns.length === 0) return true;
  return patterns.some((p) => {
    if (p.endsWith("/*")) return mime.startsWith(p.slice(0, -1)); // image/* -> image/
    return mime === p;
  });
}

export type DropzoneLabels = {
  cta: string;
  hint?: string;
  empty?: string;
  remove: string;
  fileTooLarge: string;
  fileTypeError: string;
};

/**
 * Shared multi-file attachment picker — the same UX as second-opinion/apply:
 * click or drag-and-drop to select several files at once, and you can open it
 * repeatedly to append more before submitting. Files are validated by size and
 * MIME, de-duplicated by name+size, and shown in a removable pending list.
 */
export function FileDropzone({
  files,
  onChange,
  labels,
  accept = IMAGE_PDF_ACCEPT,
  maxBytes = DEFAULT_MAX_FILE_BYTES,
  disabled = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  labels: DropzoneLabels;
  accept?: string;
  maxBytes?: number;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setError("");
    const next = [...files];
    for (const file of Array.from(list)) {
      if (file.size > maxBytes) {
        setError(`${labels.fileTooLarge}${file.name}`);
        continue;
      }
      if (!isAcceptedMime(file.type || "", accept)) {
        setError(`${labels.fileTypeError}${file.name}`);
        continue;
      }
      if (!next.some((x) => x.name === file.name && x.size === file.size)) {
        next.push(file);
      }
    }
    onChange(next);
    // Reset so the same file can be picked again / change event re-fires.
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (i: number) => {
    setError("");
    onChange(files.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        className={`mt-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 px-6 py-8 text-center transition ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-brand-deep hover:bg-brand-50"
        }`}
      >
        <Upload className="h-7 w-7 text-brand-deep" />
        <p className="mt-2 text-sm font-medium text-brand-deep">{labels.cta}</p>
        {labels.hint && <p className="mt-1 text-xs text-slate-500">{labels.hint}</p>}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          disabled={disabled}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {files.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
              <span className="flex-1 truncate text-sm text-slate-700">{file.name}</span>
              <span className="text-xs text-slate-400">{fmtSize(file.size)}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeFile(i)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-red-500 disabled:opacity-50"
                aria-label={labels.remove}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        labels.empty && <p className="mt-2 text-xs text-slate-400">{labels.empty}</p>
      )}
    </div>
  );
}
