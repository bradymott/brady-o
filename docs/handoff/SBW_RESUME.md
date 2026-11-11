# Super Brady-O World: state of the work (11 Nov 2026)

Everything below is on `main` and deployed to https://bradymott.github.io/brady-o/super-brady-o-world/ (only the `super-brady-o-world/` folder of `gh-pages` is replaced on each deploy, so the other two games are untouched).

## What shipped
- **PR #2 (ChatGPT's graphics pass)** merged with fixes: black trousers, cream keyline, 3/4 blackwork sleeves with elbow mandalas, atlas memory eviction. Its GitHub PR is superseded by `main`.
- **Fiesta Toon art for all 14 lands**, plus extras atlases (`<cc>_x`) and extra themes for the rebuilt levels.
- **The level overhaul** (`docs/design/LEVEL_OVERHAUL.md`): 88 levels (68 main, 20 secret) in the v2 format, one `src/29_tour_<cc>_levels.js` per land; toolkit status and the "how to write a level" guide in `docs/design/TOOLKIT_STATUS.md`. Save key is v2 (progress was wiped once).
- **Brady's playtest requests** (11 Nov): power picker chip, joint and acid pickup trips, mid-air twitch removed, three jump powers (Spring Socks, Pound Cake, Magic Beans) placed in every land, readability pass (phone zoom Near/Far, lit "toon2" sprite look with every cast re-rendered, shadows and light outlines; see `docs/ART_READABILITY.md`), and the walkable overworld map (`src/28_tour_fc_maplayouts.js`, `fd_overworld`, `fe_owpaint`, `ff_owscenes`).
- **Freeze report (Mexico "first water level")**: not reproduced as a true freeze. Fixed: Brady started 1-2 on the dock instead of in the boat and drowned every life. Added: a per-entity error safety net, a real-time soak test (`tools/sbw_soak_test.js`), seeded and fixed-step boss tests.

## Run before every merge
`validate_levels --rules`, `gameplay_test <shots>`, `boss_test --shots <dir>`, `apps_test "" <dir>`, `sbw_graphics_test`, `sbw_atlas_test`, `sbw_toolkit_test`, `sbw_powers_test`, `sbw_overworld_test`, `sbw_soak_test`, `save_test`, `sbw_snapshot`, `levels_br_mz_test`, `levels_aq_w22_test`, `sbw_toolkit_shots <outdir> --checks` (the first argument is the output folder), `sbw_perf_test --short` (the frame-cost regression guard: WebKit, reference levels, Mexico 1-5, Brazil, two bosses, two maps, against `tools/perf_baseline.json`; see `docs/PERFORMANCE.md`). Last full run on `main`: all passing, 88 levels finishable, gameplay 52/52, bosses 172/172.

## Performance (Nov 2026, `docs/PERFORMANCE.md`)
Brady found Mexico 1-5 and Brazil laggy. Measured with `tools/sbw_perf_test.js` (the real loop, every level, boss and map; WebKit with the raster flushed, paired before/after runs) and fixed: the ink outline's scratch canvases only ever grew (a boss or a big Brazil prop made every later sprite, Brady included, twice as costly), everything inked was re-inked every frame, bosses inked far bigger boxes than their art, and the backdrop overdrew (veil, empty layer rows, a redundant clear, two bloom passes). Graphics tiers HIGH / MEDIUM / LOW with an AUTO controller (default) in Settings and pause (GFX), and an FPS COUNTER in Settings for Brady to read numbers off his phone.

## Open items
1. **Nothing has been verified on a real iPhone by an agent.** Ask Brady to turn on Settings -> FPS COUNTER and read it in Mexico 1-5's arena, Brazil 3-1 / 3-5 and a boss fight. Unknown: frame rate during the acid trip, the overworld's one-off map repaint after a reveal, how Zoom: Near feels, and whether the freeze Brady saw is gone. Ask Brady.
2. **Readability may need a second step** if Brady still finds sprites small or flat: grow enemies relative to tiles (hitboxes too, then re-validate), recolour enemies that match their backdrop (measured contrast barely moved).
3. **Still code-drawn:** all 14 bosses and the mini-bosses (Brass Owl, Tin Yak, Snow-Plough Bot); many objects and room interiors; new casts for Indonesia, Vietnam, Japan, Nepal, Antarctica and World 22 beyond what their `_x` atlases hold. Each level agent's missing-art list is in the commit history of its branch (`sbw/levels-*`).
4. **Art re-renders wanted:** `es_pintxos` ghost shapes, `es_teide` cloud collar at play height, `np_pass` monastery behind the finale (safer removed), ground strips without the block outline, strips drawn too low for the phone camera (`fr_provence`, `fr_baie`, `nl_veiling`), a vertical `jp_tower`.
5. **Overworld:** Bali, Antarctica and World 22 maps are sparser than Mexico's.
6. **Feel:** in portrait the view is narrower than the 1-2 boat; holding right on ride levels walks Brady off the boat; validator rule 5 (premium item tucked away) is a warning, not an error; the level checker does not simulate gliding or swimming.
7. **Save:** not reset again after the last six lands were rebuilt. Bump the key if Brady wants a clean slate.
8. Names invented by an agent, pending Brady's say: Spring Socks, Pound Cake, Magic Beans; Berrad the Magnificent (Morocco's boss, replacing the genie).

## Practical notes
- Blender: a private GUI instance per job via `tools/blender/sprites/gui/bl.sh` / `build_country.sh <cc> <workdir> [parts]` (`extras` rebuilds `<cc>_x`). Never `-b`, never the shared MCP window.
- Screenshots: pin full resolution first (see `tools/sbw_toolkit_shots.js`).
- The Art Cart agent also pushes to `main`; fetch and merge before pushing.
- Feature branches `sbw/*` on origin are all merged and can be deleted.
