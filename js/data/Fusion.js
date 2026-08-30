/**
 * Fusion.
 *
 * The shrine warden will take two monsters off your hands and hand back one
 * that is both of them: a blended name, the first one's type plus the
 * second's, a base line drawn from each, and the best moves either of them
 * knew. It is the reason to keep catching things you already have - and it
 * is the one thing in this region that cannot be undone.
 */
const FUSION = {
    // What the shrine charges. Steep on purpose: a fusion is a commitment.
    COST: 250,

    // A fused monster is stronger than either parent, but not by so much
    // that it makes the rest of the team pointless.
    STAT_BONUS: 1.12
};

// "Slime" + "Bird" -> "Slird". Take the head of one and the tail of the other,
// and tidy up the seam so it stays pronounceable.
function fusedName(nameA, nameB) {
    const head = nameA.slice(0, Math.max(2, Math.ceil(nameA.length / 2)));
    const tail = nameB.slice(Math.floor(nameB.length / 2));

    const vowels = 'aeiouAEIOU';
    // Two vowels or two of the same letter meeting at the seam read badly
    const seamDoubled = vowels.includes(head.at(-1)) && vowels.includes(tail[0]);
    const trimmed = seamDoubled || head.at(-1).toLowerCase() === tail[0].toLowerCase()
        ? tail.slice(1)
        : tail;

    const blended = head + (trimmed || tail);

    return blended.charAt(0).toUpperCase() + blended.slice(1).toLowerCase();
}

// Both must be real monsters, and neither can already be a fusion: fusing
// fusions compounds the stat bonus and runs away with itself.
function canFuse(a, b) {
    if (!a || !b || a === b) return { ok: false, reason: 'Pick two different monsters.' };
    if (a.isFused || b.isFused) return { ok: false, reason: 'A fused monster cannot be fused again.' };
    if (a.legendary || b.legendary) return { ok: false, reason: 'A legendary refuses the shrine.' };

    return { ok: true };
}

// Build the fused monster. The first argument leads: it gives the primary
// type, and its half of the name comes first.
function fuseMonsters(a, b) {
    const check = canFuse(a, b);
    if (!check.ok) return null;

    const name = fusedName(a.name, b.name);
    const level = Math.max(a.level, b.level);

    const fused = new Monster(name, level);

    fused.fusion = { parents: [a.name, b.name] };
    fused.type = a.type;
    fused.secondType = b.type === a.type ? null : b.type;
    fused.legendary = false;

    // Average the two base lines, then a modest bonus on top
    const baseA = a.baseStats;
    const baseB = b.baseStats;
    fused.baseStats = {};
    ['hp', 'attack', 'defense', 'speed'].forEach(stat => {
        fused.baseStats[stat] = Math.round((baseA[stat] + baseB[stat]) / 2 * FUSION.STAT_BONUS);
    });

    fused.recalculateStats();
    fused.hp = fused.maxHp;

    // Two moves from each parent, strongest first, and never more than four
    fused.moves = pickFusedMoves(a, b);
    fused.pp = {};
    fused.refillPp();

    // The new monster remembers how close both parents were
    fused.bond = Math.round((a.bond + b.bond) / 2);
    fused.exp = 0;

    return fused;
}

// Take the best two damaging moves from each side, then fill any spare slot
// with whatever else they knew.
function pickFusedMoves(a, b) {
    const strongest = monster => [...monster.moves]
        .sort((x, y) => (getMove(y).power || 0) - (getMove(x).power || 0));

    const fromA = strongest(a);
    const fromB = strongest(b);

    const picked = [...new Set([
        ...fromA.slice(0, 2),
        ...fromB.slice(0, 2),
        ...fromA,
        ...fromB
    ])].slice(0, 4);

    return picked.length ? picked : ['Tackle'];
}
