const { chromium } = require('playwright');
const fs = require('fs');
const [out, ...f] = process.argv.slice(2);
const d = x => 'data:image/png;base64,' + fs.readFileSync(x).toString('base64');
const html = `<body style="margin:0;background:#ddd;display:flex;gap:20px;padding:20px;font:12px sans-serif">
<div>maskable, circle (Android)<br><img src="${d(f[0])}" style="width:256px;border-radius:50%"></div>
<div>maskable, squircle<br><img src="${d(f[0])}" style="width:256px;border-radius:22%"></div>
<div>maskable, raw + 80% safe zone<br><div style="position:relative;width:256px"><img src="${d(f[0])}" style="width:256px;display:block"><div style="position:absolute;left:25.6px;top:25.6px;width:204.8px;height:204.8px;border:2px dashed #fff;border-radius:50%"></div></div></div>
<div>512 (any)<br><img src="${d(f[1])}" style="width:256px;border-radius:22%"></div>
<div>favicon 32 at 1:1 and 2x<br><img src="${d(f[2])}"> <img src="${d(f[2])}" style="width:64px;image-rendering:pixelated"></div></body>`;
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1450, height: 330 } })).newPage(); await p.setContent(html); await p.screenshot({ path: out }); await b.close(); })();
