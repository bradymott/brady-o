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
  browser. Agents and tests share this Mac, so absolute times swing by 1.5x from hour to hour; the before/after RATIO
  of a paired run holds. Rankings below are from paired runs.
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
   about 1000 x 1100 px, and from then on every inked sprite, Brady too, paid for the whole surface (Safari copies and
   clears a full canvas surface when it is drawn from and then drawn into): Brady's line went from 4 ms to about 9 ms
   per frame on the Mac. That is the Brazil lag (World 3's props grew them in 3-2) and part of the boss lag.
2. **Everything inked was re-inked every frame**, static or not: levers, crates, signs, gates, cold shells, the
   postcards, the kick target...
3. **Bosses inked a box far bigger than their art** (max(60, width) px of slack all round).
4. **The backdrop's overdraw**: the 16 % veil over the whole backdrop, empty rows of every parallax layer blended
   every frame, the full-screen clear under a sky that covers it, two full-screen bloom passes, the HUD's dozens of
   small shapes and glyphs.

## What changed
| Change | Where | Look |
|---|---|---|
| Scratch canvases per 64 px size bucket, least recently used dropped past a 4 MP budget | `06a_ink.js` `Ink.canvas` | identical |
| Held ink pictures: the colour pass's drawing commands are fingerprinted; unchanged since the last frame -> inked once, then blitted until they change (`Ink.statics`); `opts.key` for callers that know their state; Medium/Low re-ink animated owners at 30 Hz (`Ink.every`) | `06a_ink.js` | identical (a still camera is pixel-identical; a moving one may place a held picture up to half a device pixel off) |
| The postcards / gold records drawn from cached inked frames (17 sway angles / 12 spin widths) | `10_entities.js` `Gold.draw`, `Ink.cached` | the sway is quantized to under a degree |
| Boss ink box = measured reach of each boss's art + 16 px (`BOSS_INK_REACH`) | `10d_bosses.js` | identical |
| Brady's ink box fitted to his measured reach in ordinary play | `11_player.js` | identical |
| The 16 % veil baked into the backdrop (every colour pre-mixed, every cached canvas tinted once, additive sky light at 84 %) | `03_themes.js` `BG.get`, `12_play.js` | identical within 8-bit rounding |
| Parallax layers trimmed to their painted rows | `03_themes.js` `bgUsedRows` | identical |
| No full-screen clear under a Play scene that covers the canvas | `99_main.js`, `12_play.js` `coversCanvas` | identical |
| Bloom: the two glows screened together at 1/6 size, one full-screen pass; sampled every 2nd frame | `15_postfx.js` | identical math; the glow can lag one frame |
| HUD painted into its own canvas at 30 Hz | `12_play.js` `drawHUD` | pulses at 30 Hz |
| Confetti, debris, leaves placed with one setTransform (no save/restore per bit); draw lists reused | `12_play.js` | identical |
| Graphics tiers with an automatic controller, Settings and pause `GFX` switch, FPS readout | `14_quality.js`, `13_ui.js`, `99_main.js` | see below |

## Graphics tiers (`src/14_quality.js`)
Cut levels, in this order: 1 trip effects (no breathing copy, colour sheen or fractal) and the bloom sampled every
4th frame; 2 particles and weather at half density, enemies and bosses re-inked at 30 Hz in a scratch area fitted to
what their art was seen to reach; 3 the light keylines and form shading of code-drawn art (Brady keeps his keyline; all
dark ink stays); 4 bloom, vignette, the haze between backdrop layers, the sky's light rays; 5 the farthest parallax
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

## Regression guard
`BRADY_DIST=<dist> node tools/sbw_perf_test.js --short` runs the reference levels (1-1, 1-2), Mexico 1-5, Brazil
3-1, 3-3, 3-4, 3-5, the 1-5 and 3-5 boss fights and two maps on WebKit, checks every scenario's mean and p95 frame cost
relative to the same run's 1-1 against `tools/perf_baseline.json` (tolerance 1.35x, `PERF_TOL` to change), and checks
the tier controller. `--write-baseline` (with the same scenario set) rewrites the baseline after an intended change.
