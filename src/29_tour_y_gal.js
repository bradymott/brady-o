/* ============================================================
   THE UNFLATTERING GALLERY (world 30, cc 'gal'): hidden land A5 (docs/design/CHATGPT_RELAY.md §A5).
   "Piwi rejected every tour portrait in which his mouth was open. That filled an entire gallery."
   Aubergine frames, mustard ovals, powder-blue sight lines and chalk-white busts. Every portrait and every bust in
   the land is of Piwi Squirmin' (the game's own dummy, drawn with Piwi.head), of Pupo, or of an animal or object:
   no real-looking people anywhere. The backdrop's pictures are plain dim rectangles; the frames Brady plays with
   are bright, inked and pulse.
   Its door: in Italy 14-1 SCOOTER DASH, the little piazza just before the finish: a gallery's framed picture hangs
   under the arcade over a fountain, and its reflection has one more nail than the real frame (29_tour_y_gal_e_entry.js).
   This file: the stop, the looks (tiles, themes, painted backdrops, props), the critters, the route-map emblem, the
   map's sprites, the music and the country. The mechanics: 29_tour_y_gal_a_mech.js; the secret rooms:
   29_tour_y_gal_b_rooms.js; the boss: 29_tour_y_gal_c_boss.js; the levels and the map: 29_tour_y_gal_d_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'gal', world: 30, name: 'The Unflattering Gallery', sub: 'a hidden land', lon: 19, lat: 37.2, secret: true, bonus: true, d0: 0.8, pin: 'gal' });
const COL = { a: '#5a2346', b: '#e2b33a', c: '#9ab8e8' };
const INK = '#1c1426';
const AUB = '#5a2346', AUB_HI = '#844070', AUB_LO = '#3a1430', MUS = '#e2b33a', MUS_HI = '#f6d872', MUS_LO = '#a87c1c';
const BLUE = '#9ab8e8', BLUE_LO = '#5a78b8', CHALK = '#f4efe4', CHALK_LO = '#d2c8b6', MARBLE = '#efe6d4', WHITE = '#fffdf6';

/* ---------------- tiles: the gallery floor and skirting, the picture-rail ledge, framed panels ---------------- */
const floorTile = {
  style: 'galFloor', cap: MARBLE, capHi: WHITE, dirt: AUB, dirt2: AUB_LO, rock: AUB_LO,
  paint(ctx, rng) {
    rng = rng || (() => 0.5);
    ctx.fillStyle = AUB; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = AUB_LO; ctx.fillRect(0, TS - 3, TS, 3);
    ctx.strokeStyle = 'rgba(255,220,240,0.12)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 16.5); ctx.lineTo(TS, 16.5); ctx.stroke();
    if (rng() < 0.3) { ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(4 + rng() * 16, 4, 6, 8); }
  },
  // the cap: a cream marble top with grey veins, a mustard moulding under it
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = MUS_LO; ctx.fillRect(x0, 0, x1 - x0, 13);
    ctx.fillStyle = MUS; ctx.fillRect(x0, 8, x1 - x0, 4);
    ctx.fillStyle = MARBLE; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = WHITE; ctx.fillRect(x0, 0, x1 - x0, 2);
    ctx.strokeStyle = 'rgba(90,80,100,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); for (let x = x0 + 6; x < x1; x += 22) { ctx.moveTo(x, 1); ctx.quadraticCurveTo(x + 5, 6, x + 12, 3); } ctx.stroke();
    ctx.fillStyle = INK; ctx.fillRect(x0, 12, x1 - x0, 1.5);
  }
};
// the one-way ledge: a picture rail shelf, aubergine with a mustard lip
const railSemi = {
  style: 'galRail', c1: AUB_HI, c2: AUB,
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = AUB; ctx.fillRect(x0, 0, x1 - x0, 9);
    ctx.fillStyle = AUB_HI; ctx.fillRect(x0, 0, x1 - x0, 3);
    ctx.fillStyle = MUS; ctx.fillRect(x0, 9, x1 - x0, 3);
    ctx.fillStyle = INK; ctx.fillRect(x0, 12, x1 - x0, 1.2);
    ctx.fillStyle = AUB_LO; for (let x = x0 + 10; x < x1; x += 32) { ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x + 6, 12); ctx.lineTo(x + 3, 18); ctx.closePath(); ctx.fill(); }
  }
};
// a framed panel block: an aubergine frame round a mustard mount
const panelBrick = {
  style: 'galPanel', c1: AUB_HI, c2: AUB, mortar: AUB_LO,
  paint(ctx) {
    ctx.fillStyle = AUB; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = AUB_HI; ctx.fillRect(2, 2, TS - 4, 3); ctx.fillRect(2, 2, 3, TS - 4);
    ctx.fillStyle = MUS; ctx.fillRect(7, 7, TS - 14, TS - 14);
    ctx.fillStyle = MUS_LO; ctx.fillRect(7, TS - 10, TS - 14, 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5); ctx.strokeRect(7, 7, TS - 14, TS - 14);
  }
};
// the hard wall: dark aubergine wainscot with a carved groove
const wainscot = {
  c1: AUB, c2: AUB_LO,
  paint(ctx) {
    ctx.fillStyle = AUB_LO; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = 'rgba(255,210,240,0.14)'; ctx.lineWidth = 1.5; ctx.strokeRect(4.5, 4.5, TS - 9, TS - 9);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, TS - 3, TS, 3);
  }
};
const gallery = { ground: floorTile, semi: railSemi, brick: panelBrick, hard: wainscot, pillar: { c1: CHALK, c2: CHALK_LO, cap: MUS, style: 'column' }, accent: MUS, tint: {}, bloom: 0.08, liquid: 'gal_varnish' };

/* ---------------- shared drawings ---------------- */
const head = (ctx, x, y, s, t, o) => { if (typeof Piwi !== 'undefined') { try { Piwi.head(ctx, x, y, s, t, o || {}); return; } catch (e) { /* drawn blank */ } } ctx.fillStyle = '#f2c79c'; ctx.beginPath(); ctx.arc(x, y, 11 * s, 0, TAU); ctx.fill(); };
const GalArt = {
  INK, AUB, AUB_HI, AUB_LO, MUS, MUS_HI, MUS_LO, BLUE, BLUE_LO, CHALK, CHALK_LO, MARBLE, WHITE,
  // a gilt-and-aubergine frame (w x h, top-left x, y): bevelled, with a mustard inner lip; fill(c, ix, iy, iw, ih)
  // paints the picture inside
  frame(ctx, x, y, w, h, fill, o) {
    o = o || {}; const b = o.b || Math.max(5, Math.min(w, h) * 0.1);
    ctx.save(); ctx.lineJoin = 'round';
    ctx.fillStyle = o.col || AUB; ctx.strokeStyle = INK; ctx.lineWidth = o.lw || 2;
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = o.hi || AUB_HI; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - b, y + b); ctx.lineTo(x + b, y + b); ctx.lineTo(x + b, y + h - b); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.lip || MUS; ctx.fillRect(x + b - 2, y + b - 2, w - 2 * b + 4, h - 2 * b + 4);
    const ix = x + b, iy = y + b, iw = w - 2 * b, ih = h - 2 * b;
    ctx.fillStyle = o.ground || '#3a5a6a'; ctx.fillRect(ix, iy, iw, ih);
    if (fill) { ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip(); fill(ctx, ix, iy, iw, ih); ctx.restore(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.strokeRect(ix, iy, iw, ih);
    ctx.restore();
    return { ix, iy, iw, ih };
  },
  // a mustard oval frame (the land's other shape)
  oval(ctx, x, y, rx, ry, fill, o) {
    o = o || {};
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = o.col || MUS; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = o.ground || '#2a4a5a'; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.8, ry * 0.8, 0, 0, TAU); ctx.fill();
    if (fill) { ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx * 0.8, ry * 0.8, 0, 0, TAU); ctx.clip(); fill(ctx, x, y, rx * 0.8, ry * 0.8); ctx.restore(); }
    ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.8, ry * 0.8, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  },
  // Piwi's own head in a picture, centred at (x, y), scale s; jaw: 0 shut .. 6 wide open (the unflattering ones)
  piwi(ctx, x, y, s, t, o) { head(ctx, x, y, s, t, o); },
  // a chalk-white bust of Piwi on a little plinth (feet-centre origin)
  bust(ctx, x, y, s, t, jaw) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = CHALK_LO; ctx.fillRect(-12, -10, 24, 10); ctx.strokeRect(-12, -10, 24, 10);
    ctx.fillStyle = CHALK; ctx.beginPath(); ctx.moveTo(-14, -10); ctx.quadraticCurveTo(-14, -22, 0, -24); ctx.quadraticCurveTo(14, -22, 14, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.filter = 'grayscale(1) brightness(1.5)'; head(ctx, 0, -36, 1.05, t, { jaw: jaw || 0, look: 0 }); ctx.restore();
    ctx.restore();
  },
  // a picture hook and its nail (the land's tell: a pale patch where a picture used to hang, its hook left behind)
  nail(ctx, x, y, r) { ctx.save(); ctx.fillStyle = '#3a3440'; ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r || 3, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x - (r || 3) * 0.35, y - (r || 3) * 0.35, (r || 3) * 0.35, 0, TAU); ctx.fill(); ctx.restore(); },
  patch(ctx, x, y, t) {
    ctx.save(); ctx.fillStyle = 'rgba(255,240,225,0.28)'; ctx.fillRect(x - 13, y - 30, 26, 30); ctx.strokeStyle = 'rgba(255,240,225,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(x - 13, y - 30, 26, 30);
    // the hook, a little brass S, swinging a hair
    ctx.strokeStyle = MUS; ctx.lineWidth = 2; ctx.beginPath(); const sw = Math.sin(t * 2.2) * 2; ctx.moveTo(x, y - 36); ctx.quadraticCurveTo(x + 4 + sw, y - 30, x + sw, y - 26); ctx.stroke();
    GalArt.nail(ctx, x, y - 37, 2.4); ctx.restore();
  },
  // a little gavel (the auction)
  gavel(ctx, x, y, a) { ctx.save(); ctx.translate(x, y); ctx.rotate(a || 0); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-2, -2, 22, 4); ctx.strokeRect(-2, -2, 22, 4); ctx.fillStyle = '#6a3a1a'; rr(ctx, -8, -7, 12, 14, 3); ctx.fill(); ctx.stroke(); ctx.restore(); },
  // a big painted button (the auction's money)
  button(ctx, x, y, r, col) { ctx.save(); ctx.fillStyle = col || MUS; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.arc(x + dx * r * 0.28, y + dy * r * 0.28, r * 0.13, 0, TAU); ctx.fill(); } ctx.restore(); }
};
// Brady's outline (the posing silhouette): feet-centre origin; pose 'stand' | 'crouch'; big or small
GalArt.outline = function (ctx, x, y, pose, big, o) {
  o = o || {};
  const crouch = pose === 'crouch', h = crouch ? 30 : big ? 54 : 28, hr = crouch || !big ? 8 : 9;
  ctx.save(); ctx.translate(x, y); ctx.beginPath();
  rr(ctx, -11, -h + 2 * hr - 2, 22, h - 2 * hr + 2, 6);
  ctx.moveTo(hr, -h + hr); ctx.arc(0, -h + hr, hr, 0, TAU);
  ctx.moveTo(8, -h - 1); ctx.arc(4, -h - 1, 4, 0, TAU);
  if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
  ctx.strokeStyle = o.col || WHITE; ctx.lineWidth = o.lw || 2.5; if (o.dash !== false) { ctx.setLineDash([5, 4]); ctx.lineDashOffset = -(o.t || 0) * 12; } ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
};

/* ---------------- painted backdrops (kept dim and plain: the pictures here are only shapes) ---------------- */
// a row of dim, plain picture shapes along a wall: rectangles and ovals in two muted tones, no detail
const dimFrames = (ctx, L, rng, y0, y1) => {
  for (let x = 30 + rng() * 40; x < BG_W - 40; x += 90 + rng() * 70) {
    const w = 40 + rng() * 50, h = 40 + rng() * (y1 - y0 - 50), y = y0 + rng() * (y1 - y0 - h);
    wrapDraw(x, w + 6, X => {
      ctx.fillStyle = shade(L.color, -0.16); if (rng() < 0.3) { ctx.beginPath(); ctx.ellipse(X + w / 2, y + h / 2, w / 2, h / 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = shade(L.color, -0.06); ctx.beginPath(); ctx.ellipse(X + w / 2, y + h / 2, w / 2 - 5, h / 2 - 5, 0, 0, TAU); ctx.fill(); }
      else { ctx.fillRect(X, y, w, h); ctx.fillStyle = shade(L.color, -0.06); ctx.fillRect(X + 5, y + 5, w - 10, h - 10); }
    });
  }
};
const painters = {
  // the gallery's far wall: a dado rail, plain dim frames, a cornice; L.color the wall
  galWall(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.fillRect(0, 0, BG_W, H);
    if (L.stripes) { ctx.fillStyle = shade(c, -0.05); for (let x = 0; x < BG_W; x += 36) ctx.fillRect(x, 0, 16, b); }
    ctx.fillStyle = shade(c, 0.12); ctx.fillRect(0, 26, BG_W, 8); ctx.fillStyle = shade(c, -0.2); ctx.fillRect(0, 34, BG_W, 3);
    dimFrames(ctx, L, rng, 60, b - 90);
    ctx.fillStyle = shade(c, -0.22); ctx.fillRect(0, b - 60, BG_W, H - b + 60);
    ctx.fillStyle = shade(c, -0.1); ctx.fillRect(0, b - 64, BG_W, 5);
  },
  // the long gallery receding: arches one behind another in the distance (a vanishing point), all pale
  galArches(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 256) for (let k = 0; k < 4; k++) {
      const w = 180 - k * 40, h = 260 - k * 56, cx = x + 128;
      ctx.fillStyle = shade(c, -0.08 - k * 0.05); ctx.beginPath(); ctx.moveTo(cx - w / 2, b); ctx.lineTo(cx - w / 2, b - h + w / 2); ctx.arc(cx, b - h + w / 2, w / 2, Math.PI, 0); ctx.lineTo(cx + w / 2, b); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = shade(c, 0.12); ctx.lineWidth = 1.5; for (let x = 0; x < BG_W; x += 256) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 128, b - 40); ctx.lineTo(x + 256, H); ctx.stroke(); }
    ctx.fillStyle = shade(c, -0.25); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the restorer's studio: big canvases leaning on the wall, a skylight's slanting light, drop cloths
  galStudio(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = 'rgba(255,250,220,0.1)'; for (let x = 60; x < BG_W; x += 340) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 90, 0); ctx.lineTo(x + 200, b); ctx.lineTo(x + 80, b); ctx.closePath(); ctx.fill(); }
    for (let x = 20 + rng() * 40; x < BG_W - 60; x += 120 + rng() * 80) {
      const w = 60 + rng() * 60, h = 70 + rng() * 80, lean = 8 + rng() * 10;
      wrapDraw(x, w + lean, X => { ctx.fillStyle = shade(c, -0.18); ctx.beginPath(); ctx.moveTo(X + lean, b - h); ctx.lineTo(X + lean + w, b - h); ctx.lineTo(X + w, b); ctx.lineTo(X, b); ctx.closePath(); ctx.fill(); ctx.fillStyle = shade(c, -0.08); ctx.beginPath(); ctx.moveTo(X + lean + 5, b - h + 5); ctx.lineTo(X + lean + w - 5, b - h + 5); ctx.lineTo(X + w - 4, b - 4); ctx.lineTo(X + 4, b - 4); ctx.closePath(); ctx.fill(); });
    }
    ctx.fillStyle = shade(c, -0.24); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the hanging room: picture cords dangling from a rail along the ceiling, empty hooks
  galCords(ctx, L, rng, H) {
    const c = L.color;
    ctx.fillStyle = shade(c, -0.15); ctx.fillRect(0, 18, BG_W, 6);
    ctx.strokeStyle = shade(c, 0.12); ctx.lineWidth = 1.5;
    for (let x = 20; x < BG_W; x += 46 + Math.floor(rng() * 3) * 10) { const len = 60 + rng() * 140; ctx.beginPath(); ctx.moveTo(x, 24); ctx.lineTo(x + Math.sin(x) * 3, 24 + len); ctx.stroke(); ctx.beginPath(); ctx.arc(x, 24 + len + 4, 4, 0, Math.PI); ctx.stroke(); }
  },
  // the auction room: rows of empty folding chairs (plain shapes), the rostrum's drape far back
  galChairs(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    for (let r = 0; r < 3; r++) for (let x = (r % 2) * 18; x < BG_W; x += 36) {
      const y = b - 10 - r * 26, s = 1 - r * 0.15;
      ctx.fillStyle = shade(c, -0.05 * r); ctx.fillRect(x, y - 24 * s, 22 * s, 6 * s); ctx.fillRect(x + 2, y - 18 * s, 4 * s, 18 * s); ctx.fillRect(x + 16 * s, y - 18 * s, 4 * s, 18 * s); ctx.fillRect(x, y - 12 * s, 22 * s, 4 * s);
    }
    ctx.fillStyle = shade(c, -0.2); ctx.fillRect(0, b, BG_W, H - b);
  },
  // the grand salon (the lead-in and the arena): pilasters, a long drape, one huge dim oval
  galSalon(ctx, L, rng, H) {
    const b = L.base, c = L.color;
    ctx.fillStyle = c; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 40; x < BG_W; x += 200) { ctx.fillStyle = shade(c, 0.08); ctx.fillRect(x, 40, 26, b - 40); ctx.fillStyle = shade(c, -0.12); ctx.fillRect(x + 20, 40, 6, b - 40); ctx.fillStyle = shade(c, 0.16); ctx.fillRect(x - 6, 36, 38, 8); }
    for (let x = 140; x < BG_W; x += 400) { ctx.fillStyle = shade(c, -0.14); ctx.beginPath(); ctx.ellipse(x, b - 150, 50, 66, 0, 0, TAU); ctx.fill(); ctx.fillStyle = shade(c, -0.06); ctx.beginPath(); ctx.ellipse(x, b - 150, 42, 58, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = shade(c, -0.26); ctx.fillRect(0, b, BG_W, H - b);
  },
  /* ---------- the secret rooms' own backdrops (all different) ---------- */
  // 30-1 THREE STEPS SHORT: the pigeon loft behind the hall: slatted boards, a round window, perches
  roomLoft(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#6a5a4a'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#5e4e40'; for (let y = 0; y < b; y += 18) ctx.fillRect(0, y, BG_W, 2); for (let x = 120; x < BG_W; x += 380) { ctx.fillStyle = '#a8c8e8'; ctx.beginPath(); ctx.arc(x, 70, 34, 0, TAU); ctx.fill(); ctx.strokeStyle = '#3a2e24'; ctx.lineWidth = 5; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 34, 70); ctx.lineTo(x + 34, 70); ctx.moveTo(x, 36); ctx.lineTo(x, 104); ctx.stroke(); } ctx.fillStyle = '#4a3a2e'; ctx.fillRect(0, b - 8, BG_W, H - b + 8); },
  // 30-2 SEAT THE FRAMES: the framer's workshop: mitre saws, moulding lengths racked on the wall
  roomFramer(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#4a5a4a'; ctx.fillRect(0, 0, BG_W, H); for (let y = 40; y < b - 60; y += 30) { ctx.fillStyle = ['#7a3a5a', '#c89a3a', '#5a3a2a', '#8a8a7a'][(y / 30 | 0) % 4]; ctx.fillRect(0, y, BG_W, 8); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, y + 8, BG_W, 3); } ctx.fillStyle = '#3a4a3a'; ctx.fillRect(0, b - 10, BG_W, H - b + 10); },
  // 30-3 THE POLITE QUEUE: the cloakroom: a counter hatch, numbered coat hooks
  roomCloak(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#7a4a3a'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#6a3e30'; for (let x = 0; x < BG_W; x += 40) ctx.fillRect(x, 0, 3, b); for (let x = 30; x < BG_W; x += 60) { ctx.fillStyle = '#d8b04a'; ctx.beginPath(); ctx.arc(x, 60, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x - 6, 66, 12, 9); } ctx.fillStyle = '#4a2a20'; ctx.fillRect(0, b - 10, BG_W, H - b + 10); },
  // 30-4 SHORT CHANGE: the paint store: shelves of pigment jars, a palette on the wall
  roomPaint(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#e8dcc8'; ctx.fillRect(0, 0, BG_W, H); for (const y of [70, 130]) { ctx.fillStyle = '#8a6a4a'; ctx.fillRect(0, y, BG_W, 6); for (let x = 10; x < BG_W; x += 22) { ctx.fillStyle = ['#c84a3a', '#3a6ac8', '#e8c83a', '#4a9a5a', '#8a4ac8'][(x / 22 | 0) % 5]; rr(ctx, x, y - 20, 14, 20, 3); ctx.fill(); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x + 2, y - 24, 10, 4); } } ctx.fillStyle = '#9a7a5a'; ctx.fillRect(0, b - 10, BG_W, H - b + 10); },
  // 30-5 POSTCARD CORNER: the catalogue printer's: a press, sheets drying on lines
  roomPrint(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#3a3a5a'; ctx.fillRect(0, 0, BG_W, H); ctx.strokeStyle = '#8a8aa8'; ctx.lineWidth = 1.5; for (const y of [50, 110]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); for (let x = 16; x < BG_W; x += 54) { ctx.fillStyle = '#d8d4c4'; ctx.fillRect(x, y + 2, 34, 42); ctx.fillStyle = '#b8b4a4'; ctx.fillRect(x + 4, y + 8, 26, 4); ctx.fillRect(x + 4, y + 16, 20, 3); } } ctx.fillStyle = '#26263a'; ctx.fillRect(0, b - 10, BG_W, H - b + 10); },
  // 30-6 EYES FRONT: the long corridor of the private collection: a runner carpet, wainscot, sconces
  roomCorridor(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#2a4a4a'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#244242'; for (let x = 0; x < BG_W; x += 24) ctx.fillRect(x, 0, 10, b); ctx.fillStyle = '#1a3434'; ctx.fillRect(0, b - 70, BG_W, 70); ctx.fillStyle = '#c8a04a'; ctx.fillRect(0, b - 72, BG_W, 4); for (let x = 90; x < BG_W; x += 260) { ctx.fillStyle = 'rgba(255,220,150,0.25)'; ctx.beginPath(); ctx.arc(x, 60, 30, 0, TAU); ctx.fill(); ctx.fillStyle = '#d8b04a'; ctx.fillRect(x - 3, 56, 6, 16); } ctx.fillStyle = '#122626'; ctx.fillRect(0, b - 8, BG_W, H - b + 8); }
};
// each secret room its own floor and walls
const MATS = {
  boards: { base: '#7a5a3a', cap: '#a8804a', capLo: '#5a4028', pat(ctx) { ctx.fillStyle = '#6a4c30'; ctx.fillRect(0, 10, TS, 2); ctx.fillRect(0, 22, TS, 2); ctx.fillRect(14, 0, 2, 10); } },
  sawdust: { base: '#c8a878', cap: '#e8cc98', capLo: '#a8885a', pat(ctx) { ctx.fillStyle = '#b8986a'; for (let k = 0; k < 6; k++) ctx.fillRect((k * 11) % TS, (k * 7) % TS, 3, 2); } },
  terrazzo: { base: '#d8c8b8', cap: '#8a3a3a', capLo: '#5a2020', pat(ctx) { for (let k = 0; k < 7; k++) { ctx.fillStyle = ['#8a3a3a', '#3a5a3a', '#2a2a2a'][k % 3]; ctx.fillRect((k * 13) % 28 + 2, (k * 9) % 28 + 2, 3, 3); } } },
  checker: { base: '#f2ede2', cap: '#2a2a3a', capLo: '#121220', pat(ctx) { ctx.fillStyle = '#2a2a3a'; ctx.fillRect(0, 0, TS / 2, TS / 2); ctx.fillRect(TS / 2, TS / 2, TS / 2, TS / 2); } },
  steel: { base: '#5a6070', cap: '#9aa2b4', capLo: '#4a5060', pat(ctx) { ctx.fillStyle = '#4a5060'; for (let y = 4; y < TS; y += 8) for (let x = (y % 16 ? 4 : 8); x < TS; x += 8) ctx.fillRect(x - 1, y - 1, 2, 2); } },
  runner: { base: '#6a1a2a', cap: '#c8a04a', capLo: '#7a5a1a', pat(ctx) { ctx.fillStyle = '#8a2a3a'; ctx.fillRect(4, 0, 3, TS); ctx.fillRect(TS - 7, 0, 3, TS); ctx.fillStyle = '#c8a04a'; ctx.beginPath(); ctx.arc(TS / 2, TS / 2, 3, 0, TAU); ctx.fill(); } }
};
const mat = k => {
  const M = MATS[k];
  const ground = { style: 'galroom_' + k, cap: M.cap, capHi: M.cap, dirt: M.base, dirt2: M.capLo, rock: M.base,
    paint(ctx, rng) { ctx.fillStyle = M.base; ctx.fillRect(0, 0, TS, TS); M.pat(ctx, rng || (() => 0.5)); },
    paintCap(ctx, x0, x1) { ctx.fillStyle = M.capLo; ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = M.cap; ctx.fillRect(x0, 0, x1 - x0, 7); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x0, 0, x1 - x0, 1.5); ctx.fillStyle = INK; ctx.fillRect(x0, 9.5, x1 - x0, 1.5); } };
  return { ground, hard: { c1: M.base, c2: M.capLo, paint(ctx, rng) { ctx.fillStyle = shade(M.base, -0.2); ctx.fillRect(0, 0, TS, TS); M.pat(ctx, rng || (() => 0.5)); } } };
};
const room = (name, painter, extra) => Object.assign({}, gallery, { name, music: 'tour_gal_room', particles: 'none', rays: null, sky: ['#2a2032', '#3a2c40', '#4a3848'], horizonGlow: '#ffe0b0', celestial: { type: 'none' }, stars: 0, layers: [{ kind: painter, base: 400, f: 0.05 }], fog: '#3a2c40', decor: [] }, extra || {});
const inside = (name, sky, layers, extra) => Object.assign({}, gallery, { name, music: 'tour_gal', particles: 'none', rays: null, sky, horizonGlow: sky[2], celestial: { type: 'none' }, stars: 0, layers, fog: sky[1], decor: ['galBust', 'galPlant', 'galBench'] }, extra || {});
const themes = {
  gal_hall: inside('The Portrait Hall', ['#a890a8', '#b8a0b4', '#c8b0c0'], [{ kind: 'galWall', color: '#b49cb0', base: 392, f: 0.08, stripes: true }]),
  gal_long: inside('The Long Gallery', ['#9aa8c8', '#aab8d4', '#bac8de'], [{ kind: 'galArches', color: '#a8b6d2', base: 392, f: 0.06 }], { decor: ['galBust', 'galPlant'] }),
  gal_studio: inside('The Restorer\'s Studio', ['#b8a07a', '#c8b08a', '#d8c09a'], [{ kind: 'galStudio', color: '#c0a684', base: 392, f: 0.08 }], { decor: ['galEasel', 'galPlant'], music: 'tour_gal_studio' }),
  gal_hang: inside('The Hanging Room', ['#5a7a6a', '#6a8a78', '#7a9a86'], [{ kind: 'galWall', color: '#6a8676', base: 392, f: 0.06 }, { kind: 'galCords', color: '#5a7666', base: 392, f: 0.12 }], { decor: ['galBust', 'galBench'] }),
  gal_auction: inside('The Auction Room', ['#8a3a3a', '#9a4a44', '#aa5a4e'], [{ kind: 'galWall', color: '#9a4844', base: 392, f: 0.05 }, { kind: 'galChairs', color: '#6a2a2a', base: 400, f: 0.14 }], { decor: ['galPlant'], music: 'tour_gal_studio' }),
  gal_salon: inside('The Grand Salon', ['#4a3a5a', '#5a4868', '#6a5676'], [{ kind: 'galSalon', color: '#5a4868', base: 392, f: 0.07 }], { decor: ['galBust', 'galPlant'] }),
  gal_arena: inside('The Retoucher\'s Studio', ['#2a2030', '#3a2c3e', '#4a384a'], [{ kind: 'galSalon', color: '#3a2c3e', base: 392, f: 0.05 }], { decor: [], music: 'tour_gal_boss' }),
  gal_room_loft: room('The Pigeon Loft', 'roomLoft', mat('boards')),
  gal_room_framer: room('The Framer\'s Workshop', 'roomFramer', mat('sawdust')),
  gal_room_cloak: room('The Cloakroom', 'roomCloak', mat('terrazzo')),
  gal_room_paint: room('The Paint Store', 'roomPaint', mat('checker')),
  gal_room_print: room('The Catalogue Press', 'roomPrint', mat('steel')),
  gal_room_corridor: room('The Private Collection', 'roomCorridor', mat('runner'))
};

/* ---------------- props (Decor) ---------------- */
const decor = {
  // a chalk bust of Piwi on a fluted pedestal (mouth open: one of the rejects)
  galBust(ctx, x, y, t, th, d) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = CHALK_LO; ctx.fillRect(x - 9, y - 30, 18, 30); ctx.strokeRect(x - 9, y - 30, 18, 30); ctx.fillStyle = CHALK; ctx.fillRect(x - 12, y - 34, 24, 5); ctx.strokeRect(x - 12, y - 34, 24, 5); GalArt.bust(ctx, x, y - 34, 0.62, t, ((d && d.seed) || 0) % 2 ? 4 : 2.5); ctx.restore(); },
  // a potted palm in a mustard pot
  galPlant(ctx, x, y, t) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = MUS; ctx.beginPath(); ctx.moveTo(x - 9, y - 16); ctx.lineTo(x + 9, y - 16); ctx.lineTo(x + 6, y); ctx.lineTo(x - 6, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#3a6a3a'; ctx.lineWidth = 3; for (const a of [-1.2, -0.5, 0.2, 0.9]) { ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.quadraticCurveTo(x + Math.cos(a - 1.57) * 10, y - 34, x + Math.sin(a) * 18, y - 28 + Math.abs(a) * 6 + Math.sin(t + a) * 1.2); ctx.stroke(); } ctx.restore(); },
  // a padded viewing bench
  galBench(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = AUB_LO; ctx.fillRect(x - 18, y - 10, 3, 10); ctx.fillRect(x + 15, y - 10, 3, 10); ctx.fillStyle = BLUE_LO; rr(ctx, x - 20, y - 15, 40, 7, 3); ctx.fill(); ctx.stroke(); ctx.restore(); },
  // a paint-spattered easel (with its back to us)
  galEasel(ctx, x, y) { ctx.save(); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x, y - 40); ctx.lineTo(x + 10, y); ctx.moveTo(x, y - 40); ctx.lineTo(x + 2, y); ctx.stroke(); ctx.fillStyle = '#d8c8a8'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillRect(x - 12, y - 36, 24, 20); ctx.strokeRect(x - 12, y - 36, 24, 20); ctx.restore(); },
  // the land's tell: a pale patch on the wallpaper where a picture used to hang, its hook left behind
  galTell(ctx, x, y, t) { GalArt.patch(ctx, x + 6, y - 6, t); },
  galTellLow(ctx, x, y, t) { GalArt.patch(ctx, x + 6, y + 30, t); },
  // a velvet rope barrier's post (decor; the barrier itself is a lock)
  galPost(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillStyle = MUS; ctx.fillRect(x - 3, y - 30, 6, 30); ctx.strokeRect(x - 3, y - 30, 6, 30); ctx.beginPath(); ctx.arc(x, y - 32, 5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = MUS_LO; ctx.fillRect(x - 7, y - 3, 14, 3); ctx.restore(); }
};
const decorLights = {};

/* ---------------- door looks: a gallery door with a brass plate, a hatch in the panelling ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'galDoor' || look === 'galHatch') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (look === 'galDoor') {
        ctx.fillStyle = AUB; rr(ctx, x - 20, y - 60, 40, 60, 4); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = MUS; ctx.lineWidth = 2; ctx.strokeRect(x - 15, y - 54, 30, 22); ctx.strokeRect(x - 15, y - 28, 30, 22);
        ctx.fillStyle = MUS; ctx.beginPath(); ctx.arc(x + 12, y - 30, 2.6, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = AUB_LO; rr(ctx, x - 16, y - 40, 32, 40, 3); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = MUS; ctx.lineWidth = 1.5; ctx.strokeRect(x - 11, y - 35, 22, 30);
      }
      if (near) { ctx.fillStyle = '#ffffff'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('▲', x, y - 68 + Math.sin(t * 6) * 2); }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// GILT GNAT: a gnat with gilded filigree wings and a polishing cloth. Every few seconds it lands in the air to polish
// a frame that isn't there, then slips on the shine and tumbles (a harmless, stompable moment).
const gnatArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(-(e.dir || 1), 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  const slip = e.gst === 'slip', pol = e.gst === 'polish';
  if (slip) ctx.rotate(Math.sin(t * 20) * 0.6);
  const f = Math.sin(t * (pol ? 8 : 34));
  ctx.fillStyle = 'rgba(246,216,114,0.85)'; for (const s of [-1, 1]) { ctx.save(); ctx.rotate(s * 0.3 + f * 0.25); ctx.beginPath(); ctx.ellipse(4, -10, 7, 11, 0.3, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = MUS_LO; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(4, -10, 3.5, 0, TAU); ctx.stroke(); ctx.restore(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
  ctx.fillStyle = MUS; ctx.beginPath(); ctx.ellipse(6, 2, 8, 5, 0.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = AUB_LO; ctx.lineWidth = 2; for (const xx of [3, 7]) { ctx.beginPath(); ctx.moveTo(xx, -2); ctx.lineTo(xx + 1, 6); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillStyle = MUS_HI; ctx.beginPath(); ctx.arc(-5, -2, 6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-20, 3); ctx.stroke();
  ctx.fillStyle = WHITE; ctx.beginPath(); ctx.ellipse(-6, -4, 3, slip ? 3.5 : 2, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-7, -4, 1.2, 0, TAU); ctx.fill();
  // the cloth: rubbing in circles while it polishes
  const cx = pol ? -12 + Math.cos(t * 9) * 3 : -8, cy = pol ? 8 + Math.sin(t * 9) * 3 : 9;
  ctx.fillStyle = CHALK; ctx.beginPath(); ctx.moveTo(cx - 4, cy - 3); ctx.lineTo(cx + 4, cy - 4); ctx.lineTo(cx + 3, cy + 5); ctx.lineTo(cx - 5, cy + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (pol) { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; const k = (t * 3) % 1; ctx.beginPath(); ctx.moveTo(-18, -12 - k * 6); ctx.lineTo(-18, -6 - k * 6); ctx.moveTo(-21, -9 - k * 6); ctx.lineTo(-15, -9 - k * 6); ctx.stroke(); }
  ctx.restore();
};
// PROFILE PIGEON: a powder-blue pigeon. When Brady comes near it turns sideways, goes thin as a pencil, and stands
// perfectly still, sure it has disappeared (harmless while it hides; a stomp still flattens it).
const pigeonArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const thin = e.state === 'hide' ? Math.min(1, (e.st || 0) * 5) : 0, sx = 1 - thin * 0.78;
  const st = m === 'walk' ? Math.sin(t * 14) * 2 : 0;
  ctx.strokeStyle = MUS_LO; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(-3 + st, 0); ctx.moveTo(3, -4); ctx.lineTo(3 - st, 0); ctx.stroke();
  ctx.save(); ctx.scale(sx, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6 / Math.max(0.3, sx);
  ctx.fillStyle = BLUE; ctx.beginPath(); ctx.ellipse(0, -14, 11, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = BLUE_LO; ctx.beginPath(); ctx.ellipse(-5, -14, 7, 6, -0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f0e4cc'; ctx.beginPath(); ctx.ellipse(4, -10, 5, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(7, -27, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = MUS; ctx.beginPath(); ctx.moveTo(12 - thin * 9, -28); ctx.lineTo(19 - thin * 9, -25); ctx.lineTo(12 - thin * 9, -24); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = WHITE; ctx.beginPath(); ctx.ellipse(8 - thin * 6, -29, 2.6, thin ? 3.4 : 2.6, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(8.6 - thin * 6, -29, 1.2, 0, TAU); ctx.fill();
  if (thin > 0.9) { ctx.strokeStyle = INK; ctx.lineWidth = 1.2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 7, -18); ctx.lineTo(s * 11, -18); ctx.stroke(); } }
  ctx.restore();
};
// VARNISH TOAD: a plum toad that takes one step and then waits for it to dry (a glossy mustard footprint shrinks while
// it waits; it can't turn or hop until it's dry).
const toadArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const step = e.tst === 'step', wait = e.tst === 'wait';
  ctx.fillStyle = '#7a3a5a'; ctx.beginPath(); ctx.ellipse(0, -11, 15, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a2846'; for (const [dx, dy] of [[-6, -16], [2, -18], [-9, -9]]) { ctx.beginPath(); ctx.arc(dx, dy, 2.4, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#f0dcc0'; ctx.beginPath(); ctx.ellipse(6, -7, 8, 6, 0, 0, TAU); ctx.fill();
  for (const dx of [2, 10]) { ctx.fillStyle = '#7a3a5a'; ctx.beginPath(); ctx.arc(dx, -21, 4.5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(dx + 1, -21.5, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.fillRect(dx - 1.5, wait ? -22 : -23, 5, wait ? 1.4 : 2.6); }
  ctx.beginPath(); ctx.moveTo(4, -6); ctx.quadraticCurveTo(10, -4, 14, -7); ctx.stroke();
  // the front foot: lifted on a step, glossy mustard while it dries
  const lift = step ? -4 : 0;
  ctx.fillStyle = wait ? MUS : '#7a3a5a'; ctx.beginPath(); ctx.ellipse(10, -1 + lift, 5, 2.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  if (wait) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(9, -2, 1.2, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#7a3a5a'; ctx.beginPath(); ctx.ellipse(-9, -1, 5, 2.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
};
// VELVET ROPE: a plum velvet rope with brass ends that inches along the floor; when anyone looks vaguely important
// (Brady, near) it rears up into a loop, glares (the tell) and lunges to lasso him.
const ropeArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const rear = m === 'notice' ? 1 : 0, lunge = m === 'charge' ? 1 : 0, w = Math.sin(t * 8) * 2;
  const pts = rear ? [[-14, -2], [-12, -20], [0, -30], [12, -20], [14, -2]] : lunge ? [[-16, -4], [-6, -10], [4, -8], [14, -12], [20, -8]] : [[-15, -3], [-8, -12 - w], [0, -14 - w], [8, -12 - w], [15, -3]];
  const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length - 1; k++) { const mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2; ctx.quadraticCurveTo(pts[k][0], pts[k][1], mx, my); } ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); };
  path(); ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.stroke(); path(); ctx.strokeStyle = '#8a2a4a'; ctx.lineWidth = 6.5; ctx.stroke(); path(); ctx.strokeStyle = 'rgba(255,170,200,0.35)'; ctx.lineWidth = 2; ctx.stroke();
  for (const [px, py] of [pts[0], pts[pts.length - 1]]) { ctx.fillStyle = MUS; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillRect(px - 3, py - 3, 6, 6); ctx.strokeRect(px - 3, py - 3, 6, 6); ctx.beginPath(); ctx.arc(px, py - 5, 2.6, 0, TAU); ctx.stroke(); }
  // eyes near the head end, narrowed while it rears
  const hx = pts[3][0], hy = pts[3][1] - 4;
  ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; for (const dx of [-3, 3]) { ctx.beginPath(); ctx.ellipse(hx + dx, hy, 2.4, rear ? 1.3 : 2.4, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = INK; for (const dx of [-3, 3]) { ctx.beginPath(); ctx.arc(hx + dx + 0.6, hy, 1, 0, TAU); ctx.fill(); }
  if (rear) { ctx.beginPath(); ctx.moveTo(hx - 6, hy - 4); ctx.lineTo(hx - 1, hy - 2.5); ctx.moveTo(hx + 6, hy - 4); ctx.lineTo(hx + 1, hy - 2.5); ctx.stroke(); }
  ctx.restore();
};
const gnatThink = (e, dt) => {
  e.gt = (e.gt || 0) + dt; if (!e.gst) e.gst = 'fly';
  if (e.gst === 'fly') {
    e.x = e.hx + Math.sin(e.t * 0.8 + e.ph) * e.range; e.y = e.hy + Math.sin(e.t * 2.4 + e.ph) * 6; e.dir = Math.cos(e.t * 0.8 + e.ph) > 0 ? 1 : -1; e.mode = 'fly';
    if (e.gt > 3.2) { e.gst = 'polish'; e.gt = 0; }
  } else if (e.gst === 'polish') { e.mode = 'fly'; if (e.gt > 1.1) { e.gst = 'slip'; e.gt = 0; e.sy = e.y; if (e.g.onScreen(e)) Tour.galKit.pill(e.g, e.cx, e.y - 12, 'WHOOPS! TOO SHINY', '#ffe08a'); } }
  else { e.mode = 'stun'; const k = Math.min(1, e.gt / 0.35); e.y = e.sy + Math.sin(k * Math.PI * 0.5) * 22; if (e.gt > 1.4) { e.gst = 'fly'; e.gt = 0; e.t = 0; e.hy = e.y; e.hx = e.x; } }
};
const pigeonThink = (e, dt) => {
  const p = e.g.player; e.st = (e.st || 0) + dt;
  if (e.state === 'hide') { e.vx = 0; e.mode = 'idle'; if (e.st > 2.2 && !(p && Math.abs(p.cx - e.cx) < 3 * TS)) { e.state = 'walk'; e.st = 0; e.vx = e.dir * e.speed; } return; }
  e.mode = 'walk'; if (!e.vx || e.hitWall) e.vx = e.dir * e.speed;
  if (e.st > 1.2 && p && !p.dead && Math.abs(p.cx - e.cx) < 3.2 * TS && Math.abs(p.cy - e.cy) < 2 * TS) { e.state = 'hide'; e.st = 0; e.vx = 0; if (e.g.onScreen(e)) Tour.galKit.pill(e.g, e.cx, e.y - 14, 'SHH. I\'M INVISIBLE', '#c8d8ff'); }
};
const toadThink = (e, dt) => {
  e.tt = (e.tt || 0) + dt; if (!e.tst) e.tst = 'wait';
  if (e.tst === 'step') { e.mode = 'walk'; e.vx = e.dir * e.speed * 1.6; if (e.hitWall) e.dir = -e.dir; if (e.tt > 0.45) { e.tst = 'wait'; e.tt = 0; e.vx = 0; } }
  else { e.mode = 'idle'; e.vx = 0; if (e.tt > 1.5) { e.tst = 'step'; e.tt = 0; } }
};
const harmlessWhen = (cls, fn) => { const tp = cls.prototype.touchPlayer; cls.prototype.touchPlayer = function (p) { if (fn(this)) return; return tp.call(this, p); }; return cls; };
const enemies = {
  galGnat: { cls: harmlessWhen(TourFlyer.make({ w: 28, h: 22, range: 3, speed: 0.8, art: gnatArt, burst: MUS_HI, think: gnatThink }), e => e.gst === 'slip'), place: 'fly' },
  galPigeon: { cls: harmlessWhen(TourEnemy.make({ w: 26, h: 34, speed: 1.0, edgeTurn: true, art: pigeonArt, burst: BLUE, think: pigeonThink }), e => e.state === 'hide'), place: 'walk' },
  galToad: { cls: TourEnemy.make({ w: 32, h: 24, speed: 1.2, edgeTurn: true, art: toadArt, burst: '#7a3a5a', think: toadThink }), place: 'walk' },
  galRope: { cls: TourEnemy.make({ w: 34, h: 20, speed: 0.9, edgeTurn: true, behavior: 'charge', range: 5, windup: 0.75, chargeT: 0.7, chargeSpeed: 6, art: ropeArt, burst: '#8a2a4a',
    onNotice: e => { if (e.g.onScreen(e)) Tour.galKit.pill(e.g, e.cx, e.y - 18, 'A V.I.P.!', '#ffc8d8'); } }), place: 'walk' }
};
// the flyer's own drift is replaced by the gnat's think: give it home and range on spawn
{ const G = enemies.galGnat.cls, u0 = G.prototype.update; G.prototype.update = function (dt) { if (this.hx == null) { this.hx = this.x; this.hy = this.y; } return u0.call(this, dt); }; }

/* ---------------- the route map: a little gilt frame in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.2) * 0.05);
  GalArt.frame(ctx, -r * 0.7, -r * 0.85, r * 1.4, r * 1.6, (c, ix, iy, iw, ih) => GalArt.piwi(c, ix + iw / 2, iy + ih * 0.55, iw / 26, t, { jaw: 4, look: 0 }), { b: r * 0.22, lw: 1.5 });
  ctx.restore();
};

/* ---------------- the land's map: sprites ---------------- */
Object.assign(TourOWPaint.art, {
  galFrameS(c, r) { GalArt.frame(c, -r * 0.6, -r * 1.5, r * 1.2, r * 1.5, (cc, ix, iy, iw, ih) => GalArt.piwi(cc, ix + iw / 2, iy + ih * 0.55, iw / 26, 0, { jaw: 4, look: 0 }), { b: r * 0.18, lw: 1.4 }); },
  galOvalS(c, r) { GalArt.oval(c, 0, -r * 0.8, r * 0.6, r * 0.8, null, {}); },
  galBustS(c, r) { GalArt.bust(c, 0, 0, r / 24, 0, 3); },
  galEaselS(c, r) { c.save(); c.scale(r / 20, r / 20); decor.galEasel(c, 0, 0); c.restore(); },
  galRopeS(c, r) { c.save(); c.strokeStyle = '#8a2a4a'; c.lineWidth = r * 0.25; c.beginPath(); c.moveTo(-r, -r * 0.6); c.quadraticCurveTo(0, r * 0.2, r, -r * 0.6); c.stroke(); for (const s of [-1, 1]) { c.fillStyle = MUS; c.fillRect(s * r - 2, -r * 1.2, 4, r * 1.2); } c.restore(); }
});
// the land under the trails: a parquet of aubergine and mustard, a few dim frames
TourOWScenes.groundPaint.gal = function (c, ow) {
  const R = TourOWPaint.rng('galground');
  c.save(); c.globalAlpha = 0.16; c.fillStyle = AUB_LO; for (let y = 160; y < 720; y += 28) for (let x = 160 + ((y / 28) % 2) * 28; x < 1380; x += 56) c.fillRect(x, y, 28, 28); c.restore();
  for (let k = 0; k < 5; k++) { c.save(); c.translate(300 + R() * 900, 220 + R() * 420); c.globalAlpha = 0.5; TourOWPaint.art.galOvalS.call(TourOWPaint, c, 18 + R() * 8); c.restore(); }
};
TourLandscape.looks.gal = ['#b8a0b4', '#9ab8e8', '#5a2346', '#e2b33a', '#f4efe4', '#844070', 'galFrame'];
{
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'galFrame') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40);
    GalArt.frame(ctx, -18, -40, 36, 40, (c, ix, iy, iw, ih) => GalArt.piwi(c, ix + iw / 2, iy + ih * 0.55, iw / 24, 0, { jaw: 5, look: 0 }), { b: 6 });
    ctx.restore();
  };
}

/* ---------------- music: a stately gallery minuet, a studio shuffle, a music-box room tune, the boss ---------- */
const tracks = {
  tour_gal: {
    bpm: 104, bpb: 3, bars: 8, rv: 0.4, hx: 0.04,
    ch: 'Dm A Dm Gm C F Bb A',
    ld: 'D6:3 F6:3 A6:6 | C#6:3 E6:3 A6:6 | D6:3 F6:3 D7:6 | Bb6:3 G6:3 D6:6 | E6:3 G6:3 C7:6 | A6:3 F6:3 C6:6 | Bb6:3 D7:3 F7:6 | E7:12',
    li: 'harpsi', lv: 0.13,
    bp: 'r.....f.....', bi: 'pluck', bv: 0.24,
    ap: 'c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 60,
    dr: ['k...........', '......s.....', '..h.h...h.h.'], dv: 0.2
  },
  tour_gal_studio: {
    bpm: 96, bars: 8, rv: 0.28, sw: 0.2, hx: 0.04,
    ch: 'Gm C F Dm Gm C D7 Gm',
    ld: 'G6:2 Bb6:2 D7:4 C7:2 Bb6:2 | A6:4 G6:4 E6:8 | F6:2 A6:2 C7:4 Bb6:2 A6:2 | D7:4 F6:4 D6:8 |' +
        'G6:2 Bb6:2 D7:4 F7:2 D7:2 | E7:4 C7:4 G6:8 | F#6:2 A6:2 D7:4 C7:2 A6:2 | G6:16',
    li: 'clav', lv: 0.12,
    bp: 'r...f...r.r.o...', bi: 'slapb', bv: 0.24,
    ap: '.c...c...c...c..', ai: 'vibes', av: 0.05, ao: 58,
    dr: ['k.....k...k.....', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.26
  },
  tour_gal_room: {
    bpm: 84, bpb: 3, bars: 8, rv: 0.5, dl: 0.2, hx: 0.03,
    ch: 'F C Dm Bb F C Bb C',
    ld: 'A6:3 C7:3 F7:6 | G6:3 E6:3 C6:6 | F6:3 A6:3 D7:6 | Bb6:6 D7:6 | C7:3 A6:3 F6:6 | E6:3 G6:3 C7:6 | D7:3 Bb6:3 F6:6 | G6:12',
    li: 'mbox', lv: 0.13,
    bp: 'r.....r.....', bi: 'sub', bv: 0.2,
    ap: 'c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 64,
    dr: ['k...........', '......s.....', '..h...h...h.'], dv: 0.15
  },
  tour_gal_boss: {
    bpm: 138, bars: 8, rv: 0.3, hx: 0.07,
    ch: 'Cm Cm Ab Bb Cm Cm Fm G7',
    ld: 'C6:2 Eb6:2 G6:2 C7:2 Bb6:4 G6:4 | Ab6:2 G6:2 F6:2 Eb6:2 C6:8 | Ab6:2 C7:2 Eb7:2 C7:2 Bb6:4 Ab6:4 | Bb6:4 D7:4 F7:8 |' +
        'G6:2 F6:2 Eb6:2 C6:2 Eb6:4 G6:4 | F6:2 Eb6:2 D6:2 Eb6:2 C6:8 | F6:2 Ab6:2 C7:2 F7:2 Eb7:4 C7:4 | D7:4 B6:4 G6:8',
    li: 'harpsi', lv: 0.15,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'reese', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'brass', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s..s', 'h.h.h.h.h.h.h.h.'], dv: 0.4
  }
};

Tour.country({
  id: 'gal', secret: true, bonus: true, colors: COL, tagline: 'A hidden land: every portrait Piwi rejected, because his mouth was open in it',
  themes, painters, decor, decorLights, enemies, tracks,
  music: { level: 'tour_gal', boss: 'tour_gal_boss', map: null },
  landmark: 'the gallery of rejected portraits', emblem,
  arrival: 'Brady! You found the picture with the extra nail. Piwi turned down every portrait where his mouth was open, so there is a whole gallery of them. I bought the worst one for the kitchen. ♥ C',
  coin: { name: 'BUTTONS', draw(ctx, x, y) {
    ctx.fillStyle = MUS; ctx.beginPath(); ctx.arc(x, y, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = MUS_LO; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; for (const [dx, dy] of [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 1.1, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(x - 3, y - 4, 1.6, 0, TAU); ctx.fill();
  } },
  levels: []
});
// a floating line on a dark rounded pill (readable on any wall), kept clear of Brady's head and the top bar
class GalPill extends Ent {
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
    ctx.fillStyle = 'rgba(28,20,38,0.9)'; rr(ctx, x - w / 2, y - 10, w, 20, 10); ctx.fill();
    ctx.fillStyle = this.col; ctx.fillText(this.text, x, y + 1); ctx.restore();
  }
}
ENTITY_TYPES.galPill = GalPill;
const pill = (g, x, y, text, col) => { if (g && g.spawn) g.spawn(new GalPill(g, x, y, text, col)); };
Tour.galKit = { pill, gnatArt, COL, INK, GalArt, AUB, AUB_HI, AUB_LO, MUS, MUS_HI, MUS_LO, BLUE, BLUE_LO, CHALK, CHALK_LO, MARBLE, WHITE };
})();
