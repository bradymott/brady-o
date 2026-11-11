const fs = require('fs');
function readWav(f) { const b = fs.readFileSync(f), d = b.subarray(44), N = d.length / 4, L = new Float32Array(N), R = new Float32Array(N); for (let i = 0; i < N; i++) { L[i] = d.readInt16LE(4 * i) / 32768; R[i] = d.readInt16LE(4 * i + 2) / 32768; } return { L, R }; }
const [f, firstT, seamT] = process.argv.slice(2), w = readWav(f), sr = 48000;
for (const [lab, t] of [['first pass', +firstT], ['seam', +seamT]]) {
  const c = Math.round(t * sr); let mx = 0, at = 0;
  for (let i = c - 960; i < c + 960; i++) { const d = Math.abs(w.L[i] - w.L[i - 1]); if (d > mx) { mx = d; at = i; } }
  const seg = Array.from(w.L.slice(at - 3, at + 4)).map(x => x.toFixed(3)).join(' ');
  console.log(lab, 't=' + t, 'maxjump', mx.toFixed(3), 'at', ((at - c) / sr * 1000).toFixed(1) + 'ms', seg);
}
