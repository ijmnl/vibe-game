/**
 * Audio Manager - Handles sound effects and music
 * Uses Web Audio API for better control
 */

class AudioManager {
    constructor() {
        this.context = null;
        this.master = null;
        this.musicGain = null;
        this.musicVoices = [];
        this.currentTrack = null;
        this.muted = false;
        this.volume = 0.5;

        this.init();
    }

    init() {
        try {
            const Context = window.AudioContext || window.webkitAudioContext;
            this.context = new Context();

            this.master = this.context.createGain();
            this.master.gain.value = this.volume;
            this.master.connect(this.context.destination);

            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = 0.16;
            this.musicGain.connect(this.master);
        } catch (e) {
            console.warn('Web Audio not available:', e);
        }
    }

    get ready() {
        return !!this.context && this.context.state === 'running' && !this.muted;
    }

    // --- music --------------------------------------------------------------

    // Each zone gets its own little loop, built from a short note sequence
    static TRACKS = {
        GRASS:   { notes: [262, 330, 392, 330, 294, 349, 440, 349], tempo: 0.34, wave: 'triangle' },
        FOREST:  { notes: [220, 262, 330, 262, 196, 247, 294, 247], tempo: 0.40, wave: 'sine' },
        WATER:   { notes: [294, 370, 440, 370, 330, 415, 494, 415], tempo: 0.44, wave: 'sine' },
        CAVE:    { notes: [147, 175, 196, 175, 131, 165, 196, 165], tempo: 0.50, wave: 'triangle' },
        SAND:    { notes: [233, 277, 349, 277, 208, 262, 311, 262], tempo: 0.38, wave: 'square' },
        VILLAGE: { notes: [349, 440, 523, 440, 392, 494, 587, 494], tempo: 0.30, wave: 'triangle' },
        BATTLE:  { notes: [330, 330, 392, 440, 392, 330, 294, 262], tempo: 0.19, wave: 'square' }
    };

    playZoneMusic(zone) {
        this.playTrack(AudioManager.TRACKS[zone] ? zone : 'GRASS');
    }

    playBattleMusic() {
        this.playTrack('BATTLE');
    }

    playTrack(name) {
        if (!this.context || this.currentTrack === name) return;

        this.currentTrack = name;
        this.stopMusic();

        if (this.muted || this.context.state !== 'running') return;

        const track = AudioManager.TRACKS[name];
        const startAt = this.context.currentTime + 0.05;
        const loopLength = track.notes.length * track.tempo;

        // Two passes are scheduled ahead and refreshed on a timer, which keeps
        // the loop seamless without holding a node per note forever.
        this.scheduleLoop(track, startAt, loopLength);
        this.musicTimer = setInterval(() => {
            if (this.currentTrack !== name || !this.ready) return;
            this.scheduleLoop(track, this.context.currentTime + 0.05, loopLength);
        }, loopLength * 1000);
    }

    scheduleLoop(track, startAt, loopLength) {
        track.notes.forEach((frequency, index) => {
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();

            oscillator.type = track.wave;
            oscillator.frequency.value = frequency;

            const at = startAt + index * track.tempo;
            gain.gain.setValueAtTime(0, at);
            gain.gain.linearRampToValueAtTime(0.5, at + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, at + track.tempo * 0.9);

            oscillator.connect(gain);
            gain.connect(this.musicGain);
            oscillator.start(at);
            oscillator.stop(at + track.tempo);

            this.musicVoices.push(oscillator);
        });

        // Drop references to notes that have already finished
        if (this.musicVoices.length > 64) {
            this.musicVoices = this.musicVoices.slice(-32);
        }
    }

    stopMusic() {
        clearInterval(this.musicTimer);
        this.musicTimer = null;

        this.musicVoices.forEach(voice => {
            try { voice.stop(); } catch (e) { /* already stopped */ }
        });
        this.musicVoices = [];
    }

    // --- sound effects ------------------------------------------------------

    static SFX = {
        attack:  { frequency: 320, to: 160, duration: 0.12, wave: 'square',   gain: 0.28 },
        hit:     { frequency: 180, to: 70,  duration: 0.16, wave: 'sawtooth', gain: 0.30 },
        faint:   { frequency: 300, to: 60,  duration: 0.45, wave: 'triangle', gain: 0.26 },
        throw:   { frequency: 420, to: 700, duration: 0.18, wave: 'sine',     gain: 0.24 },
        caught:  { frequency: 520, to: 880, duration: 0.30, wave: 'triangle', gain: 0.30 },
        heal:    { frequency: 440, to: 880, duration: 0.28, wave: 'sine',     gain: 0.26 },
        buy:     { frequency: 660, to: 990, duration: 0.14, wave: 'square',   gain: 0.22 },
        shop:    { frequency: 392, to: 587, duration: 0.22, wave: 'triangle', gain: 0.22 },
        victory: { frequency: 523, to: 1047, duration: 0.42, wave: 'square',  gain: 0.26 }
    };

    playSfx(name) {
        if (!this.ready) return;

        const sfx = AudioManager.SFX[name];
        if (!sfx) return;

        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        const now = this.context.currentTime;

        oscillator.type = sfx.wave;
        oscillator.frequency.setValueAtTime(sfx.frequency, now);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, sfx.to), now + sfx.duration);

        gain.gain.setValueAtTime(sfx.gain, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + sfx.duration);

        oscillator.connect(gain);
        gain.connect(this.master);
        oscillator.start(now);
        oscillator.stop(now + sfx.duration);
    }

    // --- controls -----------------------------------------------------------

    toggleMute() {
        this.muted = !this.muted;

        if (this.master) {
            this.master.gain.value = this.muted ? 0 : this.volume;
        }

        if (this.muted) {
            this.stopMusic();
        } else {
            const track = this.currentTrack;
            this.currentTrack = null;
            if (track) this.playTrack(track);
        }

        return this.muted;
    }

    setVolume(volume) {
        this.volume = clamp(volume, 0, 1);
        if (this.master && !this.muted) this.master.gain.value = this.volume;
    }

    // Called after the first user gesture; music cannot start before that
    resume() {
        if (!this.context) return Promise.resolve();

        return this.context.resume().then(() => {
            const track = this.currentTrack;
            this.currentTrack = null;
            if (track) this.playTrack(track);
        }).catch(() => {});
    }
}

// Singleton instance
const audioManager = new AudioManager();
