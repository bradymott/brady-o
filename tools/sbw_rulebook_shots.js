// Screenshots (and in-browser checks) of Piwi's House Rules 9 and 1 and 22-6 The Rulebook (src/29_tour_zz_wormholes9.js,
// src/29_tour_w22_zrulebook.js): 5-1's evidence locker and its tell, the Rule 9 REVOKED card, the six dormant
// Wormholes (each tell, padlocked, unlocked), an express trail, 22-5's margin tell and the button under glass, the Rule 1
// card, 22-6's beats, the HOUSE RULES page, World 22's map before and after, the party blimp, the ending's party.
// Phone landscape (874x402 @2x) and portrait (402x874 @2x). Silent (tools/sbw_silent.js). Full resolution pinned.
// usage: BRADY_DIST=<dist> node tools/sbw_rulebook_shots.js <outdir> [--checks] [--portrait | --landscape] [name ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'rulebook-shots'), checksOnly = args.includes('--checks');
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
        if (inp) { Object.assign(I, inp); if (k > 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; } }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) if (typeof inp[key] === 'boolean') I[key] = false;
    };
    window.fresh = () => { const d = B.Save.data; for (const k of ['done', 'unlocked', 'exits', 'secretExits', 'gold', 'best']) d[k] = {}; d.unlocked['1-1'] = true; d.tour = null; d.lives = 9; d.seenTourIntro = true; d.settings.ruleFx = true; T.TourProgress.data(); };
    window.rules = list => { const P0 = T.TourProgress.data(); for (const n of list) P0.rules[n] = { at: { 3: '1-4', 7: '3-1', 9: '5-1', 10: '11-4', 12: '8-3', 1: '22-5' }[n] }; };
    window.play = (id) => { const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9; const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(1.6); g.player.invuln = 999; return g; };
    window.areaOf = (g, aid) => g.level.areas.findIndex(a => a.aid === aid);
    window.go = (aid, tx, ty) => { const g = S(), k = areaOf(g, aid), A = g.level.areas[k], an = (A.anchors && (A.anchors.in || A.anchors.start)) || (k === 0 ? g.level.start : { x: 5 * 32 + 16, y: (A.H - 4) * 32 }); if (g.area.idx !== k) g.loadArea(k, an.x, an.y); P().invuln = 999; if (tx != null) place(tx, ty); return g; };
    window.place = (tx, ty) => { const g = S(), p = P(); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.spawnTile = (aid, pred) => { const g = S(), A = g.level.areas[areaOf(g, aid)], s = A.spawns.find(pred); return s ? { tx: Math.floor(s.x / 32), ty: Math.round(s.y / 32) - 1 } : null; };
    window.freeze = () => { const g = S(); if (g.player) g.player.invuln = 0; g._upd = g.update; g.update = function () {}; };
    window.thaw = () => { const g = S(); if (g._upd) { g.update = g._upd; g._upd = null; } if (g.player) g.player.invuln = 999; };
    window.overview = () => { const G = B.Game, ow = S().ow, W = G.cssW, H = G.cssH, z = Math.min(W / ow.G.w, H / ow.G.h); ow.fixed = { view: { x: (W - ow.G.w * z) / 2, y: (H - ow.G.h * z) / 2, w: ow.G.w * z, h: ow.G.h * z }, z, cam: { x: ow.G.w / 2, y: ow.G.h / 2 } }; ow.layoutView(); ow.clampCam(); };
    window.openMap = at => { const G = B.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); const m = new T.TourMapScene({ from: at }); G.setScene(m); return m; };
    // a land cleared as a player who went through it (its main levels), Brady back on its map
    window.landDone = (cc, extra) => {
      const d = B.Save.data, P0 = T.TourProgress.data(), C = T.Tour.countries[cc];
      for (const id of T.Tour.mainIds(C).concat(extra || [])) { d.done[id] = true; d.unlocked[id] = true; T.TourProgress.exit(id, 'main'); }
      for (const r of P0.pending.slice()) T.TourProgress.revealDone(r);
      (P0.seen = P0.seen || {})[cc] = true; (P0.cards = P0.cards || {})[cc] = true; (P0.lands = P0.lands || {})[cc] = true;
    };
    window.slap = (rule) => { const g = S(), b = g.entities.find(e => e.isButton && e.rule === rule), p = P(); p.x = b.x - p.w - 2; p.y = b.y + b.h - p.h; p.vx = p.vy = 0; p.facing = 1; sim(0.2); sim(0.1, { action: true, actionPressed: true }); return b; };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { await pin(); if (checksOnly) return; await page.waitForTimeout(300); await page.screenshot({ path: path.join(out, tag + '-' + name) }); };
  const run = async (name, f) => { if (want.length && !want.some(w => name.startsWith(w))) return; try { await pin(); await f(); } catch (e) { check(tag + ' ' + name + ' runs', false, String(e.stack || e.message).slice(0, 400)); } };
  await fn(page, shot, run);
  check(`${tag}: no page errors`, !errors.length, errors.slice(0, 5));
  await browser.close();
}

const scenes = async (page, shot, run, tag) => {
  /* ---------- Rule 9: 5-1's evidence locker ---------- */
  await run('locker', async () => {
    const r = await page.evaluate(() => { fresh(); play('5-1'); const d = spawnTile('souk', s => s.type === 'portal' && s.look === 'r9LockerDoor'); go('souk', d.tx - 1, d.ty); sim(0.4); freeze(); return d; });
    check(tag + ' 5-1: the locker door stands in the basket weavers\' hall', !!r, r);
    await shot('01-5-1-locker-door-tell.png');
    const r2 = await page.evaluate(() => { thaw(); const d = spawnTile('souk', s => s.type === 'portal' && s.look === 'r9LockerDoor'); place(d.tx, d.ty); sim(0.1, { up: true, upPressed: true }); sim(1.5); return { area: S().area.aid }; });
    check(tag + ' 5-1: Up at the door: into the evidence locker', r2.area === 'locker', r2);
    await page.evaluate(() => { place(14, 11); sim(0.4); freeze(); });
    await shot('02-5-1-evidence-locker.png');
    const r3 = await page.evaluate(() => { thaw(); slap(9); sim(1.9); freeze(); return { revoked: window.BRADY_TOUR.TourRules.isRevoked(9), fx: !!S().buttonFx }; });
    check(tag + ' 5-1: a slap revokes rule 9 and the card plays', r3.revoked && r3.fx, r3);
    await shot('03-rule9-revoked-card.png');
  });
  /* ---------- the six dormant Wormholes: each tell, its trunk padlocked, then open ---------- */
  const DOCKS = [['4-2', 'dunas', 'dock'], ['6-1', 'bunol', 'dock'], ['7-3', 'chaussee', 'dock'], ['9-3', 'gunung', 'dock'], ['10-2', 'vinh', 'dock'], ['12-2', 'bhanjyang', 'wings']];
  for (const [id, main, room] of DOCKS) {
    await run('dormant-' + id, async () => {
      // the tell from the level
      await page.evaluate(([id, main, room]) => {
        fresh(); play(id);
        if (room === 'wings') go(main, 3, Math.round(S().level.start.y / 32) - 1);
        else { const g = spawnTile(main, s => s.type === 'gate' && (!s.exit || s.exit === 'main')); go(main, g.tx - 8, g.ty); }
        sim(0.4); freeze();
      }, [id, main, room]);
      await shot(`10-${id}-dormant-tell.png`);
      // the trunk, padlocked
      const r = await page.evaluate(([id, room]) => {
        thaw(); const w = spawnTile(room, s => s.type === 'warp' && s.needs); go(room, w.tx - 3, w.ty); sim(0.5);
        const e = S().entities.find(x => x.isWarp && x.s.needs); sim(0.1, { up: true, upPressed: true }); sim(0.3);
        place(w.tx - 3, w.ty); sim(0.3); freeze();
        return { locked: e && e.locked, used: e && e.used };
      }, [id, room]);
      check(tag + ` ${id}: the dormant Wormhole is padlocked (Up does nothing)`, r.locked && !r.used, r);
      await shot(`11-${id}-dormant-padlocked.png`);
      if (id === '4-2' || id === '12-2' || id === '10-2') {
        const r2 = await page.evaluate(([id, room]) => { thaw(); rules([9]); const w = spawnTile(room, s => s.type === 'warp' && s.needs); place(w.tx - 1, w.ty); sim(0.6); freeze(); const e = S().entities.find(x => x.isWarp && x.s.needs); return { locked: e && e.locked }; }, [id, room]);
        check(tag + ` ${id}: rule 9 revoked: the padlock is off`, r2.locked === false, r2);
        await shot(`12-${id}-wormhole-unlocked.png`);
      }
    });
  }
  /* ---------- an express trail on a beaten land ---------- */
  await run('express', async () => {
    await page.evaluate(() => { fresh(); landDone('mx'); rules([9]); openMap('1-5'); sim(2.5); });
    const r = await page.evaluate(() => { const ow = S().ow; const e = ow && ow.edges.find(x => x.express); return { e: !!e, open: e && e.open }; });
    check(tag + ' express: Mexico (boss beaten, rule 9 revoked) shows an open express trail', r.e && r.open, r);
    await page.evaluate(() => { overview(); sim(0.3); });
    await shot('20-map-express-trail-overview.png');
    await page.evaluate(() => { const ow = S().ow; ow.fixed = null; ow.layoutView(); const p = ow.G.pos.start; ow.cam.x = p.x + 200; ow.cam.y = p.y - 100; ow.clampCam(); sim(0.3); });
    await shot('21-map-express-trail-airstrip.png');
  });
  /* ---------- Rule 1: 22-5's margin and the button under glass ---------- */
  await run('margin', async () => {
    await page.evaluate(() => { fresh(); play('22-5'); go('desk', 3, Math.round(S().level.start.y / 32) - 1); sim(0.5); freeze(); });
    await shot('30-22-5-margin-tell.png');
    const r = await page.evaluate(() => { thaw(); place(1, Math.round(S().level.start.y / 32) - 1); sim(1.5, { left: true }); return { area: S().area.aid }; });
    check(tag + ' 22-5: left off the start into the margin', r.area === 'margin', r);
    await page.evaluate(() => { const b = S().entities.find(e => e.isButton); place(Math.floor(b.cx / 32) - 3, 11); sim(0.4); freeze(); });
    await shot('31-22-5-cloche-not-yet.png');
    const r2 = await page.evaluate(() => { thaw(); slap(1); sim(0.6); return { revoked: window.BRADY_TOUR.TourRules.isRevoked(1) }; });
    check(tag + ' 22-5: under glass a slap does nothing', !r2.revoked, r2);
    const r3 = await page.evaluate(() => { rules([3, 7, 9, 10, 12]); sim(1.5); slap(1); sim(2.0); freeze(); return { revoked: window.BRADY_TOUR.TourRules.isRevoked(1), fx: !!S().buttonFx }; });
    check(tag + ' 22-5: with the other five revoked the glass lifts and a slap revokes rule 1', r3.revoked && r3.fx, r3);
    await shot('32-rule1-revoked-card.png');
  });
  /* ---------- 22-6 The Rulebook ---------- */
  const beat = async (name, file, fn) => run(name, async () => { await page.evaluate(fn); await shot(file); });
  await beat('rb-start', '40-22-6-start.png', () => { fresh(); rules([1, 3, 7, 9, 10, 12]); play('22-6'); go('book', 4, 13); sim(0.4); freeze(); });
  await beat('rb-pages', '41-22-6-page-turns.png', () => { thaw(); go('book', 24, 13); sim(0.3); freeze(); });
  await beat('rb-curl', '42-22-6-page-corner-curls.png', () => {
    thaw(); const g = S(), pg = g.entities.find(e => e.constructor.name === 'RbPage'), G0 = g.area.toggles[pg.gi];
    place(pg.sp, pg.row - 1); for (let k = 0; k < 600; k++) { const left = G0.period - ((g.t + G0.offset) % G0.period); if (left < 0.5 && left > 0.4) break; sim(1 / 120); place(pg.sp, pg.row - 1); }
    freeze();
  });
  await beat('rb-turning', '43-22-6-page-turning.png', () => { thaw(); const g = S(), pg = g.entities.find(e => e.constructor.name === 'RbPage'); for (let k = 0; k < 120 && pg.flipT > 0.2; k++) { sim(1 / 120); place(pg.sp, pg.row - 1); } freeze(); });
  await beat('rb-stamps', '44-22-6-stamps-tell.png', () => {
    thaw(); const g = S(), st = g.entities.filter(e => e.constructor.name === 'RbStamp')[1]; place(Math.floor(st.fx / 32) - 4, 13);
    for (let k = 0; k < 600; k++) { const c = st.cycle, P0 = st.period; if (c >= P0 - 1.6 && c < P0 - 1.2) break; sim(1 / 120); place(Math.floor(st.fx / 32) - 4, 13); }
    freeze();
  });
  await beat('rb-slam', '45-22-6-stamp-slammed.png', () => { thaw(); const g = S(), st = g.entities.filter(e => e.constructor.name === 'RbStamp')[1]; for (let k = 0; k < 400 && st.k < 1; k++) { sim(1 / 120); place(Math.floor(st.fx / 32) - 4, 13); } sim(0.1); freeze(); });
  await beat('rb-notes', '46-22-6-footnotes.png', () => { thaw(); const g = S(), d = g.area.decor.find(x => x.kind === 'r1Tome'); place(Math.floor(d.x / 32) - 5, 13); sim(0.3); freeze(); });
  await beat('rb-notes-top', '47-22-6-footnotes-top-postcard.png', () => { thaw(); const g = S(), d = g.area.decor.find(x => x.kind === 'r1Tome'); place(Math.floor(d.x / 32), 4); sim(0.3); freeze(); });
  await beat('rb-secret', '48-22-6-small-print-tell.png', () => { thaw(); const g = S(), d = g.entities.find(e => e.constructor.name === 'TourDraft' || (e.s && e.s.secretDoor)); place(Math.floor((d ? d.cx : 110 * 32) / 32) - 4, 13); sim(0.4); freeze(); });
  await beat('rb-smallprint', '49-22-6-small-print-room.png', () => { thaw(); go('smallprint', 6, 10); sim(1.6); freeze(); });
  await beat('rb-pages2', '50-22-6-three-pages.png', () => { thaw(); go('book'); const g = S(), pg = g.entities.filter(e => e.constructor.name === 'RbPage')[3]; place(pg.sp, pg.row - 1); sim(0.3); freeze(); });
  await beat('rb-door', '51-22-6-chapter-door.png', () => { thaw(); const d = spawnTile('book', s => s.type === 'portal' && s.look === 'rbChapterDoor'); go('book', d.tx - 3, d.ty); sim(0.4); freeze(); });
  /* the mini-boss's phases */
  const arena = async (name, file, fn) => run(name, async () => { const r = await page.evaluate(fn); if (r && r.check) check(tag + ' ' + r.check, r.ok, r); await shot(file); });
  await arena('boss-wake', '52-22-6-rulebook-wakes.png', () => {
    thaw(); const g = S(), k = areaOf(g, 'finale'), an = g.level.areas[k].anchors.in; g.loadArea(k, an.x, an.y); const b = g.entities.find(e => e.boss), p = P();
    p.x = b.arenaX0 + 64; p.y = b.floorY - p.h - 4; p.vy = 0; p.invuln = 999; sim(2.4); freeze(); return { check: '22-6: the Rulebook wakes', ok: b.state !== 'sleep' };
  });
  await arena('boss-aim', '53-22-6-rulebook-aims.png', () => { thaw(); const b = S().boss || S().entities.find(e => e.boss), p = P(); for (let k = 0; k < 1200 && b.act !== 'aim'; k++) { sim(1 / 120); p.x = b.arenaX0 + 200; p.y = b.floorY - p.h; } sim(0.4); freeze(); return { check: '22-6: it aims, red marks under its stamps', ok: b.act === 'aim' }; });
  await arena('boss-open', '54-22-6-rulebook-falls-open.png', () => { thaw(); const b = S().entities.find(e => e.boss), p = P(); for (let k = 0; k < 600 && b.act !== 'open'; k++) { sim(1 / 120); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; } sim(0.3); p.x = b.cx - 70; p.y = b.floorY - p.h; freeze(); return { check: '22-6: after the slam it falls open (stomp it!)', ok: b.act === 'open' && b.vuln }; });
  await arena('boss-tear', '55-22-6-rulebook-page-torn.png', () => { thaw(); const b = S().entities.find(e => e.boss), p = P(); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.5); freeze(); return { check: '22-6: a stomp tears out a page', ok: b.hp === 2 }; });
  await arena('boss-blots', '56-22-6-rulebook-ink-blots.png', () => { thaw(); const b = S().entities.find(e => e.boss), p = P(); for (let k = 0; k < 1500 && !(b.act === 'open' && b.at > 0.15); k++) { sim(1 / 120); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; } freeze(); const n = S().entities.filter(e => e.constructor.name === 'TourShot' && !e.remove).length; return { check: '22-6: phase 2 slams splash ink blots', ok: n >= 2, n }; });
  await arena('boss-exit', '57-22-6-rulebook-last-page.png', () => {
    thaw(); const b = S().entities.find(e => e.boss), p = P();
    for (let n = 0; n < 3 && b.hp > 0; n++) { for (let k = 0; k < 1500 && b.act !== 'open'; k++) { sim(1 / 120); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; } sim(1 / 120); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.3); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; }
    sim(0.6); freeze(); return { check: '22-6: the last page, RULE 1, and it snaps shut', ok: b.act === 'exit' || b.state === 'dying' || b.remove, hp: b.hp, act: b.act, state: b.state, hurt: b.hurtT };
  });
  /* ---------- the HOUSE RULES page ---------- */
  await run('page', async () => {
    await page.evaluate(() => { fresh(); rules([3, 7, 9]); const P0 = window.BRADY_TOUR.TourProgress.data(); P0.cloche = '22-5'; P0.lighthouse = true; play('22-5'); S().rulesPage = window.BRADY_TOUR.TourRuleCut.lines(); sim(0.1); freeze(); });
    await shot('60-house-rules-page-half.png');
    await page.evaluate(() => { thaw(); rules([1, 10, 12]); S().rulesPage = window.BRADY_TOUR.TourRuleCut.lines(); sim(0.1); freeze(); });
    await shot('61-house-rules-page-all-six.png');
  });
  /* ---------- World 22's map before and after rule 1, the party blimp ---------- */
  await run('w22map', async () => {
    await page.evaluate(() => { fresh(); landDone('w22', ['22-5']); const P0 = window.BRADY_TOUR.TourProgress.data(); P0.revealed['22-5'] = true; rules([3, 7, 9, 10, 12]); openMap('22-5'); sim(2.5); });
    const r0 = await page.evaluate(() => { const ow = S().ow; return { cc: ow && ow.cc, rb: !!(ow && ow.by['22-6'] && ow.by['22-6'].visible) }; });
    check(tag + ' w22 map: before rule 1, no Rulebook stop', r0.cc === 'w22' && !r0.rb, r0);
    await page.evaluate(() => { overview(); sim(0.3); }); await shot('70-map-w22-before-rule-1.png');
    await page.evaluate(() => { window.BRADY_TOUR.TourRules.revoke(1, '22-5'); openMap('22-5'); sim(1.4); });
    await shot('71-map-w22-rule-1-trail-growing.png');
    await page.evaluate(() => { for (let k = 0; k < 40 && S().ow && (S().ow.revealQ.length || S().ow.reveal); k++) sim(0.25); sim(1.5); });
    const r1 = await page.evaluate(() => { const ow = S().ow, T = window.BRADY_TOUR; const C = T.Tour.countries.w22, E = T.TourMapScene.Graph.edges(C, T.TourMapScene.Graph.nodes(C)); return { rb: !!(ow.by['22-6'] && ow.by['22-6'].visible), route: !!T.TourMapScene.Graph.route(E, '22-5', '22-6'), enter: !!(ow.by['22-6'] && ow.by['22-6'].enter) }; });
    check(tag + ' w22 map: after rule 1, the Rulebook stop shows and its trail from 22-5 is walkable', r1.rb && r1.route && r1.enter, r1);
    await page.evaluate(() => { overview(); sim(0.3); }); await shot('72-map-w22-after-rule-1-party-blimp.png');
  });
  /* ---------- the ending's party ---------- */
  await run('ending', async () => {
    await page.evaluate(() => { fresh(); rules([1, 3, 7, 9, 10, 12]); const E = new window.BRADY_TOUR.TourEndingScene(); window.BRADY.Game.setScene(E); E.update(0.01); E.stage = E.lines.length - 2; E.t = 3; E.update = function (dt) { this.t += dt; }; });
    await shot('80-ending-party-piwi-sulks.png');
    await page.evaluate(() => { const E = S(); E.stage = E.lines.length - 1; E.t = 3; });
    await shot('81-ending-party-piwi-dances.png');
  });
};

(async () => {
  const L = !args.includes('--portrait'), Pt = !args.includes('--landscape');
  if (L) await session({ width: 874, height: 402 }, 'land', (page, shot, run) => scenes(page, shot, run, 'land'));
  if (Pt) await session({ width: 402, height: 874 }, 'port', (page, shot, run) => scenes(page, shot, run, 'port'));
  console.log(failures ? `${failures} RULEBOOK SHOT CHECK(S) FAILED` : 'ALL RULEBOOK SHOT CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
