// Italy (world 14): screenshots and in-browser checks of each level's mechanic, played with real inputs through the
// game loop (the Input flags, Play.update at 120 Hz). Every jump the level checker was told about with an edge is
// played here: each ramp launch at cruise (14-1), each dough fling after a charge (14-2), each espresso leap (14-6).
// Also: the scooter's cruise / brake / boost through crates, the tilt clock and its slides (14-3), the diva's columns
// and her breath (14-4), the coffee shutter (14-6), the land's map. Phone landscape (844x390 @2x) and portrait
// (390x844), plus a panorama of each level (the whole main area, tile by tile, scaled down).
// usage: BRADY_DIST=<dist> node tools/sbw_it_shots.js <outdir> [--checks] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'it-shots'), checksOnly = args.includes('--checks');
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
    // the scene runs only inside sim() (the page's own loop keeps drawing)
    { const PU = B.Play.prototype, upd = PU.update; PU.update = function (dt) { if (window.__simOn) return upd.call(this, dt); }; }
    window.sim = (sec, inp) => {
      const G = B.Game, I = B.Input, steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, typeof inp === 'function' ? inp(k) : inp); if (k > 0 && typeof inp !== 'function') { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; } }
        window.__simOn = true; try { G.scene.update(1 / 120); } finally { window.__simOn = false; }
        I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null;
      }
      for (const key of ['left', 'right', 'up', 'down', 'jump', 'action']) I[key] = false;
    };
    // run until cond() or the time runs out; inp(k) gives the input of step k
    window.until = (sec, inp, cond) => { const steps = Math.round(sec * 120); for (let k = 0; k < steps; k++) { sim(1 / 120, inp ? inp(k) : null); if (cond && cond()) return true; } return false; };
    window.fresh = () => { const d = B.Save.data; for (const k of ['done', 'unlocked', 'exits', 'secretExits', 'gold', 'best']) d[k] = {}; d.unlocked['1-1'] = true; d.tour = null; d.lives = 9; d.seenTourIntro = true; T.TourProgress.data(); };
    window.play = (id) => { const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9; const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(2.0); g.state = 'play'; g.player.invuln = 999; return g; };
    window.place = (tx, ty) => { const g = S(), p = P(); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; p.ride = null; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.42)); g.camY = g.camTargetY(true); };
    window.toArea = (aid) => { const g = S(), k = g.level.areas.findIndex(a => a.aid === aid), A = g.level.areas[k], an = A.anchors.in || A.anchors.start; if (g.area.idx !== k) g.loadArea(k, an.x, an.y); P().invuln = 999; };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; };
    window.thaw = () => { const g = S(); if (g.player) g.player.invuln = 999; };
    window.feetRow = () => Math.round((P().y + P().h) / 32);
    window.ents = name => S().entities.filter(e => e.constructor.name === name && !e.remove);
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); if (checksOnly) return; await page.evaluate(() => { const p = window.BRADY.Game.scene && window.BRADY.Game.scene.player; if (p) p.invuln = 0; }); await page.waitForTimeout(250); await page.screenshot({ path: path.join(out, name) }); await page.evaluate(() => { const p = window.BRADY.Game.scene && window.BRADY.Game.scene.player; if (p) p.invuln = 999; }); };
  // a panorama of the current area: the canvas drawn tile-window by tile-window into one picture (scaled to 0.4)
  const pano = async name => {
    if (checksOnly) return;
    const data = await page.evaluate(() => {
      const B = window.BRADY, g = S(), G = B.Game, A = g.area, VW = G.viewW, VH = G.viewH, W = A.W * 32, H = A.H * 32, k = 0.4;
      const c = document.createElement('canvas'); c.width = Math.ceil(W * k); c.height = Math.ceil(H * k); const x = c.getContext('2d');
      const p = g.player, px = p.x, py = p.y; p.invuln = 0;
      // no HUD, toasts or touch controls in the panorama
      const keep = { hud: g.drawHUD, toast: g.drawToast, tut: g.drawTutorial, ctl: B.Input.drawControls }; g.drawHUD = g.drawToast = g.drawTutorial = () => {}; B.Input.drawControls = () => {};
      for (let cy = 0; cy < H; cy += VH) for (let cx = 0; cx < W; cx += VW) {
        g.camX = Math.min(cx, Math.max(0, W - VW)); g.camY = Math.min(cy, Math.max(0, H - VH)); p.x = -9999; p.y = -9999;
        G.ctx.setTransform(1, 0, 0, 1, 0, 0); G.ctx.fillStyle = '#07040e'; G.ctx.fillRect(0, 0, G.canvas.width, G.canvas.height); g.draw(G.ctx);
        x.drawImage(G.canvas, G.gameRect.x * G.dpr, G.gameRect.y * G.dpr, VW * G.S, VH * G.S, g.camX * k, g.camY * k, VW * k, VH * k);
      }
      g.drawHUD = keep.hud; g.drawToast = keep.toast; g.drawTutorial = keep.tut; B.Input.drawControls = keep.ctl;
      p.x = px; p.y = py; p.invuln = 999;
      return c.toDataURL('image/jpeg', 0.8);
    });
    fs.writeFileSync(path.join(out, name), Buffer.from(data.split(',')[1], 'base64'));
  };
  const run = async (name, f) => { if (want.length && !want.some(w => name.startsWith(w))) return; try { await pin(); await f(); } catch (e) { check(name + ' runs', false, String(e.stack || e.message).slice(0, 400)); } };
  await fn(page, shot, run, pano);
  check(`${viewport.width}x${viewport.height}: no page errors`, !errors.length, errors.slice(0, 5));
  await browser.close();
}

(async () => {
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => {
    const ev = (f, a) => page.evaluate(f, a);
    /* ---------- 14-1 Scooter Dash ---------- */
    await run('scoot', async () => {
      let r = await ev(() => { fresh(); play('14-1'); const p = P(), x0 = p.x; sim(1.5); return { scoot: !!p.itScoot, moved: Math.round((p.x - x0) / 32), vx: Math.round(p.vx / 32 * 10) / 10 }; });
      check('14-1: on the scooter Brady rolls forward on his own (cruise)', r.scoot && r.moved >= 6 && r.vx > 6, r);
      await shot('01-14-1-start.png');
      r = await ev(() => { const p = P(); sim(0.8, { down: true }); const v1 = Math.abs(p.vx); sim(0.4, { right: true }); const v2 = p.vx; return { braked: Math.round(v1), fast: Math.round(v2 / 32 * 10) / 10 }; });
      check('14-1: DOWN brakes to a stop, RIGHT speeds up', r.braked < 10 && r.fast > 7.5, r);
      // the first crates: no boost bumps, a boost smashes them
      r = await ev(() => {
        const c = ents('ItCrates')[0], p = P(); const tx = Math.floor(c.x / 32); window.__crate = c;
        place(tx - 6, Math.floor(c.y / 32) + c.h / 32 - 1); sim(1.6); window.__stopped = !c.remove && p.x + p.w <= c.x + 2;
        place(tx - 6, Math.floor(c.y / 32) + c.h / 32 - 1); sim(0.05, { action: true, actionPressed: true }); sim(0.12); return {};
      });
      await shot('02a-14-1-boost.png');
      r = await ev(() => { const c = window.__crate, p = P(); sim(0.9); return { stopped: window.__stopped, smashed: !!c.remove, past: p.x > c.x + c.w }; });
      check('14-1: market crates stop a plain scooter; a BOOST smashes through', r.stopped && r.smashed && r.past, r);
      await ev(() => { const p = P(); sim(0.3); });
      await shot('02-14-1-crates-smashed.png');
      // every ramp (the checker's edges): roll up it at cruise, land on the roof terrace
      r = await ev(() => {
        const g = S(), A = g.area, res = [];
        for (const e of A.edges) {
          const ramp = ents('ItRamp').find(q => Math.abs(Math.floor(q.x / 32) + 1 - e.from[0]) <= 1);
          if (!ramp) continue;
          const crate = ents('ItCrates').find(c => c.x > ramp.x - 12 * 32 && c.x < ramp.x);
          place(e.from[0] - (crate ? 3 : 6), e.from[1]); const p = P(); p.vx = 7.2 * 32;
          let airborne = false;
          const ok = until(4, () => ({}), () => { if (!p.onGround) airborne = true; return airborne && p.onGround; });
          res.push({ ramp: e.from[0], to: e.to, landRow: feetRow(), landX: Math.floor(p.cx / 32), ok: ok && feetRow() === e.to[1] && Math.floor(p.cx / 32) >= e.to[0] - 4 });
        }
        return res;
      });
      check(`14-1: every ramp launch (${r.length}) lands Brady on its roof terrace at cruise speed`, r.length >= 3 && r.every(q => q.ok), r);
      await ev(() => { const e = S().area.edges[0]; place(e.from[0] - 6, e.from[1]); P().vx = 7.2 * 32; sim(0.95); });
      await shot('03-14-1-ramp-flight.png');
      // a washing line is a trampoline
      r = await ev(() => { const L = ents('ItLine')[0], p = P(); place(Math.floor(L.x / 32) + 2, Math.floor(L.y / 32) - 3); p.vy = 0; let minVy = 0; until(1.2, () => ({ jump: true }), () => { minVy = Math.min(minVy, p.vy); return false; }); return { minVy: Math.round(minVy / 32) }; });
      check('14-1: the washing line bounces Brady high (hold JUMP)', r.minVy <= -18, r);
      await shot('04-14-1-washing-line.png');
      await ev(() => { const o = ents('ItOil')[0]; place(Math.floor(o.x / 32) - 2, Math.floor(o.y / 32)); sim(0.4); });
      await shot('05-14-1-oil.png');
      await ev(() => { toArea('garage'); place(10, 11); sim(0.3); });
      await shot('06-14-1-garage.png');
      await ev(() => { play('14-1'); });
      await pano('pano-14-1.jpg');
    });
    /* ---------- 14-2 The Pizzeria ---------- */
    await run('dough', async () => {
      await ev(() => { play('14-2'); place(14, 13); sim(0.4); });
      await shot('10-14-2-start.png');
      // the charge: standing on a pad fills its ring; a quick hop is a normal jump, a full ring a big fling
      let r = await ev(() => {
        const d = ents('ItDough')[0], p = P(); place(Math.floor(d.x / 32) + 1, Math.floor(d.y / 32) - 1); sim(0.3);
        const c0 = d.charge; sim(1.2); const c1 = d.charge, sag = Math.round(d.sag);
        let top = p.y; until(1.5, k => ({ jump: true, jumpPressed: k === 0 }), () => { top = Math.min(top, p.y); return false; });
        return { c0: Math.round(c0 * 100) / 100, c1, sag, rise: Math.round((d.hy - (top + p.h)) / 32 * 10) / 10 };
      });
      check('14-2: standing on the dough fills its ring; the full fling throws Brady far higher than a jump', r.c0 < 0.5 && r.c1 >= 1 && r.sag >= 8 && r.rise >= 7, r);
      // too long: it tears
      r = await ev(() => { const d = ents('ItDough')[0], p = P(); place(Math.floor(d.x / 32) + 1, Math.floor(d.y / 32) - 1); sim(3.2); return { torn: d.state === 'torn', fell: !p.onGround || p.y > d.hy }; });
      check('14-2: stand too long and the dough tears', r.torn, r);
      await ev(() => { play('14-2'); });
      // every fling the checker was told about: charge, jump, steer to the landing
      r = await ev(() => {
        const g = S(), A = g.area, res = [], seen = {};
        for (const e of A.edges) {
          const key = e.to.join(','); if (seen[key]) continue; seen[key] = 1;
          const d = ents('ItDough').find(q => e.from[0] >= Math.floor(q.x / 32) && e.from[0] < Math.floor(q.x / 32) + q.w / 32);
          if (!d) continue;
          d.state = 'ok'; d.dead = false; d.stand = 0; d.st = 0; place(Math.floor(d.x / 32) + 1, Math.floor(d.hy / 32) - 1); const p = P(); sim(1.3);
          const tx = e.to[0] * 32 + 16; let k0 = 0;
          until(3.5, k => ({ jump: k < 50, jumpPressed: k === 0, right: p.cx < tx - 10, left: p.cx > tx + 40 && !p.onGround }), () => { k0++; return k0 > 10 && p.onGround; });
          res.push({ from: e.from, to: e.to, row: feetRow(), x: Math.floor(p.cx / 32), ok: feetRow() === e.to[1] && Math.abs(Math.floor(p.cx / 32) - e.to[0]) <= 4 });
        }
        return res;
      });
      check(`14-2: every dough fling (${r.length}) lands on its shelf or counter`, r.length >= 6 && r.every(q => q.ok), r);
      await ev(() => { const d = ents('ItDough')[1]; place(Math.floor(d.x / 32) + 1, Math.floor(d.hy / 32) - 1); sim(1.0); });
      await shot('11-14-2-dough-charging.png');
      // ovens: the glow, then fire
      r = await ev(() => { const o = ents('ItOven')[0]; let glow = false, fire = false; place(Math.floor(o.x / 32) - 4, Math.floor((o.y + o.h) / 32) - 1); until(3, () => ({}), () => { const ph = o.phaseOf(); if (ph === 'glow') glow = true; if (ph === 'fire' && glow) fire = true; return fire; }); return { glow, fire }; });
      check('14-2: an oven glows before it puffs fire', r.glow && r.fire, r);
      await shot('12-14-2-oven-fire.png');
      await ev(() => { toArea('dispensa'); place(20, 11); sim(0.3); });
      await shot('13-14-2-pantry-secret-gate.png');
      await ev(() => { play('14-2'); });
      await pano('pano-14-2.jpg');
    });
    /* ---------- 14-3 The Leaning Tower ---------- */
    await run('lean', async () => {
      await ev(() => { play('14-3'); sim(0.3); });
      await shot('20-14-3-start.png');
      let r = await ev(() => {
        const g = S(), clock = ents('ItTilt')[0], M = window.BRADY_TOUR.itMech, half = M.TILT.period / 2;
        const wait = half - (g.t % half) - 1.0; if (wait > 0) sim(wait);
        const warn = !!g.itTiltWarn, bit0 = g.toggleBit(0); sim(1.3); const bit1 = g.toggleBit(0);
        const A = ents('ItSlider')[0]; return { warn, flipped: bit0 !== bit1, sliderK: Math.round(A.k * 10) / 10 };
      });
      check('14-3: the tower creaks (the tell) before it tips, and the crates slide', r.warn && r.flipped, r);
      await shot('21-14-3-tipped.png');
      // the slope: standing still on the floor, Brady slides downhill
      r = await ev(() => { const g = S(), p = P(); place(14, 83); const x0 = p.x; sim(1.0); return { dx: Math.round(p.x - x0), lean: g.itLean }; });
      check('14-3: in a lean, the floor pushes Brady downhill', Math.abs(r.dx) > 20 && Math.sign(r.dx) === Math.sign(r.lean), r);
      // the plank: standing on it when the tower tips, it carries him along
      r = await ev(() => {
        const g = S(), M = window.BRADY_TOUR.itMech, half = M.TILT.period / 2, pl = ents('ItSlider').find(s => s.look === 'plank');
        let res = null;
        for (let n = 0; n < 3 && !res; n++) {
          const wait = half - (g.t % half) - 0.4; if (wait > 0) sim(wait);
          const on = g.toggleBit(pl.gi), R = on ? pl.B : pl.A; place(R[0] + 2, R[1] - 1); const x0 = P().x; sim(0.8);
          res = { moved: Math.round((P().x - x0) / 32), row: feetRow(), plankRow: R[1] };
        }
        return res;
      });
      check('14-3: a plank carries Brady along when the tower tips', Math.abs(r.moved) >= 5 && r.row === r.plankRow, r);
      await shot('22-14-3-plank-ride.png');
      await ev(() => { place(4, 65); sim(0.6); });
      await shot('23-14-3-bell.png');
      await ev(() => { place(10, 56); sim(0.4); });
      await shot('24-14-3-crate-gate.png');
      await ev(() => { place(20, 11); sim(0.3); });
      await shot('25-14-3-bell-chamber.png');
      await ev(() => { play('14-3'); });
      await pano('pano-14-3.jpg');
    });
    /* ---------- 14-4 Night at the Opera ---------- */
    await run('aria', async () => {
      await ev(() => { play('14-4'); sim(0.2); });
      await shot('30-14-4-start.png');
      // the first column: walk into it while she sings, rise to the balcony
      let r = await ev(() => {
        const g = S(), d = ents('ItDiva').find(q => q.gi === 0), p = P(), M = window.BRADY_TOUR.itMech;
        until(8, () => ({}), () => d.phase().singing && d.phase().k < 0.3);
        // walk into the column, then hold JUMP and ride it up; at the top, steer right onto the balcony
        place(9, 21); until(1, () => ({ right: true }), () => p.cx > 12.6 * 32);
        const ok = until(3.5, k => ({ jump: true, jumpPressed: k === 0, left: p.cx > 13.8 * 32, right: p.cx < 13.2 * 32 }), () => feetRow() <= 11);
        until(1.5, () => ({ right: true }), () => p.onGround);
        return { rose: ok, row: feetRow(), x: Math.floor(p.cx / 32) };
      });
      check('14-4: a long note lifts Brady up the column of song to the first balcony', r.rose && r.row === 12, r);
      await shot('31-14-4-balcony.png');
      // her breath: the column stops
      r = await ev(() => { const g = S(), d = ents('ItDiva').find(q => q.gi === 0), z = g.area.zones.find(q => q.itAria === 0); let tell = false; until(8, () => ({}), () => { if (d.phase().tell) tell = true; return tell && !d.phase().singing; }); sim(0.05); return { tell, off: !!z.off }; });
      check('14-4: she gasps for breath (the tell), then the column stops', r.tell && r.off, r);
      await ev(() => { const d = ents('ItDiva').find(q => q.gi === 0); until(8, () => ({}), () => d.phase().tell); place(11, 18); });
      await shot('32-14-4-diva-gasp.png');
      // the duet: one sings while the other rests
      r = await ev(() => { const D = ents('ItDiva').filter(d => d.duet); let both = false, one = 0; until(12, () => ({}), () => { const a = D[0].phase().singing, b = D[1].phase().singing; if (a && b) both = true; if (a !== b) one++; return false; }); return { n: D.length, both, one }; });
      check('14-4: the duet: two divas take turns, never singing together', r.n === 2 && !r.both && r.one > 500, r);
      await ev(() => { const D = ents('ItDiva').filter(d => d.duet); until(10, () => ({}), () => D[0].phase().singing); place(90, 13); });
      await shot('33-14-4-duet.png');
      await ev(() => { place(126, 11); sim(0.5); });
      await shot('34-14-4-chandeliers.png');
      await ev(() => { toArea('loggia'); place(10, 11); sim(0.3); });
      await shot('35-14-4-royal-box.png');
      await ev(() => { play('14-4'); });
      await pano('pano-14-4.jpg');
    });
    /* ---------- 14-5 the lead-in ---------- */
    await run('lair', async () => {
      await ev(() => { play('14-5'); place(24, 13); sim(0.3); });
      await shot('40-14-5-backstage.png');
      await pano('pano-14-5.jpg');
    });
    /* ---------- 14-6 Doppio ---------- */
    await run('espresso', async () => {
      await ev(() => { fresh(); play('14-6'); sim(0.2); });
      await shot('50-14-6-start.png');
      let r = await ev(() => { const c = ents('ItCup')[0], p = P(); place(Math.floor(c.x / 32) - 1, Math.floor((c.y + c.h) / 32) - 1); sim(0.6, { right: true }); return { esp: Math.round(p.itEsp * 10) / 10, vx: Math.round(p.vx / 32) }; });
      check('14-6: a cup of espresso puts Brady in double time', r.esp > 3 && r.vx > 12, r);
      await shot('51-14-6-doppio-run.png');
      // every espresso leap (the checker's edges): drink, run, jump at the lip, land across
      r = await ev(() => {
        const g = S(), A = g.area, res = [];
        for (const e of A.edges) {
          const cup = ents('ItCup').filter(c => c.cx < e.from[0] * 32).sort((a, b) => b.cx - a.cx)[0];
          cup.full = true; const doom = ents('TourDoom')[0]; if (doom) doom.front = -1e5;
          place(Math.floor(cup.cx / 32) - 1, e.from[1]); const p = P(); p.itEsp = 0;
          const lip = (e.from[0] + 1) * 32 - 4; let jumped = false;
          until(5, () => { const j = !jumped && p.x + p.w >= lip; if (j) jumped = true; return { right: true, jump: jumped, jumpPressed: j }; }, () => jumped && p.onGround && p.cx > lip + 32);
          res.push({ from: e.from, to: e.to, row: feetRow(), x: Math.floor(p.cx / 32), ok: feetRow() === e.to[1] && Math.floor(p.cx / 32) >= e.to[0] - 2 });
        }
        return res;
      });
      check(`14-6: every espresso leap (${r.length}) clears its gap at double speed`, r.length >= 4 && r.every(q => q.ok), r);
      // and without the espresso the same leap falls short
      r = await ev(() => { const e = S().area.edges[0], p = P(); place(e.from[0] - 7, e.from[1]); p.itEsp = 0; for (const c of ents('ItCup')) c.full = false; const lip = (e.from[0] + 1) * 32 - 4; let jumped = false; until(4, () => { const j = !jumped && p.x + p.w >= lip; if (j) jumped = true; return { right: true, jump: jumped, jumpPressed: j }; }, () => p.dead || p.state !== 'play' || (jumped && p.onGround)); return { made: feetRow() === e.to[1] && p.state === 'play' }; });
      check('14-6: without a cup the same leap falls short', !r.made, r);
      // the coffee shutter: pull the lever after a cup, reach the shutter while it is open
      r = await ev(() => {
        play('14-6'); const g = S(), doom = ents('TourDoom')[0]; if (doom) doom.front = -1e5;
        const lv = g.entities.find(e => e.lever && e.timed); const sh = g.entities.find(e => e.shutter && e.id === lv.opens);
        const cup = ents('ItCup').filter(c => c.cx < lv.cx).sort((a, b) => b.cx - a.cx)[0]; cup.full = true;
        place(Math.floor(cup.cx / 32) - 1, Math.floor((lv.y + lv.h) / 32) - 1); const p = P();
        until(0.5, () => ({ right: true }), () => p.cx >= lv.cx);
        sim(0.05, { right: true, action: true, actionPressed: true, up: true, upPressed: true });
        const shx = sh ? sh.x : 0;
        until(4, () => ({ right: true }), () => p.x > shx + 40);
        return { past: p.x > shx + 40, lever: !!lv, shutter: !!sh };
      });
      check('14-6: the lever opens the shutter long enough only at double speed', r.past, r);
      await ev(() => { toArea('retro'); place(10, 11); sim(0.3); });
      await shot('52-14-6-back-room.png');
      await ev(() => { play('14-6'); });
      await pano('pano-14-6.jpg');
    });
    /* ---------- the secret rooms: each entrance found with real inputs, each game failed once and won once, each exit used ---------- */
    await run('secrets', async () => {
      const R = {};
      // a helper in the page: the room state of the current area; tokens by id
      await ev(() => { window.room = () => S().area.roomState; window.kit = () => S().area.roomKit; window.waitArea = (aid, sec) => until(sec || 4, () => ({}), () => S().area.aid === aid && S().fade.a < 0.05 && P().state === 'play'); window.upDoor = () => { sim(0.05, { up: true, upPressed: true }); }; window.runTo = (tx, sec) => { const A = S().area; return until(sec || 12, () => { const p = P(), row = Math.round((p.y + p.h) / 32), fx = Math.floor(p.cx / 32), gap = p.onGround && [1, 2].some(d => A.tiles[row * A.W + fx + d] === 0); return { right: p.cx < tx - 6, left: p.cx > tx + 20, jump: true, jumpPressed: gap }; }, () => Math.abs(P().cx - tx) < 10 && P().onGround); };
      window.hop = sec => { let n = 0; until(sec || 1.4, k => ({ jump: true, jumpPressed: k === 0 }), () => ++n > 30 && P().onGround); }; });
      // 14-1: a boosted launch off the first ramp reaches the pigeon loft; inside, the scooter time trial; out through the roller door
      await ev(() => { fresh(); play('14-1'); const loft = S().entities.find(e => e.s && e.s.look === 'itLoft'); const ramp = ents('ItRamp').filter(r => r.x < loft.x).sort((a, b) => b.x - a.x)[0]; place(Math.floor(ramp.x / 32) - 8, Math.floor((ramp.y + ramp.h) / 32) - 1); sim(0.4); });
      await shot('80-14-1-tell-pigeon-loft.png');
      let r = await ev(() => {
        const loft = S().entities.find(e => e.s && e.s.look === 'itLoft'), ramp = ents('ItRamp').filter(q => q.x < loft.x).sort((a, b) => b.x - a.x)[0], p = P();
        // a plain launch tops out under the loft
        place(Math.floor(ramp.x / 32) - 6, Math.floor((ramp.y + ramp.h) / 32) - 1); let top = 1e9; until(2.5, () => ({ right: true }), () => { top = Math.min(top, p.y + p.h); return false; });
        const plainTop = Math.floor(top / 32);
        // the boosted one: boost just before the ramp, ride on, land on the loft ledge, in at its door
        place(Math.floor(ramp.x / 32) - 6, Math.floor((ramp.y + ramp.h) / 32) - 1); let boosted = false;
        until(3, () => { const b = !boosted && p.cx > ramp.x - 80; if (b) boosted = true; return { right: p.cx < loft.cx - 10, action: b, actionPressed: b }; }, () => p.onGround && p.y + p.h <= loft.y + loft.h + 4 && p.vy >= 0 && Math.abs(p.cx - loft.cx) < 3 * 32);
        const onLedge = Math.abs(p.y + p.h - (loft.y + loft.h)) < 6;
        until(1.5, () => ({ down: true, left: p.cx > loft.cx + 6, right: p.cx < loft.cx - 6 }), () => Math.abs(p.cx - loft.cx) < 8 && Math.abs(p.vx) < 10);
        upDoor(); waitArea('garage');
        return { plainTop, loftRow: Math.floor((loft.y + loft.h) / 32), onLedge, area: S().area.aid };
      });
      check('14-1 secret: a plain ramp launch tops out under the pigeon loft; a BOOSTED one lands on it and its door leads in', r.plainTop > r.loftRow && r.onLedge && r.area === 'garage', r);
      await shot('81-14-1-time-trial.png');
      r = await ev(() => {
        const K = kit(), F = K.data.flags, p = P(), Rm = room();
        // fail: pass flag 1, then dawdle (brake) until the clock runs out
        place(F[0][0] - 2, F[0][1]); until(1.5, () => ({}), () => Rm.next >= 1); until(14, () => ({ down: true }), () => Rm.next === 0 && Rm.fails >= 1);
        const failed = Rm.fails >= 1 && !Rm.won;
        // win: ride into each flag in turn (a short run-up to each; the third over the washing-line bounce)
        place(F[0][0] - 2, F[0][1]); until(1.2, () => ({ right: true }), () => Rm.next >= 1);
        place(F[1][0] - 2, F[1][1]); until(1.2, () => ({ right: true }), () => Rm.next >= 2);
        place(F[2][0] - 9, 10); until(4, () => ({ right: p.cx < F[2][0] * 32 + 16, jump: true, left: p.cx > F[2][0] * 32 + 40 }), () => Rm.won);
        return { failed, won: Rm.won };
      });
      check('14-1 secret: the time trial is lost when the clock runs out, and won by riding through the three flags', r.failed && r.won, r);
      await shot('82-14-1-time-trial-won.png');
      r = await ev(() => { const d = S().entities.find(e => e.s && e.s.look === 'itGarage' && e.s.targetRef && /garageOut/.test(e.s.targetRef)); place(Math.floor(d.cx / 32), Math.floor((d.y + d.h) / 32) - 1); P().vx = 0; sim(0.3, { down: true }); upDoor(); waitArea('vicolo'); const an = S().level.areas[0].anchors.garageOut; return { area: S().area.aid, dx: Math.round((P().cx - an.x) / 32) }; });
      check('14-1 secret: the roller door leads out onto the street further on (not back to the loft)', r.area === 'vicolo' && Math.abs(r.dx) <= 2, r);
      // 14-2: a full charge, straight up through the flour vent; the run along the cupboard tops; the pantry hatch
      await ev(() => { play('14-2'); const v = ents('ItFlourTell')[0]; place(Math.floor(v.x / 32) - 4, Math.floor((v.y + v.h) / 32)); sim(0.3); });
      await shot('83-14-2-tell-flour-vent.png');
      r = await ev(() => {
        const v = ents('ItFlourTell')[0], pad = ents('ItDough').find(d => Math.abs(d.cx - v.cx) < 48), p = P();
        // a half charge is not enough
        place(Math.floor(pad.cx / 32), Math.floor(pad.hy / 32) - 1); sim(0.6); let top = 1e9, n = 0; until(1.6, k => ({ jump: true, jumpPressed: k === 0 }), () => { top = Math.min(top, p.y + p.h); return ++n > 20 && p.onGround; });
        const halfTop = Math.floor(top / 32);
        // full: wait, jump straight up, steer right over the cupboard tops at the top of the fling
        play('14-2'); const v2 = ents('ItFlourTell')[0], pad2 = ents('ItDough').find(d => Math.abs(d.cx - v2.cx) < 48);
        place(Math.floor(pad2.cx / 32), Math.floor(pad2.hy / 32) - 1); sim(1.4);
        let air = false; until(2.5, k => { if (!P().onGround) air = true; return { jump: true, jumpPressed: k === 0, right: true }; }, () => air && P().onGround);
        const slabRow = Math.floor((v2.y) / 32) + 0;
        const up = feetRow();
        // run the loft to the pantry hatch
        const hatch = S().entities.find(e => e.s && e.s.look === 'itPantry');
        const A = S().area, row = feetRow(); let gapX = 0; for (let x = Math.floor(P().cx / 32) + 2; x < A.W; x++) if (A.tiles[row * A.W + x] === 0) { gapX = x; break; }
        until(10, () => { const near = P().onGround && P().cx > gapX * 32 - 64 && P().cx < gapX * 32; return { right: P().cx < hatch.cx - 6, left: P().cx > hatch.cx + 20, jump: true, jumpPressed: near }; }, () => Math.abs(P().cx - hatch.cx) < 10 && P().onGround && Math.abs(P().y + P().h - (hatch.y + hatch.h)) < 6);
        upDoor(); waitArea('dispensa');
        return { halfTop, up, hatchRow: Math.floor((hatch.y + hatch.h) / 32), area: S().area.aid };
      });
      check('14-2 secret: half a charge falls short; a full fling goes up through the vent, the cupboard-top run leads to the pantry hatch', r.halfTop >= r.hatchRow && r.up <= r.hatchRow && r.area === 'dispensa', r);
      await shot('84-14-2-pizza-order.png');
      r = await ev(() => {
        const K = kit(), Rm = room(), p = P(), jump = k => { place(K.data.jars[k], 10); hop(1.2); };
        until(0.5, () => ({}));
        const wrong = [0, 1, 2, 3, 4, 5].find(k => Rm.order.indexOf(k) < 0); jump(wrong); const failed = Rm.fails >= 1 && !Rm.won;
        for (const k of Rm.order.slice()) jump(k);
        return { failed, won: Rm.won };
      });
      check('14-2 secret: a wrong jar burns the pizza; the three on the ticket make it', r.failed && r.won, r);
      await shot('85-14-2-pizza-made.png');
      r = await ev(() => { const gate = S().entities.find(e => e.constructor.name === 'Gate' && e.secret); return { gate: !!gate }; });
      check('14-2 secret: the way on to 14-6 (a secret gate) is in the pantry', r.gate, r);
      r = await ev(() => { const d = S().entities.find(e => e instanceof window.BRADY_TYPES.portal && e.target && e.target.area === 0); place(Math.floor(d.cx / 32), Math.floor((d.y + d.h) / 32) - 1); upDoor(); waitArea('cucina'); const an = S().level.areas[0].anchors.pantryBack, hatch = S().entities.find(e => e.s && e.s.look === 'itPantry'); return { area: S().area.aid, row: feetRow(), hatchRow: Math.floor((hatch.y + hatch.h) / 32), dx: Math.round((P().cx - an.x) / 32) }; });
      check('14-2 secret: the pantry door drops back to the kitchen floor (not up on the loft)', r.area === 'cucina' && r.row > r.hatchRow + 3 && Math.abs(r.dx) <= 2, r);
      // 14-3: walk into the cracked wall; the bell echo; out a storey higher
      await ev(() => { play('14-3'); place(6, 65); sim(0.3); });
      await shot('86-14-3-tell-cracked-wall.png');
      r = await ev(() => { place(3, 65); until(2, () => ({ left: true }), () => S().area.aid === 'store'); waitArea('store'); return { area: S().area.aid }; });
      check('14-3 secret: walking into the cracked stretch of wall goes in (no door, no Up)', r.area === 'store', r);
      r = await ev(() => {
        const K = kit(), Rm = room(), ring = k => { place(K.data.bells[k], 10); hop(1.4); };
        until(10, () => ({}), () => Rm.phase === 'echo');
        const wrong = [0, 1, 2].find(k => k !== Rm.tune[0]); ring(wrong); const failed = Rm.fails >= 1;
        until(10, () => ({}), () => Rm.phase === 'echo');
        for (const k of Rm.tune.slice()) ring(k);
        return { failed, won: Rm.won };
      });
      check('14-3 secret: a wrong bell is a CLANG and the tune plays again; ringing it back wins', r.failed && r.won, r);
      await shot('87-14-3-bell-echo.png');
      r = await ev(() => { const d = S().entities.find(e => e.s && e.s.look === 'itTowerDoor' && e.target && e.target.area === 0 && /storeOut/.test(e.s.targetRef || '')); place(Math.floor(d.cx / 32), Math.floor((d.y + d.h) / 32) - 1); upDoor(); waitArea('torre'); return { area: S().area.aid, row: feetRow() }; });
      check('14-3 secret: the store\'s second door comes out a storey higher', r.area === 'torre' && r.row === 57, r);
      // 14-4: the column of song up through the gap in the ceiling, the gantry run, the opera hats, the rope down
      await ev(() => { play('14-4'); place(14, 11); sim(0.2); });
      await shot('88-14-4-tell-ceiling-gap.png');
      r = await ev(() => { const d = ents('ItDiva').find(q => q.gi === 0); until(8, () => ({}), () => d.phase().singing && d.phase().k < 0.3); place(19, 11); until(4, k => ({ jump: true, jumpPressed: k === 0 }), () => S().area.aid === 'loggione'); waitArea('loggione'); return { area: S().area.aid }; });
      check('14-4 secret: riding the song up through the gap in the ceiling comes out in the gantry', r.area === 'loggione', r);
      await shot('89-14-4-gantry.png');
      r = await ev(() => { const d = S().entities.find(e => e.s && e.s.look === 'itStageDoor'); runTo(d.cx, 14); upDoor(); waitArea('loggia'); return { area: S().area.aid }; });
      check('14-4 secret: along the gantry (spike pits, sour notes) to the royal box door', r.area === 'loggia', r);
      r = await ev(() => {
        const K = kit(), Rm = room(), p = P(), pickCup = c => { p.x = c.x - p.w / 2; p.y = (K.data.row + 1) * 32 - 34 - p.h + 4; p.vy = 4 * 32; sim(0.05); };
        place(K.data.slots[1] - 2, K.data.row); until(20, () => ({}), () => Rm.phase === 'pick'); pickCup(Rm.cups.find(c => c.k !== Rm.prizeCup)); const failed = !Rm.won && !!Rm.joke;
        place(K.data.slots[1] - 2, K.data.row); until(30, () => ({}), () => Rm.phase === 'pick'); pickCup(Rm.cups.find(c => c.k === Rm.prizeCup)); sim(0.3);
        return { failed, won: Rm.won };
      });
      check('14-4 secret: the opera hats: a wrong hat is a joke, the right one wins', r.failed && r.won, r);
      await shot('90-14-4-opera-hats.png');
      r = await ev(() => { const d = S().entities.find(e => e instanceof window.BRADY_TYPES.portal && e.target); place(Math.floor(d.cx / 32), Math.floor((d.y + d.h) / 32) - 1); upDoor(); waitArea('loggione'); place(42, 10); until(3, () => ({ right: true }), () => S().area.aid === 'teatro'); waitArea('teatro'); return { area: S().area.aid, x: Math.floor(P().cx / 32), row: feetRow() }; });
      check('14-4 secret: back on the gantry, the rope through the hole drops into the house by the pit balcony', r.area === 'teatro' && r.x >= 36 && r.x <= 46, r);
      // 14-5: the curtain in the wings, the tenor's gold record (a prank), then the real cage
      await ev(() => { play('14-5'); const c = S().entities.find(e => e.constructor.name === 'TourCurtain'); place(Math.floor(c.cx / 32) - 3, 13); sim(0.3); });
      await shot('91-14-5-tell-curtain.png');
      r = await ev(() => { const c = S().entities.find(e => e.constructor.name === 'TourCurtain'); place(Math.floor(c.cx / 32), 13); upDoor(); waitArea('camerino'); const Rm = room(); const ch = S().entities.find(e => e.constructor.name === 'TourRoomChest'); until(9, k => ({ right: P().cx < ch.cx - 4, left: P().cx > ch.cx + 14, jump: true, jumpPressed: P().onGround && k % 40 === 0 }), () => Rm.won); return { area: S().area.aid, won: Rm.won }; });
      check('14-5 secret: behind the curtain, the gold record is a prank, then the cage opens', r.area === 'camerino' && r.won, r);
      await shot('92-14-5-dressing-room.png');
      // 14-6: the pit with no coffee: drop in; the bean store; out further along
      await ev(() => { fresh(); play('14-6'); const t = ents('ItSackTell')[0]; for (const d of ents('TourDoom')) d.front = -1e5; place(Math.floor(t.x / 32) - 3, 13); sim(0.2); });
      await shot('93-14-6-tell-sack-pit.png');
      r = await ev(() => { const t = ents('ItSackTell')[0]; for (const d of ents('TourDoom')) d.front = -1e5; place(Math.floor(t.x / 32) - 1, 13); until(3, () => ({ right: P().cx < t.cx }), () => S().area.aid === 'retro'); waitArea('retro'); return { area: S().area.aid, dead: P().dead }; });
      check('14-6 secret: dropping into the pit with the bean sacks (no coffee) lands in the bean store', r.area === 'retro' && !r.dead, r);
      r = await ev(() => {
        const K = kit(), Rm = room(); place(10, 10); until(4, () => ({}), () => Rm.phase === 'run');
        until(K.data.t + 4, () => ({}), () => Rm.phase === 'rest'); const failed = Rm.phase === 'rest' && !Rm.won;
        until(4, () => ({}), () => Rm.phase === 'run');
        for (const tk of K.data.tokens) { const e = S().entities.find(q => q.id === tk.id && !q.remove); if (e) { place(tk.tx, tk.ty); sim(0.1); } }
        sim(0.3); return { failed, won: Rm.won };
      });
      check('14-6 secret: the bean store: the clock runs out once, then all six beans in time', r.failed && r.won, r);
      await shot('94-14-6-bean-store.png');
      r = await ev(() => { const d = S().entities.find(e => e instanceof window.BRADY_TYPES.portal && e.target); place(Math.floor(d.cx / 32), Math.floor((d.y + d.h) / 32) - 1); upDoor(); waitArea('bar'); const an = S().level.areas[0].anchors.retroBack, t = ents('ItSackTell')[0]; return { area: S().area.aid, ahead: P().cx > t.cx + 64, dx: Math.round((P().cx - an.x) / 32) }; });
      check('14-6 secret: the store\'s door comes out further along the bar', r.area === 'bar' && r.ahead && Math.abs(r.dx) <= 2, r);
    });
    /* ---------- the land's map ---------- */
    await run('map', async () => {
      const r = await ev(() => { for (const id of ['14-1', '14-2', '14-3', '14-4', '14-5', '14-6']) window.BRADY.Save.data.unlocked[id] = true; window.BRADY.goToMap('world', 1, '14-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { cc: s.ow && s.ow.cc }; });
      check('Italy has its own walkable map', r.cc === 'it', r);
      await shot('60-italy-map.png');
    });
  });
  await session({ width: 390, height: 844 }, async (page, shot, run) => {
    const ev = (f, a) => page.evaluate(f, a);
    await run('p-scoot', async () => { await ev(() => { fresh(); play('14-1'); sim(1.0); }); await shot('70-portrait-14-1.png'); });
    await run('p-boss', async () => { await ev(() => { play('14-5'); toArea('palco'); place(12, 13); sim(2.4); const b = S().entities.find(e => e.boss); if (b) { b.x = P().x + 110; b.dir = -1; b.go('sing'); sim(1.0); } }); await shot('71-portrait-14-5-tenor.png'); });
    await run('p-map', async () => { await ev(() => { for (const id of ['14-1', '14-2', '14-3']) window.BRADY.Save.data.unlocked[id] = true; window.BRADY.goToMap('world', 1, '14-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } }); await shot('72-portrait-italy-map.png'); });
  });
  console.log(failures ? `${failures} ITALY CHECK(S) FAILED` : 'ALL ITALY CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
