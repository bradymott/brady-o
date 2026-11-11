# Music pilot helper scripts (moved from the scratchpad; run from a work folder, see each file's header)
render.js (offline render via OfflineAudioContext), render_set.js / render_final.js (WAV renders), collect_defs.js
(dump song defs from a src tree), analyze.js (LUFS/true peak/width/bands/spectrograms, needs ffmpeg), stems.js
(per-layer loudness), score.js (prints scores + stats), compare.js (old vs new engine sample diff), cpu.js (real-time
scheduler cost, chromium/webkit), seam.js / spikes.js (click checks), tiny.js, kscost.js, ingame.js (title/map/level
songs in the real app), make_page.js (A/B page). Paths inside assume a work folder with before/ after/ engine_before/
(engine_before/01_audio.js = `git show 89bbc8b:src/01_audio.js`) and require playwright from /Users/bradymott/brady-o/node_modules.
