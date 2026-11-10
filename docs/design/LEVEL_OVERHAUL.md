# Super Brady-O World: the level overhaul (design spec, November 2026)

Owner's brief, restated: no more repeats; every level a new idea; enemies with their own powers; more power-ups everywhere; secret rooms, hidden exits, secret levels and secret routes; more things to touch and use; a branching, living map. All content original (no Nintendo characters, blocks, pipes, power-up looks or layouts). PG-13 satire from food, animals, objects and folklore; people and sacred sites are never staged or mocked (temples, monasteries, minarets, stupas, prayer flags, the Mont-Saint-Michel abbey: background only, no fights or platforming on them); no Christ the Redeemer; the Eiffel-style tower only in daylight or unlit; no existing Japanese characters. World 6 is now **Spain** (whole country), world 7 is **France** (whole country).

This is a design document. Nothing in the repo was changed.

## STATUS (paused at the coordinator's request, 2026-11-10)

| Section | State |
|---|---|
| 0. Decisions at a glance | **complete** |
| 1. Archetype catalogue (30 + LAIR) | **complete** |
| 2. The 88-level lineup (all 14 lands) | **complete** |
| 3. Secret exits and map graph | **partial**: the exits are in every §2 row, and the decisions are fixed in "Decisions for the unfinished sections" (end of file). Not written yet: the per-country ASCII graphs and the full map-drawing spec. |
| 4. Enemy powers | **partial**: headline enemies are named in §2, and the behaviour library is fixed in the notes at the end. Not written yet: the full state and timing tables. |
| 5. Power-ups | **partial**: the 10 items and the slot and stacking rules are fixed in the notes at the end. Not written yet: HUD and art detail. |
| 6. Object library and validator | **partial**: the validator model is fixed in the notes at the end. Not written yet: per-object entries. |
| 7. Engine work list and spec format | **partial**: the build order and files are in the notes at the end. Not written yet: the full JS spec examples. |
| 8. Art impact | **not started** (new themes and enemies can be read off §2's "New:" entries) |
| 9. Rollout | **partial**: the order is fixed in the notes at the end. |

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
| Hidden exits | 37 in total: 20 to secret levels, 2 to secret lands, 12 to Souvenir Stands (bonus houses), 2 secret flights (cross-country shortcuts), plus 9 secret-level exits that draw a shortcut path back into the main route. |
| Cross-country secrets | **Secret flights** (Devil's Cauldron 2-7 → Morocco, Montgolfière Skies 7-7 → Vietnam) and **Bottle Mail** (5 messages in bottles in coastal levels → the Postcard Lighthouse bonus house, which marks every undiscovered exit on the map). |
| New power-ups | 10 core items (§5) in a new HANDS slot; the existing HUD pack slot becomes the Backpack. |
| Save | new key `super-brady-o-world-save-v2`; all progress wiped; settings and look are copied over from v1 once. |
| Spec interface | `Tour.country()` v2 with `levels[].areas[]`, `gen`, `arch`, `node`, `exits`, ASCII `stamps`, `houses`, `map` (§7.2). Old fields (`style`, `script`) keep working so countries can migrate one at a time. |

**Tests that must change** (call-outs for the engineer): `tools/gameplay_test.js` line 285 asserts 68 levels (becomes 88 total, 68 main); `TourProgress.bossDone`, `complete()`, `Tour.isFinale` and the WORLDS `kinds` table use `C.levels.length` as the boss index and must use `C.mainCount`. The boss tests (`x-5`, `13-4`, `22-4`) and the secret-door tests (`8-4` → aq, `5-2` → w22) keep working untouched.

---

## 1. Archetype catalogue (30 + LAIR)

Tile = 32 px (`TS`). The view is 12 tiles tall (`VIEW_ROWS`), about 26 tiles wide in landscape. "Gen" is the layout generator (the `gen` key of an area, §7.2). Size is implementation size of the generator plus systems (S < 1 day, M 1-3 days, L 3-6 days).

| # | Code | Name | Spec | Gen | Dims (W x H) | Camera | First 10 seconds | Size |
|---|---|---|---|---|---|---|---|---|
| 1 | PARADE | Layered Street | Three stacked lanes run the whole level: rooftops (floor row 13), street (row 22), cellar or canal (row 26, under the street). Bouncy objects lift you up a lane, trapdoors drop you down; each lane has its own hazard; the lanes cross at two plazas where all three connect. | `layered` (new; `tourStrip` with `lanes:[13,22,26]` and per-step `lane:`) | 210 x 28 | side-scroll; vertical target = floor of Brady's current lane at 68 % of view (no chasing small hops) | You start on the street and the first awning throws you onto the roof lane; two lanes are visible on screen at once. | M |
| 2 | SKY | Sky Islands | No ground row. Islands 3-12 tiles wide hang in open sky; carriers (clouds, balloons, carpets, kites), catapults and updrafts link them; falling past the bottom row kills. | `islands` (new; strip with `st.sky=true`, `bottomKill`) | 190 x 30 | free vertical follow, Brady at 55 % of view height (tower rule) | Your first jump leaves the start island into empty sky and a carrier glides in under you. | M |
| 3 | FALL | Freefall Shaft | The level is a narrow shaft played top to bottom. Fall speed capped at 11 t/s, air steering x1.4; ledges, spike shelves, slow-down updrafts; checkpoints are wide ledges. | `shaft` (new; the climb builder run downward, `st.y` grows) | 22 x 160-170 | tower mode with Brady at **35 %** from the top (look-down) | Step off the lip and fall past three screens of coin rings. | M |
| 4 | HUB | Plaza Hub (and errand variant) | A plaza room with three doors to three short sub-areas, each built by a different gen; each sub-area ends in a stamp (a key) instead of a gate; three stamps open the plaza's exit lock. Errand variant: animal friends in the plaza trade items in a chain (each item is a key). | `room` + area graph | plaza 64 x 22; sub-areas 60-90 x 18-22 | plaza: camera clamps to plaza; sub-areas: normal | You land in a plaza with three visibly different doors and an exit gate showing three empty slots. | M |
| 5 | CARRY | Carry Run | Brady carries a fragile thing (hatchling, egg, lantern) from a start pedestal to the gate pedestal. While carrying: no attacks, jump x0.92 (about 3.4 tiles), Action sets it down (it can weigh down plates). Hurt, a fall of more than 6 tiles, or water: the item pops back to the last pedestal after 1.5 s. Pedestals double as checkpoints for the item. | `strip` + carry system | 180-190 x 20 | normal | Pick up the item, a sign explains; the first enemy is placed to be avoided, not stomped. | M |
| 6 | DOOM | Doom Chase | A huge pursuer (stampede cloud, lava flow, tidal wave) advances from the left at `chase.speed` (ramps +0.2 t/s per checkpoint). Not autoscroll: Brady can outrun it. Its front pushes Brady 3 tiles forward and costs 1 hit (not instant death). Periodic variant: the pursuer passes every `period` seconds and safe alcoves protect you (reuses `Play.updateChasers`). | `strip` + `chase` area prop (new `TourDoom` entity) | 210-250 x 18-22 | normal, 0.1-view look-ahead to the right | Rumble, screen shake, the wall bursts into view behind you. | M |
| 7 | THIEF | Thief Chase | A thief snatches Chinka's passport stamps at the start and flees along a route. Catch it three times (stomp or any hit); each catch drops one stamp and it flees to the next stretch. Three stamps open the gate lock. It waits and taunts if Brady is more than 12 tiles behind, so it can never be lost. | `strip` + `TourThief` (waypoints from `st.B.route`) | 210-220 x 20 | normal | A snatch gag, then the chase starts. | M |
| 8 | SWITCH | Switch World | Up to two toggle groups: switch objects flip block set A (solid) and set B (outline) per group. Each country skins the switch (water valve, wind brake). | `strip` + `toggles` | 190-220 x 20 | normal | The first switch is on the first screen, beside a gap that only closes when you flip it. | M |
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
| **1-1 Mercado Mayhem** · PARADE | `mercado layered 214x28` → `bodega room 40x14 (s, dark)` → `tienda gate (s)` | ① awnings bounce you between street and rooftop lanes; ② the melon cart rolls melons down the street lane while the roof lane breaks into gaps strung with papel-picado ropes; ③ the plaza: fountain jets, awnings and hanging piñata blocks (bump from below for candy) link all three lanes. | Kept: xolo, stalls, pinatas, melons, fountain, rooftops, bonus (→ bodega). New: trapdoor, piñata item block, papel-picado rope (Banner gimmick). Enemies: mxPepper, mxElote (popper), mxChihuahua (yapper). | M (street, col 20), Sig taco from Xolo, Paper Plane (roof lane before the plaza), hidden 1UP at start (kept) | Bodega: stomp the crate that sits on a trapdoor (chili dust puffs from the cracks). P1 roof lane over stall 3; P2 bodega shelf; P3 the top of the plaza fountain jet. Bodega back shelf is a FAKE wall → secret gate. | main → 1-2; secret → Souvenir Stand *La Tiendita* |
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
| **6-2 Pintxos Bar** · MINI | `barra strip 200x22` → `queso room 30x14 (s)` | ① toothpick bridges and bread-slice platforms on a giant bar counter in San Sebastián; ② olive-oil spills (slippery) and rolling olives; ③ a salt-shaker climb, octopus ink clouds, then a tortilla flipper (Pancake gimmick) to the exit. | New: toothpick bridge, oil spill (ice surface), tortilla flipper. Enemies: esPulpo (ink), esOlive (roll), esGamba (hop). | M, Bubble Wand, Shrink Cookie | Eat the Shrink Cookie to enter a mouse hole in the cheese wedge → queso → secret gate. P1 salt shaker top; P2 queso; P3 tortilla apex. | main → 6-3; secret → Souvenir Stand *La Tiendita de Pintxos* |
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
| **7-3 Mont-Saint-Michel Tides** · TIDE | `baie strip 210x22` → `bateau room 26x12 (s)` → `banc area 30x14 (s)` | ① low tide: walk the flats, quicksand pools slow and sink you; ② high tide comes fast (10 s): swim; ③ the tidal bore arrives as a moving front you outrun to the causeway. The abbey island is background only. | New: quicksand (sticky sink), tidal bore. Enemies: frCrab, frOyster (snaps shut), frGull. | Fins, M, Ice Lolly (freeze sea rafts) | A beached boat → bateau (P2). At low tide a tethered balloon shows on a sandbar: climb its rope → banc → secret gate. P1 causeway post; P3 bore sprint. | main → 7-4; secret → 7-7 |
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
| **8-4 Frozen Canals** · LAMP | `ijs strip 191x18 (dark)` → `bonus room (s, kept)` | ① skate by lantern light, relight at the koek-en-zopie stalls; ② thin ice cracks behind you; ③ skating in the dark with the light fading. | Kept: skate, thin, stall, bridge, secret. Enemies: nlSnowman, nlHerring. | M, Ice Lolly (refreezes thin ice), 1UP | The kept bonus room's FAKE wall → the **Antarctica gate**. P1 bridge; P2 bonus room; P3 thin-ice run. | main → 8-5; secret → **Antarctica** |
| **8-5 The Weigh House** · LAIR | `kaasmarkt strip 80x18` → `kelder room (s)` → `waag arena 30x18` | Lead-in: the cheese market: sledges on ramps, the chute. Arena for the Cheese King: two inward ramps 4 tiles high from both sides, the throne on a drawbridge on the right. | Kept: chute, scales, sledges, arena_waag (reshaped). Enemies: nlCheese, nlClog. | Sig bike, M | Cellar under the scales → kelder. P1 ramp top; P2 kelder; P3 scale pan. | main → Indonesia |
| **8-6 Windmill Row** · SWING (secret) | `molens islands 200x24` → `molen room (s)` | ① windmill sails as rotating platforms; ② tulip blooms bounce you between mills; ③ the wind reverses and every sail turns the other way. | Kept: windmill, tulips. Enemies: nlBee, nlGull. | M, Bubble Wand | Inside the last mill → room. P1 sail apex; P2 molen; P3 reversed-wind chain. | main → done, draws shortcut **8-6 → 8-4** |

### World 9: Indonesia (Bali and beyond)

| Level | Areas | Beats | Objects / enemies | Power-ups | Secrets & postcards | Exits |
|---|---|---|---|---|---|---|
| **9-1 Kuta Surf** · RIDE | `ombak ride 220x17` → `gua room 26x12 (s)` | ① surf the swells; ② lava-rock reefs with urchins; ③ a big set: launch off the lip for high coins. | Kept: gecko, surf, reef, pier, buoys, sandbar, lip, jukung. Enemies: idUrchin, idFlyfish. | Sig surfboard, M, S | A sea cave behind the pier pilings → gua (**Bottle #5**). P1 lip coins; P2 gua; P3 a buoy chain. | main → 9-2 |
| **9-2 Kite Festival** · GLIDE | `sawah islands 240x30` → `lumbung room 26x12 (s)` | ① grab kite tails to glide over rice terraces; ② rattling scarecrows and a duck parade as a moving bridge; ③ a kite relay in strong wind. | Kept: terrace, kites, ducks, scarecrows, paddy, hut. Enemies: idDuck, idScarecrow, idDragonfly. | Paper Plane, M, Bubble Wand | Rice barn on stilts → lumbung → secret gate. P1 tallest kite; P2 lumbung; P3 wind relay. | main → 9-3; secret → 9-6 |
| **9-3 Batur Eruption** · DOOM | `gunung strip 220x22 (downhill)` → `tambang area 30x14 (s)` | ① a lava flow chases you down at dawn; ② lava bombs (landing spot glows first) and hot rocks; ③ civets prowl the ash fields while the flow speeds up. | Kept: dawn, trail, bombs, hotrocks, fissure, lookout, civets. Enemies: idCivet, idBat, idGecko (wall crawler). | M, S, Ice Lolly (cools hot rocks) | A mine-cart track enters the mountain → tambang → secret gate. P1 lookout; P2 tambang; P3 fissure column. | main → 9-4; secret → 9-7 |
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
| **11-1 Sushi Carousel** · FACTORY | `kaiten strip 210x20` → `reizōko room 26x12 (s)` | ① plates carry you along the belt; ② giant chopsticks grab from above, tea-cup steam lifts you; ③ reversing belts, and some plates are tanuki in disguise. | Kept: shiba, counter, wheel, chopsticks, teacup, soyjumps. Enemies: jpTamago, jpTako, jpWasabi, **jpTanuki (mimic)**. | Sig nunchucks (Shiba), M, 1UP | Cold mist from a fridge door → reizōko. P1 wheel top; P2 fridge; P3 chopstick ride. | main → 11-2 |
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
| **12-2 Yak Caravan Pass** · ROLL | `bhanjyang strip 220x22` → `khadal area 30x14 (s)` | ① push a snowball that grows; ② ride it over ice; ③ a full-size ball smashes snow walls while marmot sentinels whistle. | Kept: slope, snowwall, marmots, icy, pen. Enemies: npMarmot, npSnowball, **npYeti (frost breath)**. | Sig yak, M, Ice Lolly | The crevasse lip at the third snow wall → khadal → secret gate. P1 snowwall top; P2 khadal; P3 ride the full ball. | main → 12-3; secret → 12-6 |
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
| **22-2 The Endless Corridor** · MAZE | `corridor maze 78x42` | ① doors that loop; ② hourglasses slow time near them; ③ count the doors: the 22nd one is different. | Kept: corridor, doors. Enemies: w22Hourglass (time slower), w22Envelope (fake postcard). | M, L | The 22nd door → secret gate. P1 gallery; P2 a dead-end cell; P3 loop room. | main → 22-3; secret → 22-5 |
| **22-3 Mirror Lake** · FLIP | `lake strip 164x18 (mirror: played leftwards)` → `under room (s)` | ① stepping stones; ② fall through the lake surface and walk your reflection upside down; ③ swap above and below in mid-air. | Kept: lake, stairs, mirror. Enemies: w22Moth, w22Alarm. | M, S | A reflection-only door → room. P1 stones; P2 under; P3 a mid-air swap. | main → 22-4 |
| **22-4 The 22nd Door** · LAIR | `echo hall strip 60x18` → `arena door 26x18` | Lead-in: your echo follows you down the hall. Arena (kept): the mirror line and the clock. | Kept: arena_door, echo, clocks. | M, Pocket Sundial | P1/P2/P3 in the hall (P2 behind a mirror). | main → done |
| **22-5 The Writer's Desk** · MINI (secret) | `desk strip 200x22` → `drawer room (s)` | ① tiny Brady crosses typewriter keys (beat blocks that press down); ② ink pots and crumpling pages; ③ paperclip springs to the top of the coffee cup. A nod to Brady's novel *22*. | New: typewriter key, paperclip spring. Enemies: w22Envelope, w22Moth. | M, Paper Plane | An open drawer → room. P1 key row; P2 drawer; P3 cup rim. | main → done |

---

## Decisions for the unfinished sections (binding notes)

### For §3: map graph and save
- **Per-level spec fields:** `n`, `secret: true` on secret levels, `node: {x, y}` (0..1 inside the island panel), `path: [[x, y], …]` (waypoints from the previous node), `exits: { main: { to }, secret: { to, hint } }`.
- **What `to` can be:**
  - `'1-6'`: a level
  - `'house:<id>'`: a Souvenir Stand
  - `'land:aq'`: a secret land
  - `'flight:ma'`: a secret flight; it unlocks that country's level 1
  - `'node:1-5'`: a shortcut path
  - default for a boss: the next country
- **Unlock rule:** a level is unlocked if any exit pointing to it has been taken.
- **Boss index:** the boss is the last level without `secret`; `C.mainCount` replaces `levels.length` in `bossDone`, `complete`, `isFinale` and WORLDS.
- **Countries:** each gets `map: { look, landmark, fort, start }` and `houses: [{ id, kind: 'stand', node, path, stock }]`.
- **Save:**
  - key `super-brady-o-world-save-v2`; settings and look are copied once from v1.
  - fields: `done`, `unlocked`, `gold`, `best`, `exits: { id: ['main', 'secret'] }` (keep writing `secretExits` too).
  - `tour: { at, seen, freed, lands, cards, revealed, paths, flights, bottles, houses }`.
  - the existing `pack` is the Backpack.
- **Souvenir Stands (12):**
  - one each in mx 1-1, ec 2-4, br 3-2, mz 4-1, ma 5-3, es 6-2, fr 7-4, nl 8-1, id 9-4, vn 10-2, jp 11-3, np 12-1, plus aq 13-3.
  - each is a one-screen shop: pick 1 of 3 items into the Backpack; it restocks after every level clear.
- **Bottle Mail:** bottles in 2-6, 3-4, 4-4, 6-6 and 9-1. Each found bottle draws a sea-current line on the world map. All five reveal the **Postcard Lighthouse** house (lon -30, lat 5), which flags every node that still has an undiscovered exit.
- **Hints:** every hidden exit has an in-level tell (draft, cracks, bubbles, rainbow, an animal heading in). After the first clear, the map node shows exit pips (●○).
- **Panel animations:**
  - revealed paths draw as a growing dashed line (1.0 s); the node pops (0.45 s, overshoot to 1.25); a banner reads SECRET LEVEL / SHORTCUT / SOUVENIR STAND.
  - code-drawn Brady walks node to node along revealed paths at 160 px/s.
  - each country has its own boss-fort icon.
  - reduced motion: instant fades.
- **World map:**
  - the plane flies curved legs.
  - a cleared country's landmark regrows on its pin (scale 0.4 to 1, sparkles).
  - the Baron's airship sits on the next uncleared country.
  - secret flights show as gold dotted arcs (ec→ma, fr→vn).
  - the Antarctica pin cracks in; the World 22 pin flickers as a ghost until opened.

### For §4: enemy behaviour library (one headline per country)
- **The library:**
  - splitter, regrower, camouflage, burrower, trail-layer, salt-platform sneezer, inhale/blast, ceiling-dropper, wall-crawler, inflater, delayed pouncer
  - item thief (steals gear, then the signature item, then the power level; a hit returns it)
  - time-slower, shield/curl, mimic, grabber (never carries Brady over pits), echo replayer, stacker, boomerang, swarm/conga
  - platform eater (eaten tiles regrow after 6 s), alarm caller (wakes sleepers within 12 tiles), frost breather (ice floor; enemies frozen into kickable blocks)
  - light-frozen, ink blot, tongue grab, ball pusher, sleeper, blinker
- **Every attack has a tell of at least 0.4 s.**
- **Headlines:**
  - mx: axolotl regrower
  - ec: iguana salt sneezer
  - br: sloth ceiling-dropper
  - mz: dung-beetle ball pusher
  - ma: carpet-moth platform eater
  - es: stork grabber
  - fr: rooster alarm caller
  - nl: tulip-bulb burrower
  - id: macaque item thief
  - vn: nón boomerang hat
  - jp: tanuki mimic
  - np: yeti frost breath
  - aq: penguin conga
  - w22: echo replayer
- **frMime is replaced by frPoele**, a walking crêpe pan that throws crêpes like boomerangs.

### For §5: power-ups
- **The 10 new core items:**
  - **Paper Plane:** glide, and throw it to hit switches.
  - **Hard Hat:** headlamp, breaks bricks and dashes, absorbs one hit.
  - **Shrink Cookie:** 20 s at half size; fits mouse holes.
  - **Magnet Belt:** pulls coins and items for 30 s.
  - **Flipper Fins:** swim x1.6 and a water dash.
  - **Cardboard Box:** crouch to hide.
  - **Kazoo:** a stun cone; breaks glass and rings bells.
  - **Bubble Wand:** traps enemies in bubbles that become platforms.
  - **Pocket Sundial:** the world runs at 50 % for 8 s.
  - **Ice Lolly:** 12 frost puffs; freezes water and enemies.
- **Slots:**
  - FORM: small, big or joint.
  - HANDS: one gear item *or* the signature item; picking up another sends the old one to the Backpack.
  - BUFFS: star, LSD, sundial, shrink, magnet.
- **When Brady is hit:** the star blocks it; otherwise the Hard Hat absorbs it; otherwise HANDS gear drops and floats for 2 s (it can be grabbed back); otherwise FORM goes down.
- **THROW priority:** LSD lasers, then the HANDS action, then joint puffs.
- **Budget per level:**
  - at least 2 opportunities, at most 5 item blocks
  - the first within the first 25 % of the level
  - the gear that matches the archetype comes from a stand (an infinite dispenser) before the twist beat
  - one premium item (L, S, sundial or 1UP) in a secret or risky spot

### For §6 and §7: validator and engine
- **Validator v2 additions:**
  - **virtual keys** `B.vkey(id, tiles, all)`: levers, plates, mirrors, lanterns, gear stands (`gear:hat`), thief catches, carry delivery
  - **one-way edges** `B.edge(from, to, area)`: zip lines, catapults, cannons, balloons, rail forks, teleporters
  - **toggle groups**: switch tiles; `auto` for tide and timed phase; the search state includes the toggle bits (at most 3 groups)
  - **flip zones** simulated with gravity sign (standable checks the ceiling)
  - **carry physics**: jump x0.92 from pickup to pedestal
  - **pace check**: shortest path vs chaser, rise or timer, with a 25 % margin
  - **coverage**: every spec exit, every area and 3 postcards reachable
  - **soil** digs downward
  - **rule tests**: archetype uniqueness and caps, the climb cap, and the per-level budget
- **Build order:**
  1. Save v2 and spec normalisation (S)
  2. Area-graph builder with `areas: [{ id, gen, theme, script | stamp, … }]` and backward-compatible `style` (M)
  3. ASCII stamp piece and legend (`#` ground, `-` semi, `?` item, `F` fake, `h` hidden, `S` soil, `<` `>` conveyors, `D` door, `G` / `g` gates, `@` anchor; letters via the per-stamp legend) (M)
  4. Generalised exits on gates (`exit: 'main' | 'secret'`) and TourProgress v2 (M)
  5. Validator v2 (L)
  6. Map graph in `28_tour_f_map` and data-driven `28_tour_fa_landscape` (L)
  7. New gens: layered, islands, shaft, room, rail, rise, dig, maze, climb variants (L in total)
  8. Area systems: tide water line, flip gravity, phase themes, lamp radius, doom chaser, vertical autoscroll, carry (L)
  9. Objects in a new `28_tour_h_objects.js` (M-L)
  10. Behaviours in a new `28_tour_i_behave.js` (M)
  11. Powers and HANDS in `28_tour_c_powers` and `11_player` (M)
  12. Tests: `validate_levels` (88 levels), the `gameplay_test` count, a new `map_test`, a save-migration test (M)
- **Files touched:** `00_core` (Save key only), `07_physics`, `08_levels`, `09_validate`, `11_player`, `12_play`, `28_tour_a/b/c/d/f/fa`, new `28_tour_h/i/j`, `tools/*`.

### For §8: art
- Reuse each country's existing themes for sub-areas; the cave variant serves secret rooms.
- New themes are only the ones marked "New" in §2: roughly 2-3 backgrounds per country, the vertical shafts (FALL and RISE) needing vertical background strips.

### For §9: rollout
1. Engine steps 1-6.
2. Pilot Mexico and Ecuador; show Brady.
3. Then br, mz, ma, es, fr, nl, id, vn, jp, np, aq, w22. Countries can be built in parallel once the spec interface is frozen.
