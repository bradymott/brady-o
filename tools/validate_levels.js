// Node harness: generate every level and prove it is completable (validator v2, LEVEL_OVERHAUL.md §6.1).
// usage: node tools/validate_levels.js [levelId ...] [--rules] [--jobs N] [--serial]
//   every level: every exit in its spec reached, all 3 postcards, every area reached, pace, power-up budget (v2 levels)
//   --rules: the archetype rules of §0 over the whole game, unmigrated levels, spec problems
// BRADY_SKIP_TOUR=id,vn leaves those country files out (see load_game.js).
const path = require('path'), os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

function checkLevel(G, id) {
  const { getLevel, Validator, Tour } = G;
  const [w, i] = id.split('-').map(Number);
  let lvl;
  try { lvl = getLevel(w, i); } catch (e) { return { id, line: `${id.padEnd(6)} GENERATION ERROR ${e.stack}`, fail: true }; }
  const r = Validator.run(lvl, { earlyExit: true });
  const golds = r.gold.map(g => g ? 'G' : '-').join('');
  const flags = [], warns = [];
  let fail = false, goldMiss = false;
  if (!r.goal) { flags.push('NO GOAL'); fail = true; }
  if (!r.gold.every(Boolean)) { flags.push('gold ' + golds); goldMiss = true; }
  if (lvl.v2) {
    for (const k of r.exitKeys) if (!r.exits[k]) { flags.push(`EXIT ${k.toUpperCase()} UNREACHABLE`); fail = true; }
    r.areasReached.forEach((ok, k) => { if (!ok) { flags.push(`AREA ${lvl.areas[k].aid} UNREACHED`); fail = true; } });
    if (!r.pace.ok) { flags.push(`PACE margin ${r.pace.margin}`); fail = true; }
    if (!r.budget.ok) { flags.push('BUDGET ' + r.budget.errors.join('; ')); fail = true; }
    for (const wn of r.budget.warnings || []) warns.push(wn);
    // the secret-room rule: an area flagged secret, or a fake/hidden-gated pocket holding P2
    if (!lvl.areas.some(a => a.role === 'secret' || a.bonus)) warns.push('no secret area');
    for (const pr of lvl.problems || []) warns.push(pr);
    if (r.guardHit) warns.push('search guard hit');
    // an item block needs an open side for its item to come out of (ItemSpace; tools/sbw_items_test.js follows each one)
    const IS = G.run('ItemSpace'), T = G.T;
    lvl.areas.forEach(A => { for (const k in A.contents || {}) { const [x, y] = k.split(',').map(Number), t = A.tiles[y * A.W + x]; if ((t === T.QBLOCK || t === T.HIDDEN || t === T.QBRICK) && ![[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => IS.open(A, x + dx, y + dy))) { flags.push(`ITEM BLOCK ${A.aid || ''}(${x},${y}) BOXED IN`); fail = true; } } });
  } else {
    if (lvl.secret && lvl.secret.kind === 'secretExit' && !r.secretGoal) flags.push('SECRET EXIT UNREACHABLE');
    if (lvl.warps && lvl.warps.some(x => r.warps.indexOf(x) < 0)) flags.push('WARPS ' + r.warps.join(','));
  }
  const a = lvl.areas[0];
  const ex = Object.keys(r.exits).filter(k => r.exits[k]).join('+');
  const line = `${id.padEnd(6)} ${(lvl.v2 ? (lvl.design.arch || 'v2') : lvl.type).padEnd(8)} W=${String(a.W).padEnd(4)} H=${String(a.H).padEnd(3)} areas=${lvl.areas.length} exits=${(ex || '-').padEnd(11)} nodes=${String(r.nodes).padEnd(6)} sims=${String(r.sims).padEnd(6)} ${r.ms}ms ${flags.join(' | ')}${warns.length ? '  (warn: ' + warns.join('; ') + ')' : ''}`;
  return { id, line, fail, goldMiss };
}

/* §0: no archetype twice in a country; no archetype more than 4 times in the game; at most 5 vertical climbs
   (tower + rise); every slot-1 archetype different; every country's sequence unique. LAIR is exempt. */
function rules(G) {
  const { Tour } = G, errors = [], warnings = [];
  const count = {}, openers = {}, seqs = {};
  for (const w of Tour.worldList()) {
    const C = Tour.byWorld[w], seen = {};
    const seq = [];
    C.levels.forEach((L, k) => {
      const id = w + '-' + (k + 1);
      if (!L.arch) { warnings.push(`${id} unmigrated (no arch)`); return; }
      seq.push(L.arch);
      if (L.arch === 'lair') return;
      if (seen[L.arch]) errors.push(`${id}: archetype ${L.arch} twice in ${C.id} (also ${seen[L.arch]})`);
      seen[L.arch] = id;
      count[L.arch] = (count[L.arch] || 0) + 1;
      if (k === 0) { if (openers[L.arch]) errors.push(`${id}: opener ${L.arch} already opens ${openers[L.arch]}`); openers[L.arch] = id; }
    });
    if (seq.length === C.levels.length) { const key = seq.join(','); if (seqs[key]) errors.push(`${C.id}: same archetype sequence as ${seqs[key]}`); seqs[key] = C.id; }
    if (C.levels.length > C.mainCount && C.levels.slice(0, C.mainCount).some(L => L.secret)) errors.push(`${C.id}: secret levels must come after the main ones`);
  }
  for (const a in count) if (count[a] > 4) errors.push(`archetype ${a} used ${count[a]} times (max 4)`);
  const climbs = (count.tower || 0) + (count.rise || 0);
  if (climbs > 5) errors.push(`${climbs} vertical climbs (max 5)`);
  for (const p of Tour.problems) errors.push(p);
  return { errors, warnings };
}

if (!isMainThread) {
  const G = require('./load_game')();
  const out = workerData.ids.map(id => checkLevel(G, id));
  parentPort.postMessage(out);
} else {
  const args = process.argv.slice(2);
  const ji = args.indexOf('--jobs');
  const jobs = args.includes('--serial') ? 1 : ji >= 0 ? +args[ji + 1] : Math.max(1, Math.min(6, os.cpus().length - 2));
  const only = args.filter((a, k) => !a.startsWith('--') && !(ji >= 0 && k === ji + 1));
  const G = require('./load_game')();
  const ids = G.Tour.allLevelIds().filter(id => !only.length || only.includes(id));
  const t0 = Date.now();
  const finish = results => {
    results.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    let fails = 0, goldMiss = 0;
    for (const r of results) { console.log(r.line); if (r.fail) fails++; if (r.goldMiss) goldMiss++; }
    let ruleErr = 0;
    if (args.includes('--rules')) {
      const R = rules(G);
      for (const e of R.errors) console.log('RULE ' + e);
      for (const wn of R.warnings) console.log('rule warning: ' + wn);
      ruleErr = R.errors.length;
      console.log(`rules: ${R.errors.length} errors, ${R.warnings.length} warnings`);
    }
    console.log(`\n${results.length} levels, ${fails} unfinishable, ${goldMiss} with unreachable gold, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    process.exit(fails || goldMiss || ruleErr ? 1 : 0);
  };
  if (jobs <= 1 || ids.length < 4) finish(ids.map(id => checkLevel(G, id)));
  else {
    // the slow levels are spread round-robin over the workers
    const parts = Array.from({ length: jobs }, () => []);
    ids.forEach((id, k) => parts[k % jobs].push(id));
    let left = parts.filter(p => p.length).length; const all = [];
    for (const p of parts) if (p.length) {
      const wk = new Worker(__filename, { workerData: { ids: p } });
      wk.on('message', m => { all.push(...m); if (--left === 0) finish(all); });
      wk.on('error', e => { console.log('worker error', e); process.exit(1); });
    }
  }
}
