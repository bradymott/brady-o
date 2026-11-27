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
    window.place = (tx, ty) => { const g = S(), p = P(); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; if (p.wash) p.wash.grip = null; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
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
      return big.toDataURL('image/png');
    };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); if (checksOnly) return; await page.waitForTimeout(250); await page.screenshot({ path: path.join(out, name) }); };
  const pano = async (name, k) => { if (checksOnly) return; await pin(); const url = await page.evaluate(kk => { freeze(); const u = panorama(kk); thaw(); return u; }, k || 0.4); fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64')); };
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
};

(async () => {
  await session({ width: 874, height: 402 }, async (o) => {
    for (const k of Object.keys(STAGES)) await STAGES[k](o);
  });
  await session({ width: 402, height: 874 }, async ({ ev, shot, run }) => {
    await run('p-peg', async () => { await ev(() => { fresh(); play('26-1'); place(13, 22); sim(0.2); sim(0.35, { jump: true, jumpPressed: true, up: true }); sim(0.4, { up: true }); freeze(); }); await shot('90-portrait-26-1-net.png'); });
  });
  console.log(failures ? `${failures} WASH CHECK(S) FAILED` : 'ALL WASH CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
