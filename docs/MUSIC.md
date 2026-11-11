# Super Brady-O World music (v2 songs)

Pilot, November 2026: the title, the map and Mexico use the newer "v2" song format. The other 13 lands,
Burning Man and Art Cart still use the original format and sound exactly as before (`tools/sbw_audio_test.js`
proves it by rendering every other song through the current engine and the pre-pilot engine).

## The main motif
Scale degrees `5 6 | 1 3 2 1 6 | 5`: two pick-up notes, then a 3+3+2 ("tresillo") skip up to the third and
back down to the fifth below. In C: `G A | C E D C A | G`. Every new song quotes it in its own key, metre
and band (Mexico: 6/8, `A B | D F# E D B | A`; minor songs flatten the sixth).

## Writing a v2 song
A v2 song is an ordinary song definition (see the format comment above `TRACKS` in `src/01_audio.js`) with
`v2: 1` plus:

| field | meaning |
|---|---|
| `lb` | loop point in bars: the bars before it are an intro that plays once |
| `parts` | any number of explicit lines: `{ n, ln, i, v, g, pan, rv, dl, eq, low, tr }` (name, line, instrument, volume, gate, stereo position, reverb / echo send, `[type, Hz, Q, dB]` EQ, `low: 1` = may be dropped when the voice budget is full, transpose) |
| `NOTE:steps:vel` | a third field in any line is the note's velocity (1 = normal) |
| `a2` / `ap` / `pd` strokes | `C` accented down-strum, `u` up-strum, `x` muted chop (plus the old `c` and digits) |
| `mix` | per-channel strip overrides for the pattern layers (`L H M B A P C D E`) |
| `cap` | voice budget (default 32 ringing notes) |
| `dip` | dB of the dip at 3.2 kHz on the song bus that leaves room for sound effects (default -2.5) |

v2 instruments (`INST2`): `tpt`, `tptSoft`, `horn`, `vln`, `vlnShort`, `accord`, `flute`, `pad2`, `marimba`,
`celesta`, and plucked strings rendered by Karplus-Strong: `vihuela`, `guitar`, `uke`, `gtrn` (guitarrón),
`upright`, `harp`, `pizz`. The v2 drum kit is softer and adds folk sounds: `z` zapateado, `q` quijada,
`r` claves, `i` triangle, `u` bubble, `p` water drop (full list above `drumV2`).

Helpers in `src/28_tour_g_story.js` (`TourTune`): `L(bars)`, `rest(n, steps)`, `tr(line, semis)`,
`dia(line, scaleSteps, tonicPc, scale)` (a second voice in thirds/sixths), `bass(chords, template, steps, low)`
(a bass line with approach notes), `seq(steps, [pattern, bars]...)` (arrangement lanes), and
`mapSong({...})` (the map tune in a land's colours).

## Rolling out to another land
1. In the land's music section, rewrite each song as a v2 song that quotes the motif (A/B/bridge form,
   60–90 s loop, intro + `lb`, turnaround with the pick-up into the loop point).
2. Add `tour_map_<cc>: TourTune.mapSong({ lead, lead2, strum, bass, drums, ... })` and
   `map: 'tour_map_<cc>'` to the land's `music`.
3. Balance with the stems tool (each part solo: lead about 1–2 LU under the mix, bass and drums 4–6 LU
   under, strums 8–10 LU under), keep the mix around -22 LUFS, then run `tools/sbw_audio_test.js`.

Note: tour level areas play `spec.music || country.music.level`; a theme's `music` field is not used by the
v2 levels, so per-level variants (canal, cenote, volcano...) need `music:` on the level spec or a builder change.
