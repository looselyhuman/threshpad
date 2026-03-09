import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const MOCK = GLib.getenv('THRESHPAD_MOCK') === '1';

// Locate batctl and sudo via PATH
const BATCTL = GLib.find_program_in_path('batctl');
const SUDO = GLib.find_program_in_path('sudo');

/**
 * Preset mode definitions, keyed by battery name.
 * Batteries absent from the running system are silently skipped at apply time.
 *
 * @type {Object.<string, Object.<string, {start: number, stop: number}>>}
 */
export const PRESETS = {
    'Desk Mode': {
        BAT0: { start: 40, stop: 50 },
        BAT1: { start: 75, stop: 80 },
    },
    'Balanced': {
        BAT0: { start: 75, stop: 80 },
        BAT1: { start: 75, stop: 80 },
    },
    'Travel Prep': {
        BAT0: { start: 0, stop: 100 },
        BAT1: { start: 0, stop: 100 },
    },
};

/**
 * Invoke batctl via sudo to set charge thresholds (requires NOPASSWD sudoers rule).
 * No-ops in mock mode.
 *
 * @param {{ start: number, stop: number }} thresholds
 */
function runBatctl({ start, stop }) {
    if (MOCK) {
        log(`threshpad [mock]: batctl set --start ${start} --stop ${stop}`);
        return;
    }
    if (!BATCTL) {
        logError(new Error('batctl not found in PATH'), 'threshpad: install batctl to apply presets');
        return;
    }
    if (!SUDO) {
        logError(new Error('sudo not found in PATH'), 'threshpad: sudo required to invoke batctl');
        return;
    }
    try {
        const proc = Gio.Subprocess.new(
            [SUDO, '-n', BATCTL, 'set', '--start', String(start), '--stop', String(stop)],
            Gio.SubprocessFlags.STDERR_PIPE
        );
        proc.communicate_utf8_async(null, null, (_proc, res) => {
            try {
                const [, , stderr] = _proc.communicate_utf8_finish(res);
                if (!_proc.get_successful()) {
                    log(`threshpad: batctl stderr: ${stderr?.trim()}`);
                    logError(new Error(`exit ${_proc.get_exit_status()}`), 'threshpad: batctl set failed');
                }
            } catch (e) {
                logError(e, 'threshpad: batctl set failed');
            }
        });
    } catch (e) {
        logError(e, 'threshpad: failed to spawn batctl');
    }
}

/**
 * Apply a preset for each detected battery that has an entry in the preset.
 * Batteries not present on this system are silently skipped.
 *
 * @param {Object.<string, {start: number, stop: number}>} preset
 * @param {string[]} detectedBatteries - e.g. ['BAT1'] or ['BAT0', 'BAT1']
 */
export function applyPreset(preset, detectedBatteries) {
    for (const bat of detectedBatteries) {
        if (preset[bat])
            runBatctl(preset[bat]);
    }
}
