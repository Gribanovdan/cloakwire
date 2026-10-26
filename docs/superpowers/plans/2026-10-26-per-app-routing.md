# Per-Application Routing Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply local per-application routing to ready subscription configs, align app-mode behavior across platforms, expose Xray limitations, and build a Windows installer for testing.

**Architecture:** Keep provider configs as immutable base documents and apply a shared Rust runtime overlay. Reuse the existing sing-box route builder and Xray applicability translator; keep Android package capture in `VpnService` and desktop Xray on its stable system-proxy path.

**Tech Stack:** Rust, serde_json, Tauri 2, React/TypeScript, Kotlin/Android, Vitest, Cargo, Gradle, sing-box/Xray sidecars.

## Global Constraints

- Do not restore desktop Xray TUN or implement per-app DNS routing.
- Preserve provider sections and provider rule order; modify runtime copies only.
- Missing route targets must produce sanitized errors, never silent fallback.
- Empty or wholly invalid Android include lists must fail instead of capturing all apps.
- Do not commit code or push to GitHub before user testing; the already committed design document is the only commit in this stage.
- Work in `C:\Users\Public\cwdev\cloakwire-release-v132` and do not use subagents.

---

### Task 1: Shared ready sing-box routing overlay

**Files:**
- Create: `src-tauri/src/config/ready.rs`
- Modify: `src-tauri/src/config/mod.rs` (module export and `build_route` visibility)
- Test: `src-tauri/src/config/ready.rs` inline `#[cfg(test)]` module

**Interfaces:**
- Consumes: `GeneratorSettings`, `RoutingOptions`, `build_route(&GeneratorSettings) -> Value`, `AppResult<T>`.
- Produces: `pub fn merge_ready_routing(provider: Value, routing: &RoutingOptions) -> AppResult<Value>` for desktop and Android launchers.

- [ ] **Step 1: Write failing overlay tests**

Add tests with a provider containing `route.final = "providerProxy"`, two ordered provider rules, provider DNS/log sections, and outbounds tagged `providerProxy`, `direct`, and `block`. Use local direct/VPN process lists and one custom domain rule. Assert:

```rust
let merged = merge_ready_routing(provider, &routing).unwrap();
let rules = merged["route"]["rules"].as_array().unwrap();
assert_eq!(rules[0]["action"], json!("hijack-dns"));
assert!(rules.iter().any(|r| r["process_name"] == json!(["bank.exe"]) && r["outbound"] == "direct"));
assert!(rules.iter().any(|r| r["process_name"] == json!(["chat.exe"]) && r["outbound"] == "providerProxy"));
assert_eq!(rules[rules.len() - 2], provider_rules[0]);
assert_eq!(rules[rules.len() - 1], provider_rules[1]);
assert_eq!(merged["dns"], original["dns"]);
assert_eq!(merged["route"]["final"], json!("providerProxy"));
assert_eq!(merged["route"]["find_process"], json!(true));
```

Add a second test with an explicit `final_outbound = "missing"` and assert `AppError::UnsafeConfig` containing `missing` but no provider credentials. Add a rule-set test asserting local/provider sets are retained and duplicate tags are rejected.

- [ ] **Step 2: Run tests and verify failure**

Run: `cargo test config::ready --manifest-path src-tauri/Cargo.toml`
Expected: compilation failure because `config::ready` and `merge_ready_routing` do not exist.

- [ ] **Step 3: Implement the overlay**

In `config/mod.rs`, add `pub mod ready;` and change `fn build_route` to `pub(crate) fn build_route`.

Implement `ready.rs` with these exact operations:

```rust
pub fn merge_ready_routing(mut provider: Value, routing: &RoutingOptions) -> AppResult<Value> {
    let root = provider.as_object_mut().ok_or_else(|| AppError::UnsafeConfig("ready sing-box config must be an object".into()))?;
    let tags = outbound_tags(root)?;
    let provider_final = root.get("route").and_then(|r| r.get("final")).and_then(Value::as_str).map(str::to_owned);
    let proxy_target = resolve_proxy_target(&tags, provider_final.as_deref())?;
    let generated = build_route(&GeneratorSettings { routing: routing.clone(), ..GeneratorSettings::default() });
    let generated = rewrite_proxy_aliases(generated, &proxy_target);
    validate_local_targets(&generated, &tags)?;
    ensure_standard_outbounds(root, &generated)?;
    merge_route_documents(root, generated)?;
    Ok(provider)
}
```

`resolve_proxy_target` uses `proxy` when present; otherwise it uses an existing provider `final`; otherwise it returns `UnsafeConfig`. Rewrite only local `proxy`/`auto` aliases that are absent from provider outbounds. Add standard `direct`/`block` outbounds only when referenced and absent. Merge local rules before provider rules, merge rule-sets by unique tag, copy local route options, and retain unrelated provider keys. Add `rule-set-fetcher` to `http_clients` only when needed and absent.

- [ ] **Step 4: Run focused and existing config tests**

Run: `cargo test config:: --manifest-path src-tauri/Cargo.toml`
Expected: all new overlay tests and existing config tests PASS.

### Task 2: Use the overlay in every desktop ready sing-box launch

**Files:**
- Modify: `src-tauri/src/commands.rs:220-359,462-563`
- Test: `src-tauri/src/commands.rs` inline tests for `prepare_ready_singbox_config`

**Interfaces:**
- Consumes: `merge_ready_routing(provider, &RoutingOptions)`.
- Produces: `fn prepare_ready_singbox_config(profile: &ResolvedChildProfile, routing: &RoutingOptions) -> AppResult<Value>` and `start_resolved_singbox_profile(..., routing: &RoutingOptions)` with identical behavior in both managed launch branches.

- [ ] **Step 1: Add a failing preparation regression test**

Add `prepare_ready_singbox_config` as the pure preparation boundary and test that a ready sing-box profile plus `vpn_processes = ["chat.exe"]` produces a runtime config containing that process rule. Assert the stored `profile.config` remains unchanged.

- [ ] **Step 2: Run the test and verify failure**

Run: `cargo test ready_singbox --manifest-path src-tauri/Cargo.toml`
Expected: FAIL because current ready launch only inserts `find_process`.

- [ ] **Step 3: Route both launch branches through the overlay**

Change the sing-box arm of `start_ready_profile_inner` to pass `&input.routing`. Change `start_resolved_singbox_profile` to accept routing and call `merge_ready_routing` before sanitization and macOS TUN normalization. In `start_managed_singbox`, replace the duplicated raw-config branch with the same helper or the same pure preparation function. Keep Xray behavior unchanged in this task.

- [ ] **Step 4: Run command/config tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml ready_singbox`
Expected: PASS; both launch paths produce the same merged runtime route.

### Task 3: Align simple desktop app selection with final routing

**Files:**
- Modify: `src/lib/processSelection.ts`
- Modify: `src/lib/processSelection.test.ts`
- Modify: `src/components/routing/RoutingTab.tsx:167-185`

**Interfaces:**
- Produces: `applyProcessSelection(routing: RoutingOptions, kind: "vpn" | "direct", next: string[]): Partial<RoutingOptions>`.

- [ ] **Step 1: Write failing mode tests**

```ts
expect(applyProcessSelection(base, "vpn", ["chrome.exe"]))
  .toMatchObject({ vpn_processes: ["chrome.exe"], final_outbound: "direct" });
expect(applyProcessSelection(withVpn, "direct", ["bank.exe"]))
  .toMatchObject({ direct_processes: ["bank.exe"], final_outbound: "direct" });
expect(applyProcessSelection(withVpn, "vpn", []))
  .toMatchObject({ vpn_processes: [], final_outbound: "proxy" });
expect(applyProcessSelection(base, "direct", ["bank.exe"]))
  .toMatchObject({ direct_processes: ["bank.exe"], final_outbound: "proxy" });
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- src/lib/processSelection.test.ts`
Expected: FAIL because `applyProcessSelection` is not defined.

- [ ] **Step 3: Implement and wire the pure helper**

Return the changed process list and set `final_outbound` to `direct` only while `vpn_processes` is nonempty; otherwise use `proxy`. Pass the complete patch to `updateRouting` from both picker cards. Do not alter advanced rules or stored-setting migration.

- [ ] **Step 4: Run frontend unit tests**

Run: `npm test -- src/lib/processSelection.test.ts src/components/HomeTab.test.tsx`
Expected: PASS.

### Task 4: Propagate desktop Xray applicability warnings

**Files:**
- Modify: `src-tauri/src/commands.rs` result constructors
- Modify: `src/lib/types.ts` routing applicability types
- Modify: `src/lib/api.ts` only if input/result typing requires it
- Modify: `src/App.tsx` managed launch handling and warning banner
- Modify: `src/lib/i18n/locales/{en,ru,zh-CN}.ts`
- Test: existing TypeScript build and Rust result serialization tests

**Interfaces:**
- Produces: `ManagedLaunchResult.routing: RoutingApplicability`, using existing `applied_rule_ids` and `unavailable` fields.
- Produces UI warning text containing unavailable rule labels; supported rules still start normally.

- [ ] **Step 1: Add failing result/type checks**

Add a Rust constructor/serialization assertion that an Xray ready result preserves `simple-vpn-processes` in `routing.unavailable` on unsupported platforms. Add the matching TypeScript fields so the frontend cannot silently discard them.

- [ ] **Step 2: Run checks and verify failure**

Run: `cargo test --manifest-path src-tauri/Cargo.toml managed_launch_result` and `npm run build`
Expected: Rust test fails before propagation; TypeScript fails until the new result field is handled.

- [ ] **Step 3: Implement propagation and nonfatal warning**

Add `pub routing: crate::xray::RoutingApplicability` to `ManagedLaunchResult`; return `ready.routing` for Xray and `Default::default()` for sing-box/manual paths. In `App.tsx`, clear the previous warning on launch and set a localized amber warning when `managed.routing.unavailable.length > 0`. Explain that process rules require sing-box TUN and domain rules remain active. Do not report the connection as failed.

- [ ] **Step 4: Run Rust and frontend checks**

Run: `cargo test --manifest-path src-tauri/Cargo.toml managed_launch_result` and `npm run build`
Expected: PASS with no type errors.

### Task 5: Apply overlay on Android and make include/exclude fail closed

**Files:**
- Modify: `src-tauri/src/commands_android.rs:1177-1208`
- Modify: `src/lib/api.ts:223-226`
- Modify: `src/mobile/MobileApp.tsx:579-602`
- Modify: `src-tauri/gen/android/app/src/main/java/app/cloakwire/client/vpn/CloakwireVpnService.kt:373-455`
- Modify: `src-tauri/gen/android/app/src/main/java/app/cloakwire/client/vpn/CloakwirePlatform.kt:101-128`
- Test: `src-tauri/gen/android/app/src/test/java/app/cloakwire/client/vpn/XrayAppRoutingPolicyTest.kt`

**Interfaces:**
- Changes command input to `get_active_child_config(id: String, routing: RoutingOptions)`; TypeScript sends `{ id, routing }`.
- Reuses `XrayAppRoutingPolicy.create(packages, mode, ownPackage)` for sing-box package validation.

- [ ] **Step 1: Add failing Android tests**

Add Rust coverage that active sing-box child preparation includes local process/custom routing when supplied. Extend Kotlin policy tests with:

```kotlin
assertFailsWith<IllegalArgumentException> {
  XrayAppRoutingPolicy.create(emptyList(), "include", OWN)
}
assertFailsWith<IllegalArgumentException> {
  XrayAppRoutingPolicy.create(listOf(OWN), "include", OWN)
}
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cargo test --manifest-path src-tauri/Cargo.toml android_active_child` and the existing Android Gradle unit-test task from `src-tauri/gen/android`.
Expected: missing routing input/overlay and missing policy coverage fail as appropriate.

- [ ] **Step 3: Implement Android preparation and validation**

Pass `settings.routing` from `MobileApp`. For sing-box children, parse JSON, call `merge_ready_routing`, and serialize the runtime copy. For Xray children, call `merge_routing` with the supplied settings before `normalize_bundle`, retaining supported domain rules.

In `prepareSingBoxConfig`, resolve packages through `XrayAppRoutingPolicy.create`; include mode therefore rejects empty/own-only lists before TUN creation. In `CloakwirePlatform.openTun`, count successful `addAllowedApplication` calls and throw `IllegalStateException("None of the selected apps are installed")` when include packages were present but none resolved.

- [ ] **Step 4: Run Android/Rust tests**

Run the same commands from Step 2 and `npm run build`.
Expected: all applicable tests PASS; valid include/exclude behavior remains unchanged.

### Task 6: Resolve macOS `.app` executable names

**Files:**
- Modify: `src-tauri/Cargo.toml` if the `plist` parser dependency is added
- Modify: `src-tauri/src/commands.rs` process helpers
- Modify: `src-tauri/src/lib.rs` command registration
- Modify: `src/lib/api.ts`
- Modify: `src/components/routing/ProcessPicker.tsx:80-107`
- Test: `src-tauri/src/commands.rs` inline plist/bundle tests

**Interfaces:**
- Produces Tauri command `resolve_process_name(path: String) -> AppResult<String>`.
- Uses `CFBundleExecutable` for `.app` bundles and basename extraction for ordinary files.

- [ ] **Step 1: Write failing bundle tests**

Create a temporary `Example.app/Contents/Info.plist` containing `CFBundleExecutable` = `Example Runtime`. Assert resolution returns `Example Runtime`. Add malformed/missing plist cases and assert an error instead of `Example.app`.

- [ ] **Step 2: Run tests and verify failure**

Run: `cargo test --manifest-path src-tauri/Cargo.toml resolve_process_name`
Expected: FAIL because the command/helper does not exist.

- [ ] **Step 3: Implement parsing and frontend call**

Use the `plist` crate to read the bundle dictionary; validate the executable string is nonempty and has no path separators/control characters. Expose the command, register it, and replace frontend basename-only selection with `api.resolveProcessName(pickedPath)`. Keep `executableNameFromPath` for ordinary fallback and existing tests.

- [ ] **Step 4: Run focused tests and frontend build**

Run: `cargo test --manifest-path src-tauri/Cargo.toml resolve_process_name` and `npm run build`
Expected: PASS.

### Task 7: Full verification and Windows packaging

**Files:**
- Modify only files required to fix failures caused by this patch
- Generated: `src-tauri/target/release/bundle/**` installers

**Interfaces:**
- Produces Windows installer(s) and a verified list of automated/manual coverage.

- [ ] **Step 1: Run frontend verification**

Run: `npm test` and `npm run build`
Expected: all tests PASS and Vite production build succeeds.

- [ ] **Step 2: Run Rust verification**

Run: `cargo test --manifest-path src-tauri/Cargo.toml` and `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: all tests PASS and no compilation errors.

- [ ] **Step 3: Validate a generated routing config**

Run the existing process-routing example or focused test and inspect the generated JSON for direct-before-VPN order, provider rules after local rules, `find_process = true`, and valid outbounds. Run bundled `sing-box check -c <generated-config>` when a local binary is available.
Expected: configuration check exits 0.

- [ ] **Step 4: Build Windows desktop release**

Run: `npm run tauri:build`
Expected: successful release binary and NSIS/WiX installers under `src-tauri/target/release/bundle`. If one packager is unavailable, report it explicitly and provide the artifacts that did build.

- [ ] **Step 5: Inspect artifacts and working tree**

Run: `git status --short`, list installer sizes/hashes, and confirm no server process remains running. Report exact installer links, test results, and manual scenarios still requiring user validation. Do not commit code or push.
