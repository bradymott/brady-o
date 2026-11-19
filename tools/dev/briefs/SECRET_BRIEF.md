# Super Art Kart: secret levels (brief for secret-level agents, Nov 19 2026)

Each car has one secret level: a small battle arena with exactly three mini-games: one unique to that level, plus Vibe Check and Glow Grab (those two are added automatically). Seven cars already have theirs. You build the missing ones named in your prompt: for each car, a NEW arena and a NEW unique mini-game (for Bass Valentine only the mini-game is missing; its arena, Deep Playa Art Park `playa`, exists).

The owner (Brady, not a programmer, plays on an iPhone) wants the game finished and playable. Priority order: (1) it works and is fun, (2) it is unique to this car, (3) it looks good. Nothing may look basic, square or boxy unless boxy is the point, but do ONE visual pass, not endless polish. Many other agents are building levels in the same worktree right now.

## Read first (in /Users/bradymott/brady-o-artcart)
1. `tools/dev/briefs/CAREER_BRIEF.md` — shared rules: work only in this worktree, no git commit/stash/checkout/reset, never edit `src/40_*`, `41_*`, `42_*`, original content only, PG-13, iPhone budgets (≤ 420k triangles, ≤ 120 draws per view, no per-frame allocations), shared-file etiquette. Its scratchpad path is out of date; use
   S = /private/tmp/claude-501/-Users-bradymott-brady-o/525dd309-9ce0-46f8-a74e-5f850617a07d/scratchpad
   with `S/dist-<tag>` and `S/shots-<tag>` (tag given in your prompt). Before the first build: `mkdir -p S/dist-<tag> && cp -R dist/icons S/dist-<tag>/ && cp /Users/bradymott/brady-o/dist/icon.b64 S/dist-<tag>/`.
2. `docs/ART_CART_CAREER.md` §5 (secret levels) and `docs/handoff/WIP_C1.md` (how secret levels are gated and registered).
3. The worked examples: the self-registering secret arenas with their own game, `src/43_cart_g_deep.js` (pearl game), `src/43_cart_g_moon.js` (crater game), `src/43_cart_g_mud.js` (rescue game), `src/43_cart_g_temple.js` (relic game). Copy their shape, not their content. Also see how objectives work in `src/43_cart_d_sim.js` and the secret flow in `src/43_cart_h_career.js` (`CART_SECRET_LEVELS`, `cartSecretOpts`).

## What to build, per car
- One new file `src/43_cart_g_<arena>.js` that registers the arena in `CART_ARENAS` WITHOUT the `royale` flag, its world builder, its arena rules, its unique game in `CART_OBJECTIVES`, a menu icon, and `CART_SECRET_LEVELS.<carId> = { arena: '<arenaId>', game: '<objectiveId>' }` (assign only; never redeclare a registry with const/let).
- The unique mini-game must be a real, different game themed on the car (not a reskin of Vibe Check, Glow Grab, or another level's game): a clear goal shown on the HUD, a 60–120 s round, AI rivals that actually play it, and a clear win/lose result the secret flow understands (winning = 1st place, like the existing games).
- Vibe Check and Glow Grab must also work in your arena (it needs the spots those games use; see the examples).
- Prefix every global and every `E.`/`s.` field with the unique tag from your prompt. Write each new file in your scratchpad first, `node --check` it, then copy it into `src/`. A half-written file in `src/` breaks everyone's build. If a build fails in someone else's file, wait a minute and retry; never edit their file.

## Testing (required before you report)
- `export NODE_PATH=/Users/bradymott/brady-o/node_modules; BRADY_DIST=S/dist-<tag> node tools/build.js`
- `tools/cart_battle_test.js` runs each secret arena × its 3 games: your arenas must pass in it (read the file for its arguments; add an optional filter if it can't run a single arena, rather than running everything every time).
- The secret flow: with `BRADY_CART.debug.career` helpers (see WIP_C1.md: `playSecret`, `secret`, `complete`), confirm your car's secret card shows your level with 3 games, each can be started, and winning all 3 marks the car complete. Add these checks to your own small test or to `tools/cart_career_test.js` (your lines only).
- `node tools/apps_test.js S/dist-<tag>/site S/shots-<tag>/apps` must pass 3/3. Peak triangles and draws must be within budget.
- Look at your own screenshots once (landscape 844x390; HUD also in portrait 390x844): fix what is broken, unreadable, or plainly boxy/basic.
- Machine load: one shared lock for every browser test run, or everything times out:
  `until mkdir S/test.lock 2>/dev/null; do sleep 20; done; <run the test>; rmdir S/test.lock`
  Always release it, including on failure. A lock older than 40 minutes is stale: remove it. Hold it briefly. Builds don't need the lock. A timeout is not a pass.

## Final report (short and factual)
Arena and game ids and names; how each game is played and won; test results with real numbers (round length, AI scores, peak triangles and draws); what is weak or unfinished; every file you created or edited; 3–5 absolute screenshot paths. Separate verified from inferred.
