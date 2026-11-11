// Performance harness for Super Brady-O World: runs the REAL game loop (requestAnimationFrame, the fixed-step
// accumulator, drawing) of every level, every boss arena mid-fight, every land's walkable overworld and the route map
// in an iPhone-sized landscape browser (844 x 390 pt @3x, touch), and records per scenario:
//   frame time (JS cost of one Game.frame: mean, p95, p99, max), the time in update vs draw, the frame interval,
//   and from a short instrumented window: Ink passes, drawImage calls and the device pixels they cover, fillRect
//   pixels, fillText / strokeText calls, gradients, getImageData / putImageData, canvases created, particles, weather,
//   entities updated / drawn, JS heap growth and allocation rate, and a breakdown of the draw time by painter
//   (backdrop, decor, tiles, each entity class, Ink, post effects, HUD...).
// Brady is placed at evenly spread standing spots over every area (a grid of view-sized cells), cannot be hurt, and is
// driven by a keyboard autopilot (run, jump, act) while the frames are measured, so every part of a level is on screen
// at some point. Math.random is seeded per scenario.
//
// HEADLESS NUMBERS ARE NOT IPHONE NUMBERS. Use them to rank scenarios and for before/after ratios. Chromium can run
// with the GPU (ANGLE Metal, --gpu: the 2D canvas is GPU-rastered like iOS Safari's) and with CDP CPU throttling
// (--throttle 4: roughly a phone's CPU); WebKit (--engine webkit) is the Safari engine on the Mac.
//
// usage: node tools/sbw_perf_test.js [--engine chromium|webkit] [--gpu] [--throttle N] [--levels 1-5,3-1|mx,br|all]
//        [--bosses] [--maps] [--only-bosses] [--only-maps] [--ms 500] [--spots 24] [--out file.json] [--label txt]
//        [--short] [--baseline file] [--write-baseline file] [--compare before.json]
//   --short: the regression guard: a fixed set of scenarios (the reference levels plus the costliest ones), checked
//   against the stored baseline (tools/perf_baseline.json) relative to the reference level of the same run.
//   BRADY_DIST=<folder> to test a private build.
const pw = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = k => args.includes(k);
const SHORT = has('--short');
const engine = opt('--engine', SHORT ? 'webkit' : 'chromium');
const GPU = has('--gpu');
const FLUSH = has('--flush') || SHORT;
const THROTTLE = +opt('--throttle', 1);
const MS = +opt('--ms', SHORT ? 400 : 500);
const SPOTS = +opt('--spots', SHORT ? 14 : 24);
const OUT = opt('--out', null);
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const root = path.join(dist, 'site');
const BASE_FILE = opt('--baseline', path.join(__dirname, 'perf_baseline.json'));
const WRITE_BASE = has('--write-baseline') ? (() => { const v = opt('--write-baseline', ''); return v && !v.startsWith('--') ? v : BASE_FILE; })() : null;
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

/* ---------------- in-page: instrumentation and scenario runners ---------------- */
function pageSetup() {
  const B = window.BRADY, G = B.Game, TT = window.BRADY_TOUR;
  const TS = B.TS, T = B.T, SOLID = B.SOLID, Ink = B.Ink, BG = B.BG, Decor = B.Decor, PostFX = B.PostFX, WorldFx = B.WorldFx, TripFX = B.TripFX;
  const Particles = B.Particles, Weather = B.Weather, Player = B.Player, ENTITY_TYPES = B.ENTITY_TYPES || window.BRADY_TYPES, Atlas = B.Atlas;
  if (!TS || !SOLID || !Ink) throw new Error('this build does not export the names the harness needs (src/99_main.js window.BRADY list)');
  const P = window.__perf = { rec: null, canvases: 0 };
  // the frame hook (Game.perf, src/99_main.js): one record per Game.frame while recording
  G.perf = {
    frame(raw, steps) {
      const r = P.rec; if (!r) return;
      const pf = G.perf, m = performance.memory;
      // --flush: read one pixel back so the frame's rasterization (CPU or GPU) is finished and counted in its cost
      let t3 = pf.t2; if (P.flush) { G.ctx.getImageData(0, 0, 1, 1); t3 = performance.now(); }
      r.push([t3 - pf.t0, pf.t1 - pf.t0, t3 - pf.t1, raw * 1000, steps, m ? m.usedJSHeapSize : 0, t3 - pf.t2]);
    }
  };
  // pin the view and quality (the adaptive quality must not change the cost mid-run)
  // --tier N pins a graphics cut level (src/14_quality.js: 0 HIGH, 2 MEDIUM, 5 LOW); a build without tiers runs as it is
  P.pin = () => { G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; if (B.QualityTier && B.QualityTier.pin) B.QualityTier.pin(P.tier || 0); G.resize(); };
  // canvases created (any time)
  const ce = document.createElement.bind(document);
  document.createElement = function (n, o) { if (String(n).toLowerCase() === 'canvas') P.canvases++; return ce(n, o); };
  // a seeded Math.random per scenario
  P.seed = n => { let a = (n >>> 0) || 1; Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  // ---- keyboard autopilot ----
  const KEY = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', jump: 'Space', action: 'KeyX' };
  const held = {};
  const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true, cancelable: true }));
  P.set = h => { for (const k in KEY) if (!!h[k] !== !!held[k]) { key(KEY[k], !!h[k]); held[k] = !!h[k]; } };
  P.release = () => { P.set({}); try { B.Input.releaseAll(); } catch (e) { /* older build */ } };
  const AP = P.ap = { on: false, mode: 'run', t: 0, lastX: 0, still: 0, dir: 1 };
  setInterval(() => {
    if (!AP.on) return;
    const g = G.scene; AP.t += 0.1;
    if (AP.mode === 'map') { const r = Math.random(); P.set(r < 0.4 ? { right: true } : r < 0.7 ? { left: true } : r < 0.85 ? { up: true } : { down: true }); return; }
    if (!(g instanceof B.Play) || g.paused || !g.player) { P.set({}); return; }
    const p = g.player, h = {};
    if (AP.mode === 'boss' && g.boss) { const b = g.boss; if (p.cx < b.arenaX0 + 60) AP.dir = 1; else if (p.cx > b.arenaX1 - 60) AP.dir = -1; else if (Math.random() < 0.05) AP.dir = -AP.dir; if (AP.dir > 0) h.right = true; else h.left = true; h.jump = Math.random() < 0.35; h.action = Math.random() < 0.15; P.set(h); return; }
    const moved = Math.abs(p.x - AP.lastX) > 3; AP.lastX = p.x; AP.still = moved ? 0 : AP.still + 0.1;
    h.right = true;
    if (AP.still > 0.5) h.jump = Math.random() < 0.7;
    if (p.inWater) h.jump = Math.random() < 0.5;
    if (Math.random() < 0.25) h.jump = true;
    if (Math.random() < 0.08) h.action = true;
    P.set(h);
  }, 100);
  // ---- Brady can't be hurt and doesn't leave the level ----
  P.god = g => {
    const p = g.player; if (!p || p.__god) return; p.__god = true;
    p.hurt = function () {}; p.die = function () {};
    for (const e of g.entities) if (e instanceof B.Play.__Gate) e.touchPlayer = function () {};
  };
  B.Play.__Gate = B.Gate || function () {};
  P.waitAtlases = async (g, ms) => {
    if (typeof Atlas === 'undefined') return;
    const t0 = performance.now();
    while (performance.now() - t0 < ms) { if (!Object.keys(Atlas.pending).length) return; await new Promise(r => setTimeout(r, 50)); }
  };
  // ---- spots: one standing spot per view-sized cell of the area ----
  P.spots = (A, max) => {
    const W = A.W, H = A.H, t = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : A.tiles[y * W + x];
    const solid = id => !!SOLID[id];
    const cw = Math.max(8, Math.floor(G.viewW / TS * 0.9)), ch = Math.max(6, Math.floor(G.rows * 0.9));
    const out = [];
    for (let cy = 0; cy < H; cy += ch) for (let cx = 0; cx < W; cx += cw) {
      let best = null, bd = 1e9; const mx = cx + cw / 2, my = cy + ch * 0.7;
      for (let y = cy; y < Math.min(H - 1, cy + ch); y++) for (let x = cx; x < Math.min(W, cx + cw); x++) {
        const here = t(x, y), below = t(x, y + 1);
        const stand = !solid(here) && !solid(t(x, y - 1)) && (solid(below) || below === T.SEMI) && here !== T.WATER && here !== T.LAVA;
        const swim = A.water && !solid(here) && !solid(t(x, y - 1));
        if (!stand && !swim) continue;
        const d = Math.abs(x - mx) + Math.abs(y - my) * 1.5 + (stand ? 0 : 6);
        if (d < bd) { bd = d; best = { x, y }; }
      }
      if (best) out.push(best);
    }
    out.sort((a, b) => a.x - b.x || a.y - b.y);
    if (out.length <= max) return out;
    const r = []; for (let i = 0; i < max; i++) r.push(out[Math.floor(i * out.length / max)]); return r;
  };
  P.place = (g, s) => {
    const p = g.player; P.god(g);
    p.x = s.x * TS + TS / 2 - p.w / 2; p.y = (s.y + 1) * TS - p.h - 0.5; p.vx = 0; p.vy = 0; p.ride = null;
    g.camX = Math.max(0, Math.min(g.area.W * TS - G.viewW, p.cx - G.viewW * 0.4)); g.camY = g.camTargetY(true);
  };
  const stats = arr => {
    if (!arr.length) return null;
    const s = arr.slice().sort((a, b) => a - b), q = k => s[Math.min(s.length - 1, Math.floor(k * s.length))];
    return { mean: arr.reduce((a, b) => a + b, 0) / arr.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: s[s.length - 1], n: arr.length };
  };
  P.summary = recs => {
    if (!recs.length) return { cost: null, upd: 0, drw: 0, flush: 0, gap: null, heapStart: 0, heapEnd: 0, allocMBs: 0, gcs: 0, noFrames: true };
    const heap = recs.map(r => r[5]).filter(Boolean); let alloc = 0, gcs = 0;
    for (let i = 1; i < heap.length; i++) { const d = heap[i] - heap[i - 1]; if (d > 0) alloc += d; else if (d < -2e5) gcs++; }
    const secs = recs.reduce((a, r) => a + r[3], 0) / 1000 || 1;
    return { flush: stats(recs.map(r => r[6] || 0)).mean, cost: stats(recs.map(r => r[0])), upd: stats(recs.map(r => r[1])).mean, drw: stats(recs.map(r => r[2])).mean, gap: stats(recs.map(r => r[3])), heapStart: heap[0] || 0, heapEnd: heap[heap.length - 1] || 0, allocMBs: alloc / 1048576 / secs, gcs };
  };
  // ---- the profile window: counters and the time per painter (instrumented, so not used for the timings) ----
  P.profile = async (frames) => {
    let cat = 'other'; const pxBy = {};
    const addPx = v => { pxBy[cat] = (pxBy[cat] || 0) + v; };
    const C2 = CanvasRenderingContext2D.prototype, undo = [], cnt = { drawImage: 0, drawPx: 0, fillRectPx: 0, fillText: 0, strokeText: 0, grad: 0, getImageData: 0, putImageData: 0, ink: 0, inkPx: 0, shadowBlur: 0, filter: 0, comp: 0, save: 0 }, tm = {}, cls = {}, clsU = {};
    const wrap = (obj, k, fn) => { const o = obj[k]; if (typeof o !== 'function') return; obj[k] = fn(o); undo.push(() => { obj[k] = o; }); };
    const prop = (proto, k, onSet) => { const d = Object.getOwnPropertyDescriptor(proto, k); if (!d || !d.set) return; Object.defineProperty(proto, k, { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { onSet(v); d.set.call(this, v); } }); undo.push(() => Object.defineProperty(proto, k, d)); };
    // the device pixels a rectangle covers on its canvas (clipped to the canvas; transforms by their bounding box)
    const area = (cx, x, y, w, h) => {
      const m = cx.getTransform(), W = cx.canvas.width, H = cx.canvas.height;
      const xs = [m.a * x + m.c * y + m.e, m.a * (x + w) + m.c * y + m.e, m.a * x + m.c * (y + h) + m.e, m.a * (x + w) + m.c * (y + h) + m.e];
      const ys = [m.b * x + m.d * y + m.f, m.b * (x + w) + m.d * y + m.f, m.b * x + m.d * (y + h) + m.f, m.b * (x + w) + m.d * (y + h) + m.f];
      const x0 = Math.max(0, Math.min(...xs)), x1 = Math.min(W, Math.max(...xs)), y0 = Math.max(0, Math.min(...ys)), y1 = Math.min(H, Math.max(...ys));
      return x1 > x0 && y1 > y0 ? (x1 - x0) * (y1 - y0) : 0;
    };
    wrap(C2, 'drawImage', o => function (img, a, b, c, d, e, f, gg, h) {
      cnt.drawImage++;
      const n = arguments.length, v = n >= 9 ? area(this, e, f, gg, h) : n >= 5 ? area(this, a, b, c, d) : area(this, a, b, img.width || 0, img.height || 0);
      cnt.drawPx += v; addPx(v);
      return o.apply(this, arguments);
    });
    wrap(C2, 'fillRect', o => function (x, y, w, h) { const v = area(this, x, y, w, h); cnt.fillRectPx += v; addPx(v); return o.apply(this, arguments); });
    for (const k of ['fillText', 'strokeText', 'getImageData', 'putImageData', 'save']) wrap(C2, k, o => function () { cnt[k]++; return o.apply(this, arguments); });
    for (const k of ['createLinearGradient', 'createRadialGradient', 'createPattern']) wrap(C2, k, o => function () { cnt.grad++; return o.apply(this, arguments); });
    prop(C2, 'shadowBlur', v => { if (v > 0) cnt.shadowBlur++; });
    prop(C2, 'filter', v => { if (v && v !== 'none') cnt.filter++; });
    prop(C2, 'globalCompositeOperation', v => { if (v !== 'source-over') cnt.comp++; });
    // painters
    let depth = 0;
    const timed = (obj, k, name) => wrap(obj, k, o => function () { const t0 = performance.now(), c0 = cat; if (name !== 'draw' && name !== 'update') cat = name; try { return o.apply(this, arguments); } finally { cat = c0; tm[name] = (tm[name] || 0) + performance.now() - t0; } });
    wrap(Ink, 'around', o => function (ctx, x, y, w, h) { cnt.ink++; const m = ctx.getTransform(); cnt.inkPx += (w + 32) * (h + 32) * Math.abs(m.a * m.d); const t0 = performance.now(), c0 = cat; cat = 'ink<' + c0; try { return o.apply(this, arguments); } finally { cat = c0; tm.ink = (tm.ink || 0) + performance.now() - t0; } });
    const PP = B.Play.prototype;
    for (const k of ['drawTiles', 'drawShadows', 'drawLighting', 'drawHUD', 'drawUnderwater', 'drawWaterLine', 'drawToast', 'drawTutorial']) timed(PP, k, k);
    timed(PP, 'draw', 'draw'); timed(PP, 'update', 'update');
    if (typeof BG !== 'undefined') timed(BG, 'draw', 'bg');
    if (typeof Decor !== 'undefined') timed(Decor, 'draw', 'decor');
    if (typeof PostFX !== 'undefined') timed(PostFX, 'apply', 'postfx');
    if (typeof WorldFx !== 'undefined') timed(WorldFx, 'apply', 'worldfx');
    if (typeof TripFX !== 'undefined') { timed(TripFX, 'back', 'trip'); timed(TripFX, 'post', 'trip'); }
    timed(B.Input, 'drawControls', 'controls');
    if (typeof Particles !== 'undefined') timed(Particles.prototype, 'draw', 'particles');
    if (typeof Weather !== 'undefined') timed(Weather.prototype, 'draw', 'weather');
    if (typeof Player !== 'undefined') timed(Player.prototype, 'draw', 'brady');
    if (TT && TT.TourMapScene) { timed(TT.TourMapScene.prototype, 'draw', 'mapDraw'); timed(TT.TourMapScene.prototype, 'update', 'mapUpdate'); if (TT.TourMapScene.Overworld) { timed(TT.TourMapScene.Overworld.prototype, 'ensureCache', 'owCache'); timed(TT.TourMapScene.Overworld.prototype, 'drawWalker', 'owWalker'); } }
    // every entity class with its own draw / update: time by the drawn instance's class (outermost call only)
    const seen = new Set();
    const classes = Object.values(window.BRADY_TYPES || {}).filter(C => typeof C === 'function');
    for (const C of classes) for (let pr = C.prototype; pr && pr !== Object.prototype; pr = Object.getPrototypeOf(pr)) {
      if (seen.has(pr)) continue; seen.add(pr);
      if (Object.prototype.hasOwnProperty.call(pr, 'draw')) wrap(pr, 'draw', o => function () { if (depth) return o.apply(this, arguments); depth++; const t0 = performance.now(), c0 = cat; cat = 'ent:' + (this.constructor.name || 'anon') + (this.s && this.s.type ? '/' + this.s.type : ''); try { return o.apply(this, arguments); } finally { depth--; cat = c0; const n = (this.constructor.name || 'anon') + (this.s && this.s.type ? '/' + this.s.type : ''); cls[n] = (cls[n] || 0) + performance.now() - t0; } });
      if (Object.prototype.hasOwnProperty.call(pr, 'update')) wrap(pr, 'update', o => function () { if (depth) return o.apply(this, arguments); depth++; const t0 = performance.now(); try { return o.apply(this, arguments); } finally { depth--; const n = this.constructor.name; clsU[n] = (clsU[n] || 0) + performance.now() - t0; } });
    }
    // scene state per frame
    const st = { parts: 0, weather: 0, ents: 0, entsUpd: 0, entsDrawn: 0, frames: 0 };
    const rec = []; P.rec = rec;
    const n0 = rec.length;
    await new Promise(res => { const tick = () => {
      const g = G.scene;
      if (g instanceof B.Play) {
        st.parts += g.parts.list.length; st.weather += g.weather ? g.weather.list.length : 0; st.ents += g.entities.length;
        const VW = G.viewW, VH = G.viewH, zx = Math.max(0, VW * (12 / G.rows - 1)) / 2, zy = Math.max(0, (12 - G.rows) * TS) / 2;
        for (const e of g.entities) {
          if (e.remove) continue;
          if (e.x + e.w > g.camX - 4 * TS - zx && e.x < g.camX + VW + 5 * TS + zx && e.y + e.h > g.camY - 8 * TS - zy && e.y < g.camY + VH + 8 * TS + zy) st.entsUpd++;
          if (e.x + e.w > g.camX - 60 && e.x < g.camX + VW + 60 && e.y + e.h > g.camY - 160 && e.y < g.camY + VH + 60) st.entsDrawn++;
        }
      }
      st.frames++;
      if (rec.length - n0 >= frames) res(); else requestAnimationFrame(tick);
    }; requestAnimationFrame(tick); });
    P.rec = null;
    for (const u of undo.reverse()) u();
    const n = Math.max(1, rec.length - n0), per = o => { const r = {}; for (const k in o) r[k] = +(o[k] / n).toFixed(k.endsWith('Px') || k === 'drawPx' ? 0 : 3); return r; };
    const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => [k, +(v / n).toFixed(3)]);
    const fs = Math.max(1, st.frames);
    const pxTop = Object.entries(pxBy).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => [k, Math.round(v / n / 1000)]);
    return { frames: n, pxBy: pxTop, counts: per(cnt), time: per(tm), drawByClass: top(cls), updByClass: top(clsU), scene: { parts: st.parts / fs, weather: st.weather / fs, ents: st.ents / fs, entsUpd: st.entsUpd / fs, entsDrawn: st.entsDrawn / fs }, profCost: P.summary(rec).cost };
  };
  const measure = async (ms, settle) => {
    await new Promise(r => setTimeout(r, settle));
    const rec = []; P.rec = rec;
    await new Promise(r => setTimeout(r, ms));
    P.rec = null; return rec;
  };
  // ---- ablation (--ablate a,b): switch one painter off to see what it costs (diagnosis only; the picture changes) ----
  P.ablate = list => {
    const PP = B.Play.prototype, noop = function () {};
    for (const k of list) {
      if (k === 'ink') Ink.on = false;
      else if (k === 'form') Ink.form = false;
      else if (k === 'post') PostFX.apply = noop;
      else if (k === 'bg') BG.draw = function (ctx, th, cx, cy, r, vw, vh, S) { ctx.fillStyle = '#446'; ctx.fillRect(0, 0, vw * S, vh * S); };
      else if (k === 'tiles') PP.drawTiles = noop;
      else if (k === 'shadows') PP.drawShadows = noop;
      else if (k === 'vignette') { G.__vig = true; const r0 = G.resize; G.resize = function () { r0.apply(this, arguments); this.vignette = document.createElement('canvas'); this.vignette.width = this.vignette.height = 1; }; G.resize(); }
      else if (k === 'decor') Decor.draw = noop;
      else if (k === 'parts') { Particles.prototype.draw = noop; Weather.prototype.draw = noop; }
      else if (k === 'hud') { PP.drawHUD = noop; B.Input.drawControls = noop; }
      else if (k === 'ents') { for (const C of Object.values(ENTITY_TYPES)) if (C && C.prototype && C.prototype.draw) C.prototype.draw = noop; }
      else if (k === 'brady') Player.prototype.draw = noop;
    }
  };
  // ---- a level: every area, spots spread over it ----
  P.level = async (id, o) => {
    P.seed(7); B.Save.data.lives = 9; P.pin();
    const c0 = P.canvases;
    const [w, i] = id.split('-').map(Number);
    const g = new B.Play(B.getLevel(w, i), {}); G.setScene(g);
    g.state = 'play'; g.stateT = 0; g.fade.a = 0; g.fade.target = 0;
    await P.waitAtlases(g, 4000);
    const areas = g.level.areas.length;
    const per = Math.max(2, Math.floor(o.spots / areas));
    const all = [], spotsOut = [], profs = [], trace = [];
    AP.mode = 'run'; AP.on = true;
    for (let ai = 0; ai < areas; ai++) {
      if (G.scene !== g) break;
      if (g.area.idx !== ai) { const a = g.level.areas[ai], an = (a.anchors && (a.anchors.in || a.anchors.start)) || { x: 3 * TS, y: (a.H - 4) * TS }; g.loadArea(ai, an.x, an.y, g.player.power || 0); g.state = 'play'; g.fade.a = 0; g.fade.target = 0; g.fade.cb = null; await P.waitAtlases(g, 3000); }
      const sp = P.spots(g.area, per);
      trace.push(ai + ':' + sp.length + ':' + (G.scene === g) + ':' + G.viewW.toFixed(0) + ':' + G.rows);
      for (const s of sp) {
        if (G.scene !== g) break;
        if (g.area.idx !== ai) { const a = g.level.areas[ai]; g.loadArea(ai, s.x * TS, s.y * TS, 0); g.fade.a = 0; g.fade.target = 0; g.fade.cb = null; }
        if (g.state !== 'play') { g.state = 'play'; g.stateT = 0; }
        if (g.player.state !== 'play') g.player.state = 'play';
        P.place(g, s);
        const rec = await measure(o.ms, 200);
        all.push(...rec);
        const sm = P.summary(rec);
        spotsOut.push({ area: ai, x: s.x, y: s.y, mean: sm.cost ? +sm.cost.mean.toFixed(2) : 0, p95: sm.cost ? +sm.cost.p95.toFixed(2) : 0 });
        if (o.profile) { const pr = await P.profile(o.profileFrames || 6); pr.at = { area: ai, x: s.x, y: s.y }; profs.push(pr); }
      }
    }
    AP.on = false; P.release();
    const sum = P.summary(all);
    sum.canvases = P.canvases - c0; sum.spots = spotsOut; sum.areas = areas; sum.trace = trace;
    // the profile: averaged over all spots, plus the worst spot's
    if (profs.length) {
      const avg = { counts: {}, time: {}, scene: {} };
      for (const pr of profs) for (const k of ['counts', 'time', 'scene']) for (const q in pr[k]) avg[k][q] = (avg[k][q] || 0) + pr[k][q] / profs.length;
      for (const k of ['counts', 'time', 'scene']) for (const q in avg[k]) avg[k][q] = +avg[k][q].toFixed(q.endsWith('Px') ? 0 : 3);
      const cls = {}; for (const pr of profs) for (const [k, v] of pr.drawByClass) cls[k] = (cls[k] || 0) + v / profs.length;
      const pxa = {}; for (const pr of profs) for (const [k, v] of pr.pxBy) pxa[k] = (pxa[k] || 0) + v / profs.length;
      avg.pxBy = Object.entries(pxa).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, v]) => [k, Math.round(v)]);
      avg.drawByClass = Object.entries(cls).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => [k, +v.toFixed(3)]);
      const wi = spotsOut.reduce((bi, s, k) => s.mean > spotsOut[bi].mean ? k : bi, 0);
      sum.profile = avg; sum.worstSpot = Object.assign({}, spotsOut[wi], { profile: profs[wi] });
    }
    return sum;
  };
  // ---- a boss arena, mid-fight ----
  P.boss = async (id, o) => {
    P.seed(11); B.Save.data.lives = 9; P.pin();
    const c0 = P.canvases;
    const [w, i] = id.split('-').map(Number);
    const g = new B.Play(B.getLevel(w, i), {}); G.setScene(g);
    g.state = 'play'; g.fade.a = 0; g.fade.target = 0;
    const k = g.level.areas.findIndex(a => a.role === 'arena' || a.spawns.some(s => s.type === 'boss' || (ENTITY_TYPES[s.type] && ENTITY_TYPES[s.type].prototype && ENTITY_TYPES[s.type].prototype.boss)));
    if (k >= 0 && g.area.idx !== k) { const a = g.level.areas[k], an = (a.anchors && (a.anchors.in || a.anchors.start)) || { x: 3 * TS + 16, y: (a.H - 4) * TS }; g.loadArea(k, an.x, an.y, 1); g.fade.a = 0; g.fade.target = 0; g.fade.cb = null; }
    await P.waitAtlases(g, 4000);
    let b = g.entities.find(e => e.boss && !e.remove);
    if (!b) return { error: 'no boss' };
    P.god(g);
    const p = g.player; p.x = (b.arenaX0 != null ? b.arenaX0 : b.x - 300) + 64; p.y = (b.floorY || b.y + b.h) - p.h - 4; p.vy = 0;
    // the boss can't be beaten while it is measured
    const hit0 = b.hit; b.hit = function (kind, pl, opt) { const r = hit0.apply(this, arguments); if (this.hp < 1.5) this.hp = Math.max(1.5, this.maxHp * 0.5); if (this.state === 'dying') { this.state = 'fight'; this.timer = 0; } return r; };
    AP.mode = 'boss'; AP.on = true;
    await new Promise(r => setTimeout(r, 2800));   // wake and intro
    if (b.state === 'sleep' || b.state === 'intro') { b.state = 'fight'; }
    const rec = await measure(o.bossMs || 5000, 0);
    // the last phase: hp low (more projectiles in most fights)
    b.hp = Math.min(b.hp, Math.max(1.5, b.maxHp * 0.25)); if (b.brain && b.brain.phases && b.brain.phase) { let n2 = b.phase || 1; for (let q = 0; q < b.brain.phases.length; q++) if (b.hp <= b.brain.phases[q] + 0.01) n2 = Math.max(n2, q + 2); if (n2 > (b.phase || 1)) { b.phase = n2; try { b.brain.phase(b, n2); } catch (e) { /* ok */ } } }
    const rec2 = await measure(o.bossMs || 5000, 300);
    rec.push(...rec2);
    let prof = null; if (o.profile) prof = await P.profile(o.profileFrames * 2 || 12);
    AP.on = false; P.release();
    const sum = P.summary(rec); sum.canvases = P.canvases - c0; sum.profile = prof; sum.bossState = b.state; sum.hp = b.hp;
    return sum;
  };
  // ---- a land's walkable overworld, and the route map ----
  P.map = async (cc, o) => {
    P.seed(5); P.pin();
    const c0 = P.canvases, T = TT.Tour, C = T.countries[cc];
    if (cc !== 'route') for (const id of T.allLevelIds()) { if (id.startsWith(String(C.world) + '-') || (T.specOf(id) && T.specOf(id).country === cc)) B.Save.data.done[id] = true; }
    const m = new TT.TourMapScene({}); m.card = null;
    if (cc === 'route') { G.setScene(m); m.card = null; m.openRoute && m.openRoute({}); }
    else { m.sel = cc; m.ow = new TT.TourMapScene.Overworld(m, C, {}); m.ow.layoutView(); m.mode = 'land'; G.setScene(m); }
    m.card = null;
    const first = await measure(1500, 0);   // includes the map's own one-off cache paint
    AP.mode = 'map'; AP.on = true;
    const rec = await measure(o.mapMs || 3000, 0);
    AP.on = false; P.release();
    let prof = null; if (o.profile) prof = await P.profile(o.profileFrames || 6);
    const sum = P.summary(rec); sum.firstMax = Math.max(...first.map(r => r[0]), 0); sum.canvases = P.canvases - c0; sum.profile = prof; sum.scene = G.scene.constructor.name + ':' + (G.scene.mode || '');
    return sum;
  };
}

/* ---------------- scenarios ---------------- */
// the regression guard's set: the reference levels the owner found smooth, the boss and Brazil levels he found laggy,
// and the costliest of the full ranking
const SHORT_LEVELS = ['1-1', '1-2', '1-5', '3-1', '3-3', '3-4', '3-5'];
const SHORT_BOSSES = ['1-5', '3-5'];
const SHORT_MAPS = ['mx', 'route'];

// --pair <dist>: a second build measured at the same time on the same scenario in its own browser (both runs see the
// same load from the rest of the machine, so their ratio holds on a busy machine); results.pair holds its numbers
const PAIR = opt('--pair', null);
async function main() {
  const launchArgs = engine === 'chromium' ? ['--enable-precise-memory-info', '--js-flags=--expose-gc'].concat(GPU ? ['--enable-gpu', '--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] : []) : [];
  const sides = [];
  for (const r of [root].concat(PAIR ? [path.join(path.resolve(PAIR), 'site')] : [])) {
    const srv = await serve(r), url = 'http://127.0.0.1:' + srv.address().port + '/super-brady-o-world/index.html', browser = await pw[engine].launch({ args: launchArgs });
    sides.push({ srv, url, browser });
  }
  const srv = sides[0].srv, browser = sides[0].browser, url = sides[0].url;
  const mk = async (sd) => {
    sd = sd || sides[0]; const browser = sd.browser, url = sd.url;
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: engine !== 'firefox', hasTouch: true, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    page.__errs = [];
    page.on('pageerror', e => page.__errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') page.__errs.push('console: ' + m.text()); });
    await page.goto(url); await page.waitForTimeout(1500);
    await page.evaluate(pageSetup);
    if (FLUSH) await page.evaluate(() => { window.__perf.flush = true; });
    if (sd === sides[0] || !sd) await page.evaluate(t => { window.__perf.tier = t; }, +opt('--tier', 0));
    if (opt('--ablate', null)) await page.evaluate(l => window.__perf.ablate(l), opt('--ablate').split(','));
    if (engine === 'chromium' && THROTTLE > 1) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE }); }
    return page;
  };
  let page = await mk();
  for (let k = 1; k < sides.length; k++) sides[k].page = await mk(sides[k]);
  const info = await page.evaluate(() => { const T = window.BRADY_TOUR.Tour; return { ids: T.allLevelIds(), boss: T.allLevelIds().filter(id => T.isBoss(id)), lands: Object.keys(T.countries), world: Object.fromEntries(Object.entries(T.countries).map(([k, C]) => [k, C.world])), dpr: window.BRADY.Game.dpr, canvas: [window.BRADY.Game.canvas.width, window.BRADY.Game.canvas.height] }; });
  const byLand = s => { const out = []; for (const t of s.split(',')) { if (info.world[t] != null) out.push(...info.ids.filter(id => id.split('-')[0] === String(info.world[t]))); else out.push(t); } return out; };
  let levels, bosses, maps;
  if (SHORT) { levels = SHORT_LEVELS; bosses = SHORT_BOSSES; maps = SHORT_MAPS; }
  else {
    const lv = opt('--levels', 'all');
    levels = has('--only-bosses') || has('--only-maps') ? [] : lv === 'all' ? info.ids : byLand(lv);
    bosses = has('--bosses') || has('--only-bosses') ? (lv === 'all' ? info.boss : byLand(lv).filter(id => info.boss.includes(id))) : [];
    maps = has('--maps') || has('--only-maps') ? (lv === 'all' ? info.lands.concat('route') : lv.split(',').filter(c => info.lands.includes(c)).concat(lv === 'all' ? ['route'] : [])) : [];
  }
  const o = { ms: MS, spots: SPOTS, profile: !has('--no-profile'), profileFrames: 6, bossMs: SHORT ? 3000 : 5000, mapMs: SHORT ? 2000 : 3000 };
  console.log(`perf: ${engine}${GPU ? ' (GPU)' : ''}${FLUSH ? ' raster flushed every frame' : ''}, CPU throttle ${THROTTLE}x, canvas ${info.canvas.join('x')} (dpr ${info.dpr}), ${levels.length} levels, ${bosses.length} bosses, ${maps.length} maps, ${MS} ms x up to ${SPOTS} spots per level`);
  const results = { pair: PAIR ? { dist: PAIR, levels: {}, bosses: {}, maps: {} } : undefined, meta: { tier: +opt('--tier', 0), engine, gpu: GPU, flush: FLUSH, throttle: THROTTLE, ms: MS, spots: SPOTS, canvas: info.canvas, dpr: info.dpr, label: opt('--label', ''), date: new Date().toISOString() }, levels: {}, bosses: {}, maps: {} };
  const errors = [];
  // a fresh page per land (levels run in order inside it, like a player's session: caches and scratch canvases carry
  // over from one level to the next), per boss and per map
  let group = null;
  const run = async (kind, id, fn) => {
    const gk = kind === 'levels' ? 'L' + id.split('-')[0] : kind + id;
    if (group !== null && gk !== group) { await page.context().close(); page = await mk(); for (let k = 1; k < sides.length; k++) { await sides[k].page.context().close(); sides[k].page = await mk(sides[k]); } }
    group = gk;
    try {
      const all = await Promise.all([page.evaluate(fn, { id, o })].concat(sides.slice(1).map(sd => sd.page.evaluate(fn, { id, o }))));
      const r = all[0];
      if (all[1]) { results.pair[kind][id] = all[1]; const q = all[1].cost || {}; console.log(`  pair   ${id.padEnd(6)} mean ${(q.mean || 0).toFixed(2).padStart(6)}  p95 ${(q.p95 || 0).toFixed(2).padStart(6)}  ratio mean ${((r.cost || {}).mean / q.mean).toFixed(2)} p95 ${((r.cost || {}).p95 / q.p95).toFixed(2)}`); }
      results[kind][id] = r;
      const c = r.cost || {};
      console.log(`${kind.padEnd(6)} ${id.padEnd(6)} mean ${(c.mean || 0).toFixed(2).padStart(6)}  p95 ${(c.p95 || 0).toFixed(2).padStart(6)}  p99 ${(c.p99 || 0).toFixed(2).padStart(6)}  max ${(c.max || 0).toFixed(1).padStart(6)}  upd ${(r.upd || 0).toFixed(2)}  draw ${(r.drw || 0).toFixed(2)}  ink ${r.profile && r.profile.counts ? r.profile.counts.ink : '-'}  dImg ${r.profile && r.profile.counts ? r.profile.counts.drawImage : '-'}  alloc ${(r.allocMBs || 0).toFixed(1)} MB/s` + (r.error ? '  ' + r.error : ''));
    } catch (e) { errors.push(kind + ' ' + id + ': ' + String(e.message || e).slice(0, 300)); console.log('ERROR ' + kind + ' ' + id + ' ' + String(e.message || e).slice(0, 300)); try { await page.context().close(); } catch (e2) { /* gone */ } page = await mk(); group = null; }
    const pe = page.__errs.splice(0).filter(m => !/favicon|404|ERR_FILE/.test(m)); if (pe.length) { errors.push(kind + ' ' + id + ': ' + pe.slice(0, 3).join(' | ')); console.log('  page errors: ' + pe.slice(0, 3).join(' | ')); }
  };
  // the graphics tier controller (src/14_quality.js) on synthetic frame times: steps down on a slow phone, holds, comes
  // back up after a calm, does not oscillate, honours a manual setting, and never touches the look under a test pin
  if (SHORT || has('--tiers')) {
    const r = await page.evaluate(() => {
      const B = window.BRADY, G = B.Game, Q = B.QualityTier; if (!Q) return { skip: true };
      const g = new B.Play(B.getLevel(1, 1), {}); G.setScene(g); g.state = 'play'; g.fade.a = 0; g.fade.target = 0;
      const st = B.Save.data.settings, saved = { gfx: st.gfx, gfxAuto: st.gfxAuto };
      window.__sbwAutoTier = true; st.gfx = 'auto'; st.gfxAuto = 0; Q.init();
      // ms: a frame interval, or a pattern of them (a 60 Hz display drops whole frames: 16.7, 33.3)
      const feed = (ms, secs) => { const levels = [], pat = [].concat(ms); let k = 0; for (let t = 0; t < secs * 1000; ) { const m = pat[k++ % pat.length]; t += m; Q.frame(m / 1000); levels.push(Q.level); } return levels; };
      const out = {};
      feed(1000 / 60, 3); out.fast = Q.level;                        // a fast phone stays at HIGH
      const slow = feed([16.7, 16.7, 33.3], 12); out.slowSteps = [...new Set(slow)];    // 45 fps: steps down, one level per ~3 s
      out.afterSlow = Q.level;
      const hold = feed(1000 / 60, 10); out.holdSteps = [...new Set(hold)];   // fast again: no change for a while (hysteresis)
      const calm = feed(1000 / 60, 40); out.calmSteps = [...new Set(calm)]; out.afterCalm = Q.level;   // then back up, one step at a time
      // a level that fails its probe twice is not probed again (no oscillation)
      // a phone on the edge: HIGH and the first cut drop frames, MEDIUM holds 60 fps; over five minutes it settles at
      // MEDIUM and only re-checks the better level twice
      st.gfxAuto = 0; Q.init();
      let flips = 0, last = Q.level, k = 0; for (let t = 0; t < 300000; ) { const m = Q.level < 2 ? (k++ % 2 ? 33.3 : 16.7) : 16.7; t += m; Q.frame(m / 1000); if (Q.level !== last) { flips++; last = Q.level; } }
      out.flips = flips; out.settled = Q.level;
      feed(1000 / 120, 3); out.p120 = Math.round(Q.period * 10) / 10;   // a 120 Hz display is recognised
      st.gfx = 'low'; Q.init(); feed(33.3, 5); out.manualLow = Q.level; out.manualAuto = Q.auto;
      window.__sbwAutoTier = false; st.gfx = 'auto'; Q.init(); feed(33.3, 8); out.pinnedUnderTest = Q.level;   // webdriver without the flag: never moves
      Object.assign(st, saved); Q.pin(0); window.__sbwAutoTier = false;
      return out;
    });
    const ok = r.skip || (r.fast === 0 && r.afterSlow >= 2 && r.holdSteps.length === 1 && r.afterCalm < r.afterSlow && r.flips <= 8 && r.settled === 2 && r.manualLow === 5 && !r.manualAuto && Math.abs(r.p120 - 8.3) < 0.2);
    console.log((ok ? 'PASS' : 'FAIL') + ' graphics tier controller: ' + JSON.stringify(r));
    if (!ok) errors.push('tier controller ' + JSON.stringify(r));
  }
  // the held ink pictures (src/06a_ink.js Ink.statics) give the same picture as inking live: with a still camera, a
  // busy spot of a level drawn with them off and on must match pixel for pixel
  if (SHORT || has('--look')) {
    for (const id of ['3-5', '6-5', '8-2']) {
      const r = await page.evaluate(async id => {
        const B = window.BRADY, G = B.Game, Ink = B.Ink; if (!Ink.statics && Ink.statics !== false) return { skip: true };
        const [w, i] = id.split('-').map(Number); const g = new B.Play(B.getLevel(w, i), {}); G.setScene(g); g.state = 'play'; g.fade.a = 0; g.fade.target = 0;
        await new Promise(r => setTimeout(r, 2500));
        const f0 = G.frame; G.frame = function () {};
        let best = 0, bestN = -1; const A = g.area;
        for (let x = 0; x < A.W * 32; x += 320) { g.camX = Math.min(x, Math.max(0, A.W * 32 - G.viewW)); let n = 0; const o = Ink.around; Ink.around = function () { n++; return o.apply(this, arguments); }; g.draw(G.ctx); Ink.around = o; if (n > bestN) { bestN = n; best = g.camX; } }
        g.camX = best;
        const grab = () => G.ctx.getImageData(0, 0, G.canvas.width, G.canvas.height).data;
        Ink.statics = false; for (let k = 0; k < 2; k++) g.draw(G.ctx); const a = grab();
        Ink.statics = true; for (let k = 0; k < 4; k++) g.draw(G.ctx); const b = grab();
        let diff = 0; for (let k = 0; k < a.length; k += 4) if (Math.abs(a[k] - b[k]) + Math.abs(a[k + 1] - b[k + 1]) + Math.abs(a[k + 2] - b[k + 2]) > 6) diff++;
        G.frame = f0;
        return { inked: bestN, held: Ink.heldLru ? Ink.heldLru.size : 0, diff };
      }, id);
      const ok = r.skip || r.diff === 0;
      console.log((ok ? 'PASS' : 'FAIL') + ` held ink pictures match live ink in ${id}: ` + JSON.stringify(r));
      if (!ok) errors.push('held ink differs ' + id);
    }
  }
  for (const id of levels) await run('levels', id, ({ id, o }) => window.__perf.level(id, o));
  for (const id of bosses) await run('bosses', id, ({ id, o }) => window.__perf.boss(id, o));
  for (const id of maps) await run('maps', id, ({ id, o }) => window.__perf.map(id, o));
  for (const sd of sides) { await sd.browser.close(); sd.srv.close(); }
  results.errors = errors;
  if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(results, null, 1)); console.log('wrote ' + OUT); }
  // ranking
  const rows = [];
  for (const kind of ['levels', 'bosses', 'maps']) for (const id in results[kind]) { const r = results[kind][id]; if (r.cost) rows.push({ k: (kind === 'levels' ? '' : kind === 'bosses' ? 'boss ' : 'map ') + id, r }); }
  rows.sort((a, b) => b.r.cost.p95 - a.r.cost.p95);
  console.log('\nranked by p95 frame cost (ms):');
  for (const { k, r } of rows.slice(0, 30)) console.log(`  ${k.padEnd(12)} p95 ${r.cost.p95.toFixed(2).padStart(6)}  mean ${r.cost.mean.toFixed(2).padStart(6)}  upd ${r.upd.toFixed(2)}  draw ${r.drw.toFixed(2)}`);
  // the regression guard
  let failed = errors.length;
  const ref = results.levels['1-1'];
  if (WRITE_BASE && ref) {
    const base = { meta: results.meta, ref: '1-1', note: 'p95 and mean frame cost of each scenario divided by the same run\'s 1-1 mean (machine independent); see tools/sbw_perf_test.js', rel: {} };
    for (const { k, r } of rows) base.rel[k] = { p95: +(r.cost.p95 / ref.cost.mean).toFixed(3), mean: +(r.cost.mean / ref.cost.mean).toFixed(3) };
    fs.writeFileSync(WRITE_BASE, JSON.stringify(base, null, 1)); console.log('wrote the baseline ' + WRITE_BASE);
  } else if (SHORT && ref) {
    const base = fs.existsSync(BASE_FILE) ? JSON.parse(fs.readFileSync(BASE_FILE, 'utf8')) : null;
    const TOL = +(process.env.PERF_TOL || 1.35);
    if (!base) { console.log('no baseline at ' + BASE_FILE); failed++; }
    else for (const { k, r } of rows) {
      const b = base.rel[k]; if (!b) continue;
      const rel = r.cost.mean / ref.cost.mean, relP = r.cost.p95 / ref.cost.mean;
      const ok = rel <= b.mean * TOL + 0.05 && relP <= b.p95 * TOL + 0.15;
      console.log((ok ? 'PASS ' : 'FAIL ') + `${k}: mean ${rel.toFixed(2)}x of 1-1 (baseline ${b.mean}), p95 ${relP.toFixed(2)}x (baseline ${b.p95}), tolerance ${TOL}x`);
      if (!ok) failed++;
    }
    // an absolute guard too: no scenario's mean frame may cost more than the frame budget at this throttle
    const budget = +(process.env.PERF_BUDGET || 0);
    if (budget) for (const { k, r } of rows) if (r.cost.p95 > budget) { console.log(`FAIL ${k}: p95 ${r.cost.p95.toFixed(2)} ms over the budget ${budget} ms`); failed++; }
  }
  if (has('--compare')) {
    const before = JSON.parse(fs.readFileSync(opt('--compare'), 'utf8'));
    console.log('\nbefore -> after (p95 / mean ms):');
    for (const kind of ['levels', 'bosses', 'maps']) for (const id in results[kind]) { const a = results[kind][id], b = before[kind] && before[kind][id]; if (!a.cost || !b || !b.cost) continue; console.log(`  ${(kind === 'levels' ? '' : kind + ' ') + id}: p95 ${b.cost.p95.toFixed(2)} -> ${a.cost.p95.toFixed(2)} (${(a.cost.p95 / b.cost.p95).toFixed(2)}x)  mean ${b.cost.mean.toFixed(2)} -> ${a.cost.mean.toFixed(2)}`); }
  }
  if (errors.length) console.log('\nERRORS:\n  ' + errors.join('\n  '));
  console.log(failed ? `\n${failed} PROBLEM(S)` : '\nperf run clean');
  process.exit(failed ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
