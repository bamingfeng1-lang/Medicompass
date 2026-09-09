"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, LogOut, ChevronDown, LayoutDashboard, KeyRound } from "lucide-react";
import { clientApi } from "@/lib/api";

export function AdminMenu({
  lang,
  username,
  consoleLabel,
  logoutLabel,
  changePasswordLabel,
}: {
  lang: string;
  username: string;
  consoleLabel: string;
  logoutLabel: string;
  changePasswordLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const onLogout = async () => {
    await fetch(clientApi("/api/admin/logout"), { method: "POST", credentials: "include" });
    setOpen(false);
    router.replace(`/${lang}`);
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-2 text-sm font-medium text-brand-deep transition hover:bg-brand-100"
      >
        <ShieldCheck className="h-4 w-4" />
        <span className="max-w-[10rem] truncate">{username}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 w-44 pt-2">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-2 shadow-soft">
            <Link
              href={`/${lang}/admin`}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-deep"
            >
              <LayoutDashboard className="h-4 w-4" />
              {consoleLabel}
            </Link>
            {changePasswordLabel && (
              <Link
                href={`/${lang}/admin/password`}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-deep"
              >
                <KeyRound className="h-4 w-4" />
                {changePasswordLabel}
              </Link>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-red-50 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
              {logoutLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
