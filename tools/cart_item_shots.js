// Art Cart item screenshots: every item, car special and weapon at its moment of effect, from the player's chase cam.
//   node tools/cart_item_shots.js [outDir=shots/item-shots] [id,id,...] [tod=day|night|both]
// Each shot: a quick race (day: Esplanade, night: Neon Nights) or a battle arena, rivals placed ahead, the item used,
// the simulation stepped with rendering on a fixed 60 fps clock until the moment, then a screenshot (HUD on).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'item-shots'));
const pick = process.argv[3] && process.argv[3] !== 'all' ? process.argv[3].split(',') : null;
const tods = (process.argv[4] || 'day') === 'both' ? ['day', 'night'] : [process.argv[4] || 'day'];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
// id: [car, kind, moments (s after use), rivals [ds, lat, frozen]]
const AHEAD = [[14, 0.3, 0], [22, -0.3, 0], [32, 0, 0], [46, 0.4, 1], [60, -0.3, 1], [-10, 0, 0], [80, 0, 1]];
const NEAR = [[7, 0.35, 0], [11, -0.35, 0], [17, 0, 0], [26, 0.3, 0], [36, -0.2, 0], [-8, 0, 0], [50, 0, 0]];
const SHOTS = {
  foam: ['heart', 'item', [0.3, 1.0], NEAR], devil: ['heart', 'item', [0.8, 1.6], AHEAD], skymail: ['heart', 'item', [1.0, 1.75], AHEAD], bombs: ['heart', 'item', [0.75, 1.35, 2.6], [[46, 0.45, 1], [58, -0.45, 1], [70, 0.45, 1], [94, 0.45, 1], [-10, 0, 0], [30, 0, 0], [20, -0.4, 0]]],
  ducks: ['heart', 'item', [0.9, 2.6, 4.5], AHEAD], glow: ['heart', 'item', [0.5], AHEAD], water: ['heart', 'item', [0.2], AHEAD], tumble: ['heart', 'item', [0.4], AHEAD], potty: ['heart', 'item', [0.6, 1.4], AHEAD], shield: ['heart', 'item', [0.5], AHEAD], whistle: ['heart', 'item', [0.4], AHEAD],
  throb: ['heart', 'special', [0.3, 0.9], NEAR], decoys: ['fish', 'special', [0.8], NEAR], toss: ['octo', 'special', [0.25, 0.65], NEAR], glide: ['dragon', 'special', [1.6, 3.0], [[25, 0, 1], [40, 0.2, 1], [55, -0.2, 1], [-10, 0, 0], [70, 0, 1], [90, 0.3, 1], [-25, 0, 0]]],
  breach: ['whale', 'special', [0.5, 2.0, 4.42], AHEAD], hover: ['jelly', 'special', [1.0, 2.2], [[12, 0, 1], [24, 0.1, 1], [36, -0.1, 1], [-8, 0, 0], [60, 0, 1], [80, 0, 0], [-20, 0, 0]]], shell: ['snail', 'special', [0.4, 0.86], NEAR],
  dive: ['shark', 'special', [1.2, 3.05], [[60, 0, 1], [75, 0.2, 1], [90, 0, 1], [105, 0, 1], [-8, 0, 0], [-20, 0, 0], [140, 0, 0]]], warp: ['pyramid', 'special', [0.35, 0.75], AHEAD], frosting: ['cupcake', 'special', [0.4, 1.1], [[34, 0, 0], [40, 0.5, 0], [-8, 0, 0], [60, 0, 0], [80, 0, 0], [-20, 0, 0], [100, 0, 0]]],
  wave: ['galleon', 'special', [0.5, 1.0], AHEAD], surf: ['duck', 'special', [0.5, 1.4], [[12, 0, 1], [24, 0.3, 1], [40, -0.2, 1], [-8, 0, 0], [60, 0, 1], [80, 0, 0], [-20, 0, 0]]],
  bassdrop: ['heart', 'weapon', [0.3], NEAR], dazzle: ['fish', 'weapon', [0.3], AHEAD], torch: ['octo', 'weapon', [0.4], NEAR], fireball: ['dragon', 'weapon', [0.4], AHEAD], bubbles: ['duck', 'weapon', [0.8], AHEAD], laser: ['pyramid', 'weapon', [0.4], AHEAD],
  sprinkles: ['cupcake', 'weapon', [0.7], AHEAD], cannon: ['galleon', 'weapon', [0.3], [[0.5, 1.6, 1], [-1, -1.6, 1], [20, 0, 0], [30, 0, 0], [40, 0, 0], [-8, 0, 0], [70, 0, 0]]], slime: ['snail', 'weapon', [1.0], AHEAD], zap: ['jelly', 'weapon', [0.2], NEAR], chomp: ['shark', 'weapon', [0.4], [[8, 0, 1], [20, 0, 0], [30, 0, 0], [40, 0, 0], [50, 0, 0], [-8, 0, 0], [70, 0, 0]]], geyser: ['whale', 'weapon', [0.85], AHEAD]
};
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: +(process.env.DSF || 1), isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { window.__cartFixedQ = 1; });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await page.goto(url + 'art-cart/');
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready && window.BRADY_CART && window.BRADY_CART.debug.kart, null, { timeout: 120000 });
  await page.evaluate(() => { window.BRADY.Game.frame = () => {}; });   // stop the rAF loop: we step and draw by hand
  const list = [];
  for (const tod of tods) for (const id in SHOTS) { if (pick && !pick.includes(id)) continue; const [car, kind, moments, rivals] = SHOTS[id]; list.push({ id, car, kind, moments, rivals, tod }); }
  for (const c of list) {
    let tPrev = 0;
    await page.evaluate(c => {
      const D = window.BRADY_CART.debug, STEP = 1 / 60;
      D.start({ mode: 'quick', track: c.tod === 'night' ? 'neon' : 'esplanade', car: c.car, driver: 'brady', seed: 5, autoGas: true });
      const s = D.scene(); s.state = 'race'; s.stateT = 0; s.autoDrive = true; window.BRADY.Input.setMode('game'); s.layoutControls();
      s.update(STEP);
      const T = s.T; let best = 0, bk = 1; for (let i = 0; i < T.N; i += 4) { let kk = 0; for (let j = 0; j < 60; j += 3) kk += Math.abs(T.K[(i + j) % T.N]); if (kk < bk) { bk = kk; best = i; } }
      const g = T.at(best * T.ds, {}); D.place(-1, g.x, g.z, g.yaw, { speed: 22 });
      let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = c.rivals[j++]; D.placeRel(i, r[0], r[1], { speed: r[2] ? 0 : 20, frozen: !!r[2] }); }
      for (const k of s.karts) { k.wpn.t = 99; k.invT = 0; k.prevS = k.loc.s; k.lap = 1; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } }
      if (!s.player.ai) s.aiInput(s.player, STEP, true); s.player.ai.itemT = 99; s.player.ai.fireT = 99;
      s.snapCam = true; D.run(0.5, 10);   // settle the camera behind the car
      if (c.kind === 'weapon') { D.rearm(-1); s.fireWeapon(s.player); } else { D.give(c.id); s.useItem(s.player); }
    }, c);
    for (let i = 0; i < c.moments.length; i++) {
      const m = c.moments[i], dt = m - tPrev; tPrev = m;
      await page.evaluate(dt => { window.BRADY_CART.debug.run(dt, 10); }, dt);
      const file = path.join(out, c.id + '-' + c.tod + '-' + (i + 1) + '.png');
      await page.screenshot({ path: file });
      console.log(file);
    }
  }
  await browser.close(); srv.close();
  if (errs.length) { console.log('PAGE ERRORS:\n' + errs.slice(0, 10).join('\n')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
