// M1: screenshots of the POWER-UPS guide (home + race pause) and a text-fit audit of the guide rows and the 12 car cards.
//   BRADY_DIST=… node guide_shots.js <outDir> [sizes=844x390,390x844]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = path.resolve(process.env.BRADY_DIST);
const site = path.join(dist, 'site');
const out = path.resolve(process.argv[2]);
const sizes = (process.argv[3] || '844x390,390x844').split(',').map(s => s.split('x').map(Number));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.gz': 'application/gzip' };
function serve(root) {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' }));
  });
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site);
  const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const errs = [], warns = [];
  for (const [w, h] of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.__cartFixedQ = 1; try { localStorage.clear(); } catch (e) { /* ignore */ } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 300)));
    page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
    await page.goto(url + 'art-cart/');
    await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.CartGLB && window.BRADY_BURNS.CartGLB.ready, null, { timeout: 120000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    const tag = w + 'x' + h;
    await page.evaluate(() => { const s = window.BRADY.Game.scene; s.state = 'mode'; s.build(); });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(out, `home-${tag}.png`) });
    // with trophies won (their line used to sit on top of MUSIC / SFX)
    await page.evaluate(() => { const B = window.BRADY_BURNS, sv = B.cartSave(); sv.trophies = { dust: 1, fire: 2 }; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(out, `home-trophies-${tag}.png`) });
    await page.evaluate(() => { window.BRADY_BURNS.cartSave().trophies = {}; });
    // open the guide by tapping its button (the real path)
    const b = await page.evaluate(() => { const g = window.BRADY.Game.scene.guideBtn; return { x: g.x + g.w / 2, y: g.y + g.h / 2 }; });
    await page.touchscreen.tap(b.x, b.y);
    await page.waitForTimeout(600);
    const st = await page.evaluate(() => window.BRADY.Game.scene.state);
    if (st !== 'guide') errs.push(tag + ': tapping POWER-UPS did not open the guide (state ' + st + ')');
    // every tab and page
    const pages = await page.evaluate(() => { const g = window.BRADY.Game.scene.guide; return g.tabs.map((t, i) => { g.tab = i; return g.pages(); }); });
    for (let t = 0; t < pages.length; t++) for (let p = 0; p < pages[t]; p++) {
      await page.evaluate(([t, p]) => { const g = window.BRADY.Game.scene.guide; g.tab = -1; g.setTab(t); g.setPage(p); }, [t, p]);
      await page.waitForTimeout(350);
      await page.screenshot({ path: path.join(out, `guide-${tag}-tab${t}-p${p + 1}.png`) });
    }
    // text fit audit: every row's lines at their fitted size against the space they have
    const audit = await page.evaluate(() => {
      const g = window.BRADY.Game.scene.guide, c = window.BRADY.Game.ctx, U = '"Rubik", "Avenir Next", "Helvetica Neue", system-ui, sans-serif', D = '"Bungee", "Arial Black", Impact, system-ui, sans-serif', bad = [], tw0 = g.colW - 64;
      const m = (f, s) => { c.font = f; return c.measureText(s).width; };
      for (const t of g.tabs) for (const r of t.rows) {
        const nw = m(r.nameFs + 'px ' + D, r.name), ww = m('600 ' + r.whatFs + 'px ' + U, r.what), tw = r.tip ? m('600 ' + r.tipFs + 'px ' + U, r.tip) : 0;
        if (nw + r.tagW > tw0 + 0.5) bad.push(r.id + ' name+tag ' + Math.round(nw + r.tagW) + '>' + Math.round(tw0));
        if (ww > tw0 + 0.5) bad.push(r.id + ' what ' + Math.round(ww) + '>' + Math.round(tw0));
        if (tw + r.preW > tw0 + 0.5) bad.push(r.id + ' tip ' + Math.round(tw + r.preW) + '>' + Math.round(tw0));
        if (r.whatFs < 10 || r.tipFs < 9 || r.nameFs < 12) bad.push('small: ' + r.id + ' name ' + r.nameFs + ' what ' + r.whatFs + ' tip ' + r.tipFs);
      }
      return { colW: g.colW, per: g.per, cols: g.cols, bad };
    });
    console.log(tag, 'guide cols', audit.cols, 'colW', Math.round(audit.colW), 'per page', audit.per, 'pages', pages.join('/'));
    for (const b of audit.bad) (b.startsWith('small') ? warns : errs).push(tag + ' guide: ' + b);
    // back to home with the BACK button
    const bk = await page.evaluate(() => { const g = window.BRADY.Game.scene.guide.back; return { x: g.x + g.w / 2, y: g.y + g.h / 2 }; });
    await page.touchscreen.tap(bk.x, bk.y); await page.waitForTimeout(400);
    if (await page.evaluate(() => window.BRADY.Game.scene.state) !== 'mode') errs.push(tag + ': guide BACK did not return home');
    // the car cards' text: fitted sizes and line counts for all 12 cars
    const cards = await page.evaluate(() => {
      const s = window.BRADY.Game.scene, B = window.BRADY_BURNS, c = window.BRADY.Game.ctx; s.state = 'car'; s.build(); const pw = s.cardRect.w, rows = [];
      for (const car of B.CART_CARS) { const t = s.cardText(c, car, pw); c.font = '600 10px "Rubik", "Avenir Next", "Helvetica Neue", system-ui, sans-serif'; const last = t.wDesc[t.wDesc.length - 1], rw = c.measureText(t.reload).width;
        rows.push({ id: car.id, tag: t.tag.length, wDesc: t.wDesc.length, nameFs: t.nameFs, nodFs: t.nodFs, wTitleFs: t.wTitleFs, sTitleFs: t.sTitleFs, sLineFs: t.sLineFs, reloadClash: t.wDesc.length >= 3 && c.measureText(last).width + 66 + rw + 26 > pw }); }
      return { pw, ph: s.cardRect.h, rows };
    });
    console.log(tag, 'card', Math.round(cards.pw) + 'x' + Math.round(cards.ph));
    for (const r of cards.rows) { console.log('  ', JSON.stringify(r)); if (r.reloadClash) errs.push(tag + ' card ' + r.id + ': weapon text reaches RELOAD'); if (r.sLineFs < 9.5 || r.sTitleFs < 11 || r.wTitleFs < 11 || r.nodFs < 9.5) warns.push(tag + ' card ' + r.id + ' squeezed: ' + JSON.stringify(r)); }
    // the race pause menu's POWER-UPS
    await page.evaluate(() => { const B = window.BRADY_BURNS; window.BRADY.Game.setScene(new B.CartRaceScene({ mode: 'tt', track: 'esplanade', driver: 'brady', car: 'whale', autoGas: true })); });
    await page.waitForFunction(() => { const s = window.BRADY.Game.scene; return s && s.state && s.state !== 'load'; }, null, { timeout: 120000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.BRADY.Game.scene.openPause());
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(out, `pause-${tag}.png`) });
    const pb = await page.evaluate(() => { const b = window.BRADY.Game.scene.pauseBtns.find(b => b.label === 'POWER-UPS'); return b && { x: b.x + b.w / 2, y: b.y + b.h / 2 }; });
    if (!pb) errs.push(tag + ': no POWER-UPS in the pause menu');
    else {
      await page.touchscreen.tap(pb.x, pb.y); await page.waitForTimeout(500);
      if (!(await page.evaluate(() => !!window.BRADY.Game.scene.guide))) errs.push(tag + ': pause POWER-UPS did not open the guide');
      await page.evaluate(() => { const g = window.BRADY.Game.scene.guide; g.setTab(1); });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(out, `pause-guide-${tag}.png`) });
      // a swipe pages it
      const sw = await page.evaluate(() => { const g = window.BRADY.Game.scene.guide; const p0 = g.page; window.BRADY.Input.lastSwipe = { dx: -120, dy: 4 }; return p0; });
      await page.waitForTimeout(200);
      const p1 = await page.evaluate(() => window.BRADY.Game.scene.guide.page);
      console.log(tag, 'swipe page', sw, '->', p1);
      const bk2 = await page.evaluate(() => { const g = window.BRADY.Game.scene.guide.back; return { x: g.x + g.w / 2, y: g.y + g.h / 2 }; });
      await page.touchscreen.tap(bk2.x, bk2.y); await page.waitForTimeout(400);
      const after = await page.evaluate(() => { const s = window.BRADY.Game.scene; return { guide: !!s.guide, paused: s.paused }; });
      if (after.guide || !after.paused) errs.push(tag + ': guide BACK in the pause menu should return to the pause menu ' + JSON.stringify(after));
      await page.screenshot({ path: path.join(out, `pause-back-${tag}.png`) });
    }
    await ctx.close();
  }
  await browser.close(); srv.close();
  if (warns.length) console.log('WARN:\n' + warns.join('\n'));
  if (errs.length) { console.log('ERRORS:\n' + errs.join('\n')); process.exit(1); }
  console.log('ok, shots in', out);
})().catch(e => { console.error(e); process.exit(1); });
