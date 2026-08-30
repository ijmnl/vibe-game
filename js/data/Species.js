/**
 * Species table.
 *
 * Each entry fixes the type (so matchups are learnable), the base stats, the
 * moves it learns and when, and what it evolves into. `dex` is the Monsterdex
 * number - the collection is the game's long-term goal.
 *
 * A few carry a second type in `type2`. It cuts both ways and it stacks: a
 * Fire/Rock beast shrugs off Fire almost entirely and takes four times damage
 * from Water. Kept to three species so the pattern stays learnable.
 */
const SPECIES = {
    // --- Grassland ---
    'Slime':    { dex: 1,  type: 'Water',    stats: { hp: 45, attack: 12, defense: 12, speed: 10 }, exp: 15,
                  moves: [[1, 'Bubble'], [1, 'Tackle'], [8, 'Harden'], [12, 'Water Jet'], [20, 'Rest']],
                  evolvesTo: 'Oozer', evolvesAt: 16 },
    'Oozer':    { dex: 2,  type: 'Water',    stats: { hp: 70, attack: 20, defense: 22, speed: 14 }, exp: 45,
                  moves: [[1, 'Water Jet'], [1, 'Harden'], [20, 'Body Slam'], [28, 'Tidal Wave'], [34, 'Rest']] },

    'Rat':      { dex: 3,  type: 'Normal',   stats: { hp: 38, attack: 16, defense: 8,  speed: 18 }, exp: 12,
                  moves: [[1, 'Scratch'], [1, 'Quick Jab'], [9, 'Growl'], [11, 'Body Slam'], [18, 'Venom Bite']],
                  evolvesTo: 'Rattler', evolvesAt: 15 },
    'Rattler':  { dex: 4,  type: 'Normal',   stats: { hp: 60, attack: 28, defense: 16, speed: 30 }, exp: 42,
                  moves: [[1, 'Quick Jab'], [1, 'Body Slam'], [19, 'Venom Bite'], [26, 'Screech'], [32, 'Focus']] },

    'Bird':     { dex: 5,  type: 'Electric', stats: { hp: 34, attack: 18, defense: 7,  speed: 24 }, exp: 14,
                  moves: [[1, 'Quick Jab'], [1, 'Spark'], [10, 'Growl'], [16, 'Shock Bolt'], [24, 'Body Slam']],
                  evolvesTo: 'Stormwing', evolvesAt: 18 },
    'Stormwing':{ dex: 6,  type: 'Electric', stats: { hp: 58, attack: 32, defense: 16, speed: 40 }, exp: 52,
                  moves: [[1, 'Shock Bolt'], [1, 'Quick Jab'], [22, 'Thunder'], [30, 'Body Slam'], [36, 'Focus']] },

    // --- Forest ---
    'Fox':      { dex: 7,  type: 'Fire',     stats: { hp: 42, attack: 19, defense: 13, speed: 20 }, exp: 20,
                  moves: [[1, 'Scratch'], [1, 'Ember'], [12, 'Growl'], [18, 'Flame Burst'], [26, 'Focus']],
                  evolvesTo: 'Pyrefox', evolvesAt: 20 },
    'Pyrefox':  { dex: 8,  type: 'Fire',     stats: { hp: 66, attack: 34, defense: 22, speed: 32 }, exp: 58,
                  moves: [[1, 'Flame Burst'], [1, 'Focus'], [24, 'Body Slam'], [32, 'Inferno'], [38, 'Screech']] },

    'Spider':   { dex: 9,  type: 'Grass',    stats: { hp: 40, attack: 20, defense: 11, speed: 16 }, exp: 18,
                  moves: [[1, 'Sting'], [1, 'Scratch'], [11, 'Spore'], [17, 'Venom Bite'], [25, 'Drain Leaf']] },
    'Owl':      { dex: 10, type: 'Grass',    stats: { hp: 38, attack: 15, defense: 14, speed: 22 }, exp: 16,
                  moves: [[1, 'Vine Whip'], [1, 'Quick Jab'], [13, 'Spore'], [19, 'Leaf Blade'], [27, 'Rest']] },

    // --- Water ---
    'Fish':     { dex: 11, type: 'Water',    stats: { hp: 44, attack: 14, defense: 16, speed: 14 }, exp: 15,
                  moves: [[1, 'Bubble'], [1, 'Tackle'], [12, 'Harden'], [18, 'Water Jet'], [26, 'Tidal Wave']] },
    'Crab':     { dex: 12, type: 'Water',    type2: 'Rock', stats: { hp: 52, attack: 20, defense: 21, speed: 9  }, exp: 22,
                  moves: [[1, 'Bubble'], [1, 'Harden'], [14, 'Rock Throw'], [20, 'Water Jet'], [28, 'Screech']] },
    'Turtle':   { dex: 13, type: 'Water',    stats: { hp: 58, attack: 14, defense: 25, speed: 6  }, exp: 25,
                  moves: [[1, 'Tackle'], [1, 'Harden'], [15, 'Bubble'], [20, 'Rest'], [26, 'Water Jet'], [34, 'Body Slam']] },

    // --- Cave ---
    'Bat':      { dex: 14, type: 'Electric', stats: { hp: 34, attack: 20, defense: 8,  speed: 28 }, exp: 14,
                  moves: [[1, 'Spark'], [1, 'Screech'], [13, 'Drain Leaf'], [19, 'Shock Bolt'], [27, 'Quick Jab']] },
    'Snake':    { dex: 15, type: 'Grass',    stats: { hp: 42, attack: 24, defense: 12, speed: 22 }, exp: 20,
                  moves: [[1, 'Sting'], [1, 'Scratch'], [12, 'Venom Bite'], [20, 'Spore'], [28, 'Leaf Blade']] },
    'Golem':    { dex: 16, type: 'Rock',     stats: { hp: 66, attack: 24, defense: 28, speed: 5  }, exp: 30,
                  moves: [[1, 'Pebble'], [1, 'Harden'], [16, 'Rock Throw'], [24, 'Body Slam'], [32, 'Boulder']] },

    // --- Desert ---
    'Scorpion': { dex: 17, type: 'Rock',     stats: { hp: 46, attack: 28, defense: 18, speed: 20 }, exp: 25,
                  moves: [[1, 'Sting'], [1, 'Pebble'], [14, 'Venom Bite'], [22, 'Rock Throw'], [30, 'Boulder']] },
    'Vulture':  { dex: 18, type: 'Fire',     stats: { hp: 50, attack: 24, defense: 15, speed: 24 }, exp: 22,
                  moves: [[1, 'Ember'], [1, 'Quick Jab'], [15, 'Screech'], [21, 'Flame Burst'], [29, 'Inferno']] },
    'Camel':    { dex: 19, type: 'Fire',     type2: 'Rock', stats: { hp: 66, attack: 20, defense: 24, speed: 10 }, exp: 28,
                  moves: [[1, 'Ember'], [1, 'Tackle'], [16, 'Harden'], [22, 'Flame Burst'], [30, 'Body Slam']] },

    // --- Only out after dark ---
    // Night is worth walking into: these four never appear in daylight, so a
    // full Monsterdex means coming back to a route you already cleared.
    //
    // Moth and Dusker share Route 1's night roster, so their base lines sit
    // beside Bird and Rat rather than above them - a first-time player who
    // wanders into the grass after dark should find it harder, not hopeless.
    // Emberfly is the tougher one, and never appears anywhere that early.
    'Moth':     { dex: 20, type: 'Grass',    stats: { hp: 37, attack: 16, defense: 11, speed: 24 }, exp: 18,
                  nocturnal: true,
                  moves: [[1, 'Sting'], [1, 'Quick Jab'], [12, 'Spore'], [18, 'Drain Leaf'], [26, 'Leaf Blade']] },
    'Emberfly': { dex: 21, type: 'Fire',     stats: { hp: 36, attack: 22, defense: 10, speed: 30 }, exp: 22,
                  nocturnal: true,
                  moves: [[1, 'Ember'], [1, 'Tackle'], [14, 'Screech'], [20, 'Flame Burst'], [28, 'Inferno']],
                  evolvesTo: 'Lampwing', evolvesAt: 24 },
    'Lampwing': { dex: 22, type: 'Fire',     stats: { hp: 62, attack: 36, defense: 20, speed: 40 }, exp: 60,
                  nocturnal: true,
                  moves: [[1, 'Flame Burst'], [1, 'Body Slam'], [28, 'Inferno'], [34, 'Focus'], [40, 'Screech']] },
    'Dusker':   { dex: 23, type: 'Normal',   stats: { hp: 45, attack: 19, defense: 13, speed: 20 }, exp: 22,
                  nocturnal: true,
                  moves: [[1, 'Scratch'], [1, 'Screech'], [15, 'Venom Bite'], [21, 'Body Slam'], [29, 'Focus']] },

    // --- The one legendary, guarded deep in a cave ---
    'Volcanor': { dex: 24, type: 'Fire',     type2: 'Rock', stats: { hp: 90, attack: 40, defense: 34, speed: 30 }, exp: 200,
                  legendary: true,
                  moves: [[1, 'Inferno'], [1, 'Boulder'], [1, 'Focus'], [1, 'Body Slam']] }
};

const DEX_ORDER = Object.keys(SPECIES).sort((a, b) => SPECIES[a].dex - SPECIES[b].dex);
const DEX_TOTAL = DEX_ORDER.length;

// Species that only appear once the sun is down
const NOCTURNAL = DEX_ORDER.filter(name => SPECIES[name].nocturnal);

function isNocturnal(name) {
    return !!SPECIES[name]?.nocturnal;
}

function getSpecies(name) {
    return SPECIES[name] || SPECIES['Slime'];
}

// Every move the species knows by the given level, capped at the last four
function getMovesForLevel(name, level) {
    const learned = getSpecies(name).moves
        .filter(([atLevel]) => atLevel <= level)
        .map(([, moveName]) => moveName);

    // Keep it unique and remember only the four most recent
    return [...new Set(learned)].slice(-4);
}

// The move a species would learn exactly at this level, if any
function getMoveLearnedAt(name, level) {
    const entry = getSpecies(name).moves.find(([atLevel]) => atLevel === level);
    return entry ? entry[1] : null;
}
