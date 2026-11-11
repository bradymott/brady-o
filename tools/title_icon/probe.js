// node probe.js <out.png> <js expression drawing into (x, N) canvas ctx>   renders in the built world app page
const { chromium } = require('playwright');
const path = require('path');
const [out, N, code] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 600, height: 600 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(process.env.BRADY_DIST, process.env.PAGE || 'site/super-brady-o-world/index.html')); await p.waitForTimeout(1500);
  const b64 = await p.evaluate(([N, code]) => { const c = document.createElement('canvas'); c.width = c.height = +N; const x = c.getContext('2d'); (new Function('x', 'N', code))(x, +N); return c.toDataURL().split(',')[1]; }, [N, code]);
  require('fs').writeFileSync(out, Buffer.from(b64, 'base64'));
  if (errs.length) console.log(errs);
  await b.close();
})();
