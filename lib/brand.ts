export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export const BRAND = {
  nameEn: "Medicompass",
  nameZh: "迈蒂康",
  url: "medicomai.com",
  hq: { zh: "新加坡", en: "Singapore" },
  colors: {
    sky: "#87D2E7",
    light: "#A3D0E3",
    deep: "#1977C9",
    gray: "#808080",
    vital: "#10B981",
  },
} as const;
