class Monster {
    constructor(scene, name, level, isWild = false) {
        this.scene = scene;
        this.name = name;
        this.level = level || 1;
        this.isWild = isWild;
        this.type = this.getRandomType();
        
        // Get base stats
        const stats = getMonsterStats(name);
        
        // Calculate stats based on level
        this.maxHp = Math.floor(stats.hp * (1 + level * 0.2));
        this.hp = this.maxHp;
        this.attack = Math.floor(stats.attack * (1 + level * 0.15));
        this.defense = Math.floor(stats.defense * (1 + level * 0.1));
        this.speed = Math.floor(stats.speed * (1 + level * 0.05));
        
        // Experience
        this.exp = 0;
        this.expToLevel = Math.floor(stats.exp * 1.5);
        
        // Battle stats
        this.status = null; // null, 'burn', 'poison', 'sleep', etc.
        this.statusTurns = 0;
        
        // Create sprite
        this.sprite = null;
        this.createSprite();
        
        // Set depth
        if (this.sprite) {
            this.sprite.setDepth(20);
        }
    }

    createSprite() {
        // For now, create a colored rectangle based on type
        // We'll replace this with actual pixel art later
        const colors = {
            'Normal': 0xcccccc,
            'Fire': 0xff4444,
            'Water': 0x4444ff,
            'Grass': 0x44ff44,
            'Electric': 0xffff44,
            'Rock': 0x888888
        };
        
        const color = colors[this.type] || 0xff00ff;
        
        // Create sprite
        this.sprite = this.scene.add.rectangle(
            0, 
            0, 
            CONFIG.TILE_SIZE * 2, 
            CONFIG.TILE_SIZE * 2, 
            color
        );
        
        this.sprite.setOrigin(0.5, 0.5);
        
        // Add name text
        this.nameText = this.scene.add.text(
            0, 
            -CONFIG.TILE_SIZE * 1.5,
            `${this.name} Lv.${this.level}`,
            {
                font: '12px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        
        this.nameText.setOrigin(0.5, 0.5);
        this.nameText.setDepth(25);
    }

    update(delta) {
        // Update status effects
        if (this.status) {
            this.statusTurns--;
            if (this.statusTurns <= 0) {
                this.status = null;
            } else {
                // Apply status effect
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
    takeDamage(amount, attacker) {
        // Calculate defense reduction
        const defenseReduction = Math.floor(amount * (this.defense / (this.defense + 10)));
        const actualDamage = Math.max(1, amount - defenseReduction);
        
        this.hp = Math.max(0, this.hp - actualDamage);
        
        return actualDamage;
    }

    // Heal
    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return amount;
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
        const actualDamage = target.takeDamage(damage, this);
        
        return {
            damage: actualDamage,
            message: message
        };
    }

    // Get random move
    getRandomAttack() {
        const types = CONFIG.MONSTER_TYPES;
        return types[Math.floor(Math.random() * types.length)];
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

    // Set position (for battle)
    setPosition(x, y) {
        if (this.sprite) {
            this.sprite.x = x;
            this.sprite.y = y;
        }
        if (this.nameText) {
            this.nameText.x = x;
            this.nameText.y = y - CONFIG.TILE_SIZE * 1.5;
        }
    }

    // Show/hide sprite
    setVisible(visible) {
        if (this.sprite) {
            this.sprite.setVisible(visible);
        }
        if (this.nameText) {
            this.nameText.setVisible(visible);
        }
    }

    // Clean up
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.nameText) {
            this.nameText.destroy();
        }
    }
}

// Factory function to create a wild monster
function createWildMonster(scene, zoneType) {
    const monsterName = getRandomMonsterForZone(zoneType);
    const level = getRandomWildLevel();
    
    return new Monster(scene, monsterName, level, true);
}
