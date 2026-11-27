// Regression check for every land's own prize box (src/29_tour_zz_boxes.js): runs tools/sbw_boxes_shots.js --checks
// (no pictures). Every land resolves to a box with 4 idle frames, 8 hit frames and an empty state; in every land a real
// box hit from below by Brady's jump gives its prize, turns USED, plays the hit frames and then draws as that land's
// empty box; zero page errors. Browser tool: take the shared test lock first.
// usage: BRADY_DIST=<dist> node tools/sbw_boxes_test.js
const { spawnSync } = require('child_process'), path = require('path'), os = require('os'), fs = require('fs');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sbw-boxes-'));
const r = spawnSync(process.execPath, [path.join(__dirname, 'sbw_boxes_shots.js'), dir, '--checks'], { stdio: 'inherit', env: process.env });
fs.rmSync(dir, { recursive: true, force: true });
process.exit(r.status == null ? 1 : r.status);
