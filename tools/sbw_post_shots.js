// Postmark Sound (world 27, a hidden land): in-browser checks and phone-size screenshots.
// (The autopilot below is the Moon tool's, tools/sbw_moon_shots.js, unchanged but for the physics hook.)
// Each level's own mechanic is PLAYED with real inputs through the game loop: an autopilot plans each hop with the
// game's own physics function on a copy of Brady's body (the planner never moves him), then feeds those exact
// inputs to the real game frame by frame and checks where he really lands (closed loop: it re-plans if he is off).
// It walks each level's main route from the start to the gate (and the secret routes), takes 844x390 landscape shots
// of the key beats, 390x844 portrait shots of 27-1, the boss and the map, and a panorama of every level area.
// usage: BRADY_DIST=<dist> node tools/sbw_post_shots.js <outdir> [--checks] [name ...]   (--checks: no pictures)
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'post-shots'), checksOnly = args.includes('--checks');
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
          window.BRADY_POST.phys(b, inp, A, dt, null, {});
          if (AP.after) AP.after(b, inp, A, dt);
          t += dt;
          if (b.y > A.H * 32 + 20 || window.BRADY_POST.lavaContact(b, A) || window.BRADY_POST.spikeContact(b, A)) return null;
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
  window.playP = id => { play(id); for (let k = 0; k < 60 && S().state !== 'play'; k++) sim(0.1); P().invuln = 999; return S(); };
  // roll the nearest loose stamp (or pad) to left tile sx: walk onto it, then walk with it
  window.rollTo = (cls, sx) => { const e = ents(cls).sort((a, b) => Math.abs(a.cxF - P().cx) - Math.abs(b.cxF - P().cx))[0]; AP.exec({ walkTo: e.cxF, dir: 0 }, 4); AP.exec({ walkTo: (sx + e.cw / 2) * 32, dir: 0 }, 5); sim(0.2); return window.BRADY_POST.kit.carriage.sx(e); };
  // ride the pad under the swelling bead until it drinks one (the pad rolls along with Brady)
  window.catchBead = (maxT) => { const e = ents('PostBlotter').sort((a, b) => Math.abs(a.cxF - P().cx) - Math.abs(b.cxF - P().cx))[0]; AP.exec({ walkTo: e.cxF, dir: 0 }, 4); const p = P(); for (let k = 0; k < 60 * (maxT || 14) && e.pad !== 'inky'; k++) { const tx = e.bead ? e.bead.x : e.nibX(); sim(1 / 60, { left: tx < p.cx - 5, right: tx > p.cx + 5 }); } return e.pad; };
  window.pushSurf = () => { const e = ents('PostBlotter').sort((a, b) => Math.abs(a.cxF - P().cx) - Math.abs(b.cxF - P().cx))[0]; rollTo('PostBlotter', e.s.rail[1]); sim(0.3, { right: true }); sim(0.3); return { pad: e.pad, drunk: e.drunk, done: e.done }; };
  // stand on a crease mark, hold THROW and walk back until the flap meets (or, the last one, then step onto it and let go)
  window.foldAt = (mx, o) => { o = o || {}; AP.go([mx, 19]); AP.exec({ walkTo: mx * 32 + 16, dir: 0 }, 2); const e = ents('PostFold').find(q => q.s.mark[0] === mx); for (let k = 0; k < 60 * 4 && e.st !== 'down' && !e.temp; k++) sim(1 / 60, { action: true, left: !o.stop || e.ang < o.stop }); if (o.stop) { sim(0.3); return { st: e.st, ang: e.ang }; } if (e.temp && !o.release) { for (let k = 0; k < 60 * 4 && !(P().cx > e.Bt[0] * 32 + 40 && P().onGround); k++) sim(1 / 60, { action: true, right: true }); } sim(0.2); return { st: e.st, temp: e.temp, tuck: e.tuck }; };
  // walk a ruler to its end (big: right, small: left), wait for the harbour to reach that size, then step off the end
  window.scaleEnd = (x0, x1, end, wait) => { const tx = end === 'big' ? x1 : x0, d = end === 'big' ? 1 : -1; AP.go([tx, 19]); AP.exec({ walkTo: tx * 32 + 16, dir: 0 }, 2); sim(wait || 3.4); const e = ents('PostScale').find(q => q.s.bars.some(b => b[0] === x0)); const live = e.sc; AP.exec({ walkTo: (tx + d * 2) * 32 + 16, dir: 0 }, 2); sim(0.3); return { live: Math.round(live * 100) / 100, lock: e.lockS }; };
  window.throwN = (n, gap) => { for (let k = 0; k < n; k++) { sim(1 / 120, { action: true, actionPressed: true }); sim(gap || 0.45); } };
  window.isl = x => ents('PostIsland').find(e => e.r[0] <= x && e.r[2] >= x);
  window.tileName = (x, y) => { const A = S().area, T = window.BRADY.T; const t = A.tiles[y * A.W + x]; return Object.keys(T).find(k => T[k] === t); };
  window.waitIsl = (e, st, maxT) => { for (let k = 0; k < 120 * (maxT || 3) && e.st !== st; k++) sim(1 / 120); return e.st; };
};
const shotAt = async (page, shot, name, fn, arg) => { await page.evaluate(fn, arg); await page.evaluate(() => freeze()); await shot(name); await page.evaluate(() => thaw()); };

LEVELS.dbg = async (page, shot, run) => { await run('dbg', async () => { await page.evaluate(helpers); const r = await page.evaluate(() => { fresh(); playP('27-5'); place(40, 18); sim(0.3); const a = scaleEnd(43, 48, 'small'); const p = P(); const rows = []; for (let y = 15; y <= 19; y++) { let l = ''; for (let x = 38; x <= 58; x++) l += (tileName(x, y) || '?')[0]; rows.push(l); } return { a, rows, cx: p.cx / 32, y: p.y / 32, on: p.onGround, gt: p.groundTy, st: p.state, dead: p.dead, plan: AP.plan([50, 19]) ? 1 : 0, w: P().w, h: P().h }; }); console.log(JSON.stringify(r)); }); };
// ---------------- the hidden entrance: Vietnam 10-3, the river steps under the night market ----------------
LEVELS.entry = async (page, shot, run, pano) => {
  await run('entry', async () => {
    await page.evaluate(helpers);
    let r = await page.evaluate(() => { fresh(); const T = window.BRADY_TOUR; return { stop: T.TourMap ? T.TourMap.stopState(T.Tour.stops.post) : null, open: T.TourProgress.countryUnlocked(T.Tour.countries.post) }; });
    check('entrance: on a fresh save the harbour is hidden (no pin, not open)', r.stop === 'hidden' && !r.open, r);
    // the market street at the start: the gap in the floor by the first stair stools, at game scale
    await page.evaluate(() => { playP('10-3'); place(8, 18); sim(0.6); freeze(); }); await shot('01-entrance-10-3-market-start.png');
    r = await page.evaluate(() => { thaw(); const a = AP.route([[4, 16], [2, 22]]); const b = AP.go([9, 24]); return { a: a.ok, b: b.ok, at: tileOf(), fail: a.fail }; });
    check('entrance: up the first stair stools, then down through the gap in the street floor behind them to the river steps under the market', r.a && r.b, r);
    // BEFORE: the three racks on the landing; the last rack's lowest card has a wave running across its border
    await page.evaluate(() => { sim(0.4); freeze(); }); await shot('02-entrance-before-the-racks.png');
    r = await page.evaluate(() => { thaw(); const a = AP.go([12, 24]); sim(0.7, { left: true }); const s1 = S().state, ps = P().state; AP.go([12, 24]); sim(0.5, { down: true }); return { a: a.ok, walk: s1 === 'play' && ps === 'play', crouch: S().state === 'play' && P().state === 'play' }; });
    check('entrance: walking into the rack or crouching alone does nothing (no accident)', r.a && r.walk && r.crouch, r);
    await page.evaluate(() => { AP.go([12, 24]); sim(0.2); freeze(); }); await shot('03-entrance-reverse-side.png');
    r = await page.evaluate(() => { thaw(); sim(0.5, { down: true, left: true }); return { state: P().state }; });
    check('entrance: on the rack\'s reverse side, crouch and push into the lowest card: Brady slips into it', r.state === 'portal', r);
    await page.evaluate(() => { sim(0.5); freeze(); }); await shot('04-entrance-slipping-into-the-card.png');
    r = await page.evaluate(() => { thaw(); sim(1.6); const g = S(); return { state: g.state, key: g.exitKey, banner: g.bannerText }; });
    check('entrance: the land\'s name shows and 10-3 clears through its hidden exit', r.state !== 'play' && r.key === 'post', r);
    r = await page.evaluate(() => { const T = window.BRADY_TOUR, d = window.BRADY.Save.data; return { land: !!T.TourProgress.data().lands.post, open: T.TourProgress.countryUnlocked(T.Tour.countries.post), first: !!d.unlocked['27-1'], done: !!d.done['10-3'] }; });
    check('entrance: the harbour is open, 27-1 unlocked; 10-3 itself is not marked done by the secret way', r.land && r.open && r.first && !r.done, r);
    r = await page.evaluate(() => { const T = window.BRADY_TOUR.TourProgress.data(); T.seen.vn = true; window.BRADY.goToMap('world', 10, '10-3'); const out = []; for (let k = 0; k < 40; k++) { sim(0.1); const s = S(); if (s.card) s.card = null; out.push(s.mode + (s.rReveal ? ':' + s.rReveal.r.kind : '')); if (s.rReveal && s.rReveal.r.kind === 'land' && s.rReveal.t > 0.6) break; } return { seq: [...new Set(out)] }; });
    await page.evaluate(() => freeze()); await shot('05-entrance-arrival-new-land.png'); await page.evaluate(() => thaw());
    check('entrance: back on the map the route map plays the NEW LAND reveal', r.seq.some(q => /land/.test(q)), r);
    r = await page.evaluate(() => { for (let k = 0; k < 60; k++) { const s = S(); if (s.card) s.card = null; sim(0.25); if (s.mode === 'land' && s.ow && s.ow.cc === 'post') break; } const s = S(); return { mode: s.mode, cc: s.ow && s.ow.cc, stop: window.BRADY_TOUR.TourMap.stopState(window.BRADY_TOUR.Tour.stops.post) }; });
    check('entrance: the route map reveals the new land and flies Brady to the harbour\'s own map', r.cc === 'post', r);
    await page.evaluate(() => { sim(1.5); freeze(); }); await shot('06-entrance-arrival-harbour-map.png'); await page.evaluate(() => thaw());
  });
};

// ---------------- 27-1 Perforation Walk ----------------
LEVELS.perf = async (page, shot, run, pano) => {
  await run('perf', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('27-1'); place(4, 18); sim(0.6); freeze(); }); await shot('10-27-1-start.png');
    let r = await page.evaluate(() => { thaw(); return AP.route([[20, 19], [26, 17], [29, 15]]); });
    check('27-1: up the steps to the ledge by the first island', r.ok, r);
    await shotAt(page, shot, '11-27-1-island-teach.png', () => { place(30, 14); sim(0.3); });
    // walk its whole dotted top: every tooth tears, it trembles; jump back to the ledge before it falls
    r = await page.evaluate(() => { const e = isl(33); AP.exec({ walkTo: 36 * 32 + 16, dir: 0 }, 3); const st = e.st; return { st, torn: e.s.teeth.filter(x => e.torn(x)).length }; });
    check('27-1: walking the island\'s top tears all six teeth: it trembles (the tell)', r.st === 'tremble' && r.torn === 6, r);
    await page.evaluate(() => { sim(0.15); freeze(); }); await shot('12-27-1-island-trembles.png'); await page.evaluate(() => thaw());
    r = await page.evaluate(() => { const a = AP.go([29, 15]); const e = isl(33); waitIsl(e, 'landed', 3); sim(0.3); return { ok: a.ok, st: e.st, plug: tileName(33, 17), dead: P().dead }; });
    check('27-1: back on the ledge in time; the island falls and plugs the ink', r.ok && r.st === 'landed' && r.plug === 'HARD' && !r.dead, r);
    await shotAt(page, shot, '13-27-1-island-plug.png', () => { place(29, 14); sim(0.2); });
    r = await page.evaluate(() => AP.route([[34, 17], [44, 17], [55, 17], [62, 17]]));
    check('27-1: down onto the plug and across to the far bank', r.ok, r);
    // riding a falling island is a fall into the ink
    r = await page.evaluate(() => { const g = S(), p = P(); p.invuln = 0; const lives = window.BRADY.Save.data.lives; place(64, 16); sim(0.2); AP.exec({ walkTo: 70 * 32 + 16, dir: 0 }, 3); const st = isl(67).st; sim(2.5); return { st, dead: p.dead || g.state !== 'play' }; });
    check('27-1: staying on a torn island takes Brady down into the ink (it is a real danger)', r.st === 'tremble' && r.dead, r);
    await page.evaluate(() => { playP('27-1'); place(62, 16); });
    r = await page.evaluate(() => { AP.exec({ walkTo: 70 * 32 + 16, dir: 0 }, 3); const a = AP.go([62, 17]); const e = isl(67); waitIsl(e, 'landed', 3); return { ok: a.ok && e.st === 'landed', b: AP.route([[68, 19], [80, 19], [92, 19], [96, 17], [99, 16]]) }; });
    check('27-1: the second island torn and plugged, on to the third', r.ok && r.b.ok, r);
    r = await page.evaluate(() => { AP.exec({ walkTo: 106 * 32 + 16, dir: 0 }, 3); const a = AP.go([99, 16]); const e = isl(103); waitIsl(e, 'landed', 3); return { ok: a.ok && e.st === 'landed', b: AP.route([[104, 18], [116, 18]]) }; });
    check('27-1: the third island plugs its channel too', r.ok && r.b.ok, r);
    // the secret: a corner curls down from a gap in the tunnel roof; jump up through it onto the run on top
    await shotAt(page, shot, '14-27-1-secret-tell.png', () => { place(117, 17); sim(0.3); });
    r = await page.evaluate(() => AP.route([[120, 18], [122, 15], [128, 15]]));
    check('27-1: up through the gap in the tunnel roof onto the run on top, to the press\'s letterbox', r.ok, r);
    await shotAt(page, shot, '15-27-1-run-above.png', () => { sim(0.2); });
    r = await page.evaluate(() => { AP.go([136, 18], {}); return AP.route([[144, 17]]); });
    // the twist: hop over the two-coloured tooth
    await shotAt(page, shot, '16-27-1-twist-pair.png', () => { place(145, 16); sim(0.3); });
    r = await page.evaluate(() => { const a = AP.go([149, 17]); const b = AP.go([151, 17], { jump: true }); const c = AP.go([154, 17]); const d = AP.go([160, 17]); return { a: a.ok, b: b.ok, c: c.ok, d: d.ok, A: isl(148).st, B: isl(152).st }; });
    check('27-1: twist: tear the first island\'s teeth, hop OVER the shared tooth, both stay up: across to the far ledge', r.a && r.b && r.c && r.d && r.A === 'hold' && r.B === 'hold', r);
    r = await page.evaluate(() => { playP('27-1'); place(145, 16); const p = P(); AP.exec({ walkTo: 151 * 32 + 16, dir: 0 }, 3); sim(0.1); return { A: isl(148).st, B: isl(152).st }; });
    check('27-1: twist: walking over the shared tooth tears BOTH islands free at once', r.A === 'tremble' && r.B === 'tremble', r);
    r = await page.evaluate(() => { playP('27-1'); place(160, 16); const a = AP.route([[180, 17], [195, 17]]); sim(2, { right: true }); return { a: a.ok, state: S().state }; });
    check('27-1: on to the gate', r.a && r.state !== 'play', r);
    await page.evaluate(() => { playP('27-1'); }); await pano('19-27-1-panorama.png', 0.35);
  });
};

// ---------------- 27-2 Stamp Duty ----------------
LEVELS.stamp = async (page, shot, run, pano) => {
  await run('stamp', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('27-2'); place(4, 18); sim(0.6); freeze(); }); await shot('20-27-2-start.png');
    let r = await page.evaluate(() => { thaw(); const a = rollTo('PostStamp', 14); throwN(1); return { a, t: [tileName(19, 19), tileName(18, 19)] }; });
    check('27-2: THROW at the stamp prints its slab on the facing page, mirrored', r.t[0] === 'HARD' && r.t[1] === 'HARD', r);
    r = await page.evaluate(() => { const a = rollTo('PostStamp', 11); sim(0.1); freeze(); return { a }; });
    await shot('21-27-2-stamp-silhouette.png');
    r = await page.evaluate(() => { thaw(); throwN(1); return { old: tileName(19, 19), t: [tileName(22, 19), tileName(21, 19)] }; });
    check('27-2: rolled to the mark the silhouette shows, a new print wipes the old one', r.old === 'EMPTY' && r.t[0] === 'HARD' && r.t[1] === 'HARD', r);
    await shotAt(page, shot, '22-27-2-printed.png', () => { sim(0.3); });
    r = await page.evaluate(() => AP.route([[16, 19], [21, 19], [29, 19]]));
    check('27-2: two hops over the ink on the printed slab', r.ok, r);
    r = await page.evaluate(() => { const a = rollTo('PostStamp', 34); throwN(1); return { a, t: [tileName(49, 16), tileName(48, 16)], b: AP.route([[44, 19], [48, 16], [53, 14]]) }; });
    check('27-2: the second stamp prints a step half-way up the cliff, and up it goes', r.t[0] === 'HARD' && r.t[1] === 'HARD' && r.b.ok, r);
    await shotAt(page, shot, '23-27-2-secret-tell.png', () => { place(46, 18); sim(0.3); });
    r = await page.evaluate(() => { const a = AP.go([53, 19]); return { ok: a.ok, at: tileOf() }; });
    check('27-2: the cliff\'s foot where the corner curls is paper: walk into it to the bureau\'s door', r.ok, r);
    r = await page.evaluate(() => { place(72, 13); const a = AP.route([[78, 19]]); const b = rollTo('PostStamp', 90); sim(0.1); freeze(); return { a: a.ok, b }; });
    await shot('24-27-2-L-silhouette.png');
    r = await page.evaluate(() => { thaw(); throwN(1); return { t: [tileName(103, 17), tileName(103, 18), tileName(102, 18), tileName(102, 17)], b: AP.route([[100, 19], [102, 18], [103, 17], [107, 14]]) }; });
    check('27-2: twist: the L prints the other way round (its tall side against the cliff) and climbs it', r.t[0] === 'HARD' && r.t[1] === 'HARD' && r.t[2] === 'HARD' && r.t[3] === 'EMPTY' && r.b.ok, r);
    r = await page.evaluate(() => { const a = AP.route([[125, 14], [137, 16], [146, 19], [158, 19]]); sim(3, { right: true }); return { a: a.ok, state: S().state }; });
    check('27-2: on over the last ink to the gate', r.a && r.state !== 'play', r);
    await page.evaluate(() => { playP('27-2'); }); await pano('29-27-2-panorama.png', 0.35);
  });
};

// ---------------- 27-3 Blotter Bay ----------------
LEVELS.blot = async (page, shot, run, pano) => {
  await run('blot', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('27-3'); place(4, 18); sim(0.6); freeze(); }); await shot('30-27-3-start.png');
    let r = await page.evaluate(() => { thaw(); const e = ents('PostBlotter')[0]; const pad = catchBead(); return { pad }; });
    check('27-3: walking the pad under the bead: it drinks the ink', r.pad === 'inky', r);
    await shotAt(page, shot, '31-27-3-inky-pad.png', () => { sim(0.1); });
    r = await page.evaluate(() => { const a = pushSurf(); sim(2.2); return Object.assign(a, { dock: tileName(21, 19), surf: tileName(18, 16) }); });
    check('27-3: the inky pad pushed into the surf drinks a gap; the paper boat sails through and docks as a bridge', r.done && r.dock === 'SEMI' && r.surf === 'EMPTY', r);
    await shotAt(page, shot, '32-27-3-boat-through.png', () => { sim(0.1); });
    r = await page.evaluate(() => AP.route([[16, 19], [21, 19], [27, 19]]));
    check('27-3: across on the paper boat', r.ok, r);
    r = await page.evaluate(() => { AP.route([[40, 19], [49, 19]]); const pad = catchBead(); const a = pushSurf(); sim(2.2); return Object.assign(a, { pad, b: AP.route([[54, 19], [60, 19], [66, 19]]) }); });
    check('27-3: the second surf drunk, across on its boat', r.done && r.b.ok, r);
    await shotAt(page, shot, '33-27-3-secret-tell.png', () => { place(70, 18); sim(0.3); });
    r = await page.evaluate(() => { AP.go([72, 19]); const a = AP.go([75, 22], {}); return { ok: a.ok, at: tileOf() }; });
    check('27-3: down + JUMP on the stamp-edge lid where the corner curls: through to the passage under the quay', r.ok, r);
    // the twist: two beads, and a soaked pad dries only on the blotter
    r = await page.evaluate(() => { place(100, 18); const e = ents('PostBlotter').find(q => q.s.need === 2); const p1 = catchBead(); const a = pushSurf(); const soaked = e.pad; const c2 = catchBead(4); return { p1, drunk: a.drunk, soaked, c2 }; });
    check('27-3: twist: the first bead drinks half the surf; the soaked pad will not take another', r.p1 === 'inky' && r.drunk === 1 && r.soaked === 'full' && r.c2 === 'full', r);
    await shotAt(page, shot, '34-27-3-twist-blotter.png', () => { sim(0.1); });
    r = await page.evaluate(() => { const e = ents('PostBlotter').find(q => q.s.need === 2); rollTo('PostBlotter', e.s.blotter[0] - 1); sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.5, { jump: true }); sim(0.5); const dry = e.pad; catchBead(); const a = pushSurf(); sim(2.2); return { dry, a, b: AP.route([[114, 19], [120, 19], [128, 19]]) }; });
    check('27-3: twist: a jump slaps the pad on the blotter, it drinks the second bead and the rest of the surf; across', r.dry === 'dry' && r.a.done && r.b.ok, r);
    r = await page.evaluate(() => { const a = AP.route([[150, 19], [170, 19]]); sim(3, { right: true }); return { a: a.ok, state: S().state }; });
    check('27-3: on to the gate', r.a && r.state !== 'play', r);
    await page.evaluate(() => { playP('27-3'); }); await pano('39-27-3-panorama.png', 0.35);
  });
};

// ---------------- 27-4 Forwarding Fold ----------------
LEVELS.fold = async (page, shot, run, pano) => {
  await run('fold', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('27-4'); place(15, 18); sim(0.6); freeze(); }); await shot('40-27-4-crease-teach.png');
    let r = await page.evaluate(() => { thaw(); const a = foldAt(19, { stop: 0.5 }); sim(0.8); const e = ents('PostFold')[0]; return { a, after: e.ang, st: e.st }; });
    check('27-4: letting go half way: the flap springs back up', r.a.st === 'up' && r.after < 0.1, r);
    r = await page.evaluate(() => { AP.go([19, 19]); const e = ents('PostFold')[0]; for (let k = 0; k < 60 && e.ang < 0.5; k++) sim(1 / 60, { action: true, left: true }); freeze(); return { ang: e.ang }; });
    await shot('41-27-4-folding.png');
    r = await page.evaluate(() => { thaw(); const a = foldAt(19); return { a, bridge: tileName(23, 19), flap: tileName(26, 16) }; });
    check('27-4: hold THROW and walk back: the far bank\'s flap folds over and locks as a bridge', r.a.st === 'down' && r.bridge === 'SEMI' && r.flap === 'EMPTY', r);
    await shotAt(page, shot, '42-27-4-folded.png', () => { place(20, 18); sim(0.2); });
    r = await page.evaluate(() => { const a = AP.route([[24, 19], [30, 19], [44, 19]]); const b = foldAt(46); const c = AP.route([[52, 19], [60, 19], [76, 19]]); return { a: a.ok, b, c: c.ok }; });
    check('27-4: the second, wider fold, past the crease eels', r.a && r.b.st === 'down' && r.c, r);
    await shotAt(page, shot, '43-27-4-secret-tell.png', () => { place(77, 18); sim(0.3); });
    r = await page.evaluate(() => { const a = foldAt(79); const b = AP.route([[84, 19], [90, 19]]); return { a, b: b.ok }; });
    check('27-4: the optional crease by the curling corner folds a flap over to the letterbox ledge', r.a.st === 'down' && r.b, r);
    r = await page.evaluate(() => { place(80, 18); const a = AP.route([[84, 25], [100, 25], [117, 23], [121, 19], [133, 19]]); return { a: a.ok, fail: a.fail }; });
    check('27-4: the way on drops under the ledge and climbs back up to the last crease', r.a, r);
    r = await page.evaluate(() => { const a = foldAt(134, { release: true }); sim(0, {}); sim(0.3); const e = ents('PostFold').find(q => q.s.last); return { a, st: e.st, tuck: e.tuck > 0, bridge: tileName(138, 19) }; });
    check('27-4: twist: letting go off the last flap tucks the exit away and it springs back', r.st === 'up' && r.tuck && r.bridge === 'EMPTY', r);
    await shotAt(page, shot, '44-27-4-twist-tucked.png', () => { sim(0.1); });
    r = await page.evaluate(() => { sim(1.5); const a = foldAt(134); freeze(); return { a, bridge: tileName(138, 19) }; });
    await shot('45-27-4-twist-on-printed-side.png');
    r = await page.evaluate(o => { thaw(); const a = AP.route([[144, 19], [150, 19]]); sim(3, { right: true }); return { a: a.ok, state: S().state, bridge: o }; }, r);
    check('27-4: twist: still holding, onto the printed side, then let go: it stays; on to the gate', r.a && r.state !== 'play' && r.bridge.a.st === 'down', r);
    await page.evaluate(() => { playP('27-4'); }); await pano('49-27-4-panorama.png', 0.35);
  });
};

// ---------------- 27-5 Mismeasured Coast ----------------
LEVELS.coast = async (page, shot, run, pano) => {
  await run('coast', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('27-5'); place(4, 18); sim(0.6); freeze(); }); await shot('50-27-5-start.png');
    let r = await page.evaluate(() => { thaw(); AP.go([11, 19]); sim(0.2, { right: true }); sim(0.9); freeze(); const e = ents('PostScale')[0]; return { live: e.live, sc: e.sc }; });
    await shot('51-27-5-ruler-live.png');
    check('27-5: on the ruler the harbour starts to change size slowly (live)', r.live && r.sc > 1 && r.sc < 1.6, r);
    r = await page.evaluate(() => { thaw(); const a = scaleEnd(9, 14, 'big'); return { a, t: [tileName(21, 19), tileName(32, 19)] }; });
    check('27-5: wait at the right end and step off: the quay block locks at ×2 around its pin', r.a.lock === 2 && r.t[0] === 'GROUND' && r.t[1] === 'GROUND', r);
    await shotAt(page, shot, '52-27-5-locked-big.png', () => { sim(0.2); });
    r = await page.evaluate(() => AP.route([[16, 19], [22, 19], [31, 19], [38, 19]]));
    check('27-5: two short hops across the enlarged quay', r.ok, r);
    r = await page.evaluate(() => { const a = scaleEnd(43, 48, 'small'); return { a, wall: tileName(53, 12), stub: tileName(54, 17), b: (place(50, 18), sim(0.2), AP.route([[57, 19]])) }; });
    check('27-5: the tall card wall shrinks to a stub (×0.25) and Brady hops over it', r.a.lock === 0.25 && r.wall === 'EMPTY' && r.stub === 'GROUND' && r.b.ok, r);
    await shotAt(page, shot, '53-27-5-secret-tell.png', () => { place(60, 18); sim(0.3); });
    r = await page.evaluate(() => AP.route([[63, 19], [64, 16], [67, 16]]));
    check('27-5: up through the gap in the tunnel roof to the chute room\'s letterbox', r.ok, r);
    r = await page.evaluate(() => { place(74, 18); const a = scaleEnd(78, 84, 'big'); freeze(); return { a, under: [tileName(90, 18), tileName(90, 17), tileName(85, 16)] }; });
    await shot('54-27-5-twist-wall-raised.png');
    check('27-5: twist: the first ruler enlarges the hanging wall: room to walk under it', r.a.lock === 2 && r.under[0] === 'EMPTY' && r.under[1] === 'EMPTY' && r.under[2] === 'GROUND', r);
    r = await page.evaluate(() => { thaw(); const a = AP.route([[88, 19], [93, 19]]); const b = scaleEnd(94, 99, 'small'); return { a: a.ok, b, q: tileName(101, 16), c: AP.route([[100, 19], [102, 16], [108, 13]]) }; });
    check('27-5: twist: under it, then the second ruler shrinks the high far quay to a step; up to the cliff', r.a && r.b.lock === 0.5 && r.q === 'GROUND' && r.c.ok, r);
    await shotAt(page, shot, '55-27-5-twist-quay-step.png', () => { place(99, 18); sim(0.2); });
    r = await page.evaluate(() => { place(108, 12); const a = AP.route([[125, 13], [135, 13]]); sim(3, { right: true }); return { a: a.ok, state: S().state }; });
    check('27-5: on to the gate', r.a && r.state !== 'play', r);
    await page.evaluate(() => { playP('27-5'); }); await pano('59-27-5-panorama.png', 0.35);
  });
};

(async () => {
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => {
    for (const k of Object.keys(LEVELS).filter(k => k !== 'entry' && k !== 'map' && k !== 'bot').concat(['entry', 'map', 'bot'])) if (LEVELS[k]) await LEVELS[k](page, shot, run, pano);
  });
  console.log(failures ? `${failures} POST CHECK(S) FAILED` : 'ALL POST CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
