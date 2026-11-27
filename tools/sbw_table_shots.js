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
          window.BRADY_TABLE.phys(b, inp, A, dt, S().platforms, {}); if (b.ride && b.onGround) b.groundTy = Math.round((b.y + b.h) / 32);
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
    // the tablecloth: stand on the corner tab, press and hold THROW, run `dir` until `paces` tiles, let go
    pull(cl, paces, dir) {
      const p = P(), x0 = p.cx; let t = 0;
      sim(1 / 120, { action: true, actionPressed: true });
      const held = cl.held;
      while (t < 3 && Math.abs(p.cx - x0) / 32 < paces) { sim(1 / 120, { action: true, left: dir < 0, right: dir > 0 }); t += 1 / 120; if (!cl.held) break; }
      sim(1 / 120, {}); sim(0.4);
      return { held, state: cl.state, d: +(Math.abs(p.cx - x0) / 32).toFixed(1) };
    },
    // ride a crouton: stand on the crust that paddles toward tile x (left crust for right), hop the bubbles' pops
    paddle(rf, toX, maxT) {
      const p = P(), g = S(); let t = 0;
      while (t < (maxT || 14)) {
        if (p.dead || g.state !== 'play') return { dead: true };
        const goal = toX * 32, dir = rf.x + rf.w / 2 < goal - 8 ? 1 : rf.x + rf.w / 2 > goal + 8 ? -1 : 0;
        if (!dir) break;
        const want = dir > 0 ? rf.x + rf.w * 0.17 : rf.x + rf.w * 0.83;
        const inp = { left: p.cx > want + 6, right: p.cx < want - 6 };
        // a bubble about to pop where the raft is going: stand still in the middle and wait it out
        const danger = ents('tabBubble').some(b => b.st() !== 'rest' && Math.abs(b.cx - (rf.x + rf.w / 2 + dir * 40)) < 60);
        if (danger) { inp.left = p.cx > rf.x + rf.w / 2 + 6; inp.right = p.cx < rf.x + rf.w / 2 - 6; }
        sim(1 / 60, inp); t += 1 / 60;
      }
      sim(0.3);
      return { ok: !p.dead, x: +((rf.x + rf.w / 2) / 32).toFixed(1), t: +t.toFixed(1), cream: rf.cream };
    },
    // walk on a raft until Brady's centre is at fraction k of it (then stand still)
    onRaftAt(rf, k) { const p = P(); for (let i = 0; i < 160; i++) { const kk = (p.cx - rf.x) / rf.w; if (Math.abs(kk - k) < 0.08 && Math.abs(p.vx) < 20) break; if (Math.abs(kk - k) >= 0.08) sim(1 / 60, { left: kk > k, right: kk < k }); sim(1 / 30); } sim(0.2); return +((P().cx - rf.x) / rf.w).toFixed(2); },
    // press UP at a door; wait for the fade
    door() { const g = S(), a0 = g.area.aid; sim(1 / 120, { up: true, upPressed: true }); for (let k = 0; k < 40 && (g.area.aid === a0 || g.fade.a > 0.05); k++) sim(0.1); sim(0.4); return g.area.aid; },
    // in a table room: walk to a stage mark (tile x) and press THROW there
    markThrow(x) { const r = AP.go([x, 8]); sim(0.2); sim(1 / 120, { action: true, actionPressed: true }); sim(0.3); return r.ok; },
    room() { const A = S().area; return { aid: A.aid, kind: A.roomKit && A.roomKit.kind, R: A.roomState || {} }; },
    cageOpen() { return ents('TourRoomCage').every(c => c.open); },
    // a hop on the spot (to land on a crease)
    hop() { sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.12, { jump: true }); for (let k = 0; k < 120 && !P().onGround; k++) sim(1 / 60); sim(0.15); },
    // walk to tile x on this floor and hop onto it
    crease(x) { const r = AP.go([x, P().groundTy]); TB.hop(); return r.ok; },
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



// ---------------- 36-2 The Napkin Bird ----------------
LEVELS.napkin = async (page, shot, run, pano) => {
  await run('napkin', async () => {
    await page.evaluate(() => { fresh(); play('36-2'); place(5, 13); sim(0.6); freeze(); });
    await shot('20-36-2-start.png');
    const nap = id => `ents('tabNapkin').find(e => e.id === '${id}')`;
    // the teach: the sail is a wall; the square crease folds it flat and Brady walks over it
    const a = await page.evaluate(() => {
      thaw(); play('36-2'); place(3, 13); sim(0.3); const N = ents('tabNapkin').find(e => e.id === 'n1');
      const blocked = !AP.go([16, 14]).ok;
      const r1 = { ok: TB.crease(9) }; const form = N.form; const r2 = AP.route([[16, 14], [24, 14]]);
      return { blocked, form, ok: r1.ok && r2.ok, r2 };
    });
    check('36-2: played: the sail blocks the way; the SQUARE crease folds it flat and Brady walks over', a.blocked && a.form === 2 && a.ok, a);
    await page.evaluate(() => freeze()); await shot('21-36-2-folded-flat.png'); await page.evaluate(() => thaw());
    const b = await page.evaluate(() => { const r1 = { ok: TB.crease(29) }; const N = ents('tabNapkin').find(e => e.id === 'n2'); const f = N.form; const r2 = AP.route([[34, 11], [41, 8], [46, 8]]); return { f, ok: r1.ok && r2.ok, r2 }; });
    check('36-2: played: the SAIL crease stands N2 up; its tall edge is the step up the bread block', b.f === 0 && b.ok, b);
    await page.evaluate(() => freeze()); await shot('22-36-2-on-the-sail.png'); await page.evaluate(() => thaw());
    const c = await page.evaluate(() => { const r1 = AP.route([[50, 14]]); TB.crease(49); const N = ents('tabNapkin').find(e => e.id === 'n3'); const f = N.form; const r2 = AP.route([[55, 11], [64, 11], [70, 14]]); return { f, ok: r1.ok && r2.ok, r2 }; });
    check('36-2: played: the BIRD crease spreads N3\'s wings: the bridge over the gap round the sugar pedestal', c.f === 1 && c.ok, c);
    await page.evaluate(() => freeze()); await shot('23-36-2-bird-bridge.png'); await page.evaluate(() => thaw());
    const d = await page.evaluate(() => { const r1 = AP.route([[78, 14]]); TB.crease(80); const r2 = AP.route([[86, 11], [92, 8], [97, 14], [112, 14], [140, 14]]); return { ok: r1.ok && r2.ok, r1, r2 }; });
    check('36-2: played: N4 as a sail up the wall; on past the second and third checkpoints', d.ok, d);
    // the twist: the glass. Standing up it blocks the way under the rim; flat it lets Brady in, and rises under him
    const e = await page.evaluate(() => {
      const N = ents('tabNapkin').find(q => q.id === 'n5'); const blocked = N.form === 0 && !AP.go([153, 14]).ok;
      const r1 = { ok: TB.crease(144) }; const flat = N.form === 2;
      const p = P(); let t = 0; while (t < 3 && N.form !== 0) { sim(1 / 60, { right: true }); t += 1 / 60; }
      sim(0.6); const rose = N.form === 0, row = p.groundTy;
      const r2 = AP.route([[160, 9], [176, 9]]); sim(3, { right: true });
      return { blocked, flat, rose, row, r1: r1.ok, r2: r2.ok, state: S().state, key: S().exitKey };
    });
    check('36-2: played: the napkin under the glass blocks the way standing up; flat, Brady walks in under the rim', e.blocked && e.flat && e.r1, e);
    check('36-2: played: past its centre crease it rises to a sail and lifts Brady to the cliff; on to the gate', e.rose && e.row === 9 && e.r2 && e.state !== 'play' && e.key === 'main', e);
    await page.evaluate(() => { play('36-2'); place(149, 13); const N = ents('tabNapkin').find(q => q.id === 'n5'); N.setForm(2, true); sim(0.3); freeze(); }); await shot('24-36-2-under-the-glass.png');
    await page.evaluate(() => { thaw(); play('36-2'); sim(0.3); }); await pano('29-36-2-panorama.png', 0.35);
  });
};

// ---------------- 36-3 Tablecloth Service ----------------
LEVELS.cloth = async (page, shot, run, pano) => {
  await run('cloth', async () => {
    await page.evaluate(() => { fresh(); play('36-3'); place(7, 14); sim(0.6); freeze(); });
    await shot('30-36-3-start.png');
    const cls = () => ents('tabCloth').sort((a, b) => a.x - b.x);
    // too short a pull: the cloth slips back
    const a = await page.evaluate(() => { thaw(); play('36-3'); place(10, 14); sim(0.3); const C = ents('tabCloth').sort((a, b) => a.x - b.x)[0]; const r = TB.pull(C, 1.2, -1); return r; });
    check('36-3: a pull of one pace is too short: the cloth slips back (no mat)', a.held && a.state === 'on', a);
    // the teach: a proper pull, then down into the mat's hollow, and the cork mat springs Brady up to the first tier
    const b = await page.evaluate(() => {
      const C = ents('tabCloth').sort((a, b) => a.x - b.x)[0]; const r0 = AP.go([10, 15]); const r = TB.pull(C, 3.6, -1);
      const r2 = AP.route([[24, 9], [36, 9]]); return { r0: r0.ok, r, ok: r2.ok, r2 };
    });
    check('36-3: played: hold THROW on the corner, run three paces, let go: the cloth whips out, the mat springs Brady up', b.r.state !== 'on' && b.ok, b);
    await page.evaluate(() => { play('36-3'); place(8, 14); sim(0.2); const C = ents('tabCloth').sort((a, b) => a.x - b.x)[0]; AP.go([10, 15]); sim(1 / 120, { action: true, actionPressed: true }); sim(0.35, { action: true, left: true }); freeze(); });
    await shot('31-36-3-pulling.png');
    const c = await page.evaluate(() => {
      thaw(); play('36-3'); place(24, 8); sim(0.2); const r1 = AP.route([[38, 9], [42, 15], [44, 15]]); if (!r1.ok) return { r1 };
      const C = ents('tabCloth').sort((a, b) => a.x - b.x)[1]; const r = TB.pull(C, 3.4, -1); const r2 = AP.route([[54, 9]]); return { r, ok: r2.ok, r2 };
    });
    check('36-3: played: down off the first tier, the second table, up to the second tier', c.ok && c.r.state !== 'on', c);
    const d = await page.evaluate(() => {
      const r1 = AP.route([[58, 9]]); if (!r1.ok) return { r1 }; const C = ents('tabCloth').sort((a, b) => a.x - b.x)[2]; const r = TB.pull(C, 3.4, -1);
      const r2 = AP.route([[67, 4], [86, 4], [95, 9], [104, 15], [118, 15]]); return { r, ok: r2.ok, r2 };
    });
    check('36-3: played: the table on the tier, up to the high tier, down to the last table', d.ok && d.r.state !== 'on', d);
    await page.evaluate(() => freeze()); await shot('32-36-3-the-last-table.png'); await page.evaluate(() => thaw());
    // the twist: hold on too long and the tall glass topples (the cloth snaps back); a short, clean pull works
    const e = await page.evaluate(() => {
      const C = ents('tabCloth').sort((a, b) => a.x - b.x)[3]; const long = TB.pull(C, 7, -1); const tipped = C.tipT > 0 || long.state === 'on';
      AP.go([118, 15]); sim(1.5); const ok = TB.pull(C, 3.6, -1); const r2 = AP.route([[132, 9], [150, 9]]); sim(3, { right: true });
      return { long, tipped, ok, r2: r2.ok, state: S().state, key: S().exitKey };
    });
    check('36-3: played: a long slow pull topples the tall glass and the cloth snaps back', e.tipped && e.long.state === 'on', e);
    check('36-3: played: a short, clean pull at the last table, up and on to the gate', e.ok.state !== 'on' && e.r2 && e.state !== 'play' && e.key === 'main', e);
    await page.evaluate(() => { play('36-3'); sim(0.3); }); await pano('39-36-3-panorama.png', 0.35);
  });
};

// ---------------- 36-4 Soup Without the Spoon ----------------
LEVELS.soup = async (page, shot, run, pano) => {
  await run('soup', async () => {
    await page.evaluate(() => { fresh(); play('36-4'); place(6, 11); sim(0.6); freeze(); });
    await shot('40-36-4-start.png');
    const rafts = () => ents('tabRaft').sort((a, b) => a.x0 - b.x0);
    const a = await page.evaluate(() => {
      thaw(); play('36-4'); place(6, 11); sim(0.3); const R = ents('tabRaft').sort((a, b) => a.x0 - b.x0);
      const r0 = AP.go([11, 12]); const onRaft = P().ride === R[0];
      // the left crust paddles it right
      const x0 = R[0].x; TB.onRaftAt(R[0], 0.2); sim(1.0); const moved = R[0].x - x0;
      const pd = TB.paddle(R[0], 24); const r1 = AP.route([[28, 12], [34, 12]]);
      return { onRaft, moved: Math.round(moved), pd, ok: r0.ok && r1.ok, r1 };
    });
    check('36-4: played: onto the crouton; on its left crust it paddles right across the broth to the next bank', a.onRaft && a.moved > 20 && a.ok, a);
    await page.evaluate(() => { play('36-4'); place(12, 11); sim(0.2); freeze(); }); await shot('41-36-4-paddling.png');
    const b = await page.evaluate(() => {
      thaw(); play('36-4'); place(34, 11); sim(0.3); const R = ents('tabRaft').sort((a, b) => a.x0 - b.x0);
      const r0 = AP.go([37, 12]); const pd = TB.paddle(R[1], 56); const r1 = AP.route([[59, 12], [62, 12]]);
      return { pd, ok: r0.ok && pd.ok && r1.ok, r0, r1 };
    });
    check('36-4: played: the long bowl of hot soup, riding past the bubbles between pops', b.ok, b);
    await page.evaluate(() => { play('36-4'); place(36, 11); sim(0.2); AP.go([37, 12]); const R = ents('tabRaft').sort((a, b) => a.x0 - b.x0)[1]; TB.paddle(R, 41); const b = ents('tabBubble').sort((a, b) => a.x - b.x)[0]; for (let k = 0; k < 600 && b.st() !== 'swell'; k++) sim(1 / 120); sim(0.5); freeze(); }); await shot('42-36-4-bubble.png');
    const c = await page.evaluate(() => {
      thaw(); play('36-4'); place(62, 11); sim(0.3); const R = ents('tabRaft').sort((a, b) => a.x0 - b.x0);
      const r0 = AP.go([68, 12]); const p1 = TB.paddle(R[2], 78); const r1 = AP.go([81, 12]); const r2 = AP.go([84, 12]); const p2 = TB.paddle(R[3], 93); const r3 = AP.route([[97, 9], [104, 9]]);
      return { ok: r0.ok && p1.ok && r1.ok && r2.ok && p2.ok && r3.ok, r0, p1, r1, r2, p2, r3 };
    });
    check('36-4: played: two rafts with a crust island between them, up the high bank', c.ok, c);
    // the twist: the cream on the left crust: it will not paddle right until Brady hops onto the middle and flips it
    const d = await page.evaluate(() => {
      play('36-4'); place(106, 8); sim(0.3); const R = ents('tabRaft').sort((a, b) => a.x0 - b.x0)[4]; const r0 = AP.go([110, 9]); if (!r0.ok) return { r0 };
      sim(0.4, { right: true }); sim(1.6); const p = P(); const on = p.ride === R;
      // on the creamy left crust: it just spins
      TB.onRaftAt(R, 0.18); const x0 = R.x; sim(1.2); const stuck = Math.abs(R.x - x0) < 8 && R.cream === -1;
      // stand in the middle and hop: it flips
      TB.onRaftAt(R, 0.5); TB.hop(); const flipped = R.cream === 1;
      const pd = TB.paddle(R, 142); const r1 = AP.route([[147, 10], [160, 10]]); sim(3, { right: true });
      return { on, stuck, flipped, pd, r1: r1.ok, state: S().state, key: S().exitKey };
    });
    check('36-4: played: the cream crust will not paddle; a hop onto the middle flips the crouton; across to the gate', d.on && d.stuck && d.flipped && d.pd.ok && d.r1 && d.key === 'main', d);
    await page.evaluate(() => { play('36-4'); place(112, 11); sim(0.4); freeze(); }); await shot('43-36-4-cream-crouton.png');
    await page.evaluate(() => { thaw(); play('36-4'); sim(0.3); }); await pano('49-36-4-panorama.png', 0.35);
  });
};

// ---------------- the five secret rooms: found with real inputs, won once, failed once, every way out used ----------------
LEVELS.rooms = async (page, shot, run) => {
  // B51 BAD REFLECTION (36-1): the steaming plate's chip drops Brady into a cubby; its hatch; the spoons
  await run('room51', async () => {
    await page.evaluate(() => { fresh(); play('36-1'); place(101, 13); sim(0.6); freeze(); }); await shot('15-36-1-tell-steam-on-the-plate.png');
    const a = await page.evaluate(() => { thaw(); play('36-1'); place(100, 13); sim(0.3); const r0 = AP.go([105, 14]); const d = TB.chipDrop(105, 108); const r1 = AP.go([107, 20]); const aid = TB.door(); return { r0: r0.ok, d, r1: r1.ok, aid, kind: TB.room().kind }; });
    check('B51: played: the steaming plate\'s chip drops Brady into the cubby; the hatch leads into BAD REFLECTION', a.d.row === 20 && a.aid === 'reflect' && a.kind === 'tabSpoons', a);
    await page.evaluate(() => { sim(0.8); freeze(); }); await shot('60-B51-bad-reflection-entry.png');
    const b = await page.evaluate(() => {
      thaw(); const A = S().area, R = A.roomState, K = window.BRADY.TourRooms || null;
      const xs = A.roomKit.data.spoons; const wait = ph => { for (let k = 0; k < 600 && ((R.cyc % 3.4) < 1.6 ? 'talk' : 'shut') !== ph; k++) sim(1 / 60); };
      wait('shut'); const wrong = xs[(R.odd + 1) % 3]; TB.markThrow(wrong); const failed = !R.won && (R.round || 0) === 0;
      for (let q = 0; q < 2 && !R.won; q++) { wait('shut'); TB.markThrow(xs[R.odd]); }
      sim(0.6); return { failed, won: R.won, cage: TB.cageOpen() };
    });
    check('B51: a normal spoon is a raspberry; the spoon still grinning after Piwi shuts his mouth, twice: won, the cage opens', b.failed && b.won && b.cage, b);
    await page.evaluate(() => freeze()); await shot('61-B51-won.png');
    const c = await page.evaluate(() => { thaw(); const d = ents('Portal').find(e => e.s.look === 'tabHatch' && e.target && e.target.area !== S().area.idx && e.s.targetRef === 'dining@b51Out') || ents('Portal').filter(e => e.s.look === 'tabHatch').sort((x, y) => y.x - x.x)[0]; AP.go([Math.floor(d.cx / 32), 8]); const aid = TB.door(); return { aid, x: Math.floor(P().cx / 32) }; });
    check('B51: its hatch lets Brady out further along the table (before the meshed plates)', c.aid === 'dining' && c.x > 110, c);
  });
  // B52 MATCH THE TEAR (36-2): only N4's sail reaches the high ledge (steam, the hatch)
  await run('room52', async () => {
    await page.evaluate(() => { fresh(); play('36-2'); place(83, 13); sim(0.4); freeze(); }); await shot('25-36-2-tell-steam-on-the-ledge.png');
    const a = await page.evaluate(() => { thaw(); play('36-2'); place(76, 13); sim(0.3); TB.crease(80); const r = AP.route([[86, 11], [79, 8], [78, 8]]); const aid = TB.door(); return { r: r.ok, aid, kind: TB.room().kind }; });
    check('B52: played: the sail up to the high ledge; its hatch leads into MATCH THE TEAR', a.r && a.aid === 'cloak' && a.kind === 'tabTear', a);
    await page.evaluate(() => { sim(0.8); freeze(); }); await shot('62-B52-match-the-tear-entry.png');
    const b = await page.evaluate(() => {
      thaw(); const A = S().area, R = A.roomState, D = A.roomKit.data; const xs = D.xs;
      TB.markThrow(xs[(D.rounds[0].at + 1) % 3]); sim(1.2); const failed = !R.won && R.round === 0;
      for (let q = 0; q < 2 && !R.won; q++) { TB.markThrow(xs[D.rounds[R.round].at]); sim(1.2); }
      return { failed, won: R.won, cage: TB.cageOpen() };
    });
    check('B52: a scrap with the wrong bite falls off; the right scrap twice (the card, then the menu): won, the cage opens', b.failed && b.won && b.cage, b);
    await page.evaluate(() => freeze()); await shot('63-B52-won.png');
    const c = await page.evaluate(() => { thaw(); AP.go([3, 11]); const aid = TB.door(); return { aid, x: Math.floor(P().cx / 32) }; });
    check('B52: its door takes Brady back to the ledge', c.aid === 'fold', c);
  });
  // B53 THE SPARE STAR (36-3): a fake panel in the first tier's far wall, steam at its foot
  await run('room53', async () => {
    await page.evaluate(() => { fresh(); play('36-3'); place(44, 14); sim(0.4); freeze(); }); await shot('35-36-3-tell-steam-at-the-wall.png');
    const a = await page.evaluate(() => { thaw(); play('36-3'); place(43, 14); sim(0.3); const r = AP.go([40, 15], { tol: 0 }); const aid = TB.door(); return { r: r.ok, aid, kind: TB.room().kind }; });
    check('B53: played: into the fake panel at the foot of the first tier; it leads into THE SPARE STAR', a.aid === 'stars' && a.kind === 'tabStar', a);
    await page.evaluate(() => { sim(0.8); freeze(); }); await shot('64-B53-spare-star-entry.png');
    const b = await page.evaluate(() => {
      thaw(); const A = S().area, R = A.roomState, D = A.roomKit.data; const xs = D.xs;
      TB.markThrow(xs[(D.rounds[0].spare + 2) % 5]); const failed = !R.won && R.round === 0;
      for (let q = 0; q < 2 && !R.won; q++) TB.markThrow(xs[D.rounds[R.round].spare]);
      sim(0.6); return { failed, won: R.won, cage: TB.cageOpen() };
    });
    check('B53: a star that is in the sky is a raspberry; the spare star twice: won, the cage opens', b.failed && b.won && b.cage, b);
    await page.evaluate(() => freeze()); await shot('65-B53-won.png');
    const c = await page.evaluate(() => { thaw(); const d = ents('Portal').filter(e => e.s.look === 'tabHatch').sort((x, y) => y.x - x.x)[0]; AP.go([Math.floor(d.cx / 32), 8]); const aid = TB.door(); return { aid, x: Math.floor(P().cx / 32), row: P().groundTy }; });
    check('B53: its hatch lets Brady out on the second tier (past the second table)', c.aid === 'service' && c.x >= 50 && c.row === 9, c);
  });
  // B54 WRONG END (36-4): a sugar ledge over the long bowl that only the raft passes under (steam, the hatch)
  await run('room54', async () => {
    const a = await page.evaluate(() => {
      fresh(); play('36-4'); place(34, 11); sim(0.3); const R = ents('tabRaft').sort((a, b) => a.x0 - b.x0)[1];
      AP.go([37, 12]); TB.paddle(R, 43); sim(0.4); const r = AP.route([[46, 9]]); return { r: r.ok, x: Math.floor(P().cx / 32) };
    });
    await page.evaluate(() => freeze()); await shot('45-36-4-the-ledge-over-the-soup.png'); await page.evaluate(() => thaw());
    const a2 = await page.evaluate(() => { const aid = TB.door(); return { aid, kind: TB.room().kind }; });
    check('B54: played: paddled under the sugar ledge, up onto it; its hatch leads into WRONG END', a.r && a2.aid === 'scope' && a2.kind === 'tabScope', [a, a2]);
    await page.evaluate(() => { sim(0.8); freeze(); }); await shot('66-B54-wrong-end-entry.png');
    const b = await page.evaluate(() => {
      thaw(); const A = S().area, R = A.roomState, D = A.roomKit.data;
      const r1 = AP.go([D.lens[0], 8]); sim(0.4); const fooled = !R.won && R.poke > 0;
      const r2 = AP.route([[12, 5], [14, 4], [17, 5], [D.prize[0], 8]]); sim(0.6);
      return { fooled, r1: r1.ok, r2: r2.ok, won: R.won, cage: TB.cageOpen() };
    });
    check('B54: the giant prize in the lens is only the lens; round the tripod to the tiny real prize: won, the cage opens', b.fooled && b.won && b.cage, b);
    await page.evaluate(() => freeze()); await shot('67-B54-won.png');
    const c = await page.evaluate(() => { thaw(); const d = ents('Portal').filter(e => e.s.look === 'tabHatch').sort((x, y) => y.x - x.x)[0]; AP.go([Math.floor(d.cx / 32), 8]); const aid = TB.door(); return { aid, x: Math.floor(P().cx / 32), row: P().groundTy }; });
    check('B54: its hatch lets Brady out on the high bank past the third bowl', c.aid === 'bowls' && c.x >= 96 && c.row === 9, c);
  });
  // B55 PULL TO ENTER (36-5): past the booth's door, a gap in the cloth with steam rising; the pantry under the table
  await run('room55', async () => {
    await page.evaluate(() => { fresh(); play('36-5'); place(100, 13); sim(0.4); freeze(); }); await shot('55-36-5-tell-steam-past-the-booth.png');
    const a = await page.evaluate(() => { thaw(); play('36-5'); place(100, 13); sim(0.3); const r = AP.route([[104, 20], [99, 20]]); const aid = TB.door(); return { r: r.ok, aid, kind: TB.room().kind }; });
    check('B55: played: down the gap past the booth\'s door into the pantry corridor; its hatch leads into PULL TO ENTER', a.r && a.aid === 'pantry' && a.kind === 'tabPull', a);
    await page.evaluate(() => { sim(0.8); freeze(); }); await shot('68-B55-pull-to-enter-entry.png');
    const b = await page.evaluate(() => {
      thaw(); const A = S().area, R = A.roomState, D = A.roomKit.data;
      AP.go([D.ring[0], 8]); sim(0.6, { right: true }); const pushed = !R.won && R.push > 0;
      AP.go([D.ring[0], 8]); sim(1 / 120, { action: true, actionPressed: true }); for (let k = 0; k < 180 && !R.won; k++) sim(1 / 60, { action: true, left: true }); sim(0.6);
      return { pushed, won: R.won, cage: TB.cageOpen() };
    });
    check('B55: pushing the door does nothing; hold THROW on the pull ring and walk backwards: it opens, the cage with it', b.pushed && b.won && b.cage, b);
    await page.evaluate(() => freeze()); await shot('69-B55-won.png');
    const c = await page.evaluate(() => { thaw(); AP.go([3, 11]); const aid = TB.door(); return { aid, x: Math.floor(P().cx / 32) }; });
    check('B55: its door takes Brady back up beside the booth\'s door (before the boss)', c.aid === 'courses' && c.x < 92, c);
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
