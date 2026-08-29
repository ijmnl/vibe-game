class WorldScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldScene' });

        this.worldGenerator = null;
        this.player = null;
        this.battleSystem = null;
        this.encounterSystem = null;
        this.uiManager = null;
        this.minimap = null;
        this.cursors = null;
        this.wasd = null;
        this.currentTileType = null;
        this.currentZone = null;
    }

    create() {
        this.worldGenerator = new WorldGenerator();
        this.worldGenerator.generate();

        SpriteFactory.build(this);
        SpriteFactory.createAnimations(this);

        this.createWorld();

        const spawn = this.worldGenerator.getPlayerSpawnPosition();
        this.player = new Player(this, spawn.x, spawn.y);

        this.battleSystem = new BattleSystem(this);
        this.encounterSystem = new EncounterSystem(this);
        this.encounterSystem.init(this.player);

        this.uiManager = new UIManager(this);
        this.minimap = new Minimap(this, this.worldGenerator);

        this.restoreSave();

        this.setupCamera();
        this.setupInput();
        this.setupEventListeners();

        this.minimap.setPlayerPosition(this.player.getPosition());
        this.uiManager.refreshHud();

        this.scale.on('resize', this.handleResize, this);
        this.events.once('shutdown', () => this.scale.off('resize', this.handleResize, this));

        gameState.player = this.player;
        gameState.world = this.worldGenerator;

        audioManager.playZoneMusic(this.player.getZone());

        if (!gameState.saveData) {
            this.uiManager.showMessage('Explore the grass to find monsters!', 3200);
        }
    }

    restoreSave() {
        if (gameState.saveData) {
            this.player.loadSaveData(gameState.saveData);
        }
    }

    createWorld() {
        const tilesetKey = TileTextures.ensureTexture(this);
        const indices = this.worldGenerator.worldData
            .map(row => row.map(tile => TileTextures.indexFor(tile)));

        this.map = this.make.tilemap({
            data: indices,
            tileWidth: CONFIG.TILE_SIZE,
            tileHeight: CONFIG.TILE_SIZE
        });

        const tileset = this.map.addTilesetImage(tilesetKey);
        this.worldLayer = this.map.createLayer(0, tileset, 0, 0);
        this.worldLayer.setDepth(0);
    }

    setupCamera() {
        const camera = this.cameras.main;

        camera.setBounds(
            0, 0,
            this.worldGenerator.worldWidth * CONFIG.TILE_SIZE,
            this.worldGenerator.worldHeight * CONFIG.TILE_SIZE
        );
        camera.startFollow(this.player.sprite, true, 0.12, 0.12);
        camera.setZoom(this.getCameraZoom());
    }

    // Show a comparable slice of the world regardless of screen size
    getCameraZoom() {
        const tilesAcross = 13;
        const shortest = Math.min(this.scale.width, this.scale.height);

        return Phaser.Math.Clamp(shortest / (tilesAcross * CONFIG.TILE_SIZE), 1, 3);
    }

    handleResize() {
        this.cameras.main.setZoom(this.getCameraZoom());
        this.minimap.resizeToContainer();
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    setupEventListeners() {
        this.events.on('encounter-start', (data) => {
            this.startBattle(data.player, data.wildMonster, data.zone);
        });

        this.events.on('battle-action', (data) => {
            if (this.battleSystem?.isActive()) {
                this.battleSystem.playerAction(data.action, data.payload);
            }
        });

        this.events.on('battle-start', () => this.player.stopMoving());

        this.events.on('battle-end', (data) => {
            this.player.stopMoving();
            this.encounterSystem.setEncounterActive(false);

            if (data.result === 'lose') {
                this.handleDefeat();
            }

            saveGame();
        });
    }

    startBattle(player, wildMonster, zone) {
        this.player.stopMoving();
        touchControls.reset();
        audioManager.playBattleMusic();

        this.scene.launch('BattleScene', { player, wildMonster, zone, worldScene: this });
        this.scene.pause();
    }

    update(time, delta) {
        if (!this.player) return;

        this.handlePlayerInput(delta);
        this.encounterSystem.update(delta);
        this.minimap.update();
        this.checkTileUnderPlayer();
    }

    getInputDirection() {
        if (this.cursors.left.isDown || this.wasd.left.isDown) return 'left';
        if (this.cursors.right.isDown || this.wasd.right.isDown) return 'right';
        if (this.cursors.up.isDown || this.wasd.up.isDown) return 'up';
        if (this.cursors.down.isDown || this.wasd.down.isDown) return 'down';

        return touchControls.direction;
    }

    handlePlayerInput(delta) {
        const direction = this.getInputDirection();

        if (!direction) {
            this.player.stopMoving();
            return;
        }

        this.player.move(direction, delta);

        const position = this.player.getPosition();
        this.minimap.setPlayerPosition(position);
        this.uiManager.updatePlayerStats(position);
    }

    // Heal pads, shops and the lair fire once when you step onto them
    checkTileUnderPlayer() {
        const tile = this.player.getTile();
        const data = this.worldGenerator.getTileAt(tile.x, tile.y);
        if (!data) return;

        if (data.zone !== this.currentZone) {
            this.currentZone = data.zone;
            audioManager.playZoneMusic(data.zone);
            this.uiManager.refreshHud();
        }

        if (data.type === this.currentTileType) return;
        this.currentTileType = data.type;

        switch (data.type) {
            case 'village_heal':
                this.player.healAll();
                this.uiManager.refreshHud();
                this.uiManager.showMessage('Your team is fully healed!', 2000);
                audioManager.playSfx('heal');
                saveGame();
                break;

            case 'village_shop':
                this.uiManager.openShop();
                break;

            case 'lair':
                this.triggerLegendary();
                break;
        }
    }

    triggerLegendary() {
        if (gameState.legendaryDefeated) {
            this.uiManager.showMessage('The shrine is quiet now.', 2000);
            return;
        }

        const legendary = new Monster('Volcanor', 35, true);
        this.uiManager.showMessage('The ground trembles...', 1600);

        this.time.delayedCall(1600, () => {
            this.startBattle(this.player, legendary, 'CAVE');
        });
    }

    handleDefeat() {
        const tile = this.player.getTile();
        const village = this.worldGenerator.getNearestVillage(tile.x, tile.y);

        this.player.healAll();

        if (village) {
            this.player.sprite.x = village.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            this.player.sprite.y = (village.y + 1) * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        }

        // Losing costs coins rather than progress
        const lost = Math.floor(this.player.coins * 0.25);
        this.player.addCoins(-lost);

        this.uiManager.refreshHud();
        this.uiManager.showMessage(
            `All your monsters fainted! You scurried back to the village${lost > 0 ? ` and dropped ${lost} coins` : ''}.`,
            4000
        );
    }

    resumeWorld() {
        this.scene.resume();
        this.player.stopMoving();
        touchControls.reset();
        this.uiManager.refreshHud();
        audioManager.playZoneMusic(this.player.getZone());

        // Do not immediately re-trigger the tile we are standing on
        this.currentTileType = this.worldGenerator.getTileAt(
            this.player.getTile().x,
            this.player.getTile().y
        )?.type ?? null;
    }
}
