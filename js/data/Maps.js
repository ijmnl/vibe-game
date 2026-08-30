/**
 * The world as a graph of small maps, in the style of a Pokemon region:
 * towns you can rest and shop in, joined by routes where monsters live.
 *
 * Each map is generated from its own fixed seed, so it looks the same every
 * time you walk back in. Exits sit in the middle of the named edge and pair up
 * with the opposite edge of the map they lead to.
 */
const MAPS = {
    sprout_town: {
        name: 'Sprout Town',
        kind: 'town',
        zone: 'VILLAGE',
        width: 24, height: 18,
        seed: 1001,
        exits: [{ side: 'north', to: 'route_1' }],
        npcs: [
            { id: 'nurse', x: -4, y: -4, sprite: 'npc-nurse', role: 'heal',
              lines: ['Welcome to Sprout Town!', 'Rest here and your team is patched right up.'] },
            { id: 'clerk', x: 4, y: -4, sprite: 'npc-clerk', role: 'shop',
              lines: ['Balls, potions, the usual.', 'Weaken a monster before you throw - it works far better.'] },
            { id: 'elder', x: -6, y: 2, sprite: 'npc-elder',
              lines: ['So you are the one heading north.',
                      'Monsters hide in the tall grass. Walk the path if you would rather not fight.',
                      'Every monster has a type. Water puts out Fire, Fire burns Grass, Grass drinks Water.'] },
            { id: 'kid', x: 5, y: 3, sprite: 'npc-kid',
              lines: ['My big sister trains on Route 1!', 'She has never lost. Not once. Probably.'] }
        ]
    },

    route_1: {
        name: 'Route 1',
        kind: 'route',
        zone: 'GRASS',
        width: 28, height: 22,
        seed: 1002,
        levels: [3, 5],
        exits: [{ side: 'south', to: 'sprout_town' }, { side: 'north', to: 'greenwood_town' }],
        npcs: [
            { id: 'trainer_mia', x: 0, y: -2, sprite: 'npc-trainer',
              trainer: { title: 'Trainer Mia', team: [['Rat', 4], ['Bird', 5]], reward: 60,
                         intro: ['My brother says I never lose.', "Let's keep it that way!"],
                         defeat: ['Fine, fine. You are better than him too.'] } },
            { id: 'hiker', x: -7, y: 5, sprite: 'npc-elder',
              lines: ['Tall grass rustles when something is in it.', 'Stay on the path and nothing will bother you.'] }
        ]
    },

    greenwood_town: {
        name: 'Greenwood',
        kind: 'town',
        zone: 'VILLAGE',
        width: 24, height: 18,
        seed: 1003,
        exits: [{ side: 'south', to: 'route_1' }, { side: 'east', to: 'route_2' }],
        npcs: [
            { id: 'nurse', x: -4, y: -4, sprite: 'npc-nurse', role: 'heal',
              lines: ['Greenwood welcomes you.', 'Let me take a look at your team.'] },
            { id: 'clerk', x: 4, y: -4, sprite: 'npc-clerk', role: 'shop',
              lines: ['Super Balls are worth the coins out east.'] },
            { id: 'sage', x: -6, y: 3, sprite: 'npc-elder', role: 'gift', gift: ['Fox', 8],
              lines: ['The forest east of here is thick with Grass monsters.',
                      'Water and Normal will get you nowhere in there.',
                      'Here - take this Fox. Fire is what those woods respect.'],
              afterGift: ['Keep that Fox close. The wood is no place without it.'] },
            { id: 'collector', x: 6, y: 2, sprite: 'npc-kid',
              lines: ['I am filling my Monsterdex!', 'Check yours in the menu. Twenty in total, they say.'] }
        ]
    },

    route_2: {
        name: 'Whisper Wood',
        kind: 'route',
        zone: 'FOREST',
        width: 30, height: 22,
        seed: 1004,
        levels: [6, 9],
        exits: [{ side: 'west', to: 'greenwood_town' }, { side: 'east', to: 'lakeside_town' }],
        npcs: [
            { id: 'trainer_bram', x: -4, y: -3, sprite: 'npc-trainer',
              trainer: { title: 'Forester Bram', team: [['Owl', 7], ['Spider', 8]], reward: 95,
                         intro: ['These woods are mine to look after.', 'Show me you belong here.'],
                         defeat: ['Well fought. The lake is east of here.'] } },
            { id: 'trainer_juno', x: 6, y: 4, sprite: 'npc-trainer',
              trainer: { title: 'Camper Juno', team: [['Fox', 8], ['Snake', 8]], reward: 110,
                         intro: ['Nothing beats a campfire and a good battle!'],
                         defeat: ['Ha! Worth every coin.'] } }
        ]
    },

    lakeside_town: {
        name: 'Lakeside',
        kind: 'town',
        zone: 'VILLAGE',
        width: 24, height: 18,
        seed: 1005,
        exits: [{ side: 'west', to: 'route_2' }, { side: 'north', to: 'route_3' }],
        npcs: [
            { id: 'nurse', x: -4, y: -4, sprite: 'npc-nurse', role: 'heal',
              lines: ['You look like you walked the whole wood.', 'Sit, sit. This will only take a moment.'] },
            { id: 'clerk', x: 4, y: -4, sprite: 'npc-clerk', role: 'shop',
              lines: ['Stock up. The cave north of here is no joke.'] },
            { id: 'fisher', x: -6, y: 2, sprite: 'npc-elder',
              lines: ['Water monsters gather along the shore up north.',
                      'Electric beats them soundly, if you have something with a spark.'] },
            { id: 'twin', x: 6, y: 3, sprite: 'npc-kid',
              lines: ['Monsters evolve, you know!', 'Mine changed shape at level sixteen. Scared me half to death.'] }
        ]
    },

    route_3: {
        name: 'Still Shore',
        kind: 'route',
        zone: 'WATER',
        width: 30, height: 22,
        seed: 1006,
        levels: [10, 13],
        exits: [{ side: 'south', to: 'lakeside_town' }, { side: 'north', to: 'ember_cave' }],
        npcs: [
            { id: 'trainer_pike', x: -5, y: 0, sprite: 'npc-trainer',
              trainer: { title: 'Angler Pike', team: [['Fish', 11], ['Crab', 12], ['Turtle', 12]], reward: 150,
                         intro: ['Patience, that is the trick.', 'You have none, I can tell.'],
                         defeat: ['Hmph. Beginners luck.'] } },
            { id: 'trainer_nell', x: 6, y: -5, sprite: 'npc-trainer',
              trainer: { title: 'Swimmer Nell', team: [['Slime', 12], ['Fish', 13]], reward: 140,
                         intro: ['The water is lovely. Get in!'],
                         defeat: ['Alright, you win. Mind the cave.'] } }
        ]
    },

    ember_cave: {
        name: 'Ember Cave',
        kind: 'route',
        zone: 'CAVE',
        width: 28, height: 22,
        seed: 1007,
        levels: [14, 18],
        exits: [{ side: 'south', to: 'route_3' }, { side: 'east', to: 'dust_road' }],
        npcs: [
            { id: 'trainer_gorm', x: -4, y: -4, sprite: 'npc-trainer',
              trainer: { title: 'Miner Gorm', team: [['Golem', 16], ['Bat', 15]], reward: 200,
                         intro: ['Careful. Rocks bite down here.'],
                         defeat: ['Solid. Truly solid.'] } },
            { id: 'trainer_vex', x: 5, y: 4, sprite: 'npc-trainer',
              trainer: { title: 'Spelunker Vex', team: [['Bat', 17], ['Snake', 17], ['Golem', 18]], reward: 250,
                         intro: ['Lost, are you? Everyone is, at first.'],
                         defeat: ['Keep east. The desert road is long.'] } }
        ]
    },

    dust_road: {
        name: 'Dust Road',
        kind: 'route',
        zone: 'SAND',
        width: 32, height: 20,
        seed: 1008,
        levels: [19, 24],
        exits: [{ side: 'west', to: 'ember_cave' }, { side: 'east', to: 'ember_summit' }],
        npcs: [
            { id: 'trainer_sol', x: -6, y: 0, sprite: 'npc-trainer',
              trainer: { title: 'Nomad Sol', team: [['Camel', 21], ['Vulture', 22]], reward: 280,
                         intro: ['Long road. Longer battle.'],
                         defeat: ['Water. Take some. You will need it.'] } },
            { id: 'trainer_rhea', x: 7, y: -3, sprite: 'npc-trainer',
              trainer: { title: 'Scorch Rhea', team: [['Scorpion', 23], ['Vulture', 23], ['Camel', 24]], reward: 340,
                         intro: ['Past me is the summit.', 'Nobody walks past me.'],
                         defeat: ['...Go on then. It is waiting for you.'] } },
            { id: 'watcher', x: 2, y: 5, sprite: 'npc-elder',
              lines: ['Something sleeps at the summit.', 'It has slept a long time. I would not wake it lightly.'] }
        ]
    },

    ember_summit: {
        name: 'Ember Summit',
        kind: 'route',
        zone: 'CAVE',
        width: 22, height: 18,
        seed: 1009,
        levels: [24, 28],
        exits: [{ side: 'west', to: 'dust_road' }],
        lair: true,
        npcs: [
            { id: 'keeper', x: -5, y: 4, sprite: 'npc-elder',
              lines: ['You came all this way.', 'The shrine is ahead. Whatever answers it, answers to no one.'] }
        ]
    }
};

const STARTING_MAP = 'sprout_town';

// The edge an exit lands on when you arrive from the other side
const OPPOSITE_SIDE = { north: 'south', south: 'north', east: 'west', west: 'east' };

function getMapDef(id) {
    return MAPS[id] || MAPS[STARTING_MAP];
}
