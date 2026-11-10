# Burning Man graphics pass: what we kept from ChatGPT's PR #3, and the new Man

Branch `burning-man/graphics-salvage`. PR #3 (`codex/burning-man-graphics-pass`) was not merged whole; Brady agreed
to keep its good half. This file says what was kept, changed and dropped, and why.

## Kept (some of it fixed)

| What | Where | Notes |
|---|---|---|
| Brady's new look: all-black clothes, full blackwork sleeves on both arms, stubble, tidy bun, clean nape | `assets/models/shared/brady.glb`, `tools/blender/brady.py` | The PR's GLB had stray black spikes and barcode-like dashes on the tee: six thin `cloth_fold` capsules and two `tee_hem` capsules that skinned badly. They were cut out of the index buffers by a node script (no Blender) and removed from `brady.py`. The PR's run clip looked like a stiff speed-walk, so main's `run` clip was copied into the GLB (identical 26-joint skeleton, 156 accessors); `charkit.py`'s `clip_run` uses `gait_classic` (main's run) to match. 19 clips, names unchanged. 23.4k triangles (main 10.6k). |
| Planted-foot procedural walk | `src/40_burns_d_rig.js` (`burnsTravelPose`, `BURNS_GAIT`) | Fixed: the arms swing opposite the legs (left arm back at the left heel strike; the PR was a quarter cycle off), the hip turn, chest counter-turn and hair bob are back, and nothing is allocated per frame. The run is main's run pose. |
| Distance-driven cadence | `src/40_burns_d_rig.js`, `src/40_burns_be_skinactor.js`, `src/40_burns_m_open.js` | The stride phase follows the ground covered, so feet don't skate; when the character isn't moving (dialogue portrait, pushing into a wall, a crowd pose) it runs on the clock instead of freezing. Skinned walk/run clips follow the same phase. |
| Dialogue speaker framing | `src/40_burns_i_play.js` (`dialogFrame`, `dialogShot`) | Now opt-in by default behaviour: only for say lines in a cutscene with no authored camera, never in first-person view, eased in and out (no hard cuts), a 3/4 front shot of the speaker's face above the dialogue box, chosen once per line with a clear line of sight. `frame: true/false` per step, `{ framing }` per cutscene, `def.dialogFraming` per world. Authored cameras and their fov (e.g. World 5's 0.32 telephoto) are untouched. |
| Medium tier without depth of field | `src/40_burns_b_gl.js` | `{ dof: 'auto' }` and authored apertures work exactly as on main (high/ultra still render them). |
| Anti-shimmer filtering | `src/40_burns_b_gl.js` | Cloth weave fades by its screen footprint; fine playa crust is filtered by `fwidth`. Both sit inside `#ifdef BUMP`, which only exists when derivatives are available (WebGL2 on iOS). |
| Spoked bike wheels, near LOD only | `src/40_burns_e_props.js` (`bikeShape`) | Rebuilt cheaply: an open rim and two crossing spokes. `bikeShape` 160 → 224 triangles near (the PR's version was 808); the far LOD is unchanged. |
| Brady's code-drawn fallback in black trousers | `src/40_burns_d_rig.js` | `bottom: 'pants'` instead of jeans. |
| Art Cart driver preview framing | `src/43_cart_f_menu.js` | Only the PR's hunk: the Man driver's head is no longer cut off. |
| Tests | `tools/graphics_test.js`, `cinematic_test.js`, `npc_gait_test.js`, `gait_test.py` | Adapted to what we kept; all exit non-zero on failure. `graphics_test` compares every world's draws/triangles at its spawn camera and every procedural prop with `tools/graphics_baseline.json` (main's build): at most +4% triangles and +3 draws per world, +50% per prop. |

## Dropped, and why

- **Chinka's remodel** (main's `chinka.glb` stays: Brady chose the ivory and gold gown; the PR turned her gold grey and flattened her face) and `tools/blender/chinka.py` changes.
- **The six prop GLBs** (bus, dome, potty, rv, shade, tipi) and `bmkit.py`'s baked "surface finish": the RV got soot-like smears, the others barely changed. `cartkit.py`'s export flag and `graphics_pass.py` went with them.
- **The timber Man, the `manPavilion` saucer/chrysalis and the World 10 rewrite**: replaced by the lattice Man below. The rewrite also left invisible leg colliders, tractor beams from nothing, petals with no collision that blocked the camera, and a wooden pavilion flying 52 m up in the giant phase.
- **The two always-on warm point lights** at the Man (city and World 10): they used two of the four phone light slots all day.
- **World-space "patina"** on matte surfaces: it slid across moving instanced meshes.
- **The fog-start change** (`max(d - 4, 0)` in every world, Art Cart too): not clearly better in side-by-side city shots.
- **Heat shimmer and god rays turned down in cutscenes**: main's behaviour is kept (the PR switched god rays off in every world that doesn't set `env.rays`).
- **NPC head remodel and matte skin** (`40_burns_da_round.js`): barely visible, and that file is shared with Art Cart's PR #1.
- **Wheel vents, window glass bands, shade frames and cables, tent seams**: 2–5x heavier near-LOD props for sub-pixel detail.
- **Skinned-shader light wrap 0.4 → 0.22**, the Man boss's lost hurt cue, the PR's notes and its `docs/graphics-pass`, `docs/cinematic-pass` image folders.

## The Man (new)

Brady wanted the classic lattice "stick man", not a timber statue. `BurnsManModel` (`src/40_burns_e_props.js`) is one
shared model for the city landmark, every boss (Worlds 1, 2, 9, 10, 14 and the title), and Art Cart's driver,
portrait and Burn Night landmark:

- open timber trusses with crossed bracing on every face, legs apart (the knee and ankle bone offsets splay outward),
  a narrow waist under broad shoulders, long arms, a faceted six-rib lantern head, a heart in the chest;
- neon tubes along the front edges of every limb, the shoulders, the hips, the feet and every rib of the head;
- about 5.7k triangles (main's Man was 13.2k), one draw call.

**Rainbow neon, in the shader.** The tubes are white emissive vertices, the lantern core white at 0.75 emission and the
heart red. `geo.rainbow = { bone, at }` marks the model; `R.skin()` then sets `uRain` (his heart's world position and
1/scale, from his own bone palette) for that one draw, and the skinned fragment shader colours those vertices: a
rainbow whose hue travels outward from the heart (one full colour cycle about every 14 s at any point), a soft
brighter band rolling outward about every 4 s and a slow breath. Nothing strobes: every change is well under 3 Hz
and the dimmest neon is about half the brightest. The heart beats about once a second. By day (the renderer's night
factor) the tubes are unlit grey glass and the heart is red paint. It costs a few ALU ops on his own fragments, one
`uniform4f` per skinned draw, no extra draw calls and no mesh rebuilds. It blooms like the engine's other neon.

**Hurt cue.** The neon turns red when he is hit and throbs red while he is stunned, on top of main's heart sprite.

**Light on the base.** `BurnsManModel.light()` queues one point light in the current neon colour at night (city and
World 10); like any point light it only gets a slot when the camera is near.

**Scale.** The city Man is now scale 2.0 (main 1.45): about 26 m on the 7.5 m pavilion, readable from across the
city. World 10's saucer, colliders and arena are unchanged; the boss keeps scale 1.

## Script and GLB consistency

- `brady.glb` matches `tools/blender/brady.py` + `charkit.py` (walk: planted-foot `gait`; run: `gait_classic`).
- `chinka.glb` was built by main's `charkit.py` (the old sinusoidal walk). Re-exporting Chinka with this
  `charkit.py` would give her the planted-foot walk: a known script/GLB mismatch, left on purpose.
- The six prop GLBs match main's `bm_*.py` and `bmkit.py`.
