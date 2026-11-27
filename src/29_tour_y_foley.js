/* ============================================================
   FOLEY BEACH (world 29, cc 'foley'): a hidden land (docs/handoff/HIDDEN_LAND_BRIEF.md, ChatGPT's A4).
   "Behind Piwi's seaside show, two coconuts are on the payroll as a horse and a sheet of tin has top billing as the
   weather." Apricot shells, petrol-blue tin, ivory scalloped sound rings and burgundy felt, on sand over stage boards.
   The land is about SOUND, and the game is often played muted: every noise has a visible source and a visible cue.
   Rings spread from whatever makes a noise (FoleyFX below): a high clack throws small quick ivory rings, a low thump
   slow wide burgundy ones, the tin a jagged ripple, the rice tray a spray of dots, the windcloth long loops.
   Found only through Brazil 3-1 (Samba Sunrise): jump through the painted sea behind the band's empty riser, where one
   wave has a brass fastener in its foam (29_tour_y_foley_e_entry.js).
   This file: the route stop, the looks (tiles, themes, painted backdrops, props), the sound rings and the pills, the
   critters (Clapper Clam, Hiss Kettle, Rubbersole Ray, Boom Crab), the route-map emblem, the map's sprites, the music
   and the country. Mechanics: _a_mech.js. Rooms: _b_rooms.js. Boss (Mr. Thunder): _c_boss.js. Levels: _d_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'foley', world: 29, name: 'Foley Beach', sub: 'a hidden land', lon: -31, lat: -12, secret: true, bonus: true, d0: 0.8, pin: 'tin' });
const COL = { a: '#2e6a80', b: '#7a2236', c: '#f6ecd6' };
const INK = '#1a1426';
const APRI = '#f2a65a', APRI2 = '#d8813a', APRI3 = '#ffd2a0', TIN = '#2e6a80', TIN2 = '#1e4a5e', TIN3 = '#5a9ab0', IVORY = '#f6ecd6', IVORY2 = '#e2d2b0',
  FELT = '#7a2236', FELT2 = '#561428', FELT3 = '#a23a50', SAND = '#f0c878', SAND2 = '#d8a858', BRASS = '#e8b83a', WOOD = '#8a5a34', WOOD2 = '#5e3a20';

/* ---------------- tiles: sand over stage boards, tin planks, prop tins, burgundy timber ---------------- */
const sandGround = {
  style: 'sandboard', cap: SAND, capHi: '#fff0c0', dirt: FELT, dirt2: FELT2, rock: '#3e0e1c',
  paint(ctx) {
    ctx.fillStyle = FELT; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = FELT2; ctx.fillRect(0, 14, TS, 2); ctx.fillRect(0, TS - 2, TS, 2);
    ctx.fillStyle = FELT3; ctx.fillRect(0, 3, TS, 2);
    ctx.fillStyle = '#c86a78'; ctx.beginPath(); ctx.arc(8, 8, 2.2, 0, TAU); ctx.arc(24, 23, 2.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(8, 8, 2.2, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(24, 23, 2.2, 0, TAU); ctx.stroke();
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = SAND2; ctx.beginPath(); ctx.moveTo(x0, 0); for (let x = x0; x <= x1; x += 4) ctx.lineTo(x, 11 + Math.sin(x * 0.4) * 1.6); ctx.lineTo(x1, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = SAND; ctx.beginPath(); ctx.moveTo(x0, 0); for (let x = x0; x <= x1; x += 4) ctx.lineTo(x, 8 + Math.sin(x * 0.4 + 1) * 1.4); ctx.lineTo(x1, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff0c0'; ctx.fillRect(x0, 0, x1 - x0, 1.6);
    ctx.fillStyle = 'rgba(150,100,40,0.5)'; for (let x = x0 + 3; x < x1; x += 7) ctx.fillRect(x, 4 + ((x * 3) % 3), 2, 1.5);
    ctx.fillStyle = INK; ctx.fillRect(x0, 0, x1 - x0, 0.9);
  }
};
const tinSemi = {
  style: 'tinplank', c1: TIN, c2: FELT,
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = TIN2; ctx.fillRect(x0, 2, x1 - x0, 10);
    ctx.fillStyle = TIN; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = TIN3; ctx.fillRect(x0, 0, x1 - x0, 2);
    ctx.fillStyle = '#9ad0e0'; for (let x = x0 + 8; x < x1 - 4; x += 16) { ctx.beginPath(); ctx.arc(x, 5, 1.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = FELT; if (part === 'L' || part === 'S') ctx.fillRect(x0, -1, 5, 13); if (part === 'R' || part === 'S') ctx.fillRect(x1 - 5, -1, 5, 13);
    ctx.fillStyle = INK; ctx.fillRect(x0, 11, x1 - x0, 1.4);
  }
};
const tinBrick = {
  style: 'proptin', c1: TIN, c2: TIN2, mortar: TIN2,
  paint(ctx) {
    ctx.fillStyle = TIN2; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = TIN; rr(ctx, 1.5, 1.5, TS - 3, TS - 3, 3); ctx.fill();
    ctx.fillStyle = FELT; ctx.fillRect(2, 11, TS - 4, 4);
    ctx.fillStyle = APRI; ctx.beginPath(); ctx.moveTo(16, 18); for (let k = 0; k <= 4; k++) { const a = Math.PI + k * Math.PI / 4; ctx.lineTo(16 + Math.cos(a) * 6, 18 + Math.sin(a) * 6); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9ad0e0'; for (const [x, y] of [[5, 5], [27, 5], [5, 27], [27, 27]]) { ctx.beginPath(); ctx.arc(x, y, 1.5, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; rr(ctx, 1.5, 1.5, TS - 3, TS - 3, 3); ctx.stroke();
  }
};
const timberHard = {
  c1: FELT3, c2: FELT2,
  paint(ctx) {
    ctx.fillStyle = FELT; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = FELT3; ctx.fillRect(0, 2, TS, 4); ctx.fillRect(0, 18, TS, 3);
    ctx.fillStyle = FELT2; ctx.fillRect(0, 12, TS, 2); ctx.fillRect(0, 27, TS, 2);
    ctx.fillStyle = '#c86a78'; ctx.beginPath(); ctx.arc(6, 7, 1.8, 0, TAU); ctx.arc(26, 22, 1.8, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(0.6, 0.6, TS - 1.2, TS - 1.2);
  }
};
// the rooms' own floors (each room is its own place): cork, black lacquer, rope matting, chequer lino, teak deck,
// dune grass
const roomGround = (name, body, cap, capHi, line, pat) => ({
  style: name, cap, capHi, dirt: body, dirt2: shade(body, -0.15), rock: shade(body, -0.3),
  paint(ctx, rng) { ctx.fillStyle = body; ctx.fillRect(0, 0, TS, TS); pat(ctx, rng); },
  paintCap(ctx, x0, x1) { ctx.fillStyle = shade(cap, -0.25); ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = cap; ctx.fillRect(x0, 0, x1 - x0, 7); ctx.fillStyle = capHi; ctx.fillRect(x0, 0, x1 - x0, 1.6); ctx.fillStyle = line; ctx.fillRect(x0, 9, x1 - x0, 1.4); }
});
const MAT = {
  cork: roomGround('cork', '#a8784a', '#c89a68', '#f0d0a0', INK, ctx => { ctx.fillStyle = 'rgba(80,40,10,0.35)'; for (let k = 0; k < 9; k++) ctx.fillRect((k * 13) % 30, (k * 7) % 30, 2, 2); }),
  lacquer: roomGround('lacquer', '#1e1a24', '#3a3444', '#8a84a0', '#e8b83a', ctx => { ctx.fillStyle = 'rgba(232,184,58,0.25)'; ctx.fillRect(0, 15, TS, 1.5); }),
  rope: roomGround('rope', '#c8a870', '#e0c890', '#fff0c8', INK, ctx => { ctx.strokeStyle = 'rgba(120,80,30,0.45)'; ctx.lineWidth = 2; for (let y = 4; y < TS; y += 8) { ctx.beginPath(); for (let x = 0; x <= TS; x += 4) ctx.lineTo(x, y + Math.sin(x * 0.8) * 1.5); ctx.stroke(); } }),
  lino: roomGround('lino', '#2a4a5a', '#e8e0d0', '#ffffff', INK, ctx => { ctx.fillStyle = '#e8e0d0'; ctx.fillRect(0, 0, 16, 16); ctx.fillRect(16, 16, 16, 16); }),
  teak: roomGround('teak', '#9a6030', '#c08048', '#f0c090', INK, ctx => { ctx.fillStyle = '#3a2410'; ctx.fillRect(0, 10, TS, 1.5); ctx.fillRect(0, 21, TS, 1.5); }),
  dune: roomGround('dune', '#d8b070', '#a8c070', '#e0f0a0', INK, ctx => { ctx.fillStyle = 'rgba(255,240,200,0.4)'; for (let k = 0; k < 5; k++) ctx.fillRect((k * 11) % 30, (k * 9) % 30, 3, 1.5); })
};
const STAGE = { ground: sandGround, semi: tinSemi, brick: tinBrick, hard: timberHard, pillar: { c1: IVORY, c2: IVORY2, cap: BRASS, style: 'column' }, accent: TIN, tint: {}, bloom: 0.15, liquid: null };

/* ---------------- shared drawings ---------------- */
const FArt = {
  INK,
  // an apricot scallop shell (r: its radius; eyes: the nosy flock's eyes looking toward lookX)
  shell(ctx, x, y, r, col, eyes, look) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1.2, r * 0.14); ctx.fillStyle = col || APRI;
    ctx.beginPath(); ctx.moveTo(x - r * 0.35, y); for (let k = 0; k <= 8; k++) { const a = Math.PI + k * Math.PI / 8, rr2 = k % 2 ? r : r * 0.9; ctx.lineTo(x + Math.cos(a) * rr2, y - r * 0.15 + Math.sin(a) * rr2 * 0.95); } ctx.lineTo(x + r * 0.35, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,50,10,0.55)'; ctx.lineWidth = 1; for (let k = 1; k < 4; k++) { const a = Math.PI + k * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x, y - 1); ctx.lineTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8); ctx.stroke(); }
    ctx.fillStyle = col ? shade(col, -0.2) : APRI2; ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.fillRect(x - r * 0.35, y - 1, r * 0.7, 3); ctx.strokeRect(x - r * 0.35, y - 1, r * 0.7, 3);
    if (eyes) { const lx = clamp(look || 0, -1, 1) * r * 0.14; for (const ex of [-0.28, 0.28]) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x + ex * r, y - r * 0.55, r * 0.2, r * 0.24, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + ex * r + lx, y - r * 0.55, r * 0.1, 0, TAU); ctx.fill(); } }
    ctx.restore();
  },
  // an ivory scalloped ring (the land's sound ring): r radius, a alpha, n scallops
  ring(ctx, x, y, r, a, col, lw) {
    if (r <= 1 || a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col || IVORY; ctx.lineWidth = lw || 3; ctx.beginPath();
    const n = Math.max(8, Math.round(r / 5));
    for (let k = 0; k <= n * 4; k++) { const t2 = k / (n * 4) * TAU, rr2 = r + Math.sin(t2 * n) * Math.min(3, r * 0.08); ctx.lineTo(x + Math.cos(t2) * rr2, y + Math.sin(t2) * rr2 * 0.8); }
    ctx.stroke(); ctx.restore();
  },
  // a felt-lined prop tin (closed)
  propTin(ctx, x, y, w, h) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = TIN; rr(ctx, x - w / 2, y - h, w, h, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = FELT; ctx.fillRect(x - w / 2 + 2, y - h * 0.62, w - 4, 4);
    ctx.fillStyle = APRI; ctx.beginPath(); ctx.arc(x, y - h * 0.5, Math.min(7, w * 0.16), Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a coconut half (the horse's understudy)
  coconut(ctx, x, y, r) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#7a4a24'; ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f6ecd6'; ctx.fillRect(x - r, y - 1.5, r * 2, 3); ctx.strokeRect(x - r, y - 1.5, r * 2, 3);
    ctx.fillStyle = '#4a2a10'; for (let k = 0; k < 5; k++) ctx.fillRect(x - r * 0.6 + k * r * 0.3, y - r * 0.6 - (k % 2) * 3, 1.5, 3); ctx.restore();
  },
  // Piwi's seaside-show bunting is NOT drawn (no strings of flags): instead a scalloped felt valance
  valance(ctx, x0, x1, y, col) { ctx.save(); ctx.fillStyle = col || FELT; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, y - 8); for (let x = x0; x <= x1; x += 24) ctx.arc(x + 12, y, 12, Math.PI, 0, true); ctx.lineTo(x1, y - 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
};

/* ---------------- the sound rings: every noise has a visible source ----------------
   FoleyFX.noise(g, x, y, kind, o): kind 'clack' (small quick ivory rings), 'thump' (wide slow burgundy rings), 'jag'
   (a jagged tin ripple), 'dots' (rice: a spray of dots), 'loops' (windcloth: long loops), 'squeak' (tiny pink
   rings), 'hiss' (a white fan), 'puff' (a trumpet puff ring). The rings are drawn in the world over the scene. The
   last noise in an area is remembered (g.foleyLoud) so the Boom Crabs can follow it. */
const FoleyFX = {
  KINDS: {
    clack: { n: 3, gap: 0.09, life: 0.55, r: 42, col: IVORY, lw: 2.5 },
    thump: { n: 2, gap: 0.22, life: 1.0, r: 90, col: '#d85a70', lw: 5 },
    jag: { n: 2, gap: 0.15, life: 0.7, r: 60, col: '#9ad0e0', lw: 3, jag: true },
    dots: { n: 1, gap: 0, life: 0.8, r: 50, col: '#fff8e0', dots: true },
    loops: { n: 1, gap: 0, life: 1.2, r: 80, col: '#dfe8ff', loops: true },
    squeak: { n: 2, gap: 0.08, life: 0.4, r: 22, col: '#ffb0c8', lw: 2 },
    hiss: { n: 1, gap: 0, life: 0.6, r: 40, col: '#ffffff', hiss: true },
    puff: { n: 1, gap: 0, life: 0.5, r: 26, col: IVORY, lw: 3 },
    clap: { n: 3, gap: 0.07, life: 0.5, r: 34, col: APRI3, lw: 3, jag: true }
  },
  noise(g, x, y, kind, o) {
    if (!g) return; o = o || {};
    const K = this.KINDS[kind] || this.KINDS.clack, L = g.foleyRings || (g.foleyRings = []);
    for (let k = 0; k < K.n; k++) L.push({ x, y, kind, t0: (g.t || 0) + k * K.gap, K, A: g.area, dir: o.dir || 0, scale: o.scale || 1 });
    if (L.length > 60) L.splice(0, L.length - 60);
    if (!o.quiet) g.foleyLoud = { x, y, t: g.t || 0, kind, A: g.area };
  },
  draw(play, ctx) {
    const L = play.foleyRings; if (!L || !L.length) return;
    const now = play.t || 0;
    play.foleyRings = L.filter(q => now - q.t0 < q.K.life && q.A === play.area);
    for (const q of play.foleyRings) {
      const age = now - q.t0; if (age < 0) continue;
      const K = q.K, k = age / K.life, r = (8 + K.r * Math.sqrt(k)) * q.scale, a = (1 - k) * 0.95;
      if (K.dots) { ctx.save(); ctx.fillStyle = K.col; ctx.globalAlpha = a; for (let d = 0; d < 14; d++) { const an = d * 2.4 + q.x * 0.01, rr2 = r * (0.4 + (d % 3) * 0.3); ctx.beginPath(); ctx.arc(q.x + Math.cos(an) * rr2, q.y + Math.sin(an) * rr2 * 0.7, 2.4, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.stroke(); } ctx.restore(); continue; }
      if (K.loops) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = K.col; ctx.lineWidth = 3; ctx.beginPath(); for (let s = 0; s <= 40; s++) { const u = s / 40, xx = q.x + (q.dir || 1) * u * r * 2, yy = q.y + Math.sin(u * TAU * 2 + age * 6) * 14 - u * 10; s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); ctx.restore(); continue; }
      if (K.hiss) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = K.col; ctx.lineWidth = 2; for (let s = -2; s <= 2; s++) { ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x + (q.dir || 1) * r, q.y + s * r * 0.15 - r * 0.2); ctx.stroke(); } ctx.restore(); continue; }
      if (K.jag) {
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = K.col; ctx.lineWidth = K.lw; ctx.beginPath();
        const n = 14; for (let s = 0; s <= n; s++) { const an = s / n * TAU, rr2 = r * (s % 2 ? 1 : 0.78); ctx.lineTo(q.x + Math.cos(an) * rr2, q.y + Math.sin(an) * rr2 * 0.75); }
        ctx.stroke(); ctx.strokeStyle = INK; ctx.globalAlpha = a * 0.5; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); continue;
      }
      FArt.ring(ctx, q.x, q.y, r, a, K.col, K.lw);
    }
  }
};
TourHooks.on('afterEntities', (play, ctx) => FoleyFX.draw(play, ctx));

/* ---------------- floating lines on dark pills ----------------
   Every line is drawn on a dark rounded pill inside the middle band (clear of the top bar, the stick and the
   buttons), off Brady and the boss, stacked so two never overlap. The boss's line (fixed) sits under the boss bar,
   one at a time. */
const fSay = (g, x, y, text, col, key, fixed) => { if (!g) return; const L = g.foleyPills || (g.foleyPills = []); if (key) for (let k = L.length - 1; k >= 0; k--) if (L[k].key === key || (fixed && L[k].fixed)) L.splice(k, 1); L.push({ x, y, text: String(text), col: col || '#ffffff', t0: g.t || 0, key, fixed, A: g.area }); if (L.length > 6) L.shift(); };
const fSayAt = (g, e, text, col) => fSay(g, e.cx, e.y - 12, text, col, e.boss ? 'boss' : e.id || e, !!e.boss);
TourHooks.on('afterEntities', (play, ctx) => {
  const L = play.foleyPills; if (!L || !L.length) return;
  const now = play.t || 0, VW = Game.viewW, VH = Game.viewH, k = Game.gameRect && Game.gameRect.h ? VH / Game.gameRect.h : 1;
  play.foleyPills = L.filter(q => now - q.t0 < 2.2 && (!q.A || q.A === play.area));
  const boxes = [], p = play.player, b = play.boss && !play.boss.remove ? play.boss : null;
  ctx.save(); ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const q of play.foleyPills.slice().reverse()) {
    const age = now - q.t0, w = ctx.measureText(q.text).width + 18, h = 20, a = Math.min(1, (2.2 - age) * 3);
    let x, y;
    if (q.fixed) { x = play.camX + VW / 2; y = play.camY + 112 * k + h / 2; }
    else {
      x = clamp(q.x, play.camX + w / 2 + 8, play.camX + VW - w / 2 - 8); y = q.y - Math.min(age, 0.6) * 18;
      const top = play.camY + 70 * k + h / 2, bot = play.camY + VH * 0.6;
      const hit = (o, pad) => o && x + w / 2 > o.x - pad && x - w / 2 < o.x + o.w + pad && y + h / 2 > o.y - pad && y - h / 2 < o.y + o.h + pad;
      if (hit(b, 4)) y = b.y - h / 2 - 8;
      if (hit(p, 4)) y = p.y - h / 2 - 10;
      y = clamp(y, top, bot);
      for (let n = 0; n < 6 && boxes.some(o => Math.abs(o.x - x) < (o.w + w) / 2 && Math.abs(o.y - y) < h + 2); n++) y = Math.max(top, y - h - 4) === top && n > 2 ? y + h + 4 : y - h - 4;
      boxes.push({ x, y, w });
    }
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(14,8,26,0.86)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(246,236,214,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = q.col; ctx.fillText(q.text, x, y + 1);
  }
  ctx.globalAlpha = 1; ctx.restore();
});

/* ---------------- painted backdrops (scenery only: nothing in them looks like a prop Brady plays) ---------------- */
const painters = {
  // the far sea and a soft headland at the back of Piwi's seaside show
  foleySea(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color || '#4a8aa0'; ctx.fillRect(0, b - 40, BG_W, H - b + 40);
    ctx.fillStyle = shade(L.color || '#4a8aa0', 0.18); for (let x = 0; x < BG_W; x += 90) ctx.fillRect(x + (rng() * 30), b - 30 + rng() * 40, 40, 2);
    ctx.fillStyle = shade(L.color || '#4a8aa0', -0.2); ctx.beginPath(); ctx.moveTo(0, b - 40); ctx.quadraticCurveTo(180, b - 110, 360, b - 40); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(BG_W * 0.55, b - 40); ctx.quadraticCurveTo(BG_W * 0.72, b - 90, BG_W * 0.9, b - 40); ctx.closePath(); ctx.fill();
  },
  // the show's back wall: tall burgundy felt drapes on a dim rail, folds and a scalloped top edge
  foleyDrapes(ctx, L, rng, H) {
    const b = L.base, col = L.color || '#5a1e2e';
    ctx.fillStyle = col; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 36) { ctx.fillStyle = shade(col, x % 72 ? -0.12 : 0.08); ctx.fillRect(x, 0, 18, H); }
    ctx.fillStyle = shade(col, -0.3); ctx.fillRect(0, 0, BG_W, 26);
    for (let x = 0; x < BG_W; x += 48) { ctx.beginPath(); ctx.arc(x + 24, 26, 24, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = shade(col, -0.35); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the dunes and beach grass beyond the boards
  foleyDunes(ctx, L, rng, H) {
    const b = L.base, col = L.color || '#e8c88a';
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 40) ctx.lineTo(x, b - 20 - Math.sin(x * 0.006) * 30 - Math.sin(x * 0.017) * 12);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(col, -0.35); ctx.lineWidth = 2;
    for (let k = 0; k < 40; k++) { const x = rng() * BG_W, y = b - 10 - Math.sin(x * 0.006) * 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y - 12); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 10); ctx.stroke(); }
  },
  // a far pier on stilts (plain posts), dim
  foleyPier(ctx, L, rng, H) {
    const b = L.base, col = L.color || '#6a4a5a';
    ctx.fillStyle = col; ctx.fillRect(0, b - 50, BG_W, 10);
    for (let x = 10; x < BG_W; x += 54) ctx.fillRect(x, b - 40, 6, H - b + 40);
    ctx.fillStyle = shade(col, 0.15); ctx.fillRect(0, b - 52, BG_W, 3);
  },
  // the cliffs with their sea caves (36 tiles of echo: plain arches)
  foleyCliffs(ctx, L, rng, H) {
    const b = L.base, col = L.color || '#8a5a50';
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 60) ctx.lineTo(x, b - 90 - ((x * 7) % 50));
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(col, -0.4); for (let x = 60; x < BG_W; x += 260) { ctx.beginPath(); ctx.moveTo(x, b + 10); ctx.quadraticCurveTo(x + 40, b - 80, x + 80, b + 10); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = shade(col, -0.2); ctx.lineWidth = 2; for (let k = 0; k < 20; k++) { const x = rng() * BG_W, y = b - 60 + rng() * 50; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30, y + 4); ctx.stroke(); }
  },
  // a night recording shack's wall: corrugated, a window of stars, a hanging lamp glow
  foleyShack(ctx, L, rng, H) {
    const b = L.base, col = L.color || '#2a3a48';
    ctx.fillStyle = col; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 16) { ctx.fillStyle = shade(col, x % 32 ? -0.08 : 0.06); ctx.fillRect(x, 0, 8, H); }
    for (const wx of [160, 620, 1060]) { ctx.fillStyle = '#0e1426'; ctx.fillRect(wx, 60, 120, 80); ctx.fillStyle = '#fff6d0'; for (let k = 0; k < 6; k++) ctx.fillRect(wx + 10 + rng() * 100, 66 + rng() * 66, 2, 2); ctx.strokeStyle = shade(col, -0.4); ctx.lineWidth = 6; ctx.strokeRect(wx, 60, 120, 80); ctx.beginPath(); ctx.moveTo(wx + 60, 60); ctx.lineTo(wx + 60, 140); ctx.stroke(); }
    ctx.fillStyle = shade(col, -0.35); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the storm stage: a dark cyclorama with painted cloud flats hung in rows (plain grey shapes, dull)
  foleyCyc(ctx, L, rng, H) {
    const b = L.base, col = L.color || '#3a3450';
    ctx.fillStyle = col; ctx.fillRect(0, 0, BG_W, H);
    for (let k = 0; k < 8; k++) { const x = (k * 170 + 40) % BG_W, y = 50 + (k % 3) * 46; ctx.fillStyle = shade(col, 0.12); ctx.beginPath(); ctx.ellipse(x, y, 70, 22, 0, 0, TAU); ctx.ellipse(x + 40, y - 12, 44, 20, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = shade(col, -0.3); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x, 0); ctx.stroke(); }
    ctx.fillStyle = shade(col, -0.3); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the rooms' back walls: each its own place
  roomCork(ctx, L, rng, H) { ctx.fillStyle = '#6a3a2a'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#7e4a34'; for (let k = 0; k < 60; k++) ctx.fillRect(rng() * BG_W, rng() * H, 3, 3); ctx.fillStyle = '#4a2418'; ctx.fillRect(0, L.base - 40, BG_W, 8); },
  roomBooth(ctx, L, rng, H) { ctx.fillStyle = '#1a1a2a'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#26263a'; for (let x = 0; x < BG_W; x += 40) for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y + 20); ctx.lineTo(x, y + 40); ctx.closePath(); ctx.fill(); } },
  roomNets(ctx, L, rng, H) { ctx.fillStyle = '#3a7a9a'; ctx.fillRect(0, 0, BG_W, H); ctx.strokeStyle = 'rgba(240,220,180,0.25)'; ctx.lineWidth = 2; for (let x = 0; x < BG_W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 60, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 60, 0); ctx.lineTo(x, H); ctx.stroke(); } },
  roomOffice(ctx, L, rng, H) { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#c8b890'; ctx.fillRect(0, L.base - 70, BG_W, 70); ctx.fillStyle = '#2a4a5a'; for (let x = 30; x < BG_W; x += 200) ctx.fillRect(x, 40, 60, 80); },
  roomCabin(ctx, L, rng, H) { ctx.fillStyle = '#5a3a20'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#6a4a2a'; for (let y = 0; y < H; y += 24) ctx.fillRect(0, y, BG_W, 12); for (const x of [200, 560, 920]) { ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.arc(x, 90, 34, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a8aaa'; ctx.beginPath(); ctx.arc(x, 90, 26, 0, TAU); ctx.fill(); } },
  roomSky(ctx, L, rng, H) { const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ffb08a'); gr.addColorStop(1, '#ffe8c0'); ctx.fillStyle = gr; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#f0d098'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= BG_W; x += 40) ctx.lineTo(x, L.base - 30 - Math.sin(x * 0.01) * 24); ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill(); }
};
const SKY = ['#ff9a7a', '#ffc8a0', '#fff0d8'];
const theme = (base, o) => Object.assign({}, STAGE, base || {}, o);
const ROOM = (ground, name, sky, layer, glow) => theme({ ground }, { name, music: 'tour_foley_room', particles: 'none', rays: null, sky, horizonGlow: glow, celestial: { type: 'none' }, stars: 0, layers: [{ kind: layer, base: 400, f: 0.04 }], fog: sky[1], decor: [] });
const themes = {
  foley_look: theme(null, {
    name: 'Made You Look', music: 'tour_foley', particles: 'none', rays: null, sky: SKY, horizonGlow: '#ffe0b0', celestial: { type: 'sun', x: 0.78, y: 0.3, r: 34, color: '#fff2d0', glow: '#ffc890' }, stars: 0,
    layers: [{ kind: 'foleySea', color: '#5a9ab0', base: 300, f: 0.04 }, { kind: 'foleyDunes', color: '#ecd09a', base: 400, f: 0.16 }], fog: '#ffd8b8', decor: ['foleyGrass', 'foleyPost']
  }),
  foley_quiet: theme(null, {
    name: 'The Quiet Cut', music: 'tour_foley_hush', particles: 'none', rays: null, sky: ['#6a4a7a', '#c87a8a', '#ffc8a0'], horizonGlow: '#ffb890', celestial: { type: 'sun', x: 0.2, y: 0.6, r: 40, color: '#ffd8a0', glow: '#ff9a7a' }, stars: 0.05,
    layers: [{ kind: 'foleySea', color: '#4a6a90', base: 310, f: 0.04 }, { kind: 'foleyPier', color: '#5a3a4a', base: 380, f: 0.14 }], fog: '#c87a8a', decor: ['foleyGrass', 'foleyPost']
  }),
  foley_under: theme(null, {
    name: 'Coconut Understudy', music: 'tour_foley', particles: 'none', rays: null, sky: ['#3a1a24', '#5a2430', '#7a3040'], horizonGlow: '#ffb080', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'foleyDrapes', color: '#5a1e2e', base: 380, f: 0.06 }], fog: '#5a2430', decor: ['foleyLamp', 'foleyPost']
  }),
  foley_round: theme(null, {
    name: 'Sound Goes Round', music: 'tour_foley', particles: 'none', rays: null, sky: ['#5ab0d0', '#9ad8e8', '#e8f8ff'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.3, y: 0.2, r: 30, color: '#fffbe0', glow: '#fff0b0' }, stars: 0,
    layers: [{ kind: 'foleySea', color: '#3a8ab0', base: 330, f: 0.04 }, { kind: 'foleyCliffs', color: '#a86a5a', base: 400, f: 0.15 }], fog: '#c8ecf8', decor: ['foleyGrass', 'foleyPost']
  }),
  foley_take: theme(null, {
    name: 'Cut the Take', music: 'tour_foley_hush', particles: 'none', rays: null, sky: ['#0e1426', '#1a2440', '#2a3458'], horizonGlow: '#8aa0d0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'foleyShack', color: '#24384a', base: 380, f: 0.06 }], fog: '#1a2440', decor: ['foleyLamp', 'foleyPost']
  }),
  foley_storm: theme(null, {
    name: 'A Storm of His Own Making', music: 'tour_foley_storm', particles: 'none', rays: null, sky: ['#1a1428', '#2a2240', '#3a3050'], horizonGlow: '#8a7ab0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'foleyCyc', color: '#2e2a44', base: 380, f: 0.05 }, { kind: 'foleyPier', color: '#221a30', base: 420, f: 0.14 }], fog: '#2a2240', decor: ['foleyLamp']
  }),
  foley_arena: theme(null, {
    name: 'Mr. Thunder\'s Stage', music: 'tour_foley_boss', particles: 'none', rays: null, spotlights: true, sky: ['#14101e', '#221a30', '#30243e'], horizonGlow: '#a08ac0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'foleyDrapes', color: '#3e1422', base: 400, f: 0.03 }, { kind: 'foleyCyc', color: '#262036', base: 420, f: 0.1 }], fog: '#221a30', decor: ['foleyLamp']
  }),
  foley_room_cork: ROOM(MAT.cork, 'The Trim Shop', ['#6a3a2a', '#7e4a34', '#8a5a3a'], 'roomCork', '#ffd0a0'),
  foley_room_booth: ROOM(MAT.lacquer, 'The Tin Cupboard', ['#1a1a2a', '#26263a', '#32324a'], 'roomBooth', '#a0a0ff'),
  foley_room_nets: ROOM(MAT.rope, 'The Net Loft', ['#3a7a9a', '#4a8aaa', '#5a9aba'], 'roomNets', '#d0f0ff'),
  foley_room_office: ROOM(MAT.lino, 'The Cue Office', ['#e8dcc0', '#f0e4c8', '#f8ecd0'], 'roomOffice', '#ffffff'),
  foley_room_cabin: ROOM(MAT.teak, 'The Record Cabin', ['#5a3a20', '#6a4a2a', '#7a5a34'], 'roomCabin', '#ffe0a0'),
  foley_room_sky: ROOM(MAT.dune, 'Rain for One', ['#ffb08a', '#ffd0a8', '#ffe8c0'], 'roomSky', '#fff0d0')
};

/* ---------------- props (Decor: drawn each frame, plain shapes, none of them a prop Brady plays) ---------------- */
const decor = {
  foleyGrass(ctx, x, y, t) { ctx.save(); ctx.strokeStyle = '#7a8a3a'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 3, y); ctx.quadraticCurveTo(x + k * 5, y - 10, x + k * 7 + Math.sin(t * 1.5 + k) * 2, y - 18 - (k % 2) * 4); ctx.stroke(); } ctx.restore(); },
  // a mooring post with a coil of rope
  foleyPost(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = WOOD; rr(ctx, x - 6, y - 34, 12, 34, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8d8b0'; ctx.beginPath(); ctx.ellipse(x, y - 14, 10, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y - 19, 9, 3.5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); },
  // a show lamp on a stand
  foleyLamp(ctx, x, y, t) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 2, y - 48, 4, 48); ctx.strokeRect(x - 2, y - 48, 4, 48); ctx.fillStyle = TIN; ctx.beginPath(); ctx.moveTo(x - 10, y - 46); ctx.lineTo(x + 10, y - 46); ctx.lineTo(x + 7, y - 60); ctx.lineTo(x - 7, y - 60); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff2c0'; ctx.beginPath(); ctx.ellipse(x, y - 46, 8, 3, 0, 0, TAU); ctx.fill(); ctx.restore(); },
  // the land's tell (a hidden way nearby): a thin trickle of sand falling (or puffing up) out of a gap
  foleySand(ctx, x, y, t, th, d) {
    const up = d && d.seed && d.seed % 2;
    ctx.save(); ctx.fillStyle = '#f6d898';
    for (let k = 0; k < 9; k++) { const q = ((t * 0.9 + k / 9) % 1), yy = up ? y - q * 26 : y - 40 + q * 40, xx = x + Math.sin(k * 3 + t) * (up ? q * 6 : 1.5); ctx.globalAlpha = up ? 1 - q : 0.4 + 0.6 * (1 - q * 0.6); ctx.beginPath(); ctx.arc(xx, yy, 1.6, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
};
const decorLights = { foleyLamp: [100, '#fff0c0', -50] };

/* ---------------- door looks: a felt-lined stage door with a brass shell knob ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'foleyDoor' || look === 'foleyHatch') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = TIN2; rr(ctx, x - 22, y - 62, 44, 62, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = look === 'foleyHatch' ? FELT : TIN; rr(ctx, x - 17, y - 57, 34, 57, 4); ctx.fill(); ctx.stroke();
      FArt.shell(ctx, x, y - 30, near ? 8 : 7, BRASS);
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// Clapper Clam: an apricot clam that snaps shut a second after everyone has gone home: it waits, open, while Brady is
// near (a harmless "...?"), then CLAPS one second after he has left (late, with its jagged ripple). Stomp it while it
// gapes; touch it from the side and it nips.
const clamArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  const open = m === 'clap' ? 0 : m === 'wait' ? 0.75 : 0.55 + Math.sin(t * 2) * 0.08;
  ctx.fillStyle = APRI2; ctx.beginPath(); ctx.ellipse(0, -8, 17, 8, 0, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = FELT2; ctx.beginPath(); ctx.ellipse(0, -9, 14, 4 + open * 8, 0, Math.PI, TAU); ctx.fill();
  ctx.save(); ctx.translate(-15, -9); ctx.rotate(-open * 0.7); ctx.fillStyle = APRI; ctx.beginPath(); ctx.ellipse(15, 0, 17, 9, 0, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,50,10,0.5)'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(15 + k * 2, -1); ctx.lineTo(15 + k * 6, -8); ctx.stroke(); }
  ctx.restore();
  if (open > 0.2) { for (const ex of [-5, 5]) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex, -12, 3.2, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + 1, -12, 1.5, 0, TAU); ctx.fill(); } }
  ctx.fillStyle = FELT3; ctx.beginPath(); ctx.arc(-15, -8, 3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
};
const clamThink = (e, dt) => {
  const p = e.g.player, near = p && !p.dead && Math.abs(p.cx - e.cx) < 2.6 * TS && Math.abs(p.cy - e.cy) < 3 * TS;
  e.vx = 0;
  if (e.state === 'clap') { e.mode = 'clap'; e.st -= dt; if (e.st <= 0) { e.state = 'walk'; } return; }
  if (near) { e.mode = 'wait'; if (!e.seen && e.g.onScreen(e)) { fSayAt(e.g, e, '...?', '#ffe0c0'); } e.seen = true; e.late = 1.0; return; }
  e.mode = 'walk';
  if (e.seen) { e.late -= dt; if (e.late <= 0) { e.seen = false; e.state = 'clap'; e.st = 0.7; if (e.g.onScreen(e)) { FoleyFX.noise(e.g, e.cx, e.y + 6, 'clap'); TourKit.sfx('clap', 'kick', { vol: 0.5, pitch: 1.6 }); fSayAt(e.g, e, 'CLAP! (WHERE DID EVERYONE GO?)', '#ffd2a0'); } } }
};
// Hiss Kettle: a petrol-blue kettle on little feet. It builds up (its lid rattles, 0.7 s), hisses a jet of steam
// ahead, then startles itself and claps both handles over its spout: silent and harmless for two seconds
const kettleArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  const shake = m === 'build' ? Math.sin(t * 40) * 1.5 : 0;
  ctx.fillStyle = IVORY; for (const fx of [-8, 6]) { ctx.beginPath(); ctx.ellipse(fx, -3, 5, 3, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = TIN; ctx.beginPath(); ctx.ellipse(shake, -15, 14, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -14); ctx.lineTo(22, -22); ctx.lineTo(23, -18); ctx.lineTo(12, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = TIN3; ctx.beginPath(); ctx.ellipse(shake, -27 - (m === 'build' ? Math.abs(Math.sin(t * 30)) * 3 : 0), 7, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = FELT; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(shake, -24, 10, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const shut = m === 'hush';
  for (const ex of [-5, 3]) { if (shut) { ctx.beginPath(); ctx.moveTo(ex - 3, -17); ctx.lineTo(ex + 3, -15); ctx.stroke(); } else { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex, -16, 3, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + 1, -16, 1.4, 0, TAU); ctx.fill(); } }
  if (shut) { ctx.fillStyle = IVORY; ctx.beginPath(); ctx.ellipse(19, -19, 5, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
const kettleThink = (e, dt) => {
  const p = e.g.player;
  if (e.state === 'build') { e.mode = 'build'; e.vx = 0; e.st -= dt; if (e.st <= 0) { e.state = 'hiss'; e.st = 0.7; if (e.g.onScreen(e)) { FoleyFX.noise(e.g, e.cx + e.dir * 22, e.y + 8, 'hiss', { dir: e.dir }); TourKit.sfx('hiss', 'wind', { vol: 0.4, pitch: 1.6 }); } } return; }
  if (e.state === 'hiss') {
    e.mode = 'hiss'; e.vx = 0; e.st -= dt;
    if (p && !p.dead && e.g.onScreen(e)) { const hx = e.dir > 0 ? e.x + e.w : e.x - 2.2 * TS; if (overlap(p, { x: hx, y: e.y - 6, w: 2.2 * TS, h: e.h })) p.hurt(e); }
    if (Math.random() < 0.5) e.g.burst(e.cx + e.dir * (24 + Math.random() * 40), e.y + 4, 1, '#ffffff', 'dust');
    if (e.st <= 0) { e.state = 'hush'; e.st = 2.0; if (e.g.onScreen(e)) fSayAt(e.g, e, 'EEP! ...SHH.', '#e8f4ff'); }
    return;
  }
  if (e.state === 'hush') { e.mode = 'hush'; e.vx = 0; e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.cool = 1.6; } return; }
  e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed;
  if (e.cool <= 0 && p && !p.dead && Math.abs(p.cy - e.cy) < 2 * TS && Math.abs(p.cx - e.cx) < 6 * TS) { e.dir = sign(p.cx - e.cx) || e.dir; e.state = 'build'; e.st = 0.75; e.vx = 0; }
};
// Rubbersole Ray: a burgundy ray on two big sneakers. It walks quietly; near Brady it tries to tiptoe toward him,
// and every tiptoe SQUEAKS (pink rings, a "SQUEAK" pill): the squeaks are its tell
const rayArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  const tip = m === 'tiptoe', lift = tip ? Math.abs(Math.sin(t * 6)) * 5 : 0, st = Math.sin(t * (tip ? 6 : 10));
  for (const [fx, ph] of [[-8, 0], [8, 1]]) { const up = ph ? Math.max(0, st) : Math.max(0, -st); ctx.fillStyle = '#ffffff'; rr(ctx, fx - 7, -7 - up * 3 - lift, 14, 7, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = TIN; ctx.fillRect(fx - 6, -4 - up * 3 - lift, 12, 2); }
  ctx.fillStyle = FELT; ctx.beginPath(); ctx.moveTo(-22, -16 - lift); ctx.quadraticCurveTo(-10, -30 - lift, 0, -26 - lift); ctx.quadraticCurveTo(10, -30 - lift, 22, -16 - lift); ctx.quadraticCurveTo(10, -8 - lift, 0, -10 - lift); ctx.quadraticCurveTo(-10, -8 - lift, -22, -16 - lift); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = FELT3; for (const [sx, sy] of [[-12, -18], [12, -19], [-4, -22]]) { ctx.beginPath(); ctx.arc(sx, sy - lift, 2, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = FELT2; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-18, -17 - lift); ctx.quadraticCurveTo(-30, -30 - lift, -24, -38 - lift); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  for (const ex of [4, 11]) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex, -19 - lift, 2.8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + 0.8, -19 - lift, 1.3, 0, TAU); ctx.fill(); }
  ctx.restore();
};
const rayThink = (e, dt) => {
  const p = e.g.player, near = p && !p.dead && Math.abs(p.cy - e.cy) < 2 * TS && Math.abs(p.cx - e.cx) < 6 * TS;
  if (near) {
    e.mode = 'tiptoe'; e.dir = sign(p.cx - e.cx) || e.dir; e.vx = e.dir * e.speed * 0.55;
    e.sq = (e.sq || 0) - dt; if (e.sq <= 0) { e.sq = 0.55; if (e.g.onScreen(e)) { FoleyFX.noise(e.g, e.cx, e.y + e.h - 4, 'squeak', { quiet: true }); TourKit.sfx('squeak', 'select', { vol: 0.25, pitch: 2.2 }); if (!e.said) { e.said = true; fSayAt(e.g, e, 'SQUEAK. (SHH!)', '#ffc0d0'); } } }
  } else { e.mode = 'walk'; if (!e.vx || Math.abs(e.vx) < e.speed * 0.9) e.vx = e.dir * e.speed; }
};
// Boom Crab: an apricot crab in a burgundy cap and headphones with a furry boom mic held BACKWARDS. It follows the
// loudest prop in earshot (the last noise: a struck prop, a clap, a squeak); its fluffy mic points the wrong way
const crabArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7; ctx.lineJoin = 'round';
  const run = m === 'chase', st = Math.sin(t * (run ? 18 : 9));
  ctx.strokeStyle = APRI2; ctx.lineWidth = 2.6; for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 6, -8); ctx.lineTo(s * (12 + k * 2), -2 + (k === 1 ? st * 2 * s : 0)); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  ctx.fillStyle = APRI; ctx.beginPath(); ctx.ellipse(0, -12, 12, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = FELT; ctx.beginPath(); ctx.arc(0, -19, 9, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillRect(2, -21, 11, 3);
  ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(-9, -16, 3.2, 0, TAU); ctx.fill();
  for (const ex of [-2, 5]) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex, -14, 2.8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex + 1, -14, 1.3, 0, TAU); ctx.fill(); }
  // the boom pole over its shoulder, the fluffy mic pointing BACK (the wrong way)
  ctx.strokeStyle = WOOD2; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(-18, -34); ctx.stroke();
  ctx.fillStyle = '#efe4cc'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); for (let k = 0; k < 14; k++) { const a = k / 14 * TAU, r = k % 2 ? 7 : 9; ctx.lineTo(-22 + Math.cos(a) * r * 1.2, -37 + Math.sin(a) * r * 0.8); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = APRI; ctx.beginPath(); ctx.arc(10, -8, 4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
};
const crabThink = (e, dt) => {
  const L = e.g.foleyLoud, fresh = L && L.A === e.g.area && (e.g.t - L.t) < 6 && Math.abs(L.x - e.cx) < 12 * TS && Math.abs(L.y - e.cy) < 6 * TS;
  if (fresh && Math.abs(L.x - e.cx) > TS * 0.6) { e.mode = 'chase'; e.dir = sign(L.x - e.cx); e.vx = e.dir * e.speed * 1.9; if (e.heard !== L.t) { e.heard = L.t; if (e.g.onScreen(e)) fSayAt(e.g, e, 'GOT IT! (BACKWARDS)', '#ffe0c0'); } }
  else { e.mode = fresh ? 'idle' : 'walk'; if (fresh) e.vx = 0; else if (!e.vx) e.vx = e.dir * e.speed; }
};
const harmlessWhen = states => cls => { const tp = cls.prototype.touchPlayer; cls.prototype.touchPlayer = function (p) { if (states.indexOf(this.state) >= 0) return; return tp.call(this, p); }; return cls; };
const enemies = {
  foleyClam: { cls: TourEnemy.make({ w: 30, h: 18, speed: 0, think: clamThink, art: clamArt, burst: APRI }), place: 'walk' },
  foleyKettle: { cls: harmlessWhen(['hush'])(TourEnemy.make({ w: 26, h: 28, speed: 1.0, think: kettleThink, art: kettleArt, burst: TIN3 })), place: 'walk' },
  foleyRay: { cls: TourEnemy.make({ w: 38, h: 22, speed: 1.4, think: rayThink, art: rayArt, burst: FELT3 }), place: 'walk' },
  foleyCrab: { cls: TourEnemy.make({ w: 24, h: 22, speed: 1.0, think: crabThink, art: crabArt, burst: APRI }), place: 'walk' }
};

/* ---------------- the route map: a biscuit tin with a crank in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
  ctx.fillStyle = TIN; ctx.beginPath(); ctx.ellipse(x, y + r * 0.25, r * 0.8, r * 0.3, 0, 0, TAU); ctx.fill();
  ctx.fillRect(x - r * 0.8, y - r * 0.2, r * 1.6, r * 0.45);
  ctx.fillStyle = TIN3; ctx.beginPath(); ctx.ellipse(x, y - r * 0.2, r * 0.8, r * 0.3, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = IVORY; ctx.beginPath(); ctx.arc(x, y - r * 0.2, r * 0.22, 0, TAU); ctx.fill();
  FArt.ring(ctx, x, y - r * 0.3, r * (0.9 + 0.2 * Math.sin(t * 3)), 0.6, IVORY, 1.4);
  ctx.restore();
};
TourHooks.on && TourHooks.on('routeDraw', (scene, ctx, layer) => {
  if (layer !== 'under') return;
  const s = Tour.stops.foley; if (!s || !scene.sx) return;
  const st = TourMap.stopState(s); if (st === 'hidden') return;
  const x = scene.sx(s.lon), y = scene.sy(s.lat), r = TourMap.pinR, t = scene.t || 0;
  ctx.save(); ctx.globalAlpha = 0.3 + 0.12 * Math.sin(t * 2); ctx.fillStyle = '#9ad0e0'; ctx.beginPath(); ctx.arc(x, y, r * 2.1, 0, TAU); ctx.fill(); ctx.restore();
});

/* ---------------- the land's map: sprites, the boardwalk coast ---------------- */
Object.assign(TourOWPaint.art, {
  foleyShellSprite(c, r) { FArt.shell(c, 0, 0, r, APRI); },
  foleyTinSprite(c, r) { FArt.propTin(c, 0, r * 0.5, r * 1.6, r); },
  foleyCoconutSprite(c, r) { FArt.coconut(c, -r * 0.5, 0, r * 0.5); FArt.coconut(c, r * 0.5, 0, r * 0.5); },
  foleyTrumpetSprite(c, r) { c.fillStyle = BRASS; c.beginPath(); c.moveTo(-r, -2); c.lineTo(r * 0.3, -3); c.lineTo(r, -r * 0.6); c.lineTo(r, r * 0.6); c.lineTo(r * 0.3, 3); c.lineTo(-r, 2); c.closePath(); c.fill(); c.stroke(); }
});
TourOWLands.coast.foleyBoards = function (c, ow, ring) {
  const L = ow.look, ink = this.INK;
  c.save(); c.translate(0, 12); OWGeo.path(c, ring, true); c.fillStyle = FELT; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
  c.save(); OWGeo.path(c, ring, true); c.clip(); c.fillStyle = 'rgba(150,100,40,0.18)'; for (let k = 0; k < 400; k++) c.fillRect((k * 97) % 1800, (k * 53) % 1400, 3, 2); c.restore();
  OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.8; c.stroke();
};
TourOWScenes.groundPaint.foley = function (c, ow) {
  const R = TourOWPaint.rng('foleyground'), ink = TourOWPaint.INK;
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = 'rgba(246,236,214,0.35)'; c.lineWidth = 3; for (const [x, y] of [[520, 320], [960, 470], [1250, 300]]) for (let k = 1; k < 4; k++) { c.beginPath(); c.ellipse(x, y, 20 * k, 12 * k, 0, 0, TAU); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.25)'; for (let k = 0; k < 30; k++) { c.beginPath(); c.arc(300 + R() * 1000, 200 + R() * 400, 1.5 + R() * 2, 0, TAU); c.fill(); }
  void ink;
};
TourLandscape.looks.foley = ['#2a5a70', '#14303e', TIN, SAND, '#ffffff', APRI, 'foleyTin'];
{
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'foleyTin') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40); ctx.lineWidth = 2; ctx.strokeStyle = ink || INK; ctx.lineJoin = 'round';
    ctx.fillStyle = TIN; ctx.fillRect(-20, -26, 40, 22); ctx.strokeRect(-20, -26, 40, 22);
    ctx.fillStyle = TIN3; ctx.beginPath(); ctx.ellipse(0, -26, 20, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = IVORY; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(k * 8, -12, 3, Math.PI, 0); ctx.fill(); }
    ctx.strokeStyle = accent || FELT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, -15); ctx.lineTo(28, -15); ctx.lineTo(28, -6); ctx.stroke();
    ctx.restore();
  };
}

/* ---------------- music: a beach-show bossa for the stages, a hush for the quiet cuts, a storm march for the
   lead-in, Mr. Thunder's polka, a music box for the rooms ---------------- */
const tracks = {
  tour_foley: {
    bpm: 128, bars: 8, rv: 0.35, sw: 0.1, hx: 0.04,
    ch: 'Dmaj7 Dmaj7 Em7 A7 Dmaj7 Bm7 Em7 A7',
    ld: 'F#6:2 A6:2 C#7:4 B6:4 A6:4 | F#6:8 .:8 | G6:2 B6:2 D7:4 C#7:4 B6:4 | A6:8 E6:8 | F#6:2 A6:2 D7:4 C#7:4 A6:4 | B6:8 F#6:8 | G6:2 B6:2 E7:4 D7:4 B6:4 | C#7:12 A6:4',
    li: 'pluck', lv: 0.13,
    bp: 'r..f..r.r..f..r.', bi: 'pluckb', bv: 0.3,
    ap: '..c..c....c..c..', ai: 'piano', av: 0.05, ao: 58,
    dr: ['k.....k...k.....', '....s.......s...', 'h.hhh.hhh.hhh.hh'], dv: 0.26
  },
  tour_foley_hush: {
    bpm: 96, bars: 8, rv: 0.55, dl: 0.25, hx: 0.03,
    ch: 'Am7 Am7 Dm7 E7 Am7 Fmaj7 Dm7 E7',
    ld: 'E6:6 G6:2 A6:8 | C7:8 B6:8 | A6:6 F6:2 D6:8 | E6:16 | E6:6 G6:2 A6:8 | C7:8 A6:8 | F6:6 A6:2 D7:8 | B6:16',
    li: 'harp', lv: 0.12,
    bp: 'r.......f.......', bi: 'sub', bv: 0.24,
    ap: 'c...c...c...c...', ai: 'harp', av: 0.05, ao: 62,
    dr: ['k...............', '........s.......', '..h...h...h...h.'], dv: 0.12
  },
  tour_foley_storm: {
    bpm: 116, bars: 8, rv: 0.4, hx: 0.06,
    ch: 'Cm Cm Ab Bb Cm Cm Fm G7',
    ld: 'G5:4 C6:4 Eb6:4 G6:4 | F6:4 Eb6:4 D6:8 | C6:4 Eb6:4 Ab6:8 | Bb6:8 F6:8 | G6:4 Eb6:4 C6:4 G5:4 | C6:8 .:8 | F6:4 Ab6:4 C7:8 | B6:12 G6:4',
    li: 'reed', lv: 0.14,
    bp: 'r.r.f.r.r.r.f.r.', bi: 'pluckb', bv: 0.32,
    ap: 'c.c.c.c.c.c.c.c.', ai: 'strings', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s.s.', 'h.h.h.h.h.h.h.h.'], dv: 0.32
  },
  tour_foley_boss: {
    bpm: 140, bars: 8, rv: 0.3, hx: 0.06,
    ch: 'Gm Gm D7 D7 Gm Cm D7 Gm',
    ld: 'D6:2 G6:2 Bb6:2 G6:2 D6:2 G6:2 Bb6:4 | A6:2 F#6:2 D6:4 A6:8 | C7:2 A6:2 F#6:2 A6:2 D7:8 | C7:4 A6:4 F#6:8 | G6:2 Bb6:2 D7:4 Bb6:4 G6:4 | Eb6:4 G6:4 C7:8 | D7:2 C7:2 A6:4 F#6:4 D6:4 | G6:12 .:4',
    li: 'reed', lv: 0.15,
    bp: 'r...f...r...f...', bi: 'pluckb', bv: 0.34,
    ap: '..c...c...c...c.', ai: 'piano', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '..s...s...s...s.', 'hhhhhhhhhhhhhhhh'], dv: 0.34
  },
  tour_foley_room: {
    bpm: 104, bpb: 3, bars: 4, rv: 0.6, dl: 0.25, hx: 0.03,
    ch: 'G Em C D',
    ld: 'B6:3 D7:3 G7:6 | E7:3 G7:3 B6:6 | C7:3 E7:3 G7:6 | F#7:6 D7:6',
    li: 'mbox', lv: 0.13,
    bp: 'r.....r.....', bi: 'sub', bv: 0.2,
    ap: 'c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 66,
    dr: ['k...........', '............', '....h.....h.'], dv: 0.1
  }
};

Tour.country({
  id: 'foley', secret: true, bonus: true, colors: COL, tagline: 'A hidden land: the noises behind Piwi\'s seaside show, every one with a face',
  themes, painters, decor, decorLights, enemies, tracks,
  music: { level: 'tour_foley', boss: 'tour_foley_boss', map: null },
  landmark: 'the biscuit tin', emblem,
  arrival: 'Brady! Behind Piwi\'s seaside show the coconuts are paid more than the horse. The weather is a sheet of tin and it has a dressing room. Turn your sound off, you can still SEE every noise. ♥ C',
  // (not shells: the nosy flock is shells) little brass finger cymbals
  coin: { name: 'CYMBALS', draw(ctx, x, y) { ctx.fillStyle = '#b8862a'; ctx.beginPath(); ctx.ellipse(x, y + 1, 8, 7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = BRASS; ctx.beginPath(); ctx.ellipse(x, y, 7.5, 6.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff2a0'; ctx.beginPath(); ctx.ellipse(x - 2, y - 2, 3, 2, -0.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#8a5a18'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill(); } },
  levels: []
});
// for the other foley files and the tests
Tour.foleyKit = { say: fSay, sayAt: fSayAt, bossLine: (g, text, col) => fSay(g, 0, 0, text, col, 'boss', true), FX: FoleyFX, FArt, COL, INK, APRI, APRI2, APRI3, TIN, TIN2, TIN3, IVORY, IVORY2, FELT, FELT2, FELT3, SAND, SAND2, BRASS, WOOD, WOOD2, MAT };
})();
