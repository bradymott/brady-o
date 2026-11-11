// Soak test for Super Brady-O World: runs the REAL game loop in real time (requestAnimationFrame, the fixed-step
// accumulator, drawing) in an iPhone-sized touch browser and drives Brady with real input events (synthetic touches
// on the on-screen controls, and the keyboard), then deliberately works every door, hatch, lever, curtain, cart and
// checkpoint of every area, dies and respawns, pauses, rotates the phone, backgrounds the tab, takes a game over
// and leaves to the map. It fails on anything that would look like a freeze on a phone:
//   - a page error, a console error, or an error the main loop caught (Game.errors / window.__sbwErrors)
//   - the main loop stopping (no frame for > 1 s while the page is visible), or one frame taking > 500 ms
//   - a soft-lock: a door / area change / respawn that never completes, Brady stuck out of the 'play' state,
//     the fade stuck, the level not reacting to input
//   - runaway growth of entities or particles
// usage: node tools/sbw_soak_test.js [--long] [--levels 1-2,1-3 | rebuilt | all] [--engine webkit|chromium]
//        [--jobs N] [--secs S] [--shots dir]
//   short mode (default): the rebuilt (v2) levels, about 20-30 s each; --long: every level, longer autopilot,
//   full cart rides. BRADY_DIST=<folder> to test a private build. WebKit is used when installed (iPhone Safari).
const pw = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const LONG = args.includes('--long');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const root = path.join(dist, 'site');
const shots = opt('--shots', null); if (shots) fs.mkdirSync(shots, { recursive: true });
const AUTO = +opt('--secs', LONG ? 45 : 5);
const JOBS = +opt('--jobs', 3);
let engine = opt('--engine', null);
if (!engine) { try { engine = fs.existsSync(pw.webkit.executablePath()) ? 'webkit' : 'chromium'; } catch (e) { engine = 'chromium'; } }
const RIDE_FULL = LONG;
const failures = [];
const fail = (id, what, info) => { failures.push({ id, what, info }); console.log('FAIL ' + id + ' ' + what + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 600) : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// a tiny static server: the game runs from http like on GitHub Pages (file:// trips CORS in WebKit)
function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.txt': 'text/plain' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, path.normalize(p));
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

// in-page helpers: the monitor around Game.frame, input (touch or keyboard), the autopilot, probes
function pageSetup() {
  const B = window.BRADY, G = B.Game;
  const M = window.__soak = { frames: 0, maxGap: 0, maxCost: 0, slow: [], lastStart: performance.now(), hiddenUntil: 0, quiet: 0 };
  const f0 = G.frame;
  G.frame = function (t) {
    const a = performance.now(), gap = a - M.lastStart; M.lastStart = a;
    if (!document.hidden && a > M.hiddenUntil && gap > M.maxGap) M.maxGap = gap;
    f0.call(this, t);
    const c = performance.now() - a; M.frames++;
    if (c > M.maxCost) M.maxCost = c;
    if (c > 500 && M.slow.length < 5) M.slow.push({ ms: Math.round(c), scene: G.scene && G.scene.constructor.name });
  };
  M.reset = () => { M.maxGap = 0; M.maxCost = 0; M.lastStart = performance.now(); };
  // ---- input: real events into the game's own handlers ----
  const cv = G.canvas;
  const ptr = (type, id, x, y) => cv.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, pointerType: 'touch', isPrimary: id === 1, bubbles: true, cancelable: true }));
  const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true, cancelable: true }));
  const KEY = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', jump: 'Space', action: 'KeyX' };
  const In = window.__in = { mode: 'touch', held: {}, stickDir: null };
  In.set = held => {
    held = held || {};
    if (In.mode === 'keys') {
      for (const k in KEY) if (!!held[k] !== !!In.held[k]) key(KEY[k], !!held[k]);
    } else {
      const L = B.Input.layout; if (!L) return;
      const dir = (held.left ? 'l' : held.right ? 'r' : '') + (held.up ? 'u' : held.down ? 'd' : '');
      if (dir !== In.stickDir) {
        if (In.stickDir) ptr('pointerup', 11, L.stickHome.x, L.stickHome.y);
        if (dir) {
          const r = L.r, dx = held.left ? -r : held.right ? r : 0, dy = held.up ? -r : held.down ? r : 0;
          ptr('pointerdown', 11, L.stickHome.x, L.stickHome.y); ptr('pointermove', 11, L.stickHome.x + dx, L.stickHome.y + dy);
        }
        In.stickDir = dir;
      }
      for (const [k, id] of [['jump', 12], ['action', 13]]) if (!!held[k] !== !!In.held[k]) { const b = L[k]; ptr(held[k] ? 'pointerdown' : 'pointerup', id, b.x, b.y); }
    }
    In.held = Object.assign({}, held);
  };
  In.release = () => { In.set({}); B.Input.releaseAll(); In.stickDir = null; };
  In.tap = (x, y) => { ptr('pointerdown', 21, x, y); ptr('pointerup', 21, x, y); };
  In.press = k => { const h = Object.assign({}, In.held); h[k] = true; In.set(h); setTimeout(() => { const h2 = Object.assign({}, In.held); h2[k] = false; In.set(h2); }, 90); };
  In.pause = () => { const L = B.Input.layout; In.tap(L.pause.x, L.pause.y); };
  // the pause menu's RESUME button (what a player taps)
  In.resume = () => { const g = G.scene, b = g && g.pauseUI && g.pauseUI[0]; if (b) In.tap(b.x + b.w / 2, b.y + b.h / 2); };
  // ---- probes ----
  window.__st = () => {
    const g = G.scene, o = { scene: g ? g.constructor.name : null, frames: M.frames, errors: Math.max(G.errors || 0, window.__sbwErrors || 0) };
    if (g instanceof B.Play) {
      const p = g.player;
      Object.assign(o, { state: g.state, paused: !!g.paused, area: g.area.idx, areas: g.level.areas.length, ps: p.state, x: Math.round(p.x), y: Math.round(p.y), dead: !!p.dead, fade: Math.round(g.fade.a * 100) / 100, ents: g.entities.length, parts: g.parts.list.length, t: Math.round(g.t * 10) / 10, ride: !!(p.ride && p.ride.carrier), water: !!p.inWater, cp: g.checkpoint ? g.checkpoint.area + ':' + Math.round(g.checkpoint.x) : null });
    }
    return o;
  };
  const INTERACT = /^(Portal|TourTrapdoor|TourRailSwitch|TourCurtain|Checkpoint|TourLever|TourToggleSwitch|TourPlate|TourTeleport|TourZip|TourCatapult|TourGearStand|TourPedestal|TourShop|SouvenirShop|TourValve|Gate)$/;
  window.__targets = () => {
    const g = G.scene; if (!(g instanceof B.Play)) return [];
    return g.entities.filter(e => !e.remove && (INTERACT.test(e.constructor.name) || e.portal || e.target)).map((e, k) => ({ k: g.entities.indexOf(e), type: e.constructor.name, x: Math.round(e.x), y: Math.round(e.y), w: e.w, h: e.h, target: e.target || (e.portal && e.portal.target) || null }));
  };
  // put Brady on his feet next to entity #k (in the running loop: no sim, no scene swap)
  window.__goTo = k => {
    const g = G.scene, e = g.entities[k], p = g.player; if (!e || !p) return false;
    p.x = e.x + e.w / 2 - p.w / 2; p.y = e.y + e.h - p.h - 1; p.vx = 0; p.vy = 0; p.ride = null;
    g.camX = Math.max(0, Math.min(g.area.W * 32 - G.viewW, p.cx - G.viewW * 0.4)); g.camY = g.camTargetY(true);
    if (g.state === 'play' && p.state === 'play') return true;
    return false;
  };
  // ---- the autopilot (runs off a timer, so it keeps steering whatever the frame rate) ----
  const AP = window.__ap = { on: false, lastX: 0, still: 0, t: 0, phase: 0 };
  AP.tick = () => {
    if (!AP.on) return;
    const g = G.scene; AP.t += 0.1;
    if (!(g instanceof B.Play) || g.paused || g.state !== 'play' || !g.player || g.player.state !== 'play') { if (Object.keys(In.held).some(k => In.held[k])) In.set({}); return; }
    const p = g.player, A = g.area, h = {};
    const moved = Math.abs(p.x - AP.lastX) > 3; AP.lastX = p.x; AP.still = moved ? 0 : AP.still + 0.1;
    const cart = A.carrier || A.rail ? g.entities.find(e => e.carrier && !e.remove) : null;
    if (cart && p.y < cart.y + 4) {
      // a ride: get onto the boat / cart and stay there; throw the levers now and then; UP under willows
      const dx = (cart.x + cart.w / 2) - p.cx;
      if (p.ride !== cart) { if (dx > 12) h.right = true; else if (dx < -12) h.left = true; if (Math.abs(dx) > 40 && p.onGround && Math.random() < 0.3) h.jump = true; }
      else if (Math.random() < 0.05) h.action = true; else if (Math.random() < 0.05) h.up = true; else if (Math.random() < 0.04) h.jump = true;
    } else {
      h.right = true;
      if (AP.still > 0.5 && AP.still < 2.5) h.jump = Math.random() < 0.7;
      else if (AP.still >= 2.5 && AP.still < 3.2) { h.right = false; h.left = true; h.jump = Math.random() < 0.5; }
      else if (AP.still >= 3.2) AP.still = 0;
      if (p.inWater) { h.jump = Math.random() < 0.5; if (Math.random() < 0.15) h.up = true; }
      if (Math.random() < 0.25) h.jump = true;
      if (Math.random() < 0.08) h.action = true;
      if (Math.random() < 0.03) h.down = true;
    }
    In.set(h);
  };
  setInterval(AP.tick, 100);
}

async function soakLevel(page, id, log) {
  const errs0 = [];
  const st = () => page.evaluate(() => window.__st());
  const T0 = Date.now();
  // wait until fn(state) is true (or time out): returns the last state
  const waitFor = async (fn, ms) => { const t0 = Date.now(); let s; while (Date.now() - t0 < ms) { s = await st(); if (fn(s)) return { ok: true, s }; await sleep(100); } return { ok: false, s }; };
  const errorsNow = async () => (await st()).errors;
  const start = async (opts) => {
    await page.evaluate(({ id, opts }) => { const B = window.BRADY; B.Save.data.lives = 9; const [w, i] = id.split('-').map(Number); B.Game.setScene(new B.Play(B.getLevel(w, i), opts || {})); window.__soak.reset(); }, { id, opts });
    const r = await waitFor(s => s.scene === 'Play' && s.state === 'play', 4000);
    if (!r.ok) fail(id, 'the level never left its intro', r.s);
    return r.ok;
  };
  const healthy = async (what) => {
    const m = await page.evaluate(() => { const M = window.__soak, o = { maxGap: Math.round(M.maxGap), maxCost: Math.round(M.maxCost), slow: M.slow.splice(0) }; M.maxGap = 0; M.maxCost = 0; return o; });
    if (m.maxGap > 1000) fail(id, 'the main loop stopped (no frame for ' + m.maxGap + ' ms) during ' + what);
    if (m.maxCost > 500) fail(id, 'a frame took ' + m.maxCost + ' ms during ' + what, m.slow);
    return m;
  };
  const shot = async n => { if (shots) await page.screenshot({ path: path.join(shots, 'soak-' + id + '-' + n + '.png') }).catch(() => {}); };
  const errBase = await errorsNow();
  const checkErrors = async what => { const e = await errorsNow(); if (e > errBase + errs0.length) { const list = await page.evaluate(() => (window.__bradyErrors || []).slice(-3)); fail(id, 'errors caught by the main loop during ' + what, list); errs0.push(...list); } };
  const report = { id, phases: [] };

  // ---------- 1. autopilot: real-time play with touch (odd levels) or keyboard input ----------
  const n = +id.split('-')[1];
  await page.evaluate(m => { window.__in.mode = m; }, n % 2 ? 'touch' : 'keys');
  if (!await start()) return report;
  const s0 = await st(); let ents0 = s0.ents, maxEnts = s0.ents, maxParts = 0, lastPos = null, stillT = 0, cleared = false;
  await page.evaluate(() => { window.__ap.on = true; });
  const tA = Date.now();
  while (Date.now() - tA < AUTO * 1000) {
    await sleep(250);
    const s = await st();
    if (s.scene === 'GameOverScene') { await page.evaluate(() => { window.BRADY.Save.data.lives = 9; }); await sleep(900); await page.evaluate(() => { const g = window.BRADY.Game.scene; if (g.btns) g.btns[0].fn(); }); continue; }
    if (s.scene !== 'Play') { if (s.scene === 'TourMapScene' || /Results|Story|Ending/.test(s.scene)) { cleared = true; break; } continue; }
    if (s.state === 'results' || s.state === 'tally' || s.state === 'clear') { cleared = true; break; }
    maxEnts = Math.max(maxEnts, s.ents); maxParts = Math.max(maxParts, s.parts);
    // a hard soft-lock: in play, but Brady out of play (portal, stuck) or the fade stuck, for 8 s
    const key = s.state + '|' + s.ps + '|' + s.x + '|' + s.y + '|' + s.area + '|' + s.fade;
    if (s.state === 'play' && !s.paused && key === lastPos) stillT += 0.25; else stillT = 0;
    lastPos = key;
    if (stillT > 8 && s.ps !== 'play') { fail(id, 'soft-lock: Brady frozen in state ' + s.ps + ' for 8 s', s); break; }
    if (stillT > 12) { fail(id, 'soft-lock: nothing moved for 12 s while input was held', s); break; }
  }
  await page.evaluate(() => { window.__ap.on = false; window.__in.release(); });
  await shot('1-auto');
  if (maxEnts > ents0 * 3 + 150) fail(id, 'runaway entities', { start: ents0, max: maxEnts });
  if (maxParts > 460) fail(id, 'runaway particles', { max: maxParts });
  report.phases.push({ auto: { cleared, maxEnts, maxParts } });
  await healthy('autopilot'); await checkErrors('autopilot');

  // ---------- 1b. powers: a jump power (socks / cake / beans), gear, the joint and the LSD tab (their trips), the
  //     power picker chip tapped and cycled from the keyboard, jumps in mid-air, THROW ----------
  if (!await start()) return report;
  const pw = await page.evaluate(n => {
    const B = window.BRADY, g = B.Game.scene, p = g.player, feet = ['socks', 'cake', 'beans'][n % 3], got = [];
    for (const k of ['gear:' + feet, 'gear:fins', 'mushroom', 'joint', 'lsd']) { try { p.collect(k); got.push(k); } catch (e) { got.push(k + ' threw ' + e.message); } }
    return { feet, got, picker: typeof TourPicker !== 'undefined' ? TourPicker.list(p) : null };
  }, n);
  report.powers = pw;
  const tP = Date.now();
  while (Date.now() - tP < (LONG ? 12000 : 6000)) {
    const s = await st();
    if (s.scene !== 'Play') { if (s.scene === 'GameOverScene') { if (!await start()) return report; } else break; }
    const r = Math.random();
    if (r < 0.35) { await page.evaluate(() => window.__in.set({ right: true, jump: true })); await sleep(120); await page.evaluate(() => window.__in.set({ right: true })); await sleep(120); await page.evaluate(() => window.__in.set({ right: true, jump: true })); await sleep(150); }
    else if (r < 0.55) await page.evaluate(() => window.__in.press('action'));
    else if (r < 0.7) await page.evaluate(() => { const c = typeof TourPicker !== 'undefined' && TourPicker.chip && TourPicker.chip(); if (c) window.__in.tap(c.x, c.y); });
    else if (r < 0.8) await page.keyboard.press(Math.random() < 0.5 ? 'KeyE' : 'Digit' + (1 + Math.floor(Math.random() * 3)));
    else if (r < 0.85) { await page.evaluate(() => window.__in.pause()); await sleep(300); await page.evaluate(() => window.__in.resume()); }
    else await page.evaluate(() => window.__in.set({ right: Math.random() < 0.7, left: Math.random() < 0.2, up: Math.random() < 0.2 }));
    await sleep(150);
  }
  await page.evaluate(() => window.__in.release());
  { const r = await waitFor(x => x.scene !== 'Play' || x.paused || ((x.ps === 'play' || x.ps === 'dying' || x.ps === 'clear') && x.fade === 0) || x.state !== 'play', 6000); if (!r.ok) fail(id, 'stuck after the powers phase', r.s); else if (r.s.paused) await page.evaluate(() => window.__in.resume()); }
  await shot('1b-powers');
  await healthy('powers'); await checkErrors('powers (' + pw.feet + ', fins, joint, LSD, picker)');

  // ---------- 2. every interactive thing in every area, on purpose ----------
  if (!await start()) return report;
  const nAreas = (await st()).areas;
  const done = new Set();
  for (let ai = 0; ai < nAreas; ai++) {
    // into the area through a door transition (the real enterPortal + fade + loadArea + atlas path)
    if ((await st()).area !== ai) {
      const ok = await page.evaluate(ai => {
        // enter where the level's own doors lead (else an anchor or a checkpoint); an area with no known way in is skipped
        const g = window.BRADY.Game.scene, a = g.level.areas[ai];
        let sp = null;
        for (const b of g.level.areas) for (const s of b.spawns) if (!sp && s.target && s.target.area === ai) sp = s.target;
        if (!sp) sp = a.anchors && (a.anchors.in || a.anchors.start || a.anchors.landing || Object.values(a.anchors)[0]);
        if (!sp) sp = a.spawns.find(s => s.type === 'checkpoint');
        if (!sp || g.player.dead || g.state !== 'play') return false;
        g.enterPortal({ kind: 'door', target: { area: ai, x: sp.x, y: sp.y } }); return true;
      }, ai);
      if (!ok) continue;
      const r = await waitFor(s => s.area === ai && s.fade === 0 && s.ps === 'play', 5000);
      if (!r.ok) { fail(id, 'area change to area ' + ai + ' never completed', r.s); if (!await start()) return report; continue; }
    }
    const targets = await page.evaluate(() => window.__targets());
    const cap = LONG ? 40 : 6;
    for (const tg of targets.slice(0, cap)) {
      const s = await st();
      if (s.scene !== 'Play') { if (!await start()) return report; break; }
      if (s.area !== ai) break;
      const sig = ai + ':' + tg.type + ':' + tg.x;
      if (done.has(sig)) continue; done.add(sig);
      if (tg.type === 'Gate') continue;   // the exit: done last
      const placed = await page.evaluate(k => window.__goTo(k), tg.k);
      if (!placed) continue;
      await sleep(200);
      const before = await st();
      if (/Portal|Curtain/.test(tg.type)) await page.evaluate(() => window.__in.press('up'));
      else if (/Trapdoor/.test(tg.type)) { await page.evaluate(() => window.__in.set({ down: true })); await sleep(700); await page.evaluate(() => window.__in.set({})); }
      else { await page.evaluate(() => window.__in.press('action')); await sleep(300); await page.evaluate(() => window.__in.press('up')); }
      await sleep(400);
      // whatever happened (a door, a lever, a hatch) must settle: back in play with the fade clear, within 5 s
      const r = await waitFor(x => x.scene !== 'Play' || (x.fade === 0 && (x.ps === 'play' || x.ps === 'dying') && x.state !== 'intro'), 5000);
      if (!r.ok) { fail(id, 'stuck after using ' + tg.type + ' in area ' + ai, { before, after: r.s }); if (!await start()) return report; break; }
      // and Brady must still answer the controls
      if (r.s.scene === 'Play' && r.s.ps === 'play') {
        await page.evaluate(() => window.__in.set({ jump: true })); await sleep(250); await page.evaluate(() => window.__in.set({})); await sleep(150);
        const a2 = await st();
        if (a2.scene === 'Play' && a2.ps === 'play' && a2.x === r.s.x && a2.y === r.s.y && a2.area === r.s.area) {
          await page.evaluate(() => window.__in.set({ left: true })); await sleep(400); await page.evaluate(() => window.__in.set({ right: true })); await sleep(400); await page.evaluate(() => window.__in.set({}));
          const a3 = await st(); if (a3.x === a2.x && a3.y === a2.y && a3.ps === 'play') fail(id, 'Brady does not respond to input after ' + tg.type, a3);
        }
      }
      if (r.s.scene !== 'Play' || r.s.ps === 'dying') { if (!await start()) return report; }
      else if (r.s.area !== ai) {   // a door took us elsewhere: come back to this area for the rest
        await page.evaluate(ai => { const g = window.BRADY.Game.scene, a = g.level.areas[ai], an = a.anchors && (a.anchors.in || a.anchors.start || Object.values(a.anchors)[0]) || { x: 112, y: (a.H - 3) * 32 }; g.enterPortal({ kind: 'door', target: { area: ai, x: an.x, y: an.y } }); }, ai);
        const b = await waitFor(x => x.area === ai && x.fade === 0 && x.ps === 'play', 5000);
        if (!b.ok) { fail(id, 'could not come back to area ' + ai, b.s); if (!await start()) return report; break; }
      }
    }
    await healthy('interactions in area ' + ai); await checkErrors('interactions in area ' + ai);
  }
  await shot('2-objects');

  // ---------- 3. carts and boats: ride to the end with the levers set both ways; fall into the water ----------
  for (const way of LONG ? [false, true] : [true]) {
    if (!await start()) return report;
    const ride = await page.evaluate(({ way, full }) => {
      const g = window.BRADY.Game.scene; let out = null;
      g.level.areas.forEach((a, ai) => { if (!out && (a.carrier || a.rail)) out = ai; });
      if (out == null) return null;
      if (g.area.idx !== out) return { area: out, skip: true };
      const cart = g.entities.find(e => e.carrier); if (!cart) return null;
      if (g.railState) for (let k = 0; k < 8; k++) g.railState[k] = way;
      if (!full) cart.x = Math.max(cart.x, cart.stopX - 26 * 32);
      const p = g.player; p.x = cart.x + cart.w / 2 - p.w / 2; p.y = cart.y - p.h - 1; p.vx = p.vy = 0;
      g.camX = Math.max(0, cart.x - 120);
      return { stopX: cart.stopX, x: cart.x, speed: cart.speed };
    }, { way, full: RIDE_FULL });
    if (!ride || ride.skip) break;
    const secs = (ride.stopX - ride.x) / ride.speed + 6;
    const t0 = Date.now(); let r;
    while (Date.now() - t0 < secs * 1000) {
      await sleep(400);
      r = await st();
      if (r.scene !== 'Play' || r.state !== 'play') break;
      // stay on the deck: step back toward the middle of the boat if he drifted
      await page.evaluate(() => { const g = window.BRADY.Game.scene, p = g.player, c = g.entities.find(e => e.carrier); if (!c || p.state !== 'play') return; const dx = c.x + c.w / 2 - p.cx; window.__in.set(Math.abs(dx) > 40 && p.ride === c ? (dx > 0 ? { right: true } : { left: true }) : {}); });
    }
    await page.evaluate(() => window.__in.release());
    const end = await st();
    if (end.scene === 'Play' && end.state === 'play' && end.ps === 'play') {
      // walk off onto the landing and through the exit
      await page.evaluate(() => window.__in.set({ right: true })); await sleep(3500); await page.evaluate(() => window.__in.release());
    }
    await shot('3-ride-' + (way ? 'up' : 'down'));
    await healthy('the ride'); await checkErrors('the ride (levers ' + (way ? 'up' : 'down') + ')');
    if (way === (LONG ? false : true)) {
      // fall into the water at a few points along the canal: each one costs a life and respawns
      for (const f of LONG ? [0.25, 0.6] : [0.6]) {
        if (!await start()) return report;
        await page.evaluate(f => { const g = window.BRADY.Game.scene, p = g.player, A = g.area; p.x = A.W * 32 * f; p.y = (A.H - 4) * 32; p.vx = p.vy = 0; g.camX = Math.max(0, p.x - 300); }, f);
        const d = await waitFor(s => s.scene !== 'Play' || s.state === 'dead' || s.state === 'dying', 4000);
        const back = await waitFor(s => s.scene === 'Play' && s.state === 'play' && s.ps === 'play' && s.fade === 0, 9000);
        if (!back.ok) fail(id, 'no respawn after falling into the water at ' + f, back.s);
      }
    }
  }

  // ---------- 4. die and respawn at every checkpoint ----------
  if (!await start()) return report;
  const cps = await page.evaluate(() => { const g = window.BRADY.Game.scene; const out = []; g.level.areas.forEach((a, ai) => a.spawns.forEach(s => { if (s.type === 'checkpoint') out.push({ ai, x: s.x, y: s.y }); })); return out; });
  for (const cp of cps.slice(0, LONG ? 6 : 1)) {
    if (!await start()) return report;
    await page.evaluate(cp => { const g = window.BRADY.Game.scene; g.checkpoint = { area: cp.ai, x: cp.x, y: cp.y }; g.player.die('pit'); }, cp);
    const back = await waitFor(s => s.scene === 'Play' && s.state === 'play' && s.ps === 'play' && s.fade === 0, 9000);
    if (!back.ok) { fail(id, 'no respawn at the checkpoint in area ' + cp.ai, back.s); continue; }
    if (back.s.area !== cp.ai) fail(id, 'respawned in the wrong area', { cp, s: back.s });
    await sleep(1500);
    const s = await st(); if (s.scene === 'Play' && s.state === 'dying') { /* a respawn into a hazard: report once */ fail(id, 'Brady dies right after respawning at the checkpoint in area ' + cp.ai, s); }
  }
  await shot('4-respawn');
  await healthy('respawns'); await checkErrors('respawns');

  // ---------- 5. pause / resume, rotate, background / foreground ----------
  if (!await start()) return report;
  await page.evaluate(() => window.__in.pause()); await sleep(400);
  let s = await st(); if (!s.paused) fail(id, 'the pause button did not pause', s);
  await page.evaluate(() => window.__in.resume()); await sleep(400);
  s = await st(); if (s.paused) fail(id, 'could not resume from the pause menu', s);
  const t1 = (await st()).t; await page.evaluate(() => window.__in.set({ right: true })); await sleep(600); await page.evaluate(() => window.__in.release());
  if ((await st()).t === t1) fail(id, 'the level does not run after resuming');
  const vp = page.viewportSize();
  await page.setViewportSize({ width: vp.height, height: vp.width }); await sleep(900);
  await page.evaluate(() => window.__in.set({ right: true, jump: true })); await sleep(700); await page.evaluate(() => window.__in.release());
  await shot('5-portrait');
  await page.setViewportSize(vp); await sleep(900);
  s = await st(); if (s.scene !== 'Play') fail(id, 'rotating the phone left the level', s);
  await healthy('rotation'); await checkErrors('rotation');
  await page.evaluate(() => { window.__soak.hiddenUntil = performance.now() + 2500; Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(1200);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  s = await st(); if (s.scene === 'Play' && !s.paused && s.state === 'play') fail(id, 'backgrounding the app did not pause it', s);
  await page.evaluate(() => window.__in.resume()); await sleep(500);
  s = await st(); if (s.paused) fail(id, 'could not resume after the app came back', s);
  await page.evaluate(() => window.__in.set({ right: true })); await sleep(800); await page.evaluate(() => window.__in.release());
  await healthy('background'); await checkErrors('pause / rotate / background');

  // ---------- 6. game over, continue; then the map and back ----------
  await page.evaluate(() => { window.BRADY.Save.data.lives = 1; window.BRADY.Game.scene.player.die('pit'); });
  let r = await waitFor(x => x.scene === 'GameOverScene', 8000);
  if (!r.ok) fail(id, 'no game over screen after the last life', r.s);
  else {
    await sleep(1000);
    await page.evaluate(() => { const g = window.BRADY.Game.scene, b = g.btns[0]; window.__in.tap(b.x + b.w / 2, b.y + b.h / 2); });
    r = await waitFor(x => x.scene === 'Play' && x.state === 'play' && x.fade === 0, 6000);
    if (!r.ok) fail(id, 'CONTINUE after a game over did not restart the level', r.s);
  }
  await page.evaluate(() => { const g = window.BRADY.Game.scene; if (g.openPause) g.openPause(); const b = g.pauseUI && g.pauseUI[2]; if (b) b.fn(); });
  r = await waitFor(x => x.scene === 'TourMapScene', 4000);
  if (!r.ok) fail(id, 'WORLD MAP from the pause menu did not reach the map', r.s);
  await sleep(1200);
  if (!await start()) return report;
  await page.evaluate(() => window.__in.set({ right: true })); await sleep(1000); await page.evaluate(() => window.__in.release());
  await healthy('map and back'); await checkErrors('game over / map / re-enter');

  // ---------- 7. the exit gate ----------
  if (!await start()) return report;
  const gate = await page.evaluate(() => { const g = window.BRADY.Game.scene, k = g.entities.findIndex(e => e.constructor.name === 'Gate'); return k; });
  if (gate >= 0) {
    await page.evaluate(k => { window.__goTo(k); }, gate);
    r = await waitFor(x => x.scene !== 'Play' || x.state === 'clear' || x.state === 'tally' || x.state === 'results', 4000);
    if (!r.ok) fail(id, 'touching the exit gate did not clear the level', r.s);
    else { const r2 = await waitFor(x => x.scene !== 'Play' || x.state === 'results', 9000); if (!r2.ok) fail(id, 'the level clear never reached the results', r2.s); }
  }
  await healthy('exit'); await checkErrors('the exit');
  report.ms = Date.now() - T0;
  return report;
}

(async () => {
  const srv = await serve();
  const url = 'http://127.0.0.1:' + srv.address().port + '/super-brady-o-world/index.html';
  const browser = await pw[engine].launch();
  const mk = async () => {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: engine !== 'firefox', hasTouch: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    page.__errs = [];
    page.on('pageerror', e => page.__errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') page.__errs.push('console: ' + m.text()); });
    await page.goto(url); await page.waitForTimeout(1500);
    await page.evaluate(pageSetup);
    return page;
  };
  const probe = await mk();
  // the safety net itself: an entity that throws in update / draw is removed (and counted), the game keeps running;
  // a door / respawn transition that throws half way does not leave a black screen
  {
    const r = await probe.evaluate(async () => {
      const B = window.BRADY, G = B.Game; B.Save.data.lives = 9; G.setScene(new B.Play(B.getLevel(1, 1), {}));
      await new Promise(r => setTimeout(r, 2200));
      const g = G.scene, p = g.player, e0 = window.__sbwErrors || 0;
      const bad = { x: p.x + 40, y: p.y, w: 20, h: 20, t: 0, remove: false, update() { throw new Error('soak: update'); }, draw() {} };
      const bad2 = { x: p.x + 60, y: p.y, w: 20, h: 20, t: 0, remove: false, update() {}, draw() { throw new Error('soak: draw'); } };
      g.entities.push(bad, bad2);
      const t0 = g.t; await new Promise(r => setTimeout(r, 600));
      const ok1 = { removed: !g.entities.includes(bad) && !g.entities.includes(bad2), counted: (window.__sbwErrors || 0) - e0, running: g.t > t0 + 0.3 };
      g.fadeTo(1, () => { throw new Error('soak: transition'); }, 6); p.state = 'portal';
      await new Promise(r => setTimeout(r, 900));
      const ok2 = { fade: g.fade.a, ps: g.player.state, scene: G.scene === g };
      G.errors = 0; window.__sbwErrors = 0; window.__bradyErrors = [];
      return { ok1, ok2 };
    });
    const ok = r.ok1.removed && r.ok1.counted >= 2 && r.ok1.running && r.ok2.fade < 0.05 && r.ok2.ps === 'play';
    if (ok) console.log('PASS the safety net removes a throwing entity, counts it, keeps the game running and recovers a broken transition');
    else fail('safety net', 'did not hold', r);
    probe.__errs.length = 0;
  }
  let ids = await probe.evaluate(() => window.BRADY_TOUR.Tour.allLevelIds());
  const v2 = await probe.evaluate(() => { const T = window.BRADY_TOUR.Tour; return T.allLevelIds().filter(id => { const s = T.specOf(id); return s && s.arch; }); });
  await probe.context().close();
  const lv = opt('--levels', LONG ? 'all' : 'rebuilt');
  if (lv === 'rebuilt') ids = v2; else if (lv !== 'all') ids = lv.split(',');
  console.log(`soak: ${ids.length} levels, ${engine}, ${LONG ? 'long' : 'short'} mode, ${JOBS} jobs, autopilot ${AUTO} s`);
  const queue = ids.slice(), t0 = Date.now();
  const worker = async () => {
    let page = await mk(), used = 0;
    while (queue.length) {
      const id = queue.shift();
      if (used++ >= 6) { await page.context().close(); page = await mk(); used = 1; }
      const mine = () => failures.filter(f => f.id === id).length;
      try { const rep = await soakLevel(page, id); console.log((mine() ? 'BAD  ' : 'ok   ') + id + '  ' + Math.round((rep.ms || 0) / 1000) + ' s  ' + JSON.stringify(rep.phases[0] || {})); }
      catch (e) { fail(id, 'harness error', String(e && e.stack || e).slice(0, 400)); try { await page.context().close(); } catch (e2) { /* gone */ } page = await mk(); used = 0; }
      const pe = page.__errs.splice(0).filter(m => !/favicon|ERR_FILE_NOT_FOUND|404/.test(m));
      if (pe.length) fail(id, 'page / console errors', pe.slice(0, 5));
    }
    await page.context().close();
  };
  await Promise.all(Array.from({ length: Math.min(JOBS, ids.length) }, worker));
  // a stopped loop or a slow frame while three browsers share the machine can be the machine: those levels are run
  // again alone, and only a repeat counts
  const timing = f => /main loop stopped|a frame took/.test(f.what);
  const retry = [...new Set(failures.map(f => f.id))].filter(id => failures.filter(f => f.id === id).every(timing));
  if (retry.length && JOBS > 1) {
    console.log('\nre-running alone (timing only): ' + retry.join(' '));
    for (const id of retry) for (let i = failures.length - 1; i >= 0; i--) if (failures[i].id === id) failures.splice(i, 1);
    queue.push(...retry); await worker();
  }
  await browser.close(); srv.close();
  console.log(`\n${ids.length} levels in ${Math.round((Date.now() - t0) / 1000)} s: ${failures.length ? failures.length + ' FAILURES' : 'all clean'}`);
  process.exit(failures.length ? 1 : 0);
})();
