# Art Cart touch-up pass (addendum to CAR_ROLLOUT_BRIEF.md)

Read S/CAR_ROLLOUT_BRIEF.md first: every rule there still applies (worktree, Blender MCP rules, code rules, budgets, build and verify, report format). S = /private/tmp/claude-501/-Users-bradymott-brady-o/300b6139-7b8a-41ee-8c06-1aa73a659be0/scratchpad

State: all 12 cars were already rebuilt to the Bass Valentine bar (commit ed8c663, rigV 2 part tables in src/43_cart_bb_glb.js) and are LIVE. This pass fixes the specific weak spots listed in your assignment. It is a touch-up, not a rebuild: keep what works, keep node names and rigV 2 tables compatible (if you add or rename an animated node, the already-shipped rigV 2 glb must still animate without errors — add a new rigV only if truly needed, following the existing versioning pattern).

Extra rules for this pass
- Two touch-up agents share ONE Blender window right now. Every execute_blender_code call must be self-contained AND must start from a wiped scene (the earlier rollout hit a bug where leftover objects made cartkit name things `body.001`, and the exported glb lost its rig bones). After every export, verify the glb: no node name ending in `.001` etc., rig bones present, rigV recorded.
- Total triangle headroom is tight: the busiest arena view peaks at 439,724 tris against a ~450k budget. Your `_lo` race models must NOT grow in triangle count (spend showroom-model triangles instead, limit 30k). Report before/after tri counts for both.
- Chrome and mirror surfaces read white because of an engine issue that is not ours to fix (docs/handoff/REQUESTS.md #1). Don't fight it with geometry; you may darken a metal's base colour if that honestly looks better.
- Do not touch src/43_cart_f_menu.js or src/43_cart_fa_stage.js (the organizer is editing the menu now), src/40_*, src/41_*.
- Do NOT git commit. Leave changes in the working tree and list every file you changed.
- "Before" screenshots of the current state: S/shots-deploy/showroom/ (car-<id>-landscape.png, portrait) — make your own before shots for other angles with tools/cart_showroom_shots.js and tools/cart_shots.js before changing anything.
- Use your own tag for private build and shots dirs (S/dist-<tag>, S/shots-<tag>/). Tests need `export NODE_PATH=/Users/bradymott/brady-o/node_modules` and `BRADY_DIST=S/dist-<tag>`.
- Judge honestly from the PNGs. If a fix does not clearly look better than before, say so rather than claiming success. Final check for each car: showroom landscape + portrait, a close-up, chase-cam start grid, one night shot; then apps_test and tools/cart_battle_test.js (exit 0, report peak tris).
