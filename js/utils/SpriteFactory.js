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
        // monster palette slots, filled per species
        '1': '#888888',
        '2': '#666666',
        '3': '#aaaaaa',
        '4': '#ffffff'
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
        Slime:     ['#4fc3f7', '#2b8fc4', '#8fe0ff', '#ffffff'],
        Oozer:     ['#2f7fd0', '#1c5390', '#63b4ff', '#d8f0ff'],
        Rat:       ['#b08a5e', '#7d5f3c', '#d8bb90', '#ffffff'],
        Rattler:   ['#8d6a42', '#5c422a', '#c2a074', '#ffe9c4'],
        Bird:      ['#f6d02c', '#c9a316', '#ffe98a', '#ffffff'],
        Stormwing: ['#e8b800', '#9c7a00', '#ffe259', '#fff6c4'],
        Fox:       ['#f0603c', '#b8402a', '#ff9a72', '#ffe0d0'],
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
        Volcanor:  ['#ff5a1f', '#8c2500', '#ffa040', '#ffe8a0']
    },

    // Body shapes, reused across species with different colour ramps
    SHAPES: {
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
        Slime: 'blob',      Oozer: 'blob',
        Rat: 'quadruped',   Rattler: 'quadruped',
        Bird: 'winged',     Stormwing: 'winged',
        Fox: 'quadruped',   Pyrefox: 'quadruped',
        Spider: 'arachnid',   Owl: 'winged',
        Fish: 'finned',     Crab: 'crustacean',   Turtle: 'shelled',
        Bat: 'winged',      Snake: 'serpent',     Golem: 'boulder',
        Scorpion: 'arachnid', Vulture: 'winged', Camel: 'quadruped',
        Volcanor: 'titan'
    },

    // ------------------------------------------------------------------ build

    build(scene) {
        if (scene.textures.exists('player')) return;

        this.buildPlayer(scene);
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

    buildMonsters(scene) {
        const scale = this.SCALE;
        const size = this.CELL * scale;

        DEX_ORDER.forEach((name) => {
            const key = `monster-${name}`;
            if (scene.textures.exists(key)) return;

            const colors = this.MONSTER_COLORS[name] || ['#888888', '#555555', '#bbbbbb', '#ffffff'];
            const palette = {
                ...this.PALETTE,
                '1': colors[0],
                '2': colors[1],
                '3': colors[2],
                '4': colors[3]
            };

            const shape = this.SHAPES[this.SPECIES_SHAPE[name] || 'blob'];
            const texture = scene.textures.createCanvas(key, size, size);
            this.paint(texture.getContext(), shape, 0, 0, palette, scale);
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
