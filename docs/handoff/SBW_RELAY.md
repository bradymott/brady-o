# Super Brady-O World: relay to the next agent (11 Nov 2026)

You are taking over the Super Brady-O World work from a long session that ran out of room. Everything you need is in this file and the files it points to. A copy of this note is on Brady's Desktop as `BRADY-O-RELAY.md`.

## How Brady starts you
In a terminal: `cd ~/brady-o`, then `claude`, then paste:

> Read docs/handoff/SBW_RELAY.md and continue the Super Brady-O World work from where it stopped. Use Opus agents for the heavy lifting.

## Who you are working for
- Brady (GitHub `bradymott`) owns the game, plays on an iPhone and is not a programmer. Talk plainly, show screenshots, not code.
- Graphics, polish and silly PG-13 humour are his priorities. He liked the secret areas and the overall direction ("very creative and fun").
- **He has approved the whole plan: do not wait for sign-off.** Merge, push and deploy as work passes its tests; he plays it and asks for edits afterwards. Pushes and gh-pages deploys are pre-authorised.
- He asked for the main session to organise and **Opus agents to do the heavy lifting**, each in its own git worktree and branch (`sbw/...`), several in parallel. Give each agent a full brief (it knows nothing else), tell it which files other agents are editing, and have it report test results and screenshot paths. Look at the screenshots yourself before merging.

## Read first
1. `docs/handoff/README.md`: rules, ownership, deploy.
2. `docs/handoff/SBW_RESUME.md`: what shipped and the test list.
3. `docs/handoff/SBW_COUNTRY_BRIEF.md`, `docs/design/LEVEL_OVERHAUL.md`, `docs/design/TOOLKIT_STATUS.md`: the level format and design.
4. `docs/ART_READABILITY.md`, `docs/SPRITE_BRIEF.md`: the sprite look and the Blender route.

## State of `main` (deployed)
Live at https://bradymott.github.io/brady-o/super-brady-o-world/. All 14 lands rebuilt (88 levels), all in Fiesta Toon, walkable overworld map, power picker, joint/acid/mushroom trips, three jump powers, readability pass, freeze safety net. Last full suite on `main`: all passing (88 levels finishable, gameplay 52/52, bosses 172/172).

## Four branches are finished or nearly finished but NOT merged or deployed
All four are pushed to origin. They were checkpointed mid-verification when Brady had to close his computer. **Your first job is to finish verifying them, merge them into `main` in the order below, and deploy.** Run suites on a quiet machine, one branch at a time.

### 1. `sbw/items-fix` (tip afd2d2d): Brady's bug reports. Merge first.
Done on the branch:
- Power-ups no longer get stuck in a ceiling above a gift box: the item comes out of an open side (`ItemSpace` in `src/10_entities.js`). 13 boxes were affected; new test `tools/sbw_items_test.js`.
- Mushroom effect restored to the old look Brady preferred: the level itself goes multicoloured and wobbly (`TripFX.shroom` in `src/15_postfx.js`). Grow transition no longer strobes; the mushroom item is redrawn in toon style.
- Gift boxes open from any side (`src/28_tour_dj_boxes.js`): land on top, hit with anything thrown, Pound Cake, or kick with the action button.
- Updrafts: holding down cancels the lift, and a lift that pins Brady to a ceiling lets go (`src/07_physics.js`).

Still to do: on the tip, run `sbw_soak_test` (rerun failing levels alone), `save_test`, `sbw_snapshot`, `levels_br_mz_test`, `levels_aq_w22_test`, `sbw_toolkit_shots <dir> --checks`, `sbw_items_test`. Everything else passed.

### 2. `sbw/perf` (tip d611d94): smoothness. Merge second.
Brady reported lag in the Mexico boss level and in Brazil. Found: the ink-outline scratch canvases only ever grew, so after a boss or a big Brazil prop every outlined sprite drew from a huge canvas; everything was re-outlined every frame; bosses outlined a box far bigger than their art; heavy backdrop overdraw. Fixed, with the look unchanged at High (before/after screenshots differ on under 0.1% of pixels). Paired Mac measurements: levels cost 0.5–0.85x of before, bosses 0.25–0.65x (Mexico boss 0.65–0.84x). Adds graphics tiers (AUTO / HIGH / MEDIUM / LOW, `src/14_quality.js`), an FPS COUNTER setting, `tools/sbw_perf_test.js`, `docs/PERFORMANCE.md`, `docs/perf/`.

Still to do:
- It conflicts with `sbw/items-fix` in `src/15_postfx.js` and `src/12_play.js`. The items agent's exact lines: `15_postfx.js` mushroom envelope, `k = L.lsd`, `const lsd = true`, mushroom removed from the breath amp, the old mushroom block replaced by one call, new methods `shroomK`/`shroom`; `12_play.js` `ItemSpace.fromBlock` in `bumpBlock` and `bumpOf` using `b.amp || 8`. Keep both sides. Make the restored mushroom effect respect the tiers (no wobble at Medium and below is acceptable).
- Run the full suite on the merged result.
- `node tools/sbw_perf_test.js --short --write-baseline`, commit `tools/perf_baseline.json`, then check `--short` passes. The guard fails with "no baseline" until then.
- Boss fights at High are still about 1.1–1.4x the cost of Mexico 1-1 (which Brady found smooth); at Medium most are at or under it. AUTO should handle this, but it is unproven on a phone.
- Not started: the overworld's one-off repaint after a reveal (about 80–100 ms on the Mac).

### 3. `sbw/title-icon` (tip fca679a): new title screen and icon. Merge third.
New animated title (`src/28_tour_gt_title.js`): chunky logo with a globe for the O, Brady jogging on a spinning toon globe with landmarks, the Baron's blimp, TAP TO PLAY / CONTINUE, a plane take-off into the map. New icon: Brady's grinning face with man bun and shades on a globe and sunburst (candidate "head", chosen from three). Previews are on Brady's Desktop in `brady-o-title-icon-preview/`.

Still to do: run `sbw_soak_test`, `save_test`, `sbw_snapshot`, `levels_br_mz_test`, `levels_aq_w22_test`, `sbw_toolkit_shots --checks`; re-run `apps_test` and confirm all three apps pass (only two PASS lines were recorded); shoot the take-off in portrait and 568x320 (`tools/title_icon/`). After deploying, tell Brady to remove and re-add the home-screen icon to see the new one. The home-screen label was left unchanged.

### 4. `sbw/music-pilot` (tip 985c183): new music for the title, the map and Mexico. Merge last, after Brady has listened.
Brady asked for catchier, more pleasing music and was told this is a pilot he will hear before any rollout. A main motif (scale degrees 5 6 | 1 3 2 1 6 | 5) ties the title, map and Mexico together; loops are 50–77 s; new instruments and mix, used only by songs marked `v2: 1`. Listening page on his Desktop: `brady-o-music-preview/after/listen_ab.html`. Recipe for the other lands: `docs/MUSIC.md` (on the branch).

Still to do:
- Ask Brady whether he likes the direction before rolling out to the other 13 lands (about half a day to a day of agent time per land, plus the results/ending/credits cues).
- Run `tools/sbw_audio_test.js` (about 15 min) and the suites not reached. Two old songs (`star`, `tour_id_boss`) differ from the pre-pilot engine by just over the 1e-5 tolerance; confirm it is reverb noise and loosen to 1e-4 if so.
- The canal, cenote and volcano songs never play: tour levels use `spec.music || country.music.level` (`src/28_tour_b_build.js:38`), so a theme's `music:` is ignored. Add `music:` to the specs of 1-2, 1-3, 1-4 and 1-6 in `src/29_tour_mx_levels.js`, or make the builder honour the theme's music.
- A click at the start of notes is fixed for v2 songs only. The same click exists in Burning Man and Art Cart; fixing it there changes their sound, so ask Brady.

## Then ask Brady (he has not answered these)
- Is it smooth on his phone? Have him turn on FPS COUNTER in Settings and read it in the Mexico boss arena, Brazil 3-1 and 3-5, on AUTO and on HIGH.
- Are the sprites readable enough now? If not: grow enemies relative to tiles (hitboxes too, then re-validate) and recolour enemies that match their backdrop.
- Does he like the new music direction, the title screen and the icon pick?
- Names invented by agents: Spring Socks, Pound Cake, Magic Beans; Berrad the Magnificent (Morocco's boss).
- Does he want his save reset now that every land is rebuilt? (It was not reset a second time.)

## After that: the remaining polish list
See "Open items" in `docs/handoff/SBW_RESUME.md`: bosses and mini-bosses are still code-drawn, many objects and room interiors too; some art re-renders are wanted; Bali, Antarctica and World 22 overworld maps are sparse; nothing has ever been verified on a real iPhone by an agent.

## How to work safely (learned the hard way)
- **Tests, one at a time, on a quiet machine.** Several agents running suites at once push the Mac's load past 40 and cause timing failures. The soak test in particular: rerun any failing level alone before believing it.
- Full suite before every merge: `validate_levels --rules`, `gameplay_test <shots>`, `boss_test --shots <dir>`, `apps_test "" <dir>`, `sbw_graphics_test`, `sbw_atlas_test`, `sbw_toolkit_test`, `sbw_powers_test`, `sbw_overworld_test`, `sbw_soak_test`, `save_test`, `sbw_snapshot`, `levels_br_mz_test`, `levels_aq_w22_test`, `sbw_toolkit_shots <outdir> --checks` (the first argument is the output folder), plus `sbw_items_test`, `sbw_perf_test --short` and `sbw_audio_test` once their branches land. Build privately with `BRADY_DIST=<folder>`.
- **Look at screenshots, not only pass counts.** Pin full resolution before capturing (see `tools/sbw_toolkit_shots.js`).
- **Deploy:** build from tested `main`, then on the `gh-pages` branch (use a worktree) replace only the `super-brady-o-world/` folder with `dist/site/super-brady-o-world`, commit, push. The Art Cart agent also pushes to `main`: fetch and merge before pushing.
- **Blender:** a private GUI instance per job through `tools/blender/sprites/gui/bl.sh` / `build_country.sh <cc> <workdir> [parts]`. Never `blender -b` (it crashes on this Mac) and never the shared Blender MCP window.
- **Rules that must hold:** original content only (nothing resembling Nintendo); the player is always the code-drawn Brady (black tee and trousers, man bun, square shades, blackwork 3/4 sleeves); never caricature people; temples, shrines, monasteries, minarets and churches only as plain distant silhouettes; no Christ the Redeemer; the iron tower in daylight or unlit; never edit `src/40`–`src/43`.
- The scratchpad under `/private/tmp` from the old session may be gone. Everything that matters is in git; recreate worktrees from the branches.
