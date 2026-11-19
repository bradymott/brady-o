// browser (silent): the audio after Brady's freeze. A save like his (joint + beans + a plane, the Backpack full, a star,
// LSD and trip colours in tour.carry), 3-5 entered again and again (RESTART LEVEL, the map, a page reload = the app
// restarted), hidden / shown (an iPhone interruption), a long stall of the main thread. Each second it counts the music
// calls, sound effects, audio sources started and still playing, and connected audio nodes; the music track and its
// scheduler. A second music loop running at once doubles the sources per second; a stuck source keeps the live count up.
// Fails when: two music loops play at once (sources per second over 90; one track makes 15-62), sources pile up (over 120 playing), the
// music does not come back after RESUME or after a stall, or the page throws.
// usage: BRADY_DIST=<dist> node tools/sbw_audio_test.js [chromium|webkit]
const pw = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs'), http = require('http');
const ENG = process.argv[2] || 'chromium';
let failures = 0; const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) failures++; };
const root = path.join(process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist'), 'site');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, path.normalize(p)); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
const instrument = () => {
  const S = window.__au = { started: 0, ended: 0, music: [], sfx: 0, connects: 0 };
  const SP = AudioScheduledSourceNode.prototype, st0 = SP.start;
  SP.start = function () { S.started++; this.addEventListener('ended', () => { S.ended++; }); return st0.apply(this, arguments); };
  const AP = AudioNode.prototype, c0 = AP.connect; AP.connect = function () { S.connects++; return c0.apply(this, arguments); };
  const wrap = () => { const So = window.BRADY && window.BRADY.Sound; if (!So || So.__w) return !!So; So.__w = true; const m0 = So.music, p0 = So.play; So.music = function (n) { S.music.push((performance.now() / 1000).toFixed(1) + ':' + n); return m0.apply(this, arguments); }; So.play = function () { S.sfx++; return p0.apply(this, arguments); }; return true; };
  const iv = setInterval(() => { if (wrap()) clearInterval(iv); }, 50);
};
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${srv.address().port}/super-brady-o-world/index.html`;
  const browser = await pw[ENG].launch(ENG === 'chromium' ? { args: ['--autoplay-policy=no-user-gesture-required'] } : {});
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, hasTouch: true }); await silence(ctx);
  await ctx.addInitScript(instrument);
  let page = await ctx.newPage();
  const out = [];
  const L = s => { out.push(s); console.log(s); };
  page.on('pageerror', e => L('pageerror ' + e.message));
  await page.goto(url); await page.waitForTimeout(2000);
  const ev = (fn, a) => page.evaluate(fn, a).catch(e => 'ERR ' + String(e).slice(0, 80));
  // the save Brady had: what 3-4 left him (carried), the Backpack full
  await ev(() => { const B = window.BRADY; window.BRADY_CARRY.set({ v: 1, from: '3-4', power: 2, hands: { id: 'plane', uses: 0 }, jump: { id: 'beans' }, star: 6, lsd: 6, dizzy: 3, joint: 1 }); B.Save.data.pack = 'gear:wand'; B.Save.data.lives = 9; B.Save.save(); });
  await page.mouse.click(400, 200);   // a tap: the audio unlocks
  const enter = () => ev(() => { const B = window.BRADY; B.Save.data.lives = 9; B.Game.setScene(new B.Play(B.getLevel(3, 5), {})); });
  const measure = async (label, secs) => {
    const rows = [];
    for (let s = 0; s < secs; s++) {
      const a = await ev(() => ({ ...window.__au, music: window.__au.music.length, state: window.BRADY.Sound && (window.BRADY.Sound.ctxState ? window.BRADY.Sound.ctxState() : '') }));
      await page.waitForTimeout(1000);
      const b = await ev(() => ({ ...window.__au, music: window.__au.music.slice() }));
      if (typeof a === 'string' || typeof b === 'string') { rows.push('?'); continue; }
      rows.push({ srcPerS: b.started - a.started, live: b.started - b.ended, sfxPerS: b.sfx - a.sfx, conn: b.connects - a.connects });
    }
    const last = await ev(() => window.__au.music.slice(-4).join(' '));
    const ok = rows.filter(r => r !== '?');
    measure.last = ok;
    check(`${label}: at most one music loop (sources per second <= 90; one track makes 15-62) and nothing piling up (<= 120 playing)`, ok.length && ok.every(r => r.srcPerS <= 90 && r.live <= 120), ok.map(r => r.srcPerS + '/' + r.live));
    L(`  ${label}: per second ${JSON.stringify(rows.map(r => r === '?' ? '?' : `${r.srcPerS} src / ${r.live} live / ${r.sfxPerS} sfx`))} | last music calls: ${last}`);
  };
  await enter(); await page.waitForTimeout(500); await measure('3-5 entered (carried star + LSD + trips)', 6);
  for (let k = 1; k <= 3; k++) { await enter(); await page.waitForTimeout(500); await measure(`RESTART LEVEL ${k}`, 4); }
  // an iPhone interruption: hidden, then shown
  await ev(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(1500);
  await ev(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await measure('after hide / show (the game paused itself: music waits for RESUME)', 3);
  await ev(() => { const g = window.BRADY.Game.scene; if (g.paused) g.closePause(); });
  await measure('after RESUME', 3);
  check('the music comes back after RESUME', measure.last.some(r => r.srcPerS > 0));
  // the main thread stalls for 3 s (a freeze), then the game goes on
  await ev(() => { const t = performance.now(); while (performance.now() - t < 3000) { /* busy */ } });
  await measure('after a 3 s stall', 5);
  check('the music goes on after a 3 s stall of the main thread', measure.last.slice(1).every(r => r.srcPerS > 0));
  // the app restarted: a new page with the same save
  await page.close(); page = await ctx.newPage(); page.on('pageerror', e => L('pageerror ' + e.message));
  await page.goto(url); await page.waitForTimeout(2000); await page.mouse.click(400, 200);
  await enter(); await page.waitForTimeout(500); await measure('app restarted, 3-5 again', 6);
  const carry = await ev(() => JSON.stringify(window.BRADY_CARRY.get()));
  L('the save\'s carry after all that: ' + carry);
  await browser.close(); srv.close();
  check('no page errors', !out.some(l => /^pageerror/.test(l)));
  console.log(failures ? failures + ' FAILED' : 'all audio checks passed');
  process.exit(failures ? 1 : 0);
})();
