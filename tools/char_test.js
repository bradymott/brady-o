// Brady and Chinka as skinned glTF characters (BurnsSkin, docs/BURNS_GUIDE.md §6.9): loads models/brady.glb.gz and
// models/chinka.glb.gz in Burning Man's world 17 (Root Society at sunset, Brady's home), spawns both near the player,
// plays every clip the engine bridge expects on each of them, and screenshots close-ups.
//   node tools/char_test.js [outDir=shots/chars]
// Serves dist/site (or $BRADY_DIST/site) over http. Fails on any page error, console error, a missing clip (the loader's
// 'no clip' warning or a name absent from the asset), or a missing model file. Shots: brady-face, brady-tattoos,
// chinka-face, chinka-robe, both-dance, both-wide.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'chars'));
const CLIPS = ['idle', 'walk', 'run', 'jump', 'land', 'hurt', 'knocked', 'dance', 'wave', 'talk', 'hug', 'sit', 'sleep', 'cheer', 'drive', 'fire', 'sulk', 'captive', 'photo'];
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
  for (const m of ['brady', 'chinka']) {
    const f = path.join(site, 'burning-man', 'models', m + '.glb.gz');
    if (!fs.existsSync(f)) { console.error('missing ' + f + ': run the Blender build (tools/blender/' + m + '.py) and node tools/build.js'); process.exit(1); }
  }
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const errs = [], warns = [];
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); else if (m.type() === 'warning' && /no clip|BurnsSkin|BurnsGLTF/.test(m.text())) warns.push(m.text().slice(0, 300)); });
  await page.goto(url + 'burning-man/');
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.debug && window.BRADY_BURNS.BurnsSkin, null, { timeout: 120000 });
  // world 17, cutscene skipped, a fresh save
  await page.evaluate(() => { localStorage.clear(); window.__burnsHideHUD = true; window.BRADY_BURNS.debug.play(17); });
  await page.waitForFunction(() => { const s = window.BRADY_BURNS.debug.scene(); return s && s.player && s.world && s.state !== 'load'; }, null, { timeout: 120000 });
  await page.waitForFunction(() => { const D = window.BRADY_BURNS.debug, s = D.scene(); if (!s) return false; D.skipCine(); const st = D.state ? D.state() : {}; return !st.cine && !st.dialog; }, null, { timeout: 120000, polling: 250 });
  await page.evaluate(() => { const D = window.BRADY_BURNS.debug; D.skipCine(); D.sim(0.5); });
  // load both characters and stand them 3 m in front of the player, facing the camera
  const assets = await page.evaluate(() => {
    const B = window.BRADY_BURNS;
    return Promise.all([B.BurnsSkin.preload('models/brady.glb.gz'), B.BurnsSkin.preload('models/chinka.glb.gz')]).then(as => as.map(a => ({ name: a.name, clips: a.clipNames.slice(), tris: a.tris, nv: a.nv, nb: a.nb, height: +a.height.toFixed(3), extras: a.extras })));
  });
  console.log('assets     ', JSON.stringify(assets));
  await page.evaluate(() => {
    const B = window.BRADY_BURNS, D = B.debug, s = D.scene(), p = s.player, g = s;
    // a flat spot near Brady's home: 3 m ahead along the camera, the pair 1.2 m apart
    const yaw = s.camYaw, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const cx = p.x + fx * 3.2, cz = p.z + fz * 3.2;
    const place = (name, side) => { const x = cx + rx * side, z = cz + rz * side; const ch = B.BurnsSkin.spawn(name, x, g.world.height(x, z), z, Math.atan2(p.x - x, p.z - z)); ch.demo = true; ch.charName = name; return ch; };
    window.__chars = { brady: place('brady', 0.7), chinka: place('chinka', -0.7) };
    for (const ch of B.BurnsSkin.chars) ch.drive = null;
    D.sim(0.3);
  });
  // every clip on both, about a second each; the loader warns on a missing one
  const played = await page.evaluate(async (CLIPS) => {
    const B = window.BRADY_BURNS, D = B.debug, C = window.__chars, out = [];
    for (const name of CLIPS) {
      for (const k in C) { C[k].play(name, { loop: true, fade: 0.15, restart: true }); }
      D.sim(1.0);
      await new Promise(r => setTimeout(r, 40));
      out.push([name, C.brady.anim && C.brady.anim.name, C.chinka.anim && C.chinka.anim.name, C.brady.ended, C.chinka.ended]);
    }
    return out;
  }, CLIPS);
  const missing = [];
  for (const a of assets) for (const c of CLIPS) if (!a.clips.includes(c)) missing.push(a.name + ':' + c);
  for (const [name, b, c] of played) if (b !== name || c !== name) missing.push('played:' + name + ' -> ' + b + '/' + c);
  console.log('played     ', played.map(p => p[0] + (p[1] === p[0] && p[2] === p[0] ? '' : '!')).join(' '));
  // ---- shots. look(ch, dist, side, h, pitchUp): first person, `dist` m from the character, aimed at height h ----
  const look = (who, dist, side, h, clips, sim) => page.evaluate(([who, dist, side, h, clips, sim]) => {
    const B = window.BRADY_BURNS, D = B.debug, s = D.scene(), p = s.player, C = window.__chars;
    for (const k in clips) C[k].play(clips[k], { loop: true, fade: 0.1, restart: true, time: 0 });
    const ch = C[who];
    const base = Math.atan2(p.x - ch.x, p.z - ch.z);     // from the character toward the player
    const a = base + side;
    const ex = ch.x + Math.sin(a) * dist, ez = ch.z + Math.cos(a) * dist;
    for (const k in C) C[k].yaw = Math.atan2(ex - C[k].x, ez - C[k].z);
    s.camMode = 'first'; s.camYaw = Math.atan2(ch.x - ex, ch.z - ez);
    const eye = s.world.height(ex, ez) + 1.62, drop = Math.atan2(eye - h, dist);
    s.camPitch = 0.3 + drop / 1.2; s.snapCam = true; s.lastManual = s.time;
    D.teleport(ex, ez); p.yaw = s.camYaw;
    D.sim(sim || 0.6); s.camYaw = Math.atan2(ch.x - ex, ch.z - ez); p.yaw = s.camYaw;
  }, [who, dist, side, h, clips, sim]);
  const shot = async (name) => { await page.waitForTimeout(900); await page.screenshot({ path: path.join(out, name + '.png'), timeout: 180000 }); };
  await look('brady', 0.85, 0.25, 1.66, { brady: 'talk', chinka: 'idle' }, 0.4); await shot('brady-face');
  await look('brady', 1.7, -0.5, 1.25, { brady: 'wave', chinka: 'idle' }, 0.5); await shot('brady-tattoos');
  await look('chinka', 0.8, 0.2, 1.55, { brady: 'idle', chinka: 'talk' }, 0.4); await shot('chinka-face');
  await look('chinka', 3.0, 0.45, 0.85, { brady: 'idle', chinka: 'walk' }, 0.35); await shot('chinka-robe');
  // both dancing, side by side
  await page.evaluate(() => {
    const B = window.BRADY_BURNS, D = B.debug, s = D.scene(), p = s.player, C = window.__chars;
    C.brady.play('dance', { loop: true, restart: true, time: 0.3 }); C.chinka.play('dance', { loop: true, restart: true });
    const cx = (C.brady.x + C.chinka.x) / 2, cz = (C.brady.z + C.chinka.z) / 2;
    const dx = C.brady.x - C.chinka.x, dz = C.brady.z - C.chinka.z, d = Math.hypot(dx, dz) || 1;
    const nx = -dz / d, nz = dx / d;      // perpendicular to the pair
    const ex = cx + nx * 3.6, ez = cz + nz * 3.6;
    for (const k in C) C[k].yaw = Math.atan2(ex - C[k].x, ez - C[k].z);
    s.camMode = 'first'; s.camYaw = Math.atan2(cx - ex, cz - ez);
    const eye = s.world.height(ex, ez) + 1.62; s.camPitch = 0.3 + Math.atan2(eye - 0.9, 3.6) / 1.2; s.snapCam = true; s.lastManual = s.time;
    D.teleport(ex, ez); p.yaw = s.camYaw; D.sim(0.7); s.camYaw = Math.atan2(cx - ex, cz - ez); p.yaw = s.camYaw;
  });
  await shot('both-dance');
  // wide: third person, the pair in front of the player, Chinka waving, Brady idling
  await page.evaluate(() => {
    const B = window.BRADY_BURNS, D = B.debug, s = D.scene(), p = s.player, C = window.__chars;
    C.brady.play('idle', { loop: true, restart: true }); C.chinka.play('wave', { loop: true, restart: true });
    const cx = (C.brady.x + C.chinka.x) / 2, cz = (C.brady.z + C.chinka.z) / 2;
    const dx = C.brady.x - C.chinka.x, dz = C.brady.z - C.chinka.z, d = Math.hypot(dx, dz) || 1;
    const nx = -dz / d, nz = dx / d, ex = cx + nx * 4.5, ez = cz + nz * 4.5;
    for (const k in C) C[k].yaw = Math.atan2(ex - C[k].x, ez - C[k].z);
    s.camMode = 'normal'; D.teleport(ex, ez); p.yaw = Math.atan2(cx - ex, cz - ez); s.camYaw = p.yaw; s.camPitch = 0.3; s.snapCam = true;
    D.sim(0.8);
  });
  await shot('both-wide');
  const stats = await page.evaluate(() => { const s = window.BRADY_BURNS.debug.scene(); return { draws: s.stats.draws, tris: s.stats.tris, maxBones: window.BRADY_BURNS.BurnsGL.maxBones, tier: window.BRADY_BURNS.BurnsGL.tier }; });
  console.log('stats      ', JSON.stringify(stats));
  await ctx.close(); await browser.close(); srv.close();
  let bad = false;
  if (errs.length) { console.log('ERRORS:\n' + errs.slice(0, 10).join('\n')); bad = true; }
  if (warns.length) { console.log('WARNINGS:\n' + warns.slice(0, 10).join('\n')); bad = true; }
  if (missing.length) { console.log('MISSING CLIPS: ' + missing.join(', ')); bad = true; }
  for (const a of assets) if (a.nb > stats.maxBones) { console.log('FAIL: ' + a.name + ' has ' + a.nb + ' joints, the GPU palette holds ' + stats.maxBones); bad = true; }
  console.log((bad ? 'FAIL' : 'PASS') + ' shots in', out);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
