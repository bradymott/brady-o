# Brady Goes to Burning Man: handoff for its agent

Read [README.md](README.md) first: owner, ownership rules, appearance rules, deploy.

**Your mission:** make it look as realistic as a phone allows, using Blender and the existing web engine. Brady ruled out Unreal Engine.

He doesn't want "stick figures". He wants believable people, vehicles and camps, real dust, light and fire, and a city that feels alive. You also own the **shared 3D engine**, which Art Cart runs on.

## What exists (on `main`)
**The game:**
- **An open-world Black Rock City (world 500)** with streaming tiles, instancing, LOD, a fast-travel map and HOME at Brady's tipi.
- **17 story worlds** you enter from the city, each with a cinematic in and out:
  - The Line, No Camp, Rhythm Wave, Root Society (home), Costume Cult, the Orgy Dome
  - Costco Soul Trading, the Art Car Hunt, the Sound Camp Crawl, the Sunrise Set
  - Hell Station, the Deep Playa Showdown, the Temple, the Workshops, the Skydive
  - the Man Pavilion and the Burn, and the secret Exodus
- **The city itself:** 10 theme camps (`41_burns_camps`), 8 big art pieces (`41_burns_bigart`), DJ decks (`41_burns_dj`), 8 city missions, Root Society's 12 city side quests, Thunderdome bouts, an art-car race, three camera modes and story cinematics.

**Guides:**
- Engine API: `docs/BURNS_GUIDE.md`. It is the authority; keep it current.
- Story and cast: `docs/design/`. Camps: `docs/BURNS_CAMPS.md`. Big art: `docs/BURNS_BIGART.md`.

**The Blender pipeline (local session, Nov 3):**
- **Loader:** `BurnsGLTF`, plus skinned characters (`src/40_burns_bc_skin.js`, Mixamo-named joints) and textured PBR with sky-probe reflections (`src/40_burns_bd_pbr.js`). See §6.8–6.10.
- **Brady and Chinka** are rigged, animated `.glb` files with 19 clips each, in `assets/models/shared/`. Brady plays as the skinned model.
- **Burning Man props:** the RV, bus, geodesic dome, tipi, porta-potty and shade are Blender models (`tools/blender/bm_*.py`, hooked in by `src/41_burns_glbprops.js`).
- **Size:** models ship packed and gzipped.

## Waiting for you: ChatGPT's PR #3 (draft) (`codex/burning-man-graphics-pass`)
**Read its notes:**
- `git show origin/codex/burning-man-graphics-pass:docs/BURNING_MAN_GRAPHICS_PASS.md`
- `git show origin/codex/burning-man-graphics-pass:docs/CINEMATICS_MAN_AND_MOVEMENT.md`

Its review images are under `docs/graphics-pass/` and `docs/cinematic-pass/` on that branch.

**What it does (about 40 files and 8 revised GLBs):**
- **Brady:** a remodelled character (23.8k triangles, 26 joints) with a continuous head and torso, tied bun, black trousers and geometric sleeves.
- **Chinka:** remodelled too (11.7k triangles). Her outfit changed to ivory, a pleated skirt and gold. **That conflicts with her original look; ask Brady** (see README §4).
- **NPCs:** jaw and temple geometry, and matte skin.
- **Renderer:** fog silhouettes, cloth-weave filtering, vehicle and bike detail, tent seams, cables, and baked dusty finishes on the exported props.
- **Cinematics:** sharp-focus story shots, and auto-framing of whoever is speaking above the dialogue panel.
- **A new timber Man:** a carved wooden figure on a "saucer and chrysalis" pavilion, shared with Art Cart's Man driver, portrait and landmark. **Show Brady before you merge.**
- **Walking and running:** distance-driven, planted-foot cycles for heroes and NPCs.
- **New tests:** `tools/graphics_test.js`, `cinematic_test.js`, `npc_gait_test.js` and `gait_test.py`.
- **ChatGPT's own caveats:**
  - Its full gameplay tests stalled and don't count as passed.
  - It did no iPhone profiling.
  - The result is still stylised: no photo-matched likeness and no realistic skin, hair or cloth textures.

**Integration steps (you merge first; Art Cart's PR #1 waits for you):**
1. Rebase onto `main`, then build.
2. Run its tests, then **the full regression**:
   - the all-worlds load (`tools/burns_allworlds_test.js`; every registered world: 1–17, 98, 99, 500, 900)
   - the open-world flow (`tools/burns_flow_test.js`): title, city, enter a place, results, back at the door, map travel, Continue
   - `char_test.js`, `skin_test.js`, `skinactor_test.js`, `pbr_test.js` and `bm_props_test.js`
   - `tools/apps_test.js`
   - Art Cart's smoke and battle tests, because you touched the engine and its Man
3. **Look at the screenshots:** faces, dialogue framing in both orientations, the city by day and at night, the Burn.
4. Show Brady the new Brady, the Chinka question and the timber Man. Merge only after he agrees.

## Then: the road to realistic, in order
1. **Realistic Brady and Chinka** from Brady's face scans and photos, which he puts in `private/scans/`. That folder is git-ignored, so never commit it.
   - **Body and face:** an MPFB2 or Character Creator base, matched to the scans.
   - **Skin:** 2K textures with pores and fine detail, and a soft tint (never plastic).
   - **Hair:** hair cards.
   - **Clothes:** cloth folds baked into the textures.
   - **Brady's real tattoos,** projected on from photos.
   - **Chinka's LED necklace,** glowing.
   - **Rig and animation:** Mixamo clips (Brady downloads them), with 3 LODs.
   - Ask Brady for anything he hasn't provided yet.
2. **The cast (about 30 characters):** one realistic base body plus a costume kit, LODs, and impostor cards for distant crowds.
3. **Vehicles and art cars:** bevelled, dust-masked materials and glowing LEDs. Includes the octopus car and Root Society's stage car.
4. **Camps and structures:**
   - Use Geometry Nodes for repeating detail.
   - **Bake the lighting in Cycles**, with night versions for brightly lit camps.
   - Covers Root Society's domes, coliseum and tipis, the other camps, the Temple, the Man and the big art.
5. **The playa:** a real cracked-mud texture, tyre-track and footprint decals, and a mountain backdrop.
6. **Fire, smoke and dust:** Blender Mantaflow simulations rendered to flipbook sprite sheets. Use them for the burns, fire spinners, flame cannons and dust storms.
7. **The final look:** a colour-grade LUT, warm gold by day and deep blue and neon by night.
8. **Engine backlog:** chunk low-detail twins, AO baking in a worker, and faster loads. Watch iPhone memory as real textures arrive.
9. **Real iPhone profiling early and often** in the busiest places: The Line, Root Society at night and the city at night. Hold the budget: about 120 draws, about 450k visible triangles, 60 fps on the medium tier.

**First milestone:** realistic Brady standing in Root Society at sunset, beside a baked-lit dome and a Blender RV. Show Brady this before scaling up.

## Your files and tests
- **You own:**
  - `src/40_burns_*`, the shared engine. Keep `BurnsWorlds.register` and the `api` stable.
  - `src/41_burns_*` and `src/42_burns_*`
  - `assets/models/burning-man/` and `assets/models/shared/`
  - the Burning Man Blender scripts in `tools/blender/`, and `docs/BURNS_GUIDE.md`
- **After any engine change,** run Art Cart's smoke test as well.
- **Blender:** background mode crashes on Brady's Mac, so run scripts in the open Blender window's Python Console (see README §7).

## First message (Brady pastes this)
```
Read docs/handoff/README.md and docs/handoff/BURNING_MAN.md. You are the Brady Goes to Burning Man agent and the owner of the shared 3D engine. Phase 0: pull main, build, run apps_test and the all-worlds and open-world flow tests, and show me screenshots of Brady, Chinka, Root Society at night and the city. Then review ChatGPT's draft PR #3 (codex/burning-man-graphics-pass): show me before/after screenshots of Brady, Chinka (her outfit changed, ask me which I want) and the new timber Man, run the full regression including Art Cart, and tell me in plain words whether to merge it. Then propose your plan for realistic Brady and Chinka in Blender, tell me exactly which scans, photos and Mixamo clips you need from me, and wait for my OK.
```
