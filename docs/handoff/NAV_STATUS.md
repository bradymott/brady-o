# Burning Man navigation features: status (checkpoint, 2026-11-10)

Branch `burning-man/navigation` (worktree `$SCRATCH/wt-nav`, from origin/main 5d07239). No source code written yet:
the session was spent reading the engine and planning. The worktree is clean apart from this file.

## Already existing (verified by reading code)
- **Pause menu** (`src/40_burns_j_ui.js` buildPause/drawPause/updatePause): RESUME, MISSIONS/WHAT WHERE WHEN, SIDE QUESTS,
  BACKPACK, MAP (open world) / LEAVE (entered place) / WORLD SELECT, SETTINGS, QUIT. Two columns when the screen is short.
- **Settings** (same file): music, sfx, camera speed, invert Y, AUTO CAMERA (on by default: swings behind Brady while
  running, after 1.2 s without manual orbit, only when not running toward the camera), screen shake, CAMERA mode, graphics.
  Stored in `Save.data.burns.settings` (`BurnsSave.defaults()` in `40_burns_a_core.js`); `BurnsSave.get()` fills any
  missing settings key from defaults, so new keys are migration-safe.
- **Fast-travel map**: pause MAP -> `g.openTravelMap()` -> `BurnsHubScene({travel})`, drawn by world 500's
  `mapDraw`/`mapProject` (`src/42_burns_ow_life.js`, `BurnsOW.mapFit`, bounds x -920..920, z -920..1060). YOU dot, no heading.
- **Objectives**: `BurnsMissions` (`40_burns_i_play.js`): tracked mission, `def.target` {x,z} / actor id, `def.marker` {x,z}
  (almost every story mission has one), gated pickups `{mission}`, '!' over givers / '?' over active targets, minimap
  (needs the Playa Map item). City: 8 side quests (owIce, owLost, owPhoto, owDome, owNell, owThief, owRace, owDome2) +
  W17 quests via `BurnsOW.addQuests`.
- **City guidance already**: next story place (`BurnsOW.nextPlace()`) has a yellow light beacon and an always-on yellow
  HUD edge arrow with name + distance (`BurnsOW.drawHUD`, `42_burns_ow_city.js` ~line 822).
- **Movement**: analog stick, `BURNS_PHYS.run = 7.6` m/s at full stick (keyboard always full). The `run` clip already
  plays above 2.8 m/s; partial stick walks. No sprint. Shift is mapped to ACTION in shared `02_input.js`.
- **Camera**: modes normal/close/first/far (VIEW button, V key, settings); CAM button = recenter behind Brady.
- **Bike**: yellow bike key item from W16 (`g.giveItem('bike')`), BIKE button / B key summons it anywhere,
  12.5 m/s, accel 9 (`BurnsVehicle` in `40_burns_h_player.js`, model `BurnsBikeModel` in `40_burns_e_props.js`, 5 bones).
- Build: Art Cart bundles `40_burns_*` only (not 41/42), so engine hooks must be guarded with `typeof BurnsNav`.

## Pending PR #3 overlap (checked)
It edits i_play lines ~284 and ~935-1000 (adds frameDialogue before updateCamera, changes updateCamera's first line,
postFx), e_props 27-680 (not the bike body), m_open 1 line, ow_city pavilion/man scale/env. It does NOT touch
j_ui, h_player, a_core.

## Design decisions (planned)
- New files: `src/41_burns_nav.js` (BurnsNav: settings, guide targets, ground arrow, run, follow cam, e-bike model +
  swap, city-map page layout) and `src/42_burns_ow_nav.js` (city: `def.guide`, `def.cityMap` drawing, e-bike quest).
  One-line `typeof BurnsNav` hooks in i_play: layoutControls, syncHudButtons, update (before `p.update`), updateCamera
  (new `else if` before the autoCam branch, ~line 961), pushSprites (before fx.draw). j_ui: drawControls (RUN button),
  pause items, settings rows, 'citymap' tab. a_core: settings defaults `guide:false, follow:false, ride:'ebike'`,
  key item `ebike`. h_player: `speedMul` * `this.runK`.
- **Guide arrow**: flat cyan ground arrow (existing sprite 'arrow' via `R.flat.flat`, 0 extra draws) ~1.8 m ahead of
  Brady pointing at the primary target, distance label in 2D, pulsing ring/beam at the target. Target resolution:
  `def.guide(g)` (world override) -> tracked/active mission (`def.guide`, `m.data.guide`, talk target, '?' actor,
  nearest gated pickup, nearest tagged enemy, target, marker) -> untaken token pickup -> nearest available '!' giver;
  city falls back to the next story place. When on, it replaces the old yellow city edge arrow (wrap BurnsOW.drawHUD).
  Expose `g.navGuide {x,z,label,dist,yaw}` for tests.
- **City map**: pause MAP opens a new full-screen top-down page (own drawing reusing the fast-travel map's geometry/style;
  labels for Man, Temple, Center Camp, Root Society HOME, 10 theme camps, 8 big art, story places; Brady arrow with
  heading = canvas angle PI - yaw; pulsing rings on targets), buttons BACK / ZOOM (city / near me) / FAST TRAVEL
  (old travel map). Expose `g._cityMap` for the test.
- **Run**: touch RUN button, tap-to-toggle, auto-off after ~0.5 s stopped or on a vehicle; placed left of BIKE
  (landscape ~(643,245), portrait ~(173,691), checked clear of stick/ACTION/BIKE); Shift held = run (capture-phase
  key listener that stops Shift reaching Input's ACTION while in play). Speed x1.4 -> 10.6 m/s.
- **Follow camera** setting "CAMERA BEHIND BRADY" (off by default): damp camYaw to Brady/vehicle yaw, rate scaled by how
  forward he moves (avoids spin-chasing), settles behind when standing, holds during dialogue, never in first person,
  cutscenes/boss framing take precedence.
- **E-bike**: own model (same 5-bone layout, battery pack + LED glow sprites), BurnsVehicle with maxSpeed 18, accel 10,
  open city only (story worlds keep the tuned yellow bike); settings row CITY BIKE when owned. Unlock: city side quest
  after World 8 Hell Station (Friday): a mechanic at the Hell Station door gives a dead battery, charge it at a solar
  camp (one go-to trip) -> key item `ebike`. Constants kept in one object for easy change.
- Speeds: walk (partial stick) 2-4, jog (existing full stick) 7.6, run 10.6, bike 12.5, e-bike 18 m/s;
  crossing the city (~1 km, 2:00 to 10:00 on Firefly) ~130 s / 94 s / 79 s / 55 s (to be measured).

## Done and verified
- Nothing in code. Private build of unmodified main succeeds (`BRADY_DIST=$SCRATCH/dist-nav node tools/build.js`).
- Mission inventory of all 17 story worlds dumped (script `$SCRATCH/scr/dump_missions.js`): nearly every mission has a
  `marker`, so the generic resolution covers most worlds.

## Not started
Everything above; tools/burns_nav_test.js; BURNS_GUIDE.md updates; regression runs; screenshots.

## Resume
```
S=/private/tmp/claude-501/-Users-bradymott-brady-o/3a6f4932-f787-49ea-89b0-6aabc7eb3e90/scratchpad
cd $S/wt-nav && git log --oneline -1
BRADY_DIST=$S/dist-nav node tools/build.js
# test pattern: tools/burns_flow_test.js (rAF disabled, manual scene.update/draw stepping)
```
Next steps: write the two new files outside src, node --check, move in; add hooks; settings/defaults; test; screenshots.
