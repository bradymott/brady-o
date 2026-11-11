// Objective summary of rendered WAVs: loudness (EBU R128 via ffmpeg), true peak, clipping, stereo width,
// band energies and spectral centroid, a harshness index, and optional spectrogram PNGs.
// usage: node analyze.js [--png] file.wav ...   -> prints a table and writes <file>.json
const fs = require('fs'), cp = require('child_process'), path = require('path');
const args = process.argv.slice(2), png = args.includes('--png'), files = args.filter(a => !a.startsWith('--'));

function readWav(f) {
  const b = fs.readFileSync(f); let o = 12, fmt = null, data = null;
  while (o < b.length) { const id = b.toString('ascii', o, o + 4), n = b.readUInt32LE(o + 4); if (id === 'fmt ') fmt = { ch: b.readUInt16LE(o + 10), sr: b.readUInt32LE(o + 12) }; if (id === 'data') data = b.subarray(o + 8, o + 8 + n); o += 8 + n + (n & 1); }
  const N = data.length / 4, L = new Float32Array(N), R = new Float32Array(N);
  for (let i = 0; i < N; i++) { L[i] = data.readInt16LE(4 * i) / 32768; R[i] = data.readInt16LE(4 * i + 2) / 32768; }
  return { sr: fmt.sr, L, R };
}
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
}
const BANDS = [['sub', 20, 60], ['bass', 60, 250], ['lowmid', 250, 1000], ['mid', 1000, 2500], ['harsh', 2500, 5000], ['presence', 5000, 8000], ['air', 8000, 20000]];
function spectrum(w) {
  const N = 4096, hop = 4096, E = new Float64Array(N / 2), win = new Float32Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
  let frames = 0;
  for (let s = 0; s + N <= w.L.length; s += hop * 2) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = (w.L[s + i] + w.R[s + i]) * 0.5 * win[i];
    fft(re, im); for (let k = 0; k < N / 2; k++) E[k] += re[k] * re[k] + im[k] * im[k]; frames++;
  }
  const df = w.sr / N; let tot = 0, cen = 0; const bands = {};
  for (const [n] of BANDS) bands[n] = 0;
  for (let k = 1; k < N / 2; k++) { const f = k * df; tot += E[k]; cen += E[k] * f; for (const [n, a, b] of BANDS) if (f >= a && f < b) bands[n] += E[k]; }
  for (const n in bands) bands[n] = +(100 * bands[n] / tot).toFixed(1);
  return { bands, centroid: Math.round(cen / tot) };
}
function loud(f) {
  const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' });
  const s = r.stderr, sum = s.slice(s.lastIndexOf('Summary:'));
  const g = re => { const m = re.exec(sum); return m ? +m[1] : null; };
  return { lufs: g(/I:\s+(-?[\d.]+) LUFS/), lra: g(/LRA:\s+(-?[\d.]+) LU/), tp: g(/Peak:\s+(-?[\d.inf]+) dBFS/) };
}
const out = [];
for (const f of files) {
  const w = readWav(f); let peak = 0, clip = 0, sM = 0, sS = 0;
  for (let i = 0; i < w.L.length; i++) { const l = w.L[i], r = w.R[i]; const a = Math.max(Math.abs(l), Math.abs(r)); if (a > peak) peak = a; if (a >= 0.999) clip++; const m = (l + r) / 2, s = (l - r) / 2; sM += m * m; sS += s * s; }
  const sp = spectrum(w), ld = loud(f);
  const r = { file: path.basename(f), sec: +(w.L.length / w.sr).toFixed(1), lufs: ld.lufs, lra: ld.lra, truePeak: ld.tp, peak: +peak.toFixed(3), clipped: clip, width: +(Math.sqrt(sS / (sM + 1e-12))).toFixed(3), centroidHz: sp.centroid, bands: sp.bands };
  out.push(r);
  if (png) cp.spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', f, '-lavfi', 'showspectrumpic=s=1200x400:legend=1:fscale=log:color=intensity:scale=log', f.replace(/\.wav$/, '_spec.png')]);
}
console.log('file'.padEnd(28), 'sec  LUFS   LRA  TP(dB) clip width cent  sub bass lowm mid harsh pres air');
for (const r of out) console.log(r.file.padEnd(28), String(r.sec).padEnd(4), String(r.lufs).padEnd(6), String(r.lra).padEnd(4), String(r.truePeak).padEnd(6), String(r.clipped).padEnd(4), String(r.width).padEnd(5), String(r.centroidHz).padEnd(5), Object.values(r.bands).map(x => String(x).padStart(4)).join(' '));
if (files.length) fs.writeFileSync(path.join(path.dirname(files[0]), 'analysis.json'), JSON.stringify(out, null, 1));
