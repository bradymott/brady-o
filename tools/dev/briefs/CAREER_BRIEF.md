# Art Cart career/royale build: shared brief for all agents

Art Cart is a web kart-style battle racer (12 Blender-built art cars, 8 tracks, 7 battle arenas, gift-box items, car specials) on the in-house WebGL2 "Burns" engine, shipped as a PWA. Owner: Brady, not a programmer, plays on an iPhone, wants a very polished and FUN game; nothing may look basic, square or boxy unless boxy is the point.

Work ONLY in the git worktree /Users/bradymott/brady-o-artcart (never /Users/bradymott/brady-o). Do NOT git commit, stash, checkout or reset; leave changes in the working tree. S = /private/tmp/claude-501/-Users-bradymott-brady-o/300b6139-7b8a-41ee-8c06-1aa73a659be0/scratchpad (use S/dist-<tag>, S/shots-<tag>).

## Read first
- docs/ART_CART_CAREER.md — THE DESIGN. Follow it; "(default)" marks choices you may refine but not reverse. Starting ideas in its tables are yours to improve.
- docs/handoff/README.md, docs/handoff/ART_CART.md
- Code: src/43_cart_a_data.js (cars, drivers, items, cups, arenas, save), src/43_cart_c_world.js + src/43_cart_ca_decor.js (tracks, decor kit, instancer), src/43_cart_d_sim.js (simulation, AI, hits, objectives), src/43_cart_da_items.js (items, car specials, effects, HUD cues, debug helpers — the model for self-contained feature files), src/43_cart_e_scene.js (render, HUD, pause, debug API `window.BRADY_CART.debug`), src/43_cart_f_menu.js (menus, showroom, power-ups guide), src/43_cart_g_*.js (arenas that register themselves), tools/cart_item_test.js and tools/cart_battle_test.js (how tests drive the game).

## Three agents work at the same time
- C1 "framework": modes, progression, save, stat points, menus, secret-level gating, career final (Burn the Man). Owns src/43_cart_f_menu.js, the structure of src/43_cart_a_data.js, new src/43_cart_h_career.js.
- C2 "royale": Battle Royale rules (health, knock-outs, AI targeting), the Bass Valentine royale arena, the Man boss final. Owns new src/43_cart_i_royale*.js.
- C3 "drivers + first track": drivers cut to 12 with specials and stat point; Bass Valentine's career track with its unique obstacles and enemies. Owns new src/43_cart_j_*.js files, driver entries in a_data, driver-special code beside the car specials.
Interfaces: each feature registers itself in a small global registry created with `typeof X === 'undefined'` guards so load order doesn't matter (e.g. `CART_CAREER_TRACKS[carId] = trackId`, `CART_ROYALE_ARENAS[carId] = arenaId`), and every stage must be startable directly through the debug API without the menus (e.g. `debug.start({ mode: 'career', track })`, `debug.start({ mode: 'royale', arena })`). C1 defines the registries and the flow; C2 and C3 make their parts work stand-alone and plug in when C1's file exists (look for it; re-check near the end). Where a car has no level yet, C1 uses an existing track/arena as a stand-in.
Shared files (a_data, d_sim, e_scene): small local hooks only; re-read right before editing; never reformat or revert others' changes. Write large new code in your own new files (check tools/build.js for how art-cart modules are picked up; file names sort the load order), `node --check` before a file lands in src/ — a half-written file breaks every app's build. If the build fails because of another agent's half-written file, wait a minute and retry; don't fix their file.

## Rules
- Do NOT edit src/40_*, src/41_*, src/42_* (shared engine / another game). Requests go in your report.
- Original content only, no brand names, never copy another game's items, characters, levels or mechanics-with-identity. PG-13: knock-outs are cartoon (lights out, poof), never gore.
- iPhone budgets: every view ≤ 420k triangles and ≤ 120 draw calls; no per-frame allocations in update/render loops (the code preallocates scratch; match it and the surrounding dense, commented style). Procedural geometry through the decor/instancer kit; no Blender needed.
- Existing modes, items, tracks and saved games must keep working. Existing tests must keep passing.
- Fun first: play your own work through the debug API and by reading screenshots; fix what is confusing, unfair or dull.

## Build and test
`export NODE_PATH=/Users/bradymott/brady-o/node_modules`; `BRADY_DIST=S/dist-<tag> node tools/build.js`; always pass output dirs to tools (defaults write into the repo). Run tools/apps_test.js <siteDir> <shotsDir>, tools/cart_item_test.js, tools/cart_battle_test.js, tools/cart_shots.js, tools/cart_showroom_shots.js. Add your own automated test (tools/cart_<yourpart>_test.js) that plays your feature through the debug API, asserts real outcomes, and exits non-zero on failure or page error. Take screenshots (phone landscape 844x390 and portrait 390x844 where UI is involved), Read them and iterate. The machine is shared and slow when several agents test at once; a timeout is not a pass — rerun.

## Final report
Plain and factual: what you built, how it plays, test results with real numbers (including peak tris/draws), absolute paths of screenshots, balance notes, what is weak or unfinished, files changed, engine requests, and anything the other two agents or the organizer must know. Separate verified from inferred.
