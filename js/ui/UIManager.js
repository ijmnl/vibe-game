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
        this.playerExp = document.getElementById('player-exp');
        this.playerStatus = document.getElementById('player-status');
        this.enemyTypes = document.getElementById('enemy-types');
        this.playerTypes = document.getElementById('player-types');
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

        this.momentumFill = document.getElementById('momentum-fill');
        this.burstButton = document.getElementById('burst-btn');

        this.mentorUI = document.getElementById('mentor-ui');
        this.mentorList = document.getElementById('mentor-list');
        this.mentorSummary = document.getElementById('mentor-summary');
        this.mentorHint = document.getElementById('mentor-hint');
        this.mentorPick = {};

        this.dialogueUI = document.getElementById('dialogue-ui');
        this.dialogueSpeaker = document.getElementById('dialogue-speaker');
        this.dialogueText = document.getElementById('dialogue-text');
        this.dialogueChoices = document.getElementById('dialogue-choices');
        this.dialogueHint = document.getElementById('dialogue-hint');
        this.dialogueQueue = [];
        this.dialogueDone = null;
        this.dialogueChoice = null;

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

        on('burst-btn', () => this.emitAction('burst'));

        on('close-mentor-btn', () => this.closeMentoring());
        on('mentor-back-btn', () => this.stepMentoringBack());
        on('mentor-go-btn', () => this.confirmMentoring());

        on('close-menu-btn', () => this.hideMenu());
        on('close-shop-btn', () => this.closeShop());
        on('close-dex-btn', () => this.hideDex());
        on('dex-btn', () => this.showDex());
        on('mute-btn', () => this.toggleMute());

        touchControls.onMenu = () => this.toggleMenu();

        // Tapping anywhere on the dialogue box advances it - unless it is
        // waiting on a choice, where the buttons are the only way on.
        if (this.dialogueUI) {
            this.dialogueUI.addEventListener('click', (event) => {
                if (event.target.closest('.dialogue-choices')) return;
                if (this.dialogueChoice && !this.dialogueQueue.length) return;
                this.advanceDialogue();
            });
        }

        const yes = document.getElementById('dialogue-yes');
        const no = document.getElementById('dialogue-no');
        if (yes) yes.addEventListener('click', () => this.answerChoice(true));
        if (no) no.addEventListener('click', () => this.answerChoice(false));

        const events = this.scene.events;
        events.on('battle-start', (data) => this.showBattleUI(data));
        events.on('battle-end', () => this.hideBattleUI());
        events.on('battle-turn-change', (data) => this.updateBattleControls(data));
        events.on('battle-log-update', (data) => this.updateBattleLog(data.log));
        events.on('battle-heal', () => this.updateBattleBars());
        events.on('battle-exp', (data) => this.showExpGain(data));
        events.on('battle-damage', () => this.updateBattleBars());
        events.on('battle-momentum', (data) => this.updateMomentum(data));
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

        this.updateSky();
    }

    // The hour and the sky, which between them decide what you will meet.
    // The clock ticks several times a second, so only touch the DOM when the
    // text it would write has actually changed.
    updateSky() {
        const element = document.getElementById('world-sky');
        if (!element) return;

        const clock = gameState.clock;
        const sky = getWeather(gameState.weather);
        const icon = sky.id === 'clear' ? clock.phase.icon : sky.icon;
        const label = `${icon} ${clock.timeLabel}`;

        if (label === this.lastSkyLabel) return;
        this.lastSkyLabel = label;

        element.textContent = label;
        element.title = `${clock.phase.label} - ${sky.label}`;
    }

    // --- battle UI ----------------------------------------------------------

    showBattleUI(data) {
        this.battleUI.classList.remove('hidden');
        this.setWorldHudVisible(false);
        this.showBattlePanel('main');
        this.battleLogElement.innerHTML = '';
        this.updateMomentum({ momentum: 0, max: BattleSystem.MAX_MOMENTUM });
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
            this.setTypeChips(this.enemyTypes, wild);
        }

        if (mine) {
            this.playerMonsterName.textContent = mine.name;
            this.playerMonsterLevel.textContent = `Lv.${mine.level}`;
            this.playerHp.textContent = `${mine.hp}/${mine.maxHp}`;
            this.setHealthBar(this.playerHealth, mine);
            this.setStatusChip(this.playerStatus, mine);
            this.setTypeChips(this.playerTypes, mine);
            this.setExpBar(this.playerExp, mine);
        }
    }

    setHealthBar(element, monster) {
        if (!element) return;

        const percent = Math.max(0, (monster.hp / monster.maxHp) * 100);
        element.style.width = `${percent}%`;

        element.classList.toggle('low', percent < 25);
        element.classList.toggle('medium', percent >= 25 && percent < 50);
    }

    // Progress toward the next level
    setExpBar(element, monster) {
        if (!element) return;

        const percent = Math.min(100, (monster.exp / monster.expToLevel) * 100);
        element.style.width = `${percent}%`;
    }

    // The types a monster carries, in their own colours. With two of them
    // stacking multipliers, knowing what is in front of you matters.
    setTypeChips(element, monster) {
        if (!element) return;

        element.innerHTML = monster.getTypes().map(type => {
            const color = `#${(TYPE_COLORS[type] ?? 0xcccccc).toString(16).padStart(6, '0')}`;
            return `<span class="type-chip" style="background:${color}">${type}</span>`;
        }).join('');
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

        const opponent = this.scene.battleSystem.wildMonster;
        const moves = monster.isOutOfPp() ? [getMove('Struggle')] : monster.getMoves();

        moves.forEach(move => {
            const pp = monster.getPp(move.name);
            const empty = move.name !== 'Struggle' && pp <= 0;

            // Show how this move lands on what is in front of you
            const multiplier = opponent && move.power
                ? getEffectivenessAgainst(move.type, opponent.getTypes())
                : 1;
            const hint = multiplier > 1 ? '<span class="hint good">▲</span>'
                : multiplier < 1 ? '<span class="hint bad">▼</span>'
                : '';

            const button = document.createElement('button');
            button.className = 'move-btn';
            button.dataset.type = move.type;
            button.disabled = empty;
            button.innerHTML = `
                <span class="move-name">${move.name}${hint}</span>
                <span class="move-meta">${move.type}${move.power ? ` &middot; ${move.power}` : ''}${
                    move.name === 'Struggle' ? '' : ` &middot; ${pp}/${move.pp}`}</span>
            `;
            button.addEventListener('click', () => {
                if (empty) return;
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

        const battle = this.scene.battleSystem;
        if (this.burstButton && battle) {
            this.burstButton.disabled = !interactive || !battle.momentumFull || battle.burstArmed;
        }

        this.moveButtons.querySelectorAll('button').forEach(button => {
            button.disabled = !interactive;
        });

        if (!interactive) this.showBattlePanel('main');
    }

    // The momentum gauge, and the Burst it pays for
    updateMomentum({ momentum = 0, max = 100, armed = false } = {}) {
        if (this.momentumFill) {
            this.momentumFill.style.width = `${Math.min(100, (momentum / max) * 100)}%`;
            this.momentumFill.classList.toggle('full', momentum >= max);
        }

        if (this.burstButton) {
            this.burstButton.disabled = momentum < max || armed;
            this.burstButton.classList.toggle('ready', momentum >= max && !armed);
            this.burstButton.classList.toggle('armed', armed);
            this.burstButton.textContent = armed ? 'ARMED' : 'BURST';
        }
    }

    // Flash the bar gold while experience is being added
    showExpGain() {
        this.updateBattleBars();

        if (!this.playerExp) return;
        this.playerExp.classList.add('gained');
        setTimeout(() => this.playerExp.classList.remove('gained'), 900);
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

        // The monster that will actually lead the next battle: the first one
        // still standing. Highlighting anything else would be a lie, since
        // startBattle() picks this one regardless of what is tapped.
        const leadIndex = Math.max(0, player.getFirstHealthyIndex());

        player.getAllMonsters().forEach((monster, index) => {
            const row = document.createElement('div');
            row.className = 'monster-row';
            if (index === leadIndex) row.classList.add('active');
            if (!monster.isAlive()) row.classList.add('fainted');

            const percent = (monster.hp / monster.maxHp) * 100;
            const expPercent = Math.min(100, (monster.exp / monster.expToLevel) * 100);

            row.innerHTML = `
                <div class="monster-avatar" data-key="${monster.getSpriteKey()}"></div>
                <div class="monster-info">
                    <div class="monster-title">
                        <span>${index === leadIndex ? '★ ' : ''}${monster.name}</span>
                        <span class="muted">Lv.${monster.level}</span>
                    </div>
                    <div class="health-bar small"><div class="health-fill" style="width:${percent}%"></div></div>
                    <div class="exp-row">
                        <span class="exp-label muted">EXP</span>
                        <div class="exp-bar"><div class="exp-fill" style="width:${expPercent}%"></div></div>
                    </div>
                    <div class="monster-sub muted">${monster.typeLabel} &middot; ${monster.hp}/${monster.maxHp} HP &middot; ${monster.exp}/${monster.expToLevel} to Lv.${monster.level + 1}</div>
                    <div class="bond-row" title="Bond">${this.renderHearts(monster)}</div>
                </div>
            `;

            // Arrows to reorder; the top of the list leads the next battle
            const controls = document.createElement('div');
            controls.className = 'reorder';
            controls.innerHTML = `
                <button class="reorder-btn" data-move="up" ${index === 0 ? 'disabled' : ''} aria-label="Move up">▲</button>
                <button class="reorder-btn" data-move="down" ${index === player.getAllMonsters().length - 1 ? 'disabled' : ''} aria-label="Move down">▼</button>
            `;

            controls.querySelectorAll('.reorder-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    event.stopPropagation();
                    if (player.reorderMonster(index, button.dataset.move === 'up' ? -1 : 1)) {
                        audioManager.playSfx('buy');
                        this.renderTeamList();
                        saveGame();
                    }
                });
            });

            row.appendChild(controls);

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

    // `stock` is a list of item names; without one this is an ordinary town
    // shop, which never carries the pedlar's rarities.
    openShop(stock = null, title = 'Shop') {
        this.shopStock = stock;
        this.shopUI.querySelector('h2').textContent = title;

        this.shopUI.classList.remove('hidden');
        this.setWorldHudVisible(false);
        this.renderShop();
        touchControls.reset();
        audioManager.playSfx('shop');
    }

    closeShop() {
        this.shopUI.classList.add('hidden');
        this.shopStock = null;
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
            .filter(([name, item]) => this.shopStock
                ? this.shopStock.includes(name)
                : item.price > 0 && !item.rare)
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

    // Five hearts, filled in as a monster gets closer to the player
    renderHearts(monster) {
        const filled = monster.bondHearts;

        return Array.from({ length: 5 }, (_, i) =>
            `<span class="heart${i < filled ? ' filled' : ''}">\u2665</span>`).join('');
    }

    // --- mentoring at Willow Rest -------------------------------------------

    // One panel, walked through a step at a time: who teaches, who learns,
    // what it learns, and - if its four moves are full - what it gives up.
    openMentoring() {
        this.mentorPick = { teacher: null, student: null, move: null, forget: null };
        this.mentorUI.classList.remove('hidden');
        this.setWorldHudVisible(false);
        this.updateCoins();
        this.renderMentoring();
        touchControls.reset();
        audioManager.playSfx('shop');
    }

    closeMentoring() {
        this.mentorUI.classList.add('hidden');
        this.mentorPick = {};
        this.setWorldHudVisible(true);
        saveGame();
    }

    // Undo the last choice, or leave if there is nothing left to undo
    stepMentoringBack() {
        const pick = this.mentorPick;

        if (pick.forget) pick.forget = null;
        else if (pick.move) pick.move = null;
        else if (pick.student) pick.student = null;
        else if (pick.teacher) pick.teacher = null;
        else {
            this.closeMentoring();
            return;
        }

        this.renderMentoring();
    }

    get mentorStep() {
        const { teacher, student, move } = this.mentorPick;

        if (!teacher) return 'teacher';
        if (!student) return 'student';
        if (!move) return 'move';
        if (student.moves.length >= 4 && !this.mentorPick.forget) return 'forget';

        return 'ready';
    }

    renderMentoring() {
        const step = this.mentorStep;
        const goButton = document.getElementById('mentor-go-btn');

        this.mentorList.innerHTML = '';
        this.mentorSummary.classList.add('hidden');
        if (goButton) goButton.disabled = step !== 'ready';

        const render = {
            teacher: () => this.renderMentorTeachers(),
            student: () => this.renderMentorStudents(),
            move: () => this.renderMentorMoves(),
            forget: () => this.renderMentorForget(),
            ready: () => this.renderMentorSummary()
        };

        render[step]();
    }

    renderMentorTeachers() {
        this.mentorHint.textContent = 'Which of yours will teach? Pick the older one.';

        this.scene.player.getAllMonsters().forEach((monster) => {
            // What it could pass on is the only thing worth knowing here
            this.mentorList.appendChild(this.mentorRow(monster, monster.moves.join(', '), false,
                () => { this.mentorPick.teacher = monster; this.renderMentoring(); }));
        });

        this.paintAvatars(this.mentorList);
    }

    renderMentorStudents() {
        const { teacher } = this.mentorPick;
        this.mentorHint.textContent = `Who will learn from ${teacher.name}?`;

        this.scene.player.getAllMonsters().forEach((monster) => {
            const check = canMentor(teacher, monster);
            const note = check.ok
                ? `Lv.${monster.level} \u2192 Lv.${monster.level + mentoringLevelGain(teacher, monster)}`
                : check.reason;

            this.mentorList.appendChild(this.mentorRow(monster, note, !check.ok,
                () => { this.mentorPick.student = monster; this.renderMentoring(); }));
        });

        this.paintAvatars(this.mentorList);
    }

    renderMentorMoves() {
        const { teacher, student } = this.mentorPick;
        this.mentorHint.textContent = `What will ${teacher.name} show ${student.name}?`;

        this.mentorList.appendChild(this.moveChoiceGrid(
            teachableMoves(teacher, student),
            (name) => { this.mentorPick.move = name; this.renderMentoring(); }));
    }

    renderMentorForget() {
        const { student, move } = this.mentorPick;
        this.mentorHint.textContent =
            `${student.name} already knows four. Which one goes, to make room for ${move}?`;

        this.mentorList.appendChild(this.moveChoiceGrid(
            student.moves,
            (name) => { this.mentorPick.forget = name; this.renderMentoring(); }));
    }

    // Shared move picker, styled like the battle move buttons
    moveChoiceGrid(names, onPick) {
        const grid = document.createElement('div');
        grid.className = 'mentor-moves';

        names.forEach(name => {
            const move = getMove(name);
            const button = document.createElement('button');
            button.className = 'move-btn';
            button.dataset.type = move.type;
            button.innerHTML = `
                <span class="move-name">${move.name}</span>
                <span class="move-meta">${move.type}${move.power ? ` &middot; ${move.power}` : ''} &middot; ${move.pp} PP</span>
            `;
            button.addEventListener('click', () => onPick(name));
            grid.appendChild(button);
        });

        return grid;
    }

    mentorRow(monster, note, disabled, onPick) {
        const row = document.createElement('button');
        row.className = 'monster-row selectable';
        row.disabled = disabled;
        row.innerHTML = `
            <div class="monster-avatar" data-key="${monster.getSpriteKey()}"></div>
            <div class="monster-info">
                <div class="monster-title">
                    <span>${monster.name}</span>
                    <span class="muted">Lv.${monster.level}</span>
                </div>
                <div class="monster-sub muted">${monster.typeLabel} &middot; ${note}</div>
            </div>
        `;
        row.addEventListener('click', onPick);

        return row;
    }

    renderMentorSummary() {
        const { teacher, student, move, forget } = this.mentorPick;
        const player = this.scene.player;
        const affordable = player.canAfford(MENTORING.COST);
        const gained = mentoringLevelGain(teacher, student);

        this.mentorHint.textContent = affordable
            ? 'Miriam will keep them both a while. Nobody loses anything by it.'
            : `Miriam asks ${MENTORING.COST} coins for their board.`;

        this.mentorSummary.classList.remove('hidden');
        this.mentorSummary.innerHTML = `
            <div class="mentor-pair">${teacher.name} teaches ${student.name}</div>
            <div class="mentor-detail">
                Learns <strong>${move}</strong>${forget ? `, forgets ${forget}` : ''}<br>
                Comes back at Lv.${student.level + gained} <span class="muted">(+${gained})</span>
            </div>
            <div class="mentor-cost">${MENTORING.COST} coins</div>
        `;

        const goButton = document.getElementById('mentor-go-btn');
        if (goButton) goButton.disabled = !affordable;
    }

    confirmMentoring() {
        const { teacher, student, move, forget } = this.mentorPick;
        const player = this.scene.player;

        if (this.mentorStep !== 'ready' || !player.canAfford(MENTORING.COST)) return;

        const result = mentor(teacher, student, move, forget);
        if (!result) return;

        player.addCoins(-MENTORING.COST);
        gameState.lessonsGiven++;

        // Evolving during the lesson is a real possibility, so record it
        result.events
            .filter(event => event.kind === 'evolved')
            .forEach(event => player.recordCaught(student.name));

        this.mentorPick = { teacher: null, student: null, move: null, forget: null };
        this.renderMentoring();
        this.updateCoins();

        audioManager.playSfx('victory');
        this.showMessage(
            `${student.name} learned ${result.learned || move}` +
            (result.levelsGained ? ` and grew to Lv.${student.level}!` : '!'),
            4000
        );
        this.checkDexCompletion();
        saveGame();
    }

    // --- dialogue -----------------------------------------------------------

    isDialogueOpen() {
        return this.dialogueUI && !this.dialogueUI.classList.contains('hidden');
    }

    // True while any full-screen panel is up, so the world ignores input
    isOverlayOpen() {
        return [this.menuUI, this.shopUI, this.dexUI, this.battleUI, this.mentorUI]
            .some(panel => panel && !panel.classList.contains('hidden'));
    }

    showDialogue(speaker, lines, onDone = null) {
        this.dialogueQueue = [...(lines || [])];
        this.dialogueDone = onDone;
        this.dialogueChoice = null;

        this.dialogueSpeaker.textContent = speaker || '';
        this.dialogueSpeaker.classList.toggle('hidden', !speaker);

        this.dialogueUI.classList.remove('hidden');
        this.setWorldHudVisible(false);
        this.advanceDialogue(true);
    }

    // The same box, but the last line waits on a yes or a no instead of a tap
    showChoice(speaker, lines, options, onChoose) {
        this.showDialogue(speaker, lines, null);
        this.dialogueChoice = { options, onChoose };

        // The lines may already have run out on a single-line prompt
        if (!this.dialogueQueue.length) this.presentChoice();
    }

    presentChoice() {
        if (!this.dialogueChoice || !this.dialogueChoices) return;

        const { options } = this.dialogueChoice;
        document.getElementById('dialogue-yes').textContent = options.yes;
        document.getElementById('dialogue-no').textContent = options.no;

        this.dialogueChoices.classList.remove('hidden');
        if (this.dialogueHint) this.dialogueHint.classList.add('hidden');
    }

    answerChoice(accepted) {
        const choice = this.dialogueChoice;
        if (!choice) return;

        this.dialogueChoice = null;
        this.dialogueChoices.classList.add('hidden');
        if (this.dialogueHint) this.dialogueHint.classList.remove('hidden');

        this.closeDialogue();
        choice.onChoose(accepted);
    }

    // Show a conversation once the battle panel has closed
    queueDialogue(speaker, lines) {
        if (!lines || !lines.length) return;

        setTimeout(() => this.showDialogue(speaker, lines), 400);
    }

    advanceDialogue(first = false) {
        if (!this.isDialogueOpen() && !first) return;

        if (this.dialogueQueue.length === 0) {
            // A prompt waits here for an answer rather than closing
            if (this.dialogueChoice) {
                this.presentChoice();
                return;
            }

            this.closeDialogue();
            return;
        }

        this.dialogueText.textContent = this.dialogueQueue.shift();

        // Show the buttons as the final line goes up, not a tap later
        if (!this.dialogueQueue.length && this.dialogueChoice) this.presentChoice();
    }

    closeDialogue() {
        this.dialogueUI.classList.add('hidden');
        this.setWorldHudVisible(true);

        if (this.dialogueChoices) this.dialogueChoices.classList.add('hidden');
        if (this.dialogueHint) this.dialogueHint.classList.remove('hidden');

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
        // Messages are all positioned in the same spot, so a second one
        // arriving while the first is up printed the two on top of each
        // other. The newest is the one that matters.
        document.querySelectorAll('.game-message').forEach(old => old.remove());

        const element = document.createElement('div');
        element.className = 'game-message';
        element.textContent = message;

        document.body.appendChild(element);
        setTimeout(() => element.remove(), duration);
    }
}
