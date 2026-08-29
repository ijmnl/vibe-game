// Game Configuration
const CONFIG = {
    // Game dimensions
    GAME_WIDTH: 800,
    GAME_HEIGHT: 600,
    TILE_SIZE: 32,
    
    // World settings
    WORLD_WIDTH: 100,
    WORLD_HEIGHT: 100,
    ZONE_SIZE: 20, // Size of each zone in tiles
    
    // Player settings
    PLAYER_SPEED: 200,
    PLAYER_START_X: 50,
    PLAYER_START_Y: 50,
    
    // Encounter settings
    ENCOUNTER_RATE: 0.02, // 2% chance per frame in tall grass/water
    ENCOUNTER_COOLDOWN: 1000, // 1 second cooldown between encounters
    ENCOUNTER_RATE_SCALE: 15, // Converts a zone's per-step rate into a per-second chance
    
    // Battle settings
    MAX_MONSTERS_IN_TEAM: 6,
    // Divisor in the damage formula - lower hits harder. Tuned so a neutral
    // hit costs about a fifth of a health bar, which leaves room for type
    // advantage and crits to matter without one-shotting anything.
    DAMAGE_SCALE: 26,
    CRIT_CHANCE: 0.0625,
    CRIT_MULTIPLIER: 1.4,
    STAB_MULTIPLIER: 1.3,

    // Levelling
    MAX_LEVEL: 50,
    EXP_BASE: 20,
    EXP_PER_LEVEL: 9,

    // Wild levels scale with distance from the starting village, so heading
    // outwards is what makes the world get harder.
    WILD_LEVEL_MIN: 2,
    // Levels ramp gently near home and steepen further out, so the starting
    // area stays fair while the map edges are a real challenge.
    WILD_LEVEL_CURVE: 1.35,
    WILD_LEVEL_DIVISOR: 8,

    // Economy
    STARTING_COINS: 50,
    COINS_PER_WIN_BASE: 8,
    COINS_PER_WIN_PER_LEVEL: 3,
    
    
    // Zones
    ZONES: {
        GRASS: { name: 'Grassland', color: 0x2e8b57, encounterRate: 0.02, monsters: ['Slime', 'Rat', 'Bird'] },
        FOREST: { name: 'Forest', color: 0x228b22, encounterRate: 0.03, monsters: ['Fox', 'Spider', 'Owl', 'Snake'] },
        WATER: { name: 'Lake', color: 0x1e90ff, encounterRate: 0.025, monsters: ['Fish', 'Crab', 'Turtle'] },
        CAVE: { name: 'Cave', color: 0x696969, encounterRate: 0.015, monsters: ['Bat', 'Snake', 'Golem'] },
        SAND: { name: 'Desert', color: 0xf4a460, encounterRate: 0.01, monsters: ['Scorpion', 'Vulture', 'Camel'] },
        // Villages are safe: no encounterRate means EncounterSystem skips them
        VILLAGE: { name: 'Village', color: 0xc9b79a, encounterRate: 0, monsters: [] }
    },
    
    
    // Items. `price` of 0 means it cannot be bought.
    ITEMS: {
        'Potion':       { type: 'heal', value: 25,  price: 20,  description: 'Restores 25 HP' },
        'Super Potion': { type: 'heal', value: 60,  price: 55,  description: 'Restores 60 HP' },
        'Full Potion':  { type: 'heal', value: 999, price: 140, description: 'Fully restores HP' },
        'Antidote':     { type: 'cure', price: 25,  description: 'Clears any status' },
        'Monster Ball': { type: 'ball', catchRate: 1.0, price: 25,  description: 'Basic catching ball' },
        'Super Ball':   { type: 'ball', catchRate: 1.5, price: 60,  description: 'Catches more reliably' },
        'Ultra Ball':   { type: 'ball', catchRate: 2.2, price: 130, description: 'The best ball there is' }
    },
    
    // Starting items
    STARTING_ITEMS: [
        { name: 'Potion', quantity: 4 },
        { name: 'Monster Ball', quantity: 8 }
    ],
    
    // Colors
    COLORS: {
        grass: 0x2e8b57,
        forest: 0x228b22,
        water: 0x1e90ff,
        cave: 0x696969,
        sand: 0xf4a460,
        path: 0x8b4513,
        player: 0xff0000,
        monster: 0x00ff00,
        ui: { primary: 0xffcc00, secondary: 0x4a4a6a, background: 0x1a1a2e }
    }
};

// Helper function to get random monster for zone
function getRandomMonsterForZone(zoneType) {
    const zone = CONFIG.ZONES[zoneType];
    if (!zone) return null;
    
    const monsters = zone.monsters;
    const randomIndex = Math.floor(Math.random() * monsters.length);
    return monsters[randomIndex];
}

// Wild level for a spot, scaling with how far it is from the starting village
function getWildLevelAt(tileX, tileY) {
    const homeX = Math.floor(CONFIG.WORLD_WIDTH / 2);
    const homeY = Math.floor(CONFIG.WORLD_HEIGHT / 2);
    const distance = Math.hypot(tileX - homeX, tileY - homeY);

    const base = CONFIG.WILD_LEVEL_MIN
        + Math.pow(distance / CONFIG.WILD_LEVEL_DIVISOR, CONFIG.WILD_LEVEL_CURVE);

    // Spread widens with distance so the starting area is predictable
    const spread = 1 + Math.floor(distance / 25);
    const roll = randomInt(-spread, spread);

    return clamp(Math.round(base + roll), 2, CONFIG.MAX_LEVEL);
}
