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


---

# 🌾 Vijfde ronde: leven in de wereld

## Trainers zien je nu aankomen

Elke trainer heeft een kijkrichting en een zichtafstand. Loop je door hun blikveld,
dan verschijnt er een **!** boven hun hoofd, lopen ze naar je toe en beginnen ze
het gesprek. Je kunt er ook omheen sluipen — ze kijken alleen recht vooruit.

## Voorwerpen om te vinden

12 stuks verspreid over de routes, net naast het pad, met een licht wippende
glinstering zodat je ze van een afstand ziet. Eenmaal opgeraapt blijven ze weg,
ook na herladen.

## Een rivaal

Kes duikt op in elk van de drie dorpen, met steeds een sterker team (level 6 →
12 → 18) en een doorlopend gesprek. Hij verschijnt pas als je de vorige
ontmoeting hebt gewonnen.

## Dorpen bewegen

Bewoners scharrelen rond binnen een paar tegels van hun startplek. De
verpleegster en winkelier blijven staan waar ze horen.

## Rennen

Blijf je een richting vasthouden, dan versnel je na 350ms naar 1,75x. Gemeten
per frame in een open stuk: 3,2px lopend, 5,6px rennend — exact de ingestelde
factor. Een eerdere meting over afstand gaf een verkeerd beeld doordat de speler
tegen bomen aanliep; per frame meten haalde dat weg.

## Tests

Van 44 naar **49 tests, 0 gefaald**. Nieuw:

- elk verstopt voorwerp ligt op een begaanbare tegel én is bereikbaar vanaf het
  startpunt (opnieuw via flood fill)
- elke trainer met zicht heeft een kijkrichting en staart niet in een muur
- de rivaal-keten loopt op volgorde en wordt elke keer sterker
- rondlopende NPC's hebben een thuistegel en een redelijke straal


---

# 🩹 Controle: werkt het spel echt?

Een verse doorloop vanaf leeg opslagbestand haalde één echte fout boven water.

## De eerste rivaal was onwinbaar

Kes stond in het startdorp met **Bird L6 vooraan**. Bird is Electric en snel, en
Electric doet dubbele schade op Water — precies het type van je starter. Gemeten
over 400 gesimuleerde teamgevechten:

| | winkans voor een verse speler |
|---|---|
| Zoals ingesteld (Bird vooraan) | **4%** |
| Met de Rat vooraan | 26% |
| Rat vooraan, allebei level 5 | **88%** |

Het allereerste gevecht van het spel was dus zo goed als niet te winnen, en je
kunt niet vluchten voor een trainer. Zijn team is nu Rat L5 gevolgd door Bird L5:
88%. Een echt gevecht, maar te winnen.

De latere ontmoetingen waren wel goed: fase 2 op 92%, fase 3 op 70%.

## Wat verder gecontroleerd is

Doorloop op een geëmuleerde iPhone 13, vanaf niets: rivaal verslaan (+80 munten,
opgeslagen als verslagen), naar Route 1, voorwerp oprapen, wild gevecht, naar
Greenwood, de Fox cadeau krijgen, iets kopen, opslaan, herladen — alles kwam
terug zoals het was. Geen enkele consolefout.

Route 1 met je volledige startteam: **100%** tegen alles wat er rondloopt. Maar
met alleen je Slime tegen een Bird: **7%**. Wisselen van monster is dus geen
luxe maar de bedoeling.

49 tests, 0 gefaald.

---

# 🌙 Ronde 5: dag en nacht, weer, momentum, banden en fusie

Een nieuwe ronde met vijf systemen erbij. Alles opnieuw gemeten op geëmuleerde
iPhone 13, Pixel 5 en Galaxy S9+.

## Wat erbij is gekomen

| Systeem | Wat het doet |
|---------|--------------|
| Dag en nacht | Een volle dag duurt 8 minuten. De wereld kleurt mee, de klok staat in de hoek, en vier soorten komen alleen 's nachts tevoorschijn |
| Weer | Regen, brandende zon, zandstorm en mist — per kaart, met echte gevolgen voor schade, raakkans en aftakeling |
| Momentum en Burst | Een balk die vult als je goed speelt. Vol besteed je hem aan één klap die niet mist, altijd kritiek is en 1,8x hard aankomt |
| Banden | Een monster dat naast je vecht raakt aan je gehecht: meer kritieke treffers, en vanaf vier hartjes weigert het één keer per gevecht om om te vallen |
| Fusie | De wachter bij het Hollow Shrine smelt twee monsters samen tot één met twee types |
| Gebeurtenissen onderweg | Niet elk geritsel in het gras is een monster |

## Gemeten, niet gegokt

### De Burst doet wat hij belooft

400 schadeberekeningen per geval, zelfde aanval, zelfde monster:

| | gemiddelde schade |
|---|---|
| Gewone treffer | 20 |
| Burst | 49 (**2,45x**) |

In een echt gevecht door de UI heen: normaal ~20-27 schade, de Burst deed **66**.
De balk vulde in dat gevecht in 6 beurten; met typevoordeel gaat dat in 3.

### Weer verschuift echt de balans

Bubble (Water) op hetzelfde doelwit, 400 keer per weertype:

| Weer | gemiddelde schade | verhouding |
|------|---|---|
| Helder | 20 | 1,00 |
| Regen | 27 | **1,35** |
| Zon | 13 | **0,65** |

Een zandstorm doet 6% van de maximale HP per beurt aan alles wat geen Rock is —
Rock-monsters, en fusies met Rock erin, blijven ongemoeid. Mist kost iedereen
12 procentpunt raakkans.

### Banden

| Hartjes | kans op kritiek | houdt stand op 1 HP |
|---|---|---|
| 0 | 6,25% | nooit |
| 3 | 9,85% | nooit |
| 4 | 11,05% | 35% |
| 5 | 12,25% | 34% |

Nooit vanaf volle gezondheid, nooit tegen een klap die je toch zou overleven, en
nooit twee keer in hetzelfde gevecht. Gecontroleerd over 2000 pogingen per geval.

### Fusie is de moeite waard — en heeft een prijs

Fox L20 + Golem L20 wordt **Folem**, Fire/Rock, 208 HP / 57 aanval / 50 verdediging.
Tegen dezelfde tegenstanders, 400 duels per vakje:

| Tegenstander | fusie | Fox alleen | Golem alleen |
|---|---|---|---|
| Rattler (Normal) | **56%** | 0% | 45% |
| Owl (Grass) | **100%** | 100% | 98% |
| Stormwing (Electric) | **100%** | 0% | 100% |
| Oozer (Water) | **0%** | 0% | 4% |

Beter dan allebei zijn ouders in drie van de vier gevallen, en kansloos in het
vierde: Water doet 2x op Fire én 2x op Rock, en dat stapelt tot **4x**. De
wachter zegt het van tevoren — "het draagt de zwaktes van allebei" — en dat is
precies de afweging.

## 🐛 Gevonden en opgelost in deze ronde

| # | Probleem | Gevolg |
|---|----------|--------|
| 1 | **Nacht op Route 1 was onwinbaar** | Zie hieronder — 6% winkans voor een startteam |
| 2 | `player.useItem()` bestond niet | Een voorwerp gebruiken vanuit het menu crashte met een TypeError. Al langer stuk, nu pas gevonden |
| 3 | Het fusiescherm ving geen tikken op | De CSS-regel voor de overlays noemde `#fusion-ui` niet, dus het canvas eronder slikte elke tik. Onbruikbaar op een telefoon |
| 4 | Fusiesprites verdwenen na herladen | De sprite werd alleen bij het samensmelten getekend; na een herstart had het monster geen textuur meer |
| 5 | Meldingen stapelden op elkaar | Twee meldingen tegelijk werden letterlijk over elkaar heen gedrukt, midden over een open menu |
| 6 | "The chest held a Antidote" | Lidwoord klopte niet bij klinkers |
| 7 | Het gevechtslog sneed de bovenste regel doormidden | De hoogte was geen heel aantal regels; naar beneden gescrold bleef er een halve regel staan, wat op een tekenfout lijkt |
| 8 | `forceEncounter()` gaf soms een gebeurtenis in plaats van een gevecht | Sinds gebeurtenissen bestaan liep die functie door dezelfde loterij. De naam loog, en tests werden wisselvallig |

### 1. Nacht op Route 1 was een muur

Shade en Moth waren ontworpen als monsters voor het midden van het spel, maar
stonden op de nachtlijst van Route 1 — de allereerste route. Gemeten met een
vers startteam (Slime L6 + Rat L6) tegen één wild monster, 400-500 duels per rij:

| Tegenstander | winkans |
|---|---|
| Slime / Rat / Bird L5 (overdag) | 100% |
| Shade L6 — zoals eerst ontworpen | **5%** |
| Moth L6 — zoals eerst ontworpen | **6%** |

Shade had op level 6 zo'n 85 HP en 34 aanval, tegen de 59 HP en 24 aanval van
een Bird: ruwweg het dubbele van alles wat er overdag rondloopt.

Het bleek een scherpe drempel — twee punten aanval erbij of eraf zwaaide de
winkans 60 punten:

| Shade hp/aanval/verdediging/snelheid | winkans |
|---|---|
| 44/18/13/20 | 91% |
| **45/19/13/20** | **75%** |
| 46/20/14/21 | 30% |
| 48/22/15/22 (origineel) | 5% |

Definitief: Shade 45/19/13/20, Moth 37/16/11/24. Daarmee komt de nacht uit op
**74-90%** tegen de 100% van overdag: merkbaar zwaarder, maar te doen — zeker
met vier drankjes op zak en de mogelijkheid om te vluchten.

## Balans na afloop

Alles opnieuw gemeten, 400 duels per rij:

| Gevecht | winkans |
|---|---|
| Rivaal 1 (vers team) | 89% |
| Rivaal 1 in de regen | 98% |
| Rivaal 1 in de mist | 82% |
| Trainer Mia | 96% |
| Route 1 overdag | 100% |
| Route 1 's nachts | 74% |
| Rivaal 2 | 89% |
| Rivaal 3 | 92% |

Weer verschuift een gevecht dus met 8 tot 16 procentpunt — genoeg om de lucht
te controleren voordat je een trainer aanspreekt.

## Prestaties

Zwaarste geval: nacht, regen, buiten op een route met rondlopende NPC's.

| Telefoon | scherm | fps | objecten | regendruppels | tweens |
|---|---|---|---|---|---|
| iPhone 13 | 390x664 | 60 | 29 | 22 | 24 |
| Pixel 5 | 393x727 | 57 | 29 | 22 | 24 |
| Galaxy S9+ | 320x658 | 60 | 29 | 22 | 24 |

Per weertype op een Pixel 5: helder 56, regen 57, mist 55, zandstorm 58 — binnen
de ruis van elkaar. Mist en zandstorm gebruikten eerst 9 en 14 grote doorzichtige
wolken; dat kostte meetbaar frames, dus het zijn er nu 6 en 8.

## Tests

Van 49 naar **73 tests, 0 gefaald**. De nieuwe sectie controleert onder meer:

- de klok komt door elke fase van de dag, en `skipTo` landt op de fase die je vraagt
- de wijzerplaat loopt logisch: dageraad leest als ochtend, nacht als late avond
- een nieuw spel begint bij daglicht, niet middenin de nacht
- geen enkel dorp krijgt weer, en de zon komt nooit op na zonsondergang
- regen en zon duwen Water en Fire precies tegengesteld
- een zandstorm slaat Rock over en niets anders
- typevoordeel stapelt over allebei de types van een fusie
- een fusie erft alleen aanvallen die een van beide ouders echt kende
- een fusie overleeft opslaan en herladen mét zijn gemengde waarden en sprite
- een fusie evolueert nooit ongevraagd weg
- fuseren weigert zichzelf, een legendarisch monster, en een bestaande fusie
- alleen een monster waar je een band mee hebt houdt stand, en maar één keer
- niets nachtelijks verschijnt overdag, en alles nachtelijks is 's nachts bereikbaar
- elke gebeurtenis onderweg kan ergens afgaan, en geen enkele wordt aangeboden
  aan iemand die er niets mee kan
- elk voorwerptype heeft een tak in `Player.useItem` — precies de crash uit
  punt 2 hierboven
- een `plain` dorp heeft echt geen genezer of winkel meer op de kaart staan
- het Hollow Shrine is te belopen vanaf het startdorp

## Doorloop

Vanaf een leeg opslagbestand op een geëmuleerde iPhone 13: praten met de nieuwe
coach, het rivaalgevecht helemaal door de UI heen uitvechten (gewonnen, +80
munten, opgeslagen als verslagen), de hele regio doorlopen inclusief het Hollow
Shrine, twee monsters samensmelten, opslaan en herladen — de fusie kwam terug
met zijn types, waarden en sprite. Geen enkele consolefout.

73 tests, 0 gefaald.

---

# 🕊️ Ronde 6: de toon van de wereld, en betere graphics

Twee losse opdrachten in één ronde: het spel mag niet tegen Bijbelse waarden
ingaan, en de graphics moeten beter.

## Wat eruit is gegaan

| Was | Is nu |
|-----|-------|
| **Hollow Shrine** — een wachter en een steen waar twee monsters in gingen en er één uit kwam | **Willow Rest** — een rusthuis waar Miriam een jong monster tijd geeft met een ouder monster |
| Fusie: allebei de ouders verdwenen, onomkeerbaar | Mentoring: de jongere leert een aanval en groeit; de oudere raakt niets kwijt |
| "Whatever answers it, answers to no one" bij de top | "Het is gemaakt, net als jij en ik" |
| Monsters **Wisp**, **Lanturne**, **Shade** (dwaallicht, geest) | **Emberfly**, **Lampwing**, **Dusker** — gewone nachtdieren |
| `lair`-tegel als paarse altaarsteen | `den` — een hol in de rots met vuurgloed |
| "Wens bij een vallende ster" | Even stilstaan en omhoog kijken naar wat er hangt |

Er staat nu ook een test op die toon: hij leest **elke dialoogregel, elke
NPC-naam, elke plaatsnaam, elke soortnaam en elke gebeurtenistekst** en faalt
op woorden als shrine, altar, idol, spirit, ritual, curse of omen. Woordgrenzen
erbij, want "omen" zit in "moment".

## Wat erin is gekomen

- **Mentoring** — kies een oudere en een jongere; de jongere leert één aanval
  die de oudere kent en sluit een derde van het levelgat. Het is ook de enige
  plek waar je zélf kiest welke aanval eruit gaat
- **De barmhartige Samaritaan onderweg** — iemand zit gewond langs het pad, en
  twee mensen zijn al doorgelopen. Stoppen kost je 60 munten uit eigen zak. Wat
  hij teruggeeft is minder waard dan wat het je kostte, en dat is de bedoeling
- **De rivaal breekt** — na het derde gevecht geeft Kes toe dat hij tegen beter
  weten in bleef zeggen dat je geluk had, biedt zijn excuses aan, en geeft je
  één van zijn eigen monsters
- **Gratis rusten, overal** — een test bewaakt dat elk dorp iemand heeft die je
  team oplapt zonder te rekenen
- **Eerlijke weegschaal** bij de winkelier, en een oudere met een oud gezegde

## Dubbele types, nu bij de soort zelf

Dubbele types kwamen alleen uit fusie. Nu dragen drie soorten er zelf twee:
**Crab** (Water/Rock), **Camel** en **Volcanor** (allebei Fire/Rock). De
vermenigvuldigers stapelen twee kanten op:

| Gevecht | winkans |
|---|---|
| Het grote beest tegen een voorbereid Water-team | **96%** |
| Het grote beest tegen een Fire-team | **0%** |
| Camel tegen een Water-tegenstander | 0% |

Vier keer schade van Water, en Fire ketst er bijna volledig op af. De wachter
bij de top zegt van tevoren "let op je team".

## Balans na afloop

| Gevecht | winkans |
|---|---|
| Rivaal 1 (vers team) | 89% |
| Trainer Mia | 94% |
| Route 1 overdag | 100% |
| Route 1 's nachts | 75% |
| Rivaal 2 | 89% |
| Rivaal 3 | 94% |

Onveranderd ten opzichte van de vorige ronde — de hernoemde nachtsoorten
houden dezelfde waarden.

## Graphics

**De tileset is opnieuw getekend.** Elke tegel wordt nu getekend in plaats van
gevuld:

- gras krijgt sprieten, hoog gras krijgt hogere sprieten met een lichte punt
- bomen hebben een stam met een lichte kant, een bladerdek in drie lagen, en
  een schaduw op de grond
- paden liggen als losse keien met een randje en een lichte bovenkant
- water heeft golfkammen, dieptekleur en een glinstering
- rots is gefacetteerd: een belichte kant en een donkere
- zand krijgt duinribbels, muren krijgen metselwerk met voegen en een raam
- en over alles ligt een spikkelpatroon, want een vlak van 32 bij 32 pixels
  leest als plastic

De variatie tussen de vier varianten per tegel stond op ±8 in helderheid; met
de nieuwe textuur erbij werd een weiland daardoor zichtbaar lappendeken. Nu ±3.

**Schaduwen onder iedereen.** Een zachte ellips wordt met
`globalCompositeOperation = 'destination-over'` áchter de al getekende sprite
gezet en in de textuur gebakken — geen extra tekenobject, en hij kan nooit uit
de pas lopen met de sprite waar hij bij hoort.

**Vier nieuwe lichaamsvormen** voor de nachtsoorten, die eerst bestaande vormen
leenden: `moth` (brede vleugels), `firefly` (klein met een gloeiende staart),
`lampwing` (lantaarnlijf) en `prowler` (laag viervoetig nachtdier).

**Het gevechtsscherm is een scène geworden.** Geen vlakke kleur met een paar
ellipsen meer, maar een gelaagde lucht, een horizon, en grond die wegloopt —
met per zone iets anders aan die horizon: heuvels, een bomenrij, open water,
duinen, of stalactieten die van een grotdak naar beneden komen.

Eerst zat de horizon op de helft van het **scherm**, en dat viel precies achter
het gevechtspaneel: je zag alleen lucht. De scène wordt nu opgebouwd rond de
strook die je echt ziet — het paneel staat rechtop onderaan in portret en opzij
in liggend, en de horizon volgt.

**Typebadges** in het gevechtspaneel, in de kleur van het type. Met twee types
die stapelen is weten wat er tegenover je staat geen luxe meer.

## Prestaties

| Telefoon | fps |
|---|---|
| iPhone 13 | 60 |
| Pixel 5 | 57 |
| Galaxy S9+ | 60 |

Onveranderd: de tileset wordt één keer gebakken, en de gevechtsachtergrond is
een stuk of dertig rechthoeken in plaats van een textuur die uitgerekt moet
worden.

## Tests

Van 74 naar **78 tests, 0 gefaald**. De fusietests zijn vervangen door
mentoring-tests:

- een oudere geeft alleen aanvallen door die hij zelf kent, en de leerling
  krijgt er minstens één level bij
- de oudere raakt niets kwijt: geen levels, geen HP, geen aanvallen
- fuseren van zichzelf, een te klein levelgat en een leerling die alles al kent
  worden alle drie geweigerd
- de speler kiest zelf welke aanval eruit gaat, en zonder die keuze weigert het
  systeem in plaats van er stilletjes één te laten vallen
- de aangeleerde aanval overleeft de levels die er direct bij komen — de
  leerling kan onderweg evolueren en eigen aanvallen leren, en die mogen de
  aangeleerde niet van de lijst duwen
- soorten dragen hun eigen tweede type, en dat overleeft opslaan en herladen

Plus de twee toon-tests: geen enkel woord uit de verboden lijst in de hele
wereld, en elk dorp heeft gratis rust.

## Doorloop

Vanaf leeg opslagbestand op een geëmuleerde iPhone 13: rivaalgevecht door de UI
uitgevochten en gewonnen, de hele regio doorlopen inclusief Willow Rest, een les
gegeven (Slime Lv.6 met twee aanvallen kwam terug als Lv.12 met vier, Pyrefox
raakte niets kwijt), opgeslagen en herladen. Geen enkele consolefout.

78 tests, 0 gefaald.

---

# Ronde: de rest van de tekeningen

## Wat er nog niet klopte

De 24 monsters waren opnieuw getekend op 32x32, en daarna waren de mensen het
zwakste dat er nog in stond: acht regels met de hand getypte letters, met een
plat blok huidskleur als gezicht. Naast de nieuwe monsters lazen ze als een
tijdelijke tekening die iemand vergeten was te vervangen.

Verder viel er in het spel zelf nog drie dingen op die plat waren, en één dat
op de verkeerde plek stond.

## De mensen

Nu op dezelfde manier gemaakt als de monsters: beschreven als een stapel
vormen en belicht met één licht. Ze worden geschilderd op één rastercel per
beeldpunt, dus de lopende figuur is precies even groot op het scherm als altijd
en heeft alleen vier keer zo veel detail.

Twee dingen die de monsters niet nodig hadden:

- **Materialen.** Dezelfde belichting doorvertaald naar parallelle
  letterreeksen, zodat een hemd, een gezicht, een laars en een bos haar
  allemaal met hetzelfde licht meedraaien.
- **Optillen.** Een monster is één grote massa en vindt het midden van de
  toonladder vanzelf. Een mens is een stapel onderdelen waarvan er geen enkele
  breder is dan zeven beeldpunten, dus zonder de hele figuur op te tillen
  schaduwt elk onderdeel als een rand en komt de figuur alleen in de twee
  donkerste tonen uit.

Stof moest bovendien zijn hoogtepunten afgetopt krijgen: over de volle ladder
komt het verlichte midden van een romp uit als één ronde lichte vlek op de buik,
en dat leest als een schort in plaats van als een hemd.

De dorpelingen zijn hetzelfde figuur in andermans kleren, wat de hele bezetting
er als één bezetting uit laat zien.

## De bestrating

Wisselde een lichte en een donkere tegel af op een dambordpatroon dat
meedraaide met de tegelvariant. Op één tegel is dat een geplaveid pleintje, over
een heel dorp is het een schaakbord. Elke steen krijgt nu een eigen kleine toon.

## De gevechtsachtergrond

De horizon was een rij identieke ellipsen in één kleur, wat tot één klomp
samensmelt. Er staan nu twee reeksen — een wazigere achter een massieve — en
alles op de horizon krijgt een randje licht aan de belichte kant: heuvels,
boomkruinen en de druipstenen in de grotten. Dorpen krijgen een bomenrij in
plaats van de modderbruine heuvels die ze hadden.

De grond was zes bleke ellipsen willekeurig over de middenafstand verspreid, wat
las als vlekken op de vloer. Ze beginnen nu klein en vaag bij de horizon en
groeien naar de camera toe, en ze nemen hun toon over van de vloer waar ze op
liggen — donkerder op zand, lichter in een grot, waar mengen naar zwart ze
onzichtbaar maakte.

En de verre vechter stond in de lucht. Allebei de vechters werden gecentreerd in
de zichtbare strook, waardoor de tegenstander — en de schaduw eronder — ruim
boven de horizon terechtkwam. Hij staat nu op de grond net voorbij de horizon,
met de dichtstbijzijnde in de voorgrond. Zijn schaduw is twee ellipsen in plaats
van één, een strakke kern in een vage halo, want één platte ellips leest als een
plas op de vloer.

## Prestaties

| Telefoon | wereld | gevecht |
|---|---|---|
| iPhone 13 | 60 fps | 58 fps |
| Pixel 5 | 60 fps | 60 fps |
| Galaxy S9+ | 60 fps | 60 fps |

Onveranderd: alle texturen worden één keer bij het opstarten gebakken, en de
mensen worden op één rastercel per beeldpunt geschilderd, dus de speler en de
dorpelingen kosten precies evenveel als voorheen.

78 tests, 0 gefaald.

---

# Ronde 3 — na het spelen

Drie klachten uit het spelen zelf, en de camerazoom die eronder lag.

## Het gevecht sloot te snel af om de level-up te zien

De level-up werd wel getoond: een klein zwevend label boven het monster, 1200 ms
lang, over zijn eigen naamplaatje heen. Daarna riep `endBattle()` meteen
`scene.stop()` aan. Wie op het scherm keek in plaats van in het logboek zag er
niets van.

Een gewonnen gevecht eindigt nu op een resultatenpaneel: munten, EXP, een
EXP-balk die van nul vult, en de level-up of evolutie uitgeschreven. Het paneel
houdt het gevecht open — `BattleSystem.presentSpoils()` wacht op een
`battle-continue`-event dat pas komt als er getikt (of op spatie/enter gedrukt)
wordt. Gebeurde er niets bijzonders, dan ruimt het zichzelf na 1,5 seconde op,
zodat grinden geen knoppenwerk wordt. De level-up zelf is nu een banner over de
arena met een lichtring om het monster in plaats van een zwevend labeltje.

## Evolueren

Het gebeurde wél, maar het leverde niets op. `Monster.recalculateStats()` leest
`this.baseStats`, dat bij de constructor wordt vastgelegd, en `evolveInto()`
verving alleen `name` en `type`. Een Rattler die uit een Rat groeide bleef dus op
de basiswaarden van een Rat staan:

| Rattler, level 50 | HP | Aanval |
|---|---|---|
| Uit een Rat gegroeid (voor) | 309 | 72 |
| Zelfde soort, gevangen | 430 | 126 |
| Uit een Rat gegroeid (na) | 430 | 126 |

`evolveInto()` neemt nu de basiswaarden, het tweede type en de legendarische
vlag van de nieuwe soort over. Er zit ook een animatie op: het monster wordt een
wit silhouet en flikkert tussen zijn oude en nieuwe vorm op een steeds korter
ritme, dan een flits, een lichtregen en de nieuwe vorm die opveert.

## Zes beesten, en dan niets meer

`catchMonster()` gaf `{ success: false }` zodra het team vol was — nadat het de
soort al in de Monsterdex had gezet. De vangst lukte, het monster verdween.

Er is nu een ranch: alles boven de zes gaat daarheen (dertig plekken), en het
menu heeft een **Ranch**-scherm om te wisselen. Met ruimte in het team haal je er
iemand uit; met een vol team tik je eerst een van je eigen monsters aan en dan
een van de ranch om ze te ruilen. De laatste in het team kan niet worden
gestald, want dan is er geen weg terug uit een verloren gevecht. De verpleegster
geneest de ranch mee, en cadeaus van NPC's en de zwerver op de route lopen langs
dezelfde weg — een vol team is nergens meer een reden om iets mis te lopen.
Oude saves zonder `ranch`-veld laden gewoon met een lege ranch.

## De camerazoom sleepte de pixel art mee omlaag

`getCameraZoom()` gaf `shortest / 416`, geklemd tussen 1 en 3 — op een scherm van
700 px is dat 1,68. Bij een gebroken zoomfactor wordt elke getekende pixel
ongelijk uitgesmeerd: de een beslaat één schermpixel, zijn buurman twee. De
tegels overleven dat omdat hun detail grof is; de mensen, op één rastercel per
beeldpunt, niet. De zoom wordt nu op hele getallen afgerond.

85 tests, 0 gefaald.

---

# Ronde 4 — de poppetjes opnieuw getekend

Stijl B gekozen: pet, riem, en een figuur die een kwart tegel boven de grond
uitsteekt.

## Waarom het raster grover moest

De oude figuur stond op een raster van 32x32 met **één** beeldpunt per
getekende pixel. De tegels eromheen hebben korrel van twee tot vier beeldpunten,
dus het poppetje was fijner getekend dan de wereld waarin het stond — en las
daardoor als een klein plaatje van een mens in plaats van als pixel art.

Nu: **16 breed x 20 hoog, twee beeldpunten per getekende pixel**. Even breed als
een tegel, en een kwart tegel hoger dan de grond waarop het staat. De textuur
groeide van 32x32 naar 32x40 per frame.

| | voor | na |
|---|---|---|
| Raster | 32 x 32 | 16 x 20 |
| Beeldpunten per pixel | 1 | 2 |
| Textuur per frame | 32 x 32 | 32 x 40 |
| Kleuren in het figuur | 22 | 14 |

## De voeten blijven staan waar ze stonden

Het figuur is hoger dan een tegel, maar niets in het spel mocht daarvan weten.
`PERSON_ORIGIN_Y = 0.6` zet het ankerpunt zo dat de voeten precies landen waar de
onderkant van een tegelgroot poppetje lag. Botsingen, dieptesortering, spawnpunten
en de wandelroutes van de dorpelingen zijn allemaal onveranderd; alleen het
uitroepteken van een trainer moest tien pixels omhoog om boven de pet uit te komen.

## Eén set tekeningen, met en zonder pet

De pet zit in eigen paletsleuven (`p P Q`) in plaats van in de kleuren van het
shirt. Een outfit met een `hat` krijgt daar de pet in; een outfit zonder krijgt er
zijn eigen haarkleur in, waardoor dezelfde rijen als een volle haardos lezen. Zo
tekenen negen rasters de hele cast: de speler, de rivaal en de trainers met pet,
de 27 dorpelingen zonder. De riem heeft op dezelfde manier een eigen sleuf
(`r R`), zodat hij niet meeverft met de broek.

## Twaalf frames

Vier richtingen x drie frames (staan, passen, sluiten), waarvan `right` een
spiegeling van `left` is. De zijaanzichten zijn echt profiel getekend — smaller
hoofd, klep naar voren, haar aan de achterkant, één oog — in plaats van het
vooraanzicht met de ogen verschoven. Het extra beenwerk paste doordat er een
romprij is samengevoegd; drie rijen been maken een pas leesbaar waar twee dat
niet deden.

89 tests, 0 gefaald.
