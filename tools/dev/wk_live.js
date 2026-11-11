const { webkit, devices } = require('playwright');
(async () => {
  const b = await webkit.launch();
  const ctx = await b.newContext({ ...devices['iPhone 14'] });
  const p = await ctx.newPage();
  p.on('console', m => console.log('[' + m.type() + ']', m.text().slice(0, 300)));
  p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 300)));
  p.on('requestfailed', r => console.log('[reqfail]', r.url(), r.failure() && r.failure().errorText));
  await p.goto(process.argv[2], { waitUntil: 'load' });
  await p.waitForTimeout(12000);
  const info = await p.evaluate(() => { const G = window.BRADY_BURNS && window.BRADY_BURNS.CartGLB; return { ready: G && G.ready, rigs: G && Object.keys(G.rigs).map(k => k + ':' + Object.keys(G.rigs[k]).join('+')), ds: typeof DecompressionStream, gl2: !!document.createElement('canvas').getContext('webgl2') }; });
  console.log(JSON.stringify(info));
  await p.screenshot({ path: process.argv[3] });
  await b.close();
})();
