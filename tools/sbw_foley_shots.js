// Foley Beach (world 29, a hidden land): in-browser checks and phone-size screenshots.
// Each stage's own mechanic is PLAYED with real inputs through the game loop: an autopilot (from the Moon's and Pupo
// Standard Time's shots tools) plans each hop with the game's own physics function on a copy of Brady's body, then
// feeds those exact inputs to the real game frame by frame; the land's own moves (strike a prop, hold the damper,
// play the bank, aim the trumpet, cut a take, steer the mic) are scripted with the same real buttons. It finds and
// uses the hidden entrance in Brazil 3-1, plays every stage's mechanic and main route, every secret room (won once,
// failed once, every exit used) and the boss; 844x390 landscape shots of the key beats, 390x844 portrait shots of
// 29-1, the boss and the map, and a panorama of every stage. --bot plays every stage start to finish with enemies on
// and no invulnerability, and the boss with damage on.
// usage: BRADY_DIST=<dist> node tools/sbw_foley_shots.js <outdir> [--checks] [--bot] [name ...]   (--checks: no pictures)
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'foley-shots'), checksOnly = args.includes('--checks');
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
          window.BRADY_FOLEY.phys(b, inp, A, dt, null, {});
          if (AP.after) AP.after(b, inp, A, dt);
          t += dt;
          if (b.y > A.H * 32 + 20 || window.BRADY_FOLEY.lavaContact(b, A) || window.BRADY_FOLEY.spikeContact(b, A)) return null;
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

// the land's own moves, with real buttons
const HELPERS = `(() => {
  const play0 = window.play; window.play = (id, o) => { const g = play0(id, o); for (let k = 0; k < 900 && S().state !== 'play'; k++) sim(1 / 60); P().invuln = 999; return g; };
  window.walkTo = (tx, maxT) => AP.exec({ walkTo: tx * 32 + 16, dir: 0 }, maxT || 4);
  // a careful walk along a floor: hold the stick; a critter ahead on Brady's level gets a full jump over it (or a
  // stomp); stops on tile tx (or at the gate's results)
  window.safeWalk = (tx, maxT) => {
    const g = S(); let t = 0, jt = 0;
    while (t < (maxT || 14)) {
      const p = P(); if (S() !== g || !p || p.dead) return { ok: false, why: 'died', at: p ? tileOf() : null };
      if (/clear|tally|results/.test(g.state)) return { ok: true, state: g.state };
      if (g.state !== 'play') { sim(1 / 120); t += 1 / 120; continue; }
      const dx = tx * 32 + 16 - p.cx, d = Math.sign(dx);
      if (Math.abs(dx) < 12 && p.onGround) { sim(0.15); return { ok: true, at: tileOf() }; }
      const en = g.entities.find(e => e.enemy && !e.dead && !e.remove && (e.cx - p.cx) * d > -4 && (e.cx - p.cx) * d < 3.2 * 32 && Math.abs(e.cy - p.cy) < 1.6 * 32 && !(e.state === 'hush'));
      let inp = { left: d < 0, right: d > 0 };
      if (en && p.onGround && jt <= 0) { inp.jump = true; inp.jumpPressed = true; jt = 0.35; }
      else if (jt > 0) inp.jump = true;
      jt -= 1 / 120; sim(1 / 120, inp); t += 1 / 120;
    }
    return { ok: false, why: 'slow', at: tileOf() };
  };
  window.press = (keys) => { sim(1 / 120, Object.assign({ action: true, actionPressed: true }, keys || {})); sim(1 / 120); };
  // 29-1: strike the prop on tile tx (walk there, THROW); the flock's patch is clear when it has flown
  window.strike = tx => { const r = walkTo(tx, 5); press(); sim(1.3); return { ok: tileOf()[0] === tx, at: tileOf(), r }; };
  // a springboard on tile sx: hop onto it from the tile before (from the side given), hold JUMP for the full bounce,
  // steer dir once high, land
  window.springUp = (sx, dir, from) => {
    from = from || -1; walkTo(sx + from, 3); const p = P(); let t = 0, sprung = false, ts = 0;
    while (t < 4 && !p.dead) {
            let inp = { jump: true, jumpPressed: t === 0 };
      if (!sprung) { const dx = sx * 32 + 16 - p.cx - p.vx * 0.12; inp.right = dx > 3; inp.left = dx < -3; if (p.vy < -20 * 32) { sprung = true; ts = t; } }
      else { inp.right = dir > 0 && t - ts > 0.3; inp.left = dir < 0 && t - ts > 0.3; if (p.onGround && t - ts > 0.2) break; }
      sim(1 / 120, inp); t += 1 / 120;
    }
    sim(0.2); return { ok: sprung && !p.dead && p.onGround, sprung, at: tileOf() };
  };
  // 29-2: hold THROW at a panel's mark (the tile before it) until it lies flat, then keep holding and walk across
  window.panelAt = mx => ents('FoleyPanel').find(e => e.tx === mx + 1);
  window.damp = (mx, endTx) => {
    walkTo(mx - 1, 4); const P0 = panelAt(mx), p = P(); let t = 0;
    while (t < 2.5 && !P0.flat) { sim(1 / 120, { action: true, right: p.cx < mx * 32 + 8 && p.vx < 60 }); t += 1 / 120; }
    const flatAt = +t.toFixed(2); if (!P0.flat) return { ok: false, why: 'not flat', at: tileOf() };
    let w = 0; while (w < 4 && tileOf()[0] < endTx && !p.dead) { sim(1 / 120, { action: true, right: true }); w += 1 / 120; }
    for (let q = 0; q < 120 && !p.onGround; q++) sim(1 / 120);
    return { ok: !p.dead && tileOf()[0] >= endTx && tileOf()[1] === 14, flatAt, at: tileOf() };
  };
  window.meet = (mx, endTx) => {
    walkTo(mx, 4); const P0 = panelAt(mx); let t = 0;
    while (t < 6 && !P0.meetNow()) { sim(1 / 120); t += 1 / 120; }
    press(); sim(0.2); if (!P0.caught) return { ok: false, why: 'missed' };
    return safeWalk(endTx, 6);
  };
  // 29-3: take the bank at tile bx, pick and play: each pic gets its prop played as the foot lands
  window.bankPlay = (bx, opts) => {
    opts = opts || {}; walkTo(bx, 4); const B = ents('FoleyBank').find(e => e.tx === bx); if (!B) return { ok: false, why: 'no bank' };
    press(); sim(0.1); if (!B.mounted) return { ok: false, why: 'not mounted', at: tileOf() };
    const K = window.BRADY_FOLEY.kit; let guard = 0;
    while (!B.done && guard++ < 12) {
      const want = B.props.indexOf(opts.wrong && guard === 1 ? B.props.find(k => k !== K.PICS[B.pic()]) : K.PICS[B.pic()]);
      let t = 0; while (B.sel !== want && t < 3) { sim(1 / 120, { right: B.sel < want, left: B.sel > want }); t += 1 / 120; } sim(1 / 120);
      t = 0; while (t < 3 && !(B.q() > 0.97 || B.q() < 0.03)) { sim(1 / 120); t += 1 / 120; }
      const n0 = B.n; press(); sim(0.3); if (opts.wrong && guard === 1) { opts.wrongOk = B.n === n0; continue; }
      if (B.n === n0 && !B.done) return { ok: false, why: 'no hit', pic: B.pic(), sel: B.sel };
    }
    sim(1.2); return { ok: B.done, wrongOk: opts.wrongOk, at: tileOf() };
  };
  // the cargo net: a list of steps: 'grip' (push up from the floor), [tx, ty] (steer the grip point there), 'X' (JUMP
  // at a collar: round to the other side), 'R' / 'L' (let go with a jump that way, land)
  window.netGo = steps => {
    const p = P();
    for (const st of steps) {
      if (st === 'grip') { let t = 0; while (t < 1 && !(p.wash && p.wash.grip)) { sim(1 / 120, { up: true }); t += 1 / 120; } if (!(p.wash && p.wash.grip)) return { ok: false, why: 'no grip', at: tileOf() }; continue; }
      if (st === 'X') { const f0 = p.wash.face; sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.5); if (p.wash.face === f0) return { ok: false, why: 'no cross', at: [Math.floor(p.cx / 32), Math.floor((p.y + 8) / 32)] }; continue; }
      if (st === 'J') { sim(1 / 120, { jump: true, jumpPressed: true }); let t = 0; while (t < 1.2 && !(p.wash && p.wash.grip && t > 0.05)) { sim(1 / 120, { jump: true, up: true }); t += 1 / 120; } if (!(p.wash && p.wash.grip)) return { ok: false, why: 'no grab', at: tileOf() }; continue; }
      if (st === 'U') { sim(1 / 120, { jump: true, jumpPressed: true }); let t = 0; while (t < 2 && !(p.onGround && t > 0.1)) { sim(1 / 120, { jump: true, right: t > 0.2 && p.y + p.h < 6 * 32 }); t += 1 / 120; } sim(0.2); continue; }
      if (st === 'R' || st === 'L') { const d = st === 'R' ? 1 : -1; sim(1 / 120, { jump: true, jumpPressed: true, right: d > 0, left: d < 0 }); let t = 0; while (t < 2 && !(p.onGround && t > 0.1)) { sim(1 / 120, { jump: t < 0.3, right: d > 0, left: d < 0 }); t += 1 / 120; } sim(0.2); continue; }
      const [tx, ty] = st; let t = 0;
      while (t < 6) {
        if (p.dead || !(p.wash && p.wash.grip)) return { ok: false, why: p.dead ? 'died' : 'fell', at: tileOf(), st };
        const dx = tx * 32 + 16 - p.cx, dy = ty * 32 + 16 - (p.y + 8);
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) break;
        sim(1 / 120, { right: dx > 4, left: dx < -4, down: dy > 4, up: dy < -4 }); t += 1 / 120;
      }
    }
    return { ok: !p.dead, at: tileOf(), face: p.wash && p.wash.face };
  };
  // 29-4: take the trumpet at tile tx, aim with the stick until the dotted path ends on the front of the ear whose
  // hinge is at tile ex, puff, wait for the ear to fold down, let go (JUMP)
  window.trumpet = (tx, ex, o) => {
    o = o || {}; walkTo(tx, 4); const T0 = ents('FoleyTrumpet').find(e => e.tx === tx), E = ents('FoleyEar').find(e => Math.round(e.cx / 32 - 0.5) === ex);
    if (!T0 || !E) return { ok: false, why: 'no trumpet/ear', T: !!T0, E: !!E };
    press(); sim(0.1); if (!T0.mounted) return { ok: false, why: 'not mounted' };
    const K = window.BRADY_FOLEY.kit, aimed = () => { const [mx, my] = T0.mouth(), h = K.puffPath(S(), mx, my, T0.a).hit; return h && h.ear === E && h.front; };
    let t = 0; const order = o.down ? ['down', 'up'] : ['up', 'down'];
    for (const d of order) { if (aimed()) break; t = 0; if (d === 'up') { while (t < 3 && !aimed() && Math.sin(T0.a) > -0.99) { sim(1 / 120, { up: true }); t += 1 / 120; } } else { while (t < 3 && !aimed() && Math.sin(T0.a) < 0.34) { sim(1 / 120, { down: true }); t += 1 / 120; } } }
    if (!aimed()) { sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.6); return { ok: false, why: 'no aim', a: +T0.a.toFixed(2) }; }
    const a = +T0.a.toFixed(2); press(); let w = 0; while (w < 4 && !E.open) { sim(1 / 120); w += 1 / 120; }
    sim(0.5); sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.7);
    return { ok: E.open && !T0.mounted, a, t: +w.toFixed(2) };
  };
  // 29-5: cut a take at the desk on tile dx: hold THROW from the band's start, let go at its end
  window.cut = (dx, o) => {
    o = o || {}; walkTo(dx, 4); const D = ents('FoleyDesk').find(e => e.tx === dx); if (!D) return { ok: false, why: 'no desk' };
    const [a, b] = D.band, sh = o.short ? -0.12 : o.long ? 0.15 : 0; let t = 0;
    while (t < 6 && !(D.u() > a - 0.02 && D.u() < a + 0.02)) { sim(1 / 120); t += 1 / 120; }
    sim(1 / 120, { action: true, actionPressed: true }); t = 0;
    while (t < 4 && D.u() < b + sh && D.u() >= a - 0.05) { sim(1 / 120, { action: true }); t += 1 / 120; }
    sim(1 / 120); sim(1.2); return { ok: !!D.done === !(o.short || o.long), done: D.done, at: tileOf() };
  };
  // 29-6: the mic on tile mx: take it, steer to the machine of kind (or the pea), capture as it sounds, play back
  window.micTake = (mx, kind, o) => {
    o = o || {}; walkTo(mx, 4); const M = ents('FoleyMic').find(e => e.tx === mx); if (!M) return { ok: false, why: 'no mic' };
    press(); sim(0.1); const L = M.machines(), want = L.findIndex(e => (e.kind || 'pea') === kind); if (want < 0) return { ok: false, why: 'no machine ' + kind };
    let t = 0; while (M.sel !== want && t < 3) { sim(1 / 120, { right: M.sel < want, left: M.sel > want }); t += 1 / 120; } sim(1 / 120);
    t = 0; while (t < 8 && !(L[want].sounding() && (kind !== 'pea' || true))) { sim(1 / 120); t += 1 / 120; }
    sim(0.15); press(); sim(0.2); if (!M.got) return { ok: false, why: 'no capture' };
    press(); sim(1.2); return { ok: M.done, at: tileOf() };
  };
  window.flocks = () => ents('FoleyFlock').map(f => ({ x: Math.round(f.x / 32), size: f.size, state: f.state }));
  window.door = () => { const a0 = S().area.aid; for (let k = 0; k < 20 && S().area.aid === a0; k++) sim(0.1, { up: true, upPressed: true }); sim(1.2); return S().area.aid; };
})()`;
const LEVELS = {};

// ---------------- 29-1 Made You Look ----------------
const S1_ROUTE = [
  [2, "strike(17)"], [17, "AP.route([[30, 14], [44, 14], [52, 14]])"], [52, "safeWalk(62)"], [62, "strike(63)"],
  [63, "AP.route([[66, 16]])"], [66, "springUp(68, 1)"], [72, "safeWalk(87)"], [87, "AP.route([[90, 14]])"], [90, "safeWalk(100)"],
  [100, "AP.route([[102, 11], [105, 8], [112, 7]])"], [112, "(() => { press(); sim(1.3); return { ok: true }; })()"], [112, "AP.route([[106, 8], [103, 11], [100, 14]])"],
  [100, "safeWalk(124)"], [124, "AP.route([[125, 12], [133, 14]])"], [133, "safeWalk(150)"],
  [150, "strike(156)"], [156, "strike(158)"], [158, "safeWalk(180)"], [180, "strike(180)"],
  [180, "AP.route([[182, 11], [185, 8], [190, 6]])"], [190, "(() => { press(); sim(1.3); return { ok: true }; })()"], [190, "AP.route([[185, 8], [182, 11], [180, 14]])"],
  [180, "safeWalk(206)"]];
LEVELS.s1 = async (page, shot, run, pano) => {
  await run('s1', async () => {
    await page.evaluate(HELPERS);
    await page.evaluate(() => { fresh(); play('29-1'); place(12, 13); sim(0.4); freeze(); }); await shot('10-29-1-start.png');
    // the teach: the log rings, the shells look and rush over; the patch is clear
    const r = await page.evaluate(() => { thaw(); play('29-1'); place(16, 13); sim(0.3); const f0 = flocks()[0]; walkTo(17, 3); press(); sim(0.3); const mid = flocks()[0]; return { f0, mid, rings: (S().foleyRings || []).length }; });
    check('29-1: THROW at the hollow log rings (visible rings) and the heap of shells takes off for it', r.f0.state === 'heap' && r.mid.state === 'fly' && r.rings > 0, r);
    await page.evaluate(() => { freeze(); }); await shot('11-29-1-strike.png');
    const r2 = await page.evaluate(() => { thaw(); sim(1.2); const A = S().area; return { open: [23, 24].every(x => [10, 11, 12, 13].every(y => A.tiles[y * A.W + x] === window.BRADY.T.EMPTY)), f: flocks()[0] }; });
    check('29-1: the flock sits on the log; its patch is clear', r2.open && r2.f.state === 'perched', r2);
    await page.evaluate(() => { freeze(); }); await shot('12-29-1-perched.png');
    // the twist: a wood block brings only the little shells, the tom only the big ones
    const t = await page.evaluate(() => { thaw(); play('29-1'); place(155, 13); sim(0.3); walkTo(156); press(); sim(1.3); const a = flocks().filter(f => f.x >= 166 && f.x <= 169).map(f => f.size + ':' + f.state); walkTo(158); press(); sim(1.3); const b = flocks().filter(f => f.x >= 166 && f.x <= 169).map(f => f.size + ':' + f.state); return { a, b }; });
    check('29-1 twist: the high CLACK brings only the little shells; the low THUMP brings the big ones', t.a.join() === 'small:perched,big:heap' && t.b.join() === 'small:perched,big:perched', t);
    await page.evaluate(() => { freeze(); }); await shot('13-29-1-mixed.png');
    // the whole route, with real inputs
    const leg = await page.evaluate(legs => { fresh(); play('29-1'); place(2, 13); const out = []; for (const [, code] of legs) { const r = eval(code); out.push(r && r.ok !== false); if (r && r.ok === false) return { ok: false, at: out.length - 1, r, tile: tileOf() }; } sim(3, { right: true }); return { ok: true, state: S().state, key: S().exitKey }; }, S1_ROUTE);
    check('29-1 played start to finish with real inputs: every heap cleared by its own prop, up the sea wall on the springboard, the block on the canopy, both mixed heaps', leg.ok && /clear|tally|results/.test(leg.state), leg);
    await page.evaluate(() => { thaw(); play('29-1'); }); await pano('14-29-1-panorama.png', 0.35);
  });
};

// a secret room: the way in (played), the room on entry, a miss first, the win with the real buttons, the cage, the
// way out (somewhere else, or back)
const ROOM_FAIL = {
  foleyTrim: `(() => { const R = S().area.roomState, m = ents('FoleyRoomMark')[0]; place(m.tx, m.fy - 1); sim(0.3); let f = false; for (let q = 0; q < 1200 && !f; q++) { sim(1 / 120); if (R.fail > 0) f = true; } sim(1.4); return { won: R.won, failed: f, how: 'no lift: the clippers snip the first ear' }; })()`,
  foleyLids: `(() => { const R = S().area.roomState, k = S().area.roomKit, m = ents('FoleyRoomMark').find(e => e.k === 'drop'); place(m.tx, m.fy - 1); sim(0.3); press(); sim(1.2); return { won: R.won, failed: R.round === 0 }; })()`,
  foleyPerch: `(() => { const R = S().area.roomState, m = ents('FoleyRoomMark').find(e => R.seat[e.k] < 0); place(m.tx, m.fy - 1); sim(0.3); press(); sim(0.5); return { won: R.won, failed: !R.won }; })()`,
  foleyTicket: `(() => { const R = S().area.roomState, k = S().area.roomKit, D = k.data.rounds[0], m = ents('FoleyRoomMark').find(e => e.k === D.dots[0]); place(m.tx, m.fy - 1); sim(0.3); press(); sim(1.2); return { won: R.won, failed: R.round === 0 }; })()`,
  foleyRecords: `(() => { const R = S().area.roomState, m = ents('FoleyRoomMark').find(e => e.k === 2); place(m.tx, m.fy - 1); sim(0.3); press(); sim(0.4); return { won: R.won, failed: !R.won }; })()`,
  foleyRain: `(() => { const R = S().area.roomState, m = ents('FoleyRoomMark')[0]; place(m.tx, m.fy - 1); sim(0.3); press(); sim(4, { left: true }); const w = R.wet; sim(0.1, { jump: true, jumpPressed: true }); sim(1); return { won: R.won, failed: !R.won && w < 4 }; })()`
};
async function roomRun(page, shot, label, enter) {
  const r0 = await page.evaluate(enter);
  check(label + ': the way in, played: ' + (r0.how || ''), r0.ok, r0);
  if (!r0.ok) return;
  const info = await page.evaluate(() => { sim(0.5); const A = S().area; return { aid: A.aid, kind: A.roomKit && A.roomKit.kind, banner: S().bannerText }; });
  await page.evaluate(() => freeze()); await shot(label + '-room-title.png'); await page.evaluate(() => thaw());
  await page.evaluate(() => sim(1.6)); await page.evaluate(() => freeze()); await shot(label + '-room.png'); await page.evaluate(() => thaw());
  const f = await page.evaluate(ROOM_FAIL[info.kind]);
  check(label + ' (' + info.kind + '): a miss resets that turn, no prize', !f.won && f.failed, f);
  const w = await page.evaluate(() => { const g = S(), A = g.area, R = A.roomState, kit = A.roomKit; window.ROOMK[kit.kind].testWin(g, A, R, kit, (g2, keys) => sim(1 / 120, keys || {})); sim(0.6); const cage = g.entities.find(e => e.constructor.name === 'TourRoomCage'); return { won: R.won, cageOpen: cage ? cage.tiles.every(([x, y]) => g.area.tiles[y * g.area.W + x] === window.BRADY.T.EMPTY) : null }; });
  check(label + ' (' + info.kind + '): won once with the real buttons; the prize cage opens at the win', w.won && w.cageOpen !== false, w);
  await page.evaluate(() => freeze()); await shot(label + '-room-won.png'); await page.evaluate(() => thaw());
  const out = await page.evaluate(([inX, other]) => { const g = S(), D = g.entities.filter(e => e.constructor.name === 'Portal' && e.target).sort((a, b) => b.x - a.x), d = other ? D[0] : D[D.length - 1]; const k0 = g.area.idx; place(Math.floor(d.cx / 32), Math.floor((d.y + d.h - 1) / 32)); sim(0.2); const aid = door(); return { aid, x: tileOf()[0], inX, back: aid !== g.level.areas[k0].aid, elsewhere: Math.abs(tileOf()[0] - inX) > 3 }; }, [r0.inX, !!r0.other]);
  check(label + ': its door takes Brady out ' + (r0.other ? 'somewhere else than where he came in' : 'back the way he came'), out.back && (!r0.other || out.elsewhere), out);
}
async function run0(page, name, f) { if (want.length && !want.some(w => name.startsWith(w))) return; try { await page.evaluate(HELPERS); await page.evaluate(() => { window.ROOMK = window.BRADY_TOUR.TourRooms ? window.BRADY_TOUR.TourRooms.kinds : {}; }); await f(); } catch (e) { check(name + ' runs', false, String(e.message).slice(0, 300)); } }
// ---------------- 29-2 The Quiet Cut ----------------
const S2_ROUTE = [
  [2, "damp(15, 22)"], [22, "safeWalk(25)"], [25, "damp(29, 38)"], [38, "safeWalk(46)"], [46, "damp(50, 61)"], [61, "safeWalk(70)"],
  [70, "AP.route([[72, 11]])"], [72, "(() => { const r = damp(72, 81); return { ok: tileOf()[0] >= 81 && !P().dead, r }; })()"], [81, "AP.route([[84, 11], [88, 14]])"], [88, "safeWalk(89)"],
  [89, "AP.route([[86, 14], [91, 11], [97, 10], [102, 14]])"], [102, "safeWalk(136)"], [136, "meet(140, 156)"], [156, "safeWalk(166)"], [166, "damp(170, 184)"], [184, "safeWalk(204)"]];
LEVELS.s2 = async (page, shot, run, pano) => {
  await run('s2', async () => {
    await page.evaluate(HELPERS);
    await page.evaluate(() => { fresh(); play('29-2'); place(13, 13); sim(0.6); freeze(); }); await shot('20-29-2-rattle.png');
    // a rattling panel is nothing to stand on; held THROW flattens it; let go and it rattles again (ripples first)
    const r = await page.evaluate(() => { thaw(); play('29-2'); const A = S().area, P0 = panelAt(15); const empty0 = A.tiles[14 * A.W + 17] === window.BRADY.T.EMPTY; walkTo(15, 3); let t = 0; while (t < 2 && !P0.flat) { sim(1 / 120, { action: true }); t += 1 / 120; } const flat = A.tiles[14 * A.W + 17] !== window.BRADY.T.EMPTY; sim(0.4); let back = 0; while (back < 5 && P0.flat) { sim(1 / 120); back += 1 / 120; } return { empty0, flatAt: +t.toFixed(2), flat, back: +back.toFixed(2) }; });
    check('29-2: a rattling panel is empty; holding THROW at its end lays it flat in under a second; let go and it rattles again a couple of seconds later', r.empty0 && r.flat && r.flatAt < 1 && r.back > 1.5 && r.back < 3.5, r);
    await page.evaluate(() => { play('29-2'); walkTo(15, 3); for (let q = 0; q < 100; q++) sim(1 / 120, { action: true }); sim(0.3, { action: true, right: true }); freeze(); }); await shot('21-29-2-damper.png');
    const m = await page.evaluate(() => { thaw(); play('29-2'); place(139, 13); sim(0.3); walkTo(140, 2); const P0 = panelAt(140); let t = 0; while (t < 6 && P0.meetNow()) { sim(1 / 120); t += 1 / 120; } press(); sim(0.2); const early = !P0.caught; t = 0; while (t < 6 && !P0.meetNow()) { sim(1 / 120); t += 1 / 120; } sim(0.05); const now = P0.meetNow(); return { early, now }; });
    check('29-2 twist: THROW before the humps meet misses; they keep running', m.early && m.now, m);
    await page.evaluate(() => freeze()); await shot('22-29-2-humps-meet.png');
    const leg = await page.evaluate(legs => { fresh(); play('29-2'); place(2, 13); for (const [, code] of legs) { const r = eval(code); if (r && r.ok === false) return { ok: false, code, r, tile: tileOf() }; } sim(3, { right: true }); return { ok: true, state: S().state }; }, S2_ROUTE);
    check('29-2 played start to finish with real inputs: every panel held flat and walked, the high panel, the hut roof, the humps caught where they meet', leg.ok && /clear|tally|results/.test(leg.state), leg);
    await page.evaluate(() => { play('29-2'); }); await pano('23-29-2-panorama.png', 0.35);
  });
};
// ---------------- 29-2's room: walk into the hut's false front, where the sand puffs ----------------
LEVELS.r2 = async (page, shot) => { await run0(page, 'r2', () => roomRun(page, shot, '26-29-2-B17', () => {
  play('29-2'); place(90, 13); sim(0.3); const r = walkTo(94, 3); sim(1.2, { right: true }); walkTo(98, 2); const aid = door(); return { ok: aid === 'tins', aid, r, inX: 98, other: false, how: 'walk into the hut\'s front panel where the sand puffs up: it is false; the hatch in the nook' }; })); };

// ---------------- 29-3 Coconut Understudy ----------------
const NET_ROUTE = "netGo(['grip', [64, 12], [65, 12], 'X', [68, 10], [70, 9], 'X', [73, 9], 'R'])";
const S3_ROUTE = [
  [2, "bankPlay(12)"], [12, "safeWalk(31)"], [31, "bankPlay(32)"], [32, "safeWalk(61)"], [61, NET_ROUTE], [74, "safeWalk(84)"],
  [84, "safeWalk(118)"], [118, "bankPlay(120)"], [120, "safeWalk(157)"], [157, "AP.route([[163, 13], [171, 16]])"], [171, "safeWalk(199)"]];
LEVELS.s3 = async (page, shot, run, pano) => {
  await run('s3', async () => {
    await page.evaluate(HELPERS);
    const r = await page.evaluate(() => { fresh(); play('29-3'); place(10, 15); sim(0.3); walkTo(12, 3); press(); sim(0.4); const B = ents('FoleyBank')[0]; return { mounted: B.mounted, x: tileOf()[0] }; });
    check('29-3: THROW at the bank takes it (Brady stays put while he holds it)', r.mounted, r);
    await page.evaluate(() => { freeze(); }); await shot('30-29-3-bank.png');
    const w = await page.evaluate(() => { thaw(); play('29-3'); place(10, 15); sim(0.3); return bankPlay(12, { wrong: true }); });
    check('29-3: the wrong prop on the beat does not count; the coconuts as the hoof lands, twice, roll the screen up', w.ok && w.wrongOk, w);
    await page.evaluate(() => { sim(0.3); freeze(); }); await shot('31-29-3-screen-up.png');
    const n = await page.evaluate(n => { thaw(); play('29-3'); place(58, 15); sim(0.3); walkTo(61, 3); return eval(n); }, NET_ROUTE);
    check('29-3: the cargo net climbed with real inputs: grip, up, round the back at a collar past the crab, back to the front at the other collar, off onto the ledge', n.ok && n.at && n.at[0] >= 73 && n.at[1] === 9, n);
    await page.evaluate(() => { play('29-3'); place(58, 15); sim(0.3); walkTo(61, 3); netGo(['grip', [64, 12], [65, 12], 'X', [67, 11]]); freeze(); }); await shot('32-29-3-net-far-side.png');
    const t = await page.evaluate(() => { thaw(); play('29-3'); place(116, 15); sim(0.3); return bankPlay(120); });
    check('29-3 twist: the horse twice on the coconuts, then the hobbyhorse on the wood block', t.ok, t);
    const leg = await page.evaluate(legs => { fresh(); play('29-3'); place(2, 15); for (const [, code] of legs) { const r = eval(code); if (r && r.ok === false) return { ok: false, code, r, tile: tileOf() }; } sim(3, { right: true }); return { ok: true, state: S().state }; }, S3_ROUTE);
    check('29-3 played start to finish with real inputs: three banks, the cargo net, the gaps', leg.ok && /clear|tally|results/.test(leg.state), leg);
    await page.evaluate(() => { play('29-3'); }); await pano('33-29-3-panorama.png', 0.35);
  });
};
// ---------------- 29-3's room: from the top of the net up through the sand-trickling gap in the loft floor ----------------
LEVELS.r3 = async (page, shot) => { await run0(page, 'r3', () => roomRun(page, shot, '36-29-3-B18', () => {
  play('29-3'); place(58, 15); sim(0.3); walkTo(61, 3); const n = netGo(['grip', [61, 7], [71, 7], 'J', [71, 5], 'R']); walkTo(81, 3); const aid = door(); return { ok: aid === 'loft', aid, n, inX: 81, other: true, how: 'climb to the top of the cargo net, jump up through the gap where the sand trickles, the door in the flies' }; })); };

// ---------------- 29-4 Sound Goes Round ----------------
const S4_ROUTE = [
  [2, "trumpet(12, 23)"], [12, "AP.route([[16, 16], [21, 13], [24, 14], [30, 16]])"], [30, "safeWalk(40)"], [40, "trumpet(40, 52)"],
  [40, "AP.route([[46, 13], [50, 10], [55, 10]])"], [55, "safeWalk(62)"], [62, "AP.route([[66, 16]])"], [66, "safeWalk(71)"], [71, "AP.route([[74, 14]])"],
  [74, "trumpet(74, 83)"], [74, "trumpet(74, 91)"], [74, "AP.route([[80, 13], [84, 14], [88, 13], [92, 14], [97, 16]])"],
  [97, "safeWalk(137)"], [137, "safeWalk(140)"], [140, "trumpet(140, 150)"], [140, "AP.route([[143, 16], [147, 13], [151, 10], [155, 10], [163, 16]])"], [163, "safeWalk(203)"]];
LEVELS.s4 = async (page, shot, run, pano) => {
  await run('s4', async () => {
    await page.evaluate(HELPERS);
    const r = await page.evaluate(() => { fresh(); play('29-4'); place(10, 15); sim(0.3); walkTo(12, 3); press(); for (let q = 0; q < 30; q++) sim(1 / 120, { up: true }); const T0 = ents('FoleyTrumpet')[0]; return { mounted: T0.mounted, x: tileOf()[0] }; });
    check('29-4: THROW at the trumpet takes it; the stick aims (Brady stays put)', r.mounted && r.x === 12, r);
    await page.evaluate(() => { freeze(); }); await shot('40-29-4-aim-dots.png');
    const t1 = await page.evaluate(() => { thaw(); play('29-4'); place(10, 15); sim(0.3); return trumpet(12, 23); });
    check('29-4: aimed along the dots at the ear\'s front, the puff opens it into a landing', t1.ok, t1);
    await page.evaluate(() => { freeze(); }); await shot('41-29-4-ear-open.png');
    const bk = await page.evaluate(() => { thaw(); play('29-4'); place(138, 15); sim(0.3); walkTo(140, 3); press(); const T0 = ents('FoleyTrumpet').find(e => e.tx === 140), E = ents('FoleyEar').find(e => Math.round(e.cx / 32 - 0.5) === 150); const K = window.BRADY_FOLEY.kit; let back = false; for (let q = 0; q < 600 && !back; q++) { const [mx, my] = T0.mouth(), h = K.puffPath(S(), mx, my, T0.a).hit; if (h && h.ear === E && !h.front) back = true; else sim(1 / 120, { up: true }); } if (!back) return { back }; press(); sim(2); return { back, open: E.open }; });
    check('29-4 twist: a puff straight at the ear that faces away hits its back: nothing', bk.back && !bk.open, bk);
    const t2 = await page.evaluate(() => { play('29-4'); place(138, 15); sim(0.3); return trumpet(140, 150, { down: true }); });
    check('29-4 twist: bounced off the two tin platters, the puff goes round into the ear\'s front', t2.ok, t2);
    await page.evaluate(() => { freeze(); }); await shot('42-29-4-platters.png');
    const leg = await page.evaluate(legs => { fresh(); play('29-4'); place(2, 15); for (const [, code] of legs) { const r = eval(code); if (r && r.ok === false) return { ok: false, code, r, tile: tileOf() }; } sim(3, { right: true }); return { ok: true, state: S().state }; }, S4_ROUTE);
    check('29-4 played start to finish with real inputs: every ear opened by an aimed puff, across on their landings', leg.ok && /clear|tally|results/.test(leg.state), leg);
    await page.evaluate(() => { play('29-4'); }); await pano('43-29-4-panorama.png', 0.35);
  });
};
// ---------------- 29-4's room: open the ear under the sand-trickling ledge, climb to its door ----------------
LEVELS.r4 = async (page, shot) => { await run0(page, 'r4', () => roomRun(page, shot, '46-29-4-B19', () => {
  play('29-4'); place(99, 15); sim(0.3); const t = trumpet(101, 110); if (!t.ok) return { ok: false, t };
  const r = AP.route([[104, 13], [107, 10], [114, 10]]); walkTo(116, 2); const aid = door(); return { ok: aid === 'office', aid, t, r, inX: 116, other: false, how: 'a puff into the ear on the high ledge (sand trickles off its lip): its landing is the step up to the door' }; })); };

// ---------------- 29-5 Cut the Take ----------------
const S5_ROUTE = [
  [2, "cut(12)"], [12, "safeWalk(29)"], [29, "AP.route([[36, 16]])"], [36, "safeWalk(46)"], [46, "cut(46)"], [46, "safeWalk(57)"], [57, "AP.route([[64, 13], [68, 12]])"],
  [68, "cut(70)"], [70, "safeWalk(79)"], [79, "AP.route([[84, 16]])"], [84, "safeWalk(98)"], [98, "AP.route([[103, 16]])"], [103, "safeWalk(150)"], [150, "cut(150)"],
  [150, "safeWalk(161)"], [161, "AP.route([[169, 16]])"], [169, "safeWalk(176)"], [176, "cut(176)"], [176, "safeWalk(199)"]];
LEVELS.s5 = async (page, shot, run, pano) => {
  await run('s5', async () => {
    await page.evaluate(HELPERS);
    await page.evaluate(() => { fresh(); play('29-5'); place(10, 15); sim(0.3); walkTo(12, 3); const D = ents('FoleyDesk')[0]; for (let q = 0; q < 600 && !(D.u() > D.band[0] - 0.01 && D.u() < D.band[0] + 0.02); q++) sim(1 / 120); sim(1 / 120, { action: true, actionPressed: true }); sim(0.35, { action: true }); freeze(); }); await shot('50-29-5-recording.png');
    const r = await page.evaluate(() => { thaw(); play('29-5'); place(10, 15); sim(0.3); const a = cut(12, { short: true }); const b = cut(12, { long: true }); const c = cut(12); return { a, b, c }; });
    check('29-5: cut too short or too long, nothing; held through the band and let go at its end, the take plays and the gate lifts', r.a.ok && r.b.ok && r.c.ok && r.c.done, r);
    await page.evaluate(() => { sim(0.2); freeze(); }); await shot('51-29-5-take.png');
    const t = await page.evaluate(() => { thaw(); play('29-5'); place(148, 15); sim(0.3); const a = cut(150, { long: true }); const b = cut(150); return { a, b }; });
    check('29-5 twist: the thunderclap with its rattle is too long; just the crack is a take', t.a.ok && t.b.ok && t.b.done, t);
    await page.evaluate(() => { freeze(); }); await shot('52-29-5-thunder.png');
    const leg = await page.evaluate(legs => { fresh(); play('29-5'); place(2, 15); for (const [, code] of legs) { const r = eval(code); if (r && r.ok === false) return { ok: false, code, r, tile: tileOf() }; } sim(3, { right: true }); return { ok: true, state: S().state }; }, S5_ROUTE);
    check('29-5 played start to finish with real inputs: five takes cut, five gates lifted', leg.ok && /clear|tally|results/.test(leg.state), leg);
    await page.evaluate(() => { play('29-5'); }); await pano('53-29-5-panorama.png', 0.35);
  });
};
// ---------------- 29-5's room: drop through the gap in the boards where the sand puffs up ----------------
LEVELS.r5 = async (page, shot) => { await run0(page, 'r5', () => roomRun(page, shot, '56-29-5-B20', () => {
  play('29-5'); place(97, 15); sim(0.3); const r = AP.route([[104, 19]]); walkTo(110, 3); const aid = door(); return { ok: aid === 'cabin', aid, r, inX: 110, other: true, how: 'drop through the gap in the boards (sand puffs up out of it) to the cable run, the door' }; })); };
// ---------------- 29-6 the lead-in ----------------
const S6_ROUTE = [
  [2, "micTake(13, 'tin')"], [13, "safeWalk(38)"], [38, "micTake(44, 'rice')"], [44, "safeWalk(62)"], [62, "AP.route([[70, 14]])"], [70, "safeWalk(84)"],
  [84, "micTake(84, 'pea')"], [84, "safeWalk(110)"], [110, "AP.route([[112, 11], [119, 9], [125, 14]])"], [125, "walkTo(130, 3)"], [130, "(() => ({ ok: door() === 'stage' }))()"]];
LEVELS.s6 = async (page, shot, run, pano) => {
  await run('s6', async () => {
    await page.evaluate(HELPERS);
    await page.evaluate(() => { fresh(); play('29-6'); place(11, 13); sim(0.3); walkTo(13, 3); press(); sim(0.4, { right: true }); sim(0.4); freeze(); }); await shot('60-29-6-mic.png');
    const w = await page.evaluate(() => { thaw(); play('29-6'); place(11, 13); sim(0.3); const a = micTake(13, 'rice'); return { wrong: a }; });
    check('29-6: a noise that does not match the card does not lift the gate', !w.wrong.ok, w);
    const q = await page.evaluate(() => { play('29-6'); place(82, 13); sim(0.3); walkTo(84, 3); press(); sim(0.1); const M = ents('FoleyMic').find(e => e.tx === 84), L = M.machines(), pea = L.findIndex(e => e.kind === 'pea'); let t = 0; while (M.sel !== pea && t < 3) { sim(1 / 120, { right: true }); t += 1 / 120; } sim(1 / 120); let noisy = false; t = 0; while (t < 6 && !noisy) { if (!L[pea].sounding()) noisy = true; else sim(1 / 120); t += 1 / 120; } press(); sim(0.1); const early = !M.got; sim(0.3, { jump: true, jumpPressed: true }); sim(0.5); return { early, noisy }; });
    check('29-6: while the machines are noisy the pea\'s tiny voice cannot be captured', q.noisy && q.early, q);
    const leg = await page.evaluate(legs => { fresh(); play('29-6'); place(2, 13); for (const [, code] of legs) { const r = eval(code); if (r && r.ok === false) return { ok: false, code, r, tile: tileOf() }; } return { ok: true, area: S().area.aid }; }, S6_ROUTE);
    check('29-6 lead-in played with real inputs: the three mic gates (the tin for the clap, the rice for the hail, the pea in the quiet), through the stage door', leg.ok && leg.area === 'stage', leg);
    await page.evaluate(() => { sim(3); freeze(); }); await shot('61-29-6-arena.png');
    await page.evaluate(() => { thaw(); play('29-6'); }); await pano('62-29-6-panorama.png', 0.4);
  });
};
// ---------------- 29-6's room: the loose panel at the foot of the proscenium ----------------
LEVELS.r6 = async (page, shot) => { await run0(page, 'r6', () => roomRun(page, shot, '66-29-6-RAIN', () => {
  play('29-6'); place(112, 13); sim(0.3); walkTo(115, 3); sim(1.2, { right: true }); walkTo(120, 2); const aid = door(); return { ok: aid === 'rain', aid, inX: 120, other: true, how: 'walk into the loose panel at the foot of the proscenium where the sand puffs' }; })); };

// ---------------- 29-1's room: up through the sand-trickling gap in the tunnel's ceiling ----------------
LEVELS.r1 = async (page, shot) => { await run0(page, 'r1', () => roomRun(page, shot, '16-29-1-B16', () => {
  play('29-1'); place(118, 13); sim(0.3); safeWalk(123); const r = AP.route([[125, 12], [128, 9]]); if (!r.ok) return { ok: false, r };
  walkTo(130, 2); const aid = door(); return { ok: aid === 'trim', aid, inX: 130, other: true, how: 'up onto the step block, through the gap in the tunnel ceiling where the sand trickles, the hatch in the cubby' }; })); };

// ---------------- the hidden entrance: Brazil 3-1 ----------------
LEVELS.entrance = async (page, shot, run) => {
  await run('entrance', async () => {
    await page.evaluate(HELPERS);
    const r0 = await page.evaluate(() => { fresh(); play('3-1'); const T = window.BRADY_TOUR; const ef = T.TourProgress.exitsFound('3-1'); walkTo(7, 3); sim(0.2); const s = S(); s.camX = 0; return { ef, land: !!(T.TourProgress.data().lands.foley), riser: ents('foleyRiser').length + ents('FoleyRiser').length, flap: ents('FoleyFlap').length }; });
    check('entrance: 3-1 has the riser and the painted sea; its exit card does not count the hidden exit; the land is still shut', r0.riser >= 1 && r0.flap === 1 && r0.ef.total === 2 && !r0.land, r0);
    await page.evaluate(() => { freeze(); }); await shot('00-entrance-before-3-1-riser.png');
    // a jump on the riser away from the fastener's wave does nothing; walking about on the riser does nothing
    const r1 = await page.evaluate(() => { thaw(); AP.route([[3, 13]]); sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.9, { jump: true, right: true }); AP.route([[1, 13]]); sim(1, { left: true }); return { state: S().state, going: !!S().foleyArrival }; });
    check('entrance: walking about and jumping on the riser away from the fastener does nothing', r1.state === 'play' && !r1.going, r1);
    const r2 = await page.evaluate(() => { AP.route([[1, 13]]); sim(1 / 120, { jump: true, jumpPressed: true, left: true }); sim(0.5, { jump: true, left: true }); return { going: !!S().foleyArrival, at: tileOf() }; });
    check('entrance: standing on the riser, a jump into the foam with the brass fastener (pushing toward the flat): Brady slips through the painted sea', r2.going, r2);
    await page.evaluate(() => { sim(1.6); freeze(); }); await shot('01-entrance-arrival.png');
    const r3 = await page.evaluate(() => { thaw(); sim(3); const T = window.BRADY_TOUR, d = window.BRADY.Save.data; return { state: S().state, key: S().exitKey, land: !!T.TourProgress.data().lands.foley, unlocked: !!d.unlocked['29-1'], done3: !!d.done['3-1'], ef: T.TourProgress.exitsFound('3-1') }; });
    check('entrance: the clear opens the land (29-1 unlocked) through the exit "foley"; 3-1 is not marked done by it; its exit card now counts 3', r3.key === 'foley' && r3.land && r3.unlocked && !r3.done3 && r3.ef.total === 3 && r3.ef.found === 1, r3);
  });
};
// a debugging hook: FOLEY_DBG='<page code>' node tools/sbw_foley_shots.js <dir> dbg (prints what the code returns)
LEVELS.dbg = async (page, shot) => { if (!want.includes('dbg')) return; await page.evaluate(HELPERS); const r = await page.evaluate(c => { try { return eval(c); } catch (e) { return String(e.stack || e); } }, process.env.FOLEY_DBG || '1'); console.log('DBG ' + JSON.stringify(r)); if (process.env.FOLEY_DBG_SHOT) await shot(process.env.FOLEY_DBG_SHOT); };
// ---------------- the map, the route-map pin ----------------
const openFoley = `(() => { fresh(); const B = window.BRADY, T = window.BRADY_TOUR, d = B.Save.data; T.TourProgress.data().lands.foley = true; d.unlocked['29-1'] = true; d.seenEncoreIntro = true; })()`;
LEVELS.map = async (page, shot, run) => {
  await run('map', async () => {
    const r = await page.evaluate(o => { eval(o); window.BRADY.goToMap('world', 29, '29-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { mode: s.mode, cc: s.ow && s.ow.C && s.ow.C.id }; }, openFoley);
    check('Foley Beach has its own walkable map', r.cc === 'foley', r);
    await page.evaluate(() => freeze()); await shot('70-foley-overworld-map.png');
    await page.evaluate(() => { thaw(); const s = S(); if (s.openRoute) s.openRoute({ dest: 'foley' }); for (let k = 0; k < 30; k++) sim(0.2); freeze(); }); await shot('71-route-map-foley-pin.png');
    const h = await page.evaluate(() => { thaw(); fresh(); const T = window.BRADY_TOUR; return { shut: !T.TourProgress.countryUnlocked(T.Tour.countries.foley) }; });
    check('before the entrance is used, the land is shut', h.shut, h);
  });
};

// ---------------- bot mode (--bot): enemies on, no invulnerability, the way a careful player goes ----------------
const BOT = args.includes('--bot');
const botRun = async (page, id, legs) => {
  if (want.length && !want.includes(id)) return;
  const r = await page.evaluate(([id, legs]) => {
    fresh(); play(id); let g = S(); let deaths = []; for (let k = 0; k < 600 && g.state !== 'play'; k++) sim(1 / 60);
    const p0 = () => { const p = P(); p.invuln = 0; return p; };
    p0(); const out = [];
    // a leg is [startX, code]: after a death Brady goes back to the last checkpoint, and the bot goes back to the
    // last leg that starts at or behind where he respawned (and plays on from there)
    let i = 0, guard = 0;
    while (i < legs.length && guard++ < 90) {
      const [lx, leg] = legs[i];
      let ok;
      try { ok = eval(leg); } catch (e) { ok = { ok: false, err: String(e) }; }
      if (S() !== g || !P() || P().dead || g.state !== 'play' && g.state !== 'clear' && g.state !== 'tally' && g.state !== 'results') {
        const died = S() !== g || !P() || P().dead || /dead|over/.test(g.state);
        if (died) { const p = P(), en = p && g.entities.filter(e => e.enemy && !e.remove).sort((a, b) => Math.abs(a.cx - p.cx) - Math.abs(b.cx - p.cx))[0]; deaths.push({ leg: i, at: p ? tileOf() : null, state: g.state, by: en ? [en.constructor.name, Math.round((en.cx - p.cx) / 3.2) / 10, Math.round((en.cy - p.cy) / 3.2) / 10] : null }); }
        for (let k = 0; k < 600 && (!S().player || S().player.dead || S().state !== 'play'); k++) sim(0.05);
        g = S(); if (!g.player || deaths.length > 8) break;
        sim(0.5); P().invuln = 0; const rx = tileOf()[0]; let j = i; while (j > 0 && legs[j][0] > rx + 1) j--; i = j; continue;
      }
      out.push(!!(ok && ok.ok !== false)); if (!(ok && ok.ok !== false)) { out.push({ leg: i, fail: ok, at: tileOf() }); break; }
      if (g.state !== 'play') break;
      P().invuln = 0; i++;
    }
    sim(3, { right: true });
    return { id, deaths: deaths.length, where: deaths.slice(0, 6), legsOk: out.filter(x => x !== true), state: g.state };
  }, [id, legs]);
  console.log('BOT ' + JSON.stringify(r));
  check(`bot ${id}: played start to finish with enemies on and no invulnerability (at most one death)`, /clear|tally|results/.test(r.state) && r.deaths <= 1, r);
};
LEVELS.bot = async (page) => {
  if (!BOT) return;
  await page.evaluate(HELPERS);
  await botRun(page, '29-1', S1_ROUTE);
  await botRun(page, '29-2', S2_ROUTE);
  await botRun(page, '29-3', S3_ROUTE);
  await botRun(page, '29-4', S4_ROUTE);
  await botRun(page, '29-5', S5_ROUTE);
  await botRun(page, '29-6', S6_ROUTE);
  if (LEVELS.botMore) await LEVELS.botMore(page, botRun);
};

// the boss with damage on, three runs in a row: the way a careful thumb plays him: take the mic, steer to the noise
// of his move, capture it as it sounds, play it back (the rice only once the tray is empty, the pea only in the
// quiet); jump the shock rings and the shells (that lets go of the mic: walk back, take it again)
LEVELS.botMore = async (page, botRun) => {
  if (want.length && !want.includes('boss')) return;
  const runs = [];
  for (let run = 0; run < 3; run++) runs.push(await page.evaluate(run => {
    fresh(); play('29-6'); toArea('stage'); sim(0.5 + run * 0.4); let g = S(); P().invuln = 0; let deaths = 0, t = 0;
    const B = () => S().entities.find(e => e.boss), M = () => S().entities.find(e => e.constructor.name === 'FoleyBossMic');
    // walk in until he wakes
    for (let q = 0; q < 1200 && !(B() && B().state === 'fight'); q++) { sim(1 / 120, { right: P().cx < M().cx - 4 }); t += 1 / 120; }
    const dead = () => S() !== g || !P() || P().dead || g.state !== 'play';
    const step = inp => { sim(1 / 120, inp || {}); t += 1 / 120; };
    const log = [];
    while (t < 300) {
      if (dead()) { deaths++; log.push({ ph: B() && B().phase, hp: B() && B().hp, at: P() ? tileOf() : null }); for (let q = 0; q < 400 && (!S().player || S().player.dead || S().state !== 'play'); q++) { sim(0.05); t += 0.05; } g = S(); if (!g.player) break; if (g.area.aid !== 'stage') toArea('stage'); P().invuln = 0; sim(1); continue; }
      const b = B(), m = M(), p = P(); if (!b || b.remove || b.state === 'dying' || b.hp <= 0) break;
      // danger first: a shot coming at him on his level: jump it (and let go of the mic)
      const sh = g.entities.find(e => e.constructor.name === 'TourShot' && !e.remove && Math.abs(e.cx - p.cx) < 60 && e.cy > p.y - 20 && e.cy < p.y + p.h + 30 && (e.vx || 0) * (p.cx - e.cx) >= 0);
      const shadow = (b.hailList || []).some(h => !h.fell && Math.abs(h.x - p.cx) < 26);
      if (sh && p.onGround) { step({ jump: true, jumpPressed: true }); for (let q = 0; q < 40; q++) step({ jump: true }); continue; }
      if (shadow && p.onGround) { const d = (b.hailList.find(h => !h.fell && Math.abs(h.x - p.cx) < 26).x < p.cx) ? 1 : -1; for (let q = 0; q < 30; q++) step({ right: d > 0, left: d < 0 }); continue; }
      const ph = b.phase || 1, want = ph === 1 ? 0 : ph === 2 ? 1 : 3;
      // to the mic, take it
      if (!m.fTouch(p)) { const dx = m.cx - p.cx; step({ right: dx > 6, left: dx < -6 }); continue; }
      if (!m.mounted) { step({ action: true, actionPressed: true }); continue; }
      if (m.sel !== want && !m.got) { step({ right: m.sel < want, left: m.sel > want }); continue; }
      const L = m.machines(), tg = L[want];
      if (!m.got) { if (tg && tg.sounding() && (ph !== 3 || b.at > 0.7)) step({ action: true, actionPressed: true }); else step(); continue; }
      if (ph === 2 && b.act !== 'empty') { step(); continue; }
      step({ action: true, actionPressed: true }); for (let q = 0; q < 60; q++) step();
    }
    const b = B(); return { hp: b && !b.remove ? b.hp : 0, deaths, log, t: Math.round(t) };
  }, run));
  console.log('BOT boss ' + JSON.stringify(runs));
  check('bot 29-6: Mr. Thunder beaten with damage on, three runs in a row, no deaths', runs.every(q => q.hp <= 0.01 && q.deaths === 0), runs);
};

(async () => {
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => {
    if (BOT) { await LEVELS.bot(page); return; }
    for (const k in LEVELS) if (k !== 'entrance' && k !== 'bot' && k !== 'botMore') { if (/^r\d/.test(k)) await LEVELS[k](page, shot); else await LEVELS[k](page, shot, run, pano); }
  });
  if (!BOT && LEVELS.entrance) await session({ width: 844, height: 390 }, async (page, shot, run, pano) => { await LEVELS.entrance(page, shot, run, pano); });
  if (!BOT) await session({ width: 390, height: 844 }, async (page, shot, run) => {
    await run('p-s1', async () => { await page.evaluate(HELPERS); await page.evaluate(() => { fresh(); play('29-1'); place(14, 13); sim(0.4); freeze(); }); await shot('90-portrait-29-1.png'); });
    if (LEVELS.portraitBoss) await LEVELS.portraitBoss(page, shot, run);
    await run('p-map', async () => { await page.evaluate(o => { thaw(); eval(o); window.BRADY.goToMap('world', 29, '29-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } freeze(); }, openFoley); await shot('92-portrait-foley-map.png'); });
  });
  console.log(failures ? `${failures} FOLEY CHECK(S) FAILED` : 'ALL FOLEY CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
