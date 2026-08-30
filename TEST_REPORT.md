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


---

# 🎮 Tweede ronde: het spel afmaken

Na de reparatie draaide het spel wel, maar het was nog kaal: gekleurde blokjes,
geen geluid, en gevechten waarvan de uitkomst vooral toeval was. "Aanvallen"
koos namelijk elke beurt een **willekeurig** type, dus een Slime kon zomaar
"Grass" gebruiken. En als je vijf ballen op waren, kon je nooit meer iets
vangen - er was geen enkele manier om er meer te krijgen.

## Wat erbij is gekomen

| Onderwerp | Voor | Na |
|-----------|------|-----|
| Grafisch | Gekleurde rechthoeken | 20 pixel-art monsters, een lopende speler in 4 richtingen, dorpstegels |
| Types | Willekeurig per exemplaar | Vast per soort, met een volledige 6x6 tabel |
| Aanvallen | Willekeurig type, geen keuze | Kies uit maximaal 4 aanvallen, met kracht, precisie en effecten |
| Statussen | Gedefinieerd maar nooit gebruikt | Brandwond, gif, verlamming en slaap werken |
| Team | Maximaal 3 | Maximaal 6, wisselen tijdens gevecht |
| Genezen | Alleen door te verliezen | Gratis geneespunt in elk dorp |
| Ballen | 5 stuks, daarna nooit meer | Munten uit gevechten, winkel in elk dorp |
| Vangen | Hard af na 3 pogingen | Kans op basis van HP, status, level en balsoort |
| Voortgang | Geen doel | Monsterdex (20 te vangen), evoluties, een legendarisch monster |
| Moeilijkheid | Overal level 1-5 | Levels lopen op met de afstand tot je startdorp |
| Geluid | `AudioManager` bestond, werd nooit aangeroepen | Muziek per zone, gevechtsmuziek, effecten, geluidsknop |

## Wat het testen opleverde

Het spel is uitgespeeld in een echte browser op geëmuleerde telefoons. Wat
daarbij naar boven kwam:

- **Een val in de winkel.** De winkel ging weer open zodra je hem sloot, omdat
  je nog op de tegel stond. Je kon er niet meer uit.
- **Schade stond veel te hoog.** Een Bird van level 7 deed **121 schade** aan
  een starter met 61 HP - dood in één klap. De vermenigvuldigers stapelden
  (1,5x eigen type x 2x effectief x 1,5x kritiek = 4,5x). Nu doet een gewone
  klap ongeveer een vijfde van een levensbalk.
- **De openingsregel van het gevechtslog verdween altijd**, omdat het paneel
  het logvenster leegde nadat die regel er al in stond.
- **Het gevechtsscherm zat achter een zwarte sluier** van 75%, waardoor alle
  sprites er grauw uitzagen.
- **Liggend paste het niet.** Nu staat het paneel rechts en staan de monsters
  ernaast in plaats van erboven.
- **Doodlopende gevechten.** Een eigen test controleert of elk monster wel
  ergens neutrale schade mee kan doen. Die vond er twee: een Bird die alleen
  nog Electric-aanvallen had, en een Turtle die zijn enige neutrale aanval
  kwijtraakte aan de limiet van vier aanvallen. Pyrefox kon een Golem
  helemaal geen schade doen: Fire en Normal werden allebei weerstaan. Normal
  is nu nergens meer zwak tegen.

## Prestaties

Nog steeds **60-61 fps** op iPhone 13, Pixel 5 en Galaxy S9+, ondanks alle
nieuwe sprites en systemen.

## Tests

De testpagina (`test/index.html`) is uitgebreid van 26 naar **37 tests, 0
gefaald**. Een deel daarvan controleert het spelontwerp in plaats van de code:
of elke soort een compleet en kloppend profiel heeft, of elk dorp een
geneespunt en een winkel krijgt, of je startplek begaanbaar is, en de twee
controles hierboven die de doodlopende gevechten vonden.

Spelregels gebruiken bewust geen `Phaser.Math` meer (zie
`js/utils/MathUtils.js`), zodat ze te testen zijn zonder draaiend spel.


---

# 🗺️ Derde ronde: een regio, NPC's en balans

Feedback na het spelen: het laatste beest leek "gecached", er waren geen NPC's,
de wereld was één grote lap, en de eerste gevechten waren te zwaar.

## 1. De cachebug — bevestigd en opgelost

Gereproduceerd met een team van drie. Na wisselen naar de Fox en het gevecht
verlaten, toonde het volgende gevecht:

```
paneel: "Slime"        sprite op het scherm: monster-Fox
```

Het paneel klopte, de **sprite niet**. `createMonsterViews()` draaide vóór
`startBattle()`, en pas `startBattle()` bepaalt wie er vooraan staat. De sprite
werd dus uit de oude index getekend. De volgorde is omgedraaid en het maken van
de sprites is idempotent gemaakt.

## 2. Eén grote kaart → een regio van negen kaarten

De wereld van 100x100 is vervangen door negen kleine kaarten, verbonden met
uitgangen: drie dorpen en zes routes. Elke kaart komt uit een vaste seed, dus
een route ziet er hetzelfde uit als je terugloopt — met `Math.random()` zou de
wereld achter je rug herschikken.

Ook nieuw: **wilde monsters zitten alleen in het hoge gras** (of puin in de
grot, struiken in de woestijn). Blijf je op het pad, dan gebeurt er niets. Dat
geeft je zelf de keuze wanneer je vecht.

## 3. NPC's en trainers

24 NPC's verdeeld over de regio, waarvan 9 trainers met een compleet team. Een
verslagen trainer blijft verslagen (opgeslagen). Trainers geven meer EXP en
munten dan wilde monsters, je kunt hun monsters niet vangen en niet vluchten.

Praten gaat met de nieuwe **A-knop** (of spatie/enter): ga voor iemand staan en
druk.

## 4. Balans

Gemeten in plaats van gegokt, met gesimuleerde gevechten (300 per combinatie):

| | Voor | Na |
|---|------|-----|
| Startteam | Slime L5, Rat L4 | Slime L6, Rat L6 |
| Route 1 monsters | overal level 1-5, oplopend met afstand | vaste band per route: 3-5 |
| Winkans op Route 1 | wisselend, soms hopeloos | **96-100%**, 3-8 beurten, ~45% HP over |
| Startmunten | 50 | 120 |

**Een muur die het testen blootlegde**: op het niveau waarmee je Whisper Wood
binnenkomt, verloor een Slime **100%** van de gevechten tegen Spider, Owl en
Snake — allemaal Grass, en Grass doet dubbele schade op Water. Een Rat haalde
2-40%. Het antwoord was een Fire-monster, en dat woont *in* het bos dat je niet
overleeft.

De wijze man in Greenwood zei al "neem iets dat vuur spuwt". Dat is nu letterlijk
gemaakt: hij **geeft** je een Fox (Lv.8), één keer, opgeslagen. Daarmee ga je van
0% naar 100% in het bos. Verder is een niet-Grass monster aan het bos toegevoegd
en leren de starters hun echte aanvallen eerder (Rat op 11 in plaats van 15).

## 5. Wat het testen verder ophaalde

- **Still Shore en Ember Cave waren volledig gevaarterrein** (463 en 414 tegels)
  omdat de basisgrond zelf een encounter-tegel was. Je werd non-stop aangevallen.
  Nu 71-135 tegels aan duidelijke plekken, met veilige paden ertussen.
- **De grot zag eruit als een lege kamer.** Meer wanden en duidelijker contrast
  tussen veilig pad en puin, anders is "blijf op het pad" niet te gebruiken.

## Tests

Van 37 naar **38 tests, 0 gefaald**. Nieuw en bewust ontwerpgericht:

- **elke uitgang is bereikbaar vanaf het startpunt**, via flood fill — anders
  kan procedurele rommel een route dichtmetselen en zit je vast
- kaartgeneratie is deterministisch (route verandert niet achter je rug)
- elke uitgang heeft een uitgang terug, aan de juiste kant
- dorpen bevatten geen gevaarterrein en hebben altijd een verpleegster en winkel
- trainerteams gebruiken bestaande soorten binnen de levelband van hun route

Prestaties onveranderd: **60-61 fps** op iPhone 13, Pixel 5 en Galaxy S9+.


---

# ⚔️ Vierde ronde: diepgang in de gevechten

Feedback: het teamvolgorde wijzigen ontbrak, en de gevechten konden meer om het
lijf hebben.

## Teamvolgorde

Pijltjes per teamlid in het menu. De ★ bovenaan gaat het volgende gevecht in.

Daarbij viel iets op wat niet klopte: je kon een teamlid **aantikken** om het te
selecteren, met een gele rand als bevestiging — maar dat had geen enkel effect,
want `startBattle()` kiest altijd het eerste gezonde teamlid. De UI beloofde iets
wat het spel negeerde. Het aantikken is eruit; de rand en de ster markeren nu
allebei wie er écht vooraan staat.

## Snelheid deed niets

De speler was **altijd** als eerste aan zet. De `speed`-stat had daardoor geen
enkele functie, en de `priority: 1` op Quick Jab was dode data die nooit werd
gelezen.

Nu bepalen prioriteit en snelheid wie eerst slaat, en verlamming halveert je
snelheid. Gemeten over 200 vergelijkingen:

| | resultaat |
|---|---|
| Snelste monster eerst (Bat 56 vs Golem 10) | 200/200 |
| Quick Jab wint van hogere snelheid | 200/200 |
| Verlamming: Bat 56 → 28 | ✓ |

## Aanvallen zijn niet meer oneindig

Elke aanval heeft nu een beperkt aantal beurten (PP). Sterke aanvallen hebben er
het minst: Inferno 8, Ember 25. Op is op — daarna val je terug op **Struggle**,
dat zwak is en jezelf ook pijn doet. De verpleegster in het dorp vult ze gratis
weer aan, wat dorpen een echte functie geeft in plaats van alleen genezen.

## Zichtbaarder

- **Schadegetallen** stijgen op boven wie geraakt wordt, groter en goud bij een
  kritieke treffer, oranje bij dubbele schade
- **▲ / ▼ op de aanvalsknoppen** laten zien hoe die aanval valt bij het monster
  dat tegenover je staat
- **PP per aanval** op de knop, zodat je ziet wat er nog in zit
- **Level omhoog** blijft langer staan (1,2s in plaats van 0,7s), evolueren 1,8s

## Balans na de omslag

Snelheidsvolgorde maakt gevechten zwaarder: de tegenstander kan nu vóór jou
slaan. Opnieuw gemeten met 300 gesimuleerde gevechten per combinatie:

| | winkans |
|---|---|
| Route 1, de meeste gevechten | 99-100% |
| **Route 1, Slime tegen Bird** | **69%** |
| Whisper Wood met de Fox | 100% |
| Alle trainers, met een passend team | 96-100% |

Die 69% is bewust blijven staan. Bird is snel én Electric, en Electric doet
dubbele schade op Water — dus je Slime wordt geregeld verslagen. Je Rat wint dat
gevecht wel (99%). Dat is precies de les die het typesysteem hoort te geven:
wissel van monster in plaats van doorduwen.

## Tests

Van 38 naar **44 tests, 0 gefaald**. Nieuw: beurtvolgorde volgt prioriteit en
dan snelheid, verlamming halveert snelheid, elke aanval heeft PP en sterkere
aanvallen minder, leeg raken valt terug op Struggle, de verpleegster vult PP aan,
en teamvolgorde wijzigen werkt inclusief de randgevallen aan begin en eind.
