// Contact sheets of the Piwi Squirmin' story cast (src/05b_piwi.js, 05c_chinka.js, 05d_showtrunk.js, 05e_pupo.js),
// next to Brady for scale, on a mid-tone and on a dark backdrop. Uses a built Super Brady-O World app.
//   BRADY_DIST=<dist> node tools/build.js
//   node tools/story_preview/sheet.js <dist>/site <outDir>
// Writes <outDir>/story_sheet_mid.png, story_sheet_dark.png and story_phone_1x.png. Rows 1-2 are the in-game size on a
// phone (Near zoom: 10 tile rows on a 390-px-high screen, Brady's art scale 1.24, so 1.5 CSS px per art unit), row 3
// is cutscene size, row 4 the Showtrunk, the map icon, the cage and the heads. Everything goes through the game's own
// Ink outline, with Brady's cream rim, exactly as the player is drawn. story_phone_1x.png is an iPhone-sized screen
// (844x390 at 3x) with a day half and a night half.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const site = path.resolve(process.argv[2] || 'dist/site'), out = path.resolve(process.argv[3] || 'shots/story');
fs.mkdirSync(out, { recursive: true });
const W = 1500, H = 1300;
(async () => {
  const browser = await chromium.launch();
  try {
    const errs = [];
    const open = async (vw, vh, dpr) => {
      const page = await (await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr })).newPage();
      page.on('pageerror', e => errs.push(e.message));
      await page.goto('file://' + path.join(site, 'super-brady-o-world', 'index.html'));
      await page.waitForFunction(() => window.BRADY_STORY && window.BRADY && window.BRADY.Game, null, { timeout: 30000 });
      await page.waitForTimeout(1500);
      return page;
    };
    const page = await open(W, H, 2);
    for (const [name, bg, fg] of [['mid', '#7f97ad', '#10202c'], ['dark', '#191424', '#f4ecdc']]) {
      await page.evaluate(({ bg, fg, W, H }) => {
        const S = window.BRADY_STORY, Ink = S.ink(), look = window.BRADY.Save.data.look || {};
        let c = document.getElementById('sheet');
        if (!c) { c = document.createElement('canvas'); c.id = 'sheet'; document.body.appendChild(c); }
        const dpr = 2;
        Object.assign(c.style, { position: 'fixed', left: '0', top: '0', width: W + 'px', height: H + 'px', zIndex: 99999 });
        c.width = W * dpr; c.height = H * dpr;
        const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
        const label = (x, y, s, size) => { ctx.fillStyle = fg; ctx.font = `${size || 12}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.fillText(s, x, y); };
        // inked(x, y, scale, box w, box h above the origin, draw, box below the origin)
        const inked = (x, y, s, w, h, fn, below) => {
          ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
          Ink.around(ctx, -w / 2, -h, w, h + (below || 6), c2 => fn(c2), { pad: 12, width: 1.0, color: '#120e16', rim: '#e7e3d7', hero: true });
          ctx.restore();
        };
        const brady = (x, y, s, st, t) => inked(x, y, s, 60, 80, c2 => S.drawBrady({ ctx: c2, x: 0, y: 0, facing: 1, small: false, power: 0, anim: { state: st || 'idle', t: t || 0.3, phase: (t || 0.3) * 12, speed: 1 }, hair: null, look, time: t || 0.3 }));
        const piwi = (x, y, s, pose, t, f) => inked(x, y, s, 60, 80, c2 => S.Piwi.draw(c2, { x: 0, y: 0, t, pose, facing: f || 1 }));
        const chinka = (x, y, s, pose, t, f, pupo) => inked(x, y, s, 70, 100, c2 => S.ChinkaO.draw(c2, { x: 0, y: pose === 'seated' ? -12 : 0, t, pose, facing: f || 1, pupo }));
        const pupo = (x, y, s, pose, t, f) => inked(x, y, s, 70, 60, c2 => S.Pupo.draw(c2, { x: 0, y: pose === 'hang' ? -44 : 0, t, pose, facing: f || 1, bar: pose === 'hang' }));
        const floor = (y) => { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, y, W, 3); };
        ctx.fillStyle = fg; ctx.font = 'bold 15px system-ui, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Piwi Squirmin\' · Chinka-O · Pupo · the Showtrunk   —   rows 1-2: in-game size on a phone (1.5 css px per unit, Near zoom)   ·   row 3: cutscene size (x3)', 16, 22);
        const rider = (t) => (c2, sx, sy) => S.drawBrady({ ctx: c2, x: sx, y: sy + 25, facing: 1, small: false, power: 0, anim: { state: 'ride', t, phase: 0, speed: 1 }, hair: null, look, time: t });
        const pupoP = (x, y, s, pose, t, extra, f) => inked(x, y, s, (extra && extra.reach ? extra.reach * 2 + 80 : 200), (extra && extra.reach ? extra.reach + 60 : 120), c2 => S.Pupo.draw(c2, Object.assign({ x: 0, y: 0, t, pose, facing: f || 1 }, extra || {})), 20);
        // ---- row 1: Piwi, in-game size
        let y = 165, s = 1.5; floor(y);
        const r1 = [['BRADY', x => brady(x, y, s)],
          ['idle', x => piwi(x, y, s, 'idle', 0.3)], ['walk', x => piwi(x, y, s, 'walk', 0.13)], ['talk', x => piwi(x, y, s, 'talk', 0.1)],
          ['gloat', x => piwi(x, y, s, 'gloat', 0.1)], ['startled', x => piwi(x, y, s, 'startled', 0.2)], ['defeated', x => piwi(x, y, s, 'defeated', 0.2)]];
        r1.forEach(([n, fn], i) => { const x = 60 + i * 110; fn(x); label(x, y + 20, n); });
        label(390, y + 38, 'PIWI SQUIRMIN\'', 13);
        // the Showtrunk, the map icon and the heads fill the rest of row 1
        inked(960, y - 20, 0.8, 150, 130, c2 => S.Showtrunk.draw(c2, { x: 0, y: 0, t: 0.4, piwi: 'gloat', chinka: true }), 110);
        label(960, y + 38, 'Showtrunk (x0.8)');
        for (const [k, sc] of [[0, 1], [1, 1.6]]) S.Showtrunk.mini(ctx, 1120 + k * 70, 90 + k * 5, 0.5, sc);
        label(1155, y + 38, 'map icon x1, x1.6');
        inked(1290, 110, 2.2, 40, 40, c2 => S.Piwi.head(c2, 0, -14, 1, 0.3, { jaw: 4, eyes: 'smug', look: 1, brow: 1.5 }));
        inked(1400, 110, 2.6, 40, 40, c2 => S.ChinkaO.head(c2, 0, -14, 1, 0.3, { mouth: 'smile', eyes: 'open', brow: 0 }));
        S.Piwi.badge(ctx, 1460, 60, 9);
        // ---- row 2: Pupo, in-game size
        y = 400; floor(y);
        brady(60, y, s); label(60, y + 20, 'BRADY');
        const r2 = [['idle', 175, 'idle', 0.3], ['walk', 330, 'walk', 0.3], ['ride (Brady-O)', 500, 'ride', 0.3, { rider: rider(0.3) }], ['poke (reach)', 660, 'poke', 2.2],
          ['poke! *boop*', 790, 'poke', 3.0], ['stretch (any length)', 930, 'stretch', 0.3, { reach: 100, angle: 0.15 }], ['happy', 1210, 'happy', 0.3], ['sad (left behind)', 1360, 'sad', 0.3]];
        for (const [n, x, pose, t, ex] of r2) { pupoP(x, y, s, pose, t, ex); label(x, y + 20, n); }
        label(700, y + 38, 'PUPO', 13);
        // ---- row 3: Chinka-O, in-game size
        y = 590; floor(y);
        const r3 = [['BRADY', x => brady(x, y, s)],
          ['idle', x => chinka(x, y, s, 'idle', 0.3)], ['walk', x => chinka(x, y, s, 'walk', 0.15)], ['tiptoe', x => chinka(x, y, s, 'tiptoe', 0.3)],
          ['pirouette', x => chinka(x, y, s, 'pirouette', 0.05)], ['unimpressed', x => chinka(x, y, s, 'unimpressed', 0.3, -1)], ['wave', x => chinka(x, y, s, 'wave', 0.3)],
          ['seated', x => chinka(x, y, s, 'seated', 0.4)], ['reunion', x => chinka(x, y, s, 'reunion', 0.35)]];
        r3.forEach(([n, fn], i) => { const x = 60 + i * 125; fn(x); label(x, y + 20, n); });
        pupoP(1240, y, s, 'happy', 0.3); chinka(1215, y, s, 'hug', 0.3); label(1235, y + 20, 'hug (with Pupo)');
        label(560, y + 38, 'CHINKA-O', 13);
        // ---- row 4: cutscene size
        y = 960; s = 3; floor(y);
        brady(70, y, s, 'idle', 0.3); label(70, y + 22, 'Brady');
        piwi(230, y, s, 'gloat', 0.1); label(230, y + 22, 'Piwi: gloat');
        chinka(400, y, s, 'unimpressed', 0.3, -1); label(400, y + 22, 'Chinka-O: unimpressed');
        chinka(570, y, s, 'pirouette', 0.05); label(570, y + 22, 'pirouette');
        pupoP(800, y, 2.4, 'ride', 0.3, { rider: rider(0.3) }); label(800, y + 22, 'Brady-O riding Pupo (x2.4)');
        pupoP(1180, y, 2.2, 'power', 0.37); label(1180, y + 120, 'PUPO POWER! key pose (x2.2)');
        ctx.save(); ctx.font = `bold 46px ${'"Bungee", "Arial Black", Impact, sans-serif'}`; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
        ctx.lineWidth = 9; ctx.strokeStyle = '#1c1426'; ctx.strokeText('PUPO POWER!', 1200, 720); ctx.fillStyle = '#ffd23a'; ctx.fillText('PUPO POWER!', 1200, 720); ctx.restore();
        // ---- row 5: the cage close-up and Pupo's stretch at cutscene size
        y = 1240;
        inked(140, y + 40, 1.8, 60, 100, c2 => S.Showtrunk.cage(c2, 0, -82, 1, 0.4, true)); label(140, H - 12, 'show cage (x1.8)');
        pupoP(360, y, 2.0, 'stretch', 0.3, { reach: 220, angle: 0.35 }); label(520, H - 12, 'stretch, reach 220 (x2): arm length is a parameter');
        pupoP(1000, y, 2.0, 'sad', 0.3); label(1000, H - 12, 'sad: left behind with her bow');
        brady(1180, y, 2.0); label(1180, H - 12, 'Brady x2');
        pupoP(1360, y, 2.0, 'poke', 3.0); label(1360, H - 12, '"...pupo."');
      }, { bg, fg, W, H });
      await page.waitForTimeout(100);
      await page.screenshot({ path: path.join(out, `story_sheet_${name}.png`) });
    }
    // an iPhone-sized screen at the iPhone's own pixel density, for judging readability honestly
    const p2 = await open(844, 390, 3);
    await p2.evaluate(() => {
      const S = window.BRADY_STORY, Ink = S.ink(), look = window.BRADY.Save.data.look || {};
      const c = document.createElement('canvas'); document.body.appendChild(c);
      const W = 844, H = 390, dpr = 3; Object.assign(c.style, { position: 'fixed', left: '0', top: '0', width: W + 'px', height: H + 'px', zIndex: 99999 }); c.width = W * dpr; c.height = H * dpr;
      const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5aa8f0'); g.addColorStop(1, '#ffe4b0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W / 2, H);
      g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0e0a26'); g.addColorStop(1, '#3a2456'); ctx.fillStyle = g; ctx.fillRect(W / 2, 0, W / 2, H);
      ctx.fillStyle = '#d89a54'; ctx.fillRect(0, 300, W / 2, 90); ctx.fillStyle = '#2a2040'; ctx.fillRect(W / 2, 300, W / 2, 90);
      const inked = (x, y, s, w, h, fn, below) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); Ink.around(ctx, -w / 2, -h, w, h + (below || 6), fn, { pad: 12, width: 1.0, color: '#120e16', rim: '#e7e3d7', hero: true }); ctx.restore(); };
      const s = 1.5, y = 300;
      for (const off of [0, W / 2]) {
        inked(off + 60, y, s, 120, 100, c2 => S.Pupo.draw(c2, { x: 0, y: 0, t: 0.3, pose: 'ride', facing: 1, rider: (c3, sx, sy) => S.drawBrady({ ctx: c3, x: sx, y: sy + 25, facing: 1, small: false, power: 0, anim: { state: 'ride', t: 0.3, phase: 0, speed: 1 }, hair: null, look, time: 0.3 }) }), 10);
        inked(off + 150, y, s, 60, 80, c2 => S.Piwi.draw(c2, { x: 0, y: 0, t: 0.1, pose: 'gloat', facing: -1 }));
        inked(off + 210, y, s, 70, 100, c2 => S.ChinkaO.draw(c2, { x: 0, y: 0, t: 0.3, pose: 'unimpressed', facing: -1 }));
        inked(off + 268, y, s, 70, 100, c2 => S.ChinkaO.draw(c2, { x: 0, y: 0, t: 0.05, pose: 'pirouette', facing: -1 }));
        inked(off + 325, y, s, 70, 100, c2 => S.ChinkaO.draw(c2, { x: 0, y: 0, t: 0.35, pose: 'reunion', facing: -1 }));
        inked(off + 385, y, s, 70, 80, c2 => S.Pupo.draw(c2, { x: 0, y: 0, t: 3.0, pose: 'poke', facing: -1 }));
        inked(off + 210, 110, 0.6, 150, 130, c2 => S.Showtrunk.draw(c2, { x: 0, y: 0, t: 0.4, piwi: 'idle', chinka: true }), 110);
        S.Showtrunk.mini(ctx, off + 370, 60, 0.4, 1);
      }
    });
    await p2.waitForTimeout(100);
    await p2.screenshot({ path: path.join(out, 'story_phone_1x.png') });
    if (errs.length) { console.log('PAGE ERRORS:\n' + errs.join('\n')); process.exitCode = 1; }
    else console.log('wrote', path.join(out, 'story_sheet_mid.png'), path.join(out, 'story_sheet_dark.png'), path.join(out, 'story_phone_1x.png'));
  } finally { await browser.close(); }
})();
