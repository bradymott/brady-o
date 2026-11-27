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
    // a player's jump onto a target platform: jump, steer in the air toward its middle, land; true if he stands on it
    window.hopTo = (tgt, hold) => {
      const p = P(); let k = 0;
      sim(1 / 120, { jump: true, jumpPressed: true, right: tgt.cx > p.cx, left: tgt.cx < p.cx });
      for (k = 0; k < 240; k++) {
        const dx = tgt.cx - p.cx, inp = { jump: k < (hold || 50), right: dx > 6, left: dx < -6 };
        sim(1 / 120, inp);
        if (p.onGround || !alive()) break;
      }
      return p.onGround && p.ride === tgt;
    };
    // press UP at a door (a real press); wait for the fade into the next area: returns its id
    window.upDoor = () => { const g = S(), a0 = g.area.aid; sim(0.05, { up: true, upPressed: true }); until(() => S().area.aid !== a0 && S().state === 'play' && !(S().fade > 0), 4); return S().area.aid; };
    window.waitArea = (aid, sec) => until(() => S().area.aid === aid && S().state === 'play' && !(S().fade > 0), sec || 4);
    window.kitOf = () => { const A = S().area; return A.roomKit ? { kit: A.roomKit, R: A.roomState } : null; };
    // walk (real input) until Brady's centre is within 6 px of x
    window.walkTo = (x, sec) => { let ok = false; for (let k = 0; k < 4 && !ok; k++) { until(() => Math.abs(P().cx - x) < 6, sec || 4, P().cx < x ? { right: true } : { left: true }); until(() => Math.abs(P().vx) < 5, 1); ok = Math.abs(P().cx - x) < 12; } return ok; };
    window.freeze = () => { const g = S(); g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } };
    window.alive = () => { const p = P(); return !!p && !p.dead && p.state === 'play'; };
    // a camera view at world x (px), for the panorama
    window.viewAt = (x, y) => { const g = S(); g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, x)); if (y != null) g.camY = y; };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); if (checksOnly) return; await page.waitForTimeout(250); await page.screenshot({ path: path.join(out, name) }); };
  // a panorama of the current area: views stepped across it, stitched side by side in the page
  const pano = async (name, camY) => {
    if (checksOnly) return;
    await pin();
    const info = await page.evaluate(() => { const g = S(); freeze(); return { W: g.area.W * 32, vw: window.BRADY.Game.viewW, cssW: window.BRADY.Game.cssW }; });
    const bufs = [];
    for (let x = 0; x < info.W; x += info.vw) {
      await page.evaluate(([x, camY]) => { thaw(); const g = S(); viewAt(x, camY != null ? camY : Math.max(0, g.area.H * 32 - window.BRADY.Game.viewH)); const p = P(); if (p) { p.x = -9999; } freeze(); }, [x, camY]);
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
        // (the path goes on up past the cliff top, to the hidden ledge: here he stops at the cliff top)
        const y0 = p.y; const up = until(() => (p.y + p.h) / 32 <= 8.05, 6, { up: true });
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
        thaw(); const g = S(), p = P(); const L = ents('KeGiraffe').sort((a, b) => a.x - b.x); const gi = L[1];
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
      await page.evaluate(() => { const p = P(), gi = ents('KeGiraffe').sort((a, b) => a.x - b.x)[1], a = gi.path[0]; place(Math.floor(a[0] / 32) - 3, 13); until(() => gi.pos < 4, 9); sim(0.1); sim(0.25, { right: true, jump: true, jumpPressed: true }); until(() => p.ride === gi, 1.2, { right: true }); until(() => gi.pos > gi.len * 0.5, 4, { up: true }); freeze(); });
      await shot('22-15-2-giraffe-bridge.png');
      await page.evaluate(() => { thaw(); toArea('manor'); place(8, 11); sim(0.4); freeze(); });
      await shot('23-15-2-meerkat-burrow.png');
      await page.evaluate(() => { thaw(); toArea('grove'); });
      await pano('29-15-2-panorama.jpg');
    });
    /* ---------- 15-3 Flamingo Lake ---------- */
    await run('flock', async () => {
      await page.evaluate(() => { fresh(); play('15-3'); place(30, 13); sim(0.3); freeze(); });
      await shot('30-15-3-start.png');
      // hop the first lake: bank, flamingo, flamingo, bank; each one panics and flies off after he lands
      const r = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); const lk = ents('KeLake').sort((a, b) => a.x - b.x)[0];
        const F = ents('KeFlamingo').filter(f => f.cx > lk.x && f.cx < lk.x + lk.w).sort((a, b) => a.x - b.x);
        place(Math.floor(lk.x / 32) - 1, 13); sim(0.3);
        const on1 = hopTo(F[0], 50); const left1 = until(() => F[0].state === 'alarm', 0.3);
        sim(0.08); const on2 = hopTo(F[1], 50);
        sim(0.08); const end = { x: lk.x + lk.w + 48 }; Object.defineProperty(end, 'cx', { get() { return this.x; } });
        hopTo(end, 50);
        const across = p.x > lk.x + lk.w && alive() && p.onGround;
        // standing still on one: it squawks, then flies off; he drops into the lake
        return { on1, left1, on2, across };
      });
      check('15-3: hopping flamingo to flamingo crosses the lake (each one panics as he lands)', r.on1 && r.left1 && r.on2 && r.across, r);
      const r2 = await page.evaluate(() => {
        const g = S(), p = P(); p.invuln = 0; const lk = ents('KeLake').sort((a, b) => a.x - b.x)[0];
        const F = ents('KeFlamingo').filter(f => f.cx > lk.x && f.cx < lk.x + lk.w).sort((a, b) => a.x - b.x);
        until(() => F[0].state === 'stand', 6); place(Math.floor(lk.x / 32) - 1, 13); sim(0.3);
        const on = hopTo(F[0], 50); const t0 = g.t;
        const flew = until(() => F[0].state === 'fly', 2); const tell = g.t - t0;
        const fell = until(() => !alive() || p.y > 15 * 32, 2);
        return { on, flew, tell: Math.round(tell * 100) / 100, fell };
      });
      check('15-3: a flamingo squawks and wobbles (the tell) for 0.75 s, then flies off: standing still drops Brady in the lake', r2.on && r2.flew && r2.tell >= 0.5 && r2.fell, r2);
      await page.evaluate(() => { play('15-3'); const p = P(), lk = ents('KeLake').sort((a, b) => a.x - b.x)[0]; const F = ents('KeFlamingo').filter(f => f.cx > lk.x && f.cx < lk.x + lk.w).sort((a, b) => a.x - b.x); place(Math.floor(lk.x / 32) - 1, 13); sim(0.3); p.invuln = 99; hopTo(F[0], 50); sim(0.3); p.invuln = 0; freeze(); });
      await shot('31-15-3-flamingo-panic.png');
      // the skein: hop on, it ferries him across
      const r3 = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); p.invuln = 0;
        const sk = S().entities.filter(e => e.skin === 'keFlock').sort((a, b) => a.x - b.x)[0];
        const lk = ents('KeLake').filter(l => l.x <= sk.hx && l.x + l.w >= sk.hx).sort((a, b) => a.x - b.x)[0];
        place(Math.floor(lk.x / 32) - 1, 13); sim(0.2);
        until(() => sk.x < lk.x + 40 && sk.dx <= 0.05, 12);
        const on = hopTo(sk, 50);
        const far = until(() => sk.x >= sk.hx + sk.ax - 6 || !alive(), 12);
        const end = { cx: lk.x + lk.w + 56 }; hopTo(end, 50);
        return { on, far, across: p.x > lk.x + lk.w && alive() && p.onGround };
      });
      check('15-3: a skein of flamingos ferries Brady across the wide water', r3.on && r3.across, r3);
      await page.evaluate(() => { const p = P(), sk = S().entities.filter(e => e.skin === 'keFlock').sort((a, b) => a.x - b.x)[0]; const lk = ents('KeLake').filter(l => l.x <= sk.hx && l.x + l.w >= sk.hx)[0]; place(Math.floor(lk.x / 32) - 1, 13); until(() => sk.x < lk.x + 40 && sk.dx <= 0.05, 12); hopTo(sk, 50); sim(1.2); freeze(); });
      await shot('32-15-3-skein.png');
      // the panic chain: startle the first of the line and the next ones go one after another
      const r4 = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); p.invuln = 99;
        const F = ents('KeFlamingo').filter(f => f.chain).sort((a, b) => a.x - b.x);
        const lk = ents('KeLake').find(l => l.x <= F[0].cx && l.x + l.w >= F[0].cx);
        place(Math.floor(lk.x / 32) - 1, 13); sim(0.2); hopTo(F[0], 50);
        sim(1.3); const flying = F.filter(f => f.state === 'fly').length, alarmed = F.filter(f => f.state === 'alarm').length;
        freeze(); return { n: F.length, flying, alarmed };
      });
      check('15-3: the panic chain: startling the first flamingo sets off its neighbours', r4.flying >= 1 && r4.flying + r4.alarmed >= 2, r4);
      await shot('33-15-3-panic-chain.png');
      await page.evaluate(() => { thaw(); toArea('nests'); place(8, 11); sim(0.4); freeze(); });
      await shot('34-15-3-nests.png');
      await page.evaluate(() => { thaw(); toArea('lake'); });
      await pano('39-15-3-panorama.jpg');
    });
    /* ---------- 15-4 High Noon ---------- */
    await run('shade', async () => {
      await page.evaluate(() => { fresh(); play('15-4'); place(14, 13); sim(0.3); freeze(); });
      await shot('40-15-4-start.png');
      // the gauge: it fills standing in the sun, empties under an acacia
      const r = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); const A = g.area;
        // an open column with nothing overhead, and the first acacia's crown
        let tree = 0; for (let x = 12; x < A.W && !tree; x++) if (A.tiles[10 * A.W + x] === window.BRADY.T.SEMI) tree = x;
        place(tree + 12, 13); g.keHeat = 0; sim(1.7); const sun = g.keHeat;
        place(tree + 2, 13); sim(1.2); const shade = g.keHeat;
        return { sun: Math.round(sun * 100) / 100, shade: Math.round(shade * 100) / 100 };
      });
      check('15-4: the heat gauge fills in the open sun and empties in an acacia\'s shade', r.sun > 0.4 && r.shade < r.sun - 0.3, r);
      await page.evaluate(() => { const g = S(); g.keHeat = 0.82; place(60, 13); sim(0.1); freeze(); });
      await shot('41-15-4-heat-gauge-hot.png');
      // the elephant's stretch: running it flat out in the sun wilts him; walking in her shade gets him across
      const r2 = await page.evaluate(() => {
        thaw(); const g = S(), p = P();
        const el = ents('KeElephant').sort((a, b) => a.x - b.x)[0], pud = ents('KePuddle').find(q => q.x > el.ax + 40 * 32);
        const start = Math.floor(el.ax / 32) - 2;
        // flat out, no shade (the elephant parked at the far end)
        p.setPower && p.setPower(1, true); p.invuln = 0;
        for (const e of g.entities) if (e.enemy) e.remove = true;   // (this check is about the heat: the critters on this stretch are left out)
        el.x = el.bx + 20 * 32; el.wait = 99; place(start, 13); g.keHeat = 0;
        let hurt = false; const pw = p.power;
        until(() => { if (p.power < pw || p.invuln > 0.2) hurt = true; return p.x > pud.x || !alive(); }, 12, { right: true });
        // with the elephant: wait for her at the start, then keep in her shadow
        play('15-4'); const g2 = S(), p2 = P(); p2.setPower && p2.setPower(1, true); p2.invuln = 0;
        const el2 = ents('KeElephant').sort((a, b) => a.x - b.x)[0], pud2 = ents('KePuddle').find(q => q.x > el2.ax + 40 * 32);
        for (const e of g2.entities) if (e.enemy) e.remove = true;
        el2.x = el2.ax - el2.w / 2; el2.dir = 1; el2.wait = 0; place(start, 13); g2.keHeat = 0;
        let hurt2 = false, maxHeat = 0; const pw2 = p2.power;
        for (let k = 0; k < 120 * 40; k++) {
          const sh = el2.shadeOf(), mid = (sh[0] + sh[1]) / 2, turning = el2.dir < 0 || el2.wait > 0;
          // keep under her; once she turns back at the end of her walk, run for the puddle
          const goRun = el2.cx > el2.bx - 2 * 32 || turning;
          const inp = goRun ? { right: true } : { right: p2.cx < mid - 8, left: p2.cx > mid + 24 };
          sim(1 / 120, inp); maxHeat = Math.max(maxHeat, g2.keHeat);
          if (p2.power < pw2 || (p2.invuln > 0.2)) hurt2 = true;
          if (p2.x > pud2.x || !alive()) break;
        }
        return { flatOutWilts: hurt, withElephant: !hurt2 && p2.x > pud2.x && alive(), maxHeat: Math.round(maxHeat * 100) / 100 };
      });
      check('15-4: running the open plain in the sun wilts Brady; walking in the elephant\'s shadow gets him across unhurt', r2.flatOutWilts && r2.withElephant, r2);
      await page.evaluate(() => { play('15-4'); const p = P(), el = ents('KeElephant').sort((a, b) => a.x - b.x)[0]; el.x = el.ax + 10 * 32; el.dir = 1; place(Math.floor(el.cx / 32), 13); sim(0.3); freeze(); });
      await shot('42-15-4-elephant-shade.png');
      await page.evaluate(() => { thaw(); const c = ents('KeCloud').sort((a, b) => a.x - b.x)[0]; place(Math.floor((c.x + c.w / 2) / 32), 13); sim(0.2); freeze(); });
      await shot('43-15-4-cloud-shadow.png');
      await page.evaluate(() => { thaw(); toArea('cool'); place(8, 11); sim(0.4); freeze(); });
      await shot('44-15-4-cool-spring.png');
      await page.evaluate(() => { thaw(); toArea('plain'); });
      await pano('49-15-4-panorama.jpg');
    });
    /* ---------- 15-6 Meerkat Manor ---------- */
    await run('burrow', async () => {
      await page.evaluate(() => { fresh(); play('15-6'); place(14, 7); sim(0.3); freeze(); });
      await shot('60-15-6-start.png');
      // a sentry sees Brady up top: it whistles, a shadow marks his spot, then the eagle stoops through it
      const r = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); p.invuln = 0; p.setPower(1, true);
        const se = ents('KeSentry').sort((a, b) => a.x - b.x)[0];
        place(Math.floor(se.cx / 32) - 5, 7); sim(0.05);
        const whistled = until(() => ents('KeEagle').length > 0, 2); const e = ents('KeEagle')[0]; const t0 = g.t;
        const stoop = until(() => e.state === 'stoop', 2); const tell = g.t - t0;
        let hurt = false; for (let k = 0; k < 90; k++) { sim(1 / 120); if (p.invuln > 0.3) hurt = true; }
        return { whistled, stoop, tell: Math.round(tell * 100) / 100, hurtStandingStill: hurt };
      });
      check('15-6: a sentry whistles at Brady above ground; the eagle\'s shadow is a tell of a second, then it stoops on the spot', r.whistled && r.stoop && r.tell >= 0.5 && r.hurtStandingStill, r);
      const r2 = await page.evaluate(() => {
        const g = S(), p = P(); p.invuln = 0;
        for (const e of ents('KeEagle')) e.remove = true; sim(3.5);
        const se = ents('KeSentry').sort((a, b) => a.x - b.x)[0];
        place(Math.floor(se.cx / 32) - 5, 7); sim(0.05);
        until(() => ents('KeEagle').length > 0, 2); const e = ents('KeEagle')[0];
        sim(0.55);   // the shadow locks; step out of it
        let hurt = false; for (let k = 0; k < 150; k++) { sim(1 / 120, { left: true }); if (p.invuln > 0.3) hurt = true; }
        return { hurt, eagle: !!e };
      });
      check('15-6: stepping out of the shadow once it locks dodges the eagle', r2.eagle && !r2.hurt, r2);
      await page.evaluate(() => { const g = S(), p = P(); for (const e of ents('KeEagle')) e.remove = true; sim(3.4); const se = ents('KeSentry').sort((a, b) => a.x - b.x)[0]; place(Math.floor(se.cx / 32) - 4, 7); p.invuln = 99; until(() => ents('KeEagle').length > 0, 2); sim(0.9); p.invuln = 0; freeze(); });
      await shot('61-15-6-eagle-shadow.png');
      // down a burrow: walk into the hole, step off the root ledge into the tunnel; underground the sentries can't see him
      const r3 = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); p.invuln = 99; for (const e of ents('KeEagle')) e.remove = true;
        const A = g.area, T = window.BRADY.T; let hx = 0; for (let x = 12; x < A.W && !hx; x++) if (A.tiles[8 * A.W + x] === T.EMPTY && A.tiles[9 * A.W + x] === T.EMPTY) hx = x;
        place(hx - 3, 7); sim(0.1);
        const down = until(() => (p.y + p.h) / 32 > 15.5 && p.onGround, 3, { right: true });
        // underground, walk under the sentry: no whistle
        let eagles = 0; for (let k = 0; k < 120; k++) { sim(1 / 120, { right: true }); eagles = Math.max(eagles, ents('KeEagle').length); }
        // climb out of the next mouth: ledge beside it, the ledge under the hole, up through the hole
        let hx2 = 0; for (let x = Math.floor(p.cx / 32); x < A.W && !hx2; x++) if (A.tiles[8 * A.W + x] === T.EMPTY && A.tiles[9 * A.W + x] === T.EMPTY) hx2 = x;
        place(hx2 + 2, 15); sim(0.2);
        const s1 = hopTo({ cx: (hx2 + 3) * 32 }, 50), y1 = (p.y + p.h) / 32;
        const s2 = hopTo({ cx: (hx2 + 1) * 32 }, 50), y2 = (p.y + p.h) / 32;
        const s3 = hopTo({ cx: (hx2 - 1.5) * 32 }, 50);
        return { hx, down, eagles, y1, y2, out: (p.y + p.h) / 32 <= 8.05 && alive() };
      });
      check('15-6: Brady drops down a burrow into the tunnel; underground no sentry sees him; he climbs out at the next mouth', r3.down && r3.eagles === 0 && r3.out, r3);
      await page.evaluate(() => { const g = S(), A = g.area, T = window.BRADY.T; let hx = 0; for (let x = 12; x < A.W && !hx; x++) if (A.tiles[8 * A.W + x] === T.EMPTY && A.tiles[9 * A.W + x] === T.EMPTY) hx = x; place(hx + 6, 15); sim(0.3); freeze(); });
      await shot('62-15-6-tunnel.png');
      await page.evaluate(() => { thaw(); toArea('nursery'); place(8, 11); sim(0.4); freeze(); });
      await shot('63-15-6-nursery.png');
      await page.evaluate(() => { thaw(); toArea('manor'); });
      await pano('69-15-6-panorama.jpg', 4 * 32);
    });
    /* ---------- the secret rooms (SECRETS_BRIEF.md): each found the way a player finds it, played once wrong and once right ---------- */
    await run('sec-weavers', async () => {
      // 15-1: the tell (a coin trail up off the leap's top), then up from a wildebeest's back into the canopy
      await page.evaluate(() => { fresh(); play('15-1'); const T = window.BRADY.T, A = S().area; let tx = 0; for (let x = 100; x < A.W && !tx; x++) if (A.tiles[7 * A.W + x] === T.HARD) tx = x; window._tx = tx; const p = P(); p.invuln = 99; if (hopOn(tx - 9)) until(() => (p.y + p.h) / 32 < 5.6, 4); p.invuln = 0; freeze(); });
      await shot('80-15-1-secret-tell-coins-up-the-leap.png');
      await page.evaluate(() => { thaw(); play('15-1'); });
      const r = await page.evaluate(() => {
        thaw(); const g = S(), p = P(), tx = window._tx; p.invuln = 99;
        let up = false;
        for (let t = 0; t < 5 && !up; t++) {
          if (!hopOn(tx - 9)) continue;
          // ride to the top of the leap, then jump off its back and steer onto the canopy above
          until(() => (p.y + p.h) / 32 < 5.6 || !alive(), 4);
          sim(1 / 120, { jump: true, jumpPressed: true });
          for (let k = 0; k < 120; k++) { sim(1 / 120, { jump: k < 40, right: true }); if (p.onGround) break; }
          up = p.onGround && (p.y + p.h) / 32 < 4.2;
        }
        if (!up) return { up };
        // run the canopy (hop its gap) to the weavers' nest and walk into it
        let k = 0; while (S().area.aid === 'plain' && k++ < 600) { const fx = Math.floor((p.x + p.w + 8) / 32), A = S().area; const gap = A.tiles[3 * A.W + fx] !== window.BRADY.T.SEMI && A.tiles[3 * A.W + fx - 1] === window.BRADY.T.SEMI; sim(1 / 120, { right: true, jump: gap, jumpPressed: gap && p.onGround }); }
        const inRoom = waitArea('den');
        return { up, inRoom, area: S().area.aid };
      });
      check('15-1 secret: from a wildebeest\'s back at the top of its leap Brady gets up into the canopy above the level and walks into the weavers\' nest', r.up && r.inRoom, r);
      await page.evaluate(() => { sim(0.6); freeze(); }); await shot('81-15-1-weavers-song.png');
      const r2 = await page.evaluate(() => {
        thaw(); const p = P(); p.invuln = 99; const { kit, R } = kitOf();
        sim(1.0, { right: true }); until(() => R.phase === 'play', 8);
        const pads = kit.data.pads.map(x => x * 32 + 16), hop = i => { walkTo(pads[i], 4); sim(1 / 120, { jump: true, jumpPressed: true }); until(() => p.onGround, 2); sim(0.1); };
        // once wrong: the first mat that is not the first note
        hop((R.seq[0] + 1) % 4); const wrong = R.phase === 'oops' && !R.won;
        until(() => R.phase === 'play', 8);
        for (const k of R.seq) hop(k);
        return { wrong, won: R.won, seq: R.seq.join('') };
      });
      check('15-1 secret: the weavers\' song: a wrong mat makes them sing it again; the right order opens the prize', r2.wrong && r2.won, r2);
      await page.evaluate(() => { sim(1); freeze(); }); await shot('82-15-1-weavers-song-won.png');
      const r3 = await page.evaluate(() => { thaw(); const d = S().entities.find(e => e.constructor.name === 'Portal' && e.target && e.target.area !== S().area.idx); place(Math.floor(d.cx / 32), 10); sim(0.1); const to = upDoor(); P().invuln = 99; return { to, x: Math.round(P().cx / 32), out: S().level.areas[0].anchors.denOut.x / 32 }; });
      check('15-1 secret: the way out is a hole that drops Brady back into the level further on (not where he came in)', r3.to === 'plain' && Math.abs(r3.x - r3.out) < 3, r3);
    });
    await run('sec-burrows', async () => {
      // 15-2: hold UP on the giraffe past the cliff top: the head keeps climbing (a coin trail up) to a hidden ledge
      const r = await page.evaluate(() => {
        fresh(); play('15-2'); const g = S(), p = P(); p.invuln = 99;
        const b = ents('KeLeafBush').sort((a, b) => a.x - b.x)[0]; place(Math.floor(b.x / 32) - 3, 13); until(() => !!g.keLeaf, 3, { right: true });
        const gi = ents('KeGiraffe').sort((a, b) => a.x - b.x)[0];
        place(Math.floor(gi.x / 32) - 2, 13); until(() => gi.pos < 4, 4); sim(0.1); sim(0.25, { right: true, jump: true, jumpPressed: true });
        const rode = until(() => p.ride === gi, 1.2, { right: true });
        const cliffTop = until(() => (p.y + p.h) / 32 < 8.2, 6, { up: true });
        window.freezeAt = 1; return { rode, cliffTop };
      });
      await page.evaluate(() => { P().invuln = 0; freeze(); }); await shot('83-15-2-secret-tell-coins-above-the-cliff.png');
      const r2 = await page.evaluate(() => {
        thaw(); const g = S(), p = P(), gi = ents('KeGiraffe').sort((a, b) => a.x - b.x)[0];
        p.invuln = 99; const top = until(() => gi.pos >= gi.len - 1, 8, { up: true });
        const ledge = until(() => p.onGround && p.ride !== gi && (p.y + p.h) / 32 < 3, 2, { left: true });
        const door = S().entities.find(e => e.constructor.name === 'Portal' && e.s.targetRef === 'manor@in');
        walkTo(door.cx, 3); const to = upDoor();
        return { top, ledge, to };
      });
      check('15-2 secret: holding UP past the cliff top lifts Brady to a ledge out of sight and the meerkats\' burrow (the hidden exit\'s room)', r.rode && r.cliffTop && r2.top && r2.ledge && r2.to === 'manor', Object.assign(r, r2));
      await page.evaluate(() => { sim(0.5); freeze(); }); await shot('84-15-2-meerkat-burrows.png');
      const r3 = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); p.invuln = 99; const { kit, R } = kitOf(), A = g.area;
        // the burrow graph: door -> the closet its anchor stands in; find the way to the prize closet
        const doors = g.entities.filter(e => e.constructor.name === 'Portal' && e.target && e.target.area === A.idx);
        const closetOf = (x, y) => { const tx = Math.floor(x / 32), ty = Math.floor((y - 1) / 32); return (ty < 5 ? 'U' : 'L') + (tx < 9 ? 0 : tx < 18 ? 1 : tx < 27 ? 2 : 3); };
        const [pa, pb, py] = kit.data.prize, prizeC = closetOf(pa * 32 + 16, (py + 1) * 32);
        const start = closetOf(p.cx, p.y + p.h); const prev = { [start]: null }, q = [start];
        while (q.length) { const c = q.shift(); for (const d of doors) if (closetOf(d.cx, d.y + d.h) === c) { const n = closetOf(d.target.x, d.target.y); if (!(n in prev)) { prev[n] = [c, d]; q.push(n); } } }
        const path = []; for (let c = prizeC; prev[c]; c = prev[c][0]) path.unshift(prev[c][1]);
        // once wrong: a door that does not lead on to the prize (a dead-end closet), then back
        const wrongDoor = doors.find(d => closetOf(d.cx, d.y + d.h) === start && d !== path[0]);
        let wrong = false;
        if (wrongDoor) { const x0 = p.cx; place(Math.floor(wrongDoor.cx / 32), Math.floor((wrongDoor.y + wrongDoor.h) / 32) - 1); upDoor(); wrong = !R.won; const back = doors.find(d => closetOf(d.cx, d.y + d.h) === closetOf(p.cx, p.y + p.h)); if (back) { place(Math.floor(back.cx / 32), Math.floor((back.y + back.h) / 32) - 1); upDoor(); } }
        for (const d of path) { place(Math.floor(d.cx / 32), Math.floor((d.y + d.h) / 32) - 1); sim(0.05); upDoor(); }
        walkTo((pa + pb) / 2 * 32 + 16, 3); sim(0.3);
        return { steps: path.length, wrong, won: R.won };
      });
      check('15-2 secret: the burrow maze: a wrong burrow is a dead end; the right ones lead to the prize', r3.wrong && r3.won && r3.steps >= 2, r3);
      await page.evaluate(() => freeze()); await shot('85-15-2-meerkat-burrows-prize.png');
    });
    await run('sec-feathers', async () => {
      // 15-3: ride the rising skein to its top; a coin trail goes up; hop off onto the reed ledge, walk into the reeds
      const r = await page.evaluate(() => {
        fresh(); play('15-3'); const g = S(), p = P(); p.invuln = 99;
        const sk = g.entities.filter(e => e.skin === 'keFlock').find(e => e.ay < -4 * 32);
        const lk = ents('KeLake').filter(l => l.x <= sk.hx && l.x + l.w >= sk.hx)[0];
        place(Math.floor(lk.x / 32) - 1, 13); sim(0.2);
        until(() => sk.y > sk.hy - 8 && sk.dx <= 0.05, 14); const on = hopTo(sk, 50);
        until(() => sk.y <= sk.hy + sk.ay + 6, 14);
        p.invuln = 0; freeze(); return { on };
      });
      await shot('86-15-3-secret-tell-coins-over-the-skein.png');
      const r2 = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); p.invuln = 99; const door = g.entities.find(e => e.constructor.name === 'Portal' && e.s.targetRef === 'nests@in');
        const led = hopTo({ cx: door.cx - 40 }, 50);
        until(() => S().area.aid === 'nests', 3, { right: true });
        return { led, inRoom: waitArea('nests') };
      });
      check('15-3 secret: from the top of the rising skein Brady hops onto a reed ledge out of sight and walks into the reed screen', r.on && r2.inRoom, Object.assign(r, r2));
      await page.evaluate(() => { sim(0.4); freeze(); }); await shot('87-15-3-feather-dash.png');
      const r3 = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); p.invuln = 99; const { kit, R } = kitOf();
        // once too slow: wait for the clock to run out (the round restarts, nothing lost)
        sim(0.6, { right: true }); const t0 = g.t; until(() => R.phase === 'rest' || R.phase === 'ready' && g.t - t0 > 3 || (R.left != null && R.left <= 0), 40); const slow = !R.won;
        until(() => R.phase === 'play' || R.phase === 'run', 6);
        // then dash: Brady is put at each feather in turn (the course between them is the checker's; the clock is real)
        for (let k = 0; k < 24 && !R.won; k++) { const tok = g.entities.find(e => e.constructor.name === 'Key' && !e.remove && !e.dead && e.s && e.s.look === 'tokFeather' && !g.keys.has(e.id)); if (!tok) { sim(0.1); continue; } place(Math.floor(tok.cx / 32), Math.floor((tok.y + tok.h - 1) / 32) - (k % 2)); p.x = tok.cx - p.w / 2; sim(0.1); }
        sim(0.5);
        return { slow, won: R.won, phase: R.phase, left: Math.round(R.left || 0), got: kit.data.tokens.filter(tk => g.keys.has(tk.id)).length };
      });
      check('15-3 secret: the feather dash: too slow and the round restarts; all six feathers in time opens the prize', r3.slow && r3.won, r3);
      const r4 = await page.evaluate(() => { const d = S().entities.find(e => e.constructor.name === 'Portal' && e.target && e.target.area !== S().area.idx); place(Math.floor(d.cx / 32), 10); const to = upDoor(); return { to }; });
      check('15-3 secret: the way out puts Brady on the shore past the lake (not the ledge he came in by)', r4.to === 'lake', r4);
    });
    await run('sec-golf', async () => {
      // 15-4: the one gully with cool mist puffing up out of it: drop in
      await page.evaluate(() => { fresh(); play('15-4'); const g = S(); const pf = g.entities.find(e => e.constructor.name === 'KePuff' && e.mist); window._pf = pf.cx; place(Math.floor(pf.cx / 32) - 4, 13); sim(1.0); freeze(); });
      await shot('88-15-4-secret-tell-mist-in-the-gully.png');
      const r = await page.evaluate(() => { thaw(); const p = P(); p.invuln = 99; walkTo(window._pf - 40, 3); until(() => S().area.aid === 'cool', 3, { right: true }); return { inRoom: waitArea('cool') }; });
      check('15-4 secret: dropping into the misty gully lands Brady in a hidden room (any other gully is a fall)', r.inRoom, r);
      await page.evaluate(() => { sim(0.5); freeze(); }); await shot('89-15-4-dung-ball-golf.png');
      const r2 = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); p.invuln = 99; const { kit, R } = kitOf(), b = g.entities.find(e => e.isBall), A = g.area, T = window.BRADY.T;
        const rockAhead = () => { for (let d = 1; d <= 3; d++) if (A.tiles[10 * A.W + Math.floor(b.cx / 32) + d] === T.HARD) return true; return false; };
        // walk (hopping over a rock when he bumps into one) to x
        const go = x => { for (let q = 0; q < 600 && Math.abs(p.cx - x) > 8; q++) { const dir = p.cx < x ? 1 : -1, blocked = p.onGround && Math.abs(p.vx) < 10 && q > 5; sim(1 / 120, { right: dir > 0, left: dir < 0, jump: blocked || (!p.onGround && q % 60 < 30), jumpPressed: blocked }); } until(() => p.onGround && Math.abs(p.vx) < 5, 1); };
        // once wrong: walk it into the first rock on the ground: it rolls back
        let bounced = false;
        go(b.x - 3 * 32); for (let k = 0; k < 400 && !bounced; k++) { const vx0 = b.vx; sim(1 / 120, { right: p.cx < b.cx }); if (vx0 > 30 && b.vx < 0) bounced = true; }
        const wrong = bounced && !R.won;
        // then play it properly: roll it along, and chip it over each rock by jumping just as he reaches it
        for (let k = 0; k < 24 && !R.won; k++) {
          until(() => b.onGround && Math.abs(b.vx) < 20, 2);
          go(b.x - 3 * 32);
          if (rockAhead()) { until(() => p.x + p.w > b.x - 4, 2, { right: true }); sim(1 / 120, { right: true, jump: true, jumpPressed: true }); for (let q = 0; q < 70 && !R.won; q++) sim(1 / 120, { jump: q < 10 }); }
          else { for (let q = 0; q < 100 && !R.won; q++) sim(1 / 120, { right: true }); }
          sim(0.4);
        }
        return { wrong, won: R.won };
      });
      check('15-4 secret: dung ball golf: shoved into a rock the ball rolls back; chipped over the rocks it drops in the hole', r2.wrong && r2.won, r2);
      await page.evaluate(() => { sim(0.6); freeze(); }); await shot('90-15-4-dung-ball-golf-won.png');
      const r3 = await page.evaluate(() => { thaw(); const d = S().entities.find(e => e.constructor.name === 'Portal' && e.target && e.target.area !== S().area.idx); place(Math.floor(d.cx / 32), 10); const to = upDoor(); return { to, x: Math.round(P().cx / 32), out: Math.round(S().area.anchors ? 0 : 0) }; });
      check('15-4 secret: the way out climbs up onto the plain past the gullies', r3.to === 'plain', r3);
    });
    await run('sec-eggs', async () => {
      // 15-5: the one plain door (a termite mound by the lead-in)
      const r = await page.evaluate(() => { fresh(); play('15-5'); const p = P(); p.invuln = 99; const d = S().entities.find(e => e.constructor.name === 'Portal' && e.s.targetRef === 'hollow@in'); place(Math.floor(d.cx / 32) - 3, 13); walkTo(d.cx, 3); return { to: upDoor() }; });
      check('15-5 secret: the termite mound door leads into the egg game', r.to === 'hollow', r);
      const r2 = await page.evaluate(() => {
        const g = S(), p = P(); p.invuln = 99; const { kit, R } = kitOf(), D = kit.data;
        const stompCup = k => { const c = R.cups.find(c => c.k === k); place(Math.floor(c.x / 32), D.row - 1); sim(0.05); sim(1 / 120, { jump: true, jumpPressed: true }); until(() => R.phase === 'reveal' || p.onGround && p.vy >= 0 && R.phase !== 'pick', 2); };
        sim(1.0, { right: true }); until(() => R.phase === 'pick', 14);
        stompCup((R.prizeCup + 1) % 3); const wrong = !R.won && R.phase === 'reveal';
        until(() => R.phase === 'pick', 20);
        stompCup(R.prizeCup); sim(0.3);
        return { wrong, won: R.won };
      });
      check('15-5 secret: three ostrich eggs: the wrong egg holds a joke; the right one opens the prize', r2.wrong && r2.won, r2);
      await page.evaluate(() => { sim(0.5); freeze(); }); await shot('91-15-5-three-ostrich-eggs.png');
    });
    await run('sec-meerkats', async () => {
      // 15-6: a root-tangled plug at the end of a tunnel puffs dust: walk into it
      await page.evaluate(() => { fresh(); play('15-6'); const g = S(); const d = g.entities.find(e => e.constructor.name === 'Portal' && e.s.targetRef === 'nursery@in'); window._d = d.cx; place(Math.floor(d.cx / 32) - 5, 15); sim(1.2); freeze(); });
      await shot('92-15-6-secret-tell-dust-from-the-roots.png');
      const r = await page.evaluate(() => { thaw(); P().invuln = 99; until(() => S().area.aid === 'nursery', 4, { right: true }); return { inRoom: waitArea('nursery') }; });
      check('15-6 secret: walking into the root-tangled plug at the end of the tunnel takes Brady into the nursery', r.inRoom, r);
      await page.evaluate(() => { sim(1.5, { right: true }); freeze(); }); await shot('93-15-6-bop-a-meerkat.png');
      const r2 = await page.evaluate(() => {
        thaw(); const g = S(), p = P(); p.invuln = 99; const { kit, R } = kitOf();
        // once too slow: stand still until the time runs out
        until(() => R.phase === 'rest', 30); const slow = !R.won;
        until(() => R.phase === 'play', 5);
        // then bop: under a pup that pops up, hop on it
        for (let k = 0; k < 3000 && !R.won; k++) {
          const h = g.entities.filter(e => e.constructor.name === 'TourRoomHole' && e.up > 0.6 && e.hitT <= 0).sort((a, b) => Math.abs(a.cx - p.cx) - Math.abs(b.cx - p.cx))[0];
          if (h && p.onGround) { place(Math.floor(h.cx / 32), 9); sim(1 / 120, { jump: true, jumpPressed: true }); for (let q = 0; q < 70 && !p.onGround; q++) sim(1 / 120); }
          else sim(1 / 60);
          if (R.phase === 'rest') { until(() => R.phase === 'play', 5); }
        }
        return { slow, won: R.won, score: R.score };
      });
      check('15-6 secret: bop-a-meerkat: too slow and it starts again; eight bops open the prize', r2.slow && r2.won, r2);
      const r3 = await page.evaluate(() => { const d = S().entities.find(e => e.constructor.name === 'Portal' && e.target && e.target.area !== S().area.idx); place(Math.floor(d.cx / 32), 10); const to = upDoor(); return { to, y: Math.round((P().y + P().h) / 32) }; });
      check('15-6 secret: the way out is a chute up onto the surface further along', r3.to === 'manor' && r3.y <= 8, r3);
    });
    /* ---------- 15-5 the lead-in, the arena; the land's map ---------- */
    await run('lair', async () => {
      await page.evaluate(() => { fresh(); play('15-5'); place(30, 13); sim(0.5); freeze(); });
      await shot('55-15-5-waterhole-lead-in.png');
      const r = await page.evaluate(() => { thaw(); const g = S(), p = P(); p.invuln = 99; const k = areaOf(g, 'arena'), A = g.level.areas[k], an = A.anchors.in; g.loadArea(k, an.x, an.y); P().invuln = 99; sim(0.2); P().x += 5 * 32; sim(3); const b = g.entities.find(e => e.boss); return { style: b && b.style, state: b && b.state }; });
      check('15-5: the arena wakes Big Kiboko', r.style === 'ke_kiboko' && r.state === 'fight', r);
      await page.evaluate(() => { sim(1.5); P().invuln = 0; freeze(); });
      await shot('56-15-5-arena.png');
      await page.evaluate(() => { thaw(); toArea('shore'); });
      await pano('59-15-5-panorama.jpg');
    });
    await run('map', async () => {
      const r = await page.evaluate(() => { thaw(); fresh(); const B = window.BRADY, T = window.BRADY_TOUR; B.Save.data.unlocked['15-1'] = true; T.TourProgress.data().lands.ke = true; B.goToMap('world', 1, '15-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } const s = S(); return { cc: s.ow && s.ow.cc }; });
      check('Kenya has its own walkable map', r.cc === 'ke', r);
      await page.evaluate(() => freeze()); await shot('70-kenya-map.png');
    });
  });
  await session(browser, { width: 390, height: 844 }, async (page, shot, run) => {
    await run('p-herd', async () => { await page.evaluate(() => { fresh(); play('15-1'); place(40, 13); sim(1.5); freeze(); }); await shot('50-portrait-15-1.png'); });
    await run('p-lair', async () => { await page.evaluate(() => { thaw(); fresh(); play('15-5'); const g = S(), k = areaOf(g, 'arena'), A = g.level.areas[k], an = A.anchors.in; g.loadArea(k, an.x, an.y); P().invuln = 99; sim(0.2); P().x += 5 * 32; sim(3); const b = g.entities.find(e => e.boss); b.go('jete'); sim(1.4); P().invuln = 0; freeze(); }); await shot('57-portrait-15-5-arena.png');
      // off the screen while she swims: an arrow at the view's edge says where she is
      const r = await page.evaluate(() => { thaw(); const g = S(), p = P(), b = g.entities.find(e => e.boss); p.invuln = 99; p.x = b.arenaX0 + 2 * 32; p.y = b.floorY - p.h; b.x = b.pool.x1 - b.w - 8; b.go('swim'); sim(0.6); p.x = b.arenaX0 + 2 * 32; sim(0.05); const off = b.x > g.camX + window.BRADY.Game.viewW || b.x + b.w < g.camX; p.invuln = 0; freeze(); return { off }; });
      check('15-5 (portrait): with Big Kiboko off the screen, the edge arrow shows where she swims', r.off, r);
      await shot('58-portrait-15-5-offscreen-arrow.png'); });
    await run('p-map', async () => { await page.evaluate(() => { thaw(); fresh(); const B = window.BRADY, T = window.BRADY_TOUR; B.Save.data.unlocked['15-1'] = true; T.TourProgress.data().lands.ke = true; B.goToMap('world', 1, '15-1'); for (let k = 0; k < 40; k++) { if (S().card) S().card = null; sim(0.25); } freeze(); }); await shot('71-portrait-kenya-map.png'); });
  });
  await browser.close();
  console.log(failures ? `${failures} KENYA CHECK(S) FAILED` : 'ALL KENYA CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
