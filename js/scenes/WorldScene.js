class WorldScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldScene' });

        this.map = null;
        this.player = null;
        this.battleSystem = null;
        this.encounterSystem = null;
        this.uiManager = null;
        this.minimap = null;
        this.cursors = null;
        this.wasd = null;
        this.interactKeys = null;

        this.npcSprites = [];
        this.tilemap = null;
        this.worldLayer = null;
        this.lastTileType = null;
        this.transitioning = false;
    }

    create() {
        SpriteFactory.build(this);
        SpriteFactory.createAnimations(this);

        this.battleSystem = new BattleSystem(this);
        this.encounterSystem = new EncounterSystem(this);
        this.uiManager = new UIManager(this);

        // The player needs a map under it before it can exist
        this.map = new WorldMap(gameState.saveData?.mapId || STARTING_MAP);
        this.drawMap();

        const spawn = this.map.getDefaultSpawn();
        this.player = new Player(this, spawn.x, spawn.y);
        this.encounterSystem.init(this.player);

        this.minimap = new Minimap(this, this.map);

        this.restoreSave();
        this.spawnNpcs();

        this.setupCamera();
        this.setupInput();
        this.setupEventListeners();

        this.minimap.setPlayerPosition(this.player.getPosition());
        this.uiManager.refreshHud();

        this.scale.on('resize', this.handleResize, this);
        this.events.once('shutdown', () => this.scale.off('resize', this.handleResize, this));

        gameState.player = this.player;
        gameState.world = this.map;
        if (this.map.kind === 'town') gameState.lastTownId = this.map.id;

        audioManager.playZoneMusic(this.map.zone);

        if (!gameState.saveData) {
            this.uiManager.showMessage('Talk to the townsfolk, then head north.', 3400);
        }
    }

    restoreSave() {
        if (!gameState.saveData) return;

        this.player.loadSaveData(gameState.saveData);

        // A saved position belongs to the saved map
        if (gameState.saveData.mapId !== this.map.id) {
            const spawn = this.map.getDefaultSpawn();
            this.player.sprite.setPosition(spawn.x, spawn.y);
        }
    }

    // --- map handling -------------------------------------------------------

    drawMap() {
        const tilesetKey = TileTextures.ensureTexture(this);

        if (this.worldLayer) this.worldLayer.destroy();
        if (this.tilemap) this.tilemap.destroy();

        const indices = this.map.tiles.map(row => row.map(tile => TileTextures.indexFor(tile)));

        this.tilemap = this.make.tilemap({
            data: indices,
            tileWidth: CONFIG.TILE_SIZE,
            tileHeight: CONFIG.TILE_SIZE
        });

        const tileset = this.tilemap.addTilesetImage(tilesetKey);
        this.worldLayer = this.tilemap.createLayer(0, tileset, 0, 0);
        this.worldLayer.setDepth(0);
    }

    spawnNpcs() {
        this.npcSprites.forEach(sprite => sprite.destroy());
        this.npcSprites = [];

        this.map.npcs.forEach(npc => {
            if (npc.trainer && gameState.defeatedTrainers.includes(this.trainerKey(npc))) {
                // Beaten trainers stay put but no longer challenge you
                npc.beaten = true;
            }

            const sprite = this.add.sprite(
                npc.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                npc.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                npc.sprite || 'npc-elder'
            );
            sprite.setDepth(9);
            this.npcSprites.push(sprite);
        });
    }

    trainerKey(npc) {
        return `${this.map.id}:${npc.id}`;
    }

    async changeMap(toId) {
        if (this.transitioning) return;
        this.transitioning = true;

        const fromId = this.map.id;
        this.cameras.main.fadeOut(180, 0, 0, 0);

        await new Promise(resolve => this.time.delayedCall(200, resolve));

        this.map = new WorldMap(toId);
        this.drawMap();
        this.spawnNpcs();

        const spawn = this.map.getSpawnFrom(fromId);
        this.player.sprite.setPosition(spawn.x, spawn.y);
        this.player.stopMoving();

        this.setupCamera();
        this.minimap.setMap(this.map);
        this.minimap.setPlayerPosition(this.player.getPosition());

        this.lastTileType = null;
        gameState.world = this.map;

        // Losing sends you back to the last town you set foot in
        if (this.map.kind === 'town') gameState.lastTownId = this.map.id;

        audioManager.playZoneMusic(this.map.zone);
        this.uiManager.refreshHud();
        this.uiManager.showMessage(this.map.name, 1800);

        this.cameras.main.fadeIn(180, 0, 0, 0);
        this.transitioning = false;

        saveGame();
    }

    setupCamera() {
        const camera = this.cameras.main;

        camera.setBounds(
            0, 0,
            this.map.worldWidth * CONFIG.TILE_SIZE,
            this.map.worldHeight * CONFIG.TILE_SIZE
        );
        camera.startFollow(this.player.sprite, true, 0.14, 0.14);
        camera.setZoom(this.getCameraZoom());
    }

    getCameraZoom() {
        const tilesAcross = 13;
        const shortest = Math.min(this.scale.width, this.scale.height);

        return clamp(shortest / (tilesAcross * CONFIG.TILE_SIZE), 1, 3);
    }

    handleResize() {
        this.cameras.main.setZoom(this.getCameraZoom());
        this.minimap.resizeToContainer();
    }

    // --- input --------------------------------------------------------------

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.interactKeys = this.input.keyboard.addKeys({
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        touchControls.onInteract = () => this.interact();
    }

    setupEventListeners() {
        this.events.on('encounter-start', (data) => {
            this.startWildBattle(data.wildMonster);
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
            this.onBattleEnd(data);
        });
    }

    // --- interaction --------------------------------------------------------

    // The tile the player is facing
    getFacingTile() {
        const tile = this.player.getTile();
        const step = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.player.direction];

        return { x: tile.x + step[0], y: tile.y + step[1] };
    }

    interact() {
        if (this.transitioning || this.battleSystem.isActive()) return;
        if (this.uiManager.isDialogueOpen() || this.uiManager.isOverlayOpen()) return;

        const facing = this.getFacingTile();
        const npc = this.map.getNpcAt(facing.x, facing.y);
        if (!npc) return;

        this.player.stopMoving();
        touchControls.reset();
        this.talkTo(npc);
    }

    talkTo(npc) {
        if (npc.trainer && !npc.beaten) {
            this.uiManager.showDialogue(npc.trainer.title, npc.trainer.intro, () => {
                this.startTrainerBattle(npc);
            });
            return;
        }

        const giftKey = `${this.map.id}:${npc.id}`;
        const alreadyGifted = npc.role === 'gift' && gameState.receivedGifts.includes(giftKey);

        const lines = npc.beaten && npc.trainer ? npc.trainer.defeat
            : alreadyGifted ? (npc.afterGift || npc.lines)
            : npc.lines || ['...'];

        this.uiManager.showDialogue(npc.trainer ? npc.trainer.title : null, lines, () => {
            if (npc.role === 'heal') this.healTeam();
            if (npc.role === 'shop') this.uiManager.openShop();
            if (npc.role === 'gift' && !alreadyGifted) this.giveGift(npc, giftKey);
        });
    }

    // A one-off monster handed over by an NPC
    giveGift(npc, giftKey) {
        const [name, level] = npc.gift;

        if (this.player.getAllMonsters().length >= CONFIG.MAX_MONSTERS_IN_TEAM) {
            this.uiManager.showMessage('Your team is full - come back with room!', 2600);
            return;
        }

        this.player.addMonster(name, level);
        gameState.receivedGifts.push(giftKey);

        this.uiManager.refreshHud();
        this.uiManager.showMessage(`You received ${name} (Lv.${level})!`, 3000);
        audioManager.playSfx('caught');
        saveGame();
    }

    healTeam() {
        this.player.healAll();
        this.uiManager.refreshHud();
        this.uiManager.showMessage('Your team is fully healed!', 1800);
        audioManager.playSfx('heal');
        saveGame();
    }

    // --- battles ------------------------------------------------------------

    startWildBattle(wildMonster) {
        this.launchBattle({ wildMonster });
    }

    startTrainerBattle(npc) {
        const trainer = {
            id: this.trainerKey(npc),
            title: npc.trainer.title,
            team: npc.trainer.team.map(([name, level]) => new Monster(name, level)),
            reward: npc.trainer.reward,
            defeat: npc.trainer.defeat
        };

        this.launchBattle({ trainer, npc });
    }

    launchBattle(payload) {
        this.player.stopMoving();
        touchControls.reset();
        audioManager.playBattleMusic();

        this.scene.launch('BattleScene', {
            ...payload,
            zone: this.map.zone,
            worldScene: this
        });
        this.scene.pause();
    }

    onBattleEnd(data) {
        if (data.result === 'lose') {
            this.handleDefeat();
        } else if (data.result === 'win' && data.opponent && !data.opponent.isWild) {
            gameState.defeatedTrainers.push(data.opponent.id);
            const npc = this.map.npcs.find(n => this.trainerKey(n) === data.opponent.id);
            if (npc) npc.beaten = true;
        }

        saveGame();
    }

    handleDefeat() {
        this.player.healAll();

        const lost = Math.floor(this.player.coins * 0.2);
        this.player.addCoins(-lost);

        // Beaten trainers send you back to the last town you passed through
        const townId = gameState.lastTownId || STARTING_MAP;

        if (townId !== this.map.id) {
            this.changeMap(townId);
        } else {
            const spawn = this.map.getDefaultSpawn();
            this.player.sprite.setPosition(spawn.x, spawn.y);
        }

        this.uiManager.refreshHud();
        this.uiManager.showMessage(
            `Your team fainted! You hurried back to town${lost > 0 ? ` and dropped ${lost} coins` : ''}.`,
            3600
        );
    }

    // --- loop ---------------------------------------------------------------

    update(time, delta) {
        if (!this.player || this.transitioning) return;

        if (Phaser.Input.Keyboard.JustDown(this.interactKeys.space)
            || Phaser.Input.Keyboard.JustDown(this.interactKeys.enter)) {
            this.interact();
        }

        if (this.uiManager.isDialogueOpen() || this.uiManager.isOverlayOpen()) {
            this.player.stopMoving();
            return;
        }

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

    checkTileUnderPlayer() {
        const tile = this.player.getTile();

        const exit = this.map.getExitAt(tile.x, tile.y);
        if (exit) {
            this.changeMap(exit.to);
            return;
        }

        const data = this.map.getTileAt(tile.x, tile.y);
        if (!data || data.type === this.lastTileType) return;
        this.lastTileType = data.type;

        switch (data.type) {
            case 'heal_pad':
                this.healTeam();
                break;
            case 'shop_pad':
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

        this.uiManager.showMessage('The ground trembles...', 1500);
        this.time.delayedCall(1500, () => {
            this.startWildBattle(new Monster('Volcanor', 30, true));
        });
    }

    resumeWorld() {
        this.scene.resume();
        this.player.stopMoving();
        touchControls.reset();
        this.uiManager.refreshHud();
        audioManager.playZoneMusic(this.map.zone);

        // Do not immediately re-trigger the tile we are standing on
        const tile = this.player.getTile();
        this.lastTileType = this.map.getTileAt(tile.x, tile.y)?.type ?? null;
    }
}
