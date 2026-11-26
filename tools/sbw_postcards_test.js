// The postcard rewards (docs/design/POSTCARD_REWARDS.md, src/29_tour_zz_postcards.js), in Node (no browser, no lock):
//   - a level: the first clear with all three postcards gives one life and the results celebration; a second clear
//     gives nothing; two cards are not enough
//   - a land: its last postcard queues a care package (the next perk on the track); past the track, +3 lives
//   - an old save (no Save.data.postcards) with postcards already found: everything granted on load, quietly, one
//     summary card; a reload grants nothing twice
//   - every postcard: Save.data.allPostcards, TourPostcards.all(), the story and the Golden Cape
//   - the album's counts agree with TourProgress.totals() (the map, the title chip and the credits use those)
// usage: node tools/sbw_postcards_test.js [-v]
const loadGame = require('./load_game');
const verbose = process.argv.includes('-v');
let passes = 0, failures = 0;
const check = (name, ok, info) => { if (!ok || verbose) console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); if (ok) passes++; else failures++; };

function boot(opts) {
  const G = loadGame(opts);
  G.run('(' + function () {
    Atlas.need = () => {}; Atlas.keep = () => {}; Atlas.load = () => {};
    globalThis.Game = { dpr: 1, cssW: 844, cssH: 390, viewW: 844, viewH: 10 * TS, rows: 10, gameRect: { x: 0, y: 0, w: 844, h: 390 }, quality: 1, forceTouchUI: true, S: 1,
      setRows(r) { this.rows = r; this.viewH = r * TS; }, setScene(s) { this.scene = s; }, resize() {}, reportError(e) { console.error(e); }, isUnlocked: () => true, isDone: () => false, secretFound() {}, goldCount: () => 0, pathOpen: () => true, complete() {}, vignette() {}, canvas: { width: 844, height: 390, style: {} } };
    const lv = id => { const [w, i] = id.split('-').map(Number); return getLevel(w, i); };
    globalThis.__start = id => { const g = new Play(lv(id), {}); Game.scene = g; return g; };
    globalThis.__go = g => { for (let k = 0; k < 400 && g.state !== 'play'; k++) g.update(1 / 120); g.fade.a = 0; g.fade.target = 0; return g.state; };
    globalThis.__clear = g => { g.levelClear({ cx: g.player.cx, y: g.player.y, exitKey: 'main' }); return g.state; };
    globalThis.__results = g => { for (let k = 0; k < 2400 && g.state !== 'results'; k++) { g.update(1 / 120); if (g.state === 'tally' && g.tally) g.tally.time = 0; } return g.state; };
  }.toString() + ')()');
  G.TP = G.run('TourPostcards');
  return G;
}
const J = x => JSON.parse(JSON.stringify(x));

/* ---------- 1. a level ---------- */
{
  const G = boot(), S = () => G.Save.data, TP = G.TP;
  S().lives = 5; S().gold['1-1'] = [true, true, false];
  let g = G.run('__start')('1-1'); G.run('__go')(g);
  g.collectGold(2, g.player.cx, g.player.y);
  const l0 = S().lives;
  G.run('__clear')(g);
  check('level: the first all-three clear gives one life', S().lives === l0 + 1 && g.cardsNew === true && TP.data().levels['1-1'] === true, { lives: S().lives, l0, cardsNew: g.cardsNew });
  check('level: the clear reaches the results screen', G.run('__results')(g) === 'results', g.state);
  g = G.run('__start')('1-1'); G.run('__go')(g);
  const l1 = S().lives; G.run('__clear')(g);
  check('level: a second clear gives nothing', S().lives === l1 && !g.cardsNew && g.cardsFull === true, { lives: S().lives, l1, cardsNew: g.cardsNew });
  S().gold['1-2'] = [true, false, true];
  g = G.run('__start')('1-2'); G.run('__go')(g);
  const l2 = S().lives; G.run('__clear')(g);
  check('level: two postcards are not enough', S().lives === l2 && !g.cardsNew && !TP.data().levels['1-2'], { lives: S().lives });
  check('level: nothing queued for the map after a level clear', TP.data().pending.length === 0, TP.data().pending);
  // the third card found and the level left from the pause menu: granted on the next map, with a toast
  S().gold['1-3'] = [true, true, true];
  const l3 = S().lives, o = TP.sync();
  check('level: a full level outside a clear is granted by the next sync (+1 life, a toast)', S().lives === l3 + 1 && o.levels.join() === '1-3' && TP.data().pending.length === 1 && TP.data().pending[0].kind === 'toast', { o, pending: TP.data().pending });
  const l4 = S().lives; TP.sync();
  check('level: a second sync grants nothing', S().lives === l4, S().lives);
}

/* ---------- 2. a land ---------- */
{
  const G = boot(), S = () => G.Save.data, TP = G.TP, Tour = G.Tour;
  TP.data().v = 1;   // a save already on this version (not an old save's catch-up)
  S().lives = 5;
  const ids = Tour.levelIds(Tour.countries.mx), last = ids[ids.length - 1];
  for (const id of ids) if (id !== last) S().gold[id] = [true, true, true];
  TP.sync(); TP.data().pending.length = 0;
  check('land: not complete with one level short', !TP.data().lands.mx && !TP.unlocked('cape'), TP.data().lands);
  S().gold[last] = [true, true, false];
  const [w, i] = last.split('-').map(Number);
  const g = G.run('__start')(last); G.run('__go')(g);
  g.collectGold(2, g.player.cx, g.player.y);
  const l0 = S().lives; G.run('__clear')(g);
  const P = TP.data();
  check('land: the last postcard of Mexico completes the land (the first on the track)', P.lands.mx === 0 && P.order.join() === 'mx', { lands: P.lands, order: P.order });
  check('land: the level\'s own life, and a care package card queued for the map', S().lives === l0 + 1 && P.pending.length === 1 && P.pending[0].kind === 'care' && P.pending[0].cc === 'mx', { lives: S().lives, pending: P.pending });
  check('land: the first care package holds the Postcard Cape (on by default; switchable)', TP.unlocked('cape') && TP.on('cape') && !TP.unlocked('compass'), { cape: TP.on('cape') });
  check('land: switching the cape off and on', TP.toggle('cape') === false && !TP.on('cape') && TP.toggle('cape') === true && TP.on('cape'));
  // the track in order, then lives
  const order = ['ec', 'br', 'mz', 'ma', 'es', 'fr', 'nl'];
  for (const cc of order) for (const id of Tour.levelIds(Tour.countries[cc])) S().gold[id] = [true, true, true];
  const l1 = S().lives, n1 = Object.keys(P.levels).length;
  const o = TP.sync();
  const gotLevels = o.levels.length;
  check('land: seven more lands: the rest of the track (' + TP.PERKS.length + ' perks), then +3 lives for the 8th', TP.PERKS.every(q => TP.unlocked(q.id)) && P.order.length === 8 && S().lives === Math.min(99, l1 + gotLevels + 3), { order: P.order, lives: S().lives, l1, gotLevels });
  check('land: one care card per land', P.pending.filter(q => q.kind === 'care').length === 1 + order.length, P.pending.map(q => q.kind + ':' + (q.cc || '')).join(' '));
  check('land: not every postcard yet', !TP.all() && !S().allPostcards && !TP.unlocked('gold'));
}

/* ---------- 3. an old save: granted on load, quietly, one summary card ---------- */
{
  const KEY = 'super-brady-o-world-save-v5';
  const G0 = boot();
  const ids = G0.Tour.levelIds(G0.Tour.countries.ec);
  const old = { v: 3, unlocked: { '1-1': true }, done: { '1-1': true, '1-2': true }, gold: { '1-1': [true, true, true], '1-2': [true, true, true], '1-3': [true, false, true] }, secretExits: {}, exits: {}, worldsSeen: {}, lives: 4, score: 100, best: {},
    look: { hair: 0, skin: 1, style: 'bun', glasses: 'shades', tattoos: true, beard: false, v: 2 }, settings: { music: 0.5, sfx: 0.5, ctrlScale: 1, lefty: false, hq: false, shake: true }, eggs: {}, lastWorld: 1, deaths: 0, beatGame: false,
    seenTourIntro: true, tour: { at: 'mx', seen: { mx: true }, cards: { mx: true } } };
  for (const id of ids) old.gold[id] = [true, true, true];
  const store = { [KEY]: JSON.stringify(old) };
  const G = boot({ load: true, store }), S = G.Save.data, TP = G.TP, P = TP.data();
  const nFull = 2 + ids.length;
  check('old save: every full level counted (' + nFull + ')', Object.keys(P.levels).length === nFull, Object.keys(P.levels));
  check('old save: one life per full level, at once', S.lives === 4 + nFull, { lives: S.lives });
  check('old save: Ecuador\'s care package granted (the first perk) without its own card', P.lands.ec === 0 && TP.unlocked('cape') && !P.pending.some(q => q.kind === 'care'), { lands: P.lands, pending: P.pending });
  check('old save: exactly one summary card', P.pending.length === 1 && P.pending[0].kind === 'summary' && P.pending[0].levels === nFull && P.pending[0].lands.join() === 'ec', P.pending);
  check('old save: the progress itself is untouched', JSON.stringify(S.gold['1-3']) === '[true,false,true]' && S.done['1-1'] && S.tour.at === 'mx');
  check('old save: written back with the rewards', JSON.parse(store[KEY]).postcards && JSON.parse(store[KEY]).lives === 4 + nFull);
  // a reload: nothing twice
  const G2 = boot({ load: true, store }), P2 = G2.TP.data();
  check('old save: a reload grants nothing twice (same lives, the card still waiting once)', G2.Save.data.lives === 4 + nFull && P2.pending.length === 1, { lives: G2.Save.data.lives, pending: P2.pending.length });
  // a fresh save: no card, nothing written
  const store3 = {}, G3 = boot({ load: true, store: store3 });
  check('fresh save: no card and nothing granted', G3.TP.data().pending.length === 0 && G3.Save.data.lives === 5 && !G3.Save.data.allPostcards, { pending: G3.TP.data().pending, lives: G3.Save.data.lives });
}

/* ---------- 4. every postcard ---------- */
{
  const G = boot(), S = () => G.Save.data, TP = G.TP, Tour = G.Tour;
  TP.data().v = 1; S().lives = 5;
  const every = Tour.worldList().map(w => Tour.byWorld[w]);
  let total = 0;
  for (const C of every) for (const id of Tour.levelIds(C)) { S().gold[id] = [true, true, true]; total++; }
  const o = TP.sync(), P = TP.data();
  check('all: ' + every.length + ' lands, ' + total + ' levels, ' + total * 3 + ' postcards', o.all && P.order.length === every.length && Object.keys(P.levels).length === total, { lands: P.order.length, levels: Object.keys(P.levels).length });
  check('all: Save.data.allPostcards and TourPostcards.all()', S().allPostcards === true && TP.all() === true);
  check('all: the Golden Cape and the story are due', TP.unlocked('gold') && TP.on('gold') && P.story === true && P.pending.some(q => q.kind === 'all'));
  check('all: lives capped at 99', S().lives === 99, S().lives);
  // the flag never goes back (a future land with new postcards)
  S().gold['1-1'] = [true, false, true]; TP.sync();
  check('all: the flag stays once earned', S().allPostcards === true && TP.all() && TP.unlocked('gold'));
}

/* ---------- 5. the album agrees with the counts shown everywhere ---------- */
{
  const G = boot(), S = () => G.Save.data, TP = G.TP, Tour = G.Tour, TPr = G.TourProgress;
  TP.data().v = 1;
  // a mid-game save: some cards across lands, a revealed secret level, a found secret land
  const T = TPr.data();
  for (const id of ['1-1', '1-2', '1-3', '2-1', '3-4']) S().gold[id] = [true, id !== '1-3', true];
  S().gold['1-6'] = [true, false, false]; T.revealed['1-6'] = true;
  const album = () => {
    let gold = 0, slots = 0;
    for (const w of Tour.worldList()) { const C = Tour.byWorld[w]; if (!TP.landShown(C)) continue; for (const id of TP.pageLevels(C)) { slots += 3; gold += (S().gold[id] || []).filter(Boolean).length; } }
    return { gold, slots };
  };
  const tot = TPr.totals(), a = album(), c = TP.counts();
  check('album: found cards on the pages = the totals (map, title chip, credits)', a.gold === tot.gold && c.gold === tot.gold, { album: a, totals: { gold: tot.gold, total: tot.goldTotal } });
  check('album: slots on the pages = the totals\' postcard count', a.slots === tot.goldTotal && c.total === tot.goldTotal, { album: a.slots, total: tot.goldTotal });
  // per land: the map's land chip (found / levels x 3) = the album page
  const C = Tour.countries.mx; let n = 0, g = 0;
  for (const id of Tour.levelIds(C)) { const L = Tour.specOf(id); if (L.secret && !TPr.isRevealed(id)) continue; n++; g += TPr.goldCount(id); }
  const pg = TP.pageLevels(C);
  check('album: Mexico\'s page = the land chip on its map', pg.length === n && pg.reduce((s, id) => s + TPr.goldCount(id), 0) === g, { page: pg.length, chip: n });
  check('album: an unrevealed secret level stays off its page', !pg.includes('1-7') && pg.includes('1-6'), pg);
  check('album: a hidden secret land has no page content', !TP.landShown(Tour.countries.aq));
  // the album scene builds and draws (stub canvas) in both orientations
  let ok = true, err = null;
  try {
    G.run('(' + function () {
      const ctx = new Proxy({}, { get: (t, k) => k === 'measureText' ? (s => ({ width: String(s).length * 6 })) : k === 'createLinearGradient' || k === 'createRadialGradient' ? (() => ({ addColorStop() {} })) : (typeof k === 'string' && /^(fillStyle|strokeStyle|font|globalAlpha|lineWidth|textAlign|textBaseline|lineCap|lineJoin|shadowColor|shadowBlur)$/.test(k) ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
      for (const [w, h] of [[844, 390], [390, 844]]) {
        Game.cssW = w; Game.cssH = h;
        const A = new TourPostcards.Album(null, 'mx');
        for (let p = 0; p < A.pages.length; p++) { A.page = p; A.draw(ctx); }
        TourPostcards.drawCareCard(ctx, { kind: 'care', cc: 'mx', item: TourPostcards.PERKS[0] }, 1, 1);
        TourPostcards.drawCareCard(ctx, { kind: 'summary', levels: 3, lands: ['mx'], lives: 3 }, 1, 1);
      }
    }.toString() + ')()');
  } catch (e) { ok = false; err = String(e && e.stack || e).slice(0, 300); }
  check('album: every page and both cards draw in landscape and portrait', ok, err || undefined);
}

console.log(failures ? failures + ' FAILED, ' + passes + ' passed' : 'all ' + passes + ' postcard checks passed');
process.exit(failures ? 1 : 0);
