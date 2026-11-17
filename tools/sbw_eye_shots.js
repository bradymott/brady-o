// The Red-Eye (bonus land 25) and Piwi's House Rule 10: screenshots and in-browser checks (docs/design/BACKSTAGE_STATUS.md).
// Japan 11-4's rooftop tell and Rigging with the Brady Button (rule 10), the REVOKED card, the route map's night
// flights and red-eye plane, the land's map, and each level's key beats: the runaway trolley, the walrus, the bins,
// the curtain and the crew rest (25-1); the lurch, bracing, the sliding carts, the decks (25-2); the flaps, the
// exhaust, the gull escort, the safe gap to the landing-gear bay and its Wormhole (25-3); the cargo hold (25-4; the
// boss phases are in boss_test --shots). Phone landscape (874x402 @2x) and portrait (402x874). Silent.
// usage: BRADY_DIST=<dist> node tools/sbw_eye_shots.js <outdir> [--checks] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'eye-shots'), checksOnly = args.includes('--checks');
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
    window.toArea = (aid, tx, ty) => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = A.anchors.in || A.anchors.start; if (g.area.idx !== k) g.loadArea(k, an.x, an.y); P().invuln = 999; if (tx != null) place(tx, ty); };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } if (g.player) g.player.invuln = 999; };
    window.clearDone = ids => { for (const id of ids) B.Save.data.done[id] = true; };
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
    // Japan 11-4: the rooftop's tell, the spring, off the top into the Rigging, the Brady Button (rule 10)
    await run('roof', async () => {
      await page.evaluate(() => { fresh(); const g = play('11-4'); const an = g.level.areas[0].anchors.riggingDrop; g.loadArea(0, an.x, an.y); P().invuln = 999; place(14, 5); sim(0.5); freeze(); });
      await shot('01-11-4-rooftop-tell.png');
      const r = await page.evaluate(() => { thaw(); const g = S(), p = P(); const sp = g.entities.find(e => e.constructor.name === 'Spring'); p.x = sp.cx - p.w / 2; p.y = sp.y - p.h - 6; p.vy = 2 * 32; sim(1.2, { jump: true }); return { area: g.area.aid }; });
      check('11-4: hold jump on the rooftop spring: off the top into the Rigging', r.area === 'rigging', r);
      await page.evaluate(() => { sim(1.0); place(10, 12); sim(0.3); freeze(); });
      await shot('02-11-4-rigging-inside.png');
      await page.evaluate(() => { thaw(); place(28, 3); sim(0.4); freeze(); });
      await shot('03-11-4-rigging-button.png');
      const r2 = await page.evaluate(() => { thaw(); const b = S().entities.find(e => e.isButton); const p = P(); p.x = b.x - p.w - 2; p.y = b.y + b.h - p.h; p.facing = 1; sim(0.2); sim(0.05, { action: true, actionPressed: true }); const T = window.BRADY.Save.data.tour; return { fx: !!S().buttonFx, rule: T.rules[10], land: !!T.lands.eye, unl: !!window.BRADY.Save.data.unlocked['25-1'] }; });
      check('11-4: slapping the Brady Button revokes rule 10 and opens The Red-Eye', r2.fx && r2.rule && r2.rule.at === '11-4' && r2.land && r2.unl, r2);
      await page.evaluate(() => { sim(1.2); freeze(); }); await shot('04-rule-10-revoked-card.png');
      await page.evaluate(() => { thaw(); sim(2.4); freeze(); }); await shot('05-rule-10-new-land-map.png');
      const r3 = await page.evaluate(() => { thaw(); sim(2.5); const g = S(), p = P(); const k = g.area; p.x = 4 * 32; p.y = 12 * 32 - p.h; p.vx = 0; p.vy = 3 * 32; sim(1.5); return { area: g.area.aid }; });
      check('11-4: the rope through the deck drops back down onto the rooftop', r3.area === 'biru', r3);
    });
    // the route map: The Red-Eye's pin, the night flights between cleared lands, the red-eye plane circling
    await run('route', async () => {
      const r = await page.evaluate(() => {
        thaw(); { const T = window.BRADY.Save.data.tour || window.BRADY_TOUR.TourProgress.data(); T.rules[10] = T.rules[10] || { at: '11-4' }; T.lands.eye = true; window.BRADY.Save.data.unlocked['25-1'] = true; }
        clearDone(['1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3', '2-4', '2-5', '3-1', '3-2', '3-3', '3-4', '3-5', '11-1', '11-2', '11-3', '11-4', '11-5']);
        window.BRADY.goToMap('world', 1, '11-4');
        for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); }
        S().openRoute({ dest: 'eye' });
        for (let k = 0; k < 60 && (S().rRevealQ == null || S().rReveal || S().rRevealQ.length); k++) sim(0.25);
        S().dest = 'eye'; sim(1.0);
        const N = window.BRADY_TOUR.TourNight; return { mode: S().mode, night: N.on(), lands: N.lands().map(s => s.id), isNight: N.isNight('mx', 'br') };
      });
      check('route map: rule 10 wakes night flights between cleared lands', r.night && r.isNight && r.lands.length >= 3, r);
      // (the red-eye plane goes round the globe in under a minute: wait until it passes over this part of the map)
      await page.evaluate(() => { const s = S(); s.t = (((s.cam.lon + 6 + 360) % 360) / 57.3) / 0.12; sim(0.05); freeze(); }); await shot('06-route-map-red-eye-night-flights.png');
      const r2 = await page.evaluate(() => { thaw(); const s = S(); s.sel = 'mx'; s.plane.lon = window.BRADY_TOUR.Tour.stops.mx.lon; s.plane.lat = window.BRADY_TOUR.Tour.stops.mx.lat; s.flyTo('br'); return { night: !!(s.flight && s.flight.night), dur: s.flight && s.flight.dur }; });
      check('route map: a flight between two cleared lands is a quick night flight', r2.night && r2.dur <= 1.6, r2);
      await page.evaluate(() => { sim(0.7); freeze(); }); await shot('07-route-map-night-flight.png');
    });
    // the land's map: the cutaway jumbo
    await run('owmap', async () => {
      const r = await page.evaluate(() => { thaw(); window.BRADY.goToMap('world', 1, '25-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { mode: s.mode, cc: s.ow && s.ow.cc }; });
      check('the Red-Eye has its own walkable map', r.cc === 'eye', r);
      await page.evaluate(() => freeze()); await shot('08-red-eye-overworld-map.png');
      await page.evaluate(() => { thaw(); const ow = S().ow; ow.cam.x = 760; ow.cam.y = 420; ow.clampCam && ow.clampCam(); sim(0.1); freeze(); });
      await shot('09-red-eye-overworld-wing.png');
    });
    // 25-1 Aisle Seat
    await run('aisle', async () => {
      await page.evaluate(() => { thaw(); const g = play('25-1'); P().invuln = 999; place(9, 11); sim(2.6); place(11, 11); sim(0.05); freeze(); });
      const r = await page.evaluate(() => { const g = S(); const d = g.entities.find(e => e.constructor.name === 'TourDoom'); return { look: d && d.look, front: d && Math.round(d.front) }; });
      check('25-1: the chase front is the runaway drinks trolley', r.look === 'trolley', r);
      await shot('10-25-1-trolley-chase.png');
      const r2 = await page.evaluate(() => { thaw(); const g = S(), d = g.entities.find(e => e.constructor.name === 'TourDoom'), p = P(); p.setPower(1, true); p.invuln = 0; p.x = d.front - 20; p.y = 12 * 32 - p.h; sim(0.05); const res = { pushed: p.x > d.front, invuln: p.invuln > 0, dead: !!p.dead }; p.invuln = 999; return res; });
      check('25-1: the trolley costs a hit and shoves Brady on ahead of it', r2.pushed && r2.invuln && !r2.dead, r2);
      const r3 = await page.evaluate(() => { const g = S(), p = P(); p.invuln = 999; const w = g.entities.find(e => e.constructor.name === 'EyeWalrus'); p.x = w.cx - p.w / 2; p.y = w.y - p.h - 60; p.vy = 6 * 32; let minVy = 0; for (let k = 0; k < 60; k++) { sim(1 / 120, { jump: true }); minVy = Math.min(minVy, p.vy); } return { minVy: Math.round(minVy / 32) }; });
      check('25-1: the snoring walrus is a trampoline', r3.minVy <= -18, r3);
      await page.evaluate(() => { sim(0.25, { jump: true }); freeze(); }); await shot('11-25-1-walrus-bounce.png');
      await page.evaluate(() => { thaw(); place(96, 11); sim(0.7); freeze(); }); await shot('12-25-1-bin-drops.png');
      await page.evaluate(() => { thaw(); place(108, 11); sim(0.3); freeze(); }); await shot('13-25-1-galley-curtain.png');
      await page.evaluate(() => { thaw(); place(122, 9); sim(1.6); freeze(); }); await shot('14-25-1-sloth.png');
      await page.evaluate(() => { thaw(); place(150, 11); sim(0.3); freeze(); }); await shot('15-25-1-cola-spill.png');
      await page.evaluate(() => { thaw(); toArea('crew', 12, 11); sim(0.3); freeze(); }); await shot('16-25-1-crew-rest.png');
    });
    // 25-2 Turbulence
    await run('turb', async () => {
      await page.evaluate(() => { thaw(); const g = play('25-2'); P().invuln = 999; place(4, 17); sim(0.3); freeze(); });
      await shot('20-25-2-start.png');
      // the warning, then the lurch: the cart over the hole slides off; Brady standing on it goes with it
      const r = await page.evaluate(() => {
        thaw(); const g = S(), p = P(), clock = g.entities.find(e => e.constructor.name === 'EyeLurchClock'), per = clock.period;
        const k = g.t % per, wait = (per - k) - 1.0; if (wait > 0) sim(wait); // 1 s before the next lurch
        const on0 = g.toggleBit(0);
        place(on0 ? 27 : 23, on0 ? 16 : 17); sim(0.05);
        return { warnLit: (g.t % per) > per - 1.5, on0 };
      });
      check('25-2: the seat-belt sign warns before a lurch', r.warnLit, r);
      await page.evaluate(() => freeze()); await shot('21-25-2-seat-belt-warning.png');
      const r2 = await page.evaluate(() => { thaw(); const g = S(), p = P(), x0 = p.x; sim(1.3); return { on: g.toggleBit(0), dx: Math.round((p.x - x0) / 32), y: Math.round((p.y + p.h) / 32), dead: p.dead }; });
      check('25-2: the lurch slides the cart and carries Brady standing on it', !r2.dead && Math.abs(r2.dx) >= 3, r2);
      await page.evaluate(() => freeze()); await shot('22-25-2-after-the-lurch.png');
      // bracing: crouched on the ground, the shove doesn't move him
      const r3 = await page.evaluate(() => { thaw(); const g = S(), p = P(), clock = g.entities.find(e => e.constructor.name === 'EyeLurchClock'), per = clock.period; place(40, 17); const k = g.t % per; sim(per - k - 0.3); const x0 = p.x; sim(0.9, { down: true }); const braced = Math.abs(p.x - x0); place(40, 17); const k2 = g.t % per; sim(per - k2 - 0.3); const x1 = p.x; sim(0.9); return { braced: Math.round(braced), loose: Math.round(Math.abs(p.x - x1)) }; });
      check('25-2: holding DOWN braces against the shove; standing loose, it moves you', r3.braced < 6 && r3.loose > 20, r3);
      await page.evaluate(() => { const g = S(); place(74, 7); sim(0.3); freeze(); }); await shot('23-25-2-upper-deck-jammed-cart.png');
      await page.evaluate(() => { thaw(); place(70, 25); sim(0.3); freeze(); }); await shot('24-25-2-cargo-hold-container.png');
      await page.evaluate(() => { thaw(); place(100, 17); sim(0.3); freeze(); }); await shot('25-25-2-first-class.png');
      await page.evaluate(() => { thaw(); place(108, 7); sim(0.3); freeze(); }); await shot('26-25-2-flight-deck.png');
      await page.evaluate(() => { thaw(); toArea('pets', 10, 11); sim(0.3); freeze(); }); await shot('27-25-2-pet-hold.png');
    });
    // 25-3 Wing Walk
    await run('wing', async () => {
      await page.evaluate(() => { thaw(); const g = play('25-3'); P().invuln = 999; place(8, 12); sim(0.3); freeze(); });
      await shot('30-25-3-start-over-wing-exit.png');
      await page.evaluate(() => { thaw(); place(28, 12); sim(0.3); freeze(); }); await shot('31-25-3-flap-and-the-slide-gap.png');
      const r = await page.evaluate(() => { thaw(); const g = S(), p = P(); place(48, 11); p.vy = 4 * 32; sim(0.6); const y0 = Math.round((p.y + p.h) / 32); sim(1.4); return { dead: p.dead, rowAfter: Math.round((p.y + p.h) / 32), y0 }; });
      check('25-3: the engine exhaust catches a fall and lifts Brady up', !r.dead && r.rowAfter < 13, r);
      await page.evaluate(() => freeze()); await shot('32-25-3-exhaust-lift.png');
      await page.evaluate(() => { thaw(); place(57, 12); sim(0.2); const g = S(); const gull = g.entities.find(e => e.skin === 'eyeGull'); if (gull) { const p = P(); p.x = gull.cx - p.w / 2; p.y = gull.y - p.h - 1; p.vy = 0; } sim(1.0); freeze(); });
      await shot('33-25-3-gull-escort.png');
      const r2 = await page.evaluate(() => { thaw(); const g = S(), p = P(); p.invuln = 999; place(17, 12); p.x = 17 * 32 + 16 - p.w / 2; p.y = 13 * 32 + 4; p.vy = 4 * 32; sim(2.0); return { dead: p.dead || p.state === 'dying' || g.state !== 'play' }; });
      check('25-3: an ordinary gap in the wing is a long way down', r2.dead, r2);
      const r3 = await page.evaluate(() => { const g = play('25-3'); const p = P(); place(34, 12); p.y = 15 * 32; p.vy = 4 * 32; sim(2.5); return { area: S().area.aid }; });
      check('25-3: the gap over the open landing-gear bay drops into the backstage', r3.area === 'gear', r3);
      await page.evaluate(() => { sim(0.5); place(16, 11); sim(0.3); freeze(); }); await shot('34-25-3-gear-bay-wormhole.png');
      const r4 = await page.evaluate(() => { thaw(); const w = S().entities.find(e => e.isWarp); place(Math.floor(w.cx / 32), 11); sim(0.05, { up: true, upPressed: true }); for (let k = 0; k < 900 && S().state !== 'results'; k++) sim(1 / 120); return { state: S().state, key: S().exitKey }; });
      check('25-3: the Wormhole in the gear bay leaves through its warp exit (to Japan)', r4.state === 'results' && r4.key === 'warp', r4);
      await page.evaluate(() => { const g = play('25-3'); place(104, 12); sim(0.3); freeze(); }); await shot('35-25-3-flap-and-spoiler-wall.png');
      await page.evaluate(() => { thaw(); place(122, 12); sim(0.3); freeze(); }); await shot('36-25-3-winglet-gate.png');
    });
    // 25-4: the cargo hold lead-in
    await run('hold', async () => {
      await page.evaluate(() => { thaw(); const g = play('25-4'); place(20, 13); sim(0.3); freeze(); });
      await shot('40-25-4-cargo-hold.png');
    });
  });
  // portrait
  await session({ width: 402, height: 874 }, async (page, shot, run) => {
    await run('p-roof', async () => {
      await page.evaluate(() => { fresh(); const g = play('11-4'); const an = g.level.areas[0].anchors.riggingDrop; g.loadArea(0, an.x, an.y); P().invuln = 999; place(9, 5); sim(0.5); freeze(); });
      await shot('50-portrait-11-4-rooftop-tell.png');
    });
    await run('p-aisle', async () => { await page.evaluate(() => { thaw(); play('25-1'); place(9, 11); sim(2.6); place(11, 11); sim(0.05); freeze(); }); await shot('51-portrait-25-1-trolley.png'); });
    await run('p-turb', async () => { await page.evaluate(() => { thaw(); play('25-2'); place(60, 7); sim(0.3); freeze(); }); await shot('52-portrait-25-2-upper-deck.png'); });
    await run('p-wing', async () => { await page.evaluate(() => { thaw(); play('25-3'); place(30, 12); sim(0.3); freeze(); }); await shot('53-portrait-25-3-wing.png'); });
    await run('p-map', async () => {
      await page.evaluate(() => { thaw(); window.BRADY.Save.data.tour.rules = { 10: { at: '11-4' } }; window.BRADY.Save.data.tour.lands.eye = true; window.BRADY.Save.data.unlocked['25-1'] = true; window.BRADY.goToMap('world', 1, '25-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } freeze(); });
      await shot('54-portrait-red-eye-map.png');
    });
  });
  console.log(failures ? `${failures} RED-EYE CHECK(S) FAILED` : 'ALL RED-EYE CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
