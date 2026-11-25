// Super Brady-O World: every Wormhole end to end, the way a player takes it (docs/design/BACKSTAGE_STATUS.md).
// For each Wormhole of the game (TourSecrets.warps()), on a fresh v5 save with ordinary progression up to the level:
//   Brady stands at the trunk in its backstage area, presses Up, is sucked in, the WORMHOLE! results come up, a real
//   tap on the results' MAP button opens the map, the map plays (the land's reveals, the route map's wormhole trip,
//   the landing; Princess Papaya's postcards are tapped away), and then: which land and stop Brady stands on, the target level
//   unlocked, its stop visible and enterable, a walkable trail to it, nothing of the trip left in the save, and
//   entering the stop really starts the target level.
// Variants (each on its own fresh save):
//   map        the plain run (landscape; portrait in the portrait session)
//   mash       an impatient player presses ▲ (the map's GO) and taps the info card and Brady's stop all through the trip
//   button     the level's Brady Button slapped first (its REVOKED reveals queue with the trip)
//   again      the level and its Wormhole were already taken once before (a second trip)
//   retry      PLAY AGAIN on the results, then the pause menu's WORLD MAP from the replay
//   calm       motion effects off (FX CALM)
//   reload@results / reload@trip / reload@land   the page reloads (the PWA resumes from the save) on the results
//              screen, in the middle of the route map's trip, or the moment Brady touches down in the target land
//   stale      a save from the broken build: a trip that was played half-way (no wormhole left to show, arrival
//              still stored) is repaired when the map opens
// Silent (tools/sbw_silent.js). usage: BRADY_DIST=<dist> node tools/sbw_wormhole_trips.js <outdir> [--checks]
//   [--only 2-3,8-3] [--variants map,again,...] [--portrait-only]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args.find(a => !a.startsWith('--')) || 'wormhole-trips'), checksOnly = args.includes('--checks');
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const only = opt('--only') ? opt('--only').split(',') : null;
const LAND_VARIANTS = ['map', 'mash', 'again', 'retry', 'calm', 'button', 'reload@results', 'reload@trip', 'reload@land', 'stale'];
const variants = opt('--variants') ? opt('--variants').split(',') : null;
fs.mkdirSync(out, { recursive: true });
let failures = 0; const table = [];
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); if (!ok) failures++; return ok; };

// in-page helpers (added again after every reload)
const HELPERS = () => {
  const B = window.BRADY, BT = window.BRADY_TOUR;
  const Tour = BT.Tour, TP = BT.TourProgress, I = B.Input;
  // what played, seen from the game's own calls (the page's real frame loop also runs between the test's steps)
  window.__trip = { route: false, warp: false, hop: false, emerge: false };
  const MS = BT.TourMapScene.prototype, nr0 = MS.nextRouteReveal, mu0 = MS.update;
  MS.nextRouteReveal = function () { nr0.call(this); if (this.rReveal && this.rReveal.r.kind === 'warp') window.__trip.warp = true; };
  MS.update = function (dt) { const r = mu0.call(this, dt); if (this.mode === 'route') window.__trip.route = true; if (this.ow && this.ow.hopFx) window.__trip.hop = true; if (this.ow && this.ow.emergeFx) window.__trip.emerge = true; return r; };
  window.W$ = {
    S: () => B.Game.scene,
    // step the live scene (whatever it is by then) in 1/60 s frames
    step(sec, each) { for (let k = 0, n = Math.round(sec * 60); k < n; k++) { const s = B.Game.scene; if (each && each(s) === false) return false; s.update(1 / 60); I.taps.length = 0; I.jumpPressed = I.upPressed = I.actionPressed = I.downPressed = false; I.uiKey = null; } return true; },
    // a fresh v5 save, the tour beaten in route order up to the Wormhole's level (every reveal played)
    progress(id, key, o) {
      o = o || {};
      B.Save.data = B.Save.defaults(); const d = B.Save.data; d.v = 3; d.lives = 9; d.seenTourIntro = true;
      if (o.calm) d.settings.reduceMotion = true;
      window.__trip = { route: false, warp: false, hop: false, emerge: false };
      const T = TP.data(); T.cards = T.cards || {};
      const SC = Tour.countryOf(id), n = +id.split('-')[1];
      const beat = lid => { d.done[lid] = true; TP.exit(lid, 'main'); };
      const visit = C => { T.seen[C.id] = true; T.cards[C.id] = true; };
      for (const C of Tour.mainCountries()) { if (C === SC) break; for (const lid of Tour.mainIds(C)) beat(lid); visit(C); }
      if (SC.secret) T.lands[SC.id] = true;
      for (let i = 1; i < n; i++) if (!SC.levels[i - 1].secret) beat(SC.world + '-' + i);
      d.unlocked[id] = true; visit(SC);
      const w = BT.TourSecrets.warps().find(q => q.id === id && q.key === key);
      for (const q of [].concat(w.needs || [])) { const m = /^rule:(\d+)$/.exec(q); if (m) T.rules[m[1]] = { at: 'test' }; }
      if (o.again) { d.done[id] = true; TP.exit(id, 'main'); TP.exit(id, key); }
      for (const r of T.pending.slice()) TP.revealDone(r);
      if (o.again) { T.arrive = null; T.hop = null; }
      T.lastExit = null; T.at = SC.id; (T.panelAt = T.panelAt || {})[SC.id] = id;
      B.Save.save();
      return w;
    },
    // into the level, Brady at the trunk, Up: on to the results screen
    takeWarp(id, key) {
      const [wn, i] = id.split('-').map(Number);
      const g = new B.Play(B.getLevel(wn, i), {}); B.Game.setScene(g);
      for (let k = 0; k < 400 && g.state !== 'play'; k++) g.update(1 / 120);
      let ai = -1, sp = null; g.level.areas.forEach((a, k) => { const s = a.spawns.find(x => x.type === 'warp' && (x.exit || 'warp') === key); if (s && !sp) { sp = s; ai = k; } });
      if (!sp) return { err: 'no trunk' };
      if (g.area.idx !== ai) g.loadArea(ai, sp.x, sp.y - 8);
      const t = g.entities.find(e => e.isWarp && e.exitKey === key); if (!t) return { err: 'no trunk entity' };
      const p = g.player; p.x = t.cx - p.w / 2; p.y = t.y + t.h - p.h; p.vx = p.vy = 0; p.invuln = 99;
      for (let k = 0; k < 30; k++) g.update(1 / 120);
      I.up = true; I.upPressed = true; g.update(1 / 120); I.upPressed = false;
      for (let k = 0; k < 30; k++) g.update(1 / 120); I.up = false;
      for (let k = 0; k < 1200 && g.state !== 'results'; k++) { g.update(1 / 120); if (g.state === 'tally' && k > 400) I.taps.push({ x: -9, y: -9 }); }
      I.taps.length = 0;
      return { area: g.area.aid, state: g.state, exitKey: g.exitKey, buttons: (g.resultsUI || []).map(b => ({ label: b.label, x: b.x + b.w / 2, y: b.y + b.h / 2 })) };
    },
    // the map, as the player sits through it: postcards tapped away; stops when Brady stands still with nothing left
    // to play, or at `until` ('trip': the route map's wormhole is on screen; 'land': Brady touched down in `cc`)
    playMap(o) {
      o = o || {}; let quiet = 0, t = 0, mashDone = false; const Game$W = () => B.Game.cssW, Game$H = () => B.Game.cssH;
      let seen = { route: false, warp: false, hop: false, emerge: false };
      const done = W$.step(o.sec || 40, s => {
        t += 1 / 60;
        if (!s.ow && s.constructor.name !== 'TourMapScene') return;
        if (s.card) { if (s.mode === 'land' && s.ow) s.ow.testTaps = [{ x: 5, y: 5 }]; else I.taps.push({ x: 5, y: 5 }); quiet = 0; return; }
        // an impatient player: ▲ (the map's GO) and taps on the info card and on Brady's stop, every 8th frame, until
        // the trip is over (Brady in the target land, out of the wormhole; or the hop done)
        if (o.mash && !mashDone) {
          if (s.mode === 'land' && s.ow && ((o.cross && s.ow.cc === o.toCc && seen.emerge && !s.ow.emergeFx) || (!o.cross && seen.hop && !s.ow.hopFx))) mashDone = true;
          else if (Math.round(t * 60) % 8 === 0) {
            I.jumpPressed = true;
            if (s.mode === 'land' && s.ow) { const c = s.ow.cardR, p = s.ow.G.pos[s.ow.walker.at]; const tp = [c ? { x: c.x + c.w / 2, y: c.y + c.h / 2 } : null, p ? s.ow.toScreen ? s.ow.toScreen(p.x, p.y) : null : null].filter(Boolean); s.ow.testTaps = tp; }
            else I.taps.push({ x: Game$W() / 2, y: Game$H() / 2 });
          }
        }
        if (s.mode === 'route') seen.route = true;
        if (s.rReveal && s.rReveal.r.kind === 'warp') seen.warp = true;
        if (s.ow && s.ow.hopFx) seen.hop = true;
        if (s.ow && s.ow.emergeFx) seen.emerge = true;
        if (o.until === 'trip' && ((s.rReveal && s.rReveal.r.kind === 'warp' && s.rReveal.t > 0.8) || (s.ow && s.ow.hopFx && s.ow.hopFx.t > 0.6))) return false;
        if (o.until === 'land' && s.mode === 'land' && s.ow && s.ow.cc === o.cc && t > 0.5 && (s.ow.emergeFx || s.ow.air)) return false;
        const T = TP.data();
        const still = s.mode === 'land' && s.ow && s.ow.idle() && !s.ow.hopFx && !s.ow.emergeFx && !T.pending.length && !T.arrive && !T.hop && !s.warpLand;
        quiet = still ? quiet + 1 : 0;
        if (quiet > 60) return false;
      });
      for (const k in seen) seen[k] = seen[k] || window.__trip[k];
      return { stopped: !done, seen };
    },
    where() {
      const s = B.Game.scene, T = TP.data();
      const ow = s && s.ow;
      return { scene: s && s.constructor.name, mode: s && s.mode, cc: ow && ow.cc, at: ow && ow.walker.at, pending: T.pending.map(r => r.kind + ':' + (r.id || r.to)), arrive: T.arrive, hop: T.hop, tAt: T.at };
    },
    // what the player sees at the stop: unlocked, visible, enterable, a trail he can walk to it
    verdict(w) {
      const s = B.Game.scene, ow = s.ow, n = ow && ow.by[w.to];
      const from = w.toCc === w.cc ? w.id : 'start';
      return {
        unlocked: TP.isUnlocked(w.to), visible: !!(n && n.visible), enter: !!(n && n.enter),
        trail: !!(ow && ow.by[from] && ow.reachable(from, w.to)),
        startTrail: !!(ow && ow.reachable('start', w.to))
      };
    },
    // go into the stop Brady stands on (the GO button's path): the target level must start
    enterHere() { const s = B.Game.scene; s.ow.enter(true); const g = B.Game.scene; return { scene: g.constructor.name, id: g.id || null }; }
  };
};

async function session(viewport, list, vars, tag) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await silence(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const boot = async () => { await page.waitForFunction(() => window.BRADY && window.BRADY.Game && window.BRADY.Game.scene && window.BRADY_TOUR, null, { timeout: 30000 }); await page.waitForTimeout(400); await page.evaluate(HELPERS); };
  await page.goto(appPage); await boot();
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const shot = async name => { if (checksOnly) return; await pin(); await page.waitForTimeout(250); await page.screenshot({ path: path.join(out, name) }); };
  // the reloaded PWA: the title's PLAY (TitleScene.leave -> goToMap('world'))
  const reload = async () => {
    await page.reload(); await boot();
    await page.evaluate(() => { const B = window.BRADY; B.goToMap('world'); });
  };
  const ws = await page.evaluate(() => window.BRADY_TOUR.TourSecrets.warps().map(w => ({ id: w.id, key: w.key, to: w.to, cc: w.cc, toCc: w.toCc, needs: w.needs, label: w.label })));
  for (const w of ws) {
    const name = w.id + (w.key !== 'warp' ? ':' + w.key : '');
    if (list && !list.includes(name) && !list.includes(w.id)) continue;
    const cross = w.cc !== w.toCc;
    for (const v of vars) {
      if (v === 'stale' && !cross) continue;
      const T = `${tag} ${name} -> ${w.to} [${v}]`, file = `${tag}-${name.replace(':', '_')}-${v.replace('@', '_')}`;
      try {
        const w2 = await page.evaluate(([id, key, v]) => W$.progress(id, key, { calm: v === 'calm', again: v === 'again' }), [w.id, w.key, v]);
        if (v === 'button') await page.evaluate(id => { const BT = window.BRADY_TOUR, L = BT.Tour.specOf(id); for (const a of window.BRADY.getLevel(...id.split('-').map(Number)).areas) for (const s of a.spawns) if (s.type === 'button' && BT.TOUR_RULES[s.rule]) BT.TourRules.revoke(+s.rule, id); }, w.id);
        const r = await page.evaluate(([id, key]) => W$.takeWarp(id, key), [w.id, w.key]);
        if (!check(T + ': Up at the trunk ends on the WORMHOLE! results', r.state === 'results' && r.exitKey === w.key, r)) { table.push({ name, to: w.to, v: tag + ' ' + v, ok: false, info: 'no results' }); continue; }
        if (v === 'map') await shot(file + '-1-results.png');
        if (v === 'reload@results') await reload();
        else if (v === 'retry') {
          const again = r.buttons.find(b => /PLAY AGAIN/.test(b.label));
          await page.touchscreen.tap(again.x, again.y); await page.waitForTimeout(200);
          const ps = await page.evaluate(() => { W$.step(2); const g = W$.S(); g.openPause(); const b = g.pauseUI.find(q => /WORLD MAP/.test(q.label)); return { scene: g.constructor.name, b: b && { x: b.x + b.w / 2, y: b.y + b.h / 2 } }; });
          await page.touchscreen.tap(ps.b.x, ps.b.y); await page.waitForTimeout(200);
        } else {
          const mapB = r.buttons.find(b => /MAP/.test(b.label));
          await page.touchscreen.tap(mapB.x, mapB.y); await page.waitForTimeout(200);
        }
        if (v === 'stale') {
          // the broken build's half-played trip: the wormhole reveal used up, the arrival still stored, Brady at the source
          await page.evaluate(() => { const B = window.BRADY, TP = window.BRADY_TOUR.TourProgress, T = TP.data(); for (const q of T.pending.slice()) if (q.kind === 'warp') TP.revealDone(q); B.Save.save(); });
          await reload();
        }
        let before = null;
        if (v === 'reload@trip') {
          before = await page.evaluate(() => W$.playMap({ until: 'trip' }));
          await shot(file + '-2-trip.png');
          await reload();
        }
        if (v === 'reload@land') { await page.evaluate(cc => W$.playMap({ until: 'land', cc }), w.toCc); await reload(); }
        if (v === 'map' && cross) { await page.evaluate(() => W$.playMap({ until: 'trip' })); await shot(file + '-2-trip.png'); }
        const m = await page.evaluate(o => W$.playMap(o), { mash: v === 'mash', cross, toCc: w.toCc });
        if (before) for (const k in before.seen) m.seen[k] = m.seen[k] || before.seen[k];
        const at = await page.evaluate(() => W$.where());
        await shot(file + '-3-arrival.png');
        const vd = await page.evaluate(w => W$.verdict(w), w);
        const ok1 = check(T + ': Brady stands at the target stop in the target land', at.mode === 'land' && at.cc === w.toCc && at.at === w.to, at);
        const ok2 = check(T + ': the trip played (wormhole on the route map, or the hop in the land)', v.startsWith('reload@land') || v === 'stale' || (cross ? m.seen.warp : m.seen.hop), m.seen);
        const ok3 = check(T + ': nothing of the trip left in the save', !at.pending.some(p => p.startsWith('warp:')) && !at.arrive && !at.hop, at);
        const ok4 = check(T + ': the target is unlocked, its stop visible and enterable, with a trail to it', vd.unlocked && vd.visible && vd.enter && vd.trail, vd);
        const en = ok1 ? await page.evaluate(() => W$.enterHere()) : { scene: null };
        const ok5 = check(T + ': going in at the stop starts ' + w.to, en.scene === 'Play' && en.id === w.to, en);
        table.push({ name, to: w.to, v: tag + ' ' + v, ok: ok1 && ok2 && ok3 && ok4 && ok5, info: at.cc + ' ' + at.at });
      } catch (e) { check(T + ' runs', false, String(e.message).slice(0, 300)); table.push({ name, to: w.to, v: tag + ' ' + v, ok: false, info: 'threw' }); try { await page.goto(appPage); await boot(); } catch (e2) { /* next */ } }
    }
  }
  check(`${tag}: no page errors`, !errors.length, errors.slice(0, 5));
  await browser.close();
}

(async () => {
  const lv = variants || LAND_VARIANTS;
  if (!args.includes('--portrait-only')) await session({ width: 874, height: 402 }, only, lv, 'L');
  await session({ width: 402, height: 874 }, only, variants ? lv : ['map', 'mash'], 'P');
  console.log('\nWORMHOLE        VARIANT          RESULT');
  for (const r of table) console.log(`${(r.name + ' -> ' + (r.to || '')).padEnd(16)}${r.v.padEnd(17)}${r.ok ? 'ok' : 'FAIL'}  ${r.info || ''}`);
  console.log(failures ? `${failures} WORMHOLE TRIP CHECK(S) FAILED` : 'ALL WORMHOLE TRIP CHECKS PASSED');
  process.exit(failures ? 1 : 0);
})();
