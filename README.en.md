<div align="center">

<img src="src-tauri/icons/icon.png" alt="Cloakwire Logo" width="112" />

# Cloakwire

**Cross-platform desktop & mobile VPN client powered by sing-box and Xray cores.**

Windows · macOS · Android · Rust/Tauri & React · VLESS Reality · Hysteria 2 · TUIC · 0 Telemetry · Open Source

<br/>

[![Release](https://img.shields.io/github/v/release/markwhite7881-cpu/cloakwire?style=for-the-badge&color=10b981)](https://github.com/markwhite7881-cpu/cloakwire/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/markwhite7881-cpu/cloakwire/total?style=for-the-badge&color=3b82f6)](https://github.com/markwhite7881-cpu/cloakwire/releases/latest)
[![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Android-blueviolet?style=for-the-badge)](https://github.com/markwhite7881-cpu/cloakwire/releases/latest)
[![License](https://img.shields.io/github/license/markwhite7881-cpu/cloakwire?style=for-the-badge&color=64748b)](LICENSE)

<br/>

**[ 🇬🇧 English ](README.md)** &nbsp;|&nbsp; **[ 🇷🇺 Русский ](README.ru.md)** &nbsp;|&nbsp; **[ 🇨🇳 简体中文 ](README.zh-CN.md)**

<br/>

<img src="screenshots/hero-showcase.png" alt="Cloakwire Interface Showcase" width="100%" />

</div>

---

## ⚡ Downloads (v1.4.6)

| Platform | Recommended | Alternative | Architecture |
|---|---|---|---|
| 🪟 **Windows** | [⬇️ **Download .exe** (Installer)](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.6/Cloakwire_1.4.6_x64-setup.exe) | [⬇️ **Download .msi**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.6/Cloakwire_1.4.6_x64_en-US.msi) | x64 (Intel / AMD) |
| 🍏 **macOS Apple Silicon** | [⬇️ **Download .dmg**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.6/Cloakwire_1.4.6_aarch64.dmg) | [⬇️ **Download .app.zip**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.6/Cloakwire_1.4.6_aarch64.app.zip) | M1 / M2 / M3 / M4 |
| 🍏 **macOS Intel** | [⬇️ **Download .dmg**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.6/Cloakwire_1.4.6_x64.dmg) | [⬇️ **Download .app.zip**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.6/Cloakwire_1.4.6_x64.app.zip) | x86_64 |
| 🤖 **Android** | [⬇️ **Download .apk**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.6/Cloakwire_1.4.6_arm64-v8a.apk) | — | arm64-v8a |

> 🔒 All desktop binaries are cryptographically signed with **Minisign** (`.sig`). Checksums are published in [`SHA256SUMS.txt`](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.6/SHA256SUMS.txt).

---

## 🚀 Quick Start

1. **Install**: Download and install the release package for your operating system.
2. **Add Profile or Node**: Click **Add Server** or paste any supported link (`vless://`, `vmess://`, `ss://`, `trojan://`, `hy2://`, `tuic://`, `wireguard://`, or Base64 / Clash subscription URLs). Links in clipboard are detected automatically.
3. **Connect**: Click the connect button. Cloakwire selects the working route, performs latency checks, and routes traffic through the encrypted tunnel.

---

## 🌟 Key Features

### 🧩 Dual-Engine Architecture
- **sing-box (Default)**: Low memory footprint (~35 MB idle), fast packet processing, system TUN routing, and direct per-app filtering.
- **Xray Core (Automatic Fallback)**: Automatically activates when loading profiles requiring Xray-specific dialers or routing rules without manual toggling.

### 🍏 macOS TUN Mode with One-Time Elevation
- **Native Prompt**: When starting TUN mode on macOS, the system requests administrator approval once via Touch ID or password (`osascript` sets root SUID on the `sing-box` binary).
- **Silent Reconnections**: All subsequent connections, reconnections, and server switches launch instantly without prompting again.
- **Proxy Mode**: Connections using standard SOCKS5/HTTP mode run unprivileged without triggering any prompt.

### 🎨 Themes & Custom Accents
- **Adaptive Modes**: Support for **System** (follows OS theme), **Light**, **Dark**, and pure-black **OLED** mode (for AMOLED screens and dark environments).
- **Accent Palettes**: 5 customizable accent themes (*Emerald, Cyan, Violet, Amber, Rose*) tinting buttons, badges, and glows.

### 🌐 Full Multilingual Support
- Built-in localization in **English**, **Russian** (Русский), and **Simplified Chinese** (简体中文).
- Language can be switched at any time in Settings.

### 🎯 Split Tunneling & Routing Modes
- **Apps via VPN**: Direct specific programs (browsers, messengers) through the encrypted tunnel while leaving local traffic direct.
- **Apps Direct**: Route all system traffic through the tunnel while bypassing selected local services (e.g. banking, LAN).
- **TUN vs System Proxy**: Choose between full network virtual adapter (TUN) or standard system proxy.

### 📱 Android Companion & Home Screen Widgets
- Full mobile client with background service integration and low battery consumption.
- **Interactive Home Screen Widget**: 1-tap VPN toggle showing live status and synchronized accent colors.
- **Minimal 1×1 Widget**: Compact power-button-only layout for dense home screens.
- **Clipboard Helper**: One-tap import from clipboard on the main screen.

### ⚡ Desktop System Tray & Session Timer
- Background minimization to system tray with quick connect/disconnect menu and connection indicator.
- Live session duration timer and throughput counters (KB/s, MB).

---

## 🛡️ Privacy & Security

- **Zero Telemetry**: No trackers, no external analytics, no telemetry endpoints, no crash reporters.
- **Local Profile Processing**: Subscriptions and credentials are parsed and stored locally in the secure app data directory.
- **DNS Protection**: Built-in DNS routing through encrypted upstream resolvers inside the proxy tunnel prevents ISP sniffing and DNS hijacking.

### Security Warnings on Windows & macOS

Cloakwire is **free and open-source software**. We do not buy commercial enterprise certificates ($400+/year for Microsoft EV Authenticode and $99/year for Apple Developer):
- **Windows SmartScreen**: Click **"More info"** → **"Run anyway"**.
- **macOS Gatekeeper**: Right-click `Cloakwire.app` → select **"Open"** (or allow under *System Settings → Privacy & Security*).

Verify any installer using SHA-256 before running:
```powershell
# PowerShell checksum verification:
(Get-FileHash Cloakwire_1.4.6_x64-setup.exe -Algorithm SHA256).Hash.ToLower()
```

---

## 🔧 Supported Protocols

| Protocol | Transports & Features | Core |
|---|---|---|
| **VLESS** | Reality, XTLS-Vision, WebSocket, gRPC, HTTPUpgrade, Splithttp | `sing-box` / `Xray` |
| **VMess** | TCP, WebSocket, gRPC, TLS | `sing-box` / `Xray` |
| **Trojan** | TLS, WebSocket, gRPC | `sing-box` / `Xray` |
| **Shadowsocks** | AEAD, 2022 (blake3, chacha20, aes-gcm) | `sing-box` / `Xray` |
| **Hysteria 2** | Port-hopping, Salamander obfuscation, BBR | `sing-box` |
| **TUIC** | QUIC, 0-RTT handshake, BBR congestion control | `sing-box` |
| **WireGuard / AWG** | Encrypted UDP tunnel | `sing-box` |

---

## 🛠️ Building from Source

### Prerequisites
- Node.js 20+ and npm
- Rust 1.80+ (`cargo`)
- Build toolchains:
  - **Windows**: Visual Studio C++ Build Tools, NSIS, WiX Toolset
  - **macOS**: Xcode Command Line Tools
  - **Android**: Android SDK, NDK r25+

```bash
# Clone the repository
git clone https://github.com/markwhite7881-cpu/cloakwire.git
cd cloakwire

# Install web dependencies
npm install

# Run desktop dev environment
npm run tauri:dev

# Build desktop release package
npm run tauri:build
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.  
Core engines (`sing-box`, `Xray-core`) are licensed by their respective authors under GPL-3.0 / MPL-2.0.