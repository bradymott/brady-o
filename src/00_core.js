'use strict';
/* ============================================================
   BRADY-O — core constants, helpers, save data
   ============================================================ */
const TS = 32;               // logical pixels per tile
const VIEW_ROWS = 12;        // tiles visible vertically
const STEP = 1 / 120;        // fixed simulation step
const GAME_VERSION = '1.0.0';

// ---- Tile ids ------------------------------------------------
const T = {
  EMPTY: 0, GROUND: 1, BRICK: 2, QBLOCK: 3, USED: 4, HARD: 5, HIDDEN: 6, SEMI: 7,
  SPIKES: 8, LAVA: 9, WATER: 10, ICE: 11, CONV_L: 12, CONV_R: 13, PICK: 14,
  FAKE: 15, CRUMBLE: 16, PILLAR: 17, SPIKES_CEIL: 18, QBRICK: 19, GLITCH: 20
};
const SOLID = new Uint8Array(32);
[T.GROUND, T.BRICK, T.QBLOCK, T.USED, T.HARD, T.ICE, T.CONV_L, T.CONV_R, T.CRUMBLE,
 T.PILLAR, T.SPIKES, T.SPIKES_CEIL, T.QBRICK, T.GLITCH].forEach(t => SOLID[t] = 1);
const GROUNDLIKE = new Uint8Array(32);
[T.GROUND, T.FAKE].forEach(t => GROUNDLIKE[t] = 1);

// ---- Math helpers --------------------------------------------
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
const approach = (v, target, amt) => v < target ? Math.min(v + amt, target) : Math.max(v - amt, target);
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const TAU = Math.PI * 2;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function mulberry32(seed) {
  let a = seed >>> 0;
  const f = function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  f.range = (a, b) => a + f() * (b - a);
  f.int = (a, b) => Math.floor(a + f() * (b - a + 1));
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.chance = p => f() < p;
  f.weighted = (items) => { // items: [[value, weight], ...]
    let tot = 0; for (const it of items) tot += it[1];
    let r = f() * tot;
    for (const it of items) { r -= it[1]; if (r <= 0) return it[0]; }
    return items[items.length - 1][0];
  };
  return f;
}
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// colour helpers
function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
function shade(hex, amt) { // amt -1..1 : darken / lighten
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}
function mix(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  return rgbToHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}

// ---- Fonts -----------------------------------------------------
const FONT_DISPLAY = '"Bungee", "Arial Black", Impact, system-ui, sans-serif';
const FONT_UI = '"Rubik", "Avenir Next", "Helvetica Neue", system-ui, sans-serif';

// ---- Save data -------------------------------------------------
const Save = {
  // each standalone app keeps its own save; the combined test build keeps the original key
  key: ({ burningman: 'bgtbm-save-v1', world: 'super-brady-o-world-save-v1', kart: 'art-cart-save-v1' })[typeof BRADY_APP !== 'undefined' ? BRADY_APP : ''] || 'brady-o-save-v1',
  data: null,
  defaults() {
    return {
      v: 1,
      unlocked: { '1-1': true },
      done: {},          // levelId -> true
      gold: {},          // levelId -> [bool,bool,bool]
      secretExits: {},   // levelId -> true
      worldsSeen: { 1: true },
      lives: 5,
      score: 0,
      best: {},          // levelId -> best time
      look: { hair: 0, skin: 1, style: 'bun', glasses: 'shades', tattoos: true, beard: true, v: 2 },
      settings: { music: 0.6, sfx: 0.8, ctrlScale: 1, lefty: false, hq: false, shake: true },
      eggs: {},
      lastWorld: 1,
      deaths: 0,
      beatGame: false
    };
  },
  load() {
    let d = null;
    try { const raw = localStorage.getItem(this.key); if (raw) d = JSON.parse(raw); } catch (e) { d = null; }
    const def = this.defaults();
    if (!d || typeof d !== 'object') d = def;
    for (const k in def) if (d[k] === undefined) d[k] = def[k];
    for (const k in def.settings) if (d.settings[k] === undefined) d.settings[k] = def.settings[k];
    if (!d.look || !d.look.v) d.look = Object.assign({}, def.look); // look v2: modelled on Brady's photo
    for (const k in def.look) if (d.look[k] === undefined) d.look[k] = def.look[k];
    // v3: the games were restructured (Brady-O Burns in 3D, Super Brady-O World's new lands),
    // so old 2D level progress no longer matches any level. Keep looks, settings, lives, kart and eggs.
    if ((d.v || 0) < 3) {
      d.done = {}; d.unlocked = { '41-1': true }; d.gold = {}; d.best = {}; d.secretExits = {}; d.world3 = {};
      d.worldsSeen = {}; d.seenIntro = false; d.seenWorldIntro = false; d.beatGame = false; d.lastWorld = 41;
      d.v = 3;
    }
    this.data = d;
    return d;
  },
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* storage unavailable */ }
  },
  reset() { this.data = this.defaults(); this.save(); }
};

// ---- Customisation palettes -----------------------------------
const HAIR_COLORS = [
  { name: 'Sun-Kissed Brown', base: '#5c4231', hi: '#c7a274' },
  { name: 'Jet Black', base: '#16141a', hi: '#3a3644' },
  { name: 'Dark Brown', base: '#3b2416', hi: '#6e4a30' },
  { name: 'Chestnut', base: '#5e3418', hi: '#9a6236' },
  { name: 'Dirty Blond', base: '#9c7a45', hi: '#d1b27a' },
  { name: 'Golden Blond', base: '#c99a3c', hi: '#f1d58a' },
  { name: 'Copper', base: '#8f3d1c', hi: '#d26a3a' },
  { name: 'Silver', base: '#8d8f99', hi: '#d7d9e2' },
  { name: 'Neon Violet', base: '#5a1fb0', hi: '#ff6ae8', secret: true }
];
const SKIN_TONES = [
  { name: 'Fair', base: '#f4d2bc', sh: '#d9a98d' },
  { name: 'Light', base: '#e8b996', sh: '#c98e6b' },
  { name: 'Medium', base: '#c98c62', sh: '#a26a45' },
  { name: 'Tan', base: '#a96c43', sh: '#844e2d' },
  { name: 'Brown', base: '#7c4a2c', sh: '#5d341d' },
  { name: 'Deep', base: '#4d2e1e', sh: '#361f13' }
];
