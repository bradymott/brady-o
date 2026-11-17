# Super Brady-O World: relay to the next agent (17 Nov 2026)

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

## State of `main` (918ba7a, deployed 17 Nov)
Live at https://bradymott.github.io/brady-o/super-brady-o-world/. On top of the 11 Nov state it has: items fix, performance tiers, new title and icon, toon-style mushroom/acid trips, Morocco door maze with no fake doors plus four more maze levels (6-2, 8-2, 10-3, 11-1), a different map per land, one Brady look (LOOK picker removed, no stubble), kazoo "HONK" fix, Magic Beans in level 1 or 2 of every land, star/acid pickups moved off level ends, secrets hooks (`TourHooks`/`TourNeeds`/`TourSeams`, `src/28_tour_a2_hooks.js`), long-session fixes (`src/16_session.js`: canvases freed between scenes, no trail tiles left after a death), silent browser tests (`tools/sbw_silent.js`; `BRADY_SOUND=1` to hear them). Last full suite: all passing, 88 levels finishable, gameplay 52/52, bosses 172/172.

## Brady's decisions since 11 Nov (settled; use the names exactly)
- Villain is **Piwi Squirmin'**, a Pee-wee-Herman-esque ventriloquist dummy (an original character, a nod not a lookalike), not the Baron. He has stolen Brady-O's wife **Chinka-O** (ballerina, pink tutu, Latina/Ecuadorian, black hair; draw her warmly, never a helpless prize) and takes her round the world; Brady-O chases.
- **Pupo**, Chinka-O's pet sloth, is Brady-O's sidekick and rideable steed: found in Nap Boxes, stretch arms (poke belly buttons, swing, zip, climb, fetch), special Pupo levels (one or two per land), and **PUPO POWER!**. Must stay an original mount.
- Secrets: warps are **Wormholes**, big buttons are **Brady Buttons**; three bonus lands approved; warps may jump two lands ahead.
- **Every secret room must be different** (enemies, obstacles, prizes, Pupo...), not the same box + coins + postcard.
- **Powers carry from a cleared level into the next level**; the level-clear banner says **"YOU DID IT!"**, not "WELCOME HOME!".
- More maze levels; the more creative the levels the better; no repeated level types; reset all save progress when levels change.

## Branches in progress (agents were running when this was written)
Check each branch's tip and whether it is already in `main` (`git branch -r --merged origin/main`). If an agent's session is gone, start a new Opus agent on the branch with a full brief.
- `sbw/story-b`: story phase B, replacing the Baron with Piwi everywhere (strings, title blimp, boss intros, ending, reunion in the Nepal finale), built on `sbw/story-piwi` (character art `src/05b`–`05e`).
- `sbw/pupo` (tip 8b160b9 had riding, arms and Pupo Power working in a lab level): now merging main, fixing a failing heap-growth check, validator rules (PU-4), and putting Pupo into Mexico (Nap Box + tutorial in 1-1, one Mexico Pupo level). Other 13 lands wait for Brady's reaction.
- `sbw/carry-powers`: powers carry between levels + "YOU DID IT!".
- `sbw/secret-rooms`: every secret room a different kind; inventory and catalogue in `docs/design/SECRET_ROOMS.md`; Mexico last (Pupo agent is editing `src/29_tour_mx_levels.js`).
- `sbw/music-pilot` (985c183): untouched. Merge only after Brady has listened (`brady-o-music-preview/after/listen_ab.html` on his Desktop). To do: run `sbw_audio_test`, fix canal/cenote/volcano songs never playing.
- Merge order suggestion: carry-powers → story-b → pupo → secret-rooms, full suite on each merged result.

## Not started
Secrets WP-2…WP-6 (save v3/maps, backstage + Wormholes, Brady Buttons, bonus lands); Pupo in the other 13 lands (with a save reset); bosses still code-drawn.

## Open questions for Brady (defaults proceed if he doesn't answer)
- Is the lag gone on his iPhone? Nothing has ever been measured on a real phone. Ask for FPS COUNTER readings (Settings) after three or four levels, in the Mexico boss and Brazil 3-1/3-5.
- Does he like the new music direction?
- Defaults in force: reunion in the Nepal finale; Pupo sits out boss fights; Pupo Power charges in about 30 s; sleepy-then-nap hit rule; mazes replaced existing levels.
- Known loose end: the full soak test has hung once each on 8-1 and 22-5 (passes on every retry; cause unknown; a 4-minute watchdog now fails the level instead of hanging).

## How to work safely
- **Browser tests one at a time across all agents.** Shared lock: `mkdir <scratchpad>/test.lock` before, `rmdir` after. With four agents the queue is the bottleneck; fewer agents finish sooner.
- Full suite before every merge: the list in `docs/handoff/SBW_RESUME.md` (includes `sbw_mazes_test`, `sbw_contract_test`, `sbw_session_test`, full soak). Build privately with `BRADY_DIST=<folder>` (copy `icons/` and `icon.b64` from `dist/` into it). Worktrees need a `node_modules` symlink to the main checkout's.
- **Look at screenshots, not only pass counts.**
- **Deploy:** build from tested `main`; `node --check` every built `sw.js`; confirm `dist/site/super-brady-o-world/icon-180.png` matches `dist/icons/world/`; `apps_test`; then in a gh-pages worktree `rsync -a --delete dist/site/super-brady-o-world/ super-brady-o-world/`, commit, `git push origin HEAD:gh-pages`. Only that folder is replaced. The Art Cart agent also pushes to `main`: fetch and merge first.
- **Rules that must hold:** original content only (nothing resembling Nintendo or other games); the player is always the code-drawn Brady (black tee and trousers, man bun, square shades, no stubble, blackwork sleeves); never caricature people; sacred buildings only as plain distant silhouettes; no Christ the Redeemer; iron tower in daylight or unlit; PG-13; never edit `src/40`–`src/43`; shared files additive only; no `blender -b`, no shared Blender MCP window.
- The scratchpad under `/private/tmp` may be gone. Everything that matters is in git; recreate worktrees from the branches.
