// Wrong Side of the Wash (hidden land 26): screenshots and in-browser checks. The hidden entrance in France 7-1 (the
// bakery's rear balcony: the sheet whose peg throws its shadow on the FRONT of the fabric), the arrival, the land's
// map, each stage's mechanic played with real inputs (the stick and the two buttons through the game loop), each
// secret room (found, won once, failed once, left by its exit), the boss's lead-in. Phone landscape (874x402 @2x,
// the game's 844x390 view) and portrait (402x874). Silent.
// usage: BRADY_DIST=<dist> node tools/sbw_wash_shots.js <outdir> [--checks] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'wash-shots'), checksOnly = args.includes('--checks');
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
    window.place = (tx, ty) => { const g = S(), p = P(); g.timeLeft = Math.max(g.timeLeft || 0, 300); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; if (p.wash) p.wash.grip = null; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.toArea = (aid, tx, ty) => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = A.anchors.in || A.anchors.start || Object.values(A.anchors)[0] || { x: 96, y: (A.H - 4) * 32 }; if (g.area.idx !== k) g.loadArea(k, an.x, an.y); P().invuln = 999; if (tx != null) place(tx, ty); };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } if (g.player) g.player.invuln = 999; };
    window.tile = (x, y) => { const A = S().area; return A.tiles[y * A.W + x]; };
    window.ents = name => S().entities.filter(e => e.constructor.name === name && !e.remove);
    window.grip = () => { const W = P().wash; return W && W.grip ? { face: W.face, x: Math.round(P().cx / 32), y: Math.floor((P().y + 8) / 32) } : null; };
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

/* ---------------- the hidden entrance: France 7-1, the bakery's rear balcony ---------------- */
STAGES.door = async ({ ev, shot, run }) => {
  await run('door', async () => {
    let r = await ev(() => {
      fresh(); const T = window.BRADY_TOUR, st = T.Tour.stops.wash;
      return { hidden: T.TourMap.stopState(st) === 'hidden', unlocked: T.TourProgress.isUnlocked('26-1'), land: T.TourProgress.countryUnlocked(T.Tour.countries.wash), pips: T.TourProgress.exitsFound('7-1') };
    });
    check('before the entrance: the land is hidden on the route map, 26-1 is locked, 7-1\'s card shows its two old exits', r.hidden && !r.unlocked && !r.land && r.pips.total === 2, r);
    // the bakery errand: the street past the delivery hatch, the balcony over it
    r = await ev(() => {
      play('7-1'); toArea('boulangerie'); const hem = ents('WashHem')[0]; const hx = Math.floor(hem.cx / 32), gy = Math.floor((hem.y + hem.h) / 32) + 5;
      window.__hem = { hx, gy }; place(hx - 12, gy - 1); sim(0.3); return { hx, gy, at: at() };
    });
    await ev(() => { const { hx, gy } = window.__hem; place(hx - 13, gy - 1); sim(0.4); freeze(); });
    await shot('00-entrance-7-1-the-balcony-from-the-street.png');
    await ev(() => { thaw(); const { hx, gy } = window.__hem; place(hx - 4, gy - 4); sim(0.4); freeze(); });
    await shot('01-entrance-7-1-before-the-clue.png');
    // up the three steps with the stick and JUMP, along the slab, and up through the hem
    r = await ev(() => {
      thaw(); const { hx, gy } = window.__hem, p = P(); place(hx - 12, gy - 1); sim(0.2);
      for (let k = 0; k < 4 && Math.floor((p.y + p.h - 1) / 32) > gy - 4; k++) { sim(0.08, { right: true }); sim(0.4, { right: true, jump: true, jumpPressed: true }); sim(0.3); }
      for (let k = 0; k < 240 && Math.abs(p.cx - hx * 32 - 16) > 8; k++) sim(1 / 120, { right: p.cx < hx * 32 + 16, left: p.cx > hx * 32 + 16 });
      const onSlab = Math.floor((p.y + p.h - 1) / 32) === gy - 4;
      sim(0.3, { jump: true, jumpPressed: true }); const slipping = p.state === 'portal';
      sim(0.5); const banner = S().bannerText;
      return { onSlab, slipping, banner };
    });
    check('7-1: up the bakery\'s rear balcony and a jump up through the hem: Brady slips through, the land\'s name comes up', r.onSlab && r.slipping && r.banner === 'WRONG SIDE OF THE WASH', r);
    await ev(() => freeze()); await shot('02-entrance-slipping-through.png');
    r = await ev(() => {
      thaw(); for (let k = 0; k < 900 && S().state === 'play'; k++) sim(1 / 120); sim(2);
      const T = window.BRADY_TOUR, d = window.BRADY.Save.data;
      return { state: S().state, key: S().exitKey, land: !!d.tour.lands.wash, unlocked: T.TourProgress.isUnlocked('26-1'), pips: T.TourProgress.exitsFound('7-1') };
    });
    check('7-1 clears through its exit to the land: the land opens, 26-1 unlocks, the card now counts the found exit', r.key === 'wash' && r.land && r.unlocked && r.pips.total === 3 && r.pips.found >= 1, r);
    // the route map: the land appears beside France
    r = await ev(() => {
      window.BRADY.goToMap('world', 1, '7-1');
      for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); }
      if (S().openRoute) S().openRoute({ dest: 'wash' });
      for (let k = 0; k < 60 && (S().rRevealQ == null || S().rReveal || (S().rRevealQ && S().rRevealQ.length)); k++) sim(0.25);
      sim(1);
      const T = window.BRADY_TOUR; return { state: T.TourMap.stopState(T.Tour.stops.wash), mode: S().mode };
    });
    check('the route map now shows Wrong Side of the Wash', r.state !== 'hidden', r);
    await ev(() => freeze()); await shot('03-entrance-route-map.png');
    r = await ev(() => { thaw(); window.BRADY.goToMap('world', 1, '26-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { cc: s.ow && s.ow.cc }; });
    check('the land has its own walkable map, and 26-1 can be entered from it', r.cc === 'wash', r);
    await ev(() => freeze()); await shot('04-wash-overworld-map.png');
    await ev(() => thaw());
  });
};

/* ---------------- 26-1 Peg Legwork: grip, climb, cross, the far face, the beetle's peg ---------------- */
STAGES.peg = async ({ ev, shot, run, pano }) => {
  await run('peg', async () => {
    await ev(() => { fresh(); play('26-1'); place(4, 22); sim(0.4); freeze(); });
    await shot('10-26-1-start.png');
    // the teach net: jump and push up into it, then climb with the stick
    let r = await ev(() => { thaw(); place(13, 22); sim(0.2); sim(0.35, { jump: true, jumpPressed: true, up: true }); const g1 = grip(); const y0 = P().y; sim(0.5, { up: true }); const y1 = P().y; sim(0.6, { right: true }); return { g1, climbedUp: Math.round((y0 - y1) / 32 * 10) / 10, g2: grip() }; });
    check('26-1: a jump while pushing UP grips the net; the stick climbs it (up, then right)', r.g1 && r.climbedUp >= 1 && r.g2 && r.g2.x > r.g1.x, r);
    await ev(() => freeze()); await shot('11-26-1-gripping-the-net.png');
    // JUMP lets go with a real jump; back on the roof
    r = await ev(() => { thaw(); press('jump'); const gone = !grip(); sim(1.2); return { gone, onGround: P().onGround, at: at() }; });
    check('26-1: JUMP away from a torn square lets go (a real jump back onto the roof)', r.gone && r.onGround && r.at.y === 22, r);
    // the first gap: climb across the net over it
    r = await ev(() => { place(19, 22); sim(0.1); sim(0.4, { jump: true, jumpPressed: true, up: true, right: true }); const g1 = grip(); sim(3.2, { right: true }); const g2 = grip(); sim(0.4, { down: true }); sim(1.0, { right: true }); return { g1, g2, at: at() }; });
    check('26-1: across the first gap hand over hand, then down onto the next roof', r.g1 && r.g2 && r.g2.x >= 30 && !r.at.dead && r.at.y === 22 && r.at.x >= 30, r);
    // torn squares: squeeze through to the far face; a critter on the near face can't touch Brady there
    r = await ev(() => {
      place(54, 22); sim(0.1); sim(0.4, { jump: true, jumpPressed: true, up: true, right: true }); sim(0.6, { up: true });
      // to the torn square at (57, 15)
      const p = P(); for (let k = 0; k < 240 && Math.abs(p.cx - (57 * 32 + 16)) > 6; k++) sim(1 / 120, { right: p.cx < 57 * 32 + 16, left: p.cx > 57 * 32 + 16 });
      for (let k = 0; k < 240 && Math.abs(p.y + 8 - (15 * 32 + 16)) > 6; k++) sim(1 / 120, { down: p.y + 8 < 15 * 32 + 16, up: p.y + 8 > 15 * 32 + 16 });
      const before = grip(); press('jump'); sim(0.45); const after = grip();
      return { before, after };
    });
    check('26-1: JUMP in a torn square squeezes Brady through to the far face', r.before && r.before.face === 0 && r.after && r.after.face === 1, r);
    await ev(() => { sim(0.3, { right: true }); freeze(); }); await shot('12-26-1-far-face.png');
    r = await ev(() => {
      thaw(); const p = P(), m = ents('WashCrawler').find(e => e.face === 0 && e.kind === 'moth' && Math.abs(e.cx - p.cx) < 12 * 32);
      p.invuln = 0; const hp = p.power; m.u = 0.5; m.place(); p.x = m.cx - p.w / 2; p.y = m.y; sim(0.2); const hurt = p.power !== hp || p.invuln > 0 || p.dead; p.invuln = 999;
      return { face: grip() && grip().face, hurt };
    });
    check('26-1: on the far face a near-face moth passes Brady by (only a critter on your side can touch you)', r.face === 1 && !r.hurt, r);
    // the Peg Beetle's trouser wall: from the near face he only complains; round the back, THROW squeezes his peg
    r = await ev(() => {
      const g = S(), gate = ents('WashBeetleGate')[0], p = P(); const tx = Math.floor(gate.cx / 32), top = gate.tiles[gate.tiles.length - 1][1];
      // up the long net on the near face, to the spot beside the peg
      place(140, 22); sim(0.1); sim(0.4, { jump: true, jumpPressed: true, up: true, right: true });
      const goTo = (x, y) => { for (let k = 0; k < 900 && (Math.abs(p.cx - (x * 32 + 16)) > 6 || Math.abs(p.y + 8 - (y * 32 + 16)) > 6); k++) sim(1 / 120, { right: p.cx < x * 32 + 10, left: p.cx > x * 32 + 22, down: p.y + 8 < y * 32 + 10, up: p.y + 8 > y * 32 + 22 }); };
      goTo(tx - 1, gate.clipY); const shut0 = tile(tx, gate.clipY) !== 0; press('action'); sim(0.2); const stillShut = tile(tx, gate.clipY) !== 0;
      // round the back through the torn square left of the wall, up to the peg, THROW
      const hole = g.area.zones.find(z => z.kind === 'washNet' && z.x <= tx * 32 && z.x + z.w >= tx * 32).holes.filter(h => h[0] < tx).sort((a, b) => b[0] - a[0])[0];
      goTo(hole[0], hole[1]); press('jump'); sim(0.45); const face = grip() && grip().face;
      goTo(tx - 1, gate.clipY); press('action'); sim(0.3);
      return { shut0, stillShut, face, open: tile(tx, gate.clipY) === 0, gateOpen: gate.open };
    });
    check('26-1: the Peg Beetle\'s trousers wall off both faces; THROW from the near face does nothing', r.shut0 && r.stillShut, r);
    check('26-1: round the back through a torn square, THROW at his peg: the trousers drop, the way is open', r.face === 1 && r.open && r.gateOpen, r);
    await ev(() => { sim(0.4); freeze(); }); await shot('13-26-1-beetle-squeezed.png');
    await ev(() => { thaw(); const g = play('26-1'); place(150, 22); P().x = 150 * 32; P().y = 12 * 32; P().wash = null; sim(0.05); freeze(); });
    await ev(() => { thaw(); place(138, 22); sim(0.2); freeze(); }); await shot('14-26-1-beetle-wall.png');
    await ev(() => { thaw(); place(84, 22); sim(0.2); freeze(); }); await shot('15-26-1-tall-net.png');
    await ev(() => { thaw(); play('26-1'); }); await pano('pano-26-1.png', 0.3);
  });
  // room B1: up the tall net to its top corner, a jump onto the window ledge (the moth's peephole), the cupboard door
  await run('room1', async () => {
    await ev(ROOM_HELPERS);
    let r = await ev(() => {
      fresh(); play('26-1'); place(84, 22); sim(0.2);
      sim(0.4, { jump: true, jumpPressed: true, up: true, right: true });
      goNet(86, 6); const g1 = grip();
      sim(0.45, { jump: true, jumpPressed: true, left: true }); sim(0.8, { left: true }); sim(0.4);
      return { g1, at: at() };
    });
    check('26-1 B1: up the tall net to its top corner, a jump onto the high window ledge (only the net reaches it)', !!r.g1 && r.at.y === 4 && r.at.x >= 77 && r.at.x <= 83, r);
    await ev(() => { walkTo(81 * 32 + 16); freeze(); }); await shot('16-26-1-room-ledge-peephole.png');
    r = await ev(() => { thaw(); walkTo(78 * 32 + 16); const a0 = at(); const cx = P().cx; sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); return { a0, cx, area: S().area.aid, kind: kit() && kit().kind }; });
    check('26-1 B1: UP at the cupboard door on the ledge goes into the room', r.area === 'basket' && r.kind === 'washCups', r);
    await roomGame({ ev, shot }, '17-26-1-room-cup-with-a-limp',
      "waitPhase('pick'); const R = room(); hopOn(kit().data.slots[R.at.indexOf((R.sock + 1) % 3)]);",
      "waitPhase('pick'); const R = room(); hopOn(kit().data.slots[R.at.indexOf(R.sock)]); waitPhase('show', 3);", 2);
    r = await ev(() => leave());
    check('26-1 B1: the room\'s laundry chute lets Brady out further along the roofs (not where he came in)', r && r.area === 'roofs' && r.x >= 125, r);
  });
};

/* ---------------- 26-2 Cold Wash Only: the sweaters ---------------- */
STAGES.cold = async ({ ev, shot, run, pano }) => {
  await run('cold', async () => {
    await ev(ROOM_HELPERS);
    await ev(() => { fresh(); play('26-2'); place(8, 20); sim(0.3); freeze(); }); await shot('20-26-2-start.png');
    // the teach: straight off the roof onto the sweater, along it (the sleeve stretches ahead), off the cuff
    let r = await ev(() => {
      thaw(); place(18, 20); sim(0.2); const sw = ents('WashSweater').find(e => e.tx0 === 21), p = P();
      for (let k = 0; k < 600 && p.cx < (sw.tx1 + 1) * 32 + 8; k++) sim(1 / 120, { right: true });
      const len = sw.len[1];
      for (let k = 0; k < 600 && p.cx < (sw.tx1 + len) * 32 + 4; k++) sim(1 / 120, { right: true });
      sim(0.6, { right: true, jump: true, jumpPressed: true }); sim(0.6, { right: true }); sim(0.3);
      return { len, at: at() };
    });
    check('26-2: walking along the sweater stretches the sleeve ahead (two tiles a tile); off the cuff onto the next roof', r.len >= 8 && r.at.x >= 35 && r.at.y === 20 && !r.at.dead, r);
    await ev(() => { place(19, 20); sim(0.1); const p = P(); for (let k = 0; k < 120; k++) sim(1 / 120, { right: true }); freeze(); }); await shot('21-26-2-sleeve-stretching.png');
    // the twist: down the hole onto the RIGHT shoulder of the short-sleeved sweater; from there the sleeve is too
    // short; back to the left shoulder, then the whole run: it reaches the roof
    r = await ev(() => {
      thaw(); place(168, 10); sim(0.2); const p = P(); const sw = ents('WashSweater').find(e => e.max[1] === 7);
      for (let k = 0; k < 300 && p.cx < 170.5 * 32; k++) sim(1 / 120, { right: true }); sim(0.8);
      const landed = at();
      for (let k = 0; k < 200 && Math.floor(p.cx / 32) <= sw.tx1; k++) sim(1 / 120, { right: true }); const short = sw.len[1]; sim(0.05);
      walkTo(sw.tx1 * 32 + 16); sim(1.2);   // back on the body; the short stretch springs back off the sweater only
      walkTo(sw.tx0 * 32 + 12); sim(0.3);
      for (let k = 0; k < 600 && p.cx < 179 * 32; k++) sim(1 / 120, { right: true });
      sim(0.3); return { landed, short, full: sw.len[1], at: at() };
    });
    check('26-2: the twist: dropped on the right shoulder, the short sleeve comes up short; from the left shoulder it reaches the roof', r.landed.x >= 169 && r.landed.y === 14 && r.short < 6 && r.full >= 6 && r.at.x >= 179 && r.at.y === 14 && !r.at.dead, r);
    await ev(() => freeze()); await shot('22-26-2-short-sleeve.png');
    // room B2: the gap with the hanky over it is a soft drop into the launderette
    await ev(() => { thaw(); place(94, 18); sim(0.3); freeze(); }); await shot('23-26-2-room-hanky-gap.png');
    r = await ev(() => { thaw(); const p = P(); for (let k = 0; k < 120 && S().area.aid === 'tub'; k++) sim(1 / 120, { right: true }); for (let k = 0; k < 600 && S().area.aid === 'tub'; k++) sim(1 / 120); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); return { area: S().area.aid, dead: P().dead }; });
    check('26-2 B2: the gap by the hanky drops into the launderette (not a fall)', r.area === 'launder' && !r.dead, r);
    await roomGame({ ev, shot }, '24-26-2-room-room-with-a-view',
      "waitPhase('pick'); const R = room(); hopOn(kit().data.slots[R.pics.findIndex(v => v !== R.order[0])]);",
      "waitPhase('pick'); const R = room(); for (let i = 0; i < 3 && !R.won; i++) hopOn(kit().data.slots[R.pics.indexOf(R.order[R.got])]);", 1);
    r = await ev(() => leave());
    check('26-2 B2: the launderette\'s door lets Brady out further along the roofs', r && r.area === 'tub' && r.x >= 105, r);
    await ev(() => { thaw(); play('26-2'); }); await pano('pano-26-2.png', 0.3);
  });
};

/* ---------------- 26-3 Loose End: the seams ---------------- */
STAGES.loose = async ({ ev, shot, run, pano }) => {
  await run('loose', async () => {
    await ev(ROOM_HELPERS);
    let r = await ev(() => {
      fresh(); play('26-3'); place(18, 20); sim(0.3); const p = P(), sm = ents('WashSeam').find(e => e.tx === 18);
      press('action'); for (let k = 0; k < 900 && p.cx < 30 * 32; k++) sim(1 / 120, { action: true, right: true });
      sim(0.3); return { n: sm.n, of: sm.cells.length, at: at() };
    });
    check('26-3: hold THROW by the loose thread and walk: the seam unzips into floor across the gap', r.n === r.of && r.at.x >= 29 && r.at.y === 20 && !r.at.dead, r);
    await ev(() => { place(16, 20); const sm = ents('WashSeam')[0]; freeze(); }); await shot('30-26-3-unzipped.png');
    // the hem that steps up: jump the steps while still holding the thread
    r = await ev(() => {
      thaw(); place(95, 20); sim(0.3); const p = P();
      press('action'); for (let k = 0; k < 1200 && p.cx < 109 * 32; k++) { const hop = p.onGround && p.hitWall; sim(hop ? 0.25 : 1 / 120, { action: true, right: true, jump: hop, jumpPressed: hop }); }
      sim(0.3); return { at: at() };
    });
    check('26-3: a hem that rises: jump each step holding THROW, up onto the ledge', r.at.x >= 108 && r.at.y === 17 && !r.at.dead, r);
    await ev(() => { place(100, 19); freeze(); }); await shot('31-26-3-rising-hem.png');
    // the peg jaws gape and rattle before they snap
    await ev(() => { thaw(); place(55, 20); const j = ents('WashJaws')[0]; for (let k = 0; k < 600 && j.cyc()[0] !== 'tell'; k++) sim(1 / 120); sim(0.3); freeze(); }); await shot('32-26-3-peg-jaws-tell.png');
    // the last hem: the navy thread under his feet drops him to the retry ledge; back up, the red one across
    r = await ev(() => {
      thaw(); place(174, 17); sim(0.3); const p = P();
      press('action'); sim(1.0); const dropped = at();
      walkTo(173 * 32 + 16, 6); sim(0.4, { jump: true, jumpPressed: true }); sim(0.3);
      sim(1 / 120, { jump: true, jumpPressed: true, right: true }); for (let k = 0; k < 120; k++) sim(1 / 120, { jump: true, right: p.cx < 175.7 * 32 }); sim(0.4); walkTo(176 * 32 + 16, 6); const back = at();
      press('action'); for (let k = 0; k < 900 && p.cx < 190 * 32; k++) sim(1 / 120, { action: true, right: true });
      sim(0.3); return { dropped, back, at: at() };
    });
    check('26-3: the last hem: the navy thread under his feet drops him to the retry ledge; back up, the red one unzips the bridge', r.dropped.y === 22 && r.back.x === 176 && r.back.y === 17 && r.at.x >= 189 && r.at.y === 17 && !r.at.dead, r);
    // room B3: walk into the chimney's painted side
    await ev(() => { place(114, 17); sim(0.3); freeze(); }); await shot('33-26-3-room-chimney.png');
    r = await ev(() => { thaw(); place(117, 17); sim(0.2); walkTo(121 * 32 + 16, 6); sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); return { area: S().area.aid }; });
    check('26-3 B3: the chimney\'s side is only painted cloth: walk through it, the cupboard door inside', r.area === 'loft', r);
    await roomGame({ ev, shot }, '34-26-3-room-one-more-peg',
      "waitPhase('pick'); const R = room(); hopOn(kit().data.slots[[0, 1, 2, 3, 4, 5].find(k => k !== R.newer)]);",
      "waitPhase('pick'); hopOn(kit().data.slots[room().newer]);", 3);
    r = await ev(() => leave());
    check('26-3 B3: the peg loft lets Brady out further along', r && r.area === 'hem' && r.x >= 126, r);
    await ev(() => { thaw(); play('26-3'); }); await pano('pano-26-3.png', 0.3);
  });
};

/* ---------------- 26-4 The Cling Section: wool and felt ---------------- */
STAGES.cling = async ({ ev, shot, run, pano }) => {
  await run('cling', async () => {
    await ev(ROOM_HELPERS);
    await ev(() => { window.scuff = (x0, x1) => { for (let n = 0; n < 6; n++) { walkTo(x1 * 32 + 16, 12); walkTo(x0 * 32 + 16, 12); } }; });
    let r = await ev(() => {
      fresh(); play('26-4'); place(20, 22); sim(0.3); const p = P();
      scuff(17, 23); const charge = p.wash && p.wash.charge;
      walkTo(24 * 32 + 14, 6); sim(0.7, { right: true, jump: true, jumpPressed: true }); const s1 = !!(p.wash && p.wash.stick);
      sim(0.15); sim(0.7, { jump: true, jumpPressed: true, right: true }); const s2 = !!(p.wash && p.wash.stick);
      sim(0.1); sim(0.7, { jump: true, jumpPressed: true, right: true }); sim(0.4);
      return { charge, s1, s2, at: at() };
    });
    check('26-4: scuff the wool (the socks crackle), leap at the felt: stick; spring up, stick again; up onto the wall', r.charge === 2 && r.s1 && r.s2 && r.at.y === 12 && r.at.x >= 25 && r.at.x <= 28, r);
    await ev(() => { place(21, 22); scuff(18, 23); walkTo(24 * 32 + 14, 6); sim(0.7, { right: true, jump: true, jumpPressed: true }); freeze(); }); await shot('40-26-4-stuck-on-felt.png');
    // the label: it doesn't hold
    r = await ev(() => { thaw(); place(30, 22); sim(0.2); const p = P(); p.x = 79 * 32 + 16 - p.w / 2; p.y = 18.85 * 32 - p.h; p.vy = 0; if (p.wash) { p.wash.charge = 2; p.wash.stick = null; } sim(0.06, { right: true }); return { stuck: !!(p.wash && p.wash.stick) }; });
    check('26-4: a bare white washing label does not hold', !r.stuck, r);
    // the last climb: stick, spring to the wool sill, a fresh charge, the last felt, the top
    r = await ev(() => {
      thaw(); place(124, 22); sim(0.3); const p = P();
      scuff(122, 126); walkTo(127 * 32 + 14, 6); sim(0.7, { right: true, jump: true, jumpPressed: true }); const s1 = !!(p.wash && p.wash.stick);
      sim(0.1); sim(0.9, { jump: true, jumpPressed: true, left: true }); sim(0.3); const sill = at();
      const kill = []; const od = p.die; p.die = function (...a) { kill.push([at(), String(a[0]), S().entities.filter(e => !e.remove && Math.abs(e.cx - p.cx) < 90 && Math.abs(e.cy - p.cy) < 90).map(e => e.constructor.name + ':' + (e.type || ''))]); return od.apply(this, a); }; scuff(121, 124); const sc = [at(), p.wash && p.wash.charge, kill]; walkTo(124 * 32 + 20, 6); const w2 = at(); sim(0.75, { right: true, jump: true, jumpPressed: true }); const s2 = !!(p.wash && p.wash.stick); const j2 = at();
      sim(0.1); sim(0.7, { jump: true, jumpPressed: true, right: true }); sim(0.3);
      return { s1, sill, sc, w2, s2, j2, at: at() };
    });
    check('26-4: the twist: out of sparks halfway, down to the wool sill for a fresh charge, then the last felt and the top', r.s1 && r.sill.y === 15 && r.s2 && r.at.y === 9 && r.at.x >= 128 && r.at.x <= 135, r);
    await ev(() => freeze()); await shot('41-26-4-the-last-climb.png');
    // room B4: from the rug on the wall's top, leap at the hanging felt block, hop up to the window ledge
    r = await ev(() => {
      thaw(); place(81, 10); sim(0.3); const p = P();
      scuff(80, 82); walkTo(82 * 32 + 20, 6); sim(0.8, { right: true, jump: true, jumpPressed: true }); const s1 = !!(p.wash && p.wash.stick);
      sim(0.1); sim(0.8, { jump: true, jumpPressed: true, left: true }); sim(0.3); return { s1, at: at() };
    });
    check('26-4 B4: from the rug on the wall\'s top, stick to the hanging felt and hop up to the window ledge (only the felt reaches it)', r.s1 && r.at.y === 4 && r.at.x >= 78 && r.at.x <= 82, r);
    await ev(() => freeze()); await shot('42-26-4-room-window-ledge.png');
    r = await ev(() => { thaw(); walkTo(80 * 32 + 16, 6); sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); return { area: S().area.aid }; });
    check('26-4 B4: the window door goes into lost property', r.area === 'lost', r);
    await roomGame({ ev, shot }, '43-26-4-room-still-packed',
      "waitPhase('pick'); const R = room(); hopOn(kit().data.slots[(R.answer + 1) % 4]);",
      "waitPhase('pick'); hopOn(kit().data.slots[room().answer]);", 2);
    r = await ev(() => leave());
    check('26-4 B4: lost property lets Brady out further along', r && r.area === 'lint' && r.x >= 100, r);
    await ev(() => { thaw(); play('26-4'); }); await pano('pano-26-4.png', 0.3);
  });
};

/* ---------------- 26-5 Pocket Address: the pockets ---------------- */
STAGES.pockets = async ({ ev, shot, run, pano }) => {
  await run('pockets', async () => {
    await ev(ROOM_HELPERS);
    await ev(() => { window.intoPocket = x => { if (!tile(x, 21)) { for (let k = 0; k < 1200 && P().state === 'play' && !(S().fade.a > 0.05); k++) sim(1 / 120, { right: P().cx < x * 32 + 20, left: P().cx > x * 32 + 44 }); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); sim(0.3); return at(); } walkTo((x - 2) * 32 + 16, 6); sim(0.55, { jump: true, jumpPressed: true, right: true }); sim(0.4); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); sim(0.3); return at(); }; });
    let r = await ev(() => { fresh(); play('26-5'); place(10, 20); sim(0.3); return intoPocket(16); });
    check('26-5: jump into a pocket: out of the one with the same lining (up on the high shelf)', r.x >= 39 && r.x <= 43 && r.y === 8, r);
    await ev(() => { place(14, 20); const pk = ents('WashPocketSpot').filter(e => e.main)[0]; pk.t = 3.4 - pk.ph + 0.45; sim(0.01); freeze(); }); await shot('50-26-5-pocket-lip-open.png');
    // the wrong pocket: the sock heap in the basin, the way back
    r = await ev(() => { thaw(); place(53, 20); sim(0.3); const a = intoPocket(56); sim(1.5); const b = at(); place(85, 20); sim(0.3); const c = intoPocket(90); sim(1.0); const c2 = at(); return { a, b, c, c2 }; });
    check('26-5: a wrong pocket (mint) puts Brady on a shelf over the basin of socks; the sock pocket down there brings him back', r.a.y === 7 && r.b.y === 7 && r.c.x <= 50, r);
    r = await ev(() => { sim(1.0); place(59, 20); sim(0.5); const pre = [at(), P().state, S().fade.a, tile(61, 21), tile(61, 22), tile(61, 23)]; const a = intoPocket(61); walkTo(99.5 * 32, 6); for (let k = 0; k < 200; k++) sim(1 / 120, { right: true }); sim(0.8); return { pre, a, at: at() }; });
    check('26-5: the pocket with the right lining: up on the high shelf and over the wall', r.a.y === 6 && r.at.x >= 101 && r.at.y === 20, r);
    await ev(() => freeze()); await shot('51-26-5-the-way-on.png');
    // room B5: the gold-lined pocket
    r = await ev(() => { thaw(); place(117, 20); sim(0.3); freeze(); return 1; }); await shot('52-26-5-room-gold-pocket.png');
    r = await ev(() => { thaw(); place(118, 17); sim(0.3); for (let k = 0; k < 140; k++) sim(1 / 120, { jump: k < 70, jumpPressed: k === 0, right: P().cx < 122.9 * 32 }); sim(0.3); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); sim(0.3); return { area: S().area.aid }; });
    check('26-5 B5: the gold-lined pocket by the hanky opens into the drying room', r.area === 'drying', r);
    await roomGame({ ev, shot }, '53-26-5-room-your-seat-sir',
      "waitPhase('seat'); const R = room(); const m = R.queue[R.qi]; hopOn(kit().data.slots[(R.seat[m] + 1) % 4]);",
      "waitPhase('seat'); const R = room(); for (let i = 0; i < 3 && !R.won; i++) hopOn(kit().data.slots[R.seat[R.queue[R.qi]]]);", 1);
    r = await ev(() => leave());
    check('26-5 B5: the drying room lets Brady out further along', r && r.area === 'pockets' && r.x >= 128, r);
    // the twist: two mint pockets; the scalloped one goes on
    r = await ev(() => { place(144, 20); sim(0.3); const a = intoPocket(146); walkTo(163.5 * 32, 6); for (let k = 0; k < 200; k++) sim(1 / 120, { right: true }); sim(0.8); return { a, at: at() }; });
    check('26-5: the twist: of the two mint pockets, the scalloped one comes out on the shelf over the last wall', r.a.y === 9 && r.at.x >= 165 && r.at.y === 20, r);
    await ev(() => { thaw(); play('26-5'); }); await pano('pano-26-5.png', 0.3);
  });
};

/* ---------------- 26-6 Fitted Sheet for One: the lead-in, the Sock Divorce, the bed ---------------- */
STAGES.bed = async ({ ev, shot, run, pano }) => {
  await run('bed', async () => {
    await ev(ROOM_HELPERS);
    let r = await ev(() => {
      fresh(); play('26-6'); place(4, 15); sim(0.3); const p = P(); const sh = ents('WashLooseSheet').sort((a, b) => a.x - b.x)[0];
      walkTo(13 * 32 + 16, 6); let aim = 0;
      for (let k = 0; k < 120 * 8 && !sh.open; k++) { if (sh.state === 'aim') aim = Math.max(aim, sh.st); if (sh.state === 'aim' && sh.st > 0.84 && p.onGround) sim(0.5, { jump: true, jumpPressed: true }); else sim(1 / 120); }
      sim(0.6);
      return { aim: +aim.toFixed(2), open: sh.open, tile: tile(16, 15) };
    });
    check('26-6: a loose sheet\'s corner aims (a tell), snaps: jumped in front of the post, it hooks the post and the way opens', r.aim >= 0.5 && r.open && r.tile === 0, r);
    await ev(() => { place(19, 15); sim(0.1); const sh = ents('WashLooseSheet')[1]; freeze(); }); await shot('60-26-6-loose-sheet.png');
    // room: up through the hole in the shelf, along the top shelf (jaws), the sock drawer
    r = await ev(() => { thaw(); place(26, 14); sim(0.3); sim(0.2, { jump: true, jumpPressed: true }); sim(0.4, { jump: true, right: true }); sim(0.4); const a = at(); return a; });
    check('26-6 Sock Divorce: off the crate, up through the hole in the shelf by the hanky, onto the top shelf', r.y === 11, r);
    await ev(() => { walkTo(40 * 32, 8); freeze(); }); await shot('61-26-6-top-shelf.png');
    r = await ev(() => { thaw(); P().invuln = 999; walkTo(64 * 32 + 16, 6); sim(0.1, { up: true, upPressed: true });  for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); return { area: S().area.aid }; });
    check('26-6 Sock Divorce: the sock drawer at the shelf\'s end', r.area === 'drawer', r);
    await ev(() => { sim(0.7); freeze(); }); await shot('62-26-6-room-sock-divorce-entry.png');
    r = await ev(() => {
      thaw(); const R = room(), K = kit(), p = P(), cuffX = (K.data.post + 1) * 32 + 8;
      const take = () => { walkTo(cuffX, 6); press('action'); };
      // a miss: let go before they peel
      take(); sim(0.4, { action: true, right: true }); sim(0.2); const f1 = R.fails || 0;
      sim(0.8);
      // the win: hold on, walk away until they peel, let go before the toe mark
      for (let n = 0; n < 2 && !R.won; n++) { take(); for (let k = 0; k < 900 && !R.peeled; k++) sim(1 / 120, { action: true, right: true }); sim(0.15, { action: true }); sim(0.4); }
      sim(1.0); return { f1, won: R.won, cage: cageOpen() };
    });
    check('26-6 Sock Divorce: letting go too soon is a miss (no harm); held till they peel and let go before the toe: won, the cage opens', r.f1 >= 1 && r.won && r.cage, r);
    await ev(() => freeze()); await shot('63-26-6-room-sock-divorce-won.png'); await ev(() => thaw());
    r = await ev(() => leave());
    check('26-6 Sock Divorce: the drawer lets Brady out by the bedroom door (further along)', r && r.area === 'cupboard' && r.x >= 60, r);
    r = await ev(() => { const p = P(); walkTo(72 * 32 + 16, 6); sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); walkTo(P().cx + 6 * 32, 8); sim(2.5); return { area: S().area.aid, boss: !!S().boss }; });
    check('26-6: the bedroom door; the bed; Her Fitted Majesty wakes', r.area === 'bed' && r.boss, r);
    await ev(() => { sim(1.5); freeze(); }); await shot('64-26-6-boss-her-fitted-majesty.png');
    await ev(() => { thaw(); play('26-6'); }); await pano('pano-26-6.png', 0.3);
  });
};

/* ---------------- --bot: each stage start to finish, enemies ON, damage ON, the way a careful player would ---------------- */
// The bot holds only the stick and the two buttons. It walks on, hops gaps and walls, jumps critters in its way,
// waits for a net critter on its face to move off, and does each stage's thing (grip and climb, squeeze through,
// squeeze the peg, stretch, unzip, scuff and leap, pockets, the sheets, the boss). A death is counted where it
// happens; it then carries on from the checkpoint (the route rewinds to the step after the last checkpoint marker).
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
  const solid = (x, y) => { const t = tileAt(x, y); return t === 99 || (window.BRADY_TOUR.washKit.SOLID[t]); };
  T.solid = solid;
  // walk to pixel x (careful: hop gaps and walls, jump a critter that comes at him)
  T.walk = (x, o) => {
    o = o || {};
    for (let k = 0; k < 120 * 25; k++) {
      const q = p(); if (Math.abs(q.cx - x) < (o.tol || 8) && q.onGround) return true;
      const dir = q.cx < x ? 1 : -1, tx = Math.floor((q.cx + dir * 20) / 32), fy = Math.floor((q.y + q.h + 4) / 32);
      let jump = false;
      if (q.onGround) {
        const gapAhead = !solid(tx, fy) && !solid(tx, fy + 1) && tileAt(tx, fy) !== 2;
        const wall = solid(Math.floor((q.cx + dir * 18) / 32), fy - 1);
        const crit = S().entities.some(e => e.enemy && !e.dead && !e.remove && !e.boss && !e.isWashCrawler && (e.cx - q.cx) * dir > 0 && Math.abs(e.cx - q.cx) < 90 && Math.abs((e.y + e.h) - (q.y + q.h)) < 40);
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
  T.grip = (dir) => { if (!T.f({ jump: true, jumpPressed: true, up: true, right: dir > 0, left: dir < 0 })) return false; for (let k = 0; k < 60 && !(p().wash && p().wash.grip); k++) if (!T.f({ up: true, jump: true, right: dir > 0, left: dir < 0 })) return false; return !!(p().wash && p().wash.grip); };
  // climb to a cell (grip row y): wait while a critter on his face is close in the way
  T.climb = (x, y) => {
    for (let k = 0; k < 120 * 30; k++) {
      const q = p(), W = q.wash; if (!W || !W.grip) return 'lost grip';
      const gx = x * 32 + 16, gy = y * 32 + 16, dx = gx - q.cx, dy = gy - (q.y + 8);
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return true;
      const mine = S().entities.filter(e => e.isWashCrawler && !e.dead && e.face === W.face);
      const close = mine.find(e => Math.hypot(e.cx - q.cx, e.cy - q.cy) < 62);
      const near = mine.some(e => Math.hypot(e.cx - (q.cx + Math.sign(dx) * 30), e.cy - (q.cy + Math.sign(dy) * 30)) < 50);
      // a critter on his face coming at him: back off along the net, the way a careful player would
      let inp = near ? {} : { right: dx > 4, left: dx < -4, down: dy > 4 && Math.abs(dx) < 20, up: dy < -4 && Math.abs(dx) < 20 };
      if (close) { const ex = q.cx - close.cx, ey = q.cy - close.cy; inp = Math.abs(ex) > Math.abs(ey) ? { right: ex > 0, left: ex < 0 } : { down: ey > 0, up: ey < 0 }; }
      if (!T.f(inp)) return false;
    }
    return 'stuck';
  };
  T.cross = () => { const f0 = p().wash.face; if (!T.f({ jump: true, jumpPressed: true })) return false; T.wait(0.45); return p().wash && p().wash.face !== f0; };
  T.letGo = dir => T.hop(dir, false, 0.5);
  T.press = k => T.f({ [k]: true, [k + 'Pressed']: true });
  T.holdThrow = (x) => { if (!T.press('action')) return false; for (let k = 0; k < 120 * 15; k++) { const q = p(); if (q.cx >= x) return true; const hop = q.onGround && q.hitWall;
      // peg jaws over the seam: wait (still holding) while the ones just ahead gape or snap
      const jaw = S().entities.find(e => e.constructor.name === 'WashJaws' && e.cx - q.cx > 22 && e.cx - q.cx < 84 && e.cyc()[0] !== 'open'); if (jaw && !hop) { if (!T.f({ action: true })) return false; continue; } if (!(hop ? T.f({ action: true, right: true, jump: true, jumpPressed: true }) : T.f({ action: true, right: true }))) return false; if (hop) for (let j = 0; j < 25; j++) if (!T.f({ action: true, right: true, jump: true })) return false; } return 'stuck'; };
  T.scuff = (x0, x1) => { for (let n = 0; n < 4; n++) { if (!T.walk(x1 * 32 + 16, { noHop: true, tol: 12 })) return false; if (!T.walk(x0 * 32 + 16, { noHop: true, tol: 12 })) return false; } return true; };
  T.leap = (dir, hold) => { if (!T.f({ jump: true, jumpPressed: true, right: dir > 0, left: dir < 0 })) return false; for (let k = 0; k < 120 * 1.5 && !(p().wash && p().wash.stick) && !(k > 20 && p().onGround); k++) if (!T.f({ jump: k < (hold || 0.5) * 120, right: dir > 0, left: dir < 0 })) return false; return !!(p().wash && p().wash.stick); };
  T.pocket = x => { const sunk = !tileAt(x, 21); if (sunk) { for (let k = 0; k < 1200 && p().state === 'play' && !(S().fade.a > 0.05); k++) if (!T.f({ right: p().cx < x * 32 + 20, left: p().cx > x * 32 + 44 })) return false; } else { if (!T.walk((x - 2) * 32 + 16, { noHop: true })) return false; if (!T.hop(1, false, 0.5)) return false; } for (let k = 0; k < 600 && (S().fade.a > 0.05 || p().state !== 'play'); k++) sim(1 / 120); return T.wait(0.3); };
  T.sheet = () => { const sh = S().entities.filter(e => e.constructor.name === 'WashLooseSheet' && !e.open).sort((a, b) => Math.abs(a.cx - p().cx) - Math.abs(b.cx - p().cx))[0]; if (!sh) return true; for (let k = 0; k < 120 * 6 && !(sh.state === 'aim' && sh.st > 0.84) && !sh.open; k++) if (!T.f()) return false; if (!T.hop(0, false, 0.5)) return false; return T.wait(0.6) && sh.open; };
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
const BOT_ROUTES = {
  '26-1': [['walk', 19 * 32], ['grip', 1], ['climb', 31, 17], ['letGo', 1], 'cp', ['walk', 53 * 32 + 8], ['grip', 1], ['climb', 55, 15], ['climb', 57, 15], ['cross'], ['climb', 66, 15], ['cross'], ['climb', 70, 14], ['letGo', 1], 'cp',
    ['walk', 84 * 32 + 16], ['grip', 1], ['climb', 86, 12], ['climb', 100, 12], ['letGo', 1], 'cp', ['walk', 140 * 32 + 8], ['grip', 1], ['climb', 143, 14], ['climb', 147, 14], ['cross'], ['climb', 155, 9], ['press', 'action'], ['wait', 0.6],
    ['climb', 167, 12], ['letGo', 1], 'cp', ['walk', 186 * 32 + 8], ['grip', 1], ['climb', 189, 12], ['climb', 192, 12], ['cross'], ['climb', 201, 9], ['press', 'action'], ['wait', 0.6], ['climb', 214, 13], ['letGo', 1], 'cp', ['walk', 234 * 32]],
  '26-2': [['walk', 18 * 32], ['walk', 26 * 32 + 16, { noHop: true }], ['walk', 34 * 32, { noHop: true }], ['hop', 1], 'cp', ['walk', 56 * 32], ['walk', 60 * 32 + 16, { noHop: true }], ['hopTo', 63, 0.35], ['walk', 62 * 32 + 12, { noHop: true }], ['walk', 76 * 32, { noHop: true }], ['hop', 1], 'cp', ['walk', 110 * 32], ['walk', 115 * 32 + 16, { noHop: true }], ['hopTo', 118, 0.35], ['walk', 117 * 32 + 12, { noHop: true }],
    ['walk', 129 * 32, { noHop: true }], ['hop', 1], ['walk', 132 * 32 + 12, { noHop: true }], ['walk', 145 * 32, { noHop: true }], ['hop', 1], 'cp', ['walk', 165 * 32], ['walk', 170 * 32 + 20, { noHop: true }], ['wait', 1], ['walk', 167 * 32 + 12, { noHop: true }], ['walk', 182 * 32, { noHop: true }], 'cp', ['walk', 215 * 32]],
  '26-3': [['walk', 18 * 32 + 16, { noHop: true }], ['holdThrow', 30 * 32], 'cp', ['walk', 55 * 32 + 16, { noHop: true }], ['holdThrow', 69 * 32], 'cp', ['walk', 95 * 32 + 16, { noHop: true }], ['holdThrow', 109 * 32], 'cp', ['walk', 115 * 32, { noHop: true }], ['hopTo', 116, 0.5], ['hopTo', 121, 0.5, 0.15], ['walk', 140 * 32 + 16, { noHop: true }], ['holdThrow', 156 * 32], 'cp',
    ['walk', 172 * 32], ['walk', 176 * 32 + 16, { noHop: true }], ['holdThrow', 190 * 32], 'cp', ['walk', 208 * 32]],
  '26-4': [['walk', 20 * 32], ['scuff', 17, 23], ['walk', 24 * 32 + 14, { noHop: true }], ['leap', 1], ['leap', 1], ['hop', 1, false, 0.6], ['walk', 33 * 32], 'cp', ['walk', 46 * 32], ['scuff', 45, 49], ['walk', 50 * 32 + 20, { noHop: true }], ['leap', 1], ['leap', 1], ['hop', 1, false, 0.6], ['walk', 62 * 32], 'cp',
    ['walk', 75 * 32], ['scuff', 74, 78], ['walk', 79 * 32 + 14, { noHop: true }], ['leap', 1], ['leap', 1], ['hopTo', 81, 0.6], ['walk', 98 * 32, { noHop: true }], 'cp', ['walk', 124 * 32], ['scuff', 122, 126], ['walk', 127 * 32 + 14, { noHop: true }], ['leap', 1], ['hop', -1, false, 0.5], ['scuff', 121, 124], ['walk', 124 * 32 + 20, { noHop: true }], ['leap', 1], ['hop', 1, false, 0.6], 'cp', ['walk', 183 * 32]],
  '26-5': [['pocket', 16], ['walk', 47 * 32 + 16, { noHop: true }], 'cp', ['walk', 48 * 32 + 20, { noHop: true }], ['hopTo', 53, 0.4], ['walk', 54 * 32 + 20, { noHop: true }], ['hopTo', 59, 0.45], ['pocket', 61], ['walk', 99.5 * 32, { noHop: true }], ['walk', 104 * 32], 'cp', ['walk', 117 * 32, { noHop: true }], ['hopTo', 120, 0.5], ['walk', 139 * 32 + 16, { noHop: true }], ['hopTo', 144, 0.4], ['pocket', 146], ['walk', 163.5 * 32, { noHop: true }], ['walk', 172 * 32], 'cp', ['walk', 193 * 32]],
  '26-6': [['walk', 13 * 32 + 16], ['sheet'], ['walk', 39 * 32 + 16], ['sheet'], ['walk', 56 * 32], 'cp', ['walk', 72 * 32 + 16], ['door'], ['bossFight'], ['gate']]
};
// the boss, damage on: the land's trick each phase (stand before a free post and jump the arrow; duck the wide ring
// and jump the low one; into the pocket and jump on the shake)
const BOT_BOSS = () => {
  const T = window.BOT, p = () => S().player;
  T.bossFight = () => {
    const boss = () => S().entities.find(e => e.boss && !e.remove);
    for (let k = 0; k < 120 * 6 && !(boss() && boss().posts); k++) if (!T.f({ right: p().cx < 6 * 32 })) return false;
    for (let guard = 0; guard < 120 * 150; guard++) {
      const b = boss(); if (!b || b.state === 'dying') return T.wait(3) && true;
      if (!b.posts) { if (!T.f()) return false; continue; }
      const q = p(), free = b.posts.filter(x => !x.hooked);
      let target = null, inp = {};
      if (b.phase === 1 || b.phase == null) { const L = free.filter(x => x.x < b.cx); const post = (L.length ? L : free).sort((a, c) => Math.abs(a.x - b.cx) - Math.abs(c.x - b.cx))[0]; if (post) target = post.x + (post.x < b.cx ? 64 : -64); if (b.act === 'aim' && b.at > 0.7 && q.onGround) inp = { jump: true, jumpPressed: true }; else if (b.act === 'snap' || b.act === 'aim' && b.at > 0.7) inp = { jump: true }; }
      else if (b.phase === 2) {
        const post = free.sort((a, c) => Math.abs(a.x - b.cx) - Math.abs(c.x - b.cx))[0]; if (post) target = post.x + (post.x < b.cx ? 64 : -64);
        if (b.act === 'sweep' && b.hoops) { const [wide, low] = b.hoops; const lowNear = low && !low.done && b.at >= low.go && Math.abs(low.x - q.cx) < 70, wideNear = wide && !wide.done && !wide.passed && b.at >= wide.go && Math.abs(wide.x - q.cx) < 90; target = null; inp = lowNear && q.onGround ? { jump: true, jumpPressed: true } : { down: wideNear && !lowNear, jump: !q.onGround }; }
      } else { if ((b.act === 'balloon' || b.act === 'shake') && b.pocket != null) target = b.pocket; if (b.act === 'shake' && q.onGround) inp = { jump: true, jumpPressed: true }; else if (b.act === 'balloon' && b.at > 1.55 && q.onGround && Math.abs(q.cx - b.pocket) < 20) inp = { jump: true, jumpPressed: true }; }
      if (target != null && !inp.jump && !inp.down && Math.abs(q.cx - target) > 10) { inp.right = q.cx < target; inp.left = q.cx > target; }
      if (!T.f(inp)) return false;
    }
    return 'stuck';
  };
};

/* ---------------- the secret rooms: shared moves ---------------- */
// in the page: walk on the stage to slot column x, then jump onto its top (real stick and JUMP)
const ROOM_HELPERS = () => {
  window.walkTo = (px, tol) => { const p = P(); tol = tol || 5; for (let k = 0; k < 900 && Math.abs(p.cx - px) > 24; k++) { const hop = p.onGround && p.hitWall; sim(hop ? 0.3 : 1 / 120, { right: p.cx < px, left: p.cx > px, jump: hop, jumpPressed: hop }); } sim(0.3); for (let k = 0; k < 80 && Math.abs(p.cx - px) > tol; k++) { sim(Math.abs(p.cx - px) > 14 ? 1 / 30 : 1 / 60, { right: p.cx < px, left: p.cx > px }); sim(0.1); } };
  window.hopOn = x => { walkTo(x * 32 + 16, 4); sim(0.25, { jump: true, jumpPressed: true }); sim(0.9); };
  window.room = () => S().area.roomState;
  window.kit = () => S().area.roomKit;
  window.waitPhase = (ph, sec) => { for (let k = 0; k < (sec || 20) * 120 && room().phase !== ph && !room().won; k++) sim(1 / 120); return room().phase; };
  window.cageOpen = () => { const c = S().entities.find(e => e.constructor.name === 'TourRoomCage'); return !!(c && c.open); };
  window.outDoor = () => S().entities.filter(e => e.constructor.name === 'Portal' && e.target && e.target.area !== S().area.idx)[0];
  window.leave = () => { const d = outDoor(); if (!d) return null; walkTo(d.cx, 6); sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); sim(0.3); return at(); };
  window.goNet = (x, y) => { const p = P(); for (let k = 0; k < 1200 && (Math.abs(p.cx - (x * 32 + 16)) > 6 || Math.abs(p.y + 8 - (y * 32 + 16)) > 6); k++) sim(1 / 120, { right: p.cx < x * 32 + 10, left: p.cx > x * 32 + 22, down: p.y + 8 < y * 32 + 10, up: p.y + 8 > y * 32 + 22 }); };
};
// a room's game played with real inputs: one miss (the wrong slot), then the win; screenshots on entry and won
async function roomGame({ ev, shot }, tag, pickWrong, pickRight, rounds) {
  await ev(ROOM_HELPERS);
  await ev(() => { sim(0.7); freeze(); }); await shot(tag + '-entry.png');
  let r = await ev(w => { thaw(); const R = room(); const f0 = R.fails || 0; (new Function(w))(); sim(0.4); return { fails: R.fails || 0, f0, won: R.won }; }, pickWrong);
  check(tag + ': a miss costs nothing: that turn starts again (no win)', r.fails === r.f0 + 1 && !r.won, r);
  r = await ev(([w, n]) => { for (let i = 0; i < n && !room().won; i++) { (new Function(w))(); sim(0.3); } sim(1.2); return { won: room().won, cage: cageOpen(), phase: room().phase }; }, [pickRight, rounds]);
  check(tag + ': won with real inputs; the prize cage opens at the win', r.won && r.cage, r);
  await ev(() => freeze()); await shot(tag + '-won.png'); await ev(() => thaw());
}

(async () => {
  if (args.includes('--bot')) {
    // the bot: every stage start to finish, enemies on, no invulnerability; deaths per stage and where
    await session({ width: 874, height: 402 }, async ({ ev }) => {
      await ev(BOT_PAGE); await ev(BOT_BOSS);
      for (const id of Object.keys(BOT_ROUTES)) {
        if (want.length && !want.includes(id)) continue;
        const r = await ev(([i, route]) => window.BOT.run(i, route), [id, BOT_ROUTES[id]]);
        const spots = {}; for (const d of r.deaths) { const k = d.x + ',' + d.y + ' ' + d.reason + (d.near && d.near.length ? ' (' + d.near.join('/') + ')' : ''); spots[k] = (spots[k] || 0) + 1; }
        console.log(`BOT ${id}: ${r.finished ? 'FINISHED' : 'DID NOT FINISH'}, ${r.deaths.length} death(s) ${JSON.stringify(spots)}${r.fails.length ? ' fails ' + r.fails.join(' ') : ''}`);
        if (args.includes('--trace')) console.log(JSON.stringify(r.trace));
        check(`bot ${id}: played start to finish (enemies on, damage on)`, r.finished, { deaths: r.deaths.length, spots, fails: r.fails });
      }
    });
    console.log(failures ? `${failures} WASH BOT CHECK(S) FAILED` : 'ALL WASH BOT CHECKS PASSED');
    process.exit(failures ? 1 : 0);
  }
  await session({ width: 874, height: 402 }, async (o) => {
    for (const k of Object.keys(STAGES)) await STAGES[k](o);
  });
  await session({ width: 402, height: 874 }, async ({ ev, shot, run }) => {
    await run('p-peg', async () => { await ev(() => { fresh(); play('26-1'); place(13, 22); sim(0.2); sim(0.35, { jump: true, jumpPressed: true, up: true }); sim(0.4, { up: true }); freeze(); }); await shot('90-portrait-26-1-net.png'); });
    await run('p-boss', async () => { await ev(() => { thaw(); fresh(); play('26-6'); const g = S(), k = areaOf(g, 'bed'), A = g.level.areas[k]; g.loadArea(k, A.anchors.in.x, A.anchors.in.y); P().invuln = 999; sim(0.2); const p = P(); for (let n = 0; n < 300; n++) sim(1 / 120, { right: true }); sim(2.8); freeze(); }); await shot('91-portrait-26-6-boss.png'); });
    await run('p-map', async () => { await ev(() => { thaw(); fresh(); const d = window.BRADY.Save.data; d.tour.lands.wash = true; d.unlocked['26-1'] = true; window.BRADY.goToMap('world', 1, '26-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } freeze(); }); await shot('92-portrait-wash-map.png'); });
  });
  console.log(failures ? `${failures} WASH CHECK(S) FAILED` : 'ALL WASH CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
