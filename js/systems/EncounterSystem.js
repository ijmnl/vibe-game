class EncounterSystem {
    constructor(scene) {
        this.scene = scene;
        this.worldGenerator = scene.worldGenerator;
        this.player = null;
        this.encounterCooldown = 0;
        this.encounterActive = false;
    }

    // Initialize with player
    init(player) {
        this.player = player;
    }

    // Update - check for encounters
    update(delta) {
        if (!this.player || this.encounterActive) return;

        // Update cooldown
        if (this.encounterCooldown > 0) {
            this.encounterCooldown -= delta;
            return;
        }

        // Check if player is moving
        if (!this.player.isMoving) return;

        // Get player position and tile
        const playerPos = this.player.getPosition();
        const tileX = Math.floor(playerPos.x / CONFIG.TILE_SIZE);
        const tileY = Math.floor(playerPos.y / CONFIG.TILE_SIZE);
        const tile = this.worldGenerator.getTileAt(tileX, tileY);

        if (!tile) return;

        // Get zone info
        const zone = CONFIG.ZONES[tile.zone];
        if (!zone || !zone.encounterRate) return;

        // zone.encounterRate is a per-step chance; scale it into a
        // per-second probability so encounters do not depend on frame rate.
        const chance = zone.encounterRate * CONFIG.ENCOUNTER_RATE_SCALE * (delta / 1000);
        if (Math.random() < chance) {
            this.triggerEncounter(tile.zone);
        }
    }

    // Trigger a random encounter
    triggerEncounter(zoneType) {
        // Set cooldown
        this.encounterCooldown = CONFIG.ENCOUNTER_COOLDOWN;
        this.encounterActive = true;

        // Wild level scales with how far this spot is from the home village
        const tile = this.player.getTile();
        const wildMonster = createWildMonster(zoneType, getWildLevelAt(tile.x, tile.y));
        
        // Show encounter notification
        this.scene.events.emit('encounter-notification', {
            monster: wildMonster
        });

        // Start battle after notification. encounterActive stays true until
        // the battle ends, so a second encounter cannot stack on this one.
        this.scene.time.delayedCall(1500, () => {
            this.scene.events.emit('encounter-start', {
                player: this.player,
                wildMonster: wildMonster,
                zone: zoneType
            });
        });
    }

    // Force an encounter (for testing)
    forceEncounter(zoneType) {
        this.triggerEncounter(zoneType || 'GRASS');
    }

    // Check if encounter is active
    isEncounterActive() {
        return this.encounterActive;
    }

    // Set encounter active state
    setEncounterActive(active) {
        this.encounterActive = active;
    }
}
