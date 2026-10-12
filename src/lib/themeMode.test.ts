import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ThemeMode,
  loadSavedThemeMode,
  applyThemeMode,
  THEME_MODE_STORAGE_KEY,
} from "./themeMode";

describe("themeMode", () => {
  let mockStore: Record<string, string> = {};
  let rootClasses: Set<string>;
  let mockMatchMediaMatches = false;

  beforeEach(() => {
    mockStore = {};
    rootClasses = new Set<string>();

    const mockElement = {
      classList: {
        add: vi.fn((cls: string) => rootClasses.add(cls)),
        remove: vi.fn((cls: string) => rootClasses.delete(cls)),
        contains: vi.fn((cls: string) => rootClasses.has(cls)),
      },
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      style: {
        setProperty: vi.fn(),
      },
    };

    // @ts-expect-error mock document
    globalThis.document = {
      documentElement: mockElement as unknown as HTMLElement,
    };

    // @ts-expect-error mock localStorage
    globalThis.localStorage = {
      getItem: vi.fn((key: string) => mockStore[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        mockStore[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStore[key];
      }),
      clear: vi.fn(() => {
        mockStore = {};
      }),
    };

    // @ts-expect-error mock window
    globalThis.window = {
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: mockMatchMediaMatches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
      dispatchEvent: vi.fn(),
    };
  });

  it("defaults to system when no saved theme mode", () => {
    expect(loadSavedThemeMode()).toBe("system");
  });

  it("loads valid saved theme modes", () => {
    mockStore[THEME_MODE_STORAGE_KEY] = "light";
    expect(loadSavedThemeMode()).toBe("light");

    mockStore[THEME_MODE_STORAGE_KEY] = "dark";
    expect(loadSavedThemeMode()).toBe("dark");

    mockStore[THEME_MODE_STORAGE_KEY] = "oled";
    expect(loadSavedThemeMode()).toBe("oled");

    mockStore[THEME_MODE_STORAGE_KEY] = "system";
    expect(loadSavedThemeMode()).toBe("system");

    // Invalid values fallback to system
    mockStore[THEME_MODE_STORAGE_KEY] = "invalid_mode";
    expect(loadSavedThemeMode()).toBe("system");
  });

  it("applies light theme correctly", () => {
    rootClasses.add("dark");
    applyThemeMode("light");

    expect(rootClasses.has("dark")).toBe(false);
    expect(rootClasses.has("oled")).toBe(false);
    expect(rootClasses.has("light")).toBe(true);
    expect(mockStore[THEME_MODE_STORAGE_KEY]).toBe("light");
  });

  it("applies dark theme correctly", () => {
    rootClasses.add("light");
    applyThemeMode("dark");

    expect(rootClasses.has("light")).toBe(false);
    expect(rootClasses.has("oled")).toBe(false);
    expect(rootClasses.has("dark")).toBe(true);
    expect(mockStore[THEME_MODE_STORAGE_KEY]).toBe("dark");
  });

  it("applies oled theme correctly", () => {
    applyThemeMode("oled");

    expect(rootClasses.has("light")).toBe(false);
    expect(rootClasses.has("dark")).toBe(true);
    expect(rootClasses.has("oled")).toBe(true);
    expect(mockStore[THEME_MODE_STORAGE_KEY]).toBe("oled");
  });

  it("applies system mode tracking dark media query", () => {
    mockMatchMediaMatches = true;
    applyThemeMode("system");

    expect(rootClasses.has("dark")).toBe(true);
    expect(rootClasses.has("light")).toBe(false);
    expect(mockStore[THEME_MODE_STORAGE_KEY]).toBe("system");
  });

  it("applies system mode tracking light media query", () => {
    mockMatchMediaMatches = false;
    applyThemeMode("system");

    expect(rootClasses.has("dark")).toBe(false);
    expect(rootClasses.has("light")).toBe(true);
    expect(mockStore[THEME_MODE_STORAGE_KEY]).toBe("system");
  });
});
