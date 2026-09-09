import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LOCALES, isLocale, type Locale } from "@/lib/brand";
import { getDictionary } from "@/lib/dictionaries";
import { getCurrentUser, getCurrentAdmin } from "@/lib/api";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// Reads the session cookie via /api/auth/me, so render per-request.
export const dynamic = "force-dynamic";

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const dict = getDictionary(lang);
  const [user, admin] = await Promise.all([getCurrentUser(), getCurrentAdmin()]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar lang={lang} dict={dict} user={user} admin={admin} />
      <main className="flex-1">{children}</main>
      <Footer lang={lang} dict={dict} />
    </div>
  );
}
