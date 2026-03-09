# threshpad

A GNOME Shell extension for managing ThinkPad dual-battery charge thresholds.

Wraps the [`batctl`](https://github.com/Ooooze/batctl) binary to provide a
system-tray UI with live battery status and one-click preset modes.

## Features

- Live BAT0 / BAT1 charge percentage and status in the top bar
- Preset modes: **Desk**, **Balanced**, **Travel Prep**
- Non-root writes via udev + `battery` group — no sudo at runtime
- Mock mode for hardware-free development (`THRESHPAD_MOCK=1`)

## Requirements

- GNOME Shell 45+
- ThinkPad with `thinkpad_acpi` kernel module
- [`batctl`](https://github.com/Ooooze/batctl) installed at `/usr/local/bin/batctl`

## Installation

```bash
git clone https://github.com/looselyhuman/threshpad.git
cd threshpad
bash scripts/install.sh
# Log out and back in for group membership to take effect
gnome-extensions enable threshpad@looselyhuman
```

## Preset Modes

| Mode        | BAT0        | BAT1        |
|-------------|-------------|-------------|
| Desk        | 40% / 50%   | 75% / 80%   |
| Balanced    | 75% / 80%   | 75% / 80%   |
| Travel Prep | 0% / 100%   | 0% / 100%   |

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

GPL-2.0 — see [LICENSE](LICENSE).
