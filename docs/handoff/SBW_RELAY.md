# Super Brady-O World: relay to the next agent (18 Nov 2026)

You are taking over the Super Brady-O World (SBW) work. Everything you need is here and in the files this points to.

## How Brady starts you
In a terminal: `cd ~/brady-o`, then `claude`, then paste:

> Read docs/handoff/SBW_RELAY.md and continue the Super Brady-O World work from where it stopped. Use Opus agents for the heavy lifting.

## Who you are working for
- Brady (GitHub `bradymott`) owns the game, plays on an iPhone 17 and is not a programmer. Talk plainly, show screenshots, not code.
- **He has approved the whole plan: do not wait for sign-off.** Merge, push and deploy as work passes its tests. Pushes and gh-pages deploys are pre-authorised.
- The main session organises; **Opus agents do the heavy lifting**, each in its own git worktree and `sbw/...` branch, with a full brief (it knows nothing else), told which files other agents are editing. Look at their screenshots yourself before merging.

## Read first
1. `docs/handoff/README.md`: rules, ownership, deploy.
2. `docs/handoff/SBW_RESUME.md`: what shipped and the test list.
3. `docs/design/SECRETS_WARPS_SWITCHES.md` (Brady's decisions at the top), `docs/design/SECRETS_CONTRACTS.md`, `docs/design/PUPO.md`, `docs/design/STORY_PIWI.md` (on `sbw/story-piwi` / `sbw/story-b` until merged), `docs/design/LEVEL_OVERHAUL.md`, `docs/design/TOOLKIT_STATUS.md`, `docs/PERFORMANCE.md`.

## State of `main` (deployed 18 Nov, save key v4)
Live at https://bradymott.github.io/brady-o/super-brady-o-world/. Everything below is merged, tested and deployed; every `sbw/*` branch on origin is merged except `sbw/music-pilot`. 101 levels.
- **17 Nov and earlier** (see `SBW_RESUME.md`): story (Piwi Squirmin'), powers carry, the hit ladder, trips, 86 secret rooms, Pupo in Mexico, the Rigging above 1-4, 12 Wormholes, Brady Buttons for rules 3 and 7, Festival Fields (23-x), mazes, maps, performance tiers.
- **18 Nov (this session, branch `sbw/integration-4`):**
  - **Lost & Found** (bonus land 24, `src/29_tour_lost*.js`): 24-1 Baggage Carousel, 24-2 Unclaimed Mountain, 24-3 X-Ray Tunnel, 24-4 The Sock Hydra. Opened by the **Rule 12** Brady Button in the drowned-bike graveyard under Netherlands 8-3 (`29_tour_nl_secrets.js`). Rule 12 also puts a lost suitcase at every land's airstrip and a fourth RETURNED shelf in every Souvenir Stand (a subclass over `ENTITY_TYPES.souvenirShop`: find the stand by `instanceof`, not by class name).
  - **The Red-Eye** (bonus land 25, `src/29_tour_eye*.js`): 25-1 Aisle Seat, 25-2 Turbulence, 25-3 Wing Walk, 25-4 Captain Gull. Opened by the **Rule 10** button in the Rigging above Japan 11-4's rooftop (`29_tour_jp_secrets.js`). Rule 10 adds quick night flights between beaten lands and a red-eye plane on the route map (the game already let Brady fly anywhere unlocked).
  - **Mexico 1-7 Casa de Sorpresas** (`src/29_tour_mx_zcasa.js`; "zcasa" so it loads after the levels file): opened by Rule 7; three new room kinds (`topsy`, `hourglass`, `treasure`), an Under-Stage and the Wings.
  - **Pupo in six more lands** (`28_tour_pe_g1.js`, `28_tour_pf_g2.js`, `tools/pupo_routes.js`, `sbw_pupo_routes_test`, `sbw_pupo_shots`): Pupo levels 2-4, 3-2, 4-3, 5-4, 6-1, 7-2; helpers 2-2, 3-3, 4-6, 5-3, 6-7, 7-1. Pupo now collects coins while climbing, hanging and swinging.
  - **Brazil 3-1 trap fixed** (a second kazoo stand after the checkpoint).
  - Where every secret is, for Brady: `docs/design/BACKSTAGE_STATUS.md`.
Last full suite (18 Nov, `sbw/integration-4`): everything passing except `sbw_perf_test` and `sbw_session_test`, which complained about frame cost on a loaded Mac; a build of the previous `main` failed them just as often in back-to-back runs (logs were in the scratchpad), so they were judged noise. Soak failures on the first run were browser stalls; re-runs with `--jobs 1` were clean.

## Brady's decisions (settled; use the names exactly)
- Villain **Piwi Squirmin'** (original ventriloquist dummy) has taken **Chinka-O** (ballerina, pink tutu, Latina/Ecuadorian, black hair; drawn warmly). **Pupo** the sloth is Brady-O's steed: round, in Brady's art style, never spiky; nothing grabs automatically; Down+Jump to hop off (no button).
- **Wormholes**, **Brady Buttons**, three bonus lands. Every secret room different. Powers carry between levels. One power lost per hit, then shrink, then a life. Trips wavy and trippy but readable and smooth. More maze levels; the more creative the better. Save wipes are fine.

## What to do next
1. **Ask Brady how the new build plays** (the two new bonus lands, 1-7, the Pupo levels, the earlier backstage work; lag: FPS COUNTER in Settings). Nothing has ever been measured on a real iPhone.
2. **Pupo in the last seven lands:** group P2-G3 (nl 8-1, id 9-6, vn 10-4; helpers 8-6, 10-6) and P2-G4 (jp 11-3, np 12-3, aq 13-3, w22 22-1; helper 11-4, keep clear of its Rigging). Use the G1/G2 diffs as the worked example; lessons are in the G2 brief: obstacles the level's own powers can't skip, posts are standable, keep objects out of the HUD rows (`cam` on hooks), check checkpoints for respawn traps. Then the seven Pupo-den secret rooms.
3. **Backstage rollout still to build:** 22-6 The Rulebook; Brady Buttons for rules 9 (dormant Wormholes, express trails) and 1 (under its cloche in 22-5 until the other five are revoked); Wormholes in Bali (9) and Vietnam (10); Rigging / Under-Stage / Wings entrances in more lands; The Red-Eye's two plain secret rooms could become typed room kinds (`--rules` warning).
4. **Music pilot** `sbw/music-pilot` (985c183): merge only after Brady has listened (`brady-o-music-preview/after/listen_ab.html` on his Desktop).
5. Loose ends: carried Magic Beans / Paper Plane can skip 3-2's river and reach some helper bonuses; 1-7's attic banner overlaps its title on entry and its upstairs reuses the courtyard backdrop; cloud shadows cross the jet on The Red-Eye's map; two Nepal backdrop strips still show the Baron's banners (Blender re-render); post-credits card and a World 22 postcard still old text; old "RUN · THROW" label can overlap the Pupo button early in 1-1; a carried star replays on each re-entry of a level; perf, session and parallel soak runs give false failures when the Mac is loaded (re-run alone, `--jobs 1`, and compare with a build of the previous main); bosses still code-drawn.

## How to work safely
- **Browser tests one at a time across all agents.** Shared lock: `mkdir <scratchpad>/test.lock` before, `rmdir` after. With four agents the queue is the bottleneck; fewer agents finish sooner.
- Full suite before every merge: the list in `docs/handoff/SBW_RESUME.md` (includes `sbw_mazes_test`, `sbw_contract_test`, `sbw_session_test`, full soak). Build privately with `BRADY_DIST=<folder>` (copy `icons/` and `icon.b64` from `dist/` into it). Worktrees need a `node_modules` symlink to the main checkout's.
- **Look at screenshots, not only pass counts.**
- **Deploy:** build from tested `main`; `node --check` every built `sw.js`; confirm `dist/site/super-brady-o-world/icon-180.png` matches `dist/icons/world/`; `apps_test`; then in a gh-pages worktree `rsync -a --delete dist/site/super-brady-o-world/ super-brady-o-world/`, commit, `git push origin HEAD:gh-pages`. Only that folder is replaced. The Art Cart agent also pushes to `main`: fetch and merge first.
- **Rules that must hold:** original content only (nothing resembling Nintendo or other games); the player is always the code-drawn Brady (black tee and trousers, man bun, square shades, no stubble, blackwork sleeves); never caricature people; sacred buildings only as plain distant silhouettes; no Christ the Redeemer; iron tower in daylight or unlit; PG-13; never edit `src/40`–`src/43`; shared files additive only; no `blender -b`, no shared Blender MCP window.
- The scratchpad under `/private/tmp` may be gone. Everything that matters is in git; recreate worktrees from the branches.
