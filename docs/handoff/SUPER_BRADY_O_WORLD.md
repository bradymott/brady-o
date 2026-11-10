# Super Brady-O World: handoff for its agent

Read [README.md](README.md) first: owner, ownership rules, appearance rules, deploy.

**Your mission:** a super highly polished, beautiful 2D platformer, "better than the classics" in polish. It keeps **our own original style**: never Nintendo's characters, blocks, pipes, power-up looks or levels. Finish the Fiesta Toon art for every country, and make every level and boss a joy.

## What exists (on `main`)
**The game:** a 2D canvas platformer (`src/03`–`src/30`). Super Brady-O flies around the world chasing Baron Bric-a-Brac.
- **12 countries × 5 levels:** Mexico, Ecuador, Brazil, Mozambique, Morocco, Spain, France, Amsterdam, Bali, Vietnam, Japan and Nepal (the finale).
- **2 secret lands:** Antarctica (behind a cracked wall in 8-4) and World 22 (needs 22 postcards). That's 68 levels in all.
- **Each country** has its own enemies, music, signature item and boss.
- **Core power-ups:** the magic mushroom, the joint (smoke puffs) and the LSD tab (rainbow flight).

**Framework and guides:**
- Framework: `src/28_tour_*`, with one country per file in `src/29_tour_<cc>.js`.
- How to add or change a country: `docs/WORLD_TOUR_GUIDE.md`. Spec: `docs/design/DIRECTION.md`.

**The Fiesta Toon look (local session, Nov 3).** Brady chose it: flat cel shading with dark outlines.
- Ink outlines: `src/06a_ink.js`. Sprite atlases with procedural fallbacks: `src/03a_atlas.js`. The Mexico wiring is `src/29_tour_mx_sprites.js` and the generic wiring is `src/30_tour_sprites.js`.
- Atlases (WebP) live in `assets/sprites/super-brady-o-world/`, made by `tools/blender/sprites/` (`render_country.py`, `pack_atlas.py`). Brief: `docs/SPRITE_BRIEF.md` and `WORLD_TOUR_GUIDE.md` §13.
- **Converted so far:** Mexico fully. Ecuador, Brazil and Mozambique have backgrounds, floors, enemy casts and items.
- **Still procedural** (they have the ink line but no sprite art): Morocco, Spain, France, Amsterdam, Bali, Vietnam, Japan, Nepal, Antarctica and World 22.
- **The player stays the code-drawn Brady** (Brady's decision). Never swap in a Blender-rendered Brady.

**The bosses** were redesigned per `docs/BOSS_REDESIGN.md`:
- Each one is unique, uses objects from its world, and is never "stomp its head three times".
- They have custom hit rules, phases and props.
- Test them with `tools/boss_test.js`, which runs `tools/boss_tests/<cc>.js`.

## Waiting for you: ChatGPT's PR #2 (`codex/super-brady-o-graphics-pass`)
Read its notes: `git show origin/codex/super-brady-o-graphics-pass:docs/GRAPHICS_PASS_HANDOFF.md`.

**What it does:**
- **Brady:** black trousers and geometric sleeve circles, plus a cream outer keyline so his black outfit reads in dark scenes.
- **Size:** the player is drawn 1.24× its collision box, and enemies 1.24–1.42×. Collisions are unchanged.
- **Depth:** a 16% fog-colour veil over the background, and decorative objects at 76% opacity.
- **A new country map:** an island landscape panel with a trail, landmarks, numbered stops and a boss fort (`src/28_tour_fa_landscape.js`).
- **A new test:** `tools/sbw_graphics_test.js` (named `graphics_test.js` in the PR), covering 70 country × viewport cases.
- **What ChatGPT did not do:** run it in a real browser, take screenshots, or test on an iPhone.

**Integration steps:**
1. Check it out, build, and run `validate_levels`, `gameplay_test`, `boss_test` and `sbw_graphics_test`.
2. **Take screenshots and look at them.** In particular check dark caves, underwater levels, power-up effects, the short landscape country panel, enemy art against its collision box, and the cost of outlining atlas sprites.
3. Done: the Super Brady-O World copy is `tools/sbw_graphics_test.js`, so it no longer clashes with PR #3's `tools/graphics_test.js`.
4. Merge, then show Brady screenshots.

## Then: the polish list, in priority order
1. **Convert the remaining 10 lands to Fiesta Toon** the way Mexico was done: Blender models per country, render, pack, then a `29_tour_<cc>_sprites.js`.
   - **Order:** finish Ecuador, Brazil and Mozambique (anything left), then Morocco, Spain, France, Amsterdam, Bali, Vietnam, Japan and Nepal, then Antarctica and World 22.
   - **Show Brady one country before batch-producing the next.**
   - **Respect rules:** people and sacred sites are background only. Use no Christ the Redeemer, show the Eiffel Tower only in daylight or with generic lights, and use no existing Japanese characters.
2. **Polish ("juice"):**
   - squash and stretch, dust, sparkles
   - hit-pause on big hits, gentle screen shake
   - parallax depth, light shafts
   - smooth 60 fps animation
3. **Readability on a phone:** Brady and the hazards must always pop. Use contrast checks in dark and underwater levels.
4. **Bosses:** verify every redesigned fight is fun, fair and readable. Each has tells, a twist and a satisfying finish.
5. **Map and menus:** the world map and the new country panel should feel premium, with flight animations and postcards.
6. **Real iPhone:** test touch controls and frame rate in both orientations.

## Your files and tests
- **You own:** `src/03`–`src/30`, `assets/sprites/`, `tools/blender/sprites/`, `tools/validate_levels.js`, `tools/gameplay_test.js`, `tools/boss_test*` and `tools/find_seeds.js`.
- **Never edit** `src/40`–`src/43`, which belong to the 3D games.
- **Run before every merge:**
  - `node tools/validate_levels.js`: all 68 levels finishable, all postcards reachable.
  - `node tools/gameplay_test.js`
  - `node tools/boss_test.js`
  - `node tools/apps_test.js`

## First message (Brady pastes this)
```
Read docs/handoff/README.md and docs/handoff/SUPER_BRADY_O_WORLD.md. You are the Super Brady-O World agent. Phase 0: pull main, build, run validate_levels, gameplay_test, boss_test and apps_test, and show me screenshots of Mexico (the finished Fiesta Toon look) and of one unconverted country. Then review ChatGPT's PR #2 (codex/super-brady-o-graphics-pass) with real screenshots and tell me in plain words what it changes and whether to merge it. Then propose the plan to convert the remaining countries to Fiesta Toon, one country at a time, starting with whatever is left in Ecuador, and wait for my OK. Keep the player as the code-drawn Brady.
```
