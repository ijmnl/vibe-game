/**
 * Audio Manager - Handles sound effects and music
 * Uses Web Audio API for better control
 */

class AudioManager {
    constructor() {
        this.context = null;
        this.musicPlaying = false;
        this.musicNode = null;
        this.sfxNodes = [];
        this.volume = 0.5;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.7;
        
        // Create audio context on first interaction
        this.init();
    }

    init() {
        // Create audio context
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
            // Fallback to HTML5 audio
            this.useFallback = true;
        }
    }

    // Play background music
    playMusic(track = 'overworld') {
        if (this.musicPlaying) {
            this.stopMusic();
        }

        if (this.useFallback) {
            this.playFallbackMusic(track);
            return;
        }

        // Create oscillator for simple music
        this.musicNode = this.createMusicTrack(track);
        
        // Create gain node for volume control
        const gainNode = this.context.createGain();
        gainNode.gain.value = this.musicVolume * this.volume;
        
        this.musicNode.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        this.musicPlaying = true;
    }

    createMusicTrack(track) {
        // Create a simple procedural music track
        const oscillator1 = this.context.createOscillator();
        const oscillator2 = this.context.createOscillator();
        const oscillator3 = this.context.createOscillator();
        
        const gain1 = this.context.createGain();
        const gain2 = this.context.createGain();
        const gain3 = this.context.createGain();
        
        // Set up oscillators based on track type
        switch (track) {
            case 'overworld':
                oscillator1.frequency.setValueAtTime(261.63, this.context.currentTime); // C4
                oscillator2.frequency.setValueAtTime(329.63, this.context.currentTime); // E4
                oscillator3.frequency.setValueAtTime(392.00, this.context.currentTime); // G4
                
                oscillator1.type = 'sine';
                oscillator2.type = 'sine';
                oscillator3.type = 'sine';
                
                gain1.gain.setValueAtTime(0.3, this.context.currentTime);
                gain2.gain.setValueAtTime(0.2, this.context.currentTime);
                gain3.gain.setValueAtTime(0.1, this.context.currentTime);
                break;
                
            case 'battle':
                oscillator1.frequency.setValueAtTime(196.00, this.context.currentTime); // G3
                oscillator2.frequency.setValueAtTime(246.94, this.context.currentTime); // B3
                oscillator3.frequency.setValueAtTime(329.63, this.context.currentTime); // E4
                
                oscillator1.type = 'square';
                oscillator2.type = 'square';
                oscillator3.type = 'sawtooth';
                
                gain1.gain.setValueAtTime(0.2, this.context.currentTime);
                gain2.gain.setValueAtTime(0.2, this.context.currentTime);
                gain3.gain.setValueAtTime(0.15, this.context.currentTime);
                break;
                
            case 'victory':
                oscillator1.frequency.setValueAtTime(523.25, this.context.currentTime); // C5
                oscillator2.frequency.setValueAtTime(659.25, this.context.currentTime); // E5
                oscillator3.frequency.setValueAtTime(783.99, this.context.currentTime); // G5
                
                oscillator1.type = 'sine';
                oscillator2.type = 'sine';
                oscillator3.type = 'sine';
                
                gain1.gain.setValueAtTime(0.2, this.context.currentTime);
                gain2.gain.setValueAtTime(0.15, this.context.currentTime);
                gain3.gain.setValueAtTime(0.1, this.context.currentTime);
                break;
        }
        
        // Connect oscillators
        oscillator1.connect(gain1);
        oscillator2.connect(gain2);
        oscillator3.connect(gain3);
        
        oscillator1.start();
        oscillator2.start();
        oscillator3.start();
        
        // Create a master gain node
        const masterGain = this.context.createGain();
        gain1.connect(masterGain);
        gain2.connect(masterGain);
        gain3.connect(masterGain);
        
        return masterGain;
    }

    playFallbackMusic(track) {
        // Simple fallback using HTML5 audio
        // In a real implementation, we'd have actual audio files
        console.log('Playing fallback music:', track);
    }

    // Stop background music
    stopMusic() {
        if (!this.musicPlaying) return;

        if (this.musicNode) {
            // Disconnect and stop all oscillators
            // This is a simplified approach
            this.musicNode.disconnect();
            this.musicNode = null;
        }

        this.musicPlaying = false;
    }

    // Play sound effect
    playSFX(sfxType) {
        if (this.useFallback) {
            this.playFallbackSFX(sfxType);
            return;
        }

        let oscillator = null;
        let gainNode = null;

        switch (sfxType) {
            case 'attack':
                oscillator = this.createAttackSound();
                break;
                
            case 'catch':
                oscillator = this.createCatchSound();
                break;
                
            case 'levelup':
                oscillator = this.createLevelUpSound();
                break;
                
            case 'heal':
                oscillator = this.createHealSound();
                break;
                
            case 'encounter':
                oscillator = this.createEncounterSound();
                break;
                
            case 'run':
                oscillator = this.createRunSound();
                break;
                
            default:
                oscillator = this.createBeepSound();
        }

        if (oscillator) {
            gainNode = this.context.createGain();
            gainNode.gain.setValueAtTime(this.sfxVolume * this.volume, this.context.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            this.sfxNodes.push({ oscillator, gainNode });
            
            // Clean up after sound finishes
            oscillator.onended = () => {
                this.cleanupSFX(oscillator, gainNode);
            };
            
            oscillator.start();
        }
    }

    createAttackSound() {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        
        oscillator.frequency.setValueAtTime(800, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.1);
        oscillator.type = 'sawtooth';
        
        gain.gain.setValueAtTime(0.5, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        oscillator.connect(gain);
        
        return oscillator;
    }

    createCatchSound() {
        const oscillator = this.context.createOscillator();
        
        oscillator.frequency.setValueAtTime(1000, this.context.currentTime);
        oscillator.frequency.setValueAtTime(1500, this.context.currentTime + 0.1);
        oscillator.type = 'sine';
        
        return oscillator;
    }

    createLevelUpSound() {
        const oscillator1 = this.context.createOscillator();
        const oscillator2 = this.context.createOscillator();
        const gain = this.context.createGain();
        
        oscillator1.frequency.setValueAtTime(523.25, this.context.currentTime); // C5
        oscillator2.frequency.setValueAtTime(783.99, this.context.currentTime); // G5
        
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
        
        oscillator1.connect(gain);
        oscillator2.connect(gain);
        
        oscillator1.start();
        oscillator2.start();
        
        return oscillator1; // Return one, we'll clean up both
    }

    createHealSound() {
        const oscillator = this.context.createOscillator();
        
        oscillator.frequency.setValueAtTime(440, this.context.currentTime);
        oscillator.frequency.setValueAtTime(660, this.context.currentTime + 0.2);
        oscillator.type = 'sine';
        
        return oscillator;
    }

    createEncounterSound() {
        const oscillator = this.context.createOscillator();
        
        oscillator.frequency.setValueAtTime(200, this.context.currentTime);
        oscillator.frequency.setValueAtTime(400, this.context.currentTime + 0.1);
        oscillator.type = 'square';
        
        return oscillator;
    }

    createRunSound() {
        const oscillator = this.context.createOscillator();
        
        oscillator.frequency.setValueAtTime(600, this.context.currentTime);
        oscillator.frequency.setValueAtTime(300, this.context.currentTime + 0.1);
        oscillator.type = 'triangle';
        
        return oscillator;
    }

    createBeepSound() {
        const oscillator = this.context.createOscillator();
        oscillator.frequency.setValueAtTime(880, this.context.currentTime);
        oscillator.type = 'sine';
        return oscillator;
    }

    cleanupSFX(oscillator, gainNode) {
        const index = this.sfxNodes.findIndex(node => 
            node.oscillator === oscillator && node.gainNode === gainNode
        );
        
        if (index > -1) {
            this.sfxNodes.splice(index, 1);
        }
        
        try {
            oscillator.disconnect();
            gainNode.disconnect();
        } catch (e) {
            // Already disconnected
        }
    }

    // Set master volume
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.musicPlaying && this.musicNode) {
            // Would need to update all music nodes
        }
    }

    // Set music volume
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }

    // Set SFX volume
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    // Toggle mute
    toggleMute() {
        this.volume = this.volume > 0 ? 0 : 0.5;
    }
}

// Singleton instance
const audioManager = new AudioManager();
