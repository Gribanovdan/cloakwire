<div align="center">

<img src="src-tauri/icons/icon.png" alt="Cloakwire Logo" width="112" />

# Cloakwire

**Кроссплатформенный VPN-клиент для десктопа и мобильных устройств на базе ядер sing-box и Xray.**

Windows · macOS · Android · Rust/Tauri & React · VLESS Reality · Hysteria 2 · TUIC · Без телеметрии · Открытый исходный код

<br/>

[![Release](https://img.shields.io/github/v/release/markwhite7881-cpu/cloakwire?style=for-the-badge&color=10b981)](https://github.com/markwhite7881-cpu/cloakwire/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/markwhite7881-cpu/cloakwire/total?style=for-the-badge&color=3b82f6)](https://github.com/markwhite7881-cpu/cloakwire/releases/latest)
[![Platforms](https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Android-blueviolet?style=for-the-badge)](https://github.com/markwhite7881-cpu/cloakwire/releases/latest)
[![License](https://img.shields.io/github/license/markwhite7881-cpu/cloakwire?style=for-the-badge&color=64748b)](LICENSE)

<br/>

**[ 🇬🇧 English ](README.md)** &nbsp;|&nbsp; **[ 🇷🇺 Русский ](README.ru.md)** &nbsp;|&nbsp; **[ 🇨🇳 简体中文 ](README.zh-CN.md)**

<br/>

<img src="screenshots/hero-showcase.png" alt="Интерфейс Cloakwire" width="100%" />

</div>

---

## ⚡ Загрузка релизов (v1.4.7)

| Платформа | Рекомендуемый установщик | Альтернативный пакет | Архитектура |
|---|---|---|---|
| 🪟 **Windows** | [⬇️ **Скачать .exe** (Инсталлятор)](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_x64-setup.exe) | [⬇️ **Скачать .msi**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_x64_en-US.msi) | x64 (Intel / AMD) |
| 🍏 **macOS Apple Silicon** | [⬇️ **Скачать .dmg**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_aarch64.dmg) | [⬇️ **Скачать .app.zip**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_aarch64.app.zip) | M1 / M2 / M3 / M4 |
| 🍏 **macOS Intel** | [⬇️ **Скачать .dmg**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_x64.dmg) | [⬇️ **Скачать .app.zip**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_x64.app.zip) | x86_64 |
| 🤖 **Android** | [⬇️ **Скачать .apk**](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/Cloakwire_1.4.7_arm64-v8a.apk) | — | arm64-v8a |

> 🔒 Все бинарные сборки для десктопа подписаны криптографическим ключом **Minisign** (`.sig`). Контрольные суммы опубликованы в [`SHA256SUMS.txt`](https://github.com/markwhite7881-cpu/cloakwire/releases/download/v1.4.7/SHA256SUMS.txt).

---

## 🚀 Быстрый старт

1. **Установка**: Скачайте и установите пакет для вашей операционной системы из таблицы выше.
2. **Добавление серверов**: Нажмите кнопку **Add Server** или вставьте ссылку на подключение (`vless://`, `vmess://`, `ss://`, `trojan://`, `hy2://`, `tuic://`, `wireguard://`, либо Base64 / Clash URL подписки). Ссылки из буфера обмена определяются автоматически.
3. **Подключение**: Нажмите кнопку подключения. Cloakwire протестирует задержку узлов и перенаправит трафик через зашифрованный туннель.

---

## 🌟 Ключевые возможности

### 🧩 Двойной движок: sing-box + Xray
- **sing-box (по умолчанию)**: Низкое потребление памяти (~35 МБ в простое), высокая производительность пакетной обработки, режим системного адаптера TUN и раздельная маршрутизация по программам.
- **Xray Core (автоматический fallback)**: Подключается автоматически для профилей с расширениями Xray, не требуя ручного переключения.

### 🍏 Режим TUN на macOS с однократным запросом прав
- **Однократная авторизация**: При первом запуске TUN-режима macOS запрашивает подтверждение администратора через Touch ID или пароль (`osascript` устанавливает SUID root для бинарника `sing-box`).
- **Бесшовные переподключения**: Все последующие запуски туннеля и смены серверов происходят мгновенно без повторного ввода пароля.
- **Прокси-режим**: Стандартные SOCKS5/HTTP-подключения работают без привилегий root.

### 🎨 Темы оформления и акцентные цвета
- **Адаптивные режимы**: Поддержка **Системной** (автоматически следует за ОС), **Светлой**, **Тёмной** и глубокой чёрной **OLED** темы (для AMOLED-экранов смартфонов).
- **5 акцентных палитр**: Изумрудная (Emerald), Голубая (Cyan), Фиолетовая (Violet), Янтарная (Amber) и Розовая (Rose).

### 🌐 Мультиязычный интерфейс
- Полная локализация на **Русском**, **Английском** и **Упрощенном китайском** языках.
- Переключение языка доступно в любое время в разделе настроек.

### 🎯 Раздельное туннелирование (Split Tunneling)
- **Приложения через VPN**: Направляйте выбранные программы (браузеры, мессенджеры) через защищенный туннель, сохраняя прямой доступ для локальных сервисов.
- **Приложения напрямую**: Пускайте весь интернет-трафик через VPN, исключая чувствительные приложения (онлайн-банки, локальная сеть).
- **TUN или системный прокси**: Переключение между полным сетевым виртуальным адаптером (TUN) и классическим системным прокси.

### 📱 Android-клиент и виджеты рабочего стола
- Полноценное мобильное приложение со службой VpnService и низким расходом батареи.
- **Интерактивный виджет**: Переключение VPN в один тап прямо с домашнего экрана со статусом соединения и цветом выбранной темы.
- **Компактный виджет 1×1**: Минималистичная кнопка для рабочего стола.
- **Быстрая вставка**: Импорт серверов из буфера обмена в одно нажатие.

### ⚡ Системный трей и статистика сессии
- Сворачивание в трей с быстрым меню переключения подключения.
- Таймер активной сессии и счетчики входящего/исходящего трафика в реальном времени.

---

## 🛡️ Безопасность и проверка подлинности

- **Полное отсутствие телеметрии**: Нет трекеров, аналитики, внешних метрик и отправки отчетов о падениях.
- **Локальная обработка данных**: Профили и подписки расшифровываются и хранятся исключительно локально в изолированной директории приложения.
- **Защита DNS**: Встроенная маршрутизация DNS через DoH-резолверы внутри туннеля предотвращает перехват доменных запросов провайдером.

### Предупреждения SmartScreen на Windows и Gatekeeper на macOS

Cloakwire — **бесплатный открытый проект**. Мы не покупаем коммерческие сертификаты подписи кода у Microsoft ($400+/год за EV Authenticode) и Apple ($99/год за Apple Developer):
- **Windows SmartScreen**: Нажмите **«Подробнее»** → **«Выполнить в любом случае»**.
- **macOS Gatekeeper**: Нажмите правой кнопкой на `Cloakwire.app` → **«Открыть»** (или разрешите запуск в *Системные настройки → Конфиденциальность и безопасность*).

Проверить целостность файла перед запуском можно по хешу SHA-256:
```powershell
# Проверка хеша инсталлятора Windows:
(Get-FileHash Cloakwire_1.4.7_x64-setup.exe -Algorithm SHA256).Hash.ToLower()
```

---

## 🔧 Поддерживаемые протоколы

| Протокол | Транспорты и особенности | Ядро |
|---|---|---|
| **VLESS** | Reality, XTLS-Vision, WebSocket, gRPC, HTTPUpgrade, Splithttp | `sing-box` / `Xray` |
| **VMess** | TCP, WebSocket, gRPC, TLS | `sing-box` / `Xray` |
| **Trojan** | TLS, WebSocket, gRPC | `sing-box` / `Xray` |
| **Shadowsocks** | AEAD, 2022 (blake3, chacha20, aes-gcm) | `sing-box` / `Xray` |
| **Hysteria 2** | Port-hopping, обфускация Salamander, BBR | `sing-box` |
| **TUIC** | QUIC, 0-RTT рукопожатие, контроль перегрузки BBR | `sing-box` |
| **WireGuard / AWG** | Зашифрованный UDP-туннель | `sing-box` |

---

## 🛠️ Сборка из исходников

### Требования
- Node.js 20+ и npm
- Rust 1.80+ (`cargo`)
- Зависимости платформ:
  - **Windows**: Visual Studio C++ Build Tools, NSIS, WiX Toolset
  - **macOS**: Xcode Command Line Tools
  - **Android**: Android SDK, NDK r25+

```bash
# Клонирование репозитория
git clone https://github.com/markwhite7881-cpu/cloakwire.git
cd cloakwire

# Установка веб-зависимостей
npm install

# Запуск в режиме разработки
npm run tauri:dev

# Сборка релизного пакета
npm run tauri:build
```

---

## 📄 Лицензия

Проект распространяется под лицензией **MIT**. Подробности в файле [`LICENSE`](LICENSE).  
Встроенные ядра (`sing-box`, `Xray-core`) распространяются их авторами по лицензиям GPL-3.0 и MPL-2.0.