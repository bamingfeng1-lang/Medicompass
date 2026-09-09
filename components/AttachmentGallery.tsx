"use client";

import { useEffect, useState } from "react";
import { X, FileText, ChevronLeft, ChevronRight } from "lucide-react";

export type GalleryAttachment = {
  id: number;
  mimeType: string;
  originalName: string;
  size: number;
};

const IMAGE_RE = /^image\//;

function isImage(mime: string): boolean {
  return IMAGE_RE.test(mime);
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentGallery({
  attachments,
  urlPrefix,
  downloadLabel,
}: {
  attachments: GalleryAttachment[];
  urlPrefix: string;
  downloadLabel: string;
}) {
  const urlFor = (id: number) => `${urlPrefix}/${id}`;
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    if (current === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [current]);

  useEffect(() => {
    if (current === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCurrent(null);
      if (e.key === "ArrowLeft")
        setCurrent((i) => (i === null ? i : (i + attachments.length - 1) % attachments.length));
      if (e.key === "ArrowRight")
        setCurrent((i) => (i === null ? i : (i + 1) % attachments.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, attachments.length]);

  if (attachments.length === 0) return null;

  const active = current === null ? null : attachments[current];

  return (
    <div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {attachments.map((att, idx) => (
          <button
            key={att.id}
            type="button"
            onClick={() => setCurrent(idx)}
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 text-left transition hover:border-brand-deep"
          >
            {isImage(att.mimeType) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urlFor(att.id)}
                alt={att.originalName}
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-brand-deep">
                <FileText className="h-6 w-6" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-700 group-hover:text-brand-deep">
                {att.originalName}
              </span>
              <span className="block text-xs text-slate-400">{fmtSize(att.size)}</span>
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-slate-900/80 p-4 sm:p-8"
          onClick={() => setCurrent(null)}
        >
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 text-white">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white/90">{active.originalName}</p>
              <p className="text-xs text-white/60">{fmtSize(active.size)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={urlFor(active.id) + "?download=1"}
                onClick={(e) => e.stopPropagation()}
                className="rounded-full border border-white/30 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
              >
                {downloadLabel}
              </a>
              <button
                type="button"
                onClick={() => setCurrent(null)}
                className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                aria-label="close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            className="mx-auto mt-3 flex w-full max-w-4xl flex-1 items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {isImage(active.mimeType) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={urlFor(active.id)}
                alt={active.originalName}
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            ) : (
              <iframe
                src={urlFor(active.id)}
                className="h-full w-full rounded-lg border-0 bg-white"
                title={active.originalName}
              />
            )}
          </div>

          {attachments.length > 1 && (
            <>
              <button
                type="button"
                aria-label="previous"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent((current! - 1 + attachments.length) % attachments.length);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="next"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent((current! + 1) % attachments.length);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div
            className="mx-auto mt-3 flex w-full max-w-4xl gap-2 overflow-x-auto pb-1"
            onClick={(e) => e.stopPropagation()}
          >
            {attachments.map((att, idx) => (
              <button
                key={att.id}
                type="button"
                onClick={() => setCurrent(idx)}
                className={`shrink-0 rounded-lg border-2 p-0.5 transition ${
                  idx === current ? "border-brand-deep" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {isImage(att.mimeType) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={urlFor(att.id)}
                    alt={att.originalName}
                    className="h-12 w-16 rounded-md object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-16 items-center justify-center rounded-md bg-white text-slate-400">
                    <FileText className="h-5 w-5" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
