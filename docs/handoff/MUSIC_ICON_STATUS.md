> Superseded by the completed [20 November finishing release](BURNING_MAN_FINISH.md). The WIP notes below are retained as history.

# Burning Man: house soundtrack + new icon — status (WIP, Nov 11 2026)

Branch `burning-man/house-music-icon` (local only, not pushed, not merged, not deployed).
Brady asked: "redo the music to be more house music style, not cheesy, a nice house soundtrack; and rebuild the icon".

## How music worked before
- `src/01_audio.js` (`Sound`, shared by all three apps) is a WebAudio step sequencer; every song is a text
  definition (chords, a lead melody, bass/arp/drum patterns) in its `TRACKS` table. Burning Man's tracks
  (`burns_hub`, `burns_w1`… `burns_w13`, `man_boss`, …) were mixed genres with melodic leads (whistle, reed,
  sax, brass, chip-ish) — the "cheesy" part. Worlds 16/17 added theirs via `Sound.addTrack`.
- The game calls `burnsMusic(name)` (`src/40_burns_a_core.js`); the city always played `burns_hub`.
- Bug found: `BW16.has` checked `window.Sound` (never set), so Rhythm Wave always played the Costume Cult song. Fixed.

## What is done (in this commit)
- **`src/41_burns_music.js` (new, Burning Man only — Art Cart does not bundle 41_*)**: `BurnsHouse`, a house
  engine + 29 tracks. Pre-rendered drum one-shots (4 kicks, clap, snare, hats, ride, shaker, congas, bongo, rim,
  crash, impact, reverse swell) made once per AudioContext; one persistent mono bass voice; FM Rhodes keys;
  stereo pads; dub chord stabs; sparse marimba/kalimba/bell/pluck motifs (no chip leads); side-chain pump; 16th
  swing; per-section filter sweeps; risers, snare rolls, drops; intro-once then a 48–64 bar loop per track.
- **`src/01_audio.js` (shared, small additive)**: a track may carry `eng` (its own step engine) plus `xf`/`xfi`
  crossfade times. Every change is gated on those fields, so Super Brady-O World and Art Cart behave exactly as before.
- **`src/40_burns_a_core.js`**: `BURNS_MUSIC_ROUTE.fn` hook in `burnsMusic` (empty in Art Cart).
- **Routing** (`BurnsHouse.ROUTE`): every music name used in 40–42 maps to a house track; unknown names play the
  day groove. City picks day/night itself (`42_burns_ow_city.js` update, by `g.R.night` with hysteresis).
- DJ minigame track list (`41_burns_dj.js`) now uses the house tracks (bpm matches the track).
- Title world music `burns_title`; Skydive gets its own `burns_w14`.
- **Icon**: `tools/make_burns_icon.js` draws the Man (rainbow-neon lattice figure, red heart, arms raised, night
  playa, warm horizon) as SVG and renders `assets/icons/burning-man/` (1024, 512, 192, 180 opaque, maskable 512
  with the Man inside the safe circle). `tools/build.js` (burning-man entry only: `iconDir`) copies them into the
  site and folds the icon bytes into the service-worker cache version. NOTE: the live manifest had `"icons": []`
  and no apple-touch link at all, so the old home-screen icon came from leftover gh-pages files.
  iOS never refreshes an existing home-screen icon: Brady must delete and re-add the web app to see it.
- Docs: `docs/BURNS_GUIDE.md` §14 updated.

## Track plan (BPM, key, mood)
title 120 Fm melodic deep · story 100 Eb beatless · results 118 D sting+groove · cityday 122 Am deep house ·
citynight 124 F#m rolling/driving · line(W1) 120 Gm dusty deep · nocamp(W2) 122 Dm tribal · costume(W3) 124 Db disco-house ·
dome(W4) 116 Ebm slow deep · costco(W5) 120 C jazzy · artcar(W6) 126 Fm tech · sunrise(W7) 122 Ab emotional melodic ·
hell(W8) 126 E phrygian dark tech · deep(W9) 124 Bm dub · pavilion(W10) 124 Cm building · soundcamp(W11) 126 Am tech ·
temple(W12) 70 Bm beatless ambient · workshops(W13) 118 D dorian organic · skydive(W14) 124 Em progressive ·
exodus(W15) 116 E balearic · chase 128 Fm · rhythm(W16) 122 D dorian afro · wonk 108 woozy · root(W17 day) 120 Dm organic ·
rootnight 123 Dm driving · boss 126 Am · man 128 Gm · giant 128 C#m peak · burn 124 D euphoric (8-bar tender intro, then drop).

## Verified so far
- All edited files pass `node --check`; private build OK; burning-man site now ships the 4 icons.
- `tools/burns_music_test.js` partial run (7 tracks, file `shots/bm-review/music-icon/music/partial_test_run.txt`):
  measured tempo within 0.1 BPM of target, peaks -8 dBFS, loudness -18..-19 LUFS (old music measured
  -18.5..-20.5 LUFS through the real Sound path, so SFX balance is kept), every world (21) and all 33 music names resolve.
- Rendering through the REAL `Sound` sequencer offline works (scratch tool `tools/realpath.js` saved in shots folder).

## Half-done / failing / untested
- **Kick detection fails on some tracks** (cityday 44/65, citynight 33/66, line 37/64, nocamp 49/65): the bass is
  too loud/too close to the kick (bass share 49–63%). Next: drop `LV.bass` 0.42 -> ~0.3, maybe more pump on bass,
  then rerun. Highs share is low (~1%), hats could go up a little more.
- Temple/Burn WAVs in the shots folder are from an earlier mix (before the kick fix/rebalance); re-render.
- 22 tracks never measured yet. Full test is slow (~2 min/track: two offline renders + JS analysis). Speed it up
  (shorter seam render, drop the full sort of sample jumps) or run with `--only`.
- Not run yet: apps_test, burns_flow_test, burns_allworlds_test, cart_battle_test; the live part of burns_music_test
  (play/switch/pause/resume) never reached. CPU/voice-count script (`voices.js`) written, not run.
- Nobody has listened. Brady should listen to the WAVs before merging.

## Next steps / commands
```bash
cd <worktree>   # git worktree on branch burning-man/house-music-icon (node_modules symlinked from the main checkout)
BRADY_DIST=/tmp/dist-music node tools/build.js
BRADY_DIST=/tmp/dist-music node tools/burns_music_test.js --only bm_cityday,bm_citynight --wav /tmp/music
BRADY_DIST=/tmp/dist-music node tools/burns_music_test.js --wav /tmp/music          # all tracks, ~1 h now
node tools/make_burns_icon.js --preview /tmp/icon-preview                            # regenerate icons
BRADY_DIST=/tmp/dist-music node tools/apps_test.js; node tools/burns_flow_test.js; node tools/burns_allworlds_test.js; node tools/cart_battle_test.js
```
Then: fix the bass/kick balance, run everything, show Brady the WAVs and the icon previews, merge only with his OK.
