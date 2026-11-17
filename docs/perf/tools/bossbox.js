// measure how far each boss's art reaches past its box, over a simulated fight (for the ink scratch size)
const pw = require('playwright'); const path = require('path');
(async () => {
  const b = await pw.chromium.launch(); const page = await (await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 })).newPage();
  page.on('pageerror', e => console.log('pageerror', e.message));
  await page.goto('file://' + path.join(process.env.BRADY_DIST, 'site/super-brady-o-world/index.html')); await page.waitForTimeout(1500);
  const r = await page.evaluate(async () => {
    const B = window.BRADY, G = B.Game, T = window.BRADY_TOUR.Tour; G.frame = function () {};
    const seen = {}, out = {};
    const C = document.createElement('canvas'); C.width = 1100; C.height = 800; const c = C.getContext('2d', { willReadFrequently: true });
    for (const id of T.allLevelIds()) {
      const [w, i] = id.split('-').map(Number); let lv; try { lv = B.getLevel(w, i); } catch (e) { continue; }
      const k = (lv.areas || []).findIndex(a => a.spawns.some(s => s.type === 'boss'));
      if (k < 0) continue;
      const sp = lv.areas[k].spawns.find(s => s.type === 'boss'); if (seen[sp.style]) continue; seen[sp.style] = 1;
      const g = new B.Play(lv, {}); G.setScene(g); g.state = 'play';
      if (g.area.idx !== k) { const a = lv.areas[k], an = (a.anchors && (a.anchors.in || a.anchors.start)) || { x: 112, y: (a.H - 4) * 32 }; g.loadArea(k, an.x, an.y, 1); }
      const bo = g.entities.find(e => e.boss); if (!bo) continue;
      const p = g.player; p.hurt = () => {}; p.die = () => {};
      p.x = (bo.arenaX0 || bo.x - 300) + 64; p.y = bo.floorY - p.h - 2;
      const ext = { l: -1e9, r: -1e9, t: -1e9, b: -1e9, n: 0 };
      let rnd = 1; Math.random = () => { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647; };
      for (let step = 0; step < 60 * 40; step++) {
        const inp = { right: step % 240 < 120, left: step % 240 >= 120, jump: step % 50 < 10 };
        Object.assign(B.Input, inp);
        try { g.update(1 / 60); } catch (e) { break; }
        if (G.scene !== g) break;
        if (step === 60 * 20) { bo.hp = Math.max(0.5, bo.maxHp * 0.3); if (bo.brain.phases && bo.brain.phase) { let n2 = bo.phase || 1; for (let q = 0; q < bo.brain.phases.length; q++) if (bo.hp <= bo.brain.phases[q] + 0.01) n2 = Math.max(n2, q + 2); if (n2 > (bo.phase || 1)) { bo.phase = n2; try { bo.brain.phase(bo, n2); } catch (e) {} } } }
        if (bo.state === 'dying' || bo.remove) { bo.state = 'fight'; bo.remove = false; bo.hp = 1; }
        if (step % 15) continue;
        // render the art only, about the box, at 1 px per logical px
        const S = 1, ox = 550 - (bo.x + bo.w / 2), oy = 520 - (bo.y + bo.h);
        c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, C.width, C.height); c.setTransform(S, 0, 0, S, ox, oy);
        try { if (bo.brain.draw) bo.brain.draw(bo, c, bo.t); else B.BossArt ? B.BossArt.draw(c, bo, bo.t) : 0; } catch (e) { continue; }
        const u = new Uint32Array(c.getImageData(0, 0, C.width, C.height).data.buffer), W = C.width; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
        for (let yy = 0; yy < C.height; yy++) { const o = yy * W; let any = false; for (let xx = 0; xx < W; xx++) { if ((u[o + xx] >>> 24) > 24) { any = true; if (xx < x0) x0 = xx; break; } } if (!any) continue; if (yy < y0) y0 = yy; y1 = yy; for (let xx = W - 1; xx > x1; xx--) if ((u[o + xx] >>> 24) > 24) { x1 = xx; break; } }
        if (x1 < 0) continue;
        const bx0 = bo.x + ox, by0 = bo.y + oy;
        ext.l = Math.max(ext.l, bx0 - x0); ext.r = Math.max(ext.r, x1 - (bx0 + bo.w)); ext.t = Math.max(ext.t, by0 - y0); ext.b = Math.max(ext.b, y1 - (by0 + bo.h)); ext.n++;
        if (x0 === 0 || y0 === 0 || x1 === C.width - 1 || y1 === C.height - 1) ext.clip = true;
      }
      out[sp.style] = Object.assign(ext, { id, w: bo.w, h: bo.h, oldPad: Math.max(60, bo.w) });
    }
    return out;
  });
  for (const k in r) console.log(k.padEnd(12), JSON.stringify(r[k]));
  await b.close();
})();
