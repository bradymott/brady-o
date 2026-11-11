const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const b = fs.readFileSync(f), d = b.subarray(44), N = d.length / 4; const out = [];
  for (let c = 0; c < 2; c++) { const x = i => d.readInt16LE(4 * i + 2 * c) / 32768;
    for (let i = 1; i < N - 1; i++) { const e = Math.abs(x(i) - (x(i - 1) + x(i + 1)) / 2); if (e > 0.1) out.push((c ? 'R' : 'L') + '@' + (i / 48000).toFixed(4) + ':' + e.toFixed(2)); } }
  console.log(f, out.length, out.slice(0, 12).join(' '));
}
