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
    }

    create() {
        // Generate world
        this.worldGenerator = new WorldGenerator();
        this.worldGenerator.generate();

        // Create world graphics
        this.createWorld();

        // Create player
        const spawnPos = this.worldGenerator.getPlayerSpawnPosition();
        this.player = new Player(this, spawnPos.x, spawnPos.y);

        // Create systems
        this.battleSystem = new BattleSystem(this);
        this.encounterSystem = new EncounterSystem(this);
        this.encounterSystem.init(this.player);

        // Create UI
        this.uiManager = new UIManager(this);
        this.minimap = new Minimap(this, this.worldGenerator);

        // Restore a previous session before anything reads the player state
        this.restoreSave();

        // Set up camera
        this.setupCamera();

        // Set up input
        this.setupInput();

        // Set up event listeners
        this.setupEventListeners();

        // Initial draw
        this.minimap.setPlayerPosition(this.player.getPosition());
        this.uiManager.updatePlayerStats(this.player.getPosition());
        this.uiManager.updatePlayerMonsterInfo();

        // Keep the view usable when the phone rotates or the URL bar collapses
        this.scale.on('resize', this.handleResize, this);
        this.events.once('shutdown', () => {
            this.scale.off('resize', this.handleResize, this);
        });

        gameState.player = this.player;
        gameState.world = this.worldGenerator;
    }

    restoreSave() {
        const saveData = gameState.saveData;
        if (!saveData) return;

        this.player.loadSaveData(saveData);
    }

    createWorld() {
        const tilesetKey = TileTextures.ensureTexture(this);

        // Convert the generated world into tile indices for one tilemap layer
        const worldData = this.worldGenerator.worldData;
        const indices = worldData.map(row => row.map(tile => TileTextures.indexFor(tile)));

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
            0,
            0,
            this.worldGenerator.worldWidth * CONFIG.TILE_SIZE,
            this.worldGenerator.worldHeight * CONFIG.TILE_SIZE
        );

        camera.startFollow(this.player.sprite, true, 0.1, 0.1);
        camera.setZoom(this.getCameraZoom());
    }

    // Show a comparable slice of the world regardless of screen size, so a
    // phone is not left staring at four giant tiles.
    getCameraZoom() {
        const tilesAcross = 13;
        const shortestSide = Math.min(this.scale.width, this.scale.height);

        return Phaser.Math.Clamp(
            shortestSide / (tilesAcross * CONFIG.TILE_SIZE),
            1,
            3
        );
    }

    handleResize() {
        this.cameras.main.setZoom(this.getCameraZoom());
        this.minimap.resizeToContainer();
    }

    setupInput() {
        // Keyboard: arrow keys plus WASD
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    setupEventListeners() {
        // Battle start event
        this.events.on('encounter-start', (data) => {
            this.startBattle(data.player, data.wildMonster, data.zone);
        });

        // Battle action event
        this.events.on('battle-action', (data) => {
            this.handleBattleAction(data);
        });

        // Battle start from encounter
        this.events.on('battle-start', () => {
            this.player.stopMoving();
        });

        // Battle end
        this.events.on('battle-end', (data) => {
            this.player.stopMoving();
            this.encounterSystem.setEncounterActive(false);

            if (data.result === 'lose') {
                // Player lost - go to game over
                this.gameOver();
            }
        });

        // Monster level up
        this.events.on('monster-levelup', (data) => {
            this.uiManager.showMessage(`${data.monster.name} grew to Lv. ${data.monster.level}!`);
        });
    }

    startBattle(player, wildMonster, zone) {
        // Stop the player drifting while the battle scene boots
        this.player.stopMoving();
        touchControls.reset();

        // Switch to battle scene
        this.scene.launch('BattleScene', {
            player: player,
            wildMonster: wildMonster,
            zone: zone,
            worldScene: this
        });

        // Pause world scene
        this.scene.pause();
    }

    handleBattleAction(data) {
        if (this.battleSystem && this.battleSystem.isActive()) {
            this.battleSystem.playerAction(data.action, data.item);
        }
    }

    update(time, delta) {
        if (!this.player) return;

        this.handlePlayerInput(delta);
        this.encounterSystem.update(delta);
        this.minimap.update();
    }

    // Which way the player wants to go this frame, from any input source
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

        // Emit player move event for UI updates
        const pos = this.player.getPosition();
        this.events.emit('player-move', pos);
        this.minimap.setPlayerPosition(pos);
    }

    gameOver() {
        // Show game over message
        this.uiManager.showMessage('Game Over! All monsters fainted.', 5000);

        // Reset player position
        const spawnPos = this.worldGenerator.getPlayerSpawnPosition();
        this.player.sprite.x = spawnPos.x;
        this.player.sprite.y = spawnPos.y;

        // Heal all monsters
        this.player.getAllMonsters().forEach(monster => {
            monster.hp = monster.maxHp;
        });

        // Update UI
        this.uiManager.updatePlayerMonsterInfo();
    }

    // Public method to resume world scene after battle
    resumeWorld() {
        this.scene.resume();
        this.player.stopMoving();
        touchControls.reset();
        this.uiManager.updatePlayerMonsterInfo();
    }
}
