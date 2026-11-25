# Burning Man finishing release — 20 November 2026

Continued directly in Codex, without Claude. The release combines the saved polish, motion and music/icon branches with shared main at `78bfe81`, preserving the newer Super Art Kart and Super Brady-O World work.

## Delivered

- Fire climbs the Man through his raised hands; kneeling stunned pose, readable map labels/street names, persistent guide arrow, and portrait RUN placement.
- Realistic Brady's calmer gait and dedicated spin, flip, pound, bike and climb clips. Artwork climbing/hanging and the flight/pilot/freefall/canopy/landing states now also retain the realistic model.
- 29 house tracks with reduced bass, separate kick-driven bass ducking, clearer chord ranges, per-track balancing, city day/night switching, and checked loop transitions. The Temple remains beatless.
- Neon Man/heart home-screen icons, shipped by the build with manifest and Apple touch-icon links. Existing iOS home-screen icons may remain cached.
- Fire shader uses defined ascending-edge smoothstep expressions for portability.

## Validation

Passed: `apps_test`, `burns_nav_test`, `burns_flow_test`, `burns_allworlds_test` (21 worlds), `cart_battle_test`, `skinactor_test`, `skinpbr_test`, `char_test`, and `graphics_test` (20 playable/sandbox worlds, 38 standard hero clips, 20 prop/LOD builds, all three graphics tiers, baseline budget comparison).

`burns_actions_test` passes all eight flight/artwork poses and follows the actual final-boss defeat callback through rescue, rising/full fire, collapse, results Continue, and the saved epilogue. Its save fixture must use the completed saucer **token**, not only a mission status string. `ONLY_ENDING=1` isolates the ending.

`brady_motion_shots` captures the old/new walk and run, plus flip/spin/pound and both actual bike selections in portrait and landscape. It advances simulation and animation clocks explicitly, polls readiness without rAF, grants both bike items, and lets the selected bike update before mounting. Captures reviewed; no page errors or character fallback in these states.

Music: the complete release-mix pass cleared 27 tracks; the remaining Exodus and Burn mixes then passed targeted reruns. All 29 have measured tempo, audible kicks where applicable, unclipped output, spectral/loudness checks and loop checks. The live sequencer passed routing, day/night switch, pause/resume and stop. Tempo is fitted from detected kick peaks because syncopated percussion fooled the old blind autocorrelation; kick audibility remains separately asserted. Sound quality has been assessed through measurements, not a human listening review.

The clean final build was created separately from test fixtures, and its three-app startup check passed. Publish by copying that clean `site/` tree without `--delete`, preserving files that exist only on gh-pages.

## Evidence and limits

Retained locally (ignored by git): `shots/bm-review/codex-finish/` in the main checkout. Key logs: `suite.log`, `actions-final.log`, `motion-states.log`, `release-apps.log`, `music-release.log`, `music-targeted.log` (Exodus), and `music-burn-final.log`. Earlier failing diagnostic logs are retained too; read the final logs above. Final WAVs are in `music/`; screenshots are in `actions/` and `motion-final/`, with the baseline in `motion-before/`.

No physical iPhone FPS measurement was made. Desktop graphics checks show no rendering-cost regression against the baseline; existing heavy scenes remain above the approximate 450k-triangle phone target (The Line ~528k, Root Society ~462k at the test camera). The broader photorealistic camp/cast/vehicle roadmap is not claimed complete. Princess Papaya's approved ivory/gold look is unchanged.
