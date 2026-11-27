// Table for Two (world 36, a hidden land): in-browser checks and phone-size screenshots.
// Each stage's own mechanic is PLAYED with real inputs through the game loop (the autopilot below is the Moon's:
// it plans each hop with the game's own physics on a copy of Brady's body, then feeds those inputs to the real game
// frame by frame), and the land's own moves (spinning a plate until its chip drops Brady, folding a napkin, pulling
// the tablecloth, paddling a crouton, passing the bread plate) are played with the stick and the buttons too.
// Shots: 844x390 landscape of every stage, every room on entry, the entrance before and after, the boss, the map;
// 390x844 portrait of 36-1, the boss and the map; a panorama of every stage.
// usage: BRADY_DIST=<dist> node tools/sbw_table_shots.js <outdir> [--checks] [name ...]   (--checks: no pictures)
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'table-shots'), checksOnly = args.includes('--checks');
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
      // drifting junk is where it will be by then (its path is a clock): a plan that meets it is no plan
      bad(b, A, t) {
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
          if (landT != null) { inp.left = inp.right = false; inp.jump = inp.jumpPressed = false; inp.down = false; }
          // the player's own drop-through (11_player.js): down + jump on a one-way floor
          if (inp.down && inp.jumpPressed && b.onGround && b.groundTile === window.BRADY.T.SEMI) { b.dropT = 0.22; b.y += 2; b.onGround = false; inp.jumpPressed = false; }
          window.BRADY_TABLE.phys(b, inp, A, dt, null, {});
          if (AP.after) AP.after(b, inp, A, dt);
          t += dt;
          if (b.y > A.H * 32 + 20 || window.BRADY_TABLE.lavaContact(b, A) || window.BRADY_TABLE.spikeContact(b, A)) return null;
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

const LEVELS = {};
// the land's own moves, played with the stick and the buttons through the real loop
const tableInit = () => {
  const K = () => window.BRADY_TABLE.kit;
  window.TB = {
    plates: () => ents('tabPlate').sort((a, b) => a.x - b.x),
    // walk on the plate under Brady, toward x (tiles) and back, until its chip drops him; returns where he landed
    chipDrop(xa, xb, maxT) {
      const p = P(), g = S(), row0 = p.groundTy; let t = 0, dir = p.cx / 32 < (xa + xb) / 2 ? 1 : -1, phase = 0;
      while (t < (maxT || 14)) {
        if (p.dead || g.state !== 'play') return { dead: true };
        const tx = p.cx / 32;
        // a few steps one way (the plate spins up), then stand and let the chip come round
        let hold = 0;
        if (phase === 0) { if ((dir > 0 && tx < xb) || (dir < 0 && tx > xa)) hold = dir; else { phase = 1; dir = -dir; } }
        else if (t % 5 > 4.2) phase = 0;
        sim(1 / 30, { left: hold < 0, right: hold > 0 }); t += 1 / 30;
        if (!p.onGround && p.vy > 0 && p.y + p.h > (row0 + 0.4) * 32) { for (let k = 0; k < 120 && !p.onGround; k++) sim(1 / 60); sim(0.3); return { row: p.groundTy, x: Math.floor(p.cx / 32), t: +t.toFixed(1) }; }
      }
      return { timeout: true, x: Math.floor(p.cx / 32), row: p.groundTy };
    },
    // stand at the junction of a meshed pair and step through when both bites meet (pacing back to spin the plates)
    // walk right across a plate to tile x, hopping its chip when it comes at him
    walkOver(pl, toX, maxT) {
      const p = P(), g = S(); let t = 0;
      while (t < (maxT || 8) && p.cx / 32 < toX) {
        if (p.dead || g.state !== 'play') return { dead: true };
        const ahead = pl.holes.some(c => { const d = (c + 0.5) * 32 - p.cx; return d > -20 && d < 80; });
        if (ahead && p.onGround) { sim(1 / 120, { right: true, jump: true, jumpPressed: true }); sim(0.35, { right: true, jump: true }); t += 0.35; continue; }
        sim(1 / 60, { right: true }); t += 1 / 60;
      }
      for (let k = 0; k < 60 && !p.onGround; k++) sim(1 / 60);
      return { ok: p.cx / 32 >= toX && !p.dead, x: Math.floor(p.cx / 32), row: p.groundTy };
    },
    meshCross(lead, maxT) {
      const p = P(), g = S(), jx = (lead.x + lead.w - 32) / 32 - 0.4; let t = 0;
      while (t < (maxT || 24)) {
        if (p.dead || g.state !== 'play') return { dead: true };
        if (lead.rimOpen.r && p.cx / 32 > jx - 1.2) { sim(0.7, { right: true }); if (p.cx > lead.x + lead.w + 8) return { ok: true, x: Math.floor(p.cx / 32), t: +t.toFixed(1) }; }
        // the chip on his own plate's front edge coming at him: hop it
        const hole = lead.holes.length ? (lead.holes[0] + 1) * 32 : null;
        if (hole != null && Math.abs(hole - p.cx) < 70 && p.onGround) { sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.3, { jump: true }); t += 0.3; continue; }
        // the plates have run down: back three steps, then run at the rim to spin them up; then wait there
        if (Math.abs(lead.vs) < 0.6) { AP.exec({ walkTo: (jx - 3) * 32, dir: 0 }, 2); sim(0.6, { right: true }); t += 1.5; continue; }
        sim(0.1); t += 0.1;
      }
      return { timeout: true, u: lead.u };
    }
  };
};

// ---------------- 36-1 Mind the Good China ----------------
LEVELS.china = async (page, shot, run, pano) => {
  await run('china', async () => {
    await page.evaluate(() => { fresh(); play('36-1'); place(3, 9); sim(0.6); freeze(); });
    await shot('10-36-1-start.png');
    // the plate turns while Brady walks on it and coasts to a stop after
    const r = await page.evaluate(() => {
      thaw(); play('36-1'); place(12, 9); sim(0.3); const pl = TB.plates()[0], u0 = pl.u;
      sim(0.5, { right: true }); const u1 = pl.u, vs1 = pl.vs; sim(6); const vs2 = pl.vs;
      return { turned: +(u1 - u0).toFixed(2), vs1: +vs1.toFixed(2), stopped: Math.abs(vs2) < 0.05 };
    });
    check('36-1: walking right on a plate turns it (the chip slides back toward him), and it coasts to a stop', r.turned !== 0 && r.vs1 < 0 && r.stopped, r);
    // the teach: walk the first plate until the chip drops Brady into the passage under the teapot
    const a = await page.evaluate(() => { play('36-1'); place(3, 9); sim(0.3); const r1 = AP.go([12, 10]); if (!r1.ok) return { r1 }; return TB.chipDrop(11, 16); });
    check('36-1: played: onto the first plate, walking it round until its chip drops Brady into the passage under the teapot', a.row === 14 && a.x >= 10 && a.x <= 17, a);
    await page.evaluate(() => freeze()); await shot('11-36-1-dropped-through-the-chip.png'); await page.evaluate(() => thaw());
    const b = await page.evaluate(() => AP.route([[24, 14], [31, 14], [44, 14], [52, 14]]));
    check('36-1: played: under the teapot, over the plate on the dip, to the first checkpoint', b.ok, b);
    // the test: up to the high shelf, the chip of plate 3 drops Brady onto plate 4 (not the pit), plate 4's down
    const c = await page.evaluate(() => { const r1 = AP.route([[57, 11], [61, 8], [68, 8]]); if (!r1.ok) return { r1 }; const d1 = TB.chipDrop(66, 70); if (d1.row !== 12) return { d1 }; const d2 = TB.chipDrop(66, 70); return { d1, d2 }; });
    check("36-1: played: plate 3's chip drops Brady onto plate 4, plate 4's down to the bread-basket passage", c.d1 && c.d1.row === 12 && c.d2 && c.d2.row === 16, c);
    await page.evaluate(() => freeze()); await shot('12-36-1-under-the-bread-basket.png'); await page.evaluate(() => thaw());
    const d = await page.evaluate(() => AP.route([[80, 16], [88, 16], [96, 14], [101, 14], [112, 14], [120, 14]]));
    check('36-1: played: the passage, the second checkpoint, across the steaming plate, to the meshed plates', d.ok, d);
    await page.evaluate(() => freeze()); await shot('13-36-1-meshed-plates.png'); await page.evaluate(() => thaw());
    const e = await page.evaluate(() => { const pl = TB.plates().find(q => q.mesh === 'm1' && q.lead); const r1 = AP.go([126, 14]); if (!r1.ok) return { r1 }; return TB.meshCross(pl); });
    check('36-1: played: at the meshed rims, spinning the plates until both bites meet, then through', e.ok, e);
    await page.evaluate(() => freeze()); await shot('14-36-1-through-the-bites.png'); await page.evaluate(() => thaw());
    const f = await page.evaluate(() => { const r1 = AP.route([[137, 14], [141, 14]]); if (!r1.ok) return { r1 }; const pl = TB.plates().find(q => q.mesh === 'm2' && q.lead); const r2 = AP.go([144, 14]); if (!r2.ok) return { r2 }; const m = TB.meshCross(pl); if (!m.ok) return m; return TB.walkOver(TB.plates().find(q => q.mesh === 'm2' && !q.lead), 153); });
    check('36-1: played: the meshed plates over the pit (hopping the chip under his own feet)', f.ok, f);
    const gte = await page.evaluate(() => { const r1 = AP.route([[160, 14], [178, 14]]); if (!r1.ok) return r1; sim(3, { right: true }); return { state: S().state, key: S().exitKey }; });
    check('36-1: played to the gate: the main exit', gte.state !== 'play' && gte.key === 'main', gte);
    await page.evaluate(() => { play('36-1'); sim(0.3); }); await pano('19-36-1-panorama.png', 0.35);
  });
};



// ---------------- the hidden entrance: Spain 6-1, the café after the third plaza ----------------
LEVELS.entry = async (page, shot, run) => {
  await run('entry', async () => {
    const r0 = await page.evaluate(() => {
      fresh(); const T = window.BRADY_TOUR; window.BRADY.Save.data.unlocked['6-1'] = true;
      const hiddenBefore = T.TourProgress.countryUnlocked(T.Tour.countries.table);
      play('6-1'); const d = ents('tabShadowDoor')[0]; const ax0 = d.ax0, ay = d.ay;
      place(ax0 - 6, ay + 3); sim(0.5); P().invuln = 999;
      return { hiddenBefore, ax0, ay, sx0: d.sx0, exits: Object.keys(T.Tour.specOf('6-1').exits) };
    });
    check('entry: the land is hidden before its entrance is used; 6-1 has its new exit', !r0.hiddenBefore && r0.exits.includes('table') && r0.exits.includes('main') && r0.exits.includes('secret'), r0);
    await page.evaluate(() => { const g = S(); g.camX = Math.max(0, P().cx - 120); freeze(); });
    await shot('00-entrance-before-the-cafe.png');
    // walking past the reserved table (over its shadow) does nothing
    const r1 = await page.evaluate(([ax0, ay]) => { thaw(); P().invuln = 999; AP.exec({ walkTo: (ax0 + 9) * 32, dir: 0 }, 4); sim(1); return { state: S().state, x: Math.floor(P().cx / 32) }; }, [r0.ax0, r0.ay]);
    check('entry: walking over the shadow does nothing', r1.state === 'play', r1);
    // the real way: onto the flower box, up onto the awning, walk off its end and drop through the shadow
    const r2 = await page.evaluate(([ax0, ay]) => {
      play('6-1'); place(ax0 - 6, ay + 3); sim(0.4); P().invuln = 999;
      const a = AP.route([[ax0 - 2, ay + 2], [ax0 + 2, ay]]); if (!a.ok) return { a };
      const g = S(), p = P(); let t = 0; while (t < 2 && g.state === 'play' && !(p.stunT > 0)) { sim(1 / 60, { right: true }); t += 1 / 60; }
      sim(0.6); return { arriving: p.stunT > 0, banner: g.bannerText };
    }, [r0.ax0, r0.ay]);
    check('entry: played: up the flower box onto the awning, off its end through the shadow: Brady slips through', r2.arriving && r2.banner === 'TABLE FOR TWO', r2);
    await page.evaluate(() => freeze()); await shot('01-entrance-arrival.png');
    const r3 = await page.evaluate(() => { thaw(); for (let k = 0; k < 40 && S().state === 'play'; k++) sim(0.1); const T = window.BRADY_TOUR; return { state: S().state, key: S().exitKey, open: T.TourProgress.countryUnlocked(T.Tour.countries.table), first: T.TourProgress.isUnlocked('36-1'), lands: !!T.TourProgress.data().lands.table }; });
    check('entry: the level clears through the table exit and the land opens (36-1 can be entered)', r3.key === 'table' && r3.open && r3.first && r3.lands, r3);
    await page.evaluate(() => { sim(1.2); freeze(); }); await shot('02-entrance-cleared.png');
  });
};

LEVELS.dbg = async (page, shot, run) => {
  await run('dbg', async () => {
    const r = await page.evaluate(() => {
      fresh(); window.BRADY.Save.data.unlocked['6-1'] = true; play('6-1'); const d = ents('tabShadowDoor')[0]; const ax0 = d.ax0, ay = d.ay;
      place(ax0 - 6, ay + 3); sim(0.4); P().invuln = 999;
      const a = AP.route([[ax0 - 2, ay + 2], [ax0 + 2, ay]]); const out = [JSON.stringify(a), 'fy=' + d.fy + ' sx=' + d.sx0 + '-' + d.sx1];
      const g = S(), p = P(); for (let k = 0; k < 40; k++) { sim(1 / 30, { right: true }); out.push([+(p.cx / 32).toFixed(1), p.groundTy, p.onGround ? 1 : 0, +(g.t - d.awnT).toFixed(2), d.arr].join(',')); }
      return out;
    });
    console.log(r.join(' | '));
  });
};

(async () => {
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => {
    await page.evaluate(tableInit);
    for (const k in LEVELS) await LEVELS[k](page, shot, run, pano);
  });
  if (!want.length || want.some(w => w.startsWith('p-'))) await session({ width: 390, height: 844 }, async (page, shot, run) => {
    await page.evaluate(tableInit);
    await run('p-china', async () => { await page.evaluate(() => { fresh(); play('36-1'); place(24, 13); sim(0.4); freeze(); }); await shot('90-portrait-36-1.png'); });
  });
  console.log(failures ? `${failures} TABLE CHECK(S) FAILED` : 'ALL TABLE CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
