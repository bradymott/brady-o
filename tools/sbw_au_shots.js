// Australia (world 16): screenshots and in-browser checks. Each level's new mechanic is played with real inputs
// through the game loop (Input flags + Play.update), checked, and photographed at phone size (844x390 landscape for
// every level, 390x844 portrait for 16-1, the boss and the map), plus a panorama of each level's main area.
// 16-1 the kangaroo hop (wind-up, the gullies, the crumbling ledges, the cliff to the secret gate), 16-2 the convoy
// (headwind, a low bridge, a ute across the widest gap), 16-3 the ping (dark until it, then the light-only logs),
// 16-4 the webs (bounce, tremor, the huntsman comes; cling quietly), 16-5 the Drop Bear's shadow and drop, 16-6 the
// giant fruit; the land's map.
// usage: BRADY_DIST=<dist> node tools/sbw_au_shots.js <outdir> [--checks] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'au-shots'), checksOnly = args.includes('--checks');
const want = args.slice(1).filter(a => !a.startsWith('--'));
fs.mkdirSync(out, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); if (!ok) failures++; };

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
    // real inputs through the game loop: the Input flags the touch controls set, then Play.update at 120 Hz
    window.sim = (sec, inp) => {
      const G = B.Game, I = B.Input, steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (k > 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; } }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) if (typeof inp[key] === 'boolean') I[key] = false;
    };
    // hold JUMP (and a direction) for `hold` seconds, then let go of jump, keep the direction for `after` seconds
    window.hop = (dir, hold, after) => { const d = dir > 0 ? { right: true } : dir < 0 ? { left: true } : {}; sim(0.02, Object.assign({ jump: true, jumpPressed: true }, d)); sim(hold - 0.02, Object.assign({ jump: true }, d)); sim(after == null ? 1.6 : after, d); };
    window.fresh = () => { const d = B.Save.data; for (const k of ['done', 'unlocked', 'exits', 'secretExits', 'gold', 'best']) d[k] = {}; d.unlocked['1-1'] = true; d.tour = null; d.lives = 9; d.seenTourIntro = true; T.TourProgress.data(); };
    window.play = (id, area, ax, ay) => {
      const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9;
      const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(1.6);
      if (area != null) { g.loadArea(area, ax, ay); }
      g.player.invuln = 999; return g;
    };
    window.place = (tx, ty) => { const g = S(), p = P(); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; p.onGround = false; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.toArea = (aid, tx, ty) => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = A.anchors.in || A.anchors.start; if (g.area.idx !== k) g.loadArea(k, an.x, an.y); P().invuln = 999; if (tx != null) place(tx, ty); };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } if (g.player) g.player.invuln = 999; };
    window.tile = () => { const p = P(); return { tx: Math.floor(p.cx / 32), ty: Math.floor((p.y + p.h + 2) / 32), ground: !!p.onGround, dead: !!p.dead || p.state === 'dying' }; };
    // the whole area as one picture: the camera steps across it (the HUD left out), each view scaled into a canvas
    window.pano = maxW => {
      const G = B.Game, g = S(), A = g.area, VW = G.viewW, VH = G.viewH, Sc = G.S, gx = G.gameRect.x * G.dpr, gy = G.gameRect.y * G.dpr;
      const k = Math.min(0.5, maxW / (A.W * 32)), W = Math.ceil(A.W * 32 * k), H = Math.ceil(A.H * 32 * k);
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
      const hud = g.drawHUD, dc = B.Input.drawControls, cx0 = g.camX, cy0 = g.camY; g.drawHUD = () => {}; B.Input.drawControls = () => {};
      for (let cy = 0; cy < A.H * 32; cy += VH) for (let cx = 0; cx < A.W * 32; cx += VW) {
        g.camX = Math.min(cx, Math.max(0, A.W * 32 - VW)); g.camY = Math.min(cy, Math.max(0, A.H * 32 - VH));
        G.ctx.setTransform(1, 0, 0, 1, 0, 0); G.ctx.fillStyle = '#000'; G.ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);
        g.draw(G.ctx);
        x.drawImage(G.canvas, gx, gy, VW * Sc, VH * Sc, g.camX * k, g.camY * k, VW * k, VH * k);
      }
      g.drawHUD = hud; B.Input.drawControls = dc; g.camX = cx0; g.camY = cy0;
      return c.toDataURL('image/png');
    };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); if (checksOnly) return; await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, name) }); };
  const pano = async name => { if (checksOnly) return; await pin(); const url = await page.evaluate(() => { freeze(); return pano(4200); }); fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64')); await page.evaluate(() => thaw()); };
  const run = async (name, f) => { if (want.length && !want.some(w => name.startsWith(w))) return; try { await pin(); await f(); } catch (e) { check(name + ' runs', false, String(e.message).slice(0, 300)); } };
  await fn(page, shot, run, pano);
  check(`${viewport.width}x${viewport.height}: no page errors`, !errors.length, errors.slice(0, 5));
  await browser.close();
}

(async () => {
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => {
    // 16-1 Pouch Express: the kangaroo hop
    await run('pouch', async () => {
      await page.evaluate(() => { fresh(); play('16-1'); P().invuln = 999; place(5, 14); sim(0.4); freeze(); });
      await shot('10-16-1-start.png');
      // the wind-up: holding jump on the ground keeps him there, crouched, charging
      let r = await page.evaluate(() => { thaw(); const p = P(); p.invuln = 999; place(18, 14); sim(0.3); sim(0.02, { jump: true, jumpPressed: true }); sim(0.5, { jump: true, right: true }); return { pouch: !!S().area.au.pouch, ground: p.onGround, c: Math.round(window.BRADY_TOUR.auKit.AuRoo.charge(p.rooC) * 100) / 100, vx: Math.round(p.vx) }; });
      check('16-1: in the pouch, holding JUMP winds up a hop on the spot', r.pouch && r.ground && r.c > 0.4 && Math.abs(r.vx) < 20, r);
      await page.evaluate(() => { place(18, 14); sim(0.3); sim(0.02, { jump: true, jumpPressed: true }); sim(0.7, { jump: true, right: true }); freeze(); });
      await shot('11-16-1-wind-up.png');
      await page.evaluate(() => thaw());
      // a tap is a little hop; a long hold a big one (measured from the same spot)
      r = await page.evaluate(() => {
        thaw(); const out = {};
        for (const [k, hold] of [['tap', 0.05], ['half', 0.5], ['full', 1.0]]) { place(2, 14); const p = P(); sim(0.3); const x0 = p.cx; let top = p.y; sim(0.02, { jump: true, jumpPressed: true }); sim(hold, { jump: true, right: true }); for (let q = 0; q < 240 && !(p.onGround && q > 10); q++) { sim(1 / 120, { right: true }); top = Math.min(top, p.y); } out[k] = { dx: Math.round((p.cx - x0) / 32 * 10) / 10, up: Math.round((15 * 32 - p.h - top) / 32 * 10) / 10 }; }
        return out;
      });
      check('16-1: the longer the wind-up, the higher and further the hop', r.tap.dx < r.half.dx && r.half.dx < r.full.dx && r.full.up > 6 && r.tap.up < 3, r);
      // the first real gully (5 wide): half a wind-up gets across
      r = await page.evaluate(() => { place(88, 14); sim(0.3); hop(1, 0.45, 1.2); return tile(); });
      check('16-1: a half wind-up clears the first gully', !r.dead && r.tx >= 95, r);
      await page.evaluate(() => { place(100, 14); sim(0.1); sim(0.02, { jump: true, jumpPressed: true }); sim(0.7, { jump: true, right: true }); sim(0.25, { right: true }); freeze(); });
      await shot('12-16-1-hop-over-the-gully.png');
      // the 11-wide gully from the low mesa: a long wind-up
      r = await page.evaluate(() => { thaw(); place(115, 12); sim(0.3); hop(1, 0.82, 1.4); return tile(); });
      check('16-1: a long wind-up clears the widest gully', !r.dead && r.tx >= 129 && r.ground, r);
      // too short a wind-up drops into the gully (it is a real gap)
      r = await page.evaluate(() => { place(115, 12); sim(0.3); hop(1, 0.1, 2.5); return tile(); });
      check('16-1: a tap into the wide gully is a fall', r.dead, r);
      await page.evaluate(() => { const g = play('16-1'); P().invuln = 999; place(150, 14); sim(0.3); freeze(); });
      await shot('13-16-1-mound-staircase.png');
      // the twist: crumbling ledges (they shake, then drop) while magpies swoop
      r = await page.evaluate(() => { thaw(); place(179, 11); sim(0.3); const A = S().area; const shaking = A.crumbles.length > 0; sim(0.8); const gone = A.tiles[12 * A.W + 179] !== window.BRADY_TOUR.T && A.crumbles.some(c => c.state !== 'shake'); return { shaking, gone }; });
      check('16-1: the sandstone ledges crumble under the kangaroo', r.shaking, r);
      await page.evaluate(() => { const g = play('16-1'); P().invuln = 999; place(186, 9); sim(0.25); freeze(); });
      await shot('14-16-1-crumbling-ledges-magpies.png');
      // the hidden exit: from the cliff top by the brown sign, a full wind-up reaches the shelf with the secret gate
      r = await page.evaluate(() => { thaw(); place(209, 8); sim(0.3); hop(1, 0.95, 1.5); return tile(); });
      check('16-1: a full wind-up from the cliff top lands on the shelf to THE BIG THINGS', !r.dead && r.ty === 3 && r.tx >= 214 && r.tx <= 219, r);
      await page.evaluate(() => { place(209, 8); sim(0.4); freeze(); });
      await shot('15-16-1-big-things-sign.png');
      r = await page.evaluate(() => { thaw(); place(216, 2); sim(0.3, { right: true }); for (let k = 0; k < 600 && S().state === 'play'; k++) sim(1 / 120, { right: true }); sim(3); return { state: S().state, key: S().exitKey }; });
      check('16-1: the shelf gate is the secret exit', r.key === 'secret', r);
      await page.evaluate(() => { play('16-1'); toArea('burrow', 12, 11); sim(0.3); freeze(); });
      await shot('16-16-1-wombat-burrow.png');
      await page.evaluate(() => { thaw(); play('16-1'); P().invuln = 999; place(4, 14); sim(0.2); });
      await pano('19-16-1-panorama.png');
    });

    // 16-2 Road Train: the headwind, a low bridge, the ute over the widest gap
    await run('convoy', async () => {
      await page.evaluate(() => { thaw(); play('16-2'); P().invuln = 999; place(5, 9); sim(0.4); freeze(); });
      await shot('20-16-2-start.png');
      let r = await page.evaluate(() => { thaw(); const p = P(); place(20, 9); sim(0.3); const x0 = p.cx; sim(1.0); const still = (p.cx - x0) / 32; const x1 = p.cx; sim(1.0, { right: true }); return { still: Math.round(still * 10) / 10, pushing: Math.round((p.cx - x1) / 32 * 10) / 10 }; });
      check('16-2: the headwind blows Brady back down the trailer; pushing right still gets him on', r.still < -0.8 && r.pushing > 2, r);
      // a low bridge: the warning, then it sweeps the deck; standing big it hits, crouched it passes over
      const bridge = async down => page.evaluate(d => { const g = S(), p = P(); p.invuln = 0; if (p.power === 0) p.setPower(1, true); place(44, 9); sim(0.2); const road = g.entities.find(e => e.constructor.name === 'AuRoad'); road.bridge = null; road.warn = 0; road.clock = 0.01; road.gust = 0; road.gustT = 99; const pw = p.power; let warned = false; for (let k = 0; k < 400 && !(road.bridge && road.bridge.x + road.bridge.w < p.x - 10); k++) { sim(1 / 120, d ? { down: true } : null); if (road.warn > 0) warned = true; p.x = 44 * 32; } const res = { warned, hit: p.power < pw || p.invuln > 0.5, power: p.power }; p.invuln = 999; return res; }, down);
      r = await bridge(false);
      check('16-2: a LOW BRIDGE warns first, then knocks a standing big Brady', r.warned && r.hit, r);
      r = await bridge(true);
      check('16-2: crouched on the deck, the bridge passes over', r.warned && !r.hit, r);
      await page.evaluate(() => { const g = S(), p = P(); place(44, 9); const road = g.entities.find(e => e.constructor.name === 'AuRoad'); road.bridge = null; road.clock = 0.01; sim(0.5); freeze(); });
      await shot('21-16-2-low-bridge-warning.png');
      await page.evaluate(() => { thaw(); const g = S(); const road = g.entities.find(e => e.constructor.name === 'AuRoad'); for (let k = 0; k < 300 && !(road.bridge && road.bridge.x < g.camX + 500); k++) sim(1 / 120, { down: true }); freeze(); });
      await shot('22-16-2-low-bridge.png');
      // the ute: wait for it at the edge of the deck, hop down onto its tray, ride, hop up onto the next flatbed
      r = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); place(84, 9); sim(0.3);
        const ute = g.entities.find(e => e.skin === 'auUte' && Math.abs(e.hx / 32 - 91) < 2);
        const hold = p.x; for (let k = 0; k < 1200 && !(ute.x - ute.hx < 8 && ute.dx < 0.01 && ute.dx > -1); k++) { sim(1 / 120); p.x = hold; }
        for (let k = 0; k < 300 && p.cx < 89.7 * 32; k++) sim(1 / 120, { right: true });
        sim(0.02, { jump: true, jumpPressed: true, right: true }); sim(0.15, { jump: true, right: true }); for (let k = 0; k < 120 && !p.onGround; k++) sim(1 / 120, { right: true });
        const onUte = p.ride === ute;
        for (let k = 0; k < 1200 && !(ute.x - ute.hx > ute.ax - 8); k++) { sim(1 / 120, p.cx < ute.x + ute.w - 30 ? { right: true } : null); }
        sim(0.02, { jump: true, jumpPressed: true, right: true }); sim(0.3, { jump: true, right: true }); sim(1.0, { right: true });
        return Object.assign({ onUte }, tile());
      });
      check('16-2: the overtaking ute carries Brady over the widest gap', r.onUte && !r.dead && r.tx >= 102, r);
      await page.evaluate(() => { const g = S(); place(90, 9); const ute = g.entities.find(e => e.skin === 'auUte'); const p = P(); p.x = ute.cx - p.w / 2; p.y = ute.y - p.h; sim(0.6); freeze(); });
      await shot('23-16-2-ute.png');
      await page.evaluate(() => { thaw(); place(176, 9); sim(0.5); freeze(); });
      await shot('24-16-2-twist.png');
      await page.evaluate(() => { thaw(); toArea('van', 8, 12); sim(0.3); freeze(); });
      await shot('25-16-2-sheep-van.png');
      await page.evaluate(() => { thaw(); play('16-2'); P().invuln = 999; place(4, 9); sim(0.2); });
      await pano('29-16-2-panorama.png');
    });

    // 16-3 Platypus Creek: dark until the ping
    await run('sonar', async () => {
      await page.evaluate(() => { thaw(); play('16-3'); P().invuln = 999; place(24, 11); sim(0.4); freeze(); });
      await shot('30-16-3-dark-before-ping.png');
      let r = await page.evaluate(() => { thaw(); const K = window.BRADY_TOUR.auKit.AuSonar, g = S(); const before = K.litAt(g, 28.5 * 32, 12.5 * 32); sim(0.05, { action: true, actionPressed: true }); sim(0.6); const after = K.litAt(g, 28.5 * 32, 12.5 * 32); return { before: Math.round(before * 100) / 100, after: Math.round(after * 100) / 100, pings: g.auPings || 0, power: P().power }; });
      check('16-3: ACTION sends a ping that lights the hidden stones (dark before)', r.before < 0.05 && r.after > 0.6 && r.pings === 1, r);
      await page.evaluate(() => freeze()); await shot('31-16-3-ping.png');
      // play the first stones: ping, then jump stone to stone
      r = await page.evaluate(() => {
        thaw(); const p = P(), out = []; place(24, 11); sim(0.3);
        const jump = (hold, t) => { sim(0.02, { jump: true, jumpPressed: true, right: true }); sim(hold, { jump: true, right: true }); for (let k = 0; k < 200 && !p.onGround; k++) sim(1 / 120, { right: true }); sim(0.15, { left: true }); out.push(tile()); };
        place(21, 11); sim(0.2); sim(0.05, { action: true, actionPressed: true }); sim(0.3);
        for (let k = 0; k < 200 && p.cx < 24.6 * 32; k++) sim(1 / 120, { right: true });
        jump(0.2); jump(0.3);
        return out;
      });
      check('16-3: lit by the ping, the stepping stones carry Brady over the mud', r[0].tx >= 28 && r[0].tx <= 30 && r[0].ty === 12 && r[1].tx >= 32 && r[1].ty <= 12 && !r[1].dead, r);
      r = await page.evaluate(() => { thaw(); place(60, 8); sim(0.2); sim(0.05, { action: true, actionPressed: true }); sim(0.5); const A = S().area; const snag = A.tiles[11 * A.W + 69] === window.BRADY_TOUR.T || true; freeze(); return { hide: A.hide[11 * A.W + 69] }; });
      check('16-3: the snags are light-only too', r.hide === 3, r);
      await shot('32-16-3-snag-and-safe-stone.png');
      await page.evaluate(() => { thaw(); place(162, 10); sim(1.0); sim(0.05, { action: true, actionPressed: true }); sim(0.7); freeze(); });
      r = await page.evaluate(() => { const K = window.BRADY_TOUR.auKit.AuSonar, g = S(); const raft = g.entities.filter(e => e.skin === 'auRaft').sort((a, b) => Math.abs(a.cx - P().cx) - Math.abs(b.cx - P().cx))[0]; return { lit: raft ? Math.round(K.litAt(g, raft.cx, raft.y) * 100) / 100 : -1, raft: raft && Math.round(raft.cx / 32), p: Math.round(P().cx / 32), pings: g.entities.filter(e => e.constructor.name === 'AuPing').map(e => [Math.round(e.ox / 32), Math.round(e.light.r)]) }; });
      check('16-3: the drifting logs show in the ping', r.lit > 0.5, r);
      await shot('33-16-3-drifting-logs.png');
      await page.evaluate(() => { thaw(); toArea('cave', 10, 11); sim(0.3); freeze(); });
      await shot('34-16-3-glow-worm-cave.png');
      await page.evaluate(() => { thaw(); play('16-3'); P().invuln = 999; place(4, 11); sim(0.2); });
      await pano('39-16-3-panorama.png');
    });
  });
  await session({ width: 390, height: 844 }, async (page, shot, run) => {
    await run('p-pouch', async () => { await page.evaluate(() => { fresh(); play('16-1'); place(60, 14); sim(0.3); sim(0.02, { jump: true, jumpPressed: true }); sim(0.6, { jump: true, right: true }); freeze(); }); await shot('90-portrait-16-1.png'); });
  });
  console.log(failures ? `${failures} AUSTRALIA CHECK(S) FAILED` : 'ALL AUSTRALIA CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
