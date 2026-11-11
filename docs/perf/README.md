# Perf work files (sbw/perf, Nov 2026)

Helper scripts and raw results from the performance pass (see `docs/PERFORMANCE.md`). The scripts were run from a
scratch folder next to the repo with `NODE_PATH=<repo>/node_modules`; paths inside them point at that scratch
layout (`../dist-perf`, `../dist-perfbefore`, `../perf-work`), so adjust before reuse.

- `tools/rank.js <pair.json> [n] [refPair.json]`: ranked before/after table from a `--pair` run.
- `tools/final_table.js wk.json cpu4.json t2.json t5.json`: the report table (uses `--ref` per-row references).
- `tools/final_runs.sh`: the intended final measurement (WebKit + Chromium 4x CPU, paired with `--ref 1-1`, MEDIUM
  and LOW tiers, then `--short --write-baseline`). NOT completed: interrupted.
- `tools/lookdiff.js <distA> <distB> <out> <specs> [tier]`: deterministic before/after screenshots + diff montage.
- `tools/staticdiff.js`, `bakediff.js`: pixel checks for held ink pictures and the baked veil.
- `tools/inkbench*.js`, `mapbench.js`, `gradbench.js`: WebKit micro benchmarks (ink pass, map, fills vs blits).
- `tools/bossbox.js`, `bradybox2.js`: measured art reach (source of `BOSS_INK_REACH`, Brady's box).
- `tools/runtests.sh`: all suites one at a time against a private build.
- `results/pair_after*.json`: paired WebKit runs (after vs before = origin/main 89bbc8b + perf hooks), machine heavily
  loaded by other agents, so read RATIOS, not absolute ms. `ranked_*.txt` are the tables from them.
  `final_wk_partial.log`: the last run (87 of 117 scenarios) before it was stopped.
