#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

BATCTL_VERSION="v2026.3.11"
BATCTL_INSTALL_PATH="/usr/local/bin/batctl"

# Detect architecture for download URL
ARCH="$(uname -m)"
case "$ARCH" in
    x86_64)  BATCTL_ARCH="linux-x86_64" ;;
    aarch64) BATCTL_ARCH="linux-arm64" ;;
    *)
        echo "WARNING: Unsupported architecture '$ARCH'."
        echo "         Pre-built batctl is only available for x86_64 and arm64."
        echo "         Install batctl manually, then re-run this script."
        exit 1
        ;;
esac

BATCTL_URL="https://github.com/Ooooze/batctl/releases/download/${BATCTL_VERSION}/batctl-${BATCTL_VERSION#v}-${BATCTL_ARCH}.tar.gz"

# Check for required tools
for cmd in curl tar glib-compile-schemas; do
    if ! command -v "$cmd" &>/dev/null; then
        echo "ERROR: '$cmd' is required but not found. Install it and re-run."
        exit 1
    fi
done

# Always ensure batctl is at the polkit-expected path (/usr/local/bin/batctl).
# If batctl already lives elsewhere (e.g. /usr/bin/batctl from a package manager),
# we still install our copy at the fixed path so the polkit exec.path matches.
if [[ -x "$BATCTL_INSTALL_PATH" ]]; then
    echo "==> batctl already at $BATCTL_INSTALL_PATH, skipping download"
else
    echo "==> Installing batctl ${BATCTL_VERSION} (${BATCTL_ARCH})..."
    TMP=$(mktemp -d)
    trap 'rm -rf "$TMP"' EXIT
    curl -fsSL "$BATCTL_URL" -o "$TMP/batctl.tar.gz"
    tar -xzf "$TMP/batctl.tar.gz" -C "$TMP"
    sudo install -m 755 "$TMP/batctl" "$BATCTL_INSTALL_PATH"
    echo "    batctl installed to $BATCTL_INSTALL_PATH"
fi

echo "==> Installing polkit policy for batctl..."
sudo cp "$REPO_ROOT/polkit/org.threshpad.batctl.policy" \
    /usr/share/polkit-1/actions/

echo "==> Installing udev rules..."
sudo cp "$REPO_ROOT/udev/99-threshpad.rules" /etc/udev/rules.d/
sudo udevadm control --reload-rules
sudo udevadm trigger

echo "==> Installing GNOME extension..."
EXTENSION_UUID="threshpad@looselyhuman"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"
mkdir -p "$EXTENSION_DIR"
cp -r "$REPO_ROOT/extension/"* "$EXTENSION_DIR/"

echo "==> Compiling GSettings schema..."
glib-compile-schemas "$EXTENSION_DIR/schemas/"

echo "==> Enabling extension..."
if command -v gnome-extensions &>/dev/null; then
    gnome-extensions enable "$EXTENSION_UUID" 2>/dev/null && \
        echo "    Extension enabled." || \
        echo "    Could not auto-enable (GNOME Shell may not be running). Enable manually via the Extensions app."
else
    echo "    gnome-extensions not found — enable manually via the Extensions app (org.gnome.Extensions)."
fi

echo ""
echo "======================================================"
echo " Installation complete!"
echo "======================================================"
echo ""
echo " IMPORTANT: Log out and back in to activate threshpad."
echo ""
echo " If battery thresholds don't change after applying a preset:"
echo "   → Open GNOME Settings → Power and disable 'Charge Limit'."
echo "   → Run: batctl detect    (shows any conflicts)"
echo "======================================================"
