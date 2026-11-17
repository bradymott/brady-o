// before/after screenshots of item blocks under a ceiling: node shots.js <dist> <outdir> <tag>
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const [dist, out, tag] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const cases = [
  { id: '2-1', area: 'mitad', tx: 98, ty: 2, power: 0, name: 'ec21-mushroom' },
  { id: '12-6', area: 'khadal', tx: 8, ty: 2, power: 1, name: 'np26-joint' },
  { id: '4-1', area: 'gorongosa', tx: 139, ty: 11, power: 0, name: 'mz41-waterbottle' },
  { id: '1-4', area: 'crater', tx: 5, ty: 123, power: 1, name: 'mx14-joint-slot' }
];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.join(path.resolve(dist), 'site', 'super-brady-o-world', 'index.html'));
  await page.waitForTimeout(1500);
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  for (const c of cases) {
    await page.evaluate(c => {
      const B = window.BRADY, G = B.Game; const [w, n] = c.id.split('-').map(Number);
      const lvl = B.getLevel(w, n); B.Save.data.lives = 9;
      const g = new B.Play(lvl, { power: c.power }); G.setScene(g);
      for (let k = 0; k < 240; k++) g.update(1 / 120);
      const ai = lvl.areas.findIndex(a => a.aid === c.area);
      const h = c.power ? 54 : 28;
      g.loadArea(ai, c.tx * 32 + 6, (c.ty + 1) * 32 + h + 6, c.power); g.player.power = c.power;
      for (const e of g.entities) if (e.enemy || e.boss) e.remove = true;
      const p = g.player; p.invuln = 1e9; p.update = function () {}; p.anim.state = 'jump';
      g.camX = Math.max(0, Math.min(g.area.W * 32 - G.viewW, p.cx - G.viewW * 0.5)); g.camY = g.camTargetY(true);
      for (let k = 0; k < 30; k++) g.update(1 / 120);
      window.__g = g;
    }, c);
    // the bump, then the pop mid-way and settled
    await page.evaluate(c => { const g = window.__g; g.camX = Math.max(0, g.player.cx - window.BRADY.Game.viewW * 0.5); g.bumpBlock(c.tx, c.ty, c.power > 0, g.player); g.player.x -= 44; for (let k = 0; k < 26; k++) { g.update(1 / 120); } g._u = g.update; g.update = function () {}; }, c);
    await pin(); await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(out, `${c.name}-${tag}-a-popping.png`) });
    await page.evaluate(() => { const g = window.__g; g.update = g._u; for (let k = 0; k < 90; k++) g.update(1 / 120); g.update = function () {}; });
    await pin(); await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(out, `${c.name}-${tag}-b-settled.png`) });
  }
  console.log('errors', errors);
  await browser.close();
})();
