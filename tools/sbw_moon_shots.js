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
        if (prog.walkTo != null) { const dx = prog.walkTo - (b.x + b.w / 2); dir = Math.abs(dx) > 6 ? Math.sign(dx) : 0; inp.left = dir < 0; inp.right = dir > 0; for (const h of AP.hooks) h(prog, t, b, inp); return inp; }
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
        if (target[1] === from[1] && !target[2]) out.push({ walkTo: target[0] * 32 + 16, dir: 0 });
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
          window.BRADY_MOON.phys(b, inp, A, dt, null, {});
          if (AP.after) AP.after(b, inp, A, dt);
          t += dt;
          if (b.y > A.H * 32 + 20 || window.BRADY_MOON.lavaContact(b, A) || window.BRADY_MOON.spikeContact(b, A)) return null;
          if (AP.bad && AP.bad(b, A)) return null;
          if (!b.onGround) air = true;
          if (prog.walkTo != null) { if (b.onGround && !air && Math.abs(b.x + b.w / 2 - prog.walkTo) <= 8 && Math.abs(b.vx) < 4) return { tx: Math.floor((b.x + b.w / 2) / 32), ty: b.groundTy, t, flipped: !!b.flipped }; continue; }
          if (b.onGround && (air || (prog.noJump && prog.air !== 'stopgo') || prog.stand) && landT == null && t > 0.05) landT = t;
          if (landT != null && Math.abs(b.vx) < 4 && b.onGround) return { tx: Math.floor((b.x + b.w / 2) / 32), ty: b.groundTy, t, flipped: !!b.flipped };
        }
        return null;
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
          if (!okY || Math.abs(r.tx - target[0]) > (o.tol != null ? o.tol : 1)) continue;
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
        o = o || {};
        for (let tries = 0; tries < 3; tries++) {
          const pl = AP.plan(target, o);
          if (!pl) return { ok: false, why: 'no plan', from: tileOf(), target };
          const r = AP.exec(pl.prog, o.maxT);
          if (r.dead) return { ok: false, why: 'died', r, prog: pl.prog, target };
          if (r.exit) return { ok: true, r, exit: r.exit };
          if (o.area && r.area !== o.area) return { ok: false, why: 'area', r };
          if (r.ty === target[1] && Math.abs(r.tx - target[0]) <= (o.tol != null ? o.tol : 1)) return { ok: true, r, prog: pl.prog };
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

(async () => {
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => {
    for (const k in LEVELS) await LEVELS[k](page, shot, run, pano);
  });
  await session({ width: 390, height: 844 }, async (page, shot, run) => {
    await run('p-hop', async () => { await page.evaluate(() => { fresh(); play('18-1'); place(60, 20); sim(0.4); freeze(); }); await shot('90-portrait-18-1.png'); });
  });
  console.log(failures ? `${failures} MOON CHECK(S) FAILED` : 'ALL MOON CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
