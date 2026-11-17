// Screenshots of the Piwi Squirmin' story in the real game: the title, every intro panel, a boss intro banner
// ("tonight's act"), the World 22 encore (before and after the Nepal finale), every ending card and the credits,
// in phone landscape (844x390) and portrait (390x844) at 3x. Full resolution is pinned before each capture.
//   BRADY_DIST=<dist> node tools/build.js
//   node tools/story_preview/scenes.js <dist>/site <outDir>
// The Nepal fight itself is shot by tools/boss_test.js np --shots <dir> (np_showtrunk, np_mech, np_ledge, np_finale).
const { chromium } = require('playwright');
const { silence } = require('../sbw_silent');
const path = require('path'), fs = require('fs');
const site = path.resolve(process.argv[2] || 'dist/site'), out = path.resolve(process.argv[3] || 'shots/story_scenes');
fs.mkdirSync(out, { recursive: true });
let bad = 0;
(async () => {
  const browser = await chromium.launch();
  try {
    for (const [tag, vw, vh] of [['land', 844, 390], ['port', 390, 844]]) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      await silence(ctx);
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', e => errs.push(e.message));
      await page.goto('file://' + path.join(site, 'super-brady-o-world', 'index.html'));
      await page.waitForFunction(() => window.BRADY && window.BRADY.Game && window.BRADY.Game.scene, null, { timeout: 30000 });
      await page.waitForTimeout(2500);
      const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
      const shot = async (name, wait) => { await pin(); await page.waitForTimeout(wait || 400); await page.screenshot({ path: path.join(out, `${tag}_${name}.png`) }); };
      await shot('title', 1500);
      // the intro panels
      const n = await page.evaluate(() => { const B = window.BRADY, T = window.BRADY_TOUR; B.Game.setScene(new B.StoryScene(T.TourIntroPanels(), () => {})); return B.Game.scene.panels.length; });
      for (let i = 0; i < n; i++) { await page.evaluate(k => { const s = window.BRADY.Game.scene; s.i = k; s.pt = 2.2; }, i); await shot('intro' + (i + 1), 300); }
      // a boss intro: tonight's act banner (Mexico)
      await page.evaluate(() => {
        const B = window.BRADY; B.Save.data.lives = 5; B.Game.setScene(new B.Play(B.getLevel(1, 5), {}));
      });
      await page.waitForTimeout(1500);
      await page.evaluate(() => {
        const g = window.BRADY.Game.scene; let b = g.entities.find(e => e.boss && !e.remove);
        if (!b) { const k = g.level.areas.findIndex(a => a.role === 'arena' || a.spawns.some(s => s.type === 'boss')); const a = g.level.areas[k], an = (a.anchors && (a.anchors.in || a.anchors.start)) || { x: 112, y: (a.H - 4) * 32 }; g.loadArea(k, an.x, an.y, 0); b = g.entities.find(e => e.boss && !e.remove); }
        const p = g.player; p.x = b.arenaX0 + 64; p.y = b.floorY - p.h - 4; p.vy = 0;
      });
      await page.waitForTimeout(900);
      await shot('boss_act_mx', 100);
      // the World 22 encore, before and after the main ending
      for (const post of [false, true]) {
        await page.evaluate(post => {
          const B = window.BRADY; B.Save.data.beatGame = post; B.Save.data.lives = 5; B.Game.setScene(new B.Play(B.getLevel(22, 4), {}));
        }, post);
        await page.waitForTimeout(1200);
        await page.evaluate(() => {
          // the Other Brady's arena (the lead-in hall has a camp boss of its own)
          const g = window.BRADY.Game.scene; let b = g.entities.find(e => e.style === 'w22_other' && !e.remove);
          if (!b) { const k = g.level.areas.findIndex(a => a.role === 'arena'); const a = g.level.areas[k], an = (a.anchors && (a.anchors.in || a.anchors.start)) || { x: 112, y: (a.H - 4) * 32 }; g.loadArea(k, an.x, an.y, 0); b = g.entities.find(e => e.style === 'w22_other' && !e.remove); }
          const p = g.player; p.x = b.arenaX0 + 40; p.y = b.floorY - p.h - 4; p.vy = 0; p.invuln = 99;
          window.__b = b;
        });
        await page.waitForTimeout(2500);
        await page.evaluate(() => { const b = window.__b; b.die(); });
        await page.waitForTimeout(post ? 9500 : 3600);
        await shot(post ? 'w22_encore_after' : 'w22_encore_before', 100);
      }
      // the ending cards and the credits
      for (let st = 0; st < 5; st++) { await page.evaluate(k => { const T = window.BRADY_TOUR, B = window.BRADY; if (!(B.Game.scene instanceof T.TourEndingScene)) B.Game.setScene(new T.TourEndingScene()); const s = B.Game.scene; s.stage = k; s.t = 3; }, st); await shot('ending' + (st + 1), 500); }
      await page.evaluate(() => { const B = window.BRADY; B.Game.setScene(new B.CreditsScene('world')); });
      await shot('credits', 2500);
      await page.evaluate(() => { const s = window.BRADY.Game.scene; if (s.scroll != null) s.scroll += 300; if (s.t != null) s.t += 8; });
      await shot('credits2', 400);
      if (errs.length) { bad++; console.log(tag + ' PAGE ERRORS:\n' + errs.slice(0, 8).join('\n')); }
      await ctx.close();
    }
    console.log(bad ? 'FAIL story scenes' : 'PASS story scenes: ' + out);
    process.exitCode = bad ? 1 : 0;
  } finally { await browser.close(); }
})();
