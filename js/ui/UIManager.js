class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.minimap = null;
        this.battleUI = document.getElementById('battle-ui');
        this.menuUI = document.getElementById('menu-ui');
        this.encounterNotification = document.getElementById('encounter-notification');
        this.playerStats = document.getElementById('player-stats');
        
        // Battle UI elements
        this.enemyName = document.getElementById('enemy-name');
        this.enemyLevel = document.getElementById('enemy-level');
        this.enemyHealth = document.getElementById('enemy-health');
        this.playerMonsterName = document.getElementById('player-monster-name');
        this.playerMonsterLevel = document.getElementById('player-monster-level');
        this.playerHealth = document.getElementById('player-health');
        this.battleLogElement = document.getElementById('battle-log');
        this.monsterList = document.getElementById('monster-list');
        this.itemList = document.getElementById('item-list');
        this.battleItems = document.getElementById('battle-items');
        this.battleItemList = document.getElementById('battle-item-list');

        // Buttons
        this.attackBtn = document.getElementById('attack-btn');
        this.catchBtn = document.getElementById('catch-btn');
        this.runBtn = document.getElementById('run-btn');
        this.useItemBtn = document.getElementById('use-item-btn');
        this.cancelItemBtn = document.getElementById('cancel-item-btn');
        this.closeMenuBtn = document.getElementById('close-menu-btn');
        
        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Battle buttons
        this.attackBtn.addEventListener('click', () => {
            this.scene.events.emit('battle-action', { action: 'attack' });
        });

        this.catchBtn.addEventListener('click', () => {
            this.scene.events.emit('battle-action', { action: 'catch' });
        });

        this.runBtn.addEventListener('click', () => {
            this.scene.events.emit('battle-action', { action: 'run' });
        });

        this.useItemBtn.addEventListener('click', () => {
            this.showItemSelection();
        });

        this.cancelItemBtn.addEventListener('click', () => {
            this.hideItemSelection();
        });

        this.closeMenuBtn.addEventListener('click', () => {
            this.hideMenu();
        });

        // On-screen menu button (touch devices)
        touchControls.onMenu = () => this.toggleMenu();

        // Listen for scene events
        this.scene.events.on('battle-start', (data) => {
            this.showBattleUI(data);
        });

        this.scene.events.on('battle-end', (data) => {
            this.hideBattleUI();
        });

        this.scene.events.on('battle-turn-change', (data) => {
            this.updateBattleTurn(data.turn);
        });

        this.scene.events.on('battle-log-update', (data) => {
            this.updateBattleLog(data.log);
        });

        this.scene.events.on('battle-heal', (data) => {
            this.updatePlayerHealth();
        });

        this.scene.events.on('battle-monster-switch', (data) => {
            this.updatePlayerMonsterInfo();
        });

        this.scene.events.on('battle-monster-faint', (data) => {
            this.updatePlayerMonsterInfo();
        });

        this.scene.events.on('encounter-notification', (data) => {
            this.showEncounterNotification(data);
        });

        this.scene.events.on('player-move', (data) => {
            this.updatePlayerStats(data);
        });

        // Keyboard listener for menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
                this.toggleMenu();
            }
        });
    }

    // Show battle UI
    showBattleUI(data) {
        this.battleUI.classList.remove('hidden');
        this.hideItemSelection();
        this.setWorldHudVisible(false);
        this.updateBattleUI(data);
    }

    // Hide battle UI
    hideBattleUI() {
        this.battleUI.classList.add('hidden');
        this.hideItemSelection();
        this.setWorldHudVisible(true);
    }

    // The battle panel fills a phone screen; hide the overworld HUD behind it
    setWorldHudVisible(visible) {
        const hud = [
            document.getElementById('minimap-container'),
            document.getElementById('player-stats'),
            document.getElementById('touch-controls')
        ];

        hud.forEach((element) => {
            if (!element) return;
            // The touch pad stays hidden entirely on non-touch devices
            if (element.id === 'touch-controls' && !TouchControls.isTouchDevice()) return;
            element.classList.toggle('hidden', !visible);
        });
    }

    toggleMenu() {
        if (this.menuUI.classList.contains('hidden')) {
            this.showMenu();
        } else {
            this.hideMenu();
        }
    }

    // Update battle UI
    updateBattleUI(data) {
        const playerMonster = data.player.getCurrentMonster();
        const wildMonster = data.wildMonster;

        // Update enemy info
        this.enemyName.textContent = wildMonster.name;
        this.enemyLevel.textContent = `Lv. ${wildMonster.level}`;
        this.updateEnemyHealth(wildMonster);

        // Update player monster info
        if (playerMonster) {
            this.playerMonsterName.textContent = playerMonster.name;
            this.playerMonsterLevel.textContent = `Lv. ${playerMonster.level}`;
            this.updatePlayerHealth(playerMonster);
        }

        // Update turn indicator
        this.updateBattleTurn(data.turn);

        // Clear log
        this.battleLogElement.innerHTML = '';
    }

    // Update enemy health
    updateEnemyHealth(monster) {
        const percentage = (monster.hp / monster.maxHp) * 100;
        this.enemyHealth.style.width = `${percentage}%`;
        
        // Change color based on health
        if (percentage < 25) {
            this.enemyHealth.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
        } else if (percentage < 50) {
            this.enemyHealth.style.background = 'linear-gradient(90deg, #ff8800, #ffaa44)';
        } else {
            this.enemyHealth.style.background = 'linear-gradient(90deg, #00ff00, #44ff44)';
        }
    }

    // Update player health
    updatePlayerHealth(monster) {
        const playerMonster = monster || this.scene.player.getCurrentMonster();
        if (!playerMonster) return;

        const percentage = (playerMonster.hp / playerMonster.maxHp) * 100;
        this.playerHealth.style.width = `${percentage}%`;
        
        // Change color based on health
        if (percentage < 25) {
            this.playerHealth.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
        } else if (percentage < 50) {
            this.playerHealth.style.background = 'linear-gradient(90deg, #ff8800, #ffaa44)';
        } else {
            this.playerHealth.style.background = 'linear-gradient(90deg, #00ff00, #44ff44)';
        }
    }

    // Update player monster info
    updatePlayerMonsterInfo() {
        const playerMonster = this.scene.player.getCurrentMonster();
        if (playerMonster) {
            this.playerMonsterName.textContent = playerMonster.name;
            this.playerMonsterLevel.textContent = `Lv. ${playerMonster.level}`;
            this.updatePlayerHealth(playerMonster);
        }
    }

    // Update battle turn
    updateBattleTurn(turn) {
        // Disable/enable buttons based on turn
        const isPlayerTurn = turn === 'player';
        
        this.attackBtn.disabled = !isPlayerTurn;
        this.catchBtn.disabled = !isPlayerTurn;
        this.runBtn.disabled = !isPlayerTurn;
        this.useItemBtn.disabled = !isPlayerTurn;
    }

    // Update battle log
    updateBattleLog(log) {
        this.battleLogElement.innerHTML = log.join('<br>');
        this.battleLogElement.scrollTop = this.battleLogElement.scrollHeight;
    }

    // Show encounter notification
    showEncounterNotification(data) {
        this.encounterNotification.textContent = `Wild ${data.monster.name} appeared!`;
        this.encounterNotification.classList.remove('hidden');
        
        // Hide after delay
        setTimeout(() => {
            this.encounterNotification.classList.add('hidden');
        }, 1500);
    }

    // Update player stats
    updatePlayerStats(data) {
        const playerPos = document.getElementById('player-position');
        const playerZone = document.getElementById('player-zone');
        
        if (playerPos) {
            playerPos.textContent = `X: ${Math.floor(data.x / CONFIG.TILE_SIZE)}, Y: ${Math.floor(data.y / CONFIG.TILE_SIZE)}`;
        }
        
        if (playerZone) {
            const zone = this.scene.worldGenerator.getZoneAt(
                Math.floor(data.x / CONFIG.TILE_SIZE),
                Math.floor(data.y / CONFIG.TILE_SIZE)
            );
            playerZone.textContent = `Zone: ${CONFIG.ZONES[zone]?.name || zone}`;
        }
    }

    // Show menu
    showMenu() {
        this.menuUI.classList.remove('hidden');
        this.updateMenu();
    }

    // Hide menu
    hideMenu() {
        this.menuUI.classList.add('hidden');
    }

    // Update menu content
    updateMenu() {
        // Update monster list
        this.updateMonsterList();
        
        // Update item list
        this.updateItemList();
    }

    // Update monster list
    updateMonsterList() {
        const monsters = this.scene.player.getAllMonsters();
        
        this.monsterList.innerHTML = '';
        
        monsters.forEach((monster, index) => {
            const monsterItem = document.createElement('div');
            monsterItem.className = 'monster-item';
            monsterItem.innerHTML = `
                <span>${monster.name} Lv.${monster.level}</span>
                <span>${monster.hp}/${monster.maxHp} HP</span>
            `;
            
            // Highlight current monster
            if (index === this.scene.player.currentMonsterIndex) {
                monsterItem.style.background = 'rgba(255, 200, 0, 0.3)';
                monsterItem.style.border = '1px solid #ffcc00';
            }
            
            // Add click handler to switch monster
            monsterItem.addEventListener('click', () => {
                if (this.scene.battleSystem && this.scene.battleSystem.isActive()) {
                    this.scene.battleSystem.switchMonster(index);
                    this.hideMenu();
                } else {
                    this.scene.player.currentMonsterIndex = index;
                    this.updateMonsterList();
                }
            });
            
            this.monsterList.appendChild(monsterItem);
        });
    }

    // Update item list
    updateItemList() {
        const inventory = this.scene.player.getInventory();
        const items = inventory.getAllItems();
        
        this.itemList.innerHTML = '';
        
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-item';
            itemElement.innerHTML = `
                <span>${item.name} x${item.quantity}</span>
                <span class="item-description">${item.description}</span>
            `;
            
            // Add click handler to use item
            itemElement.addEventListener('click', () => {
                if (this.scene.battleSystem && this.scene.battleSystem.isActive()) {
                    this.scene.events.emit('battle-action', { 
                        action: 'use-item', 
                        item: item.name 
                    });
                    this.hideMenu();
                } else {
                    // Use item outside battle
                    const result = this.scene.player.useItem(item.name);
                    if (result.success) {
                        this.updateMenu();
                        this.updatePlayerMonsterInfo();
                    }
                }
            });
            
            this.itemList.appendChild(itemElement);
        });
    }

    // Show the in-battle item picker
    showItemSelection() {
        const items = this.scene.player.getInventory()
            .getAllItems()
            .filter(item => item.type === 'heal');

        this.battleItemList.innerHTML = '';

        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'item-item';
            empty.textContent = 'No usable items';
            this.battleItemList.appendChild(empty);
        }

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-item';
            itemElement.innerHTML = `
                <span>${item.name} x${item.quantity}</span>
                <span class="item-description">${item.description}</span>
            `;

            itemElement.addEventListener('click', () => {
                this.hideItemSelection();
                this.scene.events.emit('battle-action', {
                    action: 'use-item',
                    item: item.name
                });
            });

            this.battleItemList.appendChild(itemElement);
        });

        this.battleItems.classList.remove('hidden');
    }

    // Hide item selection
    hideItemSelection() {
        this.battleItems.classList.add('hidden');
    }

    // Show message
    showMessage(message, duration = 2000) {
        // Create temporary message element
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message';
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        // Remove after duration
        setTimeout(() => {
            messageElement.remove();
        }, duration);
    }
}
