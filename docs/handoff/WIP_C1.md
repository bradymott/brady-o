# WIP — C1 "framework" (Art Cart career / royale / secret levels), Nov 11 2026

Design: `docs/ART_CART_CAREER.md` (sections 1, 2 "Burn the Man", 5 gating, 6). Nothing committed; all in the working tree of this worktree.

## Files
- NEW `src/43_cart_h_career.js` — registries, per-car save (`Save.data.cart.prog[carId]`), run order, stage options, results/verdict panel, stat points, secret-level gating, game-won state, hooks wrapping `CartRaceScene.finishRace / buildButtons / drawResults / leave`, debug API `BRADY_CART.debug.career`.
- NEW `src/43_cart_hb_final.js` — `CART_RACE_RULES.plunger`: the career final BURN THE MAN on the `burn` track (plungers, AI, HUD, pointer, minimap dots, fuse, ignition, fireworks, camera on the Man, results).
- NEW `src/43_cart_hc_screens.js` — menu screens (methods on `KartMenuScene`): quick, run map, secret, secretGames, garage, prize, complete; 3D car thumbnails atlas (`carThumbs`).
- `src/43_cart_f_menu.js` (mine) — new home (CAREER · BATTLE ROYALE · SECRET LEVELS · QUICK RACE · POWER-UPS + settings), flows, dispatch to `layout_/draw_/update_<state>`, GARAGE button + progress chips on the car card, stat pips (car / driver / points). Someone else renamed the logo to SUPER ART KART in this file — kept.
- Small hooks in shared files: `src/43_cart_d_sim.js` (retired objectives → vibe; `this.run`, `poolCar = opts.levelCar`, `opts.final` → `CART_RACE_RULES`; career grid start at back; `cartAiScale`; `manHold`; `rules.noLaps`; `rules.aiOffset`; removed hill/flag lines from `aiArena`), `src/43_cart_e_scene.js` (intro sub `CartCareer.introSub`, `rules.desc`, `rules.noRaceHud`, `rules.camera`), `src/43_cart_a_data.js` (header comment only).
- Tests: NEW `tools/cart_career_test.js`; `tools/cart_battle_test.js` now runs only secret-level arenas × their 3 games and fails if hill/flag reappear.

## DONE and verified (cart_career_test: 47/47 ok, exit 0, run 2; cart_battle_test ok; showroom shots ok)
- Run order rules (own level first, 11 shuffled once and saved, final last), lose/retry, top-3 advance, CONTINUE → map, save + resume across reload, 13-stage map.
- Level's special in everyone's pool (≈9% of rival rolls on Bass Valentine's level, 0 elsewhere).
- Burn the Man to completion: 3 pushes → fuse → Man ignites (burn > 0.5), results, Career won, +1 stat point, prize screen. Balance (autopilot player vs real AI, 12 seeds): player wins 6/12, 30–118 s.
- Stat points: +1 speed pip = +0.75 vmax; re-assign to accel = +2.7 acc; applies in TT; AI skill +0.007/point; driver `.stat` pip (Brady speed) applies.
- Battle Royale run via C2's `mode:'royale'` (CART_STAGE_MODES.royale is set by C2): 13 stages, final, +1 point, secret unlocked.
- Secret gating: locked until Royale won; Turbo Escargot = Trick Attack/Vibe/Glow in Bowl-O-Rama; 2nd place doesn't clear; all 3 → game won → celebration. Five cars without an arena + Bass Valentine's own playa game show "coming soon".
- Old save loads (trophies, best, wins kept; removed driver → brady). No hill/flag on any arena; a scene asked for hill plays vibe.
- Perf, Burn the Man at gfx high: peak 88 draws / 403k tris (start grid; the burn track grid was already the busiest view), burning ≈ 62 draws / 255k.
- Screenshots (844x390 `-land`, 390x844 `-port`): `/private/tmp/claude-501/-Users-bradymott-brady-o/300b6139-7b8a-41ee-8c06-1aa73a659be0/scratchpad/shots-C1/`.

## NOT verified at the stop (machine load avg ~58, everything timed out — a timeout is not a pass)
- `tools/cart_item_test.js`, `tools/cart_shots.js`: timed out booting; rerun. `tools/apps_test.js` PASSED at the stop on the final build (all three apps).
- Last edits after the 47/47 run, not screenshot-checked: closer camera + extra flames during the burn (`hb_final.draw/camera`), driver pip restyle (`cartPip`), portrait NEW RUN button moved to top right, secret-games portrait subtitle, prize/complete layout, `debug.career.win` forcing `stageWon` for self-deciding finals. All pass `node --check`; the build succeeds.

## HALF-DONE / weak
- Run map shows stand-in tracks/arenas marked `*` (registries default to existing tracks/arenas; C3/C2 override per car: heart → `loveparade`, heart royale → `sound`, man royale → `man`).
- Results in forced (debug) wins show estimated times out of order — debug only.
- The old `arena` / `objective` menu states still exist (unreachable); hill/flag sim/HUD code is dormant, not deleted.
- Burn moment: the career-test burn shot shows it, but the burn could be bigger still (owner review).

## NOT STARTED from my scope
- Nothing major; polish pass on the new screens with Brady.

## Interfaces others rely on (assign, never redeclare with const/let — one bundle scope)
- `CART_CAREER_TRACKS[carId] = trackId`, `CART_ROYALE_ARENAS[carId] = arenaId` ('man' = finals), `CART_STAGE_MODES.royale = true`, `CART_RACE_RULES[id]` (picked by `opts.final`).
- Stage opts: `opts.run = { car, kind, stage, owner, seed, game }`, `opts.levelCar` → `s.poolCar`. A scene may set `s.stageWon` (C2's royale final does: Man destroyed).
- `cartKartStats(car, drv, fOrPlayer)` is defined in h_career (car + stat points + driver `.stat`, max 5). No other file may declare it.
- Driver ids are never hard-coded (read from `CART_DRIVERS`).

## How to run
```
export NODE_PATH=/Users/bradymott/brady-o/node_modules; S=<scratchpad>
BRADY_DIST=$S/dist-C1 node tools/build.js
BRADY_DIST=$S/dist-C1 node tools/cart_career_test.js $S/shots-C1      # ~10–25 min on a loaded machine
BRADY_DIST=$S/dist-C1 node tools/cart_battle_test.js $S/shots-C1-battle "" 25
```
Debug: `BRADY_CART.debug.career.{reset,start,run,prog,stage,opts,play,playSecret,win(place),lose,press(label),points,alloc,kart,secret,complete,final,plunge,menu}` (`win`/`plunge` are dev-only).

## Next steps for a fresh agent
1. On a quiet machine rerun build, cart_career_test, cart_item_test, cart_battle_test, cart_shots, apps_test; Read the career screenshots (esp. `final-burn-*`, `prize-*`, `run-map-*-port`, `garage-*`) and fix anything cramped.
2. Show Brady the flow; tune the plunger final (CART_PLG in hb_final: spacing 120–190 m, AI aim 15–45%).
3. When C2/C3 add more levels they only assign the registries; the map's `*` stand-in marks disappear by themselves.
