/* ============================================================
   AUSTRALIA (world 16, cc 'au'): the third land of the Encore Tour (docs/design/ENCORE_TOUR.md).
   The outback and the coast. The humour is animals and objects only: kangaroos, wombats, emus, magpies, cockatoos,
   kookaburras, platypuses, yabbies, a huntsman spider (friendly-funny, never scary), road trains with no names on
   them, the roadside "big things", and the drop-bear tall tale, which turns out to be true. No people, no sacred
   sites, no cultural objects.
   This file: the looks (themes, painted backdrops, tiles, props), the critters, the country itself, music, the
   route-map emblem. The moving parts, the pieces, the validator's models of them and the boss:
   29_tour_au_kit.js. The levels and the land's map: 29_tour_au_levels.js.
   ============================================================ */
(function () {
const COL = { a: '#e85a2a', b: '#2a8ac8', c: '#ffc83a' };
const INK = '#1e1410';
const RED = '#c8582a', RED2 = '#a8441e', OCHRE = '#e89a4a', SAND = '#f0c888', GUM = '#8aa87a', GUMD = '#5a7a5a';
const BARK = '#d8d0c0', BARK2 = '#a89a88';

/* ---------------- tiles ---------------- */
// the red centre: red earth with pebbles, a cap of spinifex tufts and dry grass; sandstone ledges; termite clay
const earth = {
  style: 'grass', cap: '#d8a04a', capHi: '#f0c86a', dirt: RED, dirt2: RED2, rock: '#8a3a1a',
  paint(ctx, rng) {
    ctx.fillStyle = RED; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#d8683a'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(rng() * TS, rng() * TS, 5 + rng() * 5, 2 + rng() * 2, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#7a2e12'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(rng() * TS, rng() * TS, 1.2 + rng() * 1.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, TS - 3, TS, 3);
  },
  paintCap(ctx, x0, x1, rng) {
    ctx.fillStyle = '#9a4a20'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#e07a3a'; ctx.fillRect(x0, 0, x1 - x0, 6);
    // spinifex tufts: spiky yellow-green clumps along the top
    for (let x = x0 + 4; x < x1 - 2; x += 9 + Math.floor(rng() * 6)) {
      ctx.strokeStyle = rng() < 0.5 ? '#c8b84a' : '#a8a84a'; ctx.lineWidth = 1.3;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x + k * 2.4, -2 - Math.abs(2 - Math.abs(k)) * 1.5); ctx.stroke(); }
    }
    ctx.fillStyle = INK; ctx.fillRect(x0, 8, x1 - x0, 1);
  }
};
const ledge = {
  style: 'plank', c1: '#e8b06a', c2: '#a8682a',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#a8682a'; ctx.fillRect(x0, 0, x1 - x0, 11);
    ctx.fillStyle = '#e8b06a'; ctx.fillRect(x0, 0, x1 - x0, 5);
    ctx.fillStyle = '#c88a4a'; for (let x = x0 + 5; x < x1; x += 13) ctx.fillRect(x, 6, 7, 2);
    ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5); ctx.fillRect(x0, 0, x1 - x0, 1.2);
  }
};
const mound = {
  style: 'clay', c1: '#d88a4a', c2: '#a8582a', mortar: '#6a3010',
  paint(ctx) {
    ctx.fillStyle = '#c8783a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#e09a5a'; ctx.beginPath(); ctx.ellipse(10, 9, 7, 5, 0.3, 0, TAU); ctx.ellipse(24, 22, 6, 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6a3010'; for (const [x, y] of [[8, 22], [20, 8], [26, 14]]) { ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const sandstone = {
  c1: '#d87a4a', c2: '#9a4a2a',
  paint(ctx) {
    ctx.fillStyle = '#c8683a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#e08a5a'; ctx.fillRect(0, 3, TS, 5); ctx.fillRect(0, 16, TS, 4);
    ctx.fillStyle = '#9a4a2a'; ctx.fillRect(0, 12, TS, 2); ctx.fillRect(0, 26, TS, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the road train: chequer-plate steel decks, a tarp rail as the one-way, hay bales, the chassis in red
const deck = {
  style: 'metal', cap: '#c8ccd4', capHi: '#eef0f4', dirt: '#6a7078', dirt2: '#4a5058', rock: '#3a4048',
  paint(ctx) {
    ctx.fillStyle = '#5a6068'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#6a7078'; ctx.fillRect(0, 0, TS, 4);
    ctx.fillStyle = '#4a5058'; for (let y = 8; y < TS; y += 8) ctx.fillRect(0, y, TS, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(TS - 2, 0, 2, TS);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#7a8088'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#d8dce2'; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = '#9aa0a8'; for (let x = x0 + 2; x < x1; x += 6) { ctx.fillRect(x, 1.5, 3, 1.2); ctx.fillRect(x + 3, 3.5, 3, 1.2); }
    ctx.fillStyle = '#ffc83a'; for (let x = x0; x < x1; x += 32) ctx.fillRect(x + 12, 6.5, 8, 2);
    ctx.fillStyle = INK; ctx.fillRect(x0, 8, x1 - x0, 1);
  }
};
const tarp = {
  style: 'rail', c1: '#ffd84a', c2: '#a88a2a',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#5a6068'; ctx.fillRect(x0, 3, x1 - x0, 6);
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = INK; for (let x = x0 + 8; x < x1; x += 16) ctx.fillRect(x, 0, 6, 4);
    ctx.fillRect(x0, 9, x1 - x0, 1.5);
  }
};
const hay = {
  style: 'hay', c1: '#f0d070', c2: '#c8a040', mortar: '#8a6a20',
  paint(ctx) {
    ctx.fillStyle = '#e8c860'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1; for (let y = 3; y < TS; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TS, y + 1.5); ctx.stroke(); }
    ctx.fillStyle = '#8a4a2a'; ctx.fillRect(8, 0, 2, TS); ctx.fillRect(TS - 10, 0, 2, TS);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const chassis = {
  c1: '#d83a2a', c2: '#8a1a12',
  paint(ctx) {
    ctx.fillStyle = '#c8322a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#e85a4a'; ctx.fillRect(2, 2, TS - 4, 5);
    ctx.fillStyle = '#8a1a12'; ctx.fillRect(0, TS - 5, TS, 5);
    ctx.fillStyle = '#d8dce2'; for (const [x, y] of [[5, 12], [TS - 7, 12], [5, TS - 10], [TS - 7, TS - 10]]) { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the creek at night: a dark mud bank with roots, a log as the one-way, river stones, bark
const bank = {
  style: 'mud', cap: '#4a6a4a', capHi: '#6a8a5a', dirt: '#3a2a22', dirt2: '#2a1e18', rock: '#2a221e',
  paint(ctx, rng) {
    ctx.fillStyle = '#3a2a22'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 1.5; if (rng() < 0.5) { ctx.beginPath(); ctx.moveTo(rng() * TS, 0); ctx.quadraticCurveTo(rng() * TS, TS / 2, rng() * TS, TS); ctx.stroke(); }
    ctx.fillStyle = '#4a3a2e'; ctx.beginPath(); ctx.arc(rng() * TS, rng() * TS, 3, 0, TAU); ctx.fill();
  },
  paintCap(ctx, x0, x1, rng) {
    ctx.fillStyle = '#2a3a2a'; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = '#5a8a5a'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.strokeStyle = '#7aa86a'; ctx.lineWidth = 1.2; for (let x = x0 + 3; x < x1; x += 5 + Math.floor(rng() * 4)) { ctx.beginPath(); ctx.moveTo(x, 3); ctx.lineTo(x + 1, -3 - rng() * 3); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.fillRect(x0, 7, x1 - x0, 1.2);
  }
};
const logSemi = {
  style: 'log', c1: '#a87a4a', c2: '#6a4a2a',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#6a4a2a'; rr(ctx, x0, 0, x1 - x0, 11, 5); ctx.fill();
    ctx.fillStyle = '#a87a4a'; ctx.fillRect(x0 + 2, 1, x1 - x0 - 4, 4);
    ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 1; for (let x = x0 + 6; x < x1; x += 11) { ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x + 6, 8); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4; rr(ctx, x0, 0, x1 - x0, 11, 5); ctx.stroke();
  }
};
const stone = {
  style: 'stone', c1: '#6a7a8a', c2: '#3a4a5a', mortar: '#1a2a3a',
  paint(ctx) {
    ctx.fillStyle = '#4a5a6a'; rr(ctx, 1, 1, TS - 2, TS - 2, 7); ctx.fill();
    ctx.fillStyle = '#6a7a8a'; ctx.beginPath(); ctx.ellipse(12, 10, 8, 5, -0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; rr(ctx, 1, 1, TS - 2, TS - 2, 7); ctx.stroke();
  }
};
const snagHard = {
  c1: '#5a4a3a', c2: '#3a2a1e',
  paint(ctx) {
    ctx.fillStyle = '#4a3a2e'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = '#6a5440'; ctx.lineWidth = 2; for (let x = 4; x < TS; x += 7) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 2, TS); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the canopy: pale gum branches (a long horizontal limb is the ground), twigs as the one-way, bark knots, the trunk
const limb = {
  style: 'bark', cap: '#e8e0d0', capHi: '#fffaf0', dirt: BARK, dirt2: BARK2, rock: '#8a7a6a',
  paint(ctx, rng) {
    ctx.fillStyle = BARK; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#c8b8a0'; for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.ellipse(rng() * TS, rng() * TS, 7, 3, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e8b88a'; if (rng() < 0.4) { ctx.beginPath(); ctx.ellipse(rng() * TS, rng() * TS, 5, 2.5, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, TS - 4, TS, 4);
  },
  paintCap(ctx, x0, x1, rng) {
    ctx.fillStyle = '#b8a890'; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = '#f4ece0'; ctx.fillRect(x0, 0, x1 - x0, 5);
    ctx.fillStyle = '#e8a87a'; for (let x = x0 + 6; x < x1; x += 19 + Math.floor(rng() * 9)) ctx.fillRect(x, 1, 9, 2);
    ctx.fillStyle = INK; ctx.fillRect(x0, 8, x1 - x0, 1.2);
  }
};
const twig = {
  style: 'twig', c1: '#d8c8b0', c2: '#8a7a6a',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#9a8a74'; rr(ctx, x0, 1, x1 - x0, 8, 4); ctx.fill();
    ctx.fillStyle = '#efe6d6'; ctx.fillRect(x0 + 1, 1, x1 - x0 - 2, 3);
    ctx.fillStyle = GUM; for (let x = x0 + 8; x < x1; x += 22) { ctx.beginPath(); ctx.ellipse(x, 12, 3, 7, 0.5, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.3; rr(ctx, x0, 1, x1 - x0, 8, 4); ctx.stroke();
  }
};
const hollow = {
  style: 'knot', c1: '#c8b8a0', c2: '#8a7a6a', mortar: '#4a3a2a',
  paint(ctx) {
    ctx.fillStyle = '#c8bca8'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#8a7a6a'; ctx.beginPath(); ctx.ellipse(TS / 2, TS / 2, 8, 10, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.ellipse(TS / 2, TS / 2 + 1, 5, 7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const trunk = {
  c1: '#e0d8c8', c2: '#a89a88',
  paint(ctx) {
    ctx.fillStyle = '#d8d0c0'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#b8a890'; ctx.fillRect(4, 0, 3, TS); ctx.fillRect(18, 0, 2, TS);
    ctx.fillStyle = '#e8a87a'; ctx.fillRect(10, 6, 5, 9);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the big things: a roadside lay-by of fibreglass giants: painted concrete paving, a guard-rail one-way, giant bricks
const pave = {
  style: 'paving', cap: '#e8e0d0', capHi: '#ffffff', dirt: '#c8b89a', dirt2: '#a8987a', rock: '#8a7a5a',
  paint(ctx) {
    ctx.fillStyle = '#d8c8a8'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#c0b090'; ctx.fillRect(0, TS / 2 - 1, TS, 2); ctx.fillRect(TS / 2 - 1, 0, 2, TS / 2); ctx.fillRect(4, TS / 2, 2, TS / 2);
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#5a9a3a'; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = '#8ad05a'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = INK; ctx.fillRect(x0, 7, x1 - x0, 1.2);
  }
};
const rail = {
  style: 'rail', c1: '#ffffff', c2: '#8a8a8a',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#e8eaee'; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x0, 3, x1 - x0, 1.5);
    ctx.fillStyle = '#e8423a'; for (let x = x0 + 4; x < x1; x += 32) ctx.fillRect(x, 0, 6, 7);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.strokeRect(x0, 0.5, x1 - x0, 7);
  }
};
const crate = {
  style: 'fruit', c1: '#ffd84a', c2: '#c89a2a', mortar: '#6a4a10',
  paint(ctx) {
    ctx.fillStyle = '#c8904a'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#e8b06a'; ctx.fillRect(2, 3, TS - 4, 7); ctx.fillRect(2, TS - 10, TS - 4, 7);
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.ellipse(TS / 2, TS / 2, 7, 4, 0.4, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const plinth = {
  c1: '#f2ece0', c2: '#b8ae9a',
  paint(ctx) {
    ctx.fillStyle = '#ece4d2'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(2, 2, TS - 4, 4);
    ctx.fillStyle = '#c8bca4'; ctx.fillRect(0, TS - 4, TS, 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const SET = (ground, semi, brick, hard, pillar, accent, liquid, bloom) => ({ ground, semi, brick, hard, pillar, accent, tint: {}, bloom: bloom || 0.12, liquid: liquid || null });
const outback = SET(earth, ledge, mound, sandstone, { c1: '#e0a060', c2: '#a8602a', cap: '#c8b84a', style: 'column' }, COL.a);
const road = SET(deck, tarp, hay, chassis, { c1: '#9aa0a8', c2: '#5a6068', cap: '#ffd84a', style: 'column' }, COL.c);
const creek = SET(bank, logSemi, stone, snagHard, { c1: '#6a5440', c2: '#3a2a1e', cap: '#5a8a5a', style: 'column' }, '#7affd8', 'mud', 0.2);
const canopy = SET(limb, twig, hollow, trunk, { c1: '#e0d8c8', c2: '#a89a88', cap: GUM, style: 'column' }, '#ffd84a');
const big = SET(pave, rail, crate, plinth, { c1: '#f2ece0', c2: '#b8ae9a', cap: '#e8423a', style: 'column' }, COL.a);
if (typeof LIQUIDS !== 'undefined' && !LIQUIDS.mud) LIQUIDS.mud = ['#3a3a22', '#7a8a4a', '#5a5a32'];

/* ---------------- painted backdrops ---------------- */
// (no lone rock anywhere: the far land is long, low, flat-topped ranges and their eroded scarps)
const painters = {
  // far ranges: long flat-topped ridges in dusty violet and rust, layered, with a scarp face now and then
  auRanges(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    for (let band = 0; band < 2; band++) {
      const col = band ? shade(c, 0.12) : c, top = b - (band ? 70 : 110);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
      let x = 0, y = top + rng() * 20;
      ctx.lineTo(0, y);
      while (x < BG_W) { const run = 60 + rng() * 120; x += run; const ny = top + (rng() - 0.5) * 40; ctx.lineTo(x - 22, y); ctx.lineTo(x, ny); y = ny; }
      ctx.lineTo(BG_W, y); ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(col, -0.12); for (let k = 0; k < 6; k++) ctx.fillRect(rng() * BG_W, top + 30 + rng() * 40, 40 + rng() * 80, 3);
    }
    ctx.fillStyle = shade(c, 0.22); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the near scrub: red sand with spinifex, mulga bushes, gum trees, termite mounds, a windmill and a water tank
  auScrub(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = shade(L.color, 0.1); for (let k = 0; k < 30; k++) ctx.fillRect(rng() * BG_W, b + 6 + rng() * 60, 20 + rng() * 40, 2);
    for (let k = 0; k < 9; k++) {
      const x = rng() * BG_W, h = 40 + rng() * 50;
      wrapDraw(x - 40, 80, X => {
        const cx = X + 40;
        if (k % 3 === 0) { // a gum: pale trunk, grey-green crowns
          ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, b + 4); ctx.quadraticCurveTo(cx - 6, b - h * 0.6, cx + 4, b - h); ctx.stroke();
          ctx.fillStyle = shade(L.leaf || GUM, -0.1); for (const [dx, dy, r] of [[-14, -h - 6, 16], [10, -h - 12, 18], [0, -h - 22, 14]]) { ctx.beginPath(); ctx.arc(cx + dx, b + dy, r, 0, TAU); ctx.fill(); }
        } else if (k % 3 === 1) { // a termite mound
          ctx.fillStyle = shade(L.color, -0.18); ctx.beginPath(); ctx.moveTo(cx - 16, b + 2); ctx.quadraticCurveTo(cx - 10, b - h * 0.7, cx - 3, b - h * 0.8); ctx.lineTo(cx + 2, b - h * 0.6); ctx.quadraticCurveTo(cx + 8, b - h * 0.4, cx + 14, b + 2); ctx.closePath(); ctx.fill();
        } else { // a mulga bush
          ctx.fillStyle = shade(L.leaf || GUM, -0.25); ctx.beginPath(); ctx.ellipse(cx, b - 10, 22, 12, 0, 0, TAU); ctx.fill();
        }
      });
    }
    if (L.windmill) {
      const x = 300 + rng() * 300;
      ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 10, b); ctx.lineTo(x, b - 110); ctx.lineTo(x + 10, b); ctx.moveTo(x - 6, b - 40); ctx.lineTo(x + 6, b - 40); ctx.stroke();
      ctx.fillStyle = '#c8ccd4'; for (let k = 0; k < 12; k++) { const a = k * TAU / 12; ctx.beginPath(); ctx.moveTo(x, b - 112); ctx.lineTo(x + Math.cos(a) * 20, b - 112 + Math.sin(a) * 20); ctx.lineTo(x + Math.cos(a + 0.2) * 20, b - 112 + Math.sin(a + 0.2) * 20); ctx.fill(); }
      ctx.fillStyle = '#9aa0a8'; ctx.fillRect(x + 40, b - 36, 36, 36); ctx.fillStyle = '#c8ccd4'; for (let y = b - 34; y < b; y += 6) ctx.fillRect(x + 40, y, 36, 2);
    }
  },
  // the highway: the far plain with power poles marching along, the bitumen with its broken centre line
  auHighway(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b - 30, BG_W, 40);
    ctx.fillStyle = '#3a3a40'; ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = '#4a4a52'; ctx.fillRect(0, b, BG_W, 6);
    ctx.fillStyle = '#f2ece0'; for (let x = 0; x < BG_W; x += 64) ctx.fillRect(x, b + 30, 36, 5);
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(0, b + 8, BG_W, 3);
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 3;
    for (let x = 40; x < BG_W; x += 128) { ctx.beginPath(); ctx.moveTo(x, b - 24); ctx.lineTo(x, b - 100); ctx.moveTo(x - 12, b - 92); ctx.lineTo(x + 12, b - 92); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(40,30,30,0.6)'; ctx.lineWidth = 1; for (let x = 40; x < BG_W; x += 128) { ctx.beginPath(); ctx.moveTo(x - 12, b - 92); ctx.quadraticCurveTo(x + 52, b - 80, x + 116, b - 92); ctx.stroke(); }
  },
  // the creek at dusk: far gums in silhouette, their reflections in the still water
  auCreekFar(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.water || '#1a2a3a'; ctx.fillRect(0, b, BG_W, H - b);
    for (let k = 0; k < 14; k++) {
      const x = rng() * BG_W, h = 80 + rng() * 120, r = 26 + rng() * 22;
      wrapDraw(x - r * 2, r * 4, X => {
        const cx = X + r * 2; ctx.fillStyle = L.color;
        ctx.fillRect(cx - 4, b - h, 8, h); ctx.beginPath(); ctx.arc(cx - r * 0.6, b - h, r, 0, TAU); ctx.arc(cx + r * 0.7, b - h - r * 0.4, r * 0.9, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(cx - 3, b + 6, 6, h * 0.4);
      });
    }
    ctx.strokeStyle = 'rgba(200,220,255,0.18)'; ctx.lineWidth = 1.5; for (let k = 0; k < 20; k++) { const x = rng() * BG_W, y = b + 10 + rng() * (H - b - 20); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30 + rng() * 40, y); ctx.stroke(); }
  },
  // reeds and paperbarks on the near bank, fireflies painted in as faint dots
  auReeds(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, b, BG_W, H - b);
    ctx.strokeStyle = shade(L.color, 0.25); ctx.lineWidth = 2;
    for (let x = 0; x < BG_W; x += 4 + rng() * 6) { const h = 20 + rng() * 50; ctx.beginPath(); ctx.moveTo(x, b + 4); ctx.quadraticCurveTo(x + 4, b - h * 0.6, x + (rng() - 0.5) * 12, b - h); ctx.stroke(); if (rng() < 0.15) { ctx.fillStyle = '#4a3020'; ctx.fillRect(x - 2, b - h - 8, 4, 12); } }
  },
  // the canopy: tall pale gum trunks going up out of frame, leaf clouds in grey-green, a moon behind
  auTrunks(ctx, L, rng, H) {
    for (let k = 0; k < 7; k++) {
      const x = rng() * BG_W, w = 22 + rng() * 26;
      wrapDraw(x - w, w * 3, X => {
        const cx = X + w;
        ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(cx - w / 2, H); ctx.quadraticCurveTo(cx - w * 0.3, H * 0.5, cx - w * 0.2, 0); ctx.lineTo(cx + w * 0.2, 0); ctx.quadraticCurveTo(cx + w * 0.3, H * 0.5, cx + w / 2, H); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(L.color, 0.15); ctx.fillRect(cx - w * 0.15, 0, 3, H);
        ctx.fillStyle = shade(L.color, -0.15); for (let y = 40; y < H; y += 60 + rng() * 40) { ctx.beginPath(); ctx.ellipse(cx, y, w * 0.25, 6, 0, 0, TAU); ctx.fill(); }
      });
    }
  },
  auLeaves(ctx, L, rng, H) {
    for (let k = 0; k < 26; k++) {
      const x = rng() * BG_W, y = rng() * (L.base || 200), r = 30 + rng() * 40;
      wrapDraw(x - r, r * 2, X => { ctx.fillStyle = k % 2 ? L.color : shade(L.color, -0.12); ctx.beginPath(); ctx.ellipse(X + r, y, r, r * 0.55, (rng() - 0.5) * 0.6, 0, TAU); ctx.fill(); });
    }
  },
  // the lay-by of the big things: a long low rise of paddocks, a far giant or two in silhouette
  auPaddocks(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, b);
    for (let x = 0; x <= BG_W; x += 64) ctx.lineTo(x, b - 20 - Math.sin(x * 0.006) * 24);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(L.color, -0.2); ctx.lineWidth = 1.5; for (let x = 0; x < BG_W; x += 22) { ctx.beginPath(); ctx.moveTo(x, b + 20); ctx.lineTo(x, b + 8); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, b + 12); ctx.lineTo(BG_W, b + 12); ctx.stroke();
    ctx.fillStyle = shade(L.color, -0.18);
    const g = rng() * BG_W; ctx.beginPath(); ctx.ellipse(g, b - 70, 18, 60, 0.4, 0, TAU); ctx.fill();   // a far giant banana
    const g2 = (g + 420) % BG_W; ctx.beginPath(); ctx.ellipse(g2, b - 50, 40, 34, 0, 0, TAU); ctx.fill(); ctx.fillRect(g2 - 4, b - 20, 8, 22);   // a far giant ball of wool
  },
  // the wombat burrow and the creek caves: packed earth, roots coming through
  auBurrow(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.strokeStyle = shade(L.color, 0.15); ctx.lineWidth = 3;
    for (let k = 0; k < 16; k++) { const x = rng() * BG_W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 20, 60, x - 30, 120, x + (rng() - 0.5) * 60, 160 + rng() * 80); ctx.stroke(); }
    ctx.fillStyle = shade(L.color, -0.15); for (let k = 0; k < 40; k++) { ctx.beginPath(); ctx.ellipse(rng() * BG_W, rng() * H, 6 + rng() * 14, 3 + rng() * 6, 0, 0, TAU); ctx.fill(); }
  }
};
const SKY_DAY = ['#2a7ad8', '#6ab8f0', '#f8e0b0'];
const themes = {
  au_outback: Object.assign({}, outback, {
    name: 'The Red Centre', music: 'tour_au', particles: 'dust', rays: '#fff2d0',
    sky: SKY_DAY, horizonGlow: '#ffd8a0', celestial: { type: 'sun', x: 0.78, y: 0.14, r: 26, color: '#fff8d8', glow: '#ffe8a0' }, stars: 0,
    layers: [{ kind: 'auRanges', color: '#a86a7a', base: 330, f: 0.06 }, { kind: 'auScrub', color: '#d8784a', leaf: GUM, base: 400, f: 0.2, windmill: true }],
    fog: '#ffd8b0', decor: ['auSpinifex', 'auTermite', 'auSpinifex', 'auGum']
  }),
  au_gully: Object.assign({}, outback, {
    name: 'Dry Creek', music: 'tour_au', particles: 'dust', rays: '#fff2d0',
    sky: ['#3a6ac8', '#8ab8e8', '#ffd0a0'], horizonGlow: '#ffb070', celestial: { type: 'sun', x: 0.2, y: 0.3, r: 30, color: '#fff0c8', glow: '#ffc070' }, stars: 0,
    layers: [{ kind: 'auRanges', color: '#9a5a6a', base: 320, f: 0.06 }, { kind: 'auScrub', color: '#c8683a', leaf: GUM, base: 410, f: 0.22 }],
    fog: '#ffc8a0', decor: ['auSpinifex', 'auGum', 'auTermite']
  }),
  au_highway: Object.assign({}, road, {
    name: 'The Long Paddock', music: 'tour_au_road', particles: 'dust', rays: '#fff2d0',
    sky: ['#1a6ad8', '#5ab0f0', '#f0e8c8'], horizonGlow: '#fff0c0', celestial: { type: 'sun', x: 0.85, y: 0.12, r: 26, color: '#fffbe0', glow: '#ffe8a0' }, stars: 0,
    layers: [{ kind: 'auRanges', color: '#b87a7a', base: 300, f: 0.03 }, { kind: 'auHighway', color: '#d8884a', base: 420, f: 0.9 }],
    fog: '#fff0d0', decor: []
  }),
  au_creek: Object.assign({}, creek, {
    name: 'Platypus Creek', music: 'tour_au_night', particles: 'none', rays: null,
    sky: ['#0a0c24', '#1a1a3a', '#3a2a4a'], horizonGlow: '#8a5a8a', celestial: { type: 'moon', x: 0.7, y: 0.14, r: 18, color: '#f8f0d8', glow: '#a8a8d8' }, stars: 70,
    layers: [{ kind: 'auCreekFar', color: '#141a2a', water: '#10182a', base: 330, f: 0.08 }, { kind: 'auReeds', color: '#0e1418', base: 430, f: 0.3 }],
    fog: '#3a4a6a', darkness: 0.8, decor: ['auReed', 'auReed']
  }),
  au_canopy: Object.assign({}, canopy, {
    name: 'The Canopy', music: 'tour_au_night', particles: 'none', rays: null,
    sky: ['#1a2a4a', '#3a5a7a', '#8aa8a8'], horizonGlow: '#c8d8a8', celestial: { type: 'moon', x: 0.2, y: 0.18, r: 22, color: '#fff8e0', glow: '#d8e8c8' }, stars: 30,
    layers: [{ kind: 'auTrunks', color: '#4a5a6a', f: 0.08 }, { kind: 'auLeaves', color: '#3a5a4a', base: 260, f: 0.18 }, { kind: 'auTrunks', color: '#6a7a7a', f: 0.32 }],
    fog: '#a8c8b8', darkness: 0.25, decor: ['auGumLeaves']
  }),
  au_night: Object.assign({}, canopy, {
    name: 'A Gum Tree at Night', music: 'tour_au_night', particles: 'none', rays: null,
    sky: ['#06081a', '#141a34', '#2a2440'], horizonGlow: '#5a5a8a', celestial: { type: 'moon', x: 0.5, y: 0.12, r: 26, color: '#fffbe8', glow: '#c8c8f0' }, stars: 90,
    layers: [{ kind: 'auTrunks', color: '#1e2436', f: 0.08 }, { kind: 'auLeaves', color: '#1a2a2a', base: 220, f: 0.2 }],
    fog: '#3a3a6a', darkness: 0.3, decor: ['auGumLeaves']
  }),
  au_big: Object.assign({}, big, {
    name: 'The Big Things', music: 'tour_au', particles: 'none', rays: '#fff8e0',
    sky: ['#2a8ae8', '#7ac8ff', '#e8f8ff'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.15, y: 0.14, r: 28, color: '#fffbe0', glow: '#ffffff' }, stars: 0,
    layers: [{ kind: 'auRanges', color: '#8aa8c8', base: 330, f: 0.05 }, { kind: 'auPaddocks', color: '#9ac86a', base: 410, f: 0.2 }],
    fog: '#e8f8ff', decor: ['auGum']
  }),
  au_burrow: Object.assign({}, outback, {
    name: 'The Wombat Burrow', music: 'tour_au', particles: 'dust', rays: null,
    sky: ['#2a1a12', '#3a2418', '#4a2e1e'], horizonGlow: '#8a5a3a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'auBurrow', color: '#5a3424', f: 0.1 }],
    fog: '#8a5a3a', darkness: 0.35, decor: ['auLantern']
  })
};

/* ---------------- props (Decor) ---------------- */
const decor = {
  auSpinifex(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = '#a8a040'; ctx.lineWidth = 1.6;
    for (let k = -4; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + k * 4, y - 14 + Math.abs(k) * 1.6); ctx.stroke(); }
    ctx.strokeStyle = '#d8d070'; ctx.lineWidth = 1; for (let k = -3; k <= 3; k += 2) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + k * 3, y - 16); ctx.stroke(); }
    ctx.restore();
  },
  // a termite mound in the background (decor only): a lumpy clay spire with little holes
  auTermite(ctx, x, y, t, th, d) {
    const h = 46 + (((d && d.seed) || 0) % 3) * 12;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = '#c8703a';
    ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.quadraticCurveTo(x - 16, y - h * 0.6, x - 6, y - h); ctx.lineTo(x + 2, y - h * 0.8); ctx.lineTo(x + 6, y - h * 0.9); ctx.quadraticCurveTo(x + 16, y - h * 0.4, x + 20, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e09a5a'; ctx.beginPath(); ctx.ellipse(x - 6, y - h * 0.5, 4, 9, 0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a2010'; for (const [dx, dy] of [[-8, 0.3], [6, 0.45], [-2, 0.7]]) { ctx.beginPath(); ctx.arc(x + dx, y - h * dy, 1.8, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  auGum(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#ece4d4'; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x - 10, y - 60, x - 2, y - 120); ctx.lineTo(x + 6, y - 118); ctx.quadraticCurveTo(x + 2, y - 60, x + 8, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8a87a'; ctx.fillRect(x - 3, y - 70, 4, 14);
    const sw = Math.sin(t * 0.8 + x) * 2;
    ctx.fillStyle = GUM; for (const [dx, dy, r] of [[-22, -126, 22], [18, -134, 24], [0, -152, 20], [-6, -118, 16]]) { ctx.beginPath(); ctx.arc(x + dx + sw, y + dy, r, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#a8c89a'; ctx.beginPath(); ctx.arc(x + 12 + sw, y - 142, 8, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a yellow diamond road sign: a kangaroo, a wombat or an emu pictogram, sometimes the BIG THINGS turnoff
  auRoadSign(ctx, x, y, t, th, d) {
    const k = ((d && d.seed) || 0) % 3;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#8a8a90'; ctx.fillRect(x - 2, y - 60, 4, 60); ctx.strokeRect(x - 2, y - 60, 4, 60);
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.moveTo(x, y - 92); ctx.lineTo(x + 26, y - 66); ctx.lineTo(x, y - 40); ctx.lineTo(x - 26, y - 66); ctx.closePath(); ctx.fill(); ctx.stroke();
    AuArt.picto(ctx, x, y - 66, ['roo', 'wombat', 'emu'][k], 0.9);
    ctx.restore();
  },
  // the turnoff to the Big Things (16-1's hidden exit hint): a brown tourist sign with an arrow pointing up the cliff
  auBigSign(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#8a8a90'; ctx.fillRect(x - 2, y - 56, 4, 56); ctx.strokeRect(x - 2, y - 56, 4, 56);
    ctx.fillStyle = '#7a4a2a'; rr(ctx, x - 40, y - 96, 80, 42, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('THE BIG', x, y - 82); ctx.fillText('THINGS', x, y - 72);
    const bob = Math.sin(t * 4) * 2;
    ctx.beginPath(); ctx.moveTo(x, y - 68 + bob - 10); ctx.lineTo(x + 6, y - 60 + bob - 10); ctx.lineTo(x - 6, y - 60 + bob - 10); ctx.closePath(); ctx.fill();
    ctx.restore();
  },
  auWindmill(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x, y - 150); ctx.lineTo(x + 16, y); ctx.moveTo(x - 10, y - 50); ctx.lineTo(x + 10, y - 50); ctx.moveTo(x - 6, y - 100); ctx.lineTo(x + 6, y - 100); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillStyle = '#d8dce2';
    for (let k = 0; k < 14; k++) { const a = t * 1.5 + k * TAU / 14; ctx.beginPath(); ctx.moveTo(x, y - 152); ctx.lineTo(x + Math.cos(a) * 30, y - 152 + Math.sin(a) * 30); ctx.lineTo(x + Math.cos(a + 0.18) * 30, y - 152 + Math.sin(a + 0.18) * 30); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#e8423a'; ctx.beginPath(); ctx.moveTo(x + 4, y - 152); ctx.lineTo(x + 40, y - 158); ctx.lineTo(x + 40, y - 146); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  auReed(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = '#3a5a3a'; ctx.lineWidth = 2;
    for (let k = -2; k <= 2; k++) { const sw = Math.sin(t * 1.2 + x * 0.1 + k) * 3; ctx.beginPath(); ctx.moveTo(x + k * 4, y); ctx.quadraticCurveTo(x + k * 5, y - 20, x + k * 6 + sw, y - 34 - Math.abs(k) * 4); ctx.stroke(); }
    ctx.fillStyle = '#4a3020'; ctx.fillRect(x - 2 + Math.sin(t * 1.2 + x * 0.1) * 3, y - 44, 4, 10);
    ctx.restore();
  },
  // a glow-worm cluster on a cave roof (light in the dark creek's banks)
  auGlow(ctx, x, y, t) {
    ctx.save(); for (let k = 0; k < 7; k++) { const dx = (k * 13) % 30 - 15, dy = (k * 7) % 14; ctx.strokeStyle = 'rgba(160,255,230,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + dx, y - 40); ctx.lineTo(x + dx, y - 40 + 10 + dy); ctx.stroke(); ctx.fillStyle = `rgba(140,255,220,${0.6 + 0.4 * Math.sin(t * 3 + k)})`; ctx.beginPath(); ctx.arc(x + dx, y - 30 + dy, 2, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  auGumLeaves(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    for (let k = 0; k < 5; k++) { const a = -0.6 + k * 0.3 + Math.sin(t + x) * 0.05; ctx.fillStyle = k % 2 ? GUM : '#a8c89a'; ctx.save(); ctx.translate(x - 10 + k * 5, y - 2); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, -9, 3.5, 9, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  },
  auLantern(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 1, y - 40, 2, 16);
    ctx.fillStyle = '#ffd88a'; rr(ctx, x - 6, y - 26, 12, 16, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // a hollow log on its side: the door of the wombat burrow (the letter is the door's spot)
  auHollowLog(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    ctx.fillStyle = '#8a6040'; rr(ctx, x - 50, y - 46, 100, 46, 22); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a87a50'; ctx.fillRect(x - 40, y - 42, 80, 6);
    ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(x + 44, y - 23, 12, 22, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  },
  // the cab of a road train, at the front of the convoy (16-2's gate stands beside it): chrome bull bar, stacks
  auCab(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.fillStyle = '#e8423a'; ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x - 40, y - 120); ctx.lineTo(x + 50, y - 120); ctx.lineTo(x + 70, y - 70); ctx.lineTo(x + 76, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9ad0ff'; ctx.beginPath(); ctx.moveTo(x + 10, y - 112); ctx.lineTo(x + 48, y - 112); ctx.lineTo(x + 62, y - 76); ctx.lineTo(x + 10, y - 76); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x + 64, y - 50, 18, 44); ctx.strokeRect(x + 64, y - 50, 18, 44);
    for (let k = 0; k < 4; k++) ctx.fillRect(x + 66, y - 46 + k * 10, 14, 3);
    ctx.fillRect(x - 36, y - 170, 8, 52); ctx.strokeRect(x - 36, y - 170, 8, 52);
    ctx.fillStyle = 'rgba(80,80,80,0.5)'; for (let k = 0; k < 3; k++) { const ph = (t * 1.5 + k / 3) % 1; ctx.beginPath(); ctx.arc(x - 32 - ph * 30, y - 176 - ph * 30, 5 + ph * 8, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a giant thing in the background of 16-6 (decor): a giant prawn on its plinth, a giant ball of wool...
  auGiantPrawn(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.fillStyle = '#ff8a5a';
    for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x - 120 + k * 34, y - 120 - Math.sin(k * 0.6) * 60, 30, 40, -0.3 + k * 0.2, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#ffb08a'; ctx.beginPath(); ctx.ellipse(x + 90, y - 180, 46, 34, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + 110, y - 192, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#e8423a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 130, y - 190); ctx.quadraticCurveTo(x + 220, y - 300, x + 260, y - 220); ctx.moveTo(x + 128, y - 178); ctx.quadraticCurveTo(x + 230, y - 240, x + 280, y - 150); ctx.stroke();
    ctx.restore();
  }
};
const decorLights = { auLantern: [90, '#ffd88a', -18], auGlow: [70, '#8affd8', -30] };

// small shared drawings
const AuArt = {
  // a road-sign pictogram in black: roo, wombat, emu
  picto(ctx, x, y, kind, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = INK;
    if (kind === 'roo') { ctx.beginPath(); ctx.ellipse(2, 2, 9, 6, -0.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(8, -8, 3, 4, 0.3, 0, TAU); ctx.fill(); ctx.fillRect(9, -15, 1.5, 5); ctx.beginPath(); ctx.moveTo(-6, 6); ctx.quadraticCurveTo(-14, 10, -16, 4); ctx.lineTo(-14, 3); ctx.quadraticCurveTo(-10, 7, -6, 3); ctx.fill(); ctx.fillRect(-2, 6, 8, 3); }
    else if (kind === 'wombat') { ctx.beginPath(); ctx.ellipse(0, 2, 12, 8, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(11, -1, 5, 0, TAU); ctx.fill(); ctx.fillRect(-9, 8, 4, 4); ctx.fillRect(5, 8, 4, 4); }
    else { ctx.beginPath(); ctx.ellipse(-2, 0, 9, 7, 0, 0, TAU); ctx.fill(); ctx.fillRect(6, -14, 2, 12); ctx.beginPath(); ctx.arc(8, -15, 3, 0, TAU); ctx.fill(); ctx.fillRect(-4, 6, 1.5, 10); ctx.fillRect(1, 6, 1.5, 10); }
    ctx.restore();
  },
  // the kangaroo (Brady's ride in 16-1): drawn from its feet (x, y), facing f, crouch k 0..1, airborne pose a
  roo(ctx, x, y, f, k, air, t, front) {
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    const sq = k * 10, stretch = air ? 6 : 0, body = '#c8884a', light = '#f0c890';
    if (!front) {
      // the tail
      ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-8, -14 + sq * 0.5); ctx.quadraticCurveTo(-30, -6, -42 - stretch, air ? -16 : -2); ctx.lineTo(-38 - stretch, air ? -10 : 1); ctx.quadraticCurveTo(-24, -2, -6, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
      // the big hind leg and foot
      ctx.beginPath(); ctx.ellipse(-4, -14 + sq * 0.6, 13, 11 - sq * 0.2, -0.3, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = shade(body, -0.15); ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(air ? 2 : 18, air ? 6 : 0); ctx.lineTo(air ? 0 : 16, air ? 10 : 3); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      // the body, leaning forward, the head and ears up top
      ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(4, -34 + sq, 15, 24 - sq * 0.4, 0.28, 0, TAU); ctx.fill(); ctx.stroke();
      const hy = -64 + sq * 1.2;
      ctx.beginPath(); ctx.ellipse(10, hy - 12, 3.5, 9, -0.25, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(18, hy - 11, 3.5, 9, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(16, hy, 9, 8, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(25, hy + 4, 7, 5, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(30, hy + 3, 1.6, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(19, hy - 2, 2.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(19, hy - 3.5, 1.2, 1.2);
    } else {
      // the pouch front and the little forepaws (drawn over Brady's legs)
      ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(-6, -40 + sq); ctx.quadraticCurveTo(-10, -16 + sq * 0.5, 4, -14 + sq * 0.5); ctx.quadraticCurveTo(18, -16 + sq * 0.5, 16, -40 + sq); ctx.quadraticCurveTo(5, -36 + sq, -6, -40 + sq); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = shade(light, -0.25); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-4, -37 + sq); ctx.quadraticCurveTo(5, -33 + sq, 14, -37 + sq); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = body;
      ctx.beginPath(); ctx.ellipse(20, -42 + sq, 3, 6, 0.6, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  },
  // a gumnut
  gumnut(ctx, x, y, r) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#4a3a20'; ctx.beginPath(); ctx.arc(x, y - r * 0.5, r * 0.45, 0, TAU); ctx.fill(); ctx.restore(); }
};

/* ---------------- the critters ---------------- */
// an emu: a big shaggy bird with a curious stare; it notices Brady, fluffs up, then sprints at him
const emuArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
  const run = m === 'charge', st = run ? Math.sin(t * 24) * 7 : Math.sin(t * 7) * 3, fluff = m === 'notice' ? 3 : 0;
  ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-3, -18); ctx.lineTo(-3 + st, -2); ctx.lineTo(1 + st, 0); ctx.moveTo(3, -18); ctx.lineTo(3 - st, -2); ctx.lineTo(7 - st, 0); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.ellipse(-2, -26, 15 + fluff, 11 + fluff, run ? 0.2 : 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#8a7a6a'; ctx.lineWidth = 1; for (let k = -10; k < 10; k += 4) { ctx.beginPath(); ctx.moveTo(k - 2, -30); ctx.lineTo(k - 5, -18); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const nx = run ? 14 : 8, ny = run ? -40 : -48;
  ctx.strokeStyle = '#6a8ab8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(8, -32); ctx.quadraticCurveTo(nx + 2, -38, nx, ny + 6); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = '#4a3a2e'; ctx.beginPath(); ctx.arc(nx, ny, 5.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(nx + 4, ny - 1); ctx.lineTo(nx + 11, ny + 1); ctx.lineTo(nx + 4, ny + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.arc(nx + 1, ny - 1.5, 2.2, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(nx + 1.5, ny - 1.5, 1.1, 0, TAU); ctx.fill();
  ctx.restore();
};
// a magpie in its springtime mood: black and white, a sharp beak; it swoops with a clack
const magpieArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const f = Math.sin(t * 16) * (m === 'swoop' ? 0.3 : 1);
  ctx.fillStyle = '#1a1a20'; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-12, -14 * f - 2, -22, -10 * f); ctx.lineTo(-4, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1a20'; ctx.beginPath(); ctx.ellipse(2, 2, 9, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f2f2f2'; ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(-6, -16 * f - 2, -16, -12 * f); ctx.lineTo(2, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1a20'; ctx.beginPath(); ctx.arc(10, -4, 6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d8dce2'; ctx.beginPath(); ctx.moveTo(15, -6); ctx.lineTo(24, -3); ctx.lineTo(15, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff5a3a'; ctx.beginPath(); ctx.arc(12, -6, 1.6, 0, TAU); ctx.fill();
  ctx.restore();
};
// a yabby: a little blue freshwater crayfish, claws up, clacking
const yabbyArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const clack = Math.abs(Math.sin(t * 6)) * 0.5;
  ctx.fillStyle = '#3a6ab8'; ctx.beginPath(); ctx.ellipse(-4, -7, 12, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-15, -7); ctx.lineTo(-22, -11); ctx.lineTo(-22, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#2a4a8a'; ctx.lineWidth = 1; for (let k = -10; k < 4; k += 4) { ctx.beginPath(); ctx.moveTo(k, -12); ctx.lineTo(k, -2); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#4a8ad8';
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(8, -10 + s * 2); ctx.rotate(-0.5 + s * 0.2); ctx.beginPath(); ctx.ellipse(6, 0, 6, 3.5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(11, -2); ctx.lineTo(17, -4 - clack * 6); ctx.lineTo(13, 0); ctx.lineTo(17, 3 + clack * 6); ctx.lineTo(11, 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(6, -13, 1.5, 0, TAU); ctx.arc(9, -13, 1.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#8ab8ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(7, -14); ctx.quadraticCurveTo(14, -24, 22, -22); ctx.stroke();
  ctx.restore();
};
// a sulphur-crested cockatoo: white, a yellow crest that flips up when it's about to drop a gumnut
const cockyArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const up = m === 'throw' ? 1 : 0.2;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, -12, 9, 12, 0.15, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd84a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(1 + k, -26); ctx.lineTo(-6 + k * 3, -30 - up * 10 - k); ctx.lineTo(3 + k, -24); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(3, -24, 6.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a3a40'; ctx.beginPath(); ctx.moveTo(8, -26); ctx.quadraticCurveTo(14, -24, 9, -19); ctx.lineTo(7, -21); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(4, -26, 1.4, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(-3, 3); ctx.moveTo(2, 0); ctx.lineTo(3, 3); ctx.stroke();
  if (m === 'throw') { ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.scale(e.dir, 1); ctx.fillText('SKRAAK!', 0, -40); }
  ctx.restore();
};
// a kookaburra: it laughs first (the tell: KOOKOOKAKAKA!), then dives
const kookaArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const f = Math.sin(t * 12) * (m === 'swoop' ? 0.2 : 1), laugh = e.laughT > 0;
  ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(-2, -2); ctx.quadraticCurveTo(-10, -16 * f, -20, -10 * f); ctx.lineTo(-2, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f0e6d0'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3a8ab8'; ctx.beginPath(); ctx.ellipse(-4, -3, 6, 4, 0.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f0e6d0'; ctx.beginPath(); ctx.arc(9, -6, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6a4a2a'; ctx.fillRect(4, -9, 10, 2.5);
  ctx.fillStyle = '#3a3a40'; ctx.beginPath(); ctx.moveTo(14, -8); ctx.lineTo(24, laugh ? -11 : -6); ctx.lineTo(14, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (laugh) { ctx.beginPath(); ctx.moveTo(14, -4); ctx.lineTo(22, 0); ctx.lineTo(14, -2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(10, -8, 1.5, 0, TAU); ctx.fill();
  ctx.restore();
  if (laugh) { ctx.save(); ctx.fillStyle = '#ffe28a'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('KOO-KOO-KA-KA!', x, y - 22 + Math.sin(t * 20) * 2); ctx.restore(); }
};
// a wombat: square and stubborn; it potters, then tucks its head and barrels along like a hairy brick
const wombatArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const roll = m === 'roll', curl = m === 'curl';
  if (roll) { ctx.rotate(t * 14); ctx.fillStyle = '#7a6a5a'; ctx.beginPath(); ctx.arc(0, -12, 12, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#5a4a3a'; ctx.beginPath(); ctx.arc(0, -12, 7, 0, 4); ctx.stroke(); ctx.restore(); return; }
  const step = Math.sin(t * 10) * 2;
  ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-11 + step, -6, 6, 6); ctx.fillRect(5 - step, -6, 6, 6);
  ctx.fillStyle = '#7a6a5a'; rr(ctx, -16, -24 + (curl ? 4 : 0), 30, 20, 9); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(13, -16 + (curl ? 6 : 0), 9, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.arc(9, -25 + (curl ? 6 : 0), 3, 0, TAU); ctx.arc(16, -25 + (curl ? 6 : 0), 3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(20, -14 + (curl ? 6 : 0), 3.5, 2.6, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(14, -18 + (curl ? 6 : 0), 1.4, 0, TAU); ctx.fill();
  ctx.restore();
};
const enemies = {
  auEmu: { cls: TourEnemy.make({ w: 26, h: 50, speed: 0.9, behavior: 'charge', range: 8, chargeSpeed: 7, windup: 0.6, art: emuArt, burst: '#5a4a3a',
    onNotice: e => { e.g.parts.text(e.cx, e.y - 12, 'BOOM BOOM?', '#ffe28a'); TourKit.sfx('emu', 'bump', { vol: 0.5, pitch: 0.6 }); } }), place: 'walk' },
  auMagpie: { cls: TourFlyer.make({ w: 30, h: 20, range: 3, speed: 0.9, swoop: true, art: magpieArt, burst: '#ffffff',
    onSwoop: e => { e.g.parts.text(e.cx, e.y - 10, 'CLACK!', '#ffffff'); } }), place: 'fly' },
  auYabby: { cls: TourEnemy.make({ w: 28, h: 16, speed: 1.0, behavior: 'walk', edgeTurn: true, art: yabbyArt, burst: '#3a6ab8' }), place: 'walk' },
  auCocky: { cls: TourEnemy.make({ w: 22, h: 30, speed: 0.6, behavior: 'throw', range: 9, every: 2.6, art: cockyArt, burst: '#ffffff',
    shoot: (e, p) => { e.g.parts.text(e.cx, e.y - 30, 'SKRAAK!', '#ffffff'); tourFire(e.g, e.cx + e.dir * 8, e.y + 4, { vx: e.dir * 3.5 * TS, vy: -4 * TS, grav: PHYS.gDown * 0.5, w: 12, h: 12, life: 2.4, col: '#8a6a3a', art: (c, s) => AuArt.gumnut(c, s.x + s.w / 2, s.y + s.h / 2, 5) }); } }), place: 'walk' },
  auKooka: { cls: TourFlyer.make({ w: 28, h: 20, range: 2.5, speed: 0.7, swoop: true, art: kookaArt, burst: '#f0e6d0',
    think(e, dt) {
      // the laugh is the tell: 0.8 s of KOO-KOO-KA-KA, then the dive
      const p = e.g.player;
      if (e.laughT > 0) { e.laughT -= dt; if (e.laughT <= 0) { e.state = 'swoop'; e.st = 0; e.sx = e.x; e.sy = e.y; e.tx = p ? p.cx - e.w / 2 : e.x; e.ty = p ? p.y : e.y + 3 * TS; } return; }
      if (e.state === 'drift') {
        if (e.cool > 0) e.cool -= dt;
        e.x = e.hx + Math.sin(e.t * 0.7 + e.ph) * e.range; e.y = e.hy + Math.sin(e.t * 2 + e.ph) * 6; if (p) e.dir = sign(p.cx - e.cx) || e.dir;
        if (e.cool <= 0 && p && TourKit.near(e, p, 6, 7) && p.y > e.y) { e.laughT = 0.8; TourKit.sfx('kooka', 'select', { vol: 0.4, pitch: 1.6 }); }
      } else {
        e.st += dt; const k = Math.min(1, e.st / 0.9), arc = Math.sin(k * Math.PI);
        e.x = lerp(e.sx, e.tx + (e.tx - e.sx) * 0.6, k); e.y = e.sy + arc * (e.ty - e.sy); e.mode = 'swoop';
        if (k >= 1) { e.state = 'drift'; e.cool = 2.6; e.hx = e.x; e.hy = e.sy; e.mode = 'fly'; }
      }
    } }), place: 'fly' },
  auWombat: { cls: TourEnemy.make({ w: 30, h: 26, speed: 0.8, behavior: 'roll', range: 7, rollSpeed: 6.5, rollT: 2.2, rollSpiky: false, art: wombatArt, burst: '#7a6a5a' }), place: 'walk' }
};

/* ---------------- music ---------------- */
const tracks = {
  tour_au: {
    bpm: 128, bars: 8, rv: 0.25, dl: 0.1, sw: 0.08, hx: 0.05,
    ch: 'A D A E A D E A',
    ld: 'E5:2 A5:2 C#6:2 A5:2 E6:4 C#6:4 | F#5:2 A5:2 D6:2 F#6:2 E6:4 D6:4 | C#6:2 E6:2 A6:4 E6:2 C#6:2 A5:4 | B5:2 E6:2 G#6:4 E6:4 B5:4 |' +
        'A5:2 C#6:2 E6:4 C#6:2 E6:2 A6:4 | D6:2 F#6:2 A6:4 F#6:4 D6:4 | E6:2 G#6:2 B6:4 G#6:2 E6:2 B5:4 | A5:8 E5:4 A5:4',
    li: 'pluck', lv: 0.13,
    bp: 'r..r..r.r..r..r.', bi: 'pluckb', bv: 0.3,
    ap: 'c.c.c.c.c.c.c.c.', ai: 'harp', av: 0.04, ao: 62,
    dr: ['k..k..k.k..k..k.', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.34
  },
  tour_au_road: {
    bpm: 150, bars: 8, rv: 0.2, hx: 0.06,
    ch: 'E E A A B B E B7',
    ld: 'B5:4 E6:4 G#6:4 B6:4 | A6:4 G#6:4 F#6:8 | A5:4 C#6:4 E6:4 A6:4 | G#6:4 F#6:4 E6:8 |' +
        'F#6:4 B6:4 A6:4 G#6:4 | F#6:8 D#6:8 | E6:4 G#6:4 B6:4 E7:4 | D#7:4 B6:4 F#6:8',
    li: 'brass', lv: 0.12,
    bp: 'r.r.r.r.r.r.r.r.', bi: 'pluckb', bv: 0.32,
    ap: '..c...c...c...c.', ai: 'pluck', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s...', 'hhhhhhhhhhhhhhhh'], dv: 0.4
  },
  tour_au_night: {
    bpm: 92, bars: 8, rv: 0.5, dl: 0.2, sw: 0.1, hx: 0.04,
    ch: 'Dm7 Am7 Bbmaj7 Gm7 Dm7 Am7 Bbmaj7 A7',
    ld: 'D6:3 F6:1 A6:4 G6:4 F6:4 | E6:8 C6:8 | F6:3 G6:1 A6:4 D7:4 C7:4 | Bb6:12 .:4 |' +
        'A6:3 G6:1 F6:4 E6:4 D6:4 | C6:8 E6:8 | D6:4 F6:4 Bb6:4 A6:4 | C#6:8 E6:8',
    li: 'vibes', lv: 0.12,
    bp: 'r.....r.r.......', bi: 'sub', bv: 0.26,
    ap: 'c...c...c...c...', ai: 'harp', av: 0.05, ao: 60,
    dr: ['k.......k.......', '........s.......', '..h...h...h...h.'], dv: 0.24
  },
  tour_au_boss: {
    bpm: 140, bars: 8, rv: 0.25, hx: 0.06,
    ch: 'Em C D B7 Em C Am B7',
    ld: 'E5:2 G5:2 B5:2 E6:2 D6:4 B5:4 | C6:2 E6:2 G6:4 E6:4 C6:4 | D6:2 F#6:2 A6:4 F#6:4 D6:4 | D#6:4 F#6:4 B6:8 |' +
        'E6:2 G6:2 B6:4 G6:4 E6:4 | C6:4 E6:4 G6:8 | A5:2 C6:2 E6:4 C6:4 A5:4 | B5:4 D#6:4 F#6:8',
    li: 'reed', lv: 0.15,
    bp: 'r.r.r.r.r.r.r.r.', bi: 'pluckb', bv: 0.32,
    ap: 'c...c...c...c...', ai: 'reed', av: 0.04, ao: 52,
    dr: ['k..k..k.k..k..k.', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.42
  }
};

/* ---------------- the route map: a kangaroo in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save(); ctx.translate(x, y + Math.abs(Math.sin(t * 4)) * -r * 0.15); ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(-r * 0.05, r * 0.05, r * 0.5, r * 0.32, -0.6, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(r * 0.35, -r * 0.45, r * 0.18, r * 0.22, 0.3, 0, TAU); ctx.fill();
  ctx.fillRect(r * 0.38, -r * 0.82, r * 0.08, r * 0.28);
  ctx.beginPath(); ctx.moveTo(-r * 0.35, r * 0.3); ctx.quadraticCurveTo(-r * 0.8, r * 0.5, -r * 0.9, r * 0.15); ctx.lineTo(-r * 0.8, r * 0.1); ctx.quadraticCurveTo(-r * 0.6, r * 0.35, -r * 0.3, r * 0.15); ctx.fill();
  ctx.fillRect(-r * 0.1, r * 0.3, r * 0.45, r * 0.12);
  ctx.restore();
};

Tour.country({
  id: 'au', colors: COL, tagline: 'The outback, the creek and the canopy: hop, ping and bounce',
  themes, painters, decor, decorLights, enemies, tracks,
  music: { level: 'tour_au', boss: 'tour_au_boss', map: null },
  landmark: 'the harbour\'s white sails', emblem,
  arrival: 'G\'day, Brady! The kangaroos have offered you a lift. Sit in the pouch, hold JUMP to wind up a hop. And shake your boots out in the mornings. ♥ C',
  levels: []
});
Tour.auKit = { AuArt, INK, COL, GUM };
})();
