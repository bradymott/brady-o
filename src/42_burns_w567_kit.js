/* ============================================================
   BRADY-O BURNS — shared kit for Worlds 5, 6 and 7 (BW567K)
   Everything here is an extension built on the public engine API:
     · shape helpers (one per shape) over the smooth BurnsMesh primitives
     · BW567Puppet: a rigid-skinned "entity" registered through g.addBoss()
       so custom animated models (tentacles, carts, drones, unicycles) draw
       in one call each and update every step without touching the engine
     · a 2D overlay hook (def.bw567Overlay) for minigame / choice UI
     · BW567K.choice(): a tap-to-pick dialogue choice (cutscene based)
     · game-time timers, a player speed modifier, small helpers
   ============================================================ */

const BW567K = {
  geoCache: {},
  /* ---------------- shapes (local mesh space; switch implementations here) ---------------- */
  // rounded box centred at (cx, cy, cz)
  rbox(m, cx, cy, cz, w, h, d, r, o) {
    if (m.roundBox) m.roundBox(cx, cy, cz, w, h, d, r === undefined ? Math.min(w, h, d) * 0.22 : r, o || {});
    else m.bbox(cx, cy, cz, w, h, d, r === undefined ? Math.min(w, h, d) * 0.2 : r, o || {});
    return m;
  },
  ball(m, x, y, z, r, o) { if (m.ellipsoid) m.ellipsoid(x, y, z, r, r, r, o || {}); else m.sphere(x, y, z, r, 10, 6, { smooth: true }); return m; },
  ellip(m, x, y, z, rx, ry, rz, o) {
    if (m.ellipsoid) m.ellipsoid(x, y, z, rx, ry, rz, o || {});
    else { m.push(); m.tf(x, y, z, 0, 0, 0, rx, ry, rz); m.sphere(0, 0, 0, 1, 10, 6, { smooth: true }); m.pop(); }
    return m;
  },
  // surface of revolution placed at (x, y, z); profile [[r, y, col?, e?], ...] bottom -> top
  lathe(m, x, y, z, prof, o) {
    m.push(); m.tf(x, y, z);
    if (m.lathe) m.lathe(prof, o || {});
    else for (let k = 0; k < prof.length - 1; k++) { const a = prof[k], b = prof[k + 1]; if (b[1] > a[1]) m.cyl(0, a[1], 0, a[0], b[0], b[1] - a[1], (o && o.seg) || 12, { smooth: true, caps: false }); }
    m.pop();
    return m;
  },
  // tapered capsule between two points
  limb(m, x0, y0, z0, x1, y1, z1, r0, r1, o) { if (m.limb) m.limb(x0, y0, z0, x1, y1, z1, r0, r1 === undefined ? r0 : r1, o || {}); else m.rod(x0, y0, z0, x1, y1, z1, r0, 8, { smooth: true }); return m; },
  // cylinder with rounded rims (y = bottom)
  rcyl(m, x, y, z, r, h, edge, o) { if (m.roundCyl) m.roundCyl(x, y, z, r, h, edge === undefined ? Math.min(r, h) * 0.2 : edge, o || {}); else m.cyl(x, y, z, r, r, h, 12, { smooth: true }); return m; },
  torus(m, x, y, z, R, r, o) { if (m.torus) m.torus(x, y, z, R, r, o || {}); else m.cyl(x, y - r, z, R + r, R + r, r * 2, 14, {}); return m; },
  // smooth tube along a polyline pts [[x,y,z]...] with radii rads[] (tip capped with a hemisphere)
  tube(m, pts, rads, o) {
    o = o || {};
    const n = pts.length, seg = o.seg || 9, capK = o.cap === false ? 0 : 3;
    if (n < 2 || !m.grid) { for (let i = 0; i < n - 1; i++) this.limb(m, pts[i][0], pts[i][1], pts[i][2], pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], rads[i], rads[i + 1]); return m; }
    // parallel-transport frames
    const T = [], N = [], B = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const l = Math.hypot(tx, ty, tz) || 1; T.push([tx / l, ty / l, tz / l]);
    }
    const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    let up = Math.abs(T[0][1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    N.push(norm(cross(cross(T[0], up), T[0]))); B.push(norm(cross(T[0], N[0])));
    for (let i = 1; i < n; i++) { const b0 = cross(T[i], N[i - 1]); const ni = norm(cross(b0, T[i])); N.push(ni); B.push(norm(cross(T[i], ni))); }
    const rows = n + capK, last = n - 1;
    m.grid(seg, rows, true, (i, j, out) => {
      const a = i / seg * TAU, ca = Math.cos(a), sa = Math.sin(a);
      if (j < n) {
        const r = rads[j], P = pts[j];
        const nx = ca * N[j][0] + sa * B[j][0], ny = ca * N[j][1] + sa * B[j][1], nz = ca * N[j][2] + sa * B[j][2];
        out.p[0] = P[0] + nx * r; out.p[1] = P[1] + ny * r; out.p[2] = P[2] + nz * r; out.n[0] = nx; out.n[1] = ny; out.n[2] = nz;
      } else {
        const k = j - n + 1, ph = k / capK * Math.PI / 2, r = rads[last] * Math.cos(ph), P = pts[last], t = T[last], ad = rads[last] * Math.sin(ph);
        const rx = ca * N[last][0] + sa * B[last][0], ry = ca * N[last][1] + sa * B[last][1], rz = ca * N[last][2] + sa * B[last][2];
        out.p[0] = P[0] + t[0] * ad + rx * r; out.p[1] = P[1] + t[1] * ad + ry * r; out.p[2] = P[2] + t[2] * ad + rz * r;
        const nx = rx * Math.cos(ph) + t[0] * Math.sin(ph), ny = ry * Math.cos(ph) + t[1] * Math.sin(ph), nz = rz * Math.cos(ph) + t[2] * Math.sin(ph);
        out.n[0] = nx; out.n[1] = ny; out.n[2] = nz;
      }
      if (o.colFn) { const c = o.colFn(i, j, a); if (c) out.col = burnsRGB(c); }
    });
    return m;
  },
  // classic heart outline (CCW), unit height ~1, centred near the origin
  heartOutline(n) {
    const pts = []; n = n || 40;
    for (let i = 0; i < n; i++) { const t = i / n * TAU; const x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); pts.push([x / 32, (y + 3) / 30]); }
    return pts.reverse();
  },
  // puffy extrusion of a 2D outline (XY plane, CCW) centred on z = 0, thickness depth, facing +Z
  pillow(m, outline, depth, o) {
    o = o || {};
    const n = outline.length, rr = depth / 2, K = o.rings || 6;
    // outward 2D normals (averaged, mitred, clamped)
    const nrm = [];
    for (let i = 0; i < n; i++) {
      const a = outline[(i + n - 1) % n], p = outline[i], b = outline[(i + 1) % n];
      const e1 = [p[0] - a[0], p[1] - a[1]], e2 = [b[0] - p[0], b[1] - p[1]];
      const l1 = Math.hypot(e1[0], e1[1]) || 1, l2 = Math.hypot(e2[0], e2[1]) || 1;
      const n1 = [e1[1] / l1, -e1[0] / l1], n2 = [e2[1] / l2, -e2[0] / l2];
      let nx = n1[0] + n2[0], ny = n1[1] + n2[1]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const mit = clamp(1 / Math.max(0.35, nx * n1[0] + ny * n1[1]), 1, 1.8);
      nrm.push([nx, ny, mit]);
    }
    const inset = o.inset === undefined ? rr : o.inset;
    m.grid(n, K + 1, true, (i, j, out) => {
      const ph = -Math.PI / 2 + j / K * Math.PI, c = Math.cos(ph), s = Math.sin(ph), N = nrm[i], P = outline[i];
      const k = inset * (1 - c) * N[2];
      out.p[0] = P[0] - N[0] * k; out.p[1] = P[1] - N[1] * k; out.p[2] = rr * s;
      out.n[0] = N[0] * c; out.n[1] = N[1] * c; out.n[2] = s;
      if (o.colFn) { const cc = o.colFn(i, j, s); if (cc) out.col = burnsRGB(cc); }
    });
    // flat caps (front + back)
    const capPts = outline.map((P, i) => [P[0] - nrm[i][0] * inset * nrm[i][2], P[1] - nrm[i][1] * inset * nrm[i][2]]);
    let cx = 0, cy = 0; for (const p of capPts) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
    const col0 = m.c;
    if (o.capCol) m.c = burnsRGB(o.capCol);
    for (const tri of BurnsMesh.earcut(capPts)) {
      m.poly(tri.map(i => [capPts[i][0], capPts[i][1], rr]), null, [cx, cy, -1e3]);
      m.poly(tri.map(i => [capPts[i][0], capPts[i][1], -rr]), null, [cx, cy, 1e3]);
    }
    m.c = col0;
    return m;
  },
  /* ---------------- world placement (with colliders) ---------------- */
  // rounded platform box, y = bottom (falls back to a bevelled box)
  rb(api, x, y, z, w, h, d, col, o) {
    o = o || {};
    if (api.roundBox) return api.roundBox(x, y, z, w, h, d, col, o);
    return api.box(x, y, z, w, h, d, col, Object.assign({ bevel: Math.min(w, h, d) * 0.2 }, o));
  },
  // rounded post / pillar
  post(api, x, y, z, r, h, col, o) {
    o = o || {};
    if (api.cylinder) return api.cylinder(x, y, z, r, h, col, o);
    return api.mesh(x, z, m => { m.color(col, o.e || 0); m.cyl(0, 0, 0, r, r, h, 10, { smooth: true }); m.emissive(0); return { cols: o.noCol ? [] : [{ t: 'cyl', x: 0, z: 0, r, y0: 0, y1: h }] }; }, { y });
  },
  ballAt(api, x, y, z, r, col, o) {
    o = o || {};
    if (api.sphere) return api.sphere(x, y, z, r, col, o);
    return api.mesh(x, z, m => { m.color(col, o.e || 0); m.sphere(0, r, 0, r, 10, 6, { smooth: true }); m.emissive(0); return { cols: o.noCol ? [] : [{ t: 'dome', x: 0, z: 0, r, y0: r }] }; }, { y });
  },
  /* ---------------- runtime helpers ---------------- */
  // game-time timers (pause with the game). Call BW567K.tick(g, dt) from the world update.
  after(g, sec, fn) { (g.bw567timers || (g.bw567timers = [])).push({ t: sec, fn }); },
  tick(g, dt) {
    const L = g.bw567timers; if (!L || !L.length) return;
    for (const t of L.slice()) { t.t -= dt; if (t.t <= 0 && !t.done) { t.done = true; try { t.fn(g); } catch (e) { Game.reportError ? Game.reportError(e) : console.error(e); } } }
    g.bw567timers = L.filter(t => !t.done);
  },
  // player speed multiplier (g.bw567speed, 1 = normal) layered over the engine's own
  speedHook(g) {
    const p = g.player; if (!p || p.bw567speedHooked) return;
    const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(p), 'speedMul');
    if (!desc || !desc.get) return;
    Object.defineProperty(p, 'speedMul', { configurable: true, get() { return desc.get.call(this) * (g.bw567speed === undefined ? 1 : g.bw567speed); } });
    p.bw567speedHooked = true;
  },
  // a boss-bar wrapper for an actor-based (sub)boss
  bar(name, a, maxHp, extra) {
    return Object.assign({ name, maxHp, active: true, get hp() { return Math.max(0, a.hp); }, get defeated() { return a.defeated; }, get st() { return a.data && a.data.mode; }, head() { return [a.x, a.y + a.h * 1.05, a.z]; }, update() {} }, extra || {});
  },
  // cached skinned geometry: build(m) once per session
  geo(key, build) {
    let G = this.geoCache[key];
    if (!G) { const m = new BurnsMesh(4096); build(m); G = m.geo(); this.geoCache[key] = G; }
    return G;
  },
  hurtNear(g, x, y, z, r, dmg, kb) {
    const p = g.player; if (p.dead) return false;
    if (Math.hypot(p.x - x, p.z - z) < r + p.r && p.y < y + 1.4 && p.y + p.h > y - 0.2) return p.hurt(dmg || 1, x, z, kb || 7);
    return false;
  },
  /* ---------------- dialogue choices ---------------- */
  // o: { who, prompt, options: [text...], def (index used on SKIP), done(g, i), cam }
  choice(g, o) {
    const st = { o, picked: null, focus: 0, t: 0, btns: [] };
    const steps = [];
    if (o.cam) steps.push({ cam: o.cam });
    steps.push({ do: g2 => { g2.bw567choice = st; } });
    steps.push({ until: g2 => { st.t += 1 / 120; return BW567K.choiceStep(g2, st); } });
    steps.push({ do: g2 => { g2.bw567choice = null; const i = st.picked === null ? (o.def || 0) : st.picked; BW567K.after(g2, 0.02, g3 => { if (o.done) o.done(g3, i); }); } });
    g.cutscene(steps, null, { letterbox: true });
    return st;
  },
  choiceStep(g, st) {
    if (st.t < 0.3) return false;
    const n = st.o.options.length;
    for (const t of Input.taps) for (const b of st.btns) if (t.x >= b.x && t.x <= b.x + b.w && t.y >= b.y && t.y <= b.y + b.h) { st.picked = b.i; burnsSfx('select'); return true; }
    const k = Input.uiKey;
    if (k === 'up' || k === 'left') { st.focus = (st.focus + n - 1) % n; burnsSfx('select', { vol: 0.4 }); }
    if (k === 'down' || k === 'right') { st.focus = (st.focus + 1) % n; burnsSfx('select', { vol: 0.4 }); }
    if (k === 'enter' || Input.jumpPressed || Input.actionPressed) { st.picked = st.focus; burnsSfx('select'); return true; }
    if (st.forced !== undefined) { st.picked = st.forced; return true; }
    return false;
  },
  drawChoice(ctx, g) {
    const st = g.bw567choice; if (!st || !g.cine) return;
    const W = Game.cssW, H = Game.cssH, S = BurnsUI.safe(), o = st.o, n = o.options.length, portrait = H > W;
    const a = clamp(st.t / 0.25, 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    const pw = Math.min(W - S.l - S.r - 8, portrait ? 520 : 760);
    const px = (W - pw) / 2;
    ctx.font = `600 ${portrait ? 13 : 14}px ${FONT_UI}`;
    const lines = BurnsUI.wrap(ctx, o.prompt || '', pw - 36);
    const bh = portrait ? 44 : 40, gap = 8;
    const optW = portrait ? pw - 24 : (pw - 24 - gap * (n - 1)) / n;
    const optH = portrait ? bh : Math.max(bh, 46);
    const ph = 22 + lines.length * 18 + 12 + (portrait ? n * (optH + gap) : optH) + 14 + (o.who ? 16 : 0);
    const py = H - S.b - ph - H * 0.11;
    ctx.fillStyle = 'rgba(14,6,28,0.88)'; rr(ctx, px, py, pw, ph, 16); ctx.fill();
    ctx.strokeStyle = 'rgba(255,79,216,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    let y = py + 20;
    if (o.who) { BurnsUI.text(ctx, o.who, px + 18, y, 12, '#ffd84a', { align: 'left' }); y += 18; }
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (const l of lines) { ctx.fillText(l, px + 18, y); y += 18; }
    y += 6;
    st.btns = [];
    for (let i = 0; i < n; i++) {
      const bx = portrait ? px + 12 : px + 12 + i * (optW + gap), by = portrait ? y + i * (optH + gap) : y;
      const foc = st.focus === i;
      ctx.fillStyle = foc ? 'rgba(255,79,216,0.45)' : 'rgba(255,255,255,0.1)'; rr(ctx, bx, by, optW, optH, 12); ctx.fill();
      ctx.strokeStyle = foc ? '#ff9ad8' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = foc ? 2.5 : 1.2; ctx.stroke();
      ctx.font = `600 12px ${FONT_UI}`;
      const ol = BurnsUI.wrap(ctx, o.options[i], optW - 20).slice(0, 2);
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
      ol.forEach((l, k) => ctx.fillText(l, bx + optW / 2, by + optH / 2 + (k - (ol.length - 1) / 2) * 15));
      st.btns.push({ x: bx, y: by, w: optW, h: optH, i });
    }
    ctx.restore();
  }
};

/* ---------------- 2D overlay hook: worlds may define def.bw567Overlay(ctx, g, fdt) ---------------- */
(() => {
  const prev = BurnsUI.drawOverlay;
  BurnsUI.drawOverlay = function (ctx, g, fdt) {
    prev.call(this, ctx, g, fdt);
    if (!g || g.state !== 'play' || g.paused) return;
    try {
      if (g.bw567choice) BW567K.drawChoice(ctx, g);
      const d = g.def; if (d && d.bw567Overlay) d.bw567Overlay(ctx, g, fdt);
    } catch (e) { if (Game.reportError) Game.reportError(e); }
  };
})();

/* ---------------- rigid-skinned entity (drawn by the engine's boss pass) ----------------
   geo: BurnsMesh geometry whose vertices use bones 0..n-1. Pose with set()/child()/off().
   Register with g.addBoss(puppet). Optional: puppet.tick(dt) logic, puppet.sprites(R). */
class BW567Puppet {
  constructor(g, geo, n, o) {
    this.g = g; this.n = n; this.model = { geo }; this.ch = { bones: new Float32Array(n * 12), nb: n, face: 0 };
    this.hidden = false; this.t = 0; this._m = new Float32Array(12); this.o = o || {};
    for (let i = 0; i < n; i++) this.off(i);
  }
  set(i, x, y, z, yaw, pitch, roll, s) { const k = s === undefined ? 1 : s; BurnsM.a34Set(this.ch.bones, i * 12, x, y, z, yaw || 0, pitch || 0, roll || 0, k, k, k); return this; }
  // bones[i] = P[pk..] * TRS (hierarchies: tentacle segments, wheels)
  child(i, P, pk, x, y, z, yaw, pitch, roll, s) { const k = s === undefined ? 1 : s; BurnsM.a34Set(this._m, 0, x, y, z, yaw || 0, pitch || 0, roll || 0, k, k, k); BurnsM.a34Mul(this.ch.bones, i * 12, P, pk, this._m, 0); return this; }
  off(i) { const B = this.ch.bones, k = i * 12; B.fill(0, k, k + 12); B[k + 7] = -999; return this; }
  update(dt) { this.t += dt; if (this.tick) this.tick(dt); }
  draw(R) { if (this.sprites) this.sprites(R); }
}
