// Node harness: generate every level and prove it is completable (validator v2, LEVEL_OVERHAUL.md §6.1).
// usage: node tools/validate_levels.js [levelId ...] [--rules] [--release] [--jobs N] [--serial]
//   every level: every exit in its spec reached, all 3 postcards, every area reached, pace, power-up budget (v2 levels)
//   secrets (docs/design/SECRETS_CONTRACTS.md): warp exits and buttons reached, seams and backstage areas
//   (the way back, the Under-Stage pit), new room types (the way out); a level with `needs` is checked twice, with
//   no rule revoked (dormant exits not required) and with every rule revoked ('rules on')
//   --rules: the archetype rules of §0 over the whole game, unmigrated levels, spec problems, the secrets rules
//   --release: the secrets rollout warnings (a warp per land, room-type variety) become errors
// BRADY_SKIP_TOUR=id,vn leaves those country files out (see load_game.js).
const path = require('path'), os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

function checkLevel(G, id) {
  const { getLevel, Validator, Tour } = G;
  const [w, i] = id.split('-').map(Number);
  let lvl;
  try { lvl = getLevel(w, i); } catch (e) { return { id, line: `${id.padEnd(6)} GENERATION ERROR ${e.stack}`, fail: true }; }
  // Pupo (src/28_tour_pc_pupoval.js): a level with a Nap Box is searched without him, then riding him from each box reached
  const PV = G.run("typeof PupoVal !== 'undefined' ? PupoVal : null"), pupo = PV && PV.has(lvl);
  const r = pupo ? PV.run(lvl, { earlyExit: true }) : Validator.run(lvl, { earlyExit: true });
  const info = secretsInfo(G, lvl);
  const golds = r.gold.map(g => g ? 'G' : '-').join('');
  const flags = [], warns = [];
  let fail = false, goldMiss = false;
  if (!r.goal) { flags.push('NO GOAL'); fail = true; }
  if (!r.gold.every(Boolean)) { flags.push('gold ' + golds); goldMiss = true; }
  if (lvl.v2) {
    for (const k of r.exitKeys) if (!r.exits[k] && !(lvl.exits[k] && lvl.exits[k].via === 'warp')) { flags.push(`EXIT ${k.toUpperCase()} UNREACHABLE`); fail = true; }   // warps: WARP <key> below
    r.areasReached.forEach((ok, k) => { if (!ok) { flags.push(`AREA ${lvl.areas[k].aid} UNREACHED`); fail = true; } });
    if (!r.pace.ok) { flags.push(`PACE margin ${r.pace.margin}`); fail = true; }
    if (!r.budget.ok) { flags.push('BUDGET ' + r.budget.errors.join('; ')); fail = true; }
    for (const wn of r.budget.warnings || []) warns.push(wn);
    // the secret-room rule: an area flagged secret, or a fake/hidden-gated pocket holding P2
    if (!lvl.areas.some(a => a.role === 'secret' || a.bonus)) warns.push('no secret area');
    for (const pr of lvl.problems || []) warns.push(pr);
    if (r.guardHit) warns.push('search guard hit');
    if (secretChecks(G, lvl, r, flags, warns)) fail = true;
    if (PV) { const pc = PV.checks(lvl, r); for (const e of pc.errors) { flags.push(e); fail = true; } for (const w of pc.warnings) warns.push(w); }
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
  return { id, line, fail, goldMiss, info };
}

/* ---------- secrets (docs/design/SECRETS_WARPS_SWITCHES.md §5.6) ---------- */
// what --rules needs from a built level: its buttons, warp spawns, room types
function secretsInfo(G, lvl) {
  const warps = [], rooms = [];
  lvl.areas.forEach(a => {
    for (const s of a.spawns) if (s.type === 'warp') warps.push({ exit: s.exit || 'warp', needs: s.needs || null });
    if (a.role === 'secret' && a.gen === 'room' || a.roomType) rooms.push(a.roomType || 'pantry');
  });
  return { buttons: lvl.buttons || [], warps, rooms };
}
// returns true when the level fails; adds its flags and warnings
function secretChecks(G, lvl, r, flags, warns) {
  const { Validator } = G;
  let fail = false;
  const TN = G.run('TourNeeds');
  const warpKeys = Object.keys(lvl.exits || {}).filter(k => lvl.exits[k] && lvl.exits[k].via === 'warp');
  const check = (res, tag) => {
    for (const k of warpKeys) if (res.exitKeys.includes(k) && !res.exits[k]) { flags.push(`WARP ${k.toUpperCase()} UNREACHABLE${tag}`); fail = true; }
    for (const n of res.buttonRules || []) if (!res.buttons[n]) { flags.push(`BUTTON ${n} UNREACHABLE${tag}`); fail = true; }
  };
  check(r, '');
  // a level with needs: the "rules on" pass (every rule revoked) must reach every exit, postcard, area and button too
  if (TN.inLevel(lvl)) {
    const PV = G.run("typeof PupoVal !== 'undefined' ? PupoVal : null");
    const r2 = (PV && PV.has(lvl) ? PV : Validator).run(lvl, { earlyExit: true, rules: 'all' });
    for (const k of r2.exitKeys) if (!r2.exits[k] && !warpKeys.includes(k)) { flags.push(`EXIT ${k.toUpperCase()} UNREACHABLE (rules on)`); fail = true; }
    if (!r2.gold.every(Boolean)) { flags.push('gold ' + r2.gold.map(g => g ? 'G' : '-').join('') + ' (rules on)'); fail = true; }
    r2.areasReached.forEach((ok, k) => { if (!ok) { flags.push(`AREA ${lvl.areas[k].aid} UNREACHED (rules on)`); fail = true; } });
    check(r2, ' (rules on)');
  }
  // seams: build rules, then the way back from every area a seam leads into
  const SR = Validator.secretRules(lvl);
  for (const e of SR.errors) { flags.push(e); fail = true; }
  for (const w of SR.warnings) warns.push(w);
  const TS = G.TS, TSe = G.run('TourSeams'), checked = new Set();
  lvl.areas.forEach((a, k) => {
    for (const s of a.seams || []) {
      if (!s.target || s.target.area === k || checked.has(s.target.area)) continue;
      checked.add(s.target.area);
      const rules = s.needs ? 'all' : undefined;
      if (!Validator.escape(lvl, s.target.area, [k], { rules })) { flags.push(`SEAM ${TSe.key(a, s)} HAS NO WAY BACK`); fail = true; }
    }
  });
  // new room types: Brady can always leave the way he came (no soft-locks, §2)
  lvl.areas.forEach((a, k) => {
    if (!a.roomType || a.roomType === 'pantry' || checked.has(k)) return;
    if (!Validator.escape(lvl, k, null, { rules: 'all' })) { flags.push(`ROOM ${a.aid} (${a.roomType}) HAS NO WAY OUT`); fail = true; }
  });
  // warp exits need a label (at most 14 characters, shown on the warp)
  for (const k of warpKeys) { const lb = lvl.exits[k].label; if (!lb || String(lb).length > 14) { flags.push(`WARP ${k.toUpperCase()} LABEL ${lb ? 'TOO LONG' : 'MISSING'}`); fail = true; } }
  for (const k in lvl.exits || {}) if (lvl.exits[k] && lvl.exits[k].needs && !TN.valid(lvl.exits[k].needs)) { flags.push(`EXIT ${k.toUpperCase()} BAD NEEDS ${JSON.stringify(lvl.exits[k].needs)}`); fail = true; }
  // every warp spawn names an exit the level has
  for (const a of lvl.areas) for (const s of a.spawns) if (s.type === 'warp' && !(lvl.exits || {})[s.exit || 'warp']) { flags.push(`WARP IN ${a.aid}: NO EXIT '${s.exit || 'warp'}'`); fail = true; }
  // per-area pace (Hourglass Well and friends): named, so a miss says where
  for (const pa of (r.pace && r.pace.areas) || []) if (!pa.ok) flags.push(`PACE ${pa.aid} ${pa.margin != null ? 'margin ' + pa.margin : pa.why}`);
  return fail;
}
// --rules: the secrets rules over the whole game (the results carry each level's secretsInfo)
function secretRules(G, results, release) {
  const { Tour } = G, errors = [], warnings = [];
  const byId = {}; for (const r of results) byId[r.id] = r.info || { buttons: [], warps: [], rooms: [] };
  const later = release ? errors : warnings;
  // every rule's button placed exactly once; every rule's `opens` target exists (TOUR_RULES comes with WP-5)
  const RULES = G.run("typeof TOUR_RULES !== 'undefined' ? TOUR_RULES : null");
  const placed = {};
  for (const id in byId) for (const n of byId[id].buttons) (placed[n] = placed[n] || []).push(id);
  if (RULES) {
    for (const n in RULES) {
      const at = placed[n] || [];
      if (at.length !== 1) errors.push(`rule ${n}: its button is placed ${at.length} times (${at.join(', ') || 'nowhere'}), needs exactly 1`);
      for (const tg of [].concat(RULES[n].opens || [])) {
        const t = Tour.target(tg, null);
        const ok = t && (t.kind === 'level' || t.kind === 'node' ? !!Tour.specOf(t.id) : t.kind === 'land' || t.kind === 'flight' ? !!Tour.countries[t.id] : t.kind === 'house' ? true : false);
        if (!ok) errors.push(`rule ${n}: opens '${tg}', which does not exist`);
      }
    }
  }
  for (const n in placed) if (!RULES || !RULES[n]) errors.push(`a button for rule ${n} (${placed[n].join(', ')}) but no such rule in TOUR_RULES`);
  // a warp in every land; room-type variety (§2.9): at least 3 types per land, no new type more than twice
  const noWarp = [], dull = [];
  for (const w of Tour.worldList()) {
    const C = Tour.byWorld[w], ids = C.levels.map((L, k) => w + '-' + (k + 1)).filter(id => byId[id]);
    if (!ids.length) continue;
    const specWarp = C.levels.some(L => Object.keys(L.exits || {}).some(k => L.exits[k] && L.exits[k].via === 'warp'));
    if (!specWarp) noWarp.push(C.id);
    const types = {}; for (const id of ids) for (const t of byId[id].rooms) types[t] = (types[t] || 0) + 1;
    if (Object.keys(types).length < 3) dull.push(`${C.id} (${Object.keys(types).join('/') || 'none'})`);
    for (const t in types) if (t !== 'pantry' && types[t] > 2) later.push(`${C.id}: room type ${t} used ${types[t]} times (max 2, §2.9)`);
  }
  if (noWarp.length) later.push(`lands without a warp (§3.5): ${noWarp.join(', ')}`);
  if (dull.length) later.push(`lands with fewer than 3 secret-room types (§2.9): ${dull.join(', ')}`);
  return { errors, warnings };
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
      if (L.arch === 'lair' || L.arch === 'bonus') return;   // bonus levels (secrets §4.4) are exempt like LAIR
      if (seen[L.arch]) errors.push(`${id}: archetype ${L.arch} twice in ${C.id} (also ${seen[L.arch]})`);
      seen[L.arch] = id;
      count[L.arch] = (count[L.arch] || 0) + 1;
      if (k === 0) { if (openers[L.arch]) errors.push(`${id}: opener ${L.arch} already opens ${openers[L.arch]}`); openers[L.arch] = id; }
    });
    // Pupo (PUPO.md §4): one Pupo level per land, at most two with the helpers
    const pl = C.levels.filter(L => L.pupo === 'level').length, ph = C.levels.filter(L => L.pupo === 'helper').length;
    if (pl > 1) warnings.push(`${C.id}: ${pl} Pupo levels (one per land)`);
    if (pl + ph > 2) warnings.push(`${C.id}: ${pl + ph} Pupo and helper levels (at most two)`);
    if (seq.length === C.levels.length) { const key = seq.join(','); if (seqs[key]) errors.push(`${C.id}: same archetype sequence as ${seqs[key]}`); seqs[key] = C.id; }
    if (C.levels.length > C.mainCount && C.levels.slice(0, C.mainCount).some(L => L.secret)) errors.push(`${C.id}: secret levels must come after the main ones`);
  }
  for (const a in count) if (count[a] > 4) errors.push(`archetype ${a} used ${count[a]} times (max 4)`);
  const climbs = (count.tower || 0) + (count.rise || 0);
  if (climbs > 5) errors.push(`${climbs} vertical climbs (max 5)`);
  for (const p of Tour.problems) errors.push(p);
  return { errors, warnings };
}

// tools/sbw_contract_test.js uses the per-level and whole-game secrets checks on its fixtures
module.exports = { checkLevel, secretChecks, secretRules, secretsInfo };
if (!isMainThread) {
  const G = require('./load_game')();
  const out = workerData.ids.map(id => checkLevel(G, id));
  parentPort.postMessage(out);
} else if (require.main === module) {
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
      const R = rules(G), SR = secretRules(G, results, args.includes('--release'));
      R.errors.push(...SR.errors); R.warnings.push(...SR.warnings);
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
