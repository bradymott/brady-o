const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const S = process.argv[2];
const roots = { old: S + '/swt/old/art-cart', live: S + '/swt/live/art-cart', hot: S + '/dist-hot/site/art-cart' };
let root = roots.old;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.gz': 'application/gzip' };
const srv = http.createServer((q, r) => { if (/sw\.js/.test(q.url)) console.log('REQ', q.url, root.slice(-22));
  let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
  const f = path.join(root, u.replace(/^\/art-cart/, ''));
  fs.readFile(f, (e, d) => { if (e) { console.log('404', q.url); r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' }); r.end(d); });
});
const state = p => p.evaluate(async () => { const rg = await navigator.serviceWorker.getRegistration(); const G = window.BRADY_BURNS.CartGLB, h = G.rigs.heart && G.rigs.heart.hi; return { rigV: h ? (h.extras || {}).rigV || 1 : 'none', keys: await caches.keys(), a: rg && rg.active && rg.active.state, i: rg && rg.installing && rg.installing.state, w: rg && !!rg.waiting, fresh: (document.documentElement.innerHTML.match(/CartFresh/g) || []).length }; });
async function run(seq) {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), p = await ctx.newPage();
  let navs = 0; p.on('framenavigated', f => { if (f === p.mainFrame()) navs++; });
  for (const name of seq) {
    root = roots[name]; navs = 0;
    await p.goto('http://localhost:8377/art-cart/', { waitUntil: 'load' }).catch(e => console.log('goto interrupted'));
    await p.waitForTimeout(3000); const early = await state(p).catch(e => 'nav');
    await p.waitForTimeout(9000); const late = await state(p).catch(e => 'nav');
    console.log(seq.join('>'), '| visit', name, '| at 3s', JSON.stringify(early), '| at 12s', JSON.stringify(late), '| navigations', navs);
  }
  await b.close();
}
srv.listen(8377, async () => { await run(['old','old','hot','hot']); await run(['old','live','live','hot','hot']); await run(['hot','hot']); srv.close(); });
