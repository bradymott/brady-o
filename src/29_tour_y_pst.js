/* ============================================================
   PUPO STANDARD TIME (world 32, cc 'pst'): a hidden land (docs/design/CHATGPT_RELAY.md A7). Between "more" and
   "trip" in one of Pupo's slow sentences there is time for an entire holiday. The whole land happens inside that
   sentence: honey-coloured cushions, plum eyelids, mint clock hands and cream thought bubbles with very long tails.
   Opened from Nepal 12-1 (29_tour_y_pst_e_entrance.js): Pupo naps on a trail bench, and one cushion lifts once too
   often.
   This file: the route stop, the looks (tiles, themes, painted backdrops, props), the critters (the Pillow Louse,
   the Secondhand Slug, the Napkin Bat, the Snore Pea), the route-map emblem, the map's sprites, the music and the
   country itself. The mechanics: 29_tour_y_pst_a_mech.js. The secret rooms: _b_rooms. The boss (The Interrupter):
   _c_boss. The levels and the land's map: _d_levels. The way in from Nepal: _e_entrance.
   ============================================================ */
(function () {
Tour.addStop({ id: 'pst', world: 32, name: 'Pupo Standard Time', sub: 'a hidden land', lon: 91, lat: 34, secret: true, bonus: true, d0: 0.8, pin: 'pillow' });
const COL = { a: '#f2b632', b: '#7a2f5a', c: '#8fdcaa' };
const INK = '#2a1426';
const HONEY = '#f2b632', HONEY_HI = '#ffd673', HONEY_LO = '#c98a1a', PLUM = '#8a3462', PLUM_HI = '#b0507e', PLUM_LO = '#5e1f42';
const MINT = '#8fdcaa', MINT_HI = '#c4f2d2', MINT_LO = '#4fa878', CREAM = '#fbefd2', CREAM_LO = '#e6d2a8';

/* ---------------- shared drawings (the tiles, props, critters, rooms and boss all use these) ---------------- */
const PstArt = {
  // a buttoned honey cushion: a soft rounded block with diamond tufting and little buttons
  cushion(ctx, x, y, w, h, col, dark, hi) {
    col = col || HONEY; dark = dark || HONEY_LO; hi = hi || HONEY_HI;
    ctx.save(); ctx.lineJoin = 'round';
    ctx.fillStyle = col; rr(ctx, x, y, w, h, Math.min(w, h) * 0.32); ctx.fill();
    ctx.save(); rr(ctx, x, y, w, h, Math.min(w, h) * 0.32); ctx.clip();
    ctx.strokeStyle = dark; ctx.lineWidth = 1.2; const s = Math.max(10, Math.min(w, h) * 0.55);
    for (let k = -h; k < w + h; k += s) { ctx.beginPath(); ctx.moveTo(x + k, y); ctx.lineTo(x + k + h, y + h); ctx.moveTo(x + k + h, y); ctx.lineTo(x + k, y + h); ctx.stroke(); }
    ctx.fillStyle = hi; ctx.globalAlpha = 0.55; rr(ctx, x + 3, y + 2, w - 6, Math.max(2, h * 0.18), 3); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = dark; for (let k = s / 2; k < w; k += s) for (let j = s / 2; j < h; j += s) { ctx.beginPath(); ctx.arc(x + k, y + j, 1.8, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, x, y, w, h, Math.min(w, h) * 0.32); ctx.stroke();
    ctx.restore();
  },
  // a cream thought bubble: a flat-bottomed cloud with a scalloped underside (w x h, top-left at x, y)
  bubble(ctx, x, y, w, h, fill, line) {
    ctx.save(); ctx.fillStyle = fill || CREAM; ctx.strokeStyle = line || INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    const rc = Math.min(h / 2, w / 2), n = Math.max(1, Math.round((w - 2 * rc) / (h * 0.7))), sp = (w - 2 * rc) / n, rt = Math.max(sp * 0.62, h * 0.3), rb = Math.max(sp * 0.5, h * 0.2);
    ctx.beginPath();
    ctx.arc(x + rc, y + h / 2, rc, Math.PI * 0.5, Math.PI * 1.5);
    for (let k = 0; k < n; k++) { const cx = x + rc + sp * (k + 0.5); ctx.arc(cx, y + rt * 0.75, rt, Math.PI * 1.1, Math.PI * 1.9); }
    ctx.arc(x + w - rc, y + h / 2, rc, -Math.PI * 0.5, Math.PI * 0.5);
    for (let k = n - 1; k >= 0; k--) { const cx = x + rc + sp * (k + 0.5); ctx.arc(cx, y + h - rb * 0.7, rb, Math.PI * 0.15, Math.PI * 0.85); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // the bubble's long tail of little round dots, from (x0, y0) toward (x1, y1)
  tail(ctx, x0, y0, x1, y1, n, r0) {
    ctx.save(); ctx.fillStyle = CREAM; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    for (let k = 0; k < n; k++) { const q = k / Math.max(1, n - 1), r = (r0 || 5) * (1 - q * 0.6); ctx.beginPath(); ctx.arc(lerp(x0, x1, q), lerp(y0, y1, q) - Math.sin(q * Math.PI) * 8, r, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  },
  // a mint clock hand: a long tapered pointer with an arrow tip and a pivot
  hand(ctx, x, y, len, ang, col, w) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = col || MINT; w = w || Math.max(3, len * 0.09);
    ctx.beginPath(); ctx.moveTo(-len * 0.18, -w * 0.6); ctx.lineTo(len * 0.78, -w * 0.45); ctx.lineTo(len * 0.78, -w * 1.5); ctx.lineTo(len, 0); ctx.lineTo(len * 0.78, w * 1.5); ctx.lineTo(len * 0.78, w * 0.45); ctx.lineTo(-len * 0.18, w * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = MINT_LO; ctx.beginPath(); ctx.arc(0, 0, w * 1.3, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = MINT_HI; ctx.beginPath(); ctx.arc(-w * 0.3, -w * 0.3, w * 0.45, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a sleepy little 'z' (the land's tell over every hidden way: one lone z drifting up)
  z(ctx, x, y, s, a, col) {
    ctx.save(); ctx.globalAlpha = a == null ? 1 : a; ctx.strokeStyle = col || '#ffffff'; ctx.lineWidth = Math.max(1.4, s * 0.22); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - s / 2, y - s / 2); ctx.lineTo(x + s / 2, y - s / 2); ctx.lineTo(x - s / 2, y + s / 2); ctx.lineTo(x + s / 2, y + s / 2); ctx.stroke();
    ctx.restore();
  },
  // a cream feather with a plum quill
  feather(ctx, x, y, len, ang, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang || 0); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = col || CREAM;
    ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.quadraticCurveTo(-len * 0.1, -len * 0.26, len / 2, -2); ctx.quadraticCurveTo(-len * 0.05, len * 0.2, -len / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = PLUM; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-len / 2 - 4, 1); ctx.quadraticCurveTo(0, -len * 0.04, len / 2, -2); ctx.stroke();
    ctx.strokeStyle = CREAM_LO; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * len * 0.12, -1); ctx.lineTo(k * len * 0.12 + len * 0.06, -len * 0.14); ctx.stroke(); }
    ctx.restore();
  },
  // a closed eye seen whole: the plum lid arc and its lashes hanging down (w wide)
  lid(ctx, x, y, w, open, lashLen) {
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = INK;
    const h = w * 0.22 * (open || 0);
    if (open > 0.02) { ctx.fillStyle = '#fff8ec'; ctx.beginPath(); ctx.ellipse(x, y, w / 2, h + 2, 0, 0, TAU); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#5a3a24'; ctx.beginPath(); ctx.arc(x, y, Math.min(h, w * 0.16), 0, TAU); ctx.fill(); ctx.fillStyle = '#1a0e14'; ctx.beginPath(); ctx.arc(x, y, Math.min(h, w * 0.08), 0, TAU); ctx.fill(); }
    ctx.lineWidth = Math.max(5, w * 0.06) + 3; ctx.beginPath(); ctx.ellipse(x, y - h, w / 2, w * 0.2, 0, 0.05, Math.PI - 0.05); ctx.stroke();
    ctx.strokeStyle = PLUM; ctx.lineWidth = Math.max(5, w * 0.06); ctx.stroke();
    const L = lashLen || w * 0.16;
    for (let k = 0; k < 5; k++) { const a = 0.35 + k * 0.6, px = x + Math.cos(a) * w / 2, py = y - h + Math.sin(a) * w * 0.2; ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * L * 0.5, py + L); ctx.stroke(); ctx.strokeStyle = PLUM_LO; ctx.lineWidth = 3.4; ctx.stroke(); }
    ctx.restore();
  },
  // a little hourglass (the land's clock of borrowed time): sand in the top (k 1) or the bottom (k 0)
  hourglass(ctx, x, y, s, k) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    ctx.fillStyle = PLUM; ctx.fillRect(x - s * 0.55, y - s, s * 1.1, s * 0.16); ctx.strokeRect(x - s * 0.55, y - s, s * 1.1, s * 0.16); ctx.fillRect(x - s * 0.55, y + s * 0.84, s * 1.1, s * 0.16); ctx.strokeRect(x - s * 0.55, y + s * 0.84, s * 1.1, s * 0.16);
    ctx.fillStyle = 'rgba(220,245,255,0.75)'; ctx.beginPath(); ctx.moveTo(x - s * 0.42, y - s * 0.84); ctx.lineTo(x + s * 0.42, y - s * 0.84); ctx.lineTo(x + s * 0.06, y); ctx.lineTo(x + s * 0.42, y + s * 0.84); ctx.lineTo(x - s * 0.42, y + s * 0.84); ctx.lineTo(x - s * 0.06, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = HONEY; k = clamp(k == null ? 0.5 : k, 0, 1);
    if (k > 0.02) { const t = s * 0.8 * k; ctx.beginPath(); ctx.moveTo(x - s * 0.06 - 0.36 * s * k, y - t * 0.6 - 2); ctx.lineTo(x + s * 0.06 + 0.36 * s * k, y - t * 0.6 - 2); ctx.lineTo(x, y - 1); ctx.closePath(); ctx.fill(); }
    if (k < 0.98) { const t = s * 0.7 * (1 - k); ctx.beginPath(); ctx.moveTo(x - s * 0.4, y + s * 0.82); ctx.lineTo(x + s * 0.4, y + s * 0.82); ctx.lineTo(x, y + s * 0.82 - t); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
};

/* ---------------- tiles ---------------- */
// the piped cushion tread: honey cushion with tufting and buttons, a cream piped edge on top
const tuftPaint = (ctx, rng, base, line, dot) => {
  ctx.fillStyle = base; ctx.fillRect(0, 0, TS, TS);
  ctx.strokeStyle = line; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(TS, TS); ctx.moveTo(TS, 0); ctx.lineTo(0, TS); ctx.stroke();
  ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(TS / 2, TS / 2, 2.2, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(TS / 2, 3); ctx.lineTo(TS - 4, TS / 2); ctx.lineTo(TS / 2, TS / 2 - 3); ctx.closePath(); ctx.fill();
  if (rng() < 0.15) { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(4 + rng() * 20, 4 + rng() * 20, 2, 2); }
};
const cushionGround = {
  style: 'cushion', cap: HONEY_HI, capHi: '#fff1c0', dirt: HONEY, dirt2: HONEY_LO, rock: PLUM,
  paint(ctx, rng, o) { if (!o || o.top) tuftPaint(ctx, rng, HONEY, HONEY_LO, PLUM_LO); else tuftPaint(ctx, rng, PLUM, PLUM_LO, HONEY_LO); },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = HONEY_LO; ctx.fillRect(x0, 0, x1 - x0, 12);
    ctx.fillStyle = HONEY_HI; for (let x = x0; x < x1; x += 16) { ctx.beginPath(); ctx.ellipse(x + 8, 5, 9, 6, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = CREAM; ctx.fillRect(x0, 0, x1 - x0, 3.5);
    ctx.fillStyle = INK; for (let x = x0 + 2; x < x1; x += 6) ctx.fillRect(x, 1.2, 2.5, 1.2);
  }
};
// the dream floor variant for later stages: plum velvet with the honey piping
const velvetGround = {
  style: 'velvet', cap: PLUM_HI, capHi: '#e08ab4', dirt: PLUM, dirt2: PLUM_LO, rock: PLUM_LO,
  paint(ctx, rng, o) { if (o && o.top) tuftPaint(ctx, rng, PLUM, PLUM_LO, '#ffd673'); else tuftPaint(ctx, rng, '#5e1f42', '#3a0e26', HONEY_LO); },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = PLUM_LO; ctx.fillRect(x0, 0, x1 - x0, 12);
    ctx.fillStyle = PLUM_HI; for (let x = x0; x < x1; x += 16) { ctx.beginPath(); ctx.ellipse(x + 8, 5, 9, 6, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = HONEY; ctx.fillRect(x0, 0, x1 - x0, 3.5);
    ctx.fillStyle = HONEY_LO; for (let x = x0 + 2; x < x1; x += 6) ctx.fillRect(x, 1.2, 2.5, 1.2);
  }
};
// the boss's writing desk: walnut with a strip of cream paper along the top
const deskGround = {
  style: 'desk', cap: '#fff4dc', capHi: '#ffffff', dirt: '#7a4a2a', dirt2: '#5a3218', rock: '#4a2810',
  paint(ctx, rng) {
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = '#64381c'; ctx.lineWidth = 1; for (let y = 4; y < TS; y += 7) { ctx.beginPath(); ctx.moveTo(0, y + rng() * 2); ctx.quadraticCurveTo(TS / 2, y + rng() * 4 - 2, TS, y + rng() * 2); ctx.stroke(); }
    if (rng() < 0.2) { ctx.fillStyle = '#5a3218'; ctx.beginPath(); ctx.ellipse(8 + rng() * 16, 8 + rng() * 16, 3, 1.6, 0, 0, TAU); ctx.fill(); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#4a2810'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = '#fff4dc'; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = '#c8b8f0'; for (let x = x0 + 4; x < x1; x += 22) ctx.fillRect(x, 3, 12, 1.2);
  }
};
// the thought-bubble foothold (one-way): a cream cloud bar
const bubbleSemi = {
  style: 'bubble', c1: CREAM, c2: CREAM_LO,
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = CREAM_LO; ctx.fillRect(x0, 3, x1 - x0, 8);
    ctx.fillStyle = CREAM; for (let x = x0; x < x1; x += 12) { ctx.beginPath(); ctx.arc(x + 6, 5, 6.5, Math.PI, 0); ctx.fill(); }
    ctx.fillRect(x0, 4, x1 - x0, 5);
    ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5);
    ctx.fillStyle = CREAM; for (let x = x0 + 6; x < x1; x += 12) { ctx.beginPath(); ctx.arc(x, 11, 3, 0, Math.PI); ctx.fill(); }
  }
};
const plumBrick = {
  style: 'pillow', c1: PLUM_HI, c2: PLUM_LO, mortar: '#3a0e26',
  paint(ctx) {
    ctx.fillStyle = '#3a0e26'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = PLUM; rr(ctx, 1, 1, TS - 2, TS - 2, 9); ctx.fill();
    ctx.fillStyle = PLUM_HI; rr(ctx, 4, 3, TS - 10, 6, 3); ctx.fill();
    ctx.fillStyle = HONEY; ctx.beginPath(); ctx.arc(TS / 2, TS / 2 + 1, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = PLUM_LO; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(5, TS / 2 + 1); ctx.lineTo(TS / 2 - 3, TS / 2 + 1); ctx.moveTo(TS / 2 + 3, TS / 2 + 1); ctx.lineTo(TS - 5, TS / 2 + 1); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; rr(ctx, 1, 1, TS - 2, TS - 2, 9); ctx.stroke();
  }
};
const quiltHard = {
  c1: PLUM, c2: PLUM_LO,
  paint(ctx) {
    ctx.fillStyle = PLUM_LO; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = PLUM; ctx.fillRect(2, 2, TS - 4, TS - 4);
    ctx.strokeStyle = HONEY_HI; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.strokeRect(5, 5, TS - 10, TS - 10); ctx.setLineDash([]);
    ctx.fillStyle = MINT; ctx.beginPath(); ctx.arc(TS / 2, TS / 2, 2.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the rooms' own floors: each room is its own place (mint kitchen tiles, a nursery carpet, pantry boards, a bedroom rug)
const floorOf = (base, line, dot, cap, capHi, piping) => ({ style: 'room', cap, capHi, dirt: base, dirt2: line, rock: line,
  paint(ctx, rng, o) { tuftPaint(ctx, rng, base, line, dot); },
  paintCap(ctx, x0, x1) { ctx.fillStyle = line; ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = cap; ctx.fillRect(x0, 0, x1 - x0, 7); ctx.fillStyle = piping; for (let x = x0 + 3; x < x1; x += 10) ctx.fillRect(x, 2, 5, 2); } });
const roomFloors = {
  kitchen: floorOf('#bfe8d0', '#8fc8a8', '#ffffff', '#e8f8ee', '#ffffff', '#4fa878'),
  nursery: floorOf('#6a8ad0', '#4a6ab0', '#ffd673', '#8aa8e8', '#c8dcf8', '#ffffff'),
  pantry: floorOf('#a8743a', '#7a4a20', '#e8c088', '#c8925a', '#e8c088', '#5a3418'),
  bedroom: floorOf('#7a3a6a', '#5a2a4e', '#8fdcaa', '#c86a9a', '#e08ab4', '#ffd673'),
  lab: floorOf('#3a2a4a', '#2a1a36', '#9ad8f0', '#5a4a6a', '#7a6a8a', '#9ad8f0')
};
const cushionSet = { ground: cushionGround, semi: bubbleSemi, brick: plumBrick, hard: quiltHard, pillar: { c1: MINT_HI, c2: MINT_LO, cap: HONEY, style: 'column' }, accent: HONEY, tint: {}, bloom: 0.16, liquid: null };
const velvetSet = Object.assign({}, cushionSet, { ground: velvetGround, accent: MINT });
const deskSet = Object.assign({}, cushionSet, { ground: deskGround, accent: '#fff4dc' });

/* ---------------- painted backdrops ---------------- */
// a soft rounded "pillow hill" ridge line
const pillowHills = (ctx, base, col, amp, step, rng, H, line) => {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
  let x = 0; ctx.lineTo(0, base);
  while (x < BG_W) { const w = step * (0.7 + rng() * 0.6), h = amp * (0.5 + rng() * 0.6); ctx.quadraticCurveTo(x + w / 2, base - h * 2, x + w, base); x += w; }
  ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
  if (line) { ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.stroke(); }
};
// a drifting thought bubble with its long tail of dots
const farBubble = (ctx, x, y, w, alpha, word) => {
  ctx.save(); ctx.globalAlpha = alpha;
  PstArt.bubble(ctx, x, y, w, w * 0.45, CREAM, 'rgba(42,20,38,0.6)');
  ctx.fillStyle = 'rgba(42,20,38,0.6)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + w * 0.2 - k * 9, y + w * 0.5 + k * 10, 5 - k, 0, TAU); ctx.fill(); }
  if (word) { ctx.fillStyle = PLUM; ctx.font = Math.round(w * 0.14) + 'px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(word, x + w / 2, y + w * 0.22); }
  ctx.restore();
};
const painters = {
  // the dusk of the dream: a plum-to-honey sky band of slow words in bubbles (Pupo's sentence, far away)
  pstWords(ctx, L, rng, H) {
    const words = L.words || ['I', 'would', 'like', 'more...', '...', 'trip'];
    for (let k = 0; k < words.length; k++) farBubble(ctx, 40 + k * (BG_W / words.length) + rng() * 40, 40 + rng() * 70, 110 + rng() * 40, 0.55, words[k]);
  },
  // far pillow hills with buttons
  pstPillows(ctx, L, rng, H) {
    pillowHills(ctx, L.base, L.color, L.amp || 40, L.step || 180, rng, H, null);
    ctx.fillStyle = L.dot || 'rgba(255,255,255,0.18)';
    for (let k = 0; k < 28; k++) { ctx.beginPath(); ctx.arc(rng() * BG_W, L.base + 10 + rng() * 60, 3, 0, TAU); ctx.fill(); }
  },
  // near cushions piled up: whole honey cushions with tufts, leaning, a plum bolster in front
  pstCushionPile(ctx, L, rng, H) {
    const b = L.base;
    for (let x = -30; x < BG_W; x += 90 + rng() * 60) { const w = 110 + rng() * 60, h = 50 + rng() * 40; ctx.save(); ctx.translate(x + w / 2, b - h / 2 + 10); ctx.rotate((rng() - 0.5) * 0.25); PstArt.cushion(ctx, -w / 2, -h / 2, w, h, L.color || '#d99a2a', L.dark || '#a86e14', L.hi || '#f0c060'); ctx.restore(); }
    ctx.fillStyle = L.front || PLUM_LO; ctx.fillRect(0, b + 20, BG_W, H - b);
  },
  // mint clock hands standing in the hills like trees, each on its pivot
  pstHands(ctx, L, rng, H) {
    for (let x = 30; x < BG_W; x += 120 + rng() * 120) {
      const len = 60 + rng() * 70, ang = -Math.PI / 2 + (rng() - 0.5) * 1.1;
      ctx.save(); ctx.globalAlpha = L.alpha || 0.9; PstArt.hand(ctx, x, L.base, len, ang, L.color || MINT, 5); ctx.restore();
    }
  },
  // the long blink: Pupo's huge sleeping face far off: a soft brown fur horizon with two closed eyes
  pstFace(ctx, L, rng, H) {
    const b = L.base, cx = BG_W / 2;
    ctx.fillStyle = '#8a6440'; ctx.beginPath(); ctx.ellipse(cx, b + 160, BG_W * 0.62, 300, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f2dcb0'; ctx.beginPath(); ctx.ellipse(cx, b + 140, BG_W * 0.44, 220, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#5a3a20'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * 190, b - 20, 150, 46, s * 0.25, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.globalAlpha = 0.85; for (const s of [-1, 1]) PstArt.lid(ctx, cx + s * 190, b - 34, 200, 0, 36); ctx.restore();
    ctx.fillStyle = '#3a2214'; ctx.beginPath(); ctx.ellipse(cx, b + 40, 34, 22, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 160; k++) { ctx.strokeStyle = 'rgba(90,58,32,0.35)'; ctx.lineWidth = 2; const x = rng() * BG_W, y = b - 140 + rng() * 120; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 9); ctx.stroke(); }
  },
  // the yawn: the inside of a huge warm mouth far off: the plum palate, cream teeth rows, a soft uvula
  pstPalate(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#6a1f3e'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#8a2c52'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(BG_W / 2, -40 + k * 26, BG_W * 0.7 - k * 60, 70, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = k % 2 ? '#8a2c52' : '#7a2648'; }
    ctx.fillStyle = CREAM; ctx.strokeStyle = 'rgba(42,20,38,0.5)'; ctx.lineWidth = 2;
    for (let x = -20; x < BG_W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 30); ctx.quadraticCurveTo(x + 32, 120, x + 64, 30); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#c84a78'; ctx.beginPath(); ctx.ellipse(BG_W * 0.5, 110, 26, 46, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e0789e'; ctx.beginPath(); ctx.ellipse(BG_W * 0.5, b + 120, BG_W * 0.6, 150, 0, Math.PI, 0); ctx.fill();
  },
  // feathers drifting in the air
  pstFeathers(ctx, L, rng, H) { for (let k = 0; k < (L.n || 14); k++) { ctx.save(); ctx.globalAlpha = 0.7; PstArt.feather(ctx, rng() * BG_W, 40 + rng() * (L.base - 80), 20 + rng() * 20, (rng() - 0.5) * 1.2); ctx.restore(); } },
  // the hourglass garden: tall glass hourglass flowers on mint stems, far off
  pstGlassGarden(ctx, L, rng, H) {
    const b = L.base;
    for (let x = 20; x < BG_W; x += 70 + rng() * 80) {
      const h = 80 + rng() * 120, s = 14 + rng() * 10;
      ctx.strokeStyle = L.stem || MINT_LO; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, b + 20); ctx.quadraticCurveTo(x + (rng() - 0.5) * 30, b - h / 2, x, b - h); ctx.stroke();
      ctx.save(); ctx.globalAlpha = 0.85; PstArt.hourglass(ctx, x, b - h - s, s, rng()); ctx.restore();
    }
    ctx.fillStyle = L.color || '#5aa07a'; pillowHills(ctx, b + 10, L.color || '#5aa07a', 16, 120, rng, H, null);
  },
  // big clock faces sunk in the hills (plain, numberless)
  pstClocks(ctx, L, rng, H) {
    for (let x = 80; x < BG_W; x += 260 + rng() * 120) {
      const r = 50 + rng() * 40, y = L.base - r * 0.6;
      ctx.fillStyle = L.rim || PLUM_LO; ctx.beginPath(); ctx.arc(x, y, r + 8, 0, TAU); ctx.fill();
      ctx.fillStyle = L.face || CREAM; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = PLUM; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82, 2.5, 0, TAU); ctx.fill(); }
      PstArt.hand(ctx, x, y, r * 0.7, -1.2 + rng(), MINT, 3); PstArt.hand(ctx, x, y, r * 0.5, 0.6 + rng(), HONEY, 3);
    }
  },
  // the picture gallery: framed thought bubbles with things in them (a tub, a towel, a kite, a teapot)
  pstGallery(ctx, L, rng, H) {
    const b = L.base, things = ['tub', 'towel', 'kite', 'teapot', 'boot', 'moon'];
    let k = 0;
    for (let x = 40; x < BG_W; x += 170) {
      const y = 50 + (k % 2) * 60, w = 120;
      farBubble(ctx, x, y, w, 0.85, null);
      ctx.save(); ctx.translate(x + w / 2, y + w * 0.22); ctx.globalAlpha = 0.8; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      const th = things[k++ % things.length];
      if (th === 'tub') { ctx.fillStyle = '#ffffff'; rr(ctx, -20, -8, 40, 16, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9ad8f0'; ctx.fillRect(-16, -8, 32, 4); }
      else if (th === 'towel') { ctx.fillStyle = MINT; ctx.fillRect(-14, -12, 28, 22); ctx.strokeRect(-14, -12, 28, 22); ctx.fillStyle = '#ffffff'; ctx.fillRect(-14, 4, 28, 3); }
      else if (th === 'kite') { ctx.fillStyle = HONEY; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(10, 0); ctx.lineTo(0, 14); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else if (th === 'teapot') { ctx.fillStyle = PLUM_HI; ctx.beginPath(); ctx.ellipse(0, 0, 14, 10, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(12, -2); ctx.lineTo(20, -8); ctx.stroke(); }
      else if (th === 'boot') { ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-6, -12, 10, 18); ctx.fillRect(-6, 2, 18, 6); }
      else { ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
    pillowHills(ctx, b, L.color || '#e8c890', 18, 140, rng, H, null);
  },
  // the writing desk at night: a big window with the moon, a lamp's glow, a typewriter-tall stack of paper
  pstStudy(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#3a2a4a'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#2a1e38'; for (let x = 0; x < BG_W; x += 64) ctx.fillRect(x, 0, 3, H);
    for (const wx of [140, 620]) {
      ctx.fillStyle = '#1a1430'; ctx.fillRect(wx, 60, 220, 200); ctx.fillStyle = '#5a4a8a'; ctx.fillRect(wx + 8, 68, 204, 184);
      ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(wx + 150, 120, 26, 0, TAU); ctx.fill(); ctx.fillStyle = '#5a4a8a'; ctx.beginPath(); ctx.arc(wx + 162, 112, 22, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1a1430'; ctx.fillRect(wx + 106, 68, 8, 184); ctx.fillRect(wx + 8, 156, 204, 8);
      ctx.fillStyle = '#ffffff'; for (let k = 0; k < 10; k++) ctx.fillRect(wx + 14 + rng() * 190, 74 + rng() * 170, 1.5, 1.5);
    }
    const g = ctx.createRadialGradient(BG_W * 0.45, b - 40, 10, BG_W * 0.45, b - 40, 260); g.addColorStop(0, 'rgba(255,220,140,0.35)'); g.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, BG_W, H);
  },
  // the study's near bookshelves: tall plum cases of honey, mint and cream books, a sleeping cat-shaped bookend
  pstShelves(ctx, L, rng, H) {
    const b = L.base;
    for (let x = -20; x < BG_W; x += 300) {
      ctx.fillStyle = '#4a2438'; ctx.fillRect(x, b - 300, 190, 300); ctx.fillStyle = '#3a1a2c'; ctx.fillRect(x + 8, b - 292, 174, 292);
      for (let sy = b - 292; sy < b - 20; sy += 66) {
        ctx.fillStyle = '#5a2e46'; ctx.fillRect(x, sy + 58, 190, 8);
        for (let bx = x + 12; bx < x + 176;) { const w = 10 + rng() * 12, h = 34 + rng() * 20; ctx.fillStyle = [HONEY, MINT, CREAM, PLUM_HI, '#8ab8f0'][Math.floor(rng() * 5)]; ctx.fillRect(bx, sy + 58 - h, w, h); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(bx + w - 3, sy + 58 - h, 3, h); bx += w + 2; }
      }
    }
    ctx.fillStyle = '#2a1424'; ctx.fillRect(0, b, BG_W, H - b);
  },
  // the land's sky glow: honey stars and a crescent pillow moon
  pstSkyMoon(ctx, L, rng, H) {
    const x = L.x || 800, y = L.y || 80, r = L.r || 34;
    ctx.fillStyle = '#fff1c0'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = L.sky || '#5a2a5a'; ctx.beginPath(); ctx.arc(x + r * 0.45, y - r * 0.2, r * 0.85, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '16px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.globalAlpha = 0.7; ctx.fillText('z', x - r * 0.6, y - r * 0.9); ctx.font = '11px ' + FONT_DISPLAY; ctx.fillText('z', x - r * 0.9, y - r * 1.4); ctx.globalAlpha = 1;
  },

  /* ---------- the secret rooms' own places (six rooms, six looks) ---------- */
  // B31 Knock Knock: a row of pillow forts on a moonlit landing, bunting of plain cream pennants
  roomForts(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#2a2050'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 70; k++) ctx.fillRect(rng() * BG_W, rng() * b * 0.6, 1.5, 1.5);
    ctx.fillStyle = '#3a2e66'; pillowHills(ctx, b - 40, '#3a2e66', 26, 160, rng, H, null);
    ctx.strokeStyle = CREAM_LO; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 60); for (let x = 0; x <= BG_W; x += 64) ctx.quadraticCurveTo(x + 32, 84, x + 64, 60); ctx.stroke();
    ctx.fillStyle = CREAM; for (let x = 10; x < BG_W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 66); ctx.lineTo(x + 12, 66); ctx.lineTo(x + 6, 80); ctx.closePath(); ctx.fill(); }
  },
  // B32 the pillow sample: a quilted plum wall with a giant cutaway pillow pinned up like a specimen
  roomPillowLab(ctx, L, rng, H) {
    ctx.fillStyle = '#4a1e3a'; ctx.fillRect(0, 0, BG_W, H);
    for (let y = 0; y < H; y += 48) for (let x = (y / 48) % 2 * 24; x < BG_W; x += 48) { ctx.fillStyle = '#5a2646'; ctx.beginPath(); ctx.moveTo(x, y + 24); ctx.lineTo(x + 24, y); ctx.lineTo(x + 48, y + 24); ctx.lineTo(x + 24, y + 48); ctx.closePath(); ctx.fill(); ctx.fillStyle = HONEY_LO; ctx.beginPath(); ctx.arc(x + 24, y + 24, 2.5, 0, TAU); ctx.fill(); }
    for (const x of [90, 900]) { ctx.fillStyle = '#e8e0f0'; ctx.fillRect(x - 30, 80, 60, 80); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x - 30, 80, 60, 80); ctx.fillStyle = '#9ad8f0'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x - 12 + k * 12, 110 + k * 12, 6, 0, TAU); ctx.fill(); } }
  },
  // B33 the cocoa tray: a midnight kitchen, tiled in mint, a big round clock, a counter at the right
  roomKitchen(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#d8f0e0'; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = '#a8d8bc'; ctx.lineWidth = 2; for (let x = 0; x < BG_W; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); }
    ctx.fillStyle = '#4a2a5a'; ctx.globalAlpha = 0.35; ctx.fillRect(0, 0, BG_W, H); ctx.globalAlpha = 1;
    for (const x of [200, 700]) { ctx.fillStyle = PLUM_LO; ctx.beginPath(); ctx.arc(x, 90, 44, 0, TAU); ctx.fill(); ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(x, 90, 36, 0, TAU); ctx.fill(); PstArt.hand(ctx, x, 90, 26, -1.9, MINT, 3); PstArt.hand(ctx, x, 90, 18, 0.4, HONEY, 3); }
    ctx.fillStyle = '#8a5a3a'; for (let x = 0; x < BG_W; x += 180) { ctx.fillRect(x + 20, 150, 140, 10); ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + 40 + k * 30, 142, 9, 0, TAU); ctx.fill(); } ctx.fillStyle = '#8a5a3a'; }
  },
  // B34 the bedposts: a nursery wall with nightcap wallpaper and a tall brass bed end
  roomNursery(ctx, L, rng, H) {
    ctx.fillStyle = '#a8c8f0'; ctx.fillRect(0, 0, BG_W, H);
    for (let y = 20; y < H; y += 60) for (let x = (y / 60 % 2) * 40; x < BG_W; x += 80) { ctx.fillStyle = '#c8dcf8'; ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.quadraticCurveTo(x + 10, y - 10, x + 24, y + 6); ctx.lineTo(x + 20, y + 18); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + 25, y + 6, 4, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 8; for (const x of [60, 960]) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x, 70); ctx.stroke(); ctx.fillStyle = '#e8c060'; ctx.beginPath(); ctx.arc(x, 62, 12, 0, TAU); ctx.fill(); }
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(60, 120); ctx.lineTo(960, 120); ctx.stroke();
  },
  // B35 the even pour: a warm-milk pantry: shelves of jugs and two mugs' shadows, a honey lamp
  roomPantry(ctx, L, rng, H) {
    ctx.fillStyle = '#f2d8b0'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#e8c898'; for (let x = 0; x < BG_W; x += 40) ctx.fillRect(x, 0, 18, H);
    ctx.fillStyle = '#8a5a3a'; for (const y of [70, 160]) { ctx.fillRect(0, y, BG_W, 10); for (let x = 30; x < BG_W; x += 90 + rng() * 40) { ctx.fillStyle = rng() < 0.5 ? '#ffffff' : MINT_HI; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 10, y - 30); ctx.lineTo(x + 8, y - 30); ctx.lineTo(x + 12, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8a5a3a'; } }
  },
  // A Little Privacy: Pupo's own bedroom: a round window with the moon, a striped wallpaper, a rug
  roomBedroom(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#5a3a6a'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#6a4a7a'; for (let x = 0; x < BG_W; x += 36) ctx.fillRect(x, 0, 14, H);
    ctx.fillStyle = '#2a1a3a'; ctx.beginPath(); ctx.arc(BG_W * 0.3, 110, 60, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a3070'; ctx.beginPath(); ctx.arc(BG_W * 0.3, 110, 52, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(BG_W * 0.3 + 14, 96, 16, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(BG_W * 0.3 - 52, 110); ctx.lineTo(BG_W * 0.3 + 52, 110); ctx.moveTo(BG_W * 0.3, 58); ctx.lineTo(BG_W * 0.3, 162); ctx.stroke();
    ctx.fillStyle = 'rgba(255,214,115,0.18)'; ctx.beginPath(); ctx.ellipse(BG_W * 0.7, b - 120, 160, 110, 0, 0, TAU); ctx.fill();
  }
};

/* ---------------- themes ---------------- */
const DUSK = ['#3a1a4a', '#7a3a6a', '#e89a7a'];
const T0 = { particles: 'none', rays: null, celestial: { type: 'none' }, stars: 0, fog: '#7a4a7a' };
const themes = {
  // 32-1 Hold That Thought: the dream cushions at dusk
  pst_cushion: Object.assign({}, cushionSet, T0, {
    name: 'Hold That Thought', music: 'tour_pst', sky: DUSK, horizonGlow: '#ffc07a', stars: 0.5,
    layers: [{ kind: 'pstSkyMoon', x: 820, y: 70, r: 30, sky: '#4a2050', base: 200, f: 0.02 }, { kind: 'pstWords', words: ['I', 'would', 'like', 'more...', '. . .', 'trip'], base: 220, f: 0.05 },
      { kind: 'pstPillows', color: '#9a4a7a', base: 330, amp: 44, f: 0.12 }, { kind: 'pstHands', base: 380, color: '#6ac08a', f: 0.2, alpha: 0.85 }, { kind: 'pstCushionPile', base: 420, color: '#c98a3a', dark: '#9a6420', hi: '#e8b060', front: '#6a2a4e', f: 0.32 }],
    fog: '#9a5a7a', decor: ['pstSlipper', 'pstLamp', 'pstSlipper']
  }),
  // 32-2 The Long Blink: close to Pupo's sleeping face, deep night
  pst_lid: Object.assign({}, velvetSet, T0, {
    name: 'The Long Blink', music: 'tour_pst_blink', sky: ['#1a0e2a', '#3a1e4a', '#6a3a6a'], horizonGlow: '#c87aa8', stars: 1.1,
    layers: [{ kind: 'pstFace', base: 300, f: 0.06 }, { kind: 'pstPillows', color: '#4a1e3e', base: 400, amp: 30, f: 0.22, dot: 'rgba(255,214,115,0.25)' }],
    fog: '#3a1e4a', decor: ['pstLamp', 'pstPillowPile']
  }),
  // 32-3 Half a Yawn: inside the yawn: warm pinks, feathers in the air
  pst_yawn: Object.assign({}, cushionSet, T0, {
    name: 'Half a Yawn', music: 'tour_pst', sky: ['#5a1a3a', '#8a2c52', '#c84a78'], horizonGlow: '#ff9ab8',
    layers: [{ kind: 'pstPalate', base: 320, f: 0.05 }, { kind: 'pstFeathers', base: 360, n: 16, f: 0.15 }, { kind: 'pstCushionPile', base: 430, color: '#d8a040', dark: '#a87020', hi: '#f8c868', front: '#8a2c52', f: 0.3 }],
    fog: '#8a2c52', decor: ['pstPillowPile', 'pstSlipper']
  }),
  // 32-4 Borrow a Second: the hourglass garden in a mint morning
  pst_hour: Object.assign({}, cushionSet, T0, {
    name: 'Borrow a Second', music: 'tour_pst_clock', sky: ['#2a6a6a', '#6ab8a8', '#e8f0c8'], horizonGlow: '#fff4c8',
    layers: [{ kind: 'pstClocks', base: 300, f: 0.06 }, { kind: 'pstGlassGarden', base: 380, stem: '#3a8a5a', color: '#4a9a6a', f: 0.16 }, { kind: 'pstHands', base: 430, color: MINT_HI, f: 0.3 }],
    fog: '#8ac8b0', decor: ['pstClockStand', 'pstSlipper']
  }),
  // 32-5 One Thought at a Time: the gallery of picture bubbles in cream light
  pst_picture: Object.assign({}, velvetSet, T0, {
    name: 'One Thought at a Time', music: 'tour_pst_clock', sky: ['#e8c8a0', '#f2dcb8', '#fff0d8'], horizonGlow: '#ffffff',
    layers: [{ kind: 'pstGallery', base: 330, color: '#e0b880', f: 0.08 }, { kind: 'pstPillows', color: '#c87a9a', base: 410, amp: 26, f: 0.22 }],
    fog: '#e8c8a0', decor: ['pstLamp', 'pstPillowPile']
  }),
  // 32-6 Finish My Sentence: the writing desk at night (the lead-in and the arena)
  pst_desk: Object.assign({}, deskSet, T0, {
    name: 'Finish My Sentence', music: 'tour_pst_boss', sky: ['#1a1430', '#2a2048', '#3a2a5a'], horizonGlow: '#ffd88a',
    layers: [{ kind: 'pstStudy', base: 380, f: 0.06 }, { kind: 'pstWords', words: ['I', 'would', 'like', 'more...'], base: 200, f: 0.1 }, { kind: 'pstShelves', base: 440, f: 0.24 }],
    fog: '#2a2048', decor: ['pstInkpot', 'pstLamp']
  }),
  // the six rooms
  pst_room_forts: Object.assign({}, cushionSet, T0, { name: 'Knock Knock', music: 'tour_pst_clock', sky: ['#1a1440', '#2a2050', '#3a2e66'], horizonGlow: '#8a8aff', layers: [{ kind: 'roomForts', base: 380, f: 0.04 }], fog: '#2a2050', decor: [] }),
  pst_room_lab: Object.assign({}, velvetSet, { ground: roomFloors.lab }, T0, { name: 'The Pillow Sample', music: 'tour_pst_blink', sky: ['#3a1030', '#4a1e3a', '#5a2646'], horizonGlow: '#ff8ac8', layers: [{ kind: 'roomPillowLab', base: 380, f: 0.04 }], fog: '#4a1e3a', decor: [] }),
  pst_room_kitchen: Object.assign({}, cushionSet, { ground: roomFloors.kitchen }, T0, { name: 'One Trip, Three Cocoas', music: 'tour_pst_clock', sky: ['#a8d8bc', '#c8e8d4', '#d8f0e0'], horizonGlow: '#ffffff', layers: [{ kind: 'roomKitchen', base: 380, f: 0.04 }], fog: '#8ab8a0', decor: [] }),
  pst_room_nursery: Object.assign({}, velvetSet, { ground: roomFloors.nursery }, T0, { name: 'Nightcap Stand', music: 'tour_pst', sky: ['#88a8e0', '#a8c8f0', '#c8dcf8'], horizonGlow: '#ffffff', layers: [{ kind: 'roomNursery', base: 380, f: 0.04 }], fog: '#88a8e0', decor: [] }),
  pst_room_pantry: Object.assign({}, cushionSet, { ground: roomFloors.pantry }, T0, { name: 'The Even Pour', music: 'tour_pst_clock', sky: ['#e8c898', '#f2d8b0', '#f8e8c8'], horizonGlow: '#ffffff', layers: [{ kind: 'roomPantry', base: 380, f: 0.04 }], fog: '#d8b888', decor: [] }),
  pst_room_bedroom: Object.assign({}, velvetSet, { ground: roomFloors.bedroom }, T0, { name: 'A Little Privacy', music: 'tour_pst_blink', sky: ['#3a2a4a', '#5a3a6a', '#6a4a7a'], horizonGlow: '#ffd673', layers: [{ kind: 'roomBedroom', base: 380, f: 0.04 }], fog: '#5a3a6a', decor: [] })
};

/* ---------------- props (Decor: drawn each frame at a ground spot) ---------------- */
const decor = {
  // a fluffy slipper someone kicked off (Pupo's, much too big)
  pstSlipper(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; const s = (d % 2) ? -1 : 1; ctx.translate(x, y); ctx.scale(s, 1);
    ctx.fillStyle = PLUM_HI; ctx.beginPath(); ctx.ellipse(0, -7, 20, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CREAM; ctx.beginPath(); ctx.ellipse(8, -11, 10, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(2 + k * 6, -15, 3, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a little bedside lamp with a honey shade
  pstLamp(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = MINT_LO; ctx.fillRect(x - 2, y - 40, 4, 38); ctx.strokeRect(x - 2, y - 40, 4, 38);
    ctx.fillStyle = PLUM; ctx.beginPath(); ctx.ellipse(x, y - 2, 12, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = HONEY; ctx.beginPath(); ctx.moveTo(x - 10, y - 40); ctx.lineTo(x + 10, y - 40); ctx.lineTo(x + 16, y - 58); ctx.lineTo(x - 16, y - 58); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = `rgba(255,230,160,${0.18 + 0.05 * Math.sin(t * 2)})`; ctx.beginPath(); ctx.moveTo(x - 10, y - 40); ctx.lineTo(x + 10, y - 40); ctx.lineTo(x + 30, y - 4); ctx.lineTo(x - 30, y - 4); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  // a soft heap of little pillows
  pstPillowPile(ctx, x, y, t, th, d) {
    ctx.save(); PstArt.cushion(ctx, x - 22, y - 16, 30, 16, PLUM_HI, PLUM_LO, '#e08ab4'); PstArt.cushion(ctx, x - 4, y - 18, 28, 18, HONEY, HONEY_LO, HONEY_HI); PstArt.cushion(ctx, x - 12, y - 30, 26, 14, MINT, MINT_LO, MINT_HI); ctx.restore();
  },
  // a mint clock hand on a stand (the hourglass garden)
  pstClockStand(ctx, x, y, t, th, d) { ctx.save(); ctx.fillStyle = PLUM_LO; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillRect(x - 6, y - 6, 12, 6); ctx.strokeRect(x - 6, y - 6, 12, 6); PstArt.hand(ctx, x, y - 6, 34, -Math.PI / 2 + Math.sin(t * 0.7 + d) * 0.4, MINT, 3); ctx.restore(); },
  // an inkpot with a quill (the desk)
  pstInkpot(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = '#2a2a4a'; rr(ctx, x - 10, y - 16, 20, 16, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8b8f0'; ctx.fillRect(x - 6, y - 19, 12, 4); ctx.strokeRect(x - 6, y - 19, 12, 4);
    PstArt.feather(ctx, x + 10, y - 34, 34, -1.1);
    ctx.restore();
  }
};

/* ---------------- door looks: a round nook in a cushion (quiet, hidden ways) and the bedroom door ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'pstNook' || look === 'pstDoor') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (look === 'pstNook') {
        // a round, dark hole in a soft plum cushion: the land's hidden ways all look like this
        ctx.fillStyle = PLUM; ctx.beginPath(); ctx.ellipse(x, y - 30, 26, 32, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1a0a14'; ctx.beginPath(); ctx.ellipse(x, y - 26, 16 + (near ? 2 : 0), 24 + (near ? 2 : 0), 0, 0, TAU); ctx.fill();
        ctx.fillStyle = HONEY; ctx.beginPath(); ctx.arc(x - 20, y - 52, 2.4, 0, TAU); ctx.arc(x + 20, y - 52, 2.4, 0, TAU); ctx.fill();
        // the lone z drifting up out of it (the land's tell)
        const k = (t * 0.5) % 1; PstArt.z(ctx, x + Math.sin(k * 6) * 4, y - 40 - k * 34, 7, 0.9 * (1 - k));
      } else {
        ctx.fillStyle = '#7a4a2a'; rr(ctx, x - 20, y - 60, 40, 60, 16); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#9a6a40'; rr(ctx, x - 14, y - 52, 28, 22, 10); ctx.fill(); rr(ctx, x - 14, y - 26, 28, 22, 4); ctx.fill();
        ctx.fillStyle = HONEY; ctx.beginPath(); ctx.arc(x + 12, y - 28, 3, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = CREAM; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('zzz', x, y - 40);
      }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// PILLOW LOUSE: a grumpy plum bug under a buttoned honey cushion shell. It fluffs its landing before every jump:
// the shell puffs up and a little cloud of fluff comes out (the 0.6 s tell), then it hops at Brady.
const louseArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const fluff = e.fluffK || 0, air = m === 'hop';
  // the little plum legs
  ctx.strokeStyle = PLUM_LO; ctx.lineWidth = 2.4; const st = air ? 3 : Math.sin(t * 12) * 1.5;
  for (const lx of [-8, -2, 4]) { ctx.beginPath(); ctx.moveTo(lx, -6); ctx.lineTo(lx + st, 0); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  // the head peeking out at the front, with two antennae
  ctx.fillStyle = PLUM; ctx.beginPath(); ctx.arc(10, -9, 6.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(11, -14); ctx.quadraticCurveTo(14, -24, 19, -22); ctx.moveTo(8, -15); ctx.quadraticCurveTo(8, -25, 13, -26); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(12.5, -10, 2.6, 2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = INK; ctx.fillRect(12, -10.5, 2, 1.6); ctx.beginPath(); ctx.moveTo(10, -12.5); ctx.lineTo(15, -12); ctx.stroke();
  // the cushion shell (puffs up with the fluff tell)
  const sw = 26 + fluff * 6, sh = 16 + fluff * 6;
  PstArt.cushion(ctx, -16 - fluff * 3, -8 - sh, sw, sh, HONEY, HONEY_LO, HONEY_HI);
  ctx.fillStyle = CREAM; ctx.beginPath(); for (let k = 0; k < 6; k++) ctx.arc(-14 + k * 5 - fluff * 3, -8, 3, 0, Math.PI); ctx.fill();
  if (fluff > 0.1) { ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-18 + k * 8 + Math.sin(t * 20 + k) * 2, -2 + Math.cos(t * 17 + k) * 2, 3 + fluff * 2, 0, TAU); ctx.fill(); } }
  ctx.restore();
};
// SECONDHAND SLUG: a mint slug with a clock hand on one feeler. When Brady comes near it stops and points out a
// shortcut it has never taken ("SHORTCUT!", always somewhere silly), then slimes on.
const slugArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const point = m === 'notice', wob = Math.sin(t * 5) * 1.2;
  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.ellipse(0, -2, 17, 3.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = MINT; ctx.beginPath(); ctx.moveTo(-17, -1); ctx.quadraticCurveTo(-12, -10 + wob, 0, -9); ctx.quadraticCurveTo(8, -9, 9, -16); ctx.quadraticCurveTo(14, -26, 18, -16); ctx.quadraticCurveTo(19, -4, 15, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = MINT_LO; for (const [sx, sy] of [[-10, -4], [-4, -6], [2, -5]]) { ctx.beginPath(); ctx.arc(sx, sy, 1.6, 0, TAU); ctx.fill(); }
  // the feelers: one ordinary eye stalk, one wearing a clock hand
  ctx.beginPath(); ctx.moveTo(12, -20); ctx.lineTo(10, -30); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(10, -31, 3.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(11, -31, 1.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(15, -20); ctx.lineTo(18, -30); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(18, -31, 3.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(19, -31, 1.5, 0, TAU); ctx.fill();
  PstArt.hand(ctx, 18, -36, 12, point ? -0.2 + Math.sin(t * 10) * 0.15 : -1.1, HONEY, 2);
  // the mouth: open and shouting when it points
  ctx.fillStyle = point ? '#c84a78' : INK; ctx.beginPath(); if (point) ctx.ellipse(17, -17, 2.4, 3, 0, 0, TAU); else ctx.arc(17, -17, 1, 0, TAU); ctx.fill();
  // the little arm it points with
  if (point) { ctx.fillStyle = MINT; ctx.beginPath(); ctx.ellipse(20, -11, 6, 2.5, -0.3, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
// NAPKIN BAT: a plum bat wrapped in a stitched cream napkin. Mid-flight it folds itself into a blanket and glides
// flat (a tell: it wraps up for half a second); folded flat it is something to bounce on.
const batArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const k = e.foldK || 0;
  if (k > 0.6) {
    // the flat blanket: a stitched cream sheet with the bat's head on top, asleep
    const wav = Math.sin(t * 8) * 2;
    ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(-22, -2 + wav); ctx.quadraticCurveTo(0, -8 - wav, 22, -2 + wav); ctx.lineTo(20, 4); ctx.quadraticCurveTo(0, 0 + wav, -20, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.setLineDash([2, 3]); ctx.strokeStyle = CREAM_LO; ctx.beginPath(); ctx.moveTo(-17, 0); ctx.quadraticCurveTo(0, -4 - wav, 17, 0); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = INK;
    ctx.fillStyle = PLUM; ctx.beginPath(); ctx.arc(4, -8, 6, 0, TAU); ctx.fill(); ctx.stroke();
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(4 + s * 3, -12); ctx.lineTo(4 + s * 7, -19); ctx.lineTo(4 + s * 7.5, -10); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(1, -8); ctx.lineTo(3, -7); ctx.moveTo(5, -8); ctx.lineTo(7, -7); ctx.stroke();
    ctx.restore(); return;
  }
  const flap = Math.sin(t * 14) * (1 - k);
  // the napkin wings (fold in as k grows)
  ctx.fillStyle = CREAM;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 4, -10); ctx.lineTo(s * (20 - k * 14), -14 - flap * 8); ctx.lineTo(s * (24 - k * 16), 4 - flap * 4); ctx.lineTo(s * (8 - k * 2), 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.setLineDash([2, 3]); ctx.strokeStyle = CREAM_LO; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 6, -8); ctx.lineTo(s * (18 - k * 12), 2); ctx.stroke(); } ctx.setLineDash([]); ctx.strokeStyle = INK;
  // the bat: plum head and ears, a little fang
  ctx.fillStyle = PLUM; ctx.beginPath(); ctx.ellipse(0, -8, 8, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 3, -15); ctx.lineTo(s * 8, -25); ctx.lineTo(s * 9, -12); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#ffffff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 3.5, -9, 2.6, 0, TAU); ctx.fill(); } ctx.fillStyle = INK; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 3.5 + 0.8, -9, 1.2, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(1, -4); ctx.lineTo(3, -4); ctx.lineTo(2, -1); ctx.closePath(); ctx.fill();
  ctx.restore();
};
// SNORE PEA: a mint blob with a leaf sprout. It inflates on the inhale (cheeks out, eyes shut) and on the exhale
// rolls precisely one tile with a little "PUH". Big, it is too round to stomp: Brady bounces off.
const peaArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  if (m === 'flat') ctx.scale(1.3, 0.4);
  const k = e.puffK || 1, r = 11 * k, roll = e.rollA || 0;
  ctx.save(); ctx.translate(0, -r); ctx.rotate(roll);
  ctx.fillStyle = MINT; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = MINT_HI; ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.32, r * 0.2, -0.5, 0, TAU); ctx.fill();
  ctx.restore();
  // the face stays upright: closed eyes, rosy cheeks, the snore mouth
  ctx.fillStyle = 'rgba(176,80,126,0.55)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * r * 0.55, -r * 0.8, r * 0.22, r * 0.16, 0, 0, TAU); ctx.fill(); }
  ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(s * r * 0.48 - 3, -r * 1.15); ctx.quadraticCurveTo(s * r * 0.48, -r * 1.05, s * r * 0.48 + 3, -r * 1.15); } ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, -r * 0.72, k > 1.25 ? 1.4 : 2.4, k > 1.25 ? 1.4 : 2.8, 0, 0, TAU); ctx.fill();
  // the leaf sprout
  ctx.fillStyle = '#6ac04a'; ctx.beginPath(); ctx.moveTo(0, -r * 2); ctx.quadraticCurveTo(-9, -r * 2 - 9, -12, -r * 2 - 2); ctx.quadraticCurveTo(-5, -r * 2 + 1, 0, -r * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -r * 2); ctx.quadraticCurveTo(8, -r * 2 - 10, 11, -r * 2 - 3); ctx.quadraticCurveTo(5, -r * 2 + 1, 0, -r * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
};
const louseThink = (e, dt) => {
  const p = e.g.player; e.hopCool = e.hopCool == null ? 1.2 + Math.random() : e.hopCool;
  if (!e.onGround) { e.mode = 'hop'; e.fluffK = approach(e.fluffK || 0, 0, dt * 4); return; }
  if (e.fluffT > 0) {
    // the tell: it fluffs its landing spot, shell puffed, for 0.6 s
    e.fluffT -= dt; e.vx = 0; e.mode = 'idle'; e.fluffK = approach(e.fluffK || 0, 1, dt * 5);
    if (e.fluffT <= 0) { if (p && TourKit.near(e, p, 9, 4)) e.dir = sign(p.cx - e.cx) || e.dir; e.vy = -9 * TS; e.vx = e.dir * 2.4 * TS; e.onGround = false; e.hopCool = 1.8; if (e.g.onScreen(e)) e.g.burst(e.cx, e.y + e.h, 4, '#fff4dc', 'dust'); }
    return;
  }
  e.fluffK = approach(e.fluffK || 0, 0, dt * 4); e.mode = 'walk'; e.vx = e.dir * e.speed * 0.5;
  e.hopCool -= dt;
  if (e.hopCool <= 0) { e.fluffT = 0.6; if (e.g.onScreen(e)) { pstSay(e.g, e.cx, e.y - 10, 'FLUFF FLUFF', '#fff4dc'); TourKit.sfx('fluff', 'select', { vol: 0.3, pitch: 1.6 }); } }
};
const slugThink = (e, dt) => {
  const p = e.g.player;
  e.pointT = (e.pointT || 0) - dt; e.pcool = (e.pcool || 0) - dt;
  if (e.pointT > 0) { e.vx = 0; e.mode = 'notice'; return; }
  if (e.pcool <= 0 && p && TourKit.near(e, p, 6, 3)) {
    e.pointT = 1.4; e.pcool = 4; e.vx = 0; e.dir = sign(p.cx - e.cx) || e.dir;
    pstSay(e.g, e.cx, e.y - 34, pick(['SHORTCUT! THAT WAY!', 'IT\'S QUICKER UP THERE!', 'I\'VE HEARD IT\'S FASTER!', 'TAKE THE LONG WAY ROUND!']), '#c4f2d2');
    return;
  }
  e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed;
};
const batThink = (e, dt) => {
  // home: its spawn; a sine path; every few seconds it wraps up and glides flat across, then flaps back
  if (e.hx == null) { e.hx = e.x; e.hy = e.y; e.ph = Math.random() * 6; e.cyc = 1.5 + Math.random(); }
  e.t2 = (e.t2 || 0) + dt; e.cyc -= dt; e.noWalk = true;
  const P0 = 2.4, glide = e.foldT != null;
  if (!glide && e.cyc <= 0) { e.foldT = 0; e.gdir = e.dir; }
  if (e.foldT != null) {
    e.foldT += dt;
    e.foldK = e.foldT < 0.5 ? e.foldT / 0.5 : e.foldT < 2.1 ? 1 : Math.max(0, 1 - (e.foldT - 2.1) / 0.4);
    if (e.foldT > 0.5 && e.foldT < 2.1) { e.x += e.gdir * 2.6 * TS * dt; e.y = approach(e.y, e.hy + 18, 30 * dt); }
    if (e.foldT >= 2.5) { e.foldT = null; e.cyc = P0 + Math.random(); e.dir = -e.gdir; }
    e.mode = 'fly';
  } else {
    e.foldK = 0; const dx = e.hx - e.x; e.x += clamp(dx, -1, 1) * 1.6 * TS * dt + Math.sin(e.t2 * 1.4 + e.ph) * 0.5;
    e.y = approach(e.y, e.hy + Math.sin(e.t2 * 2.2 + e.ph) * 14, 60 * dt); e.mode = 'fly';
    if (Math.abs(dx) > 4) e.dir = sign(dx);
  }
  e.vx = 0; e.vy = 0;
};
const peaThink = (e, dt) => {
  // breathe: in (swell) for 1.6 s, out: one roll of exactly one tile, rest
  e.bt2 = (e.bt2 || 0) + dt; const T = 3.2, q = e.bt2 % T;
  if (q < 1.6) { e.puffK = 1 + 0.55 * (q / 1.6); e.vx = 0; e.mode = 'idle'; e.rolled = false; }
  else if (q < 2.2) {
    e.puffK = approach(e.puffK, 1, dt * 3);
    if (!e.rolled) { e.rolled = true; e.rx0 = e.x; const p = e.g.player; if (p && TourKit.near(e, p, 8, 3)) e.dir = sign(p.cx - e.cx) || e.dir; if (e.g.onScreen(e)) pstSay(e.g, e.cx, e.y - 8, 'puh', '#c4f2d2'); }
    const tgt = e.rx0 + e.dir * TS, k = (q - 1.6) / 0.6;
    const nx = lerp(e.rx0, tgt, Math.min(1, k * 1.3));
    // one tile, unless a wall or a ledge is in the way
    const A = e.g.area, ahead = Math.floor((e.dir > 0 ? nx + e.w : nx) / TS), foot = Math.floor((e.y + e.h + 2) / TS), mid = Math.floor((e.y + e.h - 4) / TS);
    if (!SOLID[tileAt(A, ahead, mid)] && (SOLID[tileAt(A, ahead, foot)] || tileAt(A, ahead, foot) === T.SEMI)) { e.rollA = (e.rollA || 0) + (nx - e.x) / 11; e.x = nx; } else e.dir = -e.dir;
    e.vx = 0; e.mode = 'roll';
  } else { e.puffK = 1; e.vx = 0; e.mode = 'idle'; }
  // keep the body box the size it is drawn
  const k = e.puffK || 1, b = e.y + e.h, cx = e.x + e.w / 2; e.w = 22 * k; e.h = 22 * k; e.x = cx - e.w / 2; e.y = b - e.h;
};
const enemies = {
  pstLouse: { cls: TourEnemy.make({ w: 26, h: 22, speed: 1.0, behavior: 'hop', art: louseArt, burst: HONEY_HI, think: louseThink, inkPad: 10 }), place: 'walk' },
  pstSlug: { cls: TourEnemy.make({ w: 30, h: 20, speed: 0.6, behavior: 'walk', edgeTurn: true, art: slugArt, burst: MINT_HI, think: slugThink, inkPad: 18 }), place: 'walk' },
  pstBat: { cls: TourEnemy.make({ w: 26, h: 22, speed: 1.0, behavior: 'fly', art: batArt, burst: CREAM, think: batThink, inkPad: 14 }), place: 'fly' },
  pstPea: { cls: TourEnemy.make({ w: 22, h: 22, speed: 0, behavior: 'still', art: peaArt, burst: MINT_HI, think: peaThink, inkPad: 16 }), place: 'walk' }
};
// the bat folded flat and the pea puffed up: a stomp bounces Brady off (they're too soft to squash)
{
  const B = enemies.pstBat.cls, h0 = B.prototype.hit;
  B.prototype.hit = function (kind, src) { if ((kind === 'stomp' || kind === 'spin') && (this.foldK || 0) > 0.6) { Sound.play('spring', { vol: 0.35, pitch: 1.4 }); return 'bounce'; } return h0.call(this, kind, src); };
  const Pe = enemies.pstPea.cls, h1 = Pe.prototype.hit;
  Pe.prototype.hit = function (kind, src) { if ((kind === 'stomp' || kind === 'spin') && (this.puffK || 1) > 1.3) { Sound.play('spring', { vol: 0.35, pitch: 1.2 }); pstSay(this.g, this.cx, this.y - 6, 'SNRK', '#c4f2d2'); return 'bounce'; } return h1.call(this, kind, src); };
}

/* ---------------- the route map: a sleepy crescent pillow in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save();
  ctx.fillStyle = HONEY; ctx.beginPath(); ctx.ellipse(x, y + r * 0.1, r * 0.9, r * 0.6, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = HONEY_LO; ctx.lineWidth = Math.max(1, r * 0.08); ctx.beginPath(); ctx.moveTo(x - r * 0.5, y - r * 0.2); ctx.lineTo(x + r * 0.5, y + r * 0.4); ctx.moveTo(x + r * 0.5, y - r * 0.2); ctx.lineTo(x - r * 0.5, y + r * 0.4); ctx.stroke();
  const k = (t * 0.5) % 1; PstArt.z(ctx, x + r * 0.5, y - r * 0.6 - k * r * 0.6, r * 0.35, 1 - k, '#ffffff');
  ctx.restore();
};

/* ---------------- the land's map: sprites and the dream's ground ---------------- */
Object.assign(TourOWPaint.art, {
  // a buttoned cushion hill
  pstCushion(c, r) { PstArt.cushion(c, -r, -r * 0.7, r * 2, r * 0.9); },
  // a thought bubble on its tail
  pstBubble(c, r) { PstArt.bubble(c, -r, -r * 1.4, r * 2, r * 0.9); PstArt.tail(c, -r * 0.3, -r * 0.4, -r * 0.8, r * 0.1, 3, r * 0.14); },
  // a big hourglass flower
  pstGlass(c, r) { c.strokeStyle = MINT_LO; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r); c.stroke(); PstArt.hourglass(c, 0, -r * 1.5, r * 0.5, 0.6); },
  // the writing desk with its lamp
  pstDesk(c, r) {
    c.fillStyle = '#7a4a2a'; c.fillRect(-r, -r * 0.5, r * 2, r * 0.3); c.strokeRect(-r, -r * 0.5, r * 2, r * 0.3); c.fillRect(-r * 0.9, -r * 0.2, r * 0.2, r * 0.6); c.fillRect(r * 0.7, -r * 0.2, r * 0.2, r * 0.6);
    c.fillStyle = '#fff4dc'; c.fillRect(-r * 0.6, -r * 0.62, r * 0.7, r * 0.12);
    c.fillStyle = HONEY; c.beginPath(); c.moveTo(r * 0.3, -r * 0.9); c.lineTo(r * 0.7, -r * 0.9); c.lineTo(r * 0.8, -r * 1.2); c.lineTo(r * 0.2, -r * 1.2); c.closePath(); c.fill(); c.stroke();
  },
  // the big closed eye
  pstEye(c, r) { PstArt.lid(c, 0, -r * 0.4, r * 2, 0, r * 0.3); }
});
// a quilt edge instead of a coast: a stitched plum hem around a honey patchwork
TourOWLands.coast.pstQuilt = function (c, ow, ring) {
  const L = ow.look, ink = this.INK;
  c.save(); c.translate(8, 12); OWGeo.path(c, ring, true); c.fillStyle = 'rgba(30,10,30,0.4)'; c.fill(); c.restore();
  c.save(); c.translate(0, 6); OWGeo.path(c, ring, true); c.fillStyle = PLUM_LO; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
  c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = PLUM; c.lineWidth = 14; OWGeo.path(c, ring, true); c.stroke(); c.strokeStyle = CREAM; c.lineWidth = 2; c.setLineDash([6, 6]); OWGeo.path(c, ring, true); c.stroke(); c.setLineDash([]); c.restore();
  OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.8; c.stroke();
};
// the dream's ground under the trails: a patchwork of tufted squares, a few drifting z's
TourOWScenes.groundPaint.pst = function (c, ow) {
  const R = TourOWPaint.rng('pstground');
  c.save(); c.lineWidth = 1.2;
  for (let y = 120; y < 760; y += 70) for (let x = 140; x < 1420; x += 70) { c.strokeStyle = 'rgba(160,100,30,0.22)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 70, y + 70); c.moveTo(x + 70, y); c.lineTo(x, y + 70); c.stroke(); c.fillStyle = 'rgba(122,47,90,0.3)'; c.beginPath(); c.arc(x + 35, y + 35, 3, 0, TAU); c.fill(); }
  for (let k = 0; k < 14; k++) PstArt.z(c, 200 + R() * 1100, 160 + R() * 520, 8 + R() * 8, 0.35, PLUM);
  c.restore();
};
TourLandscape.looks.pst = ['#3a1a4a', '#7a3a6a', '#5e1f42', HONEY, HONEY_HI, CREAM, 'pstCushion'];
{
  // the land's landmark miniature: a fat cushion with a z over it
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'pstCushion') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40);
    PstArt.cushion(ctx, -24, -22, 48, 22); PstArt.z(ctx, 10, -34, 10, 1, '#ffffff');
    ctx.restore();
  };
}

/* ---------------- music: a slow lullaby waltz for the cushions, a hushed music box for the blink, a ticking
   clockwork shuffle for the garden and the gallery, and the parrot's squawking tarantella ---------------- */
const tracks = {
  tour_pst: {
    bpm: 84, bpb: 3, bars: 8, rv: 0.5, dl: 0.2, hx: 0.04,
    ch: 'F Dm Bb C F Am Bb C',
    ld: 'C6:6 A5:3 F5:3 | D6:6 C6:6 | Bb5:3 D6:3 F6:6 | E6:12 | F6:6 E6:3 D6:3 | C6:6 A5:6 | Bb5:3 C6:3 D6:3 Bb5:3 | C6:12',
    li: 'mbox', lv: 0.13,
    bp: 'r.....f.....', bi: 'sub', bv: 0.26,
    ap: 'c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 60,
    dr: ['k...........', '......s.....', '....h.....h.'], dv: 0.16
  },
  tour_pst_blink: {
    bpm: 70, bars: 8, rv: 0.6, dl: 0.3, hx: 0.03,
    ch: 'Am7 Fmaj7 Cmaj7 G Am7 Fmaj7 Dm7 E7',
    ld: 'E6:8 C6:8 | A5:8 C6:4 E6:4 | G6:8 E6:8 | D6:16 | E6:4 A6:4 G6:8 | F6:8 E6:4 C6:4 | D6:4 F6:4 A6:8 | G#6:16',
    li: 'glass', lv: 0.12,
    bp: 'r.......r.......', bi: 'sub', bv: 0.22,
    ap: 'c...c...c...c...', ai: 'mbox', av: 0.05, ao: 64,
    dr: ['k...............', '........s.......', '....h.......h...'], dv: 0.1
  },
  tour_pst_clock: {
    bpm: 108, bars: 8, rv: 0.3, sw: 0.12, hx: 0.05,
    ch: 'C Am Dm G C Am F G',
    ld: 'E6:2 G6:2 C7:4 B6:2 G6:2 E6:4 | A6:4 C7:4 E6:8 | F6:2 A6:2 D7:4 C7:2 A6:2 F6:4 | G6:4 B6:4 D7:8 |' +
        'C7:2 B6:2 A6:2 G6:2 E6:4 G6:4 | A6:2 G6:2 E6:2 C6:2 A5:8 | F6:2 G6:2 A6:2 C7:2 A6:4 F6:4 | G6:4 F6:4 D6:8',
    li: 'pluck', lv: 0.12,
    bp: 'r..r..f.r..r.f..', bi: 'slapb', bv: 0.26,
    ap: 'c.c.c.c.c.c.c.c.', ai: 'mbox', av: 0.045, ao: 62,
    dr: ['k.......k.......', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.28
  },
  tour_pst_boss: {
    bpm: 138, bars: 8, rv: 0.3, hx: 0.07,
    ch: 'Dm Dm A A Dm Gm A7 Dm',
    ld: 'A5:2 D6:2 F6:2 A6:2 G6:2 F6:2 E6:4 | C#6:2 E6:2 A6:4 G6:4 E6:4 | D6:2 F6:2 A6:2 D7:2 C7:2 A6:2 F6:4 | E6:4 C#6:4 A5:8 |' +
        'F6:2 A6:2 D7:4 C7:2 Bb6:2 A6:4 | G6:2 Bb6:2 D7:4 C7:4 Bb6:4 | A6:2 G6:2 F6:2 E6:2 C#6:4 E6:4 | D6:4 F6:4 D7:8',
    li: 'brass', lv: 0.14,
    bp: 'r.f.r.f.r.f.r-o-', bi: 'slapb', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'pluck', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s..s', 'h.h.h.h.h.h.h.h.'], dv: 0.42
  }
};

Tour.country({
  id: 'pst', colors: COL, tagline: 'A hidden land between two of Pupo\'s words',
  themes, painters, decor, enemies, tracks,
  music: { level: 'tour_pst', boss: 'tour_pst_boss', map: null },
  landmark: 'the pause in Pupo\'s sentence', emblem,
  arrival: 'Brady! Pupo said "I would like more..." at breakfast and he is still on the next word. There is a whole holiday in the gap. I have unpacked. Bring the biscuits. ♥ C',
  coin: { name: 'SNOOZE', draw(ctx, x, y) {
    ctx.fillStyle = HONEY; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
    ctx.fillStyle = HONEY_HI; ctx.beginPath(); ctx.arc(x - 1, y - 1, 6, 0, TAU); ctx.fill();
    ctx.strokeStyle = PLUM; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - 3.5, y - 3.5); ctx.lineTo(x + 3.5, y - 3.5); ctx.lineTo(x - 3.5, y + 3.5); ctx.lineTo(x + 3.5, y + 3.5); ctx.stroke();
  } },
  levels: []
});
Object.assign(TourLandscape.ARCH_LABEL, { delay: 'DELAY', blink: 'BLINK', yawn: 'YAWN', borrow: 'BORROW', thought: 'THOUGHT' });
// for the other pst files and the tests
// every floating call-out in the land: a dark rounded pill, kept in the middle band of the view and off Brady
class PstSay extends Ent {
  constructor(g, x, y, text, col) { super(g, { x, y }, 10, 10); this.x = x; this.y0 = y; this.text = String(text); this.col = col || '#fff4dc'; this.t = 0; this.friendly = true; }
  update(dt) { this.t += dt; if (this.t > 1.8) this.remove = true; }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, p = g.player, W = Game.viewW, H = Game.viewH;
    ctx.save(); ctx.font = '11px ' + FONT_DISPLAY; const w = ctx.measureText(this.text).width + 18, h = 20;
    let x = clamp(this.x, g.camX + 150 + w / 2, g.camX + W - 150 - w / 2), y = clamp(this.y0 - Math.min(1, this.t * 2) * 14, g.camY + 84, g.camY + H - 140);
    if (p && Math.abs(x - p.cx) < w / 2 + 14 && y + h / 2 > p.y - 6 && y - h / 2 < p.y + p.h) y = p.y - 22;
    ctx.globalAlpha = Math.min(1, (1.8 - this.t) * 3);
    ctx.fillStyle = 'rgba(26,12,30,0.82)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,214,115,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = this.col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.text, x, y + 1);
    ctx.restore();
  }
}
const pstSay = (g, x, y, text, col) => { if (!g || !g.spawn) return; for (const e of g.entities) if (e instanceof PstSay && !e.remove && Math.abs(e.y0 - y) < 30 && Math.abs(e.x - x) < 200) e.remove = true; g.spawn(new PstSay(g, x, y, text, col)); };
Tour.pstKit = { say: pstSay, COL, INK, PstArt, HONEY, HONEY_HI, HONEY_LO, PLUM, PLUM_HI, PLUM_LO, MINT, MINT_HI, MINT_LO, CREAM, CREAM_LO };
})();
