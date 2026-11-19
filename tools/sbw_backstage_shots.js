// Screenshots (and a few in-browser checks) of the backstage areas, Wormholes, Brady Buttons, the bonus land and its
// map reveals (docs/design/BACKSTAGE_STATUS.md). Phone landscape (874x402 @2x) plus a few in portrait (402x874).
// Silent (tools/sbw_silent.js). Full resolution is pinned before every capture.
// usage: BRADY_DIST=<dist> node tools/sbw_backstage_shots.js <outdir> [--checks] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'backstage-shots'), checksOnly = args.includes('--checks');
const want = args.slice(1).filter(a => !a.startsWith('--'));
fs.mkdirSync(out, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); if (!ok) failures++; };

async function session(viewport, fn) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await silence(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(appPage);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const B = window.BRADY, T = window.BRADY_TOUR;
    window.S = () => B.Game.scene; window.P = () => B.Game.scene.player;
    window.sim = (sec, inp) => {
      const G = B.Game, I = B.Input, steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (k > 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; } }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) if (typeof inp[key] === 'boolean') I[key] = false;
    };
    window.fresh = () => { const d = B.Save.data; for (const k of ['done', 'unlocked', 'exits', 'secretExits', 'gold', 'best']) d[k] = {}; d.unlocked['1-1'] = true; d.tour = null; d.lives = 9; d.seenTourIntro = true; T.TourProgress.data(); };
    window.play = (id, area, ax, ay) => {
      const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9;
      const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(1.6);
      if (area != null) { g.loadArea(area, ax, ay); }
      g.player.invuln = 999; return g;
    };
    window.place = (tx, ty) => { const g = S(), p = P(); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); if (checksOnly) return; await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, name) }); };
  const run = async (name, f) => { if (want.length && !want.some(w => name.startsWith(w))) return; try { await pin(); await f(); } catch (e) { check(name + ' runs', false, String(e.message).slice(0, 300)); } };
  await fn(page, shot, run);
  check(`${viewport.width}x${viewport.height}: no page errors`, !errors.length, errors.slice(0, 5));
  await browser.close();
}

(async () => {
  await session({ width: 874, height: 402 }, async (page, shot, run) => {
    // 1-4: the rim with the spring and the dangling sandbag (the entrance hint as the player sees it)
    await run('rim', async () => {
      await page.evaluate(() => { fresh(); const g = play('1-4'); const an = g.level.areas[0].anchors.riggingDrop; g.loadArea(0, an.x, an.y); P().invuln = 999; place(9, 3); sim(0.4); freeze(); });
      await shot('01-rim-entrance-hint.png');
    });
    await run('rigging', async () => {
      const r = await page.evaluate(() => { thaw(); const g = S(), p = P(); const sp = g.entities.find(e => e.constructor.name === 'Spring'); p.x = sp.cx - p.w / 2; p.y = sp.y - p.h - 6; p.vy = 2 * 32; sim(1.2, { jump: true }); return { area: g.area.aid, fx: !!g.seamFx }; });
      check('1-4: hold jump on the rim spring: off the top into the Rigging', r.area === 'rigging', r);
      await page.evaluate(() => { const g = S(); sim(0.12); freeze(); });
      await shot('02-rigging-curtain-whip.png');
      await page.evaluate(() => { thaw(); sim(1.2); place(9, 12); sim(0.3); freeze(); });
      await shot('03-rigging-inside.png');
      await page.evaluate(() => { thaw(); place(24, 12); sim(0.3); freeze(); });
      await shot('04-rigging-deck.png');
    });
    await run('button', async () => {
      await page.evaluate(() => { thaw(); place(28, 3); sim(0.4); freeze(); });
      await shot('05-button-before.png');
      const r = await page.evaluate(() => { thaw(); const b = S().entities.find(e => e.isButton); const p = P(); p.x = b.x - p.w - 2; p.y = b.y + b.h - p.h; p.facing = 1; sim(0.2); sim(0.05, { action: true, actionPressed: true }); return { fx: !!S().buttonFx, rules: window.BRADY.Save.data.tour.rules }; });
      check('1-4: slapping the Brady Button plays the cut and revokes rule 3', r.fx && r.rules && r.rules[3], r);
      await page.evaluate(() => { sim(1.2); freeze(); }); await shot('06-button-revoked-card.png');
      await page.evaluate(() => { thaw(); sim(2.4); freeze(); }); await shot('07-button-new-land-map.png');
      await page.evaluate(() => { thaw(); sim(2.5); freeze(); }); await shot('08-button-after.png');
    });
    await run('warp', async () => {
      await page.evaluate(() => { thaw(); const w = S().entities.find(e => e.isWarp); place(Math.floor(w.cx / 32) - 2, 12); sim(0.3); freeze(); });
      await shot('09-wormhole-before.png');
      await page.evaluate(() => { thaw(); const w = S().entities.find(e => e.isWarp); place(Math.floor(w.cx / 32), 12); sim(0.05, { up: true, upPressed: true }); sim(0.5); freeze(); });
      await shot('10-wormhole-during.png');
      const r = await page.evaluate(() => { thaw(); for (let k = 0; k < 900 && S().state !== 'results'; k++) sim(1 / 120); freeze(); return { state: S().state, key: S().exitKey }; });
      check('1-4: the Wormhole clears the level through its warp exit', r.state === 'results' && r.key === 'warp', r);
      await shot('11-wormhole-results.png');
    });
    await run('map', async () => {
      // the map after the Wormhole: Mexico, the trip across the globe, Ecuador with Brady popping out at 2-7
      await page.evaluate(() => { thaw(); window.BRADY.goToMap('world', 1, '1-4'); });
      // (Chinka's first postcard from a land is put away as a player would)
      await page.evaluate(() => { for (let k = 0; k < 60 && !(S().mode === 'route' && S().rReveal); k++) { if (S().card) S().card = null; sim(0.25); } sim(1.0); });
      await shot('12-map-wormhole-trip.png');
      await page.evaluate(() => { for (let k = 0; k < 60 && !(S().mode === 'land' && S().ow && S().ow.cc === 'ec'); k++) sim(0.25); S().card = null; sim(0.5); });
      const r = await page.evaluate(() => { const s = S(); return { mode: s.mode, cc: s.ow && s.ow.cc, at: s.ow && s.ow.walker.at, emerge: !!(s.ow && s.ow.emergeFx) }; });
      check('map: after the trip Brady is in Ecuador at 2-7', r.cc === 'ec' && r.at === '2-7', r);
      await shot('13-map-ecuador-arrival.png');
      await page.evaluate(() => { for (let k = 0; k < 60 && !S().ow.idle(); k++) { if (S().card) S().card = null; sim(0.25); } sim(1); });
      await shot('14-map-ecuador-warp-link.png');
      // Festival Fields: the route map with the new land open
      await page.evaluate(() => { S().openRoute({ dest: 'fest' }); for (let k = 0; k < 40 && (S().rReveal || (S().rRevealQ && S().rRevealQ.length)); k++) sim(0.25); S().dest = 'fest'; sim(0.5); });
      await shot('15-route-map-festival-open.png');
    });
    // the bonus levels
    const level = async (name, id, area, tx, ty, file) => run(name, async () => {
      await page.evaluate(([id, area, tx, ty]) => { thaw(); const g = play(id); const k = areaOf(g, area); if (k !== g.area.idx) { const A = g.level.areas[k], an = A.anchors.in || A.anchors.start; g.loadArea(k, an.x, an.y); } P().invuln = 999; place(tx, ty); sim(0.3); freeze(); }, [id, area, tx, ty]);
      await shot(file);
    });
    await level('fest1-gate', '23-1', 'campsite', 5, 11, '20-fest-23-1-gate-field.png');
    await level('fest1-ropes', '23-1', 'campsite', 36, 11, '21-fest-23-1-guy-ropes.png');
    await level('fest1-stage', '23-1', 'campsite', 70, 11, '22-fest-23-1-main-stage-locks.png');
    await level('fest1-chill', '23-1', 'campsite', 10, 25, '23-fest-23-1-chill-field.png');
    await level('fest1-lost', '23-1', 'campsite', 36, 25, '24-fest-23-1-lost-property.png');
    await level('fest1-pond', '23-1', 'campsite', 62, 25, '25-fest-23-1-airbed-pond.png');
    await level('fest1-wings', '23-1', 'wings', 30, 11, '26-fest-23-1-wings-backstage.png');
    await level('fest2-start', '23-2', 'mud', 6, 11, '30-fest-23-2-boardwalk.png');
    await run('fest2-tide', async () => {
      await page.evaluate(() => { thaw(); const g = play('23-2'); P().invuln = 999; place(10, 25); sim(0.3); freeze(); });
      await shot('31-fest-23-2-wallow-low-mud.png');
      await page.evaluate(() => { thaw(); const g = S(); P().invuln = 999; for (let k = 0; k < 40 && g.area.waterTop > 16 * 32; k++) sim(0.25); place(10, 17); sim(0.1); freeze(); });
      const r = await page.evaluate(() => ({ top: Math.round(S().area.waterTop / 32) }));
      check('23-2: the mud rises in a squall', r.top <= 17, r);
      await shot('32-fest-23-2-wallow-high-mud.png');
    });
    await level('fest2-pond', '23-2', 'mud', 40, 25, '33-fest-23-2-duck-pond-drain.png');
    await level('fest2-under', '23-2', 'under', 8, 11, '34-fest-23-2-under-stage.png');
    await level('fest3-start', '23-3', 'disco', 6, 11, '35-fest-23-3-silent-disco-start.png');
    await level('fest3-bridge', '23-3', 'disco', 38, 11, '36-fest-23-3-beat-bridge.png');
    await level('fest3-stacks', '23-3', 'disco', 66, 25, '37-fest-23-3-speaker-stacks.png');
    // a Loading Dock: the truss over the gate (Brazil 3-1), inside the dock, its Brady Button (rule 7: hats)
    await run('dock', async () => {
      await page.evaluate(() => { thaw(); const g = play('3-1'); const gate = g.entities.filter(e => e.constructor.name === 'Gate' && !e.secret && !e.isWarp).pop(); place(Math.floor(gate.cx / 32) - 7, Math.floor((gate.y + gate.h) / 32) - 1); sim(0.3); freeze(); });
      await shot('50-dock-3-1-truss-over-gate.png');
      const r = await page.evaluate(() => { thaw(); const g = S(), k = areaOf(g, 'dock'), A = g.level.areas[k]; g.loadArea(k, A.anchors.in.x, A.anchors.in.y); P().invuln = 999; place(12, 11); sim(0.3); freeze(); return { area: g.area.aid }; });
      check('3-1: the Loading Dock builds', r.area === 'dock', r);
      await shot('51-dock-3-1-inside.png');
      const r2 = await page.evaluate(() => { thaw(); const b = S().entities.find(e => e.isButton); const p = P(); p.x = b.x - p.w - 2; p.y = b.y + b.h - p.h; p.facing = 1; sim(0.2); sim(0.05, { action: true, actionPressed: true }); sim(6); return { rules: window.BRADY.Save.data.tour.rules }; });
      check('3-1: the dock\'s Brady Button revokes rule 7 (hats)', !!r2.rules[7], r2);
      await page.evaluate(() => { const g = play('3-1'); P().invuln = 999; const e = g.entities.find(x => x.enemy && !x.boss && x.w < 90); if (e) place(Math.floor(e.cx / 32) - 3, Math.floor((e.y + e.h - 1) / 32)); sim(0.5); freeze(); });
      await shot('52-hats-and-dancing-3-1.png');
    });
    // a festival enemy dancing (rule 3 is revoked in this session)
    await level('fest-dance', '23-1', 'campsite', 44, 11, '27-fest-dancing-critters.png');
    // the HOUSE RULES page
    await run('rules-page', async () => {
      await page.evaluate(() => { thaw(); play('23-1'); });
      await page.evaluate(() => { const g = S(); g.openPause(); const row = (g.pauseUI || []).find(b => /HOUSE RULES/.test(b.label)); if (row) row.fn(); sim(0.1); freeze(); });
      await shot('28-house-rules-page.png');
    });
  });
  // portrait: the rim tell and the rigging, the wormhole results
  await session({ width: 402, height: 874 }, async (page, shot, run) => {
    await run('portrait-rim', async () => {
      await page.evaluate(() => { fresh(); const g = play('1-4'); const an = g.level.areas[0].anchors.riggingDrop; g.loadArea(0, an.x, an.y); P().invuln = 999; place(8, 3); sim(0.4); freeze(); });
      await shot('40-portrait-rim-hint.png');
    });
    await run('portrait-rigging', async () => {
      await page.evaluate(() => { thaw(); const g = S(); const k = areaOf(g, 'rigging'), A = g.level.areas[k]; g.loadArea(k, A.anchors.in.x, A.anchors.in.y); P().invuln = 999; place(30, 3); sim(0.3); freeze(); });
      await shot('41-portrait-rigging-button.png');
      await page.evaluate(() => { thaw(); const b = S().entities.find(e => e.isButton); const p = P(); p.x = b.x - p.w - 2; p.y = b.y + b.h - p.h; p.facing = 1; sim(0.2); sim(0.05, { action: true, actionPressed: true }); sim(3.2); freeze(); });
      await shot('42-portrait-button-map-cut.png');
    });
  });
  console.log(failures ? `${failures} BACKSTAGE SHOT CHECK(S) FAILED` : 'ALL BACKSTAGE SHOT CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
