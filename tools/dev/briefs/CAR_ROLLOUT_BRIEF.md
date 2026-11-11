# Art Cart car rollout brief (shared by all car agents)

Repo worktree: /Users/bradymott/brady-o-artcart (branch art-cart/quality-bar). Work ONLY there, never in /Users/bradymott/brady-o.
Scratchpad: S = /private/tmp/claude-501/-Users-bradymott-brady-o/300b6139-7b8a-41ee-8c06-1aa73a659be0/scratchpad

## Context
Owner Brady is a non-programmer who plays on an iPhone; graphics are his top priority ("very very highly polished"). He approved Bass Valentine as the quality bar; you bring your assigned cars up to that bar. Read first:
- docs/handoff/README.md, docs/handoff/ART_CART.md, docs/ART_CART_GLTF_PILOT.md, docs/BURNS_GUIDE.md §6.8–6.10
- The quality-bar car, as your template: tools/blender/bass_valentine.py, the new helpers in tools/blender/cartkit.py (inflated shapes, vertex-colour painting, closed lathe, premium wheels, premium speakers, optional exporter settings), and commit 591965d (`git show 591965d --stat`, then read the diffs to src/43_cart_b_models.js, src/43_cart_bb_glb.js, src/43_cart_e_scene.js) to see the rigV / named-part / heartbeat / chase-camera sculpture-top-height pattern.
- Look at the bar: S/shots-heart/final-showroom/car-heart-landscape.png, car-heart-detail.png, S/shots-heart/final-glb/sunset-esplanade-grid.png, night-burn-mid.png.

## Per car, deliver
1. Blender rebuild (tools/blender/<car>.py → assets/models/art-cart/<car>.glb and <car>_lo.glb, plus the .blend if the pipeline saves one): rounded sculpted forms with bevelled edges (no flat extrusions or plain boxes), glossy clear-coat paint with baked per-vertex colour gradients, chrome trim/bumpers/grille, glass, premium wheels, glowing LEDs/under-glow, and charming character detail. Keep each car's existing identity, colours, name and silhouette recognisable — upgrade, don't redesign. Original designs only: never copy a real art car, brand or other game.
2. Real moving parts as separately named nodes, animated in-game (showroom AND race) via the rigV pattern, with older cached glb files still working. Use the car-specific motion named in your assignment.
3. Chase camera: from the 8-car start grid in chase cam, the road and pack must be visible; if the sculpture is tall, declare its top height (the mechanism Bass Valentine uses) and/or lower it.
4. Budgets: showroom ≤ 30k tris; race `_lo` ≤ 7k target, 8k hard limit; bones within the car rig limit; 1 draw call per car (vertex-colour path, no texture maps); shipped sizes similar to Bass Valentine (≈133 KB / 39 KB gz).
5. Keep the procedural fallback working (no need to restyle it).

## Blender rules (IMPORTANT — several agents share ONE open Blender window)
- Blender 5.2.3 CRASHES in background mode (`blender -b`). Never use it. Use the Blender MCP (mcp__blender__*; load schemas with ToolSearch).
- Because other agents are using the same Blender concurrently, EVERY execute_blender_code call must be fully self-contained: one call that resets the scene, builds the car, exports the .glb files, renders preview PNGs to files, and saves the .blend — e.g. `import runpy; runpy.run_path('/abs/path/tools/blender/<car>.py', run_name='__main__')`. Never rely on scene state left by an earlier call, and don't use `look`/get_scene_info to inspect (another agent may have replaced the scene) — instead have your script render previews to PNG files and Read those.
- Iterate cheaply before touching Blender: a stand-in Blender module and dry-run/preview tools exist in S/stubs/ (bpy.py, bmesh.py, mathutils.py, dryrun.py, preview_glb.py) — read them; use them to catch script errors and count triangles, then do real exports through the MCP.
- No generate_3d, no asset imports (original content, no credits).
- If the MCP is unreachable, don't fall back to background mode; do what you can and report what is blocked.

## Code rules
- Edit only: tools/blender/<your cars>.py, assets/models/art-cart/<your cars>*, assets/blender/<your cars>*, and car-specific sections of src/43_cart_b_models.js, src/43_cart_bb_glb.js, src/43_cart_e_scene.js, src/43_cart_a*.js. tools/blender/cartkit.py: additive changes only (11 other cars and 3 other agents depend on it; don't change existing helpers' behaviour).
- Other agents are editing the same shared src files for their cars at the same time. Keep edits small and local to your cars' blocks; re-read a file right before editing it; never rewrite or reformat a whole shared file; never revert changes you didn't make. Write large new content outside src/, `node --check` it, then move it in.
- Do NOT edit src/40_* or src/41_* (shared engine, another owner) or the showroom files src/43_cart_fa_stage.js / src/43_cart_f_menu.js. If you need something there, describe the request in your report.
- Do NOT git commit, stash, checkout or reset. Leave changes in the working tree.

## Build and verify
- `export NODE_PATH=/Users/bradymott/brady-o/node_modules` (the worktree's node_modules is only links).
- Private build: `BRADY_DIST=S/dist-<yourtag> node tools/build.js`. If the build fails because of another agent's half-written file, wait a minute and retry; don't fix their file.
- Always pass an output dir to test tools (they default to the repo's shots/): S/shots-<yourtag>/.
- Run: tools/apps_test.js, tools/cart_shots.js <out> <carId> gp, tools/cart_showroom_shots.js <out> medium <carId> (read each script for exact args), and for chase-cam grid/mid-race shots copy S/race_shots.js.
- Read your PNGs and iterate until each car honestly matches the Bass Valentine bar in the showroom and reads well from behind in a race, day and night.

## Report (final message)
Per car: what changed, tri counts (showroom/_lo), shipped sizes, moving parts, test results with real numbers, absolute paths to before/after screenshots (showroom landscape, close-up, chase-cam grid, night), what still looks weak, any engine/showroom requests. Separate verified from inferred.
