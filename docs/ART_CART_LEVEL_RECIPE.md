# How to build an Art Cart career track

Love Parade (Bass Valentine's track) is the worked example. Copy its shape, not its content: every track needs its own layout, look, obstacles and enemies.

- Example: `src/43_cart_j_loveparade.js`
- Shared kit: `src/43_cart_j_kit.js`
- Test: `tools/cart_track_test.js`

## 1. Files

| File | What goes in it |
|---|---|
| `src/43_cart_j_<track>.js` | One new file per track: layout, world builder, rules, debug shots. Name it after the track, e.g. `43_cart_j_discoreef.js`. |
| `src/43_cart_j_kit.js` | Shared plumbing. Add here only what several tracks need; keep it small and commented. |

Nothing else needs editing. Each piece of the engine reaches your file through a hook:

| Hook | Where it lives | What it does |
|---|---|---|
| `D.world` | `CartWorlds.track` | Hands you the whole build. |
| `CART_TRACK_RULES[id]` | `CartRaceScene` constructor | Becomes `s.rules` for your track. |
| Pooled groups pushed into `s.ix.groups` | `cartItemsRender` | Draws them. |

Before a file lands in `src/`, run `node --check` on it. A half-written file breaks every app's build.

## 2. Registering the track

Put this at the top of your file:

```js
CART_TRACKS.discoreef = {
  name: 'DISCO REEF', car: 'fish', tod: 'night', music: 'kart3', width: 20, shoulder: 6, blurb: '…',
  pts: CartKit.course(POLY, { start: [x, z], width: (x, z) => 1, step: 18 }),
  world: (id, D) => myWorld(id, D)
};
CART_CAREER_TRACKS.fish = 'discoreef';        // assign only, never redeclare
CART_TRACK_RULES.discoreef = { … };           // section 4
```

What the fields do:

- **`car`** names the level's car. That car's signature special joins everyone's gift-box pool on this track (`cartTrackPoolCar`). C1's career flow also passes `opts.levelCar`.
- **`pts`** comes from `CartKit.course(poly, o)`. `poly` is a list of corners `[x, z, cornerRadius]`.
  - Corners are filleted, and long straights are split every `step` metres so the width can change along them.
  - `start` is the point the start line moves to. Put it on a straight with at least 70 m behind it for the grid.
  - `width(x, z)` returns a width scale at that point. Love Parade uses it to widen the dance floor to 1.6×.
- **Lap length:** aim for 1000–1200 m. Existing tracks run about 1.0–1.3 km, which gives 3 laps of roughly 40–50 s each.
- **Corner radius** sets speed. A radius of 15 m is a real chicane; 40 m is a fast sweeper. The AI's speed profile is `1.95 / curvature`, capped at 60 m/s.

## 3. The world: `myWorld(id, D)`

The order matters; follow Love Parade's `lpWorld`:

1. **Base world:** `const { E, T, api, rng } = CartKit.world(id, D, { worldId, night, sky, ground, road: {...} })`.
   - `sky` is a palette object. Start from a `BURNS_PALETTES` entry and override colours.
   - `road` sets the painted road: shoulder, band, edge colours, `edgeW`, and `centerFn` for a custom centre pattern.
2. **Your own ground paint:** `api.paint((ctx, P, S) => …)`. Use it for plazas, crossings and special areas. `P(x, z)` maps world to canvas; `S` is pixels per metre.
3. **Barriers and lamps:**
   - `CartKit.rails(E, T, (i, tight, side) => colour)` places barriers. At night it also adds the glow spill that keeps road edges readable.
   - `CartKit.lamps(E, T, palette, gap)` places lamp posts.
4. **Instanced props of your own:**
   - Register them with `CartKit.kinds(E, { myid_x: { r, near, mid, farD, build(m, o), far(m, o), glows, pool } })`.
   - Place each copy with `CartKit.put(E, id, x, z, yaw, colour, o)`. Build near-white geometry where the tint should apply.
   - Use instancing for anything repeated more than about 5 times: stacks, balloons, edge studs.
5. **One-off set pieces:** `CartScene.mesh(api, x, z, yaw, m => {...; return { cols, lights }}, { hi: true, noAO: true })`.
   - These merge into the static chunks.
   - Everything must sit outside the road walls: check with `CartWorlds.clear(T, x, z, r)`.
   - Arches over the road need clearance of 8 m or more at their lowest point over the road, so the chase camera (4–7.5 m up) never clips them.
   - Give columns `camPass: true` so the camera passes through them.
6. **People:**
   - `CartKit.crowd(E, T, s0, s1, side, rng, { rows, off })` adds spectators who cheer when cars pass.
   - Add named characters with `E.heroes.push({ type, x, z, yaw, anim })`.
   - `E.spots` collects crowd spots; `CartScene.bleachers` returns some.
7. **Gameplay furniture:**
   - `CartKit.gifts(E, T, [fractions])` places rows of 5 gift boxes.
   - `CartKit.boosts(E, T, [[f, d]])` places boost pads.
   - `CartKit.grid(E, T)` sets the 8 start slots.
8. **Sky dressing:** `CartDecor.skyline(E, T, rng)` adds the far city. Searchlights and laser fans are `E.beams` entries.
9. **Finish:** `return CartKit.finish(E)`.

Find positions by arc length:

- `CartKit.sOf(T, x, z)` gives the arc length nearest a point.
- `CartKit.at(T, s, d)` gives a point at arc length `s`, lateral offset `d`. Lateral `d` is positive to the right of travel.
- `T.at(s, {})` returns `x, z, nx, nz, tx, tz, hw` (road half-width), `wl` / `wr` (walls) and `k` (curvature).

Store what the rules need on `E.yourLevel`, e.g. `E.lp = { S: {...}, subs: [...] }`.

## 4. Obstacles and enemies: the rules

```js
CART_TRACK_RULES.mytrack = {
  onLoad(s)                      // build the pooled meshes: CartKit.group(s, [['name', build(m, i), count], …]); state on s.myLevel
  onUpdate(s, dt, racing)        // every sim step: move the enemies, test the cars, register AI obstacles
  onStep(s, k, dt, racing)       // per car, after the AI chose its inputs and before it moves: AI braking / hopping
  draw(s, R, S, t)               // sprites: telegraphs, waves, glows (R.flat.flat on the ground, R.bbs.bb billboards, R.bbs.streak)
  lights(s, add)                 // dynamic point lights (add(x, y, z, r, rgb, intensity, priority))
  hud(s, ctx, W, H, top, left)   // 2D: blinding overlays, first-lap hints
};
```

### The pattern every hazard follows

Love Parade's sub, drone, conga line and cannon each do all of these:

1. **A clear cycle.**
   - Tie it to a clock: the beat `s.time / LP_BEAT`, or a period with an offset per instance.
   - Stagger the instances so the road is never fully blocked.
2. **A telegraph of at least 0.9 s** that reads on a phone at speed:
   - something moves (a cone quivers, a barrel tilts and fizzes);
   - the road shows the danger area (a flashing cone, closing rings, a target reticle);
   - for anything dropped, a shadow grows.
3. **The effect,** tested against `s.karts`:
   - **Hits:** `CartKit.hit(s, k, 'spin' | 'knock' | 'flip', tag, { dur, banner })`. These count for tests, respect shields and invulnerability, and show a banner.
   - **Softer effects:** shoves, blinding, slowing. Change the car directly (`k.vx` / `k.vz` impulse, `k.slowT`, `k.lostT`) and record it with `CartKit.touch(s, k, tag, banner)`.
   - **Firing:** call `CartKit.fired(s, tag)` every time the hazard goes off.
   - **Masks:** use a bitmask per car (`mask |= 1 << k.slot`) so one wave or blast affects a car only once.
4. **A skill counterplay.** State it in the code comment and in the first-lap hint:
   - HOP the bass wave: airborne cars are skipped;
   - steer off the reticle;
   - brake for or find the gap in the line;
   - pass while the cannon reloads.
   - Shields (`k.shieldT`) should block hits.
5. **AI handling:**
   - `cartIxObs(s, x, z, r)` registers an obstacle for this step; the racing AI steers around it. It covers mines, the conga dancers, and the cannon's cone while armed.
   - To ask how far ahead a hazard is, keep its arc length and use `CartKit.ahead(s, k, sv)`. Never call `T.locate` on a far point: it only searches near its hint.
- `onStep` adjusts `k.inp` for AI cars: `I.gas = 0` / `I.brake` to wait for a gap, `I.driftPress = true` to hop.
   - Skip the player unless `s.autoDrive` is on.
   - Make AI success depend on `k.ai.skill`, so good AI usually dodge and weak AI sometimes don't.
6. **Feel:**
   - Sound: `cartIxSound(s, name, x, z, vol, pitch)` fades with distance; reuse the existing sounds.
   - Shake: `s.shakeIt(a)` when the player is close (`CartKit.near(s, x, z, r)`).
   - Particles: `s.fx.confetti`, `.hearts`, `.notes`, `.spark`, `.dust`.

### Moving meshes

- `CartKit.group(s, [['name', build(m, i), n]])` returns `{ name: [objs] }`.
- Each object has `live, visible, x, y, z, yaw, pitch, roll, scale`. Set them every update.
- One group holds up to 32 objects on the low tier and 64 above; the kit starts a new group, costing one more draw call, when it is full.
- Keep one group per track, about 50 objects. Characters with swinging legs are a body object plus two leg objects pivoted at the hip.

### The road at night

The road edges must always read at night. Love Parade uses three layers:

- emissive LED rails, with glow and light pools from `rails()`;
- painted bright edge lines;
- an instanced emissive stud every 5 m on both edges.

## 5. Budgets and allocation rules

- **Per view (iPhone):** at most 420k triangles and 120 draw calls, main pass and shadow pass together.
  - Love Parade peaks at about … (see the C3 report).
  - Instanced kinds cost 1–3 draws each.
  - Each static set piece is merged into 64 m chunks.
  - Watch the number of instanced kinds and pooled groups.
- **No allocations per frame** in update, draw or hud:
  - preallocate scratch objects (`LP_T`);
  - don't use `.map` or `.filter` in loops that run every step;
  - closures created once at load are fine.
- **Particles:** spawn them only near the camera (`CartKit.near`); far hazards still run their logic.

## 6. Testing

1. Add your shots. Register `BRADY_CART.debug.levelShots()` and `levelShot(name)` in your file; see the end of the Love Parade file.
   - Each shot parks the player where the hazard plays out (frozen, facing it), steps the sim until the moment, and renders.
2. Run the test:

   `BRADY_DIST=<dist> node tools/cart_track_test.js <track> <shotsDir> [refTrack=neon]`

   It checks:
   - two full 8-kart races on autopilot (one in career mode): every kart finishes, nobody is stuck, and lap time per km is within range of the reference track;
   - every hazard that fired also landed, and the hit count is not absurd;
   - the grid plus 10 pack views round the lap, against the peak triangle and draw budgets.
3. Read the screenshots: `view-*.png`, `hazard-*.png`. Fix whatever is unreadable, unfair or dull.
4. Start without the menus: `BRADY_CART.debug.start({ mode: 'career', track: '<id>' })`, or `mode: 'quick'`.
