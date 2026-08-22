class WorldGenerator {
    constructor() {
        this.worldWidth = CONFIG.WORLD_WIDTH;
        this.worldHeight = CONFIG.WORLD_HEIGHT;
        this.tileSize = CONFIG.TILE_SIZE;
        this.zoneSize = CONFIG.ZONE_SIZE;
        this.worldData = [];
        this.collisionMap = [];
        this.zoneMap = [];
    }

    // Generate the entire world
    generate() {
        this.generateZones();
        this.generateTerrain();
        this.generatePaths();
        this.generateCollisionMap();
        return this.worldData;
    }

    // Divide world into zones
    generateZones() {
        const zones = Object.keys(CONFIG.ZONES);
        const numZonesX = Math.ceil(this.worldWidth / this.zoneSize);
        const numZonesY = Math.ceil(this.worldHeight / this.zoneSize);

        for (let y = 0; y < numZonesY; y++) {
            this.zoneMap[y] = [];
            for (let x = 0; x < numZonesX; x++) {
                // Create a zone pattern for variety
                let zoneType;
                
                // Center zone is grass (starting area)
                if (x === Math.floor(numZonesX / 2) && y === Math.floor(numZonesY / 2)) {
                    zoneType = 'GRASS';
                }
                // Create some water zones
                else if ((x + y) % 4 === 0 && Math.random() > 0.5) {
                    zoneType = 'WATER';
                }
                // Create forest zones
                else if ((x + y) % 3 === 0 && Math.random() > 0.4) {
                    zoneType = 'FOREST';
                }
                // Create cave zones
                else if (Math.random() > 0.8) {
                    zoneType = 'CAVE';
                }
                // Create desert zones
                else if (Math.random() > 0.7) {
                    zoneType = 'SAND';
                }
                // Default to grass
                else {
                    zoneType = 'GRASS';
                }
                
                this.zoneMap[y][x] = zoneType;
            }
        }
    }

    // Generate terrain based on zones
    generateTerrain() {
        const numZonesX = Math.ceil(this.worldWidth / this.zoneSize);
        const numZonesY = Math.ceil(this.worldHeight / this.zoneSize);

        for (let y = 0; y < this.worldHeight; y++) {
            this.worldData[y] = [];
            for (let x = 0; x < this.worldWidth; x++) {
                // Determine which zone this tile belongs to
                const zoneX = Math.floor(x / this.zoneSize);
                const zoneY = Math.floor(y / this.zoneSize);
                const zoneType = this.zoneMap[zoneY]?.[zoneX] || 'GRASS';
                
                // Get base color for zone
                let baseColor = CONFIG.ZONES[zoneType].color;
                
                // Add some variation to the color
                const variation = this.getColorVariation(baseColor);
                
                // Add some random details (trees, rocks, etc.)
                let tileType = zoneType.toLowerCase();
                
                // Add paths between zones
                if (this.isPathTile(x, y, zoneX, zoneY)) {
                    tileType = 'path';
                    baseColor = CONFIG.COLORS.path;
                }
                // Add water edges
                else if (zoneType === 'WATER' && this.isEdgeTile(x, y, zoneX, zoneY, 'WATER')) {
                    tileType = 'water_edge';
                }
                // Add forest details
                else if (zoneType === 'FOREST' && Math.random() > 0.7) {
                    tileType = 'forest_tree';
                    baseColor = 0x006400; // Darker green for trees
                }
                // Add cave details
                else if (zoneType === 'CAVE' && Math.random() > 0.6) {
                    tileType = 'cave_rock';
                    baseColor = 0x404040;
                }
                // Add sand details
                else if (zoneType === 'SAND' && Math.random() > 0.8) {
                    tileType = 'sand_rock';
                    baseColor = 0x8b4513;
                }
                // Add grass details
                else if (zoneType === 'GRASS' && Math.random() > 0.85) {
                    tileType = 'grass_flower';
                    baseColor = 0x228b22;
                }

                this.worldData[y][x] = {
                    type: tileType,
                    zone: zoneType,
                    color: variation,
                    collision: false
                };
            }
        }
    }

    // Generate paths between zones
    generatePaths() {
        const numZonesX = Math.ceil(this.worldWidth / this.zoneSize);
        const numZonesY = Math.ceil(this.worldHeight / this.zoneSize);
        
        // Create horizontal paths
        for (let zoneY = 0; zoneY < numZonesY; zoneY++) {
            for (let zoneX = 0; zoneX < numZonesX - 1; zoneX++) {
                const midY = Math.floor((zoneY * this.zoneSize) + this.zoneSize / 2);
                const startX = (zoneX + 1) * this.zoneSize - 2;
                const endX = (zoneX + 1) * this.zoneSize + 2;
                
                for (let x = startX; x <= endX && x < this.worldWidth; x++) {
                    if (midY < this.worldHeight) {
                        this.worldData[midY][x].type = 'path';
                        this.worldData[midY][x].color = CONFIG.COLORS.path;
                    }
                }
            }
        }
        
        // Create vertical paths
        for (let zoneX = 0; zoneX < numZonesX; zoneX++) {
            for (let zoneY = 0; zoneY < numZonesY - 1; zoneY++) {
                const midX = Math.floor((zoneX * this.zoneSize) + this.zoneSize / 2);
                const startY = (zoneY + 1) * this.zoneSize - 2;
                const endY = (zoneY + 1) * this.zoneSize + 2;
                
                for (let y = startY; y <= endY && y < this.worldHeight; y++) {
                    if (midX < this.worldWidth) {
                        this.worldData[y][midX].type = 'path';
                        this.worldData[y][midX].color = CONFIG.COLORS.path;
                    }
                }
            }
        }
    }

    // Generate collision map
    generateCollisionMap() {
        for (let y = 0; y < this.worldHeight; y++) {
            this.collisionMap[y] = [];
            for (let x = 0; x < this.worldWidth; x++) {
                const tile = this.worldData[y][x];
                
                // Water, trees, rocks, and some other tiles are collidable
                if (tile.type === 'water' || 
                    tile.type === 'forest_tree' || 
                    tile.type === 'cave_rock' ||
                    tile.type === 'sand_rock' ||
                    tile.type === 'water_edge') {
                    this.collisionMap[y][x] = true;
                } else {
                    this.collisionMap[y][x] = false;
                }
            }
        }
    }

    // Check if tile is on the edge of its zone
    isEdgeTile(x, y, zoneX, zoneY, zoneType) {
        const zoneStartX = zoneX * this.zoneSize;
        const zoneStartY = zoneY * this.zoneSize;
        const zoneEndX = zoneStartX + this.zoneSize;
        const zoneEndY = zoneStartY + this.zoneSize;
        
        return x === zoneStartX || x === zoneEndX - 1 || y === zoneStartY || y === zoneEndY - 1;
    }

    // Check if tile should be a path
    isPathTile(x, y, zoneX, zoneY) {
        // Check if this is near a zone boundary
        const zoneStartX = zoneX * this.zoneSize;
        const zoneStartY = zoneY * this.zoneSize;
        
        const isNearXBoundary = Math.abs(x - zoneStartX) < 3 || Math.abs(x - (zoneStartX + this.zoneSize)) < 3;
        const isNearYBoundary = Math.abs(y - zoneStartY) < 3 || Math.abs(y - (zoneStartY + this.zoneSize)) < 3;
        
        return isNearXBoundary || isNearYBoundary;
    }

    // Add color variation
    getColorVariation(baseColor) {
        const r = (baseColor >> 16) & 0xff;
        const g = (baseColor >> 8) & 0xff;
        const b = baseColor & 0xff;
        
        // Add small random variation
        const variation = Math.floor(Math.random() * 30) - 15;
        
        return ((Math.max(0, Math.min(255, r + variation))) << 16) |
               ((Math.max(0, Math.min(255, g + variation))) << 8) |
               (Math.max(0, Math.min(255, b + variation)));
    }

    // Get zone at position
    getZoneAt(x, y) {
        const zoneX = Math.floor(x / this.zoneSize);
        const zoneY = Math.floor(y / this.zoneSize);
        return this.zoneMap[zoneY]?.[zoneX] || 'GRASS';
    }

    // Check if position is collidable
    isCollidable(x, y) {
        if (x < 0 || x >= this.worldWidth || y < 0 || y >= this.worldHeight) {
            return true;
        }
        return this.collisionMap[Math.floor(y)][Math.floor(x)] || false;
    }

    // Get tile at position
    getTileAt(x, y) {
        if (x < 0 || x >= this.worldWidth || y < 0 || y >= this.worldHeight) {
            return null;
        }
        return this.worldData[Math.floor(y)][Math.floor(x)];
    }

    // Get spawn position for player
    getPlayerSpawnPosition() {
        // Start in the center of the world
        return {
            x: Math.floor(this.worldWidth / 2) * this.tileSize,
            y: Math.floor(this.worldHeight / 2) * this.tileSize
        };
    }
}
