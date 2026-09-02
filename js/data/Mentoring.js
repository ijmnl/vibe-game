/**
 * Mentoring.
 *
 * At Willow Rest an old keeper will let one of your monsters spend a while
 * with an older, stronger one. The younger comes away knowing something the
 * elder knew, and further along than it was. Nothing is spent and nothing is
 * lost: the elder still walks out with you, and the pair are closer for it.
 *
 * It is also the only way to choose which move a monster forgets - everywhere
 * else the oldest is simply pushed off the end of the list.
 */
const MENTORING = {
    // What the keeper asks for board and lodging while the two of them work
    COST: 150,

    // The elder has to be meaningfully further along, or there is nothing
    // worth passing down
    MIN_LEVEL_GAP: 3,

    // The younger closes this fraction of the gap between them
    CATCH_UP: 1 / 3,

    // What the pair gain from the time together
    STUDENT_BOND: 10,
    TEACHER_BOND: 6
};

// Moves the elder knows that the younger one does not
function teachableMoves(teacher, student) {
    if (!teacher || !student) return [];

    return teacher.moves.filter(name => !student.moves.includes(name));
}

function canMentor(teacher, student) {
    if (!teacher || !student || teacher === student) {
        return { ok: false, reason: 'Pick two different monsters.' };
    }
    if (teacher.level < student.level + MENTORING.MIN_LEVEL_GAP) {
        return {
            ok: false,
            reason: `The elder needs to be at least ${MENTORING.MIN_LEVEL_GAP} levels ahead.`
        };
    }
    if (!teachableMoves(teacher, student).length) {
        return { ok: false, reason: `${student.name} already knows everything ${teacher.name} could show it.` };
    }

    return { ok: true };
}

// How far the younger one comes along. Always at least one level, so the
// time is never wasted.
function mentoringLevelGain(teacher, student) {
    const gap = teacher.level - student.level;

    return Math.max(1, Math.floor(gap * MENTORING.CATCH_UP));
}

/**
 * Carry it out. `forgetting` names the move to drop, and is only needed when
 * the student already knows four - the caller asks the player which one.
 *
 * Returns what happened, so the UI can say it plainly.
 */
function mentor(teacher, student, moveName, forgetting = null) {
    if (!canMentor(teacher, student).ok) return null;
    if (!teachableMoves(teacher, student).includes(moveName)) return null;
    if (student.moves.length >= 4 && !student.moves.includes(forgetting)) return null;

    const before = student.level;
    const levels = mentoringLevelGain(teacher, student);

    // Levelling comes first. Granting experience rather than setting the level
    // means the student picks up its own learnset on the way and evolves if it
    // is ready - and doing it before the lesson stops a move it learns on the
    // way from pushing the taught one straight back off the end of the list.
    const events = student.gainExp(expForLevels(student, levels));

    const result = {
        learned: null,
        forgot: null,
        levelsGained: student.level - before,
        events
    };

    if (!student.moves.includes(moveName)) {
        if (student.moves.length >= 4) {
            // The player's choice if it is still there, otherwise the oldest
            const dropping = student.moves.includes(forgetting) ? forgetting : student.moves[0];
            student.moves.splice(student.moves.indexOf(dropping), 1);
            delete student.pp[dropping];
            result.forgot = dropping;
        }

        student.moves.push(moveName);
        student.pp[moveName] = getMove(moveName).pp;
        result.learned = moveName;
    }

    student.addBond(MENTORING.STUDENT_BOND);
    teacher.addBond(MENTORING.TEACHER_BOND);

    return result;
}

// Exactly enough experience to gain this many levels, counting the cost of
// each one as it rises and whatever progress is already banked
function expForLevels(monster, levels) {
    let needed = -monster.exp;
    let level = monster.level;

    for (let i = 0; i < levels; i++) {
        needed += CONFIG.EXP_BASE + level * CONFIG.EXP_PER_LEVEL;
        level++;
    }

    return Math.max(1, needed);
}
