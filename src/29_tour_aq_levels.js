/* ============================================================
   ANTARCTICA (secret land, world 13): the five levels in the v2
   format (LEVEL_OVERHAUL.md §2 "World 13", §3.2 graph, §4.3, §4.4).
   13-1 Ice Shelf Bowling   ROLL   belly-slide bowling, a snowball that grows and smashes snow walls, seal holes
   13-2 Upside-Down Pole    FLIP   aurora bands turn gravity over; icebergs hang from the sky; mid-air swaps
   13-3 Aurora Station      FORT   modules, the heater vent, the mast, then the Snow-Plough Bot (mini-boss)
   13-4 The Floe of Big Tusk LAIR  a crevasse slide that teaches kicked ice blocks and dropped icicles, then Big Tusk
   13-5 Egg Express         CARRY  (secret) carry an emperor penguin's egg through the blizzard; skuas want it
   Loads after 29_tour_aq.js (the look, the old pieces, Big Tusk) and
   replaces its level list with Tour.amend. The way in is unchanged:
   the cracked hut wall in 8-4.
   ============================================================ */
(() => {
const C = Tour.countries.aq;
if (!C) return;
const K = TourKit;
const AQX = 'aq_x';
const wrapDraw = (x, w, fn) => { fn(x); if (x + w > BG_W) fn(x - BG_W); if (x < 0) fn(x + BG_W); };

// rows for a stamp: walls left and right, ground from the floor row down, a ceiling unless opts.open;
// marks = [[x, y, 'text'], ...] written into the rows
function room(W, H, floor, marks, opts) {
  opts = opts || {};
  const wall = opts.wall || 'H', rows = [];
  for (let y = 0; y < H; y++) {
    let r;
    if (y >= floor) r = '#'.repeat(W);
    else if (y === 0 && !opts.open) r = '#'.repeat(W);
    else r = wall + '.'.repeat(W - 2) + wall;
    rows.push(r.split(''));
  }
  for (const [x, y, txt] of marks) for (let k = 0; k < txt.length; k++) if (txt[k] !== ' ' && x + k < W && y < H) rows[y][x + k] = txt[k];
  return rows.map(r => r.join(''));
}

// every Antarctic level may draw from the overhaul cast's atlas (the conga line, krill, the egg, the keeper)
{
  const ex = Play.prototype.extraAtlases;
  Play.prototype.extraAtlases = function () { const n = ex.call(this); if (this.level && this.level.country === 'aq' && n.indexOf(AQX) < 0) n.push(AQX); return n; };
}
const atlasDraw = (ctx, clip, t, x, y, dir, k) => typeof Atlas !== 'undefined' && Atlas.animate(ctx, AQX, clip, t, x, y, dir || 1, { scale: k || ART_SCALE.enemy });

/* ================= themes ================= */
const painters = {
  // aurora curtains over the polar night: soft green and violet ribbons
  aqAuroraSky(ctx, L, rng, H) {
    for (let k = 0; k < 5; k++) {
      const y0 = 40 + k * 22 + rng() * 30, col = k % 2 ? 'rgba(160,110,255,' : 'rgba(80,255,170,';
      for (let x = 0; x < BG_W; x += 6) {
        const y = y0 + Math.sin(x * 0.006 + k * 1.7) * 26 + Math.sin(x * 0.019 + k) * 9, h = 60 + Math.sin(x * 0.011 + k * 3) * 30;
        const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, col + '0)'); g.addColorStop(0.3, col + '0.22)'); g.addColorStop(1, col + '0)');
        ctx.fillStyle = g; ctx.fillRect(x, y, 6, h);
      }
    }
  },
  // inside a station module: wall panels, pipes, round portholes with the aurora outside
  aqInterior(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 0; x < BG_W; x += 64) ctx.fillRect(x, 0, 2, H);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 40; y < H; y += 120) ctx.fillRect(0, y, BG_W, 3);
    ctx.fillStyle = '#7a8692'; ctx.fillRect(0, L.base - 230, BG_W, 10); ctx.fillStyle = '#b8402e'; ctx.fillRect(0, L.base - 214, BG_W, 6);
    for (let x = 96; x < BG_W; x += 256) {
      const y = L.base - 120, g = ctx.createRadialGradient(x, y, 4, x, y, 30); g.addColorStop(0, '#2affa0'); g.addColorStop(0.5, '#0a3a4a'); g.addColorStop(1, '#06121e');
      ctx.fillStyle = '#9aa4b0'; ctx.beginPath(); ctx.arc(x, y, 34, 0, TAU); ctx.fill(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 27, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(x - 9, y - 9, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c8d0d8'; ctx.fillRect(x + 90, y - 40, 40, 54); ctx.fillStyle = '#3a6ad8'; ctx.fillRect(x + 94, y - 36, 32, 20); ctx.fillStyle = '#e8422a'; ctx.fillRect(x + 94, y - 12, 32, 4);
    }
  },
  // the blizzard over the shelf: low drifts and blown snow banks
  aqDrifts(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 12) ctx.lineTo(x, L.base - 18 - Math.sin(x / BG_W * TAU * 3) * 14 - Math.sin(x / BG_W * TAU * 7 + 1) * 6);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 18; k++) { const x = rng() * BG_W; wrapDraw(x, 60, xx => { ctx.beginPath(); ctx.ellipse(xx + 30, L.base - 10 + rng() * 20, 30 + rng() * 20, 4, 0, 0, TAU); ctx.fill(); }); }
  }
};
Object.assign(BGPaint, painters);
const strip = (atlas, id, f, shift, fallback) => ({ kind: 'image', atlas, id, f, base: fallback.base, color: fallback.color, fallback, shift: shift || 0, dyn: fallback.dyn });
const T_ = {};
const shelf = THEMES.aq_shelf;
// 13-2: the shelf at night under the aurora (the aq_aurora atlas: two strips and its own snow floor)
T_.aq_aurora = Object.assign({}, shelf, {
  name: 'Upside-Down Pole', music: 'tour_aq_night', particles: 'snow', aurora: true, rays: null,
  sky: ['#04081a', '#0c1838', '#1a3050'], horizonGlow: '#3affa0', celestial: { type: 'moon', x: 0.8, y: 0.15, r: 16, color: '#f4f8ff', glow: '#a0ffd0' }, stars: 1, cloudsDyn: false,
  layers: [{ kind: 'mountains', color: '#1a2a44', base: 290, amp: 110, f: 0.03, snow: true }, { kind: 'aqShelf', color: '#2a4060', base: 360, f: 0.18 }],
  fog: '#3affa0', darkness: 0.18, decor: ['aqPenguins', 'aqFlag']
});
// 13-5: the shelf in a whiteout (borrows the shelf's strips, a grey sky, the blizzard streaks)
T_.aq_whiteout = Object.assign({}, shelf, {
  name: 'Egg Express', music: 'tour_aq', particles: 'snow', rays: null,
  sky: ['#8a9ab0', '#c0ccd8', '#eef2f6'], horizonGlow: '#ffffff', celestial: { type: 'none' }, stars: 0, cloudsDyn: false,
  layers: [
    strip('aq_shelf', 'L0', 0.03, 0, { kind: 'mountains', color: '#c8d4e4', base: 300, amp: 140, snow: true, blur: true, dyn: 'aqBlizzard' }),
    { kind: 'aqDrifts', color: '#e4ecf4', base: 340, f: 0.1 },
    strip('aq_shelf', 'L2', 0.2, 0, { kind: 'aqShelf', color: '#d8e8f8', base: 360 })
  ],
  fog: '#ffffff'
});
T_.aq_whiteout.atlas = 'aq_shelf';
if (typeof Atlas !== 'undefined') Atlas.applyTiles(T_.aq_whiteout, 'aq_shelf', { ground: 'ground' });
// interiors
const room0 = (b, over) => Object.assign({}, THEMES[caveVariant(b)], over);
T_.aq_igloo = room0('aq_shelf', { name: 'The Igloo', music: 'secret', sky: ['#4a7ab8', '#8ac0e8', '#c8e8ff'], darkness: 0, particles: 'snow', ground: Object.assign({}, shelf.ground, { style: 'snow' }) });
T_.aq_berg = room0('aq_shelf', { name: 'Inside the Berg', music: 'secret', sky: ['#0a3a6a', '#2a7ab8', '#7ac8f0'], darkness: 0, particles: 'snow' });
T_.aq_module = Object.assign({}, THEMES.aq_station, { name: 'Station Module', music: 'tour_aq_night', sky: ['#3a4652', '#4a5664', '#5a6674'], aurora: false, stars: 0, particles: null, layers: [{ kind: 'aqInterior', color: '#4e5a66', base: 380, f: 0.25 }], darkness: 0, celestial: { type: 'none' }, fog: '#8a96a4', decor: ['aqCrates', 'aqLamp'],
  ground: { style: 'metal', cap: '#c8d0d8', capHi: '#ffffff', dirt: '#8a96a4', dirt2: '#6a7684', rock: '#9aa4b0' } });
T_.aq_lab = Object.assign({}, T_.aq_module, { name: 'The Lab', music: 'secret', darkness: 0 });
T_.aq_icecave = room0('aq_storm', { name: 'Ice Cave', music: 'secret', sky: ['#06223a', '#1a5a8a', '#4aa0d0'], particles: 'snow' });
T_.aq_rookery = room0('aq_shelf', { name: 'The Rookery', music: 'secret', sky: ['#5a7a9a', '#9ab8d0', '#d8e8f4'], darkness: 0, particles: 'snow' });
Object.assign(THEMES, T_);

/* ================= decor and skins ================= */
// a small penguin, standing or on its belly (the friend and the decor draw the same bird)
const penguin = (ctx, x, y, t, s, belly, scarf) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (belly) { ctx.rotate(-Math.PI / 2 * 0.92); ctx.translate(0, 4); }
  ctx.rotate(Math.sin(t * 6) * (belly ? 0 : 0.12));
  ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.ellipse(0, -12, 8, 12, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(1.5, -10, 5, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffb81a'; ctx.beginPath(); ctx.moveTo(4, -19); ctx.lineTo(9, -18); ctx.lineTo(4, -17); ctx.fill(); ctx.fillRect(-4, -1, 4, 2); ctx.fillRect(1, -1, 4, 2);
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(3, -19, 1.2, 0, TAU); ctx.fill();
  if (scarf) { ctx.fillStyle = '#e8322a'; ctx.fillRect(-6, -17, 13, 3); ctx.beginPath(); ctx.moveTo(-5, -15); ctx.lineTo(-11, -9 + Math.sin(t * 9) * 2); ctx.lineTo(-7, -9); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.fillRect(-3, -17, 2, 3); ctx.fillRect(3, -17, 2, 3); }
  ctx.restore();
};
const skins = {
  // the igloo's door: a dark arch with a little sealskin flap
  aqIglooDoor(ctx, e, t) { const x = e.cx, y = e.y + e.h; ctx.fillStyle = '#1a3a5a'; ctx.beginPath(); ctx.ellipse(x, y, 15, 26, 0, Math.PI, TAU); ctx.fill(); ctx.fillStyle = '#7a6a5a'; ctx.fillRect(x - 9, y - 22, 18, 5 + Math.sin(t * 3) * 1); ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 16, 27, 0, Math.PI, TAU); ctx.stroke(); },
  // a station airlock: a round hatch in a red module wall
  aqAirlock(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#c8322a'; rr(ctx, x - 22, y - 60, 44, 60, 6); ctx.fill(); ctx.fillStyle = '#c8d0d8'; ctx.fillRect(x - 22, y - 60, 44, 6);
    ctx.fillStyle = '#5a6470'; rr(ctx, x - 13, y - 48, 26, 48, 9); ctx.fill(); ctx.fillStyle = '#8a96a4'; ctx.beginPath(); ctx.arc(x, y - 30, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = Math.floor(t * 2) % 2 ? '#3affa0' : '#1a8a5a'; ctx.beginPath(); ctx.arc(x + 16, y - 52, 2.5, 0, TAU); ctx.fill();
  },
  // the lab: a white door with a frosted window and a hand-written sign
  aqLabDoor(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    ctx.fillStyle = '#e8eef4'; rr(ctx, x - 14, y - 50, 28, 50, 4); ctx.fill(); ctx.strokeStyle = '#8a96a4'; ctx.lineWidth = 2; rr(ctx, x - 14, y - 50, 28, 50, 4); ctx.stroke();
    ctx.fillStyle = `rgba(160,230,255,${0.6 + 0.2 * Math.sin(t * 3)})`; rr(ctx, x - 8, y - 44, 16, 12, 3); ctx.fill();
    ctx.fillStyle = '#ffd890'; ctx.fillRect(x - 12, y - 64, 24, 11); ctx.fillStyle = '#3a2a2a'; ctx.font = `bold 7px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('LAB', x, y - 56);
  },
  // the gate to the floe: two ice pillars and a flag
  aqFloeGate(ctx, e, t) { const x = e.cx, y = e.y + e.h; for (const s of [-1, 1]) { ctx.fillStyle = '#d8f0ff'; ctx.beginPath(); ctx.moveTo(x + s * 22, y); ctx.lineTo(x + s * 16, y - 58); ctx.lineTo(x + s * 10, y); ctx.fill(); } ctx.fillStyle = '#0a2a4a'; rr(ctx, x - 11, y - 46, 22, 46, 10); ctx.fill(); ctx.fillStyle = '#e8422a'; ctx.beginPath(); ctx.moveTo(x, y - 70); ctx.lineTo(x + 16 + Math.sin(t * 6) * 2, y - 64); ctx.lineTo(x, y - 58); ctx.fill(); ctx.fillStyle = '#5a5a68'; ctx.fillRect(x - 1, y - 72, 2, 26); },
  // a snow wall a big snowball can smash
  aqSnowWall(ctx, e, t) {
    const x = e.x, y = e.y, w = e.w, h = e.h;
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b8d4ec');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 6, y + h); ctx.lineTo(x - 2, y + 6); ctx.quadraticCurveTo(x + w / 2, y - 8, x + w + 2, y + 6); ctx.lineTo(x + w + 6, y + h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(90,140,190,0.6)'; ctx.lineWidth = 1.2; for (let k = 1; k < h / 16; k++) { ctx.beginPath(); ctx.moveTo(x - 2, y + k * 16); ctx.lineTo(x + w + 2, y + k * 16 - 3); ctx.stroke(); }
    ctx.fillStyle = '#1a3a5a'; ctx.font = `bold 8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('◉', x + w / 2, y - 4 + Math.sin(t * 4) * 1.5);
  },
  // the aurora's flip line: green and violet ribbons instead of painted lines
  aqAuroraLine(ctx, e, t) {
    const g = e.g, y0 = g.camY - 20, y1 = g.camY + Game.viewH + 20;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(90,255,170,0.05)'; ctx.fillRect(e.x, y0, e.w, y1 - y0);
    for (const [x, col] of [[e.x, '90,255,170'], [e.x + e.w, '170,120,255']]) {
      for (let k = 0; k < 3; k++) {
        const xx = x + Math.sin(t * 1.4 + k * 2) * 5 + (k - 1) * 4;
        const gr = ctx.createLinearGradient(xx - 10, 0, xx + 10, 0); gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(0.5, `rgba(${col},${0.35 + 0.15 * Math.sin(t * 3 + k)})`); gr.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = gr; ctx.fillRect(xx - 10, y0, 20, y1 - y0);
      }
      ctx.fillStyle = `rgba(${col},0.9)`; for (let y = y0 - ((t * 50) % 56); y < y1; y += 56) { ctx.beginPath(); ctx.moveTo(x - 6, y + 10); ctx.lineTo(x, y); ctx.lineTo(x + 6, y + 10); ctx.lineTo(x, y + 5); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
  },
  // a crack in a hanging iceberg's foot, cold puffs drifting out of it
  aqBergCrack(ctx, e, t) {
    const x0 = e.x, y0 = e.y - TS, w = e.w, h = e.h + TS, x = e.cx, y = e.y + e.h;
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, '#f0fcff'); g.addColorStop(0.6, '#a8d8f4'); g.addColorStop(1, '#5a9ad0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + w, y0); ctx.lineTo(x0 + w - 4, y); ctx.lineTo(x0 + 4, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2a5a8a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + 4, y); ctx.moveTo(x0 + w, y0); ctx.lineTo(x0 + w - 4, y); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,60,110,0.75)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 1, y0 + 6); ctx.lineTo(x + 4, y - 70); ctx.lineTo(x - 3, y - 48); ctx.lineTo(x + 3, y - 24); ctx.lineTo(x, y - 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 4, y - 70); ctx.lineTo(x + 12, y - 66); ctx.moveTo(x - 3, y - 48); ctx.lineTo(x - 10, y - 44); ctx.stroke();
  },
  // a snow drift with a gap behind it (the rookery's curtain): it sags open when Brady walks in
  aqDrift(ctx, e, t) {
    const x0 = e.x, y0 = e.y, w = e.w, h = e.h, a = 1 - (e.part || 0) * 0.7;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#f4faff'; ctx.beginPath(); ctx.moveTo(x0 - 10, y0 + h); ctx.quadraticCurveTo(x0 + w * 0.2, y0 - 6, x0 + w * 0.6, y0 + 4); ctx.quadraticCurveTo(x0 + w + 6, y0 + 10, x0 + w + 10, y0 + h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(150,190,230,0.45)'; ctx.beginPath(); ctx.ellipse(x0 + w / 2, y0 + h - 10, w / 2, 9, 0, 0, TAU); ctx.fill();
    ctx.restore();
    for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x0 + w * 0.7 + ph * 20, y0 + 6 - ph * 18, 3 + ph * 4, 0, TAU); ctx.fill(); }
  },
  // the icicle curtain in front of the ice cave
  aqIcicles(ctx, e, t) {
    const x0 = e.x, y0 = e.y, w = e.w, h = e.h, a = 1 - (e.part || 0) * 0.7;
    ctx.save(); ctx.globalAlpha = a;
    for (let k = 0; k < 9; k++) { const x = x0 + 3 + k * (w - 6) / 8, len = h * (0.55 + ((k * 37) % 10) / 22); const g = ctx.createLinearGradient(x - 4, 0, x + 4, 0); g.addColorStop(0, '#f0faff'); g.addColorStop(1, '#8ac8f0'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 4, y0); ctx.lineTo(x + 4, y0); ctx.lineTo(x + Math.sin(t + k) * (e.part || 0) * 4, y0 + len); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    if (Math.floor(t * 3) % 4 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x0 + w * 0.3, y0 + h * 0.6 + (t * 40) % 20, 1.5, 0, TAU); ctx.fill(); }
  },
  // the emperor penguins' nest stones: the egg sits in a ring of snow
  aqNest(ctx, e, t) {
    const x = e.cx, y = e.y + e.h;
    if (!(typeof Atlas !== 'undefined' && Atlas.draw(ctx, AQX, 'pedestal_idle_000', x, y, 1, { scale: 1 }))) {
      Ink.around(ctx, e.x - 6, e.y - 4, e.w + 12, e.h + 6, c => { c.fillStyle = '#d8e8f8'; c.beginPath(); c.ellipse(x, y - 8, 17, 8, 0, 0, TAU); c.fill(); c.fillStyle = '#b8d0e8'; c.beginPath(); c.ellipse(x, y - 10, 11, 4, 0, 0, TAU); c.fill(); c.fillStyle = '#8a96a4'; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(x - 14 + k * 7, y - 3, 3, 0, TAU); c.fill(); } }, { pad: 6 });
    }
    if (e.deliver) { ctx.fillStyle = e.done ? '#7ae07a' : `rgba(255,216,74,${0.6 + 0.4 * Math.sin(t * 4)})`; ctx.beginPath(); K.star(ctx, x, y - 40, 5, 2.2, 5); ctx.fill(); }
    if (e.has) TourCarryArt.draw(ctx, e.item, x, y - 12, t);
  },
  aqNone() {}
};
// the egg Brady carries: the atlas egg, the procedural one as the fallback
{
  const d0 = TourCarryArt.draw;
  TourCarryArt.draw = function (ctx, item, x, y, t) {
    if (item === 'aqEgg') {
      if (typeof Atlas !== 'undefined' && Atlas.draw(ctx, AQX, 'egg_idle_000', x, y, 1, { scale: 1 })) return;
      Ink.around(ctx, x - 10, y - 22, 20, 24, c => { const g = c.createRadialGradient(x - 3, y - 13, 1, x, y - 10, 11); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d8d0c0'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y - 10, 7.5, 10, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(160,140,110,0.5)'; c.beginPath(); c.arc(x + 3, y - 6, 1.4, 0, TAU); c.arc(x - 2, y - 13, 1.1, 0, TAU); c.fill(); }, { pad: 5 });
      return;
    }
    return d0.call(this, ctx, item, x, y, t);
  };
}
Object.assign(Decor, {
  // the igloo itself (the door is the portal in front of it)
  aqIgloo(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h;
    Ink.around(ctx, x - w / 2 - 8, y - h - 8, w + 16, h + 10, c => {
      const g = c.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c8dcf0'); c.fillStyle = g;
      c.beginPath(); c.ellipse(x, y, w / 2, h, 0, Math.PI, TAU); c.fill();
      c.strokeStyle = 'rgba(120,160,200,0.55)'; c.lineWidth = 1.2;
      for (let r = 1; r < 4; r++) { const yy = y - r * h / 4; const half = Math.sqrt(Math.max(0, 1 - Math.pow(r / 4, 2))) * w / 2; c.beginPath(); c.moveTo(x - half, yy); c.lineTo(x + half, yy); c.stroke(); for (let k = -3; k <= 3; k++) { const bx = x + k * 18 + (r % 2) * 9; if (Math.abs(bx - x) < half - 4) { c.beginPath(); c.moveTo(bx, yy); c.lineTo(bx, yy + h / 4); c.stroke(); } } }
    }, { pad: 4 });
  },
  // a snow drift (its body is solid): a rounded white hump
  aqMound(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h;
    Ink.around(ctx, x - w / 2 - 14, y - h - 10, w + 28, h + 12, c => { const g = c.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c8dcf0'); c.fillStyle = g; c.beginPath(); c.moveTo(x - w / 2 - 12, y + 2); c.quadraticCurveTo(x - w / 2, y - h - 6, x, y - h - 4); c.quadraticCurveTo(x + w / 2, y - h - 6, x + w / 2 + 12, y + 2); c.closePath(); c.fill(); c.fillStyle = 'rgba(150,190,230,0.45)'; c.beginPath(); c.ellipse(x + 8, y - h * 0.35, w * 0.3, h * 0.25, 0, 0, TAU); c.fill(); }, { pad: 4 });
  },
  // the ice serac over a snow wall (the wall is the snow choking the gap under it)
  aqSeracTop(ctx, x, y, t, th, d) {
    const h = d.h, top = y - h;
    const g = ctx.createLinearGradient(x - 26, 0, x + 26, 0); g.addColorStop(0, '#f0fcff'); g.addColorStop(0.55, '#b8e0f8'); g.addColorStop(1, '#6aa8d8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 20, y + 4); ctx.lineTo(x - 26, top + h * 0.45); ctx.lineTo(x - 14, top + 6); ctx.lineTo(x - 4, top - 10); ctx.lineTo(x + 10, top + 2); ctx.lineTo(x + 24, top + h * 0.35); ctx.lineTo(x + 20, y + 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2a5a8a'; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fillRect(x - 16, top + 14, 3, h * 0.5); ctx.fillRect(x - 6, top + 4, 2, h * 0.3);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x - 2, top - 2, 14, 5, -0.2, 0, TAU); ctx.fill();
  },
  // an iceberg hanging from the sky in the aurora (its body is solid)
  aqHangBerg(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2, top = y - h;
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, '#e8faff'); g.addColorStop(1, '#7ab8e0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 - 4, top); ctx.lineTo(x0 + w + 4, top); ctx.lineTo(x0 + w, y - 8); ctx.lineTo(x0 + w * 0.55, y + 6); ctx.lineTo(x0, y - 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2a5a8a'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x0 + 4, top + 6, 3, h - 18);
  },
  // the great berg the secret door hides in: hangs from the sky down to the snow
  aqBigBerg(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2, top = y - h;
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, '#f0fcff'); g.addColorStop(0.6, '#a8d8f4'); g.addColorStop(1, '#5a9ad0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 - 10, top); ctx.lineTo(x0 + w + 10, top); ctx.lineTo(x0 + w + 2, y - h * 0.4); ctx.lineTo(x0 + w - 4, y); ctx.lineTo(x0 + 4, y); ctx.lineTo(x0 - 2, y - h * 0.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2a5a8a'; ctx.lineWidth = 1.8; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 3; k++) ctx.fillRect(x0 + 8 + k * 12, top + 10 + k * 20, 3, h * 0.35);
  },
  // an emperor penguin parent, waiting for the egg
  aqEmperor(ctx, x, y, t) { penguin(ctx, x, y, t * 0.5, 2.1, false); ctx.fillStyle = '#ffb81a'; ctx.beginPath(); ctx.ellipse(x + 2, y - 36, 4, 2, 0.4, 0, TAU); ctx.fill(); },
  // a huddle of emperor penguins (the rookery)
  aqHuddle(ctx, x, y, t) { for (let k = 0; k < 5; k++) penguin(ctx, x - 26 + k * 13, y, t * 0.6 + k, 1.4 + (k % 2) * 0.25, false); },
  // the snow chute on an arena wall (the Snow-Plough Bot's second wall comes out of it)
  aqChute(ctx, x, y, t, th, d) { ctx.fillStyle = '#5a6470'; rr(ctx, x - 14, y - 72, 28, 18, 4); ctx.fill(); ctx.fillStyle = '#1a2028'; rr(ctx, x - 9, y - 66, 18, 10, 3); ctx.fill(); ctx.fillStyle = '#e8422a'; ctx.fillRect(x - 14, y - 74, 28, 4); ctx.fillStyle = '#e8f6ff'; ctx.beginPath(); ctx.ellipse(x, y - 54, 8, 3, 0, 0, TAU); ctx.fill(); },
  // a station sign over the way in
  aqStationSign(ctx, x, y, t) { ctx.fillStyle = '#5a5a68'; ctx.fillRect(x - 40, y - 74, 3, 74); ctx.fillRect(x + 37, y - 74, 3, 74); ctx.fillStyle = '#c8322a'; rr(ctx, x - 46, y - 92, 92, 22, 4); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('AURORA STATION', x, y - 77); ctx.fillStyle = Math.floor(t * 2) % 2 ? '#3affa0' : '#1a6a4a'; ctx.beginPath(); ctx.arc(x - 38, y - 96, 3, 0, TAU); ctx.arc(x + 38, y - 96, 3, 0, TAU); ctx.fill(); },
  aqNone() {}
});

/* ================= the cast: the conga line, krill, the egg skua ================= */
// procedural fallbacks (the aq_x atlas draws them once it is in)
const congaArt = (ctx, e, x, y, m, t) => {
  if (m === 'flat' || m === 'ko') { ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, m === 'flat' ? 0.5 : 1); penguin(ctx, 0, 0, t, 1.1, false, e.lead); ctx.restore(); return; }
  ctx.save(); ctx.translate(x, y - 2); ctx.scale(-(e.dir || 1), 1); penguin(ctx, -4, 0, t, 1.1, true, e.lead); ctx.restore();
};
const krillArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1);
  ctx.fillStyle = '#ff8aa8'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffb8c8'; ctx.beginPath(); ctx.ellipse(-2, -1, 4, 2, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#e85a7a'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-4 + k * 2.5, 3); ctx.lineTo(-5 + k * 2.5 + Math.sin(t * 20 + k) * 1.5, 7); ctx.stroke(); }
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(6, -1, 1.2, 0, TAU); ctx.fill();
  ctx.restore();
};
/* a follower of a line (conga penguin, krill): it rides the leader's trail `gap` samples per place behind it; one hit
   knocks it out; when the leader goes, they all scatter */
class AqTrailer extends Ent {
  constructor(g, lead, k, o) { super(g, null, o.w, o.h); this.lead = lead; this.k = k; this.enemy = true; this.clip = o.clip; this.art = o.art; this.gap = o.gap; this.fly = !!o.fly; this.x = lead.x; this.y = lead.y; this.dir = lead.dir; this.cfg = lead.cfg; }
  update(dt) {
    this.t += dt; if (this.knocked) return this.updateKnocked(dt);
    if (this.scatter) { this.vy = (this.vy || -6 * TS) + PHYS.gDown * 0.6 * dt; this.x += (this.k % 2 ? 1 : -1) * 4 * TS * dt; this.y += this.vy * dt; if (this.y > this.g.area.H * TS + 60 || !this.g.onScreen(this, 300)) this.remove = true; return; }
    const P = this.lead.trail || [], i = Math.min(P.length - 1, (this.k + 1) * this.gap);
    if (i >= 0 && P[i]) { this.x = P[i][0] - this.w / 2; this.y = this.fly ? P[i][1] - this.h / 2 : P[i][1] - this.h; this.dir = P[i][2]; }
    if (this.lead.remove || this.lead.dead || this.lead.knocked) { this.scatter = true; this.vy = -7 * TS; }
  }
  hit(kind, src) { if (this.dead) return false; this.knockOff(src && src.vx ? sign(src.vx) : 1); return true; }
  touchPlayer(p) { if (!this.dead && !this.scatter && !this.knocked) p.hurt(this); }
  draw(ctx) {
    const fx = this.cx, fy = this.fly ? this.cy : this.y + this.h, mode = this.knocked ? 'ko' : 'walk';
    if (this.knocked) { ctx.save(); ctx.translate(this.cx, this.cy); ctx.rotate(Math.PI + (this.spin || 0)); ctx.translate(-this.cx, -this.cy); }
    if (!atlasDraw(ctx, this.clip, this.t, fx, fy, this.dir)) Ink.ent(ctx, this, c => { c.save(); c.translate(fx, fy); c.scale(ART_SCALE.enemy, ART_SCALE.enemy); c.translate(-fx, -fy); this.art(c, this, fx, fy, mode, this.t); c.restore(); });
    if (this.knocked) ctx.restore();
  }
}
// the leader keeps a trail of points (one every 3 px it moves), pre-filled behind it so the line starts in formation
const trail = (e, fy) => {
  const pt = [e.cx, fy, e.dir];
  if (!e.trail) { e.trail = []; for (let k = 0; k < 120; k++) e.trail.push([pt[0] - e.dir * k * 3, fy, e.dir]); }
  const last = e.trail[0]; if (Math.hypot(pt[0] - last[0], pt[1] - last[1]) >= 3) { e.trail.unshift(pt); if (e.trail.length > 160) e.trail.pop(); }
};
/* the headline: aqPenguin conga lines. The leader in the scarf belly-slides along its ice sheet and the line follows
   exactly where it went; every follower hurts to touch and falls to one hit; stomp the leader and the line scatters */
TourBehave.aqConga = {
  think(e, dt) {
    e.lead = true;
    if (!e.followers) { e.followers = []; const n = TB.par(e, 'n', 4); for (let k = 0; k < (e.s.n || n); k++) { const F = new AqTrailer(e.g, e, k, { w: 26, h: 16, clip: 'conga/walk', art: congaArt, gap: 10 }); e.followers.push(F); e.g.spawn(F); } }
    trail(e, e.y + e.h);
    e.mode = 'walk'; if (!e.vx) e.vx = e.dir * e.speed;
    if (e.onGround && Math.random() < 0.15) e.g.burst(e.cx - e.dir * 14, e.y + e.h, 1, '#e8faff', 'dust');
  },
  hit(e, kind) { if (e.followers) for (const f of e.followers) { f.scatter = true; f.vy = -7 * TS; } if (kind === 'stomp' || kind === 'spin') e.g.parts.text(e.cx, e.y - 14, 'CONGA OVER!', '#bfe8ff'); return undefined; }
};
/* aqKrill: a pink krill cloud. The leader swims a slow figure of eight around its spot and eight krill trail it, so the
   cloud keeps changing shape (a ring, a ribbon, an eight). Stomp or puff the leader (the brightest) to scatter it */
TourBehave.aqKrill = {
  think(e, dt) {
    if (!e.followers) { e.followers = []; for (let k = 0; k < TB.par(e, 'n', 8); k++) { const F = new AqTrailer(e.g, e, k, { w: 14, h: 10, clip: 'krill/fly', art: krillArt, gap: 5, fly: true }); e.followers.push(F); e.g.spawn(F); } }
    e.noWalk = true; e.vx = 0; e.vy = 0; e.mode = 'fly';
    const a = e.t * 0.9, r = TB.par(e, 'r', 2.4) * TS;
    const nx = e.hx0 + Math.sin(a) * r * 1.4 - e.w / 2, ny = e.hy0 + Math.sin(a * 2) * r * 0.6;
    e.dir = sign(nx - e.x) || e.dir; e.x = nx; e.y = ny;
    trail(e, e.cy);
  },
  hit(e, kind) { if (e.followers) for (const f of e.followers) { f.scatter = true; f.vy = -5 * TS; } return undefined; }
};
// the egg skua (13-5): it swoops at Brady; carrying the egg, the swoop snatches it (the egg goes back to its nest
// stone, no hurt); not carrying, it pinches up to 5 coins and flies off laughing. Any hit while it flees returns them.
const Skua0 = ENTITY_TYPES.aqSkua;
class AqEggSkua extends Skua0 {
  touchPlayer(p) {
    if (this.dead || this.knocked || p.dead) return;
    if (this.fleeT > 0) return;
    if (p.carrying) { p.dropCarry('SNATCHED!'); }
    else { const n = Math.min(5, this.g.picks); this.g.picks -= n; Save.data.picks = this.g.picks; this.loot = n; if (n) this.g.parts.text(this.cx, this.y - 10, '-' + n, '#ffd84a'); }
    K.sfx('laugh', 'select', { vol: 0.5, pitch: 1.4 }); this.g.parts.text(this.cx, this.y - 22, 'SKRAA!', '#ffd8a0');
    this.fleeT = 2.2; this.state = 'drift'; this.cool = 4;
  }
  update(dt) {
    if (this.fleeT > 0 && !this.knocked && !this.dead) { this.t += dt; this.fleeT -= dt; this.y -= 3 * TS * dt; this.x += this.dir * 2 * TS * dt; this.mode = 'fly'; if (this.fleeT <= 0) { this.hy = Math.max(this.y, this.hy - 3 * TS); this.hx = this.x; } return; }
    return super.update(dt);
  }
  hit(kind, src) { if (this.loot) { for (let k = 0; k < this.loot; k++) this.g.addPick(this.cx, this.cy); this.loot = 0; } return super.hit(kind, src); }
}
const enemies = {
  aqConga: { cls: TourEnemy.make({ w: 30, h: 18, speed: 1.6, behavior: 'aqConga', n: 4, atlas: AQX, sprite: 'congaLead', art: congaArt, burst: '#ffffff', edgeTurn: true }), place: 'walk' },
  aqKrill: { cls: TourFlyer.make({ w: 18, h: 12, speed: 0.9, behavior: 'aqKrill', n: 8, r: 2.4, atlas: AQX, sprite: 'krill', art: krillArt, burst: '#ff8aa8' }), place: 'fly' },
  aqEggSkua: { cls: AqEggSkua, place: 'fly' }
};
for (const k in enemies) { ENTITY_TYPES[k] = enemies[k].cls; Tour.enemyInfo[k] = { place: enemies[k].place, country: 'aq' }; }

/* ================= objects ================= */
// a heap of snow that always has a snowball ready: when the ball is lost (a hole, the sea) a new one rolls out
class AqSnowPile extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 20); this.friendly = true; this.ball = null; this.wait = 1; this.back = true; }
  update(dt) {
    this.t += dt; const b = this.ball, g = this.g;
    if (!b || b.remove || b.y > g.area.H * TS) {
      this.wait += dt;
      if (this.wait > 1.2) { this.wait = 0; const B = new ENTITY_TYPES.tourBall(g, { x: this.cx, y: this.y + this.h, kind: 'snow', r: 0.6, maxScale: 2.2 }); g.spawn(B); this.ball = B; g.burst(this.cx, this.y + 4, 10, '#ffffff', 'dust'); }
    }
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h;
    Ink.around(ctx, this.x - 8, this.y - 8, this.w + 16, this.h + 10, c => { c.fillStyle = '#f4faff'; c.beginPath(); c.ellipse(x, y, 34, 20, 0, Math.PI, TAU); c.fill(); c.fillStyle = 'rgba(150,190,230,0.5)'; c.beginPath(); c.ellipse(x + 10, y - 4, 16, 6, 0, 0, TAU); c.fill(); }, { pad: 4 });
    penguin(ctx, x - 26, y, this.t, 0.9, false);
  }
}
// the Station Store's keeper: a penguin in a woolly hat behind the counter
class AqKeeper extends Ent {
  constructor(g, s) { super(g, s, 30, 44); this.friendly = true; this.waveT = 0; }
  update(dt) { this.t += dt; const p = this.g.player; if (p && Math.abs(p.cx - this.cx) < 3 * TS) this.waveT = 1; else this.waveT = Math.max(0, this.waveT - dt); }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, clip = this.waveT > 0 ? 'keeper/wave' : 'keeper/idle';
    if (atlasDraw(ctx, clip, this.t, x, y, -1, 1.2)) return;
    Ink.around(ctx, this.x - 10, this.y - 16, this.w + 20, this.h + 18, c => { penguin(c, x, y, this.t, 1.9, false); c.fillStyle = '#e8422a'; c.beginPath(); c.arc(x, y - 44, 8, Math.PI, TAU); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y - 53, 3, 0, TAU); c.fill(); }, { pad: 6 });
  }
}
AqKeeper.cfg = { atlas: AQX };
// a crevasse-side icicle (13-4's lead-in): the same icicle as in Big Tusk's hall, but it knocks out whatever it lands on
class AqLeadIcicle extends ENTITY_TYPES.aqIcicle {
  update(dt) {
    super.update(dt);
    if (this.state === 'fall') for (const e of this.g.entities) if (e.enemy && !e.boss && !e.dead && !e.remove && overlap(this, e)) { e.hit('bump', this); this.g.addScore(400, e.cx, e.y); this.shatter(); break; }
  }
}
// the banner over a fort's way in, shown once as Brady walks under it
class AqBanner extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, 6 * TS); this.text = s.text; this.done = false; this.friendly = true; }
  update(dt) { this.t += dt; const p = this.g.player; if (!this.done && p && p.cx > this.x) { this.done = true; this.g.bannerText = this.text; this.g.bannerT = 2.2; } }
}

/* ---------------- the mini-boss: the SNOW-PLOUGH BOT (13-3) ---------------- */
// it shoves a growing wall of snow across the floor at Brady (jump it; at three rows high the ledges help); after
// three shoves it overheats: steam, a red-hot exhaust hatch for a moment: stomp it. Phase 2 (after the first hit):
// the snow chute on the far wall fires a second wall back the other way, and the walls grow three rows high (the
// ledges ride over them). Finish: it melts all the snow into a puddle and sits in it, steaming.
class AqSnowWall extends Ent {
  constructor(g, x, floorY, dir, o) { super(g, null, 30, TS); this.x = x - 15; this.floorY = floorY; this.y = floorY - TS; this.dir = dir; this.rows = 0.6; this.max = o.max || 2; this.sp = o.speed || 4.6 * TS; this.x0 = o.x0; this.x1 = o.x1; this.aqWall = true; }
  update(dt) {
    this.t += dt; this.rows = Math.min(this.max, this.rows + dt * 1.8); this.h = this.rows * TS; this.y = this.floorY - this.h;
    this.x += this.dir * this.sp * dt;
    if (Math.random() < 0.5) this.g.burst(this.cx - this.dir * 10, this.floorY - 4, 1, '#ffffff', 'dust');
    if ((this.dir > 0 && this.x + this.w >= this.x1 - 4) || (this.dir < 0 && this.x <= this.x0 + 4)) { this.remove = true; this.g.burst(this.cx, this.floorY - this.h / 2, 24, '#ffffff', 'dust'); this.g.shake(3); Sound.play('crumble', { vol: 0.5 }); }
  }
  touchPlayer(p) { if (p.dead) return; if (overlap({ x: this.x + 4, y: this.y + 8, w: this.w - 8, h: this.h - 8 }, p)) p.hurt(this); }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, d = this.dir, fx = d > 0 ? x + w : x, bx = d > 0 ? x : x + w;
    Ink.around(ctx, x - 20, y - 14, w + 40, h + 16, c => {
      const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#e4f0fa'); g.addColorStop(1, '#a8c8e4'); c.fillStyle = g;
      // a rolling bank of snow: a long tail behind, a curling crest in front
      c.beginPath(); c.moveTo(bx - d * 18, y + h); c.quadraticCurveTo(bx - d * 6, y + h * 0.2, x + w / 2, y);
      c.quadraticCurveTo(fx + d * 10, y - 4, fx + d * 8, y + h * 0.3); c.quadraticCurveTo(fx + d * 2, y + h * 0.4, fx + d * 4, y + h * 0.55); c.lineTo(fx + d * 6, y + h); c.closePath(); c.fill();
      c.fillStyle = 'rgba(140,180,220,0.5)'; c.beginPath(); c.ellipse(x + w / 2 - d * 4, y + h * 0.55, w * 0.3, h * 0.2, 0, 0, TAU); c.fill();
    }, { pad: 4 });
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; for (let k = 0; k < 5; k++) { const ph = (this.t * 2 + k / 5) % 1; ctx.beginPath(); ctx.arc(fx + d * (4 + ph * 16), y + 6 - ph * 16 + k * 2, 2 + ph * 2.5, 0, TAU); ctx.fill(); }
  }
}
const ploughArt = (ctx, b, t) => {
  const P = b.pose, d = b.dir, x = b.cx, y = b.y + b.h, hot = P === 'hot', melt = b.act === 'melt' ? Math.min(1, b.at / 1.6) : 0;
  ctx.save(); ctx.translate(x, y + melt * 10); ctx.scale(d, 1);
  if (P === 'rev' || hot) ctx.translate(Math.sin(t * 50) * 1.2, 0);
  if (P === 'reel') ctx.rotate(-0.12 * Math.sin(b.at * 14) * Math.max(0, 1 - b.at));
  // tracks
  ctx.fillStyle = '#2a2a34'; rr(ctx, -34, -14, 64, 14, 7); ctx.fill();
  ctx.fillStyle = '#5a5a68'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(-26 + k * 12, -7, 4, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 1; for (let k = 0; k < 8; k++) { const px = -32 + ((k * 8 + (b.vx ? t * 60 * d : 0)) % 64 + 64) % 64; ctx.beginPath(); ctx.moveTo(px, -14); ctx.lineTo(px, -12); ctx.stroke(); }
  // body and cab
  ctx.fillStyle = hot ? '#ff5a3a' : '#e8422a'; rr(ctx, -30, -38, 46, 26, 5); ctx.fill();
  ctx.fillStyle = '#c8d0d8'; rr(ctx, -16, -52, 26, 16, 4); ctx.fill();
  ctx.fillStyle = '#1a2a3a'; rr(ctx, -10, -49, 17, 10, 3); ctx.fill();
  // two round eye-lamps in the cab window
  ctx.fillStyle = hot ? '#ff4a3a' : P === 'rev' ? '#ffd890' : '#3affa0'; ctx.beginPath(); ctx.arc(-4, -44, 2.6, 0, TAU); ctx.arc(3, -44, 2.6, 0, TAU); ctx.fill();
  // the exhaust stack at the back, its hatch glowing red when it overheats
  ctx.fillStyle = '#5a5a68'; ctx.fillRect(-27, -58, 7, 22);
  ctx.fillStyle = hot ? `rgba(255,${80 + 60 * Math.sin(t * 20)},40,1)` : '#3a3a44'; rr(ctx, -30, -62, 13, 6, 2); ctx.fill();
  // the blade
  const lower = P === 'plough' ? 4 : P === 'rev' ? 2 : 0;
  ctx.fillStyle = '#9aa4b0'; ctx.beginPath(); ctx.moveTo(18, -34 + lower); ctx.quadraticCurveTo(36, -26 + lower, 34, -2); ctx.lineTo(26, -2); ctx.quadraticCurveTo(26, -22 + lower, 14, -30 + lower); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd84a'; for (let k = 0; k < 3; k++) ctx.fillRect(24 + k * 2, -24 + k * 7 + lower, 6, 3);
  // a headlight
  ctx.fillStyle = '#fff8d0'; ctx.beginPath(); ctx.arc(14, -30, 3, 0, TAU); ctx.fill();
  if (P === 'reel' || melt) K.dizzy(ctx, -2, -64, t);
  ctx.restore();
  // steam and smoke
  if (hot || melt) for (let k = 0; k < 5; k++) { const ph = (t * 0.9 + k / 5) % 1; ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x - d * 23 + Math.sin(k + t * 3) * 6, b.y - 14 - ph * 40, 5 + ph * 9, 0, TAU); ctx.fill(); }
  else if (P === 'rev') for (let k = 0; k < 3; k++) { const ph = (t * 3 + k / 3) % 1; ctx.fillStyle = `rgba(80,80,90,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x - d * 23, b.y - 12 - ph * 26, 4 + ph * 6, 0, TAU); ctx.fill(); }
  if (P === 'rev') { ctx.fillStyle = '#ffffff'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('VROOM', x, b.y - 24 - Math.abs(Math.sin(t * 20)) * 3); }
  if (hot) { ctx.fillStyle = '#ffd84a'; ctx.font = `bold 11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('▼ HOT!', x - d * 23, b.y - 30 + Math.sin(t * 8) * 3); }
  if (melt) { ctx.fillStyle = `rgba(150,210,255,${0.5 + 0.3 * melt})`; ctx.beginPath(); ctx.ellipse(x, b.floorY - 2, 30 + melt * 40, 5 + melt * 3, 0, 0, TAU); ctx.fill(); }
};
const plough = {
  id: 'aq_plough', name: 'Snow-Plough Bot', hp: 3, dims: [70, 46], music: 'tour_aq_boss', country: 'aq',
  brain: {
    guardText: 'CLANG!',
    phases: [2],
    noDisc() { return true; },
    wake(b) { b.pushes = 0; b.home = b.cx > (b.arenaX0 + b.arenaX1) / 2 ? 1 : -1; K.say(b.g, b, 'ROAD CLEARING IN PROGRESS!', '#ffd890'); b.g.toast('JUMP THE SNOW WALLS. WHEN IT OVERHEATS, STOMP ITS EXHAUST!'); },
    hit(b, kind, src) {
      if (b.act === 'melt') return false;
      if (kind === 'stomp' || kind === 'spin') { if (b.act === 'hot') { b.damage(1, { text: 'HISSSS!', col: '#ffb0a0' }); return true; } return 'bounce'; }
      if (kind === 'star') return undefined;
      return false;
    },
    // rising off the top after a bounce is never a hit; melting (and overheated) it is harmless
    touch(b, p) { if (b.act === 'melt') return true; if (p.vy < 0 && p.y + p.h < b.y + 12) return true; return false; },
    phase(b, n) { if (n === 2) { b.hurtT = 1.4; b.pushes = 0; b.g.bannerText = 'BOTH SNOW CHUTES!'; b.g.bannerT = 2; K.say(b.g, b, 'DOUBLE SHIFT!', '#ffd890'); b.go('reel'); } },
    lastHit(b) { if (b.act !== 'melt') { b.vuln = false; b.go('melt'); } return true; },
    hurt(b) { b.pushes = 0; K.say(b.g, b, pick(['WARNING: TOO WARM!', 'COOLANT! COOLANT!', 'BEEP. OUCH.']), '#ffd890'); b.go('reel'); },
    wall(b, x, dir) { const g = b.g, ph = b.phase || 1; g.spawn(new AqSnowWall(g, x, b.floorY, dir, { speed: (ph >= 2 ? 5 : 4.4) * TS, max: ph >= 2 ? 3 : 2, x0: b.arenaX0, x1: b.arenaX1 })); },
    update(b, dt) {
      const g = b.g, p = g.player, ph = b.phase || 1, mid = (b.arenaX0 + b.arenaX1) / 2;
      b.guard = 'bounce';
      if (b.act === 'melt') {
        b.vx = 0; b.pose = 'melt';
        if (b.first) { K.say(g, b, '...PUDDLE.', '#bfe8ff'); g.bannerText = 'MELTDOWN'; g.bannerT = 2; for (const e of g.entities) if (e.aqWall) { e.remove = true; g.burst(e.cx, e.cy, 16, '#bfe8ff', 'spark'); } }
        if (Math.random() < 0.3) g.burst(b.cx + (Math.random() - 0.5) * 60, b.floorY, 1, '#bfe8ff', 'spark');
        if (b.at > 3) b.die();
        b.fall(dt); return;
      }
      if (b.act === 'walk' || b.act === 'back') {
        // back to its own wall (it keeps to its side of the hangar), facing the middle
        const tx = b.home > 0 ? b.arenaX1 - b.w - 8 : b.arenaX0 + 8;
        b.pose = 'drive'; b.dir = -b.home; b.vx = Math.abs(tx - b.x) < 6 ? 0 : sign(tx - b.x) * 3.2 * TS;
        if (Math.abs(tx - b.x) < 6 || b.at > 3.5) b.go('rev');
      } else if (b.act === 'rev') {
        // the tell: the engine revs, black smoke, the blade drops (0.9 s)
        b.vx = 0; b.pose = 'rev'; b.dir = b.cx < mid ? 1 : -1;
        if (b.first) K.sfx('rev', 'bump', { vol: 0.5, pitch: 0.5 });
        if (b.at > 0.9) b.go('plough');
      } else if (b.act === 'plough') {
        b.pose = 'plough';
        if (b.first) { this.wall(b, b.cx + b.dir * (b.w / 2 + 12), b.dir); g.shake(4); Sound.play('crumble', { pitch: 0.7, vol: 0.6 }); b.second = ph >= 2 ? 0.8 : 0; }
        b.vx = b.at < 0.5 ? b.dir * 3.4 * TS : 0;
        if (b.second > 0 && (b.second -= dt) <= 0) { const far = b.dir > 0 ? b.arenaX1 - 2 * TS : b.arenaX0 + 2 * TS; this.wall(b, far, -b.dir); g.burst(far, b.floorY - 2.5 * TS, 20, '#ffffff', 'dust'); K.sfx('chute', 'crumble', { vol: 0.6 }); g.parts.text(far, b.floorY - 3.5 * TS, 'CHUTE!', '#ffffff'); }
        if (b.at > 1.2 && (b.at > 6 || !g.entities.some(e => e.aqWall && !e.remove))) { b.pushes++; b.go(b.pushes >= 3 ? 'hot' : 'back'); }
      } else if (b.act === 'hot') {
        // overheated: the weak moment
        b.vx = 0; b.pose = 'hot'; b.vuln = true; b.guard = 'hurt';
        if (b.first) { K.sfx('steam', 'splash', { vol: 0.6, pitch: 1.6 }); if (!b.toldHot) { b.toldHot = true; g.toast('IT OVERHEATED! STOMP THE EXHAUST!'); } }
        if (b.at > (ph >= 2 ? 2.8 : 3.2)) { b.pushes = 0; b.go('back'); }
      } else if (b.act === 'reel') {
        b.pose = 'reel'; b.vx = -b.dir * 2 * TS * Math.max(0, 1 - b.at);
        if (b.at > 1.2) b.go('back');
      } else b.go('back');
      b.fall(dt);
    },
    draw(b, ctx, t) { ploughArt(ctx, b, t); }
  }
};
Tour.boss(plough);
Object.assign(ENTITY_TYPES, { aqSnowPile: AqSnowPile, aqKeeper: AqKeeper, aqLeadIcicle: AqLeadIcicle, aqBanner: AqBanner });

/* ================= pieces ================= */
const icePool = (st, x0, x1) => { st.pit(x0, x1); st.B.fill(x0, st.gy + 2, x1, st.H - 1, T.LAVA); };
const P = {
  /* ---- shared ---- */
  // a headline enemy with a sign: { kind, text, n, len }
  meet(st, o) { const x = st.x, n = o.len || 10; st.floor(x, x + n - 1); if (o.text) st.sign(x + 1, o.text); for (let k = 0; k < (o.n || 1); k++) st.enemy(o.kind, x + 4 + k * 3, st.gy); st.coins(x + 3, x + n - 2, st.gy - 3); return x + n; },
  // a sheet of ice with a penguin conga line sliding on it: { len, n (followers), text }
  conga(st, o) {
    const x = st.x, n = o.len || 16, B = st.B; st.floor(x, x + n - 1);
    for (let q = 1; q < n - 1; q++) B.set(x + q, st.gy, T.ICE);
    if (o.text) st.sign(x + 1, o.text);
    st.enemy('aqConga', x + Math.floor(n * 0.4), st.gy, { n: o.n || 4, edgeTurn: true, dir: -1 });
    st.coins(x + 3, x + n - 3, st.gy - 4);
    if (o.gold) st.gold(x + Math.floor(n / 2), st.gy - 6, o.gold);
    return x + n;
  },
  /* ---- 13-1 ---- */
  // a snow heap with a ready snowball (a new one rolls out if it is lost): { text }
  snowPile(st, o) { const x = st.x, B = st.B; st.floor(x, x + 4); B.spawn('aqSnowPile', x + 2, st.gy - 1, {}); B.vkey('ball', [[x + 2, st.gy - 1]]); if (o.text) st.sign(x, o.text); return x + 5; },
  // a snow wall only a big rolling snowball smashes
  snowWall(st, o) {
    const x = st.x, h = o.h || 3, nx = Tour.pieces.breakwall(st, { needs: 'ball', h, skin: 'aqSnowWall' });
    const top = Math.max(0, st.gy - h - 6); st.B.prop('aqSeracTop', x + 2, top, 1, st.gy - h - top, 'body', {});
    if (o.gold) st.gold(nx - 3, st.gy - h - 3, o.gold); return nx;
  },
  // a change of height in place (a snow bank to hop up, or a drop): { h } (up is positive)
  bank(st, o) { const x = st.x; st.floor(x, x + 1); st.gy = clamp(st.gy - (o.h || 1), st.gyMin || 8, st.gyMax || 15); st.floor(x + 2, x + 3); return x + 4; },
  // downhill: n one-tile drops (a kicked snowball rolls on down them)
  slope(st, o) {
    let x = st.x; const n = o.n || 3;
    for (let k = 0; k < n; k++) { st.floor(x, x + 2); if (k % 2 === 0) st.coins(x, x + 2, st.gy - 2); x += 3; st.gy = clamp(st.gy + 1, st.gyMin || 8, st.gyMax || 15); }
    st.floor(x, x + 1); return x + 2;
  },
  // narrow ice holes (one tile: a snowball rolls over them, Brady jumps) where leopard seals pop up: { n, gold }
  sealHoles(st, o) {
    let x = st.x; const n = o.n || 3; st.floor(x, x + 2); x += 3;
    for (let k = 0; k < n; k++) {
      icePool(st, x, x); st.spawn('aqSeal', x, st.gy + 1, { delay: k * 0.7 });
      if (o.gold && k === Math.floor(n / 2)) st.gold(x, st.gy - 5, o.gold);
      x += 1; st.floor(x, x + 3); st.coins(x, x + 3, st.gy - 2); x += 4;
    }
    return x;
  },
  // an igloo with cold air puffing out of its door: the door leads in
  igloo(st, o) {
    const x = st.x, B = st.B; st.floor(x, x + 10);
    B.prop('aqIgloo', x + 2, st.gy - 3, 7, 3, 'none', {});
    B.spawn('portal', x + 5, st.gy - 1, { kind: 'door', look: 'aqIglooDoor', targetRef: o.to });
    B.spawn('tourDraft', x + 5, st.gy - 1, { look: 'painted', skin: 'aqNone' });
    if (o.back) B.anchor(o.back, x + 9, st.gy - 1);
    return x + 11;
  },
  // the finish: a flag on a snow bank
  flagGate(st, o) { const x = st.x; st.floor(x, x + 11); st.decor('aqFlag', x + 2); st.decor('aqPenguins', x + 9); st.B.spawn('gate', x + 6, st.gy - 1, { exit: o.exit || 'main' }); return x + 12; },
  /* ---- 13-2 ---- */
  // an aurora band: gravity turns over inside it; icebergs hang from the sky as steps on the ceiling:
  // { w, spikes, bergs: [[dx, len]], krill: dx, gold: [dx, row, kind] }
  aurora(st, o) {
    const x = st.x, w = o.w || 16, B = st.B;
    const nx = Tour.pieces.flipline(st, { w, spikes: o.spikes !== false, look: 'aqAuroraLine' });
    for (const [dx, len] of (o.bergs || [])) B.prop('aqHangBerg', x + 2 + dx, 2, 2, len, 'body', {});
    st.coins(x + 3, x + w, 3);
    if (o.krill != null) st.spawn('aqKrill', x + 2 + o.krill, 6, {});
    if (o.gold) st.gold(x + 2 + o.gold[0], o.gold[1], o.gold[2] || 'high');
    if (o.text) st.sign(x, o.text);
    return nx;
  },
  // a mid-air swap: leave one aurora band from the sky, fall a moment, and the next band catches you back up.
  // The floor below the gap is safe (the fallback): walk into the second band from the ground instead
  swap(st, o) {
    const x = st.x, B = st.B;
    Tour.pieces.flipline(st, { w: o.w1 || 10, spikes: true, look: 'aqAuroraLine' });
    st.coins(x + 3, x + (o.w1 || 10), 3);
    const x2 = x + (o.w1 || 10) + 2;
    st.x = x2; const nx = Tour.pieces.flipline(st, { w: o.w2 || 12, spikes: true, look: 'aqAuroraLine' });
    if (o.gold) st.gold(x2 + 1, 4, o.gold);
    if (o.bergs) for (const [dx, len] of o.bergs) B.prop('aqHangBerg', x2 + 2 + dx, 2, 2, len, 'body', {});
    st.coins(x2 + 3, x2 + (o.w2 || 12), 3);
    if (o.skua) st.spawn('aqSkua', x2, st.gy - 6, { range: 3 });
    return nx;
  },
  // the great berg reaching down to the snow, a crack and cold puffs at its foot: a way inside
  bigBerg(st, o) {
    const x = st.x, B = st.B;
    if (!st.ceil) B.fill(x, 0, x + 8, 1, T.GROUND);
    B.prop('aqBigBerg', x + 3, 2, 3, st.gy - 6, 'body', {});
    return Tour.pieces.secretDoor(st, { to: o.to, look: 'fake', skin: 'aqBergCrack', back: o.back });
  },
  /* ---- 13-3 ---- */
  // the station's way in: a sign arch and the FORT banner
  stationGate(st, o) { const x = st.x; st.floor(x, x + 7); st.decor('aqStationSign', x + 4); st.B.spawn('aqBanner', x + 4, st.gy - 1, { text: o.title || 'FORT: AURORA STATION' }); return x + 8; },
  // a mast with a postcard up top (P1)
  mastTop(st, o) { const x = st.x, nx = Tour.pieces['aq.mast'](st, {}); if (o.gold) st.gold(x + 3, st.gy - 11, o.gold); return nx; },
  /* ---- 13-4 ---- */
  // a sheet of ice with ice blocks to kick (they slide a long way and bowl over what they meet): { n, gold }
  kickRun(st, o) {
    const x = st.x, n = o.len || 18, B = st.B; st.floor(x, x + n - 1);
    for (let q = 1; q < n - 1; q++) B.set(x + q, st.gy, T.ICE);
    if (o.text) st.sign(x + 1, o.text);
    st.spawn('aqBlock', x + 5, st.gy - 1, {});
    if (o.blocks > 1) st.spawn('aqBlock', x + 9, st.gy - 1, {});
    st.enemy(o.enemy || 'aqRover', x + n - 4, st.gy);
    // the slide ledge over the sheet (P1)
    st.semi(x + 7, x + 11, st.gy - 4); st.coins(x + 7, x + 11, st.gy - 6);
    if (o.gold) st.gold(x + 9, st.gy - 6, o.gold);
    return x + n;
  },
  // an ice overhang hung with icicles: jump and bump one with your head and it drops on whatever is below: { gold }
  icicles(st, o) {
    const x = st.x, B = st.B, gy = st.gy; st.floor(x, x + 15);
    B.fill(x + 1, gy - 2, x + 2, gy - 1, T.HARD);                         // a step up to the ledge
    B.fill(x + 4, gy - 5, x + 13, gy - 5, T.HARD);                         // the overhang (stand on top of it: P3)
    for (const q of [6, 9, 12]) st.spawn('aqLeadIcicle', x + q, gy - 5, {});
    if (o.text) st.sign(x + 3, o.text);
    st.enemy('aqSnowball', x + 10, gy);
    st.coins(x + 5, x + 12, gy - 7);
    if (o.gold) st.gold(x + 11, gy - 8, o.gold);
    return x + 16;
  },
  // the curtain of icicles over an ice cave's mouth: { to, back }
  iceCave(st, o) { return Tour.pieces.secretDoor(st, { to: o.to, look: 'curtain', skin: 'aqIcicles', back: o.back, h: 3 }); },
  /* ---- 13-5 ---- */
  // the start: an emperor penguin hands over its egg (the start nest stone)
  eggStart(st, o) {
    const x = st.x; st.decor('aqEmperor', x + 1, st.gy, 0);
    const nx = Tour.pieces.pedestal(st, { item: 'aqEgg', start: true, look: 'aqNest' });
    st.floor(nx, nx + 2); st.sign(nx + 1, 'CARRY THE EGG TO THE ROOKERY. NO FIGHTING, NO BIG FALLS. THROW SETS IT DOWN ON A NEST STONE');
    return nx + 3;
  },
  // a nest stone on the way: set the egg down on it (THROW); a lost egg comes back to the last stone it sat on
  nest(st, o) { const x = st.x, nx = Tour.pieces.pedestal(st, { item: 'aqEgg', look: 'aqNest' }); if (o.text) st.sign(x, o.text); return nx; },
  // snow drifts to cross (low mounds, carry-friendly): { n, gold }
  drifts(st, o) {
    let x = st.x; const B = st.B, n = o.n || 3; st.floor(x, x + 1); x += 2;
    for (let k = 0; k < n; k++) {
      const h = k % 2 ? 1 : 2; st.floor(x, x + 6); B.prop('aqMound', x + 2, st.gy - h, 3, h, 'body', {}); st.coins(x + 2, x + 4, st.gy - h - 2);
      if (o.gold && k === 1) st.gold(x + 3, st.gy - h - 3, o.gold);
      x += 7;
    }
    return x;
  },
  // egg skuas over a stretch: { n, text }
  skuas(st, o) { const x = st.x, n = o.len || 12; st.floor(x, x + n - 1); if (o.text) st.sign(x + 1, o.text); for (let k = 0; k < (o.n || 1); k++) st.spawn('aqEggSkua', x + 5 + k * 5, st.gy - 6, { range: 3 }); st.coins(x + 2, x + n - 3, st.gy - 3); return x + n; },
  // the rookery behind a snow drift (set the egg down on the stone before going in): { to, back }
  rookeryDrift(st, o) {
    const x = st.x; Tour.pieces.pedestal(st, { item: 'aqEgg', look: 'aqNest' }); st.x = x + 4;
    return Tour.pieces.secretDoor(st, { to: o.to, look: 'curtain', skin: 'aqDrift', back: o.back, h: 3 });
  },
  // thin ice over the black water: it cracks under Brady (keep moving): { n, gold }
  thinIce(st, o) {
    const x = st.x, n = o.n || 5, B = st.B; st.floor(x, x + 1);
    icePool(st, x + 2, x + n + 1); for (let q = 0; q < n; q++) B.set(x + 2 + q, st.gy, T.CRUMBLE);
    st.coins(x + 2, x + n + 1, st.gy - 2);
    if (o.gold) st.gold(x + 2 + Math.floor(n / 2), st.gy - 3, o.gold);
    st.floor(x + n + 2, x + n + 4); return x + n + 5;
  },
  // the rookery at the end: deliver the egg; the gate opens
  eggFinale(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 22);
    const nx = Tour.pieces.pedestal(st, { deliver: true, lockAt: 3, item: 'aqEgg', look: 'aqNest' });
    st.decor('aqHuddle', nx + 3);
    B.spawn('gate', nx + 7, st.gy - 1, { exit: 'main' });
    st.floor(nx, nx + 10);
    return nx + 11;
  }
};
for (const k in P) Tour.pieces['aq.' + k] = P[k];

// the snowball and the wall it smashes, on the Snow-Plough's arena: two ledges (over the three-row walls), the chutes
Tour.pieces['aq.arena_plough'] = (st, o) => {
  const B = st.B, { x0, w, GY } = o;
  for (let q = 0; q < 4; q++) { B.set(x0 + 2 + q, GY - 4, T.SEMI); B.set(x0 + w - 6 + q, GY - 4, T.SEMI); }
  for (let q = 0; q < 4; q++) B.set(x0 + Math.floor(w / 2) - 2 + q, GY - 6, T.SEMI);
  B.decorAt('aqChute', x0 + 1, GY, 0); B.decorAt('aqChute', x0 + w - 2, GY, 0);
  B.decorAt('aqCrates', x0 + 7, GY, 0); B.decorAt('aqLamp', x0 + w - 8, GY, 0);
  B.gold(x0 + Math.floor(w / 2), GY - 8, 'risky');
};

/* ================= stamps ================= */
const stamps = {
  // 13-1 (s): inside the igloo: a penguin family, P2, a water bottle and the way to the Egg Express
  igloo: {
    floor: 11,
    rows: room(30, 14, 11, [[2, 10, '@.D'], [8, 4, 'o.o.o.o'], [9, 6, '-----'], [11, 4, '*'], [17, 7, '?'], [20, 10, 'p'], [24, 10, 'n'], [26, 10, 'g']]),
    legend: { p: ['decor', 'aqPenguins'], n: ['spawn', 'sign', { text: 'THE EMPEROR PENGUINS NEED A HAND WITH AN EGG...' }] },
    items: ['oneup'], doors: [{ to: 'shelf@iglooBack', look: 'aqIglooDoor' }], gold: { '*': 'hidden' }
  },
  // 13-2 (s): inside the hanging berg: blue light, coins frozen in the walls
  berg: {
    floor: 11,
    rows: room(30, 14, 11, [[2, 10, '@.D'], [6, 3, 'o.o.o.o.o.o'], [7, 7, '---'], [12, 5, '---'], [17, 3, '---'], [18, 1, '*'], [23, 7, '?']]),
    items: ['star'], doors: [{ to: 'aurora@bergBack', look: 'aqIglooDoor' }], gold: { '*': 'hidden' }
  },
  // 13-3: the module: a heater, the lab door, the airlock to the hangar
  module: {
    floor: 11,
    rows: room(34, 14, 11, [[2, 10, '@'], [6, 10, 'k'], [10, 6, '-----'], [11, 4, 'o.o.o'], [13, 2, '?'], [17, 10, 'DK'], [24, 10, 'c'], [30, 10, 'D']]),
    legend: { k: ['decor', 'aqCrates'], K: ['anchor', 'labBack'] },
    items: ['power'], doors: [{ to: 'lab@in', look: 'aqLabDoor' }, { to: 'plough@in', look: 'aqAirlock' }]
  },
  // 13-3 (s): the lab: P2, a water bottle, the back door to the Station Store
  lab: {
    floor: 11,
    rows: room(30, 14, 11, [[2, 10, '@.D'], [8, 10, 'k'], [10, 6, '-----'], [12, 4, '*'], [9, 4, 'o.o'], [15, 4, 'o.o'], [19, 7, '?'], [23, 10, 'n'], [26, 10, 'g']]),
    legend: { k: ['decor', 'aqCrates'], n: ['spawn', 'sign', { text: 'STATION STORE: STAFF ENTRANCE. PENGUINS WELCOME' }] },
    items: ['oneup'], doors: [{ to: 'module@labBack', look: 'aqLabDoor' }], gold: { '*': 'hidden' }
  },
  // 13-4 (s): the ice cave behind the icicles
  cave: {
    floor: 11,
    rows: room(30, 14, 11, [[2, 10, '@.D'], [7, 8, '--'], [10, 6, '--'], [13, 4, '---'], [14, 2, '*'], [9, 2, 'o.o'], [19, 7, '?'], [22, 4, 'o.o.o']]),
    items: ['oneup'], doors: [{ to: 'crevasse@caveBack', look: 'aqIglooDoor' }], gold: { '*': 'hidden' }
  },
  // 13-5 (s): the rookery: a huddle of emperors, P2
  rookery: {
    floor: 11,
    rows: room(30, 14, 11, [[2, 10, '@.D'], [8, 10, 'u'], [12, 6, '-----'], [14, 4, '*'], [11, 4, 'o.o'], [17, 4, 'o.o'], [20, 7, '?'], [24, 10, 'u']]),
    legend: { u: ['decor', 'aqHuddle'] },
    items: ['oneup'], doors: [{ to: 'blizzard@rookBack', look: 'aqIglooDoor' }], gold: { '*': 'hidden' }
  },
  // the Station Store (Souvenir Stand): the penguin keeper behind the counter, crates of supplies
  stand: {
    floor: 10,
    rows: room(28, 12, 10, [[2, 9, '@'], [5, 9, 'k'], [8, 9, 'q'], [11, 9, '$'], [21, 9, 'k'], [24, 9, 'G']]),
    legend: { k: ['decor', 'aqCrates'], q: ['spawn', 'aqKeeper', {}] }
  }
};

/* ================= the levels ================= */
const levels = [
  // 13-1 ROLL: belly-slide bowling on the shelf; the snowball grows and smashes snow walls; seal holes
  { n: 1, name: 'Ice Shelf Bowling', arch: 'roll', theme: 'aq_shelf',
    gimmick: 'A penguin teaches the belly-slide: bowl through snowball pins, kick a snowball that grows until it smashes snow walls, mind the seal holes',
    hint: 'Kick the snowball (run into it): it grows as it rolls and big ones smash snow walls. The slide bowls penguins over',
    postcard: 'Penguins slide on their tummies everywhere. I tried it. I am a natural. ♥ C',
    enemies: [['aqConga', 2], ['aqSnowball', 2], ['aqSkua', 1]],
    mapCell: [0, 0], mapFrom: -1,
    exits: { main: { to: '13-2' }, secret: { to: '13-5', hint: 'Cold air puffs out of a little igloo on the shelf...' } },
    areas: [
      { id: 'shelf', gen: 'strip', W: 200, H: 20, script: [
        ['itemBlock', { item: 'power', y: 4 }],
        ['itemBlock', { item: 'cake', y: 4 }],   // a jump power (bonus)
        'penguin',
        // ① belly-slide bowling on the terrace, and the first conga line
        ['conga', { len: 16, n: 3, text: 'PENGUINS SLIDE IN CONGA LINES. STOMP THE ONE IN THE SCARF AND THE REST SCATTER' }],
        ['bank', { h: 2 }],
        ['bowling', { n: 14 }],
        'seracs',
        ['postcard', { kind: 'must', dx: -8, dy: -8 }],
        ['bank', { h: -1 }],
        // ② the snowball grows as it rolls downhill; big ones smash snow walls
        ['bank', { h: 2 }],
        ['snowPile', { text: 'KICK THE SNOWBALL: IT GROWS AS IT ROLLS. A BIG ONE SMASHES SNOW WALLS' }],
        ['slope', { n: 3 }],
        ['flat', { n: 4 }],
        ['snowWall', { h: 3 }],
        ['bank', { h: 2 }],
        ['conga', { len: 15, n: 4 }],
        ['igloo', { to: 'igloo@in', back: 'iglooBack' }],
        'cp',
        ['itemBlock', { item: 'power', y: 4 }],
        // ③ roll it down over the seal holes while the seals pop up
        ['bank', { h: 1 }],
        ['snowPile', {}],
        ['slope', { n: 2 }],
        ['sealHoles', { n: 3, gold: 'risky' }],
        ['snowWall', { h: 3 }],
        'crevasse',
        ['conga', { len: 13, n: 5 }],
        ['flagGate', {}]
      ] },
      { id: 'igloo', gen: 'room', role: 'secret', theme: 'aq_igloo', stamp: 'igloo' }
    ] },

  // 13-2 FLIP: aurora bands turn gravity over; icebergs hang from the sky; mid-air swaps
  { n: 2, name: 'Upside-Down Pole', arch: 'flip', theme: 'aq_aurora',
    gimmick: 'Walk into the aurora and up becomes down: run along the sky past hanging icebergs, krill clouds and skuas, and swap in mid-air',
    hint: 'Inside the green-and-violet aurora gravity is upside down. Fall out of one band into the next to swap in mid-air',
    postcard: 'At the South Pole I stood on the sky. The penguins did not seem surprised. ♥ C',
    enemies: [['aqKrill', 2], ['aqSkua', 2], ['aqConga', 1]],
    mapCell: [1, 0], mapFrom: 0,
    exits: { main: { to: '13-3' } },
    areas: [
      { id: 'aurora', gen: 'strip', W: 200, H: 22, script: [
        ['itemBlock', { item: 'power', y: 4 }],
        ['itemBlock', { item: 'socks', y: 4 }],   // a jump power (bonus)
        ['flat', { n: 4 }],
        // ① the aurora turns gravity over (spikes below: the sky is the way)
        ['aurora', { w: 14, text: 'WALK INTO THE AURORA: UP BECOMES DOWN. RUN ALONG THE SKY', gold: [7, 3, 'must'] }],
        ['bank', { h: 2 }],
        ['conga', { len: 10, n: 3 }],
        ['bank', { h: -1 }],
        // ② icebergs hang from the sky: jump them on the ceiling; krill swirl in the band
        ['aurora', { w: 20, bergs: [[4, 3], [10, 2], [15, 3]], krill: 10 }],
        ['bigBerg', { to: 'berg@in', back: 'bergBack' }],
        'cp',
        ['bank', { h: 2 }],
        ['meet', { kind: 'aqSkua', n: 1, len: 8 }],
        ['aurora', { w: 18, bergs: [[3, 2], [8, 3], [13, 2]], krill: 6 }],
        ['itemBlock', { item: 'lsd', y: 5 }],
        // ③ swap in mid-air: fall out of one band into the next (the floor below is the safe way)
        ['swap', { w1: 10, w2: 12, gold: 'risky', skua: true }],
        ['bank', { h: -2 }],
        ['swap', { w1: 8, w2: 14, bergs: [[5, 3]] }],
        ['bank', { h: 1 }],
        ['conga', { len: 10, n: 4 }],
        ['flagGate', {}]
      ] },
      { id: 'berg', gen: 'room', role: 'secret', theme: 'aq_berg', stamp: 'berg' }
    ] },

  // 13-3 FORT: the station, the module, the Snow-Plough Bot; the lab door to the Station Store
  { n: 3, name: 'Aurora Station', arch: 'fort', theme: 'aq_station', boss: 'aq_plough', mid: true,
    gimmick: 'A research station under the aurora: module roofs, the heater vent, the radio mast, then the Snow-Plough Bot in the vehicle hangar',
    hint: 'Jump the Snow-Plough Bot\'s snow walls. After three shoves it overheats: stomp its exhaust!',
    postcard: 'The sky is dancing green. The scientists gave me cocoa and a very serious hat. ♥ C',
    enemies: [['aqRover', 3], ['aqSnowball', 1]],
    mapCell: [2, 0], mapFrom: 1,
    exits: { main: { to: '13-4' }, secret: { to: 'house:aq-store', hint: 'A lab door in the station module, its window glowing...' } },
    areas: [
      { id: 'station', gen: 'strip', W: 80, H: 18, dark: true, script: [
        ['stationGate', {}],
        ['itemBlock', { item: 'power', y: 4 }],
        ['gearStand', { item: 'hat' }],
        ['modules', {}],
        'vent',
        ['mastTop', { gold: 'must' }],
        ['enemies', { kind: 'aqRover', n: 2, len: 10 }],
        ['modules', {}],
        ['door', { to: 'module@in', perch: 0, look: 'aqAirlock' }]
      ] },
      { id: 'module', gen: 'room', role: 'sub', theme: 'aq_module', stamp: 'module' },
      { id: 'plough', gen: 'arena', role: 'arena', layout: 'plough', arenaW: 24, H: 16, theme: 'aq_station', roof: true },
      { id: 'lab', gen: 'room', role: 'secret', theme: 'aq_lab', stamp: 'lab' }
    ] },

  // 13-4 LAIR: the crevasse teaches the kicked ice blocks and the dropped icicles, then Big Tusk on the floe
  { n: 4, name: 'The Floe of Big Tusk', arch: 'lair', theme: 'aq_storm', boss: 'aq_walrus',
    gimmick: 'Down the crevasse: kick ice blocks across the ice and bump icicles down on what is below; then Big Tusk the walrus on his floe',
    hint: 'Bump the icicles down on Big Tusk, and kick ice blocks into his belly-slide',
    postcard: 'You beat Big Tusk! He says sorry and offers you a fish. Just say no thank you. ♥ C',
    enemies: [['aqSnowball', 2], ['aqRover', 1]],
    mapCell: [1, 1], mapFrom: 2,
    exits: { main: { to: null } },
    areas: [
      { id: 'crevasse', gen: 'strip', W: 72, H: 18, script: [
        ['itemBlock', { item: 'power', y: 4 }],
        ['bank', { h: 3 }],
        ['kickRun', { text: 'RUN INTO AN ICE BLOCK TO KICK IT: IT SLIDES FAR ON ICE AND BOWLS THINGS OVER', gold: 'must' }],
        ['slope', { n: 3 }],
        ['icicles', { text: 'JUMP UNDER AN ICICLE AND BUMP IT: IT DROPS ON WHATEVER IS BELOW', gold: 'risky' }],
        ['iceCave', { to: 'cave@in', back: 'caveBack' }],
        'crevasse',
        'sig',
        ['kickRun', { len: 14, enemy: 'aqSnowball' }],
        ['door', { to: 'glacier', perch: 0, look: 'aqFloeGate' }]
      ] },
      { id: 'cave', gen: 'room', role: 'secret', theme: 'aq_icecave', stamp: 'cave' },
      { id: 'glacier', gen: 'arena', role: 'arena', layout: 'glacier', arenaW: 26, H: 18, roof: false }
    ] },

  // 13-5 CARRY (secret): the emperor penguin's egg through the whiteout to the rookery
  { n: 5, name: 'Egg Express', arch: 'carry', secret: true, theme: 'aq_whiteout',
    gimmick: 'Carry an emperor penguin\'s egg through the whiteout to the rookery: skuas swoop to snatch it, gusts push you back on thin ice',
    hint: 'THROW sets the egg down on a nest stone. Skuas snatch it back to the last stone. Cross the thin ice in the lulls',
    postcard: 'We carried an egg across Antarctica. It hatched the next morning. His name is Brady Junior. ♥ C',
    enemies: [['aqEggSkua', 2], ['aqSeal', 1]],
    mapCell: [0, 1], mapFrom: 0,
    exits: { main: { to: null } },
    areas: [
      { id: 'blizzard', gen: 'strip', W: 180, H: 20, carry: { item: 'aqEgg', jumpMul: 0.92 }, script: [
        ['eggStart', {}],
        ['itemBlock', { item: 'power', y: 4 }],
        // ① carry it over the drifts
        ['drifts', { n: 3, gold: 'must' }],
        ['flat', { n: 5 }],
        // ② skuas want the egg
        ['skuas', { n: 1, len: 12, text: 'SKUAS SNATCH EGGS! KEEP MOVING, OR SET IT DOWN AND CHASE THEM OFF' }],
        ['nest', {}],
        ['drifts', { n: 2 }],
        ['rookeryDrift', { to: 'rookery@in', back: 'rookBack' }],
        'cp',
        ['skuas', { n: 2, len: 14 }],
        // ③ the blizzard on thin ice
        'blizzard',
        ['thinIce', { n: 5, gold: 'risky' }],
        ['nest', {}],
        'blizzard',
        ['itemBlock', { item: 'star', y: 4 }],
        ['thinIce', { n: 6 }],
        ['skuas', { n: 1, len: 10 }],
        ['eggFinale', {}]
      ] },
      { id: 'rookery', gen: 'room', role: 'secret', theme: 'aq_rookery', stamp: 'rookery' }
    ] }
];

Tour.amend('aq', {
  stamps, skins,
  map: { fort: 'floe', start: [0, 0] },
  houses: [{ id: 'aq-store', kind: 'stand', name: 'Station Store', keeper: 'penguin', theme: 'aq_station', roomTheme: 'aq_module', stock: ['hat', 'globe', 'plane', 'oneup', 'sundial', 'magnet', 'sig:slide'], mapCell: [2, 1], mapFrom: 2 }],
  levels
});
})();
