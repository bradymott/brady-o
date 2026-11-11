// Mexico 1-1 mushroom sequence, frame by frame: node mush.js <dist> <outdir> <tag>
// sheets: <tag>-1-pop.png (bump, pop, walk; every 3 frames), <tag>-2-grow.png (collect + grow; every 2 frames),
//         <tag>-3-trip.png (the trip moment, full view; every 12 frames)
const pw = require('playwright'), chromium = pw[process.env.ENGINE || 'chromium'];
const path = require('path'), fs = require('fs');
const [dist, out0, tag] = process.argv.slice(2), out = path.resolve(out0);
const fdir = path.join(out, tag + '-frames'); fs.mkdirSync(fdir, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.join(path.resolve(dist), 'site', 'super-brady-o-world', 'index.html'));
  await page.waitForTimeout(1500);
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  await page.evaluate(() => {
    const B = window.BRADY, G = B.Game; B.Save.data.settings.zoom = 'near'; B.Save.data.lives = 9;
    const lvl = B.getLevel(1, 1); const g = new B.Play(lvl, {}); G.setScene(g);
    for (let k = 0; k < 240; k++) g.update(1 / 120);
    for (const e of g.entities) if (e.enemy) e.remove = true;
    const p = g.player; p.invuln = 0; p.x = 28 * 32 + 16 - p.w / 2 - 30; p.y = 19 * 32 - p.h; p.vx = 0; p.vy = 0;
    g.camX = Math.max(0, p.cx - G.viewW * 0.4); g.camY = g.camTargetY(true);
    for (let k = 0; k < 60; k++) g.update(1 / 120);
    window.__g = g; g._u = g.update; g.update = function () {};
    // run n fixed steps with input, then freeze for the screenshot
    window.__run = (n, inp) => { const I = B.Input; g.update = g._u; for (let k = 0; k < n; k++) { Object.assign(I, inp || {}); g.update(1 / 120); if (k === 0) { I.jumpPressed = false; } } for (const key in (inp || {})) I[key] = false; g.update = function () {}; };
    // the screen rect around a world point (css px)
    window.__rect = (wx, wy, w, h) => { const S = G.gameRect.w / G.viewW, r = G.gameRect; return { x: Math.max(0, r.x + (wx - g.camX) * S - w / 2), y: Math.max(0, r.y + (wy - g.camY) * S - h / 2), width: w, height: h }; };
  });
  const shots = { pop: [], grow: [], trip: [] };
  const snap = async (list, rect, label) => { await pin(); await page.waitForTimeout(60); const f = path.join(fdir, `${list}-${String(shots[list].length).padStart(3, '0')}.png`); await page.screenshot({ path: f, clip: rect || undefined }); shots[list].push({ f, label }); };
  // 1: walk under the block and jump into it; the pop, the walk
  const blk = { x: 28 * 32 + 16, y: 17 * 32 };
  await page.evaluate(() => __run(30, { right: true }));
  await page.evaluate(() => { const p = __g.player; p.x = 28 * 32 + 16 - p.w / 2; p.vx = 0; __run(1, { jump: true, jumpPressed: true }); __run(26, { jump: true }); });
  let it = false;
  for (let i = 0; i < 64; i++) {
    const r = await page.evaluate(b => { const g = __g, m = g.entities.find(e => e.kind === 'mushroom'); return { rect: __rect(m ? m.cx : b.x, m ? m.cy : b.y, 300, 170), t: m ? m.emerge.toFixed(2) : '-', y: m ? Math.round(m.y) : 0, by: Math.round(__g.player.y) }; }, blk);
    await snap('pop', r.rect, `f${i * 3} e${r.t}`);
    await page.evaluate(() => __run(3, {}));
  }
  // 2: Brady walks into it: the grow (every 2 frames)
  await page.evaluate(() => { const g = __g, m = g.entities.find(e => e.kind === 'mushroom'); const p = g.player; if (m) { m.vx = 0; m.x = p.x + p.w + 10; m.y = p.y + p.h - m.h; } });
  for (let i = 0; i < 50; i++) {
    const r = await page.evaluate(() => { const p = __g.player; return { rect: __rect(p.cx, p.y + p.h - 40, 260, 170), h: p.h, gt: (p.growT || 0).toFixed(2) }; });
    await snap('grow', r.rect, `f${i * 2} h${r.h} g${r.gt}`);
    await page.evaluate(() => __run(2, { right: true }));
  }
  // 3: the trip, full view
  for (let i = 0; i < 40; i++) {
    const d = await page.evaluate(() => (__g.dizzy || 0).toFixed(2));
    await snap('trip', null, `f${i * 12} dz${d}`);
    await page.evaluate(() => __run(12, {}));
  }
  // contact sheets
  const sheet = async (list, cols, cw, name) => {
    const html = '<html><body style="margin:0;background:#222;font:11px sans-serif;color:#fff"><div style="display:grid;grid-template-columns:repeat(' + cols + ',' + cw + 'px);gap:2px">' +
      shots[list].map(s => `<div><img src="file://${s.f}" style="width:${cw}px;display:block"><div>${s.label}</div></div>`).join('') + '</div></body></html>';
    const hp = path.join(fdir, list + '.html'); fs.writeFileSync(hp, html);
    const p2 = await browser.newPage({ viewport: { width: cols * (cw + 2), height: 400 } });
    await p2.goto('file://' + hp); await p2.waitForTimeout(500);
    await p2.screenshot({ path: path.join(out, name), fullPage: true }); await p2.close();
  };
  await sheet('pop', 8, 220, `${tag}-1-pop.png`);
  await sheet('grow', 10, 170, `${tag}-2-grow.png`);
  await sheet('trip', 5, 340, `${tag}-3-trip.png`);
  console.log('errors', errors);
  await browser.close();
})();
