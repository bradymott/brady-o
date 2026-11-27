# Brief: one fix job on Super Brady-O World

You are fixing or adding one thing in a 2D platformer web game, Super Brady-O World (132 hand-made levels, 19 lands). Other agents are doing other jobs at the same time, each in its own git worktree. You know nothing else about the project: read what this points to before changing code.

## Who it is for
Brady owns the game, plays it on an iPhone, is not a programmer. He just played the newest build and sent feedback; your job comes from that, quoted in your task. He cares about fun, fairness and polish.

## Read first (in your worktree)
- `docs/handoff/SBW_RELAY.md` (state of the game, rules that must hold), `docs/handoff/README.md` sections 4 and 5.
- `docs/design/TOOLKIT_STATUS.md` (how levels, entities, the checker work) as far as your job needs; `docs/design/PUPO.md`, `docs/design/SECRET_ROOMS.md`, `docs/design/LEVEL_OVERHAUL.md` sections 5-7 if your job touches them.
- Then the source your task names. All `src/*.js` files are joined in name order into one script.

## Rules
- Never edit `src/40`-`src/43`. Shared engine files (`00_core`, `01_audio`, `02_input`, `12_play`, `13_ui`, `99_main`, `28_tour_*`, `tools/build.js`): the smallest change that does the job; where you can, wrap from a new file of your own (`src/29_tour_zz_<yourname>.js`) instead of editing. Other agents are editing other parts of the same codebase: keep diffs small and local so branches merge.
- Do not change the save key. Old saves must keep working (new save fields need defaults).
- The player is always the game's own code-drawn Brady. Original content only (nothing resembling Nintendo or other games). Names: Brady-O, Chinka-O, Pupo, Piwi Squirmin'.
- A file that fails `node --check` breaks the whole game: check before you build.
- First REPRODUCE what Brady describes in the real game in a browser (script it with Playwright; see `tools/gameplay_test.js`, `tools/boss_tests/*.js`, `tools/sbw_*_shots.js` for how tests drive the game) and take a screenshot. Then fix, then show the same script passing. Open your screenshots with the Read tool and look at them (844x390 landscape; 390x844 portrait where layout matters).

## The machine
- Linux cloud container, 4 CPU cores shared, Chromium only. `require('playwright')` works from any folder; `chromium.launch()` needs no options; never install anything. New browser tools must call `silence(context)` from `tools/sbw_silent.js` before `page.goto`.
- Build privately: `BRADY_DIST=/home/user/wt/dist-fx-<name> node tools/build.js` (5 s); run every tool with the same `BRADY_DIST`.
- **Browser tools run one at a time across all agents**: `mkdir /home/user/wt/test.lock` before (retry with short waits until it succeeds), `rmdir /home/user/wt/test.lock` straight after, also on failure. Hold it for one tool run. If the lock is older than 20 minutes it is stale: remove it. Node-only tools (`validate_levels`, `dump_level`, `sbw_toolkit_test`, `sbw_hats_test`, `sbw_hits_test`, `save_test`) need no lock.
- The whole-game level check takes 25 minutes: check only the levels you touched: `node tools/validate_levels.js <ids> --jobs 2`.
- Commit often on your branch, each message ending with `Co-Authored-By: Claude <noreply@anthropic.com>`. Do not push, do not merge, do not touch other worktrees, do not start sub-agents.

## Done means
Your task's points fixed and proven in the real game; a regression check added to an existing test (or a small new `tools/sbw_<name>_test.js`); these pass on your build: `save_test`, `sbw_toolkit_test`, `sbw_hats_test`, `sbw_hits_test`, `gameplay_test <shots dir>`, `sbw_overworld_test`, `boss_test <cc>` for any boss you touched, `validate_levels` for any level you touched. Zero page errors.

## Your report (final message, to the organising agent, not Brady)
What Brady saw and its cause; what you changed (files); anything you decided on his behalf; exact test last lines; absolute paths of before/after screenshots; what is not done; last commit hash.
