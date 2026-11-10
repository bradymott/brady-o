# Level toolkit status (engine side of LEVEL_OVERHAUL.md §7)

Branch `sbw/level-toolkit`. This file says which parts of the §7.4 interface contract exist, so country agents know what they can use today. Keep it current: one row per contract item.

**Status words**
- **tested**: implemented, used by a fixture level (`tools/fixtures/sbw_lab_levels.js`) or a real level that the validator passes, and looked at in a screenshot (`tools/sbw_toolkit_shots.js`).
- **implemented**: the code exists and loads; no fixture or screenshot yet. Use it, but check your level carefully.
- **not yet**: missing. Ask for it in `docs/handoff/REQUESTS.md`.

**Tests** (all must pass before a push): `node tools/validate_levels.js --rules`, `node tools/sbw_toolkit_test.js`, `node tools/save_test.js`, `node tools/sbw_snapshot.js` (legacy levels build byte-identical), `BRADY_DIST=… node tools/sbw_toolkit_shots.js <dir>` (fixtures in the browser), plus the existing `gameplay_test`, `boss_test`, `apps_test`, `sbw_graphics_test`, `sbw_atlas_test`.
`node tools/dump_level.js lab:gens.layered 0 120` prints any fixture as ASCII with the validator's reachable spots.

## How to write a level in the new format

A level is a list of **areas**. Each area is built by a **generator** (`gen`) and they are joined by **doors** that target `'areaId'` or `'areaId@anchor'`. Brady starts at the first area's `start` anchor. Exits are gates with an `exit` key that matches the level's `exits`.

This is a complete, working level (it is the `guide` fixture, built and validated by `tools/sbw_toolkit_test.js guide`). It would be Mexico's secret level 1-6:

```js
// inside Tour.country({ id: 'mx', ..., levels: [ ...1-5..., THIS ] })
{
  n: 6, name: 'Guide Alley', arch: 'parade', secret: true, theme: 'mx_mercado',
  gimmick: 'A street, a hatch to a cellar, a fake wall to a secret gate',
  hint: 'Stomp the crate on the hatch, then press down',
  enemies: [['mxPepper', 2], ['mxElote', 1]],
  mapCell: [2, 2], mapFrom: 2,                      // panel grid cell; the trail comes from stop index 2 (level 3)
  exits: {
    main:   { to: 'node:1-5' },                      // a shortcut: unlocks 1-5 and draws a gold trail
    secret: { to: 'house:mx-tienda', hint: 'Chili dust puffs from a crate...' }
  },
  areas: [
    { id: 'street', gen: 'strip', script: [
      ['itemBlock', { item: 'power', y: 4 }],        // a power-up in the first 25 % (budget rule)
      ['stalls', { n: 2 }],                          // country pieces work as before
      ['postcard', { kind: 'must', dy: -9 }],        // P1 over the awnings
      'gap',
      ['trapdoor', { to: 'cellar@in', crate: true, back: 'cellarBack' }],   // back: an anchor here for the way out
      ['enemies', { n: 2 }],
      'cp',
      ['spring', {}],
      ['end', { exit: 'main' }]                      // v2 areas don't get an automatic end
    ] },
    { id: 'cellar', gen: 'room', role: 'secret', stamp: {
      floor: 9,
      rows: [
        '##############################',
        '#.............#..............#',
        '#..o.o.o......#....o.o.o.....#',
        '#.............#..............#',
        '#....*........#..............#',
        '#..-----......F..............#',
        '#.............F..............#',
        '#......?......F..............#',
        '#.@..D....k...F.......g......#',      // @ start/in anchor, D door, F fake wall, g secret gate
        '##############################'
      ],
      legend: { k: ['decor', 'mxPots'] }, items: ['oneup'],
      doors: [{ to: 'street@cellarBack' }], gold: { '*': 'hidden' } } }   // P2 in the secret room
  ]
}
```

Rules of thumb:
- `n` must equal the level's position. Main levels first (the boss is the last main one), then `secret: true` levels.
- A strip area in v2 gets a checkpoint in the middle if it has none (main role only) but **no automatic end**: put `['end', { exit: 'main' }]` or a gate (`['gate', { exit }]`, stamp `G`/`g`) where the level ends.
- A room without `theme` uses the level theme's cave look. A theme name that doesn't exist yet falls back (a warning, not an error), so you can name the new themes before their art exists.
- Three postcards per level: `postcard` pieces, `st.gold(...)` in your own pieces, or `*` in stamps (`gold: { '*': kind }`). Kinds: `must` first, then one each of `hidden`, `risky`, `high`; the rest are spread out; missing ones get a fallback spot.
- Stamps can live in the country (`stamps: { bodega: {...} }`, used as `stamp: 'bodega'`) or inline (an object).
- To change levels from a second file (as `29_tour_<cc>_sprites.js` does for art), use `Tour.amend('<cc>', { stamps, skins, houses, map, levels: [{ n: 2, ... }] })`: a level with `n` replaces that level.
- `validate_levels --rules` reports levels without `arch` as "unmigrated" warnings (errors at release).

## Contract status

### Spec format (§7.2) and save (§3.5)
| Item | Status | Notes |
|---|---|---|
| Save v2 key `super-brady-o-world-save-v2`, `exits`, tour `revealed/paths/flights/bottles/lighthouse/houses/pending` | tested | `tools/save_test.js`; settings and look copied once from v1; v1 untouched |
| level `n`, `arch`, `secret: true`, `exits { main, secret, … }`, `areas`, `mapCell`, `mapFrom` | tested | `n` mismatches and main-after-secret go to `Tour.problems` (reported by `--rules`) |
| legacy `style`/`script` levels | tested | build byte-identical (`tools/sbw_snapshot.js`); legacy `secret: { to }` becomes `exits.secret = { to: 'land:<to>' }` |
| `C.mainCount`, `Tour.isBoss`, `isFinale`, WORLDS `kinds`/`mainCount` | tested | |
| country `stamps`, `skins`, `houses`, `map` | implemented | used by Mexico 1-1 and Ecuador 2-2; houses are in the progress API and tests; the panel does not draw houses yet (W13) |
| `Tour.amend(cc, patch)` (extra, not in §7) | tested | used by the progress tests |
| `TourBuild.fromSpec(C, spec, i)` (extra) | tested | builds an unregistered spec (fixtures, lab) |

### Generators (§7.4.1, `TourGens[gen](ctx, areaSpec) → { area, anchors }`)
| gen | Status | Notes |
|---|---|---|
| `strip` | tested | v2 options: `W`, `H`, `GY`, `mode: 'run'/'auto'/'castle'`, `ceil`, `bottomKill`, `carry`, `chase` |
| `layered` | tested | lanes on their own cursors; `sync`; upper lanes are 2-row slabs; **launchers open the lane above** (a hole over every bouncy surface, spring and updraft; `autoOpen: false` to opt out); camera `lanes` |
| `islands` | tested | sky strip; `bottomKill`; camera `free` (55 %) |
| `shaft` | tested | `st.y` grows down, `st.shelf(y, holes)`, `st.down(n)`; pieces `ledges`, `shelf`, `ringFall`, `spikeShelf`, `updraft`; `fallCap` 11 t/s, `airSteer` 1.4; camera `shaft` (35 %); river and gate at the bottom |
| `room` | tested | a stamp; rooms smaller than the screen are padded with rock (min 28 x 14) |
| `maze` | tested | `cells`, `cell`, `script` (rows of cell stamps), `links` door / drop / oneway; camera `room` |
| `rail` | tested | `decks`, `fork` piece, `railSwitch` lever posts, `railCart`, drawn track with trestles; both decks are validator ghosts |
| `ride`, `swim`, `climb` | tested (legacy levels) | climb `variant` is stored; variant pieces: `waterfall` (facade), `gondola` (exterior); `zigzag` and `blockBand` are generic climb bands |
| `rise` | tested | `rise: { speed, delay }` (camera climbs, bottom edge kills) or `risingWater: { speed, delay }` (Brady swims in it) |
| `dig` | tested | soil below `surface`; `cavern`, `rockBand`, `pocket`, `exit` pieces; dug tunnels draw a dark wall |
| `arena` | tested | runs the country's `arena_<layout>` after an entry with anchor `in` |

### Builder pieces (§7.4.2)
| Piece | Status | Notes |
|---|---|---|
| existing `flat gap step stairs blocks floating mover lift fallers spring pillars spikes enemies cp sig lsd oneup star bonus secret arena` | tested | unchanged |
| `end { exit }` | tested | |
| `stamp { id, at }` | tested | floor row on the ground |
| `door { to, look, perch, back }` | tested | |
| `secretDoor { to, look: 'fake'/'curtain'/'painted', back }` | implemented | fake wall with crack + dust tell; waterfall/willow curtain |
| `trapdoor { to, crate, back, look }` | tested | stomp the crate, press down on the hatch |
| `gate { exit, need }` | tested | |
| `itemBlock { item, y, hidden }` | tested | |
| `postcard { kind, dx, dy }` | tested | |
| `sync` | tested | |
| `anchor { name }`, `vkey { id, dx, dy }` (extras) | tested | |
| `fork` | tested | rail |
| `gearStand` `keyLock` `lever` `toggle` `plate` `timedDoor` `zip` `catapult` `teleport` `fan` `breakwall` `valve` `ring` `belt` `iceRun` `honey` `bouncePad` `crumbleRow` | tested | `LAB.objects` fixtures validate; `tools/sbw_toolkit_shots.js objects` drives each one in the game (+ 3 negative checks) |
| `seesaw` `wheel` `balloon` `mirrors` `pedestal` `lantern` (relight / phase) `flipline` `hold` `thief` + `thiefStop` `rival` `watcher` + `alarmShutter` + `hideSpot` `ball` `bottle` `shop` | tested | `LAB.systems` fixtures validate (+ 7 negative checks); `sbw_toolkit_shots.js systems` drives each one in the game. Extras: `pedestal { deliver, lockAt }`, `flipline { spikes }`, `thiefStop { n, lock }` |
| gimmick pieces `geyser pancake bubbler roller barrel laser sweeper subwoofer horn poiring dropper banner discoball jellypad` | tested | `look` picks a country skin |

### Entity types (§7.4.3)
| Type | Status |
|---|---|
| `trapdoor`, `railSwitch` (+ `railCart`, `railTrack`, `tourCurtain`, `tourDraft`) | tested / implemented (curtain, draft) |
| `lever toggleSwitch plate crate timedDoor zip catapult teleport fan breakWall gearStand` (`src/28_tour_h_objects.js`, gear stand in `28_tour_dg_gear.js`) | tested |
| `seesaw wheelHub balloon mirror sunSource sunReceptor pedestal lampPost phaseBlocks flipLine bottle souvenirShop` (`src/28_tour_hb_systems.js`) | tested |
| `tourDoom holdArena tourThief tourRival watcher alarmShutter hideSpot` (`28_tour_hb_systems.js`), `tourBall` (`28_tour_i_behave.js`) | tested |

### Behaviours (§7.4.4)
All 30 (`splitter … hoverDart`) in `src/28_tour_i_behave.js` (`TourBehave`): **tested**. `tools/sbw_toolkit_shots.js behave` makes a lab critter per behaviour and scripts each one through its tell, attack and weak moment (the state sequence is checked), with a screenshot each. Walkers, flyers (`grabber`, `hoverDart`, `swarm`) and swimmers wrap `TourEnemy`, `TourFlyer`, `TourSwimmer`. `onPhase` is called by `setPhase`; `lightFrozen` reads the lights list.

### Power-ups (§7.4.5)
Core ids unchanged. Gear `plane hat pads magnet fins box kazoo wand sundial globe` (`src/28_tour_dg_gear.js`, `TourGear`), the FORM / HANDS / BUFFS slots, the hit order (star → hat absorbs → HANDS drops for 2 s → FORM) and the Backpack swap: **tested** (`sbw_toolkit_test.js gear`, `sbw_toolkit_shots.js gear`). Gear stands are vkeys `gear:<id>`.

### Area systems (§7.4.6)
| Key | Status | Notes |
|---|---|---|
| `dark`, `water`, `gravity`, `wind`, `bpm`, `autoscroll`, `risingLava`, `roof` | tested (legacy) | |
| `waterLine` | implemented | static water line (tiles below are water for the validator; `area.waterTop` in the game) |
| `tide { low, high, period, hold }` | tested | the water line cycles in the game; the build adds an auto toggle group of kind `tide`, so the validator tries both water lines everywhere |
| `risingWater`, `autoscrollY` | tested | rise gen |
| `bottomKill` | tested | |
| `camera: 'lanes' / 'shaft' / 'room' / 'free'` | tested | `'tower'` is the legacy tower camera |
| `carry { jumpMul }` | tested | pedestals, the carried item drawn over Brady, lower jumps in the game too; a hit, a 6-row fall or water sends it home |
| `chase { speed, ramp, period, look: 'dust'/'lava'/'wave', lethal }` | tested | the `TourDoom` front (pace in the validator) |
| flip (zones of kind `flip`, the `flipline` piece) | tested | `playerPhysicsFlip` runs the physics in a mirrored copy of the area; the validator stands on ceilings inside the band (node flag `f`) |
| `lamp { decay, r0, r1 }` | tested | the area is dark; Brady's light shrinks; `lantern { kind: 'relight' }` posts relight it |
| `phase { night, day, start }` | tested | the `lantern { kind: 'phase' }` piece: a toggle group of day-only / night-only blocks + the theme swap |
| `mirror` (v2 areas) | not yet | works for legacy levels |

### Validator v2 (§6.1)
| Primitive | Status |
|---|---|
| ghosts, springs, zones, locks + keys | tested (legacy) |
| `B.vkey(id, tiles, mode)` | tested (fixtures vkeyLock, lockShut, crawl) |
| `B.edge(from, to, toArea)` | tested (edge, noEdge) |
| `B.toggle(g, A, B, opts)` + `B.switchAt` (bitmask search state, auto groups, water groups) | tested (toggle, toggleAuto, toggleNone) |
| light-only tiles (`hide 3`) | tested (lightOnly) |
| soil (dig down) | tested (dig, noDig) |
| lintel crawlways with `gear:pads` | tested (crawl, crawlNoPads) |
| carry physics | tested (carryDelivered, carryHeavy) |
| pace (chase, rising lava/water, camera autoscroll) | tested (paceOk, paceFail) |
| coverage: every exit, 3 postcards, every area | tested |
| budget (§5.3 rules 1-3) | implemented (v2 levels only; rule 4-7 not yet) |
| archetype rules (§0) in `--rules` | implemented |
| flip standing | tested (`LAB.systems.flip`, plus the "no flip band" negative) |
| result `{ ok, exits, gold, areasReached, pace, budget, nodes, ms }` | tested |

### Progress API (§7.4.7)
| Call | Status |
|---|---|
| `exit(id, key)` → reveals (path, stop, house, land, flight), queued in `tour.pending` | tested |
| `revealDone(r)` (extra: the map calls it after each animation step) | tested |
| `isUnlocked`, `isRevealed`, `exitsFound`, `countryUnlocked`, `bossDone`, `totals` | tested |
| `complete(id, secret, key)` (legacy entry point, now a wrapper) | tested |

### Map (§3.6, §3.7) — `src/28_tour_fb_mapgraph.js`
| Item | Status | Notes |
|---|---|---|
| panel grid over levels + houses, `mapFrom` arrays, visibility from `tour.revealed` | tested | `sbw_toolkit_shots.js mapgraph`; `sbw_graphics_test.js` layouts still pass |
| trails solid (walked / opened) / dotted / gold from or to a secret | implemented | |
| secret-level ring + star, house awning + coin, fort roof motif per `map.fort`, exit pips after the first clear, `TourLandscape.ARCH_LABEL` | implemented (ARCH_LABEL tested) | |
| reveal queue: trail grows 1 s with a sparkle, stop pops 0.45 s with 12 sparks, banner 1.6 s; written on finish; reduced motion = 0.3 s steps | tested | a tap speeds a step up |
| Brady on the panel: BFS over visible trails at 160 px/s, dust puffs, a tap mid-walk jumps there, a second tap opens the stop | tested | |
| houses: `Tour.houseLevel(id)` builds the stand room (country stamp `stand` or the default) with the `shop` counter; leaving counts a visit (`tour.houses`), no level progress | tested | |
| world map: contrail, landmarks in the Baron's jar (shatter + grow + postmark once the boss falls, `tour.jars`), the airship over the next country, secret-flight arcs, bottle currents, the Postcard Lighthouse (tap lights it: `?` flags on stops with hidden exits), cloud shadows, ice cracks for a new land | tested (jar, lighthouse, flight arc) / implemented | |
| World 22 ghost pin ("22?") | not yet | needs a save flag for the 5-2 door |

## Levels in the v2 format
| Level | Where | Status |
|---|---|---|
| 1-1 Mercado Mayhem (PARADE: `mercado` layered → `bodega` room (secret) → `tienda` gate) | `src/29_tour_mx.js` | validates (main + secret exits, 3 postcards, both areas); runs in the game (`sbw_toolkit_shots.js levels`) |
| 2-2 Canopy of Baños (islands → treehouse and cascada rooms) | `src/29_tour_ec_levels.js` | validates; runs in the game |
| the other 66 | unchanged legacy specs | build byte-identical (`sbw_snapshot.js`); all finishable (`validate_levels.js`) |

## Spec deviations (decided while building; the spec text was updated where it matters)
- `src/28_tour_b2_gens.js` would load **before** `28_tour_b_build.js` (files load in name order and `2` sorts before `_`), so the generators live in `src/28_tour_bb_gens.js`.
- The save object keeps the engine's own version field (`v: 3`); the §3.5 sketch said `v: 1`, which would trigger the engine's old progress wipe.
- Strip-like v2 areas never get an automatic `end`: the level says where it ends (HUB sub-areas end in stamps, LAIR lead-ins in a door).
- The layered gen opens a hole in the lane above every launcher (bounce, spring, updraft) by default; otherwise awnings and springs on the street would hit the underside of the roof slab.
- Rooms without a `theme` use the level theme's cave look; rooms are padded to at least 28 x 14 tiles.
- Gear lives in `src/28_tour_dg_gear.js` (not in `28_tour_c_powers.js`): it needs the actor classes from `28_tour_d_actors.js` and loads right after them.
- Ecuador 2-2 is in its own file `src/29_tour_ec_levels.js` (`Tour.amend('ec', …)`) so `29_tour_ec.js` stays with the art branch; it uses `ecFrog` where the spec says `ecGlassFrog` (no such type exists yet).
- Souvenir Stand prices are 30 / 60 / 90, not 100: the coin counter rolls over into a 1-up at 100, so 100 coins can never be held.
- Brady in a flip band ignores moving platforms (they are not mirrored); flip bands should not contain them.
- THIEF: the thief leaps between its stops (`thiefStop n`) in arcs rather than running the terrain, so it can never get stuck; it is caught by a stomp or any hit while it waits at a stop.
- RACE: the rival's course is read from the tiles at run time (the highest standable surface per column, leaping gaps); it waits at an unlit checkpoint when Brady is 15+ tiles behind.
- Bottle Mail sends its currents from the country of each bottle's level (2-6 ec, 3-4 br, 4-4 mz, 6-6 es, 9-1 id); the lighthouse is a world-map node you tap (no room behind it).
