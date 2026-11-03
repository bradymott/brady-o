# Brady's Games: handoff for local Claude agents

You're continuing three games that a cloud Claude session built with the owner, Brady. He plays on an iPhone and isn't a programmer, so talk to him plainly and show screenshots. His goal is games that are **as professional as possible**, and graphics are his #1 priority for *Brady Goes to Burning Man*. Your job is the next stage:
- professional 3D assets made in Blender (and, only if he chooses, Unreal);
- testing and polish on a real device.

Start with **Phase 0** below. Before starting Phase 1, present your plan and agent lanes to Brady for approval.

---

## 1. The product
Three separate installable web apps (PWAs). Each has its own folder, icon, title screen and save key. They're built from one repo by `tools/build.js`.

| App (folder) | What it is | Main code |
|---|---|---|
| **Brady Goes to Burning Man** (`burning-man/`) | The flagship 3D open-world adventure. Brady is a first-timer who becomes a burner in one week, while the Man (the effigy) keeps stealing his wife Chinka. It plays out in a streaming Black Rock City (world 500) with 17 enterable story places, theme camps, big art, side quests, the Saturday burn and a secret Exodus. | `src/40_burns_*` (engine), `41_burns_*` (big art, camps, DJ), `42_burns_*` (worlds and the city) |
| **Super Brady-O World** (`super-brady-o-world/`) | A 2D platformer around the world: 12 countries plus 2 secret lands, 68 levels, a world map, and the villain Baron Bric-a-Brac. | `src/03–29` (world tour: `28_tour_*`, `29_tour_<cc>.js`) |
| **Art Cart** (`art-cart/`) | 3D battle racing: 12 original art cars with weapons, 26 drivers, cups, battle arenas. Runs on the Burns engine. | `src/43_cart_*` |

- **Live:** https://bradymott.github.io/brady-o/ is a launcher page, with the three apps in the subfolders above. It's served from the `gh-pages` branch.
- **Source:** `main`. Work in progress goes on feature branches (for example `restructure-burns-3d`).

## 2. Ground rules (non-negotiable)
**Original content only.**
- Never copy characters, levels, maps, music or art from existing games: no Nintendo or Mario anything, not even "renamed".
- Genre inspiration is fine.

**Real Burning Man things.**
- Real camps (Root Society, Playground, Opulent Temple, Camp Question Mark, Disorient, The Deep End, Death Guild, Space Cowboys…), art cars and artworks appear as their real **layouts and generic structures**: dome counts, stage types and so on.
- Decor must be **our own designs**.
- Never replicate copyrighted artwork, sculptures, stage art, logos or art-car designs.
- Art Cart's cars are original designs with original names, inspired by the legends.

**Real people.**
- Name-drops only (for example the DJs Carl Cox and Lee Burridge).
- No likenesses, no invented quotes.

**Specific calls already made:**
- "Bam Bam" wears an original caveman costume, not the cartoon character's look.
- The trash-fence robot duo are the original "Fence Bots", with homemade junk helmets.
- The cult leader is the original "Brother Bubblegum".

**Countries (Super Brady-O World).** Humour comes from food, animals, objects, landmarks and folklore.
- Never caricature people or sacred figures and sites; temples, stupas and prayer flags are respectful background only.
- No Christ the Redeemer statue.
- The Eiffel Tower appears in daylight or with generic lights only.

**Brands.** No brand names or logos in-game.

**Tone.** Affectionate satire, PG-13.
- Nudity gets a cartoon censor.
- Drug items are cartoon pickups with comedic effects; nothing instructional. That means a 17+ rating if the games are ever submitted to an app store.

**The two leads are real people.** Always portray both warmly.
- **Brady** is the owner's likeness: long hair in a man bun, dark square sunglasses, stubble, black tee, jeans and sneakers, blackwork geometric sleeve tattoos on both arms.
- **Chinka** is his wife: long dark wavy hair, sunglasses, brown tee, black leggings, white sneakers, LED necklace.

**Branding.** *Brady Goes to Burning Man* never says "Brady-O"; the hero there is just "Brady".

## 3. Repo map
`src/*.js` is plain JavaScript. `tools/build.js` concatenates the files **alphabetically** into one IIFE per app, so top-level names are shared across files; prefix them per module.

**Each app bundles only what it needs:**
- **Burning Man:** core plus `40–42`. It is engine-only, with no 2D modules.
- **Art Cart:** core plus `40_burns_*` (without the hub and title) plus `43_cart_*`.
- **Super Brady-O World:** core plus `03–29`.

| Files | What |
|---|---|
| `00_core`, `01_audio`, `02_input`, `99_main` | Core, procedural audio (all music and SFX are synthesized; tracks can be added with `Sound.addTrack`), input, boot |
| `03`–`29` | 2D engine and Super Brady-O World. `28_tour_*` is the world-tour framework (map, story, power-ups, level builder); `29_tour_<cc>.js` is one file per country |
| `40_burns_*` | The 3D engine: WebGL2 renderer (HDR, shadows, bloom, SSAO), mesh builder, rounded character rig and cast, props, world runtime, actors, player, play scene, HUD, hub/map, title app, open-world streaming (`m_open`) |
| `41_burns_*` | `bigart` (8 climbable pieces and burns), `camps` (real-camp structures), `dj` (the DJ-decks minigame) |
| `42_burns_*` | The story worlds (1–17), the open city (`ow_city`, world 500), test sandboxes (98 camps, 99 big art) |
| `43_cart_*` | Art Cart: data, car models, tracks and arenas, race sim, scene, menus |

**Docs**
- `docs/BURNS_GUIDE.md`: the authoritative 3D engine API. Read it.
- `docs/BURNS_CAMPS.md` and `docs/BURNS_BIGART.md`.
- `docs/WORLD_TOUR_GUIDE.md`: how to add a country.
- `docs/design/`: the direction (`DIRECTION.md`, the latest), story, cast and archetypes.

**Tools** (in `tools/`):
- `build.js`
- `apps_test.js`: boots the three apps.
- `gameplay_test.js` and `validate_levels.js`: Super Brady-O World.
- `make_icon.js`: per-app icons.
- `smoke.js`, `touch_test.js`, `load_game.js`.

## 4. Build, test, deploy
```bash
node tools/build.js            # -> dist/site/ (launcher + 3 apps), dist/brady-o.html (all-in-one test build)
node tools/apps_test.js        # all three apps boot, with the right names and save keys, and no errors
node tools/gameplay_test.js    # Super Brady-O World checks
node tools/validate_levels.js  # all 68 Super Brady-O World levels must pass
```
- Playwright with Chromium is needed: `npm i playwright && npx playwright install chromium`.
- Set `BRADY_DIST=/some/dir` to build into a private folder. Do this whenever several agents work at once.
- For the 3D game, each world has scripted tests; their patterns are in `docs/BURNS_GUIDE.md` §16. Use the debug API `window.BRADY_BURNS.debug` (`play`, `skipCine`, `teleport`, `sim`, `state`, `give`, `power`, `complete`).
- **Look at screenshots, not just error counts.** A visual regression once passed every error check.

**Deploy:**
1. Build.
2. Copy `dist/site/*` onto the root of the `gh-pages` branch (use a worktree).
3. Commit and push. GitHub Pages redeploys automatically.

Each app's service worker is versioned per build, so phones pick up updates. The site root ships a small worker that retires the old all-in-one app's cache.

## 5. Current state (at handoff)
**Super Brady-O World: content-complete.**
- 12 countries and 2 secret lands, 68 levels, 14 bosses, 13 signature items.
- The validator passes and gameplay checks pass 59/59.

**Art Cart: complete.**
- 12 cars, 26 drivers, 2 cups (8 tracks), 7 arenas (each with 4–5 objectives and its own powers).
- AI weapon use; touch, keyboard and gamepad.
- November 2026: all 12 cars have Blender-made glTF models (`tools/blender/*.py`, `assets/models/art-cart/`),
  loaded by the engine's `BurnsGLTF` (`docs/BURNS_GUIDE.md` §6.8, plan in `docs/ART_CART_GLTF_PILOT.md`). The
  procedural cars remain as fallbacks.
- November 2026: seven battle arenas. Each new arena lives in its own `src/43_cart_g_<id>.js` and registers its
  rules, powers, objective and icon through the registries documented at the top of `CART_ARENA_RULES` in
  `src/43_cart_a_data.js` (physics hooks, arena-only items with their own use/shot/draw/AI, custom objectives).
  Winning every objective of an arena "masters" it and its powers drop in circuit races. `tools/cart_battle_test.js`
  runs every arena × objective headless with screenshots; the engine also has sky-probe reflections (§9.1).

**Engine, November 2026 (local session):** the glTF pipeline is complete for everything but likeness characters:
- `BurnsGLTF` static/rigid loader (§6.8), **skinned characters** with Mixamo-named joints and clips (§6.9,
  `src/40_burns_bc_skin.js`, placeholder `tools/blender/mannequin.py`), **textured PBR** materials with the sky
  probe (§6.10, `src/40_burns_bd_pbr.js`), sky-probe reflections for every material (§9.1).
- Burning Man's RV, bus, geodesic dome, tipi, porta-potty and shade structure are Blender models
  (`tools/blender/bm_*.py`, hook `src/41_burns_glbprops.js`, §5.1). Models ship packed and gzipped.
- Still needed from Brady for real Brady and Chinka: Mixamo clips and the face scans/photos (`private/`).

**Brady Goes to Burning Man: all 17 story worlds built and tested.**
- **The city:** the open-world Black Rock City is playable: streaming tiles, instancing, LOD, enterable places, a fast-travel map, and HOME at Brady's tipi.
- **Last engine pass** (finished or under way at handoff; check the commit log):
  - street-level beauty
  - more city missions
  - Thunderdome bouts and an art-car race
  - instanced crowds
  - a hook so World 17's side quests can live in the city
  - fixes from the world builders: portrait dialogue portraits, the night moon, chatter during cutscenes
- **Performance** (headless Chromium, software GL): every view is at or under about 120 draws and about 450k triangles on the medium tier. **Real-iPhone frame rates haven't been measured yet**, so do that first.

**The look today** is a stylized, rounded "toy" style built from procedural primitives, with strong lighting: HDR, shadows, bloom, sky. The biggest remaining visual leap is real modelled assets, which is Phase 1 below.

## 6. The plan to "professional"
### Phase 0: verify (do this first)
- Clone or pull, build, run the tests, and open `dist/site/` in a browser.
- On Brady's iPhone, play each app from the live link. Measure the frame rate in Burning Man's busiest views, which are Root Society at night and the Esplanade. Use `window.__burnsDebug = true` for the overlay.
- Confirm the Blender MCP tools are available (see `docs/LOCAL_SETUP.md`).
- Report to Brady, with screenshots.

### Phase 1: hero assets in Blender
Make game-ready glTF 2.0 assets to replace the procedural models, in priority order:
1. **Brady and Chinka.**
   - About 15–25k triangles each, PBR textures at 1–2K.
   - Faithful to their descriptions, with Brady's tattoos as a texture.
   - Rigged to a **Mixamo-compatible humanoid skeleton**.
2. **The Man** (normal and giant), Brady's yellow bike, the RVs and buses, the octopus art car, and Root Society's stage art car.
3. **The burner cast:** about 30 NPC types, kit-bashed from a shared base body plus outfit pieces (see `docs/design/CAST_ACTION_FIGURES.md`).
4. **Landmarks:** Root Society's domes, coliseum and tipis, the other theme camps, the 8 big-art pieces, the Temple, and the Man's pavilion.
5. **Art Cart's 12 cars.**

**Export rules:**
- `.glb`, meters, Y-up, transforms applied, consistent naming.
- LODs: LOD0, LOD1, LOD2.
- Compress with gltfpack (meshopt) and KTX2/Basis textures.
- Put them in `assets/models/` and `assets/anim/`, listed in `assets/manifest.json`.

**Tooling:**
- Besides the MCP connection, you can script Blender headless: `blender -b -P script.py`.
- Brady can download Mixamo clips with his Adobe account. Ask him; don't create accounts.

### Phase 2: load real assets in the existing engine (recommended)
**Why the existing engine:** the Burns engine already has the hard parts:
- a WebGL2 HDR, shadow and bloom pipeline
- instancing, streaming and LOD
- a cinematics and mission API, used by about 60 world files
Porting all of that to another renderer would be a long, risky rewrite. Instead:
1. **Add a glTF loader to `BurnsGL`/`BurnsMesh`:**
   - static meshes
   - skinned meshes with a GPU skinning path
   - PBR material mapping onto the existing shading
2. **Plug the hero assets into the existing APIs:**
   - characters as character types (`BurnsRig.defineType`)
   - props via `api.prop`
   - vehicles via `api.artCar`
   - Keep the procedural versions as fallbacks.
3. **Load assets per world or tile.** The PWA can ship separate asset files: update `build.js` and the service-worker cache list, and show a loading screen.
4. **iPhone budgets:**
   - about 120 draw calls or fewer, and about 450k visible triangles or fewer, on the medium tier
   - 2K textures at most
   - first playable within about 30 MB downloaded

### Per-game art plans (Brady's own guide, "The Blender Graphics Playbook", has the user-facing version)
- **Art Cart (start here: the smallest, self-contained job).**
  1. Build the glTF loader once in the shared engine (`40_burns_*`). Art Cart and Burning Man both use it.
  2. Pilot one car end to end: Bass Valentine.
     - Bevelled body.
     - Materials: car-paint with clear coat, chrome, glass, tyres, emissive LED strips.
     - Separate wheels and moving parts.
     - 20–30k triangles for the showroom version, 5–8k for racing.
  3. Then the other 11 cars, the drivers (reused from the Burning Man cast), a studio-HDRI showroom, and a track and arena kit with baked lighting.
- **Super Brady-O World (a pre-rendered 2D pipeline).** Brady wants a beautifully polished premium 2D look in our own style. Never use Nintendo's characters, blocks or pipes.
  1. **Style frames:** three for Mexico (Brady running, one enemy, one background) in 2–3 candidate looks: toon EEVEE, painterly, or Line Art outlines. Brady picks one.
  2. **Characters and items:** stylised models, rigged with Rigify, animated.
  3. **Rendering:** an orthographic camera with a transparent background, at 2× display size, packed into atlases with Free Texture Packer or TexturePacker.
  4. **Backgrounds and tiles:** parallax background layers (3–5 per level theme) and a tile set per country.
  5. **Engine:** add a sprite-atlas loader to the 2D engine and swap code-drawn entities for sprites one at a time. Physics, level data and the validator stay untouched.
  6. **Polish:** squash and stretch, particles, hit-stop, screen shake, haze.
- **Brady Goes to Burning Man (realistic, Blender only).** Brady has decided against Unreal: make the web game as realistic as a phone allows.
  1. **Engine:** a glTF loader with skinned characters, PBR materials, sky-image reflections and baked lightmaps. It's shared with Art Cart.
  2. **Brady and Chinka:**
     - an MPFB2 or Character Creator base
     - likeness from photos or a RealityScan scan
     - 2K skin, and hair cards
     - cloth folds baked into the texture
     - Brady's real tattoos projected on as a texture
     - Chinka's emissive LED necklace
     - Mixamo rig and animations, and 3 LODs
  3. **The cast:** one base body plus a costume kit, LODs, and impostor cards for distant crowds.
  4. **Vehicles and art cars:** bevelled, dust-masked materials and emissive LEDs.
  5. **Camps and structures:** Geometry Nodes for repeating detail, Cycles-baked lightmaps, and night variants.
  6. **The playa:** a real cracked-mud texture, track and footprint decals, and a mountain backdrop.
  7. **Fire, smoke and dust:** Mantaflow simulations rendered as flipbook sprite sheets for particles.
  8. **The final look:** a colour-grade LUT.
  9. **First milestone:** realistic Brady in Root Society at sunset, beside a baked-lit dome and a Blender RV.

### Phase 3: gameplay polish and device testing
- **Real-iPhone playtests:** controls, camera, difficulty, onboarding, readability, audio mix, battery and heat, saves.
- **A bug bash in every world**, with scripted tests plus manual play.
- **Accessibility:** button sizes, contrast, and reduced motion (it already exists for the trip effects; extend it).

### Phase 4 (not planned): native Unreal Engine 5
Brady decided in November 2026 not to pursue Unreal. Keep everything on the web engine. The notes below are only for reference if he ever changes his mind.
- It's for App Store or console-grade visuals beyond the web.
- It needs a Mac with Xcode and the Apple Developer Program ($99/yr), and it's a months-long rebuild.
- It reuses the design bible and the Phase 1 Blender assets.

## 7. How to run several agents (how these games were built)
- **One owner per module.** Each agent owns specific files and never edits others'; changes go through the lead.
- **Contracts are docs.** Update the guide first when an API changes, and keep public APIs stable while others build on them.
- **Private builds.** Each agent builds into its own `BRADY_DIST` folder.
- **Never leave a half-written file in `src/`.** It breaks everyone's build, because the files are joined into one script. Write big files elsewhere, run `node --check`, then move them into place.
- **Checkpoint commits** go on a feature branch. Then the lead runs an **integration pass**: build, run every test suite, look at screenshots, fix, then merge to `main` and deploy.
- **Usage limits.** Running about 10 agents at once can exhaust an account's usage limit. Run work in waves.
- **Suggested lanes for Phases 1–2:**
  1. Lead/integrator.
  2. Hero-character artist (Brady, Chinka, rig, faces).
  3. Cast artist (base body plus outfit kit).
  4. Environment artist (camps, big art, vehicles).
  5. Engine engineer (glTF loader, skinning, materials).
  6. Animation and controls engineer (retargeting, blend states).
  7. QA (tests, performance budgets, screenshots on device).
- **Blender MCP drives one live Blender instance,** so only one agent should use it at a time. Others write headless Blender scripts.

## 8. Asset sources and licenses
- **CC0 (no credit needed):**
  - Poly Haven (HDRIs, textures, models)
  - ambientCG (textures)
  - Kenney and Quaternius (models)
- **Mixamo:** free with an Adobe account (Brady downloads).
- **Sketchfab:** check each model's license. CC-BY requires a credit, so keep a `CREDITS.md`.
- **Never** use assets ripped from commercial games.

## 9. The design bible
- `docs/design/DIRECTION.md`: the latest direction for all three apps. It overrides older notes.
- `docs/design/STORY_AND_WORLDS.md`: the Burning Man story and worlds.
- `docs/design/CAST_ACTION_FIGURES.md`: Brady's action-figure cast, with detailed looks.
- `docs/design/CAST_ARCHETYPES.md`: the burner archetypes.
