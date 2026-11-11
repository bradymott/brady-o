// N1 profiler: peak main-pass triangles / draws for every track (a whole lap + the grid) and every arena x objective,
// with a per-category breakdown at the peak frame. Usage: BRADY_DIST=... node n1_prof.js <out.json> [only] [tier]
const { chromium } = require('/Users/bradymott/brady-o/node_modules/playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const site = path.join(process.env.BRADY_DIST, 'site');
const outF = process.argv[2], only = process.argv[3] && process.argv[3] !== 'all' ? process.argv[3] : null, tier = process.argv[4] || null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
const TRACKS = [['esplanade', 'dust', 0], ['gateroad', 'dust', 1], ['deepplaya', 'dust', 2], ['dawn', 'dust', 3], ['centercamp', 'fire', 0], ['storm', 'fire', 1], ['neon', 'fire', 2], ['burn', 'fire', 3]];
(async () => {
  const { srv, url } = await serve(site);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { window.__cartFixedQ = 0.5; });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await page.goto(url + 'art-cart/');
  await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready, null, { timeout: 120000 });
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });   // stop the app loop: we draw by hand
  // instrument the renderer once: per-category tris of the main pass
  await page.evaluate(([tier]) => {
    if (tier) window.BRADY_CART.debug.gfx(tier);
    window.__prof = { cat: {}, on: false };
    const hook = (R) => {
      if (R.__hooked) return; R.__hooked = true;
      const wrap = (name, catFn) => { const f = R[name]; R[name] = function () { const t0 = this.stats.tris, d0 = this.stats.draws; const r = f.apply(this, arguments); if (window.__prof.on && this.pass !== 'shadow') { const c = catFn(arguments); const o = window.__prof.cat[c] || (window.__prof.cat[c] = [0, 0]); o[0] += this.stats.tris - t0; o[1] += this.stats.draws - d0; } return r; }; };
      wrap('statics', () => 'statics'); wrap('ground', () => 'ground'); wrap('sky', () => 'sky'); wrap('sprites', () => 'sprites'); wrap('instances', () => 'instances');
      wrap('skin', a => (window.__geoCat && window.__geoCat.get(a[0])) || 'skin-other');
    };
    window.__profHook = hook;
  }, [tier]);
  const res = { tier: null, tracks: {}, arenas: {} };
  const sample = async () => page.evaluate(() => {
    const s = window.BRADY.Game.scene, R = s.R; window.__profHook(R);
    const M = window.__geoCat = new Map();
    for (const k of s.karts) { M.set(k.M.geo, 'kart-hi'); if (k.Mlo) M.set(k.Mlo.geo, 'kart-lo'); const d = k.dModel; if (d) { M.set(d.geo, 'driver'); if (d.lod) M.set(d.lod, 'driver'); if (d.far) M.set(d.far, 'driver'); } }
    for (const G of s.E.crowds) { M.set(G.geo, 'crowd-near'); if (G.far) M.set(G.far.geo, 'crowd-far'); }
    for (const h of s.heroes) { M.set(h.model.geo, 'hero'); if (h.model.lod) M.set(h.model.lod, 'hero'); if (h.model.far) M.set(h.model.far, 'hero'); }
    if (s.man) M.set(s.man.model.geo, 'man');
    for (const G of (s.props && s.props.groups) || []) M.set(G.geo, 'props');
    window.__prof.cat = {}; window.__prof.on = true;
    Object.getPrototypeOf(s).draw.call(s, window.BRADY.Game.ctx);
    window.__prof.on = false;
    const p = s.player, cat = {}; for (const k in window.__prof.cat) cat[k] = [Math.round(window.__prof.cat[k][0]), window.__prof.cat[k][1]];
    const hi = s.karts.filter(k => k._in && k._d2 <= 900 && k.Mlo).length;
    return { tris: Math.round(s.stats.tris), draws: s.stats.draws, main: s.stats.mainDraws, sh: s.stats.shadowDraws, raceT: +s.raceT.toFixed(1), x: +p.x.toFixed(0), z: +p.z.toFixed(0), hiKarts: hi, cat, tier: window.BRADY_BURNS.BurnsGL ? window.BRADY_BURNS.BurnsGL.tier : null };
  });
  const run = async (key, startOpts, secs, step, store) => {
    await page.evaluate(([o]) => { const D = window.BRADY_CART.debug; D.start(o); const s = window.BRADY.Game.scene; s.lastFrame = 0; }, [startOpts]);
    // grid / start view
    await page.evaluate(() => { const s = window.BRADY.Game.scene; s.state = 'count'; s.stateT = 0.5; s.update(1 / 60); s.snapCam = true; });
    const samples = [Object.assign({ at: 'grid' }, await sample())];
    await page.evaluate(() => { const s = window.BRADY.Game.scene; s.state = 'race'; s.stateT = 0; s.autoDrive = true; });
    for (let t = 0; t < secs; t += step) {
      const st = await page.evaluate(([step]) => { const s = window.BRADY.Game.scene; for (let i = 0; i < Math.round(step * 60) && s.state === 'race'; i++) s.update(1 / 60); s.snapCam = true; return s.state; }, [step]);
      // settle the damped camera: two frames
      samples.push(await sample());
      if (st !== 'race') break;
    }
    let pk = samples[0], pd = samples[0], sum = 0; for (const q of samples) { if (q.tris > pk.tris) pk = q; if (q.draws > pd.draws) pd = q; sum += q.tris; }
    store[key] = { peakTris: pk.tris, peakAt: [pk.at || pk.raceT, pk.x, pk.z], peakDraws: pd.draws, peakDrawsAt: pd.at || pd.raceT, avgTris: Math.round(sum / samples.length), n: samples.length, grid: samples[0], breakdownAtPeak: pk.cat, hiKartsAtPeak: pk.hiKarts };
    res.tier = pk.tier;
    console.log(key.padEnd(18), 'peak', pk.tris, '@', pk.at || pk.raceT, 'draws', pd.draws, 'avg', Math.round(sum / samples.length), 'grid', samples[0].tris, JSON.stringify(pk.cat));
  };
  for (const [id, cup, race] of TRACKS) { if (only && only !== id && only !== 'tracks') continue; await run(id, { mode: 'gp', cup, race, driver: 'brady', car: 'heart', autoGas: true }, 80, 2.5, res.tracks); }
  const combos = await page.evaluate(() => window.BRADY_BURNS.CART_ARENAS.flatMap(a => a.objectives.map(o => [a.id, o])));
  for (const [arena, objective] of combos) { if (only && only !== arena && only !== 'arenas') continue; await run(arena + ':' + objective, { mode: 'battle', arena, objective, driver: 'brady', car: 'heart', autoGas: true, seed: 7 }, 40, 2, res.arenas); }
  fs.writeFileSync(outF, JSON.stringify(res, null, 1));
  await browser.close(); srv.close();
  if (errs.length) { console.log('ERRORS:\n' + errs.slice(0, 15).join('\n')); }
  console.log('tier', res.tier, 'written', outF);
})().catch(e => { console.error(e); process.exit(1); });
