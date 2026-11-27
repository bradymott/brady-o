// Pupo Standard Time (world 32, a hidden land): in-browser checks and phone-size screenshots.
// Each stage's own mechanic is PLAYED with real inputs through the game loop: an autopilot (from the Moon's shots
// tool) plans each hop with the game's own physics function on a copy of Brady's body, then feeds those exact inputs
// to the real game frame by frame; the land's own moves (a thought's lift, a borrowed second, a bump) are scripted
// with the same real buttons. It finds and uses the hidden entrance in Nepal 12-1, plays every stage's mechanic and
// main route, every secret room (won once, failed once, every exit used) and the boss; it takes 844x390 landscape
// shots of the key beats, 390x844 portrait shots of 32-1, the boss and the map, and a panorama of every stage.
// usage: BRADY_DIST=<dist> node tools/sbw_pst_shots.js <outdir> [--checks] [name ...]   (--checks: no pictures)
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'pst-shots'), checksOnly = args.includes('--checks');
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
    const KEYS = ['left', 'right', 'up', 'down', 'jump', 'action'];
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
    window.play = (id, opts) => {
      const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9;
      const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(1.6);
      g.player.invuln = 999; g.player.setPower(opts && opts.big === false ? 0 : 1, true); sim(0.1); return g;
    };
    window.place = (tx, ty) => { const g = S(), p = P(); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.toArea = (aid, tx, ty) => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = A.anchors.in || A.anchors.start; if (g.area.idx !== k) g.loadArea(k, an.x, an.y); P().invuln = 999; if (tx != null) place(tx, ty); };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } if (g.player) g.player.invuln = 999; };
    window.ents = name => S().entities.filter(e => e.constructor.name === name || (e.s && e.s.type === name));
    window.tileOf = () => { const p = P(); return [Math.floor(p.cx / 32), Math.floor((p.y + p.h + 1) / 32)]; };

    /* ---------------- the autopilot ----------------
       A program is a little input plan: hold `dir` for `run` s on the ground, press jump and hold it `hold` s, then
       steer in the air (air: 'dir' | 'none' | 'rev' at revAt | 'late' (none, then dir from lateAt)), or walk off
       without jumping (noJump), or drop through a one-way floor (drop). Mechanic levels add their own fields (puffs
       for the spacewalk, lean for the buggy, boots for the magnet boots); AP.input turns a program and a time into
       the buttons held at that moment, the same function for the planner and for the real run. */
    const AP = window.AP = {
      hooks: [],   // (prog, t, b, inp) => {} : a level's own buttons
      input(prog, t, b) {
        const d = prog.dir, inp = { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false, action: false, actionPressed: false };
        let dir = d;
        if (prog.walkTo != null) { const dx = prog.walkTo - (b.x + b.w / 2), stop = Math.sqrt(2 * 40 * 32 * Math.abs(dx)) * 0.8; dir = Math.abs(dx) <= 6 ? (Math.abs(b.vx) > 40 ? -Math.sign(b.vx) : 0) : (b.vx * dx > 0 && Math.abs(b.vx) > stop ? -Math.sign(dx) : Math.sign(dx)); inp.left = dir < 0; inp.right = dir > 0; for (const h of AP.hooks) h(prog, t, b, inp); return inp; }
        if (prog.drop) { inp.down = t < 0.05; inp.jumpPressed = t < 1 / 120; dir = t < 0.25 ? 0 : d; }
        else if (prog.noJump) { dir = prog.air === 'late' && t > (prog.lateAt0 || 0) && t < prog.lateAt ? 0 : d; if (prog.air === 'rev' && t > prog.revAt) dir = -d; if (prog.air === 'stopgo') dir = t < prog.a || t > prog.b ? d : 0; }
        else if (prog.jumpAtX != null && prog._jt == null && d * (b.x + b.w / 2 - prog.jumpAtX) < 0 && t < 3) dir = d;
        else if (prog.jumpAtX == null && t < prog.run) dir = d;
        else {
          if (prog.jumpAtX != null && prog._jt == null) prog._jt = t;
          const ta = t - (prog.jumpAtX != null ? prog._jt : prog.run);
          if (ta < 1 / 120 + 1e-9) inp.jumpPressed = true;
          inp.jump = ta < prog.hold;
          if (prog.air === 'none') dir = 0; else if (prog.air === 'rev' && ta > prog.revAt) dir = -d; else if (prog.air === 'late') dir = ta < prog.lateAt ? 0 : d; else if (prog.air === 'stop') dir = ta < prog.revAt ? d : 0; else if (prog.air === 'stopgo') dir = ta < prog.a || ta > prog.b ? d : 0;
          if (prog.delayDir && ta < prog.delayDir) dir = 0;
        }
        if (prog.stand) dir = 0;
        inp.left = dir < 0; inp.right = dir > 0;
        for (const h of AP.hooks) h(prog, t, b, inp);
        return inp;
      },
      progs(target, from) {
        const out = [], dirs = target[0] > from[0] ? [1, -1, 0] : target[0] < from[0] ? [-1, 1, 0] : [0, 1, -1];
        if (target[1] === from[1]) out.push({ walkTo: target[0] * 32 + 16, dir: 0 });
        const Ar = S().area;
        for (const dir of dirs) {
          out.push({ dir, noJump: true, air: 'dir' });
          for (const lateAt of [0.5, 1.0, 1.6, 2.4]) out.push({ dir, noJump: true, air: 'late', lateAt0: 0.25, lateAt });
          out.push({ dir, noJump: true, air: 'rev', revAt: 0.35 }, { dir, noJump: true, air: 'rev', revAt: 0.6 });
          out.push({ dir, drop: true }, { dir: 0, drop: true });
          if (dir) for (const a of [0.2, 0.35, 0.5, 0.7]) for (const bb of [0.8, 1.2, 1.7, 2.3, 3.0]) { out.push({ dir, noJump: true, air: 'stopgo', a, b: bb }); for (const hold of [0.2, 3]) out.push({ dir, run: 0, hold, air: 'stopgo', a, b: bb }); }
          for (const run of [0, 0.12, 0.3, 0.6, 1.0]) for (const hold of [0.06, 0.1, 0.16, 0.22, 0.3, 0.45, 0.7, 3]) {
            out.push({ dir, run, hold, air: 'dir' });
            if (dir) out.push({ dir, run, hold, air: 'none' }, { dir, run, hold, air: 'rev', revAt: 0.3 }, { dir, run, hold, air: 'rev', revAt: 0.6 }, { dir, run, hold, air: 'stop', revAt: 0.4 });
            if (hold >= 0.7) for (const lateAt of [0.4, 0.9, 1.5]) out.push({ dir, run, hold, air: 'late', lateAt });
          }
        }
        // run to the edge of this ground and jump just before it
        const A = S().area, Tt = window.BRADY.T, SOL = window.BRADY.SOLID;
        const stand = (x, y) => { const t2 = x >= 0 && x < A.W ? A.tiles[y * A.W + x] : Tt.HARD; return (SOL[t2] || t2 === Tt.SEMI) && !SOL[A.tiles[(y - 1) * A.W + x]] && !SOL[A.tiles[(y - 2) * A.W + x]]; };
        for (const dir of [1, -1]) {
          let x = from[0]; while (stand(x + dir, from[1]) && Math.abs(x - from[0]) < 40) x += dir;
          if (x === from[0]) continue;
          const edge = dir > 0 ? (x + 1) * 32 : x * 32;
          for (const off of [4, 12, 22]) for (const hold of [0.1, 0.16, 0.22, 0.3, 0.45, 0.7, 3]) {
            const jumpAtX = edge - dir * off;
            out.push({ dir, jumpAtX, hold, air: 'dir' }, { dir, jumpAtX, hold, air: 'none' }, { dir, jumpAtX, hold, air: 'rev', revAt: 0.4 });
            for (const a of [0.2, 0.4]) for (const bb of [0.9, 1.5, 2.2]) out.push({ dir, jumpAtX, hold, air: 'stopgo', a, b: bb });
          }
        }
        for (const p of AP.extra) for (const q of p(target, from)) out.push(q);
        return out;
      },
      extra: [],
      bad(b, A, t) {
        return false;
      },
      body(p) {
        const b = {}; for (const k of ['x', 'y', 'w', 'h', 'vx', 'vy', 'onGround', 'coyote', 'jumpBuf', 'jumping', 'runT', 'airMax', 'facing', 'groundTile', 'groundTx', 'groundTy', 'dropT', 'flipped', 'liftPin', 'liftStill', 'liftPx', 'liftOff']) b[k] = p[k] && typeof p[k] === 'object' ? JSON.parse(JSON.stringify(p[k])) : p[k];
        b.crouch = false; b.inWater = false; b.stroke = 0; b.ride = null; b.sim = true; return b;
      },
      // simulate a program from Brady's current state on the live area; where does he settle?
      trial(prog, maxT) {
        const g = S(), A = g.area, b = AP.body(P()), dt = 1 / 120;
        let t = 0, air = false, landT = null; prog._jt = null; prog._s = {};
        while (t < (maxT || 6)) {
          const inp = AP.input(prog, t, b);
          if (landT != null) { inp.left = inp.right = false; inp.jump = inp.jumpPressed = false; inp.down = false; }
          // the player's own drop-through (11_player.js): down + jump on a one-way floor
          if (inp.down && inp.jumpPressed && b.onGround && b.groundTile === window.BRADY.T.SEMI) { b.dropT = 0.22; b.y += 2; b.onGround = false; inp.jumpPressed = false; }
          window.BRADY_PST.phys(b, inp, A, dt, null, {});
          if (AP.after) AP.after(b, inp, A, dt);
          t += dt;
          if (b.y > A.H * 32 + 20 || window.BRADY_PST.lavaContact(b, A) || window.BRADY_PST.spikeContact(b, A)) return null;
          if (AP.bad && AP.bad(b, A, t)) return null;
          if (!b.onGround) air = true;
          if (prog.walkTo != null) { if (b.onGround && !air && Math.abs(b.x + b.w / 2 - prog.walkTo) <= 8 && Math.abs(b.vx) < 4) return { tx: Math.floor((b.x + b.w / 2) / 32), ty: b.groundTy, t, flipped: !!b.flipped }; continue; }
          if (b.onGround && (air || (prog.noJump && prog.air !== 'stopgo') || prog.stand) && landT == null && t > 0.05) { landT = t; prog._landTx = Math.floor((b.x + b.w / 2) / 32); prog._landTy = b.groundTy; }
          if (landT != null && Math.abs(b.vx) < 4 && b.onGround) return { tx: Math.floor((b.x + b.w / 2) / 32), ty: b.groundTy, t, flipped: !!b.flipped, landTx: prog._landTx, landTy: prog._landTy };
        }
        return null;
      },
      // is tile x on the same stretch of floor as the target (walkable between them)?
      samePlate(x, target, tol) {
        if (Math.abs(x - target[0]) <= (tol != null ? tol : 1)) return true;
        if (target[2]) return false;
        const A = S().area, Tt = window.BRADY.T, SOL = window.BRADY.SOLID, y = target[1];
        const st = xx => { const t2 = A.tiles[y * A.W + xx]; return (SOL[t2] || t2 === Tt.SEMI) && !SOL[A.tiles[(y - 1) * A.W + xx]] && !SOL[A.tiles[(y - 2) * A.W + xx]]; };
        const d = Math.sign(target[0] - x); for (let xx = x; xx !== target[0]; xx += d) if (!st(xx)) return false;
        return st(target[0]);
      },
      plan(target, o) {
        o = o || {};
        const p = P(), from = [Math.floor(p.cx / 32), p.groundTy];
        let best = null;
        for (const prog of AP.progs(target, from)) {
          if (o.jump && (prog.walkTo != null || prog.noJump || prog.drop)) continue;
          if (prog.run == null) prog.run = 0;
          const r = AP.trial(prog, o.maxT);
          if (!r) continue;
          const okY = r.ty === target[1] && (!!target[2] === r.flipped);
          if (!okY || (o.jump ? (r.landTx !== target[0] || r.landTy !== target[1]) : !AP.samePlate(r.tx, target, o.tol))) continue;
          const score = r.t + Math.abs(r.tx - target[0]) * 0.3;
          if (!best || score < best.score) best = { prog, score, r };
        }
        return best;
      },
      // play a program in the real game with real inputs, frame by frame; then let him settle
      exec(prog, maxT) {
        const g = S(), I = window.BRADY.Input, dt = 1 / 120; let t = 0, landed = false, air = false; prog._jt = null; prog._s = {};
        const keys = ['left', 'right', 'up', 'down', 'jump', 'jumpPressed', 'action', 'actionPressed'];
        while (t < (maxT || 6)) {
          const p = P(); if (!p || p.dead || g.state !== 'play') break;
          const inp = AP.input(prog, t, p);
          if (landed) { inp.left = inp.right = inp.jump = inp.jumpPressed = inp.down = false; }
          for (const k of keys) I[k] = !!inp[k];
          if (inp.down) I.downPressed = t < dt;
          g.update(dt);
          I.jumpPressed = false; I.actionPressed = false; I.downPressed = false; I.upPressed = false;
          t += dt;
          if (!p.onGround) air = true;
          if (prog.walkTo != null) { if (p.onGround && Math.abs(p.cx - prog.walkTo) <= 8 && Math.abs(p.vx) < 4) break; continue; }
          if (p.onGround && (air || (prog.noJump && prog.air !== 'stopgo') || prog.stand) && t > 0.05) landed = true;
          if (landed && Math.abs(p.vx) < 4 && p.onGround) break;
        }
        for (const k of keys) I[k] = false;
        const p = P(), gone = g.state === 'tally' || g.state === 'clear' || g.state === 'results'; return { tx: Math.floor(p.cx / 32), ty: p.groundTy, flipped: !!p.flipped, dead: !gone && !!(p.dead || g.state !== 'play'), exit: gone ? g.exitKey || 'main' : null, area: g.area.aid };
      },
      // hop to a standing tile [x, row(, flipped)]: plan, play, re-plan if he ended up elsewhere
      go(target, o) {
        o = Object.assign({ tol: 0 }, o || {});
        for (let tries = 0; tries < 3; tries++) {
          let pl = AP.plan(target, o);
          // no plan from exactly here: step to the middle of this tile, or a tile either side, and look again
          if (!pl) { const f = tileOf(), back = -(Math.sign(target[0] - f[0]) || 1); for (const dx of [0, -1, 1, -2, 2, 3 * back, 5 * back, 7 * back]) { if (P().flipped) break; if (dx && !AP.samePlate(f[0] + dx, [f[0], f[1]])) continue; AP.exec({ walkTo: (f[0] + dx) * 32 + 16, dir: 0 }, 3); if (tileOf()[1] !== f[1]) break; pl = AP.plan(target, o); if (pl) break; } }
          if (!pl) return { ok: false, why: 'no plan', from: tileOf(), target };
          const r = AP.exec(pl.prog, o.maxT);
          if (r.dead) return { ok: false, why: 'died', r, prog: pl.prog, target };
          if (r.exit) return { ok: true, r, exit: r.exit };
          if (o.jump) return { ok: true, r, prog: pl.prog };
          if (o.area && r.area !== o.area) return { ok: false, why: 'area', r };
          if (r.ty === target[1] && Math.abs(r.tx - target[0]) <= (o.tol != null ? o.tol : 1)) return { ok: true, r, prog: pl.prog };
          if (r.ty === target[1] && AP.samePlate(r.tx, target)) { AP.exec({ walkTo: target[0] * 32 + 16, dir: 0 }, 4); const t2 = tileOf(); if (Math.abs(t2[0] - target[0]) <= (o.tol || 0)) return { ok: true, r, prog: pl.prog }; }
        }
        return { ok: false, why: 'off target', at: tileOf(), target };
      },
      route(list, o) {
        const done = [];
        for (const tg of list) {
          if (typeof tg === 'function') { tg(); continue; }
          const r = AP.go(tg, o);
          if (!r.ok) return { ok: false, at: done.length, fail: r, done };
          done.push(tg);
        }
        return { ok: true, n: done.length };
      }
    };
    // a whole area as one picture: the camera steps across it, each view is drawn without the HUD and copied in
    window.panorama = (k) => {
      const g = S(), G = window.BRADY.Game, A = g.area, VW = G.viewW, VH = G.viewH, Sc = G.S, gx = G.gameRect.x * G.dpr, gy = G.gameRect.y * G.dpr;
      k = k || 0.5;
      const W = Math.ceil(A.W * 32 * k), H = Math.ceil(A.H * 32 * k);
      const big = document.createElement('canvas'); big.width = W; big.height = H; const bx = big.getContext('2d');
      const save = { hud: g.drawHUD, toast: g.drawToast, tut: g.drawTutorial, ctl: window.BRADY.Input.drawControls, camX: g.camX, camY: g.camY, shake: g.shakeAmt };
      g.drawHUD = () => {}; g.drawToast = () => {}; g.drawTutorial = () => {}; window.BRADY.Input.drawControls = () => {}; g.shakeAmt = 0;
      for (let cy = 0; cy < A.H * 32; cy += VH) for (let cx = 0; cx < A.W * 32; cx += VW) {
        g.camX = Math.min(cx, Math.max(0, A.W * 32 - VW)); g.camY = Math.min(cy, Math.max(0, A.H * 32 - VH));
        G.ctx.setTransform(1, 0, 0, 1, 0, 0); g.draw(G.ctx);
        bx.drawImage(G.canvas, gx, gy, VW * Sc, VH * Sc, g.camX * k, g.camY * k, VW * k, VH * k);
      }
      g.drawHUD = save.hud; g.drawToast = save.toast; g.drawTutorial = save.tut; window.BRADY.Input.drawControls = save.ctl; g.camX = save.camX; g.camY = save.camY; g.shakeAmt = save.shake;
      return big.toDataURL('image/png');
    };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); if (checksOnly) return; await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, name) }); };
  const pano = async (name, k) => { if (checksOnly) return; await pin(); const url = await page.evaluate(kk => panorama(kk), k || 0.5); fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64')); };
  const run = async (name, f) => { if (want.length && !want.some(w => name.startsWith(w))) return; try { await pin(); await f(); } catch (e) { check(name + ' runs', false, String(e.message).slice(0, 300)); } };
  await fn(page, shot, run, pano);
  check(`${viewport.width}x${viewport.height}: no page errors`, !errors.length, errors.slice(0, 5));
  await browser.close();
}

// the land's own moves, with real buttons: a thought's lift (JUMP on a cushion, walk `walk` for `walkT` s, wait for
// the pop, steer `air` from `airAt` s after the lift until he lands)
const HELPERS = `(() => {
  window.lift = o => {
    const p = P(); sim(1 / 120, { jump: true, jumpPressed: true }); sim(1 / 120);
    let t = 0; while (t < 2.4 && !(p.pstLifted > 0)) { const d = t < (o.walkT || 0) ? o.walk : 0; sim(1 / 120, { left: d < 0, right: d > 0 }); t += 1 / 120; }
    if (!(p.pstLifted > 0)) return { ok: false, why: 'no lift', at: tileOf(), t };
    let ta = 0; const y0 = p.y; let top = p.y;
    while (ta < 3.5 && !(p.onGround && ta > 0.15)) { const d = ta > (o.airAt != null ? o.airAt : 0.3) ? o.air : 0; sim(1 / 120, { left: d < 0, right: d > 0 }); ta += 1 / 120; top = Math.min(top, p.y); }
    sim(0.25);
    const at = tileOf(); return { ok: !o.to || (at[0] === o.to[0] && at[1] === o.to[1]) || (o.tol && Math.abs(at[0] - o.to[0]) <= o.tol && at[1] === o.to[1]), at, rise: +((y0 - top) / 32).toFixed(2), t: +t.toFixed(2) };
  };
  window.walkTo = (tx, maxT) => AP.exec({ walkTo: tx * 32 + 16, dir: 0 }, maxT || 4);
  window.door = () => { const a0 = S().area.aid; for (let k = 0; k < 20 && S().area.aid === a0; k++) sim(0.1, { up: true, upPressed: true }); sim(1.2); return S().area.aid; };
})()`;
const LEVELS = {};

// ---------------- the hidden entrance: Nepal 12-1 ----------------
LEVELS.entrance = async (page, shot, run) => {
  await run('entrance', async () => {
    await page.evaluate(HELPERS);
    // BEFORE: the first terrace of 12-1: the bench, Pupo asleep, the cushion, the hollow in the rock (game scale)
    const r0 = await page.evaluate(() => { fresh(); play('12-1'); const T = window.BRADY_TOUR; const ef = T.TourProgress.exitsFound('12-1'); const s = S(); s.camX = 0; walkTo(3, 3); sim(0.2);
      const E = window.BRADY_PST.kit.entrance; const t0 = s.t % E.BREATH; return { ef, land: !!(T.TourProgress.data().lands.pst), q: +t0.toFixed(2), bench: ents('pstBench').length, hollow: ents('pstHollow').length }; });
    check('entrance: 12-1 has the bench and the hollow; its exit card still says 2 exits; the land is still shut', r0.bench === 1 && r0.hollow === 1 && r0.ef.total === 2 && !r0.land, r0);
    // wait for the moment of the extra lift (the clue) and take the picture then
    await page.evaluate(() => { const E = window.BRADY_PST.kit.entrance; for (let k = 0; k < 600 && Math.abs((S().t % E.BREATH) - (E.EXTRA0 + 0.25)) > 0.01; k++) sim(1 / 120); freeze(); });
    await shot('00-entrance-before-12-1-bench.png');
    // walking left into the hollow without waiting does nothing (no accidental way in)
    const r1 = await page.evaluate(() => { thaw(); const p = P(); const E = window.BRADY_PST.kit.entrance; for (let k = 0; k < 600 && (S().t % E.BREATH) > 0.3; k++) sim(1 / 120); sim(1.5, { left: true }); sim(0.4, { left: true }); return { state: S().state, x: tileOf()[0], pst: p.state }; });
    check('entrance: pushing into the hollow before the extra lift does nothing', r1.state === 'play' && r1.x === 0 && r1.pst === 'play', r1);
    // stand still in the hollow through the extra lift, then walk on in
    const r2 = await page.evaluate(() => {
      const E = window.BRADY_PST.kit.entrance, g = S(); sim(0.3);
      for (let k = 0; k < 900 && !(E.extra(g.t) > 0); k++) sim(1 / 120);
      for (let k = 0; k < 900 && E.extra(g.t) > 0; k++) sim(1 / 120);
      sim(0.1);
      const armed = ents('pstHollow')[0].armed; sim(0.6, { left: true });
      return { armed: +armed.toFixed(2), going: !!g.pstArrival };
    });
    check('entrance: standing still in the hollow through the cushion\'s extra lift, then walking in: Brady slips through', r2.armed > 0 && r2.going, r2);
    await page.evaluate(() => { sim(1.4); freeze(); }); await shot('01-entrance-arrival.png');
    const r3 = await page.evaluate(() => { thaw(); sim(3); const T = window.BRADY_TOUR, d = window.BRADY.Save.data; return { state: S().state, key: S().exitKey, land: !!T.TourProgress.data().lands.pst, unlocked: !!d.unlocked['32-1'], done12: !!d.done['12-1'], ef: T.TourProgress.exitsFound('12-1') }; });
    check('entrance: the clear opens the land (32-1 unlocked), through the exit "pst"; 12-1 is not marked done by it; its exit card now counts 3', r3.key === 'pst' && r3.land && r3.unlocked && !r3.done12 && r3.ef.total === 3 && r3.ef.found === 1, r3);
  });
};

// ---------------- 32-1 Hold That Thought ----------------
LEVELS.s1 = async (page, shot, run, pano) => {
  await run('s1', async () => {
    await page.evaluate(HELPERS);
    await page.evaluate(() => { fresh(); play('32-1'); place(4, 18); sim(0.4); freeze(); }); await shot('10-32-1-start.png');
    // a cushion eats the jump; JUMP plants a thought; it stretches up; one breath later it lifts about seven tiles
    const r = await page.evaluate(() => {
      thaw(); place(13, 18); sim(0.3); const p = P(), y0 = p.y;
      sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.2, { jump: true }); const noJump = p.onGround && Math.abs(p.y - y0) < 2;
      const th = ents('PstThought').length; return { noJump, th };
    });
    check('32-1: on a cushion JUMP does not jump: it plants a thought bubble', r.noJump && r.th === 1, r);
    await page.evaluate(() => { sim(0.75); freeze(); }); await shot('11-32-1-thought-stretch.png');
    const r2 = await page.evaluate(() => { thaw(); const p = P(), y0 = p.y; let top = y0, t = 0; while (t < 2 && !(p.pstLifted > 0)) { sim(1 / 120); t += 1 / 120; } const t1 = t; while (t < 3.5) { sim(1 / 120); t += 1 / 120; top = Math.min(top, p.y); if (p.onGround && t > t1 + 0.2) break; } return { liftAt: +(t1 + 0.95).toFixed(2), rise: +((y0 - top) / 32).toFixed(2), back: tileOf() }; });
    check('32-1: one full breath later (about 1.4 s) the thought pops and lifts Brady six to seven and a half tiles; a miss lands on the cushion below', r2.liftAt > 1.2 && r2.liftAt < 1.7 && r2.rise > 6 && r2.rise < 7.6 && r2.back[1] === 19 && r2.back[0] >= 12 && r2.back[0] <= 15, r2);
    // the route, with real inputs: the teach ledge, the floating ledge with P1, think-then-walk under the spikes,
    // the cushion stair, the fort's corridor, the two tunnels (the twist), the gate
    const leg = await page.evaluate(() => {
      play('32-1'); place(13, 18); sim(0.3); const out = {};
      out.a = lift({ walk: 0, air: 1, airAt: 0, to: [17, 14], tol: 2 });
      if (!out.a.ok) return out;
      out.b = AP.route([[30, 19], [42, 19]]); if (!out.b.ok) return out;
      out.c = lift({ walk: 0, air: 1, airAt: 0, to: [46, 13], tol: 3 }); if (!out.c.ok) return out;
      out.d = AP.route([[52, 19], [60, 19]]); if (!out.d.ok) return out;
      out.e = lift({ walk: 1, walkT: 1.6, air: 1, airAt: 0, to: [71, 13], tol: 3 }); if (!out.e.ok) return out;
      out.f = AP.route([[82, 19], [97, 19]]); if (!out.f.ok) return out;
      out.g = lift({ walk: 0, air: 1, airAt: 0, to: [101, 14], tol: 1 }); if (!out.g.ok) return out;
      out.h = lift({ walk: 0, air: 1, airAt: 0, to: [106, 9], tol: 3 }); if (!out.h.ok) return out;
      out.i = AP.route([[113, 19], [119, 19], [127, 19], [140, 19], [158, 19], [164, 19]]); if (!out.i.ok) return out;
      return out;
    });
    check('32-1 played: the teach lift onto the ledge, the floating ledge (P1), think-then-walk out from under the spikes, the cushion stair, the fort corridor', leg.i && leg.i.ok, leg);
    await page.evaluate(() => freeze()); await shot('12-32-1-tunnel.png');
    const leg2 = await page.evaluate(() => {
      thaw(); const out = {};
      out.a = lift({ walk: 1, walkT: 1.6, air: 1, airAt: 0, to: [175, 13], tol: 4 }); if (!out.a.ok) return out;
      out.b = AP.route([[186, 19], [198, 19]]); if (!out.b.ok) return out;
      out.c = lift({ walk: 1, walkT: 1.6, air: 1, airAt: 0, to: [210, 13], tol: 3 }); if (!out.c.ok) return out;
      out.d = AP.route([[215, 13], [228, 19]]); if (!out.d.ok) return out;
      sim(3, { right: true }); return Object.assign(out, { state: S().state, key: S().exitKey });
    });
    check('32-1 played: the twist: think inside the tunnel, walk out, the lift fires on the far side (twice), on to the gate', leg2.state && leg2.state !== 'play', leg2);
    // a lift that pops inside the spiked tunnel hurts (the twist's danger); in the plain tunnel it only bonks
    const sp = await page.evaluate(() => { play('32-1'); place(198, 18); sim(0.4); const p = P(); p.invuln = 0; const pw = p.power; sim(1 / 120, { jump: true, jumpPressed: true }); sim(2.4); const hurt = p.power !== pw || p.invuln > 0; p.invuln = 999;
      play('32-1'); place(164, 18); sim(0.4); const p2 = P(); p2.invuln = 0; const pw2 = p2.power; sim(1 / 120, { jump: true, jumpPressed: true }); sim(2.4); const bonk = p2.power === pw2 && tileOf()[1] === 19; p2.invuln = 999; return { hurt, bonk }; });
    check('32-1: a lift that pops under the spiked tunnel hurts; under the plain shelf it just bonks back down', sp.hurt && sp.bonk, sp);
    await page.evaluate(() => { play('32-1'); place(124, 18); sim(1.2); freeze(); }); await shot('13-32-1-fort-gap-tell.png');
    await page.evaluate(() => { thaw(); play('32-1'); place(100, 13); sim(0.3); freeze(); }); await shot('14-32-1-cushion-stair.png');
    await page.evaluate(() => { thaw(); play('32-1'); }); await pano('15-32-1-panorama.png', 0.35);
  });
};

(async () => {
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => {
    for (const k in LEVELS) if (k !== 'entrance') await LEVELS[k](page, shot, run, pano);
  });
  // (Nepal's atlas sprites taint the canvas for panoramas: the entrance gets its own browser)
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => { await LEVELS.entrance(page, shot, run, pano); });
  console.log(failures ? `${failures} PST CHECK(S) FAILED` : 'ALL PST CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
