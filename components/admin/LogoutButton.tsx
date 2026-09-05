"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ lang, label }: { lang: string; label: string }) {
  const router = useRouter();
  const onClick = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace(`/${lang}/admin/login`);
    router.refresh();
  };
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:text-red-500"
    >
      <LogOut className="h-4 w-4" />
      {label}
    </button>
  );
}
