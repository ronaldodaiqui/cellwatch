# Cellwatch

A web app for monitoring a LiFePO4 battery whose BMS normally pairs with the SMB Link app (Mottcell / Shanmu BMS, plus Pace-protocol BMS boards).
It runs in the browser over Web Bluetooth and only reads from the BMS. It never writes settings.

**Open it:** https://ronaldodaiqui.github.io/cellwatch/

Works in Chrome or Edge on Android, macOS, Windows and ChromeOS. On iPhone, use the Bluefy browser.
Close SMB Link first, because the BMS accepts only one connection at a time.

The Bluetooth protocol is described in [PROTOCOL.md](PROTOCOL.md).
