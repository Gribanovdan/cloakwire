import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { Locale } from "./types";
import { detectInitialLocale, getTranslation, LOCALE_STORAGE_KEY } from "./i18n";

interface I18nContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale());

  const setLocale = useCallback((newLoc: Locale) => {
    setLocaleState(newLoc);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLoc);
      }
    } catch {
      // storage unavailable
    }
  }, []);

  useEffect(() => {
    // Keep html lang attribute in sync
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return getTranslation(locale, key, params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Graceful fallback outside Provider (e.g. tests or isolated components)
    return {
      locale: "en",
      setLocale: () => {},
      t: (key: string, params?: Record<string, string | number>) => getTranslation("en", key, params),
    };
  }
  return ctx;
}
