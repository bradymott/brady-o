# Art Cart: Blender → glTF pipeline (Bass Valentine pilot)

Status, November 2026: the pilot car is modelled, exported and loading in the game on branch `art-cart-glb-pilot`.
This doc is the plan for the loader and for the other 11 cars. The engine API itself is in `docs/BURNS_GUIDE.md` §6.8.

## 1. How the loader fits the engine

The Burns engine draws everything through one 24-byte vertex format (position, packed normal, bone + gloss bits,
sRGB vertex colour + emissive, atlas UV) and one rigid-skinning shader with shadows, bloom, fog and point lights.
The loader keeps that: it converts a `.glb` into exactly that format at load time, so Blender models get the whole
lighting pipeline for free and cost **one draw call per car**, the same as the procedural cars.

**Stage 1 (built in this pilot): geometry + material *factors*.**
- `BurnsGLTF.fetch(url)` → `parse()` → `rig(doc, { bone(name) })` → `{ geo, nb, J, empties, extras }`.
- Every root node of the glTF scene is a bone; its translation is the joint; its subtree is baked joint-relative.
- Materials map onto the engine's PBR-lite: base colour → vertex colour, metallic/roughness/clearcoat → the 2-bit
  gloss (0 matte, 1 satin, 2 paint/clear coat, 3 chrome with sky reflections), emissive factor × strength → the
  emissive channel (blooms at night). Blender vertex colours (COLOR_0) multiply in, so AO or paint variation can be
  baked in Blender. The engine still bakes its own ambient occlusion on the rig.
- Limits: 65 535 vertices per file (16-bit indices), no textures yet. Both are fine for the cars.

**Stage 2 (proposed next, shared with Brady Goes to Burning Man): a real PBR path.**
1. A new `pbr` program next to `skin`: a 32-byte vertex (position, normal, tangent, UV0, bone) and per-material
   textures: base colour (sRGB), ORM (occlusion/roughness/metallic), normal map, emissive. 2K at most, KTX2/Basis
   later, PNG/WebP first. It reuses `BURNS_GLSL_LIGHT`, so shadows, fog, point lights and lightmaps stay identical.
2. Image-based reflections: render the engine's own procedural sky into a small equirect (256×128, HDR, blurred
   mip chain) whenever the palette or time of day changes, and sample it per roughness. Chrome, car paint and
   Chinka's LED necklace then reflect the real sunset. Add a clear-coat lobe for car paint.
3. Draw per material: author cars with ≤ 4 materials (paint, chrome/metal, lights/glass, rubber/plastic), or bake a
   car's materials to one texture set in Blender so it stays one draw. Eight cars × 4 = 32 draws, well under 120.
4. Skinned characters (Brady, Chinka, the cast): glTF `skins` → the engine's bone palette (up to 64 bones) with a
   Mixamo-compatible skeleton, plus a glTF animation sampler feeding `BurnsChar`. This is the Burning Man Phase 1
   engine work; the loader built here is its first half.

## 2. The car pipeline (one car, end to end)

1. **Model in Blender** from a parametric script in `tools/blender/<car>.py` (the pilot: `bass_valentine.py`):
   engine coordinates (x = car's left, y up, z forward), metres, origin on the ground under the car's centre.
   The script builds a showroom level (20–30k triangles) and a race level (5–8k) from the same code with a detail
   table, so both always match. Run it headless with `Blender -b -P tools/blender/<car>.py` or in a live Blender.
2. **Rig convention:** root objects `body`, `wheel_FL/FR/RL/RR`, `steer`, `part_<name>` (animated parts: their
   per-frame motion lives in `CART_GLB_PARTS` in `src/43_cart_bb_glb.js`, keyed by name). Empties `seat`,
   `muzzle` and `light_*` (custom properties `color`, `size`, `big/head/tail/led`) carry what the race sim needs.
   The `body` object's custom properties give `len`, `w`, `h`, `wheelR`, `steerTilt`, `driverScale`.
3. **Materials:** Principled BSDF only. Car paint = Coat Weight 1, roughness ≈ 0.3. Chrome = Metallic 1,
   roughness ≤ 0.1. LEDs = Emission Strength ≥ 3 (the engine makes them full emissive). The heart uses
   Emission Strength 1 for a soft glow.
4. **Export:** `.glb`, +Y up, modifiers applied, extras on, no textures, to `assets/models/art-cart/<stem>.glb` and
   `<stem>_lo.glb`. `tools/build.js` copies them into the app and lists them in the service worker, so they're
   cached for offline play.
5. **Check in the game:** `node tools/build.js && node tools/cart_shots.js` writes showroom and race screenshots
   with triangle and draw counts. The procedural model stays as the fallback when a file is missing.

## 3. Budgets (iPhone, medium tier)

| | Per car | A race (8 cars) |
|---|---|---|
| Showroom model | ≤ 30k triangles | one car shown |
| Race model | ≤ 8k triangles (swapped in beyond 30 m: `carModel()`) | ≤ 64k near, less far |
| Draw calls | 1 (plus 1 for the driver) | 16 of the ~120 budget |
| Download | ≈ 0.7 MB + 0.3 MB uncompressed; gzip on GitHub Pages roughly halves it | 12 cars ≈ 12 MB, within the 30 MB first-load budget; meshopt/gltfpack later for ~4× less |

## 4. Next steps (for Brady to approve)

1. The other 11 cars, in roster order, each a `tools/blender/<car>.py` script following the pilot.
2. Drivers reuse the Burning Man cast once Phase 1 characters exist (no change to Art Cart needed).
3. Stage 2 PBR path (textures, sky reflections, clear coat) in the shared engine.
4. A studio showroom: a baked-lit stage with an HDRI-style backdrop, once stage 2 lands.
