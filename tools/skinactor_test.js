// Skinned characters in play (BurnsSkinActor, docs/BURNS_GUIDE.md §6.11): Brady and Chinka drawn from their glTF
// assets (or the mannequin stand-in) inside the games, with the procedural fallback.
//   node tools/skinactor_test.js [outDir=shots/skinactor]
// Serves dist/site (or $BRADY_DIST/site) over http. Burning Man: world 1, cutscene skipped; measures draws/triangles
// with the swap off and on, shoots Brady walking and mid-jump, a Chinka actor with her sparkles, the Man's captive
// Chinka, and Brady on the bike (procedural fallback: no skinned Brady). Art Cart: the per-app build ships no character
// files, so the test copies them into <site>/art-cart/models (the scratch build only) and shoots the showroom with
// Brady, the driver screen with Chinka, and a race start. Fails on page errors or when a swap that should be live isn't.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'skinactor'));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.gz': 'application/octet-stream' };
function serve(root) {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' }));
  });
}
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) failures++; };
const MOVE0 = { up: false, down: false, left: false, right: false, jump: false, jumpPressed: false, action: false, actionPressed: false };

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const bmModels = path.join(site, 'burning-man', 'models');
  const files = ['brady', 'chinka', 'mannequin'].map(s => s + '.glb.gz').filter(f => fs.existsSync(path.join(bmModels, f)));
  if (!files.length) { console.error('no character files in ' + bmModels + ' (build the mannequin: tools/blender/mannequin.py, then node tools/build.js)'); process.exit(1); }
  console.log('character files', JSON.stringify(files), files.includes('brady.glb.gz') ? '' : '(brady.glb missing: the mannequin stands in)');
  // Art Cart's own build ships only assets/models/art-cart; put the character files beside it for this run (scratch build)
  const cartModels = path.join(site, 'art-cart', 'models');
  let cartLive = false;
  if (fs.existsSync(cartModels)) {
    const idx = path.join(cartModels, 'index.json'), list = fs.existsSync(idx) ? JSON.parse(fs.readFileSync(idx, 'utf8')) : [];
    for (const f of files) { fs.copyFileSync(path.join(bmModels, f), path.join(cartModels, f)); if (!list.includes(f)) list.push(f); }
    fs.writeFileSync(idx, JSON.stringify(list)); cartLive = true;
    console.log('art-cart: character files copied into the scratch site (test only; the real build does not ship them there)');
  }
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const errs = [];
  const open = async (dir, w, h) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.__cartFixedQ = 1; });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
    await page.goto(url + dir + '/');
    return page;
  };
  const shot = (page, n) => page.screenshot({ path: path.join(out, n), timeout: 180000 });

  /* ---------------- Burning Man ---------------- */
  let page = await open('burning-man', 874, 402);
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.debug && window.BRADY_BURNS.BurnsSkinActor && window.BRADY_BURNS.BurnsSkinActor.ready, null, { timeout: 120000 });
  const assets = await page.evaluate(() => window.BRADY_BURNS.BurnsSkinActor.stats());
  console.log('assets     ', JSON.stringify(assets));
  check('bm: Brady and Chinka assets loaded', !!(assets.kinds.brady && assets.kinds.chinka), { brady: assets.kinds.brady && assets.kinds.brady.asset, chinka: assets.kinds.chinka && assets.kinds.chinka.asset });
  await page.evaluate(() => { localStorage.clear(); window.__burnsHideHUD = true; window.BRADY_BURNS.debug.play(1); });
  await page.waitForFunction(() => { const s = window.BRADY_BURNS.debug.scene(); return s && s.player && s.world && s.state !== 'load'; }, null, { timeout: 120000 });
  await page.evaluate(() => { window.BRADY_BURNS.debug.skipCine(); });
  // onto open playa, the camera behind Brady
  await page.evaluate(() => { const D = window.BRADY_BURNS.debug, s = D.scene(), p = s.player; D.teleport(p.x + 40, p.z + 6); p.yaw = Math.PI; s.camYaw = Math.PI; D.sim(0.5); });
  await page.waitForTimeout(700);
  const stats = () => page.evaluate(() => { const s = window.BRADY_BURNS.debug.scene(); return { draws: s.stats.draws, tris: s.stats.tris, shDraws: s.stats.shDraws, shTris: s.stats.shTris }; });
  // the budget: the same frame with the swap off, then on
  await page.evaluate(m => { window.__burnsNoSkinActor = true; window.BRADY_BURNS.debug.sim(0.2, m); }, MOVE0);
  await page.waitForTimeout(600);
  const off = await stats();
  await page.evaluate(m => { window.__burnsNoSkinActor = false; window.BRADY_BURNS.debug.sim(0.2, m); }, MOVE0);
  await page.waitForTimeout(600);
  const on = await stats();
  console.log('swap off   ', JSON.stringify(off));
  console.log('swap on    ', JSON.stringify(on), 'draw delta', on.draws - off.draws, 'tri delta', on.tris - off.tris);
  const bridge = () => page.evaluate(() => { const s = window.BRADY_BURNS.debug.scene(), p = s.player, B = p.ch._skinActor; return { anim: p.ch.anim, clip: B && B.S.anim && B.S.anim.name, active: !!(B && B.active), grounded: p.grounded, x: +p.x.toFixed(1), z: +p.z.toFixed(1), standIn: !!(B && B.standIn) }; });
  const idle = await bridge();
  check('bm: idle Brady is skinned', idle.active && idle.clip === 'idle', idle);
  // walk
  await page.evaluate(m => { window.BRADY_BURNS.debug.sim(2, Object.assign({}, m, { up: true })); }, MOVE0);
  await page.waitForTimeout(500);
  const walk = await bridge();
  await shot(page, 'player-walk.png');
  check('bm: walking Brady is skinned (walk/run clip)', walk.active && /^(walk|run)$/.test(walk.clip) && (walk.anim === 'walk' || walk.anim === 'run'), walk);
  // mid-air
  await page.evaluate(m => { const D = window.BRADY_BURNS.debug; D.sim(1 / 120, Object.assign({}, m, { jump: true, jumpPressed: true })); D.sim(0.28, Object.assign({}, m, { jump: true })); }, MOVE0);
  await page.waitForTimeout(400);
  const air = await bridge();
  await shot(page, 'player-jump.png');
  check('bm: mid-air Brady maps jump -> ' + (air.clip || 'none'), !air.grounded && air.active && (air.anim === 'jump' || air.anim === 'fall'), air);
  await page.evaluate(m => { window.BRADY_BURNS.debug.sim(1.5, m); }, MOVE0);
  // a Chinka actor 3 m in front of Brady, facing him: skinned with sparkles
  const chinka = await page.evaluate(() => {
    const D = window.BRADY_BURNS.debug, s = D.scene(), p = s.player;
    const x = p.x + Math.sin(p.yaw) * 3, z = p.z + Math.cos(p.yaw) * 3;
    const a = s.spawnActor({ id: 'chinkaTest', type: 'chinka', name: 'CHINKA', x, z, yaw: p.yaw + Math.PI, behavior: 'idle', noTalk: true, chatter: false, always: true });
    const n0 = window.BRADY_BURNS.BurnsSkinActor.sparkled; D.sim(1);
    return { anim: a.ch.anim, n0 };
  });
  await page.waitForTimeout(700);
  const chinkaNow = await page.evaluate(() => { const s = window.BRADY_BURNS.debug.scene(), a = s.actor('chinkaTest'), B = a && a.ch._skinActor; let stars = 0; for (let i = 0; i < s.fx.n; i++) if (s.fx.k[i] === s.fx.kIdx.star) stars++; return { anim: a.ch.anim, clip: B && B.S.anim && B.S.anim.name, active: !!(B && B.active), sparkled: window.BRADY_BURNS.BurnsSkinActor.sparkled, stars, d: +Math.hypot(a.x - s.cam.x, a.z - s.cam.z).toFixed(1) }; });
  await shot(page, 'chinka.png');
  check('bm: Chinka actor is skinned', chinkaNow.active, chinkaNow);
  check('bm: Chinka sparkles (glints emitted, stars alive)', chinkaNow.sparkled > chinka.n0 && chinkaNow.stars > 0, { emittedBefore: chinka.n0, emitted: chinkaNow.sparkled, alive: chinkaNow.stars });
  // the Man's captive Chinka (world 1 holds her after the intro)
  const captive = await page.evaluate(() => {
    const D = window.BRADY_BURNS.debug, s = D.scene(), p = s.player, man = s.bosses.find(b => b.chinka);
    if (!man) return null;
    const a = s.actor('chinkaTest'); if (a) a.removed = true;
    man.hidden = false; man.showChinka = true;
    const hp = man.hand(1);
    // first person from 38 m, tilted up as far as the camera goes, so the hand (about 11 m up) is in frame
    D.teleport(man.x + 14, man.z + 36); p.yaw = Math.atan2(man.x - p.x, man.z - p.z); s.camMode = 'first'; s.camYaw = p.yaw; s.camPitch = -0.25; s.snapCam = true;
    D.sim(0.6);
    const B = man.chinka._skinActor;
    return { anim: man.chinka.anim, clip: B && B.S.anim && B.S.anim.name, active: !!(B && B.active), hand: hp.map(v => +v.toFixed(1)), scale: man.scale };
  });
  await page.waitForTimeout(800);
  await shot(page, 'chinka-captive.png');
  check('bm: captive Chinka (the Man) is skinned', !!(captive && captive.active && captive.anim === 'captive'), captive);
  // the bike: not handled, so the procedural Brady rides it
  await page.evaluate(m => { const D = window.BRADY_BURNS.debug, s = D.scene(), p = s.player; D.teleport(p.x + 20, p.z + 20); p.yaw = Math.PI; s.camYaw = Math.PI; D.give('bike'); s.bike.x = p.x; s.bike.z = p.z; s.bike.y = p.y; s.bike.yaw = p.yaw; s.bike.mount(p); D.sim(1.5, Object.assign({}, m, { up: true })); }, MOVE0);
  await page.waitForTimeout(600);
  const bike = await bridge();
  await shot(page, 'player-bike.png');
  check('bm: on the bike the skinned Brady steps aside (procedural)', bike.anim === 'bike' && !bike.active, bike);
  const bikeStats = await stats();
  console.log('on bike    ', JSON.stringify(bikeStats));
  const drawn = await page.evaluate(() => window.BRADY_BURNS.BurnsSkinActor.stats().drawn);
  console.log('skinned draws so far', drawn);
  await page.context().close();

  /* ---------------- Art Cart ---------------- */
  if (cartLive) {
    page = await open('art-cart', 874, 402);
    await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready && window.BRADY_BURNS.BurnsSkinActor && window.BRADY_BURNS.BurnsSkinActor.ready, null, { timeout: 120000 });
    const cassets = await page.evaluate(() => window.BRADY_BURNS.BurnsSkinActor.stats());
    check('cart: character assets loaded', !!(cassets.kinds.brady && cassets.kinds.chinka), cassets.kinds);
    const showroom = async (state, drv) => {
      await page.evaluate(([state, drv]) => {
        const B = window.BRADY_BURNS, s = window.BRADY.Game.scene;
        // CART_DRIVERS isn't exported: brady is driver 0 and chinka driver 1 (checked below through s.pdrv.id)
        s.state = state; s.carSel = Math.max(0, B.CART_CARS.findIndex(c => c.id === 'heart')); s.drvSel = drv === 'chinka' ? 1 : 0; s.spin = 0.9; s.pcar = null; s.build();
      }, [state, drv]);
      await page.waitForTimeout(1800);
      return page.evaluate(() => { const s = window.BRADY.Game.scene, d = s.pdrv, B = d && d.ch._skinActor, S = s.pstand && s.pstand._skinActor; return { id: d && d.id, anim: d && d.ch.anim, clip: B && B.S.anim && B.S.anim.name, seated: !!(B && B.active), stand: !!(S && S.active), standClip: S && S.S.anim && S.S.anim.name, portraits: !!s._port }; });
    };
    const car = await showroom('car', 'brady');
    await shot(page, 'cart-showroom-brady.png');
    check('cart: showroom Brady drives skinned (drive clip)', car.seated && car.id === 'brady', car);
    const drv = await showroom('driver', 'chinka');
    await shot(page, 'cart-driver-chinka.png');
    check('cart: driver screen Chinka stands skinned (wave/cheer clip)', drv.stand && drv.id === 'chinka', drv);
    await page.evaluate(() => {
      const B = window.BRADY_BURNS; window.__burnsHideHUD = true;
      window.BRADY.Game.setScene(new B.CartRaceScene({ mode: 'tt', track: B.CART_TRACK_ORDER[0], driver: 'chinka', car: 'heart', autoGas: true }));
    });
    await page.waitForFunction(() => { const s = window.BRADY.Game.scene; return s && s.state && s.state !== 'load'; }, null, { timeout: 120000 });
    await page.waitForTimeout(2500);
    const race = await page.evaluate(() => { const s = window.BRADY.Game.scene, k = s.player, B = k && k.ch._skinActor; return { state: s.state, driver: k && k.drv.id, anim: k && k.ch.anim, clip: B && B.S.anim && B.S.anim.name, active: !!(B && B.active), draws: s.stats && s.stats.draws, tris: s.stats && s.stats.tris, drawn: window.BRADY_BURNS.BurnsSkinActor.stats().drawn }; });
    await shot(page, 'cart-race.png');
    console.log('race       ', JSON.stringify(race));
    check('cart: the race driver is skinned', race.active && race.driver === 'chinka', race);
    await page.context().close();
  } else console.log('art-cart: no models folder in the site build; the Art Cart part was skipped');

  await browser.close(); srv.close();
  if (errs.length) { console.log('ERRORS:\n' + errs.slice(0, 10).join('\n')); failures++; }
  console.log((failures ? 'FAIL ' + failures : 'PASS') + ' shots in ' + out);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
