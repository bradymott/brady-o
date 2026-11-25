// Kenya (world 15): screenshots and in-browser checks of each level's new mechanic, played through the real game loop
// with real inputs (Input flags, 120 Hz steps): riding the wildebeest over a river and a thorn thicket (15-1), steering a
// giraffe's head with the leaves (15-2), hopping the panicking flamingos and riding a skein (15-3), the heat gauge and
// the elephant's shade (15-4), the hippo's lead-in (15-5; the fight is in boss_test), the sentries, the eagle and the
// burrows (15-6), the land's map. Phone landscape 844x390 @2x for every level, portrait 390x844 for 15-1, the boss and
// the map, and a panorama of each level's main area (stitched from views across it).
// usage: BRADY_DIST=<dist> node tools/sbw_ke_shots.js <outdir> [--checks] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : 'ke-shots'), checksOnly = args.includes('--checks');
const want = args.slice(1).filter(a => !a.startsWith('--'));
fs.mkdirSync(out, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); if (!ok) failures++; };

async function session(browser, viewport, fn) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await silence(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(appPage);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const B = window.BRADY, T = window.BRADY_TOUR;
    window.S = () => B.Game.scene; window.P = () => B.Game.scene.player; window.KK = T.keKit;
    // the real game loop's step, with real input flags: one press is a press for one frame, a hold stays held
    window.sim = (sec, inp) => {
      const G = B.Game, I = B.Input, steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (k > 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; } }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) if (typeof inp[key] === 'boolean') I[key] = false;
    };
    // hold inputs while a condition is not met (at most sec seconds); returns true if it was met
    window.until = (cond, sec, inp) => { const n = Math.round(sec * 120); for (let k = 0; k < n; k++) { if (cond()) return true; sim(1 / 120, inp); } return !!cond(); };
    window.fresh = () => { const d = B.Save.data; for (const k of ['done', 'unlocked', 'exits', 'secretExits', 'gold', 'best']) d[k] = {}; d.unlocked['1-1'] = true; d.tour = null; d.lives = 9; d.seenTourIntro = true; T.TourProgress.data(); };
    window.play = (id) => { const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9; const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(1.6); g.player.invuln = 0; return g; };
    window.place = (tx, ty) => { const g = S(), p = P(); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; p.ride = null; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.toArea = (aid, tx, ty) => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = (A.anchors && (A.anchors.in || A.anchors.start)) || g.level.start; if (g.area.idx !== k) g.loadArea(k, an.x, an.y); if (tx != null) place(tx, ty); };
    window.ents = name => S().entities.filter(e => e.constructor.name === name && !e.remove);
    // the way a player boards a wildebeest: stand still, watch one come up from behind, hop as it gets close
    window.hopOn = (bx) => {
      const p = P();
      for (let t = 0; t < 6; t++) {
        place(bx, 13); sim(0.05);
        if (!until(() => ents('KeGnu').some(e => e.x + e.w < p.cx - 1.4 * 32 && e.x + e.w > p.cx - 2.4 * 32), 6)) continue;
        sim(0.15, { jump: true, jumpPressed: true });
        if (until(() => p.ride && p.ride.constructor.name === 'KeGnu', 1.0)) return true;
      }
      return false;
    };
    window.freeze = () => { const g = S(); g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } };
    window.alive = () => { const p = P(); return !!p && !p.dead && p.state === 'play'; };
    // a camera view at world x (px), for the panorama
    window.viewAt = (x, y) => { const g = S(); g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, x)); if (y != null) g.camY = y; };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); if (checksOnly) return; await page.waitForTimeout(250); await page.screenshot({ path: path.join(out, name) }); };
  // a panorama of the current area: views stepped across it, stitched side by side in the page
  const pano = async (name, rows) => {
    if (checksOnly) return;
    await pin();
    const info = await page.evaluate(() => { const g = S(); freeze(); return { W: g.area.W * 32, vw: window.BRADY.Game.viewW, cssW: window.BRADY.Game.cssW }; });
    const bufs = [];
    for (let x = 0; x < info.W; x += info.vw) {
      await page.evaluate(x => { thaw(); const g = S(); viewAt(x, Math.max(0, g.area.H * 32 - window.BRADY.Game.viewH)); const p = P(); if (p) { p.x = -9999; } freeze(); }, x);
      await page.waitForTimeout(120);
      bufs.push((await page.screenshot({ type: 'jpeg', quality: 80 })).toString('base64'));
    }
    const data = await page.evaluate(async (bufs) => {
      const imgs = await Promise.all(bufs.map(b => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/jpeg;base64,' + b; })));
      // rows of six views, top to bottom (one long strip is too thin to look at)
      const w = imgs[0].width, h = imgs[0].height, sc = 0.5, per = 6, nr = Math.ceil(imgs.length / per), c = document.createElement('canvas'); c.width = Math.round(w * Math.min(per, imgs.length) * sc); c.height = Math.round(h * sc * nr + (nr - 1) * 6);
      const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height); imgs.forEach((im, i) => x.drawImage(im, (i % per) * w * sc, Math.floor(i / per) * (h * sc + 6), w * sc, h * sc));
      return c.toDataURL('image/jpeg', 0.8).split(',')[1];
    }, bufs);
    fs.writeFileSync(path.join(out, name), Buffer.from(data, 'base64'));
    await page.evaluate(() => thaw());
  };
  const run = async (name, f) => { if (want.length && !want.some(w => name.startsWith(w))) return; try { await pin(); await f(); } catch (e) { check(name + ' runs', false, String(e.stack || e.message).slice(0, 400)); } };
  await fn(page, shot, run, pano);
  check(`${viewport.width}x${viewport.height}: no page errors`, !errors.length, errors.slice(0, 5));
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  await session(browser, { width: 844, height: 390 }, async (page, shot, run, pano) => {
    /* ---------- 15-1 The Great Migration ---------- */
    await run('herd', async () => {
      await page.evaluate(() => { fresh(); play('15-1'); place(8, 13); sim(0.4); freeze(); });
      await shot('10-15-1-start.png');
      // ride: stand on the bank of the first river, run alongside a wildebeest and jump onto its back; it swims across
      const r = await page.evaluate(() => {
        thaw(); const g = S(), p = P();
        const rv = ents('KeRiver').sort((a, b) => a.x - b.x)[0], bank = Math.floor(rv.x / 32) - 4;
        place(bank, 13); sim(0.2);
        const rode = hopOn(bank);
        if (!rode) return { rode };
        const gnu = p.ride; let swam = false;
        // let go of the stick: the gnu carries him; hop off on the far bank
        const far = rv.x + rv.w;
        until(() => { if (gnu.swim) swam = true; return p.x > far + 32 || !alive(); }, 5);
        sim(0.3, { right: true });
        return { rode, swam, crossed: p.x > far, alive: alive() };
      });
      check('15-1: Brady hops onto a running wildebeest and rides it across the river (it swims)', r.rode && r.swam && r.crossed && r.alive, r);
      // a shot mid-river, riding
      await page.evaluate(() => {
        const g = S(), p = P(), rv = ents('KeRiver').sort((a, b) => a.x - b.x)[0], bank = Math.floor(rv.x / 32) - 4;
        hopOn(bank); until(() => p.cx > rv.x + rv.w * 0.45, 3); freeze();
      });
      await shot('11-15-1-riding-the-river.png');
      // the thorn thicket: too tall to jump; a wildebeest leaps it with Brady on its back
      const r2 = await page.evaluate(() => {
        thaw(); const g = S(), p = P();
        const A = g.area, rv = ents('KeRiver').sort((a, b) => a.x - b.x)[0];
        // the first hard column after the first river
        let tx = Math.floor((rv.x + rv.w) / 32); while (tx < A.W && A.tiles[13 * A.W + tx] !== window.BRADY.T.HARD) tx++;
        const hTop = (() => { let y = 13; while (A.tiles[(y - 1) * A.W + tx] === window.BRADY.T.HARD) y--; return y; })();
        // can he jump it alone? stand close and jump with a run-up: he must not get over
        place(tx - 7, 13); sim(0.2); sim(0.6, { right: true }); sim(0.9, { right: true, jump: true, jumpPressed: true });
        const alone = p.x > (tx + 1) * 32;
        let over = false; const rode = hopOn(tx - 9);
        let peak = 99;
        if (rode) { over = until(() => { peak = Math.min(peak, (p.y + p.h) / 32); return p.x > (tx + 3) * 32 || !alive(); }, 4); }
        return { hTop, alone, rode, over: over && alive(), peakRow: Math.round(peak * 10) / 10 };
      });
      check('15-1: the thorn thicket is too tall to jump alone, and a leaping wildebeest carries Brady over it', !r2.alone && r2.rode && r2.over && r2.peakRow < r2.hTop, r2);
      await page.evaluate(() => {
        const p = P(), A = S().area, rv = ents('KeRiver').sort((a, b) => a.x - b.x)[0];
        let tx = Math.floor((rv.x + rv.w) / 32); while (tx < A.W && A.tiles[13 * A.W + tx] !== window.BRADY.T.HARD) tx++;
        hopOn(tx - 9); until(() => p.cx > tx * 32 - 6, 3); freeze();
      });
      await shot('12-15-1-the-leap.png');
      // a crocodile: bubbles and eyes (the tell), then the lunge
      const r3 = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); p.invuln = 99;
        const c = ents('KeCroc').sort((a, b) => a.x - b.x)[0], rv = ents('KeRiver').find(r => r.x <= c.cx && r.x + r.w >= c.cx);
        hopOn(Math.floor(rv.x / 32) - 4);
        const told = until(() => c.state === 'tell', 6); const tellAt = g.t;
        const snapped = until(() => c.state === 'snap', 2); const tell = g.t - tellAt;
        sim(0.25); freeze();
        return { told, snapped, tell: Math.round(tell * 100) / 100 };
      });
      check('15-1: a crocodile gives a tell (bubbles, eyes) for at least 0.5 s before it lunges', r3.told && r3.snapped && r3.tell >= 0.5, r3);
      await shot('13-15-1-croc-lunge.png');
      await page.evaluate(() => { thaw(); P().invuln = 0; toArea('den'); place(6, 11); sim(0.4); freeze(); });
      await shot('14-15-1-termite-den.png');
      await page.evaluate(() => { thaw(); toArea('plain'); });
      await pano('19-15-1-panorama.jpg');
    });
    /* ---------- 15-2 Giraffe Grove ---------- */
    await run('necks', async () => {
      await page.evaluate(() => { fresh(); play('15-2'); place(14, 13); sim(0.3); freeze(); });
      await shot('20-15-2-start.png');
      // without the leaves a giraffe ignores him: standing on its head and holding UP does nothing
      const r0 = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); const gi = ents('KeGiraffe').sort((a, b) => a.x - b.x)[0];
        place(Math.floor(gi.x / 32) - 2, 13); sim(0.2); sim(0.2, { right: true, jump: true, jumpPressed: true }); until(() => p.ride === gi, 1, { right: true }); const y0 = gi.y; sim(1.0, { up: true });
        return { rode: p.ride === gi, moved: Math.round(y0 - gi.y), leaf: !!g.keLeaf };
      });
      check('15-2: without the leaves a giraffe ignores Brady (its head stays put)', !r0.leaf && Math.abs(r0.moved) < 2, r0);
      // take the leaves from the sapling: walk into it
      const r1 = await page.evaluate(() => {
        const g = S(), p = P(); const b = ents('KeLeafBush').sort((a, b) => a.x - b.x)[0];
        place(Math.floor(b.x / 32) - 3, 13); const got = until(() => !!g.keLeaf, 3, { right: true });
        return { got };
      });
      check('15-2: walking through an acacia sapling takes a bunch of leaves', r1.got, r1);
      // the lift: hop on the head, hold UP: the head rises to the cliff top; walk off onto the cliff
      const r2 = await page.evaluate(() => {
        const g = S(), p = P(); const gi = ents('KeGiraffe').sort((a, b) => a.x - b.x)[0];
        const cliffX = Math.floor(gi.x / 32) + 4;
        place(Math.floor(gi.x / 32) - 2, 13);
        until(() => gi.pos < 4, 4);   // it bends down to him
        sim(0.1); sim(0.25, { right: true, jump: true, jumpPressed: true });
        const rode = until(() => p.ride === gi, 1.2, { right: true });
        if (!rode) return { rode };
        const y0 = p.y; const up = until(() => gi.pos >= gi.len - 1, 6, { up: true });
        const rise = Math.round((y0 - p.y) / 32 * 10) / 10;
        until(() => p.x > (cliffX + 2) * 32 && p.onGround && p.ride !== gi, 2.5, { right: true });
        return { rode, up, rise, onCliff: p.onGround && p.ride !== gi && (p.y + p.h) / 32 < 9, row: (p.y + p.h) / 32, alive: alive() };
      });
      check('15-2: holding UP on the giraffe\'s head lifts Brady up the cliff (6 rows), and he walks off on top', r2.rode && r2.up && r2.rise >= 5.5 && r2.onCliff && r2.alive, r2);
      // mid-lift shot
      await page.evaluate(() => { const p = P(), gi = ents('KeGiraffe').sort((a, b) => a.x - b.x)[0]; place(Math.floor(gi.x / 32) - 2, 13); until(() => gi.pos < 4, 4); sim(0.1); sim(0.25, { right: true, jump: true, jumpPressed: true }); until(() => p.ride === gi, 1.2, { right: true }); sim(0.9, { up: true }); freeze(); });
      await shot('21-15-2-giraffe-lift.png');
      // the bridge: the head goes out across the gap and down to the far side
      const r3 = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); const L = ents('KeGiraffe').sort((a, b) => a.x - b.x); const gi = L[2];
        const a = gi.path[0], b = gi.path[gi.path.length - 1];
        place(Math.floor(a[0] / 32) - 3, 13); sim(0.2);
        until(() => gi.pos < 4, 4);
        sim(0.1); sim(0.25, { right: true, jump: true, jumpPressed: true });
        const rode = until(() => p.ride === gi, 1.2, { right: true });
        if (!rode) return { rode };
        const crossed = until(() => gi.pos >= gi.len - 1, 8, { up: true });
        sim(0.6, { right: true });
        return { rode, crossed, farSide: p.cx > b[0] - 16 && p.onGround && alive(), x: Math.round(p.cx / 32), bx: Math.round(b[0] / 32) };
      });
      check('15-2: a giraffe\'s neck is a bridge: hold UP and it carries Brady over the gap to the far side', r3.rode && r3.crossed && r3.farSide, r3);
      await page.evaluate(() => { const p = P(), gi = ents('KeGiraffe').sort((a, b) => a.x - b.x)[2], a = gi.path[0]; place(Math.floor(a[0] / 32) - 3, 13); until(() => gi.pos < 4, 9); sim(0.1); sim(0.25, { right: true, jump: true, jumpPressed: true }); until(() => p.ride === gi, 1.2, { right: true }); until(() => gi.pos > gi.len * 0.5, 4, { up: true }); freeze(); });
      await shot('22-15-2-giraffe-bridge.png');
      await page.evaluate(() => { thaw(); toArea('manor'); place(8, 11); sim(0.4); freeze(); });
      await shot('23-15-2-meerkat-burrow.png');
      await page.evaluate(() => { thaw(); toArea('grove'); });
      await pano('29-15-2-panorama.jpg');
    });
  });
  await session(browser, { width: 390, height: 844 }, async (page, shot, run) => {
    await run('p-herd', async () => { await page.evaluate(() => { fresh(); play('15-1'); place(40, 13); sim(1.5); freeze(); }); await shot('50-portrait-15-1.png'); });
  });
  await browser.close();
  console.log(failures ? `${failures} KENYA CHECK(S) FAILED` : 'ALL KENYA CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
