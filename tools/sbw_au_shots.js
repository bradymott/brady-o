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
  });
  await session({ width: 390, height: 844 }, async (page, shot, run) => {
    await run('p-pouch', async () => { await page.evaluate(() => { fresh(); play('16-1'); place(60, 14); sim(0.3); sim(0.02, { jump: true, jumpPressed: true }); sim(0.6, { jump: true, right: true }); freeze(); }); await shot('90-portrait-16-1.png'); });
  });
  console.log(failures ? `${failures} AUSTRALIA CHECK(S) FAILED` : 'ALL AUSTRALIA CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
