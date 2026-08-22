class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Show loading screen
        this.createLoadingScreen();
        
        // Load any assets we might need
        // For now, we'll generate everything programmatically
        // Later we can add actual image loading here
        
        // Load pixel art tiles (placeholder - we'll generate these)
        // this.load.image('tiles', 'assets/tiles/tileset.png');
        // this.load.spritesheet('player', 'assets/sprites/player.png', { frameWidth: 32, frameHeight: 32 });
        
        // For now, just progress to next scene
        this.load.on('complete', () => {
            this.scene.start('WorldScene');
        });
        
        // Trigger complete event manually since we're not loading actual assets
        this.time.delayedCall(1000, () => {
            this.load.complete();
        });
    }

    create() {
        // This should not be reached as we transition to WorldScene in preload
    }

    createLoadingScreen() {
        // Create loading screen div
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        loadingScreen.innerHTML = `
            <h1 style="color: #ffcc00; font-family: 'Press Start 2P', cursive; margin: 0; font-size: 24px;">
                PIXEL MONSTER ADVENTURE
            </h1>
            <p style="color: #fff; margin: 10px 0;">Loading...</p>
            <div id="loading-progress" style="width: 300px; height: 30px; background: #333; border-radius: 15px; overflow: hidden;">
                <div id="loading-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #ff0000, #ffff00); border-radius: 15px; transition: width 0.3s ease;"></div>
            </div>
        `;
        
        document.body.appendChild(loadingScreen);
        
        // Animate loading bar
        const loadingBar = document.getElementById('loading-bar');
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += 10;
            if (progress > 90) {
                progress = 90;
            }
            loadingBar.style.width = `${progress}%`;
            
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 100);
        
        // Remove loading screen when scene changes
        this.scene.events.on('transitionout', () => {
            clearInterval(interval);
            loadingScreen.remove();
        });
    }
}
