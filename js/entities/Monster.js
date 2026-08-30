/**
 * Monster - data, stats and battle state.
 *
 * Owns no Phaser display objects: a monster outlives the scene it was created
 * in (a caught monster travels from BattleScene back to WorldScene), so each
 * scene draws its own visuals from `getSpriteKey()`.
 */
class Monster {
    constructor(name, level, isWild = false) {
        this.name = name;
        this.level = Math.max(1, level || 1);
        this.isWild = isWild;

        const species = getSpecies(name);
        this.type = species.type;
        this.legendary = !!species.legendary;

        this.recalculateStats();
        this.hp = this.maxHp;

        this.exp = 0;
        this.moves = getMovesForLevel(name, this.level);
        this.pp = {};
        this.refillPp();

        // Battle state, reset when a battle ends
        this.status = null;
        this.statusTurns = 0;
        this.stages = { attack: 0, defense: 0 };
    }

    get species() {
        return getSpecies(this.name);
    }

    get expToLevel() {
        return CONFIG.EXP_BASE + this.level * CONFIG.EXP_PER_LEVEL;
    }

    getSpriteKey() {
        return `monster-${this.name}`;
    }

    getColor() {
        return TYPE_COLORS[this.type] ?? 0xcccccc;
    }

    // Stats grow with level from the species base line
    recalculateStats() {
        const base = this.species.stats;

        this.maxHp = Math.floor(base.hp * (1 + this.level * 0.09)) + this.level * 2;
        this.attack = Math.floor(base.attack * (1 + this.level * 0.07));
        this.defense = Math.floor(base.defense * (1 + this.level * 0.06));
        this.speed = Math.floor(base.speed * (1 + this.level * 0.05));
    }

    // Attack/defense after any in-battle buffs or drops
    effectiveStat(which) {
        const stage = clamp(this.stages[which] || 0, -4, 4);
        const multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);

        return Math.max(1, Math.floor(this[which] * multiplier));
    }

    // Speed decides who moves first; paralysis halves it
    effectiveSpeed() {
        return Math.max(1, Math.floor(this.speed * (this.status === 'paralysis' ? 0.5 : 1)));
    }

    changeStage(which, amount) {
        const before = this.stages[which] || 0;
        this.stages[which] = clamp(before + amount, -4, 4);

        return this.stages[which] !== before;
    }

    // Wipe everything that should not persist outside a battle
    resetBattleState() {
        this.status = null;
        this.statusTurns = 0;
        this.stages = { attack: 0, defense: 0 };
    }

    takeDamage(amount) {
        const damage = Math.max(1, Math.floor(amount));
        this.hp = Math.max(0, this.hp - damage);

        return damage;
    }

    heal(amount) {
        const before = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + Math.floor(amount));

        return this.hp - before;
    }

    fullHeal() {
        this.hp = this.maxHp;
        this.refillPp();
        this.resetBattleState();
    }

    isAlive() {
        return this.hp > 0;
    }

    // Applies a status if the monster does not already have one
    applyStatus(status) {
        if (this.status || !STATUS_EFFECTS[status] || !this.isAlive()) {
            return false;
        }

        this.status = status;
        this.statusTurns = status === 'sleep' ? randomInt(1, 3) : 0;

        return true;
    }

    // Can this monster act this turn? Returns a reason when it cannot.
    checkStatusBeforeMove() {
        if (!this.status) return { canAct: true };

        const effect = STATUS_EFFECTS[this.status];

        if (this.status === 'sleep') {
            if (this.statusTurns <= 0 || Math.random() < effect.wakeChance) {
                this.status = null;
                return { canAct: true, message: `${this.name} woke up!` };
            }
            this.statusTurns--;
            return { canAct: false, message: `${this.name} is fast asleep.` };
        }

        if (effect.skipChance && Math.random() < effect.skipChance) {
            return { canAct: false, message: `${this.name} is paralysed and can't move!` };
        }

        return { canAct: true };
    }

    // Burn and poison chip away at the end of each turn
    applyEndOfTurnStatus() {
        const effect = this.status && STATUS_EFFECTS[this.status];
        if (!effect || !effect.damagePercent) return null;

        const damage = Math.max(1, Math.floor(this.maxHp * effect.damagePercent));
        this.hp = Math.max(0, this.hp - damage);

        const label = this.status === 'burn' ? 'burn' : 'poison';
        return `${this.name} is hurt by its ${label}! (-${damage})`;
    }

    // --- move uses ----------------------------------------------------------

    refillPp() {
        this.moves.forEach(name => {
            this.pp[name] = getMove(name).pp;
        });
    }

    getPp(name) {
        return this.pp[name] ?? getMove(name).pp;
    }

    hasPp(name) {
        return this.getPp(name) > 0;
    }

    spendPp(name) {
        if (this.pp[name] === undefined) this.pp[name] = getMove(name).pp;
        if (this.pp[name] > 0) this.pp[name]--;
    }

    restorePp(name, amount) {
        const max = getMove(name).pp;
        this.pp[name] = Math.min(max, (this.pp[name] ?? 0) + amount);
    }

    // Every move exhausted: fall back to Struggle rather than stalling
    isOutOfPp() {
        return this.moves.every(name => !this.hasPp(name));
    }

    getMoves() {
        return this.moves.map(getMove);
    }

    // Only the moves that can actually be used this turn
    getUsableMoves() {
        const usable = this.moves.filter(name => this.hasPp(name));

        return usable.length ? usable.map(getMove) : [getMove('Struggle')];
    }

    // The AI picks the move with the best expected damage, with some slack
    chooseMove(target) {
        const moves = this.getUsableMoves();

        const scored = moves.map(move => {
            if (!move.power) return { move, score: 12 };

            const multiplier = getTypeMultiplier(move.type, target.type);
            const stab = move.type === this.type ? 1.5 : 1;

            return { move, score: move.power * multiplier * stab * move.accuracy };
        });

        scored.sort((a, b) => b.score - a.score);

        // Mostly the best move, sometimes a random one so fights vary
        return Math.random() < 0.75
            ? scored[0].move
            : scored[randomInt(0, scored.length - 1)].move;
    }

    // Grant experience. Returns a list of things that happened.
    gainExp(amount) {
        const events = [];
        this.exp += amount;

        while (this.exp >= this.expToLevel && this.level < CONFIG.MAX_LEVEL) {
            this.exp -= this.expToLevel;
            this.level++;
            const hpBefore = this.maxHp;
            this.recalculateStats();
            this.hp += this.maxHp - hpBefore; // keep the HP gained from levelling
            events.push({ kind: 'level-up', level: this.level });

            const learned = getMoveLearnedAt(this.name, this.level);
            if (learned && !this.moves.includes(learned)) {
                this.moves.push(learned);
                this.pp[learned] = getMove(learned).pp;
                const forgotten = this.moves.length > 4 ? this.moves.shift() : null;
                if (forgotten) delete this.pp[forgotten];
                events.push({ kind: 'move-learned', move: learned, forgotten });
            }

            const species = this.species;
            if (species.evolvesTo && this.level >= species.evolvesAt) {
                const from = this.name;
                this.evolveInto(species.evolvesTo);
                events.push({ kind: 'evolved', from, to: this.name });
            }
        }

        return events;
    }

    evolveInto(name) {
        // Evolution can bring new moves; they arrive with full PP below
        const hpRatio = this.hp / this.maxHp;

        this.name = name;
        this.type = getSpecies(name).type;
        this.recalculateStats();
        this.hp = Math.max(1, Math.round(this.maxHp * hpRatio));

        // Pick up anything the new form should already know
        const learnset = getMovesForLevel(name, this.level);
        this.moves = [...new Set([...this.moves, ...learnset])].slice(-4);

        this.moves.forEach(move => {
            if (this.pp[move] === undefined) this.pp[move] = getMove(move).pp;
        });
    }

    getSaveData() {
        return {
            name: this.name,
            level: this.level,
            hp: this.hp,
            exp: this.exp,
            moves: this.moves,
            pp: this.pp
        };
    }

    static fromData(data) {
        const monster = new Monster(data.name, data.level);

        monster.hp = Math.min(data.hp ?? monster.maxHp, monster.maxHp);
        monster.exp = data.exp ?? 0;
        if (Array.isArray(data.moves) && data.moves.length) {
            monster.moves = data.moves.slice(-4);
            monster.refillPp();
        }

        // Saves from before PP existed simply start full
        if (data.pp) {
            monster.moves.forEach(move => {
                if (typeof data.pp[move] === 'number') monster.pp[move] = data.pp[move];
            });
        }

        return monster;
    }
}

// Wild monster for a zone, at a level that scales with distance from home
function createWildMonster(zoneType, level) {
    const name = getRandomMonsterForZone(zoneType);

    return new Monster(name, level, true);
}
