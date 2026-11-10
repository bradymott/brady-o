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
  // gear (§5): each item does its thing, and the slots stack as §5.2 says
  await run('gear', async () => {
    const r = await page.evaluate(() => {
      const out = {}, B = window.BRADY, TT = window.BRADY_TOUR;
      const fresh = () => { lab('gear.stands'); const g = S(), p = P(); for (const e of g.entities) if (e.enemy) e.remove = true; sim(0.05); p.invuln = 0; return [g, p]; };
      const give = (p, id) => p.collect('gear:' + id);
      const foe = (g, p, dx, type) => { const C = window.BRADY_TYPES[type || 'mxElote']; const e = new C(g, { x: p.cx + dx, y: p.y + p.h, dir: -1 }); g.spawn(e); e.vx = 0; e.cool = 99; return e; };
      // plane: glide (slow fall), throw (hits at range, comes back)
      { let [g, p] = fresh(); give(p, 'plane'); p.y -= 8 * 32; p.vy = 0; sim(0.6, { jump: true }); const vy = p.vy / 32;
        [g, p] = fresh(); give(p, 'plane'); const e = foe(g, p, 150); sim(0.3); sim(0.05, { actionPressed: true }); sim(2.4); out.plane = { glideVy: +vy.toFixed(2), ko: e.dead || e.remove, back: !p.hands.thrown }; }
      // hard hat: dash knocks out, a hit takes the hat and not Brady's size
      { const [g, p] = fresh(); p.setPower(1, true); give(p, 'hat'); const e = foe(g, p, 90); const x0 = p.x; sim(0.05, { actionPressed: true }); sim(0.4); const ko = e.dead || e.remove; p.invuln = 0; p.hurt({ x: p.x + 40, w: 10 }); out.hat = { dash: Math.round(p.x - x0), ko, power: p.power, hat: !!p.hands }; }
      // knee pads: crawl moves while crouched
      { const [g, p] = fresh(); p.setPower(1, true); give(p, 'pads'); const x0 = p.x; sim(0.8, { down: true, right: true }); out.pads = { moved: Math.round(p.x - x0), crouch: p.crouch, h: p.h }; }
      // magnet: coins fly in
      { const [g, p] = fresh(); const A = g.area, tx = Math.floor(p.cx / 32) + 3, ty = Math.floor(p.y / 32); A.tiles[ty * A.W + tx] = 14; const c0 = g.picks; give(p, 'magnet'); sim(1); out.magnet = { buff: Math.round(p.buffs.magnet), coins: g.picks - c0 }; }
      // fins: faster in water (Mexico's cenote)
      { const sw = withFins => { B.Save.data.lives = 9; const lv = B.getLevel(1, 3); const g = new B.Play(lv, {}); B.Game.setScene(g); sim(2); const p = P(); p.invuln = 999; for (const e of g.entities) if (e.enemy) e.remove = true; if (withFins) p.collect('gear:fins'); sim(0.8, { right: true }); return p.vx / 32; }; out.fins = { without: +sw(false).toFixed(2), with: +sw(true).toFixed(2) }; }
      // box: hold down to hide, slow shuffle
      { const [g, p] = fresh(); give(p, 'box'); const x0 = p.x; sim(0.6, { down: true, right: true }); out.box = { boxed: p.boxed, moved: Math.round(p.x - x0) }; }
      // kazoo: a honk stuns the enemy in front
      { const [g, p] = fresh(); give(p, 'kazoo'); const e = foe(g, p, 60); sim(0.05, { actionPressed: true }); out.kazoo = { stunned: e.stunT > 0 }; }
      // wand: a bubble traps an enemy and its top holds Brady
      { const [g, p] = fresh(); give(p, 'wand'); const e = foe(g, p, 50); sim(0.05, { actionPressed: true }); sim(0.4); const b = g.entities.find(x => x.constructor.name === 'GearBubble'); out.wand = { bubble: !!b, trapped: !!(b && b.trapped === e) }; }
      // sundial: the world at half speed
      { const [g, p] = fresh(); give(p, 'sundial'); out.sundial = { ws: g.worldScale() }; }
      // globe: snow caps the enemy (no spikes), five shakes
      { const [g, p] = fresh(); give(p, 'globe'); const e = foe(g, p, 50, 'mxArmadillo'); sim(0.05, { actionPressed: true }); sim(0.3); out.globe = { capped: e.snowCapT > 0, uses: p.hands && p.hands.uses }; }
      // stacking (§5.2): a star blocks; gear swaps into the Backpack; a hit drops HANDS before FORM; the Backpack swaps back
      { const [g, p] = fresh(); p.setPower(1, true); give(p, 'kazoo'); give(p, 'wand'); const pack = p.pack, hands = p.hands && p.hands.id;
        p.star = 2; p.hurt({ x: p.x + 40, w: 10 }); const starBlock = p.hands && p.hands.id === 'wand' && p.power === 1; p.star = 0; p.invuln = 0;
        p.hurt({ x: p.x + 40, w: 10 }); const dropped = !p.hands && p.power === 1 && g.entities.some(e => e.dropped);
        p.invuln = 0; p.hurt({ x: p.x + 40, w: 10 }); const formDown = p.power === 0;
        const swapped = p.usePack() && p.hands && p.hands.id === 'kazoo' && !p.pack;
        p.collect('sig:taco'); const sigInHands = p.sig && p.sig.id === 'taco' && p.pack === 'gear:kazoo' && !p.hands;
        out.stack = { pack, hands, starBlock, dropped, formDown, swapped, sigInHands }; }
      return out;
    });
    check('paper plane: glide caps the fall, the thrown plane knocks out and comes back', r.plane.glideVy <= 1.7 && r.plane.ko && r.plane.back, r.plane);
    check('hard hat: shoulder dash knocks out; it takes a hit for Brady', r.hat.dash > 80 && r.hat.ko && r.hat.power === 1 && !r.hat.hat, r.hat);
    check('crawl pads: Brady crawls while crouched', r.pads.moved > 60 && r.pads.crouch, r.pads);
    check('magnet belt: a 30 s buff that pulls coins in', r.magnet.buff > 25 && r.magnet.coins >= 1, r.magnet);
    check('flipper fins: swim speed x1.6', r.fins.with > r.fins.without * 1.4, r.fins);
    check('cardboard box: hold down to hide, a slow shuffle', r.box.boxed && r.box.moved > 10 && r.box.moved < 100, r.box);
    check('kazoo: a honk stuns', r.kazoo.stunned, r.kazoo);
    check('bubble wand: a bubble traps an enemy', r.wand.bubble && r.wand.trapped, r.wand);
    check('pocket sundial: the world runs at half speed', r.sundial.ws === 0.5, r.sundial);
    check('snow globe: snow caps an enemy, a shake is used', r.globe.capped && r.globe.uses === 4, r.globe);
    check('slots (§5.2): new gear sends the old to the Backpack; star blocks; a hit drops HANDS, then FORM; the Backpack swaps; a signature item shares HANDS', r.stack.pack === 'gear:kazoo' && r.stack.hands === 'wand' && r.stack.starBlock && r.stack.dropped && r.stack.formDown && r.stack.swapped && r.stack.sigInHands, r.stack);
    // pictures: each item in use
    const pics = [['plane', 'p.y -= 6 * 32; p.vy = 0; sim(0.5, { jump: true, right: true });'], ['hat', 'p.setPower(1, true); sim(0.05, { actionPressed: true }); sim(0.12);'], ['pads', 'p.setPower(1, true); sim(0.5, { down: true, right: true });'],
      ['box', 'sim(0.4, { down: true });'], ['kazoo', 'sim(0.05, { actionPressed: true }); sim(0.1);'], ['wand', 'sim(0.05, { actionPressed: true }); sim(0.5); sim(0.05, { actionPressed: true }); sim(0.3);'], ['globe', 'sim(0.05, { actionPressed: true }); sim(0.4);'], ['sundial', 'sim(0.3);'], ['magnet', 'sim(0.3);']];
    for (const [id, act] of pics) {
      await page.evaluate(([id, act]) => { lab('gear.stands'); const g = S(), p = P(); for (const e of g.entities) if (e.enemy) e.remove = true; const C = window.BRADY_TYPES.mxPepper; const e = new C(g, { x: p.cx + 120, y: p.y + p.h, dir: -1 }); g.spawn(e); e.cool = 99; p.collect('gear:' + id); if (id !== 'kazoo') p.pack = 'gear:kazoo'; sim(0.2); eval(act); freeze(); }, [id, act]);
      await shot(`gear-${id}.png`);
    }
    await page.evaluate(() => { lab('gear.stands'); const g = S(), p = P(); const st = g.entities.filter(e => e.constructor.name === 'TourGearStand'); p.x = st[2].cx - 60; sim(0.3); g.camX = Math.max(0, st[1].cx - 120); freeze(); });
    await shot('gear-stands.png');
  });
  // the object library: each object works in the game, and a picture of it
  await run('objects', async () => {
    const r = await page.evaluate(() => {
      const out = {};
      const go = n => { lab('objects.' + n); const g = S(), p = P(); for (const e of g.entities) if (e.enemy) e.remove = true; sim(0.05); return [g, p]; };
      const ent = (g, name) => g.entities.find(e => e.constructor.name === name);
      const to = (p, e, dx) => { p.x = e.cx + (dx || 0) - p.w / 2; p.y = e.y + e.h - p.h - 2; p.vx = p.vy = 0; sim(0.15); };
      { const [g, p] = go('keyLock'); const k = ent(g, 'Key'), L = ent(g, 'Lock'); to(p, k); sim(0.1); to(p, L, -30); sim(0.4, { right: true }); out.keyLock = { key: g.keys.has('k1'), open: L.open || L.remove }; }
      { const [g, p] = go('lever'); const lv = ent(g, 'TourLever'), sh = ent(g, 'TourShutter'); to(p, lv); sim(0.05, { actionPressed: true }); sim(0.5); out.lever = { pulled: lv.pulled, open: sh.open }; }
      { const [g, p] = go('timedDoor'); const lv = ent(g, 'TourLever'), sh = ent(g, 'TourShutter'); to(p, lv); sim(0.05, { actionPressed: true }); const open1 = sh.open; p.x -= 64; sim(7); out.timedDoor = { open1, closedAgain: !sh.open }; }
      { const [g, p] = go('toggleBridge'); const sw = ent(g, 'TourToggleSwitch'); const G = g.area.toggles[0], r0 = G.B[0]; const before = g.area.tiles[r0[1] * g.area.W + r0[0]]; to(p, sw); sim(0.05, { actionPressed: true }); sim(0.2); out.toggle = { before, after: g.area.tiles[r0[1] * g.area.W + r0[0]] }; }
      { const [g, p] = go('valve'); const sw = ent(g, 'TourToggleSwitch'); const w0 = g.area.waterTop; to(p, sw); sim(0.05, { actionPressed: true }); sim(5); out.valve = { from: Math.round(w0 / 32), to: Math.round(g.area.waterTop / 32) }; }
      { const [g, p] = go('plate'); const c = g.entities.find(e => e.prop), pl = ent(g, 'TourPlate'), sh = ent(g, 'TourShutter'); p.x = c.x - p.w - 2; p.y = c.y + c.h - p.h; for (let k = 0; k < 40 && !pl.down; k++) sim(0.1, { right: true }); sim(0.3); out.plate = { down: pl.down, open: sh.open }; }
      { const [g, p] = go('zip'); const z = ent(g, 'TourZip'); p.x = z.hx - p.w / 2 - 20; p.y = z.y0 + 4 * 32 - p.h; p.vx = p.vy = 0; sim(0.2); sim(0.05, { jump: true, jumpPressed: true, right: true }); for (let k = 0; k < 40 && !z.riding; k++) sim(0.02, { jump: true }); const riding = z.riding; sim(2.5); out.zip = { riding, end: Math.round(p.cx / 32), endTile: Math.round(z.x1 / 32), alive: !p.dead }; }
      { const [g, p] = go('catapult'); const c = ent(g, 'TourCatapult'); p.x = c.cx - p.w / 2; p.y = c.y - p.h - 2; sim(0.3); sim(0.05, { actionPressed: true }); sim(2.5); out.catapult = { x: Math.round(p.cx / 32), target: Math.round(c.s.x / 32 + c.to[0]), ground: p.onGround, alive: !p.dead }; }
      { const [g, p] = go('ring'); const rg = ent(g, 'TourRing'); p.x = rg.hx - p.w / 2; p.y = rg.hy + 4; p.vy = 1; p.onGround = false; sim(0.02); const hung = !!p.ringed;
        for (let k = 0; k < 200 && p.ringed && !(rg.th > 0.5 && rg.av > 0); k++) sim(0.01); sim(0.05, { jumpPressed: true, jump: true, right: true }); sim(1.4, { right: true }); out.ring = { hung, x: Math.round(p.cx / 32), far: Math.round(rg.ax / 32) + 6, alive: !p.dead, ground: p.onGround }; }
      { const [g, p] = go('fan'); const f = ent(g, 'TourFan'); to(p, f); const y0 = p.y; sim(1.2); out.fan = { rose: Math.round((y0 - p.y) / 32) }; }
      { const [g, p] = go('fanToggle'); const f = ent(g, 'TourFan'), sw = ent(g, 'TourToggleSwitch'); to(p, f); const y0 = p.y; sim(0.8); const off = Math.round((y0 - p.y) / 32); to(p, sw); sim(0.05, { actionPressed: true }); to(p, f); const y1 = p.y; sim(1.2); out.fanToggle = { off, on: Math.round((y1 - p.y) / 32) }; }
      { const [g, p] = go('breakwallHat'); const w = ent(g, 'TourBreakWall'); p.collect('gear:hat'); to(p, w, -60); sim(0.05, { actionPressed: true, right: true }); sim(0.5, { right: true }); out.breakwall = { broken: w.remove }; }
      { const [g, p] = go('teleport'); const tps = g.entities.filter(e => e.constructor.name === 'TourTeleport'); to(p, tps[0]); sim(0.05, { upPressed: true, up: true }); sim(3); out.teleport = { x: Math.round(p.cx / 32), dest: Math.round(tps[1].cx / 32) }; }
      { const [g, p] = go('surfaces'); const pad = g.entities.find(e => e.kind === 'bounce'); to(p, pad, 16); p.y -= 40; sim(0.4); out.bounce = { vy: Math.round(p.vy / 32), air: !p.onGround }; }
      return out;
    });
    check('key and lock: the key opens the lock', r.keyLock.key && r.keyLock.open, r.keyLock);
    check('lever: a pull opens its shutter for good', r.lever.pulled && r.lever.open, r.lever);
    check('timed door: opens, then shuts again after its time', r.timedDoor.open1 && r.timedDoor.closedAgain, r.timedDoor);
    check('toggle: the switch brings the bridge in', r.toggle.before === 0 && r.toggle.after !== 0, r.toggle);
    check('valve: the water rises to the high mark', r.valve.to <= 7 && r.valve.from > 14, r.valve);
    check('plate: pushing the crate onto it opens the shutter', r.plate.down && r.plate.open, r.plate);
    check('zip line: jump into the handle, ride to the end', r.zip.riding && Math.abs(r.zip.end - r.zip.endTile) <= 3 && r.zip.alive, r.zip);
    check('catapult: THROW launches Brady to the landing ledge', Math.abs(r.catapult.x - r.catapult.target) <= 2 && r.catapult.alive, r.catapult);
    check('ring: jump in, swing, let go across the pit', r.ring.hung && r.ring.x >= r.ring.far && r.ring.alive, r.ring);
    check('fan: the updraft lifts Brady', r.fan.rose >= 5, r.fan);
    check('fan on a toggle: off until the switch turns it on', r.fanToggle.off < 1 && r.fanToggle.on >= 5, r.fanToggle);
    check('breakwall: the hard hat dash smashes it', r.breakwall.broken, r.breakwall);
    check('teleport pair: in one, out of the other', Math.abs(r.teleport.x - r.teleport.dest) <= 1, r.teleport);
    check('bounce pad: a bounce', r.bounce.air, r.bounce);
    const pics = { keyLock: 'Key', lever: 'TourLever', timedDoor: 'TourLever', toggleBridge: 'TourToggleSwitch', valve: 'TourToggleSwitch', plate: 'TourPlate', zip: 'TourZip', catapult: 'TourCatapult', ring: 'TourRing', fan: 'TourFan', breakwallHat: 'TourBreakWall', teleport: 'TourTeleport', surfaces: 'TourSurfaceSkin', gimmicks: 'Geyser' };
    for (const [n, cls] of Object.entries(pics)) {
      await page.evaluate(([n, cls]) => { lab('objects.' + n); const g = S(), p = P(); const e = g.entities.find(x => x.constructor.name === cls) || g.entities[0]; p.x = e.cx - 70; p.y = e.y + e.h - p.h; sim(0.3); if (n === 'valve') { const sw = g.entities.find(x => x.constructor.name === 'TourToggleSwitch'); g.flipToggle(sw.gi); sim(3); } if (n === 'toggleBridge') { g.flipToggle(0); sim(0.5); } freeze(); }, [n, cls]);
      await shot(`obj-${n}.png`);
    }
  });
  // the two levels rewritten in the v2 format (§7.5): Mexico 1-1 and Ecuador 2-2
  await run('levels', async () => {
    const lvShot = async (id, name, fn) => {
      await page.evaluate(([id, fn]) => { const B = window.BRADY; B.Save.data.lives = 9; const [w, i] = id.split('-').map(Number); const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(2); const p = P(); p.invuln = 999; (new Function('g', 'p', fn))(g, p); g.camX = Math.max(0, Math.min(g.area.W * 32 - window.BRADY.Game.viewW, p.cx - window.BRADY.Game.viewW * 0.42)); g.camY = g.camTargetY(true); sim(0.1); freeze(); }, [id, fn]);
      await shot(name);
    };
    await lvShot('1-1', 'lv-1-1-start.png', '');
    await lvShot('1-1', 'lv-1-1-roof.png', "const A = g.area; standAt(60, 2); sim(0.6);");
    await lvShot('1-1', 'lv-1-1-plaza.png', "const gy = g.entities.find(e => e.constructor.name === 'Geyser'); standAt(Math.floor(gy.cx / 32) - 4, 14); sim(0.4);");
    await lvShot('1-1', 'lv-1-1-trapdoor.png', "const td = g.entities.find(e => e.constructor.name === 'TourTrapdoor'); p.x = td.cx - 110; p.y = td.y - p.h; sim(0.3);");
    await lvShot('1-1', 'lv-1-1-bodega.png', "const door = g.entities.find(e => e.constructor.name === 'TourTrapdoor'); g.enterPortal(door.portal); sim(3); p.invuln = 0; const q = P(); q.x += 300; sim(0.5);");
    await lvShot('2-2', 'lv-2-2-start.png', '');
    await lvShot('2-2', 'lv-2-2-vines.png', "standAt(30, 2); sim(0.5);");
    await lvShot('2-2', 'lv-2-2-curtain.png', "const c = g.entities.find(e => e.constructor.name === 'TourCurtain'); p.x = c.cx - 90; p.y = c.y + c.h - p.h; sim(0.3);");
    await lvShot('2-2', 'lv-2-2-swing.png', "const c = g.entities.find(e => e.constructor.name === 'TourCatapult'); p.x = c.cx - 60; p.y = c.y - p.h; sim(0.3);");
    await lvShot('2-2', 'lv-2-2-treehouse.png', "const d = g.entities.find(e => e.s && e.s.secretDoor); g.enterPortal(d); sim(3); const q = P(); q.x += 260; sim(0.4);");
    const r = await page.evaluate(() => {
      const B = window.BRADY, out = {};
      for (const id of ['1-1', '2-2']) { const [w, i] = id.split('-').map(Number); const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); for (let k = 0; k < 600; k++) g.update(1 / 120); g.draw(B.Game.ctx); out[id] = { areas: g.level.areas.length, v2: !!g.level.v2, dead: g.player.dead }; }
      return out;
    });
    check('Mexico 1-1 and Ecuador 2-2 run in the v2 format', r['1-1'].v2 && r['2-2'].v2 && r['1-1'].areas === 2 && r['2-2'].areas === 3 && !r['1-1'].dead && !r['2-2'].dead, r);
  });
  check('no page errors', errors.length === 0, errors.slice(0, 5));
  console.log(failures ? `${failures} LAB CHECK(S) FAILED` : 'ALL LAB CHECKS PASSED');
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
