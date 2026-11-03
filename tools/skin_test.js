// Skinned glTF characters (BurnsSkin, docs/BURNS_GUIDE.md §6.9): spawns mannequins in Burning Man's world 1 and screenshots them.
//   node tools/skin_test.js [outDir=shots/skin] [n=6]
// Serves dist/site (or $BRADY_DIST/site) over http (the page fetches models/mannequin.glb.gz), opens burning-man/,
// starts world 1 through the debug API, spawns n skinned mannequins near Brady (walking, idling, waving), steps a few
// seconds and shoots a wide view and a close-up. Prints draw/triangle counts and the asset's clip names; fails on any
// page error, on a missing asset, or when the draw count doesn't grow by about one per mannequin.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'skin'));
const N = +(process.argv[3] || 6);
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
  if (!fs.existsSync(path.join(site, 'burning-man', 'models', 'mannequin.glb.gz'))) { console.error('missing ' + path.join(site, 'burning-man', 'models', 'mannequin.glb.gz') + ': run the Blender build (tools/blender/mannequin.py) and node tools/build.js'); process.exit(1); }
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await page.goto(url + 'burning-man/');
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.debug && window.BRADY_BURNS.BurnsSkin, null, { timeout: 120000 });
  // world 1, cutscene skipped, a fresh save
  await page.evaluate(() => { localStorage.clear(); window.__burnsHideHUD = true; const D = window.BRADY_BURNS.debug; D.play(1); });
  await page.waitForFunction(() => { const s = window.BRADY_BURNS.debug.scene(); return s && s.player && s.world && s.state !== 'load'; }, null, { timeout: 120000 });
  await page.evaluate(() => { window.BRADY_BURNS.debug.skipCine(); });
  // out of the queue onto open playa, so the group is unobstructed
  await page.evaluate(() => { const D = window.BRADY_BURNS.debug, s = D.scene(), p = s.player; D.teleport(p.x + 40, p.z + 6); p.yaw = Math.PI; s.camYaw = Math.PI; D.sim(0.5); });
  await page.waitForTimeout(800);
  const before = await page.evaluate(() => { const s = window.BRADY_BURNS.debug.scene(); return { draws: s.stats.draws, tris: s.stats.tris, shDraws: s.stats.shDraws, tier: window.BRADY_BURNS.BurnsGL.tier, maxBones: window.BRADY_BURNS.BurnsGL.maxBones }; });
  // spawn and let them move (the simulation runs through the scene clock, so sim() advances their clips too)
  const spawned = await page.evaluate(n => window.BRADY_BURNS.debug.mannequin(n).then(list => list.map(c => ({ x: +c.x.toFixed(2), y: +c.y.toFixed(2), z: +c.z.toFixed(2), anim: c.anim && c.anim.name, nb: c.nb }))), N);
  await page.evaluate(() => { window.BRADY_BURNS.debug.sim(2.5); });
  await page.waitForTimeout(1500);
  const asset = await page.evaluate(() => window.BRADY_BURNS.debug.skin());
  console.log('asset      ', JSON.stringify(asset));
  console.log('spawned    ', JSON.stringify(spawned));
  await page.screenshot({ path: path.join(out, 'mannequins.png'), timeout: 180000 });
  const after = await page.evaluate(() => { const s = window.BRADY_BURNS.debug.scene(); return { draws: s.stats.draws, tris: s.stats.tris, shDraws: s.stats.shDraws, shTris: s.stats.shTris }; });
  console.log('before     ', JSON.stringify(before));
  console.log('with', N, '   ', JSON.stringify(after), 'draw delta', after.draws - before.draws, 'tri delta', after.tris - before.tris);
  // close-up: first person at eye level, 2.4 m from the nearest mannequin (the sun behind the camera)
  await page.evaluate(() => {
    const B = window.BRADY_BURNS, s = B.debug.scene(), c = B.BurnsSkin.chars.filter(ch => ch.demo), p = s.player;
    const cx = c.reduce((a, ch) => a + ch.x, 0) / c.length, cz = c.reduce((a, ch) => a + ch.z, 0) / c.length;
    const near = c.slice().sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[1];
    for (const ch of c) ch.drive = null;
    const dx = near.x - cx, dz = near.z - cz, d = Math.hypot(dx, dz) || 1;
    const ex = near.x + dx / d * 2.4, ez = near.z + dz / d * 2.4;
    near.yaw = Math.atan2(ex - near.x, ez - near.z);
    s._skinCamMode = s.camMode; s.camMode = 'first'; s.camYaw = Math.atan2(near.x - ex, near.z - ez); s.camPitch = 0.3;
    B.debug.teleport(ex, ez); p.yaw = s.camYaw;
    B.debug.sim(0.6);
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(out, 'mannequins-close.png'), timeout: 180000 });
  await page.evaluate(() => {
    const B = window.BRADY_BURNS, s = B.debug.scene(), p = s.player, c = B.BurnsSkin.chars.filter(ch => ch.demo);
    s.camMode = s._skinCamMode || 'third';
    const cx = c.reduce((a, ch) => a + ch.x, 0) / c.length, cz = c.reduce((a, ch) => a + ch.z, 0) / c.length;
    const dx = cx - p.x, dz = cz - p.z, d = Math.hypot(dx, dz) || 1;
    B.debug.teleport(cx - dx / d * 4.5, cz - dz / d * 4.5); p.yaw = Math.atan2(dx, dz); s.camYaw = p.yaw;
    B.debug.sim(0.6);
  });
  // wave only, from the front, for the deformation check
  await page.evaluate(() => {
    const B = window.BRADY_BURNS, s = B.debug.scene(), p = s.player, c = B.BurnsSkin.chars.filter(ch => ch.demo);
    for (const ch of c) { ch.drive = null; ch.play(c.indexOf(ch) % 2 ? 'wave' : 'walk', { fade: 0.3 }); ch.yaw = Math.atan2(p.x - ch.x, p.z - ch.z); }
    B.debug.sim(0.7);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, 'mannequins-front.png'), timeout: 180000 });
  const posed = await page.evaluate(() => window.BRADY_BURNS.BurnsSkin.chars.map(c => c.anim && c.anim.name));
  console.log('clips now  ', JSON.stringify(posed));
  await ctx.close(); await browser.close(); srv.close();
  let bad = false;
  if (errs.length) { console.log('ERRORS:\n' + errs.slice(0, 10).join('\n')); bad = true; }
  if (!asset.assets.length || asset.assets[0].clips.length < 3) { console.log('FAIL: asset or clips missing'); bad = true; }
  if (after.draws - before.draws < N - 1 || after.draws - before.draws > N + 6) { console.log('FAIL: expected about ' + N + ' extra draws, got ' + (after.draws - before.draws)); bad = true; }
  console.log((bad ? 'FAIL' : 'PASS') + ' shots in', out);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
