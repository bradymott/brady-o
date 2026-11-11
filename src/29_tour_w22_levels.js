/* ============================================================
   WORLD 22 (secret land): the five levels in the v2 format
   (LEVEL_OVERHAUL.md §2 "World 22", §3.2 graph, §4.3).
   22-1 The Station of Clocks  PHASE  strike the station clock: 2:22 becomes 22:22 and the platforms swap; your echo
   22-2 The Endless Corridor   MAZE   a folded corridor of numbered doors; some loop; count them: the 22nd is different
   22-3 Mirror Lake            FLIP   played right to left; fall through the lake and walk your reflection upside down
   22-4 The 22nd Door          LAIR   your echo down the hall, a room behind a mirror, then the Other Brady
   22-5 The Writer's Desk      MINI   (secret) tiny Brady on a writer's desk: typewriter keys, ink, paperclips, a cup
   Loads after 29_tour_w22.js (the look, the old pieces, the Other
   Brady) and replaces its level list with Tour.amend. The way in is
   unchanged: door 22 in 5-2, which wants 22 postcards. Anything that
   shows Brady (the echo, the reflection, the Other Brady) stays code-drawn.
   ============================================================ */
(() => {
const C = Tour.countries.w22;
if (!C) return;
const K = TourKit;
const WX = 'w22_x';
const DREAM = ['#c8b8ff', '#ffc8d8', '#a8f0e8', '#ffe8b0', '#b8d8ff'];

function room(W, H, floor, marks, opts) {
  opts = opts || {};
  const wall = opts.wall || 'H', rows = [];
  for (let y = 0; y < H; y++) {
    let r;
    if (y >= floor) r = '#'.repeat(W);
    else if (y === 0 && !opts.open) r = '#'.repeat(W);
    else r = wall + '.'.repeat(W - 2) + wall;
    rows.push(r.split(''));
  }
  for (const [x, y, txt] of marks) for (let k = 0; k < txt.length; k++) if (txt[k] !== ' ' && x + k < W && y < H) rows[y][x + k] = txt[k];
  return rows.map(r => r.join(''));
}
// every World 22 level may draw from the overhaul atlas (typewriter keys, paperclips, the ink pot)
{
  const ex = Play.prototype.extraAtlases;
  Play.prototype.extraAtlases = function () { const n = ex.call(this); if (this.level && this.level.country === 'w22' && n.indexOf(WX) < 0) n.push(WX); return n; };
}
const xDraw = (ctx, id, x, y, k, dir) => typeof Atlas !== 'undefined' && Atlas.draw(ctx, WX, id, x, y, dir || 1, { scale: k || 1 });
// the clock face every World 22 clock wears (the minute hand on 22)
function clockFace(ctx, x, y, r, col, h, m) {
  ctx.fillStyle = col || '#f8f0e0'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(60,40,90,0.7)'; ctx.lineWidth = Math.max(1, r * 0.07); ctx.stroke();
  ctx.fillStyle = 'rgba(60,40,90,0.7)'; for (let k = 0; k < 12; k++) { const a = k * TAU / 12; ctx.fillRect(x + Math.cos(a) * r * 0.82 - 1, y + Math.sin(a) * r * 0.82 - 1, 2, 2); }
  const hh = h == null ? 22 : h, mm = m == null ? 22 : m, hA = ((hh % 12) + mm / 60) / 12 * TAU - Math.PI / 2, mA = mm / 60 * TAU - Math.PI / 2;
  ctx.strokeStyle = '#3a2a5a'; ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, r * 0.1); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(hA) * r * 0.5, y + Math.sin(hA) * r * 0.5); ctx.stroke();
  ctx.lineWidth = Math.max(1, r * 0.06); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(mA) * r * 0.75, y + Math.sin(mA) * r * 0.75); ctx.stroke();
  ctx.lineCap = 'butt';
}
const late = g => !!(g && g.area && g.area.night);   // 22:22 (the phase's night) or 2:22

/* ================= themes ================= */
const strip = (atlas, id, f, shift, fallback) => ({ kind: 'image', atlas, id, f, base: fallback.base, color: fallback.color, fallback, shift: shift || 0, dyn: fallback.dyn });
const painters = {
  // the inside of the great station clock: brass gears turning behind the face
  w22Gears(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let k = 0; k < 9; k++) {
      const x = 60 + k * 120 + rng() * 40, y = 80 + rng() * (L.base - 120), r = 30 + rng() * 40, n = 10 + Math.floor(r / 6);
      ctx.fillStyle = k % 2 ? '#8a6a3a' : '#a8844a'; ctx.beginPath();
      for (let q = 0; q < n * 2; q++) { const a = q / (n * 2) * TAU, rr2 = q % 2 ? r : r * 0.85; ctx.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
      ctx.closePath(); ctx.fill(); ctx.fillStyle = L.color; ctx.beginPath(); ctx.arc(x, y, r * 0.35, 0, TAU); ctx.fill();
    }
  },
  // under the lake: the reflection world, upside-down lamps and doors hanging from the surface
  w22Under(ctx, L, rng, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1a4a'); g.addColorStop(1, '#6a4a9a'); ctx.fillStyle = g; ctx.fillRect(0, 0, BG_W, H);
    for (let k = 0; k < 6; k++) { const x = 70 + k * 170, h = 40 + rng() * 40; ctx.fillStyle = 'rgba(200,180,255,0.35)'; rr(ctx, x - 12, 0, 24, h, 10); ctx.fill(); ctx.fillStyle = 'rgba(255,216,160,0.5)'; ctx.beginPath(); ctx.arc(x, h + 8, 6, 0, TAU); ctx.fill(); }
  },
  // the writer's drawer: pencils, an eraser, loose notes
  w22Drawer(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 0; x < BG_W; x += 90) ctx.fillRect(x, 0, 3, H);
    for (let k = 0; k < 7; k++) { const x = rng() * BG_W, y = L.base - 30 - rng() * 120; ctx.save(); ctx.translate(x, y); ctx.rotate(-0.3 + rng() * 0.6); ctx.fillStyle = '#fff8ec'; ctx.fillRect(-40, -26, 80, 52); ctx.strokeStyle = 'rgba(90,110,200,0.4)'; ctx.lineWidth = 1; for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.moveTo(-34, -16 + q * 9); ctx.lineTo(34, -16 + q * 9); ctx.stroke(); } ctx.restore(); }
  }
};
Object.assign(BGPaint, painters);
const T_ = {};
const dusk = THEMES.w22_dusk;
// 22-1 at 22:22: the station's own strips under a deep night sky, every lamp lit
T_.w22_2222 = Object.assign({}, dusk, {
  name: 'The Station at 22:22', music: 'tour_w22_hall', rays: null,
  sky: ['#0a0618', '#2a1a4a', '#5a3a7a'], horizonGlow: '#c8a0ff', celestial: { type: 'moon', x: 0.72, y: 0.2, r: 30, color: '#fff4f0', glow: '#c8a0ff' }, stars: 1,
  layers: [strip('w22_dusk', 'L0', 0.04, 0, dusk.layers[0]), strip('w22_dusk', 'L1', 0.12, 0, dusk.layers[1])],
  fog: '#a080ff', darkness: 0.25
});
T_.w22_2222.atlas = 'w22_dusk';
if (typeof Atlas !== 'undefined') Atlas.applyTiles(T_.w22_2222, 'w22_dusk', { ground: 'ground' });
// 22-5: the writer's desk (its own atlas: two strips and the desk-top floor)
T_.w22_desk = Object.assign({}, THEMES.w22_corridor, {
  name: 'The Writer\'s Desk', music: 'tour_w22', particles: 'motes', rays: '#fff0d0', darkness: 0,
  sky: ['#3a2418', '#6a4a30', '#c89a6a'], horizonGlow: '#ffe0b0', celestial: { type: 'none' }, stars: 0,
  layers: [{ kind: 'w22Hall', color: '#6a4a3a', base: 300, f: 0.05 }, { kind: 'w22Drawer', color: '#8a6a4a', base: 380, f: 0.15 }],
  fog: '#ffe0b0', ground: { style: 'wood', cap: '#a87a4a', capHi: '#d8a86a', dirt: '#6a4a2e', dirt2: '#4a3220', rock: '#8a6a4a' }, decor: []
});
// interiors
T_.w22_clockroom = Object.assign({}, THEMES.w22_corridor, { name: 'Inside the Clock', music: 'secret', layers: [{ kind: 'w22Gears', color: '#3a2418', base: 380, f: 0.2 }], darkness: 0.1, decor: [] });
T_.w22_under = Object.assign({}, THEMES.w22_lake, { name: 'Under the Lake', music: 'secret', layers: [{ kind: 'w22Under', color: '#3a2a6a', base: 380, f: 0.15 }], celestial: { type: 'none' }, decor: [] });
T_.w22_behind = Object.assign({}, THEMES.w22_white, { name: 'Behind the Mirror', music: 'secret', sky: ['#c8b8f0', '#e8e0ff', '#f4f0ff'] });
T_.w22_drawer = Object.assign({}, T_.w22_desk, { name: 'The Drawer', music: 'secret', layers: [{ kind: 'w22Drawer', color: '#5a3a2a', base: 380, f: 0.1 }], sky: ['#2a1a10', '#4a3020', '#6a4a30'] });
Object.assign(THEMES, T_);

/* ================= skins and decor ================= */
// a numbered corridor door (painted on the wall: it never opens)
const paintedDoor = (ctx, x, y, n, t) => {
  ctx.fillStyle = DREAM[n % 5]; rr(ctx, x - 13, y - 52, 26, 52, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(60,40,90,0.5)'; ctx.lineWidth = 1.5; rr(ctx, x - 13, y - 52, 26, 52, 10); ctx.stroke();
  ctx.fillStyle = '#f4ecd8'; rr(ctx, x - 9, y - 40, 18, 11, 2); ctx.fill();
  ctx.fillStyle = '#4a3a6a'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(String(n), x, y - 31);
  ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.arc(x + 7, y - 22, 2, 0, TAU); ctx.fill();
};
const skins = {
  // the station clock you strike: 2:22 by day, 22:22 at night
  w22StationClock(ctx, e, t) {
    const x = e.cx, y = e.y + e.h, on = e.g && e.g.toggleBit(e.gi);
    ctx.fillStyle = '#4a3a6a'; ctx.fillRect(x - 3, y - 40, 6, 40); ctx.fillRect(x - 10, y - 4, 20, 4);
    ctx.save(); ctx.translate(x, y - 50); ctx.scale(Math.max(0.15, Math.abs(Math.cos(e.spinA || 0))), 1);
    clockFace(ctx, 0, 0, 15, on ? '#d8c8ff' : '#fff8ec', on ? 22 : 2, 22);
    ctx.strokeStyle = '#c8a03a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 16, 0, TAU); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = on ? '#c8a0ff' : '#ffd8a0'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(on ? '22:22' : '2:22', x, y - 70);
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x - 4, y - 80 - Math.abs(Math.sin(t * 4)) * 3); ctx.lineTo(x + 4, y - 80 - Math.abs(Math.sin(t * 4)) * 3); ctx.lineTo(x, y - 76 - Math.abs(Math.sin(t * 4)) * 3); ctx.fill();
  },
  // a plain corridor door (it opens), and door 22 (golden, ajar, light leaking out)
  w22DoorPlain(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#7a5ab8'; rr(ctx, x - 14, y - 52, 28, 52, 11); ctx.fill(); ctx.strokeStyle = '#4a3a6a'; ctx.lineWidth = 2; rr(ctx, x - 14, y - 52, 28, 52, 11); ctx.stroke(); ctx.fillStyle = '#f4ecd8'; rr(ctx, x - 9, y - 40, 18, 11, 2); ctx.fill(); ctx.fillStyle = '#4a3a6a'; ctx.font = `bold 8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('?', x, y - 31); ctx.fillStyle = '#ffd8a0'; ctx.beginPath(); ctx.arc(x + 8, y - 22, 2.2, 0, TAU); ctx.fill(); },
  w22Door22(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y - 26, 4, x, y - 26, 50); g.addColorStop(0, `rgba(255,216,140,${0.5 + 0.2 * Math.sin(t * 3)})`); g.addColorStop(1, 'rgba(255,216,140,0)'); ctx.fillStyle = g; ctx.fillRect(x - 50, y - 76, 100, 76); ctx.restore();
    ctx.fillStyle = '#fff0c0'; rr(ctx, x - 14, y - 52, 28, 52, 11); ctx.fill();
    ctx.fillStyle = '#e8b84a'; ctx.beginPath(); ctx.moveTo(x - 14, y - 41); ctx.quadraticCurveTo(x - 14, y - 52, x - 3, y - 52); ctx.lineTo(x + 2, y - 50); ctx.lineTo(x + 2, y); ctx.lineTo(x - 14, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8a5a14'; ctx.lineWidth = 2; rr(ctx, x - 14, y - 52, 28, 52, 11); ctx.stroke();
    ctx.fillStyle = '#4a3a6a'; ctx.font = `bold 10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('22', x - 5, y - 30);
  },
  // the big clock in the station: its door at the base
  w22ClockDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#3a2418'; rr(ctx, x - 13, y - 46, 26, 46, 12); ctx.fill(); ctx.fillStyle = '#c8a03a'; ctx.fillRect(x - 1, y - 44, 2, 42); ctx.fillStyle = '#ffd8a0'; ctx.beginPath(); ctx.arc(x + 6, y - 20, 2, 0, TAU); ctx.fill(); },
  // a mirror on the wall in the hall (22-4): walk into it
  w22MirrorPane(ctx, e, t) {
    const x0 = e.x, y0 = e.y, w = e.w, h = e.h, a = 1 - (e.part || 0) * 0.5;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#c8a03a'; rr(ctx, x0 - 4, y0 - 6, w + 8, h + 6, 10); ctx.fill();
    const g = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h); g.addColorStop(0, '#e8f0ff'); g.addColorStop(0.5, '#b8c8f0'); g.addColorStop(1, '#e0d0ff'); ctx.fillStyle = g; rr(ctx, x0, y0, w, h - 2, 8); ctx.fill();
    const p = e.g && e.g.player; if (p && Math.abs(p.cx - e.cx) < 120) { ctx.save(); ctx.beginPath(); rr(ctx, x0, y0, w, h - 2, 8); ctx.clip(); ctx.globalAlpha = 0.45; ctx.translate(2 * e.cx, 0); ctx.scale(-1, 1); try { p.draw(ctx); } catch (er) { } ctx.restore(); }
    ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.2 * Math.sin(t * 2)})`; ctx.beginPath(); ctx.moveTo(x0 + 6, y0 + 10); ctx.lineTo(x0 + 14, y0 + 6); ctx.lineTo(x0 + 8, y0 + h * 0.6); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  // the drawer of the desk, pulled half open
  w22DrawerDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#6a4a2e'; ctx.fillRect(x - 26, y - 40, 52, 40); ctx.fillStyle = '#2a1a10'; ctx.fillRect(x - 22, y - 36, 44, 18); ctx.fillStyle = '#c8a03a'; ctx.fillRect(x - 6, y - 12, 12, 4); ctx.fillStyle = '#fff8ec'; ctx.save(); ctx.translate(x - 6, y - 30); ctx.rotate(-0.2); ctx.fillRect(-8, -6, 18, 12); ctx.restore(); },
  w22None() {}
};
Object.assign(Decor, {
  // a painted numbered door on the corridor wall (d.n)
  w22NumDoor(ctx, x, y, t, th, d) { paintedDoor(ctx, x, y, d.n || 1, t); },
  // the great clock tower over the station (its face shows the time of the phase)
  w22Tower(ctx, x, y, t, th, d) {
    const h = d.h || 200, w = d.w || 96;
    ctx.fillStyle = '#5a3a6a'; rr(ctx, x - w / 2, y - h, w, h, 10); ctx.fill();
    ctx.fillStyle = '#4a2a5a'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 8, y - h + 4); ctx.lineTo(x, y - h - 40); ctx.lineTo(x + w / 2 + 8, y - h + 4); ctx.fill();
    clockFace(ctx, x, y - h + 46, 34, '#fff8ec', 2, 22);
    ctx.strokeStyle = '#c8a03a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y - h + 46, 36, 0, TAU); ctx.stroke();
  },
  // an ink pot on the desk (atlas, drawn giant: Brady is tiny here); its body is solid
  w22InkPot(ctx, x, y, t, th, d) {
    if (xDraw(ctx, 'inkpot_idle_000', x, y + 2, 3.4)) return;   // the pot's belly fills the body; the quill stands up out of it
    const w = d.w || 64, h = d.h || 96; ctx.fillStyle = '#1a1a3a'; rr(ctx, x - w / 2, y - h * 0.8, w, h * 0.8, 12); ctx.fill(); ctx.fillStyle = '#2a2a5a'; ctx.fillRect(x - w * 0.25, y - h, w * 0.5, h * 0.22); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x - w / 2 + 6, y - h * 0.7, 5, h * 0.5);
  },
  // a giant pencil lying on the desk (its body is solid: a bridge)
  w22Pencil(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2, y0 = y - h;
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(x0 + 18, y0, w - 36, h); ctx.fillStyle = '#e8b42a'; ctx.fillRect(x0 + 18, y0 + h * 0.66, w - 36, h * 0.34);
    ctx.fillStyle = '#ff8aa8'; rr(ctx, x0 + w - 22, y0, 22, h, 6); ctx.fill(); ctx.fillStyle = '#b8b8c8'; ctx.fillRect(x0 + w - 30, y0, 10, h);
    ctx.fillStyle = '#e8c890'; ctx.beginPath(); ctx.moveTo(x0 + 18, y0); ctx.lineTo(x0, y0 + h / 2); ctx.lineTo(x0 + 18, y0 + h); ctx.fill(); ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.moveTo(x0 + 6, y0 + h * 0.33); ctx.lineTo(x0, y0 + h / 2); ctx.lineTo(x0 + 6, y0 + h * 0.66); ctx.fill();
    ctx.fillStyle = '#3a2a1a'; ctx.font = `bold 8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('HB  22', x0 + w / 2, y0 + h * 0.55);
  },
  // a stack of books (its body is solid)
  w22Books(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, cols = ['#c8423a', '#3a6ad8', '#e8b84a', '#5aa86a', '#8a5ab8'];
    for (let k = 0, yy = y; yy > y - h + 2; k++) { const bh = 12 + (k % 3) * 3, bw = w + 6 - (k % 2) * 8; ctx.fillStyle = cols[k % 5]; rr(ctx, x - bw / 2 + (k % 2 ? 3 : -2), yy - bh, bw, bh, 2); ctx.fill(); ctx.fillStyle = 'rgba(255,248,236,0.85)'; ctx.fillRect(x - bw / 2 + (k % 2 ? 6 : 1), yy - bh + 3, bw - 8, 2); yy -= bh; }
  },
  // the coffee cup at the end of the desk (its rim is the ledge)
  w22Cup(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2, y0 = y - h;
    ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + w, y0); ctx.lineTo(x0 + w - 14, y); ctx.lineTo(x0 + 14, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f4f0e8'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(x0 + w + 4, y0 + h * 0.45, h * 0.22, -1.2, 1.2); ctx.stroke();
    ctx.fillStyle = '#c86a8a'; ctx.fillRect(x0 + 10, y0 + h * 0.35, w - 20, 10);
    ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.ellipse(x, y0 + 6, w / 2 - 6, 6, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 3; k++) { const ph = (t * 0.4 + k / 3) % 1; ctx.strokeStyle = `rgba(255,255,255,${0.4 * (1 - ph)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 20 + k * 20, y0 - 4 - ph * 50); ctx.quadraticCurveTo(x - 10 + k * 20, y0 - 20 - ph * 50, x - 20 + k * 20, y0 - 36 - ph * 50); ctx.stroke(); }
  },
  // a sheet of manuscript paper as a platform (it crumples under Brady: the tile is a crumble)
  w22Pages(ctx, x, y, t, th, d) { const w = d.w, x0 = x - w / 2; for (let k = 0; k < w / TS; k++) { ctx.fillStyle = k % 2 ? '#fff8ec' : '#f4ecd8'; ctx.fillRect(x0 + k * TS + 1, y - TS, TS - 2, 8); ctx.strokeStyle = 'rgba(90,110,200,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + k * TS + 4, y - TS + 4); ctx.lineTo(x0 + k * TS + TS - 4, y - TS + 4); ctx.stroke(); } },
  // the hanging clock gears (22-2's clock hall), a slow pendulum
  w22Pendulum(ctx, x, y, t) { const a = Math.sin(t * 1.6) * 0.5; ctx.strokeStyle = '#c8a03a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 300); ctx.lineTo(x + Math.sin(a) * 120, y - 300 + Math.cos(a) * 120); ctx.stroke(); ctx.fillStyle = '#e8b84a'; ctx.beginPath(); ctx.arc(x + Math.sin(a) * 120, y - 300 + Math.cos(a) * 120, 12, 0, TAU); ctx.fill(); }
});
// paperclip springs (atlas, procedural fallback)
PlatformArt.w22ClipSpring = (ctx, x, y, comp, t) => {
  if (xDraw(ctx, comp > 0.3 ? 'clip_boing_000' : 'clip_idle_000', x, y, 1.1)) return;
  ctx.strokeStyle = '#a8b0c0'; ctx.lineWidth = 3; ctx.lineCap = 'round'; const h = 26 - comp * 10;
  ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 6, y - h); ctx.arc(x, y - h, 6, Math.PI, 0); ctx.lineTo(x + 6, y - 6); ctx.arc(x + 2, y - 6, 4, 0, Math.PI); ctx.lineTo(x - 2, y - h + 4); ctx.stroke(); ctx.lineCap = 'butt';
};

/* ================= the cast ================= */
// w22Hourglass: a walking hourglass that turns itself over and slows time near it (timeSlow); the atlas has no
// 'flip' or 'field' pose, so those show its curl and roll frames (it tips over and spins)
const H0 = ENTITY_TYPES.w22Hourglass, hourArt = H0 && H0.cfg ? H0.cfg.art : null;
const HOUR_MODE = { idle: 'walk', flip: 'curl', field: 'roll' };
const hourglass = TourEnemy.make({
  w: 20, h: 26, speed: 0, behavior: 'timeSlow', every: 4.5, r: 4, art: hourArt, burst: '#ffd8a0',
  think(e, dt) { e.bt = (e.bt || 0) + dt; e.noWalk = false; e.vx = 0; TourBehave.timeSlow.think(e, dt); e.mode = HOUR_MODE[e.bst || 'idle'] || 'walk'; }
});
// w22Envelope: loose airmail fluttering about; it does not hurt: it sticks to Brady and its weight lowers his jumps
// for 3 s. A stomp (or any hit) posts it.
const E0 = ENTITY_TYPES.w22Envelope, envArt = E0 && E0.cfg ? E0.cfg.art : null;
const envelope = TourFlyer.make({
  w: 24, h: 18, speed: 0.8, range: 3, art: (ctx, e, x, y, m, t) => envArt && envArt(ctx, e, x, y + 12, m === 'flutter' ? 'walk' : m, t), burst: '#fff8ec', sprite: 'envelope',
  think(e, dt) { if (e.cool > 0) e.cool -= dt; e.mode = 'flutter'; e.x = e.hx + Math.sin(e.t * 0.8 + e.ph) * e.range; e.y = e.hy + Math.sin(e.t * 2.6 + e.ph) * 10 + Math.sin(e.t * 0.5) * 6; e.dir = Math.cos(e.t * 0.8 + e.ph) > 0 ? 1 : -1; }
});
class W22Envelope extends envelope {
  touchPlayer(p) {
    if (this.dead || this.knocked || p.dead) return;
    if (p.vy > 0 && p.prevBottom <= this.y + 8) { this.hit('stomp', p); p.vy = -PHYS.stompV; p.jumping = true; return; }
    if (!(p.mailT > 0)) { p.mailT = 3; this.g.parts.text(p.cx, p.y - 14, 'STUCK ON!', '#fff8ec'); K.sfx('stick', 'select', { vol: 0.4, pitch: 0.8 }); }
    this.remove = true; this.g.burst(this.cx, this.cy, 8, '#fff8ec', 'confetti');
  }
}
// the weight of a stuck envelope: lower jumps for 3 s, an envelope drawn on Brady's back
{
  const pu = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const wasGround = this.onGround, r = pu.call(this, dt, inp);
    if (this.mailT > 0) { this.mailT -= dt; if (wasGround && !this.onGround && this.vy < -4 * TS) this.vy *= 0.894; }
    return r;
  };
  const ov = TourPlayerFx.over;
  TourPlayerFx.over = function (ctx, p, t) { ov.call(this, ctx, p, t); if (p.mailT > 0 && !p.dead) { ctx.save(); ctx.translate(p.cx - p.facing * 6, p.y + 14); ctx.rotate(-0.3 * p.facing + Math.sin(t * 9) * 0.05); ctx.globalAlpha = Math.min(1, p.mailT); ctx.fillStyle = '#fff8ec'; ctx.fillRect(-9, -6, 18, 12); ctx.strokeStyle = '#c86a8a'; ctx.lineWidth = 1.5; ctx.strokeRect(-9, -6, 18, 12); ctx.beginPath(); ctx.moveTo(-9, -6); ctx.lineTo(0, 1); ctx.lineTo(9, -6); ctx.stroke(); ctx.restore(); } };
}
Object.assign(ENTITY_TYPES, { w22Hourglass: hourglass, w22Envelope: W22Envelope });
Tour.enemyInfo.w22Envelope = { place: 'fly', country: 'w22' };
Tour.enemyInfo.w22Hourglass = { place: 'walk', country: 'w22' };

/* ================= objects ================= */
// 22-1: the slabs that exist only at 2:22 (brass clock hands) or only at 22:22 (lilac numerals, glowing)
class W22Slab extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.gi = s.g || 0; this.night = !!s.night; this.rect = s.rect; this.x = s.rect[0] * TS; this.y = s.rect[1] * TS; this.w = (s.rect[2] - s.rect[0] + 1) * TS; this.h = TS; this.back = true; this.k = 0; }
  get solid() { return this.g.toggleBit(this.gi) === this.night; }
  update(dt) { this.t += dt; this.k = approach(this.k, this.solid ? 1 : 0, dt * 5); }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, n = this.night;
    if (this.k < 0.05) { ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = n ? '#c8a0ff' : '#ffd8a0'; ctx.setLineDash([4, 5]); ctx.strokeRect(x + 2, y + 1, w - 4, 9); ctx.setLineDash([]); ctx.fillStyle = n ? '#c8a0ff' : '#ffd8a0'; ctx.font = `bold 8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(n ? '22:22' : '2:22', x + w / 2, y + 9); ctx.restore(); return; }
    ctx.save(); ctx.globalAlpha = this.k;
    if (n) { ctx.fillStyle = '#3a2a6a'; rr(ctx, x + 1, y, w - 2, 11, 5); ctx.fill(); ctx.fillStyle = `rgba(200,160,255,${0.7 + 0.3 * Math.sin(this.t * 3)})`; for (let xx = x + 10; xx < x + w - 6; xx += 22) { ctx.font = `bold 8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('22', xx + 2, y + 9); } }
    else { const g = ctx.createLinearGradient(0, y, 0, y + 10); g.addColorStop(0, '#fff0b0'); g.addColorStop(1, '#c8902a'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + 2, y + 5); ctx.lineTo(x + 10, y); ctx.lineTo(x + w - 10, y); ctx.lineTo(x + w - 1, y + 5); ctx.lineTo(x + w - 10, y + 10); ctx.lineTo(x + 10, y + 10); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#8a5a14'; ctx.beginPath(); ctx.arc(x + 8, y + 5, 3, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  get light() { return this.night && this.k > 0.5 ? { r: 60, c: 'rgba(200,160,255,' } : null; }
}
// 22-3: the lake under the glass walkway: lilac water, and in it your reflection, upside down
class W22Lake extends Ent {
  constructor(g, s) { super(g, s, (s.w || 10) * TS, 8 * TS); this.lineY = s.line * TS + TS; this.x = s.x - this.w / 2; this.y = this.lineY; this.h = g.area ? g.area.H * TS - this.lineY : 8 * TS; this.back = true; this.friendly = true; }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const x0 = this.x, y0 = this.lineY, w = this.w, h = this.h, t = this.t;
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, 'rgba(160,140,240,0.55)'); g.addColorStop(1, 'rgba(60,40,120,0.85)');
    ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < w / 40; k++) { const xx = x0 + ((k * 40 + t * 12) % w); ctx.fillRect(xx, y0 + 6 + (k % 3) * 22, 18, 2); }
    // the reflection of Brady while he is above the lake
    const p = this.g.player; if (p && !p.dead && !p.flipped && p.cx > x0 && p.cx < x0 + w && p.y + p.h <= y0 + 2) {
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip(); ctx.globalAlpha = 0.35; ctx.translate(0, 2 * (y0 - TS)); ctx.scale(1, -1);
      try { p.draw(ctx); } catch (er) { }
      ctx.restore();
    }
  }
}
// 22-3: a door that only exists in the reflection: it hangs under the walkway, upside down
class W22ReflectDoor extends ENTITY_TYPES.portal {
  touchPlayer(p) { if (!p.flipped) return; super.touchPlayer(p); }
  draw(ctx) {
    ctx.save(); ctx.translate(0, 2 * this.y + this.h); ctx.scale(1, -1);
    DoorArt.draw(ctx, this.cx, this.y + this.h, 'w22DoorPlain', this.t, this.near);
    ctx.restore();
    if (this.near) { const b = Math.sin(this.t * 6) * 3; ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('UP', this.cx, this.y + this.h + 26 + b); }
  }
}
// 22-5: a typewriter key (the tile under it is a one-way platform); now and then the typist strikes it: it lights,
// then clacks down and pops back up, and whoever stands on it is bounced up
class W22Key extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.ch = s.ch || 'A'; this.ph = s.ph || 0; this.press = 0; this.friendly = true; this.back = true; this.every = s.every || 2.6; }
  update(dt) {
    this.t += dt; const k = (this.t + this.ph) % this.every;
    const was = this.press; this.tell = k > this.every - 0.6; this.press = k < 0.25 ? 1 - k / 0.25 : 0;
    if (this.press > 0 && was === 0) { const p = this.g.player; if (p && p.onGround && Math.abs(p.cx - this.cx) < TS * 0.7 && Math.abs(p.y + p.h - this.y) < 6) { const held = !!(p.inp && p.inp.jump); p.vy = held ? -PHYS.stompVHeld : -18 * TS; p.onGround = false; p.jumping = held; this.g.parts.text(this.cx, this.y - 20, 'CLACK!', '#fff8ec'); } if (this.g.onScreen(this)) K.sfx('clack', 'bump', { vol: 0.25, pitch: 1.6 }); }
  }
  draw(ctx) {
    const x = this.cx, y = this.y + 4 + this.press * 6;
    if (!xDraw(ctx, this.press > 0.3 ? 'key_down_000' : 'key_idle_000', x, y + TS - 4, 1)) {
      Ink.around(ctx, this.x - 4, this.y - 4, this.w + 8, this.h + 10, c => { c.fillStyle = '#2a2a34'; rr(c, x - 15, y + 6, 30, 22, 6); c.fill(); c.fillStyle = '#f4f0e8'; c.beginPath(); c.arc(x, y + 6, 13, 0, TAU); c.fill(); c.strokeStyle = '#8a8a9a'; c.lineWidth = 2; c.stroke(); }, { pad: 4 });
    }
    ctx.fillStyle = this.tell ? '#c86a8a' : '#3a2a4a'; ctx.font = `bold 11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(this.ch, x, y + 4);
  }
}
// 22-5: an ink drip from the pen over the ink pot: a drop falls on a beat (its shadow shows where), a splash hurts
class W22Ink extends Ent {
  constructor(g, s) { super(g, s, 12, 14); this.hy = this.y; this.state = 'grow'; this.k = 0; this.every = s.every || 2.2; this.ph = s.ph || 0; this.floorY = null; }
  update(dt) {
    this.t += dt; const g = this.g;
    if (this.floorY == null) { const fy = TB.floorUnder(g, this.cx, this.y + this.h + 2); this.floorY = fy >= 0 ? fy * TS : g.area.H * TS; }
    if (this.state === 'grow') { this.k += dt / this.every; if (this.k >= 1) { this.state = 'fall'; this.vy = 0; } }
    else if (this.state === 'fall') { this.vy += PHYS.gDown * 0.7 * dt; this.y += this.vy * dt; if (this.y + this.h >= this.floorY) { this.state = 'grow'; this.k = 0; this.y = this.hy; g.burst(this.cx, this.floorY, 8, '#2a2a6a', 'spark'); } }
  }
  touchPlayer(p) { if (this.state === 'fall') { p.hurt(this); this.state = 'grow'; this.k = 0; this.y = this.hy; } }
  draw(ctx) {
    const x = this.cx;
    ctx.fillStyle = '#5a5a68'; ctx.fillRect(x - 3, this.hy - 30, 6, 26); ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(x - 5, this.hy - 4); ctx.lineTo(x + 5, this.hy - 4); ctx.lineTo(x, this.hy + 4); ctx.fill();
    const r = this.state === 'grow' ? 2 + this.k * 4 : 6; ctx.fillStyle = '#1a1a5a'; ctx.beginPath(); ctx.ellipse(x, this.y + this.h - r, r * 0.8, r, 0, 0, TAU); ctx.fill();
    if (this.floorY && (this.state === 'fall' || this.k > 0.6)) { ctx.fillStyle = 'rgba(20,20,80,0.3)'; ctx.beginPath(); ctx.ellipse(x, this.floorY - 2, 10, 3, 0, 0, TAU); ctx.fill(); }
  }
}
Object.assign(ENTITY_TYPES, { w22Slab: W22Slab, w22Lake: W22Lake, w22ReflectDoor: W22ReflectDoor, w22Key: W22Key, w22Ink: W22Ink });
VALIDATOR_PORTALS.w22ReflectDoor = true;   // a door like any other for the level checker (it stands where the reflection walks)

/* ================= pieces ================= */
const dreamPool = (st, x0, x1) => { st.pit(x0, x1); st.B.fill(x0, st.gy + 2, x1, st.H - 1, T.LAVA); };
const P = {
  /* ---- 22-1 the station ---- */
  // the station clock you strike (UP): it flips the whole station between 2:22 and 22:22 (toggle group 0)
  strike(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 4);
    B.toggle(0, [], [], { kind: 'phase' }); B.switchAt(0, x + 2, st.gy - 1); B.switchAt(0, x + 1, st.gy - 1); B.switchAt(0, x + 3, st.gy - 1);
    B.spawn('toggleSwitch', x + 2, st.gy - 1, { g: 0, kind: 'phase', look: 'w22StationClock' });
    if (o.text) st.sign(x, o.text);
    return x + 5;
  },
  // a gap crossed on slabs that exist only at one time: { n, day: [[dx, y, w]], night: [[dx, y, w]], gold: [dx, y, kind] }
  // (dx from the gap's first column, y rows above the floor)
  slabs(st, o) {
    const B = st.B, x = st.x, n = o.n || 7; st.floor(x, x + 1);
    dreamPool(st, x + 2, x + 1 + n);
    const add = (night, [dx, y, w]) => {
      const r = [x + 2 + dx, st.gy - y, x + 1 + dx + w, st.gy - y, T.SEMI];
      if (night) B.toggle(0, [], [r], { kind: 'phase' }); else { B.toggle(0, [r], [], { kind: 'phase' }); for (let q = r[0]; q <= r[2]; q++) B.set(q, r[1], T.SEMI); }
      B.spawn('w22Slab', r[0], r[1], { g: 0, night, rect: r });
      st.coins(r[0], r[2], r[1] - 2);
    };
    for (const s of o.day || []) add(false, s);
    for (const s of o.night || []) add(true, s);
    if (o.gold) st.gold(x + 2 + o.gold[0], st.gy - o.gold[1], o.gold[2] || 'risky');
    st.floor(x + 2 + n, x + 4 + n);
    return x + 5 + n;
  },
  // the great clock tower: a door in its base (inside the big clock)
  bigClock(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 8);
    B.decorAt('w22Tower', x + 4, st.gy, 0); B.decor[B.decor.length - 1].h = 7 * TS;
    B.spawn('portal', x + 4, st.gy - 1, { kind: 'door', look: 'w22ClockDoor', targetRef: o.to });
    if (o.back) B.anchor(o.back, x + 7, st.gy - 1);
    return x + 9;
  },
  // your echo shadows this stretch (W22Echo, kept); a strike clock and a mixed gap inside it: { n, text }
  echoRun(st, o) {
    const B = st.B, x = st.x, n = o.n || 24; st.floor(x, x + 13);
    st.spawn('w22Echo', x + 1, st.gy - 1, { x1: (x + n) * TS });
    if (o.text) st.sign(x + 2, o.text); else B.prop('w22Sign', x + 1, st.gy - 1, 2, 1, 'none', { text: 'YOUR ECHO FOLLOWS' });
    st.semi(x + 5, x + 7, st.gy - 3); st.semi(x + 10, x + 12, st.gy - 3); st.coins(x + 3, x + 12, st.gy - 5);
    st.enemy('w22Alarm', x + 9, st.gy);
    st.x = x + 14;
    if (o.mixed) { st.x = P.strike(st, {}); st.x = P.slabs(st, { n: 8, day: [[0, 2, 3]], night: [[5, 3, 3]] }); }
    return Math.max(st.x, x + n);
  },
  // a ledge only there at 22:22, high over the platform, with a postcard (P3)
  lateLedge(st, o) {
    const B = st.B, x = st.x, y = st.gy - (o.y || 5), w = o.w || 4; st.floor(x, x + w + 3);
    const r = [x + 2, y, x + 1 + w, y, T.SEMI]; B.toggle(0, [], [r], { kind: 'phase' }); B.spawn('w22Slab', r[0], r[1], { g: 0, night: true, rect: r });
    st.semi(x, x + 1, st.gy - 3);
    if (o.gold) st.gold(x + 2 + Math.floor(w / 2), y - 2, o.gold);
    st.coins(x + 2, x + 1 + w, y - 2);
    return x + w + 4;
  },
  // the platform's end: a gate under a station sign
  platformGate(st, o) { const x = st.x; st.floor(x, x + 11); st.B.prop('w22Sign', x + 3, st.gy - 1, 2, 1, 'none', { text: o.text || 'NEXT: 22:22' }); st.decor('w22Lamp', x + 1); st.B.spawn('gate', x + 7, st.gy - 1, { exit: o.exit || 'main' }); return x + 12; },
  // a change of height in place: { h } (up is positive)
  bank(st, o) { const x = st.x; st.floor(x, x + 1); st.gy = clamp(st.gy - (o.h || 1), st.gyMin || 8, st.gyMax || 15); st.floor(x + 2, x + 3); return x + 4; },
  /* ---- 22-3 the lake ---- */
  // the glass walkway over the lake: a gap at each end drops you through the surface; below it gravity turns
  // over and your reflection walks the underside. { n, door: 'area@anchor', back, gold, text, holes: [dx...] }
  pool(st, o) {
    const B = st.B, x = st.x, n = o.n || 16, gy = st.gy, H = st.H;
    st.floor(x, x + 1);
    for (let xx = x + 2; xx <= x + n + 1; xx++) { B.clearCol(xx, 0, H - 1); B.set(xx, gy, T.HARD); }
    const holes = o.holes || [1, n - 3];
    for (const h of holes) { B.set(x + 2 + h, gy, T.EMPTY); B.set(x + 3 + h, gy, T.EMPTY); }
    B.zone(x + 2, gy + 1, n, H - gy - 1, 0, 0, 0, 'flip');
    B.spawn('w22Lake', x + 2 + Math.floor(n / 2), gy, { w: n, line: gy });
    // reflected stones hang under the walkway (steps for the upside-down walk), coins along the underside
    for (const dx of o.stones || [5, 10]) if (dx < n - 4) B.fill(x + 2 + dx, gy + 1, x + 3 + dx, gy + 2, T.HARD);
    st.coins(x + 4, x + n - 2, gy + 3);
    st.coins(x + 5, x + n - 4, gy - 3);
    if (o.door) { const dx = x + 2 + Math.floor(n * 0.6); const s = B.spawn('w22ReflectDoor', dx, gy + 2, { kind: 'door', look: 'w22DoorPlain', targetRef: o.door }); s.y = (gy + 1) * TS + 52; }
    if (o.back) B.anchor(o.back, x + n + 3, gy - 1);
    if (o.gold) st.gold(x + 2 + holes[holes.length - 1], gy, o.gold);
    if (o.text) st.sign(x, o.text);
    if (o.enemy) st.enemy(o.enemy, x + 2 + Math.floor(n / 2), gy);
    st.floor(x + n + 2, x + n + 3);
    return x + n + 4;
  },
  // stepping stones on the dream lake (the kept 'lake' piece) with P1 over the middle stone
  stones(st, o) { const x = st.x, nx = Tour.pieces['w22.lake'](st, { n: o.n || 4 }); if (o.gold) st.gold(x + 2 + 2 * Math.floor((o.n || 4) / 2) * 2 + 2, st.gy - 5, o.gold); return nx; },
  /* ---- 22-4 the hall ---- */
  // a full-length mirror on the hall wall: walk into it (P2 behind it)
  mirrorDoor(st, o) { return Tour.pieces.secretDoor(st, { to: o.to, look: 'curtain', skin: 'w22MirrorPane', back: o.back, h: 3 }); },
  // painted numbered doors along a wall, counting up to the real door 22: { from, n }
  doorsRow(st, o) { const x = st.x, n = o.n || 3; st.floor(x, x + n * 3 + 1); for (let k = 0; k < n; k++) st.spawn('w22NumDoorE', x + 2 + k * 3, st.gy - 1, { n: (o.from || 19) + k }); st.coins(x + 1, x + n * 3, st.gy - 3); return x + n * 3 + 2; },
  /* ---- 22-5 the desk ---- */
  // a row of typewriter keys over the type basket: { n, y (rows above the floor), text, gold }
  keys(st, o) {
    const B = st.B, x = st.x, n = o.n || 8, y = st.gy - (o.y || 0), word = o.word || 'TWENTYTWO';
    st.floor(x, x + 1); st.pit(x + 2, x + 2 + n * 2);
    B.fill(x + 2, st.H - 2, x + 2 + n * 2, st.H - 1, T.GROUND);                 // the basket's floor, far below (a long fall back to a ladder of keys)
    for (let k = 0; k < n; k++) { const kx = x + 2 + k * 2 + (k % 2), ky = y - (k % 3 === 1 ? 1 : 0); B.set(kx, ky, T.SEMI); B.setHide(kx, ky, 1); B.spawn('w22Key', kx, ky, { ch: word[k % word.length], ph: k * 0.4, every: 2.6 }); st.coins(kx, kx, ky - 2); }
    // a ladder of keys up from the basket floor (never a dead end)
    for (let k = 0; k < 4; k++) { const kx = x + 3 + k * 3, ky = st.H - 4 - k * 3; if (ky > y + 1) { B.set(kx, ky, T.SEMI); B.setHide(kx, ky, 1); B.spawn('w22Key', kx, ky, { ch: '' + (k + 1), ph: 0.7 * k, every: 3.1 }); } }
    if (o.text) st.sign(x, o.text);
    if (o.gold) st.gold(x + 2 + n, y - 4, o.gold);
    st.floor(x + 3 + n * 2, x + 5 + n * 2);
    return x + 6 + n * 2;
  },
  // a giant ink pot to climb over, its pen dripping ink: { drip }
  inkpot(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 9);
    B.prop('w22InkPot', x + 3, st.gy - 2, 3, 2, 'body', {});
    if (o.drip) st.spawn('w22Ink', x + 8, Math.max(2, st.gy - 9), { every: 2.2 });
    st.coins(x + 3, x + 5, st.gy - 5);
    return x + 10;
  },
  // a giant pencil as a bridge over the gap: { n }
  pencil(st, o) { const B = st.B, x = st.x, n = o.n || 10; st.floor(x, x + 1); st.pit(x + 2, x + n + 1); B.prop('w22Pencil', x + 1, st.gy, n + 2, 1, 'body', {}); st.coins(x + 3, x + n, st.gy - 2); st.floor(x + n + 2, x + n + 4); return x + n + 5; },
  // manuscript pages over the gap: they crumple under Brady (crumble tiles): { n, gold }
  pages(st, o) {
    const B = st.B, x = st.x, n = o.n || 6; st.floor(x, x + 1); dreamPool(st, x + 2, x + n + 1);
    for (let q = 0; q < n; q++) B.set(x + 2 + q, st.gy, T.CRUMBLE);
    B.decorAt('w22Pages', x + 2 + n / 2 - 0.5, st.gy + 1, 0); B.decor[B.decor.length - 1].w = n * TS;
    st.coins(x + 2, x + n + 1, st.gy - 2);
    if (o.gold) st.gold(x + 2 + Math.floor(n / 2), st.gy - 3, o.gold);
    st.floor(x + n + 2, x + n + 4); return x + n + 5;
  },
  // paperclip springs up the side of the coffee cup; its rim is the ledge (P3)
  cup(st, o) {
    const B = st.B, x = st.x, gy = st.gy; st.floor(x, x + 16);
    for (const [dx, h] of [[1, 0], [5, 3]]) { if (h) B.prop('w22Books', x + dx - 1, gy - h, 3, h, 'body', {}); st.spawn('spring', x + dx, gy - h - 1, { skin: 'w22Clip' }); B.springs.push([x + dx, gy - h - 1]); }
    B.prop('w22Cup', x + 9, gy - 7, 6, 7, 'body', {});
    for (let q = 0; q < 6; q++) B.set(x + 9 + q, gy - 7, T.SEMI);
    st.coins(x + 9, x + 14, gy - 9);
    if (o.gold) st.gold(x + 12, gy - 9, o.gold);
    return x + 17;
  },
  // the open drawer: a door into it
  drawer(st, o) { const B = st.B, x = st.x; st.floor(x, x + 6); B.spawn('portal', x + 3, st.gy - 1, { kind: 'door', look: 'w22DrawerDoor', targetRef: o.to }); if (o.back) B.anchor(o.back, x + 6, st.gy - 1); return x + 7; }
};
for (const k in P) Tour.pieces['w22.' + k] = P[k];

/* ================= stamps ================= */
// 22-2: the corridor maze, nine cells of 26 x 14; painted numbered doors (decor) count up along the way
const MAZE = { t: ['enemy', 'w22Hourglass'], e: ['enemy', 'w22Envelope'], a: ['enemy', 'w22Alarm'], m: ['enemy', 'w22Moth'], q: ['decor', 'w22Clock'], p: ['decor', 'w22Lamp'] };
const cell = (marks, nums, extra) => {
  const legend = Object.assign({}, MAZE), L = 'jklnruwxz'.split('');
  const mk = marks.slice(); nums.forEach(([n, x], k) => { legend[L[k]] = ['spawn', 'w22NumDoorE', { n }]; mk.push([x, 11, L[k]]); });
  return Object.assign({ floor: 12, rows: room(26, 14, 12, mk, { wall: '#' }), legend }, extra || {});
};
const corridor = {
  // A the lobby (start); a door out to the clock hall
  lobby: cell([[2, 11, '@'], [4, 11, 'i'], [8, 7, '?'], [6, 4, 'o.o.o.o'], [6, 5, '-----']], [[1, 9], [2, 13], [3, 17]], { items: ['power'] }),
  // B the clock hall: a door that loops back to the lobby; the floor gives way at the far end (down to E)
  clocks: cell([[2, 6, '-----'], [12, 6, '-----'], [3, 4, 'o.o'], [13, 4, 'o.o'], [8, 11, 'q'], [16, 11, 'a']], [[4, 6], [5, 10], [6, 15]]),
  // C the gallery: P1 up on the gallery, the way out
  gallery: cell([[5, 8, '----'], [10, 5, '----'], [15, 3, '------'], [17, 1, '*'], [11, 3, 'o.o'], [22, 11, 'G'], [8, 11, 'p']], [], { gold: { '*': 'must' } }),
  // D a dead end: P2 on a ledge, a hidden water bottle
  dead: cell([[6, 7, '-----'], [8, 5, '*'], [14, 7, 'h'], [12, 11, 'e'], [4, 3, 'o.o.o']], [[10, 6], [11, 10], [12, 14]], { hidden: ['oneup'], gold: { '*': 'hidden' } }),
  // E the hourglass hall: where the clock hall's floor drops you
  hall: cell([[6, 8, '---'], [16, 8, '---'], [10, 11, 't'], [17, 11, 't'], [11, 3, 'o.o.o.o']], [[7, 6], [8, 9], [9, 16]]),
  // F the loop room: walk on and it is the same room again; the way is up the ledges (or down the hole)
  loop: cell([[6, 9, '----'], [11, 6, '----'], [16, 3, '--------'], [21, 11, 'O'], [19, 10, '*'], [8, 4, 'o.o']], [[13, 6], [14, 9], [15, 12]], { gold: { '*': 'risky' } }),
  // G the lamp room (a dead end): the LSD tab
  lamps: cell([[10, 7, '?'], [6, 11, 'p'], [16, 11, 'p'], [8, 4, 'o.o.o.o.o'], [12, 11, 'e']], [], { items: ['lsd'] }),
  // H the door hall: doors 16 to 21 painted on the wall, then the real door 22
  doors: cell([[11, 4, 'o.o.o'], [10, 6, '-----'], [19, 11, 'D'], [21, 11, 'K'], [15, 9, 't']], [[16, 6], [17, 8], [18, 10], [19, 12], [20, 14], [21, 16]],
    { doors: [{ to: 'beyond@in', look: 'w22Door22' }] }),
  // I the mail room (under the loop room's hole): loose letters, a way back to the door hall
  mail: cell([[6, 4, 'o.o.o.o.o.o'], [8, 6, '--------'], [12, 11, 'e'], [18, 11, 'e'], [20, 7, 'm']], [])
};
corridor.lobby.legend.i = ['spawn', 'sign', { text: 'THE CORRIDOR GOES ON AND ON. COUNT THE DOORS...' }];
corridor.doors.legend.K = ['anchor', 'beyondBack'];
corridor.loop.legend.O = ['spawn', 'w22Loop', { span: 13 }];
// a painted numbered door as an entity (stamps can't give decor a number): drawn behind everything
class W22NumDoorE extends Ent { constructor(g, s) { super(g, s, 28, 52); this.n = s.n || 1; this.back = true; this.friendly = true; } update(dt) { this.t += dt; } draw(ctx) { paintedDoor(ctx, this.cx, this.y + this.h, this.n, this.t); } }
ENTITY_TYPES.w22NumDoorE = W22NumDoorE;

const stamps = {
  // 22-1 (s): inside the big clock: gears, P2, a water bottle
  clock: {
    floor: 11,
    rows: room(30, 14, 11, [[2, 10, '@.D'], [7, 8, '---'], [11, 6, '---'], [15, 4, '---'], [16, 2, '*'], [20, 7, '?'], [6, 4, 'o.o.o'], [22, 4, 'o.o.o']]),
    items: ['oneup'], doors: [{ to: 'station@clockBack', look: 'w22ClockDoor' }], gold: { '*': 'hidden' }
  },
  // 22-2 (s): behind door 22: a desk lamp, a typewriter, the secret gate to the writer's desk
  beyond: {
    floor: 11,
    rows: room(30, 14, 11, [[2, 10, '@.D'], [8, 10, 'i'], [6, 4, 'o.o.o.o.o.o'], [8, 6, '--------'], [20, 10, 'l'], [24, 10, 'g']]),
    legend: { i: ['spawn', 'sign', { text: 'BEHIND DOOR 22: A DESK, A TYPEWRITER AND A STORY NOBODY HAS FINISHED...' }], l: ['decor', 'w22Lamp'] },
    doors: [{ to: 'corridor@beyondBack', look: 'w22Door22' }]
  },
  // 22-3 (s): under the lake (the reflection's own room): P2 and a star
  under: {
    floor: 11,
    rows: room(30, 14, 11, [[2, 10, '@.D'], [8, 7, '-----'], [10, 5, '*'], [7, 5, 'o.o'], [13, 5, 'o.o'], [19, 7, '?'], [24, 10, 'l']]),
    legend: { l: ['decor', 'w22Lamp'] },
    items: ['oneup'], doors: [{ to: 'lake@underBack', look: 'w22DoorPlain' }], gold: { '*': 'hidden' }
  },
  // 22-4 (s): behind the mirror: the hall reversed, P2
  behind: {
    floor: 11,
    rows: room(30, 14, 11, [[2, 10, '@.D'], [9, 7, '-----'], [11, 5, '*'], [8, 5, 'o.o'], [14, 5, 'o.o'], [20, 7, '?'], [24, 10, 'k']]),
    legend: { k: ['decor', 'w22Clock'] },
    items: ['oneup'], doors: [{ to: 'hall@mirrorBack', look: 'w22DoorPlain' }], gold: { '*': 'hidden' }
  },
  // 22-5 (s): the drawer: pencils, paper, P2, a water bottle
  drawer: {
    floor: 11,
    rows: room(30, 14, 11, [[2, 10, '@.D'], [7, 8, '----'], [12, 6, '----'], [17, 4, '----'], [19, 2, '*'], [9, 6, 'o.o'], [14, 4, 'o.o'], [23, 7, '?']]),
    items: ['oneup'], doors: [{ to: 'desk@drawerBack', look: 'w22DrawerDoor' }], gold: { '*': 'hidden' }
  }
};
for (const k in corridor) { const c = corridor[k]; delete c.legend2; }

/* ================= the levels ================= */
const levels = [
  // 22-1 PHASE: strike the station clock: 2:22 <-> 22:22
  { n: 1, name: 'The Station of Clocks', arch: 'phase', theme: 'w22_dusk',
    gimmick: 'Clock faces drift round; strike the station clock and 2:22 becomes 22:22: brass hands vanish, lilac numerals glow, and your echo follows',
    hint: 'Strike a station clock (UP) to swap 2:22 and 22:22. Brass hands are there at 2:22, lilac 22s at 22:22',
    postcard: 'The station clock says 22:22. It said 22:22 an hour ago, too. ♥ C',
    enemies: [['w22Alarm', 3], ['w22Moth', 2], ['w22Envelope', 1]],
    mapCell: [0, 0], mapFrom: -1,
    exits: { main: { to: '22-2' } },
    areas: [
      { id: 'station', gen: 'strip', W: 156, H: 18, phase: { night: 'w22_2222' }, script: [
        ['itemBlock', { item: 'power', y: 4 }],
        // ① clock faces drift round
        ['clocks', {}],
        ['postcard', { kind: 'must', dx: -9, dy: -8 }],
        ['bank', { h: 2 }],
        ['upward', {}],
        ['bank', { h: -2 }],
        ['clocks', {}],
        // ② strike the clock: the station swaps
        ['strike', { text: 'STRIKE THE STATION CLOCK (UP): 2:22 BECOMES 22:22 AND THE STATION CHANGES' }],
        ['slabs', { n: 6, day: [[1, 2, 4]] }],
        ['slabs', { n: 7, night: [[1, 3, 5]] }],
        ['bank', { h: 2 }],
        ['bigClock', { to: 'clock@in', back: 'clockBack' }],
        'cp',
        ['strike', {}],
        ['lateLedge', { y: 6, gold: 'risky' }],
        ['slabs', { n: 9, day: [[0, 2, 3]], night: [[5, 4, 3]] }],
        // ③ your echo trails you while you swap
        ['echoRun', { n: 30, mixed: true, text: 'YOUR ECHO WALKS WHERE YOU WALKED, A MOMENT LATER. KEEP MOVING' }],
        ['bank', { h: -2 }],
        ['gearStand', { item: 'sundial' }],
        ['strike', {}],
        ['slabs', { n: 9, day: [[0, 3, 3]], night: [[5, 2, 3]] }],
        ['enemies', { kind: 'w22Alarm', n: 2, len: 10 }],
        ['platformGate', {}]
      ] },
      { id: 'clock', gen: 'room', role: 'secret', theme: 'w22_clockroom', stamp: 'clock' }
    ] },

  // 22-2 MAZE: the endless corridor
  { n: 2, name: 'The Endless Corridor', arch: 'maze', theme: 'w22_corridor',
    gimmick: 'A corridor folded on itself: doors that loop, hourglasses that slow time, and painted doors to count. The 22nd door is different',
    hint: 'Count the doors. Hourglasses slow you down when they turn over: stomp them before they do',
    postcard: 'I walked down the same hallway 22 times. Then I looked up. ♥ C',
    enemies: [['w22Hourglass', 2], ['w22Envelope', 2]],
    mapCell: [1, 0], mapFrom: 0,
    exits: { main: { to: '22-3' }, secret: { to: '22-5', hint: 'One door in the corridor is golden, and ajar...' } },
    areas: [
      { id: 'corridor', gen: 'maze', cells: [3, 3], cell: [26, 14],
        script: [[corridor.lobby, corridor.clocks, corridor.gallery], [corridor.dead, corridor.hall, corridor.loop], [corridor.lamps, corridor.doors, corridor.mail]],
        links: [
          { from: [0, 0], to: [1, 0], kind: 'door', at: [22, 11], toAt: [3, 11], look: 'w22DoorPlain' },
          { from: [1, 0], to: [0, 0], kind: 'oneway', at: [12, 11], toAt: [5, 11], look: 'w22DoorPlain' },
          { from: [1, 0], to: [1, 1], kind: 'drop', at: [19, 11] },
          { from: [1, 1], to: [0, 1], kind: 'door', at: [3, 11], toAt: [22, 11], look: 'w22DoorPlain' },
          { from: [1, 1], to: [2, 1], kind: 'door', at: [22, 11], toAt: [3, 11], look: 'w22DoorPlain' },
          { from: [1, 1], to: [1, 2], kind: 'door', at: [13, 11], toAt: [4, 11], look: 'w22DoorPlain' },
          { from: [2, 1], to: [2, 0], kind: 'door', at: [22, 2], toAt: [3, 11], look: 'w22DoorPlain' },
          { from: [2, 1], to: [2, 2], kind: 'drop', at: [14, 11] },
          { from: [1, 2], to: [0, 2], kind: 'door', at: [2, 11], toAt: [22, 11], look: 'w22DoorPlain' },
          { from: [2, 2], to: [1, 2], kind: 'door', at: [3, 11], toAt: [23, 11], look: 'w22DoorPlain' }
        ] },
      { id: 'beyond', gen: 'room', role: 'secret', theme: 'w22_clockroom', stamp: 'beyond' }
    ] },

  // 22-3 FLIP: Mirror Lake, played right to left; the reflection walks upside down under the walkway
  { n: 3, name: 'Mirror Lake', arch: 'flip', theme: 'w22_lake',
    gimmick: 'Everything is the other way round: run left over the stepping stones, then fall through the lake and walk your reflection upside down',
    hint: 'Go LEFT. Fall through a gap in the glass walkway: under the lake you walk upside down. Jump out through the next gap',
    postcard: 'My reflection waved at me before I waved at it. ♥ C',
    enemies: [['w22Moth', 2], ['w22Alarm', 2]],
    mapCell: [2, 0], mapFrom: 1,
    exits: { main: { to: '22-4' } },
    areas: [
      { id: 'lake', gen: 'strip', W: 164, H: 18, GY: 9, gyMin: 6, gyMax: 11, mirror: true, script: [
        ['itemBlock', { item: 'power', y: 4 }],
        // ① stepping stones
        ['stones', { n: 4, gold: 'must' }],
        ['stairs', { n: 3 }],
        // ② fall through the surface and walk your reflection upside down
        ['pool', { n: 16, text: 'FALL THROUGH A GAP IN THE GLASS: UNDER THE LAKE, YOUR REFLECTION WALKS UPSIDE DOWN', door: 'under@in', back: 'underBack' }],
        ['enemies', { kind: 'w22Moth', n: 1, len: 8 }],
        'cp',
        ['pool', { n: 14, stones: [4, 8], enemy: 'w22Alarm' }],
        // ③ swap above and below in mid-air
        ['pool', { n: 18, holes: [1, 6, 11, 15], stones: [], gold: 'risky' }],
        ['itemBlock', { item: 'star', y: 4 }],
        ['stones', { n: 5 }],
        ['gate', { exit: 'main' }]
      ] },
      { id: 'under', gen: 'room', role: 'secret', theme: 'w22_under', stamp: 'under' }
    ] },

  // 22-4 LAIR: the hall to the 22nd door, then the Other Brady
  { n: 4, name: 'The 22nd Door', arch: 'lair', theme: 'w22_white', boss: 'w22_other',
    gimmick: 'Your echo follows you down the last hall; a mirror on the wall is a way through; then the Other Brady mirrors your every move',
    hint: 'Your reflection copies you: walk him into the spikes on HIS side. At 22:22 the mirror opens: stomp him!',
    postcard: 'You found the 22nd door, and you were brave enough to open it. That was the whole secret. ♥ C',
    enemies: [['w22Moth', 2], ['w22Alarm', 1]],
    mapCell: [1, 1], mapFrom: 2,
    exits: { main: { to: null } },
    areas: [
      { id: 'hall', gen: 'strip', W: 64, H: 18, script: [
        ['itemBlock', { item: 'power', y: 4 }],
        ['echoRun', { n: 18, text: 'THE LAST HALL. YOUR ECHO IS RIGHT BEHIND YOU' }],
        ['clocks', {}],
        ['postcard', { kind: 'must', dx: -9, dy: -8 }],
        ['mirrorDoor', { to: 'behind@in', back: 'mirrorBack' }],
        ['gearStand', { item: 'sundial' }],
        ['upward', {}],
        ['postcard', { kind: 'risky', dx: -4, dy: -10 }],
        ['doorsRow', { from: 19, n: 3 }],
        ['door', { to: 'arena', perch: 0, look: 'w22Door22' }]
      ] },
      { id: 'behind', gen: 'room', role: 'secret', theme: 'w22_behind', stamp: 'behind' },
      { id: 'arena', gen: 'arena', role: 'arena', layout: 'door', arenaW: 26, H: 18, roof: false }
    ] },

  // 22-5 MINI (secret): the writer's desk
  { n: 5, name: 'The Writer\'s Desk', arch: 'mini', secret: true, theme: 'w22_desk',
    gimmick: 'Tiny Brady on a writer\'s desk: typewriter keys that clack, a dripping ink pot, pages that crumple, paperclip springs up to the coffee cup',
    hint: 'A key glows pink just before the typist strikes it: stand on it and it bounces you',
    postcard: 'A desk, a typewriter and a story called 22. Somebody should finish it. ♥ C',
    enemies: [['w22Envelope', 2], ['w22Moth', 2]],
    mapCell: [0, 1], mapFrom: 1,
    exits: { main: { to: null } },
    areas: [
      { id: 'desk', gen: 'strip', W: 200, H: 22, script: [
        ['gearStand', { item: 'plane' }],
        ['itemBlock', { item: 'power', y: 4 }],
        // ① the typewriter keys
        ['keys', { n: 8, text: 'TINY BRADY! HOP THE TYPEWRITER KEYS. A PINK KEY IS ABOUT TO CLACK', gold: 'must' }],
        ['pencil', { n: 9 }],
        ['bank', { h: 2 }],
        ['keys', { n: 6, y: 2, word: 'NOVEL' }],
        // ② ink pots and crumpling pages
        ['inkpot', { drip: true }],
        ['pages', { n: 6 }],
        ['drawer', { to: 'drawer@in', back: 'drawerBack' }],
        'cp',
        ['enemies', { kind: 'w22Envelope', n: 2, len: 10 }],
        ['inkpot', { drip: true }],
        ['pages', { n: 7 }],
        // ③ paperclip springs to the top of the coffee cup
        ['cup', { gold: 'risky' }],
        ['itemBlock', { item: 'lsd', y: 5 }],
        ['bank', { h: -2 }],
        ['keys', { n: 10, word: 'THEEND' }],
        ['pencil', { n: 8 }],
        ['gate', { exit: 'main' }]
      ] },
      { id: 'drawer', gen: 'room', role: 'secret', theme: 'w22_drawer', stamp: 'drawer' }
    ] }
];

Tour.amend('w22', {
  stamps, skins,
  map: { fort: 'door', start: [0, 0] },
  levels
});
})();
