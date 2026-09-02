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
        // query, and the backdrop is composed around it, so settle both over
        // the next couple of frames.
        [0, 80, 250].forEach(delay =>
            this.time.delayedCall(delay, () => this.layoutScene()));

        this.scale.on('resize', this.handleResize, this);
        this.events.once('shutdown', () => this.scale.off('resize', this.handleResize, this));
    }

    createBackground() {
        // A flat wash of one colour with a few ellipses on it read as a
        // placeholder. This builds an actual scene: a graded sky, a line of
        // distant scenery at the horizon, and ground that recedes.
        const scheme = BattleScene.SCENES[this.zone] || BattleScene.SCENES.GRASS;

        this.backdrop = this.add.container(0, 0);
        this.backdrop.setDepth(0);

        this.paintBackdrop(scheme);
        this.createSkyWash();
    }

    // The tint of the hour and the sky, laid over the arena but below the
    // combatants (depth 19 and up), so the scene reads as night without the
    // two monsters going grey with it.
    createSkyWash() {
        if (this.skyWash) this.skyWash.destroy();
        this.skyWash = null;

        const phase = currentClock()?.phase;
        const sky = getWeather(currentWeather());

        const layers = [
            { tint: phase?.tint, strength: phase?.strength || 0 },
            { tint: sky.tint, strength: sky.strength || 0 }
        ].filter(layer => layer.tint && layer.strength > 0);

        if (!layers.length) return;

        const lead = layers.reduce((a, b) => (b.strength > a.strength ? b : a));
        const strength = Math.min(0.42, layers.reduce((sum, l) => sum + l.strength, 0) * 0.7);

        this.skyWash = this.add
            .rectangle(this.scale.width / 2, this.scale.height / 2,
                       this.scale.width, this.scale.height, lead.tint, strength)
            .setDepth(15);
    }

    // Per-zone palettes: sky from top to horizon, ground from horizon down,
    // and what stands between the two.
    static SCENES = {
        GRASS:   { sky: [0x6fb6f0, 0xcfe8ff], ground: [0x57ad5f, 0x2f6b38],
                   far: 0x3f7a46, silhouette: 'hills', detail: 0x2f8f4f },
        FOREST:  { sky: [0x86c9a4, 0xdcf2dc], ground: [0x4a8c50, 0x28542e],
                   far: 0x245029, silhouette: 'trees', detail: 0x2f7d32 },
        WATER:   { sky: [0x74c6ea, 0xdaf4ff], ground: [0xa8ccb0, 0x6f9c86],
                   far: 0x3a7fd0, silhouette: 'water', detail: 0x2f7fd0 },
        CAVE:    { sky: [0x2c2738, 0x4a4458], ground: [0x5a5468, 0x332e3e],
                   far: 0x241f2e, silhouette: 'spikes', detail: 0x6b6274 },
        SAND:    { sky: [0xffc46a, 0xffeccc], ground: [0xe8cb96, 0xb08a4e],
                   far: 0xc9a86a, silhouette: 'dunes', detail: 0x9a6a3a },
        VILLAGE: { sky: [0x8ec6f0, 0xdceaf8], ground: [0xc9b79a, 0x9a8570],
                   far: 0x3f7a46, silhouette: 'trees', detail: 0xa08d78 }
    };

    // Where the ground starts, as a fraction of the visible strip
    static HORIZON = 0.55;

    // Only the strip above the battle panel is actually visible, so that is
    // what the scene is composed for. Putting the horizon at half the *screen*
    // buried it - and the treeline with it - behind the panel.
    visibleHeight() {
        const panel = this.getPanelBounds();

        // In landscape the panel is pushed to one side and the full height shows
        return panel.left > this.scale.width * 0.3
            ? this.scale.height
            : Math.max(120, panel.top);
    }

    paintBackdrop(scheme) {
        const { width, height } = this.scale;
        const horizon = this.visibleHeight() * BattleScene.HORIZON;

        this.backdrop.removeAll(true);

        // Sky and ground as stacked bands. Phaser rectangles have no gradient,
        // and baking a texture would blur when stretched, so this is banding
        // by hand - cheap, sharp, and resolution independent.
        this.paintBands(scheme.sky, 0, horizon, 10);
        this.paintBands(scheme.ground, horizon, height - horizon, 8);

        this.paintSilhouette(scheme, horizon);

        // The horizon itself, so the two halves meet on a line
        this.backdrop.add(this.add.rectangle(width / 2, horizon, width, 2, scheme.far, 0.5));

        this.paintForeground(scheme, horizon);
    }

    paintBands(colors, top, span, count) {
        const { width } = this.scale;
        const bandHeight = span / count;

        for (let i = 0; i < count; i++) {
            const shade = this.mix(colors[0], colors[1], i / (count - 1));
            const band = this.add.rectangle(
                width / 2, top + i * bandHeight + bandHeight / 2,
                width, bandHeight + 1, shade
            );
            this.backdrop.add(band);
        }
    }

    // What stands on the horizon: hills, a treeline, water, dunes, or the
    // roof of a cave coming down to meet the floor.
    paintSilhouette(scheme, horizon) {
        const { width } = this.scale;

        // Distance washes a colour out toward the sky, and everything catches
        // the light on the same side. Both are wanted by every silhouette.
        const haze = this.mix(scheme.far, scheme.sky[1], 0.42);
        const lit = this.mix(scheme.far, 0xffffff, 0.18);

        if (scheme.silhouette === 'spikes') {
            // Stalactites hanging from the ceiling instead of a skyline
            for (let i = 0; i < 7; i++) {
                const x = (width / 7) * i + width / 14;
                const drop = Phaser.Math.Between(18, 52);

                // A rim of light down the lit side, the same trick the hills
                // and the treeline use: the whole spike two pixels wider,
                // with the spike itself drawn over it.
                this.backdrop.add(this.add.triangle(
                    x, 0, -16, 0, 14, 0, -1, drop + 2, lit
                ).setOrigin(0, 0));
                this.backdrop.add(this.add.triangle(
                    x, 0, -14, 0, 14, 0, 0, drop, scheme.far
                ).setOrigin(0, 0));
            }
            return;
        }

        if (scheme.silhouette === 'water') {
            // A band of open water meeting the shore
            this.backdrop.add(this.add.rectangle(
                width / 2, horizon - 18, width, 36, scheme.far
            ));
            for (let i = 0; i < 5; i++) {
                this.backdrop.add(this.add.rectangle(
                    Phaser.Math.Between(0, width), horizon - Phaser.Math.Between(4, 30),
                    Phaser.Math.Between(20, 60), 2, 0xffffff, 0.4
                ));
            }
            return;
        }

        if (scheme.silhouette === 'trees') {
            const bark = this.mix(scheme.far, 0x000000, 0.38);

            // A hazier row standing behind, so the wood has a back to it
            for (let i = 0; i < 11; i++) {
                const x = (width / 10) * i + Phaser.Math.Between(-12, 12);
                const tall = Phaser.Math.Between(24, 42);

                this.backdrop.add(this.add.ellipse(
                    x, horizon - tall,
                    Phaser.Math.Between(30, 46), Phaser.Math.Between(26, 38), haze
                ));
            }

            for (let i = 0; i < 9; i++) {
                const x = (width / 9) * i + Phaser.Math.Between(-10, 10);
                const tall = Phaser.Math.Between(30, 58);
                const crown = Phaser.Math.Between(30, 46);

                this.backdrop.add(this.add.rectangle(x, horizon, 6, tall, bark).setOrigin(0.5, 1));
                this.backdrop.add(this.add.ellipse(x, horizon - tall, crown, crown * 0.86, lit));
                this.backdrop.add(this.add.ellipse(
                    x, horizon - tall + 4, crown - 7, crown * 0.86 - 7, scheme.far
                ));
            }
            return;
        }

        // Two ranges. One row of identical ellipses in a single colour merges
        // into one lump on the horizon; a hazier range standing behind a solid
        // one is what gives a skyline any depth at all.
        const rounded = scheme.silhouette === 'dunes';

        for (let i = 0; i < 5; i++) {
            const x = (width / 4) * i - width / 8;
            const rise = Phaser.Math.Between(34, 64);

            this.backdrop.add(this.add.ellipse(x, horizon, width * 0.52, rise * 2, haze));
        }

        for (let i = 0; i < 4; i++) {
            const x = (width / 3) * i - width / 6;
            const rise = Phaser.Math.Between(22, 46);
            const span = width * (rounded ? 0.6 : 0.45);

            // The lit hill first, then the same hill in the base colour a few
            // pixels lower: what is left showing along the top is a rim of
            // light, and the hill stops being a cut-out.
            this.backdrop.add(this.add.ellipse(x, horizon, span, rise * 2, lit));
            this.backdrop.add(this.add.ellipse(x, horizon + 4, span - 8, rise * 2 - 8, scheme.far));
        }
    }

    // A few shapes along the bottom edge, to give the ground a near side
    paintForeground(scheme, horizon) {
        const width = this.scale.width;
        const bottom = this.visibleHeight();

        const span = bottom - horizon;
        if (span < 40) return;

        // Ground cover along the near side. Six pale ellipses scattered at
        // random over the middle distance read as spills on the floor; these
        // start small and faint at the horizon and grow toward the camera,
        // which is what makes a flat band of colour read as ground receding.
        // Darker than the floor where the floor is pale, lighter where it is
        // dark: mixing toward black either way makes the cave floor's mottling
        // disappear into it entirely.
        const shade = scheme.ground[1];
        const gloomy = (((shade >> 16) & 0xff) + ((shade >> 8) & 0xff) + (shade & 0xff)) / 3 < 96;
        const tint = this.mix(scheme.detail, gloomy ? 0xffffff : 0x000000, 0.18);

        for (let i = 0; i < 14; i++) {
            const depth = Math.pow((i + 0.5) / 14, 0.7);
            const x = Phaser.Math.Between(0, width);
            const y = horizon + 10 + depth * (span - 18);
            const size = 6 + depth * 26;

            const patch = this.add.ellipse(x, y, size, size * 0.3, tint);
            patch.setAlpha(0.12 + depth * 0.16);
            this.backdrop.add(patch);
        }
    }

    mix(from, to, t) {
        const channel = (shift) => {
            const a = (from >> shift) & 0xff;
            const b = (to >> shift) & 0xff;
            return Math.round(a + (b - a) * t) << shift;
        };

        return channel(16) | channel(8) | channel(0);
    }

    createMonsterView(monster) {
        // A shadow under each combatant so they do not float in the void.
        // Two of them: a tight dark core where the body meets the ground and a
        // wider faint one around it. One flat ellipse at a single alpha reads
        // as a puddle painted on the floor.
        const halo = this.add.ellipse(0, 0, 10, 4, 0x000000, 0.12);
        halo.setDepth(18);
        const platform = this.add.ellipse(0, 0, 10, 4, 0x000000, 0.22);
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

        return { sprite, label, platform, halo, monster };
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
        view.halo.destroy();
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
        const enemyY = this.farCombatantY(available, size, labelRoom, rowHeight);

        this.placeView(this.enemyView, centerX + this.scale.width * 0.19, enemyY, size, labelRoom);
        this.placeView(this.playerView, centerX - this.scale.width * 0.19, enemyY + rowHeight, size, labelRoom);
    }

    // The far combatant belongs on the ground just over the horizon. Centring
    // the pair in the strip instead put it - and the shadow under it - up in
    // the sky, which is where the shadow was most obviously wrong.
    farCombatantY(available, size, labelRoom, rowHeight) {
        const horizon = this.visibleHeight() * BattleScene.HORIZON;

        return Phaser.Math.Clamp(
            horizon - size * 0.30,
            labelRoom + size / 2,
            Math.max(labelRoom + size / 2, available - rowHeight - size / 2)
        );
    }

    layoutBeside(columnWidth) {
        const centerX = columnWidth / 2;
        const available = this.scale.height;

        const size = Phaser.Math.Clamp(Math.min(columnWidth / 2.8, available / 3.4), 26, 96);
        const labelRoom = size * 0.42;
        const rowHeight = size + labelRoom;
        const enemyY = this.farCombatantY(available, size, labelRoom, rowHeight);

        this.placeView(this.enemyView, centerX + columnWidth * 0.18, enemyY, size, labelRoom);
        this.placeView(this.playerView, centerX - columnWidth * 0.18, enemyY + rowHeight, size, labelRoom);
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
        view.platform.setSize(size * 0.62, size * 0.17);
        view.halo.setPosition(x, y + size * 0.46);
        view.halo.setSize(size * 0.92, size * 0.26);

        view.label.setFontSize(Math.max(9, Math.round(size * 0.17)));
        view.label.setPosition(x, y - size / 2 - labelRoom / 2);
    }

    handleResize() {
        this.layoutScene();
    }

    // The backdrop is built from bands sized to the visible strip, so any
    // change of shape rebuilds it rather than stretching what is there.
    layoutScene() {
        if (this.backdrop) {
            this.paintBackdrop(BattleScene.SCENES[this.zone] || BattleScene.SCENES.GRASS);
            this.createSkyWash();
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
            'battle-opponent-switch': () => this.swapOpponentView(),
            'monster-levelup': (data) => this.showLevelUp(data),
            'battle-held-on': (data) => this.showHeldOn(data),
            'battle-bond': () => this.floatText('\u2665', '#ff6b8a'),
            'monster-evolved': (data) => {
                this.swapPlayerMonsterView();
                this.showEvolution(data);
            }
        };

        Object.entries(handlers).forEach(([event, handler]) => worldEvents.on(event, handler));

        this.events.once('shutdown', () => {
            Object.entries(handlers).forEach(([event, handler]) => worldEvents.off(event, handler));
        });
    }

    // Levelling is easy to miss in the log, so say it on screen
    showLevelUp({ monster, level }) {
        if (!this.playerView) return;

        // Keep the name label in step with the new level
        if (monster) {
            this.playerView.label.setText(`${monster.name}  Lv.${monster.level}`);
        }

        audioManager.playSfx('victory');
        this.floatText(`Lv.${level}!`, '#f6d02c');
    }

    showEvolution({ from }) {
        this.floatText(`${from} evolved!`, '#7fc4ff');
    }

    // A monster digging in at 1 HP is the single most dramatic thing that
    // happens in a fight - it should not go by in the log alone.
    showHeldOn({ isEnemy }) {
        const view = this.viewFor(isEnemy);
        if (!view) return;

        audioManager.playSfx('heal');

        const label = this.add.text(view.sprite.x, view.sprite.y - 30, 'HELD ON!', {
            fontFamily: 'monospace', fontSize: '14px', color: '#ff6b8a',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5, 0.5).setDepth(41);

        this.tweens.add({
            targets: label,
            y: label.y - 26,
            alpha: 0,
            duration: 1400,
            ease: 'Quad.easeOut',
            onComplete: () => label.destroy()
        });

        this.tweens.add({
            targets: view.sprite,
            scale: { from: view.sprite.scale * 1.18, to: view.sprite.scale },
            duration: 320,
            ease: 'Back.easeOut'
        });
    }

    // Damage rising off whoever was hit, so a big hit reads as a big hit
    floatDamage(view, message, color, big) {
        const label = this.add.text(
            view.sprite.x + Phaser.Math.Between(-10, 10),
            view.sprite.y - 8,
            message,
            {
                fontFamily: 'monospace',
                fontSize: big ? '20px' : '15px',
                color,
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        label.setOrigin(0.5, 0.5);
        label.setDepth(40);

        this.tweens.add({
            targets: label,
            y: label.y - 26,
            alpha: 0,
            duration: 850,
            ease: 'Quad.easeOut',
            onComplete: () => label.destroy()
        });
    }

    floatText(message, color) {
        if (!this.playerView) return;

        const label = this.add.text(this.playerView.sprite.x, this.playerView.sprite.y - 26, message, {
            fontFamily: 'monospace',
            fontSize: '15px',
            color,
            stroke: '#000000',
            strokeThickness: 4
        });
        label.setOrigin(0.5, 0.5);
        label.setDepth(40);

        this.tweens.add({
            targets: label,
            y: label.y - 30,
            alpha: 0,
            duration: 1300,
            ease: 'Quad.easeOut',
            onComplete: () => label.destroy()
        });
    }

    viewFor(isEnemy) {
        return isEnemy ? this.enemyView : this.playerView;
    }

    showAttackLunge({ isEnemy, burst }) {
        const view = this.viewFor(isEnemy);
        if (!view) return;

        audioManager.playSfx('attack');

        if (burst) {
            this.cameras.main.flash(220, 255, 210, 90);
            this.floatText('BURST!', '#ffd24a');
        }

        const towards = isEnemy ? 26 : -26;
        this.tweens.add({
            targets: view.sprite,
            y: view.sprite.y + towards,
            duration: 110,
            yoyo: true,
            ease: 'Quad.easeOut'
        });
    }

    showDamageFlash({ isEnemy, amount, critical, effectiveness }) {
        const view = this.viewFor(isEnemy);
        if (!view) return;

        audioManager.playSfx('hit');

        if (amount) {
            const color = critical ? '#ffd166'
                : effectiveness > 1 ? '#ff7a54'
                : effectiveness < 1 ? '#9fb4c4'
                : '#ffffff';

            this.floatDamage(view, `-${amount}`, color, critical);
        }

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
