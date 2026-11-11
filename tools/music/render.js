// Offline renderer: drives the real Sound engine (src/01_audio.js) inside Chromium/WebKit through an
// OfflineAudioContext. The engine's own scheduler (its setInterval tick) is called every 1280 samples
// (~26.7 ms), exactly like the real-time 25 ms timer, with ctx.currentTime advancing as in the game.
// Math.random is seeded so renders are reproducible (needed for the byte-for-byte checks).
const fs = require('fs'), path = require('path');
const PW = require('/Users/bradymott/brady-o/node_modules/playwright');

const PAGE_FN = async (job) => {
  const { engineSrc, name, def, seconds, sr, seed, wantWav, sfxAt, musicVol, measureNodes } = job;
  let a = seed >>> 0;
  const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const M = Object.create(Math); M.random = rnd;
  // the engine disconnects finished voices from an 'ended' event; when that event lands depends on main-thread
  // timing, which changes the last ~1e-9 of a release tail. Keep finished voices connected so renders are exact.
  if (!window.__noEnded) { window.__noEnded = 1; try { Object.defineProperty((window.AudioScheduledSourceNode || window.AudioBufferSourceNode).prototype, 'onended', { set() {}, get() { return null; }, configurable: true }); } catch (e) { /* ignore */ } }
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const len = Math.ceil(seconds * sr);
  const off = new OAC(2, len, sr);
  let created = 0;
  if (measureNodes) for (const k of ['createOscillator', 'createGain', 'createBiquadFilter', 'createBufferSource', 'createStereoPanner', 'createWaveShaper', 'createDelay', 'createConvolver', 'createDynamicsCompressor']) {
    const f = off[k]; if (f) off[k] = function () { created++; return f.apply(off, arguments); };
  }
  let tickFn = null;
  const fakeWin = { AudioContext: function () { return off; } };
  const Sound = new Function('window', 'setInterval', 'clearInterval', 'setTimeout', 'Math', engineSrc + '\n;return Sound;')(
    fakeWin, fn => { tickFn = fn; return 1; }, () => { tickFn = null; }, () => 0, M);
  if (def) Sound.addTrack(name, def);
  const warn = Sound._validate()[name] || [];
  Sound.setMusicVolume(musicVol == null ? 0.6 : musicVol);
  Sound.setSfxVolume(0.8);
  Sound.unlock();
  Sound.music(name);
  const step = 1280 / sr;
  // sound effects on top (to judge how the music sits under them); the engine only plays them while 'running'
  const sfxQ = (sfxAt || []).slice().sort((x, y) => x[0] - y[0]);
  if (sfxQ.length) Object.defineProperty(off, 'state', { get: () => 'running' });
  const tickTimes = [];
  for (let t = step; t < seconds - step; t += step) {
    off.suspend(t).then(() => {
      if (tickFn) { const t0 = performance.now(); tickFn(); tickTimes.push(performance.now() - t0); }
      while (sfxQ.length && sfxQ[0][0] <= t) Sound.play(sfxQ.shift()[1]);
      off.resume();
    });
  }
  const t0 = performance.now();
  const buf = await off.startRendering();
  const wall = performance.now() - t0;
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  let peak = 0, ss = 0, sL = 0, sR = 0, sLR = 0;
  for (let i = 0; i < len; i++) { const l = L[i], r = R[i]; const al = l < 0 ? -l : l, ar = r < 0 ? -r : r; if (al > peak) peak = al; if (ar > peak) peak = ar; ss += l * l + r * r; sL += l * l; sR += r * r; sLR += l * r; }
  // 2x32-bit hashes over the raw float bits of both channels (crypto.subtle is unavailable on about:blank)
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (const ch of [L, R]) { const u = new Uint32Array(ch.buffer, ch.byteOffset, len); for (let i = 0; i < len; i++) { const x = u[i]; h1 = Math.imul(h1 ^ x, 0x01000193); h2 = Math.imul(h2 ^ (x >>> 7 | x << 25), 0x5bd1e995) ^ (h2 >>> 13); } }
  const hash = (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  let wav = null;
  if (wantWav) {
    const pcm = new Int16Array(len * 2);
    for (let i = 0; i < len; i++) { pcm[2 * i] = Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))); pcm[2 * i + 1] = Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))); }
    const u8 = new Uint8Array(pcm.buffer); let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    wav = btoa(s);
  }
  const tt = tickTimes.slice().sort((x, y) => x - y);
  return {
    name, hash, peak, rms: Math.sqrt(ss / (2 * len)), corrLR: sLR / Math.sqrt(sL * sR + 1e-20), warn, wav, sr, len, wallMs: wall, nodes: created,
    tick: { n: tt.length, total: tt.reduce((x, y) => x + y, 0), p50: tt[tt.length >> 1] || 0, p99: tt[Math.floor(tt.length * 0.99)] || 0, max: tt[tt.length - 1] || 0 }
  };
};

function writeWav(file, b64, sr) {
  const data = Buffer.from(b64, 'base64'), h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, data]));
}

// jobs: [{ name, def?, seconds, out? (wav path) }]
async function renderMany(engineFile, jobs, opts) {
  opts = opts || {};
  const engineSrc = fs.readFileSync(engineFile, 'utf8');
  const browser = await PW[opts.browser || 'chromium'].launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('about:blank');
  const res = [];
  for (const j of jobs) {
    const r = await page.evaluate(PAGE_FN, { engineSrc, name: j.name, def: j.def || null, seconds: j.seconds, sr: opts.sr || 48000, seed: j.seed || 12345, wantWav: !!j.out, sfxAt: j.sfxAt || null, musicVol: j.musicVol, measureNodes: !!opts.measureNodes });
    if (j.out) { writeWav(j.out, r.wav, r.sr); }
    delete r.wav;
    r.errors = errors.splice(0);
    res.push(r);
    if (opts.log) console.log(j.name, r.hash.slice(0, 12), 'peak', r.peak.toFixed(3), 'rms', r.rms.toFixed(4), 'wall', r.wallMs.toFixed(0) + 'ms', r.warn.length ? 'WARN ' + r.warn.join(';') : '');
  }
  await browser.close();
  return res;
}
module.exports = { renderMany, writeWav };
