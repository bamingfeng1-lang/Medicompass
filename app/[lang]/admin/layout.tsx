import { notFound } from "next/navigation";
import { LayoutDashboard, ClipboardCheck, MessageSquare } from "lucide-react";
import { isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentAdmin } from "@/lib/api";
import { Sidebar, type SidebarItem } from "@/components/layout/Sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
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

  const admin = await getCurrentAdmin();
  // Not authenticated (e.g. the /admin/login page): render without the shell.
  if (!admin) return <>{children}</>;

  const items: SidebarItem[] = [
    { href: p("/admin"), label: sb.adminApplications, icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
    { href: p("/admin/registrations"), label: sb.adminRegistrations, icon: <ClipboardCheck className="h-4 w-4" /> },
    { href: p("/admin/inquiries"), label: sb.adminInquiries, icon: <MessageSquare className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-1 flex-col bg-slate-50">
      <div className="container-page flex flex-1 flex-col gap-6 pt-6 pb-16 sm:pt-8 sm:pb-20 lg:flex-row lg:gap-6">
        <Sidebar
          lang={lang}
          title={sb.adminTitle}
          items={items}
          logoutLabel={sb.logout}
          logoutKind="admin"
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
