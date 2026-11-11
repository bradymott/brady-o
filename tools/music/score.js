// Prints a song as written: form, chords and each melodic part in note names, bar by bar, plus statistics
// (loop length, melodic range, steps vs leaps, note density, how many different bars the tune has).
// usage: node score.js <defs.json> <song> [--stats-only] [--parts tpt1,vln1]
const fs = require('fs');
const [defsFile, song, ...flags] = process.argv.slice(2);
const D = JSON.parse(fs.readFileSync(defsFile, 'utf8')), T = D.defs.sbw[song] || D.defs.bm[song];
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const num = s => { const r = /^([A-G])([#b]?)(-?\d)$/.exec(s); return r ? 12 * (+r[3] + 1) + PC[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0) : null; };
const spb = T.spb || 4, bpb = T.bpb || 4, spBar = spb * bpb, sd = 60 / (T.bpm * spb), bars = T.bars;
function parse(line) {
  const out = []; let pos = 0, bar = 0;
  for (const tk of line.replace(/\|/g, ' | ').trim().split(/\s+/)) {
    if (tk === '|') { bar++; pos = bar * spBar; continue; }
    const [n, d] = tk.split(':'), st = +(d || 2);
    if (n === '.') { pos += st; continue; }
    if (n === '_') { if (out.length) out[out.length - 1].d += st; pos += st; continue; }
    out.push({ p: pos, n, m: num(n), d: st }); pos += st;
  }
  return out;
}
const lines = [];
if (T.ld) lines.push({ n: 'lead (' + (T.li || 'sq2') + ')', notes: parse(T.ld) });
if (T.l2) lines.push({ n: 'line2 (' + (T.l2i || 'brass') + ')', notes: parse(T.l2) });
for (const p of T.parts || []) if (!/bass|gtrn/.test(p.n)) lines.push({ n: p.n + ' (' + p.i + ')', notes: parse(p.ln) });
const only = flags.includes('--parts') ? flags[flags.indexOf('--parts') + 1].split(',') : null;
const ch = T.ch.trim().split(/\s+/);
const loopFrom = T.v2 && T.lb ? T.lb : 0;
console.log(`${song}: ${T.bpm} bpm (${bpb}/${spb === 2 && bpb === 6 ? '8' : '4'}), ${bars} bars, ${(bars * spBar * sd).toFixed(1)} s; loops from bar ${loopFrom + 1} (${((bars - loopFrom) * spBar * sd).toFixed(1)} s per loop)`);
// statistics on the main melody (first line) and all melodic lines
const main = lines[0].notes.filter(x => x.m != null), ms = main.map(x => x.m);
const iv = []; for (let i = 1; i < ms.length; i++) iv.push(Math.abs(ms[i] - ms[i - 1]));
const barsOf = notes => { const b = new Map(); for (const x of notes) { const k = Math.floor(x.p / spBar); b.set(k, (b.get(k) || '') + (x.p % spBar) + x.n + x.d + ' '); } return b; };
const mb = barsOf(main), distinct = new Set([...mb.values()]).size;
const all = lines.reduce((a, l) => a + l.notes.length, 0);
const nm = m => ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][m % 12] + (Math.floor(m / 12) - 1);
const stats = {
  song, loopSec: +((bars - loopFrom) * spBar * sd).toFixed(1), mainLine: lines[0].n, mainNotes: main.length,
  range: nm(Math.min(...ms)) + '-' + nm(Math.max(...ms)), rangeSemis: Math.max(...ms) - Math.min(...ms),
  steps: +(100 * iv.filter(x => x <= 2).length / iv.length).toFixed(0), leaps: +(100 * iv.filter(x => x >= 5).length / iv.length).toFixed(0),
  barsWithTune: mb.size, distinctTuneBars: distinct, melodicLines: lines.length, notesPerSec: +(all / (bars * spBar * sd)).toFixed(2), chordsDistinct: new Set(ch.join(',').split(',')).size
};
console.log(JSON.stringify(stats));
if (flags.includes('--stats-only')) process.exit(0);
for (let b = 0; b < bars; b++) {
  const row = [String(b + 1).padStart(3) + (b === loopFrom ? '*' : ' ') + ch[b].padEnd(9)];
  for (const l of lines) {
    if (only && !only.some(o => l.n.startsWith(o))) continue;
    const ns = l.notes.filter(x => Math.floor(x.p / spBar) === b).map(x => x.n + (x.d !== spb ? '/' + x.d : ''));
    row.push((l.n.split(' ')[0] + ': ' + (ns.join(' ') || '-')).padEnd(38));
  }
  console.log(row.join(' '));
}
console.log('(* = loop point; NOTE/n = n sixteenths, plain notes are one beat)');
