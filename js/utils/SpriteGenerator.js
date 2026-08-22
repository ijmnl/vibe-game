/**
 * Sprite Generator - Creates pixel art sprites programmatically
 * This generates simple but effective pixel art for our game
 */

class SpriteGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Generate a simple player sprite
     * Returns a data URL for the sprite sheet
     */
    generatePlayerSprite() {
        this.canvas.width = 64;
        this.canvas.height = 64;
        
        const colors = {
            skin: '#ffcc99',
            hair: '#663300',
            shirt: '#0066cc',
            pants: '#336633',
            shoes: '#333333',
            outline: '#000000'
        };

        // Draw 4 directions: down, up, left, right
        this.drawPlayerFrame(0, 0, colors, 'down');
        this.drawPlayerFrame(16, 0, colors, 'up');
        this.drawPlayerFrame(0, 16, colors, 'left');
        this.drawPlayerFrame(16, 16, colors, 'right');

        return this.canvas.toDataURL();
    }

    drawPlayerFrame(x, y, colors, direction) {
        const ctx = this.ctx;

        // Frame size: 16x16
        ctx.fillStyle = colors.outline;
        ctx.fillRect(x, y, 16, 16);

        // Head
        ctx.fillStyle = colors.skin;
        ctx.fillRect(x + 2, y + 2, 12, 8);

        // Hair
        ctx.fillStyle = colors.hair;
        if (direction === 'down') {
            ctx.fillRect(x + 4, y + 2, 8, 4);
        } else if (direction === 'up') {
            ctx.fillRect(x + 4, y + 6, 8, 4);
        } else if (direction === 'left') {
            ctx.fillRect(x + 2, y + 4, 4, 8);
        } else if (direction === 'right') {
            ctx.fillRect(x + 10, y + 4, 4, 8);
        }

        // Eyes
        ctx.fillStyle = '#000000';
        if (direction === 'down' || direction === 'up') {
            ctx.fillRect(x + 5, y + 5, 2, 1);
            ctx.fillRect(x + 9, y + 5, 2, 1);
        } else {
            ctx.fillRect(x + 5, y + 5, 1, 2);
            ctx.fillRect(x + 9, y + 5, 1, 2);
        }

        // Body
        ctx.fillStyle = colors.shirt;
        if (direction === 'down' || direction === 'up') {
            ctx.fillRect(x + 3, y + 8, 10, 6);
        } else {
            ctx.fillRect(x + 4, y + 8, 8, 6);
        }

        // Pants
        ctx.fillStyle = colors.pants;
        if (direction === 'down') {
            ctx.fillRect(x + 4, y + 12, 8, 4);
        } else if (direction === 'up') {
            ctx.fillRect(x + 4, y + 8, 8, 4);
        } else {
            ctx.fillRect(x + 5, y + 12, 6, 4);
        }

        // Shoes
        ctx.fillStyle = colors.shoes;
        if (direction === 'down') {
            ctx.fillRect(x + 4, y + 15, 4, 1);
            ctx.fillRect(x + 8, y + 15, 4, 1);
        } else if (direction === 'up') {
            ctx.fillRect(x + 4, y + 8, 4, 1);
            ctx.fillRect(x + 8, y + 8, 4, 1);
        } else if (direction === 'left') {
            ctx.fillRect(x + 5, y + 15, 1, 4);
            ctx.fillRect(x + 9, y + 15, 1, 4);
        } else {
            ctx.fillRect(x + 5, y + 15, 1, 4);
            ctx.fillRect(x + 9, y + 15, 1, 4);
        }
    }

    /**
     * Generate monster sprites
     * Returns an object with data URLs for each monster type
     */
    generateMonsterSprites() {
        const monsters = {};
        const monsterTypes = ['slime', 'rat', 'bird', 'fox', 'spider', 'fish', 'crab'];

        monsterTypes.forEach(type => {
            monsters[type] = this.generateMonsterSprite(type);
        });

        return monsters;
    }

    generateMonsterSprite(type) {
        this.canvas.width = 32;
        this.canvas.height = 32;

        const ctx = this.ctx;

        // Draw monster based on type
        switch (type) {
            case 'slime':
                this.drawSlime(ctx, 16, 16);
                break;
            case 'rat':
                this.drawRat(ctx, 16, 16);
                break;
            case 'bird':
                this.drawBird(ctx, 16, 16);
                break;
            case 'fox':
                this.drawFox(ctx, 16, 16);
                break;
            case 'spider':
                this.drawSpider(ctx, 16, 16);
                break;
            case 'fish':
                this.drawFish(ctx, 16, 16);
                break;
            case 'crab':
                this.drawCrab(ctx, 16, 16);
                break;
        }

        return this.canvas.toDataURL();
    }

    drawSlime(ctx, x, y) {
        // Green slime
        ctx.fillStyle = '#44ff44';
        ctx.beginPath();
        ctx.ellipse(x, y, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x - 4, y - 2, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 4, y - 2, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x - 4, y - 2, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 4, y - 2, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y + 2, 4, 0, Math.PI, false);
        ctx.stroke();
    }

    drawRat(ctx, x, y) {
        // Brown rat
        ctx.fillStyle = '#886633';
        ctx.beginPath();
        ctx.ellipse(x, y, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.ellipse(x + 6, y - 2, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x + 8, y - 3, 2, 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x - 12, y + 2);
        ctx.strokeStyle = '#886633';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Whiskers
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 10, y - 1);
        ctx.lineTo(x + 14, y - 2);
        ctx.moveTo(x + 10, y);
        ctx.lineTo(x + 14, y - 1);
        ctx.moveTo(x + 10, y + 1);
        ctx.lineTo(x + 14, y);
        ctx.stroke();
    }

    drawBird(ctx, x, y) {
        // Blue bird
        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.ellipse(x + 6, y - 2, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(x + 10, y - 2);
        ctx.lineTo(x + 12, y - 1);
        ctx.lineTo(x + 10, y);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x + 8, y - 3, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wing
        ctx.fillStyle = '#2266cc';
        ctx.beginPath();
        ctx.ellipse(x - 4, y, 6, 4, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.ellipse(x - 8, y, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFox(ctx, x, y) {
        // Orange fox
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.ellipse(x, y, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.ellipse(x + 6, y - 2, 6, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.beginPath();
        ctx.ellipse(x + 8, y - 6, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 10, y - 6, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x + 8, y - 3, 2, 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x + 10, y - 2, 2, 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.quadraticCurveTo(x - 12, y - 4, x - 10, y - 8);
        ctx.quadraticCurveTo(x - 8, y - 12, x - 4, y - 10);
        ctx.fill();

        // White tip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x - 10, y - 8, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSpider(ctx, x, y) {
        // Black spider
        ctx.fillStyle = '#000000';
        
        // Body
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.ellipse(x + 4, y, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (2 front, 2 back)
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.ellipse(x + 6, y - 1, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 6, y + 1, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 2, y - 2, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 2, y + 2, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Legs (8 legs)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        
        const legs = [
            { x1: x - 2, y1: y - 2, x2: x - 6, y2: y - 4 },
            { x1: x - 2, y1: y - 1, x2: x - 6, y2: y - 6 },
            { x1: x - 2, y1: y + 1, x2: x - 6, y2: y - 2 },
            { x1: x - 2, y1: y + 2, x2: x - 6, y2: y },
            { x1: x + 2, y1: y - 2, x2: x + 6, y2: y - 4 },
            { x1: x + 2, y1: y - 1, x2: x + 6, y2: y - 6 },
            { x1: x + 2, y1: y + 1, x2: x + 6, y2: y - 2 },
            { x1: x + 2, y1: y + 2, x2: x + 6, y2: y }
        ];

        legs.forEach(leg => {
            ctx.beginPath();
            ctx.moveTo(leg.x1, leg.y1);
            ctx.lineTo(leg.x2, leg.y2);
            ctx.stroke();
        });
    }

    drawFish(ctx, x, y) {
        // Blue fish
        ctx.fillStyle = '#4488ff';
        
        // Body
        ctx.beginPath();
        ctx.ellipse(x, y, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        ctx.quadraticCurveTo(x - 14, y - 4, x - 12, y);
        ctx.quadraticCurveTo(x - 14, y + 4, x - 12, y);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x + 6, y - 2, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fins
        ctx.fillStyle = '#2266cc';
        ctx.beginPath();
        ctx.ellipse(x + 4, y - 4, 4, 2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 4, y + 4, 4, 2, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCrab(ctx, x, y) {
        // Red crab
        ctx.fillStyle = '#ff4444';
        
        // Body
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Claws
        ctx.beginPath();
        ctx.ellipse(x - 8, y - 2, 6, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x - 8, y + 2, 6, 3, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Eyes on stalks
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x + 6, y - 4, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 6, y + 4, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye stalks
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 4, y - 2);
        ctx.lineTo(x + 6, y - 4);
        ctx.moveTo(x + 4, y + 2);
        ctx.lineTo(x + 6, y + 4);
        ctx.stroke();

        // Pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x + 6, y - 4, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 6, y + 4, 1, 1, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Generate tile sprites
     */
    generateTileSprites() {
        this.canvas.width = 128;
        this.canvas.height = 128;

        const ctx = this.ctx;
        const tileSize = 32;

        // Grass tile
        this.drawGrassTile(ctx, 0, 0, tileSize);

        // Forest tile
        this.drawForestTile(ctx, tileSize, 0, tileSize);

        // Water tile
        this.drawWaterTile(ctx, 0, tileSize, tileSize);

        // Cave tile
        this.drawCaveTile(ctx, tileSize, tileSize, tileSize);

        return this.canvas.toDataURL();
    }

    drawGrassTile(ctx, x, y, size) {
        // Base grass color
        ctx.fillStyle = '#2e8b57';
        ctx.fillRect(x, y, size, size);

        // Grass tufts
        ctx.fillStyle = '#228b22';
        for (let i = 0; i < 5; i++) {
            const tx = x + Math.random() * size;
            const ty = y + Math.random() * size;
            const tw = 4 + Math.random() * 4;
            const th = 8 + Math.random() * 4;
            
            ctx.fillRect(tx, ty, tw, th);
        }
    }

    drawForestTile(ctx, x, y, size) {
        // Base forest color
        ctx.fillStyle = '#228b22';
        ctx.fillRect(x, y, size, size);

        // Tree trunk
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(x + size / 2 - 3, y + size / 2, 6, size / 2);

        // Tree leaves
        ctx.fillStyle = '#006400';
        ctx.beginPath();
        ctx.ellipse(x + size / 2, y + size / 4, size / 3, size / 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawWaterTile(ctx, x, y, size) {
        // Base water color
        ctx.fillStyle = '#1e90ff';
        ctx.fillRect(x, y, size, size);

        // Water ripples
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + size / 4, y + size / 4, size / 4, size / 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + size * 3/4, y + size * 3/4, size / 4, size / 6, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCaveTile(ctx, x, y, size) {
        // Base cave color
        ctx.fillStyle = '#696969';
        ctx.fillRect(x, y, size, size);

        // Cave rocks
        ctx.fillStyle = '#404040';
        for (let i = 0; i < 3; i++) {
            const rx = x + Math.random() * size;
            const ry = y + Math.random() * size;
            const rs = 4 + Math.random() * 8;
            
            ctx.beginPath();
            ctx.ellipse(rx, ry, rs, rs * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Generate item sprites
     */
    generateItemSprites() {
        this.canvas.width = 64;
        this.canvas.height = 64;

        const ctx = this.ctx;
        const size = 16;

        // Potion
        this.drawPotion(ctx, 0, 0, size);

        // Monster Ball
        this.drawMonsterBall(ctx, size, 0, size);

        // Super Potion
        this.drawSuperPotion(ctx, 0, size, size);

        // Super Ball
        this.drawSuperBall(ctx, size, size, size);

        return this.canvas.toDataURL();
    }

    drawPotion(ctx, x, y, size) {
        // Flask shape
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.rect(x + 2, y + 2, size - 4, size - 6);
        ctx.fill();

        // Neck
        ctx.fillStyle = '#888888';
        ctx.fillRect(x + size / 2 - 2, y, 4, 4);

        // Cap
        ctx.fillStyle = '#444444';
        ctx.fillRect(x + size / 2 - 3, y - 2, 6, 4);

        // Liquid
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(x + 3, y + 3, size - 6, size - 8);
    }

    drawSuperPotion(ctx, x, y, size) {
        // Flask shape
        ctx.fillStyle = '#0000ff';
        ctx.beginPath();
        ctx.rect(x + 2, y + 2, size - 4, size - 6);
        ctx.fill();

        // Neck
        ctx.fillStyle = '#888888';
        ctx.fillRect(x + size / 2 - 2, y, 4, 4);

        // Cap
        ctx.fillStyle = '#444444';
        ctx.fillRect(x + size / 2 - 3, y - 2, 6, 4);

        // Liquid
        ctx.fillStyle = '#4444ff';
        ctx.fillRect(x + 3, y + 3, size - 6, size - 8);
    }

    drawMonsterBall(ctx, x, y, size) {
        // Ball
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x + size / 2, y + size / 2, size / 2, size / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Red stripe
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.rect(x + size / 4, y + size / 2 - 2, size / 2, 4);
        ctx.fill();

        // Button
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x + size / 2, y + size / 2, size / 4, size / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Button highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x + size / 2 + 1, y + size / 2 - 1, size / 8, size / 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSuperBall(ctx, x, y, size) {
        // Ball
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x + size / 2, y + size / 2, size / 2, size / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Purple stripe
        ctx.fillStyle = '#880088';
        ctx.beginPath();
        ctx.rect(x + size / 4, y + size / 2 - 2, size / 2, 4);
        ctx.fill();

        // Button
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x + size / 2, y + size / 2, size / 4, size / 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Button highlight
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(x + size / 2 + 1, y + size / 2 - 1, size / 8, size / 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Export for use in game
const spriteGenerator = new SpriteGenerator();
