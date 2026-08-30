/**
 * Draws every sprite the game needs into Phaser canvas textures at boot.
 *
 * Sprites are described as small pixel grids and scaled up, which keeps the
 * art crisp and chunky rather than the blurry ellipses a canvas path would
 * give. One character per pixel; ' ' is transparent.
 */
const SpriteFactory = {
    SCALE: 2,       // each grid cell becomes SCALE x SCALE device pixels
    CELL: 16,       // monster and player grids are 16x16

    PALETTE: {
        // shared
        '.': null,            // transparent
        'k': '#1d1622',       // outline
        'w': '#ffffff',
        'e': '#2b2b3a',       // eye
        // player
        's': '#f2c48c',       // skin
        'h': '#6b3f1d',       // hair
        'c': '#e0483c',       // cap / shirt
        'C': '#b8322a',       // cap shade
        'j': '#3a6ea5',       // jacket
        'J': '#2c5580',       // jacket shade
        'p': '#3b4a5a',       // trousers
        'b': '#2a2f38',       // boots
        // monster palette slots, filled per species. The newer 32x32 grids use
        // the full ramp; the older 16x16 ones only ever used 1-4.
        '1': '#888888',
        '2': '#666666',
        '3': '#aaaaaa',
        '4': '#ffffff'
    },

    // Blend two #rrggbb colours
    blend(from, to, amount) {
        const parse = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
        const [r1, g1, b1] = parse(from);
        const [r2, g2, b2] = parse(to);
        const mix = (a, b) => Math.round(a + (b - a) * amount);

        return `#${[mix(r1, r2), mix(g1, g2), mix(b1, b2)]
            .map(v => v.toString(16).padStart(2, '0')).join('')}`;
    },

    /**
     * The full tone ramp for one species, derived from the four colours it
     * already has plus an optional fifth for its pale markings.
     *
     *   o  outline      5 2 1 3 6  body, dark to light      w  specular
     *   a A B  markings (ear insides, muzzle, chest, tail tip)
     *   e W    eye and its catchlight
     */
    monsterPalette(colors) {
        const [base, dark, light, accent] = colors;
        const marking = colors[4] || accent;
        const BLACK = '#101220';
        const WHITE = '#ffffff';

        return {
            ...this.PALETTE,
            '1': base,
            '2': dark,
            '3': light,
            '4': accent,
            '5': this.blend(dark, BLACK, 0.28),
            '6': this.blend(light, WHITE, 0.45),
            'o': this.blend(dark, BLACK, 0.62),
            'w': this.blend(light, WHITE, 0.82),
            'a': this.blend(marking, BLACK, 0.42),
            'A': marking,
            'B': this.blend(marking, WHITE, 0.55),
            'e': '#181c2c',
            'W': WHITE
        };
    },

    // ---------------------------------------------------------------- player

    // 4 directions x 3 frames (stand, step-left, step-right)
    PLAYER_FRAMES: {
        down: [
            [
                '.....kkkkkk.....',
                '....kCCCCCCk....',
                '...kCcccccCCk...',
                '...kcccccccck...',
                '...ksssssssk....',
                '...ksekssekk....',
                '...ksssssssk....',
                '...kksssssk.....',
                '..kjjjjjjjjjk...',
                '.kjjjjJJjjjjjk..',
                '.kjjjjJJjjjjjk..',
                '.ksjjjJJjjjsk...',
                '..kkkpppppkkk...',
                '...kppp.pppk....',
                '...kbbk.kbbk....',
                '...kkk...kkk....'
            ],
            [
                '.....kkkkkk.....',
                '....kCCCCCCk....',
                '...kCcccccCCk...',
                '...kcccccccck...',
                '...ksssssssk....',
                '...ksekssekk....',
                '...ksssssssk....',
                '...kksssssk.....',
                '..kjjjjjjjjjk...',
                '.kjjjjJJjjjjjk..',
                '.kjjjjJJjjjjjk..',
                '.ksjjjJJjjjsk...',
                '..kkkpppppkkk...',
                '..kppk..kppk....',
                '..kbbk...kbbk...',
                '..kkk.....kkk...'
            ],
            [
                '.....kkkkkk.....',
                '....kCCCCCCk....',
                '...kCcccccCCk...',
                '...kcccccccck...',
                '...ksssssssk....',
                '...ksekssekk....',
                '...ksssssssk....',
                '...kksssssk.....',
                '..kjjjjjjjjjk...',
                '.kjjjjJJjjjjjk..',
                '.kjjjjJJjjjjjk..',
                '.ksjjjJJjjjsk...',
                '..kkkpppppkkk...',
                '...kppk..kppk...',
                '...kbbk...kbbk..',
                '...kkk.....kkk..'
            ]
        ],
        up: [
            [
                '.....kkkkkk.....',
                '....kCCCCCCk....',
                '...kCCCCCCCCk...',
                '...kCCCCCCCCk...',
                '...khhhhhhhk....',
                '...khhhhhhhk....',
                '...khhhhhhhk....',
                '...kkhhhhhk.....',
                '..kjjjjjjjjjk...',
                '.kjjjjjjjjjjjk..',
                '.kjjjjjjjjjjjk..',
                '.ksjjjjjjjjsk...',
                '..kkkpppppkkk...',
                '...kppp.pppk....',
                '...kbbk.kbbk....',
                '...kkk...kkk....'
            ],
            [
                '.....kkkkkk.....',
                '....kCCCCCCk....',
                '...kCCCCCCCCk...',
                '...kCCCCCCCCk...',
                '...khhhhhhhk....',
                '...khhhhhhhk....',
                '...khhhhhhhk....',
                '...kkhhhhhk.....',
                '..kjjjjjjjjjk...',
                '.kjjjjjjjjjjjk..',
                '.kjjjjjjjjjjjk..',
                '.ksjjjjjjjjsk...',
                '..kkkpppppkkk...',
                '..kppk..kppk....',
                '..kbbk...kbbk...',
                '..kkk.....kkk...'
            ],
            [
                '.....kkkkkk.....',
                '....kCCCCCCk....',
                '...kCCCCCCCCk...',
                '...kCCCCCCCCk...',
                '...khhhhhhhk....',
                '...khhhhhhhk....',
                '...khhhhhhhk....',
                '...kkhhhhhk.....',
                '..kjjjjjjjjjk...',
                '.kjjjjjjjjjjjk..',
                '.kjjjjjjjjjjjk..',
                '.ksjjjjjjjjsk...',
                '..kkkpppppkkk...',
                '...kppk..kppk...',
                '...kbbk...kbbk..',
                '...kkk.....kkk..'
            ]
        ],
        left: [
            [
                '.....kkkkk......',
                '....kCCCCCk.....',
                '...kCccccCCk....',
                '...kccccccck....',
                '...kssssshk.....',
                '...keksssshk....',
                '...kssssssk.....',
                '....kkssskk.....',
                '...kjjjjjjjk....',
                '..kjjjjJjjjjk...',
                '..kjjjjJjjjjk...',
                '..ksjjjJjjjk....',
                '...kkpppppkk....',
                '...kpppppk......',
                '...kbbbbk.......',
                '....kkkk........'
            ],
            [
                '.....kkkkk......',
                '....kCCCCCk.....',
                '...kCccccCCk....',
                '...kccccccck....',
                '...kssssshk.....',
                '...keksssshk....',
                '...kssssssk.....',
                '....kkssskk.....',
                '...kjjjjjjjk....',
                '..kjjjjJjjjjk...',
                '..kjjjjJjjjjk...',
                '..ksjjjJjjjk....',
                '...kkpppppkk....',
                '..kppk.kppk.....',
                '..kbbk..kbbk....',
                '..kkk....kkk....'
            ],
            [
                '.....kkkkk......',
                '....kCCCCCk.....',
                '...kCccccCCk....',
                '...kccccccck....',
                '...kssssshk.....',
                '...keksssshk....',
                '...kssssssk.....',
                '....kkssskk.....',
                '...kjjjjjjjk....',
                '..kjjjjJjjjjk...',
                '..kjjjjJjjjjk...',
                '..ksjjjJjjjk....',
                '...kkpppppkk....',
                '...kppk.kppk....',
                '...kbbk..kbbk...',
                '...kkk....kkk...'
            ]
        ]
        // 'right' is generated by mirroring 'left'
    },

    // --------------------------------------------------------------- monsters

    // Per-species colour ramp for palette slots 1-4
    MONSTER_COLORS: {
        Slime:     ['#4fc3f7', '#2b8fc4', '#8fe0ff', '#ffffff', '#d2f0ff'],
        Oozer:     ['#2f7fd0', '#1c5390', '#63b4ff', '#d8f0ff', '#bee2ff'],
        Rat:       ['#b08a5e', '#7d5f3c', '#d8bb90', '#ffffff'],
        Rattler:   ['#8d6a42', '#5c422a', '#c2a074', '#ffe9c4'],
        Bird:      ['#f6d02c', '#c9a316', '#ffe98a', '#ffffff'],
        Stormwing: ['#e8b800', '#9c7a00', '#ffe259', '#fff6c4'],
        Fox:       ['#f07a3c', '#b8402a', '#ffa672', '#ffe0d0', '#fce2c4'],
        Pyrefox:   ['#e03a1c', '#9c2410', '#ff7a48', '#ffd9a0'],
        Spider:    ['#6a4c93', '#432f60', '#9b7ec4', '#ffffff'],
        Owl:       ['#7fb069', '#54774a', '#adcf99', '#fff3c4'],
        Fish:      ['#3fa9d8', '#2a7ba3', '#7fd4f0', '#ffffff'],
        Crab:      ['#e05a4a', '#a83a2e', '#ff8f7a', '#ffe0d0'],
        Turtle:    ['#4a8c5c', '#2f5e3c', '#7dbf8c', '#e8f6d0'],
        Bat:       ['#7a5fa0', '#4d3a68', '#a98fc4', '#ffe98a'],
        Snake:     ['#5cc45c', '#3a8a3a', '#96e096', '#ffe98a'],
        Golem:     ['#9a8f7a', '#6b6252', '#c4b9a0', '#ffffff'],
        Scorpion:  ['#c99a3a', '#967024', '#e8c274', '#ffffff'],
        Vulture:   ['#8a6a5a', '#5c453a', '#b89a86', '#e05a4a'],
        Camel:     ['#e0b878', '#ac8a52', '#f5dcae', '#ffffff'],
        Moth:      ['#a88fd0', '#6f5a96', '#cfbcf0', '#ffe98a'],
        Emberfly:      ['#6ad0ff', '#2f8ab8', '#c4f0ff', '#ffffff'],
        Lampwing:  ['#ffb43c', '#c07a10', '#ffe08a', '#fff6d0'],
        Dusker:     ['#4a4a68', '#26263a', '#7a7a9c', '#c9c9e4'],
        Volcanor:  ['#ff5a1f', '#8c2500', '#ffa040', '#ffe8a0']
    },

    // Body shapes, reused across species with different colour ramps
    SHAPES: {
        // --- redrawn at 32x32 -------------------------------------------
        // Described as a shape and then lit from the depth of the body, so
        // an ear rounds like an ear and a tail like a tail. See the ramp in
        // monsterPalette() for what each character means.
        slime: [
            '................................',
            '................................',
            '................................',
            '................................',
            '................................',
            '.............ooooo..............',
            '..........ooo52255oo............',
            '.........o5252222255o...........',
            '........o52www2221255o..........',
            '.......o52wwww11111155o.........',
            '.......o52wwww111111155o........',
            '......o52211111111113155o.......',
            '......o221111111111333355o......',
            '......o522111111113333355o......',
            '.....o52211111111133333155o.....',
            '....o5221111111113333333355o....',
            '....o5221111111133333333355o....',
            '...o5221111WWe16633WWe333355o...',
            '...o2211111eee66666eee333325o...',
            '...o2211111eee66666eee333325o...',
            '...o2211111eee66666eee333325o...',
            '...o521111366666666666333325o...',
            '...o511113666e6666e666666322o...',
            '....o511136666eeee666666322o....',
            '....o5513666666666666666322o....',
            '.....o55333333333333333322o.....',
            '......o552222222222222222o......',
            '.......o5555555555555552o.......',
            '........oooooooooooooooo........',
            '................................',
            '................................',
            '................................'
        ],
        oozer: [
            '................................',
            '................................',
            '................................',
            '................................',
            '..........oo....................',
            '.........o55o.......ooo.........',
            '........o5255o.....o555o........',
            '.......o522155oo..o52255o.......',
            '.......o22111155oo522155o.......',
            '.......o52211122252211155o......',
            '......o5221www112221113155o.....',
            '.....o5221wwww1112111133155o....',
            '....o52211wwww11111111333155o...',
            '....o522111113111111133333355o..',
            '...o5221111113111111133333325o..',
            '...o2211111111111111333333325o..',
            '...o2211555555111155555533325o..',
            '...o52211WWee111111WWee333325o..',
            '..o522111eeee133313eeee333325o..',
            '..o522111eeee666666eeee333355o..',
            '.o5221111116666666666333333155o.',
            'o522111116666666666666633333155o',
            '522111336666e666666e666666333355',
            '2211363366666eeeeee6666666663325',
            '52136633666666666666666666666325',
            '55533333666666666666666663333222',
            'o555225333333333333333333222222o',
            '.oo55555222222222222222222552oo.',
            '...oooo555555555555555552oooo...',
            '.......oooooooooooooooooo.......',
            '................................',
            '................................'
        ],
        vulpine: [
            '................................',
            '................................',
            '................................',
            '........oo...........oo.........',
            '.......o55oo.......oo55o........',
            '.......o5Aa5ooooooo5aa2o........',
            '........o2awww22225aa2o.........',
            '........o2awww2222aaa5o.........',
            '........o2a122222223a5o.........',
            '........o2211111113325o.........',
            '........o22WWe1113WWe5o..oo.....',
            '........o22eee1133eee5o.o55oo...',
            '........o22eee1133eee5oo52255o..',
            '........o5211113333325o52aAaao..',
            '.......o55511AAeeB632252aABBa5o.',
            '.......o55511BBeeB322551ABBBa5o.',
            '........ooo21AABBB22ooo2AAABB55o',
            '..........o5221A3355o.o52aAB325o',
            '.........o52211133355o522113325o',
            '.........o5221AAB3355o525133325o',
            '........o5221AAABB3112251133325o',
            '........o2211AAAAB3312251366322o',
            '........o2211AAABB333251166322o.',
            '........o22111ABB6333151666322o.',
            '........o22111366666351666322o..',
            '........o22113666666656666322o..',
            '........o5213666666665663322o...',
            '........o213353333533333222o....',
            '........o55225222252222222o.....',
            '........o555555555555552oo......',
            '.........ooooooooooooooo........',
            '................................'
        ],

        blob: [
            '................',
            '................',
            '.....kkkkkk.....',
            '....k333333k....',
            '...k33111133k...',
            '..k3311111133k..',
            '..k31111111113k.',
            '.k311441144111k.',
            '.k311441144111k.',
            '.k311111111113k.',
            '.k311111111113k.',
            '.k321111111121k.',
            '..k3221111223k..',
            '..kk22222222kk..',
            '....kkkkkkkk....',
            '................'
        ],
        quadruped: [
            '................',
            '..kk........kk..',
            '.k11k......k11k.',
            '.k131k....k131k.',
            '.k1111kkkk1111k.',
            'k1141111111411k.',
            'k11111111111111k',
            'k1kk111111111kk3',
            'k1111111111111k3',
            '.k311111111113k.',
            '.k211111111112k.',
            '.kk2211112222kk.',
            '..k11k....k11k..',
            '..k22k....k22k..',
            '..kkk......kkk..',
            '................'
        ],
        winged: [
            '................',
            '.......kk.......',
            '......k11k......',
            'kk...k1441k...kk',
            'k3k.k114411k.k3k',
            'k13kk111111kk31k',
            'k11311111111131k',
            'k11111111111111k',
            '.k311111111113k.',
            '..k2111111112k..',
            '..k211111112k...',
            '...kk222222kk...',
            '.....k1kk1k.....',
            '.....k2k.k2k....',
            '.....kk...kk....',
            '................'
        ],
        serpent: [
            '................',
            '....kkkk........',
            '...k1111k.......',
            '..k114411k......',
            '..k111111k......',
            '..k3111113kk....',
            '...k1111111k....',
            '....kk11111k....',
            '......k11111k...',
            '.....k111111k...',
            '....k11111kk....',
            '...k11113k......',
            '..k211112k......',
            '..k2222222k.....',
            '...kkkkkkk......',
            '................'
        ],
        arachnid: [
            '................',
            '.k............k.',
            '..k..........k..',
            '...kkkkkkkkkk...',
            '.k.k33111133k.k.',
            '..k3144114413k..',
            'k..3111111113..k',
            '.k311111111113k.',
            '.k311111111113k.',
            'k..3211111123..k',
            '..k3221111223k..',
            '...kk222222kk...',
            '..k...k22k...k..',
            '.k....k..k....k.',
            'k..............k',
            '................'
        ],
        crustacean: [
            '................',
            '.kk..........kk.',
            'k11k........k11k',
            'k131k......k131k',
            'k1111k....k1111k',
            '.kk11kkkkkk11kk.',
            '...k11111111k...',
            '..k3114114113k..',
            '..k3111111111k..',
            '..k1111111111k..',
            '..k2111111112k..',
            '...kk222222kk...',
            '..k1k.k11k.k1k..',
            '..k2k.k22k.k2k..',
            '..kk...kk...kk..',
            '................'
        ],
        boulder: [
            '................',
            '................',
            '....kkkkkkk.....',
            '...k3333333k....',
            '..k331111133k...',
            '.k33111111133k..',
            '.k311111111113k.',
            'k3114411144113k.',
            'k3114411144111k.',
            'k31111111111113k',
            'k31112111211111k',
            '.k311111111112k.',
            '.k221111111121k.',
            '..kk22222222kk..',
            '....kkkkkkkk....',
            '................'
        ],
        finned: [
            '................',
            '................',
            '.......kkk......',
            '.....kk333kk....',
            '...kk11111133k..',
            '..k31111111111k.',
            '.k3114411111113k',
            'k31144111111113k',
            'k31111111111133k',
            '.k311111111133k.',
            '..k3111111133k..',
            '...kk111113kk...',
            '.....kkkkkk.....',
            '.......k22k.....',
            '........kk......',
            '................'
        ],
        shelled: [
            '................',
            '................',
            '.....kkkkkk.....',
            '...kk333333kk...',
            '..k3322222233k..',
            '.k332222222233k.',
            'k33222112211223k',
            'k32211144112223k',
            'k32211144112223k',
            'k33222112211223k',
            '.k332222222233k.',
            '..kk33333333kk..',
            '..k11k....k11k..',
            '..k22k....k22k..',
            '..kkk......kkk..',
            '................'
        ],
        moth: [
            '................',
            '.......kk.......',
            '......k44k......',
            '..kkk.k11k.kkk..',
            '.k333kk11kk333k.',
            'k3311kk11kk1133k',
            'k31141k11k14113k',
            'k31111k11k11113k',
            'k32111k11k11123k',
            '.k3211k11k1123k.',
            '..k321k11k123k..',
            '...kk2k11k2kk...',
            '......k22k......',
            '.......kk.......',
            '................',
            '................'
        ],
        firefly: [
            '................',
            '......kkkk......',
            '.....k3333k.....',
            '..kk.k3113k.kk..',
            '.k33k311113k33k.',
            'k3113k41143k113k',
            'k311k311113k113k',
            '.k33kk3113kk33k.',
            '..kk..k11k..kk..',
            '......k44k......',
            '.......k4k......',
            '.......kk.......',
            '................',
            '................',
            '................',
            '................'
        ],
        lampwing: [
            '................',
            '..k...kkkk...k..',
            '.k3k.k3333k.k3k.',
            'k311k311113k113k',
            'k31113111131113k',
            'k31113411431113k',
            'k32113111131123k',
            '.k321k3113k123k.',
            '..kk2.k11k.2kk..',
            '.......k44k.....',
            '......k4444k....',
            '......k4444k....',
            '.......k44k.....',
            '........kk......',
            '................',
            '................'
        ],
        prowler: [
            '................',
            '..kk........kk..',
            '.k33k......k33k.',
            '.k131k....k131k.',
            '.k1111kkkk1111k.',
            'k1141111111411kk',
            'k1111111111111k3',
            'k1kk11111111kk33',
            'k11111111111k333',
            '.k3111111111k33.',
            '.k2111111111k3..',
            '.kk22111122kk...',
            '..k11k..k11k....',
            '..k22k..k22k....',
            '..kkk....kkk....',
            '................'
        ],
        titan: [
            '.k............k.',
            '.k1k........k1k.',
            '.k11k......k11k.',
            '..k11kkkkkk11k..',
            '.k311111111113k.',
            'k31144111144113k',
            'k31111111111113k',
            'k32111111111123k',
            'k32211111111223k',
            '.k221111111122k.',
            '..kk22222222kk..',
            '...k11k..k11k...',
            '..k222k..k222k..',
            '..k22k....k22k..',
            '..kkk......kkk..',
            '................'
        ]
    },

    SPECIES_SHAPE: {
        Slime: 'slime',     Oozer: 'oozer',
        Rat: 'quadruped',   Rattler: 'quadruped',
        Bird: 'winged',     Stormwing: 'winged',
        Fox: 'vulpine',     Pyrefox: 'quadruped',
        Spider: 'arachnid',   Owl: 'winged',
        Fish: 'finned',     Crab: 'crustacean',   Turtle: 'shelled',
        Bat: 'winged',      Snake: 'serpent',     Golem: 'boulder',
        Scorpion: 'arachnid', Vulture: 'winged', Camel: 'quadruped',
        Moth: 'moth',       Emberfly: 'firefly',
        Lampwing: 'lampwing', Dusker: 'prowler',
        Volcanor: 'titan'
    },

    // ------------------------------------------------------------------ build

    build(scene) {
        if (scene.textures.exists('player')) return;

        this.buildPlayer(scene);
        this.buildNpcs(scene);
        this.buildMonsters(scene);
        this.buildIcons(scene);
    },

    // Paint one grid into a 2D context at the given offset
    paint(ctx, grid, offsetX, offsetY, palette, scale) {
        for (let y = 0; y < grid.length; y++) {
            const row = grid[y];
            for (let x = 0; x < row.length; x++) {
                const color = palette[row[x]];
                if (!color) continue;
                ctx.fillStyle = color;
                ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
            }
        }
    },

    mirror(grid) {
        return grid.map(row => row.split('').reverse().join(''));
    },

    // A soft ellipse under a character's feet, drawn *behind* what is already
    // on the canvas. Baked into the texture rather than added as a second
    // game object, so it costs nothing at runtime and can never drift out of
    // step with the sprite it belongs to.
    addGroundShadow(ctx, x, y, size) {
        const previous = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = 'destination-over';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y + size * 0.9, size * 0.3, size * 0.09, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y + size * 0.9, size * 0.38, size * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalCompositeOperation = previous;
    },

    buildPlayer(scene) {
        const scale = this.SCALE;
        const size = this.CELL * scale;
        const directions = ['down', 'up', 'left', 'right'];
        const frames = 3;

        const texture = scene.textures.createCanvas('player', size * frames, size * directions.length);
        const ctx = texture.getContext();

        directions.forEach((direction, row) => {
            const source = direction === 'right'
                ? this.PLAYER_FRAMES.left.map(frame => this.mirror(frame))
                : this.PLAYER_FRAMES[direction];

            source.forEach((grid, column) => {
                this.paint(ctx, grid, column * size, row * size, this.PALETTE, scale);
                this.addGroundShadow(ctx, column * size, row * size, size);
            });
        });

        texture.refresh();

        // Register the grid as a spritesheet so animations can index into it
        scene.textures.get('player').add('__BASE', 0, 0, 0, size * frames, size * directions.length);
        this.addFrames(scene, 'player', size, frames, directions.length);
    },

    // Slice a canvas texture into a grid of numbered frames
    addFrames(scene, key, size, columns, rows) {
        const texture = scene.textures.get(key);
        let index = 0;

        for (let row = 0; row < rows; row++) {
            for (let column = 0; column < columns; column++) {
                texture.add(index++, 0, column * size, row * size, size, size);
            }
        }
    },

    // Standing NPC portraits, one frame each, facing the camera
    NPC_GRIDS: {
        'npc-nurse': { swap: { c: '#f3f3f8', C: '#d8d8e4', j: '#ff8fa8', J: '#e06a86', h: '#b8506c' } },
        'npc-clerk': { swap: { c: '#4fc3f7', C: '#2b8fc4', j: '#3a4a68', J: '#2a3550', h: '#3a2a1a' } },
        'npc-elder': { swap: { c: '#cfcfd6', C: '#a8a8b4', j: '#6a5f4a', J: '#4d4536', h: '#dcdce4' } },
        'npc-kid':   { swap: { c: '#7fe08a', C: '#4faa5c', j: '#e0a84a', J: '#b8813a', h: '#6b3f1d' } },
        'npc-trainer': { swap: { c: '#2a2f38', C: '#1a1e24', j: '#d64a3a', J: '#a3352a', h: '#2a1a10' } },
        'npc-rival':   { swap: { c: '#7a4fd0', C: '#563a94', j: '#e8e8f0', J: '#c0c0cc', h: '#3a2a4a' } }
    },

    buildNpcs(scene) {
        // NPCs reuse the player's front-facing frame with a recoloured palette,
        // so the whole cast stays visually consistent for very little code.
        const scale = this.SCALE;
        const size = this.CELL * scale;
        const grid = this.PLAYER_FRAMES.down[0];

        Object.entries(this.NPC_GRIDS).forEach(([key, { swap }]) => {
            if (scene.textures.exists(key)) return;

            const texture = scene.textures.createCanvas(key, size, size);
            const ctx = texture.getContext();
            this.paint(ctx, grid, 0, 0, { ...this.PALETTE, ...swap }, scale);
            this.addGroundShadow(ctx, 0, 0, size);
            texture.refresh();
        });
    },

    buildMonsters(scene) {
        DEX_ORDER.forEach((name) => {
            const key = `monster-${name}`;
            if (scene.textures.exists(key)) return;

            const colors = this.MONSTER_COLORS[name] || ['#888888', '#555555', '#bbbbbb', '#ffffff'];
            const shape = this.SHAPES[this.SPECIES_SHAPE[name] || 'blob'];

            // Grids are being redrawn at 32x32 a species at a time, so the
            // canvas is sized from the grid rather than from one constant.
            const cells = shape.length;
            const size = cells * this.SCALE;

            const texture = scene.textures.createCanvas(key, size, size);
            this.paint(texture.getContext(), shape, 0, 0, this.monsterPalette(colors), this.SCALE);
            texture.refresh();
        });
    },

    // Small icons drawn straight onto the world: heal pad, shop sign, etc.
    buildIcons(scene) {
        const scale = this.SCALE;
        const size = this.CELL * scale;

        const icons = {
            'icon-heal': {
                palette: { ...this.PALETTE, '1': '#ff5a7a', '2': '#c43a56', '3': '#ffffff' },
                grid: [
                    '................',
                    '.kkkkkkkkkkkkkk.',
                    '.k111111111111k.',
                    '.k111113311111k.',
                    '.k111113311111k.',
                    '.k111333333111k.',
                    '.k111333333111k.',
                    '.k111113311111k.',
                    '.k111113311111k.',
                    '.k111111111111k.',
                    '.k222222222222k.',
                    '.kkkkkkkkkkkkkk.',
                    '................',
                    '................',
                    '................',
                    '................'
                ]
            },
            'icon-item': {
                palette: { ...this.PALETTE, '1': '#f6d02c', '2': '#b8951a', '3': '#ffffff' },
                grid: [
                    '................',
                    '................',
                    '................',
                    '.....kkkkkk.....',
                    '....k111111k....',
                    '...k11133111k...',
                    '...k11333311k...',
                    '...k11133111k...',
                    '...k111111111k..',
                    '....k2211122k...',
                    '.....kkkkkk.....',
                    '................',
                    '................',
                    '................',
                    '................',
                    '................'
                ]
            },
            'icon-shop': {
                palette: { ...this.PALETTE, '1': '#f6d02c', '2': '#c9a316', '3': '#4a3a10' },
                grid: [
                    '................',
                    '.kkkkkkkkkkkkkk.',
                    '.k111111111111k.',
                    '.k113333113311k.',
                    '.k133113311331k.',
                    '.k133111111331k.',
                    '.k113333113311k.',
                    '.k111133113331k.',
                    '.k133113311331k.',
                    '.k113333113311k.',
                    '.k222222222222k.',
                    '.kkkkkkkkkkkkkk.',
                    '................',
                    '................',
                    '................',
                    '................'
                ]
            }
        };

        Object.entries(icons).forEach(([key, { palette, grid }]) => {
            if (scene.textures.exists(key)) return;
            const texture = scene.textures.createCanvas(key, size, size);
            this.paint(texture.getContext(), grid, 0, 0, palette, scale);
            texture.refresh();
        });
    },

    // Animations for the player walk cycle
    createAnimations(scene) {
        const directions = ['down', 'up', 'left', 'right'];

        directions.forEach((direction, row) => {
            const base = row * 3;

            if (!scene.anims.exists(`walk-${direction}`)) {
                scene.anims.create({
                    key: `walk-${direction}`,
                    frames: [{ key: 'player', frame: base + 1 },
                             { key: 'player', frame: base },
                             { key: 'player', frame: base + 2 },
                             { key: 'player', frame: base }],
                    frameRate: 8,
                    repeat: -1
                });
            }

            if (!scene.anims.exists(`idle-${direction}`)) {
                scene.anims.create({
                    key: `idle-${direction}`,
                    frames: [{ key: 'player', frame: base }],
                    frameRate: 1
                });
            }
        });
    }
};
