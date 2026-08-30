class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.speed = CONFIG.PLAYER_SPEED;
        this.direction = 'down';
        this.isMoving = false;
        this.sprite = null;

        this.monsters = [];
        this.currentMonsterIndex = 0;
        this.inventory = new Inventory();
        this.coins = CONFIG.STARTING_COINS;

        // Monsterdex: which species have been seen and which caught
        this.seen = new Set();
        this.caught = new Set();

        this.createSprite(x, y);

        // Starter team, a level clear of Route 1's monsters so the first few
        // fights are winnable rather than a wall
        this.addMonster('Slime', 6);
        this.addMonster('Rat', 6);

        CONFIG.STARTING_ITEMS.forEach(item => {
            this.inventory.addItem(item.name, item.quantity);
        });
    }

    createSprite(x, y) {
        this.sprite = this.scene.add.sprite(x, y, 'player', 0);
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setDepth(10);
        this.sprite.play('idle-down');
    }

    update() {
        // Movement is driven by the scene's input handling; encounters are
        // rolled by EncounterSystem.
    }

    move(direction, delta) {
        this.direction = direction;
        this.isMoving = true;

        const step = this.speed * delta / 1000;
        let newX = this.sprite.x;
        let newY = this.sprite.y;

        switch (direction) {
            case 'up':    newY -= step; break;
            case 'down':  newY += step; break;
            case 'left':  newX -= step; break;
            case 'right': newX += step; break;
        }

        this.playAnimation(`walk-${direction}`);

        // Slide along walls instead of sticking to them: try the full move,
        // then each axis on its own.
        if (!this.checkCollision(newX, newY)) {
            this.sprite.x = newX;
            this.sprite.y = newY;
            return true;
        }
        if (!this.checkCollision(newX, this.sprite.y)) {
            this.sprite.x = newX;
            return true;
        }
        if (!this.checkCollision(this.sprite.x, newY)) {
            this.sprite.y = newY;
            return true;
        }

        return false;
    }

    playAnimation(key) {
        if (this.sprite.anims.currentAnim?.key !== key) {
            this.sprite.play(key, true);
        }
    }

    // The player's feet are what collide, not the whole 32px sprite
    checkCollision(x, y) {
        const world = this.scene.map;
        const half = CONFIG.TILE_SIZE * 0.28;
        const footY = y + CONFIG.TILE_SIZE * 0.25;

        const corners = [
            [x - half, footY - half],
            [x + half, footY - half],
            [x - half, footY + half],
            [x + half, footY + half]
        ];

        return corners.some(([cornerX, cornerY]) => world.isCollidable(
            Math.floor(cornerX / CONFIG.TILE_SIZE),
            Math.floor(cornerY / CONFIG.TILE_SIZE)
        ));
    }

    stopMoving() {
        this.isMoving = false;
        this.playAnimation(`idle-${this.direction}`);
    }

    // --- team ---------------------------------------------------------------

    addMonster(name, level) {
        if (this.monsters.length >= CONFIG.MAX_MONSTERS_IN_TEAM) {
            return false;
        }

        const monster = new Monster(name, level);
        this.monsters.push(monster);
        this.recordCaught(monster.name);

        return true;
    }

    getCurrentMonster() {
        return this.monsters[this.currentMonsterIndex] || null;
    }

    // First team member that can still fight
    getFirstHealthyIndex() {
        return this.monsters.findIndex(monster => monster.isAlive());
    }

    hasHealthyMonster() {
        return this.monsters.some(monster => monster.isAlive());
    }

    getAllMonsters() {
        return this.monsters;
    }

    healAll() {
        this.monsters.forEach(monster => monster.fullHeal());
    }

    catchMonster(wild) {
        this.recordCaught(wild.name);

        if (this.monsters.length >= CONFIG.MAX_MONSTERS_IN_TEAM) {
            return { success: false, reason: 'Your team is full!' };
        }

        wild.isWild = false;
        wild.resetBattleState();
        this.monsters.push(wild);

        return { success: true, monster: wild };
    }

    // Move a monster up or down the team order. The first slot is the one
    // that leads every battle, so this is how you choose your lead.
    reorderMonster(index, direction) {
        const target = index + direction;

        if (index < 0 || index >= this.monsters.length) return false;
        if (target < 0 || target >= this.monsters.length) return false;

        const [moved] = this.monsters.splice(index, 1);
        this.monsters.splice(target, 0, moved);

        // Keep the highlighted monster pointing at the same creature
        if (this.currentMonsterIndex === index) this.currentMonsterIndex = target;
        else if (this.currentMonsterIndex === target) this.currentMonsterIndex = index;

        return true;
    }

    removeMonster(index) {
        if (index < 0 || index >= this.monsters.length) return false;

        this.monsters.splice(index, 1);
        if (this.currentMonsterIndex >= this.monsters.length) {
            this.currentMonsterIndex = Math.max(0, this.monsters.length - 1);
        }

        return true;
    }

    // --- dex, coins, items --------------------------------------------------

    recordSeen(name) {
        this.seen.add(name);
    }

    recordCaught(name) {
        this.seen.add(name);
        this.caught.add(name);
    }

    addCoins(amount) {
        this.coins = Math.max(0, this.coins + amount);
    }

    canAfford(amount) {
        return this.coins >= amount;
    }

    getPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    getTile() {
        return {
            x: Math.floor(this.sprite.x / CONFIG.TILE_SIZE),
            y: Math.floor(this.sprite.y / CONFIG.TILE_SIZE)
        };
    }

    getZone() {
        return this.scene.map.zone;
    }

    getInventory() {
        return this.inventory;
    }

    // --- saving -------------------------------------------------------------

    getSaveData() {
        return {
            x: this.sprite.x,
            y: this.sprite.y,
            direction: this.direction,
            coins: this.coins,
            monsters: this.monsters.map(monster => monster.getSaveData()),
            currentMonsterIndex: this.currentMonsterIndex,
            inventory: this.inventory.getSaveData(),
            seen: [...this.seen],
            caught: [...this.caught]
        };
    }

    loadSaveData(data) {
        this.sprite.x = data.x ?? this.sprite.x;
        this.sprite.y = data.y ?? this.sprite.y;
        this.direction = data.direction || 'down';
        this.coins = data.coins ?? this.coins;

        if (Array.isArray(data.monsters) && data.monsters.length > 0) {
            this.monsters = data.monsters.map(monster => Monster.fromData(monster));
        }

        this.currentMonsterIndex = Math.min(
            data.currentMonsterIndex || 0,
            Math.max(0, this.monsters.length - 1)
        );

        this.inventory.loadSaveData(data.inventory || {});
        this.seen = new Set(data.seen || this.monsters.map(m => m.name));
        this.caught = new Set(data.caught || this.monsters.map(m => m.name));

        this.playAnimation(`idle-${this.direction}`);
    }
}
