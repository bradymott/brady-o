# BRADY GOES TO BURNING MAN: World Authoring Guide

This guide is for agents building the worlds of **Brady Goes to Burning Man**, a 3D adventure that ships as its own app. The engine and World 1 are already done. You add a world by creating one file, `src/42_burns_worldN.js`, that calls `BurnsWorlds.register({...})`. You shouldn't need to touch the engine. If you hit a real gap, add the smallest possible hook to the engine and say so in your report.

- Engine: `src/40_burns_a_core.js` … `src/40_burns_l_app.js`
- Worked example: `src/42_burns_world1.js` (World 1, "The Line")
- App entry point: `Game.setScene(new BurnsAppStart())`, the cinematic title screen (continue / new game / settings / camera), which flows into the hub (`new BurnsHubScene()`).
- **Branding.** Nothing the player sees says "Brady-O": no titles, menus, dialogue, credits or signs. The hero is just **Brady**.

---

## 1. Ground rules

- **One IIFE, shared names.** `node tools/build.js` concatenates `src/*.js` alphabetically into one IIFE in strict mode. Prefix every top-level name you declare with `Burns`, `BURNS_` or `burns` and make it unique to your world, for example `BURNS_W4`, `burnsW4Helper`. Files load in name order, so `43_…` can use everything in `40_…`.
- **Build privately.** Other agents edit other files at the same time, so never overwrite the shared `dist/`:
  `BRADY_DIST=<your scratchpad>/dist node tools/build.js`, then open `<your scratchpad>/dist/brady-o.html`. If the build breaks because of someone else's half-written file, wait a minute and retry.
- **Coordinates.** Y is up and units are metres. The playa floor is `y = 0` unless you give a height function.
- **Yaw.** `yaw = 0` faces **+Z**. Forward is `(sin yaw, 0, cos yaw)`; to face a point, `yaw = Math.atan2(dx, dz)`. North (toward the city, the gate in W1) is **−Z** by convention, which is `yaw = Math.PI`.
- **Scale.** Brady is about 1.85 m tall. A single jump peaks at about 2.0 m, a double jump at about 3.6 m, and a ledge-assist mantle catches tops up to about 1.45 m above the feet. An RV roof is 3.3 m, a box truck 3.8 m, a car 1.0–1.5 m.
- **Look: rounded and soft, not blocky.** The art style is smooth-shaded, rounded, toy-like 3D with soft light (the quality bar of the best late-90s 3D platformers, with original designs). Build anything the camera gets near from the **rounded primitives** (`api.roundBox`, `api.sphere`, `api.capsule`, `api.cylinder`, `api.cone`, `api.lathe`, `api.torus`, and `m.roundBox` / `m.ellipsoid` / `m.limb` / `m.lathe` in custom meshes; see §4.2 and §6.1). Keep hard `box`/`bbox` for distant clutter, thin trim and signs. Library props (`api.prop`) and all characters are already rounded.
- **Tone.** Keep it funny, short, burner-specific and original. Don't use real names or brands, and don't copy any existing game's characters, levels or music. Real landmarks get original designs: show the spirit, not a replica. Power-ups are labelled baggies or items, and **nobody is ever shown using them**. The Orgy Dome world stays comedic, with nothing explicit.

---

## 2. Quick start: a minimal world

```js
/* src/43_burns_world2.js */
const BURNS_W2 = { state: null };

BurnsWorlds.register({
  id: 2, name: 'Finding Camp', sub: 'The city at night',
  sky: 'night',                 // palette name or object (see §9); sky2 + tod blend two palettes
  music: 'burns_w2',            // falls back to an existing track until the audio agent adds it
  bounds: [-150, -150, 150, 150],             // x0, z0, x1, z1 (playable area, soft walls)
  spawn: { x: 0, y: 0, z: 120, yaw: Math.PI },
  ground: { base: '#b89070', crack: 0.25 },
  missions: [
    { id: 'camp', name: 'Find Your Camp', type: 'reach', start: 'auto', target: { x: 40, z: -60, r: 4 },
      desc: 'Your camp is at 7:30 and... somewhere.', hint: 'Somewhere past the big neon flamingo' }
  ],
  build(api, g) {
    api.road([[0, 140], [0, -140]], 12, { tracks: [-2, 2] });
    api.prop('rv', { x: 8, z: 40, yaw: 0.2, seed: 1 });
    api.prop('dome', { x: -30, z: 0, r: 7, lights: true });
    api.npc({ id: 'bob', name: 'BOB', type: 'crusty', x: 2, z: 100, lines: ['Welcome home!', 'Camp is that way. Probably.'] });
    api.glowLine(0, 90, 0, 50, 10);
    api.checkpoint('cp1', 4, 110, { name: 'Esplanade' });
  },
  onStart(g) { g.banner('FINDING CAMP', 'The city never sleeps. Neither will you.'); }
});
```

That's a complete, playable world. The hub lists it automatically once it registers. Worlds unlock in order: World N opens after World N−1's boss.

---

## 3. World definition (`BurnsWorlds.register(def)`)

| Field | Type | Meaning |
|---|---|---|
| `id` | number 1–15 | Required. Matches `BURNS_WORLD_META` (hub name, colour and pin position). The id is permanent; the "World N" players see is its place in the play order (§3.1). |
| `name`, `sub` | string | Title and subtitle. Defaults come from the meta table. |
| `build(api, g)` | function | Required. Builds terrain, props, NPCs, pickups and missions. Runs once per visit, before the first frame. |
| `missions` | array | Mission definitions (§7). Missions with `token !== false` are the world's Burn Tokens; aim for 5–7. |
| `bounds` | `[x0, z0, x1, z1]` | Playable rectangle. Brady and NPCs are clamped inside it. Keep it a few hundred metres. |
| `spawn` | `{x, y, z, yaw}` | First spawn. Later visits resume at the last camp flag (§5.9). |
| `sky`, `sky2`, `tod` | palette(s), 0..1 | Sky, fog and lighting (§9). `g.tod` blends `sky` → `sky2`. |
| `ground` | `{base, crack, mottle, res, height(x,z)}` | Playa colour, crack strength (0–0.5), mottling, paint resolution (m/px, default 0.5), optional height field. |
| `music` | string | Track name, for example `burns_w2`. |
| `dust` | number | Ambient dust multiplier (default 1). |
| `bike` | bool | Force the yellow bike available in this world (it normally comes from `items.bike`). |
| `onStart(g)` | fn | After the world is built and Brady is spawned. Start intro cutscenes here. |
| `update(g, dt)` | fn | Every simulation step (120 Hz, already slowed by the K-Hole). Keep it cheap. |
| `env(g, env)` | fn | Per frame: tweak the lighting `env` (for example fog during a dust storm). |
| `onRespawn(g)` | fn | After Brady faints and respawns. |
| `drawSkinned(g, R)`, `drawSprites(g, R)` | fn | Advanced: extra draws (§10). |
| `drawDist` | number (m) | How far static geometry draws (default 260, or 120 in fog). Lower it for big worlds seen from high places (W2's rooftops); fog hides the edge. |
| `chunkSize` | number (m) | Static geometry is merged per square cell this size (default 48). Bigger cells mean fewer draw calls but coarser culling. |
| `ao` | `true` / `'fast'` / `false` | Baked ambient occlusion for props and movers: `'fast'` uses a coarser grid (about 6× quicker to build, a little softer); `false` skips it (for huge or procedurally filled worlds with long load times). Per object: `{ noAO: true }`. |
| `day`, `dayShort` | string | Day of the week shown on the intro card, the loading card and the hub pin (for example `'Monday'`, `'MON'`). Defaults come from the table in §3.1, so you rarely need it. |
| `dayCard` | bool | `false` skips the automatic day card at the start of a visit. Show it yourself later with `g.dayCard()` (for example at the end of your intro cutscene). |
| `home` | bool | Marks Brady's home world (world 17 already has it). The hub shows it as a tipi pin with a HOME button. |
| `boardTitle` | string | Title of this world's quest board (§7.1), e.g. `'ROOT SOCIETY JOB BOARD'`. |

### 3.1 Play order, days of the week and the home world

The story is one week at the Burn: Brady arrives a clueless first-timer and leaves a full-on burner. Worlds are played in this order, by **id**. It's `BURNS_WORLD_ORDER`, also available as `BurnsWorlds.order`:

| Shown as | World id | Name | Day (`BurnsWorlds.day(id)`) |
|---|---|---|---|
| World 1 | 1 | The Line | Sunday, arrival |
| World 2 | 2 | No Camp | Sunday night → Monday |
| World 3 | **16** | Rhythm Wave | Monday |
| World 4 | **17** | Root Society: Brady's **home** | Tuesday |
| World 5 | 3 | Costume Cult | Tuesday |
| World 6 | 4 | The Orgy Dome | Tuesday night |
| World 7 | 5 | Costco Soul Trading Co. | Wednesday |
| World 8 | 6 | The Art Car Hunt | Wednesday night |
| World 9 | 11 | Sound Camp Crawl | Thursday night |
| World 10 | 7 | Sunrise Set | Friday dawn |
| World 11 | 8 | Hell Station | Friday |
| World 12 | 9 | Deep Playa Showdown | Friday night |
| World 13 | 12 | The Temple | Saturday dawn |
| World 14 | 13 | The Workshops | Saturday |
| World 15 | 14 | Skydive Into the Burn | Saturday afternoon |
| World 16 | 10 | The Man Pavilion (finale) | Saturday night |
| Secret | 15 | Exodus | Monday |

- **Ids never change.** Files (`src/42_burns_world16.js` …), saves, tokens, photos, flags and `debug.play(id)` all use the id. Only what players see uses the position.
- **Unlocking.** `g.finishWorld()` unlocks `BurnsWorlds.next(id)`, the next world in the order (finishing id 2 unlocks 16, 16 unlocks 17, 17 unlocks 3). Old saves migrate automatically: any finished world unlocks the next one in the sequence, and nothing that was unlocked is ever re-locked (a save that had finished world 2 now also has 16 open).
- **Labels.** Never print `'World ' + id`.
  - Use `BurnsWorlds.label(id)` (→ `"World 5"` for id 3, `"Secret World"` for 15) or `BurnsWorlds.num(id)` (→ `5`).
  - Lookups: `BurnsWorlds.idAt(n)`, `next(id)`, `prev(id)`, `isFinale(id)` (id 10), `isSecret(id)` (id 15), `isHome(id)` (id 17), `home()` (→ 17), `visible()` (the ids the hub shows).
  - The hub, loading card, day card, pause menu and results screen already do this.
- **Days of the week.** `BurnsWorlds.day(id)` → `'Tuesday night'`, `BurnsWorlds.dayShort(id)` → `'TUE NIGHT'`. A world can override them with `day`/`dayShort` in its definition.
  - The **loading card** and the hub panel show the full day, and every hub pin has its short day above it.
  - A **day card** ("TUESDAY NIGHT · World 6 · The Orgy Dome") fades in over the first seconds of every visit, under any letterbox. Turn it off with `dayCard: false` and call `g.dayCard()` when you want it.
  - Write dialogue that fits the day ("It's only Monday and I'm already crispy").
- **The home world (17, Root Society).** Brady's tipi is his home from Tuesday on.
  - Once unlocked it stays playable from the hub like any world, shown as a **tipi pin** with a HOME label, plus a **HOME** shortcut button in the hub header.
  - Its main story should end with `g.finishWorld()` (that unlocks world 3); later visits are free roam for side quests (§7.1). Use `BurnsSave.flag(17, …)` to skip the arrival story on return visits.
  - The hub panel shows how many of its side quests are done.
- **Hub.** It shows the pins in play order. Unregistered ids show "SOON"/"Coming soon" and can't be started, so nothing breaks while a world is in progress.
- **Secret World 15 "Exodus".**
  - It's hidden from the hub, not even "coming soon", until it's unlocked. After that it shows as a glowing RV pin labelled SECRET.
  - It unlocks when the finale is finished: `g.finishWorld()` in world 10 unlocks `next(10)` = 15, and the results screen says "A SECRET WORLD HAS BEEN UNLOCKED…".
  - The finale can also unlock it explicitly after the credits with `BurnsSave.unlockWorld(15)`.
- **Story order.** 16 (Monday) and 17 (Tuesday) sit between No Camp (2) and Costume Cult (3). World 11 comes after the art-car hunt (6) and before Sunrise Set (7). Worlds 12, 13 and 14 come after the Deep Playa showdown (9) and before the finale (10).
- **Ground scores start in world 16** (§8.3): before Bam Bam's pill, baggies are hidden everywhere, including worlds 1 and 2.

---

## 4. The build API (`api`)

Everything below is called inside `build(api, g)`. Positions are world metres. Most calls return the created object.

### 4.1 Ground and light
- `api.road(points, width, {col, edge, tracks: [offsets], dash})`: paints a dirt road along `[[x,z], …]` with optional tyre tracks.
- `api.patch(x, z, r, colour, alpha)`: soft colour blotch on the playa.
- `api.paint((ctx, P, S) => {...})`: draw anything on the ground with Canvas2D. `P(x,z)` gives canvas px and `S` is px per metre. Paint is albedo only and is multiplied by lighting.
- `api.light(x, z, radius, colour, intensity=0.5)`: baked **light pool** on the ground (lightmap). Use these generously at night: camps, fires, lamp posts, neon.
- `api.glow(x, y, z, size, colour, {blink})`: additive glow billboard (lamps, neon dots, LEDs). They're cheap, so use hundreds.
- `api.height(x, z)`: terrain height.

### 4.2 Static geometry (merged into chunk buffers)
- `api.prop(kind, opts)`: places a library prop (§5). Common opts: `x, y, z, yaw, scale, seed`, plus per-prop options. Returns `{cols, lights, top, …}`.
- `api.box(x, y, z, w, h, d, colour, {yaw, bevel, e (emissive 0..1), noCol, col: {collider overrides}})`: a visible box with a matching collider. Your go-to platform. `y` is the box bottom.
- **Rounded shapes: use these first.** Smooth-shaded, soft-edged solids with matching colliders. `y` is the **bottom**. Shared opts: `{yaw, e (emissive 0..1), gloss (shine 0..3: 1 satin, 2 plastic/paint, 3 glass/chrome), noCol, col: {collider overrides}, seg, tag, cover}`. Each returns the same `{cols, wcols}` info as `api.box`.
  - `api.roundBox(x, y, z, w, h, d, colour, {r, top, bottom})`: a box with rounded edges and corners (`r` = edge radius, default 22% of the smallest side; `top`/`bottom` recolour those faces). Box collider, walkable top. Your go-to platform, crate, stage, couch or counter.
  - `api.sphere(x, y, z, r, colour, {squash})`: smooth ball or blob (`squash` < 1 flattens it into a mound). Dome collider; Brady can stand on top.
  - `api.capsule(x, y, z, r, h, colour, {r1})`: pill of total height `h` (radius `r`, top radius `r1`). Cylinder collider. Bollards, posts, cacti, soft pillars.
  - `api.cylinder(x, y, z, r, h, colour, {r1, round})`: drum, pillar or table with softly rounded rims (`round` = rim radius); with `r1` it tapers smoothly to top radius `r1`. Cylinder collider.
  - `api.cone(x, y, z, r, h, colour)`: soft-tipped cone (traffic cones, spires, party hats). Cylinder collider (60% radius, 75% height).
  - `api.lathe(x, y, z, profile, colour, {seg, colScale, flip, theta0, theta1…})` (every `m.lathe` option passes through): any surface of revolution. `profile` is `[[radius, height, colour?, emissive?], …]` from bottom to top; start or end at radius 0 to close it, and **repeat a point** to get a crisp rim. Vases, lamps, totems, onion domes, mushrooms, trophies, bottles. Cylinder collider of the widest radius × `colScale` (0.9).
  - `api.torus(x, y, z, R, r, colour, {pitch, roll})`: ring or hoop (`pitch: Math.PI/2` stands it up like a wheel). No collider.
- `api.mesh(x, z, m => { …; return {cols, lights}; }, {y, yaw, scale})`: custom geometry with `BurnsMesh` (§6) in local space. Return colliders and lights in **local** coordinates and they're transformed for you.
- `api.collider(desc)`: a raw collider in world coordinates (§4.6).
- `api.sign(text, x, z, {yaw, h, y, post, maxW, style: {bg, fg, size, border, glow, font}, glow})`: a signboard with real text. `\n` makes lines. Each world gets a fresh 1020×1020 px sign area: signs rasterise at 72% and automatically drop to 52% and then 38% when it runs low, so 40+ signs fit without going blank. Identical text + style is cached, so repeated signs are free. `glow` is a colour.
- `api.hidden(() => { … })`: everything built inside, geometry, colliders and glows, **only exists while Brady is on LSD**. Pair it with pickups that have `hidden: true`. Light pools (`api.light`) are baked into the lightmap and always show, so keep them out of hidden sections.

### 4.3 Dynamic things
- `api.mover(build, opts)`: a moving rigid object (platform, door, barrier arm, vehicle) drawn in a shared skinned group (one draw call for up to about 40 objects). `build(m)` returns `{cols, lights}` in local space. Animate it by setting `mv.x, y, z, yaw, pitch, roll, scale, visible` in `api.update` or `def.update`. Brady **rides** movers he stands on. Set `mv.noCollide = true` to disable its colliders.
- `api.traffic({seed, lanes: [{id, points: [[x,z],…], vehicles, gap: [min,max], speed, waveRate, wave: false, kindAt: i => 'rv'|'car'|…, recycle: false}]})`: lanes of vehicles that follow each other with stop-and-go waves and recycle from the front to the back. Cars expose `{mv, s, len, v, sleep}`. Set `car.sleep = true` to stall a car and everything behind it. W1 uses this for the line.
- `api.artCar({x, z, yaw, build, maxSpeed, path, pathSpeed, label, drivable, when})`: a **drivable art car** (§8.2). It's also a walkable moving platform.
- `api.update((g, dt) => …)`: per-step world logic (same as `def.update`).

### 4.4 Characters
- `api.npc(def)` and `api.enemy(def)`: §6.3 covers the full actor definition. `npc` is friendly and `enemy` isn't.
- `api.crowd(x, z, radius, n, {types, behaviors, lines, extra})`: ambient burners that dance, idle and wander.

### 4.5 Pickups
- `api.pickup(kind, x, y, z, opts)`. `y` is the float height and defaults to 0.9. Kinds:
  - `'glowstick'`: the coins.
  - `'water'`: +2 hydration.
  - `'bag:<power>'`: a **ground score** baggie: `molly | khole | powder | lsd | shrooms | weed | bufo | liquor`. Picking it up puts it in Brady's **backpack** (§8.3); he uses it from there when he wants. Baggies are **invisible until the ground-score story flag is set** in world 16, then appear everywhere (even mid-visit). `'bag:water'` is plain water (instant, never hidden).
  - `'pack:<item>'`: any backpack item (§8.3), for quest items and trade goods such as `pack:icebag`. Never hidden by the ground-score flag. Its label defaults to the item's name.
  - `'token'`: Burn Token (normally spawned by missions). Give it `{mission: id}`.
  - `'photo'`: Photo of Chinka. **Requires `{id}`**, unique per world, three per world. It's saved and won't respawn.
  - `'item:<id>'`: key item (`ticket | map | www | bike | costumes | artcar`) or a mission collectible such as `item:ziptie`.
  - Opts:
    - `mission`: ties the pickup to a mission. Picking it up fires the `pickup` event.
    - `gate: true`: only visible while that mission is active.
    - `hidden: true`: LSD-only.
    - `label`: floating label text.
    - `icon`: atlas icon (§6.2).
    - `id`, `persist: false`.
    - `onTake(g, P)`: callback when collected.
    - `follow(g, P)`: called every step so you can move the pickup (set `P.x`, `P.z`, `P.y0`). W1's ticket uses this.
- Helpers: `api.glowLine(x0,z0,x1,z1,n,y)`, `api.glowRing(x,z,r,n,y)`, `api.glowArc(x0,y0,z0,x1,y1,z1,height,n)`, `api.glowsticks([[x,z]|[x,y,z],…])`.
- Budget roughly 120–200 glow sticks per world. Place them along routes and arcs that teach jumps, not in random piles.

### 4.6 Colliders
Colliders are plain objects. All of them are walkable on top unless `walk: false`, and solid from the side unless `solid: false`.

| `t` | Fields | Notes |
|---|---|---|
| `'box'` | `x, z, hx, hz, y0, y1, yaw` | Oriented box, half extents. Most props. |
| `'cyl'` | `x, z, r, y0, y1` | Poles, barrels, pillars. |
| `'dome'` | `x, z, r, y0` | Hemisphere. You can walk on the gentle part and the steep base blocks you. |
| `'ramp'` | `x, z, hx, hz, y0, ya, yb, yaw` | Top rises from `ya` at local −z to `yb` at +z. |

Optional flags:
- `cover: true`: blocks the Man's neon flash. Vehicles, booths, porta-potties and domes set it by default.
- `camPass: true`: the camera ignores it (thin poles).
- `spring: <vy>`: launches Brady upward on landing.
- `hidden: true`: LSD-only.
- `off: true`: temporarily disabled. Toggle it at runtime, as W1's gate barrier does.
- `tag`: any string, for your own lookups.

### 4.7 Hazards, triggers, checkpoints, markers
- `api.fire(x, y, z, r)`: burning barrel or fire patch. Touching it hurts; it emits particles, a point light and a light pool.
- `api.flameJet(x, y, z, {h, period, on, phase, r})`: a periodic poofer column. It warns with sparks, then fires.
- `api.mud(x, z, r)`: sinking grey-water mud. It slows Brady and sinks him, and if he stays too long it costs a drop.
- `api.spring(x, y, z, power)`: trampoline (`power` = launch velocity; 19 is about 5.6 m).
- `api.trigger({x, z, r | box: [hx,hz], y0, y1, once, when(g), onEnter(g,t), onExit(g,t), onStay(g,t,dt)})`.
- `api.checkpoint(id, x, z, {yaw, y, name})`: a camp flag. Touching it saves the respawn point and refills hydration. Place 3–5 per world.
- `api.marker(id, x, z, label, {col})`: minimap landmark dot.
- `api.region(name, x, z, r)`: a named area for your own logic (`g.world.regions[name]`).

---

## 5. Prop library (`api.prop(kind, opts)`)

All props are rounded and smooth-shaded: real tyres, soft-edged bodies and glossy glass. They face +Z (front) and sit on the ground at their origin. Every prop accepts `x, y, z, yaw, scale, seed`, and `cover: true|false` overrides its colliders' cover flag.

**Low detail.** Every `api.prop(kind, opts)` (and the other `api` builders that take `opts`) accepts `lo: true` to build its low-detail version, the same one LOD twins use: fewer segments, no small parts. Use it for background rows, far-off camps and anything the camera never gets near.

**Vehicles** (`rv, camper, boxtruck, car, bus, trailer, van`) come with flush tyres in dark wheel-well arches, framed reflective glass, rounded bumpers with a chrome strip, curved roof caps, side trim and (RVs) a rolled awning; head and tail lights glow at night. Their low-detail copies (traffic beyond 38 m) skip the small parts. For your own vehicle bodies, reuse the helpers on `BurnsProps`: `wheels(m, W, [axleZ…], r, w, {y0: bodyBottom})`, `bumper(m, W, y, z, col)`, `roofCap(m, W, roofY, z0, z1, col)`, `trim(m, W, y, z0, z1, col)`, `win(m, x, y, z, w, h, side, lit, rng)`.

| kind | Size, top | Options |
|---|---|---|
| `rv` | 2.5 × ~9.5 m, roof 3.3 | `len, h, col, cabCol, solar, bikes:false` |
| `camper` | pickup with a shell, 2.75 | `col, shell` |
| `boxtruck` | 3.8, liftgate step 1.0 | `len, col, cabCol, cargo:false` |
| `car` | 1.0 / cabin 1.47 | `col, roofBikes` (bikes on the roof or a rear rack) |
| `bus` | painted skoolie with a roof deck, 3.2 | `col` |
| `trailer` | pickup + silver trailer, 12.6 m long | none |
| `van` | 2.7 | `col` |
| `vehicle` | random weighted pick of the above | `kind` to force one |
| `portapotty` | 1.2 × 2.46 | `col, occupied` |
| `booth` | gate booth with neon roof, 2.7 | `col, roof` |
| `gateArch` | two towers + banner text | `w, h, text` |
| `cone`, `barrel` (fire), `crate` (`s`), `cooler`, `chair`, `couch`, `tent` | | `col` |
| `fence` | orange trash-fence panel along local X | `len, h` |
| `pennants` | flag string (absolute local points) | `x0,y0,z0,x1,y1,z1,n,sag,drop` |
| `lightTower` | generator light tower with a big light pool | `aim` (yaw of the lamp heads) |
| `shade` | 4 poles + canvas top (walkable), string lights | `w, d, h, col, lights:false` |
| `dome` | geodesic dome, walkable: a real strut frame with inset fabric panels (some glow with `lights`) | `r, col, alt, freq, lights, glow` (`true` or a colour), `frame: false` (old solid shell), `frameCol` |
| `scaffold` | climbable tower, alternating platforms | `levels, lh, w, d` |
| `sign` | see `api.sign` | `text, h, y, post, style, glow` |
| `campFlag` | (used by checkpoints) | `col` |
| `trampoline` | spring pad | `r, power, col` |
| `artcar` | generic mutant vehicle with a deck, sculpture, poofers | `len, w, col, sculpt` |
| `saucer` | flying-saucer platform for the final Man fight, walkable | `r, h` |
| `junktower` | crooked **climbable** tower of stacked junk cars with lashed ladders and planks (the bad idea guy's landmark), ~10.5 m for 8 levels | `levels, seed`. Returns `top` and `topPos` (prop-local `[x,y,z]` of the top car). |
| `trunk` | sticker-covered old wooden trunk (crusty's camp) | none |
| `redlightRV` | the **Red Light District** RV: hot-pink, hearts and feather trim, marquee bulbs, a RED LIGHT DISTRICT sign, red lanterns, walkable roof (3.3 m). Door on its right (−X) side | `lit` (marquee and lanterns on, default true), `len`. Returns `cols, lights, top, door` (prop-local `[x,z]` just outside the door). |
| `questBoard` | a cork quest board on posts with pinned notes (§7.1). Use `api.questBoard` for a working one | `col, title` |

**`api.redLightCamp(x, z, yaw, opts)`** places the Red Light District RV and its crew in one call (W1 uses it in the line; W2 uses it for Brady's gear stash). The door, its pink light and the crew's default spots are all on the RV's **−X side** (prop-local; that's the RV's right-hand side, since its cab faces +Z). `opts`: `spots` (`[[lx, lz], …]` in that same local frame), `crew` (`true` = all five, a number, or an array of crew ids), `lit`, `behavior` (crew behaviour, default by variant), `lines`/`chat` overrides per id (`{rlCandi: ['…']}`), `talk` per id, `rv: false` (crew only). Returns `{ rv, crew: [actor defs] }`. Crew ids: `rlVelvet` (MAMA VELVET, `madame`), `rlCandi` (CANDI, `bikini`), `rlRoxie` (ROXIE, `corset`), `rlPeachy` (PEACHY, `fan`), `rlBlush` (BLUSH, `showgirl`).

**`api.questBoard({x, z, yaw, title})`** builds the board prop plus an ACTION prompt (`QUEST BOARD`) that opens the world's quest board (§7.1).

Need something new? Write it with `api.mesh` (§6). If it's reusable, add a builder function in your own file (`function burnsW6Octopus(m, o) {…; return {cols, lights}}`) and call it through `api.mesh` or `api.mover`.

---

## 6. Geometry, textures, characters

### 6.1 `BurnsMesh` (what `m` is)
- **Transform stack.** `m.push()` / `m.pop()` save and restore the transform, colour, emissive and bone. `m.tf(x, y, z, yaw, pitch, roll, sx, sy, sz)` post-multiplies the current transform.
- **Colour.** `m.color('#rrggbb', emissive?)` sets the vertex colour, and `m.emissive(0..1)` sets emissive. Emissive is unlit, glows through fog, and gets brighter at night. Reset to `0` afterwards.
- **Primitives** (local coordinates; `y` is the bottom for `cyl` and `capsule`, the centre for boxes):
  - `box(cx, cy, cz, w, h, d, {top, bottom, side, taper, skip:['py',…], uv, uvFaces:'pz'|'sides'|'all'|[…]})`
  - `bbox(cx, cy, cz, w, h, d, bevel, {top, side, uv})`: chamfered box, the soft low-poly look.
  - `cyl(x, y, z, rBottom, rTop, h, segments, {caps, smooth, top, stripes:[colours], yaw0})`: cylinder, frustum or cone.
  - `rod(x0,y0,z0, x1,y1,z1, r, seg)` and `beam(x0,y0,z0, x1,y1,z1, w, h)`: struts between two points.
  - `sphere(x, y, z, r, seg, rings, {smooth, squash, hemi, colors})`, `capsule(x, y0, z, r, h, seg)`.
  - `dome(x, y, z, r, freq, {alt, lights})`: geodesic facets.
  - `extrude(poly2D, depth, {convex:false})`: hearts, letters, logos; `convex:false` triangulates concave shapes.
  - `decal(x, y, z, w, h, region, {both})`: a textured quad facing +Z (signs, faces, labels).
  - `disc(x, y, z, r, seg)`, `poly(points, uvs, insidePoint)`, `quadUV(p0,p1,p2,p3, region)`.
- **Smooth primitives (preferred).** Shared vertices with smooth normals; this is what makes things look round instead of blocky. Local coordinates, current colour/emissive/shine:
  - `roundBox(cx, cy, cz, w, h, d, r, {top, bottom, uv})`: rounded box, **centre**-anchored, edge radius `r`.
  - `ellipsoid(cx, cy, cz, rx, ry, rz, {seg, rings, theta0, theta1, phi0, phi1, colFn(x,y,z,n)})` and `ball(cx, cy, cz, r, o)`. `phi` runs from 0 (top pole) to π (bottom), so `{phi1: Math.PI / 2}` is a dome cap; `theta` is longitude (0 = +Z).
  - `limb(x0, y0, z0, x1, y1, z1, r0, r1, {seg, mid, ends: false, sx, sz})`: tapered capsule between two points (arms, legs, pipes, branches, beams with soft ends). `mid: 0.15` bulges the middle; `ends: false` leaves the tube open.
  - `lathe(profile, {seg, sx, sz, theta0, theta1, rMod(theta, t), uv, uvRepeat, caps, flip})`: surface of revolution around local **Y** at the current transform: `m.push(); m.tf(x, y, z); m.lathe([[0, 0], [0.5, 0.1], [0.4, 1], [0, 1.1]]); m.pop();`. Profile rows are `[radius, y, colour?, emissive?]`; repeat a row for a hard crease. `sx`/`sz` squash the section into an oval (car bodies, tubs, boats); `rMod(theta, t)` returns a per-vertex radius scale (lumpy rocks, petals). `flip: true` turns the surface inside out (faces and normals point inward, toward the axis): the inside of a dome, tent, tunnel or bowl you can walk into or look into. Lay it just inside an outward shell for a two-sided wall.
  - `roundCyl(cx, y, cz, r, h, edge, {seg})`: cylinder with rounded rims, `y` = bottom (barrels, drums, wheels when rotated).
  - `torus(cx, cy, cz, R, r, {seg, tseg, sy})`: ring in the XZ plane. Rotate it with `m.tf(0, 0, 0, 0, Math.PI / 2)` for a tyre.
  - `m.shine(0..3)`: specular gloss for what you build next (0 matte, 1 satin/skin, 2 plastic/paint/hair, 3 glass/chrome/sunglasses). It's saved by `push`/`pop`; reset with `m.shine(0)`.
  - `m.lo = true`: smooth primitives built while it's set use about half the segments. Use it for distant scenery and big repeated sets; set it back to `false` after.
  - The old faceted helpers (`box`, `bbox`, `cyl`, `sphere`, `capsule`, `dome`) still work and are right for hard-edged things such as sign boards, planks, the geodesic dome, rebar and distant clutter. Pass `{smooth: true}` to `cyl`/`sphere` for smooth normals.
- **Budget.** One static chunk holds up to 50k vertices; the world splits chunks for you. Vertex costs: plain box 24, beveled box 96, `roundBox` 72 (32 with `m.lo`), `ball`/`ellipsoid` 154 (56), `limb` 80 (36), `torus` 128 (50), `roundCyl` 140 (48), `lathe` = segments × profile rows. Hundreds of rounded props per cell are fine; thousands of them in one view are not, so use `m.lo` or plain boxes for distant or plentiful things.

### 6.2 Textures (one shared atlas)
- `BURNS_ATLAS.pattern(name)`: tileable decals. Names: `tattoo, tattoo2, fur, disco, led, plaid, hivis, tiedye, wood, swoosh, canvas, sequin, leopard, flames, denim, rainbow`. Use them as `{uv: BURNS_ATLAS.pattern('fur'), uvFaces: 'sides'}`.
- `BURNS_ATLAS.icon(name)`: item icons. Names: `heart, k, flake, tab, shroom, leaf, toad, bottle, drop, ticket, map, www, token, glowstick, ziptie, camera`.
- `BURNS_ATLAS.sign(text, style)`: renders text into the per-world sign area. It's reset every world and holds about 40 signs.
- How decals work: the atlas is premultiplied RGBA laid **over** the vertex colour. Transparent texels show the colour and opaque texels show the art. A face decal on a skin-coloured head shows skin around the eyes; a sign with a `bg` is fully opaque.
- **Engine-made art.** The Chinka photo (the polaroid on `'photo'` pickups and its UI icon) is rendered from the 3D Chinka model by the engine on the first frame (`BURNS_ATLAS.bakePhoto`), over a painted playa-sunset backdrop. To make art of your own from a posed model, call `R.bakeImage(w, h, cam, env, draw, bgRegion)` before a frame's `setCamera`. It lights and tone-maps the model like the frame, lays it over an atlas region on the GPU, and returns a 2D canvas (it never calls `readPixels`, so nothing stalls). Paint the canvas into the atlas, then refresh just that tile with `BurnsGL.texRegion(BURNS_ATLAS.T, x, y, w, h)`.
- **Painting into `BURNS_ATLAS.ctx` yourself:** pair every `save()` with a `restore()`, using `try/finally`. An unbalanced transform shifts every tile, sign and face painted after it. `addPattern`/`addFace` painters and signs are already guarded by the engine.

### 6.3 Actors (NPCs and enemies)
`api.npc(def)` / `api.enemy(def)`:

| Field | Meaning |
|---|---|
| `type` | An NPC type name (see the list below). It sets the whole look: body, face, hair, outfit, gear and a default idle animation. **Unknown names fall back to a generic burner** with a console warning, so you can reference a planned type before it exists. |
| `variant`, `prop`, `tool` | Optional look options passed to the type: `variant` (e.g. `'kilt'` for `crusty`, `'f'`/`'m'` for `greeter`), `prop` (override the held prop, `null` for none), `tool` (`firespinner`: `'poi'`, `'fans'`, `'staff'` or `'hoop'`). |
| `seed` | Varies skin, hair and colours within a type. Use different seeds for variety. |
| `id`, `name` | `id` for lookups (`g.actor(id)`) and mission givers; `name` shows in the dialogue box. |
| `x, z, y, yaw` | Placement. `y` defaults to the ground. Add `fixedY: true` for NPCs on roofs or vehicles. |
| `behavior` | §6.4. Default `idle`. |
| `lines` | Dialogue when talked to (ACTION nearby). |
| `talk(g, a)` | Custom talk handler that replaces `lines`. Starts missions, gives items. |
| `gift` | `{kind:'glowstick', n}`, `{kind:'water'}`, `{kind:'<power>'}`, `{kind:'item', item:'map'}` or `{goods: …}` (any goods, §8.3). Given once, after `lines`. Gifting culture! A power-up gift goes into the **backpack**; before the ground-score flag (§8.3) it turns into 5 glow sticks instead. |
| `trades` | `[{id, give, get, label, note, once, when(g,a), onTrade(g,a,t)}]`: barter offers (§8.3). After the NPC's `lines`, the **trade window** opens. With a custom `talk`, open it yourself with `g.openTrade(a)`. |
| `chat` | Ambient bubble lines said when Brady walks by. They default to per-type lines. `chatter:false` silences them. |
| `hp`, `damage`, `drop` | Enemies: hit points, contact damage, glow sticks dropped. |
| `tag` | Matches `defeat` missions with `tag`. |
| `onDefeat(g,a)`, `onHurt(g,a)`, `onWake(g,a)`, `onSpot(g,a)` | Hooks. |
| `afterDefeat` | Behaviour after defeat: `chill` (default), `dance`, `sleep`… Enemies are never killed. They chill out, sit down, or dance. |
| `marker(g,a)` | Return `'!'`, `'?'` or `null` to override the floating mission marker. |
| `spec`, `scale` | Fully custom look (§6.5) and size. |
| `noTalk`, `hittable`, `always`, `collide:false` | Misc: never talkable; friendly but can be spun; update even when far; no collision. |

The engine draws `'!'` over the `giver` of any available mission and `'?'` over active targets.

**NPC types.** All characters are rounded 3D figures. Types marked ★ are the user's burner "action figures". Match them, don't restyle them. Behaviours are listed in §6.4.

| Type | Look | Notes |
|---|---|---|
| `crusty` ★ | Grizzled grey curls and beard, brass goggles up, paisley bandana, worn suede jacket with shearling, crossbody straps, utility belt, kandi, olive cargos with knee pads, work boots. | Holds a camera or warm beer (`prop`). `variant: 'kilt'` = faded utility kilt. |
| `firespinner` ★ | Knit hood and mask with an orange visor slit, chain-mesh crop harness, sun medallion, flame wings, silver bracers, flame cloth panels, knee medallions, wrapped boots. | `tool: 'poi' \| 'fans' \| 'staff' \| 'hoop'`. Use behaviour `firespin`. |
| `gatestaff` ★ (alias `gate`) | Brown bob with highlights, wraparound shades, black GATE tee (our own sun emblem), black denim shorts, duty belt with radio holster, chain, thigh straps, fingerless gloves, bracelets, combat boots. | Holds a tall-antenna walkie (`prop: 'walkie'`; also `flashlight`, `spray`). |
| `greeter_f` ★, `greeter_m` ★ (`greeter` = either, by seed or `variant: 'f'/'m'`) | F: pink floppy sun hat, round purple shades, sequin halter, rainbow tiered tutu, graffiti high-tops. M: straw fedora, orange aviators, beard, paisley shirt, pink-to-lime cargo shorts, striped socks. | Both hold a GREETER sign (`prop: 'bell'` for the bell). Idle: `wave`. |
| `darkwad` ★ | All black: spiky hair, sunglasses at night, long-sleeve, backpack, baggy cargos, grey sneakers. | Use behaviour `darkwad` (invisible in the dark, knocks Brady down). `lit: true` in a custom spec adds EL wire. |
| `badideaguy` ★ | Goggles up, stubble, white tank, arm cast, crossbody bag, spiked wristband, cargo shorts, knee brace, suede work boots. | Idle `dare` (cast arm pointing up). Pair him with `api.prop('junktower')`. |
| `undercovercop` ★ | Jester hat with bells, aviators, psychedelic shirt under a tactical vest, gold chain, badge, duty belt, watch, khaki cargo shorts, tube socks, dad sneakers. | Use behaviour `undercover` (chases power-up carriers). |
| `furry` ★ | Full fox-hyena fursuit: grey spotted fur, white muzzle and chest, pink inner ears, pink/teal tuft, big green eyes, rainbow-striped limbs, big paws, harness with badges and kandi, LED wristband, teal tube, bushy tail. | Friendly; hugs (`anim: 'hug'`). |
| `deathguild` ★ | Black hood and metal skull mask, black biker duster with tattered tails and spiked shoulders, bandoliers, utility belt and chains, dented metal knee pads, combat boots. | Holds a skull staff, foam bat or canteen (`prop: 'skullstaff' \| 'foambat' \| 'canteen'`). The W11 Thunderdome crew. |
| `ranger` ★ | Overzealous ranger: cream ranger hat, trimmed beard, intense face, sage bandana, field shirt with chest pockets, suspenders with carabiners, orange radio pouches, watch, khaki cargo shorts, hiking boots. | Holds a clipboard. `variant: 'chill'` gives shades, a friendly face and no clipboard. |
| `burney` ★ | Straw cowboy hat with pink-lined bunny ears, buzz cut, huge blue mustache and brows, open teal floral shirt, utility vest, chains, blue tribal tattoos, cargo shorts, boots. | Holds a camera; idle `photo`. |
| `playaartist` ★ | Straw sun hat, wavy brown hair, off-shoulder knit top, suspenders, paint-splattered apron with brushes, splattered rolled work pants, boots. | Holds a brush or palette. |
| `dpw` ★ | DPW punk: tall black spiked mohawk, piercings, scalp tattoos, studded patched vest (our own DPW patch), spiked shoulders and wristband, fingerless gloves, tattooed arms, ripped patched jeans, work boots. | Holds a yellow-handled hammer or rebar. |
| `lamplighter` ★ | Flowing cream robes, white head wrap, canvas belt, sandals, two tall lantern poles over the shoulders. | Idle `lantern`. Use behaviour `lamplight` to light streets as they walk. Dignified, not a joke target. |
| `annoyingdj` ★ | Slicked hair, huge white-framed orange goggles, headphones, open tie-dye shirt over a white tee, beads, medallion, lime shorts, teal sneakers. | Holds a mic or energy drink. Idle `dj`. |
| `sparklepony` ★ | New look: long black hair, tall silver spiked crown, purple-rainbow visor, holographic sequin long-sleeve crop, sequin shorts, big iridescent fairy wings, silver thigh-high warmers, silver sneakers, fanny pack, LED pendants. | Holds an LED wand or glitter bottle. |
| `partiedtoohard` ★ | Messy greying hair, stubble, bloodshot eyes, torn pastel floral shirt open, tangled beads, kandi, lanyard, torn cargo shorts, one boot missing, dirty backpack. | Holds a map, water or a can. Idle `dazed`. |
| `burnerkid` ★, `burnermom` ★ | Kid: teal beanie with a golden sun crown, white shades, shirtless with rainbow body paint, beads, backpack, tan cargos, rainbow leg warmers, wizard staff, embarrassed. Mom: grey bob, straw sun hat, white shades, pink sweater, green vest, beads, capri jeans, two cameras. | Mom's idle is `cheer`. |
| `cultleader` ★ | "Brother Bubblegum" (original): swooped hot-pink hair, pink beard, heart shades, shirtless, hot-pink fur boa and cuffs, heart pendants, pink belt. | Idle `welcome` (arms spread). Tasteful. |
| `fencebot_a` ★, `fencebot_b` ★ | "The Fence Bots": homemade junk helmets (A: a dented trash can with LED strips and bottle-cap eyes; B: a colander with cardboard and an EL-wire visor). Patched brown playa jackets, harness with tubes and pouches, olive cargos, knee pads, desert boots, robot gloves, clipped water bottles. | Idle `robot`. Never chrome or gold visor helmets. |
| `redlight` | The **Red Light District** camp's burlesque/cabaret crew: glamorous blonde performers, PG-13 glam. `variant`: `'bikini'` (pink bikini top, high-waisted pink shorts, pink feather boa, heart shades, platform boots), `'corset'` (red corset-style top, ruffled skirt, white boa, curls), `'fan'` (pink sequin top, tiered pink tutu, feather fans), `'showgirl'` (red corset, pink boa, mini top hat, cane), `'madame'` (camp mom: tall blonde updo, cat-eye glasses, long red skirt, pink boa). Numbers 0–4 work too. | Brady and Chinka rode to the Burn in their pink RV (W1); they babysit his stuff in W2. The named crew is `BURNS_REDLIGHT.crew`; place RV + crew with `api.redLightCamp` (§5). Idle `cheer`/`dance`/`wave` by variant. |
| `billionaire`, `safetycaptain`, `healer` | Archetypes. Billionaire: white linens, aviators, goggles, silk dust mask, cocktail. Safety captain: hard hat, respirator, hi-vis, reflective tape, chest radio, clipboard. Healer: white robes, giant crystal, barefoot. | `techbro` keeps his pitch-deck look. |
| `burner, furcoat, tutu, ledsuit, campLead, driver, influencer` | Seed-varied party crowd and staff. | `crowd()` uses these. |
| `chinka`, `brady` | The leads (Brady follows `Save.data.look` and the costume). | |

### 6.4 Behaviours
Pass behaviour parameters in the actor def.

| Behaviour | Parameters | What it does |
|---|---|---|
| `idle` | `anim, lookAt:false` | Stands and faces Brady when he's near. Props animate (clipboards, phones, ring lights). |
| `wander` | `radius, speed` | Strolls around its home. |
| `dance` | `style 0–5, bpm` | Grooves (hands up, robot, shuffle…). |
| `walk` | `path:[[x,z]…], pingpong, speed, walkAnim` | Patrols a route. |
| `sit`, `sleep` | `onWake(g,a)` | Sits; sleeping NPCs snore Zs, and talking or hitting calls `onWake`. |
| `follow` | `followDist` | Companion that follows Brady, teleports back if lost, and hops up ledges. Use it for escort missions and W5's burner buddy. |
| `chase` | `aggro, chaseSpeed, taunts` | Runs at Brady and hurts on contact. |
| `patrol` | `path, view, fov, spotLine, chase:false` | Vision cone; fires `spotted` (stealth missions fail on it). |
| `zombie` | `aggro, chaseSpeed` | Slow 6-day-driver shuffle. |
| `charger` | `dashSpeed, dashTime, dizzy` | Wind up, dash, then dizzy. |
| `shouter` | `waveSpeed, waveMax, cooldown, taunts` | Camp lead yells a ground shockwave; jump it. |
| `flasher` | `range, cooldown` | Influencer camera flash in a cone. |
| `pitcher` | `pitches:[…], cooldown` | Tech bro pitch bubbles that home slowly; spin pops them. |
| `thief` | `steal` | Steals glow sticks and runs; hit it to get them back. |
| `greeterHug`, `greeterSlam`, `greeterBell` | (W1 sub-bosses) | Only vulnerable when dizzy or lying down. |
| `chill` | | Post-defeat: sits or dances. |
| `firespin` | `tool` (`poi, fans, staff, hoop`; default from the type), `hazard` (default true: the flames hurt on touch), `path` and `speed` (walking spinner), `turn` (slow spin in place), `rate`, `spinning:false` | Use with type `firespinner`. Flaming trails, glow and a flickering light that lights the people around. Fires the mission event `burned`. |
| `darkwad` | `radius` (wander), `cost` (glow sticks to light him up, default 3), `lightable:false`, `lit` (start lit), `elCol`, `onBump(g,a)`, `onLit(g,a)` | Use with type `darkwad`. At night he's invisible except for a glint off his shades. Light reveals him: daylight, LSD, light pools (`api.light`), fires, headlights, `player.lightR` (set it for a lantern or flashlight gift) or glow sticks within 3.6 m. Bumping into him knocks Brady down and off the bike (event `darkwadBump`). ACTION with enough glow sticks lights him up with EL wire (event `lit`), for a "light up the darkwads" mission. |
| `lamplight` | `path`, `speed` (1.0), `hang` (metres between hung lanterns, default 6; `false` = none), `loop`, `col` | Use with type `lamplighter`. Walks the route carrying a warm moving light and hangs a glowing lantern every `hang` metres, so the dark street lights up behind them. Events `lanternHung` and `lampsDone`. Follow the lamp line in a whiteout. |
| `undercover` | `path`, `view` (11), `fov` (1.1), `chaseSpeed` (4.2), `chaseTime` (9), `onConfiscate(g,a,id)` | Use with type `undercovercop`. He dances badly and says "groovy". If he sees Brady with an **active** power-up he chases; a catch confiscates it (event `confiscated`). Hiding in a crowd (2+ dancing NPCs within 2.2 m) loses him. Event `copSpotted`. |

**Write your own** in your world file:
```js
BurnsBehaviors.register('w6Pitchbot', {
  init(a, g) { a.data.t = 0; },
  update(a, g, dt) {
    a.data.t += dt;
    const d = a.moveTo(g.player.x, g.player.z, 2.5, dt, 1.0);   // steer, returns distance
    a.ch.play(d > 1 ? 'walk' : 'talk');                          // any animation name (§6.6)
    BurnsBehaviors.contact(a, g, 1);                             // hurt Brady on touch (handles stomp/giant/molly)
    a.physics(dt);                                               // gravity, ground, walls
  },
  hit(a, g, kind) { return true; },  // return false = blocked, 'handled' = you dealt with it
  talk(a, g) { return false; }       // return true if you handled ACTION-talk
});
```
Helpers on `a`:
- Movement: `moveTo(x, z, speed, dt, stopAt)`, `face(x, z, dt, rate)`, `physics(dt)`, `distP()`.
- Combat and speech: `touching(extra)`, `say(text, secs)`, `hit(kind)`, `defeat()`, `befriend()`.
- State: `setBehavior(name)`, `home`, `data` (scratch).
- Vision: `BurnsBehaviors.sees(a, g, range, halfFov)` checks line of sight.

### 6.5 Characters: specs, custom looks and new types

Every character is built from a **spec**, a plain object. `BurnsRig.npcSpec(type, seed, opts)` returns a type's spec for you to tweak, or you can write one from scratch. The model is cached by `spec.key`, so give hand-made specs a unique `key`.
```js
const spec = BurnsRig.npcSpec('burner', 3);
Object.assign(spec, {
  top: { kind: 'none' }, paint: 'tiedye',                   // shirtless + body paint
  bottom: { kind: 'kilt', col: '#2a2a34' },
  hat: { kind: 'tophat', col: '#1a1a1a' }, goggles: true, glasses: 'heart',
  acc: ['ledNecklace', 'cape'], prop: 'bell', key: 'w4:ringmaster'
});
api.npc({ spec, x: 0, z: 0, name: 'RINGMASTER', lines: ['Step right up!'] });
```
When you restyle a figure type with `Object.assign`, remember that figures carry extra fields. Clear what you don't want, for example `beard: null, goggles: false, acc: []`.

**Spec reference** (every field is optional):

| Field | Values |
|---|---|
| `body` | `{h, w, fem}`: height and width multipliers (0.85–1.2), and `fem: true` for a slimmer waist and a bust. |
| `skin`, `skinSh` | Skin colour and its shadow colour. |
| `face` | `friendly, goofy, lashes, tired, stressed, greeter, beard, smug, chinka, stern, grumpy, sleepy, kid, crusty, gateStaff, greeterF, greeterM, scheming, cop, furry, dazed, embarrassed, beatific, intense, partydad, toothy, mom, serene` (32 face slots in all), or your own (below). The face art wraps onto the round head and changes with expression (talk, hurt, happy). |
| `hair` | `{style, col, hi}`. Styles: `short, buzz, bald, long, down, wig, wavy, pony, bun, bob, curly, afro, mohawk, spiky`. |
| `beard` | `{col, len (0.02–0.12), trim, noMustache}`: a sculpted 3D beard and mustache. |
| `hat` | `{kind, col}`. Kinds: `cowboy, ranger, hardhat, cap, tophat, furhat, bandana, tricorn, sunhat, fedora, jester`. |
| `glasses` | `shades, wrap, aviator, round, clear, heart, visor`, plus `lensCol` for tinted lenses. |
| `goggles` | `true`, `'classic'`, `'brass'` or `'tutu'`. They're worn pushed up on the forehead. |
| `hood` | `true` hides the hair, for full hoods and helmets that you add as accessories. |
| `top` | `{kind, col, pattern, emblem}`. Kinds: `tee, long, tank, crop, halter, offshoulder, vest, hoodie, button, none`. `long: true` gives long sleeves (for example a long-sleeve crop). `button` also takes `long, open, under` (the colour of the tee under an open shirt). `emblem` is a pattern name printed on the chest. |
| `vest` | `'hivis'`, `'fleece'`, `'patches'` or `'tactical'`, with `vestCol`. |
| `coat` | `{kind, col, trim, pattern}`. Kinds: `jacket` (hip length with a shearling collar and cuffs), `fur, kimono, duster, pirate, robe` (ankle length, bell sleeves). `tattered: true` gives a ragged hem. |
| `bottom` | `{kind, col, pattern}`. Kinds: `jeans, cargo, chinos, pants, leggings, shorts, kilt, tutu`. Extras: `cargo` (side pockets), `baggy`, `patches`, `capri` (cropped at mid-shin), `rolled` (cuffs), `belt: '#col'`, `fade: '#col'` (two-tone shorts), `tiers: [cols]` (tutu layers), `utility` (kilt pockets). |
| `socks` | `{col, stripe}`, shown with shorts and skirts. |
| `shoes` | `{kind, col, sole, laces, wraps, print, laceCol}`. Kinds: `sneakers, hightops, dad, boots, workboots, combat, furboots, sandals, barefoot`. `missing: 'left'|'right'` leaves one foot in a sock. |
| `gloves` | A colour, for fingerless gloves. |
| `led` | An LED-suit strip colour. `paint`: a body-paint pattern on bare skin. |
| `acc` | A list of accessory names (below). |
| `prop`, `prop2` | Held items for the right hand and, with `prop2`, the left hand. |
| `tool` | `firespinner` only. |
| `fursuit` | A full-body costume, advanced: see `furry` in `40_burns_da_round.js`. |

- **Accessories (`acc`):**
  - Neck and chest: `ledNecklace, lei, beads, bandana, goldChain, badge, sunMedallion`.
  - Straps, belts and bags: `straps, utilityBelt, dutyBelt, toolbelt, chain, messenger, crossbag, backpack, harness`.
  - Arms and legs: `kandi, bracelets, bracers, spikedBand, cast, watch, kneepads, kneeBrace, kneeMedallions, thighStraps`.
  - Head: `headset, earbuds, fireHood`.
  - Back pieces: `wings, flameWings, cape`.
  - Other: `flameTassets, sash, elwire`.
- **Held props (`prop`):**
  - Tools and gadgets: `clipboard, phone, radio, walkie, flashlight, spray, camera, ringlight`.
  - Drinks and odds and ends: `coffee, bottle, water, tin, guide, bell, greeterSign`.
  - Fire tools: `poi, fan, staff, hoop`.

**Define a new NPC type** (any world file, at load time):
```js
BurnsRig.defineType('w9Hermit', {
  anim: 'idle',                                // default idle flavour (any §6.6 animation)
  lines: ['The fence talks to me.', 'Bring me a sandwich.'],   // ambient chatter
  spec(s, rng, opts) {                         // s = seeded defaults (skin, hair, body); fill in the look
    s.face = 'grumpy'; s.hair = { style: 'long', col: '#c8c8c8' }; s.beard = { col: '#c8c8c8', len: 0.1 };
    s.top = { kind: 'tee', col: rng.pick(['#5a4a3a', '#4a5a3a']) }; s.coat = { kind: 'robe', col: '#8a7a5a' };
    s.bottom = { kind: 'pants', col: '#4a3a2a' }; s.shoes = { kind: 'sandals', col: '#6a4a2a' };
    s.acc = ['beads', 'w9Lantern']; s.prop = opts.prop || 'staff';
  }
});
api.npc({ type: 'w9Hermit', seed: 4, x: 0, z: 0 });
```
Add your own pieces the same way. Build with `BurnsMesh` (§6.1). Each piece is drawn in a bone's local space, and `A` gives you helpers: `A.headPt(theta, phi, offset)` for a point on the head, `A.torsoPt(theta, y, offset)` for a point on the chest, `A.torsoR(y)`, `A.h`, `A.w`, `A.lo` (true while building the low-detail model, so skip small details), `A.S` (the spec) and `A.skin`.
```js
BurnsRig.defineAcc('w9Lantern', (m, A) => { m.setBone(BURNS_BONES.HIPS); m.color('#ffd84a', 1); m.ball(0.2, -0.1, 0.1, 0.05); m.emissive(0); });
BurnsRig.defineProp('w9Spoon', (m, A) => { m.color('#c8c8d0').shine(3); m.limb(0, -0.1, 0.05, 0, 0.3, 0.05, 0.012, 0.012); });
BurnsRig.defineHat('w9Pot', (m, A, hat) => { m.color(hat.col || '#8a8a92').shine(2); m.roundCyl(0, 0.3, 0, 0.2, 0.14, 0.03); });
BURNS_ATLAS.addFace('w9Hermit', { eyes: 'squint', brows: { col: '#ddd', thick: 4 }, mouth: 'flat', wrinkles: true, beard: '#ccc' });
BURNS_ATLAS.addPattern('w9Rags', (ctx, rng) => { /* paint a tileable 128x128 decal; transparent shows the base colour */ });
```
- Bones: `HIPS, CHEST, HEAD, UARM_L/R, FARM_L/R, THIGH_L/R, SHIN_L/R, FOOT_L/R, PROP` (right hand), `HAIR` (springy: hair, bun, ears) and `TAIL`.
- Limbs hang along −Y from their joint and the character faces +Z.
- **Face recipe fields:** `eyes` (`normal, blue, green, squint, tired, closed, none`), `eyeSc`, `lashes`, `brows {col, tilt, w, y, thick}` or `false`, `mouth` (`smile, grin, flat, frown, smirk, o, open`), `mouthW`, `stubble` (0–0.5), `beard` and `mustache` colours, `wrinkles`, `blush`, `lips`, `mask` (a colour). You can also pass a painter, `fn(ctx, row, helpers)`, that draws in a 64×64 box. `row` is the expression: 0 normal, 1 talking, 2 hurt, 3 happy.

Brady is `BurnsRig.bradySpec(costume)`: it follows `Save.data.look` (bun or down, shades/clear/none, tattoos, stubble, hair and skin colours) plus the costume. Chinka is `BurnsRig.chinkaSpec()`.

### 6.6 Animation names
`idle, walk, run, jump, flip, fall, land, spin, pound, hurt, dance{style,bpm}, bike, drive{steer}, sit, sleep, victory, cheer, talk, wave, shuffle, yell, hug, charge, bell, phone, photo, clipboard, throw, climb, float, fly, captive, knocked`, plus the cast's idle flavours `firespin{tool,rate}, dare, think, radio, lantern, dj{bpm}, dazed, welcome, robot`. Hair and buns are springy: they bounce on landings and swing when characters turn.
- Play one with `a.ch.play('name', params)`.
- `BURNS_ANIMS[name] = (P, t, k) => {...}` adds a new one. `P.r` holds per-bone `[rx, ry, rz]` and `P.y, pitch, roll, yaw, sq, face` are root offsets. Bones are listed in `BURNS_BONES`.
- Limb conventions: forward swing is negative `rx`, a knee bend is positive `rx` on the shin, and raising the left arm sideways (+X) is positive `rz`.

### 6.7 Costumes
- `BURNS_COSTUMES` has seven ids: `none, furcoat, tutu, spaceman, unicorn, pirate, disco`.
- **World 3** offers the chooser:
  1. Call `g.giveItem('costumes')`, which unlocks the hub's WARDROBE button.
  2. Run your own in-world choice through dialogue or interactables. A quick menu via `g.say` lines works.
  3. Call `BurnsSave.setCostume(id)`, then `g.player.rebuildModel()`.
- Costume geometry lives in `BurnsRig.buildHuman`. To add a costume, add its id to `BURNS_COSTUMES` and its parts in `buildHuman`. This is an engine edit, so keep it small.

---

## 7. Missions

Define missions in `def.missions`. Each mission is `{id, name, short, desc, hint, type, …}`:

| Field | Meaning |
|---|---|
| `type` | `reach, find, collect, talk, defeat, race, stealth, escort, ride, climb, boss, custom` (table below). |
| `start` | `'manual'` (default; you call `g.missions.start(id)`, usually from a `talk` handler), `'auto'` (starts when available), `'trigger'` (you start it from `api.trigger`), or `'board'` (accepted from the quest board, §7.1). |
| `giver` | Actor id. It shows `'!'` while the mission is available. |
| `requires` | `[missionIds]`. The mission stays `locked` until these are done. |
| `token` | Default `true`, which makes it a Burn Token. `false` makes it a side mission (saved in `Save.data.burns.missions`). |
| `tokenAt` | `{x,y,z}` where the token pickup spawns. The default is in front of Brady. `tokenDirect: true` awards it instantly (bosses). |
| `target` | `{x, z, r, y}` for reach, race, stealth, ride and climb (`y` = minimum height for climb). For `talk`, an actor id. |
| `count` | For collect, defeat and custom progress. The HUD shows `n/count`. |
| `time` | Seconds limit; the mission fails when it runs out. Used for races. |
| `tag` | For `defeat`: only actors with that `tag` count. |
| `vehicle` | For `ride`: `'bike'` or `'car'`. |
| `companion` | For `escort`: the actor id that must reach `target`. |
| `marker` | `{x, z}` for the minimap and What Where When. |
| `secret` | Hidden as `???` until started. |
| `silent` | No start banner. |
| `failOnFaint` | Fails if Brady faints. Timed missions always do. |
| `side` | `true` makes it a **side quest**: listed on the quest board (§7.1) instead of the main mission list, `token` defaults to `false`. |
| `reward` | Goods (§8.3) given when the mission completes, with a REWARD banner: `{glow: 20}`, `'molly'`, `{pack: {icebag: 1}}`, `{costume: 'pirate'}`, `{item: 'artcar'}`, `{heal: 2}`, `{text: 'A spin-art shirt'}`, arrays to combine. Works on any mission, side or main. |
| `use` | A backpack item Brady must **use** (§8.3) while the mission is active before it can complete, e.g. `use: 'powder'` for a timed run. `requires: {use: 'powder', missions: [ids]}` is the same thing. Reaching the goal without it shows a warning instead of completing. `useHint` overrides the warning text. |
| Hooks | `onStart(g,m)`, `onUpdate(g,m,dt)`, `onEvent(g,m,name,data)` (return `true` to swallow the event), `onComplete(g,m)`, `onFail(g,m)`. |

What each type does automatically:

| type | Completes when… |
|---|---|
| `reach` | Brady enters `target`. |
| `race` | Same as `reach`, with `time` set. |
| `stealth` | `reach`, but any `spotted` event fails it. Use `patrol` enemies. |
| `ride` | Brady reaches `target` **on a vehicle** (`vehicle` filter). |
| `climb` | Brady is in `target` and above `target.y`. |
| `find` | A pickup with `{mission: id}` is collected. |
| `collect` | `count` pickups with `{mission: id}` are collected. Use `gate: true` so they appear only while the mission is active. |
| `talk` | Brady talks to actor `target`. |
| `defeat` | `count` actors are defeated (optionally filtered by `tag`). |
| `escort` | `companion` reaches `target`. Use the `follow` behaviour. Fail it yourself with `g.missions.fail(id, 'why')` if they get lost. |
| `boss`, `custom` | You call `g.missions.complete(id)` yourself. |

Runtime calls:
- State: `g.missions.start(id, quiet)`, `complete(id, tokenPos)`, `fail(id, why)`, `progress(id, add, total)`, `state(id)`, `isDone(id)`, `get(id)` (gives `.n`, `.data`, `.left` and `.used`), `track(id)` (shows it in the HUD tracker; starting a mission tracks it).
- `g.missions.event(name, data)` fires events. Engine events: `pickup, defeat, talk, spotted, pound, spring, mount, bell, flames, power` (data = power id, when one starts), `pack` (data = item id, added to the backpack), `use` (data = item id, used from the backpack), `trade` (data = `{actor, trade, id}`). Fire your own too, for example `g.missions.event('delivered', item)`.

**Fetch chains / deliver** are `custom` missions plus `talk` handlers:
```js
{ id: 'ice', name: 'Ice Ice Baby', type: 'custom', giver: 'pony', start: 'manual', desc: 'Get ice from the crusty with the cooler.' }
// pony.talk: if available -> start; if g.flag('hasIce') -> complete
// crusty.talk: if mission active -> g.flag('hasIce', true); g.toast('GOT ICE')
```
**Story beats.** `g.flag(key, value?)` stores per-world flags in the save.

**The What Where When guide** (`items.www`, given in W1) makes the mission list show everything, including locked and available missions with their `hint` locations, and puts every mission `marker` on the minimap. Write a useful `hint` for every mission.

### 7.1 Side quests and the quest board (home world)

Any world can have side quests; the home world (17) is built around them. A side quest is an ordinary mission with `side: true`:
```js
{ id: 'ice', side: true, name: 'Ice, Ice, Furry', type: 'custom', start: 'board', hint: 'The furry is wilting at 7:30 & B',
  desc: 'Get a bag of ice from the ice line to the overheating furry.', reward: [{ glow: 15 }, 'molly'],
  onStart(g) { g.pack.add('icebag'); } }
{ id: 'buttid', side: true, token: true, name: 'Butt ID', type: 'custom', giver: 'ziggy', start: 'manual', … }  // a Burn Token side quest
```
- **Tokens or not.** Side quests default to `token: false`: they're saved as done (`Save.data.burns.missions`) and pay out their `reward`. `token: true` makes one a Burn Token as well (it counts toward the world's token total). Use tokens for the best 5–7 quests.
- **Starting.** `start: 'board'` quests have an ACCEPT button on the board; accepting starts the quest and returns to play. Quests with a `giver` show "Talk to NAME" on the board instead (and `'!'` over the giver as usual). `start: 'auto'` and `'trigger'` work as for any mission.
- **The quest board** lists the world's side quests in three tabs: AVAILABLE, ACTIVE and DONE, with each quest's description, `hint` (where to go) and reward. Locked quests (unmet `requires`) show as "???". ACTIVE quests have a TRACK button that puts them in the HUD tracker.
  - Open it from the pause menu (**SIDE QUESTS**, shown when the world has any), from an in-world board (`api.questBoard({x, z, yaw, title})`), with the **L** key, or from code with `g.openBoard()`.
  - Title: `def.boardTitle` (default `'QUEST BOARD'`).
- **Rewards** are any goods (§8.3), granted with a REWARD banner when the quest completes. `reward.text` names a one-off prize.
- Main missions stay in the MISSIONS list; side quests don't clutter it.
- Active side quests are not saved: leaving the world resets them to available.

---

## 8. Items, power-ups, vehicles

### 8.1 Items and power-ups
- **Hydration** is health: 6 drops. Water bottles add 2, camp flags refill fully, and 50 glow sticks add 1. At 0 Brady faints and respawns at the last camp flag, losing 5 glow sticks. There are no lives.
- **Power-ups** are timed. Definitions live in `BURNS_POWERUPS`:
  - `molly`: enemies he touches become friendly dancers; +1 drop.
  - `khole`: the world runs at 35% speed; wobble cam.
  - `powder`: speed ×1.55, higher jumps, fast-talk bubbles.
  - `lsd`: shows `api.hidden` geometry and `hidden` pickups; colour trip.
  - `shrooms`: giant Brady who stomps enemies on contact.
  - `weed`: float while holding jump.
  - `bufo`: fly while holding jump.
  - `liquor`: ACTION throws bouncing puke balls.
- They're **ground scores**: Brady finds baggies, keeps them in his backpack and uses them when he chooses (§8.3). `g.pack.add('powder')` gives one; `g.pack.use('powder')` uses one. `g.player.givePower('bufo')` still starts one instantly, for story beats only (it skips the backpack, so don't use it before the ground-score flag).
- **Key items** (saved globally):
  - Give or check with `g.giveItem(id)` and `g.hasItem(id)`.
  - Ids: `ticket` (W1), `map` (minimap, W1), `www` (W1), `bike` (W3), `costumes` (W3), `artcar` (W6, your choice).

### 8.2 Vehicles
- **Yellow bike** (World 3 unlocks it with `g.giveItem('bike')`). The BIKE button or the B key summons it and EXIT dismounts.
  - On the bike: fast (12.5 m/s), small hops on JUMP, bell on ACTION. Friendly NPCs step aside, and the `bell` event fires.
  - Riding into enemies knocks them over.
  - `ride` missions with `vehicle: 'bike'` work out of the box.
- **Art cars**: `const car = api.artCar({...})`.
  - Brady drives when he presses ACTION near it (prompt `DRIVE`). JUMP honks, ACTION fires the poofers (hurting enemies near them), and EXIT leaves.
  - Pass `build: m => {...; return { cols, seat: [x,y,z], poofers: [[x,y,z]…], w, len, top }}` for a custom model, like W6's octopus. The generic `BurnsProps.artcar` is the default.
  - Undriven cars follow `path: [[x,z]…]` at `pathSpeed`, or park. Brady can ride on the deck either way (it's a moving platform).
  - `drivable: false` or `when: g => cond` controls when it can be driven.
  - **Any drivable vehicle** (an RV for Exodus, a golf cart, a mutant vehicle) uses the same call. The options are:
    - `build` (body model, returns `seat`, `w`, `len`, `top`; leave out `poofers` for no flames);
    - handling: `maxSpeed` (8.5 m/s), `accel` (3.5), `turn` (0.9), `brake` (3, coasting deceleration);
    - sound and text: `horn` (sfx name), `hornLines` (what nearby NPCs shout), `driveHint` (the toast shown on mount), `onHorn(g, car)`.
  - Read `car.speed`, `car.x/z/yaw` and `car.rider` at runtime. Brady stands on the deck when he isn't driving.
  - `ride` missions with `vehicle: 'car'` work out of the box.

### 8.3 Ground scores, the backpack and trading

**The ground-score flag.** Brady is a clueless first-timer; ground scores only start in world 16, after Bam Bam's pill.
- `BurnsSave.setGroundScore(true)` turns them on for good (W16 does this). `BurnsSave.groundScore()` reads it. It's stored as `flags['0:groundscore']`, so `BurnsSave.flag(0, 'groundscore', true)` does the same.
- Before it's set: `bag:*` pickups are invisible and can't be collected (worlds 1 and 2 included), the backpack HUD button stays hidden, and power-up `gift`s pay 5 glow sticks instead.
- After it's set: baggies appear everywhere at once, even in the current visit. Saves that had already finished world 3 or later get the flag automatically.

**The backpack** (`Save.data.burns.pack`, saved, shared by all worlds).
- Picking up a baggie (`bag:molly`) or a `pack:<item>` pickup **stores** it ("+1 LOVE BOMB → BACKPACK") instead of using it. Existing `api.pickup('bag:…')` calls keep working unchanged.
- Brady opens the backpack from the **backpack button** on the HUD (top right, with a count badge), from **BACKPACK** in the pause menu, or with the **G** key. Each item shows its name, count and what it does, with a **USE** button. USE closes the menu and starts the power-up (nobody is ever shown taking anything: a sound, a banner and the effect).
- Runtime API: `g.pack.add(id, n=1, {quiet})`, `g.pack.take(id, n=1)` → bool, `g.pack.count(id)`, `g.pack.has(id, n=1)`, `g.pack.use(id)` → bool, `g.pack.list()` → `[{id, n, def}]`, `g.openPack()`. Save-level versions without UI: `BurnsPack.count(id)`, `BurnsPack.add(id, n)`, `BurnsPack.take(id, n)`.
- Events: `pack` (added) and `use` (used), with the item id; using a power-up also fires `power`.
- **Items.** Every power-up id is an item (`molly, khole, powder, lsd, shrooms, weed, bufo, liquor`), plus `water` (a bottle for later: USE heals 2). Define quest items and trade goods at load time:
```js
BurnsPack.define('icebag', { name: 'BAG OF ICE', desc: 'Melting. Hurry.', col: '#bff0ff', icon: 'drop' });
BurnsPack.define('buttid', { name: 'PLAYA ID', desc: 'Official. Cheeky. Laminated.', col: '#ffb0d8', kind: 'quest' });
BurnsPack.define('kazoo', { name: 'KAZOO', desc: 'Toot.', col: '#ffd84a', use(g) { burnsSfx('bike_bell'); g.playerBubble('TOOT!'); return false; } });
```
  Fields: `name`, `desc`, `col`, `icon` (atlas icon name; default a tinted baggie), `kind` (`'quest'` items can't be USEd unless they have `use`), `use(g)` (return `true` to consume one, `false` to keep it). Unknown ids still work and show as their id in capitals.

**Goods** are how rewards, gifts and trades name stuff. Any of these, or an array of them:

| Goods | Means |
|---|---|
| `'molly'` | one backpack item (shorthand for `{pack: 'molly'}`) |
| `{pack: 'molly', n: 2}` / `{pack: {molly: 2, icebag: 1}}` | backpack items |
| `{glow: 20}` | glow sticks (Brady's sticks carried this visit, the HUD number) |
| `{item: 'artcar'}` | a key item (get only) |
| `{costume: 'pirate'}` | unlocks a wardrobe costume (get only) |
| `{power: 'water'}`, `{heal: 2}` | instant effect (get only) |
| `{text: 'A spin-art shirt'}` | a label for a one-off prize (get only) |
| `{fn: g => {…}, text: '…'}` | custom effect (get only) |

One object can combine keys: `{glow: 10, pack: 'molly'}`. Helpers: `g.grant(goods, {quiet})` gives them (with toasts), `g.canPay(goods)` and `g.pay(goods)` check and take them (glow sticks and backpack items only), `BurnsGoods.text(goods)` → `"2 × LOVE BOMB + 10 GLOW STICKS"`.

**Trading.** Give an NPC `trades`:
```js
api.npc({ id: 'swapmeet', name: 'SWAP MEET STEVE', type: 'crusty', x: 10, z: 4,
  lines: ['Everything is gifted. Except this table. This table is a trading table.'],
  trades: [
    { id: 'm2g', give: 'molly', get: { glow: 25 }, label: 'Love Bomb for glow sticks' },
    { id: 'g2p', give: { glow: 15 }, get: 'powder', once: false },
    { id: 'phone', give: { pack: 'phone' }, get: [{ costume: 'disco' }, { text: 'Eternal gratitude' }], when: g => g.missions.state('phone') === 'active' }
  ] });
```
- After the NPC's lines the **trade window** opens: each offer shows GIVE → GET with a TRADE button (greyed out with "NEED …" when Brady can't pay) and a DONE button. Open it from a custom `talk` with `g.openTrade(a)` or `g.openTrade(a, tradesArray)`.
- `once` (default `true`): the trade is saved as done for that NPC (`id`, or its index) and shows TRADED. `once: false` repeats. `when(g, a)` hides an offer until it returns true.
- A trade fires the mission event `trade` with `{actor, trade, id}` and calls `onTrade(g, a, t)` (on the trade or the NPC def).

**Missions that require a ground score**: `use: 'powder'` (§7). Hand Brady one first if the player might not have it: `onStart(g) { if (!g.pack.has('powder')) g.pack.add('powder'); }`.

---

## 9. Sky, fog, light and time of day

Built-in palettes are `dusk`, `night`, `dawn` and `day`. Set `sky: 'dusk', sky2: 'night'`, then blend with `g.tod` from 0 to 1. Change it smoothly with `g.setTod(target, ratePerSec)`; W1 moves toward night as tokens come in.

A palette is plain data. Override any field: `sky: Object.assign({}, BURNS_PALETTES.night, { cityCol: '#38f2ff', fogD: 0.016 })`.

| Field | Meaning |
|---|---|
| `zen`, `hor` | Sky gradient, top and bottom. |
| `fog`, `fogD`, `fogH`, `fogMax`, `haze` | Fog colour, density (0.006 clear to 0.02 dusty), height falloff, maximum fog, horizon haze. |
| `sun: [azimuthDeg, elevationDeg]`, `sunCol`, `sunSize` | The sun. |
| `moon: [az, el]`, `moonK` | The moon. |
| `stars` | 0..1. |
| `mtnCol`, `mtnH` | Mountain silhouette colour and height in degrees. |
| `city: [az, el]`, `cityCol`, `cityK` | The city's glow on the horizon. |
| `sky`, `gnd` | Hemisphere ambient, top and bottom. |
| `key`, `keyK` | Key light colour and strength. It comes from the sun when it's up, otherwise from the moon. |
| `emB` | Emissive boost (neon pops more at night). |
| `rim` | Character rim-light colour. |
| `clouds`, `cloudCol`, `cloudScale`, `cloudSpeed` | Soft drifting clouds: amount 0..1 (0 = clear), colour, size (0.55; bigger = smaller clouds) and drift speed. Custom palettes that don't set `cloudCol` get clouds tinted from their own `hor`. |
| `mid`, `midK` | Optional third sky-gradient colour halfway up, and its strength 0..1 (0 = plain two-colour gradient). |

| `exposure` | Overall brightness after tone mapping (1 default). |
| `bloom` | Bloom multiplier (1 default; night scenes bloom more on their own). |
| `rays` | God-ray strength toward a low sun (1 default; 0 off). Strongest at dawn and sunset. |
| `heat` | Heat shimmer over the far playa (default: automatic on hot, sunny days; 0 off). |
| `dust` | Drifting dust haze near the ground (0.5 default). |
| `scatter`, `belt`, `milkyway`, `sunHDR` | Atmospheric scattering glow, the pink Belt of Venus opposite a low sun, Milky Way brightness at night, and the brightness of the sun disc (all 1 except `sunHDR` 7). |
| `grade` | `[saturation, contrast, vignette]`, default `[1.08, 0.12, 0.32]`. |

- For dust storms and similar events, use `def.env(g, env)` per frame (W1's ticket gust adds `env.fogD`).
- **Light at night.** Use `api.light` pools under every camp, fire and lamp, `api.glow` for the sources themselves, emissive colours on neon geometry (`m.color(c, 1)`, which **blooms** at night), and dynamic point lights.
  - The engine picks the **16 most relevant point lights** every frame (12 on phones, 4 on the WebGL1 fallback): fires, your `g.pointLight(x, y, z, radius, [r,g,b], intensity)` calls (they win ties), Brady's power-up aura, art-car and vehicle lights, and the brighter `api.glow` lamps near the camera.

### 9.1 The rendering pipeline (WebGL2)

Everything is lit in linear HDR, then tone mapped. You get all of this for free; this section explains what you'll see and the few knobs.
- **Sun shadows.** A real-time shadow map follows the camera (about 55 m on phones, 70–80 m on desktops), with soft edges. Static geometry, characters, vehicles, movers and bosses cast and receive. Glowing surfaces don't receive. At night the moon casts faint shadows on `high`/`ultra`; phones skip that pass. Blob shadows under characters remain as soft contact shadows. Custom geometry drawn in `def.drawSkinned` doesn't cast; add `def.drawShadows(g, R)` and issue the same `R.skin(...)` calls there to make it cast.
- **Materials (PBR-lite).** The gloss bits (`m.shine(0..3)`) are roughness: 0 matte (fabric, wood, skin, canvas), 1 satin, 2 paint/plastic, 3 glass and chrome (real sky reflections). Sun specular is GGX, with fresnel on everything and rim light on characters. Atlas patterns (wood, denim, canvas, fur, sequins…) are **bump-mapped** automatically from their own shading, plain matte clothing gets soft procedural folds and a fine weave up close, and the playa's cracked mud has real depth with natural variation (smooth dust drifts, colour patches, grit).
- **Ambient occlusion.** Every placed prop, mover and character gets **baked AO** when it's built: dark corners, the gap under a couch or a shade, armpits, under the chin, clothing edges, and contact with the ground. It's free at runtime. Turn it off for one object with `{ noAO: true }` in its `api.*` options. High tiers add **SSAO** on top.
- **Post.** Dual-filter bloom (LEDs, neon, fire, the sun), god rays at dawn and dusk, heat shimmer on hot days, heat haze above fires, depth of field in cutscenes, ACES tone mapping, gentle grading and a vignette. MSAA keeps edges clean.
- **Sky.** Palette gradient plus atmospheric scattering, an HDR sun with a halo, the Belt of Venus, clouds with silver linings at golden hour, a moon with phases, dense stars and the **Milky Way**.
- **Quality tiers.** `ultra`, `high` (desktop default), `medium` (phone default) and `low`, picked from the player's **GRAPHICS** setting (`auto` by default). Dynamic resolution still drops the render scale when frames run long. The WebGL1 fallback keeps the classic look without shadows or post.

---

## 10. The game object (`g`): runtime API

Available in hooks, behaviours, triggers and talk handlers.

**State**
- `g.player`:
  - Position and motion: `x, y, z, yaw, vx, vy, vz, grounded`.
  - Health and power: `hydration` (`heal(n)`, `hurt(n, fromX, fromZ, knock)`), `power`, `powerT`, `giant`.
  - Control: `vehicle`, `locked`, `animOverride`, `teleport(x,y,z,yaw)`, `knock(vx,vy,vz)`, `givePower(id)`, `say(text,s)`, `rebuildModel()`.
- `g.world`: `height(x,z)`, `surface(x,z,maxY,margin)`, `raycast(...)`, `covered(...)`, `col` (`col.statics`), `movers`, `traffic`, `vehicles`, `regions`, `checkpoints`.
- `g.actors`, `g.actor(id)`, `g.spawnActor(def)`, `g.removeActor(a)`.
- Other values: `g.time`, `g.tod`, `g.slow` (K-Hole), `g.glow` (glow sticks this visit), `g.worldId`.

**Feedback**
- `g.say(who, lines, done)`: dialogue box with a 3D portrait. `who` is an actor, `'brady'`, `'man'`, or `{name, model}`. `lines` are strings or `{who, text}` objects. `done` runs after the last line.
- `g.banner(title, sub, {col, big, small, icon, dur})`, `g.toast(text)`, `g.warn(text, secs)` (flashing warning).
- `g.playerBubble(text, s)`, `a.say(text, s)` (speech bubbles over heads).
- `g.shake(amount 0..1)`, `g.screenFlash('#fff', alpha)`, `g.fadeTo(0|1, secs)`.
- `g.fx` particles:
  - Elements: `dust`, `fire`, `smoke`.
  - Impacts: `spark`, `burst(x,y,z,'star'|'spark'|'drop'…, n, col)`.
  - Celebrations: `confetti`, `hearts`, `glint`, `notes`.
  - Effects: `firework`, `ring`, `zzz`, `puke`.
  - Raw particles: `add(...)`.
- `burnsSfx(name, {vol, pitch})` and `burnsMusic(name)`. Unknown names fall back to existing sounds, so new names are safe to use.

**Gameplay**
- `g.spawnPickup(kind, x, y, z, {mission, label, pop, onTake})`: runtime pickups (tokens, drops). There's a small pool; don't spawn hundreds.
- `g.shockwave({x, z, y, speed, max, h, dmg, col, dust})`: expanding ground ring; jump it.
- `g.projectile({kind:'pitch'|'puke'|'firework'|'fireball', x,y,z, vx,vy,vz | speed, homing, gravity, life, dmg, r, text, trail})`.
- `g.addTempFire(x,y,z,r,secs)`, `g.pointLight(...)`.
- `g.giveItem(id)`, `g.hasItem(id)`, `g.flag(k, v)`, `g.awardToken(missionId)`.
- Backpack and goods (§8.3): `g.pack.add/take/count/has/use/list`, `g.grant(goods)`, `g.canPay(goods)`, `g.pay(goods)`.
- Menus: `g.openPack()` (backpack), `g.openBoard()` (quest board, §7.1), `g.openTrade(actor, trades)` (trade window). They pause the game while open.
- `g.dayCard(o)` shows the day-of-week card now (§3.1); `o` can override `{day, name, sub}`.
- **2D overlay helpers (app-safe).** The app ships **without the 2D game**, so don't use its globals (`rr`, `UI`, `TitleScene`, `StoryScene`, `drawBrady`, `drawChinka`…) in new code. The engine itself uses none of them (even the Chinka photo is rendered from the 3D model). Use the engine's drop-in equivalents: `burnsRR(ctx, x, y, w, h, r)` (rounded-rect path), `BurnsUIKit.drawButtons/hitButtons/panel/title` (same button objects as before), `BurnsUI.text/fitSize/textLines/icon`, `BurnsStoryScene({cards: [{day, title, line, pal}], then})` for story interludes, and `burnsToTitle()` to leave to the title screen. The shared core (`clamp`, `lerp`, `Save`, `Sound`, `Input`, `FONT_*`…) is fine.

**Camera modes.** The player picks one with the **VIEW** button, the **V** key, or in settings, and it's remembered:
- `normal`: classic third person.
- `close`: over Brady's right shoulder.
- `first`: through Brady's eyes, showing his arms (tattoos and all) and whatever he's holding. Movement, jumping, talking and interacting all work the same.
- `far`: zoomed out, Brady small in a big landscape.

Read it with `g.camMode`, set it with `g.setCamMode(mode)`, and check `g.firstPerson()`. Cutscenes always use their own cameras. If a set piece needs a specific view (a tight corridor, say), switch for that moment and restore `g.camMode` after.

**Held items.** `g.player.hold('zipties')` puts a mission item in Brady's right hand (seen in third person and in first person); `g.player.hold(null)` empties it. A mission with `hold: 'ticket'` holds the item while it's active and drops it when it completes or fails.
- Held props: `ticket, zipties, glowstick, icebag, idcard, parcel, wrench, map, water, phone, camera, flashlight, bell, coffee, guide`, or any prop from §6.5.
- Your own: `BurnsRig.defineProp('w17Spoon', (m, A) => {…})`. Unknown names show a generic tag.
- On the bike, first person shows the handlebars and both hands on the grips.
- `g.interactables = [{x, z, y, r, label, when(g), fn(g, it)}]`: extra ACTION prompts such as `OPEN`, `RING` or `FUEL`.
- `g.cutscene(steps, done)` (§11). `g.finishWorld(next)` ends the world (§12).
- Bosses: `g.addBoss(b)` registers a boss-like object (update, draw and colliders every step). `g.boss = b` puts it on the HUD health bar (needs `name, hp, maxHp, active, defeated`).

---

## 11. Cutscenes

`g.cutscene([...steps], done)` runs steps in order with letterbox bars. The player can **SKIP** at any time. Skipping runs the remaining `do` steps, so put state changes in `do` steps and story stays consistent.

| Step | Effect |
|---|---|
| `{ cam: {x,y,z, tx,ty,tz, fov} }` | Cut the camera. |
| `{ cam: {from, to, dur, ease, hold} }` | Move the camera between two cameras. |
| `{ say: [who, lines] }` | Dialogue; waits for taps. |
| `{ wait: secs }` | Pause. |
| `{ do: g => … }` | Instant code. It still runs when the scene is skipped; add `noSkip: true` to skip it on SKIP. |
| `{ until: g => bool }` | Advance when true. Called every step, so animate things here. |
| `{ move: {actor, x, z, speed, anim} }` | Walk an actor to a spot. |
| `{ banner: [title, sub, opts] }`, `{ music }`, `{ sfx }` | Titles and audio. |
| `{ fade: 'out'|'in', dur }`, `{ letterbox: false }` | Fades and letterbox control. |
| `{ parallel: [steps…] }` | Run steps together. |
| `{ dolly: {from, to, dur, ease} }`, `{ crane: … }` | Same as a `cam` tween; use the names for readability. |
| `{ orbit: {x, y, z \| actor, r \| r0+r1, h \| h0+h1, a0, a1, ty, dur, fov, ease, hold} }` | Circle a point or an actor (`'brady'` or an id), optionally pushing in (`r0`→`r1`) and rising (`h0`→`h1`). Angles are yaw in radians. |
| `{ track: {actor, dist, h, side, ty, fov, dur, k} }` | Follow an actor from behind (`side` swings around them), smoothed. Good for walks and chases. |
| `{ slowmo: 0.3, dur }` | Slow the world (not the camera) for `dur` seconds, or until `{ slowmo: 1 }`. |
| `{ dof: {focus, aperture} \| false \| 'auto' }` | Depth of field. Cutscenes focus on the camera's target automatically; set a focus distance in metres, or turn it off. |
| `{ title: true \| {day, name, sub}, hold, wait: false }` | The title card: the day of the week, then "World N · Name". Waits `hold` seconds (3.4) unless `wait: false`. |
| `{ swell: 'track' }` | Switch music and lift it for a few seconds: the big story moments. |
| `{ shake: 0.6 }`, `{ flash: '#ffffff' }` | Camera shake and a screen flash. |

During cutscenes Brady is locked. Use `g.player.animOverride = 'sit'` to pose him, and set it back to `null` when done.

**Example: a reveal.**
```js
g.cutscene([
  { title: true, wait: false },
  { crane: { from: { x: 0, y: 2, z: 20, tx: 0, ty: 2, tz: 0 }, to: { x: 0, y: 14, z: 30, tx: 0, ty: 6, tz: 0 }, dur: 4 } },
  { swell: 'burns_w3' },
  { orbit: { actor: 'jefr', r0: 6, r1: 3.5, h0: 2.5, h1: 1.6, a0: 0, a1: 1.2, dur: 3.5 } },
  { say: [g.actor('jefr'), ['Welcome home, kid.']] },
  { slowmo: 0.4, dur: 1.2 }, { flash: '#ffd84a' }, { shake: 0.4 }
]);
```

**Story transitions (automatic).** When a world calls `g.finishWorld()`, the engine plays a short victory orbit around Brady in slow motion with a music swell, then shows the results. After that, a **story card** carries the player to the next world: that world's sky at its time of day, its day of the week, its name and a one-line story beat, before it loads. Write your world's line as `def.story: 'Monday. Follow the bass to a bamboo dance floor.'` (defaults live in `BURNS_STORY_IN`). Skip the victory orbit with `def.noOutro: true` if your ending already has one. `finishWorld(next)` with a callback still takes over completely (the finale's ending).

---

## 12. Bosses and the Man

### 12.1 `BurnsManBoss`: the reusable Man controller
```js
const man = new BurnsManBoss(g, {
  x: 0, z: -300, yaw: 0, scale: 0.85,       // 1.0 = ~13m tall; W10 phase 2 grows him (tween man.scale)
  hp: 3, name: 'THE MAN', title: 'Lovesick Effigy',
  attacks: ['stomp', 'swipe', 'flash', 'fire', 'fireworks'],   // the enabled set
  phases: [                                   // hp = fraction of max hp where the phase starts
    { hp: 1.0, attacks: ['stomp', 'swipe'], combo: 2, rate: 1 },
    { hp: 0.66, attacks: ['stomp', 'swipe', 'flash'], combo: 3, rate: 1.15 },
    { hp: 0.33, attacks: ['flash', 'fire', 'fireworks'], combo: 3, rate: 1.3 }
  ],
  stun: 5.5,                 // seconds his head is down (the only time he takes damage)
  arena: { x: 0, z: -278, r: 34 },   // stomp/swipe reach; he waits while Brady is outside
  holdChinka: true,          // Chinka in his left hand (man.showChinka toggles visibility)
  flashCharge: 2.6, flashDamage: 2, fireworks: 7,
  onPhase(g, b, i) {}, onHit(g, b) {}, onDefeat(g, b) {}
});
g.addBoss(man);              // updates and draws every step (he's visible from afar: a beacon)
// when the fight starts:
g.boss = man; man.start();
```
Attacks:
- **stomp**: a ground shockwave from his foot. Jump it.
- **swipe**: a low neon whip sweeps around him. Jump it.
- **flash**: his head charges (warning plus a countdown), then a full-screen flash. Brady takes damage **unless a `cover` collider blocks the line from the head**. Put booths, porta-potties and vehicles in the arena.
- **fire**: fireballs from his face, rolling toward Brady and leaving fire trails.
- **fireworks**: rockets from his hands land on marked rings.

After `combo` attacks he collapses with his head on the ground. Brady **stomps, ground-pounds or spins** the glowing head, which costs one hp; then the Man shakes him off and the next phase begins.

Useful members:
- `man.setState('idle'|'walk'|'flee'|'grab'|...)` for cutscenes; `walk` and `flee` animate the legs.
- `man.hidden`, `man.showChinka`, `man.x/y/z/yaw/scale`.
- `man.head()`, `man.hand(±1)`, `man.foot(±1)`.
- `g.bossSay(man, text)`: a pink caption under the boss bar.

For **W10 phase 2** (giant), tween `man.scale` from 1 to 2.5 in `update`, swap `phases`, and keep `arena.r` matching. For the saucer, `api.prop('saucer', {x, z, r: 14, h: 4})` with the Man at `y = 4.5`: set `man.y`, since his colliders and shockwaves use it.

### 12.2 Sub-bosses
Any enemy can be a sub-boss. Give it `hp` and `boss: true`, and use a behaviour whose `hit` only returns `true` while it's vulnerable (see `greeterHug` and friends). For the HUD bar, set a wrapper:

```js
g.boss = { name: 'DJ WUB', get hp() { return a.hp; }, maxHp: 4, active: true, get defeated() { return a.defeated; }, head() { return [a.x, a.y + 2, a.z]; }, update() {} };
```

Clear it with `g.boss = null`. W1's `BURNS_W1.nextGreeter` chains three in a row.

### 12.3 Ending a world
After the boss: play a cutscene, then call `g.finishWorld(next)`. This:
1. Marks the world done and unlocks World N+1.
2. Banks glow sticks.
3. Shows the results card ("WORLD COMPLETE", tokens, photos).
4. On tap, calls `next(g)` if you passed it, otherwise returns to the hub.

World 10 should pass `next` to roll into the ending; `StoryScene` and `CreditsScene` exist in the codebase.

---

## 13. Saves (`Save.data.burns`, via `BurnsSave`)

```
{ v, unlocked:{1:true,…}, tokens:{'w:missionId':true}, photos:{'w:id':true}, items:{ticket,map,www,bike,costumes,artcar},
  costume:'none', costumesOwned, glow (lifetime), glowWorld:{w:best}, worldDone:{w:true}, missions:{'w:id':'done'},
  flags:{'w:key':value}, seenIntro, lastWorld, checkpoint:{w:cpId}, settings:{camSens, invertY, autoCam, cam, gfx},
  pack:{itemId:count} }
```
- `BurnsSave.get()` returns the data (and creates or migrates it).
- Tokens and photos: `hasToken`, `addToken`, `tokenCount(w)`, `hasPhoto`, `addPhoto`, `photoCount(w)`.
- Items and worlds: `hasItem`, `addItem`, `unlockWorld`, `isUnlocked`, `setCostume`.
- Flags: `flag(w,k,v)`. Saves happen automatically on those calls; call `BurnsSave.save()` after editing `get()` directly.
- Ground scores and the backpack: `groundScore()`, `setGroundScore(true)` (= `flag(0, 'groundscore', true)`), and `BurnsPack.count/add/take` (§8.3). Trades marked `once` are saved as flags `'w:trade:actorId:tradeId'`.
- Tokens, photos, key items and finished non-token missions persist and don't respawn. Glow sticks respawn on every visit (best score per world).
- A world's intro should play once: `if (!BurnsSave.flag(id, 'intro')) …` then `BurnsSave.flag(id, 'intro', true)`.

---

## 14. Audio names

Tracks:
- Hub and story: `burns_hub`, `burns_intro`, `burns_victory`, `burns_ending`.
- Worlds: `burns_w1`…`burns_w10`.
- The Man: `man_boss`, `man_giant`.

SFX:
- Movement: `footstep, land, jump3d, doublejump, groundpound, spin`.
- Rewards and talk: `token_get, ticket, dialogue_blip, pickup_bag, map_open, costume, crowd_cheer`.
- Enemies: `yell, greeter_bell, camera_flash, pitch_blah, hurt3d`.
- Fire and the Man: `neon_flash, flame_jet, firework_launch, firework_burst, man_roar, man_stomp`.
- Bike: `bike_bell, bike_pedal`.
- Power-ups: `molly, khole, powder, lsd`.

Older SFX also work (`jump, stomp, hurt, select, back, pick, powerup, splash, secret, gold, artcarHorn, flame, dust, wind, crowd, gift`…). Unknown names fall back to something close (`BURNS_SFX_FALLBACK`), so use the new names freely.

---

## 15. Performance budget (60 fps on a recent iPhone)

- **Draw calls per frame: aim for 120 or fewer.** World 1 renders about 55–70. `g.stats.draws`/`tris` count the main pass, `g.stats.shDraws`/`shTris` the sun-shadow pass (set `window.__burnsDebug = true` to see both on screen).
  - Static props are merged per 48 m cell.
  - Vehicles, movers and pickups share skinned groups (about 40 per draw).
  - **Each visible character is one draw.** Keep **visible** NPCs to about 50: crowds far from the action are fine because the culling distance is 115 m, but don't put 200 dancers in one spot.
- **Vertices.** Static chunks are split automatically. W1 rasterises about 430k triangles at its busiest views (the gate line at dusk, high tier), and about 490k by the dance crowd at the dome; keep any view under about 500k. Vehicles carry framed glass, wheel wells, bumpers and roof caps up close, and geodesic domes use open-tube struts under their hubs (about 22k triangles for a 3-frequency dome with its frame). Engine traffic gets **LOD twins**: each vehicle carries a low-detail copy that is shown beyond 38 m. Your own movers can do the same with `api.mover(build, { lodTwin: true })`, but only if `build(m)` is deterministic and side-effect free, because it runs twice (`m.lo` is true on the second run). Rounded primitives cost 3–6× a plain box, so use them where the camera gets close and use `m.lo` or plain `box` for background clutter. Characters switch LOD automatically: full detail (about 8–16k triangles) within 16 m, LOD (3–5k) to 45 m, and a crowd LOD (about 2.4k, small accessories dropped) beyond that. `api.crowd` reuses 24 looks per type, so crowds share models. Hand-placed NPCs with unique seeds each cost a model build (about 10 ms) and GPU memory, so reuse seeds for background extras.
- **CPU.** Actors farther than 110 m from Brady don't update. Keep `update` hooks O(n) over small lists; don't scan all colliders every step. Movers farther than 110 m skip collision.
- **Sprites.** Particles are capped at 2600; glow billboards are culled at 170 m. Emitters near the camera are cheap; don't emit every step from 50 places.
- **Textures.** One atlas (2048×2048, with 32 face slots and 23 extra pattern slots), one sprite sheet, and per-world ground paint (≤2048²) and lightmap (≤1024²). Don't add per-world textures. The shared atlas is 2048×3072: its sign area has two pages per world, so camp-heavy worlds keep full-size signs.
- **Resolution.** The engine caps DPR at 2 and drops resolution automatically (down to 50%) when frames run slow. Never fight it.
- **Shadows cost a second pass.** The shadow map redraws every static chunk near the camera, every vehicle group, and every character within about 42 m. Keep giant merged meshes out of the camera's way, and give background rows of props `m.lo` detail. On phones the `medium` tier uses a 1024² map and no SSAO. Test your heaviest view with `BurnsGL.configure('high')` and with `'medium'`.
- **Point lights** are free to request (`g.pointLight`): the engine keeps only the most relevant 12–16.
- **GPU memory.** Leaving a world frees its buffers (`BurnsScenes.releaseWorld`).

---

## 16. Testing your world

- **Screenshots.** `window.__burnsHideHUD = true` hides the HUD and touch controls. `BurnsGL.configure('ultra'|'high'|'medium'|'low')` switches the graphics tier live; `BurnsGL.tier` reads it.

1. Build privately: `BRADY_DIST=$SCRATCH/dist node tools/build.js`.
2. Playwright (`require('playwright')`, `chromium.launch()`), viewports **874×402** and **402×874**, `deviceScaleFactor: 2, isMobile: true, hasTouch: true`. Headless WebGL renders in software (slow, so FPS there means nothing).
3. Use the debug API from `page.evaluate`. `window.BRADY_BURNS` (the engine classes such as `BurnsGL`, `BurnsRenderer` and `BurnsMesh`, plus `debug`) exists in every app that bundles the engine, Art Cart included; the hub and title modules only add their scenes to it.
   ```js
   const D = window.BRADY_BURNS.debug;
   D.play(2);                  // start world 2 (fresh save: localStorage.clear(); BRADY.Save.load())
   D.skipCine();               // skip cutscene + close dialogue
   D.teleport(x, z, y);        // move Brady
   D.sim(seconds, { up: true, jump: true, jumpPressed: true, actionPressed: true });  // fast-forward input
   D.state();                  // {x,y,z, hydration, glow, tokens, missions:[[id,state,n]], boss, draws, cpu, fps}
   D.give('bike'); D.power('lsd'); D.complete('missionId');
   window.__burnsDebug = true; // fps / draws / position overlay
   ```
   Example: talk to an NPC with `D.teleport(a.x + 1.5, a.z); D.sim(1/120, {actionPressed: true})`, then close dialogue with `while (D.scene().dialog.open) D.scene().dialog.next()`.
4. Checklist:
   - Zero page errors (`page.on('pageerror')` and `window.__bradyErrors`).
   - Every token mission can be completed.
   - Three photos are reachable.
   - The boss can be beaten.
   - `finishWorld` unlocks the next world.
   - Both orientations work.
   - Pause, quit to title and back all work.
   - Saves survive a reload.
   - Draw count is about 120 or less (`D.state().draws`).
5. Reference tests (World 1, written for the engine) are in `/tmp/claude-0/-home-user-brady-o/55338a3e-dd1f-51fb-b998-1b26dc729d6a/scratchpad/burns/`, if that folder is still there. Copy their patterns:
   - `play1.js`: scripted mission run-through.
   - `ui_test.js`: real touch via CDP `Input.dispatchTouchEvent`, both orientations, pause/quit, no-WebGL and context loss.
   - `gallery.js`: costumes, cast, bike, art car and power-ups.

---

## 17. Worked example: World 1 "The Line" (`src/42_burns_world1.js`)

Read it top to bottom; it uses almost every feature.

1. **Ground.** `api.paint` draws the rutted gate road, playa blotches, tyre tracks, the arena disc and the greeter dust patch.
2. **The line.** `api.traffic` places four lanes of about 230 crawling vehicles. Lane 4 favours tall vehicles for the roof chase. Four lane-2 cars get `sleep = true`, which stalls the lane behind them.
3. **Furniture.** Light towers, cones, pennants, joke signs and trash fences. A `camp()` helper builds roadside camps (vehicle, shade, couch, chairs, cooler, barrel, optional dome, crowd).
4. **NPCs with `talk()` handlers that start missions:**
   - Sunny (tutorial + gift), Lucky (ticket), Dex (zip ties), Gus (drivers), Mama Dusty (gauntlet), Gate Crew Moe (opens the gate).
   - Sleeping drivers use `behavior: 'sleep'` + `onWake`, plus a custom `marker`.
5. **Missions:**
   - `ticket` (`find`): the ticket pickup's position is driven every step (`updateTicket`) and hops from roof to roof ahead of Brady.
   - `zipties` (`collect` with `gate: true` pickups).
   - `drivers` (`custom` progress).
   - `greeters` (`custom` + three sub-bosses).
   - `stack` (`climb`, `secret`, `start: 'trigger'`).
   - `boss` (`requires` the ticket and the greeting, `tokenDirect`).
6. **Secrets and collectibles:** photos on the DJ dome, behind the porta-potties, and at the end of an `api.hidden` LSD staircase. The Playa Map lies by a broken-down bus guarded by a thief. Power-up baggies sit in corners.
7. **The Man:**
   - Built in `build` and registered with `g.addBoss`, so he's visible at the end of the road all level.
   - The **intro cutscene** (`BURNS_W1.intro`) walks him to the car, grabs Chinka and leaves.
   - **`bossIntro`** starts the fight from a trigger.
   - **`bossDefeated`** plays the flee cutscene, then `finishWorld()`.
8. **Atmosphere.** `sky: 'dusk', sky2: 'night'`. Each token pushes `tod` toward night. `env()` thickens fog during the ticket's dust gust.
9. **The Red Light District.** Brady and Chinka hitched a ride to the Burn in the Red Light District camp's pink RV. `api.redLightCamp` parks it in the line right next to the spawn, with the crew (`redlight` type) cheering Brady on; it's in the intro cutscene too.
10. **Ground scores.** W1's baggies stay hidden on a first visit (Brady doesn't know what they are yet). After world 16 they appear, including the LSD staircase to the third photo.

---

## 18. Notes for the other worlds (story + engine hints)

| World | Story beat | Engine pieces to reach for |
|---|---|---|
| 2 No Camp | Sunday night: Brady has no camp. He stashes his gear in the Red Light District RV (`api.redLightCamp`, crew `BURNS_REDLIGHT.crew`), gets rejected all over the city, sleeps at Center Camp, flees the tent guy. Fire spinners and flame effects. | `sky: 'night'`, lots of `api.light`/`api.glow`, `flameJet` rings, fire-spinner NPCs (custom anim: `dance` style + fire sprites in `drawSprites`), `BurnsManBoss` with `['stomp','swipe','fire']`. |
| 16 Rhythm Wave (plays 3rd) | Monday: build the camp, win the dance contest, Bam Bam's pill, the wonky bike ride to the Glowshroom Grove. Ground scores start here. | `BurnsSave.setGroundScore(true)` after the pill; `g.pack`, `trades`, a mission with `use:`; `g.giveItem('bike')`. |
| 17 Root Society (plays 4th, home) | Tuesday: Jefr adopts Brady, gives him a tipi. Revisitable home with lots of side quests. | `side: true` missions with `reward`, `api.questBoard`, `trades`, `g.finishWorld()` when the arrival story is done. |
| 3 Costume Cult (plays 5th) | Choose a costume. Brady already has the yellow bike from W16, so here it gets stolen: chase the thief, fix the flat. | `g.giveItem('costumes')` + `BurnsSave.setCostume` + `player.rebuildModel()`; `g.giveItem('bike')`; `ride` missions; `bell` events. |
| 4 The Orgy Dome | Meet an informant while sneaking past creepy dudes. Comedic, nothing explicit. | `stealth` missions with `patrol` enemies (`view`, `fov`), `follow` behaviour for the informant, giant `dome` props with `api.mesh` interiors. |
| 5 Costco Soul Trading Co. | Giant gifting warehouse; a platonic burner buddy joins. | Shelves from `api.box`/`scaffold`; `deliver` chains (`custom` + `talk`); `follow` companion (`escort`). |
| 6 The Art Car Hunt | Commandeer a fire-breathing octopus art car, dodging tech bros. | `api.artCar({ build: yourOctopus })` with `poofers`, `pitcher` enemies, `ride` missions with `vehicle: 'car'`, `flames` events. |
| 11 Sound Camp Crawl (plays 7th) | Per your brief. | Dancing crowds (`dance` with `k.bpm`), `api.light`/`api.glow` stages, the shared `BurnsDJ` decks minigame (its own file). |
| 7 Sunrise Set | Heart-topped sound car at dawn; sparkle ponies, influencers, crusty old burners. | `sky: 'night', sky2: 'dawn'` with `setTod`; `api.mover` for the sound car (or `artCar` with `path`); `flasher` influencers; crowds with `dance`. |
| 8 Hell Station | Fuel the art car; battle DPW. | `g.interactables` for fuel pumps; DPW `charger`/`chase` enemies; `mud`, `fire`; an `escort` or `ride` mission. |
| 9 Deep Playa Showdown | Fight the Man again; he escapes. | Open deep playa, `dust` up, `BurnsManBoss` with fireworks; end with his `flee` like W1. |
| 12 The Temple (plays 11th) | Per your brief. | Rounded wood (`api.lathe`, `api.roundBox`, pattern `wood`); palettes can add a `mid` sky band (§9). |
| 13 The Workshops (plays 12th) | Per your brief. | `api.mover` machines, `g.interactables`, `api.roundBox` benches and tools. |
| 10 The Man Pavilion | Ride in on the yellow bike, in costume, to the final fight. Phase 1 on the saucer, phase 2 giant (neon flash + cover, face fire, arm fireworks). | `api.prop('saucer')`, `man.y` on the deck, cover props on the deck; phase 2 tweens `man.scale`, music `man_giant`; `finishWorld(g => Game.setScene(…ending…))`. |

Have fun. Make it look like a modern mobile game, keep the jokes short, and test on both orientations.
