/* ============================================================
   BRADY GOES TO BURNING MAN — World 11 kit (Sound Camp Crawl)
   Layout, helpers, set-piece builders, bike traffic, ambient lasers and the
   2D overlay (offerings tracker, item pop, choice picker, duel HUD).
   World definition: 42_burns_world11.js · Thunderdome duel: 42_burns_w11_dome.js
   The named sound camps (Root Society, Opulent Temple, Camp Question Mark, plus
   the extra venues Playground, The Deep End and Disorient) are real camps shown
   by name only: every stage here is our own design capturing the vibe, not a
   replica. Playground's founder appears only as a name on a schedule board and
   in crowd chatter: no likeness, no lines.
   ============================================================ */

const BW11 = {
  state: null,
  // world layout (x east, z south; the open playa is north, the city south)
  P: {
    spawn: { x: -197, z: 76, yaw: 2.25 },
    esp: [[-232, -2], [-170, 6], [-100, 20], [0, 30], [100, 20], [170, 6], [232, -2]],
    loop: { x: -150, z: 44 },
    root: { x: -184, z: -50 },
    rootFloor: { x: -184, z: -24, r: 10.5 },
    curt: { x: -210, z: -20 },
    temple: { x: -112, z: -70 },
    templeFloor: { x: -112, z: -38, r: 12.5 },
    vip: { x: -84, z: -60 },
    qm: { x: 102, z: -66 },
    qmFloor: { x: 102, z: -38, r: 11.5 },
    dome: { x: 182, z: -26, R: 12 },
    wob: { x: 150, z: -122 },
    wobFloor: { x: 150, z: -97, r: 12 },
    cheese: { x: 0, z: 52 },
    // extra venues (side content): The Deep End (10:00, deep playa), Playground + Disorient (2:00)
    deep: { x: -160, z: -128 },
    deepFloor: { x: -160, z: -110, r: 11 },
    dive: { x: -137, z: -121 },
    play: { x: 206, z: -124 },
    playFloor: { x: 206, z: -100, r: 13 },
    lounge: { x: 184, z: -77 },
    dis: { x: 84, z: -132 },
    disFloor: { x: 84, z: -114, r: 10 }
  },
  ITEMS: [
    { id: 'talisman', mission: 'cable', name: 'ROOT-WOOD TALISMAN', camp: 'Root Society', col: '#7aff5a' },
    { id: 'jack', mission: 'vip', name: 'GOLDEN HEADPHONE JACK', camp: 'Opulent Temple', col: '#ffd84a' },
    { id: 'charm', mission: 'usb', name: 'GLOWING "?" CHARM', camp: 'Camp Question Mark', col: '#38f2ff' },
    { id: 'buckle', mission: 'dome', name: 'CHAMPION SKULL BUCKLE', camp: 'Thunderdome', col: '#ff5a3a' }
  ],
  type(t, fb) { return (typeof BURNS_NPC_TYPES !== 'undefined' && BURNS_NPC_TYPES[t]) ? t : (fb || 'burner'); },
  has(item) { return !!BurnsSave.flag(11, 'item_' + item); },
  give(g, item) {
    const I = BW11.ITEMS.find(k => k.id === item); if (!I) return;
    const isNew = !BW11.has(item); BurnsSave.flag(11, 'item_' + item, true);
    if (!isNew) return;
    const n = BW11.ITEMS.filter(k => BW11.has(k.id)).length;
    g.banner(I.name, `Offering ${n} of 4 for DJ Alkali`, { col: I.col, big: true });
    burnsSfx('gold'); g.fx.burst(g.player.x, g.player.y + 2.2, g.player.z, 'star', 16, I.col);
    BW11.state.itemPop = { id: item, t: 0 };
  },
  // game-time timers (pause with the game)
  after(g, sec, fn) { const S = BW11.state; (S.timers || (S.timers = [])).push({ t: sec, fn }); },
  tick(g, dt) {
    const S = BW11.state; if (!S.timers || !S.timers.length) return;
    for (const t of S.timers.slice()) { t.t -= dt; if (t.t <= 0 && !t.done) { t.done = true; try { t.fn(g); } catch (e) { Game.reportError(e); } } }
    S.timers = S.timers.filter(t => !t.done);
  },
  // point along a polyline at distance s; out: {x, z, yaw}
  along(pts, s, out) {
    out = out || {};
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (s <= l || i === pts.length - 2) { const k = clamp(s / l, 0, 1); out.x = lerp(a[0], b[0], k); out.z = lerp(a[1], b[1], k); out.yaw = Math.atan2(b[0] - a[0], b[1] - a[1]); return out; }
      s -= l;
    }
    return out;
  },
  plen(pts) { let L = 0; for (let i = 0; i < pts.length - 1; i++) L += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return L; },
  // Esplanade height-free z at a given x (for placing things along the road)
  espZ(x) { const E = BW11.P.esp; for (let i = 0; i < E.length - 1; i++) if (x >= E[i][0] && x <= E[i + 1][0]) return lerp(E[i][1], E[i + 1][1], (x - E[i][0]) / (E[i + 1][0] - E[i][0])); return 0; }
};

/* ---------------- mesh helpers ---------------- */
// smooth tube through pts [[x,y,z]...]; rad (number or fn(t)); col(t) -> hex; em(t) -> 0..1
BW11.tube = function (m, pts, rad, col, em, o) {
  o = o || {};
  const n = pts.length, seg = o.seg || (m.lo ? 7 : 11);
  const T = [], N = [], Bn = [];
  const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; T.push(norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]])); }
  const up = Math.abs(T[0][1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  N.push(norm(cross(cross(T[0], up), T[0]))); Bn.push(norm(cross(T[0], N[0])));
  for (let i = 1; i < n; i++) { const nb = norm(cross(cross(T[i], N[i - 1]), T[i])); N.push(nb); Bn.push(norm(cross(T[i], nb))); }
  const R = typeof rad === 'function' ? rad : () => rad;
  m.grid(seg, n, true, (i, j, out) => {
    const a = i / seg * TAU, ca = Math.cos(a), sa = Math.sin(a), t = j / (n - 1), r = R(t), P = pts[j];
    const nx = ca * N[j][0] + sa * Bn[j][0], ny = ca * N[j][1] + sa * Bn[j][1], nz = ca * N[j][2] + sa * Bn[j][2];
    out.p[0] = P[0] + nx * r; out.p[1] = P[1] + ny * r; out.p[2] = P[2] + nz * r; out.n[0] = nx; out.n[1] = ny; out.n[2] = nz;
    if (col) out.col = burnsRGB(col(t));
    if (em) out.e = em(t);
  });
  // round end caps
  const c0 = m.c, e0 = m.e;
  for (const j of [0, n - 1]) { const P = pts[j], t = j / (n - 1), r = R(t) * 0.98; if (col) m.c = burnsRGB(col(t)); if (em) m.e = em(t); m.ellipsoid(P[0], P[1], P[2], r, r, r, { seg: seg, rings: 5 }); }
  m.c = c0; m.e = e0;
  return m;
};
// geodesic sphere edges (unit), upper hemisphere only: [[ax,ay,az,bx,by,bz], ...] + nodes
BW11.geodesic = function (freq) {
  const t = (1 + Math.sqrt(5)) / 2, V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; });
  const F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const key = p => p.map(v => Math.round(v * 1000)).join(',');
  const nodes = new Map(), edges = new Map();
  const nrm = (a, b, c, i, j, f) => { const k = f - i - j, x = a[0] * k + b[0] * i + c[0] * j, y = a[1] * k + b[1] * i + c[1] * j, z = a[2] * k + b[2] * i + c[2] * j, l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
  for (const f of F) {
    const a = V[f[0]], b = V[f[1]], c = V[f[2]];
    for (let i = 0; i < freq; i++) for (let j = 0; j < freq - i; j++) {
      const tris = [[nrm(a, b, c, i, j, freq), nrm(a, b, c, i + 1, j, freq), nrm(a, b, c, i, j + 1, freq)]];
      if (i + j < freq - 1) tris.push([nrm(a, b, c, i + 1, j, freq), nrm(a, b, c, i + 1, j + 1, freq), nrm(a, b, c, i, j + 1, freq)]);
      for (const T of tris) {
        if ((T[0][1] + T[1][1] + T[2][1]) / 3 < -0.02) continue;
        for (let e = 0; e < 3; e++) {
          const p = T[e], q = T[(e + 1) % 3]; const kp = key(p), kq = key(q);
          nodes.set(kp, p); nodes.set(kq, q);
          const ke = kp < kq ? kp + '|' + kq : kq + '|' + kp; if (!edges.has(ke)) edges.set(ke, [p, q]);
        }
      }
    }
  }
  const clampY = p => [p[0], Math.max(0, p[1]), p[2]];
  return { edges: Array.from(edges.values()).map(e => [clampY(e[0]), clampY(e[1])]), nodes: Array.from(nodes.values()).map(clampY) };
};

/* ---------------- 2D item icons (vector, for the offerings HUD) ---------------- */
BW11.icon = function (ctx, id, x, y, s, alpha) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 40, s / 40); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
  const glow = c => { ctx.shadowColor = c; ctx.shadowBlur = 10; };
  if (id === 'talisman') {
    glow('#7aff5a');
    const g = ctx.createRadialGradient(-5, -6, 2, 0, 0, 18); g.addColorStop(0, '#c8925a'); g.addColorStop(1, '#6a4020');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#4a2a14'; ctx.lineWidth = 2; for (let r = 5; r < 16; r += 4) { ctx.beginPath(); ctx.arc(1, 1, r, 0.3, 5.6); ctx.stroke(); }
    glow('#7aff5a'); ctx.strokeStyle = '#9aff7a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -9); ctx.moveTo(0, -2); ctx.lineTo(-7, -8); ctx.moveTo(0, 3); ctx.lineTo(7, -4); ctx.stroke();
    ctx.strokeStyle = '#d8b070'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, -20); ctx.stroke();
  } else if (id === 'jack') {
    glow('#ffd84a'); ctx.rotate(-0.6);
    const g = ctx.createLinearGradient(-6, 0, 6, 0); g.addColorStop(0, '#a87818'); g.addColorStop(0.5, '#fff0a0'); g.addColorStop(1, '#b8861a');
    ctx.fillStyle = g; rr(ctx, -6, -2, 12, 20, 4); ctx.fill();
    ctx.fillStyle = '#e8d070'; rr(ctx, -3.5, -18, 7, 17, 3); ctx.fill();
    ctx.fillStyle = '#3a2a08'; ctx.fillRect(-3.5, -12, 7, 1.6); ctx.fillRect(-3.5, -7, 7, 1.6);
    ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.arc(0, -19, 3.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 18); ctx.quadraticCurveTo(4, 26, 12, 24); ctx.stroke();
  } else if (id === 'charm') {
    glow('#38f2ff');
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 18); g.addColorStop(0, 'rgba(56,242,255,0.5)'); g.addColorStop(1, 'rgba(154,107,255,0.15)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 17, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = `28px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 2);
  } else if (id === 'buckle') {
    glow('#ff5a3a');
    const g = ctx.createLinearGradient(0, -14, 0, 14); g.addColorStop(0, '#e8e8f0'); g.addColorStop(1, '#6a6a78');
    ctx.fillStyle = g; rr(ctx, -18, -13, 36, 26, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(0, -2, 8, Math.PI, 0); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8e8f0'; ctx.beginPath(); ctx.arc(-3.2, -2.5, 2.2, 0, TAU); ctx.arc(3.2, -2.5, 2.2, 0, TAU); ctx.fill();
    ctx.fillRect(-4, 3, 1.5, 3); ctx.fillRect(-0.75, 3, 1.5, 3); ctx.fillRect(2.5, 3, 1.5, 3);
  }
  ctx.restore();
};

/* ---------------- overlay: offerings, item pop, choices, duel HUD ---------------- */
(() => {
  const prev = BurnsUI.drawOverlay;
  BurnsUI.drawOverlay = function (ctx, g, fdt) {
    prev.call(this, ctx, g, fdt);
    if (!g || g.worldId !== 11 || !BW11.state || g.state !== 'play' || g.paused) return;
    try { BW11.overlay(ctx, g, fdt); } catch (e) { Game.reportError(e); }
  };
})();
BW11.overlay = function (ctx, g, fdt) {
  const S = BW11.state, W = Game.cssW, H = Game.cssH, sf = BurnsUI.safe();
  // offerings tracker (under the HUD counters) once Brady knows about them
  if (!g.cine && S.showOfferings && !g.dialog.open) {
    const ds = Math.min(24, W / 26), y0 = sf.t + 8 + ds * 1.4 + 3 * 28 + 40, x0 = sf.l + 6;
    BurnsUI.pill(ctx, x0, y0, 128, 30, 'rgba(10,6,24,0.55)', 'rgba(255,255,255,0.15)');
    BW11.ITEMS.forEach((I, i) => { const on = BW11.has(I.id); ctx.save(); if (!on) { ctx.globalAlpha = 0.35; } BW11.icon(ctx, I.id, x0 + 17 + i * 31, y0 + 15, 22, on ? 1 : 0.3); ctx.restore(); if (!on) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(x0 + 17 + i * 31, y0 + 15, 11, 0, TAU); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke(); } });
    BurnsUI.text(ctx, 'OFFERINGS', x0 + 64, y0 + 38, 8, 'rgba(255,255,255,0.65)', { stroke: false, ui: true });
  }
  // item pop: big icon flies into the tracker
  const ip = S.itemPop;
  if (ip) {
    ip.t += fdt; const k = ip.t;
    if (k > 2.6) S.itemPop = null;
    else {
      const a = clamp(k / 0.25, 0, 1) * clamp((2.6 - k) / 0.4, 0, 1), sc = 1 + Math.max(0, 0.3 - k) * 2;
      const fly = clamp((k - 1.8) / 0.8, 0, 1), tx = lerp(W / 2, sf.l + 60, easeInOut(fly)), ty = lerp(H * 0.62, sf.t + 170, easeInOut(fly));
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.arc(tx, ty, 46 * sc * (1 - fly * 0.6), 0, TAU); ctx.fill(); ctx.restore();
      BW11.icon(ctx, ip.id, tx, ty, 74 * sc * (1 - fly * 0.6), a);
    }
  }
  if (g.bw11choice) BW11.drawChoice(ctx, g);
  if (BW11Dome.active) BW11Dome.hud(ctx, g, fdt);
};

/* ---------------- choice picker (cutscene based: tap an option) ---------------- */
// o: { who, prompt, options: [text...], def, done(g, i) }
BW11.choice = function (g, o) {
  const st = { o, picked: null, focus: 0, t: 0, btns: [] };
  g.cutscene([
    // ambient chatter stays quiet while Brady picks (bubbles would cover the picker)
    { do: g2 => { g2.bw11choice = st; for (const a of g2.actors) if (a.friendly && a.bubbleText) { a.bubbleText = null; a.bubbleT = 0; } } },
    { until: g2 => { st.t += 1 / 120; for (const a of g2.actors) if (a.chatT < 2) a.chatT = 2; return BW11.choiceStep(g2, st); } },
    { do: g2 => { g2.bw11choice = null; const i = st.picked === null ? (o.def || 0) : st.picked; BW11.after(g2, 0.02, g3 => { if (o.done) o.done(g3, i); }); } }
  ], null, { letterbox: true });
  return st;
};
BW11.choiceStep = function (g, st) {
  if (st.t < 0.35) return false;
  const n = st.o.options.length;
  for (const t of Input.taps) for (const b of st.btns) if (t.x >= b.x && t.x <= b.x + b.w && t.y >= b.y && t.y <= b.y + b.h) { st.picked = b.i; burnsSfx('select'); return true; }
  const k = Input.uiKey;
  if (k === 'up' || k === 'left') { st.focus = (st.focus + n - 1) % n; burnsSfx('select', { vol: 0.4 }); }
  if (k === 'down' || k === 'right') { st.focus = (st.focus + 1) % n; burnsSfx('select', { vol: 0.4 }); }
  if (k === 'enter' || Input.jumpPressed || Input.actionPressed) { st.picked = st.focus; burnsSfx('select'); return true; }
  if (st.forced !== undefined) { st.picked = st.forced; return true; }
  return false;
};
BW11.drawChoice = function (ctx, g) {
  const st = g.bw11choice; if (!st || !g.cine) return;
  const W = Game.cssW, H = Game.cssH, S = BurnsUI.safe(), o = st.o, n = o.options.length, port = H > W;
  ctx.save(); ctx.globalAlpha = clamp(st.t / 0.25, 0, 1);
  const pw = Math.min(W - S.l - S.r - 8, port ? 520 : 780), px = (W - pw) / 2;
  ctx.font = `600 ${port ? 13 : 14}px ${FONT_UI}`;
  const lines = BurnsUI.wrap(ctx, o.prompt || '', pw - 36);
  const optW = port ? pw - 24 : (pw - 24 - 8 * (n - 1)) / n, optH = port ? 46 : 52;
  const ph = 26 + lines.length * 18 + 12 + (port ? n * (optH + 8) : optH) + 12 + (o.who ? 16 : 0), py = H - S.b - ph - H * 0.1;
  ctx.fillStyle = 'rgba(14,6,28,0.9)'; rr(ctx, px, py, pw, ph, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(255,79,216,0.7)'; ctx.lineWidth = 2; ctx.stroke();
  let y = py + 20;
  if (o.who) { BurnsUI.text(ctx, o.who, px + 18, y, 12, '#ffd84a', { align: 'left' }); y += 18; }
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const l of lines) { ctx.fillText(l, px + 18, y); y += 18; }
  y += 6; st.btns = [];
  for (let i = 0; i < n; i++) {
    const bx = port ? px + 12 : px + 12 + i * (optW + 8), by = port ? y + i * (optH + 8) : y, foc = st.focus === i;
    ctx.fillStyle = foc ? 'rgba(255,79,216,0.45)' : 'rgba(255,255,255,0.1)'; rr(ctx, bx, by, optW, optH, 12); ctx.fill();
    ctx.strokeStyle = foc ? '#ff9ad8' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = foc ? 2.5 : 1.2; ctx.stroke();
    ctx.font = `600 12px ${FONT_UI}`; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center';
    const ol = BurnsUI.wrap(ctx, o.options[i], optW - 20).slice(0, 3);
    ol.forEach((l, k) => ctx.fillText(l, bx + optW / 2, by + optH / 2 + (k - (ol.length - 1) / 2) * 14));
    st.btns.push({ x: bx, y: by, w: optW, h: optH, i });
  }
  ctx.restore();
};

/* ---------------- ambient lasers + beams (sprites) ---------------- */
BW11.beamReg = null;
BW11.beam = function (R, x0, y0, z0, x1, y1, z1, w, col, a, segs) {
  const S = BURNS_SPRITES.R, B = R.B; if (!B || !S || !S.streak || !R.bbs || !R.bbs.quad) return;
  const reg = BW11.beamReg || (BW11.beamReg = { u0: lerp(S.streak.u0, S.streak.u1, 0.42), u1: lerp(S.streak.u0, S.streak.u1, 0.58), v0: S.streak.v0, v1: S.streak.v1 });
  segs = segs || 4;
  for (let i = 0; i < segs; i++) {
    const u0 = i / segs, u1 = (i + 1) / segs;
    const ax = lerp(x0, x1, u0), ay = lerp(y0, y1, u0), az = lerp(z0, z1, u0), bx = lerp(x0, x1, u1), by = lerp(y0, y1, u1), bz = lerp(z0, z1, u1);
    const dx = bx - ax, dy = by - ay, dz = bz - az, px = dx * B.rx + dy * B.ry + dz * B.rz, py = dx * B.ux + dy * B.uy + dz * B.uz, l = Math.hypot(px, py) || 1;
    R.bbs.quad((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, px / 2, py / 2, -py / l * w / 2, px / l * w / 2, reg, col[0] * a, col[1] * a, col[2] * a, 0);
  }
};
// laser rigs: { x, y, z, yaw, n, spread, col: [[r,g,b]...], rate, len, tilt }
// every input is guarded: a laser with no phase/colours, a NaN clock or a missing sprite never throws
BW11.drawLasers = function (g, R) {
  const S = BW11.state, cam = g && g.cam;
  if (!S || !Array.isArray(S.lasers) || !cam || !R || !R.bbs || BW11.lasersOff) return;
  const t = Number.isFinite(g.time) ? g.time : 0, glow = BURNS_SPRITES.R && BURNS_SPRITES.R.glow;
  try {
  for (const L of S.lasers) {
    if (!L || !Number.isFinite(L.x) || !Number.isFinite(L.z)) continue;
    const dx = L.x - cam.x, dz = L.z - cam.z; if (dx * dx + dz * dz > 260 * 260) continue;
    if (L.when && !L.when(g)) continue;
    const near = dx * dx + dz * dz < 90 * 90, n = Math.max(1, near ? (L.n | 0) || 1 : Math.ceil(((L.n | 0) || 1) / 2));
    const ph = +L.ph || 0, sweep = Math.sin(t * (L.rate || 0.8) + ph), nc = Array.isArray(L.col) ? L.col.length : 0, ci = nc ? ((Math.floor(t * 0.5 + ph) % nc) + nc) % nc : 0, cc = nc ? L.col[ci] : null, col = (cc && cc.length >= 3) ? cc : [1, 1, 1];
    if (glow) R.bbs.bb(L.x, L.y, L.z, 1.1, 1.1, glow, col, 0.9, true);
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0 : i / (n - 1) - 0.5, ang = (L.yaw || 0) + u * (L.spread || 1) + sweep * 0.5, el = (L.tilt || 0.18) + Math.sin(t * 0.9 + i + ph) * 0.12;
      const len = L.len || 60;
      BW11.beam(R, L.x, L.y, L.z, L.x + Math.sin(ang) * len * Math.cos(el), L.y + Math.sin(el) * len, L.z + Math.cos(ang) * len * Math.cos(el), near ? 0.07 : 0.16, col, 0.55, near ? 5 : 2);
    }
  }
  } catch (e) { BW11.lasersOff = true; console.warn('W11 lasers disabled:', e); }   // a bad frame never takes the world down
};

/* ---------------- bike traffic (rigid movers with LED riders) ---------------- */
BW11.bikeMesh = function (m, o) {
  const fc = o.frame || '#ffd21a', shirt = o.shirt || '#ff4fd8', skin = o.skin || '#c8906a', led = o.led || '#38f2ff';
  m.color('#1a1a1e').shine(1);
  for (const z of [0.55, -0.55]) { m.push(); m.tf(0, 0.34, z, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.31, 0.035, { seg: 12, tseg: 4 }); m.pop(); }
  m.color(led, 1); for (const z of [0.55, -0.55]) { m.push(); m.tf(0, 0.34, z, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.25, 0.012, { seg: 10, tseg: 3 }); m.pop(); } m.emissive(0);
  m.color(fc).shine(2);
  m.limb(0, 0.34, -0.55, 0, 0.62, -0.05, 0.03, 0.03, { seg: 5 }); m.limb(0, 0.62, -0.05, 0, 0.36, 0.06, 0.03, 0.03, { seg: 5 });
  m.limb(0, 0.62, -0.05, 0, 0.82, 0.42, 0.03, 0.03, { seg: 5 }); m.limb(0, 0.82, 0.42, 0, 0.34, 0.55, 0.025, 0.025, { seg: 5 });
  m.limb(-0.26, 0.98, 0.4, 0.26, 0.98, 0.4, 0.02, 0.02, { seg: 5 });
  m.color('#2a2a30'); m.roundBox(0, 0.74, -0.18, 0.14, 0.05, 0.24, 0.02);
  // rider
  m.color(o.pants || '#2a2a34').shine(0);
  for (const sx of [-0.1, 0.1]) { m.limb(sx, 0.8, -0.14, sx, 0.62, 0.12, 0.07, 0.06, { seg: 6 }); m.limb(sx, 0.62, 0.12, sx * 0.8, 0.3, 0.06, 0.06, 0.05, { seg: 6 }); }
  m.color(shirt); m.ellipsoid(0, 1.08, -0.06, 0.2, 0.28, 0.15, { seg: 10, rings: 7 });
  m.color(skin); for (const sx of [-0.18, 0.18]) m.limb(sx, 1.25, -0.04, sx * 1.35, 0.98, 0.36, 0.05, 0.04, { seg: 6 });
  m.ball(0, 1.48, -0.02, 0.13, { seg: 10, rings: 7 });
  m.color(o.hair || '#3a2a1a'); m.ellipsoid(0, 1.55, -0.04, 0.135, 0.08, 0.135, { seg: 10, rings: 5, phi1: Math.PI / 2 });
  m.color(led, 1); m.torus(0, 1.08, -0.06, 0.2, 0.02, { seg: 12, tseg: 3, sy: 1 }); m.ball(0, 1.66, -0.02, 0.04, { seg: 6, rings: 4 }); m.emissive(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.28, hz: 0.75, y0: 0, y1: 1.4, walk: false, camPass: true }], lights: [{ x: 0, y: 0.95, z: 0.62, s: 0.55, c: '#fff4d8' }, { x: 0, y: 1.1, z: -0.1, s: 0.8, c: led }] };
};
BW11.addBikes = function (api, defs) {
  const S = BW11.state, R = mulberry32(1111);
  const shirts = ['#ff4fd8', '#38f2ff', '#7aff5a', '#ffe24a', '#ff7a2a', '#9a6bff', '#f4f0ff'], frames = ['#ffd21a', '#ffd21a', '#ff3b5c', '#38f2ff', '#f4f0ff'], skins = ['#f0c8a0', '#c8906a', '#8a5a3a', '#e8b896', '#5a3a24'];
  S.bikes = [];
  for (const d of defs) {
    const L = BW11.plen(d.path);
    for (let i = 0; i < d.n; i++) {
      const o = { shirt: R.pick(shirts), frame: R.pick(frames), skin: R.pick(skins), led: R.pick(BURNS_NEON), pants: R.pick(['#2a2a34', '#1a1a1a', '#5a3a2a', '#3a3a5a']), hair: R.pick(['#3a2a1a', '#e8d070', '#1a1a1a', '#ff4fd8', '#9a6bff']) };
      const mv = api.mover(m => BW11.bikeMesh(m, o));
      S.bikes.push({ mv, path: d.path, L, s: (i / d.n) * L + R() * 6, v: d.speed * (0.85 + R() * 0.3), off: d.off || 0, bob: R() * 6 });
    }
  }
};
BW11.updateBikes = function (g, dt) {
  const S = BW11.state, p = g.player, tmp = {};
  for (const b of S.bikes) {
    // brake for Brady
    const ahead = Math.hypot(b.mv.x + Math.sin(b.mv.yaw) * 2 - p.x, b.mv.z + Math.cos(b.mv.yaw) * 2 - p.z) < 2.2 && p.y < 2;
    b.cur = approach(b.cur === undefined ? b.v : b.cur, ahead ? 0 : b.v, dt * 8);
    b.s = (b.s + b.cur * dt) % b.L;
    BW11.along(b.path, b.s, tmp);
    const rx = Math.cos(tmp.yaw), rz = -Math.sin(tmp.yaw);
    b.mv.x = tmp.x + rx * b.off; b.mv.z = tmp.z + rz * b.off; b.mv.yaw = BurnsM.dampAngle(b.mv.yaw || tmp.yaw, tmp.yaw, 6, dt);
    b.mv.y = 0; b.mv.roll = Math.sin(g.time * 1.3 + b.bob) * 0.04;
    if (ahead && !b.rang) { b.rang = true; burnsSfx('bike_bell', { vol: 0.35 }); } else if (!ahead) b.rang = false;
  }
};

/* ---------------- set-piece builders ---------------- */
// a DJ table with two turntables and a glowing mixer (front = +Z, the DJ stands at -Z). top = surface height
BW11.djTable = function (api, x, y, z, yaw, o) {
  o = o || {};
  const body = o.body || '#1a1822', trim = o.trim || '#2a2833', ca = o.colA || '#ff4fd8', cb = o.colB || '#38f2ff';
  return api.mesh(x, z, m => {
    m.color(body).shine(1); m.roundBox(0, 0.5, 0, 2.6, 1.0, 0.8, 0.12, { top: trim, uv: o.uv });
    m.color(ca, 1); m.roundBox(-0.62, 0.66, 0.41, 1.1, 0.05, 0.02, 0.01); m.color(cb, 1); m.roundBox(0.62, 0.66, 0.41, 1.1, 0.05, 0.02, 0.01); m.emissive(0);
    for (const sd of [1, -1]) {
      const px = sd * 0.75, col = sd > 0 ? cb : ca;
      m.color('#2a2833').shine(2); m.roundBox(px, 1.05, 0, 0.62, 0.1, 0.52, 0.03);
      m.color('#0d0d12').shine(2); m.push(); m.tf(px, 1.1, 0); m.roundCyl(0, 0, 0, 0.2, 0.025, 0.006, { seg: 18 }); m.pop();
      m.color(col, 0.75); m.push(); m.tf(px, 1.124, 0); m.roundCyl(0, 0, 0, 0.065, 0.006, 0.002, { seg: 12 }); m.pop(); m.emissive(0);
      m.color('#c8c8d4').shine(3); m.limb(px + sd * 0.24, 1.14, -0.17, px + sd * 0.16, 1.15, 0.12, 0.012, 0.01, { seg: 6 });
      m.color(col, 0.9); m.roundBox(px + sd * 0.25, 1.11, 0.17, 0.05, 0.02, 0.1, 0.008); m.emissive(0);
    }
    m.color('#24222c').shine(2); m.roundBox(0, 1.06, 0, 0.36, 0.12, 0.48, 0.03);
    [ca, '#ffe24a', cb].forEach((c, i) => { for (const sd of [-1, 1]) { m.color(c, 0.65); m.push(); m.tf(sd * 0.08, 1.12, -0.14 + i * 0.1); m.roundCyl(0, 0, 0, 0.022, 0.03, 0.008, { seg: 8 }); m.pop(); } });
    m.emissive(0).shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 0.4, y0: 0, y1: 1.12 }], lights: [{ x: -0.75, y: 1.2, z: 0, s: 0.8, c: ca }, { x: 0.75, y: 1.2, z: 0, s: 0.8, c: cb }] };
  }, { y, yaw });
};
// wooden speaker cabinet with two subwoofer cones (front = +Z). Returns the cone centres (local)
BW11.speaker = function (m, x, y, z, w, h, d, o) {
  o = o || {};
  m.color(o.col || '#7a5032').shine(1); m.roundBox(x, y + h / 2, z, w, h, d, Math.min(w, h, d) * 0.12, { uv: o.uv });
  const cones = [], n = o.cones || 2;
  for (let i = 0; i < n; i++) {
    const cy = y + h * (n === 1 ? 0.5 : 0.28 + i * (0.46 / (n - 1))), r = Math.min(w, h / n) * 0.36;
    m.push(); m.tf(x, cy, z + d / 2 + 0.01, 0, Math.PI / 2, 0);
    m.color('#2a2a30').shine(2); m.torus(0, 0, 0, r, r * 0.12, { seg: 16, tseg: 5 });
    m.color('#141418').shine(1); m.lathe([[r * 0.95, 0], [r * 0.5, -0.06], [r * 0.18, -0.1], [0, -0.1]], { seg: 16, flip: false });
    m.color(o.dust || '#3a3a44'); m.ball(0, -0.09, 0, r * 0.2, { seg: 8, rings: 5 });
    m.pop(); cones.push([x, cy, z + d / 2]);
  }
  m.shine(0);
  return cones;
};
// Root Society: a giant tree stage with root arches, a treehouse and glowing mushrooms
BW11.buildRoot = function (api, g) {
  const S = BW11.state, P = BW11.P.root, x = P.x, z = P.z, F = BW11.P.rootFloor;
  const bark = BURNS_ATLAS.pattern('wood');
  api.lathe(x, 0, z, [[3.8, 0], [2.8, 0.7], [2.2, 2.2], [1.9, 5], [1.8, 8], [2.05, 10.2], [2.7, 11.6], [1.7, 12.6], [0, 12.9]], '#6a4428', { seg: 18, uv: bark, uvRepeat: 4, colScale: 0.6 });
  // roots (skipping the stage side) + branches + canopy
  api.mesh(x, z, m => {
    const cols = [];
    m.color('#5a3a22').shine(1);
    for (let i = 0; i < 8; i++) {
      const a = 0.85 + i / 7 * (TAU - 1.7), L = 7 + (i % 3) * 1.5;
      const p0 = [Math.sin(a) * 1.9, 1.5, Math.cos(a) * 1.9], p1 = [Math.sin(a) * L * 0.5, 1.15 + (i % 2) * 0.35, Math.cos(a) * L * 0.5], p2 = [Math.sin(a + 0.12) * L, 0.12, Math.cos(a + 0.12) * L];
      m.limb(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], 0.9, 0.58, { seg: 10 }); m.limb(p1[0], p1[1], p1[2], p2[0], p2[1], p2[2], 0.58, 0.2, { seg: 10 });
      const mx = (p0[0] + p1[0]) / 2, mz = (p0[2] + p1[2]) / 2;
      cols.push({ t: 'box', x: mx, z: mz, hx: 0.55, hz: Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) / 2, y0: 0, y1: 1.7, yaw: Math.atan2(p1[0] - p0[0], p1[2] - p0[2]) });
    }
    // branches toward the canopy
    m.color('#5e3c24');
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.4, h0 = 10.6 + (i % 2) * 0.8; m.limb(Math.sin(a) * 1.3, h0, Math.cos(a) * 1.3, Math.sin(a) * 6.5, h0 + 3.2, Math.cos(a) * 6.5, 0.7, 0.28, { seg: 9 }); }
    // canopy: soft leafy blobs with lighter tops
    const leaf = (cx, cy, cz, rx, ry, rz) => m.ellipsoid(cx, cy, cz, rx, ry, rz, { seg: 14, rings: 9, colFn: (px, py) => py > ry * 0.3 ? '#4a8a3a' : py > -ry * 0.3 ? '#3a7030' : '#2a5224' });
    m.color('#3a7030');
    leaf(0, 16.6, 0, 6.2, 2.6, 6.2); leaf(5.2, 15.4, 2.2, 3.4, 2.1, 3.4); leaf(-5.0, 15.8, 1.4, 3.6, 2.2, 3.2); leaf(1.6, 15.2, -5.0, 3.4, 2.0, 3.2); leaf(-2.6, 14.9, -4.6, 3.2, 1.9, 3.0); leaf(2.8, 15.0, 5.0, 3.0, 1.8, 2.8);
    // fairy lights in the leaves
    const lights = [];
    for (let i = 0; i < 26; i++) { const a = i * 2.39, r = 2 + (i % 5) * 1.1, y = 14.2 + (i % 4) * 0.7; m.color(i % 3 ? '#ffd890' : '#9aff7a', 1); m.ball(Math.sin(a) * r, y, Math.cos(a) * r, 0.09, { seg: 6, rings: 4 }); if (i % 3 === 0) lights.push({ x: Math.sin(a) * r, y, z: Math.cos(a) * r, s: 0.7, c: i % 2 ? '#ffd890' : '#9aff7a', blink: 1.5 }); }
    m.emissive(0);
    // root arches over the booth
    m.color('#5a3a22');
    for (const sd of [-1, 1]) { const pts = [[sd * 1.6, 4.2, 1.2], [sd * 3.2, 6.2, 4.0], [sd * 4.6, 4.4, 7.0], [sd * 5.0, 1.4, 8.6]]; for (let i = 0; i < 3; i++) m.limb(pts[i][0], pts[i][1], pts[i][2], pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], 0.62 - i * 0.12, 0.5 - i * 0.12, { seg: 9 }); }
    return { cols, lights };
  });
  // stage + booth
  api.roundBox(x, 0, z + 7, 11, 1.3, 5.4, '#7a5234', { r: 0.25, top: '#9a6a40' });
  BW11.djTable(api, x, 1.3, z + 8.0, 0, { body: '#6a4428', trim: '#3a2414', colA: '#9aff7a', colB: '#ffb040', uv: bark });
  // root-step climb to the treehouse, branch steps to the canopy nest
  const steps = [[1.15, 4.4, 1.6], [1.65, 4.3, 3.2], [2.15, 4.2, 4.7]];
  for (const [a, d, y] of steps) api.roundBox(x + Math.sin(a) * d, y - 0.45, z + Math.cos(a) * d, 2.3, 0.45, 2.0, '#6a4428', { r: 0.18, yaw: a, top: '#4a7a3a' });
  const th = { x: x + Math.sin(2.75) * 4.9, z: z + Math.cos(2.75) * 4.9, y: 6.1 };
  api.cylinder(th.x, th.y - 0.35, th.z, 2.8, 0.35, '#7a5234', { round: 0.1 });
  api.mesh(th.x, th.z, m => { m.color('#5a3a22'); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, a2 = (i + 1) / 9 * TAU; m.limb(Math.sin(a) * 2.6, th.y + 0.9, Math.cos(a) * 2.6, Math.sin(a2) * 2.6, th.y + 0.9, Math.cos(a2) * 2.6, 0.06, 0.06, { seg: 5 }); m.limb(Math.sin(a) * 2.6, th.y, Math.cos(a) * 2.6, Math.sin(a) * 2.6, th.y + 0.9, Math.cos(a) * 2.6, 0.05, 0.05, { seg: 5 }); } m.color('#ffb040', 1); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; m.ball(Math.sin(a) * 2.6, th.y + 1.3, Math.cos(a) * 2.6, 0.12, { seg: 6, rings: 4 }); } m.emissive(0); return { lights: [{ x: 0, y: th.y + 1.3, z: 0, s: 2.5, c: '#ffb040' }] }; });
  const bsteps = [[3.45, 3.5, 7.8], [4.1, 3.6, 9.4], [4.75, 3.5, 11.0]];
  for (const [a, d, y] of bsteps) api.roundBox(x + Math.sin(a) * d, y - 0.4, z + Math.cos(a) * d, 1.9, 0.4, 1.6, '#6a4428', { r: 0.16, yaw: a, top: '#4a7a3a' });
  const nest = { x: x + Math.sin(5.45) * 3.7, z: z + Math.cos(5.45) * 3.7, y: 12.6 };
  api.cylinder(nest.x, nest.y - 0.35, nest.z, 1.7, 0.35, '#7a5234', { round: 0.1 });
  S.nest = nest; S.treehouse = th;
  // speaker stacks (the bass bins that blew) + the junction box
  S.rootCones = [];
  for (const sd of [-1, 1]) {
    api.mesh(x + sd * 6.9, z + 8.6, m => { const c = BW11.speaker(m, 0, 0, 0, 2.3, 2.9, 1.8, { uv: bark }); for (const q of c) S.rootCones.push([x + sd * 6.9 + q[0], q[1], z + 8.6 + q[2]]); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.15, hz: 0.9, y0: 0, y1: 2.9 }] }; });
  }
  api.mesh(x - 4.4, z + 9.4, m => { m.color('#3a3a44').shine(2); m.roundBox(0, 1.3 + 0.35, 0, 0.7, 0.7, 0.4, 0.06); m.color('#ff7a2a', 1); m.ball(0.18, 1.85, 0.21, 0.05, { seg: 6, rings: 4 }); m.emissive(0); m.color('#1a1a1a'); m.limb(0, 1.3, 0, 0.6, 0.15, 0.6, 0.04, 0.04, { seg: 5 }); return {}; });
  S.junction = { x: x - 4.4, y: 1.3, z: z + 9.4 };
  // dance floor (wooden deck), glowing mushrooms (two are bouncy)
  api.cylinder(F.x, 0, F.z, F.r, 0.14, '#8a5a36', { round: 0.05 });
  api.paint((c, Pt, sc) => { const [px, pz] = Pt(F.x, F.z); c.strokeStyle = 'rgba(60,36,20,0.5)'; c.lineWidth = 0.08 * sc; for (let r = 2; r < F.r; r += 1.5) { c.beginPath(); c.arc(px, pz, r * sc, 0, TAU); c.stroke(); } });
  const shrooms = [[-12, 4, '#9aff7a', 1.3], [11.5, 6, '#38f2ff', 1.1], [-13, 16, '#ffb040', 1.0], [12.5, 18, '#ff4fd8', 1.2], [-6, 13.5, '#9aff7a', 0.8], [7, 1.2, '#ffe24a', 0.9], [-9.5, -6, '#9aff7a', 1.6], [9.5, -5, '#38f2ff', 1.5]];
  shrooms.forEach(([dx, dz, col, s], i) => {
    const mx = x + dx, mz = z + dz + 6, bouncy = i >= 6;
    api.mesh(mx, mz, m => {
      m.color('#efe2c8').shine(1); m.lathe([[0.32 * s, 0], [0.24 * s, 0.6 * s], [0.22 * s, 1.25 * s], [0.3 * s, 1.35 * s]], { seg: 12 });
      m.color(col, 0.55); m.ellipsoid(0, 1.4 * s, 0, 1.0 * s, 0.5 * s, 1.0 * s, { seg: 16, rings: 8, phi1: Math.PI / 2 }); m.color(shade(col, -0.4), 0.3); m.ellipsoid(0, 1.4 * s, 0, 1.0 * s, 0.12 * s, 1.0 * s, { seg: 16, rings: 4, phi0: Math.PI / 2 });
      m.color('#ffffff', 0.8); for (let k = 0; k < 5; k++) { const a = k * 1.3, r = 0.55 * s; m.ball(Math.sin(a) * r, 1.4 * s + 0.36 * s, Math.cos(a) * r, 0.1 * s, { seg: 6, rings: 4 }); } m.emissive(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.28 * s, y0: 0, y1: 1.3 * s, camPass: true }, Object.assign({ t: 'cyl', x: 0, z: 0, r: 0.9 * s, y0: 1.3 * s, y1: 1.75 * s }, bouncy ? { spring: 18 } : {})], lights: [{ x: 0, y: 1.5 * s, z: 0, s: 1.6 * s, c: col, pool: 4 * s }] };
    });
  });
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; api.glow(F.x + Math.sin(a) * (F.r + 0.6), 0.25, F.z + Math.cos(a) * (F.r + 0.6), 0.6, i % 2 ? '#9aff7a' : '#ffb040', { blink: 2 }); }
  api.light(x, z + 4, 22, '#ffb040', 0.42); api.light(F.x, F.z, 16, '#7aff5a', 0.35); api.light(x, z - 2, 10, '#9aff7a', 0.3);
  for (let i = 0; i < 12; i++) { const a = i * 2.39 + 0.5, r = 5.5 + (i % 4) * 0.9; api.glow(x + Math.sin(a) * r, 9.5 + (i % 3) * 1.3, z + Math.cos(a) * r, 0.9, '#ffb040', { blink: 1.2 }); }
  api.sign('ROOT SOCIETY', F.x + 13.5, F.z + 7, { yaw: -0.7, h: 1.5, style: { bg: '#2a1a0c', fg: '#ffd890', border: '#7aff5a', size: 48, glow: '#7aff5a' }, glow: '#7aff5a' });
  S.lasers.push({ x, y: 13.5, z: z + 1, yaw: 0, n: 5, spread: 1.6, col: [[1, 0.7, 0.25], [0.5, 1, 0.35]], rate: 0.5, len: 55, tilt: 0.12, ph: 1 });
};
// Root Society's tipi village (Brady's home camp since World 17)
BW11.buildTipis = function (api) {
  const R = mulberry32(1717), spots = [[-205, -66, '#e8dcc0'], [-214, -55, '#d8c8a8'], [-216, -71, '#e0d0b8'], [-203, -79, '#ead8c0']];
  spots.forEach(([x, z, canvas], i) => {
    const band = ['#7aff5a', '#ffb040', '#38f2ff', '#ff4fd8'][i];
    api.mesh(x, z, m => {
      m.color(canvas).shine(0);
      m.lathe([[2.0, 0], [1.98, 0.2], [1.5, 1.2, band, 0.25], [1.42, 1.4, band, 0.25], [1.38, 1.42], [0.75, 2.8], [0.2, 3.7], [0.12, 3.8], [0, 3.82]], { seg: 16 });
      m.color('#5a3a22').shine(1); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; m.limb(Math.sin(a) * 0.18, 3.55, Math.cos(a) * 0.18, Math.sin(a) * -0.32, 4.6, Math.cos(a) * -0.32, 0.035, 0.03, { seg: 5 }); }
      m.color('#2a1a10'); m.push(); m.tf(0, 0, 1.55, 0, -0.4, 0); m.roundBox(0, 0.7, 0, 0.8, 1.35, 0.06, 0.03); m.pop();
      m.color('#ffd890', 0.9); m.ball(0, 2.1, 0, 0.1, { seg: 6, rings: 4 }); m.emissive(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.6, y0: 0, y1: 2.2 }], lights: [{ x: 0, y: 1.2, z: 1.9, s: 0.9, c: '#ffd890' }, { x: 0, y: 0, z: 0, s: 0, c: '#ffb070', pool: 6, i: 0.4 }] };
    }, { yaw: Math.atan2(-184 - x, -40 - z) + R.range(-0.2, 0.2) });
  });
  api.sign('BRADY\'S TIPI\n(HOME!)', -205.5, -62.4, { yaw: 0.6, h: 0.9, style: { bg: '#f4e8c8', fg: '#3a2414', border: '#7aff5a', size: 36 } });
  api.sign('ROOT SOCIETY\nTIPI VILLAGE', -198, -56, { yaw: 0.9, h: 1.0, style: { bg: '#2a1a0c', fg: '#ffd890', border: '#7aff5a', size: 36, glow: '#7aff5a' }, glow: '#7aff5a' });
};
// Crusty Curt's wobbly tower of scaffolding and pallets
BW11.buildCurtTower = function (api) {
  const P = BW11.P.curt, x = P.x, z = P.z;
  api.prop('scaffold', { x, z, levels: 5, lh: 2.0, w: 3, d: 3 });
  for (const [dx, dz, y, s, yaw] of [[2.4, 1.2, 0, 1.2, 0.2], [2.6, -0.9, 0, 1.1, -0.3], [2.5, 0.2, 1.15, 1.0, 0.5], [-2.4, 1.6, 0, 1.2, 0.1]]) api.prop('crate', { x: x + dx, z: z + dz, y, s, yaw, col: '#8a6a44' });
  api.roundBox(x - 2.3, 0, z - 1.6, 1.4, 0.8, 0.8, '#6a4a2a', { r: 0.1, uv: BURNS_ATLAS.pattern('patchwork') });
  api.prop('chair', { x: x + 1.4, z: z + 3.2, yaw: 0.6, col: '#5a6a3a' });
  api.prop('pennants', { x: 0, z: 0, x0: x - 1.5, y0: 10.2, z0: z + 1.5, x1: x + 6, y1: 3, z1: z + 6, n: 16, sag: 0.6 });
  api.sign('CURT\'S TOWER\nSINCE 1997\nSTRUCTURALLY FINE*', x - 3.6, z + 3.2, { yaw: 0.3, h: 1.2, style: { bg: '#d8c8a0', fg: '#3a2414', border: '#3a2414', size: 34 } });
  api.sign('*PROBABLY', x - 3.6, z + 3.25, { yaw: 0.3, y: 0.6, h: 0.4, post: false, style: { bg: '#d8c8a0', fg: '#8a2a1a', size: 30 } });
  api.light(x, z + 2, 9, '#ffb070', 0.35);
};
// Opulent Temple: tiers, golden columns, a grand arch, onion-domed towers, flame cannons, a VIP riser
BW11.buildTemple = function (api, g) {
  const S = BW11.state, P = BW11.P.temple, x = P.x, z = P.z, F = BW11.P.templeFloor, V = BW11.P.vip;
  const purple = '#3a1a4a', gold = '#e0aa30';
  api.roundBox(x, 0, z, 24, 1.4, 13, purple, { r: 0.3, top: '#4a2458' });
  api.roundBox(x, 1.4, z - 1.8, 17, 1.4, 9, '#42205a', { r: 0.28, top: '#522a68' });
  api.roundBox(x, 2.8, z - 3.4, 10, 1.4, 6, '#4a2866', { r: 0.25, top: '#5a3076' });
  api.mesh(x, z, m => {
    // gold trims
    m.color(gold, 0.55).shine(2);
    m.roundBox(0, 1.38, 6.5, 24.1, 0.08, 0.1, 0.03); m.roundBox(0, 2.78, 2.7, 17.1, 0.08, 0.1, 0.03); m.roundBox(0, 4.18, -0.4, 10.1, 0.08, 0.1, 0.03);
    m.emissive(0);
    // the grand arch: gold tube + neon lining
    const arch = [], neon = [];
    for (let i = 0; i <= 20; i++) { const a = Math.PI * i / 20, ax = Math.cos(a) * 5.6, ay = 1.4 + Math.sin(a) * 8.6; arch.push([ax, ay, 2.6]); neon.push([Math.cos(a) * 5.0, 1.4 + Math.sin(a) * 7.9, 2.75]); }
    BW11.tube(m, arch, 0.48, () => gold, () => 0.12, { seg: 10 });
    BW11.tube(m, neon, 0.16, t => mix('#ff4fd8', '#ffb040', Math.abs(t - 0.5) * 2), () => 1, { seg: 7 });
    m.emissive(0);
    // sun disc + rays behind the arch
    m.push(); m.tf(0, 6.8, 1.0, 0, Math.PI / 2, 0);
    m.color('#ffb040', 0.9); m.lathe([[0, 0.12], [2.2, 0.06], [2.5, 0], [0, 0]], { seg: 24 });
    m.color('#ffe28a', 1); m.lathe([[0, 0.16], [1.2, 0.12], [1.25, 0.08], [0, 0.08]], { seg: 20 });
    m.pop();
    m.color('#ffb040', 0.8); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; m.limb(Math.cos(a) * 2.7, 6.8 + Math.sin(a) * 2.7, 1.0, Math.cos(a) * 3.9, 6.8 + Math.sin(a) * 3.9, 1.0, 0.07, 0.02, { seg: 5 }); }
    m.emissive(0).shine(0);
    return { lights: [{ x: 0, y: 6.8, z: 1.4, s: 5, c: '#ffb040' }, { x: 0, y: 0, z: 6, s: 0, c: '#ff4fd8', pool: 14 }] };
  });
  // columns
  for (const cx of [-11, -7, -3, 3, 7, 11]) api.lathe(x + cx, 1.4, z + 5.5, [[0.62, 0], [0.66, 0.25, gold, 0.3], [0.5, 0.45, '#d8c8e8'], [0.45, 4.6, '#d8c8e8'], [0.62, 4.95, gold, 0.3], [0.72, 5.3, gold, 0.4], [0.72, 5.3, gold], [0, 5.3, gold]], '#d8c8e8', { seg: 12, gloss: 2, colScale: 0.85 });
  // the booth
  BW11.djTable(api, x, 1.4, z + 4.9, 0, { body: '#22102a', trim: '#e0aa30', colA: '#ffb040', colB: '#ff4fd8' });
  // towers with onion domes (the west one has ledges up its face)
  for (const sd of [-1, 1]) {
    const tx = x + sd * 10, tz = z - 2.6;
    api.roundBox(tx, 1.4, tz, 3.4, 8, 3.4, '#3a1a4a', { r: 0.3, top: '#4a2458' });
    api.lathe(tx, 9.4, tz, [[1.1, 0], [1.3, 0.5], [1.25, 1.1], [0.85, 1.8], [0.3, 2.4], [0.06, 2.85], [0.06, 3.3], [0, 3.35]], gold, { seg: 16, gloss: 2, colScale: 0.95 });
    api.mesh(tx, tz, m => { m.color('#ff4fd8', 1); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; m.ball(Math.sin(a) * 1.75, 9.5, Math.cos(a) * 1.75, 0.13, { seg: 6, rings: 4 }); } m.emissive(0); return { lights: [{ x: 0, y: 12, z: 0, s: 2.2, c: '#ffb040' }] }; });
    S.lasers.push({ x: tx, y: 9.8, z: tz + 1.8, yaw: sd * 0.25, n: 6, spread: 1.4, col: [[0.3, 1, 0.4], [1, 0.25, 0.85], [0.25, 0.9, 1]], rate: 0.9, len: 70, tilt: 0.16, ph: sd });
  }
  [[3.1, -9.2], [5.0, -10.8], [6.9, -9.2], [8.8, -10.8]].forEach(([y, lx]) => api.roundBox(x + lx, y - 0.32, z - 0.55, 1.5, 0.32, 1.3, gold, { r: 0.1, e: 0.15 }));
  S.towerTop = { x: x - 10 + 1.15, y: 9.4, z: z - 2.6 + 1.15 };
  // flame cannons on the front edge
  for (const fx of [-9, -5, 5, 9]) { api.cylinder(x + fx, 1.4, z + 6.0, 0.32, 0.4, '#2a2a30', { round: 0.06 }); api.flameJet(x + fx, 1.8, z + 6.0, { h: 5.5, period: 3.4, on: 1.0, phase: (fx + 9) * 0.12, r: 0.55 }); }
  // dance floor: an ornate carpet
  api.paint((c, Pt, sc) => {
    const [px, pz] = Pt(F.x, F.z);
    for (let i = 7; i >= 0; i--) { c.fillStyle = i % 2 ? 'rgba(90,30,110,0.55)' : 'rgba(200,150,60,0.45)'; c.beginPath(); c.arc(px, pz, (F.r * (i + 1) / 8) * sc, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(240,200,90,0.6)'; c.lineWidth = 0.15 * sc; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; c.beginPath(); c.moveTo(px, pz); c.lineTo(px + Math.cos(a) * F.r * sc, pz + Math.sin(a) * F.r * sc); c.stroke(); }
  });
  api.light(F.x, F.z, 18, '#ff4fd8', 0.4); api.light(x, z + 6, 16, '#ffb040', 0.45);
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; api.glow(F.x + Math.sin(a) * (F.r + 0.5), 0.3, F.z + Math.cos(a) * (F.r + 0.5), 0.6, i % 2 ? '#ffb040' : '#ff4fd8', { blink: 3 }); }
  api.sign('OPULENT TEMPLE', x + 15.5, z + 13, { yaw: -0.5, h: 1.6, style: { bg: '#2a0a3a', fg: '#ffd84a', border: '#ffd84a', size: 50, glow: '#ff9a2a' }, glow: '#ffb040' });
  // ---- the VIP riser: white platform, velvet rope, open bar, back stairs ----
  api.roundBox(V.x, 0, V.z, 8, 2.6, 6, '#f4f0ff', { r: 0.25, top: '#e8dcc0' });
  api.roundBox(V.x - 2.4, 0, V.z - 4.6, 2.4, 0.9, 1.2, '#e8e4f0', { r: 0.12 });
  api.roundBox(V.x - 2.4, 0, V.z - 3.55, 2.4, 1.75, 0.9, '#e8e4f0', { r: 0.12 });
  api.roundBox(V.x - 1.8, 2.6, V.z + 1.9, 3.4, 1.1, 0.8, '#f8f4ec', { r: 0.14, top: gold });
  api.prop('couch', { x: V.x + 1.8, y: 2.6, z: V.z - 1.2, yaw: 0, col: '#f8f8ff' });
  api.mesh(V.x, V.z, m => {
    m.color(gold, 0.4).shine(3); m.roundBox(0, 2.6, 3.0, 8.05, 0.1, 0.1, 0.04); m.emissive(0);
    // bottles on the bar
    BURNS_NEON.slice(0, 6).forEach((c, i) => { m.color(c, 0.6).shine(3); m.push(); m.tf(-3.2 + i * 0.32, 3.7, 1.9); m.lathe([[0.07, 0], [0.07, 0.18], [0.025, 0.28], [0.025, 0.34], [0, 0.34]], { seg: 8 }); m.pop(); });
    m.emissive(0);
    // velvet rope: gold posts + a red sagging rope
    const posts = [-3.6, -1.2, 1.2, 3.6];
    m.color(gold).shine(3); for (const px of posts) { m.limb(px, 0.05, 4.4, px, 1.0, 4.4, 0.06, 0.06, { seg: 8 }); m.ball(px, 1.06, 4.4, 0.1, { seg: 8, rings: 5 }); m.roundCyl(px, 0, 4.4, 0.2, 0.06, 0.02, { seg: 10 }); }
    m.color('#c0102a').shine(1); for (let i = 0; i < 3; i++) { const a = posts[i], b = posts[i + 1]; m.limb(a, 0.95, 4.4, (a + b) / 2, 0.7, 4.4, 0.04, 0.04, { seg: 6 }); m.limb((a + b) / 2, 0.7, 4.4, b, 0.95, 4.4, 0.04, 0.04, { seg: 6 }); }
    m.shine(0);
    return { cols: posts.map(px => ({ t: 'cyl', x: px, z: 4.4, r: 0.12, y0: 0, y1: 1.05, camPass: true })), lights: [{ x: 0, y: 4, z: 0, s: 0, c: '#ffe8c0', pool: 8 }, { x: -1.8, y: 3.9, z: 1.9, s: 1.5, c: '#ffd84a' }] };
  });
  api.sign('VIP · RADICALLY\nINCLUSIVE OPEN BAR\n(MEMBERS ONLY)', V.x + 2.6, V.z + 4.6, { yaw: 0, h: 1.2, style: { bg: '#f8f4ec', fg: '#8a6a10', border: gold, size: 34 } });
  api.sign('STAFF ONLY', V.x - 3.6, V.z - 5.6, { yaw: Math.PI, h: 0.7, style: { bg: '#2a2a30', fg: '#ffffff', size: 34 } });
  api.light(V.x, V.z, 10, '#fff0d0', 0.4);
};
// Camp Question Mark: a giant glowing "?", a little round stage, mystery doors that go... somewhere
BW11.qmCurve = function () {
  const pts = [];
  for (let i = 0; i <= 22; i++) { const a = (205 - i * (255 / 22)) * Math.PI / 180; pts.push([Math.cos(a) * 3.2, 10.6 + Math.sin(a) * 3.2]); }
  // curl back to the centre, then the stem
  pts.push([0.9, 7.55], [0.25, 7.0], [0.05, 6.2], [0, 5.3], [0, 4.4]);
  return pts;
};
BW11.buildQM = function (api, g) {
  const S = BW11.state, P = BW11.P.qm, x = P.x, z = P.z, F = BW11.P.qmFloor;
  const curve = BW11.qmCurve();
  api.mesh(x, z, m => {
    const pts = curve.map(p => [p[0], p[1], 0]);
    BW11.tube(m, pts, 0.78, t => mix('#38f2ff', '#ff4fd8', t), () => 0.85, { seg: 12 });
    // the dot
    m.color('#ff4fd8', 0.85); m.ball(0, 1.75, 0, 1.3, { seg: 18, rings: 12 }); m.emissive(0);
    m.color('#1a1a22').shine(2); m.roundCyl(0, 0, 0, 1.0, 0.5, 0.1, { seg: 16 }); m.shine(0);
    const lights = [{ x: 0, y: 11, z: 0.8, s: 7, c: '#9a6bff' }, { x: 0, y: 1.8, z: 1.3, s: 3, c: '#ff4fd8' }, { x: 0, y: 0, z: 2, s: 0, c: '#9a6bff', pool: 16 }];
    // a walkable top on the hook (for those who can get up there)
    return { cols: [{ t: 'dome', x: 0, z: 0, r: 1.3, y0: 1.75 - 0.05 }, { t: 'box', x: 0, z: 0, hx: 1.6, hz: 0.7, y0: 12.6, y1: 14.55 }, { t: 'box', x: -2.6, z: 0, hx: 0.7, hz: 0.7, y0: 10.6, y1: 13.3 }], lights };
  });
  // round stage + "?"-shaped booth
  api.cylinder(x, 0, z + 5.2, 3.8, 1.0, '#1c1a2a', { round: 0.12 });
  BW11.djTable(api, x, 1.0, z + 6.1, 0, { body: '#2a2840', trim: '#3a3858', colA: '#ff4fd8', colB: '#38f2ff' });
  api.paint((c, Pt, sc) => { const [px, pz] = Pt(F.x, F.z); const gr = c.createRadialGradient(px, pz, 0, px, pz, F.r * sc); gr.addColorStop(0, 'rgba(60,40,110,0.75)'); gr.addColorStop(1, 'rgba(60,40,110,0)'); c.fillStyle = gr; c.beginPath(); c.arc(px, pz, F.r * sc, 0, TAU); c.fill(); c.fillStyle = 'rgba(120,240,255,0.18)'; c.font = `${4 * sc}px ${FONT_DISPLAY}`; c.textAlign = 'center'; c.textBaseline = 'middle'; for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; c.fillText('?', px + Math.cos(a) * F.r * 0.6 * sc, pz + Math.sin(a) * F.r * 0.6 * sc); } });
  api.light(F.x, F.z, 16, '#9a6bff', 0.45); api.light(x, z + 4, 12, '#38f2ff', 0.4);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; api.glow(F.x + Math.sin(a) * (F.r + 0.5), 0.3, F.z + Math.cos(a) * (F.r + 0.5), 0.6, i % 2 ? '#38f2ff' : '#ff4fd8', { blink: 2.5 }); }
  // mystery doors (walk through one, come out of another)
  S.doors = [];
  const doors = [[-15, 10, 0.5], [16, 6, -0.6], [2, 45, Math.PI]];
  doors.forEach(([dx, dz, yaw], i) => {
    const dxw = x + dx, dzw = z + dz;
    api.mesh(dxw, dzw, m => {
      m.color('#2a2840').shine(1); m.roundBox(-0.95, 1.4, 0, 0.3, 2.8, 0.4, 0.08); m.roundBox(0.95, 1.4, 0, 0.3, 2.8, 0.4, 0.08); m.roundBox(0, 2.95, 0, 2.2, 0.3, 0.4, 0.08);
      m.color(i === 1 ? '#ff4fd8' : '#38f2ff', 0.75); m.roundBox(0, 1.4, 0, 1.6, 2.6, 0.06, 0.02); m.emissive(0);
      return { cols: [{ t: 'box', x: -0.95, z: 0, hx: 0.15, hz: 0.2, y0: 0, y1: 2.8 }, { t: 'box', x: 0.95, z: 0, hx: 0.15, hz: 0.2, y0: 0, y1: 2.8 }], lights: [{ x: 0, y: 1.5, z: 0.3, s: 1.6, c: i === 1 ? '#ff4fd8' : '#38f2ff' }] };
    }, { yaw });
    api.sign('?', dxw, dzw, { yaw, y: 3.2, h: 0.8, post: false, style: { bg: '#1a1030', fg: '#ffffff', size: 60, border: '#ff4fd8', glow: '#38f2ff' }, glow: '#38f2ff' });
    S.doors.push({ x: dxw, z: dzw, yaw });
  });
  api.sign('CAMP ?', F.x - 14, F.z + 6, { yaw: 0.6, h: 1.6, style: { bg: '#1a1030', fg: '#38f2ff', border: '#ff4fd8', size: 56, glow: '#38f2ff' }, glow: '#9a6bff' });
  api.sign('WHO? WHAT? WHERE?\nWHY? WHEN IS THE SET?', F.x + 14, F.z + 8, { yaw: -0.6, h: 1.2, style: { bg: '#f4f0ff', fg: '#3a2a6a', size: 32, border: '#9a6bff' } });
  S.lasers.push({ x, y: 14.6, z: z + 0.5, yaw: 0, n: 7, spread: 2.2, col: [[0.22, 0.95, 1], [1, 0.3, 0.85], [0.6, 0.42, 1]], rate: 1.2, len: 65, tilt: 0.2, ph: 2 });
  // the LSD-only way up to the top of the hook
  api.hidden(() => {
    const steps = [[-3.4, 2.6, 1.2], [-4.6, 4.3, 0.4], [-5.0, 6.0, -0.6], [-4.7, 7.7, 0.2], [-4.2, 9.4, 1.0], [-3.4, 11.1, 0.6], [-1.9, 12.7, 0.4]];
    steps.forEach(([sx, sy, sz], i) => api.roundBox(x + sx, sy - 0.3, z + sz, 1.6, 0.3, 1.6, burnsHSL(190 + i * 22, 0.9, 0.6), { e: 0.7, r: 0.12 }));
    api.glow(x, 15.6, z, 2.4, '#ff4fd8');
  });
};
// the Thunderdome: our own lattice dome (Death Guild runs the show), fire cannons up top
BW11.buildDome = function (api, g) {
  const S = BW11.state, D = BW11.P.dome, x = D.x, z = D.z, R = D.R;
  const geo = BW11.geodesic(3);
  // opening on the south side (entrance)
  const inGate = (p) => p[2] > 0.55 && Math.abs(p[0]) < 0.42 && p[1] < 0.42;
  api.mesh(x, z, m => {
    m.lo = true; m.color('#2c2a30').shine(2);
    for (const [a, b] of geo.edges) { if (inGate(a) || inGate(b)) continue; m.limb(a[0] * R, a[1] * R, a[2] * R, b[0] * R, b[1] * R, b[2] * R, 0.11, 0.11, { seg: 6 }); }
    m.color('#5a5058'); for (const n of geo.nodes) { if (inGate(n)) continue; m.ball(n[0] * R, n[1] * R, n[2] * R, 0.19, { seg: 6, rings: 4 }); }
    m.lo = false;
    // apex ring + bungee anchors + fire cannons
    m.color('#3a3a40').shine(2); m.torus(0, R - 0.25, 0, 1.3, 0.14, { seg: 16, tseg: 5 });
    m.color('#ff5a3a', 1); m.ball(0, R - 0.4, 0, 0.22, { seg: 8, rings: 5 }); m.emissive(0);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; m.color('#2a2a30'); m.roundCyl(Math.sin(a) * 1.3, R - 0.2, Math.cos(a) * 1.3, 0.22, 0.6, 0.05, { seg: 10 }); }
    m.shine(0);
    // entrance arch
    m.color('#1a1a1e').shine(2); m.limb(-2.6, 0, R * 0.92, -2.6, 4.2, R * 0.92, 0.18, 0.18, { seg: 8 }); m.limb(2.6, 0, R * 0.92, 2.6, 4.2, R * 0.92, 0.18, 0.18, { seg: 8 }); m.limb(-2.6, 4.2, R * 0.92, 2.6, 4.2, R * 0.92, 0.16, 0.16, { seg: 8 }); m.shine(0);
    const cols = geo.nodes.filter(n => n[1] < 0.05 && !inGate(n)).map(n => ({ t: 'cyl', x: n[0] * R, z: n[2] * R, r: 0.22, y0: 0, y1: 2.2, camPass: true }));
    return { cols, lights: [{ x: 0, y: 0, z: 0, s: 0, c: '#ff5a3a', pool: 14 }, { x: 0, y: R - 0.4, z: 0, s: 2.2, c: '#ff5a3a', blink: 4 }] };
  });
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; api.flameJet(x + Math.sin(a) * 1.3, R + 0.4, z + Math.cos(a) * 1.3, { h: 4, period: 2.6, on: 0.8, phase: i * 0.65, r: 0.4 }); }
  api.sign('THUNDERDOME', x, z + R * 0.92 + 0.3, { yaw: 0, y: 4.5, h: 1.3, post: false, style: { bg: '#120a0a', fg: '#ff5a3a', border: '#ffb040', size: 52, glow: '#ff5a3a' }, glow: '#ff5a3a' });
  api.sign('DEATH GUILD\nFOAM ONLY · NO CRYING', x + 4.2, z + R + 2, { yaw: -0.3, h: 1.0, style: { bg: '#1a1416', fg: '#e8e0d8', border: '#ff5a3a', size: 32 } });
  // MC tower by the entrance
  api.roundBox(x - 5.8, 2.7, z + R + 1.6, 2.6, 0.3, 2.6, '#2a2a30', { r: 0.08, top: '#3a3a40' });
  api.mesh(x - 5.8, z + R + 1.6, m => {
    m.color('#3a3a40').shine(2);
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) m.limb(sx * 1.1, 0, sz * 1.1, sx * 1.1, 2.7, sz * 1.1, 0.07, 0.07, { seg: 6 });
    for (const sd of [-1, 1]) { m.limb(-1.1, 0.2, sd * 1.1, 1.1, 2.5, sd * 1.1, 0.04, 0.04, { seg: 5 }); m.limb(sd * 1.1, 0.2, -1.1, sd * 1.1, 2.5, 1.1, 0.04, 0.04, { seg: 5 }); }
    for (const sd of [-1, 1]) { m.limb(-1.2, 3.8, sd * 1.2, 1.2, 3.8, sd * 1.2, 0.04, 0.04, { seg: 5 }); m.limb(sd * 1.2, 3.8, -1.2, sd * 1.2, 3.8, 1.2, 0.04, 0.04, { seg: 5 }); }
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) m.limb(sx * 1.2, 3.0, sz * 1.2, sx * 1.2, 3.8, sz * 1.2, 0.04, 0.04, { seg: 5 });
    m.color('#ff3b2a', 1); for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) m.ball(sx * 1.2, 3.9, sz * 1.2, 0.12, { seg: 8, rings: 5 }); m.emissive(0);
    m.color('#e8e0d8').shine(2); m.push(); m.tf(0.9, 3.5, 0.9, 0.8, Math.PI / 2 - 0.3, 0); m.lathe([[0.05, 0], [0.07, 0.15], [0.25, 0.55], [0.25, 0.57], [0, 0.57]], { seg: 12 }); m.pop(); m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 1.3, y0: 0, y1: 3.0 }], lights: [{ x: 1.2, y: 3.9, z: 1.2, s: 0.8, c: '#ff3b2a', blink: 4 }, { x: -1.2, y: 3.9, z: -1.2, s: 0.8, c: '#ff3b2a', blink: 4 }] };
  });
  api.paint((c, Pt, sc) => { const [px, pz] = Pt(x, z); c.fillStyle = 'rgba(70,40,30,0.55)'; c.beginPath(); c.arc(px, pz, (R - 0.5) * sc, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,90,58,0.55)'; c.lineWidth = 0.25 * sc; c.beginPath(); c.arc(px, pz, (R - 3) * sc, 0, TAU); c.stroke(); c.beginPath(); c.arc(px, pz, 2 * sc, 0, TAU); c.stroke(); });
  api.light(x, z, 15, '#ff7a3a', 0.45); api.light(x, z + R + 3, 8, '#ffb040', 0.35);
  for (const n of geo.nodes) if (n[1] > 0.2 && n[1] < 0.9 && Math.random() < 0.18) api.glow(x + n[0] * R, n[1] * R, z + n[2] * R, 0.5, Math.random() < 0.5 ? '#ff5a3a' : '#ffb040', { blink: 3 });
  S.lasers.push({ x, y: R + 0.5, z, yaw: Math.PI, n: 4, spread: TAU, col: [[1, 0.25, 0.15], [1, 0.6, 0.2]], rate: 0.4, len: 45, tilt: 0.35, ph: 3 });
  S.domeNodes = geo.nodes.filter(n => n[1] > 0.15 && n[1] < 0.72 && !(n[2] > 0.3 && Math.abs(n[0]) < 0.6));
};
// the Wobble Dome: a rainbow LED band shell, mirror ball, speaker towers, an LED floor
BW11.buildWobble = function (api, g) {
  const S = BW11.state, P = BW11.P.wob, x = P.x, z = P.z, F = BW11.P.wobFloor, R = 13;
  api.cylinder(x, 0, z + 1.5, 9.5, 1.6, '#1a1822', { round: 0.15 });
  api.roundBox(x, 0, z + 11.4, 7, 0.8, 1.6, '#2a2833', { r: 0.12 });
  api.mesh(x, z, m => {
    const prof = [], inner = [];
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; prof.push([Math.cos(a) * R, Math.sin(a) * R]); }
    m.color('#24222e').shine(1); m.lathe(prof, { seg: 22, theta0: Math.PI / 2 - 0.15, theta1: Math.PI * 1.5 + 0.15 });
    const band = ['#ff3b5c', '#ff7a2a', '#ffe24a', '#7aff5a', '#38f2ff', '#3a6aff', '#9a6bff', '#ff4fd8'];
    for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2, c = band[Math.min(band.length - 1, Math.floor(i / 12 * band.length))]; inner.push([Math.cos(a) * (R - 0.3), Math.sin(a) * (R - 0.3), c, 0.65]); }
    m.color('#ffffff'); m.lathe(inner, { seg: 22, theta0: Math.PI / 2 - 0.15, theta1: Math.PI * 1.5 + 0.15, flip: true });
    m.emissive(0);
    // ribs
    m.color('#c8c8d4').shine(3);
    for (let k = 0; k <= 8; k++) { const th = Math.PI / 2 - 0.15 + k / 8 * (Math.PI + 0.3), pts = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; pts.push([Math.sin(th) * Math.cos(a) * (R - 0.15), Math.sin(a) * (R - 0.15), Math.cos(th) * Math.cos(a) * (R - 0.15)]); } BW11.tube(m, pts, 0.12, null, null, { seg: 6 }); }
    // mirror ball on a cable
    m.color('#8a8a92'); m.limb(0, R - 0.8, -3, 0, 10.6, 3.5, 0.03, 0.03, { seg: 4 });
    const disco = BURNS_ATLAS.pattern('disco');
    m.color('#e8eef8').shine(3); m.ellipsoid(0, 9.4, 3.5, 1.3, 1.3, 1.3, { seg: 18, rings: 12, uvFn: (px, py, pz) => [lerp(disco.u0, disco.u1, (Math.atan2(px, pz) / TAU + 0.5) * 2 % 1), lerp(disco.v0, disco.v1, clamp(0.5 - py / 2.6, 0, 1))] });
    m.shine(0);
    const cols = [];
    for (let k = 0; k < 9; k++) { const th = Math.PI / 2 + k / 8 * Math.PI, cx = Math.sin(th) * R, cz = Math.cos(th) * R; cols.push({ t: 'box', x: cx, z: cz, hx: 2.4, hz: 0.4, y0: 0, y1: 6, yaw: th }); }
    return { cols, lights: [{ x: 0, y: 6, z: 2, s: 6, c: '#9a6bff' }, { x: 0, y: 0, z: 4, s: 0, c: '#9a6bff', pool: 18 }] };
  });
  // booth
  BW11.djTable(api, x, 1.6, z + 5.0, 0, { body: '#1c1a26', trim: '#c8c8d4', colA: '#ff4fd8', colB: '#38f2ff' });
  // speaker towers
  for (const sd of [-1, 1]) api.mesh(x + sd * 11.2, z + 7.5, m => { for (let i = 0; i < 3; i++) BW11.speaker(m, 0, i * 1.55, 0, 2.5, 1.5, 2.0, { col: '#202028', cones: 1, dust: '#ff4fd8' }); m.color(sd < 0 ? '#ff4fd8' : '#38f2ff', 1); m.roundBox(0, 4.7, 1.02, 2.3, 0.08, 0.04, 0.02); m.emissive(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.25, hz: 1.0, y0: 0, y1: 4.65 }], lights: [{ x: 0, y: 4.9, z: 1.2, s: 1.6, c: sd < 0 ? '#ff4fd8' : '#38f2ff' }] }; });
  // LED floor
  api.paint((c, Pt, sc) => {
    const cols = ['rgba(255,79,216,0.38)', 'rgba(56,242,255,0.38)', 'rgba(255,226,74,0.32)', 'rgba(122,255,90,0.32)', 'rgba(154,107,255,0.38)'];
    for (let i = -6; i < 6; i++) for (let j = -6; j < 6; j++) { const cx = F.x + i * 2 + 1, cz = F.z + j * 2 + 1; if (Math.hypot(cx - F.x, cz - F.z) > F.r) continue; const [px, pz] = Pt(cx - 0.9, cz - 0.9); c.fillStyle = cols[(i * 7 + j * 3 + 50) % cols.length]; c.fillRect(px, pz, 1.8 * sc, 1.8 * sc); }
  });
  api.light(F.x, F.z, 18, '#9a6bff', 0.45); api.light(x, z + 8, 12, '#ff4fd8', 0.4);
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; api.glow(F.x + Math.sin(a) * (F.r + 0.6), 0.3, F.z + Math.cos(a) * (F.r + 0.6), 0.6, BURNS_NEON[i % 7], { blink: 2 }); }
  api.sign('THE WOBBLE DOME', F.x + 15, F.z + 8, { yaw: -0.6, h: 1.6, style: { bg: '#100a20', fg: '#ffffff', border: '#9a6bff', size: 52, glow: '#ff4fd8' }, glow: '#9a6bff' });
  S.mirror = { x, y: 9.4, z: z + 3.5 };
  S.lasers.push({ x: x - 8, y: 7.5, z: z + 6, yaw: 0.3, n: 6, spread: 1.6, col: [[1, 1, 1], [1, 0.3, 0.85]], rate: 0.7, len: 70, tilt: 0.15, ph: 4 });
  S.lasers.push({ x: x + 8, y: 7.5, z: z + 6, yaw: -0.3, n: 6, spread: 1.6, col: [[0.22, 0.95, 1], [0.6, 0.42, 1]], rate: 0.7, len: 70, tilt: 0.15, ph: 5 });
};
// DJ Loophole's tiny camp: pallet riser, folding table, laptop, energy drinks, one sad banner
BW11.buildLoop = function (api, g) {
  const S = BW11.state, P = BW11.P.loop, x = P.x, z = P.z;
  api.roundBox(x, 0, z, 4.8, 0.5, 3.4, '#8a6a44', { r: 0.1, uv: BURNS_ATLAS.pattern('wood') });
  api.roundBox(x, 0.5, z - 0.95, 2.4, 0.78, 0.75, '#e8e8f0', { r: 0.06 });
  api.mesh(x, z - 0.95, m => {
    // laptop + controller
    m.color('#c8c8d0').shine(3); m.roundBox(0.35, 1.3, 0.02, 0.44, 0.025, 0.3, 0.01);
    m.push(); m.tf(0.35, 1.31, -0.13, 0, -0.35, 0); m.roundBox(0, 0.15, 0, 0.44, 0.3, 0.02, 0.01); m.color('#ff4fd8', 1); m.roundBox(0, 0.15, -0.012, 0.12, 0.08, 0.005, 0.004); m.pop();
    m.color('#1a1a22').shine(1); m.roundBox(-0.45, 1.31, 0.02, 0.6, 0.05, 0.36, 0.02);
    for (let i = 0; i < 8; i++) { m.color(BURNS_NEON[i % 7], 1); m.roundBox(-0.66 + (i % 4) * 0.14, 1.345, -0.06 + Math.floor(i / 4) * 0.13, 0.1, 0.02, 0.1, 0.01); }
    m.emissive(0);
    // energy-drink pyramid
    const cans = [[0, 0], [0.16, 0], [0.32, 0], [0.08, 1], [0.24, 1], [0.16, 2]];
    cans.forEach(([cx, row], i) => { m.color(['#7aff5a', '#ff3b5c', '#38f2ff', '#ffe24a', '#ff7a2a', '#9a6bff'][i], 0.25).shine(3); m.push(); m.tf(0.8 + cx, 1.29 + row * 0.205, 0.15); m.roundCyl(0, 0, 0, 0.065, 0.2, 0.015, { seg: 10 }); m.pop(); });
    m.emissive(0).shine(0);
    // two PA speakers on tripods
    for (const sd of [-1, 1]) {
      m.color('#2a2a30'); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; m.limb(sd * 2.9, 0.9, -0.2, sd * 2.9 + Math.sin(a) * 0.5, 0.02, -0.2 + Math.cos(a) * 0.5, 0.025, 0.025, { seg: 4 }); }
      m.limb(sd * 2.9, 0.9, -0.2, sd * 2.9, 1.8, -0.2, 0.03, 0.03, { seg: 5 });
      m.push(); m.tf(sd * 2.9, 1.8, -0.2, Math.PI); BW11.speaker(m, 0, 0, 0, 0.62, 0.9, 0.5, { col: '#1a1a20', cones: 1 }); m.pop();
    }
    return { lights: [{ x: 0, y: 1.6, z: 0, s: 1.2, c: '#ff4fd8', blink: 6 }] };
  });
  api.sign('DJ LOOPHOLE\nALL NIGHT · EVERY NIGHT\nNO REQUESTS', x, z + 1.9, { yaw: Math.PI, y: 1.9, h: 1.3, post: true, style: { bg: '#1a0a2a', fg: '#7aff5a', border: '#ff4fd8', size: 38, glow: '#7aff5a' }, glow: '#7aff5a' });
  api.light(x, z - 3, 14, '#ff4fd8', 0.55); api.light(x, z + 1, 8, '#7aff5a', 0.35);
  api.prop('pennants', { x: 0, z: 0, x0: x - 3.4, y0: 3.2, z0: z + 1.8, x1: x + 3.4, y1: 3.2, z1: z + 1.8, n: 14, sag: 0.5 });
  for (const sd of [-1, 1]) api.capsule(x + sd * 3.4, 0, z + 1.8, 0.07, 3.3, '#3a3a40', { col: { camPass: true } });
  S.lasers.push({ x: x + 2.7, y: 2.5, z: z - 0.2, yaw: Math.PI, n: 2, spread: 0.6, col: [[0.5, 1, 0.3]], rate: 3, len: 25, tilt: 0.25, ph: 6 });
};
// a lamp post (lamplighter lantern) along the Esplanade
BW11.lampPost = function (api, x, z) {
  api.mesh(x, z, m => {
    m.color('#3a2a1e').shine(1); m.lathe([[0.16, 0], [0.12, 0.3], [0.07, 0.4], [0.06, 3.6], [0.09, 3.7], [0, 3.72]], { seg: 8 });
    m.limb(0, 3.5, 0, 0.55, 3.6, 0, 0.04, 0.04, { seg: 5 });
    m.color('#2a2a2a'); m.lathe([[0, 3.62], [0.16, 3.52], [0.16, 3.5]], { seg: 8 });
    m.color('#ffd890', 1); m.ellipsoid(0.55, 3.25, 0, 0.13, 0.2, 0.13, { seg: 8, rings: 6 }); m.emissive(0);
    m.color('#2a2a2a'); m.lathe([[0.15, 0], [0.04, 0.08], [0, 0.08]], { seg: 8 });
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.12, y0: 0, y1: 3.7, camPass: true }], lights: [{ x: 0.55, y: 3.25, z: 0, s: 1.0, c: '#ffd890' }, { x: 0.4, y: 0, z: 0, s: 0, c: '#ffc070', pool: 7, i: 0.4 }] };
  });
};
// a little theme camp on the city side: vehicle, shade, couch, a dome sometimes
BW11.camp = function (api, x, z, seed, o) {
  o = o || {}; const r = mulberry32(seed), yaw = o.yaw || 0;
  api.prop(o.vehicle || r.pick(['rv', 'van', 'camper', 'rv', 'boxtruck', 'bus']), { x: x + Math.cos(yaw) * 6, z: z - Math.sin(yaw) * 6, yaw: yaw + Math.PI / 2 + r.range(-0.15, 0.15), seed });
  api.prop('shade', { x, z, w: 5 + r() * 2, d: 5, col: r.pick(['#d8c8a8', '#c8b8e8', '#e8c8a8', '#a8d8c8', '#f0c0d8']) });
  api.prop('couch', { x, z: z + 1.2, yaw: Math.PI + yaw, col: r.pick(['#8a2a5a', '#2a5a8a', '#6a4a2a', '#5a2a8a']) });
  for (let i = 0; i < 2; i++) api.prop('chair', { x: x - 1.5 + i * 3, z: z - 1.5, yaw: r() * TAU, col: r.pick(BURNS_NEON) });
  if (o.dome) api.prop('dome', { x: x - Math.cos(yaw) * 9, z: z + Math.sin(yaw) * 9, r: 4.5, col: r.pick(['#e8e0d0', '#d8c0e8', '#c8e8f0']), lights: true, glow: r.pick(BURNS_NEON) });
  if (o.sign) api.sign(o.sign, x - 3.5, z - 3.2, { yaw: Math.PI + yaw, h: 1.0, style: { bg: o.bg || '#1a0a2a', fg: o.fg || '#ffe24a', border: o.fg || '#ffe24a', size: 38, glow: o.fg || '#ffe24a' }, glow: o.fg || '#ffe24a' });
  api.light(x, z, 9, r.pick(['#ff70c0', '#70c0ff', '#ffb070', '#a0ff80']), 0.4);
};

/* ---------------- extra venues: The Deep End, Playground, Disorient ---------------- */
// a hyperbolic shade sail through four corners (both sides drawn), soft stripes, edges pulled in like real sails
BW11.sail = function (m, A, B, C, D, cols, nu) {
  nu = nu || 10;
  const f = (u, v, t) => {
    const k = 1 - 0.08 * (Math.sin(Math.PI * u) + Math.sin(Math.PI * v));
    const x = lerp(lerp(A[0], B[0], u), lerp(D[0], C[0], u), v), y = lerp(lerp(A[1], B[1], u), lerp(D[1], C[1], u), v), z = lerp(lerp(A[2], B[2], u), lerp(D[2], C[2], u), v);
    const cx = (A[0] + B[0] + C[0] + D[0]) / 4, cz = (A[2] + B[2] + C[2] + D[2]) / 4;
    t[0] = cx + (x - cx) * k; t[1] = y - 0.35 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v); t[2] = cz + (z - cz) * k;
  };
  const colFn = (u) => cols[Math.min(cols.length - 1, Math.floor(u * cols.length))];
  m.surf(nu, nu, f, { colFn }); m.surf(nu, nu, f, { colFn, flip: true });
};
// a big striped beach ball (surf sphere so the panels can be coloured)
BW11.beachBall = function (m, x, y, z, r) {
  const P = ['#ff3b5c', '#ffffff', '#ffe24a', '#ffffff', '#38a8ff', '#ffffff'];
  m.shine(2); m.surf(18, 9, (u, v, t) => { const th = u * TAU, ph = v * Math.PI; t[0] = x + Math.sin(ph) * Math.sin(th) * r; t[1] = y - Math.cos(ph) * r; t[2] = z + Math.sin(ph) * Math.cos(th) * r; },
    { wrapU: true, out: true, colFn: (u, v) => (v < 0.1 || v > 0.9) ? '#ffffff' : P[Math.floor(u * 6) % 6] });
  m.shine(0);
};
// THE DEEP END: an OG daytime dance camp. A giant shade sail over a pool-tile dance floor, a lifeguard-tower
// DJ booth under a beach umbrella, pool floats, and a high dive over a foam pool (Lifeguard Lou scores cannonballs)
BW11.buildDeepEnd = function (api, g) {
  const S = BW11.state, P = BW11.P.deep, F = BW11.P.deepFloor, D = BW11.P.dive, x = P.x, z = P.z;
  // pool-tile dance floor: tiles, swim lanes, caustics
  api.paint((c, Pt, sc) => {
    const [cx, cz] = Pt(F.x, F.z), R = F.r * sc;
    c.save(); c.beginPath(); c.arc(cx, cz, R, 0, TAU); c.clip();
    const gg = c.createRadialGradient(cx, cz, 0, cx, cz, R); gg.addColorStop(0, 'rgba(120,226,255,0.62)'); gg.addColorStop(1, 'rgba(36,128,214,0.62)');
    c.fillStyle = gg; c.fillRect(cx - R, cz - R, R * 2, R * 2);
    c.strokeStyle = 'rgba(236,252,255,0.32)'; c.lineWidth = Math.max(1, 0.05 * sc);
    for (let k = -F.r; k <= F.r; k += 1) {
      let [ax, az] = Pt(F.x + k, F.z - F.r), [bx, bz] = Pt(F.x + k, F.z + F.r); c.beginPath(); c.moveTo(ax, az); c.lineTo(bx, bz); c.stroke();
      [ax, az] = Pt(F.x - F.r, F.z + k); [bx, bz] = Pt(F.x + F.r, F.z + k); c.beginPath(); c.moveTo(ax, az); c.lineTo(bx, bz); c.stroke();
    }
    c.fillStyle = 'rgba(14,44,116,0.55)';
    for (const lx of [-6, -2, 2, 6]) { const [ax, az] = Pt(F.x + lx - 0.22, F.z - F.r + 1.4), [bx, bz] = Pt(F.x + lx + 0.22, F.z + F.r - 1.4); c.fillRect(Math.min(ax, bx), Math.min(az, bz), Math.abs(bx - ax), Math.abs(bz - az)); }
    c.strokeStyle = 'rgba(220,255,255,0.24)'; c.lineWidth = Math.max(1, 0.12 * sc);
    const r = mulberry32(4242);
    for (let i = 0; i < 28; i++) { const x0 = F.x + r.range(-F.r, F.r), z0 = F.z + r.range(-F.r, F.r); c.beginPath(); for (let s = 0; s <= 6; s++) { const [px, pz] = Pt(x0 + s * 0.6, z0 + Math.sin(s * 1.3 + i) * 0.35); if (s) c.lineTo(px, pz); else c.moveTo(px, pz); } c.stroke(); }
    c.restore();
  });
  api.torus(F.x, 0.06, F.z, F.r + 0.25, 0.17, '#eef6f8');
  // the big sail: four masts (alternating high/low corners) and one hypar sail over the whole floor
  const h = [9.6, 6.2, 9.6, 6.2], cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]], E = F.r + 1.6;
  api.mesh(F.x, F.z, m => {
    const corner = cs.map(([sx, sz], i) => [sx * E, h[i], sz * E]);
    m.color('#d8dce4').shine(3);
    cs.forEach(([sx, sz], i) => {
      m.limb(sx * E, 0, sz * E, sx * E, h[i] + 0.5, sz * E, 0.2, 0.15, { seg: 10 });
      m.color('#ff6a5a', 0.6); m.ball(sx * E, h[i] + 0.6, sz * E, 0.22, { seg: 10, rings: 6 }); m.emissive(0); m.color('#d8dce4');
      // guy lines out to ground stakes
      m.color('#8a8a92'); m.limb(sx * E, h[i] + 0.3, sz * E, sx * (E + 4.5), 0.05, sz * (E + 4.5), 0.025, 0.025, { seg: 4 }); m.color('#d8dce4');
    });
    BW11.sail(m, corner[0], corner[1], corner[2], corner[3], ['#ff6a5a', '#fff0d8', '#38c8e8', '#fff0d8', '#ffd84a', '#fff0d8', '#ff6a5a'], 12);
    const lights = [{ x: 0, y: 5.5, z: 0, s: 6, c: '#38c8e8' }, { x: 0, y: 0, z: 0, s: 0, c: '#5ad8ff', pool: 15, i: 0.5 }];
    return { cols: cs.map(([sx, sz]) => ({ t: 'cyl', x: sx * E, z: sz * E, r: 0.22, y0: 0, y1: 10 })), lights };
  });
  // fairy lights along the sail edges
  for (let i = 0; i < 4; i++) {
    const [ax, az] = cs[i], [bx, bz] = cs[(i + 1) % 4];
    for (let k = 1; k < 8; k++) { const u = k / 8, sag = Math.sin(Math.PI * u); api.glow(F.x + lerp(ax, bx, u) * E * (1 - 0.08 * sag), lerp(h[i], h[(i + 1) % 4], u) - 0.3 - 0.4 * sag, F.z + lerp(az, bz, u) * E * (1 - 0.08 * sag), 0.5, ['#fff0c8', '#5ad8ff', '#ff9ad8'][k % 3]); }
  }
  // the lifeguard-tower DJ booth: white deck, red-and-white legs, a striped umbrella over the decks
  api.roundBox(x, 0, z, 10, 1.4, 5, '#e8f0f4', { r: 0.14, top: '#38a8d8' });
  api.mesh(x, z, m => {
    m.color('#ff3b3b').shine(2);
    for (const sx of [-1, 1]) { m.limb(sx * 2.6, 1.4, -1.8, sx * 2.0, 4.6, -1.2, 0.12, 0.1, { seg: 8 }); m.limb(sx * 2.6, 1.4, 1.2, sx * 2.0, 4.6, -1.2, 0.12, 0.1, { seg: 8 }); }
    m.color('#ffffff'); for (let k = 0; k < 4; k++) { const y = 2.0 + k * 0.7; m.limb(-2.5 + k * 0.08, y, -1.6, 2.5 - k * 0.08, y, -1.6, 0.05, 0.05, { seg: 5 }); }
    m.color('#e8f0f4'); m.roundBox(0, 4.7, -1.2, 4.6, 0.2, 1.4, 0.06);
    // umbrella
    m.color('#c8c8d4').shine(3); m.limb(0, 1.4, -1.6, 0, 6.6, -1.6, 0.06, 0.05, { seg: 6 });
    const prof = []; for (let i = 0; i <= 8; i++) { const r = 3.4 * (1 - i / 8); prof.push([r, 5.4 + Math.sin(i / 8 * Math.PI / 2) * 1.3, i % 2 ? '#ffffff' : '#ff3b5c']); }
    m.push(); m.tf(0, 0, -1.6); m.lathe(prof, { seg: 16 }); m.lathe(prof, { seg: 16, flip: true }); m.pop();
    m.color('#ffe24a', 0.9); m.ball(0, 6.75, -1.6, 0.14, { seg: 8, rings: 5 }); m.emissive(0).shine(0);
    // lifebuoys on the front of the deck
    for (const sx of [-3.6, 3.6]) { m.push(); m.tf(sx, 0.8, 2.52, 0, Math.PI / 2, 0); m.color('#ff3b3b').shine(2); m.torus(0, 0, 0, 0.42, 0.13, { seg: 16, tseg: 6 }); m.pop(); }
    m.shine(0);
    return { lights: [{ x: 0, y: 5.2, z: 0.4, s: 3.5, c: '#ffd890' }, { x: 0, y: 0, z: 4, s: 0, c: '#ffb070', pool: 9, i: 0.45 }] };
  });
  BW11.djTable(api, x, 1.4, z + 0.7, 0, { body: '#2a5a8a', trim: '#e8f0f4', colA: '#5ad8ff', colB: '#ff6a5a' });
  for (const sd of [-1, 1]) api.mesh(x + sd * 7.4, z + 0.6, m => { for (let i = 0; i < 2; i++) BW11.speaker(m, 0, i * 1.6, 0, 2.2, 1.6, 1.8, { col: '#e8f0f4', cones: 1, dust: '#38a8d8' }); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.1, hz: 0.9, y0: 0, y1: 3.2 }], lights: [{ x: 0, y: 3.4, z: 1, s: 1.2, c: '#5ad8ff' }] }; });
  // giant pool floats + beach balls
  api.mesh(F.x - 14, F.z + 7, m => {
    m.color('#ff8ac8').shine(2); m.torus(0, 0.62, 0, 1.7, 0.62, { seg: 22, tseg: 10 });
    const r = mulberry32(77); for (let i = 0; i < 26; i++) { const a = r() * TAU, rr = 1.7 + r.range(-0.35, 0.35); m.color(r.pick(BURNS_NEON), 0.3); m.roundBox(Math.sin(a) * rr, 1.22, Math.cos(a) * rr, 0.24, 0.05, 0.07, 0.02); }
    m.emissive(0).shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.3, y0: 0, y1: 1.2 }] };
  }, { yaw: 0.4 });
  api.mesh(F.x + 14.5, F.z + 8, m => {
    // a big friendly rubber duck (pool-toy yellow)
    m.color('#ffd23a').shine(2); m.ellipsoid(0, 1.3, 0, 2.0, 1.25, 1.5, { seg: 18, rings: 10 }); m.ellipsoid(0, 3.0, 0.8, 0.95, 0.95, 0.95, { seg: 16, rings: 10 });
    m.ellipsoid(0, 1.8, -1.6, 0.7, 0.55, 0.5, { seg: 12, rings: 8 });
    m.color('#ff7a2a'); m.ellipsoid(0, 2.85, 1.75, 0.45, 0.16, 0.38, { seg: 12, rings: 6 });
    m.color('#1a1a22').shine(3); for (const sx of [-0.42, 0.42]) m.ball(sx, 3.25, 1.6, 0.12, { seg: 8, rings: 5 });
    m.shine(0);
    return { cols: [{ t: 'dome', x: 0, z: 0, r: 1.9, y0: 0 }] };
  }, { yaw: -0.7 });
  api.mesh(F.x, F.z, m => { BW11.beachBall(m, -5, 0.8, 9.5, 0.8); BW11.beachBall(m, 9.5, 0.6, -4, 0.6); BW11.beachBall(m, -10, 0.7, -6.5, 0.7); return {}; });
  // the high dive (a scaffold with a diving board) over the foam pool
  api.prop('scaffold', { x: D.x, z: D.z, levels: 3, lh: 2.0, w: 3, d: 3 });
  const hw = 3.2, hl = 5.0, fx = D.x + 0.75, fz = D.z + 10.2;
  S.foam = { x: fx, z: fz, hw, hl, y: 0.42 };
  api.mesh(D.x, D.z, m => {
    m.color('#f4f4f0').shine(2); m.roundBox(0.75, 6.0, 3.3, 0.8, 0.12, 4.4, 0.05);
    m.color('#38a8ff'); m.roundBox(0.75, 6.075, 3.8, 0.6, 0.02, 3.2, 0.01);
    m.color('#c8c8d4').shine(3); for (const sx of [0.3, 1.2]) { m.limb(sx, 6.0, 1.2, sx, 7.0, 1.3, 0.035, 0.035, { seg: 6 }); m.limb(sx, 7.0, 1.3, sx, 7.0, 0.4, 0.035, 0.035, { seg: 6 }); }
    m.color('#ff3b3b', 0.5); m.roundBox(0.75, 6.8, -1.55, 2.6, 0.7, 0.08, 0.04); m.emissive(0).shine(0);
    return { cols: [{ t: 'box', x: 0.75, z: 3.3, hx: 0.42, hz: 2.2, y0: 5.88, y1: 6.06 }], lights: [{ x: 0.75, y: 6.6, z: 5.2, s: 1.0, c: '#5ad8ff' }] };
  });
  api.sign('HIGH DIVE\nCANNONBALLS ONLY', D.x - 2.6, D.z + 2.2, { yaw: -Math.PI / 2, h: 1.0, style: { bg: '#e8f8ff', fg: '#1a4a8a', border: '#ff3b3b', size: 36 } });
  api.mesh(fx, fz, m => {
    m.color('#e8f4f8').shine(1);
    m.roundBox(0, 0.3, -hl - 0.3, hw * 2 + 1.2, 0.6, 0.6, 0.12); m.roundBox(0, 0.3, hl + 0.3, hw * 2 + 1.2, 0.6, 0.6, 0.12);
    m.roundBox(-hw - 0.3, 0.3, 0, 0.6, 0.6, hl * 2, 0.12); m.roundBox(hw + 0.3, 0.3, 0, 0.6, 0.6, hl * 2, 0.12);
    m.color('#9ad8f8'); m.roundBox(0, 0.15, 0, hw * 2, 0.3, hl * 2, 0.04);
    const r = mulberry32(99);
    for (let i = 0; i < 150; i++) { m.color(r.pick(['#ffffff', '#f0fbff', '#dff4ff', '#e8ecff', '#ffffff'])); m.ball(r.range(-hw + 0.3, hw - 0.3), 0.3 + r.range(0, 0.12), r.range(-hl + 0.3, hl - 0.3), r.range(0.26, 0.42), { seg: 7, rings: 5 }); }
    return { cols: [
      { t: 'box', x: 0, z: -hl - 0.3, hx: hw + 0.6, hz: 0.3, y0: 0, y1: 0.6 }, { t: 'box', x: 0, z: hl + 0.3, hx: hw + 0.6, hz: 0.3, y0: 0, y1: 0.6 },
      { t: 'box', x: -hw - 0.3, z: 0, hx: 0.3, hz: hl, y0: 0, y1: 0.6 }, { t: 'box', x: hw + 0.3, z: 0, hx: 0.3, hz: hl, y0: 0, y1: 0.6 },
      { t: 'box', x: 0, z: 0, hx: hw, hz: hl, y0: 0, y1: 0.42 }], lights: [{ x: 0, y: 0.6, z: 0, s: 3, c: '#5ad8ff' }, { x: 0, y: 0, z: 0, s: 0, c: '#5ad8ff', pool: 7, i: 0.45 }] };
  });
  // signs + light
  api.sign('THE DEEP END', F.x - 9, F.z + 13.6, { yaw: 0.3, h: 1.5, style: { bg: '#0a2a4a', fg: '#ffffff', border: '#5ad8ff', size: 52, glow: '#5ad8ff' }, glow: '#5ad8ff' });
  api.sign('NO RUNNING.\nONLY DANCING.', x + 6.5, z + 4.6, { yaw: 0, h: 0.9, style: { bg: '#e8f8ff', fg: '#ff3b3b', border: '#1a4a8a', size: 34 } });
  api.light(F.x, F.z, 16, '#5ad8ff', 0.45); api.light(fx, fz, 8, '#9ae8ff', 0.4);
};
// PLAYGROUND: a huge main stage (LED wall, truss towers, line arrays, lasers) and a welcoming lounge. Our own design;
// the camp's founder is a name on the schedule board and in crowd chatter only
BW11.buildPlayground = function (api, g) {
  const S = BW11.state, P = BW11.P.play, F = BW11.P.playFloor, L = BW11.P.lounge, x = P.x, z = P.z;
  api.roundBox(x, 0, z, 22, 1.6, 7, '#16161e', { r: 0.15, top: '#24242e' });
  // the LED wall (our own art: rings radiating from a glowing core, playground colours)
  api.mesh(x, z - 3.8, m => {
    m.color('#0a0a10').shine(1); m.roundBox(0, 6.4, -0.32, 25, 10.6, 0.5, 0.12);
    const W = 24, H = 9;
    for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) {
      const u = (i + 0.5) / W - 0.5, v = (j + 0.5) / H - 0.42, d = Math.hypot(u * 2.4, v * 1.6), ring = Math.floor(d * 7);
      const c = d < 0.18 ? '#fff4c8' : ['#ffd84a', '#ff9a3a', '#ff4fd8', '#9a6bff', '#38f2ff', '#7aff5a', '#ff4fd8', '#38f2ff'][ring % 8];
      m.color(c, 0.95); m.box(-W / 2 + i + 0.5, 1.6 + j + 0.5, 0, 0.92, 0.92, 0.08);
    }
    m.emissive(0);
    return { cols: [{ t: 'box', x: 0, z: -0.32, hx: 12.5, hz: 0.3, y0: 0, y1: 11.7 }], lights: [{ x: 0, y: 6, z: 1.5, s: 9, c: '#ff9ad8' }, { x: 0, y: 0, z: 8, s: 0, c: '#ff70c0', pool: 20, i: 0.5 }] };
  });
  // truss towers with line arrays and moving-head lights
  for (const sd of [-1, 1]) api.mesh(x + sd * 13.6, z + 0.5, m => {
    m.color('#b8b8c4').shine(3);
    const s = 0.7, top = 13;
    for (const [px, pz] of [[-s, -s], [s, -s], [s, s], [-s, s]]) m.limb(px, 0, pz, px, top, pz, 0.06, 0.06, { seg: 6 });
    for (let k = 0; k < 13; k++) { const y0 = k, y1 = k + 1; m.limb(-s, y0, s, s, y1, s, 0.03, 0.03, { seg: 4 }); m.limb(s, y0, -s, -s, y1, -s, 0.03, 0.03, { seg: 4 }); m.limb(s, y0, s, s, y1, -s, 0.03, 0.03, { seg: 4 }); m.limb(-s, y0, -s, -s, y1, s, 0.03, 0.03, { seg: 4 }); }
    m.roundBox(0, top, 0, 1.8, 0.2, 1.8, 0.05);
    // line array: a gently curved column of cabinets hanging off the front
    m.color('#1a1a20').shine(1); for (let k = 0; k < 7; k++) { const a = k * 0.05; m.push(); m.tf(0, 11.6 - k * 0.62, 1.5 + Math.sin(a) * 0.8, 0, -a, 0); m.roundBox(0, 0, 0, 1.3, 0.56, 0.9, 0.06); m.color('#3a3a44'); m.roundBox(0, 0, 0.46, 1.1, 0.4, 0.02, 0.02); m.color('#1a1a20'); m.pop(); }
    // moving heads
    for (let k = 0; k < 4; k++) { m.color('#2a2a30').shine(2); m.roundBox(-0.6 + k * 0.4, top + 0.35, 0.7, 0.26, 0.34, 0.26, 0.06); m.color(BURNS_NEON[(k + (sd > 0 ? 3 : 0)) % 7], 1); m.ball(-0.6 + k * 0.4, top + 0.35, 0.84, 0.09, { seg: 8, rings: 5 }); m.emissive(0); }
    m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.8, hz: 0.8, y0: 0, y1: top + 0.1, camPass: true }], lights: [{ x: 0, y: top + 0.4, z: 1, s: 2.4, c: sd < 0 ? '#ff4fd8' : '#38f2ff' }] };
  });
  // subwoofer stacks in front of the deck
  for (const sd of [-1, 1]) api.mesh(x + sd * 9.2, z + 4.6, m => { for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) BW11.speaker(m, (k - 0.5) * 2.2, i * 1.5, 0, 2.1, 1.5, 1.8, { col: '#1c1c22', cones: 1, dust: '#ff9a3a' }); return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.2, hz: 0.9, y0: 0, y1: 3.0 }] }; });
  BW11.djTable(api, x, 1.6, z + 1.2, 0, { body: '#1a1a22', trim: '#ffd84a', colA: '#ff9a3a', colB: '#38f2ff' });
  // dance floor: warm dust with big soft rings of light
  api.paint((c, Pt, sc) => {
    for (let k = 0; k < 4; k++) { const [cx, cz] = Pt(F.x, F.z), r0 = (F.r - k * 3) * sc; c.strokeStyle = ['rgba(255,154,58,0.3)', 'rgba(255,79,216,0.28)', 'rgba(56,242,255,0.26)', 'rgba(255,216,74,0.3)'][k]; c.lineWidth = 0.9 * sc; c.beginPath(); c.arc(cx, cz, r0, 0, TAU); c.stroke(); }
  });
  for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; api.glow(F.x + Math.sin(a) * (F.r + 0.8), 0.3, F.z + Math.cos(a) * (F.r + 0.8), 0.6, BURNS_NEON[i % 7], { blink: 2 }); }
  api.sign('PLAYGROUND', F.x - 15.5, F.z + 4, { yaw: -1.0, h: 1.7, style: { bg: '#100a20', fg: '#ffd84a', border: '#ff9a3a', size: 56, glow: '#ff9a3a' }, glow: '#ffd84a' });
  // the schedule board: the only place the camp's founder appears
  api.sign('PLAYGROUND · TONIGHT\nWARM-UP: DJ LATE CHECKOUT\nCARL COX\n· TILL SUNRISE ·', F.x + 15.5, F.z + 7, { yaw: 1.05, h: 1.9, style: { bg: '#1a1424', fg: '#ffffff', border: '#ffd84a', size: 40, glow: '#ffd84a' }, glow: '#ff9a3a' });
  api.light(F.x, F.z, 20, '#ff9a3a', 0.45); api.light(x, z + 5, 14, '#ff4fd8', 0.4);
  S.lasers.push({ x: x - 13.6, y: 13.6, z: z + 1.4, yaw: 0.35, n: 6, spread: 1.5, col: [[1, 0.6, 0.2], [1, 0.3, 0.85], [0.3, 1, 0.5]], rate: 0.6, len: 75, tilt: 0.1, ph: 7 });
  S.lasers.push({ x: x + 13.6, y: 13.6, z: z + 1.4, yaw: -0.35, n: 6, spread: 1.5, col: [[0.22, 0.95, 1], [1, 0.85, 0.3], [0.6, 0.42, 1]], rate: 0.6, len: 75, tilt: 0.1, ph: 8 });
  // the lounge: shade, rugs, couches, a chai bar, lanterns
  api.prop('shade', { x: L.x, z: L.z, w: 10, d: 8, h: 3.2, col: '#e8d4b8' });
  api.paint((c, Pt, sc) => {
    const r = mulberry32(5150);
    for (let i = 0; i < 5; i++) { const [px, pz] = Pt(L.x - 3.5 + i * 1.8, L.z + r.range(-2, 2)); c.save(); c.translate(px, pz); c.rotate(r.range(-0.4, 0.4)); c.fillStyle = r.pick(['rgba(160,40,60,0.85)', 'rgba(40,70,140,0.85)', 'rgba(170,110,40,0.85)', 'rgba(90,40,120,0.85)']); c.fillRect(-1.3 * sc, -0.9 * sc, 2.6 * sc, 1.8 * sc); c.strokeStyle = 'rgba(255,220,150,0.7)'; c.lineWidth = 0.12 * sc; c.strokeRect(-1.1 * sc, -0.7 * sc, 2.2 * sc, 1.4 * sc); c.restore(); }
  });
  api.prop('couch', { x: L.x - 3, z: L.z - 2.6, yaw: 0, col: '#8a2a5a' }); api.prop('couch', { x: L.x + 2.4, z: L.z - 2.8, yaw: 0, col: '#2a5a8a' });
  api.prop('couch', { x: L.x + 4.2, z: L.z + 1.4, yaw: -Math.PI / 2, col: '#6a4a2a' });
  api.roundBox(L.x - 2.2, 0, L.z + 2.6, 3.4, 1.0, 0.8, '#7a5032', { r: 0.1, top: '#c8a070' });
  for (let i = 0; i < 6; i++) api.glow(L.x - 4.5 + i * 1.8, 2.9, L.z + (i % 2 ? 3.6 : -3.6), 0.55, ['#ffd890', '#ff9a3a', '#ffb070'][i % 3]);
  api.sign('THE LOUNGE\nCHAI · WATER · HUGS (ASK FIRST)', L.x, L.z + 4.6, { yaw: 0, h: 1.0, style: { bg: '#2a1a10', fg: '#ffd890', border: '#ff9a3a', size: 34, glow: '#ffb070' }, glow: '#ffb070' });
  api.light(L.x, L.z, 9, '#ffb070', 0.5);
};
// DISORIENT: a neon art compound (pink and orange everything) with a big dance floor. Our own design
BW11.buildDisorient = function (api, g) {
  const S = BW11.state, P = BW11.P.dis, F = BW11.P.disFloor, x = P.x, z = P.z;
  api.roundBox(x, 0, z, 13, 1.2, 5, '#1a1020', { r: 0.12, top: '#2a1a30' });
  api.mesh(x, z, m => {
    // a giant neon portal framing the decks: three rings, pink to orange
    [[6.4, '#ff4fd8'], [5.7, '#ff7a2a'], [5.0, '#ff4fd8']].forEach(([R, c], i) => { m.push(); m.tf(0, 6.6, -1.6 - i * 0.25, 0, Math.PI / 2, 0); m.color(c, 1); m.torus(0, 0, 0, R, 0.15, { seg: 44, tseg: 6 }); m.pop(); });
    m.emissive(0);
    m.color('#2a1a30').shine(2); for (const sd of [-1, 1]) m.limb(sd * 6.4, 0, -1.6, sd * 6.4, 6.6, -1.6, 0.18, 0.14, { seg: 8 });
    // neon triangles stacked behind the portal
    for (let k = 0; k < 5; k++) { const tx = -6 + k * 3, ty = 1.2, th = 3 + (k % 2) * 1.6, c = k % 2 ? '#ff7a2a' : '#ff4fd8'; m.color(c, 1); m.limb(tx - 1.4, ty, -2.3, tx, ty + th, -2.3, 0.07, 0.07, { seg: 5 }); m.limb(tx, ty + th, -2.3, tx + 1.4, ty, -2.3, 0.07, 0.07, { seg: 5 }); m.limb(tx - 1.4, ty, -2.3, tx + 1.4, ty, -2.3, 0.07, 0.07, { seg: 5 }); }
    m.emissive(0).shine(0);
    return { lights: [{ x: 0, y: 6.6, z: -1.2, s: 7, c: '#ff4fd8' }, { x: 0, y: 0, z: 5, s: 0, c: '#ff70b0', pool: 16, i: 0.55 }] };
  });
  BW11.djTable(api, x, 1.2, z + 0.9, 0, { body: '#1a1020', trim: '#ff7a2a', colA: '#ff4fd8', colB: '#ff7a2a' });
  for (const sd of [-1, 1]) api.mesh(x + sd * 8.2, z + 1.2, m => { for (let i = 0; i < 3; i++) BW11.speaker(m, 0, i * 1.45, 0, 2.2, 1.45, 1.8, { col: '#24182c', cones: 1, dust: '#ff4fd8' }); m.color(sd < 0 ? '#ff4fd8' : '#ff7a2a', 1); m.roundBox(0, 4.45, 0.92, 2.0, 0.08, 0.04, 0.02); m.emissive(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.1, hz: 0.9, y0: 0, y1: 4.35 }] }; });
  // neon arch tunnel at the entrance
  api.mesh(F.x, F.z + F.r + 2.5, m => {
    for (let k = 0; k < 5; k++) { m.push(); m.tf(0, 2.1, -k * 1.4, 0, Math.PI / 2, 0); m.color(k % 2 ? '#ff7a2a' : '#ff4fd8', 1); m.torus(0, 0, 0, 2.6, 0.09, { seg: 28, tseg: 5 }); m.pop(); }
    m.emissive(0);
    return { lights: [{ x: 0, y: 2.2, z: -2.8, s: 3.5, c: '#ff70b0' }] };
  });
  // floor: concentric pink/orange rings + chevrons
  api.paint((c, Pt, sc) => {
    const [cx, cz] = Pt(F.x, F.z);
    for (let k = 0; k < 6; k++) { c.strokeStyle = k % 2 ? 'rgba(255,122,42,0.34)' : 'rgba(255,79,216,0.34)'; c.lineWidth = 0.7 * sc; c.beginPath(); c.arc(cx, cz, (F.r - k * 1.6) * sc, 0, TAU); c.stroke(); }
  });
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; api.glow(F.x + Math.sin(a) * (F.r + 0.7), 0.3, F.z + Math.cos(a) * (F.r + 0.7), 0.6, i % 2 ? '#ff7a2a' : '#ff4fd8', { blink: 3 }); }
  api.prop('pennants', { x: 0, z: 0, x0: F.x - F.r, y0: 4.2, z0: F.z + 2, x1: F.x + F.r, y1: 4.2, z1: F.z + 2, n: 20, sag: 0.8 });
  for (const sd of [-1, 1]) api.capsule(F.x + sd * F.r, 0, F.z + 2, 0.08, 4.3, '#3a2a40', { col: { camPass: true } });
  api.sign('DISORIENT', F.x + 12.5, F.z + 7.5, { yaw: 0.9, h: 1.6, style: { bg: '#1a0a1a', fg: '#ff7a2a', border: '#ff4fd8', size: 56, glow: '#ff4fd8' }, glow: '#ff7a2a' });
  api.light(F.x, F.z, 15, '#ff70b0', 0.5);
  S.lasers.push({ x, y: 9.2, z: z - 1.4, yaw: 0, n: 5, spread: 1.3, col: [[1, 0.3, 0.85], [1, 0.5, 0.15]], rate: 0.9, len: 60, tilt: 0.14, ph: 9 });
};
