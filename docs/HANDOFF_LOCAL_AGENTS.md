# Brady-O: handoff for local Claude agents

You're continuing a game that a cloud Claude session built with the owner, Brady. He plays on an iPhone and isn't a programmer, so talk to him plainly and show screenshots. His goal is to make Brady-O **as professional a game as possible**. Your job is the next stage: professional 3D graphics with Blender (and, only if he chooses, Unreal), then device-tested polish.

Start with **Phase 0** below. Before starting Phase 1, present your plan and agent lanes to Brady for approval.

---

## 1. The product
One installable web app (a PWA) for iPhone with three games:

| Game | What it is | Main code |
|---|---|---|
| **Brady-O Burns** (flagship) | 3D action-adventure across Burning Man in 17 worlds (16 + a secret one). Brady arrives as a clueless first-timer and becomes a full-on burner in a week. He defeats the Man (the effigy, who stole his wife Chinka) and watches him burn. | `src/40_burns_*` (engine), `src/41_burns_*` (shared modules), `src/42_burns_world*.js` (worlds) |
| **Super Brady-O World** | 2D platformer: 60 levels across 10 lands on a walkable overworld. | `src/03`–`27` |
| **Art Car Kart** | 3D kart racer: 8 racers, 8 tracks. | `src/30_kart.js`, `src/31_kart_tracks.js` |

- **Live:** https://bradymott.github.io/brady-o/ (served from the `gh-pages` branch).
- **Source:** the `main` branch.

## 2. Ground rules (non-negotiable)
**Original content only.**
- Never copy characters, levels, maps, music or art from existing games: no Nintendo/Mario anything, not even "renamed".
- Genre inspiration is fine.

**Real Burning Man things.**
- Real camps (Root Society, Playground, Opulent Temple, Camp Question Mark, Disorient, The Deep End, Death Guild…), art cars and artworks are depicted by their real **layouts and generic structures**: dome counts, stage types and so on.
- Decor must be **our own designs**.
- Never replicate copyrighted artwork, sculptures, stage art, logos or art-car designs.
- The octopus art car, the heart art car, the Man and his saucer base, and the Temple are all original designs.

**Real people.**
- Name-drops only (for example the DJs Carl Cox and Lee Burridge).
- No likenesses, no invented quotes.

**Specific calls already made:**
- "Bam Bam" wears an original caveman costume, not the cartoon character's look.
- The trash-fence robot DJ duo wear homemade junk helmets, never the famous duo's helmets, and have an original name.
- The "Possible Cult Leader" is an original character, "Brother Bubblegum".

**Brands.** No brand names or logos in-game (the plane is a generic small prop plane, the goggles are just "designer goggles", etc.).

**Tone.** Affectionate satire, PG-13.
- Nudity gets a cartoon censor.
- Drug pickups are cartoon "ground score" baggies. Effects are visual and comedic; use is only implied off-screen.

**The two leads are real people.**
- **Brady:** the owner's likeness. Long hair in a man bun, dark square sunglasses, stubble, black tee/jeans/sneakers, blackwork geometric sleeve tattoos on both arms; colors come from `Save.data.look`.
- **Chinka:** his wife. Long dark wavy hair, sunglasses, brown tee, black leggings, white sneakers, LED necklace.
- Always portray both warmly.

## 3. Repo map
**`src/*.js`**: plain JavaScript, concatenated **alphabetically** into one IIFE by `tools/build.js`, so top-level names are shared across files. Prefix them per module.

| Files | What |
|---|---|
| `00_core`, `01_audio`, `02_input`, `99_main` | Core, procedural audio (all music and SFX are synthesized), input, boot |
| `03`–`27` | The 2D engine and Super Brady-O World. `26_worlddata.js` holds lands and levels; `27_brcmap*` is the overworld |
| `30`–`31` | Art Car Kart (WebGL1) |
| `40_burns_*` | The Brady-O Burns 3D engine: WebGL2 renderer, mesh builders, rounded character rig, cast types, world/collision, actors, player, play scene, HUD, hub |
| `41_burns_*` | Shared Burns modules: `bigart` (monumental art pieces), `camps` (real-camp structures), `dj` (DJ-decks minigame) |
| `42_burns_world*.js` | One file (plus helpers) per Burns world |

**Docs**
- `docs/BURNS_GUIDE.md`: the authoritative Burns engine API. Read it.
- `docs/BURNS_BIGART.md`, `docs/BURNS_CAMPS.md`.
- `docs/design/`: the design bible (story, worlds, cast).

**Tools** (in `tools/`):
- `build.js`. Set `BRADY_DIST=/some/dir` to build into a private folder.
- `gameplay_test.js`, `validate_levels.js` (it proves all 2D levels are finishable), `find_seeds.js`, `touch_test.js`, `smoke.js`, `gallery.js`, `make_icon.js`.
- `tools/burns/` holds Burns world test scripts. They use `window.BRADY_BURNS.debug`.

**Output.** `dist/` is gitignored except the icons.

## 4. Build, test, deploy
```bash
node tools/build.js            # -> dist/index.html, dist/brady-o.html, dist/app/ (PWA), dist/Brady-O-app.zip
node tools/gameplay_test.js    # 2D game checks (Playwright; install with: npm i playwright && npx playwright install chromium)
node tools/validate_levels.js  # all 60 Super Brady-O World levels must pass
```
**Deploy**
1. Build.
2. Copy `dist/app/*` onto the root of the `gh-pages` branch (use a worktree).
3. Commit and push. GitHub Pages redeploys automatically.

The service worker (`sw.js`) is versioned per build, so phones pick up updates.

## 5. Current state (at handoff)
_Filled in by the cloud session at integration time. See the commit log on `main` for the latest._

## 6. The plan to "professional"
### Phase 0: verify (do this first)
- Clone or pull `main`, build, run the tests, and open `dist/brady-o.html`.
- Confirm the Blender MCP tools are available (see `docs/LOCAL_SETUP.md`).
- Report what you see to Brady, with screenshots.

### Phase 1: hero assets in Blender
Make game-ready glTF 2.0 assets that replace the procedural "rounded primitive" models.
- **Characters:** Brady and Chinka.
  - About 15–25k triangles each, PBR textures 1–2K.
  - Faithful to their descriptions; Brady's tattoos as a texture.
  - Rigged to a **standard humanoid skeleton that's Mixamo-compatible**, so motion-captured animations can be applied.
- **The Man:** normal and giant. Plus Brady's yellow bike, the RV, the party/octopus art car, and the Root Society stage art car.
- **The cast:** about 30 NPC types, kit-bashed from a shared base body plus outfit pieces. See `docs/design/CAST_ACTION_FIGURES.md`.
- **Landmarks:** the camps (Root Society's three domes, coliseum stage and tipi village; Playground; Opulent Temple; Camp Question Mark…) and the 8 big-art pieces.
- **Export rules:**
  - `.glb`, meters, Y-up, transforms applied, consistent naming.
  - LODs (LOD0/1/2).
  - Compress with gltfpack (meshopt) and KTX2/Basis textures.
- **Where they go:** `assets/models/` and `assets/anim/`, plus `assets/manifest.json`.
- **Headless scripting:** besides the MCP connection, you can script Blender headless: `blender -b -P script.py`.
- **Animations:** Brady can download free motion-capture clips from Mixamo with his Adobe account; ask him, and don't create accounts. There are also CC0 animation packs.

### Phase 2: renderer upgrade (stay on the web, so it still runs from the link)
- **Recommended:** move Brady-O Burns' rendering to **three.js** (glTF loading, skinned animation, PBR, shadow maps, bloom/tone-mapping, instancing).
  - Keep the world-authoring API in `docs/BURNS_GUIDE.md` (`BurnsWorlds.register`, `api.*`, NPC types, missions) **stable** behind an adapter, so the 17 worlds keep working.
  - Replace procedural props and characters with Phase 1 assets progressively.
- **Packaging:** the PWA can now ship separate asset files.
  - Update `build.js` and the service-worker cache list.
  - Load assets per world, with a loading screen.
- **iPhone budgets:**
  - 150 draw calls or fewer, about 500k triangles visible or fewer;
  - 2K textures max;
  - the first world playable within roughly 30 MB downloaded, the rest streamed or cached.

### Phase 3: gameplay polish and device testing
- Real-iPhone playtests: controls, camera, difficulty curve, onboarding, readability, audio mix, battery and heat, saves.
- A bug bash in every world, with scripted tests plus manual play.
- Accessibility: button sizes, contrast, a reduced-motion option for the trip effects.

### Phase 4 (optional, only if Brady asks): a native Unreal Engine 5 version
- For App Store / console-grade visuals beyond the web.
- Needs a Mac with Xcode and the Apple Developer Program ($99/yr) for iPhone builds. It's a months-long rebuild.
- Reuses the design bible and the Phase 1 Blender assets.
- Unreal MCP connectors exist but are third-party; back up projects.

## 7. How to run several agents (how this game was built)
- **One owner per module.** Each agent owns specific files and never edits other agents' files; it requests changes through the lead.
- **Contracts are docs.** The engine API lives in `docs/BURNS_GUIDE.md`; update it first when an API changes, and keep public APIs stable while others build on them.
- **Private builds.** Each agent builds into its own folder (`BRADY_DIST=...`) so they don't clobber each other.
- **Checkpoint commits** go on a feature branch. Then the lead runs an **integration pass**: build, run every test suite, fix, then merge to `main` and deploy.
- **Suggested lanes for Phases 1–2:**
  1. Lead/integrator.
  2. Hero-character artist (Brady, Chinka, rig, faces).
  3. Cast artist (base body plus outfit kit).
  4. Environment artist (camps, big art, vehicles).
  5. Renderer engineer (the three.js port and adapter).
  6. Animation and controls engineer (retargeting, blend states, camera).
  7. QA (tests, performance budgets, screenshots).
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
- `docs/design/STORY_AND_WORLDS.md`: the full story, the world order and each world's missions.
- `docs/design/CAST_ACTION_FIGURES.md`: Brady's action-figure cast, with detailed looks.
- `docs/design/CAST_ARCHETYPES.md`: the burner archetypes (Billionaire, Crusty Vet, Sparkle Pony, Tech Bro, Safety Third Captain, Spiritual Healer).
