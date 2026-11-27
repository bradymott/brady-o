# Brief: build one land of the Encore Tour for Super Brady-O World

You are building ONE new land (six levels and a boss) for a 2D platformer web game called Super Brady-O World. Four other agents are building four other lands at the same time, each in its own git worktree. You know nothing else about this project, so read what this brief points to before writing code.

## Who it is for
Brady owns the game, plays it on an iPhone and is not a programmer. He asked for "a bunch more levels that are very different from one another", "new countries, new level types and new worlds", that "get progressively harder so that the game will be fun and challenging to play towards the end". He cares most about polish, variety and fun. The game already has 102 hand-made levels in 17 lands; yours must stand beside them.

## Read first (in your worktree)
1. `docs/design/ENCORE_TOUR.md`: THE design brief. The story, your land's six levels, the difficulty target for your land, the rules. Read all of it, then your land's table again.
2. `docs/design/TOOLKIT_STATUS.md`: what the level engine offers and how to write a level (generators, pieces, entity types, behaviours, area systems, the validator's primitives).
3. `docs/handoff/SBW_COUNTRY_BRIEF.md` (working method, what "done" means) and `docs/handoff/README.md` sections 4 and 5 (appearance and ground rules).
4. The working examples of a self-contained, code-drawn land, to copy the structure from: `src/29_tour_eye.js` + `src/29_tour_eye_levels.js` (The Red-Eye), `src/29_tour_lost.js` + `src/29_tour_lost_levels.js`, `src/29_tour_fest.js` + `src/29_tour_fest_levels.js`; their tests `tools/boss_tests/eye.js`, `tools/sbw_eye_shots.js`, `tools/sbw_lost_shots.js`. Those three are "bonus" lands (`secret: true, bonus: true`, `arch: 'bonus'`, `Tour.addStop`). Yours is an ordinary MAIN land: its stop is already in `TOUR_ROUTE` in `src/28_tour_a_core.js` (do not call `Tour.addStop`, do not set `secret` or `bonus` on the country), and each level has a real, new `arch` name. For how a main land lays out main levels, the boss as the last main level and `secret: true` levels after it, look at `src/29_tour_ec_levels.js`.
5. As needed: `docs/design/LEVEL_OVERHAUL.md` sections 5 to 7 (power-ups, objects, the interface contract), `docs/design/SECRET_ROOMS.md`, `docs/design/SECRETS_CONTRACTS.md`, `docs/BOSS_REDESIGN.md`.

## Your files
- Yours to create: `src/29_tour_<cc>.js`, `src/29_tour_<cc>_levels.js` (more `src/29_tour_<cc>_*.js` files if a file gets long), `tools/boss_tests/<cc>.js`, `tools/sbw_<cc>_shots.js`.
- Shared lists, a few lines each in one clearly commented block for your land (four other branches edit the same files and must merge cleanly): `src/28_tour_sc_hats.js` (`TourHats.HEADS` / `TourHats.NOT`), `tools/sbw_hits_test.js` (safe touches). If another shared test has a hard-coded list or total that blocks you, make the smallest additive edit and report it.
- Never edit: `src/40`-`src/43`, `src/28_tour_b_build.js`, any other land's `src/29_tour_*` files, `docs/design/ENCORE_TOUR.md`, the save key. If the toolkit truly lacks something, add it by wrapping from your own file; if that is impossible, make the smallest additive fix to the toolkit file in its own commit and report it.
- All files are joined in name order into one script. A file that fails `node --check` breaks the whole game: write big files outside `src/` (your dist folder is fine), run `node --check`, then move them in.

## The machine
- A Linux cloud container, 4 CPU cores shared by five agents. No Blender, no WebKit (Chromium only): all art is code-drawn on canvas in the flat "Fiesta Toon" look with the dark ink outline, like the three bonus lands.
- Build privately: `BRADY_DIST=/home/user/wt/dist-<cc> node tools/build.js` (about 5 s). Run every tool with the same `BRADY_DIST`.
- `require('playwright')` works from any folder; `chromium.launch()` needs no options. Never install Playwright or browsers.
- **Browser tools run one at a time across all five agents.** Before any tool that opens a browser: `mkdir /home/user/wt/test.lock` (retry with a short wait until it succeeds), and `rmdir /home/user/wt/test.lock` straight after, also when the tool fails. Hold it for one tool run, a few minutes at most. If the lock has existed for more than 20 minutes it is stale: remove it. Node-only tools (`validate_levels`, `dump_level`, `sbw_toolkit_test`, `sbw_hats_test`, `sbw_hits_test`, `save_test`) need no lock.
- The level checker over the whole game takes over 15 minutes here. Check your own levels: `node tools/validate_levels.js <w>-1 <w>-2 … --jobs 2`. `node tools/dump_level.js <id>` prints a level as ASCII with the reachable spots.
- New browser tools must call `silence(context)` from `tools/sbw_silent.js` before `page.goto`.
- Commit early and often on your branch (the container can be reclaimed; uncommitted work is lost). Small commits, each message ending with the line `Co-Authored-By: Claude <noreply@anthropic.com>`. **Do not push, do not merge, do not touch other worktrees.** Do not start sub-agents.

## What "done" means
1. Six levels as `docs/design/ENCORE_TOUR.md` describes for your land: x-1 to x-4 (each a new `arch`), x-5 the boss (`arch: 'lair'`, the last main level), x-6 the secret level (`secret: true`), reached by a fairly hinted hidden exit in one of x-1 to x-4. Each new level type is a real mechanic the player controls, coded in your files, that feels different in the hands from every other level in the game. Register each arch label: `Object.assign(TourLandscape.ARCH_LABEL, {...})`.
2. The level checker proves every level finishable, with all three postcards, every area and every exit reached, pace and power-up budget passing. Where your mechanic lets Brady go somewhere the checker cannot work out, tell it with its own primitives (ghosts, `B.edge`, `B.vkey`, `B.toggle`, zones; see how the bonus lands and `src/28_tour_p*.js` do it). **Never tell the checker something the player cannot really do**: your shots tool must play that same stretch in the real game and get across.
3. The look: your own themes, painted backdrops (several layers, parallax), tiles, props and at least four new critters, code-drawn, inked, readable on a phone. Walkable ground must read at a glance; enemies and Brady must pop from the backdrop.
4. The boss: a fight whose mechanic comes from the land, in its own arena, with tells; `tools/boss_tests/<cc>.js` passes under `node tools/boss_test.js <cc>`.
5. The land's walkable overworld map (`TOUR_OW_MAPS.<cc>` plus its painting hooks, as the bonus lands do), the route-map pin, the arrival postcard text from Chinka-O, music tracks.
6. The difficulty target for your land in `ENCORE_TOUR.md` section 3, met fairly: teach, test, twist. Play each level with a script the way a player would and judge it honestly: is it fun, is it readable, is any jump unfair, is any stretch empty?
7. `tools/sbw_<cc>_shots.js <outdir> [--checks]`: plays each level's new mechanic in the browser (real inputs through the game loop, not teleporting past the hard part), checks it, and saves phone-size screenshots (844x390 landscape for every level, 390x844 portrait for at least the first level, the boss and the map) plus a panorama of each level. **Open the screenshots with the Read tool and look at them yourself.** Fix what reads badly, then look again. A visual bug once passed every check in this project.
8. These pass with your build: `node tools/validate_levels.js <your six ids> --jobs 2`, `node tools/boss_test.js <cc>`, `node tools/sbw_<cc>_shots.js <outdir> --checks`, `node tools/sbw_hats_test.js`, `node tools/sbw_hits_test.js`, `node tools/sbw_toolkit_test.js`, `node tools/save_test.js`, `node tools/apps_test.js`, `node tools/sbw_overworld_test.js`, `node tools/sbw_soak_test.js --jobs 1 --levels <your six ids>`, `node tools/gameplay_test.js <shots dir>`. Zero page errors.
9. Extras, only after 1 to 8 are solid, in the order `ENCORE_TOUR.md` section 5 item 7 gives.

Work one level at a time: write it, validate it, play it in the browser, look at it, fix it, commit it. Get x-1 fully working end to end (building, validating, playable, looked at) before starting x-2: it proves your land's skeleton. If your context is running low, stop at a committed, passing state and say exactly what is left.

## Your report (your final message; it goes to the organising agent, not to Brady)
- Per level: id, name, arch, one line on how it plays and what makes it hard.
- The boss: mechanic, phases.
- What differs from `ENCORE_TOUR.md` and why.
- Every edit outside your own files (file, lines, why).
- Exact test results (command and its last line), and anything failing or skipped, plainly.
- Absolute paths of the most telling screenshots, one line of honest verdict each.
- What is not done, and known rough edges.
- Your branch's last commit hash.
