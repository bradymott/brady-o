const pw = require('playwright'); const path = require('path');
(async () => {
  const b = await pw.chromium.launch(); const page = await b.newPage();
  await page.goto('file://' + path.join(process.env.BRADY_DIST, 'site/super-brady-o-world/index.html')); await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const B = window.BRADY, G = B.Game; G.setScene(new B.Play(B.getLevel(1, 1), {}));
    const p = G.scene.player, draw = window.BRADY_DRAW;
    const K = 1, C = document.createElement("canvas"); C.width = 400; C.height = 360; const c = C.getContext('2d', { willReadFrequently: true });
    const states = ['idle', 'run', 'jump', 'fall', 'skid', 'crouch', 'swim', 'fly', 'float', 'hang', 'throw', 'airguitar', 'phone', 'victory', 'die', 'headbang', 'ride'];
    let worst = {}, who = {};
    for (const st of states) for (const power of [0, 1, 2, 3]) for (const small of [false, true]) for (const flags of [{}, { fly: true }, { floaty: true }, { star: true }, { trip: true, held: 'joint' }]) for (let ph = 0; ph < 5; ph++) {
      const dim = small ? { w: 20, h: 28 } : (st === 'crouch' && power > 0 ? { w: 22, h: 30 } : { w: 22, h: 54 });
      const cx = 200, bottom = 260, x = cx - dim.w / 2, y = bottom - dim.h;
      const hair = []; for (let i = 0; i < 7; i++) hair.push({ x: cx - 5 - i * 1.1 - ph, y: bottom - 57 + i * 4.5, px: cx - 5 - i * 1.1, py: bottom - 57 + i * 4.5 });
      const o = Object.assign({ x: cx, y: bottom, facing: ph % 2 ? 1 : -1, small, power, anim: { state: st, t: ph * 0.37, phase: ph * 0.6, speed: 1, base: 'run' }, hair: small ? null : hair, look: B.Save.data.look, time: ph * 0.41 }, flags);
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, C.width, C.height);
      c.setTransform(K, 0, 0, K, 0, 0);
      try { c.save(); c.translate(o.x, o.y); c.scale(1.24, 1.24); c.translate(-o.x, -o.y); draw(c, o); c.restore(); } catch (e) { continue; }
      const d = c.getImageData(0, 0, C.width, C.height).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
      for (let yy = 0; yy < C.height; yy++) for (let xx = 0; xx < C.width; xx++) if (d[(yy * C.width + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
      if (x1 < 0) continue;
      const bx0 = x - 8, bx1 = x + dim.w + 8, by0 = y - 14, by1 = bottom;
      const ov = { l: bx0 - x0 / K, r: x1 / K - bx1, t: by0 - y0 / K, b: y1 / K - by1 };
      const gk = st + (small ? ' small' : '') + ' ' + Object.keys(flags).join('+'); const W = worst[gk] || (worst[gk] = { l: -99, r: -99, t: -99, b: -99 }); for (const k in ov) if (ov[k] > W[k]) W[k] = Math.round(ov[k]);
    }
    return { worst, who };
  });
  console.log(JSON.stringify(r, null, 1)); await b.close();
})();
