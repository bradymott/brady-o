// usage: node render_set.js <engine.js> <defs.json> <outDir> <seconds> name[=label] ...
const { renderMany } = require('./render.js');
const [engine, defsFile, outDir, secs, ...names] = process.argv.slice(2);
const D = require(require('path').resolve(defsFile));
(async () => {
  const jobs = names.map(n => { const [name, label] = n.split('='); return { name, def: D.defs.sbw[name] || D.defs.bm[name] || null, seconds: +secs, out: outDir + '/' + (label || name) + '.wav' }; });
  const r = await renderMany(engine, jobs, { log: true, measureNodes: true });
  require('fs').writeFileSync(outDir + '/render_stats.json', JSON.stringify(r, null, 1));
})();
