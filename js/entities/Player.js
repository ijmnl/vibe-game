class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.speed = CONFIG.PLAYER_SPEED;
        this.direction = 'down';
        this.isMoving = false;
        this.sprite = null;
        this.movingFor = 0;   // ms held in one go, used to break into a run

        this.monsters = [];
        // Everything caught past a full team. Nothing is ever lost to a full
        // team; you swap between the two from the menu.
        this.ranch = [];
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
        // The art stands taller than a tile, so the origin puts the feet
        // where a tile-sized sprite's feet were rather than the middle of
        // the figure - everything else still works in tile positions.
        this.sprite.setOrigin(0.5, SpriteFactory.PERSON_ORIGIN_Y);
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
        this.movingFor += delta;

        // Keep going and you break into a run - a route is a long walk otherwise
        const running = this.movingFor > CONFIG.RUN_AFTER_MS;
        const speed = this.speed * (running ? CONFIG.RUN_MULTIPLIER : 1);
        const step = speed * delta / 1000;
        let newX = this.sprite.x;
        let newY = this.sprite.y;

        switch (direction) {
            case 'up':    newY -= step; break;
            case 'down':  newY += step; break;
            case 'left':  newX -= step; break;
            case 'right': newX += step; break;
        }

        this.playAnimation(`walk-${direction}`);
        this.sprite.anims.timeScale = running ? 1.5 : 1;

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
        this.movingFor = 0;
        this.sprite.anims.timeScale = 1;
        this.playAnimation(`idle-${this.direction}`);
    }

    isRunning() {
        return this.isMoving && this.movingFor > CONFIG.RUN_AFTER_MS;
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
        this.ranch.forEach(monster => monster.fullHeal());
    }

    catchMonster(wild) {
        this.recordCaught(wild.name);

        wild.isWild = false;
        wild.resetBattleState();

        if (this.monsters.length >= CONFIG.MAX_MONSTERS_IN_TEAM) {
            if (this.ranch.length >= CONFIG.MAX_MONSTERS_IN_RANCH) {
                return { success: false, reason: 'the ranch is full too!' };
            }

            this.ranch.push(wild);
            return { success: true, monster: wild, stored: true };
        }

        this.monsters.push(wild);

        return { success: true, monster: wild, stored: false };
    }

    // --- the ranch ----------------------------------------------------------

    getRanch() {
        return this.ranch;
    }

    // Move one monster from the ranch into the team. Fails on a full team,
    // which is what the swap below is for.
    withdrawMonster(index) {
        const monster = this.ranch[index];
        if (!monster) return false;
        if (this.monsters.length >= CONFIG.MAX_MONSTERS_IN_TEAM) return false;

        this.ranch.splice(index, 1);
        this.monsters.push(monster);

        return true;
    }

    // Move one monster from the team to the ranch. The last one stays: a
    // team of nobody has no way back out of a lost battle.
    depositMonster(index) {
        const monster = this.monsters[index];
        if (!monster) return false;
        if (this.monsters.length <= 1) return false;
        if (this.ranch.length >= CONFIG.MAX_MONSTERS_IN_RANCH) return false;

        this.monsters.splice(index, 1);
        this.ranch.push(monster);

        if (this.currentMonsterIndex >= this.monsters.length) {
            this.currentMonsterIndex = this.monsters.length - 1;
        }

        return true;
    }

    // Trade a team member for a ranch one in a single step, so a full team
    // is never a reason you cannot bring something home.
    swapWithRanch(teamIndex, ranchIndex) {
        const mine = this.monsters[teamIndex];
        const theirs = this.ranch[ranchIndex];
        if (!mine || !theirs) return false;

        this.monsters[teamIndex] = theirs;
        this.ranch[ranchIndex] = mine;

        return true;
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

    // The monster a healing item should go to: the one furthest from full
    getMostHurtMonster() {
        const hurt = this.monsters.filter(monster => monster.hp < monster.maxHp);
        if (!hurt.length) return null;

        return hurt.reduce((worst, monster) =>
            monster.hp / monster.maxHp < worst.hp / worst.maxHp ? monster : worst);
    }

    // Using an item from the overworld menu, where there is no battle to
    // pick a target from. Healing goes to whoever needs it most.
    useItem(itemName) {
        const item = CONFIG.ITEMS[itemName];
        if (!item || !this.inventory.hasItem(itemName)) {
            return { success: false, reason: 'You have none of those.' };
        }

        if (item.type === 'heal') {
            const monster = this.getMostHurtMonster();
            if (!monster) return { success: false, reason: 'Nobody needs healing.' };

            const healed = monster.heal(item.value);
            this.inventory.removeItem(itemName, 1);

            return { success: true, message: `${monster.name} recovered ${healed} HP.` };
        }

        if (item.type === 'cure') {
            const monster = this.monsters.find(m => m.status);
            if (!monster) return { success: false, reason: 'Nobody has a status to cure.' };

            monster.status = null;
            this.inventory.removeItem(itemName, 1);

            return { success: true, message: `${monster.name} is back to normal.` };
        }

        if (item.type === 'pp') {
            const empty = this.monsters.some(m => m.moves.some(move => m.getPp(move) < getMove(move).pp));
            if (!empty) return { success: false, reason: 'Every move is already full.' };

            this.monsters.forEach(monster => monster.refillPp());
            this.inventory.removeItem(itemName, 1);

            return { success: true, message: 'Every move is fully restored!' };
        }

        if (item.type === 'bond') {
            const monster = this.getCurrentMonster() || this.monsters[0];
            if (!monster) return { success: false, reason: 'You have no monsters.' };
            if (monster.bond >= Monster.MAX_BOND) {
                return { success: false, reason: `${monster.name} could not be closer to you.` };
            }

            monster.addBond(item.value);
            this.inventory.removeItem(itemName, 1);

            return { success: true, message: `${monster.name} looks delighted.` };
        }

        if (item.type === 'ball') {
            return { success: false, reason: 'Save that for a wild monster.' };
        }

        return { success: false, reason: 'You cannot use that here.' };
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
            ranch: this.ranch.map(monster => monster.getSaveData()),
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

        // Saves written before the ranch existed simply have none
        this.ranch = (data.ranch || []).map(monster => Monster.fromData(monster));

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
