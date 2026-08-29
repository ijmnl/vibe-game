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
        'grass_flower',
        'forest',
        'forest_tree',
        'water',
        'water_edge',
        'cave',
        'cave_rock',
        'sand',
        'sand_rock',
        'path',
        'village_floor',
        'village_wall',
        'village_heal',
        'village_shop',
        'lair'
    ],

    BASE_COLORS: {
        grass: 0x2e8b57,
        grass_flower: 0x2e8b57,
        forest: 0x228b22,
        forest_tree: 0x1a6b1a,
        water: 0x1e90ff,
        water_edge: 0x4aa3ff,
        cave: 0x696969,
        cave_rock: 0x5a5a5a,
        sand: 0xf4a460,
        sand_rock: 0xe0915a,
        path: 0x8b4513,
        village_floor: 0xc9b79a,
        village_wall: 0x8a6a4a,
        village_heal: 0xc9b79a,
        village_shop: 0xc9b79a,
        lair: 0x4a3550
    },

    // Tile index for a generated tile, or -1 when the type is unknown
    indexFor(tile) {
        const typeIndex = this.TYPES.indexOf(tile.type);
        if (typeIndex === -1) return -1;

        const variant = tile.variant % WorldGenerator.TILE_VARIANTS;
        return typeIndex * WorldGenerator.TILE_VARIANTS + variant;
    },

    // Create (once per game) the canvas texture holding every tile variant
    ensureTexture(scene) {
        if (scene.textures.exists(this.TEXTURE_KEY)) {
            return this.TEXTURE_KEY;
        }

        const size = CONFIG.TILE_SIZE;
        const variants = WorldGenerator.TILE_VARIANTS;
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
        const shade = (variant - (WorldGenerator.TILE_VARIANTS - 1) / 2) * 12;

        ctx.fillStyle = this.shiftColor(this.BASE_COLORS[type], shade);
        ctx.fillRect(x, y, size, size);

        switch (type) {
            case 'grass_flower':
                this.drawFlower(ctx, x, y, size, variant);
                break;
            case 'forest_tree':
                this.drawTree(ctx, x, y, size);
                break;
            case 'cave_rock':
            case 'sand_rock':
                this.drawRock(ctx, x, y, size, type === 'cave_rock' ? '#4a4a4a' : '#8b4513');
                break;
            case 'water':
            case 'water_edge':
                this.drawRipples(ctx, x, y, size, variant);
                break;
            case 'path':
                this.drawGravel(ctx, x, y, size, variant);
                break;
            case 'village_floor':
                this.drawPaving(ctx, x, y, size);
                break;
            case 'village_wall':
                this.drawFence(ctx, x, y, size);
                break;
            case 'village_heal':
                this.drawPaving(ctx, x, y, size);
                this.drawPad(ctx, x, y, size, '#ff5a7a', 'cross');
                break;
            case 'village_shop':
                this.drawPaving(ctx, x, y, size);
                this.drawPad(ctx, x, y, size, '#f6d02c', 'coin');
                break;
            case 'lair':
                this.drawLair(ctx, x, y, size);
                break;
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

        const offset = (variant / WorldGenerator.TILE_VARIANTS) * size;

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
