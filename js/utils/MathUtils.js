/**
 * Small numeric helpers.
 *
 * Game rules (species, levelling, damage, world generation) use these rather
 * than Phaser.Math so the logic stays independent of the rendering library -
 * that keeps it testable outside a running game.
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Inclusive integer in [min, max]
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function randomFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
}
