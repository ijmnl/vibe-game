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
    // Hold a direction and you speed up, so crossing a route is not a slog
    RUN_AFTER_MS: 350,
    RUN_MULTIPLIER: 1.75,
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
    // Early levels come quickly so a fresh team keeps pace with Route 1,
    // then the curve stretches out.
    EXP_BASE: 14,
    EXP_PER_LEVEL: 8,

    // Economy
    STARTING_COINS: 120,
    COINS_PER_WIN_BASE: 8,
    COINS_PER_WIN_PER_LEVEL: 3,
    
    
    // Zones
    ZONES: {
        GRASS: { name: 'Grassland', color: 0x2e8b57, encounterRate: 0.02, monsters: ['Slime', 'Rat', 'Bird'] },
        FOREST: { name: 'Forest', color: 0x228b22, encounterRate: 0.03, monsters: ['Fox', 'Spider', 'Owl', 'Bird'] },
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
    // Towns have an empty roster; fall back rather than build a nameless
    // monster out of `undefined` if something ever asks for one.
    const monsters = CONFIG.ZONES[zoneType]?.monsters?.length
        ? CONFIG.ZONES[zoneType].monsters
        : CONFIG.ZONES.GRASS.monsters;

    return randomFrom(monsters);
}


