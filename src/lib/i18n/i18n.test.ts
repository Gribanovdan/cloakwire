import { describe, it, expect, beforeEach } from "vitest";
import { getTranslation, detectInitialLocale, resolveKey } from "./i18n";
import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { zhCN } from "./locales/zh-CN";

describe("i18n engine", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(store)) {
      delete store[key];
    }
    // Mock localStorage in Node test environment
    (globalThis as any).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = String(v);
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const key of Object.keys(store)) {
          delete store[key];
        }
      },
    };
  });

  it("resolves english, russian and simplified chinese keys accurately", () => {
    expect(getTranslation("en", "common.connect")).toBe(en.common.connect);
    expect(getTranslation("ru", "common.connect")).toBe(ru.common.connect);
    expect(getTranslation("zh-CN", "common.connect")).toBe(zhCN.common.connect);
  });

  it("interpolates parameters inside translations", () => {
    expect(getTranslation("en", "servers.found", { count: 5 })).toBe("5 servers found");
    expect(getTranslation("ru", "servers.found", { count: 5 })).toBe("Найдено серверов: 5");
    expect(getTranslation("zh-CN", "servers.found", { count: 5 })).toBe("找到 5 个服务器");
  });

  it("falls back to English when a key is missing or empty in target locale", () => {
    const dummyLocales = {
      en: { test: { msg: "Hello English" } },
      ru: { test: { msg: "" } },
    };
    expect(resolveKey(dummyLocales as any, "ru", "test.msg")).toBe("Hello English");
    expect(resolveKey(dummyLocales as any, "zh-CN", "test.msg")).toBe("Hello English");
  });

  it("detects initial locale based on navigator.language", () => {
    expect(detectInitialLocale("ru-RU")).toBe("ru");
    expect(detectInitialLocale("ru")).toBe("ru");
    expect(detectInitialLocale("zh-CN")).toBe("zh-CN");
    expect(detectInitialLocale("zh-TW")).toBe("zh-CN");
    expect(detectInitialLocale("zh")).toBe("zh-CN");
    expect(detectInitialLocale("en-US")).toBe("en");
    expect(detectInitialLocale("de-DE")).toBe("en");
    expect(detectInitialLocale("fr-FR")).toBe("en");
    expect(detectInitialLocale("")).toBe("en");
  });

  it("persists and reads saved locale from localStorage", () => {
    localStorage.setItem("cloakwire:locale", "ru");
    expect(detectInitialLocale("en-US")).toBe("ru");

    localStorage.setItem("cloakwire:locale", "zh-CN");
    expect(detectInitialLocale("en-US")).toBe("zh-CN");
  });

  it("ensures all keys present in en.ts also exist in ru.ts and zh-CN.ts", () => {
    function getKeys(obj: any, prefix = ""): string[] {
      let keys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof v === "object" && v !== null) {
          keys = keys.concat(getKeys(v, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    }

    const enKeys = getKeys(en);
    const ruKeys = getKeys(ru);
    const zhKeys = getKeys(zhCN);

    const missingInRu = enKeys.filter((k) => !ruKeys.includes(k));
    const missingInZh = enKeys.filter((k) => !zhKeys.includes(k));

    expect(missingInRu).toEqual([]);
    expect(missingInZh).toEqual([]);
  });
});
