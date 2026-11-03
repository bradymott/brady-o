// Blender-made Burning Man props (assets/models/burning-man/*.glb, src/41_burns_glbprops.js) in the real game.
//   node tools/bm_props_test.js [outDir=shots/bmprops]
// Serves dist/site (or $BRADY_DIST/site) over http (file:// can't fetch the models), opens burning-man/, waits for
// BurnsGLBProps.ready, then plays World 1 (the line: RVs, buses, shades, potties, a dome) and World 17 (Root Society:
// domes and tipis). Shoots a wide view of each world and a close-up of every prop, once with the glb props and once
// procedurally (window.__burnsNoGLBProps) for comparison, prints draws / triangles for both, counts the substituted
// props, walks Brady into an RV and a porta-potty to check their colliders, and fails on any page error.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'bmprops'));
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
// [name, world, Brady at (x, z), look at (x, z)]
const SPOTS = [
  ['world1', 1, [6, 282], [-24, 252]],      // the line: the roof-party RV, the camps (RV, shade, dome) up the road
  ['rv', 1, [-17, 258], [-24, 252]],
  ['shade', 1, [-27, 243], [-34, 236]],
  ['bus', 1, [-53, 128], [-62, 120]],
  ['dome', 1, [-24, 108], [-36, 96]],
  ['potty', 1, [-52, -152], [-58, -158]],
  ['world17', 17, [0, 44], [-40, 14]],      // Root Society: the big domes
  ['village', 17, [0, -28], [0, -54]],      // the tipi village round the common dome
  ['tipi', 17, [12, -33], [7, -41]]
];
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const errs = [];
  const open = async (procedural) => {
    const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(([proc]) => { window.__burnsHideHUD = true; if (proc) window.__burnsNoGLBProps = true; }, [procedural]);
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
    await page.goto(url + 'burning-man/');
    await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.BurnsGLBProps && window.BRADY_BURNS.BurnsGLBProps.ready, null, { timeout: 120000 });
    return page;
  };
  const play = async (page, w) => {
    await page.evaluate(([w]) => { const D = window.BRADY_BURNS.debug; localStorage.clear(); window.BRADY.Save.load(); D.play(w); }, [w]);
    await page.waitForFunction(() => { const D = window.BRADY_BURNS.debug, s = D.state(); return s.scene === 'BurnsPlayScene' && s.state !== 'load' && window.BRADY_BURNS.debug.scene().world; }, null, { timeout: 180000 });
    await page.waitForTimeout(800);
    await page.evaluate(() => { const D = window.BRADY_BURNS.debug; D.skipCine(); });
    await page.waitForTimeout(300);
    await page.evaluate(() => { const D = window.BRADY_BURNS.debug; D.skipCine(); });
  };
  const look = async (page, at, to) => {
    await page.evaluate(([at, to]) => {
      const D = window.BRADY_BURNS.debug, s = D.scene(); D.teleport(at[0], at[1]);
      s.camYaw = Math.atan2(to[0] - at[0], to[1] - at[1]); s.player.yaw = s.camYaw; s.snapCam = true;
    }, [at, to]);
    await page.waitForTimeout(1600);
    return page.evaluate(() => { const D = window.BRADY_BURNS.debug, s = D.scene(); return { draws: s.stats.draws, tris: s.stats.tris, x: +s.player.x.toFixed(1), z: +s.player.z.toFixed(1) }; });
  };
  // walk Brady toward a prop for `sec` seconds and report where he ends up (a collider must stop him short)
  const walkInto = async (page, at, to, sec) => page.evaluate(([at, to, sec]) => {
    const D = window.BRADY_BURNS.debug, s = D.scene(); D.teleport(at[0], at[1]);
    s.camYaw = Math.atan2(to[0] - at[0], to[1] - at[1]); s.player.yaw = s.camYaw; s.snapCam = true;
    D.sim(sec, { up: true, down: false, left: false, right: false });
    const p = s.player; return { x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), moved: +Math.hypot(p.x - at[0], p.z - at[1]).toFixed(2) };
  }, [at, to, sec]);
  const results = {};
  for (const procedural of [false, true]) {
    const tag = procedural ? 'procedural' : 'glb';
    const page = await open(procedural);
    let world = 0;
    for (const [name, w, at, to] of SPOTS) {
      if (w !== world) { await play(page, w); world = w; }
      const st = await look(page, at, to);
      await page.screenshot({ path: path.join(out, name + (procedural ? '-proc' : '') + '.png'), timeout: 120000 });
      (results[name] = results[name] || {})[tag] = st;
      console.log(tag.padEnd(10), name.padEnd(8), JSON.stringify(st));
    }
    if (!procedural) {
      // colliders: walk into the roof-party RV (2.5 m wide at (-24, 252), yaw 0.1) and a porta-potty (1.24 m at (-58, -158))
      await play(page, 1);
      const rv = await walkInto(page, [-18, 252], [-24, 252], 2.5);
      const potty = await walkInto(page, [-54, -158], [-58, -158], 2.0);
      const inside = (p, cx, cz, hx, hz) => Math.abs(p.x - cx) < hx && Math.abs(p.z - cz) < hz && p.y < 1.0;
      console.log('collide rv   ', JSON.stringify(rv), inside(rv, -24, 252, 1.25, 4.5) ? 'FAIL: inside the RV' : 'ok');
      console.log('collide potty', JSON.stringify(potty), inside(potty, -58, -158, 0.62, 0.62) ? 'FAIL: inside the potty' : 'ok');
      if (inside(rv, -24, 252, 1.25, 4.5) || inside(potty, -58, -158, 0.62, 0.62)) errs.push('collider: Brady walked into a glb prop');
      const stats = await page.evaluate(() => window.BRADY_BURNS.BurnsGLBProps.stats());
      console.log('glb props    ', JSON.stringify(stats));
      if (!stats.loaded.length) errs.push('no glb props were loaded');
      if (!stats.count) errs.push('no glb props were substituted');
    }
    await page.context().close();
  }
  console.log('\nbefore (procedural) -> after (glb), draws / tris per view:');
  for (const [name, r] of Object.entries(results)) console.log('  ' + name.padEnd(8), (r.procedural.draws + ' / ' + r.procedural.tris).padEnd(16), '->', r.glb.draws + ' / ' + r.glb.tris);
  await browser.close(); srv.close();
  if (errs.length) { console.log('ERRORS:\n' + errs.slice(0, 10).join('\n')); process.exit(1); }
  console.log('shots in', out);
})().catch(e => { console.error(e); process.exit(1); });
