// Art Cart's visual contracts and load smoke test. Run after node tools/build.js.
// Uses Playwright's request routing so no local web server or external font service is required.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(root, 'dist');
module.exports = (async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 874, height: 402 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.addInitScript(() => {
      // Test geometry and animation independently of the software GPU's frame rate.
      window.__burnsNoAO = true;
      window.requestAnimationFrame = () => 1;
    });
    await page.route('https://fonts.**', r => r.abort());
    await page.route('http://cart.test/**', async r => {
      const u = new URL(r.request().url());
      const f = path.join(dist, 'site', u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname);
      if (!f.startsWith(path.join(dist, 'site') + path.sep)) return r.abort();
      if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
      return r.fulfill({ status: 200, contentType: f.endsWith('.html') ? 'text/html' : f.endsWith('.json') ? 'application/json' : 'application/octet-stream', body: fs.readFileSync(f) });
    });
    await page.goto('http://cart.test/art-cart/');
    await page.waitForFunction(() => window.BRADY?.Game?.scene && window.BRADY_BURNS?.CartGLB?.ready, null, { polling: 100, timeout: 60000 });
    const art = await page.evaluate(() => {
      const B = window.BRADY_BURNS, s = window.BRADY.Game.scene;
      const brady = B.CartDriverArt.spec('brady');
      if (brady.hair.style !== 'bun' || brady.bottom.kind === 'jeans' || !brady.tattoos) throw Error('Brady art brief changed');
      const drivers = [];
      for (let i = 0; i < 26; i++) {
        s.drvSel = i; s.loadPreview();
        const M = s.pdrv.model, G = M.geo, F = new Float32Array(G.data);
        if (s.pdrv.id !== 'man' && !M.cartArt) throw Error('Old driver art: ' + s.pdrv.id);
        if (G.nv > 65535 || !G.idx.every(x => x < G.nv)) throw Error('Invalid driver indices');
        for (let j = 0; j < G.nv; j++) for (let k = 0; k < 3; k++) if (!Number.isFinite(F[j * 6 + k])) throw Error('Invalid driver vertex');
        s.pdrv.ch.play('cartDrive', { steer: 0.5 }, true); s.pdrv.ch.update(1 / 60); s.pdrv.ch.compute();
        if (!s.pdrv.ch.bones.every(Number.isFinite)) throw Error('Invalid driving pose');
        drivers.push({ id: s.pdrv.id, tris: G.count / 3 });
      }
      const cars = Object.entries(B.CartGLB.rigs).map(([id, r]) => {
        if (!r.lo || !r.lo.finished) throw Error('Missing finished race car: ' + id);
        if (r.lo.geo.count / 3 > 8000) throw Error('Race car triangle budget: ' + id);
        for (const R of Object.values(r)) if (R.geo.nv > 65535 || !R.geo.idx.every(i => i < R.geo.nv)) throw Error('Invalid car indices: ' + id);
        return { id, raceTris: r.lo.geo.count / 3 };
      });
      if (cars.length !== 12) throw Error('Expected twelve race cars');
      return { drivers, cars };
    });
    const worlds = await page.evaluate(() => {
      const B = window.BRADY_BURNS, rows = [];
      const check = opts => {
        const s = new B.CartRaceScene(Object.assign({ driver: 'brady', car: 'heart', autoGas: true, seed: 7 }, opts));
        s.loadAll();
        if (s.state !== 'intro') throw Error('World failed to load: ' + JSON.stringify(opts));
        s.state = 'race'; s.stateT = 0; s.autoDrive = true;
        for (let i = 0; i < 60; i++) s.update(1 / 60);
        if (![s.player.x, s.player.y, s.player.z].every(Number.isFinite)) throw Error('Invalid car placement');
        rows.push(opts.track || opts.arena);
      };
      for (const id of B.CART_TRACK_ORDER) check({ mode: 'tt', track: id });
      for (const a of B.CART_ARENAS) check({ mode: 'battle', arena: a.id, objective: a.objectives[0] });
      return rows;
    });
    assert.equal(errors.length, 0, errors.join('\n'));
    const report = { drivers: art.drivers.length, cars: art.cars.length, worlds: worlds.length, carBudgets: art.cars, errors };
    console.log(JSON.stringify(report, null, 2));
    return report;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; throw e; });
