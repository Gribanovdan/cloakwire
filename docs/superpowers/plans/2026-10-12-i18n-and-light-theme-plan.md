# Cloakwire: Localization (i18n) & Light Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement multilingual localization (`en`, `ru`, `zh-CN`) and adaptive light theme support (System, Light, Dark, OLED) with high-contrast accent color styling across Cloakwire's desktop and mobile interfaces.

**Architecture:** Bespoke zero-dependency typed React i18n engine (`src/lib/i18n/`) with persistent language selection and automatic OS detection; paired with an adaptive theme mode manager (`src/lib/themeMode.ts`) harmonizing Tailwind CSS design tokens and bento card styles for both dark and light palettes.

**Tech Stack:** TypeScript, React 18, Tailwind CSS, Vitest, Tauri v2.

**Spec:** `docs/superpowers/specs/2026-10-12-i18n-and-light-theme-design.md`

## Global Constraints

- Zero runtime npm dependencies added: no `i18next` or heavyweight bundles; strictly pure TypeScript.
- Strict fallback to English (`en`) for any undefined or empty translation keys.
- Preserve all existing functionality: OLED pitch-black mode, all 5 dynamic accents (`emerald`, `cyan`, `violet`, `amber`, `rose`), Android home widget communication, auto-reconnect, and traffic telemetry.
- All existing tests in `npm test` and `cargo test --lib` must continue to pass.
- `npm run build` (`tsc -b && vite build`) must succeed with zero TypeScript or packaging errors.

---

### Task 1: Core i18n Engine & Locale Dictionaries

**Files:**
- Create: `src/lib/i18n/types.ts`
- Create: `src/lib/i18n/locales/en.ts`
- Create: `src/lib/i18n/locales/ru.ts`
- Create: `src/lib/i18n/locales/zh-CN.ts`
- Create: `src/lib/i18n/i18n.ts`
- Create: `src/lib/i18n/I18nContext.tsx`
- Create: `src/lib/i18n/index.ts`
- Create: `src/lib/i18n/i18n.test.ts`

**Interfaces:**
- Produces:
  - `type Locale = 'en' | 'ru' | 'zh-CN'`
  - `detectInitialLocale(): Locale`
  - `getTranslation(locale: Locale, key: string, params?: Record<string, string | number>): string`
  - `useI18n(): { locale: Locale, setLocale: (loc: Locale) => void, t: (key: string, params?: Record<string, string | number>) => string }`
  - `<I18nProvider>`

- [ ] **Step 1: Write failing tests for i18n engine**

Create `src/lib/i18n/i18n.test.ts`:
- Test string resolution for `en`, `ru`, and `zh-CN`.
- Test parameter interpolation: `t("servers.found", { count: 5 })` -> `"5 servers found"` / `"Найдено серверов: 5"`.
- Test fallback to English when a key is absent or empty in Russian/Chinese.
- Test `detectInitialLocale` behavior with `zh`, `ru`, and `en` navigator language values.
- Test persistence in `localStorage`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/i18n/i18n.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement types, dictionaries, engine, and context**

Implement:
- `src/lib/i18n/types.ts`: `Locale`, `TranslationDictionary`, `NestedKeyOf`.
- `src/lib/i18n/locales/en.ts`: Complete English dictionary with `common`, `nav`, `home`, `servers`, `routing`, `logs`, `settings`.
- `src/lib/i18n/locales/ru.ts`: Complete Russian translations matching `en.ts`.
- `src/lib/i18n/locales/zh-CN.ts`: Complete Simplified Chinese translations matching `en.ts`.
- `src/lib/i18n/i18n.ts`: `resolveKey`, `interpolate`, `detectInitialLocale`.
- `src/lib/i18n/I18nContext.tsx`: `I18nProvider`, `useI18n`.
- `src/lib/i18n/index.ts`: Public exports.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/i18n/i18n.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/
git commit -m "feat(i18n): implement zero-dependency typed localization engine with en, ru, and zh-CN"
```

---

### Task 2: Desktop UI Localization

**Files:**
- Modify: `src/main.tsx` (wrap root in `<I18nProvider>`)
- Modify: `src/App.tsx` (navigation bar, title, update banners)
- Modify: `src/components/HomeTab.tsx` (connection status, quick connect, telemetry, IP info, ping)
- Modify: `src/components/ServersTab.tsx` and subcomponents (`SubscriptionsCard.tsx`, `ProxiesCard.tsx`, `SubscriptionIdentityCard.tsx`)
- Modify: `src/components/routing/RoutingTab.tsx` (rules, detours, presets, custom rules)
- Modify: `src/components/LogsTab.tsx` (filters, actions, status)
- Modify: `src/components/ConfigTab.tsx` (add Language selector: English / Русский / 简体中文)

**Interfaces:**
- Consumes: `useI18n()` from `src/lib/i18n`

- [ ] **Step 1: Wrap root in I18nProvider**
In `src/main.tsx`, wrap the application in `<I18nProvider>`.

- [ ] **Step 2: Localize Desktop Tab Components**
Replace hardcoded English strings with `t(...)` across:
- `HomeTab.tsx`: "Connected", "Disconnected", "Connecting", "Quick Connect", "Traffic", "Upload", "Download", "Ping", "IP Address", etc.
- `ServersTab.tsx`, `SubscriptionsCard.tsx`, `ProxiesCard.tsx`: "Servers", "Subscriptions", "Update All", "Latency", "No servers found", etc.
- `RoutingTab.tsx`: "Routing Rules", "Direct", "Proxy", "Block", "Add Rule", "Process", etc.
- `LogsTab.tsx`: "Logs", "Clear", "Auto-scroll", "Level", etc.
- `ConfigTab.tsx`: Add Language selection card allowing users to choose English, Русский, or 简体中文.

- [ ] **Step 3: Run existing desktop tests and typecheck**
Run: `npm test` and `npm run build`
Expected: All tests pass, build succeeds.

- [ ] **Step 4: Commit**
```bash
git add src/main.tsx src/App.tsx src/components/
git commit -m "feat(desktop): localize tabs and add language switcher to settings"
```

---

### Task 3: Mobile UI Localization

**Files:**
- Modify: `src/mobile/MobileApp.tsx` (bottom navigation, sheets)
- Modify: `src/mobile/screens/HomeScreen.tsx` (connection button, status pill, active server card, traffic stream)
- Modify: `src/mobile/screens/ServersScreen.tsx` (subscriptions, servers, ping test, grouping)
- Modify: `src/mobile/screens/RoutingScreen.tsx` (mode selector, rules, domain routing)
- Modify: `src/mobile/screens/LogsScreen.tsx` (log list, search, clear)
- Modify: `src/mobile/screens/SettingsScreen.tsx` (add Language selector row with sheet/picker)
- Modify: `src/mobile/components/AddSubscriptionSheet.tsx` & `ConfirmDialog.tsx`

**Interfaces:**
- Consumes: `useI18n()` from `src/lib/i18n`

- [ ] **Step 1: Localize Mobile Navigation and Screens**
Replace hardcoded strings with `t(...)` across all mobile screens:
- Bottom nav items ("Home", "Servers", "Routing", "Logs", "Settings").
- `HomeScreen.tsx`: Tap to connect, Connected, Disconnected, Reconnecting, Ping, Traffic.
- `ServersScreen.tsx`: Add Subscription, Paste from clipboard, Test latency, etc.
- `SettingsScreen.tsx`: Add "Language" row showing current language and opening a selection sheet (`English`, `Русский`, `简体中文`).
- Sheets & Dialogs: `AddSubscriptionSheet.tsx`, `ConfirmDialog.tsx`.

- [ ] **Step 2: Run mobile tests and verify build**
Run: `npm test` and `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/mobile/
git commit -m "feat(mobile): localize screens and add language picker in settings"
```

---

### Task 4: Theme Mode Core Engine (`themeMode.ts`)

**Files:**
- Create: `src/lib/themeMode.ts`
- Create: `src/lib/themeMode.test.ts`
- Modify: `src/lib/accentTheme.ts`
- Modify: `index.html`

**Interfaces:**
- Produces:
  - `type ThemeMode = 'system' | 'light' | 'dark' | 'oled'`
  - `loadSavedThemeMode(): ThemeMode`
  - `applyThemeMode(mode: ThemeMode): void`
  - `useThemeMode(): { mode: ThemeMode, setMode: (m: ThemeMode) => void }`

- [ ] **Step 1: Write failing tests for theme mode manager**
Create `src/lib/themeMode.test.ts`:
- Test setting mode to `'light'`, `'dark'`, `'oled'`, `'system'`.
- Verify HTML class changes (`dark`, `light`, `oled`).
- Verify persistence to `localStorage.getItem("cloakwire:theme-mode")`.
- Verify listener for `(prefers-color-scheme: dark)`.

- [ ] **Step 2: Run test to verify it fails**
Run: `npx vitest run src/lib/themeMode.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement themeMode.ts**
Implement `src/lib/themeMode.ts`:
- Handle root classes:
  - When `light`: remove `dark` and `oled`, add `light`.
  - When `dark`: remove `light` and `oled`, add `dark`.
  - When `oled`: add `dark` and `oled`, remove `light`.
  - When `system`: evaluate matchMedia and apply either `light` or `dark`, and register listener for dynamic changes.
- Update `index.html` to remove static hardcoded `class="dark"` so `themeMode.ts` initializes cleanly without flashing.
- Interop with `accentTheme.ts`.

- [ ] **Step 4: Run test to verify it passes**
Run: `npx vitest run src/lib/themeMode.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/themeMode.ts src/lib/themeMode.test.ts src/lib/accentTheme.ts index.html
git commit -m "feat(theme): implement adaptive ThemeMode engine supporting system, light, dark, and oled"
```

---

### Task 5: CSS Design Tokens & Component Styling Adaptation for Light Mode

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/Card.tsx`, `src/components/Button.tsx`, `src/components/Badge.tsx`
- Modify: `src/components/AccentThemePicker.tsx`
- Modify: `src/mobile/screens/SettingsScreen.tsx`

**Interfaces:**
- Consumes: `themeMode.ts`

- [ ] **Step 1: Refine CSS Variables and Bento Styles in src/index.css**
In `src/index.css`:
- Ensure `:root` (light mode) has high-contrast variables:
  - `--background`: pure clean light grey/white (`#f8fafc` / `#ffffff`).
  - `--card`: `#ffffff` with subtle borders (`rgba(0, 0, 0, 0.08)`).
  - `--foreground`: `#0f172a`.
  - `--muted-foreground`: `#64748b`.
- Update `.bento-card` and `.bento-card-subtle`:
  - In light mode (`html:not(.dark)`): crisp white backgrounds with soft elevation shadows and light grey border lines.
  - In dark mode: existing sleek gradient dark bento styling.
  - In oled mode: existing pitch-black `#000000` styling.
- Ensure all 5 accents (`emerald`, `cyan`, `violet`, `amber`, `rose`) maintain WCAG contrast in light mode:
  - Accent badge text and borders adjusted for light mode legibility.

- [ ] **Step 2: Add Theme Mode Pickers to Desktop and Mobile Settings**
- Desktop: In `AccentThemePicker.tsx`, add a segmented control or toggle for Theme Mode (`System`, `Light`, `Dark`, `OLED`) alongside the Accent colors.
- Mobile: In `SettingsScreen.tsx`, add Theme Mode selector row.

- [ ] **Step 3: Audit and adapt hardcoded dark classes across Desktop and Mobile**
Replace hardcoded `bg-[#07080c]`, `text-zinc-400`, `border-white/10` with semantic classes (`bg-background`, `bg-card`, `text-muted-foreground`, `border-border`).

- [ ] **Step 4: Run tests and build**
Run: `npm test` and `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/index.css src/components/ src/mobile/
git commit -m "feat(theme): add light mode styles, semantic tokens, and theme mode switchers"
```

---

### Task 6: Full Verification & Build Testing

**Files:**
- Whole repository

- [ ] **Step 1: Run complete frontend test suite**
Run: `npm test`
Expected: All 50+ unit tests pass.

- [ ] **Step 2: Run Rust library test suite**
Run: `$env:CLOAKWIRE_TEST_MANIFEST = "1"; & "$env:USERPROFILE\.cargo\bin\cargo.exe" test --lib`
Expected: All 260+ tests pass.

- [ ] **Step 3: Verify TypeScript and production bundle**
Run: `npm run build`
Expected: Clean compile, zero errors.

- [ ] **Step 4: Commit and finalize**
```bash
git status
git commit -m "chore: finalize i18n localization and light theme implementation" (if any uncommitted changes)
```
