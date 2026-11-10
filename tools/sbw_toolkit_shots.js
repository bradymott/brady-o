// Screenshots of the level toolkit's fixture levels (tools/fixtures/sbw_lab_levels.js) in the real game, plus a few
// scripted in-game checks of the new systems (trapdoor, rail switch, digging, water lines, cameras).
// usage: BRADY_DIST=<dist> node tools/sbw_toolkit_shots.js <shotsDir> [name ...]
// Full resolution is pinned before every capture (the adaptive quality would otherwise drop it on a busy machine).
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const out = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'lab'));
const want = process.argv.slice(3);
fs.mkdirSync(out, { recursive: true });
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const labSrc = fs.readFileSync(path.join(__dirname, 'fixtures', 'sbw_lab_levels.js'), 'utf8');
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) failures++; };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + appPage);
  await page.waitForTimeout(1500);
  await page.evaluate(labSrc);
  await page.evaluate(() => {
    window.sim = (sec, inp) => {
      const B = window.BRADY, G = B.Game, I = B.Input;
      const steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (inp.jumpPressed && k > 0) I.jumpPressed = false; if (inp.actionPressed && k > 0) I.actionPressed = false; if (inp.upPressed && k > 0) I.upPressed = false; }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) I[key] = false;
    };
    window.S = () => window.BRADY.Game.scene; window.P = () => window.BRADY.Game.scene.player;
    window.lab = (path, opts) => {
      const B = window.BRADY, T = window.BRADY_TOUR; let spec = window.SBW_LAB; for (const k of path.split('.')) spec = spec[k]; if (spec.spec) spec = spec.spec;
      const lvl = T.TourBuild.fromSpec(T.Tour.countries[spec.host || 'mx'], spec, 90);
      B.Save.data.lives = 9; const g = new B.Play(lvl, opts || {}); B.Game.setScene(g); sim(2); g.player.invuln = 999; return lvl;
    };
    // put Brady on the first standable tile at or below row ty in column tx (area tiles), camera snapped
    window.standAt = (tx, ty, area) => {
      const g = S(), A = g.area, p = P();
      for (let y = Math.max(2, ty); y < A.H; y++) { const t = A.tiles[y * A.W + tx], up = A.tiles[(y - 1) * A.W + tx], up2 = A.tiles[(y - 2) * A.W + tx]; if ((t !== 0 && t !== 14 && t !== 15 && t !== 6) && (up === 0 || up === 14) && (up2 === 0 || up2 === 14)) { p.x = tx * 32 + 16 - p.w / 2; p.y = y * 32 - p.h; p.vx = p.vy = 0; break; } }
      g.camX = Math.max(0, Math.min(A.W * 32 - window.BRADY.Game.viewW, p.cx - window.BRADY.Game.viewW * 0.42)); g.camY = g.camTargetY(true);
      if (g.weather && g.weather.reset) g.weather.reset(g.camX, g.camY, window.BRADY.Game.viewW, window.BRADY.Game.viewH);
      return { x: p.x, y: p.y };
    };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); await page.waitForTimeout(250); await page.screenshot({ path: path.join(out, name) }); };
  const run = async (name, fn) => { if (want.length && !want.some(w => name.startsWith(w))) return; try { await fn(); } catch (e) { check(name + ' runs', false, String(e.message).slice(0, 300)); } };

  // every generator fixture: start, and a later view
  const gens = await page.evaluate(() => Object.keys(window.SBW_LAB.gens));
  for (const g of gens) await run('gen-' + g, async () => {
    const info = await page.evaluate(n => { const lvl = lab('gens.' + n); const A = S().area; sim(0.3); return { W: A.W, H: A.H, gen: A.gen, areas: lvl.areas.length, problems: lvl.problems }; }, g);
    check(`gen ${g} runs in the game`, info.areas >= 1, info);
    await page.evaluate(() => freeze());
    await shot(`gen-${g}-a.png`);
    await page.evaluate(() => { const g = S(); g.update = g._upd; const A = g.area; if (A.H > A.W) standAt(Math.floor(A.W / 2), Math.floor(A.H * 0.55)); else standAt(Math.floor(A.W * 0.55), 2); sim(0.2); freeze(); });
    await shot(`gen-${g}-b.png`);
  });
  // the trapdoor: stomp the crate, stand on the hatch, press down: Brady drops into the cellar room
  await run('trapdoor', async () => {
    const r = await page.evaluate(() => {
      lab('gens.layered'); const g = S(), p = P(); const td = g.entities.find(e => e.constructor.name === 'TourTrapdoor');
      p.x = td.cx - p.w / 2; p.y = td.y - 30 - p.h - 40; p.vy = 0; sim(0.8);
      const crateGone = !td.crate; sim(0.3, { down: true }); sim(1.2, { down: true }); sim(2);
      return { crateGone, area: g.area.aid, room: g.area.role };
    });
    check('trapdoor: stomping the crate clears the hatch, down drops Brady into the cellar room', r.crateGone && r.area === 'cellarRoom', r);
    await page.evaluate(() => freeze()); await shot('obj-trapdoor-room.png');
    await page.evaluate(() => { lab('gens.layered'); const g = S(), p = P(); const td = g.entities.find(e => e.constructor.name === 'TourTrapdoor'); p.x = td.cx - 90; p.y = td.y - p.h; sim(0.3); freeze(); });
    await shot('obj-trapdoor.png');
  });
  // the rail: the lever sends the cart up the fork
  await run('rail', async () => {
    const r = await page.evaluate(() => {
      lab('gens.rail'); const g = S(), p = P(); const sw = g.entities.find(e => e.constructor.name === 'TourRailSwitch'); const cart = g.entities.find(e => e.constructor.name === 'TourRailCart');
      const before = !!g.railState[0]; p.x = sw.cx - p.w / 2; p.y = sw.y + sw.h - p.h; sim(0.05, { actionPressed: true }); const after = !!g.railState[0];
      const f = cart.forks[0]; cart.x = (f.x0 + 10) * 32; sim(0.1); const yUp = cart.y; return { before, after, deckRow: Math.round(yUp / 32), upper: f.upper };
    });
    check('rail: the lever post flips the fork and the cart rides the upper deck', !r.before && r.after && r.deckRow === r.upper, r);
    await page.evaluate(() => { const g = S(), p = P(); const cart = g.entities.find(e => e.constructor.name === 'TourRailCart'); p.x = cart.cx - p.w / 2; p.y = cart.y - p.h; sim(0.3); g.camX = Math.max(0, p.cx - 300); freeze(); });
    await shot('obj-rail-fork.png');
  });
  // digging: down + jump on soil drops Brady into the earth
  await run('dig', async () => {
    const r = await page.evaluate(() => {
      lab('gens.dig'); const g = S(), p = P(); standAt(24, 3); sim(0.3); const y0 = p.y;
      for (let k = 0; k < 3; k++) { sim(0.05, { down: true, jumpPressed: true, jump: true }); sim(0.5); }
      return { dropped: Math.round((p.y - y0) / 32), dead: p.dead };
    });
    check('dig: three stomps on soil dig Brady three tiles down', r.dropped >= 3 && !r.dead, r);
    await page.evaluate(() => freeze()); await shot('obj-dig.png');
  });
  // a rising flood: the water line climbs and Brady swims in it
  await run('flood', async () => {
    const r = await page.evaluate(() => { lab('gens.riseFlood'); const g = S(), p = P(); const w0 = g.area.waterTop; sim(9); return { rose: g.area.waterTop < w0 - 32, swim: p.inWater || p.y + p.h < g.area.waterTop }; });
    check('rising water climbs the tower', r.rose, r);
    await page.evaluate(() => { const g = S(), p = P(); p.y = g.area.waterTop - 10; p.vy = 0; sim(0.4); freeze(); });
    await shot('sys-flood.png');
  });
  // the camera modes: shaft (Brady high in the view), room (one maze cell), lanes (the lane floor)
  await run('cameras', async () => {
    const r = await page.evaluate(() => {
      const out = {};
      lab('gens.shaft'); { const g = S(), p = P(); p.y = 40 * 32; p.vy = 0; sim(1.2); out.shaft = Math.round((p.y + p.h - g.camY) / window.BRADY.Game.viewH * 100); }
      lab('gens.maze'); { const g = S(); out.room = { camX: Math.round(g.camX), cell: 26 * 32 }; }
      lab('gens.layered'); { const g = S(), p = P(); standAt(40, 10); sim(1.5); out.lanes = Math.round(g.camY / 32); }
      return out;
    });
    check('cameras: the shaft keeps Brady in the upper half; the lanes camera frames the roof lane', r.shaft < 60 && r.lanes < 8, r);
  });
  check('no page errors', errors.length === 0, errors.slice(0, 5));
  console.log(failures ? `${failures} LAB CHECK(S) FAILED` : 'ALL LAB CHECKS PASSED');
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
