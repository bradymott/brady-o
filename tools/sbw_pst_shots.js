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
  // a careful walk along a floor: hold the stick; a critter (or a shot) ahead on Brady's level gets a full jump over
  // it (or a stomp); stops on tile tx (or at the gate's results)
  window.safeWalk = (tx, maxT) => {
    const g = S(); let t = 0, jt = 0;
    while (t < (maxT || 14)) {
      const p = P(); if (S() !== g || !p || p.dead) return { ok: false, why: 'died', at: p ? tileOf() : null };
      if (g.state !== 'play') return { ok: true, state: g.state };
      const dx = tx * 32 + 16 - p.cx, d = Math.sign(dx);
      if (Math.abs(dx) < 12 && p.onGround) { sim(0.15); return { ok: true, at: tileOf() }; }
      const en = g.entities.find(e => e.enemy && !e.dead && !e.remove && (e.cx - p.cx) * d > -4 && (e.cx - p.cx) * d < 3.2 * 32 && Math.abs(e.cy - p.cy) < 1.6 * 32);
      let inp = { left: d < 0, right: d > 0 };
      if (en && p.onGround && jt <= 0) { inp.jump = true; inp.jumpPressed = true; jt = 0.35; }
      else if (jt > 0) inp.jump = true;
      jt -= 1 / 120; sim(1 / 120, inp); t += 1 / 120;
    }
    return { ok: false, why: 'slow', at: tileOf() };
  };
  window.yawnAt = (tx, side, maxT) => {
    walkTo(tx, 4); const m = ents('PstMouth').sort((a, b) => Math.abs(a.cx - tx * 32) - Math.abs(b.cx - tx * 32))[0]; let t = 0;
    while (t < (maxT || 10) && m.own !== side && !P().dead) { sim(1 / 120); t += 1 / 120; }
    return { ok: m.own === side, at: tileOf(), t: +t.toFixed(1) };
  };
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


// a secret room: the win (the kind's own scripted play, with the game's real buttons), a miss first, the cage, the
// way out (it must lead somewhere else than the way in)
const ROOM_FAIL = {
  pstKnock: `(() => { const R = S().area.roomState, k = S().area.roomKit, p = P(); place(k.data.mark, 10); sim(0.3); sim(1 / 120, { action: true, actionPressed: true }); sim(0.3); const K0 = window.BRADY_TOUR.TourRooms || null; R.aim = -Math.PI * 0.5; for (let q = 0; q < 1440 && window.ROOMK.pstKnock.lamb(k, R.lambT).at === 1; q++) sim(1 / 120); sim(1 / 120, { action: true, actionPressed: true }); sim(1.2); return { won: R.won, next: R.next }; })()`,
  pstCore: `(() => { const R = S().area.roomState, k = S().area.roomKit; place(k.data.mark, 10); sim(0.3); sim(1 / 120, { action: true, actionPressed: true }); sim(0.2); const B = window.ROOMK.pstCore.bubbles(k, R); const far = Math.max(...B.map(b => b.x)) + 60; for (let q = 0; q < 600 && R.px < far; q++) sim(1 / 120, { right: true }); sim(1 / 120, { action: true, actionPressed: true }); sim(1.5); return { won: R.won }; })()`,
  pstTray: `(() => { const R = S().area.roomState, k = S().area.roomKit; place(k.data.mark, 10); sim(0.3); sim(1 / 120, { action: true, actionPressed: true }); let reset = false; for (let q = 0; q < 1440 && !reset; q++) { const m0 = R.mugs; sim(1 / 120, { right: true }); if (R.mugs !== m0) reset = true; } sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.3); return { won: R.won, reset }; })()`,
  pstCaps: `(() => { const R = S().area.roomState, k = S().area.roomKit; place(k.data.mark, 10); sim(0.3); sim(1 / 120, { action: true, actionPressed: true }); let missed = false; for (let q = 0; q < 1440 && !missed; q++) { sim(1 / 120, { left: true }); if (S().bannerT > 0 && /MISSED|TOPPLED/.test(S().bannerText || '')) missed = true; } sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.3); return { won: R.won, missed }; })()`,
  pstPour: `(() => { const R = S().area.roomState, k = S().area.roomKit; place(k.data.mark, 10); sim(0.3); sim(1 / 120, { action: true, actionPressed: true }); let spilt = false; for (let q = 0; q < 1440 && !spilt; q++) { sim(1 / 120, { right: true }); if (R.done != null) spilt = true; } sim(1.6); sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.3); return { won: R.won, spilt }; })()`,
  pstPrivacy: `(() => { const R = S().area.roomState, k = S().area.roomKit; place(k.data.mark, 10); sim(0.3); let woke = false; for (let q = 0; q < 900 && !woke; q++) { sim(1 / 120, { action: true, right: R.pstGrip != null }); if (R.wake > 0) woke = true; } sim(1.5); return { won: R.won, woke }; })()`
};
async function roomRun(page, shot, label, enter) {
  const r0 = await page.evaluate(enter);
  check(label + ': the way in, played: ' + (r0.how || ''), r0.ok, r0);
  if (!r0.ok) return;
  const info = await page.evaluate(() => { sim(1.2); const A = S().area; return { aid: A.aid, kind: A.roomKit && A.roomKit.kind, banner: S().bannerText }; });
  await page.evaluate(() => freeze()); await shot(label + '-room.png'); await page.evaluate(() => thaw());
  const f = await page.evaluate(ROOM_FAIL[info.kind]);
  check(label + ' (' + info.kind + '): a miss resets that turn, no prize', !f.won && (f.next === 0 || f.reset || f.missed || f.spilt || f.woke || f.won === false), f);
  const w = await page.evaluate(() => { const g = S(), A = g.area, R = A.roomState, kit = A.roomKit; window.ROOMK[kit.kind].testWin(g, A, R, kit, (g2, keys) => sim(1 / 120, keys || {})); sim(0.6); const cage = g.entities.find(e => e.constructor.name === 'TourRoomCage'); return { won: R.won, cageOpen: cage ? cage.tiles.every(([x, y]) => g.area.tiles[y * g.area.W + x] === window.BRADY.T.EMPTY) : null }; });
  check(label + ' (' + info.kind + '): won once with the real buttons; the prize cage opens at the win', w.won && w.cageOpen !== false, w);
  await page.evaluate(() => freeze()); await shot(label + '-room-won.png'); await page.evaluate(() => thaw());
  const out = await page.evaluate(([inX]) => { const g = S(), d = g.entities.find(e => e.constructor.name === 'Portal' && e.target); const k0 = g.area.idx; place(Math.floor(d.cx / 32), Math.floor((d.y + d.h - 1) / 32)); sim(0.2); const aid = door(); return { aid, x: tileOf()[0], inX, elsewhere: aid !== g.level.areas[k0].aid && Math.abs(tileOf()[0] - inX) > 3 }; }, [r0.inX]);
  check(label + ': its door takes Brady back out somewhere else than where he came in', out.elsewhere, out);
}
const ROOMK = `(() => { window.ROOMK = {}; const L = window.BRADY_TOUR.TourRooms || null; })()`;

// ---------------- 32-1's room: up through the gap in the cushion fort ----------------
LEVELS.r1 = async (page, shot) => { await run0(page, 'r1', () => roomRun(page, shot, '16-32-1-B31', () => {
  play('32-1'); place(119, 18); sim(0.3); const r = AP.route([[123, 19]]); if (!r.ok) return { ok: false, r };
  const l = lift({ walk: 0, air: 1, airAt: 0.3, to: [127, 14], tol: 3 }); if (!l.ok) return { ok: false, l, how: 'lift' };
  const r2 = AP.route([[140, 14], [150, 14]]); if (!r2.ok) return { ok: false, r2 };
  const aid = door(); return { ok: aid === 'forts', aid, inX: 150, how: 'a thought lifts Brady up through the gap; along the fort roof to the nook' }; })); };
// ---------------- 32-2's room: down the gap in the soft pit's floor ----------------
LEVELS.r2 = async (page, shot) => { await run0(page, 'r2', () => roomRun(page, shot, '26-32-2-B32', () => {
  play('32-2'); place(56, 20); sim(0.3); const A = S().area; const E = window.BRADY_PST.kit.blinkState;
  // wait for the lid to be open, then walk off the edge into the pit and into the gap
  for (let q = 0; q < 1200 && E(A, 0, A.pstBlinkT || 0).shut; q++) sim(1 / 120);
  const r = AP.route([[60, 24], [61, 27]]); if (!r.ok) return { ok: false, r };
  const aid = door(); return { ok: aid === 'lab', aid, inX: 61, how: 'into the pit while the lid is open, down the gap in its floor' }; })); };
// ---------------- 32-3's room: walk into the soft patch in the cushion wall ----------------
LEVELS.r3 = async (page, shot) => { await run0(page, 'r3', () => roomRun(page, shot, '36-32-3-B33', () => {
  play('32-3'); place(112, 18); sim(0.3); sim(1.5, { right: true }); walkTo(119, 2); const t = tileOf(); const aid = door(); return { ok: aid === 'kitchen', aid, t, inX: 119, how: 'walk into the soft patch in the wall' }; })); };
// ---------------- 32-4's room: hold the very quick lift at its top ----------------
LEVELS.r4 = async (page, shot) => { await run0(page, 'r4', () => roomRun(page, shot, '46-32-4-B34', () => {
  play('32-4'); place(121, 18); sim(0.3); const p = P();
  sim(0.9, { action: true }); const banked = !!p.pstSecond;
  const lift = ents('mplat').find(e => Math.abs(e.x / 32 - 124) < 1.5); if (!lift) return { ok: false, why: 'no lift' };
  // hop on at the bottom, ride up, spend the second at the top, step off onto the nook
  for (let q = 0; q < 1200 && !(lift.y > 18.4 * 32); q++) sim(1 / 120);
  const r = AP.go([125, 19], { tol: 1 }); let rode = 0; for (let q = 0; q < 600 && !(lift.y < 10.6 * 32); q++) { sim(1 / 120); rode++; }
  sim(1 / 120, { action: true, actionPressed: true }); const held = lift.freeze > 0;
  sim(0.1); const r2 = AP.route([[129, 9]]); walkTo(130, 2); const aid = door();
  return { ok: banked && held && aid === 'nursery', banked, held, aid, r, r2, inX: 130, how: 'bank a second, ride the quick lift, hold it at the top' }; })); };
// ---------------- 32-5's room: think of the ladder, climb it through the ceiling gap ----------------
LEVELS.r5 = async (page, shot) => { await run0(page, 'r5', () => roomRun(page, shot, '56-32-5-B35', () => {
  play('32-5'); place(91, 18); sim(0.3); const p = P();
  // jump into the ladder bubble (a real jump)
  sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.5, { jump: true }); sim(0.8); const on = S().toggleBit(2);
  const r = AP.route([[96, 17], [97, 15], [96, 13], [97, 11], [101, 11], [110, 19], [116, 17], [117, 15], [116, 13], [117, 11], [119, 9]]); walkTo(120, 2); const aid = door();
  return { ok: on && aid === 'pantry', on, r, aid, inX: 120, how: 'think of the ladder, climb it up through the gap in the ceiling' }; })); };
// ---------------- 32-6's room: drop through the soft patch in the study floor ----------------
LEVELS.r6 = async (page, shot) => { await run0(page, 'r6', () => roomRun(page, shot, '66-32-6-PRIVACY', () => {
  play('32-6'); place(27, 15); sim(0.3); const r = AP.route([[30, 19]]); const aid = door(); return { ok: aid === 'bedroom', aid, r, inX: 30, how: 'drop through the soft patch in the floor' }; })); };
async function run0(page, name, f) { if (want.length && !want.some(w => name.startsWith(w))) return; try { await page.evaluate(HELPERS); await page.evaluate(() => { window.ROOMK = window.BRADY_TOUR.TourRooms ? window.BRADY_TOUR.TourRooms.kinds : (window.TourRoomsKinds || {}); }); await f(); } catch (e) { check(name + ' runs', false, String(e.message).slice(0, 300)); } }


// ---------------- 32-2 The Long Blink ----------------
LEVELS.s2 = async (page, shot, run, pano) => {
  await run('s2', async () => {
    await page.evaluate(HELPERS);
    const r = await page.evaluate(() => {
      fresh(); play('32-2'); place(12, 20); sim(0.3); const A = S().area, E = window.BRADY_PST.kit.blinkState;
      // the lid bridge: walk across while the eye is shut (wait for a fresh blink)
      for (let q = 0; q < 1500 && E(A, 0, A.pstBlinkT).shut; q++) sim(1 / 120);
      for (let q = 0; q < 1500 && !E(A, 0, A.pstBlinkT).shut; q++) sim(1 / 120);
      const shutTiles = A.tiles[21 * A.W + 17] === window.BRADY.T.SEMI;
      const a = AP.route([[22, 21]]);
      // the ladder: climb the lashes while shut
      const b = AP.route([[27, 21]]); for (let q = 0; q < 1500 && E(A, 0, A.pstBlinkT).shut; q++) sim(1 / 120); for (let q = 0; q < 1500 && !E(A, 0, A.pstBlinkT).shut; q++) sim(1 / 120);
      const c = AP.route([[28, 19], [29, 17], [28, 15], [31, 13]]);
      return { shutTiles, a, b, c, at: tileOf() };
    });
    check('32-2 played: across the shut lid, up the lash ladder while the eye is shut, onto the wall (P1 above)', r.shutTiles && r.a.ok && r.c.ok, r);
    await page.evaluate(() => { play('32-2'); place(26, 20); const A = S().area, E = window.BRADY_PST.kit.blinkState; for (let q = 0; q < 1500 && !E(A, 0, A.pstBlinkT).shut; q++) sim(1 / 120); sim(0.6); freeze(); }); await shot('20-32-2-ladder-shut.png');
    const o = await page.evaluate(() => { thaw(); const A = S().area, E = window.BRADY_PST.kit.blinkState; let warnLead = null; for (let q = 0; q < 1500 && E(A, 0, A.pstBlinkT).shut; q++) { if (warnLead == null && E(A, 0, A.pstBlinkT).warn) warnLead = S().t; sim(1 / 120); } const t1 = S().t; return { lead: warnLead == null ? null : +(t1 - warnLead).toFixed(2), gone: A.tiles[17 * A.W + 28] !== window.BRADY.T.SEMI }; });
    check('32-2: the inner lashes tremble at least half a second before the eye opens, then let go', o.lead >= 0.5 && o.gone, o);
    await page.evaluate(() => { play('32-2'); place(78, 20); const A = S().area, E = window.BRADY_PST.kit.blinkState; for (let q = 0; q < 1500 && E(A, 1, A.pstBlinkT).shut; q++) sim(1 / 120); sim(0.3); freeze(); }); await shot('21-32-2-lid-open.png');
    await page.evaluate(() => { thaw(); play('32-2'); place(150, 8); sim(0.4); freeze(); }); await shot('22-32-2-last-blink.png');
    // the twist: down the outer lashes, across the last lid before it opens
    const t = await page.evaluate(() => { thaw(); play('32-2'); place(150, 8); sim(0.3); const A = S().area, E = window.BRADY_PST.kit.blinkState;
      const d = AP.route([[153, 11], [154, 13], [153, 15], [154, 17]]); if (!d.ok) return { d };
      for (let q = 0; q < 1500 && E(A, 1, A.pstBlinkT).shut; q++) sim(1 / 120); for (let q = 0; q < 1500 && !E(A, 1, A.pstBlinkT).shut; q++) sim(1 / 120);
      const e = AP.route([[157, 19], [166, 19]]); if (!e.ok) return { d, e }; sim(4, { right: true }); return { d, e, state: S().state }; });
    check('32-2 played: the twist: down the short outer lashes, across the long lid before it opens, to the gate', t.e && t.e.ok && t.state !== 'play', t);
    await page.evaluate(() => { play('32-2'); }); await pano('23-32-2-panorama.png', 0.3);
  });
};
// ---------------- 32-3 Half a Yawn ----------------
LEVELS.s3 = async (page, shot, run, pano) => {
  await run('s3', async () => {
    await page.evaluate(HELPERS);
    const r = await page.evaluate(() => {
      fresh(); play('32-3'); place(18, 18); sim(0.3); const m = ents('PstMouth')[0], g = S();
      sim(0.2); const sel = m.sel; for (let q = 0; q < 900 && m.own !== 1; q++) sim(1 / 120); const own = m.own;
      const a = AP.route([[23, 16], [27, 13]]);
      return { sel, own, a };
    });
    check('32-3 played: stand on the right corner, the next yawn sends the feather right; onto it and up the wall', r.sel === 1 && r.own === 1 && r.a.ok, r);
    await page.evaluate(() => { play('32-3'); place(18, 18); sim(0.2); const m = ents('PstMouth')[0]; for (let q = 0; q < 900 && !m.fly; q++) sim(1 / 120); sim(0.5); freeze(); }); await shot('30-32-3-feather-flies.png');
    const t = await page.evaluate(() => { thaw(); play('32-3'); place(154, 18); sim(0.3); const m = ents('PstMouth').find(e => e.stuck);
      sim(4); const stuckStill = m.own == null;
      const b = AP.route([[150, 19]]); sim(0.3); const free = m.free; const c = AP.route([[154, 19]]); for (let q = 0; q < 900 && m.own !== 1; q++) sim(1 / 120);
      const d = AP.route([[161, 17], [168, 19], [176, 19]]); sim(3, { right: true }); return { stuckStill, free, own: m.own, d, state: S().state };
    });
    check('32-3 played: the twist: the caught feather stays put until the far cheek is stretched; then out over the pit and on to the gate', t.stuckStill && t.free && t.own === 1 && t.d.ok, t);
    await page.evaluate(() => { play('32-3'); place(151, 18); sim(1); freeze(); }); await shot('31-32-3-caught-feather.png');
    await page.evaluate(() => { thaw(); play('32-3'); }); await pano('32-32-3-panorama.png', 0.3);
  });
};
// ---------------- 32-4 Borrow a Second ----------------
LEVELS.s4 = async (page, shot, run, pano) => {
  await run('s4', async () => {
    await page.evaluate(HELPERS);
    const r = await page.evaluate(() => {
      fresh(); play('32-4'); place(12, 18); sim(0.3); const p = P();
      sim(0.3, { action: true }); const early = !!p.pstSecond; sim(0.5, { action: true }); const banked = !!p.pstSecond;
      const jaw = ents('PstJaw')[0]; walkTo(15, 2); sim(1 / 120, { action: true, actionPressed: true }); const held = jaw.freeze > 0, spent = !p.pstSecond;
      return { early, banked, held, spent };
    });
    check('32-4: holding THROW by the flower banks one second (not instantly); a tap by the jaw spends it: the jaw holds still', !r.early && r.banked && r.held && r.spent, r);
    await page.evaluate(() => { sim(0.4); freeze(); }); await shot('40-32-4-jaw-held.png');
    const t = await page.evaluate(() => { thaw(); play('32-4'); place(152, 18); sim(0.3); const p = P(); sim(0.9, { action: true }); const banked = !!p.pstSecond; const ru = ents('PstRuler')[0];
      const nob = (() => { const g = S(); return g.toggleBit(0); })(); walkTo(155, 2); sim(1 / 120, { action: true, actionPressed: true }); for (let q = 0; q < 240 && !S().toggleBit(0); q++) sim(1 / 120); const bridge = S().toggleBit(0);
      const a = AP.route([[166, 19], [170, 19]]); return { banked, nob, bridge, a };
    });
    check('32-4 played: the twist: a second spent on the ruler\'s near elbow lets its far end finish; across the bridge', t.banked && !t.nob && t.bridge && t.a.ok, t);
    await page.evaluate(() => { play('32-4'); place(152, 18); sim(0.3); sim(0.9, { action: true }); walkTo(155, 2); sim(1 / 120, { action: true, actionPressed: true }); sim(0.8); freeze(); }); await shot('41-32-4-ruler-bridge.png');
    await page.evaluate(() => { thaw(); play('32-4'); place(100, 18); sim(0.5); freeze(); }); await shot('42-32-4-ferry-lift.png');
    await page.evaluate(() => { thaw(); play('32-4'); }); await pano('43-32-4-panorama.png', 0.3);
  });
};
// ---------------- 32-5 One Thought at a Time ----------------
LEVELS.s5 = async (page, shot, run, pano) => {
  await run('s5', async () => {
    await page.evaluate(HELPERS);
    const r = await page.evaluate(() => {
      fresh(); play('32-5'); place(12, 18); sim(0.3); const g = S();
      sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.5, { jump: true }); sim(0.8); const stool = g.toggleBit(0) && !g.toggleBit(1);
      const a = AP.route([[24, 16], [29, 13]]); return { stool, a };
    });
    check('32-5 played: jump into the stool bubble: a step stool fills the next room; up it to the ledge', r.stool && r.a.ok, r);
    await page.evaluate(() => { freeze(); }); await shot('50-32-5-stool.png');
    const t = await page.evaluate(() => { thaw(); play('32-5'); place(135, 18); sim(0.3); const g = S();
      sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.5, { jump: true }); sim(0.8); const tub = g.toggleBit(0);
      const a = AP.route([[141, 16]]); if (!a.ok) return { tub, a };
      sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.4, { jump: true }); sim(0.8); const towel = g.toggleBit(1) && !g.toggleBit(0), at = tileOf();
      const b = AP.route([[146, 10], [150, 10]]); return { tub, towel, at, b };
    });
    check('32-5 played: the twist: the tub as a step, jump through the towel\'s bubble: the towel replaces the tub as the landing; on to the top', t.tub && t.towel && t.at[1] === 13 && t.b && t.b.ok, t);
    await page.evaluate(() => { freeze(); }); await shot('51-32-5-towel.png');
    await page.evaluate(() => { thaw(); play('32-5'); }); await pano('52-32-5-panorama.png', 0.3);
  });
};
// ---------------- 32-6: the lead-in (push the full stop), the arena ----------------
LEVELS.s6 = async (page, shot, run, pano) => {
  await run('s6', async () => {
    await page.evaluate(HELPERS);
    const r = await page.evaluate(() => {
      fresh(); play('32-6'); place(55, 15); sim(0.3); const g = S(), st = ents('PstStop')[0];
      for (let q = 0; q < 1200 && st.slotIn < 0; q++) sim(1 / 120, { right: true });
      sim(0.4); return { slot: st.slotIn, key: g.keys.has('pst:stop'), x: Math.round(st.cx / 32) };
    });
    check('32-6 played: the full stop pushed along the sentence clicks into the slot after "MORE": the door unlocks', r.slot === 0 && r.key, r);
    await page.evaluate(() => freeze()); await shot('60-32-6-full-stop.png');
    const d = await page.evaluate(() => { thaw(); const st = ents('PstStop')[0]; walkTo(Math.floor(st.cx / 32) - 2, 3); sim(1 / 120, { jump: true, jumpPressed: true, right: true }); sim(0.7, { jump: true, right: true }); sim(2.5, { right: true }); walkTo(92, 3); const aid = door(); return { aid, at: tileOf() }; });
    check('32-6: through the unlocked door into the arena', d.aid === 'stage', d);
    await page.evaluate(() => { sim(3); freeze(); }); await shot('61-32-6-arena.png');
    await page.evaluate(() => { thaw(); play('32-6'); }); await pano('62-32-6-panorama.png', 0.4);
  });
};
// ---------------- the map, the route-map pin ----------------
const openPst = `(() => { fresh(); const B = window.BRADY, T = window.BRADY_TOUR, d = B.Save.data; T.TourProgress.data().lands.pst = true; d.unlocked['32-1'] = true; d.seenEncoreIntro = true; })()`;
LEVELS.map = async (page, shot, run) => {
  await run('map', async () => {
    const r = await page.evaluate(o => { eval(o); window.BRADY.goToMap('world', 32, '32-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { mode: s.mode, cc: s.ow && s.ow.C && s.ow.C.id }; }, openPst);
    check('Pupo Standard Time has its own walkable map', r.cc === 'pst', r);
    await page.evaluate(() => freeze()); await shot('70-pst-overworld-map.png');
    await page.evaluate(() => { thaw(); const s = S(); if (s.openRoute) s.openRoute({ dest: 'pst' }); for (let k = 0; k < 30; k++) sim(0.2); freeze(); }); await shot('71-route-map-pst-pin.png');
    const h = await page.evaluate(() => { thaw(); fresh(); const T = window.BRADY_TOUR; return { shut: !T.TourProgress.countryUnlocked(T.Tour.countries.pst), tot: T.TourProgress.totals().total }; });
    check('before the entrance is used, the land is shut and out of the totals', h.shut, h);
  });
};


// ---------------- bot mode (--bot): enemies on, no invulnerability, the way a careful player goes ----------------
const BOT = args.includes('--bot');
const botRun = async (page, id, legs) => {
  if (want.length && !want.includes(id)) return;
  const r = await page.evaluate(([id, legs]) => {
    fresh(); play(id); let g = S(); let deaths = [];
    const p0 = () => { const p = P(); p.invuln = 0; return p; };
    p0(); const out = [];
    // a leg is [startX, code]: after a death Brady goes back to the last checkpoint, and the bot goes back to the
    // last leg that starts at or behind where he respawned (and plays on from there)
    let i = 0, guard = 0;
    while (i < legs.length && guard++ < 80) {
      const [lx, leg] = legs[i];
      let ok;
      try { ok = eval(leg); } catch (e) { ok = { ok: false, err: String(e) }; }
      if (S() !== g || !P() || P().dead || g.state !== 'play' && g.state !== 'clear' && g.state !== 'tally' && g.state !== 'results') {
        const died = S() !== g || !P() || P().dead || /dead|over/.test(g.state);
        if (died) deaths.push({ leg: i, at: P() ? tileOf() : null, state: g.state });
        for (let k = 0; k < 600 && (!S().player || S().player.dead || S().state !== 'play'); k++) sim(0.05);
        g = S(); if (!g.player || deaths.length > 8) break;
        sim(0.5); P().invuln = 0; const rx = tileOf()[0]; let j = i; while (j > 0 && legs[j][0] > rx + 1) j--; i = j; continue;
      }
      out.push(!!(ok && ok.ok !== false)); if (!(ok && ok.ok !== false)) { out.push({ leg: i, fail: ok }); break; }
      if (g.state !== 'play') break;
      P().invuln = 0; i++;
    }
    sim(2);
    return { id, deaths: deaths.length, where: deaths.slice(0, 6), legsOk: out, state: g.state };
  }, [id, legs]);
  console.log('BOT ' + JSON.stringify(r));
  check(`bot ${id}: played start to finish with enemies on and no invulnerability (at most one death)`, /clear|tally|results/.test(r.state) && r.deaths <= 1, r);
};
LEVELS.bot = async (page) => {
  if (!BOT) return;
  await page.evaluate(HELPERS);
  await botRun(page, '32-1', [
    [3, "AP.route([[13, 19]])"], [13, "lift({ walk: 0, air: 1, airAt: 0, to: [17, 14], tol: 2 })"], [17, "AP.route([[30, 19], [42, 19]])"], [41, "lift({ walk: 0, air: 1, airAt: 0, to: [46, 13], tol: 3 })"],
    [46, "AP.route([[52, 19], [60, 19]])"], [59, "lift({ walk: 1, walkT: 1.6, air: 1, airAt: 0, to: [71, 13], tol: 3 })"], [71, "AP.route([[82, 19], [97, 19]])"],
    [96, "lift({ walk: 0, air: 1, airAt: 0, to: [101, 14], tol: 1 })"], [100, "lift({ walk: 0, air: 1, airAt: 0, to: [106, 9], tol: 3 })"],
    [106, "AP.route([[113, 19], [119, 19], [127, 19], [140, 19]])"], [140, "AP.route([[158, 19], [164, 19]])"], [163, "lift({ walk: 1, walkT: 1.6, air: 1, airAt: 0, to: [175, 13], tol: 4 })"],
    [175, "AP.route([[186, 19], [198, 19]])"], [197, "lift({ walk: 1, walkT: 1.6, air: 1, airAt: 0, to: [210, 13], tol: 3 })"], [210, "AP.route([[215, 13], [228, 19]])"], [224, "safeWalk(240)"]]);
  await botRun(page, '32-3', [
    [3, "safeWalk(18)"], [18, "yawnAt(18, 1)"], [18, "AP.route([[23, 16], [27, 13], [35, 19]])"], [34, "safeWalk(68)"], [68, "yawnAt(68, 1)"],
    [68, "AP.route([[74, 19], [84, 19]])"], [84, "safeWalk(92)"], [92, "yawnAt(92, 1)"], [92, "AP.route([[95, 15], [98, 12]])"], [98, "safeWalk(104)"],
    [104, "AP.route([[107, 19]])"], [106, "safeWalk(114)"], [110, "AP.route([[118, 16], [123, 19]])"], [122, "safeWalk(134)"], [134, "yawnAt(134, 1)"],
    [134, "AP.route([[137, 16], [141, 13]])"], [141, "safeWalk(147)"], [147, "AP.route([[150, 19]])"],
    [150, "(() => { walkTo(150); const m = ents('PstMouth').find(e => e.stuck); for (let q = 0; q < 1200 && !m.free; q++) sim(1 / 120); return { ok: !!m.free }; })()"],
    [150, "yawnAt(154, 1)"], [154, "AP.route([[161, 17], [168, 19]])"], [168, "safeWalk(200)"]]);
  // the boss with damage on, three runs in a row from a fresh start: push the stop into each phase's slot and wait
  // for the tell, jumping whatever flies at Brady; phase 3: stand behind the stop beside the blank, wait for PLEASE,
  // then walk the stop into the last slot
  if (want.length && !want.includes('boss')) return;
  const runs = [];
  for (let run = 0; run < 3; run++) runs.push(await page.evaluate(run => {
    fresh(); play('32-6'); toArea('stage', [6, 9, 4][run], 13); sim(3 + run * 0.7); let g = S(); P().invuln = 0; let deaths = 0, t = 0, b, st, X0;
    const grab = () => { g = S(); b = g.entities && g.entities.find(e => e.boss); st = g.entities && g.entities.find(e => e.constructor.name === 'PstStop'); X0 = b ? Math.round(b.arenaX0 / 32) : 0; };
    const dead = () => S() !== g || !P() || P().dead || g.state !== 'play';
    const dodge = () => { const p = P(), sh = g.entities.find(e => e.constructor.name === 'TourShot' && !e.remove && e.cx > p.cx - 10 && e.cx - p.cx < 80 && Math.abs(e.cy - p.cy) < 60); return sh && p.onGround ? { jump: true, jumpPressed: true } : { jump: !p.onGround }; };
    const tr = []; const step = inp => { sim(1 / 120, inp); t += 1 / 120; if (Math.round(t * 120) % 30 === 0 && P() && b) { tr.push([+t.toFixed(1), Math.round(P().cx / 3.2) / 10, Math.round(P().cy / 3.2) / 10, st && Math.round(st.cx / 3.2) / 10, st && st.slotIn, b.act, b.hp, P().state || '', g.state]); if (tr.length > 8) tr.shift(); } };
    const log = []; grab();
    while (t < 240) {
      if (dead()) { deaths++; log.push({ ph: b && b.phase, hp: b && b.hp, at: P() ? tileOf() : null, X0, tr: tr.slice() }); for (let q = 0; q < 400 && (!S().player || S().player.dead || S().state !== 'play'); q++) { sim(0.05); t += 0.05; } grab(); if (!g.area || !g.player) { log.push({ scene: g.constructor.name, state: g.state }); break; } if (g.area.aid !== 'stage') toArea('stage', 6, 13); P().invuln = 0; sim(2); grab(); continue; }
      if (!b || b.remove || b.state === 'dying' || b.hp <= 0) break;
      const ph = b.phase || 1, k = ph - 1, sx = st.slots[k] * 32 + 16, hp = b.hp;
      if (ph < 3) {
        if (st.slotIn !== k) { walkTo(Math.floor(st.cx / 32) - 1, 3); for (let q = 0; q < 900 && st.slotIn !== k && !dead(); q++) { step({ right: true }); if (st.cx > sx + 20 || P().cx > st.cx + 8) break; } }
        if (dead()) continue;
        walkTo(X0 + 1, 3);
        for (let q = 0; q < 120 * 12 && b.hp === hp && !dead(); q++) step(dodge());
      } else {
        // behind the stop, beside the blank; stand still (hopping only over a shout) until Pupo says PLEASE
        if (st.slotIn === 2) { for (let q = 0; q < 120 * 6 && st.slotIn === 2 && !dead(); q++) step(dodge()); continue; }
        walkTo(Math.max(X0 + 12, Math.floor(st.cx / 32) - 2), 3);
        for (let q = 0; q < 120 * 10 && !b.please && !dead(); q++) step(dodge());
        if (!b.please || dead()) continue;
        for (let q = 0; q < 120 * 6 && b.hp === hp && !dead(); q++) step({ right: true });
        sim(0.3);
      }
    }
    return { hp: b ? b.hp : null, deaths, log, t: Math.round(t) };
  }, run));
  const r = { runs };
  console.log('BOT boss ' + JSON.stringify(r));
  check('bot 32-6: The Interrupter beaten with damage on, first try, three runs in a row', runs.every(q => q.hp != null && q.hp <= 0 && q.deaths === 0), r);
};

(async () => {
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => {
    if (BOT) { await LEVELS.bot(page); return; }
    for (const k in LEVELS) if (k !== 'entrance' && k !== 'bot') { if (k.startsWith('r')) await LEVELS[k](page, shot); else await LEVELS[k](page, shot, run, pano); }
  });
  // (Nepal's atlas sprites taint the canvas for panoramas: the entrance gets its own browser)
  if (!BOT) await session({ width: 844, height: 390 }, async (page, shot, run, pano) => { await LEVELS.entrance(page, shot, run, pano); });
  if (!BOT) await session({ width: 390, height: 844 }, async (page, shot, run) => {
    await run('p-s1', async () => { await page.evaluate(HELPERS); await page.evaluate(() => { fresh(); play('32-1'); place(42, 18); sim(0.4); freeze(); }); await shot('90-portrait-32-1.png'); });
    await run('p-boss', async () => { await page.evaluate(() => { thaw(); play('32-6'); toArea('stage', 8, 13); sim(3); freeze(); }); await shot('91-portrait-32-6-arena.png'); });
    await run('p-map', async () => { await page.evaluate(o => { thaw(); eval(o); window.BRADY.goToMap('world', 32, '32-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } freeze(); }, openPst); await shot('92-portrait-pst-map.png'); });
  });
  console.log(failures ? `${failures} PST CHECK(S) FAILED` : 'ALL PST CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
