# Pixel Monster Adventure

A Pokémon-inspired HTML5 game built with Phaser.js and modern JavaScript.

## 🎮 Game Features

- **20 monsters to collect**, each with a fixed type, its own pixel art, its own
  learnset, and several with evolutions
- **Turn-based battles with real choices**: pick from up to four moves, work the
  type chart, land criticals, inflict burn, poison, paralysis and sleep
- **Open world**: a procedurally generated map of grassland, forest, lakes,
  caves and desert, with wild levels rising the further you roam
- **Villages** with a heal pad and a shop, so you can patch up and restock
- **Coins** from every win, spent on potions, antidotes and better balls
- **Monsterdex** tracking what you have seen and caught - filling it is the goal
- **A legendary** waiting in a lair in the far corner of the map
- **Plays on a phone**: on-screen D-pad, portrait and landscape layouts

## 📱 Playing on your phone

The game is live at **https://ijmnl.github.io/vibe-game/** - open it on your
phone and add it to the home screen for a full-screen, browser-chrome-free
game.

It is published with GitHub Pages from **Settings → Pages → Source: Deploy
from a branch**. Point that at whichever branch you want live; after merging a
pull request, set it to `main` so the site keeps updating. Pages needs the
repository to be public (or a paid plan). `.nojekyll` keeps Pages from running
a Jekyll build over the files.

A GitHub Actions workflow (`.github/workflows/pages.yml`) is also included, if
you would rather publish that way: set **Source** to **GitHub Actions** and
every push to `main` deploys.

To test a change before pushing, serve the folder from your computer and open
its LAN address on the phone (same Wi-Fi):

```bash
python3 -m http.server 8000
# then browse to http://<your-computer-ip>:8000 on the phone
```

Phaser is vendored in `vendor/`, so the game also runs offline and from a
`file://` URL - no CDN needed.

## 🚀 How to Play

1. **Move**: the on-screen D-pad on a phone, or arrow keys / WASD on a desktop
2. **Find monsters**: walk through grass, forest, caves and desert. Villages are
   safe - nothing attacks you there
3. **Battle**:
   - **Fight** - choose one of your monster's moves. Types matter: Water beats
     Fire and Rock, Grass beats Water and Rock, Fire beats Grass, Electric beats
     Water, Rock beats Fire and Electric. Normal is never resisted
   - **Throw Ball** - the weaker and more status-afflicted the target, the
     better your odds
   - **Bag** / **Team** - use an item, or switch monster
   - **Run** - usually works, though not against everything
4. **Level up**: monsters gain EXP, learn new moves, and some evolve
5. **Villages**: step on the pink cross to heal your whole team for free, or the
   gold coin to open the shop
6. **Menu**: the MENU button, or ESC / M. Your team, your bag, the Monsterdex,
   and a sound toggle

### Tips

- Weaken a monster before throwing a ball; a full-health target rarely stays in
- Levels rise with distance from your home village, so push outwards gradually
- Losing costs you a quarter of your coins and sends you back to a village -
  never your monsters or your progress
- Something is waiting in the far south-east corner of the map

## 📁 Project Structure

```
pokemon-game/
├── index.html              # Main HTML file
├── vendor/
│   └── phaser.min.js      # Phaser, vendored so the game runs offline
├── css/
│   └── style.css          # Game styles
├── js/
│   ├── config.js          # Tuning: damage, levels, economy, zones, items
│   ├── main.js            # Game initialization and saving
│   ├── data/
│   │   ├── Types.js       # The six types and the effectiveness chart
│   │   ├── Moves.js       # Move definitions and status effects
│   │   └── Species.js     # Stats, types, learnsets, evolutions, dex numbers
│   ├── entities/
│   │   ├── Player.js      # Player, team, coins, Monsterdex
│   │   └── Monster.js     # Stats, moves, status, levelling, evolution
│   ├── systems/
│   │   ├── BattleSystem.js
│   │   ├── EncounterSystem.js
│   │   ├── Inventory.js
│   │   └── AudioManager.js  # Procedural music and sound effects
│   ├── world/
│   │   ├── WorldGenerator.js  # Terrain, villages, the legendary lair
│   │   └── TileTextures.js    # Bakes the tileset the world layer draws from
│   ├── ui/
│   │   ├── Minimap.js
│   │   ├── TouchControls.js   # On-screen D-pad for phones
│   │   └── UIManager.js       # HUD, battle panel, menu, shop, dex
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── WorldScene.js
│   │   └── BattleScene.js
│   └── utils/
│       ├── MathUtils.js       # clamp/random, so game rules need no Phaser
│       ├── SpriteFactory.js   # Draws all pixel art into Phaser textures
│       └── SpriteGenerator.js # Older sprite experiments, unused
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
Open `test/index.html` in a browser. It loads the game modules and runs smoke
tests over the config, world generation, entities, battles and inventory. Some
of them are design checks rather than code checks - for instance, that every
species keeps at least two attacking moves and has a move that is not resisted
by any type. Those two caught real problems: a Bird whose moves were all
Electric, and a Turtle that lost its only neutral attack to the four-move cap.

Game rules deliberately avoid `Phaser.Math` (see `js/utils/MathUtils.js`) so the
data and battle logic can be tested without a running game.

### Building
For production, you might want to:
1. Minify the JavaScript files
2. Optimize assets

## 🎨 Graphics

Every sprite is drawn at runtime by `js/utils/SpriteFactory.js`. Characters are
described as 16x16 grids of single letters and scaled up, which keeps the art
chunky and crisp instead of blurry:

```
'.....kkkkkk.....'   k = outline, c = cap, s = skin,
'....kCCCCCCk....'   j = jacket, p = trousers, '.' = transparent
```

Monsters share a handful of body shapes (blob, quadruped, winged, serpent,
arachnid, shelled, ...) recoloured per species, so adding a monster means adding
a colour ramp and picking a shape. The world tileset is baked once into a single
texture and drawn as one culled tilemap layer.

## 🎵 Audio

All sound is synthesised at runtime with the Web Audio API - there are no audio
files. Each zone has its own looping theme, battles switch to a faster one, and
short blips cover hits, catches, healing and purchases. Mobile browsers only
allow audio after a user gesture, so it starts on your first tap. There is a
sound toggle in the menu.

## 💾 Saving

The game saves every minute, and also whenever you leave or background the
page - phones suspend background tabs, so an interval alone loses progress. Save data includes:
- Player position
- Monsters in your team
- Inventory items

## 🔧 Configuration

Edit `js/config.js` to tune the game: world size and zones, encounter rates,
`DAMAGE_SCALE` (lower hits harder), the wild level curve, the economy, and the
item list. Monsters themselves live in `js/data/Species.js` and moves in
`js/data/Moves.js`.

## 🐛 Known Issues

- Water is impassable, so lake monsters are only met along the shore
- The player always acts first in a battle; speed decides nothing yet
- `js/utils/SpriteGenerator.js` is an older, unused experiment kept for reference

## 📝 License

This game is provided as-is for educational and entertainment purposes. Feel free to modify and distribute it.

## 🙏 Credits

- Built with [Phaser.js](https://phaser.io/)
- Inspired by Pokémon games
- Font: Press Start 2P

---

**Enjoy the adventure!** 🎮✨
