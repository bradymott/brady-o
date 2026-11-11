// node sheet.js <out.png> <cols> <width-per-image> files...   a labelled contact sheet
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [out, cols, w, ...files] = process.argv.slice(2);
const html = `<body style="margin:0;background:#222;font:12px sans-serif;color:#eee"><div style="display:grid;grid-template-columns:repeat(${cols},${w}px);gap:6px;padding:6px">` +
  files.map(f => `<div><img style="width:${w}px;display:block" src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}"><div>${path.basename(f)}</div></div>`).join('') + '</div></body>';
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: cols * (+w + 6) + 6, height: 200 } })).newPage(); await p.setContent(html); await p.waitForTimeout(100); await p.screenshot({ path: out, fullPage: true }); await b.close(); })();
