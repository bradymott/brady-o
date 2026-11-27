/* ============================================================
   TABLE FOR TWO (world 36, cc 'table'): a hidden land (docs/handoff/HIDDEN_LAND_BRIEF.md, ChatGPT's A11).
   "Chinka-O booked one quiet table. Piwi gave the cutlery speaking parts." Brady is pocket-sized on a candlelit
   restaurant table: tomato-red gingham, ivory china, olive-green ovals, midnight-blue forks.
   Found only through Spain 6-1 (La Tomatina): drop from the café awning through the shadow of the reserved table,
   whose shadow shows two joined hands (29_tour_y_table_e_entry.js).
   This file: the route stop, the looks (tiles, themes, painted backdrops, props), the critters (Crumb Butler,
   Pepper Flea, Knife Rest, Butter Curl), the route-map emblem, the map's sprites, the music and the country.
   The mechanics (the good china, the napkins, the tablecloth, the crouton rafts, the bread plate): _a_mech.js.
   The boss (Madame Manners): _b_boss.js. The secret rooms: _c_rooms.js. The levels and the map: _d_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'table', world: 36, name: 'Table for Two', sub: 'a hidden land', lon: -12.5, lat: 38.2, secret: true, bonus: true, d0: 0.8, pin: 'table' });
const COL = { a: '#e0403a', b: '#1e2a5a', c: '#f6efdc' };
const INK = '#1a1426';
const RED = '#e0403a', RED2 = '#b82a26', IVORY = '#f6efdc', IVORY2 = '#e4d8bc', OLIVE = '#7d8a2a', OLIVE2 = '#5a6418', NAVY = '#1e2a5a', NAVY2 = '#2e3e7e', WOOD = '#8a5230', WOOD2 = '#5e341c', GOLD = '#f2c23a';

/* ---------------- tiles ---------------- */
// the table top: a cream cloth edge over tomato-red gingham hanging down the front
const gingham = (ctx, x0, y0, w, h, cell, a) => {
  ctx.fillStyle = '#fbf3e4'; ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = `rgba(224,64,58,${a || 0.55})`;
  for (let x = x0; x < x0 + w; x += cell * 2) ctx.fillRect(x, y0, cell, h);
  for (let y = y0; y < y0 + h; y += cell * 2) ctx.fillRect(x0, y, w, cell);
};
const clothGround = {
  style: 'cloth', cap: IVORY, capHi: '#ffffff', dirt: '#e8a090', dirt2: RED, rock: RED2,
  paint(ctx) { gingham(ctx, 0, 0, TS, TS, 8); ctx.fillStyle = 'rgba(120,20,20,0.08)'; ctx.fillRect(0, TS - 4, TS, 4); },
  paintCap(ctx, x0, x1) {
    gingham(ctx, x0, 0, x1 - x0, 12, 8, 0.6);
    ctx.fillStyle = '#c8b898'; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = IVORY; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, 0, x1 - x0, 1.6);
    // a faint woven thread line along the top
    ctx.fillStyle = 'rgba(200,170,130,0.45)'; for (let x = x0 + 3; x < x1; x += 6) ctx.fillRect(x, 3.5, 3, 1);
    ctx.fillStyle = INK; ctx.fillRect(x0, 6, x1 - x0, 1.2);
  }
};
// a chipped china plate rim (the one-way platforms): ivory, a midnight-blue band, a bite out of it now and then
const chinaSemi = {
  style: 'china', c1: IVORY, c2: NAVY,
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = IVORY2; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.lineTo(x1 - 3, 11); ctx.lineTo(x0 + 3, 11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = IVORY; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, 0, x1 - x0, 1.5);
    ctx.fillStyle = NAVY; ctx.fillRect(x0, 6.5, x1 - x0, 2.2);
    ctx.fillStyle = INK; ctx.fillRect(x0 + 2, 10.5, x1 - x0 - 4, 1.5);
  }
};
// sugar cubes (bricks)
const sugarBrick = {
  style: 'sugar', c1: '#ffffff', c2: '#d8d0e0', mortar: '#b8aec8',
  paint(ctx, rng) {
    ctx.fillStyle = '#c8c0d4'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#fbf8ff'; rr(ctx, 1.5, 1.5, TS - 3, TS - 3, 3); ctx.fill();
    ctx.fillStyle = '#e8e2f0'; ctx.fillRect(4, TS - 8, TS - 8, 4); ctx.fillRect(TS - 8, 4, 4, TS - 8);
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) ctx.fillRect(4 + ((k * 7) % 20), 4 + ((k * 11) % 20), 2, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; rr(ctx, 1.5, 1.5, TS - 3, TS - 3, 3); ctx.stroke();
  }
};
// walnut (the table's apron, its legs, the walls of the booth)
const walnutHard = {
  c1: '#9a6038', c2: WOOD2,
  paint(ctx) {
    ctx.fillStyle = WOOD; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#9a6038'; ctx.fillRect(0, 2, TS, 5); ctx.fillRect(0, 17, TS, 4);
    ctx.fillStyle = '#6e3e22'; ctx.fillRect(0, 11, TS, 2); ctx.fillRect(0, 26, TS, 2);
    ctx.strokeStyle = '#6e3e22'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(20, 14, 5, 2.5, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(0.6, 0.6, TS - 1.2, TS - 1.2);
  }
};

// the secret rooms' own floors and walls (each room is its own place): baize, parquet, slate, ship's deck, terracotta
const roomGround = (name, body, cap, capHi, line, pat) => ({
  style: name, cap, capHi, dirt: body, dirt2: shade(body, -0.15), rock: shade(body, -0.3),
  paint(ctx, rng) { ctx.fillStyle = body; ctx.fillRect(0, 0, TS, TS); pat(ctx, rng); },
  paintCap(ctx, x0, x1) { ctx.fillStyle = shade(cap, -0.25); ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = cap; ctx.fillRect(x0, 0, x1 - x0, 7); ctx.fillStyle = capHi; ctx.fillRect(x0, 0, x1 - x0, 1.6); ctx.fillStyle = line; ctx.fillRect(x0, 9, x1 - x0, 1.4); }
});
const MAT = {
  baize: roomGround('baize', '#2a6a44', '#c89a4a', '#ffe8a0', INK, ctx => { ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let k = 0; k < 6; k++) ctx.fillRect((k * 11) % 30, (k * 7) % 30, 2, 2); }),
  parquet: roomGround('parquet', '#a8703a', '#d8a868', '#fff0c8', INK, ctx => { ctx.fillStyle = '#8a5a2a'; for (let y = 0; y < TS; y += 8) ctx.fillRect(0, y, TS, 1.5); for (let y = 0; y < TS; y += 8) ctx.fillRect((y * 2) % 24 + 4, y, 1.5, 8); }),
  slate: roomGround('slate', '#3a3a5e', '#8a8ab8', '#d8d8ff', INK, ctx => { ctx.strokeStyle = '#2a2a48'; ctx.lineWidth = 1.5; ctx.strokeRect(1, 1, TS - 2, TS - 2); ctx.fillStyle = '#ffe8a0'; ctx.fillRect(20, 9, 1.5, 1.5); }),
  deck: roomGround('deck', '#9a6a3a', '#c8945a', '#ffe0b0', INK, ctx => { ctx.fillStyle = '#6a4220'; ctx.fillRect(0, 0, TS, 1.5); ctx.fillRect(0, 16, TS, 1.5); ctx.fillStyle = '#c8a050'; ctx.fillRect(4, 6, 2, 2); ctx.fillRect(24, 22, 2, 2); }),
  terra: roomGround('terra', '#c8643a', '#e8946a', '#ffd8c0', INK, ctx => { ctx.strokeStyle = '#f2d8b8'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, TS - 2, TS - 2); ctx.fillStyle = '#b8542a'; ctx.fillRect(6, 6, 20, 20); })
};
const LINEN = { ground: clothGround, semi: chinaSemi, brick: sugarBrick, hard: walnutHard, pillar: { c1: IVORY, c2: '#c8b898', cap: GOLD, style: 'column' }, accent: RED, tint: {}, bloom: 0.2, liquid: null };

/* ---------------- shared drawings ---------------- */
const TabArt = {
  // a plate seen at a slight angle: rim ellipse, well, blue band; chip: [a0, a1] radians bitten out of the rim
  plate(ctx, x, y, rx, ry, o) {
    o = o || {};
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = 'rgba(40,20,30,0.18)'; ctx.beginPath(); ctx.ellipse(x + 3, y + ry * 0.45, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = IVORY; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = o.band || NAVY; ctx.lineWidth = Math.max(1.5, ry * 0.12); ctx.beginPath(); ctx.ellipse(x, y, rx * 0.86, ry * 0.8, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = IVORY2; ctx.beginPath(); ctx.ellipse(x, y + ry * 0.05, rx * 0.62, ry * 0.56, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(x - rx * 0.4, y - ry * 0.45, rx * 0.25, ry * 0.12, -0.2, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a midnight-blue fork, tines up, h tall (spread 0..1 opens the tines, curl curls one tine)
  fork(ctx, x, y, h, o) {
    o = o || {}; const w = h * 0.16, sp = o.spread || 0;
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = o.col || NAVY;
    rr(ctx, -w * 0.35, -h * 0.55, w * 0.7, h * 0.55, w * 0.3); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w, -h * 0.72); ctx.quadraticCurveTo(-w, -h * 0.55, 0, -h * 0.54); ctx.quadraticCurveTo(w, -h * 0.55, w, -h * 0.72); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let k = 0; k < 4; k++) { const tx = -w + w * 0.15 + k * (w * 1.7 / 3), a = (k - 1.5) * 0.12 * sp; ctx.save(); ctx.translate(tx, -h * 0.72); ctx.rotate(a); ctx.fillRect(-w * 0.12, -h * 0.28, w * 0.24, h * 0.29); ctx.strokeRect(-w * 0.12, -h * 0.28, w * 0.24, h * 0.29); ctx.restore(); }
    ctx.restore();
  },
  // a wine glass (empty, ivory-white glass with a highlight)
  glass(ctx, x, y, h) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillStyle = 'rgba(220,240,255,0.45)';
    ctx.beginPath(); ctx.ellipse(x, y - 1, h * 0.22, h * 0.05, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillRect(x - 1.5, y - h * 0.5, 3, h * 0.5); ctx.strokeRect(x - 1.5, y - h * 0.5, 3, h * 0.5);
    ctx.beginPath(); ctx.moveTo(x - h * 0.22, y - h); ctx.quadraticCurveTo(x - h * 0.24, y - h * 0.5, x, y - h * 0.5); ctx.quadraticCurveTo(x + h * 0.24, y - h * 0.5, x + h * 0.22, y - h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - h * 0.13, y - h * 0.92); ctx.lineTo(x - h * 0.12, y - h * 0.66); ctx.stroke();
    ctx.restore();
  },
  // a candle in a little brass holder, flame flickering
  candle(ctx, x, y, h, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.fillStyle = GOLD; ctx.beginPath(); ctx.ellipse(x, y - 2, 9, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff6e0'; ctx.fillRect(x - 4, y - h, 8, h - 2); ctx.strokeRect(x - 4, y - h, 8, h - 2);
    const f = Math.sin(t * 9) * 0.8 + Math.sin(t * 23) * 0.4;
    ctx.fillStyle = 'rgba(255,220,120,0.35)'; ctx.beginPath(); ctx.arc(x, y - h - 6, 11, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffb83a'; ctx.beginPath(); ctx.moveTo(x, y - h - 14 - f); ctx.quadraticCurveTo(x + 5, y - h - 4, x, y - h); ctx.quadraticCurveTo(x - 5, y - h - 4, x, y - h - 14 - f); ctx.fill();
    ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.ellipse(x, y - h - 4, 1.8, 3.5, 0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a heart (the land's little emblem)
  heart(ctx, x, y, r, col) { ctx.save(); ctx.fillStyle = col || RED; ctx.beginPath(); ctx.moveTo(x, y + r); ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4); ctx.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r); ctx.fill(); ctx.restore(); },
  // an olive (olive-green oval with a red pimento)
  olive(ctx, x, y, r) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillStyle = OLIVE; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.78, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = RED; ctx.beginPath(); ctx.ellipse(x + r * 0.45, y - r * 0.1, r * 0.3, r * 0.26, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.35, r * 0.25, r * 0.12, -0.4, 0, TAU); ctx.fill(); ctx.restore();
  },
  // the shadow of two joined hands (the entrance's clue, and the land's emblem): two forearms meeting in the middle,
  // the fingers laced together, the thumbs crossed over the top. About 64 x 34 at s = 1
  hands(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col || 'rgba(30,14,20,0.42)';
    for (const d of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(d * 34, 10); ctx.lineTo(d * 12, 2); ctx.quadraticCurveTo(d * 8, -8, d * 14, -12); ctx.lineTo(d * 34, -1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(d * 8, -4, 9, 10, d * 0.3, 0, TAU); ctx.fill();
    }
    // the laced fingers: a row of knuckles across the top, alternating sides
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(-6 + k * 4, -14 + (k % 2) * 2, 2.6, 4.2, (k % 2 ? 0.4 : -0.4), 0, TAU); ctx.fill(); }
    // the two thumbs crossed
    ctx.beginPath(); ctx.ellipse(-3, -15, 2.2, 5, 0.9, 0, TAU); ctx.ellipse(3, -15, 2.2, 5, -0.9, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a wisp of steam curling up (the land's tell for a hidden way: something warm is through there)
  steam(ctx, x, y, t, a) {
    ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${0.55 * (a == null ? 1 : a)})`; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      const ph = (t * 0.6 + k * 0.5) % 1, yy = y - ph * 34, al = Math.sin(ph * Math.PI);
      ctx.globalAlpha = al; ctx.beginPath(); ctx.moveTo(x + k * 5, yy);
      ctx.bezierCurveTo(x + k * 5 + 7, yy - 6, x + k * 5 - 7, yy - 12, x + k * 5, yy - 18); ctx.stroke();
    }
    ctx.restore();
  }
};


/* ---------------- floating lines on dark pills ----------------
   Every line the land's critters, props and boss say is drawn on a dark rounded pill, kept inside the middle band of
   the view (clear of the HUD at the top and the stick and buttons at the bottom), moved off Brady and the boss, and
   stacked so two never overlap. */
const tabSay = (g, x, y, text, col) => { if (!g) return; (g.tabPills || (g.tabPills = [])).push({ x, y, text: String(text), col: col || '#ffffff', t0: g.t || 0 }); if (g.tabPills.length > 6) g.tabPills.shift(); };
const tabSayAt = (g, e, text, col) => tabSay(g, e.cx, e.y - 12, text, col);
TourHooks.on('afterEntities', (play, ctx) => {
  const L = play.tabPills; if (!L || !L.length) return;
  const now = play.t || 0, VW = Game.viewW, VH = Game.viewH, k = Game.gameRect && Game.gameRect.h ? VH / Game.gameRect.h : 1;
  play.tabPills = L.filter(q => now - q.t0 < 2.2);
  const boxes = [], p = play.player, b = play.boss && !play.boss.remove ? play.boss : null;
  ctx.save(); ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const q of play.tabPills.slice().reverse()) {
    const age = now - q.t0, w = ctx.measureText(q.text).width + 18, h = 20;
    let x = clamp(q.x, play.camX + w / 2 + 8, play.camX + VW - w / 2 - 8), y = q.y - Math.min(age, 0.6) * 18;
    const top = play.camY + 70 * k + h / 2, bot = play.camY + VH * 0.6;
    const hit = (o, pad) => o && x + w / 2 > o.x - pad && x - w / 2 < o.x + o.w + pad && y + h / 2 > o.y - pad && y - h / 2 < o.y + o.h + pad;
    if (hit(b, 4)) y = b.y - h / 2 - 8;
    if (hit(p, 4)) y = p.y - h / 2 - 10;
    y = clamp(y, top, bot);
    for (let n = 0; n < 6 && boxes.some(o => Math.abs(o.x - x) < (o.w + w) / 2 && Math.abs(o.y - y) < h + 2); n++) y = Math.max(top, y - h - 4) === top && n > 2 ? y + h + 4 : y - h - 4;
    boxes.push({ x, y, w });
    const a = Math.min(1, (2.2 - age) * 3);
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(14,8,26,0.84)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,216,140,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = q.col; ctx.fillText(q.text, x, y + 1);
  }
  ctx.restore();
});

/* ---------------- painted backdrops ---------------- */
const painters = {
  // the restaurant's wall: deep red damask stripes, a dark wainscot, gilt frames (Piwi's portrait in one), sconces
  tabWall(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color || '#7a2a2e'; ctx.fillRect(0, 0, BG_W, b);
    ctx.fillStyle = shade(L.color || '#7a2a2e', -0.12); for (let x = 0; x < BG_W; x += 64) ctx.fillRect(x, 0, 26, b);
    ctx.fillStyle = shade(L.color || '#7a2a2e', 0.1);
    for (let x = 32; x < BG_W; x += 64) for (let y = 30; y < b - 60; y += 70) { ctx.beginPath(); ctx.moveTo(x + 13, y); ctx.quadraticCurveTo(x + 24, y + 14, x + 13, y + 28); ctx.quadraticCurveTo(x + 2, y + 14, x + 13, y); ctx.fill(); }
    ctx.fillStyle = '#3a1e16'; ctx.fillRect(0, b - 60, BG_W, H - b + 60);
    ctx.fillStyle = '#4e2a1e'; for (let x = 10; x < BG_W; x += 128) ctx.fillRect(x, b - 52, 108, 40);
    ctx.fillStyle = '#c89a4a'; ctx.fillRect(0, b - 62, BG_W, 4);
    // frames: a still life, a Piwi portrait, a landscape of hills (no buildings)
    const frame = (x, y, w, h, fn) => { ctx.fillStyle = '#b8862a'; ctx.fillRect(x - 6, y - 6, w + 12, h + 12); ctx.fillStyle = '#e8c060'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); fn(); ctx.restore(); };
    frame(120, 60, 90, 70, () => { ctx.fillStyle = '#2a3a2a'; ctx.fillRect(120, 60, 90, 70); ctx.fillStyle = '#e8a040'; ctx.beginPath(); ctx.arc(150, 110, 14, 0, TAU); ctx.fill(); ctx.fillStyle = OLIVE; ctx.beginPath(); ctx.ellipse(180, 112, 11, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(166, 100, 8, 0, TAU); ctx.fill(); });
    frame(470, 50, 70, 90, () => { ctx.fillStyle = '#2a4a5a'; ctx.fillRect(470, 50, 70, 90); if (typeof Piwi !== 'undefined') { try { Piwi.head(ctx, 505, 98, 2.2, 0, { look: 0 }); } catch (e) { /* the portrait stays blank */ } } });
    frame(780, 64, 120, 66, () => { ctx.fillStyle = '#9ac8e8'; ctx.fillRect(780, 64, 120, 66); ctx.fillStyle = '#7aa84a'; ctx.beginPath(); ctx.ellipse(820, 140, 70, 34, 0, 0, TAU); ctx.ellipse(880, 146, 60, 30, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(870, 84, 9, 0, TAU); ctx.fill(); });
    // sconces with a warm glow
    for (const sx of [330, 680, 980]) {
      const g = ctx.createRadialGradient(sx, 110, 4, sx, 110, 80); g.addColorStop(0, 'rgba(255,220,140,0.45)'); g.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = g; ctx.fillRect(sx - 80, 30, 160, 160);
      ctx.fillStyle = '#c89a4a'; ctx.fillRect(sx - 3, 112, 6, 26); ctx.fillStyle = '#fff2c8'; ctx.beginPath(); ctx.moveTo(sx - 12, 112); ctx.lineTo(sx + 12, 112); ctx.lineTo(sx + 7, 92); ctx.lineTo(sx - 7, 92); ctx.closePath(); ctx.fill();
    }
  },
  // the near layer: giant cutlery, bottles and candlesticks standing on the far end of the table, in dusk tones
  tabGiants(ctx, L, rng, H) {
    const b = L.base, c = L.color || '#3a2030';
    ctx.fillStyle = c;
    for (let x = 30 + rng() * 40; x < BG_W - 40; x += 90 + rng() * 90) {
      const k = Math.floor(rng() * 4), h = 120 + rng() * 90;
      wrapDraw(x - 40, 80, X => {
        const cx = X + 40;
        if (k === 0) { ctx.fillRect(cx - 5, b - h, 10, h); for (let q = 0; q < 4; q++) ctx.fillRect(cx - 14 + q * 8, b - h - 34, 5, 36); ctx.fillRect(cx - 14, b - h - 2, 29, 8); }
        else if (k === 1) { ctx.beginPath(); ctx.moveTo(cx - 6, b); ctx.lineTo(cx - 6, b - h * 0.55); ctx.quadraticCurveTo(cx - 14, b - h, cx, b - h - 10); ctx.quadraticCurveTo(cx + 6, b - h * 0.5, cx + 6, b); ctx.closePath(); ctx.fill(); }
        else if (k === 2) { rr(ctx, cx - 18, b - h * 0.8, 36, h * 0.8, 10); ctx.fill(); ctx.fillRect(cx - 6, b - h * 0.8 - 40, 12, 44); }
        else { ctx.fillRect(cx - 3, b - h * 0.7, 6, h * 0.7); ctx.beginPath(); ctx.ellipse(cx, b - 3, 20, 5, 0, 0, TAU); ctx.fill(); ctx.fillRect(cx - 7, b - h * 0.7 - 30, 14, 30); ctx.fillStyle = 'rgba(255,210,120,0.55)'; ctx.beginPath(); ctx.arc(cx, b - h * 0.7 - 42, 9, 0, TAU); ctx.fill(); ctx.fillStyle = c; }
      });
    }
    // the far edge of the table: the cloth runs off to a horizon of gingham
    ctx.fillStyle = shade(c, 0.5); ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = 'rgba(224,64,58,0.25)'; for (let x = 0; x < BG_W; x += 40) ctx.fillRect(x, b, 20, H - b);
  },
  // 36-1: the china cabinet behind: shelves of plates standing on edge, cups on hooks
  tabCabinet(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#4a2a1e'; ctx.fillRect(0, 20, BG_W, b - 20);
    ctx.fillStyle = '#2e1810'; for (let y = 20; y < b; y += 90) ctx.fillRect(0, y + 78, BG_W, 12);
    for (let y = 20; y < b - 40; y += 90) for (let x = 20 + (y / 90 % 2) * 30; x < BG_W; x += 64) {
      ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.ellipse(x, y + 46, 26, 30, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = (x / 64 | 0) % 3 ? '#3a4a8a' : '#a83a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y + 46, 20, 24, 0, 0, TAU); ctx.stroke();
    }
    ctx.fillStyle = '#2e1810'; for (let x = 0; x < BG_W; x += 256) ctx.fillRect(x, 0, 14, b);
  },
  // 36-2: folded napkins on the far tables (peaks and fans)
  tabNapkins(ctx, L, rng, H) {
    const b = L.base;
    for (let x = 20; x < BG_W; x += 70 + rng() * 50) {
      const h = 50 + rng() * 60, w = 34 + rng() * 20, col = rng() < 0.3 ? '#f2d0c8' : '#fbf5e8';
      wrapDraw(x - w, w * 2, X => { const cx = X + w; ctx.fillStyle = shade(col, -0.25); ctx.beginPath(); ctx.moveTo(cx - w, b); ctx.lineTo(cx, b - h); ctx.lineTo(cx + w, b); ctx.closePath(); ctx.fill(); ctx.fillStyle = shade(col, -0.12); ctx.beginPath(); ctx.moveTo(cx - w * 0.3, b); ctx.lineTo(cx, b - h); ctx.lineTo(cx + w, b); ctx.closePath(); ctx.fill(); });
    }
    ctx.fillStyle = L.color || '#c8a890'; ctx.fillRect(0, b, BG_W, H - b);
  },
  // 36-3: a long banquet table running away into the room, chandeliers over it
  tabBanquet(ctx, L, rng, H) {
    const b = L.base;
    for (const cx of [180, 560, 900]) {
      ctx.strokeStyle = 'rgba(60,30,20,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, 50); ctx.stroke();
      ctx.fillStyle = '#c89a4a'; ctx.beginPath(); ctx.ellipse(cx, 60, 60, 12, 0, 0, TAU); ctx.fill();
      for (let k = -2; k <= 2; k++) { ctx.fillStyle = '#fff6e0'; ctx.fillRect(cx + k * 24 - 3, 34, 6, 20); ctx.fillStyle = 'rgba(255,220,130,0.5)'; ctx.beginPath(); ctx.arc(cx + k * 24, 28, 9, 0, TAU); ctx.fill(); }
    }
    ctx.fillStyle = '#e8d8c0'; ctx.beginPath(); ctx.moveTo(0, b); ctx.lineTo(BG_W, b); ctx.lineTo(BG_W, b - 30); ctx.lineTo(0, b - 30); ctx.fill();
    for (let x = 30; x < BG_W; x += 80) { ctx.fillStyle = '#fbf5e8'; ctx.beginPath(); ctx.ellipse(x, b - 20, 22, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(30,42,90,0.6)'; ctx.fillRect(x + 26, b - 40, 3, 24); ctx.fillStyle = 'rgba(220,240,255,0.5)'; ctx.fillRect(x - 34, b - 46, 8, 22); }
    ctx.fillStyle = L.color || '#5a2a26'; ctx.fillRect(0, b, BG_W, H - b);
  },
  // 36-4: the rims of great soup bowls and their steam
  tabBowls(ctx, L, rng, H) {
    const b = L.base;
    for (let x = 60; x < BG_W; x += 200 + rng() * 80) {
      const r = 80 + rng() * 40;
      wrapDraw(x - r, r * 2, X => {
        const cx = X + r;
        ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.ellipse(cx, b - 10, r, r * 0.3, 0, 0, Math.PI); ctx.lineTo(cx - r, b - 10); ctx.fill();
        ctx.fillStyle = '#c8783a'; ctx.beginPath(); ctx.ellipse(cx, b - 10, r * 0.92, r * 0.22, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#3a4a8a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, b - 10, r, r * 0.27, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 30, b - 30); ctx.bezierCurveTo(cx + k * 30 + 20, b - 60, cx + k * 30 - 20, b - 90, cx + k * 30, b - 130); ctx.stroke(); }
      });
    }
    ctx.fillStyle = L.color || '#7a3a22'; ctx.fillRect(0, b, BG_W, H - b);
  },
  // 36-5 and the boss: the dessert end of the table: cake stands, a candelabra, the sugar bowl
  tabDessert(ctx, L, rng, H) {
    const b = L.base;
    for (const [x, h] of [[120, 110], [430, 150], [760, 120], [980, 90]]) {
      ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x - 4, b - h, 8, h); ctx.beginPath(); ctx.ellipse(x, b - h, 60, 10, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f4b8c8'; rr(ctx, x - 40, b - h - 50, 80, 50, 10); ctx.fill(); ctx.fillStyle = '#fbf5e8'; ctx.fillRect(x - 40, b - h - 50, 80, 10);
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x, b - h - 58, 8, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = L.color || '#4a1e26'; ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = 'rgba(224,64,58,0.2)'; for (let x = 0; x < BG_W; x += 40) ctx.fillRect(x, b, 20, H - b);
  },
  // the booth (the boss): a velvet booth back, the sugar bowl with Chinka-O's live postcard against it
  tabBooth(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#6a1a26'; ctx.fillRect(0, 170, BG_W, b - 170);
    ctx.fillStyle = '#7e2430'; for (let x = 0; x < BG_W; x += 80) { rr(ctx, x + 6, 186, 68, b - 210, 24); ctx.fill(); }
    ctx.fillStyle = '#4a1018'; for (let x = 0; x < BG_W; x += 80) for (let y = 220; y < b - 30; y += 50) { ctx.beginPath(); ctx.arc(x + 40, y, 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#3a1e16'; ctx.fillRect(0, 160, BG_W, 16);
    ctx.fillStyle = L.color || '#4a1e26'; ctx.fillRect(0, b, BG_W, H - b);
  },

  /* ---------- the secret rooms' own places ---------- */
  // B51: the silver drawer: green baize, a rack of spoons, a velvet lining
  roomDrawer(ctx, L, rng, H) {
    ctx.fillStyle = '#1e4a32'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#2a5a3e'; for (let x = 0; x < BG_W; x += 90) ctx.fillRect(x, 0, 6, H);
    ctx.fillStyle = '#5e341c'; ctx.fillRect(0, 0, BG_W, 36); ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.strokeStyle = '#c8ccd8'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let x = 30; x < BG_W; x += 46) { ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, 150); ctx.stroke(); ctx.fillStyle = '#d8dce8'; ctx.beginPath(); ctx.ellipse(x, 52, 9, 13, 0, 0, TAU); ctx.fill(); }
  },
  // B52: the cloakroom: tags on hooks, a counter
  roomCloak(ctx, L, rng, H) {
    ctx.fillStyle = '#c8a878'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#b8966a'; for (let y = 0; y < H; y += 24) ctx.fillRect(0, y, BG_W, 2);
    ctx.fillStyle = '#5e341c'; ctx.fillRect(0, 70, BG_W, 8);
    for (let x = 40; x < BG_W; x += 60) { ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 2, 78, 4, 12); ctx.fillStyle = k2(x) ? '#f6efdc' : '#f2d0c8'; ctx.beginPath(); ctx.moveTo(x - 10, 90); ctx.lineTo(x + 10, 90); ctx.lineTo(x + 10, 120); ctx.lineTo(x - 10, 120); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(x, 96, 2.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#6a3e22'; ctx.fillRect(0, L.base - 20, BG_W, H);
    function k2(x) { return (x / 60 | 0) % 2; }
  },
  // B53: under the skylight: night sky in a round window
  roomSkylight(ctx, L, rng, H) {
    ctx.fillStyle = '#2a1e3a'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#3a2a4e'; for (let x = 0; x < BG_W; x += 128) ctx.fillRect(x, 0, 10, H);
    ctx.fillStyle = '#4a3a5e'; ctx.fillRect(0, L.base, BG_W, H - L.base);
  },
  // B54: the captain's table by the window: brass, a porthole of sea, ropes
  roomScope(ctx, L, rng, H) {
    ctx.fillStyle = '#2a5a7a'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#3a6a8a'; for (let y = 0; y < H; y += 30) ctx.fillRect(0, y, BG_W, 3);
    for (const x of [160, 520, 880]) { ctx.fillStyle = '#c89a4a'; ctx.beginPath(); ctx.arc(x, 110, 46, 0, TAU); ctx.fill(); ctx.fillStyle = '#8ac8e8'; ctx.beginPath(); ctx.arc(x, 110, 36, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a6a9a'; ctx.fillRect(x - 36, 118, 72, 28); }
    ctx.fillStyle = '#5e341c'; ctx.fillRect(0, L.base, BG_W, H - L.base);
  },
  // B55: the pantry: shelves of jars and tins, a string of garlic
  roomPantry(ctx, L, rng, H) {
    ctx.fillStyle = '#e8d8b0'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#8a5230'; for (let y = 60; y < L.base; y += 70) ctx.fillRect(0, y, BG_W, 8);
    for (let y = 60; y < L.base - 40; y += 70) for (let x = 20; x < BG_W; x += 44) { const c = ['#c8402a', '#e8a040', '#7d8a2a', '#3a4a8a'][(x + y) % 4]; ctx.fillStyle = c; rr(ctx, x, y - 34, 26, 34, 4); ctx.fill(); ctx.fillStyle = '#f6efdc'; ctx.fillRect(x + 4, y - 24, 18, 10); }
    ctx.fillStyle = '#6a3e22'; ctx.fillRect(0, L.base, BG_W, H - L.base);
  }
};
const SKY_EVE = ['#2a1420', '#4a2030', '#6a2e38'];
const theme = (base, o) => Object.assign({}, LINEN, base || {}, o);
const themes = {
  table_china: theme(null, {
    name: 'Mind the Good China', music: 'tour_table', particles: 'none', rays: null, sky: SKY_EVE, horizonGlow: '#ffb070', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'tabCabinet', base: 330, f: 0.06 }, { kind: 'tabGiants', color: '#3a2030', base: 420, f: 0.2 }], fog: '#5a2a2a', decor: ['tabCandle', 'tabShaker', 'tabGlass']
  }),
  table_napkin: theme(null, {
    name: 'The Napkin Bird', music: 'tour_table', particles: 'none', rays: null, sky: ['#4a2a2a', '#6a3a34', '#8a5040'], horizonGlow: '#ffc890', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'tabWall', color: '#7a2a2e', base: 320, f: 0.05 }, { kind: 'tabNapkins', color: '#c8a890', base: 420, f: 0.2 }], fog: '#6a3a34', decor: ['tabCandle', 'tabGlass', 'tabBread']
  }),
  table_service: theme(null, {
    name: 'Tablecloth Service', music: 'tour_table_swing', particles: 'none', rays: null, sky: ['#3a1a24', '#5a2632', '#7a3640'], horizonGlow: '#ffd090', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'tabWall', color: '#5e2a3a', base: 300, f: 0.05 }, { kind: 'tabBanquet', color: '#5a2a26', base: 410, f: 0.18 }], fog: '#5a2632', decor: ['tabCandle', 'tabTeapot', 'tabGlass']
  }),
  table_soup: theme(null, {
    name: 'Soup Without the Spoon', music: 'tour_table_soup', particles: 'none', rays: null, sky: ['#3a2418', '#5a3420', '#7a4a2a'], horizonGlow: '#ffb060', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'tabWall', color: '#6a3a22', base: 300, f: 0.05 }, { kind: 'tabBowls', color: '#7a3a22', base: 410, f: 0.2 }], fog: '#5a3420', liquid: 'soup', decor: ['tabCandle', 'tabBread', 'tabShaker']
  }),
  table_dessert: theme(null, {
    name: 'After You', music: 'tour_table', particles: 'none', rays: null, sky: ['#24101a', '#3a1a26', '#5a2632'], horizonGlow: '#ff9aa8', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'tabWall', color: '#5a1e2a', base: 300, f: 0.05 }, { kind: 'tabDessert', color: '#4a1e26', base: 420, f: 0.2 }], fog: '#3a1a26', decor: ['tabCandle', 'tabGlass', 'tabSugar']
  }),
  table_booth: theme(null, {
    name: 'The Booth', music: 'tour_table_boss', particles: 'none', rays: null, spotlights: true, sky: ['#1a0a10', '#2a1018', '#3a1820'], horizonGlow: '#ff8a8a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'tabWall', color: '#4a1a26', base: 300, f: 0.03 }, { kind: 'tabBooth', color: '#4a1e26', base: 410, f: 0.08 }, { kind: 'tabGiants', color: '#2a1018', base: 440, f: 0.16 }], fog: '#2a1018', decor: ['tabCandle']
  }),
  // the rooms
  table_room_drawer: theme({ ground: MAT.baize }, { name: 'The Silver Drawer', music: 'tour_table_room', particles: 'none', rays: null, sky: ['#1a3a28', '#1e4a32', '#2a5a3e'], horizonGlow: '#c8e8d0', celestial: { type: 'none' }, stars: 0, layers: [{ kind: 'roomDrawer', base: 400, f: 0.04 }], fog: '#1e4a32', decor: [] }),
  table_room_cloak: theme({ ground: MAT.parquet }, { name: 'The Cloakroom', music: 'tour_table_room', particles: 'none', rays: null, sky: ['#a8865a', '#b8966a', '#c8a878'], horizonGlow: '#fff0c8', celestial: { type: 'none' }, stars: 0, layers: [{ kind: 'roomCloak', base: 400, f: 0.04 }], fog: '#b8966a', decor: [] }),
  table_room_sky: theme({ ground: MAT.slate }, { name: 'Under the Skylight', music: 'tour_table_room', particles: 'none', rays: null, sky: ['#1a1228', '#2a1e3a', '#3a2a4e'], horizonGlow: '#a89aff', celestial: { type: 'none' }, stars: 0, layers: [{ kind: 'roomSkylight', base: 400, f: 0.04 }], fog: '#2a1e3a', decor: [] }),
  table_room_scope: theme({ ground: MAT.deck }, { name: 'The Captain\'s Table', music: 'tour_table_room', particles: 'none', rays: null, sky: ['#1a4a6a', '#2a5a7a', '#3a6a8a'], horizonGlow: '#c8e8ff', celestial: { type: 'none' }, stars: 0, layers: [{ kind: 'roomScope', base: 400, f: 0.04 }], fog: '#2a5a7a', decor: [] }),
  table_room_pantry: theme({ ground: MAT.terra }, { name: 'The Pantry', music: 'tour_table_room', particles: 'none', rays: null, sky: ['#d8c8a0', '#e8d8b0', '#f0e4c4'], horizonGlow: '#fff4d8', celestial: { type: 'none' }, stars: 0, layers: [{ kind: 'roomPantry', base: 400, f: 0.04 }], fog: '#e8d8b0', decor: [] })
};
// hot soup: a creamy tomato orange (the deadly liquid of 36-4)
if (typeof LIQUIDS !== 'undefined') LIQUIDS.soup = ['#ffb870', '#e8783a', '#a8401a', 'rgba(255,220,180,0.3)', null, 'rgba(255,240,220,0.6)'];

/* ---------------- props (Decor: drawn each frame, plain shapes) ---------------- */
const decor = {
  tabCandle(ctx, x, y, t, th, d) { const sd = (d && d.seed) || 0; TabArt.candle(ctx, x, y, 30 + (sd % 3) * 8, t + sd); },
  tabShaker(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    for (const [dx, col] of [[-9, '#ffffff'], [9, '#3a3436']]) { ctx.fillStyle = 'rgba(230,240,255,0.7)'; rr(ctx, x + dx - 7, y - 30, 14, 30, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = col; ctx.fillRect(x + dx - 5, y - 16, 10, 14); ctx.fillStyle = '#c8ccd8'; rr(ctx, x + dx - 7, y - 36, 14, 8, 3); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  },
  tabGlass(ctx, x, y) { TabArt.glass(ctx, x, y, 54); },
  tabBread(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillStyle = '#c88a3a'; ctx.beginPath(); ctx.ellipse(x, y - 9, 22, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#8a5220'; ctx.lineWidth = 2; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x + k * 9 - 4, y - 14); ctx.lineTo(x + k * 9 + 4, y - 6); ctx.stroke(); }
    ctx.restore();
  },
  tabTeapot(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = IVORY;
    ctx.beginPath(); ctx.ellipse(x, y - 16, 20, 16, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 18, y - 18); ctx.quadraticCurveTo(x + 32, y - 22, x + 34, y - 34); ctx.lineTo(x + 30, y - 34); ctx.quadraticCurveTo(x + 28, y - 26, x + 17, y - 12); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 22, y - 16, 7, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
    ctx.fillStyle = NAVY; ctx.fillRect(x - 18, y - 18, 36, 3); ctx.fillStyle = IVORY; ctx.beginPath(); ctx.ellipse(x, y - 32, 9, 3, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x, y - 36, 3, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  tabSugar(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = IVORY; ctx.beginPath(); ctx.moveTo(x - 18, y - 24); ctx.quadraticCurveTo(x - 20, y, x, y); ctx.quadraticCurveTo(x + 20, y, x + 18, y - 24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = NAVY; ctx.fillRect(x - 17, y - 18, 34, 3); ctx.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) { ctx.fillRect(x - 10 + k * 7, y - 30, 6, 6); ctx.strokeRect(x - 10 + k * 7, y - 30, 6, 6); }
    ctx.restore();
  },
  // the land's tell: a wisp of steam curling out of a hidden way
  tabSteam(ctx, x, y, t, th, d) { TabArt.steam(ctx, x, y, t + ((d && d.seed) || 0) * 0.3, 0.9); },
  // a RESERVED card on a little stand
  tabReserved(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillStyle = IVORY; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x - 12, y - 18); ctx.lineTo(x + 12, y - 18); ctx.lineTo(x + 16, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = RED; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('RESERVED', x, y - 7); ctx.restore();
  }
};
const decorLights = { tabCandle: [110, '#ffd890', -46] };

/* ---------------- door looks: a pantry hatch with a bread-basket handle ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'tabDoor' || look === 'tabHatch') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = WOOD2; rr(ctx, x - 22, y - 62, 44, 62, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = look === 'tabHatch' ? '#9a6038' : '#7e2430'; rr(ctx, x - 17, y - 57, 34, 57, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(x + 10, y - 28, 3.5, 0, TAU); ctx.fill(); ctx.stroke();
      TabArt.heart(ctx, x, y - 44, near ? 6 : 5, '#ff8a9a');
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// Crumb Butler: a toasted crouton in a navy waistcoat and red bow tie with a little broom. Spots Brady and dashes
// over, broom first, to sweep a crumb under each of his feet ("ALLOW ME!")
const butlerArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const run = m === 'charge', step = run ? Math.sin(t * 22) * 3 : Math.sin(t * 9) * 1.5;
  ctx.fillStyle = INK; ctx.fillRect(-7 + step, -6, 5, 6); ctx.fillRect(2 - step, -6, 5, 6);
  // the crouton body (lumpy, toasted, a few pits)
  ctx.fillStyle = '#e0a858'; ctx.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, r = 12 + (k % 2) * 1.6; ctx.lineTo(Math.cos(a) * r, -18 + Math.sin(a) * r * 1.1); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8843a'; for (const [px, py] of [[-6, -26], [4, -12], [7, -24], [-3, -9]]) { ctx.beginPath(); ctx.arc(px, py, 1.5, 0, TAU); ctx.fill(); }
  // the navy waistcoat and red bow tie
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.moveTo(-10, -16); ctx.lineTo(10, -16); ctx.lineTo(8, -6); ctx.lineTo(-8, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd84a'; ctx.fillRect(-1, -14, 2, 2); ctx.fillRect(-1, -10, 2, 2);
  ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-6, -21); ctx.lineTo(-6, -15); ctx.closePath(); ctx.moveTo(0, -18); ctx.lineTo(6, -21); ctx.lineTo(6, -15); ctx.closePath(); ctx.fill(); ctx.stroke();
  // eyes and a polite smile
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(1, -26, 3, 3.6, 0, 0, TAU); ctx.ellipse(7, -26, 3, 3.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(2 + (run ? 1 : 0), -25.5, 1.3, 0, TAU); ctx.arc(8 + (run ? 1 : 0), -25.5, 1.3, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -21, 3, 0.2, Math.PI - 0.2); ctx.stroke();
  // the broom: held up, then swept low ahead
  ctx.save(); ctx.translate(10, -14); ctx.rotate(run ? 1.1 + Math.sin(t * 20) * 0.3 : m === 'notice' ? -0.6 : 0.25);
  ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 16); ctx.stroke();
  ctx.fillStyle = '#e8d090'; ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-4, 15); ctx.lineTo(4, 15); ctx.lineTo(6, 23); ctx.lineTo(-6, 23); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
};
// Pepper Flea: a black peppercorn on four coiled olive spring legs with a red nose. The tell: its nose wrinkles
// ("AH... AH...") for 0.7 s; then it sneezes itself a long hop into the next setting ("CHOO!") in a puff of pepper
const fleaArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const tell = m === 'notice', air = m === 'hop', sq = tell ? 1 + Math.sin(t * 30) * 0.06 : 1;
  ctx.strokeStyle = OLIVE; ctx.lineWidth = 2.4;
  for (const lx of [-8, -3, 3, 8]) { ctx.beginPath(); ctx.moveTo(lx, -10); for (let k = 0; k <= 6; k++) ctx.lineTo(lx + (k % 2 ? 2.5 : -2.5), -10 + k * (air ? 2 : 1.6)); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.save(); ctx.scale(sq, 1 / sq);
  ctx.fillStyle = '#2a2224'; ctx.beginPath(); ctx.arc(0, -18, 11, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#4a4044'; ctx.lineWidth = 1.2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(-4 + k * 2.4, -20 + (k % 2) * 6, 3, 0, Math.PI); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-3, -28); ctx.quadraticCurveTo(-6, -36, -10, -36); ctx.moveTo(3, -28); ctx.quadraticCurveTo(4, -37, 8, -37); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(4, -21, 3.6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; if (tell) { ctx.fillRect(1.5, -21.5, 5, 1.2); } else { ctx.beginPath(); ctx.arc(5, -21, 1.5, 0, TAU); ctx.fill(); }
  ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(11 + (tell ? Math.sin(t * 40) : 0), -17, 3.6 + (tell ? 0.8 : 0), 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
};
// Knife Rest: a gravy-boat dachshund in cream china with navy patches. It trots about; the moment Brady comes near
// (anyone might mention work) it lies down and rolls over: harmless, belly up, until he has gone
const restArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  if (m === 'sleep') {
    // belly up, paws in the air, eyes shut
    ctx.fillStyle = IVORY; rr(ctx, -16, -12, 32, 11, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = NAVY; ctx.beginPath(); ctx.ellipse(-6, -2, 5, 3, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = IVORY; for (const lx of [-11, -5, 5, 11]) { ctx.fillRect(lx - 2, -20 + Math.sin(t * 3 + lx) * 1.2, 4, 9); ctx.strokeRect(lx - 2, -20 + Math.sin(t * 3 + lx) * 1.2, 4, 9); }
    ctx.beginPath(); ctx.ellipse(18, -7, 6, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(19, -8, 2, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = RED; ctx.fillRect(12, -10, 3, 6);
    ctx.fillStyle = INK; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('z', 22 + Math.sin(t * 2) * 2, -18 - (t * 8) % 8);
    ctx.restore(); return;
  }
  const step = Math.sin(t * 10) * 2;
  ctx.fillStyle = IVORY;
  for (const [lx, s] of [[-12, 1], [-7, -1], [7, 1], [12, -1]]) { ctx.fillRect(lx - 2, -8, 4, 8 + s * step * 0.3); ctx.strokeRect(lx - 2, -8, 4, 8); }
  rr(ctx, -17, -18, 32, 12, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.ellipse(-6, -18, 6, 4, 0, 0, Math.PI); ctx.fill(); ctx.beginPath(); ctx.ellipse(6, -10, 5, 3, 0, Math.PI, 0); ctx.fill();
  // the tail (a gravy boat's handle) and the head with the long ear
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-19, -16, 5, Math.PI * 0.6, Math.PI * 1.6); ctx.stroke();
  ctx.lineWidth = 1.7; ctx.fillStyle = IVORY; ctx.beginPath(); ctx.ellipse(18, -22, 7, 6, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(25, -20, 4, 3, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(28, -21, 1.6, 0, TAU); ctx.fill();
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.ellipse(14, -19, 3, 7, 0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(19, -24, 1.3, 0, TAU); ctx.fill();
  ctx.fillStyle = RED; ctx.fillRect(11, -18, 3, 6);
  ctx.restore();
};
// Butter Curl: a butter-curl snail with long lashes and a lot of swagger. Every few seconds it sweats (the tell),
// melts into a harmless puddle, then pulls itself back together a little smaller (and a little less pleased)
const butterArt = (ctx, e, x, y, m, t) => {
  const s = e.swag || 1;
  ctx.save(); ctx.translate(x, y); ctx.scale((e.dir || 1) * s, (m === 'flat' ? 0.4 : 1) * s); ctx.strokeStyle = INK; ctx.lineWidth = 1.6 / s;
  if (m === 'puddle') {
    ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.ellipse(0, -2, 18, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff2b8'; ctx.beginPath(); ctx.ellipse(-4, -3, 6, 1.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(6, -3, 1, 0, TAU); ctx.arc(10, -3, 1, 0, TAU); ctx.fill();
    ctx.restore(); return;
  }
  const melt = m === 'notice' ? Math.sin(t * 20) * 0.04 : 0;
  ctx.scale(1 + melt, 1 - melt);
  ctx.fillStyle = OLIVE2; ctx.fillRect(-8, -4, 5, 4); ctx.fillRect(4, -4, 5, 4);
  ctx.fillStyle = '#ffe07a'; ctx.beginPath(); ctx.ellipse(0, -15, 14, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#e8b83a'; ctx.lineWidth = 2.2 / s; ctx.beginPath(); for (let k = 0; k < 28; k++) { const a = k * 0.42, r = 11 - k * 0.36; ctx.lineTo(-2 + Math.cos(a) * r, -15 + Math.sin(a) * r); } ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6 / s; ctx.fillStyle = '#fff2b8'; ctx.beginPath(); ctx.ellipse(12, -19, 6, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(14, -21, 1.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(12, -24); ctx.lineTo(10, -27); ctx.moveTo(14, -24.5); ctx.lineTo(14, -28); ctx.moveTo(16, -24); ctx.lineTo(18, -27); ctx.stroke();
  ctx.beginPath(); ctx.arc(14, -16, 2.5, 0.2, Math.PI - 0.2); ctx.stroke();
  if (m === 'notice') { ctx.fillStyle = '#ffe28a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-8 + k * 8, -2 + ((t * 30 + k * 7) % 6), 2, 0, TAU); ctx.fill(); } }
  ctx.restore();
};
// the critters' own thinking (all through cfg.think: walk, tell, act, back to walking)
const crumbThink = (e, dt) => {
  const p = e.g.player, c = e.cfg;
  if (e.state === 'walk') {
    e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed;
    if (e.cool <= 0 && p && !p.dead && Math.abs(p.cy - e.cy) < 2 * TS && Math.abs(p.cx - e.cx) < 6 * TS) { e.state = 'notice'; e.st = 0.65; e.vx = 0; e.dir = sign(p.cx - e.cx) || e.dir; tabSayAt(e.g, e, 'ALLOW ME!', '#ffe8c8'); }
  } else if (e.state === 'notice') { e.mode = 'notice'; e.vx = 0; e.st -= dt; if (e.st <= 0) { e.state = 'charge'; e.st = 1.1; } }
  else {
    e.mode = 'charge'; e.vx = e.dir * 5.2 * TS; e.st -= dt;
    if (Math.random() < 0.35 && e.g.onScreen(e)) e.g.burst(e.cx + e.dir * 14, e.y + e.h - 2, 1, '#e0a858', 'dust');
    if (e.st <= 0 || e.hitWall) { e.state = 'walk'; e.cool = 2.2; e.vx = e.dir * e.speed; }
  }
};
const fleaThink = (e, dt) => {
  const p = e.g.player;
  e.mode = e.onGround ? (e.state === 'notice' ? 'notice' : 'walk') : 'hop';
  if (!e.onGround) return;
  if (e.state === 'notice') {
    e.vx = 0; e.st -= dt;
    if (e.st <= 0) {
      e.state = 'walk'; e.vy = -11 * TS; e.vx = e.dir * 4.4 * TS; e.onGround = false; e.cool = 1.6;
      if (e.g.onScreen(e)) { tabSay(e.g, e.cx, e.y - 10, 'CHOO!', '#ffe8c8'); e.g.burst(e.cx - e.dir * 10, e.cy, 8, '#3a3034', 'dust'); }
    }
    return;
  }
  e.vx = e.dir * e.speed * 0.5;
  if (e.cool <= 0) { if (TourKit.near(e, p, 8, 4)) e.dir = sign(p.cx - e.cx) || e.dir; e.state = 'notice'; e.st = 0.7; if (e.g.onScreen(e)) tabSay(e.g, e.cx, e.y - 10, 'AH... AH...', '#ffe8c8'); }
};
const restThink = (e, dt) => {
  const p = e.g.player, near = p && !p.dead && Math.abs(p.cx - e.cx) < 3.2 * TS && Math.abs(p.cy - e.cy) < 3 * TS;
  if (e.state === 'sleep') { e.mode = 'sleep'; e.vx = 0; e.st -= dt; if (!near && e.st <= 0) { e.state = 'walk'; e.vx = e.dir * e.speed; } else if (near) e.st = 1.2; return; }
  e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed;
  if (near && e.cool <= 0) { e.state = 'sleep'; e.st = 1.2; e.vx = 0; if (e.g.onScreen(e)) tabSayAt(e.g, e, pick(['WORK? ...ZZZ', 'DID SOMEONE SAY WORK?', 'MY DAY OFF!']), '#e8ecff'); }
};
const butterThink = (e, dt) => {
  e.swag = e.swag || 1;
  if (e.state === 'puddle') { e.mode = 'puddle'; e.vx = 0; e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.swag = Math.max(0.65, e.swag - 0.12); e.cool = 3.2; if (e.g.onScreen(e)) tabSayAt(e.g, e, pick(['STILL GOT IT.', 'ALMOST GOT IT.', 'HMPH.']), '#fff2b8'); } return; }
  if (e.state === 'notice') { e.mode = 'notice'; e.vx = 0; e.st -= dt; if (e.st <= 0) { e.state = 'puddle'; e.st = 2.2; } return; }
  e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed;
  if (e.cool <= 0) { e.state = 'notice'; e.st = 0.7; }
};
// Butter Curl in its puddle and Knife Rest lying down are harmless (their joke): a touch does nothing then
const harmlessWhen = states => e => { const tp = e.prototype.touchPlayer; e.prototype.touchPlayer = function (p) { if (states.indexOf(this.state) >= 0) return; return tp.call(this, p); }; return e; };
const enemies = {
  tabCrumb: { cls: TourEnemy.make({ w: 24, h: 30, speed: 1.1, think: crumbThink, art: butlerArt, burst: '#e0a858' }), place: 'walk' },
  tabPepper: { cls: TourEnemy.make({ w: 22, h: 26, speed: 1.0, think: fleaThink, art: fleaArt, burst: '#3a3034' }), place: 'walk' },
  tabRest: { cls: harmlessWhen(['sleep'])(TourEnemy.make({ w: 34, h: 22, speed: 1.3, think: restThink, art: restArt, burst: IVORY })), place: 'walk' },
  tabButter: { cls: harmlessWhen(['puddle'])(TourEnemy.make({ w: 26, h: 24, speed: 0.7, think: butterThink, art: butterArt, burst: '#ffe07a' })), place: 'walk' }
};

/* ---------------- the route map: a little table for two in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save();
  ctx.fillStyle = IVORY; ctx.beginPath(); ctx.ellipse(x, y + r * 0.1, r * 0.95, r * 0.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(224,64,58,0.7)'; ctx.fillRect(x - r * 0.95, y + r * 0.1, r * 1.9, r * 0.45);
  TabArt.heart(ctx, x, y - r * 0.2 + Math.sin(t * 2) * r * 0.05, r * 0.42, RED);
  ctx.restore();
};
TourHooks.on && TourHooks.on('routeDraw', (scene, ctx, layer) => {
  if (layer !== 'under') return;
  const s = Tour.stops.table; if (!s || !scene.sx) return;
  const st = TourMap.stopState(s); if (st === 'hidden') return;
  const x = scene.sx(s.lon), y = scene.sy(s.lat), r = TourMap.pinR, t = scene.t || 0;
  ctx.save(); ctx.globalAlpha = 0.3 + 0.12 * Math.sin(t * 2); ctx.fillStyle = '#ffb0b8'; ctx.beginPath(); ctx.arc(x, y, r * 2.1, 0, TAU); ctx.fill(); ctx.restore();
});

/* ---------------- the land's map: sprites and the tablecloth ---------------- */
Object.assign(TourOWPaint.art, {
  tabPlateSprite(c, r) { TabArt.plate(c, 0, 0, r, r * 0.45); },
  tabCandleSprite(c, r) { TabArt.candle(c, 0, 0, r, 0); },
  tabGlassSprite(c, r) { TabArt.glass(c, 0, 0, r); },
  tabSugarSprite(c, r) { decor.tabSugar(c, 0, 0); },
  tabForkSprite(c, r) { TabArt.fork(c, 0, 0, r * 2, { rot: 0.4 }); },
  tabBowlSprite(c, r) { c.fillStyle = IVORY; c.beginPath(); c.ellipse(0, 0, r, r * 0.4, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#e8783a'; c.beginPath(); c.ellipse(0, -1, r * 0.8, r * 0.28, 0, 0, TAU); c.fill(); }
});
// the edge of the table instead of a coast: a soft shadow, the gingham hanging over, then the cloth
TourOWLands.coast.tabCloth = function (c, ow, ring) {
  const L = ow.look, ink = this.INK;
  c.save(); c.translate(10, 16); OWGeo.path(c, ring, true); c.fillStyle = 'rgba(20,6,10,0.45)'; c.fill(); c.restore();
  c.save(); c.translate(0, 10); OWGeo.path(c, ring, true); c.fillStyle = RED; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
  c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = 'rgba(224,64,58,0.22)'; c.lineWidth = 16; for (let x = 0; x < 1800; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 1400); c.stroke(); } for (let y = 0; y < 1400; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(1800, y); c.stroke(); } c.restore();
  OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.8; c.stroke();
};
TourOWScenes.groundPaint.table = function (c, ow) {
  const R = TourOWPaint.rng('tableground'), ink = TourOWPaint.INK, A = TourOWPaint.art;
  c.lineJoin = 'round'; c.lineCap = 'round';
  for (const [x, y, r] of [[900, 420, 46], [330, 270, 34], [1240, 250, 36]]) { c.save(); c.translate(x, y); c.strokeStyle = ink; c.lineWidth = 1.6; A.tabPlateSprite.call(TourOWPaint, c, r); c.restore(); }
  c.fillStyle = 'rgba(255,255,255,0.25)'; for (let k = 0; k < 30; k++) { c.beginPath(); c.arc(640 + R() * 520, 380 + R() * 280, 2 + R() * 3, 0, TAU); c.fill(); }
};
TourLandscape.looks.table = ['#2a1420', '#14060c', RED, IVORY, '#ffffff', GOLD, 'tabTable'];
{
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'tabTable') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40); ctx.lineWidth = 2; ctx.strokeStyle = ink || INK; ctx.lineJoin = 'round';
    ctx.fillStyle = WOOD; ctx.fillRect(-3, -18, 6, 18); ctx.strokeRect(-3, -18, 6, 18);
    ctx.fillStyle = IVORY; ctx.beginPath(); ctx.ellipse(0, -20, 24, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(224,64,58,0.8)'; ctx.fillRect(-24, -20, 48, 8); ctx.strokeRect(-24, -20, 48, 8);
    TabArt.heart(ctx, 0, -34, 7, accent || RED);
    ctx.restore();
  };
}

/* ---------------- music: a candlelit musette waltz, a swing for the service, a slow simmer for the soup, a tango
   for Madame Manners and a music box for the rooms ---------------- */
const tracks = {
  tour_table: {
    bpm: 132, bpb: 3, bars: 8, rv: 0.4, dl: 0.18, hx: 0.04,
    ch: 'Am Am E7 E7 Dm Am E7 Am',
    ld: 'E6:3 A6:3 C7:3 | B6:6 A6:3 | G#6:3 B6:3 E7:3 | D7:9 | F6:3 A6:3 D7:3 | C7:3 B6:3 A6:3 | G#6:3 B6:3 D7:3 | C7:6 A6:3',
    li: 'reed', lv: 0.14,
    bp: 'r..f..', bi: 'pluckb', bv: 0.3,
    ap: '.c.c.c', ai: 'pluck', av: 0.05, ao: 57,
    dr: ['k.....', '...s.s', 'h.h.h.'], dv: 0.22
  },
  tour_table_swing: {
    bpm: 150, bars: 8, rv: 0.3, sw: 0.18, hx: 0.05,
    ch: 'C A7 Dm G7 C A7 Dm G7',
    ld: 'E6:2 G6:2 C7:4 B6:2 A6:2 | G6:4 E6:4 C#6:8 | D6:2 F6:2 A6:4 G6:4 | F6:4 D6:4 B5:8 | E6:2 G6:2 C7:4 E7:4 | C#7:4 A6:4 G6:8 | F6:2 A6:2 D7:4 C7:4 | B6:4 G6:4 F6:8',
    li: 'reed', lv: 0.13,
    bp: 'r.f.r.f.r.f.r.f.', bi: 'pluckb', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'piano', av: 0.05, ao: 58,
    dr: ['k.......k.......', '....s.......s...', 'h.hhh.hhh.hhh.hh'], dv: 0.3
  },
  tour_table_soup: {
    bpm: 92, bpb: 3, bars: 8, rv: 0.5, dl: 0.22, hx: 0.03,
    ch: 'Dm Dm A7 A7 Gm Dm A7 Dm',
    ld: 'A5:6 D6:3 F6:3 | E6:12 | C#6:6 E6:3 A6:3 | G6:12 | Bb5:6 D6:3 G6:3 | F6:6 D6:6 | E6:3 G6:3 C#6:6 | D6:12',
    li: 'reed', lv: 0.13,
    bp: 'r.....f.....', bi: 'sub', bv: 0.26,
    ap: 'c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 62,
    dr: ['k...........', '......s.....', '..h...h...h.'], dv: 0.16
  },
  tour_table_boss: {
    bpm: 120, bars: 8, rv: 0.3, hx: 0.06,
    ch: 'Dm Dm A7 A7 Gm Dm E7 A7',
    ld: 'A5:3 D6:1 F6:4 A6:4 F6:4 | E6:3 D6:1 E6:8 .:4 | C#6:3 E6:1 G6:4 A6:4 G6:4 | F6:3 E6:1 C#6:8 .:4 | Bb5:3 D6:1 G6:4 Bb6:4 G6:4 | F6:3 A6:1 D7:8 .:4 | E6:3 G#6:1 B6:4 D7:4 B6:4 | C#7:12 A6:4',
    li: 'reed', lv: 0.15,
    bp: 'r..r..f.r..r..f.', bi: 'pluckb', bv: 0.32,
    ap: 'c...c.c.c...c.c.', ai: 'strings', av: 0.05, ao: 55,
    dr: ['k..k..k.k..k..k.', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.36
  },
  tour_table_room: {
    bpm: 100, bpb: 3, bars: 4, rv: 0.6, dl: 0.25, hx: 0.03,
    ch: 'F Dm Bb C',
    ld: 'A6:3 C7:3 F7:6 | D7:3 F7:3 A6:6 | Bb6:3 D7:3 F7:6 | E7:6 C7:6',
    li: 'mbox', lv: 0.13,
    bp: 'r.....r.....', bi: 'sub', bv: 0.2,
    ap: 'c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 66,
    dr: ['k...........', '............', '....h.....h.'], dv: 0.1
  }
};

Tour.country({
  id: 'table', secret: true, bonus: true, colors: COL, tagline: 'A hidden land: one quiet table, and the cutlery will not stop talking',
  themes, painters, decor, decorLights, enemies, tracks,
  music: { level: 'tour_table', boss: 'tour_table_boss', map: null },
  landmark: 'the table for two', emblem,
  arrival: 'Brady! I booked us ONE quiet table. Piwi gave the cutlery speaking parts. The fork is doing a voice. Come and rescue dinner. ♥ C',
  coin: { name: 'CRUMBS', draw(ctx, x, y) {
    ctx.fillStyle = '#e8a858'; ctx.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU, r = k % 2 ? 6.5 : 8.5; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 3.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b8742a'; ctx.fillRect(x + 2, y + 1, 2, 2);
  } },
  levels: []
});
// for the other table files and the tests
Tour.tableKit = { say: tabSay, sayAt: tabSayAt, COL, INK, RED, RED2, IVORY, IVORY2, OLIVE, OLIVE2, NAVY, NAVY2, WOOD, WOOD2, GOLD, TabArt, gingham };
})();
