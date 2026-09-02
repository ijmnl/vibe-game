class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
        this.loadingScreen = null;
        this.loadingInterval = null;
    }

    preload() {
        // Show loading screen
        this.createLoadingScreen();

        // Everything is generated programmatically for now, so there are no
        // real assets to load. Give the loading screen a moment, then continue.
        this.time.delayedCall(800, () => {
            this.removeLoadingScreen();
            this.scene.start('WorldScene');
        });
    }

    create() {
        // Nothing to do - we transition to WorldScene from preload()
    }

    createLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'loading-screen';
        loadingScreen.innerHTML = `
            <h1 class="loading-title">PIXEL MONSTER ADVENTURE</h1>
            <p class="loading-text">Loading...</p>
            <div id="loading-progress">
                <div id="loading-bar"></div>
            </div>
        `;

        document.body.appendChild(loadingScreen);
        this.loadingScreen = loadingScreen;

        // Animate loading bar
        const loadingBar = loadingScreen.querySelector('#loading-bar');
        let progress = 0;

        this.loadingInterval = setInterval(() => {
            progress = Math.min(progress + 15, 100);
            loadingBar.style.width = `${progress}%`;
            if (progress >= 100) {
                clearInterval(this.loadingInterval);
                this.loadingInterval = null;
            }
        }, 100);

        // Make sure the screen never gets stuck if the scene shuts down early
        this.events.once('shutdown', () => this.removeLoadingScreen());
    }

    removeLoadingScreen() {
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
        }
        if (this.loadingScreen) {
            this.loadingScreen.remove();
            this.loadingScreen = null;
        }
    }
}
