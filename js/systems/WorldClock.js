/**
 * The in-game clock.
 *
 * A full day passes in eight real minutes, which is short enough that a
 * player sees night fall in a single session but long enough that it is not
 * a strobe light. The clock is the reason to come back to a route you have
 * already cleared: some monsters only come out after dark.
 */
class WorldClock {
    // One full day in real milliseconds
    static DAY_MS = 8 * 60 * 1000;

    // Where each phase starts, as a fraction of the day
    static PHASES = [
        { at: 0.00, id: 'dawn',  label: 'Dawn',      icon: '\u{1F305}', tint: 0xffb47a, strength: 0.20 },
        { at: 0.12, id: 'day',   label: 'Daytime',   icon: '☀️',  tint: 0xffffff, strength: 0.00 },
        { at: 0.58, id: 'dusk',  label: 'Sundown',   icon: '\u{1F307}', tint: 0xff8a4a, strength: 0.26 },
        { at: 0.70, id: 'night', label: 'Nightfall', icon: '\u{1F319}', tint: 0x2a3a7a, strength: 0.52 }
    ];

    // The clock face starts at 05:00, so fraction 0 is sunrise rather than
    // midnight and the phase names line up with the hours shown.
    static CLOCK_START_HOUR = 5;

    constructor(startMs = null) {
        // Start mid-morning rather than at dawn, so a new game opens in
        // daylight instead of a colour wash the player has no context for.
        this.elapsed = Number.isFinite(startMs) ? startMs : WorldClock.DAY_MS * 0.22;
        this.paused = false;
    }

    advance(deltaMs) {
        if (this.paused) return false;

        const before = this.phase.id;
        this.elapsed = (this.elapsed + deltaMs) % WorldClock.DAY_MS;

        return this.phase.id !== before;
    }

    // 0 at the start of the day, approaching 1 at the end of it
    get fraction() {
        return (this.elapsed % WorldClock.DAY_MS) / WorldClock.DAY_MS;
    }

    get phase() {
        const fraction = this.fraction;

        // The last phase whose start we have passed
        return [...WorldClock.PHASES].reverse().find(phase => fraction >= phase.at)
            || WorldClock.PHASES[0];
    }

    get isNight() {
        return this.phase.id === 'night';
    }

    // Dawn and dusk read as daylight for anything that only cares about dark
    get isDark() {
        return this.phase.id === 'night' || this.phase.id === 'dusk';
    }

    // 24-hour clock face, purely for display
    get timeLabel() {
        const minutes = Math.floor((this.fraction * 24 + WorldClock.CLOCK_START_HOUR) * 60);
        const hours = Math.floor(minutes / 60) % 24;

        return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    }

    // Skip forward to the start of a phase - what a bed or a campfire does
    skipTo(phaseId) {
        const phase = WorldClock.PHASES.find(p => p.id === phaseId);
        if (!phase) return false;

        // Land a sliver past the boundary so `phase` reads back the same
        this.elapsed = (phase.at + 0.005) * WorldClock.DAY_MS;

        return true;
    }

    getSaveData() {
        return Math.round(this.elapsed);
    }
}

// The clock the running game is on, or null when there is none. Battle and
// encounter logic reach for this rather than the global directly, so the same
// code still runs in the test page where no game has been created.
function currentClock() {
    return (typeof gameState !== 'undefined' && gameState.clock) || null;
}
