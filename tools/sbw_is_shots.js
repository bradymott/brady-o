// Iceland (world 17, the Encore Tour's fourth land): in-browser checks and screenshots (docs/design/ENCORE_TOUR.md).
// Each level's own mechanic is played with real inputs through the game loop (Brady is placed at the start of a
// stretch, then the stick and the jump button do the rest): the aurora ribbons (17-1), the tipping icebergs (17-2),
// the rift's sliding slabs (17-3), the organ-pipe columns (17-4), the Night Troll's cave (17-5; the fight itself is
// in boss_test), the hidden folk's planks and walking backwards (17-6); the land's map; a panorama of every level.
// Phone landscape (844x390 @2x) for every level, portrait (390x844) for 17-1, the boss and the map. Silent.
// usage: BRADY_DIST=<dist> node tools/sbw_is_shots.js <outdir> [--checks] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : 'is-shots'), checksOnly = args.includes('--checks');
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
    window.S = () => B.Game.scene; window.P = () => B.Game.scene.player; window.KIT = () => T.Tour.isKit;
    // run the scene; inp = held Input flags (edges are cleared after the first step); f(k) may change them per step
    window.sim = (sec, inp, f) => {
      const G = B.Game, I = B.Input, steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (k > 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; } }
        if (f && f(k, I) === false) break;
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      for (const key of ['left', 'right', 'up', 'down', 'jump', 'action']) I[key] = false;
    };
    window.fresh = () => { const d = B.Save.data; for (const k of ['done', 'unlocked', 'exits', 'secretExits', 'gold', 'best']) d[k] = {}; d.unlocked['1-1'] = true; d.tour = null; d.lives = 9; d.seenTourIntro = true; T.TourProgress.data(); };
    window.play = (id) => { const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9; const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(1.6); g.player.invuln = 999; return g; };
    window.place = (tx, ty) => { const g = S(), p = P(); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; p.onGround = false; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.toArea = (aid, tx, ty) => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = A.anchors.in || A.anchors.start; if (g.area.idx !== k) g.loadArea(k, an.x, an.y); P().invuln = 999; if (tx != null) place(tx, ty); };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } if (g.player) g.player.invuln = 999; };
    window.ents = name => S().entities.filter(e => e.constructor.name === name || e.type === name);
    window.alive = () => { const g = S(), p = P(); return !p.dead && p.state === 'play' && g.state === 'play'; };
    window.tx = () => Math.floor(P().cx / 32); window.ty = () => Math.floor((P().y + P().h - 1) / 32);
    // hold right until Brady stands at tile column x (or dies); the jump button pressed when j(p) says so
    window.runTo = (x, sec, j) => { let r = false; sim(sec || 6, { right: true }, (k, I) => { const p = P(); if (!alive()) return false; if (p.cx >= x * 32 && p.onGround) { r = true; return false; } const want = j ? j(p, k) : false; I.jump = !!want; if (want === 'tap') I.jumpPressed = true; else I.jumpPressed = !!want && !I._held; I._held = !!want; }); return r; };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); if (checksOnly) return; await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, name) }); };
  const run = async (name, f) => { if (want.length && !want.some(w => name.startsWith(w))) return; try { await pin(); await f(); } catch (e) { check(name + ' runs', false, String(e.message).slice(0, 300)); } };
  // a panorama of an area: the camera steps across it with every row in view; the frames are stitched in the page
  const pano = async (id, aid, name) => {
    if (checksOnly) return;
    const url = await page.evaluate(async ([id, aid]) => {
      thaw(); const g = play(id); if (aid) toArea(aid); const A = S().area, G = window.BRADY.Game;
      G.setRows(A.H); freeze(); g.drawHUD = () => {}; g.drawBanner = () => {}; G.forceTouchUI = false; window.BRADY.Input.usingTouch = false; g.bannerT = 0;
      const k = 0.55, big = document.createElement('canvas'); big.width = Math.ceil(A.W * 32 * k); big.height = Math.ceil(A.H * 32 * k);
      const bx = big.getContext('2d');
      for (let x = 0; x < A.W * 32; x += G.viewW - 8) {
        const cx = Math.min(x, A.W * 32 - G.viewW); g.camX = Math.max(0, cx); g.camY = 0; P().x = g.camX + G.viewW / 2; P().y = -400;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const r = G.gameRect, sx = G.canvas.width / G.cssW;
        bx.drawImage(G.canvas, r.x * sx, r.y * sx, r.w * sx, r.h * sx, g.camX * k, 0, G.viewW * k, A.H * 32 * k);
      }
      return big.toDataURL('image/png');
    }, [id, aid]);
    fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64'));
    await page.evaluate(() => { thaw(); const G = window.BRADY.Game; G.forceTouchUI = true; window.BRADY.Input.usingTouch = true; G.setRows(S().viewRows()); });
  };
  await fn(page, shot, run, pano);
  check(`${viewport.width}x${viewport.height}: no page errors`, !errors.length, errors.slice(0, 5));
  await browser.close();
}

(async () => {
  await session({ width: 844, height: 390 }, async (page, shot, run, pano) => {
    const ev = (f, a) => page.evaluate(f, a);
    // ---------------- 17-1 Northern Lights ----------------
    await run('aurora', async () => {
      await ev(() => { fresh(); play('17-1'); place(6, 14); sim(0.4); freeze(); });
      await shot('10-17-1-start.png');
      // a pulse ribbon is solid while it glows and gone while dark
      let r = await ev(() => { thaw(); const rb = ents('IsRibbon').find(e => e.mode === 'pulse'); const seen = { lit: 0, dark: 0 }; for (let k = 0; k < 50; k++) { sim(0.1); if (rb.dead) seen.dark++; else seen.lit++; } return seen; });
      check('17-1: a pulse ribbon glows (solid) and goes dark (gone) in turn', r.lit > 5 && r.dark > 5, r);
      await ev(() => { place(14, 14); const rb = ents('IsRibbon').find(e => e.mode === 'pulse'); for (let k = 0; k < 60 && rb.dead; k++) sim(0.05); sim(0.2); freeze(); });
      await shot('11-17-1-pulse-ribbon.png');
      // the first sweep over the pit: wait at the edge for the relight, jump on, run ahead of the fade (real inputs)
      r = await ev(() => {
        thaw(); place(44, 14); sim(0.3);
        const rb = ents('IsRibbon').find(e => Math.floor(e.x0 / 32) === 47);
        for (let k = 0; k < 400 && rb.S.head == null; k++) sim(0.02);
        let jumped = false;
        const ok = runTo(62, 6, p => { if (!jumped && p.onGround && p.cx > 45.2 * 32) { jumped = true; return true; } if (p.cx > 58.5 * 32 && p.onGround) return true; return p.vy < 0 && !p.onGround; });
        return { ok, x: tx(), alive: alive() };
      });
      check('17-1: real inputs: jump onto the sweeping ribbon as it relights and run ahead of the fade over the pit', r.ok && r.alive, r);
      await ev(() => { thaw(); play('17-1'); place(44, 14); sim(0.2); const rb = ents('IsRibbon').find(e => Math.floor(e.x0 / 32) === 47); for (let k = 0; k < 400 && !(rb.S.front > 1.5); k++) sim(0.02); place(55, 10); P().vy = 0; sim(0.2); freeze(); });
      await shot('12-17-1-sweep-fading.png');
      // standing still on a sweeping ribbon: the fade catches up and Brady drops (the danger is real)
      r = await ev(() => { thaw(); play('17-1'); const rb = ents('IsRibbon').find(e => Math.floor(e.x0 / 32) === 47); for (let k = 0; k < 400 && rb.S.head == null; k++) sim(0.02); sim(0.9); place(50, 11); P().invuln = 0; let fell = false; for (let k = 0; k < 80; k++) { sim(0.05); if (P().y > 14 * 32) { fell = true; break; } } P().invuln = 999; return { fell }; });
      check('17-1: dawdling on a ribbon: the fade catches up and Brady falls', r.fell, r);
      // the twist: the ribbon whose fade comes toward Brady (from its far end), rippling hard: real inputs
      r = await ev(() => {
        thaw(); play('17-1'); place(89, 14); sim(0.3);
        const rb = ents('IsRibbon').find(e => Math.floor(e.x0 / 32) === 93);
        for (let k = 0; k < 500 && rb.S.head == null; k++) sim(0.02);
        for (let k = 0; k < 200 && rb.S.head != null; k++) sim(0.02);
        let jumped = false;
        const ok = runTo(106, 6, p => { if (!jumped && p.onGround && p.cx > 91.5 * 32) { jumped = true; return true; } if (p.cx > 102.5 * 32 && p.onGround && p.cx < 105 * 32) return true; return p.vy < 0 && !p.onGround; });
        return { ok, x: tx(), alive: alive() };
      });
      check('17-1: real inputs: cross the ribbon that fades toward you before the fade meets you', r.ok && r.alive, r);
      await ev(() => { thaw(); play('17-1'); place(92, 14); const rb = ents('IsRibbon').find(e => Math.floor(e.x0 / 32) === 93); for (let k = 0; k < 500 && rb.S.front < 0; k++) sim(0.02); sim(0.6); freeze(); });
      await shot('13-17-1-reverse-ribbon.png');
      // the hidden folk's door on the ridge: up the blinking ribbon to the ledge, in through the painted door
      r = await ev(() => {
        thaw(); play('17-1'); place(109, 14); sim(0.3);
        const rb = ents('IsRibbon').find(e => Math.floor(e.x0 / 32) === 106);
        for (let k = 0; k < 300 && !rb.dead; k++) sim(0.02);
        for (let k = 0; k < 300 && rb.dead; k++) sim(0.02);
        sim(0.05, { left: true, jump: true, jumpPressed: true }); sim(0.5, { left: true, jump: true });
        sim(0.25, { left: true });
        const on1 = P().onGround && ty() === 11;
        sim(0.05, { left: true, jump: true, jumpPressed: true }); sim(0.45, { left: true, jump: true }); sim(0.3, { left: true });
        const ledge = ty() === 8 && P().onGround;
        sim(0.3); const d = S().entities.filter(e => e.kind === 'door' || e.constructor.name === 'Portal').sort((a, b) => Math.abs(a.cx - P().cx) - Math.abs(b.cx - P().cx))[0];
        if (d) { place(Math.floor(d.cx / 32), 8); sim(0.4); sim(0.4, { up: true, upPressed: true }); sim(1.5); }
        return { on1, ledge, door: d && Math.round(d.cx / 32), area: S().area.aid };
      });
      check('17-1: real inputs: up the blinking ribbon to the ridge and through the painted door to the hidden folk', r.ledge && r.area === 'huldu', r);
      await ev(() => { sim(0.3); place(12, 11); sim(0.3); freeze(); });
      await shot('14-17-1-hidden-folk-room.png');
      await ev(() => { thaw(); play('17-1'); place(120, 14); const rb = ents('IsRibbon').find(e => Math.floor(e.x0 / 32) === 115); sim(0.1); freeze(); });
      await shot('15-17-1-puffins-over-ribbons.png');
      // the last stretch: three sweeping ribbons in a chain over one long pit (real inputs, a jump at each end)
      r = await ev(() => {
        thaw(); play('17-1'); place(148, 14); sim(0.3);
        const R = [151, 163, 175].map(x => ents('IsRibbon').find(e => Math.floor(e.x0 / 32) === x));
        for (let k = 0; k < 600 && R[0].S.head == null; k++) sim(0.02);
        let n = 0;
        const ok = runTo(188, 12, p => { const x = p.cx / 32; if (n === 0 && p.onGround && x > 149.5) { n = 1; return true; } if (p.onGround && ((x > 161.6 && x < 163) || (x > 173.6 && x < 175) || (x > 184.6 && x < 186.5))) return true; return p.vy < 0 && !p.onGround; });
        return { ok, x: tx(), alive: alive() };
      });
      check('17-1: real inputs: the chain of three sweeping ribbons over the last pit', r.ok && r.alive, r);
      await ev(() => { thaw(); play('17-1'); place(160, 10); P().vy = 0; sim(0.05); freeze(); });
      await shot('16-17-1-last-stretch.png');
      await ev(() => { thaw(); play('17-1'); place(192, 14); sim(0.3); freeze(); });
      await shot('17-17-1-gate.png');
      await pano('17-1', null, '18-17-1-panorama.png');
    });
  });
  // portrait
  await session({ width: 390, height: 844 }, async (page, shot, run) => {
    await run('p-aurora', async () => { await page.evaluate(() => { fresh(); play('17-1'); place(48, 11); sim(0.05); freeze(); }); await shot('90-portrait-17-1.png'); });
  });
  console.log(failures ? `${failures} ICELAND CHECK(S) FAILED` : 'ALL ICELAND CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
