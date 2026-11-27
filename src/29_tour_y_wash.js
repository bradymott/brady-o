/* ============================================================
   WRONG SIDE OF THE WASH (world 26, cc 'wash'): a hidden land (docs/handoff/HIDDEN_LAND_BRIEF.md, A1 of
   docs/design/CHATGPT_RELAY.md). Piwi hung the tour laundry across two rooftops; a whole neighbourhood lives on the
   side of the sheets nobody sees. Vermilion pegs, cream linen, navy checks, a mint sky. A foe behind a sheet leaves a
   single broad silhouette.
   Found only through France: on the bakery's rear balcony in 7-1 one cream sheet hangs from one red peg, and that
   peg's shadow falls on the FRONT of the fabric (29_tour_y_wash_zdoor.js).
   This file: the route stop, the looks (tiles, themes, painted backdrops, props), the critters (Peg Beetle, Lint
   Lamb, Hanger Heron, Sock Moth), the route-map emblem, the map's sprites and painters, the music, the country.
   The drying nets (26-1's climbing): 29_tour_y_wash_a_net.js. The other stages' laundry: 29_tour_y_wash_b_mech.js.
   The boss: 29_tour_y_wash_c_boss.js. The secret rooms: 29_tour_y_wash_d_rooms.js. The levels and the land's map:
   29_tour_y_wash_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'wash', world: 26, name: 'Wrong Side of the Wash', sub: 'a hidden land', lon: -9, lat: 45.2, secret: true, bonus: true, d0: 0.8, pin: 'peg' });
const COL = { a: '#e8442e', b: '#23305e', c: '#f4ead2' };
const INK = '#1a1426';
const RED = '#e8442e', RED_D = '#b8301e', CREAM = '#f4ead2', CREAM_D = '#dccfb0', NAVY = '#23305e', NAVY_L = '#3e4f8e', MINT = '#bfe8d6', MINT_D = '#8fcab2';
const K = TourKit;

/* ---------------- shared drawings ---------------- */
const WashArt = {
  INK, RED, RED_D, CREAM, CREAM_D, NAVY, NAVY_L, MINT, MINT_D,
  // a red clothes peg (two prongs and a spring), standing up (rot 0) at (x, y) = its bottom; s = scale
  peg(ctx, x, y, s, rot, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s || 1, s || 1);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = col || RED;
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-4, -22); ctx.lineTo(-0.5, -22); ctx.lineTo(-1, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(4, -22); ctx.lineTo(0.5, -22); ctx.lineTo(1, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d8d2c8'; ctx.beginPath(); ctx.arc(0, -10, 2.6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a gingham patch: cream ground, navy bands every `step` px (alpha a for the bands)
  gingham(ctx, x, y, w, h, step, a, base) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = base || CREAM; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = `rgba(35,48,94,${a == null ? 0.42 : a})`;
    const st = step || 12;
    for (let xx = x - ((x % (st * 2)) + st * 2) % (st * 2); xx < x + w; xx += st * 2) ctx.fillRect(xx, y, st, h);
    for (let yy = y - ((y % (st * 2)) + st * 2) % (st * 2); yy < y + h; yy += st * 2) ctx.fillRect(x, yy, w, st);
    ctx.restore();
  },
  // a sagging washing line from (x0, y0) to (x1, y1)
  line(ctx, x0, y0, x1, y1, sag, col) {
    ctx.save(); ctx.strokeStyle = col || '#8a7a62'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + (sag || 14), x1, y1); ctx.stroke(); ctx.restore();
  },
  // a sock: cuff at (x, y), hanging down, stripes; flip = toe to the left
  sock(ctx, x, y, s, col, stripe, flip) {
    ctx.save(); ctx.translate(x, y); ctx.scale((flip ? -1 : 1) * (s || 1), s || 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.fillStyle = col || CREAM;
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(6, 18); ctx.quadraticCurveTo(6, 26, 14, 26); ctx.quadraticCurveTo(20, 27, 18, 33); ctx.lineTo(0, 33); ctx.quadraticCurveTo(-7, 32, -6, 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = stripe || NAVY; ctx.fillRect(-6, 3, 12, 2.5); ctx.fillRect(-6, 8, 12, 2.5);
    ctx.restore();
  },
  // a folded cream bundle (the prize parcel)
  bundle(ctx, x, y, w, h) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = CREAM;
    rr(ctx, x - w / 2, y - h, w, h, 6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = NAVY_L; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; rr(ctx, x - w / 2 + 3, y - h + 3, w - 6, h - 6, 4); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  },
  // a broad hatched silhouette (something on the far side of a sheet)
  hatch(ctx, draw, a) {
    ctx.save(); ctx.globalAlpha = a == null ? 0.55 : a; draw(ctx); ctx.restore();
  },
  // a prompt on a dark rounded pill (never bare text over the sky or a character)
  pill(ctx, x, y, text, col, a) {
    ctx.save(); ctx.globalAlpha *= a == null ? 1 : a; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 14, h = 17; ctx.fillStyle = 'rgba(20,14,30,0.85)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = col || '#ffd84a'; ctx.fillText(text, x, y + 1); ctx.restore();
  },
  // the land's tell: a sock moth peering out of a little nibbled peephole (it blinks; when Brady is near, it ducks)
  peephole(ctx, x, y, t, shy) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.fillStyle = '#2a2236'; ctx.beginPath();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, r = 9 + (k % 2 ? 2.2 : 0); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!shy) {
      const bl = Math.sin(t * 1.3) > 0.94;
      ctx.fillStyle = '#ffffff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * 3.4, y, 2.6, bl ? 0.4 : 3, 0, 0, TAU); ctx.fill(); }
      if (!bl) { ctx.fillStyle = INK; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * 3.4 + Math.sin(t * 0.7) * 0.8, y + 0.6, 1.3, 0, TAU); ctx.fill(); } }
      ctx.strokeStyle = '#c86a3a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 3, y - 6); ctx.quadraticCurveTo(x - 6, y - 12, x - 9, y - 12); ctx.moveTo(x + 3, y - 6); ctx.quadraticCurveTo(x + 6, y - 12, x + 9, y - 12); ctx.stroke();
    }
    ctx.restore();
  }
};


/* ---------------- the land's floating words: always on a dark rounded pill, clear of the HUD and the thumbs ---------------- */
// WashSay(g, x, y, text, col): a short line that rises and fades over ~1.2 s (instead of bare text over the sky)
function WashSay(g, x, y, text, col) {
  if (!g) return; const L = g.__washSay || (g.__washSay = []);
  if (L.some(q => q.text === text && q.t < 0.4 && Math.abs(q.x - x) < 80)) return;
  L.push({ x, y, text: String(text), col: col || '#ffffff', t: 0 }); if (L.length > 6) L.shift();
}
TourHooks.on('afterEntities', (play, ctx) => {
  const L = play.__washSay; if (!L || !L.length) return;
  const k = Game.viewH / Math.max(1, Game.gameRect ? Game.gameRect.h : Game.viewH), dt = 1 / 60;
  const top = play.camY + 74 * k, bot = play.camY + Game.viewH - 150 * k, x0 = play.camX + 12 * k, x1 = play.camX + Game.viewW - 12 * k;
  ctx.save(); ctx.font = `${Math.round(12 * k)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const placed = [];
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i]; q.t += dt; if (q.t > 1.4) { L.splice(i, 1); continue; }
    const w = ctx.measureText(q.text).width + 18 * k, h = 22 * k;
    let x = clamp(q.x, x0 + w / 2, x1 - w / 2), y = clamp(q.y - q.t * 22, top + h / 2, Math.max(top + h / 2, bot - h / 2));
    for (const r of placed) if (Math.abs(r.x - x) < (r.w + w) / 2 && Math.abs(r.y - y) < h) y = r.y - h - 3 * k;
    placed.push({ x, y, w });
    const a = q.t > 1.0 ? (1.4 - q.t) / 0.4 : Math.min(1, q.t * 8);
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(20,14,30,0.82)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = q.col; ctx.fillText(q.text, x, y + 1);
  }
  ctx.restore();
});

/* ---------------- tiles ---------------- */
// the folded laundry hem: a stack of folded cream linen, a navy gingham band along the top
const hemGround = {
  style: 'linen', cap: '#f4ead2', capHi: '#ffffff', dirt: '#e6d9b8', dirt2: '#d6c8a4', rock: '#cdbd98',
  paint(ctx, rng) {
    ctx.fillStyle = '#eadfc2'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = '#cdbd98'; ctx.lineWidth = 1.2;
    for (let y = 6; y < TS; y += 10) { ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(TS * 0.5, y + (rng() < 0.5 ? 3 : -2), TS, y + 1); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(2, 2, TS - 8, 1.5);
  },
  paintCap(ctx, x0, x1) {
    WashArt.gingham(ctx, x0, 0, x1 - x0, 11, 4, 0.85);
    ctx.fillStyle = INK; ctx.fillRect(x0, 11, x1 - x0, 1.5);
    ctx.strokeStyle = NAVY_L; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(x0, 14); ctx.lineTo(x1, 14); ctx.stroke(); ctx.setLineDash([]);
  }
};
// a red clothes peg lying flat (the one-way ledges)
const pegSemi = {
  style: 'peg', c1: RED, c2: RED_D,
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = RED_D; ctx.fillRect(x0, 4, x1 - x0, 6);
    ctx.fillStyle = RED; ctx.fillRect(x0, 0, x1 - x0, 5);
    ctx.fillStyle = '#ff8a6a'; ctx.fillRect(x0, 0, x1 - x0, 1.5);
    ctx.fillStyle = INK; ctx.fillRect(x0, 9.5, x1 - x0, 1.5); ctx.fillRect(x0, 4.6, x1 - x0, 0.9);
    // the spring every so often
    ctx.fillStyle = '#e8e2d4'; for (let x = x0 + 14; x < x1 - 4; x += 32) { ctx.beginPath(); ctx.arc(x, 5, 2.6, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke(); }
  }
};
// folded towels (bricks: they break)
const towelBrick = {
  style: 'towel', c1: '#e8a89a', c2: '#c87a6a', mortar: '#8a4a3a',
  paint(ctx) {
    ctx.fillStyle = '#f2c0b0'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#e8a89a'; ctx.fillRect(0, 0, TS, 6); ctx.fillRect(0, 16, TS, 6);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 9, TS, 2); ctx.fillRect(0, 25, TS, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the chimney brick of the rooftops (walls, the parapets)
const roofHard = {
  c1: '#b8644a', c2: '#7a3a2a',
  paint(ctx) {
    ctx.fillStyle = '#8a4434'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#b8644a';
    ctx.fillRect(1, 1, 14, 6); ctx.fillRect(17, 1, 14, 6); ctx.fillRect(-7, 9, 14, 6); ctx.fillRect(9, 9, 14, 6); ctx.fillRect(25, 9, 14, 6);
    ctx.fillRect(1, 17, 14, 6); ctx.fillRect(17, 17, 14, 6); ctx.fillRect(-7, 25, 14, 6); ctx.fillRect(9, 25, 14, 6); ctx.fillRect(25, 25, 14, 6);
    ctx.fillStyle = 'rgba(255,220,190,0.25)'; ctx.fillRect(1, 1, 14, 1.5); ctx.fillRect(17, 17, 14, 1.5);
  }
};
// a folded navy-check blanket (the hard blocks inside: the linen cupboard, the bed)
const checkHard = {
  c1: NAVY_L, c2: NAVY,
  paint(ctx) {
    WashArt.gingham(ctx, 0, 0, TS, TS, 8, 0.9, '#d8d8e8');
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(2, 2, TS - 4, 2);
  }
};
// the wool (26-4): a thick fleece rug (charges the socks)
const woolGround = Object.assign({}, hemGround, {
  style: 'wool', cap: '#fff8ec', capHi: '#ffffff',
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#e8dcc8'; ctx.fillRect(x0, 0, x1 - x0, 12);
    ctx.fillStyle = '#fff8ec'; for (let x = x0 + 4; x < x1; x += 8) { ctx.beginPath(); ctx.arc(x, 5, 6, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(160,140,110,0.6)'; ctx.lineWidth = 1; for (let x = x0 + 4; x < x1; x += 8) { ctx.beginPath(); ctx.arc(x, 5, 6, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.fillRect(x0, 11, x1 - x0, 1.5);
  }
});
const linen = { ground: hemGround, semi: pegSemi, brick: towelBrick, hard: roofHard, pillar: { c1: CREAM, c2: CREAM_D, cap: RED, style: 'column' }, accent: RED, tint: {}, bloom: 0.14, liquid: null };
const cupboard = Object.assign({}, linen, { hard: checkHard });
const woolly = Object.assign({}, linen, { ground: woolGround });


// each secret room its own floor and walls: a ground whose top band and body are painted from two colours and a
// pattern, a hard block to match
const roomTiles = (cap, capHi, body, body2, pat, hard1, hard2) => {
  const ground = { style: 'room', cap, capHi, dirt: body, dirt2: body2, rock: body2,
    paint(ctx, rng) { ctx.fillStyle = body; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = body2;
      if (pat === 'weave') { for (let y = 0; y < TS; y += 8) for (let x = (y / 8) % 2 * 8; x < TS; x += 16) ctx.fillRect(x, y, 8, 8); }
      else if (pat === 'tile') { ctx.fillRect(0, TS - 2, TS, 2); ctx.fillRect(TS - 2, 0, 2, TS); }
      else if (pat === 'plank') { ctx.fillRect(0, 10, TS, 2); ctx.fillRect(0, 22, TS, 2); ctx.fillRect((rng() * 20) | 0, 0, 2, 10); }
      else if (pat === 'check') { ctx.fillRect(0, 0, TS / 2, TS / 2); ctx.fillRect(TS / 2, TS / 2, TS / 2, TS / 2); }
      else if (pat === 'carpet') { for (let k = 0; k < 6; k++) ctx.fillRect(rng() * TS, rng() * TS, 3, 2); } },
    paintCap(ctx, x0, x1) { ctx.fillStyle = cap; ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = capHi; ctx.fillRect(x0, 0, x1 - x0, 3); ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5); } };
  const hard = { c1: hard1, c2: hard2, paint(ctx) { ctx.fillStyle = hard2; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = hard1; ctx.fillRect(2, 2, TS - 4, TS - 4); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5); } };
  return Object.assign({}, linen, { ground, hard });
};
const RT = {
  wicker: roomTiles('#a8783a', '#d8a868', '#c8a06a', '#b08850', 'weave', '#c8a06a', '#8a6a3a'),
  laund: roomTiles('#e8f0f4', '#ffffff', '#d8e4ea', '#b8c8d0', 'tile', '#e8ecf0', '#9aa8b4'),
  loft: roomTiles('#8a5a3a', '#b07a50', '#7a4e30', '#5a3a22', 'plank', '#6a4a3a', '#3a2a22'),
  counter: roomTiles('#c83a2a', '#ff6a5a', '#f4ead2', '#c83a2a', 'check', '#a8784a', '#6a4a2a'),
  drying: Object.assign({}, woolly, { hard: { c1: '#c8783a', c2: '#8a4a2a', paint(ctx) { roofHard.paint(ctx); } } }),
  socks: roomTiles('#3e4f8e', '#5a6ab0', '#2a3466', '#23305e', 'carpet', '#8a5a3a', '#5a3a22')
};

/* ---------------- painted backdrops ---------------- */
// a row of laundry on a line across the backdrop (towels, shirts, sheets in the land's colours)
function laundryRow(ctx, rng, y, x0, x1, scale, alpha) {
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.strokeStyle = '#7a6a52'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y);
  for (let x = x0; x <= x1; x += 120) ctx.quadraticCurveTo(x + 60, y + 14 * scale, x + 120, y);
  ctx.stroke();
  for (let x = x0 + 20; x < x1 - 30; x += (40 + rng() * 50) * scale) {
    const kind = Math.floor(rng() * 4), w = (24 + rng() * 26) * scale, h = (30 + rng() * 34) * scale, sag = 5 * scale;
    const col = [CREAM, '#f2c0b0', MINT_D, '#e8e2f2'][Math.floor(rng() * 4)];
    ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 1.3;
    if (kind === 0) { WashArt.gingham(ctx, x, y + sag, w, h, 5 * scale, 0.5); ctx.strokeRect(x, y + sag, w, h); }
    else if (kind === 1) { ctx.beginPath(); ctx.moveTo(x, y + sag); ctx.lineTo(x + w, y + sag); ctx.lineTo(x + w * 0.85, y + sag + h); ctx.lineTo(x + w * 0.15, y + sag + h); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (kind === 2) { ctx.beginPath(); ctx.moveTo(x, y + sag); ctx.lineTo(x + w, y + sag); ctx.lineTo(x + w + 6 * scale, y + sag + h * 0.35); ctx.lineTo(x + w * 0.8, y + sag + h * 0.35); ctx.lineTo(x + w * 0.8, y + sag + h); ctx.lineTo(x + w * 0.2, y + sag + h); ctx.lineTo(x + w * 0.2, y + sag + h * 0.35); ctx.lineTo(x - 6 * scale, y + sag + h * 0.35); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { WashArt.sock(ctx, x + 8, y + sag, scale * 1.1, CREAM, NAVY_L, rng() < 0.5); x -= 10 * scale; }
    if (kind !== 3) { WashArt.peg(ctx, x + 4, y + sag + 4, 0.45 * scale); WashArt.peg(ctx, x + w - 4, y + sag + 4, 0.45 * scale); }
  }
  ctx.restore();
}
const painters = {
  // far rooftops: rows of slate and tile roofs with chimney pots (no towers, no spires), a soft mint haze
  washFarRoofs(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, b);
    let x = 0;
    while (x < BG_W) {
      const w = 70 + rng() * 90, h = 30 + rng() * 50, pitch = rng() < 0.5;
      ctx.lineTo(x, b - h * 0.6);
      if (pitch) { ctx.lineTo(x + w / 2, b - h); ctx.lineTo(x + w, b - h * 0.6); } else { ctx.lineTo(x, b - h); ctx.lineTo(x + w, b - h); }
      x += w;
    }
    ctx.lineTo(BG_W, b); ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(L.color, -0.12);
    for (let k = 0; k < 18; k++) { const cx = rng() * BG_W, ch = 16 + rng() * 20; wrapDraw(cx - 8, 20, X => { ctx.fillRect(X, b - 70 - ch, 12, ch + 20); ctx.fillRect(X - 2, b - 70 - ch, 16, 4); }); }
    ctx.fillStyle = shade(L.color, 0.12);
    for (let k = 0; k < 40; k++) { const wx = rng() * BG_W, wy = b - 10 - rng() * 30; ctx.fillRect(wx, wy, 6, 8); }
  },
  // near rooftops: terracotta roofs, chimney stacks with pots, washing lines strung between them
  washNearRoofs(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, b);
    for (let x = 0; x <= BG_W; x += 160) { ctx.lineTo(x + 40, b - 40); ctx.lineTo(x + 120, b - 40); ctx.lineTo(x + 160, b); }
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(L.color, -0.18); ctx.lineWidth = 2;
    for (let y = b - 30; y < H; y += 10) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); }
    for (let x = 100; x < BG_W; x += 240 + Math.floor(rng() * 60)) {
      ctx.fillStyle = '#9a5240'; ctx.fillRect(x, b - 90, 26, 60); ctx.fillStyle = '#7a3a2a'; ctx.fillRect(x - 3, b - 94, 32, 6);
      ctx.fillStyle = '#c87a4a'; ctx.fillRect(x + 4, b - 104, 7, 10); ctx.fillRect(x + 15, b - 102, 7, 8);
    }
    if (L.lines !== false) laundryRow(ctx, rng, b - 120, 0, BG_W, 0.9, 0.95);
  },
  // the mint sky's soft clouds that look a lot like hanging sheets
  washSheetClouds(ctx, L, rng, H) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let k = 0; k < 7; k++) {
      const x = rng() * BG_W, y = 30 + rng() * 120, w = 90 + rng() * 80;
      wrapDraw(x, w, X => { ctx.beginPath(); ctx.moveTo(X, y); ctx.lineTo(X + w, y); ctx.lineTo(X + w - 6, y + 26); ctx.quadraticCurveTo(X + w / 2, y + 34, X + 6, y + 26); ctx.closePath(); ctx.fill(); });
    }
  },
  // 26-2: a wash-house terrace: big tubs, a mangle, drips; the steamy blue of cold water
  washTubs(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b - 160, BG_W, H);
    ctx.fillStyle = shade(L.color, -0.1); for (let x = 0; x < BG_W; x += 48) ctx.fillRect(x, b - 160, 3, H);
    for (let x = 60; x < BG_W; x += 220) {
      ctx.fillStyle = '#8aa8c8'; ctx.beginPath(); ctx.ellipse(x + 50, b - 10, 60, 16, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#a8c4dc'; ctx.fillRect(x - 10, b - 70, 120, 60); ctx.fillStyle = '#c8dcec'; ctx.beginPath(); ctx.ellipse(x + 50, b - 70, 60, 14, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e8f4ff'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + 20 + k * 22, b - 74 - (k % 2) * 4, 7, 0, TAU); ctx.fill(); }
    }
    laundryRow(ctx, rng, b - 210, 0, BG_W, 1, 0.9);
    ctx.fillStyle = 'rgba(200,230,255,0.6)'; for (let k = 0; k < 40; k++) { const x = rng() * BG_W, y = b - 200 + rng() * 150; ctx.beginPath(); ctx.ellipse(x, y, 1.6, 3.2, 0, 0, TAU); ctx.fill(); }
  },
  // 26-3: the inside of a giant hem: folds of fabric, tacking stitches, pins, a spool far off
  washFolds(ctx, L, rng, H) {
    const b = L.base;
    for (let k = 0; k < 6; k++) {
      const y = b - 260 + k * 46, col = k % 2 ? L.color : shade(L.color, 0.1);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= BG_W; x += 64) ctx.quadraticCurveTo(x + 32, y + (k % 2 ? 18 : -18), x + 64, y);
      ctx.lineTo(BG_W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(L.color, -0.25); ctx.setLineDash([8, 7]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y + 10); for (let x = 0; x <= BG_W; x += 64) ctx.quadraticCurveTo(x + 32, y + 10 + (k % 2 ? 18 : -18), x + 64, y + 10); ctx.stroke(); ctx.setLineDash([]);
    }
    for (let k = 0; k < 6; k++) { const x = rng() * BG_W, y = b - 220 + rng() * 120; wrapDraw(x - 4, 40, X => { ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X, y); ctx.lineTo(X + 34, y + 30); ctx.stroke(); ctx.fillStyle = k % 2 ? RED : '#4a8ad8'; ctx.beginPath(); ctx.arc(X, y, 6, 0, TAU); ctx.fill(); }); }
  },
  // 26-4: the inside of the tumble dryer's lint trap: fluffy grey-pink walls, a big round door far off, felt patches
  washLint(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let k = 0; k < 160; k++) { const x = rng() * BG_W, y = rng() * b, r = 8 + rng() * 26; ctx.fillStyle = `rgba(255,255,255,${0.05 + rng() * 0.08})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
    for (let x = 160; x < BG_W; x += 420) {
      ctx.fillStyle = shade(L.color, -0.15); ctx.beginPath(); ctx.arc(x, b - 170, 96, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(L.color, 0.08); ctx.beginPath(); ctx.arc(x, b - 170, 78, 0, TAU); ctx.fill();
      ctx.strokeStyle = shade(L.color, -0.25); ctx.lineWidth = 6; for (let a = 0; a < 6; a++) { ctx.beginPath(); ctx.arc(x, b - 170, 60, a, a + 0.5); ctx.stroke(); }
    }
    ctx.fillStyle = 'rgba(255,240,250,0.35)'; for (let x = 0; x < BG_W; x += 30) { ctx.beginPath(); ctx.arc(x + 15, b - 8, 18, Math.PI, 0); ctx.fill(); }
  },
  // 26-5: evening washing lines of trousers, dungarees and aprons, all pockets
  washTrousers(ctx, L, rng, H) {
    const b = L.base;
    for (let row = 0; row < 2; row++) {
      const y = b - 250 + row * 110, sc = row ? 1 : 0.75, a = row ? 0.85 : 0.6;
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = '#5a4a62'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= BG_W; x += 160) ctx.quadraticCurveTo(x + 80, y + 16, x + 160, y); ctx.stroke();
      for (let x = 30; x < BG_W - 60; x += 90 + rng() * 40) {
        const w = 46 * sc, h = 80 * sc, col = [NAVY_L, '#7a5a8a', '#4a7a6a', '#a8784a'][Math.floor(rng() * 4)];
        ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x + w, y + 6); ctx.lineTo(x + w + 4, y + h); ctx.lineTo(x + w / 2 + 5, y + h); ctx.lineTo(x + w / 2, y + 30 * sc); ctx.lineTo(x + w / 2 - 5, y + h); ctx.lineTo(x - 4, y + h); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = shade(col, 0.18); ctx.fillRect(x + 6, y + 18 * sc, 12 * sc, 12 * sc); ctx.fillRect(x + w - 18 * sc, y + 18 * sc, 12 * sc, 12 * sc);
        WashArt.peg(ctx, x + 4, y + 10, 0.4 * sc); WashArt.peg(ctx, x + w - 4, y + 10, 0.4 * sc);
      }
      ctx.restore();
    }
  },
  // 26-6: the bedroom: striped wallpaper, a tall wardrobe, a window with the night, the linen cupboard's shelves
  washBedroom(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(L.color, -0.06); for (let x = 0; x < BG_W; x += 36) ctx.fillRect(x, 0, 14, b);
    ctx.fillStyle = shade(L.color, 0.05); for (let x = 7; x < BG_W; x += 36) { for (let y = 20; y < b; y += 40) { ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill(); } }
    for (let x = 120; x < BG_W; x += 480) {
      ctx.fillStyle = '#1a2246'; ctx.fillRect(x, b - 300, 130, 150); ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(x + 96, b - 260, 14, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; for (let k = 0; k < 8; k++) ctx.fillRect(x + 8 + rng() * 112, b - 292 + rng() * 130, 2, 2);
      ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 8; ctx.strokeRect(x, b - 300, 130, 150); ctx.beginPath(); ctx.moveTo(x + 65, b - 300); ctx.lineTo(x + 65, b - 150); ctx.stroke();
    }
    for (let x = 340; x < BG_W; x += 480) {
      ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x, b - 320, 120, 320); ctx.fillStyle = '#a8704a'; ctx.fillRect(x + 8, b - 310, 50, 300); ctx.fillRect(x + 62, b - 310, 50, 300);
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + 54, b - 160, 4, 0, TAU); ctx.arc(x + 66, b - 160, 4, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(0, b - 12, BG_W, 12);
  },
  // 26-6 near layer: swagged curtains along the top, a washing line of nightshirts and pillowcases strung across the
  // room, a rag rug on the floor
  washBedNear(ctx, L, rng, H) {
    const b = L.base;
    for (let x = 0; x < BG_W; x += 160) { ctx.fillStyle = '#7a3a5a'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 160, 0); ctx.lineTo(x + 160, 26); ctx.quadraticCurveTo(x + 80, 70, x, 26); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x, 0, 160, 6); }
    laundryRow(ctx, rng, 120, 0, BG_W, 1.1, 0.9);
    ctx.fillStyle = 'rgba(232,68,46,0.35)'; for (let x = 0; x < BG_W; x += 300) { ctx.beginPath(); ctx.ellipse(x + 150, b - 6, 120, 10, 0, 0, TAU); ctx.fill(); }
  },
  /* ---------- the six secret rooms' own places (one each, no two alike) ---------- */
  // B1 the laundry-basket stall: wicker wall, a striped awning, the three baskets' shelf
  roomWicker(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#c8a06a'; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = '#a87a4a'; ctx.lineWidth = 4;
    for (let y = 0; y < H; y += 16) { ctx.beginPath(); for (let x = 0; x <= BG_W; x += 16) ctx.lineTo(x, y + ((x / 16 + y / 16) % 2 ? 4 : -4)); ctx.stroke(); }
    for (let x = 0; x < BG_W; x += 60) { ctx.fillStyle = (x / 60) % 2 ? RED : CREAM; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 60, 0); ctx.lineTo(x + 60, 60); ctx.quadraticCurveTo(x + 30, 78, x, 60); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(0, b - 12, BG_W, 12);
  },
  // B2 the launderette: a wall of round washing-machine doors, tiles, a coin slot sign
  roomLaunderette(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#d8ece6'; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = '#b8d4cc'; ctx.lineWidth = 2; for (let x = 0; x < BG_W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); }
    for (let x = 40; x < BG_W; x += 150) { ctx.fillStyle = '#f4f4f0'; ctx.fillRect(x, b - 150, 120, 140); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(x, b - 150, 120, 140); ctx.fillStyle = '#9ab8c8'; ctx.beginPath(); ctx.arc(x + 60, b - 76, 40, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#5a7a9a'; ctx.beginPath(); ctx.arc(x + 60, b - 76, 30, 0, TAU); ctx.fill(); ctx.fillStyle = RED; ctx.fillRect(x + 90, b - 142, 20, 8); }
  },
  // B3 the peg loft: a dim attic, rafters, a peg bag on a nail, a round window
  roomPegLoft(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#5a4a5a'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#6a5868'; for (let x = 0; x < BG_W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 45, b); ctx.lineTo(x + 60, b); ctx.lineTo(x + 15, 0); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#7a5a3a'; for (let y = 50; y < b; y += 110) ctx.fillRect(0, y, BG_W, 14);
    for (let x = 200; x < BG_W; x += 400) { ctx.fillStyle = '#ffe8b0'; ctx.beginPath(); ctx.arc(x, 110, 40, 0, TAU); ctx.fill(); ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 6; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 40, 110); ctx.lineTo(x + 40, 110); ctx.moveTo(x, 70); ctx.lineTo(x, 150); ctx.stroke(); }
  },
  // B4 the lost-property counter: pigeonholes, tags, a big laundry bag
  roomCounter(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#e8d8b8'; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 64) for (let y = 30; y < b - 120; y += 56) { ctx.fillStyle = '#c8b088'; ctx.fillRect(x + 4, y, 56, 50); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x + 8, y + 4, 48, 42); ctx.fillStyle = ['#f2c0b0', MINT, CREAM, '#c8c8f0'][(x / 64 + y / 56) % 4 | 0]; ctx.fillRect(x + 14, y + 20, 30, 26); }
    ctx.fillStyle = '#8a6a4a'; ctx.fillRect(0, b - 90, BG_W, 12);
  },
  // B5 the drying room: a heated rail of cushions and a row of clothes horses, warm orange
  roomDrying(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#f0b878'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#e8a060'; for (let y = 0; y < H; y += 30) ctx.fillRect(0, y, BG_W, 12);
    for (let x = 30; x < BG_W; x += 140) { ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, b); ctx.lineTo(x + 50, b - 160); ctx.lineTo(x + 100, b); ctx.moveTo(x + 18, b - 60); ctx.lineTo(x + 82, b - 60); ctx.moveTo(x + 32, b - 110); ctx.lineTo(x + 68, b - 110); ctx.stroke(); }
    ctx.fillStyle = '#c8783a'; ctx.fillRect(0, 40, BG_W, 10);
  },
  // the Sock Divorce room: the sock drawer, odd socks pinned up like a gallery
  roomSockDrawer(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#3a4a6a'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#4a5a7a'; for (let y = 0; y < H; y += 80) ctx.fillRect(0, y + 70, BG_W, 10);
    for (let x = 30; x < BG_W; x += 70) for (let y = 20; y < b - 140; y += 80) WashArt.sock(ctx, x, y, 1.2, [CREAM, '#f2c0b0', MINT, '#ffd84a'][(x + y) % 4 | 0], NAVY, (x + y) % 3 === 0);
  }
};

// the shared mint sky
const SKY = ['#9fdcc4', '#bfe8d6', '#e6f6ee'];
const base = (o, ...mix) => Object.assign({}, ...mix, o);
const themes = {
  wash_roofs: base({ name: 'Peg Legwork', music: 'tour_wash', particles: 'none', rays: '#ffffff', sky: SKY, horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.82, y: 0.16, r: 26, color: '#fffbe8', glow: '#fff4c8' }, stars: 0,
    layers: [{ kind: 'washSheetClouds', base: 200, f: 0.03 }, { kind: 'washFarRoofs', color: '#a8c8bc', base: 330, f: 0.1 }, { kind: 'washNearRoofs', color: '#c88a6a', base: 420, f: 0.24 }], fog: '#d8f0e6', decor: ['washChimney', 'washBasket'] }, linen),
  wash_tub: base({ name: 'Cold Wash Only', music: 'tour_wash_cold', particles: 'none', rays: null, sky: ['#7ab0c8', '#a8d0e0', '#d8eef4'], horizonGlow: '#e8f8ff', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'washSheetClouds', base: 200, f: 0.03 }, { kind: 'washTubs', color: '#c8d8e4', base: 420, f: 0.16 }], fog: '#c8e4f0', decor: ['washBasket'] }, linen),
  wash_hem: base({ name: 'Loose End', music: 'tour_wash', particles: 'none', rays: null, sky: ['#e8c8b8', '#f2dccc', '#fff0e4'], horizonGlow: '#fff4e8', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'washFolds', color: '#e8b8a0', base: 420, f: 0.12 }], fog: '#f2d8c8', decor: ['washSpool'] }, linen),
  wash_lint: base({ name: 'The Cling Section', music: 'tour_wash_cling', particles: 'none', rays: null, sky: ['#c8b0c0', '#dcc4d0', '#ecdce4'], horizonGlow: '#fff0f8', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'washLint', color: '#c8a8b8', base: 420, f: 0.1 }], fog: '#e8d0dc', decor: [] }, linen),
  wash_pockets: base({ name: 'Pocket Address', music: 'tour_wash_cold', particles: 'none', rays: null, sky: ['#6a5a8a', '#c88aa0', '#f2c0a0'], horizonGlow: '#ffd8b0', celestial: { type: 'sun', x: 0.2, y: 0.55, r: 30, color: '#ffe0b0', glow: '#ffb88a' }, stars: 0.3,
    layers: [{ kind: 'washFarRoofs', color: '#7a6a8a', base: 360, f: 0.08 }, { kind: 'washTrousers', color: '#5a4a6a', base: 420, f: 0.2 }], fog: '#b88aa0', decor: ['washBasket'] }, linen),
  wash_bed: base({ name: 'Fitted Sheet for One', music: 'tour_wash_boss', particles: 'none', rays: null, sky: ['#2a3466', '#3a4a7a', '#4a5a8a'], horizonGlow: '#c8c8ff', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'washBedroom', color: '#c8b8d8', base: 420, f: 0.08 }, { kind: 'washBedNear', base: 420, f: 0.2 }], fog: '#6a6a9a', decor: [] }, cupboard),
  // the rooms
  wash_room_wicker: base({ name: 'The Basket Stall', music: 'tour_wash_room', particles: 'none', rays: null, sky: ['#c8a06a', '#c8a06a', '#c8a06a'], horizonGlow: '#ffe0a0', celestial: { type: 'none' }, stars: 0, layers: [{ kind: 'roomWicker', base: 400, f: 0.05 }], fog: '#c8a06a', decor: [] }, RT.wicker),
  wash_room_launderette: base({ name: 'The Launderette', music: 'tour_wash_room', particles: 'none', rays: null, sky: ['#d8ece6', '#d8ece6', '#d8ece6'], horizonGlow: '#ffffff', celestial: { type: 'none' }, stars: 0, layers: [{ kind: 'roomLaunderette', base: 400, f: 0.05 }], fog: '#d8ece6', decor: [] }, RT.laund),
  wash_room_loft: base({ name: 'The Peg Loft', music: 'tour_wash_room', particles: 'none', rays: null, sky: ['#5a4a5a', '#5a4a5a', '#5a4a5a'], horizonGlow: '#ffe8b0', celestial: { type: 'none' }, stars: 0, layers: [{ kind: 'roomPegLoft', base: 400, f: 0.05 }], fog: '#5a4a5a', decor: [] }, RT.loft),
  wash_room_counter: base({ name: 'Lost Property', music: 'tour_wash_room', particles: 'none', rays: null, sky: ['#e8d8b8', '#e8d8b8', '#e8d8b8'], horizonGlow: '#ffffff', celestial: { type: 'none' }, stars: 0, layers: [{ kind: 'roomCounter', base: 400, f: 0.05 }], fog: '#e8d8b8', decor: [] }, RT.counter),
  wash_room_drying: base({ name: 'The Drying Room', music: 'tour_wash_room', particles: 'none', rays: null, sky: ['#f0b878', '#f0b878', '#f0b878'], horizonGlow: '#ffe0b0', celestial: { type: 'none' }, stars: 0, layers: [{ kind: 'roomDrying', base: 400, f: 0.05 }], fog: '#f0b878', decor: [] }, RT.drying),
  wash_room_socks: base({ name: 'The Sock Drawer', music: 'tour_wash_room', particles: 'none', rays: null, sky: ['#3a4a6a', '#3a4a6a', '#3a4a6a'], horizonGlow: '#c8d8ff', celestial: { type: 'none' }, stars: 0, layers: [{ kind: 'roomSockDrawer', base: 400, f: 0.05 }], fog: '#3a4a6a', decor: [] }, RT.socks),
};

/* ---------------- props (Decor: drawn each frame) ---------------- */
const decor = {
  // a chimney stack with two pots
  washChimney(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#a85a44'; ctx.fillRect(x - 14, y - 44, 28, 44); ctx.strokeRect(x - 14, y - 44, 28, 44);
    ctx.fillStyle = '#7a3a2a'; ctx.fillRect(x - 17, y - 48, 34, 6); ctx.strokeRect(x - 17, y - 48, 34, 6);
    ctx.fillStyle = '#d88a5a'; ctx.fillRect(x - 10, y - 58, 8, 10); ctx.strokeRect(x - 10, y - 58, 8, 10); ctx.fillRect(x + 2, y - 56, 8, 8); ctx.strokeRect(x + 2, y - 56, 8, 8);
    ctx.restore();
  },
  // a wicker laundry basket heaped with folded things
  washBasket(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = CREAM; ctx.beginPath(); ctx.ellipse(x, y - 22, 18, 8, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2c0b0'; ctx.beginPath(); ctx.ellipse(x + 6, y - 24, 9, 5, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8a06a'; ctx.beginPath(); ctx.moveTo(x - 20, y - 22); ctx.lineTo(x + 20, y - 22); ctx.lineTo(x + 16, y); ctx.lineTo(x - 16, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 7, y - 21); ctx.lineTo(x + k * 6, y - 1); ctx.stroke(); }
    ctx.restore();
  },
  // a cotton reel (26-3)
  washSpool(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#c8945a'; ctx.fillRect(x - 13, y - 6, 26, 6); ctx.strokeRect(x - 13, y - 6, 26, 6); ctx.fillRect(x - 13, y - 34, 26, 6); ctx.strokeRect(x - 13, y - 34, 26, 6);
    ctx.fillStyle = (d || 0) % 2 ? RED : NAVY_L; ctx.fillRect(x - 9, y - 28, 18, 22); ctx.strokeRect(x - 9, y - 28, 18, 22);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 9, y - 25 + k * 5); ctx.lineTo(x + 9, y - 23 + k * 5); ctx.stroke(); }
    ctx.restore();
  },
  // a sign card on a clothes peg (the land's tips)
  washTip(ctx, x, y, t) { WashArt.peg(ctx, x, y - 2, 0.9); },
  // a bed post (the boss's bed and the lead-in): a turned wooden post with a ball on top
  washPost(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = '#b8784a';
    ctx.fillRect(x - 6, y - 70, 12, 70); ctx.strokeRect(x - 6, y - 70, 12, 70);
    ctx.fillStyle = '#d8945a'; for (const yy of [-20, -44]) { ctx.beginPath(); ctx.ellipse(x, y + yy, 9, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y - 78, 10, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
};

/* ---------------- door looks: an airing-cupboard door, a laundry chute ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'washCupboard' || look === 'washChute') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (look === 'washCupboard') {
        ctx.fillStyle = '#e8dcc0'; rr(ctx, x - 22, y - 62, 44, 62, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = near ? '#2a2236' : '#c8b898'; for (let k = 0; k < 6; k++) ctx.fillRect(x - 16, y - 56 + k * 9, 32, 4);
        ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(x + 14, y - 30, 3, 0, TAU); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = '#9aa0aa'; rr(ctx, x - 20, y - 50, 40, 50, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = near ? '#120e16' : '#2a2236'; rr(ctx, x - 14, y - 42, 28, 36, 8); ctx.fill();
        WashArt.sock(ctx, x - 4, y - 46, 0.7, CREAM, RED, false);
      }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// PEG BEETLE: a stag beetle in cream trousers three sizes too big, navy braces, a red peg under his arm. He keeps
// stopping to hitch his trousers up (the tell), then waddles off fast before they slide down again.
const beetleArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const hitch = m === 'notice', run = m === 'charge', st = run ? Math.sin(t * 22) * 2.5 : Math.sin(t * 9) * 1.4, drop = hitch ? -2 + Math.sin(t * 30) * 1.2 : 0;
  // little legs under the trouser cuffs
  ctx.fillStyle = INK; ctx.fillRect(-8 + st, -4, 5, 4); ctx.fillRect(3 - st, -4, 5, 4);
  // the trousers (huge, baggy, cream)
  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(-13, -20 + drop); ctx.quadraticCurveTo(-17, -8, -11, -2); ctx.lineTo(-1, -2); ctx.lineTo(0, -9); ctx.lineTo(1, -2); ctx.lineTo(11, -2); ctx.quadraticCurveTo(17, -8, 13, -20 + drop); ctx.closePath(); ctx.fill(); ctx.stroke();
  // the shell (dark red-brown) and the braces
  ctx.fillStyle = '#7a2e22'; ctx.beginPath(); ctx.ellipse(-2, -26, 11, 9, -0.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9a4434'; ctx.beginPath(); ctx.ellipse(-4, -28, 6, 4, -0.2, 0, TAU); ctx.fill();
  ctx.strokeStyle = NAVY; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-7, -31); ctx.lineTo(-9, -18 + drop); ctx.moveTo(3, -32); ctx.lineTo(7, -18 + drop); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  // the head, the big mandibles, the eyes
  ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.arc(9, -30, 6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6a2418'; ctx.beginPath(); ctx.moveTo(12, -34); ctx.quadraticCurveTo(22, -44, 20, -48); ctx.quadraticCurveTo(17, -42, 13, -40); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -35); ctx.quadraticCurveTo(10, -46, 6, -50); ctx.quadraticCurveTo(6, -43, 5, -38); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(11, -31, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(12, -31, 1.3, 0, TAU); ctx.fill();
  // the peg under his arm; hitching: both hands on the waistband
  if (!hitch) WashArt.peg(ctx, -12, -16, 0.6, -1.2);
  else { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-13, -20, 2.4, 0, TAU); ctx.arc(13, -20, 2.4, 0, TAU); ctx.fill(); }
  ctx.restore();
};
// LINT LAMB: navy face and legs; its fleece grows as it walks (e.fleece 0..1), then it sneezes it all off
const lambArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const f = e.fleece == null ? 0.6 : e.fleece, ah = m === 'notice', st = m === 'walk' ? Math.sin(t * 10) * 2 : 0;
  ctx.fillStyle = NAVY; for (const lx of [-8, -3, 4, 9]) { ctx.fillRect(lx + (lx % 2 ? st : -st) * 0.5, -8, 3, 8); }
  // the body: a navy lamb, its fleece a cloud of cream puffs (bigger with more fleece)
  ctx.fillStyle = NAVY_L; ctx.beginPath(); ctx.ellipse(0, -12, 11, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
  if (f > 0.05) {
    const R = 5 + f * 6, n = 7;
    ctx.fillStyle = CREAM;
    for (let k = 0; k < n; k++) { const a = Math.PI + k / (n - 1) * Math.PI, rx = Math.cos(a) * (8 + f * 6), ry = -12 + Math.sin(a) * (5 + f * 6); ctx.beginPath(); ctx.arc(rx, ry, R, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -13, 9 + f * 6, 5 + f * 4, 0, 0, TAU); ctx.fill();
  }
  // the head
  ctx.save(); ctx.translate(12, -17); if (ah) ctx.rotate(-0.4 - Math.sin(t * 20) * 0.08);
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 5.5, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-5, -3, 4, 2, -0.6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(2, -1.5, ah ? 0.8 : 2, 0, TAU); ctx.fill();
  if (!ah) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(2.6, -1.4, 1, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ff9ab0'; ctx.beginPath(); ctx.arc(5.6, 1.6, ah ? 2 : 1, 0, TAU); ctx.fill();
  if (f > 0.05) { ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(-1, -5, 3 + f * 2, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
};
// HANGER HERON: a mint heron, orange legs and beak, a wire coat hanger hooked over one wing that he keeps
// straightening even mid-lunge
const heronArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const lunge = m === 'charge', aim = m === 'notice', st = (lunge ? Math.sin(t * 20) : Math.sin(t * 6)) * 4;
  // legs
  ctx.strokeStyle = '#e8743a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-2, -22); ctx.lineTo(-4 + st, 0); ctx.moveTo(2, -22); ctx.lineTo(4 - st, 0); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  // body
  ctx.fillStyle = MINT; ctx.beginPath(); ctx.ellipse(0, -28, 12, 8, lunge ? 0.3 : -0.1, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = MINT_D; ctx.beginPath(); ctx.moveTo(-12, -28); ctx.quadraticCurveTo(-18, -22, -14, -20); ctx.lineTo(-4, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
  // the hanger hooked over the wing (it wobbles crooked; a little hand straightens it)
  const wob = Math.sin(t * 3) * 0.25;
  ctx.save(); ctx.translate(-4, -36); ctx.rotate(wob); ctx.strokeStyle = '#c8ccd4'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(4, -12, 0, -14); ctx.moveTo(0, -8); ctx.lineTo(-11, 1); ctx.lineTo(11, 1); ctx.closePath(); ctx.stroke(); ctx.restore();
  // the neck and head; aiming: the beak raised, lunging: thrust forward
  const nx = lunge ? 20 : aim ? 6 : 8, ny = lunge ? -34 : aim ? -54 : -48;
  ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(8, -32); ctx.quadraticCurveTo(14, -40, nx, ny); ctx.stroke();
  ctx.strokeStyle = MINT; ctx.lineWidth = 3.6; ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  ctx.fillStyle = MINT; ctx.beginPath(); ctx.arc(nx, ny, 5, 0, TAU); ctx.fill(); ctx.stroke();
  const ba = lunge ? 0 : aim ? -0.6 : 0.2;
  ctx.save(); ctx.translate(nx + 3, ny); ctx.rotate(ba); ctx.fillStyle = '#ff8a3a'; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(18, 0); ctx.lineTo(0, 2.5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(nx + 1, ny - 1.5, 2, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(nx + 1.6, ny - 1.5, 1, 0, TAU); ctx.fill();
  if (aim) { ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(nx - 4, ny - 6); ctx.lineTo(nx + 3, ny - 4); ctx.stroke(); }
  ctx.restore();
};
// SOCK MOTH: a fuzzy rust moth with two striped socks for wings; it nibbles a peephole, then peers through it
const mothArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  const f = Math.sin(t * (m === 'swoop' ? 20 : 8)) * 0.5 + 0.5;
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 3, -4); ctx.rotate(s * (0.5 + f * 0.5)); WashArt.sock(ctx, 0, -2, 0.55, CREAM, NAVY, s < 0); ctx.restore(); }
  ctx.fillStyle = '#c8643a'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#8a3a1a'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(-5, k * 3); ctx.lineTo(5, k * 3 + 1); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.fillStyle = '#ffffff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 2.6 + 2, -7, 2.6, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = INK; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 2.6 + 3, -7, 1.2, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#c86a3a'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(1, -10); ctx.quadraticCurveTo(-2, -17, -6, -17); ctx.moveTo(3, -10); ctx.quadraticCurveTo(6, -17, 10, -16); ctx.stroke();
  ctx.restore();
};
// a lint cloud (the lamb's sneeze): soft, slow, it hurts
const lintArt = (c, s) => { c.save(); c.fillStyle = 'rgba(244,234,210,0.95)'; c.strokeStyle = INK; c.lineWidth = 1.3; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(s.x + 6 + k * 5, s.y + s.h / 2 + Math.sin(k * 2 + s.x * 0.05) * 3, 7, 0, TAU); c.fill(); c.stroke(); } c.restore(); };
const enemies = {
  washBeetle: { cls: TourEnemy.make({ w: 26, h: 34, speed: 0.9, behavior: 'charge', range: 7, windup: 0.6, chargeSpeed: 3.6, chargeT: 1.0, art: beetleArt, burst: CREAM,
    onNotice: e => { if (e.g.onScreen(e)) WashSay(e.g, e.cx, e.y - 14, 'HITCH!', CREAM); },
    onDefeat: e => { if (e.g.onScreen(e)) WashSay(e.g, e.cx, e.y - 10, 'MY TROUSERS!', '#ffffff'); } }), place: 'walk' },
  washLamb: { cls: TourEnemy.make({ w: 26, h: 26, speed: 0.8, behavior: 'walk', art: lambArt, burst: CREAM,
    init(e) { e.fleece = 0.2; e.snz = 0; },
    think(e, dt) {
      const p = e.g.player;
      if (e.snz > 0) {
        // AH... AH... (the tell) ... CHOO! the whole fleece blows off as a cloud
        e.snz -= dt; e.vx = 0; e.mode = 'notice';
        if (e.snz <= 0) {
          e.fleece = 0; e.mode = 'walk';
          if (e.g.onScreen(e, 40)) { WashSay(e.g, e.cx, e.y - 12, 'CHOO!', '#ffffff'); TourKit.sfx('sneeze', 'bump', { vol: 0.35, pitch: 1.6 }); tourFire(e.g, e.cx + e.dir * 18, e.y + 6, { vx: e.dir * 2.6 * TS, w: 30, h: 18, life: 2.4, col: CREAM, art: lintArt }); }
        }
        return;
      }
      if (!e.vx) e.vx = e.dir * e.speed;
      e.mode = 'walk';
      e.fleece = Math.min(1, e.fleece + dt * 0.18);
      if (e.fleece >= 1) { e.snz = 0.9; if (p && Math.abs(p.cx - e.cx) < 8 * TS) e.dir = sign(p.cx - e.cx) || e.dir; if (e.g.onScreen(e, 40)) WashSay(e.g, e.cx, e.y - 12, 'AH... AH...', '#ffffff'); }
    },
    onHurt: e => {}, onDefeat: e => {} }), place: 'walk' },
  washHeron: { cls: TourEnemy.make({ w: 24, h: 46, speed: 0.7, behavior: 'charge', range: 6, windup: 0.7, chargeSpeed: 5.2, chargeT: 0.8, art: heronArt, burst: MINT,
    onNotice: e => { if (e.g.onScreen(e)) WashSay(e.g, e.cx, e.y - 12, 'TSK! CROOKED!', MINT); } }), place: 'walk' },
  washMoth: { cls: TourFlyer.make({ w: 26, h: 22, range: 3, speed: 0.8, swoop: true, art: mothArt, burst: '#c8643a',
    onSwoop: e => { if (e.g.onScreen(e)) WashSay(e.g, e.cx, e.y - 10, 'NIBBLE!', CREAM); } }), place: 'fly' }
};
// the lamb in full fleece: a stomp just bounces off the wool (stomp it once it has sneezed)
{
  const h0 = TourEnemy.prototype.hit;
  enemies.washLamb.cls.prototype.hit = function (kind, src) {
    if ((kind === 'stomp' || kind === 'spin') && !this.dead && this.fleece > 0.35 && !(this.stunT > 0)) { Sound.play('spring', { vol: 0.35, pitch: 1.4 }); WashSay(this.g, this.cx, this.y - 8, 'FLUFF', '#ffffff'); this.fleece = Math.max(0, this.fleece - 0.3); return 'bounce'; }
    return h0.call(this, kind, src);
  };
}

/* ---------------- the route map: a peg in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save();
  ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, TAU); ctx.fill();
  WashArt.gingham(ctx, x - r * 0.7, y - r * 0.2, r * 1.4, r * 0.9, Math.max(2, r * 0.18), 0.7);
  WashArt.peg(ctx, x, y + r * 0.1, r / 26, 0.15 * Math.sin(t * 2));
  ctx.restore();
};

/* ---------------- the land's map: sprites and the rooftops ---------------- */
Object.assign(TourOWPaint.art, {
  // a washing line between two little poles, three things pegged on it
  washLine(c, r) {
    c.strokeStyle = TourOWPaint.INK; c.lineWidth = 1.4; c.fillStyle = '#8a6a4a';
    c.fillRect(-r, -r * 0.9, 2.4, r * 0.9); c.strokeRect(-r, -r * 0.9, 2.4, r * 0.9); c.fillRect(r - 2.4, -r * 0.9, 2.4, r * 0.9); c.strokeRect(r - 2.4, -r * 0.9, 2.4, r * 0.9);
    c.strokeStyle = '#6a5a4a'; c.beginPath(); c.moveTo(-r, -r * 0.85); c.quadraticCurveTo(0, -r * 0.6, r, -r * 0.85); c.stroke();
    c.strokeStyle = TourOWPaint.INK; c.lineWidth = 1;
    const cols = [CREAM, '#f2c0b0', MINT];
    for (let k = 0; k < 3; k++) { const x = -r * 0.6 + k * r * 0.5, y = -r * 0.72; c.fillStyle = cols[k]; c.fillRect(x - r * 0.16, y, r * 0.32, r * 0.42); c.strokeRect(x - r * 0.16, y, r * 0.32, r * 0.42); c.fillStyle = RED; c.fillRect(x - 1, y - 2, 2, 4); }
  },
  // a chimney with a puff
  washStack(c, r) { c.fillStyle = '#a85a44'; c.fillRect(-r * 0.3, -r, r * 0.6, r); c.strokeRect(-r * 0.3, -r, r * 0.6, r); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(r * 0.1, -r * 1.25, r * 0.22, 0, TAU); c.arc(r * 0.35, -r * 1.5, r * 0.16, 0, TAU); c.fill(); },
  // the big bed (the boss)
  washBedSprite(c, r) {
    c.fillStyle = '#b8784a'; c.fillRect(-r, -r * 0.9, r * 0.14, r * 0.9); c.strokeRect(-r, -r * 0.9, r * 0.14, r * 0.9); c.fillRect(r * 0.86, -r * 0.9, r * 0.14, r * 0.9); c.strokeRect(r * 0.86, -r * 0.9, r * 0.14, r * 0.9);
    WashArt.gingham(c, -r * 0.86, -r * 0.55, r * 1.72, r * 0.4, Math.max(2, r * 0.12), 0.8); c.strokeRect(-r * 0.86, -r * 0.55, r * 1.72, r * 0.4);
    c.fillStyle = RED; for (const x of [-r * 0.86, r * 0.86]) { c.beginPath(); c.arc(x, -r * 0.55, r * 0.1, 0, TAU); c.fill(); c.stroke(); }
  },
  // a laundry basket (the airstrip)
  washBasketSprite(c, r) { c.fillStyle = '#c8a06a'; c.beginPath(); c.moveTo(-r, -r * 0.7); c.lineTo(r, -r * 0.7); c.lineTo(r * 0.8, 0); c.lineTo(-r * 0.8, 0); c.closePath(); c.fill(); c.stroke(); c.fillStyle = CREAM; c.beginPath(); c.ellipse(0, -r * 0.7, r * 0.9, r * 0.3, 0, Math.PI, 0); c.fill(); c.stroke(); }
});
// a parapet edge instead of a coast: a terracotta roof rim with gutter, the mint sky below
TourOWLands.coast.washRoof = function (c, ow, ring) {
  const L = ow.look, ink = this.INK;
  c.save(); c.translate(6, 12); OWGeo.path(c, ring, true); c.fillStyle = 'rgba(30,60,50,0.3)'; c.fill(); c.restore();
  c.save(); c.translate(0, 8); OWGeo.path(c, ring, true); c.fillStyle = '#8a4434'; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
  c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = '#c87a5a'; c.lineWidth = 10; OWGeo.path(c, ring, true); c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.8; c.stroke();
};
// the rooftops under the trails: tile rows, skylights, washing lines strung between chimneys
TourOWScenes.groundPaint.wash = function (c, ow) {
  const R = TourOWPaint.rng('washground'), ink = TourOWPaint.INK, A = TourOWPaint.art;
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = 'rgba(160,90,70,0.22)'; c.lineWidth = 2;
  for (let y = 180; y < 720; y += 22) { c.beginPath(); c.moveTo(200, y); c.lineTo(1340, y + 6); c.stroke(); }
  for (let k = 0; k < 10; k++) { const x = 260 + R() * 1000, y = 200 + R() * 480; c.fillStyle = '#9ab8c8'; c.fillRect(x, y, 22, 14); c.strokeStyle = ink; c.lineWidth = 1.2; c.strokeRect(x, y, 22, 14); }
  for (let k = 0; k < 6; k++) { c.save(); c.translate(280 + R() * 980, 220 + R() * 460); c.strokeStyle = ink; c.lineWidth = 1.4; A.washStack.call(TourOWPaint, c, 12 + R() * 6); c.restore(); }
};
TourLandscape.looks.wash = ['#9fdcc4', '#7ab8a4', '#c87a5a', CREAM, '#ffffff', RED, 'washPeg'];
{
  // the land's landmark miniature: a sheet on a line, one red peg
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'washPeg') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40); ctx.lineWidth = 2; ctx.strokeStyle = ink || INK; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#6a5a4a'; ctx.beginPath(); ctx.moveTo(-24, -40); ctx.quadraticCurveTo(0, -32, 24, -40); ctx.stroke();
    WashArt.gingham(ctx, -16, -36, 32, 30, 5, 0.6); ctx.strokeStyle = ink || INK; ctx.strokeRect(-16, -36, 32, 30);
    WashArt.peg(ctx, 0, -30, 0.55);
    ctx.restore();
  };
}

/* ---------------- music: a skipping washing-day waltz, a chilly cold-wash shuffle, a staticky crackle groove,
   a little room tune, and the boss's bed-making march ---------------- */
const tracks = {
  tour_wash: {
    bpm: 132, bpb: 3, bars: 8, rv: 0.3, dl: 0.15, hx: 0.05,
    ch: 'F F C7 C7 F Bb C7 F',
    ld: 'C6:3 F6:3 A6:3 | G6:6 E6:3 | Bb5:3 C6:3 E6:3 | G6:9 | A6:3 C7:3 A6:3 | Bb6:3 G6:3 D6:3 | C6:3 E6:3 G6:3 | F6:9',
    li: 'reed', lv: 0.14,
    bp: 'r..f..', bi: 'pluckb', bv: 0.3,
    ap: '...c.c', ai: 'pluck', av: 0.05, ao: 60,
    dr: ['k.....', '...s.s', 'h.hh.h'], dv: 0.32
  },
  tour_wash_cold: {
    bpm: 104, bars: 8, rv: 0.45, dl: 0.2, hx: 0.04,
    ch: 'Am7 Dm7 G7 Cmaj7 Am7 Dm7 E7 Am7',
    ld: 'E6:4 A6:4 G6:4 E6:4 | F6:8 D6:8 | B5:4 D6:4 G6:8 | E6:16 | C7:4 B6:4 A6:4 E6:4 | F6:4 A6:4 D7:8 | B6:4 G#6:4 E6:8 | A6:16',
    li: 'glass', lv: 0.13,
    bp: 'r...r.f.r...r.f.', bi: 'sub', bv: 0.26,
    ap: '..c...c...c...c.', ai: 'vibes', av: 0.05, ao: 64,
    dr: ['k.......k.......', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.22
  },
  tour_wash_cling: {
    bpm: 118, bars: 8, rv: 0.25, sw: 0.12, hx: 0.06,
    ch: 'Dm Dm Gm A7 Dm Bb A7 Dm',
    ld: 'D6:2 F6:2 A6:2 D7:2 C7:4 A6:4 | D6:2 F6:2 A6:4 .:8 | G6:2 Bb6:2 D7:4 Bb6:4 G6:4 | E6:4 G6:4 C#7:8 | D7:2 C7:2 A6:4 F6:4 A6:4 | Bb6:4 F6:4 D6:8 | E6:2 G6:2 A6:4 C#7:4 E7:4 | D7:16',
    li: 'clav', lv: 0.12,
    bp: 'r..r..f.r..r.f..', bi: 'slapb', bv: 0.3,
    ap: '.c...c...c...c..', ai: 'ep', av: 0.05, ao: 58,
    dr: ['k.....k...k.....', '....s.......s...', 'h.hhh.h.h.hhh.h.'], dv: 0.34
  },
  tour_wash_room: {
    bpm: 112, bars: 4, rv: 0.4, dl: 0.2, hx: 0.04,
    ch: 'C Am F G',
    ld: 'E6:4 G6:4 C7:8 | A6:4 C7:4 E7:8 | F6:4 A6:4 C7:4 A6:4 | G6:4 B6:4 D7:8',
    li: 'mbox', lv: 0.13,
    bp: 'r.......r.......', bi: 'sub', bv: 0.22,
    ap: 'c...c...c...c...', ai: 'harp', av: 0.05, ao: 66,
    dr: ['k.......k.......', '....s.......s...', '..h...h...h...h.'], dv: 0.2
  },
  tour_wash_boss: {
    bpm: 144, bars: 8, rv: 0.3, hx: 0.07,
    ch: 'Gm Gm Eb D Gm Gm Cm D7',
    ld: 'G5:2 Bb5:2 D6:2 G6:2 F6:4 D6:4 | Eb6:2 D6:2 C6:2 Bb5:2 G5:8 | Eb6:2 G6:2 Bb6:2 G6:2 Eb6:4 G6:4 | F#6:4 A6:4 D7:8 |' +
        'G6:2 Bb6:2 D7:2 Bb6:2 G6:4 Bb6:4 | A6:2 G6:2 F#6:2 G6:2 D6:8 | C6:2 Eb6:2 G6:2 C7:2 Bb6:4 G6:4 | A6:4 C7:4 F#7:8',
    li: 'brass', lv: 0.15,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'reese', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'reed', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s..s', 'h.h.h.h.h.h.h.h.'], dv: 0.42
  }
};

Tour.country({
  id: 'wash', secret: true, bonus: true, colors: COL, tagline: 'A hidden land: the side of the sheets nobody sees',
  themes, painters, decor, enemies, tracks,
  music: { level: 'tour_wash', boss: 'tour_wash_boss', map: null },
  landmark: 'the drying nets', emblem,
  arrival: 'Brady! You came round the back of the sheet. There is a whole street behind the washing, darling, and every sock we ever lost lives here. Bring a peg. ♥ C',
  coin: { name: 'BUTTONS', draw(ctx, x, y) {
    ctx.fillStyle = '#f4ead2'; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b8a888'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#23305e'; for (const [dx, dy] of [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.3, 0, TAU); ctx.fill(); }
  } },
  levels: []
});
// for the land's other files and the tests
Tour.washKit = { SOLID, say: WashSay, COL, INK, WashArt, beetleArt, lambArt, heronArt, mothArt, lintArt };
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.washKit = Tour.washKit; if (typeof TourMap !== 'undefined' && !window.BRADY_TOUR.TourMap) window.BRADY_TOUR.TourMap = TourMap; } } catch (e) { /* not in a browser */ }
})();
