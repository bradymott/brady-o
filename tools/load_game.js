// Loads the Super Brady-O World app's modules into a Node VM (no browser needed), so the
// level builder and validator run exactly as in the game. Browser APIs are stubbed.
const fs = require('fs'), path = require('path'), vm = require('vm');
// the world app's modules (see the 'world' entry in tools/build.js): the 2D engine and the tour live in
// 00–29; the other apps' modules (30+) and the boot file (99) are left out
const WORLD_DROP = ['08c_designs.js', '20b_world_themes.js', '24_sloth.js', '26_worlddata.js', '27_brcmap.js', '27_brcmap_land.js'];
const isBurns = f => parseInt(f, 10) >= 30, isKart = f => false;
module.exports = function loadGame(opts) {
  opts = opts || {};
  const dir = path.join(__dirname, '..', 'src');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort()
    .filter(f => !isBurns(f) && !isKart(f) && !WORLD_DROP.includes(f) && f !== '99_main.js')
    .filter(f => !(opts.noSeeds && f === '08b_seeds.js'));
  // a canvas 2D context that accepts every call and returns harmless values
  const noop = () => proxy;
  const proxy = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : (k === 'width' || k === 'height' ? 64 : k === 'length' ? 0 : noop), set: () => true, apply: () => proxy });
  const canvas = () => ({ width: 64, height: 64, style: {}, getContext: () => proxy, addEventListener() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 900, height: 450 }), toDataURL: () => '' });
  const store = {};
  const win = {
    console, Date, Math, JSON, performance: { now: () => Date.now() }, setTimeout, clearTimeout, setInterval, clearInterval,
    navigator: { userAgent: 'node', getGamepads: () => [] },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    addEventListener() {}, removeEventListener() {}, requestAnimationFrame() {}, devicePixelRatio: 1, innerWidth: 900, innerHeight: 450,
    document: { createElement: canvas, getElementById: canvas, addEventListener() {}, body: { insertAdjacentHTML() {} }, fonts: null, readyState: 'loading', hidden: false },
    Image: function () {}, OffscreenCanvas: undefined, AudioContext: undefined, webkitAudioContext: undefined, Path2D: function () { return proxy; }
  };
  win.window = win; win.self = win;
  vm.createContext(win);
  const src = 'const BRADY_APP = "world";\n' + files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  vm.runInContext(src + '\n;this.API = { WORLDS, WORLD_ORDER, getLevel, generateLevel, Validator, T, TS, SURF, THEMES, Tour, TourProgress, Save, LevelCache };', win, { filename: 'world-app.js' });
  const A = win.API;
  A.Save.data = A.Save.defaults();
  // every playable world, in route order
  A.ALL_WORLDS = A.Tour.worldList();
  return A;
};
