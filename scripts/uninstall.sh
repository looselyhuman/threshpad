#!/usr/bin/env bash
set -euo pipefail

EXTENSION_UUID="threshpad@looselyhuman"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "==> Disabling and removing GNOME extension..."
gnome-extensions disable "$EXTENSION_UUID" 2>/dev/null || true
rm -rf "$EXTENSION_DIR"

echo "==> Removing sudoers rule..."
sudo rm -f /etc/sudoers.d/threshpad

echo "==> Removing udev rules..."
sudo rm -f /etc/udev/rules.d/99-threshpad.rules
sudo udevadm control --reload-rules
sudo udevadm trigger

echo "==> Removing $USER from battery group..."
sudo gpasswd -d "$USER" battery 2>/dev/null || true

echo ""
echo "Done. batctl and the battery group itself are left in place."
echo "To remove batctl: sudo rm /usr/local/bin/batctl (or wherever it was installed)"
echo "To remove the battery group: sudo groupdel battery"
