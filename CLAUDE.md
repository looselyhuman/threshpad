# threshpad — Claude Code Context

## What This Is
A GNOME Shell extension (GJS) providing a system-tray UI for ThinkPad dual-battery
charge threshold management. Wraps the `batctl` CLI (Go binary) for writes;
reads battery state directly from sysfs for efficiency.

## Architecture
- **Frontend:** GNOME Shell Extension — JavaScript/GJS, targeting GNOME 45+
- **Backend:** `batctl` binary ([github.com/Ooooze/batctl](https://github.com/Ooooze/batctl)) — located via `GLib.find_program_in_path('batctl')` at runtime (works with `/usr/bin`, `/usr/local/bin`, AUR, etc.)
- **Writes:** `Gio.Subprocess` → `batctl set --start N --stop N`
- **Reads:** `Gio.File.load_contents()` directly on `/sys/class/power_supply/BAT*/`
- **Permissions:** udev rules (`udev/99-threshpad.rules`) grant the `battery` group
  write access to threshold files — no sudo required at runtime
- **Settings:** GSettings schema in `extension/schemas/` for persisting user prefs

## Hardware Context
- Primary target: ThinkPad T480 with dual batteries
  - BAT0: Internal (harder to replace → conservative defaults: start 40%, stop 50%)
  - BAT1: External/swappable (higher defaults: start 75%, stop 80%)
- **Observed on dev hardware:** only `BAT1` appears under `/sys/class/power_supply/`
  (BAT0 absent — internal battery may not be installed). The extension handles this
  gracefully by enumerating present batteries at startup rather than hardcoding names.
- `batctl detect` output on dev hardware:
  - Backend: Generic, Batteries: [BAT1]
  - Capabilities: start threshold (0..99), stop threshold (1..100), charge behaviour
  - ⚠ UPower conflict: GNOME Settings → Power → Charge Limit overrides batctl writes.
    Users must disable that setting. Confirmed via `batctl detect` warning.

## Preset Modes
| Mode        | BAT0        | BAT1        | Notes                          |
|-------------|-------------|-------------|--------------------------------|
| Desk        | 40% / 50%   | 40% / 50%   | Daily driver, mostly plugged in|
| Balanced    | 75% / 80%   | 75% / 80%   | Mixed use                      |
| Travel Prep | 0% / 100%   | 0% / 100%   | Notify user when fully charged |

## sysfs Paths (read directly — do not subprocess for these)
```
/sys/class/power_supply/BAT0/capacity
/sys/class/power_supply/BAT0/status
/sys/class/power_supply/BAT0/charge_control_start_threshold
/sys/class/power_supply/BAT0/charge_control_end_threshold
```
Replace BAT0 with BAT1 for the external battery.

## batctl CLI (writes only)
```bash
sudo batctl set --start 40 --stop 80   # set thresholds (start: 0..99, stop: 1..100)
batctl status                           # read status (use sysfs instead in GJS)
batctl detect                           # show detected hardware and capabilities
```
Note: batctl has no `--index` flag. Each invocation targets whichever battery
`batctl detect` found. Dual-battery write support needs hardware verification.
The extension locates batctl via PATH at runtime — no hardcoded path.

## Code Style
- 4-space indent, single quotes, semicolons
- JSDoc on all exported functions
- All file/subprocess I/O wrapped in try/catch — a GJS crash takes GNOME Shell down

## Testing Without Hardware
Set `THRESHPAD_MOCK=1` — extension reads from `test/fixtures/` instead of live
sysfs and skips batctl calls entirely.

## Do Not
- Do not install TLP — it conflicts with `power-profiles-daemon` on Ubuntu 24
- Do not write to `/sys` directly from GJS — always go through batctl for writes
- Do not use `chmod 0666` on threshold files — use the `battery` group with `0664`
- Do not use GNOME 44 or earlier APIs
- Do not poll with subprocesses — use `Gio.File` + `GLib.timeout_add_seconds`
