# Super Brady-O World: secret rooms, off-level warps and the Baron's Rulebook

> **Brady's decisions, 16 Nov 2026 (these override the text below wherever they differ):**
> - Backstage theme: yes. Warps may jump up to two lands ahead: yes. The three bonus lands (Festival Fields, Lost & Found, The Red-Eye): yes. A Settings switch for hats and dancing: yes.
> - **Player-facing names:** Road Cases are called **Wormholes**; Ban Buzzers are called **Brady Buttons**. Keep code identifiers neutral (`warp`, `button`).
> - **The villain is no longer the Baron.** He is **Piwi Squirmin'**, a ventriloquist-dummy villain who has stolen Brady-O's beloved wife **Chinka-O** and drags her around the world; Brady-O chases him to get her back. Wherever this document says "the Baron" or "the Baron's Rulebook", read Piwi Squirmin'. Story and character sheet: `docs/design/STORY_PIWI.md` (being written).

Design spec, 16 Nov 2026. Read from `main` at `c3ed88a`. **This is a design document: no game code was written and nothing in the repo was changed.** Implementation agents build from this file alone, together with the docs it points to.

Brady's four requests, restated:
1. More kinds of secret rooms.
2. Hidden places off the edges of a level that send you to other levels and lands.
3. Big hidden buttons that change things across the whole game and open extra lands and levels. These must be **our own design**: nothing like coloured switch palaces, dotted-outline blocks that turn solid, a star-shaped bonus world, or any name or look borrowed from another game.
4. Every land's map should look different. The map agent builds that. This document only says how the new secrets show up on the maps (§6.4).

The three systems, by name:

| System | What it is |
|---|---|
| **Secret room types** (§2) | Eight new interiors with their own rules. Today every secret room is the same shelf room. |
| **Backstage and Road Cases** (§3) | Each level is a stage set. Off its four edges are hidden **Backstage** areas: the **Rigging** above, the **Loading Dock** past the exit, the **Under-Stage** below a pit, and the **Wings** before the start. In them, a stencilled touring **Road Case** ships Brady to another level or land. |
| **The Baron's Rulebook** (§4) | The Baron has banned fun worldwide. Six hidden **Ban Buzzers** marked DO NOT PRESS are hidden in the game. Slapping one revokes one of his rules. Each revoked rule changes something across the game (hats on every animal, everything dances, maps change, freight routes wake up) and opens extra content: 3 bonus lands and 2 bonus levels, **14 new levels** in all. |

---

## 1. Inventory: what exists today

### 1.1 How secrets are written in the level format

Format reference: `docs/design/LEVEL_OVERHAUL.md` §3 and §7, and `docs/design/TOOLKIT_STATUS.md`.

| Secret | How it is specified | Code |
|---|---|---|
| **Secret room** (about 90 in the game, at least one in every level) | An area `{ id, gen: 'room', role: 'secret', stamp }` joined by a door whose target is `'area@anchor'`. The stamp holds coins, an item block (`?`), a postcard spot (`*`) and a door back (`D`). Some rooms also have a secret gate (`g`). | Area roles: `src/28_tour_bb_gens.js:23-45`. Door refs are resolved at `:47-57`. Example stamps: `src/29_tour_mx_levels.js:497-643`. |
| **Secret entrances** | Generic pieces: `secretDoor { look: 'fake' \| 'curtain' \| 'painted' }` (a fake-wall section with a dust-draft tell, or a curtain) and `trapdoor { crate }` (stomp the crate, press down). About 60 country pieces wrap a hidden door, for example `willowDoor`, `airPocket`, `floorCrack`, `vaultDoor`, `nestHole`, `hollowTree`, `tetherBalloon`, `fridge`, `mastHatch`, `bigClock`. Each one spawns `portal { look: 'tourDoorHidden', secretDoor: true }`. | `src/28_tour_bb_gens.js:289-310`. Country pieces are in `src/29_tour_<cc>_levels.js` (e.g. `29_tour_mx_levels.js:239, 311, 332, 388`). |
| **Secret area that is not a room** | Any gen can be given `role: 'secret'`. Example: 1-3's `grieta`, a swim area that ends in a secret gate. | `29_tour_mx_levels.js:784` |
| **Exits** | `exits: { main: { to }, secret: { to, hint, need } }`. Any other key works too, because the gate's `exit` key is free-form. Targets are parsed by `Tour.target`: `'1-6'` (a level), `'node:1-5'` (a shortcut), `'house:<id>'` (a Souvenir Stand), `'land:aq'` (a secret land), `'flight:ma'` (a secret flight), `'country:next'`. | `src/28_tour_a_core.js:121-139, 215-228`. Gate exit keys: `src/28_tour_b_build.js:529-545`. |
| **Hidden exit to a secret level, stand, land or flight** | As above. `TourProgress.exit()` records `Save.data.exits[id][key]` and queues reveals (`path`, `stop`, `house`, `land`, `flight`) for the map. | `src/28_tour_a_core.js:307-357` |
| **Postcard-gated door** | `gate { need: 22 }`. World 22's door in 5-2 shows a toast and remembers the door, which lights the "22?" ghost pin. | `src/28_tour_b_build.js:528-545` |
| **Legacy bonus room** | The `bonus` and `secret` pieces build a fixed 36x14 room. The `secret` version has a FAKE far wall with a secret gate behind it. | `src/28_tour_b_build.js:422-505` |
| **Hidden blocks, fake tiles, light-only stones** | `T.HIDDEN` (stamp `h`, `itemBlock { hidden }`) and `T.FAKE` (stamp `F`). Light-only tiles (`hide: 3`) show only inside a light. LSD shows secret ledges. | Stamp legend: `src/28_tour_j_stamps.js`. Light-only tiles: `TOOLKIT_STATUS.md` "Area systems". LSD: `src/11_player.js:143`, `src/12_play.js:1005`. |
| **Postcards** | Three per level. Spot kinds are `must`, `hidden`, `risky` and `high`. P2 normally sits in the secret room. | `src/28_tour_bb_gens.js:113-152` |
| **Shortcuts** | A secret level's main exit `to: 'node:<id>'` draws a gold trail. | `TourProgress.exit` |
| **Souvenir Stands** | `houses` on the country. The room is built by `Tour.houseLevel`, and the `shop` piece sells three items. | `src/28_tour_fb_mapgraph.js:40-76` |
| **Bottle Mail and the Postcard Lighthouse** | `bottle { n }` pickups in 2-6, 3-4, 4-4, 6-6 and 9-1. All five reveal the lighthouse, which flags every stop that still has an undiscovered exit. | `TOUR_BOTTLE_LEVELS` in `28_tour_fb_mapgraph.js:103`. Route map: `28_tour_f_map.js:521-585`. |
| **Secret flights and lands** | 2-7 flies to Morocco, 7-7 flies to Vietnam. 8-4 opens Antarctica, 5-2 opens World 22. | LEVEL_OVERHAUL §3.3. `TourProgress.countryUnlocked` |
| **Maze dead ends, the lantern shop** | 5-1: stand under the unlit lantern and the back wall slides away. | `src/29_tour_ma_levels.js:178` |
| **Map tells** | Exit pips (● found, ○ missing) after the first clear. Gold secret trails. Reveal banners: SECRET LEVEL!, SHORTCUT!, SOUVENIR STAND!, NEW LAND!, SECRET FLIGHT!. | `28_tour_fd_overworld.js:432-444`, `28_tour_fb_mapgraph.js:130-164` |
| **Validator rules** | Every exit key in `exits`, all 3 postcards and every area must be reachable. "No secret area" is a warning. Budget rule 5 says a premium item should be tucked away (a warning until release). | `src/09_validate.js`, `tools/validate_levels.js:9-38` |

**Fair hiding rules** (LEVEL_OVERHAUL §3.1; still binding):
1. The tell is visible from the main route.
2. No power-up is needed that the level doesn't hand out.
3. The secret is never more than one screen off the main route.
4. The map shows exit pips after the first clear.

### 1.2 What is missing (why Brady asks)
- **The rooms all play alike.** The entrances vary a lot, but nearly every interior is the same one-screen "pantry": coin rows, two one-way shelves, a `?` block, a postcard, a door back. Compare `bodega`, `boveda`, `despensa` and `nido` in `29_tour_mx_levels.js`.
- **Nothing lies beyond the edges.** In `tileAt` (`src/07_physics.js:37-41`) the left and right edges are solid, the space above row 0 is empty air, and falling below the area kills (`src/11_player.js:440`). The camera clamps to the area (`src/12_play.js:469-524`). "Off-level" places need new engine support (§3.3).
- **No secret changes anything outside its own level**, except opening a land or a flight.

---

## 2. Eight new secret room types

Each type is an area with `room: '<type>'` and its options under `A[<type>]` (§5.1). Most reuse toolkit pieces. New code lives in **one new file, `src/28_tour_l_rooms.js`** (owned by WP-4). Entrances stay as they are: any existing secret entrance can lead to any room type.

Ground rules for every type:
- **No soft-locks.** Brady can always leave by the door he came in.
- **Timed rooms never kill.** When time runs out, they end with a friendly ejection.
- **Every room shows its rule on entry:** a 1.5 s banner plus a sign. Rooms also hold P2 or a premium item, as rooms do today.

### 2.1 Closing-Time Shop
**What it is.** A local shop after hours, its shutters half down. A keeper animal snores behind the counter, for example Xolo, or the coati in Brazil. When Brady steps in, a wall clock starts a 12-second countdown and the shutters begin to roll down shelf by shelf. Brady grabs what he can: coin stacks, item blocks on high shelves, and P2 on the top shelf. At zero the keeper wakes up, says "¡CERRADO!" (or the land's equivalent) and politely sweeps Brady out of the door with a broom.

**How it plays differently.** Speed and route choice inside one screen, against a clock. You can't take everything, so a second visit plays differently. The shutters always close the highest shelves first.

**Reward.** Coins (a full run pays out about one 1-up), one premium item, and P2.

**Engine.**
- Reuse `timedDoor` for each shutter and the stamp `?` blocks.
- Reuse the `souvenirShop` art for the counter and keeper.
- New: a `roomClock` entity. It starts on entry, draws the clock and closes `shutter` groups in order. At 0 it fades and moves Brady to the room's door anchor (no death, no hit). It re-arms each time the room is entered.
- Validator: shutters are treated as open, because time isn't simulated, the same as boss fights.

### 2.2 Fairground Stall
**What it is.** A one-screen fairground game run by an animal barker. There are two variants:
- `whack`: local critters pop out of holes in the counter (axolotls in Mexico, mole-rats in Mozambique, herrings in the Netherlands). Brady stomps or headbutts eight of them in 20 seconds.
- `shy`: coconut-shy style. Brady throws his action power at stacked cans and fruit targets. Knocking all of them down wins.

A big scoreboard counts the hits.

**How it plays differently.** A score attack, not a platforming route. It is the only room where you play against a target number, and you can retry by walking out and back in.

**Reward.** On a win, the prize shelf's lock drops: a 1-up, a premium item or P2. Losing gives a consolation coin and the barker's raspberry.

**Engine.**
- New: a `stallGame` controller entity (`game`, `critter`, `need`, `t`, `prize`), pop-hole critters (a tiny actor that wraps `TourEnemy` with a pop-up state), and a scoreboard.
- Reuse the stamp `lock` with the new `needsAll` (§5.6) for the prize shelf.
- Validator: the prize lock opens from a `vkey` on the counter tile. The game itself isn't simulated.

### 2.3 Bouncy Castle
**What it is.** An inflatable festival bouncy castle shaped like a local icon: a piñata donkey in Mexico, a tortoise in Ecuador, a tulip in the Netherlands. The floor and walls bounce, and you can never stand still on them. Solid "turret" ledges in the corners are the only resting spots. Coins hang in arcs near the soft ceiling, and the postcard sits in the highest turret.

**How it plays differently.** Momentum control instead of precise jumps. Holding jump on the bouncy floor builds height, and you steer in the air to the turrets.

**Reward.** Coins, P2, a hidden 1-up in a turret.

**Engine.**
- Reuse the stamp `b` (ground with a bounce surface), `bouncePad` and coins. The validator already treats bounce tiles as unstandable and springs as launchers, so the turrets give it its resting spots.
- New: an inflatable room skin (the `skin` per country) and a soft-ceiling tile look (reuse `SEMI` from below with a cushion skin). Code is very small. Most of the work is art.

### 2.4 Evidence Locker
**What it is.** A corner of the Baron's customs office, where his wind-up tin guard-dogs patrol a shelf of confiscated things: piñatas, kites, cheese wheels. Searchlights sweep. Brady sneaks from crate to crate to the "SEIZED" cage and takes the item back. Being seen sounds a klaxon that drops shutters for 6 s and lets two more tin dogs out. It's never death.

**How it plays differently.** Stealth in one screen: read the sweep, wait, move. Combat is pointless here, because the tin dogs are stomp-proof (they curl).

**Reward.** One "confiscated" Backpack item returned, plus P2. It is also the hiding place of one Ban Buzzer (5-1, §4).

**Engine.**
- Reuse `watcher { kind: 'guard' }`, `hideSpot`, `alarmShutter` and the `curlShield` behaviour, all from SNEAK (`28_tour_hb_systems.js`, `28_tour_i_behave.js`).
- New: the tin-dog skin and the seized-cage pickup (a pedestal skin).
- Validator: already passes SNEAK levels.

### 2.5 Recipe Kitchen
**What it is.** A tiny kitchen run by an animal cook: a hen in Mexico making mole, a stork in the Netherlands making stroopwafels. The cook names three ingredients, and they are scattered around the room on shelves, in a jar on a high hook, and under a sleeping cat. Brady carries them one at a time to the pot. While carrying, the CARRY rules apply: lower jumps, and the ingredient pops back when Brady is hit.

**How it plays differently.** A small errand puzzle: the order matters, and so does which shelf you can reach while carrying.

**Reward.** The dish. It is the country's signature item or a 1-up, served with a song, plus P2 on the plate rack.

**Engine.**
- Reuse `pedestal { deliver }`, the `carry` area system and keys.
- New: a `cookPot` entity that takes named ingredients and counts them, the cook friend, and a lock with `needsAll: ['ing:chili', 'ing:cacao', 'ing:tomato']` (§5.6).
- Validator: the ingredients are modelled as keys, and the reward lock opens when all of them are held.

### 2.6 Topsy Attic
**What it is.** A dusty attic where everything has "fallen up": furniture, rugs and a hanging lamp all sit on the ceiling. A painted threshold line in the doorway flips gravity, so Brady walks the ceiling among chairs and trunks. A second line midway flips him back down onto the "real" floor, where coins rest on the underside of furniture.

**How it plays differently.** The FLIP mechanic, but as a small spatial puzzle you look at upside down: which surface is the floor right now?

**Reward.** P2 tucked in an upside-down drawer, a premium item.

**Engine.**
- Reuse the `flipline` piece and flip zones. Note that flip bands must not contain moving platforms (TOOLKIT_STATUS deviation).
- New: only a stamp helper that mirrors decor onto the ceiling, and attic decor.

### 2.7 Hourglass Well
**What it is.** A narrow, tall well, 22-28 wide and about 40 high. The moment Brady lands at the bottom, sand starts pouring in from a giant hourglass neck at the top and the floor of sand rises. He climbs ledges, rope rungs and jar stacks to the rim before the sand catches him. Being caught **isn't death**: it costs one hit and the sand spits him back out of the entrance.

**How it plays differently.** A short vertical race. It is the only secret room where the room itself chases you.

**Reward.** A premium item and P2 at the rim, and a coin shower from the hourglass when you get there.

**Engine.**
- Reuse the `rise` gen with `risingWater`-style motion and a sand look.
- New: `rise.soft: true` (a catch is a hit plus a respawn at the room's `in` anchor, not a kill).
- Validator: per-area pace must run on this area (§5.6). Today pace only checks `areas[0]` (`src/09_validate.js:233-247`).

### 2.8 Treasure Map Room
**What it is.** A small cartographer's den, kept by a parrot or a tortoise, with a torn map pinned to the wall. Picking up the map plays a 2-second "peek": the camera shows where the X lies **in the level's main area**, marked by a scuff of soil or sand that wasn't special before. Back in the main area, the X now sparkles. Stomping it (or using Pound Cake) digs up what's buried.

**How it plays differently.** The secret changes the main level after you leave the room. This is the only type whose reward is outside the room.

**Reward.** Under the X: a chest with a premium item or a 1-up, or (in a few levels) the hatch to an Under-Stage (§3).

**Engine.**
- Reuse `keyLock`: the map is a `key` with a treasure-map look, and the X is a `lock` of soil tiles. Keys are level-wide in the game (`g.keys`, `src/10c_gimmicks.js:201-217`), and `held` is level-wide in the validator, so a key in one area opens a lock in another.
- New: the key and lock skins, and the 2 s camera peek (a scripted pan to the lock's tile and back, via the `TourHooks.peek` hook in §5.6).

### 2.9 Variety rule
`validate_levels --rules` gains a check:
- Each land uses at least 3 different room types, counting the old shelf room as type `pantry`.
- No new type appears more than twice in a land.

This is a warning while rollout is in progress and an error at release.

---

## 3. Off-level warps: Backstage and Road Cases

### 3.1 The idea
Every land is staged like a touring show, with Brady as the act. Behind each level's visible edges is the **Backstage**:
- the back of the painted scenery flats (the country's skyline seen from behind, with struts and sandbags)
- rigging, work lights and gaffer-taped cables
- the Baron's wind-up **stagehand mice** pushing props around (harmless; they squeak and scatter)
- stencilled **Road Cases**, flight cases on castors labelled with a destination: `FRAGILE — SHIP TO: ECUADOR`

Brady climbs into an open case and is shipped. The lid slams, a FRAGILE stamp lands on it, and the case rolls off on a dolly into a cargo hold. Then the map shows the case arriving where it was labelled.

The four Backstage zones, one per edge:

| Zone | Edge | How you get there | What it feels like |
|---|---|---|---|
| **Rigging** | above the top | A launcher (vent, updraft, bouncy awning, cannon, spring) next to a gap in the ceiling throws Brady **off the top of the screen**. | Catwalks, lighting bars and sandbag counterweights over the set. |
| **Loading Dock** | past the exit | Go **over or under the gate without touching it** and keep walking right off the end. | A ramp, road cases and a crew golf cart. |
| **Under-Stage** | below a pit | Drop into **one specific pit** that has a soft landing under it. | The trap room under the stage: crash mats, a lift ram, cables. |
| **Wings** | before the start | Walk **left off the start**, past a curtain flap. | The side of the stage: a prop table and the costume rail. |

### 3.2 How the player finds them (fair-hiding rules apply)
Every seam has a tell that is visible from the main route. Generic tells, any of which can be skinned per land:
- **Rigging:** a rope or sandbag dangling into the top of the view. Streamers, smoke or a plume rising off-screen. A bird flying up out of view.
- **Loading Dock:** "CREW ONLY →" stencilled arrows on the side of a scenery flat. A crew cart or animal that keeps going past the gate. Crates stacked as a step over the gate.
- **Under-Stage:** a corner of a crash mat glimpsed at the bottom of the pit. Feathers or bubbles rising out of it. A pit painted differently (no spikes, a different rim). The pit must never look like the ordinary deadly pits of that level.
- **Wings:** a curtain flap moving at the left edge. An animal walking off left at the start. A stagehand mouse that runs left.

Rules:
- At most one seam per edge per area.
- A seam is never needed to finish the level.
- The Under-Stage pit is the only non-deadly pit in its area, and it must look different (validator check, §5.6).

### 3.3 Camera and level bounds
- **The main area keeps its bounds and camera exactly as today.** The player cannot peek beyond the edge, which is what makes it feel "off the level".
- **Backstage areas are separate areas** (normal v2 areas, usually `gen: 'room'` or a short `strip`), joined to the main area by **seams**. A seam is an invisible span on one edge of an area:
  `area.seams = [{ side: 'top' | 'bottom' | 'left' | 'right', a, b, toRef, target }]`
  Here `a..b` is the tile span along that edge.
- **Crossing a seam** (all handled by the `seam` hook in `Play`, §5.6):
  - **top:** Brady's whole body is above y = 0 (`p.y + p.h < 0`) inside the span.
  - **bottom:** his top passes `A.H * TS - 8` inside the span. This is checked **before** the pit-death line in `src/11_player.js:440`, so the seam wins.
  - **left / right:** he presses against x = 0 (or the right edge) inside the span. `tileAt` returns HARD outside the area, so he can't fall out. He just pushes into the edge.
- **The swap.** No fade to black. A 0.25 s "curtain whip" (a dark velvet wipe in the travel direction), then `loadArea` into the target with **velocity kept**:
  - **Top seams arrive from below.** Brady rises through a one-way trap in the target's floor.
  - **Bottom seams arrive from above,** onto a crash mat (a bounce surface).
  - **Side seams** walk him in from the matching side.
  
  The camera snaps (`camTargetY(true)`) and the area music cross-fades to the shared backstage loop.
- **The way back.** Every backstage area has a return seam or door to the main area at a named anchor, for example `crater@riggingDrop`. The Rigging usually returns by a rope slide down a `bottom` seam onto the stage, and the Loading Dock by a stage door. Dying backstage respawns Brady at the last checkpoint as usual.
- **Seams are not allowed in:** autoscroll and rail areas (the screen edge would fight the seam), boss arenas, flip bands, and CARRY areas.

### 3.4 Road Cases (the warps)
- A `roadCase` entity: the case's lid is open and its stencil shows the destination label.
- Brady presses **Up** at the case, the same as a door. A plain touch doesn't trigger it, so you can't take one by accident.
- It behaves like a gate with an exit key, `exit: 'case'` (or `'case2'`). The level counts as cleared through that exit, exactly as a secret gate does today.
- **Transit:** the lid slams, FRAGILE is stamped, and the case rolls away. The results screen says **SHIPPED!** instead of COURSE CLEAR.
- **Where it lands:**
  - **In-land target:** the map walks the case along a new **freight trail** (§6.4) to the target stop, the case pops open and Brady hops out.
  - **Other-land target:** the world route map draws a brown stencilled **freight line**, the plane flies, and Brady arrives at the target stop (not the airstrip). On arrival, a freight trail from that stop to the land's airstrip opens too, so he is never stranded on a map whose trails are still closed.
- **Arriving early in a land** (the same as a secret flight):
  - The target level and its land unlock.
  - Nothing earlier is marked done.
  - The target's secret stop is revealed on its land map.
- **Cases inside bonus lands** lead back to the level whose buzzer opened them.

### 3.5 The warp table (21 active + 6 dormant)

Notes for the table:
- "→ secret" means the case unlocks and reveals a secret level of another land early. Its normal hidden exit still works too.
- Cross-land cases go **at most two lands ahead**, except the second door into Antarctica (open question 2).
- No case enters World 22: the 22-postcard door stays the only way in.

| # | Source level | Zone | Tell (from the main route) | Case label → target |
|---|---|---|---|---|
| R1 | 1-1 Mercado Mayhem | Loading Dock, past the fiesta stage | "CREW ONLY →" on the stage flat; a hand-truck of crates rolls off right as Brady reaches the dais; crates stacked over the gate | VOLCÁN → **1-4** (in-land skip) |
| R2 | 1-4 Volcán Escape | Rigging, above the crater rim | a sandbag on a rope hangs into the top of the view; the last vent's plume shoots off the top | ECUADOR → **2-7** Devil's Cauldron (which holds the Morocco flight). **Ban Buzzer 1** is here too. |
| R3 | 2-1 Hemisphere Hop | Wings, left of the start | the yellow equator line runs off-screen left and a booby waddles after it | GALÁPAGOS → **2-6** (in-land secret) |
| R4 | 2-3 Booby Dash | Loading Dock, past the finish | Pata Azul overshoots the finish and keeps running | BRAZIL → **3-6** Rio Hang-Glide |
| R5 | 3-1 Samba Sunrise | Rigging | the last confetti cannon fires streamers off the top; a rope ladder dangles | MOZAMBIQUE → **4-6** Buried Dhow. **Ban Buzzer 2** is here. |
| R6 | 3-4 Lençóis Lagoons | Under-Stage, a lagoon at low tide | one lagoon swirls like a drain and feathers float up out of it | MOROCCO → **5-6** Carpet Skies |
| R7 | 4-1 Ostrich Dash | Loading Dock | the ostrich overshoots the finish | HATCHLINGS → **4-4** (in-land skip) |
| R8 | 4-3 Baobab Skyline | Rigging | a weaver nest bounces a hornbill off the top; a kite string tied to a crown runs up | SPAIN → **6-7** Molinos |
| R9 | 5-3 Chefchaouen Blue | Under-Stage | a blue-painted manhole in one pit; at night cats peer down it | FRANCE → **7-6** Seine Chase |
| R10 | 6-3 City of Arts by Night | Loading Dock | a crew golf cart drives off right past the gate | AQUARIUM → **6-6** (in-land) |
| R11 | 6-4 Teide Updrafts | Rigging | the strongest fumarole plume goes off the top with a kestrel riding it | NETHERLANDS → **8-6** Windmill Row |
| R12 | 7-4 Truffle Hunt | Under-Stage: **dig through the bottom row** | the truffle pig sniffs at the deepest soil and it sparkles | ANTARCTICA → **13-5** Egg Express (a second way into Antarctica) |
| R13 | 7-1 Paris Morning Rounds (`toits`) | Rigging | chimney smoke and pigeons rise off the top | BALI → **9-6** Orangutan Canopy |
| R14 | 8-3 Bike Lane Rush | Under-Stage, a canal gap | a bike-fishing hook dangles into one canal gap; bubbles rise | VIETNAM → **10-6** Mekong Market. **Ban Buzzer 4** is here (the drowned-bike graveyard). |
| R15 | 9-2 Kite Festival | Rigging | a kite tail runs up off the top | JAPAN → **11-6** Capsule Toy Machine |
| R16 | 9-4 Manta Night Dive | Under-Stage, a whirlpool in the sea floor (water seam) | glowing plankton spirals down into it | BLUE FIRE → **9-7** (in-land) |
| R17 | 10-1 Train Street | Loading Dock | the train keeps going off right after the gate | NEPAL → **12-6** Crevasse Drop |
| R18 | 11-4 Neon Tower | Rigging, above the rooftop | a red aircraft-warning lamp blinks at the top edge; air-con plumes rise off-screen | NEPAL → **12-7** Supply Depot. **Ban Buzzer 5** is here. |
| R19 | 12-1 Suspension Bridges | Under-Stage, the gorge under one bridge | a snapped bridge cable hangs into the gorge; a yak bell rings from below | ANTARCTICA → **13-2** (the cold way round) |
| R20 | 13-1 Ice Shelf Bowling | Loading Dock | a conga line of penguins slides off right past the gate | HOME → **1-6** Pit of Swallows |
| R21 | 22-3 Mirror Lake | Wings (it is played leftwards, so its wings are off the **right** edge) | Brady's reflection walks off the edge without him | THE DESK → **22-5** (in-land) |

Mexico's bonus level 1-7 (§4.4) also has two backstage zones, an Under-Stage (the courtyard well) and the Wings. Neither has a case. They are the worked examples of those zones.

**Dormant Road Cases.** These six are padlocked, with a tag "HELD BY ORDER OF THE BARON — RULE 9", until Rule 9 is revoked (§4).
- They all lead **backwards**, to secret levels in earlier lands, so a player who missed a secret can reach it. They never let anyone skip ahead.
- `needs: 'rule:9'` on the exit and the spawn.

| # | Source | Zone | Target |
|---|---|---|---|
| D1 | 4-2 Dune Stampede | Loading Dock | **1-6** |
| D2 | 6-1 La Tomatina | Rigging (the truck's ramp throws you up) | **2-6** |
| D3 | 7-3 Mont-Saint-Michel Tides | Under-Stage (low tide only) | **7-7** (in-land) |
| D4 | 9-3 Batur Eruption | Loading Dock | **4-6** |
| D5 | 10-2 Ha Long Junk | Under-Stage (a sea cave below the deck route; a water seam) | **5-6** |
| D6 | 12-2 Yak Caravan Pass | Wings | **11-7** |

Every land has at least one Road Case. `--rules` checks this (warning during rollout, error at release).

---

## 4. The big buttons: the Baron's Rulebook and the Ban Buzzers

### 4.1 Story and name
The Baron doesn't only shrink landmarks into jars. He is also a dreadful bore who has published **The Baron's Rulebook**, a list of bans for the whole world: NO DANCING, NO HATS ON ANIMALS, NO SHORTCUTS, NO RETURNS, NO LATE FLIGHTS, NO FUN.

Each rule is enforced by a **Ban Buzzer**: a big DO NOT PRESS button the Baron's crew hid somewhere in the world. Slapping one **revokes** its rule. A rubber stamp slams **REVOKED** across the rule card, and the change ripples across every land.

Names: **The Baron's Rulebook** (the system and its pause-menu page) and **Ban Buzzer** (the object).

### 4.2 Look and how you hit it
- **Look:** a waist-high mahogany pedestal with a brass bezel. The dome is frosted glass in the Baron's airship purple (`#5a4a6a`, as in `TourPanelFx.airship`) with his gold "B" etched in it. An engraved brass plaque reads `DO NOT PRESS — BY ORDER OF THE BARON — RULE 7`. A pneumatic tube runs from the pedestal up into the scenery.
- **All six look the same.** They differ only by their rule number. There is no colour coding.
- **How to hit it:** **slap it from the side** with the Action button, or hit it with anything thrown, or with Pound Cake from above. **Jumping on it does nothing** except a deflated "bzzt... not like that" squeak, so it never works like a stomp switch.
- **When it's hit:**
  1. The dome lights up and the tube goes *thunk-thunk-thunk* up into the sky.
  2. A giant rule card unrolls on screen. **REVOKED** is stamped across it with confetti.
  3. A one-line sign says what changed ("ALL ANIMALS MAY NOW WEAR HATS").
- **Saving:** the revoke is saved **at once**, not at level clear. It can't be undone and never needs repeating. Afterwards the buzzer stays lit and slapping it again only plays a little fanfare.

### 4.3 The six buzzers: where they are and what they change

| Buzzer | Rule | Hidden in | Changes across the whole game | Opens |
|---|---|---|---|---|
| **B1** | **RULE 7: NO HATS ON ANIMALS** | 1-4 Volcán Escape, the Rigging (R2's zone) | Every animal enemy and friend in every level, plus the map critters, wears a tiny novelty hat: a paper party cone, a flower crown, a mini top hat, a propeller beanie, a chef's toque or a bobble hat. Each type gets one hat, chosen by a hash of its type name. There is no national or religious headwear. A hatted enemy pops one coin when stomped. | **1-7 Casa de Sorpresas** (Mexico bonus level, §4.4) |
| **B2** | **RULE 3: NO DANCING** | 3-1 Samba Sunrise, the Rigging (R5's zone) | Every enemy, friend and Souvenir Stand keeper bobs and squashes on the beat of whatever song is playing (cosmetic only: hitboxes and AI don't change). Every land's overworld gets festival bunting along its open trails and dancing critters at cleared stops. The Baron's airship on the route map sulks under a little rain cloud. | **Festival Fields** (bonus land, world 23) |
| **B3** | **RULE 9: NO SHORTCUTS** | 5-1 Souk Labyrinth, an Evidence Locker in a new dead-end cell | The Baron's freight network wakes up: the six dormant Road Cases D1-D6 unlock. Every land with a cleared boss gets an **express trail** on its map, walkable from its airstrip straight to its port. | the 6 dormant cases (§3.5) |
| **B4** | **RULE 12: NO RETURNS** | 8-3 Bike Lane Rush, the Under-Stage (R14's zone: the drowned-bike graveyard) | A **lost suitcase** with a luggage tag appears at every land's airstrip on its map. Tapping it once per land gives a free random Backpack item. Every Souvenir Stand adds a fourth shelf of "returned" goods. | **Lost & Found** (bonus land, world 24) |
| **B5** | **RULE 10: NO LATE FLIGHTS** | 11-4 Neon Tower, the Rigging (R18's zone, the rooftop) | The world route map gets night flights: from any cleared land's airstrip you can fly to **any** cleared land, not only along the route. A little red-eye plane with a blinking light circles the globe. | **The Red-Eye** (bonus land, world 25) |
| **B6** | **RULE 1: NO FUN** | 22-5 The Writer's Desk, the Wings (the margin of the page) | Before B1-B5 are all revoked, this buzzer is under a glass cloche with a sticky note: "NOT YET. — THE BARON". After that it can be slapped. Then the Baron's airship becomes a party blimp on every map, the Postcard Lighthouse beam turns rainbow, and the ending gains a short extra scene of the Baron at a party, sulking, then dancing. | **22-6 The Rulebook** (World 22 bonus level, §4.4) |

### 4.4 The extra content: 14 new levels

Bonus lands use `secret: true` and `bonus: true` on their route stop (§5.4). They are invisible until opened, use the existing `land` reveal (the pin cracks open on the route map), and have their own overworld map. Each has 4 levels and the 4th is its boss, like Antarctica and World 22. They are placed on the route map as fictional islands. Difficulty is set per land with `d0` because they open at different points in the tour.

**Mexico bonus (opened by B1):**
- **1-7 Casa de Sorpresas** (`arch: 'bonus'`, secret level). A big old house in a courtyard is the sampler of every new secret type. Its rooms:
  - the courtyard hub
  - the Closing-Time Shop (Xolo's tiendita after hours)
  - the Topsy Attic
  - the Hourglass Well
  - the Evidence Locker (the Baron's piñata pound)
  - a piñata-donkey Bouncy Castle in the courtyard
  - a Treasure Map Room whose X lies in the courtyard
  - an Under-Stage below the courtyard well
  - the Wings past the front gate
  
  Main exit: back to the map. **Size: M (2-3 days).**

**Festival Fields** (world 23, cc `fest`, opened by B2, `d0` 0.35, an island in the North Atlantic at lon -38, lat 47; map: a muddy festival site with tents, a Ferris wheel and stages):
- **23-1 Campsite Scramble.** Guy-ropes twang like springs, airbeds bounce, and a runaway gazebo tumbles after you in the wind (a DOOM-style chase).
- **23-2 The Mud Bath.** After each rain squall the mud rises and falls (TIDE). Wellies stand in for Flipper Fins. Lost flip-flops are stepping stones.
- **23-3 Silent Disco.** Beat blocks move only while Brady wears the glowing headphones (a pickup). Take them off and the dance floor freezes and goes quiet (BEAT plus a toggle).
- **23-4 The Sound Limiter** (boss). The Baron's noise-complaint robot, a giant volume knob on legs, turns the music down. Crowd-surf a herd of llamas to reach its dial. The crowd is animals, never people.
- Drug items here are only the existing cartoon pickups, in a "Chill Tent" side room.
- **Size: L (5-7 days plus art).**

**Lost & Found** (world 24, cc `lost`, opened by B4, `d0` 0.55, an airport island in the Indian Ocean at lon 72, lat -22; map: runways, a terminal, carousels, a lost-property warehouse):
- **24-1 Baggage Carousel.** Ride looping carousels of suitcases. The flaps between belts swallow anything that stands still (FACTORY).
- **24-2 Unclaimed Mountain.** Climb a mountain of lost luggage, single socks and umbrellas. Suitcases unzip into doors (a TOWER-style climb).
- **24-3 X-Ray Tunnel.** Platforms show only inside the scanner beam (LAMP-style light-only tiles). A sniffer-beagle friend barks at hidden ones.
- **24-4 The Sock Hydra** (boss). A heap of unmatched socks grows a new head each time one is beaten, until Brady pairs them up by throwing matching socks together.
- **Size: L.**

**The Red-Eye** (world 25, cc `eye`, opened by B5, `d0` 0.75; its pin is a plane icon over the North Pacific at lon 175, lat 40; map: a cutaway of a jumbo jet, nose to tail):
- **25-1 Aisle Seat.** The drinks trolley breaks loose and chases Brady down the aisle (DOOM). Overhead bins open as platforms. Snoring passengers are drawn as animals: a walrus, a sloth, a goose.
- **25-2 Turbulence.** Every few seconds the cabin lurches: a sideways gust zone, loose trays slide, the seat-belt light warns first.
- **25-3 Wing Walk.** Outside in bright daylight above the clouds: wing flaps that tilt, engine updrafts, a gull escort (SKY / GLIDE).
- **25-4 Captain Gull** (boss). A stowaway seagull who stole every pretzel on board, fought in the cargo hold among escaped crated animals.
- **Size: L.**

**World 22 bonus (opened by B6):**
- **22-6 The Rulebook** (`arch: 'bonus'`). Inside the Baron's Rulebook itself: page-turn platforms, rubber-stamp crushers, footnotes as ledges. The finale is the Rulebook as a mini-boss, a flapping book with stamp arms (3 hp). Brady tears its pages out one rule at a time. Main exit: back to the map.
- **Size: M (2-3 days).**

**Totals:**
- 14 new levels: 1 + 4 + 4 + 4 + 1.
- About 25 new backstage areas (not levels).
- 6 buzzers and 27 Road Cases.

Honestly, the bonus content is about the size of two and a half of the original lands: roughly 18-24 agent-days plus art.

### 4.5 The Rulebook page and settings
- **Pause menu → RULEBOOK.** The Baron's leather notebook. Revoked rules are struck through with a REVOKED stamp and say where the buzzer was. Unfound rules show "RULE ?: ████████". Once the Postcard Lighthouse is lit, an unfound rule also shows the land its buzzer is in.
- **Settings → REVOKED RULES: SHOW / HIDE** (default SHOW). This turns off the cosmetic effects (hats, dancing, bunting) for anyone who finds them busy. Unlocks never turn off.
- **Map badges:** once a buzzer is found, the stop that holds it shows a tiny brass dome next to its exit pips. Until then, the Lighthouse flag counts an unfound buzzer as "something undiscovered here".

---

## 5. Format changes (exact field names)

### 5.1 Level and area spec (`Tour.country` / `Tour.amend`)

```js
// level
{
  n: 4, name: 'Volcán Escape', arch: 'tower', ...
  exits: {
    main:  { to: '1-5' },
    case:  { to: '2-7', via: 'case', label: 'ECUADOR', hint: 'A sandbag dangles above the crater...' },
    case2: { to: '1-6', via: 'case', label: 'HOME', needs: 'rule:9' }    // a dormant case
  },
  areas: [ ... ]
}
// arch: 'bonus' is new: exempt from the archetype caps, like 'lair'
```

- `exits.<key>.via: 'case'`: a Road Case exit. The map draws freight trails and lines for it. `label` (required for cases, at most 14 characters) is stencilled on the case and shown on the map card.
- `exits.<key>.needs`: `'rule:<n>'`, or `'rules:5'` (any five revoked). It is required for dormant exits. The validator requires such an exit only in the "rules on" pass (§5.6).
- Exit keys for cases are `case`, `case2`, and so on. Old keys don't change.

```js
// a backstage area
{ id: 'rigging', gen: 'room', role: 'backstage', zone: 'rigging', stamp: 'rigging',
  back: { side: 'bottom', span: [3, 6], to: 'crater@riggingDrop' } }

// a secret room of a new type: `room` picks the type, its options live under the same name
{ id: 'embarcadero', gen: 'room', role: 'secret', room: 'fairground', stamp: 'embarcadero',
  fairground: { game: 'whack', critter: 'mxAxolotlPop', need: 8, t: 20, prize: 'oneup' } }
```

Area fields:
- `role: 'backstage'` (new). `zone: 'rigging' | 'dock' | 'under' | 'wings'` picks the backstage theme and music.
- `back: { side, span: [a, b], to }`: the return seam on this area's edge.
- `room: 'pantry' | 'closing' | 'fairground' | 'bouncy' | 'evidence' | 'recipe' | 'topsy' | 'hourglass' | 'treasure'`. The default is `pantry`, which is today's room. Options per type:
  - `closing: { t: 12, keeper, shutters: [[x0, y0, x1, y1], ...] }` (shutters in stamp tile coordinates, closed in this order)
  - `fairground: { game: 'whack' | 'shy', critter, need, t, prize }`
  - `bouncy: { skin }`
  - `evidence: { dogs: n, sweep: [a0, a1], period }`
  - `recipe: { cook, ingredients: ['chili', ...], dish }`
  - `topsy: {}`
  - `hourglass: { speed: 0.8, delay: 2 }` (built with the `rise` gen; `soft: true` is implied)
  - `treasure: { lock: 'x1' }` (the X is a `keyLock`-style lock placed in another area with `['xMark', { id: 'x1' }]`)

**New pieces** (strip-like gens; all `(st, opts) => newX`):

| Piece | Options | What it builds |
|---|---|---|
| `rigging` | `{ to, w: 4, launcher: 'vent' \| 'spring' \| 'updraft' \| 'bounce' \| 'none', tell }` | opens the ceiling over `w` columns, places the launcher and the tell, records a `top` seam |
| `loadingDock` | `{ to, tell, over: 'crates' \| 'truss' \| 'under' }` | after the finale: a route over or under the gate, the floor running to the area's right edge, a `right` seam |
| `underStage` | `{ to, n: 3, tell }` | a pit `n` wide whose bottom is a `bottom` seam, with a crash-mat tell; it is the only non-deadly pit |
| `wings` | `{ to, tell }` | used as the first step: the start pad stays open at x = 0 with a curtain flap, records a `left` seam (`right` in a mirrored area) |
| `roadCase` | `{ exit: 'case', label }` | the case entity on the floor |
| `buzzer` | `{ rule: 7 }` | the Ban Buzzer pedestal |
| `xMark` | `{ id }` | the Treasure Map's X: a soil lock on the floor |

**Stamp legend:** no new global letters (§7, item 9). New custom legend kinds go in a stamp's `legend`:
- `['seam', side, 'area@anchor']`: a vertical or horizontal run of the same letter on an edge is one seam span.
- `['spawn', 'roadCase', { exit: 'case', label: 'ECUADOR' }]`
- `['spawn', 'banBuzzer', { rule: 7 }]`
- `['xmark', id]`

A stamp-level `back` is also allowed, with the same form as the area's.

### 5.2 Built level and area (what `generateV2` returns)
- `area.seams: [{ side, a, b, toRef, target: { area, x, y } }]`. These are resolved by the same `find()` as door refs (`28_tour_bb_gens.js:47-57`). A seam with no target is a build problem reported by `--rules`.
- `area.roomType`, `area.zone` (copied from the spec, for tests and the map).
- Spawns may carry `needs: 'rule:9'`. In the game, an entity whose `needs` aren't met draws its dormant look and never triggers.
- The level object gains `buzzers: [7]`: the rule numbers placed in the level, for the validator and the map.

### 5.3 Save (key bump; progress resets, as Brady decided)
- **Key:** `super-brady-o-world-save-v3`. `Save.legacyKey` for the world app becomes `super-brady-o-world-save-v2`, so settings and look are copied once and progress starts fresh. Four places hold the key:
  - `src/00_core.js:95-97` (the key map and the legacyKey map)
  - `tools/build.js:38`
  - `tools/apps_test.js:11`
  - `tools/save_test.js` (rewritten for v2 → v3)
- New fields under `Save.data.tour`:

```js
rules:   { 7: { at: '1-4' } },        // revoked rules (number -> where the buzzer was)
arrive:  { cc: 'ec', at: '2-7' },     // consumed once by the overworld: Brady appears at this stop (Road Case arrival)
caseLinks: { ec: ['2-7'] },           // stops linked to their land's airstrip by an arrival freight trail
luggage: { mx: true },                // Rule 12 suitcases already opened, per land
express: { mx: true }                 // Rule 9 express trails already animated, per land
// existing and reused: lands (bonus lands open through it), revealed, paths, pending, exits
```

- `Save.data.settings.ruleFx: true` (the SHOW / HIDE setting).
- The engine's `v: 3` field stays as it is. A fresh save still runs through the old `v < 3` wipe because `Save.defaults()` says `v: 1`. That is harmless, so don't "fix" it.

### 5.4 Progress, route and reveals (`src/28_tour_a_core.js`)
- **`Tour.addStop(stop)`**: a country file adds its own route stop, so bonus lands don't edit `TOUR_ROUTE`. Stop fields:
  - `{ id, world, name, lon, lat, secret: true, bonus: true, d0, pin }`
  - `pin: 'tent' | 'suitcase' | 'plane'` is the route-map icon.
  - `Tour.difficulty` uses `d0 + (i - 1) * 0.03` when `d0` is set.
- **World numbers:** 23, 24 and 25. 41-50 are taken by the old Burning Man world table (`26_worlddata.js`, not in this app). Avoid them anyway.
- **`TourProgress.exit(id, key)`** gains:
  - **For a level target in the same land via a case:** reveal `{ kind: 'case', cc, from, to, gold: true }`. This draws a freight trail (a path flag, so it is walkable) and the banner **ROAD CASE!**
  - **For a level target in another land:** reveal `{ kind: 'shipment', from: id, to: targetId, cc: fromCc, toCc }`. It sets `tour.arrive`, adds `caseLinks[toCc]`, and reveals the target's stop in its land (`{ kind: 'stop', cc: toCc, id }` when it is a secret level). Today `exit()` only draws paths within the source land (`:322-325`).
- **`TourRules.revoke(n)`** (in WP-5's file) writes `tour.rules[n]` and pushes these reveals into `tour.pending`:
  - `{ kind: 'rule', n }`, played as a full-screen REVOKED card the next time the map opens
  - then whatever the rule opens: `{ kind: 'path', cc, from, to, gold }` plus `{ kind: 'stop', cc, id }` for 1-7 and 22-6, `{ kind: 'land', id }` for bonus lands. `Save.data.unlocked` for the opened level.
- **`TourProgress.isUnlocked`** is unchanged. Rule-opened levels go through `Save.data.unlocked`.
- **`exitsFound`** counts case exits in the pips. Dormant ones count only once their rule is revoked.
- **`totals()`** already hides closed secret lands. Bonus lands follow the same rule.

### 5.5 Overworld data (the contract with the map agent)
- **`TOUR_OW_MAPS[cc].paths['<a>><b>']`**: bends for freight trails, for example `'1-1>1-4'`. Without them, trails are drawn as a gentle curve.
- **`TOUR_OW_MAPS[cc].nodes['case:<levelId>/<key>']`**, optional: where to draw the small case icon near its source stop. The default is an offset of 26 px from the stop, on the side away from its label.
- **`nodes['1-7']`, `nodes['22-6']`:** positions for the rule-opened bonus stops.
- **`scenes['1-7']`:** an optional overworld scene. Mexico's free grid cell `[2, 2]` is the fallback.
- **New edge kinds in `TourGraph.edges`:**
  - `'case'`: a freight trail between two stops, or between a stop and `start` for `caseLinks`. It is open when the case exit was taken, walkable both ways, drawn as a brown dashed line with stencil arrows, and is never a roadblock.
  - `'express'`: from `start` to `port` (Rule 9). Drawn as a brass rail line.
- **Decorations, not nodes:**
  - case icons (after a case is found)
  - the brass buzzer dome on a stop's label (after its buzzer is found)
  - the lost suitcase at the airstrip (Rule 12; tapping it is handled by the extras layer)
  - bunting along open trails and dancing critters at cleared stops (Rule 3)
  - the party blimp (Rule 1)
- **Bonus lands bring their own `TOUR_OW_MAPS` entry** from their country file (`Object.assign(TOUR_OW_MAPS, { fest: {...} })`). That file loads after `28_tour_fc_maplayouts.js`, so the map agent's file is never touched.

### 5.6 Validator, builder hooks and `validate_levels`
**Validator (`src/09_validate.js`):**
1. **Road Cases are gates.** In the spawn scan (`:79-83`), `roadCase` pushes to `gates` with `key: s.exit`.
2. **`needs` are respected.**
   - `Validator.run(level, { rules: Set|'all' })`.
   - Spawns, gates, locks and seams whose `needs` aren't met are skipped.
   - `exitKeys` (`:97`) leaves out exits whose `needs` aren't met.
3. **Seams.**
   - At standing nodes, a node whose body overlaps a side seam's edge column pushes the target, as `edges` do now (`:130`).
   - In `simulate`, the line `if (b.y > A.H * TS + 40 || b.y + b.h < -40) return null` (`:365`) becomes: if the body leaves through a seam span, return `{ seam }`. The caller then pushes the target node with distance + 2.
   - Bottom seams count from `b.y > A.H * TS - 8`.
4. **`lock.needsAll: [ids]`**: the lock opens when every listed key is held (recipe kitchens, fairground prizes).
5. **Buzzers are required targets.** `res.buzzers = { 7: true }`, filled when a node or sim box overlaps a `banBuzzer` box.
6. **Pace for any area** with a rise, chase or rising hazard (Hourglass Well), from that area's entry anchor to its exit (top or door). The 25 % margin applies. Today only `areas[0]` is checked (`:233-247`).
7. **Under-Stage sanity:** in an area with a bottom seam, every other pit must still be deadly, and the seam pit must carry a tell spawn (`tourCrashMat` or a skin).

**Builder (`src/28_tour_bb_gens.js` `generateV2`):** resolves `area.seams[].toRef` and copies `room`, `zone`, `back` and `needs` onto the area and spawns.

**`tools/validate_levels.js`:**
- For any level with a `needs`, run `Validator.run` twice: rules off (every unconditional exit) and rules on (`'all'`).
- New failure flags: `CASE <key> UNREACHABLE`, `BUZZER <n> UNREACHABLE`, `SEAM <aid>/<side> HAS NO WAY BACK` (a backstage area from which no main-route node is reachable). Postcard and area rules are unchanged.
- `--rules` gains:
  - every `TOUR_RULES` buzzer is placed exactly once in the game
  - every rule's `opens` target exists
  - every case exit has a `label`
  - ≥ 1 Road Case per land (warning, then error at release)
  - room-type variety (§2.9)
  - `arch: 'bonus'` levels are exempt from the archetype caps
  - no seams in autoscroll, rail, arena, flip or carry areas

**Hooks.** A tiny registry in a new file, `src/28_tour_a2_hooks.js` (it sorts before `28_tour_a_core.js`; only called at run time):

```js
const TourHooks = { offEdge: [], afterEntities: [], areaLoaded: [], pausePages: [], settings: [], owDraw: [], owTap: [], routeDraw: [], peek: null,
  run(name, ...a) { for (const f of this[name] || []) { const r = f(...a); if (r) return r; } return null; } };
```

Hook call sites:

| Hook | Called from | Purpose |
|---|---|---|
| `offEdge(play, player, side)` | `src/11_player.js`, before the pit check (`:440`) and at the left/right clamps (`:451`) | returns true if a seam took over |
| `afterEntities(play, ctx)` | `src/12_play.js:821`, after the entity layers | hats, dancing |
| `areaLoaded(play)` | the end of `loadArea` | room clocks arm |
| `pausePages` | the pause menu (`src/13_ui.js:644`) | the RULEBOOK button |
| `owDraw`, `owTap` | `src/28_tour_fd_overworld.js` (draw and tap) | map extras |
| `routeDraw` | `src/28_tour_f_map.js` (`:521`) | freight lines, the red-eye plane, the party blimp |
| `settings` | settings scene | the ruleFx toggle |

Every call is guarded: `typeof TourHooks !== 'undefined'`.

---

## 6. Phased build plan

### 6.0 Before anything starts
- **Merge the four finished SBW branches first:** `sbw/items-fix`, `sbw/perf`, `sbw/title-icon` and `sbw/music-pilot` (the order and checks are in `docs/handoff/SBW_RELAY.md`). None was on `main` at `c3ed88a`. They touch `src/12_play.js`, `src/15_postfx.js` and `src/07_physics.js`, and add `src/14_quality.js`, `src/28_tour_dj_boxes.js` and `src/28_tour_gt_title.js`. Phase 1 branches from `main` after they land.
- **Tell the map agent:** this work adds small hooks to `28_tour_fd_overworld.js` and `28_tour_f_map.js`, and it reads the optional layout keys in §5.5. Bonus-land layouts live in their own country files.
- Every package works in its own worktree and branch (`sbw/secrets-<pkg>`), builds with a private `BRADY_DIST`, and runs suites one at a time on a quiet machine (SBW_RELAY "How to work safely").

**Sizes:** S < 1 day, M 1-3 days, L 3-6 days (agent time).

### 6.1 Phase 1: engine, toolkit, save, validator, map, and Mexico as the worked example

Order:
1. **WP-1** lands first. It owns every edit to a shared engine file.
2. **WP-2 to WP-5** then run in parallel. They are new files plus a few files each package owns outright.
3. **WP-6** (Mexico) integrates last.

| WP | Name | Owns (only this package edits these) | Depends on | Tests it adds / must pass | Size |
|---|---|---|---|---|---|
| **WP-1** | **Contracts, hooks, validator** | new `src/28_tour_a2_hooks.js`; `src/09_validate.js`; `src/11_player.js` (hook calls only); `src/12_play.js` (hook calls only); `src/13_ui.js` (pause hook only); `src/28_tour_bb_gens.js` (seam, needs and room resolution in `generateV2`); `src/28_tour_j_stamps.js` (custom legend kinds `seam`, `xmark`); `tools/validate_levels.js` | the four branches merged | new `tools/sbw_contract_test.js`: tiny inline fixtures (a seam of each side, a road-case gate, `needs` on and off, `needsAll`, a buzzer target, per-area pace, the Under-Stage pit check, "seam with no way back"). Must pass: `validate_levels --rules`, `sbw_toolkit_test`, `sbw_snapshot` (byte-identical, because nothing in the shipped levels changes), `gameplay_test`, `boss_test`, `sbw_soak_test` | M (2 days) |
| **WP-2** | **Progress, save, maps** | `src/28_tour_a_core.js` (`Tour.addStop`, `d0`, `exit()` case and shipment reveals, `exitsFound` with needs); `src/28_tour_fb_mapgraph.js` (edge kinds `case` and `express`, `caseLinks`); `src/28_tour_f_map.js` (shipment reveal playback, the `tour.arrive` hand-off, the hook call); a ≤ 5-line hook in `src/28_tour_fd_overworld.js` (draw, tap, arrival), coordinated with the map agent; new `src/28_tour_fg_owextras.js` (case icons, freight trail and line drawing, the REVOKED card playback, suitcase, bunting, express rail, blimp, buzzer badge); save key in `src/00_core.js:95-97`, `tools/build.js:38`, `tools/apps_test.js:11`; `tools/save_test.js`; derive the land counts in `tools/sbw_toolkit_test.js:20`, `tools/sbw_overworld_test.js:227` and `tools/gameplay_test.js:312` (no hard-coded 14 or `'13,22'`) | WP-1 | new `tools/sbw_secrets_test.js` (node): an in-land case reveal plus a walkable freight trail; a cross-land shipment (target unlocked, its land unlocked, nothing earlier marked done, `arrive` consumed once, the caseLink trail open); `needs`-gated pips; a bonus land hidden from `totals()` until opened; `Tour.addStop`. `save_test` (v3 key, settings and look copied from v2, v2 untouched). `sbw_overworld_test` extended: freight trails and case icons laid out at 844x390, 390x844 and 568x320, no overlaps. `apps_test` | L (3-4 days) |
| **WP-3** | **Backstage and Road Cases** | new `src/28_tour_k_backstage.js` (seam runtime via `TourHooks.offEdge`, `Play.prototype.seamTo` with the curtain-whip wipe and kept velocity, the pieces `rigging` `loadingDock` `underStage` `wings` `roadCase`, the `roadCase` entity (an Up-press gate subclass with the SHIPPED clear), stagehand mice, procedural backstage themes `bk_rigging` `bk_dock` `bk_under` `bk_wings` with a per-country tint, the backstage music cue); new `tools/fixtures/sbw_backstage_lab.js`; new `tools/sbw_backstage_shots.js` | WP-1 (WP-2 only for the map end of a case; mock it until it lands) | `sbw_backstage_shots.js --checks` in a phone-sized WebKit: Brady leaves through each of the 4 seams and arrives in the right area with velocity kept; the under-stage pit doesn't kill and the level's other pit still does; the return seam works; the case needs Up; screenshots of each zone. Fixtures pass `validate_levels`. `sbw_soak_test` on the fixtures | L (3-4 days) |
| **WP-4** | **Secret room types** | new `src/28_tour_l_rooms.js` (`roomClock`, `stallGame` plus pop critters, `cookPot`, the bouncy and attic stamp helpers, `rise.soft`, the treasure-map key and lock skins plus `TourHooks.peek`, a procedural skin per type); new `tools/fixtures/sbw_rooms_lab.js`; new `tools/sbw_rooms_shots.js` | WP-1 | `sbw_rooms_shots.js --checks`, one scripted run per type: the closing clock ejects without a hit; a whack win opens the prize and a loss doesn't; the recipe opens only with all 3 ingredients; the hourglass catch is one hit plus a respawn, never a death; the topsy flip works; the treasure map opens the X in another area; the evidence alarm closes and reopens shutters. All 8 fixtures validate. Screenshots of each | L (4-5 days) |
| **WP-5** | **Ban Buzzers and the Rulebook** | new `src/28_tour_m_rules.js` (`TOUR_RULES`, `TourRules.revoke/isRevoked`, the `banBuzzer` entity with the side-slap only and the cloche for B6, the REVOKED card, the hats and dance `afterEntities` effects, the Rule 12 shop shelf, the Rule 10 route-map "fly anywhere" via a hook, the Rulebook pause page, the `ruleFx` setting) | WP-1, WP-2 (reveal kinds; mock until it lands) | new `tools/sbw_rules_test.js`: revoke each rule and check its reveals and unlocks; with every rule revoked, draw every registered enemy, friend and keeper type once with hats and dance, with zero errors; landing on a buzzer does nothing and a slap revokes; B6 stays shut until 5 rules are revoked; `ruleFx` off hides the cosmetics. A soak run with all rules revoked (`SBW_RULES=all`, which the test sets through `Save.data`) | M-L (3 days) |
| **WP-6** | **Mexico, the worked example** | `src/29_tour_mx_levels.js`, `src/29_tour_mx.js` (skins: the hen cook, `mxAxolotlPop`, the piñata bouncy castle, Xolo asleep), Mexico's map additions (`Object.assign(TOUR_OW_MAPS.mx.nodes / paths / scenes, …)` at the end of `29_tour_mx_levels.js`; the map agent is told the keys) | WP-1 to WP-5 | Mexico content, below. `validate_levels 1-1 … 1-7` (rules off and on); `gameplay_test`; `boss_test` (1-5 is unchanged except its pantry room); `sbw_snapshot` baseline updated for 1-1, 1-2, 1-4, 1-5 and the new 1-7 only; `sbw_toolkit_shots --checks`; a panorama plus phone shots of every changed level and every backstage zone, looked at before the merge | L (3-4 days) |
| WP-7 (optional; can slip to phase 4) | Art pass for the shared pieces | `tools/blender/sprites/bk_*.py`, `assets/sprites/super-brady-o-world/bk_*.js`, the wiring in `src/30_tour_sprites.js` | WP-3, WP-4, WP-5 looks frozen | `sbw_atlas_test`, `sbw_graphics_test`; a private Blender GUI instance via `tools/blender/sprites/gui/bl.sh` | M |

**Mexico content (WP-6):**
- **1-1:** a `loadingDock` past the fiesta stage, Road Case R1 → 1-4.
- **1-2:** the embarcadero becomes a Fairground Stall, "Whack-an-Axolotl" (the willow entrance stays).
- **1-4:** a `rigging` above the crater rim with Buzzer B1 and Road Case R2 → 2-7.
- **1-5:** the despensa becomes the Recipe Kitchen (the hen's mole: chili, cacao, tomato).
- **New 1-7 Casa de Sorpresas:** the Closing-Time Shop, Topsy Attic, Hourglass Well, Evidence Locker, Bouncy Castle and Treasure Map, plus an Under-Stage under the well and the Wings past the gate. All 8 room types and all 4 zones appear in Mexico.

**Files several packages would want, and who owns them:**

| File | Owner | Other packages |
|---|---|---|
| `src/09_validate.js`, `src/11_player.js`, `src/12_play.js`, `src/13_ui.js`, `src/28_tour_bb_gens.js`, `src/28_tour_j_stamps.js`, `tools/validate_levels.js` | WP-1 only | All others register hooks or use the contract. A missing hook is requested from WP-1, never added directly. |
| `src/28_tour_a_core.js` and the map files `28_tour_fb`, `28_tour_f_map` | WP-2 | |
| `src/28_tour_fd_overworld.js` | the map agent | WP-2 adds one hook commit |
| `src/28_tour_fc_maplayouts.js`, `28_tour_fe_owpaint.js`, `28_tour_ff_owscenes.js` | the map agent | nobody else |
| `src/00_core.js`, `tools/build.js`, `tools/apps_test.js` (shared across all three games) | WP-2 | one-line additive changes only, to the world app's entries |
| `src/29_tour_mx*.js` | WP-6 | |
| the builder (`28_tour_b_build.js`) | | **nobody touches it.** Every builder change goes through `28_tour_bb_gens.js` (WP-1) or the new piece files. |

**Phase 1 deploy:** run the full suite (SBW_RELAY list plus the new tests), look at the screenshots, deploy. Brady's save resets to v3: tell him first.

### 6.2 Phase 2: rollout to the other 13 lands (4 agents in parallel)
Each group agent owns only `src/29_tour_<cc>_levels.js` and `src/29_tour_<cc>.js` (skins and art) for its lands, plus `Object.assign` map additions at the end of its levels file.

For each land, the agent:
- (a) converts at least 2 existing secret rooms into new types (variety rule §2.9)
- (b) adds that land's Road Cases and dormant cases (§3.5)
- (c) places its buzzer, if any
- (d) re-validates, updates the snapshot baseline for the changed levels only, and shoots the screenshots

| Group | Lands | Road Cases | Buzzer | Size |
|---|---|---|---|---|
| G1 | ec, br, mz | R3 R4 R5 R6 R7 R8, D1 | B2 (3-1) | L (3 days) |
| G2 | ma, es, fr | R9 R10 R11 R12 R13, D2 D3 | B3 (5-1, new Evidence Locker cell) | L (3 days) |
| G3 | nl, id, vn | R14 R15 R16 R17, D4 D5 | B4 (8-3) | L (3 days) |
| G4 | jp, np, aq, w22 | R18 R19 R20 R21, D6 | B5 (11-4); B6 placed under its cloche (22-5) | L (3-4 days) |

Phase 2 depends on phase 1 being merged. The groups never share a file.

### 6.3 Phase 3: the bonus content (4 agents in parallel)

| WP | Content | Owns | Tests | Size |
|---|---|---|---|---|
| B-1 | Festival Fields (world 23, `fest`) | new `src/29_tour_fest.js`, `src/29_tour_fest_levels.js` (with `Tour.addStop` and its `TOUR_OW_MAPS.fest`), `tools/boss_tests/fest.js` | `validate_levels 23-*`, the boss test, soak, overworld layout checks for the new land (they derive from data after WP-2), screenshots | L (5-7 days plus art) |
| B-2 | Lost & Found (world 24, `lost`) | `29_tour_lost*.js`, `tools/boss_tests/lost.js` | same | L |
| B-3 | The Red-Eye (world 25, `eye`) | `29_tour_eye*.js`, `tools/boss_tests/eye.js` | same | L |
| B-4 | 22-6 The Rulebook | `src/29_tour_w22_levels.js` (after G4 has merged), `tools/boss_tests/w22.js` (mini-boss case added) | same | M (2-3 days) |

One Blender agent at a time does the art, per SBW_RELAY.

### 6.4 Phase 4: art, phone check and release
- Blender atlases for the backstage zones, Road Case, Ban Buzzer, room-type props and bonus casts.
- Re-renders where the procedural fallbacks read badly.
- **Brady checks it on his iPhone.**
- `Validator.STRICT5` stays as decided. The `--rules` warnings for room variety and cases per land become errors.
- Bump the save key again only if levels changed since the save he is playing (his standing decision).

---

## 7. What will make this harder than it looks
1. **Area edges are hard-wired in four places.**
   - `tileAt` makes the sides solid and the top empty (`07_physics.js:37-41`).
   - Falling below the area kills (`11_player.js:440`).
   - The left clamp is at `11_player.js:451`.
   - The camera clamps to the area (`12_play.js:469-524`).
   - The validator gives up on any jump that leaves the area (`09_validate.js:365`) and checks `edges` only at standing nodes (`:130`).
   
   Seams need all of these changed, which is why WP-1 owns them.
2. **Cross-land exits are half-supported.**
   - `TourProgress.exit` draws paths only inside the source land (`28_tour_a_core.js:320-345`).
   - `Play.nextLevelId` and the overworld's auto-walk (`28_tour_f_map.js:127-135`) handle same-land targets only.
   - On the target land's map, trails open only through exits or clears, so an arriving Brady would be stranded. That is why §3.4 adds `arrive` and `caseLinks`.
3. **Every exit marks the level done.** `recordProgress` (`12_play.js:386-396`) sets `done[id]` for any exit, so taking a case clears its level. This is consistent with secret gates today, but it means a case in 1-1 counts 1-1 as cleared.
4. **Pace is checked only for `areas[0]`** (`09_validate.js:233-247`). Hourglass rooms and any hazard in a sub-area need the per-area change.
5. **Some tests hard-code the 14 lands:**
   - `tools/sbw_toolkit_test.js:20` (`worldList().length === 14`)
   - `tools/sbw_overworld_test.js:227` (`L.length === 14`)
   - `tools/gameplay_test.js:312` (the route string and the secret lands `'13,22'`)
   
   Bonus lands break them unless WP-2 derives them from the data.
6. **The save key is written in five places.**
   - `00_core.js:95-97` (the key and legacyKey maps)
   - `tools/build.js:38`
   - `tools/apps_test.js:11`
   - `tools/save_test.js`
   
   `legacyKey` only knows v1. Also, `Save.defaults()` says `v: 1`, so every fresh save passes through the old `v < 3` wipe. Leave that alone.
7. **Four finished branches are not merged** and touch the same engine files (§6.0).
8. **The map agent is editing the overworld files right now.** Our hooks in `28_tour_fd_overworld.js` must be one small, agreed commit. Bonus-land layouts must live in their country files.
9. **The stamp global legend can't take new letters.** Countries already use many custom letters, and a stamp's legend may not redefine global ones. New things must be legend entries, not letters.
10. **Files load in name order.**
    - New files must sort after what they use: `k`, `l` and `m` come after `j_stamps`.
    - `28_tour_a2_hooks.js` sorts *before* `28_tour_a_core.js`. That is fine for a registry that is only called at run time, but it must not reference `Tour` at load.
    - Write files elsewhere, run `node --check`, then move them in. A half-written file breaks every app.
11. **Enemies only think inside the active window** (`12_play.js:625`). The seam and buzzer logic must live in hooks on the player or play loop, not in edge-of-area entities that may be asleep.
12. **Going "behind the exit" means passing the gate without touching it.** The gate's hitbox is 120 px tall (`09_validate.js:81`), so every Loading Dock needs a deliberate over-route (crates or a truss) or an under-route (a stage trap).
13. **Rides, rails and autoscroll can't take side seams** (the screen edge pushes Brady). That is why the table avoids 11-2 Bullet Train and puts B5 in 11-4.

---

## 8. Open questions for Brady (each has a default so work can go on)

| # | Question (one plain sentence) | Default if he doesn't answer |
|---|---|---|
| 1 | Is it OK that the hidden places off the edges are a "backstage" behind the scenery (ropes, stage lights, road cases), as if every land were a touring show? | Yes, as designed. |
| 2 | May a hidden road case send you up to two lands ahead, and give a second way into Antarctica? | Yes, at most two lands ahead, and the second Antarctica door stays. |
| 3 | Are Festival Fields, Lost & Found and an overnight Red-Eye flight the three extra lands you want? | Yes, those three. |
| 4 | Do you like the names Ban Buzzers, the Baron's Rulebook and Road Cases? | Keep them. |
| 5 | Once unlocked, should hats on animals and dancing enemies stay on for good, or have an on/off switch in Settings? | A switch in Settings, on by default. |

---

## 9. Originality check

| Mechanic | Why it isn't a copy of another game's signature |
|---|---|
| **Ban Buzzers / the Rulebook** | A satirical list of the villain's bans, revoked one by one. There are no palaces, no colours per switch, and nothing turns blocks solid or outlined blocks into floors. You slap it from the side, and stomping it does nothing. It is permanent, never timed. Its effects are hats, dancing, maps, shops, freight routes and new lands. |
| **Bonus lands** | Three ordinary travel-humour lands on the existing route map, opened by revoking rules. They are not a star-shaped world, not a hub of warp portals, and not reached through a special star or door. |
| **Backstage zones** | The off-edge areas are the stage set's backstage, with their own tiles and crew. Hidden space above the ceiling exists in older platformers. Ours is reached by being launched off the top of the screen, never by walking along the top of a visible ceiling row, and it holds one labelled case, never a row of numbered pipes or a "warp zone" sign. The other three edges (past the exit, under a pit, before the start) are ours. |
| **Road Cases** | You climb into stencilled flight cases with the destination written on them. The map then shows the shipment along freight trails. There are no pipes, cannons or vortex doors. |
| **Closing-Time Shop** | A shop that closes on you is a fairground-and-shopping gag, not any game's signature room. |
| **Fairground Stall** | Whack-a-critter and coconut shy are generic fairground games, played with Brady's own moves and local animals. |
| **Bouncy Castle** | A festival inflatable shaped like a local icon. Bounce surfaces already exist in this game. |
| **Evidence Locker** | Our own SNEAK toolkit inside the Baron's customs office, with tin guard-dogs. Generic stealth, not a borrowed setting. |
| **Recipe Kitchen** | An animal cook's three-ingredient errand built on our CARRY system. No borrowed cooking mechanic. |
| **Topsy Attic** | Our existing FLIP bands in a furnished, upside-down attic. |
| **Hourglass Well** | Our RISE gen with soft sand that spits you out. A generic rising-hazard climb, not lava and not a borrowed set piece. |
| **Treasure Map Room** | The room changes the main level (an X appears to dig up), using our key and lock toolkit. No borrowed map item or look. |
| **Hats and dancing** | Cosmetic draw passes over our own cast. Novelty hats only, never national or religious dress. |

**Content rules** for everything above:
- Humour comes from food, animals and objects: socks, suitcases, the hen's mole, llama crowds, a pretzel-thieving gull.
- No person is caricatured: festival crowds, plane passengers and customs guards are animals or tin toys.
- Temples, shrines, mosques and churches appear only as plain distant silhouettes, never as backstage or room settings.
- Drug items appear only as the existing cartoon pickups.
- No brand names. "Road case" and "flight case" are generic terms.

---

## 10. WP-1 landed: the contracts (16 Nov 2026)

WP-1 (branch `sbw/secrets-wp1`) built the hooks, the builder fields and the validator rules. **The exact API, with an example for each, is in [`SECRETS_CONTRACTS.md`](SECRETS_CONTRACTS.md); code against that file, not against §5.6 above.** Every contract is checked by `node tools/sbw_contract_test.js`.

The main changes to this plan (the full list is in §10 of that file):
- `offEdge(play, player, side, seam)` is called once, before the pit line, for all four edges. WP-1 does the seam detection (`TourSeams`), and WP-3 does only the swap.
- These hooks were added: `playerDie`, `playUpdate`, `camera`, `entityDraw`, `levelClear`, `resultsTitle`, and exit kinds (`TourHooks.exitKind('warp', { title, marksDone })`).
- Area hazards run on the level clock, so timed rooms re-arm themselves in `areaLoaded`.
- Seams are not allowed in climbing-camera areas either.
- Two new checks: `ROOM <aid> HAS NO WAY OUT` and `WARP IN <aid>: NO EXIT`.
- Code names are neutral, following Brady's naming decisions: exit `via: 'warp'` with keys `warp` / `warp2`, spawn types `warp` and `button`, `level.buttons`.
- The runtime lock (`10c_gimmicks.js`) is unchanged. WP-4 subclasses it for `needsAll`, `needs` and the X.
