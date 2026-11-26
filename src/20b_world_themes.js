/* ============================================================
   Super Brady-O World themes: each land (and many single levels)
   gets its own look. New background painters: big-top tents,
   bunting, tent interiors, bleachers, haunted interiors, the DPW
   yard, the trash fence, the Man's saucer pavilion, LED jellyfish
   skies and World 22's pages.
   ============================================================ */
Object.assign(THEMES, {
  bigtop: {
    name: 'Center Camp', music: 'w7', particles: 'confetti',
    sky: ['#3a86e0', '#a8d6f6', '#fff0d2'], horizonGlow: '#fff4d8',
    celestial: { type: 'sun', x: 0.22, y: 0.18, r: 40, color: '#fffbe6', glow: '#ffe08a' },
    stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'nvmountains', color: '#8a7aa8', base: 300, amp: 80, f: 0.03, blur: true, haze: '#e8dcd0' },
      { kind: 'bigtops', color: '#c4885a', base: 360, f: 0.1, c1: '#e8483a', c2: '#fff4e0' },
      { kind: 'bunting', color: '#5a3a2a', base: 300, f: 0.22 },
      { kind: 'camps', color: '#9a6a46', base: 404, f: 0.32, colorful: true, big: true }
    ],
    fog: '#f8e2c0', grade: { color: '#ffc87a', mode: 'soft-light', a: 0.14 }, bloom: 0.12,
    ground: { style: 'deck', cap: '#d89a5a', capHi: '#ffd08a', dirt: '#b07a48', dirt2: '#7a5030', rock: '#c09060' },
    brick: { style: 'plywood', c1: '#e8b47a', c2: '#a87a48', mortar: '#5a4026', tags: true },
    hard: { c1: '#c8a882', c2: '#8a6e52' },
    semi: { style: 'shade', c1: '#e8483a', c2: '#a8282a' },
    pillar: { c1: '#e8483a', c2: '#fff4e0', cap: '#ffd84a', style: 'pole' },
    accent: '#ffcf6a', liquid: 'coffee',
    decor: ['coffeecart', 'couch', 'tapestry', 'campsign', 'beanbag', 'bikerack'],
    tint: { glump: '#ff8a3a', rollo: '#3a8ac4', spiker: '#ff8a1a', flapper: '#7a3aaa', hopper: '#ff7ad8' }
  },
  dpwyard: {
    name: 'Hell Station', music: 'w3', particles: 'sand',
    sky: ['#2a1a3a', '#a84a3a', '#ffb06a'], horizonGlow: '#ff8a3a',
    celestial: { type: 'sun', x: 0.72, y: 0.62, r: 52, color: '#ffe0b0', glow: '#ff6a3a' },
    stars: 0.2, cloudsDyn: true,
    layers: [
      { kind: 'nvmountains', color: '#5a3a4a', base: 312, amp: 100, f: 0.04, blur: true, haze: '#d8885a' },
      { kind: 'yard', color: '#3a2a2e', base: 380, f: 0.12 },
      { kind: 'fence', color: '#ff7a1a', base: 410, f: 0.3, low: true }
    ],
    fog: '#ff9a5a', grade: { color: '#ff7a3a', mode: 'soft-light', a: 0.18 }, bloom: 0.2, dust: 0.2,
    ground: { style: 'metal', cap: '#5a5a62', capHi: '#f2c23a', dirt: '#4a4048', dirt2: '#2a2228', rock: '#5a4e56' },
    brick: { style: 'plywood', c1: '#c8a07a', c2: '#8a6a48', mortar: '#3a2a20' },
    hard: { c1: '#7a7a84', c2: '#3a3a44' },
    semi: { style: 'scaffold', c1: '#f2c23a', c2: '#6a5a2a' },
    pillar: { c1: '#ff7a1a', c2: '#a8481a', cap: '#f2c23a', style: 'barrel' },
    accent: '#f2c23a', spikes: 'rebar',
    decor: ['cone', 'barrelstack', 'cone', 'toolbox', 'hazardsign'],
    tint: { glump: '#ff8a1a', rollo: '#c8c8d8', spiker: '#ff8a1a', flapper: '#5a5a7a', hopper: '#ffd84a' }
  },
  manbase: {
    name: 'The Man Base', music: 'w10', particles: 'embers',
    sky: ['#05030c', '#1a0a2e', '#4a1a3a'], horizonGlow: '#ff4fd8',
    celestial: { type: 'moon', x: 0.2, y: 0.16, r: 20, color: '#ffffff', glow: '#c88aff' },
    stars: 1, night: true,
    layers: [
      { kind: 'nvmountains', color: '#140a20', base: 320, amp: 60, f: 0.02, blur: true },
      { kind: 'saucerbase', color: '#0e0818', base: 392, f: 0.06, neon: '#38f2ff', dyn: 'saucerglow' },
      { kind: 'crowd', color: '#06030a', base: 430, f: 0.36, glow: true }
    ],
    fog: '#a03aff', grade: { color: '#8a3aff', mode: 'soft-light', a: 0.16 }, bloom: 0.46, darkness: 0.36,
    ground: { style: 'metal', cap: '#3a3448', capHi: '#38f2ff', dirt: '#241e30', dirt2: '#120e1a', rock: '#2e2838', night: true },
    brick: { style: 'plywood', c1: '#6a4a3a', c2: '#3a2620', mortar: '#ff4fd8', tags: true },
    hard: { c1: '#4a4458', c2: '#221e2c' },
    semi: { style: 'neon', c1: '#38f2ff', c2: '#160e24' },
    pillar: { c1: '#2a2436', c2: '#0e0a14', cap: '#ff4fd8', style: 'pole' },
    accent: '#38f2ff', spikes: 'neon', liquid: 'lava',
    decor: ['firebarrel', 'ledtree', 'neonarrow', 'firebarrel', 'elbike'],
    tint: { glump: '#ff4fd8', rollo: '#38f2ff', spiker: '#ff8a1a', flapper: '#9a4fff', hopper: '#ffd84a' }
  },
  hotsprings: {
    name: 'Hot Springs', music: 'w4', particles: 'dust',
    sky: ['#4a86c8', '#a8d4ea', '#ffe6c4'], horizonGlow: '#fff0d8',
    celestial: { type: 'sun', x: 0.8, y: 0.2, r: 38, color: '#fffbe6', glow: '#ffd27a' },
    stars: 0, cloudsDyn: true,
    layers: [
      { kind: 'nvmountains', color: '#8a7a9a', base: 300, amp: 120, f: 0.04, blur: true, haze: '#e8d8c8' },
      { kind: 'geysers', color: '#a87a5a', base: 340, f: 0.1, blur: true },
      { kind: 'terraces', color: '#c8885a', base: 396, f: 0.24 }
    ],
    fog: '#f0e0d0', grade: { color: '#ffb87a', mode: 'soft-light', a: 0.14 }, bloom: 0.16, shimmer: true,
    ground: { style: 'mineral', cap: '#e8743a', capHi: '#ffd08a', dirt: '#b06a42', dirt2: '#6a3a24', rock: '#d0905a' },
    brick: { style: 'travertine', c1: '#e8b07a', c2: '#a8744a', mortar: '#6a3e22' },
    hard: { c1: '#d89a6a', c2: '#8a5a3a' },
    semi: { style: 'mossy', c1: '#7ad86a', c2: '#3a8a4a' },
    pillar: { c1: '#e88a4a', c2: '#9a4a2a', cap: '#7ae86a', style: 'geyser' },
    accent: '#3affd8', liquid: 'hot',
    decor: ['steamvent', 'reeds', 'mineralcone', 'reeds', 'rubberduck', 'towelrack'],
    tint: { glump: '#ff8a5a', rollo: '#5ac4a8', spiker: '#ff8a1a', flapper: '#3a5aaa', hopper: '#ff7ad8' }
  },
  witchwoods: {
    name: 'Witchy Woods', music: 'w7', particles: 'fireflies',
    sky: ['#1a1238', '#5a2a6a', '#e87a6a'], horizonGlow: '#ff9a7a',
    celestial: { type: 'moon', x: 0.74, y: 0.2, r: 30, color: '#fff6e0', glow: '#c8a0ff' },
    stars: 0.7,
    layers: [
      { kind: 'mountains', color: '#4a3a6a', base: 300, amp: 100, f: 0.05 },
      { kind: 'forest', color: '#2e2448', base: 352, f: 0.16 },
      { kind: 'forest', color: '#1a142e', base: 404, f: 0.34, big: true }
    ],
    fog: '#a88aff', grade: { color: '#8a5aff', mode: 'soft-light', a: 0.16 }, bloom: 0.28, darkness: 0.2,
    ground: { style: 'grass', cap: '#5a8a5a', capHi: '#a8e08a', dirt: '#4a3a3a', dirt2: '#2a2028', rock: '#6a5a6a' },
    brick: { style: 'stone', c1: '#7a6a8a', c2: '#4a3e58', mortar: '#2a2030' },
    hard: { c1: '#8a7a9a', c2: '#4a3e5a' },
    semi: { style: 'log', c1: '#7a5a4a', c2: '#4a3428' },
    pillar: { c1: '#8a8a9a', c2: '#4a4a5a', cap: '#c8a0ff', style: 'carved' },
    accent: '#c8a0ff', spikes: 'crystal',
    decor: ['crystal', 'mushroom', 'cauldron', 'fern', 'crystal', 'flower'],
    tint: { glump: '#c8a0ff', rollo: '#7affd8', spiker: '#ffa86a', flapper: '#6a3a8a', hopper: '#ff7ad8' }
  },
  pages: {
    name: 'World 22', music: 'glitch', particles: 'petals',
    sky: ['#f4ecdc', '#ece0c8', '#e0d0b4'], horizonGlow: '#c8b8a0',
    celestial: { type: 'sun22', x: 0.5, y: 0.36, r: 64, color: '#1a1a2a', glow: '#8a7aaa' },
    stars: 0, scanlines: false,
    layers: [
      { kind: 'ruled', color: '#8ab0d8', base: 300, f: 0.02, margin: '#e8707a' },
      { kind: 'pagestack', color: '#fffaf0', base: 340, f: 0.1, ink: '#2a2a3a' },
      { kind: 'pagestack', color: '#f0e6d0', base: 410, f: 0.3, ink: '#1a1a2a', big: true }
    ],
    fog: '#e0d0b4', grade: { color: '#ffd8a0', mode: 'soft-light', a: 0.12 }, bloom: 0.08,
    ground: { style: 'paper', cap: '#fffaf0', capHi: '#ffffff', dirt: '#e8dcc4', dirt2: '#c8b898', rock: '#2a2a3a' },
    brick: { style: 'lattice', c1: '#f4ecdc', c2: '#c8b898', mortar: '#2a2a3a' },
    hard: { c1: '#d8ccb4', c2: '#a89878' },
    semi: { style: 'plank', c1: '#fffaf0', c2: '#c8b898' },
    pillar: { c1: '#f4ecdc', c2: '#c8b898', cap: '#2a2a3a', style: 'column' },
    accent: '#3a3a8a', spikes: 'ink', liquid: 'ink',
    decor: ['inkwell', 'quill', 'bookpile', 'inkwell'],
    tint: { glump: '#2a2a3a', rollo: '#8a3a3a', spiker: '#3a3a8a', flapper: '#2a2a3a', hopper: '#8a3a8a' }
  }
});

// ---- variants: one land's palette, re-dressed for a single level ----
function themeVariant(base, key, over) {
  THEMES[key] = Object.assign({}, THEMES[base], over);
  return key;
}
themeVariant('bigtop', 'bigtop_in', {
  name: 'Big Top', particles: 'confetti', spotlights: true, cloudsDyn: false,
  sky: ['#1a0610', '#5a1420', '#a8402a'], horizonGlow: '#ffb84a', celestial: { type: 'none' }, stars: 0.3,
  layers: [
    { kind: 'tentstripes', color: '#3a0a14', base: 300, f: 0.04, c1: '#c8282a', c2: '#f4e0c0' },
    { kind: 'bleachers', color: '#2a1018', base: 392, f: 0.18 },
    { kind: 'crowd', color: '#12060a', base: 430, f: 0.38 }
  ],
  darkness: 0.18, bloom: 0.3, grade: { color: '#ff8a4a', mode: 'soft-light', a: 0.16 },
  ground: { style: 'stage', cap: '#7a3a2a', capHi: '#ffd84a', dirt: '#4a2018', dirt2: '#2a100c', rock: '#5a2a20' },
  semi: { style: 'truss', c1: '#d8d8e0', c2: '#6a6a74' },
  decor: ['spotlightstand', 'beanbag', 'drum', 'spotlightstand']
});
themeVariant('backstage', 'openmic', {
  name: 'Open Mic', music: 'underground', cave: true,
  sky: ['#08050a', '#1a0e14', '#3a1a1a'], horizonGlow: '#ffb84a', particles: 'motes',
  layers: [
    { kind: 'wallpaper', color: '#2a1414', base: 0, f: 0.06, style: 'brick' },
    { kind: 'curtains', color: '#5a0a1a', base: 0, f: 0.1 },
    { kind: 'crowd', color: '#0a0608', base: 430, f: 0.36 }
  ],
  darkness: 0.3, decor: ['micstand', 'setlist', 'amp', 'stool']
});
themeVariant('esplanade', 'subwoofer', {
  name: 'Inside the Subwoofer', music: 'underground', cave: true,
  sky: ['#020204', '#0a0612', '#160a24'], celestial: { type: 'none' }, stars: 0,
  layers: [
    { kind: 'speakers', color: '#0c0a12', base: 420, f: 0.08 },
    { kind: 'wallpaper', color: '#120e18', base: 0, f: 0.16, style: 'felt' }
  ],
  ground: { style: 'neon', cap: '#2a2438', capHi: '#ff4fd8', dirt: '#16121e', dirt2: '#0a080e', rock: '#1e1a28', night: true },
  darkness: 0.5, decor: ['cable', 'amp', 'crystal']
});
themeVariant('esplanade', 'haunt_strobe', {
  name: 'Strobe House', music: 'underground', haunt: true,
  sky: ['#040306', '#0c0814', '#1a0e24'], celestial: { type: 'none' }, stars: 0,
  layers: [{ kind: 'wallpaper', color: '#100c16', base: 0, f: 0.1, style: 'strobe' }],
  ground: { style: 'neon', cap: '#2e2838', capHi: '#ffffff', dirt: '#1a1622', dirt2: '#0c0a10', rock: '#221e2a', night: true },
  darkness: 0.62
});
themeVariant('gate', 'haunt_rv', {
  name: 'The Stowaway RV', music: 'underground', haunt: true, particles: 'dust',
  sky: ['#0a0608', '#1e1210', '#2e1a14'], celestial: { type: 'none' }, stars: 0, cloudsDyn: false,
  layers: [{ kind: 'wallpaper', color: '#3a2418', base: 0, f: 0.08, style: 'rv' }],
  ground: { style: 'deck', cap: '#8a6a4a', capHi: '#c8a070', dirt: '#5a3e2a', dirt2: '#3a2618', rock: '#6a4a32' },
  semi: { style: 'plank', c1: '#a87a4a', c2: '#6a4a2a' },
  darkness: 0.55, decor: ['crate']
});
themeVariant('camps', 'haunt_lost', {
  name: 'The Lost & Found', music: 'underground', haunt: true, particles: 'dust',
  sky: ['#0a0806', '#1a1410', '#2a2018'], celestial: { type: 'none' }, stars: 0, cloudsDyn: false,
  layers: [{ kind: 'wallpaper', color: '#2a2018', base: 0, f: 0.08, style: 'lost' }],
  ground: { style: 'carpet', cap: '#8a3a4a', capHi: '#d8a84a', dirt: '#5a4a3a', dirt2: '#3a2e24', rock: '#6a5a4a' },
  darkness: 0.5
});
themeVariant('camps', 'kandicamp', {
  name: 'Kandi Camp', music: 'secret',
  sky: ['#ff9ad8', '#ffd0f0', '#fff4e0'], horizonGlow: '#ffffff',
  layers: [
    { kind: 'nvmountains', color: '#c89ae8', base: 300, amp: 80, f: 0.03, blur: true, haze: '#ffe0f4' },
    { kind: 'bunting', color: '#8a4a8a', base: 280, f: 0.12, kandi: true },
    { kind: 'camps', color: '#e8a0c8', base: 400, f: 0.3, colorful: true, big: true }
  ],
  ground: { style: 'carpet', cap: '#ff5ab8', capHi: '#7affd8', dirt: '#d8b0c8', dirt2: '#a88098', rock: '#c8a0b8' },
  semi: { style: 'shade', c1: '#7affd8', c2: '#3ac8a8' },
  decor: ['kandistand', 'beanbag', 'tapestry', 'kandistand']
});
themeVariant('esplanade', 'lampcamp', {
  name: 'Lamplighter Camp', music: 'secret', particles: 'fireflies',
  sky: ['#06040a', '#1a1024', '#3a2030'], horizonGlow: '#ffb84a',
  layers: [
    { kind: 'nvmountains', color: '#140c1e', base: 318, amp: 70, f: 0.03, blur: true },
    { kind: 'lanternline', color: '#2a1a14', base: 330, f: 0.14 },
    { kind: 'camps', color: '#0e0818', base: 400, f: 0.3, lights: true, big: true }
  ],
  darkness: 0.7, grade: { color: '#ffa04a', mode: 'soft-light', a: 0.14 },
  decor: ['lantern', 'couch', 'lantern', 'campsignN']
});
themeVariant('camps', 'bikecamp', {
  name: 'Bike Repair Camp', music: 'secret',
  layers: [
    { kind: 'nvmountains', color: '#8a7aa8', base: 300, amp: 90, f: 0.03, blur: true, haze: '#e6dcd0' },
    { kind: 'bikes', color: '#6a4a3a', base: 380, f: 0.14 },
    { kind: 'camps', color: '#8a5a3a', base: 400, f: 0.3, colorful: true, big: true }
  ],
  decor: ['bikerack', 'toolbox', 'tirestack', 'bikerack']
});
themeVariant('camps', 'watercamp', {
  name: 'Hydration Station', music: 'secret', particles: 'bubbles',
  sky: ['#3a9ae8', '#a8e0f8', '#f0fcff'], horizonGlow: '#ffffff',
  ground: { style: 'carpet', cap: '#3ab8e8', capHi: '#c8f4ff', dirt: '#cdb394', dirt2: '#a88c6c', rock: '#bfa384' },
  semi: { style: 'shade', c1: '#5ad0ff', c2: '#2a8ac8' },
  decor: ['waterjug', 'beanbag', 'misting', 'waterjug']
});
themeVariant('camps', 'bubblecamp', {
  name: 'Bubble Camp', particles: 'bubbles',
  sky: ['#4a9ae8', '#b0dcf8', '#fff0f8'],
  layers: [
    { kind: 'clouds', color: '#ffffff', base: 260, f: 0.04 },
    { kind: 'camps', color: '#c88ab0', base: 430, f: 0.12, colorful: true, big: true }
  ]
});
themeVariant('deepplaya', 'jellysky', {
  name: 'LED Jellyfish Drift', particles: 'motes',
  layers: [
    { kind: 'nvmountains', color: '#0e1228', base: 380, amp: 50, f: 0.03, blur: true },
    { kind: 'ledjellies', color: '#38f2ff', base: 330, f: 0.08 },
    { kind: 'ledjellies', color: '#ff4fd8', base: 380, f: 0.18, big: true }
  ],
  darkness: 0.45
});
themeVariant('deepplaya', 'whiteout', {
  name: 'Whiteout', particles: 'sand',
  sky: ['#6a5a5a', '#a89482', '#d8c4a8'], horizonGlow: '#ffe8c8', celestial: { type: 'none' }, stars: 0, milkyway: false,
  dust: 1, darkness: 0.55, grade: { color: '#e8c8a0', mode: 'soft-light', a: 0.3 }
});
themeVariant('dpwyard', 'trashfence', {
  name: 'Trash Fence', particles: 'sand',
  layers: [
    { kind: 'nvmountains', color: '#6a4a5a', base: 312, amp: 100, f: 0.04, blur: true, haze: '#d8a07a' },
    { kind: 'playaflat', color: '#c8a48a', base: 360, f: 0.08, dots: true },
    { kind: 'fence', color: '#ff7a1a', base: 400, f: 0.2, tall: true }
  ],
  dust: 0.35
});
themeVariant('hotsprings', 'mudcanyon', {
  name: 'Mud Slide Canyon', liquid: 'mud',
  layers: [
    { kind: 'mesas', color: '#a8604a', base: 330, f: 0.06 },
    { kind: 'mesas', color: '#7a4a3a', base: 400, f: 0.2 }
  ],
  ground: { style: 'mineral', cap: '#8a5a3a', capHi: '#c89a6a', dirt: '#6a4030', dirt2: '#4a2c20', rock: '#9a6a4a' },
  decor: ['reeds', 'mudpot', 'reeds'], iceStyle: 'mud'
});
themeVariant('sunrise', 'goldenhour', {
  name: 'Golden Hour', sky: ['#5a3a8a', '#ff9a6a', '#ffe0a0'], celestial: { type: 'sun', x: 0.3, y: 0.62, r: 70, color: '#fff4d0', glow: '#ffb07a' },
  layers: [
    { kind: 'clouds', color: '#ffe0c8', base: 260, f: 0.04 },
    { kind: 'clouds', color: '#ffc0a8', base: 380, f: 0.12 }
  ]
});
// caves and fortresses for single levels
function caveLook(base, key, over) { const k = caveVariant(base); THEMES[key] = Object.assign({}, THEMES[k], over); return key; }
caveLook('hotsprings', 'steamcave', { name: 'Steam Caverns', particles: 'bubbles', fog: '#c8fff4', darkness: 0.45 });
caveLook('pages', 'inkcave', {
  name: 'The Margins', particles: 'motes',
  sky: ['#0a0a12', '#14141e', '#1e1e2a'],
  ground: { style: 'paper', cap: '#2a2a3a', capHi: '#8a8aaa', dirt: '#1a1a24', dirt2: '#0e0e14', rock: '#3a3a4a' },
  darkness: 0.5, liquid: 'ink'
});
for (const b of ['gate', 'bigtop', 'esplanade', 'witchwoods', 'hotsprings', 'deepplaya', 'dpwyard', 'manbase', 'sunrise', 'pages']) fortressVariant(b);
Object.assign(THEMES.bigtop_fort, { name: 'Espresso Works', layers: [{ kind: 'pipes', color: '#3a2418', base: 0, f: 0.08 }, { kind: 'gears', color: '#2a1a12', base: 400, f: 0.2 }], fog: '#ffb070', particles: 'sparks', liquid: 'coffee' });
Object.assign(THEMES.esplanade_fort, { name: 'Main Stage', layers: [{ kind: 'curtains', color: '#2a0a3a', base: 0, f: 0.05 }, { kind: 'speakers', color: '#0e0a14', base: 390, f: 0.18 }, { kind: 'crowd', color: '#06040a', base: 430, f: 0.4 }], spotlights: true, fog: '#ff4fd8' });
Object.assign(THEMES.hotsprings_fort, { name: 'The Grotto', layers: [{ kind: 'stalactites', color: '#0a2a30', base: 0, f: 0.1 }, { kind: 'stalagmites', color: '#0e3a40', base: 400, f: 0.22, crystals: '#3affd8' }], fog: '#3affd8', particles: 'bubbles', liquid: 'hot' });
Object.assign(THEMES.manbase_fort, { name: 'The Pavilion', layers: [{ kind: 'saucerbase', color: '#0a0612', base: 420, f: 0.04, neon: '#ff4fd8', near: true, dyn: 'saucerglow' }, { kind: 'chains', color: '#140c18', base: 0, f: 0.2 }], fog: '#ff4fd8', particles: 'embers', spikes: 'neon', liquid: 'lava' });
Object.assign(THEMES.pages_fort, { name: 'The Archive', layers: [{ kind: 'wallpaper', color: '#3a2a20', base: 0, f: 0.08, style: 'books' }], fog: '#c8a878', particles: 'motes', spikes: 'ink', liquid: 'ink' });
Object.assign(THEMES.dpwyard_fort, { spikes: 'rebar', layers: [{ kind: 'yard', color: '#1e1418', base: 400, f: 0.1, near: true }, { kind: 'chains', color: '#120c0e', base: 0, f: 0.22 }] });
Object.assign(THEMES.witchwoods_fort, { name: 'The Coven', spikes: 'crystal', layers: [{ kind: 'forest', color: '#1a1030', base: 380, f: 0.12 }, { kind: 'chains', color: '#120a1e', base: 0, f: 0.2 }], fog: '#c8a0ff' });
THEMES.camps.iceStyle = 'butter';
// two lands' castles get open-air looks instead of the generic fortress hall
Object.assign(THEMES.gate_fort, { name: 'Greeter Station', sky: ['#1a1238', '#a84a6a', '#ffb07a'], celestial: { type: 'sun', x: 0.75, y: 0.66, r: 50, color: '#fff0c8', glow: '#ff8a5a' }, stars: 0.4,
  layers: [{ kind: 'nvmountains', color: '#4a3a6a', base: 312, amp: 110, f: 0.04, blur: true, haze: '#d88a8a' }, { kind: 'convoy', color: '#2a2036', base: 380, f: 0.14, dyn: 'dustplumes' }, { kind: 'flagline', color: '#1a1424', base: 410, f: 0.32 }],
  fog: '#ff9a7a', particles: 'sand', darkness: 0.12, decor: ['greeterbell', 'cone', 'gatesign', 'cone'] });
Object.assign(THEMES.deepplaya_fort, { name: 'The Vortex', sky: ['#3a2a3a', '#9a6a5a', '#d8a878'], celestial: { type: 'sun', x: 0.22, y: 0.5, r: 40, color: '#ffe8c0', glow: '#d8905a' }, stars: 0, particles: 'sand', dust: 0.5,
  layers: [{ kind: 'nvmountains', color: '#5a4448', base: 330, amp: 80, f: 0.03, blur: true, haze: '#c89a7a' }, { kind: 'sculptures', color: '#3a2a2a', base: 400, f: 0.14, lit: true, dyn: 'dustdevil' }],
  fog: '#d8c0a0', darkness: 0.16 });
// a night traffic jam for Six Days on the Road, a laser-grid dance floor for the rave
themeVariant('gate', 'gate_night', { name: 'Six Days on the Road', sky: ['#05040e', '#1a1440', '#4a2a5a'], celestial: { type: 'moon', x: 0.8, y: 0.18, r: 24, color: '#fffbe8', glow: '#a8c8ff' }, stars: 1, cloudsDyn: false, night: true, darkness: 0.32,
  layers: [{ kind: 'nvmountains', color: '#1a1430', base: 312, amp: 110, f: 0.04, blur: true }, { kind: 'convoy', color: '#120e1e', base: 382, f: 0.2, dyn: 'dustplumes' }, { kind: 'flagline', color: '#0e0a16', base: 412, f: 0.4 }],
  ground: Object.assign({}, THEMES.gate.ground, { night: true }), particles: 'motes' });
themeVariant('esplanade', 'laserrave', { name: 'Laser Grid Rave', sky: ['#02010a', '#0a0420', '#24083a'],
  layers: [{ kind: 'grid', color: '#ff4fd8', base: 300, f: 0.06 }, { kind: 'speakers', color: '#0a0812', base: 390, f: 0.16, dyn: 'lasers' }, { kind: 'crowd', color: '#05030a', base: 430, f: 0.36, glow: true }],
  spotlights: true, darkness: 0.46 });
Object.assign(THEMES.sunrise_fort, { name: 'The Last Stage', layers: [{ kind: 'soundcar', color: '#2a1a3a', base: 400, f: 0.1, dyn: 'lasers' }, { kind: 'crowd', color: '#120a18', base: 430, f: 0.36 }], sky: ['#2a1a4a', '#c86aa8', '#ffc08a'], spotlights: true });

/* ---------- new background painters ---------- */
Object.assign(BGPaint, {
  bigtops(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 20;
    while (x < BG_W - 40) {
      const w = 120 + rng() * 90, h = 70 + rng() * 40, bx = x, seed = Math.floor(rng() * 1e6);
      wrapDraw(bx, w, X => {
        const r2 = mulberry32(seed), cx = X + w / 2, top = L.base - h - 40;
        // walls
        const n = 8;
        for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? L.c1 : L.c2; ctx.fillRect(X + i * w / n, L.base - h * 0.45, w / n + 0.5, h * 0.45); }
        // the striped cone roof
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = i % 2 ? L.c1 : L.c2;
          ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(X + i * w / n, L.base - h * 0.45); ctx.lineTo(X + (i + 1) * w / n, L.base - h * 0.45); ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(X + w, L.base - h * 0.45); ctx.lineTo(X + w * 0.7, L.base - h * 0.45); ctx.fill();
        // scalloped valance
        ctx.fillStyle = '#ffd84a';
        for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.arc(X + (i + 0.5) * w / 10, L.base - h * 0.45, w / 20, 0, Math.PI); ctx.fill(); }
        // pole + pennant
        ctx.fillStyle = '#5a3a2a'; ctx.fillRect(cx - 1.5, top - 26, 3, 28);
        ctx.fillStyle = r2() < 0.5 ? '#38c8ff' : '#7aff8a'; ctx.beginPath(); ctx.moveTo(cx + 1.5, top - 26); ctx.lineTo(cx + 18, top - 21); ctx.lineTo(cx + 1.5, top - 16); ctx.fill();
        // doorway
        ctx.fillStyle = 'rgba(30,10,10,0.75)'; ctx.beginPath(); ctx.moveTo(cx - 12, L.base); ctx.quadraticCurveTo(cx, L.base - 34, cx + 12, L.base); ctx.fill();
      });
      x += w + 30 + rng() * 60;
    }
  },
  bunting(ctx, L, rng, H) {
    const cols = L.kandi ? ['#ff5ab8', '#7affd8', '#ffd84a', '#5ab0ff', '#c87aff'] : ['#ff5a6a', '#ffd84a', '#38c8ff', '#7aff8a', '#ffffff'];
    for (let row = 0; row < 2; row++) {
      const y0 = L.base + row * 46;
      const span = 260;
      for (let x0 = 0; x0 < BG_W; x0 += span) {
        wrapDraw(x0, span, X => {
          ctx.strokeStyle = rgba(L.color, 0.7); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(X, y0); ctx.quadraticCurveTo(X + span / 2, y0 + 40, X + span, y0); ctx.stroke();
          for (let k = 1; k < 16; k++) {
            const t = k / 16, px = X + span * t, py = y0 + 40 * 2 * t * (1 - t) * 1.0;
            ctx.fillStyle = cols[(k + row) % cols.length];
            if (L.kandi) { ctx.beginPath(); ctx.arc(px, py + 3, 3.4, 0, TAU); ctx.fill(); }
            else { ctx.beginPath(); ctx.moveTo(px - 5, py); ctx.lineTo(px + 5, py); ctx.lineTo(px, py + 12); ctx.closePath(); ctx.fill(); }
          }
        });
      }
    }
  },
  tentstripes(ctx, L, rng, H) {
    // the inside of the big top: canvas panels fan up to the king pole
    const cx = BG_W / 2, top = -40;
    for (let i = -14; i <= 14; i++) {
      ctx.fillStyle = (i & 1) ? L.c1 : L.c2;
      ctx.globalAlpha = (i & 1) ? 0.9 : 0.55;
      ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx + i * 40, H); ctx.lineTo(cx + (i + 1) * 40, H); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.5, 'rgba(0,0,0,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, BG_W, H);
    // string lights swooping across
    for (let r = 0; r < 3; r++) {
      const y0 = 80 + r * 70;
      ctx.strokeStyle = 'rgba(40,20,20,0.8)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y0); for (let x = 0; x <= BG_W; x += 16) ctx.lineTo(x, y0 + Math.sin(x / BG_W * TAU * 3) * 18); ctx.stroke();
      for (let x = 8; x < BG_W; x += 22) { ctx.fillStyle = rgba(['#fff2c0', '#ffd84a', '#ff9a6a'][(x / 22 | 0) % 3], 0.95); ctx.beginPath(); ctx.arc(x, y0 + Math.sin(x / BG_W * TAU * 3) * 18 + 3, 2.2, 0, TAU); ctx.fill(); }
    }
    ctx.fillStyle = '#2a1410'; ctx.fillRect(cx - 5, top, 10, H);
  },
  bleachers(ctx, L, rng, H) {
    for (let r = 0; r < 6; r++) {
      const y = L.base - 60 + r * 12;
      ctx.fillStyle = shade(L.color, r % 2 ? -0.1 : 0.1); ctx.fillRect(0, y, BG_W, 12);
      for (let x = 4; x < BG_W; x += 9 + rng() * 6) {
        ctx.fillStyle = rgba(['#ff7a5a', '#ffd84a', '#5ac8ff', '#c87aff', '#ffffff'][Math.floor(rng() * 5)], 0.35);
        ctx.beginPath(); ctx.arc(x, y - 4, 3.4, 0, TAU); ctx.fill();
      }
    }
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base + 12, BG_W, H);
  },
  wallpaper(ctx, L, rng, H) {
    const st = L.style || 'rv';
    ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
    if (st === 'rv') {
      // wood paneling, curtained windows with the night outside, a framed photo
      for (let x = 0; x < BG_W; x += 24) { ctx.fillStyle = shade(L.color, ((x / 24) % 3 - 1) * 0.08); ctx.fillRect(x, 0, 23, H); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 23, 0, 1, H); }
      for (let x = 60; x < BG_W; x += 220) {
        wrapDraw(x, 90, X => {
          ctx.fillStyle = '#0a0a1e'; rr(ctx, X, 100, 90, 60, 10); ctx.fill();
          ctx.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) ctx.fillRect(X + 10 + i * 13, 112 + (i % 3) * 12, 1.5, 1.5);
          ctx.fillStyle = '#8a3a3a'; ctx.fillRect(X - 6, 94, 22, 72); ctx.fillRect(X + 74, 94, 22, 72);
          ctx.fillStyle = '#5a3a24'; ctx.fillRect(X - 10, 90, 110, 6);
        });
      }
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, 300, BG_W, 6);
    } else if (st === 'strobe') {
      for (let y = 0; y < H; y += 40) for (let x = (y / 40 % 2) * 20; x < BG_W; x += 40) { ctx.fillStyle = 'rgba(160,180,255,0.07)'; ctx.fillRect(x, y, 38, 38); }
      for (let x = 80; x < BG_W; x += 260) wrapDraw(x, 60, X => { ctx.strokeStyle = 'rgba(200,220,255,0.25)'; ctx.lineWidth = 3; rr(ctx, X, 120, 60, 120, 30); ctx.stroke(); ctx.fillStyle = 'rgba(200,220,255,0.06)'; ctx.fill(); });
    } else if (st === 'lost') {
      // shelves stacked with lost stuff
      for (let y = 60; y < H; y += 70) {
        ctx.fillStyle = shade(L.color, 0.15); ctx.fillRect(0, y, BG_W, 6);
        for (let x = 6; x < BG_W; x += 14 + rng() * 22) {
          const k = rng(), c = ['#8a3a4a', '#3a6a8a', '#c8a03a', '#5a8a4a', '#8a5aa8', '#d8d0c0'][Math.floor(rng() * 6)];
          ctx.fillStyle = rgba(c, 0.55);
          if (k < 0.3) { rr(ctx, x, y - 22, 16, 22, 3); ctx.fill(); }                          // backpack
          else if (k < 0.5) { ctx.beginPath(); ctx.arc(x + 6, y - 8, 7, 0, TAU); ctx.fill(); }  // hat
          else if (k < 0.7) { ctx.fillRect(x, y - 10, 18, 10); }                               // shoe box
          else { ctx.beginPath(); ctx.ellipse(x + 8, y - 5, 9, 5, 0, 0, TAU); ctx.fill(); }      // a single shoe
        }
      }
    } else if (st === 'books') {
      for (let y = 40; y < H; y += 64) {
        ctx.fillStyle = shade(L.color, 0.2); ctx.fillRect(0, y, BG_W, 5);
        for (let x = 2; x < BG_W; x += 7 + rng() * 6) { const h = 30 + rng() * 22; ctx.fillStyle = rgba(['#8a2a2a', '#2a4a7a', '#4a6a3a', '#7a5a2a', '#5a3a6a'][Math.floor(rng() * 5)], 0.75); ctx.fillRect(x, y - h, 6, h); ctx.fillStyle = 'rgba(255,220,150,0.35)'; ctx.fillRect(x + 1, y - h + 5, 4, 1); }
      }
    } else if (st === 'brick') {
      for (let y = 0; y < H; y += 12) for (let x = (y / 12 % 2) * 14; x < BG_W; x += 28) { ctx.fillStyle = shade(L.color, (rng() - 0.5) * 0.25); ctx.fillRect(x + 1, y + 1, 26, 10); }
    } else if (st === 'felt') {
      for (let i = 0; i < 400; i++) { ctx.fillStyle = 'rgba(255,255,255,0.025)'; ctx.fillRect(rng() * BG_W, rng() * H, 2, 2); }
      for (let x = 140; x < BG_W; x += 340) wrapDraw(x, 200, X => { ctx.strokeStyle = 'rgba(255,79,216,0.12)'; ctx.lineWidth = 6; for (let r = 30; r < 110; r += 22) { ctx.beginPath(); ctx.arc(X + 100, 200, r, 0, TAU); ctx.stroke(); } });
    }
  },
  yard(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    let x = 0;
    while (x < BG_W) {
      const k = rng(), bx = x, seed = Math.floor(rng() * 1e6);
      let w;
      if (k < 0.3) { // fuel tank on legs
        w = 70;
        wrapDraw(bx, w, X => { ctx.fillStyle = L.color; rr(ctx, X, L.base - 58, 70, 34, 16); ctx.fill(); ctx.fillRect(X + 10, L.base - 26, 4, 26); ctx.fillRect(X + 56, L.base - 26, 4, 26); ctx.fillStyle = 'rgba(255,200,80,0.25)'; ctx.fillRect(X + 4, L.base - 44, 62, 3); });
      } else if (k < 0.5) { // shipping container
        w = 90;
        wrapDraw(bx, w, X => { ctx.fillStyle = L.color; ctx.fillRect(X, L.base - 34, 90, 34); ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 4; i < 90; i += 7) ctx.fillRect(X + i, L.base - 32, 2, 30); });
      } else if (k < 0.7) { // crane
        w = 60;
        wrapDraw(bx, 160, X => {
          ctx.strokeStyle = L.color; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(X + 10, L.base); ctx.lineTo(X + 10, L.base - 150); ctx.lineTo(X + 150, L.base - 140); ctx.stroke();
          ctx.lineWidth = 1; for (let i = 0; i < 150; i += 12) { ctx.beginPath(); ctx.moveTo(X + 6, L.base - i); ctx.lineTo(X + 14, L.base - i - 12); ctx.stroke(); }
          ctx.beginPath(); ctx.moveTo(X + 120, L.base - 141); ctx.lineTo(X + 120, L.base - 90); ctx.stroke();
          ctx.fillStyle = L.color; ctx.fillRect(X + 112, L.base - 92, 16, 10);
          ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(X + 10, L.base - 152, 2.5, 0, TAU); ctx.fill();
        });
      } else { // light tower
        w = 30;
        wrapDraw(bx, w, X => { ctx.fillStyle = L.color; ctx.fillRect(X + 13, L.base - 110, 4, 110); ctx.fillRect(X, L.base - 118, 30, 10); ctx.fillStyle = 'rgba(255,240,200,0.6)'; for (let i = 0; i < 4; i++) ctx.fillRect(X + 2 + i * 7, L.base - 116, 5, 6); });
      }
      x += w + 20 + rng() * 50;
    }
  },
  fence(ctx, L, rng, H) {
    const top = L.base - (L.tall ? 70 : 40);
    ctx.fillStyle = rgba('#3a2a20', 1);
    for (let x = 0; x < BG_W; x += 64) ctx.fillRect(x, top - 4, 4, L.base - top + 8);
    ctx.strokeStyle = rgba(L.color, 0.55); ctx.lineWidth = 1;
    for (let x = 0; x < BG_W; x += 6) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 18, L.base); ctx.moveTo(x + 18, top); ctx.lineTo(x, L.base); ctx.stroke(); }
    ctx.fillStyle = rgba(L.color, 0.85); ctx.fillRect(0, top, BG_W, 3);
    // trash caught in the fence
    for (let i = 0; i < 40; i++) { ctx.fillStyle = rgba(['#ffffff', '#c8c8d0', '#5ac8ff', '#ffd84a'][i % 4], 0.6); const x = rng() * BG_W, y = top + rng() * (L.base - top); ctx.fillRect(x, y, 3 + rng() * 5, 2 + rng() * 3); }
    ctx.fillStyle = shade('#c8a48a', -0.2); ctx.fillRect(0, L.base, BG_W, H - L.base);
  },
  saucerbase(ctx, L, rng, H) {
    // the Man's pavilion: a flying-saucer-like platform on legs, the Man on top
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    const cx = BG_W / 2, s = L.near ? 1.5 : 1;
    const deck = L.base - 70 * s;
    for (const lx of [-120, -60, 60, 120]) { ctx.fillStyle = L.color; ctx.fillRect(cx + lx * s - 4, deck, 8, L.base - deck); }
    ctx.fillStyle = shade(L.color, 0.15);
    ctx.beginPath(); ctx.ellipse(cx, deck, 200 * s, 26 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = L.color; ctx.beginPath(); ctx.ellipse(cx, deck - 12 * s, 120 * s, 40 * s, 0, Math.PI, TAU); ctx.fill();
    ctx.strokeStyle = rgba(L.neon, 0.85); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, deck, 200 * s, 26 * s, 0, 0, TAU); ctx.stroke();
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; ctx.fillStyle = rgba(i % 2 ? L.neon : '#ff4fd8', 0.95); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 200 * s, deck + Math.sin(a) * 26 * s, 2.2, 0, TAU); ctx.fill(); }
    drawManFigure(ctx, cx, deck - 46 * s, 1.15 * s, shade(L.color, 0.2), L.neon);
    // a little cage up top where Chinka waits
    ctx.strokeStyle = 'rgba(255,220,150,0.8)'; ctx.lineWidth = 1.2;
    ctx.strokeRect(cx - 8 * s, deck - 46 * s - 160 * s, 16 * s, 20 * s);
  },
  ledjellies(ctx, L, rng, H) {
    const n = L.big ? 7 : 12;
    for (let i = 0; i < n; i++) {
      const x = rng() * BG_W, y = L.base - 40 - rng() * 220, r = (L.big ? 20 : 11) + rng() * 8;
      wrapDraw(x - r, r * 2, X => {
        const cx = X + r;
        const g = ctx.createRadialGradient(cx, y, 2, cx, y, r * 2.4); g.addColorStop(0, rgba(L.color, 0.35)); g.addColorStop(1, rgba(L.color, 0));
        ctx.fillStyle = g; ctx.fillRect(cx - r * 2.4, y - r * 2.4, r * 4.8, r * 4.8);
        ctx.fillStyle = rgba(L.color, 0.55); ctx.beginPath(); ctx.arc(cx, y, r, Math.PI, TAU); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba(L.color, 0.5); ctx.lineWidth = 1.2;
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(cx - r * 0.7 + k * r * 0.35, y); ctx.quadraticCurveTo(cx - r * 0.7 + k * r * 0.35 + 5, y + r, cx - r * 0.7 + k * r * 0.35, y + r * 2); ctx.stroke(); }
      });
    }
  },
  ruled(ctx, L, rng, H) {
    ctx.strokeStyle = rgba(L.color, 0.4); ctx.lineWidth = 1;
    for (let y = 30; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BG_W, y); ctx.stroke(); }
    ctx.strokeStyle = rgba(L.margin, 0.5); ctx.lineWidth = 1.5;
    for (const x of [120, 120 + BG_W / 2]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    // doodles in the margin
    ctx.strokeStyle = 'rgba(40,40,70,0.25)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 10; i++) { const x = rng() * BG_W, y = 40 + rng() * 260; ctx.beginPath(); ctx.arc(x, y, 6 + rng() * 10, 0, TAU * (0.5 + rng() * 0.5)); ctx.stroke(); }
  },
  pagestack(ctx, L, rng, H) {
    const n = L.big ? 6 : 10;
    for (let i = 0; i < n; i++) {
      const w = (L.big ? 120 : 70) + rng() * 40, h = w * 1.3, x = rng() * BG_W, y = L.base - h * 0.8 - rng() * 60, rot = (rng() - 0.5) * 0.5;
      wrapDraw(x - w, w * 2, X => {
        ctx.save(); ctx.translate(X + w / 2, y + h / 2); ctx.rotate(rot);
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-w / 2 + 4, -h / 2 + 4, w, h);
        ctx.fillStyle = L.color; ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = rgba(L.ink, 0.35); ctx.lineWidth = 1;
        for (let ly = -h / 2 + 14; ly < h / 2 - 8; ly += 8) { const lw = w * (0.4 + ((ly * 13) % 7) / 14); ctx.beginPath(); ctx.moveTo(-w / 2 + 8, ly); ctx.lineTo(-w / 2 + 8 + lw, ly); ctx.stroke(); }
        ctx.fillStyle = rgba(L.ink, 0.6); ctx.font = `${Math.round(w / 6)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('22', 0, h / 2 - 6);
        ctx.restore();
      });
    }
    ctx.fillStyle = shade(L.color, -0.08); ctx.fillRect(0, L.base, BG_W, H - L.base);
  },
  bikes(ctx, L, rng, H) {
    ctx.fillStyle = L.color; ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.strokeStyle = L.color; ctx.lineWidth = 2;
    for (let x = 10; x < BG_W; x += 34 + rng() * 30) {
      const y = L.base - 2;
      ctx.beginPath(); ctx.arc(x, y - 10, 10, 0, TAU); ctx.arc(x + 28, y - 10, 10, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 12, y - 26); ctx.lineTo(x + 28, y - 10); ctx.moveTo(x + 12, y - 26); ctx.lineTo(x + 24, y - 28); ctx.stroke();
    }
  },
  lanternline(ctx, L, rng, H) {
    for (let r = 0; r < 3; r++) {
      const y0 = L.base - 160 + r * 50;
      ctx.strokeStyle = rgba(L.color, 0.9); ctx.lineWidth = 1;
      ctx.beginPath(); for (let x = 0; x <= BG_W; x += 12) ctx.lineTo(x, y0 + Math.sin(x / BG_W * TAU * 2 + r) * 22); ctx.stroke();
      for (let x = 20 + r * 15; x < BG_W; x += 60) {
        const y = y0 + Math.sin(x / BG_W * TAU * 2 + r) * 22;
        const g = ctx.createRadialGradient(x, y + 8, 1, x, y + 8, 22); g.addColorStop(0, 'rgba(255,190,90,0.55)'); g.addColorStop(1, 'rgba(255,140,40,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 22, y - 14, 44, 44);
        ctx.fillStyle = 'rgba(255,200,110,0.9)'; ctx.beginPath(); ctx.ellipse(x, y + 8, 5, 7, 0, 0, TAU); ctx.fill();
      }
    }
  }
});
Object.assign(BGDyn, {
  saucerglow(ctx, L, camX, oy, S, W, t) {
    const cx = ((BG_W / 2 - camX * L.f) % BG_W + BG_W) % BG_W * S;
    const s = L.near ? 1.5 : 1, y = oy + (L.base - L.top - 70 * s) * S;
    ctx.globalCompositeOperation = 'lighter';
    for (const off of [0, -BG_W * S, BG_W * S]) {
      const X = cx + off; if (X < -400 * S || X > W + 400 * S) continue;
      const g = ctx.createRadialGradient(X, y, 10 * S, X, y, 230 * S * s);
      g.addColorStop(0, `rgba(56,242,255,${0.16 + 0.06 * Math.sin(t * 2)})`); g.addColorStop(1, 'rgba(56,242,255,0)');
      ctx.fillStyle = g; ctx.fillRect(X - 240 * S * s, y - 200 * S * s, 480 * S * s, 300 * S * s);
      // the Man's head pulses
      const hg = ctx.createRadialGradient(X, y - 150 * S * s, 2, X, y - 150 * S * s, 40 * S * s);
      hg.addColorStop(0, `rgba(255,240,180,${0.5 + 0.3 * Math.sin(t * 3)})`); hg.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = hg; ctx.fillRect(X - 40 * S * s, y - 190 * S * s, 80 * S * s, 80 * S * s);
    }
  }
});
