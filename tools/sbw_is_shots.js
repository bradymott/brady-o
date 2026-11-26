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
    window.alive = () => { const p = P(); return !p.dead && p.state !== 'dying'; };
    // is there nothing to stand on just ahead of Brady's feet (tiles or a live platform)? (a simple player's eye)
    window.edgeAhead = (p, d) => { const g = S(), x = p.cx + (d || 1) * 22, fy = p.y + p.h + 4, ST = [1, 2, 3, 4, 5, 7, 11, 12, 13, 16, 17, 19, 21, 22]; for (const yy of [fy, fy + 32]) { const t = g.area.tiles[Math.floor(yy / 32) * g.area.W + Math.floor(x / 32)]; if (ST.includes(t)) return false; } return !g.platforms.some(e => !e.dead && x > e.x && x < e.x + e.w && e.y - fy < 40 && e.y - fy > -96); };
    // (in these runs enemies can't hurt Brady (invuln) but pits, lava and crushers still kill him: die() ignores it)
    // a player's run: hold right, jump (and hold it) at every edge; stops at tile column x on the ground
    window.gapAhead = p => { let n = 0; for (let d = 1; d < 12; d++) { const q = { cx: p.cx + d * 32 - 22, y: p.y, h: p.h }; if (!edgeAhead(q)) return n; n++; } return n; };
    // the support ahead: the first stretch of ground or live platform beyond the edge, as [start, end] in px
    window.landingAhead = p => { let gap = false, a = null, b = null; for (let d = 4; d < 13 * 32; d += 6) { const q = { cx: p.cx + d - 22, y: p.y, h: p.h }, ok = !edgeAhead(q); if (!gap) { if (!ok) gap = true; continue; } if (ok && a == null) a = b = p.cx + d; else if (a != null) { if (ok) b = p.cx + d; else break; } } return a == null ? null : [a, b]; };
    // a careful player's run: walk, and at each edge jump at the middle of the next thing to stand on, steering in the air
    window.hop = (x, sec) => { let target = null, j0 = -1e9; return runTo(x, sec || 10, (p, k, I) => {
      if (p.onGround) { target = null; I.right = p.vx < 6.4 * 32; I.left = false; if (edgeAhead(p)) { const L = landingAhead(p); if (L) { target = Math.min(L[0] + 40, (L[0] + L[1]) / 2); j0 = k; return true; } } return false; }
      if (target != null) { const dx = target - p.cx, tLand = Math.max(0.05, (p.vy > 0 ? 0.25 : 0.5)), want = dx / tLand; I.right = p.vx < want - 40; I.left = p.vx > want + 40; }
      return p.vy < 0 && k - j0 < 0.32 * 120; }); };
    window.waitFor = (cond, sec) => { for (let k = 0; k < (sec || 8) * 50; k++) { if (cond()) return true; sim(0.02); if (!alive()) return false; } return cond(); };
    // walk (real inputs) toward tile column x (stops on reaching it; jumps if asked)
    window.walk = (x, sec, jump) => { const d = x * 32 + 16 > P().cx ? 1 : -1; let ok = false; sim(sec || 3, d > 0 ? { right: true } : { left: true }, (k, I) => { if (!alive()) return false; if ((P().cx - (x * 32 + 16)) * d >= -6) { ok = true; return false; } if (jump && k === 0) { I.jump = true; I.jumpPressed = true; } }); sim(0.4, null, (k, I) => { const v = P().vx; I.left = v * d > 20 && d > 0; I.right = v * d > 20 && d < 0; if (Math.abs(v) <= 20) return false; }); return ok && alive(); };
    window.plateAt = (x, y) => ents('IsPlate').find(e => e.A[0] === x && e.A[1] === y);
    // the hidden folk: walk right, and before each jump look the way the next plank wants (away from a painted plank,
    // at a white eye plank), tapping THROW to switch; steer to the plank's middle in the air
    window.shyHop = (x, sec) => { let target = null, j0 = -1e9, want = null, tBold = false; return runTo(x, sec || 12, (p, k, I) => {
      const look = !!p.isLookBack;
      if (want != null && look !== want && k % 6 === 0) { I.actionPressed = true; }
      if (p.onGround) {
        target = null; I.right = p.vx < 6.4 * 32; I.left = false;
        const next = ents('IsShyPlat').filter(e => e.x + e.w > p.cx + 30 && p.ride !== e).sort((a, b) => a.x - b.x)[0];
        const gate = ents('IsShyWall').find(e => e.x > p.cx && e.x - p.cx < 3 * 32);
        if (gate) want = true; else if (next && next.x - p.cx < 4 * 32) want = !next.bold; else if (!edgeAhead(p)) want = want;
        if (edgeAhead(p) && look === want) { const t = next && next.x - p.cx < 7 * 32 ? next : null; const L = t ? [t.x, t.x + t.w] : landingAhead(p); if (L) { target = (L[0] + L[1]) / 2; tBold = !!(t && t.bold); j0 = k; return true; } }
        if (edgeAhead(p) && look !== want) { I.right = false; I.left = p.vx > 20; }
        return false;
      }
      // (looking ahead at an eye plank, he never presses back: that would turn his head away from it)
      if (target != null) { const dx = target - p.cx, tLand = p.vy > 0 ? 0.25 : 0.5, v = dx / tLand; I.right = p.vx < v - 40; I.left = !(tBold && !look) && p.vx > v + 40; }
      return p.vy < 0 && k - j0 < 0.32 * 120; }); };
    window.tx = () => Math.floor(P().cx / 32); window.ty = () => Math.floor((P().y + P().h - 1) / 32);
    // hold right until Brady stands at tile column x (or dies); the jump button pressed when j(p) says so
    window.runTo = (x, sec, j) => { let r = false; sim(sec || 6, { right: true }, (k, I) => { const p = P(); if (!alive()) return false; if (p.cx >= x * 32 && p.onGround) { r = true; return false; } const want = j ? j(p, k, I) : false; I.jump = !!want; if (want === 'tap') I.jumpPressed = true; else I.jumpPressed = !!want && !I._held; I._held = !!want; }); return r; };
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
    if (process.env.IS_DBG) { console.log(JSON.stringify(await ev(new Function(process.env.IS_DBG)))); return; }
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
    // ---------------- 17-2 The Glacier Lagoon ----------------
    await run('berg', async () => {
      await ev(() => { thaw(); play('17-2'); place(8, 13); sim(0.4); freeze(); });
      await shot('20-17-2-start.png');
      const bergAt = x => ents('IsBerg').find(e => Math.floor(e.hx / 32) === x);
      // standing in the middle of a plain berg: it stays level; at its edge it tilts, creaks and rolls over
      let r = await ev(() => { thaw(); play('17-2'); const b = ents('IsBerg').find(e => Math.floor(e.hx / 32) === 16); place(18, 13); sim(3); const mid = { th: +b.th.toFixed(2), st: b.state }; place(20, 13); let maxTh = 0, rolled = false; for (let k = 0; k < 60; k++) { sim(0.05, { right: P().cx < b.x + b.w - 8 }); maxTh = Math.max(maxTh, b.th); if (b.state === 'roll') { rolled = true; break; } } return { mid, maxTh: +maxTh.toFixed(2), rolled, off: P().y > 14 * 32 || !alive() }; });
      check('17-2: a berg stays level with Brady in the middle; at its edge it tips and he rolls over or slides off', Math.abs(r.mid.th) < 0.05 && r.mid.st === 'float' && r.maxTh > 0.3 && (r.rolled || r.off), r);
      await ev(() => { thaw(); play('17-2'); const b = ents('IsBerg').find(e => Math.floor(e.hx / 32) === 16); place(20, 13); for (let k = 0; k < 80 && b.maxT < 0.5; k++) sim(0.05, { right: P().cx < b.x + b.w - 8 }); freeze(); });
      await shot('21-17-2-berg-creaks.png');
      // a seal is a counterweight: stand opposite it and the berg holds; stand on its side and it rolls
      r = await ev(() => { thaw(); play('17-2'); const b = ents('IsBerg').find(e => Math.floor(e.hx / 32) === 32); place(33, 13); sim(4); const opp = b.state; place(35, 13); let rolled = false; let off = false; for (let k = 0; k < 100; k++) { sim(0.05); if (b.state === 'roll') { rolled = true; break; } if (P().y + P().h > 14 * 32 + 8) { off = true; break; } } return { opp, rolled, off }; });
      check('17-2: a seal berg holds with Brady opposite the seal; on the seal\'s side it rolls or tips him off', r.opp === 'float' && (r.rolled || r.off), r);
      await ev(() => { thaw(); play('17-2'); place(33, 13); sim(1.2); freeze(); });
      await shot('22-17-2-seal-counterweight.png');
      // real inputs: the open lagoon, berg to berg to the sand (a player's run: jump at each edge)
      r = await ev(() => { thaw(); play('17-2'); place(44, 13); sim(0.3); const ok = hop(71, 10); return { ok, x: tx(), alive: alive() }; });
      check('17-2: real inputs: across the open lagoon on three bergs', r.ok && r.alive, r);
      r = await ev(() => { const runs = []; for (let a = 0; a < 3; a++) { thaw(); play('17-2'); place(98, 13); sim(0.3 + a * 0.9); const ok = hop(125, 12); runs.push(ok && alive() ? 'ok' : 'fell@' + tx()); } return { runs, ok: runs.every(x => x === 'ok') }; });
      check('17-2: real inputs: the twist: small seal bergs and a floe (three runs from different moments, each first try)', r.ok, r);
      await ev(() => { thaw(); play('17-2'); place(110, 13); sim(0.4); freeze(); });
      await shot('23-17-2-twist.png');
      r = await ev(() => { const runs = []; for (let a = 0; a < 3; a++) { thaw(); play('17-2'); place(150, 13); sim(0.3 + a * 0.9); const ok = hop(182, 14); runs.push(ok && alive() ? 'ok' : 'fell@' + tx()); } return { runs, ok: runs.every(x => x === 'ok'), alive: true }; });
      check('17-2: real inputs: the last stretch of drifting bergs (three runs from different moments, each first try)', r.ok, r);
      await ev(() => { thaw(); play('17-2'); place(137, 6); sim(0.3); freeze(); });
      await shot('24-17-2-ice-cave-shelf.png');
      await ev(() => { thaw(); toArea('cave', 10, 11); sim(0.3); freeze(); });
      await shot('25-17-2-ice-cave.png');
      await pano('17-2', null, '26-17-2-panorama.png');
    });
    // ---------------- 17-3 The Rift ----------------
    await run('quake', async () => {
      await ev(() => { thaw(); play('17-3'); place(8, 14); sim(0.4); freeze(); });
      await shot('30-17-3-start.png');
      // the teaching ferry: stand on it at one bank, it slides across and carries Brady to the other
      let r = await ev(() => { thaw(); play('17-3'); const f = plateAt(15, 15); waitFor(() => f.at === 0 && f.state === 'rest' && f.toNext() > 1.5); place(13, 14); sim(0.2); walk(16, 2); const x0 = tx(); waitFor(() => f.state === 'slide', 4); const told = true; waitFor(() => f.state === 'rest', 3); sim(0.1); return { x0, x1: tx(), on: P().onGround, alive: alive() }; });
      check('17-3: a ferry slab carries Brady across the trough', r.x1 - r.x0 >= 7 && r.on && r.alive, r);
      await ev(() => { thaw(); play('17-3'); const f = plateAt(15, 15); waitFor(() => f.state === 'rest' && f.toNext() < 0.6); place(17, 14); sim(0.05); freeze(); });
      await shot('31-17-3-ferry-rumble.png');
      // a crusher: standing under it as it grinds down is fatal (after its rumble); passing while it is up is not
      r = await ev(() => { thaw(); play('17-3'); const c = plateAt(35, 9); waitFor(() => c.at === 0 && c.state === 'rest' && c.toNext() < 1.4); place(36, 14); P().invuln = 0; let died = false; for (let k = 0; k < 150; k++) { sim(0.02); if (!alive()) { died = true; break; } } return { died }; });
      check('17-3: a crusher grinding down on Brady kills him (after a second of rumble)', r.died, r);
      r = await ev(() => { thaw(); play('17-3'); const c = plateAt(35, 9); place(33, 14); waitFor(() => c.state === 'slide'); waitFor(() => c.state === 'rest'); waitFor(() => c.state === 'slide'); waitFor(() => c.state === 'rest'); const up = c.at === 0; const ok = up && walk(39, 3); return { ok, alive: alive() }; });
      check('17-3: real inputs: walk under the crusher while it is up', r.ok && r.alive, r);
      await ev(() => { thaw(); play('17-3'); const c = plateAt(35, 9); waitFor(() => c.state === 'slide'); sim(0.3); place(31, 14); sim(0.02); freeze(); });
      await shot('32-17-3-crusher.png');
      // the chasm: board the ferry at the near bank, ride, wait on the island, board the next, ride, step off
      r = await ev(() => {
        thaw(); play('17-3'); place(39, 14); sim(0.2);
        const f1 = plateAt(41, 15), f2 = plateAt(53, 15), st = [];
        waitFor(() => f1.at === 0 && f1.state === 'rest' && f1.toNext() > 1.2, 8); walk(42, 2); st.push(tx());
        waitFor(() => f1.at === 1 && f1.state === 'rest', 4); sim(0.1); walk(51, 2); st.push(tx());
        waitFor(() => f2.at === 0 && f2.state === 'rest' && f2.toNext() > 1.2, 8); walk(54, 2); st.push(tx());
        waitFor(() => f2.at === 1 && f2.state === 'rest', 4); sim(0.1); walk(62, 2); st.push(tx());
        const res = { st, alive: alive(), x: tx() }; P().invuln = 999; return res;
      });
      check('17-3: real inputs: two ferries and an island across the chasm', r.alive && r.x >= 62, r);
      // the lift up to the cliff
      r = await ev(() => { thaw(); play('17-3'); place(65, 14); const l = plateAt(67, 15); waitFor(() => l.at === 0 && l.state === 'rest' && l.toNext() > 1); walk(68, 2); waitFor(() => l.at === 1 && l.state === 'rest', 5); sim(0.1); const ok = walk(73, 2); return { ok, y: ty(), alive: alive() }; });
      check('17-3: real inputs: the lift slab carries Brady up onto the cliff', r.ok && r.y === 9 && r.alive, r);
      // the last stretch: ferry, counter-ferry, an island under a crusher, a ferry
      r = await ev(() => {
        thaw(); play('17-3'); place(124, 14); sim(0.2);
        const f1 = plateAt(126, 15), f2 = plateAt(137, 15), cr = plateAt(145, 9), f3 = plateAt(147, 15), st = [];
        waitFor(() => f1.at === 0 && f1.state === 'rest' && f1.toNext() > 1.2, 8); walk(127, 2); st.push(tx());
        waitFor(() => f1.at === 1 && f1.state === 'rest', 4); sim(0.1); walk(136, 2); st.push(tx());
        waitFor(() => f2.at === 0 && f2.state === 'rest' && f2.toNext() > 1.0, 8); walk(138, 2); st.push(tx());
        waitFor(() => f2.at === 1 && f2.state === 'rest', 4); sim(0.1);
        waitFor(() => cr.at === 0 && cr.state === 'rest' && cr.toNext() > 1.6 && f3.at === 0 && f3.state === 'rest' && f3.toNext() > 0.8, 12); walk(148, 2); st.push(tx());
        waitFor(() => f3.at === 1 && f3.state === 'rest', 4); sim(0.1); walk(157, 2); st.push(tx());
        const res = { st, alive: alive(), x: tx() }; P().invuln = 999; return res;
      });
      check('17-3: real inputs: the last stretch (ferry, counter-ferry, the crusher island, ferry)', r.alive && r.x >= 157, r);
      await ev(() => { thaw(); play('17-3'); place(140, 13); sim(0.1); freeze(); });
      await shot('33-17-3-last-stretch.png');
      await ev(() => { thaw(); play('17-3'); place(86, 14); sim(0.3); freeze(); });
      await shot('34-17-3-fissure.png');
      await ev(() => { thaw(); toArea('tube', 12, 11); sim(0.3); freeze(); });
      await shot('35-17-3-lava-tube.png');
      await pano('17-3', null, '36-17-3-panorama.png');
    });
    // ---------------- 17-4 The Organ Pipes ----------------
    await run('basalt', async () => {
      await ev(() => { thaw(); play('17-4'); place(8, 11); sim(0.4); freeze(); });
      await shot('40-17-4-start.png');
      const pipeAt = 'window.pipeAt = x => ents(\'IsPipe\').find(e => Math.floor(e.x / 32) === x);';
      await ev(new Function(pipeAt));
      // a pipe sinks under Brady and rises again when he steps off; its sides are solid
      let r = await ev(() => { thaw(); play('17-4'); const pp = pipeAt(14); place(14, 11); sim(1.5); const sunk = Math.round((pp.y - pp.rest) / 32 * 10) / 10; place(11, 11); sim(2.5); const back = Math.round((pp.y - pp.rest) / 32 * 10) / 10; return { sunk, back }; });
      check('17-4: a column sinks under Brady and rises when he steps off', r.sunk >= 1 && r.back === 0, r);
      r = await ev(() => { thaw(); play('17-4'); const pp = pipeAt(18); place(16, 14); sim(1.0, { right: true }); return { x: Math.round(P().x + P().w), wall: Math.round(pp.x) }; });
      check('17-4: a column\'s side is solid (walking into it stops Brady)', r.x <= r.wall + 1, r);
      await ev(() => { thaw(); play('17-4'); place(14, 11); sim(1.2); freeze(); });
      await shot('41-17-4-pipe-sinks.png');
      r = await ev(() => { thaw(); play('17-4'); place(42, 11); let died = false; for (let k = 0; k < 120; k++) { sim(0.05); if (!alive()) { died = true; break; } } return { died }; });
      check('17-4: standing still on a lake column takes Brady under (the lava)', r.died, r);
      r = await ev(() => { thaw(); play('17-4'); const pp = pipeAt(27); place(28, 11); sim(2.2); return { up: Math.round((pp.rest - pp.y) / 32 * 10) / 10 }; });
      check('17-4: a blue lift column rises under Brady', r.up >= 3.5, r);
      // real inputs: the lake, then the fast pipes, then the last stretch (a careful player's run: hop at each edge)
      r = await ev(() => { thaw(); play('17-4'); place(34, 11); sim(0.2); const ok = hop(65, 12); return { ok, x: tx(), alive: alive() }; });
      check('17-4: real inputs: across the lava lake on sinking pipes', r.ok && r.alive, r);
      r = await ev(() => { thaw(); play('17-4'); place(86, 11); sim(0.05); place(84, 11); sim(0.2); return 0; });
      r = await ev(() => { thaw(); play('17-4'); place(119, 11); sim(0.2); const ok = hop(151, 12); return { ok, x: tx(), alive: alive() }; });
      check('17-4: real inputs: the twist: fast pipes and lifts', r.ok && r.alive, r);
      r = await ev(() => { thaw(); play('17-4'); place(156, 11); sim(0.2); const ok = hop(185, 12); return { ok, x: tx(), alive: alive() }; });
      check('17-4: real inputs: the last stretch of the fastest pipes', r.ok && r.alive, r);
      // the lift up to the steaming crack, and in
      r = await ev(() => { thaw(); play('17-4'); const pp = pipeAt(79); place(79, 11); waitFor(() => pp.rest - pp.y > 4.8 * 32, 4); sim(0.05, { right: true, jump: true, jumpPressed: true }); sim(0.5, { right: true, jump: true }); sim(0.4, { right: true }); const top = ty(); place(85, 4); sim(0.4); sim(0.4, { up: true, upPressed: true }); sim(1.5); return { top, area: S().area.aid }; });
      check('17-4: real inputs: ride the lift and jump to the crater shelf; the crack leads to the vent', r.top === 4 && r.area === 'vent', r);
      await ev(() => { sim(0.3); place(12, 11); sim(0.3); freeze(); });
      await shot('42-17-4-vent.png');
      await ev(() => { thaw(); play('17-4'); place(46, 11); sim(0.6); freeze(); });
      await shot('43-17-4-lava-lake.png');
      await ev(() => { thaw(); play('17-4'); place(130, 11); sim(0.4); freeze(); });
      await shot('44-17-4-twist.png');
      await pano('17-4', null, '45-17-4-panorama.png');
    });
    // ---------------- 17-5 The Night Troll: the shore, the hut, the cave (the fight itself: boss_test is) ----------------
    await run('lair', async () => {
      await ev(() => { thaw(); play('17-5'); place(8, 12); sim(0.4); freeze(); });
      await shot('50-17-5-shore.png');
      let r = await ev(() => { thaw(); play('17-5'); place(16, 12); sim(0.3); const ok = hop(36, 8); return { ok, alive: alive(), x: tx() }; });
      check('17-5: real inputs: the shore\'s blinking ribbons to the cave', r.ok && r.alive, r);
      await ev(() => { thaw(); toArea('hut', 10, 11); sim(0.3); freeze(); });
      await shot('51-17-5-turf-hut.png');
      r = await ev(() => { thaw(); play('17-5'); toArea('cave'); sim(0.2); const b = S().entities.find(e => e.boss); const p = P(); p.x = b.arenaX0 + 3 * 32; p.y = b.floorY - p.h - 2; sim(2.8); const sh = S().entities.filter(e => e.constructor.name === 'IsSunShield'); return { boss: b.state, shields: sh.length }; });
      check('17-5: the cave mouth: the troll wakes, two sun shields stand ready', r.boss === 'fight' && r.shields === 2, r);
      await ev(() => { sim(0.5); freeze(); });
      await shot('52-17-5-troll-cave.png');
      await pano('17-5', null, '53-17-5-panorama.png');
    });
    // ---------------- the secret rooms: every entrance found with real inputs, every game failed once and won ----------------
    await run('secrets', async () => {
      const kitOf = () => S().area.roomKit, R = () => S().area.roomState;
      // 17-1: the folk's ridge above the view: the coin trail up a blinking ribbon; up two ribbons, in at the rock door
      await ev(() => { thaw(); play('17-1'); place(108, 14); sim(0.4); freeze(); }); await shot('100-17-1-secret-tell-coin-trail.png');
      let r = await ev(() => {
        thaw(); play('17-1'); place(109, 14); sim(0.3);
        const u = ents('IsRibbon').find(e => Math.floor(e.x0 / 32) === 106);
        for (let k = 0; k < 300 && !u.dead; k++) sim(0.02); for (let k = 0; k < 300 && u.dead; k++) sim(0.02);
        sim(0.05, { left: true, jump: true, jumpPressed: true }); sim(0.45, { left: true, jump: true }); sim(0.15);
        const on1 = ty();
        sim(0.05, { jump: true, jumpPressed: true }); sim(0.4, { jump: true }); sim(0.2);
        const on2 = ty();
        sim(0.05, { jump: true, jumpPressed: true }); sim(0.45, { jump: true }); sim(0.3); sim(0.5, { left: true }); sim(0.2);
        const ledge = ty();
        const d = ents('Portal').find(e => e.target && Math.abs(e.cx - P().cx) < 6 * 32); if (d) { walk(Math.floor(d.cx / 32), 2); sim(0.3, { up: true, upPressed: true }); sim(1.5); }
        return { on1, on2, ledge, area: S().area.aid };
      });
      check('17-1 secret: real inputs: up two blinking ribbons to the ledge above the view, in at the rock door', r.ledge === 5 && r.area === 'huldu', r);
      r = await ev(() => { const g = S(), A = g.area, R = A.roomState, bells = ents('IsBell'), tune = A.roomKit.data.tune; P().x = bells[0].cx + 128; for (let k = 0; k < 1000 && R.demo > 0; k++) sim(1 / 120); const wrong = bells.find(b => b.k !== tune[0]); P().x = wrong.cx - P().w / 2; P().y = wrong.y + wrong.h - P().h; P().vy = 0; sim(0.06); const failed = R.demo > 0 && !R.won; P().x = bells[0].cx + 128; for (let k = 0; k < 1000 && R.demo > 0; k++) sim(1 / 120); for (const k of tune) { const b = bells.find(e => e.k === k); P().x = b.cx - P().w / 2; P().y = b.y + b.h - P().h; sim(0.06); P().x = b.cx + 80; sim(0.06); } return { failed, won: R.won }; });
      check('17-1 THE FOLK\'S BELLS: a wrong bell rings flat and the tune replays; the tune rung back wins', r.failed && r.won, r);
      await ev(() => { sim(0.6); freeze(); }); await shot('101-17-1-folk-bells.png');
      r = await ev(() => { thaw(); const d = ents('Portal').find(e => e.target); P().x = d.cx - P().w / 2; sim(0.3); sim(0.3, { up: true, upPressed: true }); sim(1.5); return { area: S().area.aid, x: tx() }; });
      check('17-1: the bells room\'s door lets Brady out at the foot of the ridge (not the ledge he came in by)', r.area === 'field' && r.x >= 104 && r.x <= 108, r);
      // 17-2: a crack in the glacier above the second stretch (cold mist puffs, a tiny painted door): ride the rising floe up
      await ev(() => { thaw(); play('17-2'); place(137, 6); sim(0.4); freeze(); }); await shot('102-17-2-secret-tell-crack.png');
      r = await ev(() => { thaw(); play('17-2'); place(133, 13); sim(0.3); const f = S().entities.find(e => e.skin === 'isFloe' && Math.floor(e.hx / 32) === 134); for (let k = 0; k < 400 && !(Math.abs(f.y - f.hy) < 4); k++) sim(0.02); sim(0.05, { jump: true, jumpPressed: true }); sim(0.3, { jump: true, right: true }); sim(0.3); const onFloe = P().ride === f; for (let k = 0; k < 400 && f.y > f.hy - 2.9 * 32; k++) sim(0.02); sim(0.05, { right: true, jump: true, jumpPressed: true }); sim(0.3, { right: true, jump: true }); sim(0.3, { right: true }); const shelf = ty(); walk(139, 2); sim(0.3); sim(0.3, { up: true, upPressed: true }); sim(1.5); return { onFloe, shelf, area: S().area.aid }; });
      check('17-2 secret: real inputs: ride the floe up to the glacier shelf, in at the crack', r.area === 'cave', r);
      r = await ev(() => { const R = S().area.roomState, kit = S().area.roomKit; P().x += 160; for (let k = 0; k < 4000 && R.phase !== 'rest'; k++) sim(1 / 120); const failed = R.phase === 'rest' && !R.won; for (let k = 0; k < 400 && R.phase !== 'run'; k++) sim(1 / 120); for (const e of S().entities.filter(e => e.constructor.name === 'TourMazeKey' || e.isKey || (e.id && String(e.id).startsWith('tok:')))) { P().x = e.cx - P().w / 2; P().y = e.y + e.h - P().h; sim(0.08); } return { failed, won: R.won }; });
      check('17-2 THE PUFFIN EGG ROUNDUP: time runs out once (the round restarts), then every egg is grabbed in time', r.failed && r.won, r);
      await ev(() => { sim(0.6); freeze(); }); await shot('103-17-2-egg-roundup.png');
      r = await ev(() => { thaw(); const d = ents('Portal').find(e => e.target); P().x = d.cx - P().w / 2; P().y = 11 * 32 - P().h; P().vy = 0; sim(0.3); sim(0.3, { up: true, upPressed: true }); sim(1.5); return { area: S().area.aid, x: tx() }; });
      check('17-2: the ice cave lets Brady out further along the lagoon (by checkpoint 2)', r.area === 'lagoon' && r.x >= 145, r);
      // 17-3: the one crack in the flat with steam in it: walk into it on purpose
      await ev(() => { thaw(); play('17-3'); place(109, 14); sim(0.4); freeze(); }); await shot('104-17-3-secret-tell-steam.png');
      r = await ev(() => { thaw(); play('17-3'); place(109, 14); sim(0.3); sim(1.6, { right: true }, () => { if (S().area.aid !== 'rift') return false; }); sim(1.5); return { area: S().area.aid, alive: alive() }; });
      check('17-3 secret: real inputs: walking into the steaming fissure drops Brady into the lava tube (alive)', r.area === 'tube' && r.alive, r);
      r = await ev(() => { const R = S().area.roomState; P().x = S().area.W * 16; for (let k = 0; k < 900 && !(R.mobs && R.mobs.length); k++) sim(1 / 120); const barred = !!R.bars; for (let w = 0; w < 30 && !R.won; w++) { for (const m of (R.mobs || [])) if (!m.dead && !m.remove) m.hit('stomp', P()); sim(0.5); } return { barred, won: R.won }; });
      check('17-3 THE SHEEP SHELTER: the door bars, the rams drop in; stomped, the shelter opens', r.barred && r.won, r);
      await ev(() => { sim(0.6); freeze(); }); await shot('105-17-3-sheep-shelter.png');
      r = await ev(() => { thaw(); const d = ents('Portal').find(e => e.target); P().x = d.cx - P().w / 2; sim(0.3); sim(0.3, { up: true, upPressed: true }); sim(1.5); return { area: S().area.aid, x: tx() }; });
      check('17-3: the lava tube lets Brady out past the fissure', r.area === 'rift' && r.x >= 116, r);
      // 17-4: the coin trail up the tall lift column; ride it above the view, run the crater rim to the steaming vent
      await ev(() => { thaw(); play('17-4'); place(78, 11); sim(0.4); freeze(); }); await shot('106-17-4-secret-tell-lift.png');
      r = await ev(() => { thaw(); play('17-4'); place(79, 11); const pp = ents('IsPipe').find(e => Math.floor(e.x / 32) === 79); waitFor(() => pp.rest - pp.y > 8.6 * 32, 6); sim(0.05, { right: true, jump: true, jumpPressed: true }); sim(0.4, { right: true, jump: true }); sim(0.3, { right: true }); const rim = ty(); const ok = hop(107, 8); walk(108, 1); sim(0.3); sim(0.3, { up: true, upPressed: true }); sim(1.5); return { rim, ok, area: S().area.aid }; });
      check('17-4 secret: real inputs: the lift above the view, the run along the crater rim, in at the vent', r.rim === 2 && r.area === 'vent', r);
      await ev(() => { thaw(); play('17-4'); place(96, 2); sim(0.3); freeze(); }); await shot('107-17-4-crater-rim-run.png');
      r = await ev(() => { thaw(); play('17-4'); toArea('vent'); sim(0.5); const R = S().area.roomState, kit = S().area.roomKit, keys = ents('IsOrganKey'), on = e => { P().x = e.cx - P().w / 2; P().y = e.y - P().h; P().vy = 0; sim(0.12); P().x = S().area.anchors.in.x + 40; P().y = 11 * 32 - P().h; sim(0.12); }; on(keys.find(e => e.k === kit.data.tune[0])); on(keys.find(e => e.k !== kit.data.tune[1] && e.k !== kit.data.tune[0])); const failed = R.step === 0 && !R.won; for (const k of kit.data.tune) on(keys.find(e => e.k === k)); return { failed, won: R.won }; });
      check('17-4 THE TROLL\'S LULLABY: a wrong pipe plays a sour chord (from the top); the slate\'s tune wins', r.failed && r.won, r);
      await ev(() => { sim(0.6); freeze(); }); await shot('108-17-4-trolls-lullaby.png');
      r = await ev(() => { thaw(); const d = ents('Portal').find(e => e.target); P().x = d.cx - P().w / 2; P().y = 11 * 32 - P().h; sim(0.3); sim(0.3, { up: true, upPressed: true }); sim(1.5); return { area: S().area.aid, x: tx() }; });
      check('17-4: the vent lets Brady out on the ledge before checkpoint 2', r.area === 'crater' && r.x >= 114, r);
      // 17-5: the turf hut (the land's one plain door): three bowls of skyr (the shuffle is played by sbw_rooms_test)
      r = await ev(() => { thaw(); play('17-5'); place(13, 12); sim(0.3); sim(0.3, { up: true, upPressed: true }); sim(1.5); return { area: S().area.aid, kind: S().area.roomKit && S().area.roomKit.kind }; });
      check('17-5: the turf hut holds three bowls of skyr (a shell game)', r.area === 'hut' && r.kind === 'shell', r);
      await ev(() => { sim(4); freeze(); }); await shot('109-17-5-skyr-bowls.png');
      // 17-6: the folk's door in a rock is there only while Brady looks back
      await ev(() => { thaw(); play('17-6'); place(83, 14); sim(0.4); freeze(); }); await shot('110-17-6-secret-tell-before.png');
      r = await ev(() => { thaw(); play('17-6'); place(85, 14); sim(0.3); sim(0.3, { up: true, upPressed: true }); sim(1.0); const ahead = S().area.aid; sim(0.05, { action: true, actionPressed: true }); sim(0.3); sim(0.3, { up: true, upPressed: true }); sim(1.5); return { ahead, area: S().area.aid }; });
      check('17-6 secret: real inputs: the rock door does nothing while Brady looks ahead; looking back (THROW) it lets him in', r.ahead === 'folk' && r.area === 'house', r);
      r = await ev(() => { const R = S().area.roomState, p = P(), L = ents('IsFolkLight'); p.isLookBack = false; sim(0.1); const e0 = L[0]; p.x = e0.cx - 14 - p.w / 2; p.y = e0.y + e0.h - p.h; sim(0.1); const failed = !R.got; sim(0.05, { action: true, actionPressed: true }); sim(0.1); for (const e of L) { p.x = e.cx - 14 - p.w / 2; p.y = e.y + e.h - p.h; p.vy = 0; sim(0.06); } return { failed, won: R.won, look: !!p.isLookBack }; });
      check('17-6 THE SHY LANTERNS: looking at a lantern it is not there; looking back Brady gathers all five', r.failed && r.won, r);
      await ev(() => { sim(0.6); freeze(); }); await shot('111-17-6-shy-lanterns.png');
      r = await ev(() => { thaw(); const d = ents('Portal').find(e => e.target); P().x = d.cx - P().w / 2; P().y = 11 * 32 - P().h; sim(0.3); sim(0.3, { up: true, upPressed: true }); sim(1.5); return { area: S().area.aid, x: tx() }; });
      check('17-6: the folk\'s parlour lets Brady out past the twist, by checkpoint 2', r.area === 'folk' && r.x >= 104, r);
    });
    // ---------------- the land's map ----------------
    await run('owmap', async () => {
      const r = await ev(() => { thaw(); const d = window.BRADY.Save.data; ['17-1', '17-2', '17-3', '17-4', '17-5', '17-6'].forEach(id => d.unlocked[id] = true); window.BRADY.goToMap('world', 17, '17-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { cc: s.ow && s.ow.cc }; });
      check('Iceland has its own walkable map', r.cc === 'is', r);
      await ev(() => freeze()); await shot('70-iceland-map.png');
    });
    // ---------------- 17-6 The Hidden Folk ----------------
    await run('shy', async () => {
      await ev(() => { thaw(); play('17-6'); place(8, 14); sim(0.4); freeze(); });
      await shot('60-17-6-start.png');
      // THROW makes Brady look back; walking right he then faces left; the plank ahead appears only then
      let r = await ev(() => { thaw(); play('17-6'); place(13, 14); sim(0.3); const pl = ents('IsShyPlat').find(e => Math.floor(e.x / 32) === 15); sim(0.2, { right: true }); const before = { facing: P().facing, there: !pl.dead }; sim(0.05, { action: true, actionPressed: true }); sim(0.3, { right: true }); return { before, after: { facing: P().facing, look: !!P().isLookBack, there: !pl.dead } }; });
      check('17-6: THROW looks back: walking right Brady faces left, and the folk plank ahead appears', r.before.facing === 1 && !r.before.there && r.after.facing === -1 && r.after.look && r.after.there, r);
      r = await ev(() => { thaw(); play('17-6'); place(20, 14); sim(0.3); const f = []; sim(0.3, { left: true }); f.push(P().facing); sim(0.05, { action: true, actionPressed: true }); sim(0.3, { left: true }); f.push(P().facing); sim(0.3, { right: true }); f.push(P().facing); sim(0.05, { action: true, actionPressed: true }); sim(0.3, { left: true }); f.push(P().facing); return { f }; });
      check('17-6: only THROW turns his head: walking or braking either way never does', r.f.join(',') === '1,-1,-1,1', r);
      await ev(() => { thaw(); play('17-6'); place(14, 14); sim(0.3); sim(0.05, { action: true, actionPressed: true }); sim(0.3, { right: true }); freeze(); });
      await shot('61-17-6-looking-back.png');
      // the gate: blocks Brady while he looks at it; he backs through it while looking away
      r = await ev(() => { thaw(); play('17-6'); place(29, 14); sim(0.2); sim(1.0, { right: true }); const blocked = tx() < 32; sim(0.05, { action: true, actionPressed: true }); sim(1.0, { right: true }); return { blocked, through: tx() > 32 }; });
      check('17-6: a folk gate stops Brady facing it; looking back he walks through it backwards', r.blocked && r.through, r);
      await ev(() => { thaw(); play('17-6'); place(30, 14); sim(0.3, { right: true }); freeze(); });
      await shot('62-17-6-folk-gate.png');
      // real inputs: the teaching dip, the test over the pits, the twist (both kinds), the last stretch
      for (const [a, b, label] of [[13, 28, 'the teaching dip'], [35, 54, 'the first pits, walking backwards'], [57, 78, 'the second pits'], [86, 106, 'the twist: eye planks and folk planks in turn'], [107, 151, 'the last stretch, gates and both kinds']]) {
        r = await ev(([a, b]) => { const runs = []; for (let t = 0; t < 3; t++) { thaw(); play('17-6'); place(a, 14); sim(0.3 + t * 0.7); const ok = shyHop(b, 14); runs.push(ok && alive() ? 'ok' : 'fell@' + tx()); } return { runs, ok: runs.every(x => x === 'ok'), alive: true }; }, [a, b]);
        check('17-6: real inputs (three runs, each first try): ' + label, r.ok, r);
      }
      await ev(() => { thaw(); play('17-6'); place(95, 11); sim(0.05, { action: true, actionPressed: true }); sim(0.3); freeze(); });
      await shot('63-17-6-twist.png');
      await ev(() => { thaw(); toArea('house', 10, 11); sim(0.3); freeze(); });
      await shot('64-17-6-folk-house.png');
      await pano('17-6', null, '65-17-6-panorama.png');
    });
  });
  // portrait
  await session({ width: 390, height: 844 }, async (page, shot, run) => {
    await run('p-aurora', async () => { await page.evaluate(() => { fresh(); play('17-1'); place(48, 11); sim(0.05); freeze(); }); await shot('90-portrait-17-1.png'); });
    await run('p-lair', async () => { await page.evaluate(() => { thaw(); play('17-5'); toArea('cave'); const b = S().entities.find(e => e.boss); const p = P(); p.x = b.arenaX0 + 10 * 32; p.y = b.floorY - p.h - 2; sim(2.8); b.x = p.cx + 3.5 * 32; sim(0.4); freeze(); }); const inView = await page.evaluate(() => { const g = S(), b = S().entities.find(e => e.boss), G = window.BRADY.Game; return b.x + b.w > g.camX && b.x < g.camX + G.viewW; }); check('17-5 portrait: the troll is in view', inView); await shot('91-portrait-17-5-troll.png'); });
    await run('p-map', async () => { await page.evaluate(() => { thaw(); const d = window.BRADY.Save.data; ['17-1', '17-2', '17-3', '17-4', '17-5', '17-6'].forEach(id => d.unlocked[id] = true); window.BRADY.goToMap('world', 17, '17-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } freeze(); }); await shot('92-portrait-iceland-map.png'); });
  });
  console.log(failures ? `${failures} ICELAND CHECK(S) FAILED` : 'ALL ICELAND CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
