// Main game initialization
const gameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scene: [BootScene, WorldScene, BattleScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    render: {
        pixelArt: true,
        antialias: false
    },
    scale: {
        // Fill whatever screen we get instead of letterboxing a fixed 800x600
        // canvas - on a portrait phone that wasted most of the display.
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    }
};

// Global game state
const gameState = {
    player: null,
    world: null,
    saveData: null
};

const SAVE_KEY = 'pixelMonsterAdventureSave';

// Save game state
function saveGame() {
    if (!gameState.player) return;

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(gameState.player.getSaveData()));
    } catch (e) {
        // Private browsing on iOS can refuse writes - not worth breaking play over
        console.warn('Could not save game:', e);
    }
}

// Load game state
function loadGame() {
    try {
        const saveData = localStorage.getItem(SAVE_KEY);
        if (!saveData) return null;

        gameState.saveData = JSON.parse(saveData);
        return gameState.saveData;
    } catch (e) {
        console.warn('Error loading save:', e);
        return null;
    }
}

// Delete save
function deleteSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (e) {
        console.warn('Could not delete save:', e);
    }
    gameState.saveData = null;
}

// Read any previous session before the world scene builds the player
loadGame();

// Set up the on-screen controls before the game boots
touchControls.init();

// Create game instance
const game = new Phaser.Game(gameConfig);

// Auto-save every minute, and whenever the player leaves the page - phones
// suspend background tabs, so an interval alone loses progress.
setInterval(saveGame, 60000);

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveGame();
    }
});

window.addEventListener('pagehide', saveGame);

// Mobile browsers only allow audio to start from a user gesture
function unlockAudio() {
    if (audioManager.context && audioManager.context.state === 'suspended') {
        audioManager.context.resume().catch(() => {});
    }
}

document.addEventListener('pointerdown', unlockAudio, { once: true });
document.addEventListener('keydown', unlockAudio, { once: true });
