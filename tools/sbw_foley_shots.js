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
  if (LEVELS.botMore) await LEVELS.botMore(page, botRun);
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
