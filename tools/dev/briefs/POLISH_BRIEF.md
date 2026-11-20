# Super Art Kart: final balance and polish pass (brief for polish agents, Nov 19 2026)

The whole game is built and live: career mode, Battle Royale, 12 drivers, and for all 12 cars a career track, a royale arena and a secret level. Nobody has played it by hand. The owner (Brady, not a programmer, plays on an iPhone) wants the project FINISHED: this is the last pass. Fix the listed rough spots in your prompt, once, well, and stop. Do not add features, do not redesign levels, do not start new work beyond your list. Fun and looks are his priorities; nothing may look basic, square or boxy unless boxy is the point.

Four polish agents work at the same time in the same worktree, each on its own list of files (named in your prompt). Do not edit files outside your list except for the tiny shared-file hooks your prompt names; re-read a shared file right before editing and add only your lines.

## Rules (all mandatory)
- Work ONLY in the git worktree `/Users/bradymott/brady-o-artcart`. Never touch `/Users/bradymott/brady-o`. Do NOT git commit, stash, checkout or reset; the organizer commits.
- Never edit `src/40_*`, `src/41_*`, `src/42_*`, or any file that is not a kart file (`src/43_cart_*`, `tools/cart_*`). Super Brady-O World and Burning Man must not change.
- Scratchpad: S = `/private/tmp/claude-501/-Users-bradymott-brady-o/525dd309-9ce0-46f8-a74e-5f850617a07d/scratchpad`. Use `S/dist-<tag>` and `S/shots-<tag>` (tag in your prompt).
- `BRADY_DIST` must ALWAYS be a full absolute path inside S, typed out in every build and test command (never relative, never built from an empty variable). Before the first build: `mkdir -p S/dist-<tag> && cp -R /Users/bradymott/brady-o-artcart/dist/icons S/dist-<tag>/ && cp /Users/bradymott/brady-o/dist/icon.b64 S/dist-<tag>/`.
- Never delete or move anything outside S. If something lands in the wrong place, leave it and report it.
- `node --check` every file you edit before building. If the build fails in a file that is not yours, wait a minute and retry; do not fix it.
- iPhone budgets still apply: every view ≤ 420k triangles and ≤ 120 draw calls; no per-frame allocations; original content only; PG-13.
- Load order: files load in filename order; keep registries guarded and kit use lazy as the existing files do.

## How to work
- Read `docs/ART_CART_LEVEL_RECIPE.md` (balance targets, hazard pattern) and the file you are about to change. Keep each level's identity; tune numbers, sizes, colours, lighting, timing.
- Balance targets for tracks: hazard hits 5–20 per 8-kart 3-lap race, every hazard lands at least a few times, pace within about 10% of Neon Nights per km, nobody stuck. For arenas: matches 150–240 s, first KO ≥ 20 s, every arena hazard matters but none dominates.
- "Dark from above / pale and sparse" fixes: judge from the chase camera first (that is what the player sees); add light pools, stronger ground paint, fog/sky tuning, a few more instanced props, within budget.
- Build: `export NODE_PATH=/Users/bradymott/brady-o/node_modules; BRADY_DIST=<absolute S/dist-tag> node tools/build.js`.
- Test what you touched and only that, in narrow modes: `BRADY_DIST=<abs> node tools/cart_track_test.js <track> <abs shots dir>` (`ONLY=races|views|shots`), `ARENAS=<id> BRADY_DIST=<abs> node tools/cart_royale_test.js <abs out> match 3` (and `shots`), the secret tests, `tools/cart_career_test.js`, and finally `node tools/apps_test.js <abs S/dist-tag>/site <abs shots dir>` (must pass 3/3).
- One shared lock for every browser test run: `until mkdir S/test.lock 2>/dev/null; do sleep 20; done; <run the test>; rmdir S/test.lock`. Always release it, also on failure. A lock older than 40 minutes is stale: remove only that lock directory. Hold it briefly. A timeout is not a pass.
- Look at a before/after screenshot for each visual fix, once.

## Final report (short)
For each item on your list: fixed / partly / not fixed, with the before and after numbers; tests run and their results; files edited; anything left over. Separate verified from inferred.
