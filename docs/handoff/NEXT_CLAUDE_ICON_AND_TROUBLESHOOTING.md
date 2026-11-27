# Super Brady-O World: handoff for the next Claude (the new icon, and troubleshooting)

*Brady pastes this into a fresh chat, or says: "Read docs/handoff/NEXT_CLAUDE_ICON_AND_TROUBLESHOOTING.md and help me." Written 28 Nov 2026 at the end of the chat that took the game to 200 levels.*

## Who you are working for
Brady (GitHub `bradymott`) owns the game, plays it on an iPhone 17 and is not a programmer. Talk plainly, show screenshots not code, say exactly what he should try. He sends long voice-typed feedback: act on every point and tell him what you did with each. He has said, for this work: **push each finished thing live without asking** (a fresh cloud chat still needs him to say "push it live" once). She is **Chinka-O**. Rename nobody.

## Where things are
- Repository `bradymott/brady-o`. `main` holds everything live. Live game: https://bradymott.github.io/brady-o/super-brady-o-world/ (served from the `gh-pages` branch, folder `super-brady-o-world/`).
- **200 levels in 34 lands.** Save key `super-brady-o-world-save-v5`. No save reset has ever been needed; do not cause one.
- Read first: `docs/handoff/SBW_RELAY.md` (the whole state of the game; the entries from 25 Nov on, and "THE ROAD TO 200" with the table of the twelve hidden lands and exactly where each entrance is and how it is entered; "How to work safely" has the deploy steps and the rules that must hold).

## Job 1: the new icon
Brady is having ChatGPT draw a new home-screen icon from `docs/handoff/CHATGPT_ICON_BRIEF.md`. He will bring you a **square PNG, 1024 x 1024** (and perhaps a plain-background version). The current one is `docs/handoff/current-sbw-icon-512.png`.

How the icon works today:
- The game's five icon files are committed in `dist/icons/world/`: `icon-180.png` (iPhone home screen), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (Android: cropped to a circle, so the art must sit in the middle 80 %), `icon-32.png` (browser tab).
- `tools/build.js` copies them into `dist/site/super-brady-o-world/`. They are currently **drawn by code** (`window.__sbwIcon` in `src/28_tour_gt_title.js`, rendered by `tools/make_icon.js world`). **Do not run `tools/make_icon.js world` after installing the new art: it would overwrite the PNGs with the old code-drawn icon.** Say so in a comment at the top of `make_icon.js` when you install the new one.
- The title screen may also draw the code icon: grep `__sbwIcon` and decide with Brady whether the title screen should show the new picture too (it would have to be embedded as a data URL; ask before adding weight).

Steps:
1. Look at the PNG he sends (Read tool). Check: square, no text, Brady reads at 60 px, nothing important in the outer 10 % on each side, no transparency. If it fails one of these, tell him what to ask ChatGPT to change rather than patching it yourself.
2. Resize with Python Pillow (installed) or `convert`: 180, 192, 512 from the full image; `icon-maskable-512.png` = the image scaled to about 80 % and centred on a 512 square filled with the icon's own background colour (so a circle crop loses nothing); `icon-32.png` from the full image, and look at it: if it is mush at 32 px, use the plain-background version for that one size.
3. Write them over the five files in `dist/icons/world/`. Show Brady the 180 and the 32 beside the old ones before going on.
4. **Make phones fetch it.** `tools/build.js` only folds icon bytes into the offline-cache version when an app has an `iconDir` (see the line `if (A.iconDir) for (const f of icons) vh.update(...)`). Super Brady-O World has none, so an icon-only change may not change the cache name. Make the smallest fix: hash the app's icon files into the version for every app (drop the `if (A.iconDir)` condition), or confirm the built `sw.js` cache name changed between the old and new build.
5. Build, `node --check` every built `sw.js`, confirm `dist/site/super-brady-o-world/icon-180.png` is byte-identical to `dist/icons/world/icon-180.png`, run `apps_test`, deploy (steps in `SBW_RELAY.md`; `rsync` is missing on cloud machines: replace the `super-brady-o-world/` folder on `gh-pages` by copying).
6. **Tell Brady this, plainly:** an iPhone keeps the icon it saved when the game was added to the home screen. To see the new one he must **delete the game's icon from the home screen and add it again** from Safari (Share, then Add to Home Screen). His save is kept by Safari for that web address and should survive, but warn him first and let him decide; if he would rather not risk it, the icon simply stays old on that phone.

## Job 2: when Brady reports a problem
He will describe it by voice, often with a level number ("14.4" means level 14-4). Work like this:

1. **Reproduce it before fixing it.** Find the level (`grep -n "n: 4, name" src/29_tour_<cc>_levels.js`; hidden lands are `src/29_tour_y_<cc>*.js`; the land table is in `SBW_RELAY.md`). `node tools/dump_level.js <id>` prints the level as text. Then play the spot with a short Playwright script using real inputs. Every land's `tools/sbw_<cc>_shots.js` has the helpers to copy (`play(id)`, `place(tx, ty)`, `sim(seconds, inputs)`, screenshots at 844x390). Take a screenshot and look at it.
2. **Believe him over the tests.** In this chat he reported that a song column in Italy 14-4 could not be left; every test passed, and he was right (a balcony began two tiles away from the column). When a scripted player finds nothing, play it the way a thumb would: holding a direction the whole time, small Brady and big Brady, arriving from the checkpoint.
3. **Fix the smallest thing**, in the land's own file. Never edit `src/40`-`src/43` or `src/28_tour_b_build.js`. Shared files: tiny additive edits only.
4. **Prove it:** `node tools/validate_levels.js <id> --jobs 2` (0 unfinishable, 0 unreachable gold), the land's shots tool with `--checks`, `boss_test <cc>` if a boss is involved, then `sbw_hats_test`, `sbw_hits_test`, `sbw_toolkit_test`, `save_test` (seconds each), then `apps_test` on the site build.
5. **Deploy and tell him what to try**, in one or two sentences, and that he must close the game fully and reopen it (or reload twice) to get the new version.

Things that have gone wrong before, and where to look:
- **"I can't get onto / off / past X":** geometry. A platform too far, a block beside Brady's head, a prop hard against a lift. Dump the level, play it holding one direction.
- **"It's too hard / unfair":** each hidden land's shots tool has a bot (`--bot` or `bot`) that plays with enemies and damage on. Run it, see where it dies, then make that spot kinder (move or slow a critter, lengthen a tell to 1 s, widen a timing window, add a checkpoint). Hidden lands aim at about Nepal's difficulty (`d0: 0.8`).
- **"I can't find the entrance to a hidden land":** the table in `SBW_RELAY.md` says where each is and how it is entered. Offer a hint first (which level), then the clue, then the method: he likes secrets, so do not blurt out the answer. If he found the spot and it would not let him in, test the entrance with real inputs (each land's shots tool has an `entrance` section).
- **"Something is under my thumb / I can't read it":** the stick covers the bottom-left corner and the two buttons the bottom-right; the HUD strip covers the top. Anything the player must see or reach belongs in the middle band of an 844x390 view. Screenshot the spot and move the thing.
- **"A secret room is confusing":** rules must be about eight words on the dark pill, title first then rule, prompts never over the thing being played, cage and prize fully in view.
- **"It lags":** nothing has ever been measured on a real iPhone; Settings has an FPS COUNTER he can turn on. `docs/PERFORMANCE.md` has the performance tiers. Ask which level and what the counter says before changing anything. The game is now much larger than when performance was last looked at (the built game file is about 9 MB): a slow first load after an update is expected once.
- **"I lost my progress / coins / power":** do not guess. `tools/save_test.js` covers the save; `src/29_tour_zz_carry.js` carries powers between levels and rooms; the coin counter is a running total. Ask exactly what he saw.
- **"The old version is still showing":** the offline cache. Close the game fully and reopen, twice. If it persists, compare the cache name in the live `sw.js` on `gh-pages` with the one just built.
- **A hidden land's entrance broke its host level:** each entrance is added from the land's own entry file by amending one host level (France 7-1, Vietnam 10-3, Japan 11-3, Brazil 3-1, Italy 14-1, Amsterdam 8-1, Nepal 12-1, Festival Fields 23-1, Morocco 5-3, Moon 18-1, Spain 6-1, Ecuador 2-1). If one of those twelve levels misbehaves, look there first.

## What is known and still open (say so if he asks)
- **Nothing has run on Safari/WebKit or a real iPhone since 18 Nov.** A cloud machine has Chromium only. Say this each time you deploy, and ask him about lag.
- A cloud machine cannot open the live site: you can confirm a push landed, not that the page serves.
- `sbw_carry_test` hung with no output on the cloud machine on the final build: unknown whether it is the machine or the game. Run it on the Mac if he works there.
- `sbw_items_test` fails 2 of 22 and did before the hidden lands: in a few Encore updrafts (14-4, 18-2, 18-3) holding DOWN does not let Brady drop out, and one item can be lost in a pit.
- The whole-game `validate_levels` (no `--rules`) last said "200 levels, 0 unfinishable, 0 with unreachable gold". `--rules` over the whole game has not been re-run since the hidden lands.
- Difficulty in the twelve hidden lands was tuned by scripts, never by a thumb. Expect to adjust after he plays.
- Not built: Pupo's saddle blanket collecting an object per hidden land found; a found entrance leaving a lasting change in its host level; a final secret for collecting every postcard (`TourPostcards.all()`); Souvenir Stands, Wormholes and Pupo levels for the Encore lands and the hidden lands.

## The machine, if you are in a cloud chat
- Never run `npm install` in the repository: a local `node_modules` shadows the pre-installed Playwright and the browser stops launching. `require('playwright')` works from anywhere.
- Build privately with `BRADY_DIST=<folder> node tools/build.js` (copy `dist/icons` and `dist/icon.b64` into the folder first); build for deploy with plain `node tools/build.js`.
- Browser tools one at a time. The whole-game level check takes about 30 minutes; check single levels instead.
- For anything bigger than a fix (a new land, a new system), this project's way is one Opus builder per job in its own git worktree from a written brief (`docs/handoff/HIDDEN_LAND_BRIEF.md` is the latest and best), builders commit and never push, and **you open their screenshots yourself** before merging: every land in the last chat was sent back at least once for something only looking would catch. `tools/dev/merge_hidden_land_resolve.py` resolves the usual shared-file merge conflicts; check the result with `node --check`.
