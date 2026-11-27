/* ============================================================
   THE DEPARTMENT OF UNCLAIMED SHADOWS (world 35, cc 'shad'): hidden land A10 (docs/design/CHATGPT_RELAY.md §A10).
   "Piwi's spotlight left town with several shadows still waiting to be picked up."
   Butter-yellow walls, grape shadows, salmon filing slots and white pinprick lamps. Every shadow in the land is a flat,
   solid grape shape with ONE conspicuous notch (the department's tag that it has been filed). Lamps throw clear pale
   cones. Brady's own shadow is only ever a flat cast shadow on the wall or the floor that he stretches, trims and points
   with; it is never a character. The owners of the lost shadows are animals and objects (an umbrella, a teapot, a
   rabbit, a watering can, a kettle): there are no human-like figures anywhere.
   Its door: on the Moon, 18-1 ONE SMALL HOP, a grey sample locker just left of the start throws a long black shadow,
   and in that shadow there is a keyhole of light (29_tour_y_shad_e_entry.js).
   This file: the stop, the looks (tiles, themes, painted backdrops, props), the critters, the route-map emblem, the
   map's sprites, the music and the country. The mechanics: 29_tour_y_shad_a_mech.js; the secret rooms:
   29_tour_y_shad_b_rooms.js; the boss: 29_tour_y_shad_c_boss.js; the levels and the map: 29_tour_y_shad_d_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'shad', world: 35, name: 'The Department of Unclaimed Shadows', sub: 'a hidden land', lon: 168, lat: 57, secret: true, bonus: true, d0: 0.8, pin: 'shad' });
const COL = { a: '#5a2a6a', b: '#f6dc7a', c: '#f08470' };
const INK = '#1c1426';
const BUT = '#f6dc7a', BUT_HI = '#fff0b4', BUT_LO = '#d8b856', GRA = '#5a2a6a', GRA_HI = '#7c4a8c', GRA_LO = '#3a1848', GRA_DK = '#2a1036';
const SAL = '#f08470', SAL_HI = '#ffa898', SAL_LO = '#c8604e', WHITE = '#fffdf2', LIGHT = 'rgba(255,248,200,';

/* ---------------- tiles: salmon filing-room baseboard, the shadow shelf, filing drawers ---------------- */
const floorTile = {
  style: 'shadFloor', cap: BUT, capHi: BUT_HI, dirt: SAL, dirt2: SAL_LO, rock: SAL_LO,
  paint(ctx, rng) {
    rng = rng || (() => 0.5);
    ctx.fillStyle = SAL; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = SAL_LO; ctx.fillRect(0, TS - 3, TS, 3); ctx.fillRect(TS - 2, 0, 2, TS);
    ctx.strokeStyle = 'rgba(28,20,38,0.25)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 15.5); ctx.lineTo(TS, 15.5); ctx.stroke();
    if (rng() < 0.35) { ctx.fillStyle = GRA_LO; ctx.fillRect(12, 20, 8, 3); }
  },
  // the cap: a butter-yellow top over the salmon baseboard (the building block), an ink line under it
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = BUT_LO; ctx.fillRect(x0, 0, x1 - x0, 12);
    ctx.fillStyle = BUT; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = BUT_HI; ctx.fillRect(x0, 0, x1 - x0, 2);
    ctx.fillStyle = INK; ctx.fillRect(x0, 11, x1 - x0, 1.5);
  }
};
// the one-way ledge: an overlapping shadow shelf, two grape shadows laid over each other, the overlap darker
const shelfSemi = {
  style: 'shadShelf', c1: GRA_HI, c2: GRA,
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = GRA; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = GRA_DK; for (let x = x0 + 6; x < x1; x += 40) ctx.fillRect(x, 0, 18, 10);
    ctx.fillStyle = GRA_HI; ctx.fillRect(x0, 0, x1 - x0, 2);
    ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.4);
    ctx.fillStyle = GRA; for (let x = x0 + 14; x < x1; x += 40) { ctx.beginPath(); ctx.moveTo(x, 11); ctx.lineTo(x + 10, 11); ctx.lineTo(x + 4, 17); ctx.closePath(); ctx.fill(); }
  }
};
// a filing drawer block: salmon front, a pull and a label card
const drawerBrick = {
  style: 'shadDrawer', c1: SAL_HI, c2: SAL, mortar: SAL_LO,
  paint(ctx) {
    ctx.fillStyle = SAL; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = SAL_HI; ctx.fillRect(2, 2, TS - 4, 3);
    ctx.fillStyle = BUT; ctx.fillRect(10, 8, 12, 7); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(10, 8, 12, 7);
    ctx.fillStyle = GRA_LO; ctx.fillRect(9, 20, 14, 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the hard wall: dark grape panelling
const grapeWall = {
  c1: GRA, c2: GRA_LO,
  paint(ctx) {
    ctx.fillStyle = GRA_LO; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = 'rgba(255,230,160,0.14)'; ctx.lineWidth = 1.5; ctx.strokeRect(4.5, 4.5, TS - 9, TS - 9);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, TS - 3, TS, 3);
  }
};
const office = { ground: floorTile, semi: shelfSemi, brick: drawerBrick, hard: grapeWall, pillar: { c1: SAL, c2: SAL_LO, cap: BUT, style: 'column' }, accent: SAL, tint: {}, bloom: 0.08, liquid: 'shad_ink' };

/* ---------------- shared drawings ---------------- */
const ShadArt = {
  INK, BUT, BUT_HI, BUT_LO, GRA, GRA_HI, GRA_LO, GRA_DK, SAL, SAL_HI, SAL_LO, WHITE,
  // a lamp's cone of light from (x, y) down to the floor at fy, half-width at the floor hw; k: brightness 0..1
  cone(ctx, x, y, fy, hw, k, dir) {
    ctx.save(); const a = k == null ? 1 : k;
    const g = ctx.createLinearGradient(0, y, 0, fy); g.addColorStop(0, LIGHT + (0.55 * a) + ')'); g.addColorStop(1, LIGHT + (0.18 * a) + ')');
    ctx.fillStyle = g; ctx.beginPath();
    if (dir) { ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.lineTo(x + dir * hw * 2, fy); ctx.lineTo(x + dir * 6, fy); }
    else { ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.lineTo(x + hw, fy); ctx.lineTo(x - hw, fy); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = LIGHT + (0.6 * a) + ')'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  },
  // a floor lamp (feet-centre), its shade at height h, lit or dim
  floorLamp(ctx, x, y, h, lit, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = GRA_LO; ctx.beginPath(); ctx.ellipse(x, y - 3, 14, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y - h + 10); ctx.stroke();
    ctx.strokeStyle = '#8a8070'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = lit ? WHITE : '#c8c0a8'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y - h + 12, 6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SAL; ctx.beginPath(); ctx.moveTo(x - 10, y - h); ctx.lineTo(x + 10, y - h); ctx.lineTo(x + 18, y - h + 16); ctx.lineTo(x - 18, y - h + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (lit) { const k = 0.6 + 0.4 * Math.sin((t || 0) * 5); ctx.fillStyle = `rgba(255,255,240,${k})`; ctx.beginPath(); ctx.arc(x, y - h + 18, 3, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a pinprick lamp on the wall (a white dot with a soft halo)
  pin(ctx, x, y, t) { ctx.save(); ctx.fillStyle = LIGHT + '0.25)'; ctx.beginPath(); ctx.arc(x, y, 9 + Math.sin((t || 0) * 2 + x) * 1, 0, TAU); ctx.fill(); ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill(); ctx.restore(); },
  // the department's notch: a little triangular bite out of an edge (drawn in the wall colour over the shadow)
  notch(ctx, x, y, s, a, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(a || 0); ctx.fillStyle = col || BUT; ctx.beginPath(); ctx.moveTo(-5 * s, -1); ctx.lineTo(5 * s, -1); ctx.lineTo(0, 7 * s); ctx.closePath(); ctx.fill(); ctx.restore(); },
  // a tag on a string (claim tickets everywhere)
  tag(ctx, x, y, s, col) { ctx.save(); ctx.translate(x, y); ctx.scale(s || 1, s || 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.fillStyle = col || WHITE; ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(4, -4); ctx.lineTo(8, 0); ctx.lineTo(4, 4); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(4, 0, 1.2, 0, TAU); ctx.fill(); ctx.restore(); }
};
/* The owners and their shadows: shape(ctx, kind, x, y, s, o) draws an object's outline as a path (feet-centre), so the
   same path is the coloured owner and its grape shadow. Kinds: umb (closed umbrella), umbOpen (open, o.spoke: the
   missing spoke 0..4), pot (teapot), rab (rabbit), can (watering can), ket (kettle). o.notch: where the notch bites
   (0..3), drawn by notchOf(). */
const SHAPES = {
  umb(c) { c.moveTo(0, -46); c.lineTo(7, -12); c.lineTo(2, -12); c.lineTo(2, -4); c.quadraticCurveTo(2, 0, -2, 0); c.quadraticCurveTo(-6, 0, -6, -4); c.lineTo(-3, -4); c.lineTo(-2, -12); c.lineTo(-7, -12); c.closePath(); },
  umbOpen(c) { c.moveTo(-22, -24); c.quadraticCurveTo(0, -50, 22, -24); c.lineTo(15, -26); c.lineTo(8, -24); c.lineTo(0, -26); c.lineTo(-8, -24); c.lineTo(-15, -26); c.closePath(); c.rect(-1.5, -26, 3, 22); c.moveTo(1.5, -4); c.quadraticCurveTo(1.5, 0, -2, 0); c.quadraticCurveTo(-5, 0, -5, -4); c.lineTo(-3, -4); c.quadraticCurveTo(-3, -2, -2, -2); c.quadraticCurveTo(-0.5, -2, -0.5, -4); c.closePath(); },
  pot(c) { c.ellipse(0, -14, 14, 13, 0, 0, TAU); c.moveTo(12, -16); c.lineTo(26, -26); c.lineTo(24, -22); c.lineTo(13, -9); c.closePath(); c.moveTo(-12, -20); c.quadraticCurveTo(-24, -18, -12, -6); c.lineTo(-12, -10); c.quadraticCurveTo(-18, -14, -12, -16); c.closePath(); c.moveTo(-3, -27); c.arc(0, -29, 3, 0, TAU); c.rect(-9, -27, 18, 3); },
  rab(c) { c.ellipse(0, -10, 13, 10, 0, 0, TAU); c.moveTo(14, -18); c.arc(9, -18, 6, 0, TAU); c.ellipse(7, -32, 3, 10, -0.2, 0, TAU); c.ellipse(12, -31, 3, 10, 0.25, 0, TAU); c.moveTo(-10, -12); c.arc(-13, -12, 4, 0, TAU); },
  can(c) { c.rect(-12, -24, 22, 24); c.moveTo(10, -18); c.lineTo(28, -30); c.lineTo(30, -26); c.lineTo(10, -10); c.closePath(); c.moveTo(-12, -20); c.quadraticCurveTo(-24, -14, -12, -4); c.lineTo(-12, -8); c.quadraticCurveTo(-17, -14, -12, -16); c.closePath(); },
  ket(c) { c.moveTo(-14, 0); c.lineTo(-12, -20); c.quadraticCurveTo(0, -26, 12, -20); c.lineTo(14, 0); c.closePath(); c.moveTo(-8, -22); c.quadraticCurveTo(0, -38, 8, -22); c.lineTo(5, -22); c.quadraticCurveTo(0, -32, -5, -22); c.closePath(); c.moveTo(12, -14); c.lineTo(24, -20); c.lineTo(22, -16); c.lineTo(13, -7); c.closePath(); }
};
// where each kind's notch can bite: [x, y, angle] in shape coordinates
const NOTCHES = {
  umb: [[0, -40, 0], [5, -20, -1.4], [-5, -20, 1.4], [0, -12, Math.PI]],
  umbOpen: [[-18, -27, 0.4], [-8, -40, 0.3], [8, -40, -0.3], [18, -27, -0.4]],
  pot: [[0, -26, 0], [13, -14, -1.6], [-13, -14, 1.6], [0, -2, Math.PI]],
  rab: [[0, -19, 0], [12, -11, -1.6], [-12, -10, 1.6], [0, -1, Math.PI]],
  can: [[-6, -24, 0], [10, -14, -1.6], [-12, -6, 1.6], [0, 0, Math.PI]],
  ket: [[0, -24, 0], [13, -8, -1.6], [-13, -8, 1.6], [0, 0, Math.PI]]
};
ShadArt.shape = function (ctx, kind, x, y, s, o) {
  o = o || {}; ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s);
  ctx.beginPath(); (SHAPES[kind] || SHAPES.pot)(ctx);
  if (o.fill) { ctx.fillStyle = o.fill; ctx.fill('nonzero'); }
  if (o.lw !== 0) { ctx.strokeStyle = o.ink || INK; ctx.lineWidth = (o.lw || 2) / s; ctx.stroke(); }
  // the missing spoke of an open umbrella: a wedge of wall showing through its canopy
  if (kind === 'umbOpen' && o.spoke != null) { const sx = -15 + o.spoke * 7.5; ctx.fillStyle = o.hole || BUT; ctx.beginPath(); ctx.moveTo(sx - 3.5, -25); ctx.lineTo(sx + 3.5, -25); ctx.lineTo(sx * 0.3, -40); ctx.closePath(); ctx.fill(); }
  if (o.notch != null && NOTCHES[kind]) { const N = NOTCHES[kind][o.notch % 4]; ShadArt.notch(ctx, N[0], N[1], 1, N[2], o.hole || BUT); }
  ctx.restore();
};
// an owner: the object in colour, a dashed grape outline on the floor where its shadow should be
const OWN_COL = { umb: '#3a7ac8', umbOpen: '#3a7ac8', pot: '#e8f0f4', rab: '#f2ece0', can: '#4aa86a', ket: '#c8d0d8' };
ShadArt.owner = function (ctx, kind, x, y, s, t, o) {
  o = o || {};
  ctx.save();
  // the empty place where its shadow belongs: a bold dashed outline on the wall behind it
  ctx.save(); ctx.setLineDash([6, 4]); ctx.lineDashOffset = -(t || 0) * 10; ShadArt.shape(ctx, kind, x + 30 * s, y, s, { ink: INK, lw: 5 }); ShadArt.shape(ctx, kind, x + 30 * s, y, s, { ink: SAL_HI, lw: 2.5 }); ctx.restore();
  ShadArt.shape(ctx, kind, x, y + Math.sin((t || 0) * 3) * (o.happy ? 2 : 0), s, { fill: OWN_COL[kind] || WHITE, notch: o.notch, hole: o.hole || BUT, spoke: o.spoke, lw: 2 });
  // two little eyes (they are the department's customers, waiting)
  const ey = { umb: -30, umbOpen: -32, pot: -16, rab: -20, can: -16, ket: -12 }[kind] || -16, ex = kind === 'rab' ? 9 : 0;
  for (const dx of [-3.5, 3.5]) { ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + (ex + dx) * s, y + ey * s, 2.6 * s, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + (ex + dx) * s, y + (ey + (o.happy ? -0.5 : 0.6)) * s, 1.2 * s, 0, TAU); ctx.fill(); }
  ctx.restore();
};
// Brady's own flat cast shadow (the only shadow of his here): a grape shape of his outline, feet at (x, y), height h
// (px), leaning `lean` px at the top (away from the light), one arm up when `arm` (its hand: the returned point)
ShadArt.bradyShadow = function (ctx, x, y, h, lean, o) {
  o = o || {}; const w = Math.max(14, h * 0.32), hy = y - h, hx = x + lean, arm = o.arm !== false;
  const P = k => [x + lean * k, y - h * k];
  ctx.save(); ctx.fillStyle = o.col || 'rgba(58,24,72,0.9)'; ctx.beginPath();
  const [bx0, by0] = P(0), [bx1, by1] = P(0.72);
  ctx.moveTo(bx0 - w * 0.38, by0); ctx.lineTo(bx1 - w * 0.5, by1); ctx.lineTo(bx1 + w * 0.5, by1); ctx.lineTo(bx0 + w * 0.38, by0); ctx.closePath(); ctx.fill();
  const [hx0, hy0] = P(0.86); ctx.beginPath(); ctx.arc(hx0, hy0, w * 0.34, 0, TAU); ctx.fill();
  // the bun
  ctx.beginPath(); ctx.arc(hx0 + w * 0.24, hy0 - w * 0.3, w * 0.16, 0, TAU); ctx.fill();
  let hand = null;
  if (arm) {
    const [sx, sy] = P(0.7), ax = o.armDir || Math.sign(lean) || 1; hand = [hx + ax * w * 0.55, hy - h * 0.12];
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(4, w * 0.2); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx + ax * w * 0.3, sy); ctx.lineTo(hand[0], hand[1]); ctx.stroke();
    ctx.beginPath(); ctx.arc(hand[0], hand[1], Math.max(4, w * 0.16), 0, TAU); ctx.fill();
  }
  ctx.restore();
  return hand;
};

/* ---------------- painted backdrops (dim, outline-free: nothing here looks like a prop) ---------------- */
const painters = {
  // the department's far wall: butter plaster, rows of dim salmon filing slots, pinprick lamps, a long counter rail
  shadWall(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(c, -0.08); for (let y = 70; y < b - 100; y += 46) for (let x = (y / 46 % 2) * 30; x < BG_W; x += 60) ctx.fillRect(x + 4, y, 44, 30);
    ctx.fillStyle = shade(c, -0.16); for (let y = 70; y < b - 100; y += 46) for (let x = (y / 46 % 2) * 30; x < BG_W; x += 60) ctx.fillRect(x + 18, y + 22, 16, 4);
    for (let x = 40; x < BG_W; x += 150) { ctx.fillStyle = 'rgba(255,255,240,0.5)'; ctx.beginPath(); ctx.arc(x, 40, 3, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,250,210,0.18)'; ctx.beginPath(); ctx.arc(x, 40, 12, 0, TAU); ctx.fill(); }
    ctx.fillStyle = shade(c, -0.22); ctx.fillRect(0, b - 60, BG_W, H - b + 60);
    ctx.fillStyle = shade(c, -0.1); ctx.fillRect(0, b - 64, BG_W, 5);
  },
  // the long shelves of the lost-property store: tall racks of parcels, each throwing a soft grape shadow
  shadRacks(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    for (let x = 0; x < BG_W; x += 190) {
      ctx.fillStyle = shade(c, -0.1); ctx.fillRect(x + 10, 60, 150, b - 60);
      for (let y = 90; y < b - 20; y += 52) { ctx.fillStyle = shade(c, -0.2); ctx.fillRect(x + 10, y, 150, 5); for (let k = 0; k < 4; k++) { const w = 18 + rng() * 14, hh = 16 + rng() * 22; ctx.fillStyle = shade(c, -0.04 + rng() * 0.06); ctx.fillRect(x + 18 + k * 36, y - hh, w, hh); ctx.fillStyle = 'rgba(58,24,72,0.12)'; ctx.fillRect(x + 18 + k * 36 + w, y - hh + 4, 8, hh - 4); } }
    }
    ctx.fillStyle = shade(c, -0.24); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the lamp room: tall wainscoted walls, long soft grape shadows slanting across them (no lamps back here)
  shadLamps(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(c, -0.06); for (let x = 0; x < BG_W; x += 64) ctx.fillRect(x, b - 150, 30, 150);
    ctx.fillStyle = 'rgba(58,24,72,0.08)'; for (let x = 40; x < BG_W; x += 230) { ctx.beginPath(); ctx.moveTo(x, b); ctx.lineTo(x + 30, b); ctx.lineTo(x + 150, b - 200); ctx.lineTo(x + 110, b - 200); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = shade(c, -0.24); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the screen room: folding screens far back, their panels overlapping into darker patches
  shadScreens(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 20; x < BG_W; x += 170) for (let k = 0; k < 3; k++) { ctx.fillStyle = shade(c, -0.06 - (k % 2) * 0.05); ctx.beginPath(); ctx.moveTo(x + k * 36, b - 150 + (k % 2) * 8); ctx.lineTo(x + k * 36 + 36, b - 150 + ((k + 1) % 2) * 8); ctx.lineTo(x + k * 36 + 36, b); ctx.lineTo(x + k * 36, b); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(58,24,72,0.08)'; for (let x = 60; x < BG_W; x += 170) ctx.fillRect(x, b - 120, 90, 120);
    ctx.fillStyle = shade(c, -0.24); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the alterations room: bolts of cloth on racks, a long tape measure along the wall, spools
  shadTailor(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(c, 0.08); ctx.fillRect(0, 54, BG_W, 12); ctx.fillStyle = shade(c, -0.14); for (let x = 0; x < BG_W; x += 16) ctx.fillRect(x, 54, 1.5, x % 64 ? 5 : 10);
    for (let x = 30; x < BG_W; x += 120) for (let k = 0; k < 3; k++) { ctx.fillStyle = shade(['#c87a6a', '#7a8ac8', '#8ab87a'][(x / 120 + k | 0) % 3], -0.05); ctx.fillRect(x + k * 26, b - 130, 20, 70); ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x + k * 26 + 14, b - 130, 6, 70); }
    for (let x = 90; x < BG_W; x += 240) { ctx.fillStyle = shade(c, -0.14); ctx.beginPath(); ctx.arc(x, b - 30, 14, 0, TAU); ctx.fill(); }
    ctx.fillStyle = shade(c, -0.24); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the claims office: a long counter with ticket windows far back, a bell on each, a clock face
  shadOffice(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 30; x < BG_W; x += 140) { ctx.fillStyle = shade(c, -0.12); ctx.fillRect(x, b - 180, 90, 90); ctx.fillStyle = shade(c, 0.06); ctx.fillRect(x + 8, b - 172, 74, 60); ctx.fillStyle = shade(c, -0.16); ctx.fillRect(x + 30, b - 112, 30, 10); }
    for (let x = 100; x < BG_W; x += 420) { ctx.fillStyle = shade(c, 0.1); ctx.beginPath(); ctx.arc(x, 60, 26, 0, TAU); ctx.fill(); ctx.strokeStyle = shade(c, -0.2); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, 42); ctx.moveTo(x, 60); ctx.lineTo(x + 12, 64); ctx.stroke(); }
    ctx.fillStyle = shade(c, -0.18); ctx.fillRect(0, b - 80, BG_W, 80); ctx.fillStyle = shade(c, -0.08); ctx.fillRect(0, b - 84, BG_W, 6);
    ctx.fillStyle = shade(c, -0.26); ctx.fillRect(0, b, BG_W, H - b);
  },
  /* ---------- the secret rooms' own backdrops (all different) ---------- */
  // 35-1 DOWNBEAT DELIVERY: the parcel room: a conveyor of brown parcels far back, a big round clock
  roomParcel(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#6a8a9a'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#5a7a8a'; for (let x = 0; x < BG_W; x += 64) ctx.fillRect(x, 0, 30, b); ctx.fillStyle = '#4a5a64'; ctx.fillRect(0, b - 90, BG_W, 10); for (let x = 10; x < BG_W; x += 44) { ctx.fillStyle = '#b8946a'; ctx.fillRect(x, b - 114, 30, 24); ctx.fillStyle = '#9a7a54'; ctx.fillRect(x + 13, b - 114, 4, 24); } ctx.fillStyle = '#2e3a44'; ctx.fillRect(0, b - 8, BG_W, H - b + 8); },
  // 35-2 ONE WINDOW AJAR: the night-shift corridor: a wall of dark glass, rain streaks, a radiator
  roomRain(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#2a3450'; ctx.fillRect(0, 0, BG_W, H); ctx.strokeStyle = 'rgba(170,190,230,0.25)'; ctx.lineWidth = 1.2; for (let k = 0; k < 140; k++) { const x = rng() * BG_W, y = rng() * b; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 12); ctx.stroke(); } ctx.fillStyle = '#3a4460'; ctx.fillRect(0, b - 50, BG_W, 50); ctx.fillStyle = '#4a5474'; for (let x = 0; x < BG_W; x += 12) ctx.fillRect(x, b - 46, 6, 36); ctx.fillStyle = '#1a2236'; ctx.fillRect(0, b - 8, BG_W, H - b + 8); },
  // 35-3 BORROWED FOOT: the boot room: rows of cubbies far back, tiled floor
  roomBoot(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#8a9a6a'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#7a8a5a'; for (let y = 30; y < b - 60; y += 40) for (let x = 0; x < BG_W; x += 40) ctx.fillRect(x + 3, y + 3, 34, 34); ctx.fillStyle = '#5a6a40'; ctx.fillRect(0, b - 8, BG_W, H - b + 8); },
  // 35-4 COLD CUP: the staff kitchen: tiles, a kettle shelf, a hatch far back
  roomKitchen(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#e8e4d8'; ctx.fillRect(0, 0, BG_W, H); ctx.strokeStyle = '#cfcabc'; ctx.lineWidth = 1.5; for (let y = 0; y < b; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); } for (let x = 0; x < BG_W; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, b); ctx.stroke(); } ctx.fillStyle = '#b8a888'; ctx.fillRect(0, 70, BG_W, 6); ctx.fillStyle = '#8a7a6a'; ctx.fillRect(0, b - 8, BG_W, H - b + 8); },
  // 35-5 PRINT RUN: the cut-out workshop: paper sheets pinned up, a long cutting mat, a lamp hanging low
  roomCutout(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#3a2a4a'; ctx.fillRect(0, 0, BG_W, H); for (let x = 20; x < BG_W; x += 70) { ctx.fillStyle = '#5a4a6a'; ctx.fillRect(x, 30 + (x % 3) * 8, 46, 58); ctx.fillStyle = '#6a5a7a'; ctx.fillRect(x + 8, 40 + (x % 3) * 8, 30, 4); } ctx.fillStyle = '#4a7a5a'; ctx.fillRect(0, b - 40, BG_W, 30); ctx.strokeStyle = '#5a8a6a'; ctx.lineWidth = 1; for (let x = 0; x < BG_W; x += 20) { ctx.beginPath(); ctx.moveTo(x, b - 40); ctx.lineTo(x, b - 10); ctx.stroke(); } ctx.fillStyle = '#221630'; ctx.fillRect(0, b - 8, BG_W, H - b + 8); }
};
// each secret room its own floor and walls
const MATS = {
  crate: { base: '#8a6a4a', cap: '#c89a62', capLo: '#6a4a2e', pat(ctx) { ctx.fillStyle = '#7a5a3a'; ctx.fillRect(0, 10, TS, 2); ctx.fillRect(0, 22, TS, 2); ctx.fillRect(TS / 2, 0, 2, 10); } },
  rubber: { base: '#3a4258', cap: '#6a7a9a', capLo: '#2a3246', pat(ctx) { ctx.fillStyle = '#323a50'; for (let y = 4; y < TS; y += 8) ctx.fillRect(0, y, TS, 3); } },
  tile: { base: '#c8c0a0', cap: '#6a7a4a', capLo: '#4a5a30', pat(ctx) { ctx.fillStyle = '#b8b090'; ctx.fillRect(0, 0, TS / 2 - 1, TS / 2 - 1); ctx.fillRect(TS / 2, TS / 2, TS / 2 - 1, TS / 2 - 1); } },
  lino: { base: '#a84a4a', cap: '#f0ece0', capLo: '#c8c0b0', pat(ctx) { ctx.fillStyle = '#984040'; for (let k = 0; k < 5; k++) ctx.fillRect((k * 13) % TS, (k * 7) % TS, 6, 2); } },
  mat: { base: '#2a5a3a', cap: '#5a9a6a', capLo: '#1a4028', pat(ctx) { ctx.strokeStyle = '#3a6a4a'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, TS / 2, TS / 2); ctx.strokeRect(TS / 2 + 0.5, TS / 2 + 0.5, TS / 2 - 1, TS / 2 - 1); } }
};
const mat = k => {
  const M = MATS[k];
  const ground = { style: 'shadroom_' + k, cap: M.cap, capHi: M.cap, dirt: M.base, dirt2: M.capLo, rock: M.base,
    paint(ctx, rng) { ctx.fillStyle = M.base; ctx.fillRect(0, 0, TS, TS); M.pat(ctx, rng || (() => 0.5)); },
    paintCap(ctx, x0, x1) { ctx.fillStyle = M.capLo; ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = M.cap; ctx.fillRect(x0, 0, x1 - x0, 7); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x0, 0, x1 - x0, 1.5); ctx.fillStyle = INK; ctx.fillRect(x0, 9.5, x1 - x0, 1.5); } };
  return { ground, hard: { c1: M.base, c2: M.capLo, paint(ctx, rng) { ctx.fillStyle = shade(M.base, -0.2); ctx.fillRect(0, 0, TS, TS); M.pat(ctx, rng || (() => 0.5)); } } };
};
const room = (name, painter, extra) => Object.assign({}, office, { name, music: 'tour_shad_room', particles: 'none', rays: null, sky: ['#2a2032', '#3a2c40', '#4a3848'], horizonGlow: '#ffe0b0', celestial: { type: 'none' }, stars: 0, layers: [{ kind: painter, base: 400, f: 0.05 }], fog: '#3a2c40', decor: [] }, extra || {});
const inside = (name, sky, layers, extra) => Object.assign({}, office, { name, music: 'tour_shad', particles: 'none', rays: null, sky, horizonGlow: sky[2], celestial: { type: 'none' }, stars: 0, layers, fog: sky[1], decor: ['shadCrate', 'shadBell', 'shadSpool'] }, extra || {});
const themes = {
  shad_lost: inside('Lost Property', ['#e8cc70', '#f0d67c', '#f6dc88'], [{ kind: 'shadWall', color: '#f0d478', base: 392, f: 0.06 }, { kind: 'shadRacks', color: '#e2c468', base: 400, f: 0.12 }]),
  shad_lamp: inside('The Lamp Room', ['#c8a85a', '#d4b466', '#e0c072'], [{ kind: 'shadLamps', color: '#d2b264', base: 392, f: 0.07 }], { decor: ['shadCrate', 'shadSpool'], music: 'tour_shad_lamp' }),
  shad_screens: inside('The Screen Room', ['#e6c0a0', '#ecc8a8', '#f2d0b0'], [{ kind: 'shadScreens', color: '#eac6a4', base: 392, f: 0.07 }], { decor: ['shadBell', 'shadCrate'] }),
  shad_tailor: inside('Alterations', ['#d8c890', '#e0d09a', '#e8d8a4'], [{ kind: 'shadTailor', color: '#dccc94', base: 392, f: 0.07 }], { decor: ['shadSpool', 'shadCrate'], music: 'tour_shad_lamp' }),
  shad_claims: inside('The Claims Office', ['#b8a070', '#c4ac7a', '#d0b884'], [{ kind: 'shadOffice', color: '#c2aa78', base: 392, f: 0.06 }], { decor: ['shadBell', 'shadCrate'] }),
  shad_arena: inside('The Understudy\'s Counter', ['#4a3a4a', '#5a4858', '#6a5666'], [{ kind: 'shadOffice', color: '#7a6870', base: 392, f: 0.05 }], { decor: [], music: 'tour_shad_boss' }),
  shad_room_parcel: room('The Parcel Room', 'roomParcel', mat('crate')),
  shad_room_rain: room('The Night Corridor', 'roomRain', mat('rubber')),
  shad_room_boot: room('The Boot Room', 'roomBoot', mat('tile')),
  shad_room_kitchen: room('The Staff Kitchen', 'roomKitchen', mat('lino')),
  shad_room_cutout: room('The Cut-Out Workshop', 'roomCutout', mat('mat'))
};

/* ---------------- props (Decor) ---------------- */
const decor = {
  // an unclaimed parcel with its ticket, and its own little grape shadow (with the notch)
  shadCrate(ctx, x, y, t, th, d) { ctx.save(); ctx.fillStyle = 'rgba(58,24,72,0.55)'; ctx.fillRect(x - 6, y - 18, 22, 18); ShadArt.notch(ctx, x + 12, y - 18, 0.7, 0, 'rgba(240,212,120,0.9)'); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = '#c89a62'; ctx.fillRect(x - 12, y - 20, 22, 20); ctx.strokeRect(x - 12, y - 20, 22, 20); ctx.fillStyle = '#a87a42'; ctx.fillRect(x - 3, y - 20, 4, 20); ShadArt.tag(ctx, x + 12, y - 8, 0.8); ctx.restore(); },
  // a counter bell on a little stool
  shadBell(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillStyle = SAL_LO; ctx.fillRect(x - 8, y - 18, 3, 18); ctx.fillRect(x + 5, y - 18, 3, 18); ctx.fillStyle = SAL; rr(ctx, x - 11, y - 22, 22, 5, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8c84a'; ctx.beginPath(); ctx.arc(x, y - 22, 7, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y - 30, 1.8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); },
  // a cotton spool, big as a stool
  shadSpool(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillStyle = '#d8b88a'; ctx.fillRect(x - 10, y - 4, 20, 4); ctx.strokeRect(x - 10, y - 4, 20, 4); ctx.fillRect(x - 10, y - 22, 20, 4); ctx.strokeRect(x - 10, y - 22, 20, 4); ctx.fillStyle = SAL; ctx.fillRect(x - 7, y - 18, 14, 14); ctx.strokeRect(x - 7, y - 18, 14, 14); ctx.strokeStyle = SAL_LO; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 7, y - 16 + k * 3.5); ctx.lineTo(x + 7, y - 15 + k * 3.5); ctx.stroke(); } ctx.restore(); },
  // the land's tell: a door's shadow on the wall with no door to cast it (and the notch), right by a way in
  shadTell(ctx, x, y, t) { ctx.save(); ctx.fillStyle = 'rgba(58,24,72,0.7)'; const w = 22, h = 40, x0 = x - 4; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0, y - h + 8); ctx.quadraticCurveTo(x0, y - h, x0 + 8, y - h); ctx.lineTo(x0 + w - 4, y - h); ctx.lineTo(x0 + w + 4, y); ctx.closePath(); ctx.fill(); ShadArt.notch(ctx, x0 + w * 0.5, y - h, 0.8, 0); ctx.fillStyle = 'rgba(255,240,190,0.55)'; ctx.beginPath(); ctx.arc(x0 + w - 4, y - h * 0.5, 2, 0, TAU); ctx.fill(); ctx.restore(); },
  shadTellLow(ctx, x, y, t) { decor.shadTell(ctx, x, y + 40, t); }
};
const decorLights = {};

/* ---------------- door looks: the department's office door, a hatch in the filing wall ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'shadDoor' || look === 'shadHatch') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (look === 'shadDoor') {
        ctx.fillStyle = SAL; rr(ctx, x - 20, y - 60, 40, 60, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e8f0f0'; ctx.fillRect(x - 13, y - 52, 26, 20); ctx.strokeRect(x - 13, y - 52, 26, 20);
        ctx.fillStyle = INK; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('CLAIMS', x, y - 40);
        ctx.fillStyle = BUT; ctx.beginPath(); ctx.arc(x + 13, y - 28, 2.6, 0, TAU); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = GRA_LO; rr(ctx, x - 16, y - 40, 32, 40, 3); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = SAL; ctx.lineWidth = 1.5; ctx.strokeRect(x - 11, y - 35, 22, 30);
        ctx.fillStyle = BUT; ctx.fillRect(x - 6, y - 22, 12, 3);
      }
      if (near) { ctx.fillStyle = '#ffffff'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('▲', x, y - 68 + Math.sin(t * 6) * 2); }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// THUMB RABBIT: a flat grape rabbit (a hand shadow come loose). Every few seconds it stops and folds its ears into a
// comic hand-shadow duck, quacking at nobody (a harmless, stompable moment); then back to a rabbit.
const rabbitArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1);
  const duck = e.rst === 'duck', hop = m === 'walk' ? Math.abs(Math.sin(t * 9)) * 3 : 0;
  ctx.translate(0, -hop); ctx.fillStyle = GRA; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(-2, -11, 13, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-15, -10, 5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(9, -19, 8, 0, TAU); ctx.fill(); ctx.stroke();
  if (duck) {
    // the ears turned into a duck's head and bill, quacking
    const q = Math.sin(t * 14) > 0 ? 3 : 0;
    ctx.beginPath(); ctx.arc(10, -34, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = GRA_HI; ctx.beginPath(); ctx.moveTo(15, -36); ctx.lineTo(27, -36 - q); ctx.lineTo(16, -33); ctx.lineTo(27, -30 + q); ctx.lineTo(15, -31); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(11, -36, 1.8, 0, TAU); ctx.fill();
  } else {
    ctx.beginPath(); ctx.ellipse(5, -34, 3.5, 11, -0.25, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(12, -33, 3.5, 11, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
  }
  ShadArt.notch(ctx, -6, -21, 0.7, 0);
  ctx.fillStyle = WHITE; ctx.beginPath(); ctx.ellipse(12, -21, 3, 3.4, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(13, -21, 1.4, 0, TAU); ctx.fill();
  ctx.restore();
};
// STAPLE HOUND: a salmon stapler shaped like a dog. When Brady comes near it staples its own leash to the floor (CHK!,
// a staple and a taut leash: the tell), then lunges, but only as far as the leash lets it.
const houndArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const notice = m === 'notice', lunge = m === 'charge', st = m === 'walk' ? Math.sin(t * 12) * 2 : 0;
  ctx.fillStyle = SAL_LO; for (const [lx, d] of [[-12, st], [-5, -st], [6, st], [12, -st]]) ctx.fillRect(lx - 2.5 + d * 0.4, -8, 5, 8);
  // the stapler body: a base and a hinged top (open while it lunges)
  ctx.fillStyle = SAL; rr(ctx, -18, -14, 36, 8, 3); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(-14, -14); ctx.rotate(lunge ? -0.35 : notice ? -0.12 : 0); ctx.fillStyle = SAL_HI; rr(ctx, 0, -10, 34, 10, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d8dce0'; ctx.fillRect(4, -2, 26, 3); ctx.restore();
  ctx.fillStyle = BUT; ctx.beginPath(); ctx.arc(-14, -12, 3.4, 0, TAU); ctx.fill(); ctx.stroke();
  // the head, a floppy ear, a nose
  ctx.fillStyle = SAL; ctx.beginPath(); ctx.ellipse(20, -20, 9, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = SAL_LO; ctx.beginPath(); ctx.ellipse(16, -22, 4, 8, 0.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(28, -20, 2.6, 0, TAU); ctx.fill();
  ctx.fillStyle = WHITE; ctx.beginPath(); ctx.ellipse(22, -24, 2.6, notice ? 1.4 : 2.6, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(23, -24, 1.2, 0, TAU); ctx.fill();
  if (notice) { ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(18, -29); ctx.lineTo(25, -27); ctx.stroke(); }
  // the tail: a curled leash
  ctx.strokeStyle = BUT; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-18, -12); ctx.quadraticCurveTo(-26, -20, -22, -26); ctx.stroke();
  ctx.restore();
  // stapled: a taut yellow leash from the staple on the floor (world coordinates)
  if (e.staple != null && (notice || lunge)) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(e.staple, e.y + e.h); ctx.lineTo(x - (e.dir || 1) * 16, y - 10); ctx.stroke(); ctx.strokeStyle = BUT; ctx.lineWidth = 2.4; ctx.stroke();
    ctx.fillStyle = '#d8dce0'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.fillRect(e.staple - 6, e.y + e.h - 4, 12, 4); ctx.strokeRect(e.staple - 6, e.y + e.h - 4, 12, 4);
    ctx.restore();
  }
};
// SHADE FLEA: a butter-yellow flea that hops high; its grape shadow can't keep up and scuttles after it on foot
const fleaArt = (ctx, e, x, y, m, t) => {
  // the shadow on the floor, scuttling to catch up (drawn first, flat and dark, with the notch)
  const fy = e.floorY != null ? e.floorY : y, sx = e.shX != null ? e.shX : x;
  ctx.save(); ctx.fillStyle = GRA; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(sx, fy - 4, 10, 4.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = GRA; ctx.lineWidth = 1.6; for (let k = -1; k <= 1; k++) { const l = Math.sin(t * 22 + k) * 3; ctx.beginPath(); ctx.moveTo(sx + k * 5, fy - 3); ctx.lineTo(sx + k * 5 + l, fy); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.fillStyle = BUT; ctx.beginPath(); ctx.ellipse(-2, -12, 11, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = BUT_LO; ctx.lineWidth = 1.5; for (const xx of [-7, -2, 3]) { ctx.beginPath(); ctx.moveTo(xx, -19); ctx.lineTo(xx, -5); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillStyle = BUT_HI; ctx.beginPath(); ctx.arc(9, -14, 6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(11, -15, 2.6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(11.6, -15, 1.2, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(10, -20); ctx.quadraticCurveTo(14, -28, 18, -26); ctx.stroke();
  const tuck = m === 'hop'; for (const lx of [-8, -2, 4]) { ctx.beginPath(); ctx.moveTo(lx, -5); ctx.lineTo(lx + (tuck ? -4 : 2), tuck ? -2 : 0); ctx.stroke(); }
  ctx.restore();
};
// CARBON CROW: a grape crow with a salmon beak that steals outlines: it carries the dashed outline of a key, and now and
// then the shiny key itself drops out (it only wanted the outline) and lies twinkling on the floor a moment
const crowArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(-(e.dir || 1), 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  const f = Math.sin(t * 10);
  ctx.fillStyle = GRA_HI; ctx.save(); ctx.translate(2, -6); ctx.rotate(-0.3 - f * 0.5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, -10); ctx.lineTo(14, -2); ctx.lineTo(20, 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = GRA; ctx.beginPath(); ctx.ellipse(0, -4, 12, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(18, -8); ctx.lineTo(18, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(-10, -10, 6.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = SAL; ctx.beginPath(); ctx.moveTo(-15, -12); ctx.lineTo(-25, -9); ctx.lineTo(-15, -7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(-11, -12, 2.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-11.8, -12, 1.1, 0, TAU); ctx.fill();
  ShadArt.notch(ctx, 0, -12, 0.6, 0, BUT);
  // the stolen outline of a key, dangling from its feet
  ctx.save(); ctx.setLineDash([3, 2]); ctx.strokeStyle = WHITE; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(-2, 10, 4, 0, TAU); ctx.moveTo(2, 10); ctx.lineTo(12, 10); ctx.lineTo(12, 14); ctx.moveTo(8, 10); ctx.lineTo(8, 13); ctx.stroke(); ctx.restore();
  ctx.restore();
  if (e.keyT > 0) { ctx.save(); const k = Math.min(1, e.keyT); ctx.globalAlpha = k; ctx.fillStyle = '#ffd84a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; const kx = e.keyX, ky = e.keyY; ctx.beginPath(); ctx.arc(kx - 6, ky - 4, 4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillRect(kx - 2, ky - 5, 12, 3); ctx.strokeRect(kx - 2, ky - 5, 12, 3); ctx.fillStyle = 'rgba(255,255,255,0.9)'; const s = 3 + Math.sin(e.t * 9) * 2; ctx.fillRect(kx + 4, ky - 12 - s, 2, s * 2); ctx.restore(); }
};
const rabbitThink = (e, dt) => {
  e.rt = (e.rt || 0) + dt; if (!e.rst) e.rst = 'walk';
  if (e.rst === 'walk') { e.mode = 'walk'; if (!e.vx || e.hitWall) e.vx = e.dir * e.speed; if (e.rt > 3.0) { e.rst = 'duck'; e.rt = 0; e.vx = 0; if (e.g.onScreen(e)) Tour.shadKit.pill(e.g, e.cx, e.y - 16, 'QUACK? (IT\'S A HAND DUCK)', '#e8d0ff'); } }
  else { e.mode = 'idle'; e.vx = 0; if (e.rt > 1.6) { e.rst = 'walk'; e.rt = 0; e.vx = e.dir * e.speed; } }
};
const fleaHop = e => { if (e.shX == null) e.shX = e.cx; };
const harmlessWhen = (cls, fn) => { const tp = cls.prototype.touchPlayer; cls.prototype.touchPlayer = function (p) { if (fn(this)) return; return tp.call(this, p); }; return cls; };
const enemies = {
  shadRabbit: { cls: harmlessWhen(TourEnemy.make({ w: 30, h: 30, speed: 1.0, edgeTurn: true, art: rabbitArt, burst: GRA_HI, think: rabbitThink }), e => e.rst === 'duck'), place: 'walk' },
  shadHound: { cls: TourEnemy.make({ w: 34, h: 26, speed: 0.9, edgeTurn: true, behavior: 'charge', range: 4.5, windup: 0.8, chargeT: 0.42, chargeSpeed: 5.2, art: houndArt, burst: SAL,
    onNotice: e => { e.staple = e.cx - e.dir * 20; if (e.g.onScreen(e)) Tour.shadKit.pill(e.g, e.cx, e.y - 18, 'CHK! (STAPLED)', '#ffd0c0'); } }), place: 'walk' },
  shadFlea: { cls: TourEnemy.make({ w: 24, h: 20, speed: 1.1, edgeTurn: true, behavior: 'hop', hopV: 8.5, hopEvery: 1.6, art: fleaArt, burst: BUT, onHop: fleaHop }), place: 'walk' },
  shadCrow: { cls: TourFlyer.make({ w: 30, h: 22, range: 3, speed: 0.9, art: crowArt, burst: GRA_HI }), place: 'fly' }
};
// the flea's shadow runs after it along the floor; the crow drops its shiny key now and then
{
  const F = enemies.shadFlea.cls, u0 = F.prototype.update;
  F.prototype.update = function (dt) { const r = u0.call(this, dt); if (this.shX == null) this.shX = this.cx; this.shX += clamp(this.cx - this.shX, -2.2 * TS * dt, 2.2 * TS * dt); if (this.onGround) this.floorY = this.y + this.h; else if (this.floorY == null) this.floorY = this.y + this.h; return r; };
  const C = enemies.shadCrow.cls, u1 = C.prototype.update;
  C.prototype.update = function (dt) { const r = u1.call(this, dt); this.kt = (this.kt || 0) + dt; if (this.keyT > 0) this.keyT -= dt * 0.5; if (this.kt > 5 && !this.dead) { this.kt = 0; this.keyX = this.cx; this.keyY = this.y + this.h + 40; this.keyT = 1.6; } return r; };
}

/* ---------------- the route map: a notched grape shadow on a salmon tag ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.2) * 0.06);
  ShadArt.tag(ctx, 0, 0, r / 8, SAL);
  ShadArt.shape(ctx, 'umb', -r * 0.15, r * 0.55, r / 46, { fill: GRA, notch: 1, lw: 1.2 });
  ctx.restore();
};

/* ---------------- the land's map: sprites ---------------- */
Object.assign(TourOWPaint.art, {
  shadLampS(c, r) { ShadArt.cone(c, 0, -r * 1.4, 0, r * 0.7, 0.9); ShadArt.floorLamp(c, 0, 0, r * 1.6, true, 0); },
  shadUmbS(c, r) { ShadArt.shape(c, 'umb', r * 0.4, 0, r / 40, { fill: GRA, notch: 1, lw: 1 }); ShadArt.shape(c, 'umb', 0, 0, r / 40, { fill: '#3a7ac8', lw: 1 }); },
  shadPotS(c, r) { ShadArt.shape(c, 'pot', r * 0.5, 0, r / 26, { fill: GRA, notch: 0, lw: 1 }); ShadArt.shape(c, 'pot', 0, 0, r / 26, { fill: WHITE, lw: 1 }); },
  shadDrawerS(c, r) { c.save(); c.fillStyle = SAL; c.strokeStyle = INK; c.lineWidth = 1.4; c.fillRect(-r * 0.7, -r * 1.4, r * 1.4, r * 1.4); c.strokeRect(-r * 0.7, -r * 1.4, r * 1.4, r * 1.4); c.beginPath(); c.moveTo(-r * 0.7, -r * 0.7); c.lineTo(r * 0.7, -r * 0.7); c.stroke(); c.fillStyle = BUT; c.fillRect(-r * 0.25, -r * 1.1, r * 0.5, r * 0.15); c.fillRect(-r * 0.25, -r * 0.4, r * 0.5, r * 0.15); c.restore(); }
});
// the land under the trails: butter floor with long grape shadows lying across it
TourOWScenes.groundPaint.shad = function (c, ow) {
  const R = TourOWPaint.rng('shadground');
  c.save(); c.globalAlpha = 0.18; c.fillStyle = GRA; for (let k = 0; k < 9; k++) { const x = 200 + R() * 1100, y = 200 + R() * 460; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 140, y + 40); c.lineTo(x + 150, y + 58); c.lineTo(x + 6, y + 18); c.closePath(); c.fill(); } c.restore();
};
TourLandscape.looks.shad = ['#f0d478', '#f08470', '#5a2a6a', '#fff0b4', '#fffdf2', '#3a1848', 'shadLamp'];
{
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'shadLamp') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40);
    ShadArt.cone(ctx, 0, -40, 0, 22, 0.8); ShadArt.floorLamp(ctx, 0, 0, 46, true, 0); ShadArt.shape(ctx, 'umb', 20, 0, 0.6, { fill: GRA, notch: 1, lw: 1 });
    ctx.restore();
  };
}

/* ---------------- music: a soft office foxtrot, a lamp-lit tango, a music-box room tune, the boss ---------- */
const tracks = {
  tour_shad: {
    bpm: 112, bars: 8, rv: 0.36, sw: 0.18, hx: 0.04,
    ch: 'F Dm Gm C F A7 Dm C7',
    ld: 'A6:2 C7:2 F7:4 E7:2 D7:2 | C7:4 A6:4 F6:8 | Bb6:2 D7:2 G7:4 F7:2 E7:2 | E7:4 C7:4 G6:8 |' +
        'A6:2 C7:2 F7:4 A7:2 G7:2 | E7:4 C#7:4 A6:8 | D7:2 F7:2 A7:4 G7:2 F7:2 | E7:4 G7:4 C7:8',
    li: 'vibes', lv: 0.13,
    bp: 'r...f...r...f...', bi: 'pluck', bv: 0.24,
    ap: '..c...c...c...c.', ai: 'harp', av: 0.05, ao: 60,
    dr: ['k.......k.......', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.22
  },
  tour_shad_lamp: {
    bpm: 100, bars: 8, rv: 0.32, hx: 0.04,
    ch: 'Am E7 Am Dm G C E7 Am',
    ld: 'E6:3 A6:1 C7:2 B6:2 A6:8 | G#6:3 B6:1 E7:4 D7:8 | C7:3 E7:1 A7:4 G7:8 | F7:3 E7:1 D7:4 A6:8 |' +
        'B6:3 D7:1 G7:4 F7:8 | E7:3 C7:1 G6:4 C7:8 | B6:3 G#6:1 E6:4 D7:8 | C7:4 B6:4 A6:8',
    li: 'clav', lv: 0.12,
    bp: 'r..r..r.r...r...', bi: 'slapb', bv: 0.24,
    ap: '.c...c...c...c..', ai: 'vibes', av: 0.05, ao: 58,
    dr: ['k..k..k.....k...', '....s.......s...', '..h...h...h...h.'], dv: 0.24
  },
  tour_shad_room: {
    bpm: 88, bpb: 3, bars: 8, rv: 0.5, dl: 0.2, hx: 0.03,
    ch: 'C G Am F C G F G',
    ld: 'E7:3 G7:3 C7:6 | D7:3 B6:3 G6:6 | C7:3 E7:3 A7:6 | F7:6 A7:6 | G7:3 E7:3 C7:6 | B6:3 D7:3 G7:6 | A7:3 F7:3 C7:6 | D7:12',
    li: 'mbox', lv: 0.13,
    bp: 'r.....r.....', bi: 'sub', bv: 0.2,
    ap: 'c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 64,
    dr: ['k...........', '......s.....', '..h...h...h.'], dv: 0.15
  },
  tour_shad_boss: {
    bpm: 140, bars: 8, rv: 0.3, hx: 0.07,
    ch: 'Dm Dm Bb C Dm Dm Gm A7',
    ld: 'D6:2 F6:2 A6:2 D7:2 C7:4 A6:4 | Bb6:2 A6:2 G6:2 F6:2 D6:8 | Bb6:2 D7:2 F7:2 D7:2 C7:4 Bb6:4 | C7:4 E7:4 G7:8 |' +
        'A6:2 G6:2 F6:2 D6:2 F6:4 A6:4 | G6:2 F6:2 E6:2 F6:2 D6:8 | G6:2 Bb6:2 D7:2 G7:2 F7:4 D7:4 | E7:4 C#7:4 A6:8',
    li: 'clav', lv: 0.15,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'reese', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'brass', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s..s', 'h.h.h.h.h.h.h.h.'], dv: 0.4
  }
};

Tour.country({
  id: 'shad', secret: true, bonus: true, colors: COL, tagline: 'A hidden land: shadows that Piwi\'s spotlight left behind, waiting to be claimed',
  themes, painters, decor, decorLights, enemies, tracks,
  music: { level: 'tour_shad', boss: 'tour_shad_boss', map: null },
  landmark: 'the lost-property office for shadows', emblem,
  arrival: 'Brady! You found the keyhole in the locker\'s shadow. Behind it is a whole department of shadows nobody came back for. I asked if they had yours. They gave me a ticket. ♥ C',
  coin: { name: 'TICKETS', draw(ctx, x, y) {
    ctx.save(); ctx.fillStyle = SAL; ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - 7, y - 6); ctx.lineTo(x + 7, y - 6); ctx.lineTo(x + 7, y - 2); ctx.arc(x + 7, y, 2, -Math.PI / 2, Math.PI / 2, true); ctx.lineTo(x + 7, y + 6); ctx.lineTo(x - 7, y + 6); ctx.lineTo(x - 7, y + 2); ctx.arc(x - 7, y, 2, Math.PI / 2, -Math.PI / 2, true); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = BUT; ctx.fillRect(x - 4, y - 2, 8, 4); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 6, y - 5, 4, 1.5); ctx.restore();
  } },
  levels: []
});
LIQUIDS.shad_ink = ['#3a1848', '#2a1036', '#1a0824', 'rgba(124,74,140,0.4)', null, 'rgba(200,170,230,0.6)'];
// a floating line on a dark rounded pill (readable on any wall), kept clear of Brady's head and the top bar
class ShadPill extends Ent {
  constructor(g, x, y, text, col) { super(g, null, 4, 4); this.x = x; this.y = y; this.text = String(text); this.col = col || '#ffe08a'; this.life = 1.8; this.friendly = true; }
  update(dt) { this.t += dt; this.y -= 10 * dt; if (this.t > this.life) this.remove = true; }
  touchPlayer() {}
  draw(ctx) {
    const g = this.g, p = g.player, a = Math.min(1, (this.life - this.t) * 3, this.t * 8);
    ctx.save(); ctx.globalAlpha = a; ctx.font = '10px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(this.text).width + 18;
    let x = clamp(this.x, g.camX + w / 2 + 6, g.camX + Game.viewW - w / 2 - 6), y = this.y;
    if (p && Math.abs(x - p.cx) < w / 2 + 16 && y > p.y - 30 && y < p.y + p.h) y = p.y - 30;
    y = Math.max(y, g.camY + 64);
    ctx.fillStyle = 'rgba(28,20,38,0.9)'; rr(ctx, x - w / 2, y - 10, w, 20, 10); ctx.fill();
    ctx.fillStyle = this.col; ctx.fillText(this.text, x, y + 1); ctx.restore();
  }
}
ENTITY_TYPES.shadPill = ShadPill;
const pill = (g, x, y, text, col) => { if (g && g.spawn) g.spawn(new ShadPill(g, x, y, text, col)); };
Tour.shadKit = { pill, ShadArt, COL, INK, BUT, BUT_HI, BUT_LO, GRA, GRA_HI, GRA_LO, GRA_DK, SAL, SAL_HI, SAL_LO, WHITE, LIGHT, crowArt, rabbitArt };
})();
