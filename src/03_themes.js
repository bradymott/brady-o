/* ============================================================
   Themes — palettes + procedural parallax backgrounds
   ============================================================ */
const BG_W = 1024; // logical width of a seamless background tile

const THEMES = {
  suburbs: {
    name: 'Midnight Suburbs', music: 'w1', particles: 'fireflies',
    sky: ['#0b0f2e', '#28205a', '#a0466a'], horizonGlow: '#ff9a6b',
    celestial: { type: 'moon', x: 0.78, y: 0.2, r: 34, color: '#f6efd6', glow: '#b9b7ff' },
    stars: 1,
    layers: [
      { kind: 'hills', color: '#2a2d64', base: 300, amp: 40, f: 0.08 },
      { kind: 'houses', color: '#1a1b44', window: '#ffcf7a', base: 350, f: 0.2 },
      { kind: 'trees', color: '#11122e', base: 392, f: 0.38 }
    ],
    fog: '#5a3d7a',
    ground: { style: 'grass', cap: '#3c8f5e', capHi: '#73d08a', dirt: '#4b3226', dirt2: '#2f1f19', rock: '#5b4236' },
    brick: { style: 'brick', c1: '#9a4430', c2: '#6b2a1f', mortar: '#2b1410' },
    hard: { c1: '#6d6f8f', c2: '#3e3f58' },
    semi: { style: 'wood', c1: '#8a5a3a', c2: '#5a3a24' },
    pillar: { c1: '#4a8a6a', c2: '#2a5a44', cap: '#6cc49a' },
    accent: '#ffcf7a',
    decor: ['lamp', 'bush', 'fence', 'mailbox', 'bush', 'tree'],
    tint: { glump: '#7d5cff', rollo: '#d06a3a', spiker: '#4a9a6a', flapper: '#5a4a8a', hopper: '#4ab07a' }
  },
  neon: {
    name: 'Neon City', music: 'w2', particles: 'neonrain',
    sky: ['#07031a', '#2b0b4a', '#ff2e88'], horizonGlow: '#ff4fa3',
    celestial: { type: 'synthsun', x: 0.5, y: 0.52, r: 90, color: '#ffd23f', glow: '#ff2e88' },
    stars: 0.4,
    layers: [
      { kind: 'city', color: '#2a0f4a', window: '#ff5fd0', window2: '#4ff0ff', base: 330, maxH: 200, f: 0.1 },
      { kind: 'city', color: '#170830', window: '#4ff0ff', window2: '#ffe14f', base: 380, maxH: 240, f: 0.24, signs: true },
      { kind: 'rooftops', color: '#0c0420', base: 410, f: 0.42 }
    ],
    fog: '#ff2e88',
    ground: { style: 'neon', cap: '#38f2ff', capHi: '#c8fdff', dirt: '#2c2a40', dirt2: '#17152a', rock: '#3c3a58' },
    brick: { style: 'panel', c1: '#4c4f72', c2: '#2c2e48', mortar: '#ff4fd8' },
    hard: { c1: '#5a5d80', c2: '#2a2c44' },
    semi: { style: 'neon', c1: '#ff4fd8', c2: '#3b1a52' },
    pillar: { c1: '#3a3d5c', c2: '#1d1f33', cap: '#38f2ff' },
    accent: '#38f2ff',
    decor: ['neonsign', 'acunit', 'antenna', 'vent', 'neonsign'],
    tint: { glump: '#ff4fd8', rollo: '#4ff0ff', spiker: '#ffe14f', flapper: '#9a4fff', hopper: '#4fff9a' }
  },
  woods: {
    name: 'Whispering Woods', music: 'w3', particles: 'leaves',
    sky: ['#123a4a', '#3f7a6a', '#e8c27a'], horizonGlow: '#ffe2a0',
    celestial: { type: 'sun', x: 0.25, y: 0.3, r: 46, color: '#fff2c4', glow: '#ffd27a' },
    stars: 0, rays: '#fff2c4',
    layers: [
      { kind: 'mountains', color: '#4f8a80', base: 300, amp: 110, f: 0.06 },
      { kind: 'forest', color: '#2f5f52', base: 350, f: 0.18 },
      { kind: 'forest', color: '#1b3d36', base: 400, f: 0.36, big: true }
    ],
    fog: '#c9e2b0',
    ground: { style: 'grass', cap: '#4caf50', capHi: '#a6e36a', dirt: '#5a3c26', dirt2: '#3a2618', rock: '#6e5a44' },
    brick: { style: 'plank', c1: '#a8743f', c2: '#6e4a26', mortar: '#3a2410' },
    hard: { c1: '#8a8a72', c2: '#55553f' },
    semi: { style: 'log', c1: '#7a5230', c2: '#4a301a' },
    pillar: { c1: '#7a5a3a', c2: '#4a321e', cap: '#5fbf5a', style: 'stump' },
    accent: '#a6e36a',
    decor: ['fern', 'mushroom', 'flower', 'stump', 'fern', 'flower'],
    tint: { glump: '#c46a3a', rollo: '#8a6a3a', spiker: '#6a4a8a', flapper: '#4a3a2a', hopper: '#3aa05a' }
  },
  ice: {
    name: 'Frostbite Peaks', music: 'w4', particles: 'snow',
    sky: ['#071a33', '#1d4a7a', '#9fd4f0'], horizonGlow: '#d8f4ff',
    celestial: { type: 'moon', x: 0.2, y: 0.18, r: 22, color: '#ffffff', glow: '#9fe8ff' },
    stars: 0.8, aurora: true,
    layers: [
      { kind: 'mountains', color: '#5f8fb8', base: 310, amp: 150, f: 0.06, snow: true },
      { kind: 'mountains', color: '#3d6a94', base: 350, amp: 90, f: 0.16, snow: true },
      { kind: 'pines', color: '#1f3f5f', base: 405, f: 0.36, snow: true }
    ],
    fog: '#bfe6ff',
    ground: { style: 'snow', cap: '#e8f6ff', capHi: '#ffffff', dirt: '#4a6a8f', dirt2: '#2c4566', rock: '#6a8aaf' },
    brick: { style: 'ice', c1: '#9fdcff', c2: '#5aa6d6', mortar: '#e6f8ff' },
    hard: { c1: '#a8c4dc', c2: '#6a8aa8' },
    semi: { style: 'ice', c1: '#c8f0ff', c2: '#7ab8dc' },
    pillar: { c1: '#7ab0d6', c2: '#3f6f96', cap: '#e8f6ff', style: 'ice' },
    accent: '#9fe8ff',
    decor: ['snowpine', 'crystal', 'snowpine', 'rockpile', 'snowman'],
    tint: { glump: '#5a8adc', rollo: '#8aa0b8', spiker: '#4a6adc', flapper: '#2a3a6a', hopper: '#6adcdc' }
  },
  desert: {
    name: 'Sunscorch Dunes', music: 'w5', particles: 'sand',
    sky: ['#3a6ab8', '#f0a868', '#ffd88a'], horizonGlow: '#fff0b0',
    celestial: { type: 'sun', x: 0.72, y: 0.24, r: 60, color: '#fff6d8', glow: '#ffb84a' },
    stars: 0, heat: true,
    layers: [
      { kind: 'mesas', color: '#c47a52', base: 320, f: 0.07 },
      { kind: 'dunes', color: '#d99a5a', base: 370, amp: 30, f: 0.18, ruins: true },
      { kind: 'dunes', color: '#b8743e', base: 410, amp: 22, f: 0.36 }
    ],
    fog: '#ffd8a0',
    ground: { style: 'sand', cap: '#f2c97a', capHi: '#fff0c0', dirt: '#c48a4e', dirt2: '#9a6434', rock: '#d8a464' },
    brick: { style: 'sandstone', c1: '#e0a85e', c2: '#a8703a', mortar: '#7a4a24' },
    hard: { c1: '#c89a6a', c2: '#8a643e' },
    semi: { style: 'wood', c1: '#a8784a', c2: '#6e4a2a' },
    pillar: { c1: '#e2b070', c2: '#a8763e', cap: '#f6d49a', style: 'column' },
    accent: '#ffb84a',
    decor: ['cactus', 'bones', 'ruin', 'cactus', 'palm'],
    tint: { glump: '#c4643a', rollo: '#a87a4a', spiker: '#7a5a2a', flapper: '#6a3a2a', hopper: '#c4a03a' }
  },
  reef: {
    name: 'Abyssal Reef', music: 'w6', particles: 'bubbles',
    sky: ['#0a6a9a', '#063a6a', '#021a3a'], horizonGlow: '#3ad6ff',
    celestial: { type: 'none' }, stars: 0, rays: '#a8f0ff', underwater: true,
    layers: [
      { kind: 'rocks', color: '#0d4a72', base: 320, amp: 70, f: 0.08 },
      { kind: 'kelp', color: '#0b3a5a', base: 380, f: 0.2 },
      { kind: 'coral', color: '#082a44', base: 420, f: 0.38 }
    ],
    fog: '#1a8ac0',
    ground: { style: 'coral', cap: '#ff7a9a', capHi: '#ffc0d0', dirt: '#2a5a7a', dirt2: '#163a56', rock: '#3a7a9a' },
    brick: { style: 'stone', c1: '#4a8aa8', c2: '#2a5a7a', mortar: '#163a56' },
    hard: { c1: '#5a9ab8', c2: '#2a5a7a' },
    semi: { style: 'coral', c1: '#ff9a6a', c2: '#c45a3a' },
    pillar: { c1: '#3a7a9a', c2: '#1a4a6a', cap: '#ff7a9a', style: 'coral' },
    accent: '#3ad6ff',
    decor: ['seaweed', 'coral', 'anemone', 'shell', 'seaweed'],
    tint: { glump: '#ff7a5a', rollo: '#5ac4a8', spiker: '#c45aff', flapper: '#3a5aaa', hopper: '#5aff9a' }
  },
  factory: {
    name: 'Clockwork Factory', music: 'w7', particles: 'sparks',
    sky: ['#1f1410', '#5a3420', '#c87a3a'], horizonGlow: '#ffa84a',
    celestial: { type: 'none' }, stars: 0, smog: true,
    layers: [
      { kind: 'stacks', color: '#4a2e22', base: 330, f: 0.08 },
      { kind: 'gears', color: '#3a2418', base: 380, f: 0.2 },
      { kind: 'pipes', color: '#24160f', base: 415, f: 0.4 }
    ],
    fog: '#c87a3a',
    ground: { style: 'metal', cap: '#f2c23a', capHi: '#2a2a2a', dirt: '#5a4a44', dirt2: '#3a2e2a', rock: '#6a5a54' },
    brick: { style: 'copper', c1: '#c4703a', c2: '#7a3e1e', mortar: '#3a1e0e' },
    hard: { c1: '#7a7a84', c2: '#44444e' },
    semi: { style: 'grate', c1: '#9a9aa4', c2: '#4a4a54' },
    pillar: { c1: '#8a8a94', c2: '#4a4a54', cap: '#f2c23a', style: 'pipe' },
    accent: '#ffa84a',
    decor: ['gear', 'barrel', 'hazard', 'steam', 'barrel'],
    tint: { glump: '#c4a03a', rollo: '#7a8aa4', spiker: '#c4503a', flapper: '#5a5a64', hopper: '#8ac43a' }
  },
  sky: {
    name: 'Storm Skies', music: 'w8', particles: 'rain',
    sky: ['#1a1a3a', '#4a4a7a', '#8a8ab8'], horizonGlow: '#c8c8ff',
    celestial: { type: 'none' }, stars: 0.2, storm: true,
    layers: [
      { kind: 'clouds', color: '#5a5a8a', base: 260, f: 0.05 },
      { kind: 'islands', color: '#3a3a64', base: 300, f: 0.14 },
      { kind: 'clouds', color: '#2e2e54', base: 380, f: 0.3, big: true }
    ],
    fog: '#9a9ad8',
    ground: { style: 'grass', cap: '#5aa86a', capHi: '#9ae0a0', dirt: '#5a5a78', dirt2: '#3a3a56', rock: '#6a6a8a' },
    brick: { style: 'stone', c1: '#7a7aa0', c2: '#4a4a6e', mortar: '#2a2a44' },
    hard: { c1: '#8a8ab0', c2: '#4a4a6e' },
    semi: { style: 'cloud', c1: '#eef0ff', c2: '#a8aad8' },
    pillar: { c1: '#7a7aa0', c2: '#4a4a6e', cap: '#c8c8ff', style: 'column' },
    accent: '#c8c8ff',
    decor: ['vane', 'rod', 'flag', 'rockpile'],
    tint: { glump: '#8a7aff', rollo: '#a8a8c4', spiker: '#ffd84a', flapper: '#3a3a5a', hopper: '#7ac4ff' }
  },
  caverns: {
    name: 'Crimson Caverns', music: 'w9', particles: 'embers',
    sky: ['#0a0406', '#2a0a0e', '#5a1410'], horizonGlow: '#ff5a1a',
    celestial: { type: 'none' }, stars: 0, dark: true,
    layers: [
      { kind: 'stalactites', color: '#24080a', base: 0, f: 0.1 },
      { kind: 'stalagmites', color: '#2a0c0c', base: 360, f: 0.18, lava: true },
      { kind: 'stalagmites', color: '#160606', base: 410, f: 0.36 }
    ],
    fog: '#ff3a1a',
    ground: { style: 'basalt', cap: '#3a2a2e', capHi: '#ff6a2a', dirt: '#2a1a1e', dirt2: '#140a0e', rock: '#3a2226' },
    brick: { style: 'magma', c1: '#5a2a24', c2: '#2a1210', mortar: '#ff5a1a' },
    hard: { c1: '#4a3a3e', c2: '#2a1e22' },
    semi: { style: 'bone', c1: '#d8c8b0', c2: '#8a7a64' },
    pillar: { c1: '#4a2a2a', c2: '#241212', cap: '#ff6a2a', style: 'column' },
    accent: '#ff6a2a',
    decor: ['torch', 'crystalred', 'bones', 'torch', 'rockpile'],
    tint: { glump: '#c43a3a', rollo: '#6a4a4a', spiker: '#ff7a2a', flapper: '#3a1a1a', hopper: '#c45a2a' }
  },
  citadel: {
    name: 'Eclipse Citadel', music: 'w10', particles: 'motes',
    sky: ['#05020c', '#1e0a36', '#5a2a7a'], horizonGlow: '#c08aff',
    celestial: { type: 'eclipse', x: 0.62, y: 0.26, r: 54, color: '#05020c', glow: '#ffd8a0' },
    stars: 0.9,
    layers: [
      { kind: 'spires', color: '#24123e', window: '#c08aff', base: 340, f: 0.08 },
      { kind: 'spires', color: '#170a2a', window: '#ff6ad8', base: 390, f: 0.2, big: true },
      { kind: 'floaters', color: '#0e0618', base: 300, f: 0.4 }
    ],
    fog: '#7a3aaa',
    ground: { style: 'marble', cap: '#d8b25a', capHi: '#fff0b0', dirt: '#24182e', dirt2: '#120a1a', rock: '#3a2a4a' },
    brick: { style: 'rune', c1: '#3a2a52', c2: '#1e1430', mortar: '#c08aff' },
    hard: { c1: '#4a3a62', c2: '#241a36' },
    semi: { style: 'metal', c1: '#d8b25a', c2: '#7a5a2a' },
    pillar: { c1: '#3a2a52', c2: '#1a1028', cap: '#d8b25a', style: 'column' },
    accent: '#c08aff',
    decor: ['banner', 'brazier', 'statue', 'banner', 'crystal'],
    tint: { glump: '#8a3aff', rollo: '#5a4a7a', spiker: '#ff3a8a', flapper: '#2a1a4a', hopper: '#c03aff' }
  },
  backstage: {
    name: 'Backstage', music: 'secret', particles: 'confetti',
    sky: ['#0a0408', '#2a0a1a', '#5a1030'], horizonGlow: '#ff3a6a',
    celestial: { type: 'none' }, stars: 0, spotlights: true,
    layers: [
      { kind: 'curtains', color: '#6a0a1e', base: 0, f: 0.05 },
      { kind: 'speakers', color: '#141018', base: 380, f: 0.18 },
      { kind: 'crowd', color: '#08060a', base: 430, f: 0.4 }
    ],
    fog: '#ff3a6a',
    ground: { style: 'stage', cap: '#2a2a30', capHi: '#ffd84a', dirt: '#1e1a1e', dirt2: '#0e0a0e', rock: '#2e282e' },
    brick: { style: 'amp', c1: '#2a2a30', c2: '#121216', mortar: '#d8d8d8' },
    hard: { c1: '#3a3a44', c2: '#1a1a20' },
    semi: { style: 'truss', c1: '#c8c8d0', c2: '#6a6a74' },
    pillar: { c1: '#2a2a30', c2: '#121216', cap: '#ffd84a', style: 'speaker' },
    accent: '#ffd84a',
    decor: ['amp', 'micstand', 'cable', 'setlist', 'amp'],
    tint: { glump: '#ff3a6a', rollo: '#ffd84a', spiker: '#3affc8', flapper: '#c83aff', hopper: '#3a8aff' }
  },
  glitch: {
    name: 'Static Dimension', music: 'glitch', particles: 'glitch',
    sky: ['#000000', '#001a10', '#003a24'], horizonGlow: '#00ff9a',
    celestial: { type: 'glitchsun', x: 0.5, y: 0.3, r: 50, color: '#00ff9a', glow: '#ff00d4' },
    stars: 0.5, scanlines: true,
    layers: [
      { kind: 'grid', color: '#00ff9a', base: 300, f: 0.1 },
      { kind: 'blocks', color: '#08241a', base: 380, f: 0.22 },
      { kind: 'blocks', color: '#031a10', base: 420, f: 0.4, big: true }
    ],
    fog: '#00ff9a',
    ground: { style: 'pixel', cap: '#00ff9a', capHi: '#c8ffe8', dirt: '#0a2a1e', dirt2: '#041a10', rock: '#00a864' },
    brick: { style: 'pixel', c1: '#ff00d4', c2: '#7a0066', mortar: '#000000' },
    hard: { c1: '#00a864', c2: '#004a2a' },
    semi: { style: 'neon', c1: '#00ff9a', c2: '#003a24' },
    pillar: { c1: '#003a24', c2: '#001a10', cap: '#ff00d4', style: 'pixel' },
    accent: '#00ff9a',
    decor: ['glitchbox', 'glitchbox', 'crystal'],
    tint: { glump: '#ff00d4', rollo: '#00ff9a', spiker: '#ffffff', flapper: '#ff00d4', hopper: '#00d4ff' }
  },
  w22: {
    name: 'World 22', music: 'secret', particles: 'petals',
    sky: ['#2a1a4a', '#c86a8a', '#ffd0a0'], horizonGlow: '#fff0d0',
    celestial: { type: 'sun22', x: 0.5, y: 0.42, r: 70, color: '#fff4dc', glow: '#ff9ab0' },
    stars: 0.6,
    layers: [
      { kind: 'mountains', color: '#8a5a8a', base: 330, amp: 90, f: 0.06 },
      { kind: 'tapes', color: '#5a3a6a', base: 360, f: 0.14 },
      { kind: 'hills', color: '#3a2a54', base: 410, amp: 26, f: 0.34 }
    ],
    fog: '#ffb0c0',
    ground: { style: 'grass', cap: '#e88aa8', capHi: '#ffd0e0', dirt: '#5a3a5a', dirt2: '#3a2440', rock: '#7a5a7a' },
    brick: { style: 'brick', c1: '#c86a8a', c2: '#8a3a5a', mortar: '#3a1a2a' },
    hard: { c1: '#a88ab8', c2: '#6a4a7a' },
    semi: { style: 'cloud', c1: '#fff0f4', c2: '#e8a8c0' },
    pillar: { c1: '#8a5a8a', c2: '#4a2a54', cap: '#ffd0e0', style: 'column' },
    accent: '#ff9ab0',
    decor: ['flower', 'lamp', 'bush', 'flower'],
    tint: { glump: '#ff6a9a', rollo: '#c88aff', spiker: '#ffa86a', flapper: '#6a3a8a', hopper: '#ffd06a' }
  }
};

// Underground and fortress variants derived from a base theme
function caveVariant(base) {
  const b = THEMES[base];
  const key = base + '_cave';
  if (THEMES[key]) return key;
  THEMES[key] = Object.assign({}, b, {
    name: b.name, music: 'underground', particles: base === 'reef' ? 'bubbles' : 'dust', cave: true,
    sky: ['#05050a', mix(b.sky[0], '#000000', 0.6), mix(b.sky[1], '#000000', 0.7)],
    celestial: { type: 'none' }, stars: 0, aurora: false, rays: null, storm: false, spotlights: false, heat: false,
    layers: [
      { kind: 'stalactites', color: mix(b.ground.dirt2, '#000000', 0.45), base: 0, f: 0.1 },
      { kind: 'stalagmites', color: mix(b.ground.dirt2, '#000000', 0.3), base: 380, f: 0.2, crystals: b.accent },
      { kind: 'stalagmites', color: mix(b.ground.dirt2, '#000000', 0.55), base: 420, f: 0.38 }
    ],
    fog: b.accent,
    ground: Object.assign({}, b.ground, { style: 'rock', cap: shade(b.ground.rock, 0.1), capHi: shade(b.ground.rock, 0.35) }),
    decor: ['crystal', 'rockpile', 'torch', 'crystal']
  });
  return key;
}
function fortressVariant(base) {
  const b = THEMES[base];
  const key = base + '_fort';
  if (THEMES[key]) return key;
  THEMES[key] = Object.assign({}, b, {
    name: b.name, music: 'castle', particles: 'embers', fortress: true,
    sky: ['#08040a', '#1e0a14', '#3a1010'],
    celestial: { type: 'none' }, stars: 0, aurora: false, rays: null, storm: false, spotlights: false, heat: false,
    layers: [
      { kind: 'arches', color: '#1e1218', base: 400, f: 0.12, window: '#ff7a3a' },
      { kind: 'chains', color: '#140c10', base: 0, f: 0.25 }
    ],
    fog: '#ff5a2a',
    ground: { style: 'castle', cap: '#6a5a62', capHi: '#9a8a92', dirt: '#3a3036', dirt2: '#241c22', rock: '#4a3e46' },
    brick: { style: 'brick', c1: '#5a4a54', c2: '#3a2e36', mortar: '#1a1418' },
    hard: { c1: '#6a5a64', c2: '#3a2e36' },
    semi: { style: 'metal', c1: '#8a7a84', c2: '#4a3e46' },
    pillar: { c1: '#5a4a54', c2: '#2a2028', cap: '#ff7a3a', style: 'column' },
    decor: ['torch', 'banner', 'torch', 'chainsdecor'],
    dark: base === 'caverns' || base === 'citadel'
  });
  return key;
}

/* ---------- background painters ---------- */
function wrapDraw(x, w, fn) {
  fn(x);
  if (x + w > BG_W) fn(x - BG_W);
  if (x < 0) fn(x + BG_W);
}
function periodicNoise(rng, terms) {
  const comps = [];
  for (let i = 0; i < terms; i++) comps.push({ k: 1 + Math.floor(rng() * (2 + i * 3)), a: 1 / (i + 1), p: rng() * TAU });
  const norm = comps.reduce((s, c) => s + c.a, 0);
  return x => comps.reduce((s, c) => s + c.a * Math.sin(TAU * c.k * x / BG_W + c.p), 0) / norm;
}
function vgrad(ctx, y0, y1, c0, c1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, c0); g.addColorStop(1, c1); return g;
}

const BGPaint = {
  hills(ctx, L, rng, H) {
    const n = periodicNoise(rng, 3);
    ctx.fillStyle = vgrad(ctx, L.base - L.amp, H, shade(L.color, 0.12), shade(L.color, -0.2));
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 8) ctx.lineTo(x, L.base - L.amp * (0.5 + 0.5 * n(x)));
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    // rim light
    ctx.strokeStyle = rgba(shade(L.color, 0.5), 0.35); ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= BG_W; x += 8) { const y = L.base - L.amp * (0.5 + 0.5 * n(x)); x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
  },
  mountains(ctx, L, rng, H) {
    const pts = []; let x = 0;
    while (x < BG_W) { pts.push([x, L.base - L.amp * (0.25 + 0.75 * rng())]); x += 40 + rng() * 90; }
    const first = pts[0];
    const ys = x => {
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = i + 1 < pts.length ? pts[i + 1] : [BG_W, first[1]];
        if (x >= a[0] && x <= b[0]) return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0] || 1));
      }
      return first[1];
    };
    ctx.fillStyle = vgrad(ctx, L.base - L.amp, H, shade(L.color, 0.15), shade(L.color, -0.25));
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let xx = 0; xx <= BG_W; xx += 4) ctx.lineTo(xx, ys(xx));
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    // light side shading
    ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = i + 1 < pts.length ? pts[i + 1] : [BG_W, first[1]];
      if (b[1] > a[1]) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(a[0] + (b[0] - a[0]) * 0.3, H); ctx.closePath(); ctx.fill(); }
    }
    ctx.restore();
    if (L.snow) {
      ctx.fillStyle = 'rgba(240,250,255,0.85)';
      for (const p of pts) {
        if (p[1] < L.base - L.amp * 0.55) {
          ctx.beginPath(); ctx.moveTo(p[0], p[1]);
          ctx.lineTo(p[0] - 18, p[1] + 22); ctx.lineTo(p[0] - 8, p[1] + 17); ctx.lineTo(p[0], p[1] + 25);
          ctx.lineTo(p[0] + 9, p[1] + 16); ctx.lineTo(p[0] + 20, p[1] + 23); ctx.closePath(); ctx.fill();
        }
      }
    }
  },
  houses(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W - 20) {
      const w = 60 + rng() * 70, h = 50 + rng() * 50, roof = 22 + rng() * 22;
      const gx = x;
      wrapDraw(gx, w + 20, X => {
        ctx.fillStyle = L.color;
        ctx.fillRect(X, L.base - h, w, h + (H - L.base));
        ctx.beginPath(); ctx.moveTo(X - 8, L.base - h); ctx.lineTo(X + w / 2, L.base - h - roof); ctx.lineTo(X + w + 8, L.base - h); ctx.closePath(); ctx.fill();
        ctx.fillRect(X + w * 0.7, L.base - h - roof * 0.9, 10, roof * 0.7); // chimney
        const r2 = mulberry32(Math.floor(gx * 13));
        for (let wy = L.base - h + 12; wy < L.base - 14; wy += 22) for (let wx = X + 10; wx < X + w - 16; wx += 22) {
          if (r2() < 0.45) {
            ctx.fillStyle = rgba(L.window, 0.85); ctx.fillRect(wx, wy, 10, 12);
            ctx.fillStyle = rgba(L.window, 0.18); ctx.fillRect(wx - 4, wy - 4, 18, 20);
          }
        }
      });
      x += w + 14 + rng() * 40;
      // tree between houses
      const tx = x - 8;
      wrapDraw(tx, 30, X => {
        ctx.fillStyle = shade(L.color, -0.15);
        ctx.beginPath(); ctx.arc(X, L.base - 46, 22, 0, TAU); ctx.arc(X + 12, L.base - 30, 18, 0, TAU); ctx.arc(X - 12, L.base - 30, 18, 0, TAU); ctx.fill();
        ctx.fillRect(X - 3, L.base - 20, 6, 20 + H);
      });
    }
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
  },
  trees(ctx, L, rng, H) {
    ctx.fillStyle = L.color;
    ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 0;
    while (x < BG_W) {
      const r = 26 + rng() * 26, tx = x;
      wrapDraw(tx, r * 2, X => {
        ctx.fillStyle = L.color;
        ctx.beginPath();
        ctx.arc(X, L.base - r * 1.3, r, 0, TAU); ctx.arc(X - r * 0.7, L.base - r * 0.7, r * 0.75, 0, TAU); ctx.arc(X + r * 0.7, L.base - r * 0.75, r * 0.8, 0, TAU);
        ctx.fill(); ctx.fillRect(X - 4, L.base - r, 8, r + 4);
        ctx.fillStyle = rgba(shade(L.color, 0.35), 0.5);
        ctx.beginPath(); ctx.arc(X - r * 0.15, L.base - r * 1.45, r * 0.62, Math.PI * 1.1, Math.PI * 1.75); ctx.arc(X - r * 0.15, L.base - r * 1.3, r * 0.45, Math.PI * 1.75, Math.PI * 1.1, true); ctx.fill();
        ctx.beginPath(); ctx.arc(X - r * 0.8, L.base - r * 0.8, r * 0.45, Math.PI * 1.1, Math.PI * 1.7); ctx.arc(X - r * 0.8, L.base - r * 0.7, r * 0.32, Math.PI * 1.7, Math.PI * 1.1, true); ctx.fill();
        ctx.fillStyle = L.color;
      });
      // fence segments
      if (rng() < 0.5) {
        const fx = x + r + 10, fw = 60 + rng() * 60;
        wrapDraw(fx, fw, X => {
          for (let p = 0; p < fw; p += 9) ctx.fillRect(X + p, L.base - 18, 5, 18);
          ctx.fillRect(X, L.base - 14, fw, 3); ctx.fillRect(X, L.base - 7, fw, 3);
        });
      }
      x += r * 2 + 20 + rng() * 90;
    }
  },
  city(ctx, L, rng, H) {
    let x = 0;
    while (x < BG_W) {
      const w = 34 + rng() * 60, h = 60 + rng() * L.maxH, bx = x;
      const seed = Math.floor(rng() * 1e9);
      wrapDraw(bx, w, X => {
        const r2 = mulberry32(seed);
        ctx.fillStyle = L.color; ctx.fillRect(X, L.base - h, w, h + H);
        if (r2() < 0.4) { ctx.fillRect(X + w / 2 - 1, L.base - h - 26, 2, 26); ctx.fillStyle = '#ff3a3a'; ctx.fillRect(X + w / 2 - 2, L.base - h - 28, 4, 4); ctx.fillStyle = L.color; }
        if (r2() < 0.3) ctx.fillRect(X + 6, L.base - h - 10, w - 12, 10);
        for (let wy = L.base - h + 8; wy < H; wy += 10) for (let wx = X + 5; wx < X + w - 6; wx += 8) {
          if (r2() < 0.33) { ctx.fillStyle = rgba(r2() < 0.7 ? L.window : L.window2, 0.55 + r2() * 0.4); ctx.fillRect(wx, wy, 4, 5); }
        }
        if (L.signs && r2() < 0.35) {
          const sc = r2() < 0.5 ? L.window : L.window2, sy = L.base - h + 20 + r2() * 40;
          ctx.save(); ctx.shadowColor = sc; ctx.shadowBlur = 12; ctx.strokeStyle = sc; ctx.lineWidth = 2.5;
          if (r2() < 0.5) { ctx.strokeRect(X + 4, sy, w - 8, 16); } else { ctx.beginPath(); ctx.moveTo(X + w * 0.5, sy); ctx.lineTo(X + w * 0.5, sy + 50); ctx.stroke(); ctx.strokeRect(X + w * 0.5 - 7, sy, 14, 50); }
          ctx.restore();
        }
      });
      x += w + rng() * 8;
    }
  },
  rooftops(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 0;
    while (x < BG_W) {
      const k = rng(), bx = x;
      if (k < 0.3) { // water tower
        wrapDraw(bx, 40, X => { ctx.fillRect(X + 4, L.base - 60, 32, 34); ctx.beginPath(); ctx.moveTo(X, L.base - 60); ctx.lineTo(X + 20, L.base - 76); ctx.lineTo(X + 40, L.base - 60); ctx.fill(); ctx.fillRect(X + 8, L.base - 26, 3, 26); ctx.fillRect(X + 29, L.base - 26, 3, 26); });
        x += 70;
      } else if (k < 0.6) { // billboard
        wrapDraw(bx, 90, X => { ctx.fillRect(X, L.base - 70, 90, 40); ctx.fillRect(X + 20, L.base - 30, 4, 30); ctx.fillRect(X + 66, L.base - 30, 4, 30); });
        x += 110;
      } else { // AC blocks + antenna
        wrapDraw(bx, 60, X => { ctx.fillRect(X, L.base - 18, 26, 18); ctx.fillRect(X + 32, L.base - 12, 20, 12); ctx.fillRect(X + 40, L.base - 50, 2, 40); });
        x += 70;
      }
      x += rng() * 50;
    }
  },
  forest(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 0;
    while (x < BG_W) {
      const h = (L.big ? 120 : 70) + rng() * (L.big ? 90 : 60), w = h * (0.3 + rng() * 0.15), bx = x, round = rng() < 0.4;
      wrapDraw(bx, w, X => {
        ctx.fillStyle = L.color;
        if (round) {
          ctx.fillRect(X - 3, L.base - h * 0.5, 6, h * 0.5);
          ctx.beginPath(); ctx.ellipse(X, L.base - h * 0.62, w * 0.6, h * 0.38, 0, 0, TAU); ctx.fill();
        } else {
          for (let i = 0; i < 4; i++) {
            const ty = L.base - h + i * h * 0.2, tw = w * (0.35 + i * 0.22);
            ctx.beginPath(); ctx.moveTo(X, ty); ctx.lineTo(X - tw, ty + h * 0.32); ctx.lineTo(X + tw, ty + h * 0.32); ctx.closePath(); ctx.fill();
          }
          ctx.fillRect(X - 3, L.base - h * 0.2, 6, h * 0.2);
        }
      });
      x += w * (0.6 + rng() * 0.9);
    }
  },
  pines(ctx, L, rng, H) { L.big = false; this.forest(ctx, L, rng, H); if (L.snow) {
    // dusting of snow along the base
    ctx.fillStyle = 'rgba(230,245,255,0.5)'; ctx.fillRect(0, L.base - 2, BG_W, 4);
  } },
  mesas(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base - 120, H, shade(L.color, 0.1), shade(L.color, -0.25));
    let x = 0;
    ctx.fillRect(0, L.base, BG_W, H - L.base);
    while (x < BG_W) {
      const w = 80 + rng() * 140, h = 40 + rng() * 90, bx = x;
      wrapDraw(bx, w + 40, X => {
        ctx.beginPath(); ctx.moveTo(X - 20, L.base); ctx.lineTo(X, L.base - h); ctx.lineTo(X + w, L.base - h); ctx.lineTo(X + w + 20, L.base); ctx.closePath(); ctx.fill();
        ctx.save(); ctx.fillStyle = 'rgba(255,220,180,0.18)'; ctx.fillRect(X, L.base - h, w, 4); ctx.restore();
      });
      x += w + 40 + rng() * 120;
    }
  },
  dunes(ctx, L, rng, H) {
    const n = periodicNoise(rng, 3);
    ctx.fillStyle = vgrad(ctx, L.base - L.amp, H, shade(L.color, 0.15), shade(L.color, -0.2));
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= BG_W; x += 8) ctx.lineTo(x, L.base - L.amp * (0.5 + 0.5 * n(x)));
    ctx.lineTo(BG_W, H); ctx.closePath(); ctx.fill();
    if (L.ruins) {
      ctx.fillStyle = shade(L.color, -0.25);
      for (let i = 0; i < 3; i++) {
        const px = 120 + i * 340 + rng() * 60, py = L.base - L.amp * (0.5 + 0.5 * n(px));
        if (i === 1) { ctx.beginPath(); ctx.moveTo(px - 70, py + 6); ctx.lineTo(px, py - 80); ctx.lineTo(px + 70, py + 6); ctx.closePath(); ctx.fill(); }
        else { for (let c = 0; c < 4; c++) ctx.fillRect(px + c * 22, py - 30 - (c % 2) * 14, 9, 40); ctx.fillRect(px - 4, py - 34, 80, 6); }
      }
    }
  },
  rocks(ctx, L, rng, H) { this.hills(ctx, L, rng, H); },
  kelp(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.strokeStyle = L.color; ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = rng() * BG_W, h = 80 + rng() * 140, w = 5 + rng() * 6, ph = rng() * TAU;
      wrapDraw(x, 40, X => {
        ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(X, L.base + 4);
        for (let k = 1; k <= 10; k++) ctx.lineTo(X + Math.sin(ph + k * 0.7) * 10, L.base - h * k / 10);
        ctx.stroke();
        for (let k = 2; k < 10; k += 2) { ctx.beginPath(); ctx.ellipse(X + Math.sin(ph + k * 0.7) * 10 + 8, L.base - h * k / 10, 9, 4, -0.5, 0, TAU); ctx.fillStyle = L.color; ctx.fill(); }
      });
    }
  },
  coral(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 0;
    while (x < BG_W) {
      const bx = x, s = 20 + rng() * 30, kind = rng();
      wrapDraw(bx, s * 2, X => {
        ctx.fillStyle = L.color;
        if (kind < 0.5) { // branching
          ctx.lineCap = 'round'; ctx.strokeStyle = L.color;
          const br = (x0, y0, a, len, d) => { if (d > 3) return; const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; ctx.lineWidth = 7 - d * 1.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); br(x1, y1, a - 0.5, len * 0.75, d + 1); br(x1, y1, a + 0.45, len * 0.7, d + 1); };
          br(X, L.base, -Math.PI / 2, s, 0);
        } else { ctx.beginPath(); ctx.ellipse(X, L.base, s, s * 0.7, 0, Math.PI, TAU); ctx.fill(); }
      });
      x += s * 1.6 + rng() * 60;
    }
  },
  stacks(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 0;
    while (x < BG_W) {
      const bx = x, w = 60 + rng() * 80, h = 30 + rng() * 50, stacks = 1 + Math.floor(rng() * 3), sh = 60 + rng() * 80;
      wrapDraw(bx, w, X => {
        ctx.fillStyle = L.color; ctx.fillRect(X, L.base - h, w, h);
        // saw roof
        for (let s = 0; s < w; s += 20) { ctx.beginPath(); ctx.moveTo(X + s, L.base - h); ctx.lineTo(X + s + 20, L.base - h - 12); ctx.lineTo(X + s + 20, L.base - h); ctx.fill(); }
        for (let s = 0; s < stacks; s++) { const sx = X + 10 + s * 22; ctx.fillRect(sx, L.base - h - sh, 12, sh); ctx.fillRect(sx - 2, L.base - h - sh, 16, 5); ctx.fillStyle = 'rgba(255,170,80,0.5)'; ctx.fillRect(sx + 2, L.base - h - sh + 20, 8, 3); ctx.fillStyle = L.color; }
      });
      x += w + 20 + rng() * 60;
    }
  },
  gears(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let i = 0; i < 7; i++) {
      const gx = i * (BG_W / 7) + rng() * 60, gy = L.base - 30 - rng() * 120, r = 30 + rng() * 50;
      wrapDraw(gx - r - 10, r * 2 + 20, X => drawGearShape(ctx, X + r + 10, gy, r, L.color, Math.floor(8 + r / 8), rng() * TAU));
    }
    for (let i = 0; i < 6; i++) { const px = rng() * BG_W; ctx.fillStyle = L.color; ctx.fillRect(px, L.base - 200, 10, 200); }
  },
  pipes(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.fillRect(0, L.base - 40, BG_W, 12); ctx.fillRect(0, L.base - 70, BG_W, 6);
    for (let i = 0; i < 12; i++) {
      const px = rng() * BG_W, h = 30 + rng() * 80;
      wrapDraw(px, 30, X => { ctx.fillRect(X, L.base - h, 16, h); ctx.fillRect(X - 4, L.base - h, 24, 6); ctx.beginPath(); ctx.arc(X + 8, L.base - 34, 9, 0, TAU); ctx.fill(); });
    }
  },
  clouds(ctx, L, rng, H) {
    const big = L.big ? 1.6 : 1;
    ctx.fillStyle = L.color;
    ctx.fillRect(0, L.base + 20 * big, BG_W, H);
    for (let i = 0; i < 26; i++) {
      const cx = (i / 26) * BG_W + rng() * 20, r = (24 + rng() * 34) * big, cy = L.base + rng() * 20;
      wrapDraw(cx - r, r * 2, X => { ctx.beginPath(); ctx.arc(X + r, cy, r, 0, TAU); ctx.fill(); });
    }
    ctx.fillStyle = rgba(shade(L.color, 0.35), 0.35);
    for (let i = 0; i < 14; i++) { const cx = rng() * BG_W, r = (14 + rng() * 20) * big, cy = L.base - 4 + rng() * 10; wrapDraw(cx - r, r * 2, X => { ctx.beginPath(); ctx.arc(X + r, cy - r * 0.3, r * 0.7, Math.PI, TAU); ctx.fill(); }); }
  },
  islands(ctx, L, rng, H) {
    for (let i = 0; i < 6; i++) {
      const ix = i * 170 + rng() * 60, iy = L.base - 40 + rng() * 80, w = 50 + rng() * 70;
      wrapDraw(ix, w, X => {
        ctx.fillStyle = L.color;
        ctx.beginPath(); ctx.moveTo(X, iy); ctx.lineTo(X + w, iy); ctx.lineTo(X + w * 0.6, iy + w * 0.7); ctx.lineTo(X + w * 0.45, iy + w * 0.9); ctx.lineTo(X + w * 0.3, iy + w * 0.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = rgba(shade(L.color, 0.4), 0.5); ctx.fillRect(X, iy - 3, w, 4);
      });
    }
  },
  stalactites(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, 30);
    let x = 0;
    while (x < BG_W) {
      const w = 14 + rng() * 30, h = 30 + rng() * 110, bx = x;
      wrapDraw(bx, w, X => { ctx.beginPath(); ctx.moveTo(X, 28); ctx.lineTo(X + w / 2, 28 + h); ctx.lineTo(X + w, 28); ctx.closePath(); ctx.fill(); });
      x += w * 0.7 + rng() * 26;
    }
  },
  stalagmites(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 0;
    while (x < BG_W) {
      const w = 20 + rng() * 40, h = 30 + rng() * 120, bx = x;
      wrapDraw(bx, w, X => { ctx.fillStyle = L.color; ctx.beginPath(); ctx.moveTo(X, L.base + 2); ctx.lineTo(X + w * 0.45, L.base - h); ctx.lineTo(X + w * 0.55, L.base - h); ctx.lineTo(X + w, L.base + 2); ctx.closePath(); ctx.fill(); });
      if (L.crystals && rng() < 0.35) {
        const cx = x + w + 6, cy = L.base;
        wrapDraw(cx, 20, X => { ctx.save(); ctx.shadowColor = L.crystals; ctx.shadowBlur = 14; ctx.fillStyle = rgba(L.crystals, 0.75); ctx.beginPath(); ctx.moveTo(X, cy); ctx.lineTo(X + 5, cy - 26); ctx.lineTo(X + 10, cy); ctx.fill(); ctx.beginPath(); ctx.moveTo(X + 8, cy); ctx.lineTo(X + 15, cy - 16); ctx.lineTo(X + 19, cy); ctx.fill(); ctx.restore(); });
      }
      x += w * 0.8 + rng() * 40;
    }
    if (L.lava) {
      const g = ctx.createLinearGradient(0, L.base - 10, 0, L.base + 30);
      g.addColorStop(0, 'rgba(255,90,20,0)'); g.addColorStop(0.5, 'rgba(255,110,30,0.55)'); g.addColorStop(1, 'rgba(255,60,10,0.2)');
      ctx.fillStyle = g; ctx.fillRect(0, L.base - 10, BG_W, 40);
    }
  },
  spires(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 0;
    while (x < BG_W) {
      const w = (L.big ? 40 : 26) + rng() * 30, h = (L.big ? 140 : 90) + rng() * 120, bx = x, seed = Math.floor(rng() * 1e9);
      wrapDraw(bx, w, X => {
        const r2 = mulberry32(seed);
        ctx.fillStyle = L.color;
        ctx.fillRect(X, L.base - h, w, h);
        ctx.beginPath(); ctx.moveTo(X - 4, L.base - h); ctx.lineTo(X + w / 2, L.base - h - w * 1.6); ctx.lineTo(X + w + 4, L.base - h); ctx.closePath(); ctx.fill();
        for (let wy = L.base - h + 16; wy < L.base - 10; wy += 26) if (r2() < 0.6) {
          ctx.fillStyle = rgba(L.window, 0.8);
          ctx.beginPath(); ctx.moveTo(X + w / 2 - 3, wy + 10); ctx.lineTo(X + w / 2 - 3, wy + 3); ctx.arc(X + w / 2, wy + 3, 3, Math.PI, 0); ctx.lineTo(X + w / 2 + 3, wy + 10); ctx.fill();
        }
      });
      x += w + 10 + rng() * 70;
    }
  },
  floaters(ctx, L, rng, H) {
    ctx.fillStyle = L.color;
    for (let i = 0; i < 9; i++) {
      const fx = rng() * BG_W, fy = L.base - 120 + rng() * 120, w = 16 + rng() * 40;
      wrapDraw(fx, w, X => { ctx.beginPath(); ctx.moveTo(X, fy); ctx.lineTo(X + w, fy); ctx.lineTo(X + w * 0.5, fy + w * 0.9); ctx.closePath(); ctx.fill(); });
    }
  },
  curtains(ctx, L, rng, H) {
    // top valance and side drapes (tiles horizontally)
    for (let x = 0; x < BG_W; x += 32) {
      const g = ctx.createLinearGradient(x, 0, x + 32, 0);
      g.addColorStop(0, shade(L.color, -0.45)); g.addColorStop(0.5, shade(L.color, 0.15)); g.addColorStop(1, shade(L.color, -0.45));
      ctx.fillStyle = g; ctx.fillRect(x, 0, 32, 60);
      ctx.beginPath(); ctx.arc(x + 16, 60, 16, 0, Math.PI); ctx.fill();
    }
    ctx.fillStyle = '#d8a83a'; ctx.fillRect(0, 2, BG_W, 3);
    // truss with lights
    ctx.fillStyle = '#1a1a20'; ctx.fillRect(0, 84, BG_W, 6);
    for (let x = 20; x < BG_W; x += 64) { ctx.fillStyle = '#2a2a30'; ctx.fillRect(x, 90, 14, 12); ctx.fillStyle = 'rgba(255,240,200,0.9)'; ctx.beginPath(); ctx.arc(x + 7, 104, 4, 0, TAU); ctx.fill(); }
  },
  speakers(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 0;
    while (x < BG_W) {
      const cols = 1 + Math.floor(rng() * 2), rows = 2 + Math.floor(rng() * 3), bx = x;
      wrapDraw(bx, cols * 46, X => {
        for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
          const sx = X + c * 46, sy = L.base - (r + 1) * 46;
          ctx.fillStyle = L.color; ctx.fillRect(sx, sy, 44, 44);
          ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; ctx.strokeRect(sx + 1, sy + 1, 42, 42);
          ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.arc(sx + 22, sy + 22, 15, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(sx + 22, sy + 22, 15, 0, TAU); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(sx + 22, sy + 22, 5, 0, TAU); ctx.fill();
        }
      });
      x += cols * 46 + 60 + rng() * 120;
    }
  },
  crowd(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    for (let x = 0; x < BG_W; x += 13 + rng() * 6) {
      const h = 18 + rng() * 14, bx = x;
      wrapDraw(bx, 16, X => {
        ctx.fillStyle = L.color; ctx.beginPath(); ctx.arc(X + 6, L.base - h, 7, 0, TAU); ctx.fill(); ctx.fillRect(X - 2, L.base - h + 4, 16, h);
        if (rng() < 0.25) { ctx.fillRect(X + 10, L.base - h - 16, 3, 16); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(X + 9, L.base - h - 22, 5, 7); }
      });
    }
  },
  grid(ctx, L, rng, H) {
    ctx.strokeStyle = rgba(L.color, 0.35); ctx.lineWidth = 1;
    for (let y = L.base; y < H; y += (y - L.base) * 0.25 + 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); }
    for (let x = 0; x < BG_W; x += 32) { ctx.beginPath(); ctx.moveTo(x, L.base); ctx.lineTo(x + (x - BG_W / 2) * 0.6, H); ctx.stroke(); }
  },
  blocks(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 0;
    const s = L.big ? 16 : 10;
    while (x < BG_W) {
      const cols = 2 + Math.floor(rng() * 4), rows = 2 + Math.floor(rng() * (L.big ? 10 : 14)), bx = x;
      wrapDraw(bx, cols * s, X => {
        ctx.fillStyle = L.color;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (r < rows - 2 || rng() < 0.6) ctx.fillRect(X + c * s, L.base - (r + 1) * s, s - 1, s - 1);
        if (rng() < 0.4) { ctx.fillStyle = 'rgba(0,255,154,0.35)'; ctx.fillRect(X + s, L.base - rows * s * 0.6, s - 1, s - 1); }
      });
      x += cols * s + 6 + rng() * 40;
    }
  },
  tapes(ctx, L, rng, H) {
    this.hills(ctx, { color: L.color, base: L.base, amp: 30 }, rng, H);
    // floating cassette + vinyl silhouettes, faint
    for (let i = 0; i < 7; i++) {
      const fx = i * 146 + rng() * 40, fy = L.base - 120 - rng() * 90;
      wrapDraw(fx, 60, X => {
        ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = shade(L.color, 0.15);
        if (i % 2) { ctx.fillRect(X, fy, 46, 30); ctx.fillStyle = L.color; ctx.beginPath(); ctx.arc(X + 14, fy + 15, 5, 0, TAU); ctx.arc(X + 32, fy + 15, 5, 0, TAU); ctx.fill(); }
        else { ctx.beginPath(); ctx.arc(X + 22, fy + 18, 22, 0, TAU); ctx.fill(); ctx.fillStyle = L.color; ctx.beginPath(); ctx.arc(X + 22, fy + 18, 6, 0, TAU); ctx.fill(); }
        ctx.restore();
      });
    }
  },
  arches(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 128) {
      ctx.fillStyle = shade(L.color, -0.4);
      ctx.beginPath(); ctx.moveTo(x + 24, L.base); ctx.lineTo(x + 24, 150); ctx.arc(x + 64, 150, 40, Math.PI, 0); ctx.lineTo(x + 104, L.base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = rgba(L.window, 0.25);
      ctx.beginPath(); ctx.moveTo(x + 52, 230); ctx.lineTo(x + 52, 180); ctx.arc(x + 64, 180, 12, Math.PI, 0); ctx.lineTo(x + 76, 230); ctx.closePath(); ctx.fill();
      // brick lines
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
      for (let y = 0; y < H; y += 16) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 24, y); ctx.moveTo(x + 104, y); ctx.lineTo(x + 128, y); ctx.stroke(); }
    }
  },
  chains(ctx, L, rng, H) {
    ctx.strokeStyle = L.color; ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++) {
      const cx = rng() * BG_W, len = 60 + rng() * 160;
      for (let y = 0; y < len; y += 12) { ctx.beginPath(); ctx.ellipse(cx, y, i % 2 ? 4 : 2, 6, 0, 0, TAU); ctx.stroke(); }
    }
  }
};

function drawGearShape(ctx, x, y, r, color, teeth, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a0 = i / teeth * TAU, a1 = (i + 0.5) / teeth * TAU;
    ctx.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
    ctx.lineTo(Math.cos(a0 + 0.08) * r * 1.18, Math.sin(a0 + 0.08) * r * 1.18);
    ctx.lineTo(Math.cos(a1 - 0.08) * r * 1.18, Math.sin(a1 - 0.08) * r * 1.18);
    ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
  }
  ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, TAU); ctx.fill();
  ctx.restore();
}

/* ---------- Background renderer (cached per theme + scale) ---------- */
const BG = {
  cache: {},
  get(themeKey, scale) {
    const k = themeKey + '@' + scale.toFixed(2);
    if (this.cache[k]) return this.cache[k];
    // keep cache small (memory on phones)
    const keys = Object.keys(this.cache);
    if (keys.length >= 2) delete this.cache[keys[0]];
    const th = THEMES[themeKey];
    const H = VIEW_ROWS * TS; // 448
    const rng = mulberry32(hashStr(themeKey));
    const bs = scale; // render at exact screen scale so layers blit without resampling
    const layers = th.layers.map((L, i) => {
      const top = Math.max(0, (L.base || 0) - 280);
      const h = H + 60 - top;
      const c = makeCanvas(BG_W * bs, h * bs);
      const ctx = c.getContext('2d');
      const spec = Object.assign({}, L);
      // far layers are painted small and scaled up: a soft depth-of-field blur
      const ps = L.blur ? bs * 0.3 : bs;
      const pc = L.blur ? makeCanvas(BG_W * ps, h * ps) : c;
      const px = pc.getContext('2d');
      px.scale(ps, ps); px.translate(0, -top);
      try { BGPaint[L.kind].call(BGPaint, px, spec, mulberry32(hashStr(themeKey + i)), H + 60); } catch (e) { console.warn('bg paint', L.kind, e); }
      if (L.blur) { ctx.imageSmoothingEnabled = true; ctx.drawImage(pc, 0, 0, c.width, c.height); }
      return { canvas: c, top, h, f: L.f, color: L.color, spec: Object.assign({ top }, L), dyn: L.dyn, fillBelow: ['stalactites', 'curtains', 'floaters', 'chains', 'grid', 'islands', 'tripwaves', 'poles', 'manfar_x'].indexOf(L.kind) < 0 };
    });
    // celestial sprite
    let cel = null;
    if (th.celestial && th.celestial.type !== 'none') cel = makeCelestial(th.celestial, bs);
    // stars
    let stars = null;
    if (th.stars) {
      stars = makeCanvas(BG_W * bs, H * 0.75 * bs);
      const sc = stars.getContext('2d'); sc.scale(bs, bs);
      const n = Math.floor(160 * th.stars);
      for (let i = 0; i < n; i++) {
        const x = rng() * BG_W, y = rng() * H * 0.72, r = rng() < 0.9 ? 0.6 + rng() * 0.8 : 1.4 + rng();
        sc.fillStyle = `rgba(255,255,255,${0.35 + rng() * 0.6})`;
        sc.beginPath(); sc.arc(x, y, r, 0, TAU); sc.fill();
      }
    }
    if (stars && th.milkyway) {
      const sc = stars.getContext('2d');
      sc.save(); sc.scale(bs, bs);
      for (let i = 0; i < 900; i++) {
        const u = rng(), x = u * BG_W, y = H * 0.1 + u * H * 0.35 + (rng() - 0.5) * 70 * (0.6 + rng());
        sc.fillStyle = `rgba(${200 + rng() * 55},${200 + rng() * 55},255,${0.15 + rng() * 0.4})`;
        sc.fillRect(x, y, 0.8, 0.8);
      }
      for (let i = 0; i < 26; i++) {
        const u = i / 26, x = u * BG_W, y = H * 0.1 + u * H * 0.35;
        const g = sc.createRadialGradient(x, y, 0, x, y, 60); g.addColorStop(0, 'rgba(170,150,255,0.08)'); g.addColorStop(1, 'rgba(170,150,255,0)');
        sc.fillStyle = g; sc.fillRect(x - 60, y - 60, 120, 120);
      }
      sc.restore();
    }
    const clouds = [];
    if (th.cloudsDyn) for (let i = 0; i < 4; i++) clouds.push(makeCloudSprite(bs, rng, th));
    const twinkles = [];
    for (let i = 0; i < 24; i++) twinkles.push({ x: rng() * BG_W, y: rng() * H * 0.6, p: rng() * TAU, s: 1 + rng() * 2 });
    const res = { layers, cel, stars, twinkles, clouds, bs, theme: th };
    this.cache[k] = res;
    return res;
  },

  draw(ctx, themeKey, camX, camY, camYRef, viewW, viewH, S, time, flash) {
    const th = THEMES[themeKey];
    const bg = this.get(themeKey, S);
    const W = viewW * S, H = viewH * S;
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, th.sky[0]); g.addColorStop(0.55, th.sky[1]); g.addColorStop(1, th.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const dy = (camY - camYRef);
    // stars
    if (bg.stars) {
      const sw = bg.stars.width, off = -Math.round((camX * 0.02 * S) % sw);
      const y0 = Math.round(-dy * 0.02 * S);
      for (let x = off; x < W; x += sw) ctx.drawImage(bg.stars, x, y0);
      ctx.fillStyle = '#ffffff';
      for (const t of bg.twinkles) {
        const a = 0.5 + 0.5 * Math.sin(time * t.s + t.p);
        let x = (t.x - camX * 0.02) % BG_W; if (x < 0) x += BG_W;
        if (x > viewW) continue;
        ctx.globalAlpha = a * 0.9;
        const r = 1.6 * S * a;
        ctx.fillRect(x * S - r * 2, t.y * S + y0 - 0.5, r * 4, 1);
        ctx.fillRect(x * S - 0.5, t.y * S + y0 - r * 2, 1, r * 4);
      }
      ctx.globalAlpha = 1;
    }
    // aurora
    if (th.aurora) drawAurora(ctx, W, H, S, time);
    // celestial
    if (bg.cel) {
      const c = th.celestial;
      const cx = c.x * W - camX * 0.01 * S, cy = c.y * H - dy * 0.03 * S;
      ctx.drawImage(bg.cel, Math.round(cx - bg.cel.width / 2), Math.round(cy - bg.cel.height / 2));
      if (c.type === 'eclipse') drawCorona(ctx, cx, cy, c.r * S, time);
    }
    // horizon glow
    const hg = ctx.createLinearGradient(0, H * 0.45, 0, H);
    hg.addColorStop(0, rgba(th.horizonGlow, 0)); hg.addColorStop(1, rgba(th.horizonGlow, 0.22));
    ctx.fillStyle = hg; ctx.fillRect(0, H * 0.45, W, H * 0.55);
    if (th.rays) drawRays(ctx, W, H, S, time, th.rays, camX);
    if (th.spotlights) drawSpotlights(ctx, W, H, S, time);
    if (th.storm && flash > 0) { ctx.fillStyle = `rgba(220,220,255,${flash * 0.5})`; ctx.fillRect(0, 0, W, H); }
    if (th.cloudsDyn) drawSkyClouds(ctx, bg, camX, dy, S, W, H, time, th);
    if (th.trippy) drawTripSky(ctx, W, H, S, time);
    // parallax layers
    for (let i = 0; i < bg.layers.length; i++) {
      const L = bg.layers[i];
      const lw = BG_W * S, lh = L.h * S;
      let ox = -((camX * L.f * S) % lw); if (ox > 0) ox -= lw;
      const oy = (L.top - dy * L.f * 0.6) * S;
      const cw = L.canvas.width, iy = Math.round(oy);
      for (let x = Math.round(ox); x < W; x += cw) ctx.drawImage(L.canvas, x, iy);
      if (L.fillBelow && oy + lh < H) { ctx.fillStyle = L.color; ctx.fillRect(0, oy + lh - 1, W, H - oy - lh + 1); }
      if (L.dyn && typeof BGDyn !== 'undefined') BGDyn.draw(ctx, L.dyn, L.spec, camX, oy, S, W, time, th);
      // atmospheric fog between layers
      if (i < bg.layers.length - 1) {
        const fg = ctx.createLinearGradient(0, H * 0.35, 0, H);
        fg.addColorStop(0, rgba(th.fog, 0)); fg.addColorStop(1, rgba(th.fog, 0.1));
        ctx.fillStyle = fg; ctx.fillRect(0, H * 0.35, W, H * 0.65);
      }
    }
    if (th.scanlines) {
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let y = 0; y < H; y += 4 * S) ctx.fillRect(0, y, W, S);
    }
  }
};

function makeCelestial(c, bs) {
  const R = c.r, pad = R * 2.6, size = (R + pad) * 2;
  const cv = makeCanvas(size * bs, size * bs);
  const x = cv.getContext('2d'); x.scale(bs, bs); x.translate(size / 2, size / 2);
  const glow = x.createRadialGradient(0, 0, R * 0.5, 0, 0, R + pad);
  glow.addColorStop(0, rgba(c.glow, 0.55)); glow.addColorStop(0.4, rgba(c.glow, 0.16)); glow.addColorStop(1, rgba(c.glow, 0));
  x.fillStyle = glow; x.beginPath(); x.arc(0, 0, R + pad, 0, TAU); x.fill();
  if (c.type === 'moon') {
    const g = x.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, c.color);
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
    x.fillStyle = 'rgba(160,150,180,0.25)';
    [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.4, 0.12], [0.35, -0.35, 0.1]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a * R, b * R, r * R, 0, TAU); x.fill(); });
  } else if (c.type === 'sun' || c.type === 'sun22') {
    const g = x.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, c.color);
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
    if (c.type === 'sun22') {
      x.fillStyle = rgba(c.glow, 0.55); x.font = `${R * 0.9}px ${FONT_DISPLAY}`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('22', 0, R * 0.05);
    }
  } else if (c.type === 'synthsun') {
    const g = x.createLinearGradient(0, -R, 0, R);
    g.addColorStop(0, '#fff27a'); g.addColorStop(0.5, '#ff8a3a'); g.addColorStop(1, '#ff2e88');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 7; i++) { const yy = R * 0.1 + i * R * 0.13, hh = 2 + i * 1.6; x.fillRect(-R, yy, R * 2, hh); }
    x.globalCompositeOperation = 'source-over';
  } else if (c.type === 'eclipse') {
    x.fillStyle = '#05020c'; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(255,240,210,0.95)'; x.lineWidth = 2.5; x.beginPath(); x.arc(0, 0, R + 1, 0, TAU); x.stroke();
  } else if (c.type === 'glitchsun') {
    for (let i = 0; i < 9; i++) {
      x.fillStyle = i % 2 ? rgba(c.glow, 0.7) : rgba(c.color, 0.85);
      const yy = -R + i * R * 2 / 9, w = Math.sqrt(Math.max(0, R * R - (yy + R / 9) ** 2)) * 2;
      x.fillRect(-w / 2 + (i % 3 - 1) * 6, yy, w, R * 2 / 9 - 2);
    }
  }
  return cv;
}
function drawCorona(ctx, cx, cy, r, t) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.translate(cx, cy);
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * TAU + t * 0.08, len = r * (0.5 + 0.35 * Math.sin(t * 1.3 + i * 2.1));
    const g = ctx.createLinearGradient(Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * (r + len), Math.sin(a) * (r + len));
    g.addColorStop(0, 'rgba(255,220,170,0.35)'); g.addColorStop(1, 'rgba(255,140,200,0)');
    ctx.strokeStyle = g; ctx.lineWidth = r * 0.12;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * (r + len), Math.sin(a) * (r + len)); ctx.stroke();
  }
  ctx.restore();
}
function drawAurora(ctx, W, H, S, t) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const cols = ['rgba(80,255,170,', 'rgba(120,160,255,', 'rgba(200,120,255,'];
  for (let b = 0; b < 3; b++) {
    const base = H * (0.12 + b * 0.07);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const x = i / 40 * W;
      const y = base + Math.sin(i * 0.35 + t * 0.4 + b * 2) * 18 * S + Math.sin(i * 0.13 - t * 0.25) * 22 * S;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    for (let i = 40; i >= 0; i--) {
      const x = i / 40 * W;
      const y = base + 60 * S + Math.sin(i * 0.35 + t * 0.4 + b * 2) * 18 * S + Math.sin(i * 0.2 + t * 0.3) * 10 * S;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, base, 0, base + 80 * S);
    g.addColorStop(0, cols[b] + '0)'); g.addColorStop(0.4, cols[b] + '0.16)'); g.addColorStop(1, cols[b] + '0)');
    ctx.fillStyle = g; ctx.fill();
  }
  ctx.restore();
}
function drawRays(ctx, W, H, S, t, col, camX) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const x = ((i * 220 - camX * 0.05) % (W / S + 300) + W / S + 300) % (W / S + 300) - 150;
    const sway = Math.sin(t * 0.3 + i) * 30;
    const a = 0.05 + 0.03 * Math.sin(t * 0.7 + i * 1.7);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x * S, 0); ctx.lineTo((x + 50) * S, 0); ctx.lineTo((x + 140 + sway) * S, H); ctx.lineTo((x + 40 + sway) * S, H); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function drawSpotlights(ctx, W, H, S, t) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const cols = ['#ff3a6a', '#3affc8', '#ffd84a', '#c83aff'];
  for (let i = 0; i < 4; i++) {
    const ox = W * (0.15 + i * 0.23), oy = 0;
    const a = Math.sin(t * (0.5 + i * 0.13) + i * 2) * 0.5;
    const len = H * 1.3;
    const g = ctx.createLinearGradient(ox, oy, ox + Math.sin(a) * len, oy + Math.cos(a) * len);
    g.addColorStop(0, rgba(cols[i], 0.32)); g.addColorStop(1, rgba(cols[i], 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(ox - 6 * S, oy); ctx.lineTo(ox + 6 * S, oy);
    ctx.lineTo(ox + Math.sin(a + 0.12) * len, oy + Math.cos(a + 0.12) * len);
    ctx.lineTo(ox + Math.sin(a - 0.12) * len, oy + Math.cos(a - 0.12) * len); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function makeCloudSprite(bs, rng, th) {
  const w = 200 + rng() * 140, h = 70 + rng() * 30;
  const c = makeCanvas(w * bs, h * bs), x = c.getContext('2d');
  x.scale(bs, bs);
  const top = mix(th.sky[2], '#ffffff', 0.75), bot = mix(th.sky[1], th.sky[2], 0.5);
  const n = 9 + Math.floor(rng() * 5);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), dome = Math.sin(u * Math.PI);
    const cx = 26 + u * (w - 52) + (rng() - 0.5) * 8, cy = h * 0.66 - dome * h * 0.28 + (rng() - 0.5) * 5, r = 12 + dome * 20 + rng() * 6;
    const g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.5, r * 0.2, cx, cy, r);
    g.addColorStop(0, rgba(top, 0.95)); g.addColorStop(1, rgba(bot, 0.85));
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
  }
  x.globalCompositeOperation = 'destination-out';
  const fade = x.createLinearGradient(0, h * 0.62, 0, h); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
  x.fillStyle = fade; x.fillRect(0, 0, w, h);
  return { c, w, h, y: 30 + rng() * 120, speed: 3 + rng() * 6, x0: rng() * BG_W };
}
function drawSkyClouds(ctx, bg, camX, dy, S, W, H, t, th) {
  for (const cl of bg.clouds) {
    const span = BG_W + cl.w;
    let x = ((cl.x0 + t * cl.speed - camX * 0.03) % span + span) % span - cl.w;
    const y = (cl.y - dy * 0.02) * S;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(cl.c, Math.round(x * S), Math.round(y));
    if (x * S + cl.w * S < W - BG_W * S) ctx.drawImage(cl.c, Math.round((x + span) * S), Math.round(y));
    ctx.globalAlpha = 1;
  }
}
function drawTripSky(ctx, W, H, S, t) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const cx = W * 0.5, cy = H * 0.35, R = Math.hypot(W, H);
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU + t * 0.15;
    ctx.fillStyle = `hsla(${(i * 15 + t * 40) % 360},90%,60%,0.07)`;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(a + TAU / 48) * R, cy + Math.sin(a + TAU / 48) * R); ctx.closePath(); ctx.fill();
  }
  for (let k = 0; k < 5; k++) {
    const r = ((t * 30 + k * 80) % 400) * S;
    ctx.strokeStyle = `hsla(${(k * 70 + t * 60) % 360},100%,65%,${0.25 * (1 - r / (400 * S))})`; ctx.lineWidth = 6 * S;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}
