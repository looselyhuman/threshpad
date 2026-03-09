# Troubleshooting

## Diagnosing issues

### Check extension state

```bash
gnome-extensions info threshpad@looselyhuman
```

Expected: `State: ACTIVE`. Other states:

| State | Meaning |
|---|---|
| `OUT OF DATE` | GNOME Shell version not listed in `metadata.json` — update `shell-version` |
| `ERROR` | JavaScript error on load — check logs |
| `DISABLED` | Not enabled — run `gnome-extensions enable threshpad@looselyhuman` |

### Watch live logs

```bash
journalctl -f /usr/bin/gnome-shell
```

All threshpad messages are prefixed with `threshpad:`.

### Check current threshold values

```bash
cat /sys/class/power_supply/BAT1/charge_control_start_threshold \
    /sys/class/power_supply/BAT1/charge_control_end_threshold
```

### Check detected hardware

```bash
batctl detect
```

---

## Common problems

### Preset clicks do nothing / "batctl set failed" in logs

**Check 1: sudoers rule**

```bash
sudo cat /etc/sudoers.d/threshpad
```

Expected output:
```
prometheus ALL=(ALL) NOPASSWD: /usr/local/bin/batctl set *
```

If missing, re-run install.sh or add manually:
```bash
echo "$USER ALL=(ALL) NOPASSWD: $(command -v batctl) set *" \
  | sudo tee /etc/sudoers.d/threshpad
sudo chmod 0440 /etc/sudoers.d/threshpad
```

**Check 2: test sudo directly**

```bash
sudo -n batctl set --start 75 --stop 80 && echo "works"
```

If this fails, the sudoers rule is not matching. Check that the path in the rule
exactly matches `command -v batctl`.

**Check 3: UPower conflict**

```bash
batctl detect
```

If you see a warning about UPower managing thresholds, go to
**GNOME Settings → Power** and disable **Charge Limit**.

**Check 4: sysfs file permissions**

```bash
ls -la /sys/class/power_supply/BAT1/charge_control_*
```

Expected: `-rw-rw-r-- 1 root battery ...` (mode 664, group battery).

If mode is `644`, the udev rule isn't active:
```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```

### Extension shows "OUT OF DATE"

Add your GNOME Shell version to `shell-version` in `extension/metadata.json`:

```bash
gnome-shell --version
```

Then add that version number to the array and reinstall the extension.

### Extension fails to load (ERROR state)

Check logs:
```bash
journalctl /usr/bin/gnome-shell --since "5 minutes ago" | grep threshpad
```

Common causes:
- GObject.registerClass missing (GNOME 45+)
- Import path wrong for your GNOME version
- Syntax error in JS

### Thresholds reset after reboot

The udev rule is not installed. Run:
```bash
sudo cp udev/99-threshpad.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules && sudo udevadm trigger
```

### Extension icon not visible in top bar

On Ubuntu, the threshpad indicator appears to the **left** of the Quick Settings
aggregate button. If it's still not visible, check the extension is ACTIVE and
that no other extension is conflicting (e.g. a top-bar manager).

### Changes don't take effect after editing extension JS

GNOME Shell 45+ caches ES modules. Disable/enable alone is **not enough** —
a full **log out and back in** is required to reload module code.
