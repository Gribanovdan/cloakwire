import { useState, useEffect } from "react";
import { applyAccentTheme, loadSavedAccent } from "./accentTheme";

export type ThemeMode = "system" | "light" | "dark" | "oled";

export const THEME_MODES: { id: ThemeMode; labelKey: string }[] = [
  { id: "system", labelKey: "settings.systemTheme" },
  { id: "light", labelKey: "settings.lightTheme" },
  { id: "dark", labelKey: "settings.darkTheme" },
  { id: "oled", labelKey: "settings.oledTheme" },
];

export const THEME_MODE_STORAGE_KEY = "cloakwire:theme-mode";

let systemMediaListener: ((e: MediaQueryListEvent) => void) | null = null;
let currentMediaQueryList: MediaQueryList | null = null;

export function loadSavedThemeMode(): ThemeMode {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "oled" || saved === "system") {
        return saved;
      }
      if (localStorage.getItem("cloakwire:oled") === "1") {
        return "oled";
      }
    }
  } catch {
    // fallback
  }
  return "system";
}

function resolveSystemTheme(): "dark" | "light" {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
}

function applyEffectiveClasses(root: HTMLElement, effective: "light" | "dark" | "oled"): void {
  root.setAttribute("data-theme-mode", effective);
  if (effective === "light") {
    root.classList.remove("dark", "oled");
    root.classList.add("light");
  } else if (effective === "dark") {
    root.classList.remove("light", "oled");
    root.classList.add("dark");
  } else if (effective === "oled") {
    root.classList.remove("light");
    root.classList.add("dark", "oled");
  }
}

export function applyThemeMode(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Persist choice
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
      localStorage.setItem("cloakwire:oled", mode === "oled" ? "1" : "0");
    }
  } catch {
    // ignore
  }

  // Detach prior media query listener if any
  if (currentMediaQueryList && systemMediaListener) {
    if (typeof currentMediaQueryList.removeEventListener === "function") {
      currentMediaQueryList.removeEventListener("change", systemMediaListener);
    } else if (typeof (currentMediaQueryList as unknown as { removeListener: (fn: unknown) => void }).removeListener === "function") {
      (currentMediaQueryList as unknown as { removeListener: (fn: unknown) => void }).removeListener(systemMediaListener);
    }
    systemMediaListener = null;
    currentMediaQueryList = null;
  }

  let effective: "light" | "dark" | "oled" = "dark";

  if (mode === "system") {
    const sys = resolveSystemTheme();
    effective = sys;

    // Attach listener for real-time OS theme switching
    if (typeof window !== "undefined" && window.matchMedia) {
      currentMediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
      systemMediaListener = (e: MediaQueryListEvent) => {
        const nextSys = e.matches ? "dark" : "light";
        applyEffectiveClasses(root, nextSys);
      };
      if (typeof currentMediaQueryList.addEventListener === "function") {
        currentMediaQueryList.addEventListener("change", systemMediaListener);
      } else if (typeof (currentMediaQueryList as unknown as { addListener: (fn: unknown) => void }).addListener === "function") {
        (currentMediaQueryList as unknown as { addListener: (fn: unknown) => void }).addListener(systemMediaListener);
      }
    }
  } else {
    effective = mode;
  }

  applyEffectiveClasses(root, effective);

  // Sync with accentTheme & OLED attribute
  const isOled = effective === "oled";
  applyAccentTheme(loadSavedAccent(), isOled);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("cloakwire:theme-mode-changed", {
        detail: { mode, effective },
      })
    );
  }
}

export function useThemeMode(): {
  mode: ThemeMode;
  setMode: (nextMode: ThemeMode) => void;
} {
  const [mode, setModeState] = useState<ThemeMode>(loadSavedThemeMode);

  useEffect(() => {
    const onThemeChange = (e: Event) => {
      const custom = e as CustomEvent<{ mode: ThemeMode }>;
      if (custom.detail?.mode) {
        setModeState(custom.detail.mode);
      }
    };

    window.addEventListener("cloakwire:theme-mode-changed", onThemeChange);
    return () => {
      window.removeEventListener("cloakwire:theme-mode-changed", onThemeChange);
    };
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    applyThemeMode(next);
  };

  return { mode, setMode };
}

// Auto-apply on load
if (typeof window !== "undefined") {
  applyThemeMode(loadSavedThemeMode());
}
