class EncounterSystem {
    constructor(scene) {
        this.scene = scene;
        this.player = null;
        this.encounterCooldown = 0;
        this.encounterActive = false;
    }

    init(player) {
        this.player = player;
    }

    get map() {
        return this.scene.map;
    }

    update(delta) {
        if (!this.player || this.encounterActive) return;

        if (this.encounterCooldown > 0) {
            this.encounterCooldown -= delta;
            return;
        }

        if (!this.player.isMoving) return;

        // Encounters only happen on marked ground - tall grass, cave floor,
        // the shoreline - so walking the path is a safe choice.
        const tile = this.player.getTile();
        const data = this.map.getTileAt(tile.x, tile.y);
        if (!data || !data.encounter) return;

        const zone = CONFIG.ZONES[this.map.zone];
        if (!zone || !zone.encounterRate) return;

        const chance = zone.encounterRate * CONFIG.ENCOUNTER_RATE_SCALE * (delta / 1000);
        if (Math.random() < chance) this.triggerEncounter();
    }

    // The context a route event checks itself against
    eventContext() {
        return {
            coins: this.player.coins,
            teamSize: this.player.getAllMonsters().length,
            isNight: currentClock()?.isNight === true,
            weather: currentWeather()
        };
    }

    triggerEncounter() {
        this.encounterCooldown = CONFIG.ENCOUNTER_COOLDOWN;

        // Not every rustle in the grass is a monster
        if (Math.random() < ROUTE_EVENT_CHANCE) {
            const event = rollRouteEvent(this.eventContext());
            if (event) {
                this.scene.events.emit('route-event', { event });
                return;
            }
        }

        this.encounterActive = true;

        // After dark a route turns up a different set of monsters entirely,
        // and they run a level hotter than their daytime counterparts.
        const night = currentClock()?.isNight === true;
        const level = this.map.getWildLevel() + (night ? 1 : 0);
        const wildMonster = createWildMonster(this.map.zone, level, night);

        this.scene.events.emit('encounter-notification', { monster: wildMonster });

        // encounterActive stays true until the battle ends, so a second
        // encounter cannot stack on this one.
        this.scene.time.delayedCall(900, () => {
            this.scene.events.emit('encounter-start', { player: this.player, wildMonster });
        });
    }

    forceEncounter() {
        this.triggerEncounter();
    }

    isEncounterActive() {
        return this.encounterActive;
    }

    setEncounterActive(active) {
        this.encounterActive = active;
    }
}
