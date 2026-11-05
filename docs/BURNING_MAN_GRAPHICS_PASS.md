# Burning Man graphics pass — work in progress

This branch starts from main at `823a4d9e5434abc989c9ce340ee01be66d0a2a38`.
It is a draft for integration with Claude's continuing development, not a deployed graphics release.

## Changes

- `tools/blender/brady.py`: replaces the stacked head/jaw and fixed toothy smile with a continuous jaw/cheek/temple surface, recessed sockets, a defined nose, closed lips, ear detail and fine geometric stubble. Uses black trousers and dark soles, short tied-back hair, squarer shades, continuous geometric ink across both upper arms and forearms, and restrained collar/cloth construction. Keeps the existing skeleton and animation builder.
- `src/40_burns_d_rig.js`: the procedural fallback also wears black trousers without the denim pattern.
- `src/40_burns_b_gl.js`: filters fine ground cracks by screen footprint on derivative-capable tiers, reduces distant bump amplitude, adds subtle close-range wind-combed dust, and disables depth of field on medium quality to preserve gameplay clarity. High and ultra retain it.

## What was checked

- Python source compilation passed.
- Changed JavaScript files passed `node --check`.
- `node tools/build.js` passed using a source-only local checkout. Models, sprite atlases and embedded fonts were not downloaded for that local build.
- All three app bundles passed JavaScript parsing with `vm.Script`.

## Blocking verification

Blender 5.2.3 crashed during Metal GPU detection before the script ran. The revised Brady asset has therefore **not been exported or visually validated**. `assets/models/shared/brady.glb` is unchanged on this branch. Building the web app alone will not display the revised Blender character.

The browser inspection also stalled. No screenshot comparison, WebGL shader compilation, animation/skin deformation test, gameplay regression test, or real-iPhone performance test has passed in this session. The source changes must remain a draft until these checks are complete.

## Next integration steps

1. On a working Blender installation, run `CHAR_PREVIEWS=/tmp/brady-pass /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/blender/brady.py`.
2. Inspect the face, profile, tattoos and motion renders. Check head-surface normals, neck join, facial silhouette, ink resolution and triangle count; simplify as needed toward the existing 15–25k hero budget. This is a procedural model improvement, not a scanned or photo-matched likeness.
3. Commit the resulting `assets/models/shared/brady.glb` only after visual approval. The shared asset and renderer also affect Art Cart, so inspect both games.
4. Build from a full checkout, run `tools/apps_test.js`, `tools/char_test.js`, `tools/skinactor_test.js` and the existing rendering tests. Compare medium and low WebGL paths, particularly the playa at a grazing camera angle.
5. On an iPhone, inspect Root Society at sunset/night and the busy Esplanade. Measure frame rate and check interaction visibility before publishing.

## Remaining art scope

Chinka, the wider cast, vehicles, camp structures and landmarks have not been remodelled in this draft. Achieving the requested realism still needs authored skin/hair/cloth textures, detailed character meshes, environment assets and device profiling. Keep further assets modular and retain the current world and mission APIs.
