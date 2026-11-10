// shoot.js <outDir> <jobs.json>   jobs: [{name, w, i, run: seconds of play from the start (invulnerable, optional input),
//   input: {right:true}, eval: "js run after (g, p, B in scope)", land: true}]  -- full-res, waits for atlases.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const out = process.argv[2]; const jobs = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
fs.mkdirSync(out, { recursive: true });
const appPage = path.join(path.resolve(process.env.BRADY_DIST), 'site', 'super-brady-o-world', 'index.html');
(async () => {
  const browser = await chromium.launch(); const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + appPage); await page.waitForTimeout(1500);
  for (const j of jobs) {
    const info = await page.evaluate(async (j) => {
      const B = window.BRADY, G = B.Game, I = B.Input;
      const sim = (sec, inp) => { const g = G.scene; for (let k = 0; k < Math.round(sec * 120); k++) { if (inp) Object.assign(I, inp); g.player.invuln = 999; (g._upd || g.update).call(g, 1 / 120); } if (inp) for (const key in inp) I[key] = false; };
      B.Save.data.lives = 9; const g = new B.Play(B.getLevel(j.w, j.i), {}); G.setScene(g); sim(j.pre != null ? j.pre : 2);
      const p = g.player; window.__g = g;
      if (j.eval) { const fn = new Function('g', 'p', 'B', 'sim', j.eval); fn(g, p, B, sim); }
      if (j.run) sim(j.run, j.input);
      g._upd = g.update; g.update = function () {};
      G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize();
      return { x: Math.round(p.x / 32), y: Math.round(p.y / 32), dead: !!p.dead, theme: g.themeKey };
    }, j);
    const t0 = Date.now();
    while (Date.now() - t0 < 20000) { const pend = await page.evaluate(() => Object.keys(window.BRADY_ATLAS.pending).length); if (!pend) break; await page.waitForTimeout(200); }
    await page.waitForTimeout(500);
    if (j.after) await page.evaluate(j.after);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(out, j.name) });
    if (j.clip) await page.screenshot({ path: path.join(out, j.name.replace('.png', '_zoom.png')), clip: j.clip });
    console.log(j.name, JSON.stringify(info));
  }
  console.log('page errors:', errors.length, errors.slice(0, 5));
  await browser.close();
})();
