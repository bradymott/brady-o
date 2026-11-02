// Node harness: generate every level and prove it is completable.
// usage: node tools/validate_levels.js [levelId ...]
const { WORLDS, ALL_WORLDS, getLevel, Validator } = require('./load_game')();
const only = process.argv.slice(2);
let fails = 0, goldMiss = 0, total = 0;
const t0 = Date.now();
for (const w of ALL_WORLDS) {
  const n = WORLDS[w].plan.length;
  for (let i = 1; i <= n; i++) {
    const id = w + '-' + i;
    if (only.length && only.indexOf(id) < 0) continue;
    total++;
    let lvl;
    try { lvl = getLevel(w, i); } catch (e) { console.log(id, 'GENERATION ERROR', e.stack); fails++; continue; }
    const r = Validator.run(lvl, { earlyExit: true });
    const golds = r.gold.map(g => g ? 'G' : '-').join('');
    const flags = [];
    if (!r.goal) { flags.push('NO GOAL'); fails++; }
    if (!r.gold.every(Boolean)) { flags.push('gold ' + golds); goldMiss++; }
    if (lvl.secret && lvl.secret.kind === 'secretExit' && !r.secretGoal) flags.push('SECRET EXIT UNREACHABLE');
    if (lvl.warps && lvl.warps.some(x => r.warps.indexOf(x) < 0)) flags.push('WARPS ' + r.warps.join(','));
    const a = lvl.areas[0];
    console.log(`${id.padEnd(6)} ${lvl.type.padEnd(7)} W=${String(a.W).padEnd(4)} H=${String(a.H).padEnd(3)} nodes=${String(r.nodes).padEnd(5)} sims=${String(r.sims).padEnd(6)} ${r.ms}ms ${flags.join(' | ')}`);
  }
}
console.log(`\n${total} levels, ${fails} unfinishable, ${goldMiss} with unreachable gold, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
