class Minimap {
    constructor(scene, worldGenerator) {
        this.scene = scene;
        this.worldGenerator = worldGenerator;
        this.canvas = document.getElementById('minimap');
        this.ctx = this.canvas.getContext('2d');
        this.playerX = 0;
        this.playerY = 0;
        this.scale = 1; // Scale to fit minimap
        
        // Calculate scale
        this.calculateScale();
        
        // Set up event listeners
        this.setupEvents();
    }

    calculateScale() {
        this.scale = Math.min(
            this.canvas.width / this.worldGenerator.worldWidth,
            this.canvas.height / this.worldGenerator.worldHeight
        );
    }

    setupEvents() {
        // Listen for player movement
        this.scene.events.on('player-move', (data) => {
            this.playerX = data.x;
            this.playerY = data.y;
            this.draw();
        });

        // Listen for zone changes
        this.scene.events.on('zone-change', () => {
            this.draw();
        });
    }

    // Update minimap
    update() {
        this.draw();
    }

    // Draw the minimap
    draw() {
        if (!this.ctx || !this.worldGenerator) return;

        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw world
        const worldData = this.worldGenerator.worldData;
        
        for (let y = 0; y < worldData.length; y++) {
            for (let x = 0; x < worldData[y].length; x++) {
                const tile = worldData[y][x];
                if (!tile) continue;

                // Convert world coordinates to minimap coordinates
                const mapX = x * this.scale;
                const mapY = y * this.scale;
                const mapWidth = this.scale;
                const mapHeight = this.scale;

                // Get color for zone
                const zone = CONFIG.ZONES[tile.zone];
                let color = zone ? zone.color : CONFIG.COLORS.grass;

                // Darken the color for minimap
                color = this.darkenColor(color, 0.5);

                // Draw tile
                this.ctx.fillStyle = this.intToHex(color);
                this.ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
            }
        }

        // Draw player position
        const playerMapX = (this.playerX / CONFIG.TILE_SIZE) * this.scale;
        const playerMapY = (this.playerY / CONFIG.TILE_SIZE) * this.scale;
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(playerMapX, playerMapY, this.scale * 0.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw player direction indicator
        if (this.scene.player && this.scene.player.direction) {
            this.drawDirectionIndicator(playerMapX, playerMapY);
        }

        // Draw viewport rectangle
        if (this.scene.cameras && this.scene.cameras.main) {
            this.drawViewport();
        }
    }

    // Draw player direction indicator
    drawDirectionIndicator(x, y) {
        const direction = this.scene.player.direction;
        const size = this.scale * 0.8;

        this.ctx.save();
        this.ctx.translate(x, y);

        switch (direction) {
            case 'up':
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(-size/2, -size*2, size, size);
                break;
            case 'down':
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(-size/2, size, size, size);
                break;
            case 'left':
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(-size*2, -size/2, size, size);
                break;
            case 'right':
                this.ctx.fillStyle = '#ffff00';
                this.ctx.fillRect(size, -size/2, size, size);
                break;
        }

        this.ctx.restore();
    }

    // Draw camera viewport on minimap
    drawViewport() {
        const camera = this.scene.cameras.main;
        const worldView = camera.getWorldView();
        
        // Convert world view to minimap coordinates
        const mapX = (worldView.x / CONFIG.TILE_SIZE) * this.scale;
        const mapY = (worldView.y / CONFIG.TILE_SIZE) * this.scale;
        const mapWidth = (worldView.width / CONFIG.TILE_SIZE) * this.scale;
        const mapHeight = (worldView.height / CONFIG.TILE_SIZE) * this.scale;

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
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

    // Resize canvas
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.calculateScale();
        this.draw();
    }
}
