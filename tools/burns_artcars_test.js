// Super Art Kart's cars as Black Rock City's art cars (src/41_burns_artcars.js), in the real game.
//   BRADY_DIST=<dist> node tools/burns_artcars_test.js [outDir=shots/artcars] [mode=all|cars|views|routes|budget]
// Serves $BRADY_DIST/site over http (file:// can't fetch the models), opens burning-man/ as an iPhone (medium tier,
// portrait 390x844 and landscape 844x390), plays the city (world 500) and:
//   cars    Brady beside every car by day (portrait), a few at night  -> car_<stem>.png, night_<stem>.png
//   views   street views with cars cruising (day + night, both orientations) and the same spots for comparison
//   routes  every street car's and circling car's route checked against the city's static colliders (camps, lamps,
//           art): fails if a route passes through one
//   budget  draws / triangles / shadow draws / frame time at fixed city views; car models loaded, memory
// Runs against an older build too (no BurnsArtCars: the procedural cars), so the same views make the "before" set.
// Fails on page errors.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'artcars'));
const mode = process.argv[3] || 'all';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.gz': 'application/octet-stream' };
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
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
const fails = [];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site);
  const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const errs = [];
  const open = async (w, h, world) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: IPHONE });
    await ctx.addInitScript(() => { window.__burnsHideHUD = true; });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
    await page.goto(url + 'burning-man/');
    await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.debug && window.BRADY, null, { timeout: 120000 });
    await page.evaluate(world => { localStorage.clear(); window.BRADY.Save.load(); window.BRADY_BURNS.debug.play(world || 500, { fresh: true }); }, world);
    await page.waitForFunction(w => { const D = window.BRADY_BURNS.debug, s = D.state(); return s.scene === 'BurnsPlayScene' && s.state === 'play' && s.world === (w || 500); }, world, { timeout: 240000 });
    for (let i = 0; i < 6; i++) { await page.waitForTimeout(300); await page.evaluate(() => { const D = window.BRADY_BURNS.debug, s = D.scene(); D.skipCine(); s.dayCardT = -1; }); }
    // hold the city still for comparable shots: the cars stop where they are (the parked ones are parked anyway)
    await page.evaluate(() => {
      const O = window.BRADY_BURNS.BURNS_OW; if (O && O.state) { for (const c of O.state.cars) c.w = 0; for (const c of O.state.cruise || []) c.v = 0; for (const b of O.state.bikes) b.v = 0; }
    });
    return page;
  };
  // sky: 'day' | 'night' | 'dusk'
  const sky = (page, k) => page.evaluate(k => { const s = window.BRADY_BURNS.debug.scene(); s.palA = k; s.palB = null; s.tod = 0; s.todTarget = null; if (window.BRADY_BURNS.BURNS_OW.state) window.BRADY_BURNS.BURNS_OW.state.palKey = 'test'; }, k);
  // Brady at (x, z) looking toward (tx, tz); waits for the tiles and the models; returns the frame's numbers
  const look = async (page, at, to, o) => {
    o = o || {};
    await page.evaluate(([at, to, o]) => {
      const D = window.BRADY_BURNS.debug, s = D.scene(); if (s.player.vehicle) try { s.player.vehicle.dismount(s.player); } catch (e) { /* */ }
      D.teleport(at[0], at[1]);
      if (s.tiles) s.tiles.prime(at[0], at[1], 300);
      s.camYaw = Math.atan2(to[0] - at[0], to[1] - at[1]); s.player.yaw = s.camYaw; s.snapCam = true;
      if (o.pitch !== undefined) s.camPitch = o.pitch; if (o.dist !== undefined) s.camDist = o.dist;
    }, [at, to, o]);
    await page.waitForTimeout(400);
    await page.waitForFunction(() => { const A = window.BRADY_BURNS.BurnsArtCars; return !A || !A.info().loading.length; }, null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(o.wait || 1500);
    return page.evaluate(() => {
      const D = window.BRADY_BURNS.debug, s = D.scene(), A = window.BRADY_BURNS.BurnsArtCars;
      // frame time: average of the next 40 real frames (headless: indicative only)
      return { draws: s.stats.draws, tris: s.stats.tris, shDraws: s.stats.shDraws, shTris: s.stats.shTris, cpu: +s.stats.cpu.toFixed(2), fps: +s.stats.fps.toFixed(1), tier: window.BRADY_BURNS.BurnsGL.tier, cars: A ? A.info() : null };
    });
  };
  const frameTime = page => page.evaluate(() => new Promise(res => { const t = []; let last = performance.now(); const f = () => { const n = performance.now(); t.push(n - last); last = n; if (t.length < 60) requestAnimationFrame(f); else { t.shift(); t.sort((a, b) => a - b); res({ median: +t[t.length >> 1].toFixed(1), p90: +t[Math.floor(t.length * 0.9)].toFixed(1) }); } }; requestAnimationFrame(f); }));
  const shot = (page, name) => page.screenshot({ path: path.join(out, name + '.png') });
  const report = { build: dist, mode, views: {}, cars: {}, routes: null };
  const hasCars = async page => page.evaluate(() => !!window.BRADY_BURNS.BurnsArtCars);
  // fixed city views (same spots before and after): [name, at, look at, sky]
  const VIEWS = [
    ['race_car', [-16, 248], [-24, 236], 'day'],          // Rae's race car by the 6:00 promenade (parked, drivable)
    ['drive_car', [244, 44], [232, 36], 'day'],           // the other drivable car, open playa by 3:00
    ['heart_place', null, null, 'day'],                   // the heart car at the World 7 door
    ['esplanade_6', [24, 318], [-60, 300], 'day'],        // the Esplanade near 6:00 (a street car cruises here after)
    ['esplanade_6_night', [24, 318], [-60, 300], 'night'],
    ['playa_circle', [0, 175], [0, 100], 'day'],          // the open playa toward the Man (the circling cars)
    ['playa_circle_night', [0, 175], [0, 100], 'night'],
    ['race_car_night', [-16, 248], [-24, 236], 'night']
  ];
  const heartSpot = page => page.evaluate(() => { const P = window.BRADY_BURNS.BURNS_OW.PLACES.find(q => q.kind === 'heart'); const s = Math.sin(P.yaw), c = Math.cos(P.yaw); return { at: [P.x + s * 6 + c * 5, P.z + c * 6 - s * 5], to: [P.x - s * 8, P.z - c * 8] }; });
  if (mode === 'all' || mode === 'views' || mode === 'budget') {
    for (const [W, H, tag] of [[390, 844, 'portrait'], [844, 390, 'landscape']]) {
      const page = await open(W, H);
      for (const [name, at0, to0, k] of VIEWS) {
        let at = at0, to = to0; if (!at) { const h = await heartSpot(page); at = h.at; to = h.to; }
        await sky(page, k);
        const r = await look(page, at, to);
        r.frame = await frameTime(page);
        await shot(page, `view_${name}_${tag}`);
        report.views[name + '_' + tag] = r;
        console.log('VIEW', tag, name, JSON.stringify({ draws: r.draws, tris: r.tris, sh: r.shDraws, shTris: r.shTris, cpu: r.cpu, frame: r.frame, tier: r.tier, drawn: r.cars && r.cars.drawn, hi: r.cars && r.cars.hi, mb: r.cars && r.cars.mb, loLoaded: r.cars && r.cars.loLoaded, hiLoaded: r.cars && r.cars.hiLoaded }));
      }
      await page.context().close();
    }
  }
  if (mode === 'all' || mode === 'cars') {
    const page = await open(390, 844);
    if (await hasCars(page)) {
      const stems = await page.evaluate(() => [...new Set(window.BRADY_BURNS.BurnsArtCars.cars.filter(c => c.g === window.BRADY_BURNS.debug.scene()).map(c => c.stem))]);
      for (const k of ['day', 'night']) for (const stem of stems) {
        if (k === 'night' && !['bass_valentine', 'calamari_inferno', 'whale_of_a_time', 'pyramid_scheme', 'jelly_jolt', 'sir_scorchalot'].includes(stem)) continue;
        const spot = await page.evaluate(stem => {
          const c = window.BRADY_BURNS.BurnsArtCars.cars.find(q => q.stem === stem && q.g === window.BRADY_BURNS.debug.scene()), mv = c.mv, D = c.D, S = c.S, s = Math.sin(mv.yaw), co = Math.cos(mv.yaw);
          // Brady stands off the car's front-left corner, three-quarter view
          const side = (D.b[2] * S) + 3.2, fw = D.b[3] * S * 0.6;
          return { at: [mv.x + co * side + s * fw, mv.z - s * side + co * fw], to: [mv.x - s * 0.5, mv.z - co * 0.5] };
        }, stem);
        await sky(page, k);
        const r = await look(page, spot.at, spot.to, { dist: 7.5, pitch: 0.22 });
        await shot(page, `${k === 'day' ? 'car' : 'night'}_${stem}`);
        report.cars[k + '_' + stem] = { draws: r.draws, tris: r.tris, hi: r.cars.hi, drawn: r.cars.drawn };
        console.log('CAR', k, stem, JSON.stringify({ draws: r.draws, tris: r.tris, sh: r.shDraws, drawn: r.cars.drawn, hi: r.cars.hi, loaded: r.cars.loaded.map(q => q.key + ':' + q.tris + ':' + q.ms + 'ms').join(' ') }));
      }
      // walk into a parked car: its colliders must stop Brady; jump onto a circling car's deck
      const col = await page.evaluate(() => {
        const D = window.BRADY_BURNS.debug, s = D.scene(), A = window.BRADY_BURNS.BurnsArtCars, c = A.cars.find(q => q.stem === 'bass_valentine' && q.g === s), mv = c.mv;
        const s0 = Math.sin(mv.yaw + Math.PI / 2), c0 = Math.cos(mv.yaw + Math.PI / 2), at = [mv.x + s0 * 9, mv.z + c0 * 9];
        D.teleport(at[0], at[1]); s.camYaw = Math.atan2(mv.x - at[0], mv.z - at[1]); s.player.yaw = s.camYaw;
        D.sim(4, { up: true, down: false, left: false, right: false });
        const p = s.player; return { cols: mv.dcols.length, end: Math.hypot(p.x - mv.x, p.z - mv.z).toFixed(2), y: p.y.toFixed(2) };
      });
      console.log('COLLIDE', JSON.stringify(col));
      if (+col.end < 1.0) fails.push('walked through the heart car: ' + JSON.stringify(col));
      report.collide = col;
    }
    await page.context().close();
  }
  if (mode === 'all' || mode === 'routes') {
    const page = await open(390, 844);
    if (await hasCars(page)) {
      // sample every route each 3 m, build the tiles along it, and look for static colliders under the car's footprint
      const res = await page.evaluate(async () => {
        const B = window.BRADY_BURNS, O = B.BURNS_OW, OW = B.BurnsOW, s = B.debug.scene(), W = s.world, A = B.BurnsArtCars, hits = [], near = [];
        const routes = [];
        for (const [stem, r] of O.CIRCLE_CARS) { const pts = []; for (let a = 0; a < Math.PI * 2; a += 3 / r) pts.push([Math.sin(a) * r, -Math.cos(a) * r, a + Math.PI / 2]); routes.push({ stem, pts }); }
        for (const [stem, lane] of O.STREET_CARS) { const L = OW.carLoop(lane), pts = []; for (let i = 0; i < L.pts.length; i++) { const a = L.pts[i], b = L.pts[(i + 1) % L.pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3)); for (let k = 0; k < n; k++) pts.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, Math.atan2(b[0] - a[0], b[1] - a[1])]); } routes.push({ stem, pts }); }
        // the parked and drivable cars, where they stand
        const moving = new Set(O.CIRCLE_CARS.map(q => q[0]).concat(O.STREET_CARS.map(q => q[0])));
        for (const c of A.cars) if (!moving.has(c.stem)) routes.push({ stem: c.stem, pts: [[c.mv.x, c.mv.z, c.mv.yaw]] });
        for (const R of routes) {
          const D = B.BURNS_ARTCARS.CARS[R.stem], hw = (D.b[2] - D.b[0]) * D.s / 2, hl = (D.b[3] - D.b[1]) * D.s / 2, zc = (D.b[1] + D.b[3]) / 2 * D.s, xc = (D.b[0] + D.b[2]) / 2 * D.s;
          let n = 0;
          for (const [x0, z0, yaw] of R.pts) {
            if (n++ % 25 === 0) { s.tiles.prime(x0, z0, 200); }
            // the car's footprint: an oriented box (its rest bounds, scaled) round its centre
            const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
            const x = x0 + fx * zc + rx * xc, z = z0 + fz * zc + rz * xc;
            const L = W.col.near(x, z, Math.max(hw, hl) + 1, []);
            for (const c of L) {
              if (c.mover || c.hidden || c.solid === false || (c.y1 !== undefined && c.y1 < 0.35)) continue;
              const dx = c.x - x, dz = c.z - z, lx = dx * rx + dz * rz, lz = dx * fx + dz * fz;   // collider centre in the car's frame
              let hit = false;
              if (c.t === 'box' || c.t === 'ramp') {
                // separating axes: the car's two and the collider's two
                const cy = Math.cos(c.yaw || 0), sy = Math.sin(c.yaw || 0), ax = [[rx, rz], [fx, fz], [cy, -sy], [sy, cy]];
                const cA = [[cy, -sy], [sy, cy]], cH = [c.hx, c.hz], kA = [[rx, rz], [fx, fz]], kH = [hw, hl];
                hit = true;
                for (const a of ax) {
                  const d = Math.abs(dx * a[0] + dz * a[1]);
                  const rk = Math.abs(kA[0][0] * a[0] + kA[0][1] * a[1]) * kH[0] + Math.abs(kA[1][0] * a[0] + kA[1][1] * a[1]) * kH[1];
                  const rc = Math.abs(cA[0][0] * a[0] + cA[0][1] * a[1]) * cH[0] + Math.abs(cA[1][0] * a[0] + cA[1][1] * a[1]) * cH[1];
                  if (d > rk + rc) { hit = false; break; }
                }
              } else {
                const r = c.r || 0, qx = Math.max(-hw, Math.min(hw, lx)), qz = Math.max(-hl, Math.min(hl, lz));
                hit = Math.hypot(lx - qx, lz - qz) < r;
              }
              const ex = c.ex || c.r || 0, ez = c.ez || c.r || 0;
              if (hit) hits.push({ stem: R.stem, at: [+x0.toFixed(1), +z0.toFixed(1)], col: c.t, cx: +c.x.toFixed(1), cz: +c.z.toFixed(1), ex: +ex.toFixed(1), ez: +ez.toFixed(1), y1: c.y1 !== undefined ? +(+c.y1).toFixed(1) : null, region: O.region(x0, z0) });
            }
            await null;
          }
        }
        return { routes: routes.map(r => [r.stem, r.pts.length]), hits };
      });
      report.routes = res;
      console.log('ROUTES', JSON.stringify(res.routes));
      const seen = new Set();
      for (const h of res.hits) { const k = h.stem + h.cx + ',' + h.cz; if (seen.has(k)) continue; seen.add(k); console.log('ROUTE HIT', JSON.stringify(h)); }
      if (res.hits.length) fails.push(res.hits.length + ' route samples overlap static colliders');
    }
    await page.context().close();
  }
  // story worlds: every Art Kart car each world places (its footprint must be clear of static colliders), Brady beside
  // it, and the frame's numbers; with an older build (no BurnsArtCars) the same spots from story_spots.json, for the
  // "before" set
  if (mode === 'all' || mode === 'story') {
    const spotsFile = path.join(path.dirname(out), 'story_spots.json');
    const known = fs.existsSync(spotsFile) ? JSON.parse(fs.readFileSync(spotsFile, 'utf8')) : null, found = [];
    report.story = {};
    for (const w of (process.env.WORLDS ? process.env.WORLDS.split(',').map(Number) : [2, 8, 9, 10, 11, 15, 17])) {
      const page = await open(390, 844, w);
      const has = await hasCars(page);
      let spots;
      if (has) {
        spots = await page.evaluate(() => {
          const B = window.BRADY_BURNS, s = B.debug.scene(), A = B.BurnsArtCars;
          // hold the moving ones still: the parade, the autopilots
          try { for (const P of (B.BURNS_W234 && B.BURNS_W234.S ? B.BURNS_W234.S.parades : [])) { P.speed = 0; P.v = 0; } } catch (e) { /* */ }
          for (const v of s.world.vehicles) v.parked = true;
          return A.cars.filter(c => c.g === s).map(c => { const mv = c.mv, D = c.D, S = c.S, sn = Math.sin(mv.yaw), co = Math.cos(mv.yaw), side = D.b[2] * S + 3.2, fw = D.b[3] * S * 0.6;
            return { stem: c.stem, car: [+mv.x.toFixed(1), +mv.z.toFixed(1)], at: [mv.x + co * side + sn * fw, mv.z - sn * side + co * fw], to: [mv.x - sn * 0.5, mv.z - co * 0.5] }; });
        });
        const clr = await page.evaluate(() => window.BRADY_BURNS.BurnsArtCars.clearance(window.BRADY_BURNS.debug.scene()));
        for (const h of clr) { console.log('STORY OVERLAP', w, JSON.stringify(h)); }
        if (clr.length) fails.push('world ' + w + ': ' + clr.length + ' car footprints overlap static colliders');
        for (const sp of spots) found.push(Object.assign({ w }, sp));
      } else spots = (known || []).filter(q => q.w === w);
      for (const sp of spots) {
        const r = await look(page, sp.at, sp.to, { dist: 7.5, pitch: 0.22 });
        await shot(page, `story_w${w}_${sp.stem}`);
        report.story[w + '_' + sp.stem] = { draws: r.draws, tris: r.tris, sh: r.shDraws, cars: r.cars && { drawn: r.cars.drawn, hi: r.cars.hi, mb: r.cars.mb } };
        console.log('STORY', w, sp.stem, JSON.stringify(report.story[w + '_' + sp.stem]));
      }
      await page.context().close();
    }
    if (found.length) fs.writeFileSync(spotsFile, JSON.stringify(found, null, 1));
  }
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
  await browser.close(); srv.close();
  for (const e of errs) console.log('ERROR', e);
  if (errs.length) fails.push(errs.length + ' page errors');
  console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'PASS');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
