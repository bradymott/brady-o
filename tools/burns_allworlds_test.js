// Load every registered world with the new renderer (medium tier): errors, state, stats, one frame each
const { chromium } = require('playwright');
const path = require('path');
// Loads every registered Burning Man world and renders one frame each.
// usage: node tools/burns_allworlds_test.js   (BRADY_DIST=<folder> for a private build; ONLY=1,17 for some worlds)
const DIST = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const SHOTS = path.join(__dirname, '..', 'shots', 'worlds'); require('fs').mkdirSync(SHOTS, { recursive: true });
const D = path.join(DIST, 'site/burning-man/index.html');
const log = (...a) => process.stderr.write(a.join(' ') + '\n');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 1 })).newPage(); page.setDefaultTimeout(600000);
  const errs = []; page.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { const t = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && !/GPU stall|GL Driver|light pool/.test(t)) errs.push(m.type() + ': ' + t.slice(0, 300)); });
  await page.goto('file://' + D); await page.waitForTimeout(1500);
  const ids = await page.evaluate(() => { localStorage.clear(); window.BRADY.Save.load(); window.__origRAF = window.requestAnimationFrame; return Object.keys(window.BRADY_BURNS.BurnsWorlds.defs).map(Number); });
  log('registered worlds:', ids.join(','));
  for (const id of (process.env.ONLY ? process.env.ONLY.split(',').map(Number) : ids)) {
    errs.length = 0;
    await page.evaluate((id) => { window.requestAnimationFrame = window.__origRAF; window.__origRAF(t => window.BRADY.Game.frame(t)); const B = window.BRADY_BURNS, sv = B.BurnsSave.get(); sv.seenIntro = true; sv.settings.gfx = 'medium'; for (let k = 1; k < 20; k++) sv.unlocked[k] = true; B.debug.play(id); }, id);
    let state = 'load';
    for (let i = 0; i < 240 && state === 'load'; i++) { await page.waitForTimeout(1000); state = await page.evaluate(() => window.BRADY.Game.scene.state); }
    await page.waitForTimeout(1500);
    const st = await page.evaluate(() => { window.requestAnimationFrame = () => 0; const G = window.BRADY.Game, s = G.scene; let ok = true, e = null; try { for (let i = 0; i < 60; i++) s.update(1 / 120); s.fade = 0; s.lastFrame = performance.now() - 16; G.ctx.setTransform(1, 0, 0, 1, 0, 0); s.draw(G.ctx); } catch (err) { ok = false; e = String(err && err.message); } return { state: s.state, msg: s.noglMsg || null, ok, e, actors: s.actors ? s.actors.length : 0, draws: s.stats && s.stats.draws, tris: s.stats && Math.round(s.stats.tris / 1000) + 'k', sh: s.R && Math.round((s.R.shadowStats || 0) / 1000) + 'k' }; });
    try { await page.screenshot({ path: path.join(SHOTS, 'world' + id + '.png'), timeout: 120000 }); } catch (e) { log('shot timeout', id); }
    log('world', id, JSON.stringify(st), errs.length ? '\n   ' + errs.slice(0, 6).join('\n   ') : '');
  }
  await browser.close();
})();
