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
        this.lastTime = 0;
    }

    preload() {
        // Preload any assets (for now, we'll generate everything)
        // Later we can add actual asset loading here
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
        
        // Set up camera
        this.setupCamera();
        
        // Set up input
        this.setupInput();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initial draw
        this.minimap.draw();
        this.uiManager.updatePlayerStats(spawnPos);
        
        // Start game loop
        this.time.addEvent({
            delay: 16, // ~60fps
            callback: this.update,
            callbackScope: this,
            loop: true
        });
    }

    createWorld() {
        // Create a container for the world
        this.worldContainer = this.add.container(0, 0);
        
        // Draw world tiles
        const worldData = this.worldGenerator.worldData;
        
        for (let y = 0; y < worldData.length; y++) {
            for (let x = 0; x < worldData[y].length; x++) {
                const tile = worldData[y][x];
                if (!tile) continue;
                
                // Create tile sprite
                const tileSprite = this.add.rectangle(
                    x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                    y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
                    CONFIG.TILE_SIZE,
                    CONFIG.TILE_SIZE,
                    tile.color
                );
                
                tileSprite.setOrigin(0.5, 0.5);
                tileSprite.setDepth(0);
                
                // Add some variation to tile appearance
                if (tile.type === 'forest_tree') {
                    // Draw a tree (simple representation)
                    this.drawTree(x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2, 
                                 y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2);
                } else if (tile.type === 'cave_rock') {
                    // Draw a rock
                    this.drawRock(x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2, 
                                 y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2);
                } else if (tile.type === 'water') {
                    // Add water animation
                    this.addWaterEffect(x * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2, 
                                       y * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2);
                }
                
                this.worldContainer.add(tileSprite);
            }
        }
    }

    drawTree(x, y) {
        // Draw a simple tree
        const trunk = this.add.rectangle(x, y + 4, CONFIG.TILE_SIZE * 0.4, CONFIG.TILE_SIZE * 0.6, 0x8b4513);
        const leaves = this.add.ellipse(x, y - 4, CONFIG.TILE_SIZE * 0.6, CONFIG.TILE_SIZE * 0.4, 0x228b22);
        
        trunk.setDepth(5);
        leaves.setDepth(5);
        
        this.worldContainer.add(trunk);
        this.worldContainer.add(leaves);
    }

    drawRock(x, y) {
        // Draw a simple rock
        const rock = this.add.ellipse(x, y, CONFIG.TILE_SIZE * 0.4, CONFIG.TILE_SIZE * 0.3, 0x696969);
        rock.setDepth(5);
        this.worldContainer.add(rock);
    }

    addWaterEffect(x, y) {
        // Create a simple water animation
        const water = this.add.rectangle(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, 0x1e90ff);
        water.setDepth(1);
        
        // Add subtle animation
        this.tweens.add({
            targets: water,
            alpha: 0.8,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
        
        this.worldContainer.add(water);
    }

    setupCamera() {
        // Create camera
        this.cameras.main.setBounds(
            0, 
            0,
            this.worldGenerator.worldWidth * CONFIG.TILE_SIZE,
            this.worldGenerator.worldHeight * CONFIG.TILE_SIZE
        );
        
        // Follow player
        this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
        
        // Set camera zoom
        this.cameras.main.setZoom(1.5);
    }

    setupInput() {
        // Keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Touch input (for mobile)
        this.input.on('pointerdown', (pointer) => {
            // Store touch start position
            this.touchStart = { x: pointer.x, y: pointer.y };
        });
        
        this.input.on('pointerup', (pointer) => {
            if (!this.touchStart) return;
            
            // Calculate touch direction
            const dx = pointer.x - this.touchStart.x;
            const dy = pointer.y - this.touchStart.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal movement
                if (dx > 50) {
                    this.player.direction = 'right';
                } else if (dx < -50) {
                    this.player.direction = 'left';
                }
            } else {
                // Vertical movement
                if (dy > 50) {
                    this.player.direction = 'down';
                } else if (dy < -50) {
                    this.player.direction = 'up';
                }
            }
            
            this.touchStart = null;
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
        this.events.on('battle-start', (data) => {
            // Disable player movement
            this.player.isMoving = false;
        });
        
        // Battle end
        this.events.on('battle-end', (data) => {
            // Enable player movement
            this.player.isMoving = false;
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
        // Update player
        if (this.player) {
            // Handle keyboard input
            this.handlePlayerInput(delta);
            
            // Update player
            this.player.update(delta);
            
            // Update encounter system
            this.encounterSystem.update(delta);
        }
        
        // Update minimap
        if (this.minimap) {
            this.minimap.update();
        }
    }

    handlePlayerInput(delta) {
        // Reset movement flag
        this.player.isMoving = false;
        
        // Handle keyboard input
        if (this.cursors.left.isDown) {
            this.player.isMoving = true;
            this.player.move('left', delta);
        } else if (this.cursors.right.isDown) {
            this.player.isMoving = true;
            this.player.move('right', delta);
        } else if (this.cursors.up.isDown) {
            this.player.isMoving = true;
            this.player.move('up', delta);
        } else if (this.cursors.down.isDown) {
            this.player.isMoving = true;
            this.player.move('down', delta);
        }
        
        // Emit player move event for UI updates
        if (this.player.isMoving) {
            const pos = this.player.getPosition();
            this.events.emit('player-move', pos);
            this.minimap.playerX = pos.x;
            this.minimap.playerY = pos.y;
        }
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
        this.player.isMoving = false;
    }
}
