/**
 * The colour of the sky, drawn over the world.
 *
 * One full-screen rectangle for the tint of the hour and the weather, plus a
 * small pool of recycled particles for rain, fog and blown sand. Deliberately
 * a handful of objects rather than a real particle system: the world already
 * runs at 60fps on a phone and it is going to stay that way.
 */
class SkyOverlay {
    static MAX_PARTICLES = 22;

    constructor(scene) {
        this.scene = scene;
        this.currentWeather = null;

        this.tint = scene.add.rectangle(0, 0, 10, 10, 0x000000, 0)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(900);

        this.particles = [];
        this.resize();
    }

    resize() {
        const { width, height } = this.scene.scale;

        this.tint.setSize(width, height);
        this.tint.setPosition(0, 0);
    }

    // Blend the hour and the weather into one wash of colour
    apply(phase, weatherId) {
        const sky = getWeather(weatherId);

        const layers = [
            { tint: phase.tint, strength: phase.strength },
            { tint: sky.tint, strength: sky.strength || 0 }
        ].filter(layer => layer.strength > 0);

        if (!layers.length) {
            this.tint.setFillStyle(0x000000, 0);
        } else {
            // The stronger layer decides the colour; the weaker one only adds
            // to how heavy the wash is.
            const lead = layers.reduce((a, b) => (b.strength > a.strength ? b : a));
            const strength = Math.min(0.62, layers.reduce((sum, l) => sum + l.strength, 0));

            this.tint.setFillStyle(lead.tint, strength);
        }

        if (weatherId !== this.currentWeather) {
            this.currentWeather = weatherId;
            this.buildParticles(weatherId);
        }
    }

    buildParticles(weatherId) {
        this.particles.forEach(particle => {
            this.scene.tweens.killTweensOf(particle);
            particle.destroy();
        });
        this.particles = [];

        const recipe = {
            rain: { count: 22, make: () => this.makeRaindrop() },
            // Large translucent ellipses are the most expensive thing on the
            // screen, so there are few of them and they are wide rather than
            // numerous.
            fog: { count: 6, make: () => this.makeCloud(0xd8e4ec, 0.18) },
            sandstorm: { count: 8, make: () => this.makeCloud(0xe0c088, 0.22) }
        }[weatherId];

        if (!recipe) return;

        for (let i = 0; i < Math.min(recipe.count, SkyOverlay.MAX_PARTICLES); i++) {
            this.particles.push(recipe.make());
        }
    }

    makeRaindrop() {
        const { width, height } = this.scene.scale;

        const drop = this.scene.add.rectangle(
            randomInt(0, width), randomInt(-height, height), 2, randomInt(8, 16),
            0xbcd8f0, 0.5
        ).setScrollFactor(0).setDepth(901).setAngle(12);

        const fall = () => {
            drop.setPosition(randomInt(0, this.scene.scale.width), -20);
            this.scene.tweens.add({
                targets: drop,
                y: this.scene.scale.height + 20,
                x: drop.x - 30,
                duration: randomInt(500, 900),
                onComplete: fall
            });
        };
        fall();

        return drop;
    }

    makeCloud(color, alpha) {
        const { width, height } = this.scene.scale;

        const cloud = this.scene.add.ellipse(
            randomInt(0, width), randomInt(0, height),
            randomInt(90, 190), randomInt(26, 54), color, alpha
        ).setScrollFactor(0).setDepth(901);

        const drift = () => {
            cloud.setPosition(-120, randomInt(0, this.scene.scale.height));
            this.scene.tweens.add({
                targets: cloud,
                x: this.scene.scale.width + 140,
                duration: randomInt(6000, 11000),
                onComplete: drift
            });
        };
        drift();

        return cloud;
    }

    destroy() {
        this.particles.forEach(particle => {
            this.scene.tweens.killTweensOf(particle);
            particle.destroy();
        });
        this.particles = [];
        this.tint.destroy();
    }
}
