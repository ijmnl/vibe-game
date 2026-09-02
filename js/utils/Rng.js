/**
 * Small seeded random number generator (mulberry32).
 *
 * Maps are generated from a fixed seed so a route looks the same every time
 * you walk back into it - with Math.random the world would rearrange itself
 * behind you.
 */
class Rng {
    constructor(seed) {
        this.state = seed >>> 0;
    }

    // Float in [0, 1)
    next() {
        this.state = (this.state + 0x6d2b79f5) >>> 0;

        let t = this.state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Inclusive integer in [min, max]
    int(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    chance(probability) {
        return this.next() < probability;
    }

    pick(list) {
        return list[Math.floor(this.next() * list.length)];
    }
}
