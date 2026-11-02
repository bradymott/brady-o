// Touch-control test with synthetic multi-touch pointer events, landscape + portrait.
const { chromium } = require('playwright');
const path = require('path');
const shots = process.argv[2] || '.';
(async () => {
  const browser = await chromium.launch();
  for (const [w, h, label] of [[874, 402, 'landscape'], [402, 874, 'portrait']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + path.join(__dirname, '..', 'dist', 'brady-o.html'));
    await page.waitForTimeout(1200);
    const res = await page.evaluate(async () => {
      const B = window.BRADY, G = B.Game, I = B.Input;
      const c = G.canvas;
      const ev = (type, id, x, y) => c.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, cancelable: true, isPrimary: id === 1 }));
      const wait = ms => new Promise(r => setTimeout(r, ms));
      B.Save.data.lives = 5;
      G.setScene(new B.Play(B.getLevel(1, 1), {}));
      await wait(2300);
      const L = I.layout, g = G.scene, p = g.player;
      const out = { layout: { stick: [Math.round(L.stickHome.x), Math.round(L.stickHome.y)], jump: [Math.round(L.jump.x), Math.round(L.jump.y)], act: [Math.round(L.action.x), Math.round(L.action.y)], pause: [Math.round(L.pause.x), Math.round(L.pause.y)] }, gameRect: G.gameRect };
      // thumb on stick, slide right
      const x0 = p.x;
      ev('pointerdown', 1, L.stickHome.x, L.stickHome.y);
      ev('pointermove', 1, L.stickHome.x + 40, L.stickHome.y + 3);
      out.rightHeld = I.right;
      await wait(700);
      // second finger: jump while running
      ev('pointerdown', 2, L.jump.x, L.jump.y);
      out.jumpHeld = I.jump;
      await wait(150);
      out.airborne = !p.onGround;
      ev('pointerup', 2, L.jump.x, L.jump.y);
      await wait(500);
      ev('pointerup', 1, L.stickHome.x + 40, L.stickHome.y);
      out.released = !I.right && !I.jump;
      out.moved = Math.round(p.x - x0);
      // pause button
      ev('pointerdown', 3, L.pause.x, L.pause.y); ev('pointerup', 3, L.pause.x, L.pause.y);
      await wait(200);
      out.paused = g.paused;
      // tap RESUME
      const r = g.pauseUI && g.pauseUI[0];
      if (r) { ev('pointerdown', 4, r.x + r.w / 2, r.y + r.h / 2); ev('pointerup', 4, r.x + r.w / 2, r.y + r.h / 2); }
      await wait(200);
      out.resumed = !g.paused;
      return out;
    });
    await page.screenshot({ path: path.join(shots, `touch-${label}.png`) });
    console.log(label, JSON.stringify(res), errs.length ? 'ERRORS ' + errs.join('|') : '');
    await ctx.close();
  }
  await browser.close();
})();
