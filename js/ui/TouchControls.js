/**
 * On-screen D-pad and buttons for touch devices.
 *
 * Kept as plain DOM rather than Phaser input so the buttons stay put while the
 * camera moves, keep working while the game scene is paused, and get native
 * hit-testing on mobile browsers.
 */
class TouchControls {
    constructor() {
        this.direction = null;
        this.root = null;
        this.pointerDirections = new Map();
        this.onMenu = null;
        this.onInteract = null;
    }

    // Wire up the markup in index.html. Safe to call before the game boots.
    init() {
        this.root = document.getElementById('touch-controls');
        if (!this.root) return;

        this.root.querySelectorAll('[data-direction]').forEach((button) => {
            this.bindDirectionButton(button, button.dataset.direction);
        });

        this.bindAction('menu', () => this.onMenu && this.onMenu());
        this.bindAction('interact', () => this.onInteract && this.onInteract());

        this.setVisible(TouchControls.isTouchDevice());

        // A phone plugged into a keyboard, or a laptop with a touchscreen, can
        // switch between the two - show the pad as soon as a finger appears.
        window.addEventListener('touchstart', () => this.setVisible(true), { once: true });
    }

    bindAction(action, handler) {
        const button = this.root.querySelector(`[data-action="${action}"]`);
        if (!button) return;

        button.addEventListener('click', (event) => {
            event.preventDefault();
            handler();
        });
    }

    bindDirectionButton(button, direction) {
        const press = (event) => {
            event.preventDefault();
            this.pointerDirections.set(event.pointerId, direction);
            this.direction = direction;
            button.classList.add('pressed');

            // Keep receiving moves/ups even if the finger slides off the button
            if (button.setPointerCapture && event.pointerId !== undefined) {
                try {
                    button.setPointerCapture(event.pointerId);
                } catch (e) {
                    // Capture is a nicety; ignore browsers that refuse it
                }
            }
        };

        const release = (event) => {
            event.preventDefault();
            this.pointerDirections.delete(event.pointerId);
            button.classList.remove('pressed');
            this.direction = this.lastActiveDirection();
        };

        button.addEventListener('pointerdown', press);
        button.addEventListener('pointerup', release);
        button.addEventListener('pointercancel', release);
        button.addEventListener('pointerleave', release);
        button.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    lastActiveDirection() {
        let direction = null;
        this.pointerDirections.forEach((value) => {
            direction = value;
        });
        return direction;
    }

    // Drop any held direction, e.g. when a battle takes over the screen
    reset() {
        this.direction = null;
        this.pointerDirections.clear();

        if (this.root) {
            this.root.querySelectorAll('.pressed').forEach((button) => {
                button.classList.remove('pressed');
            });
        }
    }

    setVisible(visible) {
        if (!this.root) return;
        this.root.classList.toggle('hidden', !visible);
    }

    static isTouchDevice() {
        return window.matchMedia('(hover: none) and (pointer: coarse)').matches
            || navigator.maxTouchPoints > 0;
    }
}

const touchControls = new TouchControls();
