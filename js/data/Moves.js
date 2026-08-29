/**
 * Move definitions.
 *
 * power 0 means the move does no direct damage - it heals, buffs, or inflicts
 * a status instead. `effect` is read by BattleSystem.
 */
const MOVES = {
    // --- Normal ---
    'Tackle':      { type: 'Normal',   power: 40, accuracy: 1.0 },
    'Scratch':     { type: 'Normal',   power: 40, accuracy: 1.0 },
    'Quick Jab':   { type: 'Normal',   power: 30, accuracy: 1.0, priority: 1 },
    'Body Slam':   { type: 'Normal',   power: 70, accuracy: 0.9 },
    'Screech':     { type: 'Normal',   power: 0,  accuracy: 0.9, effect: { kind: 'lower-defense', stages: 1 } },
    'Growl':       { type: 'Normal',   power: 0,  accuracy: 1.0, effect: { kind: 'lower-attack', stages: 1 } },
    'Rest':        { type: 'Normal',   power: 0,  accuracy: 1.0, effect: { kind: 'heal', percent: 0.35 } },
    'Focus':       { type: 'Normal',   power: 0,  accuracy: 1.0, effect: { kind: 'raise-attack', stages: 1 } },
    'Harden':      { type: 'Normal',   power: 0,  accuracy: 1.0, effect: { kind: 'raise-defense', stages: 1 } },

    // --- Fire ---
    'Ember':       { type: 'Fire',     power: 40, accuracy: 1.0, effect: { kind: 'status', status: 'burn', chance: 0.1 } },
    'Flame Burst': { type: 'Fire',     power: 65, accuracy: 0.95 },
    'Inferno':     { type: 'Fire',     power: 90, accuracy: 0.8,  effect: { kind: 'status', status: 'burn', chance: 0.3 } },

    // --- Water ---
    'Bubble':      { type: 'Water',    power: 40, accuracy: 1.0 },
    'Water Jet':   { type: 'Water',    power: 65, accuracy: 0.95 },
    'Tidal Wave':  { type: 'Water',    power: 90, accuracy: 0.8 },

    // --- Grass ---
    'Vine Whip':   { type: 'Grass',    power: 45, accuracy: 1.0 },
    'Leaf Blade':  { type: 'Grass',    power: 70, accuracy: 0.95 },
    'Spore':       { type: 'Grass',    power: 0,  accuracy: 0.75, effect: { kind: 'status', status: 'sleep', chance: 1 } },
    'Drain Leaf':  { type: 'Grass',    power: 50, accuracy: 1.0,  effect: { kind: 'drain', percent: 0.5 } },

    // --- Electric ---
    'Spark':       { type: 'Electric', power: 45, accuracy: 1.0, effect: { kind: 'status', status: 'paralysis', chance: 0.15 } },
    'Shock Bolt':  { type: 'Electric', power: 70, accuracy: 0.95 },
    'Thunder':     { type: 'Electric', power: 95, accuracy: 0.75, effect: { kind: 'status', status: 'paralysis', chance: 0.3 } },

    // --- Rock ---
    'Pebble':      { type: 'Rock',     power: 40, accuracy: 1.0 },
    'Rock Throw':  { type: 'Rock',     power: 65, accuracy: 0.9 },
    'Boulder':     { type: 'Rock',     power: 95, accuracy: 0.75 },

    // --- Poison-ish, kept in the Grass/Normal space ---
    'Venom Bite':  { type: 'Grass',    power: 55, accuracy: 0.95, effect: { kind: 'status', status: 'poison', chance: 0.3 } },
    'Sting':       { type: 'Grass',    power: 35, accuracy: 1.0,  effect: { kind: 'status', status: 'poison', chance: 0.2 } }
};

function getMove(name) {
    return MOVES[name] ? { name, ...MOVES[name] } : { name: 'Tackle', ...MOVES['Tackle'] };
}

// Status effects applied at the end of a turn
const STATUS_EFFECTS = {
    burn:      { label: 'BRN', damagePercent: 0.06, color: '#f0603c' },
    poison:    { label: 'PSN', damagePercent: 0.08, color: '#a05cc4' },
    paralysis: { label: 'PAR', skipChance: 0.25,    color: '#f6d02c' },
    sleep:     { label: 'SLP', skipChance: 1,       color: '#7a8ba0', wakeChance: 0.34 }
};
