// The Moon (world 18, the last land of the Encore Tour): in-browser checks and phone-size screenshots.
// Each level's own mechanic is PLAYED with real inputs through the game loop: an autopilot plans each hop with the
// game's own physics function on a copy of Brady's body (the planner never moves him), then feeds those exact
// inputs to the real game frame by frame and checks where he really lands (closed loop: it re-plans if he is off).
// It walks each level's main route from the start to the gate (and the secret routes), takes 844x390 landscape shots
// of the key beats, 390x844 portrait shots of 18-1, the boss and the map, and a panorama of every level area.
// usage: BRADY_DIST=<dist> node tools/sbw_moon_shots.js <outdir> [--checks] [name ...]   (--checks: no pictures)
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'moon-shots'), checksOnly = args.includes('--checks');
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
      hooks: [],   // (prog, t, b, inp) => {} : a level's own buttons (the moon files' mechanics)
      input(prog, t, b) {
        const d = prog.dir, inp = { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false, action: false, actionPressed: false };
        let dir = d;
        if (prog.driftPlan) { const q = window.BRADY_MOON.driftInput(prog.driftPlan, prog.dir, t); for (const h of AP.hooks) h(prog, t, b, q); return q; }
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
        if (Ar.moon && Ar.moon.drift) { for (const dir of dirs) for (const plan of window.BRADY_MOON.DRIFT_PLANS) out.push({ driftPlan: plan, dir }); return out; }
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
      // drifting junk is where it will be by then (its path is a clock): a plan that meets it is no plan
      bad(b, A, t) {
        for (const e of S().entities) if (e.constructor.name === 'MoonJunk') { const k = (Math.sin((e.t + t) * e.sp + e.ph) + 1) / 2, x = e.x0 + e.ax * k, y = e.y0 + e.ay * k; if (b.x < x + 26 + 4 && b.x + b.w > x - 4 && b.y < y + 26 + 4 && b.y + b.h > y - 4) return true; }
        return false;
      },
      body(p) {
        const b = {}; for (const k of ['x', 'y', 'w', 'h', 'vx', 'vy', 'onGround', 'coyote', 'jumpBuf', 'jumping', 'runT', 'airMax', 'facing', 'groundTile', 'groundTx', 'groundTy', 'dropT', 'flipped', 'liftPin', 'liftStill', 'liftPx', 'liftOff', 'moon']) b[k] = p[k] && typeof p[k] === 'object' ? JSON.parse(JSON.stringify(p[k])) : p[k];
        b.crouch = false; b.inWater = false; b.stroke = 0; b.ride = null; b.sim = true; return b;
      },
      // simulate a program from Brady's current state on the live area; where does he settle?
      trial(prog, maxT) {
        const g = S(), A = g.area, b = AP.body(P()), dt = 1 / 120;
        let t = 0, air = false, landT = null; prog._jt = null; prog._s = {};
        while (t < (maxT || 6)) {
          const inp = AP.input(prog, t, b);
          if (landT != null) { inp.left = inp.right = false; inp.jump = inp.jumpPressed = false; inp.down = false; if (A.moon && A.moon.rover && Math.abs(b.vx) > 40) inp[b.vx > 0 ? 'left' : 'right'] = true; }
          // the player's own drop-through (11_player.js): down + jump on a one-way floor
          if (inp.down && inp.jumpPressed && b.onGround && b.groundTile === window.BRADY.T.SEMI) { b.dropT = 0.22; b.y += 2; b.onGround = false; inp.jumpPressed = false; }
          window.BRADY_MOON.phys(b, inp, A, dt, null, {});
          if (AP.after) AP.after(b, inp, A, dt);
          t += dt;
          if (b.y > A.H * 32 + 20 || window.BRADY_MOON.lavaContact(b, A) || window.BRADY_MOON.spikeContact(b, A)) return null;
          if (AP.bad && AP.bad(b, A, t)) return null;
          if (!b.onGround) air = true;
          if (prog.walkTo != null) { if (b.onGround && !air && Math.abs(b.x + b.w / 2 - prog.walkTo) <= 8 && Math.abs(b.vx) < 4) return { tx: Math.floor((b.x + b.w / 2) / 32), ty: b.groundTy, t, flipped: !!b.flipped }; continue; }
          if (b.onGround && (air || (prog.noJump && prog.air !== 'stopgo') || prog.stand) && landT == null && t > 0.05) landT = t;
          if (prog.driftPlan && !air && t > 0.6) return null;
          if (landT != null && Math.abs(b.vx) < 4 && b.onGround) return { tx: Math.floor((b.x + b.w / 2) / 32), ty: b.groundTy, t, flipped: !!b.flipped };
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
          if (prog.run == null) prog.run = 0;
          const r = AP.trial(prog, o.maxT);
          if (!r) continue;
          const okY = r.ty === target[1] && (!!target[2] === r.flipped);
          if (!okY || !AP.samePlate(r.tx, target, o.tol)) continue;
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
          if (landed) { inp.left = inp.right = inp.jump = inp.jumpPressed = inp.down = false; if (g.area.moon && g.area.moon.rover && Math.abs(p.vx) > 40) inp[p.vx > 0 ? 'left' : 'right'] = true; }
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

const LEVELS = {};
// ---------------- 18-1 One Small Hop ----------------
LEVELS.hop = async (page, shot, run, pano) => {
  await run('hop', async () => {
    await page.evaluate(() => { fresh(); play('18-1'); place(4, 20); sim(0.4); freeze(); });
    await shot('10-18-1-start.png');
    // the low gravity: a held jump from standing goes very high and hangs; a tap is a short hop
    const r = await page.evaluate(() => {
      thaw(); place(4, 20); sim(0.3); const p = P(), y0 = p.y; let top = y0, t = 0;
      sim(1 / 120, { jump: true, jumpPressed: true }); while (!p.onGround && t < 4) { sim(1 / 120, { jump: true }); top = Math.min(top, p.y); t += 1 / 120; }
      const high = (y0 - top) / 32, hang = t;
      sim(0.3); const y1 = p.y; let top2 = y1; sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.08, { jump: true }); for (let k = 0; k < 120 && !p.onGround; k++) { sim(1 / 120); top2 = Math.min(top2, p.y); }
      return { high: +high.toFixed(2), hang: +hang.toFixed(2), hop: +((y1 - top2) / 32).toFixed(2), g: S().area.gravity };
    });
    check('18-1: low gravity: a held jump rises over 7 tiles and hangs over 1.3 s; a tap is a hop under 2.5 tiles', r.high > 7 && r.hang > 1.3 && r.hop < 2.5 && r.g < 1, r);
    // the spike tunnel: a full jump under the overhang hits the spikes
    const r2 = await page.evaluate(() => { const p = P(); place(34, 20); sim(0.3); p.invuln = 0; const h0 = p.power; sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.6, { jump: true }); const hurt = p.invuln > 0 || p.power !== h0 || !!p.dead; p.invuln = 999; sim(1); return { hurt, h0, power: p.power }; });
    check('18-1: a full jump in the spike tunnel hits the ceiling spikes', r2.hurt, r2);
    // the main route, hop by hop with real inputs: the dip, the rim wall, the tunnel (tap hops over the boulder),
    // the first geyser up to P1's shelf, the craters, the cracked boulder, the slab, the big crater's geyser up the cliff
    await page.evaluate(() => { play('18-1'); place(3, 20); sim(0.2); });
    const legA = await page.evaluate(() => AP.route([[11, 21], [19, 21], [25, 16], [29, 21], [36, 21], [41, 21], [50, 21], [55, 21], [62, 8]]));
    check('18-1: played: the hop over the dip, the rim wall, tap-hops through the spike tunnel, the first geyser up to P1', legA.ok, legA);
    await page.evaluate(() => freeze()); await shot('11-18-1-geyser-shelf.png'); await page.evaluate(() => thaw());
    const gold1 = await page.evaluate(() => S().goldGot ? S().goldGot.slice() : (S().gold || null));
    const legB = await page.evaluate(() => AP.route([[63, 21], [72, 19], [85, 21], [100, 21], [108, 21], [115, 21], [122, 16], [130, 21], [136, 21]]));
    check('18-1: played: the deadly craters, the island, the stagehand, the slab over the wide crater', legB.ok, legB);
    await page.evaluate(() => { const g = S(); g.camY = g.camTargetY(true); freeze(); }); await shot('12-18-1-crater-field.png'); await page.evaluate(() => thaw());
    const legC = await page.evaluate(() => AP.route([[131, 21], [149, 12]], { maxT: 7 }));
    check('18-1: played: dropped into the big crater, the steady geyser carries Brady up and he steers onto the cliff', legC.ok, legC);
    await page.evaluate(() => freeze()); await shot('13-18-1-big-geyser-cliff.png'); await page.evaluate(() => thaw());
    const legD = await page.evaluate(() => AP.route([[155, 21], [161, 21], [172, 21], [180, 21], [184, 21], [202, 12], [214, 16], [219, 14], [222, 14]], { maxT: 7 }));
    check('18-1: played: the spike overhangs over the craters (run, medium jump), the golf balls, the geyser under spikes, the last crater', legD.ok, legD);
    await page.evaluate(() => freeze()); await shot('14-18-1-telescope-rim.png'); await page.evaluate(() => thaw());
    const legE = await page.evaluate(() => { const r = AP.route([[230, 21], [240, 21]]); if (!r.ok) return r; sim(2, { right: true }); return { ok: true, state: S().state, key: S().exitKey }; });
    check('18-1: played to the gate: the main exit', legE.ok && (legE.state === 'clear' || legE.state === 'tally' || legE.state === 'results'), legE);
    // the star gate: from the last rim, into the narrow chasm; its faint vent blows Brady up to the star rock
    const sec = await page.evaluate(() => { play('18-1'); place(222, 13); sim(0.3); const r = AP.route([[231, 7]], { maxT: 8 }); if (!r.ok) return r; sim(0.2); freeze(); return { ok: true }; });
    check('18-1: played: the faint vent in the chasm lifts Brady to the star rock (the secret exit)', sec.ok, sec);
    await shot('15-18-1-star-gate.png');
    const sec2 = await page.evaluate(() => { thaw(); sim(1.5, { right: true }); sim(1.5, { left: true }); return { state: S().state, key: S().exitKey }; });
    check('18-1: the star gate is the secret exit', sec2.state !== 'play' && sec2.key === 'secret', sec2);
    // the pulsing geyser: it rumbles (zone off) before it blows
    const pg = await page.evaluate(() => {
      play('18-1'); place(108, 20); sim(0.3);
      const gz = ents('MoonGeyser').find(e => !e.steady), z = gz.zone(); const seen = {};
      for (let k = 0; k < 120 * 6; k++) { sim(1 / 120); const c = gz.cycle(); seen[c] = seen[c] || { off: z.off }; }
      return { warnOff: seen.warn && seen.warn.off, blowOn: seen.blow && !seen.blow.off, restOff: seen.rest && seen.rest.off };
    });
    check('18-1: a pulsing geyser rumbles for a second (no lift yet), then blows', pg.warnOff && pg.blowOn && pg.restOff, pg);
    await page.evaluate(() => { const gz = ents('MoonGeyser').find(e => !e.steady); for (let k = 0; k < 600 && gz.cycle() !== 'warn'; k++) sim(1 / 120); sim(0.5); freeze(); }); await shot('16-18-1-geyser-tell.png');
    // the golf rain: the ring warns before the ball lands
    const gr = await page.evaluate(() => {
      thaw(); place(180, 20); sim(0.2); const gz = ents('MoonGolfRain').sort((a, b) => Math.abs(a.cx - P().cx) - Math.abs(b.cx - P().cx))[0]; let warnAt = null, ballAt = null; const n0 = S().entities.length;
      for (let k = 0; k < 120 * 4; k++) { sim(1 / 120); const k2 = gz.phaseK(); if (warnAt == null && k2 > gz.period - gz.WARN) warnAt = S().t; const ball = S().entities.find(e => e.constructor.name === 'TourShot' && Math.abs(e.cx - gz.cx) < 20 && e.y + e.h > gz.y - 4); if (ball && warnAt != null && ballAt == null) ballAt = S().t; }
      return { lead: warnAt != null && ballAt != null ? +(ballAt - warnAt).toFixed(2) : null, warnAt, shots: S().entities.filter(e => e.constructor.name === 'TourShot').length, n: gz.n, on: S().onScreen(gz, 200) };
    });
    check('18-1: golf balls: the target ring shows at least 0.5 s before the ball comes down', gr.lead != null && gr.lead >= 0.5, gr);
    await page.evaluate(() => { const gz = ents('MoonGolfRain').sort((a, b) => Math.abs(a.cx - P().cx) - Math.abs(b.cx - P().cx))[0]; for (let k = 0; k < 600 && !(gz.phaseK() > gz.period - 0.5); k++) sim(1 / 120); freeze(); }); await shot('17-18-1-golf-rain.png');
    // the practice green behind the cracked boulder
    const gn = await page.evaluate(() => { thaw(); play('18-1'); place(90, 20); sim(0.2); const r = AP.go([97, 21], { tol: 0 }); for (let k = 0; k < 20 && S().area.aid !== 'green'; k++) sim(0.1, { up: true, upPressed: true }); sim(1); return { area: S().area.aid, r: r.ok }; });
    check('18-1: walking into the cracked boulder leads to the practice green', gn.area === 'green', gn);
    await page.evaluate(() => { sim(1); place(10, 11); sim(0.3); freeze(); }); await shot('18-18-1-practice-green.png');
    await page.evaluate(() => { thaw(); play('18-1'); }); await pano('pano-18-1-surface.png');
    await page.evaluate(() => toArea('green')); await pano('pano-18-1-green.png');
  });
};

// ---------------- 18-3 Moon Buggy ----------------
// (the autopilot levels the buggy in the air: in a rover area the stick only leans it, so the path is the same)
const roverHook = `AP.hooks.push((prog, t, b, inp) => { const A = S().area; if (!(A.moon && A.moon.rover) || b.onGround || !b.moon) return; const a = (b.moon.ang || 0) * (b.facing || 1); inp.left = inp.right = false; if (Math.abs(a) > 0.08) { if (a * (b.facing || 1) > 0) inp[b.facing > 0 ? 'left' : 'right'] = true; else inp[b.facing > 0 ? 'right' : 'left'] = true; } });`;
LEVELS.buggy = async (page, shot, run, pano) => {
  await run('buggy', async () => {
    await page.evaluate(roverHook);
    await page.evaluate(() => { fresh(); play('18-3'); place(4, 19); sim(0.4); freeze(); });
    await shot('30-18-3-start.png');
    // throttle and momentum: full speed in a second or two; let go and it keeps rolling
    const r = await page.evaluate(() => { thaw(); place(63, 19); sim(0.2); const p = P(); sim(1.4, { right: true }); const v1 = p.vx / 32; sim(0.5); const v2 = p.vx / 32; sim(0.4, { left: true }); const v3 = p.vx / 32; return { top: +v1.toFixed(1), rolling: +v2.toFixed(1), braked: +v3.toFixed(1) }; });
    check('18-3: the throttle takes the buggy past 10 tiles/s, it keeps rolling when let go, the brake stops it', r.top > 10 && r.rolling > 8 && r.braked < 2, r);
    // the wheels climb a one-tile rock by themselves
    const r2 = await page.evaluate(() => { play('18-3'); place(37, 19); sim(0.2); const p = P(); sim(1.2, { right: true }); return { x: Math.floor(p.cx / 32), row: p.groundTy }; });
    check('18-3: the springy wheels climb a one-tile rock without a hop', r2.x > 41, r2);
    // lean: a jump with the nose held down lands crooked (CRASH, a hit); levelled, it lands NICE and keeps its speed
    const r3 = await page.evaluate(() => {
      play('18-3'); place(131, 19); sim(0.4); const p = P(); p.invuln = 0; const pw = p.power; let said = [];
      const tx = S().parts.text; S().parts.text = function (x, y, txt) { said.push(txt); return tx.apply(this, arguments); };
      sim(0.6, { right: true }); sim(1 / 120, { right: true, jump: true, jumpPressed: true }); const angs = []; for (let k = 0; k < 12; k++) { sim(0.1, { right: true, jump: true }); angs.push([+(p.moon.ang || 0).toFixed(2), p.onGround]); } sim(0.6);
      const crash = said.includes('CRASH!'), hurt = p.power !== pw || p.invuln > 0; p.invuln = 999; S().parts.text = tx; return { crash, hurt, said, angs };
    });
    check('18-3: holding the stick all flight tips the buggy onto its nose: CRASH, and it costs a hit', r3.crash && r3.hurt, r3);
    await page.evaluate(() => { play('18-3'); place(3, 19); sim(0.2); });
    const legA = await page.evaluate(() => AP.route([[28, 20], [37, 20], [42, 20], [47, 20], [54, 20], [65, 20], [72, 20], [99, 20]], { maxT: 7 }));
    check('18-3: played: the trench, the rocks, the boulder, the first crater, the long crater at speed', legA.ok, legA);
    await page.evaluate(() => { freeze(); }); await shot('31-18-3-after-long-crater.png'); await page.evaluate(() => thaw());
    const legB = await page.evaluate(() => AP.route([[110, 20], [122, 20], [131, 20], [150, 20], [158, 20], [190, 16]], { maxT: 7 }));
    check('18-3: played: short hops at speed under the spike overhang, the ridges, the geyser flings the buggy onto the mesa', legB.ok, legB);
    await page.evaluate(() => { freeze(); }); await shot('32-18-3-mesa.png'); await page.evaluate(() => thaw());
    const legC = await page.evaluate(() => { const r = AP.route([[205, 20], [222, 20], [229, 20], [246, 20], [258, 20], [270, 20], [288, 20]], { maxT: 7 }); if (!r.ok) return r; sim(2, { right: true }); return { ok: true, state: S().state }; });
    check('18-3: played: the last third (craters, golf balls, the geyser over the wall, the overhang, the last crater) to the gate', legC.ok && legC.state !== 'play', legC);
    // a mid-air shot
    await page.evaluate(() => { play('18-3'); place(76, 19); sim(0.2); sim(1.0, { right: true }); sim(1 / 120, { right: true, jump: true, jumpPressed: true }); sim(0.45, { jump: true }); freeze(); });
    await shot('33-18-3-airborne.png');
    const sec = await page.evaluate(() => { thaw(); play('18-3'); place(136, 19); sim(0.2); AP.go([142, 20]); for (let k = 0; k < 20 && S().area.aid !== 'depot'; k++) sim(0.1, { up: true, upPressed: true }); sim(1); return { area: S().area.aid }; });
    check('18-3: the blinking garage door leads to the rover depot', sec.area === 'depot', sec);
    await page.evaluate(() => { place(10, 11); sim(0.3); freeze(); }); await shot('34-18-3-depot.png');
    await page.evaluate(() => { thaw(); play('18-3'); }); await pano('pano-18-3-buggy.png');
  });
};

// ---------------- 18-4 The Moon Base ----------------
LEVELS.base = async (page, shot, run, pano) => {
  await run('base', async () => {
    await page.evaluate(() => { AP.boots = () => { sim(1 / 120, { action: true, actionPressed: true }); sim(1.6); return window.BRADY_MOON.kit.magBoots(S()); }; });
    await page.evaluate(() => { fresh(); play('18-4'); place(4, 19); sim(0.4); freeze(); });
    await shot('40-18-4-start.png');
    // the boots: on under the metal, Brady falls up and stands on the ceiling; off, he drops
    const r = await page.evaluate(() => { thaw(); place(17, 19); sim(0.3); const on = AP.boots(), p = P(); const up = { flipped: !!p.flipped, row: p.groundTy, onG: p.onGround }; const off = AP.boots(); return { on, up, off, back: { flipped: !!p.flipped, row: p.groundTy } }; });
    check('18-4: the action button switches the boots: under the panels Brady falls up onto the ceiling, and off again he drops', r.on && r.up.flipped && r.up.row === 2 && !r.off && !r.back.flipped && r.back.row === 20, r);
    await page.evaluate(() => { place(17, 19); sim(0.2); AP.boots(); sim(0.3); freeze(); }); await shot('41-18-4-on-the-ceiling.png');
    await page.evaluate(() => { thaw(); play('18-4'); place(3, 19); sim(0.2); });
    const legA = await page.evaluate(() => AP.route([[16, 20], () => AP.boots(), [22, 2, 1], () => AP.boots(), [27, 20], () => AP.boots(), [42, 2, 1], () => AP.boots(), [53, 20], () => AP.boots(), [72, 2, 1], [75, 20], () => AP.boots()], { tol: 1 }));
    check('18-4: played: the boots up to P1 on the ceiling, over the spike floor, across the deadly pit on the ceiling', legA.ok, legA);
    const legB = await page.evaluate(() => AP.route([[85, 20], [97, 20], () => AP.boots(), [104, 2, 1], () => AP.boots(), [109, 11], () => AP.boots(), [112, 2, 1], [124, 2, 1], () => AP.boots(), [124, 9]], { tol: 1 }));
    check('18-4: played: two metal spans with a gap (drop to the ledge between, back up), down onto the storeroom ledge', legB.ok, legB);
    await page.evaluate(() => { freeze(); }); await shot('42-18-4-storeroom-ledge.png'); await page.evaluate(() => thaw());
    const st = await page.evaluate(() => { AP.go([124, 9]); for (let k = 0; k < 20 && S().area.aid !== 'store'; k++) sim(0.1, { up: true, upPressed: true }); sim(0.5); const a = S().area.aid; if (a === 'store') { sim(0.2); P(); } return { area: a }; });
    check('18-4: the blinking hatch on the ledge leads into the storeroom', st.area === 'store', st);
    await page.evaluate(() => { place(10, 11); sim(0.3); freeze(); }); await shot('43-18-4-storeroom.png');
    const legC = await page.evaluate(() => { thaw(); play('18-4'); place(126, 19); sim(0.3); return AP.route([[134, 20], [148, 10], [166, 20], [172, 20]], { tol: 0, maxT: 7 }); });
    check('18-4: played: the air vent up to the ledge, the leap over the spike floor to the airlock', legC.ok, legC);
    const yd = await page.evaluate(() => { for (let k = 0; k < 20 && S().area.aid !== 'yard'; k++) sim(0.1, { up: true, upPressed: true }); sim(1); if (S().area.aid !== 'yard') return { area: S().area.aid }; const r = AP.route([[3, 18], [24, 13], [26, 13], [49, 16], [51, 16], [82, 15], [89, 15]], { maxT: 7 }); if (!r.ok) return r; sim(1.5, { right: true }); return { ok: true, state: S().state }; });
    check('18-4: played: through the airlock into the yard, a spacewalk past the junk to the stage door (the gate)', yd.ok && yd.state !== 'play', yd);
    await page.evaluate(() => { play('18-4'); toArea('yard', 4, 17); sim(0.3); freeze(); }); await shot('44-18-4-yard.png');
    await page.evaluate(() => { thaw(); play('18-4'); }); await pano('pano-18-4-base.png');
    await page.evaluate(() => toArea('yard')); await pano('pano-18-4-yard.png');
  });
};

// ---------------- 18-6 Connect the Stars ----------------
LEVELS.stars = async (page, shot, run, pano) => {
  await run('stars', async () => {
    await page.evaluate(() => { fresh(); play('18-6'); place(3, 18); sim(0.4); freeze(); });
    await shot('60-18-6-start.png');
    // a wrong star puts the constellation out
    const r = await page.evaluate(() => { thaw(); const A = () => S().area.moonStars[0]; AP.go([13, 19]); const one = A().lit.length; AP.go([18, 19]); const after = A().lit.length; return { one, after, bridge: !!S().toggleBit(0) }; });
    check('18-6: the first star lights; a wrong one puts the constellation out (no bridge)', r.one === 1 && r.after === 0 && !r.bridge, r);
    const r2 = await page.evaluate(() => { const ok = AP.route([[13, 19], [9, 19], [18, 19]]); return { ok: ok.ok, bridge: !!S().toggleBit(0), tile: S().area.tiles[19 * S().area.W + 30] }; });
    check('18-6: played: stars 1, 2, 3 in order: the constellation becomes a bridge of light over the pit', r2.ok && r2.bridge, r2);
    await page.evaluate(() => { sim(0.6); freeze(); }); await shot('61-18-6-first-bridge.png'); await page.evaluate(() => thaw());
    const legB = await page.evaluate(() => { const r = AP.route([[30, 19], [42, 19], [54, 11], [42, 19], [54, 11], [61, 15], [54, 11], [48, 15]], { maxT: 7 }); return Object.assign(r, { bridge: !!S().toggleBit(1) }); });
    check('18-6: played: the second constellation over the gap (in order, skipping round the wrong star), its bridge', legB.ok && legB.bridge, legB);
    const legC = await page.evaluate(() => { const r = AP.route([[66, 19], [80, 19], [93, 19], [101, 15], [107, 11], [101, 7], [108, 3]], { maxT: 7 }); return Object.assign(r, { bridge: !!S().toggleBit(2) }); });
    check('18-6: played: the third constellation up the ledges, a bridge high over the void', legC.ok && legC.bridge, legC);
    await page.evaluate(() => { sim(0.6); freeze(); }); await shot('62-18-6-high-bridge.png'); await page.evaluate(() => thaw());
    const legD = await page.evaluate(() => { const r = AP.route([[118, 3], [126, 7], [136, 7], [141, 12], [147, 16], [153, 10], [159, 14], [165, 11]], { maxT: 7 }); if (!r.ok) return r; const b = !!S().toggleBit(3); const r2 = AP.route([[176, 11], [189, 11]]); sim(1.5, { right: true }); return { ok: r2.ok, bridge: b, state: S().state }; });
    check('18-6: played: the last constellation on floating rocks, its bridge to the gate', legD.ok && legD.bridge && legD.state !== 'play', legD);
    const sec = await page.evaluate(() => { play('18-6'); place(126, 6); sim(0.2); AP.go([131, 7]); for (let k = 0; k < 20 && S().area.aid !== 'scope'; k++) sim(0.1, { up: true, upPressed: true }); sim(0.8); return { area: S().area.aid }; });
    check('18-6: the loose panel on the plateau leads to the observatory', sec.area === 'scope', sec);
    await page.evaluate(() => { place(10, 11); sim(0.3); freeze(); }); await shot('63-18-6-observatory.png');
    await page.evaluate(() => { thaw(); play('18-6'); }); await pano('pano-18-6-sky.png');
  });
};

// ---------------- 18-2 Spacewalk ----------------
LEVELS.walk = async (page, shot, run, pano) => {
  await run('walk', async () => {
    await page.evaluate(() => { fresh(); play('18-2'); place(4, 21); sim(0.4); freeze(); });
    await shot('20-18-2-start.png');
    // a push off and a puff: the puff lifts him and spends one of three
    const r = await page.evaluate(() => {
      thaw(); place(4, 21); sim(0.3); const p = P();
      sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.5); const vy0 = p.vy, t0 = p.moon.tank;
      sim(1 / 120, { jump: true, jumpPressed: true }); const vy1 = p.vy, t1 = p.moon.tank;
      sim(1 / 120, { jump: true, jumpPressed: true }); sim(1 / 120, { jump: true, jumpPressed: true }); sim(1 / 120, { jump: true, jumpPressed: true }); const t3 = p.moon.tank;
      const vx0 = p.vx; sim(0.5); const drift = Math.abs(p.vx - vx0);
      return { vy0: Math.round(vy0 / 32), vy1: Math.round(vy1 / 32), t0, t1, t3, drift: +(drift / 32).toFixed(2) };
    });
    check('18-2: a mid-air jump is a puff (up, one air used); the tank runs dry at two; momentum is kept', r.vy1 < -5 && r.t0 === 2 && r.t1 === 1 && r.t3 === 0 && r.drift < 0.2, r);
    await page.evaluate(() => { play('18-2'); place(3, 21); sim(0.2); });
    const legA = await page.evaluate(() => AP.route([[18, 22], [21, 22], [32, 16], [30, 16], [43, 20]], { maxT: 7 }));
    check('18-2: played: pushing off across the first gap, a puff up to the high plate', legA.ok, legA);
    await page.evaluate(() => { sim(0.1); freeze(); }); await shot('21-18-2-plates.png'); await page.evaluate(() => thaw());
    const legB = await page.evaluate(() => AP.route([[42, 20], [76, 19]], { maxT: 7 }));
    check('18-2: played: across the first void (puffs, the valve on the way)', legB.ok, legB);
    const legC = await page.evaluate(() => AP.route([[84, 19], [92, 15], [94, 15], [101, 10], [103, 10], [110, 5], [108, 5], [124, 15], [129, 15], [143, 8], [146, 8], [150, 13], [158, 13], [166, 13]], { maxT: 7 }));
    check('18-2: played: the climb under the antenna spikes, the air vent, the gantry', legC.ok, legC);
    await page.evaluate(() => { sim(0.1); freeze(); }); await shot('22-18-2-gantry.png'); await page.evaluate(() => thaw());
    const legD = await page.evaluate(() => { let r; for (let a = 0; a < 3; a++) { if (a) { play('18-2'); place(166, 12); sim(0.4); } r = AP.route([[208, 16]], { maxT: 7 }); if (r.ok) break; } if (!r.ok) return r; const r2 = AP.route([[214, 16]]); sim(1.5, { right: true }); return { ok: r2.ok, state: S().state }; });   // (the junk drifts on a clock: a try that meets it is tried again from the gantry, as a player would)
    check('18-2: played: the long void with the valve chain to the far airlock and the gate', legD.ok && legD.state !== 'play', legD);
    // mid-flight with the gauge and the tether
    await page.evaluate(() => { play('18-2'); place(165, 12); sim(0.2); sim(1 / 120, { right: true, jump: true, jumpPressed: true }); sim(0.7, { right: true }); sim(1 / 120, { right: true, jump: true, jumpPressed: true }); sim(0.3, { right: true }); freeze(); });
    await shot('23-18-2-mid-flight.png');
    const sec = await page.evaluate(() => { thaw(); play('18-2'); place(110, 4); sim(0.3); const r = AP.route([[112, 5], [116, 3]], { maxT: 7 }); if (!r.ok) return r; AP.go([118, 3], { tol: 0 }); if (!r.ok) return r; for (let k = 0; k < 20 && S().area.aid !== 'locker'; k++) sim(0.1, { up: true, upPressed: true }); sim(1); return { ok: true, area: S().area.aid }; });
    check('18-2: played: up to the blinking airlock: the locker room', sec.ok && sec.area === 'locker', sec);
    await page.evaluate(() => { place(10, 11); sim(0.3); freeze(); }); await shot('24-18-2-locker.png');
    await page.evaluate(() => { thaw(); play('18-2'); }); await pano('pano-18-2-walk.png');
  });
};

// ---------------- the full runs: each level start to finish, enemies on, no invulnerability ----------------
// (only on request: node tools/sbw_moon_shots.js <dir> bot). Each route is a list of standing tiles (and button
// steps); {r: [x, row]} marks a checkpoint's restart spot. On a death the bot waits for the respawn, goes back to the
// last restart spot at or behind it and carries on. Deaths are counted with where they happened.
const BOT = {
  '18-1': [{ r: [3, 21] }, [11, 21], [19, 21], [25, 16], [29, 21], [36, 21], [41, 21], { r: [48, 21] }, [50, 21], [55, 21], [62, 8], [63, 21], [72, 19], { r: [85, 21] }, [100, 21], [108, 21], [115, 21], [122, 16], [130, 21], [136, 21], [131, 21], [149, 12], { r: [157, 21] }, [161, 21], [172, 21], { r: [181, 21] }, [184, 21], [202, 12], [214, 16], [219, 14], { r: [223, 14] }, [230, 21], [243, 21]],
  '18-2': [{ r: [3, 22] }, [18, 22], [21, 22], [32, 16], [30, 16], [43, 20], [42, 20], { r: [74, 19] }, [84, 19], [92, 15], [94, 15], [101, 10], [103, 10], [110, 5], [108, 5], { r: [124, 15] }, [129, 15], [143, 8], [146, 8], { r: [152, 13] }, [158, 13], [166, 13], { r: [205, 16] }, [214, 16]],
  '18-3': [{ r: [3, 20] }, [28, 20], [37, 20], [42, 20], [47, 20], [54, 20], { r: [64, 20] }, [72, 20], { r: [99, 20] }, [110, 20], [122, 20], [131, 20], { r: [148, 20] }, [150, 20], [158, 20], [190, 16], { r: [204, 20] }, [205, 20], [222, 20], [229, 20], [235, 20], { r: [246, 20] }, [246, 20], [258, 20], [270, 20], [292, 20]],
  '18-4': [{ r: [3, 20] }, [16, 20], 'B1', [22, 2, 1], 'B0', [27, 20], 'B1', [42, 2, 1], 'B0', [53, 20], 'B1', [72, 2, 1], [75, 20], 'B0', { r: [82, 20] }, [85, 20], [97, 20], 'B1', [104, 2, 1], 'B0', [109, 11], 'B1', [112, 2, 1], [124, 2, 1], 'B0', [124, 9], [128, 20], { r: [132, 20] }, [134, 20], [148, 10], [166, 20], { r: [169, 20] }, [172, 20], 'DOOR',
           { r: [4, 18] }, [3, 18], [24, 13], [26, 13], { r: [49, 16] }, [51, 16], [82, 15], [90, 15]],
  '18-6': [{ r: [2, 19] }, [13, 19], [9, 19], [18, 19], [30, 19], [42, 19], { r: [44, 19] }, [54, 11], [42, 19], [54, 11], [61, 15], [54, 11], [48, 15], [66, 19], [80, 19], { r: [95, 19] }, [93, 19], [101, 15], [107, 11], [101, 7], [108, 3], [118, 3], { r: [135, 7] }, [126, 7], [136, 7], [141, 12], [147, 16], [153, 10], [159, 14], [165, 11], [176, 11], [190, 11]]
};
LEVELS.bot = async (page) => {
  if (!want.includes('bot')) return;
  for (const id of Object.keys(BOT)) {
    for (const foes of [false, true]) {
    await page.evaluate(src => { window.__roverSrc = src; }, roverHook);
    const r = await page.evaluate(([id, list, foes]) => {
      fresh(); const g0 = play(id); for (let k = 0; k < 600 && S().state !== 'play'; k++) sim(1 / 60); P().invuln = 0; window.BRADY.Save.data.lives = 9;
      const calm = () => { if (!foes) for (const e of S().entities) if (e.enemy && !e.boss && !(e.constructor.name === 'MoonJunk')) e.remove = true; };
      // what got him: the last thing that hurt him, a fall, spikes
      const cause = () => { const p = P(), A = S().area; if (!p) return '?'; if (p.y > A.H * 32 - 40) return 'fell'; const near = S().entities.filter(e => (e.enemy || e.constructor.name === 'TourShot') && !e.remove && Math.abs(e.cx - p.cx) < 60 && Math.abs(e.cy - p.cy) < 80).map(e => e.constructor.name === 'cls' ? (e.s && e.s.type) : e.constructor.name); return near.length ? near.join('+') : 'spikes/other'; };
      calm();
      if (!window.__roverHook) { window.__roverHook = true; eval(window.__roverSrc); }
      const deaths = [], t0 = Date.now(); let i = 0, guard = 0, stuck = {}, area0 = S().area.aid;
      const boots = () => { sim(1 / 120, { action: true, actionPressed: true }); sim(1.6); };
      const respawn = () => { for (let k = 0; k < 900 && !(S().state === 'play' && P() && !P().dead && S().player.state === 'play'); k++) sim(1 / 60); window.BRADY.Save.data.lives = 9; sim(0.6); P().invuln = Math.min(P().invuln || 0, 2); };
      while (i < list.length && guard++ < 400 && Date.now() - t0 < 900000) {
        const e = list[i];
        if (e && e.r) { i++; continue; }
        if (e === 'B1' || e === 'B0') { if (window.BRADY_MOON.kit.magBoots(S()) !== (e === 'B1')) boots(); i++; continue; }
        // a critter on the floor just ahead: hop onto it first (a stomp), the way a player clears the way
        if (foes && !P().flipped) {
          const p = P(), A = S().area, row = p.groundTy, ahead = Math.sign(e[0] - tileOf()[0]) || 1;
          const foe = S().entities.find(q => q.enemy && !q.dead && !q.remove && q.behavior && !(q.cfg && q.cfg.spiky) && Math.abs(Math.floor((q.y + q.h + 1) / 32) - row) <= 0 && (q.cx - p.cx) * ahead > 0 && Math.abs(q.cx - p.cx) < 7 * 32);
          if (foe) { const r0 = AP.go([Math.floor(foe.cx / 32), row], { tol: 1, maxT: 4 }); if (P() && !P().dead && S().state === 'play') { sim(0.2); continue; } }
        }
        if (e === 'DOOR') { for (let k = 0; k < 20 && S().area.aid === area0; k++) sim(0.1, { up: true, upPressed: true }); sim(1); i++; continue; }
        calm(); const res = AP.go(e, { tol: e[2] ? 1 : 0, maxT: 7 });
        if (res.ok && res.exit) return { id, done: true, exit: res.exit, idx: i, of: list.length, deaths, sec: Math.round((Date.now() - t0) / 1000) };
        if (res.ok) { i++; continue; }
        const died = res.why === 'died' || (P() && P().dead) || S().state !== 'play';
        if (!died) {
          // no plan from here (pushed off course by a critter): wait a moment and try again, then give up
          stuck[i] = (stuck[i] || 0) + 1; if (stuck[i] > 3) return { id, done: false, deaths, stuckAt: e, from: tileOf(), boots: window.BRADY_MOON.kit.magBoots(S()), small: P().small, why: res.why }; sim(0.5); continue;
        }
        deaths.push({ at: tileOf(), to: e, why: cause() });
        if (deaths.length > 12) return { id, done: false, deaths, gaveUp: true };
        respawn();
        const here = tileOf(), aid = S().area.aid;
        // back to the last restart spot at or behind where he respawned (in this area)
        let k = -1, inArea = aid === area0 ? 0 : list.indexOf('DOOR') + 1;
        for (let q = inArea; q < list.length && list[q] !== 'DOOR'; q++) if (list[q] && list[q].r && list[q].r[0] <= here[0] + 2) k = q;
        i = k >= 0 ? k + 1 : inArea;
        if (aid !== area0) area0 = aid === area0 ? area0 : area0;
      }
      sim(2, { right: true });
      return { id, done: S().state !== 'play', state: S().state, deaths, sec: Math.round((Date.now() - t0) / 1000), at: i };
    }, [id, BOT[id], foes]);
    console.log('BOT ' + (foes ? 'enemies on  ' : 'enemies off ') + JSON.stringify(r));
    }
  }
};

// ---------------- the land's map, the route-map pin, the boss stage ----------------
const openMoon = `(() => { fresh(); const B = window.BRADY, T = window.BRADY_TOUR; for (const w of B.WORLD_ORDER) { const C = T.Tour.byWorld[w]; if (!C || C.id === 'moon') continue; for (const id of T.Tour.levelIds(C)) B.Save.data.done[id] = true; } for (const id of ['18-1', '18-2', '18-3', '18-4', '18-5', '18-6']) B.Save.data.unlocked[id] = true; B.Save.data.done['18-1'] = true; B.Save.data.done['18-2'] = true; const Tp = T.TourProgress; try { Tp.exit('18-1', 'main'); Tp.exit('18-1', 'secret'); Tp.exit('18-2', 'main'); } catch (e) {} })()`;
LEVELS.map = async (page, shot, run) => {
  await run('map', async () => {
    const r = await page.evaluate(o => { eval(o); window.BRADY.goToMap('world', 1, '18-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { mode: s.mode, cc: s.ow && s.ow.cc }; }, openMoon);
    check('the Moon has its own walkable map', r.cc === 'moon', r);
    await page.evaluate(() => freeze()); await shot('70-moon-overworld-map.png');
    const r2 = await page.evaluate(() => { thaw(); const s = S(); if (s.openRoute) s.openRoute({ dest: 'moon' }); for (let k = 0; k < 40 && (s.rRevealQ == null || s.rReveal || (s.rRevealQ && s.rRevealQ.length)); k++) sim(0.25); s.dest = 'moon'; sim(0.8); return { mode: s.mode }; });
    await page.evaluate(() => freeze()); await shot('71-route-map-moon-pin.png');
    check('the route map opens on the Moon\'s pin', !!r2.mode, r2);
    await page.evaluate(() => { thaw(); play('18-5'); toArea('stage', 6, 15); sim(3); freeze(); }); await shot('50-18-5-stage.png');
    await page.evaluate(() => { thaw(); play('18-5'); place(30, 15); sim(0.4); freeze(); }); await shot('51-18-5-wings.png');
  });
};

(async () => {
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => {
    for (const k in LEVELS) await LEVELS[k](page, shot, run, pano);
  });
  await session({ width: 390, height: 844 }, async (page, shot, run) => {
    await run('p-hop', async () => { await page.evaluate(() => { fresh(); play('18-1'); place(60, 20); sim(0.4); freeze(); }); await shot('90-portrait-18-1.png'); });
    await run('p-boss', async () => { await page.evaluate(() => { thaw(); play('18-5'); toArea('stage', 6, 15); sim(3); freeze(); }); await shot('91-portrait-18-5-stage.png'); });
    await run('p-map', async () => { await page.evaluate(o => { thaw(); eval(o); window.BRADY.goToMap('world', 1, '18-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } freeze(); }, openMoon); await shot('92-portrait-moon-map.png'); });
  });
  console.log(failures ? `${failures} MOON CHECK(S) FAILED` : 'ALL MOON CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
