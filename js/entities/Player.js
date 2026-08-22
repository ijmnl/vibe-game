class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.speed = CONFIG.PLAYER_SPEED;
        this.direction = 'down';
        this.isMoving = false;
        this.sprite = null;
        this.collisionBox = null;
        this.monsters = [];
        this.currentMonsterIndex = 0;
        this.inventory = new Inventory();
        this.lastEncounterTime = 0;
        
        // Create player sprite
        this.createSprite();
        
        // Add starting monsters
        this.addMonster('Slime', 5);
        this.addMonster('Rat', 3);
        
        // Add starting items
        CONFIG.STARTING_ITEMS.forEach(item => {
            this.inventory.addItem(item.name, item.quantity);
        });
    }

    createSprite() {
        // Create a simple rectangle sprite for now
        // We'll replace this with actual pixel art later
        this.sprite = this.scene.add.rectangle(
            this.x, 
            this.y, 
            CONFIG.TILE_SIZE, 
            CONFIG.TILE_SIZE, 
            CONFIG.COLORS.player
        );
        
        // Create collision box (slightly smaller than sprite)
        this.collisionBox = this.scene.add.rectangle(
            this.x, 
            this.y, 
            CONFIG.TILE_SIZE * 0.8, 
            CONFIG.TILE_SIZE * 0.8, 
            0x00ff00, 
            0.3
        );
        
        // Center the origin
        this.sprite.setOrigin(0.5, 0.5);
        this.collisionBox.setOrigin(0.5, 0.5);
        
        // Set depth so player is above world but below UI
        this.sprite.setDepth(10);
        this.collisionBox.setDepth(10);
    }

    update(delta) {
        // Handle movement
        if (this.isMoving) {
            // Movement is handled by the input system
        }
        
        // Check for encounters
        this.checkEncounters(delta);
        
        // Update collision box position
        this.collisionBox.x = this.sprite.x;
        this.collisionBox.y = this.sprite.y;
    }

    // Move player in a direction
    move(direction, delta) {
        this.direction = direction;
        this.isMoving = true;
        
        const speed = this.speed * delta / 1000; // Convert to per-frame movement
        
        let newX = this.sprite.x;
        let newY = this.sprite.y;
        
        switch (direction) {
            case 'up':
                newY -= speed;
                break;
            case 'down':
                newY += speed;
                break;
            case 'left':
                newX -= speed;
                break;
            case 'right':
                newX += speed;
                break;
        }
        
        // Check collision
        if (!this.checkCollision(newX, newY)) {
            this.sprite.x = newX;
            this.sprite.y = newY;
            return true; // Movement successful
        }
        
        return false; // Movement blocked
    }

    // Check if new position would cause collision
    checkCollision(x, y) {
        const world = this.scene.worldGenerator;
        
        // Convert world position to tile coordinates
        const tileX = Math.floor(x / CONFIG.TILE_SIZE);
        const tileY = Math.floor(y / CONFIG.TILE_SIZE);
        
        // Check if out of bounds
        if (tileX < 0 || tileX >= world.worldWidth || tileY < 0 || tileY >= world.worldHeight) {
            return true;
        }
        
        // Check collision map
        return world.isCollidable(tileX, tileY);
    }

    // Check for random encounters
    checkEncounters(delta) {
        const now = this.scene.time.now;
        
        // Check cooldown
        if (now - this.lastEncounterTime < CONFIG.ENCOUNTER_COOLDOWN) {
            return;
        }
        
        // Get current tile
        const tileX = Math.floor(this.sprite.x / CONFIG.TILE_SIZE);
        const tileY = Math.floor(this.sprite.y / CONFIG.TILE_SIZE);
        const tile = this.scene.worldGenerator.getTileAt(tileX, tileY);
        
        if (!tile) return;
        
        // Only trigger encounters in certain zones
        const zone = CONFIG.ZONES[tile.zone];
        if (!zone || !zone.encounterRate) return;
        
        // Check if moving
        if (!this.isMoving) return;
        
        // Random chance for encounter
        if (Math.random() < zone.encounterRate) {
            this.lastEncounterTime = now;
            this.isMoving = false;
            
            // Trigger encounter
            this.scene.events.emit('encounter-start', {
                player: this,
                zone: tile.zone
            });
        }
    }

    // Stop moving
    stopMoving() {
        this.isMoving = false;
    }

    // Add a monster to player's team
    addMonster(name, level) {
        if (this.monsters.length >= CONFIG.MAX_MONSTERS_IN_TEAM) {
            return false; // Team is full
        }
        
        const stats = getMonsterStats(name);
        const monster = {
            name: name,
            level: level,
            maxHp: Math.floor(stats.hp * (1 + level * 0.2)),
            hp: Math.floor(stats.hp * (1 + level * 0.2)),
            attack: Math.floor(stats.attack * (1 + level * 0.15)),
            defense: Math.floor(stats.defense * (1 + level * 0.1)),
            speed: Math.floor(stats.speed * (1 + level * 0.05)),
            exp: 0,
            expToLevel: Math.floor(stats.exp * 1.5),
            type: this.getRandomType()
        };
        
        this.monsters.push(monster);
        return true;
    }

    // Get current monster
    getCurrentMonster() {
        return this.monsters[this.currentMonsterIndex] || null;
    }

    // Switch to next monster
    nextMonster() {
        this.currentMonsterIndex = (this.currentMonsterIndex + 1) % this.monsters.length;
        return this.getCurrentMonster();
    }

    // Get random monster type
    getRandomType() {
        const types = CONFIG.MONSTER_TYPES;
        return types[Math.floor(Math.random() * types.length)];
    }

    // Get position
    getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }

    // Get zone
    getZone() {
        const tileX = Math.floor(this.sprite.x / CONFIG.TILE_SIZE);
        const tileY = Math.floor(this.sprite.y / CONFIG.TILE_SIZE);
        const tile = this.scene.worldGenerator.getTileAt(tileX, tileY);
        return tile ? tile.zone : 'GRASS';
    }

    // Heal current monster
    healMonster(amount) {
        const monster = this.getCurrentMonster();
        if (monster) {
            monster.hp = Math.min(monster.hp + amount, monster.maxHp);
            return true;
        }
        return false;
    }

    // Add EXP to current monster
    addExp(amount) {
        const monster = this.getCurrentMonster();
        if (monster) {
            monster.exp += amount;
            
            // Check for level up
            if (monster.exp >= monster.expToLevel) {
                monster.level++;
                monster.exp -= monster.expToLevel;
                monster.expToLevel = Math.floor(monster.expToLevel * 1.3);
                
                // Increase stats
                monster.maxHp = Math.floor(monster.maxHp * 1.1);
                monster.hp = monster.maxHp;
                monster.attack = Math.floor(monster.attack * 1.1);
                monster.defense = Math.floor(monster.defense * 1.05);
                monster.speed = Math.floor(monster.speed * 1.03);
                
                this.scene.events.emit('monster-levelup', {
                    monster: monster,
                    player: this
                });
                
                return true; // Level up occurred
            }
        }
        return false;
    }

    // Catch a new monster
    catchMonster(monsterData) {
        if (this.monsters.length >= CONFIG.MAX_MONSTERS_IN_TEAM) {
            return { success: false, reason: 'Team is full' };
        }
        
        // Add the monster to team
        const newMonster = {
            name: monsterData.name,
            level: monsterData.level,
            maxHp: monsterData.maxHp,
            hp: Math.floor(monsterData.maxHp * 0.5), // Start with half HP
            attack: monsterData.attack,
            defense: monsterData.defense,
            speed: monsterData.speed,
            exp: 0,
            expToLevel: monsterData.expToLevel || Math.floor(getMonsterStats(monsterData.name).exp * 1.5),
            type: monsterData.type || this.getRandomType()
        };
        
        this.monsters.push(newMonster);
        
        return { success: true, monster: newMonster };
    }

    // Get all monsters
    getAllMonsters() {
        return this.monsters;
    }

    // Remove monster from team
    removeMonster(index) {
        if (index >= 0 && index < this.monsters.length) {
            this.monsters.splice(index, 1);
            
            // Adjust current monster index
            if (this.currentMonsterIndex >= this.monsters.length) {
                this.currentMonsterIndex = Math.max(0, this.monsters.length - 1);
            }
            
            return true;
        }
        return false;
    }

    // Get inventory
    getInventory() {
        return this.inventory;
    }

    // Use an item
    useItem(itemName) {
        return this.inventory.useItem(itemName, this);
    }

    // Get player data for saving
    getSaveData() {
        return {
            x: this.sprite.x,
            y: this.sprite.y,
            monsters: this.monsters,
            currentMonsterIndex: this.currentMonsterIndex,
            inventory: this.inventory.getSaveData()
        };
    }

    // Load player data
    loadSaveData(data) {
        this.sprite.x = data.x || this.sprite.x;
        this.sprite.y = data.y || this.sprite.y;
        this.monsters = data.monsters || this.monsters;
        this.currentMonsterIndex = data.currentMonsterIndex || 0;
        this.inventory.loadSaveData(data.inventory || {});
    }
}
