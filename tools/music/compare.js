// Renders songs through two engine versions in the same browser page and reports, per song, whether the
// output is bit-identical and the largest sample difference. (The engine's reverb is a ConvolverNode, whose
// multithreaded FFT differs run-to-run by ~1e-8, so "level-for-level" means max |diff| < 1e-6, i.e. -120 dBFS.)
// usage: node compare.js <engineA.js> <engineB.js> <defs.json> <seconds> [names...|--all-but name,name]
const fs = require('fs'), path = require('path');
const PW = require('/Users/bradymott/brady-o/node_modules/playwright');
const [eA, eB, defsFile, secs, ...rest] = process.argv.slice(2);
const D = JSON.parse(fs.readFileSync(defsFile, 'utf8'));
const srcA = fs.readFileSync(eA, 'utf8'), srcB = fs.readFileSync(eB, 'utf8');

const PAGE = async ({ srcA, srcB, name, def, seconds, sr }) => {
  if (!window.__noEnded) { window.__noEnded = 1; Object.defineProperty((window.AudioScheduledSourceNode || window.AudioBufferSourceNode).prototype, 'onended', { set() {}, get() { return null; }, configurable: true }); }
  async function render(src) {
    let a = 12345;
    const M = Object.create(Math); M.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const len = Math.ceil(seconds * sr), off = new OfflineAudioContext(2, len, sr);
    let tick = null;
    const S = new Function('window', 'setInterval', 'clearInterval', 'setTimeout', 'Math', src + '\n;return Sound;')({ AudioContext: function () { return off; } }, f => { tick = f; return 1; }, () => { tick = null; }, () => 0, M);
    if (def) S.addTrack(name, def);
    S.setMusicVolume(0.6); S.unlock(); S.music(name);
    const step = 1280 / sr;
    for (let t = step; t < seconds - step; t += step) off.suspend(t).then(() => { if (tick) tick(); off.resume(); });
    const b = await off.startRendering();
    return [b.getChannelData(0), b.getChannelData(1)];
  }
  const A = await render(srcA), B = await render(srcB);
  let mx = 0, same = true, rms = 0;
  for (let c = 0; c < 2; c++) for (let i = 0; i < A[c].length; i++) { const d = Math.abs(A[c][i] - B[c][i]); if (d !== 0) same = false; if (d > mx) mx = d; rms += A[c][i] * A[c][i]; }
  return { name, same, maxDiff: mx, rms: Math.sqrt(rms / (2 * A[0].length)) };
};

(async () => {
  const internal = [];
  {
    // engine-internal song names (from engine A)
    const m = srcA.match(/^ {4}([a-z_0-9]+): \{$/gm) || [];
    for (const x of m) internal.push(x.trim().replace(/: \{$/, ''));
  }
  let names;
  const ab = rest.indexOf('--all-but');
  if (ab >= 0 || !rest.length) {
    const skip = ab >= 0 ? rest[ab + 1].split(',') : [];
    names = [...new Set([...internal.filter(n => !['pluckb'].includes(n)), ...Object.keys(D.defs.bm), ...Object.keys(D.defs.sbw)])].filter(n => !skip.includes(n));
  } else names = rest;
  const browser = await PW.chromium.launch(), page = await browser.newPage();
  await page.goto('about:blank');
  const res = []; let bad = 0;
  for (const n of names) {
    const def = D.defs.sbw[n] || D.defs.bm[n] || null;
    const r = await page.evaluate(PAGE, { srcA, srcB, name: n, def, seconds: +secs, sr: 24000 });
    res.push(r);
    const ok = r.same || r.maxDiff < 1e-6;
    if (!ok) bad++;
    console.log((ok ? 'same ' : 'DIFF ') + n.padEnd(18) + (r.same ? 'bit-identical' : 'max|diff| ' + r.maxDiff.toExponential(2)) + '  rms ' + r.rms.toFixed(4));
  }
  console.log(`${res.length} songs, ${res.filter(r => r.same).length} bit-identical, ${res.filter(r => !r.same && r.maxDiff < 1e-6).length} within 1e-6, ${bad} different`);
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
