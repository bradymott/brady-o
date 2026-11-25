/* ============================================================
   ITALY (world 14, cc 'it'): the first land of the Encore Tour (docs/design/ENCORE_TOUR.md §4). Cobbles, kitchens,
   opera. The shrunk scenery is the leaning tower (Piwi "fixed" the lean; it pops back crooked). The act nobody
   cancelled: Il Polpettone, a giant operatic meatball tenor.
   Humour from food, objects and animals only: pasta, pizza, espresso, pigeons, alley cats, scooters with no brand.
   Sacred buildings appear only as plain distant silhouettes, never as places to play. The leaning tower is a bell
   tower used as a comic landmark: inside it is a plain stone stair tower with barrels, crates and bells.
   This file: the looks (tiles, themes, painted backdrops, props), the critters, the route-map emblem, the map's
   painters and the music. The moving parts of each level type: 29_tour_it_mech.js. The boss: 29_tour_it_boss.js.
   The levels and the land's map layout: 29_tour_it_levels.js.
   ============================================================ */
(function () {
const COL = { a: '#e0502e', b: '#3a8a5a', c: '#ffd24a' };
const INK = '#1a1426';
const TERRA = '#d8693a', OCHRE = '#e8b04a', CREAM = '#f4e4c4', SHUTTER = '#3a8a5a', TOMATO = '#e83a2a', BASIL = '#4aa84a', CYPRESS = '#2a5a3a';
const K = TourKit;

/* ---------------- tiles ---------------- */
// the cobbled alley: grey-brown cobbles under a pale travertine kerb; terracotta roof edges as one-ways; market crates
// as bricks; travertine blocks
const cobble = {
  style: 'cobble', cap: '#d8ccb0', capHi: '#f2e8d0', dirt: '#8a7a6a', dirt2: '#6a5a4c', rock: '#7a6a5c',
  paint(ctx, rng) {
    ctx.fillStyle = '#7a6a5a'; ctx.fillRect(0, 0, TS, TS);
    for (let k = 0; k < 5; k++) {
      const x = (k % 3) * 11 + (k > 2 ? 6 : 0) + rng() * 3, y = (k > 2 ? 17 : 3) + rng() * 3;
      ctx.fillStyle = ['#9a8a78', '#8a7c6c', '#a8988a'][k % 3]; rr(ctx, x, y, 11, 11, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 2, y + 2, 5, 2);
    }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#6a5a4c'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = '#d8ccb0'; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = '#f4ecd8'; ctx.fillRect(x0, 0, x1 - x0, 2);
    ctx.fillStyle = '#b8a888'; for (let x = x0 + 15; x < x1; x += 32) ctx.fillRect(x, 1, 2, 6);
  }
};
const terraSemi = {
  style: 'tiles', c1: '#e07a4a', c2: '#a8482a',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#a8482a'; ctx.fillRect(x0, 0, x1 - x0, 11);
    for (let x = x0; x < x1; x += 8) { ctx.fillStyle = (x / 8) % 2 ? '#e07a4a' : '#d06a3a'; ctx.beginPath(); ctx.arc(x + 4, 4, 4.5, Math.PI, 0); ctx.lineTo(x + 8.5, 9); ctx.lineTo(x - 0.5, 9); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5);
  }
};
const crateBrick = {
  style: 'crate', c1: '#e8b04a', c2: '#b07a2a', mortar: '#6a4418',
  paint(ctx) {
    ctx.fillStyle = '#d8a050'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#e8bc6a'; ctx.fillRect(2, 3, TS - 4, 7); ctx.fillRect(2, TS - 10, TS - 4, 7);
    ctx.fillStyle = '#e83a2a'; ctx.beginPath(); ctx.arc(TS / 2 - 5, TS / 2, 4, 0, TAU); ctx.arc(TS / 2 + 5, TS / 2, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = BASIL; ctx.fillRect(TS / 2 - 6, TS / 2 - 6, 3, 2); ctx.fillRect(TS / 2 + 4, TS / 2 - 6, 3, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const travertine = {
  c1: '#efe2c4', c2: '#c8b48a',
  paint(ctx) {
    ctx.fillStyle = '#e8d8b4'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#d4c098'; ctx.fillRect(0, TS - 4, TS, 4); ctx.fillRect(TS - 3, 0, 3, TS);
    ctx.fillStyle = 'rgba(160,130,90,0.4)'; for (let k = 0; k < 4; k++) ctx.fillRect(4 + k * 7, 6 + (k % 2) * 12, 5, 1.4);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the pizzeria: terracotta floor tiles under a wooden counter top; shelves; flour sacks; firebrick
const kitchenGround = {
  style: 'counter', cap: '#c89058', capHi: '#e8b478', dirt: '#e8dcc8', dirt2: '#c84a3a', rock: '#d0c4b0',
  paint(ctx, rng) {
    ctx.fillStyle = '#f2ece0'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#d8cfc0'; ctx.fillRect(0, TS / 2 - 1, TS, 2); ctx.fillRect(TS / 2 - 1, 0, 2, TS);
    ctx.fillStyle = '#3a8a5a'; ctx.fillRect(0, 0, TS, 3); ctx.fillStyle = '#e8424a'; ctx.fillRect(0, TS - 3, TS, 3);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#7a4a24'; ctx.fillRect(x0, 0, x1 - x0, 11);
    ctx.fillStyle = '#c89058'; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = '#e8b478'; ctx.fillRect(x0, 0, x1 - x0, 2);
    ctx.fillStyle = 'rgba(120,70,30,0.5)'; for (let x = x0 + 9; x < x1; x += 23) ctx.fillRect(x, 3, 12, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (let x = x0 + 5; x < x1; x += 17) { ctx.beginPath(); ctx.arc(x, 1.5, 1.2, 0, TAU); ctx.fill(); }
  }
};
const shelfSemi = {
  style: 'shelf', c1: '#c89058', c2: '#7a4a24',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#7a4a24'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#c89058'; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = INK; ctx.fillRect(x0, 8, x1 - x0, 1.5);
    ctx.fillStyle = '#5a3a1a'; for (let x = x0 + 6; x < x1; x += 32) { ctx.fillRect(x, 9, 3, 6); }
  }
};
const flourBrick = {
  style: 'sack', c1: '#f4eee0', c2: '#c8bca4', mortar: '#8a7a60',
  paint(ctx) {
    ctx.fillStyle = '#e8e0cc'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#f8f4ea'; rr(ctx, 2, 2, TS - 4, TS - 4, 6); ctx.fill();
    ctx.fillStyle = '#c8bca4'; ctx.fillRect(TS / 2 - 8, TS / 2 - 3, 16, 6);
    ctx.fillStyle = '#e8424a'; ctx.fillRect(TS / 2 - 6, TS / 2 - 1, 4, 2); ctx.fillStyle = '#3a8a5a'; ctx.fillRect(TS / 2 + 2, TS / 2 - 1, 4, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const fireBrick = {
  c1: '#a84a32', c2: '#6a2a1a',
  paint(ctx) {
    ctx.fillStyle = '#6a2a1a'; ctx.fillRect(0, 0, TS, TS);
    for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) { const x = c * 14 + (r % 2) * 7 + 1, y = r * 8 + 1; ctx.fillStyle = (r + c) % 2 ? '#b85a3a' : '#a84a32'; ctx.fillRect(x, y, 12, 6); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the stair tower: pale stone floors, wooden scaffold planks, barrels, marble blocks
const towerGround = {
  style: 'stone', cap: '#f2ecdc', capHi: '#ffffff', dirt: '#c8bca4', dirt2: '#a89c84', rock: '#b8ac94',
  paint(ctx, rng) {
    ctx.fillStyle = '#cfc3a9'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#bcb096'; ctx.fillRect(0, TS / 2, TS, 2); ctx.fillRect((rng() < 0.5 ? 8 : 20), 0, 2, TS / 2); ctx.fillRect((rng() < 0.5 ? 4 : 24), TS / 2, 2, TS / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(2, 2, 10, 2);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#9a8e76'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = '#f2ecdc'; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = '#c8bca4'; for (let x = x0 + 30; x < x1; x += 32) ctx.fillRect(x, 0, 2, 7);
    ctx.fillStyle = 'rgba(140,130,110,0.5)'; for (let x = x0 + 7; x < x1; x += 13) ctx.fillRect(x, 3, 5, 1);
  }
};
const plankSemi = {
  style: 'plank', c1: '#c8945a', c2: '#7a5430',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#7a5430'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = '#c8945a'; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = '#5a3a1a'; for (let x = x0 + 4; x < x1; x += 16) ctx.fillRect(x, 3, 2, 2);
    ctx.fillStyle = INK; ctx.fillRect(x0, 9, x1 - x0, 1.5);
  }
};
const barrelBrick = {
  style: 'barrel', c1: '#b07a40', c2: '#6a4420', mortar: '#3a2410',
  paint(ctx) {
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#b07a40'; rr(ctx, 2, 1, TS - 4, TS - 2, 8); ctx.fill();
    ctx.fillStyle = '#c8945a'; for (let x = 6; x < TS - 4; x += 6) ctx.fillRect(x, 3, 2, TS - 6);
    ctx.fillStyle = '#6a6a72'; ctx.fillRect(2, 7, TS - 4, 3); ctx.fillRect(2, TS - 10, TS - 4, 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; rr(ctx, 2, 1, TS - 4, TS - 2, 8); ctx.stroke();
  }
};
const marbleHard = {
  c1: '#f4f0e6', c2: '#c8c0ae',
  paint(ctx) {
    ctx.fillStyle = '#ece6d6'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = 'rgba(120,120,130,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(3, 6); ctx.quadraticCurveTo(14, 12, 10, 22); ctx.quadraticCurveTo(18, 26, 28, 24); ctx.stroke();
    ctx.fillStyle = '#d6ccb8'; ctx.fillRect(0, TS - 4, TS, 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the opera house: red carpet on stage boards, gilded balcony rails, velvet, dark wood panels
const operaGround = {
  style: 'carpet', cap: '#c8283a', capHi: '#e84a5a', dirt: '#5a2a1a', dirt2: '#3a1a10', rock: '#4a2214',
  paint(ctx) {
    ctx.fillStyle = '#5a321e'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#6a3e26'; for (let y = 0; y < TS; y += 8) ctx.fillRect(0, y, TS, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(TS - 2, 0, 2, TS);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#7a1420'; ctx.fillRect(x0, 0, x1 - x0, 11);
    ctx.fillStyle = '#c8283a'; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(x0, 8, x1 - x0, 2);
    ctx.fillStyle = '#e84a5a'; ctx.fillRect(x0, 0, x1 - x0, 2);
  }
};
const goldSemi = {
  style: 'rail', c1: '#ffd24a', c2: '#b8861a',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#7a1420'; ctx.fillRect(x0, 2, x1 - x0, 8);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = '#fff2a8'; ctx.fillRect(x0, 0, x1 - x0, 1.5);
    ctx.fillStyle = '#b8861a'; for (let x = x0 + 4; x < x1; x += 8) { ctx.beginPath(); ctx.arc(x, 7, 2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5);
  }
};
const velvetBrick = {
  style: 'seat', c1: '#c8283a', c2: '#7a1420', mortar: '#3a0a10',
  paint(ctx) {
    ctx.fillStyle = '#4a0a14'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#c8283a'; rr(ctx, 2, 2, TS - 4, TS - 4, 7); ctx.fill();
    ctx.fillStyle = '#e84a5a'; rr(ctx, 6, 5, TS - 12, 7, 3); ctx.fill();
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(TS / 2, TS - 8, 2, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; rr(ctx, 2, 2, TS - 4, TS - 4, 7); ctx.stroke();
  }
};
const panelHard = {
  c1: '#6a3a22', c2: '#3a1e10',
  paint(ctx) {
    ctx.fillStyle = '#4a2814'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#6a3a22'; ctx.fillRect(3, 3, TS - 6, TS - 6);
    ctx.strokeStyle = '#d8a83a'; ctx.lineWidth = 1.4; ctx.strokeRect(6, 6, TS - 12, TS - 12);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the espresso bar: black and white chequered floor under a chrome rail; glass shelves; coffee sacks; chrome panels
const barGround = {
  style: 'check', cap: '#c8ccd4', capHi: '#ffffff', dirt: '#2a1a14', dirt2: '#f2ece0', rock: '#3a2a1e',
  paint(ctx) {
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { ctx.fillStyle = (x + y) % 2 ? '#2a1e18' : '#f2ece0'; ctx.fillRect(x * TS / 2, y * TS / 2, TS / 2, TS / 2); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#6a707c'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, 1, x1 - x0, 2);
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x0, 7, x1 - x0, 3);
  }
};
const glassSemi = {
  style: 'glass', c1: '#dff2f8', c2: '#8aa8b4',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = 'rgba(200,236,248,0.9)'; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x0, 0, x1 - x0, 2);
    ctx.fillStyle = '#9aa0aa'; for (let x = x0 + 10; x < x1; x += 32) ctx.fillRect(x, 7, 3, 5);
    ctx.fillStyle = INK; ctx.fillRect(x0, 7, x1 - x0, 1.5);
  }
};
const sackBrick = {
  style: 'sack', c1: '#a8804a', c2: '#6a4a22', mortar: '#3a2410',
  paint(ctx) {
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#b08a52'; rr(ctx, 1, 2, TS - 2, TS - 3, 8); ctx.fill();
    ctx.fillStyle = '#3a2410'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(9 + k * 7, 14 + (k % 2) * 4, 3, 4.4, 0.5, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; rr(ctx, 1, 2, TS - 2, TS - 3, 8); ctx.stroke();
  }
};
const chromeHard = {
  c1: '#d8dce4', c2: '#8a909c',
  paint(ctx) {
    ctx.fillStyle = '#9aa0ac'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#d8dce4'; ctx.fillRect(2, 2, TS - 4, TS - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(5, 4, 3, TS - 8);
    ctx.fillStyle = '#8a909c'; for (const [x, y] of [[5, 5], [TS - 7, 5], [5, TS - 7], [TS - 7, TS - 7]]) ctx.fillRect(x, y, 2, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the cellar (secret rooms): old bricks
const cellarGround = {
  style: 'flag', cap: '#b8a07a', capHi: '#d8c09a', dirt: '#5a4030', dirt2: '#3a2a20', rock: '#4a3628',
  paint(ctx, rng) {
    ctx.fillStyle = '#4a3628'; ctx.fillRect(0, 0, TS, TS);
    for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) { ctx.fillStyle = (r * 3 + c) % 3 ? '#7a5a40' : '#6a4a34'; ctx.fillRect(c * 14 + (r % 2) * 7 + 1, r * 8 + 1, 12, 6); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#6a5440'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#b8a07a'; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = '#d8c09a'; ctx.fillRect(x0, 0, x1 - x0, 2);
  }
};
const vicolo = { ground: cobble, semi: terraSemi, brick: crateBrick, hard: travertine, pillar: { c1: '#efe2c4', c2: '#c8b48a', cap: TERRA, style: 'column' }, accent: COL.a, tint: {}, bloom: 0.16, liquid: null };
const kitchen = { ground: kitchenGround, semi: shelfSemi, brick: flourBrick, hard: fireBrick, pillar: { c1: '#f2ece0', c2: '#c8bca4', cap: '#e8424a', style: 'column' }, accent: '#e8424a', tint: {}, bloom: 0.14, liquid: null };
const tower = { ground: towerGround, semi: plankSemi, brick: barrelBrick, hard: marbleHard, pillar: { c1: '#f4f0e6', c2: '#c8c0ae', cap: '#d8a83a', style: 'column' }, accent: '#d8a83a', tint: {}, bloom: 0.14, liquid: null };
const opera = { ground: operaGround, semi: goldSemi, brick: velvetBrick, hard: panelHard, pillar: { c1: '#ffd24a', c2: '#b8861a', cap: '#c8283a', style: 'column' }, accent: '#ffd24a', tint: {}, bloom: 0.24, liquid: null };
const bar = { ground: barGround, semi: glassSemi, brick: sackBrick, hard: chromeHard, pillar: { c1: '#d8dce4', c2: '#8a909c', cap: '#8a5a3a', style: 'column' }, accent: '#8a5a3a', tint: {}, bloom: 0.16, liquid: null };
const cellar = { ground: cellarGround, semi: shelfSemi, brick: barrelBrick, hard: fireBrick, pillar: { c1: '#b8a07a', c2: '#6a5440', cap: '#e8b04a', style: 'column' }, accent: OCHRE, tint: {}, bloom: 0.1, liquid: null };

/* ---------------- painted backdrops ---------------- */
// a cypress: a dark green flame
const cypress = (ctx, x, b, h, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, b - h); ctx.quadraticCurveTo(x + h * 0.16, b - h * 0.5, x + h * 0.1, b); ctx.lineTo(x - h * 0.1, b); ctx.quadraticCurveTo(x - h * 0.16, b - h * 0.5, x, b - h); ctx.fill(); };
// the leaning tower in silhouette (the land's shrunk landmark; comic, plain)
const leanTower = (ctx, x, b, h, col, lean) => {
  ctx.save(); ctx.translate(x, b); ctx.rotate(lean); ctx.fillStyle = col;
  const w = h * 0.2; ctx.fillRect(-w / 2, -h, w, h);
  ctx.fillStyle = shade(col, 0.12); for (let k = 1; k < 7; k++) ctx.fillRect(-w / 2 - 2, -k * h / 7, w + 4, 2.5);
  ctx.fillStyle = shade(col, -0.15); ctx.fillRect(-w * 0.35, -h - h * 0.08, w * 0.7, h * 0.08);
  ctx.restore();
};
const HOUSE = ['#e8b04a', '#e89a7a', '#f2dcb0', '#d8693a', '#f0c870', '#e8c0a0'];
const painters = {
  // far: rolling hills with cypress lines, farmhouses, the little leaning tower far away
  itHills(ctx, L, rng, H) {
    const b = L.base, n1 = periodicNoise(rng, 3), n2 = periodicNoise(rng, 4);
    ctx.fillStyle = shade(L.color, 0.12); ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 8) ctx.lineTo(x, b - 70 + n1(x) * 34);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 8) ctx.lineTo(x, b - 20 + n2(x) * 26);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    // field stripes
    ctx.strokeStyle = shade(L.color, -0.08); ctx.lineWidth = 2;
    for (let k = 0; k < 6; k++) { const y = b + k * 14; ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= BG_W; x += 32) ctx.lineTo(x, y + n2(x + k * 90) * 10); ctx.stroke(); }
    // cypress rows and farmhouses
    for (let k = 0; k < 14; k++) {
      const x = rng() * BG_W, y = b - 20 + n2(x) * 26 + 4;
      if (k % 3 === 0) { wrapDraw(x - 20, 40, X => { ctx.fillStyle = shade(OCHRE, -0.1); ctx.fillRect(X - 12, y - 16, 24, 16); ctx.fillStyle = shade(TERRA, -0.1); ctx.beginPath(); ctx.moveTo(X - 15, y - 15); ctx.lineTo(X, y - 24); ctx.lineTo(X + 15, y - 15); ctx.fill(); }); }
      else for (let q = 0; q < 4; q++) wrapDraw(x + q * 11 - 6, 12, X => cypress(ctx, X + 6, y + 2, 26 + rng() * 10, L.tree || CYPRESS));
    }
    wrapDraw(BG_W * 0.62 - 20, 40, X => leanTower(ctx, X + 20, b - 26 + n1(BG_W * 0.62) * 10, 70, L.landmark || '#e8e2d0', 0.09));
  },
  // middle: a sea of terracotta roofs and chimneys
  itRoofs(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(0, b, BG_W, H - b);
    for (let x = -20; x < BG_W + 20;) {
      const w = 40 + rng() * 50, h = 40 + rng() * 60, wall = HOUSE[Math.floor(rng() * HOUSE.length)];
      wrapDraw(x, w, X => {
        ctx.fillStyle = shade(wall, -0.12); ctx.fillRect(X, b - h, w, h + 20);
        ctx.fillStyle = shade(L.color, rng() < 0.5 ? 0 : -0.08); ctx.beginPath(); ctx.moveTo(X - 4, b - h + 2); ctx.lineTo(X + w * 0.5, b - h - 14); ctx.lineTo(X + w + 4, b - h + 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(wall, -0.35); for (let k = 0; k < Math.floor(w / 16); k++) ctx.fillRect(X + 6 + k * 16, b - h + 14, 6, 9);
        if (rng() < 0.5) { ctx.fillStyle = shade(L.color, -0.25); ctx.fillRect(X + w * 0.7, b - h - 22, 7, 14); }
      });
      x += w - 4;
    }
  },
  // near: tall house fronts along the alley: shutters, balconies with geraniums, washing lines
  itFacades(ctx, L, rng, H) {
    const b = L.base;
    for (let x = 0; x < BG_W;) {
      const w = 110 + Math.floor(rng() * 4) * 16, h = 200 + rng() * 90, wall = HOUSE[Math.floor(rng() * HOUSE.length)];
      wrapDraw(x, w, X => {
        ctx.fillStyle = shade(wall, -0.06); ctx.fillRect(X, b - h, w, h + 40);
        ctx.fillStyle = shade(wall, -0.2); ctx.fillRect(X, b - h, w, 6); ctx.fillRect(X + w - 4, b - h, 4, h + 40);
        // windows with green shutters
        for (let r = 0; r < Math.floor((h - 70) / 56); r++) for (let c = 0; c < Math.floor(w / 40); c++) {
          const wx = X + 12 + c * 40, wy = b - h + 24 + r * 56;
          ctx.fillStyle = shade(wall, -0.4); ctx.fillRect(wx + 6, wy, 14, 26);
          const open = (r + c + Math.floor(X)) % 3 === 0;
          ctx.fillStyle = shade(L.shutter || SHUTTER, -0.05);
          if (open) { ctx.fillRect(wx - 2, wy - 1, 7, 28); ctx.fillRect(wx + 21, wy - 1, 7, 28); }
          else { ctx.fillRect(wx + 5, wy - 1, 16, 28); ctx.fillStyle = shade(L.shutter || SHUTTER, -0.25); for (let q = 0; q < 6; q++) ctx.fillRect(wx + 6, wy + 2 + q * 4, 14, 1.4); }
          if ((r + c) % 2 === 1) { ctx.fillStyle = shade(wall, -0.3); ctx.fillRect(wx, wy + 26, 26, 4); ctx.fillStyle = '#e8424a'; for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.arc(wx + 3 + q * 7, wy + 24, 3, 0, TAU); ctx.fill(); } ctx.fillStyle = BASIL; ctx.fillRect(wx + 1, wy + 25, 24, 2); }
        }
        // an arch at street level
        ctx.fillStyle = shade(wall, -0.45); ctx.beginPath(); ctx.moveTo(X + w / 2 - 18, b + 30); ctx.lineTo(X + w / 2 - 18, b - 26); ctx.arc(X + w / 2, b - 26, 18, Math.PI, 0); ctx.lineTo(X + w / 2 + 18, b + 30); ctx.fill();
      });
      x += w;
    }
    // washing lines across the alley, with shirts, socks and a tablecloth
    for (let k = 0; k < 5; k++) {
      const x0 = rng() * BG_W, y0 = b - 150 - rng() * 60, len = 120 + rng() * 60;
      wrapDraw(x0, len, X => {
        ctx.strokeStyle = 'rgba(60,50,40,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X, y0); ctx.quadraticCurveTo(X + len / 2, y0 + 16, X + len, y0); ctx.stroke();
        for (let q = 0; q < 5; q++) { const cx = X + 14 + q * (len - 28) / 4, cy = y0 + 4 + Math.sin(q / 4 * Math.PI) * 12; ctx.fillStyle = ['#ffffff', '#8ac8f0', '#e8424a', '#ffd24a', '#c8e0a0'][q]; if (q % 2) ctx.fillRect(cx - 7, cy, 14, 18); else { ctx.beginPath(); ctx.moveTo(cx - 9, cy); ctx.lineTo(cx + 9, cy); ctx.lineTo(cx + 7, cy + 16); ctx.lineTo(cx - 7, cy + 16); ctx.fill(); } }
      });
    }
  },
  // the pizzeria's back wall: white tiles with a green-white-red band, shelves of jars, hanging pans and garlic
  itKitchenWall(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = shade(L.color, -0.08); ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); }
    for (let y = 0; y < H; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x < BG_W; x += 32) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke(); }
    ctx.fillStyle = '#3a8a5a'; ctx.fillRect(0, b - 96, BG_W, 6); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, b - 90, BG_W, 6); ctx.fillStyle = '#e8424a'; ctx.fillRect(0, b - 84, BG_W, 6);
    for (let x = 30; x < BG_W; x += 200) {
      // a shelf of jars: tomatoes, olives, peppers, pasta
      ctx.fillStyle = shade('#c89058', -0.1); ctx.fillRect(x, b - 200, 120, 6);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#e8424a', '#5a7a2a', '#ff8a2a', '#f2d890', '#e8424a', '#7a3a6a'][k]; rr(ctx, x + 4 + k * 19, b - 226, 15, 26, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x + 7 + k * 19, b - 222, 3, 16); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x + 5 + k * 19, b - 230, 13, 4); }
      // hanging copper pans
      for (let k = 0; k < 3; k++) { const px = x + 150 + k * 16, py = b - 250 + (k % 2) * 10; ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py - 30); ctx.lineTo(px, py - 12); ctx.stroke(); ctx.fillStyle = '#c87a3a'; ctx.beginPath(); ctx.arc(px, py, 10, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8a060'; ctx.beginPath(); ctx.arc(px - 2, py - 2, 5, 0, TAU); ctx.fill(); }
      // a braid of garlic
      ctx.fillStyle = '#f2ead8'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + 100 + (k % 2) * 6, b - 160 + k * 12, 6, 0, TAU); ctx.fill(); }
    }
  },
  // the big wood-fired oven glowing at the far end (a far layer of the pizzeria)
  itOvenGlow(ctx, L, rng, H) {
    const b = L.base;
    for (let x = 120; x < BG_W; x += 512) {
      wrapDraw(x - 140, 280, X => {
        const cx = X + 140;
        ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(cx - 130, b); ctx.quadraticCurveTo(cx - 130, b - 150, cx, b - 160); ctx.quadraticCurveTo(cx + 130, b - 150, cx + 130, b); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(L.color, -0.3); ctx.beginPath(); ctx.moveTo(cx - 50, b); ctx.lineTo(cx - 50, b - 50); ctx.arc(cx, b - 50, 50, Math.PI, 0); ctx.lineTo(cx + 50, b); ctx.fill();
        const g = ctx.createRadialGradient(cx, b - 30, 5, cx, b - 30, 60); g.addColorStop(0, '#fff0a0'); g.addColorStop(0.5, '#ff9a2a'); g.addColorStop(1, 'rgba(200,60,20,0.2)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - 44, b); ctx.lineTo(cx - 44, b - 50); ctx.arc(cx, b - 50, 44, Math.PI, 0); ctx.lineTo(cx + 44, b); ctx.fill();
        ctx.fillStyle = shade(L.color, -0.15); ctx.fillRect(cx - 16, b - 220, 32, 64);
      });
    }
  },
  // the stair tower's inside: pale stone courses, arched windows onto blue sky and roofs, bell ropes
  itTowerWall(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(L.color, -0.07);
    for (let y = 0; y < H; y += 24) for (let x = (y / 24) % 2 ? 0 : 30; x < BG_W; x += 60) ctx.fillRect(x, y, 2, 24);
    for (let y = 0; y < H; y += 24) ctx.fillRect(0, y, BG_W, 2);
    for (let x = 60; x < BG_W; x += 170) for (let y = 40; y < H - 60; y += 190) {
      const wx = x + (y / 190 % 2) * 60;
      ctx.fillStyle = shade(L.color, -0.25); ctx.beginPath(); ctx.moveTo(wx - 26, y + 110); ctx.lineTo(wx - 26, y + 30); ctx.arc(wx, y + 30, 26, Math.PI, 0); ctx.lineTo(wx + 26, y + 110); ctx.fill();
      const g = ctx.createLinearGradient(0, y, 0, y + 104); g.addColorStop(0, '#6ab8f0'); g.addColorStop(1, '#c8e8ff');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(wx - 20, y + 104); ctx.lineTo(wx - 20, y + 30); ctx.arc(wx, y + 30, 20, Math.PI, 0); ctx.lineTo(wx + 20, y + 104); ctx.fill();
      ctx.fillStyle = shade(TERRA, -0.05); for (let k = 0; k < 3; k++) ctx.fillRect(wx - 20 + k * 14, y + 88 - (k % 2) * 8, 13, 16 + (k % 2) * 8);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(wx - 6, y + 44, 9, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = shade(L.color, -0.12); ctx.fillRect(wx - 1.5, y + 4, 3, 100);
    }
  },
  // scaffold beams and ropes in front of the tower wall
  itTowerBeams(ctx, L, rng, H) {
    for (let x = 0; x < BG_W; x += 256) {
      wrapDraw(x, 40, X => {
        ctx.fillStyle = L.color; ctx.fillRect(X + 10, 0, 14, H);
        ctx.fillStyle = shade(L.color, 0.15); ctx.fillRect(X + 12, 0, 3, H);
        for (let y = 60; y < H; y += 150) { ctx.save(); ctx.translate(X + 17, y); ctx.rotate(0.6); ctx.fillStyle = L.color; ctx.fillRect(0, -5, 120, 10); ctx.restore(); }
      });
      const rx = x + 140;
      ctx.strokeStyle = shade(L.color, 0.3); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx + 6, H); ctx.stroke();
    }
  },
  // the opera house: horseshoe tiers of boxes, velvet and gold, animal opera-goers with little opera glasses
  itOperaBoxes(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    const b = L.base;
    for (let tier = 0; tier < 4; tier++) {
      const y = b - 90 - tier * 78;
      ctx.fillStyle = shade(L.color, -0.25); ctx.fillRect(0, y - 54, BG_W, 54);
      for (let x = 0; x < BG_W; x += 64) {
        ctx.fillStyle = shade(L.color, -0.45); ctx.beginPath(); ctx.moveTo(x + 8, y); ctx.lineTo(x + 8, y - 34); ctx.arc(x + 32, y - 34, 24, Math.PI, 0); ctx.lineTo(x + 56, y); ctx.fill();
        const r = rng();
        if (r < 0.55) {
          // an opera-goer: an owl, a cat or a poodle, in silhouette, lifting opera glasses
          const ax = x + 32, ay = y - 6; ctx.fillStyle = shade(L.color, -0.62);
          if (r < 0.2) { ctx.beginPath(); ctx.ellipse(ax, ay - 10, 10, 12, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(ax - 8, ay - 18); ctx.lineTo(ax - 6, ay - 26); ctx.lineTo(ax - 2, ay - 20); ctx.moveTo(ax + 8, ay - 18); ctx.lineTo(ax + 6, ay - 26); ctx.lineTo(ax + 2, ay - 20); ctx.fill(); }
          else if (r < 0.4) { ctx.beginPath(); ctx.arc(ax, ay - 12, 9, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(ax - 8, ay - 16); ctx.lineTo(ax - 6, ay - 26); ctx.lineTo(ax - 1, ay - 20); ctx.moveTo(ax + 8, ay - 16); ctx.lineTo(ax + 6, ay - 26); ctx.lineTo(ax + 1, ay - 20); ctx.fill(); }
          else { ctx.beginPath(); ctx.arc(ax, ay - 12, 8, 0, TAU); ctx.arc(ax, ay - 22, 6, 0, TAU); ctx.arc(ax - 9, ay - 10, 5, 0, TAU); ctx.arc(ax + 9, ay - 10, 5, 0, TAU); ctx.fill(); }
          ctx.fillStyle = '#ffd24a'; ctx.fillRect(ax - 5, ay - 15, 4, 3); ctx.fillRect(ax + 1, ay - 15, 4, 3);
        }
      }
      ctx.fillStyle = '#d8a83a'; ctx.fillRect(0, y, BG_W, 7); ctx.fillStyle = '#fff2a8'; ctx.fillRect(0, y, BG_W, 2);
      ctx.fillStyle = shade(L.color, 0.1); for (let x = 0; x < BG_W; x += 16) { ctx.beginPath(); ctx.arc(x + 8, y + 12, 5, 0, Math.PI); ctx.fill(); }
    }
  },
  // the house curtain's side drapes, with gold tassels, and soft spotlight cones
  itOperaDrapes(ctx, L, rng, H) {
    for (let x = 0; x < BG_W; x += 340) {
      wrapDraw(x, 110, X => {
        ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(X, 0); ctx.lineTo(X + 100, 0); ctx.quadraticCurveTo(X + 60, H * 0.4, X + 80, H * 0.62); ctx.quadraticCurveTo(X + 40, H * 0.7, X, H * 0.64); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = shade(L.color, -0.25); ctx.lineWidth = 3; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(X + k * 20, 0); ctx.quadraticCurveTo(X + k * 14, H * 0.35, X + k * 16, H * 0.62); ctx.stroke(); }
        ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(X + 78, H * 0.62, 7, 0, TAU); ctx.fill(); ctx.fillRect(X + 74, H * 0.62, 8, 22);
      });
      ctx.fillStyle = 'rgba(255,240,190,0.07)'; ctx.beginPath(); ctx.moveTo(x + 200, 0); ctx.lineTo(x + 150, H); ctx.lineTo(x + 260, H); ctx.lineTo(x + 214, 0); ctx.fill();
    }
  },
  // the boss's stage: a painted backdrop flat (the bay at sunset with a smoking volcano and a moon), footlights
  itStageFlat(ctx, L, rng, H) {
    const b = L.base;
    const g = ctx.createLinearGradient(0, b - 300, 0, b); g.addColorStop(0, '#5a3a8a'); g.addColorStop(0.6, '#e87a5a'); g.addColorStop(1, '#ffc87a');
    ctx.fillStyle = g; ctx.fillRect(0, b - 300, BG_W, 300);
    ctx.fillStyle = '#fff4d8'; ctx.beginPath(); ctx.arc(BG_W * 0.3, b - 220, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a4a6a'; ctx.beginPath(); ctx.moveTo(BG_W * 0.55, b - 60); ctx.lineTo(BG_W * 0.68, b - 170); ctx.lineTo(BG_W * 0.72, b - 166); ctx.lineTo(BG_W * 0.86, b - 60); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(BG_W * 0.7 + k * 14, b - 186 - k * 14, 10 + k * 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#3a6aa8'; ctx.fillRect(0, b - 60, BG_W, 60);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2; for (let k = 0; k < 18; k++) { const x = rng() * BG_W, y = b - 50 + rng() * 40; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20, y); ctx.stroke(); }
    // the flat's wooden frame and the painted canvas seams (it is scenery)
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 0; x < BG_W; x += 256) ctx.fillRect(x, b - 300, 3, 300);
    ctx.fillStyle = L.color; ctx.fillRect(0, b - 314, BG_W, 16);
    ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the stage wings: tall red curtains in folds, a pelmet with gold fringe
  itStageWings(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, 60);
    ctx.fillStyle = '#ffd24a'; for (let x = 0; x < BG_W; x += 10) ctx.fillRect(x, 60, 6, 14);
    for (let x = 0; x < BG_W; x += 512) wrapDraw(x - 40, 120, X => {
      ctx.fillStyle = L.color; ctx.fillRect(X - 40, 0, 120, H);
      ctx.strokeStyle = shade(L.color, -0.28); ctx.lineWidth = 4; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(X - 30 + k * 24, 0); ctx.lineTo(X - 30 + k * 24, H); ctx.stroke(); }
    });
  },
  // the espresso bar's back wall: mirrored shelves with cups, the great chrome machine, a chalkboard
  itBarWall(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(L.color, -0.12); for (let x = 0; x < BG_W; x += 40) ctx.fillRect(x, 0, 2, H);
    for (let x = 0; x < BG_W; x += 256) {
      ctx.fillStyle = 'rgba(200,230,240,0.35)'; ctx.fillRect(x + 10, b - 260, 150, 120);
      for (let s = 0; s < 3; s++) { ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x + 10, b - 220 + s * 40, 150, 4); for (let k = 0; k < 7; k++) { ctx.fillStyle = '#ffffff'; rr(ctx, x + 16 + k * 20, b - 236 + s * 40, 13, 14, 3); ctx.fill(); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x + 16 + k * 20, b - 232 + s * 40, 13, 2); } }
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x + 180, b - 250, 64, 46); ctx.fillStyle = '#f2ead8'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('DOPPIO', x + 212, b - 230); ctx.fillText('★★', x + 212, b - 214);
    }
  },
  // the big chrome espresso machines along the counter (a nearer layer)
  itBarMachine(ctx, L, rng, H) {
    const b = L.base;
    for (let x = 60; x < BG_W; x += 340) wrapDraw(x, 200, X => {
      ctx.fillStyle = L.color; rr(ctx, X, b - 130, 200, 130, 14); ctx.fill();
      ctx.fillStyle = shade(L.color, 0.25); ctx.fillRect(X + 12, b - 120, 8, 110);
      ctx.fillStyle = '#c8283a'; rr(ctx, X + 20, b - 160, 160, 34, 10); ctx.fill();
      for (let k = 0; k < 3; k++) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(X + 50 + k * 50, b - 92, 13, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 50 + k * 50, b - 92); ctx.lineTo(X + 56 + k * 50, b - 100); ctx.stroke(); ctx.fillStyle = '#3a3a3a'; ctx.fillRect(X + 44 + k * 50, b - 64, 12, 18); }
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(X + 100, b - 190); ctx.lineTo(X + 90, b - 160); ctx.lineTo(X + 110, b - 160); ctx.fill();
    });
  },
  // a cool cellar: brick arches, cheese wheels on racks, hanging salami and a string of peppers
  itCellar(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 220) {
      ctx.fillStyle = shade(L.color, -0.25); ctx.beginPath(); ctx.moveTo(x + 20, b); ctx.lineTo(x + 20, b - 150); ctx.arc(x + 110, b - 150, 90, Math.PI, 0); ctx.lineTo(x + 200, b); ctx.fill();
      for (let s = 0; s < 3; s++) { ctx.fillStyle = shade('#7a5430', -0.1); ctx.fillRect(x + 40, b - 40 - s * 50, 140, 5); for (let k = 0; k < 4; k++) { ctx.fillStyle = '#f0c850'; ctx.beginPath(); ctx.ellipse(x + 58 + k * 34, b - 54 - s * 50, 15, 10, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#d8a83a'; ctx.fillRect(x + 43 + k * 34, b - 56 - s * 50, 30, 3); } }
      for (let k = 0; k < 3; k++) { ctx.fillStyle = '#a8483a'; rr(ctx, x + 84 + k * 18, b - 250, 10, 34, 5); ctx.fill(); ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 89 + k * 18, b - 270); ctx.lineTo(x + 89 + k * 18, b - 250); ctx.stroke(); }
    }
  }
};

/* ---------------- themes ---------------- */
const daySky = ['#4aa8e8', '#8ad0f8', '#fdf0d0'];
const themes = {
  it_vicolo: Object.assign({}, vicolo, {
    name: 'The Alleys', music: 'tour_it', particles: 'petals', rays: '#fff6d8',
    sky: daySky, horizonGlow: '#ffe8b0', celestial: { type: 'sun', x: 0.78, y: 0.18, r: 34, color: '#fff8e0', glow: '#ffe2a0' }, stars: 0,
    layers: [{ kind: 'itHills', color: '#a8c87a', tree: '#4a7a4a', landmark: '#f2ecd8', base: 330, f: 0.05, blur: true }, { kind: 'itRoofs', color: '#d87a4a', base: 370, f: 0.14 }, { kind: 'itFacades', color: '#e8b04a', base: 430, f: 0.3 }],
    fog: '#f8e8c8', decor: ['itGeranium', 'itCafeTable', 'itParked', 'itFruitCrate', 'itStreetLamp']
  }),
  it_tetti: Object.assign({}, vicolo, {
    name: 'The Rooftops', music: 'tour_it', particles: 'petals', rays: '#fff6d8',
    sky: ['#3a98e0', '#7ac4f4', '#f8e8c8'], horizonGlow: '#ffe8b0', celestial: { type: 'sun', x: 0.2, y: 0.2, r: 34, color: '#fff8e0', glow: '#ffe2a0' }, stars: 0,
    layers: [{ kind: 'itHills', color: '#98c070', tree: '#3a6a3a', landmark: '#f2ecd8', base: 360, f: 0.05, blur: true }, { kind: 'itRoofs', color: '#d07444', base: 420, f: 0.16 }],
    fog: '#f8e8c8', decor: ['itGeranium', 'itChimney']
  }),
  it_pizzeria: Object.assign({}, kitchen, {
    name: 'The Pizzeria', music: 'tour_it_pizza', particles: 'motes', rays: null,
    sky: ['#f6f0e4', '#f2e8d4', '#e8d8bc'], horizonGlow: '#ffb06a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'itOvenGlow', color: '#a8583a', base: 330, f: 0.06 }, { kind: 'itKitchenWall', color: '#f4f0e8', base: 420, f: 0.18 }],
    fog: '#f2dcc0', decor: ['itFlourSack', 'itBasilPot', 'itPizzaBoxes', 'itTomatoCans']
  }),
  it_cantina: Object.assign({}, cellar, {
    name: 'The Cellar', music: 'secret', particles: 'dust', rays: null,
    sky: ['#2a1e18', '#3a2a20', '#4a3628'], horizonGlow: '#ffb06a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'itCellar', color: '#5a4030', base: 400, f: 0.12 }],
    fog: '#5a4030', darkness: 0.2, decor: ['itCheese', 'itBarrel']
  }),
  it_torre: Object.assign({}, tower, {
    name: 'The Leaning Tower', music: 'tour_it_tower', particles: 'motes', rays: '#fff6d8',
    sky: ['#e8e0cc', '#e2d8c0', '#d8ccb0'], horizonGlow: '#fff2c8', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'itTowerWall', color: '#ddd2b8', base: 400, f: 0.1 }, { kind: 'itTowerBeams', color: '#8a6a44', base: 420, f: 0.26 }],
    fog: '#efe6d2', decor: ['itBarrel', 'itCrateStack', 'itBellRope']
  }),
  it_opera: Object.assign({}, opera, {
    name: 'Night at the Opera', music: 'tour_it_opera', particles: 'motes', rays: null,
    sky: ['#2a0a14', '#3a121c', '#4a1a22'], horizonGlow: '#ffd24a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'itOperaBoxes', color: '#8a2030', base: 470, f: 0.1 }, { kind: 'itOperaDrapes', color: '#a81828', base: 420, f: 0.28 }],
    fog: '#5a1a22', darkness: 0.18, decor: ['itMusicStand', 'itRoses', 'itFootlight']
  }),
  it_stage: Object.assign({}, opera, {
    name: 'The Grand Stage', music: 'tour_it_boss', particles: 'confetti', rays: null,
    sky: ['#1a0a14', '#2a121c', '#3a1a22'], horizonGlow: '#ffd24a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'itStageFlat', color: '#7a1420', base: 400, f: 0.08 }, { kind: 'itStageWings', color: '#a81828', base: 420, f: 0.22 }],
    fog: '#5a1a22', decor: ['itFootlight', 'itRoses']
  }),
  it_bar: Object.assign({}, bar, {
    name: 'The Espresso Bar', music: 'tour_it_doppio', particles: 'motes', rays: null,
    sky: ['#3a2418', '#5a3a26', '#7a5236'], horizonGlow: '#ffc87a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'itBarWall', color: '#e8dcc4', base: 400, f: 0.1 }, { kind: 'itBarMachine', color: '#c8ccd4', base: 440, f: 0.24 }],
    fog: '#a8805a', decor: ['itCupStack', 'itCornetti', 'itSugar']
  })
};

/* ---------------- props (Decor: drawn each frame; x, y = the tile's centre on the ground line) ---------------- */
const decor = {
  itGeranium(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = TERRA; ctx.beginPath(); ctx.moveTo(x - 10, y - 16); ctx.lineTo(x + 10, y - 16); ctx.lineTo(x + 7, y); ctx.lineTo(x - 7, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = BASIL; ctx.beginPath(); ctx.arc(x - 6, y - 20, 6, 0, TAU); ctx.arc(x + 6, y - 21, 6, 0, TAU); ctx.arc(x, y - 26, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e8424a'; for (const [dx, dy] of [[-6, -26], [5, -28], [0, -32], [8, -22]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy + Math.sin(t * 2 + dx) * 0.6, 3.2, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  itCafeTable(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x - 2, y - 22, 4, 22); ctx.fillRect(x - 10, y - 2, 20, 2);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y - 24, 16, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; rr(ctx, x - 4, y - 33, 8, 7, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; for (let k = 0; k < 2; k++) { const ph = (t * 0.7 + k * 0.5) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(x + Math.sin(ph * 6) * 2, y - 36 - ph * 14, 2 + ph * 2, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 22, y); ctx.lineTo(x + s * 22, y - 26); ctx.quadraticCurveTo(x + s * 22, y - 32, x + s * 16, y - 32); ctx.moveTo(x + s * 22, y - 14); ctx.lineTo(x + s * 14, y - 14); ctx.lineTo(x + s * 14, y); ctx.stroke(); }
    ctx.restore();
  },
  // a parked little scooter (no brand: a round cartoon one in mint green)
  itParked(ctx, x, y, t, th, d) {
    const col = ['#8ad8c0', '#ffd24a', '#e8424a', '#8ac8f0'][((d && d.seed) || 0) % 4];
    ItArt.scooter(ctx, x, y, 1, col, 0, false);
  },
  itFruitCrate(ctx, x, y, t, th, d) {
    const f = ((d && d.seed) || 0) % 3;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = f === 0 ? '#ffe04a' : f === 1 ? TOMATO : '#7ac84a';
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x - 12 + k * 6, y - 18 - (k % 2) * 3, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#d8a050'; ctx.fillRect(x - 16, y - 16, 32, 16); ctx.strokeRect(x - 16, y - 16, 32, 16);
    ctx.fillStyle = '#a8742a'; ctx.fillRect(x - 14, y - 10, 28, 2);
    ctx.restore();
  },
  itStreetLamp(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(x - 2, y - 70, 4, 70); ctx.fillRect(x - 6, y - 4, 12, 4);
    ctx.beginPath(); ctx.moveTo(x, y - 70); ctx.quadraticCurveTo(x + 4, y - 82, x + 14, y - 78); ctx.lineWidth = 3; ctx.strokeStyle = '#2a2a34'; ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.moveTo(x + 8, y - 78); ctx.lineTo(x + 20, y - 78); ctx.lineTo(x + 17, y - 66); ctx.lineTo(x + 11, y - 66); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  itChimney(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#c8603a'; ctx.fillRect(x - 8, y - 30, 16, 30); ctx.strokeRect(x - 8, y - 30, 16, 30);
    ctx.fillStyle = TERRA; ctx.fillRect(x - 11, y - 36, 22, 7); ctx.strokeRect(x - 11, y - 36, 22, 7);
    ctx.restore();
  },
  itFlourSack(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#f6f0e0'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.quadraticCurveTo(x - 15, y - 18, x - 8, y - 28); ctx.lineTo(x + 8, y - 28); ctx.quadraticCurveTo(x + 15, y - 18, x + 12, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8bca4'; ctx.fillRect(x - 7, y - 32, 14, 5);
    ctx.fillStyle = '#e8424a'; ctx.font = TourBackstage.F6; ctx.textAlign = 'center'; ctx.fillText('00', x, y - 12);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(x + 12, y - 1, 9, 2.5, 0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  itBasilPot(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#e8424a'; ctx.fillRect(x - 8, y - 12, 16, 12); ctx.strokeRect(x - 8, y - 12, 16, 12);
    ctx.fillStyle = BASIL; for (const [dx, dy, a] of [[-5, -18, -0.5], [5, -19, 0.5], [0, -24, 0], [-2, -14, -1], [3, -14, 1]]) { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 3.5, 6, a + Math.sin(t * 1.5) * 0.05, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  },
  itPizzaBoxes(ctx, x, y, t, th, d) {
    const n = 3 + (((d && d.seed) || 0) % 3);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    for (let k = 0; k < n; k++) { ctx.fillStyle = k % 2 ? '#e8dcc0' : '#f2e8d0'; ctx.fillRect(x - 18 + (k % 2), y - 6 - k * 6, 36, 6); ctx.strokeRect(x - 18 + (k % 2), y - 6 - k * 6, 36, 6); }
    ctx.fillStyle = '#e8424a'; ctx.beginPath(); ctx.arc(x, y - n * 6 + 2, 2.4, 0, TAU); ctx.fill();
    ctx.restore();
  },
  itTomatoCans(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    for (let k = 0; k < 3; k++) { const cx = x - 12 + k * 12, cy = y - (k === 1 ? 32 : 16); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(cx - 5, cy, 10, 16); ctx.strokeRect(cx - 5, cy, 10, 16); ctx.fillStyle = TOMATO; ctx.fillRect(cx - 5, cy + 4, 10, 8); ctx.fillStyle = BASIL; ctx.fillRect(cx - 1, cy + 4, 2, 2); }
    ctx.restore();
  },
  itCheese(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    for (let k = 0; k < 2; k++) { ctx.fillStyle = '#f0c850'; ctx.beginPath(); ctx.ellipse(x, y - 8 - k * 14, 16, 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d8a83a'; ctx.fillRect(x - 16, y - 9 - k * 14, 32, 4); }
    ctx.restore();
  },
  itBarrel(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#b07a40'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.quadraticCurveTo(x - 16, y - 16, x - 12, y - 32); ctx.lineTo(x + 12, y - 32); ctx.quadraticCurveTo(x + 16, y - 16, x + 12, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a6a72'; ctx.fillRect(x - 14, y - 26, 28, 3); ctx.fillRect(x - 14, y - 8, 28, 3);
    ctx.restore();
  },
  itCrateStack(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#c89058'; ctx.fillRect(x - 18, y - 20, 22, 20); ctx.strokeRect(x - 18, y - 20, 22, 20); ctx.fillRect(x + 2, y - 16, 16, 16); ctx.strokeRect(x + 2, y - 16, 16, 16); ctx.fillRect(x - 10, y - 36, 18, 16); ctx.strokeRect(x - 10, y - 36, 18, 16);
    ctx.strokeStyle = '#7a4a24'; ctx.beginPath(); ctx.moveTo(x - 16, y - 18); ctx.lineTo(x + 2, y - 2); ctx.stroke();
    ctx.restore();
  },
  itBellRope(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = '#c8945a'; ctx.lineWidth = 3; const sw = Math.sin(t * 1.2 + x) * 4;
    ctx.beginPath(); ctx.moveTo(x, y - 200); ctx.quadraticCurveTo(x + sw, y - 100, x + sw * 0.6, y - 30); ctx.stroke();
    ctx.fillStyle = '#e8424a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; rr(ctx, x + sw * 0.6 - 4, y - 32, 8, 14, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  itMusicStand(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 34); ctx.moveTo(x - 8, y); ctx.lineTo(x, y - 6); ctx.lineTo(x + 8, y); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.fillStyle = '#f8f0dc'; ctx.save(); ctx.translate(x, y - 40); ctx.rotate(-0.2); ctx.fillRect(-12, -8, 24, 16); ctx.strokeRect(-12, -8, 24, 16); ctx.fillStyle = INK; for (let k = 0; k < 3; k++) ctx.fillRect(-9, -4 + k * 4, 18, 0.8); ctx.restore();
    ctx.restore();
  },
  itRoses(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.strokeStyle = BASIL; ctx.lineWidth = 2; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x + k * 9, y - 14); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.fillStyle = '#e8304a'; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.arc(x + k * 9, y - 17, 4, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#f2e8d0'; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 3, y - 8); ctx.lineTo(x + 3, y - 8); ctx.lineTo(x + 5, y); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  itFootlight(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.fillStyle = 'rgba(255,230,150,0.12)'; ctx.beginPath(); ctx.moveTo(x - 6, y - 8); ctx.lineTo(x - 50, y - 150); ctx.lineTo(x + 50, y - 150); ctx.lineTo(x + 6, y - 8); ctx.fill();
    ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x - 7, y - 8); ctx.lineTo(x + 7, y - 8); ctx.lineTo(x + 10, y); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.ellipse(x, y - 8, 7, 3, 0, Math.PI, TAU); ctx.fill();
    ctx.restore();
  },
  itCupStack(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    for (let k = 0; k < 4; k++) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 8, y - k * 9); ctx.lineTo(x - 6, y - 8 - k * 9); ctx.lineTo(x + 6, y - 8 - k * 9); ctx.lineTo(x + 8, y - k * 9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - 6, y - 5 - k * 9, 12, 1.5); }
    ctx.restore();
  },
  itCornetti(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y - 2, 18, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#e8a050'; ctx.beginPath(); ctx.moveTo(x - 14 + k * 10, y - 4); ctx.quadraticCurveTo(x - 9 + k * 10, y - 16, x - 4 + k * 10, y - 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  },
  itSugar(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.fillStyle = '#d8dce4'; rr(ctx, x - 8, y - 16, 16, 16, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9aa0aa'; ctx.fillRect(x - 3, y - 20, 6, 4);
    ctx.restore();
  }
};
const decorLights = { itStreetLamp: [70, '#fff2b0', 74], itFootlight: [90, '#ffe8a0', 40] };

/* ---------------- small shared drawings ---------------- */
const ItArt = {
  // a little round scooter with no brand: deck, two small wheels, a stem and handlebars. x, y = between the wheels on
  // the ground; dir = facing; lean = tilt (radians); boost = puff of exhaust
  scooter(ctx, x, y, dir, col, lean, boost, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1); ctx.rotate(lean || 0); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
    // the rear body (a rounded cowl over the back wheel) and the floor deck
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-20, -8); ctx.quadraticCurveTo(-24, -22, -10, -22); ctx.lineTo(-2, -22); ctx.quadraticCurveTo(2, -14, -2, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a4a3a'; rr(ctx, -16, -27, 14, 6, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = shade(col, -0.2); rr(ctx, -6, -10, 22, 4, 2); ctx.fill(); ctx.stroke();
    // the front shield and stem
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(12, -8); ctx.quadraticCurveTo(18, -24, 16, -36); ctx.lineTo(20, -36); ctx.quadraticCurveTo(24, -22, 20, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#3a3a44'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(18, -36); ctx.lineTo(19, -42); ctx.moveTo(12, -42); ctx.lineTo(25, -42); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = '#fff2b0'; ctx.beginPath(); ctx.arc(21, -30, 3, 0, TAU); ctx.fill(); ctx.stroke();
    // the wheels (spinning spokes)
    for (const wx of [-14, 17]) { ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(wx, -5, 5.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.arc(wx, -5, 2.4, 0, TAU); ctx.fill(); if (t != null) { ctx.strokeStyle = '#c8ccd4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(wx, -5); ctx.lineTo(wx + Math.cos(t * 30) * 5, -5 + Math.sin(t * 30) * 5); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; } }
    if (boost) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < 3; k++) { const ph = ((t || 0) * 4 + k / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(-24 - ph * 22, -8 - ph * 6, 3 + ph * 5, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    ctx.restore();
  },
  // an espresso cup on its saucer
  cup(ctx, x, y, s, full) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 3.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-7, -13); ctx.lineTo(7, -13); ctx.lineTo(8, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(10, -8, 3.5, -1.2, 1.2); ctx.stroke();
    if (full) { ctx.fillStyle = '#6a3a1e'; ctx.beginPath(); ctx.ellipse(0, -13, 7, 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#c8945a'; ctx.beginPath(); ctx.ellipse(-1, -13, 4, 1.2, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a musical note (a quaver)
  note(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col || INK;
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 3.6, -0.4, 0, TAU); ctx.fill();
    ctx.fillRect(3.6, -16, 1.8, 16); ctx.beginPath(); ctx.moveTo(5.4, -16); ctx.quadraticCurveTo(12, -12, 10, -5); ctx.quadraticCurveTo(10, -10, 5.4, -11); ctx.fill();
    ctx.restore();
  }
};

/* ---------------- the critters ---------------- */
// a plump city pigeon: grey, a shimmering green-purple neck, orange eye; it struts and bobs, then flaps up and dives
const pigeonArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const fl = m === 'fly' || m === 'swoop', f = fl ? Math.sin(t * 18) : 0;
  ctx.fillStyle = '#9aa0b4'; ctx.beginPath(); ctx.ellipse(-2, 0, 12, 8, 0.1, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6a7088'; ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-20, 2); ctx.lineTo(-11, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  // the wing
  ctx.fillStyle = '#b8bccc'; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-14, -8 - f * 14, -20, -4 - f * 16); ctx.quadraticCurveTo(-10, 2, -2, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a4a5a'; ctx.fillRect(-12, -2 - f * 6, 6, 1.6);
  // the neck and head
  const bob = fl ? 0 : Math.sin(t * 10) * 2;
  ctx.fillStyle = '#5aa88a'; ctx.beginPath(); ctx.ellipse(6 + bob * 0.5, -6, 5, 6, 0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8a6ab8'; ctx.beginPath(); ctx.ellipse(5 + bob * 0.5, -3, 4, 3, 0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#9aa0b4'; ctx.beginPath(); ctx.arc(9 + bob, -11, 5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(13 + bob, -12); ctx.lineTo(18 + bob, -10); ctx.lineTo(13 + bob, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.arc(10 + bob, -12, 1.8, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(10.4 + bob, -12, 0.8, 0, TAU); ctx.fill();
  if (!fl) { ctx.strokeStyle = '#e86a6a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-2, 7); ctx.lineTo(-3, 11); ctx.moveTo(3, 7); ctx.lineTo(4, 11); ctx.stroke(); }
  ctx.restore();
};
// a scruffy alley cat, ginger with a notched ear; it crouches (tail up, wiggling) and pounces
const catArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const crouch = m === 'notice', run = m === 'charge', sy = crouch ? 4 : 0, st = run ? Math.sin(t * 24) * 4 : Math.sin(t * 9) * 2;
  // tail
  ctx.strokeStyle = '#e8923a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-12, -10 + sy); ctx.quadraticCurveTo(-22, -16 - (crouch ? Math.sin(t * 20) * 4 : 0), -18, -26 + (run ? 10 : 0)); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  // legs, body
  ctx.fillStyle = '#e8923a';
  ctx.fillRect(-10 + st, -6, 4, 6); ctx.fillRect(6 - st, -6, 4, 6);
  ctx.beginPath(); ctx.ellipse(-1, -11 + sy, 14, 7 - sy * 0.3, run ? -0.1 : 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#b86a1a'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-8 + k * 6, -17 + sy); ctx.lineTo(-6 + k * 6, -12 + sy); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  // head with ears (one notched)
  const hx = 13, hy = -16 + sy * 1.2;
  ctx.fillStyle = '#e8923a'; ctx.beginPath(); ctx.moveTo(hx - 7, hy - 4); ctx.lineTo(hx - 6, hy - 14); ctx.lineTo(hx - 1, hy - 7); ctx.moveTo(hx + 7, hy - 4); ctx.lineTo(hx + 5, hy - 13); ctx.lineTo(hx + 3, hy - 10); ctx.lineTo(hx + 2, hy - 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(hx, hy, 8, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f8e8c8'; ctx.beginPath(); ctx.ellipse(hx + 3, hy + 3, 4.5, 3.2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = crouch || run ? '#d8f04a' : '#c8e04a'; ctx.beginPath(); ctx.ellipse(hx + 1, hy - 2, 2.2, crouch ? 1.2 : 2.4, 0, 0, TAU); ctx.ellipse(hx + 6, hy - 2, 2, crouch ? 1.2 : 2.4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = INK; ctx.fillRect(hx + 0.5, hy - 3.4, 1.2, 2.8); ctx.fillRect(hx + 5.6, hy - 3.4, 1.2, 2.8);
  ctx.fillStyle = '#ff7a8a'; ctx.beginPath(); ctx.arc(hx + 5, hy + 1.6, 1.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(hx + 7, hy + 3); ctx.lineTo(hx + 13, hy + 2); ctx.moveTo(hx + 7, hy + 4); ctx.lineTo(hx + 13, hy + 5); ctx.stroke();
  ctx.restore();
};
// a meatball: lumpy, brown, a dollop of tomato sauce and a basil leaf on top, bushy eyebrows; rolls when roused
const meatballArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const r = (e.w || 24) / 2 + 1, cy = -r;
  ctx.save(); ctx.translate(0, cy);
  if (m === 'roll') ctx.rotate((e.x || 0) / r);
  else if (m === 'curl') ctx.rotate(Math.sin(t * 40) * 0.12);
  ctx.fillStyle = '#8a4a2a'; ctx.beginPath(); for (let k = 0; k <= 12; k++) { const a = k / 12 * TAU, rr2 = r + Math.sin(k * 2.7) * 1.5; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6a3418'; for (const [dx, dy] of [[-5, 4], [4, 6], [6, -2], [-6, -4]]) { ctx.beginPath(); ctx.arc(dx, dy, 1.8, 0, TAU); ctx.fill(); }
  if (m !== 'roll') {
    ctx.restore(); ctx.save(); ctx.translate(0, cy);
    ctx.fillStyle = '#d82a1a'; ctx.beginPath(); ctx.moveTo(-r * 0.8, -r * 0.45); ctx.quadraticCurveTo(0, -r * 1.25, r * 0.8, -r * 0.45); ctx.quadraticCurveTo(r * 0.5, -r * 0.2, r * 0.3, -r * 0.35); ctx.quadraticCurveTo(0, -r * 0.1, -r * 0.4, -r * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = BASIL; ctx.beginPath(); ctx.ellipse(2, -r * 0.95, 4, 2.2, -0.4, 0, TAU); ctx.fill(); ctx.stroke();
    const d = e.dir || 1;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(d * 3 - 3, 0, 3, 0, TAU); ctx.arc(d * 3 + 4, 0, 3, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(d * 4 - 3, 0.5, 1.4, 0, TAU); ctx.arc(d * 4 + 4, 0.5, 1.4, 0, TAU); ctx.fill();
    ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(d * 3 - 7, -4 - (m === 'curl' ? 2 : 0)); ctx.lineTo(d * 3 - 1, -3); ctx.moveTo(d * 3 + 8, -4 - (m === 'curl' ? 2 : 0)); ctx.lineTo(d * 3 + 2, -3); ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
};
// a moka pot: an eight-sided aluminium stovetop pot on little feet; the lid rattles (the tell), then it spits coffee
const mokaArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const hot = m === 'throw', sh = hot ? Math.sin(t * 50) * 1.2 : 0;
  ctx.fillStyle = '#2a2a34'; ctx.fillRect(-8, -3, 4, 3); ctx.fillRect(4, -3, 4, 3);
  ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(-10, -3); ctx.lineTo(-7, -15); ctx.lineTo(7, -15); ctx.lineTo(10, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9aa0ac'; ctx.fillRect(-9, -17, 18, 3); ctx.strokeRect(-9, -17, 18, 3);
  ctx.fillStyle = '#d8dce4'; ctx.beginPath(); ctx.moveTo(-8, -17); ctx.lineTo(-6, -30); ctx.lineTo(6, -30); ctx.lineTo(8, -17); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-4, -28, 2, 10); ctx.fillRect(-4, -13, 2, 8);
  // the spout and the lid with its knob (rattling)
  ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(6, -28); ctx.lineTo(13, -31); ctx.lineTo(8, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b8bec8'; ctx.beginPath(); ctx.ellipse(sh, -31 - (hot ? Math.abs(sh) * 2 : 0), 7, 2.4, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.arc(sh, -34 - (hot ? Math.abs(sh) * 2 : 0), 2, 0, TAU); ctx.fill();
  // the handle
  ctx.fillStyle = '#2a2a34'; ctx.beginPath(); ctx.moveTo(-6, -28); ctx.lineTo(-15, -27); ctx.lineTo(-15, -18); ctx.lineTo(-7, -19); ctx.lineTo(-7, -21); ctx.lineTo(-12, -21); ctx.lineTo(-12, -25); ctx.lineTo(-6, -25); ctx.closePath(); ctx.fill();
  // a face: grumpy eyes on the upper chamber
  K.eyes(ctx, 1, -23, 1, 3.6, 1.6, hot);
  if (hot) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 3; k++) { const ph = (t * 3 + k / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(14 + ph * 6, -33 - ph * 14, 2 + ph * 3, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
  ctx.restore();
};
// a cherry tomato on the hop: shiny red, a green star cap, cheeky face
const tomatoArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); const sq = m === 'flat' ? 0.4 : e.vy < 0 ? 1.12 : e.onGround ? 0.92 : 1; ctx.scale(1, sq); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  ctx.fillStyle = TOMATO; ctx.beginPath(); ctx.ellipse(0, -10, 11, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(-4, -14, 3, 2, -0.6, 0, TAU); ctx.fill();
  ctx.fillStyle = BASIL; ctx.beginPath(); K.star(ctx, 0, -20, 6, 2.4, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; const d = e.dir || 1; ctx.beginPath(); ctx.arc(d * 2 - 2, -10, 1.5, 0, TAU); ctx.arc(d * 2 + 4, -10, 1.5, 0, TAU); ctx.fill();
  ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(d * 2 + 1, -7, 3, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.restore();
};
// a sour note: a grumpy black quaver that flaps its flag and dives at Brady (14-4)
const noteArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = '#fff2c8'; ctx.lineWidth = 1.4;
  const f = Math.sin(t * 14);
  ctx.fillStyle = '#1a1426'; ctx.beginPath(); ctx.ellipse(-3, 6, 9, 6.5, -0.4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillRect(4, -14, 3, 20); ctx.strokeRect(4, -14, 3, 20);
  ctx.beginPath(); ctx.moveTo(7, -14); ctx.quadraticCurveTo(16, -10 + f * 4, 14, -2 + f * 3); ctx.quadraticCurveTo(13, -7, 7, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-6, 5, 2.4, 0, TAU); ctx.arc(0, 4, 2.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8424a'; ctx.beginPath(); ctx.arc(-5.4, 5.4, 1.1, 0, TAU); ctx.arc(0.6, 4.4, 1.1, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-9, 1); ctx.lineTo(-4, 2.6); ctx.moveTo(3, 0); ctx.lineTo(-1, 2); ctx.stroke();
  ctx.restore();
};
const enemies = {
  itPigeon: { cls: TourFlyer.make({ w: 28, h: 20, range: 3, speed: 1.1, swoop: true, art: pigeonArt, burst: '#c8ccd8',
    onSwoop: e => { e.g.parts.text(e.cx, e.y - 10, 'COO!', '#ffffff'); K.sfx('coo', 'jump', { vol: 0.25, pitch: 2.2 }); } }), place: 'fly' },
  itCat: { cls: TourEnemy.make({ w: 30, h: 24, speed: 0.8, behavior: 'charge', range: 7, chargeSpeed: 6.2, windup: 0.6, chargeT: 1.1, art: catArt, burst: '#e8923a',
    onNotice: e => { e.g.parts.text(e.cx, e.y - 12, 'MRRAOW!', '#ffe28a'); K.sfx('meow', 'bump', { vol: 0.45, pitch: 1.9 }); } }), place: 'walk' },
  itMeatball: { cls: TourEnemy.make({ w: 24, h: 24, speed: 0.9, behavior: 'roll', range: 7, rollSpeed: 6.5, rollT: 2.2, art: meatballArt, burst: '#8a4a2a' }), place: 'walk' },
  itMoka: { cls: TourEnemy.make({ w: 22, h: 32, speed: 0.6, behavior: 'throw', pace: true, range: 9, every: 2.6, art: mokaArt, burst: '#c8ccd4',
    shoot: (e, p) => {
      // the lid rattles for 0.35 s (st), then a hot arc of coffee drops
      const g = e.g; K.sfx('hiss', 'fire', { vol: 0.35, pitch: 1.6 });
      setTimeout0(g, 0.35, () => { if (e.dead || e.remove) return; for (let k = 0; k < 2; k++) tourFire(g, e.cx + e.dir * 10, e.y + 4, { vx: e.dir * (3.2 + k * 1.6) * TS, vy: -8 * TS, grav: PHYS.gDown * 0.5, w: 12, h: 12, life: 2.4, thru: true, col: '#5a3a1e', art: dropArt }); });
    } }), place: 'walk' },
  itTomato: { cls: TourEnemy.make({ w: 22, h: 22, speed: 1.0, behavior: 'hop', hopV: 10, hopEvery: 1.1, art: tomatoArt, burst: '#e83a2a' }), place: 'walk' },
  itNote: { cls: TourFlyer.make({ w: 24, h: 24, range: 3, speed: 1.3, swoop: true, art: noteArt, burst: '#1a1426',
    onSwoop: e => { e.g.parts.text(e.cx, e.y - 10, '♭!', '#fff2c8'); K.sfx('sour', 'bump', { vol: 0.3, pitch: 0.6 }); } }), place: 'fly' }
};
// a coffee drop (the moka pot's shot)
const dropArt = (ctx, s) => { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.fillStyle = '#6a3a1e'; ctx.beginPath(); ctx.arc(s.x + s.w / 2, s.y + s.h / 2 + 1, 5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c8945a'; ctx.beginPath(); ctx.arc(s.x + s.w / 2 - 1.5, s.y + s.h / 2 - 1, 1.6, 0, TAU); ctx.fill(); ctx.restore(); };
// a delayed call in game time (an entity-free timer: it ticks with the scene)
function setTimeout0(g, sec, fn) { (g.itTimers || (g.itTimers = [])).push({ t: sec, fn }); }
TourHooks.on('playUpdate', (play, dt) => { const L = play.itTimers; if (!L || !L.length) return; for (let k = L.length - 1; k >= 0; k--) { L[k].t -= dt; if (L[k].t <= 0) { const f = L[k].fn; L.splice(k, 1); f(); } } });

/* ---------------- door looks ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'itGarage') {
      // a rolled-down garage shutter with a little door in it (green paint, a geranium pot by it)
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#5a9a6a'; ctx.fillRect(x - 24, y - 66, 48, 66); ctx.strokeRect(x - 24, y - 66, 48, 66);
      ctx.fillStyle = '#4a8a5a'; for (let k = 0; k < 10; k++) ctx.fillRect(x - 24, y - 62 + k * 6, 48, 2);
      ctx.fillStyle = near ? '#2a1a14' : '#3a6a4a'; rr(ctx, x - 9, y - 40, 18, 40, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(x + 5, y - 20, 1.8, 0, TAU); ctx.fill();
      ctx.restore(); return;
    }
    if (look === 'itPantry') {
      // a pantry door: cream boards, a little round window, a hanging string of chillies
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#f2e8d0'; rr(ctx, x - 20, y - 64, 40, 64, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = near ? '#2a1a14' : '#8ac8f0'; ctx.beginPath(); ctx.arc(x, y - 46, 8, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8424a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + 26, y - 56 + k * 9, 2.4, 4.5, 0.2, 0, TAU); ctx.fill(); }
      ctx.restore(); return;
    }
    if (look === 'itStageDoor') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#4a2814'; rr(ctx, x - 22, y - 70, 44, 70, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(x, y - 62); K.star(ctx, x, y - 50, 9, 4, 5); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff2c8'; ctx.font = TourBackstage.F6; ctx.textAlign = 'center'; ctx.fillText('STAGE', x, y - 28);
      ctx.restore(); return;
    }
    if (look === 'itTowerDoor') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#e8dcc0'; ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x - 24, y - 44); ctx.arc(x, y - 44, 24, Math.PI, 0); ctx.lineTo(x + 24, y); ctx.fill(); ctx.stroke();
      ctx.fillStyle = near ? '#2a1a14' : '#7a5430'; ctx.beginPath(); ctx.moveTo(x - 17, y); ctx.lineTo(x - 17, y - 42); ctx.arc(x, y - 42, 17, Math.PI, 0); ctx.lineTo(x + 17, y); ctx.fill(); ctx.stroke();
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the route map: a tiny leaning tower in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save(); ctx.translate(x, y + r * 0.6); ctx.rotate(0.22 + Math.sin(t * 1.5) * 0.03); ctx.fillStyle = '#ffffff';
  ctx.fillRect(-r * 0.25, -r * 1.25, r * 0.5, r * 1.25);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 1; k < 5; k++) ctx.fillRect(-r * 0.3, -k * r * 0.25, r * 0.6, 1);
  ctx.restore();
};

/* ---------------- the land's map art: a boot of a peninsula ---------------- */
Object.assign(TourOWPaint.art, {
  itTower(c, r) { c.save(); c.rotate(0.12); c.fillStyle = '#f4ecd8'; c.fillRect(-r * 0.22, -r * 1.6, r * 0.44, r * 1.6); c.strokeRect(-r * 0.22, -r * 1.6, r * 0.44, r * 1.6); c.strokeStyle = 'rgba(0,0,0,0.35)'; for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(-r * 0.22, -k * r * 0.27); c.lineTo(r * 0.22, -k * r * 0.27); c.stroke(); } c.restore(); },
  itPizza(c, r) { c.fillStyle = '#e8b04a'; c.beginPath(); c.arc(0, -r * 0.5, r * 0.6, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#e83a2a'; c.beginPath(); c.arc(0, -r * 0.5, r * 0.46, 0, TAU); c.fill(); c.fillStyle = '#ffffff'; for (const [dx, dy] of [[-0.2, -0.6], [0.2, -0.4], [0, -0.75]]) { c.beginPath(); c.arc(dx * r, dy * r, r * 0.1, 0, TAU); c.fill(); } },
  itOpera(c, r) { c.fillStyle = '#f2e8d0'; c.fillRect(-r * 0.8, -r, r * 1.6, r); c.strokeRect(-r * 0.8, -r, r * 1.6, r); c.fillStyle = '#e0502e'; c.beginPath(); c.moveTo(-r * 0.9, -r); c.lineTo(0, -r * 1.5); c.lineTo(r * 0.9, -r); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#7a1420'; for (let k = -1; k <= 1; k++) c.fillRect(k * r * 0.45 - r * 0.1, -r * 0.7, r * 0.2, r * 0.7); },
  itCypress(c, r) { c.fillStyle = CYPRESS; c.beginPath(); c.moveTo(0, -r * 1.4); c.quadraticCurveTo(r * 0.3, -r * 0.6, r * 0.18, 0); c.lineTo(-r * 0.18, 0); c.quadraticCurveTo(-r * 0.3, -r * 0.6, 0, -r * 1.4); c.fill(); c.stroke(); },
  itCup(c, r) { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-r * 0.5, -r * 0.8); c.lineTo(r * 0.5, -r * 0.8); c.lineTo(r * 0.4, 0); c.lineTo(-r * 0.4, 0); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.arc(r * 0.6, -r * 0.45, r * 0.2, -1.3, 1.3); c.stroke(); },
  itVolcano(c, r) { c.fillStyle = '#8a6a5a'; c.beginPath(); c.moveTo(-r, 0); c.lineTo(-r * 0.2, -r * 0.9); c.lineTo(r * 0.2, -r * 0.9); c.lineTo(r, 0); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(0, -r * 1.15, r * 0.22, 0, TAU); c.arc(r * 0.2, -r * 1.35, r * 0.18, 0, TAU); c.fill(); }
});
// the map's ground: the lines of the fields, the cobbled piazza at the airstrip, the coast road
TourOWScenes.groundPaint.it = function (c, ow) {
  const R = TourOWPaint.rng('itground'), ink = TourOWPaint.INK;
  c.lineJoin = 'round'; c.lineCap = 'round';
  // vineyard and field stripes on the hills of the boot
  c.strokeStyle = 'rgba(120,150,70,0.35)'; c.lineWidth = 2;
  for (let k = 0; k < 16; k++) { const x = 340 + R() * 700, y = 170 + R() * 420; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 40, y + 12); c.stroke(); c.beginPath(); c.moveTo(x, y + 6); c.lineTo(x + 40, y + 18); c.stroke(); }
  // a ring of terracotta roofs around the piazza
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, x = 340 + Math.cos(a) * 46, y = 236 + Math.sin(a) * 26; c.fillStyle = k % 2 ? '#d8693a' : '#e8b04a'; c.fillRect(x - 7, y - 6, 14, 10); c.strokeStyle = ink; c.lineWidth = 1.2; c.strokeRect(x - 7, y - 6, 14, 10); }
};
TourLandscape.looks.it = ['#4aa8e8', '#8ad0f8', '#a8c87a', '#e8b04a', '#d8693a', '#ffd24a', 'tower'];

/* ---------------- music ----------------
   tour_it: a bouncy mandolin tarantella for the alleys; tour_it_pizza: a cheerful accordion waltz in the kitchen;
   tour_it_tower: a creaking, rocking bell tune; tour_it_opera: a lush aria over strings; tour_it_doppio: a double-time
   espresso gallop; tour_it_boss: a grand operatic march for the meatball tenor. */
const tracks = {
  tour_it: {
    bpm: 150, bpb: 3, bars: 8, rv: 0.25, hx: 0.05,
    ch: 'Am Am Dm E7 Am Am E7 Am',
    ld: 'E5:2 A5:2 C6:2 | E6:2 D6:2 C6:2 | D6:2 F6:2 A6:2 | G#6:4 E6:2 | A6:2 G6:2 E6:2 | C6:2 B5:2 A5:2 | B5:2 D6:2 G#6:2 | A6:6',
    li: 'pluck', lv: 0.14,
    bp: 'r.f.f.', bi: 'pluckb', bv: 0.3,
    ap: 'c.c.c.', ai: 'harp', av: 0.05, ao: 62,
    dr: ['k.....', '..s.s.', 'h.h.h.'], dv: 0.3
  },
  tour_it_pizza: {
    bpm: 132, bpb: 3, bars: 8, rv: 0.3, hx: 0.04,
    ch: 'C C G7 G7 G7 G7 C C',
    ld: 'E5:4 G5:2 | C6:4 E6:2 | D6:4 F5:2 | D6:4 B5:2 | G5:2 B5:2 D6:2 | F6:4 E6:2 | E6:2 D6:2 C6:2 | C6:6',
    li: 'reed', lv: 0.14,
    bp: 'r.f.f.', bi: 'pluckb', bv: 0.28,
    ap: '..c.c.', ai: 'reed', av: 0.05, ao: 60,
    dr: ['k.....', '..s.s.', 'h.h.h.'], dv: 0.26
  },
  tour_it_tower: {
    bpm: 96, bars: 8, rv: 0.45, dl: 0.2, hx: 0.04,
    ch: 'F C Dm Bb F C Bb C',
    ld: 'A5:4 C6:4 F6:8 | G6:4 E6:4 C6:8 | D6:4 F6:4 A6:4 F6:4 | D6:8 .:8 | A5:4 C6:4 F6:4 A6:4 | G6:8 E6:8 | F6:4 D6:4 Bb5:4 D6:4 | C6:12 .:4',
    li: 'bell', lv: 0.13,
    bp: 'r...r...r...f...', bi: 'sub', bv: 0.26,
    ap: 'c.......c.......', ai: 'bigbell', av: 0.06, ao: 50,
    dr: ['k.......k.......', '........s.......', 'h...h...h...h...'], dv: 0.24
  },
  tour_it_opera: {
    bpm: 84, bpb: 3, bars: 8, rv: 0.55, dl: 0.15, hx: 0.04,
    ch: 'Eb Eb Ab Bb Eb Cm Ab Bb',
    ld: 'G5:4 Bb5:2 | Eb6:6 | C6:4 Eb6:2 | D6:6 | Bb5:4 G5:2 | C6:4 Eb6:2 | G6:3 F6:1 Eb6:2 | F6:6',
    li: 'strings', lv: 0.16,
    bp: 'r.....', bi: 'sub', bv: 0.24,
    ap: 'c.c.c.', ai: 'harp', av: 0.05, ao: 58,
    dr: ['k.....', '......', '..h...'], dv: 0.12
  },
  tour_it_doppio: {
    bpm: 184, bars: 8, rv: 0.2, hx: 0.06,
    ch: 'Dm Dm A7 A7 Dm Dm A7 Dm',
    ld: 'A5:2 D6:2 F6:2 A6:2 F6:2 D6:2 A5:4 | A5:2 D6:2 F6:2 A6:2 Bb6:4 A6:4 | G6:2 E6:2 C#6:2 E6:2 G6:4 E6:4 | A6:2 G6:2 F6:2 E6:2 C#6:8 |' +
        'D6:2 F6:2 A6:2 D7:2 A6:4 F6:4 | D6:2 E6:2 F6:2 G6:2 A6:8 | Bb6:2 A6:2 G6:2 F6:2 E6:4 C#6:4 | D6:8 .:8',
    li: 'pluck', lv: 0.13,
    bp: 'r.f.r.f.r.f.r.f.', bi: 'pluckb', bv: 0.3,
    ap: 'c.c.c.c.c.c.c.c.', ai: 'harp', av: 0.04, ao: 62,
    dr: ['k...k...k...k...', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.38
  },
  tour_it_boss: {
    bpm: 120, bars: 8, rv: 0.35, hx: 0.06,
    ch: 'Cm Cm Ab G Cm Fm G G7',
    ld: 'G5:4 C6:4 Eb6:4 G6:4 | F6:6 Eb6:2 D6:8 | C6:4 Eb6:4 Ab6:4 C7:4 | B6:8 G6:8 | G6:4 Eb6:4 C6:4 G5:4 | Ab5:4 C6:4 F6:4 Ab6:4 | G6:4 F6:4 Eb6:4 D6:4 | G6:12 .:4',
    li: 'brass', lv: 0.15,
    bp: 'r...r.f.r...r.f.', bi: 'sawb', bv: 0.28,
    ap: 'c...c...c...c...', ai: 'strings', av: 0.06, ao: 55,
    dr: ['k.......k.k.....', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.4
  }
};

/* the level types' map labels (§4) */
Object.assign(TourLandscape.ARCH_LABEL, { scoot: 'SCOOT', dough: 'DOUGH', lean: 'LEAN', aria: 'ARIA', espresso: 'DOPPIO' });

const COIN = { name: 'GOLDEN LIRA', draw(ctx, x, y) {
  const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 9); g.addColorStop(0, '#fff6c0'); g.addColorStop(0.6, '#ffd24a'); g.addColorStop(1, '#c8901a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#a8701a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#a8701a'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('L', x, y + 0.5);
  ctx.textBaseline = 'alphabetic';
} };

Tour.country({
  id: 'it', colors: COL, tagline: 'Cobbles, kitchens and a leaning tower that will not stay straight',
  themes, painters, decor, decorLights, enemies,
  music: { level: 'tour_it', boss: 'tour_it_boss', map: null }, tracks,
  landmark: 'the leaning tower',
  arrival: 'Ciao, Brady! Piwi "fixed" the leaning tower: it was standing up straight for a week, then it popped back crooked. The opera never got the cancellation note either, and the tenor is a meatball. Hop on a scooter! ♥ C',
  emblem, coin: COIN,
  levels: []
});
// for the other Italy files and the tests
Tour.itKit = { ItArt, INK, COL, setTimeout0, TERRA, OCHRE, CREAM, SHUTTER, TOMATO, BASIL, CYPRESS };
})();
