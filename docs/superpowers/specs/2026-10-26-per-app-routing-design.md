# Per-application routing repair design

Date: 2026-10-26
Status: Approved architecture; implementation pending written-spec review

## Goal

Make per-application routing consistent for manual profiles and ready subscription bundles on Windows, macOS, and Android. Deliver a Windows desktop build for user testing before Android testing or publishing a patch.

## Scope

Included:

- Merge local routing settings into ready sing-box subscription configurations on desktop and Android.
- Preserve provider configuration sections and provider rule order after local rules.
- Make the simple desktop application modes match their descriptions and the generated default route.
- Validate Android include-mode package lists consistently for sing-box and Xray.
- Resolve macOS `.app` selections to the real executable name where possible.
- Surface the desktop Xray process-routing limitation instead of silently discarding applicability information.
- Add regression tests and produce a Windows desktop installer for manual testing.

Excluded:

- Restoring the previously reverted desktop Xray TUN implementation.
- Per-application DNS resolver routing.
- Publishing commits, tags, or releases before user testing.

## Chosen approach

Implement routing merges in Rust. The provider configuration remains the base document; local routing is applied as a controlled runtime overlay. Do not move provider configuration merging into the WebView and do not flatten full bundles into bare outbound lists.

## Data flow

### Desktop sing-box

1. The frontend starts a manual profile or a ready subscription child with the current `GeneratorSettings`.
2. Manual profiles continue through `Config::build`.
3. Ready sing-box children pass through a shared Rust merge function before validation and launch.
4. The merge prepends local system and application rules, then local custom rules, then provider rules.
5. The merge applies local route options, including `find_process`, final outbound, interface detection, resolver, and enabled rule-sets, while retaining unrelated provider fields.
6. Both ready-profile launch branches call the same merge path.

### Android

1. `MobileApp.connectWithSelection` supplies current routing options when requesting the active child configuration.
2. Rust applies the sing-box overlay before returning the runtime configuration.
3. Xray children use the existing supported-rule translation and protected-dialer normalization; Android package capture remains an OS-level `VpnService` concern.
4. Kotlin receives the same package list and include/exclude mode as before, with consistent validation.

## Rule order and outbound behavior

The effective sing-box rule order is:

1. DNS hijack and private-IP bypass.
2. Optional sniff action.
3. Simple direct-process rule.
4. Simple VPN-process rule.
5. Enabled local custom rules.
6. Provider rules.

Direct processes take precedence when a name occurs in both lists. Existing provider rules remain in their original relative order. Missing outbound targets must produce a visible configuration error rather than a silent fallback to an unrelated route.

The two simple desktop behaviors are:

- Only selected applications through VPN: unmatched traffic uses `direct`; selected VPN processes use `proxy`.
- All traffic through VPN except selected applications: unmatched traffic uses `proxy`; selected direct processes use `direct`.

Existing stored settings remain readable. UI changes update the final outbound together with the application-mode intent so the description and generated configuration cannot contradict each other.

## Platform behavior

### Windows and macOS sing-box

Use `process_name` with `find_process: true` in TUN mode. System-proxy-only mode remains unavailable for process routing. Advanced rules and ready bundles use the same overlay semantics as generated configurations.

### Desktop Xray

Keep the stable managed HTTP/SOCKS system-proxy implementation. Return routing applicability through the managed launch result and display unavailable process rules to the user. Do not claim that process matching works merely because an Xray `process` rule was serialized.

### Android

Include mode requires at least one selected package other than Cloakwire itself. At TUN establishment, at least one allowed package must resolve successfully; otherwise startup fails with a clear error. Exclude/all behavior continues to exclude Cloakwire itself. Sing-box and Xray must not silently convert an empty or wholly invalid include list into an all-apps VPN.

### macOS application picker

When the selected path is an `.app` bundle, inspect `Contents/Info.plist` for `CFBundleExecutable` and use that executable name. If bundle metadata cannot be read, show an error instead of storing the `.app` directory basename. Ordinary executable selection keeps the current basename behavior.

## Error handling

- Invalid or missing route targets fail configuration preparation with a sanitized, actionable message.
- Android include-mode validation errors reach the existing VPN error UI.
- Desktop Xray unavailable rules appear as warnings and do not prevent supported domain rules from being applied.
- Provider configuration remains immutable in persistent subscription storage; overlays affect runtime copies only.

## Testing

Rust regression tests cover:

- Ready sing-box bundle receives both simple process lists and custom rules.
- Local rules precede provider rules; provider rule order and unrelated sections survive.
- Default route and rule-set behavior match the selected application mode.
- Missing outbound targets are rejected.
- Android active-child preparation applies the overlay.
- Desktop Xray applicability is propagated without exposing provider secrets.

Frontend/Kotlin tests cover:

- Desktop application-mode changes produce the matching final outbound.
- macOS bundle executable extraction and failure behavior.
- Empty and invalid Android include lists fail; valid include/exclude lists retain existing behavior.

Verification commands include frontend tests and build, Rust tests, sing-box configuration validation where available, and the Windows Tauri release build. The resulting installer path and any untested manual scenarios are reported explicitly.

## Delivery

No code commit or GitHub push is part of this stage. After automated verification, provide the Windows installer for user testing. Android testing and publication require a later explicit go-ahead.
