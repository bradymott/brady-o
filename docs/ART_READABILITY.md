# Art readability on a phone (November 2026)

Brady played the live build on his iPhone and said the sprites "look like they did before, very flat and small and
hard to see". This pass finds out why and fixes it for every enemy, friend, item, item block, hazard and interactive
object, Blender-rendered and code-drawn alike. Backgrounds were left as they were.

## Diagnosis (measured at 844 x 390 points, 3x, touch UI, default settings)
1. **Small.** The view showed 12 tile rows, so a tile was 32.5 pt and a typical one-tile enemy 25-31 pt tall
   (about 4-5 mm); fish and bees were 15-20 pt. Silhouette areas were mostly 300-600 pt², a 20 pt square.
2. **Flat, and this was a real bug.** The Blender sprite renderer outlines each part with an inverted-hull shell.
   That shell is closed around the part and it cast shadows, so every character sat in the shadow of its own outline
   and was lit only by the even grey world fill. The three-band cel ramp therefore never showed a light side: the
   key light's strength could go from 0.5 to 8 with no visible change (tested). Every atlas character in all 14
   countries was effectively unlit.
3. **Low contrast with the scene.** Characters are as saturated and mid-valued as the painted backdrops behind them
   (a green pepper on a green wall, a yellow banana on a pale sky, a lavender fish in teal water). Mean-luminance
   contrast (WCAG ratio, enemy pixels vs the background behind them) was 1.1-1.6 for half the measured enemies.
   The underwater wash was drawn over the characters too.
4. **Soft.** The default quality draws the canvas at 2x and the phone stretches it to 3x; the adaptive resolution
   could then drop to 1.5x and 1x on a busy frame, where every ink line goes soft.

## What changed
| Change | Where | Why |
|---|---|---|
| **Near zoom**: 10 rows (11 in climbing, falling and flying areas) instead of 12 on phones; Far = 12. "Zoom: Near / Far" in pause and settings, saved. Boss arenas zoom out to fit their width (never past 12). | `99_main.js` (`Game.rows`, `setRows`), `12_play.js` (`Play.viewRows`, `zoomNear`), `13_ui.js` | Everything, Brady included, is 20 % larger. |
| Look-ahead leans further in the run direction when zoomed (0.13 of the view instead of 0.08, Brady at 0.40 instead of 0.42): about 16 tiles ahead at a run vs 17 at Far. Backdrop ground line rises with the floor (`BG.draw` `lift`). | `12_play.js`, `03_themes.js` | Fairness at the larger zoom; backdrops framed as before. |
| **toon2 character look**: lights without shadows (fixes the bug above), a 4-band ramp (deep shadow, shadow, mid, light) under a more raking key light, a crisp rim light on the upper lit edge, a hard specular glint, 22 % more saturated key colours, unlit bright eye whites, eyes 15 % larger. | `tools/blender/sprites/lookkit.py`, `render_country.py` | Volume and punch while staying flat cel + dark ink. |
| **2D finish in the packer** (`HALO=1`): a top-to-toe value ramp, a heavier ink line around the whole silhouette (outer contour thicker than interior lines, interior hull 1.1 px instead of 1.25), a clear margin for the keyline. | `pack_atlas.py`, `imgkit.toon_post` | Silhouette weight > interior weight. |
| **Light keyline for atlas characters** drawn at runtime from a half-size silhouette copy made once per atlas. | `03a_atlas.js` (`makeHalo`) | A baked semi-transparent keyline made the WebP 50 % bigger; this costs one extra blit per sprite. |
| Contact shadows under every actor; the underwater wash goes under the characters. | `12_play.js` (`drawShadows`) | Grounds actors, separates them from the floor. |
| Code-drawn art (every `Ink.around` caller: procedural enemies, objects, props, Brady): a light-to-shade ramp, a bright upper-left rim and a lower-right shade band computed from the silhouette on the scratch canvases already in use; procedural enemies also get the cream keyline Brady has. | `06a_ink.js` (`Ink.shade`, `Ink.keyline`) | One shared helper, so all the new procedural enemies and obstacles benefit. |
| Enemies drawn 1.3x their hitbox (was 1.24); hitboxes unchanged. | `06a_ink.js` `ART_SCALE` | Within the brief's 30 %; no stomp or hit is misleading. |
| Squash-and-stretch life on atlas sprites: breathing idles, a walk bob, a squat-and-tremble wind-up before charges, curls and throws, stretch on hops. | `28_tour_d_actors.js` (`TourSprite.squash`), `Atlas.draw` `sx/sy` | Alive, noticeable, telegraphs attacks. |
| Spike tiles get ink + a light keyline when the tile cache is built; tile coins drawn 15 % larger. | `04_tiles.js` (`TileArt.hazard`), `12_play.js` | Hazards had near-zero contrast (bamboo stakes on foliage). |
| Adaptive speed drops post effects first and never goes below 1.5x on a hi-dpi screen. | `99_main.js` | Minimum sharpness for the sprites. |

## Numbers (844 x 390 pt @3x, default quality = 2x canvas; harness in the readability work folder, see below)
| | Before | After |
|---|---|---|
| Tile rows on screen / one tile | 12 rows / 32.5 pt | 10 rows (Near) / 39 pt |
| One-tile enemy (Mexico pepper, hitbox 24 pt -> 29 pt) | 30.5-31 pt tall | 40.5-43 pt tall |
| Brady | 57 pt | 68.5 pt |
| Median character height per country (walk/idle frames) | 18-28 pt | 24-36 pt |
| Small fry: cenote fish / tulip bees | 15 pt / 19.5 pt | 24.5 pt / 27 pt |
| Atlas ink, interior lines | 3.75 texels = 4.7 physical px | 3.3 texels = 5.2 px |
| Atlas ink, silhouette | 4.7 px | 7.6 px, plus a 4 px light keyline |
| Code-drawn ink | 4.0 px | 4.8 px, plus a 2.9 px keyline on enemies |
| Light side on atlas characters | none (the outline-shadow bug) | 4 cel bands, rim, glint |
| Enemy vs background, mean-luminance WCAG ratio (same spots; framing differs with the zoom) | 1.2-4.2 | 1.0-4.6 (unchanged: colours stay the country's) |
| Edge separation (strongest WCAG contrast of the 4 px edge band vs the background), controlled bench: every country's characters over 6 reference backdrops, worst backdrop per country | 2.43-3.04 | 2.63-3.01 |

The honest reading: the dark ink line already gave decent edge contrast on light backdrops; what the owner saw as
"flat, small, hard to see" was size (now +30 % linear, +70 % area), no light side (fixed), and dark or busy scenes
(the keyline now separates characters there: compare the night beach and night dive shots). Hazard spikes went from
near-invisible (brown stakes on brown/green) to inked and keylined.

Atlas sizes (WebP) and decoded memory (image + the quarter-size keyline copy): Mexico 398 -> 438 KB, 5.5 -> 8.5 MB;
every country cast stays under 440 KB (the biggest: id 439, mx 438, np 430, jp 429 KB); decoded memory per cast
+50-60 % (the clear margin around frames for the keyline, plus the keyline copy). The atlas eviction test (tools/sbw_atlas_test.js) peak went from 18.1 MB to 21.1 MB decoded; the
limit of what a level keeps in memory is unchanged.

Frame cost (headless Chrome, software raster, NOT an iPhone; mean ms per Play.draw at 844x390 pt, 2x canvas):
switching the form pass, the keylines and the zoom on and off changes nothing measurable (Mexico 1-1: 59.4 base,
58.6 without the form pass, 58.7 without form and keylines, 58.8 at Far); against current main the branch is within
run-to-run noise (main 58-63 ms, branch 57-60 ms). The keylines are one extra blit per atlas sprite and the form pass
works on the scratch canvases Ink already uses; nothing new runs per pixel per frame.

## Rendering
`tools/blender/sprites/build_country.sh <cc> <work> enemies [extras]` renders characters with `CHAR_LOOK=toon2`
(default) and packs with `HALO=1`; `extras` builds the `<cc>_x` atlas from `<cc>_extras.py`. `CHAR_LOOK=toon` gives
the old look. Backgrounds are unchanged (`LOOK=toon`).

## Still to do
- The new extras casts on `sbw/art-new-cast` (`mx_x`, `ec_x`, `br_x`, `mz_x`) were rendered in the old look. Once that
  branch is merged, re-render them in toon2 (one Blender job at a time, about a minute each):
  `for c in mx ec br mz; do tools/blender/sprites/build_country.sh $c /tmp/brady-sprites/$c extras; done`
- Not measured on a real iPhone yet (frame rate, how the Near zoom feels in the hand).
- Boss sprites drawn in code go through Ink and get the form pass; their own art was not redrawn.
