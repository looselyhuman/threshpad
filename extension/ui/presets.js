import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const MOCK = GLib.getenv('THRESHPAD_MOCK') === '1';

const BATCTL = GLib.find_program_in_path('batctl');
const PKEXEC = GLib.find_program_in_path('pkexec');

/**
 * Preset mode definitions, keyed by battery name.
 * Batteries absent from the running system are silently skipped at apply time.
 *
 * @type {Object.<string, { label: string, BAT0?: {start:number,stop:number}, BAT1?: {start:number,stop:number} }>}
 */
export const PRESETS = {
    'Desk Mode': {
        label: 'Desk Mode',
        BAT0: { start: 40, stop: 50 },
        BAT1: { start: 40, stop: 50 },
    },
    'Balanced': {
        label: 'Balanced',
        BAT0: { start: 75, stop: 80 },
        BAT1: { start: 75, stop: 80 },
    },
    'Travel Prep': {
        label: 'Travel Prep',
        BAT0: { start: 0, stop: 100 },
        BAT1: { start: 0, stop: 100 },
    },
};

/**
 * Format a preset's threshold range for display next to its name.
 * If all batteries share the same values, shows once; otherwise per-battery.
 *
 * @param {object} preset
 * @param {string[]} batteries - detected battery names
 * @returns {string} e.g. "(75–80)" or "(BAT0: 40–50, BAT1: 75–80)"
 */
export function presetSummary(preset, batteries) {
    const entries = batteries
        .filter(b => preset[b])
        .map(b => ({ bat: b, ...preset[b] }));

    if (entries.length === 0) return '';

    const allSame = entries.every(
        e => e.start === entries[0].start && e.stop === entries[0].stop
    );

    if (allSame)
        return `(${entries[0].start}–${entries[0].stop})`;

    return `(${entries.map(e => `${e.bat}: ${e.start}–${e.stop}`).join(', ')})`;
}

/**
 * Invoke batctl via pkexec to set charge thresholds.
 * No-ops in mock mode. With allow_active=yes in the polkit policy,
 * no password prompt appears for active desktop sessions.
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
    if (!PKEXEC) {
        logError(new Error('pkexec not found in PATH'), 'threshpad: pkexec required to invoke batctl');
        return;
    }
    try {
        const proc = Gio.Subprocess.new(
            [PKEXEC, BATCTL, 'set', '--start', String(start), '--stop', String(stop)],
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
 * @param {object} preset
 * @param {string[]} detectedBatteries
 */
export function applyPreset(preset, detectedBatteries) {
    for (const bat of detectedBatteries) {
        if (preset[bat])
            runBatctl(preset[bat]);
    }
}
