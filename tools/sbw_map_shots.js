// Screenshots of every land's walkable overworld, for looking at the maps side by side.
// Per land: the whole map as a panorama (every stop revealed, and as a new player sees it), and the game's own
// camera view in portrait (390x844) and landscape (844x390), again revealed and new. Also prints the one-off map
// paint time and the size of the painted map canvas at the game's own zoom.
// usage: BRADY_DIST=<dist> node tools/sbw_map_shots.js <outdir> [--lands mx,ec] [--json file] [--pano] (panoramas only)
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');   // no game music out of the Mac's speakers
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const out = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : 'map-shots');
fs.mkdirSync(out, { recursive: true });
const want = (opt('--lands', '') || '').split(',').filter(Boolean);

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await silence(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(appPage);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const B = window.BRADY, T = window.BRADY_TOUR; window.TT = T;
    window.fresh = () => {
      const d = B.Save.data; d.done = {}; d.unlocked = {}; d.exits = {}; d.secretExits = {}; d.gold = {}; d.best = {};
      d.tour = { at: null, seen: {}, freed: {}, lands: {}, cards: {} }; T.TourProgress.data(); d.lives = 9;
    };
    // every stop of a land shown and every trail open
    window.revealAll = cc => {
      const C = T.Tour.countries[cc], P = T.TourProgress.data(), d = B.Save.data;
      P.lands[cc] = true; P.flights[cc] = true; P.cards[cc] = true; P.seen[cc] = true;
      for (const id of T.Tour.levelIds(C)) { d.done[id] = true; d.unlocked[id] = true; P.revealed[id] = true; }
      for (const H of C.houses || []) P.revealed['house:' + H.id] = true;
      for (const b of T.TourMapScene.Graph.bottles(C)) P.bottles[b.n] = true;
      T.Tour.panelStops(C).forEach((S, k) => { const f = S.mapFrom != null ? S.mapFrom : k - 1; for (const a of (Array.isArray(f) ? f : [f])) if (a >= 0) P.paths[cc + ':' + a + '>' + k] = true; });
    };
    window.newPlayer = cc => { const P = T.TourProgress.data(); P.lands[cc] = true; P.flights[cc] = true; P.cards[cc] = true; P.seen[cc] = true; };
    window.openMap = (cc, fixed, at) => {
      const G = B.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize();
      const C = T.Tour.countries[cc], m = new T.TourMapScene({}); m.card = null; m.sel = cc;
      m.ow = new T.TourMapScene.Overworld(m, C, at ? { at } : {}); m.mode = 'land';
      const ow = m.ow;
      if (fixed) { const W = G.cssW, H = G.cssH, z = Math.min(W / ow.G.w, H / ow.G.h); ow.fixed = { view: { x: (W - ow.G.w * z) / 2, y: (H - ow.G.h * z) / 2, w: ow.G.w * z, h: ow.G.h * z }, z, cam: { x: ow.G.w / 2, y: ow.G.h / 2 } }; }
      ow.layoutView(); ow.clampCam(); ow.iris.t = 9; ow.revealQ = []; G.setScene(m);
      return m;
    };
    window.info = () => { const ow = B.Game.scene.ow; return { paintMs: +(ow.paintMs || 0).toFixed(1), canvas: ow.cache ? [ow.cache.cv.width, ow.cache.cv.height] : null, map: [ow.G.w, ow.G.h], z: +ow.z.toFixed(2) }; };
    // the stop nearest the middle of the map (where Brady stands in the revealed camera view)
    window.middle = cc => { const C = T.Tour.countries[cc], G = T.TourMapScene.OW.geo(C); let best = 'start', bd = 1e9; for (const k in G.pos) { const p = G.pos[k], d = Math.hypot(p.x - G.w / 2, p.y - G.h / 2); if (d < bd && !/^bottle/.test(k)) { bd = d; best = k; } } return best; };
  });
  const lands = (await page.evaluate(() => Object.keys(TT.Tour.countries))).filter(cc => !want.length || want.includes(cc));
  const stats = {};
  const snap = async (name, wait) => { await page.waitForTimeout(wait || 700); await page.screenshot({ path: path.join(out, name) }); };
  // the panoramas: the whole map at 1600 x 960, one CSS px per map unit
  await page.setViewportSize({ width: 1600, height: 960 }); await page.waitForTimeout(300);
  for (const cc of lands) {
    await page.evaluate(cc => { fresh(); revealAll(cc); openMap(cc, true); }, cc); await snap(`${cc}-pano-all.png`);
    await page.evaluate(cc => { fresh(); newPlayer(cc); openMap(cc, true); }, cc); await snap(`${cc}-pano-new.png`);
  }
  for (const [W, H, tag] of args.includes('--pano') ? [] : [[390, 844, 'portrait'], [844, 390, 'landscape']]) {
    await page.setViewportSize({ width: W, height: H }); await page.waitForTimeout(300);
    for (const cc of lands) {
      await page.evaluate(cc => { fresh(); newPlayer(cc); openMap(cc, false); }, cc); await snap(`${cc}-${tag}-new.png`);
      const s = await page.evaluate(() => info()); (stats[cc] = stats[cc] || {})[tag] = s;
      await page.evaluate(cc => { fresh(); revealAll(cc); openMap(cc, false, middle(cc)); }, cc); await snap(`${cc}-${tag}-all.png`);
      stats[cc][tag + 'All'] = await page.evaluate(() => info());
    }
  }
  for (const cc of lands) console.log(cc.padEnd(4), JSON.stringify(stats[cc]));
  if (opt('--json')) fs.writeFileSync(opt('--json'), JSON.stringify(stats, null, 1));
  console.log(errors.length ? 'PAGE ERRORS: ' + errors.slice(0, 5).join(' | ') : 'no page errors');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
