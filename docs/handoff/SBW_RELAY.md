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

## State of `main` (ecf5cca, deployed 17 Nov, save key v3)
Live at https://bradymott.github.io/brady-o/super-brady-o-world/. Everything below is merged, tested and deployed; no agent work is outstanding and every `sbw/*` branch on origin is merged except `sbw/music-pilot`.
- Earlier this session: items fix, performance tiers, title and icon, door mazes (5-1, 6-2, 8-2, 10-3, 11-1), a different map per land, one Brady look (no stubble, LOOK removed), kazoo fix, Magic Beans early in every land, star/acid off level ends, long-session cleanup (`src/16_session.js`), silent tests (`tools/sbw_silent.js`).
- **Story:** Piwi Squirmin' replaces the Baron everywhere (`src/28_tour_g_story.js`, `29_tour_zz_story.js`, art `05b`–`05e`); intro, title, Nepal finale, ending, credits.
- **Powers carry between levels** (`src/28_tour_dk_carry.js`) and the **hit ladder** (`src/28_tour_hc_hits.js`): each hit takes one thing (hands item, jump power, kandi, joint, big, life). Boss reach boxes (`28_tour_hd_reach.js`). "YOU DID IT!" banner. Portrait end screens fit the game area.
- **Freeze fix:** taking a signature item with hands and Backpack full looped forever (`28_tour_dg_gear.js`); a dropped item now can't be re-taken until Brady steps clear. This was also the 12-1 soak crash.
- **Trips:** mushroom, acid and joint sway and undulate the world in the toon style (`src/15_postfx.js`).
- **Secret rooms:** 86 rooms, 18 kinds, none repeated within a land (`src/28_tour_r*.js`, `docs/design/SECRET_ROOMS.md`); climb rooms have a door at the top; `tools/sbw_wayout_test.js`.
- **Pupo:** rideable in Mexico (Nap Box + tutorial in 1-1, Pupo level before the 1-5 boss), round art in Brady's style, press-to-grab only, Down+Jump hops off, PUPO POWER! (`src/05e_pupo.js`, `28_tour_p*.js`, `docs/design/PUPO.md`).
- **Backstage, Wormholes, Brady Buttons** (`src/28_tour_s*.js`, `29_tour_mx_secrets.js`, `29_tour_fest*.js`; where everything is hidden: `docs/design/BACKSTAGE_STATUS.md`): the Rigging above Mexico 1-4, 12 Wormholes, two Brady Buttons (rules 3 and 7), bonus land Festival Fields (23-1…23-4). 91 levels.
Last full suite (on ecf5cca): all passing; 91 levels finishable, gameplay 52/52, bosses all passing.

## Brady's decisions (settled; use the names exactly)
- Villain **Piwi Squirmin'** (original ventriloquist dummy) has taken **Chinka-O** (ballerina, pink tutu, Latina/Ecuadorian, black hair; drawn warmly). **Pupo** the sloth is Brady-O's steed: round, in Brady's art style, never spiky; nothing grabs automatically; Down+Jump to hop off (no button).
- **Wormholes**, **Brady Buttons**, three bonus lands. Every secret room different. Powers carry between levels. One power lost per hit, then shrink, then a life. Trips wavy and trippy but readable and smooth. More maze levels; the more creative the better. Save wipes are fine.

## What to do next
1. **Ask Brady how the new build plays** (backstage, Festival Fields, Pupo, secret-room difficulty and wording, trips on his phone, whether the lag is gone: FPS COUNTER in Settings). Nothing has ever been measured on a real iPhone.
2. **Backstage rollout (not built):** bonus lands Lost & Found (24-x) and The Red-Eye (25-x); bonus levels 1-7 and 22-6; Brady Buttons for rules 1, 9, 10, 12 and what they open; Rigging/Under-Stage/Wings entrances outside Mexico and Festival Fields; no Wormhole yet in Bali (9) or Vietnam (10); rule 7 opens nothing until 1-7 exists.
3. **Pupo in the other 13 lands** (one or two Pupo levels each) and the seven planned Pupo-den secret rooms (1-4, 3-3, 4-3, 8-6, 10-4, 13-2, 11-6).
4. **Music pilot** `sbw/music-pilot` (985c183): merge only after Brady has listened (`brady-o-music-preview/after/listen_ab.html` on his Desktop).
5. Loose ends: two Nepal backdrop strips still show the Baron's banners (need a Blender re-render); post-credits card and a World 22 postcard still old text; old "RUN · THROW" label can overlap the Pupo button early in 1-1; `sbw_wayout_test` (without `--rooms`) flags 3-1 at x 111–150; a carried star replays on each re-entry of a level; perf and session tests give false failures when the Mac is loaded (re-run alone); bosses still code-drawn.

## How to work safely
- **Browser tests one at a time across all agents.** Shared lock: `mkdir <scratchpad>/test.lock` before, `rmdir` after. With four agents the queue is the bottleneck; fewer agents finish sooner.
- Full suite before every merge: the list in `docs/handoff/SBW_RESUME.md` (includes `sbw_mazes_test`, `sbw_contract_test`, `sbw_session_test`, full soak). Build privately with `BRADY_DIST=<folder>` (copy `icons/` and `icon.b64` from `dist/` into it). Worktrees need a `node_modules` symlink to the main checkout's.
- **Look at screenshots, not only pass counts.**
- **Deploy:** build from tested `main`; `node --check` every built `sw.js`; confirm `dist/site/super-brady-o-world/icon-180.png` matches `dist/icons/world/`; `apps_test`; then in a gh-pages worktree `rsync -a --delete dist/site/super-brady-o-world/ super-brady-o-world/`, commit, `git push origin HEAD:gh-pages`. Only that folder is replaced. The Art Cart agent also pushes to `main`: fetch and merge first.
- **Rules that must hold:** original content only (nothing resembling Nintendo or other games); the player is always the code-drawn Brady (black tee and trousers, man bun, square shades, no stubble, blackwork sleeves); never caricature people; sacred buildings only as plain distant silhouettes; no Christ the Redeemer; iron tower in daylight or unlit; PG-13; never edit `src/40`–`src/43`; shared files additive only; no `blender -b`, no shared Blender MCP window.
- The scratchpad under `/private/tmp` may be gone. Everything that matters is in git; recreate worktrees from the branches.
