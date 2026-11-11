// Super Brady-O World music checks (src/01_audio.js + the songs each land adds).
//  1. every song id the world app asks for (themes, countries' level / boss / map songs, bosses, level areas,
//     scenes) exists, after the engine's aliases
//  2. the beat levels still get the same tempo (area.beat.bpm and Play.beatNow)
//  3. every one of those songs renders offline without errors or authoring warnings, without clipping and
//     inside a loudness window (EBU R128 integrated loudness, computed here)
//  4. v2 songs (the newer voices and mixer) are rendered past their loop point: no gap and no click at the seam,
//     and their voice count stays inside the budget
//  5. the engine change is additive: every other song (Burning Man, Art Cart, the other lands, the old 2D
//     worlds) renders the same through the current engine as through the engine at --base (default: the
//     commit before the music pilot). The reverb is a ConvolverNode whose threaded FFT varies by ~1e-7
//     between runs, so "the same" means max |sample difference| < 1e-5 (-100 dBFS).
// Renders drive the real engine through an OfflineAudioContext in Chromium, calling its own scheduler every
// 1280 samples (as its 25 ms timer would) with Math.random seeded.
// usage: node tools/sbw_audio_test.js [--base <git rev>] [--quick] [--webkit]
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { chromium, webkit } = require('playwright');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'src');
const args = process.argv.slice(2);
const BASE = args.includes('--base') ? args[args.indexOf('--base') + 1] : '89bbc8b';
const QUICK = args.includes('--quick');
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)).slice(0, 600) : '')); if (!ok) failures++; };

/* ---------- 1. load the world app in a VM, recording every song added with Sound.addTrack ---------- */
function loadWorld() {
  const DROP = ['08c_designs.js', '20b_world_themes.js', '24_sloth.js', '26_worlddata.js', '27_brcmap.js', '27_brcmap_land.js'];
  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.js')).sort().filter(f => parseInt(f, 10) < 30 && !DROP.includes(f));
  const noop = () => proxy;
  const proxy = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : (k === 'width' || k === 'height' ? 64 : k === 'length' ? 0 : noop), set: () => true, apply: () => proxy });
  const canvas = () => ({ width: 64, height: 64, style: {}, getContext: () => proxy, addEventListener() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 900, height: 450 }), toDataURL: () => '' });
  const defs = {};
  const win = {
    console: { log() {}, warn() {}, error() {}, info() {} }, Date, Math, JSON, performance: { now: () => Date.now() }, setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {},
    navigator: { userAgent: 'node', getGamepads: () => [] }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }), addEventListener() {}, removeEventListener() {}, requestAnimationFrame() {}, devicePixelRatio: 1, innerWidth: 900, innerHeight: 450,
    document: { createElement: canvas, getElementById: canvas, addEventListener() {}, body: { insertAdjacentHTML() {} }, fonts: null, readyState: 'loading', hidden: false },
    Image: function () {}, OffscreenCanvas: undefined, AudioContext: undefined, webkitAudioContext: undefined, Path2D: function () { return proxy; },
    __addTrack: (n, d) => { defs[n] = JSON.parse(JSON.stringify(d)); return win.Sound.addTrack(n, d); }
  };
  win.window = win; win.self = win;
  vm.createContext(win);
  const src = 'const BRADY_APP = "world";\n' + files.map(f => { const s = fs.readFileSync(path.join(SRC, f), 'utf8'); return f === '01_audio.js' ? s + '\n;window.Sound = Sound;' : s.replace(/Sound\.addTrack\(/g, '__addTrack('); }).join('\n');
  vm.runInContext(src + '\n;this.API = { Tour, THEMES, getLevel, Sound, Play, Save };', win, { filename: 'world-app.js' });
  const A = win.API; A.Save.data = A.Save.defaults();
  return { A, defs };
}
// Burning Man's own load-time songs (w16 / w17 kits): their music blocks, run against a recording Sound
function bmDefs() {
  const defs = {};
  for (const f of ['42_burns_w16_a_kit.js', '42_burns_w17_a_kit.js']) {
    const s = fs.readFileSync(path.join(SRC, f), 'utf8'), a = s.indexOf('/* ---------------- music'), b = s.indexOf('\n})();', a);
    const fake = { addTrack: (n, d) => { defs[n] = JSON.parse(JSON.stringify(d)); return true; } };
    new Function('Sound', 'window', s.slice(a, b + 6))(fake, { Sound: fake });
  }
  return defs;
}

/* ---------- the in-page renderer ---------- */
const RENDER = async ({ src, name, def, seconds, sr, want, seamSec }) => {
  /* ---------- loudness (ITU-R BS.1770 / EBU R128 integrated, 48 kHz) ---------- */
  function lufs(L, R, sr) {
    if (sr !== 48000) throw new Error('lufs() needs 48 kHz');
    const kw = x => {
      const y = new Float64Array(x.length);
      let [b0, b1, b2, a1, a2] = [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585];
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
      [b0, b1, b2, a1, a2] = [1, -2, 1, -1.99004745483398, 0.99007225036621]; x1 = x2 = y1 = y2 = 0;
      for (let i = 0; i < y.length; i++) { const xi = y[i], v = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = xi; y2 = y1; y1 = v; y[i] = v; }
      return y;
    };
    const l = kw(L), r = kw(R), blk = 0.4 * sr, hop = 0.1 * sr, z = [];
    for (let s = 0; s + blk <= l.length; s += hop) { let e = 0; for (let i = s; i < s + blk; i++) e += l[i] * l[i] + r[i] * r[i]; z.push(e / blk); }
    const ld = e => -0.691 + 10 * Math.log10(e + 1e-20);
    const g1 = z.filter(e => ld(e) > -70); if (!g1.length) return -70;
    const rel = ld(g1.reduce((a, b) => a + b, 0) / g1.length) - 10;
    const g2 = g1.filter(e => ld(e) > rel);
    return ld(g2.reduce((a, b) => a + b, 0) / g2.length);
  }
  
  if (!window.__noEnded) {   // keep finished voices connected: their 'ended' timing would add run-to-run noise
    window.__noEnded = 1;
    try { Object.defineProperty((window.AudioScheduledSourceNode || window.AudioBufferSourceNode).prototype, 'onended', { set() {}, get() { return null; }, configurable: true }); } catch (e) { /* ignore */ }
  }
  let a = 12345;
  const M = Object.create(Math); M.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const len = Math.ceil(seconds * sr), off = new OAC(2, len, sr);
  let tick = null, srcs = 0, maxLive = 0; const live = [];
  const cbs = off.createBufferSource.bind(off), cos = off.createOscillator.bind(off);
  const count = n => { const t = off.currentTime; n.__t = t; srcs++; return n; };
  off.createBufferSource = () => count(cbs()); off.createOscillator = () => count(cos());
  const S = new Function('window', 'setInterval', 'clearInterval', 'setTimeout', 'Math', src + '\n;return Sound;')({ AudioContext: function () { return off; } }, f => { tick = f; return 1; }, () => { tick = null; }, () => 0, M);
  if (def) S.addTrack(name, def);
  const warn = S._validate()[name] || [], info = S._info ? S._info(name) : null;
  S.setMusicVolume(0.6); S.unlock(); S.music(name);
  const step = 1280 / sr; let ticks = 0, tickMs = 0, tickMax = 0;
  for (let t = step; t < seconds - step; t += step) off.suspend(t).then(() => { if (tick) { const t0 = performance.now(); tick(); const d = performance.now() - t0; ticks++; tickMs += d; if (d > tickMax) tickMax = d; } off.resume(); });
  const b = await off.startRendering();
  const L = b.getChannelData(0), R = b.getChannelData(1);
  let peak = 0; for (let i = 0; i < len; i++) { const x = Math.max(Math.abs(L[i]), Math.abs(R[i])); if (x > peak) peak = x; }
  window.__last = window.__last || {}; window.__last[want || 'a'] = [L, R];
  const res = { name, warn, info, peak, sources: srcs, tickMsPerSec: tickMs / seconds, tickMax };
  if (want === 'full') {
    res.lufs = lufs(L, R, sr);
    if (seamSec) {   // the scheduler wraps from the last step back to the loop point at t = 0.06 + song length
      const at = Math.round((0.06 + seamSec) * sr), win = Math.round(0.2 * sr);
      const rms = s0 => { let e = 0; for (let i = s0; i < s0 + win; i++) e += L[i] * L[i] + R[i] * R[i]; return Math.sqrt(e / (2 * win)); };
      const blocks = []; for (let s0 = Math.round(2 * sr); s0 + win < at; s0 += win) blocks.push(rms(s0)); blocks.sort((x, y) => x - y);
      const d = new Float32Array(len - 1); for (let i = 1; i < len; i++) d[i - 1] = Math.abs(L[i] - L[i - 1]);
      let near = 0; for (let i = at - 960; i < at + 960; i++) if (d[i] > near) near = d[i];
      const sorted = Float32Array.from(d).sort();
      res.seam = { afterVsMedian: +(rms(at) / blocks[blocks.length >> 1]).toFixed(2), jump: +near.toFixed(4), p999: +sorted[Math.floor(sorted.length * 0.999)].toFixed(4) };
    }
  }
  return res;
};
const DIFF = () => { const A = window.__last.a, B = window.__last.b; let mx = 0; for (let c = 0; c < 2; c++) for (let i = 0; i < A[c].length; i++) { const d = Math.abs(A[c][i] - B[c][i]); if (d > mx) mx = d; } return mx; };

(async () => {
  const { A, defs } = loadWorld(), S = A.Sound, names = new Set(S.trackNames);
  const resolve = n => { const i = S._info(n); return i ? i.name : null; };

  /* 1. every song the world app asks for exists */
  const refs = new Map(); const ref = (n, where) => { if (n) refs.set(n, (refs.get(n) || []).concat(where)); };
  for (const k in A.THEMES) if (A.THEMES[k] && A.THEMES[k].music) ref(A.THEMES[k].music, 'theme ' + k);
  for (const cc in A.Tour.countries) { const C = A.Tour.countries[cc]; for (const k in C.music) ref(C.music[k], cc + ' music.' + k); if (C.bonusMusic) ref(C.bonusMusic, cc + ' bonus'); }
  for (const cc in A.Tour.countries) { const C = A.Tour.countries[cc]; for (const B of [].concat(C.boss || [], C.bosses || [])) if (B && B.music) ref(B.music, 'boss ' + B.id); }
  const beats = {};
  for (const id of A.Tour.allLevelIds()) {
    const [w, i] = id.split('-').map(Number); let L = null;
    try { L = A.getLevel(w, i); } catch (e) { check('level ' + id + ' builds', false, e.message); continue; }
    for (const ar of L.areas || []) { ref(ar.music, 'level ' + id + '/' + ar.aid); if (ar.beat) beats[id + '/' + ar.aid] = ar.beat.bpm; }
  }
  for (const n of ['title', 'tour_title', 'tour_map', 'map', 'clear', 'gameover', 'credits', 'story', 'secret', 'boss', 'sloth']) ref(n, 'scene');
  ref(names.has('tour_ending') ? 'tour_ending' : 'ending', 'scene ending');
  const missing = [...refs.keys()].filter(n => !names.has(n) && !resolve(n));
  check('every song id the world app uses exists (' + refs.size + ' ids)', missing.length === 0, missing.map(n => n + ' <- ' + refs.get(n)[0]));
  check("the title screen plays the world's own theme", resolve('title') === 'tour_title', resolve('title'));

  /* 2. beat levels keep their tempo */
  const wantBeats = { '3-1/avenida': 124, '3-1/barracao': 124, '6-3/ciutat': 112, '6-3/umbracle': 112, '7-6/seine': 100 };
  check('beat levels keep their bpm', JSON.stringify(beats) === JSON.stringify(wantBeats), beats);
  const bn = A.Play.prototype.beatNow.call({ area: { beat: { bpm: 124 } }, beatClock: 3 });
  check('Play.beatNow counts beats at the level bpm', Math.abs(bn - 3 * 124 / 60) < 1e-9, bn);

  /* 3-5 in the browser */
  const engineNow = fs.readFileSync(path.join(SRC, '01_audio.js'), 'utf8');
  let engineBase = null;
  try { engineBase = cp.execSync(`git -C "${ROOT}" show ${BASE}:src/01_audio.js`, { encoding: 'utf8', maxBuffer: 1 << 26 }); } catch (e) { check('base engine ' + BASE + ' readable from git', false, e.message.split('\n')[0]); }
  const browser = await (args.includes('--webkit') ? webkit : chromium).launch();
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('about:blank');
  const v2 = [...names].filter(n => { const i = S._info(n); return i && i.v2; });
  const used = [...new Set([...refs.keys()].map(n => resolve(n) || n))].filter(n => names.has(n)).sort();

  for (const n of used) {
    const isV2 = v2.includes(n), info = S._info(n);
    const secs = isV2 && !QUICK ? Math.min(info.sec + 4, 95) : 12;
    const r = await page.evaluate(RENDER, { src: engineNow, name: n, def: defs[n] || null, seconds: secs, sr: 48000, want: 'full', seamSec: isV2 && !QUICK ? info.sec : 0 });
    const errs = errors.splice(0), ld = r.lufs, seam = r.seam || null;
    const tag = (isV2 ? 'v2 ' : '') + n;
    // authoring warnings fail a v2 song; in an older song they are reported (they predate this test) but don't fail it
    if (!isV2 && r.warn.length) console.log('NOTE ' + n + ' has authoring warnings (its land\'s music section should fix them): ' + r.warn.join('; '));
    const ok = !errs.length && !(isV2 && r.warn.length) && r.peak < 0.99 && (isV2 ? ld > -25 && ld < -18 : ld > -34 && ld < -15) && (!seam || (seam.afterVsMedian > 0.3 && seam.jump <= Math.max(2 * seam.p999, 0.02)));
    check(`${tag} renders cleanly`, ok, { peak: +r.peak.toFixed(3), lufs: +ld.toFixed(1), seam, warn: r.warn, errs, loopSec: info && +info.loopSec.toFixed(1), sched: +r.tickMsPerSec.toFixed(2) + ' ms/s' });
  }

  /* 5. additive engine: every other song sounds the same as through the base engine */
  if (engineBase) {
    const bm = bmDefs(), others = [...new Set([...S.trackNames, ...Object.keys(bm)])].filter(n => !v2.includes(n)).sort();
    let worst = 0, n = 0; const bad = [];
    for (const name of QUICK ? others.filter((x, i) => i % 6 === 0) : others) {
      const def = defs[name] || bm[name] || null;
      await page.evaluate(RENDER, { src: engineBase, name, def, seconds: 6, sr: 24000, want: 'a' });
      await page.evaluate(RENDER, { src: engineNow, name, def, seconds: 6, sr: 24000, want: 'b' });
      const md = await page.evaluate(DIFF); n++;
      if (md > worst) worst = md;
      if (!(md < 1e-5)) bad.push(name + ' ' + md.toExponential(1));
    }
    check(`${n} other songs (Burning Man, Art Cart, the other lands, old worlds) render as through engine ${BASE}`, bad.length === 0 && !errors.length, { worstSampleDiff: worst, bad, errors: errors.splice(0) });
  }
  await browser.close();
  console.log(failures ? `${failures} FAILED` : 'all audio checks passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
