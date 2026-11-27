// The Orchard After Closing (hidden land 28): screenshots and in-browser checks. The hidden entrance in Japan 11-3 (the
// last pear tree of the little orchard in the bamboo grove: one pear hangs from a rust-red tie instead of a stalk), the
// arrival, the land's map, each stage's mechanic played with real inputs (the stick and the two buttons through the
// game loop), each secret room (found, won once, failed once, left by its exit), the boss. Phone landscape (874x402
// @2x, the game's 844x390 view) and portrait (402x874). Silent. --bot plays every stage start to finish, enemies on,
// damage on, and reports deaths per stage.
// usage: BRADY_DIST=<dist> node tools/sbw_orch_shots.js <outdir> [--checks] [--bot] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'orch-shots'), checksOnly = args.includes('--checks');
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
    window.place = (tx, ty) => { const g = S(), p = P(); g.timeLeft = Math.max(g.timeLeft || 0, 300); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; p.orchTr = null; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.toArea = (aid, tx, ty) => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = A.anchors.in || A.anchors.start || Object.values(A.anchors)[0] || { x: 96, y: (A.H - 4) * 32 }; if (g.area.idx !== k) g.loadArea(k, an.x, an.y); P().invuln = 999; if (tx != null) place(tx, ty); };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } if (g.player) g.player.invuln = 999; };
    window.tile = (x, y) => { const A = S().area; return A.tiles[y * A.W + x]; };
    window.ents = name => S().entities.filter(e => e.constructor.name === name && !e.remove);
    window.grip = () => { const W = P().orchTr; return W && W.grip ? { face: W.face, x: Math.round(P().cx / 32), y: Math.floor((P().y + 8) / 32) } : null; };
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

/* ---------------- the hidden entrance: Japan 11-3, the last pear tree ---------------- */
STAGES.door = async ({ ev, shot, run }) => {
  await run('door', async () => {
    await ev(ROOM_HELPERS);
    let r = await ev(() => {
      fresh(); const T = window.BRADY_TOUR, st = T.Tour.stops.orch;
      return { hidden: T.TourMap.stopState(st) === 'hidden', unlocked: T.TourProgress.isUnlocked('28-1'), land: T.TourProgress.countryUnlocked(T.Tour.countries.orch), pips: T.TourProgress.exitsFound('11-3') };
    });
    check('before the entrance: the land is hidden on the route map, 28-1 is locked, 11-3\'s card shows no exit found yet', r.hidden && !r.unlocked && !r.land && r.pips.found === 0, r);
    r = await ev(() => {
      play('11-3'); const S0 = S(); const sp = S0.area.spawns ? null : null;
      // find the last tree's column from the level spec (it spawns when in view)
      const spn = S0.level.areas[0].spawns.find(q => q.type === 'orchJpTree'); window.__tree = { tx: spn.tx, gy: spn.gy };
      place(spn.tx - 14, spn.gy - 1); sim(0.4); return { tx: spn.tx, gy: spn.gy, at: at(), coinsNear: (() => { const A = S().area; let n = 0; for (let x = spn.tx - 12; x <= spn.tx + 6; x++) for (let y = 0; y < A.H; y++) if (A.tiles[y * A.W + x] === 5) n++; return n; })() };
    });
    check('11-3: the little pear orchard stands by the path in the sunlit stretch (no coins leading to it)', r.tx > 0 && !r.at.dead, r);
    await ev(() => { const { tx, gy } = window.__tree; place(tx - 9, gy - 1); sim(0.3); freeze(); });
    await shot('00-entrance-11-3-the-orchard.png');
    await ev(() => { thaw(); const { tx, gy } = window.__tree; place(tx - 4, gy - 1); sim(0.3); freeze(); });
    await shot('01-entrance-11-3-before-the-clue.png');
    // walking past does nothing; behind the trunk, a jump straight up into the fork's underside
    r = await ev(() => {
      thaw(); const { tx, gy } = window.__tree, p = P(); place(tx - 6, gy - 1); sim(0.2);
      for (let k = 0; k < 80; k++) sim(1 / 120, { right: true }); const passed = S().state === 'play' && !S().entities.some(e => e.constructor.name === 'OrchJpTree' && e.arr >= 0);
      walkTo(tx * 32 + 16, 3);
      sim(0.5); const pre = { cx: p.cx / 32, y: (p.y + p.h) / 32, tree: S().entities.filter(e => e.constructor.name === 'OrchJpTree').map(e => [e.trunkX / 32, e.forkY / 32, e.arr]) }; let miny = 1e9; for (let k = 0; k < 42; k++) { sim(1 / 120, { jump: true, jumpPressed: k === 0 }); miny = Math.min(miny, p.y / 32); } const slipping = S().entities.some(e => e.constructor.name === 'OrchJpTree' && e.arr >= 0);
      sim(0.6); return { passed, slipping, banner: S().bannerText, pre, miny, cx: p.cx / 32 };
    });
    check('11-3: walking past the tree does nothing; behind the trunk a jump into the fork\'s underside slips Brady up into the tree, the land\'s name comes up', r.passed && r.slipping && r.banner === 'THE ORCHARD AFTER CLOSING', r);
    await ev(() => freeze()); await shot('02-entrance-slipping-in.png');
    r = await ev(() => {
      thaw(); for (let k = 0; k < 900 && S().state === 'play'; k++) sim(1 / 120); sim(2);
      const T = window.BRADY_TOUR, d = window.BRADY.Save.data;
      return { state: S().state, key: S().exitKey, land: !!d.tour.lands.orch, unlocked: T.TourProgress.isUnlocked('28-1'), pips: T.TourProgress.exitsFound('11-3') };
    });
    check('11-3 clears through its exit to the land: the land opens, 28-1 unlocks, the card now counts the found exit', r.key === 'orch' && r.land && r.unlocked && r.pips.found >= 1, r);
    r = await ev(() => {
      window.BRADY.goToMap('world', 1, '11-3');
      for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); }
      if (S().openRoute) S().openRoute({ dest: 'orch' });
      for (let k = 0; k < 60 && (S().rRevealQ == null || S().rReveal || (S().rRevealQ && S().rRevealQ.length)); k++) sim(0.25);
      sim(1);
      const T = window.BRADY_TOUR; return { state: T.TourMap.stopState(T.Tour.stops.orch), mode: S().mode };
    });
    check('the route map now shows The Orchard After Closing', r.state !== 'hidden', r);
    await ev(() => freeze()); await shot('03-entrance-route-map.png');
    r = await ev(() => { thaw(); window.BRADY.goToMap('world', 1, '28-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { cc: s.ow && s.ow.cc }; });
    check('the land has its own walkable map, and 28-1 can be entered from it', r.cc === 'orch', r);
    await ev(() => freeze()); await shot('04-orch-overworld-map.png');
    await ev(() => thaw());
  });
};

/* ---------------- 28-1 Elbows on the Trellis: grip, climb, collars, forks, the late fork ---------------- */
STAGES.trellis = async ({ ev, shot, run, pano }) => {
  await run('trellis', async () => {
    await ev(ROOM_HELPERS);
    await ev(() => { fresh(); play('28-1'); place(4, 22); sim(0.4); freeze(); });
    await shot('10-28-1-start.png');
    let r = await ev(() => { thaw(); place(13, 22); sim(0.2); sim(0.35, { jump: true, jumpPressed: true, up: true }); const g1 = grip(); const y0 = P().y; sim(0.5, { up: true }); const y1 = P().y; sim(0.6, { right: true }); return { g1, climbedUp: Math.round((y0 - y1) / 32 * 10) / 10, g2: grip() }; });
    check('28-1: a jump while pushing UP grips the trellis; the stick climbs it (up, then right)', r.g1 && r.climbedUp >= 1 && r.g2 && r.g2.x > r.g1.x, r);
    await ev(() => freeze()); await shot('11-28-1-gripping-the-trellis.png');
    r = await ev(() => { thaw(); press('jump'); const gone = !grip(); sim(1.2); return { gone, onGround: P().onGround, at: at() }; });
    check('28-1: JUMP away from a collar lets go (a real jump back onto the grass)', r.gone && r.onGround && r.at.y === 22, r);
    // the first fork: from the trellis's edge, hold the stick against the fork: it bends across the pit
    r = await ev(() => {
      place(38, 22); sim(0.1); sim(0.4, { jump: true, jumpPressed: true, up: true }); goNet(41, 14);
      const f = ents('OrchFork').sort((a, b) => a.rootX - b.rootX)[0], b0 = f.bent; sim(0.6, { right: true }); const b1 = f.bent; goNet(48, 14); const g = grip(); goNet(54, 18); sim(0.4, { jump: true, jumpPressed: true, right: true }); sim(1.0);
      return { b0, b1, g, at: at() };
    });
    check('28-1: pushing against a fork bends it across the pit; Brady climbs along it to the next trellis and on to the bank', !r.b0 && r.b1 && r.g && r.g.x >= 47 && r.at.x >= 55 && !r.at.dead, r);
    await ev(() => { place(40, 22); sim(0.1); sim(0.4, { jump: true, jumpPressed: true, up: true }); goNet(43, 14); freeze(); }); await shot('12-28-1-fork-bent.png');
    // collars: JUMP at a stake slips round the back; a near-face critter passes him by
    r = await ev(() => {
      thaw(); place(59, 22); sim(0.1); sim(0.4, { jump: true, jumpPressed: true, up: true }); goNet(62, 15);
      const before = grip(); press('jump'); sim(0.45); const after = grip();
      const p = P(), m = ents('OrchCrawler').find(e => e.face === 0 && Math.abs(e.cx - p.cx) < 12 * 32);
      p.invuln = 0; const hp = p.power; m.u = 0.5; m.place(); p.x = m.cx - p.w / 2; p.y = m.y; sim(0.2); const hurt = p.power !== hp || p.invuln > 0 || p.dead; p.invuln = 999;
      return { before, after, hurt };
    });
    check('28-1: JUMP at a collar slips Brady round the back of the stake; a near-face fly can\'t touch him there', r.before && r.before.face === 0 && r.after && r.after.face === 1 && !r.hurt, r);
    await ev(() => { sim(0.2, { right: true }); freeze(); }); await shot('13-28-1-far-face.png');
    // the late fork: bent from the near face it springs back; from behind, its tie holds it
    r = await ev(() => {
      thaw(); place(146, 22); sim(0.1); sim(0.4, { jump: true, jumpPressed: true, up: true }); goNet(155, 12);
      const f = ents('OrchFork').filter(e => e.late).sort((a, b) => a.rootX - b.rootX)[0]; window.__dbg = { g0: grip(), at: at(), n: ents('OrchFork').length }; let bentNear = false; for (let k = 0; k < 72; k++) { sim(1 / 120, { right: true }); bentNear = bentNear || f.bent; } sim(0.5); const sprang = !f.bent && !!grip();
      goNet(147, 14); press('jump'); sim(0.45); const face = grip() && grip().face; goNet(155, 12); sim(0.6, { right: true }); const tied = f.tied; sim(0.5); const holds = f.bent;
      goNet(163, 12); const g = grip();
      return { bentNear, sprang, face, tied, holds, g, dbg: window.__dbg };
    });
    check('28-1: a late fork bent from the near face springs back when let go (Brady is sprung back onto the trellis, no fall)', r.bentNear && r.sprang, r);
    check('28-1: round the back, the late fork\'s tie holds it: Brady crosses on the far face', r.face === 1 && r.tied && r.holds && r.g && r.g.x >= 162 && r.g.face === 1, r);
    await ev(() => { goNet(158, 12); freeze(); }); await shot('14-28-1-late-fork-tied.png');
    await ev(() => { thaw(); place(87, 4); sim(0.3); freeze(); }); await shot('15-28-1-shed-ledge-bitten-pear.png');
    await ev(() => { thaw(); place(205, 22); P().orchTr = null; sim(0.05); place(200, 22); freeze(); }); await shot('16-28-1-two-late-forks.png');
    await ev(() => { thaw(); play('28-1'); }); await pano('pano-28-1.png', 0.3);
  });
};

/* ---------------- 28-2 Appointment with a Bee ---------------- */
STAGES.bee = async ({ ev, shot, run, pano }) => {
  await run('bee', async () => {
    await ev(ROOM_HELPERS);
    await ev(() => { fresh(); play('28-2'); place(4, 20); sim(0.4); freeze(); }); await shot('20-28-2-start.png');
    let r = await ev(() => { thaw(); walkTo(19 * 32 + 16, 4); const pad0 = tile(23, 18); press('action'); sim(0.6); const bee = ents('OrchBee')[0]; const going = bee && bee.state === 'go'; sim(2.2); return { pad0, going, pad1: tile(23, 18) }; });
    check('28-2: THROW on the bell flower sends its bee to the blossom; it blooms into a petal step', r.pad0 === 0 && r.going && r.pad1 !== 0, r);
    await ev(() => { place(19, 20); sim(0.2); freeze(); }); await shot('21-28-2-bee-flying.png');
    r = await ev(() => { thaw(); place(21, 20); sim(0.2); sim(0.5, { jump: true, jumpPressed: true, right: true }); sim(0.5); const a1 = at(); sim(0.5, { jump: true, jumpPressed: true, right: true }); sim(0.5); walkTo(28 * 32, 6); return { a1, a2: at() }; });
    check('28-2: up the petal step onto the first bank', r.a1.y === 17 && r.a2.y === 14, r);
    // the shy blossom: from its near bell the bee bumps a shut bud; from the far bell it blooms
    r = await ev(() => { place(167, 20); sim(1.2); const bl = ents('OrchBlossom').find(b => b.shy); press('action'); sim(3); const near = bl.done; walkTo(160 * 32 + 16, 4); press('action'); sim(4); return { near, far: bl.done }; });
    check('28-2: the shy blossom shuts while Brady stands by it (the bee bumps the bud); sent from the far bell, it blooms', !r.near && r.far, r);
    await ev(() => { place(165, 20); sim(0.3); freeze(); }); await shot('22-28-2-shy-blossom.png');
    await ev(() => { thaw(); place(83, 14); sim(0.3); freeze(); }); await shot('23-28-2-pantry-ledge.png');
    await ev(() => { thaw(); play('28-2'); }); await pano('pano-28-2.png', 0.3);
  });
};

/* ---------------- 28-3 Cut Above ---------------- */
STAGES.cut = async ({ ev, shot, run, pano }) => {
  await run('cut', async () => {
    await ev(ROOM_HELPERS);
    await ev(() => { fresh(); play('28-3'); place(4, 20); sim(0.4); freeze(); }); await shot('30-28-3-start.png');
    let r = await ev(() => { thaw(); walkTo(15 * 32 + 16, 4); const s0 = tile(14, 18); press('action'); sim(0.5); return { s0, s1: tile(14, 18) }; });
    check('28-3: THROW on a bud\'s mark pinches it: two side shoots grow out into steps', r.s0 === 0 && r.s1 !== 0, r);
    await ev(() => freeze()); await shot('31-28-3-shoots.png');
    r = await ev(() => { thaw(); sim(0.4, { jump: true, jumpPressed: true }); sim(0.6); const a1 = at(); walkTo(15 * 32 + 16, 4); press('action'); sim(0.4); sim(0.4, { jump: true, jumpPressed: true }); sim(0.6); const a2 = at(); walkTo(22 * 32, 6); return { a1, a2, a3: at() }; });
    check('28-3: up the shoots, a second pinch, onto the bank', r.a1.y === 17 && r.a2.y === 14 && r.a3.y === 13, r);
    // the knob: pinch it and it is gone (it grows back); pinch the top bud from it
    r = await ev(() => {
      const st = ents('OrchBud').filter(b => b.knob)[0], top = ents('OrchBud').find(b => b.bx === st.bx && b.by === st.by - 3);
      ents('OrchBud').filter(b => b.bx === st.bx && !b.knob && b.by > st.by).forEach(b => b.act(P())); place(st.tx, st.by); sim(0.3); press('action'); sim(0.3); const gone = tile(st.knob[0], st.knob[1]) === 0; sim(4.6); const back = tile(st.knob[0], st.knob[1]) !== 0;
      place(st.tx, st.by - 3); sim(0.3); const onKnob = at().y === st.by - 3; press('action'); sim(0.5); const top1 = top.done;
      return { gone, back, onKnob, top1 };
    });
    check('28-3: pinching the knob bud loses the foothold (it grows back); from the knob the top bud pinches into the last shoots', r.gone && r.back && r.onKnob && r.top1, r);
    await ev(() => { sim(0.3); freeze(); }); await shot('32-28-3-knob-top-bud.png');
    await ev(() => { thaw(); place(90, 10); sim(0.3); freeze(); }); await shot('33-28-3-hedge-mound.png');
    await ev(() => { thaw(); play('28-3'); }); await pano('pano-28-3.png', 0.3);
  });
};

/* ---------------- 28-4 A Pear in a Sleeve ---------------- */
STAGES.sleeve = async ({ ev, shot, run, pano }) => {
  await run('sleeve', async () => {
    await ev(ROOM_HELPERS);
    await ev(() => { fresh(); play('28-4'); place(4, 11); sim(0.4); freeze(); }); await shot('40-28-4-start.png');
    let r = await ev(() => {
      thaw(); const sl = ents('OrchSleeve').sort((a, b) => a.x - b.x)[0]; walkTo(sl.cx, 6); const y0 = sl.y;
      sim(3.0, { right: true }); const down = sl.y; const stopX = P().cx; sim(0.6, { right: true }); const walkedOff = P().cx > stopX + 8; walkTo(26 * 32, 6);
      return { y0: y0 / 32, down: down / 32, walkedOff, at: at() };
    });
    check('28-4: on the sleeve, walking against the seam unscrews it down (Brady stays put on it); at its stop he walks off onto the lower ledge', r.down >= r.y0 + 5.9 && r.walkedOff && r.at.y === 17, r);
    await ev(() => { const sl = ents('OrchSleeve').sort((a, b) => a.x - b.x)[0]; place(22, 11); sim(0.2); sim(1.0, { right: true }); freeze(); }); await shot('41-28-4-unscrewing.png');
    // the late sleeve: past its tie the seam turns; the old way winds back up
    r = await ev(() => {
      thaw(); const sl = ents('OrchSleeve').find(s2 => s2.join != null && s2.y < (s2.join + 1) * 32); place(Math.floor(sl.cx / 32) - 3, sl.top); sim(0.2); walkTo(sl.cx, 6);
      const hand = sl.hd(); const key = hand > 0 ? 'left' : 'right', other = hand > 0 ? 'right' : 'left';
      sim(5, { [key]: true }); const stuck = sl.y / 32, flipped = sl.hd() !== hand; sim(4, { [other]: true }); const bottom = sl.y / 32;
      return { join: sl.join, stuck, flipped, bottom, bot: sl.bot + 1 };
    });
    check('28-4: the late sleeve: past its rust tie the seam turns (the old way only winds it back to the tie); turning round takes it to the bottom', Math.abs(r.stuck - (r.join + 1)) < 0.6 && r.bottom >= r.bot - 0.05, r);
    await ev(() => { sim(0.1); freeze(); }); await shot('42-28-4-late-sleeve.png');
    // the lift past the high bank, up into the canopy niche
    r = await ev(() => { thaw(); play('28-4'); const sl = ents('OrchSleeve').find(s2 => s2.bot - s2.top > 15); place(Math.floor(sl.cx / 32) - 3, sl.bot); sim(0.2); walkTo(sl.cx, 6); const ride = P().ride === sl; sim(9, { right: true }); return { ride, top: sl.y / 32, want: sl.top + 1 }; });
    check('28-4: a sleeve wound WITH its seam rises past the high bank, up to the canopy niche', Math.abs(r.top - r.want) < 0.05, r);
    await ev(() => { freeze(); }); await shot('43-28-4-canopy-niche.png');
    await ev(() => { thaw(); play('28-4'); }); await pano('pano-28-4.png', 0.3);
  });
};

/* ---------------- 28-5 The Graft Takes ---------------- */
STAGES.graft = async ({ ev, shot, run, pano }) => {
  await run('graft', async () => {
    await ev(ROOM_HELPERS);
    await ev(() => { fresh(); play('28-5'); place(8, 20); sim(0.4); freeze(); }); await shot('50-28-5-start.png');
    let r = await ev(() => {
      thaw(); const gf = ents('OrchGraft').sort((a, b) => a.x - b.x)[0]; walkTo(gf.cx, 4);
      for (let k = 0; k < 600 && gf.lined(); k++) sim(1 / 120); press('action'); sim(0.2); const miss = !gf.done;
      for (let k = 0; k < 900 && !gf.lined(); k++) sim(1 / 120); press('action'); sim(0.5);
      return { miss, done: gf.done, tile: tile(gf.arch[3][0], gf.arch[3][1]) };
    });
    check('28-5: THROW while the notches are apart does nothing; when they meet the cuts grow into an arch', r.miss && r.done && r.tile !== 0, r);
    await ev(() => { walkTo(29 * 32, 6); freeze(); }); await shot('51-28-5-arch.png');
    r = await ev(() => {
      thaw(); const gf = ents('OrchGraft').find(e => e.sag); place(gf.tx - 2, gf.fy - 1); sim(0.2); walkTo(gf.cx, 4);
      for (let k = 0; k < 900 && !gf.lined(); k++) sim(1 / 120); const far = gf.far(); press('action'); sim(0.5); return { far: +far.toFixed(1), done: gf.done };
    });
    check('28-5: the last graft: Brady\'s weight sags the near cut, so they meet on the far cut\'s low swing', r.done && r.far > 8, r);
    await ev(() => { sim(0.2); freeze(); }); await shot('52-28-5-last-graft.png');
    await ev(() => { thaw(); place(5, 20); sim(0.3); freeze(); }); await shot('53-28-5-soft-hole.png');
    await ev(() => { thaw(); play('28-5'); }); await pano('pano-28-5.png', 0.3);
  });
};

/* ---------------- 28-6 the lawn: the pluck, the vote, the persuasion; the committee ---------------- */
STAGES.lawn = async ({ ev, shot, run, pano }) => {
  await run('lawn', async () => {
    await ev(ROOM_HELPERS);
    await ev(() => { fresh(); play('28-6'); place(4, 15); sim(0.4); freeze(); }); await shot('60-28-6-lawn.png');
    let r = await ev(() => {
      thaw(); const L = ents('OrchLoaded').sort((a, b) => a.x - b.x), B = ents('OrchBasket')[0];
      walkTo(L[0].cx, 4); press('action'); sim(1.2); const v1 = B.votes;
      walkTo(L[1].cx, 4); press('action'); sim(1.2);
      walkTo(L[2].cx, 4); press('action'); sim(1.4); const wrong = B.votes;
      walkTo((L[2].lx + 0.5) * 32, 4); press('action'); sim(0.6); walkTo(L[2].cx, 4); press('action'); sim(1.4);
      sim(0.6); return { v1, wrong, votes: B.votes, open: tile(41, 15) === 0 };
    });
    check('28-6: plucked from underneath, a loaded branch flicks its pear into the basket; the leaning one first needs persuading; three votes open the hedge', r.v1 === 1 && r.wrong === 2 && r.votes === 3 && r.open, r);
    await ev(() => freeze()); await shot('61-28-6-motion-carried.png');
    // up through the gap in the boughs (the bitten pear under it) onto the run to the pip cellar
    r = await ev(() => { thaw(); walkTo(50 * 32 + 16, 4); sim(0.4, { jump: true, jumpPressed: true }); sim(0.5); sim(0.3, { jump: true, jumpPressed: true }); sim(0.4, { jump: true, right: true }); sim(0.6); return at(); });
    check('28-6: off the little branch and up through the gap in the boughs onto the run above', r.y === 9, r);
    await ev(() => { walkTo(60 * 32, 6); freeze(); }); await shot('62-28-6-run-above.png');
    r = await ev(() => { thaw(); place(75, 15); sim(0.2); walkTo(78 * 32 + 16, 6); sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); walkTo(P().cx + 6 * 32, 8); sim(3); return { area: S().area.aid, boss: !!S().boss }; });
    await ev(() => { thaw(); }).catch(() => {});
    check('28-6: the shed door; the night orchard; the Windfall Committee wakes', r.area === 'orchard' && r.boss, r);
    await ev(() => { sim(1.5); freeze(); }); await shot('63-28-6-boss-committee.png');
    await ev(() => { thaw(); play('28-6'); }); await pano('pano-28-6.png', 0.3);
  });
};

/* ---------------- the six rooms: found by their entrance, failed once, won, left ---------------- */
const ROOMS = [
  ['70-room-b11-borrowed-umbrella', '28-1', `place(83, 4); sim(0.2); press('up');`,
    `walkTo(6.5 * 32, 6); sim(0.1); for (let k = 0; k < 240 && !room().fails; k++) sim(1 / 120, { right: true, action: true });`,
    `walkTo(6.5 * 32, 6); const R = room(); const K = BRADY_TOUR.orchKit; for (let k = 0; k < 900 && !R.won; k++) { const p = P(); const sh = [[6, 8], [11, 12], [16, 17]].some(([a, b]) => p.cx + 12 >= a * 32 - 4 && p.cx - 2 <= (b + 1) * 32 + 4); const dr = (R.drops || []).some(d => d.swell > 0.6 && d.fall < 1 && Math.abs(p.cx + 30 - d.x) < 40); sim(1 / 120, { right: !(sh && dr && false), action: !sh }); }`],
  ['71-room-b12-clean-cut', '28-2', `place(90, 8); sim(0.2); press('up');`,
    `const m = ents('OrchRoomMark')[0]; walkTo(m.cx, 4); press('action');`,
    `const m = ents('OrchRoomMark')[0], R = room(), K = kit(); walkTo(m.cx, 4); const sx = (K.data.snip + 0.5) * 32, Kd = BRADY_TOUR; for (let k = 0; k < 120 * 30 && !R.won; k++) { const J = window.joints(); const hit = J.some((x, i) => Math.abs(x - sx) < 6 && !(R.cut || []).includes(i)); if (hit) press('action'); else sim(1 / 120); }`],
  ['72-room-b13-owls-shutter', '28-3', `place(89, 10); sim(0.2); for (let k = 0; k < 200 && Math.floor(P().cx / 32) < 94; k++) sim(1 / 120, { right: true }); press('up');`,
    `const m = ents('OrchRoomMark')[0]; walkTo(m.cx, 4); for (let k = 0; k < 600 && window.owl() !== 'sleep'; k++) sim(1 / 120); press('action');`,
    `const m = ents('OrchRoomMark')[0], R = room(); walkTo(m.cx, 4); for (let k = 0; k < 120 * 25 && !R.won; k++) { if (window.owl() === 'grin' && (R.c % 4.6) > 2.6) press('action'); else sim(1 / 120); }`],
  ['73-room-b14-do-us-a-flavour', '28-4', `place(67, 7); sim(0.2); press('up');`,
    `const m = ents('OrchRoomMark')[0]; walkTo(m.cx, 4); sim(0.4, { action: true }); sim(0.1);`,
    `const m = ents('OrchRoomMark')[0], R = room(), Kd = window.sorbet; walkTo(m.cx, 4); for (let n = 0; n < 4 && !R.won; n++) { for (let k = 0; k < 900; k++) { sim(1 / 120, { action: true }); if (R.h > 0.6 && Math.abs(Kd()) < 0.08) break; } sim(0.2); }`],
  ['74-room-b15-under-the-stamp', '28-5', `place(4, 20); sim(0.2); for (let k = 0; k < 300 && S().area.aid === 'nursery'; k++) sim(1 / 120, { left: true }); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120);`,
    `const m = ents('OrchRoomMark')[0], R = room(); walkTo(m.cx, 4); for (let k = 0; k < 400 && !(R.c % 2.4 > 0.45 && R.c % 2.4 < 0.55); k++) sim(1 / 120); press('action'); sim(6);`,
    `const m = ents('OrchRoomMark')[0], R = room(); walkTo(m.cx, 4); const travel = (15.2 - 8) / 2.4, want = ((1.62 - travel) % 2.4 + 2.4) % 2.4; let c0 = R.c % 2.4; for (let k = 0; k < 120 * 20 && !R.won; k++) { const c = R.c % 2.4; if (c0 < want && c >= want) press('action'); else sim(1 / 120); c0 = c; }`],
  ['75-room-one-loose-pip', '28-6', `place(70, 9); sim(0.2); press('up');`,
    `const R = room(), sh = ents('OrchRoomMark').find(m => m.k === 's'); walkTo(sh.cx, 4); press('action'); sim(1.6); const w = ents('OrchRoomMark').find(m => m.k !== 's' && m.k !== R.loose); walkTo(w.cx, 4); press('action');`,
    `const R = room(); for (let n = 0; n < 3 && !R.won; n++) { const sh = ents('OrchRoomMark').find(m => m.k === 's'); walkTo(sh.cx, 4); press('action'); sim(1.6); const m = ents('OrchRoomMark').find(e => e.k === R.loose); walkTo(m.cx, 4); press('action'); sim(0.3); }`]
];
STAGES.rooms = async ({ ev, shot, run }) => {
  for (const [tag, id, enter, miss, win] of ROOMS) await run(tag, async () => {
    await ev(ROOM_HELPERS);
    await ev(() => {
      window.joints = () => { const A = S().area; return window.BRADY_TOUR && A.roomKit ? TourRoomsJ(A) : []; };
      window.TourRoomsJ = A => { const K = window.BRADY_TOUR.orchKit.Rooms.kinds.orchPeel; return K ? K.joints(A, A.roomState, A.roomKit) : []; };
      window.owl = () => { const K = window.BRADY_TOUR.orchKit.Rooms.kinds.orchOwl; return K.phase(S().area.roomState).st; };
      window.sorbet = () => window.BRADY_TOUR.orchKit.Rooms.kinds.orchSorbet.sway(S().area.roomState);
    });
    let r0 = await ev(([i, e]) => { fresh(); play(i); (new Function(e))(); for (let k = 0; k < 600 && (S().fade.a > 0.05 || P().state !== 'play'); k++) sim(1 / 120); sim(0.3); return { area: S().area.aid, kind: S().area.roomKit && S().area.roomKit.kind }; }, [id, enter]);
    check(tag + ': entered by its hidden way in (' + id + ')', !!r0.kind && /^orch/.test(r0.kind), r0);
    await ev(() => { P().invuln = 999; sim(0.4); freeze(); }); await shot(tag + '-title.png');
    await ev(() => { thaw(); sim(1.6); freeze(); }); await shot(tag + '-entry.png');
    let r = await ev(w => { thaw(); const R = room(); const f0 = R.fails || 0; (new Function(w))(); sim(0.5); return { fails: R.fails || 0, f0, won: R.won }; }, miss);
    check(tag + ': a miss costs nothing: that turn starts again (no win)', r.fails >= r.f0 + 1 && !r.won, r);
    r = await ev(w => { sim(1.5); (new Function(w))(); sim(1.2); return { won: room().won, cage: cageOpen() }; }, win);
    check(tag + ': won with real inputs; the prize cage opens at the win', r.won && r.cage, r);
    await ev(() => freeze()); await shot(tag + '-won.png'); await ev(() => thaw());
    r = await ev(() => leave());
    check(tag + ': its door lets Brady out into the level', r && r.area && r.area !== r0.area, r);
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
    if (T.n % (window.TRN || 360) === 0 && T.trace) { const q = p(); T.trace.push([T.step, Math.floor(q.cx / 32), Math.floor((q.y + q.h) / 32), S().area.aid, S().state, q.state, Math.round(S().timeLeft || 0)]); }
    if (!T.died()) return true;
    const q = p(), why = window.__lastDie || {}; window.__lastDie = null; T.deaths.push({ id: T.id, step: T.step, x: why.x != null ? why.x : Math.floor(q.cx / 32), y: why.y != null ? why.y : Math.floor((q.y + q.h) / 32), reason: why.reason || S().state, near: why.near || [] });
    for (let k = 0; k < 120 * 8 && !(S() !== T.scene && S().state === 'play' && S().player && !S().player.dead); k++) sim(1 / 120);
    T.scene = S(); B.Save.data.lives = 9; S().player.invuln = 0; return false;
  };
  T.wait = sec => { for (let k = 0; k < sec * 120; k++) if (!T.f()) return false; return true; };
  const tileAt = (x, y) => { const A = S().area; return x < 0 || x >= A.W ? 99 : y < 0 || y >= A.H ? 0 : A.tiles[y * A.W + x]; };
  const solid = (x, y) => { const t = tileAt(x, y); return t === 99 || (window.BRADY_TOUR.orchKit.SOLID[t]); };
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
        const crit = S().entities.some(e => e.enemy && !e.dead && !e.remove && !e.boss && !e.isOrchCrawler && (e.cx - q.cx) * dir > 0 && Math.abs(e.cx - q.cx) < 90 && Math.abs((e.y + e.h) - (q.y + q.h)) < 40);
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
  T.grip = (dir) => { for (let k = 0; k < 24; k++) if (!T.f({})) return false; if (!T.f({ jump: true, jumpPressed: true, up: true, right: dir > 0, left: dir < 0 })) return false; for (let k = 0; k < 60 && !(p().orchTr && p().orchTr.grip); k++) if (!T.f({ up: true, jump: true, right: dir > 0, left: dir < 0 })) return false; return !!(p().orchTr && p().orchTr.grip); };
  // climb to a cell (grip row y): wait while a critter on his face is close in the way
  T.climb = (x, y) => {
    for (let k = 0; k < 120 * 30; k++) {
      const q = p(), W = q.orchTr; if (!W || !W.grip) return 'lost grip';
      const gx = x * 32 + 16, gy = y * 32 + 16, dx = gx - q.cx, dy = gy - (q.y + 8);
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return true;
      const mine = S().entities.filter(e => e.isOrchCrawler && !e.dead && e.face === W.face);
      const close = mine.find(e => Math.hypot(e.cx - q.cx, e.cy - q.cy) < 62);
      const near = mine.some(e => Math.hypot(e.cx - (q.cx + Math.sign(dx) * 30), e.cy - (q.cy + Math.sign(dy) * 30)) < 50);
      // a critter on his face coming at him: back off along the net, the way a careful player would
      let inp = near ? {} : { right: dx > 4, left: dx < -4, down: dy > 4 && Math.abs(dx) < 20, up: dy < -4 && Math.abs(dx) < 20 };
      if (close) { const ex = q.cx - close.cx, ey = q.cy - close.cy; inp = Math.abs(ex) > Math.abs(ey) ? { right: ex > 0, left: ex < 0 } : { down: ey > 0, up: ey < 0 }; }
      if (!T.f(inp)) return false;
    }
    return 'stuck';
  };
  T.cross = () => { const f0 = p().orchTr.face; if (!T.f({ jump: true, jumpPressed: true })) return false; T.wait(0.45); return p().orchTr && p().orchTr.face !== f0; };
  T.letGo = dir => T.hop(dir, false, 0.5);
  T.ride = (dir, row) => { const fr = () => Math.floor((p().y + p().h - 1) / 32), up = fr() > row; for (let k = 0; k < 120 * 10; k++) { if (up ? fr() <= row : fr() >= row) { for (let j = 0; j < 20; j++) if (!T.f({})) return false; return true; } if (!T.f({ [dir]: true })) return false; } return 'stuck'; };
  T.graft = () => { const gs = S().entities.filter(e => e.constructor.name === 'OrchGraft' && !e.done).sort((a, b) => Math.abs(a.cx - p().cx) - Math.abs(b.cx - p().cx)); const gf = gs[0]; if (!gf) return true; for (let k = 0; k < 120 * 10 && !gf.done; k++) { if (!T.f(gf.lined() && Math.abs(gf.far() - gf.near()) < 6 && p().onGround ? { action: true, actionPressed: true } : {})) return false; } return gf.done || 'stuck'; };
  // a careful last step onto a mark: short taps of the stick until Brady's centre is within 6 px of x
  T.to = x => { if (T.walk(x, { noHop: true }) === false) return false; for (let k = 0; k < 80; k++) { for (let j = 0; j < 60 && Math.abs(p().vx) > 4; j++) if (!T.f({})) return false; if (Math.abs(p().cx - x) <= 6) return true; const d = p().cx < x; for (let j = 0; j < 2; j++) if (!T.f({ right: d, left: !d })) return false; } return true; };
  T.push = dir => { for (let k = 0; k < 0.6 * 120; k++) if (!T.f({ right: dir > 0, left: dir < 0 })) return false; return true; };
  T.press = k => T.f({ [k]: true, [k + 'Pressed']: true });
  T.door = () => { if (!T.f({ up: true, upPressed: true })) return false; for (let k = 0; k < 600 && (S().fade.a > 0.05 || p().state !== 'play'); k++) sim(1 / 120); T.scene = S(); return true; };
  T.gate = () => { for (let k = 0; k < 120 * 20 && !T.finished(); k++) { const gt = S().entities.find(e => e.constructor.name === 'Gate' && !e.secret && !e.remove); const tx = gt ? gt.cx : p().cx + 64; if (p().onGround && p().hitWall) { if (!T.hop(p().cx < tx ? 1 : -1, false, 0.45)) return false; continue; } if (!T.f({ right: p().cx < tx - 4, left: p().cx > tx + 4 })) return false; } return T.finished() || 'stuck'; };
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
    return { id, finished: T.finished(), deaths: T.deaths.filter(d => d.id === id), fails, trace: T.trace.slice(-80) };
  };
};
const BOT_ROUTES = {
  '28-1': [['walk', 19 * 32], ['grip', 1], ['climb', 31, 17], ['letGo', 1], 'cp', ['walk', 37 * 32], ['grip', 1], ['climb', 41, 14], ['push', 1], ['climb', 47, 14], ['climb', 54, 18], ['hopTo', 56, 0.3], 'cp',
    ['walk', 59 * 32], ['grip', 1], ['climb', 62, 15], ['cross'], ['climb', 69, 15], ['cross'], ['climb', 73, 14], ['letGo', 1], 'cp',
    ['walk', 91 * 32], ['grip', 1], ['climb', 91, 12], ['climb', 105, 12], ['letGo', 1], 'cp', ['walk', 145 * 32 + 16], ['grip', 1], ['climb', 147, 14], ['cross'], ['climb', 155, 12], ['push', 1], ['climb', 163, 12], ['climb', 170, 17], ['letGo', 1], 'cp',
    ['walk', 187 * 32 + 16], ['grip', 1], ['climb', 190, 13], ['cross'], ['climb', 196, 11], ['push', 1], ['climb', 202, 11], ['climb', 203, 15], ['cross'], ['climb', 207, 15], ['climb', 207, 12], ['cross'], ['climb', 208, 13], ['push', 1], ['climb', 216, 13], ['climb', 222, 17], ['letGo', 1], 'cp', ['gate']],
  '28-2': [['walk', 19 * 32 + 16, { noHop: true }], ['press', 'action'], ['wait', 2.6], ['hopTo', 23, 0.45], ['walk', 36 * 32], 'cp',
    ['walk', 49 * 32 + 16, { noHop: true }], ['press', 'action'], ['wait', 2.4], ['hopTo', 54, 0.4], ['walk', 54 * 32 + 16, { noHop: true }], ['press', 'action'], ['wait', 2.4], ['hopTo', 59, 0.4], ['walk', 66 * 32], 'cp', ['walk', 92 * 32],
    ['walk', 110 * 32 + 16, { noHop: true }], ['press', 'action'], ['wait', 2.4], ['hopTo', 114, 0.45], ['walk', 114 * 32 + 16, { noHop: true }], ['press', 'action'], ['wait', 2.4], ['hopTo', 117, 0.45], ['walk', 126 * 32], 'cp',
    ['walk', 150 * 32], ['walk', 160 * 32 + 16, { noHop: true }], ['press', 'action'], ['wait', 3.6], ['walk', 169 * 32 + 16, { noHop: true }], ['hopTo', 171, 0.45], ['walk', 178 * 32], 'cp', ['gate']],
  '28-3': [['walk', 15 * 32 + 16, { noHop: true }], ['press', 'action'], ['wait', 0.5], ['hopTo', 15, 0.45], ['press', 'action'], ['wait', 0.5], ['hopTo', 15, 0.45], ['walk', 30 * 32], 'cp',
    ['walk', 59 * 32 + 16], ['press', 'action'], ['wait', 0.5], ['hopTo', 59, 0.45], ['press', 'action'], ['wait', 0.5], ['hopTo', 59, 0.45], ['press', 'action'], ['wait', 0.5], ['hopTo', 59, 0.45], ['walk', 70 * 32], 'cp',
    ['walk', 112 * 32], 'cp', ['walk', 139 * 32 + 16], ['press', 'action'], ['wait', 0.5], ['hopTo', 139, 0.45], ['press', 'action'], ['wait', 0.5], ['hopTo', 139, 0.45], ['hopTo', 139, 0.45], ['press', 'action'], ['wait', 0.5], ['hopTo', 139, 0.45], ['walk', 148 * 32], 'cp', ['walk', 192 * 32], ['gate']],
  '28-4': [['walk', 21 * 32 + 8, { noHop: true }], ['ride', 'right', 17], ['walk', 29 * 32], 'cp', ['to', 47 * 32 + 8], ['ride', 'right', 24], ['walk', 53 * 32], 'cp',
    ['walk', 69 * 32], ['walk', 70 * 32 + 8, { noHop: true }], ['ride', 'right', 14], ['hop', 1, false, 0.3], ['walk', 77 * 32, { noHop: true }], 'cp', ['walk', 96 * 32], ['to', 101 * 32 + 8], ['ride', 'left', 21], ['ride', 'right', 26], ['walk', 108 * 32], 'cp',
    ['to', 131 * 32 + 8], ['ride', 'left', 18], ['ride', 'right', 13], ['walk', 139 * 32, { noHop: true }], 'cp', ['walk', 163 * 32], ['to', 169 * 32 + 8], ['ride', 'left', 19], ['ride', 'right', 24], ['walk', 176 * 32], 'cp', ['gate']],
  '28-5': [['to', 23 * 32 + 16], ['graft'], ['walk', 41 * 32], 'cp', ['walk', 67 * 32], ['to', 69 * 32 + 16], ['graft'], ['walk', 85 * 32], 'cp', ['walk', 107 * 32], ['to', 111 * 32 + 16], ['graft'], ['walk', 127 * 32], 'cp',
    ['to', 149 * 32 + 16], ['graft'], ['walk', 167 * 32], 'cp', ['walk', 196 * 32], ['gate']],
  '28-6': [['walk', 14 * 32 + 16, { noHop: true }], ['press', 'action'], ['wait', 1.3], ['walk', 28 * 32 + 16, { noHop: true }], ['press', 'action'], ['wait', 1.3], ['walk', 37 * 32 + 16, { noHop: true }], ['press', 'action'], ['wait', 0.6],
    ['walk', 34 * 32 + 16, { noHop: true }], ['press', 'action'], ['wait', 2], ['walk', 59 * 32], 'cp', ['walk', 78 * 32 + 16], ['door'], ['bossFight'], ['gate']],
//ROUTES
};
const BOT_BOSS = () => {
  const T = window.BOT, p = () => S().player;
  // the committee, damage on: stand clear of a drop, wait on the other half from a blush, stand on the far side of a
  // pointing stalk; pluck from underneath whenever a member sits on a branch
  T.bossFight = () => {
    const boss = () => S().entities.find(e => e.boss && !e.remove);
    for (let k = 0; k < 120 * 6 && !(boss() && boss().perches); k++) if (!T.f({ right: p().cx < 6 * 32 })) return false;
    for (let guard = 0; guard < 120 * 180; guard++) {
      const b = boss(); if (!b || b.state === 'dying') return T.wait(3) && true;
      if (!b.perches) { if (!T.f()) return false; continue; }
      const q = p(), br = window.BRADY_TOUR.orchKit.committee, Pa = br.active(b), ph = b.phase || 1, mid = (b.arenaX0 + b.arenaX1) / 2;
      let target = null, inp = {};
      if (b.act === 'sit') target = Pa.perch.x;
      else if (ph === 1 && b.act === 'tell' && Pa.perch) target = Pa.perch.x + (Pa.perch.x < mid ? 3 : -3) * 32;
      else if (ph === 2 && (b.act === 'tell' || b.act === 'move')) target = Pa.side < 0 ? b.arenaX1 - 3 * 32 : b.arenaX0 + 4 * 32;
      else if (ph === 3 && b.act !== 'sit') target = b.arenaX1 - 3 * 32;
      if (b.act === 'sit' && Math.abs(q.cx - Pa.perch.x) < 10 && q.onGround) inp = { action: true, actionPressed: true };
      else if (target != null && Math.abs(q.cx - target) > 8) inp = { right: q.cx < target, left: q.cx > target };
      if (!T.f(inp)) return false;
    }
    return 'stuck';
  };
};

/* ---------------- the secret rooms: shared moves ---------------- */
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
    await session({ width: 874, height: 402 }, async ({ ev }) => {
      await ev(BOT_PAGE); await ev(BOT_BOSS);
      for (const id of Object.keys(BOT_ROUTES)) {
        if (want.length && !want.includes(id)) continue;
        const r = await ev(([i, route]) => window.BOT.run(i, route), [id, BOT_ROUTES[id]]);
        const spots = {}; for (const d of r.deaths) { const k = d.x + ',' + d.y + ' ' + d.reason + (d.near && d.near.length ? ' (' + d.near.join('/') + ')' : ''); spots[k] = (spots[k] || 0) + 1; }
        console.log(`BOT ${id}: ${r.finished ? 'FINISHED' : 'DID NOT FINISH'}, ${r.deaths.length} death(s) ${JSON.stringify(spots)}${r.fails.length ? ' fails ' + r.fails.join(' ') : ''}`);
        if (args.includes('--trace')) console.log(JSON.stringify(r.trace));
        check(`bot ${id}: played start to finish (enemies on, damage on), at most one death`, r.finished && r.deaths.length <= 1, { deaths: r.deaths.length, spots, fails: r.fails });
      }
    });
    console.log(failures ? `${failures} ORCH BOT CHECK(S) FAILED` : 'ALL ORCH BOT CHECKS PASSED');
    process.exit(failures ? 1 : 0);
  }
  await session({ width: 874, height: 402 }, async (o) => {
    for (const k of Object.keys(STAGES)) await STAGES[k](o);
  });
  await session({ width: 402, height: 874 }, async ({ ev, shot, run }) => {
    await run('p-trellis', async () => { await ev(() => { fresh(); play('28-1'); place(13, 22); sim(0.2); sim(0.35, { jump: true, jumpPressed: true, up: true }); sim(0.4, { up: true }); freeze(); }); await shot('90-portrait-28-1-trellis.png'); });
//PORTRAIT
  });
  console.log(failures ? `${failures} ORCH CHECK(S) FAILED` : 'ALL ORCH CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
