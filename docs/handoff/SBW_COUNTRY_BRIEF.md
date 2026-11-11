# Super Brady-O World: brief for a country level agent

You rewrite every level of the countries you are assigned, in the new level format, to the approved design. Brady (the owner) approved the whole plan; do not wait for sign-off. He plays on an iPhone, is not a programmer, and cares most about polish and variety.

## Read first
1. `docs/handoff/README.md` and `docs/handoff/SUPER_BRADY_O_WORLD.md`: rules, ownership, tests.
2. `docs/design/TOOLKIT_STATUS.md`: what the engine offers and how to write a level in the new format. The converted Mexico 1-1 (`src/29_tour_mx.js`) and Ecuador 2-2 (`src/29_tour_ec_levels.js`) are the working examples.
3. `docs/design/LEVEL_OVERHAUL.md`: section 0, your countries' tables in section 2 (the level lineup you must build), their graphs in section 3, their enemies in section 4, sections 5 and 6 for power-ups and objects, and the interface contract in section 7.
4. `docs/BOSS_REDESIGN.md` and `tools/boss_tests/<cc>.js` for your bosses.

## What "done" means for one country
- Every level in that country's section 2 table exists in the v2 format: the main levels plus the secret levels (`x-6`, `x-7`; Antarctica `13-5`, World 22 `22-5`), with the archetype, areas, three-beat progression, objects, enemies, power-up placements, secret rooms, three postcards and exits the table lists. Keep the good existing set pieces the table says to keep.
- No level reuses the old shared scaffold: the same start pad, the same end staircase, the same bonus room, the same castle corridor and arena. Each boss lead-in and arena is shaped for its boss, and the boss fight still passes its test.
- The country's headline enemy power and its other new behaviours (section 4) are in, using the behaviour library. Enemies new to the country exist as entity types with good procedural art and the ink outline, and use sprite art where an atlas already has it (see "Art" below).
- Every level has at least two power-up opportunities and at least one secret room or hidden area; hidden exits are hinted fairly as section 3 describes.
- The map graph for the country (`mapCell`, `mapFrom`, hidden stops, houses, exits) matches section 3 and looks right on the country panel in landscape, portrait and 568x320.
- Each level keeps showing something new to its end. A level must not feel like a flat corridor with reskinned pieces. Use height, sub-areas, and the archetype's own camera and pacing.

## Rules
- **Original content only.** Nothing may look or work like a Nintendo item, block, pipe, enemy or level. No question blocks, no shrinking, no cape or suit flight, no global timed switch.
- **Respect:** humour from food, animals, objects and folklore. Never caricature people. Temples, shrines, monasteries, minarets, churches and similar sites are distant plain background only; never stage platforming or fights in them. No Christ the Redeemer. The iron tower in France is daylight or an unlit silhouette.
- **The player is the code-drawn Brady.** Chinka and anything depicting Brady stay code-drawn.
- World 6 is "Spain" and world 7 is "France", the whole countries.
- Level ids stay `<world>-<i>`. Boss ids stay `x-5`, `13-4`, `22-4`. The secret lands still open from 8-4 (Antarctica) and 5-2 (World 22, behind the 22-postcard door).

## Files and ownership
- **Yours:** `src/29_tour_<cc>.js` (and a `src/29_tour_<cc>_levels.js` if you split it), `tools/boss_tests/<cc>.js`, and country-specific test fixtures.
- **Toolkit files** (`src/28_tour_*`, `src/09_validate.js`, `src/12_play.js`, `src/10*`, `src/11_player.js`, `src/00_core.js`) belong to the toolkit maintainer, the Mexico and Ecuador agent. Other agents: if the toolkit lacks something or has a bug, make the smallest additive fix in its own commit, describe it in your report, and carry on. Never rework toolkit code.
- **Shared tests** (`tools/gameplay_test.js`, `tools/validate_levels.js`, `tools/sbw_*`): if a hard-coded total (68 levels and so on) blocks you, make that assertion derive from the game data in a small commit of its own, so parallel agents do not conflict.
- **Never edit** `src/40`–`src/43`, the art pipeline, or other countries' files.

## Art
- Atlases are wired by name through `src/30_tour_sprites.js`. Extra art already exists for the overhaul and is not referenced yet: new theme atlases (for example `ma_azul`, `es_teide`, `jp_fuji`, `id_rimba`, `vn_mekong`, `np_khadal`) and new enemies in `<cc>_x` atlases. List `assets/sprites/super-brady-o-world/` and read the headers of `tools/blender/sprites/<cc>_extras.py` to see what exists for your countries, and wire it (theme entries for new theme keys; the enemy's atlas pointed at `<cc>_x`), keeping procedural art as the fallback.
- Do not run Blender. Where art is missing, draw it procedurally with the ink outline and make it look deliberate, then list what is missing in your report for the art agents.

## Working method
- Own worktree and branch from `origin/main`: `sbw/levels-<cc>-<cc>`. Symlink `node_modules` from the main checkout (leave it untracked). Build with a private `BRADY_DIST` in the scratchpad, and pass scratchpad folders for test screenshots (`gameplay_test.js` takes one as argv[2], `boss_test.js` takes `--shots dir`, `apps_test.js` takes argv[3]).
- Write big files elsewhere, run `node --check`, then move them into `src/`.
- One level at a time: write it, validate it, play it in the browser with a scripted run, and capture a panorama of the whole level plus phone-size shots (pin full resolution before capturing; see `tools/sbw_toolkit_shots.js`). **Look at the pictures** and fix what reads badly: unclear walkable ground, busy backgrounds behind platforms, enemies or Brady that do not pop, empty stretches, unfair jumps, secrets with no hint.
- Small commits ending with `Co-Authored-By: Claude <noreply@anthropic.com>`. Finish and push one country (all suites passing) before starting the next. Merge `origin/main` into your branch at each milestone. Never push to `main`.
- Suites before every push: `validate_levels`, `gameplay_test`, `boss_test`, `apps_test`, `sbw_graphics_test`, `sbw_atlas_test`, `sbw_toolkit_test`, `BRADY_DIST=… node tools/sbw_toolkit_shots.js <dir> --checks` (about 100 in-browser checks of the toolkit objects, behaviours and shipped levels in under a minute; exits 1 on any failure; drop `--checks` for the screenshots), and the snapshot test (update its baseline for the levels you changed on purpose).
- If your context runs low, stop at a pushed, passing milestone.

## Report
Per country: the levels built (id, name, archetype, one line each), what differs from the design and why, toolkit fixes you made, art that is missing, exact test results, commit hashes, and absolute paths to the most telling screenshots with a one-line verdict each.
