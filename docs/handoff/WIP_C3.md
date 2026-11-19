# WIP C3: drivers and the first career track (updated Nov 19 2026, after the origin/main merge)

C3 covers two things:

- **Drivers:** cut to 12, each with a stat pip and a special.
- **Love Parade:** Bass Valentine's career track, plus the level kit and its recipe.

The Nov 11 work is committed. The Nov 19 fixes below are in the working tree of `/Users/bradymott/brady-o-artcart`, not committed.

## State: ready to ship (verified Nov 19)

- `tools/cart_driver_test.js`: all 13 special cases pass, plus the roster, stats, fallback and roll checks.
  - Rolls (n = 4000): own special 3.4% when leading, 14.1% at the back. No other driver's special ever rolled. The level car's special (pool) came up 9.1%.
- `tools/cart_track_test.js loveparade`: ALL OK.
  - Races: 2 × 8 karts, 8/8 finished each time, nobody stuck. Numbers are in the C3 report.
  - Views: the peak over two runs is 379k triangles (start grid) and 76 draw calls (f 0.95). After the mine tweak the run peaked at 367k / 76. The budget is 420k / 120.
  - The 10 hazard shots all caught their moment.
- `tools/cart_item_test.js`: 201 ok, 19 failed.
  - 17 failures are the `man` arena (C2's `43_cart_i_royale_the_man.js`): `s.roy.aimAt` is set when `s.roy` is undefined outside royale mode.
  - 2 failures were on `moon` (skymail no hit, breach landing) under load. Both passed when rerun alone (`onlyId` skymail and breach).
  - None of the failures are in C3 code.

## Nov 19 changes

- **Brady portrait** (`43_cart_f_menu.js`, `portraits()`, marked C3):
  - Skinned characters are framed on their head joint (`BurnsSkinActor…S.headPos`).
  - The new, taller realistic Brady had his head cut off in the select tile.
  - The skinned portrait rim was raised from 0.6 to 1.1, because the textured face was nearly black in the tile.
  - Brady is in all black on the select stage and in the tile (both checked in screenshots).
- **Heart mines are a real threat** (`43_cart_j_loveparade.js`):
  - 4 drones (was 3), 10 mines (was 8).
  - Drone cooldown 1.8–3.0 s (was 2.6–4.2 s).
  - Pop radius 1.9 m (was 1.7 m).
  - The reticle telegraph is unchanged, so steering off it still dodges.
- **Banner overlap:** "HEART MINE INCOMING!" no longer prints over the first-lap "CUPID DRONES!" hint. The hint time is stored in `L.hintT`.
- **Track test:** the race is held open until every kart finishes. Career results come 9 s after the player finishes and estimate the rest, which made seed 11 fail when the player won.
- **Driver test:** the first special case renders 12 warm-up frames.
  - `special-firstburn.png` came out all black when it ran right after the select-screen viewport changes.
  - Run alone, the shot renders correctly, so this is test staging, not the game.
  - The full run may still show black in that one shot.
- **Recipe** (`docs/ART_CART_LEVEL_RECIPE.md`): real budget numbers, balance targets and the banner rule.

## Weak or not done

- **`hazard-cannon.png`:** shows the cannons but not the confetti burst. This is a staging issue in `levelShot` (the particles need more frames). It was skipped on the owner's priority call.
- **Lap pace:** 44–46 s/km against Neon's 41–42, about 5–10% slower. The hazards cost time by design. AI laps are 42–64 s, and the autopilot player's laps are 47–58 s; the first lap is slowest.
- **Heart-mine hits vary by seed:** 3 (seed 3) and 11 (seed 11) of about 40 drops.
- **Special screenshots:** in some, the player kart sits at the screen's bottom-right edge. This is the test's camera staging after a burst of speed, not the game.
- **Not run against C3's changes:** `cart_battle_test`, `cart_shots`, `cart_showroom_shots`.
- **No real-iPhone frame-rate check.**

## For others

- **C2:**
  - The `man` arena crashes when started outside royale mode (`aimAt` on undefined `s.roy`).
  - `'drv'`-kind hits from driver specials are C2's call in royale.
- **C1:**
  - In portrait, the driver grid leaves about 150 px empty above NEXT. It could be bigger (cosmetic).

## Interfaces others rely on

- `CART_DRIVERS[i].stat` and `.special`; `CART_ITEMS[id].driver`.
- `cartTrackPoolCar(trackId)` and `CART_TRACKS[id].car`.
- `CART_TRACK_RULES[id]`; `CART_CAREER_TRACKS.heart = 'loveparade'`.
- `CartKit.*`.
- Kart timers: `crawlT`, `mixT`, `lostT`, `trainT`, `partT`, `boredT`, `joyT`, `darkT`.

## How to run

```sh
export NODE_PATH=/Users/bradymott/brady-o/node_modules
BRADY_DIST=$S/dist-C3 node tools/build.js
BRADY_DIST=$S/dist-C3 node tools/cart_driver_test.js $S/shots-C3/drivers
BRADY_DIST=$S/dist-C3 ONLY=races|views|shots node tools/cart_track_test.js loveparade $S/shots-C3/track
BRADY_DIST=$S/dist-C3 node tools/cart_item_test.js $S/shots-C3/items [onlyId]
```

`ONLY` and `onlyId` are optional. Hold the shared test lock (`S/test.lock`) for every browser run.
