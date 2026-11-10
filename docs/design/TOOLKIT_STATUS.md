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
| country `stamps`, `skins`, `houses`, `map` | implemented | stamps and skins are used by fixtures; houses are in the progress API and tests; the panel does not draw houses yet (W13) |
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
| `gearStand` `keyLock` `lever` `toggle` `plate` `timedDoor` `zip` `catapult` `seesaw` `wheel` `teleport` `fan` `balloon` `breakwall` `mirrors` `valve` `ring` `belt` `iceRun` `honey` `bouncePad` `crumbleRow` `pedestal` `lantern` `flipline` `hold` `thief` `rival` `watcher` `ball` `bottle` `shop` | not yet | W10 (object library) |
| gimmick pieces `geyser pancake bubbler roller barrel laser sweeper subwoofer horn poiring dropper banner discoball jellypad` | not yet | the entity types exist (engine gimmicks); the pieces come with W10 |

### Entity types (§7.4.3)
| Type | Status |
|---|---|
| `trapdoor`, `railSwitch` (+ `railCart`, `railTrack`, `tourCurtain`, `tourDraft`) | tested / implemented (curtain, draft) |
| `lever toggleSwitch plate crate timedDoor zipLine catapult seesaw wheel teleport fan balloon breakWall mirror sunReceptor valve ring pedestal carryItem lantern gearStand bottle souvenirShop` | not yet |
| `tourDoom holdArena tourThief tourRival watcher tourBall` | not yet |

### Behaviours (§7.4.4)
All 30 (`splitter … hoverDart`): **not yet** (W11). `onPhase` / `onLight` hooks: not yet.

### Power-ups (§7.4.5)
Core ids unchanged. Gear `plane hat pads magnet fins box kazoo wand sundial globe`, the HANDS / BUFFS slots and the Backpack swap: **not yet** (W12). The validator already understands gear stands as vkeys `gear:<id>` (crawlways open with `gear:pads`).

### Area systems (§7.4.6)
| Key | Status | Notes |
|---|---|---|
| `dark`, `water`, `gravity`, `wind`, `bpm`, `autoscroll`, `risingLava`, `roof` | tested (legacy) | |
| `waterLine` | implemented | static water line (tiles below are water for the validator; `area.waterTop` in the game) |
| `tide { low, high, period, hold }` | implemented | the water line cycles in the game; the validator treats it as an auto toggle when a toggle group of kind `tide` is present (W9 wires it automatically: not yet) |
| `risingWater`, `autoscrollY` | tested | rise gen |
| `bottomKill` | tested | |
| `camera: 'lanes' / 'shaft' / 'room' / 'free'` | tested | `'tower'` is the legacy tower camera |
| `carry { jumpMul }` | tested (validator) | the carried item and pedestals come with W10 |
| `chase { speed }` | tested (validator pace) | the `TourDoom` front comes with W10 |
| `flip`, `lamp`, `phase`, `mirror` (v2 areas) | not yet | `mirror` works for legacy levels |

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
| flip standing | not yet |
| result `{ ok, exits, gold, areasReached, pace, budget, nodes, ms }` | tested |

### Progress API (§7.4.7)
| Call | Status |
|---|---|
| `exit(id, key)` → reveals (path, stop, house, land, flight), queued in `tour.pending` | tested |
| `revealDone(r)` (extra: the map calls it after each animation step) | tested |
| `isUnlocked`, `isRevealed`, `exitsFound`, `countryUnlocked`, `bossDone`, `totals` | tested |
| `complete(id, secret, key)` (legacy entry point, now a wrapper) | tested |

### Map (§3.6, §3.7)
Country panel from `mapCell`/`mapFrom` with hidden stops (`mapHidden`, from the graphics pass): exists. Houses on the panel, reveal animations, exit pips, `ARCH_LABEL`, panel Brady walker, world-map flights/bottles/lighthouse/airship: **not yet** (W13).

## Spec deviations (decided while building; the spec text was updated where it matters)
- `src/28_tour_b2_gens.js` would load **before** `28_tour_b_build.js` (files load in name order and `2` sorts before `_`), so the generators live in `src/28_tour_bb_gens.js`.
- The save object keeps the engine's own version field (`v: 3`); the §3.5 sketch said `v: 1`, which would trigger the engine's old progress wipe.
- Strip-like v2 areas never get an automatic `end`: the level says where it ends (HUB sub-areas end in stamps, LAIR lead-ins in a door).
- The layered gen opens a hole in the lane above every launcher (bounce, spring, updraft) by default; otherwise awnings and springs on the street would hit the underside of the roof slab.
- Rooms without a `theme` use the level theme's cave look; rooms are padded to at least 28 x 14 tiles.
