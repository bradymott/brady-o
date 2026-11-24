// Player-camera close-ups of the city's most-seen instanced props (and an art car for scale), day and night.
//   BRADY_DIST=<dist> node tools/dev/props_closeups.js <outDir> [filter-regex]
// For each prototype id it finds the copy nearest a fixed city spot, stands Brady `d` metres from it (camera behind
// him, looking at it, slightly to one side) and shoots at iPhone shape, medium tier. Prints draws / triangles too.
// Env: CLOSE_O=L,P (orientations), CLOSE_TIER=medium, CLOSE_PAL=day,night.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const site = path.resolve(process.env.BRADY_DIST || 'dist', 'site'), out = path.resolve(process.argv[2] || 'shots/closeups');
const filt = process.argv[3] ? new RegExp(process.argv[3]) : null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
const PALS = { day: ['day', 'dusk', 0.15], night: ['dusk', 'night', 1] };
// [name, prototype id (or 'car:<stem>'), distance, side offset, pitch]
const SHOTS = [
  ['rv', 'ow_rv11', 9, 2.5, 0.16], ['trailer', 'ow_trailer7', 9, 2.5, 0.16], ['camper', 'ow_camper5', 7, 2, 0.16], ['bus', 'ow_bus4', 9, 2.5, 0.16],
  ['tent', 'ow_tent', 5, 1, 0.2], ['shade', 'ow_shade', 9, 2, 0.16], ['camp', 'ow_shadeC0', 10, 2, 0.14], ['dome', 'ow_dome', 11, 2, 0.14],
  ['domeL', 'ow_domeL', 11, 2, 0.14], ['hexa', 'ow_hexa', 8, 2, 0.16], ['lamp', 'ow_lamp', 6, 1, 0.05], ['potty', 'ow_potty', 7, 1.5, 0.16],
  ['string', 'ow_string', 7, 1, 0.1], ['car', 'car:turbo_escargot', 9, 2.5, 0.16]
];
const HOME = [-60, 360];   // copies nearest this spot (5:50 & Arcade/Bonfire: a busy neighbourhood near Center Camp)
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site), browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const orients = (process.env.CLOSE_O || 'L').split(','), tier = process.env.CLOSE_TIER || 'medium', pals = (process.env.CLOSE_PAL || 'day,night').split(',');
  const stats = [];
  for (const o of orients) {
    const vp = o === 'P' ? { width: 402, height: 874 } : { width: 874, height: 402 };
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.requestAnimationFrame = fn => { window.__lookFrame = fn; return 1; }; window.__burnsHideHUD = true; try { localStorage.clear(); } catch (e) { /* */ } });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('pageerror', e.message.slice(0, 300)));
    await page.goto(url + 'burning-man/');
    await page.waitForFunction(() => !!window.BRADY_BURNS, null, { polling: 100, timeout: 120000 });
    await page.evaluate(async () => { const B = window.BRADY_BURNS; await B.BurnsGLBProps.preload(); await Promise.all(['brady', 'chinka'].map(n => B.BurnsSkin.preload('models/' + n + '.glb.gz'))); if (B.BurnsArtCars && B.BurnsArtCars.preload) { try { await B.BurnsArtCars.preload(); } catch (e) { /* */ } } });
    for (const pal of pals) for (const [n, id, d, side, pitch] of SHOTS) {
      const name = n + '-' + pal + '-' + o;
      if (filt && !filt.test(name)) continue;
      const r = await page.evaluate(([id, d, side, pitch, P, HOME, tier]) => {
        const B = window.BRADY_BURNS, D = B.debug;
        let s = D.scene();
        if (!s || s.worldId !== 500) { D.play(500, { fresh: true }); s = D.scene(); if (s.state === 'load') s.load(); D.skipCine(); }
        B.BurnsGL.configure(tier);
        const setPal = () => { s.palA = P[0]; s.palB = P[1]; s.tod = P[2]; s.todTarget = null; if (B.BURNS_OW && B.BURNS_OW.state) B.BURNS_OW.state.palKey = P.join('|'); };
        setPal(); D.teleport(HOME[0], HOME[1]);
        for (let i = 0; i < 60; i++) s.update(1 / 30);
        if (s.tiles) for (let i = 0; i < 400 && (s.tiles.queue.length || s.tiles.job); i++) s.tiles.step(50);
        let tx, tz, tyaw = 0;
        if (id.startsWith('car:')) {
          // a parked stand-in: the nearest cruising art car of that stem is frozen for the shot
          const stem = id.slice(4), c = (B.BurnsArtCars.cars || []).find(c => c.stem === stem && c.g === s);
          if (!c) return { skip: 'no car ' + stem };
          if (B.BURNS_OW.state && B.BURNS_OW.state.cruise) B.BURNS_OW.state.cruise = B.BURNS_OW.state.cruise.filter(q => q.mv !== c.mv);   // park it
          tx = c.mv.x; tz = c.mv.z; tyaw = c.mv.yaw;
        } else {
          const L = s.world.instancer().list.filter(it => it.P.id === id);
          if (!L.length) return { skip: 'no copies of ' + id };
          L.sort((a, b) => Math.hypot(a.x - HOME[0], a.z - HOME[1]) - Math.hypot(b.x - HOME[0], b.z - HOME[1]));
          tx = L[0].x; tz = L[0].z; tyaw = L[0].yaw;
        }
        // stand d metres away on the copy's front side (+z local), off to one side, looking at it
        const fx = Math.sin(tyaw), fz = Math.cos(tyaw), sx = Math.cos(tyaw), sz = -Math.sin(tyaw);
        const px = tx + fx * d + sx * side, pz = tz + fz * d + sz * side;
        D.teleport(px, pz);
        for (let i = 0; i < 20; i++) s.update(1 / 30);
        if (s.tiles) for (let i = 0; i < 400 && (s.tiles.queue.length || s.tiles.job || s.tiles.people.length); i++) s.tiles.step(50);
        setPal(); D.teleport(px, pz);
        const yaw = Math.atan2(tx - px, tz - pz);
        s.camYaw = yaw; s.player.yaw = yaw; s.camPitch = pitch; s.snapCam = true; s.lastManual = s.time + 1e6; s.manualCam = true; s.q = 1;
        const draw = () => { s.fade = 0; s.dayCardT = -1; s.banners = []; if (s.dialog) s.dialog.open = false; window.BRADY.Game.ctx.setTransform(1, 0, 0, 1, 0, 0); s.q = 1; s.draw(window.BRADY.Game.ctx); };
        draw(); draw();
        const gl = B.BurnsGL.gl; gl.finish();
        const t0 = performance.now(); for (let i = 0; i < 3; i++) draw(); gl.finish();
        return { draws: s.stats.draws, tris: Math.round(s.stats.tris), ms: Math.round((performance.now() - t0) / 3 * 10) / 10, at: [Math.round(tx), Math.round(tz)] };
      }, [id, d, side, pitch, PALS[pal], HOME, tier]);
      if (r.skip) { console.log(name, 'SKIP', r.skip); continue; }
      await page.screenshot({ path: path.join(out, name + '.png') });
      r.name = name; stats.push(r); console.log(JSON.stringify(r));
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(out, 'stats.json'), JSON.stringify(stats, null, 1));
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
