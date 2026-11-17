/* ============================================================
   FESTIVAL FIELDS (world 23, cc 'fest'): the first bonus land (SECRETS_WARPS_SWITCHES.md §4.4).
   Opened by a Brady Button (Piwi's House Rule 3: NO DANCING, in Mexico 1-4's Rigging). A muddy summer music
   festival in a field: tents and guy-ropes, airbeds, a Ferris wheel, the main stage. Piwi banned dancing and
   padlocked the arena; the crowd are animals (llamas, ducks, sheep), never people.
   This file: the route stop, the looks (themes, painted backdrops, tiles, props), the critters, the keys and
   locks, the door looks and the route-map emblem. The levels, the map layout: 29_tour_fest_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'fest', world: 23, name: 'Festival Fields', sub: 'a bonus land', lon: -38, lat: 47, secret: true, bonus: true, d0: 0.3, pin: 'tent' });
const COL = { a: '#ff5fa0', b: '#3ac8d8', c: '#ffd84a' };
const INK = '#2a1a22';
const BUNT = ['#ff5fa0', '#ffd84a', '#3ac8d8', '#8a5aff', '#5ad04a', '#ff8a3a'];

/* ---------------- tiles ---------------- */
// trampled festival grass over deep mud; wooden pallet walkways; straw bales as bricks; crowd barriers as hard
const ground = {
  style: 'grass', cap: '#6ac04a', capHi: '#9ae06a', dirt: '#7a5232', dirt2: '#4a2e1a', rock: '#6a5a4a',
  paint(ctx, rng, o) {
    ctx.fillStyle = '#6a4428'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#7e5634'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(rng() * TS, rng() * TS, 4 + rng() * 5, 2 + rng() * 2, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#8a8070'; if (rng() < 0.4) { ctx.beginPath(); ctx.ellipse(6 + rng() * 20, 8 + rng() * 16, 2.5, 2, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, TS - 3, TS, 3);
  },
  paintCap(ctx, x0, x1, rng) {
    ctx.fillStyle = '#4a9a3a'; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = '#6ac04a'; ctx.fillRect(x0, 0, x1 - x0, 5);
    ctx.fillStyle = '#9ae06a'; for (let x = x0 + 2; x < x1; x += 5) ctx.fillRect(x, 0, 2, 2 + ((x * 7) % 3));
    // a muddy footprint now and then
    if (rng() < 0.35) { ctx.fillStyle = '#7a5232'; ctx.beginPath(); ctx.ellipse(x0 + 6 + rng() * (x1 - x0 - 12), 3, 4, 2, 0, 0, TAU); ctx.fill(); }
  }
};
const semi = {
  style: 'plank', c1: '#c89a5a', c2: '#8a6034',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#8a6034'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = '#c89a5a'; ctx.fillRect(x0, 0, x1 - x0, 4); ctx.fillRect(x0, 6, x1 - x0, 2);
    ctx.fillStyle = INK; ctx.fillRect(x0 + 4, 0, 1.5, 10); ctx.fillRect(x0 + 18, 0, 1.5, 10);
  }
};
const brick = {
  style: 'bale', c1: '#e8c86a', c2: '#b8903a', mortar: '#8a6a2a',
  paint(ctx) {
    ctx.fillStyle = '#d8b450'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = '#b8903a'; ctx.lineWidth = 1; for (let y = 3; y < TS; y += 4) { ctx.beginPath(); ctx.moveTo(1, y); ctx.lineTo(TS - 1, y + ((y * 3) % 2)); ctx.stroke(); }
    ctx.fillStyle = '#8a3a2a'; ctx.fillRect(8, 0, 2, TS); ctx.fillRect(22, 0, 2, TS);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const hard = {
  c1: '#c8ccd4', c2: '#7a808a',
  paint(ctx) {
    ctx.fillStyle = '#8a909a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#d8dce4'; ctx.fillRect(2, 2, TS - 4, 4); ctx.fillRect(2, TS - 6, TS - 4, 4);
    ctx.fillStyle = '#5a606a'; for (let x = 5; x < TS - 2; x += 6) ctx.fillRect(x, 6, 2, TS - 12);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const base = {
  ground, semi, brick, hard, pillar: { c1: '#ffd84a', c2: '#c89a2a', cap: '#ff5fa0', style: 'column' },
  accent: COL.a, tint: {}, bloom: 0.15, liquid: 'mud'
};

/* ---------------- painted backdrops ---------------- */
const painters = {
  // rolling green hills with hedgerows and a few sheep dots
  festHills(ctx, L, rng, H) {
    ctx.fillStyle = L.color;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 16) ctx.lineTo(x, L.base - 40 * Math.sin(x / BG_W * TAU * 3) - 22 * Math.sin(x / BG_W * TAU * 7 + 1));
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(L.color, -0.25); ctx.lineWidth = 5;
    for (let k = 0; k < 6; k++) { const x0 = rng() * BG_W; ctx.beginPath(); ctx.moveTo(x0, L.base + 20 + rng() * 40); ctx.lineTo(x0 + 120 + rng() * 200, L.base + 10 + rng() * 60); ctx.stroke(); }
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.ellipse(rng() * BG_W, L.base + 30 + rng() * 60, 4, 3, 0, 0, TAU); ctx.fill(); }
  },
  // the festival over the hedge: the Ferris wheel, the big top, the main stage's lighting rig, flags on poles
  festSkyline(ctx, L, rng, H) {
    const b = L.base;
    for (let x = 60; x < BG_W; x += 900) wrapDraw(x, 760, X => {
      // Ferris wheel
      const cx = X + 140, cy = b - 150, r = 120;
      ctx.strokeStyle = L.color; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
      ctx.lineWidth = 2; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke(); ctx.fillStyle = BUNT[k % BUNT.length]; ctx.fillRect(cx + Math.cos(a) * r - 9, cy + Math.sin(a) * r, 18, 16); }
      ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(cx - 70, b); ctx.lineTo(cx, cy); ctx.lineTo(cx + 70, b); ctx.stroke();
      // the big top
      ctx.fillStyle = '#e84a6a'; ctx.beginPath(); ctx.moveTo(X + 320, b); ctx.lineTo(X + 340, b - 90); ctx.lineTo(X + 420, b - 150); ctx.lineTo(X + 500, b - 90); ctx.lineTo(X + 520, b); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff4e0'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(X + 350 + k * 40, b); ctx.lineTo(X + 420, b - 150); ctx.lineTo(X + 370 + k * 40, b); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(X + 420, b - 150); ctx.lineTo(X + 420, b - 185); ctx.lineTo(X + 445, b - 175); ctx.lineTo(X + 420, b - 165); ctx.fill();
      // the main stage: a black box under a truss roof, speaker stacks
      ctx.fillStyle = '#2a2430'; ctx.fillRect(X + 560, b - 130, 180, 130);
      ctx.fillStyle = '#4a4450'; ctx.fillRect(X + 545, b - 150, 210, 20); ctx.fillRect(X + 548, b - 130, 14, 130); ctx.fillRect(X + 738, b - 130, 14, 130);
      ctx.fillStyle = '#ffe28a'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(X + 575 + k * 30, b - 125, 5, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,240,180,0.25)'; ctx.beginPath(); ctx.moveTo(X + 580, b - 120); ctx.lineTo(X + 620, b); ctx.lineTo(X + 540, b); ctx.closePath(); ctx.fill();
    });
    // flag poles along the hedge line
    for (let x = 20; x < BG_W; x += 70 + rng() * 80) { ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, b); ctx.lineTo(x, b - 70 - rng() * 30); ctx.stroke(); ctx.fillStyle = BUNT[Math.floor(rng() * BUNT.length)]; ctx.fillRect(x, b - 96, 18, 12); }
  },
  // rows of tents: dome tents, bell tents, a camper van, bunting strung between poles
  festTents(ctx, L, rng, H) {
    const b = L.base;
    let x = 10;
    while (x < BG_W) {
      const kind = rng(), col = BUNT[Math.floor(rng() * BUNT.length)], x0 = x;
      if (kind < 0.5) {
        const w = 60 + rng() * 30;
        wrapDraw(x0, w, X => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X, b); ctx.quadraticCurveTo(X + w / 2, b - w * 0.9, X + w, b); ctx.closePath(); ctx.fill(); ctx.fillStyle = shade(col, -0.3); ctx.beginPath(); ctx.moveTo(X + w * 0.38, b); ctx.quadraticCurveTo(X + w / 2, b - w * 0.4, X + w * 0.62, b); ctx.closePath(); ctx.fill(); });
        x += w + 10 + rng() * 30;
      } else if (kind < 0.85) {
        const w = 70 + rng() * 30;
        wrapDraw(x0, w, X => { ctx.fillStyle = '#f2e6c8'; ctx.beginPath(); ctx.moveTo(X, b); ctx.lineTo(X + 8, b - 40); ctx.lineTo(X + w / 2, b - 80); ctx.lineTo(X + w - 8, b - 40); ctx.lineTo(X + w, b); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#c8b890'; ctx.fillRect(X + w / 2 - 10, b - 30, 20, 30); ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + w / 2, b - 80); ctx.lineTo(X + w / 2, b - 92); ctx.stroke(); });
        x += w + 10 + rng() * 30;
      } else {
        wrapDraw(x0, 110, X => { ctx.fillStyle = '#7ac8b8'; rr(ctx, X, b - 60, 100, 50, 12); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(X, b - 38, 100, 10); ctx.fillStyle = '#2a3a4a'; ctx.fillRect(X + 10, b - 54, 26, 14); ctx.fillRect(X + 44, b - 54, 26, 14); ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(X + 22, b - 8, 9, 0, TAU); ctx.arc(X + 78, b - 8, 9, 0, TAU); ctx.fill(); });
        x += 120 + rng() * 30;
      }
    }
    // bunting
    for (let x2 = 0; x2 < BG_W; x2 += 160) {
      ctx.strokeStyle = '#4a3a3a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x2, b - 110); ctx.quadraticCurveTo(x2 + 80, b - 90, x2 + 160, b - 110); ctx.stroke();
      for (let k = 1; k < 8; k++) { const u = k / 8, px = x2 + u * 160, py = b - 110 + 4 * u * (1 - u) * 20 * 1; ctx.fillStyle = BUNT[k % BUNT.length]; ctx.beginPath(); ctx.moveTo(px - 6, py); ctx.lineTo(px + 6, py); ctx.lineTo(px, py + 12); ctx.closePath(); ctx.fill(); }
    }
    ctx.fillStyle = shade(L.color, -0.1); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the inside of a marquee: striped canvas walls, tent poles, strings of bulbs
  festMarquee(ctx, L, rng, H) {
    for (let x = 0; x < BG_W; x += 48) { ctx.fillStyle = (x / 48) % 2 ? L.color : '#fff4e0'; ctx.fillRect(x, 0, 48, H); }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = 0; x < BG_W; x += 48) ctx.fillRect(x + 44, 0, 4, H);
    ctx.fillStyle = '#8a6a4a'; for (let x = 120; x < BG_W; x += 320) ctx.fillRect(x, 0, 12, H);
    for (let x2 = 0; x2 < BG_W; x2 += 200) { ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x2, 40); ctx.quadraticCurveTo(x2 + 100, 90, x2 + 200, 40); ctx.stroke(); for (let k = 1; k < 9; k++) { const u = k / 9; ctx.fillStyle = '#fff2a0'; ctx.beginPath(); ctx.arc(x2 + u * 200, 40 + 4 * u * (1 - u) * 50 + 4, 4, 0, TAU); ctx.fill(); } }
  },
  // low grey rain clouds (the Mud Bath)
  festClouds(ctx, L, rng, H) {
    for (let k = 0; k < 18; k++) { const x = rng() * BG_W, y = 30 + rng() * 120, r = 40 + rng() * 50; ctx.fillStyle = k % 2 ? L.color : shade(L.color, 0.1); for (const [dx, dy, s] of [[0, 0, 1], [r * 0.7, 10, 0.7], [-r * 0.7, 12, 0.65]]) { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, r * s, r * s * 0.55, 0, 0, TAU); ctx.fill(); } }
  }
};
const dyn = {
  // rain streaks for the squalls
  festRain(ctx, L, camX, oy, S, W, t) {
    ctx.strokeStyle = 'rgba(200,220,255,0.35)'; ctx.lineWidth = 1.2 * S;
    for (let k = 0; k < 50; k++) { const x = ((k * 97 - t * 60 - camX * 0.4) % W + W) % W, y = oy + ((k * 53 + t * 380) % 380) * S; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4 * S, y + 14 * S); ctx.stroke(); }
  }
};
const themes = {
  fest_field: Object.assign({}, base, {
    name: 'Festival Fields', music: 'tour_br', particles: 'confetti', rays: '#fff8d8',
    sky: ['#5ab4f0', '#a8dcff', '#fff6d8'], horizonGlow: '#fff4c0', celestial: { type: 'sun', x: 0.78, y: 0.2, r: 30, color: '#fff6c8', glow: '#ffffff' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'festHills', color: '#8ac86a', base: 330, f: 0.05 }, { kind: 'festSkyline', color: '#5a5a7a', base: 345, f: 0.1 }, { kind: 'festTents', color: '#6aaa4a', base: 395, f: 0.24 }],
    fog: '#fff4d8', decor: ['festFlag', 'festTent', 'festBales', 'festFlag']
  }),
  fest_mud: Object.assign({}, base, {
    name: 'The Mud Bath', music: 'tour_es', particles: 'none', rays: null,
    sky: ['#7a8a9a', '#a8b4bc', '#d8d8d0'], horizonGlow: '#e8e4d0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'festClouds', color: '#8a96a2', base: 0, f: 0.04, dyn: 'festRain' }, { kind: 'festHills', color: '#6a9a5a', base: 340, f: 0.06 }, { kind: 'festTents', color: '#5a7a42', base: 400, f: 0.22 }],
    fog: '#c8c4b0', darkness: 0.08, decor: ['festWellies', 'festBales', 'festFlag']
  }),
  fest_night: Object.assign({}, base, {
    name: 'The Silent Disco', music: 'tour_jp_neon', particles: 'none', rays: null,
    sky: ['#0a0620', '#1a1040', '#3a1a5a'], horizonGlow: '#ff5fd0', celestial: { type: 'moon', x: 0.2, y: 0.18, r: 18, color: '#fff8e8', glow: '#c8a0ff' }, stars: 1,
    layers: [{ kind: 'festHills', color: '#1a2a3a', base: 330, f: 0.05 }, { kind: 'festSkyline', color: '#3a2a5a', base: 345, f: 0.1 }, { kind: 'festTents', color: '#1a2a2a', base: 395, f: 0.24 }],
    fog: '#8a5aff', darkness: 0.45, decor: ['festFlag', 'festTent', 'festCooler']
  }),
  fest_tent: Object.assign({}, base, {
    name: 'The Marquee', music: 'tour_br', particles: 'dust',
    sky: ['#3a2a2a', '#5a3a3a', '#7a4a3a'], horizonGlow: '#ffd88a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'festMarquee', color: '#e84a6a', base: 0, f: 0.08 }],
    fog: '#ffd88a', darkness: 0.12, decor: ['festBales', 'festCooler']
  })
};
// a festival area flooded with mud draws its water line as mud (LIQUIDS.mud)
TourHooks.on('areaLoaded', (play, A) => { if (A.theme === 'fest_mud' && !A.waterLook) A.waterLook = 'mud'; });

/* ---------------- props ---------------- */
const decor = {
  festFlag(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0, c = BUNT[s % BUNT.length], w = Math.sin(t * 3 + s) * 3;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 96); ctx.stroke();
    ctx.fillStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 96); ctx.quadraticCurveTo(x + 14, y - 92 + w, x + 30, y - 90 + w); ctx.lineTo(x + 28, y - 74 + w); ctx.quadraticCurveTo(x + 14, y - 76 + w, x, y - 78); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  festTent(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0, c = BUNT[(s + 2) % BUNT.length];
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 34, y); ctx.quadraticCurveTo(x, y - 62, x + 34, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(c, -0.35); ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.quadraticCurveTo(x, y - 30, x + 10, y); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 30, y - 10); ctx.lineTo(x - 46, y); ctx.moveTo(x + 30, y - 10); ctx.lineTo(x + 46, y); ctx.stroke();
    ctx.restore();
  },
  festBales(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    for (let k = 0; k < 3; k++) { const bx = x - 30 + k * 20 + (k === 2 ? -10 : 0), by = k === 2 ? y - 18 : y; ctx.fillStyle = '#e0bc5a'; ctx.fillRect(bx, by - 18, 22, 18); ctx.strokeRect(bx, by - 18, 22, 18); ctx.fillStyle = '#8a3a2a'; ctx.fillRect(bx + 6, by - 18, 2, 18); ctx.fillRect(bx + 15, by - 18, 2, 18); }
    ctx.restore();
  },
  festWellies(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillStyle = '#ffd84a';
    for (const dx of [-7, 6]) { ctx.beginPath(); ctx.moveTo(x + dx - 4, y - 22); ctx.lineTo(x + dx + 4, y - 22); ctx.lineTo(x + dx + 4, y - 6); ctx.lineTo(x + dx + 9, y - 4); ctx.lineTo(x + dx + 9, y); ctx.lineTo(x + dx - 4, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#7a5232'; ctx.fillRect(x - 12, y - 6, 24, 6);
    ctx.restore();
  },
  festCooler(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = '#3a8ae0'; rr(ctx, x - 16, y - 20, 32, 20, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; rr(ctx, x - 17, y - 24, 34, 6, 2); ctx.fill(); ctx.stroke(); ctx.restore();
  },
  // portable toilets in a row: a festival institution (doors stay shut; it is a joke, not a room)
  festLoo(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    for (let k = 0; k < 2; k++) { const bx = x - 30 + k * 30; ctx.fillStyle = k ? '#3ac8d8' : '#5ad04a'; rr(ctx, bx, y - 64, 28, 64, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + 18, y - 36, 6, 3); ctx.fillStyle = k ? '#e84a4a' : '#5ad04a'; ctx.fillRect(bx + 18, y - 31, 6, 3); }
    ctx.restore();
  },
  // the drain in the bottom of a mud pool: a swirl and bubbles (the way down under the stage)
  festDrain(ctx, x, y, t) {
    ctx.save(); const cx = x + 2 * TS, cy = y + 6;
    ctx.fillStyle = '#3a2614'; ctx.fillRect(cx - 1.5 * TS, y, 3 * TS, 2 * TS);
    ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.ellipse(cx, cy, 1.5 * TS, 9, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,220,0.75)'; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const a = t * 3 + k * 2.1; ctx.beginPath(); ctx.ellipse(cx, cy, 30 - k * 8, 7 - k * 2, 0, a, a + 3.4); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,248,230,0.8)'; for (let k = 0; k < 4; k++) { const ph = (t * 0.7 + k * 0.25) % 1; ctx.beginPath(); ctx.arc(cx + Math.sin(k * 2.3 + t) * 10, cy - ph * 140, 2.5 + k % 2, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a llama in sunglasses at the barrier, waiting for the music (the crowd is animals)
  festLlama(ctx, x, y, t, th, d) {
    const bob = Math.sin(t * 4 + ((d && d.seed) || 0)) * 1.5;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = '#f2e6d0';
    ctx.beginPath(); ctx.ellipse(x, y - 22, 16, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillRect(x - 12, y - 14, 4, 14); ctx.fillRect(x + 8, y - 14, 4, 14); ctx.strokeRect(x - 12, y - 14, 4, 14); ctx.strokeRect(x + 8, y - 14, 4, 14);
    ctx.beginPath(); ctx.moveTo(x + 10, y - 28); ctx.lineTo(x + 14, y - 52 + bob); ctx.lineTo(x + 22, y - 52 + bob); ctx.lineTo(x + 18, y - 26); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + 22, y - 54 + bob, 8, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.fillRect(x + 18, y - 57 + bob, 12, 3);
    ctx.restore();
  }
};
// a tent flap as a door look, a sign
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look !== 'festFlap') return dr0.call(this, ctx, x, y, look, t, near);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#e84a6a'; ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x, y - 58); ctx.lineTo(x + 24, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a1a22'; ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x, y - 34); ctx.lineTo(x + 9, y); ctx.closePath(); ctx.fill();
    const sw = near ? 6 : Math.sin(t * 2) * 1.5; ctx.fillStyle = '#ff7a96'; ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x + 9 + sw, y); ctx.lineTo(x + 2, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  };
}

/* ---------------- the critters ---------------- */
// a runaway wheelie bin: its lid flaps, it trundles on two wheels
const binArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = '#3a8a4a'; ctx.beginPath(); ctx.moveTo(-11, -4); ctx.lineTo(-13, -28); ctx.lineTo(13, -28); ctx.lineTo(11, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
  const lid = m === 'flat' ? 0 : Math.max(0, Math.sin(t * 9)) * 0.6;
  ctx.save(); ctx.translate(-13, -28); ctx.rotate(-lid); ctx.fillStyle = '#2a6a3a'; ctx.fillRect(0, -4, 27, 5); ctx.strokeRect(0, -4, 27, 5); ctx.restore();
  if (m !== 'flat' && lid > 0.15) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(4, -29, 2.6, 0, TAU); ctx.arc(9, -29, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(5, -29, 1.2, 0, TAU); ctx.arc(10, -29, 1.2, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, -18, 12, 5);
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-8, -3, 4, 0, TAU); ctx.fill();
  ctx.restore();
};
// a mud-splashed duck in tiny yellow wellies (it hops)
const duckArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  ctx.fillStyle = '#ffd84a'; ctx.fillRect(-7, -6, 5, 6); ctx.fillRect(2, -6, 5, 6); ctx.strokeRect(-7, -6, 5, 6); ctx.strokeRect(2, -6, 5, 6);
  ctx.fillStyle = '#f6f2e8'; ctx.beginPath(); ctx.ellipse(-2, -14, 12, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.ellipse(-6, -10, 5, 3, 0.3, 0, TAU); ctx.ellipse(3, -9, 3, 2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f6f2e8'; ctx.beginPath(); ctx.arc(8, -24, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.moveTo(13, -25); ctx.lineTo(21, -23); ctx.lineTo(13, -21); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(10, -26, 1.4, 0, TAU); ctx.fill();
  ctx.restore();
};
// a lost balloon dog drifting over the field
const balloonArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.strokeStyle = '#6a6a6a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6, 6); ctx.quadraticCurveTo(-10, 18, -4, 28); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#ff7ab0';
  for (const [bx, by, rx, ry] of TOUR_FEST_BALLOON) { ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-2, -4, 3, 1.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(14, -10, 1.4, 0, TAU); ctx.fill();
  ctx.restore();
};
const TOUR_FEST_BALLOON = [[-8, 2, 5, 3], [0, -2, 9, 5], [12, -8, 6, 5], [8, -16, 2.5, 5], [-9, -5, 3, 5], [-10, 7, 3, 5], [6, 6, 3, 5]];
const enemies = {
  festBin: { cls: TourEnemy.make({ w: 26, h: 30, speed: 1.0, behavior: 'walk', edgeTurn: true, art: binArt, burst: '#3a8a4a' }), place: 'walk' },
  festDuck: { cls: TourEnemy.make({ w: 24, h: 26, speed: 1.1, behavior: 'hop', art: duckArt, burst: '#f6f2e8' }), place: 'walk' },
  festBalloon: { cls: TourFlyer.make({ w: 30, h: 22, range: 3, speed: 0.7, swoop: false, art: balloonArt, burst: '#ff7ab0' }), place: 'fly' }
};

/* ---------------- keys and locks: the tent pegs that open Piwi's padlocks on the arena gate ---------------- */
const peg = col => (ctx, x, y, t) => {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(2, -12); ctx.lineTo(1.5, 12); ctx.lineTo(0, 15); ctx.lineTo(-1.5, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-9, -14); ctx.quadraticCurveTo(0, -20, 9, -14); ctx.lineTo(9, -9); ctx.lineTo(-9, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
};
TourMaze.addKeys({
  festPegRed: { name: 'RED TENT PEG', toast: 'THE RED TENT PEG! IT OPENS THE RED PADLOCK', col: '#e84a4a', glow: '#ffd0d0', icon: peg('#e84a4a') },
  festPegBlue: { name: 'BLUE TENT PEG', toast: 'THE BLUE TENT PEG! IT OPENS THE BLUE PADLOCK', col: '#3a8ae0', glow: '#d0e8ff', icon: peg('#3a8ae0') },
  festPegGold: { name: 'GOLD TENT PEG', toast: 'THE GOLD TENT PEG! IT OPENS THE GOLD PADLOCK', col: '#ffc83a', glow: '#fff2c0', icon: peg('#ffc83a') }
});
// a light-up dance-floor tile that pops in and out with the beat (B.beat; the validator stands on it)
const beatArt = {
  festDisco(ctx, k, on, warn, t) {
    const c = BUNT[(k.tx * 3 + k.ty) % BUNT.length];
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    if (on) { ctx.fillStyle = warn ? '#ffffff' : c; ctx.fillRect(1, 1, TS - 2, 12); ctx.strokeRect(1, 1, TS - 2, 12); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(4, 3, TS - 8, 3); ctx.globalAlpha = 0.25; ctx.fillStyle = c; ctx.fillRect(0, 13, TS, 18); }
    else { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([3, 3]); ctx.strokeRect(2, 2, TS - 4, 10); ctx.setLineDash([]); }
    ctx.restore();
  }
};
// an inflatable airbed or a trampoline drawn over its bouncy tiles (the tiles themselves are ground with a bounce surface)
class FestBed extends Ent {
  constructor(g, s) { super(g, s, s.w || 96, TS); this.look = s.look || 'airbed'; this.squash = 0; }
  update(dt) { this.t += dt; const p = this.g.player; if (p && p.springT > 0 && Math.abs(p.y + p.h - this.y) < 6 && p.cx > this.x && p.cx < this.x + this.w) this.squash = 1; this.squash = Math.max(0, this.squash - dt * 4); }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, sq = this.squash * 4;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    if (this.look === 'tramp') {
      ctx.fillStyle = '#2a3a4a'; ctx.fillRect(x + 2, y + 4, w - 4, TS - 4);
      ctx.fillStyle = '#3ac8d8'; rr(ctx, x, y + sq, w, 9, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff5fa0'; for (let k = 6; k < w - 4; k += 12) ctx.fillRect(x + k, y + 2 + sq, 6, 4);
      ctx.fillStyle = '#5a6a7a'; ctx.fillRect(x + 6, y + 9, 4, TS - 9); ctx.fillRect(x + w - 10, y + 9, 4, TS - 9);
    } else {
      ctx.fillStyle = '#ff7ab0'; rr(ctx, x - 2, y - 3 + sq, w + 4, TS - sq, 10); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5; for (let k = 10; k < w - 6; k += 10) { ctx.beginPath(); ctx.moveTo(x + k, y + 3 + sq); ctx.lineTo(x + k, y + TS - 6); ctx.stroke(); }
      ctx.fillStyle = '#ffd0e4'; rr(ctx, x + 4, y + 2 + sq, 16, 8, 4); ctx.fill();
    }
    ctx.restore();
  }
}
const pieces = {
  // bouncy tiles with their look (airbeds, trampolines): { w: 3, look }; the row of the stamp letter
  bouncy(st, o) { const w = o.w || 3, y = st.gy - 1; for (let k = 0; k < w; k++) { st.B.set(st.x + k, y, T.GROUND); st.B.setSurf(st.x + k, y, SURF.BOUNCE); } st.B.spawn('festBed', st.x, y, { w: w * TS, look: o.look || 'airbed' }).x = st.x * TS + w * TS / 2; return st.x; },
  // dance-floor tiles that pulse with the beat: { w: 4, grp: 0 | 1 } on the row of the stamp letter
  beatFloor(st, o) { const w = o.w || 4; st.B.beat(st.x, st.x + w - 1, st.gy - 1, o.grp || 0, 'festDisco'); return st.x; },
  // a padlocked barrier panel (Piwi's): opens with its tent peg; h rows tall, standing on the row under the letter
  pegLock: TourMaze.lock('mazeShutter', { need: 'PIWI\'S PADLOCK: FIND ITS TENT PEG' })
};

/* ---------------- the route map: a little tent in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4; ctx.fillStyle = '#ffd84a';
  ctx.beginPath(); ctx.moveTo(x - r * 0.9, y + r * 0.6); ctx.lineTo(x, y - r * 0.8); ctx.lineTo(x + r * 0.9, y + r * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff5fa0'; ctx.beginPath(); ctx.moveTo(x - r * 0.25, y + r * 0.6); ctx.lineTo(x, y); ctx.lineTo(x + r * 0.25, y + r * 0.6); ctx.closePath(); ctx.fill();
  ctx.restore();
};

/* ---------------- the overworld's festival sprites ---------------- */
Object.assign(TourOWPaint.art, {
  ferris(c, r, o) {
    c.lineWidth = 2; c.beginPath(); c.arc(0, -r * 1.3, r, 0, TAU); c.stroke();
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.beginPath(); c.moveTo(0, -r * 1.3); c.lineTo(Math.cos(a) * r, -r * 1.3 + Math.sin(a) * r); c.stroke(); c.fillStyle = BUNT[k % BUNT.length]; c.fillRect(Math.cos(a) * r - 3, -r * 1.3 + Math.sin(a) * r, 6, 5); }
    c.beginPath(); c.moveTo(-r * 0.6, 0); c.lineTo(0, -r * 1.3); c.lineTo(r * 0.6, 0); c.stroke();
  },
  bigtop(c, r) {
    this.P(c, [[-r, 0], [-r * 0.8, -r * 0.7], [0, -r * 1.3], [r * 0.8, -r * 0.7], [r, 0]], '#e84a6a');
    c.fillStyle = '#fff4e0'; c.beginPath(); c.moveTo(-r * 0.4, 0); c.lineTo(0, -r * 1.3); c.lineTo(-r * 0.1, 0); c.closePath(); c.fill(); c.beginPath(); c.moveTo(r * 0.2, 0); c.lineTo(0, -r * 1.3); c.lineTo(r * 0.5, 0); c.closePath(); c.fill();
  },
  tent(c, r, o) { this.P(c, [[-r, 0], [0, -r * 1.1], [r, 0]], o.col || BUNT[Math.floor(r * 7) % BUNT.length]); },
  stage(c, r) { this.P(c, [[-r, 0], [-r, -r], [r, -r], [r, 0]], '#2a2430'); c.fillStyle = '#ffe28a'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.arc(k * r * 0.35, -r * 0.85, 2, 0, TAU); c.fill(); } }
});

TourLandscape.looks.fest = ['#cfeaf6', '#4aa8c8', '#9ab8a0', '#7ab85a', '#c8e08a', '#f2dca8', 'mill'];
Tour.country({
  id: 'fest', secret: true, bonus: true, colors: COL, tagline: 'A bonus land: the festival Piwi tried to cancel',
  themes, painters, dyn, decor, enemies, pieces, beatArt, entities: { festBed: FestBed },
  music: { level: 'tour_br', boss: 'tour_br_boss', map: null },
  landmark: 'the Ferris wheel', emblem,
  arrival: 'Brady! You un-banned dancing and now there is a whole festival. The llamas are in the front row. ♥ C',
  levels: []
});
})();
