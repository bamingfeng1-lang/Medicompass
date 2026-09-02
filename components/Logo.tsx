import { BRAND } from "@/lib/brand";
import { clsx } from "clsx";

type LogoProps = {
  variant?: "full" | "mark";
  className?: string;
  /** Use light text for dark backgrounds */
  invert?: boolean;
};

/**
 * Medicompass logo — a compass needle fused with a medical pulse line.
 * Compass = cross-border navigation; pulse + the "M" needle = medical care.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Medicompass"
    >
      <defs>
        <linearGradient id="mc-grad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor={BRAND.colors.sky} />
          <stop offset="1" stopColor={BRAND.colors.deep} />
        </linearGradient>
      </defs>
      {/* outer compass ring */}
      <circle cx="24" cy="24" r="21" stroke="url(#mc-grad)" strokeWidth="2.5" />
      {/* compass needle (points N-E) */}
      <path
        d="M24 8 L31 24 L24 40 L17 24 Z"
        fill="url(#mc-grad)"
        opacity="0.18"
      />
      <path d="M24 8 L31 24 L24 24 Z" fill={BRAND.colors.deep} />
      <path d="M24 40 L17 24 L24 24 Z" fill={BRAND.colors.sky} />
      {/* pulse line across the center — vital-sign green, distinct from the blue compass */}
      <path
        d="M9 24 H18 L21 18 L25 30 L28 24 H39"
        stroke={BRAND.colors.vital}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="2.6" fill={BRAND.colors.vital} />
    </svg>
  );
}

export function Logo({ variant = "full", className, invert = false }: LogoProps) {
  if (variant === "mark") {
    return <LogoMark className={clsx("h-9 w-9", className)} />;
  }
  return (
    <span className={clsx("flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className={clsx(
            "text-lg font-bold tracking-tight",
            invert ? "text-white" : "text-brand-950"
          )}
        >
          Medi<span className={invert ? "text-brand-sky" : "text-brand-deep"}>compass</span>
        </span>
        <span
          className={clsx(
            "mt-0.5 text-[11px] font-medium tracking-[0.35em]",
            invert ? "text-white/70" : "text-brand-gray"
          )}
        >
          迈蒂康
        </span>
      </span>
    </span>
  );
}
