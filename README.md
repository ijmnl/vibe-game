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

## 📱 Playing on your phone

The game is a static site, so any web host works. The repository ships a
GitHub Pages workflow (`.github/workflows/pages.yml`): once **Settings →
Pages → Source** is set to **GitHub Actions**, every push to `main` publishes
the game at `https://<user>.github.io/<repo>/`. Open that URL on your phone
and add it to the home screen for a full-screen, browser-chrome-free game.

To try it on your phone before publishing, serve the folder from your computer
and open its LAN address on the phone (same Wi-Fi):

```bash
python3 -m http.server 8000
# then browse to http://<your-computer-ip>:8000 on the phone
```

Phaser is vendored in `vendor/`, so the game also runs offline and from a
`file://` URL - no CDN needed.

## 🚀 How to Play

1. **Movement**: On a phone, use the on-screen D-pad; on a desktop, the arrow
   keys or WASD
2. **Encounters**: Walk in tall grass, forests, water, or caves to encounter wild monsters
3. **Battles**: 
   - **Attack**: Deal damage to the wild monster
   - **Catch**: Use monster balls to catch wild monsters
   - **Run**: Try to escape from battle
   - **Use Item**: Use potions to heal your monsters
4. **Menu**: Tap the MENU button, or press ESC or M
   - View your monsters
   - Use items
   - Switch active monster

## 📁 Project Structure

```
pokemon-game/
├── index.html              # Main HTML file
├── vendor/
│   └── phaser.min.js      # Phaser, vendored so the game runs offline
├── css/
│   └── style.css          # Game styles
├── js/
│   ├── config.js          # Game configuration
│   ├── main.js            # Game initialization
│   ├── entities/
│   │   ├── Player.js      # Player class
│   │   └── Monster.js     # Monster data and battle maths
│   ├── systems/
│   │   ├── BattleSystem.js
│   │   ├── EncounterSystem.js
│   │   ├── Inventory.js
│   │   └── AudioManager.js
│   ├── world/
│   │   ├── WorldGenerator.js
│   │   └── TileTextures.js  # Bakes the tileset the world layer draws from
│   ├── ui/
│   │   ├── Minimap.js
│   │   ├── TouchControls.js # On-screen D-pad for phones
│   │   └── UIManager.js
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── WorldScene.js
│   │   └── BattleScene.js
│   └── utils/
│       └── SpriteGenerator.js  # Unused for now; kept for future pixel art
└── test/
    └── index.html          # Open in a browser to run the smoke tests
```

## 🛠️ Development

### Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari), desktop or mobile

### Running the Game
Open `index.html` in your browser. No server and no internet connection
required - Phaser is vendored in `vendor/`.

### Tests
Open `test/index.html` in a browser. It loads the game modules, runs a set of
smoke tests over config, world generation, entities, battles and inventory,
and embeds the game itself.

### Building
For production, you might want to:
1. Minify the JavaScript files
2. Optimize assets

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

The game saves every minute, and also whenever you leave or background the
page - phones suspend background tabs, so an interval alone loses progress. Save data includes:
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

- The player and monsters are still coloured blocks; `SpriteGenerator.js` has
  pixel art ready to be wired up
- Water zones are impassable, so lake monsters can only be met at the shore
- Some animations could be smoother

## 📝 License

This game is provided as-is for educational and entertainment purposes. Feel free to modify and distribute it.

## 🙏 Credits

- Built with [Phaser.js](https://phaser.io/)
- Inspired by Pokémon games
- Font: Press Start 2P

---

**Enjoy the adventure!** 🎮✨
