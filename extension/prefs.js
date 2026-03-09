import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ThreshpadPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({ title: 'threshpad' });

        const label = new Gtk.Label({
            label: 'Preferences coming in Phase 2.',
        });
        group.add(label);
        page.add(group);
        window.add(page);
    }
}
