/* ============================================================
   World tour: the walkable overworld of one land.
   A full-screen illustrated island (layout table in
   28_tour_fc_maplayouts.js; any stop the table does not place falls
   back to its mapCell). Brady stands on a stop and walks the open
   trails with the joystick / arrow keys; a tap on a stop walks him
   there; jump / Enter / a tap on his own stop goes in. The static
   map (sea, land, scenery, trails) is painted once into an offscreen
   canvas and blitted; stops, roadblocks, Brady and a few animated
   details are drawn per frame.
   ============================================================ */

/* ---------- geometry ---------- */
const OWGeo = {
  // a Catmull-Rom curve through pts ([x, y] pairs), `seg` samples per span
  spline(pts, closed, seg) {
    seg = seg || 8; const n = pts.length, out = [];
    if (n < 3) return pts.map(p => [p[0], p[1]]);
    const P = i => closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)];
    const spans = closed ? n : n - 1;
    for (let i = 0; i < spans; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let k = 0; k < seg; k++) {
        const t = k / seg, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                  0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    if (!closed) out.push([pts[n - 1][0], pts[n - 1][1]]);
    return out;
  },
  // evenly spaced points every `step` units: { pts, cum, len }
  resample(pts, step) {
    const out = [[pts[0][0], pts[0][1]]], cum = [0]; let carry = 0, len = 0;
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1][0], ay = pts[i - 1][1], bx = pts[i][0], by = pts[i][1], d = Math.hypot(bx - ax, by - ay);
      let u = step - carry;
      while (u <= d) { out.push([ax + (bx - ax) * u / d, ay + (by - ay) * u / d]); len += step; cum.push(len); u += step; }
      carry = d - (u - step);
    }
    const last = pts[pts.length - 1], pl = out[out.length - 1], tail = Math.hypot(last[0] - pl[0], last[1] - pl[1]);
    if (tail > 0.01) { out.push([last[0], last[1]]); len += tail; cum.push(len); }
    return { pts: out, cum, len };
  },
  at(P, s) {
    s = clamp(s, 0, P.len); const c = P.cum; let lo = 0, hi = c.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (c[m] <= s) lo = m; else hi = m; }
    const a = P.pts[lo], b = P.pts[hi], d = c[hi] - c[lo] || 1, u = (s - c[lo]) / d;
    return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, dx: b[0] - a[0], dy: b[1] - a[1] };
  },
  inPoly(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; },
  distSeg(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, u = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0; return Math.hypot(px - ax - dx * u, py - ay - dy * u); },
  distPoly(px, py, pts) { let d = 1e9; for (let i = 1; i < pts.length; i++) d = Math.min(d, this.distSeg(px, py, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1])); return d; },
  path(c, pts, closed) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); if (closed) c.closePath(); },
  hull(P) {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
};

/* ---------- a land's map: node positions, coasts, trail curves ---------- */
const TourOW = {
  geos: {},
  NODE_R: 26,          // touch radius of a stop, in map units
  look(C) {
    const c = TourLandscape.look(C.id), M = (typeof TOUR_OW_MAPS !== 'undefined' && TOUR_OW_MAPS[C.id]) || {};
    const pal = M.pal || {};
    return {
      sky: c[0], sea: pal.sea || c[1], deep: pal.deep || shade(c[1], -0.28), hills: c[2], land: pal.land || c[3], light: pal.light || c[4],
      path: pal.path || c[5], landmark: c[6], beach: pal.beach || mix(c[5], '#e2bf7e', 0.35), cliff: pal.cliff || mix(shade(c[3], -0.38), '#6a4632', 0.45),
      roof: pal.roof || (C.colors && C.colors.c) || '#d0603a', wall: pal.wall || '#fff4e0', accent: (C.colors && C.colors.a) || '#ff4f8a'
    };
  },
  // label text of a stop
  label(C, n) {
    const M = (typeof TOUR_OW_MAPS !== 'undefined' && TOUR_OW_MAPS[C.id]) || {};
    if (M.labels && M.labels[n.key]) return M.labels[n.key];
    if (n.kind === 'start') return 'AIRSTRIP';
    if (n.kind === 'port') return n.boss || 'FLY ON';
    if (n.kind === 'bottle') return 'BOTTLE MAIL';
    if (n.kind === 'house') return n.H.mapLabel || n.H.name || 'Souvenirs';
    const L = n.L; if (L.mapLabel) return L.mapLabel;
    const w = L.name.split(' ').filter(x => !/^(of|the|de|la|des|du|do|da|el|los|las|by|and)$/i.test(x));
    let s = w[0] || L.name; if ((s.length < 7 || /'s$/.test(s)) && w[1]) s += ' ' + w[1];
    return s;
  },
  // node positions and coasts for a land (computed once per land; trails are added as they are asked for)
  geo(C) {
    const M = (typeof TOUR_OW_MAPS !== 'undefined' && TOUR_OW_MAPS[C.id]) || {};
    const ver = C.levels.length + ':' + C.houses.length + ':' + C.houses.map(h => h.id).join();
    const G0 = this.geos[C.id]; if (G0 && G0.ver === ver) return G0;
    const w = M.w || 1500, h = M.h || 900, nodes = TourGraph.nodes(C), pos = {};
    const give = (k, p) => { pos[k] = { x: p[0], y: p[1], side: p[2] || 's', auto: !!p.auto }; };
    for (const n of nodes) { const p = M.nodes && M.nodes[n.key]; if (p) give(n.key, p); }
    // fallback: the stop's grid cell (3 columns, row 0 at the bottom), on the layout's grid
    const g = M.grid || [w * 0.2, h * 0.78, w * 0.3, h * 0.27];
    const stops = Tour.panelStops(C);
    const cellOf = k => { const S = stops[k]; if (S.mapCell) return S.mapCell; const row = Math.floor(k / 3), i = k % 3; return [row % 2 ? 2 - i : i, row]; };
    const all = () => Object.keys(pos).map(k => pos[k]);
    const near = (ax, ay, d) => { // the free spot around (ax, ay) farthest from every placed stop
      let best = null, bs = -1;
      for (let q = 0; q < 16; q++) {
        const a = q / 16 * TAU + 0.2, x = clamp(ax + Math.cos(a) * d, 90, w - 90), y = clamp(ay + Math.sin(a) * d * 0.8, 90, h - 90);
        let m = 1e9; for (const p of all()) m = Math.min(m, Math.hypot(p.x - x, p.y - y));
        if (m > bs) { bs = m; best = [x, y]; }
      }
      return best;
    };
    stops.forEach((S, k) => {
      const key = TourGraph.key(C, k); if (!key || pos[key]) return;
      const [col, row] = cellOf(k);
      let x = g[0] + col * g[2], y = g[1] - row * g[3];
      for (const p of all()) if (Math.hypot(p.x - x, p.y - y) < 100) { const q = near(x, y, 120); x = q[0]; y = q[1]; break; }
      const a = [x, y]; a.auto = true; give(key, a);
    });
    const k0 = TourGraph.key(C, 0), kb = TourGraph.key(C, C.mainCount - 1);
    if (!pos.start && pos[k0]) { const a = near(pos[k0].x, pos[k0].y, 150); a.auto = true; give('start', a); }
    if (!pos.port && pos[kb]) { const a = near(pos[kb].x, pos[kb].y, 160); a.auto = true; give('port', a); }
    for (const n of nodes) if (n.kind === 'bottle' && !pos[n.key] && pos[n.id]) { const a = near(pos[n.id].x, pos[n.id].y, 110); a.auto = true; give(n.key, a); }
    // the coasts: the layout's, or a blob around every stop
    let land = M.land;
    if (!land) {
      const pts = all().map(p => [p.x, p.y]), H = OWGeo.hull(pts), cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      const ring = [];
      for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length]; for (const u of [0, 0.5]) { const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u, dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, k = 130 + 30 * Math.sin(i * 2.7 + u * 5); ring.push([clamp(x + dx / d * k, 40, w - 40), clamp(y + dy / d * k * 0.9, 40, h - 50)]); } }
      land = [ring];
    }
    const G = { cc: C.id, ver, w, h, M, pos, land: land.map(r => OWGeo.spline(this.pairs(r), true, 6)), lakes: [], rivers: [], curves: {} };
    G.lakes = (M.feat || []).filter(f => f[0] === 'lake').map(f => OWGeo.spline(this.pairs(f[1]), true, 6));
    G.rivers = (M.feat || []).filter(f => f[0] === 'river').map(f => ({ pts: OWGeo.spline(this.pairs(f[1]), false, 6), w: f[2] || 14 }));
    this.geos[C.id] = G;
    return G;
  },
  pairs(a) { if (!a.length || Array.isArray(a[0])) return a; const out = []; for (let i = 0; i + 1 < a.length; i += 2) out.push([a[i], a[i + 1]]); return out; },
  // the trail curve of an edge, oriented a -> b: { pts, cum, len, water: [[s0, s1], ...] }
  curve(G, e) {
    if (G.curves[e.key]) return G.curves[e.key];
    const A = G.pos[e.a], B = G.pos[e.b]; if (!A || !B) return null;
    const M = G.M, P = M.paths || {};
    let via = P[e.key] ? this.pairs(P[e.key]) : P[e.b + '>' + e.a] ? this.pairs(P[e.b + '>' + e.a]).slice().reverse() : null;
    if (!via) { // a gentle bend
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, s = (hashStr(e.key) % 2 ? 1 : -1) * Math.min(60, d * 0.13);
      via = [[(A.x + B.x) / 2 - dy / d * s, (A.y + B.y) / 2 + dx / d * s]];
    }
    const pts = OWGeo.spline([[A.x, A.y]].concat(via, [[B.x, B.y]]), false, 10), P2 = OWGeo.resample(pts, 4);
    // stretches over water get a bridge
    P2.water = []; let w0 = -1;
    for (let i = 0; i < P2.pts.length; i++) {
      const p = P2.pts[i], wet = this.wet(G, p[0], p[1]);
      if (wet && w0 < 0) w0 = P2.cum[i]; if (!wet && w0 >= 0) { P2.water.push([w0, P2.cum[i]]); w0 = -1; }
    }
    if (w0 >= 0) P2.water.push([w0, P2.len]);
    P2.tunnel = (P[e.key + ':tunnel'] || P[e.b + '>' + e.a + ':tunnel']) || null;
    G.curves[e.key] = P2;
    return P2;
  },
  wet(G, x, y) {
    if (!G.land.some(r => OWGeo.inPoly(x, y, r))) return true;
    if (G.lakes.some(r => OWGeo.inPoly(x, y, r))) return true;
    for (const R of G.rivers) if (OWGeo.distPoly(x, y, R.pts) < R.w / 2 + 1) return true;
    return false;
  },
  // stops and trails Brady could ever see (for layout checks): every node position, every edge curve
  allCurves(C) { const G = this.geo(C), edges = TourGraph.edges(C, TourGraph.nodes(C)); return edges.map(e => ({ e, P: this.curve(G, e) })).filter(x => x.P); }
};

/* ---------- the overworld ---------- */
class TourOverworld {
  constructor(scene, C, o) {
    o = o || {};
    this.scene = scene; this.C = C; this.cc = C.id; this.t = 0;
    this.G = TourOW.geo(C); this.look = TourOW.look(C);
    TourOverworld.hookTaps(); if (TourMapKeys.taps) TourMapKeys.taps.length = 0;
    this.prevEnter = false; this.prevDir = null; this.sinceArrive = 1; this.bumpT = 0;
    this.sparks = []; this.dust = []; this.menu = null; this.iris = { t: 0, dur: TourKit.reduceMotion() ? 0.01 : 0.45, open: true, col: o.landing ? '#fffcf0' : '#07040e' };
    this.refresh();
    // where Brady stands
    const T = TourProgress.data(); T.panelAt = T.panelAt || {};
    let at = o.at || (o.arrive ? 'start' : T.panelAt[C.id]);
    if (typeof at === 'number') at = TourGraph.key(C, at);
    if (!at || !this.by[at] || !this.by[at].visible) {
      const act = this.nodes.find(n => n.kind === 'level' && !n.secret && n.enter && !n.done);
      at = act && this.reachable('start', act.key) ? act.key : 'start';
    }
    const p = this.G.pos[at] || { x: this.G.w / 2, y: this.G.h / 2 };
    this.walker = { at, x: p.x, y: p.y, seg: null, queue: [], facing: 1, t: 0, hop: 0, step: 0 };
    T.panelAt[C.id] = at;
    // what plays first: the reveal queue, roadblocks clearing, then the walk to whatever opened
    this.autoTarget = o.auto || (o.arrive && at === 'start' ? TourGraph.key(C, 0) : null);
    this.revealQ = null; this.reveal = null; this.clears = null;
    // the plane touches down on the airstrip (after a flight) before Brady hops out
    this.air = o.landing && !TourKit.reduceMotion() ? { kind: 'land', node: 'start', t: 0, dur: 1.5 } : null;
    this.cam = { x: p.x, y: p.y };
    this.layoutView();
    this.cam.x = this.camTarget().x; this.cam.y = this.camTarget().y; this.clampCam();
  }
  // progress -> nodes, edges; the painted map is redone when what it shows changes
  refresh() {
    this.nodes = TourGraph.nodes(this.C); this.by = {}; for (const n of this.nodes) this.by[n.key] = n;
    this.edges = TourGraph.edges(this.C, this.nodes);
    const sig = this.nodes.map(n => n.key + (n.visible ? 'v' : '') + (n.done ? 'd' : '') + (n.enter ? 'e' : '')).join() + '|' + this.edges.map(e => e.key + (e.visible ? 'v' : '') + (e.open && !e.fresh ? 'o' : '')).join();
    if (sig !== this.sig) { this.sig = sig; this.dirty = true; }
  }
  reachable(a, b) { return !!TourGraph.route(this.edges, a, b); }
  idle() { const w = this.walker; return !this.reveal && !(this.revealQ && this.revealQ.length) && !this.clears && !w.seg && !w.queue.length && !this.iris.close && this.revealQ !== null && !this.autoTarget && !this.air; }

  /* ---------- view ---------- */
  layoutView() {
    const W = Game.cssW, H = Game.cssH, gr = Game.gameRect || { x: 0, y: 0, w: W, h: H };
    // a fixed view (tools: the whole map as a panorama)
    if (this.fixed) { this.view = this.fixed.view; this.z = this.fixed.z; this.cardR = { x: -999, y: -999, w: 1, h: 1 }; this.chipR = { x: -999, y: -999, h: 1 }; return; }
    this.portrait = H > W * 1.05;
    this.view = this.portrait ? { x: 0, y: 0, w: W, h: gr.y + gr.h } : { x: 0, y: 0, w: W, h: H };
    this.z = clamp(Math.min(this.view.w, this.view.h) / 340, 0.85, 1.5);
    // the info card: between the joystick and the buttons (landscape), or in the pad under the map (portrait)
    const L = Input.layout, touch = Input.usingTouch || Game.forceTouchUI, side = Math.max(12, insets.l + 8, insets.r + 8), bot = Math.max(8, insets.b + 6);
    const ch = 56;
    if (this.portrait) this.cardR = { x: side, y: this.view.h + 10, w: W - side * 2, h: ch };
    else if (touch && L && !L.portrait) {
      const lx = L.lefty ? L.jump.x + L.jump.r + 10 : L.stickHome.x + L.stickHome.r + 12, rx = L.lefty ? L.stickHome.x - L.stickHome.r - 12 : L.action.x - L.action.r - 10;
      const cw = Math.min(440, rx - lx);
      this.cardR = { x: (lx + rx) / 2 - cw / 2, y: H - bot - ch, w: cw, h: ch };
    } else { const cw = Math.min(480, W - side * 2); this.cardR = { x: (W - cw) / 2, y: H - bot - ch, w: cw, h: ch }; }
    this.chipR = { x: Math.max(10, insets.l + 8), y: Math.max(8, insets.t + 6), h: 36 };
  }
  toastY() { return this.view.y + Math.max(70, insets.t + 64); }
  camTarget() {
    if (this.air) { const q = this.airPos(); return { x: q.x, y: q.y - q.h * 0.5 }; }
    if (this.reveal && this.reveal.focus) return this.reveal.focus;
    if (this.clears && this.clears.focus) return this.clears.focus;
    const w = this.walker; return { x: w.x + w.facing * (w.seg ? 30 : 0), y: w.y - 10 };
  }
  clampCam() {
    if (this.fixed) { this.cam.x = this.fixed.cam.x; this.cam.y = this.fixed.cam.y; return; }
    const vw = this.view.w / this.z, vh = this.view.h / this.z, G = this.G;
    // keep the info card from covering Brady: the visible map is a little above the card in landscape
    this.cam.x = vw >= G.w ? G.w / 2 : clamp(this.cam.x, vw / 2, G.w - vw / 2);
    this.cam.y = vh >= G.h ? G.h / 2 : clamp(this.cam.y, vh / 2, G.h - vh / 2);
  }
  // map <-> screen (CSS px)
  toScreen(x, y) { return { x: this.view.x + this.view.w / 2 + (x - this.cam.x) * this.z, y: this.view.y + this.view.h / 2 + (y - this.cam.y) * this.z }; }
  toMap(x, y) { return { x: this.cam.x + (x - this.view.x - this.view.w / 2) / this.z, y: this.cam.y + (y - this.view.y - this.view.h / 2) / this.z }; }
  nodeScreen(key) { const p = this.G.pos[key]; return p ? this.toScreen(p.x, p.y) : null; }

  /* ---------- input ---------- */
  // taps in game mode: a touch on the map (the joystick side counts too) that ends quickly without moving. Read
  // from the pointer events themselves, so a quick tap between two updates is never lost.
  static hookTaps() {
    if (TourMapKeys.hooked || !Input.canvas) return; TourMapKeys.hooked = true; TourMapKeys.taps = [];
    const downs = new Map(), cv = Input.canvas;
    cv.addEventListener('pointerdown', e => { const p = Input.pos(e); downs.set(e.pointerId, { x: p.x, y: p.y, t: performance.now(), moved: 0, role: Input.mode === 'game' ? Input.classify(p.x, p.y) : 'ui' }); });
    cv.addEventListener('pointermove', e => { const d = downs.get(e.pointerId); if (d) { const p = Input.pos(e); d.moved = Math.max(d.moved, Math.hypot(p.x - d.x, p.y - d.y)); } });
    const up = e => {
      const d = downs.get(e.pointerId); downs.delete(e.pointerId); if (!d || e.type !== 'pointerup') return;
      const p = Input.pos(e);
      if (d.moved < 16 && Math.hypot(p.x - d.x, p.y - d.y) < 16 && performance.now() - d.t < 600 && (d.role === 'stick' || d.role === 'cam')) TourMapKeys.taps.push({ x: p.x, y: p.y });
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  }
  trackTaps() { return TourMapKeys.taps ? TourMapKeys.taps.splice(0) : []; }
  readInput() {
    const taps = Input.mode === 'ui' ? Input.taps.slice() : this.trackTaps();
    if (this.testTaps) { taps.push(...this.testTaps); this.testTaps = null; }
    let dx = (Input.right ? 1 : 0) - (Input.left ? 1 : 0), dy = (Input.down ? 1 : 0) - (Input.up ? 1 : 0);
    const st = Input.stick;
    if (st.active && Input.layout) { const sx = st.x - st.ox, sy = st.y - st.oy, d = Math.hypot(sx, sy); if (d > Input.layout.r * 0.3) { dx = sx / d; dy = sy / d; } else { dx = 0; dy = 0; } }
    const d = Math.hypot(dx, dy), ek = !!Input.keys.enter;
    const enter = Input.jumpPressed || Input.actionPressed || (ek && !this.prevEnter) || TourMapKeys.enter || (Input.mode === 'ui' && Input.uiKey === 'enter');
    this.prevEnter = ek; TourMapKeys.enter = false;
    return { taps, dir: d > 0 ? { x: dx / d, y: dy / d } : null, enter, back: Input.pausePressed, world: !!(Input.hudPressed && Input.hudPressed.world) };
  }

  /* ---------- update ---------- */
  update(dt, inp) {
    this.t += dt; if (this.bumpT > 0) this.bumpT -= dt;
    const w = this.walker;
    if (this.dirty) this.dirtyT = (this.dirtyT || 0) + dt;
    // particles
    for (const s of this.sparks) { s.age += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 260 * dt; }
    this.sparks = this.sparks.filter(s => s.age < 0.9);
    for (const d of this.dust) d.age += dt; this.dust = this.dust.filter(d => d.age < 0.55);
    if (w.hop > 0) w.hop = Math.max(0, w.hop - dt);
    // the iris opens (arrival) or closes (going in)
    const I = this.iris; I.t += dt;
    if (I.close && I.t >= I.dur) { const cb = I.cb; I.cb = null; if (cb) cb(); return; }
    // the camera
    const tg = this.camTarget(), k = 1 - Math.exp(-dt * (this.reveal || this.clears ? 3.2 : 5));
    this.cam.x = lerp(this.cam.x, tg.x, k); this.cam.y = lerp(this.cam.y, tg.y, k); this.clampCam();
    if (this.air) {
      const A = this.air; A.t += dt;
      if (A.t >= A.dur) { this.air = null; if (A.kind === 'off') { if (A.cb) A.cb(); return; } const w2 = this.walker; w2.hop = 0.3; for (let q = 0; q < 4; q++) this.dust.push({ x: w2.x + (q - 1.5) * 7, y: w2.y + 2, age: 0, s: 1 }); Sound.play('land', { vol: 0.4 }); }
      return;
    }
    if (!inp) return;   // a postcard is up
    if (this.menu) return this.updateMenu(inp);
    if (inp.back) { this.openMenu(); return; }
    if (inp.world && this.calm()) { this.scene.openRoute({ dest: this.scene.sel }); return; }
    // reveals, then roadblocks, then the walk to what opened
    if (this.revealQ == null && I.t > I.dur * 0.6) this.startReveals();
    if (this.reveal) { this.updateReveal(dt, inp); return; }
    if (this.clears) { this.updateClears(dt, inp); return; }
    if (this.autoTarget && this.revealQ) { const to = this.autoTarget; this.autoTarget = null; const r = TourGraph.route(this.edges, w.at, to); if (r && r.length) this.walkRoute(r, true); }
    if (w.seg || w.queue.length) {
      // a tap or jump while walking skips to the end of the walk
      if ((inp.enter || inp.taps.length) && w.auto) { this.finishWalk(); return; }
      this.updateWalk(dt);
      if (!inp.dir) this.prevDir = null;
      return;
    }
    this.sinceArrive += dt;
    // taps: a stop (walk there / go in), the info card (go in)
    for (const tp of inp.taps) {
      const c = this.cardR; if (tp.x >= c.x && tp.x <= c.x + c.w && tp.y >= c.y && tp.y <= c.y + c.h) { this.enter(); return; }
      if (tp.y > this.view.y + this.view.h) continue;
      const n = this.hitNode(tp.x, tp.y);
      if (n) { this.tapNode(n); return; }
    }
    if (inp.enter) { this.enter(); return; }
    // the joystick: start along the trail that points that way (holding it carries on after a short stop)
    if (inp.dir && (!this.prevDir || this.sinceArrive > 0.3)) this.stepToward(inp.dir);
    this.prevDir = inp.dir;
  }
  calm() { return !this.reveal && !this.clears && !this.iris.close; }
  hitNode(x, y) {
    const m = this.toMap(x, y), R = Math.max(TourOW.NODE_R, 22 / this.z);
    let best = null, bd = R;
    for (const n of this.nodes) { if (!n.visible) continue; const p = this.G.pos[n.key]; if (!p) continue; const d = Math.hypot(p.x - m.x, p.y - m.y + (n.boss ? 10 : 0)); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  tapNode(n) {
    const w = this.walker;
    if (n.key === w.at) { this.enter(); return; }
    const r = TourGraph.route(this.edges, w.at, n.key);
    if (!r) { this.bump(n.kind === 'level' && !n.enter ? 'LOCKED: CLEAR THE STOPS BEFORE IT' : 'NO OPEN TRAIL THERE YET'); return; }
    Sound.play('select', { vol: 0.4 }); this.walkRoute(r, false);
  }
  bump(msg) { if (this.bumpT > 0) return; this.bumpT = 0.5; Sound.play('bump', { vol: 0.4 }); if (msg) this.scene.toast(msg); this.walker.shake = 0.25; }
  // the open trail from Brady's stop that best matches a direction
  stepToward(dir) {
    const w = this.walker; let best = null, bs = 0.42, blocked = null, bb = 0.42;
    for (const e of this.edges) {
      if (!e.visible || (e.a !== w.at && e.b !== w.at)) continue;
      const P = TourOW.curve(this.G, e); if (!P) continue;
      const fromA = e.a === w.at, p0 = OWGeo.at(P, fromA ? 0 : P.len), p1 = OWGeo.at(P, fromA ? Math.min(34, P.len * 0.4) : Math.max(0, P.len - Math.min(34, P.len * 0.4)));
      const vx = p1.x - p0.x, vy = p1.y - p0.y, d = Math.hypot(vx, vy) || 1, s = (vx * dir.x + vy * dir.y) / d;
      if (e.open && !e.fresh) { if (s > bs) { bs = s; best = e; } } else if (s > bb) { bb = s; blocked = e; }
    }
    if (best) { this.walkRoute([best.a === w.at ? best.b : best.a], false); return; }
    if (blocked) this.bump(blocked.kind === 'port' ? 'THE PORT OPENS WHEN THE BOSS FALLS' : 'THE BARON BLOCKED THIS TRAIL: CLEAR ' + this.levelName(blocked.a === w.at ? blocked.a : blocked.b) + ' FIRST');
  }
  levelName(key) { const n = this.by[key]; return n && n.kind === 'level' ? n.id : 'THIS STOP'; }
  walkRoute(keys, auto) {
    const w = this.walker; w.queue = keys.slice(); w.auto = auto; this.nextSeg();
  }
  nextSeg() {
    const w = this.walker, to = w.queue.shift(); if (!to) { w.seg = null; return; }
    const e = this.edges.find(x => (x.a === w.at && x.b === to) || (x.b === w.at && x.a === to));
    if (!e) { w.queue = []; w.seg = null; return; }
    const P = TourOW.curve(this.G, e);
    w.seg = { e, P, rev: e.b === w.at, s: 0, to };
    Sound.play('footstep', { vol: 0.25 });
  }
  updateWalk(dt) {
    const w = this.walker, S = w.seg; if (!S) { this.nextSeg(); return; }
    const sp = w.auto ? 165 : 150;
    S.s += sp * dt; w.t += dt;
    const u = Math.min(S.s, S.P.len), p = OWGeo.at(S.P, S.rev ? S.P.len - u : u);
    const dx = (S.rev ? -p.dx : p.dx); if (Math.abs(dx) > 0.3) w.facing = dx > 0 ? 1 : -1;
    w.x = p.x; w.y = p.y;
    w.step = (w.step || 0) + dt; if (w.step > 0.16) { w.step = 0; this.dust.push({ x: w.x - w.facing * 6, y: w.y + 1, age: 0.15, s: 0.6 }); }
    if (S.s >= S.P.len) {
      w.at = S.to; const q = this.G.pos[w.at]; w.x = q.x; w.y = q.y; w.seg = null;
      if (w.queue.length) { this.nextSeg(); return; }
      this.arrive();
    }
  }
  finishWalk() {
    const w = this.walker; const last = w.queue.length ? w.queue[w.queue.length - 1] : w.seg ? w.seg.to : w.at;
    w.queue = []; w.seg = null; w.at = last; const q = this.G.pos[last]; w.x = q.x; w.y = q.y; this.arrive();
  }
  arrive() {
    const w = this.walker; w.hop = 0.3; w.auto = false; this.sinceArrive = 0;
    for (let q = 0; q < 4; q++) this.dust.push({ x: w.x + (q - 1.5) * 7, y: w.y + 2, age: 0, s: 1 });
    Sound.play('land', { vol: 0.35 });
    const T = TourProgress.data(); (T.panelAt = T.panelAt || {})[this.cc] = w.at; Save.save();
  }
  // go into the stop Brady stands on
  enter(now) {
    const w = this.walker, n = this.by[w.at]; if (!n || w.seg || this.iris.close) return;
    const S = this.scene;
    const board = dest => { if (now || TourKit.reduceMotion()) { S.openRoute({ dest }); return; } Sound.play('select'); TourKit.sfx('plane', 'fly', { vol: 0.6 }); this.air = { kind: 'off', node: n.key, t: 0, dur: 1.25, cb: () => S.openRoute({ dest, zoom: true }) }; };
    if (n.kind === 'start') { board(S.sel); return; }
    if (n.kind === 'port') { if (!n.enter) { this.bump('THE PORT OPENS WHEN THE BOSS FALLS'); return; } const N = Tour.nextCountry(this.C); board(N && TourProgress.countryUnlocked(N) ? N.id : S.sel); return; }
    if (n.kind === 'bottle') { Sound.play('cardFlip'); S.toast('BOTTLE MAIL ' + n.n + '/5: ' + (typeof TOUR_BOTTLE_NOTES !== 'undefined' ? TOUR_BOTTLE_NOTES[(n.n - 1) % 5] : '')); return; }
    if (n.kind === 'level' && !n.enter) { this.bump('LOCKED'); return; }
    const go = () => { if (n.kind === 'house') S.startHouse(n.id.slice(6)); else S.startLevel(n.id); };
    if (now || TourKit.reduceMotion()) { go(); return; }
    Sound.play('portal', { vol: 0.5 });
    w.hop = 0.3; this.iris = { t: 0, dur: 0.5, close: true, cb: go };
  }

  /* ---------- the plane taking off from (or landing on) a strip ---------- */
  airPos() {
    const A = this.air, p = this.G.pos[A.node], ang = -0.12, ca = Math.cos(ang), sa = Math.sin(ang);
    const k = clamp(A.t / A.dur, 0, 1), roll = A.kind === 'off' ? clamp(k / 0.4, 0, 1) : clamp((k - 0.62) / 0.38, 0, 1);
    const air = A.kind === 'off' ? clamp((k - 0.35) / 0.65, 0, 1) : 1 - clamp(k / 0.62, 0, 1);
    // along the strip, then up and away (or the same in reverse)
    const along = A.kind === 'off' ? -22 + easeInOut(roll) * 40 : 30 - easeOut(roll) * 24;
    const out = air * air * 420, up = air * 150 + air * air * 60;
    return { x: p.x + ca * (along + out), y: p.y - 6 + sa * (along + out), h: up, s: 0.62 + air * 0.55, air };
  }
  drawAir(ctx) {
    if (!this.air) return;
    const q = this.airPos();
    ctx.fillStyle = `rgba(20,14,30,${0.3 * (1 - q.air * 0.6)})`; ctx.beginPath(); ctx.ellipse(q.x + q.h * 0.2, q.y + 10, 12 * q.s / 0.62 * (1 - q.air * 0.4), 3.2, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(q.x, q.y - q.h); ctx.scale(q.s, q.s); this.scene.drawPlane(ctx, 0, 16, -0.12 - (this.air.kind === 'off' ? q.air * 0.25 : -q.air * 0.15)); ctx.restore();
  }

  /* ---------- the reveal queue (§3.6): a trail draws itself, a stop pops, a banner ---------- */
  startReveals() {
    this.revealQ = TourProgress.data().pending.filter(r => !TourMap.routeKind(r) && r.cc === this.cc);
    this.nextReveal();
  }
  nextReveal() {
    const r = this.revealQ && this.revealQ.shift();
    if (!r) { this.reveal = null; this.refresh(); this.startClears(); return; }
    const calm = TourKit.reduceMotion(), C = this.C;
    const R = { r, t: 0, calm, sparks: [] };
    if (r.kind === 'path') {
      const a = TourGraph.key(C, r.from), b = TourGraph.key(C, r.to);
      R.edge = this.edges.find(e => (e.a === a && e.b === b) || (e.a === b && e.b === a));
      R.P = R.edge && TourOW.curve(this.G, R.edge); R.rev = R.edge && R.edge.a !== a;
      R.dur = calm ? 0.3 : 1.4;
      if (R.P) { const m = OWGeo.at(R.P, R.P.len / 2); R.focus = { x: m.x, y: m.y }; }
      const nx = this.revealQ[0], toNode = this.by[b];
      if (r.gold && !(nx && (nx.kind === 'stop' || nx.kind === 'house')) && toNode && !toNode.secret) R.banner = 'SHORTCUT!';
      TourKit.sfx('trail', 'select', { pitch: 1.3 });
    } else {
      R.key = r.kind === 'house' ? 'house:' + r.id : r.id;
      R.dur = calm ? 0.3 : 0.45 + 1.6;
      R.banner = r.kind === 'house' ? 'SOUVENIR STAND!' : 'SECRET LEVEL!';
      const p = this.G.pos[R.key];
      if (p) { R.focus = { x: p.x, y: p.y }; if (!calm) { const cols = C.colors; for (let q = 0; q < 12; q++) { const a = q / 12 * TAU; this.sparks.push({ x: p.x, y: p.y - 8, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110 - 60, age: 0, c: [cols.a, cols.b, cols.c][q % 3] }); } } }
      TourKit.sfx('reveal', 'checkpoint');
    }
    this.reveal = R;
  }
  updateReveal(dt, inp) {
    const R = this.reveal;
    R.t += dt;
    if ((inp.taps.length || inp.enter) && R.t > 0.2) R.t = Math.max(R.t, R.dur - 0.15);
    if (R.t >= R.dur) { TourProgress.revealDone(R.r); Save.save(); this.refresh(); this.nextReveal(); }
  }
  // roadblocks on trails that just opened: they shake, burst and the trail fills in
  startClears() {
    const fresh = this.edges.filter(e => e.fresh);
    if (!fresh.length) { this.clears = null; return; }
    const P = TourOW.curve(this.G, fresh[0]), m = P ? OWGeo.at(P, P.len / 2) : null;
    this.clears = { list: fresh, t: 0, dur: TourKit.reduceMotion() ? 0.3 : 1.1, focus: m ? { x: m.x, y: m.y } : null, burst: false };
  }
  updateClears(dt, inp) {
    const K = this.clears; K.t += dt;
    if ((inp.taps.length || inp.enter) && K.t > 0.2) K.t = Math.max(K.t, K.dur - 0.1);
    if (!K.burst && K.t > 0.35) {
      K.burst = true; Sound.play('break', { vol: 0.5 });
      for (const e of K.list) { const P = TourOW.curve(this.G, e); if (!P) continue; const m = OWGeo.at(P, P.len / 2); for (let q = 0; q < 10; q++) { const a = q / 10 * TAU; this.sparks.push({ x: m.x, y: m.y - 10, vx: Math.cos(a) * 90, vy: Math.sin(a) * 70 - 70, age: 0, c: q % 2 ? '#fff4d0' : this.look.path }); } for (let q = 0; q < 5; q++) this.dust.push({ x: m.x + (q - 2) * 8, y: m.y - 4, age: 0, s: 1.6 }); }
    }
    if (K.t >= K.dur) { for (const e of K.list) TourGraph.cleared(this.C, e); Save.save(); this.clears = null; this.refresh(); }
  }

  /* ---------- the pause menu ---------- */
  openMenu() {
    Sound.play('pause'); Input.setMode('ui'); Input.hud = null;
    const W = Game.cssW, H = Game.cssH, bw = Math.min(240, W - 60), bh = 44, x = (W - bw) / 2;
    let y = H / 2 - 112;
    const S = this.scene, close = () => { this.menu = null; Input.setMode('game'); Sound.play('select'); };
    const btns = [
      { x, y: y += 0, w: bw, h: bh, label: 'RESUME', primary: true, fn: close },
      { x, y: y += 54, w: bw, h: bh, label: 'WORLD ROUTE', fn: () => { this.menu = null; S.openRoute({ dest: S.sel }); } },
      { x, y: y += 54, w: bw, h: bh, label: 'SETTINGS', fn: () => { this.menu = null; S.leave(new SettingsScene(S)); } },
      { x, y: y += 54, w: bw, h: bh, label: 'TITLE', fn: () => { this.menu = null; Sound.play('back'); S.leave(new TitleScene()); } }
    ];
    btns.focus = 0; this.menu = btns;
  }
  updateMenu(inp) {
    if (Input.mode !== 'ui') Input.setMode('ui');
    const b = UI.hitButtons(this.menu); if (b) { b.fn(); return; }
    if (inp.back) { this.menu = null; Input.setMode('game'); Sound.play('select'); }
  }

  /* ---------- drawing ---------- */
  ensureCache() {
    const G = this.G, cs = Math.min(Math.max(1, Game.dpr * this.z), 2.2, 4096 / G.w, 4096 / G.h);
    if (this.cache && !this.dirty && Math.abs(this.cache.cs - cs) < 0.01) return;
    const cw = Math.ceil(G.w * cs), ch = Math.ceil(G.h * cs);
    let cv = this.cache && this.cache.cv;
    if (!cv || cv.width !== cw || cv.height !== ch) cv = makeCanvas(cw, ch);
    const c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cw, ch); c.setTransform(cs, 0, 0, cs, 0, 0);
    const t0 = performance.now();
    TourOWPaint.map(c, this);
    this.paintMs = performance.now() - t0;
    this.cache = { cv, cs }; this.dirty = false; this.dirtyT = 0;
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH, V = this.view, z = this.z, G = this.G, t = this.t;
    this.ensureCache();
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    ctx.fillStyle = this.look.deep; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.rect(V.x, V.y, V.w, V.h); ctx.clip();
    // the painted map: only the part in view
    const x0 = this.cam.x - V.w / 2 / z, y0 = this.cam.y - V.h / 2 / z, cs = this.cache.cs;
    const sx = Math.max(0, x0), sy = Math.max(0, y0), sw = Math.min(G.w, x0 + V.w / z) - sx, sh = Math.min(G.h, y0 + V.h / z) - sy;
    if (sw > 0 && sh > 0) ctx.drawImage(this.cache.cv, sx * cs, sy * cs, sw * cs, sh * cs, V.x + (sx - x0) * z, V.y + (sy - y0) * z, sw * z, sh * z);
    // the live layer, in map units
    ctx.translate(V.x + V.w / 2 - this.cam.x * z, V.y + V.h / 2 - this.cam.y * z); ctx.scale(z, z);
    const vr = { x0, y0, x1: x0 + V.w / z, y1: y0 + V.h / z };
    TourOWPaint.live(ctx, this, vr);
    this.drawTrailsLive(ctx);
    for (const e of this.edges) if (e.visible && (!e.open || e.fresh)) this.drawBlock(ctx, e);
    const order = this.nodes.filter(n => this.G.pos[n.key]).sort((a, b) => this.G.pos[a.key].y - this.G.pos[b.key].y);
    for (const n of order) this.drawNode(ctx, n);
    const A = this.air, hide = A && (A.kind === 'off' ? A.t > 0.22 : A.t < A.dur - 0.2);
    if (!hide) this.drawWalker(ctx);
    for (const n of order) this.drawLabel(ctx, n);
    this.drawAir(ctx);
    for (const s of this.sparks) { ctx.globalAlpha = clamp(1 - s.age / 0.9, 0, 1); ctx.fillStyle = s.c; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.age * 8); ctx.fillRect(-3, -2, 6, 4); ctx.restore(); }
    ctx.globalAlpha = 1;
    TourOWPaint.over(ctx, this, vr);
    ctx.restore();
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    // reveal banner
    const R = this.reveal; if (R && R.banner) { const t0 = R.r.kind === 'path' ? 0.5 : 0.45; if (R.t > t0) TourPanelFx.banner(ctx, R.banner, V.x + V.w / 2, V.y + V.h * 0.3, clamp((R.t - t0) / 0.25, 0, 1), R.dur - R.t); }
    this.drawHud(ctx);
    // the iris
    const I = this.iris;
    if (I.t < I.dur) {
      const s = this.toScreen(this.walker.x, this.walker.y - 14), k = I.close ? 1 - I.t / I.dur : I.t / I.dur, R2 = Math.hypot(W, H) * easeInOut(clamp(k, 0, 1));
      ctx.save(); ctx.fillStyle = I.col || '#07040e'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(s.x, s.y, Math.max(0.1, R2), 0, TAU, true); ctx.fill('evenodd'); ctx.restore();
    }
  }
  // trails being drawn right now: a reveal growing, a roadblock clearing, the trail into a stop that is popping
  drawTrailsLive(ctx) {
    const R = this.reveal, K = this.clears;
    if (R && R.P && !R.calm) { const k = clamp((R.t - 0.35) / 1.0, 0, 1); if (k > 0) { TourOWPaint.trail(ctx, this, R.P, R.edge.gold || !!R.r.gold, R.rev ? [R.P.len * (1 - k), R.P.len] : [0, R.P.len * k]); const h = OWGeo.at(R.P, R.rev ? R.P.len * (1 - k) : R.P.len * k); if (k < 1) { ctx.fillStyle = '#fff8d0'; ctx.beginPath(); TourKit.star(ctx, h.x, h.y, 5, 4 + Math.sin(this.t * 20) * 2, 9); ctx.fill(); } } }
    if (R && R.key) for (const e of this.edges) if (e.open && (e.a === R.key || e.b === R.key) && this.by[e.a === R.key ? e.b : e.a].visible) { const P = TourOW.curve(this.G, e); if (P) TourOWPaint.trail(ctx, this, P, e.gold, [0, P.len]); }
    if (K) for (const e of K.list) { const P = TourOW.curve(this.G, e); if (!P) continue; const k = clamp((K.t - 0.35) / (K.dur - 0.45), 0, 1); if (k > 0) TourOWPaint.trail(ctx, this, P, false, [0, P.len * k]); }
  }
  // a closed main trail: the Baron's roadblock at its middle (shakes and bursts when the trail opens)
  drawBlock(ctx, e) {
    const K = this.clears, clearing = K && K.list.indexOf(e) >= 0;
    if (clearing && K.burst) return;
    const P = TourOW.curve(this.G, e); if (!P) return;
    const m = OWGeo.at(P, P.len / 2), ang = Math.atan2(m.dy, m.dx);
    const shake = clearing ? Math.sin(K.t * 60) * 2.5 * (K.t / 0.35) : 0;
    TourOWPaint.roadblock(ctx, this, m.x + shake, m.y, ang, e.kind === 'port');
  }
  drawNode(ctx, n) {
    const R = this.reveal, popping = R && R.key === n.key;
    if (!n.visible && !popping) return;
    const p = this.G.pos[n.key]; let sc = 1;
    if (popping) sc = R.calm ? clamp(R.t / R.dur, 0, 1) : TourPanelFx.backOut(clamp(R.t / 0.45, 0, 1));
    if (sc <= 0.01) return;
    ctx.save(); ctx.translate(p.x, p.y); if (sc !== 1) ctx.scale(sc, sc);
    TourOWPaint.node(ctx, this, n, this.walker.at === n.key && !this.walker.seg);
    ctx.restore();
  }
  // the short name under (or beside) a stop
  labelBox(n) {
    const p = this.G.pos[n.key]; if (!p) return null;
    const text = TourOW.label(this.C, n).toUpperCase(), fs = 9.5, w = Math.min(130, text.length * fs * 0.64 + 12), h = 15;
    const side = p.side || 's', off = n.boss ? 30 : n.kind === 'start' || n.kind === 'port' ? 22 : 20;
    let x = p.x - w / 2, y = p.y + off;
    if (side === 'n') y = p.y - off - (n.boss ? 40 : 30) - h;
    if (side === 'e') { x = p.x + 24; y = p.y - h / 2 + 2; }
    if (side === 'w') { x = p.x - 24 - w; y = p.y - h / 2 + 2; }
    return { x, y, w, h, text, fs };
  }
  drawLabel(ctx, n) {
    const R = this.reveal; if (!n.visible && !(R && R.key === n.key && R.t > 0.45)) return;
    const b = this.labelBox(n); if (!b) return;
    const here = this.walker.at === n.key && !this.walker.seg;
    ctx.save();
    ctx.font = `${b.fs}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tw = Math.min(b.w - 8, ctx.measureText(b.text).width), w = tw + 12, x = b.x + (b.w - w) / 2;
    ctx.fillStyle = here ? 'rgba(255,216,74,0.95)' : n.kind === 'level' && !n.enter ? 'rgba(40,36,52,0.72)' : 'rgba(22,16,40,0.82)';
    rr(ctx, x, b.y, w, b.h, 7); ctx.fill();
    ctx.fillStyle = here ? '#2a1a08' : n.kind === 'level' && !n.enter ? 'rgba(255,255,255,0.55)' : n.secret ? '#ffe28a' : '#fff6e0';
    ctx.fillText(b.text, x + w / 2, b.y + b.h / 2 + 0.5, tw);
    ctx.restore();
  }
  drawWalker(ctx) {
    const w = this.walker, walking = !!w.seg, hop = w.hop > 0 ? Math.sin((1 - w.hop / 0.3) * Math.PI) * 9 : 0;
    const shake = w.shake > 0 ? Math.sin(this.t * 70) * 2 : 0; if (w.shake > 0) w.shake -= 1 / 60;
    for (const d of this.dust) { const k = d.age / 0.55; ctx.fillStyle = `rgba(255,248,225,${(1 - k) * 0.75})`; ctx.beginPath(); ctx.arc(d.x, d.y - k * 6, (2.5 + k * 7) * (d.s || 1), 0, TAU); ctx.fill(); }
    const node = !walking && this.by[w.at], lift = node ? (node.boss ? 2 : node.kind === 'level' ? 7 : 4) : 0;
    const x = w.x + shake, y = w.y - lift - hop;
    ctx.fillStyle = 'rgba(20,14,30,0.3)'; ctx.beginPath(); ctx.ellipse(w.x, w.y - lift + 1, 9 - hop * 0.3, 3, 0, 0, TAU); ctx.fill();
    const o = { x, y, facing: w.facing, small: true, power: 0, look: Save.data.look, time: this.t, scale: 0.86,
      anim: walking ? { state: 'run', t: this.t, phase: w.t * 13, speed: 0.85 } : hop > 0 ? { state: 'jump', t: this.t, phase: 0 } : { state: 'idle', t: this.t, phase: 0 } };
    Ink.around(ctx, x - 12, y - 32, 24, 32, c => drawBrady(c, o), { pad: 14, width: 0.95, color: '#120e16' });
    // the stop he stands on: a soft bobbing marker over his head
    if (!walking && !this.reveal && !this.clears && node && node.enter && (node.kind === 'level' || node.kind === 'house' || node.kind === 'port')) {
      const by = y - 40 + Math.sin(this.t * 4) * 2.5;
      ctx.fillStyle = '#ffd84a'; ctx.strokeStyle = Ink.color; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 6, by - 7); ctx.lineTo(x + 6, by - 7); ctx.lineTo(x, by); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  /* ---------- the HUD: the land chip, the world and menu buttons, the info card, the touch controls ---------- */
  drawHud(ctx) {
    if (this.fixed) return;
    const W = Game.cssW, H = Game.cssH, C = this.C, cols = C.colors, R = this.chipR;
    ctx.save();
    if (this.portrait) { // the pad under the map
      const y = this.view.h; const g = ctx.createLinearGradient(0, y, 0, H); g.addColorStop(0, '#1a1230'); g.addColorStop(1, '#0a0614'); ctx.fillStyle = g; ctx.fillRect(0, y, W, H - y);
      ctx.fillStyle = rgba(cols.a, 0.7); ctx.fillRect(0, y, W, 2);
    }
    // the land chip: name, levels and postcards
    let done = 0, n = 0, gold = 0;
    for (const id of Tour.levelIds(C)) { const L = Tour.specOf(id); if (L.secret && !TourProgress.isRevealed(id)) continue; n++; if (Save.data.done[id]) done++; gold += TourProgress.goldCount(id); }
    ctx.font = `13px ${FONT_DISPLAY}`; const name = C.name.toUpperCase(), nw = ctx.measureText(name).width;
    ctx.font = `11px ${FONT_UI}`; const stat = `✓ ${done}/${n}   ✉ ${gold}/${n * 3}`, sw = ctx.measureText(stat).width;
    const cw = Math.max(nw, sw) + 34;
    ctx.fillStyle = 'rgba(16,10,30,0.8)'; rr(ctx, R.x, R.y, cw, R.h, 12); ctx.fill();
    ctx.fillStyle = cols.a; rr(ctx, R.x + 6, R.y + 6, 5, R.h - 12, 2.5); ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = `13px ${FONT_DISPLAY}`; ctx.fillStyle = '#fff'; ctx.fillText(name, R.x + 18, R.y + 12);
    ctx.font = `11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,240,210,0.85)'; ctx.fillText(stat, R.x + 18, R.y + 27);
    // world + menu buttons
    const B = this.scene.hudBtns;
    if (B) {
      const btn = (b, icon) => {
        ctx.fillStyle = 'rgba(16,10,30,0.78)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.save(); ctx.translate(b.x, b.y); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 1.6; icon(); ctx.restore();
      };
      btn(B.menu, () => { ctx.fillRect(-5, -6, 3.5, 12); ctx.fillRect(1.5, -6, 3.5, 12); });
      btn(B.world, () => { ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, 3.6, 8, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke(); });
    }
    if (!this.reveal && !this.clears && !this.air) this.drawCard(ctx);
    ctx.restore();
    if (!this.menu) Input.drawControls(ctx, 0.9);
    if (this.menu) {
      ctx.save(); ctx.fillStyle = 'rgba(6,4,14,0.6)'; ctx.fillRect(0, 0, W, H);
      ctx.font = `20px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('PAUSED', W / 2, this.menu[0].y - 26);
      UI.drawButtons(ctx, this.menu); ctx.restore();
    }
  }
  // the info card for the stop Brady stands on (or walks to)
  drawCard(ctx) {
    const w = this.walker, key = w.seg ? (w.queue.length ? w.queue[w.queue.length - 1] : w.seg.to) : w.at, n = this.by[key]; if (!n) return;
    const R = this.cardR, C = this.C, cols = C.colors, touch = Input.usingTouch || Game.forceTouchUI;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; rr(ctx, R.x, R.y + 3, R.w, R.h, 14); ctx.fill(); ctx.fillStyle = 'rgba(18,12,34,0.9)'; rr(ctx, R.x, R.y, R.w, R.h, 14); ctx.fill();
    ctx.strokeStyle = rgba(cols.a, 0.75); ctx.lineWidth = 1.4; rr(ctx, R.x, R.y, R.w, R.h, 14); ctx.stroke();
    // the badge
    const bx = R.x + 28, by = R.y + R.h / 2, br = 17;
    ctx.fillStyle = n.kind === 'level' ? (n.done ? '#ffd23a' : n.secret ? '#ffe28a' : cols.a) : n.kind === 'house' ? cols.c : '#7ad8ff';
    ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill(); ctx.strokeStyle = Ink.color; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#1c1426'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const badge = n.kind === 'level' ? n.id : n.kind === 'house' ? '$' : n.kind === 'bottle' ? '✉' : '✈';
    ctx.font = `${badge.length > 3 ? 9 : 11}px ${FONT_DISPLAY}`; ctx.fillText(badge, bx, by + 1);
    // name + details
    const tx = bx + br + 10, goW = 64, tw = R.x + R.w - tx - goW - 6;
    let title = '', type = '', tcol = '#8fd6c4';
    if (n.kind === 'level') { title = n.L.name; type = TourLandscape.label(n.L); if (n.boss) tcol = '#ffb27a'; else if (n.secret) tcol = '#ffd84a'; }
    else if (n.kind === 'house') { title = n.H.name || 'Souvenir Stand'; type = 'SOUVENIRS'; tcol = '#ffd84a'; }
    else if (n.kind === 'start') { title = C.name + ' airstrip'; type = 'FLY'; }
    else if (n.kind === 'port') { const N = Tour.nextCountry(C); title = n.enter ? (N ? 'Fly on to ' + N.name : 'Fly anywhere') : 'Port: opens when the boss falls'; type = 'PORT'; }
    else { title = 'Bottle Mail ' + n.n + '/5'; type = 'NOTE'; }
    ctx.textAlign = 'left'; ctx.font = `${R.w < 300 ? 11 : 13}px ${FONT_DISPLAY}`; ctx.fillStyle = '#fff';
    ctx.fillText(TourLandscape.fit(ctx, title.toUpperCase(), tw), tx, R.y + 17);
    let x = tx; const y2 = R.y + 38;
    ctx.font = `bold 9px ${FONT_UI}`; const tyw = ctx.measureText(type).width + 10;
    ctx.fillStyle = rgba(tcol, 0.22); rr(ctx, x, y2 - 7, tyw, 14, 5); ctx.fill(); ctx.fillStyle = tcol; ctx.fillText(type, x + 5, y2 + 0.5); x += tyw + 8;
    if (n.kind === 'level') {
      const g = Save.data.gold[n.id] || [];
      for (let q = 0; q < 3; q++) { ctx.fillStyle = g[q] ? '#fff4d8' : 'rgba(255,255,255,0.14)'; rr(ctx, x, y2 - 5, 13, 10, 2); ctx.fill(); if (g[q]) { ctx.fillStyle = cols.a; ctx.fillRect(x + 8.5, y2 - 3.5, 3, 3.5); ctx.strokeStyle = 'rgba(60,40,80,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + 2, y2 - 1); ctx.lineTo(x + 7, y2 - 1); ctx.moveTo(x + 2, y2 + 2); ctx.lineTo(x + 7, y2 + 2); ctx.stroke(); } x += 16; }
      x += 4;
      if (n.done) {
        const E = TourProgress.exitsFound(n.id);
        if (E.total > 1 && x + 50 < tx + tw) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = `bold 9px ${FONT_UI}`; ctx.fillText('EXITS', x, y2 + 0.5); x += 30; for (let q = 0; q < E.total; q++) { ctx.fillStyle = q < E.found ? '#7ae0ff' : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(x + 3, y2, 3.2, 0, TAU); ctx.fill(); x += 9; } x += 4; }
        const best = Save.data.best[n.id];
        if (best && x + 50 < tx + tw) { ctx.fillStyle = 'rgba(255,240,210,0.75)'; ctx.font = `11px ${FONT_UI}`; const m = Math.floor(best / 60), s = (best % 60).toFixed(1); ctx.fillText('⏱ ' + m + ':' + (s < 10 ? '0' : '') + s, x, y2 + 0.5); }
      } else if (!n.enter) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = `11px ${FONT_UI}`; ctx.fillText('locked', x, y2 + 0.5); }
    } else if (n.kind === 'house') { ctx.fillStyle = 'rgba(255,240,210,0.75)'; ctx.font = `11px ${FONT_UI}`; const v = (TourProgress.data().houses || {})[n.H.id] || 0; ctx.fillText(v ? 'visited ' + v + '×' : 'spend your coins', x, y2 + 0.5); }
    // go
    const can = !w.seg && n.enter;
    const gx = R.x + R.w - goW - 8, gy = R.y + (R.h - 34) / 2;
    ctx.fillStyle = can ? '#ffd84a' : 'rgba(255,255,255,0.12)'; rr(ctx, gx, gy, goW, 34, 12); ctx.fill();
    ctx.fillStyle = can ? '#2a1a08' : 'rgba(255,255,255,0.45)'; ctx.textAlign = 'center'; ctx.font = `11px ${FONT_DISPLAY}`;
    ctx.fillText(n.kind === 'start' || n.kind === 'port' ? 'FLY' : n.kind === 'bottle' ? 'READ' : 'GO', gx + goW / 2, gy + 12);
    ctx.font = `bold 8px ${FONT_UI}`; ctx.fillText(touch ? 'TAP / ▲' : 'ENTER', gx + goW / 2, gy + 25);
    ctx.restore();
  }
}
TourMapScene.Overworld = TourOverworld; TourMapScene.Graph = TourGraph; TourMapScene.OW = TourOW; TourMapScene.Geo = OWGeo;
