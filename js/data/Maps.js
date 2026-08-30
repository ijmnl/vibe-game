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
            { id: 'rival_1', x: 0, y: -6, sprite: 'npc-rival', facing: 'south', sight: 0,
              rivalStage: 1,
              // Leads with the Normal-type Rat on purpose: his Bird is Electric,
              // and opening with it against a Water starter was a 4% fight.
              trainer: { title: 'Rival Kes', team: [['Rat', 5], ['Bird', 5]], reward: 80,
                         intro: ['There you are!', 'My gran gave me a monster too, you know.',
                                 'One battle. Right now. Before you get a head start.'],
                         defeat: ['...Beginner\u2019s luck. I will see you up north.'] } },
            { id: 'nurse', x: -4, y: -4, sprite: 'npc-nurse', role: 'heal',
              lines: ['Welcome to Sprout Town!',
                      'Rest here and your team is patched right up. It costs you nothing.',
                      'It never has and it never will. That is rather the point of the place.'] },
            { id: 'clerk', x: 4, y: -4, sprite: 'npc-clerk', role: 'shop',
              lines: ['Balls, potions, the usual.',
                      'Weaken a monster before you throw - it works far better.',
                      'And my scales are honest. You can weigh them yourself if you like.'] },
            { id: 'elder', x: -6, y: 2, sprite: 'npc-elder', wander: 2,
              lines: ['So you are the one heading north.',
                      'Monsters hide in the tall grass. Walk the path if you would rather not fight.',
                      'Every monster has a type. Water puts out Fire, Fire burns Grass, Grass drinks Water.',
                      'And one more, from a book older than this town:',
                      'a gentle answer turns away anger. It works on people as well as monsters.'] },
            { id: 'kid', x: 5, y: 3, sprite: 'npc-kid', wander: 2,
              lines: ['My big sister trains on Route 1!', 'She has never lost. Not once. Probably.'] },
            { id: 'coach', x: 6, y: -1, sprite: 'npc-trainer', facing: 'south', sight: 0,
              lines: ['Watch the bar under the health in a fight.',
                      'Hit them where it hurts and it fills. Get hit and it still creeps up.',
                      'Fill it and you can Burst: it cannot miss and it hits like nothing else.',
                      'And keep the same monster out. They fight harder for someone they know.'] }
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
        items: [{ x: -8, y: -6, item: 'Potion' }, { x: 9, y: 7, item: 'Monster Ball' }],
        npcs: [
            { id: 'trainer_mia', x: 0, y: -2, sprite: 'npc-trainer', facing: 'south', sight: 4,
              trainer: { title: 'Trainer Mia', team: [['Rat', 4], ['Bird', 5]], reward: 60,
                         intro: ['My brother says I never lose.', "Let's keep it that way!"],
                         defeat: ['Fine, fine. You are better than him too.'] } },
            { id: 'hiker', x: -7, y: 5, sprite: 'npc-elder', wander: 2,
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
            { id: 'rival_2', x: 2, y: -6, sprite: 'npc-rival', facing: 'south', sight: 0,
              rivalStage: 2, requires: 'sprout_town:rival_1',
              trainer: { title: 'Rival Kes', team: [['Rat', 11], ['Owl', 12], ['Bird', 12]], reward: 180,
                         intro: ['Took you long enough.', 'I have been through that wood twice already.',
                                 'Let us see what you picked up on the way.'],
                         defeat: ['Twice. Twice now.', 'Fine. The lake town, then. I will be ready.'] } },
            { id: 'nurse', x: -4, y: -4, sprite: 'npc-nurse', role: 'heal',
              lines: ['Greenwood welcomes you.', 'Let me take a look at your team.'] },
            { id: 'clerk', x: 4, y: -4, sprite: 'npc-clerk', role: 'shop',
              lines: ['Super Balls are worth the coins out east.'] },
            { id: 'sage', x: -6, y: 3, sprite: 'npc-elder', wander: 2, role: 'gift', gift: ['Fox', 8],
              lines: ['The forest east of here is thick with Grass monsters.',
                      'Water and Normal will get you nowhere in there.',
                      'Here - take this Fox. Fire is what those woods respect.'],
              afterGift: ['Keep that Fox close. The wood is no place without it.'] },
            { id: 'collector', x: 6, y: 2, sprite: 'npc-kid', wander: 2,
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
        exits: [{ side: 'west', to: 'greenwood_town' }, { side: 'east', to: 'lakeside_town' },
                { side: 'north', to: 'willow_rest' }],
        items: [{ x: -10, y: 6, item: 'Super Potion' }, { x: 11, y: -7, item: 'Super Ball' }, { x: 0, y: 8, item: 'Antidote' }],
        npcs: [
            { id: 'trainer_bram', x: -4, y: -3, sprite: 'npc-trainer', facing: 'south', sight: 4,
              trainer: { title: 'Forester Bram', team: [['Owl', 7], ['Spider', 8]], reward: 95,
                         intro: ['These woods are mine to look after.', 'Show me you belong here.'],
                         defeat: ['Well fought. The lake is east of here.'] } },
            { id: 'trainer_juno', x: 6, y: 4, sprite: 'npc-trainer', facing: 'west', sight: 4,
              trainer: { title: 'Camper Juno', team: [['Fox', 8], ['Snake', 8]], reward: 110,
                         intro: ['Nothing beats a campfire and a good battle!'],
                         defeat: ['Ha! Worth every coin.'] } },
            { id: 'signpost_keeper', x: -1, y: -7, sprite: 'npc-elder', wander: 1,
              lines: ['North of here the trees give out and there is a clearing.',
                      'Old Miriam keeps a house there. Takes in anyone who is tired.',
                      'She will let your young ones learn from your older ones, if you ask.'] }
        ]
    },

    willow_rest: {
        name: 'Willow Rest',
        kind: 'town',
        zone: 'VILLAGE',
        width: 20, height: 16,
        seed: 1010,
        // No shop and no counter here: Miriam patches up whoever walks in and
        // will not take a coin for it
        plain: true,
        exits: [{ side: 'south', to: 'route_2' }],
        npcs: [
            { id: 'miriam', x: 0, y: -4, sprite: 'npc-elder', role: 'mentor',
              lines: ['Come in, come in. You have walked a long way.',
                      'This is what I do here: I give a young one time with an older one.',
                      'The elder shows it something it knows, and neither of them loses a thing by it.',
                      'That is the whole trick. What you were given, you pass on.'] },
            { id: 'miriam_rest', x: -3, y: -4, sprite: 'npc-nurse', role: 'heal',
              lines: ['Sit your team down, they are worn through.',
                      'No, put your purse away. It came to me free; it goes out free.'] },
            { id: 'stargazer', x: -5, y: 2, sprite: 'npc-kid', wander: 2,
              lines: ['I sit out here half the night, you know.',
                      'There are monsters that only ever come out in the dark.',
                      'And when a star falls - stop walking. Just look up.',
                      'Somebody hung all of that. I like remembering it.'] },
            { id: 'weatherwoman', x: 5, y: 2, sprite: 'npc-nurse', wander: 2,
              lines: ['Rain lifts water and drowns fire. Sun does the reverse.',
                      'A sandstorm grinds down anything that is not stone.',
                      'Fog makes fools of us all - everyone misses in fog.'] },
            { id: 'miriam_boy', x: 4, y: 3, sprite: 'npc-kid', wander: 2,
              lines: ['Miriam took me in when nobody else would.',
                      'She says a kindness you can pay back is only a trade.'] }
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
            { id: 'rival_3', x: 2, y: -6, sprite: 'npc-rival', facing: 'south', sight: 0,
              rivalStage: 3, requires: 'greenwood_town:rival_2',
              trainer: { title: 'Rival Kes', team: [['Crab', 17], ['Stormwing', 18], ['Rattler', 18]], reward: 320,
                         intro: ['No speeches this time.', 'I have been training since the wood.'],
                         defeat: ['...You are actually good at this.',
                                  'I have been telling myself since Sprout Town that you got lucky.',
                                  'That was not true, and I knew it, and I said it anyway. I am sorry.',
                                  'The cave is north. Watch yourself in there. I mean it.'] },
              // Beaten and reconciled, he hands over one of his own
              role: 'gift', gift: ['Crab', 17],
              afterGift: ['Look after her. She was always going to like you better.',
                          'Come and find me when you have been to the summit.'] },
            { id: 'nurse', x: -4, y: -4, sprite: 'npc-nurse', role: 'heal',
              lines: ['You look like you walked the whole wood.', 'Sit, sit. This will only take a moment.'] },
            { id: 'clerk', x: 4, y: -4, sprite: 'npc-clerk', role: 'shop',
              lines: ['Stock up. The cave north of here is no joke.'] },
            { id: 'fisher', x: -6, y: 2, sprite: 'npc-elder', wander: 2,
              lines: ['Water monsters gather along the shore up north.',
                      'Electric beats them soundly, if you have something with a spark.'] },
            { id: 'twin', x: 6, y: 3, sprite: 'npc-kid', wander: 2,
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
        items: [{ x: -11, y: -7, item: 'Super Ball' }, { x: 10, y: 8, item: 'Super Potion' }],
        npcs: [
            { id: 'trainer_pike', x: -5, y: 0, sprite: 'npc-trainer', facing: 'east', sight: 5,
              trainer: { title: 'Angler Pike', team: [['Fish', 11], ['Crab', 12], ['Turtle', 12]], reward: 150,
                         intro: ['Patience, that is the trick.', 'You have none, I can tell.'],
                         defeat: ['Hmph. Beginners luck.'] } },
            { id: 'trainer_nell', x: 6, y: -5, sprite: 'npc-trainer', facing: 'south', sight: 4,
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
        items: [{ x: -9, y: 7, item: 'Full Potion' }, { x: 10, y: -7, item: 'Ultra Ball' }],
        npcs: [
            { id: 'trainer_gorm', x: -4, y: -4, sprite: 'npc-trainer', facing: 'south', sight: 4,
              trainer: { title: 'Miner Gorm', team: [['Golem', 16], ['Bat', 15]], reward: 200,
                         intro: ['Careful. Rocks bite down here.'],
                         defeat: ['Solid. Truly solid.'] } },
            { id: 'trainer_vex', x: 5, y: 4, sprite: 'npc-trainer', facing: 'west', sight: 5,
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
        items: [{ x: -12, y: -6, item: 'Ultra Ball' }, { x: 12, y: 6, item: 'Full Potion' }],
        npcs: [
            { id: 'trainer_sol', x: -6, y: 0, sprite: 'npc-trainer', facing: 'east', sight: 5,
              trainer: { title: 'Nomad Sol', team: [['Camel', 21], ['Vulture', 22]], reward: 280,
                         intro: ['Long road. Longer battle.'],
                         defeat: ['Water. Take some. You will need it.'] } },
            { id: 'trainer_rhea', x: 7, y: -3, sprite: 'npc-trainer', facing: 'west', sight: 5,
              trainer: { title: 'Scorch Rhea', team: [['Scorpion', 23], ['Vulture', 23], ['Camel', 24]], reward: 340,
                         intro: ['Past me is the summit.', 'Nobody walks past me.'],
                         defeat: ['...Go on then. It is waiting for you.'] } },
            { id: 'watcher', x: 2, y: 5, sprite: 'npc-elder', wander: 2,
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
        items: [{ x: -7, y: -5, item: 'Ultra Ball' }],
        lair: true,
        npcs: [
            { id: 'keeper', x: -5, y: 4, sprite: 'npc-elder', wander: 2,
              lines: ['You came all this way.',
                      'There is a den in the rock ahead, and something enormous asleep in it.',
                      'I have watched it breathe for thirty years and never once been afraid of it.',
                      'It was made, same as you and me. Go on, then. Mind your team.'] }
        ]
    }
};

const STARTING_MAP = 'sprout_town';

// The edge an exit lands on when you arrive from the other side
const OPPOSITE_SIDE = { north: 'south', south: 'north', east: 'west', west: 'east' };

function getMapDef(id) {
    return MAPS[id] || MAPS[STARTING_MAP];
}
