// Screenshots (and in-browser checks) of Lost & Found (world 24), its Brady Button under the Netherlands' 8-3 (rule 12),
// the REVOKED card, and rule 12 across the game (the lost suitcase on a land's map, the RETURNED shelf at a Souvenir
// Stand). Phone landscape (874x402 @2x) and portrait (402x874). Silent (tools/sbw_silent.js); full resolution pinned
// before every capture. Built like tools/sbw_backstage_shots.js.
// usage: BRADY_DIST=<dist> node tools/sbw_lost_shots.js <outdir> [--checks] [--portrait-only] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'lost-shots'), checksOnly = args.includes('--checks');
const want = args.slice(1).filter(a => !a.startsWith('--'));
fs.mkdirSync(out, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); if (!ok) failures++; };

async function session(viewport, tag, fn) {
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
    window.sim = (sec, inp) => {
      const G = B.Game, I = B.Input, steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (k > 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; } }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) if (typeof inp[key] === 'boolean') I[key] = false;
    };
    window.fresh = () => { const d = B.Save.data; for (const k of ['done', 'unlocked', 'exits', 'secretExits', 'gold', 'best']) d[k] = {}; d.unlocked['1-1'] = true; d.tour = null; d.lives = 9; d.seenTourIntro = true; d.pack = null; T.TourProgress.data(); };
    window.play = (id, area, ax, ay) => {
      const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9;
      const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(1.6);
      if (area != null) { g.loadArea(area, ax, ay); }
      g.player.invuln = 999; return g;
    };
    window.place = (tx, ty) => { const g = S(), p = P(); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.toArea = aid => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = A.anchors.in || A.anchors.start; g.loadArea(k, an.x, an.y); P().invuln = 999; };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } };
    window.openMap = (cc, at) => {
      const G = B.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize();
      const C = T.Tour.countries[cc], m = new T.TourMapScene({}); m.card = null; m.sel = cc;
      const P2 = T.TourProgress.data(); P2.lands[cc] = true; P2.flights[cc] = true; P2.cards[cc] = true; P2.seen[cc] = true; P2.pending = []; P2.arrive = null; P2.hop = null;
      m.ow = new T.TourMapScene.Overworld(m, C, at ? { at } : {}); m.mode = 'land';
      const ow = m.ow; ow.layoutView(); ow.clampCam(); ow.iris.t = 9; ow.revealQ = []; G.setScene(m);
      return m;
    };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); if (checksOnly) return; await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, tag + name) }); };
  const run = async (name, f) => { if (want.length && !want.some(w => name.startsWith(w))) return; try { await pin(); await f(); } catch (e) { check(tag + name + ' runs', false, String(e.message).slice(0, 300)); } };
  const level = (name, id, area, tx, ty, file, after) => run(name, async () => {
    await page.evaluate(([id, area, tx, ty, after]) => { thaw(); const g = play(id); const k = areaOf(g, area); if (k !== g.area.idx) toArea(area); P().invuln = 999; place(tx, ty); sim(after || 0.3); freeze(); }, [id, area, tx, ty, after]);
    await shot(file);
  });
  await fn(page, shot, run, level);
  check(`${tag}${viewport.width}x${viewport.height}: no page errors`, !errors.length, errors.slice(0, 5));
  await browser.close();
}

const landscape = async (page, shot, run, level) => {
  // ---- the Netherlands 8-3: the tell, the drop, the graveyard, the button, the REVOKED card ----
  await run('nl-tell', async () => {
    const r = await page.evaluate(() => { fresh(); const g = play('8-3'); const h = g.entities.find(e => e.constructor.name === 'NlBikeHook'); place(Math.floor(h.x / 32) - 3, Math.floor(h.surf / 32) - 3); sim(0.3); freeze(); return { hook: !!h, x: h && Math.floor(h.x / 32) }; });
    check('8-3: the murky canal gap with the bike-fishing hook is there', r.hook, r);
    await shot('01-nl-8-3-canal-tell.png');
  });
  await run('nl-drop', async () => {
    const r = await page.evaluate(() => { thaw(); const g = S(), p = P(), h = g.entities.find(e => e.constructor.name === 'NlBikeHook'); p.x = h.x + h.w / 2 - p.w / 2; p.y = h.surf - 3 * 32; p.vx = 0; p.vy = 0; p.invuln = 0; sim(1.4); return { area: g.area.aid, dead: !!p.dead }; });
    check('8-3: drop into the murky gap: Brady sinks into the drowned-bike graveyard, alive', r.area === 'bikegrave' && !r.dead, r);
    await page.evaluate(() => { place(14, 11); sim(0.4); freeze(); });
    await shot('02-nl-8-3-bike-graveyard.png');
  });
  await run('nl-button', async () => {
    const r = await page.evaluate(() => { thaw(); const b = S().entities.find(e => e.isButton); const p = P(); p.x = b.x - p.w - 2; p.y = b.y + b.h - p.h; p.facing = 1; sim(0.2); sim(0.05, { action: true, actionPressed: true }); return { fx: !!S().buttonFx, rules: window.BRADY.Save.data.tour.rules, lands: window.BRADY.Save.data.tour.lands }; });
    check('8-3: slapping the Brady Button revokes rule 12 and opens Lost & Found', r.fx && r.rules && r.rules[12] && r.lands && r.lands.lost, r);
    await page.evaluate(() => { sim(1.3); freeze(); }); await shot('03-rule-12-revoked-card.png');
    await page.evaluate(() => { thaw(); sim(2.4); freeze(); }); await shot('04-rule-12-new-land-map.png');
    await page.evaluate(() => { thaw(); sim(2.5); freeze(); }); await shot('05-nl-graveyard-button-lit.png');
  });
  // ---- 24-1 Baggage Carousel ----
  await level('l1-arrivals', '24-1', 'hall', 10, 11, '10-24-1-arrivals-flap-a.png');
  await run('l1-flap', async () => {
    const r = await page.evaluate(() => { thaw(); const g = S(), f = g.entities.find(e => e.constructor.name === 'LostFlap' && /BELT 3/.test(e.label)); const p = P(); p.x = f.cx - p.w / 2; p.y = f.y + f.h - p.h; p.vx = 0; sim(0.45); freeze(); return { still: +f.still.toFixed(2) }; });
    await shot('11-24-1-flap-about-to-swallow.png');
    const r2 = await page.evaluate(() => { thaw(); sim(1.5); const p = P(), cw = 28 * 32, ch = 14 * 32; return { cx: Math.floor(p.cx / cw), cy: Math.floor((p.y + p.h - 1) / ch) }; });
    check('24-1: standing still at flap A swallows Brady and drops him in Belt 3 (cell 1,1)', r2.cx === 1 && r2.cy === 1, Object.assign(r, r2));
  });
  await level('l1-belt1', '24-1', 'hall', 34, 11, '12-24-1-belt-1-hall.png');
  await level('l1-belt2', '24-1', 'hall', 20, 19, '13-24-1-belt-2-red-suitcase.png');
  await level('l1-belt3', '24-1', 'hall', 34, 25, '14-24-1-belt-3-flap-d.png');
  await level('l1-customs', '24-1', 'hall', 62, 11, '15-24-1-customs-shutter.png');
  await level('l1-desk', '24-1', 'hall', 62, 25, '16-24-1-lost-and-found-desk.png');
  await level('l1-office', '24-1', 'office', 6, 9, '17-24-1-office-shell-game.png', 2.6);
  // ---- 24-2 Unclaimed Mountain ----
  await level('l2-foot', '24-2', 'peak', 8, 69, '20-24-2-foot-of-the-mountain.png');
  await level('l2-zip', '24-2', 'peak', 28, 66, '21-24-2-zipped-suitcase-door.png');
  await level('l2-face', '24-2', 'peak', 20, 53, '22-24-2-the-face.png');
  await level('l2-drawer', '24-2', 'drawer', 4, 15, '23-24-2-inside-the-sock-drawer.png');
  await level('l2-fake', '24-2', 'peak', 27, 29, '24-24-2-sock-in-the-wall.png');
  await level('l2-summit', '24-2', 'peak', 19, 8, '25-24-2-summit-sandbag.png');
  await run('l2-rigging', async () => {
    const r = await page.evaluate(() => { thaw(); const g = S(), p = P(); const sp = g.entities.find(e => e.constructor.name === 'Spring'); p.x = sp.cx - p.w / 2; p.y = sp.y - p.h - 6; p.vy = 2 * 32; sim(1.4, { jump: true }); return { area: g.area.aid }; });
    check('24-2: the summit spring throws Brady up into the Rigging', r.area === 'rigging', r);
    await page.evaluate(() => { thaw(); place(30, 13); sim(0.3); freeze(); });
    await shot('26-24-2-rigging-wormhole.png');
  });
  // ---- 24-3 X-Ray Tunnel ----
  await level('l3-start', '24-3', 'tunnel', 8, 13, '30-24-3-security-start.png', 1.0);
  await run('l3-beam', async () => {
    await page.evaluate(() => { thaw(); const g = play('24-3'); place(19, 13); sim(0.2); const sc = g.entities.find(e => e.constructor.name === 'LostScanner'); sc.t = 0.5; sim(0.6); freeze(); });
    await shot('31-24-3-beam-shows-platforms.png');
  });
  await run('l3-beagle', async () => {
    const r = await page.evaluate(() => { thaw(); const g = play('24-3'); P().invuln = 999; place(41, 13); const b = g.entities.find(e => e.isBeagle); b.x = 38 * 32; b.y = 13 * 32 - 24 + 32; b.barkCool = 0; sim(0.6); freeze(); return { bark: b.bark > 0, lit: !!b.lights }; });
    check('24-3: in the dark pit the beagle barks at a hidden platform and lights it up', r.bark && r.lit, r);
    await shot('32-24-3-beagle-barks-in-the-dark.png');
  });
  await run('l3-door', async () => {
    await page.evaluate(() => { thaw(); const g = play('24-3'); place(86, 6); const sc = g.entities.filter(e => e.constructor.name === 'LostScanner')[2]; sim(0.1); for (let k = 0; k < 200 && Math.abs(sc.bx - 89 * 32) > 20; k++) sim(0.05); freeze(); });
    await shot('33-24-3-xray-door.png');
  });
  await level('l3-locker', '24-3', 'locker', 6, 9, '34-24-3-confiscated-room.png', 1.5);
  await level('l3-climb', '24-3', 'tunnel', 101, 13, '35-24-3-hidden-steps.png', 1.2);
  // ---- 24-4 The Sock Hydra ----
  await level('l4-aisle', '24-4', 'aisles', 12, 13, '40-24-4-warehouse-aisles.png');
  // ---- the land's map, the suitcase on a map (rule 12), the RETURNED shelf ----
  await run('map-lost', async () => {
    await page.evaluate(() => { const T = window.BRADY_TOUR, d = window.BRADY.Save.data; for (const id of ['24-1', '24-2', '24-3']) { d.done[id] = true; d.unlocked[id] = true; } d.unlocked['24-4'] = true; const P2 = T.TourProgress.data(); P2.lands.lost = true; for (const k of ['lost:-1>0', 'lost:0>1', 'lost:1>2', 'lost:2>3']) P2.paths[k] = true; openMap('lost', '24-2'); sim(1.5); });
    await shot('50-lost-and-found-map.png');
  });
  await run('map-suitcase', async () => {
    const r = await page.evaluate(() => { const T = window.BRADY_TOUR; window.BRADY.Save.data.pack = null; const m = openMap('mx', 'start'); sim(1.0); const L = T.LostLuggage, ow = m.ow, p = L.at(ow); return { on: L.on(), at: p && [Math.round(p.x), Math.round(p.y)], opened: L.opened('mx') }; });
    check('rule 12: a lost suitcase stands by Mexico\'s airstrip', r.on && r.at && !r.opened, r);
    await shot('51-rule-12-suitcase-at-airstrip.png');
    const r2 = await page.evaluate(() => { const T = window.BRADY_TOUR, m = S(), ow = m.ow, p = T.LostLuggage.at(ow), s = ow.toScreen(p.x, p.y - 8); ow.testTaps = [{ x: s.x, y: s.y }]; sim(0.6); return { opened: T.LostLuggage.opened('mx'), pack: window.BRADY.Save.data.pack }; });
    check('rule 12: tapping it opens it once: a free Backpack item', r2.opened && !!r2.pack, r2);
    await shot('52-rule-12-suitcase-opened.png');
  });
  await run('shop', async () => {
    const r = await page.evaluate(() => { const B = window.BRADY, T = window.BRADY_TOUR; const lvl = T.Tour.houseLevel('mx-tienda'); const g = new B.Play(lvl, {}); B.Game.setScene(g); sim(1.6); const s = g.entities.find(e => e.items && e.slotX); if (s) { const p = P(); p.x = s.slotX(3) - p.w / 2 - 40; p.y = s.y + s.h - p.h; p.vx = 0; } g.camX = Math.max(0, (s ? s.cx : 400) - B.Game.viewW / 2); sim(0.3); freeze(); return { n: s ? s.items.length : 0, returned: s ? s.items.some(it => it.returned) : false }; });
    check('rule 12: a Souvenir Stand shows a fourth RETURNED shelf', r.n === 4 && r.returned, r);
    await shot('53-rule-12-returned-shelf.png');
  });
};
const portrait = async (page, shot, run, level) => {
  await run('p-nl', async () => {
    await page.evaluate(() => { fresh(); const g = play('8-3'); const h = g.entities.find(e => e.constructor.name === 'NlBikeHook'); place(Math.floor(h.x / 32) - 2, Math.floor(h.surf / 32) - 3); sim(0.3); freeze(); });
    await shot('60-portrait-8-3-canal-tell.png');
    await page.evaluate(() => { thaw(); toArea('bikegrave'); place(18, 11); sim(0.3); freeze(); });
    await shot('61-portrait-bike-graveyard.png');
    await page.evaluate(() => { thaw(); const b = S().entities.find(e => e.isButton); const p = P(); p.x = b.x - p.w - 2; p.y = b.y + b.h - p.h; p.facing = 1; sim(0.2); sim(0.05, { action: true, actionPressed: true }); sim(1.3); freeze(); });
    await shot('62-portrait-rule-12-revoked.png');
  });
  await level('p-l1', '24-1', 'hall', 34, 11, '63-portrait-24-1-belt-1.png');
  await level('p-l2', '24-2', 'peak', 20, 53, '64-portrait-24-2-face.png');
  await run('p-l3', async () => {
    await page.evaluate(() => { thaw(); const g = play('24-3'); place(19, 13); sim(0.2); const sc = g.entities.find(e => e.constructor.name === 'LostScanner'); sc.t = 0.5; sim(0.6); freeze(); });
    await shot('65-portrait-24-3-beam.png');
  });
  await run('p-l4', async () => {
    await page.evaluate(() => { thaw(); const g = play('24-4'); toArea('depot'); const b = g.entities.find(e => e.boss); const p = P(); p.x = b.arenaX0 + 64; p.y = b.floorY - p.h - 4; sim(3.2); freeze(); });
    await shot('66-portrait-24-4-sock-hydra.png');
  });
  await run('p-map', async () => {
    await page.evaluate(() => { const T = window.BRADY_TOUR; window.BRADY.Save.data.pack = null; const P2 = T.TourProgress.data(); P2.rules[12] = { at: '8-3' }; P2.luggage = {}; openMap('ec', 'start'); sim(1.0); });
    await shot('67-portrait-suitcase-on-map.png');
  });
};

(async () => {
  if (!args.includes('--portrait-only')) await session({ width: 874, height: 402 }, '', landscape);
  await session({ width: 402, height: 874 }, '', portrait);
  console.log(failures ? `${failures} LOST SHOT CHECK(S) FAILED` : 'ALL LOST SHOT CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
