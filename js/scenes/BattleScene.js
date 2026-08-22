class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
        
        this.player = null;
        this.wildMonster = null;
        this.zone = null;
        this.worldScene = null;
        this.battleSystem = null;
        this.uiManager = null;
    }

    preload() {
        // Preload any battle-specific assets
    }

    init(data) {
        this.player = data.player;
        this.wildMonster = data.wildMonster;
        this.zone = data.zone;
        this.worldScene = data.worldScene;
    }

    create() {
        // Set up background
        this.createBackground();
        
        // Set up battle system
        this.battleSystem = this.worldScene.battleSystem;
        
        // Set up UI
        this.uiManager = this.worldScene.uiManager;
        
        // Position monsters for battle
        this.positionMonsters();
        
        // Start battle
        this.battleSystem.startBattle(this.player, this.wildMonster);
        
        // Set up event listeners
        this.setupEventListeners();
    }

    createBackground() {
        // Create battle background based on zone
        const zoneColor = CONFIG.ZONES[this.zone]?.color || CONFIG.COLORS.grass;
        
        // Darken the color for battle background
        const r = Math.floor(((zoneColor >> 16) & 0xff) * 0.5);
        const g = Math.floor(((zoneColor >> 8) & 0xff) * 0.5);
        const b = Math.floor((zoneColor & 0xff) * 0.5);
        const bgColor = (r << 16) | (g << 8) | b;
        
        this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            bgColor
        ).setOrigin(0.5, 0.5);
        
        // Add some decorative elements
        this.createBattleDecorations();
    }

    createBattleDecorations() {
        // Create some simple decorations based on zone
        const decorations = {
            'GRASS': this.createGrassDecorations.bind(this),
            'FOREST': this.createForestDecorations.bind(this),
            'WATER': this.createWaterDecorations.bind(this),
            'CAVE': this.createCaveDecorations.bind(this),
            'SAND': this.createSandDecorations.bind(this)
        };
        
        const decorator = decorations[this.zone] || decorations['GRASS'];
        decorator();
    }

    createGrassDecorations() {
        // Draw some grass tufts
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.cameras.main.width * 0.8 + this.cameras.main.width * 0.1;
            const y = Math.random() * this.cameras.main.height * 0.6 + this.cameras.main.height * 0.2;
            const size = Math.random() * 20 + 10;
            
            this.add.ellipse(x, y, size, size * 0.5, 0x228b22);
        }
    }

    createForestDecorations() {
        // Draw some trees
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * this.cameras.main.width * 0.8 + this.cameras.main.width * 0.1;
            const y = Math.random() * this.cameras.main.height * 0.6 + this.cameras.main.height * 0.2;
            
            // Tree trunk
            this.add.rectangle(x, y + 10, 10, 20, 0x8b4513);
            // Tree leaves
            this.add.ellipse(x, y - 10, 20, 15, 0x228b22);
        }
    }

    createWaterDecorations() {
        // Draw water ripples
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * this.cameras.main.width;
            const y = Math.random() * this.cameras.main.height * 0.7 + this.cameras.main.height * 0.15;
            const size = Math.random() * 15 + 5;
            
            const ripple = this.add.ellipse(x, y, size, size * 0.6, 0x1e90ff);
            
            // Animate ripple
            this.tweens.add({
                targets: ripple,
                alpha: 0,
                duration: 2000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1
            });
        }
    }

    createCaveDecorations() {
        // Draw stalactites and stalagmites
        for (let i = 0; i < 5; i++) {
            // Stalactites (from ceiling)
            const x1 = Math.random() * this.cameras.main.width * 0.8 + this.cameras.main.width * 0.1;
            const y1 = Math.random() * this.cameras.main.height * 0.3;
            const h1 = Math.random() * 30 + 20;
            
            this.add.rectangle(x1, y1, 5, h1, 0x696969);
            
            // Stalagmites (from floor)
            const x2 = Math.random() * this.cameras.main.width * 0.8 + this.cameras.main.width * 0.1;
            const y2 = this.cameras.main.height - Math.random() * this.cameras.main.height * 0.3;
            const h2 = Math.random() * 30 + 20;
            
            this.add.rectangle(x2, y2, 5, h2, 0x696969);
        }
    }

    createSandDecorations() {
        // Draw some cacti or rocks
        for (let i = 0; i < 4; i++) {
            const x = Math.random() * this.cameras.main.width * 0.8 + this.cameras.main.width * 0.1;
            const y = Math.random() * this.cameras.main.height * 0.6 + this.cameras.main.height * 0.2;
            const size = Math.random() * 15 + 10;
            
            this.add.ellipse(x, y, size, size * 0.6, 0x8b4513);
        }
    }

    positionMonsters() {
        // Position wild monster (top of screen)
        this.wildMonster.setPosition(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100
        );
        
        // Position player monster (bottom of screen)
        const playerMonster = this.player.getCurrentMonster();
        if (playerMonster) {
            // Create a visual representation for the player's monster
            // For now, we'll just update the existing monster object
            playerMonster.setPosition(
                this.cameras.main.centerX,
                this.cameras.main.centerY + 80
            );
        }
    }

    setupEventListeners() {
        // Listen for battle end
        this.events.on('battle-end', (data) => {
            this.endBattle(data);
        });

        // Listen for catch attempt
        this.events.on('battle-catch-attempt', (data) => {
            this.showCatchAnimation(data);
        });

        // Listen for monster faint
        this.events.on('battle-monster-faint', (data) => {
            // Show monster faint animation
            this.showFaintAnimation(data.player.getCurrentMonster());
        });

        // Listen for monster switch
        this.events.on('battle-monster-switch', (data) => {
            this.updateMonsterPositions();
        });
    }

    showCatchAnimation(data) {
        // Create ball sprite
        const ball = this.add.circle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            20,
            0xff0000
        );
        
        // Animate ball throwing
        this.tweens.add({
            targets: ball,
            x: this.wildMonster.sprite.x,
            y: this.wildMonster.sprite.y,
            duration: 500,
            onComplete: () => {
                if (data.success) {
                    // Success - ball shakes then catches
                    this.tweens.add({
                        targets: ball,
                        scale: 1.2,
                        duration: 100,
                        yoyo: true,
                        repeat: 2,
                        onComplete: () => {
                            // Ball disappears
                            ball.destroy();
                        }
                    });
                } else {
                    // Failure - ball bounces back
                    this.tweens.add({
                        targets: ball,
                        x: this.cameras.main.centerX,
                        y: this.cameras.main.centerY,
                        duration: 300,
                        onComplete: () => {
                            ball.destroy();
                        }
                    });
                }
            }
        });
    }

    showFaintAnimation(monster) {
        if (!monster || !monster.sprite) return;
        
        // Flash the monster sprite
        this.tweens.add({
            targets: monster.sprite,
            alpha: 0,
            duration: 200,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                // Keep at low opacity
                monster.sprite.setAlpha(0.5);
            }
        });
    }

    updateMonsterPositions() {
        // Update positions of both monsters
        this.wildMonster.setPosition(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100
        );
        
        const playerMonster = this.player.getCurrentMonster();
        if (playerMonster) {
            playerMonster.setPosition(
                this.cameras.main.centerX,
                this.cameras.main.centerY + 80
            );
        }
    }

    endBattle(data) {
        // Clean up
        if (this.wildMonster) {
            this.wildMonster.destroy();
        }
        
        // Hide battle UI
        this.uiManager.hideBattleUI();
        
        // Return to world scene
        this.scene.stop();
        this.worldScene.resumeWorld();
        
        // Show result message
        switch (data.result) {
            case 'win':
                this.worldScene.uiManager.showMessage('Victory!', 2000);
                break;
            case 'catch':
                this.worldScene.uiManager.showMessage('Monster caught!', 2000);
                break;
            case 'run':
                this.worldScene.uiManager.showMessage('Escaped successfully!', 2000);
                break;
            case 'lose':
                // Handled by world scene
                break;
        }
    }

    update() {
        // Update battle system
        if (this.battleSystem) {
            this.battleSystem.update();
        }
    }
}
