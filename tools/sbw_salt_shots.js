// The Table Salt Sea (hidden land 34): screenshots and in-browser checks. The hidden entrance in Morocco 5-3 (the
// salt saucer at the last citrus stall: one crystal on its rim holds a tiny blue horizon), the arrival, the land's
// map, each stage's mechanic played with real inputs (the stick and the two buttons through the game loop), each
// secret room (found, won once, failed once, left by its exit), the boss. Phone landscape (874x402 @2x, the game's
// 844x390 view) and portrait (402x874). Silent. `--bot`: every stage start to finish with enemies and damage on.
// usage: BRADY_DIST=<dist> node tools/sbw_salt_shots.js <outdir> [--checks] [--bot] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'salt-shots'), checksOnly = args.includes('--checks');
const want = args.slice(1).filter(a => !a.startsWith('--'));
fs.mkdirSync(out, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); if (!ok) failures++; };

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
    // real inputs through the game loop: held keys for `sec` seconds (the pressed edges only on the first frame)
    window.sim = (sec, inp) => {
      const G = B.Game, I = B.Input, steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (k > 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; } }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) if (typeof inp[key] === 'boolean') I[key] = false;
    };
    window.press = (key, inp) => sim(1 / 120, Object.assign({ [key]: true, [key + 'Pressed']: true }, inp || {}));
    window.fresh = () => { const d = B.Save.data; for (const k of ['done', 'unlocked', 'exits', 'secretExits', 'gold', 'best']) d[k] = {}; d.unlocked['1-1'] = true; d.tour = null; d.lives = 9; d.seenTourIntro = true; T.TourProgress.data(); };
    window.play = (id, area, ax, ay) => {
      const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9;
      const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(1.6);
      if (area != null) { g.loadArea(area, ax, ay); }
      g.player.invuln = 999; return g;
    };
    window.place = (tx, ty) => { const g = S(), p = P(); g.timeLeft = Math.max(g.timeLeft || 0, 300); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.toArea = (aid, tx, ty) => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = A.anchors.in || A.anchors.start || Object.values(A.anchors)[0] || { x: 96, y: (A.H - 4) * 32 }; if (g.area.idx !== k) g.loadArea(k, an.x, an.y); P().invuln = 999; if (tx != null) place(tx, ty); };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } if (g.player) g.player.invuln = 999; };
    window.tile = (x, y) => { const A = S().area; return A.tiles[y * A.W + x]; };
    window.ents = name => S().entities.filter(e => e.constructor.name === name && !e.remove);
    window.at = () => ({ x: Math.floor(P().cx / 32), y: Math.floor((P().y + P().h - 1) / 32), area: S().area.aid, dead: !!P().dead });
    // a whole area as one picture: the camera steps across it, each view drawn without the HUD and copied in
    window.panorama = (k) => {
      const g = S(), G = B.Game, A = g.area, VW = G.viewW, VH = G.viewH, Sc = G.S, gx = G.gameRect.x * G.dpr, gy = G.gameRect.y * G.dpr;
      k = k || 0.4;
      const W = Math.ceil(A.W * 32 * k), H = Math.ceil(A.H * 32 * k);
      const big = document.createElement('canvas'); big.width = W; big.height = H; const bx = big.getContext('2d');
      const save = { hud: g.drawHUD, toast: g.drawToast, tut: g.drawTutorial, ctl: B.Input.drawControls, camX: g.camX, camY: g.camY, shake: g.shakeAmt };
      g.drawHUD = () => {}; g.drawToast = () => {}; g.drawTutorial = () => {}; B.Input.drawControls = () => {}; g.shakeAmt = 0;
      for (let cy = 0; cy < A.H * 32; cy += VH) for (let cx = 0; cx < A.W * 32; cx += VW) {
        g.camX = Math.min(cx, Math.max(0, A.W * 32 - VW)); g.camY = Math.min(cy, Math.max(0, A.H * 32 - VH));
        G.ctx.setTransform(1, 0, 0, 1, 0, 0); g.draw(G.ctx);
        bx.drawImage(G.canvas, gx, gy, VW * Sc, VH * Sc, g.camX * k, g.camY * k, VW * k, VH * k);
      }
      g.drawHUD = save.hud; g.drawToast = save.toast; g.drawTutorial = save.tut; B.Input.drawControls = save.ctl; g.camX = save.camX; g.camY = save.camY; g.shakeAmt = save.shake;
      // (the page's images are file:// so the canvas can't be exported: it is shown over the page and photographed)
      big.id = '__pano'; big.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999;background:#000`; document.body.appendChild(big);
      return { W, H };
    };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); if (checksOnly) return; await page.waitForTimeout(250); await page.screenshot({ path: path.join(out, name) }); };
  const pano = async (name, k) => {
    if (checksOnly) return; await pin();
    const vp = page.viewportSize();
    const d = await page.evaluate(kk => { freeze(); const u = panorama(kk); thaw(); return u; }, k || 0.4);
    await page.setViewportSize({ width: d.W, height: d.H }); await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width: d.W, height: d.H } });
    await page.evaluate(() => { const c = document.getElementById('__pano'); if (c) c.remove(); });
    await page.setViewportSize(vp); await page.waitForTimeout(300); await pin();
  };
  const run = async (name, f) => { if (want.length && !want.some(w => name.startsWith(w))) return; try { await pin(); await f(); } catch (e) { check(name + ' runs', false, String(e.message).slice(0, 300)); } };
  const ev = (f, a) => page.evaluate(f, a);
  await fn({ page, ev, shot, run, pano });
  check(`${viewport.width}x${viewport.height}: no page errors`, !errors.length, errors.slice(0, 5));
  await browser.close();
}


const STAGES = {};
/* ---------------- shared moves in the page ---------------- */
const ROOM_HELPERS = () => {
  window.walkTo = (px, tol) => { const p = P(); tol = tol || 5; for (let k = 0; k < 900 && Math.abs(p.cx - px) > 24; k++) { const hop = p.onGround && p.hitWall; sim(hop ? 0.3 : 1 / 120, { right: p.cx < px, left: p.cx > px, jump: hop, jumpPressed: hop }); } sim(0.3); for (let k = 0; k < 80 && Math.abs(p.cx - px) > tol; k++) { sim(Math.abs(p.cx - px) > 14 ? 1 / 30 : 1 / 60, { right: p.cx < px, left: p.cx > px }); sim(0.1); } };
  window.room = () => S().area.roomState;
  window.kit = () => S().area.roomKit;
  window.cageOpen = () => { const c = S().entities.find(e => e.constructor.name === 'TourRoomCage'); return !!(c && c.open); };
  window.outDoor = () => S().entities.filter(e => e.constructor.name === 'Portal' && e.target && e.target.area !== S().area.idx)[0];
  window.leave = () => { const d = outDoor(); if (!d) return null; walkTo(d.cx, 6); sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); sim(0.3); return at(); };
};

const KITS = "window.byId = (cls, id) => S().entities.find(q => q.constructor.name === cls && q.id === id); window.walkPx = X => { const p = P(); for (let n = 0; n < 4; n++) { for (let k = 0; k < 600 && Math.abs(p.cx - X) > 2; k++) sim(1 / 120, { right: p.cx < X - 1, left: p.cx > X + 1 }); sim(0.25); } }; window.walkX = (x, inp) => { const p = P(), X = x * 32 + 16; for (let n = 0; n < 3; n++) { for (let k = 0; k < 600 && Math.abs(p.cx - X) > 4; k++) sim(1 / 120, Object.assign({ right: p.cx < X, left: p.cx > X }, inp || {})); sim(0.25); } };";
const notch = KITS + "window.notch = id => { const e = S().entities.find(q => q.constructor.name === 'SaltNotch' && q.id === id); return e ? +e.fill.toFixed(2) : null; };";
/* ---------------- 34-1 Angle of Repose: heaps and notches ---------------- */
STAGES.s1 = async ({ ev, shot, run, pano }) => {
  await run('s1', async () => {
    await ev(notch);
    let r = await ev(() => { fresh(); play('34-1'); place(4, 17); sim(0.5); return { n1: notch('n1'), solid: !!window.BRADY_TOUR.saltKit.SOLID[tile(22, 18)] }; });
    check('34-1: the first notch is empty and open (nothing to stand on)', r.n1 === 0 && !r.solid, r);
    await ev(() => freeze()); await shot('10-34-1-start.png');
    r = await ev(() => { thaw(); place(13, 17); sim(0.3); walkPx(16 * 32 + 16); sim(0.6, { action: true }); return { n1: notch('n1') }; });
    check('34-1: holding RUN on the heap\'s ring slides salt into the notch (part full)', r.n1 > 0.2 && r.n1 < 1, r);
    await ev(() => { sim(0.1, { action: true }); freeze(); }); await shot('11-34-1-scuffing.png');
    r = await ev(() => { thaw(); sim(1.0, { action: true }); sim(0.3); const p = P(); for (let k = 0; k < 400 && p.cx < 29 * 32; k++) sim(1 / 120, { right: true }); return { n1: notch('n1'), at: at() }; });
    check('34-1: full to the line, the notch sets hard and Brady walks across it', r.n1 === 1 && r.at.x >= 28 && r.at.y === 17, r);
    // the twist: scuff on past the first notch's FULL line and the extra spills; the second can't fill from that heap
    r = await ev(() => { place(116, 17); sim(0.3); walkPx(118 * 32 + 16); sim(2.6, { action: true }); sim(0.2); const a = notch('n3'); sim(1.2, { action: true }); sim(0.2); return { a, b: notch('n4') }; });
    check('34-1 twist: held past the first FULL line, the salt spills; the second notch comes up short', r.a === 1 && r.b < 1, r);
    await ev(() => { sim(0.2); freeze(); }); await shot('12-34-1-spilled-shaker.png');
    r = await ev(() => { thaw(); sim(4.5); sim(2.0, { action: true }); sim(0.3); return { b: notch('n4') }; });
    check('34-1 twist: the shaker tops the heap back up; a fresh scuff fills the second notch', r.b === 1, r);
    await ev(() => { place(130, 17); sim(0.3); freeze(); }); await shot('13-34-1-two-notches.png');
    await ev(() => thaw());
    await pano('19-34-1-panorama.png', 0.3);
  });
};

/* ---------------- the hidden entrance: Morocco 5-3, the salt saucer at the last citrus stall ---------------- */
STAGES.door = async ({ ev, shot, run }) => {
  await run('door', async () => {
    let r = await ev(() => {
      fresh(); const T = window.BRADY_TOUR, st = T.Tour.stops.salt;
      return { hidden: T.TourMap.stopState(st) === 'hidden', unlocked: T.TourProgress.isUnlocked('34-1'), land: T.TourProgress.countryUnlocked(T.Tour.countries.salt), pips: T.TourProgress.exitsFound('5-3') };
    });
    check('before the entrance: the land is hidden on the route map, 34-1 is locked', r.hidden && !r.unlocked && !r.land, r);
    const pips0 = r.pips;
    r = await ev(() => { play('5-3'); const d = S().area.spawns.find(q => q.type === 'saltMaSaucer'); window.__sau = { tx: d.tx, cy: d.cy, gy: d.gy, x0: d.x0[0] }; place(d.x0[0] - 6, d.gy - 1); sim(0.4); return window.__sau; });
    await ev(() => { const s = window.__sau; place(s.x0 - 2, s.gy - 1); sim(0.4); freeze(); });
    await shot('00-entrance-5-3-the-stalls.png');
    // walking the lane past the stalls (under the counters) does nothing
    r = await ev(() => { thaw(); const s = window.__sau, p = P(); place(s.x0 - 2, s.gy - 1); sim(0.2); sim(2.4, { right: true }); return { state: p.state, at: at(), tx: s.tx }; });
    check('5-3: walking the lane under the stalls passes them by', r.state === 'play' && r.at.x > r.tx, r);
    // up onto the last counter, onto the saucer: standing there is not enough; crouching is
    r = await ev(() => { const s = window.__sau, p = P(); place(s.tx - 3, s.gy - 1); sim(0.3); sim(0.42, { jump: true, jumpPressed: true, right: true }); for (let k = 0; k < 300 && Math.abs(p.cx - (s.tx * 32 + 16)) > 5; k++) sim(1 / 120, { right: p.cx < s.tx * 32 + 16, left: p.cx > s.tx * 32 + 16 }); sim(0.4); const standing = ents('SaltMaSaucer')[0].arr < 0; return { onCounter: p.onGround && p.groundTy === s.cy, standing }; });
    check('5-3: Brady hops onto the last counter and stands on the saucer (nothing happens yet)', r.onCounter && r.standing, r);
    await ev(() => { sim(0.1); freeze(); }); await shot('01-entrance-on-the-saucer.png');
    r = await ev(() => { thaw(); sim(1.3, { down: true }); const e = ents('SaltMaSaucer')[0]; sim(0.4); return { slipping: e.arr >= 0, banner: S().bannerText }; });
    check('5-3: crouching on the saucer, Brady slips through its rim; the land\'s name comes up', r.slipping && r.banner === 'THE TABLE SALT SEA', r);
    await ev(() => freeze()); await shot('02-entrance-slipping-in.png');
    r = await ev(() => {
      thaw(); for (let k = 0; k < 900 && S().state === 'play'; k++) sim(1 / 120); sim(2);
      const T = window.BRADY_TOUR, d = window.BRADY.Save.data;
      return { state: S().state, key: S().exitKey, land: !!d.tour.lands.salt, unlocked: T.TourProgress.isUnlocked('34-1'), pips: T.TourProgress.exitsFound('5-3') };
    });
    check('5-3 clears through its exit to the land: the land opens, 34-1 unlocks, the card counts one more exit', r.key === 'salt' && r.land && r.unlocked && r.pips.total === pips0.total + 1 && r.pips.found >= 1, { r, pips0 });
    r = await ev(() => {
      window.BRADY.goToMap('world', 1, '5-3');
      for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); }
      if (S().openRoute) S().openRoute({ dest: 'salt' });
      for (let k = 0; k < 60 && (S().rRevealQ == null || S().rReveal || (S().rRevealQ && S().rRevealQ.length)); k++) sim(0.25);
      sim(1);
      const T = window.BRADY_TOUR; return { state: T.TourMap.stopState(T.Tour.stops.salt), mode: S().mode };
    });
    check('the route map now shows The Table Salt Sea', r.state !== 'hidden', r);
    await ev(() => freeze()); await shot('03-entrance-route-map.png');
    r = await ev(() => { thaw(); window.BRADY.goToMap('world', 1, '34-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { cc: s.ow && s.ow.cc }; });
    check('the land has its own walkable map, and 34-1 can be entered from it', r.cc === 'salt', r);
    await ev(() => freeze()); await shot('04-salt-overworld-map.png');
    await ev(() => thaw());
  });
};

/* ---------------- 34-2 Grain Elevator: spoons, basins, corks ---------------- */
STAGES.s2 = async ({ ev, shot, run, pano }) => {
  await run('s2', async () => {
    await ev(KITS);
    await ev(() => { fresh(); play('34-2'); place(4, 17); sim(0.5); freeze(); }); await shot('20-34-2-start.png');
    let r = await ev(() => { thaw(); place(15, 17); sim(0.3); sim(0.3, { jump: true, jumpPressed: true, right: true }); sim(0.5); const B = byId('SaltBasin', 'b1'); return { dose: B.dose, afloat: B.cork.afloat() }; });
    check('34-2: stepping onto the salt spoon tips a dose in: the brine thickens and the cork floats up', r.dose === 1 && r.afloat, r);
    await ev(() => { sim(0.6); freeze(); }); await shot('21-34-2-cork-afloat.png');
    r = await ev(() => { thaw(); const B = byId('SaltBasin', 'b1'), p = P(); for (let k = 0; k < 240 && p.ride !== B.cork; k++) sim(1 / 120, { right: true }); sim(0.3); const rode = p.ride === B.cork; for (let k = 0; k < 120 * 8 && Math.abs(B.cork.x - B.cork.far) > 3; k++) sim(1 / 120); walkX(31); return { rode, at: at() }; });
    check('34-2: Brady boards the cork; it carries him across the brine to the far side', r.rode && r.at.x >= 30 && !r.at.dead, r);
    // the twist: the last spoon tips again by itself; not aboard by then, the cork lifts past the lip and floats off
    r = await ev(() => { place(146, 17); sim(0.3); sim(0.3, { jump: true, jumpPressed: true, right: true }); sim(0.5); const B = byId('SaltBasin', 'b4'); sim(4.2); return { dose: B.dose, gone: B.goneT > 0 || B.cork.drift > 0 }; });
    check('34-2 twist: left alone, the shaker refills the last spoon, it tips again and the cork floats off over the lip', r.gone, r);
    await ev(() => { sim(0.5); freeze(); }); await shot('22-34-2-cork-floats-off.png');
    r = await ev(() => { thaw(); const B = byId('SaltBasin', 'b4'), p = P(); for (let k = 0; k < 120 * 6 && B.dose > 0; k++) sim(1 / 120); place(146, 17); sim(0.3); const a0 = at(); sim(0.3, { jump: true, jumpPressed: true, right: true }); sim(0.9); const a1 = at(), d1 = B.dose; for (let k = 0; k < 240 && p.ride !== B.cork; k++) sim(1 / 120, { right: true }); sim(0.3); const rode = p.ride === B.cork; window.__dbg = { a0, a1, d1, cork: Math.round(B.cork.ry), aflo: B.cork.afloat() }; for (let k = 0; k < 120 * 8 && Math.abs(B.cork.x - B.cork.far) > 3; k++) sim(1 / 120); const far = at(); walkX(166); return { rode, far, at: at(), dose: B.dose, dbg: window.__dbg }; });
    check('34-2 twist: aboard the half-floating cork before the spoon tips again: it carries Brady over', r.rode && r.at.x >= 164 && !r.at.dead, r);
    await pano('29-34-2-panorama.png', 0.3);
  });
};
/* ---------------- 34-3 Crystal Habit: cubes that grow ---------------- */
STAGES.s3 = async ({ ev, shot, run, pano }) => {
  await run('s3', async () => {
    await ev(KITS);
    await ev(() => { fresh(); play('34-3'); place(4, 17); sim(0.5); freeze(); }); await shot('30-34-3-start.png');
    let r = await ev(() => { thaw(); place(19, 16); sim(0.4); const c = byId('SaltCrystal', 'c1'); sim(1.0, { action: true }); return { n: c.n }; });
    check('34-3: holding THROW on the crystal grows cubes out of its face (the dashed square shows the next)', r.n >= 2, r);
    await ev(() => freeze()); await shot('31-34-3-growing.png');
    r = await ev(() => { thaw(); const c = byId('SaltCrystal', 'c1'); sim(4, { action: true }); sim(0.2); walkX(30); return { n: c.n, at: at() }; });
    check('34-3: a bridge of nine cubes across the gap; Brady walks over it', r.n === 9 && r.at.x >= 29 && !r.at.dead, r);
    r = await ev(() => { place(49, 17); sim(0.3); sim(0.4, { jump: true, jumpPressed: true, right: true }); walkX(50); sim(0.2); const y0 = at().y; sim(3, { action: true }); return { y0, y1: at().y }; });
    check('34-3: a crystal that grows UP lifts Brady with each cube (to the shelf)', r.y1 <= 11, r);
    r = await ev(() => { place(150, 11); sim(0.3); const c = byId('SaltCrystal', 'c5'); sim(2.2, { action: true }); return { n: c.n, lvl: +c.lvl.toFixed(2) }; });
    check('34-3 twist: the corner crystal: once it starts, the brine rises in the trough', r.n >= 3 && r.lvl > 0.05, r);
    await ev(() => freeze()); await shot('32-34-3-corner-brine.png');
    r = await ev(() => { thaw(); const c = byId('SaltCrystal', 'c5'); sim(5, { action: true }); sim(0.2); walkX(156); sim(0.6); walkX(166); return { n: c.n, at: at() }; });
    check('34-3 twist: sideways, down, along: off the tip onto the lower bridge, under the beam, to the far ledge', r.n === 13 && r.at.x >= 164 && !r.at.dead, r);
    await ev(() => { place(152, 14); sim(0.2); freeze(); }); await shot('33-34-3-corner-done.png');
    await ev(() => thaw());
    await pano('39-34-3-panorama.png', 0.3);
  });
};
/* ---------------- 34-4 The Shaker Test: plugging holes ---------------- */
STAGES.s4 = async ({ ev, shot, run, pano }) => {
  await run('s4', async () => {
    await ev(KITS);
    await ev(() => { fresh(); play('34-4'); place(4, 13); sim(0.5); freeze(); }); await shot('40-34-4-start.png');
    let r = await ev(() => { thaw(); place(24, 13); sim(0.3); const c = byId('SaltCap', 'cap1'); for (let k = 0; k < 120 * 9 && !c.done; k++) sim(1 / 120); return { done: c.done }; });
    check('34-4: standing on nothing (both holes open), half the pour isn\'t enough for the gold bowl', !r.done, r);
    r = await ev(() => { walkX(18); const c = byId('SaltCap', 'cap1'); let shook = false; for (let k = 0; k < 120 * 9 && !c.done; k++) { if (c.cyc >= c.per - 1 && c.cyc < c.per) shook = true; sim(1 / 120); } return { done: c.done, shook, key: S().keys.has('gate1') }; });
    check('34-4: a shoe on the other hole: the whole pour goes to the gold bowl; it sinks and the gate lifts', r.done && r.shook && r.key, r);
    r = await ev(() => { walkX(32); return { at: at() }; });
    check('34-4: through the open cellar gate', r.at.x >= 31, r);
    r = await ev(() => { place(131, 13); sim(0.2); const c = byId('SaltCap', 'cap4'), p = P(); walkPx(134 * 32); for (let k = 0; k < 120 * 6 && !(c.cyc >= c.per && c.cyc < c.per + 0.6); k++) sim(1 / 120); return { plugged: [c.plugged(0), c.plugged(1), c.plugged(2)] }; });
    check('34-4 twist: astride the two neighbouring holes Brady plugs both', r.plugged[0] && r.plugged[1] && !r.plugged[2], r);
    await ev(() => freeze()); await shot('41-34-4-astride-pouring.png');
    r = await ev(() => { thaw(); const c = byId('SaltCap', 'cap4'); for (let k = 0; k < 120 * 6 && !c.done; k++) sim(1 / 120); walkX(147); return { done: c.done, at: at() }; });
    check('34-4 twist: the whole pour down the one hole fills the narrow bowl; the last gate lifts', r.done && r.at.x >= 146, r);
    await pano('49-34-4-panorama.png', 0.3);
  });
};
/* ---------------- 34-5 Season to Taste: the weighing spoons, then A Pinch ---------------- */
STAGES.s5 = async ({ ev, shot, run, pano }) => {
  await run('s5', async () => {
    await ev(KITS);
    await ev(() => { fresh(); play('34-5'); place(4, 15); sim(0.5); freeze(); }); await shot('50-34-5-start.png');
    let r = await ev(() => { thaw(); walkX(13); const w = byId('SaltWeigh', 'w1'), p = P(); for (let k = 0; k < 120 * 6 && w.S < 0.5; k++) sim(1 / 120); return { S: +w.S.toFixed(2) }; });
    check('34-5: standing on the weighing spoon, the shaker pours and the needle climbs', r.S >= 0.5, r);
    await ev(() => freeze()); await shot('51-34-5-weighing.png');
    r = await ev(() => { thaw(); const w = byId('SaltWeigh', 'w1'); for (let k = 0; k < 120 * 6 && w.S < 0.95; k++) sim(1 / 120); press('jump'); sim(1.2); walkX(23); return { done: w.done, at: at() }; });
    check('34-5: off the spoon with the needle in the gold: a pinch in the pot, its lid lifts', r.done && r.at.x >= 22, r);
    r = await ev(() => { place(45, 15); walkX(48); const w = byId('SaltWeigh', 'w2'); for (let k = 0; k < 120 * 8 && w.S < 0.6; k++) sim(1 / 120); press('jump'); sim(1.0); return { done: w.done }; });
    check('34-5 the last tasting: Brady\'s own weight counts: off when the needle passes the gold is too soon', !r.done, r);
    r = await ev(() => { const w = byId('SaltWeigh', 'w2'); for (let k = 0; k < 120 * 3 && w.state !== 'wait'; k++) sim(1 / 120); walkX(48); for (let k = 0; k < 120 * 8 && w.reading() < 1.38; k++) sim(1 / 120); press('jump'); sim(1.0); walkX(57); return { done: w.done, at: at() }; });
    check('34-5 the last tasting: off at the shoe mark: the needle falls into the gold, the lid lifts', r.done && r.at.x >= 56, r);
    await pano('59-34-5-panorama.png', 0.35);
    // the boss arena
    r = await ev(() => { const g = S(), k = areaOf(g, 'kitchen'), A = g.level.areas[k]; g.loadArea(k, A.anchors.in.x, A.anchors.in.y); P().invuln = 999; sim(0.3); for (let n = 0; n < 200; n++) sim(1 / 120, { right: true }); const b = g.boss; for (let n = 0; n < 120 * 8 && !(b && b.act === 'tell'); n++) sim(1 / 120); return { act: b && b.act }; });
    await ev(() => { sim(0.5); freeze(); }); await shot('55-34-5-boss-tell.png');
    await ev(() => { thaw(); const b = S().boss, p = P(), X = b.sp0 + 48; for (let n = 0; n < 120 * 4 && b.act !== 'pour'; n++) sim(1 / 120, Math.abs(p.cx - X) > 8 ? { right: p.cx < X, left: p.cx > X } : {}); sim(1.6); freeze(); }); await shot('56-34-5-boss-pouring.png');
    await ev(() => thaw());
  });
};

const ROOMS = [
  ['34-1', 'kettle', '70-room-B41-long-and-short'],
  ['34-2', 'lamps', '71-room-B42-half-time'],
  ['34-3', 'mitts', '72-room-B43-the-other-mitt'],
  ['34-4', 'rattle', '73-room-B44-finish-the-rattle'],
  ['34-5', 'stand', '74-room-B45-accompanist-wanted']
];
STAGES.rooms = async ({ ev, shot, run }) => {
  await ev(ROOM_HELPERS);
  for (const [lv, aid, tag] of ROOMS) await run('rooms-' + aid, async () => {
    let r = await ev(([lv, aid]) => { fresh(); play(lv); toArea(aid); sim(0.5); return { title: S().bannerText, kind: kit() && kit().kind, toast: S().toastT > 0 }; }, [lv, aid]);
    check(tag + ': entering shows the title alone first (no rule toast yet)', !!r.kind && !r.toast && !!r.title, r);
    await ev(() => freeze()); await shot(tag + '-0-title.png');
    r = await ev(() => { thaw(); sim(1.6); return { toast: S().toastText }; });
    check(tag + ': then the rule, short', !!r.toast && r.toast.split(' ').length <= 8, r);
    await ev(() => freeze()); await shot(tag + '-1-rule.png');
    // onto the mark (a real walk) and play a little: a wrong press (between beats) is a miss that costs nothing
    r = await ev(() => { thaw(); const m = S().entities.find(e => e.constructor.name === 'SaltRoomMark'); walkTo(m.cx, 4); for (let k = 0; k < 120 * 4 && (S().bannerT > 0 || S().toastT > 0); k++) sim(1 / 120); sim(1.2); return { on: m.saltTouch(P()) }; });
    check(tag + ': Brady stands on the game\'s mark', r.on, r);
    await ev(() => freeze()); await shot(tag + '-2-playing.png');
    r = await ev(() => { thaw(); const R = room(), f0 = R.fails || 0; const K = window.BRADY_TOUR.TourRooms.kinds[kit().kind]; for (let k = 0; k < 120 * 3 && (R.fails || 0) === f0; k++) { const t = R.t || 0; const off = kit().kind === 'saltLamps' ? Math.abs(((t - 1.0) / 0.75) - Math.round((t - 1.0) / 0.75)) > 0.4 : true; sim(1 / 120, off && k % 40 === 20 ? { action: true, actionPressed: true } : {}); } return { fails: R.fails || 0, f0, won: R.won }; });
    check(tag + ': a press off the beat is a miss: that turn starts again, nothing lost', r.fails > r.f0 && !r.won && !(await ev(() => P().dead)), r);
    r = await ev(() => { const g = S(), A = g.area, R = room(), K = window.BRADY_TOUR.TourRooms.kinds[kit().kind]; for (let k = 0; k < 120 * 3 && g.bannerT > 0; k++) sim(1 / 120); K.testWin(g, A, R, kit(), (gg, inp) => sim(1 / 120, inp || {})); sim(1.5); return { won: R.won, cage: cageOpen() }; });
    check(tag + ': won with the stick and the buttons; the prize cage opens at the win', r.won && r.cage, r);
    await ev(() => freeze()); await shot(tag + '-3-won.png');
    r = await ev(aid => { thaw(); const out = leave(); return { out, area: S().area.aid }; }, aid);
    check(tag + ': its door lets Brady out elsewhere in the level', r.area !== aid, r);
  });
};
//@@STAGES@@
const BOT_PAGE = () => {
  const B = window.BRADY;
  const T = window.BOT = { deaths: [], scene: null, cp: 0 };
  const p = () => S().player;
  if (!B.Player.prototype.__botDie) { const d0 = B.Player.prototype.die; B.Player.prototype.die = function (reason) { window.__lastDie = { reason: String(reason), x: Math.floor(this.cx / 32), y: Math.floor((this.y + this.h) / 32), near: S().entities.filter(e => !e.remove && e !== this && Math.abs(e.cx - this.cx) < 80 && Math.abs(e.cy - this.cy) < 80).map(e => e.type || e.constructor.name).slice(0, 4) }; return d0.call(this, reason); }; B.Player.prototype.__botDie = true; }
  T.died = () => S() !== T.scene || p().dead || p().state === 'dying' || S().state === 'gameover';
  // one frame of input; returns false when Brady has died (then waits for the respawn)
  T.f = inp => {
    sim(1 / 120, inp || {}); T.n = (T.n || 0) + 1;
    if (T.n % 360 === 0 && T.trace) { const q = p(); T.trace.push([T.step, Math.floor(q.cx / 32), Math.floor((q.y + q.h) / 32), S().area.aid, S().state, q.state, Math.round(S().timeLeft || 0)]); }
    if (!T.died()) return true;
    const q = p(), why = window.__lastDie || {}; window.__lastDie = null; T.deaths.push({ id: T.id, step: T.step, x: why.x != null ? why.x : Math.floor(q.cx / 32), y: why.y != null ? why.y : Math.floor((q.y + q.h) / 32), reason: why.reason || S().state, near: why.near || [] });
    for (let k = 0; k < 120 * 8 && !(S() !== T.scene && S().state === 'play' && S().player && !S().player.dead); k++) sim(1 / 120);
    T.scene = S(); B.Save.data.lives = 9; S().player.invuln = 0; return false;
  };
  T.wait = sec => { for (let k = 0; k < sec * 120; k++) if (!T.f()) return false; return true; };
  const tileAt = (x, y) => { const A = S().area; return x < 0 || x >= A.W ? 99 : y < 0 || y >= A.H ? 0 : A.tiles[y * A.W + x]; };
  const solid = (x, y) => { const t = tileAt(x, y); return t === 99 || (window.BRADY_TOUR.saltKit.SOLID[t]); };
  T.solid = solid;
  // walk to pixel x (careful: hop gaps and walls, jump a critter that comes at him)
  T.walk = (x, o) => {
    o = o || {};
    for (let k = 0; k < 120 * 25; k++) {
      const q = p(); if (T.finished() || (Math.abs(q.cx - x) < (o.tol || 8) && q.onGround)) return true;
      const dir = q.cx < x ? 1 : -1, tx = Math.floor((q.cx + dir * 20) / 32), fy = Math.floor((q.y + q.h + 4) / 32);
      let jump = false;
      if (q.onGround) {
        const gapAhead = !solid(tx, fy) && !solid(tx, fy + 1) && tileAt(tx, fy) !== 2;
        const wall = solid(Math.floor((q.cx + dir * 18) / 32), fy - 1);
        const crit = S().entities.some(e => e.enemy && !e.dead && !e.remove && !e.boss && (e.cx - q.cx) * dir > 0 && Math.abs(e.cx - q.cx) < 90 && Math.abs((e.y + e.h) - (q.y + q.h)) < 40);
        if ((gapAhead || wall || crit || q.hitWall) && (o.noHop !== true)) jump = true;
      }
      const ok = jump ? T.hop(dir, o.action) : T.f({ right: dir > 0, left: dir < 0, action: !!o.action });
      if (!ok) return false;
    }
    return 'stuck';
  };
  T.hop = (dir, action, hold) => { if (!T.f({ jump: true, jumpPressed: true, right: dir > 0, left: dir < 0, action: !!action })) return false; for (let k = 0; k < (hold || 0.45) * 120; k++) if (!T.f({ jump: true, right: dir > 0, left: dir < 0, action: !!action })) return false; for (let k = 0; k < 120 * 2 && !p().onGround; k++) if (!T.f({ right: dir > 0, left: dir < 0, action: !!action })) return false; return true; };
  // a jump that steers: (wait `delay` s, then) right/left only until Brady's centre is over tile column x
  T.hopTo = (x, hold, delay) => { const X = x * 32 + 16, d = () => p().cx < X - 6 ? 1 : p().cx > X + 6 ? -1 : 0; if (!T.f({ jump: true, jumpPressed: true })) return false; for (let k = 0; k < 120 * 2.5 && !(k > 10 && p().onGround); k++) { const go = k >= (delay || 0) * 120 ? d() : 0; if (!T.f({ jump: k < (hold || 0.45) * 120, right: go > 0, left: go < 0 })) return false; } return true; };
  T.letGo = dir => T.hop(dir, false, 0.5);
  T.press = k => T.f({ [k]: true, [k + 'Pressed']: true });
  T.door = () => { if (!T.f({ up: true, upPressed: true })) return false; for (let k = 0; k < 600 && (S().fade.a > 0.05 || p().state !== 'play'); k++) sim(1 / 120); T.scene = S(); return true; };
  T.gate = () => { for (let k = 0; k < 120 * 20 && !T.finished(); k++) { const gt = S().entities.find(e => e.constructor.name === 'Gate' && !e.secret && !e.remove); const tx = gt ? gt.cx : p().cx + 64; if (!T.f({ right: p().cx < tx - 4, left: p().cx > tx + 4, jump: !!(p().onGround && p().hitWall), jumpPressed: !!(p().onGround && p().hitWall) })) return false; } return T.finished() || 'stuck'; };
  T.finished = () => ['clear', 'tally', 'results'].includes(S().state);
  // a route: a list of steps [fn, ...args] and 'cp' markers; on a death the route goes back to the last 'cp'
  T.run = (id, route) => {
    fresh(); T.id = id; T.trace = []; const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9;
    const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(1.6); T.scene = S(); p().invuln = 0;
    let k = 0, tries = 0, fails = []; const cps = [[0, -1e9]];
    // after a death: back to the last route marker Brady passed at or before where he now stands (his respawn)
    const rewind = () => { const x = p().cx + 96; let best = 0; for (const [i, cx] of cps) if (cx <= x && i > best) best = i; return best; };
    while (k < route.length && tries < 40) {
      if (T.finished()) break;
      const st = route[k]; T.step = k;
      if (st === 'cp') { if (!cps.some(c => c[0] === k + 1)) cps.push([k + 1, p().cx]); k++; continue; }
      const r = T[st[0]](...st.slice(1));
      if (r === false || T.died()) { tries++; if (!T.deaths.length || T.deaths[T.deaths.length - 1].step !== k || T.deaths[T.deaths.length - 1].id !== id) fails.push(k + ':' + st[0]); for (let n = 0; n < 120 * 8 && T.died(); n++) { sim(1 / 120); if (S() !== T.scene && S().state === 'play' && p() && !p().dead) T.scene = S(); } T.scene = S(); p().invuln = 0; k = rewind(); continue; }
      if (r === 'stuck' || r === 'lost grip') { fails.push(k + ':' + st[0] + ' ' + r); tries++; k++; continue; }
      k++;
    }
    for (let n = 0; n < 120 * 6 && !T.finished(); n++) sim(1 / 120);
    return { id, finished: T.finished(), deaths: T.deaths.filter(d => d.id === id), fails, trace: T.trace.slice(0, 60) };
  };
};

// the land's own moves for the bot (stick and buttons only)
const BOT_SALT = () => {
  const T = window.BOT, p = () => S().player;
  // to column x precisely: walk (hopping as needed) close, then short taps
  T.to = x => T.toPx(x * 32 + 16);
  const ent = (cls, id) => S().entities.find(q => q.constructor.name === cls && q.id === id);
  // hold RUN on the heap at column x until notch id is full (let go at FULL)
  T.scuff = (x, id) => { if (T.to(x) === false) return false; for (let k = 0; k < 120 * 12; k++) { const n = ent('SaltNotch', id); if (n && n.fill >= 1) break; if (!T.f({ action: true })) return false; } return T.wait(0.3); };

  T.toPx = X => { if (T.walk(X, { tol: 24 }) === false) return false; for (let n = 0; n < 3; n++) { for (let k = 0; k < 240 && Math.abs(p().cx - X) > 3; k++) if (!T.f({ right: p().cx < X - 2, left: p().cx > X + 2 })) return false; if (!T.wait(0.2)) return false; } return true; };
  // onto the spoon at column x (by walking: the landing tips a dose); a second hop for a basin that needs two
  T.spoon = (x, id) => { if (T.to(x - 2) === false) return false; if (!T.hopTo(x + 0.5, 0.3)) return false; const B = ent('SaltBasin', id); for (let k = 0; k < 6 && B.dose < B.need; k++) { if (!T.wait(0.8)) return false; if (B.dose < B.need) { if (!T.hop(0, false, 0.3)) return false; } } return T.wait(0.2); };
  // step right onto the cork, ride it to the far side, step off
  T.ride = id => { const B = ent('SaltBasin', id); for (let k = 0; k < 120 * 3 && !B.cork.afloat(); k++) if (!T.f()) return false; for (let k = 0; k < 120 * 2 && p().ride !== B.cork; k++) if (!T.f({ right: true })) return false; for (let k = 0; k < 120 * 8 && Math.abs(B.cork.x - B.cork.far) > 4; k++) if (!T.f()) return false; for (let k = 0; k < 120 * 2 && p().cx < (B.x1 + 2) * 32; k++) if (!T.f({ right: true })) return false; return true; };
  // stand on the crystal at column x and hold THROW until it has grown all its cubes
  T.grow = (x, id) => { if (T.to(x) === false) return false; const c = ent('SaltCrystal', id); for (let k = 0; k < 120 * 10 && c.n < c.plan.length; k++) if (!T.f({ action: true })) return false; return T.wait(0.2); };
  // stand at pixel X on a cap's disc until its gate's key is in
  T.plug = (X, lock) => { if (T.toPx(X) === false) return false; for (let k = 0; k < 120 * 14 && !S().keys.has(lock); k++) if (!T.f()) return false; return T.wait(0.5); };
  // a weighing spoon at column x: stand on it, hop off when the needle reads `at`
  T.weigh = (x, id, at) => { if (T.to(x) === false) return false; const w = ent('SaltWeigh', id); for (let k = 0; k < 120 * 10 && !w.done; k++) { if (w.reading() >= at && p().onGround) { if (!T.hop(0, false, 0.3)) return false; if (!T.wait(0.6)) return false; if (!w.done) { if (T.to(x) === false) return false; } continue; } if (!T.f()) return false; } return T.wait(0.3); };
  // A Pinch: the thumb (as tools/boss_tests/salt.js)
  T.bossFight = () => {
    for (let k = 0; k < 120 * 120; k++) {
      const b = S().boss; if (!b || b.remove || b.state === 'dying') return T.wait(3);
      if (!b.crystals) { if (!T.f({ right: true })) return false; continue; }
      const q = p(), ph = b.phase || 1, br = window.BRADY_TOUR.saltKit.pinch, spoonX = b.sp0 + 48, offX = b.sp0 - 70;
      let target = null, jump = false;
      if (b.act === 'tell' || b.act === 'idle' || b.act === 'season') target = ph === 2 && b.act !== 'season' ? offX : spoonX;
      if (b.act === 'coarse') target = offX;
      if (b.act === 'gap' || b.act === 'pour') target = spoonX;
      if (b.act === 'pour' && br.on(b) && b.S >= (ph === 3 ? 1.0 : 0.95)) jump = true;
      const sh = b.crystals.find(c => c.t < 1.0 && Math.abs(c.x - q.cx) < 42);
      if (sh) { const room = x => Math.min(...b.crystals.filter(c => c.t < 1.0).map(c => Math.abs(c.x - x))) - (x < b.arenaX0 + 32 || x > b.potX - 38 ? 99 : 0); const a = sh.x - 61, z = sh.x + 61; target = room(a) >= room(z) ? a : z; }
      if (b.lumps.some(L => (q.cx - L.x) * L.d > 0 && Math.abs(q.cx - L.x) < 64) && q.onGround) jump = true;
      const inp = {}; if (target != null && Math.abs(q.cx - target) > 8) { inp.right = q.cx < target; inp.left = q.cx > target; }
      if (jump && q.onGround) { inp.jump = true; inp.jumpPressed = true; T.jh = 0.4; } else if (T.jh > 0) { T.jh -= 1 / 120; inp.jump = true; }
      if (!T.f(inp)) return false;
    }
    return 'stuck';
  };
};
const BOT_ROUTES = {
  '34-1': [['scuff', 16, 'n1'], ['walk', 31 * 32], 'cp', ['walk', 52 * 32], ['scuff', 69, 'n2'], ['walk', 91 * 32], ['walk', 101 * 32], 'cp', ['scuff', 118, 'n3'], ['scuff', 118, 'n4'], ['walk', 152 * 32], 'cp', ['gate']],
  '34-2': [['spoon', 17, 'b1'], ['ride', 'b1'], ['walk', 33 * 32], 'cp', ['spoon', 41, 'b2'], ['ride', 'b2'], ['walk', 84 * 32], 'cp', ['spoon', 91, 'b3'], ['ride', 'b3'], ['walk', 136 * 32], 'cp', ['spoon', 148, 'b4'], ['ride', 'b4'], ['walk', 178 * 32], ['gate']],
  '34-3': [['grow', 19, 'c1'], ['walk', 30 * 32], 'cp', ['grow', 50, 'c2'], ['walk', 63 * 32], ['grow', 64, 'c3'], ['walk', 81 * 32], 'cp', ['walk', 99 * 32], ['walk', 120 * 32], 'cp', ['walk', 145 * 32], ['grow', 150, 'c5'], ['walk', 158 * 32, { noHop: true }], ['walk', 178 * 32], ['gate']],
  '34-4': [['plug', 18 * 32 + 16, 'gate1'], ['walk', 32 * 32], 'cp', ['plug', 62 * 32 + 16, 'gate2'], ['walk', 78 * 32], 'cp', ['plug', 110 * 32 + 16, 'gate3'], ['walk', 120 * 32], 'cp', ['plug', 134 * 32, 'gate4'], ['walk', 150 * 32], ['gate']],
  '34-5': [['weigh', 13, 'w1', 0.95], ['walk', 24 * 32], 'cp', ['weigh', 48, 'w2', 1.38], ['walk', 76 * 32 + 16, { noHop: true }], ['door'], ['bossFight'], ['gate']]
};
//@@BOT@@

(async () => {
  if (args.includes('--bot')) {
    await session({ width: 874, height: 402 }, async ({ ev }) => {
      await ev(BOT_PAGE); await ev(BOT_SALT);
      for (const id of Object.keys(BOT_ROUTES)) {
        if (want.length && !want.includes(id)) continue;
        const r = await ev(([i, route]) => window.BOT.run(i, route), [id, BOT_ROUTES[id]]);
        const spots = {}; for (const d of r.deaths) { const k = d.x + ',' + d.y + ' ' + d.reason + (d.near && d.near.length ? ' (' + d.near.join('/') + ')' : ''); spots[k] = (spots[k] || 0) + 1; }
        console.log(`BOT ${id}: ${r.finished ? 'FINISHED' : 'DID NOT FINISH'}, ${r.deaths.length} death(s) ${JSON.stringify(spots)}${r.fails.length ? ' fails ' + r.fails.join(' ') : ''}`);
        if (args.includes('--trace')) console.log(JSON.stringify(r.trace));
        check(`bot ${id}: played start to finish (enemies on, damage on), at most one death`, r.finished && r.deaths.length <= 1, { deaths: r.deaths.length, spots, fails: r.fails });
      }
    });
    console.log(failures ? `${failures} SALT BOT CHECK(S) FAILED` : 'ALL SALT BOT CHECKS PASSED');
    process.exit(failures ? 1 : 0);
  }
  await session({ width: 874, height: 402 }, async (o) => {
    for (const k of Object.keys(STAGES)) await STAGES[k](o);
  });
  await session({ width: 402, height: 874 }, async ({ ev, shot, run }) => {
    await run('p-s1', async () => { await ev(() => { fresh(); play('34-1'); place(14, 17); sim(0.4); sim(0.8, { action: true }); freeze(); }); await shot('90-portrait-34-1-heap.png'); });
    await run('p-boss', async () => { await ev(() => { thaw(); fresh(); play('34-5'); const g = S(), k = areaOf(g, 'kitchen'), A = g.level.areas[k]; g.loadArea(k, A.anchors.in.x, A.anchors.in.y); P().invuln = 999; sim(0.2); for (let n = 0; n < 300; n++) sim(1 / 120, { right: true }); sim(3.2); freeze(); }); await shot('91-portrait-34-5-boss.png'); });
    await run('p-map', async () => { await ev(() => { thaw(); fresh(); const d = window.BRADY.Save.data; d.tour.lands.salt = true; d.unlocked['34-1'] = true; window.BRADY.goToMap('world', 1, '34-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } freeze(); }); await shot('92-portrait-salt-map.png'); });
  });
  console.log(failures ? `${failures} SALT CHECK(S) FAILED` : 'ALL SALT CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
