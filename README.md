# Cellwatch

A web app for monitoring a LiFePO4 battery whose BMS normally pairs with the SMB Link app (Mottcell / Shanmu BMS, plus Pace-protocol BMS boards).
It runs in the browser over Web Bluetooth and only reads from the BMS. It never writes settings.

**Open it:** https://ronaldodaiqui.github.io/cellwatch/

Works in Chrome or Edge on Android, macOS, Windows and ChromeOS. On iPhone, use the Bluefy browser.

**Android app:** download `Cellwatch.apk` from the [latest release](https://github.com/ronaldodaiqui/cellwatch/releases/latest).
GitHub Actions builds it on every push to `main` (see `app/` and `.github/workflows/android.yml`). It's the same page running inside Capacitor with a native Bluetooth plugin,
and it has its own scanner that lists every nearby device.
`app/debug.keystore` is a throwaway debug signing key. It's committed so that each build installs as an update over the previous one.
Close SMB Link first, because the BMS accepts only one connection at a time.

The Bluetooth protocol is described in [PROTOCOL.md](PROTOCOL.md).
