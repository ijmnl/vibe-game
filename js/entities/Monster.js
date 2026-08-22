/**
 * Monster - pure data + battle logic.
 *
 * Monsters deliberately own no Phaser display objects: a monster outlives the
 * scene it was created in (a caught monster travels from BattleScene back to
 * WorldScene), so each scene draws its own visuals from this data instead.
 */
class Monster {
    constructor(name, level, isWild = false) {
        this.name = name;
        this.level = level || 1;
        this.isWild = isWild;
        this.type = this.getRandomType();

        // Get base stats
        const stats = getMonsterStats(name);

        // Calculate stats based on level
        this.maxHp = Math.floor(stats.hp * (1 + this.level * 0.2));
        this.hp = this.maxHp;
        this.attack = Math.floor(stats.attack * (1 + this.level * 0.15));
        this.defense = Math.floor(stats.defense * (1 + this.level * 0.1));
        this.speed = Math.floor(stats.speed * (1 + this.level * 0.05));

        // Experience
        this.exp = 0;
        this.expToLevel = Math.floor(stats.exp * 1.5);

        // Battle stats
        this.status = null; // null, 'burn', 'poison', 'sleep', etc.
        this.statusTurns = 0;
    }

    // Colour used when a scene needs to draw this monster
    getColor() {
        const colors = {
            'Normal': 0xcccccc,
            'Fire': 0xff4444,
            'Water': 0x4444ff,
            'Grass': 0x44ff44,
            'Electric': 0xffff44,
            'Rock': 0x888888
        };

        return colors[this.type] || 0xff00ff;
    }

    update() {
        // Update status effects
        if (this.status) {
            this.statusTurns--;
            if (this.statusTurns <= 0) {
                this.status = null;
            } else {
                this.applyStatusEffect();
            }
        }
    }

    getRandomType() {
        return CONFIG.MONSTER_TYPES[Math.floor(Math.random() * CONFIG.MONSTER_TYPES.length)];
    }

    applyStatusEffect() {
        switch (this.status) {
            case 'burn':
                this.hp = Math.max(0, this.hp - Math.floor(this.maxHp * 0.05));
                break;
            case 'poison':
                this.hp = Math.max(0, this.hp - Math.floor(this.maxHp * 0.08));
                break;
            case 'sleep':
                // Can't attack while asleep
                break;
        }
    }

    // Take damage
    takeDamage(amount) {
        // Calculate defense reduction
        const defenseReduction = Math.floor(amount * (this.defense / (this.defense + 10)));
        const actualDamage = Math.max(1, amount - defenseReduction);

        this.hp = Math.max(0, this.hp - actualDamage);

        return actualDamage;
    }

    // Heal
    heal(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - oldHp;
    }

    // Check if monster is alive
    isAlive() {
        return this.hp > 0;
    }

    // Check if monster can act (not asleep, etc.)
    canAct() {
        return this.isAlive() && this.status !== 'sleep';
    }

    // Get attack damage
    getAttackDamage() {
        return this.attack;
    }

    // Use a move/attack
    useAttack(attackType, target) {
        let damage = this.getAttackDamage();
        let message = `${this.name} used ${attackType}!`;

        // Apply type bonuses
        if (attackType === 'Fire' && target.type === 'Grass') {
            damage = Math.floor(damage * 1.5);
            message += ' It\'s super effective!';
        } else if (attackType === 'Water' && target.type === 'Fire') {
            damage = Math.floor(damage * 1.5);
            message += ' It\'s super effective!';
        } else if (attackType === 'Grass' && target.type === 'Water') {
            damage = Math.floor(damage * 1.5);
            message += ' It\'s super effective!';
        } else if (attackType === 'Electric' && target.type === 'Water') {
            damage = Math.floor(damage * 1.5);
            message += ' It\'s super effective!';
        } else if (attackType === 'Rock' && (target.type === 'Fire' || target.type === 'Electric')) {
            damage = Math.floor(damage * 1.5);
            message += ' It\'s super effective!';
        }
        // Not very effective
        else if ((attackType === 'Fire' && target.type === 'Water') ||
                 (attackType === 'Water' && target.type === 'Grass') ||
                 (attackType === 'Grass' && target.type === 'Fire') ||
                 (attackType === 'Electric' && target.type === 'Grass')) {
            damage = Math.floor(damage * 0.5);
            message += ' It\'s not very effective...';
        }

        // Apply damage
        const actualDamage = target.takeDamage(damage);

        return {
            damage: actualDamage,
            message: message
        };
    }

    // Get random move
    getRandomAttack() {
        return CONFIG.MONSTER_TYPES[Math.floor(Math.random() * CONFIG.MONSTER_TYPES.length)];
    }

    // Gain experience, returns true when the monster levelled up
    addExp(amount) {
        this.exp += amount;

        if (this.exp < this.expToLevel) {
            return false;
        }

        this.level++;
        this.exp -= this.expToLevel;
        this.expToLevel = Math.floor(this.expToLevel * 1.3);

        // Increase stats
        this.maxHp = Math.floor(this.maxHp * 1.1);
        this.hp = this.maxHp;
        this.attack = Math.floor(this.attack * 1.1);
        this.defense = Math.floor(this.defense * 1.05);
        this.speed = Math.floor(this.speed * 1.03);

        return true;
    }

    // Get monster data for saving
    getSaveData() {
        return {
            name: this.name,
            level: this.level,
            maxHp: this.maxHp,
            hp: this.hp,
            attack: this.attack,
            defense: this.defense,
            speed: this.speed,
            exp: this.exp,
            expToLevel: this.expToLevel,
            type: this.type
        };
    }

    // Rebuild a monster from saved or captured data
    static fromData(data) {
        const monster = new Monster(data.name, data.level);

        monster.maxHp = data.maxHp ?? monster.maxHp;
        monster.hp = data.hp ?? monster.maxHp;
        monster.attack = data.attack ?? monster.attack;
        monster.defense = data.defense ?? monster.defense;
        monster.speed = data.speed ?? monster.speed;
        monster.exp = data.exp ?? 0;
        monster.expToLevel = data.expToLevel ?? monster.expToLevel;
        monster.type = data.type ?? monster.type;

        return monster;
    }
}

// Factory function to create a wild monster
function createWildMonster(zoneType) {
    const monsterName = getRandomMonsterForZone(zoneType);
    const level = getRandomWildLevel();

    return new Monster(monsterName, level, true);
}
