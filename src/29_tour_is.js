/* ============================================================
   ICELAND (world 17, cc 'is'): the fourth land of the Encore Tour (docs/design/ENCORE_TOUR.md §4).
   Fire and ice, but not Antarctica's white ice sheet: black sand, green moss over lava fields, steam from every
   crack, basalt columns, glacier tongues and a lagoon of blue icebergs, turf-roofed huts with little painted doors,
   puffins, arctic foxes, Icelandic sheep and horses, seals. Piwi had the great geyser corked and shipped as scenery;
   the act nobody cancelled is the Night Troll, who has been waiting in his cave for dawn (he turns to stone in it).
   This file: the looks (themes, painted backdrops, tiles, props), the critters, the door looks, the route-map
   emblem, the map's sprites and painters, the music and the country itself.
   The moving parts (aurora ribbons, icebergs, rift plates, organ-pipe columns, the hidden folk): 29_tour_is_kit.js.
   The Night Troll: 29_tour_is_boss.js. The levels and the land's map layout: 29_tour_is_levels.js.
   Every global and entity type here starts with 'is' + a capital letter (isPuffin, IsArt...), never a bare 'is'.
   ============================================================ */
(function () {
const COL = { a: '#3ac8e8', b: '#e8502a', c: '#7ad04a' };
const INK = '#161a24';
const MOSS = '#6aa83a', MOSS_HI = '#9ad05a', MOSS_DK = '#3e7a2a', BASALT = '#2e2e36', BASALT_HI = '#4a4a56', SAND = '#22222a';
const GLACIER = '#8ad8f0', GLACIER_DK = '#3a9ac8', SNOW = '#eef6fa', LAVA = '#ff7a1a', LAVA_HI = '#ffd23f';
const K = TourKit;
if (typeof LIQUIDS !== 'undefined' && !LIQUIDS.isGlacial) LIQUIDS.isGlacial = ['#c8f4ff', '#4ab8e0', '#14507a', 'rgba(230,255,255,0.3)', '#8ae8ff', 'rgba(255,255,255,0.8)'];

/* ---------------- shared drawing (used by the kit and the boss too) ---------------- */
const IsArt = {
  INK, COL,
  // a hexagonal basalt column top seen from the side (a flat hexagon cap), w wide at (x, y)
  hexCap(ctx, x, y, w, col) {
    ctx.fillStyle = col || BASALT_HI; ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x + w * 0.22, y); ctx.lineTo(x + w * 0.78, y); ctx.lineTo(x + w, y + 4); ctx.lineTo(x + w * 0.78, y + 8); ctx.lineTo(x + w * 0.22, y + 8); ctx.closePath(); ctx.fill();
  },
  // a turf-roofed hut: stone-and-turf walls, a grassy roof, a little painted door (red, blue or green), a window
  hut(ctx, x, y, w, h, door, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.fillStyle = '#7a6a5a'; ctx.fillRect(x - w / 2, y - h, w, h); ctx.strokeRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = '#5a4a3a'; for (let k = 0; k < 3; k++) ctx.fillRect(x - w / 2 + 2, y - h + 6 + k * (h / 3), w - 4, 2);
    // the gable: white boards, the turf roof sitting on it like a green loaf
    ctx.fillStyle = '#f2eee4'; ctx.beginPath(); ctx.moveTo(x - w / 2 + 4, y - h); ctx.lineTo(x, y - h - h * 0.55); ctx.lineTo(x + w / 2 - 4, y - h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = MOSS; ctx.beginPath(); ctx.moveTo(x - w / 2 - 6, y - h + 4); ctx.quadraticCurveTo(x - w / 2 + 2, y - h - h * 0.4, x, y - h - h * 0.62); ctx.quadraticCurveTo(x + w / 2 - 2, y - h - h * 0.4, x + w / 2 + 6, y - h + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = MOSS_HI; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(x + k * w * 0.18, y - h - h * 0.38 + Math.abs(k) * h * 0.12, 4, 2, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = door || '#d83a2a'; rr(ctx, x - 7, y - 22, 14, 22, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + 3, y - 10, 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = t == null || Math.sin(t * 0.7) > -0.6 ? '#ffd890' : '#2a3040'; ctx.fillRect(x + w / 2 - 14, y - h + 8, 8, 8); ctx.strokeRect(x + w / 2 - 14, y - h + 8, 8, 8);
    ctx.restore();
  },
  // a puffin's head-and-body, facing right, standing at (0, 0) feet; s = scale; beak full of little fish when fish
  puffin(ctx, s, flap, fish) {
    ctx.save(); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 1.8 / s * s;
    ctx.fillStyle = '#ff8a2a'; ctx.fillRect(-5, -4, 3, 4); ctx.fillRect(2, -4, 3, 4);
    ctx.fillStyle = '#1e1e28'; ctx.beginPath(); ctx.ellipse(0, -14, 10, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f6f4ee'; ctx.beginPath(); ctx.ellipse(2, -11, 6, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1e1e28'; ctx.beginPath(); ctx.ellipse(-4, -12 - flap * 6, 4, 8, -0.5 - flap * 0.8, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1e1e28'; ctx.beginPath(); ctx.arc(4, -26, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2f2ea'; ctx.beginPath(); ctx.ellipse(5.5, -26, 4.5, 4, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(6.5, -27, 1.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff6a1a'; ctx.beginPath(); ctx.moveTo(9, -30); ctx.quadraticCurveTo(17, -27, 16, -22); ctx.lineTo(9, -22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(10, -27.5, 4, 2);
    if (fish) { ctx.fillStyle = '#c8d8e0'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(13, -25 + k * 2.4, 5, 1.2, 0.2, 0, TAU); ctx.fill(); } }
    ctx.restore();
  },
  // a little Icelandic horse (decor and map): stocky, a big shaggy mane; c body colour, m mane colour
  horse(ctx, x, y, c, m, t, dir) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    const g = Math.sin(t * 1.1) * 2, eat = Math.sin(t * 0.4) > 0.3;
    ctx.fillStyle = c; for (const lx of [-14, -8, 8, 13]) { ctx.fillRect(lx - 2, -12, 4.5, 12); ctx.strokeRect(lx - 2, -12, 4.5, 12); }
    ctx.beginPath(); ctx.ellipse(0, -18, 19, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = m; ctx.beginPath(); ctx.moveTo(-18, -20); ctx.quadraticCurveTo(-28, -14, -24, 0 + g); ctx.lineTo(-20, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(15, -22); ctx.rotate(eat ? 0.9 : -0.2);
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(2, -12); ctx.lineTo(12, -10); ctx.lineTo(13, -4); ctx.lineTo(4, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = m; ctx.beginPath(); ctx.moveTo(-6, 4); ctx.quadraticCurveTo(-8, -10, 2, -16); ctx.quadraticCurveTo(0, -4, -2, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(6, -8, 1.3, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  },
  // a woolly Icelandic sheep (decor): a cloud of wool, a dark face, little horns
  sheep(ctx, x, y, t, dir, wool) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#2a2a30'; ctx.fillRect(-9, -7, 3, 7); ctx.fillRect(6, -7, 3, 7);
    ctx.fillStyle = wool || '#f2ece0'; ctx.beginPath(); for (let k = 0; k < 6; k++) ctx.arc(-10 + k * 4, -13 + (k % 2) * 3, 6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -12, 13, 7, 0, 0, TAU); ctx.fill();
    const bob = Math.sin(t * 0.8) > 0.4 ? 4 : 0;
    ctx.fillStyle = '#3a3238'; ctx.beginPath(); ctx.ellipse(14, -14 + bob, 4.5, 6, 0.4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#c8b898'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(12, -19 + bob, 3, Math.PI, TAU * 0.95); ctx.stroke();
    ctx.restore();
  },
  // a tiny painted door in a rock (the hidden folk's): only the frame and a round window; lit when near
  elfDoor(ctx, x, y, col, lit, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = col || '#3a7ad8'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 6, y - 12); ctx.arc(x, y - 12, 6, Math.PI, 0); ctx.lineTo(x + 6, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = lit ? '#ffe28a' : '#2a2a3a'; ctx.beginPath(); ctx.arc(x, y - 13, 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x + 3, y - 5, 1, 0, TAU); ctx.fill();
    if (lit) { ctx.fillStyle = 'rgba(255,226,138,' + (0.25 + 0.15 * Math.sin(t * 3)) + ')'; ctx.beginPath(); ctx.arc(x, y - 10, 14, 0, TAU); ctx.fill(); }
    ctx.restore();
  },
  // a puff of steam (cosmetic): k 0..1 how far up
  steam(ctx, x, y, k, r) {
    ctx.fillStyle = 'rgba(240,246,250,' + (0.55 * (1 - k)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x + Math.sin(k * 6) * 6, y - k * 60, (r || 8) * (0.6 + k), 0, TAU); ctx.fill();
  }
};

/* ---------------- tiles ---------------- */
// the lava field: black lava rock, a thick cushion of green moss on top (the walkable edge reads at a glance)
const fieldGround = {
  style: 'moss', cap: MOSS, capHi: MOSS_HI, dirt: '#2e2c32', dirt2: '#1e1c22', rock: '#3a3840',
  paint(ctx, rng) {
    ctx.fillStyle = '#2a2830'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#36343e'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(rng() * TS, rng() * TS, 5 + rng() * 5, 3 + rng() * 3, rng() * 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#18161c'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(rng() * TS, rng() * TS, 1.2 + rng(), 0, TAU); ctx.fill(); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = MOSS_DK; ctx.fillRect(x0, 0, x1 - x0, 11);
    ctx.fillStyle = MOSS; ctx.fillRect(x0, 0, x1 - x0, 8);
    ctx.fillStyle = MOSS_HI; for (let x = x0 + 2; x < x1; x += 7) { ctx.beginPath(); ctx.ellipse(x + 2, 2.5, 3, 1.6, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = MOSS_DK; for (let x = x0 + 5; x < x1; x += 11) { ctx.beginPath(); ctx.arc(x, 11, 2.5, 0, Math.PI); ctx.fill(); }
  }
};
// basalt slabs (one-way ledges), turf bricks, hexagonal basalt blocks
const basaltSemi = {
  style: 'slab', c1: '#5a5a66', c2: '#2e2e36',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(x0, 0, x1 - x0, 11);
    ctx.fillStyle = '#6a6a78'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = MOSS; for (let x = x0 + 3; x < x1; x += 13) ctx.fillRect(x, 0, 6, 2);
    ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5); for (let x = x0 + 15; x < x1; x += 16) ctx.fillRect(x, 4, 1.5, 6);
  }
};
const turfBrick = {
  style: 'turf', c1: '#7a6a52', c2: '#4a3e2e', mortar: '#2a2218',
  paint(ctx) {
    ctx.fillStyle = '#6a5a44'; ctx.fillRect(0, 0, TS, TS);
    // herringbone turf sods (the old walls), a green fringe on top
    ctx.strokeStyle = '#4a3e2e'; ctx.lineWidth = 3;
    for (let k = 0; k < 2; k++) { const y = 6 + k * 15; ctx.beginPath(); for (let x = -4; x < TS + 4; x += 8) { ctx.moveTo(x, y + 8); ctx.lineTo(x + 4, y); ctx.lineTo(x + 8, y + 8); } ctx.stroke(); }
    ctx.fillStyle = MOSS; ctx.fillRect(0, 0, TS, 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const hexHard = {
  c1: '#4a4a56', c2: '#2a2a32',
  paint(ctx) {
    ctx.fillStyle = '#34343e'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#44444f'; ctx.fillRect(3, 0, 10, TS); ctx.fillRect(18, 0, 10, TS);
    ctx.fillStyle = '#24242c'; ctx.fillRect(14, 0, 3, TS); ctx.fillRect(29, 0, 3, TS);
    IsArt.hexCap(ctx, 2, 1, 12, '#5a5a68'); IsArt.hexCap(ctx, 17, 1, 12, '#5a5a68');
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// the glacier lagoon: black sand with frost, ice shelves, ice blocks, blue glacier ice
const sandGround = {
  style: 'sand', cap: '#3a3a44', capHi: '#eef6fa', dirt: SAND, dirt2: '#16161c', rock: '#2a2a32',
  paint(ctx, rng) {
    ctx.fillStyle = SAND; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#2e2e38'; for (let k = 0; k < 6; k++) ctx.fillRect(rng() * TS, rng() * TS, 2, 2);
    ctx.fillStyle = 'rgba(160,220,240,0.25)'; if (rng() < 0.3) { ctx.beginPath(); ctx.ellipse(8 + rng() * 16, 10 + rng() * 14, 5, 3, 0, 0, TAU); ctx.fill(); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#16161c'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = '#3a3a46'; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = SNOW; for (let x = x0; x < x1; x += 9) { ctx.beginPath(); ctx.ellipse(x + 4, 1.5, 4.5, 2, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = GLACIER; for (let x = x0 + 6; x < x1; x += 23) ctx.fillRect(x, 4, 4, 3);
  }
};
const iceSemi = {
  style: 'ice', c1: '#c8f0ff', c2: '#4ab8e0',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = GLACIER_DK; ctx.fillRect(x0, 0, x1 - x0, 11);
    ctx.fillStyle = GLACIER; ctx.fillRect(x0, 0, x1 - x0, 6);
    ctx.fillStyle = SNOW; ctx.fillRect(x0, 0, x1 - x0, 2.5);
    ctx.fillStyle = INK; ctx.fillRect(x0, 10, x1 - x0, 1.5);
    ctx.fillStyle = '#e8faff'; for (let x = x0 + 4; x < x1; x += 10) { ctx.beginPath(); ctx.moveTo(x, 11); ctx.lineTo(x + 2, 16); ctx.lineTo(x + 4, 11); ctx.fill(); }
  }
};
const iceBrick = {
  style: 'iceblock', c1: '#bfeeff', c2: '#5ab8e0', mortar: '#2a6a9a',
  paint(ctx) {
    ctx.fillStyle = '#8ad8f0'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#b8ecfa'; ctx.beginPath(); ctx.moveTo(3, 3); ctx.lineTo(TS - 8, 3); ctx.lineTo(4, TS - 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,100,150,0.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(TS - 6, 8); ctx.lineTo(TS - 12, 16); ctx.lineTo(TS - 8, 24); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const glacierHard = {
  c1: '#6ac8e8', c2: '#2a7ab0',
  paint(ctx) {
    ctx.fillStyle = '#4aa8d8'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#7ad0ee'; ctx.fillRect(0, 0, TS, 9);
    ctx.fillStyle = '#2a7ab0'; ctx.fillRect(0, 20, TS, 3);
    ctx.fillStyle = 'rgba(20,20,30,0.35)'; ctx.fillRect(0, 26, TS, 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
// inside the volcano: basalt with glowing cracks, scoria ledges, hexagon blocks
const volcGround = {
  style: 'scoria', cap: '#4a3a3a', capHi: '#ff8a3a', dirt: '#2a1e20', dirt2: '#180e10', rock: '#3a2a2a',
  paint(ctx, rng) {
    ctx.fillStyle = '#2a1e22'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#3a2a2e'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(rng() * TS, rng() * TS, 6, 4, rng() * 3, 0, TAU); ctx.fill(); }
    if (rng() < 0.45) { ctx.strokeStyle = 'rgba(255,110,30,0.75)'; ctx.lineWidth = 1.4; ctx.beginPath(); const x = rng() * TS; ctx.moveTo(x, 0); ctx.lineTo(x + rng() * 8 - 4, TS * 0.5); ctx.lineTo(x + rng() * 10 - 5, TS); ctx.stroke(); }
  },
  paintCap(ctx, x0, x1) {
    ctx.fillStyle = '#1a1214'; ctx.fillRect(x0, 0, x1 - x0, 10);
    ctx.fillStyle = '#5a4646'; ctx.fillRect(x0, 0, x1 - x0, 7);
    ctx.fillStyle = '#ff8a3a'; for (let x = x0 + 4; x < x1; x += 14) ctx.fillRect(x, 6, 5, 1.6);
    ctx.fillStyle = '#7a6262'; for (let x = x0 + 1; x < x1; x += 6) ctx.fillRect(x, 0, 3, 1.6);
  }
};
const volcSemi = {
  style: 'scoria', c1: '#6a5050', c2: '#2a1e20',
  paint(ctx, part, x0, x1) {
    ctx.fillStyle = '#3a2a2c'; ctx.fillRect(x0, 0, x1 - x0, 11);
    ctx.fillStyle = '#6a5454'; ctx.fillRect(x0, 0, x1 - x0, 4);
    ctx.fillStyle = 'rgba(255,120,40,0.8)'; ctx.fillRect(x0, 9, x1 - x0, 1.5);
    ctx.fillStyle = INK; ctx.fillRect(x0, 10.5, x1 - x0, 1.2);
  }
};
const volcHard = {
  c1: '#5a4a4e', c2: '#2a2024',
  paint(ctx) {
    ctx.fillStyle = '#3a2e32'; ctx.fillRect(0, 0, TS, TS);
    ctx.fillStyle = '#4a3c40'; ctx.fillRect(3, 0, 10, TS); ctx.fillRect(18, 0, 10, TS);
    ctx.fillStyle = '#1e1618'; ctx.fillRect(14, 0, 3, TS); ctx.fillRect(29, 0, 3, TS);
    IsArt.hexCap(ctx, 2, 1, 12, '#6a5a5e'); IsArt.hexCap(ctx, 17, 1, 12, '#6a5a5e');
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(0.75, 0.75, TS - 1.5, TS - 1.5);
  }
};
const field = { ground: fieldGround, semi: basaltSemi, brick: turfBrick, hard: hexHard, pillar: { c1: '#4a4a56', c2: '#2a2a32', cap: MOSS, style: 'column' }, accent: COL.c, tint: {}, bloom: 0.14, liquid: 'isGlacial' };
const lagoon = { ground: sandGround, semi: iceSemi, brick: iceBrick, hard: glacierHard, pillar: { c1: '#8ad8f0', c2: '#3a9ac8', cap: SNOW, style: 'column' }, accent: COL.a, tint: {}, bloom: 0.16, liquid: 'isGlacial' };
const volcano = { ground: volcGround, semi: volcSemi, brick: turfBrick, hard: volcHard, pillar: { c1: '#4a3c40', c2: '#2a2024', cap: LAVA, style: 'column' }, accent: COL.b, tint: {}, bloom: 0.22, liquid: 'lava' };

/* ---------------- painted backdrops ---------------- */
const painters = {
  // dark mountains with snowy shoulders and long gullies (the far range)
  isPeaks(ctx, L, rng, H) {
    const b = L.base, col = L.color, snow = L.snow || '#dfe8f0';
    ctx.fillStyle = col; ctx.fillRect(0, b, BG_W, H - b);
    for (let x = 0; x < BG_W; x += 90 + rng() * 80) {
      const h = 50 + rng() * (L.h || 140), w = h * (1.1 + rng() * 0.5), sk = (rng() - 0.5) * w * 0.3;
      wrapDraw(x - w, w * 2, X => {
        const px = X + w + sk, py = b - h;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X, b + 2); ctx.quadraticCurveTo(px - w * 0.45, py + h * 0.35, px - 6, py + 3); ctx.quadraticCurveTo(px, py - 3, px + 6, py + 3); ctx.quadraticCurveTo(px + w * 0.45, py + h * 0.4, X + w * 2, b + 2); ctx.closePath(); ctx.fill();
        // the snow cap: only the top third, with a ragged lower edge
        const ch = h * 0.34;
        ctx.save(); ctx.clip();
        ctx.fillStyle = snow; ctx.beginPath(); ctx.moveTo(px - w, py + ch);
        for (let k = 0; k <= 6; k++) ctx.lineTo(px - w * 0.5 + k * w / 6, py + ch + (k % 2 ? -ch * 0.35 : 0));
        ctx.lineTo(px + w, py + ch); ctx.lineTo(px + w, py - 20); ctx.lineTo(px - w, py - 20); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(col, -0.18); ctx.beginPath(); ctx.moveTo(px + 2, py + 2); ctx.quadraticCurveTo(px + w * 0.45, py + h * 0.4, X + w * 2, b + 2); ctx.lineTo(px + w * 0.25, b + 2); ctx.closePath(); ctx.fill();
        ctx.restore();
      });
    }
  },
  // a lava field: rolling mossy humps, black rock showing through, steam from cracks, turf huts and horses far off
  isField(ctx, L, rng, H) {
    const b = L.base, col = L.color;
    ctx.fillStyle = shade(col, -0.35); ctx.fillRect(0, b, BG_W, H - b);
    for (let x = -40; x < BG_W + 40; x += 50 + rng() * 40) {
      const r = 40 + rng() * 50;
      wrapDraw(x - r, r * 2, X => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(X + r, b + 8, r, r * 0.42, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = shade(col, 0.15); ctx.beginPath(); ctx.ellipse(X + r - 8, b - r * 0.25, r * 0.5, r * 0.12, -0.1, 0, TAU); ctx.fill(); });
    }
    for (let k = 0; k < 6; k++) { const x = rng() * BG_W; ctx.fillStyle = shade(col, -0.5); ctx.beginPath(); ctx.ellipse(x, b + 2, 12 + rng() * 10, 4, 0, 0, TAU); ctx.fill(); }
    if (L.huts) for (let x = 120; x < BG_W; x += 330) { const hx = x + rng() * 60; wrapDraw(hx - 30, 60, X => IsArt.hut(ctx, X + 30, b + 2, 30, 16, ['#d83a2a', '#3a7ad8', '#f2c84a'][Math.floor(rng() * 3)], null)); }
    if (L.horses) for (let x = 260; x < BG_W; x += 400) wrapDraw(x - 30, 60, X => IsArt.horse(ctx, X + 30, b + 2, ['#8a5a3a', '#f2ece0', '#3a2a22'][Math.floor(rng() * 3)], '#e8dcc0', 0, rng() < 0.5 ? -1 : 1));
  },
  // steam columns rising from the far field (soft white towers)
  isSteamCols(ctx, L, rng, H) {
    for (let x = 80; x < BG_W; x += 230 + rng() * 120) {
      wrapDraw(x - 60, 120, X => {
        for (let k = 0; k < 9; k++) { const y = L.base - k * 26, r = 14 + k * 5; ctx.fillStyle = 'rgba(240,246,250,' + (0.32 - k * 0.03).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(X + 60 + Math.sin(k * 0.9) * 10, y, r, 0, TAU); ctx.fill(); }
      });
    }
  },
  // the glacier tongue coming down to the lagoon: white over blue, crevasses, black ash bands
  isGlacier(ctx, L, rng, H) {
    const b = L.base;
    for (let x = -100; x < BG_W; x += 520) {
      wrapDraw(x, 520, X => {
        ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(X, b); ctx.quadraticCurveTo(X + 60, b - 180, X + 220, b - 210); ctx.lineTo(X + 360, b - 200); ctx.quadraticCurveTo(X + 470, b - 150, X + 520, b); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5ab8e0'; ctx.beginPath(); ctx.moveTo(X + 30, b); ctx.lineTo(X + 70, b - 70); ctx.lineTo(X + 460, b - 66); ctx.lineTo(X + 500, b); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#2a7ab0'; ctx.lineWidth = 2.5; for (let k = 0; k < 9; k++) { const cx = X + 80 + k * 44; ctx.beginPath(); ctx.moveTo(cx, b - 64); ctx.lineTo(cx + 4, b - 20); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(40,40,50,0.45)'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(X + 60, b - 110 - k * 26); ctx.quadraticCurveTo(X + 260, b - 130 - k * 26, X + 470, b - 100 - k * 20); ctx.stroke(); }
      });
    }
  },
  // the lagoon: dark blue water with drifting little bergs, glints
  isLagoonFar(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = vgrad(ctx, b, H, L.color, shade(L.color, -0.4)); ctx.fillRect(0, b, BG_W, H - b);
    for (let x = 20; x < BG_W; x += 90 + rng() * 80) {
      const w = 20 + rng() * 40, h = 8 + rng() * 22;
      wrapDraw(x, w, X => { ctx.fillStyle = '#e8faff'; ctx.beginPath(); ctx.moveTo(X, b + 6); ctx.lineTo(X + w * 0.2, b + 6 - h); ctx.lineTo(X + w * 0.7, b + 6 - h * 0.8); ctx.lineTo(X + w, b + 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#7ad0ee'; ctx.fillRect(X + 2, b + 2, w - 4, 4); });
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 30; k++) ctx.fillRect(rng() * BG_W, b + 16 + rng() * (H - b - 20), 6 + rng() * 10, 1.5);
  },
  // the rift: the two walls of the crack (grey-green, columnar), a river of mist at the bottom
  isRiftWalls(ctx, L, rng, H) {
    const b = L.base;
    for (let x = 0; x < BG_W; x += 256) {
      wrapDraw(x, 256, X => {
        ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(X, H); ctx.lineTo(X, b - 200); for (let k = 0; k <= 8; k++) ctx.lineTo(X + k * 12, b - 200 + (k % 2) * 8); ctx.lineTo(X + 96, b - 160); ctx.lineTo(X + 110, H); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(L.color, -0.2); for (let k = 0; k < 6; k++) ctx.fillRect(X + 6 + k * 15, b - 186, 4, 220);
        ctx.fillStyle = MOSS_DK; ctx.beginPath(); ctx.ellipse(X + 50, b - 196, 50, 8, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(X + 256, H); ctx.lineTo(X + 256, b - 220); ctx.lineTo(X + 170, b - 190); ctx.lineTo(X + 150, H); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(L.color, -0.2); for (let k = 0; k < 5; k++) ctx.fillRect(X + 172 + k * 16, b - 200, 4, 240);
      });
    }
    ctx.fillStyle = 'rgba(230,240,244,0.45)'; for (let x = 0; x < BG_W; x += 40) { ctx.beginPath(); ctx.ellipse(x, b + 30, 40, 14, 0, 0, TAU); ctx.fill(); }
  },
  // the inside of the volcano: crater walls lit red from below, organ-pipe columns, ember sparks
  isCrater(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 22) {
      const h = 80 + 140 * (0.5 + 0.5 * Math.sin(x * 0.012 + 1)) + rng() * 30;
      ctx.fillStyle = shade(L.color, 0.08 + (x % 44 ? 0.04 : 0)); ctx.fillRect(x, b - h, 20, h + 200);
      IsArt.hexCap(ctx, x, b - h - 4, 20, shade(L.color, 0.2));
      ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(x + 17, b - h + 6, 3, h + 200);
    }
    ctx.fillStyle = vgrad(ctx, b - 120, H, 'rgba(255,110,30,0)', 'rgba(255,120,40,0.55)'); ctx.fillRect(0, b - 120, BG_W, H - b + 120);
  },
  // a fjord before dawn: sea stacks (trolls caught by the sun long ago), a flat sea, a pink band of sky
  isFjord(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(0, b, BG_W, H - b);
    ctx.fillStyle = 'rgba(255,190,200,0.35)'; for (let k = 0; k < 20; k++) ctx.fillRect(rng() * BG_W, b + 6 + rng() * 60, 20 + rng() * 30, 2);
    for (let x = 60; x < BG_W; x += 300) {
      const hx = x + rng() * 80;
      wrapDraw(hx - 40, 140, X => {
        ctx.fillStyle = L.color;
        ctx.beginPath(); ctx.moveTo(X, b); ctx.lineTo(X + 6, b - 90); ctx.quadraticCurveTo(X + 16, b - 120, X + 26, b - 96); ctx.lineTo(X + 34, b); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(X + 50, b); ctx.lineTo(X + 56, b - 60); ctx.quadraticCurveTo(X + 66, b - 80, X + 74, b - 62); ctx.lineTo(X + 80, b); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(X + 96, b); ctx.lineTo(X + 102, b - 40); ctx.lineTo(X + 112, b - 44); ctx.lineTo(X + 118, b); ctx.closePath(); ctx.fill();
      });
    }
  },
  // big mossy boulders of the hidden folk: tiny painted doors and windows, a ladder, a washing line
  isFolkRocks(ctx, L, rng, H) {
    const b = L.base;
    ctx.fillStyle = shade(L.color, -0.3); ctx.fillRect(0, b, BG_W, H - b);
    for (let x = 30; x < BG_W; x += 170 + rng() * 60) {
      const r = 40 + rng() * 30;
      wrapDraw(x - r, r * 2, X => {
        ctx.fillStyle = L.color; ctx.beginPath(); ctx.ellipse(X + r, b, r, r * 0.8, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = L.moss || MOSS; ctx.beginPath(); ctx.ellipse(X + r, b - r * 0.62, r * 0.82, r * 0.24, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = ['#d83a2a', '#3a7ad8', '#f2c84a', '#7ad04a'][Math.floor(rng() * 4)];
        ctx.beginPath(); ctx.moveTo(X + r - 5, b); ctx.lineTo(X + r - 5, b - 9); ctx.arc(X + r, b - 9, 5, Math.PI, 0); ctx.lineTo(X + r + 5, b); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,226,138,0.85)'; ctx.fillRect(X + r + 12, b - 22, 5, 5); ctx.fillRect(X + r - 20, b - 26, 5, 5);
      });
    }
  }
};

const themes = {
  is_aurora: Object.assign({}, field, {
    name: 'Northern Lights', music: 'tour_is', particles: 'snow', rays: null, aurora: true,
    sky: ['#060a22', '#0e1a40', '#1a2e5a'], horizonGlow: '#3affb0', celestial: { type: 'moon', x: 0.82, y: 0.16, r: 16, color: '#f4f0e0', glow: '#c8e8ff' }, stars: 1,
    layers: [{ kind: 'isPeaks', color: '#1a2238', snow: '#7a90b8', base: 330, h: 130, f: 0.05 }, { kind: 'isField', color: '#2e5a40', base: 350, f: 0.16, huts: true, horses: true }],
    fog: '#1a3a5a', darkness: 0.2, decor: ['isRock', 'isCairn', 'isHut']
  }),
  is_lagoon: Object.assign({}, lagoon, {
    name: 'The Glacier Lagoon', music: 'tour_is_lagoon', particles: 'none', rays: '#fff4e8',
    sky: ['#7ab0e0', '#c8e0f0', '#ffe8e0'], horizonGlow: '#ffffff', celestial: { type: 'sun', x: 0.16, y: 0.3, r: 26, color: '#fff4d8', glow: '#ffe8c8' }, stars: 0,
    layers: [{ kind: 'isPeaks', color: '#4a5a6e', snow: '#f4f8fc', base: 330, h: 110, f: 0.04 }, { kind: 'isGlacier', color: '#f4fbff', base: 380, f: 0.1 }, { kind: 'isLagoonFar', color: '#2a6a9a', base: 395, f: 0.2 }],
    fog: '#d8ecf8', decor: ['isRock']
  }),
  is_rift: Object.assign({}, field, {
    name: 'The Rift', music: 'tour_is_rift', particles: 'dust', rays: null,
    sky: ['#7a8a98', '#a8b4bc', '#d0d8d8'], horizonGlow: '#e8f0f0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'isPeaks', color: '#5a6672', snow: '#e8eef2', base: 330, h: 90, f: 0.04 }, { kind: 'isSteamCols', base: 380, f: 0.08 }, { kind: 'isRiftWalls', color: '#4a5448', base: 410, f: 0.18 }],
    fog: '#c8d4d8', decor: ['isRock', 'isCairn']
  }),
  is_volcano: Object.assign({}, volcano, {
    name: 'The Organ Pipes', music: 'tour_is_pipes', particles: 'embers', rays: null,
    sky: ['#1a0a0e', '#2a1012', '#4a1a14'], horizonGlow: '#ff6a1a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'isCrater', color: '#2a1a1e', base: 410, f: 0.14 }],
    fog: '#ff6a2a', darkness: 0.18, decor: ['isRock']
  }),
  is_dawn: Object.assign({}, field, {
    name: 'Before Dawn', music: 'tour_is', particles: 'none', rays: null,
    sky: ['#1a1e4a', '#5a4a7a', '#ffb0a0'], horizonGlow: '#ffc8a8', celestial: { type: 'none' }, stars: 0.4,
    layers: [{ kind: 'isPeaks', color: '#2a2a48', snow: '#b8b0d0', base: 360, h: 100, f: 0.04 }, { kind: 'isFjord', color: '#1e1e34', base: 400, f: 0.14 }],
    fog: '#a888b8', darkness: 0.1, decor: ['isRock', 'isTrollStone']
  }),
  is_cave: Object.assign({}, volcano, {
    name: 'The Troll\'s Cave', music: 'tour_is', particles: 'dust', rays: null,
    sky: ['#2a2840', '#4a3e5e', '#8a6a88'], horizonGlow: '#ffb8a0', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'isCrater', color: '#3a3446', base: 410, f: 0.1 }], ground: fieldGround, semi: basaltSemi, hard: hexHard,
    fog: '#6a5a78', darkness: 0.08, decor: ['isRock']
  }),
  is_folk: Object.assign({}, field, {
    name: 'The Hidden Folk', music: 'tour_is_folk', particles: 'fireflies', rays: '#fff0d8',
    sky: ['#e8a8c0', '#f8d0c0', '#fff0d0'], horizonGlow: '#fff4e0', celestial: { type: 'sun', x: 0.86, y: 0.42, r: 22, color: '#fff2c8', glow: '#ffd8a8' }, stars: 0,
    layers: [{ kind: 'isPeaks', color: '#8a7a9a', snow: '#fff4f0', base: 350, h: 90, f: 0.04 }, { kind: 'isFolkRocks', color: '#5a5a66', moss: '#7ab04a', base: 410, f: 0.16 }],
    fog: '#f8d8d0', decor: ['isRock', 'isElfDoor']
  }),
  is_tube: Object.assign({}, volcano, {
    name: 'A Lava Tube', music: 'tour_is', particles: 'none', rays: null, ground: fieldGround, semi: basaltSemi, hard: hexHard,
    sky: ['#120e14', '#1a141c', '#241c26'], horizonGlow: '#ff8a4a', celestial: { type: 'none' }, stars: 0,
    layers: [{ kind: 'isCrater', color: '#1a1418', base: 410, f: 0.1 }],
    fog: '#4a2a2a', darkness: 0.25, decor: ['isRock']
  })
};

/* ---------------- props (Decor: drawn each frame; y is the top of the row under the letter) ---------------- */
const decor = {
  isHut(ctx, x, y, t, th, d) { const s = (d && d.seed) || 0; IsArt.hut(ctx, x, y, 64, 34, ['#d83a2a', '#3a7ad8', '#2a8a4a'][s % 3], t); },
  isHorse(ctx, x, y, t, th, d) { const s = (d && d.seed) || 0; IsArt.horse(ctx, x, y, ['#8a5a3a', '#f2ece0', '#3a2a22', '#c8904a'][s % 4], s % 2 ? '#f6eed8' : '#2a1e18', t + s, s % 2 ? -1 : 1); },
  isSheepDecor(ctx, x, y, t, th, d) { const s = (d && d.seed) || 0; IsArt.sheep(ctx, x, y, t + s * 2, s % 2 ? -1 : 1, s % 3 === 2 ? '#3a3036' : '#f2ece0'); },
  // a mossy lava boulder
  isRock(ctx, x, y, t, th, d) {
    const s = (d && d.seed) || 0, w = 22 + (s % 3) * 8;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#3a3842'; ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.62, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = MOSS; ctx.beginPath(); ctx.ellipse(x - 2, y - w * 0.5, w * 0.7, w * 0.18, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#4e4c58'; ctx.beginPath(); ctx.ellipse(x + w * 0.35, y - w * 0.25, 4, 3, 0, 0, TAU); ctx.fill();
    ctx.restore();
  },
  // a stone cairn (a trail marker): stacked flat stones
  isCairn(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    const st = [[18, 8], [15, 7], [12, 7], [9, 6], [6, 5]]; let yy = y;
    for (const [w, h] of st) { ctx.fillStyle = '#6a6a74'; ctx.beginPath(); ctx.ellipse(x, yy - h / 2, w, h / 2, 0, 0, TAU); ctx.fill(); ctx.stroke(); yy -= h - 1; }
    ctx.restore();
  },
  // a troll-shaped rock: an old troll the sun caught long ago, nose and all (moss for hair)
  isTrollStone(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    ctx.fillStyle = '#5a5866'; ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.quadraticCurveTo(x - 46, y - 70, x - 10, y - 92); ctx.quadraticCurveTo(x + 30, y - 96, x + 38, y - 50); ctx.quadraticCurveTo(x + 46, y - 20, x + 40, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a6876'; ctx.beginPath(); ctx.ellipse(x + 30, y - 58, 16, 11, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = MOSS; ctx.beginPath(); ctx.ellipse(x - 4, y - 88, 26, 9, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#3a3842'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 6, y - 66); ctx.lineTo(x + 16, y - 64); ctx.stroke();
    ctx.restore();
  },
  // the tell for a hidden-folk door: a tiny painted door in a mossy rock, the window lit when Brady is near
  isElfDoor(ctx, x, y, t, th, d) {
    const p = Game.scene && Game.scene.player, near = p && Math.abs(p.cx - x) < 4 * TS && Math.abs(p.y + p.h - y) < 3 * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#4a4852'; ctx.beginPath(); ctx.ellipse(x, y, 26, 22, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = MOSS; ctx.beginPath(); ctx.ellipse(x, y - 18, 20, 6, 0, Math.PI, 0); ctx.fill();
    ctx.restore();
    IsArt.elfDoor(ctx, x, y, ['#3a7ad8', '#d83a2a', '#2a8a4a'][((d && d.seed) || 0) % 3], near, t);
  },
  // a steaming vent (cosmetic): a crack with puffs
  isVentDecor(ctx, x, y, t) {
    ctx.save(); ctx.fillStyle = '#1a1820'; ctx.fillRect(x - 10, y - 3, 20, 3);
    for (let k = 0; k < 4; k++) IsArt.steam(ctx, x, y - 4, (t * 0.5 + k / 4) % 1, 7);
    ctx.restore();
  },
  // a hot pot: a little steaming pool rimmed with stones
  isHotPot(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = '#6ad0e8'; ctx.beginPath(); ctx.ellipse(x, y - 4, 30, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a7a86'; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.ellipse(x + k * 9, y - 4 + Math.abs(k) * 0.6, 5, 3.4, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    for (let k = 0; k < 3; k++) IsArt.steam(ctx, x - 12 + k * 12, y - 8, (t * 0.4 + k / 3) % 1, 8);
    ctx.restore();
  },
  // a drying rack for fish (food humour: the smell is drawn as green wavy lines)
  isFishRack(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x - 26, y - 56); ctx.moveTo(x + 30, y); ctx.lineTo(x + 26, y - 56); ctx.moveTo(x - 34, y - 52); ctx.lineTo(x + 34, y - 52); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = INK;
    for (let k = 0; k < 4; k++) { const fx = x - 20 + k * 13, sw = Math.sin(t * 1.5 + k) * 0.08; ctx.save(); ctx.translate(fx, y - 52); ctx.rotate(sw); ctx.fillStyle = '#c8b088'; ctx.beginPath(); ctx.ellipse(0, 14, 4, 12, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.strokeStyle = 'rgba(140,200,80,0.6)'; ctx.lineWidth = 1.5; for (let k = 0; k < 2; k++) { const ph = (t * 0.6 + k * 0.5) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.moveTo(x - 6 + k * 12, y - 60 - ph * 20); ctx.quadraticCurveTo(x - 2 + k * 12, y - 66 - ph * 20, x - 6 + k * 12, y - 72 - ph * 20); ctx.stroke(); }
    ctx.restore();
  },
  // the corked geyser (Piwi had it shipped as scenery): a big cork in a steaming hole, a P sticker
  isCorkedGeyser(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    ctx.fillStyle = '#7a8a8a'; ctx.beginPath(); ctx.ellipse(x, y - 2, 42, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c89a5a'; ctx.beginPath(); ctx.moveTo(x - 20, y - 4); ctx.lineTo(x - 24, y - 34); ctx.lineTo(x + 24, y - 34); ctx.lineTo(x + 20, y - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a87a3a'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(x - 14 + (k % 3) * 12, y - 26 + Math.floor(k / 3) * 10, 1.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ff5fa0'; ctx.beginPath(); ctx.arc(x, y - 18, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F8; ctx.textAlign = 'center'; ctx.fillText('P', x, y - 15);
    const sh = Math.sin(t * 30) * (Math.sin(t * 0.8) > 0.6 ? 1.5 : 0);
    for (let k = 0; k < 3; k++) IsArt.steam(ctx, x - 30 + k * 30 + sh, y - 6, (t * 0.7 + k / 3) % 1, 5);
    ctx.restore();
  },
  // a sign about the act (a plain wooden board): drawn in the land's style
  isPoster(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 3, y - 40, 6, 40);
    ctx.fillStyle = '#f2e8d0'; rr(ctx, x - 34, y - 70, 68, 34, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d83a2a'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('TONIGHT ONLY', x, y - 58);
    ctx.fillStyle = INK; ctx.fillText('THE NIGHT TROLL', x, y - 46);
    ctx.restore();
  }
};
const decorLights = { isHut: [80, '#ffd890', 60], isHotPot: [60, '#c8f0ff', 10], isElfDoor: [44, '#ffe28a', 14] };

/* ---------------- door looks: a turf hut's door, a lava-tube mouth, a hidden-folk door in a rock ---------------- */
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'isHutDoor') { IsArt.hut(ctx, x, y, 60, 40, '#d83a2a', t); if (near) { ctx.fillStyle = 'rgba(255,216,144,0.4)'; rr(ctx, x - 9, y - 24, 18, 24, 5); ctx.fill(); } return; }
    if (look === 'isTube') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
      ctx.fillStyle = '#3a3842'; ctx.beginPath(); ctx.ellipse(x, y, 30, 40, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0e0c12'; ctx.beginPath(); ctx.ellipse(x, y, 19, 30, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = MOSS; ctx.beginPath(); ctx.ellipse(x, y - 38, 24, 6, 0, Math.PI, 0); ctx.fill();
      if (near) { ctx.fillStyle = 'rgba(255,140,60,0.25)'; ctx.beginPath(); ctx.ellipse(x, y, 19, 30, 0, Math.PI, 0); ctx.fill(); }
      ctx.restore(); return;
    }
    if (look === 'isFolkDoor') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
      ctx.fillStyle = '#4a4852'; ctx.beginPath(); ctx.ellipse(x, y, 34, 50, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = MOSS; ctx.beginPath(); ctx.ellipse(x, y - 46, 28, 8, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#3a7ad8'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 12, y - 26); ctx.arc(x, y - 26, 12, Math.PI, 0); ctx.lineTo(x + 12, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = near ? '#ffe28a' : '#ffd84a'; ctx.beginPath(); ctx.arc(x, y - 28, 4, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}

/* ---------------- the critters ---------------- */
// an arctic fox in its winter white (a smoky blue one now and then): it crouches in the moss, ears up; its eyes
// glow and its tail wiggles (the tell), then it pounces where Brady was; it lands dizzy (stomp it then)
const foxArt = (ctx, e, x, y, m, t) => {
  const blue = (e.seed || 0) % 3 === 2, fur = blue ? '#6a7488' : '#f4f6f8', fur2 = blue ? '#4a5266' : '#d0dae4';
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.4 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const run = m === 'pounce', st = run ? 0 : Math.sin(t * 9) * 2, wig = m === 'tell' ? Math.sin(t * 30) * 0.6 : Math.sin(t * 2) * 0.15;
  // the big bushy tail
  ctx.save(); ctx.translate(-10, -10); ctx.rotate(-0.5 + wig); ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(-8, -2, 11, 6, 0.2, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = fur2; ctx.beginPath(); ctx.ellipse(-15, -3, 4, 3.4, 0.2, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = fur2; ctx.fillRect(-8 + st, -6, 4, 6); ctx.fillRect(5 - st, -6, 4, 6);
  ctx.fillStyle = fur; ctx.beginPath(); ctx.ellipse(0, -11, 12, 7, run ? -0.2 : 0, 0, TAU); ctx.fill(); ctx.stroke();
  // the head: pointy ears, a little black nose
  ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(8, -26); ctx.lineTo(12, -18); ctx.lineTo(16, -26); ctx.lineTo(17, -15); ctx.lineTo(22, -11); ctx.lineTo(10, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(22, -11, 1.8, 0, TAU); ctx.fill();
  ctx.fillStyle = m === 'tell' ? '#ffd84a' : INK; ctx.beginPath(); ctx.arc(14, -16, 1.6, 0, TAU); ctx.fill();
  ctx.restore();
};
// a puffin out fishing: it flaps round its patch of sky; when Brady is below it squawks and dives (a swoop)
const puffinArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y + 14); ctx.scale(e.dir || 1, 1); ctx.rotate(m === 'swoop' ? 0.5 : 0);
  IsArt.puffin(ctx, 0.95, Math.sin(t * 16), (e.seed || 0) % 2 === 0);
  ctx.restore();
};
// an Icelandic ram: curly horns, a woolly coat; it paws the ground (the tell) and charges
const ramArt = (ctx, e, x, y, m, t) => {
  const dark = (e.seed || 0) % 3 === 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir, m === 'flat' ? 0.45 : 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  const run = m === 'charge', st = run ? Math.sin(t * 24) * 4 : m === 'notice' ? Math.abs(Math.sin(t * 18)) * 3 : Math.sin(t * 6) * 2;
  ctx.fillStyle = '#2a2228'; ctx.fillRect(-10 + st, -8, 4, 8); ctx.fillRect(6 - st, -8, 4, 8);
  ctx.fillStyle = dark ? '#5a4a44' : '#f2ece0'; ctx.beginPath(); for (let k = 0; k < 5; k++) ctx.arc(-11 + k * 5, -17 + (k % 2) * 3, 7, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-1, -16, 14, 8, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.translate(14, -19); ctx.rotate(run ? 0.5 : m === 'notice' ? 0.25 : 0);
  ctx.fillStyle = '#3a3036'; ctx.beginPath(); ctx.ellipse(3, 2, 6, 7.5, 0.4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(0, -3, 5, Math.PI * 0.9, Math.PI * 2.4); ctx.stroke();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, -3, 6.6, Math.PI * 0.9, Math.PI * 2.4); ctx.stroke();
  ctx.fillStyle = m === 'notice' || run ? '#ff5a3a' : '#ffffff'; ctx.beginPath(); ctx.arc(6, 0, 1.6, 0, TAU); ctx.fill();
  ctx.restore();
  if (m === 'notice') { ctx.fillStyle = 'rgba(120,100,80,0.6)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-14 - k * 5, -2 - Math.abs(Math.sin(t * 12 + k)) * 6, 2.4, 0, TAU); ctx.fill(); } }
  ctx.restore();
};
// an arctic tern: white, black cap, red beak, forked tail; it hovers, glints and darts at Brady (it guards its nest)
const ternArt = (ctx, e, x, y, m, t) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(e.dir || 1, 1); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  const f = m === 'dart' ? 0.1 : Math.sin(t * 18);
  ctx.fillStyle = '#e8eef4'; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-10, -14 - f * 10, -20, -10 - f * 12); ctx.lineTo(-2, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-20, -5); ctx.lineTo(-14, 1); ctx.lineTo(-20, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1e1e28'; ctx.beginPath(); ctx.arc(9, -3, 4.5, Math.PI, TAU); ctx.fill();
  ctx.fillStyle = '#e8402a'; ctx.beginPath(); ctx.moveTo(12, -3); ctx.lineTo(20, -1); ctx.lineTo(12, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8eef4'; ctx.beginPath(); ctx.moveTo(2, -2); ctx.quadraticCurveTo(-2, -16 - f * 12, -12, -14 - f * 14); ctx.lineTo(4, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
};
const enemies = {
  isFox: { cls: TourEnemy.make({ w: 26, h: 24, speed: 0.6, behavior: 'pouncer', range: 6, tell: 0.8, art: foxArt, burst: '#f4f6f8' }), place: 'walk' },
  isPuffin: { cls: TourFlyer.make({ w: 26, h: 26, range: 3, speed: 0.9, swoop: true, art: puffinArt, burst: '#ff8a2a',
    onSwoop: e => { e.g.parts.text(e.cx, e.y - 10, 'ARRK!', '#ffd84a'); } }), place: 'fly' },
  isRam: { cls: TourEnemy.make({ w: 30, h: 28, speed: 0.8, behavior: 'charge', range: 7, chargeSpeed: 6.2, windup: 0.7, edgeTurn: true, art: ramArt, burst: '#f2ece0',
    onNotice: e => { e.g.parts.text(e.cx, e.y - 12, 'BAAAH!', '#ffffff'); K.sfx('baa', 'bump', { vol: 0.5, pitch: 0.6 }); } }), place: 'walk' },
  isTern: { cls: TourEnemy.make({ w: 26, h: 16, speed: 0, behavior: 'hoverDart', range: 7, art: ternArt, burst: '#ffffff' }), place: 'fly' }
};

/* ---------------- the route map: a geyser puffing in the pin ---------------- */
const emblem = (ctx, x, y, r, t) => {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#ffffff';
  const k = 0.5 + 0.5 * Math.sin(t * 2.2);
  ctx.beginPath(); ctx.moveTo(-r * 0.25, r * 0.6); ctx.lineTo(-r * 0.12, -r * 0.2 - k * r * 0.4); ctx.lineTo(r * 0.12, -r * 0.2 - k * r * 0.4); ctx.lineTo(r * 0.25, r * 0.6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -r * 0.35 - k * r * 0.4, r * 0.3, 0, TAU); ctx.arc(-r * 0.3, -r * 0.2 - k * r * 0.3, r * 0.2, 0, TAU); ctx.arc(r * 0.3, -r * 0.2 - k * r * 0.3, r * 0.2, 0, TAU); ctx.fill();
  ctx.fillRect(-r * 0.7, r * 0.55, r * 1.4, r * 0.16);
  ctx.restore();
};

/* ---------------- the land's map: sprites and the island's insides ---------------- */
if (typeof TourOWPaint !== 'undefined') Object.assign(TourOWPaint.art, {
  isHutMap(c, r) { IsArt.hut(c, 0, 0, r * 1.6, r * 0.9, '#d83a2a', null); },
  isGeyserMap(c, r) {
    c.fillStyle = '#7a8a8a'; c.beginPath(); c.ellipse(0, 0, r, r * 0.3, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = 'rgba(240,248,255,0.85)'; c.beginPath(); c.moveTo(-r * 0.3, 0); c.lineTo(-r * 0.15, -r * 2.2); c.lineTo(r * 0.15, -r * 2.2); c.lineTo(r * 0.3, 0); c.closePath(); c.fill();
    c.beginPath(); c.arc(0, -r * 2.3, r * 0.5, 0, TAU); c.fill();
  },
  isVolcanoMap(c, r) {
    c.fillStyle = '#3a3238'; c.beginPath(); c.moveTo(-r * 1.4, 0); c.lineTo(-r * 0.4, -r * 1.2); c.lineTo(r * 0.4, -r * 1.2); c.lineTo(r * 1.4, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ff7a1a'; c.beginPath(); c.ellipse(0, -r * 1.2, r * 0.4, r * 0.12, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(200,200,210,0.7)'; c.beginPath(); c.arc(r * 0.2, -r * 1.6, r * 0.3, 0, TAU); c.arc(r * 0.5, -r * 1.9, r * 0.35, 0, TAU); c.fill();
  },
  isGlacierMap(c, r) {
    c.fillStyle = '#f4fbff'; c.beginPath(); c.moveTo(-r * 1.6, 0); c.quadraticCurveTo(-r, -r * 1.2, 0, -r * 1.3); c.quadraticCurveTo(r, -r * 1.2, r * 1.6, 0); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#5ab8e0'; c.lineWidth = 1.4; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * r * 0.4, -r * 0.2); c.lineTo(k * r * 0.45, -r * 0.8); c.stroke(); }
  },
  isBergMap(c, r) { c.fillStyle = '#e8faff'; c.beginPath(); c.moveTo(-r, 0); c.lineTo(-r * 0.5, -r * 0.9); c.lineTo(r * 0.4, -r * 0.7); c.lineTo(r, 0); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#7ad0ee'; c.fillRect(-r * 0.8, -r * 0.25, r * 1.6, r * 0.2); },
  isPuffinMap(c, r) { c.save(); c.translate(0, 0); IsArt.puffin(c, r / 26, 0, true); c.restore(); },
  isHorseMap(c, r) { IsArt.horse(c, 0, 0, '#8a5a3a', '#f6eed8', 0, 1); },
  isTrollMap(c, r) { decor.isTrollStone(c, 0, 0, 0); },
  isPipesMap(c, r) { for (let k = -2; k <= 2; k++) { const h = r * (1.2 - Math.abs(k) * 0.25); c.fillStyle = '#3a3a44'; c.fillRect(k * r * 0.32 - r * 0.15, -h, r * 0.3, h); c.strokeRect(k * r * 0.32 - r * 0.15, -h, r * 0.3, h); } }
});
// the map's little walking animal: a puffin (TourOWScenes.critter knows no puffin, so it is added here)
if (typeof TourOWScenes !== 'undefined') { const cr0 = TourOWScenes.critter; TourOWScenes.critter = function (c, kind, x, y, S, f) { if (kind !== 'isPuffin') return cr0.call(this, c, kind, x, y, S, f); c.save(); c.translate(x, y); c.scale(f || 1, 1); this.shadow(c, 0, 0, 6); IsArt.puffin(c, 0.5, Math.sin(Date.now() / 300) * 0.3, false); c.restore(); }; }
if (typeof TourLandscape !== 'undefined') TourLandscape.looks.is = ['#1a3a5a', '#2a6a9a', '#3a4a3a', MOSS, MOSS_HI, '#e8502a', 'volcano'];

/* ---------------- music: a slow shimmering waltz under the aurora, a bright reel on the lagoon, a stomping riff in
   the rift, a pipe-organ toccata in the volcano, a music box for the hidden folk, a troll's march for the boss ---------------- */
const tracks = {
  tour_is: {
    bpm: 92, bpb: 3, bars: 8, rv: 0.55, dl: 0.22, hx: 0.04,
    ch: 'Am F C G Am F Em E',
    ld: 'E5:6 A5:3 B5:3 | C6:6 A5:6 | G5:3 E5:3 C5:6 | D5:6 G5:6 | E5:6 A5:3 C6:3 | F6:6 E6:3 C6:3 | B5:6 G5:6 | G#5:12',
    li: 'vibes', lv: 0.12,
    bp: 'r.....f.....', bi: 'sub', bv: 0.24,
    ap: 'c.c.c.c.c.c.', ai: 'harp', av: 0.05, ao: 64,
    dr: ['k...........', '......s.....', 'h...h...h...'], dv: 0.18
  },
  tour_is_lagoon: {
    bpm: 126, bars: 8, rv: 0.35, hx: 0.05,
    ch: 'D G D A D G A D',
    ld: 'A5:2 F#5:2 A5:2 D6:2 F#6:4 E6:4 | D6:2 B5:2 G5:2 B5:2 D6:8 | A5:2 F#5:2 A5:2 D6:2 F#6:4 A6:4 | G6:4 E6:4 C#6:8 |' +
        'F#6:2 E6:2 D6:2 C#6:2 D6:4 A5:4 | B5:2 D6:2 G6:2 F#6:2 E6:8 | E6:2 F#6:2 G6:2 E6:2 C#6:4 A5:4 | D6:12 .:4',
    li: 'whistle', lv: 0.12,
    bp: 'r...f...r...f...', bi: 'pluckb', bv: 0.28,
    ap: '..c...c...c...c.', ai: 'pluck', av: 0.05, ao: 60,
    dr: ['k.......k.......', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.3
  },
  tour_is_rift: {
    bpm: 104, bars: 8, rv: 0.3, hx: 0.08,
    ch: 'Em Em C D Em Em Am B7',
    ld: 'E5:4 .:2 E5:2 G5:4 B5:4 | E6:8 D6:4 B5:4 | C6:4 .:2 C6:2 E6:4 G6:4 | F#6:8 D6:8 |' +
        'E6:4 .:2 E6:2 D6:4 B5:4 | G5:8 B5:8 | A5:4 C6:4 E6:4 A6:4 | B6:8 D#6:8',
    li: 'brass', lv: 0.12,
    bp: 'r.r.....r.r.....', bi: 'sub', bv: 0.34,
    ap: 'c.......c.......', ai: 'reed', av: 0.05, ao: 52,
    dr: ['k.k.....k.k.....', '....s.......s...', 'h...h...h...h...'], dv: 0.44
  },
  tour_is_pipes: {
    bpm: 116, bars: 8, rv: 0.6, dl: 0.1, hx: 0.05,
    ch: 'Dm Dm Gm A7 Dm Bb Gm A7',
    ld: 'A5:1 G5:1 A5:6 G5:1 F5:1 E5:1 D5:1 C#5:4 D5:4 | A4:1 G4:1 A4:6 E4:4 F4:2 C#4:2 D4:4 |' +
        'G5:2 A5:2 Bb5:2 A5:2 G5:4 D5:4 | E5:2 C#5:2 A4:2 C#5:2 E5:8 |' +
        'D6:2 C6:2 Bb5:2 A5:2 D6:4 A5:4 | Bb5:2 A5:2 G5:2 F5:2 D5:8 | G5:2 Bb5:2 D6:2 G6:2 F6:4 E6:4 | C#6:8 A5:8',
    li: 'organ', lv: 0.13,
    bp: 'r...r...r...r...', bi: 'sub', bv: 0.3,
    ap: 'c.c.c.c.c.c.c.c.', ai: 'organ', av: 0.04, ao: 50,
    dr: ['k.......k.......', '....s.......s...', '........h.......'], dv: 0.28
  },
  tour_is_folk: {
    bpm: 80, bars: 8, rv: 0.6, dl: 0.25, hx: 0.03,
    ch: 'C Am F G C Am Dm G',
    ld: 'E6:2 G6:2 C7:4 B6:4 G6:4 | A6:4 E6:4 C6:8 | F6:2 A6:2 C7:4 A6:4 F6:4 | G6:8 D6:8 |' +
        'E6:2 G6:2 C7:4 D7:4 E7:4 | C7:4 A6:4 E6:8 | D6:2 F6:2 A6:4 C7:4 B6:4 | G6:12 .:4',
    li: 'mbox', lv: 0.13,
    bp: 'r.......f.......', bi: 'sub', bv: 0.2,
    ap: 'c...c...c...c...', ai: 'harp', av: 0.05, ao: 64,
    dr: ['k...............', '........s.......', '................'], dv: 0.1
  },
  tour_is_boss: {
    bpm: 96, bars: 8, rv: 0.3, hx: 0.08,
    ch: 'Dm Dm Bb A Dm Dm Gm A',
    ld: 'D5:4 D5:2 F5:2 A5:4 D5:4 | C5:4 C5:2 E5:2 G5:8 | Bb4:4 D5:4 F5:4 Bb5:4 | A5:8 C#5:8 |' +
        'D5:2 F5:2 A5:2 D6:2 C6:4 A5:4 | F5:4 D5:4 A4:8 | G4:2 Bb4:2 D5:2 G5:2 F5:4 E5:4 | E5:8 C#5:8',
    li: 'brass', lv: 0.15,
    bp: 'r...r.r.r...r.r.', bi: 'sub', bv: 0.4,
    ap: '....c.......c...', ai: 'reed', av: 0.05, ao: 48,
    dr: ['k...k...k...k...', '....s.......s...', 'h.h.h.h.h.h.h.h.'], dv: 0.5
  }
};

Tour.country({
  id: 'is', colors: COL, tagline: 'Fire and ice: lava fields, glaciers and the northern lights',
  themes, painters, decor, decorLights, enemies, tracks,
  music: { level: 'tour_is', boss: 'tour_is_boss', map: null },
  landmark: 'the great geyser', emblem,
  arrival: 'Brady! Piwi CORKED the great geyser and posted it ahead as scenery. The horses here are tiny and very fluffy. Don\'t walk on the moss. Mind the troll. ♥ C',
  coin: { name: 'PUFFIN EGG', draw(ctx, x, y) {
    ctx.fillStyle = '#f4f0e4'; ctx.beginPath(); ctx.ellipse(x, y, 7, 9, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = '#c8b898'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 1.4, 0, TAU); ctx.arc(x + 2.5, y + 2, 1.2, 0, TAU); ctx.arc(x - 1, y + 4, 1, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - 4, y - 5, 2, 3);
  } },
  levels: []
});
Tour.isKit = { IsArt, INK, COL, MOSS, MOSS_HI, MOSS_DK, GLACIER, GLACIER_DK, SNOW, LAVA, LAVA_HI, BASALT, BASALT_HI, decor };
})();
