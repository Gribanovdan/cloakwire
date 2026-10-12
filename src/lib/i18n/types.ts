export type Locale = "en" | "ru" | "zh-CN";

export interface LocaleOption {
  id: Locale;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { id: "en", label: "English", nativeLabel: "English" },
  { id: "ru", label: "Russian", nativeLabel: "Русский" },
  { id: "zh-CN", label: "Simplified Chinese", nativeLabel: "简体中文" },
];

export type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : `${K}`;
    }[keyof T & string]
  : never;
