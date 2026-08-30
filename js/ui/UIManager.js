/**
 * All DOM UI: the overworld HUD, the battle panel, the menu, the shop and the
 * Monsterdex. Kept as DOM rather than Phaser text so it stays crisp and
 * scrollable on a phone.
 */
class UIManager {
    constructor(scene) {
        this.scene = scene;

        this.battleUI = document.getElementById('battle-ui');
        this.menuUI = document.getElementById('menu-ui');
        this.shopUI = document.getElementById('shop-ui');
        this.dexUI = document.getElementById('dex-ui');
        this.encounterNotification = document.getElementById('encounter-notification');

        this.enemyName = document.getElementById('enemy-name');
        this.enemyLevel = document.getElementById('enemy-level');
        this.enemyHealth = document.getElementById('enemy-health');
        this.enemyStatus = document.getElementById('enemy-status');
        this.playerMonsterName = document.getElementById('player-monster-name');
        this.playerMonsterLevel = document.getElementById('player-monster-level');
        this.playerHealth = document.getElementById('player-health');
        this.playerHp = document.getElementById('player-hp');
        this.playerStatus = document.getElementById('player-status');
        this.battleLogElement = document.getElementById('battle-log');

        this.moveButtons = document.getElementById('move-buttons');
        this.battlePanels = {
            main: document.getElementById('battle-main'),
            moves: document.getElementById('battle-moves'),
            items: document.getElementById('battle-items'),
            team: document.getElementById('battle-team')
        };
        this.battleItemList = document.getElementById('battle-item-list');
        this.battleTeamList = document.getElementById('battle-team-list');

        this.monsterList = document.getElementById('monster-list');
        this.itemList = document.getElementById('item-list');
        this.shopList = document.getElementById('shop-list');
        this.dexList = document.getElementById('dex-list');
        this.coinCounters = document.querySelectorAll('.coin-count');

        this.dialogueUI = document.getElementById('dialogue-ui');
        this.dialogueSpeaker = document.getElementById('dialogue-speaker');
        this.dialogueText = document.getElementById('dialogue-text');
        this.dialogueQueue = [];
        this.dialogueDone = null;

        this.setupEventListeners();
    }

    // --- wiring -------------------------------------------------------------

    setupEventListeners() {
        const on = (id, handler) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener('click', handler);
        };

        on('fight-btn', () => this.showBattlePanel('moves'));
        on('catch-btn', () => this.emitAction('catch'));
        on('run-btn', () => this.emitAction('run'));
        on('bag-btn', () => this.showItemSelection());
        on('team-btn', () => this.showTeamSelection());
        on('moves-back-btn', () => this.showBattlePanel('main'));
        on('items-back-btn', () => this.showBattlePanel('main'));
        on('team-back-btn', () => this.showBattlePanel('main'));

        on('close-menu-btn', () => this.hideMenu());
        on('close-shop-btn', () => this.closeShop());
        on('close-dex-btn', () => this.hideDex());
        on('dex-btn', () => this.showDex());
        on('mute-btn', () => this.toggleMute());

        touchControls.onMenu = () => this.toggleMenu();

        // Tapping anywhere on the dialogue box advances it
        if (this.dialogueUI) {
            this.dialogueUI.addEventListener('click', () => this.advanceDialogue());
        }

        const events = this.scene.events;
        events.on('battle-start', (data) => this.showBattleUI(data));
        events.on('battle-end', () => this.hideBattleUI());
        events.on('battle-turn-change', (data) => this.updateBattleControls(data));
        events.on('battle-log-update', (data) => this.updateBattleLog(data.log));
        events.on('battle-heal', () => this.updateBattleBars());
        events.on('battle-damage', () => this.updateBattleBars());
        events.on('battle-monster-switch', () => this.updateBattleBars());
        events.on('battle-monster-faint', () => this.updateBattleBars());
        events.on('monster-evolved', () => this.updateBattleBars());
        events.on('encounter-notification', (data) => this.showEncounterNotification(data));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') this.toggleMenu();
        });
    }

    emitAction(action, payload = null) {
        this.scene.events.emit('battle-action', { action, payload });
    }

    // --- overworld HUD ------------------------------------------------------

    refreshHud() {
        this.updatePlayerStats(this.scene.player.getPosition());
        this.updateCoins();
    }

    updateCoins() {
        const coins = this.scene.player.coins;
        this.coinCounters.forEach(element => { element.textContent = coins; });
    }

    updatePlayerStats(position) {
        const positionEl = document.getElementById('player-position');
        const zoneEl = document.getElementById('player-zone');

        const tileX = Math.floor(position.x / CONFIG.TILE_SIZE);
        const tileY = Math.floor(position.y / CONFIG.TILE_SIZE);

        if (positionEl) positionEl.textContent = `X:${tileX} Y:${tileY}`;

        if (zoneEl) zoneEl.textContent = this.scene.map.name;
    }

    // --- battle UI ----------------------------------------------------------

    showBattleUI(data) {
        this.battleUI.classList.remove('hidden');
        this.setWorldHudVisible(false);
        this.showBattlePanel('main');
        this.battleLogElement.innerHTML = '';
        this.updateBattleBars(data);
    }

    hideBattleUI() {
        this.battleUI.classList.add('hidden');
        this.setWorldHudVisible(true);
    }

    setWorldHudVisible(visible) {
        if (visible && (this.isDialogueOpen() || this.isOverlayOpen())) return;

        [
            document.getElementById('minimap-container'),
            document.getElementById('player-stats'),
            document.getElementById('touch-controls')
        ].forEach((element) => {
            if (!element) return;
            if (element.id === 'touch-controls' && !TouchControls.isTouchDevice()) return;
            element.classList.toggle('hidden', !visible);
        });
    }

    showBattlePanel(name) {
        Object.entries(this.battlePanels).forEach(([key, panel]) => {
            if (panel) panel.classList.toggle('hidden', key !== name);
        });

        if (name === 'moves') this.renderMoveButtons();
    }

    updateBattleBars() {
        const battle = this.scene.battleSystem;
        if (!battle?.isActive()) return;

        const wild = battle.wildMonster;
        const mine = battle.player?.getCurrentMonster();

        if (wild) {
            this.enemyName.textContent = wild.name;
            this.enemyLevel.textContent = `Lv.${wild.level}`;
            this.setHealthBar(this.enemyHealth, wild);
            this.setStatusChip(this.enemyStatus, wild);
        }

        if (mine) {
            this.playerMonsterName.textContent = mine.name;
            this.playerMonsterLevel.textContent = `Lv.${mine.level}`;
            this.playerHp.textContent = `${mine.hp}/${mine.maxHp}`;
            this.setHealthBar(this.playerHealth, mine);
            this.setStatusChip(this.playerStatus, mine);
        }
    }

    setHealthBar(element, monster) {
        if (!element) return;

        const percent = Math.max(0, (monster.hp / monster.maxHp) * 100);
        element.style.width = `${percent}%`;

        element.classList.toggle('low', percent < 25);
        element.classList.toggle('medium', percent >= 25 && percent < 50);
    }

    setStatusChip(element, monster) {
        if (!element) return;

        const effect = monster.status && STATUS_EFFECTS[monster.status];

        if (!effect) {
            element.classList.add('hidden');
            return;
        }

        element.textContent = effect.label;
        element.style.background = effect.color;
        element.classList.remove('hidden');
    }

    renderMoveButtons() {
        const monster = this.scene.battleSystem.player?.getCurrentMonster();
        if (!monster) return;

        this.moveButtons.innerHTML = '';

        monster.getMoves().forEach(move => {
            const button = document.createElement('button');
            button.className = 'move-btn';
            button.dataset.type = move.type;
            button.innerHTML = `
                <span class="move-name">${move.name}</span>
                <span class="move-meta">${move.type}${move.power ? ` &middot; ${move.power}` : ''}</span>
            `;
            button.addEventListener('click', () => {
                this.showBattlePanel('main');
                this.emitAction('move', move.name);
            });

            this.moveButtons.appendChild(button);
        });
    }

    // Disable everything while an exchange is playing out
    updateBattleControls({ turn, busy }) {
        const interactive = turn === 'player' && !busy;

        ['fight-btn', 'catch-btn', 'run-btn', 'bag-btn', 'team-btn'].forEach(id => {
            const button = document.getElementById(id);
            if (button) button.disabled = !interactive;
        });

        this.moveButtons.querySelectorAll('button').forEach(button => {
            button.disabled = !interactive;
        });

        if (!interactive) this.showBattlePanel('main');
    }

    updateBattleLog(log) {
        this.battleLogElement.innerHTML = log.map(line => `<div>${line}</div>`).join('');
        this.battleLogElement.scrollTop = this.battleLogElement.scrollHeight;
    }

    showItemSelection() {
        const inventory = this.scene.player.getInventory();
        const items = inventory.getAllItems().filter(item => item.type !== 'ball');

        this.battleItemList.innerHTML = '';

        if (items.length === 0) {
            this.battleItemList.innerHTML = '<div class="list-row muted">No usable items</div>';
        }

        items.forEach(item => {
            const row = document.createElement('button');
            row.className = 'list-row';
            row.innerHTML = `<span>${item.name} &times;${item.quantity}</span>
                             <span class="muted">${item.description}</span>`;
            row.addEventListener('click', () => {
                this.showBattlePanel('main');
                this.emitAction('use-item', item.name);
            });
            this.battleItemList.appendChild(row);
        });

        this.showBattlePanel('items');
    }

    showTeamSelection() {
        const player = this.scene.player;
        this.battleTeamList.innerHTML = '';

        player.getAllMonsters().forEach((monster, index) => {
            const active = index === player.currentMonsterIndex;
            const row = document.createElement('button');
            row.className = 'list-row';
            row.disabled = active || !monster.isAlive();
            row.innerHTML = `
                <span>${monster.name} <span class="muted">Lv.${monster.level}</span></span>
                <span class="${monster.isAlive() ? '' : 'muted'}">${monster.hp}/${monster.maxHp}${active ? ' (out)' : ''}</span>
            `;
            row.addEventListener('click', () => {
                this.showBattlePanel('main');
                this.emitAction('switch', index);
            });
            this.battleTeamList.appendChild(row);
        });

        this.showBattlePanel('team');
    }

    showEncounterNotification(data) {
        this.encounterNotification.textContent = `A wild ${data.monster.name} appeared!`;
        this.encounterNotification.classList.remove('hidden');

        setTimeout(() => this.encounterNotification.classList.add('hidden'), 1500);
    }

    // --- menu ---------------------------------------------------------------

    toggleMenu() {
        if (this.scene.battleSystem?.isActive()) return;

        if (this.menuUI.classList.contains('hidden')) this.showMenu();
        else this.hideMenu();
    }

    showMenu() {
        this.menuUI.classList.remove('hidden');
        this.setWorldHudVisible(false);
        this.updateCoins();
        this.renderTeamList();
        this.renderItemList();
        touchControls.reset();
    }

    hideMenu() {
        this.menuUI.classList.add('hidden');
        this.setWorldHudVisible(true);
        saveGame();
    }

    renderTeamList() {
        const player = this.scene.player;
        this.monsterList.innerHTML = '';

        player.getAllMonsters().forEach((monster, index) => {
            const row = document.createElement('div');
            row.className = 'monster-row';
            if (index === player.currentMonsterIndex) row.classList.add('active');

            const percent = (monster.hp / monster.maxHp) * 100;

            row.innerHTML = `
                <div class="monster-avatar" data-key="${monster.getSpriteKey()}"></div>
                <div class="monster-info">
                    <div class="monster-title">
                        <span>${monster.name}</span>
                        <span class="muted">Lv.${monster.level}</span>
                    </div>
                    <div class="health-bar small"><div class="health-fill" style="width:${percent}%"></div></div>
                    <div class="monster-sub muted">${monster.type} &middot; ${monster.hp}/${monster.maxHp} HP</div>
                </div>
            `;

            row.addEventListener('click', () => {
                player.currentMonsterIndex = index;
                this.renderTeamList();
            });

            this.monsterList.appendChild(row);
        });

        this.paintAvatars(this.monsterList);
    }

    // Copy the generated Phaser textures into the DOM lists
    paintAvatars(root) {
        root.querySelectorAll('.monster-avatar[data-key]').forEach(node => {
            const source = this.scene.textures.get(node.dataset.key)?.getSourceImage();
            if (!source) return;

            const canvas = document.createElement('canvas');
            canvas.width = source.width;
            canvas.height = source.height;
            canvas.getContext('2d').drawImage(source, 0, 0);

            node.innerHTML = '';
            node.appendChild(canvas);
        });
    }

    renderItemList() {
        const player = this.scene.player;
        const items = player.getInventory().getAllItems();

        this.itemList.innerHTML = '';

        if (items.length === 0) {
            this.itemList.innerHTML = '<div class="list-row muted">Your bag is empty</div>';
            return;
        }

        items.forEach(item => {
            const row = document.createElement('button');
            row.className = 'list-row';
            row.innerHTML = `<span>${item.name} &times;${item.quantity}</span>
                             <span class="muted">${item.description}</span>`;

            row.addEventListener('click', () => {
                const result = player.useItem(item.name);
                this.showMessage(result.success ? result.message : result.reason, 1600);
                this.renderItemList();
                this.renderTeamList();
            });

            this.itemList.appendChild(row);
        });
    }

    // --- shop ---------------------------------------------------------------

    openShop() {
        this.shopUI.classList.remove('hidden');
        this.setWorldHudVisible(false);
        this.renderShop();
        touchControls.reset();
        audioManager.playSfx('shop');
    }

    closeShop() {
        this.shopUI.classList.add('hidden');
        this.setWorldHudVisible(true);

        // Keep the shop tile marked as handled, otherwise the next frame sees
        // the player still standing on it and immediately reopens the shop.
        this.scene.lastTileType = 'shop_pad';
        saveGame();
    }

    renderShop() {
        this.updateCoins();
        this.shopList.innerHTML = '';

        Object.entries(CONFIG.ITEMS)
            .filter(([, item]) => item.price > 0)
            .forEach(([name, item]) => {
                const affordable = this.scene.player.canAfford(item.price);

                const row = document.createElement('button');
                row.className = 'list-row';
                row.disabled = !affordable;
                row.innerHTML = `
                    <span>${name}<br><span class="muted">${item.description}</span></span>
                    <span class="price">${item.price}c</span>
                `;
                row.addEventListener('click', () => this.buy(name, item));

                this.shopList.appendChild(row);
            });
    }

    buy(name, item) {
        const player = this.scene.player;

        if (!player.canAfford(item.price)) return;

        player.addCoins(-item.price);
        player.getInventory().addItem(name, 1);

        audioManager.playSfx('buy');
        this.showMessage(`Bought ${name}!`, 1200);
        this.renderShop();
    }

    // --- monsterdex ---------------------------------------------------------

    showDex() {
        this.dexUI.classList.remove('hidden');
        this.setWorldHudVisible(false);
        this.renderDex();
        touchControls.reset();
    }

    hideDex() {
        this.dexUI.classList.add('hidden');
        // The menu is still open underneath, so keep the HUD hidden
    }

    renderDex() {
        const player = this.scene.player;
        this.dexList.innerHTML = '';

        document.getElementById('dex-progress').textContent =
            `${player.caught.size} / ${DEX_TOTAL} caught`;

        DEX_ORDER.forEach(name => {
            const caught = player.caught.has(name);
            const seen = player.seen.has(name);
            const species = getSpecies(name);

            const row = document.createElement('div');
            row.className = `dex-row${caught ? ' caught' : seen ? ' seen' : ' unknown'}`;

            row.innerHTML = `
                <div class="monster-avatar" ${seen ? `data-key="monster-${name}"` : ''}></div>
                <div class="monster-info">
                    <div class="monster-title">
                        <span>${seen ? name : '???'}</span>
                        <span class="muted">#${String(species.dex).padStart(2, '0')}</span>
                    </div>
                    <div class="monster-sub muted">${seen ? species.type : 'Not seen yet'}${caught ? ' &middot; caught' : ''}</div>
                </div>
            `;

            this.dexList.appendChild(row);
        });

        this.paintAvatars(this.dexList);
    }

    // Celebrate once the collection is complete
    checkDexCompletion() {
        const player = this.scene.player;

        if (player.caught.size < DEX_TOTAL || gameState.dexCelebrated) return;

        gameState.dexCelebrated = true;
        this.showMessage('You caught every monster! The Monsterdex is complete!', 6000);
        audioManager.playSfx('victory');
    }

    // --- dialogue -----------------------------------------------------------

    isDialogueOpen() {
        return this.dialogueUI && !this.dialogueUI.classList.contains('hidden');
    }

    // True while any full-screen panel is up, so the world ignores input
    isOverlayOpen() {
        return [this.menuUI, this.shopUI, this.dexUI, this.battleUI]
            .some(panel => panel && !panel.classList.contains('hidden'));
    }

    showDialogue(speaker, lines, onDone = null) {
        this.dialogueQueue = [...(lines || [])];
        this.dialogueDone = onDone;

        this.dialogueSpeaker.textContent = speaker || '';
        this.dialogueSpeaker.classList.toggle('hidden', !speaker);

        this.dialogueUI.classList.remove('hidden');
        this.setWorldHudVisible(false);
        this.advanceDialogue(true);
    }

    // Show a conversation once the battle panel has closed
    queueDialogue(speaker, lines) {
        if (!lines || !lines.length) return;

        setTimeout(() => this.showDialogue(speaker, lines), 400);
    }

    advanceDialogue(first = false) {
        if (!this.isDialogueOpen() && !first) return;

        if (this.dialogueQueue.length === 0) {
            this.closeDialogue();
            return;
        }

        this.dialogueText.textContent = this.dialogueQueue.shift();
    }

    closeDialogue() {
        this.dialogueUI.classList.add('hidden');
        this.setWorldHudVisible(true);

        const done = this.dialogueDone;
        this.dialogueDone = null;
        if (done) done();
    }

    // --- misc ---------------------------------------------------------------

    toggleMute() {
        const muted = audioManager.toggleMute();
        const button = document.getElementById('mute-btn');
        if (button) button.textContent = muted ? '🔇' : '🔊';
    }

    showMessage(message, duration = 2000) {
        const element = document.createElement('div');
        element.className = 'game-message';
        element.textContent = message;

        document.body.appendChild(element);
        setTimeout(() => element.remove(), duration);
    }
}
