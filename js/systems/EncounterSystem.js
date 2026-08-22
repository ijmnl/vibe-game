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

        // Check for encounter based on zone rate
        if (Math.random() < zone.encounterRate * (delta / 1000)) {
            this.triggerEncounter(tile.zone);
        }
    }

    // Trigger a random encounter
    triggerEncounter(zoneType) {
        // Set cooldown
        this.encounterCooldown = CONFIG.ENCOUNTER_COOLDOWN;
        this.encounterActive = true;

        // Create wild monster
        const monsterName = getRandomMonsterForZone(zoneType);
        const level = getRandomWildLevel();
        
        // Create monster (we'll use the battle system to create it properly)
        const wildMonster = new Monster(this.scene, monsterName, level, true);
        
        // Show encounter notification
        this.scene.events.emit('encounter-notification', {
            monster: wildMonster
        });

        // Start battle after notification
        this.scene.time.delayedCall(1500, () => {
            this.encounterActive = false;
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
