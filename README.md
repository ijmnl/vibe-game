# Pixel Monster Adventure

A Pokémon-inspired HTML5 game built with Phaser.js and modern JavaScript.

## 🎮 Game Features

- **A region, not one big field**: ten connected maps - three towns, six routes
  and a rest house in a clearing - joined by exits, the way a Pokémon region
  works. Each is generated from a fixed seed, so a route looks the same every
  time you walk back in
- **Day and night**: a full day passes in eight minutes. The world darkens, the
  hour shows in the corner, and four monsters come out that are never seen in
  daylight
- **Weather that fights back**: rain lifts Water and drowns Fire, blazing sun
  does the reverse, a sandstorm grinds down anything that is not made of rock,
  and in fog everybody misses
- **Momentum and Burst**: play the matchup well and a gauge fills. Spend it and
  your next move cannot miss, always crits, and hits far harder
- **Bonds**: a monster that fights alongside you grows closer. It lands more
  criticals, and once you are four hearts in it will refuse to go down the first
  time a hit would finish it
- **Mentoring**: at Willow Rest, Miriam will give one of your younger monsters
  time with an older one. The younger learns a move the elder knows and comes
  back further along; the elder loses nothing at all. It is also the only place
  you get to choose which move a monster gives up
- **Two types on some species**: a Fire/Rock beast shrugs off Fire almost
  entirely and takes four times damage from Water. The multipliers stack both
  ways
- **The grass is not only monsters**: a pedlar with stock no town carries, a
  chest that is sometimes not a chest, a campfire, a stray that wants to come
  along, someone hurt at the side of the road that two people have already
  walked past, and after dark, a falling star
- **Somewhere to rest, always free**: every town has someone who patches your
  team up and will not take a coin for it
- **Townsfolk and trainers**: 27 NPCs to talk to, 12 of whom will battle you
  with a full team. Trainers spot you down the line they are facing, throw up an
  exclamation and walk over. Beaten trainers stay beaten
- **A rival** who turns up in each town with a stronger team than last time
- **Things to find**: 12 items hidden off the paths, remembered once taken
- **Towns that move**: the locals wander their patch instead of standing frozen
- **24 monsters to collect**, each with a fixed type, its own pixel art, its own
  learnset, and several with evolutions - four of them only after dark
- **Turn-based battles with real choices**: pick from up to four moves, each
  with limited uses, work the type chart, land criticals, inflict burn, poison,
  paralysis and sleep. Speed decides who swings first, and priority moves cut
  ahead of it
- **Encounters only in tall grass**, so the path is always the safe way through
- **Villages** with a nurse who heals you free and a shopkeeper who restocks you
- **Coins** from every win, spent on potions, antidotes and better balls
- **Monsterdex** tracking what you have seen and caught - filling it is the goal
- **A legendary** asleep at Ember Summit, at the far end of the region
- **Plays on a phone**: on-screen D-pad, a talk button, portrait and landscape

## 🗺️ The region

```
                                                      Willow Rest
                                                           ^ north
Sprout Town ──north──> Route 1 ──north──> Greenwood        │
                                              │ east       │
                                              v            │
   Ember Cave <──north── Still Shore <──north── Lakeside <──west── Whisper Wood
        │ east
        v
   Dust Road ──east──> Ember Summit
```

Levels climb along the chain: Route 1 sits at 3-5, Whisper Wood at 6-9, and
Dust Road at 19-24. Wild monsters run a level hotter after dark. Talk to the
sage in Greenwood before heading into the wood - he hands over something that
makes the trip a great deal easier.

North out of Whisper Wood is Willow Rest. There is no shop there - only Miriam,
who heals anyone who walks in for nothing, and lets your young monsters learn
from your older ones.

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

1. **Move**: the on-screen D-pad on a phone, or arrow keys / WASD on a desktop.
   Keep holding a direction and you break into a run
2. **Talk**: the **A** button, or Space / Enter. Face someone and press it -
   NPCs give directions, hints, and occasionally a monster
3. **Find monsters**: only the tall grass, rubble and scrub hide them. Stay on
   the path if you would rather not fight
4. **Battle**:
   - **Fight** - choose one of your monster's moves. Types matter: Water beats
     Fire and Rock, Grass beats Water and Rock, Fire beats Grass, Electric beats
     Water, Rock beats Fire and Electric. Normal is never resisted
   - **BURST** - the purple gauge under the health bars fills as you land good
     hits, and creeps up even while you are taking them. Full, it turns gold:
     tap it, then pick a move. That move cannot miss, always crits, and hits
     almost twice as hard
   - **Throw Ball** - the weaker and more status-afflicted the target, the
     better your odds. You cannot catch a trainer's monster
   - **Bag** / **Team** - use an item, or switch monster
   - **Run** - works on wild monsters. Trainers will not let you leave
5. **Towns**: the nurse restores your team's health *and* their move uses for
   free; the shopkeeper sells potions and balls
6. **Team order**: the ★ in the menu leads the next battle. Use the arrows to
   move a monster up or down
7. **Menu**: the MENU button, or ESC / M. Team, bag, Monsterdex, sound toggle.
   The row of hearts under each monster is how close it is to you
8. **The clock**: the corner of the screen shows the hour and the sky. Both
   change what you meet and how hard your moves land

### Tips

- Weaken a monster before throwing a ball; a full-health target rarely stays in
- A type disadvantage is worth switching monster over, not powering through
- The ▲ and ▼ on a move button say how it lands on what is in front of you
- Strong moves have few uses. Save Inferno for something that deserves it -
  run every move dry and you are left with Struggle, which hurts you too
- A fast monster that moves first can win a fight it would otherwise lose
- Trainers only see straight ahead. Slip around behind one and it will not notice
- The glinting balls off the path are worth the detour
- Trainers give far more EXP and coins than wild monsters
- Losing costs a fifth of your coins and sends you back to the last town -
  never your monsters or your progress
- Check the sky before a hard fight. A Fire team in the rain is a Fire team
  fighting at two thirds strength
- Night is worth walking into: the monsters are a level higher and four of them
  cannot be caught at any other time. Take a Night Ball if you meet the pedlar
- Keeping one monster out builds its bond faster than spreading fights around.
  Four hearts in, it starts surviving hits that should have finished it
- A monster with two types resists twice and folds twice. Water into a
  Fire/Rock beast is four times damage - and Fire into it barely registers
- The elder in a lesson loses nothing, so there is no reason not to teach.
  Bring a strong monster and a young one you actually want to use
- Not every rustle in the grass is a fight. Some of them are worth stopping for

## 📁 Project Structure

```
pokemon-game/
├── index.html              # Main HTML file
├── vendor/
│   └── phaser.min.js      # Phaser, vendored so the game runs offline
├── css/
│   └── style.css          # Game styles
├── js/
│   ├── config.js          # Tuning: damage, levelling, economy, zones, items
│   ├── main.js            # Game initialization and saving
│   ├── data/
│   │   ├── Types.js       # The six types and the effectiveness chart
│   │   ├── Moves.js       # Move definitions and status effects
│   │   ├── Species.js     # Stats, types, learnsets, evolutions, dex numbers
│   │   ├── Maps.js        # The region: towns, routes, exits, NPCs, trainers
│   │   └── Mentoring.js   # One monster teaching another
│   ├── entities/
│   │   ├── Player.js      # Player, team, coins, Monsterdex
│   │   └── Monster.js     # Stats, moves, status, levelling, evolution
│   ├── systems/
│   │   ├── BattleSystem.js   # Wild and trainer battles, momentum and Burst
│   │   ├── EncounterSystem.js
│   │   ├── Inventory.js
│   │   ├── WorldClock.js     # The hour of the day and the phases it passes
│   │   ├── Weather.js        # What the sky does, and what it does to damage
│   │   ├── RouteEvents.js    # The things in the grass that are not monsters
│   │   └── AudioManager.js   # Procedural music and sound effects
│   ├── world/
│   │   ├── WorldMap.js       # Builds one town or route from its definition
│   │   ├── TileTextures.js   # Bakes the tileset the world layer draws from
│   │   └── SkyOverlay.js     # Tint of the hour, plus rain, fog and sand
│   ├── ui/
│   │   ├── Minimap.js
│   │   ├── TouchControls.js  # On-screen D-pad and A button
│   │   └── UIManager.js      # HUD, battle panel, dialogue, menu, shop, dex
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── WorldScene.js
│   │   └── BattleScene.js
│   └── utils/
│       ├── MathUtils.js      # clamp/random, so game rules need no Phaser
│       ├── Rng.js            # Seeded RNG, so maps regenerate identically
│       ├── SpriteFactory.js  # Draws all pixel art into Phaser textures
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
tests over the config, maps, entities, battles and inventory. Several are design
checks rather than code checks, and they have each caught real problems:

- every species keeps at least two attacking moves, and has something that is
  not resisted by any type - this found a Bird whose whole moveset was
  Electric, and a Turtle that lost its only neutral attack to the four-move cap
- every exit is reachable from its map's spawn, by flood fill - procedural
  clutter could otherwise wall a route off and strand the player
- map generation is deterministic, so routes do not rearrange behind you
- every exit leads somewhere and has a matching exit back
- towns contain no encounter ground and always have a nurse and a shop, unless
  they are marked `plain` - in which case both counters must really be gone
- an elder passes on only moves it actually knows, loses nothing by it, and the
  taught move survives the levels that come with the lesson
- a species with two types keeps both across a save and reload
- no dialogue line, place name, monster name or event text in the whole region
  contains any of a list of words the game is meant to stay clear of
- only a monster you are close to holds on at 1 HP, never from full health, and
  never twice in one battle
- nothing nocturnal ever appears in daylight, and everything nocturnal is
  reachable at night
- every route event can fire under some condition, and none is offered to a
  player who cannot take it - no stray for a full team, no shop for an empty purse
- every item type has a branch in `Player.useItem` (the menu used to call a
  method that did not exist, and crashed)

Game rules deliberately avoid `Phaser.Math` (see `js/utils/MathUtils.js`) so the
data, map and battle logic can be tested without a running game.

### Building
For production, you might want to:
1. Minify the JavaScript files
2. Optimize assets

## 🎨 Graphics

Every sprite is drawn at runtime by `js/utils/SpriteFactory.js`. Everything -
all 24 monsters, the player, every townsperson - is a 32x32 grid of single
letters, one letter per pixel, painted into a canvas texture at boot:

```
'..........ohheeHIeehho..........'   o = outline, h H I = hair,
'..........ohcCCDDDDcho..........'   c C D = skin, e = eye,
'........o22122211111255o........'   5 2 1 3 6 = shirt, dark to light
```

The grids are generated rather than typed. `tools/art.py` describes a body as
a union of ellipses and polygons, measures how deep each pixel sits inside
that body, and lights it off that depth - so an ear rounds like an ear, a tail
does not black out for being thin, and a species and the thing it evolves into
come out lit identically. `tools/creatures.py` holds the body plans (quadruped,
flyer, serpent, arachnid, finned, crustacean, shelled, boulder, titan) and
`tools/person.py` the player and the townsfolk.

People needed two things the monsters did not. Materials: the same shading
remapped onto parallel letter sets, so a shirt, a face, a boot and a head of
hair all turn with one light. And a lift up the tone ramp, because a person is
a stack of parts none of which is more than seven pixels across, and without it
every part shades as an edge and the figure comes out in the two darkest tones.
Cloth also caps the top of its ramp: at full range the lit middle of a torso
lands as a pale patch in the belly and reads as an apron rather than a shirt.

NPCs are the player's front-facing frame in someone else's clothes, which is
what keeps the whole cast looking like one cast. Characters get a soft ellipse
baked in behind them with `destination-over`, so every person in the world
casts a shadow without a single extra game object.

The world tileset is baked once into a single texture and drawn as one culled
tilemap layer. Each tile is drawn rather than filled: grass grows blades, trees
have trunks and a lit canopy over a cast shadow, paths are laid as individual
cobbles, water has crests and troughs and a glint, rock is faceted into a lit
face and a dark one, and every surface carries a scatter of noise, because a
flat 32px square reads as plastic.

Battles are composed rather than tinted: a banded sky, a line of distant
scenery that changes with the zone - hills, a treeline, open water, dunes, or
stalactites coming down from a cave roof - a horizon, and ground that recedes.
The scenery stands in two ranges, a hazier one behind a solid one, and
everything on the horizon carries a rim of light down its lit side, because a
single row of shapes in one colour merges into one lump. The fighters stand on
that ground - the far one just past the horizon, the near one in the
foreground - each on a tight shadow inside a faint halo. It is all laid out
around the battle panel, so the horizon lands in the strip you can actually see
rather than behind the buttons.

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
item list. Monsters live in `js/data/Species.js`, moves in `js/data/Moves.js`, and the
region - towns, routes, exits, NPCs, trainer teams and hidden items - in
`js/data/Maps.js`. Adding a route means adding one entry there and an exit on
its neighbour. NPC coordinates are relative to the centre of their map.

## 🐛 Known Issues

- Outside a lesson at Willow Rest there is still no way to choose which move a
  monster forgets; levelling up drops the oldest
- The rival never travels with you, he only waits in towns
- Only the monster that is out earns EXP and bond; the bench learns nothing
- `js/utils/SpriteGenerator.js` is an older, unused experiment kept for reference

## 📝 License

This game is provided as-is for educational and entertainment purposes. Feel free to modify and distribute it.

## 🙏 Credits

- Built with [Phaser.js](https://phaser.io/)
- Inspired by Pokémon games
- Font: Press Start 2P

---

**Enjoy the adventure!** 🎮✨
