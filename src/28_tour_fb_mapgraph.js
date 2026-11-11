/* ============================================================
   World tour: the map graph (LEVEL_OVERHAUL.md §3.6, §3.7).
   Which stops a land's overworld shows and which trails Brady may
   walk: levels and houses from mapFrom (the source of truth), the
   airstrip he lands on, the port that opens when the boss falls,
   Bottle Mail coves, trails the save remembers. A trail is open when
   the exit that leads along it was taken (or the save drew it); a
   secret trail stays hidden until then. Also: the house room, the
   level-type labels, the fort roofs, and the little drawings shared
   by the overworld and the world route map.
   ============================================================ */

TourLandscape.ARCH_LABEL = {
  parade: 'PARADE', rail: 'RAIL', dive: 'DIVE', tower: 'TOWER', freefall: 'FREEFALL', fall: 'FREEFALL', flip: 'FLIP', swing: 'SWING',
  race: 'RACE', factory: 'FACTORY', tide: 'TIDE', beat: 'BEAT', thief: 'THIEF', glide: 'GLIDE', doom: 'DOOM', sky: 'SKY', carry: 'CARRY',
  dig: 'DIG', maze: 'MAZE', scroll: 'SCROLL', phase: 'PHASE', fort: 'FORT', hold: 'HOLD', mini: 'MINI', switch: 'SWITCH', hub: 'HUB',
  ride: 'RIDE', rise: 'RISE', roll: 'ROLL', lamp: 'LAMP', sneak: 'SNEAK', lair: 'BOSS', castle: 'BOSS', arena: 'BOSS', boss: 'BOSS', house: 'SOUVENIRS'
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
// leaving a house: count the visit, never touch level progress. A cleared tour level goes back to the overworld
// (Brady walks on from there), so the results screen offers MAP rather than jumping straight into the next level.
{
  const rp = Play.prototype.recordProgress;
  Play.prototype.recordProgress = function () {
    if (!this.level.house) return rp.call(this);
    const T = TourProgress.data(); T.houses[this.level.house] = (T.houses[this.level.house] || 0) + 1; T.lastExit = { id: 'house:' + this.level.house, key: 'main' }; Save.save(); this.opened = null;
  };
  const nx = Play.prototype.nextLevelId;
  Play.prototype.nextLevelId = function () { return this.level.house || this.level.tour ? null : nx.call(this); };
}
// remember the exit Brady just took, so the overworld can walk him on to where it leads (consumed once)
{
  const ex = TourProgress.exit;
  TourProgress.exit = function (id, key) { const out = ex.call(this, id, key); this.data().lastExit = { id, key: key || 'main' }; return out; };
}

/* ---------- the stops of a country (levels, then houses), as the save sees them ---------- */
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

/* ---------- the overworld graph of one land ---------- */
// Bottle Mail: the level that holds each bottle (its cove sits next to that level's stop)
const TOUR_BOTTLE_LEVELS = { 1: '2-6', 2: '3-4', 3: '4-4', 4: '6-6', 5: '9-1' };
const TourGraph = {
  // the node key of stop index k: a level id ('1-3') or a house id ('house:mx-tienda')
  key(C, k) { const n = C.levels.length; return k < n ? C.world + '-' + (k + 1) : (C.houses[k - n] ? 'house:' + C.houses[k - n].id : null); },
  ow() { const T = TourProgress.data(); if (!T.ow || typeof T.ow !== 'object') T.ow = {}; T.ow.open = T.ow.open || {}; T.ow.init = T.ow.init || {}; return T.ow; },
  bottles(C) { const out = []; for (const n in TOUR_BOTTLE_LEVELS) { const id = TOUR_BOTTLE_LEVELS[n]; if (Tour.countryOf(id) === C && Tour.specOf(id)) out.push({ n: +n, id }); } return out; },
  /* nodes(C): [{ key, kind: 'level'|'house'|'start'|'port'|'bottle', k, id, L, H, n, secret, boss, fort, visible, enter, done }] */
  nodes(C) {
    const T = TourProgress.data(), out = [];
    out.push({ key: 'start', kind: 'start', visible: true, enter: true });
    for (const S of TourPanel.stops(C)) {
      if (S.kind === 'level') {
        const L = S.L, boss = S.k === C.mainCount - 1;
        out.push({ key: S.id, kind: 'level', k: S.k, id: S.id, L, secret: S.secret, boss, fort: !boss && L.kind === 'castle', visible: S.visible, enter: TourProgress.isUnlocked(S.id), done: !!Save.data.done[S.id] });
      } else out.push({ key: S.id, kind: 'house', k: S.k, id: S.id, H: S.H, L: S.H, secret: true, visible: S.visible, enter: S.visible });
    }
    out.push({ key: 'port', kind: 'port', visible: true, enter: TourProgress.bossDone(C) });
    for (const b of this.bottles(C)) out.push({ key: 'bottle:' + b.n, kind: 'bottle', n: b.n, id: b.id, visible: !!T.bottles[b.n], enter: !!T.bottles[b.n] });
    return out;
  },
  // has a taken exit of level aId got node key bKey as its target?
  exitTo(aId, bKey) {
    const L = Tour.specOf(aId), E = (Save.data.exits || {})[aId]; if (!L || !E) return false;
    for (const k in E) { if (!E[k] || !L.exits[k]) continue; const to = L.exits[k].to; if (to && (to === bKey || to === 'node:' + bKey)) return true; }
    return false;
  },
  pendingPath(C, ka, kb) { return TourProgress.data().pending.some(r => r.kind === 'path' && r.cc === C.id && ((r.from === ka && r.to === kb) || (r.from === kb && r.to === ka))); },
  /* edges(C, nodes): [{ key 'a>b', a, b, kind: 'start'|'trail'|'port'|'bottle', gold, open, visible, pending, fresh }]
     open: Brady may walk it; visible: drawn (a closed main trail shows blocked, a closed secret trail not at all);
     pending: a reveal will draw it; fresh: open but its roadblock has not been cleared on screen yet. */
  edges(C, nodes) {
    const T = TourProgress.data(), OW = this.ow(), by = {}, out = [], seen = {};
    for (const n of nodes) by[n.key] = n;
    const stops = Tour.panelStops(C), sec = k => !!(stops[k] && (stops[k].secret === true || stops[k].house));
    const add = (a, b, kind, gold, ka, kb) => { if (!a || !b || !by[a] || !by[b] || a === b) return; const key = a + '>' + b; if (seen[key] || seen[b + '>' + a]) return; seen[key] = 1; out.push({ key, a, b, kind, gold, ka, kb }); };
    if (C.levels.length) add('start', this.key(C, 0), 'start', false);
    stops.forEach((S, k) => { for (const f of TourPanel.froms(S, k)) if (f < stops.length) add(this.key(C, f), this.key(C, k), 'trail', sec(f) || sec(k), f, k); });
    if (C.mainCount) add(this.key(C, C.mainCount - 1), 'port', 'port', false);
    for (const b of this.bottles(C)) add(b.id, 'bottle:' + b.n, 'bottle', false);
    // trails the save drew (or a reveal is about to draw) that the graph does not list
    const extra = (a, b) => add(this.key(C, a), this.key(C, b), 'trail', true, a, b);
    for (const pk in T.paths) if (T.paths[pk] && pk.indexOf(C.id + ':') === 0) { const [a, b] = pk.slice(C.id.length + 1).split('>').map(Number); extra(a, b); }
    for (const r of T.pending) if (r.kind === 'path' && r.cc === C.id) extra(r.from, r.to);
    for (const e of out) {
      const A = by[e.a], B = by[e.b];
      if (e.kind === 'start') e.open = true;
      else if (e.kind === 'port') e.open = TourProgress.bossDone(C);
      else if (e.kind === 'bottle') e.open = B.visible;
      else {
        const flag = e.ka != null && (T.paths[C.id + ':' + e.ka + '>' + e.kb] || T.paths[C.id + ':' + e.kb + '>' + e.ka]);
        const taken = (A.kind === 'level' && this.exitTo(A.id, B.key)) || (B.kind === 'level' && this.exitTo(B.id, A.key));
        const walked = !e.gold && A.kind === 'level' && A.done && B.kind === 'level' && TourProgress.isUnlocked(B.id);
        e.open = !!(flag || taken || walked);
      }
      e.pending = e.ka != null && this.pendingPath(C, e.ka, e.kb);
      e.visible = A.visible && B.visible && !e.pending && (e.open || !e.gold);
      e.fresh = e.open && e.visible && !e.gold && !OW.open[C.id + ':' + e.key];
    }
    // the first time a land is drawn this way, what is already open needs no roadblock animation
    if (!OW.init[C.id]) { OW.init[C.id] = true; for (const e of out) if (e.fresh) { OW.open[C.id + ':' + e.key] = true; e.fresh = false; } }
    return out;
  },
  // a roadblock has been cleared on screen
  cleared(C, e) { this.ow().open[C.id + ':' + e.key] = true; e.fresh = false; },
  // shortest walk over open, visible, cleared trails: [keys after `from` ... to] or null
  route(edges, from, to) {
    if (from === to) return [];
    const adj = {};
    for (const e of edges) if (e.open && e.visible && !e.fresh) { (adj[e.a] = adj[e.a] || []).push(e.b); (adj[e.b] = adj[e.b] || []).push(e.a); }
    const prev = { [from]: null }, q = [from];
    while (q.length) { const u = q.shift(); if (u === to) break; for (const v of adj[u] || []) if (!(v in prev)) { prev[v] = u; q.push(v); } }
    if (!(to in prev)) return null;
    const out = []; for (let v = to; v !== from; v = prev[v]) out.unshift(v);
    return out;
  }
};

/* ---------- little drawings for the maps ---------- */
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
  // a secret land's ghost pin: a flickering outline at 30 % alpha with a question
  ghostPin(ctx, x, y, t, label) {
    const a = 0.3 * (0.75 + 0.25 * Math.sin(t * 7) * Math.sin(t * 2.3)) + (Math.sin(t * 13) > 0.97 ? 0.15 : 0), r = TourMap.pinR;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#b8a8ff'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.setLineDash([3, 3]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffffff'; ctx.font = `${Math.round(r * 0.85)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y + 1);
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
