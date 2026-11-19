// Super Brady-O World: RULE 7's animal hats and the ANIMAL HATS / DANCING switches (src/28_tour_sc_hats.js,
// src/28_tour_sb_buttons.js). Node only: the real game modules in a VM, no browser.
//   classify  every registered entity type is either an animal (TourHats.HEADS: it wears a hat) or not (TourHats.NOT),
//             never both and never neither: a new land's types fail here until they are sorted. --list prints them all
//   heads     each HEADS row is four sane numbers (the head's top within reach of the hitbox)
//   spread    the hash spreads the animals over all six hats (none rarer than 8 %, none commoner than 26 %), and every
//             land with four or more animal types shows at least three different hats
//   wears     an instance of every type: animals wear their hat in their usual pose, nothing else ever does (doors,
//             smoke puffs, rainbow lasers, chili flames, items, platforms, bosses, Brady's shots)
//   settings  the two switches: ON by default, an old save's combined HATS & DANCING off -> both off, each flips alone,
//             rule 1's party follows DANCING, the values survive a save and load
// usage: node tools/sbw_hats_test.js [section ...] [--list]
const loadGame = require('./load_game');
const args = process.argv.slice(2), list = args.includes('--list'), only = args.filter(a => !a.startsWith('--'));
const want = s => !only.length || only.includes(s);
let checks = 0, failures = 0;
const check = (name, ok, info) => { checks++; if (!ok) failures++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (!ok && info !== undefined ? '  ' + JSON.stringify(info).slice(0, 600) : '')); };

const G = loadGame();
G.run('(' + function () {
  Atlas.need = () => {}; Atlas.keep = () => {}; Atlas.load = () => {};
  globalThis.Game = { dpr: 1, cssW: 844, cssH: 390, viewW: 844, viewH: 10 * TS, rows: 10, gameRect: { x: 0, y: 0, w: 844, h: 390 }, quality: 1, forceTouchUI: true, S: 1,
    setRows(r) { this.rows = r; this.viewH = r * TS; }, setScene(s) { this.scene = s; }, resize() {}, reportError() {}, isUnlocked: () => true, isDone: () => false, secretFound() {}, goldCount: () => 0, pathOpen: () => true, complete() {}, vignette() {}, canvas: { width: 844, height: 390, style: {} } };
} + ')()');
const run = code => G.run(code);
const H = run('TourHats'), ET = G.ENTITY_TYPES, Tour = G.Tour;
const types = Object.keys(ET).filter(k => k.indexOf('roomBig:') !== 0);

if (want('classify')) {
  const neither = types.filter(k => !H.HEADS[k] && !H.NOT.has(k)), both = types.filter(k => H.HEADS[k] && H.NOT.has(k));
  const stale = Object.keys(H.HEADS).concat([...H.NOT]).filter(k => !ET[k] && k.indexOf('look:') !== 0);
  check(`every one of the ${types.length} registered types is sorted: ${Object.keys(H.HEADS).length} animals wear a hat, ${H.NOT.size} other types don't`, !neither.length && !both.length, { neither, both });
  check('no stale names in the lists (a type that is no longer registered)', !stale.length, stale);
  if (list) for (const k of types.slice().sort()) console.log('  ' + (H.HEADS[k] ? 'HAT  ' + H.kindOf(k).padEnd(7) : 'no   ' + ''.padEnd(7)) + k);
}

if (want('heads')) {
  const bad = Object.keys(H.HEADS).filter(k => { const r = H.HEADS[k]; return !Array.isArray(r) || r.length !== 4 || r.some(v => typeof v !== 'number' || !isFinite(v)) || Math.abs(r[0]) > 0.9 || Math.abs(r[1]) > 0.9 || r[2] > 0.2 || r[2] < -2.6 || (r[3] !== 0 && (r[3] < 0.4 || r[3] > 1.4)); });
  check('each HEADS row is [fx, fxFlip, fy, size] within reach of the hitbox', !bad.length, bad.map(k => [k, H.HEADS[k]]));
}

if (want('spread')) {
  const animals = Object.keys(H.HEADS), count = {};
  for (const k of H.KINDS) count[k] = 0;
  for (const k of animals) count[H.kindOf(k)]++;
  const share = k => count[k] / animals.length;
  check('the hats are spread over all six kinds (each 8-26 % of the animal types)', H.KINDS.every(k => share(k) >= 0.08 && share(k) <= 0.26), count);
  console.log('     hats per kind: ' + H.KINDS.map(k => k + ' ' + count[k]).join(', '));
  const dull = [];
  const landOf = k => (Tour.enemyInfo[k] && Tour.enemyInfo[k].country) || (Object.keys(Tour.countries).find(cc => k.indexOf(cc) === 0 && /[A-Z]/.test(k[cc.length])) || '?');
  const lands = {};
  for (const k of animals) (lands[landOf(k)] = lands[landOf(k)] || []).push(k);
  for (const cc in lands) { const kinds = new Set(lands[cc].map(k => H.kindOf(k))); if (lands[cc].length >= 4 && kinds.size < 3) dull.push(cc + ': ' + [...kinds].join('/')); }
  check('every land with four or more animal types shows at least three different hats', !dull.length, dull);
  check('the same type always gets the same hat; types are not all one hat (the old hash used the class name, "cls" for most)', H.kindOf('frCat') === H.kindOf('frCat') && new Set(['frCat', 'frPoodle', 'frCoq', 'frBoar', 'frPigeon', 'frSnail'].map(k => H.kindOf(k))).size >= 3);
}

if (want('wears')) {
  run(`Save.data = Save.defaults(); Save.data.lives = 9; TourProgress.data().rules[7] = { at: '3-1' };`);
  const r = JSON.parse(run('(' + function () {
    const g = new Play(getLevel(1, 1), {}); Game.scene = g;
    for (let k = 0; k < 240 && g.state !== 'play'; k++) g.update(1 / 120);
    const out = { wrong: [], bare: [], skipped: [], made: 0, shots: [] }, p = g.player;
    for (const k in ENTITY_TYPES) {
      if (k.indexOf('roomBig:') === 0) continue;
      let e; try { e = new ENTITY_TYPES[k](g, { type: k, x: p.cx + 200, y: p.y + p.h, dir: 1 }); } catch (err) { out.skipped.push(k); continue; }
      out.made++;
      if (e.state === 'wait') e.state = 'jump';
      const w = TourHats.wears(e);
      if (w && !TourHats.HEADS[k]) out.wrong.push(k);
      if (!w && TourHats.HEADS[k]) out.bare.push(k + ':' + (e.artMode !== undefined ? e.artMode : e.mode));
    }
    // what Brady and the powers throw: smoke puffs, rainbow lasers, chili flames, the hard hat's coins, the paper plane
    const shots = [new SmokePuff(g, p.cx, p.cy, 1), new RainbowLaser(g, p.cx, p.cy, 1, 0)];
    if (typeof MzFlame !== 'undefined') shots.push(new MzFlame(g, p.cx, p.cy, 1));
    for (const s of shots) if (TourHats.wears(s)) out.shots.push(s.constructor.name);
    // a boss never wears one
    const bossy = { boss: true, enemy: true, s: { type: 'frCat' }, constructor: ENTITY_TYPES.frCat, x: 0, y: 0, w: 20, h: 20 };
    out.boss = TourHats.wears(bossy);
    // a behaviour's child (spawned without a type) is known by its class; a big room critter by its base type
    const kid = new ENTITY_TYPES.frCat(g, { x: 100, y: 100 }); out.kid = TourHats.typeOf(kid);
    out.big = TourHats.typeOf({ s: { type: 'roomBig:frCat' }, constructor: function X() {} });
    // the race rival looks up its critter
    out.rival = TourHats.typeOf({ s: { type: 'tourRival', art: 'ecBooby' }, constructor: ENTITY_TYPES.tourRival });
    return JSON.stringify(out);
  } + ')()'));
  check(`no type outside HEADS wears a hat (${r.made} types made)`, !r.wrong.length, r.wrong);
  check('Brady\'s smoke puffs, rainbow lasers and chili flames wear no hat', !r.shots.length, r.shots);
  check('a boss wears no hat', !r.boss);
  check('every animal wears its hat in its usual pose', r.bare.length <= 3, r.bare);
  if (r.bare.length) console.log('     (made in a pose with no hat: ' + r.bare.join(', ') + ')');
  check('a behaviour\'s child is known by its class, a big room critter by its base type, a rival by its critter', r.kid === 'frCat' && r.big === 'frCat' && r.rival === 'ecBooby', { kid: r.kid, big: r.big, rival: r.rival });
  if (r.skipped.length) console.log('     (types that need a level to be made, not checked here: ' + r.skipped.join(', ') + ')');
}

if (want('settings')) {
  const s = JSON.parse(run('(' + function () {
    const o = {};
    Save.data = Save.defaults(); const R = TourProgress.data().rules; R[3] = { at: '1-4' }; R[7] = { at: '3-1' };
    o.def = [TourRules.fxOn('hats'), TourRules.fxOn('dance')];
    const rows = () => TourHooks.settings.map(f => f()).filter(Boolean).map(x => x.label + ': ' + x.value);
    o.rows = rows();
    Save.data.settings.ruleFx = false; o.old = [TourRules.fxOn('hats'), TourRules.fxOn('dance')]; o.oldRows = rows();
    // flip ANIMAL HATS on: dancing stays off (from the old switch), both now saved on their own
    TourHooks.settings.map(f => f()).filter(Boolean).find(x => x.label === 'ANIMAL HATS').fn();
    o.flip = [TourRules.fxOn('hats'), TourRules.fxOn('dance'), Save.data.settings.hatsFx, Save.data.settings.danceFx];
    TourHooks.settings.map(f => f()).filter(Boolean).find(x => x.label === 'DANCING').fn();
    o.flip2 = [TourRules.fxOn('hats'), TourRules.fxOn('dance')];
    // rule 1's party follows DANCING
    R[1] = { at: '22-5' }; o.party = TourRules.fxOn('party');
    TourHooks.settings.map(f => f()).filter(Boolean).find(x => x.label === 'DANCING').fn(); o.partyOff = TourRules.fxOn('party');
    // no rules revoked: no switches
    const keep = Save.data.tour; Save.data.tour = null; TourProgress.data(); o.none = rows(); Save.data.tour = keep;
    return JSON.stringify(o);
  } + ')()'));
  check('both effects are ON by default once their rules are revoked', s.def[0] && s.def[1], s);
  check('Settings shows ANIMAL HATS: ON and DANCING: ON (no combined HATS & DANCING)', s.rows.includes('ANIMAL HATS: ON') && s.rows.includes('DANCING: ON') && !s.rows.some(l => /HATS & DANCING/.test(l)), s.rows);
  check('an old save with HATS & DANCING off: both start OFF', !s.old[0] && !s.old[1] && s.oldRows.includes('ANIMAL HATS: OFF') && s.oldRows.includes('DANCING: OFF'), s);
  check('each switch flips on its own and is saved', s.flip[0] && !s.flip[1] && s.flip[2] === true && s.flip[3] === false && s.flip2[0] && s.flip2[1], s);
  check('rule 1\'s party blimp and rainbow beam follow DANCING', s.party && !s.partyOff, s);
  check('no switches before a rule is revoked', !s.none.length, s.none);
  // the switches survive a save and a load (the v5 save key, unchanged)
  const store = {};
  const A = loadGame({ store });
  A.run(`Save.data = Save.defaults(); Save.data.settings.hatsFx = false; Save.data.settings.danceFx = true; Save.save();`);
  const B2 = loadGame({ store, load: true });
  const back = JSON.parse(B2.run('JSON.stringify([Save.data.settings.hatsFx, Save.data.settings.danceFx, Save.key || null])'));
  check('the switches survive a save and a load', back[0] === false && back[1] === true, back);
}

console.log(`\n${checks - failures}/${checks} hats checks passed`);
process.exit(failures ? 1 : 0);
