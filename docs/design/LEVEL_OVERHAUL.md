# Super Brady-O World: the level overhaul (design spec, November 2026)

Owner's brief, restated: no more repeats; every level a new idea; enemies with their own powers; more power-ups everywhere; secret rooms, hidden exits, secret levels and secret routes; more things to touch and use; a branching, living map. All content original (no Nintendo characters, blocks, pipes, power-up looks or layouts). PG-13 satire from food, animals, objects and folklore; people and sacred sites are never staged or mocked (temples, monasteries, minarets, stupas, prayer flags, the Mont-Saint-Michel abbey: background only, no fights or platforming on them); no Christ the Redeemer; the Eiffel-style tower only in daylight or unlit; no existing Japanese characters. World 6 is now **Spain** (whole country), world 7 is **France** (whole country).

This is a design document. Nothing in the repo was changed.

## STATUS (complete, 2026-11-10)

| Section | State |
|---|---|
| 0. Decisions at a glance | complete (revised: 13 Souvenir Stands, 8 shortcuts, `mapCell`/`mapFrom`, originality notes) |
| 1. Archetype catalogue (30 + LAIR) | complete (revised: SWITCH uses physical world objects, never outline blocks; PARADE lanes match the §7 example) |
| 2. The 88-level lineup | complete (revised: Crawl Pads replace the Shrink Cookie in 6-2; Snow Globe replaces the Ice Lolly; the tanuki disguises as scenery, not items; w22Envelope is loose mail) |
| 3. Secret exits and map graph | complete |
| 4. Enemy powers | complete |
| 5. Power-ups | complete |
| 6. Object library and validator v2 | complete |
| 7. Engine work list, spec format, interface contract, two full examples | complete |
| 8. Art impact | complete |
| 9. Rollout | complete |

---

## 0. Decisions at a glance

| Item | Decision |
|---|---|
| Level count | **88** = 68 main (12 countries x 5, Antarctica and World 22 x 4) + **20 secret levels** |
| Level ids | main levels keep `<world>-1 … -5` (`-4` for 13 and 22); secret levels follow the boss: `x-6`, `x-7`. **Antarctica's and World 22's single secret level is `13-5` and `22-5`** (the number right after their boss; the engine indexes levels by array position). |
| Boss ids | **unchanged**: `x-5`, `13-4`, `22-4` (boss = last *main* level). |
| Secret lands | **unchanged**: Antarctica from a hidden exit in **8-4**; World 22 from a hidden exit in **5-2**, still behind the 22-postcard door. |
| Archetypes | 30 original archetypes (§1) + the boss-level frame `LAIR` (14 unique lead-ins and arenas, exempt from the reuse cap). |
| Hard rules (enforced by a test) | no archetype twice in a country; no archetype more than 4 times in the game (max reached: GLIDE 4, SKY 4); max 5 vertical climbs (TOWER x3 + RISE x2, all built differently); every slot-1 archetype is different (14 different openers); every country's sequence is unique. |
| Every level | 3 postcards (P1 main route, P2 secret room or hidden area, P3 risky/late), at least 1 secret room or hidden area, at least 2 power-up opportunities (swim and climb levels included). |
| Hidden exits | 37 in total: 20 to secret levels, 2 to secret lands, 13 to Souvenir Stands (bonus houses), 2 secret flights (cross-country shortcuts), plus 8 secret-level exits that draw a shortcut path back into the main route. |
| Cross-country secrets | **Secret flights** (Devil's Cauldron 2-7 → Morocco, Montgolfière Skies 7-7 → Vietnam) and **Bottle Mail** (5 messages in bottles in coastal levels → the Postcard Lighthouse bonus house, which marks every undiscovered exit on the map). |
| New power-ups | 10 core items (§5) in a new HANDS slot; the existing HUD pack slot becomes the Backpack. Originality pass: no item shrinks Brady, freezes water into walkable ice, gives cape-like flight or a tail/suit; no block is a question block; no switch is a timed global switch. |
| Save | new key `super-brady-o-world-save-v2`; all progress wiped; settings and look are copied over from v1 once. |
| Spec interface | `Tour.country()` v2 with `levels[].areas[]`, `gen`, `arch`, `mapCell` / `mapFrom` (the grid layout of the country panel on `sbw/graphics-pass-fixed`, extended so `mapFrom` may be an array), `exits`, ASCII `stamps`, `houses`, `map` (§7.2). Old fields (`style`, `script`) keep working so countries can migrate one at a time. |

**Tests that must change** (call-outs for the engineer): `tools/gameplay_test.js` line 285 asserts 68 levels (becomes 88 total, 68 main); `TourProgress.bossDone`, `complete()`, `Tour.isFinale` and the WORLDS `kinds` table use `C.levels.length` as the boss index and must use `C.mainCount`. The boss tests (`x-5`, `13-4`, `22-4`) and the secret-door tests (`8-4` → aq, `5-2` → w22) keep working untouched.

---

## 1. Archetype catalogue (30 + LAIR)

Tile = 32 px (`TS`). The view is 12 tiles tall (`VIEW_ROWS`), about 26 tiles wide in landscape. "Gen" is the layout generator (the `gen` key of an area, §7.2). Size is implementation size of the generator plus systems (S < 1 day, M 1-3 days, L 3-6 days).

| # | Code | Name | Spec | Gen | Dims (W x H) | Camera | First 10 seconds | Size |
|---|---|---|---|---|---|---|---|---|
| 1 | PARADE | Layered Street | Three stacked lanes run the whole level: rooftops (floor row 12), street (row 21), cellar or canal (row 27, under the street). Bouncy objects lift you up a lane, trapdoors drop you down; each lane has its own hazard; the lanes cross at two plazas where all three connect. | `layered` (new; `tourStrip` with `lanes:{roof:12, street:21, cellar:27}` and per-step `lane:`) | 214 x 30 | side-scroll; vertical target = floor of Brady's current lane at 68 % of view (no chasing small hops) | You start on the street and the first awning throws you onto the roof lane; two lanes are visible on screen at once. | M |
| 2 | SKY | Sky Islands | No ground row. Islands 3-12 tiles wide hang in open sky; carriers (clouds, balloons, carpets, kites), catapults and updrafts link them; falling past the bottom row kills. | `islands` (new; strip with `st.sky=true`, `bottomKill`) | 190 x 30 | free vertical follow, Brady at 55 % of view height (tower rule) | Your first jump leaves the start island into empty sky and a carrier glides in under you. | M |
| 3 | FALL | Freefall Shaft | The level is a narrow shaft played top to bottom. Fall speed capped at 11 t/s, air steering x1.4; ledges, spike shelves, slow-down updrafts; checkpoints are wide ledges. | `shaft` (new; the climb builder run downward, `st.y` grows) | 22 x 160-170 | tower mode with Brady at **35 %** from the top (look-down) | Step off the lip and fall past three screens of coin rings. | M |
| 4 | HUB | Plaza Hub (and errand variant) | A plaza room with three doors to three short sub-areas, each built by a different gen; each sub-area ends in a stamp (a key) instead of a gate; three stamps open the plaza's exit lock. Errand variant: animal friends in the plaza trade items in a chain (each item is a key). | `room` + area graph | plaza 64 x 22; sub-areas 60-90 x 18-22 | plaza: camera clamps to plaza; sub-areas: normal | You land in a plaza with three visibly different doors and an exit gate showing three empty slots. | M |
| 5 | CARRY | Carry Run | Brady carries a fragile thing (hatchling, egg, lantern) from a start pedestal to the gate pedestal. While carrying: no attacks, jump x0.92 (about 3.4 tiles), Action sets it down (it can weigh down plates). Hurt, a fall of more than 6 tiles, or water: the item pops back to the last pedestal after 1.5 s. Pedestals double as checkpoints for the item. | `strip` + carry system | 180-190 x 20 | normal | Pick up the item, a sign explains; the first enemy is placed to be avoided, not stomped. | M |
| 6 | DOOM | Doom Chase | A huge pursuer (stampede cloud, lava flow, tidal wave) advances from the left at `chase.speed` (ramps +0.2 t/s per checkpoint). Not autoscroll: Brady can outrun it. Its front pushes Brady 3 tiles forward and costs 1 hit (not instant death). Periodic variant: the pursuer passes every `period` seconds and safe alcoves protect you (reuses `Play.updateChasers`). | `strip` + `chase` area prop (new `TourDoom` entity) | 210-250 x 18-22 | normal, 0.1-view look-ahead to the right | Rumble, screen shake, the wall bursts into view behind you. | M |
| 7 | THIEF | Thief Chase | A thief snatches Chinka's passport stamps at the start and flees along a route. Catch it three times (stomp or any hit); each catch drops one stamp and it flees to the next stretch. Three stamps open the gate lock. It waits and taunts if Brady is more than 12 tiles behind, so it can never be lost. | `strip` + `TourThief` (waypoints from `st.B.route`) | 210-220 x 20 | normal | A snatch gag, then the chase starts. | M |
| 8 | SWITCH | Switch World | Up to two toggle groups. A world object (water valve, wind brake, sluice wheel) changes *physical things* in the level: water levels, sluice gates, shutters, windmill sails. Each state is drawn as real country objects (a raised gate, a lowered gate), **never** as coloured or dotted-outline blocks, and there is no timed global switch. | `strip` + `toggles` | 190-220 x 20 | normal | The first switch is on the first screen, beside a gap that only closes when you flip it. | M |
| 9 | FLIP | Gravity Flip | Flip bands (zone kind `flip`): inside them gravity is inverted and Brady walks on the ceiling. Painted lines mark the bands; you can cross a line in mid-air. | `strip` with a full ceiling (`ceil`) | 200 x 22 | vertical target 50 % (centred) inside a flip band | Brady walks over a glowing line and drops *up* onto the ceiling. | L (physics) |
| 10 | HOLD | Hold-Out Plazas | Three hold-out arenas (26 x 14, one screen each) joined by short runs. Each closes like a boss arena and plays three waves of about 20 s (spawners plus an arena change per wave: platforms appear, a floor section drops), then opens. | `strip` + `HoldArena` controller | 160 x 18 | locked to the arena while a wave runs (bossLock) | Walls slam shut and a banner reads WAVE 1. | M |
| 11 | RAIL | Branching Rail | A vehicle on a track with forks. Lever posts choose upper or lower track; branches run 30-60 tiles and rejoin; one branch hides a secret. | `rail` (new; `tourRide` with `upper` and `deck` rows and fork pieces) | 200 x 18 | autoscroll at vehicle speed, vertical follow between deck rows 6 and 11 | The first fork sign and lever post are on the first screen. | M |
| 12 | LAMP | Lantern Light | Dark level; Brady carries a light whose radius decays from 170 px to 70 px over 25 s; braziers, lantern stalls or plankton clouds restore it. Some platforms (`hide=3`) only show inside light; light-sensitive enemies. Works on land and in water. | `strip` or `swim` + `lamp:{r0,r1,decay}` | 190-230 x 18 | normal | A friend hands over the lantern and the dark closes in. | S/M |
| 13 | TIDE | Tide Chamber | The area's water line rises and falls on a cycle (`tide:{low,high,period,hold}` in rows). High: swim over walls; low: walk the bed, cross pools, reach exposed items. | `strip` + `tide` | 160-210 x 22 | normal (water-level camera when swimming) | Water visibly climbs around Brady's feet and floats him to a ledge. | L (engine water line) |
| 14 | GLIDE | Updraft Glide | A glider at the start (paper plane, hang glider, kite tail, paper crane); long descents, updraft columns (zones) to regain height, coin rings, landing pads with glider stands (the glider is lost on a hit, re-issued at every pad). | `islands` + zones | 220 x 34 | 0.25-view look-ahead in facing direction, free vertical | Launch off a cliff pad straight into an updraft. | M |
| 15 | FACTORY | Conveyor Works | Conveyor tiles (`CONV_L/R`), timed presses (moving solid blocks), vats, gears, reverse levers (toggle), an upper catwalk. | `strip` + factory pieces | 200-210 x 20 | normal | You land on a belt that carries you toward the first press. | M |
| 16 | SNEAK | Stealth | Guards with vision cones and searchlights; detection (0.4 s in a cone) sounds an alarm: shutters ahead close for 6 s (lock) and two extra enemies spawn. Not death. Hide spots: crouch in bushes, behind boulders, or in the Cardboard Box. | `strip` + `Watcher` entities | 230 x 20 | normal | A searchlight sweeps over a bush right next to the start. | M |
| 17 | RACE | Rival Race | An animal rival runs a fixed route to the gate (fast upper route vs safe lower route). Win: 1-up, a coin shower and a stamp on the map node. It waits at checkpoints if Brady is far behind. P3 sits on the fast route, so it is reachable without winning. | `strip` + `TourRival` | 190-210 x 20 | normal | Starting line, 3-2-1 countdown, the rival sprints. | M |
| 18 | RISE | Rising Climb | Vertical autoscroll: the camera climbs at `rise.speed` (0.9-1.4 t/s) and the bottom edge kills, or a liquid rises and Brady swims (flood variant). | `rise` (new; climb builder + `autoscrollY` or `risingWater`) | 28-30 x 110-120 | vertical autoscroll | The floor crumbles away or the water starts climbing in the first screen. | M |
| 19 | DIG | Dig Down | Soil tiles (new `T.SOIL`): stomp (down + jump on soil) digs a 2 x 1 hole below; the Hard Hat dash digs sideways. Rocks don't dig; pockets hold treasure; cave-ins (crumble). | `dig` (new; strip with 30 soil rows and authored caverns) | 120-140 x 40 | free vertical follow | A friend points down; one stomp and Brady sinks into the earth. | M |
| 20 | ROLL | Growing Ball | A ball prop grows as it rolls on snow or sand (radius 1 to 3 tiles). Push it by walking into it, or ride it (stand on top, walk the other way). Once big enough it smashes walls and fences; it is also a moving platform. | `strip` with slopes + `TourBall` prop | 200-220 x 20-22 | normal | A small snowball at your feet grows as you push it downhill. | M |
| 21 | FORT | Mid-World Fort | A short fortress: lead-in, one stamp room, a mini-boss arena (Boss framework with `mid:true`, 3 hp, 2 phases). | area graph: strip 80 + room + arena 24 x 16 | 80 + 40 + 24 | normal; arena lock | A drawbridge drops and the banner reads FORT. | M (+ one brain each) |
| 22 | MAZE | One-Way Maze | Six to nine one-screen rooms (26 x 14) in a grid, linked by doors and one-way drops; colour or symbol clues point the right way; dead ends hold coins, postcards and the secret exit. | `maze` (new; one area of room cells, doors are same-area portals) | 78 x 42 (3 x 3 cells) | camera clamps to the current cell (room-by-room) | The first room shows three doors with three different symbols. | M |
| 23 | PHASE | Day / Night Flip | A switch (sun-moon lantern, wind chime, clock) toggles the whole area between two themes with different block sets and enemy states (day enemies sleep at night and vice versa). | `strip` + toggle group `phase` + two themes | 200-220 x 20-22 | normal | Hit the lantern: the screen fades to night and new platforms glow in. | M |
| 24 | RIDE | Vehicle Ride (upgraded) | The existing ride: now with hops onto scenery, a sub-area dock room, and optional vehicle swaps. | `ride` (existing) | 220-232 x 16-17 | autoscroll | You're already moving on the vehicle. | S |
| 25 | DIVE | Open Dive (upgraded) | The existing swim: currents, light shafts, plus dry air-pocket rooms, item blocks in rock niches and Flipper Fins. | `swim` (existing) | 190-210 x 18-20 | water camera | A sunbeam and a Fins stand at the entrance. | S |
| 26 | TOWER | Tower Climb (3 builds) | The old climb, rebuilt as three distinct variants with no shared pieces: **(a) interior** zigzag with rising liquid (W 26); **(b) facade** with three waterfall columns pushing down and horizontal traversal (W 34); **(c) exterior** skyscraper with gondola lifts and wrap balconies (W 30). | `climb` + `variant` | 26-34 x 110-112 | tower | (a) a vent blasts you up a chimney; (b) a waterfall shoves you sideways; (c) a gondola lifts you past neon. | S each |
| 27 | SCROLL | Side-Scroll Chase (upgraded) | The existing horizontal autoscroll, with forced lane changes and a mid-level vehicle. | `strip` mode auto (existing) | 210-230 x 18 | autoscroll | The screen starts moving immediately. | S |
| 28 | MINI | Tiny Brady | Brady is "shrunk" by the Baron (cosmetic: the world is drawn giant; physics unchanged). Giant food and objects are the terrain (toothpick bridges, bread slices, keyboard keys). | `strip` + stamp-heavy giant props | 180-200 x 22 | normal | The camera opens on a fork ten times Brady's height. | S (art heavy) |
| 29 | SWING | Swing Gauntlet | No continuous floor: vines, rings, hooks and rotating sails carry you; chains of swings demand timing. | `islands` + swing objects (`mplat` swing/orbit) | 200-210 x 24-26 | free vertical | Grab the first vine straight off the start ledge. | M |
| 30 | BEAT | Rhythm Road | Everything runs on the song (`bpm`): beat blocks, on-beat cannons, platforms that move per bar, off-beat floor lights; a small HUD metronome. | `strip` + `bpm` (existing beat blocks) | 215-220 x 18 | normal | Drums pop up under your feet in time with the music. | S |
| — | LAIR | Boss level | A short lead-in (60-90 tiles) that teaches the object the boss fight uses, then an arena shaped for that boss (§2, slot 5 of each country). Exempt from the 4-use cap because every lead-in and arena is unique. | area graph: lead-in area + arena area | lead-in 60-90; arena 24-34 | arena lock | Per country. | per boss |

**Climb count:** TOWER 3 (1-4 interior, 3-3 facade, 11-4 exterior) + RISE 2 (10-4 flood, 12-4 camera autoscroll) = **5**, every one built differently. FALL goes down and is not a climb.

**Usage tally (non-boss levels, 74 slots):** PARADE 1, RAIL 2, DIVE 3, TOWER 3, FALL 2, FLIP 3, SWING 3, RACE 3, FACTORY 3, TIDE 3, BEAT 2, THIEF 2, GLIDE 4, DOOM 3, SKY 4, CARRY 2, DIG 2, MAZE 2, SCROLL 2, PHASE 3, FORT 3, HOLD 1, MINI 3, SWITCH 2, HUB 2, LAMP 3, RIDE 3, RISE 2, ROLL 2, SNEAK 1 = **74**.

**Slot-1 openers (all different):** mx PARADE, ec FLIP, br BEAT, mz RACE, ma MAZE, es HOLD, fr HUB, nl SWITCH, id RIDE, vn DOOM, jp FACTORY, np SKY, aq ROLL, w22 PHASE.

---

## 2. The 88-level lineup

Key for the columns:
- **Areas**: `name gen WxH`; `(s)` = secret room or hidden area; arrows show how areas connect.
- **Beats**: ① introduce → ② twist → ③ combine. The level keeps showing something new to the end.
- **Objects / enemies**: *kept* = existing set pieces reused (rebuilt to the new spec where needed); **bold** enemy = that country's headline enemy power (§4).
- **Power-ups**: M = core block (mushroom, or joint if already big), L = LSD tab, S = star, 1UP = water bottle, Sig = signature item, gear names from §5. Every level has at least 2.
- **Secrets & postcards**: P1 main route, P2 secret room or hidden area, P3 risky or late.
- **Exits**: `main` / `secret`; see §3 for the graph.

### World 1: Mexico (gentle)

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **1-1 Mercado Mayhem** · PARADE | `mercado layered 214x30` → `bodega room 40x14 (s, dark)` → `tienda gate (s)` | ① awnings bounce you between street and rooftop lanes; ② the melon cart rolls melons down the street lane while the roof lane breaks into gaps strung with papel-picado ropes; ③ the plaza: fountain jets, awnings and hanging piñata blocks (bump from below for candy) link all three lanes. | Kept: xolo, stalls, pinatas, melons, fountain, rooftops, bonus (→ bodega). New: trapdoor, piñata item block, papel-picado rope (Banner gimmick). Enemies: mxPepper, mxElote (popper), mxChihuahua (yapper). | M (street, col 20), Sig taco from Xolo, Paper Plane (roof lane before the plaza), hidden 1UP at start (kept) | Bodega: stomp the crate that sits on a trapdoor (chili dust puffs from the cracks). P1 roof lane over stall 3; P2 bodega shelf; P3 the top of the plaza fountain jet. Bodega back shelf is a FAKE wall → secret gate. | main → 1-2; secret → Souvenir Stand *La Tiendita* |
| **1-2 Xochimilco Forks** · RAIL | `canal rail 200x18` (upper channel row 7, lower row 12) → `embarcadero room 34x12 (s)` | ① hop mooring posts and flower arches while the trajinera drifts; ② the first lock: a lever post picks the garden channel (sinking chinampa rafts, herons) or the market channel (vendor boat, low bridges to hop); ③ a double fork with leaping axolotls on both channels, and a third channel hidden behind willows. | Kept: arch, posts, axolotls, chinampa, herons, bridge, vendor. New: lock gate (lift raises the boat 5 rows), lever post (rail switch), willow curtain. Enemies: mxHeron, **mxAxolotl (regrower)**, mxChihuahua on bridges. | M (bridge top, garden), Sig tacos (vendor, market), L (over the third arch) | Willow curtain (petals drift from it) hides the third channel → embarcadero. P1 high post on the garden channel; P2 embarcadero; P3 boat-to-arch-top jump. | main → 1-3 |
| **1-3 Cenote of Light** · DIVE | `cenote swim 190x20` → `gruta room 34x12 (air pocket)` → `grieta swim 40x16 (s)` | ① sunbeam lightwells and hanging roots; ② light reveals: light-only blocks shimmer into being inside sunbeams; ③ currents push you through beams that come and go as clouds pass. | Kept: shaft, roots, current, lightwell, slalom. New: light-only tiles (`hide=3`), bubble columns (Bubbler) in the air pocket. Enemies: mxFish, mxBlindFish (charges only if you dash near it), mxAxolotl. | Flipper Fins (stand at entrance), M (gruta), 1UP (root niche) | Bubbles rise from a floor crack behind the roots → grieta → secret gate. P1 lightwell pocket (kept); P2 gruta; P3 slot in the strongest current. | main → 1-4; secret → 1-6 |
| **1-4 Volcán Escape** · TOWER (a) interior | `crater climb 26x112` → `obsidian vault room 24x12 (s)` | ① vents carry you up chimneys (lava waits 8 s); ② the lava rises (0.55 t/s) and obsidian ledges crumble; ③ rolling armadillos, leaping lava blobs and a final double chimney with lava on your heels. | Kept, rebuilt as six distinct bands: vledges, vvent, (new) crumble band, vroll, vblobs, (new) double chimney. Enemies: mxArmadillo, mxLava, mxBat. | M (band 1), S (band 3), 1UP (vault) | A cracked painted tile in the band-2 wall is FAKE → vault. P1 band-4 side ledge; P2 vault; P3 summit ledge over the lava. | main → 1-5 |
| **1-5 Fiesta de la Hacienda** · LAIR | `patio strip 72x18` → `despensa room 30x12 (s)` → `fiesta arena 24x22` | Lead-in: swinging piñatas → candy cannons → the balcony route. Arena for El Gran Piñatón: tall (22 rows), a pulley rail along row 3, three bounce awnings stepping up at rows 18 / 15 / 12, solid side walls for his dizzy spin. | Kept: swingers, cannons, balcony, arena_fiesta (reshaped). Enemies: mxSalsa, mxBurro, mxPepper. | M + Sig block pair before the arena door; candy coins in the fight | P1 balcony (kept); P2 pantry behind a FAKE cupboard; P3 over the cannon line. | main → Ecuador |
| **1-6 Pit of Swallows** · FALL (secret) | `sotano shaft 22x170` → `nido room 20x10 (s)` | ① freefall through swirling swallow flocks and coin rings; ② papel-picado lines across the shaft (fall through the gaps; touching one slows you); ③ flower updrafts brake you before spike shelves; splash into an underground river and the gate. | New: coin rings, rope lines, updraft flowers (zones), spike shelves. Enemies: mxSwallow (flock), mxBat. | Paper Plane (top), M (mid ledge), L (nest) | A swallow flies into a gap in the wall: the nest room. P1 mid-shaft ledge; P2 nest; P3 narrow gap between two spike shelves. | main → done, draws shortcut **1-6 → 1-5** |

### World 2: Ecuador and the Galápagos

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **2-1 Hemisphere Hop** · FLIP | `mitad strip 200x22 (ceiling)` → `chocolatería room 30x12 (s)` | ① cross the yellow equator line: gravity flips and you walk the ceiling over a spike floor, back at the next line; ② banana-leaf platforms work from both sides, and banana walkers stroll the ceiling (stomp them "up"); ③ mid-air flips over gaps while hummingbirds dart. | Kept: equator (re-purposed as the flip line), bananas, cacao, terraces, booby friend. Enemies: ecBanana, ecCacao, ecHummingbird (hover-dart). | Sig Booby Boots (friend at start), M (ceiling side), L (high terrace) | An alcove you can only reach flipped has a FAKE wall → chocolatería. P1 on the line arch; P2 chocolatería; P3 mid-air flip gap. | main → 2-2 |
| **2-2 Canopy of Baños** · SWING | `canopy islands 210x24 (dusk)` → `casa del árbol room 30x12 (s)` → `cascada room 24x14 (s)` | ① vine swings between giant trees; ② glowing mushrooms pulse: glass frogs only show in the glow, lily pads sink on the river below; ③ the "swing at the end of the world": a giant tree swing launches you over a canyon into vines across a waterfall. | Kept: vines, branches, glow, lilies. New: giant tree swing (catapult), waterfall curtain (FAKE water). Enemies: ecFrog, ecGlassFrog (camouflage), ecCondor. | M (branch), Bubble Wand (stand before the river), 1UP (canopy top) | A rope ladder hidden in leaves → treehouse (P2). A rainbow in the mist marks the waterfall curtain → cascada → secret gate. P1 top of a vine arc; P3 apex of the giant swing. | main → 2-3; secret → 2-7 |
| **2-3 Booby Dash** · RACE | `islas strip 190x20 (lava coast)` → `tubo swim 40x14 (s)` | ① race Pata Azul, a blue-footed booby, over lava rock; ② marine iguanas sneeze salt that sets into stepping platforms: the fast upper route; ③ the sea-lion beach: sea lions belly-slide across, tide pools, a final sprint over arches. | Kept: arches (land version), penguins (cross the pools), iguanas. Enemies: **ecIguana (salt sneezer)**, ecSeaLion (belly-slide charge), ecCrab (fast sideways). | Sig Boots, M (arch top), S (upper route) | A bubbling pool in a lava tube → tubo (swim) → secret gate. P1 arch top; P2 tubo; P3 on the booby's upper route. | main → 2-4; secret → 2-6 |
| **2-4 Cacao Works** · FACTORY | `fábrica strip 200x20 (catwalk row 8)` → `envoltura room 30x12 (s)` | ① belts carry cacao pods (and Brady); ② roasting presses stamp in rhythm, and molten chocolate in the vats rises and falls; ③ reverse levers flip the belts over the vats while the presses keep stamping; finish in a cooling tunnel (ice floor). | New: conveyors, press (timed crusher), chocolate vat (deadly liquid `ec_choc`), reverse lever (toggle), cooling tunnel. Enemies: ecCacao, ecIceCube (in the tunnel), ecHummingbird. | M, Hard Hat (breaks foil walls), Pocket Sundial (hidden, slows presses) | Push the foil crate stack: behind it a vent → envoltura → secret gate. P1 catwalk; P2 envoltura; P3 under a press. | main → 2-5; secret → Souvenir Stand *La Tienda del Cacao* |
| **2-5 Cotopaxi Crater** · LAIR | `teleférico ride 80x16` → `refugio room 26x12 (s)` → `vents arena 30x18` | Lead-in: ride the cable car up the volcano (catwalk hops, condors). Arena for El Tortugón: a crater bowl 30 wide, floor steps up 2 tiles at both edges, three vent grates, the lever block on a mid ledge, low-gravity bubbles for phase 2. | Kept: tower, condors, ridge, catwalk, cable-car `cp`, arena_vents (reshaped). Enemies: ecCondor, ecAlpaca. | M (catwalk), Sig Boots (station) | Catwalk door → refugio. P1 catwalk; P2 refugio; P3 crater-rim ledge. | main → Brazil |
| **2-6 Galápagos Snorkel** · DIVE (secret) | `mar swim 210x18` → `grotto room 26x12` | ① calm reef with zipping penguins; ② the tidal surge pushes back and forth; ③ puffers inflate when you're close: bounce on their tops across a surge. | Kept: surface, arches, puffers, penguins, surge, grotto. Enemies: ecSeaLion, ecPuffer, ecPenguin. | Fins (stand), M (grotto), 1UP | **Bottle #1** in a sunken crate. P1 arch top; P2 grotto; P3 inside the surge. | main → done, draws shortcut **2-6 → 2-4** |
| **2-7 Devil's Cauldron** · TIDE (secret) | `pailón strip 160x22 (gorge)` → `pista area 40x14 (s)` | ① the falls surge: the plunge pool rises 8 rows every 12 s; ② hanging bridges and mist columns; ③ swim up on the high water to reach bridges that are out of reach at low water. | New: plunge pool (tide), suspension bridge, mist updraft. Enemies: ecFrog, ecHummingbird, ecDipper (bird: dives into water, pops up under you). | Fins (stand), M | At the far end of the last bridge, a rope leads to a plateau with an old airstrip → secret gate. P1 bridge; P2 pista hangar; P3 behind the falls at high water. | main → done; secret → **secret flight to Morocco** (unlocks 5-1) |

### World 3: Brazil

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **3-1 Samba Sunrise** · BEAT (124 bpm) | `avenida strip 220x18` → `barracão room 30x12 (s)` | ① surdo drums pop up on the beat; ② parade floats move one step per bar and confetti cannons fire on beat 4; ③ off-beat light floor + floats + cannons together. | Kept: drums, parade, float, stands, lsd. New: bell gate (opens to a kazoo honk on the beat). Enemies: brPandeiro (rolls on the beat), brBrigadeiro (stacker), brParrot. | M, Kazoo (stand), L | A FAKE panel under the stands → barracão. P1 on a float; P2 barracão; P3 risky drum chain. | main → 3-2 |
| **3-2 Coati Caper** · THIEF | `pantanal strip 220x20` → `toca room 30x12 (s)` | ① the coati boss "Quati" snatches the stamps; chase on capybara rides; ② caimans float like logs until stood on, sloths drop from branches; ③ jaguar charges while Quati hides in nest trees. | Kept: capybaras, caimans, jaguar, nest, piranhas, BrCoati. Enemies: brCoati, brJaguar, **brSloth (ceiling dropper)**, brPiranha. | Sig football (kick to stun Quati at range), M, 1UP | At catch 2 Quati dives into a hollow tree: follow it → toca → secret gate. Stamps open the gate lock. P1 nest top; P2 toca; P3 caiman chain. | main → 3-3; secret → Souvenir Stand *Banca do Quati* |
| **3-3 Iguaçu Falls** · TOWER (b) facade | `cataratas climb 34x110` → `garganta room 26x14 (s)` | ① wet rocks zigzag beside three falls that push you down; ② catwalks with coatis while logs tumble down chutes; ③ rainbow bridges (show only where the sun hits the mist) while swifts dive through the curtains. | Kept: wetrocks, logs, mist, walkway. New: rainbow bridge (light-only semis). Enemies: brCoati, brSwift (dives out of the water curtain), brSloth. | M (band 1), Paper Plane (near top), S (catwalk) | Rainbow at band 3 marks a water curtain → garganta → secret gate. P1 walkway end; P2 garganta; P3 top of the mist column. | main → 3-4; secret → 3-6 |
| **3-4 Lençóis Lagoons** · TIDE | `dunas strip 200x22` → `jangada room 26x12 (s)` | ① rain squalls raise the lagoons every 14 s: swim at high water, walk the bed at low; ② dune crests crumble under you; ③ crabs on the beds and piranha schools in the water, timed against the tide. | New: lagoon tide, crumbling dune crest (CRUMBLE sand). Enemies: brCrab, brPiranha (school), brGull. | Fins (stand), M, 1UP | At low tide a stranded raft's hatch opens → jangada (**Bottle #2**). P1 high dune; P2 jangada; P3 a pocket reachable only at low tide. | main → 3-5 |
| **3-5 Estádio do Tucanão** · LAIR | `túnel strip 70x18` → `vestiário room 26x12 (s)` → `estádio arena 34x18 (open roof)` | Lead-in: the players' tunnel teaches the ball: kick it into targets to roll up shutters. Arena for O Tucanão: 34 wide, open sky, goal nets at both ends (bouncy walls), a ball cannon at the left. | Kept: cannons (re-skinned as ball cannon), arena_estadio (reshaped). Enemies: brPandeiro, brBrigadeiro. | Sig football, M | A FAKE locker → kit room. P1 over a shutter; P2 kit room; P3 cannon top. | main → Mozambique |
| **3-6 Rio Hang-Glide** · GLIDE (secret) | `céu islands 220x34` → `quiosque room 26x12 (s)` | ① launch from a granite peak; thermals over Copacabana's wave-pattern promenade (Sugarloaf in the back, no statue); ② seagull flocks and kite strings; ③ land on the volleyball net to re-launch through a ring chain. | Kept: volley, kiosks, gulls. Enemies: brGull, brSwift. | Hang glider (Paper Plane skin, stand at every landing), M | Kiosk roof hatch → room. P1 ring chain; P2 kiosk; P3 low thermal over the sea. | main → done, draws shortcut **3-6 → 3-5** |

### World 4: Mozambique

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **4-1 Ostrich Dash** · RACE | `gorongosa strip 210x20` → `cupim room 30x12 (s)` | ① race the ostrich; elephant water jets lift you onto the fast route; ② dung beetles roll growing balls: knock the beetle, kick its ball to smash a thorn hedge; ③ thorn hedges the ostrich leaps and you burn through with piri-piri. | Kept: elephant, mounds, thorns, herd, sig. Enemies: mzWarthog, **mzDungBeetle (pusher)**, mzWeaver. | Sig piri-piri, M, 1UP (high) | A termite mound with a wider hole (ants marching in) → cupim → secret gate. P1 jet top; P2 cupim; P3 upper route. | main → 4-2; secret → Souvenir Stand *Banca da Gorongosa* |
| **4-2 Dune Stampede** · DOOM | `dunas strip 210x20` → `porão room 30x12 (s)` | ① a stampede dust cloud chases you (5.5 t/s, ramping to 6.8); ② dunes crumble, beached dhow sails bounce you; ③ ghost crabs and curled pangolins in the path while the stampede speeds up. | Kept: stampede, dunes, dhow, crabs. Enemies: mzGhostCrab, mzPangolin (shield), mzMango. | M, S (outrun), Pocket Sundial (hidden) | A dhow mast flying a flag sticks out of the sand: its hatch → porão → secret gate. P1 sail top; P2 porão; P3 crest of the tallest dune. | main → 4-3; secret → 4-6 |
| **4-3 Baobab Skyline** · SKY | `copas islands 200x30 (sunset)` → `oco room 24x14 (s)` | ① baobab crowns as islands, weaver nests bounce you; ② honey (sticky surface) with bees; ③ evening gusts and fruit bats across the widest gaps. | Kept: branches, hollow, honey. Enemies: mzMonkey, mzWeaver, mzChameleon (tongue). | Paper Plane, M, L | Drop into a hole in a crown → the hollow trunk. P1 tallest crown; P2 oco; P3 gust gap. | main → 4-4 |
| **4-4 Hatchling Night** · CARRY (dark) | `praia strip 190x20` → `farol room 22x16` → `cave (s)` | ① carry a lost hatchling to the sea (lower jump); ② the lighthouse beam sweeps: ghost crabs freeze in light and move in dark; ③ relight the lighthouse (lever in the farol) and cross the last tide pools in its beam. | Kept: turtles (slow moving platforms), lighthouse, rocks, crabs. New: carry pedestal, light beam. Enemies: mzGhostCrab (light-frozen), mzPrawn. | M, Hard Hat (its headlamp also freezes crabs), 1UP | A FAKE wall in the lighthouse basement → cave (**Bottle #3**). P1 rock top; P2 cave; P3 lantern gallery outside the lighthouse. | main → 4-5 |
| **4-5 Ilha Fortress** · LAIR | `muralha strip 80x18` → `cisterna room 26x12 (s)` → `tidepool arena 30x18` | Lead-in: ramparts with coconut cannons, the flooded cistern. Arena for O Eremita: a sandbar with sea pits at both ends (kick shells into the sea), the baobab overhead, two ledges, the chili basket on a middle platform. | Kept: rampart, cistern, thorns, arena_tidepool (reshaped). Enemies: mzPrawn, mzCashew. | Sig piri (basket), M | Cistern stepping stone hides a drop → room. P1 rampart; P2 cistern room; P3 cannon top. | main → Morocco |
| **4-6 Buried Dhow** · DIG (secret) | `areia dig 120x40` → `cabine room 22x10 (s)` | ① dig through dune sand; ② the buried hull's chambers, full of cashews, with mole-rats burrowing; ③ sand cave-ins as you dig toward the keel. | New: soil, rock, cave-in. Enemies: mzMoleRat (burrower), mzGhostCrab. | Hard Hat (start), M, Magnet Belt | Captain's cabin behind a rock you dash through. P1 hull chamber; P2 cabin; P3 under a cave-in. | main → done, draws shortcut **4-6 → 4-4** |

### World 5: Morocco

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **5-1 Souk Labyrinth** · MAZE (gentle) | `souk maze 78x42 (3x3 cells)` incl. `lantern shop (s)` | ① rug doors and spice-colour clues (follow saffron yellow); ② carpet moths eat rug platforms, forcing new routes; ③ the last cell: rooftop sky-rugs over the maze to the exit. | Kept: rugs, spices, baskets, skyrugs. Enemies: **maMoth (platform eater)**, maTagine, maTeapot. | Sig carpet (skyrugs cell), M, 1UP | Lantern-shop dead end: stand under the unlit lantern for 1 s, it lights and the back wall slides → secret gate. P1 saffron cell; P2 lantern shop; P3 sky-rugs. | main → 5-2; secret → 5-6 |
| **5-2 Sahara Caravan** · SCROLL | `sahara auto 209x18` → `bonus room (s, kept)` | ① ride camel humps on the scroll; ② the sandstorm wind pushes; ③ mirage platforms flicker (2 s on, 1 s off) over quicksand. | Kept: caravan, storm, oasis, sig, skyrugs, secret. Enemies: maScarab, maFennec, maCobra. | Sig carpet, M | The kept bonus room with the FAKE far wall → the **World 22 door** (22 postcards). P1 oasis palm; P2 bonus room; P3 mirage chain. | main → 5-3; secret → **World 22** |
| **5-3 Chefchaouen Blue** · PHASE | `medina strip 200x22` → `riad room 30x14 (s)` | ① by day: blue stairs, laundry-line platforms, napping cats; ② strike the sun-moon lantern: night brings lantern platforms, the laundry is gone, snails come out and cats wake; ③ flip between day and night mid-air to cross. | Kept: grills, juice (as the night market). New: sun-moon lantern (phase switch), laundry line. Enemies: maSnail (slime trail), maCat (sleeps by day, pounces at night), maTeapot. | M, L (night-only block), Kazoo | A door painted the same blue as the wall; at night a lantern hangs over it → riad → secret gate. P1 roof terrace; P2 riad; P3 night-only ledge. | main → 5-4; secret → Souvenir Stand *Bazar Bleu* |
| **5-4 Kasbah of the Brass Owl** · FORT | `kasbah strip 80x20` → `tower room 26x14` → `owl arena 24x16` → `pigeon loft (s)` | ① kasbah walls and an argan tree full of goats; ② the tower room: chain levers drop tagine lids; ③ mini-boss **Brass Owl** (the Baron's automaton): it turns its head 180° to spot you; when it looks away, pull the chain to drop a lid on it (3 hits; phase 2 it flies a lap and drops feathers). | Kept: kasbah, argan. Enemies: maGoat, maFennec. | M, S | FAKE wall on the roof → pigeon loft. P1 argan top; P2 loft; P3 tower window ledge. | main → 5-5 |
| **5-5 Riad of Fountains** · LAIR | `zellige strip 70x18` → `hammam-free courtyard room (s)` → `riad arena 26x20` | Lead-in: fountain jets lift you between galleries. Arena for the Djinn: a square courtyard 26 x 20, a gallery ring of platforms at 6 rows up, a central fountain basin, the heavy teapot on the floor. | Kept: fountain, screens, arena_riad (reshaped). Enemies: maTagine, maTeapot. | M, Sig carpet (phase 3) | A carved screen opens → small courtyard. P1 gallery; P2 courtyard; P3 fountain top. | main → Spain |
| **5-6 Carpet Skies** · SKY (secret) | `cielo islands 220x30` → `tent room 24x12 (s)` | ① flying carpets as moving islands over the Atlas; ② wind gusts; ③ moths nibbling the carpets you stand on. Minarets appear only as distant silhouettes. | New: carpet islands. Enemies: maMoth, maStork (perched, swoops). | Sig carpet, L, M | A tent on a high island → room. P1 carpet chain; P2 tent; P3 gust gap. | main → done, draws shortcut **5-6 → 5-4** |

### World 6: Spain

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **6-1 La Tomatina** · HOLD | `buñol strip 160x18 (3 plazas)` → `molino room 30x12 (s)` | ① plaza 1: waves of tomatoes while the truck lobs more; ② plaza 2: the floor turns to pulp (ice) and crates move; ③ plaza 3: balconies rain tomatoes while storks snatch you. | Kept: truck, crates, balconies, pulp, sig. New: HoldArena. Enemies: esTomato, esOrange, **esStork (grabber)**. | Sig tomato (start), M, S (plaza 3) | Push two crates off an old flour-mill door → molino → secret gate. P1 balcony; P2 molino; P3 top of the truck in plaza 3. | main → 6-2; secret → 6-7 |
| **6-2 Pintxos Bar** · MINI | `barra strip 200x22` → `queso room 30x14 (s)` | ① toothpick bridges and bread-slice platforms on a giant bar counter in San Sebastián; ② olive-oil spills (slippery) and rolling olives; ③ a salt-shaker climb, octopus ink clouds, then a tortilla flipper (Pancake gimmick) to the exit. | New: toothpick bridge, oil spill (ice surface), tortilla flipper. Enemies: esPulpo (ink), esOlive (roll), esGamba (hop). | M, Bubble Wand, Crawl Pads | Put on the Crawl Pads and crawl through a mouse-hole tunnel in the cheese wedge → queso → secret gate. P1 salt shaker top; P2 queso; P3 tortilla apex. | main → 6-3; secret → Souvenir Stand *La Tiendita de Pintxos* |
| **6-3 City of Arts by Night** · BEAT | `ciutat strip 215x18` → `umbracle room 30x12 (s)` | ① beat-floor lights; ② climb the ribs' crowns while the "eyelid" deck lifts on the bar; ③ bats swoop on the beat across all of it. | Kept: ribs, lights, eyelid, bats, drop. Enemies: esBat, esHorchata. | Kazoo, M, L | A gap in the garden arches → umbracle → secret gate. P1 rib crown; P2 umbracle; P3 eyelid apex. | main → 6-4; secret → 6-6 |
| **6-4 Teide Updrafts** · GLIDE | `teide islands 220x34` → `cueva room 26x12 (s)` | ① glide down volcanic slopes on the Canary Islands; ② fumarole updrafts and dragon trees; ③ a wind-ring chain over lava fields. | New: fumarole updraft, dragon-tree platform. Enemies: esLizard (pouncer), esKestrel. | Glider stands, M, Pocket Sundial | A lava tube under the last landing pad → cueva. P1 ring chain; P2 cueva; P3 low pass over lava. | main → 6-5 |
| **6-5 La Lonja** · LAIR | `fallas strip 80x18` → `taller room (s)` → `lonja arena 28x18` | Lead-in: a Fallas street: papier-mâché fruit ledges, rocket launchers, firecrackers. Arena for Paellasaurus: twisted columns, tomato-crate shelves on both sides, rocket vents in the floor. | Kept: falla, rockets, crackers, arena_lonja (reshaped). Enemies: esHorchata, esTomato. | Sig tomato, M | A falla workshop door → taller. P1 falla top; P2 taller; P3 rocket ride. | main → France |
| **6-6 Oceanogràfic** · DIVE (secret) | `aquari swim 179x18` → `alcove room (s)` | ① glass tunnels; ② jellies pulse in columns; ③ pump jets push you between them. | Kept: tunnel, jellies, pumps, alcove. Enemies: esJelly, esShark. | Fins, M, 1UP | **Bottle #4** in the alcove. P1 tunnel roof; P2 alcove; P3 pump slot. | main → done, draws shortcut **6-6 → 6-4** |
| **6-7 Molinos de La Mancha** · SWITCH (secret) | `mancha strip 190x20` → `harinero room (s)` | ① the wind switch: wind on turns the windmill sails (rotating platforms) and pushes you; ② wind off: sails stop, and wind-held blocks drop; ③ flip the wind while riding a sail. | New: wind switch (toggle), windmill sails. Enemies: esStork, esLynx (pouncer), esSheep. | M, Paper Plane | Inside the last mill → harinero. P1 sail top; P2 harinero; P3 a mid-sail switch. | main → done |

### World 7: France

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **7-1 Paris Morning Rounds** · HUB (errand) | `place room 64x22` → `boulangerie strip 70x18`, `toits strip 80x22 (daylight)`, `café room 40x16` → `quai (s)` | ① bakery: conveyors and rolling croissants; ② rooftops: chimneys lift you, clotheslines; ③ café terrace: umbrellas and crêpe pans. Each ends with a delivery stamp; three stamps open the plaza gate. | Kept: cafe, bakery, croissants, balconies, kiosk, roofs, chimney, clothesline. Enemies: frBaguette, frCroissant, frPoele (crêpe pan, **replaces frMime**), frPigeon, frCat. | Sig mime gloves (plaza), M (bakery), Paper Plane (rooftops) | A torn poster on the kiosk column is a FAKE wall → quai → secret gate. P1 bakery; P2 quai; P3 chimney top. | main → 7-2; secret → 7-6 |
| **7-2 Lavender Magpie** · THIEF | `lavande strip 210x20 (Provence)` → `mas room 30x12 (s)` | ① a magpie snatches the stamps; chase through lavender rows with bee hives; ② sunflowers bounce, and a rooster wakes the sleeping boars; ③ the lavender distillery: steam vents and the last catch. | New: sunflower (bounce), steam vent (Vent), bee hive. Enemies: frMagpie (thief), **frCoq (alarm caller)**, frBoar (sleeper), frSnail (shell). | Sig gloves, M, Kazoo | A cellar FAKE wall in the farmhouse → mas room. P1 sunflower top; P2 mas; P3 distillery roof. | main → 7-3 |
| **7-3 Mont-Saint-Michel Tides** · TIDE | `baie strip 210x22` → `bateau room 26x12 (s)` → `banc area 30x14 (s)` | ① low tide: walk the flats, quicksand pools slow and sink you; ② high tide comes fast (10 s): swim; ③ the tidal bore arrives as a moving front you outrun to the causeway. The abbey island is background only. | New: quicksand (sticky sink), tidal bore. Enemies: frCrab, frOyster (snaps shut), frGull. | Fins, M, Snow Globe (slows the crabs and gulls) | A beached boat → bateau (P2). At low tide a tethered balloon shows on a sandbar: climb its rope → banc → secret gate. P1 causeway post; P3 bore sprint. | main → 7-4; secret → 7-7 |
| **7-4 Truffle Hunt** · DIG | `périgord dig 140x40` → `grotte room 30x14 (s)` | ① a truffle-pig friend sniffs; dig where it points; ② roots, rocks, burrowing moles and charging boars; ③ an underground river cave with cave-ins. | New: soil, truffles (coin skin), cave-in. Enemies: frBoar, frMole (burrower), frSnail. | Hard Hat (start), M, Magnet Belt | A cave with prehistoric-style animal paintings → grotte → secret gate. P1 tree hollow; P2 grotte; P3 under the river. | main → 7-5; secret → Souvenir Stand *La Brocante* |
| **7-5 Château des Glaces** · LAIR | `galerie strip 80x20` → `boudoir room (s)` → `ballroom arena 26x22` | Lead-in: mirror doors, falling chandeliers, the gallery walkway. Arena for Le Grand Soufflé: 22 rows tall, a tilting mirror panel on each wall at row 10, the oven window top centre, balcony platforms. | Kept: mirrors, chandeliers, gallery, arena_ballroom (reshaped). Enemies: frAccordion, frBaguette, frPoele. | M, S | A mirror that shows a different room → boudoir. P1 gallery; P2 boudoir; P3 chandelier ride. | main → the Netherlands |
| **7-6 Seine Chase** · SCROLL (secret) | `seine auto 229x18` | ① book-box lids open and shut in time; ② barges drift through quay gaps; ③ bridges overhead with goodies while pigeons swoop. | Kept: bookboxes, bridge, barge, steps. Enemies: frPigeon, frBaguette. | M, L | A quay door under a bridge → room. P1 bridge top; P2 quay room; P3 barge mast. | main → done |
| **7-7 Montgolfière Skies** · SKY (secret) | `ciel islands 220x30` → `nacelle room (s)` → `alizé area (s)` | ① hot-air balloons rise while you stand in the basket and sink when you leave; ② burner flames; ③ chains of balloons in the wind, a daylight tower silhouette on the horizon. | New: balloon carrier, burner. Enemies: frPigeon, frMacaron (hop). | Paper Plane, L, M | A balloon caught in a trade wind (streamers point east) → alizé → secret gate. P1 balloon chain; P2 nacelle; P3 burner gap. | main → done; secret → **secret flight to Vietnam** (unlocks 10-1) |

### World 8: the Netherlands

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **8-1 Polder Pumps** · SWITCH | `polder strip 220x20` → `gemaal room 30x12 (s)` | ① a valve wheel toggles the canal: high water floats houseboats to roof height, low water empties it to a walkable bed; ② hoisting hooks over high water; ③ two valves (two groups) in one stretch. | Kept: hooks, houseboats, bridge, racks. New: valve wheel. Enemies: nlHerring, nlClog (pair), **nlBulb (burrower)**. | Sig bike, M, Fins | A pump house door appears only at low water → gemaal → secret gate. P1 gable; P2 gemaal; P3 canal bed at low water. | main → 8-2; secret → Souvenir Stand *De Winkel* |
| **8-2 Flower Auction** · FACTORY | `veiling strip 200x20` → `koelcel room 30x12 (s)` | ① trolley conveyors of tulip crates; ② the auction clock's hand sweeps the floor (Sweeper); ③ crate stacks on reversing belts under the clock. | New: auction clock (Sweeper), trolley belts. Enemies: nlBee, nlBulb, nlClog. | M, Pocket Sundial, Kazoo | Cold mist leaks from a cold-room door → koelcel → secret gate. P1 clock top; P2 koelcel; P3 under the hand. | main → 8-3; secret → 8-6 |
| **8-3 Bike Lane Rush** · RACE | `fietspad strip 195x18` → `brug room (s)` | ① race a gull on a cargo bike; ② drawbridges rise and fall; ③ ride tram roofs past the drawbridges. | Kept: hop, drawbridge, tram, racks. Enemies: nlGull (coin snatcher), nlStroop. | Sig bike, M, S | Under a drawbridge → room. P1 tram roof; P2 brug; P3 a drawbridge at full height. | main → 8-4 |
| **8-4 Frozen Canals** · LAMP | `ijs strip 191x18 (dark)` → `bonus room (s, kept)` | ① skate by lantern light, relight at the koek-en-zopie stalls; ② thin ice cracks behind you; ③ skating in the dark with the light fading. | Kept: skate, thin, stall, bridge, secret. Enemies: nlSnowman, nlHerring. | M, Snow Globe (settles snow on thin ice: cracks pause), 1UP | The kept bonus room's FAKE wall → the **Antarctica gate**. P1 bridge; P2 bonus room; P3 thin-ice run. | main → 8-5; secret → **Antarctica** |
| **8-5 The Weigh House** · LAIR | `kaasmarkt strip 80x18` → `kelder room (s)` → `waag arena 30x18` | Lead-in: the cheese market: sledges on ramps, the chute. Arena for the Cheese King: two inward ramps 4 tiles high from both sides, the throne on a drawbridge on the right. | Kept: chute, scales, sledges, arena_waag (reshaped). Enemies: nlCheese, nlClog. | Sig bike, M | Cellar under the scales → kelder. P1 ramp top; P2 kelder; P3 scale pan. | main → Indonesia |
| **8-6 Windmill Row** · SWING (secret) | `molens islands 200x24` → `molen room (s)` | ① windmill sails as rotating platforms; ② tulip blooms bounce you between mills; ③ the wind reverses and every sail turns the other way. | Kept: windmill, tulips. Enemies: nlBee, nlGull. | M, Bubble Wand | Inside the last mill → room. P1 sail apex; P2 molen; P3 reversed-wind chain. | main → done, draws shortcut **8-6 → 8-4** |

### World 9: Indonesia (Bali and beyond)

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **9-1 Kuta Surf** · RIDE | `ombak ride 220x17` → `gua room 26x12 (s)` | ① surf the swells; ② lava-rock reefs with urchins; ③ a big set: launch off the lip for high coins. | Kept: gecko, surf, reef, pier, buoys, sandbar, lip, jukung. Enemies: idUrchin, idFlyfish. | Sig surfboard, M, S | A sea cave behind the pier pilings → gua (**Bottle #5**). P1 lip coins; P2 gua; P3 a buoy chain. | main → 9-2 |
| **9-2 Kite Festival** · GLIDE | `sawah islands 240x30` → `lumbung room 26x12 (s)` | ① grab kite tails to glide over rice terraces; ② rattling scarecrows and a duck parade as a moving bridge; ③ a kite relay in strong wind. | Kept: terrace, kites, ducks, scarecrows, paddy, hut. Enemies: idDuck, idScarecrow, idDragonfly. | Paper Plane, M, Bubble Wand | Rice barn on stilts → lumbung → secret gate. P1 tallest kite; P2 lumbung; P3 wind relay. | main → 9-3; secret → 9-6 |
| **9-3 Batur Eruption** · DOOM | `gunung strip 220x22 (downhill)` → `tambang area 30x14 (s)` | ① a lava flow chases you down at dawn; ② lava bombs (landing spot glows first) and hot rocks; ③ civets prowl the ash fields while the flow speeds up. | Kept: dawn, trail, bombs, hotrocks, fissure, lookout, civets. Enemies: idCivet, idBat, idGecko (wall crawler). | M, S, Snow Globe (cools hot rocks) | A mine-cart track enters the mountain → tambang → secret gate. P1 lookout; P2 tambang; P3 fissure column. | main → 9-4; secret → 9-7 |
| **9-4 Manta Night Dive** · LAMP (water) | `laut swim 230x18 (dark)` → `kapal room 30x12 (s)` | ① glowing plankton clouds restore your light; ② anglerfish dangle fake coins; ③ ride a manta's slipstream through moray shafts in fading light. | Kept: biolum, reefgate, anglers, manta, morays, wreck, plankton. Enemies: idLionfish, idAngler, idMoray. | Fins, M, Hard Hat (headlamp) | Wreck hold → kapal → secret gate. P1 reef gate; P2 kapal; P3 the manta run. | main → 9-5; secret → Souvenir Stand *Warung* |
| **9-5 Monkey Forest** · LAIR | `hutan strip 80x20` → `akar room (s)` → `grove arena 26x24` | Lead-in: macaques snatch your power-up (headline), banyan roots, crumbling stairs. Arena for Boss Kera: 24 rows tall, three durian trees with branch platforms at rows 8 and 12; temples appear only far in the background. | Kept: monkeys, roots, ruinstairs, gongs, arena_grove (reshaped). Enemies: **idMacaque (item thief)**, idSate. | M, S | A root curtain → akar. P1 root top; P2 akar; P3 gong ledge. | main → Vietnam |
| **9-6 Orangutan Canopy** · SWING (secret) | `rimba islands 210x26` → `nest room (s)` | ① vine swings in the Borneo canopy; ② orangutan friends throw you (catapult); ③ hornbills dive across the swing chains. | New: orangutan catapult. Enemies: idHornbill, idGecko, idMacaque. | Bubble Wand, M | A leaf nest high up → room. P1 throw apex; P2 nest; P3 hornbill gap. | main → done |
| **9-7 Blue Fire Rails** · RAIL (secret) | `ijen rail 200x20 (dark blue)` → `depot room (s)` | ① a mine cart on forked tracks; ② blue flames burst from vents on the track; ③ forks under sulfur smoke where only the flames light the way. | New: flame vent, rail fork. Enemies: idBat, idGecko. | M, Hard Hat | The lower fork's dead end → depot. P1 upper fork; P2 depot; P3 flame jump. | main → done |

### World 10: Vietnam

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **10-1 Train Street** · DOOM (periodic) | `phố strip 250x18` → `cà phê room 26x12 (s)` | ① the train passes every 9 s (1.5 s horn tell): duck into doorsteps; ② stool stacks to climb; ③ lasso the rooftop wires while the train passes below. | Kept: pho, stools, trainstreet, rooftops. Enemies: vnScooter, vnBao, **vnNon (boomerang hat)**. | Sig noodle lasso (pho cart), M, 1UP | A café's back wall is FAKE → room. P1 stool tower; P2 café; P3 wire swing. | main → 10-2 |
| **10-2 Ha Long Junk** · RIDE | `vịnh ride 230x16` → `hang room 30x14 (s)` | ① the junk boat sails between karsts; ② lasso the trees on karst tops; ③ leaping squid and a sea cave straight through a karst. | Kept: karsts, swing, doubleswing, rafts, cave. Enemies: vnShrimp, vnSquid, vnCormorant. | Sig lasso, M, S | Lasso a cliff tree to a cave mouth → hang → secret gate. P1 karst top; P2 hang; P3 the double swing. | main → 10-3; secret → Souvenir Stand *Chợ Nhỏ* |
| **10-3 Hoi An Lanterns** · LAMP | `phố cổ strip 200x18 (dark)` → `xưởng đèn room 30x12 (s)` | ① carry a paper lantern; relight at lantern shops; ② lasso the ferry across the river; ③ floating river lanterns as platforms while silkworms drop. | Kept: oldstreet, ferry, lanterns, bridgearch. Enemies: vnToad, vnMosquito, vnSilkworm (thread dropper). | M, L, Sig lasso | Lantern workshop → secret gate. P1 bridge arch; P2 workshop; P3 lantern chain. | main → 10-4; secret → 10-6 |
| **10-4 Son Doong Flood** · RISE (flood) | `hang climb 30x110 (rising water 0.6 t/s)` → `rừng room (s)` | ① the cave floods: swim and climb; ② lasso-reel up shafts; ③ a jungle under a skylight inside the cave, with the water still rising. | Kept: cledges, reel, chamber. Enemies: vnCaveCrab, vnBat. | Fins, M | A skylight garden pocket → room. P1 chamber; P2 garden; P3 reel shaft. | main → 10-5 |
| **10-5 Hue Citadel** · LAIR | `hoàng thành strip 70x18` → `kho room (s)` → `kettle arena 26x20` | Lead-in: a hot-coffee pit crossed on melting ice cubes, bean roasters. Arena for Ong Phin: courtyard with the kettle on its beam, a pedal at each end. | Kept: coffeepit, roasters, palacehall, arena_kettle. Enemies: vnBean, vnRoll. | M, S | Store-room door → kho. P1 hall gallery; P2 kho; P3 roaster top. | main → Japan |
| **10-6 Mekong Floating Market** · HUB (errand, secret) | `chợ nổi room 64x20 (bobbing boats)` → `vườn strip 70x18`, `kênh ride 60x16`, `lò kẹo room 40x16` | A water-buffalo, a duck and a gecko trade a chain: coconut → candy → fruit → the stamp. ① orchard; ② canal ride; ③ coconut-candy workshop (belts). | New: bobbing boat floor, trade chain. Enemies: vnShrimp, vnToad. | M, Magnet Belt | An empty boat drifts behind the plaza → room. P1 orchard; P2 drifting boat; P3 workshop belt. | main → done |

### World 11: Japan

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **11-1 Sushi Carousel** · FACTORY | `kaiten strip 210x20` → `reizōko room 26x12 (s)` | ① plates carry you along the belt; ② giant chopsticks grab from above, tea-cup steam lifts you; ③ reversing belts, and a soy-sauce bottle on the counter is a tanuki in disguise (leaf on its cap). | Kept: shiba, counter, wheel, chopsticks, teacup, soyjumps. Enemies: jpTamago, jpTako, jpWasabi, **jpTanuki (mimic)**. | Sig nunchucks (Shiba), M, 1UP | Cold mist from a fridge door → reizōko. P1 wheel top; P2 fridge; P3 chopstick ride. | main → 11-2 |
| **11-2 Bullet Train** · RIDE | `shinkansen ride 232x16` → `sokusen area 30x14 (s)` | ① ride the roof past gantries; ② tunnels and crows; ③ umbrella flyers with Mount Fuji in view. | Kept: endcap, fujiview, gantry, crows, tunnel, brollies. Enemies: jpCrow, jpUmbrellaFly. | Sig, M, S | At a station a side track (siding) peels off → sokusen → secret gate. P1 gantry; P2 siding; P3 between tunnels. | main → 11-3; secret → 11-7 |
| **11-3 Night of Things** · PHASE | `chikurin strip 220x20` → `chashitsu room 30x12 (s)` | ① by day: bending bamboo poles and bursting shoots; ② ring the wind chime: night brings folklore object-spirits (hopping umbrellas, blinking lanterns) and glowing path stones; ③ switch mid-section with tanuki mimics about. | Kept: grove, poles, shoots, kpond. New: wind chime (phase switch). Enemies: jpUmbrella, jpChochin (blinker), jpTanuki, jpOnigiri (day). | M, L, Kazoo | Teahouse → chashitsu → secret gate. P1 pole vault; P2 teahouse; P3 night-only stone. | main → 11-4; secret → Souvenir Stand *Omise* |
| **11-4 Neon Tower** · TOWER (c) exterior | `biru climb 30x110` → `gacha room 26x14 (s)` | ① window-washer gondolas lift you; ② neon sign ledges flicker on and off; ③ air-con updrafts, a claw machine shaft, the rooftop. | Kept: signs, claw, vending, cage. New: gondola lift, air-con updraft. Enemies: jpCrow, jpLuckyCat, jpCapsule. | M, Paper Plane | An arcade window → gacha → secret gate. P1 sign ledge; P2 gacha; P3 claw ride. | main → 11-5; secret → 11-6 |
| **11-5 Kappa Garden** · LAIR | `shiro strip 80x18` → `kura room (s)` → `pond arena 26x18` | Lead-in: nightingale floor (chirps underfoot), the moat, a revolving wall. Arena for the Great Kappa: the castle garden, koi pond at the far end, three stepping stones to push. | Kept: nightingale, moat, revolve, garden, arena_pond. Enemies: jpUmbrella, jpTop. | M, Sig | The revolving wall turns twice → kura. P1 garden beam; P2 kura; P3 moat post. | main → Nepal |
| **11-6 Capsule Toy Machine** · MINI (secret) | `gacha strip 180x22` → `capsule room (s)` | ① inside a toy machine: capsules roll as platforms; ② the coin slot and a spiral chute; ③ the crank turns the whole drum. | New: capsule platform, spiral chute. Enemies: jpCapsule, jpTanuki. | M, Bubble Wand | A capsule you can open → room. P1 slot top; P2 capsule; P3 crank apex. | main → done |
| **11-7 Fuji Thermals** · GLIDE (secret) | `fuji islands 220x34` → `hut room (s)` | ① glide on paper cranes; ② cherry-petal updrafts; ③ a lake reflection chain. | New: paper-crane glider, petal updraft. Enemies: jpCrow, jpUmbrellaFly. | Paper Plane, L | A mountain hut → room. P1 crane chain; P2 hut; P3 lowest thermal. | main → done |

### World 12: Nepal (the finale)

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **12-1 Suspension Bridges** · SKY | `pul islands 220x30` → `chiya room 30x12 (s)` | ① swaying bridges between ridges (prayer flags only as decoration); ② monals and wind; ③ bridges whose planks drop in a gust. | Kept: pen, terrace, bridge, momos. Enemies: npMomo, npMonal, npRoti. | Sig yak (pen), M, Paper Plane | A tea house on a ledge → chiya → secret gate. P1 longest bridge; P2 tea house; P3 a gust plank. | main → 12-2; secret → Souvenir Stand *Pasal* |
| **12-2 Yak Caravan Pass** · ROLL | `bhanjyang strip 220x22` → `khadal area 30x14 (s)` | ① push a snowball that grows; ② ride it over ice; ③ a full-size ball smashes snow walls while marmot sentinels whistle. | Kept: slope, snowwall, marmots, icy, pen. Enemies: npMarmot, npSnowball, **npYeti (frost breath)**. | Sig yak, M, Snow Globe | The crevasse lip at the third snow wall → khadal → secret gate. P1 snowwall top; P2 khadal; P3 ride the full ball. | main → 12-3; secret → 12-6 |
| **12-3 Blizzard Night** · SNEAK | `himpat strip 230x20 (dark, snow)` → `depot area 30x14 (s)` | ① gusts every 6 s hide you from yetis; ② boulders to hide behind; ③ sleeping yetis plus marmot sentinels together. | Kept: storm, shelter, yeti. Enemies: npYeti, npMarmot (sentinel). | Cardboard Box, M | A sled track leads into a Baron supply shed → depot → secret gate. P1 shelter roof; P2 depot; P3 past a sleeping yeti. | main → 12-4; secret → 12-7 |
| **12-4 Khumbu Icefall** · RISE (autoscroll) | `icefall climb 28x120 (scroll up 0.9-1.2 t/s)` → `tent room (s)` | ① ladders over crevasses; ② icicles drop and seracs crumble; ③ the climb speeds up through a serac field. | Kept: iledges, ladders, icicles, seracs. Enemies: npChough, npSnowball. | M, S | A tent pitched in a side niche → room. P1 ladder band; P2 tent; P3 serac top. | main → 12-5 |
| **12-5 Baron's Fortress** · LAIR (finale) | `vault strip 90x18` → `archive room (s)` → `summit arena 30x20` | Lead-in: shrink-ray cameras (FlashTrap re-themed), belts, the jar gallery. Arena: the summit roof (kept). | Kept: cameras, belts, gallery, snowwall, arena_summit. Enemies: npTinBot, npBobble, npGlobe. | M, S, Sig yak | Jar archive behind a belt → archive. P1 gallery; P2 archive; P3 belt top. | main → ending |
| **12-6 Crevasse Drop** · FALL (secret) | `khadal shaft 22x160 (blue ice)` → `cave (s)` | ① fall through blue ice; ② icicles break as you pass; ③ ice bridges to burst through. | New: breakable ice bridge. Enemies: npChough, npBat. | Paper Plane, M | A side cave lit blue → room. P1 mid ledge; P2 cave; P3 icicle gap. | main → done, draws shortcut **12-6 → 12-4** |
| **12-7 Baron's Supply Depot** · FORT (secret) | `depot strip 80x20` → `crate room` → `tin yak arena 24x16` | ① crate conveyors; ② the Baron's crate lifts; ③ mini-boss **Tin Yak** (a robot yak): it charges; dodge so it rams the crate walls and dents itself (3 hits). | New: Tin Yak brain. Enemies: npTinBot. | M, S | A crate with a hatch → room (s). P1 lift top; P2 hatch room; P3 arena ledge. | main → done |

### World 13: Antarctica (secret land, 4 main + 13-5)

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **13-1 Ice Shelf Bowling** · ROLL | `shelf strip 200x20` → `igloo room (s)` | ① belly-slide bowling; ② a snowball grows as you push it; ③ seal holes pop while you ride the ball. | Kept: penguin, bowling, holes, seracs, crevasse. Enemies: **aqPenguin (conga)**, aqSkua, aqSeal. | Sig penguin slide, M | An igloo with a draft → secret gate. P1 serac; P2 igloo; P3 ball ride. | main → 13-2; secret → 13-5 |
| **13-2 Upside-Down Pole** · FLIP | `aurora strip 200x22` → `berg room (s)` | ① aurora bands flip gravity; ② icebergs hang from the ceiling; ③ skuas swoop at the flip lines. | Kept: growler, floe (as ceiling ice). Enemies: aqSkua, aqKrill (swarm). | M, L | Inside a hanging berg → room. P1 aurora line; P2 berg; P3 mid-air flip. | main → 13-3 |
| **13-3 Aurora Station** · FORT | `station strip 80x18` → `module room` → `plough arena 24x16` → `lab (s)` | ① station modules and the heater vent; ② antenna mast; ③ mini-boss **Snow-Plough Bot**: it ploughs walls of snow at you; jump them and stomp its exhaust when it overheats (3 hits). | Kept: modules, vent, mast. Enemies: aqRover, aqSnowball. | M, Hard Hat | A lab door → room → secret gate. P1 mast; P2 lab; P3 arena ledge. | main → 13-4; secret → Souvenir Stand *Station Store* |
| **13-4 The Floe of Big Tusk** · LAIR | `crevasse strip 70x18` → `ice cave (s)` → `glacier arena 26x18` | Lead-in: a crevasse slide with kickable ice blocks. Arena (kept): ice floor, icicle ceiling, two ice blocks. | Kept: arena_glacier, bowling. Enemies: aqSnowball, aqRover. | Sig slide, M | Ice cave → P2. P1 slide ledge; P3 icicle ledge. | main → done |
| **13-5 Egg Express** · CARRY (secret) | `blizzard strip 180x20` → `rookery room (s)` | ① carry an emperor penguin's egg on Brady's feet; ② skuas try to snatch the egg; ③ blizzard gusts on thin ice. | New: egg pedestal. Enemies: aqSkua, aqSeal. | M, S | A rookery behind a snow drift → room. P1 drift; P2 rookery; P3 thin-ice gap. | main → done |

### World 22 (secret land, 4 main + 22-5)

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **22-1 Station of Clocks** · PHASE | `station strip 156x18` → `clock room (s)` | ① clock faces drift round; ② strike the clock: 2:22 becomes 22:22 and the station swaps; ③ your echo trails you while you swap. | Kept: clocks, echo, upward. Enemies: w22Alarm, w22Moth, **w22Echo (replayer)**. | M, Pocket Sundial | Inside the big clock → room. P1 clock face; P2 clock room; P3 22:22-only ledge. | main → 22-2 |
| **22-2 The Endless Corridor** · MAZE | `corridor maze 78x42` | ① doors that loop; ② hourglasses slow time near them; ③ count the doors: the 22nd one is different. | Kept: corridor, doors. Enemies: w22Hourglass (time slower), w22Envelope (loose letter that flaps and sticks to you). | M, L | The 22nd door → secret gate. P1 gallery; P2 a dead-end cell; P3 loop room. | main → 22-3; secret → 22-5 |
| **22-3 Mirror Lake** · FLIP | `lake strip 164x18 (mirror: played leftwards)` → `under room (s)` | ① stepping stones; ② fall through the lake surface and walk your reflection upside down; ③ swap above and below in mid-air. | Kept: lake, stairs, mirror. Enemies: w22Moth, w22Alarm. | M, S | A reflection-only door → room. P1 stones; P2 under; P3 a mid-air swap. | main → 22-4 |
| **22-4 The 22nd Door** · LAIR | `echo hall strip 60x18` → `arena door 26x18` | Lead-in: your echo follows you down the hall. Arena (kept): the mirror line and the clock. | Kept: arena_door, echo, clocks. | M, Pocket Sundial | P1/P2/P3 in the hall (P2 behind a mirror). | main → done |
| **22-5 The Writer's Desk** · MINI (secret) | `desk strip 200x22` → `drawer room (s)` | ① tiny Brady crosses typewriter keys (beat blocks that press down); ② ink pots and crumpling pages; ③ paperclip springs to the top of the coffee cup. A nod to Brady's novel *22*. | New: typewriter key, paperclip spring. Enemies: w22Envelope, w22Moth. | M, Paper Plane | An open drawer → room. P1 key row; P2 drawer; P3 cup rim. | main → done |

---

## 3. Secret exits and the map graph

### 3.1 What a hidden exit can open
| Target | `to` value | What the player sees |
|---|---|---|
| a secret level | `'1-6'` | a new trail draws itself on the country panel to a new stop with a gold ring |
| a shortcut | `'node:1-5'` (used on secret levels' main exits) | a trail draws from the secret stop to a later main stop and unlocks it |
| a Souvenir Stand (bonus house) | `'house:mx-tienda'` | a market-stall icon pops up on the panel |
| a secret land | `'land:aq'`, `'land:w22'` | the world map cracks open a new pin |
| a secret flight | `'flight:ma'` | a gold dotted flight arc appears on the world map; the target country's level 1 unlocks |
| the next country | `'country:next'` (the default for a boss's main exit) | the existing flight to the next country |

**Fair hiding rules (every hidden exit follows all four):**
1. **In-level tell, visible from the main route:** draft particles from a wall, a cracked or differently painted tile, bubbles from a crack, a rainbow in mist, an animal walking into it, cold mist, a flag on a mast.
2. **Reachable without a power-up the level doesn't hand out.** If it needs gear, the gear stand is in the same level, before it.
3. **Never more than one screen off the main route.**
4. **Map tell after the first clear:** the stop shows exit pips (● found, ○ not found), e.g. ●○ for a level with 2 exits and 1 found. Pips appear only after the level has been cleared once.

### 3.2 Per-country graphs
Panel grid: 3 columns x 3 rows; row 0 is the bottom (the grid in `TourLandscape.grid` on `origin/sbw/graphics-pass-fixed`). Main stops always sit at m1 `[0,0]`, m2 `[1,0]`, m3 `[2,0]`, m4 `[2,1]`, boss `[1,2]` (four-level lands: boss at `[1,1]`). Secret stops and houses fill the free cells listed below; the free cell left over gets the landmark. Arrows: `─` main exit, `┄s┄` hidden exit, `═` shortcut drawn by a secret level's main exit.

**Mexico**
```
row2   [landmark]          1-5 Hacienda (boss)        [free]
row1   🏪 La Tiendita       1-6 Pit of Swallows        1-4 Volcán
row0   1-1 Mercado ─────── 1-2 Xochimilco ─────────── 1-3 Cenote
edges: 1-1┄s┄🏪   1-3┄s┄1-6   1-6═1-5
```
- 1-1 bodega shelf (chili dust puffs from the crate trapdoor; the FAKE shelf has a draft) → La Tiendita.
- 1-3 bubbles from the crack behind the roots → 1-6.
- 1-6 main exit draws the shortcut 1-6 → 1-5.

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 1-6 | `[1,1]` | `2` |
| house mx-tienda | `[0,1]` | `0` |
| 1-5 | `[1,2]` | `[3, 5]` |

**Ecuador**
```
row2   2-7 Devil's Cauldron   2-5 Cotopaxi (boss)   🏪 Tienda del Cacao
row1   2-6 Galápagos Snorkel  [landmark]            2-4 Cacao Works
row0   2-1 ────────────────── 2-2 ───────────────── 2-3
edges: 2-2┄s┄2-7   2-3┄s┄2-6   2-6═2-4   2-4┄s┄🏪   2-7┄s┄✈ Morocco
```
- 2-2 rainbow in the waterfall mist → 2-7.
- 2-3 bubbling pool in a lava tube → 2-6.
- 2-4 foil crate stack with a vent behind it → stand.
- 2-7 rope at the end of the last bridge → airstrip → secret flight to Morocco.
- 2-6 main exit draws the shortcut 2-6 → 2-4.
- Bottle #1 is in 2-6.

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 2-6 | `[0,1]` | `2` |
| 2-7 | `[0,2]` | `1` |
| house | `[2,2]` | `3` |
| 2-4 | `[2,1]` | `[2, 5]` |

**Brazil**
```
row2   🏪 Banca do Quati    3-5 Estádio (boss)    [landmark]
row1   [free]               3-6 Rio Hang-Glide    3-4 Lençóis
row0   3-1 Samba ────────── 3-2 Coati Caper ───── 3-3 Iguaçu
edges: 3-2┄s┄🏪   3-3┄s┄3-6   3-6═3-5
```
- 3-2: the coati dives into a hollow tree at catch 2 → stand.
- 3-3: rainbow on the band-3 water curtain → 3-6.
- Bottle #2 is in 3-4.

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 3-6 | `[1,1]` | `2` |
| house | `[0,2]` | `1` |
| 3-5 | `[1,2]` | `[3, 5]` |

**Mozambique**
```
row2   🏪 Banca da Gorongosa  4-5 Ilha (boss)   [landmark]
row1   4-6 Buried Dhow        [free]            4-4 Hatchling Night
row0   4-1 Ostrich ────────── 4-2 Stampede ──── 4-3 Baobab
edges: 4-1┄s┄🏪   4-2┄s┄4-6   4-6═4-4
```
- 4-1: termite mound with ants marching in → stand.
- 4-2: dhow mast flying a flag → 4-6.
- Bottle #3 is in 4-4.

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 4-6 | `[0,1]` | `1` |
| house | `[0,2]` | `0` |
| 4-4 | `[2,1]` | `[2, 5]` |

**Morocco**
```
row2   ✦ World 22 door      5-5 Riad (boss)     🏪 Bazar Bleu
row1   5-6 Carpet Skies     [landmark]          5-4 Brass Owl
row0   5-1 Souk ─────────── 5-2 Sahara ──────── 5-3 Chefchaouen
edges: 5-1┄s┄5-6   5-6═5-4   5-2┄s┄World 22 (22 postcards)   5-3┄s┄🏪   ✈ from Ecuador lands at 5-1
```
- 5-1: the unlit lantern in the lantern-shop dead end → 5-6.
- 5-3: the door painted wall-blue, with a lantern over it at night → stand.
- 5-2: the kept bonus room → the World 22 door.

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 5-6 | `[0,1]` | `0` |
| house | `[2,2]` | `2` |
| 5-4 | `[2,1]` | `[2, 5]` |

The World 22 door is drawn as a ghost pin on the world map, not as a panel stop.

**Spain**
```
row2   6-7 Molinos        6-5 Lonja (boss)   🏪 Tiendita de Pintxos
row1   6-6 Oceanogràfic   [landmark]         6-4 Teide
row0   6-1 Tomatina ───── 6-2 Pintxos ────── 6-3 Ciutat
edges: 6-1┄s┄6-7   6-2┄s┄🏪   6-3┄s┄6-6   6-6═6-4
```
- Bottle #4 is in 6-6.

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 6-6 | `[0,1]` | `2` |
| 6-7 | `[0,2]` | `0` |
| house | `[2,2]` | `1` |
| 6-4 | `[2,1]` | `[2, 5]` |

**France**
```
row2   7-7 Montgolfière   7-5 Château (boss)   🏪 La Brocante
row1   7-6 Seine Chase    [landmark]           7-4 Truffle Hunt
row0   7-1 Paris ──────── 7-2 Provence ─────── 7-3 Mont-Saint-Michel
edges: 7-1┄s┄7-6   7-3┄s┄7-7   7-4┄s┄🏪   7-7┄s┄✈ Vietnam
```

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 7-6 | `[0,1]` | `0` |
| 7-7 | `[0,2]` | `2` |
| house | `[2,2]` | `3` |

**Netherlands**
```
row2   ✦ Antarctica crack   8-5 Weigh House (boss)   [landmark]
row1   8-6 Windmill Row     🏪 De Winkel              8-4 Frozen Canals
row0   8-1 Polder ───────── 8-2 Auction ──────────── 8-3 Bike Rush
edges: 8-1┄s┄🏪   8-2┄s┄8-6   8-6═8-4   8-4┄s┄Antarctica
```

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 8-6 | `[0,1]` | `1` |
| house | `[1,1]` | `0` |
| 8-4 | `[2,1]` | `[2, 5]` |

**Indonesia**
```
row2   9-7 Blue Fire Rails  9-5 Monkey Forest (boss)  🏪 Warung
row1   9-6 Orangutans       [landmark]                9-4 Manta Night
row0   9-1 Kuta ─────────── 9-2 Kites ─────────────── 9-3 Batur
edges: 9-2┄s┄9-6   9-3┄s┄9-7   9-4┄s┄🏪
```
- Bottle #5 is in 9-1.

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 9-6 | `[0,1]` | `1` |
| 9-7 | `[0,2]` | `2` |
| house | `[2,2]` | `3` |

**Vietnam**
```
row2   🏪 Chợ Nhỏ      10-5 Hue (boss)   [landmark]
row1   10-6 Mekong     [free]            10-4 Son Doong
row0   10-1 Train St ─ 10-2 Ha Long ──── 10-3 Hoi An
edges: 10-2┄s┄🏪   10-3┄s┄10-6   ✈ from France lands at 10-1
```

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 10-6 | `[0,1]` | `2` |
| house | `[0,2]` | `1` |

**Japan**
```
row2   11-7 Fuji Thermals   11-5 Kappa (boss)   🏪 Omise
row1   11-6 Capsule Toy     [landmark]          11-4 Neon Tower
row0   11-1 Sushi ───────── 11-2 Train ──────── 11-3 Night of Things
edges: 11-2┄s┄11-7   11-3┄s┄🏪   11-4┄s┄11-6
```

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 11-6 | `[0,1]` | `3` |
| 11-7 | `[0,2]` | `1` |
| house | `[2,2]` | `2` |

**Nepal**
```
row2   12-7 Supply Depot   12-5 Fortress (boss)   🏪 Pasal
row1   12-6 Crevasse       [landmark]             12-4 Icefall
row0   12-1 Bridges ────── 12-2 Yak Pass ──────── 12-3 Blizzard
edges: 12-1┄s┄🏪   12-2┄s┄12-6   12-6═12-4   12-3┄s┄12-7
```

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 12-6 | `[0,1]` | `1` |
| 12-7 | `[0,2]` | `2` |
| house | `[2,2]` | `0` |
| 12-4 | `[2,1]` | `[2, 5]` |

**Antarctica** (4 main)
```
row1   13-5 Egg Express   13-4 Big Tusk (boss)   🏪 Station Store
row0   13-1 Bowling ───── 13-2 Upside-Down ───── 13-3 Station
edges: 13-1┄s┄13-5   13-3┄s┄🏪
```

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 13-4 | `[1,1]` | `2` |
| 13-5 | `[0,1]` | `0` |
| house | `[2,1]` | `2` |

**World 22** (4 main)
```
row1   22-5 Writer's Desk   22-4 The 22nd Door (boss)   [landmark]
row0   22-1 Clocks ──────── 22-2 Corridor ───────────── 22-3 Mirror Lake
edges: 22-2┄s┄22-5
```

| stop | `mapCell` | `mapFrom` |
|---|---|---|
| 22-4 | `[1,1]` | `2` |
| 22-5 | `[0,1]` | `1` |

### 3.3 Cross-country secrets
- **Secret flights**
  - 2-7 Devil's Cauldron → Morocco: unlocks 5-1. Landing in Morocco early does not mark Brazil or Mozambique done; their pins stay as they were.
  - 7-7 Montgolfière Skies → Vietnam: unlocks 10-1.
  - On the world map each flight is a gold dotted great-circle arc labelled with a tiny plane or balloon. Taking it plays the normal flight animation along the arc.
- **Bottle Mail**
  - Five bottles: 2-6, 3-4, 4-4, 6-6, 9-1. Each sits in that level's secret room as a pickup (`bottle` entity, `n` 1-5), with a short note from Chinka.
  - Each bottle found draws a blue dashed sea-current line on the world map from its country toward a point in the mid-Atlantic (lon -30, lat 5).
  - All five reveal the **Postcard Lighthouse**, a world-map house node.
  - Entering it lights the beam once: from then on every panel stop with an undiscovered exit shows a small flashing "?" flag. Pips alone don't tell you *where*; the flag tells you that the stop is worth replaying.

### 3.4 Souvenir Stands (bonus houses)
- **What it is:** a one-screen shop room (`room` gen, stamp per country) run by a local animal friend: Xolo the dog, a booby, a coati, a hornbill, a fennec, a stork, a hedgehog, a goose, a gecko, a water buffalo, a shiba, a red panda, a penguin.
- **How it works:** three items on a counter with **coin prices** (cheap 30, mid 60, premium 100), drawn from the country's stock list. Walk up and press Action to buy one into the Backpack.
- **Stock:** rotates after every level clear (seeded by `Save.data.done` count).
- **Originality:** a shop with prices, not a free pick-one-of-several.
- **Map data:** stands are map nodes, not levels; they never count toward level or postcard totals.

### 3.5 Data model
**Per level** (§7.2 has the full spec):
- `mapCell: [col, row]` and `mapFrom: index | [index, …]`. Indices count `levels` first, then `houses`.
- `exits: { main: { to? }, secret?: { to, hint } }`.
  - A main level's main exit defaults to the next main level (or `'country:next'` for the boss).
  - A secret level's main exit defaults to "back to the map".
  - `hint` is the line the Postcard Lighthouse flag shows ("Something rattles behind the mole stall...").

**Save v2** (key `super-brady-o-world-save-v2`):
```js
{ v: 3,                                 // the engine's save version (v < 3 would wipe progress again)
  unlocked: { '1-1': true },            // level ids (still written; isUnlocked also derives from exits)
  done: {}, gold: {}, best: {},
  exits: { '1-3': { main: true, secret: true } },   // which exits were taken
  secretExits: {},                      // legacy mirror: id -> true when exits[id].secret
  tour: { at, seen, freed, lands, cards,
          revealed: { '1-6': true, 'house:mx-tienda': true },   // stops/houses visible on the panel
          paths: { '2>5': true },        // per country: trails already drawn (by stop index), so reveals animate once
          flights: { ma: true }, bottles: { 1: true }, lighthouse: false,
          houses: { 'mx-tienda': { stockSeed: 3 } } },
  pack: null,                            // the Backpack (existing field)
  lives, score, look, settings, eggs, lastWorld, deaths, beatGame }
```
**Migration:** on load, if v2 is missing and v1 exists, copy only `settings` and `look` from v1, then save v2. v1 is left untouched (harmless).

**Unlock rule** (`TourProgress.isUnlocked(id)`):
- `Save.data.unlocked[id]`, or
- it is the first stop of an unlocked country, or
- any taken exit targets it: `exits[src][key]` where `spec(src).exits[key].to === id` (or `'node:' + id`).

**Boss done:** `done[world + '-' + C.mainCount]`.

### 3.6 Country panel: drawing and reveals
This builds on `TourLandscape.grid` and the `layoutPanel` / `drawPanel` patch on `origin/sbw/graphics-pass-fixed`.

**Grid changes:**
- `grid(levels)` becomes `grid(stops)`, where `stops = C.levels.concat(C.houses || [])`.
- Every stop needs `mapCell` once a country has secrets. Defaults keep the snake for old countries.
- `from[k]` may be an array.

**Visibility:**
- A secret level or house is drawn only if `tour.revealed[id]`.
- A trail `a→b` is drawn only if both ends are visible.
- Solid if `tour.paths[a>b]`, otherwise dotted.
- Trails from secret stops are gold (`#ffd84a`) instead of path cream.

**Stop looks:**
- **Secret level:** a gold ring around the circle and a small star badge.
- **House:** a striped market-awning icon in the country colour `C.colors.a`, with a coin under it.
- **Boss:** the existing fort shape, with a per-country roof motif set by `map.fort`: `'hacienda' 'crater' 'stadium' 'seafort' 'riad' 'lonja' 'chateau' 'waag' 'grove' 'citadel' 'garden' 'summit' 'floe' 'door'`.
- **Exit pips:** small dots under the postcard marks, after the first clear.
- **Level type label:** comes from `arch`, e.g. `SKY`, `FREEFALL`, `TIDE`, `RACE`, `BOSS`, via `TourLandscape.ARCH_LABEL`. It replaces `STYLE`.

**Reveal queue:** `TourProgress.exit()` returns a list such as `[{ kind: 'path', cc, from, to }, { kind: 'stop', cc, id }, { kind: 'flight', to }, { kind: 'land', id }, { kind: 'house', id }]`. The map scene plays them in order when it opens:
1. Pan the panel to the country.
2. The trail grows as a dashed stroke from `a` to `b` over 1.0 s with a sparkle at its head (`ctx.setLineDash` plus an animated offset; draw the partial Bézier by sampling 24 points).
3. The stop pops in 0.45 s (scale 0 → 1.25 → 1, back-out ease) with 12 confetti sparks in the country colours.
4. A banner for 1.6 s: **SECRET LEVEL!**, **SHORTCUT!**, **SOUVENIR STAND!**, **NEW LAND!** or **SECRET FLIGHT!**.
5. Write `tour.paths` and `tour.revealed` when the step finishes, so an interrupted animation replays next time.

With reduced motion, each step is an instant 0.3 s fade.

**Brady on the panel:**
- A small code-drawn Brady (`05_brady.js` at 0.45 scale) stands on the current stop.
- Tapping another unlocked stop walks him along visible trails: BFS over trails, 160 px/s, a walk cycle, a dust puff at each stop.
- A second tap (or tapping while he stands on it) opens the level card.
- Walking is skippable: a tap during the walk jumps him there.

### 3.7 World map (overworld) improvements
- **Plane path:** the plane flies the curved leg (existing `flyTo`) with a dotted contrail that fades over 2 s. Legs between cleared countries are solid cream; the next leg is dashed.
- **Landmarks come back:** each country pin carries its landmark miniature (the `landmark` kinds in `TourLandscape`). Before the boss falls it is drawn at 40 % size inside the Baron's jar (glass outline). On the first map visit after the boss is beaten, the jar shatters (6 shards), the landmark grows to 100 % with sparkles (1.2 s), and a postal stamp lands on the country name. This is the story beat "the Baron shrank the landmarks".
- **The Baron's airship** bobs over the next uncleared country, and flies off to the next one (1.5 s) when that country falls.
- **Secret lands:**
  - Antarctica's pin appears with an ice-crack animation.
  - World 22's ghost pin flickers "22?" at 30 % alpha once Brady has found World 22's door in 5-2, even if the 22 postcards are missing. Tapping it shows "THIS DOOR WANTS 22 POSTCARDS (YOU HAVE n)".
- **Gold flight arcs** and **bottle currents** as in 3.3.
- **Clouds:** two layers of soft cloud shadows drift over the map (parallax 0.3 and 0.6). The country panel's sky colour follows `TourLandscape.looks`.

---

## 4. Enemy powers

### 4.1 Rules for every new behaviour
- **Tells:** every attack has a tell of at least 0.4 s, with a pose **and** a sound (`TourKit.sfx(name, fallback)`).
- **Weak moments:** every enemy has a clearly drawn weak moment.
- **Fairness:** no new behaviour can kill outright, push Brady into a pit, or steal a postcard.
- **Builder guard:** grabbers, pushers and tongues check that their destination is solid ground; pieces mark no-grab spans over pits with `st.B.noGrab(x0, x1)`.
- **Standard hit kinds still apply:** `stomp`, `spin`, `disc`, `laser`, `bump`, `star`, `prop`, `taco`, plus the new gear kinds `plane`, `kazoo`, `wand`, `globe`, `hatdash`.

**Where the code lives:** behaviours go into `src/28_tour_i_behave.js` as `TourBehave.<name>`. Each one is a `think(e, dt)` implementation plus optional `hit`, `draw` and `light` hooks. `TourEnemy.make({ behavior: '<name>', …params })` picks it up: `think()` dispatches to `TourBehave[this.behavior]` when the built-in switch has no case. Flyers use `TourFlyer.make({ behavior })` the same way.

**Modes passed to `art(ctx, e, x, y, mode, t)`:** the existing modes plus the ones named in each table row.

### 4.2 The behaviour library (30 entries)
| # | `behavior` | States → timings | Tell | Beat it | Params (defaults) |
|---|---|---|---|---|---|
| 1 | `splitter` | `walk` → on stomp: `burst` 0.15 s → spawns `n` children (type `child`) that hop twice and fade after `childLife` | the body bulges on the hit frame | stomp the children (each +10 coins) or avoid them; children are harmless for their first 0.3 s | `n:3, child:'<type>', childLife:4` |
| 2 | `regrower` | `walk` → stomp → `tiny` (h x0.5, harmless, speed x0.5) for `regrowT`; in the last 1.0 s flashes and wobbles → `regrow` 0.4 s → `walk` | the flashing in the last second | stomp again while tiny; any non-stomp hit defeats it at once | `regrowT:3` |
| 3 | `camouflage` | `hidden` (alpha 0.08, still) ↔ `show` 0.6 s every `revealEvery`; always shown inside any light radius (lamp, beam, glow) | a shimmering outline and a croak at `show` | stomp it while visible; touching it hidden still hurts; Kazoo forces `show` for 3 s | `revealEvery:2.2` |
| 4 | `burrower` | `under` (no collision; a soil bump moves toward Brady at 1.5 t/s, never leaves its floor segment) → when under Brady ±0.5 tile: `tell` 0.7 s → `pop` (hitbox rises 1.5 tiles, hurts) 1.2 s → `exposed` (stompable) 1.0 s → `dig` 0.4 s → `under` | the mound wiggles, dirt flicks up, a "tk-tk" sound | step off the mound during the tell; stomp during `exposed`; `hatdash` or `globe` pins it in `exposed` for 2 s | `speed:1.5, tell:0.7` |
| 5 | `trailLayer` | `walk`; every 0.5 tiles marks the floor under it as `trail` for `trailT` (adds `SURF` flag per tile: `slime` = ice-like, `coffee` = hurts 1 when stood on 0.3 s, `oil` = ice-like) | the trail glistens; coffee steams | stomp; jump over trails or wait for them to fade | `trail:'slime', trailT:4` |
| 6 | `saltSneezer` | `walk` → every `every`: `tell` 0.6 s (head tilts back, "ah-") → `sneeze`: a puff lands 3 tiles ahead and sets into a 2-tile salt platform (SEMI) for `platT` | the head tilt and sound | stomp; or use the salt platforms (never required on the main route; the validator ignores them) | `every:3, platT:5` |
| 7 | `inhaleBlast` | `idle` → Brady within 5 tiles: `tell` 0.5 s (cheeks puff) → `inhale` 1.2 s (pulls Brady at 6 t/s² toward it; tiles block the pull) → `blast` 0.4 s (fires a stink cloud shot, 4 t/s, life 1.2 s) → `gasp` 1.0 s (vulnerable) | cheeks and a whistling inhale | walk against the pull; stomp it while it gasps; smoke puffs and lasers cancel `inhale` | `range:5, pull:6` |
| 8 | `ceilingDrop` | `hang` (on the ceiling or a branch) → Brady within ±1 tile horizontally and ≤6 rows below: `tell` 0.4 s (shake, dust) → `drop` (gravity) → `stuck` 1.5 s (stompable) → `climb` back at 1 t/s if a ceiling is above, else `walk` | the shake and dust | step back during the tell; stomp it while stuck | `tell:0.4, stuckT:1.5` (sloth: `stuckT:2.5`) |
| 9 | `wallCrawl` | `crawl` around the perimeter of solid tiles (floor → wall → ceiling) at `speed`; on the ceiling over Brady it behaves like `ceilingDrop` | a chirp before dropping | stomp it on the floor; `bump` the ceiling tile under it to knock it down | `speed:1.4` |
| 10 | `inflater` | `swim`/`walk` → Brady within 3 tiles: `puff` 0.8 s → `big` (2x, spiky sides, **top is a bounce surface**) for 3 s → `deflate` 0.5 s | it swells with a squeak | bounce on its top (a bounce, not damage); smoke puffs and lasers pop it | `range:3, bigT:3` |
| 11 | `pouncer` | `crouch` (hidden in grass, ears showing) → Brady within 6 tiles: `tell` 1.0 s (eyes glow, tail wiggles) → `pounce` (an arc toward where Brady was at the start of the tell + 0.5 tile lead, top speed 9 t/s) → `land` stuck 0.8 s → cooldown 2 s | eyes and tail | sidestep, then stomp it while it's stuck | `range:6, tell:1.0` |
| 12 | `itemThief` | `approach` → contact: instead of hurting, `steal` 0.4 s (steals in order: HANDS gear → signature item → FORM 2→1) → `flee` at 1.6x speed, laughing, for up to 8 s → `leave` (the item is lost; the next item block gives a replacement) | arms out, a grabby 0.4 s pose before contact | dodge the grab; any hit while it flees pops the item back out (floating pickup, 3 s) | `flee:8` |
| 13 | `timeSlow` | `idle` → every `every`: `flip` tell 0.6 s (sand starts falling) → `field` 2 s: Brady and enemies within 4 tiles move at 50 % | sand stream and a ticking sound | stomp it outside the field; the Pocket Sundial cancels it | `every:5, r:4` |
| 14 | `curlShield` | `walk` → Brady airborne within 3 tiles above: `curl` 0.15 s → `ball` (stomp bounces Brady, `'bounce'`) until it lands or 1.5 s → `uncurl` 0.6 s (vulnerable) | the hunch | stomp it during `uncurl`; fire, tomatoes and kicked props from behind hit it any time | `curlT:1.5` |
| 15 | `mimic` | `disguise` as a **scenery object** of its country (a soy-sauce bottle, a stone lantern, a straw sandal), **never** an item, block, coin or postcard → Brady within 2 tiles: `reveal` 0.3 s (pop, laugh) → `chase` (hop) 4 s → `disguise` again where it stands | its tell is drawn into the disguise: a leaf on the head that twitches every 1.5 s, and a tail tip | stomp it while revealed; Kazoo or LSD lasers force a reveal from range | `range:2, chaseT:4` |
| 16 | `grabber` (flyer) | `patrol` → Brady below within 6 tiles and the ground under the carry path is solid: `tell` 0.5 s (legs dangle, a cry) → `swoop` → `carry` (lifts Brady 3 rows and 4 tiles back over 1.2 s; jump 3 times to break free early) → `drop` (no damage) → `rest` 2 s | the dangling legs and the cry | stomp it in `rest`; smoke puffs, plane or Kazoo knock it out | `carry:4, tell:0.5` |
| 17 | `echo` | records Brady's positions; draws a translucent copy that follows exactly `lag` seconds behind; touching it hurts | always visible; pulses when it is about to overlap Brady | keep moving; it disperses for 3 s when hit by lasers, puffs or Kazoo; it can't be stomped (it stomps back) | `lag:1.5` |
| 18 | `stacker` | a group of 3 `walk` → notice: `stack` 0.6 s into a tower → `topple` toward Brady (falls across a 3-tile arc) → each unit `stun` 1 s | the stacking animation and a wobble | step out of the arc; stomp the stunned units | `n:3` |
| 19 | `boomerang` | `idle` → every 2.4 s: `throw` (tell 0.5 s): a projectile curves out 5 tiles and back, and **its top is a moving platform** | the wind-up spin | stomp the thrower between throws; ride the projectile | `out:5, every:2.4` |
| 20 | `swarm` | a leader plus `n` followers in snake formation (follow lag 0.18 s); followers are 1-hit; defeating the leader scatters the rest (they fly off) | the formation is visible from afar | hit the leader | `n:5` |
| 21 | `platEater` | walks on SEMI or rug tiles; every 1.2 s eats the tile behind it (it becomes EMPTY for 6 s, then regrows with a sprout animation) | munching; the tile shrinks first | stomp it; never required: the builder places eaters only where an alternative route exists, and the validator treats eaten tiles as present | `every:1.2, regrow:6` |
| 22 | `alarmCaller` | `idle` → Brady inside a 5-tile cone: `tell` 0.5 s (inhale) → `call`: wakes every `sleeper` within 12 tiles, which face Brady | the inhale | stomp it during the tell; the Cardboard Box hides you | `cone:5, wake:12` |
| 23 | `frostBreath` | `walk` → Brady within 4 tiles: `tell` 0.7 s (cheeks turn blue) → `breathe` 1.0 s, a 3-tile cone: floor tiles become ICE for 5 s; enemies caught become **ice blocks** (TourProp, kickable, standable) for 5 s; Brady caught is **frozen in place 0.8 s** (no damage) → `pant` 1.0 s (vulnerable) | blue cheeks and a hiss | stomp it while it pants; use the ice blocks | `cone:3` |
| 24 | `lightFrozen` | moves only in darkness; inside any light radius → `statue` (harmless, can be stood on) | it visibly freezes and its colour greys out | keep it lit; stomp it in the dark | `speed:2.2` |
| 25 | `inkBlot` | Brady within 4 tiles: `tell` 0.5 s → `squirt`: an ink blot covers 30 % of the view around the impact for 2.0 s (cosmetic, fades; reduced motion: a static blot) → `retreat` | the body tenses | stomp | `range:4` |
| 26 | `tongue` | `idle` → `tell` 0.5 s (eye swivel) → `lash` 3 tiles straight: eats any pickup it touches; hitting Brady pulls him 1 tile and steals 5 coins (no damage) | the eye swivel | stomp; duck under the lash | `len:3` |
| 27 | `pusher` | pushes a ball prop (`TourBall`) toward Brady; the ball grows +10 % per tile pushed up to 2x | the ball rolls first | stomp the pusher, then kick the ball: a heavy projectile that breaks walls tagged `breakwall needs:'ball'` | `maxScale:2` |
| 28 | `sleeper` | `sleep` (Zzz) until a noise within `hear` tiles (running, a landing from 3+ rows, Kazoo) or an alarm → `wake` 0.8 s stretch → base behaviour | the Zzz bubble pops | sneak (walk, don't run); stomp it asleep for double coins | `hear:4, base:'walk'` |
| 29 | `blinker` | `visible` 2 s → `fade` 0.4 s → `gone` 0.8 s (a glowing spot shows where it will reappear, 0.5 s before) → `appear` 3-5 tiles closer to Brady | the glowing spot | stomp it as it appears; lasers hit it during `fade` | `jump:[3, 5]` |
| 30 | `hoverDart` | `hover` → Brady in line of sight within 7 tiles: `aim` 0.6 s (beak glint, a line flicker) → `dart` straight at 8 t/s for 0.6 s → `recover` 1.0 s (hovering low, stompable) | glint and flicker | sidestep, then stomp it while it recovers | `range:7` |

### 4.3 Per-country assignments
"Headline" is the country's signature enemy power: introduced in its own beat, with a sign the first time. **Bold** marks the headline.

| Country | Enemy (spawn type) | Behaviour + params | Where | Look (original, food/animal/object) |
|---|---|---|---|---|
| mx | **mxAxolotl** | `regrower {regrowT:3}` in water and canals (swimmer variant: `TourSwimmer` with the same state machine) | 1-2, 1-3 | pink axolotl with frilly gills; the tiny form is a baby axolotl |
| mx | mxElote | `splitter {n:3, child:'mxPopcorn', childLife:3}` | 1-1 | corn cob on legs, pops into popcorn puffs |
| mx | mxBlindFish | swimmer: `pouncer` variant that only notices Brady while he dashes (Fins) or swims fast | 1-3 | pale cave fish without eyes |
| mx | mxSwallow | `swarm {n:6}` flyer, harmless to touch, pushes Brady 1 tile sideways | 1-6 | swallow flock |
| ec | **ecIguana** | `saltSneezer {every:3}` | 2-3 | black marine iguana, white salt crust on its head |
| ec | ecGlassFrog | `camouflage {revealEvery:2.4}` | 2-2 | see-through green frog; its little red heart always shows faintly |
| ec | ecHummingbird | `hoverDart {range:7}` flyer | 2-1, 2-4, 2-7 | iridescent hummingbird |
| ec | ecDipper | `ceilingDrop` variant from the water surface | 2-7 | small brown river bird |
| br | **brSloth** | `ceilingDrop {tell:0.6, stuckT:2.5}`, climbs back at 0.6 t/s (comically slow) | 3-2, 3-3 | three-toed sloth with a smug smile |
| br | brBrigadeiro | `stacker {n:3}` | 3-1, 3-5 | chocolate truffle balls with sprinkles |
| br | brPiranha | `swarm {n:4}` swimmer | 3-2, 3-4 | red-bellied piranha |
| br | brSwift | `hoverDart` that starts hidden behind the water curtain | 3-3, 3-6 | sooty swift |
| mz | **mzDungBeetle** | `pusher {maxScale:2}` | 4-1 | shiny green beetle with a dung ball (PG: a "mud ball") |
| mz | mzPangolin | `curlShield {curlT:1.5}` | 4-2 | scaly pangolin |
| mz | mzChameleon | `tongue {len:3}` | 4-3 | chameleon; its colour cycles slowly |
| mz | mzGhostCrab | `lightFrozen {speed:2.2}` (replaces its old walk) | 4-2, 4-4, 4-6 | pale ghost crab with stalk eyes |
| mz | mzMoleRat | `burrower {speed:1.2}` | 4-6 | mole-rat |
| ma | **maMoth** | `platEater {every:1.2, regrow:6}` (also eats carpets in 5-6) | 5-1, 5-6 | fluffy rug moth with patterned wings |
| ma | maSnail | `trailLayer {trail:'slime', trailT:4}` | 5-3 | big snail with a striped shell |
| ma | maCat | `sleeper {base:'pouncer'}`: sleeps by day, pounces at night (it follows `phase`) | 5-3 | street cat |
| ma | maOwl (mini-boss) | Boss brain (§6.4) | 5-4 | brass automaton owl |
| es | **esStork** | `grabber {carry:4}` flyer | 6-1, 6-7 | white stork with a red beak |
| es | esPulpo | `inkBlot {range:4}` | 6-2 | octopus on a wooden plate, paprika speckles |
| es | esLizard / esLynx | `pouncer {range:6}` (lizard in 6-4, lynx in 6-7) | 6-4, 6-7 | Canarian giant lizard; Iberian lynx |
| fr | **frCoq** | `alarmCaller {cone:5, wake:12}`; frBoar uses `sleeper {base:'charge'}` | 7-2 | rooster with a big red comb |
| fr | frPoele (**replaces frMime**) | `boomerang {out:5}`: throws a crêpe that curves back; the crêpe is a ride-able platform | 7-1, 7-5 | walking cast-iron crêpe pan with two little legs |
| fr | frMagpie | `itemThief`, used as the THIEF level's thief (`TourThief`, §6) | 7-2 | black-and-white magpie |
| fr | frMole | `burrower` | 7-4 | mole with tiny spectacles |
| fr | frOyster | `still` + snap: opens 1.2 s, shuts 0.6 s (hurts if Brady is inside the shell) | 7-3 | oyster |
| nl | **nlBulb** | `burrower {speed:1.5}`; pops up as a tulip bloom | 8-1, 8-2 | tulip bulb with a sprout |
| nl | nlClog | pair: two clogs hop in step; stomp one and the other doubles its speed for 3 s | 8-1, 8-2 | wooden clogs |
| nl | nlGull | flyer, `itemThief` limited to coins (steals 5) | 8-3, 8-6 | herring gull |
| id | **idMacaque** | `itemThief {flee:8}` | 9-5, 9-6 | long-tailed macaque wearing stolen sunglasses |
| id | idGecko | `wallCrawl {speed:1.4}` | 9-3, 9-6, 9-7 | tokay gecko, blue with orange spots |
| id | idRafflesia | `inhaleBlast {range:5}` | 9-6 | giant red flower |
| id | idAngler | `still` with a lure: a fake coin glints; it bites when Brady is within 1 tile (tell 0.4 s) | 9-4 | anglerfish |
| vn | **vnNon** | flyer `boomerang {out:5, every:2.4}`: the flying conical hat *is* the projectile and returns to its perch | 10-1 | a conical straw hat with little wings (an object, not a person) |
| vn | vnSilkworm | `ceilingDrop` on a silk thread: yo-yos down and up (2 s cycle) | 10-3 | silkworm |
| vn | vnPhinDrip | `trailLayer {trail:'coffee', trailT:3}` | 10-5 lead-in | a little drip-coffee filter on legs |
| jp | **jpTanuki** | `mimic {range:2, chaseT:4}`; disguises: soy-sauce bottle (11-1), stone lantern (11-3), straw sandal (11-6) | 11-1, 11-3, 11-6 | round raccoon-dog with a leaf on its head (folklore); no tail suit, no item disguise |
| jp | jpChochin | `blinker {jump:[3, 5]}` | 11-3 | a folklore paper-lantern spirit with one eye and a tongue (folklore object-spirit, original design) |
| jp | jpUmbrella | existing hop (folklore one-legged umbrella), nights only | 11-3, 11-5 | as now |
| np | **npYeti** | `frostBreath {cone:3}` (replaces its throw) | 12-2, 12-3 | big friendly-silly yeti with a scarf |
| np | npMarmot | `sleeper` + `alarmCaller` (a whistle wakes yetis) | 12-2, 12-3 | Himalayan marmot |
| np | npSnowball | roll that grows (`TourBall` rolling by itself) | 12-2, 12-4 | snowball with eyes |
| aq | **aqPenguin** | `swarm {n:5}` belly-sliders in a conga line; the leader wears a tiny scarf | 13-1, 13-5 | Adélie penguins |
| aq | aqSkua | flyer `itemThief` limited to coins and the CARRY egg (a hit returns it) | 13-1, 13-2, 13-5 | brown skua |
| aq | aqKrill | `swarm {n:8}` that forms shapes | 13-2 | pink krill cloud |
| w22 | **w22Echo** | `echo {lag:1.5}` | 22-1, 22-4 lead-in | Brady's translucent silhouette in lilac |
| w22 | w22Hourglass | `timeSlow {every:5, r:4}` | 22-2 | walking hourglass |
| w22 | w22Envelope | flutters as loose mail; on contact sticks to Brady (jump height x0.8 for 3 s), no damage | 22-2, 22-5 | an airmail envelope with a red-and-blue border |

### 4.4 Mini-bosses (FORT levels, `mid: true`, 3 hp, 2 phases)
- **Brass Owl (5-4):**
  - Every 4 s it turns its head 180° (a tell: gears clank 0.6 s). While it looks away, pulling the chain lever (`lever` object) drops a tagine lid on it: a `hazard` hit.
  - If it sees Brady pulling the chain, it screeches and blows a feather volley (3 feathers, arcs).
  - Phase 2: it flies a lap of the room and stops under a different lid each time.
  - Finish: its head spins and it falls apart into teaspoons.
- **Tin Yak (12-7):**
  - Charges in a straight line (tell: paws the floor 0.8 s, steam). When it hits a crate wall it gets stuck and dented for 1.5 s; stomp it then.
  - Phase 2: it charges twice in a row and the crate walls are on conveyors.
  - Finish: it rattles to a stop and a little chime plays.
- **Snow-Plough Bot (13-3):**
  - Pushes a growing snow wall across the floor (jump it at 2 rows; at 3 rows a ledge is provided).
  - After 3 pushes it overheats (steam, red exhaust 1.5 s): stomp the exhaust hatch.
  - Phase 2: walls from both sides.
  - Finish: it melts the snow into a puddle and sits in it.

---

## 5. Power-ups

### 5.1 The ten new core items
Ids are used as item-block contents (`st.block(tx, ty, 'fins')`), gear-stand items (`['gearStand', { item: 'fins' }]`), shop stock and `p.hands.id`. All of them are registered with `TourGear.register({...})` in `28_tour_c_powers.js`, using the same fields as `TourPowers` (`icon`, `onCollect`, `action`, `update`, `drawOn`) plus `slot: 'hands' | 'buff'` and `lose: 'drop' | 'consume' | 'timer'`.

| id | Name | Slot | Mechanic (exact) | How it ends | HUD icon / original look |
|---|---|---|---|---|---|
| `plane` | **Paper Plane** (Chinka's postcard, folded) | hands | **Glide:** hold jump while falling and the fall speed is capped at 1.6 t/s; horizontal air speed x1.15; no upward lift ever (it is not flight). **Action:** throws the plane straight ahead at 9 t/s, range 8 tiles; it hits enemies (`plane`: knock-out), levers, bells, mirror panels and receptors at range, then boomerangs back to Brady's hand in 1.2 s (gliding is unavailable until it returns). | Hit: it flutters off (drops, recollectable for 2 s) | A cream paper plane with Chinka's red-heart stamp and a dashed fold line. |
| `hat` | **Hard Hat** (miner's helmet) | hands | Headlamp: a light radius of 150 px in dark areas (also freezes `lightFrozen` enemies in a 3-tile beam ahead). Headbutt breaks BRICK and `breakwall needs:'hat'` from below. **Action:** shoulder dash 0.35 s at 11 t/s; breaks `breakwall` sideways, digs SOIL sideways (2 tiles), and knocks out walkers (`hatdash`). Absorbs one hit. | It absorbs the first hit, then is lost; Brady keeps his size | A yellow helmet with a round lamp and a little map sticker. |
| `pads` | **Crawl Pads** (knee pads) | hands | **Hold down and walk:** crawl at 0.8x walk with a 1-tile-high hitbox through 1-tile-high tunnels (`crawlway` tiles: a low ceiling of SEMI-like "lintel" art the validator treats as a tunnel). Crawling under spinning hazards (sweepers, banners) is safe. **Action** while crawling: a short roll (0.3 s, 7 t/s). No size change, no other ability. | Hit: dropped | Purple knee pads with white stars and velcro straps. |
| `magnet` | **Magnet Belt** | buff 30 s | Pulls coins and loose pickups (not postcards) within 5 tiles toward Brady at 12 t/s; pulls metal props (cans, tin bots' bolts); turns `magnetSwitch` objects when Brady stands within 2 tiles. | Timer (2 s warning flicker) | A red-and-silver belt buckle in a horseshoe shape. |
| `fins` | **Flipper Fins** | hands | In water: swim speed x1.6, no stroke cooldown; **Action** = dash 0.35 s at 10 t/s (breaks `coral` and `crust` tiles, knocks out swimmers). On land: a 10 % slower floppy walk with a comic flap sound. | Hit: dropped (floats up in water) | Lime-green fins with snorkel goggles on top. |
| `box` | **Cardboard Box** | hands | **Hold down:** Brady ducks into the box: watchers, searchlights, alarm callers and `pouncer`s ignore him; he can shuffle at 0.4x walk while hidden. Jump pops him out. Sleeping enemies don't wake while he's in the box. | Hit: the box is squashed and lost | A brown box with "FRAGILE ♥" doodled in marker and eye holes. |
| `kazoo` | **Kazoo** | hands | **Action:** a honk cone 3 tiles ahead (cooldown 0.5 s): stuns enemies 2 s (light ones flip over), shatters `glass` tiles, rings `bell` objects at range (bell gates, gongs, wind chimes), reveals `camouflage` and `mimic` enemies for 3 s. Wakes `sleeper`s within 6 tiles (a trade-off in SNEAK). | Hit: dropped | A little red-and-yellow kazoo with three sound squiggles. |
| `wand` | **Bubble Wand** | hands | **Action:** blows a soap bubble (max 3 alive) that drifts forward at 1.5 t/s and up at 0.3 t/s for 4 s. Touching an enemy traps it: the bubble floats with the enemy inside for 4 s and its **top is a SEMI platform**; then it pops and the enemy drops stunned for 1 s. An empty bubble is a fragile platform that pops 0.6 s after Brady lands on it. | Hit: dropped | A twisted-wire wand with a rainbow soap film. |
| `sundial` | **Pocket Sundial** | buff 8 s | Enemies, projectiles, moving platforms, autoscroll, chasers, rising liquids and timed doors run at 50 % (boss arenas: 75 %). Brady moves normally. A sepia vignette at the screen edge (reduced motion: no pulse). | Timer (warning ticks in the last 2 s) | A brass sundial watch on a chain. |
| `globe` | **Snow Globe** | hands, 5 shakes | **Action:** shake it, and snow falls in a 5-tile radius for 2.5 s. Enemies inside slow to 30 % and lose `spiky` and `fiery` for 6 s (snow caps them, so they can be stomped). Hot rocks, fire vents, coffee trails and steam cool for 6 s. Burning hedges go out. **It never freezes water and never makes walkable ice.** | After 5 shakes (dots on the HUD icon), or a hit drops it | A glass snow globe holding a tiny Brady-O world, with a wooden base. |

### 5.2 Brady's power slots and how they stack
| Slot | Holds | Rules |
|---|---|---|
| **FORM** (`p.power`) | 0 small, 1 big (magic mushroom), 2 joint (smoke puffs) | Unchanged. |
| **HANDS** (`p.hands = { id, uses }`) | one item: any gear above **or** the country's signature item (`p.sig` becomes a HANDS item) | Picking up a new HANDS item while holding one sends the old one to the **Backpack** (the existing `p.pack`). If the Backpack is full, the old item drops as a floating pickup for 4 s. Tapping the HUD Backpack swaps HANDS ↔ Backpack (the existing `usePack`, extended to swap). Signature items that last the whole level (`time: 0`) behave as gear. |
| **BUFFS** (`p.buffs = { star, lsd, sundial, magnet }`) | timers that run at the same time | The star and LSD keep their rules. The sundial and magnet stack with everything. |

**When Brady is hit (in order):**
1. A star blocks the hit.
2. Otherwise a Hard Hat in HANDS absorbs it and is lost.
3. Otherwise the HANDS item drops (it floats in place for 2 s and can be re-grabbed; the Snow Globe keeps its remaining shakes).
4. Otherwise FORM drops (2→1→0→death).

The Backpack is never lost to a hit.

**THROW / Action priority:** LSD rainbow lasers (while flying), then the HANDS action, then joint smoke puffs.

**Interactions:**
- LSD flight disables plane gliding (it isn't needed) but keeps the plane.
- Crawl Pads work small or big: crawling always uses the 1-tile crouch hitbox.
- The magic mushroom while in a crawlway pops Brady out at the tunnel exit, never inside.
- Signature items keep their own `action`, run through the HANDS slot.
- The Penguin Slide (aq) and Dutch Bike (nl) are HANDS items too.

### 5.3 Placement budget (enforced by `tools/validate_levels.js`)
Per level, counted over all areas:
1. **At least 2 power-up opportunities.** An opportunity is an item block, a hidden block with an item, a gear stand, a friend who gives an item, or a shop. Swim and climb levels count blocks set into rock niches or on band floors.
2. **At most 5 item blocks** in the main area. Bonus and secret rooms are not counted.
3. **The first opportunity lies within the first 25 % of the main area**: by x for horizontal gens, by height for climbs, by depth for shafts.
4. **The archetype's gear comes from a `gearStand` (an infinite dispenser) placed before the twist beat** whenever the level's mechanic needs it:

   | Gear | Archetypes |
   |---|---|
   | `fins` | DIVE, TIDE, RISE flood |
   | `hat` | DIG, LAMP |
   | `box` | SNEAK |
   | `plane` | GLIDE, FALL (SKY optional) |
   | `kazoo` | BEAT |

   A gear needed to reach an exit, a postcard or a secret must come from a stand (that's what makes the validator's `gear:` keys sound).
5. **One premium item** (L, S, sundial, 1UP or magnet) **sits in a secret or risky spot**.
6. **Boss levels:** two opportunities in the lead-in before the arena door, plus whatever the boss brief supplies inside the arena.
7. **Secret levels** may break rule 2 (up to 7 blocks): they're the reward.

---

## 6. Object library and validator v2

### 6.1 Validator v2 primitives (new `AreaBuilder` methods, in `src/08_levels.js`)
Every object below is validated by expressing it in one of these primitives. Builders call them, and the validator reads them from `area.*`.

| Primitive | Builder call | Stored as | Validator meaning |
|---|---|---|---|
| ghost surface (existing) | `B.ghosts.push([x, y])` | `area.ghosts` | the tile counts as SEMI (a moving platform passes there) |
| spring (existing) | `B.springs.push([x, y])` | `area.springs` | spring jump (8 tiles) |
| zone (existing) | `B.zone(...)` | `area.zones` | simulated force; `kind: 'flip'` inverts gravity inside |
| lock + key (existing) | `B.lock(tx, ty0, ty1, id, look)`, spawn `key` | `area.locks` | tiles open once key `id` is held |
| **virtual key** | `B.vkey(id, tiles, mode)`, `mode: 'any' | 'all'` | `area.vkeys = [{id, tiles, mode}]` | the search is "holding" `id` once a standing node's body overlaps any one (or all) of `tiles`; locks with that id open in the next pass. Used by levers, plates, mirror chains, lantern lighting, gear stands (`gear:<id>`), thief catches (`stamp1..3`), carry delivery. |
| **one-way edge** | `B.edge([fx, fy], [tx, ty], toArea?)` | `area.edges` | when a node overlaps `from`, push the node `to` (same or another area) |
| **toggle group** | `B.toggle(g, tilesA, tilesB, { auto, kind })` and `B.switchAt(g, tx, ty)` | `area.toggles[g] = {A, B, auto, kind, switches}` | the search state carries a bitmask (max 3 groups). At a node overlapping a switch, push the same node with bit `g` flipped. `auto: true` groups (tide, timed phase, wind cycles) may flip at any node. Proxy tiles are built per bitmask (≤ 8 proxies, cached). Bit=0: A tiles solid, B empty; bit=1: the reverse. Tide groups instead swap the area's `waterLine` between `tide.low` and `tide.high`. |
| **light-only tile** | `B.setHide(x, y, 3)` | `area.hide` | counts as present (the light is always obtainable) |
| **soil** | `B.set(x, y, T.SOIL)` | tiles | standable; plus an implicit edge from a node standing on soil to the node 1 row lower (dig down); sideways digging needs vkey `gear:hat` |
| **crawlway** | `B.set(x, y, T.LINTEL)` (a new tile: solid from below and the sides, drawn as a low beam) | tiles | rows under a lintel with 1 free row are passable only with vkey `gear:pads`; the validator adds edges along the tunnel when it holds that key |
| **route** | `B.route.push([x, y])` | `area.route` | used by `TourThief` and `TourRival` (not by the validator) |
| **pace** | set on the area spec (`chase`, `autoscroll`, `autoscrollY`, `risingLava`, `risingWater`, timed doors) | `area.pace` | after the search: the BFS shortest path in tiles from start to each exit; time = dist / (6.2 t/s x 0.8). Must beat the hazard with a 25 % margin (chaser front at `speed` from x=0; rise front from the bottom row). Autoscroll areas additionally require a path with no step back of more than 3 tiles (the search is rerun with leftward moves capped). |
| **carry physics** | area spec `carry: { jumpMul: 0.92 }` | `area.carry` | the search from start to the delivery pedestal runs with `PHYS.jumpV x jumpMul`; postcard reachability uses normal physics |
| **flip standing** | zone `kind: 'flip'` | | inside a flip zone, `standable()` checks the tile *above* Brady as the floor and the two below as free; `simulate()` passes `gravitySign` to `playerPhysics` |

**Coverage checks** (all must pass):
1. Every exit in `spec.exits` is reached (`res.exits.main`, `res.exits.secret`).
2. All 3 postcards are reached.
3. Every area is reached from the start.
4. The secret-room rule: at least one area flagged `secret: true`, or a FAKE/HIDDEN-gated pocket holding P2.
5. The budget rules of §5.3.
6. The archetype rules of §0.

Search guard: raised from 20000 to 80000 nodes per pass; up to 8 passes (keys).

### 6.2 The object library (25 objects)
New entity types live in `src/28_tour_h_objects.js` and are registered in `ENTITY_TYPES`. Each has a builder piece of the same name in `Tour.pieces` (signature `(st, opts) => newX`) that places it and writes its validator primitive. A `skin` option picks a country look (`skin: 'mxLeverPost'`); the skin's art is registered with `Tour.country({ skins: { mxLeverPost(ctx, e, t) {} } })`.

| # | Object (entity type) | Piece & key options | Behaviour | Validator encoding |
|---|---|---|---|---|
| 1 | `key` / `lock` (existing) | `['keyLock', { id, keyAt, lockAt, h }]` | Brady carries the key; touching the lock opens it | locks + key (existing) |
| 2 | `lever` | `['lever', { opens: 'id', look }]` | pull by touching + Action, or hit it with a plane, tomato or ball; opens lock `id` for good | `vkey(id, [leverTile])` |
| 3 | `toggleSwitch` (valve, wind brake, sun-moon lantern, wind chime, clock) | `['toggle', { g, A: [[x0,y0,x1,y1]], B: [...], kind: 'valve'|'wind'|'phase' }]` | flips group `g`: the A objects vanish and the B objects appear (drawn as the country's objects, e.g. a sluice gate raised/lowered, sails turning/stopped); `phase` also swaps the area theme | `toggle(g, A, B)` + `switchAt` |
| 4 | `plate` + `crate` | `['plate', { opens: 'id', crateDx: -6 }]` | the plate holds lock `id` open while the crate (TourProp, pushable) or a carried item sits on it | the builder asserts the crate's floor run to the plate is pit-free and flat; `vkey(id, [crate push spot])` |
| 5 | `timedDoor` | `['timedDoor', { lever: dx, door: dx, t: 6 }]` | a lever opens a shutter for `t` seconds (a ticking clock) | `vkey` + pace check: lever→door distance / (6.2 x 0.7) < t |
| 6 | `zipLine` | `['zip', { dx: 14, dy: 4 }]` | grab the handle (jump into it) and ride it down the cable at 9 t/s; jump to let go | `edge(start, end)` |
| 7 | `catapult` (skins: tomato catapult, coconut cannon, tree swing, orangutan) | `['catapult', { to: [dx, dy] }]` | stand in the cup + Action (or stomp it): launches on a computed parabola to the target | `edge(cup, landing)` |
| 8 | `seesaw` | `['seesaw', { len: 6 }]` | a plank on a pivot; landing on the high end throws whatever sits on the low end (props, enemies, or Brady at spring strength) | both rest positions as ghosts; spring at each end |
| 9 | `wheel` (Ferris wheel, sushi plate wheel, windmill sails) | `['wheel', { r: 4, arms: 4, speed: 0.6 }]` | platforms on rotating arms (generalises the existing `windmill` and `wheel` pieces) | ghosts on the circle at 8 sample angles |
| 10 | `teleport` pair (mirror doors, lamp pairs) | `['teleport', { pair: 'a' }]` twice | enter one, appear at the other (same-area portal, existing blink) | portal (followed by the validator) |
| 11 | `fan` (air-con, fumarole, burner) | `['fan', { w: 2, h: 7, force: 30, g: null }]` | an updraft zone; with `g` set it belongs to a toggle group (on in one state) | zone; if toggled, the zone is attached to state bit `g` |
| 12 | `balloon` (carrier) | `['balloon', { rise: 8, drift: 2 }]` | stand in the basket: it rises 0.8 t/s to `rise` rows, drifting `drift` tiles; it sinks back when empty | ghost column along its path |
| 13 | `breakWall` | `['breakwall', { needs: 'hat'|'big'|'fire'|'ball'|'kazoo'|'tomato', h: 3 }]` | a wall of the country's material (foil, rubble, thorn hedge, glass, crate stack) broken by the given ability | `lock(id = 'gear:hat'` / `'big'` / `'sig'` / `'ball'` / `'kazoo')`. The matching vkey is granted at the gear stand, a mushroom block (`big`), a signature-item giver (`sig`), a pusher's ball spawn (`ball`). Main routes never use `big` (it can be lost). |
| 14 | `mirror` + `sunReceptor` (light beam) | `['mirrors', { mirrors: [[dx, dy], ...], receptor: [dx, dy], opens: 'id' }]` | a beam from a fixed source; bumping a mirror (or hitting it with the plane) rotates it 45°; when the beam reaches the receptor, lock `id` opens. The builder solves the target angles at build time and asserts a solution exists. | `vkey(id, mirrorTiles, 'all')` |
| 15 | `valve` (water level) | `['valve', { g, low: 16, high: 10 }]` | turns the canal level between two rows (a toggle group with `kind: 'water'`) | toggle group (water line swap) |
| 16 | `ring` (hook ring, vine, lantern hook) | `['ring', { len: 3 }]` | jump into it to hang; it swings (pendulum, 1.6 s period); jump to release with the swing's momentum. Also the noodle-lasso target. | ghost tiles: the ring tile + the tiles 1 row below it at both swing extremes |
| 17 | surfaces: conveyor, ice, sticky, bounce, crumble (existing tiles and `SURF`) | `['belt', { dir: 1, n: 8 }]`, `['iceRun', { n }]`, `['honey', { n }]`, `['bouncePad']`, `['crumbleRow']` | the real physics | the validator simulates the real physics (existing) |
| 18 | `tide` (area system) | area spec `tide: { low, high, period, hold }` | the water line moves between rows; Brady swims below it | auto toggle group |
| 19 | `pedestal` + `carryItem` | `['pedestal', { item: 'hatchling', start: true }]`, `['pedestal', { deliver: true }]` | the CARRY archetype (§1) | carry physics; vkey `deliver` at the delivery pedestal; the gate is a lock `deliver` |
| 20 | `railSwitch` | `['fork', { len: 40, upper: [...steps], lower: [...steps] }]` | a lever post switches the track; the vehicle follows the chosen deck | both decks as ghosts (both explored) |
| 21 | `lantern` (relight / brazier) | `['lantern', { kind: 'relight' }]` | restores the LAMP radius; `kind: 'phase'` is a phase switch | none (relight), or toggle (`phase`) |
| 22 | `flipLine` | `['flipline', { w: 20 }]` | a painted line and a band: gravity inverts inside | zone `kind: 'flip'` |
| 23 | `trapdoor` | `['trapdoor', { to: 'area@anchor' }]` | a hatch in the floor: stomp it (or the crate on it) to drop into a sub-area | portal / edge to the anchor |
| 24 | `fakeWall` / `curtain` (waterfall, willow, poster, cupboard) | `['secretDoor', { to: 'area', look: 'curtain'|'fake'|'painted' }]` | walk through it into a secret area; looks like scenery; has its in-level tell (§3.1) | FAKE tiles (empty) + portal |
| 25 | `gearStand` | `['gearStand', { item: 'fins' }]` | a stall hook with the item hanging on it; taking it re-hangs a fresh one after 1 s (infinite) | `vkey('gear:' + item, [standTile])` |

**Level-flow entities** (not reusable objects, but registered the same way):

| Entity | Behaviour | Validator |
|---|---|---|
| `TourDoom` | the DOOM front | pace |
| `HoldArena` | locks the screen, runs waves | none (the walls open; the arena tiles are validated open) |
| `TourThief` | the THIEF route runner | its three catch points are vkeys `stamp1..3`; the gate lock needs `stamp3` |
| `TourRival` | the RACE rival | none |
| `Watcher` | SNEAK searchlights and guards | none (detection is not lethal) |
| `TourBall` | the ROLL / pusher ball | a ball-only wall uses vkey `ball` at the ball's spawn |
| `bottle` | Bottle Mail pickup | none |
| `souvenirShop` | the counter in a stand room | none |

### 6.3 The 22 unused engine gimmicks, re-themed (`look` / `skin` per country; validator class)
| Gimmick | Re-themed as | Validator |
|---|---|---|
| Geyser | Mexico fountain jet, Ecuador vent grate, Antarctica heater | platform-on-top: ghosts at the top rows |
| Pancake | tortilla flipper (6-2), crêpe griddle (7-1 café) | ghost + spring |
| Bubbler | mud-pot bubbles (2-7), the cenote air pocket (1-3), aquarium (6-6) | ghost column |
| Roller | rolling melons (1-1), cheese wheels (8-5), snowballs (12-2), olives (6-2) | hazard |
| Barrel | Fallas firework crate (6-5), sulfur cask (9-7) | hazard (breakable) |
| Laser | the Baron's shrink-ray tripwire (12-5, 12-7), neon beam (11-4) | hazard |
| Sweeper | auction-clock hand (8-2), the great clock pendulum arm (22-1) | hazard (crawlable under with pads) |
| Subwoofer | samba speaker stack (3-1): it pushes on the beat | zone |
| Horn | scooter horn blast (10-1): a gust cone | zone |
| PoiRing | Fallas sparkler wheel (6-5), blue-fire wheel (9-7) | hazard |
| Key / Lock | generic (object 1) | lock |
| Lamp | LAMP relight post (object 21) | none |
| FlashTrap | Baron surveillance camera (12-5, 13-3) | hazard / SNEAK alarm |
| GiftBooth | the souvenir shop counter (§3.4) | none |
| Vent (used) | steam (7-2 distillery), chocolate steam (2-4) | zone |
| DevilZone | the "22 zone" glitch field (22-2) | zone |
| Moop | a petal gust that blows litter-like tulip petals (8-2) | hazard (cosmetic push) |
| Dropper | icicle dropper (12-4, 13-4), coconut dropper (3-6), claw (11-4) | hazard |
| Banner | papel-picado rope (1-1, 1-6), Fallas bunting (6-5) | hazard from below |
| DiscoBall | Sambadrome mirror ball pendulum (3-1), the clock pendulum (22-4) | hazard |
| Surfer | wave spawner (9-1) | existing |
| JellyPad | jelly bounce pads (6-6), lily pads (2-2) | spring |

---

## 7. Engine work list, spec format and interface contract

### 7.1 Engine work list, in build order
Ownership: everything is Super Brady-O World territory (`src/03`–`src/30`, `tools/validate_levels.js`, `tools/gameplay_test.js`, `tools/boss_test*`), except the one-line additive edits in shared `src/00_core.js` (Save key, two tile ids). Write big new files in the scratchpad, `node --check`, then move them into `src/` (a half-written file breaks every app).

| Step | What | Files | Size | Done when |
|---|---|---|---|---|
| **W1** | Save v2: key `super-brady-o-world-save-v2`, defaults gain `exits: {}` and `tour.revealed/paths/flights/bottles/lighthouse/houses`; one-time copy of `settings` + `look` from v1 | `src/00_core.js` (key map + defaults, additive), new `tools/save_test.js` | S | a fresh boot uses v2; a v1 save's settings survive; progress is empty |
| **W2** | `Tour.country` v2: normalise levels (`n`, `arch`, `secret`, `exits` defaults, legacy `style`→`areas`), `C.mainCount`, `C.houses`, `C.stamps`, `C.skins`, `C.map`; `bossDone`, `isFinale`, WORLDS `kinds` use `mainCount` | `src/28_tour_a_core.js` | S | all 14 old country files still load unchanged |
| **W3** | Area-graph builder: `TourBuild.generate` builds `areas[]` from `spec.areas` through `TourGens[gen]`; resolves `door` targets (`'areaId'` or `'areaId@anchor'`) after all areas are built; level `start` = the first area's `@start` anchor; legacy specs map to one area | `src/28_tour_b_build.js` | M | the old 68 levels build byte-identical tiles (snapshot test) |
| **W4** | Stamps: `TourStamp.parse(stamp)`, the `stamp` piece, the `room` gen, the global legend (§7.3) | new `src/28_tour_j_stamps.js` | M | a stamp round-trips (parse → tiles → `dump_level`) |
| **W5** | Generalised exits: gate spawn `exit: 'main'|'secret'` (legacy `secret: true` = `'secret'`); `Play.levelClear` stores `this.exitKey`; `recordProgress` calls `TourProgress.exit(id, key)` and stores `Save.data.exits`; TourProgress v2 (unlock graph, reveal list); `nextLevelId` follows `exits.main` | `src/12_play.js`, `src/28_tour_a_core.js`, `src/28_tour_b_build.js` (Gate class) | M | the 8-4 → aq and 5-2 → w22 tests pass via the new path |
| **W6** | Validator v2: `vkey`, `edge`, `toggle`/`switchAt`, light-only, soil, lintel, flip standing, carry physics, pace, coverage, budget and archetype rules | `src/08_levels.js` (AreaBuilder methods), `src/09_validate.js`, `tools/validate_levels.js` | L | all old levels still pass; unit fixtures for each primitive pass |
| **W7** | New tiles `T.SOIL = 21`, `T.LINTEL = 22` (`SOLID` for both; lintel blocks standing-height passage); tile art hooks `soil.paint`, `lintel.paint`; dig action in player physics | `src/00_core.js` (2 enum entries, additive), `src/06*` tile painter, `src/07_physics.js`, `src/11_player.js` | S/M | `dump_level` shows them; digging works in a fixture |
| **W8** | Gens: `layered`, `islands`, `shaft`, `room`, `maze`, `rail`, `rise`, `dig`, `arena`; `climb` variants `interior`/`facade`/`exterior`; `strip` accepts `lanes`/`ceil`/`bottomKill` | new `src/28_tour_bb_gens.js` (loads after `b_build`: files load in name order, and `b2` would sort before `b_`) | L | each gen has a fixture level that validates |
| **W9** | Area systems: `tide` water line (`area.waterLine` read by `inWater` and drawing), `flip` zones (gravity sign in `playerPhysics`, camera centring), `phase` (theme swap + tile-cache rebuild + enemy state hook `onPhase`), `lamp` radius, `chase` (`TourDoom` continuous; periodic reuses `updateChasers`), `autoscrollY`, `risingWater`, `carry`, `bottomKill`, camera modes `lanes`/`shaft`/`room` | `src/07_physics.js`, `src/11_player.js`, `src/12_play.js` | L | each system has a fixture and a screenshot |
| **W10** | Object library (§6.2): entities + pieces + validator writes | new `src/28_tour_h_objects.js` | M/L | each object has a fixture that validates and a gameplay check |
| **W11** | Behaviour library (§4.2): `TourBehave.*`, dispatch from `TourEnemy.think`/`TourFlyer`/`TourSwimmer` | new `src/28_tour_i_behave.js`, `src/28_tour_d_actors.js` (3-line dispatch hook) | M | each behaviour has a scripted test (tell → attack → weak window) |
| **W12** | Gear and HANDS: `TourGear.register`, the 10 items, HANDS/BUFFS slots, Backpack swap, hit order, HUD icons | `src/28_tour_c_powers.js`, `src/11_player.js`, the HUD file (`src/13_*`) | M | the stacking table of §5.2 is covered by `gameplay_test` checks |
| **W13** | Map graph: merge `origin/sbw/graphics-pass-fixed` first; `TourLandscape.grid(stops)`, houses, `mapFrom` arrays, visibility, exit pips, `ARCH_LABEL`, the reveal queue, panel Brady walker; world map: flights, bottle currents, Lighthouse, landmark regrow, airship | `src/28_tour_f_map.js`, `src/28_tour_fa_landscape.js` | L | new `tools/map_test.js` plays a reveal queue and screenshots it |
| **W14** | Souvenir shops, bottles, Lighthouse flags | `src/28_tour_h_objects.js`, `src/28_tour_f_map.js` | S | buy → Backpack works |
| **W15** | Tests: `validate_levels` runs all 88 levels plus the rules (§0, §5.3); `gameplay_test` line 285 → `levels === 88 && main === 68`; `tools/boss_test.js` `enterArena()` finds the area with `role: 'arena'` and loads it; new `map_test`, `save_test` | `tools/*` | M | the full suite is green |
| **W16** | Docs: `docs/WORLD_TOUR_GUIDE.md` v2 sections for every new key, and this file | `docs/` | S | — |

W1–W6 freeze the interface; country rewrites can start as soon as W1–W6 plus `room`/`islands` from W8 land (§9).

### 7.2 Spec format: `Tour.country` v2
New keys are marked ★. Everything not listed keeps its current meaning (`themes`, `painters`, `dyn`, `decor`, `decorLights`, `beatArt`, `platforms`, `enemies`, `entities`, `pieces`, `boss`, `power`, `tracks`, `music`, `coin`, `star`, `emblem`, `sprites`).

```js
(() => {
Tour.country({
  id: 'mx', colors: {...}, tagline: '...', arrival: '...', landmark: 'the ...',
  themes: {...}, enemies: {...}, pieces: {...}, boss: {...}, power: {...}, music: {...},
  ★ stamps: { bodega: { rows: [...], legend: {...}, floor: 11 } },   // ASCII rooms and set pieces (§7.3)
  ★ skins: { mxLeverPost(ctx, e, t) {}, mxTrapdoor(ctx, e, t) {} },  // country looks for library objects (§6.2)
  ★ map: { fort: 'hacienda', start: [0, 0] },                         // panel: boss-fort motif, where the plane lands
  ★ houses: [ { id: 'mx-tienda', kind: 'stand', name: 'La Tiendita', keeper: 'xolo',
               stock: ['plane', 'fins', 'joint', 'kazoo', 'oneup', 'sundial'], mapCell: [0, 1], mapFrom: 0 } ],
  levels: [ /* level specs, main levels first (the boss is the last main one), then secret levels */ ]
});
})();
```

**Level spec:**
```js
{
  n: 1,                         // ★ the level number = position + 1 (checked; makes ids explicit for reviewers)
  name: 'Mercado Mayhem',
  arch: 'parade',               // ★ archetype code, lower case (§1). 'lair' for boss levels
  secret: false,                // ★ true for secret levels (they come after the boss)
  theme: 'mx_mercado',          // default theme for areas that don't set one
  hint, gimmick, postcard, music, time,     // as today
  enemies: [['mxPepper', 3], ['mxElote', 2]], // as today: the pool for generic 'enemies' pieces
  mapCell: [0, 0], mapFrom: -1, // ★ country-panel grid cell and incoming trail(s) (§3.5)
  exits: {                      // ★
    main:   { to: '1-2' },                                    // default: next main level / 'country:next' / back to map
    secret: { to: 'house:mx-tienda', hint: 'Something rattles behind the mole stall...' }
  },
  areas: [ /* area specs; areas[0] is where Brady starts */ ],
  // LAIR only:
  boss: 'mx_pinata', mid: false,   // as today (the arena area carries the layout, below)
}
```

**Area spec** (`gen` picks the generator; the options per gen are in §7.4.1):
```js
{
  id: 'mercado',          // ★ unique within the level; doors target it as 'mercado' or 'mercado@anchor'
  gen: 'layered',         // ★ strip | layered | islands | shaft | room | maze | rail | ride | swim | climb | rise | dig | arena
  role: 'main',           // ★ 'main' (default for areas[0]) | 'sub' | 'secret' | 'arena'
  theme: 'mx_mercado', music: 'tour_mx',
  W: 214, H: 30,          // gen-specific defaults apply
  script: [ ... ],        // strip-like gens: steps as today ('name' | ['name', opts] | fn)
  stamp: 'bodega',        // room/arena gens: a stamp id (or an inline stamp object)
  // area systems (all optional): dark, water, waterLine, tide, gravity, flip, chase, autoscroll, autoscrollY,
  // risingLava, risingWater, lamp, phase, carry, wind, bpm, bottomKill, camera, mirror, roof
}
```

### 7.3 Stamps (hand-authored ASCII rooms and pieces)
```js
stamps: {
  plaza: {
    floor: 9,                 // the row that sits on st.gy when placed in a strip (rows count from 0 at the top)
    rows: [
      '..........................',
      '.....o.o.o.......*........',
      '....---------...-----.....',
      '..........................',
      '..f.......r.........?.....',
      '.bbbb...######....bbbb....',
      '.####...######....####....',
      '..........................',
      '..........................',
      '##########################',
    ],
    legend: { f: ['spawn', 'geyser', { look: 'mxFountain', period: 3 }], r: ['enemy', 'mxElote'] },
    items: ['power'],         // '?' blocks in reading order
    hidden: [],               // 'h' blocks in reading order
    doors: [],                // 'D' doors in reading order: { to: 'area@anchor', look }
    gold: { '*': 'risky' }    // optional kind for '*' spots (default 'hidden')
  }
}
```
**Global legend** (`TourStamp.LEGEND`; a stamp's `legend` may not redefine these):

| char | meaning | char | meaning |
|---|---|---|---|
| `.` | empty | `#` | ground (theme) |
| `B` | brick | `Q` | coin brick (`QBRICK`) |
| `H` | hard block | `-` | one-way platform (SEMI) |
| `\|` | pillar | `^` | spikes |
| `v` | ceiling spikes | `L` | liquid (the theme's lava/liquid, deadly) |
| `W` | water cell (room/maze gens: marks the area as water there) | `I` | ice |
| `<` `>` | conveyor left / right | `C` | crumble |
| `F` | fake wall | `S` | soil |
| `T` | lintel (crawlway roof) | `b` | ground with a bounce surface |
| `y` | ground with a sticky surface | `o` | coin |
| `*` | postcard spot | `?` | item block (`items[]`) |
| `h` | hidden block (`hidden[]`) | `s` | spring (adds `B.springs`) |
| `c` | checkpoint | `@` | anchor `start` (areas[0]) or `in` (others) |
| `G` | main gate | `g` | secret gate (`exit: 'secret'`) |
| `D` | door (`doors[]`) | | |

**Custom letters:** any other letter or digit is defined in the stamp's `legend` as one of:
- `['spawn', type, props]`
- `['enemy', type, props]`
- `['decor', kind]`
- `['anchor', name]`
- `['tile', T.X, { surf, hide }]`
- `['piece', name, opts]` (runs a library piece with `st.x`/`st.gy` at that cell)
- `['gear', id]` (a gear stand)
- `['key', id]`
- `['lock', id]` (a vertical run of the same letter is one lock)
- `['vkey', id]`

### 7.4 Interface contract (names and signatures that country agents can rely on)

#### 7.4.1 Generators (`TourGens[gen](ctx, areaSpec) → { area, anchors }`)
| gen | Defaults | Options | Builder state extras |
|---|---|---|---|
| `strip` | W 420 cap, H 18, GY 14 | `GY, gyMin, gyMax, ceil, mode: 'run'|'auto'|'castle', scroll, bottomKill`. A v2 strip gets no automatic `end` (say where the area ends) | as today |
| `layered` | H 30, `lanes: { roof: 12, street: 21, cellar: 27 }` | `lanes`; a step's `lane: 'roof'|'street'|'cellar'` runs it on that lane's own cursor; `['sync']` aligns all cursors to the furthest; upper lanes build 2-row slabs (`st.sky` floors); every launcher (bouncy surface, spring, updraft) opens a hole in the lane above (`autoOpen: false` to place them by hand) | `st.lane`, `st.lx[lane]`, `st.laneY[lane]` |
| `islands` | H 30, W 190, `bottomKill: true` | `H, startIsland: 8` | `st.island(x0, x1, y)` returns the island; `st.sky = true` |
| `shaft` | W 22, H 160 | `W, H` | `st.y` grows downward; `st.shelf(y, holes)` (a full-width ledge with holes) |
| `room` | from the stamp | `stamp` | — |
| `maze` | `cells: [3, 3]`, cell 26 x 14 | `cells`, `script: [[cellStamp, ...] per row]`, `links: [{ from: [c, r], to: [c, r], kind: 'door'|'drop'|'oneway' }]` | doors are same-area portals |
| `rail` | len 200, H 18, decks `{ upper: 6, lower: 11 }` | `vehicle, vehicleW, scroll, below` | `st.deck`, plus the `fork` piece |
| `ride` / `swim` / `climb` | as today | climb: `variant: 'interior'|'facade'|'exterior'` | as today |
| `rise` | W 28, H 120 | `rise: { speed: 1.0, delay: 3 }` **or** `risingWater: { speed: 0.6, delay: 4 }` | climb state |
| `dig` | W 130, H 40, surface row 8 | `soilFrom: 9` | `st.cavern(x0, y0, x1, y1)`, `st.rock(...)` |
| `arena` | W = `arenaW` + 18, H 18 | `layout` (the country's `arena_<layout>` piece), `arenaW`, `roof` | runs the existing `arena` piece after a 4-tile entry with anchor `in` |

#### 7.4.2 Generic pieces (in `Tour.pieces`, all `(st, opts) => newX`)
- **Existing:** `flat gap step stairs blocks floating mover lift fallers spring pillars spikes enemies cp sig lsd oneup star bonus secret end arena`.
- `end` gains `{ exit }`.
- `secret` stays (a bonus room with a secret gate) for old specs.

**New pieces:**

| Piece | Options |
|---|---|
| `stamp` | `{ id, at: 'ground' | rowNumber }` |
| `door` | `{ to: 'area@anchor', look, perch: 3 }` |
| `secretDoor` | `{ to, look: 'fake' | 'curtain' | 'painted' }` |
| `trapdoor` | `{ to }` |
| `gate` | `{ exit: 'main' | 'secret', need }` |
| `gearStand` | `{ item }` |
| `itemBlock` | `{ item, y, hidden }` (any item id incl. gear) |
| `keyLock` | `{ id, keyAt, lockAt, h }` |
| `lever` | `{ opens, look }` |
| `toggle` | `{ g, A, B, kind }` |
| `plate` | `{ opens, crateDx }` |
| `timedDoor` | `{ lever, door, t }` |
| `zip` | `{ dx, dy }` |
| `catapult` | `{ to: [dx, dy], skin }` |
| `seesaw` | `{ len }` |
| `wheel` | `{ r, arms, speed, skin }` |
| `teleport` | `{ pair }` |
| `fan` | `{ w, h, force, g }` |
| `balloon` | `{ rise, drift }` |
| `breakwall` | `{ needs, h, skin }` |
| `mirrors` | `{ mirrors, receptor, opens }` |
| `valve` | `{ g, low, high }` |
| `ring` | `{ len }` |
| `belt` | `{ dir, n }` |
| `iceRun` | `{ n }` |
| `honey` | `{ n }` |
| `bouncePad` | — |
| `crumbleRow` | `{ n }` |
| `pedestal` | `{ item, start, deliver }` |
| `fork` | `{ len, upper: [steps], lower: [steps] }` (rail) |
| `lantern` | `{ kind: 'relight' | 'phase' }` |
| `flipline` | `{ w }` |
| `hold` | `{ waves: [[type, n], ...] x3 }` (HoldArena) |
| `thief` | `{ kind }` |
| `rival` | `{ kind, route: 'upper' | 'lower' }` |
| `watcher` | `{ kind: 'light' | 'guard', sweep: [a0, a1], period }` |
| `ball` | `{ kind: 'snow' | 'dung' | 'cheese', r }` |
| `bottle` | `{ n }` |
| `shop` | — (stand rooms only) |
| `sync` | — (layered) |
| `postcard` | `{ kind: 'must' | 'hidden' | 'risky' | 'high', dx: 0, dy: -3 }` |
| gimmick pieces | `geyser pancake bubbler roller barrel laser sweeper subwoofer horn poiring dropper banner discoball jellypad`: each places that engine gimmick with `{ look, period, len, … }` (the re-themes of §6.3) |

**Country pieces** keep the rule "country names win over generic ones" (`Tour.pieces[cc + '.' + name]`).

#### 7.4.3 Entity types (`ENTITY_TYPES`)
- **Library objects:** `lever toggleSwitch plate crate timedDoor zipLine catapult seesaw wheel teleport fan balloon breakWall mirror sunReceptor valve ring pedestal carryItem railSwitch lantern trapdoor gearStand bottle souvenirShop`.
- **Level flow:** `tourDoom holdArena tourThief tourRival watcher tourBall`.

#### 7.4.4 Behaviour ids (§4.2)
`splitter regrower camouflage burrower trailLayer saltSneezer inhaleBlast ceilingDrop wallCrawl inflater pouncer itemThief timeSlow curlShield mimic grabber echo stacker boomerang swarm platEater alarmCaller frostBreath lightFrozen inkBlot tongue pusher sleeper blinker hoverDart`

Usage: `TourEnemy.make({ behavior: 'regrower', regrowT: 3, w, h, art, sprite })` (or `TourFlyer.make` / `TourSwimmer.make` with the same key).

**Optional enemy hooks:**
- `onPhase(e, night)`: called when a phase switch flips.
- `onLight(e, lit)`: called when the light state changes.

#### 7.4.5 Power-up ids
- **Core, existing:** `power` (mushroom/joint), `lsd`, `star`, `oneup`, `sig`, `pick`, `picks`.
- **Gear, new:** `plane hat pads magnet fins box kazoo wand sundial globe`.
- **Hit kinds:** new gear adds `plane`, `kazoo`, `wand`, `globe`, `hatdash`; a boss `brain.hit(b, kind)` sees them.

#### 7.4.6 Area systems (keys on an area spec)
| Key | Format |
|---|---|
| `dark` | `true` |
| `water` | `true` |
| `waterLine` | `row` |
| `tide` | `{ low, high, period, hold }` |
| `gravity` | `1` |
| `chase` | `{ speed, ramp, period, lethal: false, look }` |
| `autoscroll` | `t/s` |
| `autoscrollY` | `t/s` |
| `risingLava` | `{ delay, speed }` |
| `risingWater` | `{ delay, speed }` |
| `lamp` | `{ r0: 170, r1: 70, decay: 25 }` |
| `phase` | `{ night: 'theme', start: 'day' }` |
| `carry` | `{ item, jumpMul: 0.92 }` |
| `wind` | as today |
| `bpm` | as today |
| `bottomKill` | `true` |
| `camera` | `'side' \| 'lanes' \| 'tower' \| 'shaft' \| 'room'` |
| `mirror` | `true` |
| `roof` | `false` |

#### 7.4.7 Progress API (`TourProgress`)
| Call | Returns / does |
|---|---|
| `exit(id, key)` | `[reveal, …]` (§3.6); records `Save.data.exits[id][key]` |
| `isUnlocked(id)` | — |
| `isRevealed(idOrHouse)` | — |
| `exitsFound(id)` | `{ found, total }` |
| `countryUnlocked(C)` | — |
| `bossDone(C)` | — |
| `totals()` | `{ done, total, gold, goldTotal, mainDone, secretDone }` |

#### 7.4.8 Validator result (`Validator.run`)
`{ ok, exits: { main, secret }, gold: [b, b, b], areasReached: [b…], pace: { ok, margin }, budget: { ok, errors }, nodes, ms }`

#### 7.4.9 Naming rules for parallel country agents
- **Each country edits only** `src/29_tour_<cc>.js`, `src/29_tour_<cc>_sprites.js`, and its own stamps, skins and pieces inside them.
- **Shared files are off-limits:** a missing library feature is requested in `docs/handoff/REQUESTS.md`, never added to a shared file.
- **Names:**
  - spawn types and themes: `<cc>Name` / `<cc>_name`
  - stamps: plain names (looked up as `<cc>.<name>` first)
  - houses: `<cc>-<name>`
- **Self-check before handing back:**
  1. `node tools/validate_levels.js <w>-1 … <w>-7`
  2. `node tools/validate_levels.js --rules` (the archetype caps are global, so the rules run on the whole set)
  3. screenshots of every level.

### 7.5 Two complete examples

#### 7.5.1 Mexico 1-1 "Mercado Mayhem" (PARADE)
```js
// inside Tour.country({ id: 'mx', ... })
stamps: {
  // the cellar shop: P2 on the shelf, an item block, the FAKE back shelf hides the secret gate to the Souvenir Stand
  bodega: {
    floor: 11,
    rows: [
      '########################################',
      '#............................#.........#',
      '#..o.o.o.o.o.................#..o.o.o..#',
      '#............................#.........#',
      '#............................#.........#',
      '#............................#.........#',
      '#..................*.........#.........#',
      '#........?......-------......#.........#',
      '#............................F.........#',
      '#............................F.........#',
      '#.@..D....k.......k..........F....g....#',
      '########################################',
      '########################################',
      '########################################',
    ],
    legend: { k: ['decor', 'mxChiliSack'] },
    items: ['power'],
    doors: [{ to: 'mercado@bodegaBack', look: 'mxCellarStairs' }],
    gold: { '*': 'hidden' }
  },
  // the plaza (beat 3), placed on the street lane: a fountain jet, two awnings, a piñata block row
  plaza: {
    floor: 9,
    rows: [
      '..........................',
      '.....o.o.o.......*........',
      '....---------...-----.....',
      '..........................',
      '..f.......r.........?.....',
      '.bbbb...######....bbbb....',
      '.####...######....####....',
      '..........................',
      '..........................',
      '##########################',
    ],
    legend: { f: ['spawn', 'geyser', { look: 'mxFountain', period: 3 }], r: ['enemy', 'mxElote'] },
    items: ['pick'],
    gold: { '*': 'risky' }            // P3 above the fountain
  }
},
skins: { mxTrapdoor(ctx, e, t) { /* wooden hatch with chili stencil */ }, mxCellarStairs(ctx, e, t) { /* ... */ } },
map: { fort: 'hacienda', start: [0, 0] },
houses: [{ id: 'mx-tienda', kind: 'stand', name: 'La Tiendita', keeper: 'xolo',
           stock: ['plane', 'fins', 'kazoo', 'oneup', 'sundial', 'magnet'], mapCell: [0, 1], mapFrom: 0 }],
levels: [
  { n: 1, name: 'Mercado Mayhem', arch: 'parade', theme: 'mx_mercado',
    gimmick: 'Three lanes at once: rooftops, street and cellar canal. Awnings bounce you up, trapdoors drop you down',
    hint: 'Hold jump on an awning to bounce up to the rooftops',
    postcard: 'Brady! The market has three floors and the melons use all of them. ♥ C',
    enemies: [['mxPepper', 3], ['mxElote', 2], ['mxChihuahua', 1]],
    mapCell: [0, 0], mapFrom: -1,
    exits: {
      main:   { to: '1-2' },
      secret: { to: 'house:mx-tienda', hint: 'Chili dust puffs out from under a crate in the market...' }
    },
    areas: [
      { id: 'mercado', gen: 'layered', W: 214, H: 30, lanes: { roof: 12, street: 21, cellar: 27 }, camera: 'lanes',
        script: [
          // ① awnings link street and roof
          ['xolo',      { lane: 'street' }],                          // kept: Xolo hands over the taco (Sig)
          ['itemBlock', { lane: 'street', item: 'power', y: 4 }],     // M, inside the first 25 %
          ['stalls',    { lane: 'street', n: 2 }],                    // kept: bouncy awnings up to the roof
          ['rooftops',  { lane: 'roof', n: 2 }],                      // kept
          ['flat',      { lane: 'cellar', n: 30 }],                   // the canal walk under the street
          ['sync'],
          // ② melons on the street, gaps and papel-picado ropes on the roof
          ['melons',    { lane: 'street' }],                          // kept: the melon cart (Roller)
          ['banner',    { lane: 'roof', len: 4, look: 'mxPapelPicado' }],
          ['gap',       { lane: 'roof', n: 3 }],
          ['gearStand', { lane: 'roof', item: 'plane' }],             // Paper Plane before beat 3
          ['postcard',  { lane: 'roof', kind: 'must', dy: -3 }],      // P1 over the third stall roof
          ['trapdoor',  { lane: 'street', to: 'bodega@in', crate: true, back: 'bodegaBack', look: 'mxTrapdoor' }],
          ['spring',    { lane: 'cellar', gold: false }],             // cellar → street
          ['enemies',   { lane: 'cellar', n: 2 }],
          ['sync'],
          'cp',
          // ③ the plaza joins all three lanes
          ['stamp',     { id: 'plaza', lane: 'street' }],
          ['pinatas',   { lane: 'street' }],                          // kept: piñata item blocks, bump from below
          ['fountain',  { lane: 'street' }],                          // kept: the jet lifts to the roof lane
          ['rooftops',  { lane: 'roof', n: 1 }],
          ['sync'],
          ['end',       { lane: 'street', exit: 'main' }]
        ] },
      { id: 'bodega', gen: 'room', role: 'secret', theme: 'mx_bodega', dark: true, stamp: 'bodega' }
    ]
    // budget check: M block (street), Sig from Xolo, Paper Plane stand, piñata/plaza blocks = 5 main-area opportunities;
    // the kept hidden 1UP at x=7 is added by the layered gen for level 1 of each country (as tourStrip does today).
  },
  ...
]
```

#### 7.5.2 Ecuador 2-2 "Canopy of Baños" (SWING)
```js
// inside Tour.country({ id: 'ec', ... })
stamps: {
  treehouse: {
    floor: 10,
    rows: [
      '##############################',
      '#............................#',
      '#....o.o.o.o.o.o.............#',
      '#............................#',
      '#............................#',
      '#.................*..........#',
      '#...............-----........#',
      '#.......?....................#',
      '#............................#',
      '#.@.D...........n.......n....#',
      '##############################',
      '##############################',
    ],
    legend: { n: ['decor', 'ecNest'] },
    items: ['oneup'],
    doors: [{ to: 'canopy@treeBack', look: 'ecRopeLadder' }],
    gold: { '*': 'hidden' }            // P2
  },
  cascada: {
    floor: 12,
    rows: [
      '########################',
      '#......................#',
      '#..r......r......r.....#',
      '#......................#',
      '#...o.o.o.o.o.o.o......#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#.@.D............g.....#',
      '########################',
      '########################',
    ],
    legend: { r: ['decor', 'ecMistRainbow'] },
    doors: [{ to: 'canopy@fallsBack', look: 'ecWaterCurtain' }]
  }
},
levels: [
  ...,
  { n: 2, name: 'Canopy of Baños', arch: 'swing', theme: 'ec_amazon_dusk',
    gimmick: 'No ground: swing vine to vine, then ride the swing at the end of the world',
    hint: 'Jump into a vine to grab it, jump again to let go at the top of the swing',
    postcard: 'Brady, the frogs here are see-through. I checked. Twice. ♥ C',
    enemies: [['ecFrog', 3], ['ecGlassFrog', 2], ['ecCondor', 1]],
    mapCell: [1, 0], mapFrom: 0,
    exits: {
      main:   { to: '2-3' },
      secret: { to: '2-7', hint: 'A rainbow hangs in the mist of the last waterfall...' }
    },
    areas: [
      { id: 'canopy', gen: 'islands', W: 210, H: 24, bottomKill: true,
        script: [
          // ① vines between giant trees
          ['itemBlock', { item: 'power', y: 4 }],                     // M on the start island
          ['vines',     { n: 3 }],                                    // kept (swing mplats + ghosts)
          ['branches',  {}],                                          // kept
          ['secretDoor', { to: 'treehouse@in', look: 'ecLeafLadder', back: 'treeBack' }],   // P2 room
          ['postcard',  { kind: 'must', dy: -4 }],                    // P1 at the top of a vine arc
          'cp',
          // ② the glow: glass frogs only show in it; lily pads sink on the river below
          ['gearStand', { item: 'wand' }],                            // Bubble Wand: bubble platforms over the river
          ['glow',      {}],                                          // kept: pulsing mushrooms (light radius → camouflage)
          ['lilies',    { n: 4 }],                                    // kept
          ['enemies',   { kind: 'ecGlassFrog', n: 2 }],
          ['ring',      { len: 3 }], ['ring', { len: 3 }],
          // ③ the swing at the end of the world, then vines across the falls
          ['catapult',  { to: [16, -2], skin: 'ecTreeSwing' }],      // the giant tree swing
          ['postcard',  { kind: 'risky', dy: -7 }],                   // P3 at the swing's apex
          ['vines',     { n: 4 }],
          ['itemBlock', { item: 'oneup', y: 6, hidden: true }],       // premium in a risky spot
          ['secretDoor', { to: 'cascada@in', look: 'curtain', back: 'fallsBack' }],
          ['end',       { exit: 'main' }]
        ] },
      { id: 'treehouse', gen: 'room', role: 'sub', theme: 'ec_amazon', stamp: 'treehouse' },
      { id: 'cascada', gen: 'room', role: 'secret', theme: 'ec_amazon', stamp: 'cascada' }
    ] },
  ...
]
```
On a `room` gen, `back` anchors are created by `secretDoor` and `trapdoor` at their own position + 2 tiles. Doors listed in a stamp target `area@anchor`. The validator follows both directions through portals.

The `postcard` piece is a generic piece too: `postcard { kind: 'must'|'hidden'|'risky'|'high', dx: 0, dy: -3 }` places a `st.gold` spot relative to `st.x`/`st.gy`.

### 7.6 Legacy compatibility (so countries migrate one at a time)
- A level without `areas` builds as today: `style` → `gen` (`run`/`night`/`auto`/`castle` → `strip` with mode; others the same name). `secret: { to, need }` + `'secret'` piece → `exits.secret = { to: 'land:' + to, need }`.
- A level without `arch` is reported by `validate_levels --rules` as "unmigrated" (a warning until the country's rewrite lands, an error at release).
- `levels.length > 5` without `secret: true` on the extras is an error.

---

## 8. Art impact (Fiesta Toon pipeline: Blender → atlas)

### 8.1 Rules that keep the workload sane
- **Graybox first.** Every new level ships first with procedural art (the existing fallback painters plus a placeholder palette per theme). The Blender pass comes after the level validates and Brady has seen screenshots.
- **Variants before new scenes.**
  - A *variant* (V) re-lights or re-palettes an existing Blender background scene: dusk, night, dawn. It is a `lookkit.py` light preset plus one re-render, about 1/4 of the cost of a new scene.
  - A *new* (N) theme needs a background module (`LAYERS`, `BASES`, `build`, `build_ground`) and a ground strip.
- **Secret rooms and sub-areas reuse their level's theme.** Use the theme's cave variant (`caveVariant`) or a shared interior kit unless the table below says otherwise.
- **Shared kits, made once and used by all countries:**
  - the **souvenir stall** room: counter, awning and shelves, tinted with `C.colors`; only the keeper animal is per country
  - the **gear stands** and the **10 gear icons**
  - the bottle and the lighthouse
  - the **14 fort motifs** for the map
  - the **flip line**, **pedestal**, **zip line**, **catapult cup**, **seesaw**, **ring**, **valve**, **lever**, **plate and crate**, **balloon basket**, **mirror and receptor**, **trapdoor** base meshes (re-skinned per country through materials)
- **Vertical backgrounds** for FALL, RISE and TOWER (b)/(c) need a `vertical: true` image layer that tiles a 1024 px tall strip vertically. This is an engine addition in W9: `BGPaint` image layers gain `vertical`, and `render_country.py` gains `JOB=vbg:<module>` that renders a vertically seamless strip.
- **Enemies:**
  - New poses are added to existing sprite kinds wherever possible (e.g. mxAxolotl `tiny`, ecIguana `sneeze`, npYeti `breathe`).
  - Code-drawn effects need no sprites: the w22Echo silhouette, salt platforms, ink blots, bubbles, frost cones and snowfall.
  - Mini-bosses (Brass Owl, Tin Yak, Snow-Plough Bot) are each one Blender model with 5 poses.

### 8.2 Per country
| Country | Themes: reuse → level | New themes (N) / variants (V) | New enemy sprites (or new poses) | New objects / skins |
|---|---|---|---|---|
| mx | mercado 1-1, canal 1-2, cenote 1-3, volcan 1-4, hacienda 1-5 | N `mx_bodega` (cellar interior, 1-1 secret), N `mx_sotano` (vertical pit, 1-6) | mxBlindFish, mxSwallow, mxPopcorn; poses: mxAxolotl `tiny`, mxElote `burst`, mxChihuahua `bark` | trapdoor, lever post, canal lock gate, papel-picado rope, updraft flower, willow curtain, stall keeper Xolo |
| ec | equator 2-1, amazon 2-2 rooms, galapagos 2-6, andes + cotopaxi 2-5 | V `ec_amazon_dusk` (2-2), N `ec_islas` (lava coast, 2-3), N `ec_fabrica` (cacao works, 2-4), N `ec_pailon` (waterfall gorge, 2-7) | ecGlassFrog, ecHummingbird, ecCrab, ecDipper, rival booby Pata Azul; poses: ecIguana `sneeze`, ecSeaLion `slide` (land) | flip line, chocolate vat + press + belt, tree swing, waterfall curtain, airstrip hangar, keeper booby |
| br | samba 3-1 (V dawn), pantanal 3-2, falls 3-3, barracao 3-5 lead-in | V `br_samba_dawn`, N `br_lencois` (dunes + lagoons, 3-4), N `br_rio_sky` (hang-glide sky with Sugarloaf and beaches; **no statue**, 3-6), V `br_estadio` (arena from barracao kit + stands bg) | brSloth, brSwift, brParrot, Quati (brCoati + bag); poses: brBrigadeiro `stack` | bell gate, kick-target shutter, rainbow bridge, raft hatch, hang glider, keeper coati |
| mz | savanna 4-1, dunes 4-2 + 4-6 surface, beach 4-4, fort 4-5 | V `mz_copas` (baobab crowns at sunset, 4-3), N `mz_areia` (underground sand + buried hull, 4-6) | mzDungBeetle + ball, mzPangolin, mzChameleon, mzMoleRat, rival ostrich; pose: mzGhostCrab `statue` | carry pedestal + hatchling, lighthouse beam, termite-mound door, dhow mast hatch, keeper hornbill |
| ma | souk 5-1 (maze cells), sahara 5-2, atlas 5-4, riad 5-5 | N `ma_azul` + V `ma_azul_night` (Chefchaouen, 5-3), N `ma_cielo` (carpet sky, 5-6; minarets only as far silhouettes) | maMoth, maCat, maStork, **Brass Owl** (mini-boss) | sun-moon lantern, laundry line, chain lever + tagine lid, carpet islands, keeper fennec |
| es | tomatina 6-1, arts 6-3, aquarium 6-6, fallas + lonja 6-5 | N `es_pintxos` (giant bar counter, 6-2), N `es_teide` (Canary volcano, 6-4), N `es_mancha` (windmill plain, 6-7) | esStork, esPulpo, esOlive, esGamba, esLizard, esKestrel, esLynx, esSheep | hold-arena gates (crate walls), toothpick bridge, tortilla flipper, oil spill, wind switch, fumarole, keeper stork |
| fr | morning (place + bakery) 7-1, seine 7-6, chateau 7-5, tower (bg silhouette reuse) | N `fr_place` (Paris square, 7-1 hub), N `fr_provence` (lavender, 7-2), N `fr_baie` (tidal flats; abbey as far background only, 7-3), N `fr_perigord` (oak forest + painted cave, 7-4), N `fr_ciel` (balloon sky, daylight tower silhouette, 7-7) | **frPoele** (replaces frMime), frCoq, frMagpie, frBoar, frSnail, frMole, frOyster, frCrab, frGull, frMacaron, truffle-pig friend | delivery stamp slots, poster fake wall, quicksand, balloon + burner, keeper hedgehog |
| nl | canals 8-1 base, tulips 8-6, rush 8-3, frozen 8-4, waag 8-5 | V `nl_polder` (canals + pumping station, 8-1), N `nl_veiling` (auction hall interior, 8-2) | nlBulb, rival gull on a cargo bike; pose: nlClog `pair` | valve wheel, sluice gate, auction clock hand, trolley belts, keeper goose |
| id | surf 9-1, kites 9-2, batur 9-3, dive 9-4, ruins 9-5 | N `id_rimba` (Borneo canopy, 9-6), N `id_ijen` (blue-fire sulfur mine, 9-7) | idMacaque, idGecko, idRafflesia, idHornbill, idAngler, idMoray | orangutan catapult, flame vent, rail fork + cart, keeper gecko |
| vn | street 10-1, bay 10-2, river 10-3, cave 10-4, citadel 10-5 | N `vn_mekong` (floating market, 10-6) | vnNon (flying conical hat), vnSilkworm, vnPhinDrip | bobbing boat floor, lantern relight shop, keeper water buffalo |
| jp | sushi 11-1, rail 11-2, bamboo 11-3, castle 11-5 | V `jp_bamboo_night` (11-3 night), N `jp_tower` (skyscraper exterior, 11-4), N `jp_gacha` (inside a capsule machine, 11-6), N `jp_fuji` (sky over the lake, 11-7) | jpTanuki (with its scenery disguises: soy bottle, stone lantern, straw sandal), jpChochin | wind chime, gondola lift, air-con fan, capsule platforms, keeper shiba |
| np | hills 12-1, pass 12-2, blizzard 12-3, icefall 12-4, fortress 12-5 + 12-7 | N `np_khadal` (blue-ice crevasse, vertical, 12-6), V `np_depot` (fortress kit, 12-7) | **Tin Yak** (mini-boss); poses: npYeti `breathe` / `pant`, npMarmot `whistle` | growing snowball, plank bridge, keeper red panda |
| aq | shelf 13-1 + 13-5, station 13-3, storm 13-4 | V `aq_aurora` (13-2) | aqPenguin conga, aqKrill, **Snow-Plough Bot** (mini-boss) | egg pedestal, keeper penguin |
| w22 | dusk 22-1, corridor 22-2, lake 22-3, white 22-4 | N `w22_desk` (writer's desk, 22-5) | w22Echo (code-drawn) | typewriter keys, paperclip spring, ink pot |

**Totals:**
- 34 new themes: 25 new scenes, 9 variants (V).
- About 60 new enemy sprite kinds plus about 15 pose additions.
- 3 mini-bosses.
- About 60 object skins on 14 shared base meshes.

**Order of art work:** follow the rollout (§9). Within a country: themes first (biggest visual win), then enemies, then object skins.

---

## 9. Rollout

### Phase 0: groundwork (1 engine agent)
1. Merge `origin/sbw/graphics-pass-fixed` into the working branch (the grid panel), then run the full suite.
2. Snapshot test: dump all 68 current levels' tiles to `tools/fixtures/levels_v1/`; W3 must reproduce them byte-for-byte for legacy specs.
3. Land W1–W6 (save v2, spec v2, area graph, stamps, exits, validator v2). **This freezes the interface in §7.**

### Phase 1: pilot, Mexico + Ecuador (1 engine agent + 2 country agents)
- **Engine work:**
  - gens: `layered`, `rail`, `shaft`, `islands`, `room`, `arena`, climb `interior`
  - systems: `flip`, `tide`, `lamp` (light-only tiles), `carry` (stub ok)
  - objects: trapdoor, secretDoor, lever, lock gate (`lift`), gearStand, catapult, ring, belt, press, valve
  - behaviours: regrower, splitter, camouflage, saltSneezer, hoverDart, swarm, pouncer variant
  - gear: `plane`, `fins`, `wand`, `hat`, `sundial`
  - map: W13 core (houses, reveals, pips)
- **Country agents:**
  - mx: 1-1 … 1-6 and La Tiendita.
  - ec: 2-1 … 2-7 and La Tienda del Cacao, plus the secret flight to Morocco (it lands on the old Morocco until Morocco is rebuilt).
- **Show Brady:** screenshots of every level, the panel reveal animation, and a short video of 1-1 and 2-1 on an iPhone (landscape and portrait). His OK is required before Phase 2.

### Phase 2: the rest, two or three country agents in parallel, in route order
Order: **br, mz, ma, es, fr, nl, id, vn, jp, np, aq, w22**. The engine agent lands each archetype's systems one country ahead:

| Country | Needs (beyond the pilot) |
|---|---|
| br | THIEF, TOWER facade, GLIDE, BEAT (exists), Kazoo |
| mz | RACE rival, DOOM continuous, CARRY, DIG + soil, ball pusher, Hard Hat dash |
| ma | MAZE, PHASE, FORT (Brass Owl), SCROLL (exists), platEater |
| es | HOLD, MINI art scale, SWITCH (wind), grabber, inkBlot, Crawl Pads |
| fr | HUB (errand), the other DIG, TIDE bore, alarmCaller, sleeper, boomerang, the secret flight to Vietnam |
| nl | SWITCH (water valve), FACTORY clock (Sweeper), LAMP relight, burrower |
| id | RIDE upgrade, LAMP in water, RAIL dark, itemThief, wallCrawl, inhaleBlast |
| vn | DOOM periodic, RISE flood, HUB with ride sub-area |
| jp | TOWER exterior, PHASE with object spirits, mimic, blinker |
| np | ROLL, SNEAK (Watcher, Cardboard Box), RISE autoscrollY, FORT (Tin Yak), frostBreath |
| aq | FLIP (reuse), FORT (Snow-Plough Bot), CARRY egg, swarm conga |
| w22 | PHASE clock, MAZE, FLIP + mirror, MINI desk, echo, timeSlow |

**Per-country definition of done:**
1. All its levels validate: exits, postcards, areas, pace.
2. `--rules` passes.
3. Its boss test still passes (arena area found).
4. Screenshots reviewed by the agent: dark levels, underwater, and the iPhone viewport.
5. A gameplay check for its headline enemy and its signature item.
6. Brady sees screenshots before the next country starts (he asked to see one country before batch production).

Art (§8) follows each country's level sign-off, in the same order, one country at a time, in the Blender window (one agent drives Blender at a time).

### Phase 3: release
1. All 88 levels validate.
2. `gameplay_test`, `boss_test`, `map_test`, `save_test` and `apps_test` pass.
3. A full playthrough on the iPhone, checking frame rate on the heaviest levels: 9-4 night dive, 3-3 facade, 11-4 tower.
4. Tell Brady first that saves will reset (key v2).
5. Deploy to gh-pages.
