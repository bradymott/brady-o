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

## State of `main` (deployed 18 Nov, save key v5)
Live at https://bradymott.github.io/brady-o/super-brady-o-world/. Everything below is merged, tested and deployed; every `sbw/*` branch on origin is merged except `sbw/music-pilot`. 102 levels.
- **17 Nov and earlier** (see `SBW_RESUME.md`): story (Piwi Squirmin'), powers carry, the hit ladder, trips, 86 secret rooms, Pupo in Mexico, the Rigging above 1-4, 12 Wormholes, Brady Buttons for rules 3 and 7, Festival Fields (23-x), mazes, maps, performance tiers.
- **18 Nov (this session, branch `sbw/integration-4`):**
  - **Lost & Found** (bonus land 24, `src/29_tour_lost*.js`): 24-1 Baggage Carousel, 24-2 Unclaimed Mountain, 24-3 X-Ray Tunnel, 24-4 The Sock Hydra. Opened by the **Rule 12** Brady Button in the drowned-bike graveyard under Netherlands 8-3 (`29_tour_nl_secrets.js`). Rule 12 also puts a lost suitcase at every land's airstrip and a fourth RETURNED shelf in every Souvenir Stand (a subclass over `ENTITY_TYPES.souvenirShop`: find the stand by `instanceof`, not by class name).
  - **The Red-Eye** (bonus land 25, `src/29_tour_eye*.js`): 25-1 Aisle Seat, 25-2 Turbulence, 25-3 Wing Walk, 25-4 Captain Gull. Opened by the **Rule 10** button in the Rigging above Japan 11-4's rooftop (`29_tour_jp_secrets.js`). Rule 10 adds quick night flights between beaten lands and a red-eye plane on the route map (the game already let Brady fly anywhere unlocked).
  - **Mexico 1-7 Casa de Sorpresas** (`src/29_tour_mx_zcasa.js`; "zcasa" so it loads after the levels file): opened by Rule 7; three new room kinds (`topsy`, `hourglass`, `treasure`), an Under-Stage and the Wings.
  - **Pupo in six more lands** (`28_tour_pe_g1.js`, `28_tour_pf_g2.js`, `tools/pupo_routes.js`, `sbw_pupo_routes_test`, `sbw_pupo_shots`): Pupo levels 2-4, 3-2, 4-3, 5-4, 6-1, 7-2; helpers 2-2, 3-3, 4-6, 5-3, 6-7, 7-1. Pupo now collects coins while climbing, hanging and swinging.
  - **Brazil 3-1 trap fixed** (a second kazoo stand after the checkpoint).
  - Where every secret is, for Brady: `docs/design/BACKSTAGE_STATUS.md`.
- **18 Nov, second deploy (branch `sbw/integration-5`, save key v5):**
  - **Pupo in the last seven lands** (`28_tour_pg_g3.js`, `28_tour_ph_g4.js`): Pupo levels 8-1, 9-6, 10-4, 11-3, 12-3, 13-3, 22-1; helpers 8-6, 10-6, 11-4. Every land now has its Pupo level.
  - **Rule 9: NO SHORTCUTS** (`src/29_tour_zz_wormholes9.js`): button behind the KEEP OUT door in Morocco 5-1; unlocks six padlocked Wormholes back to earlier secret levels (4-2, 6-1, 7-3, 9-3, 10-2, 12-2) and an express trail on every beaten land's map. Every land now has a Wormhole.
  - **Rule 1: NO FUN and 22-6 The Rulebook** (`src/29_tour_w22_zrulebook.js`): button under a glass cloche in 22-5's margin until the other five rules are revoked; party blimp, rainbow Lighthouse beam, two extra ending cards; 22-6 with the Rulebook mini-boss (`tools/boss_tests/w22_rulebook.js`). The HOUSE RULES page lists all six. 102 levels.
Last full suite (18 Nov, `sbw/integration-5`, soak with `--jobs 1`): everything passing, soak clean on all 102 levels, Chromium session test clean. Still complaining on this loaded Mac: `sbw_perf_test --short` (spiky p95; in the run that failed, 1-1 measured 3x of itself) and `sbw_session_test --engine webkit`, where the **map and title cost jump in the 4th repeat only** (map 7 -> 7 -> 8 -> 25-55 ms). The build live before this one shows the same 4th-repeat jump in a back-to-back run, so it is not new, but it is repeatable and worth a proper look (see loose ends).

- **19 Nov, fixes from Brady's first play of the v5 build (no level changes, no save reset):**
  - **Wormholes:** pressing GO (the jump button, or a tap on the stop / card) on the map while a Wormhole trip was still playing put Brady back in the level he had left, or cancelled the trip. The map now ignores it until he pops out; half-finished trips in a save are repaired on load (`src/28_tour_s_secrets.js`, end of file). `tools/sbw_wormhole_trips.js` plays every Wormhole's real flow (results, map, arrival), with button mashing and reloads.
  - **Hats (Rule 7):** only animals wear one (`src/28_tour_sc_hats.js`: `TourHats.HEADS` allow-list with head positions, every other type in `TourHats.NOT`; `tools/sbw_hats_test.js` fails when a new type is in neither). Six redrawn hats, one per animal type. Settings has **ANIMAL HATS** and **DANCING** switches (were one combined switch).
  - **Hard Hat digging:** big Brady's dash clears the 2-high column ahead (`GearHit.digColumn`, `28_tour_dg_gear.js`); only 7-4 and 4-6 have soil.

- **25 Nov: THE ENCORE TOUR (branch `claude/pensive-babbage-c4pt8q`, NOT yet on `main` or deployed; save key stays v5, no reset: only new levels were added).** Five new MAIN lands after Nepal, 30 levels, 132 in all. Design brief: `docs/design/ENCORE_TOUR.md`. Each land is self-contained and code-drawn (`src/29_tour_<cc>*.js`, `tools/boss_tests/<cc>.js`, `tools/sbw_<cc>_shots.js <outdir> [--checks]`), x-1..x-4 new level types, x-5 the boss, x-6 a secret level behind a hinted hidden exit. Difficulty ramps `d0` 0.88 to 0.95.
  - **Italy 14** (`it`): 14-1 Scooter Dash (`scoot`), 14-2 The Pizzeria (`dough`), 14-3 The Leaning Tower (`lean`), 14-4 Night at the Opera (`aria`), 14-5 Il Polpettone (singing meatball), 14-6 Doppio (`espresso`).
  - **Kenya 15** (`ke`): 15-1 The Great Migration (`stampede`), 15-2 Giraffe Grove (`necks`), 15-3 Flamingo Lake (`flock`), 15-4 High Noon (`shade`), 15-5 Big Kiboko (water-ballet hippo), 15-6 Meerkat Manor (`burrow`).
  - **Australia 16** (`au`): 16-1 Pouch Express (`pouch`), 16-2 Road Train (`convoy`), 16-3 Platypus Creek (`sonar`), 16-4 The Canopy (`web`), 16-5 The Drop Bear, 16-6 The Big Things (`giant`).
  - **Iceland 17** (`is`): 17-1 Northern Lights (`aurora`), 17-2 The Glacier Lagoon (`berg`), 17-3 The Rift (`quake`), 17-4 The Organ Pipes (`basalt`), 17-5 The Night Troll, 17-6 The Hidden Folk (`shy`: THROW toggles Brady's gaze).
  - **The Moon 18** (`moon`): 18-1 One Small Hop (`lowg`), 18-2 Spacewalk (`drift`), 18-3 Moon Buggy (`rover`), 18-4 The Moon Base (`mag`), 18-5 Madame Moo, 18-6 Connect the Stars (`stars`). `node tools/sbw_moon_shots.js <dir> bot` plays levels start to finish.
  - **Glue:** the five stops are in `TOUR_ROUTE` (`28_tour_a_core.js`, flag `encore: true`); `Tour.isFinale` still fires on Nepal 12-5 only. `src/29_tour_zz_encore.js`: the Encore intro panels (first map visit after Nepal's boss; `Save.data.seenEncoreIntro`), the ending panels after 18-5 (`seenEncoreEnd`), the "THE ACT NOBODY CANCELLED" boss banner (boss ids prefixed `it_ ke_ au_ is_ moon_`). `sbw_toolkit_test` and `gameplay_test` count the 14 original lands apart from the encore lands.
  - **Tested (Linux cloud container, Chromium only; no WebKit, no real phone):** `validate_levels --rules` 132 levels, 0 unfinishable, 0 unreachable gold, rules 0 errors (warnings: encore lands have no Wormhole and one secret-room type each); toolkit, hats, hits, save, overworld, gameplay, boss, apps, each land's shots `--checks`, soak on each land's six levels. NOT run here: `sbw_session_test`, `sbw_perf_test`, WebKit anything, full-game soak.
  - **Not built (ENCORE_TOUR.md section 5 item 7):** Souvenir Stands, Wormholes, Pupo levels, typed secret rooms for the five lands. Difficulty was tuned by scripts, never by hand on a phone: expect to adjust after Brady plays (candidates: 15-1 boarding, 16-1 mound tops, 16-3 two-tile stones, 17-6, 18-2).

## Brady's decisions (settled; use the names exactly)
- Villain **Piwi Squirmin'** (original ventriloquist dummy) has taken **Princess Papaya** (ballerina, pink tutu, Latina/Ecuadorian, black hair; drawn warmly). **Pupo** the sloth is Brady-O's steed: round, in Brady's art style, never spiky; nothing grabs automatically; Down+Jump to hop off (no button).
- **Wormholes**, **Brady Buttons**, three bonus lands. Every secret room different. Powers carry between levels. One power lost per hit, then shrink, then a life. Trips wavy and trippy but readable and smooth. More maze levels; the more creative the better. Save wipes are fine.

## What to do next
0. **The Encore Tour is waiting for Brady's go-ahead to go live** (merge `claude/pensive-babbage-c4pt8q` into `main`, full suite on a Mac with WebKit, deploy). Then ask him how the five lands play and tune.
1. **Ask Brady how the new build plays** (the two new bonus lands, 1-7, the Pupo levels, the earlier backstage work; lag: FPS COUNTER in Settings). Nothing has ever been measured on a real iPhone.
2. **Pupo follow-ups:** the seven Pupo-den secret rooms (1-4, 3-3, 4-3, 8-6, 10-4, 13-2, 11-6); the map follower and Pupo-level badge (PUPO.md P2-M); backup Nap Boxes sit only a few seconds' ride from their obstacle (the doc asks for 15 s).
3. **Backstage rollout still to build:** Rigging / Under-Stage / Wings entrances in more lands (three of the Rule 9 Wormholes were built as plain Loading Docks instead of the design's fancier zones); the express trail is a straight rail with no grow animation; The Red-Eye's two plain secret rooms could become typed room kinds (`--rules` warning: eye, fest).
4. **Music pilot** `sbw/music-pilot` (985c183): merge only after Brady has listened (`brady-o-music-preview/after/listen_ab.html` on his Desktop).
5. Loose ends: the WebKit session test's 4th-repeat map/title jump was investigated on 18 Nov: the game's own frame time is flat and the extra time is all in WebKit's rasteriser after its own memory clean-ups, landing on any repeat (`docs/PERFORMANCE.md`, "Long sessions"); the test now confirms a last-repeat spike with one extra repeat and prints a "js" figure (read that, not just pass/fail, on a loaded Mac); only a real iPhone settles it; a lead for later: about 100 KB of JS garbage per frame in a level (colour strings, `drawBrady` / `Ink.around` closures, the HUD); 22-1's clock face top sits under the HUD in landscape until Pupo rides; carried Magic Beans / Paper Plane can skip 3-2's river and reach some helper bonuses; 1-7's attic banner overlaps its title on entry and its upstairs reuses the courtyard backdrop; cloud shadows cross the jet on The Red-Eye's map; two Nepal backdrop strips still show the Baron's banners (Blender re-render); post-credits card and a World 22 postcard still old text; old "RUN · THROW" label can overlap the Pupo button early in 1-1; a carried star replays on each re-entry of a level; perf, session and parallel soak runs give false failures when the Mac is loaded (re-run alone, `--jobs 1`, and compare with a build of the previous main); bosses still code-drawn.

## How to work safely
- **Browser tests one at a time across all agents.** Shared lock: `mkdir <scratchpad>/test.lock` before, `rmdir` after. With four agents the queue is the bottleneck; fewer agents finish sooner.
- Full suite before every merge: the list in `docs/handoff/SBW_RESUME.md` (includes `sbw_mazes_test`, `sbw_contract_test`, `sbw_session_test`, full soak). Build privately with `BRADY_DIST=<folder>` (copy `icons/` and `icon.b64` from `dist/` into it). Worktrees need a `node_modules` symlink to the main checkout's.
- **Look at screenshots, not only pass counts.**
- **Deploy:** build from tested `main`; `node --check` every built `sw.js`; confirm `dist/site/super-brady-o-world/icon-180.png` matches `dist/icons/world/`; `apps_test`; then in a gh-pages worktree `rsync -a --delete dist/site/super-brady-o-world/ super-brady-o-world/`, commit, `git push origin HEAD:gh-pages`. Only that folder is replaced. The Art Cart agent also pushes to `main`: fetch and merge first.
- **Rules that must hold:** original content only (nothing resembling Nintendo or other games); the player is always the code-drawn Brady (black tee and trousers, man bun, square shades, no stubble, blackwork sleeves); never caricature people; sacred buildings only as plain distant silhouettes; no Christ the Redeemer; iron tower in daylight or unlit; PG-13; never edit `src/40`–`src/43`; shared files additive only; no `blender -b`, no shared Blender MCP window.
- The scratchpad under `/private/tmp` may be gone. Everything that matters is in git; recreate worktrees from the branches.
