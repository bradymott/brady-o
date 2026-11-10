/* ============================================================
   Ecuador: levels in the v2 format (LEVEL_OVERHAUL.md §7.5.2).
   Loads after 29_tour_ec.js and amends the registered country with
   Tour.amend: new stamps, country looks for library objects, and
   the levels rewritten so far (2-2 "Canopy of Baños"). The country
   file itself stays as it is, so the art branch can keep working on
   it; when Ecuador is rewritten this moves into 29_tour_ec.js.
   ============================================================ */
(() => {
const C = Tour.countries.ec;
if (!C) return;
// 2-2's dusk relight of the Amazon canopy (a Blender variant comes later; this is the procedural look)
if (THEMES.ec_amazon && !THEMES.ec_amazon_dusk) {
  THEMES.ec_amazon_dusk = Object.assign({}, THEMES.ec_amazon, {
    name: 'Canopy of Baños', particles: 'fireflies',
    sky: ['#2a1a4a', '#a84a6a', '#ffb070'], horizonGlow: '#ffc890',
    celestial: { type: 'sun', x: 0.78, y: 0.62, r: 30, color: '#ffe0a0', glow: '#ff9a5a' }, stars: 0.25,
    layers: [{ kind: 'ecCanopy', color: '#3a2a4a', base: 300, f: 0.08 }, { kind: 'ecCanopy', color: '#1e1a2a', base: 355, f: 0.25 }],
    fog: '#ff9a7a', darkness: 0.18
  });
}
const leafy = (ctx, x0, y0, w, h, t, part) => {
  for (let k = 0; k < 7; k++) {
    const x = x0 + 3 + k * (w - 6) / 6, sway = Math.sin(t * 1.4 + k) * 2.5 * (1 + part * 3) * (k < 3.5 ? -1 : 1);
    ctx.strokeStyle = k % 2 ? '#2f7a34' : '#45984a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + sway * 0.5, y0 + h * 0.5, x + sway, y0 + h - 2); ctx.stroke();
    for (let q = 0; q < 7; q++) { const yy = y0 + 6 + q * (h - 10) / 6, xx = x + sway * (q / 7); ctx.fillStyle = q % 2 ? '#6ac850' : '#3e9440'; ctx.beginPath(); ctx.ellipse(xx + (q % 2 ? 3.5 : -3.5), yy, 4.2, 2, q % 2 ? 0.7 : -0.7, 0, TAU); ctx.fill(); }
  }
};
Tour.amend('ec', {
  stamps: {
    treehouse: {
      floor: 10,
      rows: [
        '##############################',
        '#............................#',
        '#....o.o.o.o.o.o.............#',
        '#............................#',
        '#............................#',
        '#.................*..........#',
        '#...............-----........#',
        '#.......?....................#',
        '#............................#',
        '#.@.D...........n.......n....#',
        '##############################',
        '##############################'
      ],
      legend: { n: ['decor', 'ecNest'] },
      items: ['oneup'],
      doors: [{ to: 'canopy@treeBack', look: 'ecRopeLadder' }],
      gold: { '*': 'hidden' }
    },
    cascada: {
      floor: 12,
      rows: [
        '########################',
        '#......................#',
        '#..r......r......r.....#',
        '#......................#',
        '#...o.o.o.o.o.o.o......#',
        '#......................#',
        '#......................#',
        '#......................#',
        '#......................#',
        '#......................#',
        '#......................#',
        '#.@.D............g.....#',
        '########################',
        '########################'
      ],
      legend: { r: ['decor', 'ecMistRainbow'] },
      doors: [{ to: 'canopy@fallsBack', look: 'ecWaterCurtain' }]
    }
  },
  skins: {
    // a curtain of leaves with a rope ladder half hidden in it (2-2's way up to the treehouse)
    ecLeafLadder(ctx, e, t) {
      const x0 = e.x, y0 = e.y, w = e.w, h = e.h;
      ctx.save(); ctx.globalAlpha = 1 - (e.part || 0) * 0.6;
      ctx.strokeStyle = '#a07a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + w / 2 - 8, y0 - 10); ctx.lineTo(x0 + w / 2 - 8, y0 + h); ctx.moveTo(x0 + w / 2 + 8, y0 - 10); ctx.lineTo(x0 + w / 2 + 8, y0 + h); ctx.stroke();
      for (let yy = y0; yy < y0 + h; yy += 12) { ctx.fillStyle = '#c8955a'; ctx.fillRect(x0 + w / 2 - 9, yy, 18, 3); }
      leafy(ctx, x0, y0 - 6, w, h + 6, t, e.part || 0);
      ctx.restore();
    },
    // the rope ladder back down from the treehouse (a door look)
    ecRopeLadder(ctx, e, t) {
      const x = e.cx, y = e.y + e.h;
      ctx.fillStyle = 'rgba(20,30,15,0.55)'; rr(ctx, x - 16, y - 52, 32, 52, 10); ctx.fill();
      ctx.strokeStyle = '#a07a44'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x - 9, y - 52); ctx.lineTo(x - 9, y); ctx.moveTo(x + 9, y - 52); ctx.lineTo(x + 9, y); ctx.stroke();
      for (let yy = y - 46; yy < y; yy += 10) { ctx.fillStyle = '#c8955a'; ctx.fillRect(x - 10, yy, 20, 3); }
      ctx.fillStyle = '#4e9d43'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x - 14 + k * 6, y - 52 + (k % 2) * 3, 5, 2.4, k * 0.5, 0, TAU); ctx.fill(); }
    },
    // the back of the waterfall curtain (a door look in the cascada room)
    ecWaterCurtain(ctx, e, t) {
      const x = e.cx, y = e.y + e.h;
      const g = ctx.createLinearGradient(x - 16, 0, x + 16, 0); g.addColorStop(0, 'rgba(150,215,255,0.6)'); g.addColorStop(0.5, 'rgba(230,250,255,0.85)'); g.addColorStop(1, 'rgba(150,215,255,0.6)');
      ctx.fillStyle = g; rr(ctx, x - 16, y - 54, 32, 54, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.2; for (let k = 0; k < 5; k++) { const xx = x - 12 + k * 6, off = (t * 140 + k * 23) % 64; ctx.beginPath(); ctx.moveTo(xx, y - 54 + Math.max(0, off - 12)); ctx.lineTo(xx, y - 54 + Math.min(54, off)); ctx.stroke(); }
    },
    // the swing at the end of the world: a plank seat on two ropes from a giant branch (the catapult)
    ecTreeSwing(ctx, e, t) {
      const x = e.cx, y = e.y + e.h, k = e.k || 0, a = -0.25 - k * 1.2 + Math.sin(t * 1.5) * 0.06 * (1 - k);
      ctx.save();
      ctx.fillStyle = '#4a3020'; rr(ctx, x - 70, y - 150, 160, 14, 7); ctx.fill(); ctx.fillStyle = '#5a9a3a'; for (let q = 0; q < 8; q++) { ctx.beginPath(); ctx.ellipse(x - 60 + q * 20, y - 152, 14, 7, 0, 0, TAU); ctx.fill(); }
      ctx.translate(x, y - 140); ctx.rotate(a);
      ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, 120); ctx.moveTo(14, 0); ctx.lineTo(14, 120); ctx.stroke();
      TourObj.plank(ctx, -24, 118, 48, 9);
      ctx.restore();
    }
  },
  levels: [{
    n: 2, name: 'Canopy of Baños', arch: 'swing', theme: 'ec_amazon_dusk',
    gimmick: 'No ground: swing vine to vine, then ride the swing at the end of the world',
    hint: 'Jump into a vine to grab it, jump again to let go at the top of the swing',
    postcard: 'Brady, the frogs here are see-through. I checked. Twice. ♥ C',
    enemies: [['ecFrog', 3], ['ecCondor', 1]],
    mapCell: [1, 0], mapFrom: 0,
    exits: {
      main: { to: '2-3' },
      secret: { to: '2-7', hint: 'A rainbow hangs in the mist of the last waterfall...' }
    },
    areas: [
      { id: 'canopy', gen: 'islands', W: 210, H: 24, bottomKill: true,
        script: [
          // ① vines between giant trees
          ['itemBlock', { item: 'power', y: 4 }],
          ['vines', { n: 3 }],
          ['branches', {}],
          ['secretDoor', { to: 'treehouse@in', look: 'ecLeafLadder', back: 'treeBack' }],
          ['postcard', { kind: 'must', dy: -4 }],
          'cp',
          // ② the glow; lily pads sink on the river below
          ['gearStand', { item: 'wand' }],
          ['glow', {}],
          ['lilies', { n: 4 }],
          ['enemies', { kind: 'ecFrog', n: 2 }],
          ['ring', { len: 3 }], ['ring', { len: 3 }],
          // ③ the swing at the end of the world, then vines across the falls
          ['catapult', { to: [16, -2], skin: 'ecTreeSwing' }],
          ['postcard', { kind: 'risky', dy: -7 }],
          ['vines', { n: 4 }],
          ['itemBlock', { item: 'oneup', y: 6, hidden: true }],
          ['secretDoor', { to: 'cascada@in', look: 'curtain', back: 'fallsBack' }],
          ['end', { exit: 'main' }]
        ] },
      { id: 'treehouse', gen: 'room', role: 'sub', theme: 'ec_amazon', stamp: 'treehouse' },
      { id: 'cascada', gen: 'room', role: 'secret', theme: 'ec_amazon', stamp: 'cascada' }
    ]
  }]
});
// decor the stamps use: a bird's nest of twigs with blue eggs, a rainbow in the mist
Object.assign(Decor, {
  ecNest(ctx, x, y, t) {
    ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.ellipse(x, y - 6, 15, 7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5a4020'; ctx.lineWidth = 1.2; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(x - 15 + k * 4, y - 9 + (k % 2) * 3); ctx.lineTo(x - 9 + k * 4, y - 3 - (k % 2) * 3); ctx.stroke(); }
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#7ad8f0'; ctx.beginPath(); ctx.ellipse(x - 6 + k * 6, y - 11, 3.4, 4.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 7 + k * 6, y - 14, 1.4, 2); }
  },
  ecMistRainbow(ctx, x, y, t) {
    ctx.save(); ctx.globalAlpha = 0.28 + 0.08 * Math.sin(t * 1.3 + x);
    ['#ff4f6a', '#ffd84a', '#5ae07a', '#38c8ff', '#8a5aff'].forEach((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, y + 30, 40 - k * 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
    ctx.restore();
  }
});
})();
