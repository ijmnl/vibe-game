class Minimap {
    constructor(scene, map) {
        this.scene = scene;
        this.map = map;
        this.canvas = document.getElementById('minimap');
        this.ctx = this.canvas.getContext('2d');
        this.playerX = 0;
        this.playerY = 0;
        this.scale = 1; // Scale to fit minimap

        // The terrain never changes, so it is rendered once to an offscreen
        // canvas and blitted each frame instead of redrawing 10.000 tiles.
        this.terrainCanvas = document.createElement('canvas');
        this.terrainCtx = this.terrainCanvas.getContext('2d');

        this.resizeToContainer();
    }

    // Point the minimap at a freshly loaded map
    setMap(map) {
        this.map = map;
        this.resizeToContainer();
    }

    calculateScale() {
        this.scale = Math.min(
            this.canvas.width / this.map.worldWidth,
            this.canvas.height / this.map.worldHeight
        );
    }

    // Match the backing store to the element's CSS size and re-bake the terrain
    resizeToContainer() {
        const rect = this.canvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width) || this.canvas.width);
        const height = Math.max(1, Math.round(rect.height) || this.canvas.height);

        this.canvas.width = width;
        this.canvas.height = height;

        this.calculateScale();
        this.renderTerrain();
        this.draw();
    }

    // Bake the world onto the offscreen canvas
    renderTerrain() {
        const worldData = this.map.tiles;

        this.terrainCanvas.width = this.canvas.width;
        this.terrainCanvas.height = this.canvas.height;

        const ctx = this.terrainCtx;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.terrainCanvas.width, this.terrainCanvas.height);

        // Round up so neighbouring tiles never leave sub-pixel seams
        const tileSize = Math.ceil(this.scale);

        for (let y = 0; y < worldData.length; y++) {
            for (let x = 0; x < worldData[y].length; x++) {
                const tile = worldData[y][x];
                if (!tile) continue;

                const base = TileTextures.BASE_COLORS[tile.type] ?? CONFIG.COLORS.grass;
                ctx.fillStyle = this.intToHex(this.darkenColor(base, 0.75));
                ctx.fillRect(x * this.scale, y * this.scale, tileSize, tileSize);
            }
        }
    }

    setPlayerPosition(position) {
        this.playerX = position.x;
        this.playerY = position.y;
    }

    // Update minimap
    update() {
        this.draw();
    }

    // Draw the minimap
    draw() {
        if (!this.ctx || !this.map) return;

        this.ctx.drawImage(this.terrainCanvas, 0, 0);

        // Draw camera viewport
        if (this.scene.cameras && this.scene.cameras.main) {
            this.drawViewport();
        }

        // Draw player position
        const playerMapX = (this.playerX / CONFIG.TILE_SIZE) * this.scale;
        const playerMapY = (this.playerY / CONFIG.TILE_SIZE) * this.scale;

        this.ctx.fillStyle = '#ff2d2d';
        this.ctx.beginPath();
        this.ctx.arc(playerMapX, playerMapY, Math.max(2, this.scale), 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    // Draw camera viewport on minimap
    drawViewport() {
        const worldView = this.scene.cameras.main.worldView;

        const mapX = (worldView.x / CONFIG.TILE_SIZE) * this.scale;
        const mapY = (worldView.y / CONFIG.TILE_SIZE) * this.scale;
        const mapWidth = (worldView.width / CONFIG.TILE_SIZE) * this.scale;
        const mapHeight = (worldView.height / CONFIG.TILE_SIZE) * this.scale;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
    }

    // Darken a color
    darkenColor(color, factor) {
        const r = Math.floor(((color >> 16) & 0xff) * factor);
        const g = Math.floor(((color >> 8) & 0xff) * factor);
        const b = Math.floor((color & 0xff) * factor);

        return (r << 16) | (g << 8) | b;
    }

    // Convert int color to hex string
    intToHex(color) {
        return '#' + ((1 << 24) + color).toString(16).slice(1);
    }
}
