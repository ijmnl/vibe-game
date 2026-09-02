/**
 * One playable map - a town or a route - built deterministically from its
 * definition in Maps.js.
 *
 * Replaces the single 100x100 world: the region is now a graph of small maps
 * joined by exits, so you travel from Sprout Town up Route 1 into Greenwood
 * rather than wandering one endless field.
 */
class WorldMap {
    static TILE_VARIANTS = 4;

    static SOLID_TILES = new Set([
        'water', 'tree', 'rock', 'building', 'fence', 'cave_wall', 'cliff'
    ]);

    // Tiles that can trigger a wild encounter. Deliberately never the base
    // ground of a map - otherwise the whole route is a minefield and the
    // "walk the path to stay safe" idea falls apart.
    static ENCOUNTER_TILES = new Set(['tall_grass', 'cave_floor', 'sand_patch']);

    constructor(id) {
        this.id = id;
        this.def = getMapDef(id);
        this.name = this.def.name;
        this.kind = this.def.kind;
        this.zone = this.def.zone;
        this.worldWidth = this.def.width;
        this.worldHeight = this.def.height;
        this.tileSize = CONFIG.TILE_SIZE;

        this.tiles = [];
        this.exits = [];     // { x, y, to, side }
        this.npcs = [];
        this.items = [];     // { x, y, item }
        this.lair = null;

        this.rng = new Rng(this.def.seed);
        this.build();
    }

    // --- generation ---------------------------------------------------------

    build() {
        this.fillBase();

        if (this.kind === 'town') {
            this.buildTown();
        } else {
            this.buildRoute();
        }

        this.carveExits();
        this.placeItems();
        this.placeNpcs();
    }

    // Pickups sit off the beaten path, so wandering off it pays
    placeItems() {
        const cx = Math.floor(this.worldWidth / 2);
        const cy = Math.floor(this.worldHeight / 2);

        this.items = (this.def.items || []).map(def => {
            const x = clamp(cx + def.x, 1, this.worldWidth - 2);
            const y = clamp(cy + def.y, 1, this.worldHeight - 2);

            // Make sure it is standable and reachable
            this.set(x, y, this.pathTileFor(this.zone));
            return { x, y, item: def.item };
        });
    }

    baseTileFor(zone) {
        return {
            VILLAGE: 'town_grass',
            GRASS: 'grass',
            FOREST: 'forest_floor',
            WATER: 'shore',
            CAVE: 'cave_path',
            SAND: 'sand'
        }[zone] || 'grass';
    }

    borderTileFor(zone) {
        return {
            VILLAGE: 'tree',
            GRASS: 'tree',
            FOREST: 'tree',
            WATER: 'water',
            CAVE: 'cave_wall',
            SAND: 'cliff'
        }[zone] || 'tree';
    }

    fillBase() {
        const base = this.baseTileFor(this.zone);
        const border = this.borderTileFor(this.zone);

        for (let y = 0; y < this.worldHeight; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.worldWidth; x++) {
                const onEdge = x === 0 || y === 0
                    || x === this.worldWidth - 1 || y === this.worldHeight - 1;

                this.tiles[y][x] = this.makeTile(onEdge ? border : base, x, y);
            }
        }
    }

    makeTile(type, x, y) {
        return {
            type,
            zone: this.zone,
            variant: this.rng.int(0, WorldMap.TILE_VARIANTS - 1),
            encounter: WorldMap.ENCOUNTER_TILES.has(type)
        };
    }

    set(x, y, type) {
        if (!this.inBounds(x, y)) return;

        const tile = this.tiles[y][x];
        tile.type = type;
        tile.encounter = WorldMap.ENCOUNTER_TILES.has(type);
    }

    // Towns: a paved plaza, a few houses, and a healer and shop counter
    buildTown() {
        const cx = Math.floor(this.worldWidth / 2);
        const cy = Math.floor(this.worldHeight / 2);

        // Plaza
        for (let y = 3; y < this.worldHeight - 3; y++) {
            for (let x = 3; x < this.worldWidth - 3; x++) {
                if (this.rng.chance(0.82)) this.set(x, y, 'town_path');
            }
        }

        // Two buildings along the top, with the counters in front of them
        this.stampBuilding(cx - 6, cy - 7, 5, 3);
        this.stampBuilding(cx + 2, cy - 7, 5, 3);

        // A `plain` town has no healer and no shop - the shrine hollow is a
        // destination, not a rest stop.
        if (!this.def.plain) {
            this.set(cx - 4, cy - 4, 'heal_pad');
            this.set(cx + 4, cy - 4, 'shop_pad');
        }

        // A couple of decorative houses lower down
        this.stampBuilding(cx - 9, cy + 2, 4, 3);
        this.stampBuilding(cx + 5, cy + 3, 4, 3);

        // Flower beds
        for (let i = 0; i < 14; i++) {
            const x = this.rng.int(4, this.worldWidth - 5);
            const y = this.rng.int(4, this.worldHeight - 5);
            if (this.tiles[y][x].type === 'town_path') this.set(x, y, 'flowers');
        }
    }

    stampBuilding(left, top, width, height) {
        for (let y = top; y < top + height; y++) {
            for (let x = left; x < left + width; x++) {
                this.set(x, y, y === top + height - 1 ? 'building_front' : 'building');
            }
        }
    }

    // Routes: a walkable path with patches of tall grass either side
    buildRoute() {
        const border = this.borderTileFor(this.zone);
        const patch = this.encounterTileFor(this.zone);

        // Scatter obstacles so the route is not an open field
        const clutter = this.zone === 'CAVE' ? 'cave_wall'
            : this.zone === 'FOREST' ? 'tree'
            : this.zone === 'SAND' ? 'rock'
            : this.zone === 'WATER' ? 'water'
            : 'tree';

        // Caves want more walls than an open route, or they read as a big room
        const density = this.zone === 'CAVE' ? 0.13 : 0.06;

        for (let i = 0; i < this.worldWidth * this.worldHeight * density; i++) {
            const x = this.rng.int(2, this.worldWidth - 3);
            const y = this.rng.int(2, this.worldHeight - 3);
            this.set(x, y, clutter);
        }

        // Patches of encounter ground
        const patches = this.rng.int(6, 8);
        for (let i = 0; i < patches; i++) {
            const px = this.rng.int(3, this.worldWidth - 7);
            const py = this.rng.int(3, this.worldHeight - 7);
            const w = this.rng.int(4, 7);
            const h = this.rng.int(3, 5);

            for (let y = py; y < py + h; y++) {
                for (let x = px; x < px + w; x++) {
                    if (this.rng.chance(0.85)) this.set(x, y, patch);
                }
            }
        }

        this.carvePaths();

        if (this.def.lair) {
            const x = this.worldWidth - 6;
            const y = Math.floor(this.worldHeight / 2);
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) this.set(x + dx, y + dy, 'cave_floor');
            }
            this.set(x, y, 'den');
            this.lair = { x, y };
        }
    }

    encounterTileFor(zone) {
        return {
            GRASS: 'tall_grass',
            FOREST: 'tall_grass',
            WATER: 'tall_grass',
            CAVE: 'cave_floor',
            SAND: 'sand_patch'
        }[zone] || 'tall_grass';
    }

    // A clear walkway between every pair of exits, so no route can be blocked
    carvePaths() {
        const points = this.def.exits.map(exit => this.exitPosition(exit.side));
        const centre = {
            x: Math.floor(this.worldWidth / 2),
            y: Math.floor(this.worldHeight / 2)
        };

        points.forEach(point => this.carveCorridor(point, centre));
    }

    carveCorridor(from, to) {
        let { x, y } = from;

        const step = (value, target) => value + Math.sign(target - value);

        while (x !== to.x) {
            this.clearForPath(x, y);
            x = step(x, to.x);
        }
        while (y !== to.y) {
            this.clearForPath(x, y);
            y = step(y, to.y);
        }
        this.clearForPath(to.x, to.y);
    }

    // Widen the walkway a little so it reads as a path, not a one-tile gap
    clearForPath(x, y) {
        const walkable = this.kind === 'town' ? 'town_path' : this.pathTileFor(this.zone);

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const px = x + dx;
                const py = y + dy;
                if (!this.inBounds(px, py)) continue;
                if (px === 0 || py === 0 || px === this.worldWidth - 1 || py === this.worldHeight - 1) continue;

                this.set(px, py, walkable);
            }
        }
    }

    pathTileFor(zone) {
        return {
            GRASS: 'path',
            FOREST: 'forest_floor',
            WATER: 'shore',
            CAVE: 'cave_path',
            SAND: 'sand'
        }[zone] || 'path';
    }

    // Where an exit sits on a given edge
    exitPosition(side) {
        const midX = Math.floor(this.worldWidth / 2);
        const midY = Math.floor(this.worldHeight / 2);

        return {
            north: { x: midX, y: 0 },
            south: { x: midX, y: this.worldHeight - 1 },
            west: { x: 0, y: midY },
            east: { x: this.worldWidth - 1, y: midY }
        }[side];
    }

    carveExits() {
        this.def.exits.forEach(exit => {
            const spot = this.exitPosition(exit.side);
            const horizontal = exit.side === 'north' || exit.side === 'south';

            // Three tiles wide so the doorway is easy to hit with a d-pad
            for (let offset = -1; offset <= 1; offset++) {
                const x = spot.x + (horizontal ? offset : 0);
                const y = spot.y + (horizontal ? 0 : offset);

                this.set(x, y, 'exit');
                this.exits.push({ x, y, to: exit.to, side: exit.side });
            }
        });
    }

    // NPC coordinates in the map definition are relative to the centre
    placeNpcs() {
        const cx = Math.floor(this.worldWidth / 2);
        const cy = Math.floor(this.worldHeight / 2);

        this.npcs = (this.def.npcs || []).map(def => {
            const x = clamp(cx + def.x, 1, this.worldWidth - 2);
            const y = clamp(cy + def.y, 1, this.worldHeight - 2);

            // Make sure an NPC never stands in a wall, and can be reached
            this.clearForPath(x, y);

            return { ...def, x, y, homeX: x, homeY: y };
        });
    }

    // --- queries ------------------------------------------------------------

    inBounds(x, y) {
        return x >= 0 && x < this.worldWidth && y >= 0 && y < this.worldHeight;
    }

    getTileAt(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        return this.inBounds(tileX, tileY) ? this.tiles[tileY][tileX] : null;
    }

    isCollidable(x, y) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        if (!Number.isFinite(tileX) || !Number.isFinite(tileY)) return true;
        if (!this.inBounds(tileX, tileY)) return true;

        if (WorldMap.SOLID_TILES.has(this.tiles[tileY][tileX].type)) return true;

        // NPCs are solid: you talk to them by facing them, not by walking through
        return this.npcs.some(npc => npc.x === tileX && npc.y === tileY);
    }

    getExitAt(x, y) {
        return this.exits.find(exit => exit.x === Math.floor(x) && exit.y === Math.floor(y)) || null;
    }

    getNpcAt(x, y) {
        return this.npcs.find(npc => npc.x === Math.floor(x) && npc.y === Math.floor(y)) || null;
    }

    getItemAt(x, y) {
        return this.items.find(item => item.x === Math.floor(x) && item.y === Math.floor(y)) || null;
    }

    // Can something stand here? Used by wandering NPCs.
    isFree(x, y, ignoreNpc = null) {
        if (!this.inBounds(x, y)) return false;
        if (WorldMap.SOLID_TILES.has(this.tiles[y][x].type)) return false;
        if (this.getExitAt(x, y)) return false;

        return !this.npcs.some(npc => npc !== ignoreNpc && npc.x === x && npc.y === y);
    }

    // Everything a trainer can see straight ahead, until something blocks it
    tilesInFront(npc) {
        const step = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
                       north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] }[npc.facing || 'south'];
        if (!step || !npc.sight) return [];

        const seen = [];
        for (let i = 1; i <= npc.sight; i++) {
            const x = npc.x + step[0] * i;
            const y = npc.y + step[1] * i;

            if (!this.inBounds(x, y)) break;
            if (WorldMap.SOLID_TILES.has(this.tiles[y][x].type)) break;

            seen.push({ x, y });
        }

        return seen;
    }

    // Where the player appears when entering from a neighbouring map
    getSpawnFrom(fromMapId) {
        const exit = this.exits.find(e => e.to === fromMapId);

        if (!exit) return this.getDefaultSpawn();

        // Step one tile inward so the player is not standing on the exit
        const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[exit.side];

        return {
            x: (exit.x + inward[0]) * this.tileSize + this.tileSize / 2,
            y: (exit.y + inward[1]) * this.tileSize + this.tileSize / 2
        };
    }

    getDefaultSpawn() {
        const cx = Math.floor(this.worldWidth / 2);
        const cy = Math.floor(this.worldHeight / 2) + 2;

        return {
            x: cx * this.tileSize + this.tileSize / 2,
            y: cy * this.tileSize + this.tileSize / 2
        };
    }

    // Wild level band for this map
    getWildLevel() {
        const [min, max] = this.def.levels || [3, 5];

        return randomInt(min, max);
    }
}
