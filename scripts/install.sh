#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

BATCTL_VERSION="v2026.3.11"
BATCTL_URL="https://github.com/Ooooze/batctl/releases/download/${BATCTL_VERSION}/batctl-${BATCTL_VERSION#v}-linux-x86_64.tar.gz"

# Install batctl if not already present
if ! command -v batctl &>/dev/null; then
    echo "==> Installing batctl ${BATCTL_VERSION}..."
    TMP=$(mktemp -d)
    curl -fsSL "$BATCTL_URL" -o "$TMP/batctl.tar.gz"
    tar -xzf "$TMP/batctl.tar.gz" -C "$TMP"
    sudo install -m 755 "$TMP/batctl" /usr/local/bin/batctl
    rm -rf "$TMP"
    echo "    batctl installed to /usr/local/bin/batctl"
else
    echo "==> batctl already installed ($(command -v batctl))"
fi

echo "==> Creating 'battery' group and adding $USER..."
sudo groupadd -f battery
sudo usermod -aG battery "$USER"

echo "==> Installing udev rules..."
sudo cp "$REPO_ROOT/udev/99-threshpad.rules" /etc/udev/rules.d/
sudo udevadm control --reload-rules
sudo udevadm trigger

echo "==> Installing sudoers rule for batctl..."
BATCTL_PATH="$(command -v batctl)"
echo "$USER ALL=(ALL) NOPASSWD: $BATCTL_PATH set *" \
    | sudo tee /etc/sudoers.d/threshpad > /dev/null
sudo chmod 0440 /etc/sudoers.d/threshpad

echo "==> Installing GNOME extension..."
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/threshpad@looselyhuman"
mkdir -p "$EXTENSION_DIR"
cp -r "$REPO_ROOT/extension/"* "$EXTENSION_DIR/"

# Compile GSettings schema
glib-compile-schemas "$EXTENSION_DIR/schemas/"

echo ""
echo "Done. Next steps:"
echo "  1. Log out and back in for group membership to take effect."
echo "  2. Enable the extension: gnome-extensions enable threshpad@looselyhuman"
echo ""
echo "Note: Disable 'Charge Limit' in GNOME Settings → Power to avoid conflicts."
