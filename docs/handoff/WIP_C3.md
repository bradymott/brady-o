# WIP C3: drivers and the first career track (Nov 11 2026, stopped at the owner's stop point)

C3 covers two things:

- **Drivers:** cut to 12, each with a stat pip and a special.
- **Love Parade:** Bass Valentine's career track, plus the level kit and its recipe.

Nothing here is committed; it all sits in the working tree of `/Users/bradymott/brady-o-artcart`.

## Done and verified

### Driver roster (`src/43_cart_a_data.js`, `CART_DRIVERS`)

- **The 12 drivers:** Brady, Chinka, Sparkle Pony, DPW Punk, Death Guild, Crusty, Ranger, Annoying DJ, Darkwad, Bad Idea Guy, Messiah Complex, Party Boy.
  - Messiah Complex and Party Boy replace Undercover Cop and Partied Too Hard, per the owner's change.
  - Each entry has a `stat` and a `special` id.
- **Fallbacks:** retired drivers fall back to Brady, both when saved and when requested. Rivals are drawn from the 12 only.
- **Rolling** (`cartRollItem`):
  - A kart rolls its car's special or its driver's special, at 1.4× the old car-only rate, split 50/50.
  - A 7th argument, `poolCar`, puts the level car's special into everyone's pool at 12%.
- **The two new character types** are defined with `BurnsRig.defineType` in `43_cart_j_drivers.js`:
  - `messiah`: white robe, wavy hair and beard, sandals, shades. No religious symbols.
  - `partyboy`: spiky bleached hair, holo crop top, rainbow fur boots, kandi.
  - An engine-side model would add a hand fan for Party Boy and a nicer robe drape.

### Driver specials (`src/43_cart_j_drivers.js`)

There are 12, all built on the car-special plumbing (`CART_ITEM_FX` and `CART_IX_KIND` records):

| Driver | Special |
|---|---|
| Brady | `firstburn` |
| Chinka | `lapped` |
| Sparkle Pony | `borrow` |
| DPW Punk | `roadwork` (pooled barricades and cones) |
| Death Guild | `bungee` |
| Crusty | `lecture` |
| Ranger | `fivemph` |
| Annoying DJ | `airhorn` |
| Darkwad | `lightsout` |
| Bad Idea Guy | `holdwater` (backfires one time in four) |
| Messiah Complex | `parting` (red carpet) |
| Party Boy | `afterparty` (rave train) |

Each one has:

- an icon;
- an AI rule (`aiWants`);
- 2D speech bubbles and signs through a new optional `CART_IX_KIND[x].hud` hook;
- guide text, added to `CART_GUIDE_TEXT`.

**Verified** by `tools/cart_driver_test.js` (the earlier full run):

- all 13 cases pass, including the stats check, the fallbacks and the roll odds;
- the `holdwater_bad` expectation was relaxed afterwards (backfire plus self-flip only);
- screenshots are in `S/shots-C3/drivers/` (`S` is the session scratchpad).

### Driver-select card and guide (`src/43_cart_f_menu.js`, C1's file)

- **Driver card:** a small block marked `C3` in `drawDrivers` shows the stat pill and the special. In portrait it sits above the name, so it doesn't overlap the grid.
- **Guide:** the guide's second tab is now `SPECIALS` and lists the car specials plus the driver specials (one line in the `CartGuide` constructor).

### Hooks in shared files (all small)

- **`d_sim`:**
  - `this.rules` falls back to `CART_TRACK_RULES[trackId]` for races.
  - Sets `this.poolCar` via `cartTrackPoolCar`.
  - Stats come from `cartKartStats` (C1's function).
  - The roll passes `k.drv.id` and `this.poolCar`.
  - Adds `k.steerFx` to steering, the `k.crawlT` speed cap, and an `o.banner` override in `hit()`.
- **`e_scene`:** `k.darkT` draws the car dark with its lights off.
- **`da_items`:**
  - `cartItemsLoad` calls `cartDrvLoad`.
  - `cartItemsHud` calls `K.hud`.
- **`c_world`:** `CartWorlds.track` hands off to `CART_TRACKS[id].world` when it is set.

### Level kit (`src/43_cart_j_kit.js`) and Love Parade (`src/43_cart_j_loveparade.js`)

- **Registries:** `CART_TRACK_RULES` and `CART_CAREER_TRACKS`, both `var`-guarded. `CART_CAREER_TRACKS.heart = 'loveparade'`.
- **Kit (`CartKit`):**
  - `course` builds a filleted polygon with a width function;
  - `world`, `paintRoad`, `rails`, `lamps`, `kinds` / `put` (instanced props), `crowd`, `gifts`, `boosts`, `grid`;
  - `group` (pooled meshes);
  - `hit` / `touch` / `fired` counters, `ahead`, `heart`.
- **The track:** about 1149 m, at night in pink and red neon. In lap order:
  - heart-arch start gate;
  - a boulevard with **4 giant subs**: their bass shockwave shoves cars, telegraphed for 2 beats, and you hop it to dodge;
  - the heart-rib tunnel;
  - the kissing-booth chicane with **3 cupid drones** dropping **heart mines** onto a reticle;
  - a dance-floor plaza with an **8-dancer conga crossing**;
  - confetti alley with **4 cannons**: a flashing cone warns, and a hit blinds you with a HUD confetti overlay and makes your steering wander;
  - the hairpin.
- **AI:** hops the bass wave (more often at higher skill) and eases off for the conga line. Obstacles are registered with `cartIxObs`.
- **Debug:**
  - `BRADY_CART.debug.start({ mode: 'career', track: 'loveparade' })` (or `mode: 'quick'`).
  - `debug.level()`, `debug.levelShots()`, `debug.levelShot(name)`.

**Verified** in the last full race run:

- 2 races of 8 AI karts each (one in career mode): all 8 finish, nobody gets stuck.
- Lap times are 42–63 s, about 45 s/km, against 41.3 s/km on Neon Nights.
- Hazards fired and landed. Seed 3:

  | Hazard | Fired | Hits / touches |
  |---|---|---|
  | Bass | 178 | 58 touches |
  | Confetti | 121 | 9 touches |
  | Conga | 10 | 1 hit |
  | Heart mines | 32 | 2 hits |

- Views measured before the stop: peak about 400k triangles (near the start grandstand) and 73 draws. No shadow pass at night. This was before the grandstand was trimmed; the grid view is now 368k.
- All 10 hazard screenshots were taken (`S/shots-C3/track/hazard-*.png`).

### Docs

`docs/ART_CART_LEVEL_RECIPE.md` is complete: file layout, registering a track, building the world, the hazard pattern (cycle, telegraph, effect, counterplay, AI), budgets, and testing.

## Half-done or unverified

- **Track test after the final tweaks:** the last full `tools/cart_track_test.js` run was killed at the stop, partway through the views. It was a rebuild with bigger dancers, mines and cannons, a darker sky and fewer bleachers.
  - The races in that run passed.
  - The views and hazard shots after the final tweaks were not re-checked. Rerun it.
- **Driver test after the last edits:** `tools/cart_driver_test.js` was not rerun after its last edits (the `user` option for the `roadwork` case, three warm-up frames, the parting carpet tiles, the portrait card position). Rerun it and read the screenshots; the portrait select screen should no longer overlap.
- **`hazard-cannon.png`:** shows the telegraph but not the confetti burst. Particles may need more rendered frames in `levelShot`.
- **`apps_test`:** passed at the stop point (all 3 apps).

## Not started

- Running the other existing suites against the changes: `cart_item_test`, `cart_battle_test`, `cart_shots`, `cart_showroom_shots`.
- A real-iPhone frame-rate check.

## Known issues and notes for others

- **Royale (C2):** driver specials hit with `kind: 'drv'` through `s.hit` (air horn, lights out, afterparty). In the royale, `onBattleHit` may count these as damage. Decide whether `'drv'` hits should do damage.
- **Balance:** AI heart-mine hits are low (2–4 per race) and bass shoves are about 2 per kart per lap. Lap times run about 9% slower per km than Neon Nights.
- **Positioning on the course:** `T.locate` only searches near its hint. Use arc lengths and `CartKit.ahead` (this bug made AI brake falsely; it is fixed).

## Interfaces others rely on

- `CART_DRIVERS[i].stat` and `.special`; `CART_ITEMS[id].driver`.
- `cartTrackPoolCar(trackId)` and `CART_TRACKS[id].car`.
- `CART_TRACK_RULES[id]`, which uses the same hooks as the arenas.
- `CART_CAREER_TRACKS.heart = 'loveparade'`.
- `CartKit.*`.
- Kart timers: `crawlT`, `mixT`, `lostT`, `trainT`, `partT`, `boredT`, `joyT`, `darkT`.

## How to run

```sh
export NODE_PATH=/Users/bradymott/brady-o/node_modules
BRADY_DIST=$S/dist-C3 node tools/build.js
BRADY_DIST=$S/dist-C3 node tools/cart_driver_test.js $S/shots-C3/drivers
BRADY_DIST=$S/dist-C3 ONLY=races|views|shots node tools/cart_track_test.js loveparade $S/shots-C3/track
```

`ONLY` is optional.

The machine is slow when loaded; the tests wait up to 600 s for the GLB models to be ready.

## Next steps for a fresh agent

1. Build, then rerun both tests. Read `view-*.png`, `hazard-*.png`, `special-*.png` and `select-*.png`.
2. If peak triangles exceed 420k, trim crowd rows or bleachers in `lpWorld`.
3. Agree the royale handling of `'drv'` hits with C2.
4. Run the existing suites listed under "Not started".
5. Then build the other 11 tracks from the recipe.
