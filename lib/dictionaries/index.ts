import type { Locale } from "@/lib/brand";
import { zh, type Dictionary } from "./zh";
import { en } from "./en";

const dictionaries: Record<Locale, Dictionary> = { zh, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? zh;
}

export type { Dictionary };
