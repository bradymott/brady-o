# WIP — C1 "framework" (Art Cart career / royale / secret levels), Nov 19 2026

Design: `docs/ART_CART_CAREER.md`. Changes are in the working tree of this worktree (the organizer commits).
Scratchpad S = `/private/tmp/claude-501/-Users-bradymott-brady-o/525dd309-9ce0-46f8-a74e-5f850617a07d/scratchpad` (dist `S/dist-C1`, shots `S/shots-C1`).

## Files (C1)
- `src/43_cart_h_career.js`: registries, per-car save (`Save.data.cart.prog[carId]`), run order, stage options, results/verdict panel, stat points, secret-level gating, game-won state, hooks wrapping `CartRaceScene.finishRace / buildButtons / drawResults / leave`, debug API `BRADY_CART.debug.career`.
- `src/43_cart_hb_final.js`: the career final, BURN THE MAN (`CART_RACE_RULES.plunger`).
- `src/43_cart_hc_screens.js`: menu screens (quick, run map, secret, secretGames, garage, prize, complete).
- `src/43_cart_f_menu.js`: home menu and flows. `cartMenuArenas()` hides `royale: true` arenas (Sound Camp, the Man) from the old battle grid and the power-ups guide.
- Small hooks in shared files: d_sim, e_scene, a_data (see git diff).
- Tests: `tools/cart_career_test.js` (52 checks) and `tools/cart_battle_test.js` (secret-level arenas × 3 games).

## Nov 19 round (after the origin/main merge)
- Fixed:
  - royale arenas are hidden from the battle / objective grids and the ARENA POWERS tab;
  - the results panel always shows the player's row when the list is cut (in portrait, 8th place was invisible);
  - secret-levels portrait cards (the car name was hidden behind the chip);
  - prize portrait (the medal text sat under the buttons);
  - garage landscape (the car ran off the bottom);
  - the landscape burn camera is closer, so the Man fills the view;
  - the celebration landscape car is bigger.
- Every registry now plugs in by assignment. That includes `CART_SECRET_LEVELS`, which was a `const` and is now a guarded `var` with defaults. The arena tidy re-runs when a menu opens or a secret stage starts, so a secret arena registered by a later file is picked up.
- Test additions:
  - a full Career and a full Battle Royale with Octo (stand-ins for every car except Bass Valentine) play every stage for 1.5 s on autopilot and pass;
  - every royale stage plays in royale mode and returns C2's `royaleResult`;
  - the royale final honours `s.stageWon`: the Man not destroyed is a loss with RETRY, destroyed is a win;
  - registering a career track, royale arena or secret level at runtime takes effect.

## Verified (Nov 19)
- cart_career_test: 52/52 ok, exit 0. This includes the old-save checks: trophies, best times and wins kept, a removed driver id falls back to brady, progress starts empty.
- Other tool results: see the C1 report of Nov 19.

## How a level plugs in (assign in your own file; never redeclare with const/let)
- Career track: add the track to `CART_TRACKS`, then `CART_CAREER_TRACKS[carId] = trackId`.
- Royale arena: push the arena into `CART_ARENAS` with `royale: true` (this keeps it off the old battle menu), then `CART_ROYALE_ARENAS[carId] = arenaId`.
- Secret level: push the arena into `CART_ARENAS` (no `royale` flag) and add its own game to `CART_OBJECTIVES`, then `CART_SECRET_LEVELS[carId] = { arena: arenaId, game: objectiveId }`. Game null means "coming soon". Vibe Check and Glow Grab are added automatically.
- The run map's `*` stand-in mark disappears by itself. Saves with a run in progress pick up new levels at the next stage they play, because levels are resolved at play time, not at run start.

## Weak / open
- 11 cars still play stand-in tracks and arenas. 5 cars have no secret arena ("coming soon"). Bass Valentine's own secret game is not built.
- Forced (debug) wins show estimated times out of order. This is debug only.
- The old `arena` / `objective` menu states can't be reached from the home menu. The hill/flag code is dormant, not deleted.
- The plunger final's balance has not been tried by Brady (CART_PLG in hb_final).

## How to run
```
export NODE_PATH=/Users/bradymott/brady-o/node_modules
BRADY_DIST=$S/dist-C1 node tools/build.js
BRADY_DIST=$S/dist-C1 node tools/cart_career_test.js $S/shots-C1
```
Debug: `BRADY_CART.debug.career.{reset,start,run,prog,stage,opts,play,playSecret,win(place),lose,press(label),points,alloc,kart,secret,complete,final,plunge,menu}` (`win`/`plunge` are dev-only).
