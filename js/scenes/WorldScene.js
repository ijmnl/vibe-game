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
        this.itemSprites = [];
        this.tilemap = null;
        this.worldLayer = null;
        this.lastTileType = null;
        this.transitioning = false;
        this.wanderTimer = null;
        this.challenging = false;
        this.sky = null;
        this.weatherTimer = 0;
    }

    // How long a stretch of weather lasts before it is re-rolled
    static WEATHER_MS = 75000;

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
        this.sky = new SkyOverlay(this);

        this.restoreSave();
        this.spawnNpcs();

        this.setupCamera();
        this.setupInput();
        this.setupEventListeners();

        this.minimap.setPlayerPosition(this.player.getPosition());
        this.uiManager.refreshHud();

        this.scale.on('resize', this.handleResize, this);
        this.events.once('shutdown', () => {
            this.scale.off('resize', this.handleResize, this);
            if (this.wanderTimer) this.wanderTimer.remove();
            this.sky?.destroy();
        });

        gameState.player = this.player;
        gameState.world = this.map;
        if (this.map.kind === 'town') gameState.lastTownId = this.map.id;

        audioManager.playZoneMusic(this.map.zone);
        this.rollWeather();

        if (!gameState.saveData) {
            this.uiManager.showMessage('Talk to the townsfolk, then head north.', 3400);
        }
    }

    // --- sky ----------------------------------------------------------------

    // Each map gets its own weather when you walk in, and it turns over every
    // so often while you are there.
    rollWeather(announce = false) {
        const before = gameState.weather;
        gameState.weather = rollWeather(this.map.zone, gameState.clock.isNight);
        this.weatherTimer = 0;

        this.applySky();
        this.uiManager.refreshHud();

        if (announce && gameState.weather !== before && gameState.weather !== 'clear') {
            this.uiManager.showMessage(getWeather(gameState.weather).blurb, 2400);
        }
    }

    applySky() {
        this.sky?.apply(gameState.clock.phase, gameState.weather);
    }

    // Runs the clock forward and reacts when the hour or the sky turns over
    advanceTime(delta) {
        const phaseChanged = gameState.clock.advance(delta);
        this.uiManager.updateSky();

        this.weatherTimer += delta;
        if (this.weatherTimer >= WorldScene.WEATHER_MS) {
            this.rollWeather(true);
            return;
        }

        if (!phaseChanged) return;

        const phase = gameState.clock.phase;
        this.applySky();
        this.uiManager.refreshHud();
        this.uiManager.showMessage(
            phase.id === 'night'
                ? `${phase.icon} ${phase.label} - other monsters are out now.`
                : `${phase.icon} ${phase.label}`,
            2600
        );
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
        this.npcSprites.forEach(entry => entry.sprite.destroy());
        this.npcSprites = [];

        // The rival only shows up once you have met the previous version of him
        this.map.npcs = this.map.npcs.filter(npc =>
            !npc.requires || gameState.defeatedTrainers.includes(npc.requires));

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
            this.npcSprites.push({ npc, sprite });
        });

        this.spawnItems();
        this.startWandering();
    }

    spawnItems() {
        this.itemSprites.forEach(entry => entry.sprite.destroy());
        this.itemSprites = [];

        // Anything already picked up stays picked up
        this.map.items = this.map.items.filter(item =>
            !gameState.collectedItems.includes(this.itemKey(item)));

        this.map.items.forEach(item => {
            const sprite = this.add.image(
                item.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                item.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                'icon-item'
            );
            sprite.setDepth(6);

            // A gentle bob so it catches the eye from a distance
            this.tweens.add({
                targets: sprite,
                y: sprite.y - 3,
                duration: 700,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.itemSprites.push({ item, sprite });
        });
    }

    itemKey(item) {
        return `${this.map.id}:${item.x},${item.y}`;
    }

    // Townsfolk shuffle about within a couple of tiles of where they started
    startWandering() {
        if (this.wanderTimer) this.wanderTimer.remove();

        this.wanderTimer = this.time.addEvent({
            delay: 900,
            loop: true,
            callback: () => this.stepWanderers()
        });
    }

    stepWanderers() {
        if (this.transitioning || this.battleSystem.isActive()) return;
        if (this.uiManager.isDialogueOpen() || this.uiManager.isOverlayOpen()) return;

        this.npcSprites.forEach(({ npc, sprite }) => {
            if (!npc.wander || !randomInt(0, 1)) return;

            const step = randomFrom([[0, 1], [0, -1], [1, 0], [-1, 0]]);
            const x = npc.x + step[0];
            const y = npc.y + step[1];

            // Stay near home, off the player, and out of walls
            if (Math.abs(x - npc.homeX) > npc.wander || Math.abs(y - npc.homeY) > npc.wander) return;
            if (!this.map.isFree(x, y, npc)) return;

            const player = this.player.getTile();
            if (player.x === x && player.y === y) return;

            npc.x = x;
            npc.y = y;

            this.tweens.add({
                targets: sprite,
                x: x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                y: y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                duration: 380,
                ease: 'Sine.easeInOut'
            });
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
        this.challenging = false;
        gameState.world = this.map;

        // Losing sends you back to the last town you set foot in
        if (this.map.kind === 'town') gameState.lastTownId = this.map.id;

        audioManager.playZoneMusic(this.map.zone);
        this.rollWeather();
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
        this.sky?.resize();
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

        this.events.on('route-event', (data) => this.runRouteEvent(data.event));

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
            if (npc.role === 'mentor') this.uiManager.openMentoring();
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

    // --- route events -------------------------------------------------------

    // Something in the grass that is not a fight. Conditions live in
    // RouteEvents.js; what actually happens lives here, where the world is.
    runRouteEvent(event) {
        this.player.stopMoving();
        touchControls.reset();
        audioManager.playSfx('shop');

        if (!gameState.eventsSeen.includes(event.id)) gameState.eventsSeen.push(event.id);

        if (event.choice) {
            this.uiManager.showChoice(event.speaker, event.lines, event.choice,
                (accepted) => this.resolveRouteEvent(event, accepted));
            return;
        }

        this.uiManager.showDialogue(event.speaker, event.lines,
            () => this.resolveRouteEvent(event, true));
    }

    resolveRouteEvent(event, accepted) {
        if (!accepted) {
            saveGame();
            return;
        }

        const handlers = {
            pedlar: () => this.uiManager.openShop(CONFIG.PEDLAR_STOCK, 'Pedlar'),
            chest: () => this.openRoadsideChest(),
            coins: () => this.findCoins(),
            stray: () => this.adoptStray(),
            campfire: () => this.restAtCampfire(),
            'falling-star': () => this.watchTheStar(),
            sheltered: () => this.acceptSupplies(),
            traveller: () => this.helpTheTraveller()
        };

        (handlers[event.id] || (() => {}))();
        saveGame();
    }

    // Two in five chests are not chests
    openRoadsideChest() {
        if (Math.random() < 0.4) {
            this.uiManager.showMessage('The lid opens on its own. Teeth.', 2200);

            const level = this.map.getWildLevel() + 3;
            const ambusher = createWildMonster(this.map.zone, level, gameState.clock.isNight);

            this.time.delayedCall(1100, () => this.startWildBattle(ambusher));
            return;
        }

        const prize = randomFrom(['Super Potion', 'Super Ball', 'Full Potion', 'Antidote', 'Ultra Ball']);
        this.player.getInventory().addItem(prize, 1);

        audioManager.playSfx('caught');
        this.uiManager.showMessage(`The chest held ${withArticle(prize)}!`, 2600);
    }

    findCoins() {
        const found = randomInt(30, 90);
        this.player.addCoins(found);

        audioManager.playSfx('buy');
        this.uiManager.refreshHud();
        this.uiManager.showMessage(`You dug out ${found} coins.`, 2400);
    }

    // A wild monster that would rather travel with you than fight you
    adoptStray() {
        const level = Math.max(2, this.map.getWildLevel() - 1);
        const stray = createWildMonster(this.map.zone, level, gameState.clock.isNight);

        const result = this.player.catchMonster(stray);
        if (!result.success) {
            this.uiManager.showMessage(result.reason, 2400);
            return;
        }

        // It came along willingly, so it starts out already fond of you
        stray.addBond(30);

        audioManager.playSfx('caught');
        this.uiManager.refreshHud();
        this.uiManager.showMessage(`${stray.name} (Lv.${stray.level}) joined you!`, 3200);
        this.uiManager.checkDexCompletion();
    }

    restAtCampfire() {
        this.player.getAllMonsters().forEach(monster => monster.refillPp());

        audioManager.playSfx('heal');
        this.uiManager.showMessage('Every move is fully restored.', 2400);
    }

    watchTheStar() {
        this.player.healAll();
        this.player.getAllMonsters().forEach(monster => monster.addBond(8));

        audioManager.playSfx('victory');
        this.uiManager.refreshHud();
        this.uiManager.showMessage('Your team is rested, and a little closer to you.', 3200);
    }

    // Stopping costs you. That is rather the point of it - so the coins go
    // whether or not the traveller has anything to give back.
    helpTheTraveller() {
        const spent = Math.min(this.player.coins, 60);
        this.player.addCoins(-spent);
        this.player.getAllMonsters().forEach(monster => monster.addBond(12));

        // What he has left is not worth what it cost you, and he knows it
        this.player.getInventory().addItem('Full Potion', 1);

        audioManager.playSfx('heal');
        this.uiManager.refreshHud();
        this.uiManager.showDialogue(null, [
            `You spend ${spent} coins of your own on bandages and water, and sit with him until he can stand.`,
            'He presses a Full Potion into your hand. It is all he has left.',
            'Your monsters watched the whole thing. They walk closer to you afterwards.'
        ]);
    }

    acceptSupplies() {
        ['Super Potion', 'Antidote'].forEach(item => this.player.getInventory().addItem(item, 1));

        audioManager.playSfx('caught');
        this.uiManager.showMessage('You were given a Super Potion and an Antidote.', 2800);
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

        this.advanceTime(delta);

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
        this.checkTrainerSight();
    }

    // A trainer who can see you down the line they are facing will call you out
    checkTrainerSight() {
        if (this.challenging || this.battleSystem.isActive()) return;

        const player = this.player.getTile();

        const spotter = this.map.npcs.find(npc =>
            npc.trainer && !npc.beaten && npc.sight
            && this.map.tilesInFront(npc).some(t => t.x === player.x && t.y === player.y));

        if (spotter) this.trainerSpotsPlayer(spotter);
    }

    trainerSpotsPlayer(npc) {
        this.challenging = true;
        this.player.stopMoving();
        touchControls.reset();

        const entry = this.npcSprites.find(e => e.npc === npc);
        audioManager.playSfx('shop');

        // "!" over their head, then they walk over
        if (entry) {
            const mark = this.add.text(entry.sprite.x, entry.sprite.y - 22, '!', {
                fontFamily: 'monospace', fontSize: '20px', color: '#ffcc00',
                stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5, 0.5).setDepth(30);

            this.tweens.add({ targets: mark, y: mark.y - 8, duration: 260, yoyo: true, repeat: 1,
                              onComplete: () => mark.destroy() });
        }

        this.time.delayedCall(700, () => {
            const player = this.player.getTile();
            const stopBefore = { x: player.x, y: player.y };
            const step = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
                           north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] }[npc.facing];

            // Stand one tile short of the player
            npc.x = stopBefore.x - step[0];
            npc.y = stopBefore.y - step[1];

            if (entry) {
                this.tweens.add({
                    targets: entry.sprite,
                    x: npc.x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                    y: npc.y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                    duration: 420,
                    onComplete: () => this.beginChallenge(npc)
                });
            } else {
                this.beginChallenge(npc);
            }
        });
    }

    beginChallenge(npc) {
        this.uiManager.showDialogue(npc.trainer.title, npc.trainer.intro, () => {
            this.challenging = false;
            this.startTrainerBattle(npc);
        });
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

        const pickup = this.map.getItemAt(tile.x, tile.y);
        if (pickup) this.collectItem(pickup);

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
            case 'den':
                this.triggerLegendary();
                break;
        }
    }

    collectItem(pickup) {
        this.player.getInventory().addItem(pickup.item, 1);
        gameState.collectedItems.push(this.itemKey(pickup));

        const entry = this.itemSprites.find(e => e.item === pickup);
        if (entry) {
            this.tweens.add({
                targets: entry.sprite,
                y: entry.sprite.y - 18,
                alpha: 0,
                duration: 420,
                onComplete: () => entry.sprite.destroy()
            });
            this.itemSprites = this.itemSprites.filter(e => e !== entry);
        }

        this.map.items = this.map.items.filter(i => i !== pickup);

        audioManager.playSfx('caught');
        this.uiManager.showMessage(`Found ${withArticle(pickup.item)}!`, 2000);
        saveGame();
    }

    triggerLegendary() {
        if (gameState.legendaryDefeated) {
            this.uiManager.showMessage('The den is empty now.', 2000);
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
