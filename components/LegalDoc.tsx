import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { BRAND } from "@/lib/brand";

/**
 * A self-contained, bilingual legal document shell used by the top-level
 * `/legal/*` pages (privacy policy, user agreement). These live OUTSIDE the
 * `[lang]` locale routing on purpose: the iOS app opens the fixed URLs
 * `medicomai.com/legal/privacy` and `/legal/terms` with no locale prefix, so
 * the document renders both 中文 and English in one page.
 *
 * The section bodies here are SKELETONS — placeholder clauses marked so the
 * legal team can drop in the formal, reviewed terms. Nothing here should be
 * treated as final legal text.
 */

export type LegalSection = {
  headingZh: string;
  headingEn: string;
  bodyZh: string[];
  bodyEn: string[];
};

export function LegalDoc({
  titleZh,
  titleEn,
  updated,
  sections,
}: {
  titleZh: string;
  titleEn: string;
  updated: string; // ISO date, e.g. "2026-09-27"
  sections: LegalSection[];
}) {
  return (
    <main className="bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-brand-50/40">
        <div className="container-page flex flex-col gap-4 py-10">
          <Link href="/" className="flex items-center gap-2 text-brand-deep">
            <LogoMark className="h-8 w-8" />
            <span className="text-lg font-bold text-brand-950">
              {BRAND.nameEn} {BRAND.nameZh}
            </span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">
              {titleZh}
            </h1>
            <p className="mt-1 text-lg font-medium text-slate-500">{titleEn}</p>
            <p className="mt-3 text-sm text-slate-500">
              最近更新 / Last updated: {updated}
            </p>
          </div>
        </div>
      </header>

      {/* Draft notice */}
      <div className="container-page pt-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900">
          <strong>草稿占位 / Draft placeholder：</strong>
          本页为条款骨架，正式内容以法务审定并发布的版本为准。
          This page is a skeleton; the binding text is the version finalized and
          published by the legal team.
        </div>
      </div>

      {/* Body */}
      <article className="container-page space-y-10 py-10">
        {sections.map((s, i) => (
          <section key={i} className="scroll-mt-24">
            <h2 className="text-xl font-bold text-brand-950">
              {i + 1}. {s.headingZh}
              <span className="ml-2 text-base font-medium text-slate-400">
                {s.headingEn}
              </span>
            </h2>
            <div className="mt-4 space-y-3">
              {s.bodyZh.map((p, j) => (
                <p
                  key={`zh-${j}`}
                  className="text-[15px] leading-relaxed text-slate-700"
                >
                  {p}
                </p>
              ))}
            </div>
            <div className="mt-4 space-y-3 border-l-2 border-slate-100 pl-4">
              {s.bodyEn.map((p, j) => (
                <p
                  key={`en-${j}`}
                  className="text-[15px] leading-relaxed text-slate-500"
                >
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}

        {/* Contact */}
        <section className="rounded-2xl bg-slate-50 p-6">
          <h2 className="text-lg font-bold text-brand-950">
            联系我们 <span className="text-base font-medium text-slate-400">Contact</span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            如对本文件有任何疑问，请联系 {BRAND.nameZh}（{BRAND.nameEn}）：
            <a href="mailto:privacy@medicomai.com" className="text-brand-deep">
              {" "}privacy@medicomai.com
            </a>
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
            For any questions about this document, contact {BRAND.nameEn} at{" "}
            <a href="mailto:privacy@medicomai.com" className="text-brand-deep">
              privacy@medicomai.com
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
