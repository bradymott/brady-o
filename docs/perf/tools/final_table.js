// the report table: worst 20 by before cost (WebKit raster-flushed), plus Mexico 1-5 and all of Brazil
// node final_table.js final_wk.json final_cpu4.json [t2.json t5.json]
const [wkF, cpuF, t2F, t5F] = process.argv.slice(2).map(f => f && require(require('path').resolve(f)));
const rows = (r) => { const o = {}; if (!r) return o; for (const k of ['levels', 'bosses', 'maps']) for (const id in r[k]) { const a = r[k][id], b = r.pair && r.pair[k][id]; if (a && a.cost && b && b.cost) o[(k === 'levels' ? '' : k === 'bosses' ? 'boss ' : 'map ') + id] = { a, b }; } return o; };
const wk = rows(wkF), cpu = rows(cpuF), t2 = rows(t2F), t5 = rows(t5F);
// the reference: the BEFORE build's 1-1 measured right after each scenario (--ref 1-1), else the run's own 1-1/1-2
const ref = (R) => { const x = R['1-1'], y = R['1-2']; return x && y ? { mean: Math.max(x.b.cost.mean, y.b.cost.mean), p95: Math.max(x.b.cost.p95, y.b.cost.p95) } : x ? { mean: x.b.cost.mean, p95: x.b.cost.p95 } : null; };
const rowRef = (w, R) => w.b.ref && w.b.ref.cost ? w.b.ref.cost : ref(R);
const rw = ref(wk), rc = ref(cpu);
console.log(`Reference (Brady found these smooth): before 1-1 / 1-2, WebKit raster: mean ${rw.mean.toFixed(1)} ms, p95 ${rw.p95.toFixed(0)} ms` + (rc ? `; Chromium GPU at 4x CPU: mean ${rc.mean.toFixed(1)}, p95 ${rc.p95.toFixed(1)}` : ''));
const ids = Object.keys(wk).sort((x, y) => wk[y].b.cost.mean - wk[x].b.cost.mean);
const pick = ids.slice(0, 20).concat(ids.filter(id => /^(boss )?(1-5|3-\d)$/.test(id) && ids.indexOf(id) >= 20));
const f = (v, d = 1) => v == null ? '  -  ' : v.toFixed(d);
console.log('| scenario | WebKit before mean / p95 ms | after (HIGH) mean / p95 ms | after / before | HIGH vs reference (mean / p95) | MEDIUM vs reference | LOW vs reference | Chromium 4x CPU p95 before -> after (vs reference) |');
console.log('|---|---|---|---|---|---|---|---|');
for (const id of pick) {
  const w = wk[id], c = cpu[id], m = t2[id], l = t5[id];
  const rr = rowRef(w, wk), mr = m && rowRef(m, t2), lr = l && rowRef(l, t5), cr = c && rowRef(c, cpu);
  console.log(`| ${id} | ${f(w.b.cost.mean)} / ${f(w.b.cost.p95, 0)} | ${f(w.a.cost.mean)} / ${f(w.a.cost.p95, 0)} | ${(w.a.cost.mean / w.b.cost.mean).toFixed(2)} | ${(w.a.cost.mean / rr.mean).toFixed(2)} / ${(w.a.cost.p95 / rr.p95).toFixed(2)} | ${m ? (m.a.cost.mean / mr.mean).toFixed(2) + ' / ' + (m.a.cost.p95 / mr.p95).toFixed(2) : '-'} | ${l ? (l.a.cost.mean / lr.mean).toFixed(2) + ' / ' + (l.a.cost.p95 / lr.p95).toFixed(2) : '-'} | ${c ? f(c.b.cost.p95) + ' -> ' + f(c.a.cost.p95) + ' (' + (c.a.cost.p95 / cr.p95).toFixed(2) + ')' : '-'} |`);
}
for (const [nm, T] of [['WebKit HIGH', wk], ['WebKit MEDIUM', t2], ['WebKit LOW', t5], ['Chromium 4x CPU (HIGH)', cpu]]) {
  const keys = Object.keys(T); if (!keys.length) continue;
  const ot = keys.filter(id => { const rr = rowRef(T[id], T); return T[id].a.cost.p95 > rr.p95 * 1.0 || T[id].a.cost.mean > rr.mean; });
  console.log(`${nm}: ${keys.length - ot.length} of ${keys.length} scenarios at or under the reference (mean and p95 of before 1-1 measured alongside); over: ${ot.length ? ot.map(id => { const rr = rowRef(T[id], T); return id + ' ' + (T[id].a.cost.mean / rr.mean).toFixed(2) + '/' + (T[id].a.cost.p95 / rr.p95).toFixed(2); }).join(', ') : 'none'}`);
}
// all levels compact
const all = ids.map(id => `${id} ${f(wk[id].b.cost.mean)}->${f(wk[id].a.cost.mean)}`);
console.log('\nall scenarios (WebKit mean before->after): ' + all.join('; '));
