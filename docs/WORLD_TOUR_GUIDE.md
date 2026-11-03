# Super Brady-O World: how to add a country

Super Brady-O World is a trip around the world: 12 countries plus two secret lands. Each country is one file, `src/29_tour_<cc>.js`. That file registers the country's theme, enemies, set pieces, boss, music, signature power-up and its five levels.

Built so far: Mexico (`mx`), Ecuador (`ec`), Brazil (`br`), Mozambique (`mz`), Morocco (`ma`), Valencia (`es`), Paris (`fr`) and Amsterdam (`nl`), each in `src/29_tour_<cc>.js`. Copy their structure. Still to build: Bali, Vietnam, Japan, Nepal, Antarctica and World 22.

What each built country already uses, so yours can be different:

| Country | Layout styles | Signature item | Boss and how to beat it |
|---|---|---|---|
| Mexico | run, ride (boat), swim (cave), climb (rising lava), castle | Taco toss (stun) | El Gran Piñatón: spins into a wall, gets dizzy |
| Ecuador | run (low-gravity zones), ride (cable car), night (vine swings), swim (open sea, tidal surge), castle (ice) | Booby boots (high jumps, landing shockwave) | El Tortugón: shell too hard; stomp his head while he rears up |
| Brazil | run (beach), night (beat drums), climb (waterfall), run (wetland rides), castle (turntables) | Football (ricochets) | O Tucanão (flying): dives, beak sticks in the floor, stomp him |
| Paris | run, auto (river chase), night (rooftops), climb (tower), castle (mirrors) | Mime gloves (invisible walls) | Le Grand Soufflé: puffs up, then collapses |
| Mozambique | run (elephant water jets), auto (stampede), climb (baobab), night (turtle beach), castle (fortress) | Piri-piri chili (10 s of fire breath; burns brick "thorn hedges") | O Eremita (hermit crab): armoured in his shell; stomp him when he scuttles out |
| Morocco | run (souk rugs), run (Sahara caravan, sandstorm), climb (kasbah, goats in trees), night (night market smoke), castle (riad fountains) | Flying carpet (12 s of free flight) | Djinn of the Teapot (flying): his pot hops, lands and vents; stomp him then |
| Valencia | run (tomato trucks, pulp), swim (aquarium tunnels), night (City of Arts, beat floor lights), climb (giant falla, rockets), castle (silk exchange) | Tomato fight (lob; splats make enemies slide) | Paellasaurus: too hot while simmering; stomp when it cools (a tomato cools it at once) |
| Amsterdam | run (canal hooks, houseboats), run (windmill sails, tulips), auto (drawbridges, trams), night (frozen canals), castle (weigh house) | Dutch bike (fast; bell stuns) | Cheese King: teeters after flinging a wheel (or after the bike bell); stomp his crown |

Tricks the newer countries added (all inside the country file, no engine changes):
- **Your own liquid:** `LIQUIDS.<name> = [top, mid, deep, shimmer, glow|null, foam]` at the top of the file, then `liquid: '<name>'` in a theme. `T.LAVA` tiles in pits are drawn with it (and are still deadly).
- **Override a generic piece for your country:** a piece with a generic name (for example `cp`) wins over the generic one for your levels. Fall back with `return Tour.pieces.cp(st, o)` when the override does not apply (Ecuador's cable-car mid-station does this).
- **Beat blocks:** set `bpm` on the level spec, place them with `B.beat(x0, x1, y, group, kind)` and draw them with `beatArt.<kind>(ctx, k, on, warn, t)`.
- **Time-varying forces:** zones are plain data, so an entity can change its zone each frame (`EcSurge` flips a current back and forth). The validator sees the zone as placed.
- **Custom enemies:** subclass `TourEnemy`/`TourSwimmer` when a config is not enough (`EcPuffer` grows when Brady is near; `BrCoati` steals coins and gives them back when stomped).
- **Level options:** `roof: false` removes a castle's ceiling row; `dark: true` turns the lights down.
- **Path gotcha:** `TourKit.star()` adds to the current path; call `ctx.beginPath()` first.
- **Flying signature items:** give the power `flight: true` (and a `time`) and Brady steers freely like the LSD flight, without its lasers or grin. Set `p.glideT = 3` just before the time runs out for a soft landing (Morocco's carpet).
- **Your own slippery floor:** a theme's `iceStyle` can be a function `(ctx, topOpen)` that paints the `T.ICE` tile (Valencia's tomato pulp).
- **Sliding enemies:** set `e.slideT = seconds` on a `TourEnemy`: it slides helplessly in its direction, a wall knocks it out and a ledge drops it.
- **Boss reactions to items:** the item calls a brain hook you define (Amsterdam's bell calls `brain.onBell(b)` if present). `noDisc(b)` can also react before refusing damage (Paellasaurus cools when a tomato or flame hits it).
- **Light shafts:** `rays: '#color'` in a theme draws soft animated sunbeams.
- **Background layers must sit high enough to be seen:** the ground covers background y above about 330 at the usual camera height. Keep a layer's interesting shapes between y 220 and 330 (base 300–360 for most near layers).
- **Testing while another country is half-written:** `BRADY_SKIP_TOUR=id,vn node tools/validate_levels.js` leaves those country files out of the validator.

## 1. Files and load order
All `src/*.js` files are concatenated alphabetically into one strict-mode IIFE, so load order is the file name.

| File | What it holds |
|---|---|
| `28_tour_a_core.js` | `TOUR_ROUTE` (all stops, map positions), `Tour` (the registry), `TourProgress` (unlocks), `TourKit` (small helpers) |
| `28_tour_b_build.js` | The level builder: layout styles, generic set pieces, bonus rooms, boss arenas |
| `28_tour_c_powers.js` | Core power-ups: magic mushroom, joint, LSD tab, star, water bottle. Plus `TourPowers` (signature items), smoke puffs, rainbow lasers, the mushroom screen effect |
| `28_tour_d_actors.js` | Enemy toolkit: `TourEnemy`, `TourFlyer`, `TourSwimmer`, `TourLeaper`, `TourFriend`, `tourFire` |
| `28_tour_e_art.js` | Shared art: the goal (passport-stamp post), checkpoints, Chinka's postcards, coins, crates, doors, the default boat |
| `28_tour_f_map.js` | `TourMapScene`: the world map, flights, the level panel |
| `28_tour_g_story.js` | The villain (Baron Bric-a-Brac), intro panels, arrival postcards, the ending, credits, title art, title/map songs |
| **`29_tour_<cc>.js`** | **One file per country** (loads after all of the above) |

**Wrap the whole country file in an IIFE** (`(() => { ... })();`) so your top-level names can't collide with other countries. The only global you call is `Tour.country({...})`.

Use these ids for files, spawn types and theme keys:
- File: `29_tour_ec.js` (Ecuador)
- Spawn types and themes: prefixed with the code, e.g. `ecBooby`, `ec_beach`
- Set pieces: plain names; they are registered as `ec.<name>` automatically

The world app's module list is in `tools/build.js` (the `world` entry). Your new file is picked up automatically.

## 2. The route
`TOUR_ROUTE` in `28_tour_a_core.js` lists every stop:

| id | world | country | id | world | country |
|---|---|---|---|---|---|
| mx | 1 | Mexico | nl | 8 | Amsterdam |
| ec | 2 | Ecuador (+ Galápagos) | id | 9 | Bali |
| br | 3 | Brazil | vn | 10 | Vietnam |
| mz | 4 | Mozambique | jp | 11 | Japan |
| ma | 5 | Morocco | np | 12 | Nepal (finale) |
| es | 6 | Valencia | aq | 13 | Antarctica (secret) |
| fr | 7 | Paris | w22 | 22 | World 22 (secret) |

- Level ids are `<world>-<n>`, e.g. `2-3` is Ecuador level 3.
- A stop shows "coming soon" on the map until its file registers it.
- Progress skips unbuilt stops: beating Mexico's boss unlocks the next *built* country.
- The finale is Nepal's last level (`Tour.isFinale`). It plays `TourEndingScene`.

## 3. `Tour.country({...})`
```js
(() => {
const COL = { a: '#ff3d8b', b: '#18c2c2', c: '#ffb81a' };   // pin, UI and art accents
Tour.country({
  id: 'ec',                                   // a TOUR_ROUTE id
  colors: COL,
  tagline: 'Volcanoes, giant tortoises and the middle of the world',   // map panel subtitle
  arrival: 'Brady! ... ♥ C',                  // Chinka's postcard when Brady first lands here
  landmark: 'the ...',                        // what the Baron shrank (story flavour)
  themes: { ec_beach: {...} },                // added to THEMES (section 7)
  painters: { ecIsland(ctx, L, rng, H) {} },  // background layer painters (BGPaint)
  dyn: { ecWaves(ctx, L, camX, oy, S, W, t, th) {} },  // animated layers (BGDyn)
  decor: { ecCactus(ctx, x, y, t, th, d) {} },         // decor and prop art (Decor)
  decorLights: { ecTorch: [110, '#ffa040', -40] },     // decor that glows in dark levels
  beatArt: { ecLid(ctx, pad, on, warn, t) {} },        // art for timed platforms (B.beat kind)
  platforms: { ecRaft(ctx, p, t) {} },                 // skins for moving/falling platforms
  enemies: { ecCrab: { cls: SomeClass, place: 'walk' } },  // spawn type -> class
  entities: { ecGeyser: SomeClass },                   // other spawnable things (hazards, NPCs)
  pieces: { lavaflow(st, o) { ...; return st.x; } },   // set pieces (section 5)
  boss: { id: 'ec_boss', name: '...', hp: 4, dims: [70, 70], music: 'tour_ec_boss', brain: {...} },
  power: { id: 'boots', name: 'BOOBY BOOTS', hint: '...', ... },  // signature power-up (section 8)
  tracks: { tour_ec: {...}, tour_ec_boss: {...} },     // new songs (section 9)
  music: { level: 'tour_ec', boss: 'tour_ec_boss' },
  coin: { name: 'CACAO BEAN', draw(ctx, x, y, t) {} }, // the country's coin skin (centred, ~17px)
  star: { name: 'GOLDEN TORTOISE', draw(ctx, x, y, t) {} },  // invincibility skin (centred, ~24px)
  emblem(ctx, x, y, r, t) {},                          // optional: little icon in the map pin
  levels: [ {...}, {...}, {...}, {...}, {...} ]         // five levels; the last is the castle
});
})();
```

## 4. Level specs
Every level picks a **style**, has its own gimmick, and is a **script of set pieces** run left to right (or bottom to top). There is no random filler, so no two levels look alike.

| style | layout | key options |
|---|---|---|
| `run` | side-scroller | `H` (18), `GY` ground row (14), `width` (max columns) |
| `night` | side-scroller in the dark | as `run`, plus `dark: true`. Light comes from entities' `light` and `decorLights` |
| `auto` | auto-scroll chase | `scroll` (tiles/s). Never make Brady backtrack |
| `ride` | ride a vehicle across | `vehicle` (platform skin), `vehicleW`, `deck` row, `len`, `scroll`, `below: 'liquid'` |
| `swim` | underwater | `H`, `width`. Pieces carve rock with `st.rock` and open water with `st.water` |
| `climb` | vertical tower | `W` (24), `H` (~100), `risingLava: { delay, speed }` |
| `castle` | corridor, then the boss arena | `boss`, `arena` (layout name), `arenaW` |

Common fields:
```js
{ name: 'Mercado Mayhem', style: 'run', theme: 'mx_mercado',
  gimmick: 'Bouncy market awnings, rolling watermelons and fountain jets',   // shown in the report
  enemies: [['mxPepper', 3], ['mxElote', 3]],   // weighted mix for generic 'enemies' pieces
  hint: 'Hold jump on an awning to bounce sky-high',   // shown when the level starts
  postcard: 'Chinka\'s note for this level',
  script: ['xolo', 'stalls', 'gap', ['pinatas', { top: 'star' }], 'cp', 'fountain', 'end'],
  music, time, bpm (timed platforms), wind, secret: { to: 'aq' } }
```

Script rules:
- A step is `'name'` or `['name', { options }]`. Country pieces win over generic ones with the same name.
- `cp` (checkpoint) is inserted at the middle if you leave it out.
- `end` (or `arena` for castles) is appended automatically.
- Each level needs **3 postcards** (`st.gold(tx, ty, kind)` spots).
  - Kinds are `'must'` (always used first), `'hidden'`, `'risky'` and `'high'`.
  - A `bonus` room adds one postcard.
  - Missing spots are filled automatically.

## 5. Set pieces
A piece is `(st, opts) => newX` (climb pieces move `st.y` up instead). The builder state `st` gives you:

| | |
|---|---|
| `st.x`, `st.gy` | next free column, current ground row (top surface) |
| `st.B` | the `AreaBuilder`: `set`, `fill`, `ground`, `prop`, `zone`, `beat`, `spawn`, `gold`, `ghosts`, `springs`, `setSurf`, `setHide`, `decorAt` |
| `st.floor(x0, x1, gy?)` | solid ground from `gy` to the bottom |
| `st.pit(x0, x1)` | clear the columns (a pit) |
| `st.semi(x0, x1, y)` | one-way platform |
| `st.coins(x0, x1, y)`, `st.arc(x0, x1, yb, h)` | coin rows and arcs |
| `st.block(tx, ty, content, tile?)` | item block; content is `'power'` (mushroom or joint), `'lsd'`, `'star'`, `'oneup'`, `'sig'`, `'pick'`, `'picks'` |
| `st.enemy(kind, tx, gy?, props?)`, `st.pickEnemy(avoid?)` | spawn enemies |
| `st.decor(kind, tx)`, `st.dress(x0, x1)` | decor; `dress` scatters the theme's `decor` list |
| `st.gold(tx, ty, kind)` | a postcard spot |
| `st.spawn(type, tx, ty, props)` | anything in `ENTITY_TYPES` |
| climb only | `st.y` (current floor row), `st.W`, `st.mid`, `st.top(y, holes)` (full-width one-way floor that ends a band) |
| swim only | `st.floorY`, `st.rock(x0,y0,x1,y1)`, `st.water(x0,y0,x1,y1)` |
| ride only | `st.deck` (vehicle floor row), `st.H` |

Generic pieces:
- `flat`, `gap`, `step`, `stairs`, `blocks`, `floating`
- `mover`, `lift`, `fallers`, `spring`, `pillars`, `spikes`, `enemies`
- `cp`, `sig`, `lsd`, `oneup`, `star`
- `bonus`, `secret`, `end`, `arena`

Castle arenas:
- Write `arena_<name>(st, { x0, w, GY })` in your pieces and set `arena: '<name>'` on the level.
- The builder adds the boss, the door that opens when the boss falls, and the goal.

**Every level must be finishable.** `tools/validate_levels.js` simulates Brady's real physics from every reachable standing spot.

Design within these limits:

| Move | Reach |
|---|---|
| Jump (hold) | about **4 tiles up** |
| Running jump | about **5 tiles across** |
| Walking jump | about **3–4 tiles across** |
| Spring | about **8 tiles up** |
| Bouncy surface (`SURF.BOUNCE`), holding jump | about **8 tiles up** |

What the validator needs from you:
- **Moving platforms:** push their path into `st.B.ghosts` as `[x, y]` (y = the platform's top row) so the validator can follow them.
- **Springs:** add them to `st.B.springs`.
- **Force zones** (updrafts, currents, wind; `B.zone(...)` with `pull` to centre): the validator simulates them.
- **Locked doors and keys:** `B.lock` and the `key` spawn.

Check a layout with `node tools/dump_level.js 2-1 0 120`.

## 6. Enemies
Build them from configs, so the behaviour and art stay together:
```js
const Crab = TourEnemy.make({
  w: 24, h: 18, speed: 1.2,
  behavior: 'walk' | 'hop' | 'charge' | 'throw' | 'roll' | 'still',
  hopV, hopEvery,                         // hop
  range, windup, chargeSpeed, chargeT,    // charge
  every, range, pace, shoot(e, p) {},     // throw: spawn shots with tourFire(...)
  rollSpeed, rollT,                       // roll (prickly while rolling)
  hp: 2, spiky, fiery, edgeTurn,
  art(ctx, e, x, y, mode, t) {},          // x,y = feet; modes: walk idle hop notice charge throw curl roll stun flat ko
  onDefeat(e, how) {}, onHurt(e) {}, onNotice(e) {}, think(e, dt) {}  // think replaces the behaviour
});
enemies: { ecCrab: { cls: Crab, place: 'walk' } }   // place: 'walk' | 'fly' | 'swim' | 'here'
```
- **`TourFlyer.make`**: sine flight, optional swoop.
- **`TourSwimmer.make`**: patrols water and chases Brady.
- **`TourLeaper.make`**: leaps out of water or lava.
- **`TourFriend.make`**: a friendly local who hands Brady an item, e.g. `give: 'sig:<id>'`.
- **Projectiles:** `tourFire(g, x, y, { vx, vy, grav, w, h, life, stompable, fiery, thru, ground, art(ctx, s, t) })`.

How things hit enemies (`hit(kind)`):

| kind | from | default effect |
|---|---|---|
| `stomp` | a jump on top | defeats it |
| `spin` | a headbang | bounces off spiky or fiery enemies |
| `disc` | smoke puffs | knocks it out |
| `laser` | LSD rainbow lasers | knocks it out |
| `taco` | Mexico's taco | stuns |
| `star` | invincibility | knocks it out |
| `bump` | a block hit from below | knocks it out |

Stunned enemies are harmless and can be stomped.

## 7. Themes and art
A theme is a `THEMES` entry. Copy one from Mexico:
- **Sky and light:** `sky` (3 colours), `celestial`, `stars`, `cloudsDyn`, `particles`, `darkness`.
- **Background:** `layers` (`{ kind, color, base, f, blur, dyn }` drawn by `painters`), `fog`.
- **Tiles:** `ground`, `brick`, `hard`, `semi`, `pillar`.
- **Other:** `decor` (kinds for `st.dress`), `liquid` (a key of `LIQUIDS`; add your own, e.g. `LIQUIDS.ec_lava = [...]`).

Painter hooks let you draw tiles your own way:
- `ground.paint(ctx, rng, sides)` and `ground.paintCap(ctx, x0, x1, rng)`
- `brick.paint(ctx)`, `hard.paint(ctx)`, `semi.paint(ctx, part, x0, x1)`
- `qblockArt(ctx, th, frame)` and `usedArt(ctx, th)`: the country's item block (Mexico: a paper piñata; Paris: a pâtisserie box). **Never a question-mark block.**

Background painters:
- They paint a seamless 1024-px-wide strip; `L.base` is the ground line (logical px out of 448).
- Draw anything near the edges twice (x and x ± 1024).

## 8. Signature power-ups
One per country. It is placed with the `sig` piece (a block), or handed over by a `TourFriend` (`give: 'sig:<id>'`).
```js
power: {
  id: 'boots', name: 'BOOBY BOOTS', hint: 'MEGA BOUNCE + SHOCKWAVE',
  time: 0,              // seconds (0 = lasts the level)
  cooldown: 0.3,        // between actions
  speedMul: 1,          // optional run speed multiplier
  icon(ctx, x, y, t) {},          // centred ~24px: used for the item, the HUD slot and the map
  onCollect(p, g) {},
  action(p, g) { ...; return true; },   // the THROW button; return true if it did something
  update(p, dt, inp, g) {},       // every frame while held (e.g. boots: big jumps, shockwave on landing)
  drawOn(p, ctx, t) {}            // draw it on Brady
}
```
On THROW the order is:
1. LSD lasers (while flying)
2. your `action`
3. joint smoke puffs

Read and write Brady's state through `p`: `p.vx`, `p.vy`, `p.onGround`, `p.facing`, `p.cx`, `p.cy`, `p.sig.t`. The level is `g` (`g.spawn`, `g.burst`, `g.entities`, `g.area`).

## 9. Music
- Songs are synthesized. Register new ones with `tracks: { name: {...} }` (or `Sound.addTrack(name, def)`); existing songs can't be replaced.
- Keep each country's sound inspired by its local instruments (Mexico: brass + strings + plucked guitars; Paris: a musette waltz on the reed accordion, `bpb: 3`).

Track format:

| Field | Meaning |
|---|---|
| `bpm`, `bars` | tempo and length |
| `bpb` | beats per bar (3 for a waltz) |
| `spb` | steps per beat (3 for a triplet feel) |
| `ch` | one chord per bar |
| `ld` | lead line `NOTE:steps` with bars separated by `|` |
| `li`, `lv` | lead instrument and volume |
| `l2`, `l2i` | a second melody |
| `hx` | automatic harmony |
| `bp` | bass pattern: `r` root, `f` fifth, `o` octave, `t` third |
| `ap`, `ai` | arpeggio digits or `c` chords |
| `pd` | pad |
| `dr` | drum lanes |
| `rv`, `dl` | reverb and delay |
| `sw` | swing |

- **Instruments:** `brass strings pluck harp twang reed piano vibes bell glass whistle sax organ ep honky hpsi calliope pad sub pluckb sawb slapb`.
- **Drums:** `k` kick, `s` snare, `c` clap, `h` hat, `o` open hat, `x` crash, `g` brush, `n` shaker, `l` clave, `r` rim, `b`/`d` bongos, `t`/`m` toms, `w` cowbell, `u` water drop.
- Sound effects: pick from `Sound.sfxNames`. `TourKit.sfx(name, fallback)` plays a fallback when a name doesn't exist.

## 10. Bosses
The boss framework is `Boss` in `10d_bosses.js`. You only write the brain:
```js
boss: { id: 'ec_boss', name: 'El Tortugón', hp: 4, dims: [80, 60], music: 'tour_ec_boss', brain: {
  guardText: 'TOO SHELLY',
  wake(b) {},                         // when Brady walks in
  update(b, dt) {
    // b.act / b.at (seconds in act) / b.first (first frame) / b.go('act') / b.cycle
    // b.face() / b.walk(speed) / b.fall(dt) / b.hover(dt, y, x) / b.shoot({...}) or tourFire
    // b.vuln = true opens the stomp window; b.guard = 'bounce' bounces Brady off safely
    // b.arenaX0 / b.arenaX1 / b.floorY / b.hp / b.maxHp / b.aggression
  },
  hurt(b) {},                         // after a stomp
  draw(b, ctx, t) {}                  // x = b.cx, feet at b.y + b.h
} }
```
- Give every boss a clear rhythm: an attack, a tell, and a window when it can be stomped (dizzy, collapsed, landed).
- Smoke puffs, tacos and lasers chip `0.34` off.

## 11. Rules (non-negotiable)
- **Original content only.** No lookalikes of other platformers' enemies, blocks, pipes or power-ups, even renamed. No existing characters or franchises. Folklore creatures are fine.
- **Respect.** Never caricature people of any country, or sacred figures and sites. Temples, stupas, mosques and prayer flags are respectful background only. Build the gags from food, animals, objects and landmarks.
- **Landmarks:**
  - No Christ the Redeemer statue in Rio (use Sugarloaf, beaches and the skyline).
  - The Eiffel-style tower appears only in daylight or as a plain silhouette, never with its night light show.
  - Stylize modern architecture.
- **No brands.** PG-13 cartoon tone. The drug items are silly pickups with comedic effects, never instructional.
- **Every level is different:** its own style, its own gimmick, its own set pieces. No re-skins.

## 12. Test your country
```
BRADY_DIST=<your scratch>/dist node tools/build.js
node tools/validate_levels.js 2-1 2-2 2-3 2-4 2-5     # every level finishable, all 3 postcards reachable
node tools/dump_level.js 2-1 0 120                    # ASCII view of a level ('*' = reachable standing spots)
BRADY_DIST=<your scratch>/dist node tools/gameplay_test.js <shots dir>
BRADY_DIST=<your scratch>/dist node tools/apps_test.js
```
Then play it at `<dist>/site/super-brady-o-world/index.html` (874×402 and 402×874).

`window.BRADY` exposes `Game`, `getLevel`, `Play` and `Save`, which is handy for jumping straight into a level from the console.
