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
    window.place = (tx, ty) => { const g = S(), p = P(); g.timeLeft = Math.max(g.timeLeft || 0, 300); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; if (p.orchTr) p.orchTr.grip = null; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
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
      const f = ents('OrchFork').filter(e => e.late).sort((a, b) => a.rootX - b.rootX)[0]; sim(0.6, { right: true }); const bentNear = f.bent; sim(0.5); const sprang = !f.bent;
      goNet(149, 14); press('jump'); sim(0.45); const face = grip() && grip().face; goNet(155, 12); sim(0.6, { right: true }); const tied = f.tied; sim(0.5); const holds = f.bent;
      goNet(163, 12); const g = grip();
      return { bentNear, sprang, face, tied, holds, g };
    });
    check('28-1: a late fork bent from the near face springs back when let go', r.bentNear && r.sprang, r);
    check('28-1: round the back, the late fork\'s tie holds it: Brady crosses on the far face', r.face === 1 && r.tied && r.holds && r.g && r.g.x >= 162 && r.g.face === 1, r);
    await ev(() => { goNet(158, 12); freeze(); }); await shot('14-28-1-late-fork-tied.png');
    await ev(() => { thaw(); place(87, 4); sim(0.3); freeze(); }); await shot('15-28-1-shed-ledge-bitten-pear.png');
    await ev(() => { thaw(); place(205, 22); P().orchTr = null; sim(0.05); place(200, 22); freeze(); }); await shot('16-28-1-two-late-forks.png');
    await ev(() => { thaw(); play('28-1'); }); await pano('pano-28-1.png', 0.3);
  });
};
//STAGES
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
  T.grip = (dir) => { if (!T.f({ jump: true, jumpPressed: true, up: true, right: dir > 0, left: dir < 0 })) return false; for (let k = 0; k < 60 && !(p().orchTr && p().orchTr.grip); k++) if (!T.f({ up: true, jump: true, right: dir > 0, left: dir < 0 })) return false; return !!(p().orchTr && p().orchTr.grip); };
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
  T.push = dir => { for (let k = 0; k < 0.6 * 120; k++) if (!T.f({ right: dir > 0, left: dir < 0 })) return false; return true; };
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
const BOT_ROUTES = {
  '28-1': [['walk', 19 * 32], ['grip', 1], ['climb', 31, 17], ['letGo', 1], 'cp', ['walk', 37 * 32], ['grip', 1], ['climb', 41, 14], ['push', 1], ['climb', 47, 14], ['climb', 54, 18], ['letGo', 1], 'cp',
    ['walk', 59 * 32], ['grip', 1], ['climb', 62, 15], ['cross'], ['climb', 69, 15], ['cross'], ['climb', 73, 14], ['letGo', 1], 'cp',
    ['walk', 91 * 32], ['grip', 1], ['climb', 91, 12], ['climb', 105, 12], ['letGo', 1], 'cp', ['walk', 145 * 32 + 16], ['grip', 1], ['climb', 149, 14], ['cross'], ['climb', 155, 12], ['push', 1], ['climb', 163, 12], ['climb', 170, 17], ['letGo', 1], 'cp',
    ['walk', 188 * 32 + 16], ['grip', 1], ['climb', 191, 13], ['cross'], ['climb', 196, 11], ['push', 1], ['climb', 202, 11], ['climb', 203, 15], ['cross'], ['climb', 207, 15], ['climb', 207, 12], ['cross'], ['climb', 208, 13], ['push', 1], ['climb', 216, 13], ['climb', 222, 17], ['letGo', 1], 'cp', ['gate']],
//ROUTES
};
const BOT_BOSS = () => {
//BOSSBOT
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
