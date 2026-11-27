// The Department of Unclaimed Shadows (world 35, a hidden land): in-browser checks and phone-size screenshots.
// (The autopilot below is the Moon tool's, tools/sbw_moon_shots.js, unchanged but for the physics hook.)
// Each level's own mechanic is PLAYED with real inputs through the game loop: an autopilot plans each hop with the
// game's own physics function on a copy of Brady's body (the planner never moves him), then feeds those exact
// inputs to the real game frame by frame and checks where he really lands (closed loop: it re-plans if he is off).
// It walks each level's main route from the start to the gate (and the secret routes), takes 844x390 landscape shots
// of the key beats, 390x844 portrait shots of 35-1, the boss and the map, and a panorama of every level area.
// usage: BRADY_DIST=<dist> node tools/sbw_shad_shots.js <outdir> [--checks] [name ...]   (--checks: no pictures)
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'shad-shots'), checksOnly = args.includes('--checks');
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

    // stand at the room's way out (its door, wherever the room puts it)
    window.toDoor = () => { const g = S(); const d = g.entities.find(e => e.constructor.name === 'Portal' && e.target && e.target.area !== g.area.idx); const p = P(); p.x = d.cx - p.w / 2; p.y = d.y + d.h - p.h; p.vx = p.vy = 0; sim(0.3); };
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
      // a careful player's plan never runs into a critter where it will be by then (walkers keep walking; a landing
      // on top of one is a stomp, fine); only used when AP.careful is on (the bot)
      bad(b, A, t) {
        if (!AP.careful) return false;
        const p0 = P();
        for (const e of S().entities) {
          if (!e.enemy || e.dead || e.remove || e.friendly || e.boss || e.knocked) continue;
          if (e.face === 1) continue;
          if (Math.abs(e.cx - p0.cx) > 14 * 32) continue;
          const tt = Math.min(t, 1.2), ex = e.x + (e.vx || 0) * tt, ey = e.y + (0), m = 6;
          if (b.x < ex + e.w + m && b.x + b.w > ex - m && b.y < ey + e.h + m && b.y + b.h > ey - m) {
            if (b.vy > 0 && b.y + b.h < ey + 12 && !e.prickly) continue;
            return true;
          }
        }
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
          window.BRADY_SHAD.phys(b, inp, A, dt, null, {});
          if (AP.after) AP.after(b, inp, A, dt);
          t += dt;
          if (b.y > A.H * 32 + 20 || window.BRADY_SHAD.lavaContact(b, A) || window.BRADY_SHAD.spikeContact(b, A)) return null;
          if (AP.bad && AP.bad(b, A, t)) return null;
          if (!b.onGround) air = true;
          if (prog.walkTo != null) { if (b.onGround && !air && Math.abs(b.x + b.w / 2 - prog.walkTo) <= 8 && Math.abs(b.vx) < 4) return { tx: Math.floor((b.x + b.w / 2) / 32), ty: b.groundTy, t, flipped: !!b.flipped }; continue; }
          if (b.onGround && (air || (prog.noJump && prog.air !== 'stopgo') || prog.stand) && landT == null && t > 0.05) { landT = t; prog._landTx = Math.floor((b.x + b.w / 2) / 32); prog._landTy = b.groundTy; }
          if (prog.driftPlan && !air && t > 0.6) return null;
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




const LEVELS = {};
// the land's own moves with real inputs (added once per page)
const helpers = () => {
  { const SK = window.BRADY_TOUR.Tour.shadKit; if (!SK.__counted) { const p0 = SK.pill; SK.pill = function () { window.__pills = (window.__pills || 0) + 1; return p0.apply(this, arguments); }; SK.__counted = true; } }
  window.playP = id => { play(id); for (let k = 0; k < 60 && S().state !== 'play'; k++) sim(0.1); P().invuln = 999; return S(); };
  window.tileName = (x, y) => { const A = S().area, T = window.BRADY.T; const t = A.tiles[y * A.W + x]; return Object.keys(T).find(k => T[k] === t); };
  window.throwN = (n, gap) => { for (let k = 0; k < n; k++) { sim(1 / 120, { action: true, actionPressed: true }); sim(gap || 0.45); } };
  window.walkX = (x, sec) => { AP.exec({ walkTo: x, dir: 0 }, sec || 4); sim(0.15); };
  // stand on tile x (its middle) of this floor and press THROW once
  window.claimAt = (x, row) => { if (row != null) AP.go([x, row]); walkX(x * 32 + 16, 3); throwN(1); };
  // roll the nearest carriage prop (the folding screen) to left tile sx: walk onto it, then walk with it
  window.rollTo = (sx, wait) => { const L = ents('ShadOverlap'), on = L.filter(q => q.rail[0] <= sx && q.rail[1] >= sx), e = (on.length ? on : L).sort((a, b) => Math.abs(a.cxF - P().cx) - Math.abs(b.cxF - P().cx))[0]; AP.exec({ walkTo: e.cxF, dir: 0 }, 4); AP.exec({ walkTo: (sx + e.cw / 2) * 32, dir: 0 }, 5); sim(wait == null ? 0.6 : wait); return { sx: window.BRADY_SHAD.kit.carriage.sx(e) }; };
  // jump straight up from where Brady stands, pressing THROW at the top when asked
  window.hopUp = (act) => { sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.3, { jump: true }); if (act) sim(1 / 120, { jump: true, action: true, actionPressed: true }); sim(0.9); };
  // the filing wall: push up into it, climb up the drawers (round a flea), off at the top onto the floor beyond
  window.climbWall = (x0, topRow, offX) => {
    const p = P(); AP.go([x0, 19]); walkX(x0 * 32 + 16, 2);
    for (let k = 0; k < 120 && !(p.wash && p.wash.grip); k++) sim(1 / 60, { up: true });
    for (let k = 0; k < 120 * 10 && p.y > (topRow + 0.2) * 32 && !p.dead; k++) {
      const cr = S().entities.find(e => e.isWashCrawler && !e.dead && e.face === (p.wash && p.wash.face) && Math.abs(e.cx - p.cx) < 50 && e.cy < p.cy && p.cy - e.cy < 90);
      sim(1 / 120, cr ? { right: p.cx < (x0 + 4) * 32, left: p.cx >= (x0 + 4) * 32 } : { up: true });
    }
    sim(1 / 120, { jump: true, jumpPressed: true, right: true }); sim(0.7, { jump: true, right: true }); walkX(offX * 32 + 16, 3);
    return { grip: !!(p.wash), at: tileOf(), dead: p.dead };
  };
  window.doorUp = () => { sim(0.2); sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 200 && S().fade && S().fade.a > 0.02 || k < 30; k++) sim(1 / 60); sim(0.5); return S().area.aid; };
};
const shotAt = async (page, shot, name, fn, arg) => { await page.evaluate(fn, arg); await page.evaluate(() => freeze()); await shot(name); await page.evaluate(() => thaw()); };

// ---------------- 35-1 Lost Property ----------------
LEVELS.lost = async (page, shot, run, pano) => {
  await run('lost', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('35-1'); place(4, 18); sim(0.6); freeze(); }); await shot('10-35-1-start.png');
    let r = await page.evaluate(() => { thaw(); place(12, 18); sim(0.3); const n0 = (window.__pills || 0); claimAt(12); return { grille: tileName(18, 17), pill: (window.__pills || 0) > n0 }; });
    check('35-1: THROW on the wrong shadow\'s heels: NOT THEIRS, the grille stays down', r.grille === 'HARD' && r.pill, r);
    await shotAt(page, shot, '11-35-1-claim-teach.png', () => { walkX(9 * 32 + 16); sim(0.4); });
    r = await page.evaluate(() => { claimAt(9); sim(0.8); return { grille: tileName(18, 17) }; });
    check('35-1: heels on the matching shadow\'s heels, THROW: it flies home and the grille rolls up', r.grille === 'EMPTY', r);
    r = await page.evaluate(() => { const a = AP.route([[24, 19], [36, 19], [40, 19]]); claimAt(43); const wrong = tileName(52, 17); claimAt(46); sim(0.8); return { a: a.ok, wrong, grille: tileName(52, 17) }; });
    check('35-1: two teapots and a can: only the teapot with the owner\'s notch is claimed', r.a && r.wrong === 'HARD' && r.grille === 'EMPTY', r);
    await shotAt(page, shot, '12-35-1-notches.png', () => { walkX(44 * 32); sim(0.2); });
    await shotAt(page, shot, '13-35-1-secret-tell.png', () => { AP.go([56, 19]); sim(0.3); });
    r = await page.evaluate(() => { const a = AP.go([60, 19]); return { ok: a.ok, at: tileOf() }; });
    check('35-1: the block\'s left face by the door\'s shadow is only painted: through to the parcel room\'s hatch', r.ok, r);
    r = await page.evaluate(() => { playP('35-1'); place(97, 18); sim(0.3); claimAt(100); const wrong = tileName(112, 17); claimAt(103); sim(0.8); return { wrong, grille: tileName(112, 17) }; });
    check('35-1: kettles: the wrong notch stays, the right one goes home', r.wrong === 'HARD' && r.grille === 'EMPTY', r);
    r = await page.evaluate(() => { const a = AP.route([[118, 16], [122, 15], [128, 19]]); return { ok: a.ok }; });
    check('35-1: over the ink trench on the shadow shelves', r.ok, r);
    await shotAt(page, shot, '14-35-1-umbrella-open.png', () => { AP.go([136, 19]); walkX(136 * 32 + 16); sim(0.4); });
    r = await page.evaluate(() => { claimAt(136); const wrong = tileName(148, 17); claimAt(139); sim(0.8); const a = AP.route([[152, 19], [160, 19]]); sim(3, { right: true }); return { wrong, grille: tileName(148, 17), a: a.ok, state: S().state }; });
    check('35-1: twist: the umbrella that opens on the missing spoke is the owner\'s; on to the gate', r.wrong === 'HARD' && r.grille === 'EMPTY' && r.state !== 'play', r);
    await page.evaluate(() => { playP('35-1'); }); await pano('19-35-1-panorama.png', 0.35);
  });
};

// ---------------- 35-2 Long Division ----------------
LEVELS.div = async (page, shot, run, pano) => {
  await run('div', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('35-2'); place(4, 18); sim(0.6); freeze(); }); await shot('20-35-2-start.png');
    let r = await page.evaluate(() => { thaw(); place(15, 18); sim(0.5); return { shelf: tileName(15, 16) }; });
    check('35-2: far from the lamp the shadow is short: its hand misses the handle, the shelf stays up', r.shelf === 'EMPTY', r);
    await shotAt(page, shot, '21-35-2-shadow-short.png', () => { sim(0.1); });
    await shotAt(page, shot, '22-35-2-shadow-reaching.png', () => { walkX(13 * 32 + 30, 2); });
    r = await page.evaluate(() => { walkX(12 * 32 + 16); sim(0.5); return { shelf: tileName(15, 16) }; });
    check('35-2: walked toward the lamp, the shadow grows till its hand meets the handle: REACH, the shelf comes down', r.shelf === 'SEMI', r);
    await shotAt(page, shot, '23-35-2-shelf-down.png', () => { sim(0.3); });
    r = await page.evaluate(() => AP.route([[15, 16], [19, 13], [30, 13], [37, 13], [44, 19]]));
    check('35-2: up the shelf onto the filing cliff and down the far side', r.ok, r);
    await shotAt(page, shot, '24-35-2-filing-wall.png', () => { AP.go([48, 19]); sim(0.2); });
    r = await page.evaluate(() => climbWall(51, 9, 60));
    check('35-2: up the filing wall (push up to grip, climb the pulls, round the flea), off onto the top floor', !r.dead && r.at[1] === 9, r);
    await shotAt(page, shot, '25-35-2-secret-tell.png', () => { AP.go([74, 9]); sim(0.3); });
    r = await page.evaluate(() => { const a = AP.go([77, 6]); return { ok: a.ok, at: tileOf() }; });
    check('35-2: up through the gap in the drawer ceiling by the door\'s shadow: the night corridor\'s hatch', r.ok, r);
    r = await page.evaluate(() => { playP('35-2'); place(86, 18); sim(0.3); walkX(96 * 32 + 16); sim(0.5); const sh = tileName(98, 17); const a = AP.route([[98, 17], [101, 14], [120, 14], [128, 19]]); return { sh, a: a.ok }; });
    check('35-2: a second lamp, further off: the shelf and the climb', r.sh === 'SEMI' && r.a, r);
    r = await page.evaluate(() => { walkX(141 * 32 + 16); sim(1.0); return { shelf: tileName(143, 16) }; });
    check('35-2: twist: standing under the last handle, the lip is in the way: no shelf', r.shelf === 'EMPTY', r);
    await shotAt(page, shot, '26-35-2-lip.png', () => { sim(0.1); });
    r = await page.evaluate(() => { hopUp(); sim(0.4); const sh = tileName(143, 16); const a = AP.route([[143, 16], [147, 13], [158, 13], [166, 13]]); sim(3, { right: true }); return { sh, a: a.ok, state: S().state }; });
    check('35-2: a jump at the right spot lifts the shadow\'s hand to the handle; up and on to the gate', r.sh === 'SEMI' && r.a && r.state !== 'play', r);
    await page.evaluate(() => { playP('35-2'); }); await pano('29-35-2-panorama.png', 0.35);
  });
};

// ---------------- 35-3 Overlap Allowance ----------------
LEVELS.over = async (page, shot, run, pano) => {
  await run('over', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('35-3'); place(4, 18); sim(0.6); freeze(); }); await shot('30-35-3-start.png');
    let r = await page.evaluate(() => { thaw(); const a = rollTo(12); return { a, mid: tileName(24, 15), edge: tileName(22, 15) }; });
    check('35-3: the screen rolled part way: a sliver of overlap, too narrow', r.edge === 'SEMI' && r.mid === 'EMPTY', r);
    await shotAt(page, shot, '31-35-3-sliver.png', () => { sim(0.1); });
    r = await page.evaluate(() => { const a = rollTo(16); return { a, mid: tileName(24, 15) }; });
    check('35-3: rolled all the way: the shadows overlap into a dark step over the ink', r.mid === 'SEMI', r);
    await shotAt(page, shot, '32-35-3-overlap-step.png', () => { walkX(19 * 32); });
    r = await page.evaluate(() => AP.route([[23, 17], [25, 15], [31, 19], [36, 19]]));
    check('35-3: onto the overlap and across the trench', r.ok, r);
    r = await page.evaluate(() => { rollTo(42); const st = tileName(47, 16); const a = AP.route([[47, 16], [52, 13], [60, 13]]); return { st, a: a.ok }; });
    check('35-3: the second screen: a step up to the ledge', r.st === 'SEMI' && r.a, r);
    await shotAt(page, shot, '33-35-3-secret-tell.png', () => { AP.go([70, 13]); sim(0.3); });
    r = await page.evaluate(() => { const a = AP.go([66, 13]); return { ok: a.ok, at: tileOf() }; });
    check('35-3: the block\'s right face by the door\'s shadow is only painted: the boot room\'s hatch', r.ok, r);
    r = await page.evaluate(() => { playP('35-3'); place(76, 18); sim(0.3); rollTo(88); const a = AP.route([[93, 16], [101, 19], [110, 19]]); return { a: a.ok }; });
    check('35-3: the third screen: the long overlap over the ink, a crow overhead', r.a, r);
    r = await page.evaluate(() => { rollTo(118); return { low: tileName(124, 16), top: tileName(126, 12) }; });
    check('35-3: twist: the wide overlap is low (no way up)', r.low === 'SEMI' && r.top === 'EMPTY', r);
    await shotAt(page, shot, '34-35-3-wide-low.png', () => { sim(0.1); });
    r = await page.evaluate(() => { rollTo(120); const top = tileName(126, 12); const a = AP.route([[126, 17], [126, 15], [127, 12], [130, 9], [140, 9], [150, 9], [158, 19]]); sim(3, { right: true }); return { top, a: a.ok, state: S().state }; });
    check('35-3: give up half the width: the narrow overlap climbs to the high ledge; on to the gate', r.top === 'SEMI' && r.a && r.state !== 'play', r);
    await shotAt(page, shot, '35-35-3-narrow-tall.png', () => { playP('35-3'); place(118, 18); rollTo(120); });
    await page.evaluate(() => { playP('35-3'); }); await pano('39-35-3-panorama.png', 0.35);
  });
};

// ---------------- 35-4 Alterations While You Wait ----------------
LEVELS.alt = async (page, shot, run, pano) => {
  await run('alt', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('35-4'); place(4, 18); sim(0.6); freeze(); }); await shot('40-35-4-start.png');
    await shotAt(page, shot, '41-35-4-shadow-long.png', () => { thaw(); walkX(15 * 32 + 16); sim(0.3); });
    let r = await page.evaluate(() => { claimAt(15); AP.go([20, 19]); walkX(21 * 32 - 4, 1); sim(0.5, { right: true }); return { slot: tileName(21, 17) }; });
    check('35-4: cut off the chalk: the shadow is the wrong size, the slot won\'t take it', r.slot === 'HARD', r);
    r = await page.evaluate(() => { AP.go([13, 19]); claimAt(13); return { tr: P().shadTrim }; });
    check('35-4: on the chalk mark, THROW: trimmed to fit', r.tr && r.tr.ok, r);
    await shotAt(page, shot, '42-35-4-trimmed.png', () => { sim(0.1); });
    r = await page.evaluate(() => { AP.go([19, 19]); walkX(21 * 32 - 4, 1); sim(0.6, { right: true }); return { slot: tileName(21, 17) }; });
    check('35-4: walked into the mail slot with the cut shadow: posted, the wall opens', r.slot === 'EMPTY', r);
    r = await page.evaluate(() => { const a = AP.route([[30, 19], [36, 19], [38, 17], [42, 15]]); claimAt(47); const tr = P().shadTrim; const b = AP.route([[58, 15], [62, 19], [65, 19]]); walkX(66 * 32 - 4, 1); sim(0.6, { right: true }); return { a: a.ok, tr, b: b.ok, slot: tileName(66, 17) }; });
    check('35-4: the mirrored cutter on the raised floor; the second slot opens', r.a && r.tr && r.tr.ok && r.b && r.slot === 'EMPTY', r);
    await shotAt(page, shot, '43-35-4-secret-tell.png', () => { AP.go([62, 19]); sim(0.3); });
    r = await page.evaluate(() => { const a = AP.route([[63, 17], [58, 15]]); claimAt(47); const b = AP.route([[58, 15], [62, 19]]); walkX(61 * 32 + 4, 1); sim(0.6, { left: true }); const slot = tileName(60, 17); const c = AP.go([58, 19]); return { a: a.ok, b: b.ok, slot, c: c.ok }; });
    check('35-4: a second cut posted into the slot in the raised floor\'s face (by the door\'s shadow): the staff kitchen\'s hatch', r.slot === 'EMPTY' && r.c, r);
    r = await page.evaluate(() => { playP('35-4'); place(80, 18); sim(0.3); claimAt(88); const a = AP.route([[91, 19], [98, 19]]); walkX(100 * 32 - 4, 1); sim(0.6, { right: true }); return { a: a.ok, slot: tileName(100, 17) }; });
    check('35-4: cut, then over the ink trench to the slot', r.a && r.slot === 'EMPTY', r);
    r = await page.evaluate(() => { playP('35-4'); place(117, 18); sim(0.3); claimAt(126); const a = AP.route([[134, 19]]); walkX(136 * 32 - 4, 1); sim(0.6, { right: true }); return { a: a.ok, slot: tileName(136, 17) }; });
    check('35-4: twist: cut standing on the chalk, the long arm is lost: the last slot refuses it', r.slot === 'HARD', r);
    await shotAt(page, shot, '44-35-4-arm-up.png', () => { AP.go([126, 19]); walkX(126 * 32 + 16); sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.3, { jump: true }); });
    r = await page.evaluate(() => { sim(1); AP.go([126, 19]); walkX(126 * 32 + 16); hopUp(true); const tr = P().shadTrim; const a = AP.route([[134, 19]]); walkX(136 * 32 - 4, 1); sim(0.6, { right: true }); const slot = tileName(136, 17); const b = AP.route([[144, 19], [151, 19], [158, 19]]); sim(3, { right: true }); return { tr, slot, b: b.ok, state: S().state }; });
    check('35-4: JUMP on the chalk and THROW in the air: long arm, short body: posted; on to the gate', r.tr && r.tr.ok && r.tr.arm && r.slot === 'EMPTY' && r.state !== 'play', r);
    await page.evaluate(() => { playP('35-4'); }); await pano('49-35-4-panorama.png', 0.35);
  });
};

// ---------------- 35-5 Joint Custody: the two lamps, the painted block, the counter's door ----------------
LEVELS.cust = async (page, shot, run, pano) => {
  await run('cust', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('35-5'); place(4, 18); sim(0.6); freeze(); }); await shot('50-35-5-start.png');
    let r = await page.evaluate(() => { thaw(); walkX(12 * 32 + 16); sim(1.5); return { grille: tileName(24, 17) }; });
    check('35-5: between the lamps but off the spot: the feet miss their slots, the grille stays', r.grille === 'HARD', r);
    await shotAt(page, shot, '51-35-5-split.png', () => { walkX(13 * 32 + 30); sim(0.2); });
    r = await page.evaluate(() => { walkX(14 * 32 + 16); sim(1.5); return { grille: tileName(24, 17) }; });
    check('35-5: both shadows\' feet on their claim slots for a breath: both stamped, the grille rolls up', r.grille === 'EMPTY', r);
    r = await page.evaluate(() => { const a = AP.route([[30, 19], [40, 19], [46, 19]]); const n0 = (window.__pills || 0); walkX(48 * 32 + 16); sim(1.5); const pill = (window.__pills || 0) > n0, g1 = tileName(60, 17); walkX(50 * 32 + 16); sim(1.5); return { a: a.ok, pill, g1, grille: tileName(60, 17) }; });
    check('35-5: the last desk: the hats line up first (it says so, nothing opens); the feet decide', r.pill && r.g1 === 'HARD' && r.grille === 'EMPTY', r);
    await shotAt(page, shot, '52-35-5-secret-tell.png', () => { AP.go([62, 19]); sim(0.3); });
    r = await page.evaluate(() => { const a = AP.go([66, 19]); return { ok: a.ok }; });
    check('35-5: the block\'s painted face by the door\'s shadow: the cut-out workshop (before the boss)', r.ok, r);
    r = await page.evaluate(() => { place(92, 18); sim(0.2); sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 300 && S().area.aid !== 'counter'; k++) sim(1 / 60); sim(1, { right: true }); for (let k = 0; k < 120 * 8 && !(S().boss && S().boss.state === 'fight' && S().boss.act === 'palm'); k++) sim(1 / 120); sim(0.6); freeze(); return { area: S().area.aid }; });
    await shot('53-35-5-boss-counter.png'); await page.evaluate(() => thaw());
    check('35-5: the counter door leads to the Understudy', r.area === 'counter', r);
    await page.evaluate(() => { playP('35-5'); }); await pano('59-35-5-panorama.png', 0.35);
  });
};

// ---------------- the five secret rooms: each entered, played (a miss, then the win) with the buttons, and left ----------------
const ROOMS = [['35-1', 'parcel', 'lost', 'parcelOut'], ['35-2', 'rain', 'div', 'rainOut'], ['35-3', 'boot', 'over', 'bootOut'], ['35-4', 'kitchen', 'alt', 'kitchenOut'], ['35-5', 'cutout', 'cust', 'cutoutOut']];
LEVELS.rooms = async (page, shot, run) => {
  let n = 0;
  for (const [id, aid, main, out] of ROOMS) {
    n++;
    await run('rooms', async () => {
      await page.evaluate(helpers);
      await page.evaluate(([id, aid]) => { fresh(); playP(id); toArea(aid); sim(0.7); freeze(); }, [id, aid]); await shot(`6${n}-room-${id}-${aid}-entry.png`);
      await page.evaluate(() => { thaw(); sim(2.6); freeze(); }); await shot(`6${n}-room-${id}-${aid}-rule.png`);
      const r = await page.evaluate(() => { thaw(); return { kind: S().area.roomKit.kind }; });
      const w = await page.evaluate(() => { const g = S(), A = g.area, R = A.roomState, kit = A.roomKit, K = window.__roomKinds[kit.kind]; let pills = 0; const frame = (g2, keys) => { const before = (window.__pills || 0); sim(1 / 120, keys); if ((window.__pills || 0) > before) pills++; }; K.testWin(g, A, R, kit, frame); sim(0.6); const cage = g.entities.find(e => e.constructor.name === 'TourRoomCage'); return { won: R.won, pills, cage: cage ? cage.tiles.every(([x, y]) => tileName(x, y) === 'EMPTY') : null }; });
      check(`room ${id} ${aid} (${r.kind}): a miss (a pill says so, the turn resets), then won with the buttons; the cage opens`, w.won && w.pills >= 1 && w.cage !== false, w);
      await page.evaluate(() => freeze()); await shot(`6${n}-room-${id}-${aid}-won.png`);
      const o = await page.evaluate(([main, out]) => { thaw(); toDoor(); sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 300 && S().area.aid !== main; k++) sim(1 / 60); sim(0.5); const g = S(), an = g.area.anchors[out]; return { area: g.area.aid, x: Math.floor(P().cx / 32), ax: an ? Math.floor(an.x / 32) : null }; }, [main, out]);
      check(`room ${id} ${aid}: the way out leads on, further along the stage (not back to the entrance)`, o.area === main && o.ax != null && Math.abs(o.x - o.ax) <= 2, o);
    });
  }
};
const openShad = `(() => { fresh(); const B = window.BRADY, T = window.BRADY_TOUR; B.Save.data.seenEncoreIntro = true; const Tp = T.TourProgress, D = Tp.data(); D.seen.moon = true; try { Tp.exit('18-1', 'shad'); Tp.exit('35-1', 'main'); Tp.exit('35-2', 'main'); } catch (e) {} for (const id of ['35-1', '35-2']) B.Save.data.done[id] = true; D.pending = []; D.seen.shad = true; })()`;
LEVELS.map = async (page, shot, run) => {
  await run('map', async () => {
    const r = await page.evaluate(o => { eval(o); window.BRADY.goToMap('world', 35, '35-2'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { mode: s.mode, cc: s.ow && s.ow.cc }; }, openShad);
    check('the department has its own walkable map', r.cc === 'shad', r);
    await page.evaluate(() => freeze()); await shot('70-shad-overworld-map.png');
    const r2 = await page.evaluate(() => { thaw(); const s = S(); if (s.openRoute) s.openRoute({ dest: 'shad' }); for (let k = 0; k < 30; k++) sim(0.25); s.dest = 'shad'; sim(0.8); return { mode: s.mode }; });
    await page.evaluate(() => freeze()); await shot('71-route-map-shad-pin.png');
    check('the route map opens on the department\'s pin', !!r2.mode, r2);
  });
};

// ---------------- the hidden entrance: the Moon 18-1, the sample locker left of the start ----------------
LEVELS.entry = async (page, shot, run, pano) => {
  await run('entry', async () => {
    await page.evaluate(helpers);
    let r = await page.evaluate(() => { fresh(); const T = window.BRADY_TOUR; return { stop: T.TourMap ? T.TourMap.stopState(T.Tour.stops.shad) : null, open: T.TourProgress.countryUnlocked(T.Tour.countries.shad) }; });
    check('entrance: on a fresh save the department is hidden (no pin, not open)', r.stop === 'hidden' && !r.open, r);
    r = await page.evaluate(() => { playP('18-1'); P().setPower(0, true); sim(1.2); const g = S(), gate = g.entities.find(e => e.constructor.name === 'ShadKeyholeGate'); window.__gate = gate; return { gate: !!gate, start: tileOf() }; });
    check('entrance: 18-1 starts as before (same start tile), the locker a few steps to the right', r.gate && r.start[0] === 3, r);
    await page.evaluate(() => { freeze(); }); await shot('01-entrance-18-1-start.png');
    r = await page.evaluate(() => { thaw(); walkX(10 * 32 + 16, 3); sim(0.5); return { at: tileOf() }; });
    await page.evaluate(() => { freeze(); }); await shot('02-entrance-locker-shadow.png');
    r = await page.evaluate(() => { thaw(); walkX(2 * 32, 4); walkX(5 * 32 + 20, 3); sim(1.5); return { state: P().state, at: tileOf() }; });
    check('entrance: walking through the shadow and standing on the keyhole, shoes gone dark, does nothing by itself', r.state === 'play', r);
    await page.evaluate(() => { freeze(); }); await shot('03-entrance-shoes-gone.png');
    r = await page.evaluate(() => { thaw(); for (let k = 0; k < 120 * 2 && P().state === 'play'; k++) sim(1 / 120, { down: true }); return { state: P().state, at: tileOf() }; });
    check('entrance: deep in the shadow, crouched on the keyhole: Brady slips through it', r.state === 'portal', r);
    await page.evaluate(() => { sim(0.7); freeze(); }); await shot('04-entrance-slipping-through.png');
    r = await page.evaluate(() => { thaw(); sim(2); const g = S(); return { state: g.state, key: g.exitKey, banner: g.bannerText }; });
    check('entrance: the land\'s name shows and 18-1 clears through its hidden exit', r.state !== 'play' && r.key === 'shad', r);
    r = await page.evaluate(() => { const T = window.BRADY_TOUR, d = window.BRADY.Save.data; return { land: !!T.TourProgress.data().lands.shad, open: T.TourProgress.countryUnlocked(T.Tour.countries.shad), first: !!d.unlocked['35-1'], done: !!d.done['18-1'] }; });
    check('entrance: the department is open, 35-1 unlocked; 18-1 itself is not marked done by the secret way', r.land && r.open && r.first && !r.done, r);
    r = await page.evaluate(() => { const T = window.BRADY_TOUR.TourProgress.data(); T.seen.moon = true; window.BRADY.goToMap('world', 18, '18-1'); const out = []; for (let k = 0; k < 40; k++) { sim(0.1); const s = S(); if (s.card) s.card = null; out.push(s.mode + (s.rReveal ? ':' + s.rReveal.r.kind : '')); if (s.rReveal && s.rReveal.r.kind === 'land' && s.rReveal.t > 0.6) break; } return { seq: [...new Set(out)] }; });
    await page.evaluate(() => freeze()); await shot('05-entrance-arrival-new-land.png'); await page.evaluate(() => thaw());
    check('entrance: back on the map the route map plays the NEW LAND reveal', r.seq.some(q => /land/.test(q)), r);
    r = await page.evaluate(() => { for (let k = 0; k < 60; k++) { const s = S(); if (s.card) s.card = null; sim(0.25); if (s.mode === 'land' && s.ow && s.ow.cc === 'shad') break; } const s = S(); return { mode: s.mode, cc: s.ow && s.ow.cc }; });
    check('entrance: the route map reveals the new land and flies Brady to the department\'s own map', r.cc === 'shad', r);
    await page.evaluate(() => { sim(1.5); freeze(); }); await shot('06-entrance-arrival-department-map.png'); await page.evaluate(() => thaw());
  });
};

// ---------------- bot: one honest run of each stage, enemies on, no invulnerability, the lives a level gives ----------------
// Steps: [x, row] walk/hop there; { bump: [x, row] } hit the box above; { claim: x } THROW on the heels at x; { stand: x }
// walk to x and wait; { hop: x, act } jump straight up at x (THROW at the top); { roll: sx } the screen; 'climb' the
// filing wall; { post: x, dir } walk into the slot at x; 'finish'; 'boss'
const BOT = {
  '35-1': [[0, [{ bump: [7, 19] }, { claim: 9 }, [24, 19], { bump: [27, 19] }, [36, 19]]],
    [36, [{ claim: 46 }, [56, 19], { bump: [64, 19] }, [70, 19], [84, 17], [90, 19], [96, 19]]],
    [96, [{ claim: 103 }, [114, 19], [118, 16], [122, 15], [128, 19]]], [127, [{ claim: 139 }, [150, 19], [160, 19], 'finish']]],
  '35-2': [[0, [{ bump: [6, 19] }, { stand: 12 }, [15, 16], [19, 13], [30, 13], [36, 13]]],
    [33, [[44, 19], 'climb', [62, 9], { bump: [66, 9] }, [80, 9], [86, 19], { stand: 96 }, [98, 17], [101, 14], { bump: [110, 14] }, [121, 14]]],
    [121, [[128, 19], { hop: 141 }, [143, 16], [147, 13], [150, 13], [158, 13], [166, 13], 'finish']]],
  '35-3': [[0, [{ bump: [6, 19] }, { roll: 16 }, [23, 17], [25, 15], [31, 19], [33, 19]]],
    [31, [{ roll: 42 }, [47, 16], [52, 13], [62, 13], [69, 13], [74, 19]]],
    [72, [{ bump: [79, 19] }, { roll: 88 }, [93, 16], [101, 19], [104, 19]]],
    [102, [{ roll: 120 }, [126, 17], [126, 15], [127, 12], [130, 9], [132, 9]]], [130, [{ bump: [140, 9] }, [150, 9], [158, 19], 'finish']]],
  '35-4': [[0, [{ bump: [7, 19] }, { claim: 13 }, { post: 21, dir: 1 }, [26, 19], { bump: [30, 19] }, [35, 19]]],
    [33, [[38, 17], [42, 15], { claim: 47 }, [58, 15], [62, 19], { post: 66, dir: 1 }, [70, 19], [78, 19]]],
    [78, [{ claim: 88 }, [91, 19], [98, 19], { post: 100, dir: 1 }, [110, 19], [116, 19]]],
    [115, [{ hop: 126, act: true }, [134, 19], { post: 136, dir: 1 }, [143, 19], [151, 19], { bump: [150, 19] }, [158, 19], 'finish']]],
  '35-5': [[0, [{ bump: [6, 19] }, { stand: 14 }, [26, 19], [35, 19]]], [35, [{ bump: [40, 19] }, [46, 19], { stand: 50 }, [62, 19], [76, 19], [84, 19], [91, 19], 'boss']]]
};
LEVELS.bot = async (page, shot, run) => {
  if (!want.includes('bot')) return;
  await page.evaluate(helpers);
  const ids = Object.keys(BOT).filter(id => !want.some(w => /^35-/.test(w)) || want.includes(id));
  for (const id of ids) await run('bot', async () => {
    const r = await page.evaluate(([id, segs]) => {
      fresh(); window.__trail = []; const B = window.BRADY; B.Save.data.lives = 5;
      const [w, i] = id.split('-').map(Number); B.Game.setScene(new B.Play(B.getLevel(w, i), {})); sim(1.6);
      AP.careful = true; const deaths = []; let hurts = 0, lastPow = P().power;
      const PP = Object.getPrototypeOf(P()); if (!PP.__shadHurt) { const h0 = PP.hurt; PP.hurt = function (src) { if (!(this.invuln > 0) && !(this.star > 0)) (window.__hurtLog = window.__hurtLog || []).push((src && (src.style || src.constructor.name)) + ':' + (src && src.act) + '@' + Math.floor(this.cx / 32) + ' y' + Math.round(this.y) + ' g' + this.onGround + ' ' + window.__dec); return h0.apply(this, arguments); }; PP.__shadHurt = true; } window.__hurtLog = [];
      const alive = () => { const g = S(), p = P(); return p && !p.dead && g.state === 'play'; };
      const settle = () => { for (let k = 0; k < 120 * 8 && !(S().state === 'play' && P() && !P().dead && S().fade.a < 0.05); k++) sim(1 / 120); };
      const doStep = st => { (window.__trail = window.__trail || []).push(JSON.stringify(st) + '@' + tileOf().join(',') + (P().dead ? 'D' : '')); return doStep0(st); };
      const doStep0 = st => {
        if (st === 'finish') { sim(3, { right: true }); return S().state !== 'play'; }
        if (st === 'boss') return bossFight();
        if (st === 'climb') { const r = climbWall(51, 9, 60); return alive() && r.at[1] === 9; }
        if (Array.isArray(st)) { window.__tgt = st.join(',') + ' from ' + tileOf().join(','); for (let k = 0; k < 8; k++) { if (k === 4) AP.careful = false; const r = AP.go(st); AP.careful = true; if (r.ok) return true; if (!alive()) return false; sim(0.5); } return false; }
        if (st.bump) { AP.go(st.bump); const p = P(); sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.5, { jump: true }); sim(0.4); for (let q = 0; q < 240; q++) { const it = S().entities.find(e => !e.remove && e.constructor.name !== 'ShadPill' && (e.item || e.isItem || /Item|Power|Mushroom/.test(e.constructor.name)) && Math.abs(e.cx - p.cx) < 4 * 32 && Math.abs(e.cy - p.cy) < 80); if (!it) break; sim(1 / 60, { left: it.cx < p.cx - 6, right: it.cx > p.cx + 6 }); } return alive(); }
        if (st.claim != null) { const row = P().groundTy; AP.go([st.claim, row]); claimAt(st.claim); sim(0.6); return alive(); }
        if (st.stand != null) { AP.go([st.stand, P().groundTy]); walkX(st.stand * 32 + 16, 3); sim(1.4); return alive(); }
        if (st.hop != null) { AP.go([st.hop, P().groundTy]); walkX(st.hop * 32 + 16, 3); hopUp(!!st.act); sim(0.3); return alive(); }
        if (st.roll != null) { rollTo(st.roll); return alive(); }
        if (st.post != null) { walkX(st.post * 32 - st.dir * 20, 3); sim(0.6, st.dir > 0 ? { right: true } : { left: true }); sim(0.4); return alive(); }
        return true;
      };
      function bossFight() {
        const g0 = S(); const d = g0.entities.filter(e => e.constructor.name === 'Portal' && e.target && e.target.area !== g0.area.idx).sort((a, b) => b.cx - a.cx)[0];
        if (d) { AP.go([Math.floor(d.cx / 32), 19]); for (let k = 0; k < 20 && S().area.aid !== 'counter'; k++) sim(0.1, { up: true, upPressed: true }); }
        if (S().area.aid !== 'counter') return false;
        sim(1); let hold = 0, lastA = null;
        for (let f = 0; f < 60 * 180; f++) {
          const g = S(), b = g.entities.find(e => e.boss && !e.remove), p = P();
          if (!b || b.state === 'dying') { sim(3); for (let q = 0; q < 12 && S().state === 'play'; q++) sim(0.5, { right: true }); return true; }
          if (!alive()) { if (p && !p.dead && S().state !== 'dead') { sim(1 / 60); continue; } return false; }
          if (b.state !== 'fight' || !b.act) { sim(1 / 60, { right: true }); continue; }
          const G = window.BRADY_TOUR.Tour.shadKit.understudyBrain.geo(b), A = b.act, ph = b.phase || 1;
          let tx = p.cx, jump = false;
          const fresh = A !== lastA; lastA = A;
          if (ph === 1) { tx = A === 'hold' && b.lined && !b.claimed ? G.L + 40 : G.hand; if (A === 'reach' && fresh) jump = true; }
          else if (ph === 2) { tx = A === 'hold' && b.lined && !b.claimed ? G.R - 40 : G.boot; if (A === 'kick' && fresh) jump = true; }
          else { tx = G.at; if (A === 'rush' && fresh) jump = true; }
          const d2 = tx - p.cx, inp = { left: d2 < -5 && !(Math.abs(p.vx) > 120 && d2 > -20), right: d2 > 5 && !(Math.abs(p.vx) > 120 && d2 < 20) };
          if (jump && p.onGround) { inp.jump = true; inp.jumpPressed = true; hold = 0.4; } else if (hold > 0) { inp.jump = true; hold -= 1 / 60; }
          window.__bossAct = A; window.__dec = A + '/' + ph;
          sim(1 / 60, inp);
        }
        return false;
      }
      settle(); for (let q = 0; q < 240 && S().state !== 'play'; q++) sim(1 / 60); lastPow = P().power;
      const t0 = Date.now(); let si = 0, k = 0, tries = {};
      while (si < segs.length && Date.now() - t0 < 300000) {
        const steps = segs[si][1]; let ok = true;
        const won = () => ['clear', 'tally', 'results'].indexOf(S().state) >= 0;
        for (; k < steps.length; k++) { if (!doStep(steps[k]) || (!alive() && !won())) { ok = false; break; } if (P().power < lastPow) hurts++; lastPow = P().power; if (won()) break; }
        if (ok) { if (won()) { si = segs.length; break; } si++; k = 0; continue; }
        if (alive()) { deaths.push({ stuck: tileOf(), seg: si, step: k }); break; }
        deaths.push({ at: Math.floor(P().cx / 32), seg: si, step: k, tgt: window.__tgt, trail: (window.__trail || []).slice(-5), boss: window.__bossAct || undefined }); window.__bossAct = null;
        sim(3); settle(); lastPow = P() ? P().power : 0;
        if (B.Save.data.lives <= 0 || !(S() instanceof B.Play)) break;
        const x = Math.floor(P().cx / 32); si = 0; for (let q = 0; q < segs.length; q++) if (segs[q][0] <= x + 2) si = q; k = 0;
        tries[si] = (tries[si] || 0) + 1; if (tries[si] > 3) break;
      }
      const g = S(); return { id, done: ['clear', 'tally', 'results'].indexOf(g && g.state) >= 0, state: g && g.state, deaths, hurts, by: (window.__hurtLog || []).slice(0, 8), lives: B.Save.data.lives, sec: Math.round((Date.now() - t0) / 1000) };
    }, [id, BOT[id]]);
    console.log('BOT ' + JSON.stringify(r));
    check(`bot ${id}: an ordinary run (enemies on, damage on) reaches the end`, r.done, r);
    check(`bot ${id}: at most one death`, r.deaths.length <= 1, r.deaths);
  });
};

(async () => {
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => {
    for (const k of Object.keys(LEVELS).filter(k => k !== 'entry' && k !== 'map' && k !== 'bot').concat(['entry', 'map', 'bot'])) if (LEVELS[k]) await LEVELS[k](page, shot, run, pano);
  });
  if (!want.length || want.includes('portrait')) await session({ width: 390, height: 844 }, async (page, shot, run) => {
    await run('portrait', async () => {
      await page.evaluate(helpers);
      await page.evaluate(() => { fresh(); playP('35-1'); place(8, 18); sim(0.4); freeze(); }); await shot('90-portrait-35-1.png');
      await page.evaluate(() => { thaw(); playP('35-5'); toArea('counter', 6, 15); sim(1, { right: true }); for (let k = 0; k < 120 * 8 && !(S().boss && S().boss.state === 'fight' && S().boss.act === 'palm'); k++) sim(1 / 120); sim(0.6); freeze(); }); await shot('91-portrait-35-5-boss.png');
      await page.evaluate(o => { thaw(); eval(o); window.BRADY.goToMap('world', 35, '35-2'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } freeze(); }, openShad); await shot('92-portrait-shad-map.png');
    });
  });
  console.log(failures ? `${failures} SHAD CHECK(S) FAILED` : 'ALL SHAD CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
