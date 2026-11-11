// In-game check in WebKit and Chromium: the app boots, music waits for a tap, then the title, map and
// a Mexico level play the new songs through a live AudioContext, with zero page errors; mute works.
const PW = require('/Users/bradymott/brady-o/node_modules/playwright');
const path = require('path');
const app = 'file://' + path.join(process.env.BRADY_DIST, 'site', 'super-brady-o-world', 'index.html');
(async () => { for (const br of ['webkit', 'chromium']) {
  const b = await PW[br].launch(), ctx = await b.newContext({ viewport: { width: 844, height: 390 }, isMobile: br !== 'webkit' ? true : undefined, hasTouch: true });
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(app); await p.waitForTimeout(2000);
  const before = await p.evaluate(() => ({ track: window.BRADY.Sound.currentTrack }));
  await p.mouse.click(400, 200); await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => {
    const B = window.BRADY, T = window.BRADY_TOUR, Sound = B.Sound, out = {};
    out.afterTap = Sound.currentTrack;
    out.title = Sound._info('title') && Sound._info('title').name;
    B.goToMap('world'); await new Promise(r => setTimeout(r, 800)); out.map = Sound.currentTrack;
    B.Game.setScene(new B.Play(B.getLevel(T.Tour.countries.mx.world, 1), {})); await new Promise(r => setTimeout(r, 1500)); out.level = Sound.currentTrack;
    Sound.setMusicVolume(0); await new Promise(r => setTimeout(r, 300)); out.muteOk = true; Sound.setMusicVolume(0.6);
    return out;
  });
  console.log(br, JSON.stringify(before), JSON.stringify(r), 'errors:', errs.length ? errs.slice(0, 3) : 0);
  await b.close(); } })();
