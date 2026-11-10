# Super Brady-O World: where work paused (10 Nov 2026)

Brady approved the whole plan with no per-country sign-off: merge PR #2 with fixes, finish the Fiesta Toon art, and overhaul the levels (no repeated level types, secret exits and levels, branching map, unique enemy powers, more power-ups and objects). Push and deploy as work lands; he plays it and asks for edits after. All save progress resets when the new levels ship. World 6 is "Spain", world 7 is "France". The player stays the code-drawn Brady.

Baseline: `main` at 5d07239 passed `validate_levels` (68 levels, 0 unfinishable), `gameplay_test` (51/0), `boss_test` (151/0) and `apps_test` (3/3).

## Branches (all pushed to origin, none merged to main)

### `sbw/graphics-pass-fixed` (tip a20a678): PR #2 plus fixes
Done: sprite enemies no longer inked, with per-frame fallback inking (`TourSprite.pick/inked` in `src/28_tour_d_actors.js`); enemy scale 1.24–1.3 and ink padding (0 of 107 procedural enemies clipped); decorations opaque again; atlas eviction (`Atlas.keep/drop`, `tools/sbw_atlas_test.js`); Spain/France renames; rebuilt island country panel (grid cells, `mapCell`/`mapFrom` per level, non-sacred landmarks, no cross on Brazil); test renamed `tools/sbw_graphics_test.js`.

Still to do before merging:
1. Brady's tattoos in `src/05_brady.js` (~lines 250–260): 3/4 sleeves on both arms, black only, sacred-geometry blackwork, a mandala on each elbow, readable at phone size. Brady does not need to review. Remove the PR's capsule tint and circles. Check the HUD icon and title-screen Brady match.
2. HUD coin icon shows as a sliver mid-spin; check whether Brady starts boss fights under the joystick in normal play.
3. Decide on the 16% fog veil (`src/12_play.js` ~line 663) from screenshots.
4. Review the France, Vietnam, portrait and 568x320 map shots; add a test with more than 5 stops.
5. Run `validate_levels`, `gameplay_test`, `boss_test`, `apps_test`; re-run the ink-calls-per-frame comparison in Mexico 1-1; take Brady, enemy and level screenshots and look at them.
6. Merge to `main`, push, deploy to gh-pages.

### `sbw/ec-br-art` (tip 710a865): Ecuador and Brazil leftover art
Blender route that works on this Mac: a separate GUI instance per job with `--factory-startup` (never `-b`, never the shared MCP window); see `tools/blender/sprites/gui/bl.sh` and `driver.py`. Those scripts still hard-code an old scratchpad path; fix before reuse.

Done: booby and puffer modelled, rendered, packed into `ec.webp` and wired in `src/29_tour_ec.js`. Coati and toucanito modelled in `br_enemies.py` and wired in `src/29_tour_br.js`, but never rendered; `br.webp` is not re-packed.

Still to do:
1. Render `KINDS=coati,toucanito`, check a contact sheet, then render and pack all of br.
2. Ecuador 2-2: the confusing "ground" is background layer L3 (`ec_equator.andean_ridges()`); rebuild it in `ec_andes.py` as a hazy valley far below. 2-2 is a ride level with no ground.
3. Tile seams (Mexico too): in `src/30_tour_sprites.js`, bleed atlas ground tiles 1 px past edges that have a neighbour.
4. Enrich `ec_galapagos` and `ec_cotopaxi` backgrounds if they look thin; consider a chunkier booby.
5. Update `docs/SPRITE_BRIEF.md` (KINDS must include friends, minions and custom-class enemies; the working Blender route) and `build_country.sh`.
6. Run `gameplay_test` and `boss_test`, take after-shots, merge after the graphics-pass branch.

## Level overhaul design: `docs/design/LEVEL_OVERHAUL.md`
Sections 0–2 are complete (30 archetypes; the full 88-level lineup, 68 main plus 20 secret). Sections 3–7 are binding notes to be written out in full; section 8 (art impact) is not started. Finish the document, then build the engine toolkit from its section 7, pilot on Mexico and Ecuador, then br, mz, ma, es, fr, nl, id, vn, jp, np, aq, w22.

Check for originality before building: the "Shrink Cookie" power-up and the item-disguised tanuki must not resemble Nintendo's equivalents.

## Notes for whoever resumes
- Scene scripts for Morocco (`ma_enemies.py`, `ma_souk.py`), Spain, France and Amsterdam are on `main`, finished but never rendered.
- Designs to change when reached: Morocco's blue genie boss (too close to a film character), Bali's boss fight inside a temple garden, the France tower at night (unlit silhouette only), the mime enemy (replace with an object).
- Screenshot tools: pin full resolution before capturing, or headless adaptive resolution blurs the shots. The worktrees and scripts under `/private/tmp/claude-501/...` may be gone after a restart; recreate worktrees from the branches.
- `gh` is not installed on this Mac. PR #2 on GitHub is superseded by `sbw/graphics-pass-fixed`.
