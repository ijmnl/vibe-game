/**
 * Builds the tileset texture the world layer is drawn from.
 *
 * The world is 100x100 tiles. Drawing those as individual game objects costs
 * thousands of draw calls per frame, which a phone GPU will not keep up with,
 * so every tile is baked into one texture up front and the world is rendered
 * as a single culled tilemap layer instead.
 */
const TileTextures = {
    TEXTURE_KEY: 'world-tiles',

    // Order defines the tile index: index = TYPES.indexOf(type) * VARIANTS + variant
    TYPES: [
        'grass',
        'tall_grass',
        'path',
        'forest_floor',
        'tree',
        'shore',
        'water',
        'cave_floor',
        'cave_path',
        'cave_wall',
        'rock',
        'sand',
        'sand_patch',
        'cliff',
        'town_grass',
        'town_path',
        'flowers',
        'building',
        'building_front',
        'fence',
        'heal_pad',
        'shop_pad',
        'exit',
        'item_ball',
        'den'
    ],

    BASE_COLORS: {
        grass: 0x4a9e52,
        tall_grass: 0x2f7a3a,
        path: 0xc2a878,
        forest_floor: 0x3d7a44,
        tree: 0x2a5c32,
        shore: 0x9fc6a8,
        water: 0x3a7fd0,
        cave_floor: 0x4f4a5e,
        cave_path: 0x968ea2,
        cave_wall: 0x453f52,
        rock: 0x7a7280,
        sand: 0xe8cb96,
        sand_patch: 0xb08a4e,
        cliff: 0x9a7a4a,
        town_grass: 0x5aa85e,
        town_path: 0xc9b79a,
        flowers: 0x5aa85e,
        building: 0xb85c4a,
        building_front: 0x8a6a52,
        fence: 0x8a6a4a,
        heal_pad: 0xc9b79a,
        shop_pad: 0xc9b79a,
        exit: 0xd8c9a8,
        item_ball: 0x8a7a5a,
        den: 0x6b6274
    },

    // Tile index for a generated tile, or -1 when the type is unknown
    indexFor(tile) {
        const typeIndex = this.TYPES.indexOf(tile.type);
        if (typeIndex === -1) return -1;

        const variant = tile.variant % WorldMap.TILE_VARIANTS;
        return typeIndex * WorldMap.TILE_VARIANTS + variant;
    },

    // Create (once per game) the canvas texture holding every tile variant
    ensureTexture(scene) {
        if (scene.textures.exists(this.TEXTURE_KEY)) {
            return this.TEXTURE_KEY;
        }

        const size = CONFIG.TILE_SIZE;
        const variants = WorldMap.TILE_VARIANTS;
        const texture = scene.textures.createCanvas(
            this.TEXTURE_KEY,
            size * variants,
            size * this.TYPES.length
        );
        const ctx = texture.getContext();

        this.TYPES.forEach((type, row) => {
            for (let variant = 0; variant < variants; variant++) {
                this.drawTile(ctx, type, variant, variant * size, row * size, size);
            }
        });

        texture.refresh();
        return this.TEXTURE_KEY;
    },

    drawTile(ctx, type, variant, x, y, size) {
        // Nudge the variants around the base colour so neighbouring tiles read
        // as texture. Kept small: now that every tile carries its own noise
        // and detail, a larger step turns a field into visible patchwork.
        const shade = (variant - (WorldMap.TILE_VARIANTS - 1) / 2) * 3;
        const base = this.BASE_COLORS[type];

        ctx.fillStyle = this.shiftColor(base, shade);
        ctx.fillRect(x, y, size, size);

        // Flat 32px squares read as plastic. A scatter of slightly lighter and
        // slightly darker pixels is the cheapest thing that fixes it.
        if (!this.SMOOTH_TILES.has(type)) {
            this.speckle(ctx, x, y, size, variant, type);
        }

        switch (type) {
            case 'grass':
            case 'town_grass':
                this.drawTurf(ctx, x, y, size, variant);
                break;
            case 'tall_grass':
                this.drawBlades(ctx, x, y, size, variant);
                break;
            case 'forest_floor':
                this.drawLeafLitter(ctx, x, y, size, variant);
                break;
            case 'flowers':
                this.drawTurf(ctx, x, y, size, variant);
                this.drawFlowers(ctx, x, y, size, variant);
                break;
            case 'tree':
                this.drawTree(ctx, x, y, size, variant);
                break;
            case 'rock':
                this.drawBoulder(ctx, x, y, size, variant, '#8b8494', '#4e4857');
                break;
            case 'cliff':
                this.drawBoulder(ctx, x, y, size, variant, '#c2a06a', '#6d5230');
                break;
            case 'cave_wall':
                this.drawCaveWall(ctx, x, y, size, variant);
                break;
            case 'water':
                this.drawWater(ctx, x, y, size, variant);
                break;
            case 'shore':
                this.drawShore(ctx, x, y, size, variant);
                break;
            case 'path':
            case 'cave_path':
                this.drawCobbles(ctx, x, y, size, variant);
                break;
            case 'sand':
                this.drawDuneRipples(ctx, x, y, size, variant);
                break;
            case 'cave_floor':
                this.drawRubble(ctx, x, y, size, variant);
                break;
            case 'sand_patch':
                this.drawScrub(ctx, x, y, size, variant);
                break;
            case 'town_path':
                this.drawPaving(ctx, x, y, size, variant);
                break;
            case 'fence':
                this.drawFence(ctx, x, y, size);
                break;
            case 'building':
                this.drawWall(ctx, x, y, size, variant);
                break;
            case 'building_front':
                this.drawShopFront(ctx, x, y, size);
                break;
            case 'heal_pad':
                this.drawPaving(ctx, x, y, size, variant);
                this.drawPad(ctx, x, y, size, '#ff5a7a', 'cross');
                break;
            case 'shop_pad':
                this.drawPaving(ctx, x, y, size, variant);
                this.drawPad(ctx, x, y, size, '#f6d02c', 'coin');
                break;
            case 'exit':
                this.drawExit(ctx, x, y, size);
                break;
            case 'den':
                this.drawDen(ctx, x, y, size);
                break;
        }
    },

    // Tiles that draw their own surface and would only be muddied by noise
    SMOOTH_TILES: new Set(['water', 'building', 'building_front', 'exit', 'den',
                           'heal_pad', 'shop_pad', 'tree']),

    // Stable pseudo-random in [0, 1) - the tileset is baked once, but it has
    // to bake the same way every time or the world flickers between loads.
    noise(index, seed) {
        const value = Math.sin((index + 1) * 12.9898 + seed * 78.233) * 43758.5453;

        return value - Math.floor(value);
    },

    speckle(ctx, x, y, size, variant, type) {
        const seed = variant * 7 + this.TYPES.indexOf(type) * 13;

        for (let i = 0; i < 26; i++) {
            const px = x + Math.floor(this.noise(i, seed) * size);
            const py = y + Math.floor(this.noise(i + 40, seed) * size);
            const light = this.noise(i + 80, seed) > 0.5;

            ctx.fillStyle = light ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.09)';
            ctx.fillRect(px, py, 2, 2);
        }
    },

    // Short blades over plain grass, so a field is not a green sheet
    drawTurf(ctx, x, y, size, variant) {
        const seed = variant * 3 + 1;

        for (let i = 0; i < 7; i++) {
            const bx = x + Math.floor(this.noise(i, seed) * (size - 3));
            const by = y + Math.floor(this.noise(i + 20, seed) * (size - 5));

            ctx.fillStyle = 'rgba(255, 255, 255, 0.13)';
            ctx.fillRect(bx, by, 1, 3);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.13)';
            ctx.fillRect(bx + 1, by + 1, 1, 3);
        }
    },

    // Tufts marking ground that hides monsters: taller, denser, lit at the tip
    drawBlades(ctx, x, y, size, variant) {
        const seed = variant * 5 + 2;

        for (let i = 0; i < 9; i++) {
            const bx = x + Math.floor(this.noise(i, seed) * (size - 4));
            const by = y + Math.floor(this.noise(i + 30, seed) * (size - 11));
            const tall = 7 + Math.floor(this.noise(i + 60, seed) * 4);

            ctx.fillStyle = 'rgba(16, 54, 22, 0.62)';
            ctx.fillRect(bx, by + 2, 2, tall);
            ctx.fillRect(bx + 2, by + 4, 2, tall - 3);

            ctx.fillStyle = 'rgba(150, 230, 150, 0.42)';
            ctx.fillRect(bx, by + 2, 2, 2);
        }
    },

    drawLeafLitter(ctx, x, y, size, variant) {
        const seed = variant * 11 + 3;

        for (let i = 0; i < 6; i++) {
            const lx = x + Math.floor(this.noise(i, seed) * (size - 5));
            const ly = y + Math.floor(this.noise(i + 25, seed) * (size - 4));

            ctx.fillStyle = this.noise(i + 50, seed) > 0.5
                ? 'rgba(120, 90, 40, 0.35)'
                : 'rgba(60, 110, 60, 0.35)';
            ctx.fillRect(lx, ly, 4, 2);
        }
    },

    // Loose stones: marks cave ground where monsters lurk
    drawRubble(ctx, x, y, size, variant) {
        const seed = variant * 9 + 4;

        for (let i = 0; i < 7; i++) {
            const rx = x + Math.floor(this.noise(i, seed) * (size - 6));
            const ry = y + Math.floor(this.noise(i + 35, seed) * (size - 5));

            ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
            ctx.fillRect(rx, ry + 1, 5, 3);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
            ctx.fillRect(rx, ry, 5, 1);
        }
    },

    // Dry scrub: the desert equivalent of tall grass
    drawScrub(ctx, x, y, size, variant) {
        const seed = variant * 13 + 5;

        for (let i = 0; i < 6; i++) {
            const sx = x + Math.floor(this.noise(i, seed) * (size - 5));
            const sy = y + Math.floor(this.noise(i + 45, seed) * (size - 10));

            ctx.fillStyle = 'rgba(74, 52, 20, 0.55)';
            ctx.fillRect(sx, sy + 4, 2, 6);
            ctx.fillRect(sx + 2, sy + 1, 2, 9);
            ctx.fillStyle = 'rgba(235, 205, 140, 0.4)';
            ctx.fillRect(sx + 2, sy + 1, 2, 2);
        }
    },

    drawDuneRipples(ctx, x, y, size, variant) {
        ctx.strokeStyle = 'rgba(150, 110, 60, 0.22)';
        ctx.lineWidth = 1;

        for (let i = 0; i < 3; i++) {
            const yy = y + ((variant * 5 + i * 11) % size) + 0.5;
            ctx.beginPath();
            ctx.moveTo(x, yy);
            ctx.quadraticCurveTo(x + size / 2, yy - 3, x + size, yy);
            ctx.stroke();
        }
    },

    drawCaveWall(ctx, x, y, size, variant) {
        // A lit top face and a dark body, so a wall reads as standing up
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.fillRect(x, y, size, Math.max(2, size * 0.14));
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x, y + size * 0.72, size, size * 0.28);

        const seed = variant * 17 + 6;
        for (let i = 0; i < 3; i++) {
            const cx = x + Math.floor(this.noise(i, seed) * (size - 10));
            const cy = y + size * 0.3 + Math.floor(this.noise(i + 15, seed) * (size * 0.35));

            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.fillRect(cx, cy, 8, 2);
        }
    },

    drawWall(ctx, x, y, size, variant) {
        const courses = 4;
        const height = size / courses;

        for (let row = 0; row < courses; row++) {
            const yy = y + row * height;
            const offset = row % 2 ? size * 0.25 : 0;

            ctx.fillStyle = row % 2
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(0, 0, 0, 0.06)';
            ctx.fillRect(x, yy, size, height);

            // Mortar
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.fillRect(x, yy + height - 1, size, 1);
            for (let brick = 0; brick <= 2; brick++) {
                ctx.fillRect(x + (offset + brick * size * 0.5) % size, yy, 1, height);
            }
        }

        // Eaves along the top edge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.fillRect(x, y, size, 2);
    },

    // The ground floor of a building, with a door and a lit window
    drawShopFront(ctx, x, y, size) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(x, y, size, size * 0.14);

        // Door, recessed and framed
        ctx.fillStyle = '#3f2e22';
        ctx.fillRect(x + size * 0.28, y + size * 0.22, size * 0.44, size * 0.78);
        ctx.fillStyle = '#5a4436';
        ctx.fillRect(x + size * 0.32, y + size * 0.26, size * 0.36, size * 0.74);

        // Handle
        ctx.fillStyle = '#f6d02c';
        ctx.fillRect(x + size * 0.6, y + size * 0.56, size * 0.06, size * 0.06);

        // Step
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(x + size * 0.24, y + size * 0.94, size * 0.52, size * 0.06);

        // Window beside the door
        ctx.fillStyle = '#7fc4ff';
        ctx.fillRect(x + size * 0.06, y + size * 0.3, size * 0.16, size * 0.2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(x + size * 0.06, y + size * 0.3, size * 0.16, size * 0.05);
    },

    drawExit(ctx, x, y, size) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.fillRect(x, y, size, size);

        // Chevrons pointing the way out
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const yy = y + size * (0.24 + i * 0.24);
            ctx.beginPath();
            ctx.moveTo(x + size * 0.28, yy + size * 0.1);
            ctx.lineTo(x + size * 0.5, yy);
            ctx.lineTo(x + size * 0.72, yy + size * 0.1);
            ctx.stroke();
        }
    },

    // A small cluster rather than one bloom, so a flower bed looks planted
    drawFlowers(ctx, x, y, size, variant) {
        const palettes = [
            ['#ffe066', '#ffd60a'],
            ['#ff8fab', '#e05a7a'],
            ['#ffffff', '#e0e0e0'],
            ['#c77dff', '#9d4edd']
        ];
        const [petal, centre] = palettes[variant % palettes.length];
        const seed = variant * 19 + 7;

        for (let i = 0; i < 3; i++) {
            const cx = x + size * 0.22 + Math.floor(this.noise(i, seed) * size * 0.55);
            const cy = y + size * 0.22 + Math.floor(this.noise(i + 10, seed) * size * 0.5);
            const r = Math.max(2, Math.round(size * 0.07));

            ctx.fillStyle = 'rgba(40, 90, 45, 0.5)';
            ctx.fillRect(cx, cy + r, 1, r * 2);

            ctx.fillStyle = petal;
            ctx.fillRect(cx - r, cy - r * 2, r, r);
            ctx.fillRect(cx - r, cy, r, r);
            ctx.fillRect(cx - r * 2, cy - r, r, r);
            ctx.fillRect(cx, cy - r, r, r);

            ctx.fillStyle = centre;
            ctx.fillRect(cx - r, cy - r, r, r);
        }
    },

    drawTree(ctx, x, y, size, variant) {
        // Shadow on the ground first, so the tree sits on the tile
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y + size * 0.88, size * 0.3, size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk, lit down one side
        ctx.fillStyle = '#4a2b14';
        ctx.fillRect(x + size * 0.42, y + size * 0.54, size * 0.16, size * 0.36);
        ctx.fillStyle = '#6b3f1d';
        ctx.fillRect(x + size * 0.42, y + size * 0.54, size * 0.07, size * 0.36);

        // Canopy in three layers: shadow, body, sunlit top
        const cx = x + size * 0.5;
        const cy = y + size * 0.4;

        ctx.fillStyle = '#1f5424';
        ctx.beginPath();
        ctx.ellipse(cx, cy + size * 0.04, size * 0.36, size * 0.31, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2f7d32';
        ctx.beginPath();
        ctx.ellipse(cx, cy, size * 0.33, size * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#49a84c';
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.08, cy - size * 0.07, size * 0.19, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(190, 240, 170, 0.5)';
        ctx.beginPath();
        ctx.ellipse(cx - size * 0.13, cy - size * 0.11, size * 0.08, size * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        // A couple of leaf clumps breaking the outline
        const seed = variant * 23 + 8;
        for (let i = 0; i < 3; i++) {
            const lx = cx + (this.noise(i, seed) - 0.5) * size * 0.7;
            const ly = cy + (this.noise(i + 12, seed) - 0.5) * size * 0.55;

            ctx.fillStyle = 'rgba(31, 84, 36, 0.9)';
            ctx.beginPath();
            ctx.ellipse(lx, ly, size * 0.09, size * 0.07, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawBoulder(ctx, x, y, size, variant, light, dark) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y + size * 0.8, size * 0.32, size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Faceted rather than round: two flat planes catch the light differently
        const top = y + size * 0.26;
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.16, y + size * 0.78);
        ctx.lineTo(x + size * 0.3, top);
        ctx.lineTo(x + size * 0.72, top + size * 0.06);
        ctx.lineTo(x + size * 0.86, y + size * 0.78);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = light;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.16, y + size * 0.78);
        ctx.lineTo(x + size * 0.3, top);
        ctx.lineTo(x + size * 0.5, top + size * 0.1);
        ctx.lineTo(x + size * 0.44, y + size * 0.78);
        ctx.closePath();
        ctx.fill();

        // A crack, placed by variant
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + size * (0.45 + variant * 0.04), top + size * 0.14);
        ctx.lineTo(x + size * (0.55 + variant * 0.03), y + size * 0.66);
        ctx.stroke();
    },

    drawWater(ctx, x, y, size, variant) {
        // Depth: darker toward the bottom of the tile
        ctx.fillStyle = 'rgba(0, 0, 40, 0.18)';
        ctx.fillRect(x, y + size * 0.5, size, size * 0.5);

        const offset = (variant / WorldMap.TILE_VARIANTS) * size;

        for (let i = 0; i < 2; i++) {
            const yy = y + (offset + size * (0.28 + i * 0.42)) % size;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, yy);
            ctx.quadraticCurveTo(x + size * 0.5, yy - 3, x + size, yy);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(0, 0, 60, 0.18)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, yy + 3);
            ctx.quadraticCurveTo(x + size * 0.5, yy, x + size, yy + 3);
            ctx.stroke();
        }

        // A glint, so open water is not a flat band
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(x + size * (0.2 + variant * 0.15), y + size * 0.2, 3, 2);
    },

    drawShore(ctx, x, y, size, variant) {
        // Wet sand with the water's edge lapping over it
        ctx.fillStyle = 'rgba(60, 120, 190, 0.22)';
        ctx.fillRect(x, y, size, size * 0.4);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2;
        const yy = y + size * (0.36 + (variant % 2) * 0.08);
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.quadraticCurveTo(x + size * 0.5, yy + 4, x + size, yy);
        ctx.stroke();

        const seed = variant * 29 + 9;
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = 'rgba(120, 100, 70, 0.3)';
            ctx.fillRect(
                x + Math.floor(this.noise(i, seed) * (size - 3)),
                y + size * 0.55 + Math.floor(this.noise(i + 18, seed) * size * 0.4),
                2, 2
            );
        }
    },

    // Individual stones with an outline: reads as a trodden path, not a rug
    drawCobbles(ctx, x, y, size, variant) {
        const seed = variant * 31 + 10;

        for (let i = 0; i < 5; i++) {
            const w = 6 + Math.floor(this.noise(i, seed) * 6);
            const h = 4 + Math.floor(this.noise(i + 22, seed) * 4);
            const sx = x + Math.floor(this.noise(i + 44, seed) * (size - w));
            const sy = y + Math.floor(this.noise(i + 66, seed) * (size - h));

            ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
            ctx.fillRect(sx, sy + 1, w, h);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
            ctx.fillRect(sx, sy, w, h - 1);
        }
    },

    drawPaving(ctx, x, y, size, variant = 0) {
        const half = size / 2;

        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 2; col++) {
                const sx = x + col * half;
                const sy = y + row * half;

                ctx.fillStyle = (row + col + variant) % 2
                    ? 'rgba(255, 255, 255, 0.07)'
                    : 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(sx, sy, half, half);

                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.lineWidth = 1;
                ctx.strokeRect(sx + 0.5, sy + 0.5, half - 1, half - 1);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
                ctx.fillRect(sx + 1, sy + 1, half - 2, 1);
            }
        }
    },

    drawFence(ctx, x, y, size) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x + size * 0.1, y + size * 0.86, size * 0.8, size * 0.06);

        ctx.fillStyle = '#8a6a4a';
        ctx.fillRect(x + size * 0.1, y + size * 0.25, size * 0.8, size * 0.12);
        ctx.fillRect(x + size * 0.1, y + size * 0.6, size * 0.8, size * 0.12);

        ctx.fillStyle = '#6b4a2a';
        ctx.fillRect(x + size * 0.2, y + size * 0.15, size * 0.12, size * 0.72);
        ctx.fillRect(x + size * 0.68, y + size * 0.15, size * 0.12, size * 0.72);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x + size * 0.1, y + size * 0.25, size * 0.8, 1);
        ctx.fillRect(x + size * 0.2, y + size * 0.15, 2, size * 0.72);
    },

    // The marker painted on a heal pad or a shop tile
    drawPad(ctx, x, y, size, color, glyph) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(x + size * 0.14, y + size * 0.18, size * 0.76, size * 0.76);

        ctx.fillStyle = color;
        ctx.fillRect(x + size * 0.12, y + size * 0.12, size * 0.76, size * 0.76);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x + size * 0.12, y + size * 0.12, size * 0.76, size * 0.08);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fillRect(x + size * 0.12, y + size * 0.8, size * 0.76, size * 0.08);

        ctx.fillStyle = '#ffffff';
        if (glyph === 'cross') {
            ctx.fillRect(x + size * 0.42, y + size * 0.24, size * 0.16, size * 0.52);
            ctx.fillRect(x + size * 0.24, y + size * 0.42, size * 0.52, size * 0.16);
        } else {
            ctx.beginPath();
            ctx.ellipse(x + size * 0.5, y + size * 0.5, size * 0.2, size * 0.24, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = color;
            ctx.fillRect(x + size * 0.46, y + size * 0.32, size * 0.08, size * 0.36);
        }
    },

    // The mouth of the den at the summit: rock, and something warm inside it
    drawDen(ctx, x, y, size) {
        ctx.fillStyle = '#6b6274';
        ctx.fillRect(x, y, size, size);

        ctx.fillStyle = '#4a4454';
        ctx.beginPath();
        ctx.moveTo(x + size * 0.1, y + size * 0.95);
        ctx.lineTo(x + size * 0.24, y + size * 0.2);
        ctx.lineTo(x + size * 0.76, y + size * 0.2);
        ctx.lineTo(x + size * 0.9, y + size * 0.95);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1c1822';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y + size * 0.62, size * 0.3, size * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 150, 60, 0.55)';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y + size * 0.66, size * 0.15, size * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 220, 150, 0.75)';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y + size * 0.68, size * 0.06, size * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(x, y, size, 2);
    },

    shiftColor(color, amount) {
        const r = clamp(((color >> 16) & 0xff) + amount, 0, 255);
        const g = clamp(((color >> 8) & 0xff) + amount, 0, 255);
        const b = clamp((color & 0xff) + amount, 0, 255);

        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
};
