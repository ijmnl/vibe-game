# 🎮 Pixel Monster Adventure - Testrapport

Getest in een echte browser (Chromium via Playwright) op geëmuleerde
telefoons: iPhone 13 (390x664), Pixel 5 (393x727), Galaxy S9+ (320x658) en
liggend (844x390).

Het vorige rapport controleerde alleen of bestanden bestonden en of de
JavaScript-syntax klopte. Dat zei niets over of het spel start - en dat deed
het niet.

---

## 🔴 Uitgangssituatie

Het spel startte helemaal niet. `index.html` laadde `AudioManager.js` niet,
terwijl `main.js` er meteen een instantie van maakte:

```
[pageerror] AudioManager is not defined  (js/main.js:26)
```

Die fout brak het script af vóór `new Phaser.Game(...)`, dus er verscheen
nooit een spel - alleen een leeg scherm.

---

## 🐛 Gevonden en opgeloste fouten

| # | Probleem | Gevolg |
|---|----------|--------|
| 1 | `AudioManager.js` niet geladen in `index.html` | Spel startte niet |
| 2 | `audioManager` twee keer gedeclareerd (`main.js` + `AudioManager.js`) | `SyntaxError` na fix 1 |
| 3 | `BootScene` gebruikte `this.scene.events` (bestaat niet) | Crash in laadscherm |
| 4 | Laadscherm werd nooit verwijderd | Zwart scherm over het spel |
| 5 | `Minimap` riep `camera.getWorldView()` aan (Phaser 3: `camera.worldView`) | Crash bij eerste frame |
| 6 | `WorldScene` draaide `update()` twee keer, één keer zonder `delta` | Spelerpositie werd `NaN` |
| 7 | Team-monsters waren gewone objecten, wilde monsters `Monster`-instanties | `getRandomAttack is not a function` bij elk gevecht |
| 8 | `BattleScene` luisterde op eigen events, `BattleSystem` zond op `WorldScene` | Gevecht eindigde nooit; spel bevroor |
| 9 | Beurttimers stonden op de *gepauzeerde* `WorldScene`-klok | Tegenstander was nooit aan zet |
| 10 | `tryCatch()` gebruikte `playerMonster` buiten scope | Crash bij mislukte vangst |
| 11 | `checkBattleEnd()` draaide door na `endBattle()` (`this.player === null`) | Crash na geslaagde vangst of vlucht |
| 12 | Zowel `Player` als `EncounterSystem` rolde ontmoetingen; `Player` zond een event zonder monster | Crash bij gevecht |
| 13 | "Use Item" toonde een lijst binnen het verborgen menu | Knop deed niets in gevecht |
| 14 | Monster-sprites hoorden bij de gepauzeerde `WorldScene` | Onzichtbaar in het gevechtsscherm |
| 15 | Groen debug-collisionvak lag over de speler | Speler zag er bruin uit |
| 16 | Ontmoetingskans was ~1 per 50 seconden lopen | Voelde als een leeg spel |
| 17 | Testpagina berekende resultaten maar toonde ze nooit | Rapport leek leeg |

---

## 📱 Mobiel

| Onderwerp | Voor | Na |
|-----------|------|-----|
| Besturing | Alleen toetsenbord (swipe zette alleen de kijkrichting) | D-pad + MENU-knop op het scherm, plus pijltjes/WASD |
| Canvas | Vaste 800x600, `Phaser.Scale.FIT` | `Phaser.Scale.RESIZE`, vult het scherm |
| Schermgebruik staand | ~40% (zwarte balken boven en onder) | 100% |
| Viewport-meta | Zoomen/dubbeltikken mogelijk | `user-scalable=no, viewport-fit=cover` |
| Notch / afgeronde hoeken | Geen rekening mee gehouden | `env(safe-area-inset-*)` overal |
| Adresbalk die inklapt | `100vh` sprong | `100dvh` met `100vh` fallback |
| Raakdoelen | Knoppen van 12px tekst | Minimaal 44px hoog |
| Lettertype | 'Press Start 2P' nooit geladen | Via Google Fonts, met fallback |
| Audio | Startte zonder gebruikersgebaar (iOS blokkeert dat) | Wordt ontgrendeld bij eerste tik |
| Opslaan | Alleen elke minuut | Ook bij verlaten/achtergrond zetten van de pagina |
| Liggend | Ongetest | Eigen layout: 4 knoppen naast elkaar, kleinere D-pad |

---

## ⚡ Prestaties

De wereld (100x100 tegels) werd getekend als losse rechthoeken, elk een eigen
Phaser-object, plus een oneindige tween per watertegel. De minimap tekende
alle 10.000 tegels opnieuw bij elk frame.

Nu wordt de tegelset één keer in een textuur gebakken en de wereld als één
tilemap-laag getekend (Phaser cullt die zelf), en de minimap bewaart het
terrein op een offscreen canvas.

Gemeten op een geëmuleerde iPhone 13, tijdens het lopen:

| | Voor | Na |
|---|------|-----|
| **Beeldsnelheid** | **15 fps** | **60 fps** |
| Objecten in de wereldscène | 11.634 | 2 |
| Actieve tweens | 900 | 0 |

Ook 60-61 fps op Pixel 5 en Galaxy S9+.

---

## ✅ Wat er nu speelbaar is getest

Volledige doorloop op een geëmuleerde iPhone 13, zonder fouten in de console:

- Lopen met de D-pad, positie en zone worden bijgewerkt
- Wilde ontmoeting in gras, bos, grot en woestijn
- Gevecht: aanvallen, beurtwisseling, schade, type-effectiviteit
- Winnen → EXP → terug naar de wereld → weer kunnen lopen
- Vangen (inclusief mislukte pogingen en "team is vol")
- Vluchten (inclusief mislukte pogingen)
- Voorwerp gebruiken via de nieuwe keuzelijst in het gevecht
- Verliezen → alle monsters genezen, speler terug naar het startpunt
- Menu: team en voorwerpen, monster wisselen
- Opslaan en herladen: team, levels en voorwerpen blijven behouden
- Offline en vanaf een `file://`-adres (Phaser staat in `vendor/`)

De eigen testpagina (`test/index.html`): **26 tests, 0 gefaald**. De ene
waarschuwing ("Phaser.js not loaded in test environment") is verwacht - die
pagina laadt alleen de spelmodules, niet Phaser zelf.
