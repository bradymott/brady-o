# BRADY-O BURNS: World Authoring Guide

This guide is for agents building Worlds 2–13 of **Brady-O Burns**, the 3D third-person adventure inside Brady-O. The engine and World 1 are already done. You add a world by creating one file, `src/4N_burns_worldN.js`, that calls `BurnsWorlds.register({...})`. You shouldn't need to touch the engine. If you hit a real gap, add the smallest possible hook to the engine and say so in your report.

- Engine: `src/40_burns_a_core.js` … `src/40_burns_k_hub.js`
- Worked example: `src/42_burns_world1.js` (World 1, "The Line")
- Entry point: `new BurnsHubScene()` (the title menu's BRADY-O BURNS card)

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
| `id` | number 1–13 | Required. Matches `BURNS_WORLD_META` (hub name, colour and pin position). The id is permanent; the "World N" players see is its place in the play order (§3.1). |
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

### 3.1 Play order (13 worlds)

Worlds are played in this order, by **id**. It's `BURNS_WORLD_ORDER`, also available as `BurnsWorlds.order`:

| Position (shown as "World N") | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| World id | 1 | 2 | 3 | 4 | 5 | 6 | **11** Sound Camp Crawl | 7 | 8 | 9 | **12** The Temple | **13** The Workshops | 10 (finale) |

- **Ids never change.** Files (`src/42_burns_world11.js` …), saves, tokens, photos, flags and `debug.play(id)` all use the id. Only what players see uses the position.
- **Unlocking.** `g.finishWorld()` unlocks `BurnsWorlds.next(id)`, the next world in the order (finishing id 6 unlocks id 11, not 7). Old saves migrate automatically: any finished world unlocks the next one in the sequence.
- **Labels.** Never print `'World ' + id`. Use `BurnsWorlds.label(id)` → `"World 7"` for id 11, or `BurnsWorlds.num(id)` → `7`. Lookups: `BurnsWorlds.idAt(n)`, `next(id)`, `prev(id)`, `isFinale(id)` (true for id 10). The hub, loading card, pause menu and results screen already do this.
- **Hub.** It shows 13 pins in play order. Unregistered ids show "SOON"/"Coming soon" and can't be started, so nothing breaks while a world is in progress.
- Story order matters for continuity. World 11 comes after the art-car hunt (6) and before Sunrise Set (7). Worlds 12 and 13 come after the Deep Playa showdown (9) and before the finale (10).

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
  - `api.lathe(x, y, z, profile, colour, {seg, colScale})`: any surface of revolution. `profile` is `[[radius, height, colour?, emissive?], …]` from bottom to top; start or end at radius 0 to close it, and **repeat a point** to get a crisp rim. Vases, lamps, totems, onion domes, mushrooms, trophies, bottles. Cylinder collider of the widest radius × `colScale` (0.9).
  - `api.torus(x, y, z, R, r, colour, {pitch, roll})`: ring or hoop (`pitch: Math.PI/2` stands it up like a wheel). No collider.
- `api.mesh(x, z, m => { …; return {cols, lights}; }, {y, yaw, scale})`: custom geometry with `BurnsMesh` (§6) in local space. Return colliders and lights in **local** coordinates and they're transformed for you.
- `api.collider(desc)`: a raw collider in world coordinates (§4.6).
- `api.sign(text, x, z, {yaw, h, y, post, maxW, style: {bg, fg, size, border, glow, font}, glow})`: a signboard with real text. `\n` makes lines.
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
  - `'bag:<power>'`: power-up baggie: `molly | khole | powder | lsd | shrooms | weed | bufo | liquor | water`.
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

All props face +Z (front) and sit on the ground at their origin. Every prop accepts `x, y, z, yaw, scale, seed`, and `cover: true|false` overrides its colliders' cover flag.

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
| `dome` | geodesic dome, walkable | `r, col, alt, freq, lights, glow` |
| `scaffold` | climbable tower, alternating platforms | `levels, lh, w, d` |
| `sign` | see `api.sign` | `text, h, y, post, style, glow` |
| `campFlag` | (used by checkpoints) | `col` |
| `trampoline` | spring pad | `r, power, col` |
| `artcar` | generic mutant vehicle with a deck, sculpture, poofers | `len, w, col, sculpt` |
| `saucer` | flying-saucer platform for the final Man fight, walkable | `r, h` |

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
  - `lathe(profile, {seg, sx, sz, theta0, theta1, rMod(theta, t), uv, uvRepeat, caps})`: surface of revolution around local **Y** at the current transform: `m.push(); m.tf(x, y, z); m.lathe([[0, 0], [0.5, 0.1], [0.4, 1], [0, 1.1]]); m.pop();`. Profile rows are `[radius, y, colour?, emissive?]`; repeat a row for a hard crease. `sx`/`sz` squash the section into an oval (car bodies, tubs, boats); `rMod(theta, t)` returns a per-vertex radius scale (lumpy rocks, petals).
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

### 6.3 Actors (NPCs and enemies)
`api.npc(def)` / `api.enemy(def)`:

| Field | Meaning |
|---|---|
| `type` | `burner, furcoat, tutu, ledsuit, greeter, gate, campLead, driver, ranger, dpw, techbro, sparklepony, influencer, crusty, chinka, brady`. This sets the outfit, face and prop. |
| `seed` | Varies skin, hair and colours within a type. Use different seeds for variety. |
| `id`, `name` | `id` for lookups (`g.actor(id)`) and mission givers; `name` shows in the dialogue box. |
| `x, z, y, yaw` | Placement. `y` defaults to the ground. Add `fixedY: true` for NPCs on roofs or vehicles. |
| `behavior` | §6.4. Default `idle`. |
| `lines` | Dialogue when talked to (ACTION nearby). |
| `talk(g, a)` | Custom talk handler that replaces `lines`. Starts missions, gives items. |
| `gift` | `{kind:'glowstick', n}`, `{kind:'water'}`, `{kind:'<power>'}` or `{kind:'item', item:'map'}`. Given once, after `lines`. Gifting culture! |
| `chat` | Ambient bubble lines said when Brady walks by. They default to per-type lines. `chatter:false` silences them. |
| `hp`, `damage`, `drop` | Enemies: hit points, contact damage, glow sticks dropped. |
| `tag` | Matches `defeat` missions with `tag`. |
| `onDefeat(g,a)`, `onHurt(g,a)`, `onWake(g,a)`, `onSpot(g,a)` | Hooks. |
| `afterDefeat` | Behaviour after defeat: `chill` (default), `dance`, `sleep`… Enemies are never killed. They chill out, sit down, or dance. |
| `marker(g,a)` | Return `'!'`, `'?'` or `null` to override the floating mission marker. |
| `spec`, `scale` | Fully custom look (§6.5) and size. |
| `noTalk`, `hittable`, `always`, `collide:false` | Misc: never talkable; friendly but can be spun; update even when far; no collision. |

The engine draws `'!'` over the `giver` of any available mission and `'?'` over active targets.

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

### 6.5 Custom looks (`spec`)
`BurnsRig.npcSpec(type, seed)` returns a spec you can modify, or you can write one from scratch:
```js
const spec = BurnsRig.npcSpec('burner', 3);
Object.assign(spec, {
  top: { kind: 'none' }, paint: 'tiedye',                  // shirtless + body paint
  bottom: { kind: 'kilt', col: '#2a2a34' },
  hat: { kind: 'tophat', col: '#1a1a1a' }, goggles: true, glasses: 'heart',
  acc: ['ledNecklace', 'cape'], prop: 'bell', key: 'w4:ringmaster'   // key: unique cache id
});
api.npc({ spec, x: 0, z: 0, name: 'RINGMASTER', lines: ['Step right up!'] });
```
Spec fields:
- Body and face:
  - `skin`, `hair: {style, col, hi}`. Styles: `short, long, pony, bald, mohawk, afro, buzz, bun, down, wavy, wig`.
  - `face`: `friendly, lashes, tired, stressed, greeter, beard, smug, chinka, stern, goofy, grumpy, sleepy, kid`.
  - `body: {h, w}`: height and width multipliers.
- Clothes:
  - `top: {kind: tee|tank|crop|hoodie|button|none, col, pattern}`
  - `bottom: {kind: jeans|shorts|leggings|kilt|tutu|cargo|chinos, col, pattern}`
  - `shoes: {kind: sneakers|boots|furboots, col, sole}`
  - `coat: {kind: fur|kimono|duster|pirate, col, trim}`
  - `vest: 'hivis'|'fleece'|'patches'` (with `vestCol`)
  - `led: '#colour'` (LED suit strips)
  - `paint: patternName`
- Headwear: `hat: {kind: cowboy|hardhat|cap|ranger|tophat|furhat|bandana|tricorn}`, `glasses: shades|clear|heart|visor`, `goggles: true`.
- Accessories: `acc: [ledNecklace, lei, wings, cape, toolbelt, headset, earbuds, bracelets]`.
- Held prop: `prop: clipboard|phone|bell|coffee|radio|ringlight|bottle|water`.

Brady is `BurnsRig.bradySpec(costume)`: it follows `Save.data.look` (bun or down, shades/clear/none, tattoos, stubble, hair and skin colours) plus the costume. Chinka is `BurnsRig.chinkaSpec()`.

### 6.6 Animation names
`idle, walk, run, jump, flip, fall, land, spin, pound, hurt, dance{style,bpm}, bike, drive{steer}, sit, sleep, victory, cheer, talk, wave, shuffle, yell, hug, charge, bell, phone, photo, clipboard, throw, climb, float, fly, captive, knocked`.
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
| `start` | `'manual'` (default; you call `g.missions.start(id)`, usually from a `talk` handler), `'auto'` (starts when available), or `'trigger'` (you start it from `api.trigger`). |
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
- State: `g.missions.start(id, quiet)`, `complete(id, tokenPos)`, `fail(id, why)`, `progress(id, add, total)`, `state(id)`, `isDone(id)`, `get(id)` (gives `.n`, `.data` and `.left`).
- `g.missions.event(name, data)` fires events. Engine events: `pickup, defeat, talk, spotted, pound, spring, mount, bell, flames, power`. Fire your own too, for example `g.missions.event('delivered', item)`.

**Fetch chains / deliver** are `custom` missions plus `talk` handlers:
```js
{ id: 'ice', name: 'Ice Ice Baby', type: 'custom', giver: 'pony', start: 'manual', desc: 'Get ice from the crusty with the cooler.' }
// pony.talk: if available -> start; if g.flag('hasIce') -> complete
// crusty.talk: if mission active -> g.flag('hasIce', true); g.toast('GOT ICE')
```
**Story beats.** `g.flag(key, value?)` stores per-world flags in the save.

**The What Where When guide** (`items.www`, given in W1) makes the mission list show everything, including locked and available missions with their `hint` locations, and puts every mission `marker` on the minimap. Write a useful `hint` for every mission.

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
- Give one directly with `g.player.givePower('bufo')`.
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
  - `ride` missions with `vehicle: 'car'` work out of the box.

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

- For dust storms and similar events, use `def.env(g, env)` per frame (W1's ticket gust adds `env.fogD`).
- **Light at night.** Use `api.light` pools under every camp, fire and lamp, `api.glow` for the sources themselves, emissive colours on neon geometry (`m.color(c, 1)`), and dynamic point lights from fires, which are automatic (up to 4 near Brady). Brief flashes can use `g.pointLight(x, y, z, radius, [r,g,b], intensity)` each frame.

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

During cutscenes Brady is locked. Use `g.player.animOverride = 'sit'` to pose him, and set it back to `null` when done.

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
  flags:{'w:key':value}, seenIntro, lastWorld, checkpoint:{w:cpId}, settings:{camSens, invertY, autoCam} }
```
- `BurnsSave.get()` returns the data (and creates or migrates it).
- Tokens and photos: `hasToken`, `addToken`, `tokenCount(w)`, `hasPhoto`, `addPhoto`, `photoCount(w)`.
- Items and worlds: `hasItem`, `addItem`, `unlockWorld`, `isUnlocked`, `setCostume`.
- Flags: `flag(w,k,v)`. Saves happen automatically on those calls; call `BurnsSave.save()` after editing `get()` directly.
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

- **Draw calls per frame: aim for 120 or fewer.** World 1 renders about 55–70.
  - Static props are merged per 48 m cell.
  - Vehicles, movers and pickups share skinned groups (about 40 per draw).
  - **Each visible character is one draw.** Keep **visible** NPCs to about 50: crowds far from the action are fine because the culling distance is 115 m, but don't put 200 dancers in one spot.
- **Vertices.** Static chunks are split automatically. W1 is about 300k triangles in view at most. Rounded primitives cost 3–6× a plain box, so use them where the camera gets close and use `m.lo` or plain `box` for background clutter. Characters switch to a low-detail model automatically beyond about 24 m.
- **CPU.** Actors farther than 110 m from Brady don't update. Keep `update` hooks O(n) over small lists; don't scan all colliders every step. Movers farther than 110 m skip collision.
- **Sprites.** Particles are capped at 2600; glow billboards are culled at 170 m. Emitters near the camera are cheap; don't emit every step from 50 places.
- **Textures.** One atlas (2048×1024), one sprite sheet, and per-world ground paint (≤2048²) and lightmap (≤1024²). Don't add per-world textures.
- **Resolution.** The engine caps DPR at 2 and drops resolution automatically (down to 50%) when frames run slow. Never fight it.
- **GPU memory.** Leaving a world frees its buffers (`BurnsScenes.releaseWorld`).

---

## 16. Testing your world

1. Build privately: `BRADY_DIST=$SCRATCH/dist node tools/build.js`.
2. Playwright (`require('playwright')`, `chromium.launch()`), viewports **874×402** and **402×874**, `deviceScaleFactor: 2, isMobile: true, hasTouch: true`. Headless WebGL renders in software (slow, so FPS there means nothing).
3. Use the debug API from `page.evaluate`:
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

---

## 18. Notes for the other worlds (story + engine hints)

| World | Story beat | Engine pieces to reach for |
|---|---|---|
| 2 Finding Camp | City at night. The Man shows up at Brady's camp (boss #2). Fire spinners and flame effects. | `sky: 'night'`, lots of `api.light`/`api.glow`, `flameJet` rings, fire-spinner NPCs (custom anim: `dance` style + fire sprites in `drawSprites`), `BurnsManBoss` with `['stomp','swipe','fire']`. |
| 3 Costume Cult & the Yellow Bike | Choose a costume; find the yellow community bike. | `g.giveItem('costumes')` + `BurnsSave.setCostume` + `player.rebuildModel()`; `g.giveItem('bike')`; `ride` missions; `bell` events. |
| 4 The Orgy Dome | Meet an informant while sneaking past creepy dudes. Comedic, nothing explicit. | `stealth` missions with `patrol` enemies (`view`, `fov`), `follow` behaviour for the informant, giant `dome` props with `api.mesh` interiors. |
| 5 Costco Soul Trading Co. | Giant gifting warehouse; a platonic burner buddy joins. | Shelves from `api.box`/`scaffold`; `deliver` chains (`custom` + `talk`); `follow` companion (`escort`). |
| 6 The Art Car Hunt | Commandeer a fire-breathing octopus art car, dodging tech bros. | `api.artCar({ build: yourOctopus })` with `poofers`, `pitcher` enemies, `ride` missions with `vehicle: 'car'`, `flames` events. |
| 11 Sound Camp Crawl (plays 7th) | Camp-to-camp crawl through the sound camps. | Crowds with `dance` (`k.bpm`), `api.light`/`api.glow` stages, the shared `BurnsDJ` decks minigame (its own file). |
| 7 Sunrise Set | Heart-topped sound car at dawn; sparkle ponies, influencers, crusty old burners. | `sky: 'night', sky2: 'dawn'` with `setTod`; `api.mover` for the sound car (or `artCar` with `path`); `flasher` influencers; crowds with `dance`. |
| 8 Hell Station | Fuel the art car; battle DPW. | `g.interactables` for fuel pumps; DPW `charger`/`chase` enemies; `mud`, `fire`; an `escort` or `ride` mission. |
| 9 Deep Playa Showdown | Fight the Man again; he escapes. | Open deep playa, `dust` up, `BurnsManBoss` with fireworks; end with his `flee` like W1. |
| 12 The Temple (plays 11th) | A quiet, beautiful wooden temple; the emotional calm before the end. | `api.lathe`/`api.roundBox` wood (pattern `wood`), soft `dawn`/`dusk` palette with `mid` band, gentle `float`/`climb` platforming. |
| 13 The Workshops (plays 12th) | Burner workshops: build something, break nothing. | `api.mover` machines and conveyors, `g.interactables`, `api.roundBox` benches and tools. |
| 10 The Man Pavilion | Ride in on the yellow bike, in costume, to the final fight. Phase 1 on the saucer, phase 2 giant (neon flash + cover, face fire, arm fireworks). | `api.prop('saucer')`, `man.y` on the deck, cover props on the deck; phase 2 tweens `man.scale`, music `man_giant`; `finishWorld(g => Game.setScene(…ending…))`. |

Have fun. Make it look like a modern mobile game, keep the jokes short, and test on both orientations.
