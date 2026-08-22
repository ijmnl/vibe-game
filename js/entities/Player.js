class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.speed = CONFIG.PLAYER_SPEED;
        this.direction = 'down';
        this.isMoving = false;
        this.sprite = null;
        this.monsters = [];
        this.currentMonsterIndex = 0;
        this.inventory = new Inventory();
        
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
        
        // Center the origin
        this.sprite.setOrigin(0.5, 0.5);

        // Set depth so player is above world but below UI
        this.sprite.setDepth(10);
    }

    update() {
        // Movement is driven by the scene's input handling; encounters are
        // rolled by EncounterSystem. Nothing to do per-frame right now.
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

    // Stop moving
    stopMoving() {
        this.isMoving = false;
    }

    // Add a monster to player's team
    addMonster(name, level) {
        if (this.monsters.length >= CONFIG.MAX_MONSTERS_IN_TEAM) {
            return false; // Team is full
        }
        
        this.monsters.push(new Monster(name, level));
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
        if (!monster) return false;

        monster.heal(amount);
        return true;
    }

    // Add EXP to current monster
    addExp(amount) {
        const monster = this.getCurrentMonster();
        if (!monster) return false;

        const leveledUp = monster.addExp(amount);

        if (leveledUp) {
            this.scene.events.emit('monster-levelup', {
                monster: monster,
                player: this
            });
        }

        return leveledUp;
    }

    // Catch a new monster
    catchMonster(monsterData) {
        if (this.monsters.length >= CONFIG.MAX_MONSTERS_IN_TEAM) {
            return { success: false, reason: 'Team is full' };
        }
        
        // A caught monster joins the team at half HP
        const newMonster = Monster.fromData({
            ...monsterData,
            hp: Math.floor(monsterData.maxHp * 0.5),
            exp: 0
        });

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
            monsters: this.monsters.map(monster => monster.getSaveData()),
            currentMonsterIndex: this.currentMonsterIndex,
            inventory: this.inventory.getSaveData()
        };
    }

    // Load player data
    loadSaveData(data) {
        this.sprite.x = data.x || this.sprite.x;
        this.sprite.y = data.y || this.sprite.y;
        if (Array.isArray(data.monsters) && data.monsters.length > 0) {
            this.monsters = data.monsters.map(monster => Monster.fromData(monster));
        }
        this.currentMonsterIndex = data.currentMonsterIndex || 0;
        this.inventory.loadSaveData(data.inventory || {});
    }
}
