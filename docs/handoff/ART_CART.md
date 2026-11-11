# Super Art Kart (formerly Art Cart): handoff for its agent

Read [README.md](README.md) first: owner, ownership rules, appearance rules, deploy.

**Name (Nov 11 2026):** the game is shown to players as **Super Art Kart**. Only the display name changed: the URL `art-cart/`, the save key `art-cart-save-v1`, the app id `kart`, file names and code names (Cart…) stay as they are, so saves and bookmarks keep working. Its home-screen icon is drawn by `tools/cart_icon.js` (3 designs; `--sheet` makes a contact sheet), not by `tools/make_icon.js`.

**Your mission:** make Art Cart's graphics **very, very highly polished**, at showroom quality. Brady's words: "the art cart graphics should be very very highly polished". Keep the gameplay working.

## What exists (on `main`)
- **The game:** a 3D battle racer running on the shared Burns engine (WebGL2, shadows, HDR, bloom).
  - Entry point: `KartMenuScene` in `src/43_cart_f_menu.js`.
  - Save key: `art-cart-save-v1`.
- **12 original art cars,** each with a signature weapon (6–10 s reload):
  - Bass Valentine (heart), Glitterfin (mirror-ball fish), Calamari Inferno (octopus), Sir Scorchalot (dragon)
  - Quackzilla (duck), Pyramid Scheme (laser pyramid), Frosted Fury (cupcake), Dusty Doubloon (galleon)
  - Turbo Escargot (snail), Jelly Jolt (jellyfish), Dune Chomper (land shark), Whale of a Time (whale bus)
  - The names and designs are original. Never use real art-car names or art.
- **26 drivers:** Brady, Chinka, the Man and the burner cast. Driver and car are picked separately.
- **Modes:**
  - Grand Prix: 2 cups × 4 tracks.
  - Quick Race and Time Trial.
  - Battle: seven arenas (`src/43_cart_g_*.js`), each with its own powers and objectives, plus mastery unlocks.
- **Blender models (local session, Nov 3):**
  - All 12 cars as `.glb`, a showroom version plus a `_lo` race version, in `assets/models/art-cart/`. Scripts are in `tools/blender/`.
  - Pipeline: `docs/ART_CART_GLTF_PILOT.md`. Engine API: `docs/BURNS_GUIDE.md` §6.8–6.10 (glTF, skinned characters, textured PBR, sky-probe reflections).
  - The procedural cars remain as fallbacks.
- **Drivers:** skinned drivers sit on the seat. The shared Brady and Chinka models come from `assets/models/shared/`.

## Waiting for you: ChatGPT's PR #1 (`codex/art-cart-visual-refinement`)
Read its notes: `git show origin/codex/art-cart-visual-refinement:docs/ART_CART_VISUAL_POLISH.md`.

**What it does:**
- **Drivers:** a refined procedural driver look (`src/43_cart_bc_driver_art.js`) with modelled faces, hair volumes and clothing seams.
  - It uses a `cartArt` flag so the shared Brady and Chinka downloads don't replace those designs in Art Cart.
  - **Check that choice with Brady:** do the drivers use the Blender Brady and Chinka, or the refined procedural ones?
- **Wheels:** wheel and rim detail merged into the car buffers (`src/43_cart_bc_car_finish.js`). Race cars stay under 8,000 triangles.
- **Presentation:** a blue-hour showroom palette, better driver framing, and road edges that follow the track width.
- **A new test:** `tools/cart_art_test.js`.

**Integration steps:**
1. **Wait until the Burning Man agent has merged PR #3.** It changes the shared engine and Art Cart's Man (driver, portrait and landmark).
2. Rebase #1 onto the new `main`. Resolve the overlaps in `src/40_burns_da_round.js` (that file is the engine owner's, so keep #3's version and re-apply #1's three small `cartArt` hooks), `src/43_cart_c_world.js` and `src/43_cart_f_menu.js`.
3. Build, then run `tools/cart_art_test.js`, `tools/cart_battle_test.js` and `tools/apps_test.js`. Look at the screenshots: showroom, an 8-car grid, a night race, each arena.
4. Merge, then tell Brady and show him screenshots.

## Then: the polish list, in priority order
1. **The showroom.** This is where people fall in love with a car.
   - Every car gets clear-coat paint, chrome, glass, tyres with sidewall detail and glowing LEDs.
   - Use a studio sky and a turntable.
   - **Fix blue cars reading lavender** under the warm light (the whale and the shark).
2. **The cars, one at a time in Blender.** Use the PBR textures the engine now supports (base colour, ORM, normal, emissive):
   - bevelled edges
   - real moving parts: tentacles, fins, the duck's bob, the whale's spout, the beating heart
   - Budget: about 20–30k triangles for showroom, at most 8k for race.
   - The heart and pyramid cars are too tall for the chase camera; adjust them.
3. **Drivers:** sit naturally, steer, react to hits, celebrate. Faces must read clearly in portraits.
4. **Tracks and arenas:** a Blender kit with baked lighting.
   - barriers, ramps, skate-park bowls, dirt jumps
   - camp silhouettes, glow-stick props, playa dust
   - a crowd that waves
   - Night races must glow.
5. **Weapon effects:** the bass-drop ring, dazzle beam, flames, bubbles, slime, lightning, the geyser. Use punchy particles and bloom. Blender-rendered flipbooks work well for fire and smoke.
6. **Feel:** camera shake on hits, speed lines, drift sparks, boost flames, a satisfying finish line and podium.
7. **Gameplay leftovers from the first build:**
   - Difficulty is untuned (the autopilot finishes mid-pack).
   - VIBE CHECK can end in 30–45 s on some arenas.
   - Course loads take 2–4 s.
8. **Real iPhone:** measure frame rate on the busiest views (Burn Night start grid, 8 cars at night). Target 60 fps on the medium tier, at most about 120 draws.

## Your files and tests
- **You own:** `src/43_cart_*`, `assets/models/art-cart/`, `tools/cart_*`, and Art Cart's Blender scripts in `tools/blender/`.
- **Ask for engine changes** (`src/40_*`, `41_*`) through `docs/handoff/REQUESTS.md` and Brady.
- **Tests:**
  - `tools/cart_battle_test.js`: every arena × objective, with screenshots.
  - `tools/cart_shots.js`
  - `tools/cart_art_test.js` (from #1)
  - `tools/apps_test.js`

## First message (Brady pastes this)
```
Read docs/handoff/README.md and docs/handoff/ART_CART.md. You are the Art Cart agent. Phase 0: pull main, build, run the Art Cart tests and apps_test, and show me screenshots of the showroom, an 8-car race and one arena. Then review ChatGPT's PR #1 (codex/art-cart-visual-refinement) and tell me in plain words what it changes and whether you recommend merging it (merge it after the Burning Man agent's PR #3 lands). Then propose your polish plan, starting with the showroom and one car (Bass Valentine) as the quality bar, and wait for my OK.
```
