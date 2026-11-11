// Mix balance of a v2 song: renders each layer alone (every part, the drums, the strums, the pad) and the
// full mix, and prints loudness (LUFS) and peak per layer. usage: node stems.js <engine> <defs.json> <song> [seconds]
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { renderMany } = require('./render.js');
const [engine, defsFile, song, secs] = process.argv.slice(2);
const D = require(path.resolve(defsFile)), def = D.defs.sbw[song];
const dir = path.join(__dirname, 'stems'); fs.mkdirSync(dir, { recursive: true });
const strip = (keep) => {
  const d = JSON.parse(JSON.stringify(def));
  if (keep !== 'all') {
    d.parts = (d.parts || []).map((p, i) => keep === 'part' + i ? p : Object.assign({}, p, { ln: p.ln.replace(/[A-G][#b]?-?\d/g, '.') }));
    if (keep !== 'drums') delete d.dr, delete d.fill;
    for (const k of ['ap', 'a2', 'pd']) if (keep !== k) delete d[k];
    if (keep !== 'ld') delete d.ld; if (keep !== 'l2') delete d.l2; if (keep !== 'bp') delete d.bp;
  }
  return d;
};
const lufs = f => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' }); const m = /I:\s+(-?[\d.]+) LUFS/.exec(r.stderr.slice(r.stderr.lastIndexOf('Summary'))); return m ? +m[1] : null; };
(async () => {
  const keys = ['all', ...(def.parts || []).map((p, i) => 'part' + i), ...(def.dr ? ['drums'] : []), ...['ap', 'a2', 'pd', 'ld', 'l2', 'bp'].filter(k => def[k])];
  const jobs = keys.map(k => ({ name: song, def: strip(k), seconds: +(secs || 40), out: path.join(dir, song + '_' + k + '.wav') }));
  const r = await renderMany(engine, jobs, {});
  keys.forEach((k, i) => {
    const label = k.startsWith('part') ? 'part ' + def.parts[+k.slice(4)].n + ' (' + def.parts[+k.slice(4)].i + ')' : k;
    console.log(label.padEnd(26), 'LUFS', String(lufs(jobs[i].out)).padEnd(6), 'peak', r[i].peak.toFixed(3));
  });
})();
