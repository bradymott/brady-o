// Headless smoke test on an iPhone-sized landscape viewport.
// usage: node tools/smoke.js [outDir] [levelIds...]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const out = process.argv[2] || path.join(__dirname, '..', 'shots');
const levels = process.argv.slice(3);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.join(process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist'), 'brady-o.html'));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(out, 'title.png') });
  const ids = levels.length ? levels : ['1-1'];
  for (const id of ids) {
    const [w, i] = id.split('-').map(Number);
    await page.evaluate(([w, i]) => { const B = window.BRADY; B.Game.setScene(new B.Play(B.getLevel(w, i), {})); }, [w, i]);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(out, `start-${id}.png`) });
    const st = await page.evaluate(() => { const g = window.BRADY.Game.scene, p = g.player; return { state: g.state, ps: p.state, x: Math.round(p.x), y: Math.round(p.y), dead: p.dead }; });
    console.log(id, JSON.stringify(st));
    // hold right + jump a bit
    await page.keyboard.down('ArrowRight');
    for (let k = 0; k < 6; k++) { await page.keyboard.down('Space'); await page.waitForTimeout(260); await page.keyboard.up('Space'); await page.waitForTimeout(240); }
    await page.screenshot({ path: path.join(out, `level-${id}.png`) });
    const st2 = await page.evaluate(() => { const g = window.BRADY.Game.scene, p = g.player; return { state: g.state, ps: p.state, x: Math.round(p.x), y: Math.round(p.y), dead: p.dead, lives: window.BRADY.Save.data.lives }; });
    console.log(id, 'after', JSON.stringify(st2));
    await page.keyboard.up('ArrowRight');
  }
  const errs = await page.evaluate(() => (window.__bradyErrors || []).slice(0, 5));
  const frames = await page.evaluate(() => window.BRADY.Game.frames);
  console.log('frames', frames);
  console.log('console:', errors.slice(0, 20).join('\n'));
  console.log('game errors:', errs.join('\n---\n'));
  await browser.close();
})();
