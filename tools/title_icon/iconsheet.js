// usage: node iconsheet.js <out.png> <label=png> ...   a home-screen style sheet: each icon at 180/120/60/40 px,
// on a light and a dark wallpaper, in iOS's rounded-square mask, plus a fake home-screen row at 60pt @3x
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [out, ...pairs] = process.argv.slice(2);
const items = pairs.map(p => { const [l, f] = p.split('='); return { l, src: 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') }; });
const others = ['#e85a4a', '#3a8a5a', '#4a6ad8', '#d8a43a'];
const row = (bg, fg) => items.map(it => `<div class="cand" style="background:${bg};color:${fg}"><div class="lbl">${it.l}</div><div class="sizes">${[180, 120, 60, 40].map(s => `<div><img src="${it.src}" style="width:${s}px;height:${s}px;border-radius:${s * 0.2237}px"><span>${s}</span></div>`).join('')}</div>
<div class="home">${others.slice(0, 2).map(c => `<div class="app"><div class="fake" style="background:${c}"></div><small>Notes</small></div>`).join('')}<div class="app"><img src="${it.src}"><small>Brady-O World</small></div>${others.slice(2).map(c => `<div class="app"><div class="fake" style="background:${c}"></div><small>Photos</small></div>`).join('')}</div></div>`).join('');
const html = `<html><body style="margin:0;font:12px -apple-system,system-ui,sans-serif">
<style>.cand{padding:12px 16px;display:inline-block;vertical-align:top}.lbl{font-weight:700;margin-bottom:6px}.sizes{display:flex;gap:14px;align-items:flex-end}.sizes div{display:flex;flex-direction:column;align-items:center;gap:3px}
.home{display:flex;gap:27px;margin-top:14px;padding:12px;border-radius:20px}.app{display:flex;flex-direction:column;align-items:center;width:64px}.app img,.fake{width:60px;height:60px;border-radius:13.4px}.app small{margin-top:5px;font-size:11px;white-space:nowrap}</style>
<div style="background:linear-gradient(135deg,#f6e7d8,#cfe3f5)">${row('transparent', '#222')}</div>
<div style="background:linear-gradient(135deg,#0b0b1a,#2a1a3a)">${row('transparent', '#eee')}</div>
</body></html>`;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 560 * items.length, height: 300 }, deviceScaleFactor: 2 })).newPage();
  await p.setContent(html); await p.waitForTimeout(200);
  await p.screenshot({ path: out, fullPage: true }); await b.close();
})();
