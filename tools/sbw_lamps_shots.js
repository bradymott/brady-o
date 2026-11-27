// The Light-the-Lamps secret rooms (kind 'lamps', src/28_tour_ra_kinds.js) played in the real game in a browser with
// real inputs (Input flags, 120 Hz steps of the real Play scene): Brady goes in through the room's door (UP), walks
// into each lamp in the order the picture shows (he is set down next to each lamp's shelf; the climb itself is the
// checker's), then walks over toward the prize cage, which must be open.
// usage: BRADY_DIST=<dist> node tools/sbw_lamps_shots.js <outdir> [levelId ...]   (default 5-3 7-4: the two whose last lamp, in some JS engines' shuffle, is far from the cage)
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'lamps-shots');
const ids = args.slice(1).length ? args.slice(1) : ['5-3', '7-4'];
fs.mkdirSync(out, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 400) : '')); if (!ok) failures++; };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await silence(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(appPage);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const B = window.BRADY;
    window.S = () => B.Game.scene; window.P = () => B.Game.scene.player;
    window.sim = (sec, inp) => {
      const G = B.Game, I = B.Input, steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (k > 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; } }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; }
      }
      if (inp) for (const key in inp) if (typeof inp[key] === 'boolean') I[key] = false;
    };
    window.until = (cond, sec, inp) => { const n = Math.round(sec * 120); for (let k = 0; k < n; k++) { if (cond()) return true; sim(1 / 120, inp); } return !!cond(); };
    window.place = (tx, ty) => { const g = S(), p = P(); p.x = tx * 32 + 16 - p.w / 2; p.y = (ty + 1) * 32 - p.h; p.vx = p.vy = 0; p.ride = null; g.camX = Math.max(0, Math.min(g.area.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true); };
    window.walkTo = (x, sec) => { until(() => Math.abs(P().cx - x) < 6, sec || 4, P().cx < x ? { right: true } : { left: true }); until(() => Math.abs(P().vx) < 5, 1); return Math.abs(P().cx - x) < 12; };
    window.ents = name => S().entities.filter(e => e.constructor.name === name && !e.remove);
  });
  for (const id of ids) {
    const r = await page.evaluate((id) => {
      const B = window.BRADY, [w, i] = id.split('-').map(Number);
      B.Save.data.lives = 9;
      const lvl = B.getLevel(w, i), k = lvl.areas.findIndex(a => a.roomKit && a.roomKit.kind === 'lamps');
      const g = new B.Play(lvl, {}); B.Game.setScene(g); sim(1.6);
      // the entrance: the door elsewhere that leads into the room; Brady stands at it and presses UP
      let j = -1, s = null;
      for (let q = 0; q < lvl.areas.length && !s; q++) if (q !== k) { s = lvl.areas[q].spawns.find(s2 => s2.target && s2.target.area === k); j = q; }
      g.loadArea(j, s.x, s.y - 1); sim(0.3);
      place(Math.floor(s.x / 32), Math.floor((s.y - 1) / 32)); sim(0.1);
      sim(0.05, { up: true, upPressed: true });
      until(() => S().area.idx === k && S().state === 'play' && !(S().fade.a > 0.05), 4);
      return { k, area: S().area.idx, aid: S().area.aid };
    }, id);
    check(id + ' lamps room: in through its door (UP)', r.area === r.k, r);
    if (r.area !== r.k) continue;
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(out, id + '-1-room.png') });
    const lit = await page.evaluate(() => {
      const L = ents('TourRoomLamp').sort((a, b) => a.ord - b.ord), R = S().area.roomState, log = [];
      for (const e of L) {
        const row = Math.floor((e.y + e.h - 1) / 32), col = Math.floor(e.cx / 32);
        place(col - 2, row); sim(0.2);
        walkTo(e.cx, 3); sim(0.3);
        log.push({ ord: e.ord, col, row, lit: e.lit, next: R.next });
      }
      return { log, won: !!R.won };
    });
    check(id + ' lamps: every lamp lights in the picture\'s order and the game is won', lit.won && lit.log.every(l => l.lit), lit);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(out, id + '-2-won.png') });
    const c = await page.evaluate(() => {
      const cage = ents('TourRoomCage')[0], g = S();
      const before = cage.open;
      // the prize: walk right toward the cage (real input) until he is beside the gate in front of it
      const ok = until(() => cage.cx - P().cx < 6 * 32, 8, { right: true }) && (sim(0.6), true);
      return { before, walked: ok, open: !!cage.open, empty: cage.tiles.every(([x, y]) => g.area.tiles[y * g.area.W + x] === window.BRADY.T.EMPTY), bx: Math.round(P().cx / 32), cx: Math.round(cage.x / 32) };
    });
    check(id + ' lamps: Brady walks to the prize and the cage is open', c.walked && c.open && c.empty, c);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(out, id + '-3-cage.png') });
  }
  check('no page errors', errors.length === 0, errors.slice(0, 5));
  await browser.close();
  console.log(failures ? failures + ' failed' : 'all passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
