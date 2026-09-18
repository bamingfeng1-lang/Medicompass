"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

const STORAGE_KEY = "mc_cookie_consent";
// "accepted" | "declined" — if present, banner is hidden.

export function CookieConsent({ dict }: { dict: Dictionary }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show the banner if the user hasn't made a choice yet.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setShow(true);
    } catch {
      // localStorage unavailable — show banner anyway.
      setShow(true);
    }
  }, []);

  const handleChoice = (choice: "accepted" | "declined") => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    setShow(false);
  };

  if (!show) return null;

  const t = dict.cookieConsent;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[60] animate-slide-up bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="container-page flex flex-col items-center gap-4 py-4 sm:flex-row sm:gap-6 sm:py-5">
        {/* Icon + message */}
        <div className="flex flex-1 items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-brand-deep" />
          <p className="text-sm leading-relaxed text-slate-600">
            {t.message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2.5">
          <button
            onClick={() => handleChoice("declined")}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {t.decline}
          </button>
          <button
            onClick={() => handleChoice("accepted")}
            className="btn-primary text-xs"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}