# threshpad

A GNOME Shell extension for managing ThinkPad dual-battery charge thresholds.

Wraps the [`batctl`](https://github.com/Ooooze/batctl) binary to provide a
system-tray UI with live battery status and one-click preset modes.

This software was designed, scaffolded, coded, and debugged by Claude Code (Sonnet 4.6). Human provided high level requirements and keyboard gopher services.

## Features

- Live charge percentage per battery in the top bar (`⚡ 98%`)
- Per-battery status and thresholds in the popup menu (`BAT1: 98% (Not charging) · 75–80`)
- Preset modes: **Desk Mode**, **Balanced**, **Travel Prep** — with threshold ranges shown inline
- Visual feedback when a preset is applied — buttons disable briefly, then re-enable with updated values
- Privilege escalation via polkit (`pkexec`) — no password prompt for active desktop sessions
- Auto-detects which batteries are present — works with single or dual battery
- Mock mode for hardware-free development (`THRESHPAD_MOCK=1`)

## Requirements

- GNOME Shell 45+
- ThinkPad with `thinkpad_acpi` kernel module
- [`batctl`](https://github.com/Ooooze/batctl) in your PATH (installed automatically by `install.sh`)

## Installation

```bash
git clone https://github.com/looselyhuman/threshpad.git
cd threshpad
bash scripts/install.sh
# Log out and back in for group membership to take effect
gnome-extensions enable threshpad@looselyhuman
```

## UPower conflict

On Ubuntu and other GNOME desktops, UPower may manage charge thresholds via
**GNOME Settings → Power → Charge Limit**. If that setting is enabled, it will
override changes made by threshpad.

**Fix:** Open GNOME Settings → Power and disable **Charge Limit** before using
threshpad presets.

You can confirm the conflict by running:
```bash
batctl detect
```
A warning will appear if UPower is active.

## Preset Modes

| Mode        | BAT0        | BAT1        | Use when…                        |
|-------------|-------------|-------------|----------------------------------|
| Desk        | 40% / 50%   | 40% / 50%   | Mostly plugged in — max lifespan |
| Balanced    | 75% / 80%   | 75% / 80%   | Mixed plugged/unplugged use      |
| Travel Prep | 0% / 100%   | 0% / 100%   | Charge fully before a trip       |

Values follow [TLP project](https://linrunner.de/tlp/faq/battery.html) and Lenovo recommendations.
See [docs/PRESET-RATIONALE.md](docs/PRESET-RATIONALE.md) for sources and reasoning.

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

GPL-2.0 — see [LICENSE](LICENSE).
