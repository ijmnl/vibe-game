/**
 * Things that happen out on a route that are not a battle.
 *
 * Walking through tall grass usually turns up a monster. Every so often it
 * turns up something else instead: a pedlar who has set up on the path, a
 * chest that may or may not be a chest, a campfire someone left burning. The
 * point is that the grass stops being a slot machine with one symbol on it.
 *
 * Conditions live here and are pure, so they can be checked without a running
 * game; what each event actually does lives with the scene that owns the world.
 */
const ROUTE_EVENTS = [
    {
        id: 'pedlar',
        weight: 3,
        speaker: 'Pedlar',
        lines: ['Well met! Long way from any shop out here, is it not?',
                'I carry what the towns run out of. Have a look.'],
        // Only worth stopping for if you can actually buy something
        when: (ctx) => ctx.coins >= 40
    },
    {
        id: 'chest',
        weight: 4,
        speaker: null,
        lines: ['A small chest sits half-buried in the undergrowth.'],
        choice: { yes: 'Open it', no: 'Leave it be' }
    },
    {
        id: 'coins',
        weight: 3,
        speaker: null,
        lines: ['Something glints in the dirt.']
    },
    {
        id: 'stray',
        weight: 2,
        speaker: null,
        lines: ['A monster steps out of the grass and does not attack.',
                'It looks at you, then at the road ahead.'],
        choice: { yes: 'Take it with you', no: 'Walk on' },
        // Nowhere to put it if the team is already full
        when: (ctx) => ctx.teamSize < CONFIG.MAX_MONSTERS_IN_TEAM
    },
    {
        id: 'campfire',
        weight: 2,
        speaker: null,
        lines: ['A campfire is still burning, with nobody around it.',
                'You sit for a while. Your team catches its breath.']
    },
    {
        id: 'falling-star',
        weight: 3,
        speaker: null,
        lines: ['A star drops across the sky and goes out behind the hills.',
                'You stand still a moment, looking at the ones that stayed put.',
                'Your team stands a little taller for having stopped.'],
        // The night has to be worth walking into
        when: (ctx) => ctx.isNight
    },
    {
        id: 'traveller',
        weight: 3,
        speaker: null,
        lines: ['Someone is sitting against a rock at the side of the path, badly hurt.',
                'Two people have gone by already. You watched the second one speed up.'],
        // Helping costs real money, so it has to be money you have
        choice: { yes: 'Stop and help', no: 'Keep walking' },
        when: (ctx) => ctx.coins >= 60
    },
    {
        id: 'sheltered',
        weight: 2,
        speaker: 'Traveller',
        lines: ['Wait out the worst of it with me, would you?',
                'Here - take these. I have more than I can carry.'],
        when: (ctx) => ctx.weather !== 'clear'
    }
];

// How often a step in the wild turns up an event rather than a monster
const ROUTE_EVENT_CHANCE = 0.18;

function eligibleRouteEvents(context) {
    return ROUTE_EVENTS.filter(event => !event.when || event.when(context));
}

// Weighted pick from whatever this moment allows. Returns null when nothing
// fits, and the caller falls back to an ordinary encounter.
function rollRouteEvent(context) {
    const pool = eligibleRouteEvents(context);
    if (!pool.length) return null;

    const total = pool.reduce((sum, event) => sum + event.weight, 0);
    let roll = Math.random() * total;

    for (const event of pool) {
        roll -= event.weight;
        if (roll <= 0) return event;
    }

    return pool[pool.length - 1];
}

function getRouteEvent(id) {
    return ROUTE_EVENTS.find(event => event.id === id) || null;
}
