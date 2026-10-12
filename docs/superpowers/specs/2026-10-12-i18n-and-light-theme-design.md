# Cloakwire: Localization (i18n) & Light Theme Design

**Date:** 2026-10-12  
**Status:** Approved  
**Author:** Antigravity  

## 1. Overview & Objectives

This design addresses user feature requests for:
1. **Multilingual Localization (i18n):** Support for English (`en`, default/fallback), Russian (`ru`), and Simplified Chinese (`zh-CN`) across desktop and mobile user interfaces.
2. **Light & Dark Theme Engine:** Support for Light mode alongside existing Dark and OLED modes, with automatic System preference detection (`prefers-color-scheme`), while preserving all 5 dynamic accent themes (`emerald`, `cyan`, `violet`, `amber`, `rose`).

These features are decomposed into two consecutive, independently testable phases:
- **Phase 1: Sub-project 1 — Localization Subsystem (i18n)**
- **Phase 2: Sub-project 2 — Light Theme & Mode Engine**

---

## 2. Phase 1: Localization Subsystem (`i18n`)

### 2.1 Design Principles
- **Zero Runtime Dependencies:** No external heavy packages (`i18next`, etc.). A lightweight, bespoke React Context and hook implemented in pure TypeScript.
- **Strict Type Safety:** Translations dictionary schema is inferred from `en.ts`. Any missing keys in `ru.ts` or `zh-CN.ts` are detected at compile-time or safely fall back to `en.ts` at runtime.
- **Reactive & Persistent:** Language preference is stored in `localStorage` (`cloakwire:locale`) and immediately reactive across the application without requiring an app reload.
- **Smart Initial Detection:** On fresh installs (no saved preference), `navigator.language` is evaluated:
  - Prefix `zh` (e.g. `zh-CN`, `zh-SG`, `zh-HK`, `zh-TW`) $\rightarrow$ `zh-CN`.
  - Prefix `ru` (e.g. `ru-RU`, `ru-BY`, `ru-KZ`) $\rightarrow$ `ru`.
  - Otherwise $\rightarrow$ `en`.

### 2.2 Module Architecture

```
src/lib/i18n/
├── types.ts          # Supported locales, nested key paths, schema types
├── locales/
│   ├── en.ts         # English reference dictionary (source of truth)
│   ├── ru.ts         # Russian translation
│   └── zh-CN.ts      # Simplified Chinese translation
├── i18n.ts           # Core translation helper, dot-notation resolver, interpolation
├── I18nContext.tsx   # React Provider and useI18n hook
└── i18n.test.ts      # Unit tests for translation, interpolation, fallback, and storage
```

### 2.3 Key Namespaces

The dictionary is organized into intuitive, semantic namespaces:
- `common`: Generic action words (`connect`, `disconnect`, `connecting`, `save`, `cancel`, `delete`, `edit`, `copy`, `copied`, `search`, `loading`, `error`, `version`, `status`).
- `nav`: Tab/screen names (`home`, `servers`, `routing`, `logs`, `settings`, `config`).
- `home`: Bento home screen widgets (`traffic`, `upload`, `download`, `activeProfile`, `quickConnect`, `uptime`, `proxyMode`, `systemProxy`, `tunMode`, `directMode`, `ping`, `ipInfo`).
- `servers`: Server list, subscription cards, manual profiles, ping tests, groups (`all`, `proxies`, `subscriptions`, `addServer`, `addSubscription`, `testLatency`, `noServers`).
- `routing`: Routing rules, presets, process picker, domains, outbound detours (`bypassDirect`, `proxyAll`, `ruleList`, `customRules`, `addRule`).
- `logs`: Log viewer, levels (`all`, `info`, `warn`, `error`), clear logs, auto-scroll.
- `settings`: Application configuration, accent theme, theme mode, language selector, startup options, autoupdate.

### 2.4 Interpolation & Fallback Mechanics
- Dot-notation access: `t("home.status.connected")`.
- Parametric interpolation: `t("servers.found", { count: 12 })` replaces `{count}` with `12`.
- Fallback resolution: If `translations[currentLocale][key]` is undefined or empty, the key is resolved from `translations["en"][key]`.

### 2.5 UI Switcher Placement
- **Desktop:** Placed in the settings/configuration tab (`ConfigTab.tsx` / Settings view).
- **Mobile:** Placed in `SettingsScreen.tsx` under a new "Language / Язык / 语言" card row with a selection sheet or segmented picker.

---

## 3. Phase 2: Light Theme & Mode Engine

### 3.1 Design Principles
- **Theme Modes:**
  - `system`: Tracks OS preference via `window.matchMedia('(prefers-color-scheme: dark)')`.
  - `dark`: Cloakwire's classic dark Bento styling (`#07080c` / zinc-950).
  - `light`: Clean, high-contrast light Bento styling (clean whites, subtle borders, crisp typography).
  - `oled`: Pitch-black AMOLED mode (`#000000`).
- **Cohesion with Accents:** The 5 accent themes (`emerald`, `cyan`, `violet`, `amber`, `rose`) adapt their text contrast and ambient glows for light backgrounds so badges and text remain perfectly readable.

### 3.2 Module Architecture

```
src/lib/themeMode.ts       # ThemeMode ('system' | 'light' | 'dark' | 'oled'), storage, mediaQuery listener
src/lib/themeMode.test.ts  # ThemeMode unit tests
src/index.css              # Refined light tokens, bento card backgrounds, scrollbars
```

### 3.3 CSS Token Harmonization

In `src/index.css`:
- Light mode tokens (`:root` when not `.dark`):
  - `--background`: `0 0% 98%` (`#fafafa` / `#f4f4f5`)
  - `--foreground`: `240 10% 3.9%` (`#09090b`)
  - `--card`: `0 0% 100%` (`#ffffff`)
  - `--border`: `240 5.9% 88%`
  - `--muted`: `240 4.8% 95%`
  - `--muted-foreground`: `240 3.8% 46.1%`
- Bento cards in light mode:
  - `.bento-card`: Pure white background with subtle shadow `box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)` and border `border: 1px solid rgba(0, 0, 0, 0.08)`.
  - `.bento-card-subtle`: Subtle grey fill (`rgba(244, 244, 245, 0.7)`).
- Replace hardcoded dark utility classes (`bg-[#07080c]`, `text-zinc-400`, `border-white/10`) with semantic Tailwind tokens (`bg-background`, `bg-card`, `text-muted-foreground`, `border-border`).

### 3.4 Switcher Placement
- Integrated into `AccentThemePicker.tsx` on Desktop:
  - Theme mode selector: `System`, `Light`, `Dark`, `OLED`.
  - Accent color picker: `Emerald`, `Cyan`, `Violet`, `Amber`, `Rose`.
- Integrated into `SettingsScreen.tsx` on Mobile:
  - Theme mode segmented picker row.
  - Accent picker row.

---

## 4. Verification & Testing

1. **Unit Tests:**
   - Vitest suite for `i18n.test.ts`:
     - Verification of all translation keys across `en`, `ru`, `zh-CN`.
     - Verification of key interpolation.
     - Verification of fallback to English on missing keys.
     - Verification of `navigator.language` parsing logic.
   - Vitest suite for `themeMode.test.ts`:
     - Switching between `light`, `dark`, `oled`, `system`.
     - HTML root class updates (`light`, `dark`, `oled`).
     - LocalStorage persistence.
2. **Regression Testing:**
   - Run `npm test` to ensure all existing frontend tests continue to pass.
   - Run `cargo test --lib` to ensure no backend regressions.
3. **Build Testing:**
   - `npm run build` (`tsc -b && vite build`) passes with zero TypeScript or packaging errors.
