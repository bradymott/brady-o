// open-world flow test: title -> prologue -> city -> enter W1 -> finish -> story card -> back in the city -> map travel -> quit -> CONTINUE
const { chromium } = require('playwright');
const path = require('path');
// usage: node tools/burns_flow_test.js   (BRADY_DIST=<folder> for a private build)
const D = 'file://' + path.join(process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist'), 'site/burning-man/index.html');
const log = (...a) => console.log(...a);
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 1 })).newPage(); page.setDefaultTimeout(900000);
  const errs = []; page.on('pageerror', e => errs.push('PE ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | '))); page.on('console', m => { const t = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && !/light pool/.test(t)) errs.push(m.type() + ': ' + t.slice(0, 300)); });
  await page.goto(D); await page.waitForTimeout(2500);
  await page.evaluate(() => { localStorage.clear(); window.BRADY.Save.load(); window.requestAnimationFrame = () => 0; });
  const run = async (n) => page.evaluate((n) => { const G = window.BRADY.Game; let e = null; try { for (let k = 0; k < n; k++) { const s = G.scene; for (let i = 0; i < 4; i++) s.update(1 / 120); if (s.fade !== undefined && s.state === 'play') s.fade = 0; s.lastFrame = performance.now() - 16; G.ctx.setTransform(1, 0, 0, 1, 0, 0); s.draw(G.ctx); } } catch (err) { e = String(err && err.stack || err).slice(0, 300); } const s = G.scene; return { scene: s.constructor.name, world: s.worldId, state: s.state, e, p: s.player ? [Math.round(s.player.x), Math.round(s.player.z)] : null, next: window.BRADY_BURNS.BurnsOW && (window.BRADY_BURNS.BurnsOW.nextPlace() || {}).world, pal: s.palA ? [s.palA, s.palB, s.tod] : null, region: s.region || null }; }, n);
  const waitPlay = async (world) => { for (let i = 0; i < 200; i++) { const r = await run(1); if (r.state === 'play' && (!world || r.world === world)) return r; await page.waitForTimeout(200); } return run(1); };
  // the title app is up: press CONTINUE/START (fresh save -> the prologue first)
  let r = await waitPlay(900); log('title', JSON.stringify(r));
  await page.evaluate(() => window.BRADY.Game.scene.toHub());
  r = await run(2); log('after START', JSON.stringify(r));
  await page.evaluate(() => { const s = window.BRADY.Game.scene; if (s.go) s.go(); });
  r = await waitPlay(500); log('in the city', JSON.stringify(r));
  // enter World 1 at Gate Road
  await page.evaluate(() => { const B = window.BRADY_BURNS, s = window.BRADY.Game.scene, P = B.BURNS_OW.PLACES.find(q => q.world === 1); s.player.teleport(P.x, 0.2, P.z + 2, 0); B.BurnsOW.enter(s, P); });
  r = await run(160); log('entering', JSON.stringify(r));
  r = await waitPlay(1); log('inside W1', JSON.stringify(r));
  // finish W1 (skip its boss), tap through the results and the story card
  await page.evaluate(() => { const s = window.BRADY.Game.scene; if (s.cine) s.cine.finish(); s.finishWorldNow(); });
  r = await run(3); log('results', JSON.stringify(r));
  await page.evaluate(() => window.BRADY.Game.scene.storyNext());
  r = await run(3); log('story card', JSON.stringify(r));
  await page.evaluate(() => { const s = window.BRADY.Game.scene; if (s.go) s.go(); });
  r = await run(4); log('back in the city', JSON.stringify(r));
  // the map: travel home (Root Society)
  await page.evaluate(() => window.BRADY.Game.scene.openTravelMap());
  r = await run(2); log('map', JSON.stringify(r));
  await page.evaluate(() => { const h = window.BRADY.Game.scene; h.sel = 17; window.BRADY_BURNS.BurnsSave.get().unlocked[17] = true; h.play(); });
  r = await run(6); log('after travel', JSON.stringify(r), JSON.stringify(await page.evaluate(() => { const P = window.BRADY_BURNS.BURNS_OW.PLACES.find(q => q.world === 17); return [Math.round(P.x), Math.round(P.z)]; })));
  // quit to the title and CONTINUE: back where Brady was
  await page.evaluate(() => { const s = window.BRADY.Game.scene; s.player.teleport(120, 0.2, 380, 0); s.saveRun(); window.BRADY_BURNS.BurnsOW.saveSpot(s); s.quit(false); });
  r = await waitPlay(900); log('title again', JSON.stringify(r));
  await page.evaluate(() => window.BRADY.Game.scene.toHub());
  r = await waitPlay(500); log('CONTINUE', JSON.stringify(r));
  log('errors:', errs.length, errs.slice(0, 8).join('\n  '));
  await browser.close();
})();
