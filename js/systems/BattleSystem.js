class BattleSystem {
    constructor(scene) {
        this.scene = scene;
        // Turn delays must be scheduled on a scene that is actually running.
        // The world scene is paused during a battle, so its clock is frozen.
        this.timerScene = scene;
        this.player = null;
        this.wildMonster = null;
        this.isBattleActive = false;
        this.turn = 'player'; // 'player' or 'enemy'
        this.battleLog = [];
        this.catchAttempts = 0;
        this.maxCatchAttempts = 3; // Max attempts to catch a monster
    }

    // Start a battle
    startBattle(player, wildMonster, timerScene = this.scene) {
        this.timerScene = timerScene;
        this.player = player;
        this.wildMonster = wildMonster;
        this.isBattleActive = true;
        this.turn = this.determineFirstTurn();
        this.catchAttempts = 0;
        this.battleLog = [];
        
        // Emit battle start event
        this.scene.events.emit('battle-start', {
            player: player,
            wildMonster: wildMonster,
            turn: this.turn
        });
        
        this.addToLog(`Wild ${wildMonster.name} Lv.${wildMonster.level} appeared!`);
        
        // If enemy goes first, start enemy turn
        if (this.turn === 'enemy') {
            this.enemyTurn();
        }
    }

    // Determine who goes first based on speed
    determineFirstTurn() {
        const playerMonster = this.player.getCurrentMonster();
        if (!playerMonster) return 'enemy';
        
        return playerMonster.speed >= this.wildMonster.speed ? 'player' : 'enemy';
    }

    // Player turn - handle player action
    async playerAction(action, target = null) {
        if (!this.isBattleActive || this.turn !== 'player') {
            return { success: false, reason: 'Not player turn' };
        }

        const playerMonster = this.player.getCurrentMonster();
        if (!playerMonster) {
            return { success: false, reason: 'No monster to fight' };
        }

        let result = { success: true };

        switch (action) {
            case 'attack':
                result = this.playerAttack();
                break;
                
            case 'catch':
                result = await this.tryCatch();
                break;
                
            case 'run':
                result = this.tryRun();
                break;
                
            case 'use-item':
                if (target) {
                    result = this.useItem(target);
                }
                break;
                
            default:
                return { success: false, reason: 'Invalid action' };
        }

        // A successful catch or escape already ended the battle
        if (!this.isBattleActive) {
            return result;
        }

        if (result.success) {
            // Check if battle should continue
            if (!this.checkBattleEnd()) {
                // Switch to enemy turn
                this.turn = 'enemy';
                this.scene.events.emit('battle-turn-change', { turn: this.turn });
                
                // Start enemy turn after a short delay
                this.timerScene.time.delayedCall(1000, () => {
                    if (this.isBattleActive) {
                        this.enemyTurn();
                    }
                });
            }
        }

        return result;
    }

    // Player attacks
    playerAttack() {
        const playerMonster = this.player.getCurrentMonster();
        if (!playerMonster || !this.wildMonster) {
            return { success: false, reason: 'No valid targets' };
        }

        // Choose a random attack type
        const attackType = playerMonster.getRandomAttack();
        
        // Perform attack
        const result = playerMonster.useAttack(attackType, this.wildMonster);
        
        this.addToLog(result.message);
        this.addToLog(`Wild ${this.wildMonster.name} took ${result.damage} damage!`);
        
        // Check if wild monster is defeated
        if (!this.wildMonster.isAlive()) {
            this.addToLog(`Wild ${this.wildMonster.name} fainted!`);
            
            // Award EXP
            const expGain = Math.floor(this.wildMonster.level * 10 * (1 + this.wildMonster.level / 10));
            this.player.addExp(expGain);
            this.addToLog(`Gained ${expGain} EXP!`);
        }

        return { success: true, damage: result.damage };
    }

    // Try to catch the wild monster
    async tryCatch() {
        this.catchAttempts++;
        
        if (this.catchAttempts > this.maxCatchAttempts) {
            this.addToLog(`The wild ${this.wildMonster.name} broke free!`);
            return { success: false, reason: 'Too many attempts' };
        }

        // Find a ball in inventory
        const inventory = this.player.getInventory();
        let ballUsed = null;
        
        // Try to use the best available ball
        const ballTypes = ['Ultra Ball', 'Super Ball', 'Monster Ball'];
        for (const ballType of ballTypes) {
            if (inventory.hasItem(ballType)) {
                ballUsed = ballType;
                break;
            }
        }

        if (!ballUsed) {
            return { success: false, reason: 'No balls available' };
        }

        // Use the ball
        inventory.removeItem(ballUsed, 1);
        
        // Calculate catch success
        const ballData = CONFIG.ITEMS[ballUsed];
        let successRate = ballData.catchRate;
        
        // Modify based on monster HP
        const hpPercentage = this.wildMonster.hp / this.wildMonster.maxHp;
        successRate *= (1 - hpPercentage * 0.7); // Lower HP = higher chance
        
        // Random chance
        const success = Math.random() < successRate;
        
        // Show catch animation
        this.scene.events.emit('battle-catch-attempt', {
            success: success,
            ball: ballUsed
        });
        
        // Wait for animation
        await new Promise(resolve => this.timerScene.time.delayedCall(1500, resolve));
        
        if (success) {
            // Catch successful
            const catchResult = this.player.catchMonster({
                name: this.wildMonster.name,
                level: this.wildMonster.level,
                maxHp: this.wildMonster.maxHp,
                hp: this.wildMonster.hp,
                attack: this.wildMonster.attack,
                defense: this.wildMonster.defense,
                speed: this.wildMonster.speed,
                expToLevel: this.wildMonster.expToLevel,
                type: this.wildMonster.type
            });
            
            if (catchResult.success) {
                this.addToLog(`Gotcha! ${this.wildMonster.name} was caught!`);
                this.endBattle('catch');
                return { success: true, caught: true };
            } else {
                this.addToLog(`Oh no! ${catchResult.reason}`);
                return { success: false, reason: catchResult.reason };
            }
        } else {
            this.addToLog(`Oh no! The wild ${this.wildMonster.name} broke free!`);
            
            // Wild monster attacks after breaking free
            const playerMonster = this.player.getCurrentMonster();
            if (this.wildMonster.isAlive() && playerMonster) {
                const dealt = playerMonster.takeDamage(this.wildMonster.getAttackDamage());
                this.addToLog(`Wild ${this.wildMonster.name} attacked! ${playerMonster.name} took ${dealt} damage!`);
            }
            
            return { success: false, reason: 'Monster broke free' };
        }
    }

    // Try to run from battle
    tryRun() {
        // Calculate run success based on speed
        const playerMonster = this.player.getCurrentMonster();
        if (!playerMonster) {
            return { success: false, reason: 'No monster to run with' };
        }

        const speedRatio = playerMonster.speed / (playerMonster.speed + this.wildMonster.speed);
        const successRate = 0.3 + speedRatio * 0.7; // 30-100% chance based on speed
        
        const success = Math.random() < successRate;

        if (success) {
            this.addToLog(`Got away safely!`);
            this.endBattle('run');
            return { success: true, escaped: true };
        } else {
            this.addToLog(`Couldn't escape!`);

            // Wild monster attacks after failed escape
            const dealt = playerMonster.takeDamage(this.wildMonster.getAttackDamage());
            this.addToLog(`Wild ${this.wildMonster.name} attacked! ${playerMonster.name} took ${dealt} damage!`);
            
            return { success: false, reason: 'Failed to escape' };
        }
    }

    // Use an item in battle
    useItem(itemName) {
        const inventory = this.player.getInventory();
        const item = CONFIG.ITEMS[itemName];
        
        if (!item) {
            return { success: false, reason: 'Unknown item' };
        }

        if (!inventory.hasItem(itemName)) {
            return { success: false, reason: 'Item not available' };
        }

        switch (item.type) {
            case 'heal':
                const playerMonster = this.player.getCurrentMonster();
                if (!playerMonster) {
                    return { success: false, reason: 'No monster to heal' };
                }
                
                const healed = playerMonster.heal(item.value);
                
                inventory.removeItem(itemName, 1);
                
                this.addToLog(`Used ${itemName}. ${playerMonster.name} restored ${healed} HP.`);
                this.scene.events.emit('battle-heal', {
                    monster: playerMonster,
                    amount: healed
                });
                
                return { success: true, healed: healed };
                
            default:
                return { success: false, reason: 'Cannot use this item in battle' };
        }
    }

    // Enemy turn
    enemyTurn() {
        if (!this.isBattleActive || this.turn !== 'enemy') {
            return;
        }

        const playerMonster = this.player.getCurrentMonster();
        if (!playerMonster || !this.wildMonster) {
            this.endBattle('win');
            return;
        }

        // Wild monster attacks
        const attackType = this.wildMonster.getRandomAttack();
        const result = this.wildMonster.useAttack(attackType, playerMonster);
        
        this.addToLog(result.message);
        this.addToLog(`${playerMonster.name} took ${result.damage} damage!`);
        
        // Check if player monster fainted
        if (!playerMonster.isAlive()) {
            this.addToLog(`${playerMonster.name} fainted!`);
            
            // Check if player has other monsters
            const aliveMonsters = this.player.getAllMonsters().filter(m => m.isAlive());
            if (aliveMonsters.length > 0) {
                this.addToLog(`Choose another monster!`);
                // Emit event for monster selection
                this.scene.events.emit('battle-monster-faint', {
                    player: this.player
                });
            } else {
                // Player has no more monsters - game over
                this.endBattle('lose');
            }
        } else {
            // Switch back to player turn
            this.turn = 'player';
            this.scene.events.emit('battle-turn-change', { turn: this.turn });
        }
    }

    // Check if battle should end
    checkBattleEnd() {
        if (!this.isBattleActive || !this.player) {
            return true;
        }

        const playerMonster = this.player.getCurrentMonster();
        
        // Check if wild monster is defeated
        if (!this.wildMonster || !this.wildMonster.isAlive()) {
            this.endBattle('win');
            return true;
        }

        // Check if player monster is defeated
        if (!playerMonster || !playerMonster.isAlive()) {
            // Check if player has other monsters
            const aliveMonsters = this.player.getAllMonsters().filter(m => m.isAlive());
            if (aliveMonsters.length === 0) {
                this.endBattle('lose');
                return true;
            }
        }

        return false;
    }

    // End the battle
    endBattle(result) {
        this.isBattleActive = false;
        
        this.scene.events.emit('battle-end', {
            result: result,
            player: this.player
        });

        // Reset state
        this.wildMonster = null;
        this.player = null;
        this.turn = 'player';
        this.catchAttempts = 0;
    }

    // Add message to battle log
    addToLog(message) {
        this.battleLog.push(message);
        
        // Keep log size reasonable
        if (this.battleLog.length > 10) {
            this.battleLog.shift();
        }
        
        this.scene.events.emit('battle-log-update', {
            log: this.battleLog
        });
    }

    // Get battle log
    getBattleLog() {
        return this.battleLog;
    }

    // Get current turn
    getCurrentTurn() {
        return this.turn;
    }

    // Is battle active
    isActive() {
        return this.isBattleActive;
    }

    // Switch player's current monster
    switchMonster(index) {
        if (index >= 0 && index < this.player.getAllMonsters().length) {
            this.player.currentMonsterIndex = index;
            this.scene.events.emit('battle-monster-switch', {
                player: this.player,
                newMonster: this.player.getCurrentMonster()
            });
            
            // After switching, continue enemy turn
            this.turn = 'enemy';
            this.scene.events.emit('battle-turn-change', { turn: this.turn });
            
            this.timerScene.time.delayedCall(1000, () => {
                if (this.isBattleActive) {
                    this.enemyTurn();
                }
            });

            return true;
        }
        return false;
    }
}
