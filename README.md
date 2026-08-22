# Pixel Monster Adventure

A Pokémon-inspired HTML5 game built with Phaser.js and modern JavaScript.

## 🎮 Game Features

- **Open World**: Explore a large procedurally generated world with different zones (grassland, forest, water, cave, desert)
- **Turn-Based Battles**: Fight wild monsters with your team of creatures
- **Catch & Train**: Catch wild monsters and train them to become stronger
- **Level Up System**: Gain experience and level up your monsters
- **Inventory**: Use potions and monster balls strategically
- **Minimap**: Keep track of your position in the world
- **Modern Pixel Art**: Clean, colorful pixel art graphics

## 🚀 How to Play

1. **Movement**: Use arrow keys or WASD to move around
2. **Encounters**: Walk in tall grass, forests, water, or caves to encounter wild monsters
3. **Battles**: 
   - **Attack**: Deal damage to the wild monster
   - **Catch**: Use monster balls to catch wild monsters
   - **Run**: Try to escape from battle
   - **Use Item**: Use potions to heal your monsters
4. **Menu**: Press ESC or M to open the menu
   - View your monsters
   - Use items
   - Switch active monster

## 📁 Project Structure

```
pokemon-game/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # Game styles
├── js/
│   ├── config.js          # Game configuration
│   ├── main.js            # Game initialization
│   ├── entities/
│   │   ├── Player.js      # Player class
│   │   └── Monster.js     # Monster class
│   ├── systems/
│   │   ├── BattleSystem.js
│   │   ├── EncounterSystem.js
│   │   ├── Inventory.js
│   │   └── AudioManager.js
│   ├── world/
│   │   └── WorldGenerator.js
│   ├── ui/
│   │   ├── Minimap.js
│   │   └── UIManager.js
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── WorldScene.js
│   │   └── BattleScene.js
│   └── utils/
│       └── SpriteGenerator.js
└── assets/
    ├── sprites/
    │   ├── player/
    │   ├── monsters/
    │   └── items/
    ├── tiles/
    ├── audio/
    └── ui/
```

## 🛠️ Development

### Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection (for loading Phaser.js from CDN)

### Running the Game
Simply open `index.html` in your web browser. No server required!

### Building
For production, you might want to:
1. Download Phaser.js locally
2. Minify the JavaScript files
3. Optimize assets

## 🎨 Graphics

The game uses programmatically generated pixel art for:
- Player character (4 directions)
- Monsters (various types)
- Tiles (grass, water, forest, etc.)
- Items (potions, balls)

For better graphics, you can replace the generated sprites with actual pixel art images in the `assets/` folder.

## 🎵 Audio

The game uses the Web Audio API for procedural sound effects and music. For better audio, you can:
1. Add actual audio files in `assets/audio/`
2. Update the `AudioManager.js` to load and play these files

## 💾 Saving

The game automatically saves your progress every minute. Save data includes:
- Player position
- Monsters in your team
- Inventory items

## 🔧 Configuration

Edit `js/config.js` to customize:
- World size and zones
- Encounter rates
- Monster stats
- Items and their effects
- Colors and appearance

## 🐛 Known Issues

- Mobile touch controls need improvement
- Some animations could be smoother
- Audio might not work on all browsers without user interaction first

## 📝 License

This game is provided as-is for educational and entertainment purposes. Feel free to modify and distribute it.

## 🙏 Credits

- Built with [Phaser.js](https://phaser.io/)
- Inspired by Pokémon games
- Font: Press Start 2P

---

**Enjoy the adventure!** 🎮✨
