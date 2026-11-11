// ranked table from a paired run: node rank.js pair.json [n]
const r = require(require('path').resolve(process.argv[2])), n = +(process.argv[3] || 25);
const rows = [];
for (const k of ['levels', 'bosses', 'maps']) for (const id in r[k]) { const a = r[k][id], b = r.pair && r.pair[k][id]; if (!a.cost || !b || !b.cost) continue; rows.push({ id: (k === 'levels' ? '' : k === 'bosses' ? 'boss ' : 'map ') + id, a, b }); }
const refF = process.argv[4] ? require(require('path').resolve(process.argv[4])) : r; const RR = []; for (const id of ['1-1', '1-2']) { const a = refF.levels[id], b = refF.pair && refF.pair.levels[id]; if (a && b) RR.push({ id, a, b }); } const ref = RR[0], ref2 = RR[1];
const refB = Math.max(ref.b.cost.mean, ref2 ? ref2.b.cost.mean : 0), refBp = Math.max(ref.b.cost.p95, ref2 ? ref2.b.cost.p95 : 0);
console.log(`reference (owner found smooth): before 1-1/1-2 mean ${refB.toFixed(2)} ms, p95 ${refBp.toFixed(1)} ms`);
const top = (p) => p && p.pxBy ? p.pxBy.slice(0, 4).map(([k, v]) => k + ' ' + (v / 1000).toFixed(1)).join(', ') : '';
rows.sort((x, y) => y.b.cost.mean - x.b.cost.mean);
const pick = rows.slice(0, n).concat(rows.filter(x => /^(boss )?(1-5|3-\d)$/.test(x.id) && rows.indexOf(x) >= n));
console.log('id          before mean/p95   after mean/p95   ratio   after/ref   top raster (MP per frame, after)');
for (const x of pick) console.log(`${x.id.padEnd(11)} ${x.b.cost.mean.toFixed(1).padStart(6)} / ${x.b.cost.p95.toFixed(0).padStart(3)}     ${x.a.cost.mean.toFixed(1).padStart(6)} / ${x.a.cost.p95.toFixed(0).padStart(3)}    ${(x.a.cost.mean / x.b.cost.mean).toFixed(2)}    ${(x.a.cost.mean / refB).toFixed(2)} ${(x.a.cost.p95 / refBp).toFixed(2)}   ${top(x.a.profile)}`);
const over = rows.filter(x => x.a.cost.mean > refB || x.a.cost.p95 > refBp);
console.log(`\n${rows.length} scenarios; over the reference (mean or p95): ${over.length ? over.map(x => x.id + ' ' + x.a.cost.mean.toFixed(1) + '/' + x.a.cost.p95.toFixed(0)).join(', ') : 'none'}`);
