import { notFound, redirect } from "next/navigation";
import { ClipboardList, FileText, IdCard } from "lucide-react";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUser } from "@/lib/api";
import { Sidebar, type SidebarItem } from "@/components/layout/Sidebar";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const t = getDictionary(lang);
  const sb = t.sidebar;
  const p = (path: string) => `/${lang}${path}`;

  const user = await getCurrentUser();
  if (!user) redirect(p("/login"));

  const isStaff = user.roles.includes("provider") || user.roles.includes("doctor");

  const items: SidebarItem[] = isStaff
    ? [
        { href: p("/account/assigned"), label: sb.myTasks, icon: <ClipboardList className="h-4 w-4" /> },
        { href: p("/account/profile"), label: sb.myProfile, icon: <IdCard className="h-4 w-4" /> },
      ]
    : [
        { href: p("/account/applications"), label: sb.myApplications, icon: <FileText className="h-4 w-4" /> },
      ];

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <div className="container-page flex flex-1 flex-col gap-6 pt-6 pb-16 sm:pt-8 sm:pb-20 lg:flex-row lg:gap-6">
        <Sidebar
          lang={lang}
          title={sb.accountTitle}
          items={items}
          logoutLabel={sb.logout}
          logoutKind="user"
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
