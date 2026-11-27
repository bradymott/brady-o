// The Umbrella Repair District (hidden land 31): screenshots and in-browser checks. The hidden entrance in Amsterdam
// 8-1 (the umbrella stand on the canal bench whose one handle drips UPWARD), the arrival, the land's map, each stage's
// mechanic played with real inputs (the stick and the two buttons through the game loop), each secret room (found,
// won once, failed once, left by its exit), the boss. Phone landscape (874x402 @2x, the game's 844x390 view) and
// portrait (402x874). Silent. `--bot`: every stage start to finish with enemies and damage on.
// usage: BRADY_DIST=<dist> node tools/sbw_umb_shots.js <outdir> [--checks] [--bot] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'umb-shots'), checksOnly = args.includes('--checks');
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
    window.place = (tx, ty) => { const g = S(), p = P(); g.timeLeft = Math.max(g.timeLeft || 0, 300); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; if (p.umb) p.umb.grip = null; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.toArea = (aid, tx, ty) => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = A.anchors.in || A.anchors.start || Object.values(A.anchors)[0] || { x: 96, y: (A.H - 4) * 32 }; if (g.area.idx !== k) g.loadArea(k, an.x, an.y); P().invuln = 999; if (tx != null) place(tx, ty); };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } if (g.player) g.player.invuln = 999; };
    window.tile = (x, y) => { const A = S().area; return A.tiles[y * A.W + x]; };
    window.ents = name => S().entities.filter(e => e.constructor.name === name && !e.remove);
    window.grip = () => { const W = P().umb; return W && W.grip ? { face: W.face, x: Math.round(P().cx / 32), y: Math.floor((P().y + 8) / 32) } : null; };
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

/* ---------------- the hidden entrance: Amsterdam 8-1, the umbrella stand on the canal bench ---------------- */
STAGES.door = async ({ ev, shot, run }) => {
  await run('door', async () => {
    let r = await ev(() => {
      fresh(); const T = window.BRADY_TOUR, st = T.Tour.stops.umb;
      return { hidden: T.TourMap.stopState(st) === 'hidden', unlocked: T.TourProgress.isUnlocked('31-1'), land: T.TourProgress.countryUnlocked(T.Tour.countries.umb), pips: T.TourProgress.exitsFound('8-1') };
    });
    check('before the entrance: the land is hidden on the route map, 31-1 is locked, 8-1\'s card shows its two old exits', r.hidden && !r.unlocked && !r.land && r.pips.total === 2, r);
    r = await ev(() => { play('8-1'); const d = ents('UmbStandDoor')[0]; const hx = Math.floor(d.cx / 32), gy = d.gy; window.__std = { hx, gy }; place(hx - 8, gy - 1); sim(0.3); return { hx, gy, at: at() }; });
    await ev(() => { const { hx, gy } = window.__std; place(hx - 6, gy - 1); sim(0.4); freeze(); });
    await shot('00-entrance-8-1-the-quay.png');
    await ev(() => { thaw(); const { hx, gy } = window.__std; place(hx + 2, gy + 2); sim(0.5); freeze(); });
    await shot('01-entrance-8-1-under-the-stand.png');
    // a hop over the lower quay along the street does not trip it
    r = await ev(() => { thaw(); const { hx, gy } = window.__std, p = P(); place(hx - 2, gy - 1); sim(0.2); sim(0.6, { right: true, jump: true, jumpPressed: true }); sim(0.8, { right: true }); return { state: p.state, at: at() }; });
    check('8-1: hopping the lower quay along the street passes the stand by', r.state === 'play', r);
    // down onto the lower quay, under the stand, and a jump up into its open bottom
    r = await ev(() => {
      const { hx, gy } = window.__std, p = P(); place(hx + 3, gy + 2); sim(0.3);
      for (let k = 0; k < 240 && Math.abs(p.cx - hx * 32 - 16) > 6; k++) sim(1 / 120, { right: p.cx < hx * 32 + 16, left: p.cx > hx * 32 + 16 });
      const onQuay = Math.floor((p.y + p.h - 1) / 32) === gy + 2;
      sim(0.3, { jump: true, jumpPressed: true }); const slipping = p.state === 'portal';
      sim(0.5); return { onQuay, slipping, banner: S().bannerText };
    });
    check('8-1: from the lower quay a jump up into the stand: Brady slips up inside, the land\'s name comes up', r.onQuay && r.slipping && r.banner === 'THE UMBRELLA REPAIR DISTRICT', r);
    await ev(() => freeze()); await shot('02-entrance-slipping-in.png');
    r = await ev(() => {
      thaw(); for (let k = 0; k < 900 && S().state === 'play'; k++) sim(1 / 120); sim(2);
      const T = window.BRADY_TOUR, d = window.BRADY.Save.data;
      return { state: S().state, key: S().exitKey, land: !!d.tour.lands.umb, unlocked: T.TourProgress.isUnlocked('31-1'), pips: T.TourProgress.exitsFound('8-1') };
    });
    check('8-1 clears through its exit to the land: the land opens, 31-1 unlocks, the card now counts the found exit', r.key === 'umb' && r.land && r.unlocked && r.pips.total === 3 && r.pips.found >= 1, r);
    r = await ev(() => {
      window.BRADY.goToMap('world', 1, '8-1');
      for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); }
      if (S().openRoute) S().openRoute({ dest: 'umb' });
      for (let k = 0; k < 60 && (S().rRevealQ == null || S().rReveal || (S().rRevealQ && S().rRevealQ.length)); k++) sim(0.25);
      sim(1);
      const T = window.BRADY_TOUR; return { state: T.TourMap.stopState(T.Tour.stops.umb), mode: S().mode };
    });
    check('the route map now shows The Umbrella Repair District', r.state !== 'hidden', r);
    await ev(() => freeze()); await shot('03-entrance-route-map.png');
    r = await ev(() => { thaw(); window.BRADY.goToMap('world', 1, '31-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { cc: s.ow && s.ow.cc }; });
    check('the land has its own walkable map, and 31-1 can be entered from it', r.cc === 'umb', r);
    await ev(() => freeze()); await shot('04-umb-overworld-map.png');
    await ev(() => thaw());
  });
};



/* ---------------- 31-1 Rib Inspector: grip, crawl, flip at a rivet, the fabric side, the seated tick ---------------- */
STAGES.rib = async ({ ev, shot, run, pano }) => {
  await run('rib', async () => {
    await ev(() => { fresh(); play('31-1'); place(4, 22); sim(0.4); freeze(); });
    await shot('10-31-1-start.png');
    let r = await ev(() => { thaw(); place(13, 22); sim(0.2); sim(0.35, { jump: true, jumpPressed: true, up: true }); const g1 = grip(); const y0 = P().y; sim(0.5, { up: true }); const y1 = P().y; sim(0.6, { right: true }); return { g1, climbedUp: Math.round((y0 - y1) / 32 * 10) / 10, g2: grip() }; });
    check('31-1: a jump while pushing UP grips the canopy\'s ribs; the stick crawls (up, then right)', r.g1 && r.climbedUp >= 1 && r.g2 && r.g2.x > r.g1.x, r);
    await ev(() => freeze()); await shot('11-31-1-gripping-the-ribs.png');
    r = await ev(() => { thaw(); press('jump'); const gone = !grip(); sim(1.2); return { gone, onGround: P().onGround, at: at() }; });
    check('31-1: JUMP away from a rivet lets go (a real jump back onto the street)', r.gone && r.onGround && r.at.y === 22, r);
    r = await ev(() => { place(19, 22); sim(0.1); sim(0.4, { jump: true, jumpPressed: true, up: true, right: true }); const g1 = grip(); sim(3.2, { right: true }); const g2 = grip(); sim(0.4, { down: true }); sim(1.0, { right: true }); return { g1, g2, at: at() }; });
    check('31-1: across the first gap hand over hand, then down onto the next street', r.g1 && r.g2 && r.g2.x >= 30 && !r.at.dead && r.at.y === 22 && r.at.x >= 30, r);
    r = await ev(() => {
      place(54, 22); sim(0.1); sim(0.4, { jump: true, jumpPressed: true, up: true, right: true }); sim(0.6, { up: true });
      const p = P(); for (let k = 0; k < 240 && Math.abs(p.cx - (57 * 32 + 16)) > 6; k++) sim(1 / 120, { right: p.cx < 57 * 32 + 16, left: p.cx > 57 * 32 + 16 });
      for (let k = 0; k < 240 && Math.abs(p.y + 8 - (15 * 32 + 16)) > 6; k++) sim(1 / 120, { down: p.y + 8 < 15 * 32 + 16, up: p.y + 8 > 15 * 32 + 16 });
      const before = grip(); press('jump'); sim(0.45); const after = grip();
      return { before, after };
    });
    check('31-1: JUMP on a rivet flips Brady through to the fabric side', r.before && r.before.face === 0 && r.after && r.after.face === 1, r);
    await ev(() => { sim(0.3, { right: true }); freeze(); }); await shot('12-31-1-fabric-side.png');
    r = await ev(() => {
      thaw(); const p = P(), m = ents('UmbCrawler').find(e => e.face === 0 && Math.abs(e.cx - p.cx) < 12 * 32);
      p.invuln = 0; const hp = p.power; m.u = 0.5; m.place(); p.x = m.cx - p.w / 2; p.y = m.y; sim(0.2); const hurt = p.power !== hp || p.invuln > 0 || p.dead; p.invuln = 999;
      return { face: grip() && grip().face, hurt };
    });
    check('31-1: on the fabric side an underside tick passes Brady by (only a critter on your side can touch you)', r.face === 1 && !r.hurt, r);
    r = await ev(() => {
      const g = S(), seat = ents('UmbTickSeat')[0], p = P(); const tx = seat.tx, mx = seat.markX(), my = seat.markY;
      place(140, 22); sim(0.1); sim(0.4, { jump: true, jumpPressed: true, up: true, right: true });
      const goTo = (x, y) => { for (let k = 0; k < 900 && (Math.abs(p.cx - (x * 32 + 16)) > 6 || Math.abs(p.y + 8 - (y * 32 + 16)) > 6); k++) sim(1 / 120, { right: p.cx < x * 32 + 10, left: p.cx > x * 32 + 22, down: p.y + 8 < y * 32 + 10, up: p.y + 8 > y * 32 + 22 }); };
      goTo(tx - 1, my); const shut0 = tile(tx, my) !== 0; press('action'); sim(0.2); const stillShut = tile(tx, my) !== 0;
      goTo(mx, my); press('action'); sim(0.3);
      return { shut0, stillShut, open: tile(tx, my) === 0, seatOpen: seat.open };
    });
    check('31-1: the seated tick walls off both faces; THROW beside it does nothing', r.shut0 && r.stillShut, r);
    check('31-1: at the far end of its rib, THROW flexes it: the tick pops out, the way is open', r.open && r.seatOpen, r);
    await ev(() => { sim(0.25); freeze(); }); await shot('13-31-1-tick-popped.png');
    await ev(() => { thaw(); play('31-1'); place(150, 22); P().x = 150 * 32; P().y = 12 * 32; P().umb = null; sim(0.05); place(137, 22); sim(0.2); freeze(); }); await shot('14-31-1-seated-tick.png');
    await ev(() => { thaw(); place(84, 22); sim(0.2); freeze(); }); await shot('15-31-1-tall-canopy.png');
    await ev(() => { thaw(); place(80, 4); sim(0.3); freeze(); }); await shot('16-31-1-ticket-ledge.png');
    await ev(() => { thaw(); play('31-1'); }); await pano('pano-31-1.png', 0.3);
  });
};

/* ---------------- 31-2 Every Drop Accounted For: catch drops, stamp the plate, fill the cistern ---------------- */
STAGES.drips = async ({ ev, shot, run, pano }) => {
  await run('drips', async () => {
    await ev(() => { fresh(); play('31-2'); place(4, 20); sim(0.4); freeze(); }); await shot('20-31-2-start.png');
    let r = await ev(() => {
      thaw(); const p = P(); place(15, 20); sim(0.1); press('jump'); sim(1.2); const dry = tile(22, 20) !== 0;
      place(14, 20); sim(2.4); const w = p.umbWater;
      return { dry, w };
    });
    check('31-2: a stamp with nothing to send does nothing; under the drip the drops land on Brady\'s head and stay', r.dry && r.w >= 2, r);
    await ev(() => freeze()); await shot('21-31-2-drops-on-head.png');
    r = await ev(() => { thaw(); const p = P(); sim(0.12, { right: true }); sim(0.4, { jump: true, jumpPressed: true }); sim(1.6); return { w: p.umbWater, open: tile(22, 20) === 0 }; });
    check('31-2: a jump onto the coral plate sends them down the gutter: the cistern fills, the sluice floats up', r.w === 0 && r.open, r);
    await ev(() => freeze()); await shot('22-31-2-sluice-up.png');
    r = await ev(() => {
      thaw(); const p = P(); const gt = ents('UmbGutter').find(e => e.big && e.need === 1); const px = gt.padX;
      place(px - 1, 20); sim(1.0); const w1 = p.umbWater; for (let k = 0; k < 120 && p.umbWater !== 1; k++) sim(1 / 120);
      place(px, 20); sim(0.1); sim(0.4, { jump: true, jumpPressed: true }); sim(1.6); const small = gt.lvl;
      place(px - 1, 20); for (let k = 0; k < 400 && p.umbWater < 2; k++) sim(1 / 120);
      place(px, 20); sim(0.1); sim(0.4, { jump: true, jumpPressed: true }); sim(1.6);
      return { small, full: gt.full };
    });
    check('31-2: the grated cistern lets a small drop through; two merged into a big one fill it', r.small === 0 && r.full, r);
    await ev(() => { place(124, 20); sim(0.2); freeze(); }); await shot('23-31-2-grated-cistern.png');
    await ev(() => { thaw(); place(62, 20); sim(0.2); freeze(); }); await shot('24-31-2-downpipe-housing.png');
    await ev(() => { thaw(); play('31-2'); }); await pano('pano-31-2.png', 0.3);
  });
};

/* ---------------- 31-3 Hook Exchange: hold THROW, the handles nest, let go: a bridge ---------------- */
STAGES.hooks = async ({ ev, shot, run, pano }) => {
  await run('hooks', async () => {
    await ev(() => { fresh(); play('31-3'); place(4, 20); sim(0.4); freeze(); }); await shot('30-31-3-start.png');
    let r = await ev(() => {
      thaw(); const h = ents('UmbHook').find(e => e.tx === 25); place(25, 20); sim(0.2);
      sim(0.1, { action: true, actionPressed: true }); sim(0.9, { action: true }); const mid = h.n; sim(0.05); const slipped = h.n === 0 && !h.rigid;
      sim(0.8);
      return { mid, slipped };
    });
    check('31-3: let go too soon and the short chain slips', r.mid >= 1 && r.slipped, r);
    r = await ev(() => { const h = ents('UmbHook').find(e => e.tx === 25); place(25, 20); sim(0.2); sim(0.1, { action: true, actionPressed: true }); sim(2.4, { action: true }); const lit = h.n >= h.need; sim(1.0, { action: true }); return { lit }; });
    check('31-3: held on the hook\'s mark, the handles nest across the gap and the far ring lights', r.lit, r);
    await ev(() => freeze()); await shot('31-31-3-chain-nested.png');
    r = await ev(() => { thaw(); const h = ents('UmbHook').find(e => e.tx === 25); sim(0.2); const rigid = h.rigid; sim(1.4, { right: true }); return { rigid, at: at() }; });
    check('31-3: let go after it nests: the chain is rigid, Brady walks across it', r.rigid && r.at.y === 20 && r.at.x >= 32, r);
    r = await ev(() => {
      const h = ents('UmbHook').find(e => e.corner); place(h.tx, 20); sim(0.2); sim(1 / 120, { action: true, actionPressed: true }); sim(1.6, { action: true }); const n1 = h.n;
      sim(5.5, { action: true }); sim(0.2); return { n1, need: h.need, rigid: h.rigid };
    });
    check('31-3: on the corner hook the sister rides round the far pulley before nesting (a longer hold), then it\'s rigid', r.n1 === 1 && r.rigid, r);
    r = await ev(() => {
      const h = ents('UmbHook').find(e => e.tx === 120), p = P(); place(117, 18); sim(0.2);
      // up the crate and onto the pillar with the stick and JUMP, to the hook's mark
      for (let k = 0; k < 6 && Math.floor((p.y + p.h - 1) / 32) > 15; k++) { sim(0.08, { right: true }); sim(0.45, { right: true, jump: true, jumpPressed: true }); sim(0.3); }
      for (let k = 0; k < 300 && Math.abs(p.cx - (120 * 32 + 16)) > 5; k++) sim(1 / 60, { right: p.cx < 120 * 32 + 16, left: p.cx > 120 * 32 + 16 });
      const onPillar = Math.floor((p.y + p.h - 1) / 32) === 15;
      sim(1 / 120, { action: true, actionPressed: true }); sim(3.0, { action: true }); sim(0.2); const rigid = h.rigid;
      for (let k = 0; k < 600 && p.cx < 130 * 32 + 16; k++) sim(1 / 120, { right: true }); sim(0.3);
      const ledge = Math.floor((p.y + p.h - 1) / 32) === 15 && p.cx > 127 * 32;
      sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 600 && (S().fade.a > 0.05 || p.state !== 'play'); k++) sim(1 / 120); sim(0.5);
      return { onPillar, rigid, ledge, area: S().area.aid };
    });
    check('31-3: the side hook on the pillar builds a chain under the hoarding to the high ledge, and its door leads to room B28', r.onPillar && r.rigid && r.ledge && r.area === 'tray', r);
    await ev(() => { play('31-3'); });
    await ev(() => { const h = ents('UmbHook').find(e => e.corner); h.rigid = false; h.n = 0; h.hold = false; place(h.tx, 20); sim(0.1); sim(1 / 120, { action: true, actionPressed: true }); sim(2.0, { action: true }); freeze(); }); await shot('32-31-3-corner-sister.png');
    await ev(() => { thaw(); place(119, 14); sim(0.2); freeze(); }); await shot('33-31-3-side-hook-ticket.png');
    await ev(() => { thaw(); play('31-3'); }); await pano('pano-31-3.png', 0.3);
  });
};

/* ---------------- 31-4 Panel Beater: pop the dents from underneath ---------------- */
STAGES.panels = async ({ ev, shot, run, pano }) => {
  await run('panels', async () => {
    await ev(() => { fresh(); play('31-4'); place(8, 20); sim(0.4); freeze(); }); await shot('40-31-4-rain-sheet.png');
    let r = await ev(() => { thaw(); const pn = ents('UmbPanel').sort((a, b) => a.tx0 - b.tx0)[0]; const shut = tile(pn.cur, 19) !== 0; place(14, 20); sim(0.2); sim(0.5, { jump: true, jumpPressed: true }); sim(0.8); return { shut, dent: pn.dent, open: tile(pn.cur, 19) === 0 }; });
    check('31-4: the rain sheet walls the way; a jump into the dent from underneath pops it: the way is open', r.shut && !r.dent && r.open, r);
    await ev(() => { sim(0.1); freeze(); }); await shot('41-31-4-popped.png');
    r = await ev(() => {
      thaw(); const L = ents('UmbPanel').filter(e => e.group).sort((a, b) => a.gi - b.gi);
      const bump = e => { place(e.tx0 + 1, 20); sim(0.2); sim(0.5, { jump: true, jumpPressed: true }); sim(0.8); };
      bump(L[0]); bump(L[1]); const back = L[0].dent;
      bump(L[2]); bump(L[1]); bump(L[0]);
      return { back, all: L.every(e => !e.dent), open: ents('UmbShutter')[0].open };
    });
    check('31-4: in the row of three, popping one pops its left neighbour back in; from the far end all three come out and the shutter lifts', r.back && r.all && r.open, r);
    await ev(() => { place(160, 20); sim(0.6); freeze(); }); await shot('42-31-4-row-of-three.png');
    await ev(() => { thaw(); place(94, 20); sim(0.2); freeze(); }); await shot('43-31-4-missing-panel.png');
    await ev(() => { thaw(); play('31-4'); }); await pano('pano-31-4.png', 0.3);
  });
};

/* ---------------- 31-5 Shake Well: herd the puddles, stamp the dry end ---------------- */
STAGES.shake = async ({ ev, shot, run, pano }) => {
  await run('shake', async () => {
    await ev(() => { fresh(); play('31-5'); place(12, 20); sim(0.4); freeze(); }); await shot('50-31-5-canopy.png');
    const herd = (i) => ev(i => {
      const sh = ents('UmbShake').sort((a, b) => a.x - b.x)[i], p = P();
      place(sh.tx0, 20); sim(0.2); for (let k = 0; k < 600 && p.cx < (sh.tx1 + 0.3) * 32; k++) sim(1 / 120, { right: true });
      sim(0.2); const inN = sh.pud.filter(q => sh.inScoop(q)).length;
      for (let k = 0; k < 600 && p.cx > sh.dryX() + 10; k++) sim(1 / 120, { left: true }); sim(0.3);
      sim(0.15); sim(0.45, { jump: true, jumpPressed: true }); sim(2.0);
      return { inN, done: sh.done, need: sh.need };
    }, i);
    let r = await ev(() => { thaw(); const sh = ents('UmbShake').sort((a, b) => a.x - b.x)[0]; place(sh.tx0, 20); sim(0.2); sim(0.45, { jump: true, jumpPressed: true }); sim(1.2); return { done: sh.done }; });
    check('31-5: a stamp on the dry end with the scallop empty flings nothing', !r.done, r);
    r = await herd(0);
    check('31-5: walked along, the water is herded into the scallop; a stamp on the dry end flings it into the cup', r.inN >= 1 && r.done, r);
    await ev(() => freeze()); await shot('51-31-5-cup-filled.png');
    await ev(() => thaw());
    r = await herd(3);
    check('31-5: the high cup: all three puddles herded together and flung at once', r.inN === 3 && r.done, r);
    await ev(() => freeze()); await shot('52-31-5-three-together.png');
    await ev(() => { thaw(); place(92, 20); sim(0.2); freeze(); }); await shot('53-31-5-manhole.png');
    await ev(() => { thaw(); play('31-5'); }); await pano('pano-31-5.png', 0.3);
  });
};

/* ---------------- 31-6 the lead-in: the jammed umbrellas, the runner walked home ---------------- */
STAGES.corridor = async ({ ev, shot, run, pano }) => {
  await run('corridor', async () => {
    await ev(() => { fresh(); play('31-6'); place(12, 15); sim(0.4); freeze(); }); await shot('60-31-6-jammed.png');
    const r = await ev(() => { thaw(); const j = ents('UmbJam')[0], p = P(); place(j.markX(), 15); sim(0.2); sim(0.1, { action: true, actionPressed: true }); sim(1.2, { action: true, left: true }); sim(0.4); return { open: j.open, tile: tile(j.tx, 15) }; });
    check('31-6: at the runner, hold THROW and walk back: the umbrella snaps the right way out and the way opens', r.open && r.tile === 0, r);
    await ev(() => freeze()); await shot('61-31-6-runner-home.png');
    await ev(() => { thaw(); play('31-6'); }); await pano('pano-31-6.png', 0.4);
  });
};

/* ---------------- 31-6 the boss in the hall (landscape) ---------------- */
STAGES.boss = async ({ ev, shot, run }) => {
  await run('boss', async () => {
    await ev(() => { fresh(); play('31-6'); const g = S(), k = areaOf(g, 'hall'), A = g.level.areas[k]; g.loadArea(k, A.anchors.in.x, A.anchors.in.y); P().invuln = 999; sim(0.2); for (let n = 0; n < 200; n++) sim(1 / 120, { right: true }); sim(3.0); freeze(); });
    await shot('80-31-6-boss-hall.png');
    const r = await ev(() => { thaw(); const b = S().entities.find(e => e.boss && !e.remove); for (let n = 0; n < 120 * 12 && !(b.act === 'tell' && b.at > 0.55); n++) sim(1 / 120); return { act: b.act }; });
    await ev(() => freeze()); await shot('81-31-6-boss-tell.png');
    check('31-6: the Inspector shows his tell before he pokes', r.act === 'tell', r);
    const r2 = await ev(() => { thaw(); const b = S().entities.find(e => e.boss && !e.remove), p = P(); p.invuln = 0; p.setPower(1, true); const pw = p.power; let hurt = false; const h0 = p.hurt; p.hurt = function () { hurt = true; return h0.apply(this, arguments); };
      const C = b.collars[0]; for (let n = 0; n < 120 * 4 && b.act !== 'caught'; n++) sim(1 / 120, Math.abs(p.cx - (C.x + b.dir * 1.4 * 32)) > 6 && b.act === 'tell' ? { right: p.cx < C.x + b.dir * 44, left: p.cx > C.x + b.dir * 44 } : {});
      sim(0.5); p.hurt = h0; p.invuln = 999; return { caught: b.act === 'caught', hurt }; });
    check('31-6: the bait carries a risk: standing still in the glow, the caught poke still lunges through the collar and hurts', r2.caught && r2.hurt, r2);
    await ev(() => thaw());
  });
};

/* ---------------- the six secret rooms: found, entered (title, then rule), failed once, won, left ---------------- */
const ROOMS = [
  ['31-1', 'lunch', '70-room-B26-long-lunch', "const R = room(); R.ang = R.ang; press('action'); sim(1.4);"],
  ['31-2', 'sew', '71-room-B27-threadbare', "sim(2.4, { left: true }); sim(0.3);"],
  ['31-3', 'tray', '72-room-B28-finders-keepers', "const R = room(), f = R.items.find(i => !i.key); for (let k = 0; k < 900 && Math.abs(R.mx - f.x) > 0.04; k++) sim(1 / 120, { right: R.mx < f.x, left: R.mx > f.x }); for (let k = 0; k < 600 && !(R.fails > 0); k++) sim(1 / 120, { down: true }); sim(0.3);"],
  ['31-4', 'booth', '73-room-B29-viewfinder', "press('action'); sim(0.4);"],
  ['31-5', 'slice', '74-room-B30-seed-the-slice', "const R = room(); const ok = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]].find(d => R.bare.indexOf(S().area.roomKit && window.BRADY_TOUR.TourRooms.kinds.umbSlice.wedgeAt({ rot: R.rot + Math.PI * 2 / 11 * 0.36 }, Math.atan2(d[1], d[0]))) < 0); sim(0.05, { right: ok[0] > 0, left: ok[0] < 0, down: ok[1] > 0, up: ok[1] < 0 }); sim(1 / 120, { right: ok[0] > 0, left: ok[0] < 0, down: ok[1] > 0, up: ok[1] < 0, action: true, actionPressed: true }); sim(0.6);"],
  ['31-6', 'shower', '75-room-missing-rib', "press('action'); sim(0.4);"]
];
STAGES.rooms = async ({ ev, shot, run }) => {
  await ev(ROOM_HELPERS);
  for (const [lv, aid, tag, miss] of ROOMS) await run('rooms-' + aid, async () => {
    let r = await ev(([lv, aid]) => { fresh(); play(lv); toArea(aid); sim(0.5); return { title: S().bannerText, kind: kit() && kit().kind, toast: S().toastT > 0 }; }, [lv, aid]);
    check(tag + ': entering shows the title alone first (no rule toast yet)', !!r.kind && !r.toast && !!r.title, r);
    await ev(() => freeze()); await shot(tag + '-0-title.png');
    r = await ev(() => { thaw(); sim(1.6); return { toast: S().toastText }; });
    await ev(() => freeze()); await shot(tag + '-1-rule.png');
    // up to the station and take the prop: THROW
    r = await ev(() => { thaw(); const st = ents('UmbStation')[0]; walkTo(st.tx * 32 + 16, 4); press('action'); sim(0.3); return { mounted: room().mounted }; });
    check(tag + ': THROW on the station takes the prop', r.mounted, r);
    await ev(() => { sim(0.6); freeze(); }); await shot(tag + '-2-playing.png');
    r = await ev(m => { thaw(); const R = room(), f0 = R.fails || 0; (new Function(m))(); return { fails: R.fails || 0, f0, won: R.won }; }, miss);
    check(tag + ': a miss costs nothing: that turn starts again', r.fails > r.f0 && !r.won, r);
    r = await ev(() => { const g = S(), A = g.area, R = room(), K = window.BRADY_TOUR.TourRooms.kinds[kit().kind]; if (!R.mounted) { const st = ents('UmbStation')[0]; walkTo(st.tx * 32 + 16, 4); press('action'); sim(0.2); } K.testWin(g, A, R, kit(), (gg, inp) => sim(1 / 120, inp || {})); sim(1.5); return { won: R.won, cage: cageOpen() }; });
    check(tag + ': won with the stick and the buttons; the prize cage opens at the win', r.won && r.cage, r);
    await ev(() => freeze()); await shot(tag + '-3-won.png');
    r = await ev(aid => { thaw(); const out = leave(); return { out, area: S().area.aid }; }, aid);
    check(tag + ': its door lets Brady out elsewhere in the level', r.area !== aid, r);
  });
};
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
  const solid = (x, y) => { const t = tileAt(x, y); return t === 99 || (window.BRADY_TOUR.umbKit.SOLID[t]); };
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
        const crit = S().entities.some(e => e.enemy && !e.dead && !e.remove && !e.boss && !e.isUmbCrawler && (e.cx - q.cx) * dir > 0 && Math.abs(e.cx - q.cx) < 90 && Math.abs((e.y + e.h) - (q.y + q.h)) < 40);
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
  T.grip = (dir) => { if (!T.f({ jump: true, jumpPressed: true, up: true, right: dir > 0, left: dir < 0 })) return false; for (let k = 0; k < 60 && !(p().umb && p().umb.grip); k++) if (!T.f({ up: true, jump: true, right: dir > 0, left: dir < 0 })) return false; return !!(p().umb && p().umb.grip); };
  // climb to a cell (grip row y): wait while a critter on his face is close in the way
  T.climb = (x, y) => {
    for (let k = 0; k < 120 * 30; k++) {
      const q = p(), W = q.umb; if (!W || !W.grip) return 'lost grip';
      const gx = x * 32 + 16, gy = y * 32 + 16, dx = gx - q.cx, dy = gy - (q.y + 8);
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return true;
      const mine = S().entities.filter(e => e.isUmbCrawler && !e.dead && e.face === W.face);
      const close = mine.find(e => Math.hypot(e.cx - q.cx, e.cy - q.cy) < 62);
      const near = mine.some(e => Math.hypot(e.cx - (q.cx + Math.sign(dx) * 30), e.cy - (q.cy + Math.sign(dy) * 30)) < 50);
      // a critter on his face coming at him: back off along the net, the way a careful player would
      let inp = near ? {} : { right: dx > 4, left: dx < -4, down: dy > 4 && Math.abs(dx) < 20, up: dy < -4 && Math.abs(dx) < 20 };
      if (close) { const ex = q.cx - close.cx, ey = q.cy - close.cy; inp = Math.abs(ex) > Math.abs(ey) ? { right: ex > 0, left: ex < 0 } : { down: ey > 0, up: ey < 0 }; }
      if (!T.f(inp)) return false;
    }
    return 'stuck';
  };
  T.cross = () => { const f0 = p().umb.face; if (!T.f({ jump: true, jumpPressed: true })) return false; T.wait(0.45); return p().umb && p().umb.face !== f0; };
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
const BOT_UMB = () => {
  const T = window.BOT, p = () => S().player, B = window.BRADY;
  const ent = (name, f) => S().entities.filter(e => e.constructor.name === name && !e.remove && (!f || f(e)));
  // to column x precisely: walk (hopping as needed) close, then short taps
  T.to = x => { const X = x * 32 + 16, d0 = Math.sign(X - p().cx) || 1; if (Math.abs(X - p().cx) > 110 && T.walk(X - d0 * 100, { tol: 30 }) === false) return false; for (let k = 0; k < 600 && !p().onGround; k++) if (!T.f({})) return false; for (let k = 0; k < 400 && Math.abs(p().cx - X) > 5; k++) { const d = p().cx < X ? 1 : -1, far = Math.abs(p().cx - X) > 60; if (p().hitWall && p().onGround) { if (!T.hop(d, false, 0.4)) return false; continue; } for (let q = 0; q < (far ? 4 : 1); q++) if (!T.f({ right: d > 0, left: d < 0 })) return false; for (let q = 0; q < (far ? 2 : 4); q++) if (!T.f({})) return false; } return T.wait(0.15); };
  // stand under the drip at column x until Brady carries n units of water
  T.fill = (x, n) => { if (!T.to(x)) return false; for (let k = 0; k < 120 * 12 && (p().umbWater || 0) < n; k++) { const dx = x * 32 + 16 - p().cx; if (!T.f(Math.abs(dx) > 6 ? { right: dx > 0, left: dx < 0 } : {})) return false; } return (p().umbWater || 0) >= n; };
  // a stamp: a jump that lands on column x; then wait for the water to run along
  T.stamp = x => { if (!T.hopTo(x, 0.4)) return false; return T.wait(1.6); };
  // hold THROW on the hook's mark at column x until its chain is rigid, then let go
  T.hook = x => {
    const h = ent('UmbHook', e => e.tx === x)[0]; if (!h) return true;
    if (!T.to(x)) return false;
    for (let tries = 0; tries < 3 && !h.rigid; tries++) {
      if (!T.f({ action: true, actionPressed: true })) return false;
      for (let k = 0; k < 120 * 9 && h.n < h.need; k++) if (!T.f({ action: true })) return false;
      if (!T.f({})) return false; if (!T.wait(0.3)) return false;
    }
    return h.rigid || 'stuck';
  };
  // bump the dent over column x from underneath (jump straight up)
  T.bump = x => { const pn = ent('UmbPanel', e => x * 32 >= e.x && x * 32 < e.x + e.w)[0]; if (!T.to(x)) return false; for (let k = 0; k < 3 && pn && pn.dent; k++) { if (!T.hop(0, false, 0.5)) return false; if (!T.wait(0.2)) return false; } return !pn || !pn.dent || 'stuck'; };
  // herd the canopy at column x0 and stamp its dry end (twice over if the fling fell short)
  T.herd = x0 => {
    const sh = ent('UmbShake', e => e.tx0 === x0)[0]; if (!sh) return true;
    for (let tries = 0; tries < 3 && !sh.done; tries++) {
      if (!T.walk(sh.tx0 * 32 + 16, { noHop: true, tol: 8 })) return false;
      for (let k = 0; k < 120 * 6 && p().cx < (sh.tx1 + 0.3) * 32; k++) if (!T.f({ right: true })) return false;
      if (!T.wait(0.3)) return false;
      for (let k = 0; k < 120 * 6 && p().cx > sh.dryX() + 10; k++) if (!T.f({ left: true })) return false;
      if (!T.wait(0.3)) return false; if (!T.hop(0, false, 0.45)) return false; if (!T.wait(1.6)) return false;
    }
    return sh.done || 'stuck';
  };
  // the jammed umbrella: to its runner's mark, hold THROW and walk back
  T.jam = () => {
    const j = ent('UmbJam', e => !e.open).sort((a, b) => Math.abs(a.cx - p().cx) - Math.abs(b.cx - p().cx))[0]; if (!j) return true;
    if (!T.to(j.markX())) return false;
    if (!T.f({ action: true, actionPressed: true })) return false;
    for (let k = 0; k < 120 * 3 && !j.open; k++) if (!T.f({ action: true, left: j.side < 0, right: j.side > 0 })) return false;
    return j.open || 'stuck';
  };
  // the Inspector: stand just past this phase's collar, away from him; caught: the runner home
  T.bossFight = () => {
    const boss = () => S().entities.find(e => e.boss && !e.remove);
    for (let k = 0; k < 120 * 6 && !(boss() && boss().collars); k++) if (!T.f({ right: p().cx < 8 * 32 })) return false;
    for (let guard = 0; guard < 120 * 180; guard++) {
      const b = boss(); if (!b || b.state === 'dying') return T.wait(3) && true;
      if (!b.collars) { if (!T.f()) return false; continue; }
      const q = p(), ph = b.phase || 1, C = b.collars[ph - 1], att = ['poke', 'scoop', 'jab'].includes(b.act);
      let inp = {};
      if (b.act === 'caught') {
        const busy = b.thrust && b.thrust.t < 0.55, side = b.dir;
        if (busy) inp = q.onGround ? {} : { jump: true };
        else inp = Math.abs(q.cx - b.markX) > 6 && !b.hold ? { right: q.cx < b.markX, left: q.cx > b.markX } : { action: true, actionPressed: !b.hold, right: side > 0, left: side < 0 };
      } else if (att) {
        // read the attack: jump the poke and the jab as the head nears the collar (and hop back from the jab); the
        // scoop is waited out close behind the collar
        const near = (C.x - b.head) * b.dir > -8 && Math.abs(b.head - C.x) < 2.4 * 32;
        if (ph !== 2 && near) inp = { jump: true, jumpPressed: q.onGround, right: ph === 3 && b.dir > 0, left: ph === 3 && b.dir < 0 };
        else if (!q.onGround) inp = { jump: true };
      } else if (b.act !== 'drop') {
        const away = b.act === 'back' ? (C.x < (b.arenaX0 + b.arenaX1) / 2 ? -1 : 1) : b.dir, spot = C.x + away * (ph === 2 ? 1.0 : 1.4) * 32;
        if (Math.abs(q.cx - spot) > 6) inp = { right: q.cx < spot, left: q.cx > spot };
      }
      if (!T.f(inp)) return false;
    }
    return 'stuck';
  };
};
// each stage's route: [move, ...args] steps and 'cp' markers (after a death the route resumes at the last marker
// Brady had passed)
const BOT_ROUTES = {
  '31-1': [['walk', 19 * 32], ['grip', 1], ['climb', 31, 17], ['letGo', 1], 'cp', ['walk', 53 * 32 + 8], ['grip', 1], ['climb', 55, 15], ['climb', 57, 15], ['cross'], ['climb', 57, 12], ['climb', 66, 12], ['climb', 66, 15], ['cross'], ['climb', 68, 15], ['letGo', 1], 'cp',
    ['walk', 84 * 32 + 16], ['grip', 1], ['climb', 86, 12], ['climb', 100, 12], ['letGo', 1], 'cp', ['walk', 129 * 32], 'cp', ['to', 138], ['grip', 1], ['climb', 143, 14], ['climb', 147, 14], ['cross'], ['climb', 152, 9], ['press', 'action'], ['wait', 0.6],
    ['climb', 167, 12], ['letGo', 1], ['walk', 173 * 32], 'cp', ['to', 184], ['grip', 1], ['climb', 189, 12], ['climb', 192, 12], ['cross'], ['climb', 197, 14], ['press', 'action'], ['wait', 0.6], ['climb', 214, 13], ['letGo', 1], 'cp', ['walk', 231 * 32], ['gate']],
  '31-2': [['fill', 14, 2], ['stamp', 15], ['walk', 27 * 32], 'cp', ['fill', 48, 3], ['stamp', 50], ['to', 63], ['hopTo', 69, 0.55], ['walk', 72 * 32], ['walk', 77 * 32], 'cp',
    ['walk', 110 * 32], ['fill', 112, 2], ['stamp', 113], ['walk', 126 * 32], 'cp', ['walk', 138 * 32], ['fill', 140, 2], ['stamp', 141], ['fill', 140, 2], ['stamp', 141], ['walk', 171 * 32], 'cp', ['walk', 190 * 32], ['gate']],
  '31-3': [['hook', 25], ['walk', 40 * 32], 'cp', ['hook', 62], ['walk', 80 * 32], 'cp', ['hook', 96], ['walk', 114 * 32], ['walk', 137 * 32], 'cp', ['hook', 150], ['walk', 170 * 32], 'cp', ['hook', 182], ['walk', 200 * 32], 'cp', ['walk', 210 * 32], ['gate']],
  '31-4': [['bump', 14], ['walk', 30 * 32], 'cp', ['bump', 41], ['walk', 62 * 32], ['bump', 67], ['walk', 84 * 32], 'cp', ['bump', 115], ['walk', 132 * 32], 'cp', ['bump', 159], ['bump', 155], ['bump', 151], ['walk', 172 * 32], 'cp', ['walk', 198 * 32], ['gate']],
  '31-5': [['herd', 14], ['walk', 30 * 32], 'cp', ['herd', 44], ['walk', 66 * 32], 'cp', ['walk', 108 * 32], ['herd', 112], ['walk', 144 * 32], 'cp', ['herd', 150], ['walk', 178 * 32], 'cp', ['walk', 208 * 32], ['gate']],
  '31-6': [['jam'], ['walk', 40 * 32], ['jam'], ['walk', 56 * 32], 'cp', ['walk', 72 * 32 + 16, { noHop: true }], ['door'], ['bossFight'], ['gate']]
};
const BOT_BOSS = () => {};

(async () => {
  if (args.includes('--bot')) {
    await session({ width: 874, height: 402 }, async ({ ev }) => {
      await ev(BOT_PAGE); await ev(BOT_UMB);
      for (const id of Object.keys(BOT_ROUTES)) {
        if (want.length && !want.includes(id)) continue;
        const r = await ev(([i, route]) => window.BOT.run(i, route), [id, BOT_ROUTES[id]]);
        const spots = {}; for (const d of r.deaths) { const k = d.x + ',' + d.y + ' ' + d.reason + (d.near && d.near.length ? ' (' + d.near.join('/') + ')' : ''); spots[k] = (spots[k] || 0) + 1; }
        console.log(`BOT ${id}: ${r.finished ? 'FINISHED' : 'DID NOT FINISH'}, ${r.deaths.length} death(s) ${JSON.stringify(spots)}${r.fails.length ? ' fails ' + r.fails.join(' ') : ''}`);
        if (args.includes('--trace')) console.log(JSON.stringify(r.trace));
        check(`bot ${id}: played start to finish (enemies on, damage on), at most one death`, r.finished && r.deaths.length <= 1, { deaths: r.deaths.length, spots, fails: r.fails });
      }
    });
    console.log(failures ? `${failures} UMB BOT CHECK(S) FAILED` : 'ALL UMB BOT CHECKS PASSED');
    process.exit(failures ? 1 : 0);
  }
  await session({ width: 874, height: 402 }, async (o) => {
    for (const k of Object.keys(STAGES)) await STAGES[k](o);
  });
  await session({ width: 402, height: 874 }, async ({ ev, shot, run }) => {
    await run('p-rib', async () => { await ev(() => { fresh(); play('31-1'); place(13, 22); sim(0.2); sim(0.35, { jump: true, jumpPressed: true, up: true }); sim(0.4, { up: true }); freeze(); }); await shot('90-portrait-31-1-canopy.png'); });
    await run('p-boss', async () => { await ev(() => { thaw(); fresh(); play('31-6'); const g = S(), k = areaOf(g, 'hall'), A = g.level.areas[k]; g.loadArea(k, A.anchors.in.x, A.anchors.in.y); P().invuln = 999; sim(0.2); for (let n = 0; n < 300; n++) sim(1 / 120, { right: true }); sim(3.2); freeze(); }); await shot('91-portrait-31-6-boss.png'); });
    await run('p-map', async () => { await ev(() => { thaw(); fresh(); const d = window.BRADY.Save.data; d.tour.lands.umb = true; d.unlocked['31-1'] = true; window.BRADY.goToMap('world', 1, '31-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } freeze(); }); await shot('92-portrait-umb-map.png'); });
  });
  console.log(failures ? `${failures} UMB CHECK(S) FAILED` : 'ALL UMB CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
