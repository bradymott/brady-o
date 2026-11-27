// The Unflattering Gallery (world 30, a hidden land): in-browser checks and phone-size screenshots.
// (The autopilot below is the Moon tool's, tools/sbw_moon_shots.js, unchanged but for the physics hook.)
// Each level's own mechanic is PLAYED with real inputs through the game loop: an autopilot plans each hop with the
// game's own physics function on a copy of Brady's body (the planner never moves him), then feeds those exact
// inputs to the real game frame by frame and checks where he really lands (closed loop: it re-plans if he is off).
// It walks each level's main route from the start to the gate (and the secret routes), takes 844x390 landscape shots
// of the key beats, 390x844 portrait shots of 30-1, the boss and the map, and a panorama of every level area.
// usage: BRADY_DIST=<dist> node tools/sbw_gal_shots.js <outdir> [--checks] [name ...]   (--checks: no pictures)
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'gal-shots'), checksOnly = args.includes('--checks');
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
          window.BRADY_GAL.phys(b, inp, A, dt, null, {});
          if (AP.after) AP.after(b, inp, A, dt);
          t += dt;
          if (b.y > A.H * 32 + 20 || window.BRADY_GAL.lavaContact(b, A) || window.BRADY_GAL.spikeContact(b, A)) return null;
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
  window.tileName = (x, y) => { const A = S().area, T = window.BRADY.T; const t = A.tiles[y * A.W + x]; return Object.keys(T).find(k => T[k] === t); };
  window.throwN = (n, gap) => { for (let k = 0; k < n; k++) { sim(1 / 120, { action: true, actionPressed: true }); sim(gap || 0.45); } };
  // stand in a portrait's outline (crouching if it asks) until it is finished
  window.sitAt = (x, row, crouch) => { const r = AP.go([x, row]); AP.exec({ walkTo: x * 32 + 16, dir: 0 }, 2); const e = ents('GalSitter').find(q => Math.abs(q.ox - (x * 32 + 16)) < 20); for (let k = 0; k < 120 * 3 && e && !e.done; k++) sim(1 / 120, crouch ? { down: true } : {}); sim(0.6); return { go: r.ok, done: !!(e && e.done) }; };
  // roll the nearest carriage prop (viewer, posing mark) to left tile sx: walk onto it, then walk with it; then wait a breath
  window.rollTo = (cls, sx, wait) => { const L = ents(cls), on = L.filter(q => q.rail[0] <= sx && q.rail[1] >= sx), e = (on.length ? on : L).sort((a, b) => Math.abs(a.cxF - P().cx) - Math.abs(b.cxF - P().cx))[0]; AP.exec({ walkTo: e.cxF, dir: 0 }, 4); AP.exec({ walkTo: (sx + e.cw / 2) * 32, dir: 0 }, 5); sim(wait == null ? 1.5 : wait); return { sx: window.BRADY_GAL.kit.carriage.sx(e), done: e.done }; };
  // run (hold RUN) across a stretch to x on this row
  window.runTo = (x) => { const p = P(); for (let k = 0; k < 120 * 6; k++) { const d = x * 32 + 16 - p.cx; if (Math.abs(d) < 10) break; sim(1 / 120, { right: d > 0, left: d < 0, action: true }); } sim(0.3); };
  // up through a door where Brady stands
  window.doorUp = () => { sim(0.2); sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 200 && S().fade && S().fade.a > 0.02 || k < 30; k++) sim(1 / 60); sim(0.5); return S().area.aid; };
};
const shotAt = async (page, shot, name, fn, arg) => { await page.evaluate(fn, arg); await page.evaluate(() => freeze()); await shot(name); await page.evaluate(() => thaw()); };

// ---------------- 30-1 Hold Still, Darling ----------------
LEVELS.hall = async (page, shot, run, pano) => {
  await run('hall', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('30-1'); place(4, 18); sim(0.6); freeze(); }); await shot('10-30-1-start.png');
    let r = await page.evaluate(() => { thaw(); const a = AP.go([16, 19]); sim(0.3); return { a: a.ok, rope: tileName(18, 17) }; });
    check('30-1: the first velvet rope bars the way until the portrait is done', r.a && r.rope === 'HARD', r);
    await shotAt(page, shot, '11-30-1-portrait-teach.png', () => { AP.exec({ walkTo: 13 * 32 + 16, dir: 0 }, 2); sim(0.7); });
    r = await page.evaluate(() => { const a = sitAt(13, 19); return { a, rope: tileName(18, 17) }; });
    check('30-1: standing still in the outline for a breath finishes the portrait: the rope lifts', r.a.done && r.rope === 'EMPTY', r);
    r = await page.evaluate(() => { AP.go([25, 19]); AP.exec({ walkTo: 25 * 32 + 16, dir: 0 }, 2); sim(2); const e = ents('GalSitter').find(q => Math.abs(q.ox - (25 * 32 + 16)) < 20); return { standing: e.done }; });
    check('30-1: standing in a crouching outline does nothing', !r.standing, r);
    await shotAt(page, shot, '12-30-1-crouch-outline.png', () => { sim(0.6, { down: true }); });
    r = await page.evaluate(() => { const a = sitAt(25, 19, true); return { a, rope: tileName(31, 17) }; });
    check('30-1: crouching (stick down) in the crouch outline finishes it', r.a.done && r.rope === 'EMPTY', r);
    r = await page.evaluate(() => { const a = AP.route([[40, 19], [50, 19]]); const b = sitAt(52, 17); return { a: a.ok, b, rope: tileName(58, 17) }; });
    check('30-1: up onto the plinth and into the outline: the third rope lifts', r.a && r.b.done && r.rope === 'EMPTY', r);
    await shotAt(page, shot, '13-30-1-secret-tell.png', () => { AP.go([68, 19]); sim(0.3); });
    r = await page.evaluate(() => AP.route([[71, 19], [73, 16], [80, 16]]));
    check('30-1: up through the gap in the panelled ceiling onto the run on top, to the loft\'s hatch', r.ok, r);
    await shotAt(page, shot, '14-30-1-run-above.png', () => { sim(0.2); });
    r = await page.evaluate(() => { playP('30-1'); place(92, 18); sim(0.3); const a = sitAt(100, 19, true); const b = AP.route([[110, 19], [118, 19]]); return { a, b: b.ok }; });
    check('30-1: the crouch with the velvet rope about', r.a.done && r.b, r);
    await shotAt(page, shot, '15-30-1-pupo.png', () => { AP.go([120, 17]); AP.exec({ walkTo: 120 * 32 + 16, dir: 0 }, 2); sim(0.5, { down: true }); });
    r = await page.evaluate(() => { const a = sitAt(120, 17, true); const b = AP.route([[130, 19], [137, 19], [150, 19], [160, 19]]); sim(2, { right: true }); return { a, b: b.ok, state: S().state }; });
    check('30-1: twist: crouch on Pupo\'s plinth (the knee is his lip), then on over the varnish to the gate', r.a.done && r.b && r.state !== 'play', r);
    await page.evaluate(() => { playP('30-1'); }); await pano('19-30-1-panorama.png', 0.35);
  });
};

// ---------------- 30-2 A Question of Perspective ----------------
LEVELS.long = async (page, shot, run, pano) => {
  await run('long', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('30-2'); place(4, 18); sim(0.6); freeze(); }); await shot('20-30-2-start.png');
    let r = await page.evaluate(() => { thaw(); const a = rollTo('GalViewer', 12, 0.2); return { a, bridge: tileName(25, 19) }; });
    check('30-2: rolled to the wrong spot the halves don\'t meet: no bridge', r.bridge === 'EMPTY', r);
    await shotAt(page, shot, '21-30-2-halves-apart.png', () => { sim(0.1); });
    r = await page.evaluate(() => { const a = rollTo('GalViewer', 15, 1.6); return { a, bridge: tileName(25, 19) }; });
    check('30-2: rolled till the halves meet and held a breath: the painted bridge is real', r.a.done && r.bridge === 'SEMI', r);
    await shotAt(page, shot, '22-30-2-bridge-real.png', () => { sim(0.1); });
    r = await page.evaluate(() => AP.route([[24, 19], [30, 19], [36, 19]]));
    check('30-2: across the varnish on the bridge', r.ok, r);
    r = await page.evaluate(() => { const a = rollTo('GalViewer', 44, 1.6); const b = AP.route([[52, 19], [60, 19], [66, 19]]); return { a, b: b.ok }; });
    check('30-2: the second frame (a pigeon on its rail, gnats over the channel)', r.a.done && r.b, r);
    await shotAt(page, shot, '23-30-2-secret-tell.png', () => { AP.go([71, 19]); sim(0.3); });
    r = await page.evaluate(() => { const a = AP.go([76, 19]); return { ok: a.ok, at: tileOf() }; });
    check('30-2: the panel by the pale patch is only canvas: through it to the workshop\'s hatch', r.ok, r);
    r = await page.evaluate(() => { playP('30-2'); place(96, 18); sim(0.3); const a = rollTo('GalViewer', 108, 1.6); return { a, stair: tileName(113, 17) }; });
    check('30-2: twist: at the false spot the handrail meets but the stair stays paint', !r.a.done && r.stair === 'EMPTY', r);
    await shotAt(page, shot, '24-30-2-twist-false-rail.png', () => { sim(0.1); });
    r = await page.evaluate(() => { const a = rollTo('GalViewer', 111, 1.6); const b = AP.route([[112, 18], [115, 15], [118, 12], [130, 12]]); return { a, b }; });
    check('30-2: twist: one more nudge: the stair is real; up it to the gallery above', r.a.done && r.b.ok, r);
    await shotAt(page, shot, '25-30-2-stair-real.png', () => { place(122, 11); sim(0.2); });
    r = await page.evaluate(() => { const a = AP.route([[134, 12], [141, 12], [150, 12], [160, 12]]); sim(2, { right: true }); return { a: a.ok, state: S().state }; });
    check('30-2: over the last varnish to the gate', r.a && r.state !== 'play', r);
    await page.evaluate(() => { playP('30-2'); }); await pano('29-30-2-panorama.png', 0.35);
  });
};

// ---------------- 30-3 Underpainting ----------------
LEVELS.studio = async (page, shot, run, pano) => {
  await run('studio', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('30-3'); place(4, 18); sim(0.6); freeze(); }); await shot('30-30-3-start.png');
    let r = await page.evaluate(() => { thaw(); AP.go([10, 19]); AP.exec({ walkTo: 21 * 32, dir: 0 }, 4); sim(0.3); const e = ents('GalRidge')[0]; return { done: e.done, bal: tileName(23, 16) }; });
    check('30-3: walking across the ridge only polishes it', !r.done && r.bal === 'EMPTY', r);
    r = await page.evaluate(() => { AP.go([4, 19]); runTo(21); const e = ents('GalRidge')[0]; return { done: e.done, bal: tileName(23, 16) }; });
    check('30-3: RUN across it: the top coat scrapes off and the old balcony steps are solid', r.done && r.bal === 'HARD', r);
    await shotAt(page, shot, '31-30-3-balcony-revealed.png', () => { sim(0.4); });
    r = await page.evaluate(() => AP.route([[23, 16], [27, 13], [32, 12], [50, 12], [60, 12]]));
    check('30-3: up the old balcony steps to the top of the wall', r.ok, r);
    r = await page.evaluate(() => { playP('30-3'); place(63, 18); sim(0.3); runTo(73); sim(0.3); const e = ents('GalRidge')[1]; const a = AP.route([[80, 19], [86, 19], [90, 19]]); return { done: e.done, a: a.ok }; });
    check('30-3: the test ridge gives a balcony over the varnish channel', r.done && r.a, r);
    await shotAt(page, shot, '32-30-3-secret-tell.png', () => { AP.go([89, 19]); sim(0.3); });
    r = await page.evaluate(() => { const a = AP.route([[92, 23], [98, 23]]); return { ok: a.ok, at: tileOf() }; });
    check('30-3: down the hole by the pale patch to the cloakroom\'s hatch', r.ok, r);
    r = await page.evaluate(() => { playP('30-3'); place(97, 18); sim(0.3); runTo(109); sim(0.4); const e3 = ents('GalRidge')[2]; return { done: e3.done, bal: tileName(125, 19) }; });
    check('30-3: twist: run the ledge\'s ridge: the balcony past the channel appears', r.done && r.bal === 'HARD', r);
    await shotAt(page, shot, '33-30-3-twist.png', () => { sim(0.1); });
    r = await page.evaluate(() => { const a = AP.route([[113, 19], [119, 19], [124, 19], [131, 19], [136, 19]]); const e4 = ents('GalRidge')[3]; return { a: a.ok, held: !e4.done }; });
    check('30-3: twist: WALK the ridge over the varnish (it holds), on to the balcony and the far floor', r.a && r.held, r);
    r = await page.evaluate(() => { const p = P(); p.invuln = 0; playP('30-3'); const q = P(); q.invuln = 0; place(97, 18); sim(0.2); runTo(124); sim(1.5); return { dead: q.dead || S().state !== 'play' }; });
    check('30-3: running the ridge over the varnish scrapes away what holds Brady up', r.dead, r);
    r = await page.evaluate(() => { playP('30-3'); place(140, 18); const a = AP.route([[150, 19], [160, 19]]); sim(2, { right: true }); return { a: a.ok, state: S().state }; });
    check('30-3: on to the gate', r.a && r.state !== 'play', r);
    await page.evaluate(() => { playP('30-3'); }); await pano('39-30-3-panorama.png', 0.35);
  });
};

// ---------------- 30-4 Hang It Crooked ----------------
LEVELS.hang = async (page, shot, run, pano) => {
  await run('hang', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('30-4'); place(4, 18); sim(0.6); freeze(); }); await shot('40-30-4-start.png');
    let r = await page.evaluate(() => { thaw(); return AP.route([[9, 17], [12, 14], [16, 14]]); });
    check('30-4: up onto the ledge under the low picture rail', r.ok, r);
    await shotAt(page, shot, '41-30-4-frame-teach.png', () => { AP.exec({ walkTo: 18 * 32 + 16, dir: 0 }, 2); sim(0.2); });
    r = await page.evaluate(() => { AP.exec({ walkTo: 24 * 32, dir: 0 }, 4); sim(0.6); return { at: tileOf(), edge: tileName(21, 14), old: tileName(17, 14) }; });
    check('30-4: walking on past the hook turns the frame over: its edge is under Brady and he walks on to the ledge', r.at[1] === 14 && r.at[0] >= 23 && r.edge === 'SEMI' && r.old === 'EMPTY', r);
    await shotAt(page, shot, '42-30-4-frame-turned.png', () => { AP.exec({ walkTo: 22 * 32, dir: 0 }, 2); sim(0.1); });
    r = await page.evaluate(() => { AP.exec({ walkTo: 16 * 32, dir: 0 }, 4); sim(0.6); return { at: tileOf(), back: tileName(17, 14) }; });
    check('30-4: walking back past it turns it back', r.back === 'SEMI', r);
    r = await page.evaluate(() => { AP.exec({ walkTo: 25 * 32, dir: 0 }, 5); sim(0.4); AP.exec({ walkTo: 44 * 32, dir: 0 }, 6); sim(0.6); return { at: tileOf() }; });
    check('30-4: two frames over the varnish, walked over one after the other', r.at[1] === 14 && r.at[0] >= 43, r);
    await shotAt(page, shot, '43-30-4-secret-tell.png', () => { AP.exec({ walkTo: 41 * 32, dir: 0 }, 2); sim(0.2); });
    r = await page.evaluate(() => { const a = AP.route([[44, 11], [54, 11]]); return a; });
    check('30-4: from the turned frame up through the gap in the rail to the run on top, to the paint store\'s hatch', r.ok, r);
    r = await page.evaluate(() => { playP('30-4'); place(60, 18); sim(0.3); AP.go([67, 19]); for (let k = 0; k < 120 && !(P().wash && P().wash.grip); k++) sim(1 / 60, { up: true }); const gripped = !!(P().wash && P().wash.grip); return { gripped }; });
    check('30-4: push UP into the picture-cord rack: Brady grips it', r.gripped, r);
    await shotAt(page, shot, '44-30-4-cord-rack.png', () => { sim(0.4, { up: true }); });
    r = await page.evaluate(() => { const p = P(); for (let k = 0; k < 120 * 6 && p.y > 7 * 32; k++) sim(1 / 120, { up: true, right: p.cx < 72 * 32 }); sim(1 / 120, { jump: true, jumpPressed: true, right: true }); sim(0.6, { jump: true, right: true }); sim(0.5); return { at: tileOf() }; });
    check('30-4: up the cords and off onto the high ledge', r.at[1] === 9, r);
    r = await page.evaluate(() => { playP('30-4'); place(90, 8); sim(0.3); AP.exec({ walkTo: 110 * 32, dir: 0 }, 8); sim(0.5); const a = AP.route([[120, 9], [140, 9]]); sim(3, { right: true }); return { a: a.ok, state: S().state }; });
    check('30-4: twist: two more frames up top, on to the gate', r.a && r.state !== 'play', r);
    await page.evaluate(() => { playP('30-4'); }); await pano('49-30-4-panorama.png', 0.35);
  });
};

// ---------------- 30-5 Going Once ----------------
LEVELS.auction = async (page, shot, run, pano) => {
  await run('auction', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('30-5'); place(4, 18); sim(0.6); freeze(); }); await shot('50-30-5-start.png');
    let r = await page.evaluate(() => { thaw(); AP.go([9, 19]); sim(0.3); const w = S().galWallet; AP.go([13, 19]); sim(0.2); return { w }; });
    check('30-5: the paddle gives three buttons', r.w === 3, r);
    await shotAt(page, shot, '51-30-5-podium.png', () => { sim(0.2); });
    r = await page.evaluate(() => { throwN(1); return { w: S().galWallet, step: tileName(18, 16) }; });
    check('30-5: THROW at the podium: sold for two, the frame becomes the missing step', r.w === 1 && r.step === 'HARD', r);
    r = await page.evaluate(() => { throwN(1); const a = { w: S().galWallet, step: tileName(18, 16) }; throwN(1); return { a, w: S().galWallet }; });
    check('30-5: THROW again at a sold podium: returned for a refund (and bought back)', r.a.w === 3 && r.a.step === 'EMPTY' && r.w === 1, r);
    r = await page.evaluate(() => AP.route([[18, 16], [21, 13], [30, 13], [36, 13], [40, 19]]));
    check('30-5: up the step to the wall top and down to the next lot', r.ok, r);
    r = await page.evaluate(() => { AP.go([41, 19]); AP.go([44, 19]); throwN(1); AP.go([47, 19]); throwN(1); const w = S().galWallet; const a = AP.route([[50, 16], [52, 13], [56, 10], [64, 10]]); return { w, a: a.ok }; });
    check('30-5: four buttons: one and three, the two-step stair up the tall wall', r.w === 0 && r.a, r);
    await shotAt(page, shot, '52-30-5-secret-tell.png', () => { AP.go([67, 10]); sim(0.3); });
    r = await page.evaluate(() => { const a = AP.route([[70, 14], [75, 14]]); return { ok: a.ok, at: tileOf() }; });
    check('30-5: down the gap in the top floor by the pale patch to the press\'s door', r.ok, r);
    r = await page.evaluate(() => { playP('30-5'); place(84, 18); sim(0.3); AP.go([88, 19]); AP.go([92, 19]); throwN(1); const decoy = S().galWallet; AP.go([98, 19]); throwN(1); const broke = { w: S().galWallet, step: tileName(105, 16) }; return { decoy, broke }; });
    check('30-5: twist: buying the handsome decoy leaves too few buttons for the wide lot', r.decoy === 2 && r.broke.w === 2 && r.broke.step === 'EMPTY', r);
    await shotAt(page, shot, '53-30-5-decoy-sold.png', () => { sim(0.1); });
    r = await page.evaluate(() => { AP.go([92, 19]); throwN(1); AP.go([98, 19]); throwN(1); const w = S().galWallet; const a = AP.route([[105, 16], [107, 13], [112, 10], [125, 10], [140, 10], [150, 10]]); sim(3, { right: true }); return { w, a: a.ok, state: S().state }; });
    check('30-5: twist: the decoy returned, the wide frame bought: hung sideways it fills both steps; on to the gate', r.w === 1 && r.a && r.state !== 'play', r);
    await page.evaluate(() => { playP('30-5'); }); await pano('59-30-5-panorama.png', 0.35);
  });
};

// ---------------- 30-6 The Good Side: the sittings, the corridor's canvas, the studio's door ----------------
LEVELS.salon = async (page, shot, run, pano) => {
  await run('salon', async () => {
    await page.evaluate(helpers);
    await page.evaluate(() => { fresh(); playP('30-6'); place(4, 18); sim(0.6); freeze(); }); await shot('80-30-6-start.png');
    let r = await page.evaluate(() => { thaw(); const a = rollTo('GalSitting', 14, 1.6); return { a, rope: tileName(24, 17) }; });
    check('30-6: the sight line misses the card: the rope stays', !r.a.done && r.rope === 'HARD', r);
    r = await page.evaluate(() => { const a = rollTo('GalSitting', 18, 1.8); return { a, rope: tileName(24, 17) }; });
    check('30-6: the posing mark rolled into his sight line: it catches the card; a breath later the rope lifts', r.a.done && r.rope === 'EMPTY', r);
    await shotAt(page, shot, '81-30-6-sitting.png', () => { sim(0.1); });
    r = await page.evaluate(() => { AP.go([30, 19]); const a = rollTo('GalSitting', 36, 1.8); return { a, rope: tileName(50, 17) }; });
    check('30-6: the second sitting: the mark rolled back the other way', r.a.done && r.rope === 'EMPTY', r);
    await shotAt(page, shot, '82-30-6-secret-tell.png', () => { AP.go([61, 19]); sim(0.3); });
    r = await page.evaluate(() => { const a = AP.go([66, 19]); return { ok: a.ok }; });
    check('30-6: the pillar\'s foot by the pale patch is canvas: through to the private collection (before the boss)', r.ok, r);
    r = await page.evaluate(() => { place(88, 18); sim(0.2); sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 300 && S().area.aid !== 'studio'; k++) sim(1 / 60); sim(1, { right: true }); for (let k = 0; k < 120 * 8 && !(S().boss && S().boss.state === 'fight' && S().boss.act === 'raise'); k++) sim(1 / 120); sim(0.6); freeze(); return { area: S().area.aid }; });
    await shot('83-30-6-boss-studio.png'); await page.evaluate(() => thaw());
    check('30-6: the studio door leads into the Retoucher\'s arena', r.area === 'studio', r);
    await page.evaluate(() => { playP('30-6'); }); await pano('89-30-6-panorama.png', 0.35);
  });
};

// ---------------- the six secret rooms: each entered, played (a miss, then the win) with the buttons, and left ----------------
const ROOMS = [['30-1', 'loft', 'hall', 'loftOut'], ['30-2', 'framer', 'long', 'framerOut'], ['30-3', 'cloak', 'studio', 'cloakOut'], ['30-4', 'paint', 'hang', 'paintOut'], ['30-5', 'print', 'auction', 'printOut'], ['30-6', 'corridor', 'salon', 'corridorOut']];
LEVELS.rooms = async (page, shot, run) => {
  let n = 0;
  for (const [id, aid, main, out] of ROOMS) {
    n++;
    await run('rooms', async () => {
      await page.evaluate(helpers);
      await page.evaluate(([id, aid]) => { fresh(); playP(id); toArea(aid); sim(0.7); freeze(); }, [id, aid]); await shot(`6${n}-room-${id}-${aid}-entry.png`);
      await page.evaluate(() => { thaw(); sim(2.6); freeze(); }); await shot(`6${n}-room-${id}-${aid}-rule.png`);
      const r = await page.evaluate(() => { thaw(); return { kind: S().area.roomKit.kind }; });
      const w = await page.evaluate(() => { const g = S(), A = g.area, R = A.roomState, kit = A.roomKit, K = window.__roomKinds[kit.kind]; let pills = 0; const frame = (g2, keys) => { const before = ents('GalPill').length; sim(1 / 120, keys); if (ents('GalPill').length > before) pills++; }; K.testWin(g, A, R, kit, frame); sim(0.6); const cage = g.entities.find(e => e.constructor.name === 'TourRoomCage'); return { won: R.won, pills, cage: cage ? cage.tiles.every(([x, y]) => tileName(x, y) === 'EMPTY') : null }; });
      check(`room ${id} ${aid} (${r.kind}): a miss (a pill says so, the turn resets), then won with the buttons; the cage opens`, w.won && w.pills >= 1 && w.cage !== false, w);
      await page.evaluate(() => freeze()); await shot(`6${n}-room-${id}-${aid}-won.png`);
      const o = await page.evaluate(([main, out]) => { thaw(); toDoor(); sim(0.1, { up: true, upPressed: true }); for (let k = 0; k < 300 && S().area.aid !== main; k++) sim(1 / 60); sim(0.5); const g = S(), an = g.area.anchors[out]; return { area: g.area.aid, x: Math.floor(P().cx / 32), ax: an ? Math.floor(an.x / 32) : null }; }, [main, out]);
      check(`room ${id} ${aid}: the way out leads on, further along the stage (not back to the entrance)`, o.area === main && o.ax != null && Math.abs(o.x - o.ax) <= 2, o);
    });
  }
};
const openGal = `(() => { fresh(); const B = window.BRADY, T = window.BRADY_TOUR; B.Save.data.seenEncoreIntro = true; const Tp = T.TourProgress, D = Tp.data(); D.seen.it = true; try { Tp.exit('14-1', 'gal'); Tp.exit('30-1', 'main'); Tp.exit('30-2', 'main'); } catch (e) {} for (const id of ['30-1', '30-2']) B.Save.data.done[id] = true; D.pending = []; D.seen.gal = true; })()`;
LEVELS.map = async (page, shot, run) => {
  await run('map', async () => {
    const r = await page.evaluate(o => { eval(o); window.BRADY.goToMap('world', 30, '30-2'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { mode: s.mode, cc: s.ow && s.ow.cc }; }, openGal);
    check('the gallery has its own walkable map', r.cc === 'gal', r);
    await page.evaluate(() => freeze()); await shot('70-gal-overworld-map.png');
    const r2 = await page.evaluate(() => { thaw(); const s = S(); if (s.openRoute) s.openRoute({ dest: 'gal' }); for (let k = 0; k < 30; k++) sim(0.25); s.dest = 'gal'; sim(0.8); return { mode: s.mode }; });
    await page.evaluate(() => freeze()); await shot('71-route-map-gal-pin.png');
    check('the route map opens on the gallery\'s pin', !!r2.mode, r2);
  });
};

// ---------------- the hidden entrance: Italy 14-1, the piazza before the finish ----------------
LEVELS.entry = async (page, shot, run, pano) => {
  await run('entry', async () => {
    await page.evaluate(helpers);
    let r = await page.evaluate(() => { fresh(); const T = window.BRADY_TOUR; return { stop: T.TourMap ? T.TourMap.stopState(T.Tour.stops.gal) : null, open: T.TourProgress.countryUnlocked(T.Tour.countries.gal) }; });
    check('entrance: on a fresh save the gallery is hidden (no pin, not open)', r.stop === 'hidden' && !r.open, r);
    // ride the scooter in from before the last oil spill (no input: it cruises), as a player does
    r = await page.evaluate(() => {
      playP('14-1'); P().invuln = 999; const g = S(), gate = g.entities.find(e => e.constructor.name === 'GalFountainGate'), oil = g.entities.filter(e => e.constructor.name === 'ItOil' && e.x < gate.x).sort((a, b) => b.x - a.x)[0];
      const x0 = Math.floor(oil.x / 32) - 6; let y = 0; const A = g.area, SOL = window.BRADY.SOLID; for (y = 2; y < A.H; y++) if (SOL[A.tiles[y * A.W + x0]]) break; place(x0, y - 1); sim(0.3);
      window.__gate = gate; return { gate: Math.floor(gate.cx / 32), row: gate.row, start: x0 };
    });
    const gx = r.gate;
    r = await page.evaluate(() => { const gate = window.__gate, p = P(); const A = S().area, SOL = window.BRADY.SOLID; let hold = 0; for (let k = 0; k < 120 * 12 && gate.cx - p.cx > 6 * 32; k++) { const ahead = Math.floor((p.cx + 16) / 32), gap = p.onGround && !SOL[A.tiles[p.groundTy * A.W + ahead]] && A.tiles[p.groundTy * A.W + ahead] !== window.BRADY.T.SEMI; if (gap && hold <= 0) { sim(1 / 120, { jump: true, jumpPressed: true, right: true }); hold = 0.6; } else { sim(1 / 120, hold > 0 ? { jump: true, right: true } : {}); hold -= 1 / 120; } } return { at: tileOf(), dead: p.dead }; });
    check('entrance: across the last oil spill and its trench into the piazza on the scooter', !r.dead && r.at[1] === (await page.evaluate(() => window.__gate.row)), r);
    await page.evaluate(() => { freeze(); }); await shot('01-entrance-14-1-piazza.png');
    // brake to a stop over the reflected frame
    r = await page.evaluate(() => { thaw(); const gate = window.__gate, p = P(); for (let k = 0; k < 120 * 6; k++) { const d = gate.cx - p.cx; if (Math.abs(d) < 10 && Math.abs(p.vx) < 5) break; const brake = d < p.vx * p.vx / (2 * 48 * 32) + 8; sim(1 / 120, d < -10 ? { left: true } : brake ? { down: true } : {}); } for (let k = 0; k < 30; k++) sim(1 / 120, { down: true }); return { off: Math.round(P().cx - gate.cx), vx: Math.round(P().vx) }; });
    check('entrance: braked to a stop over the reflected frame', Math.abs(r.off) < 22, r);
    await page.evaluate(() => { sim(1 / 120, { down: true }); freeze(); }); await shot('02-entrance-before-the-reflection.png');
    // walking past, or jumping without UP, does nothing; UP alone does nothing
    r = await page.evaluate(() => { thaw(); sim(1 / 120, { down: true, jump: true, jumpPressed: true }); sim(0.6, { down: true }); const a = S().state === 'play' && P().state === 'play'; sim(0.6, { up: true }); const b = S().state === 'play' && P().state === 'play'; return { a, b, off: Math.round(P().cx - window.__gate.cx) }; });
    check('entrance: a plain hop or pushing UP alone does nothing (no accident)', r.a && r.b, r);
    r = await page.evaluate(() => { sim(0.35, { up: true }); const g = window.__gate, p = P(); const dbg = { upT: g.upT, at: g.at(p), gty: p.groundTy, row: g.row, up: p.inp && p.inp.up, on: p.onGround, vx: p.vx, cx: p.cx - g.cx, ps: p.state }; sim(1 / 120, { up: true, jump: true, jumpPressed: true }); sim(0.1, { up: true, jump: true }); return { state: P().state, dbg }; });
    check('entrance: push UP against the reflected frame, then JUMP: Brady dives into the reflection', r.state === 'portal', r);
    await page.evaluate(() => { sim(0.5); freeze(); }); await shot('03-entrance-diving-in.png');
    r = await page.evaluate(() => { thaw(); sim(1.8); const g = S(); return { state: g.state, key: g.exitKey, banner: g.bannerText }; });
    check('entrance: the land\'s name shows and 14-1 clears through its hidden exit', r.state !== 'play' && r.key === 'gal', r);
    r = await page.evaluate(() => { const T = window.BRADY_TOUR, d = window.BRADY.Save.data; return { land: !!T.TourProgress.data().lands.gal, open: T.TourProgress.countryUnlocked(T.Tour.countries.gal), first: !!d.unlocked['30-1'], done: !!d.done['14-1'] }; });
    check('entrance: the gallery is open, 30-1 unlocked; 14-1 itself is not marked done by the secret way', r.land && r.open && r.first && !r.done, r);
    r = await page.evaluate(() => { const T = window.BRADY_TOUR.TourProgress.data(); T.seen.it = true; window.BRADY.goToMap('world', 14, '14-1'); const out = []; for (let k = 0; k < 40; k++) { sim(0.1); const s = S(); if (s.card) s.card = null; out.push(s.mode + (s.rReveal ? ':' + s.rReveal.r.kind : '')); if (s.rReveal && s.rReveal.r.kind === 'land' && s.rReveal.t > 0.6) break; } return { seq: [...new Set(out)] }; });
    await page.evaluate(() => freeze()); await shot('04-entrance-arrival-new-land.png'); await page.evaluate(() => thaw());
    check('entrance: back on the map the route map plays the NEW LAND reveal', r.seq.some(q => /land/.test(q)), r);
    r = await page.evaluate(() => { for (let k = 0; k < 60; k++) { const s = S(); if (s.card) s.card = null; sim(0.25); if (s.mode === 'land' && s.ow && s.ow.cc === 'gal') break; } const s = S(); return { mode: s.mode, cc: s.ow && s.ow.cc }; });
    check('entrance: the route map reveals the new land and flies Brady to the gallery\'s own map', r.cc === 'gal', r);
    await page.evaluate(() => { sim(1.5); freeze(); }); await shot('05-entrance-arrival-gallery-map.png'); await page.evaluate(() => thaw());
  });
};

(async () => {
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => {
    for (const k of Object.keys(LEVELS).filter(k => k !== 'entry' && k !== 'map' && k !== 'bot').concat(['entry', 'map', 'bot'])) if (LEVELS[k]) await LEVELS[k](page, shot, run, pano);
  });
  if (!want.length || want.includes('portrait')) await session({ width: 390, height: 844 }, async (page, shot, run) => {
    await run('portrait', async () => {
      await page.evaluate(helpers);
      await page.evaluate(() => { fresh(); playP('30-1'); place(12, 18); sim(0.4); freeze(); }); await shot('90-portrait-30-1.png');
      await page.evaluate(() => { thaw(); playP('30-6'); toArea('studio', 6, 15); sim(1, { right: true }); for (let k = 0; k < 120 * 8 && !(S().boss && S().boss.state === 'fight' && S().boss.act === 'raise'); k++) sim(1 / 120); sim(0.6); freeze(); }); await shot('91-portrait-30-6-boss.png');
      await page.evaluate(o => { thaw(); eval(o); window.BRADY.goToMap('world', 30, '30-2'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } freeze(); }, openGal); await shot('92-portrait-gal-map.png');
    });
  });
  console.log(failures ? `${failures} GAL CHECK(S) FAILED` : 'ALL GAL CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
