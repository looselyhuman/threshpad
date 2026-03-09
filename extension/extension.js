import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { ThreshpadPanel } from './ui/panel.js';

export default class ThreshpadExtension extends Extension {
    enable() {
        this._panel = new ThreshpadPanel(this);
        Main.panel.addToStatusArea(this.uuid, this._panel);
    }

    disable() {
        this._panel?.destroy();
        this._panel = null;
    }
}
