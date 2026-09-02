/**
 * Type effectiveness.
 *
 * Every species has one fixed type (see Species.js), so a player can actually
 * learn the matchups instead of guessing - previously a monster's type was
 * randomised per instance, which made type damage meaningless.
 */
const TYPES = ['Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Rock'];

const TYPE_COLORS = {
    Normal:   0xb8b8a8,
    Fire:     0xf0603c,
    Water:    0x4a90e2,
    Grass:    0x5cc45c,
    Electric: 0xf6d02c,
    Rock:     0xb0a06a
};

// TYPE_CHART[attacking][defending] = damage multiplier
const TYPE_CHART = {
    // Normal is deliberately neutral against everything: with only six types,
    // every monster leans on its Normal move as the reliable fallback, and
    // resisting it left some pairings unable to hurt each other at all.
    Normal:   { Normal: 1,   Fire: 1,   Water: 1,   Grass: 1,   Electric: 1,   Rock: 1   },
    Fire:     { Normal: 1,   Fire: 0.6, Water: 0.6, Grass: 2,   Electric: 1,   Rock: 0.6 },
    Water:    { Normal: 1,   Fire: 2,   Water: 0.6, Grass: 0.6, Electric: 1,   Rock: 2   },
    Grass:    { Normal: 1,   Fire: 0.6, Water: 2,   Grass: 0.6, Electric: 1,   Rock: 2   },
    Electric: { Normal: 1,   Fire: 1,   Water: 2,   Grass: 0.6, Electric: 0.6, Rock: 0.6 },
    Rock:     { Normal: 1,   Fire: 2,   Water: 1,   Grass: 1,   Electric: 2,   Rock: 1   }
};

function getTypeMultiplier(attackType, defenderType) {
    return TYPE_CHART[attackType]?.[defenderType] ?? 1;
}

// Wording shown in the battle log for a multiplier
function describeEffectiveness(multiplier) {
    if (multiplier >= 2) return "It's super effective!";
    if (multiplier < 1) return "It's not very effective...";
    return null;
}

// Effectiveness against a monster that may have more than one type. A fused
// monster carries two, and the multipliers stack: Water into a Fire/Rock
// hybrid is 2x twice over.
function getEffectivenessAgainst(attackType, defenderTypes) {
    const types = Array.isArray(defenderTypes) ? defenderTypes : [defenderTypes];

    return types.reduce((total, type) => total * getTypeMultiplier(attackType, type), 1);
}

// Wording for a stacked multiplier, which can now reach 4x or drop to 0.36x
function describeStackedEffectiveness(multiplier) {
    if (multiplier >= 3.5) return "It's devastating!";
    if (multiplier >= 2) return "It's super effective!";
    if (multiplier <= 0.4) return "It barely scratches it...";
    if (multiplier < 1) return "It's not very effective...";
    return null;
}
