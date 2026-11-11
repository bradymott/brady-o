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
| `glowDist` | number (m) | How far static glows (`api.glow`) show; default 170. Open worlds raise it so lights read from afar at night. |
| `chunkSize` | number (m) | Static geometry is merged per square cell this size (default 48). Bigger cells mean fewer draw calls but coarser culling. |
| `ao` | `true` / `'fast'` / `false` | Baked ambient occlusion for props and movers: `'fast'` uses a coarser grid (about 6× quicker to build, a little softer); `false` skips it (for huge or procedurally filled worlds with long load times). Per object: `{ noAO: true }`. |
| `day`, `dayShort` | string | Day of the week shown on the intro card, the loading card and the hub pin (for example `'Monday'`, `'MON'`). Defaults come from the table in §3.1, so you rarely need it. |
| `dayCard` | bool | `false` skips the automatic day card at the start of a visit. Show it yourself later with `g.dayCard()` (for example at the end of your intro cutscene). |
| `home` | bool | Marks Brady's home world (world 17 already has it). The hub shows it as a tipi pin with a HOME button. |
| `boardTitle` | string | Title of this world's quest board (§7.1), e.g. `'ROOT SOCIETY JOB BOARD'`. |
| `tiles` | object | Streams the world in tiles around Brady (open worlds, §19.1). |
| `open` | bool | Marks the open world (world 500). The title's CONTINUE goes there, and its pause menu shows a fast-travel MAP. |
| `travel(g, worldId)`, `onResume(g, sub, how)` | fn | Open worlds: the MAP sends Brady to a place; `onResume` runs when an entered place (§19.2) or the map hands control back. |
| `drawHUD(ctx, g, W, H, S)` | fn | Extra 2D HUD drawn over yours (CSS pixels; `S` holds the safe-area insets). Only during play: not in cutscenes or when the HUD is hidden. |
| `drawUnder(g, ctx, fdt)` | fn | Your own 2D layer over the 3D frame and under the engine's HUD, every frame (screen tints, a rhythm panel). CSS pixels. |
| `drawOverlay(g, ctx, fdt)` | fn | Your own 2D layer over the HUD, the dialogue box and the touch controls, under the fade, pause menu and results. Every frame. Use it instead of wrapping `BurnsUI.drawOverlay`. |
| `cameraFx(g, cam, dt)` | fn | Runs on the finished camera every frame, cutscene cameras included: add wobble, roll (`cam.roll`), fov breathing or a nudge to `cam.ty`. Use it instead of wrapping `g.updateCamera`. |
| `crowdDist` | number (m) | How far instanced crowds (§4.8) draw; default 95. |
| `mapProject(g, worldId, M)`, `mapDraw(g, ctx, M, t)` | fn | Open worlds: put each place's pin on your own map, and draw the map under the pins (§19.4). |

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
  - `next(id)` and `prev(id)` step over ids that have no registered world yet. A build without W16/W17 goes 2 → 3, and saves migrate the same way. The order array itself never changes.
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

### 4.8 Instanced props (one draw for many copies)
For anything repeated dozens or thousands of times (RVs, tents, lamp posts, people on bikes), define a prototype once and place copies. Each prototype and detail level is one draw call however many copies are visible. The copies are culled by distance and view, then switch detail by distance.
- `api.instanceProto(id, build, opts)`: `build(m)` runs at full detail and again with `m.lo = true`; `opts.far(m)` builds the cheapest copy. Distances: `near` (full detail to, default 45 m), `mid` (default 140), `farD` (default 320). Also `r` (radius for culling), `shadow: false`, `noAO`, `minD` (never drawn closer: far-city stand-ins), `noCap` (ignores the world's `drawDist`), `cols: false`.
- `api.instance(id, x, z, { y, yaw, scale, tint: [r, g, b], noCol })` places a copy. The colliders returned by the full-detail build come with every copy (`noCol` skips them). `tint` multiplies the vertex colours, so one RV prototype can come in several shades.
- `W.instancer().dyn(id)` returns a copy you move yourself every frame (`{x, y, z, yaw, s, on}`): W500's bike riders.
- Copies made while a tile builds belong to that tile and go away with it (§19.1).
- **Fewer prototypes means fewer draws.** Build a near-white prototype and colour each copy with `tint` instead of making one prototype per colour (W500 has one tent, one dome, one shade and three camp fronts, all tinted). Leave out the far level (`far`) for small props: they simply stop drawing past `mid`.

**Instanced crowds (background people).** For dance floors, a busy Esplanade or people hanging out in front of camps: hundreds of people for a handful of draws.
- `api.extras([[type, seed], ...])` once: the looks (NPC specs, §6.5). Keep it to about 4 looks; every look multiplies the draws.
- `api.extra(x, z, { yaw, anim, look, phase, scale, y })` places one person. `anim` is any animation name (`'dance'`, `'idle'`, `'talk'`, `'cheer'`...); `look` indexes the looks; `phase` (0..1, default one of three) offsets the animation.
- Everyone with the same look, animation and phase shares one pose, so a batch is one draw. Detail by distance: the full model to 12 m, the far model to 38 m, then a box figure of about 200 triangles. Past 12 m everyone shares phase 0, and `'talk'` becomes `'idle'`.
- Extras have no AI, no collision and no talk: use real actors (`api.npc`) for anyone Brady can speak to. They draw to `def.crowdDist` (95 m) and get a soft blob shadow up close. Extras made while a tile builds belong to that tile.
- Budget: W500's busiest street view has about 120 extras on screen in 15–25 draws and 80–110k triangles.

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

### 5.1 Blender-made props (`BurnsGLBProps`)
The first hero props are Blender models that replace the procedural builders above when they are loaded: `rv`, `bus`, `dome`, `portapotty`, `shade`, and Root Society's tipis (`bcmTipi` in `src/41_burns_camps.js`, also new as `api.prop('tipi', {r, h, canvas, band, band2})`). Nothing in a world changes: the same `api.prop(kind, opts)` call, the same footprint, origin, `cols`, `lights`, `top`, `len` and `w` come back, and the procedural prop is still built for low-detail builds (`m.lo`, `opts.lo`), on `file://` pages, when a size the model doesn't cover is asked for (shades over 14 m or outside 2–4.5 m tall, `dome` with `frame: false`), with `opts.glb: false`, or until the models arrive (worlds built before then stay procedural). `window.__burnsNoGLBProps = true` before a world builds keeps everything procedural for comparisons.
- **Files.** `tools/blender/bm_<prop>.py` builds one prop with `tools/blender/bmkit.py` (a thin layer over the Art Cart kit `cartkit.py`: same materials, primitives and `Build`, plus `run_static(stem, build_fn)`, `geodesic()`, `bm_rod_open()`, `bm_tri_sheet()`, `catenary()`), exporting `assets/models/burning-man/<stem>.glb` and a preview in `shots/blender/<stem>_<view>.png`. Run one headless: `/Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/bm_rv.py`. Budget: 12k triangles a prop (rv 8.8k, bus 12k, dome 6.2k, tipi 3.7k, potty 1.2k, shade 1.7k). `tools/build.js` ships them packed as `models/<stem>.glb.gz` beside the page with `models/index.json`.
- **Loading.** `src/41_burns_glbprops.js` starts `BurnsGLBProps.preload()` shortly after boot (Burning Man app only): it reads `models/index.json`, fetches every stem in `BURNS_GLB_PROPS` (kind → stem: `rv, bus, dome, tipi, portapotty: 'potty', shade`), then wraps `BurnsProps.<kind>` (and `bcmTipi`). `BurnsGLBProps.ready`, `.docs`, `.count` (props built from a glb), `.fallbacks` and `.stats()` are there for tests.
- **`BurnsGLTF.emit(m, doc, opts)`** appends a parsed glb's triangles to any `BurnsMesh` at its current transform, through `m.vert`, with each material's colour, gloss and emissive mapped exactly as `BurnsGLTF.rig` does (§6.8), so glb geometry merges into the static chunks like a procedural prop: AO bake, chunking, LOD and the shadow pass all keep working. `opts`: `roots` (which root nodes to write; a shade's `body`, `pole`, `guy`, `lights` are emitted separately so any `w × d × h` fits), `at`, `yaw`, `scale` (a number or `[sx, sy, sz]`: the dome is authored at r = 5 and scaled by `r / 5`, the tipi at r 2.6 / h 5.6), `colors` (`{ materialName: '#hex' | {col, e, gloss} }`, material names without the kit's `bv_` prefix: `body`, `cab`, `cover`, `canvas`, `band`, `lit0`…, so one model takes a world's `col` options). Returns the triangle count.
- **Authoring rules** (docs/HANDOFF_LOCAL_AGENTS.md §2): original designs, no brands or logos, the rounded toy look (bevelled, chunky forms). Engine coordinates as the cars (origin on the ground at the prop's centre, +Z forward, +X the prop's left); keep the procedural prop's size so world placements stay right, and give any piece the game should place on its own (a door, a pole) its own root bone with `B.bone(name, at)`.
- **Test.** `node tools/bm_props_test.js` (after a build; `BRADY_DIST` respected) serves the site, waits for `BurnsGLBProps.ready`, shoots World 1 and World 17 and a close-up of each prop, glb and procedural (`shots/bmprops/<name>.png`, `<name>-proc.png`), prints draws / triangles before and after, walks Brady into an RV and a porta-potty to check their colliders, and fails on page errors.

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
- `BURNS_ATLAS.sign(text, style)`: renders text into the per-world sign area (two pages, reset every world: about 60–80 typical signs). The same text and style share one texture.
- **Streaming worlds:** a sign first made while a tile builds belongs to that tile; it goes to recycled shelves at the bottom of page 2 and is given back when the last tile using it is freed. Prefer a small pool of texts (W500's camp names come from 48 fixed names, each with its own colours) over a unique text per building.
- **Faces:** 64 slots (`BURNS_ATLAS.addFace(name, recipe)`). The atlas is 2048×4096: tiles and icons, sign page 1, four face banks (y 1024–3072), then sign page 2.
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
`idle, walk, run, jump, flip, fall, land, spin, pound, hurt, dance{style,bpm}, bike, drive{steer}, sit, sleep, victory, cheer, talk, wave, shuffle, yell, hug, charge, bell, phone, photo, clipboard, throw, climb, float, fly, captive, knocked`, plus the cast's idle flavours `firespin{tool,rate}, dare, think, radio, lantern, dj{bpm}, dazed, welcome, robot`. Hair and buns are springy: they bounce on landings and swing when characters turn. `walk` is a planted-foot cycle (`burnsTravelPose`: the stance foot retreats by exactly the ground covered, arms swing opposite the legs) and `run` is the classic run pose; both advance with the distance travelled (`BURNS_GAIT`: a cycle is 1.45 / 3.6 leg-heights), falling back to the clock when the character is blocked or standing (dialogue portraits, crowds).
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

### 6.8 glTF models (`BurnsGLTF`)
Blender-made models ship as `.glb` files and draw through the existing `R.skin()` path: the loader (`src/40_burns_ba_gltf.js`) converts glTF 2.0 into the engine's 24-byte skinned vertex format, so shadows, bloom on emissive, fog, point lights and sky reflections all apply with no shader changes. There are no per-model textures yet: a material becomes a vertex colour, a gloss level and an emissive level (the engine's PBR-lite).
- `BurnsGLTF.fetch(url)` → Promise of a parsed doc (rejects on HTTP errors; it never logs, callers decide). `BurnsGLTF.parse(arrayBuffer)` parses a GLB in hand. The doc has `json`, `bin`, `accessor(i)`, `nodeWorld(i)` and `roots`.
- `BurnsGLTF.rig(doc, { bone(name, node) → 0..63 | null, minBones, ao, aoRes })` → `{ geo, nb, J, names, empties, extras, bounds, tris, nv }`. `geo` is exactly what `BurnsMesh.geo()` returns; `J` the rest joints (nb × 3), as the car rig expects. `BurnsGLTF.staticGeo(doc)` puts everything on bone 0 around the file's origin (props).
- **Rig convention.** Every **root node** of the default scene is a bone; a root node with no mesh in its subtree is an **empty** (`empties[name] = {x, y, z, extras}`, world translation): use them for marker points such as seats, muzzles and lights. The node's world translation is the joint; every vertex in its subtree is baked by its full world matrix, then the joint is subtracted, so each bone is authored around its own pivot (pose = parent · T(joint) · R · S). Metres, Y up, the model faces **+Z** and **+X is its left** (Blender: front toward −Y, export with +Y up). Mirrored nodes (negative determinant) get their winding and normals flipped. `extras` merges the scene's extras with the bone-0 node's (Blender custom properties export as extras when "Custom Properties" is on).
- **Materials.** Colour = `baseColorFactor` × `COLOR_0` (linear → sRGB). Gloss: metallic ≥ 0.5 and roughness ≤ 0.35 → 3 (chrome, sky reflections); clearcoat > 0 or roughness ≤ 0.4 → 2 (car paint); roughness ≤ 0.7 → 1; else 0. Emissive: a non-zero `emissiveFactor` makes the colour the emissive colour and `e = emissiveStrength / 3` (so Blender emission strength 3 is a full-bright bulb, 1 is a soft glow). Material extras `burns_gloss` (0..3) and `burns_e` (0..1) override both. UVs are ignored (the atlas's white texel).
- **Limits.** At most **65535 vertices** per file (the engine's 16-bit indices); the loader throws otherwise. Triangle modes only. Baked AO runs unless `{ ao: false }`.
- **Art Cart.** `assets/models/art-cart/<stem>.glb` (showroom, 20–30k triangles) and `<stem>_lo.glb` (race, 5–8k) are copied by `build.js` to `models/` beside the app page and listed in its service worker. `src/43_cart_bb_glb.js` maps car ids to stems (`CART_GLB`), names the bones (`body`, `wheel_FL`, `wheel_FR`, `wheel_RL`, `wheel_RR`, `steer`, then `part_<name>` in sorted name order from bone 6) and the empties (`seat`, `muzzle`, `light_<n>` with extras `color`, `size`, `big`/`head`/`tail`/`led`), reads `len`, `w`, `h`, `wheelR`, `steerTilt`, `driverScale`, `seatYaw` from extras (defaults from the bounds), and keeps part animations in `CART_GLB_PARTS[carId][partName]`. `CartModels.get` prefers a loaded glb; the procedural car is the fallback (no file, `file://` pages, or `window.__cartNoGLB = true`). `node tools/cart_shots.js` screenshots the showroom (glb and procedural) and a race.

### 6.9 Skinned glTF characters (`BurnsSkin`)
Real modelled characters (Phase 1–2 of the handoff): a glTF file with a **skin** (a Mixamo-compatible humanoid skeleton, up to 64 joints) and **animation clips**, drawn with GPU skinning, four weights a vertex (`src/40_burns_bc_skin.js`). The weighted vertex shader feeds the *same* fragment shader object as `R.skin()`, so sun shadows (cast and received), fog, point lights, the sky probe, cloth folds, the skin subsurface tint, the rim light, `tint` and the face-row trick all match the rigid characters exactly. One draw call per character.
- **Loading.** `BurnsSkin.preload('models/<name>.glb.gz')` → Promise of an asset (cached by name; `BurnsSkin.get(name)`); `BurnsSkin.load(doc, { name })` for a doc in hand. The loader extensions underneath: `BurnsGLTF.skins(doc)` → `[{ joints, inverseBind, skeleton, names }]`, `BurnsGLTF.clips(doc)` → `{ name: { duration, channels: [{ node, path, times, values, interp }] } }` (quantised outputs become floats; `CUBICSPLINE` keeps its middle values and samples linearly; `STEP` is honoured), `BurnsGLTF.skinnedGeo(doc, { skin, uv, maxJoints })` → `{ geo, nb, skin, inverseBind, tris, nv }`. Materials map exactly as §6.8 (base colour → vertex colour, gloss, emissive); UVs are the atlas white texel unless `{ uv: true }` keeps the file's. A skinned file that carries UVs **and** textures takes the textured hero path of §6.12 instead, automatically. Up to 65535 vertices and 64 joints (the loader throws beyond; drop finger and `_End` bones in Blender, or split the mesh). gltfpack's quantisation (the build runs it) is handled: the mesh node's dequantisation is baked into the vertices and out of the inverse bind matrices, so bind space is always metres.
- **The asset.** `{ name, geo, nb, nodes, parent, order, rest, jointSlots, jointOf, jointNames, inverseBind, clips, clipNames, bounds, height, tris, nv, extras }`. `bounds`/`height` come from the rest pose skinned on the CPU once at load.
- **Weighted vertex format (32 bytes)**, uploaded by the usual `BurnsGL.geo()` and laid out by `BurnsGL.layoutSkinW()`: `0 pos f32x3 | 12 normal i8x3 | 15 gloss u8 (0..3) | 16 colour u8x4 (a = emissive) | 20 uv u16x2 | 24 joints u8x4 | 28 weights u8x4 (normalised, sum 255)`. Vertices are in bind space (the mesh's own space, metres); the palette carries the world placement, so one geometry serves every instance.
- **Characters.** `new BurnsSkinnedChar(asset)` (or `BurnsSkin.spawn(name, x, y, z, yaw)`, which also registers it for drawing in the running play scene): `x, y, z, yaw, scale, tint, face, rim, visible`, `play(name, { loop: true, fade: 0.2, speed: 1, restart, time })` (crossfades from whatever was playing; `ended` is set when a one-shot finishes), `update(dt)`, `compute()` → `palette` (`Float32Array(nb × 12)`, the engine's 3x4-row a34 convention: `world(joint) · inverseBind` under `T(x,y,z) · Ry(yaw) · S(scale)`), `nb`, `bounds`, `height`, `jointPoint('mixamorig:Head', x, y, z, out)`, `headPos()`. `BurnsSkeleton` (the node hierarchy, local TRS → world rows → palette) and `BurnsClip` (sampling: binary search per channel, shortest-arc quaternion lerp) sit underneath; nothing allocates per frame.
- **Drawing.** `R.skinW(geo, palette, n, tint, face, rim)` works after `R.skinBegin()` in the main pass and inside `shadowBegin()/shadowEnd()` (the shadow caster program `shSkinW`), counts into `R.stats`, and leaves the rigid skin program bound, so it can be mixed freely with `R.skin()` calls. The programs `skinW` and `shSkinW` are registered through `BurnsGL.addPrograms`, so they follow tier changes and context loss. If a skin has more joints than `BurnsGL.maxBones` (16–64, from the GPU's vertex uniform budget) the draw is skipped with one warning. From a world, draw in `def.drawSkinned(g, R)` and again in `def.drawShadows(g, R)` so the character casts (§9.1); `BurnsSkin.attach(g)` installs exactly those two hooks for the characters in `BurnsSkin.chars` (stepped once per frame from the scene clock, so `D.sim()` advances them too). `BurnsSkin.remove(ch)` / `clear()`.
- **The placeholder.** `tools/blender/mannequin.py` (headless: `/Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/mannequin.py`) builds `assets/models/burning-man/mannequin.glb`: a rounded humanoid (black tee, jeans, white sneakers, sunglasses, a bun; about 7.7k triangles) on a 25-bone armature with Mixamo bone **names and hierarchy** (`mixamorig:Hips … Spine, Spine1, Spine2, Neck, Head, HeadTop_End, Left/RightShoulder, Arm, ForeArm, Hand, UpLeg, Leg, Foot, ToeBase, Toe_End`, T-pose, no fingers), procedural distance-to-bone skin weights, and three keyframed clips exported as glTF animations: `idle` (3 s breathing), `walk` (1 s stride, in place), `wave` (2 s). The build ships it as `models/mannequin.glb.gz`.
- **Dropping in Brady's real character.** Export from Blender with the Mixamo rig (`export_skins`, `export_animations`, `export_apply` off for the armature, +Y up, extras on; the model faces +Z with +X its left, which Mixamo and Blender's exporter both give you). Keep the skin at 64 joints or fewer (a full Mixamo rig with fingers is 65: delete the finger or `_End` bones, or the loader throws with the count). Mixamo clips: download them "without skin", import each FBX onto the character's armature in Blender, push each action onto an NLA track named after the clip, and export with `export_animation_mode='ACTIONS'`; the clip names become `play()` names. Then `BurnsSkin.preload('models/brady.glb.gz')` and `BurnsSkin.spawn('brady', x, y, z, yaw).play('walk')`. Wiring it into `BurnsRig.defineType` / actors is the next step (the API mirrors `BurnsChar`: play/update/compute/palette instead of bones).
- **Testing.** `window.BRADY_BURNS.debug.mannequin(n)` spawns `n` mannequins near Brady in whatever world is running (walkers circling, idlers, wavers); `debug.skin()` reports the loaded assets and clip names. `node tools/skin_test.js [outDir] [n]` (with `BRADY_DIST` set) does that in world 1 and screenshots `shots/skin/mannequins.png`, `mannequins-close.png` (first person, 2.4 m) and `mannequins-front.png`, printing the draw and triangle deltas; it fails on page errors or when the draws don't grow by about one per mannequin.

### 6.10 Textured glTF (`BurnsPBR`)
Stage 2 of the glTF plan (`docs/ART_CART_GLTF_PILOT.md` §1): real texture maps on Blender-made models, drawn by `src/40_burns_bd_pbr.js` through the same lighting as everything else (sun shadows cast **and** received, fog, point lights, the lightmap, bloom on emissive, the sky probe). Nothing in the engine files changes: the module adds loader functions to `BurnsGLTF`, registers its programs with `BurnsGL.addPrograms` (rebuilt on tier changes and context loss) and two methods on the renderer. Use it for props, scenery and (later) textured art cars; the 24-byte path of §6.8 stays the cheap default for untextured models.
- **Loading.** `BurnsPBR.load('models/<name>.glb.gz', opts)` → Promise of a model `{ parts: [{ geo, material, name }], bounds, tris, nv, nb, J, names, empties, extras, textures }`, one part (= one draw) per glTF material. By hand: `BurnsGLTF.fetch(url)` → `BurnsGLTF.textures(doc)` (Promise: decodes the embedded PNG/JPEG/WebP images with `createImageBitmap`, no colour-space conversion, into managed textures with mipmaps and 8× anisotropy; wrap from the glTF sampler; images over `opts.maxSize` (2048) are downsampled) → `BurnsGLTF.pbrGeo(doc, { bone, minBones })`. Bones follow the rig convention of §6.8 (`opts.bone(name, node)` → 0..63; root nodes are bones, joint-relative baking), so a textured car reuses `CartGLB.boneFn`; without `bone` everything sits on bone 0 around the file's origin. `BurnsPBR.pick(indexJson, stem)` chooses `.glb.gz` or `.glb` from `models/index.json`; `BurnsPBR.release(model)` frees the buffers and textures.
- **Drawing.** `R.pbrBegin(env, world)` once per pass (in `def.drawSkinned` / `def.drawShadows`, after `R.skinBegin` has run: it switches programs itself and re-applies the lighting uniforms), then `R.pbr(model, bones, nb, tint)` per placed model. `bones` is `null` (the file's own origin), a column-major **mat4** (`BurnsPBR.mat4(x, y, z, yaw, scale)`; program `pbr`, static) or **rigid bone rows** (`nb × 12`, as `R.skin` takes; program `pbrSkin`), `tint = [r, g, b, a]` mixes a flat colour over the result. In the shadow pass (`R.pass === 'shadow'`) the same calls draw depth only (`shPbr`). `BurnsPBR.visible(R, model, x, y, z, scale)` is a frustum test on the bounds. Draws and triangles count in `R.stats` like everything else (`shDraws`/`shTris` in the shadow pass).
- **Vertex format (32 bytes, `BurnsGL.layoutPBR()`):** `0 pos f32x3 | 12 normal i8x3 + bone u8 (bone 0..63, as the 24-byte format) | 16 tangent i8x4 (w = bitangent sign) | 20 uv i16x2 (uv × 1024, so −32..32 repeats) | 24 colour u8x4 (sRGB baseColorFactor × COLOR_0; a = emissive strength / 3 × COLOR_0.a)`. Tangents come from the file (`export_tangents`, MikkTSpace) or are computed from the UVs; `KHR_texture_transform` (which `gltfpack` uses for its UV quantisation) is baked into the UVs; mirrored nodes flip winding, normals and tangent handedness. Parts over 65 535 vertices get 32-bit indices (WebGL2).
- **Material** (`part.material`): `base [r, g, b, a]`, `metal`, `rough`, `em [r, g, b]` (emissiveFactor), `e` (= `emissiveStrength / 3`, clamped to 1, overridable by the material extra `burns_e`), `coat`, `coatRough` (`KHR_materials_clearcoat`), `nScale` (normalTexture.scale), `aoK` (occlusionTexture.strength, only when occlusion shares the metallic-roughness image), `cutoff` (`alphaMode: MASK`; −1 otherwise; `BLEND` draws opaque), `doubleSided`, `uvT`, `ids` (glTF texture indices) and `tex: { base, orm, normal, emissive }` (managed textures or `null`, bound on units 6–9 with white / white / flat-normal / black fallbacks). The shader: `albedo = bLin(base map) × vertex colour`, `roughness = ORM.g × roughnessFactor` (floor 0.03), `metallic = ORM.b × metallicFactor`, `occlusion = mix(1, ORM.r, aoK)` on ambient, lightmap and reflections; `bShadePBR` = hemisphere ambient + lightmap, wrapped sun diffuse × (1 − metal), GGX sun specular with Schlick fresnel on `F0 = mix(0.04, albedo, metal)`, point lights, sky-probe reflection by roughness (split-sum fit; hemisphere colours on tiers without the probe), an optional clear-coat lobe; `emissive = bLin(map) × factor × strength × uEmB` added on top (glowing texels skip shadows and most fog, as the engine's emissive does). Normal maps are glTF/OpenGL convention (+Y up), bitangent = `cross(N, T) × w`.
- **Limits and budgets.** Textures 2048² at most (bigger ones are downsampled; a 1024² set is plenty for a prop, 256² tiles for metal and rubber), PNG/JPEG/WebP (`EXT_texture_webp`); KTX2/Basis is not read. Keep a model to a few materials: every material is a draw in the main pass and another in the shadow pass (4 crates × 2 materials = 16 of the ~120 budget). Decoded bitmaps stay in memory for re-upload after context loss (16 MB for four 1024² maps). `gltfpack -kn -ke` (what `tools/build.js` runs) keeps the embedded images untouched and quantises UVs to 12 bits over each material's UV range, so keep tiling UVs near 0..1 per face rather than letting them run to ±30.
- **Authoring in Blender** (the test prop is a script: `tools/blender/pbr_demo.py`, headless `Blender -b -P`, writes `assets/models/burning-man/pbr_crate.glb`, 2.1k triangles, 1.1 MB): metres, +Y up export, the model facing −Y in Blender (engine +Z), origin on the ground. One **Principled BSDF** per material: *Base Color* ← an sRGB image; *Roughness* and *Metallic* ← the **G and B** of one **Non-Color** ORM image through a *Separate Color* node, its **R** (occlusion) into the *Occlusion* socket of a **glTF Material Output** group node (Add → Output in the shader editor, or make the group yourself as the script does), so the exporter writes one `metallicRoughnessTexture` shared with `occlusionTexture`; *Normal* ← a *Normal Map* node fed by a Non-Color OpenGL-style normal map; *Emission Color* ← an sRGB image with *Emission Strength* 3 or more for a full bulb (the engine's `e = strength / 3`). Pack the images (or keep them next to the .blend) and export with *Materials: Export*, *Images: Automatic* (PNG), *Tangents* on, *Apply Modifiers*, custom properties on; turn on **Backface Culling** on the material unless the surface really is two-sided. Bake textures from procedural Cycles materials or paint them; **UV-unwrap deliberately** (box or smart projection with 8 px gutters, and paint colour past island edges so mipmaps don't bleed seams), keep tiling UVs small, and put everything that can share a map into one material.
- **Testing.** `window.BRADY_BURNS.debug.pbrDemo(n, { dist, spacing, scale, stem })` drops `n` crates in front of Brady in the running world (any world: it wraps `def.drawSkinned` / `def.drawShadows` at runtime) and resolves to `{ parts, tris, textures, materials, items }`. `BRADY_DIST=… node tools/pbr_test.js [shots/pbr] [n]` builds nothing itself: run `node tools/build.js` first, then it serves the site, starts World 1, spawns the crates and writes `crates.png` (day), `crates_dusk_close.png`, `crates_detail.png` (grazing light: ribs, rivets, seams), `crates_day_shadow.png`, `crates_night.png` (the EL wire blooms) and `crates_night_medium.png`, checks the crates are in the shadow pass, cycles every quality tier (the programs recompile each time) and fails on any page error.

### 6.11 Skinned characters in play (`BurnsSkinActor`)
§6.9 draws a skinned glTF character on its own; this puts them **into the games** (`src/40_burns_be_skinactor.js`). Brady (the player, the dialogue portrait, Art Cart's driver) and Chinka (every actor of type `chinka`, the Man's captive, Art Cart's driver and portrait) keep driving their procedural `BurnsChar` exactly as before; at draw time a bridge reads that `BurnsChar`'s placement, animation name and clock, plays the matching clip on a `BurnsSkinnedChar` and draws it with `R.skinW` instead. Nothing in play depends on a model file being there.
- **Files.** At app start (Burning Man, Art Cart, the combined build; the 2D app has no engine) `BurnsSkinActor.preload()` reads `models/index.json` and fetches `models/brady.glb(.gz)` and `models/chinka.glb(.gz)`; a missing file falls back to `models/mannequin.glb(.gz)` (the §6.9 stand-in, one asset shared by both kinds; Chinka's stand-in is tinted pink so the two read apart); no file at all keeps that character procedural. The real assets ship the clip set `idle, walk, run, jump, land, hurt, knocked, dance, wave, talk, hug, sit, sleep, cheer, drive, fire, sulk, captive, photo`. `BurnsSkinActor.ready` / `stats()` (`debug.skinActor()`) report what loaded; `window.__burnsNoSkinActor = true` switches the swap off (comparisons, budgets).
- **Mapping** (engine animation → clip): `idle→idle, walk→walk, run/charge→run, jump/fall→jump, land→land, hurt/yell→hurt, knocked→knocked, dance/shuffle→dance, wave→wave, talk/phone→talk, hug→hug, sit→sit, sleep→sleep, cheer→cheer, captive→captive, photo→photo, drive/cartDrive→drive, cartFire→fire, cartHit→hurt, cartCheer→cheer, cartSulk→sulk` (`BURNS_SKINACTOR.MAP`). `jump, land, knocked, fire` play once and hold their last frame (so a fall keeps the end of the jump); everything else loops; walk and run follow the `BurnsChar`'s stride phase (`_stridePhase`: the ground actually covered, or the clock at `k.rate` when the character isn't moving), so the feet don't skate and never freeze. When an asset lacks a clip the bridge walks `BURNS_SKINACTOR.FALLBACK` (`run→walk`, `knocked→hurt`, `captive→hurt`, `fire/sulk→drive`, `drive→sit`, `hug/cheer→wave`, … every chain ends at `idle`), which is how the three-clip mannequin stands in for everything.
- **Fallback rules.** Anything not in the table (`bike, climb, flip, spin, pound, float, fly, throw, victory, hang/zip, robot, lantern, bell, clipboard, the DJ and world-specific anims`), a `BurnsChar` with a custom `poseFn` (pilot seats, zip lines), an asset that isn't loaded, or the switch above → the hook returns `false` and the caller draws the procedural model as it always did, in that frame only: Brady on the bike, mid-flip or climbing is the rounded Brady, and back to the skinned one when the state maps again (with no crossfade, the previous clip being stale). Actors beyond 45 m keep the procedural LOD (a few hundred triangles against about 8k skinned; `BURNS_SKINACTOR.LOD_D2`). First person, the invincibility blink and `hidden` players draw nothing, as before; costumes only matter for hiding: the skinned Brady ignores the LOOK screen's costume (the file is the costume).
- **Hooks** (each a one-liner of the form `BurnsSkinActor.x(...) || <the old R.skin draw>`, in both the shadow pass and the main pass): `draw(g, R, kind, ch, tint, rim)` for one `BurnsChar` at its own placement (the player and the Man's captive in `40_burns_i_play.js`, the dialogue portrait's `who === 'brady'`/`who.type` path, Art Cart's standing driver and portraits in `43_cart_f_menu.js`); `drawActor(g, R, a)` for a play-scene actor (type `chinka` only, with the 45 m rule); `drawDriver(R, car, ch, idOrType)` for an Art Cart driver (`43_cart_e_scene.js` race, `43_cart_f_menu.js` showroom): `cartPoseDriver` has already placed the `BurnsChar` at the seat (car-local, `seatYaw`, `driverScale`), so the bridge takes that same placement and puts the palette under the car's body bone (`car.bones[0..11]`), exactly as the rigid driver's bones are. The bridge is cached on the `BurnsChar` (`ch._skinActor`); its time step is the `BurnsChar`'s own clock (`animT`), so slow motion, freezes and `debug.sim` fast-forwards stay in step and the second pass of a frame costs nothing. Chinka's bridge emits rising white-gold glints through the play scene's `g.fx` (two a frame within 25 m of the camera; none in Art Cart, which has no `fx`).
- **Art Cart's files.** `tools/build.js` copies `assets/models/<app>/*.glb` per app, so Art Cart's own site ships only its cars: there the hooks stay dormant until `brady.glb`/`chinka.glb` (or the mannequin) are also placed in `assets/models/art-cart/` (the combined `dist/models` lists everything, so the combined build has them). `tools/skinactor_test.js` copies the files into the scratch site's `art-cart/models` for its run only. Art Cart's driver-portrait atlas is rendered once on the first visit to the driver screen; if that happens before the assets arrive it keeps the procedural portraits for that session.
- **Budget.** Measured in world 1 with the mannequin standing in for Brady (7.7k triangles, 25 joints): the same frame swapped off/on is 74/74 draws and 349k/347k triangles (the procedural Brady costs about as much); the shadow pass grows by one skinned caster (+9k triangles). `BurnsSkinActor.drawn` counts skinned main-pass draws, `sparkled` the glints.
- **Testing.** `node tools/skinactor_test.js [outDir]` (with `BRADY_DIST` set, the site served over http): Burning Man world 1 with the swap off and on (draw/triangle deltas), Brady walking (`shots/skinactor/player-walk.png`), mid-jump (`player-jump.png`), a spawned Chinka actor with sparkles (`chinka.png`), the Man's captive (`chinka-captive.png`), the bike with the procedural fallback (`player-bike.png`); Art Cart's showroom with Brady (`cart-showroom-brady.png`), the driver screen with Chinka (`cart-driver-chinka.png`) and a race start (`cart-race.png`). It fails on page errors or when a swap that should be live isn't.

### 6.12 Textured skinned heroes (`BurnsSkinPBR`) and the character GLB contract
The realistic-character path (`src/40_burns_bf_skinpbr.js`): a **skinned glTF that carries UVs and texture maps** is drawn GPU-skinned (64 joints, 4 weights) **and** textured (base colour, normal, ORM, emissive), with a dedicated skin, cloth and hair shading model, alpha-tested hair cards, three LODs, tier-sized textures and blink/talk/smile face poses. It switches on **by itself**: `BurnsSkin.load`/`preload` look at the file, so `BurnsSkinActor` (§6.11), `BurnsSkin.spawn` (§6.9) and Art Cart's drivers draw a textured `brady.glb` with no code change. Untextured files (today's `brady.glb`, `chinka.glb`, the mannequin) keep the 32-byte path of §6.9 byte for byte (proved by a frame-locked pixel diff, see Testing). `window.__burnsNoSkinPBR = true` before loading forces the old path (comparisons).

**How it plugs in (no edits to the older engine files).** The module wraps four things: `BurnsSkin.load` (a doc with a skinned, textured primitive becomes a hero asset), `BurnsSkin.preload` (resolves once the images are decoded), `R.skinW` (a geometry stub with `geo.skinPbr` routes to `R.skinHero`; anything else runs the original function), and `BurnsSkeleton.prototype.compute` / `BurnsSkinnedChar.prototype.update` (face poses; only for assets that have them). Programs `hero`, `heroCut`, `shHero`, `shHeroCut` are registered with `BurnsGL.addPrograms` (rebuilt on tier change and context loss). **WebGL1 note:** `BurnsGL.buildPrograms` runs the `addPrograms` hooks from `buildPost`, which only exists on the WebGL2 tiers, so on the WebGL1 fallback (`legacy`) neither `skinW` (§6.9), `BurnsPBR` (§6.10) nor this path has programs and skinned glTF characters are not drawn at all (true before this module too; every iPhone on iOS 15+ gets WebGL2).

**The asset** has every field of §6.9 (`nb, nodes, parent, order, rest, jointSlots, jointOf, jointNames, inverseBind, clips, clipNames, bounds, height, tris, nv, extras`) plus `textured: true`, `lods: [{ parts: [{ geo, mat, name, kinds }], tris, nv }, …]`, `textures`, `face`, `lodDist`, `texReady` and a stub `geo` (`{ skinPbr: asset, count, nv, stride: 36 }`) so every caller of `R.skinW(asset.geo, …)` keeps working. Primitives are **merged into one draw per shared texture set** (same base/ORM/normal images, alpha mode, double-sidedness, metallic factor, normal strength and occlusion strength); base-colour factor, roughness factor, material kind and emission strength travel in the vertices, so several Blender materials can share one draw. Order: opaque, glow, cutout. The loader warns when a LOD needs more than 3 draws.

**Vertex format (36 bytes):** `0 pos f32x3 | 12 normal i8x3 | 15 flags u8 (bits 0–1 kind: 0 generic, 1 skin, 2 cloth, 3 hair; bits 2–7 roughness factor × 63) | 16 tangent i8x4 (w = bitangent sign) | 20 uv u16x2 (normalised 0..1) | 24 colour u8x4 (sRGB baseColorFactor × COLOR_0; a = emission strength / 3) | 28 joints u8x4 | 32 weights u8x4 (sum 255)` (`BurnsGL.layoutHero()`, 8 attributes). Tangents come from the file or are derived (Lengyel, with the bitangent pointing to image-up, matching Blender's MikkTSpace export; the test checks the two agree). A draw over 65 535 vertices gets 32-bit indices (WebGL2 core, `OES_element_index_uint` on WebGL1); a draw is skipped on a device with neither.

**Shading (`hero` program, one fragment shader for every kind; the engine's own sun, sky ambient, lightmap, fog, point lights (12 on phones), shadows, sky probe, rim light, `tint` and colour trip):**
- **Skin** (kind 1): per-channel wrapped diffuse (red wraps furthest: 0.50 / 0.26 / 0.17) and a red-shifted shadow edge (`sh^(0.55, 1.05, 1.25)`), the pre-integrated look without a LUT; a faint warm ambient; specular F0 0.028, roughness never below 0.36, plus a tight 15 % "oil" lobe; point lights wrap the same way, so neon tints the terminator.
- **Cloth** (kind 2): normal-mapped; the engine's procedural fine weave is added within 4 m (bind-space, rides the body); a soft grazing sheen.
- **Hair** (kind 3): Kajiya-Kay highlights along the strand (the card's **V** direction): a white primary and an albedo-tinted secondary, wrapped diffuse 0.35, sky reflection damped.
- **Generic** (kind 0): metal/rough GGX, as `BurnsPBR` (§6.10).
- Every kind: ORM (`R` occlusion × `occlusionTexture.strength`, `G` roughness × factor, `B` metallic × factor), tangent-space normal map (OpenGL/glTF, +Y up), emissive map × factor × strength (an untextured emissive material glows from its factor; glowing texels skip shadows and most fog and bloom at night), split-sum sky-probe reflections.
- **Cutouts** (`alphaMode: MASK`; `BLEND` is drawn as MASK with a warning): program `heroCut`, double-sided when the material is. With MSAA (the WebGL2 tiers) it uses **alpha to coverage** with an alpha sharpened by `fwidth` (soft but stable edges, no sorting); without MSAA a hard test at the cutoff. Both scale alpha up with the mip level so thin cards don't vanish in the distance. In the **shadow pass** cutouts use `shHeroCut`, which samples the base alpha and discards, so hair-card and lattice shadows have holes.

**LOD.** Three levels per character in one file: mesh objects named `…_LOD1` / `…_LOD2` (node name, mesh name, or the build's tag; `extras.burns_lod` on a primitive also works); no suffix = LOD0. The distance is camera → hips (from the palette, ÷ the character's scale): LOD0 inside **8 m**, LOD1 to **20 m**, LOD2 beyond, ±12 % hysteresis (`BURNS_SKINPBR.LOD`, `.HYST`; per file with the scene custom property `burns_lod: [8, 20]`). A missing level uses the next finer one. Beyond 45 m `BurnsSkinActor` actors still drop to the procedural crowd model (§6.11). The shadow pass draws the level the main pass chose. `BurnsSkinPBR.forceLod = 0|1|2|null` pins a level (screenshots).

**Texture tiers.** Images are kept as their compressed bytes (Blobs) and decoded at the tier's size: **ultra/high 2048, medium 1024, low 512**, WebGL1 1024 (`BURNS_SKINPBR.TEX`; larger sources are downsampled at decode, smaller ones kept). A tier change or a context loss re-decodes in the background (the old texture or a neutral fallback stays bound meanwhile); the decoded bitmap is closed after upload, so only the GPU copy and the compressed file stay in memory. Memory: `BurnsSkinPBR.memory(asset)`.

**Faces (bones, not morph targets).** Morph targets are **not** supported: in this vertex format 4 targets would add 24–48 bytes to every vertex (or a vertex-texture fetch path), for three expressions. Instead, extra face joints (counted in the 64) are posed by **face clips**: any action named `face_<name>` is read as a pose (its last frame; only the joints it moves) and kept out of the clip list. `face_blink`, `face_jaw` and `face_smile` are driven automatically: a blink every 2.2–5.5 s, the jaw flaps while the body plays `talk` or after `say()`. The hook: `BurnsSkinPBR.face(x)` (x = a `BurnsSkinnedChar`, a `BurnsChar` drawn through `BurnsSkinActor`, or `'brady'` for the player) → `{ blink(), say(seconds), talk(true|false), set('smile', 0..1), set(name, null), auto }` or `null` when the asset has no face clips. Example for a dialogue line: `const f = BurnsSkinPBR.face('brady'); if (f) f.say(2.5);`.

**Memory lifecycle.** Hero assets loaded by `BurnsSkinActor` are app-wide (Brady and Chinka appear in every world) and persist. A world-local hero loaded with `BurnsSkinPBR.preloadFor(g, url, name)` is released with that world (`BurnsScenes.releaseWorld`); `BurnsSkinPBR.release(asset)` frees buffers and textures by hand.

**Debug.** `debug.skinPbr()` (assets, LOD triangles/draws/parts, texture sizes and MB, counters `draws, shDraws, cut, shCut, a2c, lod[3], uploads`), `debug.skinHero(url, { name, as: 'brady'|'chinka' })` (loads a file by URL and, with `as`, puts it in `BurnsSkinActor`'s place).

**Measured costs** (the fixture of `tools/make_skin_fixture.js`: brady's mesh split to 43 k triangles at LOD0, 31 joints, a 2048² atlas + 1024² ORM and normal + a 1024×512 hair card texture; headless Chromium, so frame times mean nothing):

| | LOD0 | LOD1 | LOD2 |
|---|---|---|---|
| triangles / vertices | 42 948 / 24 176 | 10 832 / 6 804 | 3 788 / 2 202 |
| draws, main pass (+ the same again in the shadow pass) | 3 | 3 | 1 |

| textures per hero (GPU, with mips) | high / ultra (2048) | medium (1024) | low (512) |
|---|---|---|---|
| atlas + ORM + normal + hair | 21.3 + 5.3 + 5.3 + 2.7 = **34.7 MB** | 5.3 + 5.3 + 5.3 + 2.7 = **18.7 MB** | 1.3 + 1.3 + 1.3 + 0.7 = **4.7 MB** |

Geometry for all three LODs is 1.5 MB; the compressed images stay in memory as Blobs (a few MB; JPEG/WebP base colour keeps that small). One hero at LOD0 adds exactly 3 draws and its triangles to the main pass and 3 draws to the shadow pass (`tools/skinpbr_test.js`); two heroes plus the player in World 1 by day measured 80 draws and 441 k triangles. **Budget per hero:** ≤ 35 MB of textures on high, ≤ 19 MB on medium (two heroes on screen: 70 / 38 MB on top of the engine's own atlas and targets); keep LOD0 at 25–35 k triangles (the player is always LOD0 and Root Society already sits near the 450 k budget), and use the "one 2K colour atlas, 1K normal, 1K ORM, 1K hair" packing.

**Testing.** `BRADY_DIST=… node tools/skinpbr_test.js [shots/skinpbr]` (after `node tools/build.js`) generates the fixture into `$BRADY_DIST/fixtures`, packs it like the build into the test-only `<site>/<app>/skintest/` (never listed in `models/index.json`) and checks: the shipped characters stay untextured; the fixture loads textured with ≤ 3 draws per LOD; 31 joints; face poses; all 19 clips give finite palettes; the chest badge's four quadrants read back red/green/blue/yellow (UVs, texture binding, orientation); banner holes show the background and its solid cells are magenta (cutout, alpha to coverage on MSAA); the banner's shadow has holes (the cutout shadow program) compared with the same banner forced opaque; exactly +3 draws per hero; LOD switches at 8/20 m with hysteresis; textures 1024 on medium and 2048 on high; loader-derived tangents match authored ones; jaw/eyelid joints move, blink fires, `say()` drives the jaw; `BurnsSkinActor` draws a textured asset as the player; `preloadFor` + `release` free everything; an Art Cart driver. With `BRADY_BASE_DIST=<a build of the previous commit>` it adds a frame-locked comparison (fixed clock, seeded `Math.random`, frames pumped by hand) of World 1 at its own dusk and at night with Brady and a Chinka actor and of Art Cart's showroom driver: pixels and draw/triangle counts must be identical to the base build. It writes `check_*.png`, close-ups by day, at sunset in Root Society and at night under neon, each LOD, two heroes, `backcompat_*_{base,branch,diff}.png`.

#### The character GLB contract (what Blender must export)
| | |
|---|---|
| **File** | One `.glb` per character, `assets/models/shared/<name>.glb` (`brady`, `chinka`), images **embedded**. glTF 2.0, no Draco/meshopt/KTX2 (`tools/build.js` packs it). |
| **Switch-on** | At least one skinned primitive with `TEXCOORD_0` whose material uses a texture. |
| **Scale / axes** | Metres, +Y up, the character faces **+Z** (Blender: faces −Y; export with +Y Up), **+X is its left**. Origin on the ground between the feet. All transforms applied (mesh objects at identity, armature at the origin, scale 1); every skinned mesh object shares the armature. Bind pose: T or A. Height about 1.85 m (Brady). |
| **Attributes** | Required: `POSITION, NORMAL, TEXCOORD_0, JOINTS_0, WEIGHTS_0`. Recommended: `TANGENT` (MikkTSpace; derived when missing). Optional: `COLOR_0` (multiplies the base colour; alpha scales emission). Not read: `TEXCOORD_1`, morph targets, extra weight sets. One UV set, **inside 0..1** (out-of-range UVs are clamped with a warning; no tiling, no UDIMs). |
| **Skeleton** | Mixamo names with the `mixamorig:` prefix. Required: `Hips` (LOD distance, Art Cart seat), `Head` (look-at, glints), the usual body chain (Spine, Spine1, Spine2, Neck, Shoulder/Arm/ForeArm/Hand, UpLeg/Leg/Foot/ToeBase both sides). **≤ 64 joints in the skin** including face joints; at most 4 influences a vertex, normalised. Drop finger and `_End` bones (or keep a few if under 64). Export deformation bones only. (On a WebGL1-only device with the minimum uniform budget the palette holds 29 joints and a bigger skin is skipped; every iPhone since iOS 15 has WebGL2.) |
| **Face joints** (optional) | Children of `Head`: `mixamorig:Jaw`, `mixamorig:LeftEyelid`, `mixamorig:RightEyelid` (upper lids), `mixamorig:LeftMouth`, `mixamorig:RightMouth` (corners); optionally `LeftEye`/`RightEye`. Names are a convention (the poses are what count). Weight the chin/lower lip to `Jaw`, the lids to the eyelid joints, the corners to the mouth joints. |
| **Clips** | One action per clip, exported as separate glTF animations (Actions or NLA tracks mode, "Always sample", 30 fps is fine; the build resamples at 30 Hz). The 19 names `idle, walk, run, jump, land, hurt, knocked, dance, wave, talk, hug, sit, sleep, cheer, drive, fire, sulk, captive, photo` (exact, lower case). Loops (`idle, walk, run, dance, wave, talk, hug, sit, sleep, cheer, drive, sulk, captive, photo, hurt`) end on their first pose; one-shots (`jump, land, knocked, fire`) hold their last frame. Walk and run cycle **in place** (the game moves the character; their speed scales with the game's gait rate). `drive`/`fire`/`sulk` are seated (hips at the seat; Art Cart lifts the palette so the hips sit 0.88 m above the car's seat point). Missing clips fall back (`BURNS_SKINACTOR.FALLBACK`, every chain ends at `idle`). |
| **New clips** (e.g. `sprint`) | Add the action to the file; `BurnsSkinnedChar.play('sprint')` works at once. To have the game use it through `BurnsSkinActor`, add one entry to `BURNS_SKINACTOR.MAP` (engine animation → clip, e.g. `sprint: 'sprint'`) and one to `FALLBACK` (`sprint: 'run'`) in `src/40_burns_be_skinactor.js`, and make the gameplay set that engine animation. |
| **Face poses** | Actions `face_blink` (both lids closed), `face_jaw` (mouth open, ~15–20°), `face_smile` (corners up/back), each a pose keyed on its last frame and touching only face joints. Any other `face_<name>` is available to `face.set(name, w)`. |
| **Materials and draws** | **At most 3 draws per LOD:** (1) **body**: every opaque material (skin, clothes, solid hair cap, shoes, sunglasses, teeth, belt…) shares **one texture set**: one base-colour atlas, one ORM, one normal map. They may differ in base-colour factor, roughness factor, kind and emission strength, but not in images, metallic factor, normal strength or occlusion strength. (2) **cutout**: hair cards, brows, eyelashes, fuzz: `Alpha Clip`/MASK, cutoff 0.5, Backface Culling **off** (double-sided), own RGBA texture. (3) optional **glow or extra**: an emissive part with its own (or no) texture, e.g. Chinka's LED necklace. Emission can instead live in the body set's emissive texture (zero extra draws). No `BLEND` (drawn as a cutout); sunglasses lenses are opaque, dark, roughness 0.05–0.15. |
| **Material kind** | Custom property **`burns_kind`** on each material: `skin`, `cloth`, `hair` or `generic` (export Custom Properties on). Without it the name decides (`skin…` → skin; `hair, lash, brow, beard, stubble` → hair; `cloth, shirt, tee, pants, jeans, dress, skirt, sock, jacket, hood, legging, scarf, cape, robe…` → cloth; else generic). |
| **Textures** | PNG, JPEG or WebP, power-of-two. **Base colour** (sRGB) 2048² atlas for body + clothes (JPEG/WebP fine, no alpha needed). **ORM** (Non-Color, R occlusion, G roughness, B metallic) 1024², wired into both *Roughness/Metallic* (through Separate Color) and the glTF Material Output *Occlusion* so the exporter writes one shared image. **Normal** (Non-Color, OpenGL +Y) 1024² (2048² only if the 2 K detail is visible, it costs 21 MB). **Hair** RGBA 1024² (or 1024×512), strands running along **V** (roots at the top of the image), alpha = coverage, colour painted past the alpha edge. **Emissive** (optional, sRGB) shares the base atlas layout. 8–16 px gutters at 2 K, colour bled past island edges. |
| **LODs** | Mesh objects `<name>_LOD1`, `<name>_LOD2` (any number of objects per level, all suffixed; LOD0 has no suffix), same armature and materials. Hair cards may be thinned at LOD1 and dropped at LOD2; LOD2 should be one draw. |
| **Budgets** (recommended, from the fixture's measurements below) | LOD0 **25–35 k triangles**, ≤ 3 draws (the player is always LOD0 under the chase camera); LOD1 **8–12 k**, ≤ 3 draws; LOD2 **2.5–4 k**, 1 draw. ≤ 65 535 vertices per draw keeps 16-bit indices. Hair cards: 150–400 cards (≤ 4 k triangles) at LOD0. |
| **Exporter** (Blender 4.x/5.x glTF) | Format **glTF Binary**; Include: Selected Objects (character + armature), **Custom Properties on**; Transform **+Y Up on**; Data → Mesh: **Apply Modifiers on, UVs on, Normals on, Tangents on**, Vertex Colors off (unless you use them), Loose Edges/Points off; Material: Export, Images **Automatic** (or JPEG for the base colour); Shape Keys **off**; Skinning **on**, Include All Bone Influences **off**; Armature: **Export Deformation Bones Only on**; Animation **on**, mode **Actions** (or NLA Tracks), Always Sample Animations on, Optimize Animation Size on; Compression (Draco) **off**. |
| **Build** | `tools/build.js` packs hero files (skin + embedded images) with `gltfpack -kn -ke -km -vt 14` after copying every node and mesh name into the primitives' `extras.burns_name` (gltfpack drops skinned-mesh names and merges same-valued materials; `tools/hero_glb.js`), then gzips. Other models are packed exactly as before. |

## 7. Missions

Define missions in `def.missions`. Each mission is `{id, name, short, desc, hint, type, …}`:

| Field | Meaning |
|---|---|
| `type` | `reach, find, collect, talk, defeat, race, stealth, escort, ride, climb, boss, custom` (table below). |
| `start` | `'manual'` (default; you call `g.missions.start(id)`, usually from a `talk` handler), `'auto'` (starts when available), `'trigger'` (you start it from `api.trigger`), or `'board'` (accepted from the quest board, §7.1). |
| `giver` | Actor id. It shows `'!'` while the mission is available. |
| `requires` | `[missionIds]`. The mission stays `locked` until these are done. `'17:arrive'` means mission `arrive` finished in world 17 (any world: its Burn Token, or its saved done state). |
| `unlock(g, m)` | Optional extra condition: the mission opens only when this returns true as well. It is checked whenever missions refresh: at the start of a visit, after any mission completes, and in the city when Brady comes back from a place. |
| `token` | Default `true`, which makes it a Burn Token. `false` makes it a side mission (saved in `Save.data.burns.missions`). |
| `tokenAt` | `{x,y,z}` where the token pickup spawns. The default is in front of Brady. `tokenDirect: true` awards it instantly (bosses). |
| `target` | `{x, z, r, y}` for reach, race, stealth, ride and climb (`y` = minimum height for climb). For `talk`, an actor id. |
| `count` | For collect, defeat and custom progress. The HUD shows `n/count`. |
| `time` | Seconds limit; the mission fails when it runs out. Used for races. |
| `tag` | For `defeat`: only actors with that `tag` count. |
| `vehicle` | For `ride`: `'bike'` or `'car'`. |
| `companion` | For `escort`: the actor id that must reach `target`. |
| `marker` | `{x, z}` for the minimap and What Where When. |
| `guide` | Where the **guide arrow** points while this mission is active (§10.1): a point `{x, z, label}`, `[x, z]`, an actor id, an array of those, or `(g, m) => …` returning one of them (`null` = nothing to go to, `undefined` = the engine's default). At runtime you can also set `m.data.guide`. Only needed when the default (target, nearest pickup or enemy, `marker`) points at the wrong place. |
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
| `reach` | Brady enters `target`, or (open worlds) the region named by `region` (§19.3). |
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
- **E-bike** (key item `ebike`, earned in the city after World 8, §19.7): in **open worlds** (`def.open`) the BIKE button summons it instead of the yellow bike (settings **CITY BIKE** switches back). 18 m/s, accel 10; a dark frame, a battery with light strips, glowing rims, a hub motor and a headlight (`BurnsEBikeModel`, `41_burns_nav.js`, same five bones as the yellow bike: one draw call, its lights are sprites). Story worlds keep the yellow bike, so their races and `ride` missions stay tuned. Numbers: `BURNS_NAV.ebike`.
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
| `moon: [az, el]`, `moonK` | The moon. Its lit side faces the sun, so put the sun below the horizon roughly opposite the moon for a full moon (the built-in night, dusk and dawn palettes do). |
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
- **Materials (PBR-lite).** The gloss bits (`m.shine(0..3)`) are roughness: 0 matte (fabric, wood, skin, canvas), 1 satin, 2 paint/plastic, 3 glass and chrome (real sky reflections). Sun specular is GGX, with fresnel on everything and rim light on characters. On WebGL2 HDR tiers (`env: true`, all but `low`) the renderer draws the sky into a small equirect **sky probe** every frame (`R.probe`, 256×128 with mips), so chrome (gloss 3) mirrors the real sunset, clouds, stars and city glow, clear-coat paint (gloss 2) gets a sharp fresnel reflection, and satin gets a blurred one. Atlas patterns (wood, denim, canvas, fur, sequins…) are **bump-mapped** automatically from their own shading, plain matte clothing gets soft procedural folds and a fine weave up close, and the playa's cracked mud has real depth with natural variation (smooth dust drifts, colour patches, grit).
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
- `g.playerBubble(text, s)`, `a.say(text, s)` (speech bubbles over heads). NPCs' random chatter (`def.chat` / type lines) holds while a dialogue box is open, during cutscenes and during modal minigames, and a chatter bubble already up hides then; lines you give with `a.say` always show.
- **Minigames that own the screen:** set `g.modal = 'yourGame'` while it runs (clear it after) to hold the chatter; `g.modalOn()` is true then, during a DJ set and during a W5–7 rhythm round. `g.hideTracker = true` hides the mission tracker pill at the top (your panel can use that space).
- **Colour trip:** set `g.colorTrip` (0..1) for the LSD-style colour rotation while you need it (0 turns it off), or set `env.trip` in `def.env`. The engine shows the strongest of yours and the power-up's.
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

### 10.1 Getting around: guide arrow, map page, RUN, camera behind Brady (`41_burns_nav.js`)

**Speeds (m/s):** walk (stick part-way) 2–4, jog (stick fully pushed, the old top speed) 7.6, **RUN 10.6**, yellow bike 12.5, **e-bike 18**.

**The guide arrow.** A pause-menu toggle (**GUIDE ARROW**, also in SETTINGS; saved as `settings.guide`, off by default). When it's on, a glowing arrow lies on the ground just in front of Brady pointing at the current objective, with its name and distance under it; a pin and the distance float over the spot when it's on screen, and the spot itself gets a ring and a thin beam of light. It hides when there's nothing to go to, and shrinks to a ring when Brady is there. It costs no draw calls (sprites).
- **What it points at.** `def.guide(g)` if your world has one (or `BurnsNav.guides[worldId] = fn` from another file), returning the targets best first: a point `{x, z, y, label, col}`, `[x, z]`, an actor or actor id, or an array of them. Return `null` for "nothing to go to", `undefined` for the default.
- **The default** (`BurnsNav.defaultTargets`): a Burn Token lying on the ground nearby; then the tracked mission, the other active main missions, and active side quests. For each mission: its `guide` field (§7) or `m.data.guide`, a `talk` target, the actor carrying its `?` (`m.data.marker`), the nearest untaken pickup for `collect`/`find`, the nearest enemy (with `tag`) for `defeat`, the companion if an `escort` buddy is far behind, `target`, `marker`, and last the giver. With nothing active, it shows the nearest `'!'` giver of a main mission.
- **Read it:** `g.navGuide` (`{x, z, label, dist, yaw}`; null when off or nothing), `g.navTargets` (all highlighted spots), `g.navArrow` (where the ground arrow is). Targets refresh four times a second; the bearing updates every step.
- **Wiring a world:** give a `custom` mission a `guide` when its `marker` is only where it started (a fetch, a chase, a "go back to X"). Set `m.data.guide` as the steps change.

**The map page.** A world with `def.cityMap` gets a full-screen map in the pause menu (its MAP button): the world's own drawing, labels placed most important first without overlapping, the guide's targets as pulsing rings, and Brady as an arrow pointing the way he faces. Buttons: **ZOOM IN** (around Brady) / **WHOLE CITY**, **GUIDE ARROW**, **FAST TRAVEL** (the hub travel map).
```js
def.cityMap = { title: 'Black Rock City', bounds: { x0, x1, z0, z1 }, legend: '…',
  draw(g, ctx, P, sc, t) { /* P(x, z) -> [px, py]; sc = px per metre */ },
  labels(g) { return [{ x, z, text, col, pri, mark: 'dot' | 'diamond' | 'square' }]; } };
```
`g._cityMap` holds what was drawn (`brady: {x, y, rot}`, `targets`) for tests. +x is right and +z is down (6:00 at the bottom).

**RUN.** A round **RUN** button left of BIKE (touch): tap it and Brady runs (x1.4, `BURNS_NAV.runMul`) until he stops for a moment, mounts a vehicle or a cutscene starts; it lights up while on. **Shift** runs while held (it stays ACTION in menus and other apps). `g.running` is true while he runs; the player's `runK` multiplies his speed.

**Camera behind Brady.** Setting **CAMERA BEHIND BRADY** (`settings.follow`, off by default): the camera turns to sit behind the way Brady faces (or his vehicle) on its own, so CAM is never needed. It turns faster the more he heads away from the camera (running sideways makes a wide, slow turn, not a spin; running at the camera holds it), settles behind him half a second after he stops, waits a second after you orbit by hand, and holds still in dialogue. Cutscene cameras, boss framing, CAM recentering and first person (where his body already follows the look) come first.

## 11. Cutscenes

`g.cutscene([...steps], done)` runs steps in order with letterbox bars. The player can **SKIP** at any time. Skipping runs the remaining `do` steps, so put state changes in `do` steps and story stays consistent.

| Step | Effect |
|---|---|
| `{ cam: {x,y,z, tx,ty,tz, fov} }` | Cut the camera. |
| `{ cam: {from, to, dur, ease, hold} }` | Move the camera between two cameras. |
| `{ say: [who, lines], frame }` | Dialogue; waits for taps. When the cutscene has no camera of its own, the camera eases to a 3/4 front shot of the speaker's face above the dialogue box (never in first-person view). `frame: false` keeps the gameplay camera; `frame: true` frames even over an authored camera. Per cutscene: `g.cutscene(steps, done, { framing: true \| false })`; per world: `def.dialogFraming`. An authored camera (and its fov) is never changed otherwise. |
| `{ wait: secs }` | Pause. |
| `{ do: g => … }` | Instant code. It still runs when the scene is skipped; add `noSkip: true` to skip it on SKIP. |
| `{ until: g => bool }` | Advance when true. Called every step, so animate things here. |
| `{ move: {actor, x, z, speed, anim} }` | Walk an actor to a spot. |
| `{ banner: [title, sub, opts] }`, `{ music }`, `{ sfx }` | Titles and audio. |
| `{ fade: 'out'|'in', dur }`, `{ letterbox: false }` | Fades and letterbox control. |
| `{ parallel: [steps…] }` | Run steps together; the block ends when they all have. A camera step inside it (`cam`, `dolly`, `crane`, `orbit`, `track`) drives the cutscene's camera and starts from the current shot, and `letterbox`, `dof` and `slowmo` inside it apply too. |
| `{ dolly: {from, to, dur, ease} }`, `{ crane: … }` | Same as a `cam` tween; use the names for readability. |
| `{ orbit: {x, y, z \| actor, r \| r0+r1, h \| h0+h1, a0, a1, ty, dur, fov, ease, hold} }` | Circle a point or an actor (`'brady'` or an id), optionally pushing in (`r0`→`r1`) and rising (`h0`→`h1`). Angles are yaw in radians. |
| `{ track: {actor, dist, h, side, ty, fov, dur, k} }` | Follow an actor from behind (`side` swings around them), smoothed. Good for walks and chases. |
| `{ slowmo: 0.3, dur }` | Slow the world (not the camera) for `dur` seconds, or until `{ slowmo: 1 }`. |
| `{ dof: {focus, aperture} \| false \| 'auto' }` | Depth of field. Cutscenes focus on the camera's target automatically; set a focus distance in metres, or turn it off. The medium tier (phones) renders no depth of field at all (`BURNS_GFX.tiers.medium.dof: false`), high and ultra do. |
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

**The model** (`BurnsManModel`, `src/40_burns_e_props.js`): the classic lattice Man, one model for every Man in both games (the city landmark, all the bosses, the title screen, Art Cart's driver, portrait and Burn Night landmark). Open timber trusses with crossed bracing on the shared 16-bone rig (legs apart: the knee and ankle offsets splay outward), a faceted lantern head, neon tubes along the front edges of every limb and a heart in the chest. About 5.7k triangles, one draw call.
- **Rainbow neon.** The tubes are white emissive vertices (`'#ffffff', 1`), the lantern core is white at 0.75 and the heart is red; `geo.rainbow = { bone, at }` (the heart) tells `R.skin()` to set `uRain` for that one draw, and the skinned fragment shader colours them: a rainbow whose hue travels outward from the heart (one full cycle in about 14 s at any point), a soft bright band passing every ~4 s and a slow breath, so nothing flashes (all well under 3 Hz); the heart beats about once a second. By day (`uExp.z`, the renderer's night factor) the tubes are unlit grey glass and the heart is red paint. No mesh rebuilds, no extra draw calls.
- **Hurt cue.** `BurnsManBoss` sets `geo.rainHurt`: the neon turns red when he's hit and throbs red while he's stunned (on top of the heart sprite above his head).
- **Light.** `BurnsManModel.light(g, x, y, z, scale)` queues one point light in the current neon colour at night (the city and World 10 call it from `env`); like every point light it only wins a slot when the camera is near.

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
  flags:{'w:key':value}, seenIntro, lastWorld, checkpoint:{w:cpId}, settings:{camSens, invertY, autoCam, cam, gfx, guide, follow, ride},
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
- **Textures.** One atlas (2048×4096, with 64 face slots and 23 extra pattern slots), one sprite sheet, and per-world ground paint (≤2048²) and lightmap (≤1024²). Don't add per-world textures. The atlas's sign area has two pages per world, so camp-heavy worlds keep fitting; open worlds recycle their tiles' signs (§6.2).
- **Resolution.** The engine caps DPR at 2 and drops resolution automatically (down to 50%) when frames run slow. Never fight it.
- **Shadows cost a second pass.** The shadow map redraws every static chunk near the camera, every vehicle group, and every character within about 42 m. Keep giant merged meshes out of the camera's way, and give background rows of props `m.lo` detail. On phones the `medium` tier uses a 1024² map and no SSAO. Test your heaviest view with `BurnsGL.configure('high')` and with `'medium'`.
- **Textured heroes** (§6.12): 3 draws and 25–35 k triangles each at LOD0 (plus the same draws in the shadow pass), 1 draw and ~3–4 k at LOD2; 35 MB of textures on high and 19 MB on medium per hero. Plan scenes for at most two heroes close up.
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
4. Navigation (guide arrow, map page, RUN, follow camera, e-bike, saved settings): `node tools/burns_nav_test.js` (exits 1 on failure).
5. Checklist:
   - Zero page errors (`page.on('pageerror')` and `window.__bradyErrors`).
   - Every token mission can be completed.
   - Three photos are reachable.
   - The boss can be beaten.
   - `finishWorld` unlocks the next world.
   - Both orientations work.
   - Pause, quit to title and back all work.
   - Saves survive a reload.
   - Draw count is about 120 or less (`D.state().draws`).
6. Reference tests (World 1, written for the engine) are in `/tmp/claude-0/-home-user-brady-o/55338a3e-dd1f-51fb-b998-1b26dc729d6a/scratchpad/burns/`, if that folder is still there. Copy their patterns:
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

---

## 19. The open world (Black Rock City, world 500)

`src/42_burns_ow_city.js` registers **world 500** (`open: true`), a stylised Black Rock City; `src/42_burns_ow_life.js` adds its people, missions, mini-games, the city map and the quest hook for other worlds (§19.6). Its parts:
- **The city:** the arc from 2:00 to 10:00 around the Man; the Esplanade (r 300 m) and six lettered streets (Arcade, Bonfire, Carousel, Dreamer, Ember, Firefly, every 45 m); radial streets every half hour; plazas at 3:00 and 9:00 & Bonfire.
- **Center Camp and the camps:** Center Camp at 6:00, and the big sound camps along the Esplanade (Root Society at 2:00, Opulent Temple at 10:00…).
- **Around the city:** the Temple toward 12:00, big art on the open and deep playa, the trash fence (a pentagon), Gate Road, the airport and Hell Station.
- **The layout:** the Man is at (0, 0); 6:00 points to +Z, 12:00 to −Z and 3:00 to +X. `BURNS_OW.at(hour, r)` returns the point at clock `hour` and radius `r`.

The title's CONTINUE (and START, after the prologue) goes straight into the city, at the spot Brady was last time.

### 19.1 Streaming tiles (`def.tiles`)
```js
tiles: {
  size: 160, load: 300, free: 480,   // tile edge; build tiles whose edge is within `load` m of Brady, free them past `free` m
  budget: 3.5, prime: 120,           // ms of building per frame; tiles built before the first frame (around the spawn)
  *build(api, g, tile) {             // the ordinary api; yield between pieces to spread the work over frames
    for (const block of myBlocksIn(tile)) { fill(api, block); yield; }
  },
  onLoad(g, tile), onFree(g, tile),  // optional
  region: (x, z) => 'name', onRegion(g, name, prev)
}
```
A tile owns everything its builder makes:
- static chunks and colliders, and the signs it painted (§6.2: recycled when no live tile uses them);
- instanced props and crowd extras (§4.8);
- glows, beams, fires, flame jets, mud and light pools (the lightmap is repainted and uploaded just for that area);
- drivable vehicles, actors from `api.npc`, movers and their groups;
- ACTION prompts, LSD-ghost geometry and instanced props.

All of it is freed together. Updaters, triggers, markers, checkpoints and pickups stay world-wide, so build those in `def.build` (which still runs once, before the tiles). New signs are uploaded as small atlas regions, so tiles can add them mid-game without a hitch. `g.tiles` is the streamer: `readyCount()`, `prime(x, z, R)` (build now: after a teleport) and `stats` (`built`, `freed`, `worst` ms).

### 19.2 Places: entering a world from the city (`BurnsOpen`)
- `BurnsOpen.enter(g, worldId, { back: {x, y, z, yaw}, place: 'the Temple' })` plays any world as a **sub-world**. The city stays built (frozen) behind it, and its sign atlas pages are saved.
- When the sub-world finishes, it shows its results and the story card for the next day, then `BurnsOpen.leave(sub, 'done')` drops Brady back at `back`. Leaving from its pause menu (**LEAVE …**) does the same with `'leave'`.
- Story worlds don't change at all to become places. Their `finishWorld()` and the pause menu do the right thing when they were entered.
- `g.parentScene` is the city while you're inside; `BurnsOpen.root()` returns it from anywhere.

World 500 turns the 17 story worlds into places (`BURNS_OW.PLACES`), each with a door, a set piece and an `ENTER: …` prompt:

| Place | World |
|---|---|
| Gate Road | 1 |
| the Red Light RV by Center Camp | 2 |
| Rhythm Wave | 16 |
| Root Society, Brady's tipi (HOME) | 17 |
| the costume camp | 3 |
| the Orgy Dome | 4 |
| Costco Soul Trading | 5 |
| deep playa | 6 |
| the sound camps | 11 |
| the heart car | 7 |
| Hell Station | 8 |
| the storm | 9 |
| the Temple | 12 |
| the workshops | 13 |
| the airport | 14 |
| the Man | 10 |
| Gate Road out | 15 |

- **Story order:** the next unfinished world's place has a tall beacon of light and a HUD arrow with its distance. Finished places stay open, and later ones answer "Not yet."
- **Time of day:** the city follows the story day (the next place's sky) and shows the day card when the day changes.
- **The pause menu:** its **MAP** opens the city map page (§10.1, `def.cityMap` in `42_burns_ow_nav.js`), whose **FAST TRAVEL** button is the hub map in fast-travel mode (`TRAVEL HERE`, and HOME warps to the tipi). The map is the real city: `def.mapDraw(g, ctx, M, t)` draws the fence, the arc of streets, the camps, the Man, the Temple and a YOU marker, and `def.mapProject(g, worldId, M)` puts each place's pin where its door is (`M` is the map rectangle). On this map the pins are smaller, and only the chosen one and the open ones show their day.

### 19.3 Regions and saves
- **Regions:** `tiles.region(x, z)` names where Brady is, for example `'4:30 & Carousel'`, `'Center Camp'`, `'Deep Playa'` or `'Outside the Fence'`. Entering a new region sets `g.region`, saves the flag `region:<name>`, sends the mission event `region` (so `{ type: 'reach', region: 'The Temple' }` completes there) and shows a toast.
- **Position:** the city saves Brady's spot every few seconds and on entering a place (`sv.ow`). CONTINUE resumes there; a world passes its own `opts.spawn` to the engine for this.

### 19.4 The streets, and things to do in the city
- **Street fronts:** every block's edges are lots about 14 m wide that face the street: a theme camp's front (a tinted shade with LED edges and a lounge, a bar or a dance corner, a sign, a flag), an RV with an awning, a lit or plain dome, an art piece (a totem or a giant flower, sometimes a fire barrel), or tents. Most lots have a run of string lights on the curb, parked bikes, people hanging out (instanced crowds) and a pool of coloured light for the night. RVs, tents and hexayurts fill the middle of the block.
- **Street signs:** a pole with two crossed blades at every intersection, the street's name over the radial's time, so `'4:30 & Carousel'` reads from both streets (24 shared blade textures for the whole city). The HUD toast and `g.region` give the same address.
- **Day and night:** dust clouds roll down the streets with the wind by day (and gusts kick up dust around Brady); at night the string lights, LED strips, lit domes, fire barrels and the light pools make the neighbourhoods glow, and the art cars circling the Man leave light trails.
- **DJ sets:** every theme-camp booth has a **PLAY A SET** prompt (`BurnsCamps` with `djPrompt: true`, the shared `BurnsDJ` minigame).
- **The Thunderdome (repeatable):** talk to Auntie Thunder at the 9:00 & Bonfire dome. It's World 11's bungee bout (`BW11Dome`: bounce, kick off the lattice, swing the foam bat, first to three bonks) against the dome's own bungee fighter, with the MC and the spectators cheering. If World 11's code isn't in a build, it falls back to three foam-bat rounds on the floor.
- **The art-car race (repeatable):** talk to Racer Rae by the 6:00 promenade, take the green art car (it's quicker) and drive through ten glowing gates around the Man in under 1:40. The clock starts at the first gate, the best time is saved, and the race ends if you leave the car for 8 s.
- **Art cars:** two you can **DRIVE**, parked on the open playa by the 6:00 and 3:00 promenades (`api.artCar`). Three more circle the Man, and you can jump on and ride along. While you drive, the camera looks past your own car.
- **Big art:** climbable pieces with summit views on the open and deep playa (`BurnsBigArt`).
- **Missions from people in the city** (side quests, all in the pause menu's SIDE QUESTS):

| Mission | Giver | What you do | Reward |
|---|---|---|---|
| Quiet Time | Sage, Center Camp | reach the Temple (`reach` with `region`) | glow |
| The Lost Lantern | a lamplighter, Esplanade | find the lantern by the galleon | glow |
| Cold Delivery | Frosty, Center Camp | carry a bag of ice to Melty at 8:00 & Dreamer (backpack item) | glow, a pancake |
| Lost and Found | Lou, 3:00 plaza | find a fuzzy hat, a tutu and one sock in the streets | the tutu costume |
| Playa Paparazzi | Flash, 4:30 & Esplanade | take photos at the Man, the galleon and the rocket (ACTION) | glow |
| Dome Raising | Bolt, 7:00 & Bonfire | bring back four dome struts | grilled cheese ×2, glow |
| First Burn | Nell (lost first-timer) | walk her home to 2:30 & Firefly (`escort`) | glow |
| Stop, Bike Thief! | Rudy, 5:30 & Carousel | catch the thief near 5:00 & Ember (he runs) | glow, water |
| Round the Man | Racer Rae | win the art-car race | glow |
| Two Burners Enter | Auntie Thunder | win a Thunderdome bout | glow |

- **Glow sticks** along the Esplanade.

### 19.5 Performance
- **Neighbourhoods:** RVs, campers, buses, hexayurts, tents, domes, shade, camp fronts, string lights, bikes, flags, porta-potties and lamp posts are instanced, most from one near-white prototype tinted per copy. There are about 1,500–2,500 copies around Brady. Two cheap stand-ins per block show the far city past 240 m, out to 1.4 km.
- **People:** about 1,500 crowd extras live in the loaded tiles; the busiest street views draw about 120 of them in 15–25 batches and 80–110k triangles. Talkable neighbours (real actors) are one or two at some camps.
- **Landmarks:** the theme camps use their own `lod: 'auto'` (a silhouette beyond about 150 m), and big art and the Man are built once.
- **Measured views:** busy street level at night 102–126 draws and 280–400k triangles on high (medium: 102–115 draws); the Thunderdome bout about 110 draws, the race about 60. Tile builds yield a street front at a time: in the software renderer the 95th-percentile step is about 5 ms and the worst about 8 ms. A finished tile's people join three per frame.
- **Fog and lights:** the world thins its fog (`def.env`) so the city reads across the playa, and thins it more for high cameras. `def.glowDist` (520 m here; 170 by default) lets the camps' lights show from afar at night.

### 19.7 Getting around the city (`42_burns_ow_nav.js`)
- **The guide in the city** (`def.guide`): a Burn Token on the ground, the tracked quest and other active quests (city quests have their own spots: Melty, the nearest photo spot, the next race gate or the art car, Auntie Thunder; quests from other worlds without a spot use the address in their `hint`, via `BurnsOW.hintSpot`), then the next story place. While the guide arrow is on, it replaces the city's yellow story arrow.
- **The map page** labels the Man, the Temple, Center Camp, HOME (Root Society), the next story place and the finished ones, the theme camps and the big art, with the clock times round the city.
- **The e-bike:** after World 8 (Hell Station) **Volta** at Hell Station's door offers **Juice Box**: carry the flat battery to the **Solar Juice Bar** on the 3:00 plaza and press **CHARGE**. The reward is the `ebike` key item. Change the world, the giver's place or the charger in `BURNS_OW_EBIKE`.

### 19.6 Your world's quests in the city (`BurnsOW.addQuests`)
Any world can put quest givers, targets and mechanics in Black Rock City. The quests then run in world 500 like the city's own: in its SIDE QUESTS list, with the `!` markers, the tracker and rewards. Call `BurnsOW.addQuests` when your file loads (every `42_burns_w*` file loads after the city files):
```js
if (typeof BurnsOW !== 'undefined') BurnsOW.addQuests({
  from: 17,
  spots: { 'The Glide': '3:30 & Carousel', 'DUST FM': '8:30 & Dreamer' },   // your own named places
  missions: [
    { id: 'w17c_skate', name: 'The Glide', short: 'Hit all 8 rings', type: 'custom', giver: 'w17c_granny', start: 'manual',
      requires: ['17:neighbors'],                   // a mission done in world 17 (or ids of world 500's missions)
      unlock: g => BurnsOW.questDone('w17c_tea'),   // optional extra condition of your own
      desc: '…', hint: 'The Glide, 3:30 & Carousel', count: 8, reward: [{ glow: 25 }],
      onUpdate(g, m, dt) { /* your mechanic */ }, onComplete(g) { /* … */ } }
  ],
  people: [
    { id: 'w17c_granny', at: 'The Glide', type: 'burner', seed: 2, name: 'GRANNY GRIP', yaw: 0,
      quest: 'w17c_skate', offer: ['You walk? Every day? With your FEET?'], thanks: ['Keep the skates.'] },
    { id: 'w17c_kev', at: 'DUST FM', type: 'burner', seed: 9, name: 'KOMBUCHA KEV', talk(g, a) { /* your own talk */ },
      when: g => !BurnsOW.questDone('w17c_radio') }
  ],
  pickups: [{ kind: 'glowstick', at: '3:45 & Carousel', mission: 'w17c_skate', label: 'RING' }],
  build(api, g) { /* anything else, with the ordinary api: a rink, an antenna, triggers, ACTION prompts */ },
  update(g, dt) {}, drawSprites(g, R) {}, drawHUD(ctx, g, W, H, S) {}   // optional, every frame in the city
});
```
- **Addresses** (`at`, `spots` and `BURNS_OW.address(a)`, which returns `[x, z]`): `'4:30 & Carousel'` (or `'4:30 & C'`: just on the city side of that street), `'9:00 Plaza'`, a story place (`'The Heart Car'`, `'the Temple'`), a theme camp's entrance (`'The Deep End'`, `'Thunderdome'`, `'Center Camp'`), `'The Man'`, `'The Temple'`, one of your `spots`, or `[x, z]`.
- **Missions** are ordinary missions (§7) pushed into world 500. Prefix their ids (`'w17c_…'`); a taken id is skipped with a warning. Side quests default to no Burn Token. When one finishes, the save flag `500:q:<id>` is set, so `BurnsOW.questDone(id)` is true anywhere in the game (your world can react to it), and your own `onComplete` still runs.
- **People** are `api.npc` definitions placed at an address. With `quest`, they get the standard talk: the offer (`offer` lines, then the mission starts and is tracked), a reminder with its `hint` while it's active, then `thanks`. Give `talk(g, actor)` to do your own. `when(g)` false leaves them out of this visit.
- **Pickups** appear only while their mission is active (`gate: false` keeps them always).
- **Hooks:** `build` runs once when the city builds (after its own people); `update`, `drawSprites` and `drawHUD` run every frame in the city. Each is guarded: an error is logged once and the city carries on.
- **Places in the city:** the heart car (W7's place, about 1:30 and 205 m out on the open playa), the Deep End (3:15 on the Esplanade), Center Camp (6:00), the Thunderdome (9:00 & Bonfire) and every story place already exist. Name a new one with `spots` and build it in `build`.
- `BURNS_OW.at(hour, r)` and `BURNS_OW.RINGS` (the Esplanade, then A to F) help place things; `BURNS_OW.region(x, z)` names any spot.
