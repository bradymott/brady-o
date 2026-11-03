// Textured PBR glTF check (src/40_burns_bd_pbr.js): spawns crates (assets/models/burning-man/pbr_crate.glb, made by
// tools/blender/pbr_demo.py) in World 1 and screenshots them by day, at dusk (close-up) and at night (emissive bloom).
//   BRADY_DIST=/some/dist node tools/pbr_test.js [outDir=shots/pbr] [n=4]
// Serves dist/site over http (the .glb.gz is fetched), opens burning-man/, starts world 1, calls the debug entry
// window.BRADY_BURNS.debug.pbrDemo(n), prints draw / triangle counts and fails on any page error.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'pbr'));
const N = +(process.argv[3] || 4);
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
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver Message/.test(m.text())) errs.push(m.type() + ': ' + m.text().slice(0, 300)); });
  await page.goto(url + 'burning-man/');
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.debug && window.BRADY_BURNS.debug.pbrDemo, null, { timeout: 60000 });
  await page.evaluate(() => { localStorage.clear(); window.__burnsHideHUD = true; window.BRADY_BURNS.debug.play(1); });
  // the world loads on its first frames; then skip the intro cutscene and any dialogue
  await page.waitForFunction(() => { const D = window.BRADY_BURNS.debug, s = D.scene(); if (!s || !s.dialog) return false; const st = D.state(); if (st.scene !== 'BurnsPlayScene' || st.state !== 'play') return false; D.skipCine(); return !st.cine && !st.dialog; }, null, { timeout: 120000, polling: 250 });
  // an empty patch of playa near the spawn (no colliders or NPCs around), facing the crates
  const info = await page.evaluate(async (n) => {
    const D = window.BRADY_BURNS.debug, s = D.scene(), W = s.world, p = s.player, out = [];
    let best = null;
    for (let r = 16; r <= 90 && !(best && best.n === 0); r += 6) for (let a = 0; a < 6.283; a += 0.3) {
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      W.col.near(x, z, 11, out); let k = out.length;
      for (const ac of s.actors) if (!ac.removed && Math.hypot(ac.x - x, ac.z - z) < 14) k += 3;
      if (!best || k < best.n) best = { x, z, n: k, r };
      if (k === 0) break;
    }
    const yaw = 0.6;
    D.teleport(best.x, best.z); p.yaw = yaw; s.camYaw = yaw; s.camPitch = 0.3; s.snapCam = true;
    s.banners.length = 0; if (s.toasts) s.toasts.length = 0; s.dayCardT = -1;
    const r = await D.pbrDemo(n, { dist: 3.4, spacing: 1.5 });
    s.palA = 'day'; s.tod = 0; s.todTarget = null;
    r.spot = [+best.x.toFixed(1), +best.z.toFixed(1), best.n];
    return r;
  }, N);
  console.log('model      ', JSON.stringify(info));
  const settle = async (ms) => { await page.waitForTimeout(ms || 1500); };
  const stats = async () => page.evaluate(() => { const s = window.BRADY_BURNS.debug.scene(); return { draws: s.stats.draws, tris: Math.round(s.stats.tris), shDraws: s.stats.shDraws, shTris: Math.round(s.stats.shTris), tier: window.BRADY_BURNS.BurnsGL.tier, probe: !!s.R && !!s.R.probeOk }; });
  await settle(2000);
  await page.screenshot({ path: path.join(out, 'crates.png'), timeout: 120000 });
  console.log('day        ', JSON.stringify(await stats()));
  // dusk close-up: first person, standing on the sunlit side of a crate and looking down at it
  await page.evaluate(() => {
    const D = window.BRADY_BURNS.debug, s = D.scene(), it = s._pbrDemo.items[1];
    s.palA = 'dusk'; s.tod = 0; s.todTarget = null;
    const kd = s.R.envRef.keyDir, kl = Math.hypot(kd[0], kd[2]) || 1, px = it.x + kd[0] / kl * 2.1, pz = it.z + kd[2] / kl * 2.1;
    const yaw = Math.atan2(it.x - px, it.z - pz);
    D.teleport(px, pz); s.player.yaw = yaw;
    s.camMode = 'first'; s.camYaw = yaw; s.camPitch = 0.3 + 0.42 / 1.2; s.snapCam = true; s.lastManual = s.time;
    s.banners.length = 0; s.dayCardT = -1;
  });
  await settle(2000);
  await page.screenshot({ path: path.join(out, 'crates_dusk_close.png'), timeout: 120000 });
  console.log('dusk close ', JSON.stringify(await stats()));
  // detail: grazing dusk light from the side, 1.4 m from a crate (normal-map ribs, rivet domes, seams, the EL ridge)
  await page.evaluate(() => {
    const D = window.BRADY_BURNS.debug, s = D.scene(), it = s._pbrDemo.items[2];
    const kd = s.R.envRef.keyDir, kl = Math.hypot(kd[0], kd[2]) || 1, sx = -kd[2] / kl, sz = kd[0] / kl;   // perpendicular to the sun
    const px = it.x + sx * 1.5, pz = it.z + sz * 1.5, yaw = Math.atan2(it.x - px, it.z - pz);
    D.teleport(px, pz); s.player.yaw = yaw; s.camYaw = yaw; s.camPitch = 0.3 + 0.55 / 1.2; s.snapCam = true; s.lastManual = s.time;
  });
  await settle(1500);
  await page.screenshot({ path: path.join(out, 'crates_detail.png'), clip: { x: 217, y: 40, width: 440, height: 330 }, timeout: 120000 });
  // day, from the shaded side: the crates' own shadows on the playa, and each other
  await page.evaluate(() => {
    const D = window.BRADY_BURNS.debug, s = D.scene(), it = s._pbrDemo.items[2];
    s.palA = 'day'; s.tod = 0; s.todTarget = null;
    const kd = s.R.envRef.keyDir, kl = Math.hypot(kd[0], kd[2]) || 1, px = it.x - kd[0] / kl * 2.6 + 0.6, pz = it.z - kd[2] / kl * 2.6, yaw = Math.atan2(it.x - px, it.z - pz);
    D.teleport(px, pz); s.player.yaw = yaw; s.camYaw = yaw; s.camPitch = 0.3 + 0.4 / 1.2; s.snapCam = true; s.lastManual = s.time;
  });
  await settle(1500);
  await page.screenshot({ path: path.join(out, 'crates_day_shadow.png'), timeout: 120000 });
  // the crates are in the shadow pass: the caster draw count drops by one per part when they are taken out
  const sh = await page.evaluate(async () => { const s = window.BRADY_BURNS.debug.scene(); const a = s.stats.shDraws, d = s._pbrDemo; s._pbrDemo = null; await new Promise(r => setTimeout(r, 400)); const b = s.stats.shDraws; s._pbrDemo = d; await new Promise(r => setTimeout(r, 400)); return { with: a, without: b, parts: d.model.parts.length * d.items.length }; });
  console.log('shadow pass', JSON.stringify(sh), sh.with - sh.without >= sh.parts ? 'OK' : 'FAIL');
  if (sh.with - sh.without < sh.parts) errs.push('crates missing from the shadow pass');
  // night: the EL wire blooms
  await page.evaluate(() => {
    const D = window.BRADY_BURNS.debug, s = D.scene(), it = s._pbrDemo.items[0], px = it.x - 2.4, pz = it.z - 2.4, yaw = Math.atan2(it.x + 1.2 - px, it.z - pz);
    s.palA = 'night'; s.palB = null; s.tod = 0; s.todTarget = null;
    D.teleport(px, pz); s.player.yaw = yaw; s.camMode = 'first'; s.camYaw = yaw; s.camPitch = 0.3 + 0.22 / 1.2; s.snapCam = true; s.lastManual = s.time; s.dayCardT = -1;
  });
  await settle(2000);
  await page.screenshot({ path: path.join(out, 'crates_night.png'), timeout: 120000 });
  console.log('night      ', JSON.stringify(await stats()));
  // every quality tier rebuilds the programs (addPrograms hook): they must all compile and draw
  for (const tier of ['medium', 'low', 'ultra', 'high']) {
    await page.evaluate(t => window.BRADY_BURNS.BurnsGL.configure(t), tier);
    await settle(700);
    const st = await stats(); console.log('tier ' + tier.padEnd(7), JSON.stringify(st));
    if (tier === 'medium') await page.screenshot({ path: path.join(out, 'crates_night_medium.png'), timeout: 120000 });
  }
  await ctx.close(); await browser.close(); srv.close();
  const bad = errs.filter(e => !/favicon|service ?worker|DecompressionStream/i.test(e));
  if (bad.length) { console.log('ERRORS:\n' + bad.slice(0, 12).join('\n')); process.exit(1); }
  console.log('shots in', out);
})().catch(e => { console.error(e); process.exit(1); });
