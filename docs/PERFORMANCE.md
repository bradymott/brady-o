# Super Brady-O World: frame rate on a phone (November 2026)

Brady played the build on his iPhone: "a touch laggy on the Mexico boss level; World 3 (Brazil) was also a bit
laggy". This pass measured every level, boss fight and map, found what costs the time, and fixed it.

## How it is measured (`tools/sbw_perf_test.js`)
- The REAL game loop (requestAnimationFrame, the fixed-step accumulator, drawing) of every level (all areas, Brady
  placed at standing spots spread over each area, a keyboard autopilot running and jumping, he cannot be hurt), every
  boss arena mid-fight (both phases, the boss cannot be beaten), every land's walkable overworld and the route map, at
  844 x 390 pt, 3x (the canvas is 2x by default: 1688 x 780), touch layout.
- **Engines.** WebKit (`--engine webkit`, the Safari engine on the Mac: the same CoreGraphics canvas as iOS) with
  `--flush` (one pixel read back after each frame, so the frame's rasterization is finished and counted) is the main
  number. Chromium with the GPU (`--gpu`, ANGLE Metal) and CDP CPU throttling (`--throttle 4`) shows the JavaScript side
  of a phone-class CPU. Frame cost = the time of one `Game.frame` (update + draw + raster with `--flush`).
- **Paired runs.** `--pair <other build>` measures a second build on the same scenario at the same time in its own
  browser. Agents and tests share this Mac, so absolute times swing by 2x and more from hour to hour; the before/after
  RATIO of a paired run holds. `--ref 1-1` measures the reference level right after every scenario, in both builds,
  so each scenario is compared with a reference taken under the same load. Rankings below are from such runs.
- **Profile window** (instrumented, not timed): Ink passes, drawImage calls and the device pixels each painter covers
  (`pxBy`), fillRect pixels, text calls, gradients, read-backs, canvases created, particles, weather, entities updated
  and drawn, JS heap and allocation rate, draw time per entity class.
- `--ablate ink,bg,post,...` switches one painter off to see what it costs.
- `--short` is the regression guard (see below). `--tier N` pins a graphics tier. `--tiers` checks the tier controller.
- Debug hooks in the game: `Game.perf` (src/99_main.js: null when off, so it costs nothing), the names exported on
  `window.BRADY` (TS, SOLID, Decor, PostFX, ...).

**Headless numbers are not iPhone numbers.** A Mac's M3 is faster than an iPhone's CPU and GPU. Use them to rank and
for before/after ratios. On iOS the 2D canvas is drawn by CoreGraphics in Safari's GPU process: what costs is the
number and size of drawing operations (fill rate, overdraw, offscreen canvases drawn from and into each frame), not
the JavaScript.

## What was costing the time
(see the report in the commit history for the full tables)

1. **The ink outline's scratch canvases only ever grew** (`src/06a_ink.js`). Every code-drawn thing (Brady included)
   is painted to a scratch canvas, turned into a silhouette and stamped around itself: about 40 canvas operations a
   frame each. The three scratch canvases were shared and grew to the largest thing ever inked: a boss (Mexico 1-5)
   or a big Brazil / Mozambique / Spain / France / Netherlands / Morocco prop baked into the prop cache grew them to
   about 1000 x 1100 px, and from then on every inked sprite, Brady too, worked on a sub-rectangle of a big surface,
   which is Safari's slow path (measured: drawing a canvas whole is about twice as fast as drawing part of a bigger
   one, and 'source-in' / 'destination-in' clear the whole surface): Brady's line went from 4 ms to about 9 ms per
   frame on the Mac. That is the Brazil lag (World 3's props grew them in 3-2) and part of the boss lag. The
   scratch canvases are now exactly the size of the work and drawn whole.
2. **Everything inked was re-inked every frame**, static or not: levers, crates, signs, gates, cold shells, the
   postcards, the kick target...
3. **Bosses inked a box far bigger than their art** (max(60, width) px of slack all round).
4. **The backdrop's overdraw**: the 16 % veil over the whole backdrop, empty rows of every parallax layer blended
   every frame, the full-screen clear under a sky that covers it, two full-screen bloom passes, the HUD's dozens of
   small shapes and glyphs.

## What changed
| Change | Where | Look |
|---|---|---|
| Scratch canvases of exactly the size of the work, drawn whole; least recently used dropped past a 4 MP budget | `06a_ink.js` `Ink.canvas` | identical |
| Held ink pictures: the colour pass's drawing commands are fingerprinted; unchanged since the last frame -> inked once, then blitted until they change (`Ink.statics`); `opts.key` for callers that know their state; Medium/Low re-ink animated owners at 30 Hz (`Ink.every`) | `06a_ink.js` | identical (a still camera is pixel-identical; a moving one may place a held picture up to half a device pixel off) |
| The postcards / gold records drawn from cached inked frames (17 sway angles / 12 spin widths) | `10_entities.js` `Gold.draw`, `Ink.cached` | the sway is quantized to under a degree |
| Boss ink box = measured reach of each boss's art + 16 px (`BOSS_INK_REACH`) | `10d_bosses.js` | identical |
| Brady's ink box fitted to his measured reach in ordinary play | `11_player.js` | identical |
| The 16 % veil baked into the backdrop (every colour pre-mixed, every cached canvas tinted once, additive sky light at 84 %) | `03_themes.js` `BG.get`, `12_play.js` | identical within 8-bit rounding |
| Image parallax layers start at their strip's first row (the empty sky rows above were blended every frame); a still camera reuses the finished backdrop (30 Hz refresh when the sky has moving light) | `03_themes.js` `BG.get`, `BG.draw` | identical (sky light animates at 30 Hz while the camera is still) |
| No full-screen clear under a Play scene that covers the canvas | `99_main.js`, `12_play.js` `coversCanvas` | identical |
| Bloom: the two glows screened together at 1/6 size, one full-screen pass; sampled every 2nd frame | `15_postfx.js` | identical math; the glow can lag one frame |
| HUD painted into its own canvas at 30 Hz | `12_play.js` `drawHUD` | pulses at 30 Hz |
| Confetti, debris, leaves placed with one setTransform (no save/restore per bit); draw lists reused | `12_play.js` | identical |
| Graphics tiers with an automatic controller, Settings and pause `GFX` switch, FPS readout | `14_quality.js`, `13_ui.js`, `99_main.js` | see below |

## Graphics tiers (`src/14_quality.js`)
Cut levels, in this order: 1 trip effects (no onset lean or joint breathing copy, no cycling line colours, coarser sway bands, half the trip shapes; see "Trip effects" below) and the bloom sampled every
4th frame; 2 particles and weather at half density, enemies and bosses re-inked at 30 Hz in a scratch area fitted to
what their art was seen to reach; 3 the light keylines and form shading of code-drawn art (Brady keeps his keyline; all
dark ink stays); 4 bloom, vignette, the haze between backdrop layers, the sky's light rays, the trips' colour pass on the level and their shapes; 5 the farthest parallax
layer; 6 and 7 internal resolution 1.75x and 1.5x (never lower). HIGH = 0, MEDIUM = 2, LOW = 5.

AUTO (default) starts where the last session settled (one step better, to re-check), steps down after two slow 1 s
windows in a row (more than 12 % of frames over 1.45x the display's frame period, or the mean over 1.18x; measured on
the real frame interval, so it sees the GPU too), and steps up only after a calm stretch (15 s, doubled after each
failed try, at most two tries per level per session). It recognises 60, 90 and 120 Hz displays. Tests (WebDriver) are
never moved by it.

Settings: GRAPHICS (AUTO / HIGH / MEDIUM / LOW) and FPS COUNTER; the pause menu has GFX next to ZOOM.

## The FPS readout
Settings -> FPS COUNTER: ON shows, at the bottom centre of the screen: frames per second over the last second, the slowest frame
in it, the game's own work per frame (JavaScript; Safari draws on another thread, so low FPS with low work means
drawing is the cost), the tier (and the AUTO level) and the canvas resolution. Ask Brady to read it off in Mexico 1-5's
arena, Brazil 3-1 and 3-5, and the overworld.

## Trip effects (17 November, `src/15_postfx.js` TripFX)
Brady wanted the mushroom and acid trips "wavier and trippier" again, in the toon look. What each one costs per frame:
- one full-screen 'color' blend (a 'hue' blend at night) colours sky, backdrop and tiles together (the old build used two,
  one behind the level and one on it); LOW keeps a single pass on the sky only;
- the sway: the level so far (backdrop + tiles, before the characters) copied once into PostFX.shroomWob and drawn back
  in 3 device px rows (4 from MEDIUM) moved by whole pixels; the mushroom all through, the LSD only in its strong first
  ~2.6 s (the long mild part of the flight drops it); none at LOW or with FX CALM;
- HIGH only: the onset lean (one copy into PostFX.tripWarp and one transformed draw, for ~1.4 s after the pickup, shared
  with the joint's breath) and, in the LSD's strong part, the cycling line colours (one 'lighten' pass).
No per-frame allocations: no canvases (both scratch canvases are PostFX's fixed view-size ones), no gradients (the joint's
two per-frame gradients and its soft smoke sprite are gone), colour strings cached per whole degree.
Measured (WebKit, raster flushed, 180 synchronous draws per state, mean of two alternating runs of the live build and
this one on a shared, busy Mac; identical code paths differ by up to ~15 % between runs), ms per frame:

| tier | scene | no trip | mushroom onset | mushroom | LSD strong | LSD mild flight |
|---|---|---|---|---|---|---|
| HIGH | 1-1 | 3.2 | 4.1 -> 5.9 | 7.0 -> 7.0 | 4.8-5.3 -> 6.8-7.2 | 4.8 -> 4.9 |
| HIGH | 3-1 | 7.6 | 8.4 -> 9.9 | 9.0 -> 10.1 | 9.1-9.6 -> 10.8-11.4 | 8.6 -> 8.9 |
| HIGH | boss 1-5 | 6.8 | 8.0 -> 9.0 | 8.9 -> 9.1 | 8.6 -> 8.8-9.2 | 8.6 -> 8.0 |
| MEDIUM | 1-1 / 3-1 / boss | 3.3 / 7.3 / 6.3 | +0.8 / +0.8 / +0.9 | +0.9 / +1.2 / +0.7 | +0.5-0.9 | +0.2-0.4 |
| LOW | 1-1 / 3-1 / boss | 2.7 / 5.5 / 4.5 | within noise of the live build | | | |

(old -> new; MEDIUM and LOW rows: new minus live.) The LSD's strong part and the mushroom's first second at HIGH cost
about 1-2 ms more than the live effect on the Mac; the AUTO tier drops to MEDIUM if a phone can't keep up. Nothing
measured on an iPhone.

## Regression guard
`BRADY_DIST=<dist> node tools/sbw_perf_test.js --short` (about 10 minutes) runs the reference levels (1-1, 1-2),
Mexico 1-5, Brazil 3-1, 3-3, 3-4, 3-5, the 1-5 and 3-5 boss fights and two maps on WebKit with the raster flushed,
divides every scenario's mean and p95 frame cost by the mean of 1-1 measured right after it, and fails when one is
over `tools/perf_baseline.json` x 1.35 (`PERF_TOL` to change). It also checks the tier controller on synthetic frame
times and that held ink pictures match live ink pixel for pixel. `--short --write-baseline` rewrites the baseline
after an intended change (say why in the commit).

## Long sessions (November 16): "laggy after a couple of levels", "glitchy after a few deaths"
What a level, a death or a map visit left behind (branch `sbw/long-session`). Measured on the Mac with
`BRADY_DIST=<dist> node tools/sbw_session_test.js [--engine webkit]` (about 15 minutes, alone on the machine): four
repeats of 1-1 with deaths, the three trips and a trail death, 4-1 (the most inked props) with a death, the 1-5 boss
with a death, a level cleared out to the map, the overworld and the title.
- The old live build (c3ed88a): glow canvases +600 to +700 per repeat (2218 after four), canvases alive 718 -> 2316
  (Chromium, after forced GC), 7 slick / hot trail tiles left in the cached level after every trail death. Its frame
  cost on the Mac did NOT grow (18.4 -> 18.4 ms): the growth is memory, which is what an iPhone feels.
- This branch: every count flat from repeat 2 to 4 (canvases 34.1 -> 34.3 MP, glows 8, no trail tiles, no prop
  re-bakes), frame cost flat (Chromium 19.5 -> 19.7 ms per step, WebKit 8.0 -> 8.3). Nothing measured on an iPhone.
- **Mushroom sparkles made 16 new glow canvases every frame** (the live build, `main`: `15_postfx.js` asked
  `PostFX.glow` for a new `hsl()` hue each frame, cached forever): about 4000 canvases (~64 MB) per mushroom, kept all
  session. `sbw/items-fix` replaced that code; `src/16_session.js` also caps the glow cache.
- **Trails wrote into the cached level**: a slime / coffee trail still down when Brady died stayed in the level for
  every later try as an invisible slick or hot tile (`28_tour_i_behave.js` now copies the area's `surf` first).
- **Canvases dropped without being freed** (iOS keeps their memory until the garbage collector runs, and caps a page's
  canvas memory): backdrops and tile sets rebuilt on every atlas arrival and zoom, the inked-prop cache (48 pictures
  of any size, now also a 12 MP budget), the ink memo, the overworld's painted map (a new one of up to 4096 px square
  per map visit, now reused), the vignette, the HUD / light-map canvases of every Play (one per death) and the title
  screen's sprites (about 7 MP per visit). They are now freed when dropped (`releaseCanvases`, `03a_atlas.js`;
  `onSceneExit`, called by `Game.setScene`).
- **Every zoom change re-allocated the main canvas** (`Game.setRows` -> `resize`: each level start, boss fight, map);
  now only a real size change does.
- Small: joystick taps during levels queued for the map all session; the power picker chip could stay "held" after a
  pause.
