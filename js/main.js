// Main game initialization
const gameConfig = {
    type: Phaser.AUTO,
    width: CONFIG.GAME_WIDTH,
    height: CONFIG.GAME_HEIGHT,
    parent: 'game-container',
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
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Initialize AudioManager globally
const audioManager = new AudioManager();

// Create game instance
const game = new Phaser.Game(gameConfig);

// Global game state
const gameState = {
    player: null,
    world: null,
    saveData: null
};

// Save game state
function saveGame() {
    if (!gameState.player) return;
    
    const saveData = gameState.player.getSaveData();
    localStorage.setItem('pixelMonsterAdventureSave', JSON.stringify(saveData));
    console.log('Game saved!');
}

// Load game state
function loadGame() {
    const saveData = localStorage.getItem('pixelMonsterAdventureSave');
    if (saveData) {
        try {
            gameState.saveData = JSON.parse(saveData);
            console.log('Game loaded!');
            return gameState.saveData;
        } catch (e) {
            console.error('Error loading save:', e);
            return null;
        }
    }
    return null;
}

// Delete save
function deleteSave() {
    localStorage.removeItem('pixelMonsterAdventureSave');
    gameState.saveData = null;
    console.log('Save deleted!');
}

// Auto-save every minute
setInterval(saveGame, 60000);

// Handle window resize
window.addEventListener('resize', () => {
    // Update minimap size if needed
    const minimap = document.getElementById('minimap');
    if (minimap) {
        const container = document.getElementById('minimap-container');
        if (container) {
            minimap.width = container.clientWidth;
            minimap.height = container.clientHeight;
        }
    }
});

// Initialize game with saved data if available
window.addEventListener('load', () => {
    const saveData = loadGame();
    if (saveData) {
        // Game will load save data in WorldScene
        console.log('Loaded save data:', saveData);
    }
});
