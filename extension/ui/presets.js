import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const BATCTL = '/usr/local/bin/batctl';
const MOCK = GLib.getenv('THRESHPAD_MOCK') === '1';

/**
 * Preset mode definitions.
 * Each entry is { bat0: { start, stop }, bat1: { start, stop } }.
 *
 * @type {Object.<string, { bat0: {start: number, stop: number}, bat1: {start: number, stop: number} }>}
 */
export const PRESETS = {
    'Desk Mode': {
        bat0: { start: 40, stop: 50 },
        bat1: { start: 75, stop: 80 },
    },
    'Balanced': {
        bat0: { start: 75, stop: 80 },
        bat1: { start: 75, stop: 80 },
    },
    'Travel Prep': {
        bat0: { start: 0, stop: 100 },
        bat1: { start: 0, stop: 100 },
    },
};

/**
 * Invoke batctl to set charge thresholds.
 * No-ops in mock mode.
 *
 * @param {{ start: number, stop: number }} thresholds
 */
function runBatctl({ start, stop }) {
    if (MOCK) {
        log(`threshpad [mock]: batctl set --start ${start} --stop ${stop}`);
        return;
    }
    try {
        const proc = Gio.Subprocess.new(
            [BATCTL, 'set', '--start', String(start), '--stop', String(stop)],
            Gio.SubprocessFlags.STDERR_PIPE
        );
        proc.wait_check_async(null, (_proc, res) => {
            try {
                _proc.wait_check_finish(res);
            } catch (e) {
                logError(e, 'threshpad: batctl set failed');
            }
        });
    } catch (e) {
        logError(e, 'threshpad: failed to spawn batctl');
    }
}

/**
 * Apply a preset by running batctl for each battery defined in the preset.
 *
 * @param {{ bat0: {start: number, stop: number}, bat1?: {start: number, stop: number} }} preset
 */
export function applyPreset(preset) {
    runBatctl(preset.bat0);
    if (preset.bat1) {
        // BAT1 control needs hardware verification — may be a no-op on some T480s
        runBatctl(preset.bat1);
    }
}
