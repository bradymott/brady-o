/* ============================================================
   LOST & FOUND (world 24, cc 'lost'): the second bonus land (SECRETS_WARPS_SWITCHES.md §4.4).
   Opened by a Brady Button (Piwi's House Rule 12: NO RETURNS, in the drowned-bike graveyard under the Netherlands'
   8-3 Bike Lane Rush: 29_tour_nl_secrets.js). An airport island in the Indian Ocean where every bag the world ever
   lost ends up: baggage carousels, a mountain of unclaimed luggage, the x-ray tunnel, the lost-property warehouse.
   Piwi banned returns, so nothing here ever goes home. The staff and the travellers are animals and objects (a
   sniffer beagle, coconut crabs, clothes moths, runaway suitcases), never people.
   This file: the route stop, the looks (themes, painted backdrops, tiles, props), the critters, the carousel flaps,
   the x-ray scanner and the beagle, the suitcase doors, the boss (THE SOCK HYDRA), the route-map emblem, the map's
   sprites, and Rule 12's effect on the whole game (the lost suitcase at every airstrip, the returned-goods shelf).
   The levels and the land's map layout: 29_tour_lost_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'lost', world: 24, name: 'Lost & Found', sub: 'a bonus land', lon: 72, lat: -22, secret: true, bonus: true, d0: 0.55, pin: 'suitcase' });
const COL = { a: '#ff7a3a', b: '#2ab8c8', c: '#ffd23a' };
const INK = '#1e1822';
// suitcase shells (bright hard-shell colours) and their trims
const SHELL = ['#e84a4a', '#3a8ae0', '#ffd23a', '#5ab84a', '#b46ad8', '#ff8a3a', '#2ab8c8', '#f2ece0'];
const LostArt = {
  // a hard-shell suitcase standing on its wheels, bottom centre (x, by): w x h, colour c, handle up (u 0..1)
  case(ctx, x, by, w, h, c, u, tag) {
    const x0 = x - w / 2, y0 = by - h;
    ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    rr(ctx, x0, y0, w, h - 3, Math.min(6, w * 0.18)); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(c, -0.18); for (let k = 1; k < 4; k++) ctx.fillRect(x0 + (w * k) / 4 - 1, y0 + 4, 2, h - 11);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x0 + 3, y0 + 3, 3, h - 12);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x0 + 5, by - 2, 2.4, 0, TAU); ctx.arc(x0 + w - 5, by - 2, 2.4, 0, TAU); ctx.fill();
    if (u > 0) { ctx.strokeStyle = '#8a8e98'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 5, y0); ctx.lineTo(x - 5, y0 - 10 * u); ctx.lineTo(x + 5, y0 - 10 * u); ctx.lineTo(x + 5, y0); ctx.stroke(); }
    if (tag) { ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + w - 4, y0 + 4); ctx.lineTo(x0 + w + 3, y0 + 9); ctx.stroke(); ctx.fillStyle = tag; ctx.save(); ctx.translate(x0 + w + 4, y0 + 12); ctx.rotate(0.25); rr(ctx, -4, -3, 8, 11, 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
  },
  // a soft holdall (duffel) lying down
  duffel(ctx, x, by, w, c) {
    ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.ellipse(x, by - 9, w / 2, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - w / 2 + 5, by - 12); ctx.lineTo(x + w / 2 - 5, by - 12); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, by - 16, 6, Math.PI, 0); ctx.stroke();
  },
  // a single sock (lost, of course): colour / pattern index k
  sock(ctx, x, y, k, rot, s) {
    const S = LOST_SOCKS[k % LOST_SOCKS.length];
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s || 1, s || 1);
    ctx.fillStyle = S.body; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-5, -14); ctx.lineTo(5, -14); ctx.lineTo(5, 0); ctx.quadraticCurveTo(12, 0, 12, 5); ctx.quadraticCurveTo(12, 9, 4, 9); ctx.lineTo(-3, 9); ctx.quadraticCurveTo(-5, 9, -5, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    LostArt.pattern(ctx, S, -5, -14, 10, 14);
    ctx.fillStyle = S.cuff; ctx.fillRect(-5, -14, 10, 3);
    ctx.restore();
  },
  pattern(ctx, S, x, y, w, h) {
    ctx.fillStyle = S.mark;
    if (S.pat === 'stripes') for (let q = y + 5; q < y + h; q += 5) ctx.fillRect(x + 0.5, q, w - 1, 2);
    else if (S.pat === 'dots') for (let q = y + 5; q < y + h; q += 5) for (let r = x + 2; r < x + w - 1; r += 4) { ctx.beginPath(); ctx.arc(r + ((q / 5) % 2), q, 1.1, 0, TAU); ctx.fill(); }
    else if (S.pat === 'argyle') { for (let q = y + 6; q < y + h + 2; q += 7) { ctx.beginPath(); ctx.moveTo(x + w / 2, q - 4); ctx.lineTo(x + w / 2 + 3, q); ctx.lineTo(x + w / 2, q + 4); ctx.lineTo(x + w / 2 - 3, q); ctx.closePath(); ctx.fill(); } }
    else if (S.pat === 'stars') for (let q = y + 6; q < y + h; q += 6) { ctx.beginPath(); ctx.arc(x + w / 2 + ((q / 6) % 2 ? 2 : -2), q, 1.5, 0, TAU); ctx.fill(); }
  },
  // a luggage tag on a string: (x, y) where the string is tied
  tag(ctx, x, y, t, c, text) {
    const sw = Math.sin(t * 2) * 0.15;
    ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 8); ctx.stroke();
    ctx.fillStyle = c || '#ffd23a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-8, 12); ctx.lineTo(-4, 8); ctx.lineTo(4, 8); ctx.lineTo(8, 12); ctx.lineTo(8, 30); ctx.lineTo(-8, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 12, 1.8, 0, TAU); ctx.fill();
    if (text) { ctx.fillStyle = INK; ctx.font = LostArt.F6; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 21, 14); }
    ctx.restore();
  },
  F5: '5px ' + FONT_DISPLAY, F6: '6px ' + FONT_DISPLAY, F7: '7px ' + FONT_DISPLAY, F8: '8px ' + FONT_DISPLAY, F9: '9px ' + FONT_DISPLAY, F11: '11px ' + FONT_DISPLAY, F13: '13px ' + FONT_DISPLAY
};
// the sniffer beagle (a tan and black beagle in a yellow vest): feet centre (x, y), facing d, mode sit | trot | bark
LostArt.beagle = function (ctx, x, y, d, m, t, wag) {
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
    const step = m === 'trot' ? Math.sin(t * 16) * 3 : 0, sit = m === 'sit' ? 4 : 0;
    // tail (wagging)
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-12, -14 + sit); ctx.quadraticCurveTo(-18, -22, -16 + Math.sin(wag) * 4, -28); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-15, -22); ctx.lineTo(-16 + Math.sin(wag) * 4, -28); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    // legs
    ctx.fillStyle = '#ffffff';
    for (const [lx, ph] of [[-9, 0], [-4, 1], [6, 1], [10, 0]]) { const o = ph ? step : -step; ctx.fillRect(lx - 2 + o * 0.5, -8 + (m === 'sit' && lx < 0 ? 4 : 0), 4, 8 - (m === 'sit' && lx < 0 ? 4 : 0)); ctx.strokeRect(lx - 2 + o * 0.5, -8 + (m === 'sit' && lx < 0 ? 4 : 0), 4, 8 - (m === 'sit' && lx < 0 ? 4 : 0)); }
    // body: tan with a black saddle, white belly; a little security vest
    ctx.fillStyle = '#d8964a'; ctx.beginPath(); ctx.ellipse(0, -13 + sit * 0.5, 14, 7, m === 'sit' ? -0.25 : 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a2026'; ctx.beginPath(); ctx.ellipse(-3, -17 + sit * 0.5, 8, 3.5, m === 'sit' ? -0.25 : 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(-2, -19 + sit * 0.5, 7, 10); ctx.strokeRect(-2, -19 + sit * 0.5, 7, 10);
    // head: long ears, white muzzle; barking: mouth open, nose up
    const hy = -22 - (m === 'bark' ? 3 : 0);
    ctx.save(); ctx.translate(12, hy); ctx.rotate(m === 'bark' ? -0.25 : 0);
    ctx.fillStyle = '#d8964a'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(6, 2, 5, 3.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(10, 1, 1.8, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(2, -2, 1.3, 0, TAU); ctx.fill();
    if (m === 'bark') { ctx.fillStyle = '#c83a4a'; ctx.beginPath(); ctx.moveTo(4, 4); ctx.lineTo(10, 6); ctx.lineTo(6, 8); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#7a4a26'; ctx.beginPath(); ctx.ellipse(-3, 4 + Math.sin(wag * 0.5) * 1.5, 3.5, 7, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();
};
// the boss's socks and the loose ones: four kinds, told apart by colour AND pattern (so it reads without colour too)
const LOST_SOCKS = [
  { id: 'red', name: 'RED STRIPY', body: '#e84a4a', mark: '#fff4e0', cuff: '#fff4e0', pat: 'stripes' },
  { id: 'blue', name: 'BLUE SPOTTY', body: '#3a8ae0', mark: '#dff0ff', cuff: '#1a4a8a', pat: 'dots' },
  { id: 'green', name: 'GREEN DIAMOND', body: '#5ab84a', mark: '#ffe680', cuff: '#2a6a2a', pat: 'argyle' },
  { id: 'purple', name: 'PURPLE STARRY', body: '#9a5ad8', mark: '#ffe680', cuff: '#ffd23a', pat: 'stars' }
];

/* ---------------- tiles ---------------- */
// the terminal: polished floor tiles with a yellow safety line; a luggage rack as the one-way ledge; stacked
// hard-shell suitcases as bricks; a steel baggage cage as hard
const hallGround = {
  style: 'tile', cap: '#c8ccd4', capHi: '#eef0f4', dirt: '#8a909c', dirt2: '#5a606c', rock: '#6a707c',
  paint(ctx, rng) {
    ctx.fillStyle = '#7a808c'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#868c98'; ctx.fillRect(1, 1, TS / 2 - 2, TS / 2 - 2); ctx.fillRect(TS / 2 + 1, TS / 2 + 1, TS / 2 - 2, TS / 2 - 2);
    if (rng() < 0.25) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(4 + rng() * 14, 3 + rng() * 14, 9, 2); }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, TS - 3, TS, 3);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#b8bec8'; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = '#e4e8ee'; ctx.fillRect(x0, 0, x1 - x0, 3);
    ctx.fillStyle = '#f2c81a'; ctx.fillRect(x0, 4, x1 - x0, 2);
  }
};
const rackSemi = {
  style: 'rack', c1: '#c8ccd4', c2: '#6a707c',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#5a606c'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x0, 0, x1 - x0, 3);
    ctx.fillStyle = '#2a2c34'; for (let x = x0 + 3; x < x1; x += 7) ctx.fillRect(x, 3, 2, 6);
    ctx.fillStyle = '#f2c81a'; ctx.fillRect(x0, 8, x1 - x0, 1.5);
  }
};
const caseBrick = {
  style: 'case', c1: '#e84a4a', c2: '#a82a2a', mortar: '#2a2030',
  paint(ctx) {
    ctx.fillStyle = '#2a2030'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#e8584a'; rr(ctx, 1, 1, TS - 2, 14, 3); ctx.fill();
    ctx.fillStyle = '#3a8ae0'; rr(ctx, 1, 17, 18, 14, 3); ctx.fill();
    ctx.fillStyle = '#ffd23a'; rr(ctx, 21, 17, 10, 14, 3); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(9, 3, 2, 10); ctx.fillRect(21, 3, 2, 10); ctx.fillRect(9, 19, 2, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(3, 3, 2, 10); ctx.fillRect(3, 19, 2, 10);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const cageHard = {
  c1: '#9aa0aa', c2: '#4a505a',
  paint(ctx) {
    ctx.fillStyle = '#4a505a'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = '#aab0ba'; ctx.lineWidth = 1.2;
    for (let k = -TS; k < TS * 2; k += 6) { ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + TS, TS); ctx.moveTo(k + TS, 0); ctx.lineTo(k, TS); ctx.stroke(); }
    ctx.fillStyle = '#c8ccd4'; ctx.fillRect(0, 0, TS, 3); ctx.fillRect(0, TS - 3, TS, 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the mountain: a jumble of lost luggage (every variant its own little heap of bags), its top a crumpled tarpaulin
const pileGround = {
  style: 'pile', cap: '#3a8a7a', capHi: '#5ab8a0', dirt: '#6a5a6a', dirt2: '#3a2e3a', rock: '#5a4a5a',
  paint(ctx, rng) {
    ctx.fillStyle = '#3a2e3a'; ctx.fillRect(0, 0, TS, TS);
    for (let k = 0; k < 3; k++) {
      const w = 12 + rng() * 14, h = 9 + rng() * 8, x = rng() * (TS - 6) - 4, y = rng() * (TS - 6) - 2, c = SHELL[Math.floor(rng() * SHELL.length)];
      ctx.fillStyle = shade(c, -0.18); rr(ctx, x, y, w, h, 3); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + w / 2 - 1, y + 2, 2, h - 4);
    }
    if (rng() < 0.4) { ctx.strokeStyle = '#d8d0c0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rng() * TS, rng() * TS); ctx.quadraticCurveTo(TS / 2, TS / 2, rng() * TS, rng() * TS); ctx.stroke(); }
  },
  paintCap(ctx, x0, x1, rng) {
    ctx.fillStyle = '#2a6a5a'; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = '#4aa890'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = '#ffd23a'; for (let x = x0 + 4; x < x1; x += 11) ctx.fillRect(x, 1, 2, 2);
    if (rng() < 0.3) { ctx.fillStyle = '#f2ece0'; ctx.beginPath(); ctx.arc(x0 + 6 + rng() * (x1 - x0 - 12), 4, 2.5, 0, TAU); ctx.fill(); }
  }
};
// inside a suitcase: quilted lining and folded clothes
const liningGround = {
  style: 'lining', cap: '#f2ece0', capHi: '#ffffff', dirt: '#b46a8a', dirt2: '#7a3a5a', rock: '#8a4a6a',
  paint(ctx, rng) {
    ctx.fillStyle = '#9a4a72'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = 'rgba(255,220,240,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(TS, TS); ctx.moveTo(TS, 0); ctx.lineTo(0, TS); ctx.moveTo(TS / 2, 0); ctx.lineTo(TS, TS / 2); ctx.lineTo(TS / 2, TS); ctx.lineTo(0, TS / 2); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,250,0.5)'; ctx.beginPath(); ctx.arc(TS / 2, TS / 2, 1.5, 0, TAU); ctx.fill();
  },
  paintCap(ctx, x0, x1, rng) {
    // a folded shirt or a towel along the top
    ctx.fillStyle = ['#7ac8ff', '#ffd23a', '#f2ece0', '#ff8aa8'][Math.floor(rng() * 4)]; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x0, 6, x1 - x0, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x0, 1, x1 - x0, 1.5);
  }
};
const clothSemi = {
  style: 'cloth', c1: '#f2ece0', c2: '#c8b8a0',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#c8b8a0'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#f2ece0'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = '#3a8ae0'; for (let x = x0 + 2; x < x1; x += 9) ctx.fillRect(x, 5, 5, 2);
  }
};
// the x-ray tunnel: a dark rubber belt floor, glowing edge; blue cabinet panels
const xrayGround = {
  style: 'belt', cap: '#2a3a4a', capHi: '#3affd8', dirt: '#1a2230', dirt2: '#0e121a', rock: '#1a2230',
  paint(ctx, rng) {
    ctx.fillStyle = '#141a26'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#1c2432'; ctx.fillRect(2, 2, TS - 4, TS - 4);
    ctx.fillStyle = 'rgba(58,255,216,0.12)'; if (rng() < 0.3) ctx.fillRect(6, 10 + rng() * 10, TS - 12, 1.5);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#26303e'; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = '#3affd8'; ctx.fillRect(x0, 0, x1 - x0, 1.5);
    ctx.fillStyle = '#0e121a'; for (let x = x0; x < x1; x += 8) ctx.fillRect(x, 2, 1, 4);
  }
};
const xraySemi = {
  style: 'tray', c1: '#5a6a7a', c2: '#2a3440',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#2a3440'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#7a8a9a'; ctx.fillRect(x0, 0, x1 - x0, 3);
    ctx.fillStyle = '#3affd8'; ctx.fillRect(x0, 8, x1 - x0, 1);
  }
};
const xrayBrick = {
  style: 'panel', c1: '#2a4a6a', c2: '#1a2a3a', mortar: '#0a1018',
  paint(ctx) {
    ctx.fillStyle = '#1a2a3a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#2a4060'; ctx.fillRect(2, 2, TS - 4, TS - 4);
    ctx.fillStyle = '#3affd8'; ctx.fillRect(4, 4, 6, 2); ctx.fillStyle = '#ff5a6a'; ctx.fillRect(12, 4, 3, 2);
    ctx.strokeStyle = '#0a1018'; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the warehouse: worn concrete, steel shelving
const depotGround = {
  style: 'concrete', cap: '#a8a090', capHi: '#d8d0c0', dirt: '#7a7468', dirt2: '#4a4640', rock: '#6a6458',
  paint(ctx, rng) {
    ctx.fillStyle = '#7a7468'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#847e72'; for (let k = 0; k < 4; k++) ctx.fillRect(rng() * TS, rng() * TS, 3, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, TS - 3, TS, 3);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#a8a090'; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = '#d8d0c0'; ctx.fillRect(x0, 0, x1 - x0, 2);
    ctx.fillStyle = '#e8b81a'; for (let x = x0; x < x1; x += 16) { ctx.fillRect(x, 3, 8, 3); }
  }
};
const base = { ground: hallGround, semi: rackSemi, brick: caseBrick, hard: cageHard, pillar: { c1: '#c8ccd4', c2: '#8a909c', cap: '#ff7a3a', style: 'column' }, accent: COL.a, tint: {}, bloom: 0.12 };

/* ---------------- painted backdrops (painted once into the backdrop layers) ---------------- */
const painters = {
  // the Indian Ocean horizon: a turquoise lagoon, a reef line, the far runway with its approach lights
  lostLagoon(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = shade(L.color, 0.18); for (let k = 0; k < 40; k++) ctx.fillRect(rng() * BG_W, b + 6 + rng() * 40, 20 + rng() * 40, 2);
    ctx.fillStyle = '#f2e6c0'; ctx.fillRect(0, b + 52, BG_W, 10);
    ctx.fillStyle = '#5a6068'; ctx.fillRect(0, b + 62, BG_W, H - b - 62);
    ctx.fillStyle = '#ffffff'; for (let x = 0; x < BG_W; x += 60) ctx.fillRect(x, b + 72, 30, 3);
    ctx.fillStyle = '#ffd23a'; for (let x = 10; x < BG_W; x += 24) { ctx.beginPath(); ctx.arc(x, b + 64, 2, 0, TAU); ctx.fill(); }
  },
  // the terminal over the apron: a long glass front, jet bridges, a control tower, parked planes (plain, no airline)
  lostTerminal(ctx, L, rng, H) {
    const b = L.base;
    for (let x = 0; x < BG_W; x += 1100) wrapDraw(x, 1000, X => {
      // the control tower
      const tx = X + 120;
      ctx.fillStyle = shade(L.color, -0.1); ctx.fillRect(tx - 12, b - 210, 24, 210);
      ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(tx - 34, b - 220); ctx.lineTo(tx + 34, b - 220); ctx.lineTo(tx + 26, b - 262); ctx.lineTo(tx - 26, b - 262); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#9ae8f4'; ctx.fillRect(tx - 26, b - 254, 52, 24);
      ctx.fillStyle = L.color; ctx.fillRect(tx - 4, b - 290, 8, 30); ctx.fillStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(tx, b - 292, 4, 0, TAU); ctx.fill();
      // the terminal: a wavy roof over a glass wall
      ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(X + 220, b); ctx.lineTo(X + 220, b - 90);
      for (let q = 0; q <= 640; q += 40) ctx.lineTo(X + 220 + q, b - 96 - 14 * Math.sin(q / 640 * Math.PI * 3)); ctx.lineTo(X + 860, b); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#bfeff8'; ctx.fillRect(X + 236, b - 78, 608, 52);
      ctx.fillStyle = shade(L.color, 0.15); for (let q = 236; q < 844; q += 38) ctx.fillRect(X + q, b - 78, 3, 52);
      // jet bridges and two parked planes
      for (const px of [330, 620]) {
        ctx.fillStyle = shade(L.color, -0.05); ctx.fillRect(X + px, b - 46, 70, 16);
        const p0 = X + px + 120;
        ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.ellipse(p0, b - 30, 90, 16, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#dfe4ec'; ctx.beginPath(); ctx.moveTo(p0 + 60, b - 40); ctx.lineTo(p0 + 92, b - 82); ctx.lineTo(p0 + 104, b - 82); ctx.lineTo(p0 + 88, b - 32); ctx.closePath(); ctx.fill();
        ctx.fillStyle = COL.b; ctx.fillRect(p0 - 80, b - 30, 160, 4);
        ctx.fillStyle = '#4a5260'; for (let q = -60; q < 60; q += 12) ctx.fillRect(p0 + q, b - 36, 6, 4);
      }
    });
  },
  // the hall's back wall: big windows on the apron, the ARRIVALS boards, rows of ceiling lights
  lostHallWall(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(L.color, -0.12); for (let y = 30; y < H; y += 120) ctx.fillRect(0, y, BG_W, 4);
    for (let x = 40; x < BG_W; x += 340) {
      // a window: sky, the runway, a plane taking off
      ctx.fillStyle = '#9ad8f0'; ctx.fillRect(x, 70, 220, 150);
      ctx.fillStyle = '#d8f2fa'; ctx.fillRect(x, 170, 220, 50);
      ctx.fillStyle = '#7a808c'; ctx.fillRect(x, 200, 220, 20);
      ctx.fillStyle = '#ffffff'; for (let q = x + 8; q < x + 220; q += 30) ctx.fillRect(q, 209, 14, 2);
      const px = x + 40 + rng() * 120, py = 110 + rng() * 40;
      ctx.save(); ctx.translate(px, py); ctx.rotate(-0.25); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 0, 34, 6, 0, 0, TAU); ctx.fill(); ctx.fillRect(-6, -2, 14, 22); ctx.fillRect(-30, -12, 8, 10); ctx.restore();
      ctx.strokeStyle = shade(L.color, -0.3); ctx.lineWidth = 6; ctx.strokeRect(x, 70, 220, 150); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 110, 70); ctx.lineTo(x + 110, 220); ctx.stroke();
      // a little clock over the window
      ctx.fillStyle = '#f2ece0'; ctx.beginPath(); ctx.arc(x + 110, 46, 14, 0, TAU); ctx.fill(); ctx.strokeStyle = shade(L.color, -0.35); ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 110, 46); ctx.lineTo(x + 110, 37); ctx.moveTo(x + 110, 46); ctx.lineTo(x + 117, 49); ctx.stroke();
    }
    ctx.fillStyle = '#fff8e0'; for (let x = 20; x < BG_W; x += 80) ctx.fillRect(x, 8, 46, 6);
  },
  // far hills of unclaimed luggage against a sunset (24-2)
  lostPiles(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 24) ctx.lineTo(x, b - 70 * Math.abs(Math.sin(x / BG_W * TAU * 2.5)) - 20 * Math.sin(x / 61));
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    for (let k = 0; k < 90; k++) {
      const x = rng() * BG_W, h0 = b - 70 * Math.abs(Math.sin(x / BG_W * TAU * 2.5)) - 20 * Math.sin(x / 61);
      const y = h0 + 8 + rng() * (H - h0), w = 14 + rng() * 22;
      ctx.fillStyle = shade(L.color, rng() * 0.25 - 0.12); rr(ctx, x, y, w, w * 0.6, 3); ctx.fill();
    }
    ctx.strokeStyle = shade(L.color, -0.25); ctx.lineWidth = 2;
    for (let k = 0; k < 8; k++) { const x = rng() * BG_W; ctx.beginPath(); ctx.moveTo(x, b + 30); ctx.lineTo(x + 6, b - 10); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 6, b - 10, 12, Math.PI, 0); ctx.stroke(); }
  },
  // the x-ray tunnel's walls: dark blue, teal x-ray outlines of what is inside the bags (umbrellas, a rubber duck,
  // a teapot, a fish bone, a guitar, a hairdryer)
  lostXray(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = 'rgba(58,255,216,0.08)'; ctx.lineWidth = 1; for (let y = 0; y < H; y += 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); }
    const things = ['duck', 'teapot', 'fish', 'guitar', 'brolly', 'dryer', 'boot'];
    for (let x = 60, k = 0; x < BG_W; x += 150 + rng() * 80, k++) {
      const y = 80 + rng() * (H - 200), s = 1 + rng() * 0.6, kind = things[(k + Math.floor(rng() * 3)) % things.length];
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = 'rgba(58,255,216,0.45)'; ctx.fillStyle = 'rgba(58,255,216,0.1)'; ctx.lineWidth = 2;
      // the suitcase outline round it
      rr(ctx, -40, -30, 80, 60, 8); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(160,255,240,0.8)';
      if (kind === 'duck') { ctx.beginPath(); ctx.ellipse(0, 6, 18, 11, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(12, -10, 8, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(20, -10); ctx.lineTo(28, -8); ctx.lineTo(20, -6); ctx.stroke(); }
      else if (kind === 'teapot') { ctx.beginPath(); ctx.ellipse(0, 4, 18, 14, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(30, -10); ctx.stroke(); ctx.beginPath(); ctx.arc(-20, 4, 7, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); }
      else if (kind === 'fish') { ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(22, 0); ctx.stroke(); for (let q = -18; q < 18; q += 6) { ctx.beginPath(); ctx.moveTo(q, -10); ctx.lineTo(q + 3, 0); ctx.lineTo(q, 10); ctx.stroke(); } ctx.beginPath(); ctx.arc(24, 0, 5, 0, TAU); ctx.stroke(); }
      else if (kind === 'guitar') { ctx.beginPath(); ctx.ellipse(-14, 4, 12, 14, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(34, -6); ctx.stroke(); }
      else if (kind === 'brolly') { ctx.beginPath(); ctx.arc(0, 0, 22, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.arc(5, 22, 5, Math.PI, 0, true); ctx.stroke(); }
      else if (kind === 'dryer') { ctx.beginPath(); ctx.arc(-8, -4, 12, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-4, 6); ctx.lineTo(0, 24); ctx.stroke(); ctx.strokeRect(4, -10, 20, 12); }
      else { ctx.beginPath(); ctx.moveTo(-10, -22); ctx.lineTo(4, -22); ctx.lineTo(4, 10); ctx.lineTo(20, 14); ctx.lineTo(20, 22); ctx.lineTo(-10, 22); ctx.closePath(); ctx.stroke(); }
      ctx.restore();
    }
  },
  // the lost-property warehouse: tall shelves of boxes, sock bins, a hanging sign
  lostShelves(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 30; x < BG_W; x += 260) {
      ctx.fillStyle = shade(L.color, -0.25); ctx.fillRect(x, 60, 8, H - 60); ctx.fillRect(x + 200, 60, 8, H - 60);
      for (let y = 110; y < H; y += 90) {
        ctx.fillStyle = '#e8b81a'; ctx.fillRect(x, y, 208, 6);
        for (let q = x + 10; q < x + 196;) { const w = 22 + rng() * 30, h = 26 + rng() * 40; ctx.fillStyle = rng() < 0.6 ? '#c8a070' : SHELL[Math.floor(rng() * SHELL.length)]; ctx.fillRect(q, y - h, w, h); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(q + w - 4, y - h, 4, h); if (rng() < 0.4) { ctx.fillStyle = '#f2ece0'; ctx.fillRect(q + 4, y - h + 6, w - 10, 7); } q += w + 4; }
      }
    }
    ctx.fillStyle = 'rgba(255,248,224,0.18)'; for (let x = 100; x < BG_W; x += 260) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 90, H); ctx.lineTo(x - 60, H); ctx.closePath(); ctx.fill(); }
  },
  // inside a giant suitcase: the lid's lining overhead, elastic straps, a mesh pocket
  lostLining(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = 'rgba(255,220,240,0.18)'; ctx.lineWidth = 2;
    for (let x = -H; x < BG_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.moveTo(x + H, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let x = 80; x < BG_W; x += 300) {
      ctx.fillStyle = 'rgba(30,20,30,0.3)'; ctx.fillRect(x, 0, 18, H);
      ctx.fillStyle = '#c8c0b8'; rr(ctx, x - 6, H * 0.45, 30, 18, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; for (let y = H * 0.15; y < H * 0.4; y += 8) { ctx.beginPath(); ctx.moveTo(x + 40, y); ctx.lineTo(x + 140, y); ctx.stroke(); }
      ctx.strokeRect(x + 40, H * 0.15, 100, H * 0.25);
    }
    // the zip running along the top
    ctx.fillStyle = '#c8b070'; for (let x = 0; x < BG_W; x += 8) ctx.fillRect(x, 24 + (x / 8 % 2) * 2, 5, 4);
  }
};
const dyn = {
  // the scanner's sweep line drifting over the x-ray backdrop
  lostScanline(ctx, L, camX, oy, S, W, t) {
    const y = oy + ((t * 60) % 400) * S;
    ctx.fillStyle = 'rgba(58,255,216,0.07)'; ctx.fillRect(0, y, W, 18 * S);
  }
};
const themes = {
  lost_hall: Object.assign({}, base, {
    name: 'Baggage Hall', music: 'tour_nl_rush', particles: 'motes', rays: null,
    sky: ['#d8dce4', '#e8ecf0', '#f4f6f8'], horizonGlow: '#ffffff', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'lostHallWall', color: '#c8ccd4', base: 0, f: 0.08 }],
    fog: '#eef0f4', darkness: 0, decor: ['lostTrolley', 'lostPalm', 'lostCone', 'lostBags']
  }),
  lost_peak: Object.assign({}, base, {
    ground: pileGround, semi: clothSemi,
    name: 'Unclaimed Mountain', music: 'tour_mz', particles: 'leaves', rays: '#ffe0c0',
    sky: ['#ff8a6a', '#ffc08a', '#fff0d0'], horizonGlow: '#ffe0b0', celestial: { type: 'sun', x: 0.75, y: 0.62, r: 34, color: '#fff0c8', glow: '#ffb070' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'lostLagoon', color: '#2ab8c8', base: 330, f: 0.04 }, { kind: 'lostTerminal', color: '#5a6a8a', base: 360, f: 0.08 }, { kind: 'lostPiles', color: '#7a5a7a', base: 380, f: 0.18 }],
    fog: '#ffe0c8', decor: ['lostBags', 'lostBrollyStuck', 'lostSockPile']
  }),
  lost_case: Object.assign({}, base, {
    ground: liningGround, semi: clothSemi,
    name: 'Inside a Suitcase', music: 'secret', particles: 'dust',
    sky: ['#5a2a42', '#7a3a5a', '#9a4a72'], horizonGlow: '#ffd0e0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'lostLining', color: '#7a3a5a', base: 0, f: 0.06 }],
    fog: '#ffd0e0', darkness: 0.1, decor: ['lostSockPile', 'lostBags']
  }),
  lost_xray: Object.assign({}, base, {
    ground: xrayGround, semi: xraySemi, brick: xrayBrick,
    name: 'X-Ray Tunnel', music: 'tour_w22_hall', particles: 'none', rays: null,
    sky: ['#060a14', '#0a1224', '#101a30'], horizonGlow: '#3affd8', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'lostXray', color: '#0c1626', base: 0, f: 0.1, dyn: 'lostScanline' }],
    fog: '#3affd8', darkness: 0.55, decor: ['lostTray']
  }),
  lost_depot: Object.assign({}, base, {
    ground: depotGround,
    name: 'The Lost-Property Warehouse', music: 'tour_ma_boss', particles: 'dust', rays: '#fff8e0',
    sky: ['#4a4450', '#5a5460', '#6a6470'], horizonGlow: '#fff0c0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'lostShelves', color: '#5a5460', base: 0, f: 0.1 }],
    fog: '#e8e0d0', darkness: 0.08, decor: ['lostBin', 'lostBags', 'lostSockPile']
  })
};

/* ---------------- props (Decor: drawn each frame: plain shapes, no per-frame objects) ---------------- */
const decor = {
  // a luggage trolley with a tower of bags
  lostTrolley(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 26, y - 6); ctx.lineTo(x + 22, y - 6); ctx.lineTo(x + 26, y - 46); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x - 20, y - 3, 3.5, 0, TAU); ctx.arc(x + 16, y - 3, 3.5, 0, TAU); ctx.fill();
    LostArt.case(ctx, x - 6, y - 7, 34, 22, SHELL[s % SHELL.length], 0, null);
    LostArt.case(ctx, x - 4, y - 29, 26, 18, SHELL[(s + 3) % SHELL.length], 0, '#ffd23a');
    LostArt.duffel(ctx, x - 4, y - 47, 30, SHELL[(s + 5) % SHELL.length]);
    ctx.restore();
  },
  // a potted palm (an island airport)
  lostPalm(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = '#c8703a'; ctx.beginPath(); ctx.moveTo(x - 12, y - 18); ctx.lineTo(x + 12, y - 18); ctx.lineTo(x + 9, y); ctx.lineTo(x - 9, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.quadraticCurveTo(x + 4, y - 40, x - 2, y - 62); ctx.stroke();
    const sw = Math.sin(t * 1.2) * 0.06;
    ctx.fillStyle = '#4aa84a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.55 + sw; ctx.beginPath(); ctx.moveTo(x - 2, y - 62); ctx.quadraticCurveTo(x - 2 + Math.cos(a) * 20, y - 62 + Math.sin(a) * 20 - 8, x - 2 + Math.cos(a) * 34, y - 62 + Math.sin(a) * 34 + 10); ctx.quadraticCurveTo(x - 2 + Math.cos(a) * 18, y - 62 + Math.sin(a) * 18, x - 2, y - 62); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  },
  // a striped safety cone
  lostCone(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(x - 9, y - 4); ctx.lineTo(x - 3, y - 28); ctx.lineTo(x + 3, y - 28); ctx.lineTo(x + 9, y - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 6, y - 16, 12, 4);
    ctx.fillStyle = '#ff7a1a'; ctx.fillRect(x - 13, y - 4, 26, 4); ctx.strokeRect(x - 13, y - 4, 26, 4);
    ctx.restore();
  },
  // a heap of three bags with tags
  lostBags(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0;
    ctx.save();
    LostArt.case(ctx, x - 14, y, 26, 30, SHELL[s % SHELL.length], 0, null);
    LostArt.case(ctx, x + 12, y, 22, 22, SHELL[(s + 2) % SHELL.length], 0, '#ffd23a');
    LostArt.duffel(ctx, x - 2, y - 26, 34, SHELL[(s + 4) % SHELL.length]);
    ctx.restore();
  },
  // an umbrella stuck in the heap, open and tattered (scenery)
  lostBrollyStuck(ctx, x, y, t, th, d) {
    const c = SHELL[((d && d.seed) || 0) % SHELL.length], tilt = -0.25 + 0.05 * Math.sin(t * 1.5);
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -44); ctx.stroke();
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-26, -40); ctx.quadraticCurveTo(0, -70, 26, -40); ctx.quadraticCurveTo(13, -46, 0, -40); ctx.quadraticCurveTo(-13, -46, -26, -40); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a little heap of odd socks
  lostSockPile(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0;
    ctx.save();
    LostArt.sock(ctx, x - 10, y - 8, s, -1.2, 0.9); LostArt.sock(ctx, x + 6, y - 8, s + 1, 1.3, 0.9); LostArt.sock(ctx, x - 2, y - 14, s + 2, 0.2, 0.9);
    ctx.restore();
  },
  // a grey security tray with a shoe, keys and a rubber duck (the x-ray tunnel)
  lostTray(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#6a7a8a'; ctx.beginPath(); ctx.moveTo(x - 24, y - 12); ctx.lineTo(x + 24, y - 12); ctx.lineTo(x + 20, y); ctx.lineTo(x - 20, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(x + 6, y - 14, 7, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 11, y - 20, 4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff8a3a'; ctx.beginPath(); ctx.moveTo(x + 15, y - 21); ctx.lineTo(x + 19, y - 20); ctx.lineTo(x + 15, y - 18); ctx.fill();
    ctx.fillStyle = '#c8a03a'; ctx.beginPath(); ctx.arc(x - 10, y - 15, 3, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a laundry bin overflowing with socks (the warehouse)
  lostBin(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    LostArt.sock(ctx, x - 8, y - 38, s, -0.6, 1); LostArt.sock(ctx, x + 8, y - 40, s + 1, 0.7, 1); LostArt.sock(ctx, x, y - 44, s + 2, 0.1, 1);
    ctx.fillStyle = '#4a6a9a'; rr(ctx, x - 22, y - 36, 44, 36, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a5a8a'; for (let q = -16; q < 18; q += 8) ctx.fillRect(x + q, y - 30, 3, 24);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x - 16, y - 2, 3, 0, TAU); ctx.arc(x + 16, y - 2, 3, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a hanging departures-style board: what is on which belt
  lostBoard(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0, lines = d && d.flaps ? LOST_BOARD[3] : LOST_BOARD[s % 3];
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 30, y - 120); ctx.lineTo(x - 30, y - 92); ctx.moveTo(x + 30, y - 120); ctx.lineTo(x + 30, y - 92); ctx.stroke();
    ctx.fillStyle = '#1a1c24'; rr(ctx, x - 52, y - 92, 104, 40, 3); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd23a'; ctx.font = LostArt.F8; ctx.fillText(lines[0], x, y - 82, 96);
    ctx.fillStyle = '#f2ece0'; ctx.font = LostArt.F7; ctx.fillText(lines[1], x, y - 70, 96); ctx.fillText(lines[2], x, y - 60, 96);
    ctx.restore();
  },
  // the board by the first flap: what the flaps do
  lostBoardFlaps(ctx, x, y, t) { decor.lostBoard(ctx, x, y, t, null, LOST_BOARD_FLAPS); },
  // the Lost & Found counter with its bell and a "take a number" roll
  lostDesk(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#c8703a'; rr(ctx, x - 50, y - 36, 100, 36, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8904a'; ctx.fillRect(x - 54, y - 40, 108, 6); ctx.strokeRect(x - 54, y - 40, 108, 6);
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x - 30, y - 44, 6, Math.PI, 0); ctx.fill(); ctx.stroke(); ctx.fillRect(x - 37, y - 44, 14, 2);
    ctx.fillStyle = '#f2ece0'; rr(ctx, x - 52, y - 110, 104, 26, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.a; ctx.font = LostArt.F9; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LOST & FOUND', x, y - 102);
    ctx.fillStyle = INK; ctx.font = LostArt.F6; ctx.fillText('NO RETURNS · BY ORDER OF PIWI', x, y - 91, 98);
    ctx.fillStyle = '#e84a4a'; rr(ctx, x + 22, y - 58, 16, 18, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // the customs counter: a red and a green channel sign
  lostCustoms(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#5a6068'; rr(ctx, x - 40, y - 30, 80, 30, 3); ctx.fill(); ctx.stroke();
    for (const [dx, c, a, b] of [[-26, '#2a9a4a', 'NOTHING TO', 'DECLARE'], [26, '#d03a3a', 'SOCKS TO', 'DECLARE']]) {
      ctx.fillStyle = c; rr(ctx, x + dx - 24, y - 112, 48, 26, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.font = LostArt.F6; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a, x + dx, y - 104, 44); ctx.fillText(b, x + dx, y - 95, 44);
    }
    ctx.restore();
  },
  // the scanner arch's frame (24-3): two pillars and a lintel with its warning lights
  lostArch(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x - 46, y - 140, 14, 140); ctx.strokeRect(x - 46, y - 140, 14, 140); ctx.fillRect(x + 32, y - 140, 14, 140); ctx.strokeRect(x + 32, y - 140, 14, 140);
    ctx.fillRect(x - 50, y - 156, 100, 18); ctx.strokeRect(x - 50, y - 156, 100, 18);
    ctx.fillStyle = Math.floor(t * 3) % 2 ? '#3affd8' : '#1a6a5a'; ctx.beginPath(); ctx.arc(x - 30, y - 147, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = Math.floor(t * 3) % 2 ? '#1a6a5a' : '#3affd8'; ctx.beginPath(); ctx.arc(x + 30, y - 147, 4, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a canvas shelving bay of the warehouse (foreground)
  lostShelf(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#3a5a8a'; ctx.fillRect(x - 40, y - 110, 6, 110); ctx.fillRect(x + 34, y - 110, 6, 110);
    for (const sy of [y - 40, y - 80]) { ctx.fillStyle = '#e8b81a'; ctx.fillRect(x - 40, sy, 80, 5); ctx.strokeRect(x - 40, sy, 80, 5); }
    LostArt.case(ctx, x - 16, y - 45, 26, 22, SHELL[s % SHELL.length], 0, null); LostArt.duffel(ctx, x + 14, y - 45, 30, SHELL[(s + 1) % SHELL.length]);
    LostArt.case(ctx, x, y - 85, 40, 26, SHELL[(s + 4) % SHELL.length], 0, '#ffd23a');
    ctx.restore();
  }
};
const LOST_BOARD_FLAPS = { seed: 3, flaps: true };
const LOST_BOARD = [['BELT 1', 'FROM: EVERYWHERE', 'STATUS: LOST'], ['BELT 2', 'FROM: NOWHERE', 'STATUS: ON THE BELT'], ['BELT 3', 'FROM: UP THERE', 'STATUS: STILL LOST'], ['FLAPS', 'STAND STILL =', 'SWALLOWED!']];

/* ---------------- door looks: a zipped suitcase that unzips as Brady comes near; the rubber flap ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look !== 'lostZip' && look !== 'lostHatch') return dr0.call(this, ctx, x, y, look, t, near);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    if (look === 'lostHatch') {
      // a cargo hatch in the side of the heap: a steel door with a wheel
      ctx.fillStyle = '#5a606c'; rr(ctx, x - 20, y - 56, 40, 56, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 20, y - 6, 40, 4);
      ctx.strokeStyle = '#c8ccd4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 32, 9, 0, TAU); ctx.moveTo(x - 9, y - 32); ctx.lineTo(x + 9, y - 32); ctx.moveTo(x, y - 41); ctx.lineTo(x, y - 23); ctx.stroke();
      ctx.restore(); return;
    }
    // a giant suitcase stood on end, its zip running round the front; near: the zip opens into a doorway
    const open = near ? 1 : 0;
    ctx.fillStyle = '#e8584a'; rr(ctx, x - 26, y - 66, 52, 64, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c83a3a'; ctx.fillRect(x - 18, y - 62, 3, 56); ctx.fillRect(x + 15, y - 62, 3, 56);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x - 18, y - 2, 3, 0, TAU); ctx.arc(x + 18, y - 2, 3, 0, TAU); ctx.fill();
    if (open) {
      ctx.fillStyle = '#5a2a42'; rr(ctx, x - 16, y - 58, 32, 54, 10); ctx.fill();
      ctx.fillStyle = '#9a4a72'; ctx.beginPath(); ctx.moveTo(x - 16, y - 50); ctx.lineTo(x - 26, y - 46); ctx.lineTo(x - 26, y - 12); ctx.lineTo(x - 16, y - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // the zip: teeth round the front, the pull
    ctx.strokeStyle = '#d8c070'; ctx.lineWidth = 2; ctx.setLineDash([2, 2]); rr(ctx, x - 16, y - 58, 32, 54, 10); ctx.stroke(); ctx.setLineDash([]);
    const px = open ? x - 16 : x + 14, py = open ? y - 8 : y - 56 + Math.sin(t * 2) * 1;
    ctx.fillStyle = '#d8c070'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; rr(ctx, px - 3, py, 6, 10, 2); ctx.fill(); ctx.stroke();
    // the handle on top and a tag
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 9, y - 66); ctx.lineTo(x - 9, y - 74); ctx.lineTo(x + 9, y - 74); ctx.lineTo(x + 9, y - 66); ctx.stroke();
    LostArt.tag(ctx, x + 9, y - 70, t, '#ffd23a', open ? 'IN' : 'ZIP');
    ctx.restore();
  };
}

/* ---------------- the critters ---------------- */
// a runaway suitcase on its wheels: handle up, googly eyes in the front pocket
const caseArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1);
  const bob = m === 'walk' ? Math.abs(Math.sin(t * 10)) * 1.5 : 0, c = SHELL[(e.seed || 0) % 4];
  ctx.translate(0, -bob);
  LostArt.case(ctx, 0, 0, 26, 28, c, m === 'flat' ? 0 : 1, null);
  if (m !== 'flat') {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(2, -17, 4, 0, TAU); ctx.arc(9, -17, 4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(3.5 + Math.sin(t * 3), -17, 1.8, 0, TAU); ctx.arc(10.5 + Math.sin(t * 3), -17, 1.8, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(6, -9, 3, 0.2, Math.PI - 0.2); ctx.stroke();
  }
  ctx.restore();
};
// a coconut crab (the island's own; it lives in lost holdalls): big claws, hops sideways
const crabArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const snap = m === 'hop' ? 0.5 : Math.max(0, Math.sin(t * 6)) * 0.3;
  ctx.strokeStyle = INK; ctx.lineWidth = 2; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * 6, -8); ctx.lineTo(s * (12 + k * 3), -2 + k); ctx.lineTo(s * (14 + k * 3), 0); ctx.stroke(); }
  ctx.fillStyle = '#c8603a'; ctx.beginPath(); ctx.ellipse(0, -11, 13, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8904a'; ctx.beginPath(); ctx.ellipse(-2, -14, 7, 4, 0, 0, TAU); ctx.fill();
  // the claws
  ctx.fillStyle = '#d8703a';
  for (const s of [0, 1]) { ctx.save(); ctx.translate(10 + s * 3, -14 - s * 4); ctx.rotate(-0.4 - snap * (s ? 1 : 0.5)); ctx.beginPath(); ctx.ellipse(6, 0, 7, 4.5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(10, -1); ctx.lineTo(15, -4 - snap * 6); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = INK; ctx.fillRect(4, -24, 2, 6); ctx.fillRect(9, -24, 2, 6);
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(5, -25, 2.4, 0, TAU); ctx.arc(10, -25, 2.4, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(5.5, -25, 1.1, 0, TAU); ctx.arc(10.5, -25, 1.1, 0, TAU); ctx.fill();
  ctx.restore();
};
// a clothes moth with a hole-punched woolly wing and a tiny scarf
const mothArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  const f = Math.sin(t * 16) * 0.5 + 0.5;
  ctx.fillStyle = '#d8c8a8';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-2, -2 + s * 6 * (0.6 + f * 0.4), 12, 7 * (0.6 + f * 0.4), s * 0.3, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#7a6a5a'; ctx.beginPath(); ctx.arc(-6, -4, 1.8, 0, TAU); ctx.arc(2, 4, 1.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8a7a6a'; ctx.beginPath(); ctx.ellipse(2, 0, 9, 4.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e84a4a'; ctx.fillRect(6, -3, 3, 6);
  ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10, -2); ctx.quadraticCurveTo(16, -10, 18, -8); ctx.moveTo(10, 0); ctx.quadraticCurveTo(17, -5, 19, -2); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(10, 0, 1.3, 0, TAU); ctx.fill();
  ctx.restore();
};
const enemies = {
  lostCase: { cls: TourEnemy.make({ w: 26, h: 30, speed: 1.2, behavior: 'charge', range: 7, chargeSpeed: 5, chargeT: 1.2, windup: 0.5, edgeTurn: true, art: caseArt, burst: '#e84a4a' }), place: 'walk' },
  lostCrab: { cls: TourEnemy.make({ w: 28, h: 22, speed: 1.0, behavior: 'hop', hopV: 8, hopEvery: 1.1, art: crabArt, burst: '#c8603a' }), place: 'walk' },
  lostMoth: { cls: TourFlyer.make({ w: 28, h: 20, range: 3, speed: 0.8, swoop: true, art: mothArt, burst: '#d8c8a8' }), place: 'fly' }
};

/* ---------------- the red suitcase (24-1's key) and Customs' shutter ---------------- */
TourMaze.addKeys({
  lostBagRed: { name: 'YOUR RED SUITCASE', toast: 'YOUR RED SUITCASE! SHOW IT AT CUSTOMS', col: '#e84a4a', glow: '#ffd0d0',
    icon: (ctx, x, y, t) => { LostArt.case(ctx, x, y + 12, 22, 22, '#e84a4a', 1, '#ffd23a'); } }
});

/* ---------------- the carousel flap: stand still in front of it and it swallows you (a door that never needs Up) ----
   spawn { type: 'lostFlap', targetRef: 'area@anchor', label }: a portal for the level checker (VALIDATOR_PORTALS),
   in the game a rubber-curtained hatch that pulls in anything standing still in front of it for 0.6 s (or Down). */
VALIDATOR_PORTALS.lostFlap = true;
class LostFlap extends Portal {
  constructor(g, s) { super(g, Object.assign({}, s, { kind: 'door' })); this.still = 0; this.gulp = 0; this.label = String(s.label || '').toUpperCase(); }
  update(dt) { this.t += dt; this.near = false; if (this.gulp > 0) this.gulp -= dt; if (!this.touching) this.still = Math.max(0, this.still - dt * 2); this.touching = false; }
  touchPlayer(p) {
    this.near = true; this.touching = true;
    if (p.dead || p.state !== 'play' || this.g.state !== 'play') return;
    const idle = p.onGround && Math.abs(p.vx) < 0.8 * TS && !Input.left && !Input.right;
    if (idle) this.still += 1 / 120 * 1.0; else this.still = Math.max(0, this.still - 1 / 60);
    if (this.still > 0.6 || (Input.downPressed && p.onGround)) {
      this.still = 0; this.gulp = 0.5;
      this.g.parts.text(this.cx, this.y - 10, 'GULP!', '#ffd23a'); this.g.burst(this.cx, this.y + 20, 10, '#2a2c34', 'dust');
      this.g.enterPortal(this);
    }
  }
  draw(ctx) {
    const x = this.cx, by = this.y + this.h, t = this.t, k = clamp(this.still / 0.6, 0, 1);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the housing: a steel box with a dark mouth and the belt running into it
    ctx.fillStyle = '#9aa0aa'; rr(ctx, x - 26, by - 70, 52, 70, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x - 26, by - 70, 52, 6);
    ctx.fillStyle = '#16121a'; rr(ctx, x - 18, by - 54, 36, 54, 4); ctx.fill();
    // the rubber strips: they sway, and lean in as Brady stands still (the swallow is coming)
    for (let q = 0; q < 6; q++) {
      const sx = x - 16 + q * 6.4, sway = Math.sin(t * 3 + q) * 1.5 + k * 6 * (q < 3 ? 1 : -1) * (0.5 + 0.5 * Math.sin(t * 20)) + (this.gulp > 0 ? Math.sin(t * 40 + q) * 6 : 0);
      ctx.fillStyle = q % 2 ? '#2a2c34' : '#3a3c44'; ctx.beginPath(); ctx.moveTo(sx, by - 54); ctx.lineTo(sx + 6, by - 54); ctx.lineTo(sx + 6 + sway, by - 2); ctx.lineTo(sx + sway, by - 2); ctx.closePath(); ctx.fill();
    }
    // the hazard stripes and the label plate: where it goes
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 26, by - 4, 52, 4); ctx.fillStyle = INK; for (let q = -24; q < 26; q += 8) ctx.fillRect(x + q, by - 4, 4, 4);
    ctx.fillStyle = '#1a1c24'; rr(ctx, x - 30, by - 88, 60, 16, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.font = LostArt.F7; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.label || 'FLAP', x, by - 80, 56);
    if (k > 0.05) { ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * k) + ')'; ctx.font = LostArt.F9; ctx.fillText('...', x, by - 98 - k * 4); }
    ctx.restore();
  }
  get light() { return { r: 50, c: 'rgba(255,220,120,' }; }
}

/* ---------------- the carousel's moving luggage: bags ride the belt (scenery; the belt tiles do the pushing) -------
   spawn { type: 'lostBelt', n: tiles, row offset 0 } at the belt's left end, on the belt's own row */
class LostBelt extends Ent {
  constructor(g, s) {
    super(g, s, (s.n || 8) * TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.n = s.n || 8;
    const A = g.area, tx = Math.floor(s.x / TS), ty = Math.floor(s.y / TS);
    const t = A ? tileAt(A, tx, ty) : T.CONV_R; this.dir = t === T.CONV_L ? -1 : 1;
    this.seed = (tx * 7 + ty * 3) % 8;
  }
  update(dt) { this.t += dt; }
  draw(ctx) {
    const L = this.w, sp = 1.2 * TS * this.dir, x0 = this.x, y = this.y + this.h;
    for (let k = 0; k < 3; k++) {
      let u = ((this.t * sp + k * L / 3) % L + L) % L;
      const bx = x0 + u, c = SHELL[(this.seed + k * 3) % SHELL.length];
      if (k === 1) LostArt.duffel(ctx, bx, y, 30, c); else LostArt.case(ctx, bx, y, 24, 20 + k * 2, c, 0, k === 0 ? '#ffd23a' : null);
    }
  }
}

/* ---------------- the umbrella spring: a big open umbrella over bouncy tiles (hold jump to fly high) ---------------- */
class LostBrolly extends Ent {
  constructor(g, s) { super(g, s, s.w || 96, TS); this.col = s.col || SHELL[Math.floor(s.x / TS) % SHELL.length]; this.squash = 0; }
  update(dt) { this.t += dt; const p = this.g.player; if (p && p.springT > 0 && Math.abs(p.y + p.h - this.y) < 8 && p.cx > this.x && p.cx < this.x + this.w) this.squash = 1; this.squash = Math.max(0, this.squash - dt * 4); }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y + 6 + this.squash * 4, w = this.w / 2 + 4;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = this.col; ctx.beginPath(); ctx.moveTo(x - w, y + 6); ctx.quadraticCurveTo(x, y - 18 + this.squash * 8, x + w, y + 6);
    for (let q = 3; q >= 0; q--) ctx.quadraticCurveTo(x - w + (q + 0.5) * w / 2, y, x - w + q * w / 2, y + 6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = shade(this.col, -0.3); ctx.lineWidth = 1.5; for (let q = 1; q < 4; q++) { ctx.beginPath(); ctx.moveTo(x, y - 12 + this.squash * 6); ctx.lineTo(x - w + q * w / 2, y + 5); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.fillRect(x - 1.5, y - 20 + this.squash * 6, 3, 6);
    ctx.restore();
  }
}

/* ---------------- the x-ray scanner: a gantry whose beam sweeps the tunnel (or stands still under an arch) ----------
   Light-only tiles (hide 3) show only inside a light: the beam is a column of lights (no new objects per frame).
   spawn { type: 'lostScanner', x0, x1 (tiles), period (s), rows (beam height), still } */
class LostScanner extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS);
    this.x0 = (s.x0 != null ? s.x0 : Math.floor(s.x / TS) - 4) * TS + TS / 2; this.x1 = (s.x1 != null ? s.x1 : Math.floor(s.x / TS) + 4) * TS + TS / 2;
    this.period = s.period || 5; this.rows = s.rows || 9; this.still = !!s.still; this.foot = s.foot != null ? s.foot * TS : s.y; this.top = this.foot - this.rows * TS;
    this.bx = this.still ? (this.x0 + this.x1) / 2 : this.x0; this.y = this.top - TS; this.x = this.bx - TS / 2;
    this.lights = [];
    const n = Math.ceil(this.rows * TS / 46) + 1;
    for (let k = 0; k < n; k++) this.lights.push({ x: this.bx, y: this.top + k * 46, r: this.still ? 92 : 78, col: '#3affd8', a: 0.5 });
    (g.lostScanners || (g.lostScanners = [])).push(this);
    this.phase = s.phase || 0;
  }
  update(dt) {
    this.t += dt;
    if (!this.still) { const u = 0.5 - 0.5 * Math.cos((this.t + this.phase) / this.period * TAU); this.bx = lerp(this.x0, this.x1, u); }
    this.x = this.bx - TS / 2;
    for (const L of this.lights) L.x = this.bx;
  }
  // how far a point is inside the beam (0..1): the suitcase door's x-ray look uses it
  beamAt(x, y) { if (y < this.top - TS || y > this.foot + TS) return 0; return clamp(1 - Math.abs(x - this.bx) / (this.still ? 70 : 60), 0, 1); }
  draw(ctx) {
    const bx = this.bx, top = this.top, foot = this.foot, t = this.t, w = this.still ? 64 : 52;
    ctx.save();
    // the rail along the top and the gantry head
    if (!this.still) { ctx.fillStyle = '#3a4250'; ctx.fillRect(this.x0 - 30, top - 26, this.x1 - this.x0 + 60, 8); ctx.fillStyle = '#7a8a9a'; ctx.fillRect(this.x0 - 30, top - 26, this.x1 - this.x0 + 60, 2); }
    ctx.globalAlpha = 0.16 + 0.04 * Math.sin(t * 9); ctx.fillStyle = '#3affd8'; ctx.fillRect(bx - w / 2, top - 12, w, foot - top + 12);
    ctx.globalAlpha = 0.35; ctx.fillRect(bx - 2, top - 12, 4, foot - top + 12);
    ctx.globalAlpha = 0.5; const sy = top + ((t * 140) % (foot - top)); ctx.fillRect(bx - w / 2, sy, w, 3);
    ctx.globalAlpha = 1; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#c8ccd4'; rr(ctx, bx - 22, top - 32, 44, 22, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3affd8'; ctx.fillRect(bx - 16, top - 14, 32, 3);
    ctx.fillStyle = Math.floor(t * 4) % 2 ? '#ff5a6a' : '#5a2a2a'; ctx.beginPath(); ctx.arc(bx + 14, top - 25, 3, 0, TAU); ctx.fill();
    ctx.restore();
  }
}

/* ---------------- the sniffer beagle: Brady's friend in the x-ray tunnel. It trots after him (along the way he went,
   so it never falls), and when it smells a hidden platform ahead it stops, points its nose and barks: the spot lights
   up for a moment. spawn { type: 'lostBeagle' } ---------------- */
class LostBeagle extends Ent {
  constructor(g, s) {
    super(g, s, 30, 24); this.friendly = true; this.isBeagle = true;
    this.trail = new Float32Array(240); this.head = 0; this.count = 0; this.dir = 1; this.wag = 0; this.bark = 0; this.barkCool = 1;
    this.light0 = { x: 0, y: 0, r: 96, col: '#ffe8a0', a: 0.55 }; this.lights = null; this.sniffs = null; this.target = null;
    this.mode = 'sit';
  }
  // the hidden platforms in this area, found once: one spot per run of light-only tiles
  findSniffs() {
    const A = this.g.area, out = []; if (!A || !A.hide) return (this.sniffs = out);
    for (let y = 0; y < A.H; y++) for (let x = 0; x < A.W; x++) {
      if (A.hide[y * A.W + x] !== 3 || (x > 0 && A.hide[y * A.W + x - 1] === 3)) continue;
      let x1 = x; while (x1 + 1 < A.W && A.hide[y * A.W + x1 + 1] === 3) x1++;
      out.push({ x: (x + x1 + 1) / 2 * TS, y: y * TS + TS / 2, told: 0 });
    }
    return (this.sniffs = out);
  }
  update(dt) {
    this.t += dt; if (this.bark > 0) this.bark -= dt; if (this.barkCool > 0) this.barkCool -= dt;
    const p = this.g.player; if (!p) return;
    if (!this.sniffs) this.findSniffs();
    // remember where Brady stood (a ring of 120 spots, one every frame he is on the ground)
    if (p.onGround && !p.dead) {
      const k = this.head * 2; this.trail[k] = p.cx; this.trail[k + 1] = p.y + p.h;
      this.head = (this.head + 1) % 120; this.count = Math.min(120, this.count + 1);
    }
    // a jump far away (a respawn, a door): start again beside him
    if (Math.abs(p.cx - this.cx) > 14 * TS || Math.abs(p.y + p.h - (this.y + this.h)) > 10 * TS) { this.x = p.cx - 40 * (p.facing || 1) - this.w / 2; this.y = p.y + p.h - this.h; this.count = 0; }
    // follow: aim at the spot Brady stood about 0.4 s of standing ago
    let tx = this.cx, ty = this.y + this.h;
    if (this.count > 30) { const k = ((this.head - 30 + 120) % 120) * 2; tx = this.trail[k]; ty = this.trail[k + 1]; }
    const dx = tx - this.cx, close = Math.abs(p.cx - this.cx) < 1.6 * TS;
    if (!close && this.bark <= 0.6 && Math.abs(dx) > 4) { const sp = Math.min(Math.abs(dx), 9 * TS * dt); this.x += Math.sign(dx) * sp; this.dir = Math.sign(dx); this.mode = 'trot'; }
    else this.mode = this.bark > 0 ? 'bark' : 'sit';
    this.y = lerp(this.y, ty - this.h, Math.min(1, dt * 12));
    // sniff: the nearest hidden platform ahead of Brady (within 7 tiles, not told in the last 4 s): point and bark
    if (this.barkCool <= 0) {
      let best = null, bd = 1e9;
      for (const S of this.sniffs) {
        if (this.t - S.told < 4 && S.told) continue;
        const ax = (S.x - p.cx) * (p.facing || 1), d = Math.hypot(S.x - p.cx, S.y - p.cy);
        if (ax > -TS && d < 7 * TS && d < bd) { bd = d; best = S; }
      }
      if (best) {
        best.told = this.t; this.target = best; this.bark = 2.4; this.barkCool = 1.1;
        this.light0.x = best.x; this.light0.y = best.y; this.lights = [this.light0];
        this.dir = best.x > this.cx ? 1 : -1;
        this.g.parts.text(this.cx, this.y - 10, 'WOOF!', '#ffe8a0'); TourKit.sfx('bark', 'bump', { pitch: 1.6, vol: 0.4 });
      }
    }
    if (this.bark <= 0) { this.lights = null; this.target = null; }
    else this.light0.r = 96 * clamp(this.bark / 0.5, 0, 1);
    this.wag += dt * (this.mode === 'bark' ? 30 : this.mode === 'trot' ? 18 : 8);
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, d = this.dir, t = this.t, m = this.mode;
    // the pointer line to what it smelled
    if (this.target && this.bark > 0) {
      ctx.save(); ctx.globalAlpha = clamp(this.bark, 0, 1) * 0.8; ctx.strokeStyle = '#ffe8a0'; ctx.lineWidth = 2; ctx.setLineDash([3, 5]); ctx.lineDashOffset = -t * 30;
      ctx.beginPath(); ctx.moveTo(x + d * 14, y - 18); ctx.lineTo(this.target.x, this.target.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#ffe8a0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(this.target.x, this.target.y, 20 + Math.sin(t * 10) * 3, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    LostArt.beagle(ctx, x, y, d, m, t, this.wag);
  }
}

/* ---------------- 24-3's secret: a giant suitcase whose zip door shows only in the x-ray beam ----------------
   look 'lostXrayDoor': drawn as a faint outline, clear and glowing while a scanner's beam is over it */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look !== 'lostXrayDoor') return dr0.call(this, ctx, x, y, look, t, near);
    const g = Game.scene, S = g && g.lostScanners;
    let k = near ? 0.6 : 0;
    if (S) for (const s of S) k = Math.max(k, s.beamAt(x, y - 30));
    ctx.save();
    ctx.globalAlpha = 0.15 + 0.85 * k; ctx.strokeStyle = '#3affd8'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(58,255,216,0.12)';
    rr(ctx, x - 18, y - 56, 36, 54, 8); ctx.fill(); ctx.stroke();
    ctx.setLineDash([2, 3]); rr(ctx, x - 12, y - 50, 24, 44, 6); ctx.stroke(); ctx.setLineDash([]);
    if (k > 0.3) { ctx.fillStyle = '#3affd8'; ctx.font = LostArt.F7; ctx.textAlign = 'center'; ctx.fillText('A DOOR?', x, y - 62); }
    ctx.restore();
  };
}

/* ---------------- the Lost & Found office's shell game: suitcases for cups, the beagle deals ---------------- */
if (typeof TourRoomCritters !== 'undefined') {
  TourRoomCritters.CUPS.lostCase = { body: '#e84a4a', band: '#ffd23a', w: 30, h: 30 };
  TourRoomCritters.dealers.lostBeagle = (ctx, x, y, t) => { ctx.save(); ctx.translate(x, y); ctx.scale(1.3, 1.3); LostArt.beagle(ctx, 0, 0, -1, Math.sin(t * 0.7) > 0.6 ? 'bark' : 'sit', t, t * 8); ctx.restore(); };
}

/* ---------------- pieces ---------------- */
const pieces = {
  arena_laundry: (st, o) => arenaPieces.arena_laundry(st, o),
  // Customs' shutter: opens with the red suitcase
  bagLock: TourMaze.lock('mazeShutter', { need: 'CUSTOMS: SHOW YOUR SUITCASE FIRST' }),
  // an open umbrella over bouncy tiles: { w: 3 } on the row of the stamp letter
  brolly(st, o) { const w = o.w || 3, y = st.gy - 1; for (let k = 0; k < w; k++) { st.B.set(st.x + k, y, T.GROUND); st.B.setSurf(st.x + k, y, SURF.BOUNCE); } st.B.spawn('lostBrolly', st.x, y, { w: w * TS }).x = st.x * TS + w * TS / 2; return st.x; }
};

/* ---------------- the boss: THE SOCK HYDRA ----------------
   In the lost-property warehouse, the heap of every odd sock the world ever lost has come alive: sock heads on long
   sock necks. Stomp a head (only while it hangs dizzy after a pounce) and it pops off as a LOOSE SOCK, and the heap
   grows its twin right back, plus a new head. The only way to beat it: pair the socks up. Kick (or stomp-launch) a
   loose sock into the heap: if a head is the same sock (colour AND pattern), the two pair up and roll away for good.
   Five pairs and the heap folds itself up neatly. */
const K = TourKit;
const lintArt = (ctx, s, t) => {
  const x = s.x + s.w / 2, y = s.y + s.h / 2;
  ctx.save(); ctx.fillStyle = '#c8c0d8'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath();
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + t * 3, r = k % 2 ? 7 : 10; k ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
};
const sparkArt = (ctx, s, t) => {
  const x = s.x + s.w / 2, y = s.y + s.h / 2;
  ctx.save(); ctx.strokeStyle = '#fff6a0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 7, y - 6); ctx.lineTo(x + 2, y - 1); ctx.lineTo(x - 3, y + 2); ctx.lineTo(x + 7, y + 7); ctx.stroke();
  ctx.strokeStyle = '#7ac8ff'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
};
const thumpArt = (ctx, s, t) => {
  const x = s.x + s.w / 2, y = s.y + s.h, d = s.vx > 0 ? 1 : -1;
  ctx.save(); ctx.fillStyle = '#e8e0d0'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x - d * k * 8, y - 8 - k * 2, 8 - k * 2, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
// a loose sock: kick it (or stomp it to launch it) into the heap; the boss pairs it with a matching head
class LostSock extends TourProp {
  constructor(g, s) {
    super(g, s, { w: 28, h: 20, kick: 11, bounce: 0.5, friction: 3.2, hp: 0, roll: false, art: (ctx, e, x, y, t) => LostArt.sock(ctx, x - 2, y - 9, e.sock, e.vx ? Math.sin(t * 12) * 0.4 + 1.4 : 1.45, 1.35), burst: '#ffffff' });
    this.sock = s.sock || 0; this.isSock = true; this.noMatch = 0;
  }
  update(dt) { if (this.noMatch > 0) this.noMatch -= dt; super.update(dt); }
  inkKey() { return this.vx ? null : 'sock' + this.sock; }
  get light() { return { r: 46, c: 'rgba(255,240,200,' }; }
}
const HYDRA = { HP: 5, MAXH: 4 };
const hydraSays = ['WHERE ARE MY OTHER HALVES?', 'ODD ONE OUT!', 'NO PAIRS ALLOWED!', 'WE ARE ALL SINGLE!'];
const boss = {
  id: 'lost_hydra', name: 'The Sock Hydra', hp: HYDRA.HP, dims: [150, 116], music: 'tour_ma_boss', country: 'lost',
  brain: {
    phases: [3],
    guardText: 'TOO WIGGLY!',
    noDisc(b) { return true; },
    wake(b) {
      b.phase = 1; b.heads = []; b.nextCol = 0; b.popped = 0;
      for (let k = 0; k < 3; k++) this.grow(b, k);
      K.say(b.g, b, 'ODD SOCKS UNITE!', '#ffe8a0');
      // one loose sock already lies in the arena: the first match
      this.drop(b, b.heads[0].col, b.arenaX0 + 5 * TS, b.floorY - 4, 0, 0);
      b.g.toast('KICK A LOOSE SOCK INTO ITS TWIN!');
    },
    // a new head of colour col (default: the next colour round)
    grow(b, col) {
      if (col == null) { col = b.nextCol % LOST_SOCKS.length; b.nextCol++; }
      else b.nextCol = Math.max(b.nextCol, col + 1);
      b.heads.push({ col, grow: 0, sway: Math.random() * 6, pair: 0 });
    },
    drop(b, col, x, y, vx, vy) {
      const s = new LostSock(b.g, { x, y, sock: col }); s.fling(vx || 0, vy || 0, null); b.g.spawn(s); return s;
    },
    // where head k sits (its mouth), in world coordinates: spread across the heap's top
    headPos(b, k, n) {
      const H = b.heads[k], u = n <= 1 ? 0.5 : k / (n - 1), sway = Math.sin(b.t * 2.2 + H.sway) * 6;
      const lunge = b.act === 'pounce' && k === b.pk && b.pounceAir ? 0 : 0;
      return { x: b.x + 24 + u * (b.w - 48) + sway, y: b.y + 18 + (k % 2) * 8 + lunge };
    },
    hit(b, kind, src) {
      if (b.act === 'exit') return false;
      if (kind === 'prop' && src && src.isSock) {
        const k = b.heads.findIndex(H => H.col === src.sock && !H.pair);
        if (k >= 0) {
          b.heads[k].pair = 0.001; src.remove = true;
          b.g.burst(src.cx, src.cy, 16, LOST_SOCKS[src.sock].body, 'confetti');
          b.damage(1, { text: 'PAIRED!', col: '#ffe8a0' });
          return true;
        }
        if (src.noMatch <= 0) { src.noMatch = 0.8; b.g.parts.text(b.cx, b.y - 10, 'NOT A MATCH!', '#ff9a9a'); Sound.play('bump', { vol: 0.5 }); }
        src.vx = -Math.sign(src.vx || b.dir) * 5 * TS; src.vy = -7 * TS;
        return false;
      }
      if (kind === 'stomp' || kind === 'spin') {
        if (b.vuln && b.droop != null && b.heads[b.droop]) {
          // the dizzy head pops off: a loose sock flies out; its twin grows back, and the heap grows one more head
          const H = b.heads[b.droop];
          this.drop(b, H.col, b.x - 10, b.y + 40, -6 * TS, -9 * TS);
          H.grow = 0; H.pair = 0;
          b.popped++;
          if (b.heads.length < HYDRA.MAXH && b.heads.length < b.hp + 1) this.grow(b);
          b.vuln = false; b.droop = null;
          K.say(b.g, b, 'POP! ...IT GREW ANOTHER!', '#ffe8a0'); Sound.play('stomp', { pitch: 0.8 }); b.g.shake(4);
          b.go('regrow');
          return 'bounce';
        }
        return 'bounce';
      }
      return undefined;
    },
    touch(b, p) { return b.act === 'exit'; },
    phase(b, n) {
      if (n === 2) { b.hurtT = 1.2; K.say(b.g, b, 'STATIC CLING!!', '#7ac8ff'); b.g.bannerText = 'FRESH OUT OF THE DRYER!'; b.g.bannerT = 2; b.go('static'); }
    },
    hurt(b) { K.say(b.g, b, ['A PAIR! NOOO!', 'MATCHED UP!', 'NOT MY TWIN!'][Math.floor(b.t * 7) % 3], '#ffe8a0'); b.go('reel'); },
    lastHit(b) { if (b.act !== 'exit') { b.vuln = false; b.go('exit'); } return true; },
    update(b, dt) {
      const g = b.g, p = g.player, first = b.first, ph = b.phase || 1;
      if (!b.heads) this.wake(b);
      b.guard = 'bounce';
      // the heads: grow in, paired ones roll away; never more heads than pairs left (a test's direct hit counts too)
      for (let k = b.heads.length - 1; k >= 0; k--) { const H = b.heads[k]; H.grow = Math.min(1, H.grow + dt * 1.5); if (H.pair > 0) { H.pair += dt; if (H.pair > 0.7) { b.heads.splice(k, 1); if (b.droop === k) b.droop = null; else if (b.droop > k) b.droop--; } } }
      const live = b.heads.filter(H => !H.pair).length;
      if (b.act !== 'exit' && b.hp > 0.01) {
        if (live > Math.ceil(b.hp)) { for (let k = b.heads.length - 1; k >= 0; k--) if (!b.heads[k].pair && b.heads.filter(H => !H.pair).length > Math.ceil(b.hp)) { b.heads.splice(k, 1); if (b.droop === k) b.droop = null; } }
        if (!b.heads.filter(H => !H.pair).length && !b.heads.length) this.grow(b);
        // a loose sock with no twin left: the heap grows its twin (the fight can always be won)
        if (b.at > 0.5 && Math.floor(b.t * 2) !== Math.floor((b.t - dt) * 2)) {
          for (const e of g.entities) if (e.isSock && !e.remove && !b.heads.some(H => H.col === e.sock && !H.pair)) { if (b.heads.length < HYDRA.MAXH) { this.grow(b, e.sock); K.say(g, b, 'ANOTHER HEAD!', '#ffe8a0'); } break; }
        }
        // a loose sock that rolled under the heap pops back out in front of it
        for (const e of g.entities) if (e.isSock && !e.remove && !e.moving && overlap(e, b)) { e.x = b.x - e.w - 6; e.vy = -5 * TS; e.vx = -2 * TS; }
      }
      const mid = (b.arenaX0 + b.arenaX1) / 2;
      if (b.act === 'walk') {
        b.face(); b.pose = 'walk';
        // it shuffles about the right half of the arena, so there is always room to kick a sock in
        b.vx = (b.cx < mid + 2 * TS ? 1 : b.cx > b.arenaX1 - 3 * TS ? -1 : b.dir) * 0.7 * TS * b.aggression;
        if (b.at > (ph >= 2 ? 1.1 : 1.6)) { b.cycle++; const seq = ph >= 2 ? ['spit', 'pounce', 'static', 'spit', 'pounce'] : ['spit', 'pounce', 'spit', 'pounce']; b.go(seq[b.cycle % seq.length]); }
      } else if (b.act === 'spit') {
        b.vx = 0; b.pose = 'spit';
        if (first) { b.face(); b.shots = 0; b.sk = b.heads.length ? b.cycle % b.heads.length : 0; K.say(g, b, hydraSays[b.cycle % hydraSays.length], '#ffe8a0'); }
        const n = ph >= 2 ? 3 : 2;
        if (b.shots < n && b.at > 0.5 + b.shots * 0.4 && b.heads[b.sk]) {
          b.shots++; const P = this.headPos(b, b.sk, b.heads.length), dx = p ? clamp(p.cx - P.x, -10 * TS, -2 * TS) : -5 * TS;
          tourFire(g, P.x, P.y, { vx: dx / 1.0, vy: -9 * TS, grav: PHYS.gDown * 0.4, w: 18, h: 18, life: 3, thru: true, col: '#c8c0d8', art: lintArt });
          Sound.play('pop', { vol: 0.4 });
        }
        if (b.at > 0.7 + n * 0.4) b.go('walk');
      } else if (b.act === 'pounce') {
        // the heap gathers itself, leaps at Brady and lands with a thump (waves of fluff both ways); one head hangs
        // dizzy after: that is the moment to stomp it
        if (first) { b.face(); b.vx = 0; b.leapt = false; b.pk = b.heads.length ? (b.cycle * 3) % b.heads.length : 0; }
        b.pose = b.leapt ? 'air' : 'crouch';
        if (!b.leapt && b.at > 0.5) { b.leapt = true; b.vy = -11 * TS; const dx = p ? clamp(p.cx - b.cx, -6 * TS, 6 * TS) : 0; b.vx = dx / 0.85; }
        if (b.leapt && b.onGround && b.at > 0.65) {
          b.vx = 0; g.shake(6); g.burst(b.cx, b.floorY, 16, '#e8e0d0', 'dust'); Sound.play('stomp', { pitch: 0.6 });
          for (const d of [-1, 1]) tourFire(g, b.cx + d * (b.w / 2 + 6), b.floorY - 18, { vx: d * 6 * TS, vy: 0, w: 22, h: 18, life: 2.2, thru: true, col: '#e8e0d0', art: thumpArt });
          b.go('dizzy');
        }
      } else if (b.act === 'dizzy') {
        b.vx = 0; b.pose = 'dizzy';
        if (first) { b.droop = b.heads.length ? Math.min(b.pk || 0, b.heads.length - 1) : null; }
        b.vuln = b.droop != null && b.at > 0.2 && b.at < (ph >= 2 ? 2.0 : 2.6);
        if (b.at > (ph >= 2 ? 2.2 : 2.8)) { b.droop = null; b.go('walk'); }
      } else if (b.act === 'static') {
        b.vx = 0; b.pose = 'static';
        if (first) { b.shots = 0; Sound.play('laser', { vol: 0.3, pitch: 1.4 }); }
        if (b.shots < 4 && b.at > 0.3 + b.shots * 0.3) { b.shots++; const d = b.shots % 2 ? -1 : 1; tourFire(g, b.cx + d * 20, b.y + 10, { vx: d * (2 + b.shots) * TS * 0.8 - 2 * TS, vy: -10 * TS, grav: PHYS.gDown * 0.45, w: 16, h: 16, life: 3, thru: true, col: '#fff6a0', art: sparkArt }); }
        if (b.at > 1.7) b.go('walk');
      } else if (b.act === 'regrow') {
        b.vx = 0; b.pose = 'regrow'; if (b.at > 1.0) b.go('walk');
      } else if (b.act === 'reel') {
        b.pose = 'reel'; b.vx = 0; if (b.at > 0.9) b.go('walk');
      } else if (b.act === 'exit') {
        b.vx = 0; b.pose = 'exit';
        if (first) { K.say(g, b, 'ALL... PAIRED... UP...', '#ffe8a0'); Sound.play('bossDie'); }
        if (Math.random() < 0.25) g.burst(b.cx + (Math.random() - 0.5) * 100, b.y + 40, 3, LOST_SOCKS[Math.floor(Math.random() * 4)].body, 'confetti');
        if (b.at > 3) b.die();
      } else b.go('walk');
      b.fall(dt);
    },
    draw(b, ctx, t) {
      const x = b.x, w = b.w, by = b.y + b.h, P = b.pose, fold = P === 'exit' ? clamp(b.at / 2.5, 0, 1) : 0;
      ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      const squash = P === 'crouch' ? 0.85 : P === 'air' ? 1.08 : 1, top = by - 56 * squash;
      // the necks and heads (behind the heap's front)
      const n = b.heads ? b.heads.length : 0;
      for (let k = 0; k < n; k++) {
        const H = b.heads[k], S = LOST_SOCKS[H.col], hp = this.headPos(b, k, n), gk = H.grow * (1 - clamp(H.pair / 0.6, 0, 1)) * (1 - fold);
        if (gk <= 0.02) continue;
        const droop = b.droop === k && P === 'dizzy', baseX = x + 30 + (k / Math.max(1, n - 1)) * (w - 60), baseY = top + 14;
        const hx = lerp(baseX, droop ? hp.x - b.dir * 26 : hp.x, gk), hy = lerp(baseY, droop ? by - 30 : hp.y, gk);
        // the neck: a long sock leg, its pattern along it
        ctx.strokeStyle = INK; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(baseX, baseY); ctx.quadraticCurveTo(baseX, (baseY + hy) / 2 - 10, hx, hy); ctx.stroke();
        ctx.strokeStyle = S.body; ctx.lineWidth = 11; ctx.stroke();
        ctx.strokeStyle = S.mark; ctx.lineWidth = 3; ctx.setLineDash(S.pat === 'stripes' ? [3, 5] : [1.5, 6]); ctx.stroke(); ctx.setLineDash([]);
        // the head: a sock-puppet head with button eyes and a stitched mouth (open when it spits)
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(droop ? b.dir * 0.9 : Math.sin(t * 3 + H.sway) * 0.15); ctx.scale(gk, gk);
        ctx.fillStyle = S.body; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 15, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 15, 12, 0, 0, TAU); ctx.clip(); LostArt.pattern(ctx, S, -14, -12, 28, 22); ctx.restore();
        ctx.fillStyle = S.cuff; ctx.fillRect(-6, -14, 12, 4);
        const mouth = (P === 'spit' && b.sk === k) ? 5 : 1.5;
        ctx.fillStyle = '#5a1a2a'; ctx.beginPath(); ctx.ellipse(-b.dir * 7, 5, 6, mouth, 0, 0, TAU); ctx.fill(); ctx.stroke();
        if (droop) { K.dizzy(ctx, 0, -18, t); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; for (const ex of [-5, 3]) { ctx.beginPath(); ctx.moveTo(ex - 2, -5); ctx.lineTo(ex + 2, -1); ctx.moveTo(ex + 2, -5); ctx.lineTo(ex - 2, -1); ctx.stroke(); } }
        else { ctx.fillStyle = '#f2ece0'; for (const ex of [-6, 2]) { ctx.beginPath(); ctx.arc(ex - b.dir * 2, -3, 3.4, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.fillStyle = INK; for (const ex of [-6, 2]) { ctx.beginPath(); ctx.arc(ex - b.dir * 3, -3, 1.4, 0, TAU); ctx.fill(); } }
        ctx.restore();
      }
      // the heap: a mound of odd socks, every one a different kind
      ctx.save(); ctx.translate(x + w / 2, by); ctx.scale(1, squash * (1 - fold * 0.45));
      ctx.fillStyle = '#6a5a7a'; ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(-w / 2 + 6, -46, -20, -56); ctx.quadraticCurveTo(0, -62, 22, -56); ctx.quadraticCurveTo(w / 2 - 4, -46, w / 2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      for (let k = 0; k < LOST_HEAP.length; k++) { const q = LOST_HEAP[k]; LostArt.sock(ctx, q[0], q[1], q[2], q[3] + Math.sin(t * 2 + k) * 0.05, 1.3); }
      ctx.restore();
      if (P === 'static') { ctx.strokeStyle = '#fff6a0'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { const a = t * 9 + k * 1.6, r = 50 + 8 * Math.sin(t * 20 + k); ctx.beginPath(); ctx.moveTo(x + w / 2 + Math.cos(a) * r, by - 40 + Math.sin(a) * r * 0.5); ctx.lineTo(x + w / 2 + Math.cos(a + 0.3) * (r + 10), by - 40 + Math.sin(a + 0.3) * r * 0.5); ctx.stroke(); } }
      if (P === 'exit') { ctx.fillStyle = '#ffe8a0'; ctx.font = LostArt.F11; ctx.textAlign = 'center'; ctx.fillText('♥', x + w / 2 + Math.sin(t * 4) * 10, by - 70 - b.at * 10); }
      ctx.restore();
    }
  }
};
// the socks of the heap: [x, y, kind, angle] round the mound (made once)
const LOST_HEAP = [];
{ let s = 7; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; for (let k = 0; k < 22; k++) { const u = r() * 2 - 1, v = r(); LOST_HEAP.push([u * 62 * (1 - v * 0.4), -6 - v * 46, k % 4, r() * TAU]); } }
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.lost_hydra = [40, 40, 20, 4];
// the arena: the warehouse floor with two laundry carts as ledges and a washing line
const arenaPieces = {
  arena_laundry(st, o) {
    const B = st.B, { x0, w, GY } = o;
    for (let q = 0; q < 3; q++) { B.set(x0 + 3 + q, GY - 4, T.SEMI); }
    B.decorAt('lostBin', x0 + 1, GY, 3); B.decorAt('lostShelf', x0 + w - 3, GY, 5);
    B.decorAt('lostSockPile', x0 + 8, GY, 6);
  }
};

/* ---------------- the route map: a suitcase in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
  ctx.fillStyle = '#ffd23a'; rr(ctx, x - r * 0.75, y - r * 0.45, r * 1.5, r * 1.05, r * 0.2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - r * 0.3, y - r * 0.45); ctx.lineTo(x - r * 0.3, y - r * 0.75); ctx.lineTo(x + r * 0.3, y - r * 0.75); ctx.lineTo(x + r * 0.3, y - r * 0.45); ctx.stroke();
  ctx.fillStyle = '#ff7a3a'; ctx.fillRect(x - r * 0.75, y, r * 1.5, r * 0.15);
  ctx.restore();
};

/* ---------------- the overworld's airport sprites ---------------- */
Object.assign(TourOWPaint.art, {
  ctower(c, r) { c.fillStyle = '#c8ccd4'; c.fillRect(-r * 0.15, -r * 1.6, r * 0.3, r * 1.6); c.strokeRect(-r * 0.15, -r * 1.6, r * 0.3, r * 1.6); this.P(c, [[-r * 0.45, -r * 1.6], [r * 0.45, -r * 1.6], [r * 0.35, -r * 2.0], [-r * 0.35, -r * 2.0]], '#9ae8f4'); c.fillStyle = '#ff5a5a'; c.beginPath(); c.arc(0, -r * 2.15, 2.5, 0, TAU); c.fill(); },
  terminal(c, r) { this.P(c, [[-r * 1.6, 0], [-r * 1.6, -r * 0.7], [-r * 0.6, -r * 0.85], [r * 0.4, -r * 0.7], [r * 1.6, -r * 0.85], [r * 1.6, 0]], '#e8ecf2'); c.fillStyle = '#7ad0e8'; c.fillRect(-r * 1.4, -r * 0.55, r * 2.8, r * 0.3); c.fillStyle = '#ff7a3a'; c.fillRect(-r * 1.6, -r * 0.12, r * 3.2, r * 0.12); },
  carousel(c, r) { c.fillStyle = '#5a606c'; c.beginPath(); c.ellipse(0, -r * 0.3, r, r * 0.45, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#2a2c34'; c.beginPath(); c.ellipse(0, -r * 0.3, r * 0.6, r * 0.22, 0, 0, TAU); c.fill(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.fillStyle = SHELL[k % SHELL.length]; c.fillRect(Math.cos(a) * r * 0.8 - 3, -r * 0.3 + Math.sin(a) * r * 0.36 - 4, 6, 5); } },
  warehouse(c, r) { this.P(c, [[-r * 1.2, 0], [-r * 1.2, -r * 0.8], [0, -r * 1.2], [r * 1.2, -r * 0.8], [r * 1.2, 0]], '#c8a070'); c.fillStyle = '#5a4a3a'; c.fillRect(-r * 0.35, -r * 0.55, r * 0.7, r * 0.55); c.fillStyle = '#ffd23a'; c.fillRect(-r * 0.9, -r * 0.7, r * 0.4, r * 0.18); },
  pile(c, r) { for (let k = 0; k < 7; k++) { const a = (k % 3) - 1, row = Math.floor(k / 3); c.fillStyle = SHELL[k % SHELL.length]; c.fillRect(a * r * 0.5 - r * 0.25 + row * 3, -r * 0.35 - row * r * 0.32, r * 0.48, r * 0.3); c.strokeRect(a * r * 0.5 - r * 0.25 + row * 3, -r * 0.35 - row * r * 0.32, r * 0.48, r * 0.3); } },
  jet(c, r) { c.fillStyle = '#f4f6fa'; c.beginPath(); c.ellipse(0, -r * 0.3, r, r * 0.18, 0, 0, TAU); c.fill(); c.stroke(); this.P(c, [[-r * 0.1, -r * 0.3], [r * 0.25, -r * 0.3], [-r * 0.2, r * 0.35], [-r * 0.45, r * 0.35]], '#dfe4ec'); this.P(c, [[r * 0.7, -r * 0.35], [r * 0.95, -r * 0.8], [r * 1.05, -r * 0.8], [r * 0.95, -r * 0.3]], '#dfe4ec'); c.fillStyle = COL.b; c.fillRect(-r * 0.8, -r * 0.32, r * 1.6, 2); }
});

TourLandscape.looks.lost = ['#bfeaf4', '#2ab8c8', '#8ab8b0', '#9ad07a', '#d8eca0', '#f8eccc', 'palm'];
Tour.country({
  id: 'lost', secret: true, bonus: true, colors: COL, tagline: 'A bonus land: where every lost bag in the world ends up',
  themes, painters, dyn, decor, enemies, pieces, boss,
  entities: { lostFlap: LostFlap, lostBelt: LostBelt, lostBrolly: LostBrolly, lostScanner: LostScanner, lostBeagle: LostBeagle, lostSock: LostSock },
  music: { level: 'tour_nl_rush', boss: 'tour_ma_boss', map: null },
  landmark: 'the control tower', emblem,
  arrival: 'Brady! An island made of lost luggage. If you find my pink sock, it\'s mine. ♥ C',
  levels: []
});

/* ================= RULE 12 across the whole game (SECRETS_WARPS_SWITCHES.md §4.3, B4) =================
   Once Piwi's Rule 12 (NO RETURNS) is revoked:
   - every land's map has a lost suitcase with a luggage tag by its airstrip: tap it (once per land) and it pops open
     with a free random Backpack item (saved in tour.luggage[cc]);
   - every Souvenir Stand gets a fourth shelf of RETURNED goods (one more item, cheap, a cardboard box behind it).
   Both by wrapping from this file: the map's owDraw / owTap hooks, and a subclass of the Souvenir Stand counter. */
const LostLuggage = {
  STOCK: ['mushroom', 'plane', 'hat', 'magnet', 'star', 'fins', 'kazoo', 'oneup'],
  on() { return typeof TourRules !== 'undefined' && TourRules.isRevoked(12); },
  data() { const T = TourProgress.data(); if (!T.luggage || typeof T.luggage !== 'object') T.luggage = {}; return T.luggage; },
  opened(cc) { return !!this.data()[cc]; },
  // where the suitcase stands on a land's map: beside the airstrip
  at(ow) { const p = ow.G && ow.G.pos && ow.G.pos.start; return p ? { x: p.x + 34, y: p.y + 4 } : null; },
  pick(cc) { const s = hashStr('luggage:' + cc + ':' + Object.keys(Save.data.done || {}).length); return this.STOCK[Math.abs(s) % this.STOCK.length]; },
  // tap: open it (once per land); the item goes in the Backpack (or waits, if the Backpack is full)
  open(ow) {
    const cc = ow.cc;
    if (this.opened(cc)) return false;
    if (Save.data.pack) { ow.scene.toast('YOUR BACKPACK IS FULL: USE WHAT\'S IN IT FIRST'); Sound.play('bump', { vol: 0.4 }); return true; }
    const kind = this.pick(cc);
    this.data()[cc] = kind; Save.data.pack = kind; Save.save();
    ow.luggageFx = { t: 0, kind };
    ow.scene.toast('A LOST SUITCASE! FINDERS KEEPERS: ' + LostLuggage.NAMES[kind] + ' INTO THE BACKPACK');
    TourKit.sfx('reveal', 'oneup');
    return true;
  },
  NAMES: { mushroom: 'A MUSHROOM', plane: 'A PAPER PLANE', hat: 'A HARD HAT', magnet: 'A MAGNET', star: 'A STAR', fins: 'FLIPPER FINS', kazoo: 'A KAZOO', oneup: 'A 1-UP' }
};
TourHooks.on('owDraw', (ow, ctx) => {
  if (!LostLuggage.on() || !ow.by || !ow.by.start || !ow.by.start.visible) return;
  const P = LostLuggage.at(ow); if (!P) return;
  const t = ow.t || 0, done = LostLuggage.opened(ow.cc), F = ow.luggageFx;
  if (F) { F.t += 1 / 60; if (F.t > 2.4) ow.luggageFx = null; }
  ctx.save(); ctx.translate(P.x, P.y);
  if (!done) { ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 4); ctx.fillStyle = '#fff4a0'; ctx.beginPath(); ctx.ellipse(0, -8, 20, 14, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  // the suitcase: shut (bobbing a little, a sparkle) or open with its lid up
  const bob = done ? 0 : Math.abs(Math.sin(t * 3)) * -2;
  ctx.translate(0, bob);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillStyle = '#e84a4a';
  if (done) { rr(ctx, -10, -9, 20, 9, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c83a3a'; ctx.beginPath(); ctx.moveTo(-10, -9); ctx.lineTo(-12, -20); ctx.lineTo(8, -20); ctx.lineTo(10, -9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9a4a72'; ctx.fillRect(-8, -8, 16, 4); }
  else { rr(ctx, -11, -15, 22, 15, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c83a3a'; ctx.fillRect(-11, -9, 22, 2); ctx.beginPath(); ctx.moveTo(-4, -15); ctx.lineTo(-4, -19); ctx.lineTo(4, -19); ctx.lineTo(4, -15); ctx.stroke(); LostArt.tag(ctx, 9, -14, t, '#ffd23a', null); }
  if (!done && Math.floor(t * 2) % 3 === 0) { ctx.fillStyle = '#ffffff'; ctx.font = LostArt.F9; ctx.textAlign = 'center'; ctx.fillText('✦', -12 + (Math.floor(t * 2) % 2) * 22, -20); }
  if (F) { const k = clamp(F.t / 0.8, 0, 1); ctx.globalAlpha = 1 - clamp((F.t - 1.6) / 0.8, 0, 1); ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, -22 - k * 26, 9, 0, TAU); ctx.fill(); ctx.stroke(); if (typeof TourItemArt !== 'undefined') { ctx.save(); ctx.translate(0, -22 - k * 26); ctx.scale(0.6, 0.6); TourItemArt.draw(ctx, F.kind, 0, 0, t, null); ctx.restore(); } }
  ctx.restore();
});
TourHooks.on('owTap', (ow, tap) => {
  if (!LostLuggage.on() || LostLuggage.opened(ow.cc) || !ow.by || !ow.by.start || !ow.by.start.visible) return false;
  const P = LostLuggage.at(ow); if (!P) return false;
  const m = ow.toMap(tap.x, tap.y);
  if (Math.hypot(m.x - P.x, m.y - (P.y - 8)) > Math.max(20, 26 / (ow.z || 1))) return false;
  return LostLuggage.open(ow);
});
// the Souvenir Stand: a fourth shelf of returned goods
{
  const Base = ENTITY_TYPES.souvenirShop;
  if (Base) {
    class LostReturnsShop extends Base {
      constructor(g, s) {
        super(g, s);
        if (!LostLuggage.on() || !this.items) return;
        const have = new Set(this.items.map(it => it.kind)), pool = LostLuggage.STOCK.filter(k => !have.has(k));
        if (!pool.length) return;
        const r = Math.abs(hashStr('returns:' + g.id + ':' + Object.keys((Save.data && Save.data.done) || {}).length));
        this.items.push({ kind: pool[r % pool.length], price: 20, sold: false, returned: true });
        // the counter grows by three tiles (kept centred) for the extra shelf
        this.x -= 1.5 * TS; this.w += 3 * TS;
      }
      draw(ctx) {
        const k = this.items.findIndex(it => it.returned);
        if (k >= 0 && !this.items[k].sold) {
          // the cardboard RETURNS box behind the fourth item
          const x = this.slotX(k), y = this.y + this.h;
          ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#c8a070'; ctx.fillRect(x - 18, y - 62, 36, 28); ctx.strokeRect(x - 18, y - 62, 36, 28);
          ctx.fillStyle = '#a07a4a'; ctx.beginPath(); ctx.moveTo(x - 18, y - 62); ctx.lineTo(x - 24, y - 70); ctx.lineTo(x - 8, y - 70); ctx.lineTo(x - 2, y - 62); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.restore();
        }
        super.draw(ctx);
        if (k >= 0) { const x = this.slotX(k), y = this.y + this.h - 82; ctx.save(); ctx.fillStyle = '#ffd23a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; rr(ctx, x - 26, y - 8, 52, 14, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.font = LostArt.F7; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('RETURNED', x, y, 48); ctx.restore(); }
      }
    }
    ENTITY_TYPES.souvenirShop = LostReturnsShop;
  }
}
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; Object.assign(window.BRADY_TOUR, { LostLuggage, LostArt, LOST_SOCKS }); } } catch (e) { /* not in a browser */ }
globalThis.LostLuggage = LostLuggage; globalThis.LOST_SOCKS = LOST_SOCKS;
})();
