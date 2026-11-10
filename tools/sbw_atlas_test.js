// Atlas memory: a level start keeps only the atlases that level uses and drops the rest; going back reloads them
// cleanly, with procedural art drawing (no errors) while they decode again.
// usage: node tools/sbw_atlas_test.js   (build first; BRADY_DIST=<folder> for a private build)
const { chromium } = require('playwright');
const path = require('path'), assert = require('assert');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const page_ = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 844, height: 390 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(page_); await page.waitForTimeout(1500);
  await page.evaluate(() => { window.BRADY.Save.data.lives = 9; });
  // start a level, draw a few frames straight away (atlases still loading: procedural art), then wait for its atlases
  const enter = async id => {
    const r = await page.evaluate(id => {
      const B = window.BRADY, G = B.Game, [w, i] = id.split('-').map(Number);
      const g = new B.Play(B.getLevel(w, i), {}); G.setScene(g);
      for (let k = 0; k < 20; k++) { g.update(1 / 60); G.ctx.setTransform(1, 0, 0, 1, 0, 0); g.draw(G.ctx); }
      return g.atlasNames().filter(Boolean);
    }, id);
    for (let k = 0; k < 150; k++) { if (!(await page.evaluate(() => Object.keys(window.BRADY.Atlas.pending).length))) break; await page.waitForTimeout(100); }
    const st = await page.evaluate(() => {
      const A = window.BRADY.Atlas, G = window.BRADY.Game, g = G.scene;
      for (let k = 0; k < 10; k++) { g.update(1 / 60); G.ctx.setTransform(1, 0, 0, 1, 0, 0); g.draw(G.ctx); }
      return { loaded: Object.keys(A.atlases).filter(n => A.atlases[n].ready).sort(), mb: A.decodedMB() };
    });
    return { want: r, ...st };
  };
  const a = await enter('3-1');   // Brazil
  console.log('3-1', JSON.stringify(a));
  assert(a.loaded.includes('br'), 'Brazil country atlas loaded');
  const b = await enter('1-1');   // Mexico: Brazil's atlases are dropped
  console.log('1-1', JSON.stringify(b));
  assert(b.loaded.includes('mx') && !b.loaded.some(n => n.startsWith('br')), 'Mexico in, Brazil out');
  for (const n of b.loaded) assert(b.want.includes(n), 'only atlases of the current level stay: ' + n);
  const c = await enter('3-1');   // back to Brazil: reloads from the kept meta
  console.log('3-1 again', JSON.stringify(c));
  assert(c.loaded.includes('br') && !c.loaded.some(n => n.startsWith('mx')), 'Brazil reloaded, Mexico out');
  // switching levels quickly: an atlas that lands after its level is gone is dropped on arrival
  await page.evaluate(() => { const B = window.BRADY; B.Game.setScene(new B.Play(B.getLevel(2, 1), {})); B.Game.setScene(new B.Play(B.getLevel(4, 1), {})); });
  const d = await enter('4-1');
  console.log('2-1 then 4-1', JSON.stringify(d));
  assert(!d.loaded.some(n => n.startsWith('ec') || n.startsWith('br')), 'no stale atlases');
  assert.deepStrictEqual(errors, [], 'no page errors');
  console.log('PASS atlas keep/drop/reload, peak', Math.max(a.mb, b.mb, c.mb, d.mb), 'MB decoded');
  await browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
