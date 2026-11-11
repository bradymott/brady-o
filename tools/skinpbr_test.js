// Textured skinned heroes (BurnsSkinPBR, docs/BURNS_GUIDE.md §6.12): fixture-driven tests + screenshots.
//   BRADY_DIST=… node tools/build.js && BRADY_DIST=… node tools/skinpbr_test.js [outDir=shots/skinpbr]
//   optional: BRADY_BASE_DIST=<a build of the base commit> adds the back-compat proof (pixel diff + identical stats of
//   the untextured characters and an Art Cart driver, frame-locked: fixed clock, seeded Math.random, pumped frames)
// The fixture (tools/make_skin_fixture.js) is generated into $BRADY_DIST/fixtures and packed like the build packs models
// (tools/hero_glb.js + gltfpack + gzip) into <site>/<app>/skintest/: a test-only folder, never in models/index.json.
// Exits non-zero on any failure.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http'), zlib = require('zlib'), { execSync } = require('child_process');
const root = path.join(__dirname, '..');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(root, 'dist');
const base = process.env.BRADY_BASE_DIST ? path.resolve(process.env.BRADY_BASE_DIST) : null;
const out = path.resolve(process.argv[2] || path.join(root, 'shots', 'skinpbr'));
const ONLY = process.env.SKINPBR_ONLY ? process.env.SKINPBR_ONLY.split(',') : null;   // run some sections only (dev)
const want = k => !ONLY || ONLY.includes(k);
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) failures++; };

/* ---------------- fixture: generate + pack ---------------- */
function fixtures(site) {
  const fx = path.join(dist, 'fixtures'), gen = path.join(__dirname, 'make_skin_fixture.js');
  const stale = !fs.existsSync(path.join(fx, 'skinfix_check.json')) || fs.statSync(gen).mtimeMs > fs.statSync(path.join(fx, 'skinfix_check.json')).mtimeMs;
  if (stale) execSync(`node "${gen}" "${fx}"`, { stdio: 'inherit' });
  const { packGLB } = require('./hero_glb'), gp = path.join(root, 'node_modules', '.bin', 'gltfpack');
  for (const app of ['burning-man', 'art-cart']) {
    const d = path.join(site, app, 'skintest'); if (!fs.existsSync(path.join(site, app))) continue;
    fs.mkdirSync(d, { recursive: true });
    for (const f of ['skinfix.glb', 'skinfix_check.glb', 'skinfix_check_notan.glb']) {
      const o = path.join(d, f + '.gz');
      if (!fs.existsSync(o) || fs.statSync(o).mtimeMs < fs.statSync(path.join(fx, f)).mtimeMs) fs.writeFileSync(o, zlib.gzipSync(fs.existsSync(gp) ? packGLB(gp, path.join(fx, f), path.join(d, 'tmp-' + f), execSync) : fs.readFileSync(path.join(fx, f)), { level: 9 }));
    }
    fs.copyFileSync(path.join(fx, 'skinfix_check.glb'), path.join(d, 'skinfix_check_raw.glb'));   // unpacked: the tangent comparison
    fs.copyFileSync(path.join(fx, 'skinfix_check.json'), path.join(d, 'skinfix_check.json'));
  }
  return JSON.parse(fs.readFileSync(path.join(fx, 'skinfix_check.json'), 'utf8'));
}
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.gz': 'application/octet-stream' };
function serve(dir) {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(dir, p);
      if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' }));
  });
}
function png(w, h, rgba) {
  const crcT = new Int32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c; }
  const crc = b => { let c = -1; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (t, d) => { const L = Buffer.alloc(4); L.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const C = Buffer.alloc(4); C.writeUInt32BE(crc(td)); return Buffer.concat([L, td, C]); };
  const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------------- in-page helpers (installed once per page) ---------------- */
function pageHelpers() {
  const B = window.BRADY_BURNS, D = B.debug;
  const H = window.__T = {
    scene: () => D.scene(),
    frame: () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
    // the camera, overridden after the game's own camera update (null = the game's)
    cam: null,
    hook(s) {
      if (s.__tHooked) return; s.__tHooked = true;
      const uc = s.updateCamera; s.updateCamera = function (f) { uc.call(this, f); if (H.cam) Object.assign(this.cam, H.cam); };
      const cl = s.collectLights; s.collectLights = function (env) { for (const L of H.lights || []) this.plights.push(L); return cl.call(this, env); };
    },
    lights: [],
    look(x, y, z, tx, ty, tz, fov) { H.cam = { x, y, z, tx, ty, tz }; if (fov) H.cam.fov = fov; },
    // world point -> #game canvas pixel (the GL frame is stretched over the whole canvas)
    px(x, y, z) {
      const s = D.scene(), m = s.R.VP, cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15];
      const c = window.BRADY.Game.canvas; return [Math.round((cx / cw * 0.5 + 0.5) * c.width), Math.round((0.5 - cy / cw * 0.5) * c.height), cw];
    },
    rgb(px, py, r) {   // mean colour of a (2r+1)^2 block of the visible canvas
      const c = window.BRADY.Game.canvas, x = c.getContext('2d'); r = r || 2;
      const d = x.getImageData(px - r, py - r, 2 * r + 1, 2 * r + 1).data; let R = 0, G = 0, Bb = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; Bb += d[i + 2]; n++; }
      return [Math.round(R / n), Math.round(G / n), Math.round(Bb / n)];
    },
    // a bind-space point on a joint of a skinned character -> world
    jointPt(ch, joint, p) { const P = ch.palette, k = ch.asset.jointOf[joint] * 12; return [P[k] * p[0] + P[k + 1] * p[1] + P[k + 2] * p[2] + P[k + 3], P[k + 4] * p[0] + P[k + 5] * p[1] + P[k + 6] * p[2] + P[k + 7], P[k + 8] * p[0] + P[k + 9] * p[1] + P[k + 10] * p[2] + P[k + 11]]; },
    stats() { const s = D.scene(); return { draws: s.stats.draws, tris: s.stats.tris, shDraws: s.stats.shDraws, shTris: s.stats.shTris }; },
    sky(name, tod) { const s = D.scene(); s.palA = name; s.palB = null; s.tod = tod || 0; s.todTarget = null; }
  };
  return true;
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const site = path.join(dist, 'site');
  const FX = fixtures(site);
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const errs = [];
  const open = async (dir, w, h, init) => {
    const ctx = await browser.newContext({ viewport: { width: w || 874, height: h || 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.__cartFixedQ = 1; });
    if (init) await ctx.addInitScript(init);
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(dir + ' pageerror: ' + e.message.slice(0, 300)));
    page.on('console', m => { const t = m.text(); if (m.type() === 'error' || (m.type() === 'warning' && /BurnsSkinPBR|shader|link/i.test(t))) errs.push(dir + ' ' + m.type() + ': ' + t.slice(0, 300)); });
    await page.goto(url + dir + '/');
    return page;
  };
  const shot = (page, n) => page.screenshot({ path: path.join(out, n), timeout: 180000 });

  /* ================= Burning Man: features ================= */
  let page = await open('burning-man');
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.debug && window.BRADY_BURNS.BurnsSkinActor && window.BRADY_BURNS.BurnsSkinActor.ready && window.BRADY_BURNS.debug.skinHero, null, { timeout: 120000 });
  await page.evaluate(pageHelpers);
  // the shipped characters stay on the untextured path
  const old = await page.evaluate(() => { const A = window.BRADY_BURNS.BurnsSkinActor.assets; return Object.keys(A).map(k => ({ kind: k, name: A[k].name, textured: !!A[k].textured, stub: !!A[k].geo.skinPbr, stride: A[k].geo.stride, tris: A[k].tris })); });
  check('old GLBs (brady, chinka) take the untextured 32-byte path', old.length >= 2 && old.every(a => !a.textured && !a.stub && a.stride === 32), old);
  await page.evaluate(() => { localStorage.clear(); window.__burnsHideHUD = true; window.BRADY_BURNS.debug.play(1); });
  await page.waitForFunction(() => { const s = window.BRADY_BURNS.debug.scene(); return s && s.player && s.world && s.state !== 'load'; }, null, { timeout: 120000 });
  await page.evaluate(() => { const D = window.BRADY_BURNS.debug, s = D.scene(); D.skipCine(); s.dayCardT = -1; __T.hook(s); const p = s.player; D.teleport(p.x + 40, p.z + 6); p.yaw = Math.PI; s.camYaw = Math.PI; D.sim(0.5); });
  const load = await page.evaluate(() => window.BRADY_BURNS.debug.skinHero('skintest/skinfix_check.glb.gz', { name: 'skinfix_check' }).then(r => Object.assign(r, window.BRADY_BURNS.debug.skinPbr())));
  const A0 = load.assets.find(a => a.name === 'skinfix_check');
  check('fixture loads on the textured path', load.textured && !!A0, { tris: load.tris, nb: load.nb, clips: load.clips.length });
  check('three LODs, <= 3 draws each (opaque body + glow + cutout hair)', A0 && A0.lods.length === 3 && A0.lods.every(L => L && L.draws <= 3) && A0.lods[0].draws === 3, A0 && A0.lods.map(L => L && { tris: L.tris, draws: L.draws, parts: L.parts }));
  check('31 joints (26 body + 5 face) within the palette', A0 && A0.nb === 31 && (await page.evaluate(() => window.BRADY_BURNS.BurnsGL.maxBones)) >= 31, { nb: A0 && A0.nb });
  check('face poses found (jaw, smile, blink) and kept out of the clip list', A0 && ['jaw', 'smile', 'blink'].every(k => A0.face.includes(k)) && A0.clips === 19, A0 && A0.face);
  // all 19 clips: finite palettes through each clip
  const clips = await page.evaluate(() => {
    const S = window.BRADY_BURNS.BurnsSkin, A = S.get('skinfix_check'), ch = new window.BRADY_BURNS.BurnsSkinnedChar(A), bad = [];
    for (const nm of A.clipNames) { ch.play(nm, { restart: true, fade: 0 }); for (let k = 0; k <= 8; k++) { ch.update(A.clips[nm].duration / 8 || 0.1); const P = ch.compute(); for (let i = 0; i < P.length; i++) if (!isFinite(P[i])) { bad.push(nm); break; } } }
    return { n: A.clipNames.length, names: A.clipNames.join(','), bad };
  });
  check('all 19 clips play with finite joint matrices', clips.n === 19 && !clips.bad.length, clips);

  // a hero 'H' standing on open playa, facing +Z (toward a camera we place in front)
  const placeHero = (name, dx, dz, yaw, clip) => page.evaluate(([name, dx, dz, yaw, clip]) => {
    const D = window.BRADY_BURNS.debug, s = D.scene(), p = s.player, S = window.BRADY_BURNS.BurnsSkin;
    for (const c of S.chars.slice()) if (c.__t) S.remove(c);
    const x = p.x + dx, z = p.z + dz, ch = S.spawn(name, x, s.world.height(x, z), z, yaw); ch.__t = true; ch.play(clip || 'idle', { restart: true, fade: 0 }); ch.speed = clip === 'idle' ? 0 : 1; window.__hero = ch;
    return { x: ch.x, y: ch.y, z: ch.z };
  }, [name, dx, dz, yaw, clip]);
  const H0 = await placeHero('skinfix_check', 0, -12, 0);   // 12 m behind Brady (he faces -Z), facing +Z
  // the badge: four solid quadrants read back through UVs and textures
  if (want('badge')) {
    await page.evaluate(([h]) => { __T.sky('day'); __T.look(h.x, h.y + 1.35, h.z + 1.25, h.x, h.y + 1.3, h.z); }, [H0]);
    await page.evaluate(() => __T.frame()); await page.waitForTimeout(400); await page.evaluate(() => __T.frame());
    const badge = await page.evaluate(([fx]) => { const h = window.__hero; return fx.badge.map(b => { const w = __T.jointPt(h, fx.joint, b.p), q = __T.px(w[0], w[1], w[2]); return { name: b.name, px: q.slice(0, 2), rgb: __T.rgb(q[0], q[1], 3) }; }); }, [FX]);
    await shot(page, 'check_badge_day.png');
    const dom = { red: c => c[0] > 1.6 * c[1] && c[0] > 1.6 * c[2], green: c => c[1] > 1.3 * c[0] && c[1] > 1.3 * c[2], blue: c => c[2] > 1.3 * c[0] && c[2] > 1.3 * c[1], yellow: c => c[0] > 1.6 * c[2] && c[1] > 1.6 * c[2] && c[1] > 0.6 * c[0] };
    check('textures bound and sampled: badge quadrants read back red/green/blue/yellow where the UVs put them', badge.every(b => dom[b.name](b.rgb)), badge);
  }
  // hair-card cutout: banner holes show what is behind, solid cells are magenta (camera behind the hero)
  if (want('cutout')) {
    await page.evaluate(([h]) => { __T.look(h.x + 0.05, h.y + 2.3, h.z - 1.7, h.x, h.y + 2.25, h.z); }, [H0]);
    await page.evaluate(() => __T.frame()); await page.waitForTimeout(300); await page.evaluate(() => __T.frame());
    const cells = await page.evaluate(([fx]) => { const h = window.__hero; return fx.banner.map(b => { const w = __T.jointPt(h, fx.joint, b.p), q = __T.px(w[0], w[1], w[2]); return { solid: b.solid, px: q.slice(0, 2), rgb: __T.rgb(q[0], q[1], 2) }; }); }, [FX]);
    await shot(page, 'check_cutout_banner.png');
    const mag = c => c[0] > 1.5 * c[1] && c[2] > 1.5 * c[1];
    const sOK = cells.filter(c => c.solid).every(c => mag(c.rgb)), hOK = cells.filter(c => !c.solid).every(c => !mag(c.rgb));
    const a2c = await page.evaluate(() => window.BRADY_BURNS.BurnsSkinPBR.n.a2c);
    check('alpha cutout: solid banner cells magenta, holes show the background', sOK && hOK, { solid: cells.filter(c => c.solid).map(c => c.rgb), holes: cells.filter(c => !c.solid).map(c => c.rgb) });
    check('cutout drawn with alpha to coverage on the MSAA target', a2c > 0, { a2cDraws: a2c });
  }
  // the cutout in the shadow pass: the banner's shadow on the ground has holes
  if (want('shadow')) {
    // a giant (×3) hero, so the banner's 10 cm cells cover several shadow-map texels after the PCF blur
    await page.evaluate(() => { __T.sky({ sun: [140, 38] }); window.__hero.scale = 3; });   // dusk colours, a higher sun: strong, short shadows
    await page.evaluate(() => __T.frame());
    const sp = await page.evaluate(([fx]) => {
      const h = window.__hero, s = __T.scene(), L = s.R.envRef.keyDir, gy = h.y;
      const g = fx.banner.map(b => { const w = __T.jointPt(h, fx.joint, b.p), k = (w[1] - gy) / L[1]; return { solid: b.solid, g: [w[0] - L[0] * k, gy + 0.01, w[2] - L[2] * k] }; });
      const c = g.reduce((a, b) => [a[0] + b.g[0] / g.length, a[1], a[2] + b.g[2] / g.length], [0, gy, 0]);
      __T.look(c[0] + 0.5, gy + 9, c[2] + 4, c[0], gy, c[2]);
      return { g, L: Array.from(L) };
    }, [FX]);
    await page.evaluate(() => __T.frame()); await page.waitForTimeout(300); await page.evaluate(() => __T.frame());
    const sh0 = await page.evaluate(() => window.BRADY_BURNS.BurnsSkinPBR.n.shCut);
    await page.evaluate(() => __T.frame());
    const lum = await page.evaluate(([g]) => g.map(c => { const q = __T.px(c.g[0], c.g[1], c.g[2]), r = __T.rgb(q[0], q[1], 2); return { solid: c.solid, px: q.slice(0, 2), l: Math.round(0.3 * r[0] + 0.59 * r[1] + 0.11 * r[2]) }; }), [sp.g]);
    const sh1 = await page.evaluate(() => window.BRADY_BURNS.BurnsSkinPBR.n.shCut);
    await shot(page, 'check_cutout_shadow.png');
    // the footprint of the banner's shadow (between its corner cells, 10x10 samples): with the cutout working
    // half of it is lit; the same frame with the banner forced opaque is the reference
    const foot = () => page.evaluate(([g]) => {
      const S = g.slice(), at = (s, t) => { const a = S[0].g, b = S[3].g, c = S[12].g, d = S[15].g, k = (u, v) => [u[0] + (v[0] - u[0]) * s, u[1], u[2] + (v[2] - u[2]) * s], top = k(a, b), bot = k(c, d); return [top[0] + (bot[0] - top[0]) * t, top[1], top[2] + (bot[2] - top[2]) * t]; };
      let sum = 0, n = 0; for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) { const w = at(0.05 + 0.9 * (i + 0.5) / 10, 0.05 + 0.9 * (j + 0.5) / 10), q = __T.px(w[0], w[1], w[2]), r = __T.rgb(q[0], q[1], 1); sum += 0.3 * r[0] + 0.59 * r[1] + 0.11 * r[2]; n++; }
      return Math.round(sum / n);
    }, [sp.g]);
    const lumCut = await foot();
    const setCut = on => page.evaluate(on => { for (const L of window.__hero.asset.lods) if (L) for (const p of L.parts) if (/hair_cards/.test(p.name)) { if (p.mat._cut === undefined) p.mat._cut = p.mat.cutoff; p.mat.cutoff = on ? p.mat._cut : -1; } return __T.frame().then(() => __T.frame()); }, on);
    await setCut(false); const lumSolid = await foot(); await shot(page, 'check_cutout_shadow_opaque_reference.png'); await setCut(true);
    check('cutout casts in the shadow pass (its own discard program)', sh1 > sh0, { shCutDraws: sh1 - sh0 });
    check('the banner shadow has holes (its footprint is clearly lighter than the same banner forced opaque)', lumCut > lumSolid * 1.1, { cutout: lumCut, opaqueReference: lumSolid, light: sp.L.map(v => +v.toFixed(2)) });
    await page.evaluate(() => { window.__hero.scale = 1; });
  }
  // draws per hero: the frame with and without the hero (LOD0 close)
  if (want('draws')) {
    await page.evaluate(([h]) => { __T.look(h.x, h.y + 1.5, h.z + 3, h.x, h.y + 1, h.z); }, [H0]);
    await page.evaluate(() => __T.frame()); await page.waitForTimeout(300);
    const on = await page.evaluate(() => __T.frame().then(() => __T.stats()));
    await page.evaluate(() => { window.__hero.visible = false; });
    const off = await page.evaluate(() => __T.frame().then(() => __T.frame()).then(() => __T.stats()));
    await page.evaluate(() => { window.__hero.visible = true; });
    check('one textured hero costs 3 draws at LOD0', on.draws - off.draws === 3, { on, off, tris: on.tris - off.tris });
  }
  // LOD switching with hysteresis (camera distance to the hips)
  if (want('lod')) {
    const lodAt = d => page.evaluate(([h, d]) => { __T.look(h.x, h.y + 1.0, h.z + d, h.x, h.y + 1.0, h.z); return __T.frame().then(() => __T.frame()).then(() => { const st = window.BRADY_BURNS.BurnsSkinPBR.lodState.get(window.__hero.palette); return st ? st.lod : -1; }); }, [H0, d]);
    const seq = [5, 8.5, 9.2, 14, 21, 22.6, 30, 21, 17.5, 9, 6.9, 5];
    const got = []; for (const d of seq) got.push(await lodAt(d));
    const expect = [0, 0, 1, 1, 1, 2, 2, 2, 1, 1, 0, 0];   // switches at 8 / 20 m ±12 %
    check('LOD switches at 8/20 m with ±12 % hysteresis', JSON.stringify(got) === JSON.stringify(expect), { distances: seq, got, expect });
  }
  // texture sizes per tier (re-decoded on a tier change)
  if (want('tier')) {
    const sizes = t => page.evaluate(t => { window.BRADY_BURNS.BurnsGL.configure(t); return new Promise(r => setTimeout(r, 1500)).then(() => __T.frame()).then(() => new Promise(r => setTimeout(r, 1500))).then(() => __T.frame()).then(() => { const a = window.BRADY_BURNS.BurnsSkinPBR.assets.find(a => a.name === 'skinfix_check'); return a.textures.map(T => T.name + ' ' + T.w + 'x' + T.h); }); }, t);
    const med = await sizes('medium'), hi = await sizes('high');
    check('medium tier: textures at most 1024', med.every(s => +s.split(' ')[1].split('x')[0] <= 1024) && med.some(s => /1024x1024/.test(s)), med);
    check('high tier: the 2048 atlas at full size', hi.some(s => /atlas_check 2048x2048/.test(s)), hi);
  }
  // tangents derived by the loader match the authored (MikkTSpace-convention) ones
  if (want('tangents')) {
    const tan = await page.evaluate(() => {
      const G = window.BRADY_BURNS.BurnsGLTF, X = window.BRADY_BURNS.BurnsSkinPBR;
      return G.fetch('skintest/skinfix_check_raw.glb').then(D1 => G.fetch('skintest/skinfix_check_raw.glb').then(D2 => {
        for (const M of D2.json.meshes) for (const p of M.primitives) delete p.attributes.TANGENT;
        const a = X.build(D1, { name: 'tanA' }), b = X.build(D2, { name: 'tanB' }); X.release(a); X.release(b);
        let n = 0, agree = 0, sign = 0;
        a.lods.forEach((L, li) => L.parts.forEach((P, pi) => {
          const A8 = new Int8Array(P.geo.data), B8 = new Int8Array(b.lods[li].parts[pi].geo.data);
          for (let i = 0; i < P.geo.nv; i++) { const o = i * 36 + 16; const d = (A8[o] * B8[o] + A8[o + 1] * B8[o + 1] + A8[o + 2] * B8[o + 2]) / (127 * 127); n++; if (d > 0.9) agree++; if (Math.sign(A8[o + 3]) === Math.sign(B8[o + 3])) sign++; }
        }));
        return { n, agree: +(agree / n).toFixed(4), sign: +(sign / n).toFixed(4) };
      }));
    });
    check('loader-derived tangents match authored ones (direction and bitangent sign)', tan.agree > 0.97 && tan.sign > 0.97, tan);
  }
  // face: jaw / blink / smile poses move their joints; automatic blink; the talk hook
  if (want('face')) {
    const face = await page.evaluate(() => {
      const X = window.BRADY_BURNS.BurnsSkinPBR, h = window.__hero, f = X.face(h), pt = j => __T.jointPt(h, j, [0, 0, 0.1]).map(v => +v.toFixed(4));
      h.speed = 0; h.compute(); const jaw0 = pt('mixamorig:Jaw'), lid0 = pt('mixamorig:LeftEyelid');
      f.set('jaw', 1); f.set('blink', 1); h.compute(); const jaw1 = pt('mixamorig:Jaw'), lid1 = pt('mixamorig:LeftEyelid');
      f.set('jaw', null); f.set('blink', null);
      let blinks = 0; for (let i = 0; i < 600; i++) { h.update(1 / 60); if (f.w.blink > 0.5) blinks++; }
      f.say(1.5); let talk = 0; for (let i = 0; i < 60; i++) { h.update(1 / 60); talk = Math.max(talk, f.w.jaw); }
      const viaChar = !!X.face(window.BRADY_BURNS.debug.scene().player.ch) === false;   // the untextured player has no face poses
      return { jawMoved: Math.hypot(jaw1[0] - jaw0[0], jaw1[1] - jaw0[1], jaw1[2] - jaw0[2]), lidMoved: Math.hypot(lid1[0] - lid0[0], lid1[1] - lid0[1], lid1[2] - lid0[2]), blinkFrames: blinks, talkJaw: +talk.toFixed(2), oldPlayerNoFace: viaChar };
    });
    check('face poses move the jaw and eyelid joints', face.jawMoved > 0.01 && face.lidMoved > 0.01, face);
    check('automatic blink fires within 10 s, say() drives the jaw, untextured characters get no face', face.blinkFrames > 0 && face.talkJaw > 0.3 && face.oldPlayerNoFace, face);
  }
  // behind the same BurnsSkinActor API: the fixture stands in as the player's Brady
  if (want('actor')) {
    const act = await page.evaluate(() => {
      const B = window.BRADY_BURNS, SA = B.BurnsSkinActor, keep = SA.assets.brady, d0 = SA.drawn, n0 = B.BurnsSkinPBR.n.draws;
      return B.debug.skinHero('skintest/skinfix_check.glb.gz', { name: 'skinfix_check', as: 'brady' }).then(() => { __T.cam = null; return __T.frame(); }).then(() => __T.frame()).then(() => {
        const p = B.debug.scene().player, r = { skinned: SA.drawn - d0, heroDraws: B.BurnsSkinPBR.n.draws - n0, bridge: !!(p.ch._skinActor && p.ch._skinActor.asset.textured) };
        window.__keepBrady = keep; return r;
      });
    });
    await shot(page, 'actor_player_textured.png');
    await page.evaluate(() => { const SA = window.BRADY_BURNS.BurnsSkinActor; SA.assets.brady = window.__keepBrady; });
    check('BurnsSkinActor draws a textured asset through the unchanged hooks (player Brady)', act.skinned > 0 && act.heroDraws > 0 && act.bridge, act);
  }
  // release frees the GPU textures and buffers
  if (want('release')) {
    const rel = await page.evaluate(() => {
      const B = window.BRADY_BURNS, X = B.BurnsSkinPBR, s = B.debug.scene();
      return X.preloadFor(s, 'skintest/skinfix.glb.gz', 'tmpHero').then(a => { const ch = B.BurnsSkin.spawn('tmpHero', s.player.x, s.player.y, s.player.z - 4, 0); return __T.frame().then(() => __T.frame()).then(() => { const up = a.textures.filter(T => T.tex).length; B.BurnsSkin.remove(ch); X.release(a); return { owner: a.owner === s, uploaded: up, after: a.textures.filter(T => T.tex).length, geo: a.lods[0].parts.every(p => !p.geo.vbo), registered: !!B.BurnsSkin.get('tmpHero') }; }); });
    });
    check('world-owned heroes: release() frees textures and buffers', rel.owner && rel.uploaded > 0 && rel.after === 0 && rel.geo && !rel.registered, rel);
  }
  await page.context().close();

  /* ================= screenshots ================= */
  if (want('shots')) await (async () => {
    page = await open('burning-man');
    await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.debug && window.BRADY_BURNS.BurnsSkinActor && window.BRADY_BURNS.BurnsSkinActor.ready && window.BRADY_BURNS.debug.skinHero, null, { timeout: 120000 });
    await page.evaluate(pageHelpers);
    const go = async (world) => {
      await page.evaluate(w => { localStorage.clear(); window.__burnsHideHUD = true; window.BRADY_BURNS.debug.play(w); }, world);
      await page.waitForFunction(() => { const s = window.BRADY_BURNS.debug.scene(); return s && s.player && s.world && s.state !== 'load'; }, null, { timeout: 180000 });
      await page.evaluate(() => { const D = window.BRADY_BURNS.debug, s = D.scene(); D.skipCine(); s.dayCardT = -1; __T.hook(s); D.sim(0.3); });
      await page.evaluate(() => window.BRADY_BURNS.debug.skinHero('skintest/skinfix.glb.gz', { name: 'skinfix' }));
    };
    const settle = () => page.evaluate(() => { const s = __T.scene(); if (s.banners) s.banners.length = 0; if (s.toasts) s.toasts.length = 0; return __T.frame(); }).then(() => page.waitForTimeout(700)).then(() => page.evaluate(() => __T.frame()));
    await go(1);
    // the look variant beside the current Brady, by day; then a close-up; sunset; night under neon
    const P0 = await page.evaluate(() => { const D = window.BRADY_BURNS.debug, s = D.scene(), p = s.player; D.teleport(p.x + 40, p.z + 6); p.yaw = 0; s.camYaw = 0; D.sim(0.3); return { x: p.x, y: p.y, z: p.z }; });
    await placeHero('skinfix', -0.9 - 0, -0, 0, 'idle');
    await page.evaluate(([p]) => { const h = window.__hero; h.x = p.x - 0.9; h.z = p.z; h.y = p.y; window.BRADY_BURNS.debug.scene().player.x += 0.9; __T.sky('day'); __T.look(p.x, p.y + 1.25, p.z + 3.6, p.x, p.y + 0.95, p.z); }, [P0]);
    await settle(); await shot(page, 'compare_vs_brady_day.png');
    await page.evaluate(([p]) => { const h = window.__hero; __T.look(h.x + 0.25, h.y + 1.62, h.z + 0.85, h.x, h.y + 1.52, h.z); window.BRADY_BURNS.debug.scene().player.x += 5; }, [P0]);
    await settle(); await shot(page, 'closeup_face_day.png');
    await page.evaluate(() => { const h = window.__hero; h.play('wave', { restart: true }); h.speed = 1; __T.look(h.x - 0.9, h.y + 1.35, h.z + 1.3, h.x, h.y + 1.25, h.z); });
    await page.waitForTimeout(900); await settle(); await shot(page, 'closeup_arm_tattoo_day.png');
    await page.evaluate(() => { const h = window.__hero; h.play('idle', { restart: true }); h.speed = 0; __T.look(h.x + 0.2, h.y + 1.9, h.z - 0.9, h.x, h.y + 1.6, h.z); });
    await settle(); await shot(page, 'closeup_hair_cards_back_day.png');
    await page.evaluate(() => { const h = window.__hero; __T.sky('night'); __T.lights = [{ x: h.x + 1.2, y: h.y + 1.8, z: h.z + 0.8, r: 6, c: [1, 0.15, 0.75], i: 1.6 }, { x: h.x - 1.3, y: h.y + 1.2, z: h.z + 0.6, r: 6, c: [0.1, 0.8, 1], i: 1.6 }]; __T.look(h.x + 0.3, h.y + 1.55, h.z + 1.5, h.x, h.y + 1.35, h.z); });
    await settle(); await shot(page, 'night_neon_closeup.png');
    await page.evaluate(() => { const h = window.__hero; __T.look(h.x, h.y + 1.2, h.z + 3.2, h.x, h.y + 0.95, h.z); });
    await settle(); await shot(page, 'night_neon_full.png');
    await page.evaluate(() => { __T.lights = []; });
    // full body at each LOD (forced, same framing) and at real switching distances
    for (const L of [0, 1, 2]) {
      await page.evaluate(L => { const h = window.__hero; __T.sky('day'); window.BRADY_BURNS.BurnsSkinPBR.forceLod = L; __T.look(h.x, h.y + 1.1, h.z + 3.2, h.x, h.y + 0.92, h.z); }, L);
      await settle(); await shot(page, 'lod' + L + '_full_body.png');
    }
    await page.evaluate(() => { window.BRADY_BURNS.BurnsSkinPBR.forceLod = null; });
    // two textured heroes + stats
    const two = await page.evaluate(() => {
      const S = window.BRADY_BURNS.BurnsSkin, h = window.__hero, b = S.spawn('skinfix', h.x + 1.3, h.y, h.z + 0.3, -0.4); b.__t = true; b.play('dance'); window.__hero2 = b; h.play('talk'); h.speed = 1;
      __T.look(h.x + 0.65, h.y + 1.3, h.z + 4.2, h.x + 0.65, h.y + 0.95, h.z);
      return true;
    });
    await settle();
    const st2 = await page.evaluate(() => Object.assign(__T.stats(), { hero: window.BRADY_BURNS.BurnsSkinPBR.stats().assets.find(a => a.name === 'skinfix').memory }));
    await shot(page, 'two_heroes_day.png');
    console.log('two heroes', JSON.stringify(st2));
    // Root Society at sunset (World 17)
    await go(17);
    await page.evaluate(() => { const D = window.BRADY_BURNS.debug, s = D.scene(), p = s.player; __T.sky('dusk'); const x = p.x + Math.sin(p.yaw) * 2.2, z = p.z + Math.cos(p.yaw) * 2.2; const S = window.BRADY_BURNS.BurnsSkin, h = S.spawn('skinfix', x, s.world.height(x, z), z, p.yaw + Math.PI); h.__t = true; h.play('idle'); window.__hero = h; const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw); __T.look(x - fx * 2.0 + fz * 0.5, h.y + 1.45, z - fz * 2.0 - fx * 0.5, x, h.y + 1.2, z); p.x -= fx * 6; p.z -= fz * 6; });
    await settle(); await page.waitForTimeout(800); await shot(page, 'root_society_sunset.png');
    // side-lit: the hero turned so the low sun rakes across the face, camera at three-quarters
    await page.evaluate(() => { const h = window.__hero, s = __T.scene(), L = s.R.envRef.keyDir, a = Math.atan2(L[0], L[2]); h.yaw = a + 1.1; const cy = h.yaw + 0.35; __T.look(h.x + Math.sin(cy) * 1.0, h.y + 1.62, h.z + Math.cos(cy) * 1.0, h.x, h.y + 1.52, h.z); });
    await settle(); await shot(page, 'root_society_sunset_close.png');
    await page.context().close();
  })();

  /* ================= back-compat: frame-locked pixel diff against the base build ================= */
  if (base && want('backcompat')) await (async () => {
    const { srv: srvB, url: urlB } = await serve(path.join(base, 'site'));
    const lockInit = () => {
      let now = 1000; const q = [];
      performance.now = () => now;
      window.requestAnimationFrame = cb => { q.push(cb); return q.length; }; window.cancelAnimationFrame = () => {};
      window.__pump = (n, dt) => { for (let i = 0; i < n; i++) { now += dt || 1000 / 60; const cbs = q.splice(0); for (const cb of cbs) { try { cb(now); } catch (e) { console.error(e); } } } };
      let s = 1; Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647; window.__seed = (v, t) => { s = v; if (t) now = t; };
    };
    const runScene = async (u, which) => {
      const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await ctx.addInitScript(() => { window.__cartFixedQ = 1; }); await ctx.addInitScript(lockInit);
      const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push('bc pageerror: ' + e.message.slice(0, 200)));
      const app = which.startsWith('cart') ? 'art-cart' : 'burning-man';
      if (app === 'art-cart') {   // put the character files beside the cart app (as skinactor_test does) — same files in both builds
        for (const d of [u === urlB ? base : dist]) { const cm = path.join(d, 'site', 'art-cart', 'models'), bm = path.join(d, 'site', 'burning-man', 'models'), idx = path.join(cm, 'index.json'), list = JSON.parse(fs.readFileSync(idx, 'utf8')); for (const f of ['brady.glb.gz', 'chinka.glb.gz']) { fs.copyFileSync(path.join(bm, f), path.join(cm, f)); if (!list.includes(f)) list.push(f); } fs.writeFileSync(idx, JSON.stringify(list)); }
      }
      await pg.goto(u + app + '/');
      // pump frames (real-time waits only for the async loads)
      const until = async (fn, arg, max) => { for (let i = 0; i < (max || 600); i++) { if (await pg.evaluate(fn, arg)) return true; await pg.evaluate(() => window.__pump(2)); await pg.waitForTimeout(20); } return false; };
      await until(() => window.BRADY_BURNS && window.BRADY_BURNS.debug && window.BRADY_BURNS.BurnsSkinActor && window.BRADY_BURNS.BurnsSkinActor.ready && (!window.BRADY_BURNS.CartGLB || window.BRADY_BURNS.CartGLB.ready));
      let res;
      if (app === 'burning-man') {
        await pg.evaluate(() => { localStorage.clear(); window.__burnsHideHUD = true; window.__seed(42, 100000); window.BRADY_BURNS.debug.play(1); });
        await until(() => { const s = window.BRADY_BURNS.debug.scene(); return s && s.player && s.world && s.state !== 'load'; });
        await pg.evaluate(night => {
          const D = window.BRADY_BURNS.debug, s = D.scene(), p = s.player; D.skipCine(); s.dayCardT = -1; D.teleport(p.x + 40, p.z + 6); p.yaw = Math.PI; s.camYaw = Math.PI;
          if (night) { s.palA = 'night'; s.palB = null; s.tod = 0; s.todTarget = null; }
          const x = p.x + Math.sin(p.yaw) * 3, z = p.z + Math.cos(p.yaw) * 3;
          s.spawnActor({ id: 'chinkaTest', type: 'chinka', name: 'CHINKA', x, z, yaw: p.yaw + Math.PI, behavior: 'idle', noTalk: true, chatter: false, always: true });
          window.__seed(7); D.sim(0.5);
        }, which === 'bm-night');
        await pg.evaluate(() => window.__pump(30));
      } else {
        await pg.evaluate(() => { window.__seed(42, 100000); const B = window.BRADY_BURNS, s = window.BRADY.Game.scene; s.state = 'car'; s.carSel = Math.max(0, B.CART_CARS.findIndex(c => c.id === 'heart')); s.drvSel = 0; s.spin = 0.9; s.time = 0; s.t = 0; s.pcar = null; s.build(); });
        await pg.evaluate(() => window.__pump(60));
      }
      res = await pg.evaluate(() => {
        const c = window.BRADY.Game.canvas, x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data, s = window.BRADY.Game.scene, st = s.stats || (s.R && s.R.stats) || {};
        let bin = ''; const CH = 0x8000; for (let i = 0; i < d.length; i += CH) bin += String.fromCharCode.apply(null, d.subarray(i, i + CH));
        const SA = window.BRADY_BURNS.BurnsSkinActor;
        return { w: c.width, h: c.height, b64: btoa(bin), stats: { draws: st.draws, tris: st.tris, shDraws: st.shDraws, shTris: st.shTris }, skinned: SA.drawn };
      });
      await ctx.close();
      return res;
    };
    for (const which of ['bm-dusk', 'bm-night', 'cart-showroom']) {
      const a = await runScene(urlB, which), b = await runScene(url, which), a2 = await runScene(urlB, which);
      const A = Buffer.from(a.b64, 'base64'), Bf = Buffer.from(b.b64, 'base64'), A2 = Buffer.from(a2.b64, 'base64');
      const diff = (X, Y) => { let n = 0, mx = 0; for (let i = 0; i < X.length; i += 4) { const d = Math.max(Math.abs(X[i] - Y[i]), Math.abs(X[i + 1] - Y[i + 1]), Math.abs(X[i + 2] - Y[i + 2])); if (d) n++; if (d > mx) mx = d; } return { pixels: n, max: mx }; };
      const dAB = diff(A, Bf), noise = diff(A, A2);
      fs.writeFileSync(path.join(out, 'backcompat_' + which + '_base.png'), png(a.w, a.h, A));
      fs.writeFileSync(path.join(out, 'backcompat_' + which + '_branch.png'), png(b.w, b.h, Bf));
      const D = Buffer.alloc(A.length); for (let i = 0; i < A.length; i += 4) { const d = Math.max(Math.abs(A[i] - Bf[i]), Math.abs(A[i + 1] - Bf[i + 1]), Math.abs(A[i + 2] - Bf[i + 2])); D[i] = D[i + 1] = D[i + 2] = d ? 255 : Math.round(A[i] * 0.25); D[i + 3] = 255; }
      fs.writeFileSync(path.join(out, 'backcompat_' + which + '_diff.png'), png(a.w, a.h, D));
      check('back-compat ' + which + ': identical pixels and stats vs the base build', dAB.pixels === 0 && JSON.stringify(a.stats) === JSON.stringify(b.stats) && a.skinned > 0 && b.skinned > 0, { diff: dAB, baseVsBase: noise, base: a.stats, branch: b.stats, skinnedDrawsSoFar: [a.skinned, b.skinned] });
    }
    srvB.close();
  })();

  /* ================= Art Cart: a textured hero as a seated driver ================= */
  if (want('cart')) await (async () => {
    const cm = path.join(site, 'art-cart', 'models'), bm = path.join(site, 'burning-man', 'models');
    if (!fs.existsSync(cm)) return;
    const idx = path.join(cm, 'index.json'), list = JSON.parse(fs.readFileSync(idx, 'utf8'));
    for (const f of ['brady.glb.gz', 'chinka.glb.gz']) { if (fs.existsSync(path.join(bm, f))) { fs.copyFileSync(path.join(bm, f), path.join(cm, f)); if (!list.includes(f)) list.push(f); } }
    fs.writeFileSync(idx, JSON.stringify(list));
    page = await open('art-cart');
    await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready && window.BRADY_BURNS.BurnsSkinActor && window.BRADY_BURNS.BurnsSkinActor.ready && window.BRADY_BURNS.debug.skinHero, null, { timeout: 120000 });
    await page.evaluate(() => window.BRADY_BURNS.debug.skinHero('skintest/skinfix.glb.gz', { name: 'skinfix', as: 'brady' }));
    const d0 = await page.evaluate(() => window.BRADY_BURNS.BurnsSkinPBR.n.draws);
    await page.evaluate(() => { const B = window.BRADY_BURNS, s = window.BRADY.Game.scene; s.state = 'car'; s.carSel = Math.max(0, B.CART_CARS.findIndex(c => c.id === 'heart')); s.drvSel = 0; s.spin = 0.9; s.pcar = null; s.build(); });
    await page.waitForTimeout(2500);
    const d1 = await page.evaluate(() => window.BRADY_BURNS.BurnsSkinPBR.n.draws);
    await shot(page, 'cart_showroom_textured_driver.png');
    check('Art Cart: a textured hero drives through drawDriver unchanged', d1 > d0, { heroDraws: d1 - d0 });
    await page.context().close();
  })();

  await browser.close(); srv.close();
  const real = errs.filter(e => !/GPU stall|GL Driver Message/.test(e));
  console.log(real.length ? 'page errors/warnings:\n  ' + real.slice(0, 30).join('\n  ') : 'no page errors');
  check('no page errors, shader errors or loader warnings', !real.some(e => /pageerror|shader|link|error:/i.test(e)), real.length);
  console.log(failures ? failures + ' FAILED' : 'ALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
