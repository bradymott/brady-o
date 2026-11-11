# Realistic Brady: motion fixes (WIP, branch burning-man/brady-motion)

Stopped mid-task (Brady closing the laptop). Nothing pushed. Nothing below has been seen running in the game yet.

## The two fixes

### 1. Brady turns into the cartoon model in some states

The cause: `BURNS_SKINACTOR.MAP` (`src/40_burns_be_skinactor.js`) had no clip for these player states, so they fell back to the procedural model. The states and what the WIP code does with each:

| Engine animation | Before | Now |
|---|---|---|
| `flip` (double jump, springs) | procedural | new `flip` clip (tuck) + the somersault pitch from the procedural pose |
| `spin` (spin attack) | procedural | new `spin` clip (arms out) + the yaw spin and hop from the pose |
| `pound` (ground pound, tuck and slam) | procedural | new `pound` clip (tuck) + the pitch from the pose |
| `bike` (yellow bike, e-bike, stunt bikes in worlds 3, 16 and big art) | procedural | new `bike` clip (pedalling) + pitch/roll from the pose; the custom pose functions (`poseFn`) on bikes now stay skinned |
| `climb` | procedural | new `climb` clip |
| `fly`, `float` | procedural | `jump` clip (fly also gets the pitch) |
| `victory` | procedural | `cheer` |
| `throw`, `bell` | procedural | `wave` |
| `clipboard` | procedural | `talk` |
| `dazed` | procedural | `hurt` |
| `burnsDJBrady` | procedural | `dance` |
| `bbaZip` | procedural | `cheer` (a guess; check how it looks) |
| pilot seats (world 14 flight) and other `poseFn` users without a mapped animation | procedural | still procedural (unchanged) |

- The new clips (`spin`, `flip`, `pound`, `bike`, `climb`) have no FALLBACK on purpose. Chinka and the mannequin don't have them, so they still use the procedural model for those states, as before.
- Engine changes:
  - `BurnsSkinnedChar` (`src/40_burns_bc_skin.js`) gained whole-body `pitch`, `roll`, `yaw2`, `pivot` and `dy`.
  - The skin actor copies these from `ch.P` for the states listed in `BURNS_SKINACTOR.ROOT`.
- **Untested:**
  - the pivot height (it uses `P.pivot` as metres);
  - the bike seat height (the bike clip drops the hips 0.2 m, set by `bike_hip` in `CLIP_CFG`);
  - whether the pitch direction matches the procedural model.

### 2. Gait rocks side to side and the head swings

All in `tools/blender/realistic_brady/bl_clips.py`:
- **New `calm()` function** (applied to walk and run):
  - hip and spine side-to-side roll is cut to 25% (run: hips yaw ±0.06 → ±0.015 rad; spine roll summed over three bones ±0.12 → ±0.03);
  - hip and spine twist (yaw) is cut to 35%;
  - the neck and head counter-rotate so the head stays level and facing forward.
- **Run only:**
  - vertical bob 0.05 → 0.035;
  - arm swing 0.7 → 0.62;
  - elbows 1.3 → 1.15 (more relaxed).
- **Feet planted:** the skin actor now sets the walk/run clip phase from the ground actually covered, instead of the procedural model's stride phase:
  - walk: 1.45 m per cycle, the clip's own planted-foot stride;
  - run: 5.2 m per cycle at 7.6 m/s, scaled by (v/7.6)^0.6, about 6.4 m at 10.6.
- **Not judged in motion yet:** no before/after in-game strips exist.

## Done
- 24 clips exported: the 19 originals (the seated `drive`/`fire`/`sulk` unchanged) plus `spin`, `flip`, `pound`, `bike`, `climb`.
- Face poses stripped to the face joints with `strip_face_channels.js`.
- The new `assets/models/shared/brady.glb` is committed.
- `tools/skinactor_test.js` is extended: it now asserts the player stays skinned through double jump, spin and pound, and rides the bike skinned. **It has not been run.**
- The Blender contact sheet of the new clips looked right (`private/work/wip/clips2/sheet.jpg`).

## Half-done or untested
- **The capture script** `tools/brady_motion_shots.js` (gait strips plus the action states, deterministic frames with Playwright's clock):
  - the boot / clock setup kept failing ("Cannot fast-forward to the past", then a slow-load timeout while other agents were running browsers);
  - the latest version installs the clock with an explicit start time;
  - **no strips or state shots exist yet, before or after.**
- **No tests have been run on this branch.**

## Next steps
Use a scratch folder `S` (any writable place) and run from the worktree.

1. **Before build** (origin/main at 977b00a; this commit's merge base):
   `BRADY_DIST=$S/dist-motion-before node tools/build.js`
   Build it from a checkout of 977b00a, not this branch.
2. **After build:**
   `BRADY_DIST=$S/dist-motion node tools/build.js`
3. **Strips and state shots,** before and after:
   `BRADY_DIST=$S/dist-motion-before node tools/brady_motion_shots.js $S/shots/motion before all`
   then the same with `dist-motion` and `after`. If the clock calls still fail, drop `page.clock` and step with `debug.sim()` between screenshots.
4. **Look at the shots and fix in one pass:**
   - bike seat height: the `bike_hip` value in `bl_clips.py`, regenerate the clips in Blender (see the header of `bl_clips.py`), run `bl_export.py`, then
     `node tools/blender/realistic_brady/strip_face_channels.js private/work/export/brady.glb assets/models/shared/brady.glb`
   - flip/pound pivot height and pitch direction (`src/40_burns_bc_skin.js` compute).
5. **Tests,** one at a time:
   `BRADY_DIST=$S/dist-motion node tools/<name>.js`
   for skinpbr_test, skinactor_test, char_test, burns_flow_test, burns_nav_test and cart_battle_test, then apps_test with
   `node tools/apps_test.js $S/dist-motion/site $S/shots/apps`
6. Commit on this branch; no push.

## Where things are
- Blender working file: `private/work/brady_full.blend` (git-ignored).
- Every rebuild script: `tools/blender/realistic_brady/`, plus copies of the extras in `private/work/scripts/`.
