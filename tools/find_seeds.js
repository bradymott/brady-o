// For every level that fails validation, search for an alternate generator
// seed (attempt number) that passes, and write src/08b_seeds.js.
// usage: node tools/find_seeds.js [levelIds...]   (default: all levels)
const fs = require('fs'), path = require('path');
const { WORLDS, ALL_WORLDS, generateLevel, Validator } = require('./load_game')({ noSeeds: true });
const seedFile = path.join(__dirname, '..', 'src', '08b_seeds.js');
let seeds = {};
if (fs.existsSync(seedFile)) { const m = fs.readFileSync(seedFile, 'utf8').match(/LEVEL_SEEDS = (\{[\s\S]*?\});/); if (m) seeds = JSON.parse(m[1]); }
const only = process.argv.slice(2);
// forget seeds for levels that no longer exist
const ids = new Set(); for (const w of ALL_WORLDS) for (let i = 1; i <= WORLDS[w].plan.length; i++) ids.add(w + '-' + i);
for (const k of Object.keys(seeds)) if (!ids.has(k)) delete seeds[k];
const pass = (lvl, r) => r.goal && r.gold.every(Boolean)
  && (!lvl.secret || lvl.secret.kind !== 'secretExit' || r.secretGoal)
  && (!lvl.warps || lvl.warps.every(x => r.warps.indexOf(x) >= 0));
for (const w of ALL_WORLDS) for (let i = 1; i <= WORLDS[w].plan.length; i++) {
  const id = w + '-' + i;
  if (only.length && only.indexOf(id) < 0) continue;
  let found = null;
  const startAt = seeds[id] || 0;
  for (let a = startAt; a < startAt + 40; a++) {
    const lvl = generateLevel(w, i, a);
    const r = Validator.run(lvl, { earlyExit: true });
    if (pass(lvl, r)) { found = a; break; }
    console.log(id, 'attempt', a, 'fails', r.goal ? '' : 'NO GOAL', r.gold.map(g => g ? 'G' : '-').join(''));
  }
  if (found === null) { console.log(id, 'NO PASSING SEED FOUND'); continue; }
  if (found) seeds[id] = found; else delete seeds[id];
  if (found !== startAt) console.log(id, '->', found);
}
fs.writeFileSync(seedFile, `/* Validated generator seeds (written by tools/find_seeds.js). */\nconst LEVEL_SEEDS = ${JSON.stringify(seeds)};\n`);
console.log('seeds:', JSON.stringify(seeds));
