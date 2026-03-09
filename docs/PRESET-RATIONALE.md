# Preset Threshold Rationale

This document explains the default threshold values used by threshpad's preset modes
and the sources they are based on.

## The Trade-off

Lithium-ion batteries degrade faster when kept at high state-of-charge for extended
periods. Charge thresholds limit how high the battery charges, trading some runtime
capacity for longer calendar lifespan.

- **Lower thresholds** → longer battery lifespan, less runtime when unplugged
- **Higher thresholds** → shorter battery lifespan, more runtime when unplugged

## Preset Values

| Mode        | Start | Stop  | Rationale                                              |
|-------------|-------|-------|--------------------------------------------------------|
| Desk Mode   | 40%   | 50%   | Always plugged in; maximize lifespan over runtime      |
| Balanced    | 75%   | 80%   | Mixed use; good compromise between lifespan and runtime|
| Travel Prep | 0%    | 100%  | Charge fully before a trip; revert to Balanced after   |

These values are consistent across both BAT0 and BAT1. There is no documented basis
for treating an internal vs. swappable ThinkPad battery differently for threshold
purposes — both cells age the same way.

## Sources

- **TLP Project — Battery Care FAQ**
  <https://linrunner.de/tlp/faq/battery.html>
  Canonical reference for ThinkPad battery threshold configuration. Recommends
  `START=40 / STOP=50` for stationary use and `START=75 / STOP=80` for general use.

- **TLP Project — Battery Care Settings**
  <https://linrunner.de/tlp/settings/battery.html>
  Documents valid ranges: START 0–99, STOP 1–100; STOP must exceed START by at least 4.

- **Lenovo Support — How to Increase Battery Life**
  <https://support.lenovo.com/us/en/solutions/ht078208>
  Lenovo's official guidance; recommends an 80% charge limit as a general best practice
  and 40–50% thresholds for machines that are mostly plugged in.

- **Arch Linux Wiki — TLP**
  <https://wiki.archlinux.org/title/TLP>
  Community-maintained reference with configuration examples aligned with TLP docs.

## Travel Prep Note

`0 / 100` disables thresholds entirely (charges to 100%). Use this before a long trip,
then switch back to Balanced or Desk Mode when you return and plug back in.
The 3-second feedback delay in the UI is intentional — writes via `batctl` complete
quickly, but sysfs takes a moment to reflect the new values.
