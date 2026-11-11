// prints authoring warnings and timing for songs in a defs file, through the given engine
const { renderMany } = require('./render.js');
const D = require(require('path').resolve(process.argv[3]));
(async () => {
  const PW = require('/Users/bradymott/brady-o/node_modules/playwright');
  const src = require('fs').readFileSync(process.argv[2], 'utf8');
  const b = await PW.chromium.launch(), p = await b.newPage(); await p.goto('about:blank');
  for (const n of process.argv.slice(4)) {
    const r = await p.evaluate(({ src, n, def }) => { const S = new Function('window', src + ';return Sound;')({}); if (def) S.addTrack(n, def); return S._info(n); }, { src, n, def: D.defs.sbw[n] });
    console.log(n, JSON.stringify(r));
  }
  await b.close();
})();
