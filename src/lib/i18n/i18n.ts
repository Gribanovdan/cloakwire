import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { zhCN } from "./locales/zh-CN";
import type { Locale } from "./types";

export const LOCALES = {
  en,
  ru,
  "zh-CN": zhCN,
};

export const LOCALE_STORAGE_KEY = "cloakwire:locale";

export function detectInitialLocale(navLang?: string): Locale {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (saved === "en" || saved === "ru" || saved === "zh-CN") {
        return saved;
      }
    }
  } catch {
    // fallback
  }

  const lang = (navLang ?? (typeof navigator !== "undefined" ? navigator.language : "en")).toLowerCase();

  if (lang.startsWith("zh")) {
    return "zh-CN";
  }
  if (lang.startsWith("ru")) {
    return "ru";
  }
  return "en";
}

export function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return Object.entries(params).reduce((acc, [key, val]) => {
    return acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
  }, text);
}

export function resolveKey(
  dict: Record<string, any>,
  locale: Locale,
  path: string,
  params?: Record<string, string | number>
): string {
  const parts = path.split(".");

  function lookup(targetObj: any): any {
    if (!targetObj) return undefined;
    let curr = targetObj;
    for (const part of parts) {
      if (curr && typeof curr === "object" && part in curr) {
        curr = curr[part];
      } else {
        return undefined;
      }
    }
    return typeof curr === "string" ? curr : undefined;
  }

  // 1. Try target locale
  let result = lookup(dict[locale]);

  // 2. If not found or empty, fallback to English
  if (!result && dict["en"]) {
    result = lookup(dict["en"]);
  }

  // 3. Fallback to path itself if still not found
  const rawText = result || path;
  return interpolate(rawText, params);
}

export function getTranslation(
  locale: Locale,
  path: string,
  params?: Record<string, string | number>
): string {
  return resolveKey(LOCALES, locale, path, params);
}
