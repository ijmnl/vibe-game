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
        'lair'
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
        lair: 0x4a3550
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
        // Spread the variants evenly around the base colour so neighbouring
        // tiles read as texture rather than as flat blocks.
        const shade = (variant - (WorldMap.TILE_VARIANTS - 1) / 2) * 10;

        ctx.fillStyle = this.shiftColor(this.BASE_COLORS[type], shade);
        ctx.fillRect(x, y, size, size);

        switch (type) {
            case 'tall_grass':
                this.drawBlades(ctx, x, y, size, variant);
                break;
            case 'flowers':
                this.drawFlower(ctx, x, y, size, variant);
                break;
            case 'tree':
                this.drawTree(ctx, x, y, size);
                break;
            case 'rock':
            case 'cliff':
                this.drawRock(ctx, x, y, size, type === 'rock' ? '#5f5866' : '#7a5f38');
                break;
            case 'cave_wall':
                this.drawCaveWall(ctx, x, y, size);
                break;
            case 'water':
            case 'shore':
                this.drawRipples(ctx, x, y, size, variant);
                break;
            case 'path':
            case 'cave_path':
            case 'sand':
                this.drawGravel(ctx, x, y, size, variant);
                break;
            case 'cave_floor':
                this.drawRubble(ctx, x, y, size, variant);
                break;
            case 'sand_patch':
                this.drawScrub(ctx, x, y, size, variant);
                break;
            case 'town_path':
                this.drawPaving(ctx, x, y, size);
                break;
            case 'fence':
                this.drawFence(ctx, x, y, size);
                break;
            case 'building':
                this.drawWall(ctx, x, y, size);
                break;
            case 'building_front':
                this.drawShopFront(ctx, x, y, size);
                break;
            case 'heal_pad':
                this.drawPaving(ctx, x, y, size);
                this.drawPad(ctx, x, y, size, '#ff5a7a', 'cross');
                break;
            case 'shop_pad':
                this.drawPaving(ctx, x, y, size);
                this.drawPad(ctx, x, y, size, '#f6d02c', 'coin');
                break;
            case 'exit':
                this.drawExit(ctx, x, y, size);
                break;
            case 'lair':
                this.drawLair(ctx, x, y, size);
                break;
        }
    },

    // Tufts marking ground that hides monsters
    drawBlades(ctx, x, y, size, variant) {
        ctx.fillStyle = 'rgba(20, 60, 25, 0.55)';

        for (let i = 0; i < 5; i++) {
            const bx = x + ((i * 7 + variant * 3) % (size - 3));
            const by = y + ((i * 5 + variant * 2) % (size - 6));
            ctx.fillRect(bx, by + 3, 2, 5);
            ctx.fillRect(bx + 2, by, 2, 8);
        }
    },

    // Loose stones: marks cave ground where monsters lurk
    drawRubble(ctx, x, y, size, variant) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';

        for (let i = 0; i < 5; i++) {
            const rx = x + ((i * 9 + variant * 4) % (size - 5));
            const ry = y + ((i * 6 + variant * 5) % (size - 5));
            ctx.fillRect(rx, ry, 4, 3);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
        ctx.fillRect(x + 2, y + size - 5, size - 4, 2);
    },

    // Dry scrub: the desert equivalent of tall grass
    drawScrub(ctx, x, y, size, variant) {
        ctx.fillStyle = 'rgba(70, 50, 20, 0.5)';

        for (let i = 0; i < 4; i++) {
            const sx = x + ((i * 8 + variant * 3) % (size - 4));
            const sy = y + ((i * 7 + variant * 2) % (size - 8));
            ctx.fillRect(sx, sy + 4, 2, 5);
            ctx.fillRect(sx + 2, sy + 1, 2, 8);
        }
    },

    drawCaveWall(ctx, x, y, size) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(x, y, size, size * 0.25);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(x + size * 0.15, y + size * 0.45, size * 0.3, size * 0.12);
        ctx.fillRect(x + size * 0.55, y + size * 0.7, size * 0.28, size * 0.1);
    },

    drawWall(ctx, x, y, size) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1;

        for (let row = 0; row < 3; row++) {
            const yy = y + (row + 1) * size / 3;
            ctx.beginPath();
            ctx.moveTo(x, yy - 0.5);
            ctx.lineTo(x + size, yy - 0.5);
            ctx.stroke();
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(x, y, size, 2);
    },

    // The ground floor of a building, with a door
    drawShopFront(ctx, x, y, size) {
        ctx.fillStyle = '#5a4436';
        ctx.fillRect(x + size * 0.3, y + size * 0.25, size * 0.4, size * 0.75);

        ctx.fillStyle = '#f6d02c';
        ctx.fillRect(x + size * 0.6, y + size * 0.55, size * 0.06, size * 0.06);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(x, y, size, size * 0.12);
    },

    drawExit(ctx, x, y, size) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.fillRect(x, y, size, size);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(x + size * 0.2, y + size * (0.2 + i * 0.25), size * 0.6, 2);
        }
    },

    drawFlower(ctx, x, y, size, variant) {
        const colors = ['#ffe066', '#ff8fab', '#ffffff', '#c77dff'];
        ctx.fillStyle = colors[variant % colors.length];

        const cx = x + size * 0.5;
        const cy = y + size * 0.5;
        const petal = Math.max(2, size * 0.09);

        ctx.fillRect(cx - petal / 2, cy - petal * 1.6, petal, petal);
        ctx.fillRect(cx - petal / 2, cy + petal * 0.6, petal, petal);
        ctx.fillRect(cx - petal * 1.6, cy - petal / 2, petal, petal);
        ctx.fillRect(cx + petal * 0.6, cy - petal / 2, petal, petal);

        ctx.fillStyle = '#ffd60a';
        ctx.fillRect(cx - petal / 2, cy - petal / 2, petal, petal);
    },

    drawTree(ctx, x, y, size) {
        // Trunk
        ctx.fillStyle = '#6b3f1d';
        ctx.fillRect(x + size * 0.42, y + size * 0.55, size * 0.16, size * 0.35);

        // Canopy
        ctx.fillStyle = '#2f7d32';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y + size * 0.42, size * 0.34, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3f9c42';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.43, y + size * 0.36, size * 0.18, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
    },

    drawRock(ctx, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y + size * 0.58, size * 0.3, size * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.42, y + size * 0.5, size * 0.12, size * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
    },

    drawRipples(ctx, x, y, size, variant) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = Math.max(1, size * 0.05);

        const offset = (variant / WorldMap.TILE_VARIANTS) * size;

        ctx.beginPath();
        ctx.moveTo(x, y + (offset + size * 0.3) % size);
        ctx.lineTo(x + size, y + (offset + size * 0.3) % size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, y + (offset + size * 0.75) % size);
        ctx.lineTo(x + size, y + (offset + size * 0.75) % size);
        ctx.stroke();
    },

    drawGravel(ctx, x, y, size, variant) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';

        // Deterministic speckles so the four variants differ but stay stable
        for (let i = 0; i < 6; i++) {
            const sx = x + ((i * 7 + variant * 5) % size);
            const sy = y + ((i * 11 + variant * 3) % size);
            ctx.fillRect(sx, sy, 2, 2);
        }
    },

    drawPaving(ctx, x, y, size) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, size / 2 - 1, size / 2 - 1);
        ctx.strokeRect(x + size / 2 + 0.5, y + size / 2 + 0.5, size / 2 - 1, size / 2 - 1);
    },

    drawFence(ctx, x, y, size) {
        ctx.fillStyle = '#6b4a2a';
        ctx.fillRect(x + size * 0.1, y + size * 0.25, size * 0.8, size * 0.12);
        ctx.fillRect(x + size * 0.1, y + size * 0.6, size * 0.8, size * 0.12);
        ctx.fillRect(x + size * 0.2, y + size * 0.15, size * 0.12, size * 0.7);
        ctx.fillRect(x + size * 0.68, y + size * 0.15, size * 0.12, size * 0.7);
    },

    // The marker painted on a heal pad or a shop tile
    drawPad(ctx, x, y, size, color, glyph) {
        ctx.fillStyle = color;
        ctx.fillRect(x + size * 0.12, y + size * 0.12, size * 0.76, size * 0.76);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(x + size * 0.12, y + size * 0.78, size * 0.76, size * 0.1);

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

    drawLair(ctx, x, y, size) {
        ctx.fillStyle = '#2a1c33';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y + size * 0.5, size * 0.36, size * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff8a3c';
        ctx.beginPath();
        ctx.ellipse(x + size * 0.5, y + size * 0.5, size * 0.14, size * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
    },

    shiftColor(color, amount) {
        const r = clamp(((color >> 16) & 0xff) + amount, 0, 255);
        const g = clamp(((color >> 8) & 0xff) + amount, 0, 255);
        const b = clamp((color & 0xff) + amount, 0, 255);

        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    }
};
