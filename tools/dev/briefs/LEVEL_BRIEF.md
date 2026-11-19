# Super Art Kart: one car's career track and royale arena (brief for level agents, Nov 19 2026)

You build the two levels that belong to ONE car: its career race track and its Battle Royale arena. Your prompt names the car, its id, and the themes. Several other agents are building other cars' levels in the same worktree at the same time, and two more (C1 framework, C2 royale rules) may still be finishing.

The owner (Brady, not a programmer, plays on an iPhone) wants the game finished and playable with every level in it. Priority order: (1) it works and is fun to play, (2) it is unique to this car, (3) it looks good. Nothing may look basic, square or boxy unless boxy is the point, but do ONE visual pass, not endless polish.

## Read first (in /Users/bradymott/brady-o-artcart)
1. `tools/dev/briefs/CAREER_BRIEF.md` — shared rules: work only in this worktree, no git commit/stash/checkout/reset, never edit `src/40_*`, `41_*`, `42_*`, original content only, PG-13, iPhone budgets, shared-file etiquette. Its scratchpad path is out of date; use
   S = /private/tmp/claude-501/-Users-bradymott-brady-o/525dd309-9ce0-46f8-a74e-5f850617a07d/scratchpad
   with `S/dist-<carId>` and `S/shots-<carId>`. Before the first build: `mkdir -p S/dist-<carId> && cp -R dist/icons S/dist-<carId>/ && cp /Users/bradymott/brady-o/dist/icon.b64 S/dist-<carId>/`.
2. `docs/ART_CART_LEVEL_RECIPE.md` — THE RECIPE for a career track, and its last section for a royale arena. Follow it.
3. `docs/ART_CART_CAREER.md` §2 and §3 — the design; your car's row in the table gives the themes and starting ideas for obstacles and enemies (yours to improve).
4. The worked examples: `src/43_cart_j_loveparade.js` (track), `src/43_cart_i_royale_sound.js` (arena), and the kit `src/43_cart_j_kit.js`.

## What to build
- `src/43_cart_j_<track>.js`: the career track. Its own layout (not a copy of Love Parade's shape), look, and 3–4 hazards/enemies that each follow the recipe's hazard pattern (cycle, telegraph, effect, skill counterplay, AI handling). Register `CART_TRACKS.<id>` with `car: '<carId>'`, `CART_CAREER_TRACKS.<carId> = '<id>'`, `CART_TRACK_RULES.<id>`.
- `src/43_cart_i_royale_<arena>.js`: the royale arena. Its own layout and 2–3 hazards. Register as the recipe says, including `CART_ROYALE_ARENAS.<carId>`, the menu icon, and its hazard ids in `CART_ROY_DMG` (a small, local edit in `src/43_cart_i_royale.js`: re-read right before editing, add only your lines).
- Use ids and names nobody else will pick: prefix every global, `E.` field and `s.` field with a short tag unique to your level.
- Write each new file in your scratchpad first, `node --check` it, then copy it into `src/`. A half-written file in `src/` breaks everyone's build. If a build fails in someone else's file, wait a minute and retry; never edit their file.
- Test-file edits (`tools/cart_royale_test.js` arena list and views): add only your lines. If the test cannot run a single arena, give it a small optional filter (e.g. an env var) rather than running every arena.

## Testing (required before you report)
- `export NODE_PATH=/Users/bradymott/brady-o/node_modules; BRADY_DIST=S/dist-<carId> node tools/build.js`
- Track: `BRADY_DIST=S/dist-<carId> node tools/cart_track_test.js <track> S/shots-<carId>/track` must report all OK (every kart finishes, hazards fire and land, peak ≤ 420k triangles and ≤ 120 draws).
- Arena: the royale `match` check for your arena (matches finish, ≤ 300 s, first KO ≥ 20 s, autopilot survives ≥ 60 s) and its view budget.
- `node tools/apps_test.js S/dist-<carId>/site S/shots-<carId>/apps` must pass 3/3.
- Look at your own screenshots once: fix what is broken, unreadable, or plainly boxy/basic. Do not chase perfection.
- Machine load: one shared lock for every browser test run, or everything times out:
  `until mkdir S/test.lock 2>/dev/null; do sleep 20; done; <run the test>; rmdir S/test.lock`
  Always release it, including on failure. A lock older than 40 minutes is stale: remove it. Use the tests' narrow modes (`ONLY=races|views|shots`, `match|shots`) so you hold it briefly. Builds don't need the lock. A timeout is not a pass.

## Final report (short and factual)
Track and arena ids and names; the hazards and how each is dodged; test results with real numbers (lap times, hazard hits, match length, first KO, peak triangles and draws); what is weak or unfinished; every file you created or edited; 4–6 absolute screenshot paths. Separate verified from inferred.
