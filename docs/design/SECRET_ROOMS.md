# Super Brady-O World: secret rooms that are worth finding

Brady, 17 Nov 2026: *"for all the secret rooms throughout the levels... i dont want them all to be the exact same room with a prize box and a few coins and a postcard from chinka. make all of the secret rooms different. some have enemies and obstacles and some have prizes and some of them have pupo etc etc. right now theyre very boring make me want to find these hidden places to be able to enjoy them"*

This file is the plan and the record for that work (branch `sbw/secret-rooms`):
1. **Inventory**: every secret area in the 88 levels, and what it was before this work (§1).
2. **The catalogue of room kinds** (§2), with what each one asks of the player and what it pays.
3. **The room kit** (§3): how a level picks a kind, how the checker proves it, the test.
4. **Every room's kind**, land by land (§4).

Ground rules for every kind (from `SECRETS_WARPS_SWITCHES.md` §2, still binding):
- Short (10-40 s), fair on a phone, readable at phone size.
- **Always escapable:** the door Brady came in by always works, except in a fight room, where it is barred only while the fight is on and opens by itself after 45 s at the latest. A timed room never kills: time running out ends the round, and it restarts.
- **Dying in a room follows the normal rules** (a life, back to the last checkpoint). Rooms re-arm when Brady comes back in.
- The room shows its name and its rule on entry (a banner and a line of text).
- The entrance stays where it was, with its fair visual hint.
- The room keeps what the level relies on: its postcard spot, its secret gate (the level's hidden exit), its Bottle Mail, its signs. The room's old prize boxes stay in the room (the power-up budget counts them), but now they are the *reward*: behind the cage the room's game opens, at the top of the climb, at the end of the run.
- Original content only: fairground games, kitchens, closets, shafts and grottoes are generic ideas, played with Brady's own moves and each land's own food, animals and objects. No room, enemy, name or layout from another game.

## 1. Inventory (before this work)

90 secret areas: 87 one-screen "shelf rooms" built from a stamp, plus 3 that were already set pieces (two swims and a sky area). Of the 87 shelf rooms, 86 were the same room: a door, 2-8 coins, one or two one-way shelves, a prize box and the postcard spot (`SECRETS_WARPS_SWITCHES.md` §1.2). The one exception was Morocco 5-1's lantern shop (stand under the unlit lantern and the back wall slides away), a real puzzle that this work keeps.

| Level | Name | Area | How it is entered | What it is | What is in it |
|---|---|---|---|---|---|
| 1-1 | Mercado Mayhem | `bodega` | hatch (mxTrapdoor) in mercado | shelf room, 40x14 | 8 coins, box: power, postcard, secret gate |
| 1-2 | Xochimilco Forks | `embarcadero` | hidden door in canal | shelf room, 34x14 | 8 coins, box: oneup, postcard |
| 1-3 | Cenote of Light | `grieta` | hidden door in cenote | swim area, 60x16 | 13 coins, secret gate |
| 1-4 | Volcán Escape | `boveda` | hidden door in crater | shelf room, 28x14 | 5 coins, box: oneup, postcard |
| 1-5 | Fiesta de la Hacienda | `despensa` | hidden door in patio | shelf room, 30x14 | 4 coins, box: oneup, postcard |
| 1-6 | Pit of Swallows | `nido` | hidden door in sotano | shelf room, 28x14 | 5 coins, box: lsd, postcard |
| 2-1 | Hemisphere Hop | `chocolateria` | hidden door in mitad | shelf room, 28x14 | 5 coins, box: oneup, postcard |
| 2-2 | Canopy of Baños | `cascada` | hidden door in canopy | shelf room, 28x14 | 7 coins, secret gate |
| 2-3 | Booby Dash | `tubo` | hidden door in islas | swim area, 60x14 | 13 coins, box: oneup, postcard, secret gate |
| 2-4 | Cacao Works | `envoltura` | hidden door in fabrica | shelf room, 28x14 | 4 coins, postcard, secret gate |
| 2-5 | Cotopaxi Crater | `refugio` | door (tourDoor) in teleferico | shelf room, 28x14 | 4 coins, box: oneup, postcard |
| 2-6 | Galápagos Snorkel | `grotto` | door in mar | shelf room, 28x14 | 5 coins, box: power, oneup, postcard |
| 2-7 | Devil's Cauldron | `pista` | hidden door in pailon | shelf room, 40x14 | 5 coins, box: oneup, postcard, secret gate |
| 3-1 | Samba Sunrise | `barracao` | hidden door in avenida | shelf room, 30x14 | 8 coins, box: oneup, postcard |
| 3-2 | Coati Caper | `toca` | hidden door in pantanal | shelf room, 30x14 | 3 coins, box: oneup, postcard, secret gate |
| 3-3 | Iguaçu Falls | `garganta` | hidden door in cataratas | shelf room, 28x14 | 4 coins, box: oneup (hidden), postcard, secret gate |
| 3-4 | Lençóis Lagoons | `jangada` | hatch (brRaftHatch) in dunas | shelf room, 28x14 | 4 coins, box: oneup, postcard, Bottle Mail |
| 3-5 | Estádio do Tucanão | `vestiario` | hidden door in tunel | shelf room, 28x14 | 4 coins, box: star, postcard |
| 3-6 | Rio Hang-Glide | `quiosque` | hatch (brKioskHatch) in ceu | shelf room, 28x14 | 4 coins, box: magnet, postcard |
| 4-1 | Ostrich Dash | `cupim` | hidden door in gorongosa | shelf room, 30x14 | 4 coins, box: oneup, postcard, secret gate |
| 4-2 | Dune Stampede | `porao` | hatch (mzMastHatch) in dunas | shelf room, 30x14 | 4 coins, box: sundial, postcard, secret gate |
| 4-3 | Baobab Skyline | `oco` | hatch (mzCrownHole) in copas | shelf room, 28x14 | 3 coins, box: lsd, postcard |
| 4-4 | Hatchling Night | `gruta` | door (tourDoor) in farol | shelf room, 28x14 | 4 coins, postcard, Bottle Mail |
| 4-5 | Ilha Fortress | `cisterna` | hatch (mzStoneHatch) in muralha | shelf room, 28x14 | 4 coins, box: oneup, postcard |
| 4-6 | Buried Dhow | `cabine` | door (tourDoor) in areia | shelf room, 28x14 | 4 coins, box: magnet, postcard |
| 5-1 | Souk Labyrinth | `shop` | door (maShopDoor) in souk | shelf room, 28x14 | postcard, secret gate |
| 5-2 | Sahara Caravan | `camp` | door (maTentDoor) in sahara | shelf room, 34x14 | 7 coins, box: power, postcard, secret gate, sign |
| 5-3 | Chefchaouen Blue | `riad` | hidden door in medina | shelf room, 30x14 | 4 coins, box: oneup, postcard, secret gate |
| 5-4 | Kasbah of the Brass Owl | `loft` | hidden door in kasbah | shelf room, 28x14 | 5 coins, box: oneup (hidden), postcard |
| 5-5 | Riad of Fountains | `court` | hidden door in zellige | shelf room, 28x14 | 8 coins, box: oneup (hidden), postcard |
| 5-6 | Carpet Skies | `tent` | door (maTentDoor) in cielo | shelf room, 28x14 | 5 coins, box: oneup, postcard |
| 6-1 | La Tomatina | `molino` | door (esMillDoor) in bunol | shelf room, 30x14 | 5 coins, box: power, postcard, secret gate |
| 6-2 | Pintxos Bar | `queso` | door (esMouseHole) in barra | shelf room, 30x14 | 4 coins, postcard, secret gate |
| 6-3 | City of Arts by Night | `umbracle` | hidden door in ciutat | shelf room, 30x14 | 6 coins, box: oneup (hidden), postcard, secret gate |
| 6-4 | Teide Updrafts | `cueva` | door (esLavaTube) in teide | shelf room, 30x14 | 5 coins, box: oneup, postcard |
| 6-5 | La Lonja | `taller` | door (esWorkshopDoor) in fallas | shelf room, 30x14 | 7 coins, box: oneup, postcard |
| 6-6 | Oceanogràfic | `alcove` | door (esPorthole) in aquari | shelf room, 30x14 | 4 coins, postcard, Bottle Mail |
| 6-7 | Molinos de La Mancha | `harinero` | door (esMillHouse) in mancha | shelf room, 30x14 | 7 coins, box: oneup, postcard |
| 7-1 | Paris Morning Rounds | `quai` | hidden door in place | shelf room, 40x14 | 5 coins, postcard, secret gate |
| 7-2 | Lavender Magpie | `mas` | hidden door in lavande | shelf room, 30x14 | 3 coins, box: oneup, postcard |
| 7-3 | Mont-Saint-Michel Tides | `bateau` | door (frBoatDoor) in baie | shelf room, 30x14 | 4 coins, box: power, postcard |
| 7-3 | Mont-Saint-Michel Tides | `banc` | door (frCloudDoor) in baie | shelf room, 30x14 | 5 coins, secret gate |
| 7-4 | Truffle Hunt | `grotte` | hidden door in perigord | shelf room, 32x14 | 3 coins, box: pick, postcard, secret gate |
| 7-5 | Château des Glaces | `boudoir` | hidden door in galerie | shelf room, 30x14 | 2 coins, box: oneup (hidden), postcard |
| 7-6 | Seine Chase | `seineQuai` | door (frQuaiStairs) in seine | shelf room, 30x14 | 5 coins, box: oneup, postcard |
| 7-7 | Montgolfière Skies | `nacelle` | door (frBasketDoor) in ciel | shelf room, 30x14 | 3 coins, box: star, postcard |
| 7-7 | Montgolfière Skies | `alize` | door (frCloudDoor) in ciel | islands area, 70x24 | 21 coins, secret gate |
| 8-1 | Polder Pumps | `gemaal` | door (nlPumpDoor) in polder | shelf room, 30x14 | 4 coins, box: oneup, postcard, secret gate |
| 8-2 | Flower Auction | `koelcel` | door (nlColdMist) in veiling | shelf room, 30x14 | 4 coins, postcard, secret gate |
| 8-3 | Bike Lane Rush | `brug` | door (nlStairsUp) in fietspad | shelf room, 30x14 | 5 coins, box: star, postcard |
| 8-4 | Frozen Canals | `hut` | door (nlHutDoor) in ijs | shelf room, 40x14 | 4 coins, box: oneup, postcard, secret gate, sign |
| 8-5 | The Weigh House | `kelder` | hatch (nlCellarHatch) in kaasmarkt | shelf room, 30x14 | 2 coins, box: power, postcard |
| 8-6 | Windmill Row | `molen` | door (nlMillDoor) in molens | shelf room, 30x14 | 3 coins, box: oneup, postcard |
| 9-1 | Kuta Surf | `gua` | door (idSeaCave) in ombak | shelf room, 30x14 | 6 coins, box: star, postcard, Bottle Mail |
| 9-2 | Kite Festival | `lumbung` | door (idBarnDoor) in sawah | shelf room, 30x14 | 2 coins, box: oneup, postcard, secret gate, sign |
| 9-3 | Batur Eruption | `tambang` | door (idMineDoor) in gunung | shelf room, 32x14 | 4 coins, box: oneup, postcard, secret gate, sign |
| 9-4 | Manta Night Dive | `kapal` | door (idHatch) in laut | shelf room, 30x14 | 3 coins, box: oneup, postcard, secret gate, sign |
| 9-5 | Monkey Forest | `akar` | hidden door in hutan | shelf room, 30x14 | 3 coins, box: oneup, postcard |
| 9-6 | Orangutan Canopy | `nest` | door (idNest) in rimba | shelf room, 30x14 | 4 coins, box: oneup, postcard |
| 9-7 | Blue Fire Rails | `depot` | door (idDepotDoor) in ijen | shelf room, 30x14 | 3 coins, box: oneup, postcard, sign |
| 10-1 | Train Street | `caphe` | hidden door in pho | shelf room, 30x14 | 3 coins, box: oneup, postcard |
| 10-2 | Ha Long Junk | `hang` | door (vnCaveMouth) in vinh | shelf room, 32x14 | 4 coins, box: star, postcard, secret gate, sign |
| 10-3 | Hoi An Lanterns | `xuong` | door (vnWorkshopDoor) in phoco | shelf room, 30x14 | 3 coins, box: oneup, postcard, secret gate, sign |
| 10-4 | Son Doong Flood | `rung` | door (vnGardenDoor) in hang | shelf room, 30x14 | 3 coins, box: oneup, postcard |
| 10-5 | Hue Citadel | `kho` | door (vnStoreDoor) in hoangthanh | shelf room, 30x14 | 4 coins, box: oneup, postcard |
| 10-6 | Mekong Floating Market | `thuyen` | door (vnEmptyBoat) in cho | shelf room, 30x14 | 7 coins, box: oneup, postcard |
| 11-1 | Sushi Carousel | `reizoko` | door (jpFridgeDoor) in kaiten | shelf room, 28x14 | 5 coins, box: oneup, postcard |
| 11-2 | Bullet Train | `sokusen` | door (jpSidingDoor) in shinkansen | shelf room, 32x14 | 3 coins, box: star, postcard, secret gate |
| 11-3 | Night of Things | `chashitsu` | door (jpTeahouseDoor) in chikurin | shelf room, 30x14 | 3 coins, box: lsd, postcard, secret gate |
| 11-4 | Neon Tower | `gachaRoom` | door (jpArcadeDoor) in biru | shelf room, 30x14 | 3 coins, box: star, postcard, secret gate |
| 11-5 | Kappa Garden | `kura` | hidden door in shiro | shelf room, 28x14 | 3 coins, box: oneup (hidden), postcard |
| 11-6 | Capsule Toy Machine | `capsuleRoom` | door (jpCapsuleDoor) in gacha | shelf room, 28x14 | 3 coins, box: oneup, postcard |
| 11-7 | Fuji Thermals | `hutRoom` | door (jpHutDoor) in fuji | shelf room, 28x14 | 3 coins, box: star, postcard |
| 12-1 | Suspension Bridges | `chiya` | door (npTeaHouseDoor) in pul | shelf room, 30x14 | 3 coins, box: power, postcard, secret gate |
| 12-2 | Yak Caravan Pass | `khadal` | door (npIceCaveDoor) in bhanjyang | shelf room, 30x14 | 3 coins, box: oneup, postcard, secret gate |
| 12-3 | Blizzard Night | `depotShed` | door (npShedDoor) in himpat | shelf room, 30x14 | 3 coins, box: oneup, postcard, secret gate |
| 12-4 | Khumbu Icefall | `tent` | door (npTentDoor) in icefall | shelf room, 28x14 | 3 coins, box: star, postcard |
| 12-5 | Baron's Fortress | `archive` | door (npArchiveDoor) in vault | shelf room, 30x14 | 4 coins, box: oneup (hidden) |
| 12-6 | Crevasse Drop | `blueCave` | door (npBlueCave) in khadal | shelf room, 28x14 | 3 coins, box: oneup, postcard |
| 12-7 | Baron's Supply Depot | `hatch` | hatch in depot | shelf room, 28x14 | 4 coins, box: oneup, postcard |
| 13-1 | Ice Shelf Bowling | `igloo` | door (aqIglooDoor) in shelf | shelf room, 30x14 | 4 coins, box: oneup, postcard, secret gate, sign |
| 13-2 | Upside-Down Pole | `berg` | hidden door in aurora | shelf room, 30x14 | 6 coins, box: star, postcard |
| 13-3 | Aurora Station | `lab` | door (aqLabDoor) in module | shelf room, 30x14 | 4 coins, box: oneup, postcard, secret gate, sign |
| 13-4 | The Floe of Big Tusk | `cave` | hidden door in crevasse | shelf room, 30x14 | 5 coins, box: oneup, postcard |
| 13-5 | Egg Express | `rookery` | hidden door in blizzard | shelf room, 30x14 | 4 coins, box: oneup, postcard |
| 22-1 | The Station of Clocks | `clock` | door (w22ClockDoor) in station | shelf room, 30x14 | 6 coins, box: oneup, postcard |
| 22-2 | The Endless Corridor | `beyond` | door (w22Door22) in corridor | shelf room, 30x14 | 6 coins, secret gate, sign |
| 22-3 | Mirror Lake | `under` | door (w22DoorPlain) in lake | shelf room, 30x14 | 4 coins, box: oneup, postcard |
| 22-4 | The 22nd Door | `behind` | hidden door in hall | shelf room, 30x14 | 4 coins, box: oneup, postcard |
| 22-5 | The Writer's Desk | `drawer` | door (w22DrawerDoor) in desk | shelf room, 30x14 | 4 coins, box: oneup, postcard |

## 2. The catalogue: 18 kinds of room (plus Pupo dens)

Every kind is a different *activity*, not a different coat of paint. Inside a kind, every room is still its own: the layout variant, the land's dressing (its decor, its critters, its token objects), the title and the joke, and the reward all change. Code names (`room: '<kind>'`) are neutral; the player sees each room's own title.

| # | Kind (`room:`) | Player sees | What you do | Reward | Builds on |
|---|---|---|---|---|---|
| 1 | `ambush` | **Monster Closet** | The door bars slam shut and the land's critters drop in from the ceiling in two waves. Stomp them all. | The prize cage opens (with a little fanfare); the door unbars. | Real enemies of the level, spawned at run time |
| 2 | `rush` | **Rush** | A clock starts as you land: grab all the scattered tokens (chilies, croissants, eggs...) before it runs out. Miss and the round restarts. | Cage opens + a coin shower | Keys with a look (`TourMaze.KEYS`), a room clock |
| 3 | `gauntlet` | **Gauntlet** | A long run of 3-4 obstacle beats chosen per room: spike pits with crumbling bridges, a ceiling-spike crawl, a moving platform over spikes, conveyor belts, spring hops. | The prize at the far end, and a door straight back out | Tiles, moving platforms, crumbles, springs |
| 4 | `lamps` | **Light the Lamps** | A dark room with 3-4 lamps. A picture on the wall shows the order (colour *and* shape). Touch them in that order; a wrong one blows them all out. | The room lights up, the cage opens | Room lamps (order puzzle), `dark` |
| 5 | `climb` | **Chimney Climb** | A tall shaft: ledges, one-way perches, a spring, coins up the walls. | The prize at the very top | Tall room, camera follow |
| 6 | `grotto` | **Flooded Grotto** | A water room: swim between rock fingers and spikes, past the land's swimmers. | The prize in the deepest pocket | `water` |
| 7 | `lantern` | **Lantern Walk** | Brady's own light fades in the dark; relight it at lantern posts. Stepping stones over a spike floor show only inside the light. | The prize at the far side | `lamp` area system, light-only tiles |
| 8 | `doors` | **Door Maze** | One screen of little closets and lofts joined by doors. Which door leads where? One is a broom-cupboard joke. | The prize loft | Doors inside one area |
| 9 | `pick` | **Pick One** | Three boxes on plinths, each with a picture of what is inside. Take one; the other two go *poof*. | The one you chose | Item boxes |
| 10 | `shell` | **Shell Game** | Three cups (sombreros, tin mugs, coffee cups...). Watch the prize go under one, watch the shuffle, then stomp a cup. Wrong cups hold a joke (an old sock, a rubber chicken). | Cage opens on the right cup | Room cups |
| 11 | `wormhole` | **Wormhole** | A short, floaty room with a swirling Wormhole in it. Hop in and it shoots Brady far ahead along the level. | A shortcut (plus the room's prize) | A door into the main area further on |
| 12 | `bigone` | **The Big One** | A mini-boss cameo: a giant one of the land's critters. Three stomps; it gets faster and hops after each. | Cage opens | A scaled-up real enemy |
| 13 | `bouncy` | **Bouncy Castle** | An inflatable room: the floor bounces, only the turrets are firm. Coin arcs near the soft ceiling. | The prize on the highest turret | Bounce surfaces, springs |
| 14 | `floaty` | **Low Gravity** | Someone left the gravity off: big floaty jumps through a constellation of coins. | The prize up in the rafters | Area `gravity` |
| 15 | `prank` | **Prank Room** | A gleaming chest that is TOTALLY REAL TREASURE. It is a prank (a boxing glove on a spring, a rubber chicken, a whoopee cushion, a jack-in-the-box, a confetti cannon...). | Then "OK, OK" and the real prize cage opens | Room chest |
| 16 | `closing` | **Closing Time** | A shop after hours. The clock is ticking and the shutters roll down shelf by shelf, top first. At zero the keeper sweeps Brady out (no hit). | Whatever you grabbed | Room clock, shutters |
| 17 | `whack` | **Whack-a-Critter** | Critters pop out of holes in the floor. Stomp enough of them before the time runs out. | Cage opens | Room holes |
| 18 | `fetch` | **Recipe Kitchen** | The cook needs three ingredients, scattered round the room on high shelves and odd corners. Bring them all to the pot. | The dish: the cage opens | Keys with a look, a pot |
| - | `pupo` | **Pupo Den** | (Waiting for Pupo to land on `main`.) A Nap Box, then hooks, bars or a tickle gate only Pupo can use, to a bigger prize. | | Pupo |
| - | (kept) | Morocco 5-1's lantern-shop puzzle, and the three secret areas that were already set pieces (1-3's grieta swim, 2-3's tubo swim, 7-7's alize sky) | | | |

**Rewards vary by kind and by room**: the room's own prize (a 1-UP, a power-up, a star, a magnet, a sundial, an LSD tab), a coin shower, a choice of power-up (Pick One), a shortcut (Wormhole), and in some rooms the level's secret exit sits in the room as before.

