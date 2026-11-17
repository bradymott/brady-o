// Screenshots of the secret rooms (docs/design/SECRET_ROOMS.md) in the real game, each kind caught in action.
// usage: BRADY_DIST=<dist> node tools/sbw_rooms_shots.js <shotsDir> [levelId/areaId ...] [--portrait] [--all]
//   default: one room of every kind (the first found in route order); --all: every room; --portrait: 402x874
// Silent (tools/sbw_silent.js); full resolution pinned before every capture.
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const argv = process.argv.slice(2), flags = argv.filter(a => a.startsWith('--')), want = argv.slice(1).filter(a => !a.startsWith('--'));
const out = path.resolve(argv[0] || 'shots/rooms');
fs.mkdirSync(out, { recursive: true });
const portrait = flags.includes('--portrait'), all = flags.includes('--all');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = path.join(dist, 'site', 'super-brady-o-world', 'index.html');

(async () => {
  const browser = await chromium.launch();
  const vp = portrait ? { width: 402, height: 874 } : { width: 874, height: 402 };
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await silence(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + appPage);
  await page.waitForTimeout(1500);
  const list = await page.evaluate(([want, all]) => {
    const B = window.BRADY, T = window.BRADY_TOUR, seen = {}, L = [];
    for (const id of T.Tour.allLevelIds()) {
      const [w, i] = id.split('-').map(Number), lvl = B.getLevel(w, i);
      lvl.areas.forEach((A, k) => {
        if (!A.roomKit) return;
        const key = id + '/' + A.aid;
        if (want.length ? want.includes(key) : (all || !seen[A.roomKit.kind])) { L.push({ id, k, aid: A.aid, kind: A.roomKit.kind }); seen[A.roomKit.kind] = 1; }
      });
    }
    return L;
  }, [want, all]);
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  for (const r of list) {
    const info = await page.evaluate(r => {
      const B = window.BRADY, G = B.Game, I = B.Input;
      const sim = (sec, inp) => { for (let k = 0, n = Math.round(sec * 120); k < n; k++) { if (inp) Object.assign(I, inp); G.scene.update(1 / 120); I.jumpPressed = I.upPressed = I.downPressed = I.actionPressed = false; } if (inp) for (const key in inp) I[key] = false; };
      const [w, i] = r.id.split('-').map(Number);
      B.Save.data.lives = 9;
      const g = new B.Play(B.getLevel(w, i), { power: 1 }); G.setScene(g); sim(1.8);
      const A0 = g.level.areas[r.k], an = A0.anchors.in || A0.anchors.start;
      g.loadArea(r.k, an.x, an.y, 1); g.player.invuln = 999; g.state = 'play';
      const A = g.area, R = A.roomState, p = g.player, kit = A.roomKit;
      const at = (tx, ty) => { p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; };
      const mid = Math.floor(A.W / 2);
      const S = {
        ambush: () => { at(mid, 10); sim(2.4); },
        bigone: () => { at(mid - 5, 10); sim(2.2); },
        rush: () => { at(mid - 6, 10); sim(4); },
        fetch: () => { const k0 = g.entities.find(e => e.s && /^ing:/.test(e.id || '')); if (k0) k0.touchPlayer(p); at(mid - 3, 10); sim(0.5); },
        lamps: () => { const L = g.entities.filter(e => e.constructor.name === 'TourRoomLamp').sort((a, b) => a.ord - b.ord); for (const e of L.slice(0, 2)) { at(Math.floor(e.cx / 32), Math.floor((e.y + e.h - 1) / 32)); sim(0.3); } at(mid - 2, 10); sim(0.3); },
        whack: () => { at(mid, 10); sim(4.5); },
        shell: () => { at(kit.data.slots[1] - 2, kit.data.row); for (let k = 0; k < 2000 && R.phase !== 'shuffle'; k++) sim(1 / 120); sim(0.2); },
        prank: () => { const ch = g.entities.find(e => e.constructor.name === 'TourRoomChest'); at(Math.floor(ch.cx / 32) - 3, 10); sim(0.2); ch.touchPlayer(p); sim(0.35); },
        closing: () => { at(mid, 10); sim(kit.data.t * 0.6 + 1.5); },
        gauntlet: () => { at(Math.floor(A.W * 0.35), 10); sim(0.4); },
        climb: () => { at(10, Math.floor(A.H * 0.45)); sim(0.4); },
        grotto: () => { at(mid, 9); sim(0.6); },
        lantern: () => { at(Math.floor(A.W * 0.3), 7); sim(1.5); },
        doors: () => { at(6, 10); sim(0.3); },
        pick: () => { at(mid - 2, 10); sim(0.3); },
        wormhole: () => { at(A.W - 8, 10); sim(0.4); },
        bouncy: () => { const [tx, ty] = kit.data.towers[1]; at(tx + 1, ty - 1); sim(0.25); },
        floaty: () => { at(mid, 10); sim(0.2); sim(0.35, { jump: true, jumpPressed: true }); }
      };
      try { (S[kit.kind] || (() => sim(0.5)))(); } catch (e) { return { err: String(e && e.stack || e) }; }
      g.update = function () {};
      g.camX = Math.max(0, Math.min(A.W * 32 - G.viewW, p.cx - G.viewW * 0.42)); g.camY = g.camTargetY(true);
      if (kit.kind === 'climb' || kit.kind === 'lamps') g.bannerT = 0;
      return { title: kit.title, W: A.W, H: A.H };
    }, r);
    await pin(); await page.waitForTimeout(300);
    const file = `room-${r.kind}-${r.id}-${r.aid}${portrait ? '-portrait' : ''}.png`;
    await page.screenshot({ path: path.join(out, file) });
    console.log(file, JSON.stringify(info));
  }
  if (errors.length) console.log('ERRORS', errors.slice(0, 10));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
