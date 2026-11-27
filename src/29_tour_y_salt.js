/* ============================================================
   THE TABLE SALT SEA (world 34, cc 'salt'): a hidden land (docs/handoff/HIDDEN_LAND_BRIEF.md, A9 of
   docs/design/CHATGPT_RELAY.md). A shaker labelled "just a pinch" has been lying about its contents for years: inside
   it is a whole sea. Cobalt glass, white crystal stair-steps, tangerine corks and charcoal pinholes.
   Found only through Morocco: in 5-3, at the last citrus stall of the blue lane, a clay saucer of salt sits on the
   counter; one crystal on its rim has a tiny blue horizon inside it. Crouch on the saucer until Brady slips through
   the rim (29_tour_y_salt_e_entry.js).
   This file: the route stop, the looks (tiles, themes, painted backdrops, props), the critters (Grain Wren, Brine
   Shrimp, Cork Weevil, Salt Lick), the floating words, THROW on a prop, the route-map emblem, the map's sprites, the
   music, the country.
   The stages' mechanics: 29_tour_y_salt_a_mech.js. The boss: 29_tour_y_salt_c_boss.js. The secret rooms:
   29_tour_y_salt_d_rooms.js. The levels and the land's map: 29_tour_y_salt_levels.js.
   ============================================================ */
(function () {
Tour.addStop({ id: 'salt', world: 34, name: 'The Table Salt Sea', sub: 'a hidden land', lon: -15.5, lat: 27.2, secret: true, bonus: true, d0: 0.8, pin: 'salt' });
const INK = '#16182e';
const COBALT = '#2f55c8', COBALT_D = '#1c3586', COBALT_L = '#5a82e8', CRYS = '#f6f9ff', CRYS_B = '#cfe0ff', CRYS_D = '#9fb8e8';
const CORK = '#f08a2a', CORK_D = '#c0601a', CORK_L = '#ffb060', CHAR = '#34343e', CHAR_L = '#55556a', BRINE = '#3a78d8', BRINE_L = '#7ab0f4', GOLD = '#ffd84a';
const COL = { a: CORK, b: COBALT, c: CRYS };
const isSalt = g => !!(g && g.level && g.level.country === 'salt');

/* ---------------- shared drawings ---------------- */
const SaltArt = {
  INK, COBALT, COBALT_D, COBALT_L, CRYS, CRYS_B, CRYS_D, CORK, CORK_D, CORK_L, CHAR, CHAR_L, BRINE, BRINE_L, GOLD,
  // a salt crystal cube seen a little from above: x, y the bottom-left, s the side
  cube(ctx, x, y, s, a, dash) {
    ctx.save(); ctx.globalAlpha *= a == null ? 1 : a; ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    if (dash) { ctx.setLineDash([5, 4]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.strokeRect(x + 1, y - s + 1, s - 2, s - 2); ctx.restore(); return; }
    ctx.fillStyle = CRYS; ctx.fillRect(x, y - s, s, s); ctx.fillStyle = CRYS_B; ctx.fillRect(x, y - s, s, s * 0.22); ctx.fillRect(x + s * 0.78, y - s, s * 0.22, s);
    ctx.strokeStyle = 'rgba(120,150,210,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + s * 0.2, y - s * 0.3); ctx.lineTo(x + s * 0.45, y - s * 0.55); ctx.lineTo(x + s * 0.4, y - s * 0.75); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.strokeRect(x, y - s, s, s); ctx.restore();
  },
  // a tangerine cork: centre x, bottom y, width w, height h
  cork(ctx, x, y, w, h, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = CORK; rr(ctx, -w / 2, -h, w, h, Math.min(10, h / 3)); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CORK_L; rr(ctx, -w / 2 + 3, -h + 3, w - 6, 5, 3); ctx.fill();
    ctx.fillStyle = CORK_D; for (let k = 0; k < Math.round(w / 9); k++) { const px = -w / 2 + 6 + ((k * 37) % (w - 10)), py = -h + 9 + ((k * 23) % Math.max(4, h - 13)); ctx.beginPath(); ctx.arc(px, py, 1.6 + (k % 2), 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a heap of salt grains (a mound): centre x, ground y, half width w, height h
  heap(ctx, x, y, w, h) {
    if (h < 2) return; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = CRYS;
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * 0.35, y - h * 1.05, x, y - h); ctx.quadraticCurveTo(x + w * 0.35, y - h * 1.05, x + w, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = CRYS_B; for (let k = 0; k < 9; k++) { const u = (k * 0.37) % 1, px = x - w * 0.8 + u * w * 1.6, py = y - 3 - ((k * 0.61) % 1) * h * 0.6 * (1 - Math.abs(px - x) / w); ctx.fillRect(px, py, 3, 3); }
    ctx.restore();
  },
  // a pour of grains from (x, y0) down to y1 (k: thickness 0..1)
  stream(ctx, x, y0, y1, t, k) {
    ctx.save(); ctx.fillStyle = CRYS; ctx.strokeStyle = INK; ctx.lineWidth = 1;
    const n = Math.round(6 + 10 * k);
    for (let q = 0; q < n; q++) { const u = ((t * 2.2 + q / n) % 1), yy = y0 + (y1 - y0) * u, xx = x + Math.sin(q * 7.1 + t * 3) * (2 + 4 * k); ctx.beginPath(); ctx.rect(xx - 2.2, yy - 2.2, 4.4, 4.4); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  },
  // a prompt on a dark rounded pill (never bare text over the sky or a character)
  pill(ctx, x, y, text, col, a) {
    ctx.save(); ctx.globalAlpha *= a == null ? 1 : a; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 14, h = 17; ctx.fillStyle = 'rgba(14,18,40,0.88)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = col || GOLD; ctx.fillText(text, x, y + 1); ctx.restore();
  },
  // a pulsing gold ring on the floor round a mark Brady can use
  ring(ctx, x, y, t, hot, r) {
    const k = 0.5 + 0.5 * Math.sin(t * 5), R = (r || 18) * (hot ? 1.15 : 1) + k * 4;
    ctx.save(); ctx.strokeStyle = hot ? `rgba(255,220,90,${0.65 + 0.35 * k})` : `rgba(255,230,150,${0.4 + 0.3 * k})`; ctx.lineWidth = hot ? 3.5 : 2.5;
    ctx.beginPath(); ctx.ellipse(x, y - 2, R, R * 0.3, 0, 0, TAU); ctx.stroke(); ctx.restore();
  },
  // the button cue over a mark Brady stands on
  cue(ctx, x, y, t, txt) {
    const k = 0.5 + 0.5 * Math.sin(t * 6);
    ctx.save(); ctx.globalAlpha = 0.78 + 0.22 * k; SaltArt.pill(ctx, x, y - 14, txt || 'THROW', GOLD);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y - 4); ctx.lineTo(x, y + 1 + k * 2); ctx.closePath(); ctx.fill(); ctx.restore();
  },
  // the land's tell by every secret: a single cobalt grain of salt that twinkles (the only blue grain in the land)
  grain(ctx, x, y, t) {
    const k = 0.5 + 0.5 * Math.sin(t * 3);
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.3); ctx.fillStyle = COBALT_L; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.fillRect(-4, -4, 8, 8); ctx.strokeRect(-4, -4, 8, 8);
    ctx.rotate(-0.3); ctx.globalAlpha = 0.4 + 0.6 * k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(-5, -8); ctx.moveTo(-7, -10); ctx.lineTo(-7, -6); ctx.stroke(); ctx.restore();
  }
};

/* ---------------- the land's floating words: always on a dark rounded pill, clear of the HUD and the thumbs ---------------- */
// SaltSay(g, x, y, text, col, who): a short line that rises and fades (a line with a `who` replaces that speaker's
// last line: the boss says one thing at a time)
function SaltSay(g, x, y, text, col, who) {
  if (!g) return; const L = g.__saltSay || (g.__saltSay = []);
  if (L.some(q => q.text === text && q.t < 0.4 && Math.abs(q.x - x) < 80)) return;
  if (who) for (let i = L.length - 1; i >= 0; i--) if (L[i].who === who) L.splice(i, 1);
  L.push({ x, y, text: String(text), col: col || '#ffffff', t: 0, who, life: who === 'boss' ? 2.2 : 1.4 }); if (L.length > 3) L.shift();
}
TourHooks.on('areaLoaded', play => { play.__saltSay = []; });
TourHooks.on('playUpdate', (play, dt) => { const L = play.__saltSay; if (!L || !L.length) return; for (let i = L.length - 1; i >= 0; i--) { L[i].t += dt; if (L[i].t > L[i].life) L.splice(i, 1); } });
TourHooks.on('afterEntities', (play, ctx) => {
  const L = play.__saltSay; if (!L || !L.length) return;
  const k = Game.viewH / Math.max(1, Game.gameRect ? Game.gameRect.h : Game.viewH);
  const top = play.camY + 74 * k, bot = play.camY + Game.viewH - 150 * k, x0 = play.camX + 150 * k, x1 = play.camX + Game.viewW - 150 * k;
  ctx.save(); ctx.font = `${Math.round(12 * k)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const placed = [];
  for (let i = L.length - 1; i >= 0; i--) {
    const q = L[i];
    const w = ctx.measureText(q.text).width + 18 * k, h = 22 * k;
    // a boss line sits in a fixed spot under the boss bar; the others rise from where they were said
    let x = q.who === 'boss' ? play.camX + Game.viewW / 2 : clamp(q.x, Math.min(x0 + w / 2, play.camX + Game.viewW / 2), Math.max(x1 - w / 2, play.camX + Game.viewW / 2));
    let y = q.who === 'boss' ? top + h / 2 + 22 * k + (Game.viewH > Game.viewW ? 118 * k : 0) : clamp(q.y - q.t * 22, top + h / 2, Math.max(top + h / 2, bot));
    for (const r of placed) if (Math.abs(r.x - x) < (r.w + w) / 2 && Math.abs(r.y - y) < h) y = r.y + h + 3 * k;
    placed.push({ x, y, w });
    const a = q.t > q.life - 0.4 ? (q.life - q.t) / 0.4 : Math.min(1, q.t * 8);
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(14,18,40,0.86)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = q.col; ctx.fillText(q.text, x, y + 1);
  }
  ctx.restore();
});

/* ---------------- THROW on a prop ---------------- */
// Each frame in a salt level: the first entity with saltProp whose saltTouch(p) is true gets the button (saltInput,
// pressed and held) and the engine's own THROW (the power picker) does not fire. Holding the button still runs.
{
  const pu0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g;
    if (isSalt(g) && inp && this.state === 'play' && !this.dead) {
      let prop = null;
      for (const e of g.entities) if (e.saltProp && !e.remove && e.saltTouch(this)) { prop = e; break; }
      this.saltProp = prop;
      if (prop) { prop.saltInput(this, inp, dt); if (inp.actionPressed) inp = Object.assign({}, inp, { actionPressed: false }); }
    } else this.saltProp = null;
    return pu0.call(this, dt, inp);
  };
  if (typeof TourPicker !== 'undefined' && TourPicker.visible) { const vis0 = TourPicker.visible; TourPicker.visible = function (play) { if (play && play.player && play.player.saltProp) return false; return vis0.call(this, play); }; }
}
// Brady's feet on floor row ty, his centre within `wide` tiles of column tx
const onMark = (p, tx, ty, wide) => p && !p.dead && p.onGround && p.groundTy === ty && Math.abs(p.cx - (tx * TS + TS / 2)) < TS * (wide || 0.75);

/* ---------------- tiles ---------------- */
// compacted salt tread: chalk-white blocks with a crust of hexagonal crystals on top and a cobalt vein
const treadGround = {
  style: 'salt', cap: CRYS, capHi: '#ffffff', dirt: '#e8eef8', dirt2: '#d4deef', rock: '#c8d4ea',
  paint(ctx, rng) {
    ctx.fillStyle = '#eef3fb'; ctx.fillRect(0, 0, TS, TS);
    ctx.strokeStyle = 'rgba(90,110,160,0.45)'; ctx.lineWidth = 1.2; ctx.beginPath(); const a = rng() * TS; ctx.moveTo(a, 0); ctx.lineTo(a + 6 - rng() * 12, TS * 0.5); ctx.lineTo(a + 4 - rng() * 8, TS); ctx.stroke();
    if (rng() < 0.35) { ctx.fillStyle = 'rgba(47,85,200,0.55)'; ctx.fillRect(0, 14 + rng() * 10, TS, 3); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = CRYS_B; ctx.fillRect(x0, 0, x1 - x0, 11);
    for (let x = x0; x < x1; x += 11) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x + 2, 9); ctx.lineTo(x + 3, 2); ctx.lineTo(x + 8, 1); ctx.lineTo(x + 10, 8); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = INK; ctx.fillRect(x0, 10.5, x1 - x0, 1.5);
  }
};
// a cubical crystal ledge (the one-way ledges): pale blue tops, white faces
const ledgeSemi = {
  style: 'crystal', c1: CRYS_B, c2: CRYS_D,
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = CRYS; ctx.fillRect(x0, 2, x1 - x0, 9); ctx.fillStyle = CRYS_B; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5); for (let x = x0 + 16; x < x1; x += 16) ctx.fillRect(x, 3, 1.2, 7);
  }
};
// cork blocks (bricks: they break): tangerine with dark pores
const corkBrick = {
  style: 'cork', c1: CORK, c2: CORK_D, mortar: '#8a4010',
  paint(ctx) {
    ctx.fillStyle = CORK; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = CORK_L; ctx.fillRect(0, 0, TS, 4);
    ctx.fillStyle = CORK_D; for (const [x, y] of [[7, 9], [20, 7], [13, 17], [25, 21], [6, 25], [17, 27]]) { ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// cobalt glass (walls, the hard blocks): a cellar's side with a pale glint
const glassHard = {
  c1: COBALT_L, c2: COBALT_D,
  paint(ctx) {
    ctx.fillStyle = COBALT; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = COBALT_D; ctx.fillRect(0, TS - 5, TS, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(5, 4); ctx.lineTo(11, 4); ctx.lineTo(5, 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const shore = { ground: treadGround, semi: ledgeSemi, brick: corkBrick, hard: glassHard, pillar: { c1: COBALT_L, c2: COBALT_D, cap: CORK, style: 'column' }, accent: CORK, tint: {}, bloom: 0.1, liquid: null };
// each secret room its own floor and walls
const roomTiles = (cap, capHi, body, body2, pat, hard1, hard2) => {
  const ground = { style: 'room', cap, capHi, dirt: body, dirt2: body2, rock: body2,
    paint(ctx, rng) { ctx.fillStyle = body; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = body2;
      if (pat === 'herring') { for (let y = 0; y < TS; y += 8) for (let x = ((y / 8) % 2) * 8; x < TS; x += 16) ctx.fillRect(x, y, 10, 3); }
      else if (pat === 'tile') { ctx.fillRect(0, TS - 2, TS, 2); ctx.fillRect(TS - 2, 0, 2, TS); }
      else if (pat === 'plank') { ctx.fillRect(0, 10, TS, 2); ctx.fillRect(0, 22, TS, 2); ctx.fillRect((rng() * 20) | 0, 0, 2, 10); }
      else if (pat === 'check') { ctx.fillRect(0, 0, TS / 2, TS / 2); ctx.fillRect(TS / 2, TS / 2, TS / 2, TS / 2); }
      else if (pat === 'dots') { for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(8 + (k % 2) * 16, 8 + (k >> 1) * 16, 3, 0, TAU); ctx.fill(); } } },
    paintCap(ctx, x0, x1) { ctx.fillStyle = cap; ctx.fillRect(x0, 0, x1 - x0, 10); ctx.fillStyle = capHi; ctx.fillRect(x0, 0, x1 - x0, 3); ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5); } };
  const hard = { c1: hard1, c2: hard2, paint(ctx) { ctx.fillStyle = hard2; ctx.fillRect(0, 0, TS, TS); ctx.fillStyle = hard1; ctx.fillRect(2, 2, TS - 4, TS - 4); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5); } };
  return Object.assign({}, shore, { ground, hard });
};
const RT = {
  kettle: roomTiles('#c8553a', '#f08a6a', '#3a2a2a', '#2e2020', 'tile', '#c8553a', '#8a3020'),
  lamps: roomTiles('#e8c840', '#fff0a0', '#2a3a5a', '#22304a', 'dots', '#4a5a7a', '#2a3450'),
  mitts: roomTiles('#5ab08a', '#8ad8b0', '#f4ecd8', '#e0d4b8', 'check', '#5ab08a', '#2e7a5a'),
  rattle: roomTiles('#a86a3a', '#d8a070', '#6a4a2a', '#5a3c20', 'plank', '#8a5a30', '#5a3818'),
  stand: roomTiles('#8a6ad8', '#b8a0f0', '#24203a', '#1c182e', 'herring', '#6a50b8', '#3a2a6a')
};

/* ---------------- painted backdrops ---------------- */
// far salt flats under a pale sky with a cobalt horizon line of brine
function flats(ctx, b, col, rng) {
  ctx.fillStyle = col; ctx.fillRect(0, b - 30, BG_W, 400);
  ctx.fillStyle = shade(col, 0.12); for (let k = 0; k < 40; k++) { const x = rng() * BG_W, w = 40 + rng() * 120; ctx.fillRect(x, b - 24 + rng() * 20, w, 2); }
}
// a row of salt cellars and shakers far off: cobalt glass boxes, cork lids, charcoal caps (plain shapes, no towers)
function cellars(ctx, b, rng, col, h0, h1) {
  for (let x = 20; x < BG_W; x += 110 + rng() * 90) {
    const w = 50 + rng() * 40, h = h0 + rng() * (h1 - h0);
    wrapDraw(x, w + 20, X => {
      ctx.fillStyle = col; ctx.fillRect(X, b - h, w, h + 400); ctx.fillStyle = shade(col, 0.25); ctx.fillRect(X + 6, b - h + 8, 8, h - 16);
      if (rng() < 0.5) { ctx.fillStyle = shade(col, -0.12); ctx.fillRect(X - 4, b - h - 14, w + 8, 14); ctx.fillRect(X + w / 2 - 8, b - h - 22, 16, 8); }
      else { ctx.fillStyle = shade(CHAR, 0.2); ctx.beginPath(); ctx.ellipse(X + w / 2, b - h, w / 2 + 4, 12, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = shade(col, -0.3); for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.arc(X + w / 2 + k * 10, b - h - 5, 2, 0, TAU); ctx.fill(); } }
    });
  }
}
// near: white crystal stair-steps
function steps(ctx, b, rng, col) {
  for (let x = 0; x < BG_W; x += 90 + rng() * 70) {
    const n = 2 + Math.floor(rng() * 3), s = 26 + rng() * 14;
    wrapDraw(x, n * s + 10, X => { for (let k = 0; k < n; k++) { ctx.fillStyle = shade(col, k % 2 ? 0.06 : 0); ctx.fillRect(X + k * s * 0.7, b - (n - k) * s, s * 1.4, (n - k) * s + 400); ctx.fillStyle = shade(col, -0.12); ctx.fillRect(X + k * s * 0.7, b - (n - k) * s, s * 1.4, 4); } });
  }
}
const painters = {
  // 34-1: the salt flats and their heaps under a wide pale sky
  saltFlats(ctx, L, rng, H) { flats(ctx, L.base, L.color, rng); ctx.fillStyle = shade(L.color, -0.08); for (let k = 0; k < 14; k++) { const x = rng() * BG_W, w = 50 + rng() * 80, h = 18 + rng() * 30; wrapDraw(x - w, 2 * w, X => { ctx.beginPath(); ctx.moveTo(X, L.base); ctx.quadraticCurveTo(X + w, L.base - h * 2, X + 2 * w, L.base); ctx.fill(); }); } },
  saltCellars(ctx, L, rng, H) { cellars(ctx, L.base, rng, L.color, 60, 150); },
  saltSteps(ctx, L, rng, H) { steps(ctx, L.base, rng, L.color); },
  // 34-2: the brine sea itself: long low waves, far cork buoys
  saltSea(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = L.color; ctx.fillRect(0, b - 40, BG_W, 500);
    ctx.strokeStyle = shade(L.color, 0.22); ctx.lineWidth = 2; for (let y = b - 30; y < b + 120; y += 16) { ctx.beginPath(); for (let x = 0; x <= BG_W; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.03 + y) * 3); ctx.stroke(); }
    for (let k = 0; k < 8; k++) { const x = rng() * BG_W, y = b - 20 + rng() * 50; ctx.fillStyle = shade(CORK, -0.2); ctx.fillRect(x - 6, y - 8, 12, 8); }
  },
  // 34-3: a crystal cave: big cubes leaning together in the dark blue
  saltCave(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(0, 0, BG_W, H);
    for (let k = 0; k < 26; k++) { const x = rng() * BG_W, s = 30 + rng() * 70, y = rng() < 0.5 ? b - rng() * 60 : 40 + rng() * 80; wrapDraw(x, s + 10, X => { ctx.save(); ctx.translate(X + s / 2, y); ctx.rotate((rng() - 0.5) * 0.6); ctx.fillStyle = shade(L.color, 0.1 + rng() * 0.15); ctx.fillRect(-s / 2, -s, s, s); ctx.fillStyle = shade(L.color, 0.3); ctx.fillRect(-s / 2, -s, s, s * 0.18); ctx.restore(); }); }
  },
  // 34-4: inside the shaker: the cap's charcoal dome overhead, pinholes of daylight, a curve of cobalt glass
  saltShaker(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(L.color, 0.12); for (let x = 0; x < BG_W; x += 160) { ctx.fillRect(x, 0, 60, H); }
    ctx.fillStyle = 'rgba(255,250,220,0.55)'; for (let k = 0; k < 30; k++) { const x = rng() * BG_W, y = 20 + rng() * 90; ctx.beginPath(); ctx.arc(x, y, 3 + rng() * 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = shade(L.color, -0.25); ctx.fillRect(0, b - 10, BG_W, 400);
  },
  // 34-5: A Pinch's kitchen: a long cobalt-tiled wall, shelves of shakers, a big soup pot steaming far off
  saltKitchen(ctx, L, rng, H) {
    const b = L.base; ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = shade(L.color, 0.08); for (let y = 0; y < b; y += 28) for (let x = ((y / 28) % 2) * 14; x < BG_W; x += 28) ctx.fillRect(x, y, 26, 26);
    for (let x = 60; x < BG_W; x += 240) { ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(x, b - 150, 150, 8); for (let k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? shade(COBALT, -0.2) : shade(CRYS, -0.25); ctx.fillRect(x + 10 + k * 34, b - 186, 22, 36); ctx.fillStyle = shade(CHAR, 0.1); ctx.fillRect(x + 10 + k * 34, b - 194, 22, 8); } }
    ctx.fillStyle = shade(L.color, -0.35); ctx.fillRect(0, b - 30, BG_W, 400);
  },
  // the rooms (B41-B45): each its own place
  roomKettle(ctx, L, rng, H) { const b = L.base; ctx.fillStyle = '#4a2e2a'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#5a3a34'; for (let y = 0; y < H; y += 24) for (let x = ((y / 24) % 2) * 20; x < BG_W; x += 40) ctx.fillRect(x, y, 36, 20); ctx.fillStyle = '#2a1a18'; ctx.fillRect(0, b - 120, BG_W, 12); for (let x = 50; x < BG_W; x += 150) { ctx.fillStyle = '#8a6a5a'; ctx.beginPath(); ctx.arc(x, 70, 18, 0, TAU); ctx.fill(); } },
  roomLamps(ctx, L, rng, H) { ctx.fillStyle = '#1e2a46'; ctx.fillRect(0, 0, BG_W, H); for (let k = 0; k < 60; k++) { ctx.fillStyle = 'rgba(255,240,180,0.25)'; ctx.beginPath(); ctx.arc(rng() * BG_W, rng() * H * 0.6, 1.5, 0, TAU); ctx.fill(); } ctx.strokeStyle = '#3a4a6a'; ctx.lineWidth = 3; for (let x = 0; x < BG_W; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 60, 60, x + 120, 0); ctx.stroke(); } },
  roomMitts(ctx, L, rng, H) { ctx.fillStyle = '#f4e8c8'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#e8d8b0'; for (let x = 0; x < BG_W; x += 30) ctx.fillRect(x, 0, 14, H); ctx.fillStyle = '#5ab08a'; ctx.fillRect(0, L.base - 140, BG_W, 10); for (let x = 30; x < BG_W; x += 90) { ctx.fillStyle = '#c8b890'; ctx.fillRect(x, 40, 4, 30); ctx.beginPath(); ctx.arc(x + 2, 80, 12, 0, TAU); ctx.fill(); } },
  roomRattle(ctx, L, rng, H) { ctx.fillStyle = '#8a6a44'; ctx.fillRect(0, 0, BG_W, H); ctx.fillStyle = '#7a5a38'; for (let x = 0; x < BG_W; x += 26) ctx.fillRect(x, 0, 3, H); ctx.fillStyle = '#5a3c20'; for (let y = 60; y < H; y += 110) ctx.fillRect(0, y, BG_W, 8); for (let x = 40; x < BG_W; x += 70) { ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.ellipse(x, 52, 8, 12, 0, 0, TAU); ctx.fill(); } },
  roomStand(ctx, L, rng, H) { ctx.fillStyle = '#2a2244'; ctx.fillRect(0, 0, BG_W, H); for (let x = 0; x < BG_W; x += 90) { ctx.fillStyle = '#3a2e5a'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 45, 0); ctx.lineTo(x + 30, H); ctx.lineTo(x + 5, H); ctx.closePath(); ctx.fill(); } ctx.fillStyle = 'rgba(255,230,160,0.12)'; ctx.beginPath(); ctx.moveTo(BG_W / 2 - 40, 0); ctx.lineTo(BG_W / 2 + 40, 0); ctx.lineTo(BG_W / 2 + 160, H); ctx.lineTo(BG_W / 2 - 160, H); ctx.closePath(); ctx.fill(); }
};
const base = (o, ...mix) => Object.assign({}, ...mix, o);
const roomTheme = (name, col, kind, rt) => base({ name, music: 'tour_salt_room', particles: 'none', rays: null, sky: [col, col, col], horizonGlow: '#ffffff', celestial: { type: 'none' }, stars: 0, layers: [{ kind, base: 400, f: 0.05 }], fog: col, decor: [] }, rt);
const themes = {
  salt_flats: base({ name: 'Angle of Repose', music: 'tour_salt', particles: 'none', rays: '#fff8e0', sky: ['#8ab0e8', '#b8d0f4', '#e8f0fc'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.72, y: 0.22, r: 28, color: '#fffbe8', glow: '#ffffff' }, stars: 0,
    layers: [{ kind: 'saltFlats', color: '#dfe8f6', base: 300, f: 0.06 }, { kind: 'saltCellars', color: '#a8bce6', base: 360, f: 0.12 }, { kind: 'saltSteps', color: '#cbd8ee', base: 440, f: 0.22 }], fog: '#d8e4f6', decor: ['saltHeapSmall', 'saltCellarProp'] }, shore),
  salt_sea: base({ name: 'Grain Elevator', music: 'tour_salt_sea', particles: 'none', rays: null, sky: ['#5a88d8', '#8ab0ec', '#cfe0fa'], horizonGlow: '#f0f6ff', celestial: { type: 'sun', x: 0.25, y: 0.2, r: 26, color: '#fffbe8', glow: '#ffffff' }, stars: 0,
    layers: [{ kind: 'saltSea', color: '#4a7ad0', base: 330, f: 0.08 }, { kind: 'saltSteps', color: '#d4dff0', base: 450, f: 0.2 }], fog: '#a8c4ee', decor: ['saltCellarProp'] }, shore),
  salt_cave: base({ name: 'Crystal Habit', music: 'tour_salt_sea', particles: 'none', rays: null, sky: ['#1a2a5a', '#25386e', '#30468a'], horizonGlow: '#5a82e8', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'saltCave', color: '#3a5aa8', base: 420, f: 0.1 }], fog: '#2a3c78', decor: ['saltHeapSmall'] }, shore),
  salt_shaker: base({ name: 'The Shaker Test', music: 'tour_salt', particles: 'none', rays: null, sky: ['#3a3a4a', '#4a4a5c', '#5a5a6e'], horizonGlow: '#a0a0c0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'saltShaker', color: '#4a4c60', base: 430, f: 0.08 }], fog: '#4a4c60', decor: ['saltCellarProp'] }, shore),
  salt_kitchen: base({ name: 'Season to Taste', music: 'tour_salt_boss', particles: 'none', rays: null, sky: ['#26346a', '#2e3e7a', '#384a8a'], horizonGlow: '#8aa0e0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'saltKitchen', color: '#34447e', base: 440, f: 0.08 }], fog: '#34447e' }, shore),
  salt_room_kettle: roomTheme('The Stove Alcove', '#4a2e2a', 'roomKettle', RT.kettle),
  salt_room_lamps: roomTheme('The Lamp Loft', '#1e2a46', 'roomLamps', RT.lamps),
  salt_room_mitts: roomTheme('The Mitt Counter', '#f4e8c8', 'roomMitts', RT.mitts),
  salt_room_rattle: roomTheme('The Pod Pantry', '#8a6a44', 'roomRattle', RT.rattle),
  salt_room_stand: roomTheme('The Music Stand', '#2a2244', 'roomStand', RT.stand)
};

/* ---------------- props (Decor: drawn each frame) ---------------- */
const decor = {
  // a little heap of salt left on the flats (scenery: grey-white and low, nothing like the gold-ringed heaps)
  saltHeapSmall(ctx, x, y) { ctx.save(); ctx.globalAlpha = 0.75; ctx.fillStyle = '#dfe6f2'; ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.quadraticCurveTo(x, y - 18, x + 20, y); ctx.closePath(); ctx.fill(); ctx.restore(); },
  // an empty cobalt salt cellar on its side (scenery), its cork lid beside it
  saltCellarProp(ctx, x, y) { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#8aa0d0'; ctx.fillRect(x - 16, y - 22, 26, 22); ctx.fillStyle = '#c8b8a8'; ctx.fillRect(x + 12, y - 8, 10, 8); ctx.restore(); },
  // the grain tell (drawn by an entity, see the levels file)
  saltTip(ctx, x, y, t) { SaltArt.grain(ctx, x, y - 6, t || 0); }
};

/* ---------------- door looks: a cellar door, a cork hatch ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'saltCellar' || look === 'saltHatch') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (look === 'saltCellar') {
        ctx.fillStyle = COBALT; rr(ctx, x - 22, y - 60, 44, 60, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = near ? '#0a1030' : COBALT_D; rr(ctx, x - 16, y - 52, 32, 52, 4); ctx.fill();
        SaltArt.cork(ctx, x, y - 54, 48, 12);
      } else {
        SaltArt.cork(ctx, x, y, 40, 50);
        ctx.fillStyle = near ? '#2a1408' : CORK_D; rr(ctx, x - 13, y - 42, 26, 40, 8); ctx.fill(); ctx.stroke();
      }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// GRAIN WREN: a cobalt wren on a salt-cube perch; she pecks her own perch away grain by grain (it shrinks), then has
// to swoop (her tell: she looks down at the stump and flaps, then dives)
const wrenArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y - 10); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const flap = Math.sin(t * 18) * 0.7, peck = m !== 'swoop' && Math.sin(t * 7) > 0.5;
  if (m !== 'swoop') { const s = 6 + 5 * (0.5 + 0.5 * Math.cos(t * 0.6)); SaltArt.cube(ctx, -s / 2, 16, s); }
  ctx.fillStyle = COBALT; ctx.beginPath(); ctx.ellipse(0, 0, 11, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(3, 4, 6, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = COBALT_D; ctx.save(); ctx.translate(-3, -2); ctx.rotate(-0.5 + flap); ctx.beginPath(); ctx.ellipse(-6, 0, 9, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.beginPath(); ctx.moveTo(-9, -2); ctx.lineTo(-16, -9); ctx.lineTo(-13, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(5, -4, 3.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(6, peck ? -3 : -5, 1.6, 0, TAU); ctx.fill();
  ctx.fillStyle = CORK; ctx.beginPath(); ctx.moveTo(9, -3); ctx.lineTo(17, peck ? 3 : -2); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
};
// BRINE SHRIMP: a pink shrimp who now and then goes rigid and pretends to be a teaspoon (stiff, silver, eyes shut)
const shrimpArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  if (m === 'notice') {
    // a teaspoon (honestly): a long silver handle and a bowl, a shrimp's tail sticking out
    ctx.fillStyle = '#d8dce8'; rr(ctx, -16, -8, 22, 5, 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(10, -6, 8, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f48a8a'; ctx.beginPath(); ctx.moveTo(-16, -6); ctx.lineTo(-22, -11); ctx.lineTo(-22, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -9); ctx.lineTo(10, -9); ctx.stroke(); ctx.restore(); return;
  }
  const wig = Math.sin(t * 12) * 2;
  ctx.fillStyle = '#f48a8a'; ctx.beginPath(); ctx.moveTo(14, -12); ctx.quadraticCurveTo(4, -24, -10, -16); ctx.quadraticCurveTo(-18, -10, -14, -2); ctx.lineTo(-20, 0); ctx.lineTo(-12, 4); ctx.quadraticCurveTo(-4, -4, 4, -6); ctx.quadraticCurveTo(12, -6, 14, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#c84a5a'; ctx.lineWidth = 1.2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-6 + k * 6, -12, 6, 0.4, 1.6); ctx.stroke(); }
  ctx.strokeStyle = INK; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-4 + k * 4, -5); ctx.lineTo(-5 + k * 4 + wig * (k % 2 ? 1 : -1), 0); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(13, -14); ctx.quadraticCurveTo(24, -26, 30, -20); ctx.moveTo(12, -15); ctx.quadraticCurveTo(18, -30, 26, -30); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(10, -15, 3, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(11, -15, 1.4, 0, TAU); ctx.fill();
  ctx.restore();
};
// CORK WEEVIL: a cork-bodied weevil with a drill for a snout. It drills a tidy hole (the tell: the drill spins, curls of
// cork fly), then charges, triumphant, and falls through his own hole at the end of the run
const weevilArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.7;
  const run = m === 'charge', drill = m === 'notice', st = run ? Math.sin(t * 26) * 3 : Math.sin(t * 9) * 1.5;
  ctx.fillStyle = CORK_D; for (const [lx, s] of [[-9, st], [-2, -st], [6, st]]) ctx.fillRect(lx + s * 0.4, -8, 3.5, 8);
  SaltArt.cork(ctx, -3, -6, 26, 18);
  ctx.fillStyle = CORK; ctx.beginPath(); ctx.arc(11, -14, 6.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(12, -16, 3, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(13, -16, 1.4, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(17, -13); if (drill) ctx.rotate(Math.sin(t * 40) * 0.08);
  ctx.fillStyle = '#c8ccd8'; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(12, 0); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(2 + k * 3, -3 + k * 0.8); ctx.lineTo(4 + k * 3, 3 - k * 0.8); } ctx.stroke(); ctx.restore();
  if (drill) { ctx.fillStyle = CORK_L; for (let k = 0; k < 3; k++) { const a = t * 9 + k * 2; ctx.beginPath(); ctx.arc(26 + Math.cos(a) * 6, -16 + Math.sin(a) * 6, 2, 0, TAU); ctx.fill(); } }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(9, -20); ctx.quadraticCurveTo(8, -28, 4, -30); ctx.moveTo(12, -20); ctx.quadraticCurveTo(15, -28, 18, -29); ctx.stroke();
  ctx.restore();
};
// SALT LICK: a block of salt with eyes and one enormous tongue. The tell: the tongue bulges in his cheek and his eyes
// squeeze (0.9 s); then it shoots out along the floor and sticks to the crystals there ("STUCK!") for a second
const lickArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const tell = m === 'notice', out = m === 'charge';
  ctx.fillStyle = CRYS_D; ctx.fillRect(-14, -5, 7, 5); ctx.fillRect(6, -5, 7, 5); ctx.strokeRect(-14, -5, 7, 5); ctx.strokeRect(6, -5, 7, 5);
  ctx.fillStyle = CRYS; rr(ctx, -16, -34, 32, 30, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = CRYS_B; ctx.fillRect(-15, -33, 30, 6);
  // eyes (squeezed shut in the tell)
  if (tell) { ctx.beginPath(); ctx.moveTo(-6, -24); ctx.lineTo(-1, -21); ctx.lineTo(-6, -18); ctx.moveTo(10, -24); ctx.lineTo(5, -21); ctx.lineTo(10, -18); ctx.stroke(); }
  else { ctx.fillStyle = '#ffffff'; for (const ex of [-3, 7]) { ctx.beginPath(); ctx.arc(ex, -22, 4, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.fillStyle = INK; for (const ex of [-2, 8]) { ctx.beginPath(); ctx.arc(ex, -22, 1.7, 0, TAU); ctx.fill(); } }
  // the tongue: in the mouth, bulging, or out along the floor
  ctx.fillStyle = '#f07a8a';
  if (out) { const L = e.tongueL || 0; ctx.beginPath(); ctx.moveTo(10, -12); ctx.quadraticCurveTo(14 + L * 0.3, -4, 14 + L, -4); ctx.arc(14 + L, -8, 4.5, Math.PI / 2, -Math.PI / 2, true); ctx.quadraticCurveTo(14 + L * 0.3, -14, 10, -16); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else { const k = tell ? 1 + 0.4 * Math.sin(t * 30) : 1; ctx.beginPath(); ctx.ellipse(12, -12, 6 * k, 4 * k, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
const tongueArt = (c, s) => {};
const enemies = {
  saltWren: { cls: TourFlyer.make({ w: 26, h: 22, range: 3, speed: 0.8, swoop: true, art: wrenArt, burst: COBALT,
    onSwoop: e => { if (e.g.onScreen(e)) SaltSay(e.g, e.cx, e.y - 10, 'OOPS. ATE MY PERCH.', CRYS); } }), place: 'fly' },
  saltShrimp: { cls: TourEnemy.make({ w: 30, h: 22, speed: 0.7, behavior: 'walk', art: shrimpArt, burst: '#f48a8a',
    init(e) { e.spoonT = 2.5 + Math.random() * 1.5; },
    think(e, dt) {
      if (e.spoonS > 0) { e.spoonS -= dt; e.vx = 0; e.mode = 'notice'; if (e.spoonS <= 0) { e.mode = 'walk'; e.vx = e.dir * e.speed; } return; }
      if (!e.vx) e.vx = e.dir * e.speed;
      e.mode = 'walk'; e.spoonT -= dt;
      if (e.spoonT <= 0) { e.spoonT = 3 + Math.random() * 1.5; e.spoonS = 1.4; if (e.g.onScreen(e, 40)) SaltSay(e.g, e.cx, e.y - 14, pick(['I AM A TEASPOON.', 'JUST A SPOON HERE.', '(TEASPOON NOISES)']), CRYS); }
    } }), place: 'walk' },
  saltWeevil: { cls: TourEnemy.make({ w: 30, h: 24, speed: 0.8, behavior: 'charge', range: 6, windup: 0.8, chargeSpeed: 4.0, chargeT: 0.9, art: weevilArt, burst: CORK,
    onNotice: e => { if (e.g.onScreen(e)) SaltSay(e.g, e.cx, e.y - 12, 'A TIDY HOLE... TA-DA!', CORK_L); } }), place: 'walk' },
  saltLick: { cls: TourEnemy.make({ w: 30, h: 34, speed: 0, behavior: 'still', art: lickArt, burst: CRYS,
    init(e) { e.lickT = 1.5 + Math.random(); e.tongueL = 0; },
    think(e, dt) {
      const p = e.g.player; e.vx = 0;
      if (e.tellT > 0) { e.tellT -= dt; e.mode = 'notice'; if (e.tellT <= 0) { e.outT = 1.3; e.tongueL = 0; } return; }
      if (e.outT > 0) {
        e.outT -= dt; e.mode = 'charge'; e.tongueL = Math.min(68, e.tongueL + dt * 400);
        // the tongue hurts only while it shoots out (the first 0.25 s); stuck on the floor it is just a tongue
        if (e.outT > 1.05) tourFire(e.g, e.dir > 0 ? e.cx + 10 : e.cx - 10 - e.tongueL, e.y + e.h - 16, { vx: 0, w: e.tongueL, h: 12, life: 1 / 60, col: '#f07a8a', art: tongueArt });
        if (e.outT < 1.0 && !e.stuckSaid) { e.stuckSaid = true; if (e.g.onScreen(e, 40)) SaltSay(e.g, e.cx, e.y - 14, 'STUCK! THELP!', '#f07a8a'); }
        if (e.outT <= 0) { e.mode = 'walk'; e.tongueL = 0; e.stuckSaid = false; }
        return;
      }
      e.mode = 'walk'; if (p) e.dir = sign(p.cx - e.cx) || e.dir; e.lickT -= dt;
      if (e.lickT <= 0 && p && !p.dead && Math.abs(p.cx - e.cx) < 5 * TS && Math.abs(p.cy - e.cy) < 2 * TS) { e.lickT = 2.6; e.tellT = 0.9; }
    } }), place: 'walk' }
};

/* ---------------- the route map: a salt cellar with a cork lid in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save();
  ctx.fillStyle = '#cfe0fa'; ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, TAU); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.fillStyle = COBALT; ctx.fillRect(x - r * 0.42, y - r * 0.25, r * 0.84, r * 0.7); ctx.strokeRect(x - r * 0.42, y - r * 0.25, r * 0.84, r * 0.7);
  ctx.fillStyle = CRYS; ctx.fillRect(x - r * 0.32, y + r * 0.02, r * 0.64, r * 0.35);
  ctx.fillStyle = CORK; ctx.fillRect(x - r * 0.48, y - r * 0.45, r * 0.96, r * 0.22); ctx.strokeRect(x - r * 0.48, y - r * 0.45, r * 0.96, r * 0.22);
  ctx.restore();
};

/* ---------------- the land's map: sprites and the salt flats ---------------- */
Object.assign(TourOWPaint.art, {
  // a heap of salt
  saltHeapSprite(c, r) { SaltArt.heap(c, 0, 0, r, r * 0.8); },
  // a cobalt cellar with a cork lid
  saltCellarSprite(c, r) { c.fillStyle = COBALT; c.fillRect(-r * 0.6, -r, r * 1.2, r); c.strokeRect(-r * 0.6, -r, r * 1.2, r); c.fillStyle = CRYS; c.fillRect(-r * 0.45, -r * 0.55, r * 0.9, r * 0.5); SaltArt.cork(c, 0, -r, r * 1.4, r * 0.35); },
  // A Pinch's kitchen (the boss): a soup pot on a stove, a chef's cork beside it
  saltPotSprite(c, r) { c.fillStyle = CHAR; c.fillRect(-r, -r * 0.8, r * 2, r * 0.8); c.strokeRect(-r, -r * 0.8, r * 2, r * 0.8); c.fillStyle = BRINE_L; c.fillRect(-r * 0.85, -r * 0.8, r * 1.7, r * 0.15); SaltArt.cork(c, r * 1.3, 0, r * 0.6, r); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(r * 1.3, -r * 1.1, r * 0.35, 0, TAU); c.fill(); c.stroke(); },
  // a floating cork
  saltCorkSprite(c, r) { SaltArt.cork(c, 0, 0, r * 1.6, r * 0.8); }
});
// a crust of crystal cubes instead of a coast, over the brine
TourOWLands.coast.saltCrust = function (c, ow, ring) {
  const L = ow.look, ink = this.INK;
  c.save(); c.translate(6, 12); OWGeo.path(c, ring, true); c.fillStyle = 'rgba(10,20,60,0.3)'; c.fill(); c.restore();
  c.save(); c.translate(0, 8); OWGeo.path(c, ring, true); c.fillStyle = CRYS_D; c.fill(); c.strokeStyle = ink; c.lineWidth = 2.6; c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.fillStyle = L.land; c.fill();
  c.save(); OWGeo.path(c, ring, true); c.clip(); c.strokeStyle = '#ffffff'; c.lineWidth = 9; OWGeo.path(c, ring, true); c.stroke(); c.restore();
  OWGeo.path(c, ring, true); c.strokeStyle = ink; c.lineWidth = 2.8; c.stroke();
};
// the flats under the trails: crust cracks in hexagons, little heaps
TourOWScenes.groundPaint.salt = function (c, ow) {
  const R = TourOWPaint.rng('saltground');
  c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = 'rgba(60,90,160,0.18)'; c.lineWidth = 2;
  for (let k = 0; k < 70; k++) { const x = 220 + R() * 1100, y = 190 + R() * 500, s = 14 + R() * 10; c.beginPath(); for (let q = 0; q <= 6; q++) { const a = q / 6 * TAU; c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s * 0.6); } c.stroke(); }
};
TourLandscape.looks.salt = ['#cfe0fa', '#8ab0e8', COBALT, CORK, CRYS, CHAR, 'saltCellarLm'];
{
  const lm0 = TourLandscape.landmark;
  TourLandscape.landmark = function (ctx, kind, x, y, size, ink, accent) {
    if (kind !== 'saltCellarLm') return lm0.call(this, ctx, kind, x, y, size, ink, accent);
    ctx.save(); ctx.translate(x, y); ctx.scale(size / 40, size / 40); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    TourOWPaint.art.saltCellarSprite.call(TourOWPaint, ctx, 22);
    ctx.restore();
  };
}

/* ---------------- music: a breezy shore tune, a slow brine waltz, a little room tune, the chef's march ---------------- */
const tracks = {
  tour_salt: {
    bpm: 112, bars: 8, rv: 0.35, dl: 0.2, hx: 0.04,
    ch: 'G Em C D G Em Am D',
    ld: 'B6:4 D7:4 G7:8 | E7:4 D7:4 B6:8 | C7:4 E7:4 G7:4 E7:4 | D7:8 A6:8 | B6:4 D7:4 G7:8 | G7:4 F#7:4 E7:8 | C7:4 E7:4 A7:4 G7:4 | F#7:8 D7:8',
    li: 'pluck', lv: 0.14,
    bp: 'r.......r...f...', bi: 'pluckb', bv: 0.28,
    ap: '..c...c...c...c.', ai: 'glass', av: 0.05, ao: 64,
    dr: ['k.......k.......', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.22
  },
  tour_salt_sea: {
    bpm: 96, bpb: 3, bars: 8, rv: 0.45, dl: 0.25, hx: 0.04,
    ch: 'D D Bm Bm G A D A',
    ld: 'F#6:3 A6:3 D7:3 | E7:6 C#7:3 | D7:3 B6:3 F#6:3 | B6:9 | G6:3 B6:3 D7:3 | E7:3 C#7:3 A6:3 | D7:3 F#7:3 A7:3 | E7:9',
    li: 'glass', lv: 0.13,
    bp: 'r..f..', bi: 'sub', bv: 0.26,
    ap: '...c.c', ai: 'harp', av: 0.05, ao: 60,
    dr: ['k.....', '...s..', 'h.hh.h'], dv: 0.2
  },
  tour_salt_room: {
    bpm: 116, bars: 4, rv: 0.4, dl: 0.2, hx: 0.04,
    ch: 'C Am F G',
    ld: 'E7:4 G7:4 C8:8 | A7:4 C8:4 E8:8 | F7:4 A7:4 C8:4 A7:4 | G7:4 B7:4 D8:8',
    li: 'mbox', lv: 0.13,
    bp: 'r.......r.......', bi: 'sub', bv: 0.22,
    ap: 'c...c...c...c...', ai: 'harp', av: 0.05, ao: 66,
    dr: ['k.......k.......', '....s.......s...', '..h...h...h...h.'], dv: 0.2
  },
  tour_salt_boss: {
    bpm: 140, bars: 8, rv: 0.3, hx: 0.06,
    ch: 'Am Am F E Am Am Dm E',
    ld: 'A6:2 C7:2 E7:2 A7:2 G7:4 E7:4 | F7:2 E7:2 D7:2 C7:2 A6:8 | F7:2 A7:2 C8:2 A7:2 F7:4 A7:4 | G#7:4 B7:4 E7:8 |' +
        'A7:2 C8:2 E8:2 C8:2 A7:4 C8:4 | B7:2 A7:2 G#7:2 A7:2 E7:8 | D7:2 F7:2 A7:2 D8:2 C8:4 A7:4 | B7:4 D8:4 G#7:8',
    li: 'brass', lv: 0.15,
    bp: 'r-.r-.r-.r-.r-o-', bi: 'reese', bv: 0.3,
    ap: '..c...c...c...c.', ai: 'pluck', av: 0.05, ao: 55,
    dr: ['k...k...k...k...', '....s.......s..s', 'h.h.h.h.h.h.h.h.'], dv: 0.4
  }
};

Tour.country({
  id: 'salt', secret: true, bonus: true, colors: COL, tagline: 'A hidden land: the whole sea inside a shaker that says "just a pinch"',
  themes, painters, decor, enemies, tracks,
  music: { level: 'tour_salt', boss: 'tour_salt_boss', map: null },
  landmark: 'the crystal stair-steps', emblem,
  arrival: 'Brady! You slipped through the rim of a saucer and came out in the salt cellar the whole sea is kept in. The shaker says "just a pinch". It has been lying for years. I have always suspected ours. ♥ C',
  coin: { name: 'GRAINS', draw(ctx, x, y) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.25); ctx.fillStyle = CRYS; ctx.fillRect(-7, -7, 14, 14); ctx.fillStyle = CRYS_B; ctx.fillRect(-7, -7, 14, 4); ctx.fillRect(3, -7, 4, 14);
    ctx.strokeStyle = COBALT_D; ctx.lineWidth = 1.6; ctx.strokeRect(-7, -7, 14, 14); ctx.restore();
  } },
  levels: []
});
Tour.saltKit = { SOLID, say: SaltSay, COL, INK, SaltArt, onMark, isSalt, wrenArt, shrimpArt, weevilArt, lickArt, decor, RT };
try { if (typeof window !== 'undefined') { window.BRADY_TOUR = window.BRADY_TOUR || {}; window.BRADY_TOUR.saltKit = Tour.saltKit; if (typeof TourMap !== 'undefined' && !window.BRADY_TOUR.TourMap) window.BRADY_TOUR.TourMap = TourMap; } } catch (e) { /* not in a browser */ }
})();
