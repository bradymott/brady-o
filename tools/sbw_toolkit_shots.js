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
  // area systems and level-flow entities (W9, W10 batch B): each scripted in the game
  await run('systems', async () => {
    const r = await page.evaluate(() => {
      const out = {};
      const go = n => { lab('systems.' + n); const g = S(), p = P(); for (const e of g.entities) if (e.enemy && !e.constructor.name.startsWith('Tour') ) e.remove = true; sim(0.05); return [g, p]; };
      const ent = (g, name) => g.entities.find(e => e.constructor.name === name);
      const to = (p, e, dx) => { p.x = e.cx + (dx || 0) - p.w / 2; p.y = e.y + e.h - p.h - 2; p.vx = p.vy = 0; sim(0.15); };
      { const [g, p] = go('flip'); const fl = ent(g, 'TourFlipLine'); p.x = fl.x - 3 * 32; p.y = (g.area.H - 4) * 32 - p.h; let up = false, minY = 1e9; for (let k = 0; k < 120; k++) { sim(0.05, { right: true }); if (p.flipped) up = true; minY = Math.min(minY, p.y); } out.flip = { up, ceiling: Math.round(minY / 32), after: !p.flipped, alive: !p.dead, x: Math.round(p.cx / 32), end: Math.round((fl.x + fl.w) / 32) }; }
      { const [g, p] = go('lamp'); const L0 = g.collectLights(g.camX, g.camY)[0].r; sim(10); const L1 = g.collectLights(g.camX, g.camY)[0].r; const lp = ent(g, 'TourLampPost'); to(p, lp); sim(0.3); const L2 = g.collectLights(g.camX, g.camY)[0].r; out.lamp = { L0: Math.round(L0), L1: Math.round(L1), L2: Math.round(L2), dark: !!g.area.dark }; }
      { const [g, p] = go('phase'); const sw = ent(g, 'TourToggleSwitch'), pb = g.entities.filter(e => e.constructor.name === 'TourPhaseBlocks'); const day = pb.map(b => b.solid); const th0 = g.area.theme; to(p, sw); sim(0.05, { actionPressed: true }); sim(0.5); out.phase = { day, night: pb.map(b => b.solid), th0, th1: g.area.theme, isNight: !!g.area.night }; }
      { const [g, p] = go('tide'); const w = []; for (let k = 0; k < 5; k++) { w.push(Math.round(g.area.waterTop / 32)); sim(3); } out.tide = { w }; }
      { const [g, p] = go('chase'); const d = ent(g, 'TourDoom'); const f0 = d.front; sim(4); const f1 = d.front; const x0 = p.x; for (let k = 0; k < 120 && p.x <= x0 + 10; k++) sim(0.05); out.chase = { moved: Math.round((f1 - f0) / 32), shoved: p.x > x0 + 10, alive: !p.dead }; }
      { const [g, p] = go('carry'); const ps = g.entities.filter(e => e.constructor.name === 'TourPedestal'), sh = ent(g, 'TourShutter'); to(p, ps[0]); sim(0.2); const carrying = !!p.carrying; to(p, ps[1]); sim(0.4); out.carry = { carrying, delivered: !!ps[1].done, open: sh.open }; }
      { const [g, p] = go('wheel'); const pl = g.entities.filter(e => e.isPlatform && e.orbit); const a = pl.map(e => Math.round(e.y)); sim(1); out.wheel = { n: pl.length, moved: pl.some((e, i) => Math.round(e.y) !== a[i]), hub: !!ent(g, 'TourWheelHub') }; }
      { const [g, p] = go('seesaw'); const s = ent(g, 'TourSeesaw'); const hi = -s.tilt; p.x = s.cx + hi * s.w * 0.38 - p.w / 2; p.y = s.y - 7 * 32; p.vy = 0; let vy = 0; for (let k = 0; k < 120; k++) { sim(0.01); vy = Math.min(vy, p.vy); } out.seesaw = { tilt: s.tilt, launched: Math.round(vy / 32) }; }
      { const [g, p] = go('balloon'); const b = ent(g, 'TourBalloon'); const y0 = b.y; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 4; p.vy = 0; sim(5); out.balloon = { rose: Math.round((y0 - b.y) / 32), onIt: p.ride === b }; }
      { const [g, p] = go('mirrors'); const ms = g.entities.filter(e => e.constructor.name === 'TourMirror'), rc = ent(g, 'TourSunReceptor'), sh = ent(g, 'TourShutter'); sim(0.2); const lit0 = rc.lit; for (const m of ms) if (m.state !== m.s.set) { m.cool = 0; m.turn(); } sim(0.3); out.mirrors = { lit0, lit: rc.lit, open: sh.open }; }
      { const [g, p] = go('hold'); const h = ent(g, 'TourHoldArena'); to(p, h); p.onGround = true; sim(0.5); const locked = !!g.bossLock, wall = g.area.tiles[(h.gy - 2) * g.area.W + h.tx0]; let foes = 0;
        for (let k = 0; k < 400 && h.state === 'run'; k++) { sim(0.25); for (const e of h.mine) if (!e.dead) { foes++; e.hit('star', p); e.remove = true; } }
        out.hold = { locked, wall, foes, waves: h.wave + 1, done: h.state === 'done', unlocked: !g.bossLock, open: g.area.tiles[(h.gy - 2) * g.area.W + h.tx0] }; }
      { const [g, p] = go('thief'); const th = ent(g, 'TourThief'), sh = ent(g, 'TourShutter'); to(p, th, -100); sim(2.5); const fled = th.stop; const cat = [];
        for (let n = 0; n < 3; n++) { for (let k = 0; k < 80 && th.hop; k++) sim(0.05); p.x = th.cx - p.w / 2; p.y = th.y - p.h - 40; p.vy = 4 * 32; p.prevBottom = p.y + p.h; sim(0.02); for (let k = 0; k < 30 && th.caught === n; k++) { p.x = th.cx - p.w / 2; p.y = th.y - p.h + 3; p.vy = 6 * 32; p.prevBottom = p.y + p.h - 4; sim(0.01); } cat.push(th.caught); }
        sim(0.5); out.thief = { fled, cat, open: sh.open, keys: [...g.keys] }; }
      { const [g, p] = go('rival'); const rv = ent(g, 'TourRival'); rv.state = 'count'; rv.ct = 3.4; const x0 = rv.cx; sim(3.2); const waited = Math.abs(rv.cx - x0) < 4; p.x = rv.cx - 6 * 32; sim(3); out.rival = { waited, ran: Math.round((rv.cx - x0) / 32), path: rv.path.length };
        lab('systems.rival'); const g2 = S(), p2 = P(), rv2 = ent(g2, 'TourRival'); rv2.ct = 0.01; sim(0.05); p2.x = rv2.gateX - 2 * 32; p2.y = rv2.y + rv2.h - p2.h; sim(0.3); out.rival.win = rv2.state; }
      { const [g, p] = go('sneak'); const w = g.entities.find(e => e.constructor.name === 'TourWatcher' && e.kind === 'light'); const as = ent(g, 'TourAlarmShutter'); p.x = w.cx - p.w / 2; p.y = (Math.floor((w.y + w.reach) / 32)) * 32 - p.h; let alarm = false, closed = false; for (let k = 0; k < 40; k++) { w.ang = 0; w.t = 0; sim(0.05); if (g.alarmT > 0) alarm = true; if (!as.open) closed = true; }
        lab('systems.sneak'); const g2 = S(), p2 = P(); const w2 = g2.entities.find(e => e.constructor.name === 'TourWatcher' && e.kind === 'light'), bush = ent(g2, 'TourHideSpot'); bush.x = w2.cx - bush.w / 2; p2.x = bush.cx - p2.w / 2; p2.y = bush.y + bush.h - p2.h; let alarm2 = false; for (let k = 0; k < 40; k++) { w2.ang = 0; w2.t = 0; sim(0.05, { down: true }); if (g2.alarmT > 0) alarm2 = true; } p2.inp.down = true;
        out.sneak = { alarm, closed, hiddenAlarm: alarm2, hid: window.BRADY_TOUR.TourSneak.hidden(p2) }; }
      { const [g, p] = go('ball'); const b = g.entities.find(e => e.ball), w = ent(g, 'TourBreakWall'); const s0 = b.scale; p.x = b.x - p.w - 2; p.y = b.y + b.h - p.h; for (let k = 0; k < 40 && !w.remove; k++) { if (b.vx < 40) { p.x = b.x - p.w - 20; p.y = b.y + b.h - p.h; p.vx = 6 * 32; sim(0.15, { right: true, action: true }); } sim(0.1); } out.ball = { grew: b.scale > s0, broken: !!w.remove }; }
      { const [g, p] = go('bottle'); window.BRADY.Save.data.tour.bottles = {}; const b = ent(g, 'TourBottle'); to(p, b); sim(0.2); out.bottle = { got: !!window.BRADY.Save.data.tour.bottles[1] }; }
      { const [g, p] = go('shop'); const sh = ent(g, 'TourShop'); g.picks = 70; p.pack = null; p.x = sh.slotX(0) - p.w / 2; p.y = sh.y + sh.h - p.h - 2; sim(0.2); sim(0.05, { actionPressed: true }); sim(0.2); out.shop = { picks: g.picks, pack: p.pack, items: sh.items.map(i => i.kind + ':' + i.price), sold: sh.items[0].sold }; }
      return out;
    });
    check('flip: past the line Brady falls up and walks the ceiling, back down after the band', r.flip.up && r.flip.ceiling <= 2 && r.flip.after && r.flip.alive && r.flip.x > r.flip.end, r.flip);
    check('lamp: the light shrinks, a lamp post relights it', r.lamp.dark && r.lamp.L1 < r.lamp.L0 - 30 && r.lamp.L2 > r.lamp.L1 + 30, r.lamp);
    check('phase: the sun-moon lantern swaps the blocks and the theme', r.phase.isNight && r.phase.th1 !== r.phase.th0 && r.phase.day.join() !== r.phase.night.join(), r.phase);
    check('tide: the water line rises and falls', Math.max(...r.tide.w) - Math.min(...r.tide.w) >= 6, r.tide);
    check('doom: the front advances and shoves Brady on', r.chase.moved >= 6 && r.chase.shoved && r.chase.alive, r.chase);
    check('carry: take the egg, set it on the delivery pedestal, the shutter opens', r.carry.carrying && r.carry.delivered && r.carry.open, r.carry);
    check('wheel: four seats ride round the hub', r.wheel.n === 4 && r.wheel.moved && r.wheel.hub, r.wheel);
    check('seesaw: landing on the high end throws Brady at spring strength', r.seesaw.launched <= -18, r.seesaw);
    check('balloon: stand in the basket and it rises', r.balloon.rose >= 3 && r.balloon.onIt, r.balloon);
    check('mirrors: turning them lights the receptor, the shutter opens', !r.mirrors.lit0 && r.mirrors.lit && r.mirrors.open, r.mirrors);
    check('hold: the arena locks, plays three waves, opens', r.hold.locked && r.hold.wall !== 0 && r.hold.waves === 3 && r.hold.done && r.hold.unlocked && r.hold.open === 0 && r.hold.foes >= 6, r.hold);
    check('thief: snatches, flees, three catches open the stamp lock', r.thief.fled === 1 && r.thief.cat.join() === '1,2,3' && r.thief.open, r.thief);
    check('rival: counts down, runs the course; Brady at the gate first wins', r.rival.waited && r.rival.ran >= 10 && r.rival.path > 20 && r.rival.win === 'lost', r.rival);
    check('sneak: the searchlight sounds the alarm and slams the shutter; crouched in the bush, nothing', r.sneak.alarm && r.sneak.closed && !r.sneak.hiddenAlarm && r.sneak.hid, r.sneak);
    check('ball: kicked along it grows and smashes the ball wall', r.ball.grew && r.ball.broken, r.ball);
    check('bottle mail: the bottle is saved', r.bottle.got, r.bottle);
    check('souvenir stand: buy the cheapest item into the Backpack', r.shop.picks === 40 && r.shop.pack && r.shop.sold, r.shop);
    const pics = { flip: ['TourFlipLine', 4, 'flip'], lamp: ['TourLampPost', -60], phase: ['TourToggleSwitch', 40, 'night'], tide: [null, 0], chase: ['TourDoom', 0, 'chase'], carry: ['TourPedestal', -40, 'carry'], wheel: ['TourWheelHub', -40], seesaw: ['TourSeesaw', -70], balloon: ['TourBalloon', 0, 'ride'], mirrors: ['TourSunSource', 60, 'lit'], hold: ['TourHoldArena', 0, 'hold'], thief: ['TourThief', -60], rival: ['TourRival', -40], sneak: ['TourWatcher', -40], bottle: ['TourBottle', -60], shop: ['TourShop', 0], ball: ['TourBall', -50] };
    for (const [n, [cls, dx, how]] of Object.entries(pics)) {
      await page.evaluate(([n, cls, dx, how]) => {
        lab('systems.' + n); const g = S(), p = P(); const e = cls ? g.entities.find(x => x.constructor.name === cls) : null;
        if (e && how !== 'chase') { p.x = e.cx + dx - p.w / 2; p.y = Math.min(e.y + e.h, (g.area.H - 3) * 32) - p.h - 2; }
        if (how === 'flip') { p.x = e.x + 5 * 32; p.y = 2 * 32; p.flipped = true; for (let k = 0; k < 30; k++) sim(0.03, { right: true }); }
        else if (how === 'night') { g.flipToggle(0); sim(0.6); }
        else if (how === 'chase') { p.x = 14 * 32; sim(3.6); }
        else if (how === 'carry') { const ps = g.entities.filter(x => x.constructor.name === 'TourPedestal'); p.x = ps[0].cx - p.w / 2; sim(0.3); for (let k = 0; k < 10; k++) sim(0.05, { right: true }); }
        else if (how === 'ride') { p.x = e.cx - p.w / 2; p.y = e.y - p.h - 4; sim(3.5); }
        else if (how === 'lit') { for (const m of g.entities.filter(x => x.constructor.name === 'TourMirror')) if (m.state !== m.s.set) { m.cool = 0; m.turn(); } sim(0.5); }
        else if (how === 'hold') { p.x = e.cx - p.w / 2; p.onGround = true; sim(5); }
        else if (n === 'tide') sim(4);
        else sim(0.4);
        g.player.invuln = 0; freeze();
      }, [n, cls, dx, how]);
      await shot(`sys-${n}.png`);
    }
  });
  // the map graph (W13): the reveal queue, the house stop, Brady walking the trails, a house visit, world-map extras
  await run('mapgraph', async () => {
    const fresh = () => page.evaluate(() => { const B = window.BRADY; B.Save.data.done = {}; B.Save.data.unlocked = { '1-1': true }; B.Save.data.exits = {}; B.Save.data.secretExits = {}; B.Save.data.gold = {}; B.Save.data.tour = { at: 'mx', seen: { mx: true }, cards: { mx: true } }; window.BRADY_TOUR.TourProgress.data(); });
    const tapAt = (x, y) => page.evaluate(([x, y]) => { window.BRADY.Input.taps.push({ x, y }); }, [x, y]);
    await fresh();
    const r1 = await page.evaluate(() => {
      const TT = window.BRADY_TOUR, B = window.BRADY;
      B.Save.data.done['1-1'] = true; const rev = TT.TourProgress.complete('1-1', true, 'secret').reveals;
      const m = new TT.TourMapScene({ from: '1-1' }); B.Game.setScene(m); sim(0.5);
      return { rev: rev.map(x => x.kind), reveal: m.reveal && m.reveal.r.kind, panel: !!TT.TourPanel };
    });
    await page.evaluate(() => { const m = S(); m._u = m.update; m.update = function () {}; });
    await shot('map-reveal-trail.png');
    await page.evaluate(() => { const m = S(); m.update = m._u; sim(1.0); m.update = function () {}; });
    await shot('map-reveal-house.png');
    const r2 = await page.evaluate(() => {
      const m = S(); m.update = m._u; sim(3); const T = window.BRADY_TOUR.TourProgress.data();
      const house = m.stamps.find(b => b.S.kind === 'house');
      return { pending: T.pending.length, revealed: !!T.revealed['house:mx-tienda'], path: Object.keys(T.paths), house: !!house, reveal: !!m.reveal, hx: house && house.cx, hy: house && house.cy, at: m.walker && m.walker.k, hk: house && house.k };
    });
    check('map: clearing 1-1 by its secret exit queues a gold trail and the Souvenir Stand', r1.rev.join() === 'path,house' && r1.reveal === 'path', r1);
    check('map: the reveal plays, then is written to the save (paths, revealed) and the stand stays on the panel', r2.pending === 0 && r2.revealed && r2.path.some(k => k === 'mx:0>' + r2.hk) && r2.house && !r2.reveal, r2);
    // Brady walks to the stand, a second tap goes in
    await tapAt(r2.hx, r2.hy);
    const r3 = await page.evaluate(() => { sim(0.05); const m = S(), w = m.walker; const walking = !!w.path; sim(2.5); return { walking, at: w.k }; });
    await page.evaluate(() => { const m = S(); m.walker.path = [m.stamps.find(b => b.S.kind === 'house').k]; m.walker.k = 0; const a = m.stopAt[0]; m.walker.x = a.cx; m.walker.y = a.cy; sim(0.12); m._u = m.update; m.update = function () {}; });
    await shot('map-walker.png');
    await page.evaluate(() => { const m = S(); m.update = m._u; sim(2.5); });
    check('map: tapping the stand walks Brady there along the trail', r3.walking && r3.at === r2.hk, r3);
    await tapAt(r2.hx, r2.hy);
    const r4 = await page.evaluate(() => { sim(0.1); const g = S(); const shop = g.entities && g.entities.find(e => e.constructor.name === 'TourShop'); return { scene: g.constructor.name, house: g.level && g.level.house, shop: !!shop, items: shop ? shop.items.map(i => i.kind + ':' + i.price) : null }; });
    check('map: the second tap opens the Souvenir Stand room with its counter', r4.scene === 'Play' && r4.house === 'mx-tienda' && r4.shop, r4);
    await page.evaluate(() => { const g = S(); g.player.invuln = 0; const sh = g.entities.find(e => e.constructor.name === 'TourShop'); g.player.x = sh.cx - 40; sim(0.3); freeze(); });
    await shot('map-house-room.png');
    const r5 = await page.evaluate(() => { const g = S(); g.update = g._upd; const gate = g.entities.find(e => e.constructor.name === 'Gate'); g.player.x = gate.cx - 10; g.player.y = gate.y + gate.h - g.player.h; sim(0.5); for (let k = 0; k < 40 && g.state !== 'results'; k++) sim(0.25, { jumpPressed: true }); const T = window.BRADY_TOUR.TourProgress.data(); return { state: g.state, visits: T.houses['mx-tienda'] || 0, done: Object.keys(window.BRADY.Save.data.done) }; });
    check('map: leaving the stand counts a visit and touches no level progress', r5.visits === 1 && r5.done.join() === '1-1', r5);
    // labels: arch names for v2 levels, styles for legacy ones
    const r6 = await page.evaluate(() => { const TT = window.BRADY_TOUR, C = TT.Tour.countries; const TL = TT.TourLandscape; return [TL.label(C.mx.levels[0]), TL.label(C.mx.levels[1]), TL.label(C.ec.levels[1])]; });
    check('map: level type labels come from arch (legacy levels keep their style)', r6[0] === 'PARADE' && r6[2] === 'SWING' && r6[1].length > 0, r6);
    // the world map: boss beaten (the jar shatters), bottles, a secret flight, the lighthouse
    await fresh();
    const r7 = await page.evaluate(() => {
      const TT = window.BRADY_TOUR, B = window.BRADY, MX = TT.Tour.countries.mx;
      for (let i = 1; i <= MX.mainCount; i++) { B.Save.data.done['1-' + i] = true; TT.TourProgress.complete('1-' + i, false, 'main'); }
      const T = TT.TourProgress.data(); T.pending = []; for (let n = 1; n <= 5; n++) T.bottles[n] = true; T.flights.ma = true; T.cards.ec = true; MX.levels[1].exits.fly = { to: 'flight:ma' }; T.seen.ec = true; T.at = 'ec';
      const m = new TT.TourMapScene({}); B.Game.setScene(m); sim(0.6);
      const fx = m.jarFx && m.jarFx.mx; return { jar: !!fx, airship: !!m.airship, from: m.flightFrom('ma') };
    });
    await page.evaluate(() => { const m = S(); m.cam.lon = -45; m.cam.lat = 15; m.cam.z = 3.2; m._u = m.update; m.update = function () {}; });
    await shot('map-world.png');
    const r8 = await page.evaluate(() => {
      const m = S(); m.update = m._u; sim(1.2); const T = window.BRADY_TOUR.TourProgress.data();
      m.cam.lon = -30; m.cam.lat = 5; sim(0.05); const x = m.sx(-30), y = m.sy(5); window.BRADY.Input.taps.push({ x, y }); sim(0.05);
      return { jars: !!T.jars.mx, lighthouse: T.lighthouse };
    });
    check('world map: the boss fell, so the Baron\'s jar over Mexico shatters and the airship moves on', r7.jar && r7.airship && r8.jars, Object.assign({}, r7, r8));
    check('world map: five bottles show the lighthouse; a tap lights its beam', r8.lighthouse === true, r8);
    check('world map: the secret flight arc starts at the country whose level has the flight exit', r7.from === 'mx', r7);
    await page.evaluate(() => { const m = S(); m.cam.lon = -40; m.cam.lat = 10; m.cam.z = 3.2; sim(0.3); m.update = function () {}; });
    await shot('map-world-lit.png');
    await page.evaluate(() => { delete window.BRADY_TOUR.Tour.countries.mx.levels[1].exits.fly; });
    await fresh();
  });
  // the behaviour library (§4.2): a lab critter per behaviour, each scripted through its tell, attack and weak moment
  await run('behave', async () => {
    await page.evaluate(() => {
      const TT = window.BRADY_TOUR, TYPES = window.BRADY_TYPES;
      const PAL = ['#ff6a5a', '#ffb83a', '#7ad84a', '#3ac8d8', '#8a6aff', '#ff6ab8', '#e8e070', '#5ae0a8', '#ff8a3a', '#6ab0ff'];
      // a round critter: body, belly, eyes that widen in a tell, little feet; flyers get wings
      const TAU = Math.PI * 2;
      const shade = (hex, a) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(a >= 0 ? v + (255 - v) * a : v * (1 + a))); return '#' + c.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join(''); };
      const critter = (col, fly) => (ctx, e, x, y, mode, t) => {
        const r = Math.min(e.w, e.h) * 0.55, cy = fly ? y : y - r, tell = /tell|aim|puff|stack|flip|grab|reveal|wake/.test(mode);
        if (fly) { ctx.fillStyle = shade(col, 0.3); for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * r * 0.9, cy - r * 0.2 + Math.sin(t * 22) * 3, r * 0.7, r * 0.3, s * 0.5, 0, TAU); ctx.fill(); } }
        const g = ctx.createRadialGradient(x - r * 0.35, cy - r * 0.4, r * 0.1, x, cy, r); g.addColorStop(0, shade(col, 0.35)); g.addColorStop(1, shade(col, -0.15));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, cy, r * (mode === 'big' ? 1.1 : 1), r * 0.92, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x, cy + r * 0.35, r * 0.6, r * 0.38, 0, 0, TAU); ctx.fill();
        TT.TourKit.eyes(ctx, x + (e.dir || 1) * r * 0.25, cy - r * 0.25, e.dir || 1, r * 0.3, r * (tell ? 0.3 : 0.22), /chase|pounce|dart|lash|inhale|breathe/.test(mode));
        if (!fly) TT.TourKit.feet(ctx, x, y, t, shade(col, -0.35), r * 0.45, 4, /idle|hidden|statue|sleep|crouch|disguise/.test(mode));
      };
      const B = ['splitter', 'regrower', 'camouflage', 'burrower', 'trailLayer', 'saltSneezer', 'inhaleBlast', 'ceilingDrop', 'wallCrawl', 'inflater', 'pouncer', 'itemThief', 'timeSlow', 'curlShield', 'mimic', 'echo', 'stacker', 'boomerang', 'swarm', 'platEater', 'alarmCaller', 'frostBreath', 'lightFrozen', 'inkBlot', 'tongue', 'pusher', 'sleeper', 'blinker'];
      B.forEach((b, k) => { TYPES['lab_' + b] = TT.TourEnemy.make({ behavior: b, w: 24, h: 24, speed: 1, art: critter(PAL[k % PAL.length]), child: 'lab_child', n: b === 'swarm' ? 5 : 3 }); });
      TYPES.lab_child = TT.TourEnemy.make({ behavior: 'hop', w: 14, h: 14, speed: 1.2, hopV: 7, hopEvery: 0.6, art: critter('#fff4c0') });
      TYPES.lab_sleeper2 = TT.TourEnemy.make({ behavior: 'sleeper', base: 'walk', w: 24, h: 24, speed: 1, art: critter('#9a8aff') });
      TYPES.lab_grabber = TT.TourFlyer.make({ behavior: 'grabber', w: 30, h: 20, speed: 1, art: critter('#f4f4f4', true) });
      TYPES.lab_hoverDart = TT.TourFlyer.make({ behavior: 'hoverDart', w: 22, h: 18, speed: 1, art: critter('#3ae8c8', true) });
      TYPES.lab_swarmFly = TT.TourFlyer.make({ behavior: 'swarm', n: 5, w: 20, h: 14, speed: 1.2, harmless: true, art: critter('#5a6a8a', true) });
    });
    const r = await page.evaluate(() => {
      const out = {}, TT = window.BRADY_TOUR;
      const hall = () => { lab('levels.hall'); const g = S(), p = P(); p.invuln = 999; for (const e of g.entities) if (e.enemy) e.remove = true; sim(0.05); return [g, p]; };
      const put = (g, type, tx, ty, props) => { const C = window.BRADY_TYPES[type]; const e = new C(g, Object.assign({ x: tx * 32 + 16, y: (ty + 1) * 32, dir: -1 }, props || {})); g.spawn(e); return e; };
      const watch = (e, sec, step) => { const seen = []; for (let k = 0; k < sec / 0.05; k++) { sim(0.05); const s = e.bst || e.mode; if (seen[seen.length - 1] !== s) seen.push(s); if (step) step(k); } return seen; };
      const at = (p, tx) => { p.x = tx * 32 + 16 - p.w / 2; p.y = 10 * 32 + 32 - p.h; p.vx = 0; p.vy = 0; };
      { const [g, p] = hall(); const e = put(g, 'lab_splitter', 20, 10); at(p, 20); p.y -= 90; sim(0.6); out.splitter = { kids: g.entities.filter(o => o.s && o.s.child).length }; }
      { const [g, p] = hall(); const e = put(g, 'lab_regrower', 20, 10); e.vx = 0; at(p, 20); p.y -= 90; for (let k = 0; k < 40 && !e.tiny; k++) sim(0.02); at(p, 5); out.regrower = watch(e, 4.5); }
      { const [g, p] = hall(); const e = put(g, 'lab_camouflage', 30, 10); at(p, 5); out.camouflage = watch(e, 5); }
      { const [g, p] = hall(); const e = put(g, 'lab_burrower', 26, 10); at(p, 24); out.burrower = watch(e, 6); }
      { const [g, p] = hall(); const e = put(g, 'lab_trailLayer', 20, 10); at(p, 5); sim(3); out.trailLayer = { trails: (g.area.trails || []).length }; }
      { const [g, p] = hall(); const e = put(g, 'lab_saltSneezer', 25, 10); at(p, 5); out.saltSneezer = watch(e, 4.5); out.saltPlat = g.entities.some(o => o.constructor.name === 'TourSaltPlat'); }
      { const [g, p] = hall(); const e = put(g, 'lab_inhaleBlast', 22, 10); e.cool = 0; at(p, 18); out.inhaleBlast = watch(e, 4.5); }
      { const [g, p] = hall(); const e = put(g, 'lab_ceilingDrop', 20, 5); at(p, 20); out.ceilingDrop = watch(e, 4.5, k => { if (k === 14) at(p, 26); }); }
      { const [g, p] = hall(); const e = put(g, 'lab_wallCrawl', 4, 10, { dir: -1 }); at(p, 12); let sides = new Set(); for (let k = 0; k < 260; k++) { sim(0.05); sides.add(e.side); } out.wallCrawl = { sides: [...sides] }; }
      { const [g, p] = hall(); const e = put(g, 'lab_inflater', 22, 10); at(p, 20); out.inflater = watch(e, 5); }
      { const [g, p] = hall(); const e = put(g, 'lab_pouncer', 25, 10); e.cool = 0; at(p, 21); out.pouncer = watch(e, 3.5); }
      { const [g, p] = hall(); p.collect('gear:kazoo'); const e = put(g, 'lab_itemThief', 24, 10); at(p, 20); out.itemThief = watch(e, 3); out.stolen = !p.hands; }
      { const [g, p] = hall(); const e = put(g, 'lab_timeSlow', 22, 10); at(p, 20); let slowed = false; out.timeSlow = watch(e, 8, () => { if (p.slowT > 0) slowed = true; }); out.slowed = slowed; }
      { const [g, p] = hall(); const e = put(g, 'lab_curlShield', 20, 10); e.vx = 0; at(p, 21); p.y -= 64; p.vy = -2; out.curlShield = watch(e, 2.5); }
      { const [g, p] = hall(); const e = put(g, 'lab_mimic', 20, 10); at(p, 30); sim(0.3); at(p, 21); out.mimic = watch(e, 1.5); }
      { const [g, p] = hall(); const e = put(g, 'lab_echo', 10, 10); at(p, 10); sim(0.5); for (let k = 0; k < 30; k++) sim(0.05, { right: true }); out.echo = { on: !!e.on, behind: Math.round(p.cx - e.cx) }; }
      { const [g, p] = hall(); const e = put(g, 'lab_stacker', 26, 10); e.cool = 0; at(p, 21); out.stacker = watch(e, 3.5); }
      { const [g, p] = hall(); const e = put(g, 'lab_boomerang', 26, 10); at(p, 20); let shot = false; out.boomerang = watch(e, 4, () => { if (g.entities.some(o => o.constructor.name === 'TourBoomerang')) shot = true; }); out.boomShot = shot; }
      { const [g, p] = hall(); const e = put(g, 'lab_swarm', 26, 10); at(p, 5); sim(1); out.swarm = { followers: g.entities.filter(o => o.constructor.name === 'TourSwarmling').length }; }
      { const [g, p] = hall(); const e = put(g, 'lab_platEater', 30, 3); at(p, 5); sim(4); out.platEater = { eaten: g.entities.filter(o => o.constructor.name === 'TourRegrow').length }; }
      { const [g, p] = hall(); const a = put(g, 'lab_alarmCaller', 25, 10, { dir: -1 }); const sl = put(g, 'lab_sleeper2', 35, 10); a.cool = 0; at(p, 22); out.alarm = watch(a, 3); out.woke = sl.bst; }
      { const [g, p] = hall(); const e = put(g, 'lab_frostBreath', 24, 10); e.cool = 0; at(p, 21); let frozen = false; out.frostBreath = watch(e, 3.5, () => { if (p.frozenT > 0) frozen = true; }); out.frozen = frozen; }
      { const [g, p] = hall(); const e = put(g, 'lab_lightFrozen', 36, 10); at(p, 5); sim(0.5); const far = e.bst; at(p, Math.floor(e.cx / 32) - 2); sim(0.3); out.lightFrozen = { far, near: e.bst }; }
      { const [g, p] = hall(); const e = put(g, 'lab_inkBlot', 23, 10); e.cool = 0; at(p, 20); out.inkBlot = watch(e, 1.5); out.blots = (g.inkBlots || []).length; }
      { const [g, p] = hall(); g.picks = 20; const e = put(g, 'lab_tongue', 23, 10); e.cool = 0; at(p, 20); out.tongue = watch(e, 1.5); out.coins = g.picks; }
      { const [g, p] = hall(); const e = put(g, 'lab_pusher', 30, 10); at(p, 10); sim(3); out.pusher = { ball: !!e.ball, scale: e.ball ? +e.ball.scale.toFixed(2) : 0 }; }
      { const [g, p] = hall(); const e = put(g, 'lab_sleeper', 22, 10); at(p, 10); sim(1); const still = e.bst; for (let k = 0; k < 34 && e.bst === 'sleep'; k++) sim(0.05, { right: true, action: true }); out.sleeper = { still, then: e.bst }; }
      { const [g, p] = hall(); const e = put(g, 'lab_blinker', 30, 10); at(p, 15); const x0 = e.cx; out.blinker = watch(e, 4); out.closer = Math.abs(e.cx - p.cx) < Math.abs(x0 - p.cx); }
      { const [g, p] = hall(); const e = put(g, 'lab_hoverDart', 24, 6); e.cool = 0; at(p, 20); out.hoverDart = watch(e, 3.5); }
      { const [g, p] = hall(); const e = put(g, 'lab_grabber', 20, 5); at(p, 20); out.grabber = watch(e, 6, k => { if (k === 30) {} }); }
      return out;
    });
    const has = (seq, ...want) => { let i = 0; for (const s of seq || []) if (s === want[i]) i++; return i === want.length; };
    check('splitter: a stomp bursts it into children', r.splitter.kids === 3, r.splitter);
    check('regrower: stomped tiny, flashes, regrows', has(r.regrower, 'tiny', 'regrow', 'walk'), r.regrower);
    check('camouflage: hidden, then shows', has(r.camouflage, 'hidden', 'show'), r.camouflage);
    check('burrower: under, tell, pop, exposed, dig', has(r.burrower, 'under', 'tell', 'pop', 'exposed', 'dig'), r.burrower);
    check('trail layer: lays a trail', r.trailLayer.trails > 2, r.trailLayer);
    check('salt sneezer: tell, sneeze, a salt platform', has(r.saltSneezer, 'tell', 'sneeze') && r.saltPlat, r.saltSneezer);
    check('inhale blast: tell, inhale, blast, gasp', has(r.inhaleBlast, 'tell', 'inhale', 'blast', 'gasp'), r.inhaleBlast);
    check('ceiling drop: tell, drop, stuck, climb', has(r.ceilingDrop, 'tell', 'drop', 'stuck', 'climb'), r.ceilingDrop);
    check('wall crawl: floor, then the wall, then the ceiling', r.wallCrawl.sides.includes('wall') && r.wallCrawl.sides.includes('ceil'), r.wallCrawl);
    check('inflater: puff, big, deflate', has(r.inflater, 'puff', 'big', 'deflate'), r.inflater);
    check('pouncer: tell, pounce, land', has(r.pouncer, 'tell', 'pounce', 'land'), r.pouncer);
    check('item thief: grabs the HANDS item and flees', has(r.itemThief, 'grab', 'flee') && r.stolen, r.itemThief);
    check('time slow: flip, field (Brady slowed)', has(r.timeSlow, 'flip', 'field') && r.slowed, r.timeSlow);
    check('curl shield: curl, ball, uncurl', has(r.curlShield, 'curl', 'ball', 'uncurl'), r.curlShield);
    check('mimic: disguise, reveal, chase', has(r.mimic, 'disguise', 'reveal', 'chase') || has(r.mimic, 'reveal', 'chase'), r.mimic);
    check('echo: a copy follows behind', r.echo.on && r.echo.behind > 20, r.echo);
    check('stacker: stack, topple, stun', has(r.stacker, 'stack', 'topple', 'stun'), r.stacker);
    check('boomerang: tell, throw (a ride-able projectile)', has(r.boomerang, 'tell', 'throw') && r.boomShot, r.boomerang);
    check('swarm: a leader and five followers', r.swarm.followers === 5, r.swarm);
    check('plat eater: eats one-way tiles that regrow', r.platEater.eaten >= 1, r.platEater);
    check('alarm caller: tell, call, the sleeper wakes', has(r.alarm, 'tell', 'call') && r.woke !== 'sleep', { alarm: r.alarm, woke: r.woke });
    check('frost breath: tell, breathe (Brady frozen), pant', has(r.frostBreath, 'tell', 'breathe', 'pant') && r.frozen, r.frostBreath);
    check('light frozen: walks in the dark, a statue in the light', r.lightFrozen.far !== 'statue' && r.lightFrozen.near === 'statue', r.lightFrozen);
    check('ink blot: tell, squirt (a blot on the view)', has(r.inkBlot, 'tell', 'squirt') && r.blots === 1, r.inkBlot);
    check('tongue: tell, lash (takes coins)', has(r.tongue, 'tell', 'lash') && r.coins < 20, { seq: r.tongue, coins: r.coins });
    check('pusher: rolls a growing ball', r.pusher.ball && r.pusher.scale > 1.05, r.pusher);
    check('sleeper: asleep until Brady runs close', r.sleeper.still === 'sleep' && r.sleeper.then !== 'sleep', r.sleeper);
    check('blinker: fade, gone, appear closer', has(r.blinker, 'fade', 'gone', 'appear') && r.closer, r.blinker);
    check('hover dart: aim, dart, recover', has(r.hoverDart, 'aim', 'dart', 'recover'), r.hoverDart);
    check('grabber: tell, swoop, carry, rest', has(r.grabber, 'tell', 'swoop', 'carry'), r.grabber);
    // pictures of the tells and attacks
    const pics = [['inhaleBlast', 22, 10, 18, 1.0], ['saltSneezer', 25, 10, 5, 3.2], ['burrower', 26, 10, 20, 2.5], ['frostBreath', 24, 10, 21, 1.1], ['stacker', 26, 10, 21, 1.0], ['pouncer', 25, 10, 21, 0.8], ['tongue', 23, 10, 20, 0.7], ['inflater', 22, 10, 20, 1.2], ['boomerang', 26, 10, 20, 3.0], ['camouflage', 30, 10, 26, 1.0], ['mimic', 24, 10, 30, 0.3], ['blinker', 30, 10, 15, 2.9], ['echo', 10, 10, 10, 1.6], ['hoverDart', 24, 6, 20, 0.4], ['trailLayer', 20, 10, 5, 2.5], ['swarm', 26, 10, 18, 1.0], ['sleeper', 22, 10, 18, 0.5], ['regrower', 20, 10, 5, 1.0], ['grabber', 20, 5, 20, 1.3], ['ceilingDrop', 20, 5, 20, 0.25]];
    for (const [b, tx, ty, px, t] of pics) {
      await page.evaluate(([b, tx, ty, px, t]) => { lab('levels.hall'); const g = S(), p = P(); p.invuln = 999; for (const e of g.entities) if (e.enemy) e.remove = true; const C = window.BRADY_TYPES['lab_' + b]; const e = new C(g, { x: tx * 32 + 16, y: (ty + 1) * 32, dir: -1 }); e.cool = 0; g.spawn(e); p.x = px * 32 + 16 - p.w / 2; p.y = 11 * 32 - p.h; if (b === 'regrower') { p.x = e.cx - p.w / 2; p.y = e.y - 90; } if (b === 'echo') { for (let k = 0; k < 25; k++) sim(0.05, { right: true }); } sim(t, b === 'echo' ? { right: true } : null); g.camX = Math.max(0, Math.min(g.area.W * 32 - window.BRADY.Game.viewW, (e.cx + p.cx) / 2 - window.BRADY.Game.viewW / 2)); freeze(); }, [b, tx, ty, px, t]);
      await shot(`behave-${b}.png`);
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
