# Super Art Kart: relay to the next agent (written Nov 11, 2026)

## Brady: how to continue
1. Open Terminal and run: `cd ~/brady-o && claude`
2. Paste this as your first message:

   > Read ~/Desktop/SUPER_ART_KART_RELAY.md and continue as the Art Cart (Super Art Kart) agent. Use Fable to organize and Opus agents for the building work. Start with the "First things to do" section, then tell me in plain words where things stand.

3. Keep Blender open if you want car or model work done (it is only needed for that).

The live game is unaffected by the unfinished work: https://bradymott.github.io/brady-o/art-cart/

---

## Next agent: read this fully before doing anything

### Who you are and how Brady works
- You are the **Art Cart agent** (the game is now called **Super Art Kart**; display name only). Read `docs/handoff/README.md` and `docs/handoff/ART_CART.md` in the repo for ownership rules.
- Brady (GitHub `bradymott`) is not a programmer and plays on an iPhone. Talk plainly, show screenshots not code, graphics and fun are his top priorities. His standing rule: **nothing may look basic, square or boxy unless boxy is the point** (the pyramid car).
- Working model he asked for: **Fable organizes and reviews; Opus subagents (`model: opus`) do the building.** Look at every screenshot yourself before telling Brady something looks good.
- He wants pushes and deploys done automatically, without asking. He has said "keep going" to the career plan below.
- Memory notes for this project load automatically (`~/.claude/projects/-Users-bradymott-brady-o/memory/`). Read `art-cart-agent-decisions.md` and `deploy-check-service-worker.md` there.

### Where the code is
- Main checkout: `/Users/bradymott/brady-o` (branch `main`; other agents keep uncommitted files there: do not touch them).
- **Your worktree: `/Users/bradymott/brady-o-artcart`, branch `art-cart/quality-bar`.** Do all work there.
- `gh` is not installed; use plain git. Never force-push `main`.
- Node modules: `export NODE_PATH=/Users/bradymott/brady-o/node_modules`.
- Private builds: `BRADY_DIST=<dir> node tools/build.js`. Copy `/Users/bradymott/brady-o/dist/icons` and `dist/icon.b64` into `<dir>` first or the app ships without icons.
- Scratch scripts and the briefs used for subagents are saved in `tools/dev/` (the old scratchpad in `/private/tmp` may be gone).

### State of things
**Live and on `main` (all tested, Brady has seen it and said "everything looks amazing"):**
- New showroom, all 12 cars rebuilt in Blender with moving parts, living fire on the octopus.
- Power-ups: fixed Foam Party / Dust Devil / Whistle, sky drops (Sky Mail, Bombs Away, Duck Downpour), a signature special per car, power-ups guide, specials on car cards.
- Tracks and arenas polish, night lighting, triangle counts under budget (peak about 412k; only the player and one rival use the 30k showroom model).
- Dawn/sunset glare removed (`CART_LOW_SUN` in `src/43_cart_c_world.js`).
- The offline-cache (service worker) bug that froze phones on old files is fixed; the game reloads itself on update (`CartFresh` in `src/43_cart_f_menu.js`).

**In progress, NOT on `main`, NOT deployed (branch `art-cart/quality-bar`, last commit is marked WIP):**
- **Career mode, Battle Royale, 12 drivers, secret levels, stat points.** The design is `docs/ART_CART_CAREER.md` (Brady's brief turned into rules; "(default)" marks choices made for him).
- At the stop (Nov 11): the combined branch **builds and all three games boot** (`apps_test` 3/3). The framework's own test passed 47/47 (it plays a career run, the Burn the Man final and a royale run end to end). Battle Royale, The Sound Camp, the Man boss, the 12 drivers with specials, and the Love Parade track are all built and playable, but **each agent's last round of tweaks was not re-tested**, the item/battle/showroom suites were not rerun on the combined branch, and many of the new screenshots have not been looked at by anyone. Treat it as "feature-complete first draft, unverified".
- Known loose ends from the reports: arenas marked `royale: true` (`sound`, `man`) still show in the old battle menu (hide them); three driver specials hit with kind `'drv'` and Battle Royale must decide their damage; the Man boss difficulty for a real player is unknown (480 HP, autopilot dodges perfectly); portrait screenshots of royale were never captured.
- Three Opus agents were stopped mid-build. Each left a status file. **Read these first; they say what is done, half-done and not started:**
  - `docs/handoff/WIP_C1.md` — framework: menus, progression/save, stat points, Burn the Man plunger final, secret-level gating (`src/43_cart_h_career.js` and friends)
  - `docs/handoff/WIP_C2.md` — Battle Royale rules, Bass Valentine's arena "The Sound Camp", the Man boss (`src/43_cart_i_royale*.js`)
  - `docs/handoff/WIP_C3.md` — the 12 drivers and their specials, Bass Valentine's career track "Love Parade", and the level recipe `docs/ART_CART_LEVEL_RECIPE.md` (`src/43_cart_j_*.js`)
- **Rename to Super Art Kart and the new icon** are done in the same branch (not live). Icon generator: `tools/cart_icon.js` (`node tools/cart_icon.js <dir>/icons/kart A`). Chosen design A (heart racer); copies and the three candidates are in `~/Desktop/super-art-kart-icons/`. Brady has not picked a different one.
- Driver list (Brady's final word): Brady, Chinka, Sparkle Pony, DPW Punk, Death Guild, Crusty Old Burner, Overzealous Ranger, Annoying DJ, Darkwad, Bad Idea Guy, **Messiah Complex**, **Party Boy**. (I assumed Party Boy replaces Partied Too Hard and Messiah Complex replaces Undercover Cop; Brady has not confirmed which driver Party Boy replaces.)

### First things to do
1. `cd /Users/bradymott/brady-o-artcart && git status && git log --oneline -5`. Merge `origin/main` into the branch.
2. Build and run the tests (below). The WIP commit may not pass everything: fix that first.
3. Read the three WIP files and `docs/ART_CART_CAREER.md`, then restart three Opus agents with the same split (framework / royale / drivers + first track), using `tools/dev/briefs/CAREER_BRIEF.md` as the shared brief plus each WIP file as "where you are". They share files, so the brief's rules about small local edits and registries matter.
4. When the foundation is complete and tested end to end (stand-in levels for the 11 cars without their own), merge to `main`, deploy, and ask Brady to play Bass Valentine's track and arena.
5. After his reaction: build the other 11 career tracks and 11 royale arenas and five new secret levels in parallel batches, using `docs/ART_CART_LEVEL_RECIPE.md`; then balance, polish and the win-the-game celebration.

### Tests (always pass an output directory; defaults write into the repo)
```
node tools/apps_test.js <dist>/site <shots>           # all 3 games boot
BRADY_DIST=<dist> node tools/cart_showroom_shots.js <shots> medium heart,fish,octo,dragon,duck,pyramid,cupcake,galleon,snail,jelly,shark,whale
BRADY_DIST=<dist> node tools/cart_item_test.js <shots>     # every item, special, weapon
BRADY_DIST=<dist> node tools/cart_battle_test.js <shots>   # arenas
BRADY_DIST=<dist> node tools/cart_shots.js <shots> heart gp
```
New test files from the career agents are named in their WIP files (`tools/cart_career_test.js`, `tools/cart_royale_test.js`, `tools/cart_driver_test.js`). Error counts are not enough: **look at the screenshots.**

### Deploy checklist (learned the hard way)
1. Merge latest `origin/main`, rebuild, re-test. Push the branch to `main` (fast-forward) and confirm with `git merge-base --is-ancestor HEAD origin/main`.
2. `node --check` a copy of every built `sw.js`.
3. In a `gh-pages` worktree: `rsync -a --delete --exclude skintest <dist>/site/art-cart/ art-cart/`. Deploy **only `art-cart/`**; the Burning Man agent keeps test files in `art-cart/skintest/`.
4. Commit, push, then confirm the live `sw.js` cache name matches the build.
5. Tell Brady to open the game and wait about 20 seconds on the menu; it reloads itself. A changed home-screen icon only appears after he removes and re-adds the shortcut.

### Rules that bit us
- Engine files `src/40_*`, `41_*`, `42_*` belong to the Burning Man agent: never edit; requests go in `docs/handoff/REQUESTS.md` (nine are open there).
- Blender 5.2.3 crashes in background mode; use the Blender MCP in the open window, one self-contained call from a wiped scene, and check each exported glb has its rig bones and no `.001` names.
- iPhone budget: every view ≤ 420k triangles, ≤ 120 draw calls, no per-frame allocations.
- Original content only; no brands; PG-13. Brady and Chinka are real people (the owner and his wife): warm treatment, Brady in all black, Chinka ivory and gold. Messiah Complex: the joke is his self-importance, no religious symbols or scripture.
- "Super Art Kart" resembles a famous kart game's title pattern: fine for the personal site, flag before any commercial release.
- When Brady says he can't see a change on his phone, suspect the offline cache first and test the update path; don't just tell him to reopen.

### Open items besides career mode
- ChatGPT's PR #1: cherry-pick only the wheel rims and per-track road colours, after the Burning Man agent lands PR #3 (not landed as of Nov 11).
- Playtest balance of the car specials; weak visuals (Rogue Wave, Storm Hover lightning, Prism Warp); new sounds for the power-ups (currently reused).
- Four arenas (deep, moon, mud, temple) have had no scenery pass.
- Nothing has been measured on a real iPhone beyond Brady's "feels smooth".
