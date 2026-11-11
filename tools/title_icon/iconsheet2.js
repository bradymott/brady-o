// node iconsheet2.js <out.png> <dir> <variants,...>   each variant's native renders (<dir>/<v>-<N>.png) at 1:1 px, iOS mask, light and dark
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [out, dir, vs] = process.argv.slice(2);
const im = (v, n) => 'data:image/png;base64,' + fs.readFileSync(path.join(dir, `${v}-${n}.png`)).toString('base64');
const row = (fg) => vs.split(',').map(v => `<div class="cand" style="color:${fg}"><div class="lbl">${v}</div><div class="sizes">${[180, 120, 60, 40].map(s => `<div><img src="${im(v, s)}" style="width:${s}px;height:${s}px;border-radius:${s * 0.2237}px"><span>${s}</span></div>`).join('')}</div>
<div class="home">${['#e85a4a', '#3a8a5a'].map(c => `<div class="app"><div class="fake" style="background:${c}"></div><small>Notes</small></div>`).join('')}<div class="app"><img src="${im(v, 60)}"><small>Brady-O World</small></div><div class="app"><div class="fake" style="background:#4a6ad8"></div><small>Photos</small></div></div></div>`).join('');
const html = `<html><body style="margin:0;font:12px -apple-system,system-ui,sans-serif"><style>.cand{padding:12px 16px;display:inline-block;vertical-align:top}.lbl{font-weight:700;margin-bottom:6px}.sizes{display:flex;gap:14px;align-items:flex-end}.sizes div{display:flex;flex-direction:column;align-items:center;gap:3px}
.home{display:flex;gap:27px;margin-top:14px;padding:12px}.app{display:flex;flex-direction:column;align-items:center;width:64px}.app img,.fake{width:60px;height:60px;border-radius:13.4px}.app small{margin-top:5px;font-size:11px;white-space:nowrap}</style>
<div style="background:linear-gradient(135deg,#f6e7d8,#cfe3f5)">${row('#222')}</div><div style="background:linear-gradient(135deg,#0b0b1a,#2a1a3a)">${row('#eee')}</div></body></html>`;
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 470 * vs.split(',').length, height: 300 }, deviceScaleFactor: 1 })).newPage(); await p.setContent(html); await p.waitForTimeout(200); await p.screenshot({ path: out, fullPage: true }); await b.close(); })();
