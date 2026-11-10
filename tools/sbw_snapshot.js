// Snapshot test for Super Brady-O World's level builder: every level's areas (tiles, hidden tiles, surfaces,
// spawns, decor, zones, ghosts, springs, locks, beats) hashed per level. Legacy specs must keep building the
// exact same levels while the builder grows (docs/design/LEVEL_OVERHAUL.md §9 Phase 0).
// usage: node tools/sbw_snapshot.js            compare with tools/fixtures/levels_v1.json
//        node tools/sbw_snapshot.js --write    (re)write the fixture
//        node tools/sbw_snapshot.js --expect 1-1,2-2  ids whose change is expected (reported, not failed)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { getLevel, Tour } = require('./load_game')();
const file = path.join(__dirname, 'fixtures', 'levels_v1.json');
const args = process.argv.slice(2);
const write = args.includes('--write');
const oi = args.indexOf('--expect');
const expected = oi >= 0 ? args[oi + 1].split(',') : [];
const digest = lvl => {
  const h = crypto.createHash('sha1');
  for (const a of lvl.areas) {
    h.update(Buffer.from(a.tiles)); h.update(Buffer.from(a.hide || [])); h.update(Buffer.from(a.surf || []));
    h.update(JSON.stringify([a.W, a.H, a.spawns, a.decor, a.zones, a.ghosts, a.springs, a.locks, a.beats, a.contents, a.theme, a.water, a.autoscroll]));
  }
  h.update(JSON.stringify(lvl.start));
  return h.digest('hex').slice(0, 16);
};
const out = {};
for (const id of Tour.allLevelIds()) { const [w, i] = id.split('-').map(Number); out[id] = digest(getLevel(w, i)); }
if (write) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n'); console.log('wrote', Object.keys(out).length, 'level digests to', file); process.exit(0); }
const old = JSON.parse(fs.readFileSync(file, 'utf8'));
let bad = 0;
for (const id in old) {
  if (out[id] === old[id]) continue;
  if (expected.includes(id)) { console.log('changed (expected)', id); continue; }
  console.log('CHANGED', id, old[id], '->', out[id] || 'missing'); bad++;
}
for (const id in out) if (!(id in old)) console.log('new level', id);
console.log(bad ? `${bad} legacy level(s) no longer build the same` : `all ${Object.keys(old).length} snapshot levels build identically`);
process.exit(bad ? 1 : 0);
