const { renderMany } = require('./render.js');
const base = { v2: 1, bpm: 120, bars: 2, ch: 'C G', dr: ['k...............'], dv: 0.4 };
const P = i => Object.assign({}, base, { dr: undefined, parts: [{ n: 'p', ln: 'C4:4 E4:4 G4:4 C5:4 | G3:4 B3:4 D4:4 G4:4', i, v: 0.4 }] });
const V = { upright: P('upright'), uke: P('uke'), vihuela: P('vihuela'), gtrn: P('gtrn'), harp: P('harp'), celesta: P('celesta'), accord: P('accord'), tpt: P('tpt'), flute: P('flute'), vln: P('vln'),
  snare: Object.assign({}, base, { dr: ['....s.......s...'] }), hat: Object.assign({}, base, { dr: ['h.h.h.h.h.h.h.h.'] }), strum: Object.assign({}, base, { dr: undefined, a2: 'C.u.x.u.C.u.x.u.', a2i: 'uke', a2v: 0.5, a2o: 60 }) };
(async () => {
  const jobs = Object.keys(V).map(k => ({ name: 't_' + k, def: V[k], seconds: 12, out: 'dbg/t_' + k + '.wav' }));
  await renderMany('../music/src/01_audio.js', jobs, {});
  const fs = require('fs');
  for (const k in V) {
    const d = fs.readFileSync('dbg/t_' + k + '.wav').subarray(44), N = d.length / 4, sp = [];
    for (let i = 1; i < N - 1; i++) { const x = j => d.readInt16LE(4 * j) / 32768; const e = Math.abs(x(i) - (x(i - 1) + x(i + 1)) / 2); if (e > 0.05) sp.push((i / 48000).toFixed(4) + ':' + e.toFixed(2)); }
    console.log(k, sp.length, sp.slice(0, 10).join(' '));
  }
})();
