import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { applyPreset, PRESETS } from './presets.js';

const POLL_INTERVAL_SECONDS = 30;

const MOCK = GLib.getenv('THRESHPAD_MOCK') === '1';
const SYSFS_BASE = MOCK
    ? GLib.build_filenamev([GLib.get_current_dir(), 'test/fixtures'])
    : '/sys/class/power_supply';

/**
 * Read a sysfs (or mock fixture) file and return its trimmed string value.
 * Returns null on any error.
 *
 * @param {string} path - Absolute path to the file.
 * @returns {string|null}
 */
function readSysfs(path) {
    try {
        const file = Gio.File.new_for_path(path);
        const [, contents] = file.load_contents(null);
        return new TextDecoder().decode(contents).trim();
    } catch (e) {
        logError(e, `threshpad: failed to read ${path}`);
        return null;
    }
}

/**
 * Read capacity and status for a given battery identifier.
 *
 * @param {string} bat - e.g. 'BAT0' or 'BAT1'
 * @returns {{ capacity: string|null, status: string|null }}
 */
function readBattery(bat) {
    const base = `${SYSFS_BASE}/${bat}`;
    return {
        capacity: readSysfs(`${base}/capacity`),
        status: readSysfs(`${base}/status`),
    };
}

/**
 * Top-bar panel button showing live battery state and preset actions.
 */
export class ThreshpadPanel extends PanelMenu.Button {
    constructor(extension) {
        super(0.0, 'threshpad');
        this._extension = extension;
        this._pollId = null;

        this._label = new St.Label({
            text: '⚡',
            y_align: 1, // Clutter.ActorAlign.CENTER
        });
        this.add_child(this._label);

        this._buildMenu();
        this._refresh();
        this._startPolling();
    }

    /** Build the popup menu structure. */
    _buildMenu() {
        // Status section
        this._bat0Item = new PopupMenu.PopupMenuItem('BAT0: —', { reactive: false });
        this._bat1Item = new PopupMenu.PopupMenuItem('BAT1: —', { reactive: false });
        this.menu.addMenuItem(this._bat0Item);
        this.menu.addMenuItem(this._bat1Item);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Presets
        for (const [name, preset] of Object.entries(PRESETS)) {
            const item = new PopupMenu.PopupMenuItem(name);
            item.connect('activate', () => {
                applyPreset(preset);
            });
            this.menu.addMenuItem(item);
        }
    }

    /** Poll battery state and update label + menu items. */
    _refresh() {
        const bat0 = readBattery('BAT0');
        const bat1 = readBattery('BAT1');

        const fmt = ({ capacity, status }) =>
            capacity !== null ? `${capacity}% (${status ?? '?'})` : 'N/A';

        const bat0Str = fmt(bat0);
        const bat1Str = fmt(bat1);

        const label = bat1.capacity !== null
            ? `⚡ ${bat0.capacity ?? '?'}% / ${bat1.capacity ?? '?'}%`
            : `⚡ ${bat0.capacity ?? '?'}%`;

        this._label.set_text(label);
        this._bat0Item.label.set_text(`BAT0: ${bat0Str}`);
        this._bat1Item.label.set_text(`BAT1: ${bat1Str}`);
    }

    _startPolling() {
        this._pollId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            POLL_INTERVAL_SECONDS,
            () => {
                this._refresh();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    destroy() {
        if (this._pollId !== null) {
            GLib.source_remove(this._pollId);
            this._pollId = null;
        }
        super.destroy();
    }
}
