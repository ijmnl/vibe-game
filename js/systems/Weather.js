/**
 * Weather.
 *
 * Every route rolls its own weather when you walk into it and re-rolls now
 * and then while you are there. It is not decoration: rain and sun push the
 * damage of two whole types around, a sandstorm grinds down anything that is
 * not made of rock, and fog makes everyone miss. Checking the sky before a
 * hard fight is a real decision.
 */
const WEATHER = {
    clear: {
        id: 'clear', label: 'Clear', icon: '\u{1F324}',
        blurb: 'The sky is clear.'
    },
    rain: {
        id: 'rain', label: 'Rain', icon: '\u{1F327}',
        blurb: 'Rain is coming down hard.',
        boosts: { Water: 1.35, Fire: 0.65 },
        tint: 0x3a5a8a, strength: 0.22
    },
    sun: {
        id: 'sun', label: 'Blazing sun', icon: '\u{1F525}',
        blurb: 'The sun is blazing.',
        boosts: { Fire: 1.35, Water: 0.65 },
        tint: 0xffd08a, strength: 0.16
    },
    sandstorm: {
        id: 'sandstorm', label: 'Sandstorm', icon: '\u{1F32A}',
        blurb: 'A sandstorm is whipping up.',
        // Grinds down anything not made of rock, at the end of every turn
        chip: { percent: 0.06, safeTypes: ['Rock'] },
        tint: 0xd8b070, strength: 0.26
    },
    fog: {
        id: 'fog', label: 'Fog', icon: '\u{1F32B}',
        blurb: 'Thick fog hangs between the trees.',
        accuracyPenalty: 0.12,
        tint: 0xb8c4cc, strength: 0.3
    }
};

// How likely each zone is to roll each kind of weather. Towns stay clear -
// nobody wants a sandstorm over the shop.
const WEATHER_TABLE = {
    VILLAGE: { clear: 1 },
    GRASS:   { clear: 6, rain: 2, sun: 2, fog: 1 },
    FOREST:  { clear: 5, rain: 3, fog: 3 },
    WATER:   { clear: 4, rain: 5, fog: 2, sun: 1 },
    CAVE:    { clear: 8, fog: 2 },
    SAND:    { clear: 4, sun: 4, sandstorm: 4 }
};

function getWeather(id) {
    return WEATHER[id] || WEATHER.clear;
}

// Weighted pick for a zone. Night skews damp and murky, and never blazing sun.
function rollWeather(zone, isNight = false) {
    const table = { ...(WEATHER_TABLE[zone] || WEATHER_TABLE.GRASS) };

    if (isNight) {
        delete table.sun;
        if (table.fog) table.fog *= 2;
    }

    const entries = Object.entries(table);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;

    for (const [id, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return id;
    }

    return 'clear';
}

// Damage multiplier this weather applies to a move of the given type
function weatherDamageFactor(weatherId, moveType) {
    return getWeather(weatherId).boosts?.[moveType] ?? 1;
}

function weatherAccuracyPenalty(weatherId) {
    return getWeather(weatherId).accuracyPenalty || 0;
}

// End-of-turn chip damage, or 0 when this monster is unbothered by it
function weatherChipDamage(weatherId, monster) {
    const chip = getWeather(weatherId).chip;
    if (!chip || !monster) return 0;

    const types = monster.getTypes ? monster.getTypes() : [monster.type];
    if (types.some(type => chip.safeTypes.includes(type))) return 0;

    return Math.max(1, Math.floor(monster.maxHp * chip.percent));
}

// What the sky is doing in the running game, defaulting to clear when there
// is no game - see currentClock() in WorldClock.js.
function currentWeather() {
    return (typeof gameState !== 'undefined' && gameState.weather) || 'clear';
}
