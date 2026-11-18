// Long-session test for Super Brady-O World: Brady's "laggy after a couple of levels" and "glitchy after a few deaths
// and levels" on his iPhone. One browser page plays the same loop of steps several times in a row, like an evening of
// play, without reloading: a level, two deaths and respawns, the three trips (mushroom, joint, LSD tab), a trail on the
// floor and a death on it, a second land's level (the most inked props of any level, 4-1) with a death, a boss arena mid-fight with a death,
// a level cleared to the results and out to the map, the walkable overworld, and the title. After every step it
// records the frame cost (the REAL game loop: Game.frame timed, the raster flushed with a one-pixel read-back) at the
// same standing spots, and counts everything that could pile up:
//   - page: event listeners (net, by target), intervals, pending timeouts, requestAnimationFrame calls per frame,
//     canvases alive and their pixels (after a forced GC on Chromium; "not yet collected" on WebKit, which is what iOS
//     holds on to), canvases created, JS heap (Chromium), audio sources started but not ended, audio connections
//   - game (window.BRADY_SESSION.snapshot, src/16_session.js): backdrop / tile / ink / inked-prop / glow / post-effect
//     / overworld caches and their pixels, the vignette, entities, particles, weather, cached levels, atlases, faults
//   - carried-over state after a respawn or a new level: trip timers, the hurry tempo, power effects, touches, the
//     picker chip, slick / hot trail tiles left in the cached level
// It FAILS when, between the second repeat (the first one fills the caches) and the last, the frame cost of a step or
// any count grows past its tolerance, when state carries over a respawn, or on any error. A frame cost over its
// tolerance in the last repeat is measured again in one extra confirmation repeat and fails only if it is over again
// (growth stays; the WebKit raster spikes that land on a different step each run do not). Each cost also shows its
// "js" part: the game's own update and draw calls, before the browser rasterises them.
//
// usage: BRADY_DIST=<folder> node tools/sbw_session_test.js [--engine chromium|webkit] [--reps 4] [--ms 400]
//        [--spots 5] [--tol 1.3] [--out file.json] [--a 1-1] [--b 4-1] [--boss 1-5] [--quick] [--no-confirm]
//   (4-1: the level with the most inked props, src/30_tour_sprites.js InkCache)
//   Run it alone on a quiet machine (other suites running at the same time skew the frame costs).
//   Chromium (default) can force garbage collection, so its canvas and heap counts are exact; --engine webkit is the
//   Safari engine (its canvas counts include canvases not yet collected, with a wider tolerance).
const pw = require('playwright');
const { silence } = require('./sbw_silent');   // no game music out of the Mac's speakers
const path = require('path'), fs = require('fs'), http = require('http');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = k => args.includes(k);
const QUICK = has('--quick');
const engine = opt('--engine', 'chromium');
const REPS = +opt('--reps', QUICK ? 3 : 4);
const MS = +opt('--ms', QUICK ? 250 : 400);
const SPOTS = +opt('--spots', QUICK ? 3 : 5);
const TOL = +opt('--tol', process.env.SESSION_TOL || 1.3);
const OUT = opt('--out', null);
const LV_A = opt('--a', '1-1'), LV_B = opt('--b', '4-1'), LV_BOSS = opt('--boss', '1-5');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const root = path.join(dist, 'site');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function serve(root) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.txt': 'text/plain' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(root, path.normalize(p));
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

/* ---------------- before the game boots: page-level counters ---------------- */
function initScript() {
  const S = window.__sess = { canvases: [], created: 0, listeners: 0, byTarget: {}, intervals: new Set(), timeouts: new Set(), raf: 0, audioStarted: 0, audioEnded: 0, connects: 0, disconnects: 0 };
  const ET = EventTarget.prototype, add0 = ET.addEventListener, rem0 = ET.removeEventListener;
  const reg = new WeakMap();
  const kind = t => t === window ? 'window' : t === document ? 'document' : (t && t.tagName) ? t.tagName.toLowerCase() : (t && t.constructor && t.constructor.name) || '?';
  ET.addEventListener = function (type, fn, o) {
    if (fn) { let m = reg.get(this); if (!m) { m = new Map(); reg.set(this, m); } let s = m.get(type); if (!s) { s = new Set(); m.set(type, s); } if (!s.has(fn)) { s.add(fn); S.listeners++; const k = kind(this) + ':' + type; S.byTarget[k] = (S.byTarget[k] || 0) + 1; } }
    return add0.call(this, type, fn, o);
  };
  ET.removeEventListener = function (type, fn, o) {
    const m = reg.get(this), s = m && m.get(type); if (s && s.delete(fn)) { S.listeners--; const k = kind(this) + ':' + type; S.byTarget[k]--; }
    return rem0.call(this, type, fn, o);
  };
  S.addRaw = (t, type, fn) => add0.call(t, type, fn);   // the harness's own listeners are not counted
  const si = window.setInterval, ci = window.clearInterval, st = window.setTimeout, ct = window.clearTimeout;
  window.setInterval = function (fn, ms) { const id = si.apply(window, arguments); S.intervals.add(id); return id; };
  window.clearInterval = function (id) { S.intervals.delete(id); return ci.call(window, id); };
  window.setTimeout = function (fn, ms) { let id; const f = typeof fn === 'function' ? function () { S.timeouts.delete(id); return fn.apply(this, arguments); } : fn; id = st.call(window, f, ms); S.timeouts.add(id); return id; };
  window.clearTimeout = function (id) { S.timeouts.delete(id); return ct.call(window, id); };
  S.rawTimeout = st; S.rawInterval = si; S.rawClearInterval = ci;
  const raf = window.requestAnimationFrame;
  window.requestAnimationFrame = function (fn) { S.raf++; return raf.call(window, fn); };
  const ce = Document.prototype.createElement;
  Document.prototype.createElement = function (n, o) { const el = ce.call(this, n, o); if (String(n).toLowerCase() === 'canvas') { S.created++; S.canvases.push(new WeakRef(el)); } return el; };
  try {
    const SP = AudioScheduledSourceNode.prototype, start0 = SP.start;
    SP.start = function () { S.audioStarted++; add0.call(this, 'ended', () => { S.audioEnded++; }); return start0.apply(this, arguments); };
    const AP = AudioNode.prototype, c0 = AP.connect, d0 = AP.disconnect;
    // audio nodes with outgoing connections still in place (a node connects to several targets and is let go with
    // one disconnect(), so the counts of the calls themselves say nothing)
    S.linked = new Set();
    AP.connect = function () { S.connects++; S.linked.add(this); return c0.apply(this, arguments); };
    AP.disconnect = function () { S.disconnects++; if (!arguments.length) S.linked.delete(this); return d0.apply(this, arguments); };
  } catch (e) { /* no Web Audio */ }
}

/* ---------------- in the page: steps, measurement, counts ---------------- */
function pageSetup() {
  const B = window.BRADY, G = B.Game, S = window.__sess, ST = window.BRADY_SESSION, TT = window.BRADY_TOUR, TS = B.TS, SOLID = B.SOLID, T = B.T;
  if (!ST) throw new Error('this build has no window.BRADY_SESSION (src/16_session.js)');
  const P = window.__ses = {};
  const wait = ms => new Promise(r => S.rawTimeout.call(window, r, ms));
  P.seed = n => { let a = (n >>> 0) || 1; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // pin the look: no tier changes or resolution drops in the middle of a run
  P.pin = () => { G.slowT = -1e9; G.lowered = 0; if (B.QualityTier && B.QualityTier.pin) B.QualityTier.pin(0); };
  // ---- frame cost: Game.frame timed with the raster flushed (one pixel read back) ----
  // (js: the frame before the flush, the game's own update and draw calls; the rest of the cost is the browser
  // rasterising them, which on WebKit runs in its GPU process and swings with whatever else that process and the Mac do)
  let rec = null, recJs = null; const f0 = G.frame; let frames = 0, rafAtFrame = 0, rafPerFrame = [];
  G.frame = function (t) {
    const a = performance.now(); f0.call(this, t); frames++;
    if (rec) { const b = performance.now(); G.ctx.getImageData(0, 0, 1, 1); rec.push(performance.now() - a); recJs.push(b - a); rafPerFrame.push(S.raf - rafAtFrame); }
    rafAtFrame = S.raf;
  };
  const stats = arr => { if (!arr.length) return null; const s = arr.slice().sort((x, y) => x - y), q = k => s[Math.min(s.length - 1, Math.floor(k * s.length))]; return { mean: +(arr.reduce((x, y) => x + y, 0) / arr.length).toFixed(3), p50: +q(0.5).toFixed(3), p95: +q(0.95).toFixed(3), n: arr.length }; };
  P.measure = async ms => { rec = []; recJs = []; rafPerFrame = []; await wait(ms); const r = rec, rj = recJs; rec = null; recJs = null; const rp = rafPerFrame.length ? rafPerFrame.reduce((x, y) => x + y, 0) / rafPerFrame.length : 0; const cost = stats(r); if (cost) cost.js = stats(rj).mean; return { cost, rafPerFrame: +rp.toFixed(2) }; };
  // ---- god mode for the measured windows, and a real death when asked ----
  P.god = g => { const p = g && g.player; if (!p || p.__god) return; p.__god = true; p.hurt = function () {}; p.die = function () {}; };
  P.mortal = g => { const p = g && g.player; if (p) { delete p.hurt; delete p.die; p.__god = false; } };
  P.waitAtlases = async ms => { const A = B.Atlas; if (!A) return; const t0 = performance.now(); while (performance.now() - t0 < ms) { if (!Object.keys(A.pending).length) return; await wait(50); } };
  P.waitFor = async (fn, ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { try { if (fn()) return true; } catch (e) { /* not yet */ } await wait(50); } return false; };
  P.playing = () => G.scene instanceof B.Play && G.scene.state === 'play' && G.scene.player && G.scene.player.state === 'play' && G.scene.fade.a < 0.01;
  // standing spots: one per view-sized cell of the area, a fixed number spread over it
  P.spots = (A, max) => {
    const W = A.W, H = A.H, t = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : A.tiles[y * W + x], solid = id => !!SOLID[id];
    const cw = Math.max(8, Math.floor(G.viewW / TS * 0.9)), ch = Math.max(6, Math.floor(G.rows * 0.9)), out = [];
    for (let cy = 0; cy < H; cy += ch) for (let cx = 0; cx < W; cx += cw) {
      let best = null, bd = 1e9; const mx = cx + cw / 2, my = cy + ch * 0.7;
      for (let y = cy; y < Math.min(H - 1, cy + ch); y++) for (let x = cx; x < Math.min(W, cx + cw); x++) {
        const below = t(x, y + 1), stand = !solid(t(x, y)) && !solid(t(x, y - 1)) && (solid(below) || below === T.SEMI) && t(x, y) !== T.WATER && t(x, y) !== T.LAVA;
        if (!stand) continue; const d = Math.abs(x - mx) + Math.abs(y - my) * 1.5; if (d < bd) { bd = d; best = { x, y }; }
      }
      if (best) out.push(best);
    }
    out.sort((a, b) => a.x - b.x || a.y - b.y);
    if (out.length <= max) return out;
    const r = []; for (let i = 0; i < max; i++) r.push(out[Math.floor(i * out.length / max)]); return r;
  };
  P.place = (g, s) => { const p = g.player; p.x = s.x * TS + TS / 2 - p.w / 2; p.y = (s.y + 1) * TS - p.h - 0.5; p.vx = 0; p.vy = 0; p.ride = null; g.camX = Math.max(0, Math.min(g.area.W * TS - G.viewW, p.cx - G.viewW * 0.4)); g.camY = g.camTargetY(true); };
  // the frame cost of the current level at the same spots every time (Brady standing, can't be hurt)
  P.measureLevel = async (o, seed) => {
    const g = G.scene; if (!(g instanceof B.Play)) return { error: 'not in a level: ' + (g && g.constructor.name) };
    P.god(g); P.seed(seed);
    const sp = P.spots(g.area, o.spots), all = [], raf = [], js = [];
    for (const s of sp) { if (G.scene !== g) break; P.place(g, s); await wait(120); const m = await P.measure(o.ms); if (m.cost) { all.push(m.cost.mean); js.push(m.cost.js); raf.push(m.rafPerFrame); } }
    if (!all.length && G.scene === g) { const m = await P.measure(o.ms); if (m.cost) { all.push(m.cost.mean); js.push(m.cost.js); raf.push(m.rafPerFrame); } }   // no standing spot in this area: where he is
    if (!all.length) return { error: 'no frames', spots: sp.length, area: g.area && g.area.idx };
    const s2 = all.slice().sort((x, y) => x - y);
    return { cost: { mean: +(all.reduce((x, y) => x + y, 0) / all.length).toFixed(3), js: +(js.reduce((x, y) => x + y, 0) / js.length).toFixed(3), p50: s2[Math.floor(s2.length / 2)], max: s2[s2.length - 1], spots: all.length }, rafPerFrame: +(raf.reduce((x, y) => x + y, 0) / raf.length).toFixed(2) };
  };
  // ---- counts ----
  P.counts = async () => {
    if (window.gc) { window.gc(); window.gc(); }
    await wait(30);
    let live = 0, px = 0, keep = [];
    for (const w of S.canvases) { const c = w.deref(); if (!c) continue; keep.push(w); const a = c.width * c.height; if (a > 1) { live++; px += a; } }
    S.canvases = keep;
    const m = performance.memory;
    const page = { listeners: S.listeners, intervals: S.intervals.size, timeouts: S.timeouts.size, canvasesLive: live, canvasesMP: +(px / 1e6).toFixed(3), canvasesCreated: S.created,
      heapMB: m ? +(m.usedJSHeapSize / 1048576).toFixed(1) : null, audioLive: S.audioStarted - S.audioEnded, audioStarted: S.audioStarted, audioNodes: S.linked ? S.linked.size : null };
    const top = Object.entries(S.byTarget).filter(([, v]) => v).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return { page, game: ST.snapshot(), listenersBy: Object.fromEntries(top) };
  };
  // ---- scenes ----
  P.startLevel = async (id, opts) => {
    B.Save.data.lives = 9; P.pin();
    const [w, i] = id.split('-').map(Number);
    G.setScene(new B.Play(B.getLevel(w, i), opts || {}));
    await P.waitAtlases(5000);
    return P.waitFor(P.playing, 6000);
  };
  // a real death: Brady mortal again, killed, the respawn awaited (a new Play at the checkpoint)
  P.die = async () => {
    const g0 = G.scene; if (!(g0 instanceof B.Play)) return { error: 'not in a level' };
    B.Save.data.lives = 9; P.mortal(g0);
    g0.player.die('pit');
    const ok = await P.waitFor(() => G.scene !== g0 && P.playing(), 9000);
    return ok ? { ok } : { error: 'no respawn', scene: G.scene && G.scene.constructor.name, state: G.scene && G.scene.state };
  };
  // the three trips back to back, each run to its end (the LSD flight cut short), then Brady's state checked
  P.trips = async o => {
    const g = G.scene; if (!(g instanceof B.Play)) return { error: 'not in a level' };
    P.god(g); const p = g.player, got = [], during = {};
    for (const k of ['mushroom', 'joint', 'lsd']) {
      try { p.collect(k); got.push(k); } catch (e) { got.push(k + ' threw ' + e.message); }
      await wait(600);
      const m = await P.measure(o.ms); during[k] = m.cost ? m.cost.mean : null;
      if (k === 'lsd' && p.lsdT > 1.5) p.lsdT = 1.5;
      await P.waitFor(() => !(g.dizzy > 0) && !(g.tripJoint > 0) && !(p.lsdT > 0) && !(g.lsdK > 0.001), 12000);
    }
    return { got, during };
  };
  // a slime trail laid under Brady, then a death on it: the respawned level must not keep the slick tiles
  P.trailDeath = async () => {
    const g = G.scene; if (!(g instanceof B.Play)) return { error: 'not in a level' };
    const n = ST.layTrail(g, 'coffee', 3);
    const d = await P.die();
    return Object.assign({ laid: n }, d);
  };
  // a boss arena, mid-fight (the boss can't be beaten)
  P.boss = async (id, o) => {
    if (!await P.startLevel(id)) return { error: 'level never started' };
    const g = G.scene, ET = window.BRADY_TYPES || B.ENTITY_TYPES || {};
    const k = g.level.areas.findIndex(a => a.role === 'arena' || a.spawns.some(s => s.type === 'boss' || (ET[s.type] && ET[s.type].prototype && ET[s.type].prototype.boss)));
    if (k >= 0 && g.area.idx !== k) { const a = g.level.areas[k], an = (a.anchors && (a.anchors.in || a.anchors.start)) || { x: 3 * TS + 16, y: (a.H - 4) * TS }; g.loadArea(k, an.x, an.y, 1); g.fade.a = 0; g.fade.target = 0; g.fade.cb = null; await P.waitAtlases(4000); }
    const b = g.entities.find(e => e.boss && !e.remove); if (!b) return { error: 'no boss' };
    P.god(g);
    const p = g.player; p.x = (b.arenaX0 != null ? b.arenaX0 : b.x - 300) + 64; p.y = (b.floorY || b.y + b.h) - p.h - 4; p.vy = 0;
    const hit0 = b.hit; b.hit = function () { const r = hit0.apply(this, arguments); if (this.hp < 1.5) this.hp = Math.max(1.5, this.maxHp * 0.5); if (this.state === 'dying') { this.state = 'fight'; this.timer = 0; } return r; };
    await wait(2500); if (b.state === 'sleep' || b.state === 'intro') b.state = 'fight';
    const m = await P.measure(o.ms * 4);
    // a checkpoint at the arena door, so the death respawns into the fight like a player's would
    g.setCheckpoint(p.x, p.y + p.h);
    return { cost: m.cost, rows: +G.rows.toFixed(2), bossState: b.state };
  };
  // the level cleared: the clear walk, the tally, the results, then MAP (as the button does)
  P.clearToMap = async () => {
    const g = G.scene; if (!(g instanceof B.Play)) return { error: 'not in a level' };
    const p = g.player; g.levelClear({ cx: p.cx + 40, x: p.cx + 30, y: p.y, w: 20, h: 64, exitKey: 'main', secret: false });
    const ok = await P.waitFor(() => g.state === 'results' || g.state === 'tally', 9000);
    if (g.state === 'tally') { g.tally.time = 0; await P.waitFor(() => g.state === 'results', 4000); }
    g.goNext(null);
    const ok2 = await P.waitFor(() => G.scene && /Map/.test(G.scene.constructor.name), 4000);
    return { ok: ok && ok2, scene: G.scene && G.scene.constructor.name };
  };
  // the map: let any reveal play out, then walk around (keyboard), measured
  P.map = async o => {
    const m0 = G.scene; if (!m0 || !/Map/.test(m0.constructor.name)) return { error: 'not on the map' };
    m0.card = null; await wait(1500); m0.card = null;
    const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true, cancelable: true }));
    let stop = false; const walk = async () => { const ks = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown']; let i = 0; while (!stop) { const k = ks[i++ % 4]; key(k, true); await wait(300); key(k, false); await wait(100); } };
    const w = walk(); const m = await P.measure(o.ms * 3); stop = true; await w;
    return { cost: m.cost, mode: m0.mode, ow: !!m0.ow, paintMs: m0.ow && m0.ow.paintMs != null ? +m0.ow.paintMs.toFixed(1) : null };
  };
  P.title = async () => { if (!B.appHomeScene) return { skip: true }; G.setScene(B.appHomeScene()); await wait(1200); const m = await P.measure(300); return { cost: m.cost, scene: G.scene && G.scene.constructor.name }; };
}

/* ---------------- the session ---------------- */
// counts that must not grow from the second repeat to the last: [key, relative slack, absolute slack]
const WATCH = [
  ['page.listeners', 0, 0], ['page.intervals', 0, 1], ['page.timeouts', 0, 6], ['page.canvasesLive', 0.1, 6], ['page.canvasesMP', 0.1, 1.5],
  ['page.heapMB', 0.2, 6], ['page.audioLive', 0.5, 40], ['page.audioNodes', 0.5, 150],
  ['game.bgEntries', 0, 0], ['game.bgMP', 0.05, 0.5], ['game.tileEntries', 0, 0], ['game.tilesMP', 0.05, 0.2],
  ['game.inkScratch', 0.25, 20], ['game.inkScratchMP', 0.1, 0.5], ['game.inkHeld', 0.25, 20], ['game.inkHeldMP', 0.1, 0.5], ['game.inkMemoMP', 0.3, 0.4],   // (the memo's entry count is not watched: it fills slowly toward its fixed 2 MP budget, Ink.memoBudget, as sway angles and zooms are first seen; its pixels are, below)
 
  ['game.inkBoxes', 0.25, 30], ['game.inkReach', 0, 4], ['game.inkCache', 0.1, 4], ['game.inkCacheMP', 0.1, 0.5], ['game.glows', 0, 4], ['game.postfxMP', 0.05, 0.2],
  ['game.owCacheMP', 0.05, 0.5], ['game.vignetteMP', 0, 0.01], ['game.spriteCache', 0, 2], ['game.levelCache', 0, 0], ['game.atlases', 0, 1], ['game.atlasListeners', 0, 0],
  ['game.mapTaps', 0, 0], ['game.faultKinds', 0, 0], ['game.errors', 0, 0], ['game.rtAreas', 0, 1], ['game.ents', 0.3, 15], ['game.parts', 0.5, 60]
];
// state that must be clear right after a respawn or a level start
const CLEAN = s => {
  const g = s.game, bad = [];
  if (g.dizzy > 0) bad.push('mushroom timer ' + g.dizzy); if (g.lsdK > 0.01) bad.push('LSD level ' + g.lsdK); if (g.tripJoint > 0) bad.push('joint timer ' + g.tripJoint);
  if (g.trip > 0.01) bad.push('trip ' + g.trip); if (g.hurry) bad.push('hurry tempo'); if (g.fx) bad.push('effects ' + g.fx); if (g.stuckSurf) bad.push(g.stuckSurf + ' trail tiles left in the cached level');
  if (g.pickerHeld) bad.push('picker chip held'); if (g.touches) bad.push(g.touches + ' touches held'); if (g.inkBlots) bad.push(g.inkBlots + ' ink blots');
  return bad;
};
const get = (o, k) => k.split('.').reduce((a, q) => a == null ? a : a[q], o);
// the cost of a step in repeat `last` against the earlier repeats (repeat 1 fills the caches): a spike is over the
// tolerance of every earlier repeat; growth is rising from repeat to repeat and 12 % over the earlier median
function costBad(series, first, last, tol) {
  const cb = series[last], ca = series[first]; if (cb == null || ca == null) return false;
  const mid = series.slice(first, last).filter(v => v != null), base = mid.length ? Math.max(...mid) : ca;
  const early = series.slice(0, last).filter(v => v != null).sort((x, y) => x - y), f0 = early.length ? early[Math.floor(early.length / 2)] : ca;   // (the median of the earlier repeats: one quiet repeat is not a baseline)
  const rising = series.slice(first, last + 1).every((v, k, q) => k === 0 || (v != null && q[k - 1] != null && v > q[k - 1] * 1.03));
  return cb > base * tol + 0.5 || (rising && last + 1 - first >= 3 && cb > f0 * 1.12 + 0.3);
}

async function main() {
  const srv = await serve(root), url = 'http://127.0.0.1:' + srv.address().port + '/super-brady-o-world/index.html';
  const launchArgs = engine === 'chromium' ? ['--js-flags=--expose-gc', '--enable-precise-memory-info', '--autoplay-policy=no-user-gesture-required'] : [];
  const browser = await pw[engine].launch({ args: launchArgs });
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: engine !== 'firefox', hasTouch: true, serviceWorkers: 'block' });
  await silence(ctx);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_FILE/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.addInitScript(initScript);
  await page.goto(url); await page.waitForTimeout(1800);
  await page.evaluate(pageSetup);
  // unlock the audio like a first tap (the music and sound effects then run as on the phone)
  await page.evaluate(() => { try { window.BRADY.Sound.unlock(); } catch (e) { /* none */ } });
  const o = { ms: MS, spots: SPOTS, a: LV_A, b: LV_B, boss: LV_BOSS };   // (travels into the page with every step)
  console.log(`session: ${engine}, ${REPS} repeats, levels ${LV_A} and ${LV_B}, boss ${LV_BOSS}, ${SPOTS} spots x ${MS} ms, tolerance ${TOL}x`);
  const failures = [];
  const fail = (what, info) => { failures.push(what + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 500) : '')); console.log('FAIL ' + what + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 500) : '')); };
  const steps = {};   // name -> [per repeat { cost, counts, info }]
  const step = async (rep, name, fn, clean) => {
    const t0 = Date.now(); let info = null;
    try { info = await page.evaluate(fn, o); } catch (e) { info = { error: String(e.message || e).slice(0, 300) }; }
    let counts; try { counts = await page.evaluate(() => window.__ses.counts()); } catch (e) { counts = { page: {}, game: {} }; fail(`repeat ${rep + 1} ${name}: the counts could not be read: ` + String(e.message || e).slice(0, 200)); }
    const r = { info, counts, secs: (Date.now() - t0) / 1000 };
    (steps[name] = steps[name] || [])[rep] = r;
    if (info && info.error) fail(`repeat ${rep + 1} ${name}: ${info.error}`, info);
    if (clean) { const bad = CLEAN(counts); if (bad.length) fail(`repeat ${rep + 1} ${name}: state carried over: ${bad.join(', ')}`); }
    // the same level again right after: every inked prop it shows is already cached, none may be baked again
    if (name === 'B death' && steps['B start'] && steps['B start'][rep]) {
      const d = (counts.game.inkCacheBakes || 0) - (steps['B start'][rep].counts.game.inkCacheBakes || 0);
      r.rebakes = d; if (d > 0) fail(`repeat ${rep + 1} ${name}: ${d} inked props baked again (the prop cache dropped pictures still in use)`);
    }
    const c = info && info.cost, g = counts.game, pg = counts.page;
    console.log(`  ${String(rep + 1).padStart(2)} ${name.padEnd(13)} ${c ? 'cost ' + String(c.mean).padStart(6) + ' ms (js ' + (c.js == null ? '-' : c.js.toFixed(2)) + ')' : '                         '}  canvases ${String(pg.canvasesLive).padStart(4)} ${String(pg.canvasesMP).padStart(7)} MP  listeners ${pg.listeners}  timers ${pg.intervals}/${pg.timeouts}  heap ${pg.heapMB}  audio ${pg.audioLive}/${pg.audioNodes}  bg ${g.bgEntries}/${g.bgMP}  tiles ${g.tileEntries}  ink ${g.inkScratch}/${g.inkHeld}/${g.inkCache}  glows ${g.glows}  ents ${g.ents == null ? '-' : g.ents}`);
    return r;
  };
  const playRepeat = async (rep, label) => {
    console.log(label || `repeat ${rep + 1}`);
    await step(rep, 'A start', async o => { const P = window.__ses; if (!await P.startLevel(o.a)) return { error: 'level never started' }; return P.measureLevel(o, 1); }, true);
    await step(rep, 'A death 1', async o => { const P = window.__ses, d = await P.die(); if (d.error) return d; return P.measureLevel(o, 1); }, true);
    await step(rep, 'A death 2', async o => { const P = window.__ses, d = await P.die(); if (d.error) return d; return P.measureLevel(o, 1); }, true);
    await step(rep, 'A trips', async o => { const P = window.__ses, t = await P.trips(o); if (t.error) return t; const m = await P.measureLevel(o, 1); return Object.assign(m, { trips: t }); });
    await step(rep, 'A trip death', async o => { const P = window.__ses, d = await P.die(); if (d.error) return d; return P.measureLevel(o, 1); }, true);
    await step(rep, 'A trail death', async o => { const P = window.__ses, d = await P.trailDeath(); if (d.error) return d; return Object.assign(await P.measureLevel(o, 1), { laid: d.laid }); }, true);
    await step(rep, 'B start', async o => { const P = window.__ses; if (!await P.startLevel(o.b)) return { error: 'level never started' }; return P.measureLevel(o, 2); }, true);
    await step(rep, 'B death', async o => { const P = window.__ses, d = await P.die(); if (d.error) return d; return P.measureLevel(o, 2); }, true);
    await step(rep, 'boss', async o => window.__ses.boss(o.boss, o));
    await step(rep, 'boss death', async o => { const P = window.__ses, d = await P.die(); if (d.error) return d; await new Promise(r => setTimeout(r, 1500)); const m = await P.measure(o.ms * 3); return { cost: m.cost }; }, true);
    await step(rep, 'A to map', async o => { const P = window.__ses; if (!await P.startLevel(o.a)) return { error: 'level never started' }; return P.clearToMap(); });
    await step(rep, 'map', async o => window.__ses.map(o));
    await step(rep, 'title', async o => window.__ses.title());
  };
  for (let rep = 0; rep < REPS; rep++) await playRepeat(rep);
  // A step's frame cost over its tolerance in the last repeat is checked once more by a confirmation repeat: growth
  // stays, while a one-off spike does not (on WebKit the raster runs in the browser's GPU process, and its memory
  // clean-ups and the Mac's other work lift a whole step now and then, landing on a different step each run;
  // see docs/PERFORMANCE.md, "Long sessions").
  const R = REPS, first = R >= 3 ? 1 : 0, last = R - 1;
  const costSeries = name => steps[name].slice(0, R).map(r => r && r.info && r.info.cost ? r.info.cost.mean : null);
  const spiked = Object.keys(steps).filter(name => { const q = costSeries(name); return q[first] != null && q[last] != null && costBad(q, first, last, TOL); });
  let confirmed = false;
  if (spiked.length && !has('--no-confirm')) { await playRepeat(R, `confirmation repeat (the cost of ${spiked.join(', ')} was over its tolerance in repeat ${R})`); confirmed = true; }
  // the speakers stayed silent (tools/sbw_silent.js): every real audio context's output went through a gain of 0
  const quiet = await page.evaluate(() => window.__sbwSilent ? window.__sbwSilent.report() : null).catch(() => null);
  if (process.env.BRADY_SOUND !== '1' && quiet && quiet.gains.some(g => g !== 0)) fail('sound reached the speakers', quiet);
  await browser.close(); srv.close();

  /* ---------------- the verdict ---------------- */
  console.log(`\ntrend: repeat ${first + 1} -> repeat ${last + 1} (repeat 1 fills the caches)`);
  for (const name in steps) {
    const a = steps[name][first], b = steps[name][last]; if (!a || !b) continue;
    const ca = a.info && a.info.cost, cb = b.info && b.info.cost;
    if (ca && cb) {
      // a load spike on this shared Mac lifts one repeat; growth lifts every repeat after the first: the cost fails when
      // the last repeat is over the tolerance of the best earlier one AND the repeats before it were already rising
      const series = costSeries(name);
      const early = series.slice(0, last).filter(v => v != null).sort((x, y) => x - y), f0 = early.length ? early[Math.floor(early.length / 2)] : ca.mean;
      const ratio = cb.mean / f0;
      let bad = costBad(series, first, last, TOL), note = '';
      const js = steps[name].slice(0, R).map(r => r && r.info && r.info.cost && r.info.cost.js != null ? r.info.cost.js.toFixed(2) : '-').join(' -> ');
      // the confirmation repeat stands in for the spiked one: the step fails only if it is over the tolerance again
      const cr = confirmed && steps[name][R], cc = cr && cr.info && cr.info.cost;
      if (bad && confirmed) {
        const q2 = series.slice(0, last).concat([cc ? cc.mean : null]);
        bad = !cc || costBad(q2, first, last, TOL);
        note = cc ? `; confirmation repeat ${cc.mean.toFixed(2)} ms (js ${cc.js != null ? cc.js.toFixed(2) : '-'}): ${bad ? 'still over' : 'a one-off spike'}` : '; no confirmation measurement';
      }
      console.log(`  ${bad ? 'FAIL' : 'ok  '} ${name.padEnd(13)} cost ${series.map(v => v == null ? '-' : v.toFixed(2)).join(' -> ')} ms (${ratio.toFixed(2)}x; js ${js})${note}`);
      if (bad) fail(`${name}: frame cost grows over the session`, confirmed && cc ? series.concat([cc.mean]) : series);
      if (b.info.rafPerFrame > 1.5) fail(`${name}: ${b.info.rafPerFrame} requestAnimationFrame calls per frame (an extra loop)`);
    }
    for (const [k, rel, abs] of WATCH) {
      const va = get(a.counts, k), vb = get(b.counts, k);
      if (typeof va !== 'number' || typeof vb !== 'number') continue;
      if (engine === 'webkit' && k === 'page.canvasesLive') continue;   // WebKit has no forced GC: the count includes garbage
      const tolK = engine === 'webkit' && k.startsWith('page.canvases') ? 2 : 1;   // WebKit: pixels of not-yet-collected canvases count too
      if (vb > va * (1 + rel * tolK) + abs * tolK) fail(`${name}: ${k} grows ${va} -> ${vb}`, steps[name].map(r => r && get(r.counts, k)));
    }
  }
  // caches with a fixed pixel budget stay inside it (src/06a_ink.js Ink.memoBudget 2 MP, scratch 4 MP, held 3 MP)
  for (const name in steps) for (const r of steps[name]) { const g = r && r.counts && r.counts.game; if (!g) continue;
    if (g.inkMemoMP > 2.5 || g.inkScratchMP > 4.5 || g.inkHeldMP > 3.5) { fail(`${name}: an ink cache is over its pixel budget`, { memo: g.inkMemoMP, scratch: g.inkScratchMP, held: g.inkHeldMP }); break; } }
  // the whole session: the sum of the level steps' costs per repeat
  const sums = []; for (let r = 0; r < R; r++) { let s = 0, n = 0; for (const name in steps) { const c = steps[name][r] && steps[name][r].info && steps[name][r].info.cost; if (c) { s += c.mean; n++; } } sums.push(n ? s / n : null); }
  console.log('  mean step cost per repeat: ' + sums.map(v => v == null ? '-' : v.toFixed(2)).join(' -> ') + ' ms');
  const sRise = sums.slice(first).every((v, k, q) => k === 0 || (v != null && q[k - 1] != null && v > q[k - 1] * 1.02));
  if (sums[first] && sums[last] && sRise && sums[last] > sums[first] * Math.min(TOL, 1.15) + 0.3) fail('the session as a whole gets slower', sums);
  if (errs.length) fail('page errors', errs.slice(0, 5));
  if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify({ meta: { engine, reps: R, confirmed, ms: MS, spots: SPOTS, tol: TOL, a: LV_A, b: LV_B, boss: LV_BOSS, date: new Date().toISOString() }, steps, sums, failures }, null, 1)); console.log('wrote ' + OUT); }
  console.log(failures.length ? `\n${failures.length} PROBLEM(S)` : '\nsession clean: nothing piles up');
  process.exit(failures.length ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
