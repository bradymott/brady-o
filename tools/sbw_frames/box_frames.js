// a box opened by landing on it, and one kicked, frame by frame: node boxshots.js <dist> <outdir>
const pw = require('playwright');
const path = require('path'), fs = require('fs');
const [dist, out0] = process.argv.slice(2), out = path.resolve(out0); const fdir = path.join(out, 'box-frames'); fs.mkdirSync(fdir, { recursive: true });
(async () => {
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.join(path.resolve(dist), 'site', 'super-brady-o-world', 'index.html')); await page.waitForTimeout(1500);
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shots = [];
  const setup = c => page.evaluate(c => {
    const B = window.BRADY, G = B.Game; B.Save.data.settings.zoom = 'near'; B.Save.data.lives = 9; B.Save.data.tips = {};
    const [w, n] = c.id.split('-').map(Number), lvl = B.getLevel(w, n), g = new B.Play(lvl, {}); G.setScene(g);
    for (let k = 0; k < 240; k++) g.update(1 / 120);
    const ai = lvl.areas.findIndex(a => a.aid === c.area); g.loadArea(ai, c.px, c.py, 0); g.state = 'play';
    for (const e of g.entities) if (e.enemy) e.remove = true; g.player.invuln = 1e9;
    g.camX = Math.max(0, g.player.cx - G.viewW * 0.5); g.camY = g.camTargetY(true);
    window.__g = g; g._u = g.update; g.update = function () {};
    window.__run = (n, inp) => { const I = B.Input; g.update = g._u; for (let k = 0; k < n; k++) { Object.assign(I, inp || {}); g.update(1 / 120); if (k === 0) { I.actionPressed = false; } } for (const key in (inp || {})) I[key] = false; g.update = function () {}; };
    window.__rect = (wx, wy, w, h) => { const S = G.gameRect.w / G.viewW, r = G.gameRect; return { x: Math.max(0, r.x + (wx - g.camX) * S - w / 2), y: Math.max(0, r.y + (wy - g.camY) * S - h / 2), width: w, height: h }; };
  }, c);
  const snap = async (rect, label) => { await pin(); await page.waitForTimeout(60); const f = path.join(fdir, `${String(shots.length).padStart(3, '0')}.png`); await page.screenshot({ path: f, clip: rect }); shots.push({ f, label }); };
  // 1: 8-6 molens: Brady drops onto the LSD box (147,10)
  await setup({ id: '8-6', area: 'molens', px: 147 * 32 + 16, py: 7 * 32 });
  for (let i = 0; i < 24; i++) { const r = await page.evaluate(() => __rect(147 * 32 + 16, 9 * 32, 300, 200)); await snap(r, `land f${i * 4}`); await page.evaluate(() => __run(4, {})); }
  // 2: the module box (13-3, (13,3)): Brady stands beside a floor-ish box? use 7-4 pocket: kick the box from its side
  await setup({ id: '13-3', area: 'module', px: 11 * 32, py: 11 * 32 });
  for (let i = 0; i < 16; i++) { const r = await page.evaluate(() => __rect(__g.player.cx, __g.player.y, 300, 200)); await snap(r, `walk f${i * 6}`); await page.evaluate(() => __run(6, { right: true })); }
  const html = '<html><body style="margin:0;background:#222;font:11px sans-serif;color:#fff"><div style="display:grid;grid-template-columns:repeat(8,220px);gap:2px">' + shots.map(s => `<div><img src="file://${s.f}" style="width:220px;display:block"><div>${s.label}</div></div>`).join('') + '</div></body></html>';
  const hp = path.join(fdir, 'sheet.html'); fs.writeFileSync(hp, html);
  const p2 = await browser.newPage({ viewport: { width: 8 * 222, height: 400 } }); await p2.goto('file://' + hp); await p2.waitForTimeout(500); await p2.screenshot({ path: path.join(out, 'boxes-open.png'), fullPage: true });
  console.log('errors', errors); await browser.close();
})();
