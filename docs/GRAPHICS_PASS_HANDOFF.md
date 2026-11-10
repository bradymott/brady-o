# Super Brady-O World graphics pass

Based on main at `823a4d9e5434abc989c9ce340ee01be66d0a2a38`.

## Changes

- Brady wears black trousers, with geometric blackwork circles on the exposed sleeves. His bun, shades, animation poses and appearance customization remain supported.
- The player art is 1.24 times the collision dimensions, with a dark silhouette and a subtle cream outer keyline to keep the black outfit visible in dark scenes.
- Country enemies draw at 1.24–1.42 times their collision dimensions, with the biggest lift for tiny creatures. Rendered atlases now receive the same Ink outline as procedural art. Feet and swimming/flying origins remain anchored; collision boxes and movement are unchanged.
- A 16% veil in each theme's own fog colour separates background scenery from play objects. Decorative objects render at 76% opacity; tiles, hazards, collectibles and actors retain full contrast.
- The country panel is a miniature island landscape with a winding trail, regional palettes and vector landmarks, numbered stops, a boss fort, completion checks, postcard markers, focus indicators and an active-stage arrow. Global flight, country selection, progression, story postcards, keyboard controls and saves still use the existing map system.
- `28_tour_fa_landscape.js` loads after the map class and before the country data. It overrides only the country panel layout/drawing methods. Its palettes cover all 12 main destinations and the two secret lands.

## Validation

- `node tools/build.js`: passed for all three applications.
- `node tools/sbw_graphics_test.js` (renamed from `graphics_test.js`, which PR #3 also adds): passed 70 country/viewport combinations (874×402, 390×844, 667×375, 568×320, 320×568), finite rendering coordinates, contained/nonoverlapping touch targets, procedural/loaded-atlas enemy outline dispatch, and fresh-save stage unlocks.
- `node tools/validate_levels.js`: all 68 levels finishable, all postcards reachable.
- All source modules parse with Node's JavaScript parser.

## Remaining review

This is an implemented first graphics pass, not a claim of final App Store-quality visual approval. Browser launch and local preview serving were blocked by this session's environment. Real browser screenshots, iPhone Safari playtesting, and frame-time profiling have not been completed. In particular, review dark caves, underwater scenes, power-up effects, the short landscape country panel, enemy art versus collision alignment, and the cost of outlining atlas sprites.

Run `node tools/gameplay_test.js` in an environment with Playwright available. Build artifacts are reproducible; do not publish the partial asset checkout from this session. This PR changes source only and does not update GitHub Pages. Merge into the current development branch before rebuilding/publishing with the complete repository assets.

## Art direction for subsequent work

Use original, rounded adventure-platformer shapes, strong foreground silhouettes and softer distant scenery. Preserve country-specific architecture and flora. Keep Brady's black outfit and geometric sleeve tattoos; do not introduce blue jeans or a curtain of hair behind the bun. Prefer readable character features over fine detail that disappears at phone size. The existing country atlases are retained rather than regenerated in this pass.

## Fixes before merging (Claude, 10 Nov 2026, branch `sbw/graphics-pass-fixed`)

- Atlas enemies are no longer inked a second time (their outline is baked in; the extra pass doubled draw time and clipped art). The choice is made per frame drawn, so a procedural fallback for a kind or mode missing from a loaded atlas is still inked.
- Enemy art scale is 1.24, up to 1.3 only for tiny enemies, keyed on the longest side; `Ink.ent` slack grows with it and `cfg.inkPad` adds more where art reaches far. 0 of 107 procedural enemies clip.
- Decorations are fully opaque again. The 16% fog veil stays: it is subtle and separates Brady from busy backgrounds.
- Brady's tattoos are clean 3/4 blackwork sleeves: a triangle fringe under the tee sleeve, a mandala on each elbow, a diamond and double band ending mid-forearm. Black only.
- The country panel puts every stop in its own grid cell (`mapCell`, `mapFrom`, `mapHidden` per level for secret levels and branches), with non-sacred landmarks, 10-11px labels, level types, padlocks and the SOUVENIR line.
- Atlas memory: each level keeps only its own atlases (`Atlas.keep`).
- The HUD coin is still and face-on; Brady walks a few steps into boss arenas so he doesn't start under the touch joystick.
- World 6 is "Spain" and world 7 is "France".
