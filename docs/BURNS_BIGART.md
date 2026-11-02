# BRADY-O BURNS: Big Art Guide

Big Art pieces are massive, original playa art installations Brady can climb, ride and play on. Each one is a self-contained adventure point: geometry, colliders, gameplay hooks, night lighting and an optional Burn Token at the summit. Drop one or two into your world with a single call.

- Module: `src/41_burns_bigart.js` (loads after the engine, before the worlds)
- Sandbox: `src/42_burns_world99.js`, world id **99**, debug only (not in `BURNS_WORLD_ORDER`, not on the hub). Open it with `window.BRADY_BURNS.debug.play(99)`.
- All eight designs are original. They nod to the *spirit* of legendary big playa art (monumental, industrial or whimsical, climbable, fire and light at night). None of them reproduces a real artwork.

---

## 1. Quick start

```js
build(api, g) {
  // a token mission for the summit (declare it in def.missions so the hub counts it)
  // missions: [ BurnsBigArt.mission('knottedSemi', 'semiTop', { hint: 'Out past 9:00, near the trash fence' }) ],
  const semi = BurnsBigArt.place(api, g, 'knottedSemi', 60, -40, {
    rotY: Math.PI / 2,        // yaw; local +Z (the piece's "front") faces this way
    mission: 'semiTop',       // completed when Brady stands on the summit; the token spawns there
    onReach(g, piece) { g.say('brady', ['I can see my camp from here!']); }
  });
  const cp = semi.toWorld(0, 0, -45);          // piece-local -> world [x, y, z]
  api.checkpoint('cp_semi', cp[0], cp[2], { name: 'The Knotted Semi' });
}
```

That's it: the piece builds its geometry and colliders, registers its update and night effects, places glow sticks along its route, and wires the summit.

---

## 2. API

### `BurnsBigArt.place(api, g, kind, x, z, opts) -> piece`

Call it inside `build(api, g)`. `x, z` is the piece origin on the playa (centre of its footprint). Common `opts`:

| Option | Default | Meaning |
|---|---|---|
| `rotY` (or `yaw`) | `0` | Rotation. The piece's local +Z (its front) faces `rotY` (same convention as props). |
| `scale` | `1` | Uniform scale, clamped to 0.6–1.6. **0.8–1.3 is the tested, comfortable range.** Climb heights scale with it; stair risers stay ≤ 0.42 m at any scale. |
| `y` | terrain height at `x, z` | Base height. |
| `id` | the kind (`kind2`, `kind3`... for repeats) | Unique id in this world (used for save flags). |
| `night` | `'auto'` | `'auto'` follows the sky palettes (`g.tod`). `true` / `false` / a number 0..1 / `g => bool` force it. Drives fire bursts, beams, pulsing glows, fireflies. |
| `mission` | — | A mission id. When Brady stands on the summit, the mission is started (if available) and completed with its token spawning **at the summit**. Works with any mission type; `type: 'custom', start: 'manual'` is the usual choice (see `BurnsBigArt.mission`). A locked mission is left alone. |
| `token` | — | `true` creates mission `bba_<id>` on the fly (or pass a string id). Prefer declaring the mission yourself so the hub's token total is right before the first visit. |
| `onReach(g, piece)` | — | Called the first time Brady reaches the summit in a visit. |
| `onArrive(g, piece)` | — | Called the first time Brady comes within `arriveR` of the piece (default 60% of its size) in a visit. Handy when a piece is a *destination* (event `bbaArrive`). |
| `reveal` | — | `[{x, z, label, col}]` world-space map markers added to the minimap when the summit is reached ("vantage point"). |
| `vantage` | `true` | The first time a summit is reached (saved per world), the camera slowly orbits the piece for ~4 s. Moving the stick cancels it. `false` disables, `'always'` replays every visit. |
| `glow` | `true` | `false` removes the piece's glow sticks (each piece adds roughly 8–20). |
| `lights` | `true` | `false` skips baked light pools. Pools are only baked when the world ever gets dark (any palette with the sun below ~8°). |
| `sign` | `true` | `false` skips the title sign (Knotted Semi, Pump Jack use one slot of the per-world sign atlas each). |

Kind-specific options and callbacks are listed with each piece (§4).

### The `piece` handle

| Field | Meaning |
|---|---|
| `kind`, `id`, `x`, `z`, `rot`, `s` | What and where. |
| `toWorld(lx, ly, lz)` | Piece-local point → world `[x, y, z]`. Use it to place your own NPCs, pickups, triggers next to the art. |
| `toLocal(wx, wz)` | World → local `[lx, lz]`. |
| `summit` | `{x, y, z, r}` world summit. `reached` is true once Brady has stood there this visit. |
| `spots` | Named world points per piece (cab roof, crow's nest, ear, pocket…), see §4. |
| `route` | The intended climbing route (piece-local). The glow sticks follow it and the test bot drives it. |
| `climbs`, `zips`, `movers`, `cols`, `parts` | The piece's climb zones, ziplines, movers and colliders (advanced). |
| `night()` | Current night factor 0..1 for this piece. |

### Other calls

- `BurnsBigArt.mission(kind, id, extra)` → a ready-made mission def (`type: 'custom', start: 'manual'`, name/desc/hint from the piece). Put it in `def.missions` and pass the same id as `opts.mission`.
- `BurnsBigArt.info(kind)` → `{name, desc, size, foot, height, summit}`. `BurnsBigArt.list()` → all kinds.
- `BurnsBigArt.pieces(g)`, `BurnsBigArt.piece(g, id)` → placed pieces in the running world.
- `BurnsBigArt.nightK(g, piece?)` → night factor.
- `BurnsBigArt.beamHits(g, x, z)` → true while a lit lighthouse beam sweeps over `(x, z)`.
- `BurnsBigArt.revealable(g, x, z, fn, r)` → register anything to be revealed once by a sweeping lighthouse beam (`fn(g, q)` runs once). Call it in `onStart` or later.
- `BurnsBigArt.state(g)` → `{climbing, riding: 'zip'|'loop'|null, air}`.
- `BurnsBigArt.burn(g, pieceOrId, opts)` → sets a piece on fire. The **Stick Cathedral** gets the full burn sequence (§4.5); every other piece gets a generic blaze over its own colliders (`{dur: 45, hazard: false, onDone(g, piece)}`).

### Mission events

Every piece reports what happens through `g.missions.event(name, data)`, so `custom` missions can listen in `onEvent`:

| Event | When |
|---|---|
| `bbaSummit` | A summit is reached (data = piece). |
| `bbaClimb`, `bbaClimbTop` | Brady grabs a net/ladder; Brady steps off at its top. |
| `bbaZip`, `bbaZipEnd` | Zipline ride starts / ends at the landing. |
| `bbaLoopStart`, `bbaLoop` | Bike enters / completes the Knotted Semi's loop-de-loop. |
| `bbaRamp`, `bbaStunt` | A launch ramp throws Brady (bike or on foot); he passes through the ring of fire. |
| `bbaFling` | The pump jack catapults Brady. |
| `bbaLit`, `bbaAllLit` | A lighthouse is lit; all three are lit. |
| `bbaReveal`, `bbaDarkwadsAll` | A beam reveals something (data `.kind` = `'darkwad'`, `'path'`, `'custom'`); every darkwad is lit up. |
| `bbaLaunch` | The Retro Rocket ignites. |
| `bbaArrive` | Brady first comes near a piece (see `onArrive`). |
| `bbaBurn`, `bbaTornado`, `bbaBurnDone` | A burn starts; the cathedral's fire tornado spins up; the burn is over (also on SKIP). |

Example: "loop the loop three times" is `{ id: 'loops', type: 'custom', count: 3, start: 'auto', onEvent(g, m, n) { if (n === 'bbaLoop') g.missions.progress('loops'); } }`.

---

## 3. Mechanics the module adds (no engine edits)

- **Climbable nets / ladders / rigging.** Push the stick into the net to climb (4.3 m/s), let go to hang, pull away to drop, JUMP to kick off. At the top Brady steps onto the platform automatically. Nets can lean (the galleon's shrouds). Brady can grab a net in mid-air.
- **Ziplines.** ACTION (`ZIP!`) at the anchor. Brady hangs from a trolley and accelerates down the cable; JUMP, ACTION (`LET GO`) or EXIT drops him; at the end he's flung forward onto the landing. The trolley slides back up for the next ride. (Implemented as a pseudo-vehicle on `player.vehicle`.)
- **Bike loop-de-loop.** Ride the yellow bike into the Semi's loop at ≥ 8.5 m/s: the ride takes over, carries bike and rider all the way round (with a side-on camera) and exits with a speed boost. Too slow: "MORE SPEED!".
- **Launch kickers.** The Semi's trailer lip actually throws the bike (or a running Brady) into the air.
- **Momentum.** Jumping off a rising platform adds its upward speed (the pump jack carrier, the giant's chest).
- **Summits + vantage camera**, **lighthouse beam reveals**, **per-frame sprite effects** (beams, cables, chase lights, god rays), all scoped to the current visit.

Things to know:
- The module wraps `g.fx.draw` and `g.updateCamera` on the running scene (per visit) to draw its sprites and override the camera during the loop ride and vantage pans. Real cutscenes always win.
- The module appends its ACTION prompts to `g.interactables` (re-adding them if a world replaces the array).
- Pseudo-vehicles show the HUD's EXIT button; it lets go of the zipline / finishes the loop.

---

## 4. The pieces

Footprints are local X × Z at scale 1, before rotation. "Front" = local +Z.

### 4.1 `knottedSemi`: The Knotted Semi
A big rig that tied its own trailer into a loop-de-loop and parked its cab on top of the knot.
- **Footprint** 22 × 66 m (z −21 … +40 incl. the landing zone). **Height** 20 m. **Summit** sleeper roof of the cab, 18.5 m.
- **Gameplay**
  - *Bike loop-de-loop*: enter through the open rear doors and the box-trailer tunnel (lane x = −2.4, heading +Z) at speed. 6.8 m radius, drifts 4.8 m right so the exit lane runs beside the entry.
  - *Launch ramp*: the exit lane's trailer nose kicks up to a 4.3 m lip (z = 24) and throws you through the **ring of fire** (z = 29, +5 glow sticks, `bbaStunt`).
  - *Climb*: spilled cargo crates up the left side (1.4 m steps), a leap to the yellow ratchet-strap net, up to the cradle deck (14.7 m), then fuel tank → hood → cab roof → sleeper roof.
  - Night: rainbow chase lights race round the loop, marker lights, headlight beams off the top, the ring burns.
- **Callbacks** `onLoop(g, piece, count)`, `onStunt(g, piece)`, `onRamp(g, piece)`.
- **Spots** `deck, cabRoof, lip, hoop, loopEntry, cargo, landing`.
- **Needs** ~40 m of clear run-up behind the rear doors (local −Z) for the bike, and ~20 m clear past the ring of fire.
- **Mission ideas** "King of the Knot" (summit); "Loop the Loop" (3 loops); "Ring of Fire" (hoop stunt); a bike race that ends with the loop.

### 4.2 `pumpJack`: The Pump Jack Colossus
A ten-storey nodding steel horse. Its arc head winds a bridle that lifts a level **carrier bar** straight up and down over the wellhead.
- **Footprint** 24 × 40 m (z −17 … +20, tank at x +8.6). **Height** 37 m at the top of the stroke. **Summit** the Gusher Tank lookout, 19.6 m.
- **Gameplay**
  - *Elevator*: the carrier runs 1.2 m ↔ 19.8 m every 16 s. Hop on at the bottom, ride up, step across to the tank top.
  - *Catapult*: stand on the yellow-black **FLING** plate when the stroke tops out and you're flung onto the **crow's nest** above the pivot (25.6 m, secret reward).
  - Jumping off the rising carrier keeps its momentum (big jumps).
  - Night: fire belches from the beam's stacks at the top of every stroke, the horse's eyes glow, the gas flare burns.
- **Options** `phase` (stroke phase offset, radians), `nestReward` (pickup spec for the crow's nest, default glow ring).
- **Callbacks** `onFling(g, piece)`.
- **Spots** `nest, tank, wellhead, carrierTop`. `piece.probe.carrierY()` gives the carrier height.
- **Mission ideas** "Ride the Nodding Horse" (summit); "Fling!" (`bbaFling`); a lookout mission that spots something on the horizon from the tank (W5).

### 4.3 `sleepingGiant`: The Sleeping Giant
A 60 m wooden giant asleep on his back, head on a pillow, nightcap flopped over.
- **Footprint** 20 × 64 m (boots at z −25, pillow to z +37). **Height** 13 m. **Summit** his nose, 12.8 m.
- **Gameplay**
  - Climb the tread of his **left boot sole**, walk down the instep, along the shin, over the knee and thigh, onto the belt.
  - His **chest and belly breathe** (±0.55 m moving platform; the folded hands are a bump to walk round or hop).
  - Up the beard to the mustache and the nose. **He snores** every 6.2 s: dust clouds, Z's, and a gust that blows Brady off the mustache back onto his chest. Time it.
  - **Secrets**: his left **ear** is a bowl you can stand in (from the pillow: lobe, then bowl) and his right thigh's **pocket** is a hole you can drop into. On LSD, dream clouds climb from his nose to a hidden dream bubble.
  - Night: shirt buttons and the nightcap pom-pom lantern glow, fireflies drift over him.
- **Options** `ear`, `pocket`, `dreamReward` (pickup specs: `'glow'`, a kind string like `'bag:weed'`, or `{kind, ...}`; defaults water / glow / glow stick), `dream: false`, `phase`.
- **Callbacks** `onSnore(g, piece)`.
- **Spots** `nose, ear, pocket, belly, boot`.
- **Mission ideas** "Tiptoe to the Nose"; a photo of Chinka in the ear; "don't wake him" stealth (fail on `pound` events near him); W9 dust-storm landmark.

### 4.4 `galleon`: The Landlocked Galleon
A three-masted galleon run aground on the playa, hull half buried, at the end of a pier on stilts.
- **Footprint** ~74 × 40 m: ship z −16 … +26 (bowsprit), pier along local −X from the port side to x −57, zip landing tower at x −62. **Height** 28 m. **Summit** crow's nest, 21.5 m.
- **Gameplay**
  - Walk the pier (lanterns) and the gangplank onto the deck.
  - Hop the port rail by the main mast onto the chain ledge, push into the **rigging** (a leaning net) and climb to the **crow's nest**.
  - **ZIP!** from the nest: a 60 m zipline over the pier down to the landing tower. Glow sticks hang along the line.
  - Treasure chest on the quarterdeck; captain's cabin windows, stern lanterns and portholes glow at night; a patched "art camp" fore sail.
- **Options** `treasure` (pickup spec on the chest).
- **Callbacks** `onZip(g, piece, zip)`, `onZipEnd(g, piece, zip)`.
- **Spots** `nest, deck, pierStart, zipEnd, chest, ledge`.
- **Mission ideas** "Crow's Nest Captain"; "Walk the plank" (zip as a timed escape); W7 sunrise lookout.

### 4.5 `stickCathedral`: The Stick Cathedral
A towering basket-woven cathedral of bent saplings: a pointed-arch nave and a twisted spire.
- **Footprint** 20 × 32 m (nave z −16 … +12, door at +Z). **Height** 38 m. **Summit** the bird's nest inside the spire, 26 m.
- **Gameplay** (a jungle gym): log step → woven nests → woven ladder → west gallery (7.6 m) → tie-beam across the nave → east gallery → nests → ladder to the crossing loft (15 m) → ladder up the spire's core to the bird's nest.
  - Day: sunlight shafts pour through the weave. Night: hanging lanterns, glowing rose window, a beacon on the spire.
- **Options** `nestReward`, `burnable` (default `true`: builds the low-detail collapse copies the burn needs, ~4.5k mover vertices; `false` to save them if you never burn it), `burned` (force the burned state).
- **Spots** `nest, loft, door, westGallery, eastGallery` (`pile` once burned).
- **Mission ideas** "Bird's Nest Bell"; hide-and-seek inside; W12 (Temple world) as a quiet climbing space; **the burn** (below).

#### The Burn (`BurnsBigArt.burn(g, cathedral, opts)`)
A 32-second set piece for the "go see a major art piece burn" side quest:
1. **The crowd gathers in a circle**: 26 burners walk in and stand in a ring 30 m out, facing the fire (Brady is waved back to the perimeter if he's inside).
2. **Fire runs up the woven lattice** (5 s → 15 s): flames climb from the ground to the spire tip, the sticks glow where the fire has reached, embers rise, smoke builds, **heat shimmer** ripples above the flames.
3. **A fire tornado** (13.5 s → 21 s) spins up inside the nave: a twisting 40 m column of flame throwing sparks; the crowd cheers.
4. **The structure collapses** (21 s): the woven cathedral vanishes into burning, falling sections (the spire topples, the nave halves fold in, the facade falls forward), with shakes and spark bursts.
5. **A glowing pile** remains: a mound of embers and charred logs that keeps burning (real fires: flicker light, and it burns if you walk in), with heat shimmer and the crowd dancing.

| Option | Default | Meaning |
|---|---|---|
| `cinematic` | `true` | Plays as a cutscene with its own camera moves and the **SKIP** button. Skipping jumps straight to the glowing pile (all end-state changes still happen, `onDone` still fires). `false` = the burn runs while Brady walks around. |
| `onDone(g, piece)` | — | Called once when the burn ends or is skipped. If the cathedral is already burned (a revisit), `burn()` calls it immediately. |
| `crowd` | `26` | Spectators to spawn (0 for none; each visible spectator is one draw). |
| `music` | — | Optional track to start (e.g. `'burns_w10'`). |
| `hazard` | `true` | The pile burns Brady if he walks in. |
| `persist` | `true` | Saves `bba:<id>:burned` for the world; on later visits the cathedral is built as the smouldering pile only (no summit, no climb). Pass `burned: false` to `place()` to rebuild it anyway. |

After the burn the cathedral's colliders, ladders, summit, lanterns and route glow sticks are gone. Burn it at night for the full effect (`g.setTod(1, 0.5)` first, or a night world).

### 4.6 `glowshroomGrove`: The Glowshroom Grove
Giant glowing mushrooms spiralling up around the Elder Shroom.
- **Footprint** ~30 × 30 m. **Height** 25 m. **Summit** the Elder Shroom's cap, 24 m.
- **Gameplay**: every cap on the spiral is a trampoline (spring 18.6, ~5.4 m bounce). Jump onto the smallest cap and steer to the next one up; double jump for margin. Little shrooms around the edge (some are baby trampolines).
  - Night: the caps pulse through the colours, flash when you bounce, spores drift up.
- **Options** `elderReward`, `beacon` (default `true`: a pulsing column of spore light rises 60 m over the Elder Shroom, brighter at night, so the grove reads as a destination from far away; `false` to hide it).
- **Spots** `elder`. `piece.caps` lists the bouncy caps.
- **Mission ideas** "Elder Shroom Summit"; collect spores (pickups) mid-bounce; W11 (sound camps) dance floor backdrop.

### 4.7 `lighthouses`: The Leaning Lighthouses
Three crooked lighthouses (Leaning Lou 24.4 m, Tipsy Tess 18.4 m, Crooked Kip 13.6 m) leaning on each other.
- **Footprint** ~34 × 34 m (+ the hidden bridge out to z +34). **Height** 30 m. **Summit** Lou's gallery, 24.4 m.
- **Gameplay**
  - Outside **spiral stairs** (walkable, 0.42 m risers, rails) up to each gallery. ACTION: **LIGHT IT!**
  - Lit lamps sweep twin beams (85 m reach). Beams **reveal**: hidden **darkwads** (burners with no lights: they appear, cheer and gift glow sticks) and a hidden **plank bridge** from Kip's gallery to the floating **Keeper's Cache**. Your own things too, via `opts.reveals` or `BurnsBigArt.revealable()`.
- **Options** `darkwads` (count, default 5, 0 for none), `lit` (`true` or `[bool, bool, bool]` to start lit), `bridgeVisible`, `cacheReward` (`null` for none), `reveals: [{x, z, r, fn(g, q)}]` (piece-local).
- **Callbacks** `onLit(g, piece, i)`, `onAllLit(g, piece)`, `onReveal(g, piece, {kind, actor?})`, `onDarkwads(g, piece)`.
- **Spots** `lou, tess, kip, cache, bridge`. `piece.darkwads` = the darkwad actors.
- **Mission ideas** "Keeper of the Light" (summit); "Light all three" (`bbaAllLit`); "No more darkwads" (`bbaDarkwadsAll`); W9 dust storm: beams reveal the path to the Man.

### 4.8 `retroRocket`: The Retro Rocket
A 31 m atomic-age rocket on three swept fins beside a red lattice gantry.
- **Footprint** 22 × 16 m (rocket at the origin, gantry x 7 … 13). **Height** 32 m. **Summit** the gantry top deck, 25 m.
- **Gameplay**: ladders inside the gantry, up through alternating hatches (5 m each), to the top deck; ACTION: **LAUNCH!** Countdown, rumble, steam, ignition, a 7-second fireworks show from the nose cone; the access arm swings away and back. Repeatable after ~17 s. Level 4 has the access arm to the hatch (reward).
- **Options** `hatchReward`.
- **Callbacks** `onLaunch(g, piece)`.
- **Spots** `top, button, hatch, nose`.
- **Mission ideas** "Push the Big Red Button"; finale fireworks cue (W10); a countdown race (climb before the launch).

---

## 5. Where they fit

### Confirmed uses

**World 16, Rhythm Wave: the Glowshroom Grove is the destination of the wobbly bike ride.** Place it far out on the playa so its beacon shows on the horizon, and finish the ride when Brady arrives on the bike:

```js
missions: [
  { id: 'shrooms', name: 'Ride to the Mushrooms', type: 'ride', vehicle: 'bike', start: 'manual',
    target: { x: 140, z: -220, r: 20 }, hint: 'The giant glowing mushrooms, out past the deep playa' },
  BurnsBigArt.mission('glowshroomGrove', 'elder', { name: 'Elder Shroom Summit' })
],
build(api, g) {
  const grove = BurnsBigArt.place(api, g, 'glowshroomGrove', 140, -220, {
    mission: 'elder',                      // token on the Elder Shroom's cap
    onArrive(g, P) { g.banner('THE MUSHROOMS', 'They are... breathing?', { col: '#b07aff' }); }
  });
}
```
Notes: the `ride` mission completes inside `r` while on the bike (`target` = the piece's `x, z`). The caps are trampolines on foot: Brady should hop off the bike (EXIT) to bounce up. The beacon and the pulsing caps are strongest at night; in a day world the beacon is a soft rainbow column.

**World 17, Root Society: "go see a major art piece burn" triggers the Stick Cathedral burn.**

```js
const cath = BurnsBigArt.place(api, g, 'stickCathedral', -120, 80, { rotY: Math.PI });
// ... when the side quest's moment comes (talk handler, trigger, Friday night):
g.setTod(1, 1);                                     // make it night if it isn't
BurnsBigArt.burn(g, cath, {
  onDone(g) { g.missions.complete('seeTheBurn'); g.say('brady', ['That was... the most beautiful thing I have ever seen.']); }
});
```
The burn saves itself (`persist`), so the home hub shows the smouldering pile on every later visit, and calling `burn()` again just runs `onDone` immediately. If W17 needs the cathedral standing again later, place it with `{ burned: false }`.

### Suggested

| World | Piece | Use |
|---|---|---|
| 3 Costume Cult & the Yellow Bike | `knottedSemi` | The first bike course: loop + ramp + ring of fire. |
| 5 Costco / 6 Art Car Hunt | `pumpJack` or `lighthouses` | The lookout: spot the octopus's fire from the tank or with a beam. |
| 7 Sunrise Set | `galleon` | Crow's nest at sunrise, zip down to the dance. |
| 9 Deep Playa Showdown | `lighthouses`, `sleepingGiant` | Beams cut through the dust; the giant looms out of the storm. |
| 11 Sound Camp Crawl | `glowshroomGrove` | Pulsing at night beside the stages. |
| 12 The Temple | `stickCathedral` | A quiet climb (keep combat away). |
| 10 Finale | `retroRocket` | Fireworks. |

---

## 6. Cost (performance)

Measured in the sandbox at scale 1 (vertex counts are static geometry merged into the 48 m chunks; each piece adds 1–3 static draws when in view plus its movers, which share the world's skinned groups).

COST_TABLE

All pieces stay inside the guide's budget: placing one or two in a world adds a few thousand to ~40k triangles and 2–6 draw calls in view. The per-frame sprite effects add < 250 quads in the worst case (Knotted Semi chase lights at night). Each piece's update is O(1) apart from the lighthouses' reveal checks (O(beams × revealables)).

---

## 7. Testing

- Sandbox: `window.BRADY_BURNS.debug.play(99)`; `BurnsBigArt` is on `window.BRADY_BURNS_BIGART` for tests. Set `scene.tod = 1` for night.
- The scripted tests (Playwright) drive Brady with real inputs along each piece's `route` to its summit, ride the loop, launch off the ramp, get flung, zip, light the lamps, and launch the rocket, in both orientations with zero page errors.
