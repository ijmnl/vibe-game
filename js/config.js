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
    MAX_MONSTERS_IN_TEAM: 3,
    BASE_EXP: 20,
    
    // Monster settings
    MONSTER_TYPES: ['Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Rock'],
    
    // Zones
    ZONES: {
        GRASS: { name: 'Grassland', color: 0x2e8b57, encounterRate: 0.02, monsters: ['Slime', 'Rat', 'Bird'] },
        FOREST: { name: 'Forest', color: 0x228b22, encounterRate: 0.03, monsters: ['Fox', 'Spider', 'Owl'] },
        WATER: { name: 'Lake', color: 0x1e90ff, encounterRate: 0.025, monsters: ['Fish', 'Crab', 'Turtle'] },
        CAVE: { name: 'Cave', color: 0x696969, encounterRate: 0.015, monsters: ['Bat', 'Snake', 'Golem'] },
        SAND: { name: 'Desert', color: 0xf4a460, encounterRate: 0.01, monsters: ['Scorpion', 'Vulture', 'Camel'] }
    },
    
    // Monster stats
    MONSTER_BASE_STATS: {
        'Slime': { hp: 30, attack: 8, defense: 5, speed: 10, exp: 15 },
        'Rat': { hp: 25, attack: 10, defense: 3, speed: 15, exp: 12 },
        'Bird': { hp: 20, attack: 12, defense: 2, speed: 20, exp: 14 },
        'Fox': { hp: 35, attack: 12, defense: 6, speed: 14, exp: 20 },
        'Spider': { hp: 28, attack: 14, defense: 4, speed: 12, exp: 18 },
        'Owl': { hp: 25, attack: 10, defense: 5, speed: 18, exp: 16 },
        'Fish': { hp: 30, attack: 8, defense: 8, speed: 10, exp: 15 },
        'Crab': { hp: 40, attack: 12, defense: 10, speed: 8, exp: 22 },
        'Turtle': { hp: 50, attack: 6, defense: 15, speed: 5, exp: 25 },
        'Bat': { hp: 20, attack: 14, defense: 2, speed: 25, exp: 14 },
        'Snake': { hp: 30, attack: 15, defense: 4, speed: 16, exp: 20 },
        'Golem': { hp: 60, attack: 10, defense: 20, speed: 3, exp: 30 },
        'Scorpion': { hp: 35, attack: 18, defense: 8, speed: 12, exp: 25 },
        'Vulture': { hp: 40, attack: 14, defense: 6, speed: 10, exp: 22 },
        'Camel': { hp: 55, attack: 8, defense: 12, speed: 6, exp: 28 }
    },
    
    // Items
    ITEMS: {
        'Potion': { type: 'heal', value: 20, description: 'Restores 20 HP' },
        'Super Potion': { type: 'heal', value: 50, description: 'Restores 50 HP' },
        'Monster Ball': { type: 'ball', catchRate: 0.5, description: 'Basic ball for catching monsters' },
        'Super Ball': { type: 'ball', catchRate: 0.7, description: 'Better ball for catching monsters' },
        'Ultra Ball': { type: 'ball', catchRate: 0.9, description: 'Best ball for catching monsters' }
    },
    
    // Starting items
    STARTING_ITEMS: [
        { name: 'Potion', quantity: 3 },
        { name: 'Monster Ball', quantity: 5 }
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

// Helper function to get monster stats
function getMonsterStats(monsterName) {
    return CONFIG.MONSTER_BASE_STATS[monsterName] || CONFIG.MONSTER_BASE_STATS['Slime'];
}

// Helper function to generate a random level for wild monsters
function getRandomWildLevel() {
    return Math.floor(Math.random() * 5) + 1; // Level 1-5
}
