/* ============================================================
   Burning Man themes — palettes, painted backgrounds and
   animated background life (art cars, lasers, fireworks...)
   ============================================================ */
Object.assign(THEMES, {
  highway: {
    name: 'Highway 447', music: 'w3', particles: 'sand',
    sky: ['#3d7cc9', '#8cc2e8', '#f6dcae'], horizonGlow: '#fff2cf',
    celestial: { type: 'sun', x: 0.78, y: 0.2, r: 42, color: '#fffbe6', glow: '#ffd27a' },
    stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'nvmountains', color: '#9a86a8', base: 300, amp: 120, f: 0.04, blur: true, haze: '#e8d6c6' },
      { kind: 'nvmountains', color: '#b07a5e', base: 330, amp: 70, f: 0.1, haze: '#efd9bf' },
      { kind: 'poles', color: '#5a4636', base: 372, f: 0.24 },
      { kind: 'sage', color: '#c49a6a', base: 400, f: 0.42 }
    ],
    fog: '#f2d8b0', grade: { color: '#ffb066', mode: 'soft-light', a: 0.18 }, bloom: 0.14, shimmer: true,
    ground: { style: 'asphalt', cap: '#3a3940', capHi: '#f2c23a', dirt: '#c2915e', dirt2: '#8a5f38', rock: '#d8ad7a' },
    brick: { style: 'plywood', c1: '#d9b27a', c2: '#a07a48', mortar: '#5a4026' },
    hard: { c1: '#c9a27a', c2: '#8a6a48' },
    semi: { style: 'plank', c1: '#b8844e', c2: '#7a5430' },
    pillar: { c1: '#9a9aa6', c2: '#5a5a66', cap: '#d8d8e0', style: 'pole' },
    accent: '#ffb84a',
    decor: ['sagebrush', 'milemarker', 'sagebrush', 'roadsign', 'cattleskull', 'sagebrush'],
    tint: { glump: '#e07a3a', rollo: '#3a7ac4', spiker: '#ff8a1a', flapper: '#5a5a7a', hopper: '#ff7ad8' }
  },
  springs: {
    name: 'Hot Springs', music: 'w4', particles: 'bubbles', underwater: true,
    sky: ['#0b6f8a', '#0a4a6e', '#062a46'], horizonGlow: '#5af0e0',
    celestial: { type: 'none' }, stars: 0, rays: '#c8fff4',
    layers: [
      { kind: 'geysers', color: '#0e5a72', base: 330, f: 0.08, blur: true },
      { kind: 'terraces', color: '#0b4258', base: 390, f: 0.2 },
      { kind: 'kelp', color: '#073248', base: 420, f: 0.38 }
    ],
    fog: '#2ad6d0', grade: { color: '#3affd8', mode: 'soft-light', a: 0.12 }, bloom: 0.2,
    ground: { style: 'mineral', cap: '#e8743a', capHi: '#ffd08a', dirt: '#9a5a3a', dirt2: '#5a3424', rock: '#c88a5a' },
    brick: { style: 'travertine', c1: '#e8b07a', c2: '#a8744a', mortar: '#6a3e22' },
    hard: { c1: '#d89a6a', c2: '#8a5a3a' },
    semi: { style: 'mossy', c1: '#7ad86a', c2: '#3a8a4a' },
    pillar: { c1: '#e88a4a', c2: '#9a4a2a', cap: '#7ae86a', style: 'geyser' },
    accent: '#3affd8',
    decor: ['steamvent', 'reeds', 'mineralcone', 'reeds', 'rubberduck'],
    tint: { glump: '#ff8a5a', rollo: '#5ac4a8', spiker: '#ff8a1a', flapper: '#3a5aaa', hopper: '#ff7ad8' }
  },
  gate: {
    name: 'Gate Road', music: 'w5', particles: 'sand',
    sky: ['#2a2a6a', '#c8607a', '#ffc27a'], horizonGlow: '#ffd8a0',
    celestial: { type: 'sun', x: 0.3, y: 0.62, r: 58, color: '#fff0c8', glow: '#ff8a5a' },
    stars: 0.3, cloudsDyn: true,
    layers: [
      { kind: 'nvmountains', color: '#5a4a7a', base: 312, amp: 110, f: 0.04, blur: true, haze: '#d88a8a' },
      { kind: 'playaflat', color: '#d8b496', base: 352, f: 0.08, dots: true },
      { kind: 'convoy', color: '#3a2e4a', base: 382, f: 0.2, dyn: 'dustplumes' },
      { kind: 'flagline', color: '#2a2036', base: 412, f: 0.4 }
    ],
    fog: '#ffb08a', grade: { color: '#ff8a5a', mode: 'soft-light', a: 0.2 }, bloom: 0.2, dust: 0.25,
    ground: { style: 'playa', cap: '#e8d4b8', capHi: '#fff4e2', dirt: '#cdb394', dirt2: '#a88c6c', rock: '#bfa384' },
    brick: { style: 'plywood', c1: '#d9b27a', c2: '#a07a48', mortar: '#5a4026' },
    hard: { c1: '#b8a08a', c2: '#7a6452' },
    semi: { style: 'scaffold', c1: '#c8c8d2', c2: '#6a6a78' },
    pillar: { c1: '#3a7ac8', c2: '#1e4a8a', cap: '#e8f0ff', style: 'portapotty' },
    accent: '#ffb84a',
    decor: ['gatesign', 'cone', 'bikerack', 'cone', 'greeterbell', 'cone'],
    tint: { glump: '#e07a3a', rollo: '#3a7ac4', spiker: '#ff8a1a', flapper: '#5a5a7a', hopper: '#ff7ad8' }
  },
  esplanade: {
    name: 'The Esplanade', music: 'w6', particles: 'motes',
    sky: ['#05030f', '#1a0a3a', '#3a1452'], horizonGlow: '#ff3ab8',
    celestial: { type: 'moon', x: 0.82, y: 0.16, r: 22, color: '#ffffff', glow: '#9a8aff' },
    stars: 1, night: true,
    layers: [
      { kind: 'manfar', color: '#1a0e2e', base: 330, f: 0.03, lit: true },
      { kind: 'camps', color: '#160a28', base: 360, f: 0.14, lights: true, dyn: 'lasers' },
      { kind: 'camps', color: '#0c0618', base: 400, f: 0.3, lights: true, big: true, dyn: 'artcars' }
    ],
    fog: '#7a2aff', grade: { color: '#8a3aff', mode: 'soft-light', a: 0.15 }, bloom: 0.42,
    darkness: 0.42,
    ground: { style: 'playa', cap: '#9a8ab0', capHi: '#d8c8f0', dirt: '#5a4e6a', dirt2: '#3a3046', rock: '#6a5e7a', night: true },
    brick: { style: 'plywood', c1: '#8a6a5a', c2: '#5a4038', mortar: '#ff4fd8', tags: true },
    hard: { c1: '#5a5070', c2: '#2e2840' },
    semi: { style: 'neon', c1: '#38f2ff', c2: '#1a1438' },
    pillar: { c1: '#1a1a22', c2: '#0a0a10', cap: '#ff4fd8', style: 'speaker' },
    accent: '#ff4fd8',
    decor: ['ledtree', 'elbike', 'campsignN', 'ledtree', 'firebarrel', 'disco'],
    tint: { glump: '#ff4fd8', rollo: '#38f2ff', spiker: '#ff8a1a', flapper: '#9a4fff', hopper: '#4fff9a' }
  },
  camps: {
    name: 'Theme Camp Row', music: 'w7', particles: 'sand',
    sky: ['#2f86d8', '#8ecbf0', '#fbe8c6'], horizonGlow: '#fff4d8',
    celestial: { type: 'sun', x: 0.18, y: 0.18, r: 40, color: '#fffbe6', glow: '#ffe08a' },
    stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'nvmountains', color: '#8a7aa8', base: 300, amp: 90, f: 0.03, blur: true, haze: '#e6dcd0' },
      { kind: 'camps', color: '#c48a5a', base: 352, f: 0.12, colorful: true, dyn: 'artcars' },
      { kind: 'camps', color: '#8a5a3a', base: 398, f: 0.3, colorful: true, big: true }
    ],
    fog: '#f8e2c0', grade: { color: '#ffcf8a', mode: 'soft-light', a: 0.16 }, bloom: 0.12, shimmer: true,
    ground: { style: 'carpet', cap: '#c83a5a', capHi: '#ffd84a', dirt: '#cdb394', dirt2: '#a88c6c', rock: '#bfa384' },
    brick: { style: 'plywood', c1: '#e0b47a', c2: '#a87a48', mortar: '#5a4026', tags: true },
    hard: { c1: '#c8a882', c2: '#8a6e52' },
    semi: { style: 'shade', c1: '#ff7a5a', c2: '#c43a3a' },
    pillar: { c1: '#3a7ac8', c2: '#1e4a8a', cap: '#e8f0ff', style: 'portapotty' },
    accent: '#ff7a5a',
    decor: ['couch', 'tapestry', 'campsign', 'beanbag', 'bikerack', 'tapestry'],
    tint: { glump: '#ff8a3a', rollo: '#3a8ac4', spiker: '#ff8a1a', flapper: '#7a3aaa', hopper: '#ff7ad8' }
  },
  deepplaya: {
    name: 'Deep Playa', music: 'w8', particles: 'motes',
    sky: ['#04040e', '#121a3a', '#3a3a6a'], horizonGlow: '#7ac8ff',
    celestial: { type: 'moon', x: 0.66, y: 0.2, r: 30, color: '#fffbe8', glow: '#a8c8ff' },
    stars: 1, night: true, milkyway: true,
    layers: [
      { kind: 'nvmountains', color: '#141a34', base: 318, amp: 80, f: 0.03, blur: true },
      { kind: 'sculptures', color: '#0e1228', base: 368, f: 0.12, lit: true, dyn: 'bikes' },
      { kind: 'sculptures', color: '#080a18', base: 410, f: 0.3, lit: true, big: true, dyn: 'dustdevil' }
    ],
    fog: '#3a5aaa', grade: { color: '#4a7aff', mode: 'soft-light', a: 0.14 }, bloom: 0.38, darkness: 0.38, dust: 0.15,
    ground: { style: 'playa', cap: '#8a90b0', capHi: '#c8d0f0', dirt: '#4e5470', dirt2: '#30344a', rock: '#5e6480', night: true },
    brick: { style: 'plywood', c1: '#7a6a62', c2: '#4a3e38', mortar: '#38f2ff', tags: true },
    hard: { c1: '#4e5470', c2: '#2a2e44' },
    semi: { style: 'scaffold', c1: '#a8b0c8', c2: '#4a5068' },
    pillar: { c1: '#3a3e52', c2: '#1a1c28', cap: '#38f2ff', style: 'pole' },
    accent: '#38f2ff',
    decor: ['ledtree', 'lostbike', 'smallart', 'elbike', 'lostbike', 'ledtree'],
    tint: { glump: '#7affd8', rollo: '#ff8a3a', spiker: '#ff8a1a', flapper: '#9a6aff', hopper: '#ff7ad8' }
  },
  temple: {
    name: 'The Temple', music: 'w9', particles: 'petals',
    sky: ['#3a3a7a', '#e8a0a8', '#ffe2b8'], horizonGlow: '#fff0d0',
    celestial: { type: 'sun', x: 0.72, y: 0.6, r: 64, color: '#fff6e0', glow: '#ffb090' },
    stars: 0.4, rays: '#fff0d0', cloudsDyn: true,
    layers: [
      { kind: 'nvmountains', color: '#7a6a9a', base: 306, amp: 90, f: 0.03, blur: true, haze: '#f0c0b8' },
      { kind: 'temple', color: '#6a4a5a', base: 362, f: 0.08, dyn: 'lanterns' },
      { kind: 'playaflat', color: '#e2c4b0', base: 392, f: 0.18 },
      { kind: 'crowd', color: '#4a3040', base: 426, f: 0.4 }
    ],
    fog: '#ffc8b0', grade: { color: '#ffb0a0', mode: 'soft-light', a: 0.2 }, bloom: 0.26,
    ground: { style: 'deck', cap: '#c8946a', capHi: '#f0c89a', dirt: '#cdb394', dirt2: '#a88c6c', rock: '#bfa384' },
    brick: { style: 'lattice', c1: '#d8a878', c2: '#9a6a44', mortar: '#5a3a22' },
    hard: { c1: '#c89a72', c2: '#8a6448' },
    semi: { style: 'plank', c1: '#c8946a', c2: '#8a5e3a' },
    pillar: { c1: '#c89a72', c2: '#7a5434', cap: '#f0c89a', style: 'carved' },
    accent: '#ffb090',
    decor: ['candles', 'prayerflags', 'altar', 'candles', 'photowall'],
    tint: { glump: '#ffa86a', rollo: '#7a8ac4', spiker: '#ff8a1a', flapper: '#8a3aaa', hopper: '#ff7ad8' }
  },
  burn: {
    name: 'The Burn', music: 'w10', particles: 'embers',
    sky: ['#050208', '#2a0a14', '#7a1e10'], horizonGlow: '#ff6a1a',
    celestial: { type: 'none' }, stars: 0.7, night: true,
    layers: [
      { kind: 'nvmountains', color: '#1e0a10', base: 320, amp: 70, f: 0.03, blur: true },
      { kind: 'burnman', color: '#1a0808', base: 380, f: 0.06, dyn: 'flames' },
      { kind: 'crowd', color: '#0e0406', base: 410, f: 0.22, glow: true, dyn: 'fireworks' },
      { kind: 'crowd', color: '#060203', base: 434, f: 0.42 }
    ],
    fog: '#ff4a1a', grade: { color: '#ff6a2a', mode: 'soft-light', a: 0.2 }, bloom: 0.45, darkness: 0.35,
    ground: { style: 'ember', cap: '#3a2a2a', capHi: '#ff7a2a', dirt: '#2a1a1a', dirt2: '#140a0a', rock: '#3a2222' },
    brick: { style: 'plywood', c1: '#6a4a3a', c2: '#3a2620', mortar: '#ff6a2a', charred: true },
    hard: { c1: '#4a3a3a', c2: '#2a1e1e' },
    semi: { style: 'scaffold', c1: '#8a8a96', c2: '#3a3a44' },
    pillar: { c1: '#4a3a3a', c2: '#1e1414', cap: '#ff6a2a', style: 'barrel' },
    accent: '#ff7a2a',
    decor: ['firebarrel', 'fireart', 'ledtree', 'firebarrel', 'elbike'],
    tint: { glump: '#ff6a3a', rollo: '#c8c8d8', spiker: '#ff8a1a', flapper: '#c43a3a', hopper: '#ffd84a' }
  },
  sunrise: {
    name: 'Sunrise Set', music: 'secret', particles: 'confetti',
    sky: ['#1a1a4a', '#c86aa8', '#ffd08a'], horizonGlow: '#fff0c0',
    celestial: { type: 'sun', x: 0.5, y: 0.7, r: 76, color: '#fff4d0', glow: '#ff9a7a' },
    stars: 0.5, cloudsDyn: true,
    layers: [
      { kind: 'nvmountains', color: '#5a4a8a', base: 330, amp: 90, f: 0.03, blur: true, haze: '#e8a0b0' },
      { kind: 'soundcar', color: '#2a1a3a', base: 380, f: 0.1, dyn: 'lasers' },
      { kind: 'crowd', color: '#1a0e24', base: 426, f: 0.32 }
    ],
    fog: '#ffb0c0', grade: { color: '#ff9ab0', mode: 'soft-light', a: 0.2 }, bloom: 0.3,
    ground: { style: 'playa', cap: '#e8c8c0', capHi: '#fff0e8', dirt: '#c8a8a0', dirt2: '#a08078', rock: '#b8988e' },
    brick: { style: 'plywood', c1: '#e0b47a', c2: '#a87a48', mortar: '#5a4026', tags: true },
    hard: { c1: '#c8a8b8', c2: '#8a6a7a' },
    semi: { style: 'cloud', c1: '#fff0f4', c2: '#e8a8c0' },
    pillar: { c1: '#1a1a22', c2: '#0a0a10', cap: '#ffd84a', style: 'speaker' },
    accent: '#ff9ab0',
    decor: ['beanbag', 'ledtree', 'disco', 'tapestry'],
    tint: { glump: '#ff6a9a', rollo: '#c88aff', spiker: '#ffa86a', flapper: '#6a3a8a', hopper: '#ffd06a' }
  },
  trip: {
    name: 'Trip Dimension', music: 'glitch', particles: 'motes',
    sky: ['#2a0a5a', '#ff3ab8', '#ffd23a'], horizonGlow: '#3affd8',
    celestial: { type: 'none' }, stars: 0.6, trippy: true,
    layers: [
      { kind: 'tripwaves', color: '#7a2aff', base: 300, f: 0.06 },
      { kind: 'shrooms', color: '#3a0a5a', base: 380, f: 0.16 },
      { kind: 'shrooms', color: '#1a0430', base: 420, f: 0.34, big: true }
    ],
    fog: '#ff3ab8', grade: { color: '#ff3ab8', mode: 'overlay', a: 0.12 }, bloom: 0.4,
    ground: { style: 'carpet', cap: '#7a2aff', capHi: '#3affd8', dirt: '#3a1a5a', dirt2: '#1e0a30', rock: '#5a2a7a' },
    brick: { style: 'pixel', c1: '#ff3ab8', c2: '#7a0a66', mortar: '#000000' },
    hard: { c1: '#3affd8', c2: '#0a7a6a' },
    semi: { style: 'neon', c1: '#ffd23a', c2: '#3a1a5a' },
    pillar: { c1: '#ff3ab8', c2: '#7a0a66', cap: '#3affd8', style: 'shroom' },
    accent: '#3affd8',
    decor: ['bigshroom', 'eyeplant', 'bigshroom', 'ledtree'],
    tint: { glump: '#3affd8', rollo: '#ffd23a', spiker: '#ffffff', flapper: '#ff3ab8', hopper: '#7a2aff' }
  }
});
// update the existing themes that the journey reuses
Object.assign(THEMES.suburbs, { name: 'Packing Night', grade: { color: '#6a5aff', mode: 'soft-light', a: 0.14 }, bloom: 0.3, darkness: 0.25, night: true,
  decor: ['lamp', 'car', 'bush', 'campgear', 'mailbox', 'bush', 'bikerack'] });
Object.assign(THEMES.neon, { name: 'Reno Supply Run', grade: { color: '#ff2e88', mode: 'soft-light', a: 0.14 }, bloom: 0.45, night: true });
THEMES.neon.layers = [
  { kind: 'casinos', color: '#2a0f4a', base: 330, f: 0.08, blur: true },
  { kind: 'casinos', color: '#170830', base: 380, f: 0.2, signs: true, dyn: 'searchlights' },
  { kind: 'rooftops', color: '#0c0420', base: 410, f: 0.42 }
];
THEMES.neon.decor = ['neonsign', 'slotmachine', 'cart', 'neonsign', 'acunit'];
THEMES.w22.grade = { color: '#ff9ab0', mode: 'soft-light', a: 0.16 }; THEMES.w22.bloom = 0.25;

/* ---------- painters ---------- */
function geodome(ctx, x, y, r, col, line) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, Math.PI, TAU); ctx.closePath(); ctx.fill();
  if (line) {
    ctx.strokeStyle = line; ctx.lineWidth = 1;
    for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x, y, r, r * k / 4, 0, Math.PI, TAU); ctx.stroke(); }
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * r * 0.42, y); ctx.lineTo(x + k * r * 0.16, y - r * Math.cos(k * 0.42)); ctx.stroke(); }
  }
}
Object.assign(BGPaint, {
  nvmountains(ctx, L, rng, H) {
    const pts = []; let x = 0;
    while (x < BG_W) { pts.push([x, L.base - L.amp * (0.25 + 0.75 * Math.pow(rng(), 0.8))]); x += 26 + rng() * 70; }
    const first = pts[0];
    const ys = xx => {
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = i + 1 < pts.length ? pts[i + 1] : [BG_W, first[1]];
        if (xx >= a[0] && xx <= b[0]) { const k = (xx - a[0]) / (b[0] - a[0] || 1); return lerp(a[1], b[1], k * k * (3 - 2 * k)); }
      }
      return first[1];
    };
    const g = ctx.createLinearGradient(0, L.base - L.amp, 0, H);
    g.addColorStop(0, shade(L.color, 0.12)); g.addColorStop(0.5, L.color); g.addColorStop(1, shade(L.color, -0.15));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let xx = 0; xx <= BG_W; xx += 3) ctx.lineTo(xx, ys(xx) + Math.sin(xx * 0.3) * 1.2);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    // ridge lighting and erosion gullies
    ctx.save(); ctx.clip();
    ctx.globalAlpha = 0.16; ctx.strokeStyle = shade(L.color, 0.5); ctx.lineWidth = 1.2;
    for (let i = 0; i < 40; i++) {
      const gx = rng() * BG_W, gy = ys(gx);
      ctx.beginPath(); ctx.moveTo(gx, gy + 2); ctx.quadraticCurveTo(gx + 6, gy + 18, gx + 2 + rng() * 10, gy + 30 + rng() * 40); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (L.haze) { const hz = ctx.createLinearGradient(0, L.base - L.amp * 0.4, 0, L.base + 20); hz.addColorStop(0, rgba(L.haze, 0)); hz.addColorStop(1, rgba(L.haze, 0.55)); ctx.fillStyle = hz; ctx.fillRect(0, L.base - L.amp, BG_W, H); }
    ctx.restore();
  },
  playaflat(ctx, L, rng, H) {
    const g = ctx.createLinearGradient(0, L.base, 0, H);
    g.addColorStop(0, shade(L.color, 0.1)); g.addColorStop(1, shade(L.color, -0.1));
    ctx.fillStyle = g; ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.fillStyle = rgba(shade(L.color, 0.4), 0.6); ctx.fillRect(0, L.base, BG_W, 1.5);
    if (L.dots) {
      // a far-away city of camps on the horizon
      for (let i = 0; i < 120; i++) {
        const x = rng() * BG_W, h = 1 + rng() * 5, w = 2 + rng() * 6;
        ctx.fillStyle = rgba(shade(L.color, -0.45), 0.5 + rng() * 0.3);
        if (rng() < 0.3) { ctx.beginPath(); ctx.arc(x, L.base, w * 0.6, Math.PI, TAU); ctx.fill(); } else ctx.fillRect(x, L.base - h, w, h);
      }
    }
  },
  poles(ctx, L, rng, H) {
    const n = 6, sp = BG_W / n;
    const top = L.base - 120;
    ctx.strokeStyle = rgba(L.color, 0.85); ctx.lineWidth = 1.1;
    for (let w = 0; w < 3; w++) {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const x0 = i * sp, x1 = (i + 1) * sp, y = top + 6 + w * 7;
        if (i === 0) ctx.moveTo(x0, y);
        if (i < n) ctx.quadraticCurveTo((x0 + x1) / 2, y + 22, x1, y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < n; i++) {
      const x = i * sp + 4;
      ctx.fillStyle = L.color; ctx.fillRect(x - 3, top, 6, L.base - top + 30);
      ctx.fillRect(x - 22, top + 6, 44, 4); ctx.fillRect(x - 16, top + 18, 32, 3);
      ctx.fillStyle = rgba(shade(L.color, 0.4), 0.6); ctx.fillRect(x - 3, top, 2, L.base - top);
    }
  },
  sage(ctx, L, rng, H) {
    const n = periodicNoise(rng, 3);
    ctx.fillStyle = vgrad(ctx, L.base - 20, H, shade(L.color, 0.1), shade(L.color, -0.2));
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 8) ctx.lineTo(x, L.base - 10 - n(x) * 10);
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 70; i++) {
      const x = rng() * BG_W, y = L.base - 10 - n(x) * 10 + 2, r = 4 + rng() * 8;
      wrapDraw(x - r, r * 2, X => {
        ctx.fillStyle = mix('#6a7a5a', L.color, 0.3);
        ctx.beginPath(); ctx.arc(X + r, y, r, Math.PI, TAU); ctx.arc(X + r * 0.4, y, r * 0.7, Math.PI, TAU); ctx.arc(X + r * 1.6, y, r * 0.6, Math.PI, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(220,230,200,0.25)'; ctx.beginPath(); ctx.arc(X + r * 0.9, y - r * 0.5, r * 0.35, 0, TAU); ctx.fill();
      });
    }
  },
  convoy(ctx, L, rng, H) {
    ctx.fillStyle = shade(L.color, 0.1); ctx.fillRect(0, L.base - 2, BG_W, H);
    let x = 0;
    while (x < BG_W - 10) {
      const kind = rng(), bx = x;
      let w;
      if (kind < 0.35) w = 70 + rng() * 30; else if (kind < 0.65) w = 46; else w = 36;
      const seed = Math.floor(rng() * 1e6);
      wrapDraw(bx, w + 10, X => {
        const r2 = mulberry32(seed);
        ctx.fillStyle = L.color;
        if (kind < 0.35) { // RV
          rr(ctx, X, L.base - 34, w, 30, 6); ctx.fill();
          ctx.fillRect(X + w - 14, L.base - 26, 14, 22);
          ctx.fillStyle = rgba('#ffd8a0', 0.35); for (let k = 0; k < 3; k++) ctx.fillRect(X + 8 + k * 16, L.base - 28, 10, 6);
        } else if (kind < 0.65) { // car with roof box & bikes
          rr(ctx, X, L.base - 18, w, 13, 4); ctx.fill(); rr(ctx, X + 8, L.base - 27, w - 18, 10, 4); ctx.fill();
          rr(ctx, X + 10, L.base - 33, w - 22, 6, 3); ctx.fill();
          ctx.strokeStyle = L.color; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(X - 4, L.base - 22, 5, 0, TAU); ctx.arc(X + 6 - 4, L.base - 22, 5, 0, TAU); ctx.stroke();
        } else { // box truck / bus
          ctx.fillRect(X, L.base - 30, w, 26); ctx.fillRect(X + w, L.base - 18, 10, 14);
          if (r2() < 0.5) { ctx.fillStyle = rgba(['#ff7ab0', '#7ad8ff', '#ffd84a'][Math.floor(r2() * 3)], 0.35); ctx.fillRect(X + 4, L.base - 26, w - 8, 8); }
        }
        ctx.fillStyle = shade(L.color, -0.4);
        ctx.beginPath(); ctx.arc(X + 8, L.base - 3, 4, 0, TAU); ctx.arc(X + w - 6, L.base - 3, 4, 0, TAU); ctx.fill();
      });
      x += w + 12 + rng() * 18;
    }
  },
  flagline(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    const cols = ['#ff4f6a', '#ffd84a', '#38c8ff', '#7aff8a', '#c87aff', '#ff9a3a'];
    for (let x = 12; x < BG_W; x += 34 + rng() * 20) {
      const h = 40 + rng() * 50, bx = x;
      wrapDraw(bx, 30, X => {
        ctx.fillStyle = L.color; ctx.fillRect(X, L.base - h, 2.5, h);
        ctx.fillStyle = rgba(cols[Math.floor(rng() * cols.length)], 0.75);
        ctx.beginPath(); ctx.moveTo(X + 2.5, L.base - h); ctx.quadraticCurveTo(X + 12, L.base - h - 4, X + 22, L.base - h + 3); ctx.lineTo(X + 2.5, L.base - h + 12); ctx.fill();
      });
    }
  },
  camps(ctx, L, rng, H) {
    const big = L.big ? 1.9 : 1.3;
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    const cols = ['#ff5a6a', '#ffd84a', '#38c8ff', '#7aff8a', '#c87aff', '#ff9a3a', '#ffffff'];
    let x = 0;
    while (x < BG_W) {
      const kind = rng(), bx = x, seed = Math.floor(rng() * 1e6);
      let w = 0;
      if (kind < 0.28) w = (30 + rng() * 26) * big;      // geodesic dome
      else if (kind < 0.5) w = (50 + rng() * 40) * big;  // shade structure
      else if (kind < 0.66) w = 30 * big;                // tent
      else if (kind < 0.8) w = 56 * big;                 // RV
      else w = 22 * big;                                 // tower / sign
      wrapDraw(bx, w + 10, X => {
        const r2 = mulberry32(seed);
        const c = cols[Math.floor(r2() * cols.length)];
        ctx.fillStyle = L.color;
        if (kind < 0.28) {
          geodome(ctx, X + w / 2, L.base, w / 2, L.colorful ? mix(L.color, '#f4f0e8', 0.55) : L.color, L.colorful ? rgba(L.color, 0.5) : (L.lights ? rgba(c, 0.6) : null));
          if (L.lights) { ctx.fillStyle = rgba(c, 0.85); for (let k = 0; k < 6; k++) { const a = Math.PI + (k + 0.5) / 6 * Math.PI; ctx.beginPath(); ctx.arc(X + w / 2 + Math.cos(a) * w * 0.5, L.base + Math.sin(a) * w * 0.5, 1.6, 0, TAU); ctx.fill(); } }
        } else if (kind < 0.5) {
          const h = (34 + r2() * 20) * big;
          ctx.fillRect(X, L.base - h, 3, h); ctx.fillRect(X + w - 3, L.base - h, 3, h);
          ctx.fillStyle = L.colorful ? rgba(c, 0.85) : shade(L.color, 0.12);
          ctx.beginPath(); ctx.moveTo(X - 4, L.base - h); ctx.lineTo(X + w + 4, L.base - h - 6); ctx.lineTo(X + w + 4, L.base - h + 4);
          for (let k = 6; k >= 0; k--) ctx.lineTo(X + w * k / 6, L.base - h + 4 + (k % 2) * 4);
          ctx.closePath(); ctx.fill();
          if (L.lights) { ctx.strokeStyle = rgba(c, 0.9); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X, L.base - h + 6); ctx.quadraticCurveTo(X + w / 2, L.base - h + 16, X + w, L.base - h + 4); ctx.stroke();
            ctx.fillStyle = rgba('#fff2c0', 0.9); for (let k = 1; k < 6; k++) { const t = k / 6; ctx.beginPath(); ctx.arc(X + w * t, L.base - h + 6 + Math.sin(t * Math.PI) * 8, 1.3, 0, TAU); ctx.fill(); } }
          ctx.fillStyle = L.color; rr(ctx, X + w * 0.25, L.base - 10 * big, w * 0.4, 10 * big, 3); ctx.fill(); // couch
        } else if (kind < 0.66) {
          ctx.fillStyle = L.colorful ? mix(c, L.color, 0.35) : L.color;
          ctx.beginPath(); ctx.moveTo(X, L.base); ctx.lineTo(X + w / 2, L.base - w * 0.75); ctx.lineTo(X + w, L.base); ctx.closePath(); ctx.fill();
          ctx.fillStyle = rgba('#000000', 0.25); ctx.beginPath(); ctx.moveTo(X + w / 2, L.base - w * 0.75); ctx.lineTo(X + w * 0.56, L.base); ctx.lineTo(X + w * 0.44, L.base); ctx.fill();
        } else if (kind < 0.8) {
          rr(ctx, X, L.base - 26 * big, w, 24 * big, 5); ctx.fill();
          ctx.fillStyle = L.lights ? rgba('#ffd8a0', 0.75) : rgba('#ffffff', 0.25);
          for (let k = 0; k < 3; k++) ctx.fillRect(X + 6 + k * 15 * big, L.base - 20 * big, 9 * big, 6 * big);
          if (L.colorful) { ctx.fillStyle = rgba(c, 0.8); ctx.fillRect(X, L.base - 12 * big, w, 3); }
        } else {
          const h = (60 + r2() * 50) * big;
          ctx.fillRect(X + w / 2 - 2, L.base - h, 4, h);
          ctx.fillStyle = L.lights ? rgba(c, 0.9) : rgba(c, 0.85);
          ctx.beginPath(); ctx.moveTo(X + w / 2 + 2, L.base - h); ctx.lineTo(X + w / 2 + 20, L.base - h + 6); ctx.lineTo(X + w / 2 + 2, L.base - h + 12); ctx.fill();
          if (L.lights) { ctx.fillStyle = rgba(c, 0.25); ctx.beginPath(); ctx.arc(X + w / 2, L.base - h, 9, 0, TAU); ctx.fill(); }
        }
      });
      x += w + 2 + rng() * 10;
    }
  },
  manfar(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    const mx = BG_W * 0.5;
    // pavilion base
    ctx.beginPath(); ctx.moveTo(mx - 60, L.base); ctx.lineTo(mx - 34, L.base - 40); ctx.lineTo(mx + 34, L.base - 40); ctx.lineTo(mx + 60, L.base); ctx.fill();
    drawManFigure(ctx, mx, L.base - 40, 1, L.color, L.lit ? '#38f2ff' : null);
  },
  burnman(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    const mx = BG_W * 0.5;
    ctx.beginPath(); ctx.moveTo(mx - 70, L.base); ctx.lineTo(mx - 40, L.base - 46); ctx.lineTo(mx + 40, L.base - 46); ctx.lineTo(mx + 70, L.base); ctx.fill();
    drawManFigure(ctx, mx, L.base - 46, 1.25, L.color, '#ff8a3a');
  },
  temple(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    const tx = BG_W * 0.42;
    // ornate wooden temple: tiered roofs around a central spire, lattice walls
    const tier = (y, w, h) => { ctx.beginPath(); ctx.moveTo(tx - w, y); ctx.quadraticCurveTo(tx - w * 0.5, y - h * 0.3, tx - w * 0.25, y - h); ctx.lineTo(tx + w * 0.25, y - h); ctx.quadraticCurveTo(tx + w * 0.5, y - h * 0.3, tx + w, y); ctx.closePath(); ctx.fill(); };
    ctx.fillStyle = L.color;
    ctx.fillRect(tx - 120, L.base - 34, 240, 34);
    tier(L.base - 34, 140, 40); tier(L.base - 70, 100, 36); tier(L.base - 102, 66, 34); tier(L.base - 132, 36, 40);
    ctx.fillRect(tx - 3, L.base - 210, 6, 80);
    ctx.save(); ctx.globalCompositeOperation = 'destination-out';
    for (let i = -5; i <= 5; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(tx + i * 20, L.base - 14 - j * 10, 3, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = rgba('#fff0c8', 0.35);
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(tx + i * 24, L.base - 4); ctx.lineTo(tx + i * 24, L.base - 24); ctx.arc(tx + i * 24 + 4, L.base - 24, 4, Math.PI, 0); ctx.lineTo(tx + i * 24 + 8, L.base - 4); ctx.fill(); }
    // wooden side pavilions
    for (const s of [-1, 1]) { const px = tx + s * 230; ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(px - 30, L.base); ctx.lineTo(px, L.base - 60); ctx.lineTo(px + 30, L.base); ctx.fill(); }
  },
  sculptures(ctx, L, rng, H) {
    const big = L.big ? 1.6 : 1;
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    const kinds = ['hand', 'whale', 'arches', 'head', 'flower', 'octa', 'dancer', 'ring'];
    let x = 30;
    while (x < BG_W - 40) {
      const k = kinds[Math.floor(rng() * kinds.length)], s = (0.7 + rng() * 0.6) * big, bx = x, lc = ['#38f2ff', '#ff4fd8', '#ffd84a', '#7aff8a'][Math.floor(rng() * 4)];
      wrapDraw(bx - 60 * s, 120 * s, X => drawSculpture(ctx, X + 60 * s, L.base, s, k, L.color, L.lit ? lc : null));
      x += (120 + rng() * 140) * s;
    }
  },
  crowd(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let x = 0; x < BG_W; x += 9 + rng() * 6) {
      const h = 16 + rng() * 14, bx = x, hat = rng();
      wrapDraw(bx, 16, X => {
        ctx.fillStyle = L.color;
        ctx.beginPath(); ctx.arc(X + 5, L.base - h, 5.5, 0, TAU); ctx.fill(); ctx.fillRect(X - 1, L.base - h + 3, 12, h);
        if (hat < 0.2) { ctx.fillRect(X - 1, L.base - h - 7, 12, 3); ctx.fillRect(X + 1, L.base - h - 12, 8, 6); }
        else if (hat < 0.35) { ctx.beginPath(); ctx.moveTo(X + 1, L.base - h - 3); ctx.lineTo(X + 3, L.base - h - 12); ctx.lineTo(X + 6, L.base - h - 4); ctx.moveTo(X + 6, L.base - h - 4); ctx.lineTo(X + 9, L.base - h - 12); ctx.lineTo(X + 11, L.base - h - 3); ctx.fill(); }
        if (L.glow && rng() < 0.25) { ctx.fillStyle = rgba(['#ffd84a', '#ff4fd8', '#38f2ff'][Math.floor(rng() * 3)], 0.8); ctx.fillRect(X + 2, L.base - h + 6, 6, 1.5); }
      });
    }
  },
  casinos(ctx, L, rng, H) {
    let x = 0;
    const words = ['LUCKY', 'JACKPOT', 'BUFFET', '24/7', 'MEGA-MART', 'SLOTS', 'HOTEL', 'GOLD'];
    while (x < BG_W) {
      const w = 50 + rng() * 70, h = 90 + rng() * 170, bx = x, seed = Math.floor(rng() * 1e6), word = words[Math.floor(rng() * words.length)];
      wrapDraw(bx, w, X => {
        const r2 = mulberry32(seed);
        ctx.fillStyle = L.color; ctx.fillRect(X, L.base - h, w, h + H);
        if (r2() < 0.5) { ctx.beginPath(); ctx.moveTo(X, L.base - h); ctx.lineTo(X + w / 2, L.base - h - 24); ctx.lineTo(X + w, L.base - h); ctx.fill(); }
        // neon floor bands
        const bc = ['#ff4fd8', '#ffd23f', '#38f2ff', '#ff6a3a'][Math.floor(r2() * 4)];
        ctx.fillStyle = rgba(bc, 0.6);
        for (let y = L.base - h + 14; y < L.base; y += 22) ctx.fillRect(X + 3, y, w - 6, 1.5);
        ctx.fillStyle = rgba('#ffe6a0', 0.45);
        for (let y = L.base - h + 20; y < L.base - 6; y += 11) for (let xx = X + 6; xx < X + w - 6; xx += 9) if (r2() < 0.45) ctx.fillRect(xx, y, 4, 5);
        if (L.signs && r2() < 0.7) {
          ctx.save(); ctx.font = `${Math.min(14, w / word.length * 1.5)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.shadowColor = bc; ctx.shadowBlur = 10; ctx.fillStyle = bc;
          ctx.fillText(word, X + w / 2, L.base - h + 30 + r2() * 30); ctx.restore();
        }
      });
      x += w + 4 + rng() * 10;
    }
  },
  geysers(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let i = 0; i < 5; i++) {
      const gx = i * BG_W / 5 + rng() * 60, h = 50 + rng() * 70, w = 40 + rng() * 40;
      wrapDraw(gx - w, w * 2, X => {
        const cx = X + w;
        const g = ctx.createLinearGradient(0, L.base - h, 0, L.base);
        g.addColorStop(0, '#2a8a6a'); g.addColorStop(0.35, '#c85a2a'); g.addColorStop(0.7, '#8a3a2a'); g.addColorStop(1, L.color);
        ctx.fillStyle = g; ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.moveTo(cx - w, L.base); ctx.quadraticCurveTo(cx - w * 0.3, L.base - h * 0.4, cx - 6, L.base - h); ctx.lineTo(cx + 6, L.base - h); ctx.quadraticCurveTo(cx + w * 0.3, L.base - h * 0.4, cx + w, L.base); ctx.fill();
        ctx.globalAlpha = 1;
      });
    }
  },
  terraces(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 0;
    while (x < BG_W) {
      const w = 60 + rng() * 80, steps = 3 + Math.floor(rng() * 3), bx = x;
      wrapDraw(bx, w, X => {
        for (let s = 0; s < steps; s++) {
          const sw = w - s * 14, sy = L.base - s * 10;
          ctx.fillStyle = s % 2 ? shade(L.color, 0.08) : shade(L.color, 0.16);
          rr(ctx, X + s * 7, sy - 10, sw, 12, 5); ctx.fill();
          ctx.fillStyle = 'rgba(120,255,230,0.25)'; ctx.fillRect(X + s * 7 + 3, sy - 9, sw - 6, 1.5);
        }
      });
      x += w + 20 + rng() * 40;
    }
  },
  soundcar(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    const sx = BG_W * 0.55;
    // giant sound art car: speaker walls, a whale-like hull and a DJ booth up top
    ctx.beginPath(); ctx.moveTo(sx - 150, L.base); ctx.quadraticCurveTo(sx - 160, L.base - 60, sx - 90, L.base - 74); ctx.lineTo(sx + 120, L.base - 74); ctx.quadraticCurveTo(sx + 170, L.base - 50, sx + 160, L.base); ctx.fill();
    for (let i = 0; i < 6; i++) { ctx.fillRect(sx - 90 + i * 34, L.base - 120, 30, 46); }
    rr(ctx, sx - 30, L.base - 150, 60, 30, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.arc(sx - 75 + i * 34, L.base - 108 + j * 22, 8, 0, TAU); ctx.fill(); }
  },
  tripwaves(ctx, L, rng, H) {
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `hsla(${i * 45},90%,60%,0.35)`; ctx.lineWidth = 10;
      ctx.beginPath();
      for (let x = 0; x <= BG_W; x += 8) { const y = L.base - 140 + i * 22 + Math.sin(x / BG_W * TAU * 3 + i) * 18; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
  },
  shrooms(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 0;
    while (x < BG_W) {
      const s = (0.6 + rng() * 0.8) * (L.big ? 1.6 : 1), bx = x, hue = Math.floor(rng() * 360);
      wrapDraw(bx - 30 * s, 60 * s, X => {
        const cx = X + 30 * s;
        ctx.fillStyle = L.color; ctx.fillRect(cx - 5 * s, L.base - 50 * s, 10 * s, 50 * s);
        ctx.fillStyle = `hsla(${hue},80%,45%,0.6)`; ctx.beginPath(); ctx.ellipse(cx, L.base - 50 * s, 30 * s, 22 * s, 0, Math.PI, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(cx - 16 * s + k * 10 * s, L.base - 58 * s - (k % 2) * 6 * s, 3 * s, 0, TAU); ctx.fill(); }
      });
      x += (50 + rng() * 60) * s;
    }
  }
});

function drawManFigure(ctx, x, y, s, col, lit) {
  // a tall stylised wooden figure with arms raised (the festival's effigy, drawn generically)
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-5, -50); ctx.lineTo(5, -50); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill(); // legs
  ctx.beginPath(); ctx.moveTo(-9, -50); ctx.lineTo(-8, -88); ctx.lineTo(8, -88); ctx.lineTo(9, -50); ctx.closePath(); ctx.fill();  // torso
  ctx.beginPath(); ctx.moveTo(-8, -86); ctx.lineTo(-30, -112); ctx.lineTo(-26, -116); ctx.lineTo(-6, -92); ctx.fill();          // arms raised
  ctx.beginPath(); ctx.moveTo(8, -86); ctx.lineTo(30, -112); ctx.lineTo(26, -116); ctx.lineTo(6, -92); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-7, -90); ctx.lineTo(0, -108); ctx.lineTo(7, -90); ctx.closePath(); ctx.fill();                   // diamond head
  ctx.beginPath(); ctx.moveTo(0, -108); ctx.lineTo(-6, -96); ctx.lineTo(0, -84); ctx.lineTo(6, -96); ctx.fill();
  if (lit) {
    ctx.shadowColor = lit; ctx.shadowBlur = 10; ctx.strokeStyle = lit; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-5, -50); ctx.lineTo(-8, -88); ctx.lineTo(-30, -112); ctx.moveTo(10, 0); ctx.lineTo(5, -50); ctx.lineTo(8, -88); ctx.lineTo(30, -112);
    ctx.moveTo(0, -108); ctx.lineTo(-6, -96); ctx.lineTo(0, -84); ctx.lineTo(6, -96); ctx.closePath(); ctx.stroke();
  }
  ctx.restore();
}

function drawSculpture(ctx, x, y, s, kind, col, lit) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
  switch (kind) {
    case 'hand':
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-16, -60); ctx.lineTo(16, -60); ctx.lineTo(18, 0); ctx.fill();
      for (let i = 0; i < 4; i++) { ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-12 + i * 8, -60); ctx.lineTo(-14 + i * 9, -96 - (i === 1 || i === 2 ? 8 : 0)); ctx.stroke(); }
      ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-16, -44); ctx.lineTo(-30, -70); ctx.stroke(); break;
    case 'whale':
      ctx.lineWidth = 4; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(-40 + i * 12, 0, 26 - Math.abs(i - 3.5) * 2, Math.PI, TAU); ctx.stroke(); }
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-60, -10); ctx.quadraticCurveTo(0, -40, 60, -12); ctx.stroke(); break;
    case 'arches':
      ctx.lineWidth = 7; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-34 + i * 34, 0, 24, Math.PI, TAU); ctx.stroke(); } break;
    case 'head':
      ctx.beginPath(); ctx.ellipse(0, -46, 30, 44, 0, 0, TAU); ctx.fill(); ctx.fillRect(-14, -8, 28, 8);
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.ellipse(-10, -56, 6, 3, 0, 0, TAU); ctx.ellipse(10, -56, 6, 3, 0, 0, TAU); ctx.fill(); ctx.restore(); break;
    case 'flower':
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -40, 0, -80); ctx.stroke();
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 14, -86 + Math.sin(a) * 14, 12, 6, a, 0, TAU); ctx.fill(); } break;
    case 'octa':
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -100); ctx.lineTo(-30, -50); ctx.lineTo(0, 0); ctx.lineTo(30, -50); ctx.closePath(); ctx.moveTo(-30, -50); ctx.lineTo(30, -50); ctx.moveTo(0, -100); ctx.lineTo(10, -50); ctx.lineTo(0, 0); ctx.stroke(); break;
    case 'dancer':
      ctx.beginPath(); ctx.arc(0, -92, 9, 0, TAU); ctx.fill(); ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(0, -82); ctx.lineTo(4, -44); ctx.lineTo(-14, 0); ctx.moveTo(4, -44); ctx.lineTo(22, -6); ctx.moveTo(0, -76); ctx.lineTo(-26, -96); ctx.moveTo(0, -76); ctx.lineTo(24, -60); ctx.stroke(); break;
    default:
      ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -40, 36, 0, TAU); ctx.stroke(); ctx.fillRect(-4, -4, 8, 4);
  }
  if (lit) {
    ctx.globalCompositeOperation = 'source-atop';
    const g = ctx.createLinearGradient(-60, -100, 60, 0); g.addColorStop(0, rgba(lit, 0.7)); g.addColorStop(1, rgba(lit, 0.1));
    ctx.fillStyle = g; ctx.fillRect(-70, -130, 140, 140);
  }
  ctx.restore();
}

/* ---------- animated background life ---------- */
const BGDyn = {
  draw(ctx, kind, L, camX, oy, S, W, t, th) {
    const f = this[kind];
    if (f) { ctx.save(); f.call(this, ctx, L, camX, oy, S, W, t, th); ctx.restore(); }
  },
  // x position of something moving at `speed` (layer units/s) through a wrapping layer
  wrapX(base, speed, t, camX, L, S, W) {
    const lw = BG_W;
    let x = ((base + speed * t - camX * L.f) % lw + lw) % lw;
    return x;
  },
  artcars(ctx, L, camX, oy, S, W, t, th) {
    const designs = ['fish', 'ship', 'bus', 'cupcake', 'snail'];
    const night = th.night;
    for (let i = 0; i < 4; i++) {
      const speed = (i % 2 ? -1 : 1) * (14 + i * 6);
      const x = this.wrapX(i * 290 + 60, speed, t, camX, L, S, W);
      const sx = x * S, sy = oy + (L.base - L.top) * S;
      for (const off of [0, -BG_W * S, BG_W * S]) {
        const X = sx + off;
        if (X < -200 * S || X > W + 200 * S) continue;
        drawArtCarSilhouette(ctx, X, sy, S * (L.big ? 1.1 : 0.75), designs[i % designs.length], speed > 0 ? 1 : -1, t + i, night, L.color);
      }
    }
  },
  lasers(ctx, L, camX, oy, S, W, t) {
    ctx.globalCompositeOperation = 'lighter';
    const cols = ['56,242,255', '122,255,138', '255,79,216'];
    for (let i = 0; i < 3; i++) {
      const ox = ((i * 360 + 140 - camX * L.f) % BG_W + BG_W) % BG_W * S;
      const oyy = oy + (L.base - L.top - 60) * S;
      const on = Math.sin(t * 0.7 + i * 2) > -0.3;
      if (!on) continue;
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + Math.sin(t * (0.6 + i * 0.2) + k) * 0.9;
        ctx.strokeStyle = `rgba(${cols[i]},${0.25 + 0.1 * k})`; ctx.lineWidth = 1.6 * S;
        for (const off of [0, -BG_W * S, BG_W * S]) { ctx.beginPath(); ctx.moveTo(ox + off, oyy); ctx.lineTo(ox + off + Math.cos(a) * 900 * S, oyy + Math.sin(a) * 900 * S); ctx.stroke(); }
      }
    }
  },
  searchlights(ctx, L, camX, oy, S, W, t) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 2; i++) {
      const ox = ((i * 520 + 260 - camX * L.f) % BG_W + BG_W) % BG_W * S, oyy = oy + (L.base - L.top - 150) * S;
      const a = -Math.PI / 2 + Math.sin(t * 0.4 + i * 3) * 0.6;
      const g = ctx.createLinearGradient(ox, oyy, ox + Math.cos(a) * 600 * S, oyy + Math.sin(a) * 600 * S);
      g.addColorStop(0, 'rgba(255,240,220,0.22)'); g.addColorStop(1, 'rgba(255,240,220,0)');
      ctx.fillStyle = g;
      for (const off of [0, -BG_W * S, BG_W * S]) {
        ctx.beginPath(); ctx.moveTo(ox + off, oyy);
        ctx.lineTo(ox + off + Math.cos(a - 0.06) * 600 * S, oyy + Math.sin(a - 0.06) * 600 * S);
        ctx.lineTo(ox + off + Math.cos(a + 0.06) * 600 * S, oyy + Math.sin(a + 0.06) * 600 * S); ctx.closePath(); ctx.fill();
      }
    }
  },
  fireworks(ctx, L, camX, oy, S, W, t) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const period = 3.2 + i * 0.7, k = ((t + i * 1.3) % period) / period;
      if (k > 0.55) continue;
      const seed = Math.floor((t + i * 1.3) / period) * 13 + i;
      const r2 = mulberry32(seed);
      const x = r2() * W, y = oy + (L.base - L.top - 160 - r2() * 120) * S;
      const hue = Math.floor(r2() * 360);
      const rad = easeOut(k / 0.55) * (50 + r2() * 40) * S, a = 1 - k / 0.55;
      for (let p = 0; p < 22; p++) {
        const ang = p / 22 * TAU;
        ctx.fillStyle = `hsla(${hue},100%,70%,${a})`;
        ctx.beginPath(); ctx.arc(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad + k * 20 * S, 1.8 * S, 0, TAU); ctx.fill();
      }
    }
  },
  flames(ctx, L, camX, oy, S, W, t) {
    const mx = ((BG_W * 0.5 - camX * L.f) % BG_W + BG_W) % BG_W * S;
    const base = oy + (L.base - L.top - 46) * S;
    ctx.globalCompositeOperation = 'lighter';
    for (const off of [0, -BG_W * S, BG_W * S]) {
      const X = mx + off;
      if (X < -300 * S || X > W + 300 * S) continue;
      const g = ctx.createRadialGradient(X, base - 70 * S, 10 * S, X, base - 60 * S, 200 * S);
      g.addColorStop(0, 'rgba(255,200,90,0.55)'); g.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = g; ctx.fillRect(X - 220 * S, base - 280 * S, 440 * S, 320 * S);
      for (let i = 0; i < 14; i++) {
        const fx = X + (Math.sin(i * 7.3) * 36 + Math.sin(t * 3 + i) * 6) * S, h = (70 + Math.sin(t * 5 + i * 1.7) * 26 + (i % 3) * 22) * S;
        const fg = ctx.createLinearGradient(fx, base, fx, base - h - 60 * S);
        fg.addColorStop(0, 'rgba(255,230,140,0.7)'); fg.addColorStop(0.5, 'rgba(255,110,30,0.5)'); fg.addColorStop(1, 'rgba(255,40,10,0)');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.moveTo(fx - 12 * S, base); ctx.quadraticCurveTo(fx - 16 * S, base - h * 0.6, fx + Math.sin(t * 4 + i) * 8 * S, base - h - 60 * S); ctx.quadraticCurveTo(fx + 16 * S, base - h * 0.6, fx + 12 * S, base); ctx.fill();
      }
    }
  },
  dustplumes(ctx, L, camX, oy, S, W, t) {
    for (let i = 0; i < 6; i++) {
      const x = this.wrapX(i * 170, 10, t, camX, L, S, W) * S;
      const y = oy + (L.base - L.top - 6) * S;
      const k = (t * 0.4 + i * 0.3) % 1;
      ctx.fillStyle = `rgba(230,205,170,${0.25 * (1 - k)})`;
      ctx.beginPath(); ctx.arc(x, y - k * 30 * S, (10 + k * 30) * S, 0, TAU); ctx.fill();
    }
  },
  bikes(ctx, L, camX, oy, S, W, t) {
    ctx.globalCompositeOperation = 'lighter';
    const cols = ['56,242,255', '255,79,216', '122,255,138', '255,216,74'];
    for (let i = 0; i < 7; i++) {
      const sp = (i % 2 ? -1 : 1) * (20 + i * 5);
      const x = this.wrapX(i * 150, sp, t, camX, L, S, W) * S, y = oy + (L.base - L.top - 4) * S;
      ctx.strokeStyle = `rgba(${cols[i % 4]},0.9)`; ctx.lineWidth = 1.2 * S;
      ctx.beginPath(); ctx.arc(x - 6 * S, y - 4 * S, 4 * S, 0, TAU); ctx.arc(x + 6 * S, y - 4 * S, 4 * S, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 6 * S, y - 4 * S); ctx.lineTo(x, y - 12 * S); ctx.lineTo(x + 6 * S, y - 4 * S); ctx.moveTo(x, y - 12 * S); ctx.lineTo(x, y - 20 * S); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y - 23 * S, 3 * S, 0, TAU); ctx.stroke();
    }
  },
  dustdevil(ctx, L, camX, oy, S, W, t) {
    const x = this.wrapX(300, 18, t, camX, L, S, W) * S, y = oy + (L.base - L.top) * S;
    for (let i = 0; i < 16; i++) {
      const k = i / 16, w = (6 + k * 40) * S;
      ctx.fillStyle = `rgba(200,190,220,${0.12})`;
      ctx.beginPath(); ctx.ellipse(x + Math.sin(t * 3 + i * 0.6) * 10 * S, y - k * 170 * S, w, 6 * S, 0, 0, TAU); ctx.fill();
    }
  },
  lanterns(ctx, L, camX, oy, S, W, t) {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) {
      const x = this.wrapX(i * 85, 4 + (i % 3) * 2, t, camX, L, S, W) * S;
      const y = oy + (L.base - L.top - 80 - ((t * (6 + i % 4) + i * 37) % 300)) * S;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 10 * S);
      g.addColorStop(0, 'rgba(255,220,150,0.9)'); g.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.fillStyle = g; ctx.fillRect(x - 10 * S, y - 10 * S, 20 * S, 20 * S);
    }
  }
};

function drawArtCarSilhouette(ctx, x, y, s, design, dir, t, night, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
  const body = night ? '#120a20' : mix(col, '#ffffff', 0.15);
  const lit = ['#38f2ff', '#ff4fd8', '#ffd84a', '#7aff8a'][Math.abs(Math.floor(t * 7)) % 4];
  ctx.fillStyle = body;
  ctx.beginPath();
  if (design === 'fish') { ctx.ellipse(0, -26, 54, 20, 0, 0, TAU); ctx.moveTo(-50, -26); ctx.lineTo(-76, -46); ctx.lineTo(-76, -6); ctx.closePath(); }
  else if (design === 'ship') { ctx.moveTo(-60, -12); ctx.lineTo(60, -12); ctx.lineTo(70, -34); ctx.lineTo(-70, -34); ctx.closePath(); ctx.rect(-4, -90, 4, 56); }
  else if (design === 'bus') { rr(ctx, -56, -44, 112, 36, 8); }
  else if (design === 'cupcake') { ctx.moveTo(-36, -10); ctx.lineTo(36, -10); ctx.lineTo(44, -40); ctx.lineTo(-44, -40); ctx.closePath(); ctx.arc(0, -44, 40, Math.PI, TAU); }
  else { ctx.ellipse(10, -36, 32, 28, 0, 0, TAU); ctx.rect(-56, -14, 100, 8); }
  ctx.fill();
  if (design === 'ship') { ctx.beginPath(); ctx.moveTo(0, -88); ctx.lineTo(36, -50); ctx.lineTo(0, -46); ctx.fill(); }
  // wheels
  ctx.fillStyle = '#050508'; ctx.beginPath(); ctx.arc(-32, -6, 7, 0, TAU); ctx.arc(32, -6, 7, 0, TAU); ctx.fill();
  if (night) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(lit, 0.9); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = rgba(lit, 0.18); ctx.beginPath(); ctx.ellipse(0, -30, 80, 40, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 9; i++) { ctx.fillStyle = rgba(['#38f2ff', '#ff4fd8', '#ffd84a'][(i + Math.floor(t * 6)) % 3], 0.95); ctx.beginPath(); ctx.arc(-48 + i * 12, -16, 1.6, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}
