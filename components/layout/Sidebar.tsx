"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { clsx } from "clsx";
import { clientApi } from "@/lib/api";

export type SidebarItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Exact-match only (don't treat subpaths as active). */
  exact?: boolean;
};

export function Sidebar({
  lang,
  title,
  items,
  logoutLabel,
  logoutKind,
}: {
  lang: string;
  title: string;
  items: SidebarItem[];
  logoutLabel: string;
  logoutKind: "user" | "admin";
}) {
  const pathname = usePathname();
  const router = useRouter();

  const strip = (h: string) => h.replace(/^\/(zh|en)/, "") || "/";
  const current = strip(pathname);

  const isActive = (item: SidebarItem) => {
    const target = strip(item.href);
    if (item.exact) return current === target;
    return current === target || current.startsWith(target + "/");
  };

  const onLogout = async () => {
    const path = logoutKind === "admin" ? "/api/admin/logout" : "/api/auth/logout";
    await fetch(clientApi(path), { method: "POST", credentials: "include" });
    router.replace(logoutKind === "admin" ? `/${lang}/admin/login` : `/${lang}`);
    router.refresh();
  };

  return (
    <aside className="lg:w-40 lg:shrink-0">
      <div className="lg:sticky lg:top-24">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </p>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                "flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2.5 text-sm font-medium transition",
                isActive(it)
                  ? "bg-brand-50 text-brand-deep"
                  : "text-slate-600 hover:bg-slate-50 hover:text-brand-deep",
              )}
            >
              {it.icon}
              <span className="truncate">{it.label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={onLogout}
            className="mt-0 flex shrink-0 items-center gap-2 rounded-xl px-2.5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-500 lg:mt-2 lg:border-t lg:border-slate-100 lg:pt-4"
          >
            <LogOut className="h-4 w-4" />
            <span className="truncate">{logoutLabel}</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
