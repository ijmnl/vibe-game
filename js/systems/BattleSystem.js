/**
 * Turn-based battle logic.
 *
 * Emits on the world scene (where the DOM UI listens) but schedules its turn
 * delays on whichever scene is actually running - the world scene is paused
 * during a battle, so its clock is frozen.
 */
class BattleSystem {
    constructor(scene) {
        this.scene = scene;
        this.timerScene = scene;

        this.player = null;
        this.opponent = null;
        this.isBattleActive = false;
        this.turn = 'player';
        this.battleLog = [];
        this.busy = false;

        // Momentum builds as the fight goes well - or badly. A full gauge
        // buys one Burst: a move that cannot miss and hits twice as hard.
        this.momentum = 0;
        this.burstArmed = false;
    }

    static MAX_MOMENTUM = 100;

    // Whatever the sky is doing on the map the battle started from
    get weather() {
        return currentWeather();
    }

    get momentumFull() {
        return this.momentum >= BattleSystem.MAX_MOMENTUM;
    }

    addMomentum(amount) {
        const before = this.momentum;
        this.momentum = clamp(this.momentum + amount, 0, BattleSystem.MAX_MOMENTUM);

        if (this.momentum !== before) this.emitMomentum();
        if (before < BattleSystem.MAX_MOMENTUM && this.momentumFull) {
            this.addToLog('Your momentum is at full - Burst is ready!');
            audioManager.playSfx('victory');
        }
    }

    emitMomentum() {
        this.scene.events.emit('battle-momentum', {
            momentum: this.momentum,
            max: BattleSystem.MAX_MOMENTUM,
            armed: this.burstArmed
        });
    }

    // Arm the next move as a Burst. Spending happens when the move lands, so
    // arming it and then changing your mind costs nothing.
    armBurst() {
        if (!this.momentumFull || this.burstArmed) return false;

        this.burstArmed = true;
        this.addToLog('Burst armed! Pick the move to unleash.');
        this.emitMomentum();

        return true;
    }

    // The monster the opponent has out. A wild battle is simply a trainer
    // battle against a nameless team of one.
    get wildMonster() {
        return this.opponent ? this.opponent.team[this.opponent.index] : null;
    }

    get isTrainerBattle() {
        return !!this.opponent && !this.opponent.isWild;
    }

    startBattle(player, wildMonster, timerScene = this.scene) {
        this.begin(player, { isWild: true, team: [wildMonster], index: 0 }, timerScene);
    }

    // trainer: { id, title, team: [Monster], reward, defeat: [lines] }
    startTrainerBattle(player, trainer, timerScene = this.scene) {
        this.begin(player, {
            isWild: false,
            id: trainer.id,
            title: trainer.title,
            team: trainer.team,
            index: 0,
            reward: trainer.reward || 0,
            defeatLines: trainer.defeat || []
        }, timerScene);
    }

    begin(player, opponent, timerScene) {
        this.timerScene = timerScene;
        this.player = player;
        this.opponent = opponent;
        this.isBattleActive = true;
        this.battleLog = [];
        this.busy = false;
        this.momentum = 0;
        this.burstArmed = false;

        opponent.team.forEach(monster => monster.resetBattleState());
        if (opponent.isWild) player.recordSeen(this.wildMonster.name);

        // Lead with someone who can actually fight
        const healthy = player.getFirstHealthyIndex();
        if (healthy >= 0) player.currentMonsterIndex = healthy;

        player.getCurrentMonster()?.resetBattleState();

        // Show the panel first: it clears the log box, which would otherwise
        // wipe these opening lines.
        this.scene.events.emit('battle-start', {
            player,
            wildMonster: this.wildMonster,
            turn: 'player'
        });

        if (opponent.isWild) {
            this.addToLog(`A wild ${this.wildMonster.name} (Lv.${this.wildMonster.level}) appeared!`);
        } else {
            this.addToLog(`${opponent.title} wants to battle!`);
            this.addToLog(`${opponent.title} sent out ${this.wildMonster.name}!`);
        }

        const sky = getWeather(this.weather);
        if (sky.id !== 'clear') this.addToLog(sky.blurb);

        this.emitMomentum();
        this.setTurn('player');
    }

    setTurn(turn) {
        this.turn = turn;
        this.scene.events.emit('battle-turn-change', { turn, busy: this.busy });
    }

    // Blocks input while an exchange plays out
    setBusy(busy) {
        this.busy = busy;
        this.scene.events.emit('battle-turn-change', { turn: this.turn, busy });
    }

    wait(ms) {
        return new Promise(resolve => this.timerScene.time.delayedCall(ms, resolve));
    }

    // --- player actions -----------------------------------------------------

    async playerAction(action, payload = null) {
        if (!this.isBattleActive || this.turn !== 'player' || this.busy) {
            return { success: false, reason: 'Not your turn' };
        }

        const playerMonster = this.player.getCurrentMonster();
        if (!playerMonster) return { success: false, reason: 'No monster' };

        this.setBusy(true);

        let playerActed = true;

        switch (action) {
            case 'move':
                // The exchange resolves both sides in speed order, so the
                // enemy turn is already included in it.
                await this.resolveMoveExchange(payload);
                playerActed = false;
                break;
            case 'catch':
                playerActed = await this.tryCatch(payload);
                break;
            case 'run':
                playerActed = await this.tryRun();
                break;
            case 'use-item':
                playerActed = await this.useItem(payload);
                break;
            case 'switch':
                playerActed = await this.switchMonster(payload);
                break;
            case 'burst':
                // Arming costs nothing and no turn: the move that follows
                // is the one that spends the gauge.
                this.armBurst();
                this.setBusy(false);
                this.setTurn('player');
                return { success: true };
            default:
                this.setBusy(false);
                return { success: false, reason: 'Unknown action' };
        }

        if (!this.isBattleActive) {
            this.setBusy(false);
            return { success: true };
        }

        if (await this.checkFaintedAndMaybeEnd()) {
            this.setBusy(false);
            return { success: true };
        }

        // A failed catch or item still costs the turn
        if (playerActed) {
            await this.wait(500);
            await this.enemyTurn();
        }

        if (this.isBattleActive) {
            await this.endOfTurn();
        }

        this.setBusy(false);
        if (this.isBattleActive) this.setTurn('player');

        return { success: true };
    }

    // Both sides commit to a move, then act in order of priority and speed
    async resolveMoveExchange(moveName) {
        const mine = this.player.getCurrentMonster();
        const theirs = this.wildMonster;
        if (!mine || !theirs) return;

        // Out of PP entirely? Struggle instead of stalling.
        const myMove = mine.isOutOfPp() ? getMove('Struggle') : getMove(moveName);
        if (myMove.name !== 'Struggle') mine.spendPp(myMove.name);

        const theirMove = theirs.chooseMove(mine);
        if (theirMove.name !== 'Struggle') theirs.spendPp(theirMove.name);

        const playerFirst = this.playerMovesFirst(mine, myMove, theirs, theirMove);

        const sequence = playerFirst
            ? [[mine, theirs, myMove, false], [theirs, mine, theirMove, true]]
            : [[theirs, mine, theirMove, true], [mine, theirs, myMove, false]];

        // A Burst is spent on the player's half of this exchange, whatever
        // order the two sides end up acting in.
        const burst = this.burstArmed;
        if (burst) {
            this.burstArmed = false;
            this.momentum = 0;
            this.emitMomentum();
        }

        for (const [attacker, defender, move, isEnemy] of sequence) {
            if (!this.isBattleActive) return;
            if (!attacker.isAlive() || !defender.isAlive()) return;

            this.setTurn(isEnemy ? 'enemy' : 'player');
            await this.performMove(attacker, defender, move, isEnemy, burst && !isEnemy);

            // A faint ends the exchange: the replacement does not get hit
            // in the same round.
            if (await this.checkFaintedAndMaybeEnd()) return;
        }
    }

    // Higher priority wins, then higher speed, then a coin flip
    playerMovesFirst(mine, myMove, theirs, theirMove) {
        const myPriority = myMove.priority || 0;
        const theirPriority = theirMove.priority || 0;

        if (myPriority !== theirPriority) return myPriority > theirPriority;

        const mySpeed = mine.effectiveSpeed();
        const theirSpeed = theirs.effectiveSpeed();

        if (mySpeed !== theirSpeed) return mySpeed > theirSpeed;

        return Math.random() < 0.5;
    }

    async enemyTurn() {
        if (!this.isBattleActive) return;

        const attacker = this.wildMonster;
        const defender = this.player.getCurrentMonster();
        if (!attacker?.isAlive() || !defender?.isAlive()) return;

        this.setTurn('enemy');
        const move = attacker.chooseMove(defender);

        await this.performMove(attacker, defender, move, true);
        await this.checkFaintedAndMaybeEnd();
    }

    // One monster using one move on another
    async performMove(attacker, defender, move, isEnemy, burst = false) {
        const label = isEnemy ? `Wild ${attacker.name}` : attacker.name;

        const statusCheck = attacker.checkStatusBeforeMove();
        if (statusCheck.message) this.addToLog(statusCheck.message);
        if (!statusCheck.canAct) {
            await this.wait(700);
            return;
        }

        this.addToLog(burst ? `${label} unleashed ${move.name}!` : `${label} used ${move.name}!`);
        this.scene.events.emit('battle-move-used', { attacker, move, isEnemy, burst });
        await this.wait(450);

        // Fog makes everyone less accurate; a Burst cuts straight through it
        const accuracy = burst ? 1 : move.accuracy - weatherAccuracyPenalty(this.weather);
        if (Math.random() > accuracy) {
            this.addToLog(`It missed!`);
            await this.wait(500);
            return;
        }

        if (move.power > 0) {
            const result = this.calculateDamage(attacker, defender, move, burst);

            // A monster you are close to will dig in once rather than fall
            const heldOn = defender.tryHangOn(result.damage);
            if (!heldOn) defender.takeDamage(result.damage);

            this.scene.events.emit('battle-damage', {
                target: defender,
                isEnemy: !isEnemy,
                amount: result.damage,
                critical: result.critical,
                effectiveness: result.multiplier,
                burst
            });

            if (result.critical) this.addToLog('A critical hit!');
            if (result.note) this.addToLog(result.note);
            this.addToLog(`${defender.name} took ${result.damage} damage.`);
            if (heldOn) {
                this.addToLog(`${defender.name} refused to go down for you!`);
                this.scene.events.emit('battle-held-on', { monster: defender, isEnemy: !isEnemy });
            }

            this.gainMomentumFromHit(result, isEnemy);

            if (move.recoil) {
                const hurt = attacker.takeDamage(Math.max(1, Math.floor(result.damage * move.recoil)));
                this.addToLog(`${label} is hit by recoil! (-${hurt})`);
                this.scene.events.emit('battle-damage', { target: attacker, isEnemy, amount: hurt });
            }

            if (move.effect?.kind === 'drain') {
                const healed = attacker.heal(Math.floor(result.damage * move.effect.percent));
                if (healed > 0) this.addToLog(`${label} drained ${healed} HP.`);
            }
        }

        await this.applyMoveEffect(attacker, defender, move, label);
        await this.wait(500);
    }

    // Momentum rewards playing the matchup well - and shows a little mercy
    // when you are the one being hit, so a losing fight can still turn.
    gainMomentumFromHit(result, isEnemy) {
        if (isEnemy) {
            this.addMomentum(10);
            return;
        }

        // Tuned so a fight you are playing well reaches a Burst in about
        // three rounds, and a fight you are losing still gets there.
        let gained = 12;
        if (result.multiplier > 1) gained += 18;
        if (result.critical) gained += 12;

        this.addMomentum(gained);
    }

    async applyMoveEffect(attacker, defender, move, label) {
        const effect = move.effect;
        if (!effect) return;

        switch (effect.kind) {
            case 'heal': {
                const healed = attacker.heal(Math.floor(attacker.maxHp * effect.percent));
                this.addToLog(healed > 0
                    ? `${label} recovered ${healed} HP.`
                    : `${label} is already at full health.`);
                this.scene.events.emit('battle-heal', {});
                break;
            }
            case 'status': {
                if (Math.random() > (effect.chance ?? 1)) break;
                if (defender.applyStatus(effect.status)) {
                    this.addToLog(`${defender.name} is ${this.statusVerb(effect.status)}!`);
                }
                break;
            }
            case 'raise-attack':
                if (attacker.changeStage('attack', effect.stages)) {
                    this.addToLog(`${label}'s attack rose!`);
                }
                break;
            case 'raise-defense':
                if (attacker.changeStage('defense', effect.stages)) {
                    this.addToLog(`${label}'s defence rose!`);
                }
                break;
            case 'lower-attack':
                if (defender.changeStage('attack', -effect.stages)) {
                    this.addToLog(`${defender.name}'s attack fell!`);
                }
                break;
            case 'lower-defense':
                if (defender.changeStage('defense', -effect.stages)) {
                    this.addToLog(`${defender.name}'s defence fell!`);
                }
                break;
        }
    }

    statusVerb(status) {
        return {
            burn: 'burned',
            poison: 'poisoned',
            paralysis: 'paralysed',
            sleep: 'fast asleep'
        }[status] || status;
    }

    calculateDamage(attacker, defender, move, burst = false) {
        const attack = attacker.effectiveStat('attack');
        const defense = defender.effectiveStat('defense');

        const base = ((2 * attacker.level / 5 + 2) * move.power * attack / defense) / CONFIG.DAMAGE_SCALE + 2;

        // Both of a fused monster's types resist or fold, and they stack
        const multiplier = getEffectivenessAgainst(move.type, defender.getTypes());
        const stab = attacker.getTypes().includes(move.type) ? CONFIG.STAB_MULTIPLIER : 1;
        const critical = burst || Math.random() < attacker.critChance();
        const crit = critical ? CONFIG.CRIT_MULTIPLIER : 1;
        const variance = randomFloat(0.85, 1);
        const sky = weatherDamageFactor(this.weather, move.type);

        // A burn halves physical output
        const burn = attacker.status === 'burn' ? 0.75 : 1;
        const burstBonus = burst ? CONFIG.BURST_MULTIPLIER : 1;

        return {
            damage: Math.max(1, Math.floor(
                base * multiplier * stab * crit * variance * burn * sky * burstBonus)),
            critical,
            multiplier,
            note: describeStackedEffectiveness(multiplier)
        };
    }

    // --- catching -----------------------------------------------------------

    async tryCatch(ballName) {
        if (this.isTrainerBattle) {
            this.addToLog("You can't catch someone else's monster!");
            await this.wait(700);
            return false;
        }

        const inventory = this.player.getInventory();
        const ball = ballName || this.bestAvailableBall();

        if (!ball || !inventory.hasItem(ball)) {
            this.addToLog('You have no balls left!');
            await this.wait(600);
            return false;
        }

        inventory.removeItem(ball, 1);
        this.addToLog(`You threw a ${ball}!`);

        const chance = this.catchChance(ball);
        const success = Math.random() < chance;

        this.scene.events.emit('battle-catch-attempt', { success, ball });
        await this.wait(1400);

        if (!success) {
            this.addToLog(`The wild ${this.wildMonster.name} broke free!`);
            return true; // a failed throw costs the turn
        }

        const result = this.player.catchMonster(this.wildMonster);

        if (result.success && result.stored) {
            this.addToLog(`Gotcha! ${this.wildMonster.name} went to the ranch.`);
            this.endBattle('catch-stored');
        } else if (result.success) {
            this.addToLog(`Gotcha! ${this.wildMonster.name} was caught!`);
            this.endBattle('catch');
        } else {
            this.addToLog(`${this.wildMonster.name} was caught, but ${result.reason}`);
            this.endBattle('catch-full');
        }

        return false;
    }

    // Weaker and status-afflicted monsters are easier to catch. There is no
    // attempt limit - running out of balls is the only thing that stops you.
    catchChance(ballName) {
        const ball = CONFIG.ITEMS[ballName];
        // A Night Ball is barely worth carrying by day and superb after dark
        const catchRate = (currentClock()?.isDark && ball.nightRate) || ball.catchRate;
        const hpFactor = 1 - (this.wildMonster.hp / this.wildMonster.maxHp) * 0.65;
        const statusBonus = this.wildMonster.status
            ? (this.wildMonster.status === 'sleep' ? 1.6 : 1.3)
            : 1;
        const levelPenalty = clamp(1 - this.wildMonster.level / 90, 0.45, 1);
        const legendary = this.wildMonster.legendary ? 0.35 : 1;

        return clamp(
            0.55 * catchRate * hpFactor * statusBonus * levelPenalty * legendary,
            0.03,
            0.95
        );
    }

    bestAvailableBall() {
        return ['Ultra Ball', 'Super Ball', 'Monster Ball']
            .find(name => this.player.getInventory().hasItem(name)) || null;
    }

    // --- other actions ------------------------------------------------------

    async tryRun() {
        if (this.isTrainerBattle) {
            this.addToLog("There's no running from a trainer battle!");
            await this.wait(700);
            return true;
        }

        if (this.wildMonster.legendary) {
            this.addToLog("You can't escape from this one!");
            await this.wait(700);
            return true;
        }

        const mine = this.player.getCurrentMonster();
        const ratio = mine.speed / (mine.speed + this.wildMonster.speed);
        const success = Math.random() < 0.45 + ratio * 0.5;

        if (success) {
            this.addToLog('Got away safely!');
            await this.wait(600);
            this.endBattle('run');
            return false;
        }

        this.addToLog("Couldn't get away!");
        await this.wait(600);
        return true;
    }

    async useItem(itemName) {
        const inventory = this.player.getInventory();
        const item = CONFIG.ITEMS[itemName];
        const monster = this.player.getCurrentMonster();

        if (!item || !inventory.hasItem(itemName) || !monster) return false;

        if (item.type === 'heal') {
            if (monster.hp >= monster.maxHp) {
                this.addToLog(`${monster.name} is already at full health.`);
                await this.wait(600);
                return false;
            }

            const healed = monster.heal(item.value);
            inventory.removeItem(itemName, 1);
            this.addToLog(`Used ${itemName}. ${monster.name} recovered ${healed} HP.`);
            this.scene.events.emit('battle-heal', {});
            await this.wait(700);
            return true;
        }

        if (item.type === 'cure') {
            if (!monster.status) {
                this.addToLog(`${monster.name} has no status to cure.`);
                await this.wait(600);
                return false;
            }

            monster.status = null;
            inventory.removeItem(itemName, 1);
            this.addToLog(`${monster.name} is back to normal.`);
            await this.wait(700);
            return true;
        }

        if (item.type === 'ball') {
            return this.tryCatch(itemName);
        }

        return false;
    }

    async switchMonster(index) {
        const target = this.player.getAllMonsters()[index];

        if (!target || !target.isAlive() || index === this.player.currentMonsterIndex) {
            return false;
        }

        this.player.getCurrentMonster()?.resetBattleState();
        this.player.currentMonsterIndex = index;

        this.addToLog(`Go, ${target.name}!`);
        this.scene.events.emit('battle-monster-switch', { player: this.player });
        await this.wait(600);

        return true;
    }

    // --- turn bookkeeping ---------------------------------------------------

    async endOfTurn() {
        for (const monster of [this.player.getCurrentMonster(), this.wildMonster]) {
            if (!monster || !monster.isAlive()) continue;

            const message = monster.applyEndOfTurnStatus();
            if (message) {
                this.addToLog(message);
                this.scene.events.emit('battle-damage', { target: monster });
                await this.wait(600);
            }
        }

        await this.applyWeatherDamage();
        await this.checkFaintedAndMaybeEnd();
    }

    // A sandstorm wears down everything that is not made of rock
    async applyWeatherDamage() {
        const sky = getWeather(this.weather);
        if (!sky.chip) return;

        for (const monster of [this.player.getCurrentMonster(), this.wildMonster]) {
            if (!monster || !monster.isAlive()) continue;

            const damage = weatherChipDamage(this.weather, monster);
            if (!damage) continue;

            monster.takeDamage(damage);
            this.addToLog(`${monster.name} is buffeted by the ${sky.label.toLowerCase()}! (-${damage})`);
            this.scene.events.emit('battle-damage', { target: monster });
            await this.wait(500);
        }
    }

    // Returns true when the battle is over or waiting on a replacement
    async checkFaintedAndMaybeEnd() {
        if (!this.isBattleActive) return true;

        if (!this.wildMonster.isAlive()) {
            const fallen = this.wildMonster;
            this.addToLog(this.isTrainerBattle
                ? `${this.opponent.title}'s ${fallen.name} fainted!`
                : `Wild ${fallen.name} fainted!`);
            await this.wait(600);

            await this.awardSpoils(fallen);

            // A trainer keeps going while they still have monsters
            const next = this.opponent.team.findIndex(m => m.isAlive());
            if (this.isTrainerBattle && next >= 0) {
                this.opponent.index = next;
                this.addToLog(`${this.opponent.title} sent out ${this.wildMonster.name}!`);
                this.scene.events.emit('battle-opponent-switch', {});
                await this.wait(700);
                return false;
            }

            this.endBattle('win');
            return true;
        }

        const mine = this.player.getCurrentMonster();
        if (mine && !mine.isAlive()) {
            this.addToLog(`${mine.name} fainted!`);
            this.scene.events.emit('battle-monster-faint', { player: this.player });
            await this.wait(700);

            if (!this.player.hasHealthyMonster()) {
                this.endBattle('lose');
                return true;
            }

            // Send out the next healthy monster automatically
            const next = this.player.getFirstHealthyIndex();
            this.player.currentMonsterIndex = next;
            const replacement = this.player.getCurrentMonster();
            replacement.resetBattleState();

            this.addToLog(`Go, ${replacement.name}!`);
            this.scene.events.emit('battle-monster-switch', { player: this.player });
            await this.wait(600);
        }

        return false;
    }

    async awardSpoils(defeated) {
        const monster = this.player.getCurrentMonster();
        const wild = defeated || this.wildMonster;

        // What the results panel will show once the dust settles
        const spoils = { name: wild.name, coins: 0, exp: 0, monster, events: [] };

        // Wild monsters drop coins themselves; a trainer pays once, at the end
        if (this.opponent.isWild) {
            const coins = CONFIG.COINS_PER_WIN_BASE + wild.level * CONFIG.COINS_PER_WIN_PER_LEVEL;
            this.player.addCoins(coins);
            this.addToLog(`You found ${coins} coins!`);
            spoils.coins = coins;
        }

        if (!monster || !monster.isAlive()) {
            await this.presentSpoils(spoils);
            return;
        }

        const trainerBonus = this.opponent.isWild ? 1 : 1.5;
        const gained = Math.floor(getSpecies(wild.name).exp * wild.level * trainerBonus / 4) + 5;
        this.addToLog(`${monster.name} gained ${gained} EXP.`);
        spoils.exp = gained;

        // Fighting alongside you is what builds the bond
        const heart = monster.addBond(wild.level >= monster.level ? 6 : 3);
        if (heart) {
            this.addToLog(`${monster.name} feels closer to you. (${'\u2665'.repeat(heart)})`);
            this.scene.events.emit('battle-bond', { monster, hearts: heart });
            spoils.hearts = heart;
        }

        const levelBefore = monster.level;
        const events = monster.gainExp(gained);
        spoils.events = events;
        spoils.levelBefore = levelBefore;
        this.scene.events.emit('battle-exp', { monster, gained });

        for (const event of events) {
            if (event.kind === 'level-up') {
                this.addToLog(`${monster.name} grew to Lv.${event.level}!`);
                this.scene.events.emit('monster-levelup', { monster, level: event.level });
            } else if (event.kind === 'move-learned') {
                this.addToLog(event.forgotten
                    ? `${monster.name} learned ${event.move}, forgetting ${event.forgotten}.`
                    : `${monster.name} learned ${event.move}!`);
            } else if (event.kind === 'evolved') {
                this.addToLog(`${event.from} evolved into ${event.to}!`);
                this.player.recordCaught(event.to);
                this.scene.events.emit('monster-evolved', { monster, from: event.from });
            }

            // Levelling and evolving deserve a beat to actually be seen
            const pause = event.kind === 'level-up' ? 1000
                : event.kind === 'evolved' ? 1900
                : 800;
            await this.wait(pause);
        }

        await this.presentSpoils(spoils);
    }

    // The fight used to close on the same frame the level-up text appeared,
    // so nobody ever saw it. Now the win ends on a results panel: it holds
    // by itself when something worth reading happened, and gets out of the
    // way after a beat when nothing did.
    async presentSpoils(spoils) {
        const events = this.scene.events;
        if (!events.listenerCount || !events.listenerCount('battle-spoils')) return;

        await new Promise(resolve => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                events.off('battle-continue', finish);
                resolve();
            };

            events.once('battle-continue', finish);
            events.emit('battle-spoils', spoils);
        });
    }

    endBattle(result) {
        if (!this.isBattleActive) return;

        this.isBattleActive = false;
        this.player.getAllMonsters().forEach(monster => monster.resetBattleState());

        const opponent = this.opponent;

        if (result === 'win' && this.isTrainerBattle && opponent.reward) {
            this.player.addCoins(opponent.reward);
            this.addToLog(`${opponent.title} handed over ${opponent.reward} coins!`);
        }

        this.scene.events.emit('battle-end', {
            result,
            player: this.player,
            opponent
        });

        this.opponent = null;
        this.player = null;
        this.turn = 'player';
    }

    addToLog(message) {
        this.battleLog.push(message);
        if (this.battleLog.length > 30) this.battleLog.shift();

        this.scene.events.emit('battle-log-update', { log: this.battleLog });
    }

    isActive() {
        return this.isBattleActive;
    }
}
