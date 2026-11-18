/* ============================================================
   THE RED-EYE (world 25, cc 'eye'): the third bonus land (SECRETS_WARPS_SWITCHES.md §4.4). Opened by a Brady
   Button (Piwi's House Rule 10: NO LATE FLIGHTS, in the Rigging above Japan 11-4's rooftop). An overnight jumbo jet
   over the North Pacific, nose to tail: the night cabin (the snoring passengers are animals: a walrus, a sloth, a
   goose...), the lurching decks in turbulence, the wing in bright daylight above the clouds, and the cargo hold,
   where a stowaway seagull hoards every pretzel on board. No people anywhere: passengers and crew are animals.
   This file: the route stop, the looks (themes, painted backdrops, tiles, props), the critters, the moving parts
   (the runaway drinks trolley, the walrus, the overhead bins, the lurch clock and its sliding carts, the engine
   exhaust, the gull escort), the boss (Captain Gull), the route-map emblem and the map's sprites and painters.
   The levels, the land's map layout, Piwi's Rule 10 and the night flights: 29_tour_eye_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'eye', world: 25, name: 'The Red-Eye', sub: 'a bonus land', lon: 175, lat: 40, secret: true, bonus: true, d0: 0.75, pin: 'plane' });
const COL = { a: '#e8424a', b: '#2a3a7a', c: '#ffd84a' };
const INK = '#1a1426';
const NAVY = '#2a3466', SEAT = '#3a4a8a', CREAM = '#efe6d2', STEEL = '#b8bec8';
const BAGS = ['#3ac8b8', '#e8424a', '#ffd84a', '#8a5aff', '#ff8a3a', '#5ad04a'];
const K = TourKit;

/* ---------------- tiles ---------------- */
// the cabin: cream wall panels, a navy carpet with the little orange floor-path lights, navy seat blocks, open
// overhead bins as one-way shelves, hard-shell suitcases as bricks
const cabinGround = {
  style: 'carpet', cap: '#3a4a7a', capHi: '#5a6a9a', dirt: '#d8ccb4', dirt2: '#b8ac94', rock: '#c8bca4',
  paint(ctx, rng) {
    ctx.fillStyle = '#e2d8c2'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#d2c8b0'; ctx.fillRect(0, TS - 4, TS, 4); ctx.fillRect(TS - 2, 0, 2, TS);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(2, 2, TS - 6, 2);
    if (rng() < 0.3) { ctx.fillStyle = '#b8ac94'; ctx.beginPath(); ctx.arc(6 + rng() * 20, 8 + rng() * 16, 1.4, 0, TAU); ctx.fill(); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#26305a'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#3a4a7a'; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = '#5a6aa0'; for (let x = x0 + 3; x < x1; x += 8) ctx.fillRect(x, 2, 2, 2);
    // the floor-path lights
    ctx.fillStyle = '#ffb04a'; for (let x = x0 + 13; x < x1; x += 32) ctx.fillRect(x, 6, 5, 2);
  }
};
const cabinSemi = {
  style: 'bin', c1: '#d8dce4', c2: '#8a909c',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#9aa0ac'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = '#e4e8ee'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = INK; ctx.fillRect(x0, 9, x1 - x0, 1.5);
    ctx.fillStyle = '#6a707c'; for (let x = x0 + 6; x < x1; x += 16) ctx.fillRect(x, 5, 6, 2);
  }
};
const cabinBrick = {
  style: 'case', c1: '#3ac8b8', c2: '#1a8a7a', mortar: '#0a4a42',
  paint(ctx) {
    ctx.fillStyle = '#2aa898'; rr(ctx, 1, 2, TS - 2, TS - 3, 5); ctx.fill();
    ctx.fillStyle = '#5ad8c8'; for (let x = 5; x < TS - 3; x += 6) ctx.fillRect(x, 5, 2, TS - 10);
    ctx.fillStyle = '#1a6a60'; ctx.fillRect(TS / 2 - 5, 0, 10, 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; rr(ctx, 1, 2, TS - 2, TS - 3, 5); ctx.stroke();
  }
};
const cabinHard = {
  c1: '#4a5aa0', c2: '#2a3466',
  paint(ctx) {
    ctx.fillStyle = SEAT; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#4a5aa0'; ctx.fillRect(2, 2, TS - 4, 5);
    ctx.fillStyle = '#f2ece0'; ctx.fillRect(5, 0, TS - 10, 4);
    ctx.fillStyle = '#2a3466'; ctx.fillRect(TS / 2 - 1, 8, 2, TS - 10); ctx.fillRect(0, TS - 3, TS, 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the wing in daylight: aluminium skin with rivet rows and the walkway lines, a flap edge as the one-way, panels
const wingGround = {
  style: 'metal', cap: '#e8eef6', capHi: '#ffffff', dirt: '#a8b2c2', dirt2: '#8a94a6', rock: '#9aa4b4',
  paint(ctx, rng) {
    ctx.fillStyle = '#aab4c4'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#c4ccd8'; ctx.fillRect(0, 0, TS, 3);
    ctx.fillStyle = '#7a8496'; for (let x = 3; x < TS; x += 7) { ctx.fillRect(x, 6, 1.6, 1.6); ctx.fillRect(x, TS - 8, 1.6, 1.6); }
    ctx.fillStyle = 'rgba(40,50,70,0.25)'; ctx.fillRect(TS - 1, 0, 1, TS);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#8a94a6'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#eef2f8'; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = INK; for (let x = x0 + 9; x < x1; x += 32) { ctx.fillRect(x, 2, 14, 1); }
    ctx.fillStyle = '#7a8496'; for (let x = x0 + 4; x < x1; x += 8) ctx.fillRect(x, 7, 1.5, 1.5);
  }
};
const wingSemi = {
  style: 'flap', c1: '#dfe6f0', c2: '#8a94a6',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#8a94a6'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = '#e8eef6'; ctx.fillRect(x0, 0, x1 - x0, 5);
    ctx.fillStyle = INK; ctx.fillRect(x0, 9, x1 - x0, 1.5);
    ctx.fillStyle = '#5a6478'; for (let x = x0 + 8; x < x1; x += 16) ctx.fillRect(x, 6, 3, 3);
  }
};
const wingBrick = {
  style: 'panel', c1: '#d8a83a', c2: '#a8781a', mortar: '#6a4a10',
  paint(ctx) {
    ctx.fillStyle = '#c8ccd6'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#f2c84a'; ctx.fillRect(3, 3, TS - 6, TS - 6);
    ctx.fillStyle = INK; for (let k = -TS; k < TS; k += 9) { ctx.beginPath(); ctx.moveTo(3 + k, 3); ctx.lineTo(3 + k + 5, 3); ctx.lineTo(3 + k + 5 + TS - 6, TS - 3); ctx.lineTo(3 + k + TS - 6, TS - 3); ctx.closePath(); ctx.save(); ctx.beginPath(); ctx.rect(3, 3, TS - 6, TS - 6); ctx.clip(); ctx.beginPath(); ctx.moveTo(3 + k, 3); ctx.lineTo(3 + k + 4, 3); ctx.lineTo(3 + k + 4 + TS, TS + 3); ctx.lineTo(3 + k + TS, TS + 3); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const wingHard = {
  c1: '#7a8496', c2: '#4a5466',
  paint(ctx) {
    ctx.fillStyle = '#6a7486'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#8a94a6'; ctx.fillRect(2, 2, TS - 4, TS - 4);
    ctx.fillStyle = '#4a5466'; for (const [x, y] of [[5, 5], [TS - 7, 5], [5, TS - 7], [TS - 7, TS - 7]]) ctx.fillRect(x, y, 2, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the cargo hold: a steel floor with roller tracks, cargo-net shelves, wooden crates, aluminium containers
const holdGround = {
  style: 'steel', cap: '#8a929e', capHi: '#aab2bc', dirt: '#4a525e', dirt2: '#323842', rock: '#3a424e',
  paint(ctx) {
    ctx.fillStyle = '#4a525e'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#5a636f'; ctx.fillRect(0, 0, TS, 2); ctx.fillRect(TS / 2 - 1, 0, 2, TS);
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(0, TS - 3, TS, 3);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#5a636f'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#8a929e'; ctx.fillRect(x0, 0, x1 - x0, 5);
    ctx.fillStyle = '#d8b03a'; for (let x = x0; x < x1; x += 16) ctx.fillRect(x + 2, 1, 8, 2);
    ctx.fillStyle = '#c8ccd4'; for (let x = x0 + 4; x < x1; x += 8) { ctx.beginPath(); ctx.arc(x, 6.5, 1.5, 0, TAU); ctx.fill(); }
  }
};
const holdSemi = {
  style: 'net', c1: '#c8a870', c2: '#8a6a3a',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#6a5034'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.strokeStyle = '#c8a870'; ctx.lineWidth = 1.4;
    for (let x = x0; x < x1; x += 6) { ctx.beginPath(); ctx.moveTo(x, 3); ctx.lineTo(x + 3, 10); ctx.lineTo(x + 6, 3); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.fillRect(x0, 0, x1 - x0, 1.2);
  }
};
const holdBrick = {
  style: 'crate', c1: '#c8904a', c2: '#8a5a2a', mortar: '#4a2a12',
  paint(ctx) {
    ctx.fillStyle = '#b8803e'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#d09a52'; ctx.fillRect(2, 2, TS - 4, 6); ctx.fillRect(2, TS - 8, TS - 4, 6);
    ctx.strokeStyle = '#7a4a1e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(3, 9); ctx.lineTo(TS - 3, TS - 9); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const holdHard = {
  c1: '#c8ccd4', c2: '#8a909a',
  paint(ctx) {
    ctx.fillStyle = '#b8bec8'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#d8dce4'; for (let x = 2; x < TS; x += 6) ctx.fillRect(x, 0, 3, TS);
    ctx.fillStyle = '#7a808a'; ctx.fillRect(0, TS - 4, TS, 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const cabin = { ground: cabinGround, semi: cabinSemi, brick: cabinBrick, hard: cabinHard, pillar: { c1: '#d8dce4', c2: '#8a909a', cap: '#e8424a', style: 'column' }, accent: COL.a, tint: {}, bloom: 0.12, liquid: null };
const sky = { ground: wingGround, semi: wingSemi, brick: wingBrick, hard: wingHard, pillar: { c1: '#c8ccd6', c2: '#7a8496', cap: '#e8424a', style: 'column' }, accent: COL.a, tint: {}, bloom: 0.2, liquid: null };
const hold = { ground: holdGround, semi: holdSemi, brick: holdBrick, hard: holdHard, pillar: { c1: '#9aa0aa', c2: '#5a606a', cap: '#d8b03a', style: 'column' }, accent: COL.c, tint: {}, bloom: 0.1, liquid: null };

/* ---------------- painted backdrops ---------------- */
const painters = {
  // the cabin's far wall at night: cream panels, oval windows onto the dark sky (stars, a moon now and then, some
  // shades pulled half down), the overhead bins and the soft blue mood lights along the ceiling
  eyeCabinWall(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    const b = L.base || 260;
    ctx.fillStyle = shade(L.color, -0.12); ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = shade(L.color, 0.08); for (let x = 0; x < BG_W; x += 96) ctx.fillRect(x, 0, 3, H);
    // the bins along the top, the mood light under them
    ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(0, b - 250, BG_W, 64);
    ctx.fillStyle = shade(L.color, -0.32); ctx.fillRect(0, b - 190, BG_W, 6);
    ctx.fillStyle = 'rgba(120,150,255,0.35)'; ctx.fillRect(0, b - 184, BG_W, 10);
    for (let x = 30; x < BG_W; x += 96) { ctx.fillStyle = shade(L.color, -0.28); ctx.fillRect(x, b - 244, 2, 52); }
    // the windows
    for (let x = 48; x < BG_W; x += 96) {
      const cx = x, cy = b - 118, shadeDown = rng() < 0.3;
      ctx.fillStyle = shade(L.color, -0.25); ctx.beginPath(); ctx.ellipse(cx, cy, 24, 32, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = L.night || '#0e1438'; ctx.beginPath(); ctx.ellipse(cx, cy, 18, 26, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff6d8'; for (let k = 0; k < 3; k++) ctx.fillRect(cx - 12 + rng() * 22, cy - 18 + rng() * 30, 1.6, 1.6);
      if (rng() < 0.18) { ctx.fillStyle = '#fff4c8'; ctx.beginPath(); ctx.arc(cx + 4, cy - 8, 7, 0, TAU); ctx.fill(); ctx.fillStyle = L.night || '#0e1438'; ctx.beginPath(); ctx.arc(cx + 7, cy - 10, 6, 0, TAU); ctx.fill(); }
      if (shadeDown) { ctx.fillStyle = shade(L.color, -0.05); ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, 18, 26, 0, 0, TAU); ctx.clip(); ctx.fillRect(cx - 20, cy - 28, 40, 30); ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(cx - 6, cy, 12, 2); ctx.restore(); }
    }
    // the side wall's lower panel, the air vents
    ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(0, b - 30, BG_W, 4);
    ctx.fillStyle = shade(L.color, -0.3); for (let x = 20; x < BG_W; x += 96) ctx.fillRect(x, b - 18, 30, 3);
  },
  // the seat backs in front of the wall: a row of navy seats with white headrest covers; now and then a sleeping
  // animal's ears over a seat (a rabbit, a bear, an owl's tufts): passengers are animals
  eyeSeatBacks(ctx, L, rng, H) {
    const b = L.base;
    for (let x = 6; x < BG_W; x += 58) {
      ctx.fillStyle = L.color; rr(ctx, x, b - 76, 46, 90, 10); ctx.fill();
      ctx.fillStyle = shade(L.color, 0.15); rr(ctx, x + 6, b - 70, 34, 12, 4); ctx.fill();
      ctx.fillStyle = 'rgba(240,236,224,0.85)'; rr(ctx, x + 8, b - 76, 30, 14, 4); ctx.fill();
      const r = rng();
      if (r < 0.14) { ctx.fillStyle = shade(L.color, -0.35); ctx.beginPath(); ctx.ellipse(x + 17, b - 92, 4, 13, -0.2, 0, TAU); ctx.ellipse(x + 29, b - 92, 4, 13, 0.2, 0, TAU); ctx.fill(); }
      else if (r < 0.26) { ctx.fillStyle = shade(L.color, -0.35); ctx.beginPath(); ctx.arc(x + 23, b - 80, 13, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.arc(x + 13, b - 90, 5, 0, TAU); ctx.arc(x + 33, b - 90, 5, 0, TAU); ctx.fill(); }
      else if (r < 0.36) { ctx.fillStyle = shade(L.color, -0.35); ctx.beginPath(); ctx.arc(x + 23, b - 80, 12, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 12, b - 86); ctx.lineTo(x + 14, b - 98); ctx.lineTo(x + 19, b - 90); ctx.moveTo(x + 34, b - 86); ctx.lineTo(x + 32, b - 98); ctx.lineTo(x + 27, b - 90); ctx.fill(); }
    }
    ctx.fillStyle = shade(L.color, -0.25); ctx.fillRect(0, b + 10, BG_W, H - b);
  },
  // the sky above the clouds: far cloud tops in rows, a contrail or two
  eyeCloudTops(ctx, L, rng, H) {
    const b = L.base;
    for (let k = 0; k < 40; k++) {
      const x = rng() * BG_W, r = 30 + rng() * 60;
      wrapDraw(x - r * 1.6, r * 3.2, X => { ctx.fillStyle = k % 2 ? L.color : shade(L.color, -0.05); ctx.beginPath(); ctx.ellipse(X + r * 1.6, b, r * 1.6, r * 0.55, 0, 0, TAU); ctx.fill(); });
    }
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3; for (let k = 0; k < 2; k++) { const y = 40 + rng() * 80, x0 = rng() * BG_W; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 400, y - 30); ctx.stroke(); }
  },
  // the sea of clouds right under the wing: big soft cumulus heads, lit from the top
  eyeCloudSea(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = shade(L.color, -0.08); ctx.fillRect(0, b + 40, BG_W, H - b);
    for (let x = -40; x < BG_W + 40; x += 70 + rng() * 40) {
      const r = 50 + rng() * 50, y = b + 30 + rng() * 30;
      wrapDraw(x - r, r * 2, X => {
        ctx.fillStyle = shade(L.color, -0.12); ctx.beginPath(); ctx.arc(X + r, y + 10, r, Math.PI, 0); ctx.fill();
        ctx.fillStyle = L.color; ctx.beginPath(); ctx.arc(X + r, y, r * 0.92, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(X + r * 0.8, y - r * 0.55, r * 0.4, r * 0.22, -0.2, 0, TAU); ctx.fill();
      });
    }
  },
  // the cargo hold: the fuselage's ribs, cargo nets hung between them, work lights, stencils
  eyeHoldRibs(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 120) {
      ctx.fillStyle = shade(L.color, -0.25); ctx.fillRect(x, 0, 14, H); ctx.fillStyle = shade(L.color, 0.12); ctx.fillRect(x + 2, 0, 3, H);
      ctx.strokeStyle = shade(L.color, 0.2); ctx.lineWidth = 1.5;
      for (let y = 60; y < L.base - 20; y += 14) { ctx.beginPath(); ctx.moveTo(x + 14, y); ctx.lineTo(x + 120, y + 7); ctx.stroke(); }
      for (let xx = x + 24; xx < x + 120; xx += 14) { ctx.beginPath(); ctx.moveTo(xx, 60); ctx.lineTo(xx + 3, L.base - 20); ctx.stroke(); }
      ctx.fillStyle = '#ffd88a'; ctx.beginPath(); ctx.arc(x + 60, 36, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,216,138,0.12)'; ctx.beginPath(); ctx.moveTo(x + 55, 40); ctx.lineTo(x + 20, L.base); ctx.lineTo(x + 100, L.base); ctx.lineTo(x + 65, 40); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(0, L.base, BG_W, H - L.base);
  }
};
const themes = {
  eye_cabin: Object.assign({}, cabin, {
    name: 'The Night Cabin', music: 'tour_eye', particles: 'none', rays: null,
    sky: ['#0e1438', '#1a2050', '#2a2a5a'], horizonGlow: '#8a9aff', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'eyeCabinWall', color: '#6e6a92', night: '#0a0f30', base: 330, f: 0.12 }, { kind: 'eyeSeatBacks', color: '#222a58', base: 400, f: 0.3 }],
    fog: '#3a4890', darkness: 0.34, decor: ['eyeLamp', 'eyeSnoozer', 'eyeLamp']
  }),
  eye_chase: Object.assign({}, cabin, {
    name: 'Aisle Seat', music: 'tour_eye_chase', particles: 'none', rays: null,
    sky: ['#0e1438', '#1a2050', '#2a2a5a'], horizonGlow: '#8a9aff', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'eyeCabinWall', color: '#6e6a92', night: '#0a0f30', base: 330, f: 0.12 }, { kind: 'eyeSeatBacks', color: '#222a58', base: 400, f: 0.3 }],
    fog: '#3a4890', darkness: 0.34, decor: ['eyeLamp', 'eyeSnoozer']
  }),
  eye_turb: Object.assign({}, cabin, {
    name: 'Turbulence', music: 'tour_eye', particles: 'none', rays: null,
    sky: ['#1a1a40', '#2a2a5a', '#3a3a6a'], horizonGlow: '#ffb04a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'eyeCabinWall', color: '#86809e', night: '#141038', base: 330, f: 0.1 }, { kind: 'eyeSeatBacks', color: '#2e2e5e', base: 420, f: 0.28 }],
    fog: '#c89060', darkness: 0.22, decor: ['eyeLamp', 'eyeSnoozer']
  }),
  eye_sky: Object.assign({}, sky, {
    name: 'Above the Clouds', music: 'tour_eye_sky', particles: 'none', rays: '#fffbe8',
    sky: ['#3a8ae8', '#7ac0ff', '#e8f6ff'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.8, y: 0.16, r: 30, color: '#fff8d8', glow: '#ffffff' }, stars: 0,
    layers: [{ kind: 'eyeCloudTops', color: '#f2f8ff', base: 360, f: 0.04 }, { kind: 'eyeCloudSea', color: '#ffffff', base: 520, f: 0.16 }],
    fog: '#e8f6ff', decor: ['eyeNoStep']
  }),
  eye_hold: Object.assign({}, hold, {
    name: 'The Cargo Hold', music: 'tour_eye', particles: 'dust', rays: null,
    sky: ['#1a1a22', '#2a2a32', '#3a3440'], horizonGlow: '#ffd88a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'eyeHoldRibs', color: '#3a404c', base: 420, f: 0.14 }],
    fog: '#ffd88a', darkness: 0.2, decor: ['eyeCrate', 'eyePretzels', 'eyeULD']
  })
};

/* ---------------- props (Decor: drawn each frame, plain shapes only) ---------------- */
const SNOOZERS = ['bear', 'owl', 'rabbit', 'tortoise'];
const decor = {
  // a reading light in the bin panel and its warm cone on the seats below (the letter sits under the ceiling)
  eyeLamp(ctx, x, y, t, th, d) {
    ctx.save(); ctx.fillStyle = 'rgba(255,232,170,0.12)';
    ctx.beginPath(); ctx.moveTo(x - 5, y - 24); ctx.lineTo(x - 46, y + 190); ctx.lineTo(x + 46, y + 190); ctx.lineTo(x + 5, y - 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a8aa0'; rr(ctx, x - 9, y - 30, 18, 7, 3); ctx.fill();
    ctx.fillStyle = '#fff2c0'; ctx.beginPath(); ctx.arc(x, y - 24, 3.5, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a sleeping animal passenger in a seat, Zs drifting up: a bear in an eye mask, an owl with a book, a rabbit in
  // big headphones, a tortoise in a neck pillow
  eyeSnoozer(ctx, x, y, t, th, d) {
    const kind = SNOOZERS[((d && d.seed) || 0) % SNOOZERS.length], b = Math.sin(t * 1.6 + x) * 1.2;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    // (y is the top of the seat block it sits in: just the head and shoulders show over the seat back)
    const hy = y - 12 + b;
    if (kind === 'bear') {
      ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.arc(x - 9, hy - 10, 4.5, 0, TAU); ctx.arc(x + 9, hy - 10, 4.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, hy, 11, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5a6aff'; rr(ctx, x - 10, hy - 4, 20, 6, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d8a878'; ctx.beginPath(); ctx.ellipse(x, hy + 5, 5, 3.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.fillRect(x - 1.5, hy + 3, 3, 2);
    } else if (kind === 'owl') {
      ctx.fillStyle = '#a07a5a'; ctx.beginPath(); ctx.ellipse(x, hy, 11, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 9, hy - 8); ctx.lineTo(x - 7, hy - 16); ctx.lineTo(x - 3, hy - 10); ctx.moveTo(x + 9, hy - 8); ctx.lineTo(x + 7, hy - 16); ctx.lineTo(x + 3, hy - 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.arc(x - 4.5, hy - 2, 4, 0, TAU); ctx.arc(x + 4.5, hy - 2, 4, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.fillRect(x - 6, hy - 2, 3, 1.4); ctx.fillRect(x + 3, hy - 2, 3, 1.4);
      ctx.fillStyle = '#e8424a'; ctx.fillRect(x - 10, hy + 6, 20, 9); ctx.strokeRect(x - 10, hy + 6, 20, 9); ctx.fillStyle = '#fff6d8'; ctx.fillRect(x - 1, hy + 6, 2, 9);
    } else if (kind === 'rabbit') {
      ctx.fillStyle = '#e8e2d8'; ctx.beginPath(); ctx.ellipse(x - 5, hy - 16, 3.5, 10, -0.2, 0, TAU); ctx.ellipse(x + 5, hy - 16, 3.5, 10, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, hy, 10, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8424a'; ctx.beginPath(); ctx.arc(x - 10, hy, 4.5, 0, TAU); ctx.arc(x + 10, hy, 4.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#e8424a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, hy - 2, 11, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x - 6, hy - 1); ctx.lineTo(x - 2, hy - 1); ctx.moveTo(x + 2, hy - 1); ctx.lineTo(x + 6, hy - 1); ctx.stroke();
    } else {
      ctx.fillStyle = '#6a9a4a'; ctx.beginPath(); ctx.ellipse(x, hy + 8, 13, 9, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#9ac87a'; ctx.beginPath(); ctx.arc(x + 2, hy - 4, 7, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffb04a'; ctx.beginPath(); ctx.arc(x + 2, hy + 3, 9, Math.PI * 0.1, Math.PI * 0.9); ctx.lineTo(x + 2, hy + 6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 1, hy - 5); ctx.lineTo(x + 2, hy - 5); ctx.stroke();
    }
    // the Zs
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = TourBackstage.F8; ctx.textAlign = 'center';
    for (let k = 0; k < 2; k++) { const ph = (t * 0.5 + k * 0.5 + x * 0.01) % 1; ctx.globalAlpha = 1 - ph; ctx.fillText('Z', x + 10 + ph * 12, hy - 14 - ph * 26); }
    ctx.restore();
  },
  // the galley wall: steel ovens and drawers, little lights, a coffee pot
  eyeGalley(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x - 46, y - 96, 92, 96); ctx.strokeRect(x - 46, y - 96, 92, 96);
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#e4e8ee'; ctx.fillRect(x - 42 + k * 29, y - 90, 26, 26); ctx.strokeRect(x - 42 + k * 29, y - 90, 26, 26); ctx.fillStyle = '#5a6070'; ctx.fillRect(x - 38 + k * 29, y - 80, 18, 8); ctx.fillStyle = (Math.floor(t * 2) + k) % 3 ? '#5ad04a' : '#ffd84a'; ctx.fillRect(x - 22 + k * 29, y - 87, 3, 3); }
    for (let k = 0; k < 2; k++) for (let j = 0; j < 3; j++) { ctx.fillStyle = '#d8dce4'; ctx.fillRect(x - 42 + j * 29, y - 58 + k * 26, 26, 22); ctx.strokeRect(x - 42 + j * 29, y - 58 + k * 26, 26, 22); ctx.fillStyle = '#7a808a'; ctx.fillRect(x - 35 + j * 29, y - 50 + k * 26, 12, 3); }
    ctx.fillStyle = '#3a2a1a'; rr(ctx, x + 22, y - 112, 14, 16, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x + 20, y - 116, 18, 5);
    ctx.restore();
  },
  // a FASTEN SEAT BELT sign panel on the bin face (lit by the lurch clock's warning when one is near)
  eyeBeltSign(ctx, x, y, t) {
    const on = EyeLurch.warnAt > 0 && EyeLurch.warnAt > t - 0.05 ? 1 : 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.fillStyle = '#3a3a4a'; rr(ctx, x - 14, y - 30, 28, 14, 3); ctx.fill(); ctx.stroke();
    EyeArt.buckle(ctx, x, y - 23, on ? '#ffb04a' : '#7a7a8a');
    ctx.restore();
  },
  // a raised spoiler panel standing up off the wing (the letter sits on the wing at its left foot): its hydraulic
  // struts and a red warning edge, so the block reads as part of the wing
  eyeSpoiler(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    const x0 = x + TS / 2, top = y - 5 * TS;
    ctx.fillStyle = '#e8424a'; ctx.fillRect(x0, top, 4 * TS, 6); ctx.strokeRect(x0, top, 4 * TS, 6);
    ctx.strokeStyle = '#5a6478'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0 - 18, y); ctx.lineTo(x0 + 2, y - 2.6 * TS); ctx.stroke();
    ctx.strokeStyle = '#c8ccd6'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = INK; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('SPOILER UP', x0 + 2 * TS, top - 8);
    ctx.restore();
  },
  // a stencil on the wing: NO STEP
  eyeNoStep(ctx, x, y) {
    ctx.save(); ctx.fillStyle = '#e8424a'; ctx.fillRect(x - 26, y - 14, 52, 11);
    ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('NO STEP', x, y - 8);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(x - 26, y - 14, 52, 11);
    ctx.restore();
  },
  // a jet engine hanging under the wing: the nacelle, the spinning fan in the intake, the pylon up to the wing
  eyeEngine(ctx, x, y, t) {
    // (the letter sits in the sky right under the wing: y is one row below the wing's underside)
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    const cy = y + 22;
    ctx.fillStyle = '#8a94a6'; ctx.fillRect(x - 28, y - 34, 56, 30); ctx.strokeRect(x - 28, y - 34, 56, 30);
    ctx.fillStyle = '#e8eef6'; ctx.beginPath(); ctx.moveTo(x - 96, cy - 34); ctx.lineTo(x + 70, cy - 30); ctx.quadraticCurveTo(x + 104, cy, x + 70, cy + 30); ctx.lineTo(x - 96, cy + 34); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8424a'; ctx.fillRect(x - 60, cy - 32, 10, 64);
    ctx.fillStyle = '#c8ccd6'; ctx.beginPath(); ctx.ellipse(x - 96, cy, 12, 34, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a4050'; ctx.beginPath(); ctx.ellipse(x - 96, cy, 8, 28, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#9aa4b4'; ctx.lineWidth = 2; for (let k = 0; k < 6; k++) { const a = t * 14 + k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(x - 96, cy); ctx.lineTo(x - 96 + Math.cos(a) * 6, cy + Math.sin(a) * 26); ctx.stroke(); }
    ctx.fillStyle = '#f2f4f8'; ctx.beginPath(); ctx.arc(x - 96, cy, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5a6478'; ctx.beginPath(); ctx.moveTo(x + 70, cy - 22); ctx.lineTo(x + 116, cy - 12); ctx.lineTo(x + 116, cy + 12); ctx.lineTo(x + 70, cy + 22); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  },
  // the fuselage at the wing root: the curved white side of the jet, windows with animal faces looking out, the
  // over-wing exit door (open)
  eyeFuselage(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.moveTo(x - 200, y + 20); ctx.lineTo(x - 200, y - 230); ctx.quadraticCurveTo(x + 40, y - 270, x + 70, y - 120); ctx.quadraticCurveTo(x + 80, y - 30, x + 40, y + 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.a; ctx.fillRect(x - 200, y - 112, 250, 12); ctx.fillStyle = COL.b; ctx.fillRect(x - 200, y - 100, 248, 6);
    for (let k = 0; k < 4; k++) {
      const wx = x - 170 + k * 46, wy = y - 160;
      ctx.fillStyle = '#1a2a5a'; ctx.beginPath(); ctx.ellipse(wx, wy, 10, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ['#e8e2d8', '#8a5a3a', '#f6f2e8', '#a07a5a'][k];
      ctx.beginPath(); ctx.arc(wx, wy + 4 + Math.sin(t * 2 + k) * 1.5, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = INK; ctx.fillRect(wx - 3, wy + 3, 1.5, 1.5); ctx.fillRect(wx + 2, wy + 3, 1.5, 1.5);
    }
    // the open over-wing exit
    ctx.fillStyle = '#2a2440'; rr(ctx, x - 20, y - 70, 34, 70, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; rr(ctx, x - 26, y - 92, 46, 14, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8424a'; ctx.font = TourBackstage.F8; ctx.textAlign = 'center'; ctx.fillText('EXIT', x - 3, y - 82);
    ctx.restore();
  },
  // the winglet at the wingtip with its green navigation light (the right-hand side's colour) blinking
  eyeWinglet(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x + 6, y - 120); ctx.lineTo(x + 26, y - 120); ctx.lineTo(x + 20, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.a; ctx.beginPath(); ctx.moveTo(x - 10, y - 66); ctx.lineTo(x + 6, y - 120); ctx.lineTo(x + 26, y - 120); ctx.lineTo(x + 22, y - 66); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (Math.sin(t * 5) > 0) { ctx.fillStyle = 'rgba(90,255,140,0.35)'; ctx.beginPath(); ctx.arc(x + 16, y - 124, 14, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#5aff8a'; ctx.beginPath(); ctx.arc(x + 16, y - 124, 4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a crated animal in the hold: a slatted crate, LIVE ANIMALS · THIS WAY UP, a pair of eyes peeking out
  eyeCrate(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0, w = 52, h = 44;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = '#c8904a'; ctx.fillRect(x - w / 2, y - h, w, h); ctx.strokeRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = '#2a1a10'; for (let k = 0; k < 3; k++) ctx.fillRect(x - w / 2 + 4, y - h + 8 + k * 12, w - 8, 5);
    const blink = Math.sin(t * 0.9 + s) > 0.93;
    ctx.fillStyle = ['#ffe28a', '#ffffff', '#aaffaa'][s % 3]; if (!blink) { ctx.beginPath(); ctx.arc(x - 6, y - h + 22, 2.4, 0, TAU); ctx.arc(x + 6, y - h + 22, 2.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#1a1010'; ctx.font = TourBackstage.F5; ctx.textAlign = 'center'; ctx.fillText('LIVE ANIMALS', x, y - 4); ctx.fillText('↑ THIS WAY UP', x, y - h + 6);
    ctx.restore();
  },
  // a cargo container stencilled PRETZELS (empty: the gull got there first) or FRAGILE
  eyeULD(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(x - 44, y); ctx.lineTo(x - 44, y - 70); ctx.lineTo(x + 30, y - 70); ctx.lineTo(x + 44, y - 50); ctx.lineTo(x + 44, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a8aeb8'; for (let k = -40; k < 40; k += 8) ctx.fillRect(x + k, y - 66, 3, 62);
    ctx.fillStyle = '#e8424a'; ctx.font = TourBackstage.F8; ctx.textAlign = 'center'; ctx.fillText(s % 2 ? 'FRAGILE' : 'PRETZELS', x - 4, y - 30);
    ctx.restore();
  },
  // a cola spill across the aisle (the floor under it is sticky): a dark puddle, an upturned cup, slow bubbles
  eyeSpill(ctx, x, y, t, th, d) {
    const w = 8 * TS;
    ctx.save(); ctx.fillStyle = 'rgba(70,30,14,0.85)'; ctx.beginPath(); ctx.ellipse(x - TS / 2 + w / 2, y + 2, w / 2 + 6, 7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(160,90,40,0.6)'; ctx.beginPath(); ctx.ellipse(x - TS / 2 + w / 2 - 20, y, w / 3, 3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,200,0.75)'; for (let k = 0; k < 5; k++) { const ph = (t * 0.6 + k / 5) % 1; ctx.beginPath(); ctx.arc(x + k * 46, y - 2 - ph * 10, 2.5 * (1 - ph) + 0.8, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#ffffff'; ctx.save(); ctx.translate(x + w - 40, y - 6); ctx.rotate(1.4); ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(6, -8); ctx.lineTo(4, 8); ctx.lineTo(-4, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8424a'; ctx.fillRect(-5, -3, 10, 3); ctx.restore();
    ctx.fillStyle = '#ffd84a'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('STICKY!', x - TS / 2 + w / 2, y - 18);
    ctx.restore();
  },
  // the cargo hold's wall behind the containers (25-2's lowest deck): ribs, a cargo net, a work light, 4 tiles wide
  eyeHoldWall(ctx, x, y, t, th, d) {
    const h = 7 * TS, x0 = x - 2 * TS - TS / 2, w = 4 * TS;
    ctx.save(); ctx.fillStyle = '#3a404c'; ctx.fillRect(x0, y - h, w, h);
    ctx.fillStyle = '#2a2e38'; ctx.fillRect(x0, y - h, 10, h); ctx.fillStyle = '#5a606c'; ctx.fillRect(x0 + 2, y - h, 3, h);
    ctx.strokeStyle = 'rgba(200,168,112,0.35)'; ctx.lineWidth = 1.4;
    for (let yy = y - h + 30; yy < y - 20; yy += 16) { ctx.beginPath(); ctx.moveTo(x0 + 14, yy); ctx.lineTo(x0 + w - 4, yy + 6); ctx.stroke(); }
    for (let xx = x0 + 22; xx < x0 + w; xx += 16) { ctx.beginPath(); ctx.moveTo(xx, y - h + 24); ctx.lineTo(xx + 3, y - 24); ctx.stroke(); }
    if (((d && d.seed) || 0) % 2 === 0) { ctx.fillStyle = '#ffd88a'; ctx.beginPath(); ctx.arc(x0 + w / 2, y - h + 16, 4, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,216,138,0.1)'; ctx.beginPath(); ctx.moveTo(x0 + w / 2 - 4, y - h + 18); ctx.lineTo(x0 + w / 2 - 50, y); ctx.lineTo(x0 + w / 2 + 50, y); ctx.lineTo(x0 + w / 2 + 4, y - h + 18); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  },
  // little paw prints on the floor, leading into the wall (the tell for the pet hold behind it)
  eyePaws(ctx, x, y, t, th, d) {
    ctx.save(); ctx.fillStyle = 'rgba(255,240,210,0.55)';
    for (let k = 0; k < 3; k++) { const px = x - 12 + k * 12, py = y - 3 - (k % 2) * 3; ctx.beginPath(); ctx.ellipse(px, py, 3, 2.2, 0, 0, TAU); ctx.fill(); for (let q = -1; q <= 1; q++) { ctx.beginPath(); ctx.arc(px + q * 2.6, py - 3.2 - (q === 0 ? 0.8 : 0), 1.1, 0, TAU); ctx.fill(); } }
    ctx.restore();
  },
  // a heap of pretzel packets (the gull's stash)
  eyePretzels(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    for (let k = 0; k < 6; k++) { const px = x - 24 + (k % 3) * 16 + (k > 2 ? 8 : 0), py = y - 10 - (k > 2 ? 12 : 0); ctx.fillStyle = k % 2 ? '#e8424a' : '#2a6ad8'; rr(ctx, px - 8, py - 10, 16, 12, 3); ctx.fill(); ctx.stroke(); EyeArt.pretzel(ctx, px, py - 4, 3.2, 0); }
    ctx.restore();
  },
  // the flight-deck door at the front of the upper deck (beside the exit)
  eyeCockpit(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#d8dce4'; rr(ctx, x - 22, y - 84, 44, 84, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a6070'; ctx.fillRect(x - 6, y - 70, 12, 8); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x + 12, y - 44, 6, 4);
    ctx.fillStyle = INK; ctx.font = TourBackstage.F6; ctx.textAlign = 'center'; ctx.fillText('FLIGHT DECK', x, y - 92);
    ctx.restore();
  }
};
// lights the dark cabin's props give off (TOUR_DECOR_LIGHTS: radius, colour, height)
const decorLights = { eyeLamp: [110, '#ffe8b0', 60], eyeGalley: [70, '#e8f0ff', -60] };

// small shared drawings
const EyeArt = {
  // a pretzel knot, r = size, a = angle
  pretzel(ctx, x, y, r, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.strokeStyle = '#a8681a'; ctx.lineWidth = r * 0.9;
    ctx.beginPath(); ctx.arc(-r * 0.6, 0, r * 0.75, 0, TAU); ctx.moveTo(r * 1.35, 0); ctx.arc(r * 0.6, 0, r * 0.75, 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#fff6e0'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.4); ctx.lineTo(-r * 0.5, -r * 0.3); ctx.moveTo(r * 0.7, r * 0.3); ctx.lineTo(r * 0.8, r * 0.4); ctx.stroke();
    ctx.restore();
  },
  // the seat-belt buckle pictogram (never a person)
  buckle(ctx, x, y, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x - 4, y); ctx.moveTo(x + 4, y); ctx.lineTo(x + 10, y); ctx.stroke();
    ctx.fillStyle = col; rr(ctx, x - 4, y - 3.5, 8, 7, 1.5); ctx.fill();
    ctx.restore();
  },
  // a hard-shell suitcase (the bins drop them; the trolley's heap is made of them)
  suitcase(ctx, x, y, w, h, col) {
    ctx.fillStyle = col; rr(ctx, x - w / 2, y - h, w, h, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; for (let k = x - w / 2 + 4; k < x + w / 2 - 2; k += 6) ctx.fillRect(k, y - h + 3, 2, h - 6);
    ctx.fillStyle = INK; ctx.fillRect(x - 5, y - h - 3, 10, 3);
  }
};

/* ---------------- door looks: the galley curtain, the spiral stairs, the galley lift, a hatch ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'eyeCurtain') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; const sw = near ? 8 : Math.sin(t * 2.4) * 3;
      ctx.fillStyle = '#5a6070'; ctx.fillRect(x - 24, y - 70, 48, 4);
      ctx.fillStyle = NAVY; ctx.beginPath(); ctx.moveTo(x - 22, y - 66); ctx.lineTo(x - 2, y - 66); ctx.quadraticCurveTo(x - 4 - sw, y - 30, x - 8 - sw, y); ctx.lineTo(x - 22, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 22, y - 66); ctx.lineTo(x + 2, y - 66); ctx.quadraticCurveTo(x + 4 + sw, y - 30, x + 8 + sw, y); ctx.lineTo(x + 22, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 22, y - 62, 20, 3); ctx.fillRect(x + 2, y - 62, 20, 3);
      ctx.restore(); return;
    }
    if (look === 'eyeStairs') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#2a2440'; rr(ctx, x - 20, y - 64, 40, 64, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c8a870'; for (let k = 0; k < 5; k++) { ctx.fillRect(x - 14 + (k % 2) * 6, y - 12 - k * 11, 22, 5); }
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 18, y); ctx.bezierCurveTo(x + 26, y - 30, x - 26, y - 34, x - 18, y - 64); ctx.stroke();
      ctx.restore(); return;
    }
    if (look === 'eyeLift') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; const op = near ? 6 : 0;
      ctx.fillStyle = '#9aa0aa'; ctx.fillRect(x - 22, y - 62, 44, 62); ctx.strokeRect(x - 22, y - 62, 44, 62);
      ctx.fillStyle = '#d8dce4'; ctx.fillRect(x - 18, y - 56, 17 - op, 56); ctx.strokeRect(x - 18, y - 56, 17 - op, 56); ctx.fillRect(x + 1 + op, y - 56, 17 - op, 56); ctx.strokeRect(x + 1 + op, y - 56, 17 - op, 56);
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(x, y - 72); ctx.lineTo(x - 6, y - 66); ctx.lineTo(x + 6, y - 66); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y - 58); ctx.lineTo(x - 6, y - 64); ctx.lineTo(x + 6, y - 64); ctx.closePath(); ctx.fill();
      ctx.restore(); return;
    }
    if (look === 'eyeHatch') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#5a6070'; rr(ctx, x - 18, y - 46, 36, 46, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#8a909a'; rr(ctx, x - 13, y - 41, 26, 36, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(x + 6, y - 26, 5, 8);
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// a grumpy goose passenger in a travel neck pillow, her sleep mask pushed up: woken, she HONKS and charges
const gooseArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const run = m === 'charge', lean = run ? 0.25 : m === 'notice' ? -0.15 : 0;
  ctx.fillStyle = '#ff9a2a'; const st = run ? Math.sin(t * 22) * 4 : Math.sin(t * 8) * 2; ctx.fillRect(-6 + st, -6, 4, 6); ctx.fillRect(2 - st, -6, 4, 6);
  ctx.fillStyle = '#f6f4ee'; ctx.beginPath(); ctx.ellipse(-3, -14, 13, 9, lean * 0.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d8d4cc'; ctx.beginPath(); ctx.ellipse(-7, -14, 6, 4, 0.2, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(6, -18); ctx.rotate(lean);
  ctx.strokeStyle = '#f6f4ee'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 2); ctx.quadraticCurveTo(2, -8, 1, -14); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  ctx.fillStyle = '#5a8ae8'; ctx.beginPath(); ctx.arc(1, -2, 6, Math.PI * 0.05, Math.PI * 0.95, true); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f6f4ee'; ctx.beginPath(); ctx.arc(2, -16, 5.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.moveTo(6, -17); ctx.lineTo(m === 'notice' || run ? 14 : 12, m === 'notice' || run ? -19 : -16); ctx.lineTo(6, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8424a'; rr(ctx, -3, -22.5, 9, 3.5, 1.5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(4, -17, 1.4, 0, TAU); ctx.fill();
  if (run || m === 'notice') { ctx.fillRect(2, -20, 5, 1.2); }
  ctx.restore();
  ctx.restore();
};
// a runaway meal tray: a little jelly that wobbles, a cup, a napkin; it slides about the cabin floor
const trayArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.5 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.fillStyle = '#8a909c'; rr(ctx, -14, -6, 28, 6, 2); ctx.fill(); ctx.stroke();
  const wob = Math.sin(t * 16) * 1.5;
  ctx.fillStyle = '#ff5a8a'; ctx.beginPath(); ctx.moveTo(-10, -6); ctx.lineTo(-9 + wob, -15); ctx.lineTo(-1 + wob, -15); ctx.lineTo(0, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-7 + wob, -13, 2, 4);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(3, -6); ctx.lineTo(4, -14); ctx.lineTo(10, -14); ctx.lineTo(11, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-6 + wob, -11, 1.1, 0, TAU); ctx.arc(-3 + wob, -11, 1.1, 0, TAU); ctx.fill();
  ctx.restore();
};
// one of Captain Gull's crew: a scruffy grey gull in a red bandana
const goonArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const f = Math.sin(t * 14) * (m === 'swoop' ? 0.3 : 1);
  ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-12, -14 * f - 2, -22, -10 * f); ctx.lineTo(-4, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2f4f8'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(-6, -16 * f - 2, -16, -12 * f); ctx.lineTo(2, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2f4f8'; ctx.beginPath(); ctx.arc(10, -4, 6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8424a'; ctx.beginPath(); ctx.moveTo(5, -8); ctx.lineTo(15, -9); ctx.lineTo(13, -6); ctx.lineTo(4, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.moveTo(15, -4); ctx.lineTo(22, -2); ctx.lineTo(15, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.fillRect(10, -5, 2, 2);
  ctx.restore();
};
// a runaway carry-on on its little wheels, its handle up, a luggage tag for a tongue
const bagArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const run = m === 'charge', col = BAGS[(e.seed || 0) % BAGS.length];
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-6, -2, 2.6, 0, TAU); ctx.arc(6, -2, 2.6, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#5a6070'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -24); ctx.lineTo(-6, -32 - (run ? 3 : 0)); ctx.lineTo(4, -32 - (run ? 3 : 0)); ctx.lineTo(4, -24); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  ctx.fillStyle = col; rr(ctx, -11, -25, 22, 22, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-8, -22, 2, 16); ctx.fillRect(-3, -22, 2, 16);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(2, -17, 3.4, 0, TAU); ctx.arc(8, -17, 3.4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(3 + (run ? 1 : 0), -17, 1.4, 0, TAU); ctx.arc(9 + (run ? 1 : 0), -17, 1.4, 0, TAU); ctx.fill();
  if (run) { ctx.fillRect(0, -22, 5, 1.4); ctx.fillRect(6, -22, 5, 1.4); }
  ctx.fillStyle = '#fff2c0'; ctx.save(); ctx.translate(11, -10); ctx.rotate(Math.sin(t * 9) * 0.3); rr(ctx, 0, -3, 9, 6, 1.5); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.restore();
};
const enemies = {
  eyeGoose: { cls: TourEnemy.make({ w: 24, h: 30, speed: 0.9, behavior: 'charge', range: 7, chargeSpeed: 6, windup: 0.5, art: gooseArt, burst: '#f6f4ee',
    onNotice: e => { e.g.parts.text(e.cx, e.y - 12, 'HONK!', '#ffe28a'); TourKit.sfx('honk', 'bump', { vol: 0.5, pitch: 1.5 }); } }), place: 'walk' },
  eyeTray: { cls: TourEnemy.make({ w: 28, h: 16, speed: 1.6, behavior: 'walk', edgeTurn: true, slides: true, art: trayArt, burst: '#ff5a8a' }), place: 'walk' },
  eyeGoon: { cls: TourFlyer.make({ w: 30, h: 20, range: 3, speed: 0.8, swoop: true, art: goonArt, burst: '#c8ccd4',
    onSwoop: e => { e.g.parts.text(e.cx, e.y - 10, 'SQUAWK!', '#ffffff'); } }), place: 'fly' },
  eyeBag: { cls: TourEnemy.make({ w: 24, h: 28, speed: 1.1, behavior: 'charge', range: 8, chargeSpeed: 6.5, windup: 0.4, art: bagArt, burst: '#3ac8b8' }), place: 'walk' }
};

/* ---------------- the runaway drinks trolley (25-1's chase: TourDoom with look 'trolley') ----------------
   The front of the chase is a drinks trolley that broke loose, pushing a growing heap of everything it collected:
   suitcases, pillows, a blanket, peanut packets. The heap is painted once into a cached canvas; the wheels, the
   bottles and the rattle are drawn live. */
const Trolley = {
  W: 230, H: 330, canvas: null,
  paint() {
    if (this.canvas || typeof document === 'undefined') return this.canvas;
    const S = 2, c = makeCanvas(this.W * S, this.H * S), x = c.getContext('2d'); x.scale(S, S);
    x.lineJoin = 'round'; x.strokeStyle = INK; x.lineWidth = 2.4;
    const W = this.W, H = this.H, R = mulberry32(25001);
    // the heap behind: a slope of suitcases, pillows and blankets up to the ceiling
    x.fillStyle = '#2a2440'; x.beginPath(); x.moveTo(0, H); x.lineTo(0, 0); x.lineTo(W * 0.55, 0); x.quadraticCurveTo(W * 0.62, H * 0.5, W * 0.7, H - 96); x.lineTo(W * 0.7, H); x.closePath(); x.fill();
    for (let k = 0; k < 26; k++) {
      const yy = H - 100 - R() * (H - 120), xx = R() * W * 0.62 * (0.4 + 0.6 * yy / H) + 10, w = 26 + R() * 30, h = 18 + R() * 20;
      x.save(); x.translate(xx, yy); x.rotate((R() - 0.5) * 0.8);
      if (k % 4 === 3) { x.fillStyle = '#f2ece0'; rr(x, -w / 2, -h / 2, w, h * 0.8, 9); x.fill(); x.stroke(); }
      else if (k % 7 === 5) { x.fillStyle = '#5a6aff'; x.beginPath(); x.moveTo(-w / 2, -h / 2); x.lineTo(w / 2, -h / 2 + 4); x.lineTo(w / 2 - 6, h / 2); x.lineTo(-w / 2 + 4, h / 2 - 3); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#ffd84a'; x.fillRect(-w / 2 + 4, -2, w - 10, 3); }
      else { x.fillStyle = BAGS[k % BAGS.length]; rr(x, -w / 2, -h / 2, w, h, 4); x.fill(); x.stroke(); x.fillStyle = 'rgba(255,255,255,0.3)'; for (let q = -w / 2 + 4; q < w / 2 - 2; q += 6) x.fillRect(q, -h / 2 + 3, 2, h - 6); }
      x.restore();
    }
    // the trolley: a tall steel cart, drawers, a red stripe, cups and a jug on top
    const tx = W - 104, ty = H - 104;
    x.fillStyle = '#c8ccd4'; rr(x, tx, ty, 96, 92, 6); x.fill(); x.stroke();
    x.fillStyle = '#e8424a'; x.fillRect(tx + 2, ty + 10, 92, 7);
    x.fillStyle = '#e4e8ee'; for (let k = 0; k < 3; k++) { rr(x, tx + 8, ty + 24 + k * 21, 80, 17, 3); x.fill(); x.stroke(); x.fillStyle = '#5a6070'; x.fillRect(tx + 40, ty + 30 + k * 21, 16, 4); x.fillStyle = '#e4e8ee'; }
    x.fillStyle = '#5a6070'; x.fillRect(tx + 96, ty + 4, 6, 40); x.strokeRect(tx + 96, ty + 4, 6, 40);
    for (let k = 0; k < 4; k++) { x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(tx + 10 + k * 13, ty); x.lineTo(tx + 12 + k * 13, ty - 14); x.lineTo(tx + 20 + k * 13, ty - 14); x.lineTo(tx + 22 + k * 13, ty); x.closePath(); x.fill(); x.stroke(); }
    // the eyes painted on by Piwi's crew (it is a runaway, after all)
    x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(tx + 66, ty + 56, 9, 11, 0, 0, TAU); x.ellipse(tx + 84, ty + 56, 9, 11, 0, 0, TAU); x.fill(); x.stroke();
    x.fillStyle = INK; x.beginPath(); x.arc(tx + 70, ty + 58, 4, 0, TAU); x.arc(tx + 88, ty + 58, 4, 0, TAU); x.fill();
    x.lineWidth = 3; x.beginPath(); x.moveTo(tx + 56, ty + 42); x.lineTo(tx + 74, ty + 47); x.moveTo(tx + 94, ty + 42); x.lineTo(tx + 80, ty + 47); x.stroke();
    this.canvas = c; return c;
  },
  draw(ctx, d) {
    const g = d.g, c = this.paint(), floorY = (d.s.chase && d.s.chase.floor || 12) * TS;
    const x = d.front, t = d.t, shake = Math.sin(t * 40) * 1.5;
    if (x < g.camX - 260) return;
    ctx.save();
    // the dark wake behind the heap fills the rest of the screen to the left
    if (x - this.W > g.camX) { ctx.fillStyle = '#1a1630'; ctx.fillRect(g.camX - 10, g.camY - 10, x - this.W - g.camX + 12, Game.viewH + 20); }
    if (c) ctx.drawImage(c, x - this.W, floorY - this.H + shake, this.W, this.H);
    // the wheels spin, the bottles rattle, peanuts fly
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#2a2a34';
    for (const wx of [x - 92, x - 20]) { ctx.beginPath(); ctx.arc(wx, floorY - 6, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#8a909a'; ctx.beginPath(); ctx.moveTo(wx, floorY - 6); ctx.lineTo(wx + Math.cos(t * 20) * 6, floorY - 6 + Math.sin(t * 20) * 6); ctx.stroke(); ctx.strokeStyle = INK; }
    for (let k = 0; k < 3; k++) { const bx = x - 86 + k * 16, by = floorY - 120 + Math.abs(Math.sin(t * 18 + k)) * -6; ctx.fillStyle = ['#5ad04a', '#ffd84a', '#e8424a'][k]; rr(ctx, bx, by - 22, 9, 22, 3); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#c8904a'; for (let k = 0; k < 4; k++) { const ph = (t * 1.8 + k * 0.25) % 1; ctx.beginPath(); ctx.ellipse(x + 10 + ph * 40, floorY - 140 + ph * ph * 120 - (1 - ph) * 30, 4, 2.5, ph * 6, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
};
{
  const dd0 = TourDoom.prototype.draw;
  TourDoom.prototype.draw = function (ctx) { if (this.look === 'trolley') Trolley.draw(ctx, this); else dd0.call(this, ctx); };
}

/* ---------------- the moving parts ---------------- */
// a snoring walrus stretched across a row of seats: his belly is a bounce surface (the tiles under him carry it)
class EyeWalrus extends Ent {
  constructor(g, s) { super(g, s, s.w || 96, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.squash = 0; this.back = true; }
  update(dt) { this.t += dt; const p = this.g.player; if (p && p.springT > 0 && Math.abs(p.y + p.h - this.y) < 8 && p.cx > this.x && p.cx < this.x + this.w) { if (this.squash < 0.5) this.g.parts.text(this.cx, this.y - 30, 'SNRRK!', '#ffe28a'); this.squash = 1; } this.squash = Math.max(0, this.squash - dt * 4); }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, sq = this.squash * 6, br = Math.sin(this.t * 1.4) * 2, t = this.t;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    // the body: a big brown belly that is the trampoline
    ctx.fillStyle = '#a0704a'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 14 + sq * 0.4, w / 2 + 4, 16 - br * 0.5 - sq * 0.5, 0, Math.PI, 0); ctx.lineTo(x + w + 4, y + TS); ctx.lineTo(x - 4, y + TS); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8946a'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 10 + sq * 0.5, w / 2 - 14, 7 - br * 0.3, 0, Math.PI, 0); ctx.fill();
    // the head on the armrest at the right: whiskers, tusks, closed eyes, a sleep mask over them
    const hx = x + w + 4, hy = y + 2;
    ctx.fillStyle = '#a0704a'; ctx.beginPath(); ctx.arc(hx, hy, 15, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d8b08a'; ctx.beginPath(); ctx.ellipse(hx + 6, hy + 6, 9, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff8e8'; ctx.beginPath(); ctx.moveTo(hx + 2, hy + 10); ctx.lineTo(hx + 1, hy + 24); ctx.lineTo(hx + 5, hy + 11); ctx.moveTo(hx + 9, hy + 10); ctx.lineTo(hx + 10, hy + 24); ctx.lineTo(hx + 12, hy + 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a6aff'; rr(ctx, hx - 12, hy - 8, 22, 7, 3); ctx.fill(); ctx.stroke();
    // the flippers folded on the belly, the Zs of a mighty snore
    ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.ellipse(x + w * 0.3, y + 10, 12, 5, -0.4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center';
    for (let k = 0; k < 3; k++) { const ph = (t * 0.45 + k / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.fillText('Z', hx + 10 + ph * 20, hy - 18 - ph * 40); }
    ctx.restore();
  }
}
// an overhead bin over the aisle: when Brady comes near it rattles, then pops open and drops a suitcase (a hit);
// once, then it hangs open
class EyeBinDrop extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 22); this.y = s.y - TS; this.state = 'shut'; this.st = 0; this.back = true; this.col = BAGS[Math.floor(s.x / TS) % BAGS.length]; }
  update(dt) {
    this.t += dt; const p = this.g.player; if (!p) return;
    if (this.state === 'shut' && p.cx > this.x - 3.2 * TS && p.cx < this.x + this.w + TS && p.y > this.y) { this.state = 'rattle'; this.st = 0.5; TourKit.sfx('rattle', 'bump', { vol: 0.35, pitch: 0.7 }); }
    else if (this.state === 'rattle') { this.st -= dt; if (this.st <= 0) { this.state = 'open'; Sound.play('door', { vol: 0.4, pitch: 1.4 }); const col = this.col; tourFire(this.g, this.cx, this.y + this.h + 14, { vx: 0, vy: 1 * TS, grav: PHYS.gDown * 0.55, w: 24, h: 18, life: 2.5, col, art: (c, s) => { c.save(); c.strokeStyle = INK; c.lineWidth = 1.6; EyeArt.suitcase(c, s.x + s.w / 2, s.y + s.h, s.w, s.h - 3, col); c.restore(); } }); } }
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, sh = this.state === 'rattle' ? Math.sin(this.t * 60) * 2 : 0, open = this.state === 'open';
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#d8dce4'; rr(ctx, x + sh, y, w, this.h, 5); ctx.fill(); ctx.stroke();
    if (open) { ctx.fillStyle = '#4a4a5a'; ctx.fillRect(x + 4, y + 4, w - 8, this.h - 6); ctx.fillStyle = '#e4e8ee'; ctx.beginPath(); ctx.moveTo(x, y + this.h); ctx.lineTo(x + 8, y + this.h + 16); ctx.lineTo(x + w + 8, y + this.h + 16); ctx.lineTo(x + w, y + this.h); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = '#9aa0ac'; ctx.fillRect(x + w / 2 - 6 + sh, y + this.h - 6, 12, 3); if (this.state === 'rattle') { ctx.fillStyle = '#ffd84a'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('!', x + w / 2, y - 6); } }
    ctx.restore();
  }
}
/* THE LURCH (25-2): turbulence on a clock. Every PERIOD seconds the FASTEN SEAT BELT light dings and blinks (1.5 s
   warning), then the cabin lurches: toggle group g flips (the loose carts, trays and containers slide to their other
   spot: each slider pair A -> B) and everyone gets shoved the way they slid, unless Brady braces (crouches: hold
   DOWN on the ground). Anything that slides out from under him carries him along; anything that slides into him lifts
   him on top. The validator searches both states (the group is auto), so the route never needs a lucky shove. */
const EyeLurch = { warnAt: -1, PERIOD: 5.2, WARN: 1.5 };
class EyeLurchClock extends Ent {
  constructor(g, s) { super(g, s, 4, 4); this.friendly = true; this.gi = s.g || 0; this.period = s.period || EyeLurch.PERIOD; this.shoveT = 0; this.dirx = 1; this.told = false; this.warned = -1; }
  phaseK() { return this.g.t % this.period; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    this.x = g.camX; this.y = g.camY;
    const n = Math.floor(g.t / this.period), on = n % 2 === 1, k = this.phaseK(), warn = k > this.period - EyeLurch.WARN;
    if (warn) { EyeLurch.warnAt = g.t; if (this.warned !== n) { this.warned = n; TourKit.sfx('ding', 'select', { vol: 0.5, pitch: 1.8 }); if (!this.told) { this.told = true; g.toast && g.toast('SEAT BELT SIGN! HOLD DOWN TO BRACE'); } } }
    if (on !== !!g.toggleBit(this.gi)) this.lurch(on);
    if (this.shoveT > 0) {
      this.shoveT -= dt;
      if (p && !p.dead && p.state === 'play' && !this.braced(p)) p.x += this.dirx * 5.5 * TS * dt * clamp(this.shoveT / 0.5, 0, 1);
    }
  }
  braced(p) { return p.onGround && (p.crouch || (p.inp && p.inp.down) || Input.down); }
  lurch(on) {
    const g = this.g, A = g.area, G = A.toggles && A.toggles[this.gi], p = g.player;
    if (!G) return;
    const from = on ? G.A : G.B, to = on ? G.B : G.A;
    // what Brady stands on that slides away: he goes with it (pairs by index)
    let carry = null;
    if (p && !p.dead && p.onGround) { const fx = Math.floor(p.cx / TS), fy = Math.floor((p.y + p.h + 2) / TS); from.forEach((r, i) => { if (fx >= r[0] && fx <= r[2] && fy >= r[1] && fy <= r[3] && to[i]) carry = [r, to[i]]; }); }
    g.flipToggle(this.gi, true);
    this.dirx = 0; for (let i = 0; i < Math.min(from.length, to.length); i++) this.dirx += sign(to[i][0] - from[i][0]);
    this.dirx = sign(this.dirx) || 1;
    if (p && !p.dead) {
      if (carry) { p.x += (carry[1][0] - carry[0][0]) * TS; p.y = carry[1][1] * TS - p.h - 0.5; p.vy = 0; }
      // a slider that lands on him lifts him onto its top
      for (const r of to) { if (overlap(p, { x: r[0] * TS, y: r[1] * TS, w: (r[2] - r[0] + 1) * TS, h: (r[3] - r[1] + 1) * TS })) { p.y = r[1] * TS - p.h - 1; p.vy = Math.min(p.vy, 0); } }
      if (this.braced(p)) g.parts.text(p.cx, p.y - 14, 'BRACED!', '#7affd8');
    }
    for (const e of g.entities) if (e.enemy && !e.boss && !e.dead && e.cfg && e.cfg.slides) { e.dir = this.dirx; e.vx = this.dirx * 5 * TS; }
    this.shoveT = 0.5; g.shake(6); TourKit.sfx('lurch', 'stomp', { vol: 0.6, pitch: 0.5 });
  }
  draw(ctx) {
    // the FASTEN SEAT BELT sign at the top of the view: amber and blinking in the warning, dim otherwise
    const g = this.g, k = this.phaseK(), warn = k > this.period - EyeLurch.WARN, lurching = this.shoveT > 0;
    const lit = (warn && Math.sin(g.t * 18) > -0.3) || lurching;
    const x = g.camX + Game.viewW / 2, y = g.camY + (Game.cssH > Game.cssW ? 104 : 16);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = lit ? '#3a2a10' : 'rgba(30,30,44,0.8)'; rr(ctx, x - 46, y - 10, 92, 22, 6); ctx.fill(); ctx.stroke();
    EyeArt.buckle(ctx, x - 30, y + 1, lit ? '#ffb04a' : '#6a6a7a');
    ctx.fillStyle = lit ? '#ffd88a' : '#6a6a7a'; ctx.font = TourBackstage.F7; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('FASTEN', x - 16, y - 3); ctx.fillText('SEAT BELT', x - 16, y + 5);
    if (lit) { ctx.fillStyle = 'rgba(255,176,74,0.25)'; rr(ctx, x - 50, y - 14, 100, 30, 8); ctx.fill(); }
    ctx.restore();
  }
}
// a slider: the loose thing a lurch moves between its two spots (a galley cart, a container, a jammed cart).
// It draws the object easing from rect A to rect B (the tiles themselves switch at the lurch)
class EyeSlider extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.gi = s.g || 0; this.A = s.A; this.B = s.B; this.look = s.look || 'cart'; this.k = 0; this.back = true; this.always = true; this.place(); }
  place() { const a = this.A, b = this.B, k = this.k; this.x = lerp(a[0], b[0], k) * TS; this.y = lerp(a[1], b[1], k) * TS; this.w = (a[2] - a[0] + 1) * TS; this.h = (a[3] - a[1] + 1) * TS; }
  update(dt) { this.t += dt; const on = this.g.toggleBit(this.gi) ? 1 : 0; this.k = approach(this.k, on, dt * 5); this.place(); }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, t = this.t, moving = this.k > 0.02 && this.k < 0.98;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    if (this.look === 'cart' || this.look === 'jam') {
      // a galley cart lying on its side as a bridge (one row) or standing jammed in the passage (a block)
      const h = Math.max(this.h, 22);
      ctx.fillStyle = '#c8ccd4'; rr(ctx, x + 1, y, w - 2, h, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8424a'; ctx.fillRect(x + 3, y + 4, w - 6, 4);
      if (h > TS) for (let k = 0; k < 3; k++) { ctx.fillStyle = '#e4e8ee'; rr(ctx, x + 6, y + 14 + k * (h - 24) / 3, w - 12, (h - 24) / 3 - 4, 3); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#2a2a34'; for (const wx of [x + 8, x + w - 8]) { ctx.beginPath(); ctx.arc(wx, y + h + (this.look === 'jam' ? -3 : 3), 4, 0, TAU); ctx.fill(); }
      if (this.look === 'jam') { ctx.fillStyle = '#ffd84a'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('JAMMED', x + w / 2, y - 6); }
    } else if (this.look === 'container') {
      ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(x, y + this.h); ctx.lineTo(x, y); ctx.lineTo(x + w - 10, y); ctx.lineTo(x + w, y + 12); ctx.lineTo(x + w, y + this.h); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a8aeb8'; for (let k = x + 6; k < x + w - 4; k += 8) ctx.fillRect(k, y + 6, 3, this.h - 10);
      ctx.fillStyle = '#e8424a'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('THIS WAY UP', x + w / 2, y + 18);
    } else {
      // a loose meal-tray table
      ctx.fillStyle = '#8a909c'; rr(ctx, x, y, w, 12, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 8, y - 6, 8, 6); ctx.strokeRect(x + 8, y - 6, 8, 6);
    }
    if (moving) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; const d = sign(this.B[0] - this.A[0]) || 1; for (let k = 0; k < 3; k++) { const yy = y + 4 + k * 8; ctx.beginPath(); ctx.moveTo(x - d * (6 + k * 4), yy); ctx.lineTo(x - d * (18 + k * 4), yy); ctx.stroke(); } }
    ctx.restore();
  }
}
// the engine's hot exhaust behind the wing: a shimmering column (the updraft zone is the tiles' zone)
class EyeExhaust extends Ent {
  constructor(g, s) { super(g, s, (s.w || 2) * TS, (s.h || 12) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.back = true; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, t = this.t;
    ctx.save();
    ctx.fillStyle = 'rgba(255,214,170,0.22)'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,190,140,0.18)'; ctx.fillRect(x + w * 0.2, y, w * 0.6, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2.5;
    for (let k = 0; k < 5; k++) { const ph = (t * 1.4 + k / 5) % 1, yy = y + h - ph * h, xx = x + w / 2 + Math.sin(t * 5 + k * 2) * w * 0.3; ctx.beginPath(); ctx.moveTo(xx - 6, yy); ctx.quadraticCurveTo(xx, yy - 10, xx + 6, yy - 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 6; k++) { const ph = (t * 0.9 + k / 6) % 1; ctx.beginPath(); ctx.arc(x + ((k * 13) % w), y + h - ph * h, 2, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
// the tell under the one safe gap in the wing (the Under-Stage, 25-3): the landing-gear doors hang open and the
// yellow emergency slide is puffed up down there like a crash mat (TourSeams.TELLS)
class EyeSlideTell extends Ent {
  constructor(g, s) { super(g, s, (s.w || 3) * TS, 60); this.x = s.x - TS / 2; this.y = s.y - 30; this.back = true; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, t = this.t;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#6a7486'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 20, y + 40); ctx.lineTo(x - 12, y + 42); ctx.lineTo(x + 2, y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w + 6, y); ctx.lineTo(x + w + 20, y + 40); ctx.lineTo(x + w + 12, y + 42); ctx.lineTo(x + w - 2, y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    const bob = Math.sin(t * 2) * 3;
    ctx.fillStyle = '#ffd23a'; rr(ctx, x - 4, y + 34 + bob, w + 8, 22, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff2a0'; for (let k = x + 4; k < x + w; k += 14) ctx.fillRect(k, y + 38 + bob, 7, 3);
    ctx.fillStyle = '#e8424a'; ctx.font = TourBackstage.F6; ctx.textAlign = 'center'; ctx.fillText('SOFT LANDING', x + w / 2, y + 50 + bob);
    ctx.restore();
  }
}
TourSeams.TELLS.eyeSlideTell = true;
// a sign that names a level's trick, in the cabin crew's voice (no person shown: a card on a stand)
const platforms = {
  // the snoozing sloth inching along the bin rail, belly up: stand on its tummy
  eyeSloth(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.strokeStyle = '#8a909a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 30, y - 34); ctx.lineTo(x + w + 30, y - 34); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#9a7a5a';
    for (const ax of [x + 12, x + w - 12]) { ctx.beginPath(); ctx.moveTo(ax - 5, y + 4); ctx.lineTo(ax - 3, y - 34); ctx.lineTo(ax + 3, y - 34); ctx.lineTo(ax + 5, y + 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(ax - 4, y - 38, 2, 6); ctx.fillRect(ax + 1, y - 38, 2, 6); ctx.fillStyle = '#9a7a5a'; }
    ctx.beginPath(); ctx.ellipse(x + w / 2, y + 10, w / 2 + 2, 13, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8a87a'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 4, w / 2 - 10, 6, 0, 0, TAU); ctx.fill();
    // the face at the right end, upside down and happy, an eye mask
    const fx = x + w + 4, fy = y + 12;
    ctx.fillStyle = '#e8d8b8'; ctx.beginPath(); ctx.arc(fx, fy, 10, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.ellipse(fx - 4, fy + 1, 4, 2.5, 0.3, 0, TAU); ctx.ellipse(fx + 4, fy + 1, 4, 2.5, -0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(fx, fy - 4, 2, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = TourBackstage.F8; ctx.textAlign = 'center'; const ph = (t * 0.4) % 1; ctx.globalAlpha = 1 - ph; ctx.fillText('z', fx + 8, fy - 12 - ph * 22);
    ctx.restore();
  },
  // a friendly escort gull in a blue scarf, wings wide: Brady rides on its back
  eyeGull(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w, f = Math.sin(t * 7 + e.hx * 0.01);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#d8dce4';
    ctx.beginPath(); ctx.moveTo(x + 10, y + 6); ctx.quadraticCurveTo(x - 24, y - 6 - f * 14, x - 50, y + 2 - f * 18); ctx.lineTo(x + 14, y + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - 10, y + 6); ctx.quadraticCurveTo(x + w + 24, y - 6 - f * 14, x + w + 50, y + 2 - f * 18); ctx.lineTo(x + w - 14, y + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f6f8fc'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + 10, w / 2, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a6ae8'; ctx.beginPath(); ctx.ellipse(x + w - 4, y + 4, 7, 4, 0.4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f6f8fc'; ctx.beginPath(); ctx.arc(x + w + 6, y - 2, 8, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.moveTo(x + w + 13, y - 3); ctx.lineTo(x + w + 23, y); ctx.lineTo(x + w + 13, y + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + w + 8, y - 4, 1.6, 0, TAU); ctx.fill();
    ctx.restore();
  }
};
// the tilting wing flap (a seesaw): land hard on the raised end and it flings you
const skins = {
  eyeFlap(ctx, e, t) {
    const cx = e.cx, cy = e.y + 13, a = Math.atan2(e.k * 22, e.w);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#5a6478'; ctx.beginPath(); ctx.moveTo(cx - 10, cy + 14); ctx.lineTo(cx, cy); ctx.lineTo(cx + 10, cy + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.translate(cx, cy); ctx.rotate(a);
    ctx.fillStyle = '#e8eef6'; ctx.beginPath(); ctx.moveTo(-e.w / 2, -5); ctx.lineTo(e.w / 2, -5); ctx.lineTo(e.w / 2 - 6, 6); ctx.lineTo(-e.w / 2 + 6, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8424a'; ctx.fillRect(-e.w / 2 + 4, -4, 10, 3); ctx.fillRect(e.w / 2 - 14, -4, 10, 3);
    ctx.restore();
  }
};

/* ---------------- pieces (legend ['piece', name, opts]: st.x / st.gy = the letter's column / the row under it) ---------------- */
const pieces = {
  // an item block at the letter: { item }
  box(st, o) { st.block(st.x, st.gy - 1, o.item || 'power', o.hidden ? T.HIDDEN : T.QBLOCK); return st.x; },
  // the snoring walrus over w seats: the seat tiles under him bounce
  walrus(st, o) {
    const w = o.w || 3, y = st.gy - 1;
    for (let k = 0; k < w; k++) { st.B.set(st.x + k, y, T.HARD); st.B.setSurf(st.x + k, y, SURF.BOUNCE); }
    st.B.spawn('eyeWalrus', st.x, y, { w: w * TS });
    return st.x;
  },
  // the sloth inching along the bin rail: a moving platform { ax (tiles), speed, w }
  sloth(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1, ax = o.ax || 5, pw = o.w || 3;
    B.spawn('mplat', x, y - 1, { pw, ax: ax * TS, ay: 0, speed: o.speed || 0.9, skin: 'eyeSloth' });
    for (let q = 0; q <= ax; q++) for (let k = 0; k < pw; k++) B.ghosts.push([x + q + k, y]);
    return st.x;
  },
  // a friendly escort gull flying back and forth: { ax, ay, speed, w }
  gull(st, o) {
    const B = st.B, x = st.x, y = st.gy - 1, ax = o.ax || 6, ay = o.ay || 0, pw = o.w || 3;
    B.spawn('mplat', x, y - 1, { pw, ax: ax * TS, ay: ay * TS, speed: o.speed || 1.6, skin: 'eyeGull', phase: o.phase || 0 });
    const n = Math.max(Math.abs(ax), Math.abs(ay));
    for (let q = 0; q <= n; q++) { const gx = x + Math.round(ax * q / (n || 1)), gy = y + Math.round(ay * q / (n || 1)); for (let k = 0; k < pw; k++) B.ghosts.push([gx + k, gy]); }
    return st.x;
  },
  // a bin over the aisle that drops a suitcase when Brady comes near
  binDrop(st, o) { st.B.spawn('eyeBinDrop', st.x, st.gy - 1, {}); return st.x; },
  // an engine's exhaust: an updraft from the bottom of the area up to h rows above the letter: { w, h, top }
  exhaust(st, o) {
    const B = st.B, w = o.w || 2, top = st.gy - 1 - (o.up || 8), bot = B.H - 1;
    B.zone(st.x, top, w, bot - top + 1, 0, -(o.force || 110) * TS, 7.2 * TS, 'updraft', { pull: 3 });
    B.spawn('eyeExhaust', st.x, bot, { w, h: bot - top + 1 });
    return st.x;
  },
  // a tilting flap (a seesaw lying on the wing): { len }
  flap(st, o) {
    const B = st.B, x = st.x, len = o.len || 5, y = st.gy - 1;
    B.spawn('seesaw', x + Math.floor(len / 2), y, { len, skin: 'eyeFlap' });
    for (let q = 0; q < len; q++) B.ghosts.push([x + q, y]);
    B.springs.push([x, y], [x + len - 1, y]);
    return st.x;
  },
  // a sliding thing for the lurch (toggle group g): the letter is rect A's top-left; B is A moved by (dx, dy).
  // { w, h, dx, dy, tile: 'SEMI' | 'HARD', look, g }
  slide(st, o) {
    const B = st.B, w = o.w || 3, h = o.h || 1, x = st.x, y = st.gy - 1, g = o.g || 0, tile = T[o.tile || 'SEMI'];
    const A = [x, y, x + w - 1, y + h - 1, tile], Bt = [x + (o.dx || 0), y + (o.dy || 0), x + (o.dx || 0) + w - 1, y + (o.dy || 0) + h - 1, tile];
    for (let yy = A[1]; yy <= A[3]; yy++) for (let xx = A[0]; xx <= A[2]; xx++) B.set(xx, yy, tile);
    for (let yy = Bt[1]; yy <= Bt[3]; yy++) for (let xx = Bt[0]; xx <= Bt[2]; xx++) B.set(xx, yy, T.EMPTY);
    B.toggle(g, [A], [Bt], { kind: 'lurch', auto: true });
    B.spawn('eyeSlider', x, y, { g, A: A.slice(0, 4), B: Bt.slice(0, 4), look: o.look || 'cart' });
    return st.x;
  },
  // the cargo hold's wall across a deck: { x0, x1, floor } (decor every 4 columns, painted over the cabin backdrop)
  holdWall(st, o) { for (let x = (o.x0 || 1) + 2; x <= (o.x1 || st.B.W - 2); x += 4) st.B.decorAt('eyeHoldWall', x, o.floor, x); return st.x; },
  // the lurch clock (once per area): { g, period }
  lurch(st, o) { st.B.spawn('eyeLurch', st.x, st.gy - 1, { g: o.g || 0, period: o.period || EyeLurch.PERIOD }); return st.x; },
  arena_hold: (st, o) => arenaPieces.arena_hold(st, o)
};

/* ---------------- the boss: CAPTAIN GULL ----------------
   A stowaway seagull in a captain's cap who stole every pretzel on board, fought in the cargo hold among escaped
   crated animals. He keeps out of reach in the air, his sack of pretzels dangling under him on a string. The sack is
   the way to him: STOMP THE SACK and the string yanks him down, YOINK!, and he crashes to the floor dazed; then stomp
   HIM. He CIRCLES high (the sack hangs low enough to reach from the crates), SWOOPS low across the hold (the sack
   skims the floor: jump on it as it passes), flings PRETZELS that boomerang back, calls his CREW (phase 2), and FLAPS
   a gale across the hold (phase 3). Five stomps; at the end he lets go of the sack and flies off empty-beaked. */
const GULL = { skyUp: 6.2, sackLen: [58, 58, 52, 46], swoopV: 7.5, sackBox: { x: 0, y: 0, w: 36, h: 30, sx: 0, L: 0 } };
const gullSays = ['MINE!', 'MINE! MINE!', 'FINDERS KEEPERS!', 'SQUAWK!'];
const pretzelShot = (ctx, s, t) => { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1; EyeArt.pretzel(ctx, s.x + s.w / 2, s.y + s.h / 2, 5, t * 12); ctx.restore(); };
const gullBrain = {
  phases: [3, 1],
  guardText: 'TOO HIGH!',
  // where the sack hangs (under his feet on its string)
  // (in a swoop it trails a long way behind him, skimming the floor: hop on it once he has passed)
  sack(b) {
    const low = b.act === 'swoop' && b.stage === 1;
    const L = (low ? 72 : GULL.sackLen[b.phase || 1]) + Math.sin(b.t * 3) * 4, sw = low ? -b.side * 70 : Math.sin(b.t * 2.2) * 8;
    const o = GULL.sackBox; o.x = b.cx + sw - 18; o.y = b.y + b.h + L; o.sx = b.cx + sw; o.L = L; return o;
  },
  skyY(b) { return b.floorY - GULL.skyUp * TS - b.h; },
  // (tall: the camera keeps a low horizon in his fight, so he stays on screen up in the rafters)
  wake(b) { b.tall = true; b.phase = 1; b.hasSack = true; K.say(b.g, b, 'AHOY, LANDLUBBER! THESE PRETZELS ARE MINE!', '#ffffff'); },
  hit(b, kind, src) {
    if (kind === 'stomp' || kind === 'spin') { if (b.vuln) { b.damage(1, { text: 'BONK!', col: '#ffd84a' }); return true; } return 'bounce'; }
    if (kind === 'prop' && b.act !== 'dazed' && b.act !== 'yanked') { this.yank(b); return true; }
    return undefined;
  },
  // the sack was stomped: the string yanks him out of the sky
  yank(b) {
    const g = b.g; b.go('yanked'); b.vy = 2 * TS; b.vuln = true; b.hasSack = false;
    g.parts.text(b.cx, b.y + b.h + 40, 'YOINK!', '#ffe28a'); Sound.play('stomp', { pitch: 0.7 }); g.shake(5);
    for (let k = 0; k < 6; k++) g.burst(b.cx, b.y + b.h + 50, 2, '#c8904a', 'confetti');
  },
  phase(b, n) {
    const g = b.g;
    if (n === 2) { g.bannerText = 'ALL HANDS ON DECK!'; g.bannerT = 2.2; K.say(g, b, 'CREW! TO ME!', '#ffffff'); }
    if (n === 3) { g.bannerText = 'GALE FORCE!'; g.bannerT = 2.2; K.say(g, b, 'FEEL THE WIND OF MY WINGS!', '#ffffff'); }
    b.go('flee');
  },
  hurt(b) { K.say(b.g, b, pick(['MY CAP!', 'OW, MY BEAK!', 'MUTINY!']), '#ffffff'); b.go('flee'); },
  touch(b, p) { return false; },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1, sky = this.skyY(b);
    b.guard = 'bounce';
    if (b.act === 'walk') { b.go('circle'); }
    // stomping the dangling sack yanks him down (any act while he still has it)
    if (b.hasSack && p && !p.dead && b.act !== 'yanked' && b.act !== 'dazed' && b.act !== 'flee') {
      const s = this.sack(b);
      if (p.vy > 0 && p.prevBottom <= s.y + 8 && p.y + p.h >= s.y && p.x + p.w > s.x && p.x < s.x + s.w) { p.vy = -PHYS.stompVHeld; p.jumping = true; p.y = s.y - p.h - 1; this.yank(b); return; }
    }
    if (b.act === 'circle') {
      b.pose = 'fly'; b.vx = 0; b.face();
      const tx = p ? p.cx + Math.sin(b.t * 0.9) * 3 * TS : (b.arenaX0 + b.arenaX1) / 2;
      b.hover(dt, sky + Math.sin(b.t * 2) * 10, clamp(tx, b.arenaX0 + b.w, b.arenaX1 - b.w));
      if (b.at > (ph >= 3 ? 1.4 : 2.0)) {
        b.cycle++;
        const seq = ph >= 3 ? ['swoop', 'gust', 'fling', 'swoop', 'crew'] : ph >= 2 ? ['swoop', 'crew', 'fling', 'swoop'] : ['swoop', 'fling', 'swoop', 'circle2'];
        b.go(seq[b.cycle % seq.length]);
      }
    } else if (b.act === 'circle2') { b.go('circle'); }
    else if (b.act === 'swoop') {
      // tell: he climbs to one end and squawks; then he skims low across the hold (body above Brady's head)
      if (b.first) { b.side = p && p.cx > (b.arenaX0 + b.arenaX1) / 2 ? -1 : 1; b.stage = 0; K.say(g, b, pick(gullSays), '#ffffff'); }
      const sx = b.side > 0 ? b.arenaX0 + TS : b.arenaX1 - b.w - TS, lowY = b.floorY - 3.4 * TS - b.h;
      b.dir = b.side;
      if (b.stage === 0) { b.pose = 'squawk'; b.x = approach(b.x, sx, 12 * TS * dt); b.y = approach(b.y, sky + TS, 8 * TS * dt); if ((Math.abs(b.x - sx) < 2 && b.at > 0.8) || b.at > 2) { b.stage = 1; b.st = 0; Sound.play('wind', { vol: 0.5, pitch: 1.3 }); } }
      else { b.pose = 'dive'; b.st += dt; b.x += b.side * (GULL.swoopV + (ph >= 3 ? 1.5 : 0)) * TS * dt; b.y = approach(b.y, lowY, 10 * TS * dt); if ((b.side > 0 && b.x >= b.arenaX1 - b.w - 4) || (b.side < 0 && b.x <= b.arenaX0 + 4) || b.st > 3) b.go('circle'); }
    } else if (b.act === 'fling') {
      // he hovers over Brady and flings pretzels that spin out and boomerang back
      b.pose = 'fling'; b.hover(dt, sky + TS, p ? clamp(p.cx, b.arenaX0 + b.w, b.arenaX1 - b.w) : b.cx); b.face();
      if (b.first) { b.shots = 0; K.say(g, b, 'HAVE A PRETZEL! ...BACK!', '#ffffff'); }
      if (b.shots < (ph >= 2 ? 3 : 2) && b.at > 0.5 + b.shots * 0.35) {
        b.shots++; Sound.play('throw');
        const d = b.shots % 2 ? 1 : -1, sh = tourFire(g, b.cx, b.y + b.h, { vx: d * 7 * TS, vy: 3 * TS, w: 18, h: 18, life: 2.6, thru: true, col: '#a8681a', art: pretzelShot });
        sh.boomer = { d, t: 0 };
      }
      for (const e of g.entities) if (e.boomer) { e.boomer.t += dt; e.vx -= e.boomer.d * 9 * TS * dt; e.vy -= 1.6 * TS * dt; }
      if (b.at > 2.2) b.go('circle');
    } else if (b.act === 'crew') {
      // phase 2: two gulls of his crew swoop in from the sides, once each, then leave
      b.pose = 'squawk'; b.hover(dt, sky, (b.arenaX0 + b.arenaX1) / 2);
      if (b.first) { K.say(g, b, 'CREW! GET HIM!', '#ffffff'); const C = ENTITY_TYPES.eyeGoon; if (C) for (const sx of [b.arenaX0 + 2 * TS, b.arenaX1 - 2 * TS]) { const e = new C(g, { x: sx, y: b.floorY - 5 * TS, range: 2 }); e.crewLife = 7; e.dir = sx < b.cx ? 1 : -1; g.spawn(e); } }
      if (b.at > 1.2) b.go('circle');
    } else if (b.act === 'gust') {
      // phase 3: he flaps a gale across the floor (feathers fly): stand firm or jump it
      b.pose = 'gust'; b.hover(dt, sky + 2 * TS, b.side > 0 ? b.arenaX0 + 2 * TS : b.arenaX1 - 2 * TS - b.w);
      if (b.first) { b.side = p && p.cx > b.cx ? 1 : -1; b.dir = b.side; K.say(g, b, 'WHOOSH!', '#ffffff'); }
      if (b.at > 0.6 && b.at < 2.2 && p && !p.dead) { p.x += b.side * 3.2 * TS * dt * (p.onGround ? 1 : 0.5); if (Math.random() < 0.3) g.burst(b.cx + b.side * 30, b.cy + 20, 1, '#ffffff', 'dust'); }
      if (b.at > 2.4) b.go('circle');
    } else if (b.act === 'yanked') {
      // pulled down by his own sack: he tumbles to the floor
      b.pose = 'tumble'; b.vuln = true; b.vy += PHYS.gDown * 0.7 * dt; b.y += b.vy * dt;
      if (b.y + b.h >= b.floorY) { b.y = b.floorY - b.h; b.vy = 0; g.shake(7); Sound.play('stomp', { pitch: 0.5 }); g.burst(b.cx, b.floorY, 14, '#ffffff', 'dust'); b.go('dazed'); b.vuln = true; }
    } else if (b.act === 'dazed') {
      b.pose = 'dazed'; b.vuln = true; b.vx = 0;
      if (b.first) K.say(g, b, pick(['MY PRETZELS...', 'SEE STARS...', 'WHO TIED THAT STRING?']), '#ffe28a');
      if (b.at > (ph >= 3 ? 1.7 : 2.3)) b.go('flee');
    } else if (b.act === 'flee') {
      // back up to the rafters, grabbing a new sack off the pretzel pile on the way
      b.pose = 'fly'; b.vuln = false; b.y = approach(b.y, sky, 9 * TS * dt);
      if (b.at > 0.4 && !b.hasSack) { b.hasSack = true; K.say(g, b, 'MORE PRETZELS!', '#ffffff'); }
      if (b.at > 1.1) b.go('circle');
    } else b.go('circle');
    // his crew leaves after a few seconds
    for (const e of g.entities) if (e.crewLife != null) { e.crewLife -= dt; if (e.crewLife <= 0 && !e.dead) { e.remove = true; g.burst(e.cx, e.cy, 6, '#ffffff', 'dust'); } }
    b.clampArena();
  },
  draw(b, ctx, t) {
    const P = b.pose, d = b.dir, x = b.cx, y = b.y + b.h;
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    if (P === 'tumble') ctx.rotate(Math.sin(t * 14) * 0.6);
    const flap = P === 'dazed' ? 0.2 : P === 'gust' ? Math.sin(t * 22) : P === 'dive' ? 0.15 : Math.sin(t * 10);
    ctx.scale(d, 1);
    // back wing
    ctx.fillStyle = '#b8bec8'; ctx.beginPath(); ctx.moveTo(-6, -30); ctx.quadraticCurveTo(-30, -60 - flap * 30, -64, -44 - flap * 34); ctx.quadraticCurveTo(-36, -34, -10, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the legs (or tucked up in flight) and the body
    ctx.strokeStyle = '#ff9a2a'; ctx.lineWidth = 3;
    if (P === 'dazed') { ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-12, 0); ctx.moveTo(8, -6); ctx.lineTo(10, 0); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-10, -2); ctx.moveTo(6, -10); ctx.lineTo(4, -2); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.fillStyle = '#f6f8fc'; ctx.beginPath(); ctx.ellipse(0, -24, 30, 18, P === 'dive' ? 0.25 : 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9aa0aa'; ctx.beginPath(); ctx.moveTo(-28, -26); ctx.lineTo(-44, -30); ctx.lineTo(-40, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    // front wing
    ctx.fillStyle = '#d0d4dc'; ctx.beginPath(); ctx.moveTo(-2, -32); ctx.quadraticCurveTo(-20, -66 - flap * 34, -52, -56 - flap * 40); ctx.quadraticCurveTo(-28, -40, -2, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(-40, -50 - flap * 36); ctx.lineTo(-52, -56 - flap * 40); ctx.lineTo(-44, -46 - flap * 34); ctx.closePath(); ctx.fill();
    // the head, the beak with its red spot, the captain's cap
    ctx.fillStyle = '#f6f8fc'; ctx.beginPath(); ctx.arc(22, -40, 14, 0, TAU); ctx.fill(); ctx.stroke();
    const open = P === 'squawk' || P === 'fling' || P === 'gust';
    ctx.fillStyle = '#ffc83a'; ctx.beginPath(); ctx.moveTo(32, -44); ctx.lineTo(54, open ? -46 : -40); ctx.lineTo(34, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (open) { ctx.beginPath(); ctx.moveTo(33, -36); ctx.lineTo(50, -30); ctx.lineTo(32, -32); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#e8424a'; ctx.beginPath(); ctx.arc(46, -40, 2.4, 0, TAU); ctx.fill();
    if (P === 'dazed' || P === 'tumble') { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, -46); ctx.lineTo(28, -40); ctx.moveTo(28, -46); ctx.lineTo(20, -40); ctx.stroke(); }
    else { ctx.fillStyle = '#ffe28a'; ctx.beginPath(); ctx.arc(25, -44, 4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(26.5, -44, 1.8, 0, TAU); ctx.fill(); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(19, -51); ctx.lineTo(30, -48); ctx.stroke(); }
    // the cap (askew when dazed): white crown, black peak, a gold pretzel badge
    ctx.save(); ctx.translate(20, -54); ctx.rotate(P === 'dazed' ? -0.5 : P === 'tumble' ? 0.8 : -0.08);
    ctx.lineWidth = 2; ctx.strokeStyle = INK;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, -4, 16, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1a26'; ctx.fillRect(-12, 0, 22, 5); ctx.strokeRect(-12, 0, 22, 5);
    ctx.beginPath(); ctx.moveTo(8, 4); ctx.lineTo(20, 6); ctx.lineTo(9, 1); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(0, -4, 4.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();
    if (P === 'dazed') K.dizzy(ctx, b.cx, b.y - 20, t);
  }
};
// the sack on its string hangs far below his ink box (Boss.draw clips his art to it): drawn over the world instead,
// with its own outlines
gullBrain.drawSack = function (b, ctx) {
  if (!b.hasSack || b.pose === 'tumble' || b.pose === 'dazed' || b.state === 'dying') return;
  const s = this.sack(b), x = b.cx, y = b.y + b.h;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(s.sx, s.y + 4); ctx.stroke();
  ctx.strokeStyle = '#f2ead8'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.fillStyle = '#c8945a'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(s.sx - 6, s.y + 2); ctx.quadraticCurveTo(s.sx - 22, s.y + 14, s.sx - 16, s.y + s.h); ctx.lineTo(s.sx + 16, s.y + s.h); ctx.quadraticCurveTo(s.sx + 22, s.y + 14, s.sx + 6, s.y + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8424a'; ctx.fillRect(s.sx - 7, s.y, 14, 4); ctx.strokeRect(s.sx - 7, s.y, 14, 4);
  EyeArt.pretzel(ctx, s.sx, s.y + 19, 4.5, 0);
  ctx.restore();
};
TourHooks.on('afterEntities', (play, ctx) => { const b = play.boss; if (b && b.style === 'eye_gull' && !b.remove) gullBrain.drawSack(b, ctx); });
const boss = { id: 'eye_gull', name: 'Captain Gull', hp: 5, dims: [64, 48], floats: true, music: 'tour_eye_boss', country: 'eye', brain: gullBrain };
// the cargo hold arena: crate stacks to climb on at both sides, escaped crated animals, the pretzel pile
const arenaPieces = {
  arena_hold(st, o) {
    const B = st.B, { x0, w, GY } = o;
    for (let q = 0; q < 4; q++) { B.set(x0 + 2 + q, GY - 3, T.SEMI); B.set(x0 + w - 6 + q, GY - 3, T.SEMI); }
    for (let q = 0; q < 3; q++) { B.set(x0 + Math.floor(w / 2) - 1 + q, GY - 6, T.SEMI); }
    B.decorAt('eyeCrate', x0 + 3, GY, 1); B.decorAt('eyeCrate', x0 + w - 4, GY, 2);
    B.decorAt('eyePretzels', x0 + Math.floor(w / 2), GY, 3);
    B.decorAt('eyeULD', x0 + w - 10, GY, 4);
  }
};
// his ink box: the art reaches past the 64 x 48 body (the wings up and back, the beak, the cap)
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.eye_gull = [48, 48, 60, 24];

/* ---------------- the route map: a little jet in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.22, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r * 0.1, 0); ctx.lineTo(-r * 0.45, -r * 0.8); ctx.lineTo(-r * 0.2, -r * 0.8); ctx.lineTo(r * 0.3, 0); ctx.lineTo(-r * 0.2, r * 0.8); ctx.lineTo(-r * 0.45, r * 0.8); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r * 0.75, 0); ctx.lineTo(-r * 0.95, -r * 0.4); ctx.lineTo(-r * 0.8, -r * 0.4); ctx.lineTo(-r * 0.6, 0); ctx.fill();
  if (Math.sin(t * 6) > 0) { ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.2, r * 0.18, 0, TAU); ctx.fill(); }
  ctx.restore();
};

/* ---------------- the land's map: sprites, a hull coast, the cutaway's insides ---------------- */
Object.assign(TourOWPaint.art, {
  // a jet engine pod under the wing
  jetEngine(c, r) {
    c.fillStyle = '#e8eef6'; c.beginPath(); c.ellipse(0, -r * 0.4, r, r * 0.4, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#3a4050'; c.beginPath(); c.ellipse(-r * 0.92, -r * 0.4, r * 0.14, r * 0.32, 0, 0, TAU); c.fill();
    c.fillStyle = '#e8424a'; c.fillRect(-r * 0.5, -r * 0.78, r * 0.14, r * 0.76);
  },
  // a crated animal in the hold
  crate(c, r) { c.fillStyle = '#c8904a'; c.fillRect(-r * 0.6, -r, r * 1.2, r); c.strokeRect(-r * 0.6, -r, r * 1.2, r); c.fillStyle = '#2a1a10'; c.fillRect(-r * 0.5, -r * 0.75, r, r * 0.12); c.fillRect(-r * 0.5, -r * 0.45, r, r * 0.12); c.fillStyle = '#ffe28a'; c.fillRect(-r * 0.2, -r * 0.62, 2, 2); c.fillRect(r * 0.1, -r * 0.62, 2, 2); },
  // a little seat row
  seats(c, r) { c.fillStyle = SEAT; for (let k = -1; k <= 1; k++) { c.fillRect(k * r * 0.62 - r * 0.25, -r * 0.9, r * 0.5, r * 0.9); c.strokeRect(k * r * 0.62 - r * 0.25, -r * 0.9, r * 0.5, r * 0.9); } c.fillStyle = '#f2ece0'; for (let k = -1; k <= 1; k++) c.fillRect(k * r * 0.62 - r * 0.18, -r * 0.9, r * 0.36, r * 0.18); },
  // the cockpit windows at the nose
  cockpit(c, r) { c.fillStyle = '#1a2a5a'; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(k * r * 0.4 - r * 0.6, -r * 0.2); c.lineTo(k * r * 0.4 - r * 0.3, -r * 0.5); c.lineTo(k * r * 0.4 - r * 0.25, -r * 0.2); c.closePath(); c.fill(); c.stroke(); } },
  // the airstairs at the tail door (the land's airstrip)
  stairs(c, r) { c.fillStyle = '#d8dce4'; c.beginPath(); c.moveTo(-r, 0); c.lineTo(r * 0.4, -r * 1.2); c.lineTo(r * 0.7, -r * 1.2); c.lineTo(r * 0.2, 0); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = '#5a6070'; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(-r + k * r * 0.3, -k * r * 0.24); c.lineTo(-r + k * r * 0.3 + r * 0.3, -k * r * 0.24); c.stroke(); } }
});
// a metal hull instead of a coast: no beach, no cliff; a soft drop shadow, the rim, a row of windows along the top
TourOWLands.coast.eyeHull = function (c, ow, ring) {
  const L = ow.look, ink = this.INK;
  c.save(); c.translate(6, 14); OWGeo.path(c, ring, true); c.fillStyle = 'rgba(0,0,20,0.35)'; c.fill(); c.restore();
  c.save(); c.translate(0, 6); OWGeo.path(c, ring, true); c.fillStyle = '#9aa4b8'; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
  c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = '#ffffff'; c.lineWidth = 14; OWGeo.path(c, ring, true); c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.8; c.stroke();
};
// the cutaway's insides, painted under the trails: the cabin floor and seat rows, the upper deck, the cargo hold
// with its crates, the windows along the top, the stripe and the red-eye moon on the tail, the wing's flaps
TourOWScenes.groundPaint.eye = function (c, ow) {
  const R = TourOWPaint.rng('eyeground'), ink = TourOWPaint.INK;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // the cargo hold under the cabin floor
  c.fillStyle = '#5a6070'; c.beginPath(); c.moveTo(330, 400); c.lineTo(1330, 400); c.lineTo(1260, 458); c.lineTo(420, 458); c.closePath(); c.fill();
  c.strokeStyle = ink; c.lineWidth = 2.4; c.beginPath(); c.moveTo(250, 400); c.lineTo(1360, 400); c.stroke();
  for (let x = 450; x < 1240; x += 60) { if (x > 760 && x < 1000) continue; c.save(); c.translate(x + R() * 20, 452); c.lineWidth = 1.6; c.strokeStyle = ink; TourOWPaint.art.crate.call(TourOWPaint, c, 12 + R() * 4); c.restore(); }
  // the cabin: carpet, seat rows in three blocks
  c.fillStyle = '#3a4a7a'; c.fillRect(260, 380, 1100, 20);
  c.lineWidth = 1.6; c.strokeStyle = ink;
  for (let x = 300; x < 1300; x += 34) { if ((x > 600 && x < 660) || (x > 1000 && x < 1060)) continue; c.save(); c.translate(x, 380); TourOWPaint.art.seats.call(TourOWPaint, c, 11); c.restore(); }
  // the upper deck in the hump
  c.strokeStyle = ink; c.lineWidth = 2.4; c.beginPath(); c.moveTo(930, 250); c.lineTo(1280, 250); c.stroke();
  c.fillStyle = '#3a4a7a'; c.fillRect(940, 236, 330, 14);
  // the windows along the top of the fuselage
  c.fillStyle = '#1a2a5a'; c.lineWidth = 1.2;
  for (let x = 330; x < 900; x += 26) { c.beginPath(); c.ellipse(x, 268, 5, 7, 0, 0, TAU); c.fill(); c.stroke(); }
  for (let x = 980; x < 1260; x += 26) { c.beginPath(); c.ellipse(x, 192, 5, 7, 0, 0, TAU); c.fill(); c.stroke(); }
  // the cheat line along the side: red and navy
  c.fillStyle = COL.a; c.fillRect(230, 296, 1110, 8); c.fillStyle = COL.b; c.fillRect(230, 304, 1110, 5);
  // the tail: a red fin with a white crescent moon (the red-eye)
  c.fillStyle = COL.a; c.beginPath(); c.moveTo(214, 96); c.lineTo(262, 96); c.lineTo(350, 228); c.lineTo(230, 228); c.closePath(); c.fill(); c.lineWidth = 2; c.stroke();
  c.fillStyle = '#fff4d8'; c.beginPath(); c.arc(258, 150, 20, 0, TAU); c.fill(); c.fillStyle = COL.a; c.beginPath(); c.arc(268, 144, 18, 0, TAU); c.fill();
  // the wing: panel lines, the flaps along its back edge, NO STEP
  c.strokeStyle = 'rgba(40,50,70,0.45)'; c.lineWidth = 1.4;
  for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(780 + k * 36, 470); c.lineTo(660 + k * 22, 640); c.stroke(); }
  c.fillStyle = '#c8d0dc'; c.beginPath(); c.moveTo(640, 655); c.lineTo(778, 470); c.lineTo(800, 470); c.lineTo(664, 655); c.closePath(); c.fill(); c.strokeStyle = ink; c.lineWidth = 1.6; c.stroke();
  c.fillStyle = ink; c.font = '9px ' + FONT_DISPLAY; c.textAlign = 'center'; c.fillText('NO STEP', 820, 540);
};
// the red navigation light at the left wingtip blinks; the tail beacon too (TourOWScenes.liveKinds 'blink' does it)
TourLandscape.looks.eye = ['#0e1438', '#1a2a6a', '#3a4a7a', '#eef2f8', '#ffffff', '#ffd84a', 'tower'];

/* ---------------- music: a late-night lounge for the cabin, a scramble for the trolley, a bright glide for the
   wing, a sea shanty for the gull ---------------- */
const tracks = {
  tour_eye: {
    bpm: 84, bars: 8, rv: 0.45, dl: 0.18, sw: 0.12, hx: 0.04,
    ch: 'Fmaj7 Em7 Dm7 G7 Cmaj7 Am7 Dm7 G7',
    ld: 'A5:3 G5:1 F5:4 E5:4 .:4 | G5:3 F5:1 E5:4 D5:4 .:4 | F5:2 A5:2 C6:4 B5:4 G5:4 | E5:12 .:4 |' +
        'G5:3 E5:1 C5:4 E5:4 G5:4 | A5:4 C6:4 B5:4 A5:4 | F5:2 A5:2 D6:4 C6:4 A5:4 | G5:12 .:4',
    li: 'ep', lv: 0.13,
    bp: 'r...r.f.r...r.f.', bi: 'sub', bv: 0.26,
    ap: 'c...c...c...c...', ai: 'vibes', av: 0.05, ao: 60,
    dr: ['k.......k.......', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.22
  },
  tour_eye_chase: {
    bpm: 168, bars: 8, rv: 0.2, hx: 0.06,
    ch: 'Em Em C D Em Em C B7',
    ld: 'E6:2 G6:2 B6:2 G6:2 E6:4 B5:4 | E6:2 G6:2 A6:2 B6:2 A6:4 G6:4 | C6:2 E6:2 G6:2 E6:2 C6:4 G5:4 | D6:4 F#6:4 A6:8 |' +
        'E6:2 G6:2 B6:2 G6:2 E6:4 B5:4 | G6:2 F#6:2 E6:2 D6:2 E6:8 | C6:2 E6:2 G6:2 C7:2 B6:4 G6:4 | B5:4 D#6:4 F#6:4 B6:4',
    li: 'brass', lv: 0.13,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'pluckb', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'pluck', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.42
  },
  tour_eye_sky: {
    bpm: 112, bars: 8, rv: 0.4, dl: 0.12, hx: 0.05,
    ch: 'D A Bm G D A G A',
    ld: 'F#6:4 A6:4 D7:4 A6:4 | E6:4 A6:4 C#7:8 | D6:4 F#6:4 B6:4 F#6:4 | G6:4 B6:4 D7:8 |' +
        'A6:4 F#6:4 D6:4 F#6:4 | E6:4 C#6:4 A5:8 | G6:4 B6:4 D7:4 B6:4 | A6:8 E6:8',
    li: 'whistle', lv: 0.12,
    bp: 'r...r...r...r.f.', bi: 'pluckb', bv: 0.26,
    ap: 'c.c.c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 62,
    dr: ['k.......k.......', '....s.......s...', 'h...h...h...h...'], dv: 0.3
  },
  tour_eye_boss: {
    bpm: 132, bpb: 3, bars: 8, rv: 0.25, hx: 0.06,
    ch: 'Am Am Dm E7 Am F E7 Am',
    ld: 'E5:4 A5:4 C6:4 | E6:8 C6:4 | D6:4 F6:4 A6:4 | G#6:8 E6:4 | A6:4 E6:4 C6:4 | F6:8 C6:4 | B5:4 G#5:4 E5:4 | A5:12',
    li: 'reed', lv: 0.15,
    bp: 'r...f...f...', bi: 'pluckb', bv: 0.3,
    ap: '....c...c...', ai: 'reed', av: 0.04, ao: 57,
    dr: ['k...........', '....s...s...', 'h.h.h.h.h.h.'], dv: 0.4
  }
};

Tour.country({
  id: 'eye', secret: true, bonus: true, colors: COL, tagline: 'A bonus land: the overnight flight Piwi tried to ground',
  themes, painters, decor, decorLights, platforms, skins, enemies, pieces, tracks,
  entities: { eyeWalrus: EyeWalrus, eyeBinDrop: EyeBinDrop, eyeLurch: EyeLurchClock, eyeSlider: EyeSlider, eyeExhaust: EyeExhaust, eyeSlideTell: EyeSlideTell },
  boss, music: { level: 'tour_eye', boss: 'tour_eye_boss', map: null },
  landmark: 'the jumbo jet', emblem,
  arrival: 'Brady! You un-banned late flights and found the red-eye. Everyone on board is asleep... except the drinks trolley. ♥ C',
  levels: []
});
// for the levels file and the tests
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.EyeLurch = EyeLurch; } } catch (e) { /* not in a browser */ }
Tour.eyeKit = { EyeLurch, GULL, gullBrain, Trolley };
})();
