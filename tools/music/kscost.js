const PW = require('/Users/bradymott/brady-o/node_modules/playwright');
(async () => { for (const br of ['chromium', 'webkit']) {
  const b = await PW[br].launch(), p = await b.newPage(); await p.goto('about:blank');
  const r = await p.evaluate(() => {
    const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 100, 48000), sr = 32000;
    const t = [];
    for (const [dur, f0] of [[0.9, 300], [2.4, 400], [1.4, 80]]) { const t0 = performance.now();
      for (let k = 0; k < 10; k++) { const N = Math.round(sr / f0), len = Math.floor(sr * dur), b = ctx.createBuffer(1, len, sr), y = b.getChannelData(0);
        for (let i = 0; i < N; i++) y[i] = Math.random() - 0.5; for (let i = N + 1; i < len; i++) y[i] = 0.999 * (0.5 * y[i - N] + 0.5 * y[i - N - 1]);
        let x1 = 0, y1 = 0, pk = 0; for (let i = 0; i < len; i++) { const x = y[i]; y1 = x - x1 + 0.995 * y1; x1 = x; y[i] = y1; if (Math.abs(y1) > pk) pk = Math.abs(y1); } for (let i = 0; i < len; i++) y[i] *= 0.7 / pk; }
      t.push(((performance.now() - t0) / 10).toFixed(2) + 'ms@' + dur + 's'); }
    return t; });
  console.log(br, r.join(' ')); await b.close(); } })();
