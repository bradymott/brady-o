// The walkable overworld (src/28_tour_f*.js): walking only along open trails, going into a level from its stop,
// coming back to the right stop, a hidden trail revealed by a secret exit, houses and Bottle Mail coves, the flight
// between lands, secret lands hidden until found, and every land's layout at three phone sizes.
// usage: BRADY_DIST=<dist> node tools/sbw_overworld_test.js [shotsDir]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const shots = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (shots) fs.mkdirSync(shots, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); if (!ok) failures++; };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(appPage);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const B = window.BRADY, T = window.BRADY_TOUR;
    window.TT = T; window.S = () => B.Game.scene;
    // run the scene; inp = held Input flags for the whole time (edges are cleared after the first step)
    window.sim = (sec, inp) => {
      const I = B.Input, steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) Object.assign(I, inp);
        B.Game.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; if (I.hudPressed) for (const h in I.hudPressed) I.hudPressed[h] = false; }
      }
      if (inp) for (const key in inp) if (typeof inp[key] === 'boolean') I[key] = false;
    };
    // a fresh save; opts: done ids, exits [[id, key]], revealed reveals played
    window.fresh = () => {
      const d = B.Save.data; d.done = {}; d.unlocked = {}; d.exits = {}; d.secretExits = {}; d.gold = {}; d.best = {};
      d.tour = { at: null, seen: {}, freed: {}, lands: {}, cards: {} }; T.TourProgress.data(); B.Save.data.lives = 9;
    };
    window.clear = (id, key) => { B.Save.data.done[id] = true; return T.TourProgress.complete(id, key && key !== 'main', key || 'main'); };
    window.mapFrom = id => { const m = new T.TourMapScene({ from: id }); B.Game.setScene(m); m.card = null; return m; };
    // settle: let the map play its reveals, roadblocks and walks (taps nothing)
    window.settle = (max) => { const m = S(); for (let k = 0; k < (max || 12) * 60; k++) { m.update(1 / 60); if (S() !== m) return; if (m.mode === 'land' && m.ow.idle() && !m.flight) break; } };
    window.OW = () => S().ow;
  });

  // 1. A new game: Brady lands on Mexico's airstrip and walks to 1-1 by himself
  const r1 = await page.evaluate(() => {
    fresh(); const m = new TT.TourMapScene({}); window.BRADY.Game.setScene(m);
    const card = !!m.card; m.card = null; const at0 = m.ow.walker.at; settle();
    return { mode: m.mode, sel: m.sel, card, at0, at: m.ow.walker.at };
  });
  check('a new game opens the walkable overworld of Mexico with Chinka\'s postcard; Brady walks from the airstrip to 1-1', r1.mode === 'land' && r1.sel === 'mx' && r1.card && r1.at0 === 'start' && r1.at === '1-1', r1);
  if (shots) await page.screenshot({ path: path.join(shots, 'ow-01-start.png') });

  // 2. Walking only along open trails: 1-2 is behind the Baron's roadblock
  const r2 = await page.evaluate(() => {
    const ow = OW(), p = ow.G.pos['1-2'], q = ow.G.pos['1-1'];
    const dir = { right: p.x > q.x, left: p.x < q.x };
    sim(0.05, dir); sim(1.5);
    const blocked = ow.walker.at === '1-1' && !ow.walker.seg;
    // back to the airstrip with the stick, and on to 1-1 again
    const s = ow.G.pos.start; sim(0.05, { left: s.x < q.x, right: s.x > q.x }); sim(2.5);
    const back = ow.walker.at;
    sim(0.05, { right: q.x > s.x, left: q.x < s.x }); sim(2.5);
    return { blocked, back, again: ow.walker.at, toast: S().toastMsg };
  });
  check('the joystick walks Brady only along open trails (the closed trail to 1-2 bumps; the airstrip and back work)', r2.blocked && r2.back === 'start' && r2.again === '1-1' && /BLOCKED|BARON/.test(r2.toast), r2);

  // 3. Going into a level from its stop (jump), and the tap on a stop
  const r3 = await page.evaluate(() => { sim(0.02, { jumpPressed: true }); sim(0.8); const g = S(); return { scene: g.constructor.name, id: g.id }; });
  check('jump on a stop goes into that level', r3.scene === 'Play' && r3.id === '1-1', r3);

  // 4. Coming back after clearing it: Brady stands on 1-1, the roadblock clears, he walks on to 1-2
  const r4 = await page.evaluate(() => {
    clear('1-1'); const m = mapFrom('1-1'); const at0 = m.ow.walker.at;
    m.update(1 / 60); m.update(1 / 60); for (let k = 0; k < 40; k++) m.update(1 / 60);
    const clearing = !!m.ow.clears;
    settle();
    const T = TT.TourProgress.data();
    return { at0, clearing, at: m.ow.walker.at, opened: !!(T.ow && T.ow.open['mx:1-1>1-2']), panelAt: T.panelAt.mx };
  });
  check('back from 1-1: Brady stands on its stop, the roadblock clears, and he walks on to 1-2', r4.at0 === '1-1' && r4.clearing && r4.at === '1-2' && r4.opened && r4.panelAt === '1-2', r4);
  // a level left from the pause menu (no exit taken) just puts him back on its stop
  const r4b = await page.evaluate(() => { const m = mapFrom('1-1'); settle(); return m.ow.walker.at; });
  check('a level left without clearing puts Brady back on its own stop, no walk', r4b === '1-1', r4b);

  // 5. A hidden trail: 1-1's secret exit reveals the Souvenir Stand (trail grows, the stand pops), he walks there
  const r5 = await page.evaluate(() => {
    clear('1-1', 'secret'); const m = mapFrom('1-1');
    const hidden = !m.ow.by['house:mx-tienda'].visible;
    for (let k = 0; k < 50; k++) m.update(1 / 60);
    const rv1 = m.ow.reveal && m.ow.reveal.r.kind;
    let rv2 = null; for (let k = 0; k < 200 && !rv2; k++) { m.update(1 / 60); if (m.ow.reveal && m.ow.reveal.r.kind !== rv1) rv2 = m.ow.reveal.r.kind; }
    settle();
    const T = TT.TourProgress.data();
    return { hidden, rv1, rv2, revealed: !!T.revealed['house:mx-tienda'], path: !!T.paths['mx:0>6'], pending: T.pending.length, at: m.ow.walker.at };
  });
  check('a secret exit reveals its hidden trail and stop in the overworld (trail, then the stand), then Brady walks there', r5.hidden && r5.rv1 === 'path' && r5.rv2 === 'house' && r5.revealed && r5.path && r5.pending === 0 && r5.at === 'house:mx-tienda', r5);
  if (shots) { await page.evaluate(() => { clear('1-3', 'secret'); window.BRADY.Save.data.done['1-2'] = true; const m = mapFrom('1-3'); for (let k = 0; k < 70; k++) m.update(1 / 60); }); await page.screenshot({ path: path.join(shots, 'ow-05-reveal.png') }); await page.evaluate(() => settle()); }

  // 6. Houses are places: go into the stand from its stop
  const r6 = await page.evaluate(() => {
    const m = mapFrom('1-1'); settle(); const ow = m.ow; const r = TT.TourMapScene.Graph.route(ow.edges, ow.walker.at, 'house:mx-tienda');
    ow.walkRoute(r || [], false); settle(); const at = ow.walker.at; ow.enter(true); const g = S();
    return { at, scene: g.constructor.name, house: g.level && g.level.house };
  });
  check('the Souvenir Stand is a stop Brady walks to and goes into', r6.at === 'house:mx-tienda' && r6.scene === 'Play' && r6.house === 'mx-tienda', r6);
  const r6b = await page.evaluate(() => { const m = mapFrom('house:mx-tienda'); settle(); return { at: m.ow.walker.at, sel: m.sel }; });
  check('leaving the stand puts Brady back on its stop', r6b.at === 'house:mx-tienda' && r6b.sel === 'mx', r6b);

  // 7. A tap on a stop walks there along open trails; a tap on a locked stop does not
  const r7 = await page.evaluate(() => {
    const m = mapFrom('1-1'); settle(); const ow = m.ow;
    const tap = key => { const s = ow.nodeScreen(key); ow.testTaps = [{ x: s.x, y: s.y }]; sim(0.02); };
    tap('1-2'); const walking = !!ow.walker.seg; settle(); const at1 = ow.walker.at;
    tap('1-4'); sim(1); const at2 = ow.walker.at;
    const s2 = ow.nodeScreen('1-2'), dbg = [JSON.stringify(s2), JSON.stringify(ow.cardR), ow.walker.at, !!ow.walker.seg, ow.iris.close, JSON.stringify(ow.cam)];
    tap('1-2'); dbg.push(ow.iris.close, ow.iris.t, S().toastMsg); sim(1); const g = S();
    return { walking, at1, at2, scene: g.constructor.name, id: g.id, dbg };
  });
  check('a tap on a stop walks there; a locked stop stays out of reach; a tap on his own stop goes in', r7.walking && r7.at1 === '1-2' && r7.at2 === '1-2' && r7.scene === 'Play' && r7.id === '1-2', r7);

  // 8. Hidden secret level, Bottle Mail: Ecuador's 2-6 and its bottle cove
  const r8 = await page.evaluate(() => {
    fresh(); const T = TT.TourProgress.data(); T.cards = { mx: true, ec: true }; T.seen = { mx: true, ec: true };
    for (let i = 1; i <= 5; i++) clear('1-' + i); TT.TourProgress.data().pending = [];
    clear('2-1'); clear('2-2'); clear('2-3', 'secret'); T.pending = T.pending.filter(r => r.cc === 'ec');
    T.bottles[1] = true;
    const m = mapFrom('2-3'); settle();
    const ow = m.ow, at = ow.walker.at, cove = ow.by['bottle:1'];
    const r = TT.TourMapScene.Graph.route(ow.edges, at, 'bottle:1');
    if (r) ow.walkRoute(r, false); settle(); const atB = ow.walker.at; ow.enter(true);
    return { at, coveVisible: cove && cove.visible, route: r, atB, toast: m.toastMsg };
  });
  check('a secret exit opens the secret level (Brady walks to 2-6); a found bottle\'s cove is a place he walks to and reads', r8.at === '2-6' && r8.coveVisible && r8.atB === 'bottle:1' && /BOTTLE MAIL 1/.test(r8.toast), r8);

  // 9. Travel between lands: the boss opens the port; boarding there opens the route map on the next land; fly; land
  const r9 = await page.evaluate(() => {
    fresh(); const T = TT.TourProgress.data(); T.cards = { mx: true, ec: true };
    for (let i = 1; i <= 4; i++) clear('1-' + i); T.pending = [];
    const pre = mapFrom('1-4'); settle(); const portShut = !pre.ow.by.port.enter;
    clear('1-5'); const m = mapFrom('1-5'); settle(); const atPort = m.ow.walker.at;
    m.ow.enter(true); const route = m.mode, dest = m.dest;
    const ecShown = TT.TourMapScene.prototype && TT.Tour.stops.ec;
    sim(0.02, { jumpPressed: true }); const flying = !!m.flight;
    for (let k = 0; k < 600 && m.flight; k++) m.update(1 / 60);
    m.card = null; settle();
    return { portShut, atPort, route, dest, flying, mode: m.mode, sel: m.sel, at: m.ow.walker.at, at_: T.at };
  });
  check('the port opens when the boss falls; Brady walks there, boards, picks the next land on the route map, flies and lands on its airstrip', r9.portShut && r9.atPort === 'port' && r9.route === 'route' && r9.dest === 'ec' && r9.flying && r9.mode === 'land' && r9.sel === 'ec' && r9.at === '2-1' && r9.at_ === 'ec', r9);
  if (shots) await page.screenshot({ path: path.join(shots, 'ow-09-landed-ec.png') });
  // the world button and M open the route map from anywhere; left / right picks among open lands; back returns
  const r9b = await page.evaluate(() => {
    const m = S(); const B = window.BRADY; B.Input.hudPressed.world = true; sim(0.02); const viaBtn = m.mode;
    const list = TT.TourMapScene.prototype ? window.BRADY_TOUR.Tour.route.filter(s => { const C = TT.Tour.countries[s.id]; return C && TT.TourProgress.countryUnlocked(C); }).map(s => s.id) : [];
    B.Input.uiKey = 'left'; sim(0.02); const d1 = m.dest; B.Input.uiKey = 'right'; sim(0.02); const d2 = m.dest;
    B.Input.pausePressed = true; sim(0.02); const back = m.mode;
    return { viaBtn, list, d1, d2, back };
  });
  check('the world button opens the route map; left / right cycles open lands; back returns to walking', r9b.viaBtn === 'route' && r9b.d1 === 'mx' && r9b.d2 === 'ec' && r9b.back === 'land', r9b);

  // 10. Secret lands stay off the route until found; a new land is revealed on the route map and flown to
  const r10 = await page.evaluate(() => {
    const M = TT.TourMapScene, dests = () => M.prototype ? window.BRADY_TOUR.Tour.route.filter(s => { const C = TT.Tour.countries[s.id]; return C && (!s.secret || TT.TourProgress.countryUnlocked(C)) && TT.TourProgress.countryUnlocked(C); }).map(s => s.id) : [];
    fresh(); const T = TT.TourProgress.data(); T.cards = {};
    for (const C of TT.Tour.mainCountries().slice(0, 8)) { for (let i = 1; i <= C.mainCount; i++) clear(C.world + '-' + i); T.cards[C.id] = true; T.seen[C.id] = true; }
    T.pending = [];
    const m0 = mapFrom('8-5'); m0.openRoute({}); const before = m0.destCard && dests().join();
    const hidden = !dests().includes('aq') && !dests().includes('w22');
    clear('8-4', 'secret'); const m = mapFrom('8-4');
    let sawRoute = false, sawLand = false;
    for (let k = 0; k < 1500; k++) { m.update(1 / 60); if (m.mode === 'route') sawRoute = true; if (m.rReveal && m.rReveal.r.kind === 'land') sawLand = true; if (m.mode === 'land' && m.sel === 'aq') break; }
    return { hidden, sawRoute, sawLand, sel: m.sel, mode: m.mode, aqNow: dests().includes('aq'), w22: dests().includes('w22') };
  });
  check('secret lands stay hidden until found; 8-4\'s secret exit plays NEW LAND on the route map and flies to Antarctica', r10.hidden && r10.sawRoute && r10.sawLand && r10.sel === 'aq' && r10.mode === 'land' && r10.aqNow && !r10.w22, r10);
  if (shots) { await page.evaluate(() => { const m = S(); m.card = null; settle(); }); await page.screenshot({ path: path.join(shots, 'ow-10-antarctica.png') }); }

  // 11. Keyboard: arrow keys walk, Enter goes in, M opens the route map
  const r11 = await page.evaluate(() => { fresh(); const T = TT.TourProgress.data(); T.cards = { mx: true }; T.seen = { mx: true }; T.panelAt = { mx: 'start' }; const m = new TT.TourMapScene({}); window.BRADY.Game.setScene(m); settle(); return m.ow.walker.at; });
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(80); await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(2200);
  const r11a = await page.evaluate(() => OW().walker.at);
  await page.keyboard.press('m'); await page.waitForTimeout(300);
  const r11b = await page.evaluate(() => S().mode);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const r11d = await page.evaluate(() => S().mode);
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  const r11c = await page.evaluate(() => ({ scene: S().constructor.name, id: S().id }));
  check('keyboard: arrows walk, M opens the route map, Escape returns, Enter goes in', r11 === 'start' && r11a === '1-1' && r11b === 'route' && r11d === 'land' && r11c.scene === 'Play' && r11c.id === '1-1', { r11, r11a, r11b, r11d, r11c });

  // 12. Layouts: every land at three phone sizes
  for (const [W, H] of [[844, 390], [390, 844], [568, 320]]) {
    await page.setViewportSize({ width: W, height: H }); await page.waitForTimeout(300);
    const L = await page.evaluate(() => {
      const out = [], G = TT.TourMapScene.Graph, OWm = TT.TourMapScene.OW, Geo = TT.TourMapScene.Geo;
      for (const cc in TT.Tour.countries) {
        const C = TT.Tour.countries[cc], m = new TT.TourMapScene({}); m.sel = cc; m.ow = new TT.TourMapScene.Overworld(m, C, {}); m.ow.layoutView();
        const ow = m.ow, geo = ow.G, nodes = G.nodes(C), edges = G.edges(C, nodes), probs = [];
        // every stop: inside the map, on dry land, far enough from the others; touch targets of 40 px or more
        for (const n of nodes) {
          const p = geo.pos[n.key]; if (!p) { probs.push('no position ' + n.key); continue; }
          if (p.x < 40 || p.y < 50 || p.x > geo.w - 40 || p.y > geo.h - 40) probs.push('off the map ' + n.key);
          if (!geo.land.some(r => Geo.inPoly(p.x, p.y, r))) probs.push('in the sea ' + n.key);
          for (const o of nodes) if (o !== n && geo.pos[o.key] && Math.hypot(geo.pos[o.key].x - p.x, geo.pos[o.key].y - p.y) < 70) probs.push('stops too close ' + n.key + ' ' + o.key);
        }
        const target = OWm.NODE_R * 2 * ow.z; if (target < 40) probs.push('touch target ' + target.toFixed(1));
        // labels: none overlaps another label or another stop
        const boxes = nodes.map(n => ({ n, b: ow.labelBox(n) })).filter(x => x.b);
        for (let i = 0; i < boxes.length; i++) {
          const a = boxes[i].b;
          if (a.x < 4 || a.x + a.w > geo.w - 4 || a.y < 4 || a.y + a.h > geo.h - 4) probs.push('label off the map ' + boxes[i].n.key);
          for (let j = i + 1; j < boxes.length; j++) { const b = boxes[j].b; if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) probs.push('labels overlap ' + boxes[i].n.key + ' ' + boxes[j].n.key); }
          for (const n of nodes) { if (n === boxes[i].n) continue; const p = geo.pos[n.key]; if (p && p.x > a.x - 14 && p.x < a.x + a.w + 14 && p.y > a.y - 10 && p.y < a.y + a.h + 24) probs.push('label covers a stop ' + boxes[i].n.key + ' ' + n.key); }
        }
        // every stop on a trail that can open: all trails open -> all stops reachable from the airstrip
        const all = edges.map(e => Object.assign({}, e, { open: true, visible: true, fresh: false }));
        for (const n of nodes) if (n.key !== 'start' && !G.route(all, 'start', n.key)) probs.push('unreachable ' + n.key);
        // trails do not run over other stops
        for (const e of edges) { const P = OWm.curve(geo, e); if (!P) { probs.push('no trail ' + e.key); continue; } for (const n of nodes) { if (n.key === e.a || n.key === e.b) continue; const p = geo.pos[n.key]; if (p && Geo.distPoly(p.x, p.y, P.pts) < 24) probs.push('trail ' + e.key + ' runs over ' + n.key); } }
        out.push({ cc, n: nodes.length, probs });
      }
      return out;
    });
    const bad = L.filter(x => x.probs.length);
    check(`layouts at ${W}x${H}: all ${L.length} lands have every stop on land, apart, labelled without overlaps, reachable, trails clear of other stops, touch targets >= 40 px`, L.length === 14 && !bad.length, bad.map(x => x.cc + ': ' + x.probs.slice(0, 4).join('; ')));
    // the HUD stays out of the notch / home-indicator insets and the card stays on screen
    const hud = await page.evaluate(() => { const m = new TT.TourMapScene({}); window.BRADY.Game.setScene(m); m.card = null; settle(1); const ow = m.ow, c = ow.cardR, W = window.BRADY.Game.cssW, H = window.BRADY.Game.cssH; return { card: [c.x, c.y, c.w, c.h], ok: c.x >= 0 && c.y >= 0 && c.x + c.w <= W && c.y + c.h <= H && c.w >= 200 }; });
    check(`the info card fits the screen at ${W}x${H}`, hud.ok, hud);
    if (shots) await page.screenshot({ path: path.join(shots, `ow-12-layout-${W}x${H}.png`) });
  }
  check('no page errors', errors.length === 0, errors.slice(0, 5));
  console.log(failures ? `${failures} CHECK(S) FAILED` : 'ALL CHECKS PASSED');
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
