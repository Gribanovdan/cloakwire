<div align="center">

<img src="src-tauri/icons/icon.png" alt="Cloakwire Logo" width="112" />

# Cloakwire

**基于 sing-box 和 Xray 双内核的跨平台桌面与移动端代理客户端。**

Windows · macOS · Android · Rust/Tauri & React · VLESS Reality · Hysteria 2 · TUIC · 零遥测 · 完全开源

<br/>

[![Release](https://img.shields.io/github/v/release/markwhite7881-cpu/cloakwire?style=for-the-badge&color=10b981)](https://github.com/markwhite7881-cpu/cloakwire/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/markwhite7881-cpu/cloakwire/total?style=for-the-badge&color=3b82f6)](https://github.com/markwhite7881-cpu/cloakwire/releases/latest)
[![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Android-blueviolet?style=for-the-badge)](https://github.com/markwhite7881-cpu/cloakwire/releases/latest)
[![License](https://img.shields.io/github/license/markwhite7881-cpu/cloakwire?style=for-the-badge&color=64748b)](LICENSE)

<br/>

**[ 🇬🇧 English ](README.md)** &nbsp;|&nbsp; **[ 🇷🇺 Русский ](README.ru.md)** &nbsp;|&nbsp; **[ 🇨🇳 简体中文 ](README.zh-CN.md)**

<br/>

<img src="screenshots/hero-showcase.png" alt="Cloakwire 界面展示" width="100%" />

</div>

---

## ⚡ 安装包下载 (v1.4.7)

| 平台 | 推荐安装程序 | 备用压缩包 | 架构 |
|---|---|---|---|
| 🪟 **Windows** | [⬇️ **下载 .exe** (安装程序)](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_x64-setup.exe) | [⬇️ **下载 .msi**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_x64_en-US.msi) | x64 (Intel / AMD) |
| 🍏 **macOS Apple Silicon** | [⬇️ **下载 .dmg**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_aarch64.dmg) | [⬇️ **下载 .app.zip**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_aarch64.app.zip) | M1 / M2 / M3 / M4 |
| 🍏 **macOS Intel** | [⬇️ **下载 .dmg**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_x64.dmg) | [⬇️ **下载 .app.zip**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_x64.app.zip) | x86_64 |
| 🤖 **Android** | [⬇️ **下载 .apk**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_arm64-v8a.apk) | — | arm64-v8a |

> 🔒 所有桌面版发布文件均经过 **Minisign** 数字签名 (`.sig`)，完整 SHA-256 校验和见 [`SHA256SUMS.txt`](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/SHA256SUMS.txt)。

---

## 🚀 快速上手

1. **下载安装**：从上表选择对应系统的安装包完成安装。
2. **导入节点或订阅**：点击 **Add Server**，或直接粘贴连接链接（支持 `vless://`、`vmess://`、`ss://`、`trojan://`、`hy2://`、`tuic://`、`wireguard://` 以及 Base64 / Clash 订阅 URL）。剪贴板内容可自动识别。
3. **开启连接**：点击主连接按钮即可建立加密通道，同时完成延迟测试并启用 DNS 防劫持保护。

---

## 🌟 核心特性

### 🧩 双内核驱动：sing-box + Xray
- **sing-box (默认核心)**：内存占用极低（空闲仅约 35 MB），数据包转发效率高，支持系统级 TUN 虚拟网卡与按应用分流。
- **Xray Core (智能回退)**：当导入需要 Xray 特性扩展的节点配置时自动激活，无需手动干预。

### 🍏 macOS TUN 模式单次提权
- **原生认证**：在 macOS 上首次启用 TUN 模式时，系统通过 Touch ID 或密码验证一次（通过 `osascript` 为 `sing-box` 赋予 root SUID 权限）。
- **后续免密连接**：后续所有启动、重连或节点切换均在后台静默运行，无需再次输入密码。
- **普通代理模式**：标准 SOCKS5/HTTP 模式无需管理员权限。

### 🎨 主题引擎与个性化色彩
- **自适应模式**：支持 **跟随系统**、**浅色模式**、**深色模式** 及针对 AMOLED 屏幕优化的纯黑 **OLED 模式**。
- **5 种主题色**：翠绿 (Emerald)、青色 (Cyan)、紫罗兰 (Violet)、琥珀金 (Amber) 和玫瑰红 (Rose)。

### 🌐 完整多语言支持
- 原生内置 **简体中文**、**English** 和 **Русский**（俄语），可在设置中随时切换。

### 🎯 分流规则与模式切换
- **应用代理**：仅将指定程序（如浏览器、即时通讯工具）通过代理路由，其余网络流量直连。
- **应用直连**：全局流量代理的同时排除指定程序（如网银客户端、内网应用）。
- **TUN / 系统代理**：支持在完整虚拟网卡与标准系统代理之间一键切换。

### 📱 Android 客户端与桌面小组件
- 原生 Android VpnService 深度集成，电量损耗低。
- **交互式桌面小组件**：一键开关 VPN，实时同步连接状态与主题强调色。
- **1×1 极简组件**：仅显示开关按钮的紧凑型布局。
- **剪贴板导入**：主界面一键识别导入节点。

### ⚡ 系统托盘与会话统计
- 桌面端支持最小化至系统托盘，快速查看状态及切换连接。
- 实时统计会话连接时长与上下行流量速率。

---

## 🛡️ 隐私与安全性

- **零遥测数据**：无任何跟踪代码、外部统计埋点或崩溃日志上传。
- **本地化解析**：所有订阅链接与凭据仅在本地安全目录处理与存储。
- **DNS 加密保护**：代理通道内通过 DoH 加密解析域名，有效防止 ISP 域名污染与劫持。

### Windows SmartScreen 与 macOS Gatekeeper 提示说明

Cloakwire 是**完全免费的开源项目**。我们未购买昂贵的商业代码签名证书：
- **Windows SmartScreen**：点击 **“更多信息”** → **“仍要运行”** 即可。
- **macOS Gatekeeper**：右键点击 `Cloakwire.app` → 选择 **“打开”**（或在 *系统设置 → 隐私与安全性* 中允许）。

校验安装包 SHA-256 示例：
```powershell
(Get-FileHash Cloakwire_1.4.7_x64-setup.exe -Algorithm SHA256).Hash.ToLower()
```

---

## 🔧 支持的协议

| 协议 | 传输层及特性 | 支持核心 |
|---|---|---|
| **VLESS** | Reality, XTLS-Vision, WebSocket, gRPC, HTTPUpgrade, Splithttp | `sing-box` / `Xray` |
| **VMess** | TCP, WebSocket, gRPC, TLS | `sing-box` / `Xray` |
| **Trojan** | TLS, WebSocket, gRPC | `sing-box` / `Xray` |
| **Shadowsocks** | AEAD, 2022 (blake3, chacha20, aes-gcm) | `sing-box` / `Xray` |
| **Hysteria 2** | 端口跳跃 (Port-hopping), Salamander 混淆, BBR | `sing-box` |
| **TUIC** | QUIC, 0-RTT 握手, BBR 拥塞控制 | `sing-box` |
| **WireGuard / AWG** | 加密 UDP 隧道 | `sing-box` |

---

## 🛠️ 从源码构建

### 环境要求
- Node.js 20+ 及 npm
- Rust 1.80+ (`cargo`)
- 平台编译工具链：
  - **Windows**: Visual Studio C++ 生成工具, NSIS, WiX Toolset
  - **macOS**: Xcode 命令行工具
  - **Android**: Android SDK, NDK r25+

```bash
# 克隆仓库
git clone https://github.com/markwhite7881-cpu/cloakwire.git
cd cloakwire

# 安装前端依赖
npm install

# 运行桌面端开发环境
npm run tauri:dev

# 构建发布包
npm run tauri:build
```

---

## 📄 开源许可证

本项目基于 **MIT License** 开源。详情见 [`LICENSE`](LICENSE)。  
捆绑的代理核心 (`sing-box`, `Xray-core`) 分别遵循原作者的 GPL-3.0 / MPL-2.0 开源协议。
