class WorldGenerator {
    // Number of shade variants rendered per tile type in the tileset
    static TILE_VARIANTS = 4;

    // Tile types the player cannot walk through
    static SOLID_TILES = new Set([
        'water', 'water_edge', 'forest_tree', 'cave_rock', 'sand_rock', 'village_wall'
    ]);

    constructor() {
        this.worldWidth = CONFIG.WORLD_WIDTH;
        this.worldHeight = CONFIG.WORLD_HEIGHT;
        this.tileSize = CONFIG.TILE_SIZE;
        this.zoneSize = CONFIG.ZONE_SIZE;
        this.worldData = [];
        this.collisionMap = [];
        this.zoneMap = [];
        this.villages = [];
        this.lair = null;
    }

    // Generate the entire world
    generate() {
        this.generateZones();
        this.generateTerrain();
        this.generatePaths();
        this.generateVillages();
        this.generateLegendaryLair();
        this.generateCollisionMap();
        return this.worldData;
    }

    // Villages give somewhere to heal and restock. One always sits on the
    // starting tile so the player meets the idea immediately.
    generateVillages() {
        this.villages = [];

        const home = {
            x: Math.floor(this.worldWidth / 2),
            y: Math.floor(this.worldHeight / 2)
        };

        this.stampVillage(home.x, home.y, true);

        // A ring of outposts far enough out to be worth walking to
        const outposts = [
            { x: home.x - 30, y: home.y - 8 },
            { x: home.x + 29, y: home.y + 6 },
            { x: home.x + 4,  y: home.y - 31 },
            { x: home.x - 6,  y: home.y + 30 }
        ];

        outposts.forEach(spot => {
            const x = clamp(spot.x, 6, this.worldWidth - 7);
            const y = clamp(spot.y, 6, this.worldHeight - 7);
            this.stampVillage(x, y, false);
        });
    }

    // Lay a small plaza with a heal pad and a shop, and clear a way in
    stampVillage(centerX, centerY, isHome) {
        const radius = 4;

        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                const tile = this.worldData[y]?.[x];
                if (!tile) continue;

                const edge = Math.abs(x - centerX) === radius || Math.abs(y - centerY) === radius;

                tile.type = 'village_floor';
                tile.zone = 'VILLAGE';
                tile.variant = (x + y) % WorldGenerator.TILE_VARIANTS;

                // Fenced corners, left open along the middle of each side
                if (edge && Math.abs(x - centerX) > 1 && Math.abs(y - centerY) > 1) {
                    tile.type = 'village_wall';
                }
            }
        }

        const healTile = this.worldData[centerY - 1]?.[centerX - 2];
        if (healTile) healTile.type = 'village_heal';

        const shopTile = this.worldData[centerY - 1]?.[centerX + 2];
        if (shopTile) shopTile.type = 'village_shop';

        this.villages.push({ x: centerX, y: centerY, isHome });
    }

    // The legendary waits in the far corner of the map
    generateLegendaryLair() {
        const x = this.worldWidth - 8;
        const y = this.worldHeight - 8;

        for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
                const tile = this.worldData[y + dy]?.[x + dx];
                if (!tile) continue;

                tile.zone = 'CAVE';
                tile.type = Math.abs(dx) === 3 || Math.abs(dy) === 3 ? 'cave_rock' : 'cave';
                tile.variant = (x + dx + y + dy) % WorldGenerator.TILE_VARIANTS;
            }
        }

        const shrine = this.worldData[y]?.[x];
        if (shrine) shrine.type = 'lair';

        this.lair = { x, y };
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
                    // Which of the pre-rendered shade variants this tile uses
                    variant: Math.floor(Math.random() * WorldGenerator.TILE_VARIANTS),
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
                this.collisionMap[y][x] = WorldGenerator.SOLID_TILES.has(tile.type);
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
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        if (!Number.isFinite(tileX) || !Number.isFinite(tileY)) {
            return true;
        }

        if (tileX < 0 || tileX >= this.worldWidth || tileY < 0 || tileY >= this.worldHeight) {
            return true;
        }

        return this.collisionMap[tileY][tileX] || false;
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
        const home = this.villages.find(village => village.isHome)
            || { x: Math.floor(this.worldWidth / 2), y: Math.floor(this.worldHeight / 2) };

        return {
            x: home.x * this.tileSize + this.tileSize / 2,
            y: (home.y + 1) * this.tileSize + this.tileSize / 2
        };
    }

    // Nearest village to a tile, used to send a beaten player home
    getNearestVillage(tileX, tileY) {
        return this.villages.reduce((closest, village) => {
            const distance = Math.hypot(village.x - tileX, village.y - tileY);
            return !closest || distance < closest.distance
                ? { ...village, distance }
                : closest;
        }, null);
    }
}
