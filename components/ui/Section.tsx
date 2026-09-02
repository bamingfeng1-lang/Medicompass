import { clsx } from "clsx";

export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={clsx("py-20 sm:py-28", className)}>
      <div className="container-page">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  desc,
  center,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  desc?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "max-w-3xl",
        center && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-5 text-3xl font-bold tracking-tight text-brand-950 sm:text-4xl">
        {title}
      </h2>
      {desc && <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">{desc}</p>}
    </div>
  );
}
