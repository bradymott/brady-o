// Screenshots (and in-browser checks) of Mexico 1-7 Casa de Sorpresas (src/29_tour_mx_zcasa.js): every cell of the
// house, every room, the Under-Stage and the Wings, each tell, the treasure X, and Mexico's map before and after Piwi's
// House Rule 7 is revoked. Phone landscape (874x402 @2x) and portrait (402x874 @2x). Silent (tools/sbw_silent.js).
// Full resolution is pinned before every capture.
// usage: BRADY_DIST=<dist> node tools/sbw_casa_shots.js <outdir> [--checks] [--portrait | --landscape] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'casa-shots'), checksOnly = args.includes('--checks');
const want = args.slice(1).filter(a => !a.startsWith('--'));
fs.mkdirSync(out, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); if (!ok) failures++; };

async function session(viewport, tag, fn) {
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
    window.play = (id) => { const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9; const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(1.6); g.player.invuln = 999; return g; };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.go = (aid, tx, ty) => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = A.anchors.in || A.anchors.start; if (g.area.idx !== k) g.loadArea(k, an.x, an.y); P().invuln = 999; if (tx != null) place(tx, ty); return g; };
    window.place = (tx, ty) => { const g = S(), p = P(); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } };
    // Mexico cleared as a player who went through it (every main level, the stand), Brady back on Mexico's map
    window.mexicoDone = () => {
      fresh(); const d = B.Save.data, P0 = T.TourProgress.data(), C = T.Tour.countries.mx;
      for (const id of ['1-1', '1-2', '1-3', '1-4', '1-5']) { d.done[id] = true; d.unlocked[id] = true; T.TourProgress.exit(id, 'main'); }
      for (const r of P0.pending.slice()) T.TourProgress.revealDone(r);
      (P0.seen = P0.seen || {}).mx = true; (P0.cards = P0.cards || {}).mx = true; (P0.lands = P0.lands || {}).mx = true;
    };
    window.overview = () => { const G = B.Game, ow = S().ow, W = G.cssW, H = G.cssH, z = Math.min(W / ow.G.w, H / ow.G.h); ow.fixed = { view: { x: (W - ow.G.w * z) / 2, y: (H - ow.G.h * z) / 2, w: ow.G.w * z, h: ow.G.h * z }, z, cam: { x: ow.G.w / 2, y: ow.G.h / 2 } }; ow.layoutView(); ow.clampCam(); };
    window.openMexico = at => {
      const G = B.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize();
      const m = new T.TourMapScene({ from: at || '1-5' }); G.setScene(m); return m;
    };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); if (checksOnly) return; await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, tag + '-' + name) }); };
  const run = async (name, f) => { if (want.length && !want.some(w => name.startsWith(w))) return; try { await pin(); await f(); } catch (e) { check(tag + ' ' + name + ' runs', false, String(e.stack || e.message).slice(0, 400)); } };
  await fn(page, shot, run);
  check(`${tag}: no page errors`, !errors.length, errors.slice(0, 5));
  await browser.close();
}

const scenes = async (page, shot, run, tag) => {
  // the house, cell by cell (columns 0-27 / 28-55 / 56-83; upstairs rows 0-13, downstairs 14-27)
  const at = async (name, aid, tx, ty, file, after) => run(name, async () => {
    await page.evaluate(([aid, tx, ty]) => { thaw(); if (!S().level || S().level.id !== '1-7') play('1-7'); go(aid, tx, ty); sim(0.35); freeze(); }, [aid, tx, ty]);
    if (after) await page.evaluate(after);
    await shot(file);
  });
  await at('zaguan', 'casa', 6, 25, '01-zaguan-start.png');
  await at('wings-tell', 'casa', 3, 25, '02-zaguan-front-gate-curtain-tell.png');
  await at('shop-front', 'casa', 14, 25, '03-zaguan-tiendita-front.png');
  await at('patio', 'casa', 34, 25, '04-courtyard.png');
  await at('well', 'casa', 45, 25, '05-courtyard-well-tell.png');
  await at('bouncy-front', 'casa', 50, 25, '06-courtyard-bouncy-castle.png');
  await at('garden-gate', 'casa', 52, 25, '07-courtyard-garden-gate.png');
  await at('garden', 'casa', 62, 25, '08-garden-exit.png');
  await at('gallery', 'casa', 6, 11, '09-gallery-attic-door.png');
  await at('roof', 'casa', 34, 11, '10-roof-cistern-grille.png');
  await at('wing', 'casa', 66, 11, '11-piwis-wing-pound-door.png');
  await at('painting', 'casa', 72, 11, '12-piwis-wing-parrot-painting-tell.png');
  // the X before the map (a scuff) and after (it sparkles), then dug
  await run('x', async () => {
    await page.evaluate(() => { thaw(); play('1-7'); go('casa', 32, 25); sim(0.3); freeze(); });
    await shot('13-courtyard-x-scuff.png');
    const r = await page.evaluate(() => { thaw(); const g = S(); g.keys.add('map:casa'); place(34, 25); sim(0.4); const x = g.entities.find(e => e.constructor.name === 'CasaX'); return { dug: x && x.dug }; });
    check(tag + ' 1-7: standing on the X with the map digs up the chest', r.dug, r);
    await page.evaluate(() => { sim(0.5); freeze(); });
    await shot('14-courtyard-x-dug-chest.png');
  });
  // the rooms
  const room = async (name, aid, tx, ty, file, setup) => run(name, async () => {
    await page.evaluate(([aid, tx, ty, setup]) => { thaw(); play('1-7'); go(aid, tx, ty); if (setup) (new Function(setup))(); sim(0.4); freeze(); }, [aid, tx, ty, setup || '']);
    await shot(file);
  });
  await room('tiendita', 'tiendita', 6, 10, '20-tiendita-after-hours.png');
  await run('tiendita-shutters', async () => {
    const r = await page.evaluate(() => { thaw(); play('1-7'); go('tiendita', 8, 10); sim(9); freeze(); const R = S().area.roomState; return { phase: R && R.phase, closed: R && R.closed }; });
    check(tag + ' 1-7 tiendita: the shutters come down', r.closed >= 1, r);
    await shot('21-tiendita-shutters-down.png');
  });
  await room('attic', 'atico', 5, 10, '22-attic-door-side.png');
  await run('attic-ceiling', async () => {
    const r = await page.evaluate(() => { thaw(); play('1-7'); go('atico', 7, 10); sim(0.2); sim(1.2, { right: true }); sim(0.4); const p = P(); return { up: p.y < 4 * 32, flipped: !!(p.flip || p.flipped || p.gflip || p.inFlip) }; });
    check(tag + ' 1-7 attic: past the painted line Brady walks on the ceiling', r.up, r);
    await page.evaluate(() => { freeze(); });
    await shot('23-attic-on-the-ceiling.png');
    await page.evaluate(() => { thaw(); place(26, 1); sim(1.2, { right: true }); sim(0.6); freeze(); });
    await shot('24-attic-key-and-far-side.png');
  });
  await run('cistern', async () => {
    await page.evaluate(() => { thaw(); play('1-7'); go('aljibe'); sim(0.2); freeze(); });
    await shot('25-cistern-bottom.png');
    const r = await page.evaluate(() => { thaw(); const g = S(), y0 = g.lavaY; sim(7); return { rose: g.lavaY < y0 - 32 }; });
    check(tag + ' 1-7 cistern: the sand pours in and rises', r.rose, r);
    await page.evaluate(() => { const p = P(); place(Math.floor(p.cx / 32), Math.floor((p.y + p.h - 1) / 32)); sim(0.1); freeze(); });
    await shot('26-cistern-sand-rising.png');
    const r2 = await page.evaluate(() => { thaw(); const g = S(), p = P(); p.invuln = 0; const lives = window.BRADY.Save.data.lives; g.lavaY = p.y; sim(0.2); return { dead: p.dead, lives: window.BRADY.Save.data.lives === lives, bottom: p.y > (g.area.H - 6) * 32 }; });
    check(tag + ' 1-7 cistern: caught by the sand, Brady is spat out at the bottom (no death, no life lost)', !r2.dead && r2.lives && r2.bottom, r2);
    await page.evaluate(() => { thaw(); P().invuln = 999; place(14, 5); sim(0.6); freeze(); });
    await shot('27-cistern-rim.png');
  });
  await room('pound', 'pound', 14, 10, '28-pound-fight.png', 'sim(2.6)');
  await room('castle', 'castillo', 8, 10, '29-bouncy-castle.png');
  await room('study', 'estudio', 6, 10, '30-map-room.png');
  await run('study-peek', async () => {
    const r = await page.evaluate(() => { thaw(); play('1-7'); go('estudio', 18, 3); sim(0.6); const R = S().area.roomState; return { won: R.won, peek: R.peekT > 0, has: S().keys.has('map:casa') }; });
    check(tag + ' 1-7 map room: taking the map shows where the X is', r.won && r.peek && r.has, r);
    await page.evaluate(() => { sim(0.6); freeze(); });
    await shot('31-map-room-peek.png');
  });
  await room('under', 'under', 8, 11, '32-under-stage.png');
  await room('under-p2', 'under', 20, 1, '33-under-stage-catwalks.png');
  await room('wings', 'wings', 30, 11, '34-wings.png');
  await room('wings-p3', 'wings', 14, 2, '35-wings-catwalks.png');
  // through the well (the bottom seam) into the Under-Stage; out of the front gate (the left seam) into the Wings
  await run('seams', async () => {
    const r = await page.evaluate(() => { thaw(); play('1-7'); go('casa', 42, 18); sim(1.6, { down: true }); return { area: S().area.aid }; });
    check(tag + ' 1-7: down the well into the Under-Stage', r.area === 'under', r);
    const r2 = await page.evaluate(() => { thaw(); play('1-7'); go('casa', 2, 25); sim(1.2, { left: true }); return { area: S().area.aid }; });
    check(tag + ' 1-7: left out of the front gate into the Wings', r2.area === 'wings', r2);
  });
  // Mexico's map: before Rule 7 (no Casa), then after (the trail grows from the hacienda and the Casa pops up)
  await run('map', async () => {
    await page.evaluate(() => { mexicoDone(); openMexico('1-5'); sim(2.5); });
    const r0 = await page.evaluate(() => { const ow = S().ow; return { mode: S().mode, cc: ow && ow.cc, casa: !!(ow && ow.by['1-7'] && ow.by['1-7'].visible) }; });
    check(tag + ' map: before Rule 7, Mexico\'s map has no Casa', r0.cc === 'mx' && !r0.casa, r0);
    await shot('40-map-mexico-before-rule-7.png');
    await page.evaluate(() => { overview(); sim(0.3); }); await shot('43-map-mexico-overview-before.png');
    await page.evaluate(() => { const T = window.BRADY_TOUR; T.TourRules.revoke(7, '3-1'); openMexico('1-5'); sim(1.2); });
    await shot('41-map-mexico-rule-7-trail-growing.png');
    await page.evaluate(() => { for (let k = 0; k < 40 && S().ow && (S().ow.revealQ.length || S().ow.reveal); k++) sim(0.25); sim(1.5); });
    const r1 = await page.evaluate(() => { const ow = S().ow, T = window.BRADY_TOUR; const E = T.TourMapScene.Graph.edges(T.Tour.countries.mx, T.TourMapScene.Graph.nodes(T.Tour.countries.mx)); const e = E.find(x => (x.a === '1-5' && x.b === '1-7') || (x.a === '1-7' && x.b === '1-5')); return { casa: !!(ow.by['1-7'] && ow.by['1-7'].visible), trail: !!(e && e.open && e.visible), route: !!T.TourMapScene.Graph.route(E, '1-5', '1-7'), enter: !!(ow.by['1-7'] && ow.by['1-7'].enter) }; });
    check(tag + ' map: after Rule 7, the Casa\'s stop shows, its trail is open and walkable from 1-5', r1.casa && r1.trail && r1.route && r1.enter, r1);
    await page.evaluate(() => { openMexico('1-7'); sim(1.5); }); await shot('42-map-mexico-after-rule-7.png');
    await page.evaluate(() => { overview(); sim(0.3); }); await shot('44-map-mexico-overview-after.png');
  });
};

(async () => {
  const L = !args.includes('--portrait'), Pt = !args.includes('--landscape');
  if (L) await session({ width: 874, height: 402 }, 'land', (page, shot, run) => scenes(page, shot, run, 'land'));
  if (Pt) await session({ width: 402, height: 874 }, 'port', (page, shot, run) => scenes(page, shot, run, 'port'));
  console.log(failures ? `${failures} CASA SHOT CHECK(S) FAILED` : 'ALL CASA SHOT CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
