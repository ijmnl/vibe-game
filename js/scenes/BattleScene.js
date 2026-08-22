class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });

        this.player = null;
        this.wildMonster = null;
        this.zone = null;
        this.worldScene = null;
        this.battleSystem = null;
        this.uiManager = null;
        this.enemyView = null;
        this.playerView = null;
    }

    init(data) {
        this.player = data.player;
        this.wildMonster = data.wildMonster;
        this.zone = data.zone;
        this.worldScene = data.worldScene;
        this.enemyView = null;
        this.playerView = null;
    }

    create() {
        // Set up background
        this.createBackground();

        // Battle logic and the DOM UI both live on the world scene
        this.battleSystem = this.worldScene.battleSystem;
        this.uiManager = this.worldScene.uiManager;

        // Draw both combatants
        this.createMonsterViews();

        // Listen for battle events before the battle starts emitting them
        this.setupEventListeners();

        // Start battle. This scene owns the turn timers: the world scene is
        // paused, so delayed calls scheduled there would never fire.
        this.battleSystem.startBattle(this.player, this.wildMonster, this);

        // The panel is only measurable once the battle UI has been laid out
        this.time.delayedCall(0, () => this.positionMonsters());

        // Keep the battle centred when the phone is rotated
        this.scale.on('resize', this.handleResize, this);
        this.events.once('shutdown', () => {
            this.scale.off('resize', this.handleResize, this);
        });
    }

    createBackground() {
        // Create battle background based on zone
        const zoneColor = CONFIG.ZONES[this.zone]?.color || CONFIG.COLORS.grass;

        // Darken the color for battle background
        const r = Math.floor(((zoneColor >> 16) & 0xff) * 0.5);
        const g = Math.floor(((zoneColor >> 8) & 0xff) * 0.5);
        const b = Math.floor((zoneColor & 0xff) * 0.5);
        const bgColor = (r << 16) | (g << 8) | b;

        this.background = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            bgColor
        ).setOrigin(0.5, 0.5);

        // Add some decorative elements
        this.decorations = this.add.container(0, 0);
        this.createBattleDecorations();
    }

    createBattleDecorations() {
        // Create some simple decorations based on zone
        const decorations = {
            'GRASS': this.createGrassDecorations,
            'FOREST': this.createForestDecorations,
            'WATER': this.createWaterDecorations,
            'CAVE': this.createCaveDecorations,
            'SAND': this.createSandDecorations
        };

        const decorator = decorations[this.zone] || decorations['GRASS'];
        decorator.call(this);
    }

    createGrassDecorations() {
        // Draw some grass tufts
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * this.scale.width * 0.8 + this.scale.width * 0.1;
            const y = Math.random() * this.scale.height * 0.6 + this.scale.height * 0.2;
            const size = Math.random() * 20 + 10;

            this.decorations.add(this.add.ellipse(x, y, size, size * 0.5, 0x228b22));
        }
    }

    createForestDecorations() {
        // Draw some trees
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * this.scale.width * 0.8 + this.scale.width * 0.1;
            const y = Math.random() * this.scale.height * 0.6 + this.scale.height * 0.2;

            this.decorations.add(this.add.rectangle(x, y + 10, 10, 20, 0x8b4513));
            this.decorations.add(this.add.ellipse(x, y - 10, 20, 15, 0x228b22));
        }
    }

    createWaterDecorations() {
        // Draw water ripples
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * this.scale.width;
            const y = Math.random() * this.scale.height * 0.7 + this.scale.height * 0.15;
            const size = Math.random() * 15 + 5;

            const ripple = this.add.ellipse(x, y, size, size * 0.6, 0x1e90ff);
            this.decorations.add(ripple);

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
            const x1 = Math.random() * this.scale.width * 0.8 + this.scale.width * 0.1;
            const y1 = Math.random() * this.scale.height * 0.3;
            const h1 = Math.random() * 30 + 20;

            this.decorations.add(this.add.rectangle(x1, y1, 5, h1, 0x696969));

            const x2 = Math.random() * this.scale.width * 0.8 + this.scale.width * 0.1;
            const y2 = this.scale.height - Math.random() * this.scale.height * 0.3;
            const h2 = Math.random() * 30 + 20;

            this.decorations.add(this.add.rectangle(x2, y2, 5, h2, 0x696969));
        }
    }

    createSandDecorations() {
        // Draw some cacti or rocks
        for (let i = 0; i < 4; i++) {
            const x = Math.random() * this.scale.width * 0.8 + this.scale.width * 0.1;
            const y = Math.random() * this.scale.height * 0.6 + this.scale.height * 0.2;
            const size = Math.random() * 15 + 10;

            this.decorations.add(this.add.ellipse(x, y, size, size * 0.6, 0x8b4513));
        }
    }

    // Build the sprite + label pair this scene uses to show one monster
    createMonsterView(monster) {
        const sprite = this.add.rectangle(0, 0, 1, 1, monster.getColor());
        sprite.setOrigin(0.5, 0.5);
        sprite.setDepth(20);

        const label = this.add.text(0, 0, `${monster.name} Lv.${monster.level}`, {
            fontFamily: 'monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        label.setOrigin(0.5, 0.5);
        label.setDepth(25);

        // positionMonsters() gives both a size that fits the current screen
        return { sprite, label, monster };
    }

    createMonsterViews() {
        this.enemyView = this.createMonsterView(this.wildMonster);

        const playerMonster = this.player.getCurrentMonster();
        if (playerMonster) {
            this.playerView = this.createMonsterView(playerMonster);
        }

        this.positionMonsters();
    }

    positionMonsters() {
        // The DOM battle panel takes most of a phone screen, so both monsters
        // are sized and stacked to fit whatever strip is left above it. A
        // landscape phone leaves far less room than a portrait one.
        const centerX = this.scale.width / 2;
        const available = this.getSpaceAbovePanel();

        const size = Phaser.Math.Clamp(available / 4, 18, CONFIG.TILE_SIZE * 2);
        const labelRoom = size * 0.75;
        const rowHeight = size + labelRoom;
        const top = Math.max(labelRoom, (available - rowHeight * 2) / 2 + labelRoom);

        this.setViewPosition(
            this.enemyView,
            centerX + this.scale.width * 0.18,
            top + size / 2,
            size,
            labelRoom
        );
        this.setViewPosition(
            this.playerView,
            centerX - this.scale.width * 0.18,
            top + rowHeight + size / 2,
            size,
            labelRoom
        );
    }

    // Height of the strip between the top of the screen and the battle panel
    getSpaceAbovePanel() {
        const panel = document.querySelector('#battle-ui .battle-panel');
        const fallback = this.scale.height * 0.4;

        if (!panel) return fallback;

        const panelTop = panel.getBoundingClientRect().top;
        if (!panelTop) return fallback;

        // Convert CSS pixels to the game's canvas coordinates
        const scaled = panelTop * (this.scale.height / this.scale.parentSize.height || 1);

        return Math.max(CONFIG.TILE_SIZE * 3, scaled - CONFIG.TILE_SIZE * 2);
    }

    setViewPosition(view, x, y, size, labelRoom) {
        if (!view) return;

        view.sprite.setPosition(x, y);
        view.sprite.setDisplaySize(size, size);

        view.label.setFontSize(Math.max(9, Math.round(size * 0.22)));
        view.label.setPosition(x, y - size / 2 - labelRoom / 2);
    }

    handleResize() {
        if (this.background) {
            this.background.setSize(this.scale.width, this.scale.height);
            this.background.setPosition(this.scale.width / 2, this.scale.height / 2);
        }
        this.positionMonsters();
    }

    setupEventListeners() {
        // BattleSystem emits on the world scene, so listen there
        const worldEvents = this.worldScene.events;

        const onEnd = (data) => this.endBattle(data);
        const onCatch = (data) => this.showCatchAnimation(data);
        const onFaint = () => this.showFaintAnimation();
        const onSwitch = () => this.swapPlayerMonsterView();

        worldEvents.once('battle-end', onEnd);
        worldEvents.on('battle-catch-attempt', onCatch);
        worldEvents.on('battle-monster-faint', onFaint);
        worldEvents.on('battle-monster-switch', onSwitch);

        this.events.once('shutdown', () => {
            worldEvents.off('battle-end', onEnd);
            worldEvents.off('battle-catch-attempt', onCatch);
            worldEvents.off('battle-monster-faint', onFaint);
            worldEvents.off('battle-monster-switch', onSwitch);
        });
    }

    showCatchAnimation(data) {
        if (!this.enemyView) return;

        const ball = this.add.circle(
            this.scale.width / 2,
            this.scale.height * 0.45,
            14,
            0xff0000
        );
        ball.setDepth(30);

        this.tweens.add({
            targets: ball,
            x: this.enemyView.sprite.x,
            y: this.enemyView.sprite.y,
            duration: 500,
            onComplete: () => {
                if (data.success) {
                    this.tweens.add({
                        targets: ball,
                        scale: 1.2,
                        duration: 100,
                        yoyo: true,
                        repeat: 2,
                        onComplete: () => ball.destroy()
                    });
                } else {
                    this.tweens.add({
                        targets: ball,
                        x: this.scale.width / 2,
                        y: this.scale.height * 0.45,
                        duration: 300,
                        onComplete: () => ball.destroy()
                    });
                }
            }
        });
    }

    showFaintAnimation() {
        if (!this.playerView) return;

        const sprite = this.playerView.sprite;

        this.tweens.add({
            targets: sprite,
            alpha: 0,
            duration: 200,
            yoyo: true,
            repeat: 3,
            onComplete: () => sprite.setAlpha(0.5)
        });
    }

    // Redraw the player's side after switching to another team member
    swapPlayerMonsterView() {
        const playerMonster = this.player.getCurrentMonster();
        if (!playerMonster) return;

        if (this.playerView) {
            this.playerView.sprite.destroy();
            this.playerView.label.destroy();
        }

        this.playerView = this.createMonsterView(playerMonster);
        this.positionMonsters();
    }

    endBattle(data) {
        // Hide battle UI
        this.uiManager.hideBattleUI();

        // Return to world scene
        const worldScene = this.worldScene;
        this.scene.stop();
        worldScene.resumeWorld();

        // Show result message
        switch (data.result) {
            case 'win':
                worldScene.uiManager.showMessage('Victory!', 2000);
                break;
            case 'catch':
                worldScene.uiManager.showMessage('Monster caught!', 2000);
                break;
            case 'run':
                worldScene.uiManager.showMessage('Escaped successfully!', 2000);
                break;
            case 'lose':
                // Handled by world scene
                break;
        }
    }
}
