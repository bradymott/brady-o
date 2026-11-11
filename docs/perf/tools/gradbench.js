const pw = require('playwright');
(async () => {
  const b = await pw.webkit.launch(); const page = await (await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 })).newPage();
  await page.setContent('<canvas id=c width=1688 height=780></canvas>');
  console.log(JSON.stringify(await page.evaluate(() => {
    const C = document.getElementById('c'), c = C.getContext('2d', { alpha: false }), W = 1688, H = 780;
    const run = (fn, n = 100) => { c.getImageData(0, 0, 1, 1); const t0 = performance.now(); for (let i = 0; i < n; i++) { fn(i); c.getImageData(0, 0, 1, 1); } return +((performance.now() - t0) / n).toFixed(3); };
    const r = {};
    r.solidFull = run(() => { c.fillStyle = 'rgba(20,30,40,0.16)'; c.fillRect(0, 0, W, H); });
    r.opaqueFull = run(() => { c.fillStyle = '#123456'; c.fillRect(0, 0, W, H); });
    r.gradFog = run(() => { const g = c.createLinearGradient(0, H * 0.35, 0, H); g.addColorStop(0, 'rgba(200,180,160,0)'); g.addColorStop(1, 'rgba(200,180,160,0.1)'); c.fillStyle = g; c.fillRect(0, H * 0.35, W, H * 0.65); });
    const fogC = document.createElement('canvas'); fogC.width = W; fogC.height = Math.ceil(H * 0.65); { const x = fogC.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, fogC.height); g.addColorStop(0, 'rgba(200,180,160,0)'); g.addColorStop(1, 'rgba(200,180,160,0.1)'); x.fillStyle = g; x.fillRect(0, 0, W, fogC.height); }
    r.imgFog = run(() => { c.drawImage(fogC, 0, H * 0.35); });
    const thin = document.createElement('canvas'); thin.width = 1; thin.height = fogC.height; { const x = thin.getContext('2d'); x.drawImage(fogC, 0, 0, 1, fogC.height, 0, 0, 1, fogC.height); }
    r.stretchFog = run(() => { c.drawImage(thin, 0, H * 0.35, W, fogC.height); });
    r.gradSky = run(() => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#123456'); g.addColorStop(0.55, '#345678'); g.addColorStop(1, '#567890'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
    const skyC = document.createElement('canvas'); skyC.width = W; skyC.height = H; { const x = skyC.getContext('2d', { alpha: false }); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#123456'); g.addColorStop(1, '#567890'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    r.imgSky = run(() => { c.drawImage(skyC, 0, 0); });
    const layer = document.createElement('canvas'); layer.width = 2496; layer.height = 600; { const x = layer.getContext('2d'); x.fillStyle = 'rgba(80,120,60,1)'; for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(i * 64, 300, 80, 0, 7); x.fill(); } x.fillRect(0, 300, 2496, 300); }
    r.layerBlit = run(() => { c.drawImage(layer, -300, 180); });
    return r;
  })));
  await b.close();
})();
