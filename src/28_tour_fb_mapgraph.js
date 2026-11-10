/* ============================================================
   World tour: the map graph (LEVEL_OVERHAUL.md §3.6, §3.7; W13).
   Country panel: stops are levels and houses on one grid, secret
   stops and houses appear once revealed, trails solid / dotted /
   gold, exit pips, ARCH_LABEL, a fort roof per country, the reveal
   queue (trail grows, stop pops, banner) and Brady walking the
   trails. World map: landmarks in the Baron's jars (they shatter
   when the boss falls), the airship, a contrail, secret-flight
   arcs, bottle currents and the Postcard Lighthouse, cloud shadows.
   ============================================================ */

TourLandscape.ARCH_LABEL = {
  parade: 'PARADE', rail: 'RAIL', dive: 'DIVE', tower: 'TOWER', freefall: 'FREEFALL', fall: 'FREEFALL', flip: 'FLIP', swing: 'SWING',
  race: 'RACE', factory: 'FACTORY', tide: 'TIDE', beat: 'BEAT', thief: 'THIEF', glide: 'GLIDE', doom: 'DOOM', sky: 'SKY', carry: 'CARRY',
  dig: 'DIG', maze: 'MAZE', scroll: 'SCROLL', phase: 'PHASE', fort: 'FORT', hold: 'HOLD', mini: 'MINI', switch: 'SWITCH', hub: 'HUB',
  ride: 'RIDE', roll: 'ROLL', lamp: 'LAMP', sneak: 'SNEAK', lair: 'BOSS', castle: 'BOSS', arena: 'BOSS', boss: 'BOSS', house: 'SOUVENIRS'
};
TourLandscape.label = function (L) { return (L.arch && this.ARCH_LABEL[L.arch]) || this.STYLE[L.style] || 'RUN'; };

// the boss fort's roof motif per country (map.fort)
TourLandscape.fortRoof = function (ctx, kind, x, y, r, ink) {
  ctx.save(); ctx.strokeStyle = ink; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
  const top = y - r * 0.8;
  const tri = (h, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - r - 2, top); ctx.lineTo(x, top - h); ctx.lineTo(x + r + 2, top); ctx.closePath(); ctx.fill(); ctx.stroke(); };
  const dome = (col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, top, r * 0.75, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); };
  switch (kind) {
    case 'hacienda': case 'lonja': tri(r * 0.7, '#d0603a'); break;                      // terracotta tiles
    case 'riad': case 'garden': dome('#4fa88a'); break;                                  // a green dome
    case 'chateau': case 'waag': ctx.fillStyle = '#5a6a9a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * r * 0.7 - 4, top); ctx.lineTo(x + s * r * 0.7, top - r * 0.9); ctx.lineTo(x + s * r * 0.7 + 4, top); ctx.closePath(); ctx.fill(); ctx.stroke(); } break;
    case 'crater': case 'summit': ctx.fillStyle = '#8a7a8a'; ctx.beginPath(); ctx.moveTo(x - r, top); ctx.lineTo(x - 3, top - r * 0.8); ctx.lineTo(x + 3, top - r * 0.8); ctx.lineTo(x + r, top); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff8a3a'; ctx.fillRect(x - 2.5, top - r * 0.8 - 2, 5, 2); break;
    case 'stadium': ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.ellipse(x, top, r * 1.05, r * 0.32, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case 'seafort': case 'floe': ctx.fillStyle = '#e8f4ff'; ctx.fillRect(x - 2, top - r * 0.9, 4, r * 0.9); ctx.strokeRect(x - 2, top - r * 0.9, 4, r * 0.9); ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.moveTo(x + 2, top - r * 0.9); ctx.lineTo(x + 9, top - r * 0.7); ctx.lineTo(x + 2, top - r * 0.5); ctx.fill(); break;
    case 'grove': case 'citadel': ctx.fillStyle = '#4a9a5a'; for (const dx of [-0.6, 0, 0.6]) { ctx.beginPath(); ctx.arc(x + dx * r, top - 2, r * 0.35, 0, TAU); ctx.fill(); ctx.stroke(); } break;
    case 'door': ctx.fillStyle = '#ffd86b'; ctx.beginPath(); ctx.ellipse(x, top - r * 0.3, r * 0.5, r * 0.6, 0, 0, TAU); ctx.fill(); ctx.stroke(); break;
  }
  ctx.restore();
};

/* ---------- a house room: the stand's stamp (country stamp 'stand' or the shared default) with the counter ---------- */
const TOUR_STAND_ROWS = [
  '############################',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#..........................#',
  '#.@........$............G..#',
  '############################',
  '############################'
];
Tour.houseLevel = function (houseId) {
  const hh = Tour.house(houseId); if (!hh) return null;
  const { C, H, index } = hh;
  const S = (H.stamp && TourStamp.get(H.stamp, C.id)) || TourStamp.get('stand', C.id) || { id: 'stand', rows: TOUR_STAND_ROWS, legend: {} };
  const stamp = Object.assign({}, S, { legend: Object.assign({}, S.legend || {}, { $: ['piece', 'shop', { stock: H.stock || null, look: H.look || null }] }) });
  const theme = H.theme || (C.levels[0] && C.levels[0].theme);
  const spec = { name: H.name || 'Souvenir Stand', arch: 'house', theme, exits: { main: { to: null } }, areas: [{ id: 'stand', gen: 'room', stamp, theme: H.roomTheme || null }] };
  const lvl = TourBuild.fromSpec(C, spec, 80 + index);
  lvl.id = 'house:' + H.id; lvl.house = H.id; lvl.name = spec.name; lvl.hint = 'Spend coins on souvenirs (THROW to buy), then take the gate';
  return lvl;
};
// leaving a house: count the visit, never touch level progress
{
  const rp = Play.prototype.recordProgress;
  Play.prototype.recordProgress = function () {
    if (!this.level.house) return rp.call(this);
    const T = TourProgress.data(); T.houses[this.level.house] = (T.houses[this.level.house] || 0) + 1; Save.save(); this.opened = null;
  };
  const nx = Play.prototype.nextLevelId;
  Play.prototype.nextLevelId = function () { return this.level.house ? null : nx.call(this); };
}

/* ---------- the country panel ---------- */
const TourPanel = {
  // every stop of a country: { k (stop index), kind: 'level' | 'house', id, L or H, secret, visible }
  stops(C) {
    const out = [], n = C.levels.length;
    Tour.panelStops(C).forEach((S, k) => {
      if (k < n) {
        const id = C.world + '-' + (k + 1);
        let visible = TourProgress.isRevealed(id);
        if (S.mapHidden && !TourProgress.isUnlocked(id)) visible = false;
        out.push({ k, kind: 'level', id, L: S, secret: !!S.secret, visible });
      } else out.push({ k, kind: 'house', id: 'house:' + S.id, H: S, L: S, secret: true, visible: TourProgress.isRevealed('house:' + S.id) });
    });
    return out;
  },
  froms(S, k) { const f = S.mapFrom != null ? S.mapFrom : k - 1; return (Array.isArray(f) ? f : [f]).filter(x => x >= 0); }
};

(() => {
  const P = TourMapScene.prototype, oldDraw = P.drawPanel, oldUpdate = P.update, oldPlay = P.play, oldDrawMap = P.draw;

  P.layoutPanel = function () {
    const C = Tour.countries[this.sel], R = this.panelR; this.stamps = []; this.terrainR = null; this.landmarkAt = null; this.stopAt = {};
    if (!C) return;
    const head = 56, foot = C.power ? 44 : 12;
    const A = { x: R.x + 8, y: R.y + head, w: R.w - 16, h: Math.max(90, R.h - head - foot) };
    this.terrainR = A;
    const all = Tour.panelStops(C), G = TourLandscape.grid(all), cw = A.w / G.cols, ch = A.h / G.rows;
    const compact = ch < 62, r = Math.max(9, Math.min(14, ch * 0.15)), lh = cw > 100 ? 13 : 12;
    const blockH = 7 + 2 * r + 4 + (compact ? lh + 2 : 2 * lh + 12);
    this.stopLook = { r, lh, compact, cw, ch };
    const used = {};
    this.panelStopsInfo = TourPanel.stops(C);
    const reveal = this.reveal && this.reveal.r;
    for (const S of this.panelStopsInfo) {
      const [col, row] = G.cells[S.k]; used[col + ',' + row] = true;
      // a stop being revealed right now is laid out (it pops in)
      const popping = reveal && ((reveal.kind === 'stop' && reveal.id === S.id) || (reveal.kind === 'house' && 'house:' + reveal.id === S.id));
      // the far end of a trail being drawn is laid out (not drawn) so the trail has somewhere to go
      const ghost = !S.visible && !popping && reveal && reveal.kind === 'path' && reveal.cc === C.id && reveal.to === S.k;
      if (!S.visible && !popping && !ghost) continue;
      const x = A.x + col * cw, y = A.y + (G.rows - 1 - row) * ch;
      const slack = Math.max(0, ch - 4 - blockH), jit = (col % 2 ? -1 : 1) * Math.min(slack / 2, ch * 0.1);
      const top = y + 2 + slack / 2 + jit;
      const st = { i: S.kind === 'house' ? S.id : S.k + 1, k: S.k, S, x: x + 2, y: y + 2, w: cw - 4, h: ch - 4, cx: x + cw / 2, cy: top + 7 + r, top, from: TourPanel.froms(S.L, S.k), ghost };
      this.stamps.push(st); this.stopAt[S.k] = st;
    }
    this.stampAt = this.stopAt;
    let free = null;
    for (let row = G.rows - 1; row >= 0 && !free; row--) for (let col = 0; col < G.cols; col++) if (!used[col + ',' + row]) { free = [col, row]; break; }
    if (free) { const s = Math.min(cw * 0.62, ch * 0.72, 72); this.landmarkAt = { x: A.x + (free[0] + 0.5) * cw, y: A.y + (G.rows - 1 - free[1]) * ch + ch * 0.5 + s * 0.5, size: s }; }
    else this.landmarkAt = { x: A.x + A.w * 0.9, y: A.y + A.h * 0.3, size: Math.min(26, A.h * 0.16) };
    // Brady stands on his stop for this country
    const T = TourProgress.data(); T.panelAt = T.panelAt || {};
    let at = T.panelAt[C.id];
    if (at == null || !this.stopAt[at]) { const act = this.stamps.find(b => !b.ghost && b.S.kind === 'level' && TourProgress.isUnlocked(b.S.id) && !Save.data.done[b.S.id]); at = act ? act.k : (this.stamps[0] ? this.stamps[0].k : 0); }
    if (!this.walker || this.walker.cc !== C.id) { const b = this.stopAt[at]; this.walker = b ? { cc: C.id, k: at, x: b.cx, y: b.cy, path: null, facing: 1, t: 0 } : null; }
    else if (!this.walker.path) { const b = this.stopAt[this.walker.k]; if (b) { this.walker.x = b.cx; this.walker.y = b.cy; } }
  };

  // trails between visible stops: [{ a, b, solid, gold }]
  P.panelTrails = function (C) {
    const T = TourProgress.data(), out = [];
    for (const b of this.stamps) for (const ak of b.from) {
      const a = this.stopAt[ak]; if (!a) continue;
      if (b.ghost && !(this.reveal && this.reveal.r.kind === 'path' && this.reveal.r.from === ak)) continue;
      const path = !!T.paths[C.id + ':' + ak + '>' + b.k] || !!T.paths[C.id + ':' + b.k + '>' + ak];
      const open = b.S.kind === 'level' ? TourProgress.isUnlocked(b.S.id) && !b.S.secret : false;
      out.push({ a, b, solid: path || open || (b.S.secret && b.S.visible && path), gold: !!a.S.secret || !!b.S.secret });
    }
    return out;
  };
  const bez = (a, b, A) => {
    const my = (a.cy + b.cy) / 2;
    if (Math.abs(a.cy - b.cy) < 4) return [a.cx, a.cy, (a.cx * 2 + b.cx) / 3, a.cy + 10, (a.cx + b.cx * 2) / 3, b.cy - 10, b.cx, b.cy];
    return [a.cx, a.cy, a.cx + (a.cx > A.x + A.w / 2 ? 26 : -26), my, b.cx + (b.cx > A.x + A.w / 2 ? 26 : -26), my, b.cx, b.cy];
  };
  const bezAt = (q, u) => { const v = 1 - u; return [v * v * v * q[0] + 3 * v * v * u * q[2] + 3 * v * u * u * q[4] + u * u * u * q[6], v * v * v * q[1] + 3 * v * v * u * q[3] + 3 * v * u * u * q[5] + u * u * u * q[7]]; };
  P.trailPoints = function (a, b) { const q = bez(a, b, this.terrainR), pts = []; for (let k = 0; k <= 24; k++) pts.push(bezAt(q, k / 24)); return pts; };

  P.drawPanel = function (ctx) {
    const C = Tour.countries[this.sel], R = this.panelR, s = Tour.stops[this.sel];
    if (!C || TourMap.stopState(s) === 'locked' || !this.terrainR) { oldDraw.call(this, ctx); return; }
    const c = TourLandscape.look(this.sel), A = this.terrainR, K = this.stopLook, T = TourProgress.data(), t = this.t;
    const rv = this.reveal && this.reveal.r && this.reveal.r.cc === C.id ? this.reveal : null;
    ctx.save();
    ctx.fillStyle = '#152c3c'; rr(ctx, R.x, R.y, R.w, R.h, 19); ctx.fill(); ctx.strokeStyle = 'rgba(255,244,214,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = c[5]; ctx.font = `${Math.min(20, R.w / 12)}px ${FONT_DISPLAY}`; ctx.fillText(s.name.toUpperCase(), R.x + 16, R.y + 21, R.w - 32);
    ctx.fillStyle = '#c9dde0'; ctx.font = `11px ${FONT_UI}`; ctx.fillText(TourLandscape.fit(ctx, C.tagline || s.sub || 'Choose your next adventure', R.w - 32), R.x + 16, R.y + 41);
    TourLandscape.scenery(ctx, A, this.sel, t, this.landmarkAt);
    // trails: solid when walked (or opened), dotted ahead, gold from or to a secret; the one being revealed grows
    ctx.lineCap = 'round';
    for (const tr of this.panelTrails(C)) {
      const growing = rv && rv.r.kind === 'path' && rv.r.from === tr.a.k && rv.r.to === tr.b.k;
      const pts = this.trailPoints(tr.a, tr.b), n = growing ? Math.max(1, Math.floor(clamp(rv.k, 0, 1) * 24)) : 24;
      const line = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let q = 1; q <= n; q++) ctx.lineTo(pts[q][0], pts[q][1]); };
      ctx.strokeStyle = 'rgba(45,67,63,0.35)'; ctx.lineWidth = 10; line(); ctx.stroke();
      ctx.strokeStyle = tr.gold ? '#ffd84a' : tr.solid ? c[5] : 'rgba(255,244,215,0.7)'; ctx.lineWidth = tr.gold ? 5 : 6;
      ctx.setLineDash(growing ? [6, 6] : tr.solid ? [] : [2, 7]); if (growing) ctx.lineDashOffset = -t * 40; line(); ctx.stroke(); ctx.setLineDash([]);
      if (growing) { const [hx, hy] = pts[n]; ctx.fillStyle = '#fff8d0'; ctx.beginPath(); TourKit.star(ctx, hx, hy, 5, 3 + Math.sin(t * 20) * 1.5, 7); ctx.fill(); }
    }
    const active = this.stamps.find(b => !b.ghost && b.S.kind === 'level' && TourProgress.isUnlocked(b.S.id) && !Save.data.done[b.S.id]);
    const r = K.r, lh = K.lh, labelW = Math.max(40, K.cw - 8);
    this.stamps.forEach((b, k) => {
      const S = b.S, L = S.L, id = S.id, isHouse = S.kind === 'house', open = isHouse || TourProgress.isUnlocked(id), done = !isHouse && !!Save.data.done[id];
      const boss = !isHouse && (L.kind === 'castle' || L.style === 'castle'), foc = this.focus === k && !Input.usingTouch;
      const x = b.cx, y = b.cy;
      // the pop of a stop being revealed: scale 0 -> 1.25 -> 1 (back-out)
      const popping = rv && ((rv.r.kind === 'stop' && rv.r.id === id) || (rv.r.kind === 'house' && 'house:' + rv.r.id === id));
      const sc = popping ? (rv.k < 0 ? 0 : TourPanelFx.backOut(clamp(rv.k / 0.45, 0, 1))) : 1;
      if (sc <= 0.01 || b.ghost) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
      if (!isHouse) {
        const gold = Save.data.gold[id] || [];
        for (let q = 0; q < 3; q++) { ctx.fillStyle = gold[q] ? '#ffdc71' : 'rgba(35,69,69,0.35)'; rr(ctx, x - 9.5 + q * 7, b.top, 5, 4, 1); ctx.fill(); }
        // exit pips under the postcard marks, after the first clear
        if (done) { const E = TourProgress.exitsFound(id); if (E.total > 1) for (let q = 0; q < E.total; q++) { ctx.fillStyle = q < E.found ? '#7ae0ff' : 'rgba(35,69,69,0.45)'; ctx.beginPath(); ctx.arc(x - (E.total - 1) * 3 + q * 6, b.top + 7.5, 1.9, 0, TAU); ctx.fill(); } }
      }
      ctx.fillStyle = 'rgba(30,55,54,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + r + 2, r + 3, 3, 0, 0, TAU); ctx.fill();
      if (active === b || foc) { ctx.strokeStyle = foc ? '#ffd84a' : '#fff7d8'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, r + 4.5, 0, TAU); ctx.stroke(); }
      if (isHouse) TourPanelFx.house(ctx, x, y, r, C.colors ? C.colors.a : '#ff4f8a', t);
      else {
        ctx.fillStyle = done ? '#f5c75e' : open ? '#fff7df' : '#6d8483'; ctx.strokeStyle = '#30474f'; ctx.lineWidth = 2;
        if (boss) {
          rr(ctx, x - r, y - r * 0.8, r * 2, r * 1.8, 3); ctx.fill(); ctx.stroke();
          for (let q = -1; q <= 1; q++) { ctx.fillRect(x + q * r * 0.7 - 2.5, y - r * 0.8 - 4, 5, 5); ctx.strokeRect(x + q * r * 0.7 - 2.5, y - r * 0.8 - 4, 5, 5); }
          if (C.map && C.map.fort) TourLandscape.fortRoof(ctx, C.map.fort, x, y - 4, r, '#30474f');
          if (open) { ctx.fillStyle = '#30474f'; rr(ctx, x - 3.5, y + r * 0.1, 7, r * 0.9, 3); ctx.fill(); }
          else TourLandscape.lock(ctx, x, y - r * 0.15, r * 1.1, '#2b3e45');
        } else {
          ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
          if (S.secret) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, r + 2.5, 0, TAU); ctx.stroke(); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); TourKit.star(ctx, x + r * 0.85, y - r * 0.85, 5, 2.2, 5); ctx.fill(); }
          if (!open) TourLandscape.lock(ctx, x, y - r * 0.12, r * 1.15, '#2b3e45');
          else { ctx.fillStyle = '#30474f'; ctx.textAlign = 'center'; ctx.font = `${Math.round(r * 1.05)}px ${FONT_DISPLAY}`; ctx.fillText(done ? '✓' : String(S.k + 1), x, y + 1); }
        }
        // the Postcard Lighthouse marks stops that still hide an exit
        if (T.lighthouse && done) { const E = TourProgress.exitsFound(id); if (E.found < E.total) TourPanelFx.flag(ctx, x - r - 4, y - r, t); }
      }
      ctx.font = `${lh - 1.5}px ${FONT_UI}`; ctx.textAlign = 'center';
      const lines = TourLandscape.wrap(ctx, isHouse ? (S.H.name || 'Souvenir Stand') : L.name, labelW - 8, K.compact ? 1 : 2);
      let pw = 0; for (const l of lines) pw = Math.max(pw, ctx.measureText(l).width);
      const ly = y + r + 4, type = K.compact ? '' : isHouse ? 'SOUVENIRS' : TourLandscape.label(L);
      if (type) { ctx.font = `bold 10px ${FONT_UI}`; pw = Math.max(pw, ctx.measureText(type).width); }
      ctx.fillStyle = open ? 'rgba(18,52,62,0.93)' : 'rgba(52,78,82,0.9)'; rr(ctx, x - pw / 2 - 5, ly, pw + 10, lines.length * lh + (type ? 12 : 2), 5); ctx.fill();
      ctx.font = `${lh - 1.5}px ${FONT_UI}`; ctx.fillStyle = open ? '#fff5d9' : '#cfdcd7';
      lines.forEach((l, i) => ctx.fillText(l, x, ly + 1 + lh * (i + 0.5)));
      if (type) { ctx.font = `bold 10px ${FONT_UI}`; ctx.fillStyle = boss ? '#ffb27a' : S.secret ? '#ffd84a' : open ? '#8fd6c4' : '#a9bdb8'; ctx.fillText(type, x, ly + lines.length * lh + 6.5); }
      ctx.restore();
    });
    // confetti of a pop
    if (rv && rv.sparks) for (const sp of rv.sparks) { ctx.fillStyle = sp.c; ctx.globalAlpha = clamp(1 - sp.age / 0.9, 0, 1); ctx.fillRect(sp.x - 2, sp.y - 2, 4, 4); ctx.globalAlpha = 1; }
    // Brady on his stop (or walking the trails)
    const w = this.walker;
    if (w && w.cc === C.id) {
      const walking = !!w.path;
      ctx.save(); ctx.fillStyle = 'rgba(30,55,54,0.3)'; ctx.beginPath(); ctx.ellipse(w.x, w.y - r * 0.2 + 1, 7, 2.2, 0, 0, TAU); ctx.fill(); ctx.restore();
      drawBrady(ctx, { x: w.x + (walking ? 0 : r + 4), y: w.y - r * 0.2, facing: w.facing, small: true, power: 0, anim: { state: walking ? 'run' : 'idle', t: t, phase: (w.t * 9) % 1 }, look: Save.data.look, time: t, scale: 0.6 });
      for (const d of w.dust || []) { ctx.fillStyle = `rgba(255,248,220,${clamp(1 - d.age / 0.5, 0, 1) * 0.8})`; ctx.beginPath(); ctx.arc(d.x, d.y, 3 + d.age * 8, 0, TAU); ctx.fill(); }
    }
    if (C.power) {
      const y = R.y + R.h - 24;
      ctx.save(); ctx.translate(R.x + 24, y); ctx.scale(0.75, 0.75); if (C.power.icon) C.power.icon(ctx, 0, 0, t); ctx.restore();
      ctx.textAlign = 'left'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.fillStyle = '#ffd84a'; ctx.fillText(TourLandscape.fit(ctx, 'SOUVENIR: ' + C.power.name.toUpperCase(), R.w - 54), R.x + 44, y - 6);
      ctx.font = `11px ${FONT_UI}`; ctx.fillStyle = '#c3d6da'; ctx.fillText(TourLandscape.fit(ctx, C.power.hint || '', R.w - 54), R.x + 44, y + 9);
    }
    ctx.restore();
  };

  /* ---------- Brady walks the trails: BFS over visible trails, 160 px/s; a second tap opens the level ---------- */
  P.walkTo = function (k) {
    const C = Tour.countries[this.sel], w = this.walker; if (!C || !w) return false;
    if (w.k === k && !w.path) return false;
    if (w.path) { const b = this.stopAt[w.path[w.path.length - 1]]; if (b) { w.k = w.path[w.path.length - 1]; w.x = b.cx; w.y = b.cy; } w.path = null; }   // a tap mid-walk: jump there
    if (w.k === k) return false;
    // BFS over the visible trails (both directions)
    const adj = {}; for (const tr of this.panelTrails(C)) { (adj[tr.a.k] = adj[tr.a.k] || []).push(tr.b.k); (adj[tr.b.k] = adj[tr.b.k] || []).push(tr.a.k); }
    const prev = { [w.k]: -1 }, q = [w.k];
    while (q.length) { const u = q.shift(); if (u === k) break; for (const v of adj[u] || []) if (prev[v] === undefined) { prev[v] = u; q.push(v); } }
    let route = [];
    if (prev[k] === undefined) route = [k]; else { for (let v = k; v !== -1; v = prev[v]) route.unshift(v); route.shift(); }
    w.path = route; w.seg = 0; w.from = { x: w.x, y: w.y }; w.u = 0; w.dust = w.dust || [];
    const T = TourProgress.data(); T.panelAt = T.panelAt || {}; T.panelAt[C.id] = k;
    return true;
  };
  P.play = function (i) {
    const C = Tour.countries[this.sel]; if (!C || this.flight || this.reveal) return;
    const S = typeof i === 'string' ? this.stamps.find(b => b.i === i) : this.stamps.find(b => b.i === i);
    if (S && this.walker && (this.walker.k !== S.k || this.walker.path) && (S.S.kind === 'house' || TourProgress.isUnlocked(S.S.id))) { if (this.walkTo(S.k)) { Sound.play('select', { vol: 0.4 }); return; } }
    if (typeof i === 'string' && i.startsWith('house:')) {
      const lvl = Tour.houseLevel(i.slice(6)); if (!lvl) return;
      Sound.play('select'); TourProgress.data().at = C.id; Save.save(); Game.setScene(new Play(lvl, {})); return;
    }
    return oldPlay.call(this, i);
  };

  /* ---------- the reveal queue ---------- */
  P.startReveals = function () {
    const T = TourProgress.data();
    this.revealQ = T.pending.slice();
    this.nextReveal();
  };
  P.nextReveal = function () {
    const r = this.revealQ && this.revealQ.shift();
    if (!r) { this.reveal = null; this.layoutPanel(); return; }
    const calm = TourKit.reduceMotion();
    const cc = r.cc || (r.kind === 'flight' ? r.to : r.kind === 'land' ? r.id : null);
    if (cc && Tour.countries[cc] && this.sel !== cc && (r.kind === 'path' || r.kind === 'stop' || r.kind === 'house')) { this.sel = cc; this.walker = null; }
    const dur = calm ? 0.3 : r.kind === 'path' ? 1.0 : r.kind === 'stop' || r.kind === 'house' ? 0.45 + 1.6 : 1.6;
    this.reveal = { r, k: 0, t: 0, dur, calm, sparks: [] };
    this.layoutPanel();
    const banner = { stop: 'SECRET LEVEL!', house: 'SOUVENIR STAND!', land: 'NEW LAND!', flight: 'SECRET FLIGHT!' }[r.kind];
    if (r.kind === 'path' && !(this.revealQ[0] && (this.revealQ[0].kind === 'stop' || this.revealQ[0].kind === 'house')) && this.stopAt[r.to] && !this.stopAt[r.to].S.secret && r.gold) this.reveal.banner = 'SHORTCUT!';
    if (banner) this.reveal.banner = banner;
    if (r.kind === 'stop' || r.kind === 'house') {
      const b = this.stamps.find(x => x.S.id === (r.kind === 'house' ? 'house:' + r.id : r.id)), C = Tour.countries[this.sel], cols = (C && C.colors) || { a: '#ff4f8a', b: '#38c8ff', c: '#ffd84a' };
      if (b && !calm) for (let q = 0; q < 12; q++) { const a = q / 12 * TAU; this.reveal.sparks.push({ x: b.cx, y: b.cy, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90 - 40, age: 0, c: [cols.a, cols.b, cols.c][q % 3] }); }
      TourKit.sfx('reveal', 'checkpoint');
    } else if (r.kind === 'path') TourKit.sfx('trail', 'select', { pitch: 1.3 });
    else if (r.kind === 'land' || r.kind === 'flight') { TourKit.sfx('newland', 'checkpoint'); const st = Tour.stops[r.kind === 'land' ? r.id : r.to]; if (st) this.cam && (this.cam.lon = lerp(this.cam.lon, st.lon, 0.5)); }
  };
  P.updateReveal = function (dt) {
    const R = this.reveal; if (!R) return;
    R.t += dt; R.k = R.calm ? R.t / R.dur : R.t;
    for (const sp of R.sparks) { sp.age += dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 220 * dt; }
    if (R.t >= R.dur) { TourProgress.revealDone(R.r); Save.save(); this.nextReveal(); }
  };

  P.update = function (dt) {
    // the reveal queue starts once any postcard is put away
    if (this.revealQ == null && !this.card && !this.flight) this.startReveals();
    if (this.reveal) { this.updateReveal(dt); if (Input.taps.length && this.reveal && this.reveal.t > 0.2) { /* a tap speeds it up */ this.reveal.t = Math.max(this.reveal.t, this.reveal.dur - 0.15); } Input.taps.length = 0; Input.uiKey = null; }
    // Brady walking
    const w = this.walker;
    if (w && w.path && w.path.length) {
      const b = this.stopAt[w.path[0]];
      if (!b) w.path = null;
      else {
        const dx = b.cx - w.x, dy = b.cy - w.y, d = Math.hypot(dx, dy), step = 160 * dt;
        if (Math.abs(dx) > 0.5) w.facing = dx > 0 ? 1 : -1;
        if (d <= step) { w.x = b.cx; w.y = b.cy; w.k = w.path.shift(); (w.dust = w.dust || []).push({ x: w.x, y: w.y, age: 0 }); if (!w.path.length) w.path = null; }
        else { w.x += dx / d * step; w.y += dy / d * step; }
        w.t += dt;
      }
    }
    if (w && w.dust) { for (const d of w.dust) d.age += dt; w.dust = w.dust.filter(d => d.age < 0.5); }
    this.updateWorldFx(dt);
    return oldUpdate.call(this, dt);
  };

  /* ---------- world map extras ---------- */
  const BOTTLE_FROM = { 1: 'ec', 2: 'br', 3: 'mz', 4: 'es', 5: 'id' }, LIGHTHOUSE = { lon: -30, lat: 5 };
  P.updateWorldFx = function (dt) {
    const T = TourProgress.data();
    // the plane's contrail (fades over 2 s)
    this.trail = (this.trail || []).filter(p => (p.age += dt) < 2);
    if (this.flight) this.trail.push({ lon: this.plane.lon, lat: this.plane.lat, age: 0 });
    // the Baron's airship: over the next uncleared country, flies on when it falls
    const next = Tour.mainCountries().find(C => TourProgress.countryUnlocked(C) && !TourProgress.bossDone(C));
    const st = next ? Tour.stops[next.id] : null;
    if (st) {
      if (!this.airship) this.airship = { lon: st.lon + 7, lat: st.lat + 9, to: null };
      const a = this.airship, tgt = { lon: st.lon + 7, lat: st.lat + 9 };
      if (Math.hypot(a.lon - tgt.lon, a.lat - tgt.lat) > 0.3) { a.k = (a.k || 0) + dt / 1.5; const e = easeInOut(clamp(a.k, 0, 1)); a.from = a.from || { lon: a.lon, lat: a.lat }; a.lon = lerp(a.from.lon, tgt.lon, e); a.lat = lerp(a.from.lat, tgt.lat, e); if (a.k >= 1) { a.from = null; a.k = 0; } }
    } else this.airship = null;
    // jars: a cleared country's jar shatters on the first visit after its boss (6 shards, the landmark grows)
    T.jars = T.jars || {};
    this.jarFx = this.jarFx || {};
    for (const C of Tour.mainCountries()) if (TourProgress.bossDone(C) && !T.jars[C.id] && !this.jarFx[C.id] && !this.flight) { this.jarFx[C.id] = { t: 0, shards: Array.from({ length: 6 }, (_, q) => ({ a: q / 6 * TAU + 0.3, v: 30 + q * 7 })) }; }
    for (const id in this.jarFx) { const f = this.jarFx[id]; f.t += dt; if (f.t > 1.2 && !T.jars[id]) { T.jars[id] = true; Save.save(); } }
    this.cloudT = (this.cloudT || 0) + dt;
  };
  P.drawWorldFx = function (ctx, layer) {
    const T = TourProgress.data(), t = this.t, z = this.cam.z;
    if (layer === 'under') {
      // secret-flight arcs: gold dotted, with a tiny plane
      for (const to in T.flights || {}) {
        const L = this.flightFrom(to); if (!L) continue;
        const a = Tour.stops[L], b = Tour.stops[to]; if (!a || !b) continue;
        this.arc(ctx, a, b, 'rgba(255,216,74,0.95)', t * 10);
        const mx = (this.sx(a.lon) + this.sx(b.lon)) / 2, my = (this.sy(a.lat) + this.sy(b.lat)) / 2 - Math.hypot(this.sx(b.lon) - this.sx(a.lon), this.sy(b.lat) - this.sy(a.lat)) * 0.125;
        ctx.save(); ctx.translate(mx, my); ctx.scale(0.5, 0.5); this.drawPlane(ctx, 0, 16, 0); ctx.restore();
      }
      // bottle currents: blue dashes toward the mid-Atlantic
      for (const n in T.bottles || {}) {
        if (!T.bottles[n]) continue; const s = Tour.stops[BOTTLE_FROM[n]]; if (!s) continue;
        ctx.save(); ctx.strokeStyle = 'rgba(140,220,255,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([3, 5]); ctx.lineDashOffset = -t * 8;
        const x0 = this.sx(s.lon), y0 = this.sy(s.lat), x1 = this.sx(LIGHTHOUSE.lon), y1 = this.sy(LIGHTHOUSE.lat);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + Math.sin(+n) * 30, (y0 + y1) / 2 + 20, x1, y1); ctx.stroke(); ctx.restore();
      }
      // the contrail
      if (this.trail && this.trail.length > 1) { ctx.save(); ctx.lineCap = 'round'; for (let q = 1; q < this.trail.length; q++) { const p0 = this.trail[q - 1], p1 = this.trail[q]; ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - p1.age / 2)})`; ctx.lineWidth = 2.5; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(this.sx(p0.lon), this.sy(p0.lat) - 16); ctx.lineTo(this.sx(p1.lon), this.sy(p1.lat) - 16); ctx.stroke(); } ctx.restore(); }
      // landmarks: shrunk in the Baron's jar until the boss falls
      for (const C of Tour.mainCountries()) {
        const s = Tour.stops[C.id], st = TourMap.stopState(s); if (st !== 'open' && st !== 'done') continue;
        const look = TourLandscape.look(C.id), x = this.sx(s.lon), y = this.sy(s.lat) - TourMap.pinR - 2;
        const freed = !!T.jars[C.id], fx = this.jarFx && this.jarFx[C.id], k = fx ? clamp(fx.t / 1.2, 0, 1) : freed ? 1 : 0;
        const size = 22 * (0.4 + 0.6 * easeInOut(k));
        TourLandscape.landmark(ctx, look[6], x + 16, y + 6, size, '#2f4752', look[5]);
        if (k < 1 && !fx) TourPanelFx.jar(ctx, x + 16, y + 6, 12);
        if (fx && fx.t < 1.2) { ctx.save(); ctx.strokeStyle = 'rgba(220,240,255,0.9)'; ctx.lineWidth = 1.5; for (const sh of fx.shards) { const d = sh.v * fx.t, sx = x + 16 + Math.cos(sh.a) * d, sy = y - 2 + Math.sin(sh.a) * d + 40 * fx.t * fx.t; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 4, sy - 3); ctx.lineTo(sx + 2, sy + 3); ctx.closePath(); ctx.stroke(); } ctx.fillStyle = '#fff8d0'; for (let q = 0; q < 5; q++) { ctx.beginPath(); TourKit.star(ctx, x + 16 + Math.sin(q * 2.1 + t * 3) * 14, y - 4 + Math.cos(q * 1.7 + t * 3) * 10, 4, 1.5, 3); ctx.fill(); } ctx.restore(); }
        if (freed || (fx && fx.t > 0.8)) TourPanelFx.postmark(ctx, x - 22, y + 30, C.colors ? C.colors.a : '#ff4f8a');
      }
      // the Postcard Lighthouse (all five bottles)
      if (Object.keys(T.bottles || {}).filter(n => T.bottles[n]).length >= 5) TourPanelFx.lighthouse(ctx, this.sx(LIGHTHOUSE.lon), this.sy(LIGHTHOUSE.lat), t, !!T.lighthouse);
    } else {
      // the airship over the next country
      if (this.airship) TourPanelFx.airship(ctx, this.sx(this.airship.lon), this.sy(this.airship.lat) + Math.sin(t * 1.4) * 3, t);
      // a new land: ice cracks across its pin
      const R = this.reveal; if (R && R.r.kind === 'land') { const s = Tour.stops[R.r.id]; if (s) TourPanelFx.crack(ctx, this.sx(s.lon), this.sy(s.lat), clamp(R.t / 1.0, 0, 1)); }
      // cloud shadows in two layers (parallax 0.3 and 0.6)
      ctx.save();
      for (const [par, a, n] of [[0.3, 0.1, 5], [0.6, 0.14, 4]]) {
        ctx.fillStyle = `rgba(10,30,70,${a})`;
        for (let q = 0; q < n; q++) {
          const wx = ((q * 97 + this.cloudT * 6 * par) % 360) - 180, wy = ((q * 53) % 110) - 45;
          const x = this.mapR.x + this.mapR.w / 2 + (wx - this.cam.lon * par) * z * 0.9, y = this.mapR.y + this.mapR.h / 2 - (wy - this.cam.lat * par) * z * 0.9;
          for (const [dx, dy, rr2] of [[0, 0, 26], [22, 4, 20], [-20, 6, 18], [8, -10, 18]]) { ctx.beginPath(); ctx.ellipse(x + dx * z / 5, y + dy * z / 5, rr2 * z / 5, rr2 * z / 8, 0, 0, TAU); ctx.fill(); }
        }
      }
      ctx.restore();
    }
  };
  // the country whose level has a flight exit to `to`
  P.flightFrom = function (to) {
    for (const cc in Tour.countries) { const C = Tour.countries[cc]; for (const L of C.levels) for (const k in L.exits || {}) { const tg = L.exits[k] && L.exits[k].to; if (tg === 'flight:' + to) return cc; } }
    return null;
  };
  // draw: the world-map extras go under the stops (arcs, landmarks) and over the map (airship, clouds)
  P.draw = function (ctx) {
    const sx = this.drawStop, me = this;
    let drewUnder = false;
    this.drawStop = function (c2, s) { if (!drewUnder) { drewUnder = true; me.drawWorldFx(c2, 'under'); } return sx.call(this, c2, s); };
    const dp = this.drawPlane; let planeDone = false;
    this.drawPlane = function (c2, x, y, a) { const r = dp.call(this, c2, x, y, a); if (!planeDone) { planeDone = true; me.drawWorldFx(c2, 'over'); } return r; };
    oldDrawMap.call(this, ctx);
    delete this.drawStop; delete this.drawPlane;
    // the banner of a reveal
    const R = this.reveal; if (R && R.banner && R.t > (R.r.kind === 'stop' || R.r.kind === 'house' ? 0.45 : 0)) TourPanelFx.banner(ctx, R.banner, this.panelR.x + this.panelR.w / 2, this.panelR.y + this.panelR.h * 0.42, clamp((R.t - (R.r.kind === 'stop' || R.r.kind === 'house' ? 0.45 : 0)) / 0.25, 0, 1), R.dur - R.t);
  };
  // the lighthouse is tapped on the map: the beam lights once
  const up2 = P.update;
  P.update = function (dt) {
    const T = TourProgress.data();
    if (!this.reveal && !this.card && Object.keys(T.bottles || {}).filter(n => T.bottles[n]).length >= 5) {
      for (const tp of Input.taps) { if (Math.hypot(tp.x - this.sx(LIGHTHOUSE.lon), tp.y - this.sy(LIGHTHOUSE.lat)) < 26) { if (!T.lighthouse) { T.lighthouse = true; Save.save(); this.toast('THE BEAM IS LIT: ? FLAGS MARK HIDDEN EXITS'); Sound.play('checkpoint'); } else this.toast('THE POSTCARD LIGHTHOUSE'); Input.taps.length = 0; break; } }
    }
    return up2.call(this, dt);
  };
})();

/* ---------- little drawings for the map ---------- */
const TourPanelFx = {
  backOut(k) { const s = 1.70158 * 1.6; return 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); },
  // a striped market awning in the country colour, with a coin under it
  house(ctx, x, y, r, col, t) {
    ctx.save(); ctx.strokeStyle = '#30474f'; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
    ctx.fillStyle = '#fff7df'; rr(ctx, x - r, y - r * 0.4, r * 2, r * 1.4, 3); ctx.fill(); ctx.stroke();
    for (let q = 0; q < 4; q++) { ctx.fillStyle = q % 2 ? '#fff7df' : col; ctx.beginPath(); ctx.moveTo(x - r - 2 + q * (r * 2 + 4) / 4, y - r * 0.9); ctx.lineTo(x - r - 2 + (q + 1) * (r * 2 + 4) / 4, y - r * 0.9); ctx.lineTo(x - r - 2 + (q + 1) * (r * 2 + 4) / 4, y - r * 0.35); ctx.arc(x - r - 2 + (q + 0.5) * (r * 2 + 4) / 4, y - r * 0.35, (r * 2 + 4) / 8, 0, Math.PI); ctx.closePath(); ctx.fill(); }
    ctx.beginPath(); ctx.rect(x - r - 2, y - r * 0.9, r * 2 + 4, r * 0.55); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x, y + r * 0.4, r * 0.38, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8901a'; ctx.fillRect(x - 0.8, y + r * 0.4 - r * 0.2, 1.6, r * 0.4);
    ctx.restore();
  },
  flag(ctx, x, y, t) { ctx.save(); ctx.strokeStyle = '#30474f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x, y - 8); ctx.stroke(); ctx.fillStyle = Math.sin(t * 6) > 0 ? '#ffd84a' : '#ff9a3a'; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x - 11, y - 4); ctx.lineTo(x, y); ctx.fill(); ctx.fillStyle = '#30474f'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('?', x - 4, y - 3.5); ctx.restore(); },
  jar(ctx, x, y, s) { ctx.save(); ctx.strokeStyle = 'rgba(220,240,255,0.95)'; ctx.fillStyle = 'rgba(200,230,255,0.22)'; ctx.lineWidth = 1.5; rr(ctx, x - s * 0.8, y - s * 1.6, s * 1.6, s * 1.6, s * 0.4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8a6a9a'; rr(ctx, x - s * 0.6, y - s * 1.85, s * 1.2, s * 0.3, 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s * 1.3); ctx.lineTo(x - s * 0.5, y - s * 0.5); ctx.stroke(); ctx.restore(); },
  postmark(ctx, x, y, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.2); ctx.strokeStyle = col; ctx.globalAlpha = 0.85; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, TAU); ctx.stroke(); for (let q = -1; q <= 1; q++) { ctx.beginPath(); ctx.moveTo(8, q * 3); ctx.quadraticCurveTo(12, q * 3 - 2, 16, q * 3); ctx.stroke(); } ctx.restore(); },
  airship(ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 26, 16, 3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a4a6a'; ctx.strokeStyle = '#2a2034'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, 20, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a7aa0'; ctx.beginPath(); ctx.ellipse(-3, -3, 13, 3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a4a6a'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-25, -7); ctx.lineTo(-25, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a2e48'; rr(ctx, -6, 8, 12, 5, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(-3, 9.5, 2, 2); ctx.fillRect(1, 9.5, 2, 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; const pr = Math.sin(t * 30) * 4; ctx.beginPath(); ctx.moveTo(-26, -pr); ctx.lineTo(-26, pr); ctx.stroke();
    ctx.fillStyle = '#e8d8ff'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('B', 2, 2);
    ctx.restore();
  },
  lighthouse(ctx, x, y, t, lit) {
    ctx.save(); ctx.translate(x, y);
    if (lit) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.rotate(t * 0.8); const g = ctx.createLinearGradient(0, 0, 70, 0); g.addColorStop(0, 'rgba(255,240,170,0.6)'); g.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(70, -36); ctx.lineTo(70, -8); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1.5;
    ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-4, -18); ctx.lineTo(4, -18); ctx.lineTo(6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5a5a'; ctx.fillRect(-5, -12, 10, 3); ctx.fillRect(-5.5, -6, 11, 3);
    ctx.fillStyle = lit ? '#ffe070' : '#8a8aa0'; ctx.fillRect(-3.5, -24, 7, 6); ctx.strokeRect(-3.5, -24, 7, 6);
    ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.moveTo(-5, -24); ctx.lineTo(0, -29); ctx.lineTo(5, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(10,10,30,0.7)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; rr(ctx, -30, 4, 60, 12, 5); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText('LIGHTHOUSE', 0, 13);
    ctx.restore();
  },
  crack(ctx, x, y, k) { ctx.save(); ctx.strokeStyle = 'rgba(230,250,255,0.95)'; ctx.lineWidth = 2; for (let q = 0; q < 5; q++) { const a = q / 5 * TAU + 0.4; ctx.beginPath(); ctx.moveTo(x, y); let px = x, py = y; for (let s = 1; s <= 4 * k; s++) { px += Math.cos(a + (s % 2 ? 0.4 : -0.4)) * 7; py += Math.sin(a + (s % 2 ? 0.4 : -0.4)) * 7; ctx.lineTo(px, py); } ctx.stroke(); } ctx.restore(); },
  banner(ctx, text, x, y, k, left) {
    ctx.save(); const a = Math.min(k, clamp(left / 0.25, 0, 1)); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(0.8 + 0.2 * k, 0.8 + 0.2 * k);
    ctx.font = `20px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(text).width + 50;
    ctx.fillStyle = '#ff4f8a'; ctx.beginPath(); ctx.moveTo(-w / 2 - 14, -4); ctx.lineTo(-w / 2, -18); ctx.lineTo(-w / 2, 18); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(w / 2 + 14, -4); ctx.lineTo(w / 2, -18); ctx.lineTo(w / 2, 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd84a'; rr(ctx, -w / 2, -18, w, 36, 6); ctx.fill(); ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#3a2410'; ctx.fillText(text, 0, 1); ctx.restore();
  }
};
// (exposed on window.BRADY_TOUR at the end of 28_tour_j_stamps.js: 28_tour_g_story.js creates that object later)
