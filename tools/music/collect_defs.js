// Collects every song definition that is added at load time with Sound.addTrack (Super Brady-O World's
// countries, title and map; Burning Man's w16/w17 kits) from a source tree, as plain JSON.
// usage: node collect_defs.js <repoDir> <out.json>
const fs = require('fs'), path = require('path'), vm = require('vm');
const repo = path.resolve(process.argv[2]), out = process.argv[3];
const dir = path.join(repo, 'src');
const WORLD_DROP = ['08c_designs.js', '20b_world_themes.js', '24_sloth.js', '26_worlddata.js', '27_brcmap.js', '27_brcmap_land.js'];
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().filter(f => parseInt(f, 10) < 30 && !WORLD_DROP.includes(f));
const noop = () => proxy;
const proxy = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : (k === 'width' || k === 'height' ? 64 : k === 'length' ? 0 : noop), set: () => true, apply: () => proxy });
const canvas = () => ({ width: 64, height: 64, style: {}, getContext: () => proxy, addEventListener() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 900, height: 450 }), toDataURL: () => '' });
const defs = { sbw: {}, bm: {} }, aliases = {};
const win = {
  console: { log() {}, warn() {}, error() {}, info() {} }, Date, Math, JSON, performance: { now: () => Date.now() }, setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {},
  navigator: { userAgent: 'node', getGamepads: () => [] },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  addEventListener() {}, removeEventListener() {}, requestAnimationFrame() {}, devicePixelRatio: 1, innerWidth: 900, innerHeight: 450,
  document: { createElement: canvas, getElementById: canvas, addEventListener() {}, body: { insertAdjacentHTML() {} }, fonts: null, readyState: 'loading', hidden: false },
  Image: function () {}, OffscreenCanvas: undefined, AudioContext: undefined, webkitAudioContext: undefined, Path2D: function () { return proxy; },
  __addTrack: (n, d) => { defs.sbw[n] = JSON.parse(JSON.stringify(d)); return true; },
  __alias: (a, b) => { aliases[a] = b; return true; }
};
win.window = win; win.self = win;
vm.createContext(win);
let src = 'const BRADY_APP = "world";\n' + files.map(f => {
  let s = fs.readFileSync(path.join(dir, f), 'utf8');
  if (f !== '01_audio.js') s = s.replace(/Sound\.addTrack\(/g, '__addTrack(').replace(/Sound\.alias\(/g, '__alias(');
  return s;
}).join('\n');
vm.runInContext(src + '\n;this.API = { Tour, THEMES };', win, { filename: 'world-app.js' });
const A = win.API;
// which song ids the world app asks for: themes, bosses, countries, scenes
const refs = new Set(['title', 'tour_title', 'tour_map', 'map', 'clear', 'gameover', 'credits', 'story', 'ending', 'secret', 'boss']);
for (const k in A.THEMES) if (A.THEMES[k] && A.THEMES[k].music) refs.add(A.THEMES[k].music);
for (const cc in A.Tour.countries) { const C = A.Tour.countries[cc]; for (const k in C.music) if (C.music[k]) refs.add(C.music[k]); if (C.boss && C.boss.music) refs.add(C.boss.music); if (C.bonusMusic) refs.add(C.bonusMusic); }
// Burning Man's w16 / w17 songs: the music IIFE blocks of those kits, run against a recording Sound
for (const f of ['42_burns_w16_a_kit.js', '42_burns_w17_a_kit.js']) {
  const s = fs.readFileSync(path.join(dir, f), 'utf8');
  const a = s.indexOf('/* ---------------- music'), b = s.indexOf('\n})();', a);
  const block = s.slice(a, b + 6);
  const fake = { addTrack: (n, d) => { defs.bm[n] = JSON.parse(JSON.stringify(d)); return true; } };
  new Function('Sound', 'window', block)(fake, { Sound: fake });
}
fs.writeFileSync(out, JSON.stringify({ defs, aliases, refs: [...refs].sort() }, null, 1));
console.log('sbw', Object.keys(defs.sbw).length, 'bm', Object.keys(defs.bm).length, 'refs', refs.size, 'aliases', JSON.stringify(aliases));
