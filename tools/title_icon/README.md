Helper scripts for the Super Brady-O World title screen and icon (src/28_tour_gt_title.js). Run from the repo root
with BRADY_DIST=<private build folder> after `node tools/build.js`. Paths inside runall.sh point at the original
agent's scratch folder: edit them before use.
- shots.js <outdir> <prefix> <times,...> [--save] [--tap] [--calm]  title frames at 844x390@3, 390x844@3, 568x320@2 (VPS=land,port,small); a negative time = tap the CTA (tap point is W/2, 0.8H: on 568x320 that hits LOOK, fix it to the CTA centre)
- perf.js <dist> [label]   mean ms per title frame, headless (not an iPhone)
- probe.js <out.png> <N> <code>   run drawing code in the built world app (e.g. "window.__sbwIcon(x, N, false, 'head')")
- iconsheet2.js <out.png> <dir> <variants>   native renders <dir>/<v>-<N>.png at 180/120/60/40 in the iOS mask on light/dark
- masksheet.js, iconsheet.js, sheet.js   mask views, quick icon sheet, contact sheet
- runall.sh   the remaining suites one by one
