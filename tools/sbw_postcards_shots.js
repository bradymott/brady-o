// Screenshots of the postcard rewards (docs/design/POSTCARD_REWARDS.md, src/29_tour_zz_postcards.js):
//   results-<o>.png       the results screen right after the third postcard of a level (the fan and the stamp)
//   results-again-<o>.png the same level cleared again (no second reward: the small stamp only)
//   care-<o>.png          a care package card on the map (Mexico, every postcard found)
//   summary-<o>.png       an old save loaded for the first time: the one summary card
//   album-<o>.png         the postcard album (the land page, and the perks page: album-perks-<o>.png)
//   map-badge-<o>.png     a land's map with the all-three stamps on its stops
//   brady-<o>.png         Brady in a level wearing the cape, the golden shades and the heart trail
// <o> is landscape (844x390) or portrait (390x844). With --before only the results shot is taken (for a build
// without the rewards). Silent (tools/sbw_silent.js). Exits 1 on a page error.
// usage: BRADY_DIST=<dist> node tools/sbw_postcards_shots.js <outdir> [--before] [--landscape | --portrait]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : 'postcards-shots');
const before = args.includes('--before');
fs.mkdirSync(out, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); if (!ok) failures++; };

async function session(viewport, tag) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await silence(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(appPage);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const B = window.BRADY, T = window.BRADY_TOUR; window.B = B; window.T = T;
    window.S = () => B.Game.scene;
    window.sim = (sec, inp) => { for (let k = 0, n = Math.round(sec * 120); k < n; k++) { if (inp) Object.assign(B.Input, inp); B.Game.scene.update(1 / 120); if (k === 0) { B.Input.taps.length = 0; B.Input.uiKey = null; } } if (inp) for (const key in inp) B.Input[key] = false; };
    window.fresh = () => { const d = B.Save.data; for (const k of ['done', 'unlocked', 'exits', 'secretExits', 'gold', 'best']) d[k] = {}; d.unlocked['1-1'] = true; d.tour = null; d.lives = 5; d.seenTourIntro = true; delete d.postcards; delete d.allPostcards; T.TourProgress.data(); };
    window.full = ids => { for (const id of ids) B.Save.data.gold[id] = [true, true, true]; };
    window.land = cc => { const C = T.Tour.countries[cc], P0 = T.TourProgress.data(), d = B.Save.data; (P0.seen = P0.seen || {})[cc] = true; (P0.cards = P0.cards || {})[cc] = true; (P0.lands = P0.lands || {})[cc] = true; P0.revealed = P0.revealed || {}; for (const id of T.Tour.levelIds(C)) { d.done[id] = true; d.unlocked[id] = true; P0.revealed[id] = true; } return T.Tour.levelIds(C); };
    window.play = id => { const [w, i] = id.split('-').map(Number); const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(1.8); g.player.invuln = 999; return g; };
    // clear the level through the real flow: the clear walk, the tally, then the results screen
    window.clearIt = () => { const g = S(), p = g.player; g.levelClear({ cx: p.cx + 40, x: p.cx + 30, y: p.y, w: 20, h: 64, exitKey: 'main', secret: false }); for (let k = 0; k < 2400 && g.state !== 'results'; k++) { g.update(1 / 120); if (g.state === 'tally' && g.tally) { B.Save.data.score += g.tally.time * 10; g.tally.time = 0; } } return g.state; };
    window.openMap = (cc, at) => { const m = new T.TourMapScene({}); if (m.card && !m.card.care) m.card = null; m.sel = cc; m.ow = new T.TourMapScene.Overworld(m, T.Tour.countries[cc], at ? { at } : {}); m.mode = 'land'; m.ow.layoutView(); m.ow.iris.t = 9; m.ow.revealQ = []; B.Game.setScene(m); return m; };
  });
  const snap = async (name, wait) => { await page.waitForTimeout(wait == null ? 400 : wait); await page.screenshot({ path: path.join(out, name + '-' + tag + '.png') }); };
  const has = await page.evaluate(() => typeof window.BRADY_POSTCARDS !== 'undefined');

  // 1. the results screen right after the level's third postcard
  const r1 = await page.evaluate(() => { fresh(); B.Save.data.gold['1-1'] = [true, true, false]; const g = play('1-1'); const lives0 = B.Save.data.lives; g.collectGold(2, g.player.cx, g.player.y); const st = clearIt(); return { st, lives0, lives: B.Save.data.lives }; });
  check(tag + ': the results screen is up', r1.st === 'results', r1);
  // the stamp thumps down about 1 s in: one shot mid-fan and one settled
  await page.evaluate(() => { const g = S(); g.stateT = 0.55; }); await snap('results-fan', 30);
  await page.evaluate(() => { const g = S(); g.stateT = 2.2; }); await snap('results');
  if (before) { await browser.close(); return errors; }
  check(tag + ': the first all-three clear gives one extra life', r1.lives === r1.lives0 + 1, r1);
  // 2. the same level again: no second life, only the small stamp
  const r2 = await page.evaluate(() => { const g = play('1-1'); const lives0 = B.Save.data.lives; const st = clearIt(); S().stateT = 2.2; return { st, lives0, lives: B.Save.data.lives, again: !!S().cardsNew }; });
  check(tag + ': a second clear gives nothing more', r2.st === 'results' && r2.lives === r2.lives0 && !r2.again, r2);
  await snap('results-again');
  // 3. a care package card: every postcard in Mexico
  const r3 = await page.evaluate(() => { fresh(); const BP = window.BRADY_POSTCARDS; BP.data().v = 1; const ids = land('mx'); full(ids); BP.sync(); const m = openMap('mx', '1-3'); sim(3); return { card: m.card && m.card.kind, pending: BP.data().pending.length }; });
  check(tag + ': the map shows the care package card', r3.card === 'care', r3);
  await snap('care');
  // 4. the map's all-three stamps
  await page.evaluate(() => { const m = S(); m.card = null; m.toastT = 0; const ow = m.ow, G = B.Game, W = G.cssW, H = G.cssH, z = Math.min(W / ow.G.w, H / ow.G.h); ow.fixed = { view: { x: (W - ow.G.w * z) / 2, y: (H - ow.G.h * z) / 2, w: ow.G.w * z, h: ow.G.h * z }, z, cam: { x: ow.G.w / 2, y: ow.G.h / 2 } }; ow.layoutView(); ow.clampCam(); sim(0.3); }); await snap('map-badge');
  // 5. an old save loaded for the first time: one summary card
  const r5 = await page.evaluate(() => { fresh(); for (const cc of ['mx', 'ec']) full(land(cc)); full(['3-1', '3-2']); B.Save.data.gold['3-3'] = [true, false, true]; const BP = window.BRADY_POSTCARDS; BP.sync(); const m = openMap('br'); sim(0.5); return { card: m.card && m.card.kind, cards: BP.data().pending.length }; });
  check(tag + ': an old save gets one summary card', r5.card === 'summary', r5);
  await snap('summary');
  // 6. the album: Brazil's page, then the perks page
  await page.evaluate(() => { S().card = null; const A = new window.BRADY_POSTCARDS.Album(S(), 'br'); B.Game.setScene(A); sim(0.4); }); await snap('album');
  await page.evaluate(() => { const A = S(); A.page = 0; sim(0.3); }); await snap('album-perks');
  // 7. Brady in a level with the perks on
  await page.evaluate(() => { fresh(); const BP = window.BRADY_POSTCARDS; for (const cc of Object.keys(T.Tour.countries)) full(land(cc)); BP.sync(); BP.data().off.gold = true; BP.data().off.gift = true; BP.data().off.magnet = true; BP.data().pending.length = 0; const g = play('1-1'); sim(1.6, { right: true }); });
  await snap('brady', 30);
  await page.evaluate(() => { const BP = window.BRADY_POSTCARDS; delete BP.data().off.gold; sim(0.5, { right: true }); }); await snap('brady-gold', 30);
  await browser.close();
  return errors;
}

(async () => {
  const views = args.includes('--portrait') ? [[390, 844, 'portrait']] : args.includes('--landscape') ? [[844, 390, 'landscape']] : [[844, 390, 'landscape'], [390, 844, 'portrait']];
  let errs = [];
  for (const [w, h, tag] of views) errs = errs.concat(await session({ width: w, height: h }, tag));
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.slice(0, 5).join(' | ') : 'no page errors');
  console.log(failures ? failures + ' FAILED' : 'all shots taken');
  process.exit(errs.length || failures ? 1 : 0);
})();
