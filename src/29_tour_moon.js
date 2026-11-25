/* ============================================================
   THE MOON (world 18, cc 'moon'): the last tour date of the Encore Tour (docs/design/ENCORE_TOUR.md).
   "LIVE ON THE MOON. No atmosphere. Great acoustics." Piwi booked the headliner months ago: Madame Moo, the cow who
   jumped over the moon. Nobody cancelled her. Grey dust, craters, the Earth hanging in a black sky, Piwi's posters
   on every rim, forgotten golf balls, wind-up stagehands in fishbowl helmets.
   This file: the looks (tiles, themes, painted backdrops, props), the critters, the route-map emblem, the map's
   sprites and painters, the music and the country itself.
   The land's mechanics (low gravity, the spacewalk, the moon buggy, the magnet boots, the star pads):
   29_tour_moon_a_mech.js. The boss (Madame Moo) and her stage: 29_tour_moon_boss.js. The levels and the land's
   map: 29_tour_moon_levels.js.
   ============================================================ */
(function () {
const COL = { a: '#8a7aff', b: '#1a1a44', c: '#ffd84a' };
const INK = '#1a1426';
const DUST = '#cfcad6', DUST_HI = '#ecE8f2', DUST_LO = '#8e889c', BASALT = '#4a4658';
const PIWI = '#ff4f8a';
const K = TourKit;

/* ---------------- tiles ---------------- */
// the regolith: pale grey moon dust over darker rock; little craters and footprints in the top; boulders as bricks
const dustGround = {
  style: 'dust', cap: DUST_HI, capHi: '#ffffff', dirt: '#a8a2b4', dirt2: '#8e889c', rock: '#7a7488',
  paint(ctx, rng) {
    ctx.fillStyle = '#9c96aa'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#aaa4b8'; ctx.fillRect(0, 0, TS, 3);
    for (let k = 0; k < 2; k++) if (rng() < 0.55) { const x = 5 + rng() * 22, y = 7 + rng() * 18, r = 2 + rng() * 3.5; ctx.fillStyle = '#857f94'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.fillStyle = '#b4aec2'; ctx.beginPath(); ctx.arc(x + r * 0.25, y + r * 0.3, r * 0.65, 0, TAU); ctx.fill(); }
    if (rng() < 0.4) { ctx.fillStyle = '#c4bed0'; ctx.fillRect(rng() * 28, rng() * 28, 2, 2); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#8e889c'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = DUST_HI; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, 0, x1 - x0, 2);
    // little craters and boot prints pressed into the dust
    ctx.fillStyle = '#bcb6c8'; for (let x = x0 + 7; x < x1; x += 23) { ctx.beginPath(); ctx.ellipse(x, 4.5, 3.2, 1.6, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#d2ccdc'; for (let x = x0 + 16; x < x1; x += 37) { ctx.fillRect(x, 3, 4, 2); ctx.fillRect(x + 7, 4, 4, 2); }
  }
};
const dustSemi = {
  style: 'slab', c1: '#d8d2e2', c2: '#8e889c',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#7a7488'; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.lineTo(x1 - 2, 11); ctx.lineTo(x0 + 2, 11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e4dfec'; ctx.fillRect(x0, 0, x1 - x0, 5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, 0, x1 - x0, 1.5);
    ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5);
    ctx.fillStyle = '#a8a2b4'; for (let x = x0 + 5; x < x1; x += 13) ctx.fillRect(x, 6, 4, 2);
  }
};
const dustBrick = {
  style: 'boulder', c1: '#b8b2c4', c2: '#6a6478', mortar: '#3a3448',
  paint(ctx) {
    ctx.fillStyle = '#3a3448'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#a8a2b4'; ctx.beginPath(); ctx.moveTo(2, 8); ctx.lineTo(9, 2); ctx.lineTo(24, 2); ctx.lineTo(30, 9); ctx.lineTo(30, 26); ctx.lineTo(23, 30); ctx.lineTo(7, 30); ctx.lineTo(2, 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c8c2d4'; ctx.beginPath(); ctx.moveTo(5, 9); ctx.lineTo(10, 5); ctx.lineTo(22, 5); ctx.lineTo(16, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a8498'; ctx.beginPath(); ctx.arc(20, 20, 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(2, 8); ctx.lineTo(9, 2); ctx.lineTo(24, 2); ctx.lineTo(30, 9); ctx.lineTo(30, 26); ctx.lineTo(23, 30); ctx.lineTo(7, 30); ctx.lineTo(2, 24); ctx.closePath(); ctx.stroke();
  }
};
const dustHard = {
  c1: '#5a5468', c2: '#3a3448',
  paint(ctx) {
    ctx.fillStyle = BASALT; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#5c5870'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(TS, 0); ctx.lineTo(TS - 6, 10); ctx.lineTo(4, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#34304a'; ctx.fillRect(0, TS - 5, TS, 5);
    ctx.fillStyle = '#6a6680'; ctx.fillRect(6, 16, 3, 3); ctx.fillRect(20, 22, 2, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the orbiting venue and the moon base: hull plates with rivets and hazard stripes, steel grating, road cases
const hullGround = {
  style: 'metal', cap: '#dfe4ee', capHi: '#ffffff', dirt: '#7a8296', dirt2: '#5a6276', rock: '#4a5266',
  paint(ctx) {
    ctx.fillStyle = '#6a7286'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#7a8296'; ctx.fillRect(1, 1, TS - 2, TS - 2);
    ctx.fillStyle = '#5a6276'; ctx.fillRect(0, TS / 2 - 1, TS, 2);
    ctx.fillStyle = '#a8b0c2'; for (const [x, y] of [[4, 4], [TS - 6, 4], [4, TS - 6], [TS - 6, TS - 6]]) ctx.fillRect(x, y, 2, 2);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#4a5266'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = '#dfe4ee'; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, 0, x1 - x0, 1.5);
    ctx.fillStyle = '#ffd84a'; for (let x = x0; x < x1; x += 16) { ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x + 6, 6); ctx.lineTo(x + 10, 10); ctx.lineTo(x + 4, 10); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = INK; for (let x = x0 + 8; x < x1; x += 16) { ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x + 6, 6); ctx.lineTo(x + 10, 10); ctx.lineTo(x + 4, 10); ctx.closePath(); ctx.fill(); }
  }
};
const hullSemi = {
  style: 'grate', c1: '#c8d0dc', c2: '#6a7286',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#5a6276'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = '#c8d0dc'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = '#2a3042'; for (let x = x0 + 2; x < x1 - 2; x += 5) ctx.fillRect(x, 5, 3, 3);
    ctx.fillStyle = INK; ctx.fillRect(x0, 9, x1 - x0, 1.5);
  }
};
const hullBrick = {
  style: 'roadcase', c1: '#2a2a3a', c2: '#14141e', mortar: '#0a0a12',
  paint(ctx) {
    ctx.fillStyle = '#26263a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#b8bec8'; ctx.fillRect(0, 0, TS, 4); ctx.fillRect(0, TS - 4, TS, 4); ctx.fillRect(0, 0, 4, TS); ctx.fillRect(TS - 4, 0, 4, TS);
    ctx.fillStyle = PIWI; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', TS / 2, TS / 2 + 1);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const hullHard = {
  c1: '#8a92a6', c2: '#4a5266',
  paint(ctx) {
    ctx.fillStyle = '#5a6276'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#8a92a6'; ctx.fillRect(2, 2, TS - 4, TS - 4);
    ctx.fillStyle = '#6a7286'; ctx.fillRect(5, 5, TS - 10, TS - 10);
    ctx.fillStyle = '#c8d0dc'; for (const [x, y] of [[3, 3], [TS - 5, 3], [3, TS - 5], [TS - 5, TS - 5]]) ctx.fillRect(x, y, 2, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the star field (18-6): deep blue night glass, starlight planks
const glassGround = {
  style: 'glass', cap: '#b8c8ff', capHi: '#ffffff', dirt: '#2a2a6a', dirt2: '#1a1a4a', rock: '#14143a',
  paint(ctx, rng) {
    ctx.fillStyle = '#22225a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#2c2c6c'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(TS * 0.6, 0); ctx.lineTo(0, TS * 0.6); ctx.closePath(); ctx.fill();
    if (rng() < 0.5) { ctx.fillStyle = '#c8d4ff'; ctx.fillRect(4 + rng() * 22, 6 + rng() * 20, 1.5, 1.5); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#4a4aa0'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#b8c8ff'; ctx.fillRect(x0, 0, x1 - x0, 5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, 0, x1 - x0, 1.5);
    ctx.fillStyle = '#ffe8a0'; for (let x = x0 + 9; x < x1; x += 24) { ctx.beginPath(); ctx.arc(x, 6.5, 1.4, 0, TAU); ctx.fill(); }
  }
};
const glassSemi = {
  style: 'starplank', c1: '#ffe8a0', c2: '#b89a3a',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = 'rgba(255,232,160,0.35)'; ctx.fillRect(x0, -3, x1 - x0, 14);
    ctx.fillStyle = '#c8a84a'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#fff4c8'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = INK; ctx.fillRect(x0, 8.5, x1 - x0, 1.5);
  }
};
const regolith = { ground: dustGround, semi: dustSemi, brick: dustBrick, hard: dustHard, pillar: { c1: '#c8c2d4', c2: '#6a6478', cap: COL.c, style: 'column' }, accent: COL.a, tint: {}, bloom: 0.18, liquid: null };
const hull = { ground: hullGround, semi: hullSemi, brick: hullBrick, hard: hullHard, pillar: { c1: '#c8d0dc', c2: '#5a6276', cap: '#ffd84a', style: 'column' }, accent: COL.c, tint: {}, bloom: 0.16, liquid: null };
const glass = { ground: glassGround, semi: glassSemi, brick: hullBrick, hard: dustHard, pillar: { c1: '#b8c8ff', c2: '#2a2a6a', cap: '#ffe8a0', style: 'column' }, accent: '#ffe8a0', tint: {}, bloom: 0.3, liquid: null };

/* ---------------- shared drawings ---------------- */
const MoonArt = {
  // the Earth hanging in the sky: an invented blue-and-green globe (no real map), white cloud swirls, a night side
  earth(ctx, x, y, r, rng) {
    ctx.save();
    const g = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 1.6); g.addColorStop(0, 'rgba(120,180,255,0.35)'); g.addColorStop(1, 'rgba(120,180,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    ctx.fillStyle = '#2a6ad8'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = '#4ab86a';
    const blobs = [[-0.35, -0.3, 0.42], [0.3, 0.15, 0.36], [-0.1, 0.45, 0.25], [0.5, -0.45, 0.2]];
    for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.ellipse(x + bx * r, y + by * r, br * r, br * r * 0.7, bx * 2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#c8a86a'; ctx.beginPath(); ctx.ellipse(x + 0.28 * r, y + 0.1 * r, 0.14 * r, 0.1 * r, 0.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1.5, r * 0.09); ctx.lineCap = 'round';
    for (const [sx, sy, a] of [[-0.6, 0.05, 0.6], [0.1, -0.55, 0.8], [-0.2, 0.7, 0.5], [0.55, 0.45, 0.4]]) { ctx.beginPath(); ctx.arc(x + sx * r, y + sy * r, r * 0.35, -a, a * 0.6); ctx.stroke(); }
    ctx.fillStyle = 'rgba(6,8,30,0.55)'; ctx.beginPath(); ctx.arc(x + r * 0.55, y + r * 0.35, r * 1.05, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(200,230,255,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 0.75, Math.PI * 1.75); ctx.stroke();
  },
  // a Piwi tour poster: LIVE ON THE MOON (a big P, a crescent, the headliner's horns)
  poster(ctx, x, y, w, h, line2) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#1e1a3a'; rr(ctx, x - w / 2, y - h, w, h, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PIWI; ctx.fillRect(x - w / 2 + 3, y - h + 3, w - 6, h * 0.22);
    ctx.fillStyle = '#ffffff'; ctx.font = Math.max(5, Math.round(w * 0.13)) + 'px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('LIVE ON THE', x, y - h + 3 + h * 0.11);
    ctx.fillStyle = '#ffe8a0'; ctx.beginPath(); ctx.arc(x, y - h * 0.46, w * 0.22, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1e1a3a'; ctx.beginPath(); ctx.arc(x + w * 0.09, y - h * 0.5, w * 0.19, 0, TAU); ctx.fill();
    ctx.fillStyle = COL.c; ctx.font = Math.max(6, Math.round(w * 0.2)) + 'px ' + FONT_DISPLAY; ctx.fillText('MOON', x, y - h * 0.2);
    ctx.fillStyle = '#c8c2e8'; ctx.font = Math.max(4, Math.round(w * 0.09)) + 'px ' + FONT_DISPLAY; ctx.fillText(line2 || 'GREAT ACOUSTICS', x, y - h * 0.08);
    ctx.restore();
  },
  // a fishbowl helmet over whatever is inside it (a glassy dome with a highlight)
  bowl(ctx, x, y, r) {
    ctx.save(); ctx.fillStyle = 'rgba(200,230,255,0.28)'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 0.7, -2.4, -1.6); ctx.stroke();
    ctx.restore();
  },
  // a forgotten golf ball with its dimples
  golf(ctx, x, y, r) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.fillStyle = '#fbfbff'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8c8d8'; for (const [a, d] of [[0.3, 0.45], [1.6, 0.5], [2.7, 0.4], [4, 0.55], [5.2, 0.35]]) { ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * d, y + Math.sin(a) * r * d, r * 0.13, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a little crescent moon (the emblem, cards, the route pin)
  crescent(ctx, x, y, r, col, back) {
    ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.globalCompositeOperation = back ? 'source-over' : 'destination-out'; ctx.fillStyle = back || '#000'; ctx.beginPath(); ctx.arc(x + r * 0.45, y - r * 0.25, r * 0.85, 0, TAU); ctx.fill();
    ctx.restore();
  }
};

/* ---------------- painted backdrops ---------------- */
const painters = {
  // the Earth, high in the black sky (a far layer that hardly moves)
  moonEarth(ctx, L, rng, H) {
    MoonArt.earth(ctx, L.x || 760, L.y || 90, L.r || 34, rng);
    // a few bright far stars that sit in front of the theme's star field
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 14; k++) { const x = rng() * BG_W, y = rng() * 220; ctx.fillRect(x, y, 2, 2); ctx.fillRect(x - 2, y + 0.5, 6, 1); ctx.fillRect(x + 0.5, y - 2, 1, 6); }
  },
  // far crater rims: a pale lavender range with round bites taken out of the top, shadowed crater bowls
  moonFarRims(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H);
    let x = 0; ctx.lineTo(0, b);
    while (x < BG_W) { const w = 120 + rng() * 140, h = 30 + rng() * 60; ctx.quadraticCurveTo(x + w * 0.15, b - h, x + w * 0.3, b - h * 0.95); ctx.lineTo(x + w * 0.7, b - h * 0.9); ctx.quadraticCurveTo(x + w * 0.85, b - h, x + w, b); x += w; }
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(L.color, -0.18);
    for (let k = 0; k < 9; k++) { const cx = rng() * BG_W, cy = b + 20 + rng() * 60, r = 18 + rng() * 36; wrapDraw(cx - r, r * 2, X => { ctx.beginPath(); ctx.ellipse(X + r, cy, r, r * 0.3, 0, 0, TAU); ctx.fill(); }); }
    ctx.fillStyle = shade(L.color, 0.1);
    for (let k = 0; k < 9; k++) { const cx = rng() * BG_W, cy = b + 30 + rng() * 60, r = 14 + rng() * 26; wrapDraw(cx - r, r * 2, X => { ctx.beginPath(); ctx.ellipse(X + r, cy - 3, r, r * 0.18, 0, Math.PI, 0); ctx.fill(); }); }
  },
  // the near rim: darker grey ridges, boulders, a Piwi billboard now and then (LIVE ON THE MOON)
  moonNearRim(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, b);
    for (let x = 0; x <= BG_W; x += 32) ctx.lineTo(x, b - Math.abs(Math.sin(x * 0.011) * 26) - Math.abs(Math.sin(x * 0.037 + 1)) * 10);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(L.color, 0.12); for (let x = 0; x <= BG_W; x += 32) ctx.fillRect(x, b - Math.abs(Math.sin(x * 0.011) * 26) - Math.abs(Math.sin(x * 0.037 + 1)) * 10, 32, 3);
    for (let k = 0; k < 7; k++) { const x = rng() * BG_W, y = b + 10 + rng() * 40, r = 6 + rng() * 10; wrapDraw(x - r, r * 2, X => { ctx.fillStyle = shade(L.color, -0.15); ctx.beginPath(); ctx.ellipse(X + r, y, r, r * 0.7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = shade(L.color, 0.15); ctx.beginPath(); ctx.ellipse(X + r - 2, y - 2, r * 0.6, r * 0.35, 0, 0, TAU); ctx.fill(); }); }
    if (L.posters !== false) for (let x = 140 + rng() * 80; x < BG_W - 60; x += 360 + rng() * 120) {
      const y = b - 30;
      ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(x - 2, y - 4, 4, 34); ctx.fillRect(x - 26, y - 4, 3, 34); ctx.fillRect(x + 23, y - 4, 3, 34);
      MoonArt.poster(ctx, x, y, 58, 46);
    }
  },
  // 18-2: the orbiting venue far behind: a great ring with lit windows and a stage dome; the moon's curve below
  moonVenue(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = '#b8b2c8'; ctx.beginPath(); ctx.ellipse(BG_W / 2, b + 900, 1400, 920, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#9a94ac'; for (let k = 0; k < 18; k++) { const x = rng() * BG_W, r = 10 + rng() * 24; ctx.beginPath(); ctx.ellipse(x, b + 30 + rng() * 40, r, r * 0.25, 0, 0, TAU); ctx.fill(); }
    const cx = L.x || 520, cy = L.y || 150;
    ctx.strokeStyle = '#5a6276'; ctx.lineWidth = 14; ctx.beginPath(); ctx.ellipse(cx, cy, 200, 46, -0.08, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#8a92a6'; ctx.lineWidth = 8; ctx.stroke();
    ctx.fillStyle = '#ffe28a'; for (let k = 0; k < 28; k++) { const a = k / 28 * TAU; ctx.fillRect(cx + Math.cos(a) * 200 - 2, cy + Math.sin(a) * 46 - 1 - Math.cos(a) * 16 * -0.08, 4, 3); }
    ctx.fillStyle = '#6a7286'; ctx.fillRect(cx - 6, cy - 40, 12, 80);
    ctx.fillStyle = '#c8d0dc'; ctx.beginPath(); ctx.arc(cx, cy - 4, 34, Math.PI, 0); ctx.fill();
    ctx.fillStyle = PIWI; ctx.font = '14px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('P', cx, cy - 12);
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(cx - 40, cy - 4, 80, 6);
  },
  // 18-4: the moon base's wall: curved white panels, round portholes onto the black sky (stars, the Earth once),
  // pipes, hazard stripes, Piwi's stencils
  moonBaseWall(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 128) { ctx.fillStyle = shade(L.color, -0.12); ctx.fillRect(x, 0, 6, H); ctx.fillStyle = shade(L.color, 0.1); ctx.fillRect(x + 6, 0, 2, H); }
    ctx.fillStyle = shade(L.color, -0.22); ctx.fillRect(0, b - 260, BG_W, 10); ctx.fillRect(0, b - 40, BG_W, 8);
    for (let x = 64; x < BG_W; x += 128) {
      const cy = b - 150, r = 30;
      ctx.fillStyle = shade(L.color, -0.3); ctx.beginPath(); ctx.arc(x, cy, r + 7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#05061a'; ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) ctx.fillRect(x - r * 0.7 + rng() * r * 1.4, cy - r * 0.7 + rng() * r * 1.4, 1.5, 1.5);
      if (x === 320) { ctx.save(); ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.clip(); MoonArt.earth(ctx, x + 8, cy - 6, 14, rng); ctx.restore(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, cy, r - 5, -2.5, -1.7); ctx.stroke();
    }
    ctx.fillStyle = shade(L.color, -0.35); ctx.fillRect(0, b - 92, BG_W, 7); ctx.fillRect(0, b - 80, BG_W, 4);
    ctx.fillStyle = '#ffd84a'; for (let x = 0; x < BG_W; x += 22) { ctx.fillRect(x, b - 24, 11, 6); }
    ctx.fillStyle = shade(L.color, -0.4); ctx.font = '12px ' + FONT_DISPLAY; ctx.textAlign = 'center';
    for (let x = 200; x < BG_W; x += 512) ctx.fillText('PIWI LIVE · STAGE DOOR', x, b - 60);
  },
  // the base's girders in front of the wall
  moonGirders(ctx, L, rng, H) {
    const b = L.base;
    ctx.strokeStyle = L.color; ctx.lineWidth = 10;
    for (let x = 0; x < BG_W; x += 256) { ctx.beginPath(); ctx.moveTo(x, b); ctx.lineTo(x + 128, b - 220); ctx.lineTo(x + 256, b); ctx.stroke(); }
    ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, b - 220); ctx.lineTo(BG_W, b - 220); ctx.stroke();
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
  },
  // 18-5: the crater amphitheatre: rows of grey crater terraces like seats (the audience are moon bunnies' ears),
  // the light rig, a giant banner
  moonAmphi(ctx, L, rng, H) {
    const b = L.base;
    for (let k = 0; k < 5; k++) {
      const y = b - 150 + k * 32;
      ctx.fillStyle = shade(L.color, -0.05 * k); ctx.beginPath(); ctx.ellipse(BG_W / 2, y + 400, BG_W * 0.8 - k * 40, 400, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = shade(L.color, 0.15); ctx.fillRect(0, y - 1, BG_W, 3);
      for (let x = (k * 37) % 60; x < BG_W; x += 44 + (k * 7) % 13) if (rng() < 0.55) { ctx.fillStyle = shade(L.color, -0.3); ctx.beginPath(); ctx.ellipse(x - 4, y - 8, 2.5, 8, -0.2, 0, TAU); ctx.ellipse(x + 4, y - 8, 2.5, 8, 0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, y + 2, 7, Math.PI, 0); ctx.fill(); }
    }
    ctx.fillStyle = '#2a2440'; ctx.fillRect(0, 40, BG_W, 10);
    for (let x = 60; x < BG_W; x += 120) { ctx.fillStyle = '#3a3450'; ctx.fillRect(x - 8, 46, 16, 14); ctx.fillStyle = '#ffe8b0'; ctx.beginPath(); ctx.arc(x, 62, 6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = PIWI; rr(ctx, BG_W / 2 - 170, 66, 340, 46, 8); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '18px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LIVE ON THE MOON', BG_W / 2, 84);
    ctx.font = '10px ' + FONT_DISPLAY; ctx.fillStyle = '#ffe8a0'; ctx.fillText('TONIGHT: MADAME MOO', BG_W / 2, 102);
  },
  // 18-6: the constellations drawn faintly across the sky (dots joined by thin lines)
  moonConstellations(ctx, L, rng, H) {
    ctx.strokeStyle = 'rgba(180,200,255,0.28)'; ctx.lineWidth = 1.2; ctx.fillStyle = 'rgba(255,240,200,0.9)';
    for (let k = 0; k < 7; k++) {
      let x = 60 + k * 140 + rng() * 60, y = 40 + rng() * 180; const n = 4 + Math.floor(rng() * 3);
      ctx.beginPath(); ctx.moveTo(x, y); const pts = [[x, y]];
      for (let q = 1; q < n; q++) { x += 20 + rng() * 40; y += (rng() - 0.5) * 70; ctx.lineTo(x, y); pts.push([x, y]); }
      ctx.stroke(); for (const [px, py] of pts) { ctx.beginPath(); ctx.arc(px, py, 2, 0, TAU); ctx.fill(); }
    }
    MoonArt.earth(ctx, L.x || 180, L.y || 70, 22, rng);
  }
};
// the shared night sky
const SPACE_SKY = ['#04040e', '#0a0a24', '#16163a'];
const themes = {
  moon_surface: Object.assign({}, regolith, {
    name: 'One Small Hop', music: 'tour_moon', particles: 'motes', rays: null,
    sky: SPACE_SKY, horizonGlow: '#6a6aa8', celestial: { type: 'none' }, stars: 1.2,
    layers: [{ kind: 'moonEarth', x: 760, y: 92, r: 36, base: 200, f: 0.02 }, { kind: 'moonFarRims', color: '#6e6a8a', base: 340, f: 0.08 }, { kind: 'moonNearRim', color: '#4e4a64', base: 410, f: 0.22 }],
    fog: '#2a2a5a', decor: ['moonRock', 'moonGolf', 'moonRock']
  }),
  moon_shadow: Object.assign({}, regolith, {
    name: 'Crater Shadow', music: 'tour_moon', particles: 'motes', rays: null,
    sky: ['#06060e', '#0e0e22', '#1c1a34'], horizonGlow: '#4a4a7a', celestial: { type: 'none' }, stars: 0.8,
    layers: [{ kind: 'moonFarRims', color: '#3a3652', base: 330, f: 0.08 }, { kind: 'moonNearRim', color: '#2a2640', base: 400, f: 0.2, posters: false }],
    fog: '#1a1a3a', darkness: 0.2, decor: ['moonRock']
  }),
  moon_orbit: Object.assign({}, hull, {
    name: 'Spacewalk', music: 'tour_moon_space', particles: 'none', rays: null,
    sky: ['#020208', '#06061a', '#0e0e2a'], horizonGlow: '#4a5aa8', celestial: { type: 'none' }, stars: 1.6, milkyway: true,
    layers: [{ kind: 'moonEarth', x: 220, y: 110, r: 48, base: 200, f: 0.015 }, { kind: 'moonVenue', base: 420, x: 640, y: 160, f: 0.05 }],
    fog: '#1a2050', decor: []
  }),
  moon_rover: Object.assign({}, regolith, {
    name: 'Moon Buggy', music: 'tour_moon_buggy', particles: 'motes', rays: '#fff0d0',
    sky: ['#06061a', '#1a1a44', '#4a3a6a'], horizonGlow: '#ffb27a', celestial: { type: 'sun', x: 0.86, y: 0.2, r: 22, color: '#fff8e8', glow: '#ffd8a0' }, stars: 0.7,
    layers: [{ kind: 'moonEarth', x: 300, y: 70, r: 26, base: 200, f: 0.02 }, { kind: 'moonFarRims', color: '#8a7a96', base: 330, f: 0.07 }, { kind: 'moonNearRim', color: '#5e5270', base: 400, f: 0.2 }],
    fog: '#5a4a7a', decor: ['moonRock', 'moonGolf']
  }),
  moon_base: Object.assign({}, hull, {
    name: 'The Moon Base', music: 'tour_moon_base', particles: 'none', rays: null,
    sky: ['#2a3046', '#3a4258', '#4a5268'], horizonGlow: '#a8c8ff', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'moonBaseWall', color: '#c8ccd8', base: 380, f: 0.1 }, { kind: 'moonGirders', color: '#5a6276', base: 440, f: 0.3 }],
    fog: '#6a7a9a', darkness: 0.1, decor: ['moonLamp']
  }),
  moon_stage: Object.assign({}, regolith, {
    name: 'The Lunar Stage', music: 'tour_moon_boss', particles: 'motes', rays: null, spotlights: true,
    sky: SPACE_SKY, horizonGlow: '#ff8ac8', celestial: { type: 'none' }, stars: 1.0,
    layers: [{ kind: 'moonEarth', x: 820, y: 70, r: 30, base: 200, f: 0.02 }, { kind: 'moonAmphi', color: '#5a5672', base: 400, f: 0.12 }],
    fog: '#3a2a5a', decor: ['moonRock']
  }),
  moon_stars: Object.assign({}, glass, {
    name: 'Connect the Stars', music: 'tour_moon_stars', particles: 'none', rays: null,
    sky: ['#02020c', '#0a0a2a', '#1a1450'], horizonGlow: '#8a7aff', celestial: { type: 'none' }, stars: 2, milkyway: true,
    layers: [{ kind: 'moonConstellations', base: 200, x: 820, y: 80, f: 0.04 }],
    fog: '#2a2a6a', decor: []
  })
};

/* ---------------- props (Decor: drawn each frame, plain shapes only) ---------------- */
const decor = {
  // a moon boulder with a crater pock
  moonRock(ctx, x, y, t, th, d) {
    const s = 0.7 + ((d || 0) % 5) * 0.12;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#a8a2b4';
    ctx.beginPath(); ctx.moveTo(x - 14 * s, y); ctx.lineTo(x - 11 * s, y - 10 * s); ctx.lineTo(x - 2 * s, y - 15 * s); ctx.lineTo(x + 10 * s, y - 11 * s); ctx.lineTo(x + 14 * s, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8c2d4'; ctx.beginPath(); ctx.moveTo(x - 9 * s, y - 9 * s); ctx.lineTo(x - 2 * s, y - 13 * s); ctx.lineTo(x + 3 * s, y - 9 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#857f94'; ctx.beginPath(); ctx.arc(x + 5 * s, y - 5 * s, 2.5 * s, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a forgotten golf ball in the dust, a little flag-less tee and divot
  moonGolf(ctx, x, y, t, th, d) {
    ctx.save(); ctx.fillStyle = '#8e889c'; ctx.beginPath(); ctx.ellipse(x - 6, y - 1, 7, 2, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 6, y - 5, 2, 5);
    MoonArt.golf(ctx, x + 7, y - 8, 4);
    ctx.restore();
  },
  // a Piwi poster on two legs: LIVE ON THE MOON
  moonPoster(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#5a5468';
    ctx.fillRect(x - 15, y - 24, 3, 24); ctx.strokeRect(x - 15, y - 24, 3, 24); ctx.fillRect(x + 12, y - 24, 3, 24); ctx.strokeRect(x + 12, y - 24, 3, 24);
    MoonArt.poster(ctx, x, y - 18, 40, 46, (d || 0) % 2 ? 'NO ATMOSPHERE' : 'GREAT ACOUSTICS');
    ctx.restore();
  },
  // a telescope on its tripod, pointing up at a patch of sky (18-1's tell for the star gate)
  moonScope(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x - 10, y); ctx.moveTo(x, y - 18); ctx.lineTo(x + 10, y); ctx.moveTo(x, y - 18); ctx.lineTo(x, y); ctx.stroke();
    ctx.save(); ctx.translate(x, y - 20); ctx.rotate(-1.05);
    ctx.fillStyle = '#e8e2f2'; rr(ctx, -6, -5, 30, 10, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = COL.a; ctx.fillRect(16, -5, 8, 10); ctx.strokeRect(16, -5, 8, 10);
    ctx.restore();
    // a twinkle where it points
    const k = 0.5 + 0.5 * Math.sin(t * 4); ctx.fillStyle = `rgba(255,240,180,${0.5 + 0.5 * k})`; ctx.beginPath(); TourKit.star(ctx, x + 22, y - 70, 5 + k * 2, 2, 4); ctx.fill();
    ctx.restore();
  },
  // a floodlight on a pole (the base, the stage)
  moonLamp(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#5a6276';
    ctx.fillRect(x - 2, y - 52, 4, 52); ctx.strokeRect(x - 2, y - 52, 4, 52);
    ctx.fillStyle = '#c8d0dc'; rr(ctx, x - 9, y - 60, 18, 10, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff4c8'; ctx.fillRect(x - 6, y - 52, 12, 3);
    ctx.restore();
  },
  // a sign card on a little stand (tips in Piwi's stage-crew voice)
  moonEarthrise(ctx, x, y, t) { /* reserved */ },
  // the shrunk-scenery crate Piwi posted ahead (18-1's start): THIS SIDE UP, a crater's worth of dust spilling out
  moonCrate(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#c8904a'; ctx.fillRect(x - 30, y - 40, 60, 40); ctx.strokeRect(x - 30, y - 40, 60, 40);
    ctx.fillStyle = '#a8703a'; ctx.fillRect(x - 30, y - 30, 60, 4); ctx.fillRect(x - 30, y - 14, 60, 4);
    ctx.fillStyle = INK; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('1 CRATER (SHRUNK)', x, y - 19); ctx.fillText('THIS SIDE UP', x, y - 4);
    ctx.fillStyle = PIWI; ctx.font = '9px ' + FONT_DISPLAY; ctx.fillText('P', x - 22, y - 32);
    ctx.fillStyle = DUST_HI; ctx.beginPath(); ctx.ellipse(x + 34, y - 2, 12, 4, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
};
const decorLights = { moonLamp: [90, '#fff4c8', -56] };

/* ---------------- the critters ---------------- */
// a moon bunny: lilac fur, very long ears, dusty paws; she hops sky-high in the low gravity (and lands on you)
const bunnyArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const air = m === 'hop', stretch = air ? (e.vy < 0 ? 1.1 : 0.95) : 1;
  ctx.scale(1, stretch);
  // ears
  const ea = air ? -0.5 : -0.15 + Math.sin(t * 3) * 0.08;
  ctx.fillStyle = '#d8cff0';
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(4 + s * 3, -20); ctx.rotate(ea + s * 0.12); ctx.beginPath(); ctx.ellipse(0, -9, 3.4, 10, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffb8d8'; ctx.beginPath(); ctx.ellipse(0, -9, 1.6, 7, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#d8cff0'; ctx.restore(); }
  // body, tail, feet
  ctx.fillStyle = '#e4dcf6'; ctx.beginPath(); ctx.ellipse(-1, -9, 11, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-11, -10, 4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8bce0'; ctx.beginPath(); ctx.ellipse(-4, -1, 5, 2.5, 0, 0, TAU); ctx.ellipse(6, -1, 5, 2.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  // head
  ctx.fillStyle = '#e4dcf6'; ctx.beginPath(); ctx.arc(7, -17, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(9.5, -18.5, 1.5, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff7ab0'; ctx.beginPath(); ctx.arc(13.5, -16, 1.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(13, -15); ctx.lineTo(18, -14); ctx.moveTo(13, -16); ctx.lineTo(18, -17); ctx.stroke();
  ctx.restore();
};
// a wind-up stagehand: a tin crew robot in a fishbowl helmet with a big wind-up key in its back, a spanner raised;
// it winds up (the key spins fast, it shakes) and then marches at you
const handArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const run = m === 'charge', wind = m === 'notice', step = run ? Math.sin(t * 24) * 3 : Math.sin(t * 9) * 1.5;
  ctx.fillStyle = '#5a6276'; ctx.fillRect(-7 + step, -7, 5, 7); ctx.strokeRect(-7 + step, -7, 5, 7); ctx.fillRect(2 - step, -7, 5, 7); ctx.strokeRect(2 - step, -7, 5, 7);
  ctx.fillStyle = '#d8a83a'; rr(ctx, -9, -22, 18, 16, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PIWI; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', 0, -14);
  // the key in the back
  ctx.save(); ctx.translate(-11, -15); ctx.rotate(t * (wind ? 30 : run ? 14 : 4)); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(-1, -1, 4, 2); ctx.beginPath(); ctx.ellipse(-4, 0, 3, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  // the spanner arm
  ctx.save(); ctx.translate(7, -18); ctx.rotate(run ? -1.4 : wind ? -2.2 : -0.6 + Math.sin(t * 3) * 0.2); ctx.fillStyle = '#9aa0aa'; ctx.fillRect(0, -1.5, 13, 3); ctx.strokeRect(0, -1.5, 13, 3); ctx.beginPath(); ctx.arc(14, 0, 3.5, 0.6, -0.6 + TAU); ctx.stroke(); ctx.restore();
  // the head in its fishbowl: a tin face with two lamp eyes
  ctx.fillStyle = '#c8ccd4'; rr(ctx, -5, -32, 10, 9, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = wind || run ? '#ff5a5a' : '#7affd8'; ctx.fillRect(-3, -29, 2.5, 2.5); ctx.fillRect(1.5, -29, 2.5, 2.5);
  MoonArt.bowl(ctx, 0, -28, 9);
  ctx.restore();
};
// a dust mite: a round grey puffball of moon dust with stubby legs; close up it curls into a ball and rolls at you
const miteArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  if (m === 'roll' || m === 'curl') {
    ctx.translate(0, -10); ctx.rotate(m === 'roll' ? t * 14 : Math.sin(t * 40) * 0.2);
    ctx.fillStyle = '#b8b2c4'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, r = k % 2 ? 9 : 11; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8e889c'; ctx.beginPath(); ctx.arc(2, 2, 3, 0, TAU); ctx.fill();
    ctx.restore(); return;
  }
  const st = Math.sin(t * 14) * 2;
  ctx.strokeStyle = INK; ctx.lineWidth = 2; for (const lx of [-6, -1, 4]) { ctx.beginPath(); ctx.moveTo(lx, -5); ctx.lineTo(lx + st * (lx % 2 ? 1 : -1), 0); ctx.stroke(); }
  ctx.lineWidth = 1.6; ctx.fillStyle = '#c8c2d4';
  ctx.beginPath(); for (let k = 0; k < 14; k++) { const a = Math.PI + k / 13 * Math.PI, r = k % 2 ? 10 : 12; ctx.lineTo(Math.cos(a) * r, -6 + Math.sin(a) * r * 0.8); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(5, -11, 3.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(6, -11, 1.5, 0, TAU); ctx.fill();
  ctx.restore();
};
// a luna moth: pale green wings with eye spots and long tails; it drifts and swoops at you
const mothArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  const f = Math.sin(t * (m === 'swoop' ? 22 : 9)) * 0.5 + 0.5;
  // the four wings drawn as two pairs, front over back
  const wing = (dx, dy, rx, ry, rot) => { ctx.beginPath(); ctx.ellipse(dx, dy, rx, ry, rot, 0, TAU); ctx.fill(); ctx.stroke(); };
  const fy = 4 + f * 6;
  ctx.fillStyle = '#a8e8b8'; wing(-6, -fy, 9, 6 - f * 2, -0.5); wing(6, -fy, 9, 6 - f * 2, 0.5);
  ctx.fillStyle = '#c8f8d0'; wing(-5, 3, 7, 4, 0.6); wing(5, 3, 7, 4, -0.6);
  // the long tails
  ctx.strokeStyle = '#88c898'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-5, 5); ctx.quadraticCurveTo(-9, 12, -6, 17); ctx.moveTo(5, 5); ctx.quadraticCurveTo(9, 12, 6, 17); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.fillStyle = '#ffd84a'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * 7, -fy, 2.4, 0, TAU); ctx.fill(); ctx.stroke(); }
  // body and feathery antennae
  ctx.fillStyle = '#f6f2e8'; ctx.beginPath(); ctx.ellipse(0, 0, 3, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#c8a86a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-1, -7); ctx.quadraticCurveTo(-4, -13, -7, -14); ctx.moveTo(1, -7); ctx.quadraticCurveTo(4, -13, 7, -14); ctx.stroke();
  ctx.restore();
};
// a stray golf ball: someone's forgotten drive, still bouncing about after all these years (it can't be stomped:
// bounce off it)
const golfArt = (ctx, e, x, y, m, t) => { ctx.save(); MoonArt.golf(ctx, x, y - 8, 8); ctx.restore(); };
const enemies = {
  moonBunny: { cls: TourEnemy.make({ w: 24, h: 26, speed: 1.0, behavior: 'hop', hopV: 9.5, hopEvery: 1.5, art: bunnyArt, burst: '#e4dcf6',
    onHop: e => { if (e.g.onScreen(e)) e.g.burst(e.cx, e.y + e.h, 3, '#e8e2f2', 'dust'); } }), place: 'walk' },
  moonHand: { cls: TourEnemy.make({ w: 22, h: 34, speed: 0.8, behavior: 'charge', range: 8, chargeSpeed: 5.6, windup: 0.6, art: handArt, burst: '#d8a83a',
    onNotice: e => { e.g.parts.text(e.cx, e.y - 14, 'KRRK-KRRK!', '#ffd84a'); TourKit.sfx('windup', 'select', { vol: 0.4, pitch: 0.6 }); } }), place: 'walk' },
  moonMite: { cls: TourEnemy.make({ w: 24, h: 20, speed: 0.9, behavior: 'roll', range: 7, rollSpeed: 6.4, art: miteArt, burst: '#c8c2d4' }), place: 'walk' },
  moonMoth: { cls: TourFlyer.make({ w: 28, h: 22, range: 3, speed: 0.7, swoop: true, art: mothArt, burst: '#b8f0c8',
    onSwoop: e => { if (e.g.onScreen(e)) e.g.parts.text(e.cx, e.y - 10, 'FLUTTER!', '#c8f8d0'); } }), place: 'fly' },
  moonGolf: { cls: TourEnemy.make({ w: 18, h: 18, speed: 2.2, behavior: 'hop', hopV: 11, hopEvery: 0.05, spiky: true, art: golfArt, burst: '#ffffff' }), place: 'walk' }
};

/* ---------------- the route map: a crescent moon in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save();
  ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, TAU); ctx.fill();
  ctx.fillStyle = COL.a; ctx.beginPath(); ctx.arc(x + r * 0.42, y - r * 0.28, r * 0.8, 0, TAU); ctx.fill();
  // the cow's little jump arc over it, now and then
  const k = (t * 0.6) % 1, a = Math.PI + k * Math.PI;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.05, r * 0.16, 0, TAU); ctx.fill();
  ctx.restore();
};
// the route map's moon pin (TOUR_ROUTE pin: 'moon'): a little crescent hangs over the stop with a faint halo
TourHooks.on && TourHooks.on('routeDraw', (scene, ctx, layer) => {
  if (layer !== 'under') return;
  const s = Tour.stops.moon; if (!s || !scene.sx) return;
  const st = TourMap.stopState(s); if (st === 'hidden') return;
  const x = scene.sx(s.lon), y = scene.sy(s.lat), r = TourMap.pinR, t = scene.t || 0;
  ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 2); ctx.fillStyle = '#c8c2ff'; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill(); ctx.restore();
});

/* ---------------- the land's map: sprites and the moonscape ---------------- */
Object.assign(TourOWPaint.art, {
  // a crater: a raised rim, a shadowed bowl
  moonCrater(c, r) {
    c.fillStyle = '#b8b2c8'; c.beginPath(); c.ellipse(0, 0, r, r * 0.45, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#7a7490'; c.beginPath(); c.ellipse(0, r * 0.06, r * 0.75, r * 0.3, 0, 0, TAU); c.fill();
    c.fillStyle = '#e4dfec'; c.beginPath(); c.ellipse(0, -r * 0.32, r * 0.7, r * 0.1, 0, Math.PI, 0); c.fill();
  },
  // the dome of the moon base
  moonDome(c, r) {
    c.fillStyle = '#e8ecf4'; c.beginPath(); c.arc(0, 0, r, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#8a92a6'; c.lineWidth = 1.2; for (const a of [0.35, 0.65]) { c.beginPath(); c.moveTo(-r + a * 2 * r, 0); c.quadraticCurveTo(-r + a * 2 * r, -r * 0.9, 0, -r); c.stroke(); }
    c.beginPath(); c.ellipse(0, -r * 0.5, r * 0.86, r * 0.18, 0, Math.PI, 0); c.stroke();
    c.fillStyle = '#ffd84a'; c.fillRect(-r * 0.15, -r * 0.3, r * 0.3, r * 0.3);
  },
  // Piwi's stage on the crater floor: a curved shell with a crescent on top
  moonStage(c, r) {
    c.fillStyle = '#2a2440'; c.beginPath(); c.moveTo(-r, 0); c.quadraticCurveTo(-r, -r * 1.2, 0, -r * 1.25); c.quadraticCurveTo(r, -r * 1.2, r, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = PIWI; c.fillRect(-r * 0.8, -r * 0.2, r * 1.6, r * 0.2);
    c.fillStyle = '#fff4c8'; c.beginPath(); c.arc(0, -r * 1.45, r * 0.26, 0, TAU); c.fill(); c.fillStyle = '#2a2440'; c.beginPath(); c.arc(r * 0.1, -r * 1.5, r * 0.22, 0, TAU); c.fill();
  },
  // a buggy track: two wheel ruts in the dust
  moonRuts(c, r) { c.strokeStyle = 'rgba(80,70,100,0.5)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-r, -2); c.quadraticCurveTo(0, -r * 0.4, r, -2); c.moveTo(-r, 2); c.quadraticCurveTo(0, -r * 0.4 + 4, r, 2); c.stroke(); },
  // the Earth over the map's horizon
  moonEarthSprite(c, r) { MoonArt.earth(c, 0, -r, r, mulberry32(18)); },
  // the landing pad (the airstrip): a round pad with lights
  moonPad(c, r) {
    c.fillStyle = '#8a92a6'; c.beginPath(); c.ellipse(0, 0, r, r * 0.4, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#ffd84a'; c.font = (r * 0.5) + 'px ' + FONT_DISPLAY; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('P', 0, 0);
  }
});
// a crater rim instead of a coast: a soft shadow, a pale rim, then the grey plain
TourOWLands.coast.moonRim = function (c, ow, ring) {
  const L = ow.look, ink = this.INK;
  c.save(); c.translate(8, 14); OWGeo.path(c, ring, true); c.fillStyle = 'rgba(0,0,10,0.45)'; c.fill(); c.restore();
  c.save(); c.translate(0, 7); OWGeo.path(c, ring, true); c.fillStyle = '#6a6480'; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
  c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = '#f4f0fa'; c.lineWidth = 12; OWGeo.path(c, ring, true); c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.8; c.stroke();
};
// the moonscape under the trails: craters big and small, dust ripples, buggy ruts
TourOWScenes.groundPaint.moon = function (c, ow) {
  const R = TourOWPaint.rng('moonground'), ink = TourOWPaint.INK, A = TourOWPaint.art;
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.strokeStyle = 'rgba(120,110,140,0.25)'; c.lineWidth = 2;
  for (let k = 0; k < 40; k++) { const x = 220 + R() * 1100, y = 160 + R() * 560; c.beginPath(); c.arc(x, y, 10 + R() * 18, 3.6, 5.6); c.stroke(); }
  for (const [x, y, r] of [[420, 260, 40], [980, 300, 56], [640, 520, 46], [1180, 600, 34], [300, 600, 30], [820, 700, 26]]) { c.save(); c.translate(x, y); c.strokeStyle = ink; c.lineWidth = 1.6; A.moonCrater.call(TourOWPaint, c, r); c.restore(); }
  for (let k = 0; k < 24; k++) { c.save(); c.translate(240 + R() * 1060, 180 + R() * 540); c.strokeStyle = ink; c.lineWidth = 1.2; A.moonCrater.call(TourOWPaint, c, 5 + R() * 9); c.restore(); }
};
TourLandscape.looks.moon = ['#0a0a24', '#04040e', '#6a6488', '#c8c2d4', '#e8e4f0', '#ffe8a0', 'moonCrater'];
{
  // the land's landmark miniature: a crater with a crescent over it (no flags)
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'moonCrater') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40); ctx.lineWidth = 2; ctx.strokeStyle = ink || INK; ctx.lineJoin = 'round';
    ctx.fillStyle = '#c8c2d4'; ctx.beginPath(); ctx.ellipse(0, -6, 24, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a84a0'; ctx.beginPath(); ctx.ellipse(0, -5, 16, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = accent || '#ffe8a0'; ctx.beginPath(); ctx.arc(0, -32, 11, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0a0a24'; ctx.beginPath(); ctx.arc(5, -35, 9, 0, TAU); ctx.fill();
    ctx.restore();
  };
}

/* ---------------- music: a floaty theremin waltz for the dust, an ambient drift for the spacewalk, a bouncy
   buggy shuffle, a funky base, a twinkling music box for the stars and the headliner's big number ---------------- */
const tracks = {
  tour_moon: {
    bpm: 96, bpb: 3, bars: 8, rv: 0.5, dl: 0.22, hx: 0.04,
    ch: 'Dm Dm Bb C Dm Gm A7 Dm',
    ld: 'A5:6 D6:3 F6:3 | E6:12 | D6:6 C6:3 Bb5:3 | C6:12 | A5:3 D6:3 F6:3 A6:3 | G6:6 Bb5:6 | A5:3 C#6:3 E6:3 G6:3 | F6:6 D6:6',
    li: 'theremin', lv: 0.14,
    bp: 'r.....f.....', bi: 'sub', bv: 0.28,
    ap: 'c.c.c.c.c.c.', ai: 'vibes', av: 0.05, ao: 62,
    dr: ['k...........', '......s.....', '..h...h...h.'], dv: 0.22
  },
  tour_moon_space: {
    bpm: 78, bars: 8, rv: 0.6, dl: 0.3, hx: 0.03,
    ch: 'Fmaj7 Em7 Dm7 Cmaj7 Fmaj7 Em7 Dm7 E7',
    ld: 'C6:8 E6:8 | B5:8 G5:8 | A5:8 F5:4 A5:4 | G5:16 | C6:4 E6:4 G6:8 | B5:8 D6:8 | A5:4 C6:4 F6:8 | E6:16',
    li: 'glass', lv: 0.13,
    bp: 'r.......r.......', bi: 'sub', bv: 0.24,
    ap: 'c...c...c...c...', ai: 'mbox', av: 0.05, ao: 64,
    dr: ['k...............', '........s.......', '....h.......h...'], dv: 0.14
  },
  tour_moon_buggy: {
    bpm: 150, bars: 8, rv: 0.25, hx: 0.06,
    ch: 'G G C D G Em C D',
    ld: 'D6:2 B5:2 G5:2 B5:2 D6:4 G6:4 | F#6:2 E6:2 D6:2 B5:2 A5:8 | C6:2 E6:2 G6:2 E6:2 C6:4 E6:4 | D6:4 F#6:4 A6:8 |' +
        'B6:2 A6:2 G6:2 D6:2 B5:4 D6:4 | E6:2 G6:2 B6:2 G6:2 E6:8 | C6:2 E6:2 A6:2 G6:2 E6:4 C6:4 | D6:4 E6:4 F#6:8',
    li: 'twang', lv: 0.13,
    bp: 'r.f.r.f.r.f.r-o-', bi: 'slapb', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'pluck', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.38
  },
  tour_moon_base: {
    bpm: 112, bars: 8, rv: 0.3, sw: 0.1, hx: 0.05,
    ch: 'Am7 D9 Am7 D9 Fmaj7 E7 Am7 E7',
    ld: 'E6:2 G6:2 A6:4 .:4 G6:2 E6:2 | D6:4 F#6:4 A6:8 | C7:2 A6:2 G6:4 E6:4 G6:4 | A6:4 D6:4 .:8 |' +
        'F6:2 A6:2 C7:4 A6:4 F6:4 | E6:2 G#6:2 B6:4 D7:8 | C7:2 B6:2 A6:4 E6:4 C6:4 | B5:4 E6:4 G#6:8',
    li: 'clav', lv: 0.12,
    bp: 'r..r..f.r..r.f..', bi: 'slapb', bv: 0.3,
    ap: '.c...c...c...c..', ai: 'ep', av: 0.05, ao: 58,
    dr: ['k.....k...k.....', '....s.......s...', 'h.hhh.h.h.hhh.h.'], dv: 0.34
  },
  tour_moon_stars: {
    bpm: 88, bpb: 3, bars: 8, rv: 0.6, dl: 0.25, hx: 0.03,
    ch: 'C Am F G C Em F G',
    ld: 'E6:3 G6:3 C7:6 | B6:3 A6:3 E6:6 | F6:3 A6:3 C7:6 | B6:6 G6:6 | E7:3 D7:3 C7:6 | B6:3 G6:3 E6:6 | A6:3 C7:3 F7:6 | D7:12',
    li: 'mbox', lv: 0.13,
    bp: 'r.....r.....', bi: 'sub', bv: 0.22,
    ap: 'c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 66,
    dr: ['k...........', '............', '....h.....h.'], dv: 0.12
  },
  tour_moon_boss: {
    bpm: 140, bars: 8, rv: 0.3, hx: 0.07,
    ch: 'Em Em C D Em Em Am B7',
    ld: 'B5:2 E6:2 G6:2 B6:2 A6:4 G6:4 | F#6:2 G6:2 A6:2 B6:2 E6:8 | C6:2 E6:2 G6:2 C7:2 B6:4 G6:4 | D6:4 F#6:4 A6:8 |' +
        'E7:2 D7:2 B6:2 G6:2 E6:4 G6:4 | F#6:2 E6:2 D#6:2 E6:2 B5:8 | A5:2 C6:2 E6:2 A6:2 G6:4 E6:4 | F#6:4 A6:4 D#7:8',
    li: 'theremin', lv: 0.15,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'reese', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'brass', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s..s', 'h.h.h.h.h.h.h.h.'], dv: 0.44
  }
};

Tour.country({
  id: 'moon', colors: COL, tagline: 'The last tour date: LIVE ON THE MOON',
  themes, painters, decor, decorLights, enemies, tracks,
  music: { level: 'tour_moon', boss: 'tour_moon_boss', map: null },
  landmark: 'the crater Piwi took', emblem,
  arrival: 'Brady! The last show is on the MOON. Piwi took a whole crater for scenery (he took the hole). Jump gently, everything floats. The headliner is a cow. ♥ C',
  coin: { name: 'STARDUST', draw(ctx, x, y) {
    ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff8d8'; ctx.beginPath(); TourKit.star(ctx, x, y, 6, 2.6, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 5, y - 6, 2, 2);
  } },
  levels: []
});
// for the other moon files and the tests
Tour.moonKit = { COL, INK, MoonArt, PIWI, DUST, DUST_HI, DUST_LO, BASALT };
})();
