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
        this.worldScene = data.worldScene;
        this.player = data.worldScene.player;
        this.wildMonster = data.wildMonster || null;
        this.trainer = data.trainer || null;
        this.zone = data.zone;
        this.enemyView = null;
        this.playerView = null;
    }

    create() {
        this.createBackground();

        this.battleSystem = this.worldScene.battleSystem;
        this.uiManager = this.worldScene.uiManager;

        this.setupEventListeners();

        // Start the battle before drawing anyone: startBattle() decides which
        // monster leads, so building the views first drew whoever happened to
        // be out at the end of the previous fight.
        // This scene also owns the turn timers - the world scene is paused, so
        // delayed calls scheduled there would never fire.
        if (this.trainer) {
            this.battleSystem.startTrainerBattle(this.player, this.trainer, this);
        } else {
            this.battleSystem.startBattle(this.player, this.wildMonster, this);
        }

        this.createMonsterViews();

        // The panel's final geometry depends on its content and the media
        // query, so settle the layout over the next couple of frames.
        [0, 80, 250].forEach(delay =>
            this.time.delayedCall(delay, () => this.positionMonsters()));

        this.scale.on('resize', this.handleResize, this);
        this.events.once('shutdown', () => this.scale.off('resize', this.handleResize, this));
    }

    createBackground() {
        const zoneColor = CONFIG.ZONES[this.zone]?.color || CONFIG.COLORS.grass;

        this.background = this.add
            .rectangle(this.scale.width / 2, this.scale.height / 2,
                       this.scale.width, this.scale.height, this.shade(zoneColor, 0.62))
            .setOrigin(0.5, 0.5);

        // A darker band behind the panel keeps the sprites reading as a scene
        this.horizon = this.add
            .rectangle(this.scale.width / 2, this.scale.height, this.scale.width, this.scale.height * 0.45,
                       this.shade(zoneColor, 0.38))
            .setOrigin(0.5, 1);

        this.decorations = this.add.container(0, 0);
        this.createBattleDecorations();
    }

    shade(color, factor) {
        const r = Math.floor(((color >> 16) & 0xff) * factor);
        const g = Math.floor(((color >> 8) & 0xff) * factor);
        const b = Math.floor((color & 0xff) * factor);

        return (r << 16) | (g << 8) | b;
    }

    createBattleDecorations() {
        const decorators = {
            GRASS: () => this.scatter(6, 0x2f8f4f, 'tuft'),
            FOREST: () => this.scatter(5, 0x2f7d32, 'tree'),
            WATER: () => this.scatter(9, 0x2f7fd0, 'ripple'),
            CAVE: () => this.scatter(6, 0x5a5a5a, 'spike'),
            SAND: () => this.scatter(5, 0x9a6a3a, 'rock'),
            VILLAGE: () => this.scatter(4, 0x8a6a4a, 'rock')
        };

        (decorators[this.zone] || decorators.GRASS)();
    }

    scatter(count, color, kind) {
        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(this.scale.width * 0.05, this.scale.width * 0.95);
            const y = Phaser.Math.Between(this.scale.height * 0.06, this.scale.height * 0.42);
            const size = Phaser.Math.Between(10, 26);

            let shape;
            if (kind === 'tree') {
                this.decorations.add(this.add.rectangle(x, y + size * 0.5, size * 0.25, size, 0x5a3a1a));
                shape = this.add.ellipse(x, y, size * 1.2, size, color);
            } else if (kind === 'spike') {
                shape = this.add.triangle(x, y, 0, size, size * 0.5, 0, size, size, color);
            } else {
                shape = this.add.ellipse(x, y, size, size * 0.55, color);
            }

            shape.setAlpha(0.5);
            this.decorations.add(shape);
        }
    }

    createMonsterView(monster) {
        // A platform under each combatant so they do not float in the void
        const platform = this.add.ellipse(0, 0, 10, 4, 0x000000, 0.28);
        platform.setDepth(19);

        const sprite = this.add.image(0, 0, monster.getSpriteKey());
        sprite.setOrigin(0.5, 0.5);
        sprite.setDepth(20);

        const label = this.add.text(0, 0, `${monster.name}  Lv.${monster.level}`, {
            fontFamily: 'monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        label.setOrigin(0.5, 0.5);
        label.setDepth(25);

        return { sprite, label, platform, monster };
    }

    createMonsterViews() {
        // Idempotent: a switch event can fire before this runs
        this.destroyView(this.enemyView);
        this.destroyView(this.playerView);

        const opposing = this.battleSystem.wildMonster;
        this.enemyView = opposing ? this.createMonsterView(opposing) : null;

        const mine = this.player.getCurrentMonster();
        this.playerView = mine ? this.createMonsterView(mine) : null;

        this.positionMonsters();
    }

    destroyView(view) {
        if (!view) return;

        view.sprite.destroy();
        view.label.destroy();
        view.platform.destroy();
    }

    positionMonsters() {
        // The DOM battle panel eats most of a phone screen. In portrait it sits
        // along the bottom, so the monsters stack above it; in landscape it is
        // pushed to one side and they use the column beside it instead.
        const panel = this.getPanelBounds();

        if (panel.left > this.scale.width * 0.3) {
            this.layoutBeside(panel.left);
        } else {
            this.layoutAbove(panel.top);
        }
    }

    layoutAbove(panelTop) {
        const centerX = this.scale.width / 2;
        const available = Math.max(70, panelTop - 12);

        const size = Phaser.Math.Clamp(available / 3.4, 26, 96);
        const labelRoom = size * 0.42;
        const rowHeight = size + labelRoom;
        const top = Math.max(labelRoom, (available - rowHeight * 2) / 2 + labelRoom);

        this.placeView(this.enemyView, centerX + this.scale.width * 0.19, top + size / 2, size, labelRoom);
        this.placeView(this.playerView, centerX - this.scale.width * 0.19, top + rowHeight + size / 2, size, labelRoom);
    }

    layoutBeside(columnWidth) {
        const centerX = columnWidth / 2;
        const available = this.scale.height;

        const size = Phaser.Math.Clamp(Math.min(columnWidth / 2.8, available / 3.4), 26, 96);
        const labelRoom = size * 0.42;
        const rowHeight = size + labelRoom;
        const top = Math.max(labelRoom, (available - rowHeight * 2) / 2 + labelRoom);

        this.placeView(this.enemyView, centerX + columnWidth * 0.18, top + size / 2, size, labelRoom);
        this.placeView(this.playerView, centerX - columnWidth * 0.18, top + rowHeight + size / 2, size, labelRoom);
    }

    // The panel's top and left edges, in game (canvas) coordinates
    getPanelBounds() {
        const panel = document.querySelector('#battle-ui .battle-panel');
        const fallback = { top: this.scale.height * 0.4, left: 0 };
        if (!panel) return fallback;

        const rect = panel.getBoundingClientRect();
        if (!rect.height) return fallback;

        const scaleY = this.scale.height / (this.scale.parentSize.height || this.scale.height);
        const scaleX = this.scale.width / (this.scale.parentSize.width || this.scale.width);

        return { top: rect.top * scaleY, left: rect.left * scaleX };
    }

    placeView(view, x, y, size, labelRoom) {
        if (!view) return;

        view.sprite.setPosition(x, y);
        view.sprite.setDisplaySize(size, size);

        view.platform.setPosition(x, y + size * 0.46);
        view.platform.setSize(size * 0.95, size * 0.28);

        view.label.setFontSize(Math.max(9, Math.round(size * 0.17)));
        view.label.setPosition(x, y - size / 2 - labelRoom / 2);
    }

    handleResize() {
        if (this.background) {
            this.background.setSize(this.scale.width, this.scale.height);
            this.background.setPosition(this.scale.width / 2, this.scale.height / 2);
        }
        if (this.horizon) {
            this.horizon.setSize(this.scale.width, this.scale.height * 0.45);
            this.horizon.setPosition(this.scale.width / 2, this.scale.height);
        }
        this.positionMonsters();
    }

    setupEventListeners() {
        const worldEvents = this.worldScene.events;

        const handlers = {
            'battle-end': (data) => this.endBattle(data),
            'battle-catch-attempt': (data) => this.showCatchAnimation(data),
            'battle-monster-faint': () => this.showFaintAnimation(),
            'battle-monster-switch': () => this.swapPlayerMonsterView(),
            'battle-move-used': (data) => this.showAttackLunge(data),
            'battle-damage': (data) => this.showDamageFlash(data),
            'monster-evolved': () => this.swapPlayerMonsterView(),
            'battle-opponent-switch': () => this.swapOpponentView()
        };

        Object.entries(handlers).forEach(([event, handler]) => worldEvents.on(event, handler));

        this.events.once('shutdown', () => {
            Object.entries(handlers).forEach(([event, handler]) => worldEvents.off(event, handler));
        });
    }

    viewFor(isEnemy) {
        return isEnemy ? this.enemyView : this.playerView;
    }

    showAttackLunge({ isEnemy }) {
        const view = this.viewFor(isEnemy);
        if (!view) return;

        audioManager.playSfx('attack');

        const towards = isEnemy ? 26 : -26;
        this.tweens.add({
            targets: view.sprite,
            y: view.sprite.y + towards,
            duration: 110,
            yoyo: true,
            ease: 'Quad.easeOut'
        });
    }

    showDamageFlash({ isEnemy }) {
        const view = this.viewFor(isEnemy);
        if (!view) return;

        audioManager.playSfx('hit');

        this.tweens.add({
            targets: view.sprite,
            alpha: 0.25,
            duration: 70,
            yoyo: true,
            repeat: 2
        });

        this.cameras.main.shake(140, 0.006);
    }

    showCatchAnimation(data) {
        if (!this.enemyView) return;

        audioManager.playSfx('throw');

        const ball = this.add.circle(this.scale.width / 2, this.scale.height * 0.5, 11, 0xff4444);
        ball.setStrokeStyle(2, 0xffffff);
        ball.setDepth(30);

        this.tweens.add({
            targets: ball,
            x: this.enemyView.sprite.x,
            y: this.enemyView.sprite.y,
            duration: 420,
            ease: 'Quad.easeOut',
            onComplete: () => {
                if (data.success) {
                    this.tweens.add({ targets: this.enemyView.sprite, alpha: 0, scale: 0.4, duration: 250 });
                    this.tweens.add({
                        targets: ball,
                        angle: { from: -18, to: 18 },
                        duration: 160,
                        yoyo: true,
                        repeat: 2,
                        onComplete: () => {
                            audioManager.playSfx('caught');
                            ball.destroy();
                        }
                    });
                } else {
                    this.tweens.add({
                        targets: ball,
                        y: ball.y - 24,
                        alpha: 0,
                        duration: 320,
                        onComplete: () => ball.destroy()
                    });
                }
            }
        });
    }

    showFaintAnimation() {
        if (!this.playerView) return;

        audioManager.playSfx('faint');

        this.tweens.add({
            targets: this.playerView.sprite,
            y: this.playerView.sprite.y + 22,
            alpha: 0.2,
            duration: 380
        });
    }

    // A trainer sending out their next monster
    swapOpponentView() {
        const opposing = this.battleSystem.wildMonster;
        if (!opposing) return;

        this.destroyView(this.enemyView);
        this.enemyView = this.createMonsterView(opposing);
        this.positionMonsters();
    }

    swapPlayerMonsterView() {
        const mine = this.player.getCurrentMonster();
        if (!mine) return;

        this.destroyView(this.playerView);
        this.playerView = this.createMonsterView(mine);
        this.positionMonsters();
    }

    endBattle(data) {
        this.uiManager.hideBattleUI();

        if (data.result === 'win' && this.wildMonster?.legendary) {
            gameState.legendaryDefeated = true;
        }

        if (data.result === 'win' && data.opponent && !data.opponent.isWild) {
            this.uiManager.queueDialogue(data.opponent.title, data.opponent.defeatLines);
        }

        const worldScene = this.worldScene;
        this.scene.stop();
        worldScene.resumeWorld();

        const messages = {
            win: data.opponent && !data.opponent.isWild ? 'You won the battle!' : 'Victory!',
            catch: 'Caught it!',
            'catch-full': 'Caught it, but your team is full!',
            run: 'Got away safely.'
        };

        if (messages[data.result]) {
            worldScene.uiManager.showMessage(messages[data.result], 1800);
        }

        if (data.result === 'win' || data.result === 'catch') {
            audioManager.playSfx('victory');
            worldScene.uiManager.checkDexCompletion();
        }
    }
}
