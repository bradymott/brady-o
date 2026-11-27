/* ============================================================
   POSTMARK SOUND (world 27, cc 'post'): hidden land A2 (docs/design/CHATGPT_RELAY.md §A2).
   "Peel up the corner of Chinka-O's seaside postcard and its little printed harbour keeps right on going."
   Butter-yellow paper, cobalt wave scallops, coral stamp teeth and black postmark rings. Everything here is PRINTED:
   the quays are card, the sea is a cobalt print, the boats are folded paper and the sky has a cancellation mark in it.
   Its door: in Vietnam 10-3 HOI AN LANTERNS, down the river steps under the market, behind the last postcard rack
   (the lowest card's printed wave runs on across its white border): 29_tour_y_post_d_entry.js.
   This file: the stop, the looks (tiles, themes, painted backdrops, props), the critters, the route-map emblem, the
   map's sprites, the music and the country. The mechanics: 29_tour_y_post_a_mech.js; the secret rooms:
   29_tour_y_post_b_rooms.js; the boss: 29_tour_y_post_c_boss.js; the levels and the map: 29_tour_y_post_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'post', world: 27, name: 'Postmark Sound', sub: 'a hidden land', lon: 116, lat: 12, secret: true, bonus: true, d0: 0.8, pin: 'post' });
const COL = { a: '#2f4fc8', b: '#f47a5a', c: '#fbe6a2' };
const INK = '#1a1630';
const PAPER = '#fbe6a2', PAPER_HI = '#fff4cc', PAPER_LO = '#e8c870', PAPER_SH = '#c8a254';
const COBALT = '#2f4fc8', COBALT_HI = '#5a7ae8', COBALT_LO = '#1e3490', CORAL = '#f47a5a', CORAL_LO = '#c8503a', BLACK = '#16141e', WHITE = '#fffdf4';

/* ---------------- tiles ---------------- */
// the printed quay: butter-yellow card in courses, a cobalt band on top, a coral scalloped stamp edge on the cap
const quayGround = {
  style: 'postQuay', cap: COBALT, capHi: COBALT_HI, dirt: PAPER, dirt2: PAPER_LO, rock: PAPER_SH,
  paint(ctx, rng) {
    rng = rng || (() => 0.5);
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, TS, TS);
    const o = Math.floor(rng() * 3) * 6;
    ctx.strokeStyle = 'rgba(150,110,40,0.55)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, 15.5); ctx.lineTo(TS, 15.5); ctx.moveTo(8 + o, 0); ctx.lineTo(8 + o, 15.5); ctx.moveTo(20 - o * 0.5, 15.5); ctx.lineTo(20 - o * 0.5, TS); ctx.stroke();
    // a faint print screen: halftone dots
    ctx.fillStyle = 'rgba(47,79,200,0.12)'; for (let y = 3; y < TS; y += 6) for (let x = (y % 12) ? 3 : 6; x < TS; x += 6) { ctx.beginPath(); ctx.arc(x, y, 0.9, 0, TAU); ctx.fill(); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = COBALT_LO; ctx.fillRect(x0, 0, x1 - x0, 11);
    ctx.fillStyle = COBALT; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = COBALT_HI; ctx.fillRect(x0, 0, x1 - x0, 2.5);
    ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5);
  }
};
// the perforated stamp ledge (one-way): cream card with coral teeth under it
const stampSemi = {
  style: 'postStampLedge', c1: PAPER_HI, c2: PAPER_LO,
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = CORAL; ctx.fillRect(x0, 5, x1 - x0, 6);
    ctx.fillStyle = PAPER_HI; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = COBALT; ctx.fillRect(x0, 0, x1 - x0, 2);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000'; for (let x = x0 + 4; x < x1; x += 8) { ctx.beginPath(); ctx.arc(x, 11, 2.6, 0, TAU); ctx.fill(); } ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = INK; ctx.fillRect(x0, 5.5, x1 - x0, 1);
  }
};
// the envelope parcel block (bricks): cream with cobalt airmail stripes and a coral seal now and then
const parcelBrick = {
  style: 'postParcel', c1: PAPER_HI, c2: PAPER_LO, mortar: '#8a6a30',
  paint(ctx, rng) {
    rng = rng || (() => 0.5);
    ctx.fillStyle = '#8a6a30'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = PAPER_HI; ctx.fillRect(1.5, 1.5, TS - 3, TS - 3);
    ctx.strokeStyle = COBALT; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(TS / 2, TS * 0.55); ctx.lineTo(TS - 2, 2); ctx.stroke();
    if (rng() < 0.4) { ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(TS / 2, TS * 0.55, 4, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the hard card (walls, overhangs): a deep cobalt print with white wave scallops
const waveHard = {
  c1: COBALT, c2: COBALT_LO,
  paint(ctx) {
    ctx.fillStyle = COBALT; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = 'rgba(255,253,244,0.55)'; ctx.lineWidth = 1.6;
    for (const y of [9, 21]) { ctx.beginPath(); for (let x = 0; x <= TS; x += 8) ctx.arc(x + 4, y, 4, Math.PI, 0); ctx.stroke(); }
    ctx.fillStyle = COBALT_LO; ctx.fillRect(0, TS - 4, TS, 4);
  }
};
const sound = { ground: quayGround, semi: stampSemi, brick: parcelBrick, hard: waveHard, pillar: { c1: PAPER_HI, c2: PAPER_SH, cap: CORAL, style: 'column' }, accent: CORAL, tint: {}, bloom: 0.1, liquid: 'post_ink' };

/* ---------------- shared drawings ---------------- */
const PostArt = {
  // a postmark: a ring with a date line and three wavy cancellation bars beside it
  postmark(ctx, x, y, r, col, a) {
    ctx.save(); ctx.globalAlpha *= a == null ? 1 : a; ctx.strokeStyle = col || BLACK; ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * 0.55, y); ctx.lineTo(x + r * 0.55, y); ctx.stroke();
    for (let k = 0; k < 3; k++) { const yy = y - r * 0.5 + k * r * 0.5; ctx.beginPath(); for (let q = 0; q <= 12; q++) { const xx = x + r * 1.15 + q * r * 0.25; ctx.lineTo(xx, yy + Math.sin(q * 1.1) * r * 0.12); } ctx.stroke(); }
    ctx.restore();
  },
  // a stamp with perforated (scalloped) edges, a coloured frame and a little picture (kind: 0 boat, 1 gull, 2 wave, 3 shell)
  stamp(ctx, x, y, w, h, kind, col, blank) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.fillStyle = WHITE; ctx.beginPath();
    const r = Math.max(2, Math.min(w, h) * 0.07), step = r * 2.6;
    ctx.moveTo(x, y);
    for (let xx = x; xx < x + w - 0.1; xx += step) { ctx.lineTo(xx + step * 0.2, y); ctx.arc(xx + step * 0.5, y, r, Math.PI, 0, true); }
    ctx.lineTo(x + w, y);
    for (let yy = y; yy < y + h - 0.1; yy += step) { ctx.lineTo(x + w, yy + step * 0.2); ctx.arc(x + w, yy + step * 0.5, r, -Math.PI / 2, Math.PI / 2, true); }
    ctx.lineTo(x + w, y + h);
    for (let xx = x + w; xx > x + 0.1; xx -= step) { ctx.lineTo(xx - step * 0.2, y + h); ctx.arc(xx - step * 0.5, y + h, r, 0, Math.PI, true); }
    ctx.lineTo(x, y + h);
    for (let yy = y + h; yy > y + 0.1; yy -= step) { ctx.lineTo(x, yy - step * 0.2); ctx.arc(x, yy - step * 0.5, r, Math.PI / 2, -Math.PI / 2, true); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    const m = Math.min(w, h) * 0.14;
    ctx.fillStyle = col || COBALT; ctx.fillRect(x + m, y + m, w - 2 * m, h - 2 * m);
    if (!blank) PostArt.pict(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.3, kind);
    ctx.restore();
  },
  // the little printed pictures (white on the stamp colour)
  pict(ctx, x, y, s, kind, col) {
    ctx.save(); ctx.fillStyle = col || WHITE; ctx.strokeStyle = col || WHITE; ctx.lineWidth = Math.max(1.2, s * 0.16); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (kind === 0) { ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.2); ctx.lineTo(x + s, y + s * 0.2); ctx.lineTo(x + s * 0.6, y + s * 0.8); ctx.lineTo(x - s * 0.6, y + s * 0.8); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y + s * 0.1); ctx.lineTo(x, y - s); ctx.lineTo(x + s * 0.7, y); ctx.closePath(); ctx.fill(); }
    else if (kind === 1) { ctx.beginPath(); ctx.moveTo(x - s, y); ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.8, x, y); ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.8, x + s, y); ctx.stroke(); }
    else if (kind === 2) { ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.6); ctx.quadraticCurveTo(x - s * 0.2, y - s * 1.2, x + s * 0.6, y - s * 0.4); ctx.quadraticCurveTo(x + s * 0.1, y - s * 0.4, x + s * 0.2, y + s * 0.1); ctx.lineTo(x + s, y + s * 0.6); ctx.closePath(); ctx.fill(); }
    else if (kind === 3) { ctx.beginPath(); ctx.moveTo(x, y + s * 0.8); for (let k = 0; k <= 6; k++) { const a = Math.PI + k * Math.PI / 6; ctx.lineTo(x + Math.cos(a) * s, y + s * 0.1 + Math.sin(a) * s); ctx.lineTo(x, y + s * 0.8); } ctx.stroke(); }
    else if (kind === 4) { ctx.beginPath(); ctx.arc(x, y - s * 0.4, s * 0.3, 0, TAU); ctx.moveTo(x, y - s * 0.1); ctx.lineTo(x, y + s * 0.9); ctx.moveTo(x - s * 0.6, y + s * 0.5); ctx.quadraticCurveTo(x, y + s * 1.1, x + s * 0.6, y + s * 0.5); ctx.moveTo(x - s * 0.4, y + s * 0.1); ctx.lineTo(x + s * 0.4, y + s * 0.1); ctx.stroke(); }
    else { ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, q = k % 2 ? s * 0.45 : s; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } ctx.closePath(); ctx.fill(); }
    ctx.restore();
  },
  // a folded paper boat (plain, invented): cream hull, a cobalt band, a triangle sail
  boat(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 2 / s; ctx.lineJoin = 'round';
    ctx.fillStyle = col || PAPER_HI; ctx.beginPath(); ctx.moveTo(-30, -10); ctx.lineTo(30, -10); ctx.lineTo(20, 4); ctx.lineTo(-20, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COBALT; ctx.fillRect(-30, -13, 60, 4); ctx.strokeRect(-30, -13, 60, 4);
    ctx.beginPath(); ctx.moveTo(-16, -10); ctx.lineTo(-10, 4); ctx.moveTo(16, -10); ctx.lineTo(10, 4); ctx.stroke();
    ctx.fillStyle = col || PAPER_HI; ctx.beginPath(); ctx.moveTo(-2, -13); ctx.lineTo(-2, -40); ctx.lineTo(18, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a row of cobalt wave scallops (the printed sea's edge)
  scallops(ctx, x0, x1, y, r, col, line) {
    ctx.save(); ctx.fillStyle = col || COBALT; ctx.beginPath(); ctx.moveTo(x0, y + r * 2);
    for (let x = x0; x <= x1; x += r * 2) ctx.arc(x + r, y + r, r, Math.PI, 0);
    ctx.lineTo(x1 + r * 2, y + r * 2); ctx.closePath(); ctx.fill();
    if (line) { ctx.strokeStyle = line; ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = x0; x <= x1; x += r * 2) { ctx.moveTo(x, y + r); ctx.arc(x + r, y + r, r * 0.6, Math.PI, 0); } ctx.stroke(); }
    ctx.restore();
  },
  // the land's paper-corner tell: a dog-eared corner of the print curling up, the cobalt back showing, fluttering
  corner(ctx, x, y, t, rot, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s || 1, s || 1);
    const f = Math.sin(t * 5) > 0.4 ? Math.sin(t * 30) * 1.6 : 0;
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(20,18,40,0.35)'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(0, 0); ctx.lineTo(0, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = COBALT_HI; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-8 + f, -6 - f, -2 + f, -14 - f); ctx.lineTo(0, -12); ctx.lineTo(0, 0); ctx.closePath();
    ctx.fillStyle = PAPER_HI; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-4 + f, -3, 0 + f * 0.5, -12 - f); ctx.lineTo(-2 + f, -14 - f); ctx.quadraticCurveTo(-9 + f, -7 - f, -12, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COBALT; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-6 + f, -4, -1 + f, -13 - f); ctx.lineTo(-3 + f, -13 - f); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
};

/* ---------------- painted backdrops ---------------- */
const painters = {
  // the printed sea far off: bands of cobalt scallops getting paler with distance, a plain invented island or two
  postSea(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.fillRect(0, b, BG_W, H - b);
    for (let k = 0; k < 6; k++) { const y = b + 6 + k * 16; ctx.globalAlpha = 0.25 + k * 0.08; PostArt.scallops(ctx, -((k * 13) % 20), BG_W, y, 6 + k, shade(c, 0.1 + k * 0.04)); }
    ctx.globalAlpha = 1;
    for (let x = 80 + rng() * 100; x < BG_W - 60; x += 260 + rng() * 200) {
      const w = 90 + rng() * 80, h = 22 + rng() * 26;
      wrapDraw(x - w / 2, w, X => { const cx = X + w / 2; ctx.fillStyle = L.isle || '#9ac890'; ctx.beginPath(); ctx.ellipse(cx, b + 2, w / 2, h, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = shade(L.isle || '#9ac890', -0.15); ctx.fillRect(cx - w / 2, b - 1, w, 4); });
    }
  },
  // the near harbour: card quays with mooring posts, folded boats at rest, a crane of plain card shapes
  postHarbour(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = shade(c, 0.15); ctx.fillRect(0, b, BG_W, 5);
    for (let x = 0; x < BG_W; x += 36) { ctx.fillStyle = shade(c, -0.12); ctx.fillRect(x, b + 5, 2, H - b); }
    for (let x = 40 + rng() * 60; x < BG_W - 40; x += 150 + rng() * 120) {
      const k = Math.floor(rng() * 3);
      wrapDraw(x - 70, 140, X => {
        const cx = X + 70;
        if (k === 0) { ctx.save(); ctx.globalAlpha = 0.9; PostArt.boat(ctx, cx, b - 2, 1.1, shade(c, 0.35)); ctx.restore(); }
        else if (k === 1) { ctx.fillStyle = shade(c, -0.2); for (const dx of [-30, 0, 30]) ctx.fillRect(cx + dx - 4, b - 26, 8, 26); ctx.fillStyle = shade(c, 0.2); for (const dx of [-30, 0, 30]) ctx.fillRect(cx + dx - 5, b - 28, 10, 4); }
        else { ctx.fillStyle = shade(c, 0.1); ctx.fillRect(cx - 40, b - 44, 80, 44); ctx.fillStyle = shade(c, -0.15); ctx.fillRect(cx - 40, b - 44, 80, 6); ctx.fillStyle = shade(c, 0.3); for (let q = 0; q < 3; q++) ctx.fillRect(cx - 30 + q * 22, b - 30, 12, 14); }
      });
    }
  },
  // the postcard itself: a deckled white border up in the sky and a big black postmark printed across the clouds
  postCardSky(ctx, L, rng, H) {
    for (let x = 160 + rng() * 120; x < BG_W - 100; x += 520 + rng() * 120) PostArt.postmark(ctx, x, 60 + rng() * 40, 34, L.color, 0.22);
  },
  // 27-2: an open stamp album: two pages, rows of stamps in hinges, the gutter in the middle
  postAlbum(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 420) {
      ctx.fillStyle = shade(L.color, -0.18); ctx.fillRect(x + 208, 0, 4, H);
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x + 196, 0, 12, H); ctx.fillRect(x + 212, 0, 12, H);
      for (let r = 0; r < 4; r++) for (let q = 0; q < 6; q++) {
        const sx = x + 14 + q * 66 + (q >= 3 ? 20 : 0), sy = 40 + r * 70;
        if (sy > b - 40) continue;
        ctx.fillStyle = shade(L.color, -0.08); ctx.fillRect(sx - 3, sy - 3, 46, 54);
        PostArt.stamp(ctx, sx, sy, 40, 48, (r * 6 + q) % 5, [COBALT_HI, CORAL, '#5aa87a', '#c890d8'][(r + q) % 4]);
      }
    }
    ctx.globalAlpha = 0.5; ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(0, b, BG_W, H - b); ctx.globalAlpha = 1;
  },
  // 27-3: the blotter bay at dusk: an ink-dark sea, blotted pale shapes on it, the inkwell pier
  postBlotSea(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    for (let k = 0; k < 14; k++) { const x = rng() * BG_W, y = b + 10 + rng() * (H - b - 20), r = 20 + rng() * 40; wrapDraw(x - r, r * 2, X => { ctx.fillStyle = 'rgba(255,240,200,0.14)'; ctx.beginPath(); for (let a = 0; a < TAU; a += 0.5) ctx.lineTo(X + r + Math.cos(a) * r * (0.7 + 0.3 * Math.sin(a * 3 + k)), y + Math.sin(a) * r * 0.4); ctx.closePath(); ctx.fill(); }); }
    for (let x = 60; x < BG_W; x += 300) { ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(x, b - 60, 12, 60); ctx.fillRect(x - 20, b - 66, 52, 8); ctx.fillStyle = shade(L.color, 0.3); ctx.beginPath(); ctx.ellipse(x + 6, b - 78, 14, 12, 0, 0, TAU); ctx.fill(); }
  },
  // 27-4: folded paper hills: big zigzag folds with light and shadow faces, crease lines
  postFolds(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    let x = -40;
    while (x < BG_W + 40) {
      const w = 90 + rng() * 60, h = 60 + rng() * 80;
      ctx.fillStyle = shade(c, 0.12); ctx.beginPath(); ctx.moveTo(x, b); ctx.lineTo(x + w / 2, b - h); ctx.lineTo(x + w / 2, b); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(c, -0.12); ctx.beginPath(); ctx.moveTo(x + w / 2, b - h); ctx.lineTo(x + w, b); ctx.lineTo(x + w / 2, b); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(x + w / 2, b - h); ctx.lineTo(x + w / 2, b); ctx.stroke(); ctx.setLineDash([]);
      x += w * 0.8;
    }
    ctx.fillStyle = shade(c, -0.2); ctx.fillRect(0, b, BG_W, H - b);
  },
  // 27-5: the chart of the coast: a grid, a compass rose, depth numbers and a dotted shoreline
  postChart(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = 'rgba(47,79,200,0.18)'; ctx.lineWidth = 1; for (let x = 0; x < BG_W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(47,79,200,0.35)'; ctx.font = '10px ' + FONT_DISPLAY; ctx.textAlign = 'center'; for (let k = 0; k < 40; k++) ctx.fillText(String(2 + Math.floor(rng() * 30)), rng() * BG_W, 30 + rng() * (b - 40));
    for (let x = 200; x < BG_W; x += 620) { ctx.save(); ctx.translate(x, 110); ctx.strokeStyle = 'rgba(244,122,90,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 40, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(244,122,90,0.5)'; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(7, 0); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill(); } ctx.restore(); }
    ctx.strokeStyle = 'rgba(30,52,144,0.5)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.beginPath(); for (let x = 0; x <= BG_W; x += 20) ctx.lineTo(x, b - 30 + Math.sin(x * 0.02) * 16 + Math.sin(x * 0.05) * 6); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = shade(L.color, -0.15); ctx.fillRect(0, b, BG_W, H - b);
  },
  // 27-6 and the arena: the sorting office: pigeonholes full of letters, a big ink pad (kept dull: the thumb pops)
  postSorting(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 28) for (let y = 40; y < b - 70; y += 26) {
      ctx.fillStyle = shade(c, -0.18); ctx.fillRect(x + 1, y + 1, 26, 24);
      if (((x * 7 + y * 3) % 5) < 3) { ctx.fillStyle = shade(c, 0.22 - ((x + y) % 3) * 0.05); ctx.fillRect(x + 4, y + 8, 20, 15); }
    }
    ctx.fillStyle = shade(c, -0.3); ctx.fillRect(0, b - 70, BG_W, 10);
    ctx.fillStyle = shade(c, -0.1); ctx.fillRect(0, b - 60, BG_W, H - b + 60);
    for (let x = 140; x < BG_W; x += 480) { ctx.fillStyle = shade(c, -0.35); rr(ctx, x - 60, b - 96, 120, 26, 6); ctx.fill(); ctx.fillStyle = shade(c, -0.5); rr(ctx, x - 52, b - 92, 104, 14, 4); ctx.fill(); }
  },
  /* ---------- the secret rooms' own backdrops (all different) ---------- */
  // 27-1 MIND THE GAP: the stamp printer's: a long press with drying racks of stamp sheets
  roomPress(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = '#3a4a8a'; ctx.fillRect(0, 0, BG_W, H);
    for (let y = 50; y < b - 40; y += 70) { ctx.strokeStyle = '#c8c8d8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); for (let x = 20; x < BG_W; x += 70) { ctx.fillStyle = '#e8e4d8'; ctx.fillRect(x, y + 4, 44, 52); ctx.fillStyle = ['#f47a5a', '#5a7ae8', '#5aa87a'][(x / 70 | 0) % 3]; for (let q = 0; q < 4; q++) ctx.fillRect(x + 4 + (q % 2) * 20, y + 8 + (q >> 1) * 24, 16, 20); } }
    ctx.fillStyle = '#2a3468'; ctx.fillRect(0, b - 10, BG_W, H - b + 10);
  },
  // 27-2 COUNTERFEIT POSTMARK: the inspector's bureau: green baize, a lamp, magnifying glasses on hooks
  roomBureau(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = '#2a5a3a'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#244e32'; for (let x = 0; x < BG_W; x += 8) ctx.fillRect(x, 0, 3, H);
    for (let x = 90; x < BG_W; x += 180) { ctx.strokeStyle = '#d8b860'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, 90, 18, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(200,230,255,0.25)'; ctx.fill(); ctx.fillStyle = '#6a4a2a'; ctx.save(); ctx.translate(x + 13, 103); ctx.rotate(0.8); ctx.fillRect(0, -3, 26, 6); ctx.restore(); }
    ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(BG_W / 2, 26, 10, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a3a22'; ctx.fillRect(0, b - 14, BG_W, H - b + 14);
  },
  // 27-3 ECHO IN AN INKWELL: the ink cellar: bottle shelves, a dripping pipe, a dark stain glow
  roomCellar(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = '#20182e'; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 64) for (let y = 0; y < b; y += 32) { ctx.fillStyle = (x / 64 + y / 32) % 2 ? '#281e38' : '#2c2240'; ctx.fillRect(x + (y / 32 % 2) * 32, y, 62, 30); }
    for (const y of [80, 150]) { ctx.fillStyle = '#5a4030'; ctx.fillRect(0, y, BG_W, 6); for (let x = 12; x < BG_W; x += 26) { ctx.fillStyle = ['#1e3490', '#16141e', '#8a2a3a'][(x / 26 | 0) % 3]; rr(ctx, x, y - 22, 14, 22, 3); ctx.fill(); ctx.fillStyle = '#c8b898'; ctx.fillRect(x + 4, y - 27, 6, 5); } }
    ctx.fillStyle = '#16101e'; ctx.fillRect(0, b - 8, BG_W, H - b + 8);
  },
  // 27-4 THE LAST DROP: the pen shop: a wall of nib pens in stands, a striped awning edge, a till
  roomPens(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = '#f4d8c8'; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 40) { ctx.fillStyle = (x / 40) % 2 ? '#f47a5a' : '#fff4cc'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 40, 0); ctx.lineTo(x + 40, 26); ctx.arc(x + 20, 26, 20, 0, Math.PI); ctx.closePath(); ctx.fill(); }
    for (let x = 30; x < BG_W; x += 22) { const h = 50 + ((x * 13) % 30); ctx.strokeStyle = ['#1e3490', '#16141e', '#c8503a', '#2a7a4a'][(x / 22 | 0) % 4]; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, b - 70); ctx.lineTo(x + 6, b - 70 - h); ctx.stroke(); ctx.fillStyle = '#c8c8d0'; ctx.beginPath(); ctx.moveTo(x + 6, b - 70 - h); ctx.lineTo(x + 9, b - 80 - h); ctx.lineTo(x + 3, b - 72 - h); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(0, b - 70, BG_W, 10); ctx.fillStyle = '#6a3a2a'; ctx.fillRect(0, b - 12, BG_W, H - b + 12);
  },
  // 27-5 PICTURE SIDE UP: the sorting office's chute room: brass chutes, a conveyor of cards, a clock face
  roomChutes(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = '#c8d8e0'; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 60; x < BG_W; x += 150) { ctx.fillStyle = '#c8a04a'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 50, 110); ctx.lineTo(x + 20, 110); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#8a6a2a'; ctx.fillRect(x + 18, 106, 34, 8); }
    ctx.fillStyle = '#fffdf4'; ctx.beginPath(); ctx.arc(BG_W * 0.5, 60, 26, 0, TAU); ctx.fill(); ctx.strokeStyle = '#16141e'; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.moveTo(BG_W * 0.5, 60); ctx.lineTo(BG_W * 0.5, 42); ctx.moveTo(BG_W * 0.5, 60); ctx.lineTo(BG_W * 0.5 + 12, 64); ctx.stroke();
    ctx.fillStyle = '#5a6a78'; ctx.fillRect(0, b - 10, BG_W, H - b + 10);
  },
  // 27-6 PEEL HERE: a stamp collector's den: a magnifier lamp, tweezers, a velvet board, a gold frame
  roomDen(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = '#5a1e2e'; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = '#4a1826'; for (let x = 0; x < BG_W; x += 60) for (let y = 0; y < b; y += 60) { ctx.beginPath(); ctx.arc(x + 30, y + 30, 8, 0, TAU); ctx.fill(); }
    for (let x = 100; x < BG_W; x += 340) { ctx.strokeStyle = '#d8b04a'; ctx.lineWidth = 8; ctx.strokeRect(x, 50, 120, 90); ctx.fillStyle = '#3a1020'; ctx.fillRect(x + 4, 54, 112, 82); PostArt.stamp(ctx, x + 40, 72, 40, 46, 5, CORAL); }
    ctx.fillStyle = '#2a0a14'; ctx.fillRect(0, b - 10, BG_W, H - b + 10);
  }
};
const SKY = ['#8ac8f0', '#c8e8f8', '#fff4cc'];
// each secret room its own floor and walls: the printer's steel plate, the bureau's parquet, the cellar's slate, the
// pen shop's tiles, the chute room's rubber matting, the den's carpet
const MATS = {
  steel: { base: '#5a6478', line: '#8a94a8', cap: '#a8b0c0', capLo: '#6a7488', pat(ctx) { ctx.fillStyle = '#6a7488'; for (let y = 4; y < TS; y += 8) for (let x = (y % 16 ? 4 : 8); x < TS; x += 8) ctx.fillRect(x - 1, y - 1, 2, 2); } },
  parquet: { base: '#8a5a32', line: '#5a3a1a', cap: '#c88a4a', capLo: '#7a4a22', pat(ctx) { ctx.fillStyle = '#a06a3a'; for (let k = 0; k < 4; k++) ctx.fillRect(k * 8, (k % 2) * 16, 7, 16); ctx.fillStyle = '#7a4a22'; for (let k = 0; k < 4; k++) ctx.fillRect(k * 8, ((k + 1) % 2) * 16, 7, 16); } },
  slate: { base: '#2a2838', line: '#3e3a50', cap: '#4a4660', capLo: '#2a2838', pat(ctx, rng) { ctx.strokeStyle = '#3e3a50'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 10 + rng() * 6); ctx.lineTo(TS, 12 + rng() * 6); ctx.moveTo(10 + rng() * 10, 0); ctx.lineTo(12, 12); ctx.stroke(); } },
  tiles: { base: '#f2f0e8', line: '#c84a3a', cap: '#c84a3a', capLo: '#8a2a1a', pat(ctx) { ctx.fillStyle = '#c84a3a'; ctx.beginPath(); ctx.moveTo(TS / 2, 4); ctx.lineTo(TS - 4, TS / 2); ctx.lineTo(TS / 2, TS - 4); ctx.lineTo(4, TS / 2); ctx.closePath(); ctx.fill(); } },
  rubber: { base: '#3a4048', line: '#22262c', cap: '#f2c040', capLo: '#a8801a', pat(ctx) { ctx.strokeStyle = '#2a2e34'; ctx.lineWidth = 3; for (let k = -TS; k < TS; k += 8) { ctx.beginPath(); ctx.moveTo(k, TS); ctx.lineTo(k + TS, 0); ctx.stroke(); } } },
  carpet: { base: '#6a1a2a', line: '#4a0a1a', cap: '#d8b04a', capLo: '#8a6a1a', pat(ctx) { ctx.fillStyle = '#8a2a3a'; ctx.beginPath(); ctx.arc(TS / 2, TS / 2, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#d8b04a'; ctx.beginPath(); ctx.arc(TS / 2, TS / 2, 2, 0, TAU); ctx.fill(); } }
};
const mat = k => {
  const M = MATS[k];
  const ground = { style: 'postroom_' + k, cap: M.cap, capHi: M.cap, dirt: M.base, dirt2: M.capLo, rock: M.base,
    paint(ctx, rng) { ctx.fillStyle = M.base; ctx.fillRect(0, 0, TS, TS); M.pat(ctx, rng || (() => 0.5)); },
    paintCap(ctx, x0, x1) { ctx.fillStyle = M.capLo; ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = M.cap; ctx.fillRect(x0, 0, x1 - x0, 7); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x0, 0, x1 - x0, 1.5); ctx.fillStyle = INK; ctx.fillRect(x0, 9.5, x1 - x0, 1.5); } };
  return { ground, hard: { c1: M.base, c2: M.capLo, paint(ctx, rng) { ctx.fillStyle = M.base; ctx.fillRect(0, 0, TS, TS); M.pat(ctx, rng || (() => 0.5)); } } };
};
const room = (name, painter, extra) => Object.assign({}, sound, { name, music: 'tour_post_room', particles: 'none', rays: null, sky: ['#2a2440', '#3a3050', '#4a3a50'], horizonGlow: '#ffe8a0', celestial: { type: 'none' }, stars: 0, layers: [{ kind: painter, base: 400, f: 0.05 }], fog: '#3a3050', decor: [] }, extra || {});
const themes = {
  post_sound: Object.assign({}, sound, {
    name: 'Postmark Sound', music: 'tour_post', particles: 'none', rays: '#fff4cc',
    sky: SKY, horizonGlow: '#fff0b0', celestial: { type: 'sun', x: 0.8, y: 0.16, r: 28, color: '#fff8d8', glow: '#ffe08a' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'postCardSky', color: BLACK, base: 200, f: 0.02 }, { kind: 'postSea', color: '#5a7ae8', isle: '#a8d098', base: 300, f: 0.06 }, { kind: 'postHarbour', color: '#e8b8a0', base: 380, f: 0.18 }],
    fog: '#fff4cc', decor: ['postBollard', 'postShell', 'postBollard', 'postCrateS']
  }),
  post_album: Object.assign({}, sound, {
    name: 'Stamp Duty', music: 'tour_post_desk', particles: 'none', rays: null,
    sky: ['#e8d8b0', '#f2e4c4', '#fbf0d8'], horizonGlow: '#fff4cc', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'postAlbum', color: '#efe0b8', base: 390, f: 0.08 }],
    fog: '#efe0b8', decor: ['postShell', 'postCrateS']
  }),
  post_blot: Object.assign({}, sound, {
    name: 'Blotter Bay', music: 'tour_post', particles: 'none', rays: '#ffd8a0',
    sky: ['#2a2a5a', '#7a5a8a', '#f2b088'], horizonGlow: '#ffb888', celestial: { type: 'sun', x: 0.3, y: 0.38, r: 30, color: '#ffe0b0', glow: '#ff9a7a' }, stars: 0.2,
    layers: [{ kind: 'postCardSky', color: '#2a2440', base: 200, f: 0.02 }, { kind: 'postBlotSea', color: '#2a2a58', base: 320, f: 0.07 }, { kind: 'postHarbour', color: '#5a4a78', base: 390, f: 0.18 }],
    fog: '#a87a8a', decor: ['postBollard', 'postInkwell']
  }),
  post_fold: Object.assign({}, sound, {
    name: 'Forwarding Fold', music: 'tour_post', particles: 'none', rays: '#fff4cc',
    sky: ['#a8c8f0', '#d8e8f8', '#fff0d8'], horizonGlow: '#fff0c0', celestial: { type: 'sun', x: 0.15, y: 0.2, r: 26, color: '#fff8e0', glow: '#ffe0a0' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'postFolds', color: '#f2d890', base: 300, f: 0.06 }, { kind: 'postFolds', color: '#e8c070', base: 380, f: 0.16 }],
    fog: '#fff0d0', decor: ['postBollard', 'postShell']
  }),
  post_chart: Object.assign({}, sound, {
    name: 'Mismeasured Coast', music: 'tour_post_desk', particles: 'none', rays: null,
    sky: ['#f2ead2', '#f6eedc', '#fbf4e4'], horizonGlow: '#fff4cc', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'postChart', color: '#f2e8cc', base: 390, f: 0.08 }],
    fog: '#f2e8cc', decor: ['postBollard', 'postCrateS']
  }),
  post_office: Object.assign({}, sound, {
    name: 'Return to Sender', music: 'tour_post_desk', particles: 'none', rays: null,
    sky: ['#5a4a3a', '#7a6248', '#9a7a58'], horizonGlow: '#ffe0a0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'postSorting', color: '#8a6a48', base: 390, f: 0.08 }],
    fog: '#8a6a48', darkness: 0.04, decor: ['postCrateS', 'postInkwell']
  }),
  post_arena: Object.assign({}, sound, {
    name: 'The Sorting Desk', music: 'tour_post_boss', particles: 'none', rays: null,
    sky: ['#2a2230', '#3e3040', '#5a4448'], horizonGlow: '#c89a6a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'postSorting', color: '#4a3a34', base: 360, f: 0.06 }, { kind: 'postHarbour', color: '#3a2e30', base: 400, f: 0.14 }],
    fog: '#3a2e30', decor: []
  }),
  post_room_press: room('The Stamp Press', 'roomPress', mat('steel')),
  post_room_bureau: room('The Inspector\'s Bureau', 'roomBureau', mat('parquet')),
  post_room_cellar: room('The Ink Cellar', 'roomCellar', mat('slate')),
  post_room_pens: room('The Pen Shop', 'roomPens', mat('tiles')),
  post_room_chutes: room('The Chute Room', 'roomChutes', mat('rubber')),
  post_room_den: room('The Collector\'s Den', 'roomDen', mat('carpet'))
};

/* ---------------- props (Decor: drawn each frame, plain shapes only) ---------------- */
const decor = {
  // a card mooring post with a coral rope
  postBollard(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = PAPER_HI; rr(ctx, x - 7, y - 20, 14, 20, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = CORAL; ctx.fillRect(x - 7, y - 14, 14, 4); ctx.strokeRect(x - 7, y - 14, 14, 4); ctx.fillStyle = COBALT; ctx.beginPath(); ctx.ellipse(x, y - 20, 7, 2.5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); },
  // a printed scallop shell
  postShell(ctx, x, y, t, th, d) { ctx.save(); ctx.fillStyle = ((d && d.seed) || 0) % 2 ? CORAL : PAPER_HI; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 0; k <= 6; k++) { const a = Math.PI + k * Math.PI / 6; ctx.lineTo(x + Math.cos(a) * 9, y - 3 + Math.sin(a) * 9); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); for (let k = 1; k < 6; k++) { const a = Math.PI + k * Math.PI / 6; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 8, y - 3 + Math.sin(a) * 8); } ctx.stroke(); ctx.restore(); },
  // a little parcel tied with string
  postCrateS(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#d8a868'; ctx.fillRect(x - 12, y - 16, 24, 16); ctx.strokeRect(x - 12, y - 16, 24, 16); ctx.strokeStyle = '#7a4a1a'; ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x, y); ctx.moveTo(x - 12, y - 8); ctx.lineTo(x + 12, y - 8); ctx.stroke(); ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(x, y - 8, 2.5, 0, TAU); ctx.fill(); ctx.restore(); },
  // an inkwell
  postInkwell(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#2a2a48'; rr(ctx, x - 9, y - 14, 18, 14, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = BLACK; ctx.fillRect(x - 4, y - 18, 8, 5); ctx.strokeRect(x - 4, y - 18, 8, 5); ctx.strokeStyle = '#c8a04a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 2, y - 18); ctx.lineTo(x + 10, y - 34); ctx.stroke(); ctx.restore(); },
  // a ruled margin line on the floor: the Margin Crab will not cross it
  postRule(ctx, x, y, t) { ctx.save(); ctx.strokeStyle = CORAL_LO; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x, y); ctx.stroke(); ctx.strokeStyle = 'rgba(200,80,58,0.4)'; ctx.lineWidth = 6; ctx.stroke(); ctx.restore(); },
  // a fold line standing up out of the ground: the Crease Eel turns here
  postFoldMark(ctx, x, y, t) { ctx.save(); ctx.strokeStyle = 'rgba(30,52,144,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = PAPER_LO; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x, y - 8); ctx.lineTo(x + 6, y); ctx.closePath(); ctx.fill(); ctx.restore(); },
  // a big postcard on a stand: one of Chinka-O's cards with a printed wave (decor seed picks the picture)
  postCardStand(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x - 2, y - 30, 4, 30); ctx.strokeRect(x - 2, y - 30, 4, 30);
    ctx.fillStyle = WHITE; rr(ctx, x - 26, y - 66, 52, 38, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8ac8f0'; ctx.fillRect(x - 22, y - 62, 44, 30); PostArt.scallops(ctx, x - 22, x + 14, y - 44, 4, COBALT);
    ctx.fillStyle = WHITE; ctx.fillRect(x - 26, y - 34, 52, 6); ctx.restore();
  }
};
const decorLights = {};

/* ---------------- door looks: a letterbox flap, a slit in the paper ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'postFlap' || look === 'postSlit') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (look === 'postFlap') {
        ctx.fillStyle = CORAL; rr(ctx, x - 20, y - 58, 40, 58, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#c8a04a'; rr(ctx, x - 13, y - 40, 26, 8, 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = WHITE; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('POST', x, y - 46);
      } else {
        ctx.fillStyle = '#1a1630'; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x - 12, y - 30, x - 2, y - 58); ctx.lineTo(x + 6, y - 58); ctx.quadraticCurveTo(x + 14, y - 30, x + 6, y); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = PAPER_HI; ctx.beginPath(); ctx.moveTo(x + 6, y - 58); ctx.lineTo(x + 18, y - 50); ctx.lineTo(x + 8, y - 44); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      if (near) { ctx.fillStyle = '#ffffff'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('▲', x, y - 66 + Math.sin(t * 6) * 2); }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// GUM GULL: a cream gull with a coral beak. It flies its beat and dives to peck at Brady; after every peck its beak
// gums shut (it struggles to pull it open: a harmless moment to stomp it).
const gullArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(-(e.dir || 1), 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const stuck = e.gum > 0, f = Math.sin(t * (m === 'swoop' ? 20 : stuck ? 26 : 9));
  ctx.fillStyle = COBALT_HI; ctx.beginPath(); ctx.moveTo(4, -2); ctx.quadraticCurveTo(14, -12 - f * 10, 26, -6 - f * 8); ctx.quadraticCurveTo(14, 0, 4, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = WHITE; ctx.beginPath(); ctx.ellipse(0, 0, 12, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-10, -6, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PAPER_HI; ctx.beginPath(); ctx.moveTo(-12, -13); ctx.lineTo(-9, -17); ctx.lineTo(-6, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
  // the beak: open, or gummed shut with a drip of gum hanging off it
  ctx.fillStyle = CORAL;
  if (stuck) { ctx.beginPath(); ctx.moveTo(-15, -8); ctx.lineTo(-27, -5); ctx.lineTo(-15, -3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffd8e8'; ctx.beginPath(); ctx.ellipse(-22, -2 + Math.sin(t * 6) * 1.5, 2.5, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  else { const o = m === 'swoop' ? 3 : 1; ctx.beginPath(); ctx.moveTo(-15, -9); ctx.lineTo(-27, -7 - o); ctx.lineTo(-15, -5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-15, -5); ctx.lineTo(-25, -2 + o); ctx.lineTo(-15, -3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(-11, -8, 1.6, stuck ? 0.6 : 2, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = CORAL; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-2, 7); ctx.lineTo(-3, 12); ctx.moveTo(3, 7); ctx.lineTo(3, 12); ctx.stroke();
  ctx.restore();
};
// MARGIN CRAB: a cobalt crab shaped like a ruler. It scuttles sideways along the quay and refuses to step over a
// ruled coral line (it stops, glares, and goes back). Its claws are coral; stomping it from above is fine.
const crabArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const st = Math.sin(t * 18) * 2, glare = e.refuse > 0;
  ctx.strokeStyle = COBALT_LO; ctx.lineWidth = 2.2; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * 9, -6 + k * 2); ctx.lineTo(s * (15 + k * 2), -2 + (k % 2 ? st : -st)); ctx.lineTo(s * (17 + k * 2), 0); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  ctx.fillStyle = COBALT; rr(ctx, -12, -18, 24, 14, 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = WHITE; ctx.lineWidth = 1; for (let k = -10; k <= 10; k += 4) { ctx.beginPath(); ctx.moveTo(k, -18); ctx.lineTo(k, k % 8 ? -15 : -13); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  for (const s of [-1, 1]) { ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(s * 15, -12 + (glare ? Math.sin(t * 30) * 1.5 : 0), 5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(s * 15, -12); ctx.lineTo(s * 20, -15); ctx.lineTo(s * 20, -10); ctx.closePath(); ctx.fill(); }
  for (const s of [-1, 1]) { ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(s * 4, -24, 3.5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(s * 4 + (e.dir || 1), -24, 1.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(s * 1, -29); ctx.lineTo(s * 7, glare ? -27 : -29); ctx.stroke(); }
  ctx.restore();
};
// BLOT PUP: a puppy made of one ink blot. It trots along, leaves an inky pawprint, then goes back to sniff it (a
// stop, a turn, a long sniff): its back is turned then.
const pupArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const sniff = m === 'sniff', st = m === 'walk' ? Math.sin(t * 16) * 2.5 : 0;
  ctx.fillStyle = BLACK;
  for (const lx of [-8, -3, 5, 10]) { ctx.beginPath(); ctx.ellipse(lx + (lx > 0 ? st : -st), -3, 3, 4, 0, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.ellipse(0, -10, 13, 8, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(-13, -15 + Math.sin(t * 9) * 2, 3, 0, TAU); ctx.arc(-15, -19, 2, 0, TAU); ctx.fill();
  const hx = sniff ? 14 : 13, hy = sniff ? -7 : -17;
  ctx.beginPath(); ctx.arc(hx, hy, 8, 0, TAU); ctx.fill();
  ctx.fillStyle = CORAL; ctx.beginPath(); ctx.ellipse(hx - 5, hy - 2, 4, 7, 0.4, 0, TAU); ctx.fill();
  ctx.fillStyle = WHITE; ctx.beginPath(); ctx.ellipse(hx + 3, hy - 2, 3, 3.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = BLACK; ctx.beginPath(); ctx.arc(hx + 4, hy - 1.5, 1.5, 0, TAU); ctx.fill();
  ctx.fillStyle = BLACK; ctx.beginPath(); ctx.arc(hx + 8, hy + 1, 2.2, 0, TAU); ctx.fill();
  if (sniff) { ctx.strokeStyle = BLACK; ctx.lineWidth = 1.2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(hx + 12, hy - 4 + k * 3); ctx.lineTo(hx + 16 + Math.sin(t * 20 + k) * 2, hy - 6 + k * 3); ctx.stroke(); } }
  else { ctx.fillStyle = CORAL; ctx.beginPath(); ctx.ellipse(hx + 6, hy + 6, 2, 3, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
};
// CREASE EEL: a folded paper eel with cobalt stripes. It slides along fast and can only turn at a fold line (a
// dashed crease standing up out of the ground): it rears up there first (the tell), then turns.
const eelArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
  const rear = m === 'rear' ? 1 : 0, w = Math.sin(t * 12);
  const pts = []; for (let k = 0; k <= 5; k++) pts.push([-24 + k * 8, -4 - (k % 2 ? 6 : 0) + (k === 5 ? -rear * 14 : 0) + w * (k % 2 ? 1 : -1)]);
  for (let k = 0; k < 5; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; ctx.fillStyle = k % 2 ? PAPER_HI : PAPER_LO; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 + 8); ctx.lineTo(x0, y0 + 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = COBALT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lerp(x0, x1, 0.6), lerp(y0, y1, 0.6)); ctx.lineTo(lerp(x0, x1, 0.4), lerp(y0, y1, 0.4) + 8); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; }
  const [hx, hy] = pts[5];
  ctx.fillStyle = WHITE; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 10, hy - 2); ctx.lineTo(hx, hy + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = CORAL; ctx.beginPath(); ctx.moveTo(hx + 10, hy - 2); ctx.lineTo(hx + 16, hy + 2); ctx.lineTo(hx + 6, hy + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + 4, hy + 1, 1.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-24, -4); ctx.lineTo(-30, -10); ctx.lineTo(-30, 2); ctx.closePath(); ctx.fillStyle = PAPER_LO; ctx.fill(); ctx.stroke();
  ctx.restore();
};
// the pup's pawprint (harmless scenery it goes back to sniff)
class PostPaw extends Ent {
  constructor(g, s) { super(g, s, 10, 6); this.x = s.x - 5; this.y = s.y - 4; this.life = 3; this.friendly = true; this.back = true; }
  update(dt) { this.t += dt; if (this.t > this.life) this.remove = true; }
  touchPlayer() {}
  draw(ctx) { ctx.save(); ctx.globalAlpha = clamp((this.life - this.t) * 1.5, 0, 0.85); ctx.fillStyle = BLACK; const x = this.x + 5, y = this.y + 3; ctx.beginPath(); ctx.ellipse(x, y + 1, 3.5, 2.5, 0, 0, TAU); for (const [dx, dy] of [[-4, -2], [-1.5, -3.5], [1.5, -3.5], [4, -2]]) ctx.ellipse(x + dx, y + dy, 1.3, 1.1, 0, 0, TAU); ctx.fill(); ctx.restore(); }
}
ENTITY_TYPES.postPaw = PostPaw;
// the margin crab: walks; at a ruled line (a decor 'postRule' in the area) it stops, glares 0.5 s and turns back
const ruleXs = g => { const A = g.area; if (A.__postRules) return A.__postRules; const xs = []; for (const d of A.decor || []) if (d.kind === 'postRule' || d.type === 'postRule' || d.name === 'postRule') xs.push(d.x); A.__postRules = xs; return xs; };
const foldXs = g => { const A = g.area; if (A.__postFolds) return A.__postFolds; const xs = []; for (const d of A.decor || []) if (d.kind === 'postFoldMark' || d.type === 'postFoldMark' || d.name === 'postFoldMark') xs.push(d.x); A.__postFolds = xs; return xs; };
const crabThink = (e, dt) => {
  e.mode = 'walk';
  if (e.refuse > 0) { e.refuse -= dt; e.vx = 0; if (e.refuse <= 0) { e.dir = -e.dir; e.vx = e.dir * e.speed; e.ignore = 0.5; } return; }
  if (e.ignore > 0) e.ignore -= dt;
  if (!e.vx) e.vx = e.dir * e.speed;
  const ahead = e.cx + e.dir * (e.w / 2 + 4);
  if (!(e.ignore > 0)) for (const x of ruleXs(e.g)) if (Math.abs(ahead - x) < 4) { e.refuse = 0.6; e.vx = 0; Tour.postKit.pill(e.g, e.cx, e.y - 10, 'NOT OVER THE LINE!', '#c8d8ff'); break; }
};
const pupThink = (e, dt) => {
  e.st = (e.st || 0) + dt;
  if (!e.ph) e.ph = 'walk';
  if (e.ph === 'walk') { e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed; if (e.st > 1.6 && e.onGround) { e.ph = 'print'; e.st = 0; e.vx = 0; e.g.spawn(new PostPaw(e.g, { x: e.cx - e.dir * 6, y: e.y + e.h })); e.px = e.cx - e.dir * 6; } }
  else if (e.ph === 'print') { e.mode = 'idle'; e.vx = 0; if (e.st > 0.3) { e.ph = 'back'; e.st = 0; e.dir = -e.dir; } }
  else if (e.ph === 'back') { e.mode = 'walk'; e.vx = e.dir * e.speed * 0.6; if (Math.abs(e.cx - e.px) < 8 || e.st > 1.2) { e.ph = 'sniff'; e.st = 0; e.vx = 0; } }
  else if (e.ph === 'sniff') { e.mode = 'sniff'; e.vx = 0; if (e.st > 1.1) { e.ph = 'walk'; e.st = 0; e.dir = -e.dir; e.vx = e.dir * e.speed; } }
};
const eelThink = (e, dt) => {
  if (e.rear > 0) { e.rear -= dt; e.vx = 0; e.mode = 'rear'; if (e.rear <= 0) { e.dir = -e.dir; e.vx = e.dir * e.speed; e.ignore = 0.6; } return; }
  e.mode = 'walk'; if (e.ignore > 0) e.ignore -= dt;
  if (!e.vx || e.hitWall) e.vx = e.dir * e.speed;
  const ahead = e.cx + e.dir * (e.w / 2);
  if (!(e.ignore > 0)) for (const x of foldXs(e.g)) if (Math.abs(ahead - x) < 5) { e.rear = 0.6; e.vx = 0; break; }
};
const enemies = {
  postGull: { cls: TourFlyer.make({ w: 30, h: 20, range: 3, speed: 0.7, swoop: true, art: gullArt, burst: '#fffdf4',
    think: null, onSwoop: e => { if (e.g.onScreen(e)) Tour.postKit.pill(e.g, e.cx, e.y - 10, 'PECK!', '#ffd8c8'); } }), place: 'fly' },
  postCrab: { cls: TourEnemy.make({ w: 30, h: 24, speed: 1.1, edgeTurn: true, art: crabArt, burst: '#2f4fc8', think: crabThink }), place: 'walk' },
  postPup: { cls: TourEnemy.make({ w: 30, h: 22, speed: 1.4, edgeTurn: true, art: pupArt, burst: '#16141e', think: pupThink }), place: 'walk' },
  postEel: { cls: TourEnemy.make({ w: 40, h: 16, speed: 2.2, edgeTurn: true, art: eelArt, burst: '#fbe6a2', think: eelThink }), place: 'walk' }
};
// the gull: after every swoop (a peck) its beak gums shut for 1.6 s: it hangs where it is, flapping, harmless
{
  const G = enemies.postGull.cls, up0 = G.prototype.update, tp0 = G.prototype.touchPlayer;
  G.prototype.update = function (dt) {
    if (this.gum > 0 && !this.dead && !this.knocked) { this.t += dt; this.gum -= dt; this.y = this.gy + Math.sin(this.t * 6) * 3; if (this.gum <= 0) Tour.postKit.pill(this.g, this.cx, this.y - 10, 'POP!', '#ffd8c8'); return; }
    const was = this.state; const r = up0.call(this, dt);
    if (was === 'swoop' && this.state === 'drift' && !this.dead) { this.gum = 1.6; this.gy = this.y; Tour.postKit.pill(this.g, this.cx, this.y - 10, 'MMF! GUMMED SHUT', '#ffd8c8'); }
    return r;
  };
  G.prototype.touchPlayer = function (p) { if (this.gum > 0) return; return tp0.call(this, p); };
}

/* ---------------- the route map: a little stamp in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.5) * 0.06);
  PostArt.stamp(ctx, -r * 0.6, -r * 0.7, r * 1.2, r * 1.4, 2, COBALT);
  ctx.restore();
};

/* ---------------- the land's map: sprites ---------------- */
Object.assign(TourOWPaint.art, {
  // a folded paper boat on the printed sea
  postBoatS(c, r) { PostArt.boat(c, 0, 0, r / 30); },
  // a big postmark printed across the land
  postMarkS(c, r) { PostArt.postmark(c, -r * 0.4, -r * 0.4, r * 0.6, BLACK, 0.8); },
  // a stamp lying on the map
  postStampS(c, r) { PostArt.stamp(c, -r * 0.6, -r * 1.4, r * 1.2, r * 1.4, 0, CORAL); },
  // a card quay with mooring posts
  postQuayS(c, r) { this.P(c, [[-r, 0], [-r, -r * 0.5], [r, -r * 0.5], [r, 0]], PAPER_HI); c.fillStyle = COBALT; c.fillRect(-r, -r * 0.62, r * 2, r * 0.16); for (const dx of [-0.6, 0, 0.6]) { c.fillStyle = CORAL; c.fillRect(dx * r - 2, -r * 0.9, 4, r * 0.3); } },
  // the thumb, sent home (the boss's stop): a thumb print
  postThumbS(c, r) { c.strokeStyle = 'rgba(22,20,30,0.75)'; c.lineWidth = 1.6; for (let k = 1; k <= 5; k++) { c.beginPath(); c.ellipse(0, -r * 0.6, r * 0.12 * k, r * 0.16 * k, 0, 0, TAU); c.stroke(); } }
});
// a postcard's deckled white border instead of a coast: a shadow, the white card edge, then the printed land
TourOWLands.coast.postEdge = function (c, ow, ring) {
  const L = ow.look, ink = this.INK;
  c.save(); c.translate(8, 12); OWGeo.path(c, ring, true); c.fillStyle = 'rgba(20,18,40,0.3)'; c.fill(); c.restore();
  c.save(); OWGeo.path(c, ring, true); c.strokeStyle = WHITE; c.lineWidth = 30; c.stroke(); c.restore();
  c.save(); OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2; c.setLineDash([3, 5]); c.lineWidth = 32; c.globalAlpha = 0.12; c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
  c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = COBALT; c.lineWidth = 10; OWGeo.path(c, ring, true); c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke();
};
// the printed land under the trails: halftone dots, cobalt wave lines and a big postmark
TourOWScenes.groundPaint.post = function (c, ow) {
  const R = TourOWPaint.rng('postground'), A = TourOWPaint.art;
  c.fillStyle = 'rgba(47,79,200,0.12)'; for (let y = 180; y < 720; y += 14) for (let x = 200 + (y % 28 ? 7 : 0); x < 1340; x += 14) { c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill(); }
  for (let k = 0; k < 5; k++) { c.save(); c.translate(300 + R() * 900, 220 + R() * 420); A.postMarkS.call(TourOWPaint, c, 40 + R() * 20); c.restore(); }
};
TourLandscape.looks.post = ['#c8e8f8', '#5a7ae8', '#2f4fc8', '#fbe6a2', '#fff4cc', '#f47a5a', 'postHarbour'];
{
  // the land's landmark miniature: a postcard propped up with a printed wave and a stamp
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'postHarbour') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40); ctx.lineWidth = 2; ctx.strokeStyle = ink || INK; ctx.lineJoin = 'round';
    ctx.fillStyle = WHITE; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-20, -34); ctx.lineTo(26, -30); ctx.lineTo(22, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8ac8f0'; ctx.beginPath(); ctx.moveTo(-20, -4); ctx.lineTo(-16, -30); ctx.lineTo(10, -28); ctx.lineTo(8, -4); ctx.closePath(); ctx.fill();
    PostArt.scallops(ctx, -20, 4, -12, 3.5, COBALT);
    PostArt.stamp(ctx, 12, -26, 10, 12, 0, CORAL);
    ctx.restore();
  };
}

/* ---------------- music: a seaside waltz, a desk shuffle, a music-box room tune, the boss ---------- */
const tracks = {
  tour_post: {
    bpm: 112, bpb: 3, bars: 8, rv: 0.3, hx: 0.04, sw: 0.05,
    ch: 'C Am F G C Em F G',
    ld: 'E6:3 G6:3 C7:6 | A6:3 C7:3 E7:6 | F6:3 A6:3 C7:3 A6:3 | G6:6 B6:6 | E7:3 D7:3 C7:6 | B6:3 G6:3 E6:6 | F6:3 A6:3 D7:6 | G6:12',
    li: 'vibes', lv: 0.14,
    bp: 'r.....f.....', bi: 'pluck', bv: 0.26,
    ap: '..c.c...c.c.', ai: 'harp', av: 0.05, ao: 60,
    dr: ['k...........', '......s.....', '..h...h...h.'], dv: 0.25
  },
  tour_post_desk: {
    bpm: 100, bars: 8, rv: 0.25, sw: 0.18, hx: 0.04,
    ch: 'F Dm Gm C F Dm Bb C',
    ld: 'A6:2 C7:2 F7:4 E7:2 C7:2 | D7:4 A6:4 F6:8 | G6:2 Bb6:2 D7:4 C7:2 Bb6:2 | A6:4 G6:4 E6:8 |' +
        'F6:2 A6:2 C7:4 D7:2 C7:2 | A6:4 F6:4 D6:8 | Bb6:2 D7:2 F7:4 E7:2 D7:2 | C7:4 E7:4 F7:8',
    li: 'clav', lv: 0.12,
    bp: 'r...f...r.r.o...', bi: 'slapb', bv: 0.26,
    ap: '.c...c...c...c..', ai: 'vibes', av: 0.05, ao: 58,
    dr: ['k.....k...k.....', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.28
  },
  tour_post_room: {
    bpm: 88, bpb: 3, bars: 8, rv: 0.5, dl: 0.2, hx: 0.03,
    ch: 'G D Em C G D C D',
    ld: 'B6:3 D7:3 G7:6 | A6:3 F#6:3 D6:6 | G6:3 B6:3 E7:6 | C7:6 E7:6 | D7:3 B6:3 G6:6 | F#6:3 A6:3 D7:6 | E7:3 C7:3 G6:6 | A6:12',
    li: 'mbox', lv: 0.13,
    bp: 'r.....r.....', bi: 'sub', bv: 0.22,
    ap: 'c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 64,
    dr: ['k...........', '......s.....', '..h...h...h.'], dv: 0.16
  },
  tour_post_boss: {
    bpm: 140, bars: 8, rv: 0.3, hx: 0.07,
    ch: 'Dm Dm Bb C Dm Dm Gm A7',
    ld: 'D6:2 F6:2 A6:2 D7:2 C7:4 A6:4 | Bb6:2 A6:2 G6:2 F6:2 D6:8 | Bb6:2 D7:2 F7:2 D7:2 C7:4 Bb6:4 | C7:4 E7:4 G7:8 |' +
        'A6:2 G6:2 F6:2 D6:2 F6:4 A6:4 | G6:2 F6:2 E6:2 F6:2 D6:8 | G6:2 Bb6:2 D7:2 G7:2 F7:4 D7:4 | E7:4 C#7:4 A6:8',
    li: 'vibes', lv: 0.15,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'reese', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'brass', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s..s', 'h.h.h.h.h.h.h.h.'], dv: 0.4
  }
};

Tour.country({
  id: 'post', secret: true, bonus: true, colors: COL, tagline: 'A hidden land: the printed harbour on Chinka-O\'s seaside postcard, and it keeps right on going',
  themes, painters, decor, decorLights, enemies, tracks,
  music: { level: 'tour_post', boss: 'tour_post_boss', map: null },
  landmark: 'the harbour printed on the postcard', emblem,
  arrival: 'Brady! You found the corner I licked down crooked. The little harbour on my card goes on and on, and the gulls stick their own beaks shut. Wish you were here. You are. ♥ C',
  coin: { name: 'STAMPS', draw(ctx, x, y) {
    ctx.fillStyle = WHITE; ctx.beginPath(); for (let k = 0; k < 16; k++) { const a = k * TAU / 16, q = k % 2 ? 7.4 : 8.8; ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = CORAL; ctx.fillRect(x - 5, y - 5, 10, 10); ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(x, y + 1, 2.5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 5, y - 5, 2, 2);
  } },
  levels: []
});
// a floating line on a dark rounded pill (every word the land floats: readable on any sky), kept clear of Brady's
// head and the top bar, inside the view
class PostPill extends Ent {
  constructor(g, x, y, text, col) { super(g, null, 4, 4); this.x = x; this.y = y; this.text = String(text); this.col = col || '#ffe08a'; this.life = 1.7; this.friendly = true; }
  update(dt) { this.t += dt; this.y -= 10 * dt; if (this.t > this.life) this.remove = true; }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, p = g.player, a = Math.min(1, (this.life - this.t) * 3, this.t * 8);
    ctx.save(); ctx.globalAlpha = a; ctx.font = '10px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(this.text).width + 18;
    let x = clamp(this.x, g.camX + w / 2 + 6, g.camX + Game.viewW - w / 2 - 6), y = this.y;
    if (p && Math.abs(x - p.cx) < w / 2 + 16 && y > p.y - 30 && y < p.y + p.h) y = p.y - 30;
    y = Math.max(y, g.camY + 64);
    ctx.fillStyle = 'rgba(22,20,40,0.88)'; rr(ctx, x - w / 2, y - 10, w, 20, 10); ctx.fill();
    ctx.fillStyle = this.col; ctx.fillText(this.text, x, y + 1); ctx.restore();
  }
}
ENTITY_TYPES.postPill = PostPill;
const pill = (g, x, y, text, col) => { if (g && g.spawn) g.spawn(new PostPill(g, x, y, text, col)); };
// for the other post files and the tests
Tour.postKit = { pill, COL, INK, PostArt, PAPER, PAPER_HI, PAPER_LO, PAPER_SH, COBALT, COBALT_HI, COBALT_LO, CORAL, CORAL_LO, BLACK, WHITE };
})();
