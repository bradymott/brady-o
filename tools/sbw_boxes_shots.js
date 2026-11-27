// Every land's own prize box (src/29_tour_zz_boxes.js): pictures and checks in the real game.
//   boxes-sheet.png        all 22 lands x 3 states (closed, mid-hit, empty) at 4x, on a mid backdrop
//   boxes-hits.png         every land's 8 hit frames at 2x (the opening action, HIT seconds)
//   <nn>-<land>.png        one phone screenshot (844x390) per land: a real level, a box Brady has just hit (empty)
//                          next to a closed one, Brady in front
// Checks (also with --checks, which skips the pictures): every land resolves to a box with 4 idle frames, 8 hit
// frames and an empty state, all painted (not blank), closed and empty different; in every land a real box is hit
// from below by Brady's own jump through the game loop, gives its prize (an item comes out, or a coin is counted),
// turns USED, plays the hit frames and then draws as the land's empty box. Zero page errors.
// usage: BRADY_DIST=<dist> node tools/sbw_boxes_shots.js <outdir> [--checks] [land ...]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = 'file://' + path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const args = process.argv.slice(2), out = path.resolve(args[0] || 'boxes-shots'), checksOnly = args.includes('--checks');
const want = args.slice(1).filter(a => !a.startsWith('--'));
fs.mkdirSync(out, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 500) : '')); if (!ok) failures++; };
const save = (name, dataUrl) => fs.writeFileSync(path.join(out, name), Buffer.from(dataUrl.split(',')[1], 'base64'));

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
    { const PU = B.Play.prototype, upd = PU.update; PU.update = function (dt) { if (window.__simOn) return upd.call(this, dt); }; }
    window.sim = (sec, inp) => {
      const G = B.Game, I = B.Input, steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, typeof inp === 'function' ? inp(k) : inp); if (k > 0 && typeof inp !== 'function') { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; } }
        window.__simOn = true; try { G.scene.update(1 / 120); } finally { window.__simOn = false; }
        I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null;
      }
      for (const key of ['left', 'right', 'up', 'down', 'jump', 'action']) I[key] = false;
    };
    window.fresh = () => { const d = B.Save.data; for (const k of ['done', 'unlocked', 'exits', 'secretExits', 'gold', 'best']) d[k] = {}; d.unlocked['1-1'] = true; d.tour = null; d.lives = 9; d.seenTourIntro = true; d.tips = Object.assign(d.tips || {}, { box: true }); };
    window.play = (id) => { const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9; const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); sim(2.0); g.state = 'play'; g.player.invuln = 999; return g; };
    const solid = t => B.SOLID[t] || t === B.T.SEMI;
    // boxes to hit (a floor 2..6 tiles under them, clear air between) each with the nearest other closed box, best
    // first: a pair close enough to share the phone screen, an item rather than a coin box
    window.findBoxes = (world) => {
      const cands = [], T = B.T;
      for (let i = 1; i <= 8; i++) {
        let L; try { L = B.getLevel(world, i); } catch (e) { break; } if (!L) break;
        const A = L.areas[0], all = [], boxes = [];
        for (let y = 1; y < A.H - 1; y++) for (let x = 1; x < A.W - 1; x++) {
          if (A.tiles[y * A.W + x] !== T.QBLOCK || (A.hide && A.hide[y * A.W + x]) || A.contents[x + ',' + y] === 'pupo') continue;   // (Pupo's nap boxes have their own look)
          all.push({ x, y });
          let fy = -1; for (let yy = y + 2; yy <= Math.min(A.H - 1, y + 6); yy++) { const t = A.tiles[yy * A.W + x]; if (solid(t)) { fy = yy; break; } }
          if (fy < 0) continue;
          let clear = true; for (let yy = y + 1; yy < fy; yy++) { const t = A.tiles[yy * A.W + x]; if (solid(t) || t === T.LAVA || t === T.SPIKES || t === T.WATER) clear = false; }
          if (!clear || A.tiles[fy * A.W + x] === T.SPIKES || A.tiles[fy * A.W + x] === T.LAVA) continue;
          boxes.push({ x, y, fy, it: A.contents[x + ',' + y] || 'pick' });
        }
        for (const a of boxes) {
          let other = null; for (const b of all) if (b.x !== a.x || b.y !== a.y) { const d = Math.abs(a.x - b.x); if (d <= 16 && Math.abs(a.y - b.y) <= 6 && (!other || d < Math.abs(a.x - other.x))) other = b; }
          cands.push({ sc: (other ? 0 : 50) + (a.it === 'picks' ? 5 : 0) + (other ? Math.abs(a.x - other.x) * 0.1 : 0) + i * 0.01, level: world + '-' + i, hit: a, other });
        }
      }
      return cands.sort((p, q) => p.sc - q.sc).slice(0, 6);
    };
  });
  const pin = () => page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); });
  const ev = (f, a) => page.evaluate(f, a);

  /* ---------- every land resolves to a box with three states ---------- */
  const lands = await ev(() => {
    const B = window.BRADY, BX = window.BRADY_BOXES, out = [];
    const TOUR = B.WORLDS, seen = {};
    for (const w of Object.keys(TOUR)) { const W = TOUR[w]; if (W && W.tour && !seen[W.tour]) { seen[W.tour] = 1; out.push({ id: W.tour, world: +w, name: W.name }); } }
    const blank = cv => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n / (cv.width * cv.height); };
    const diff = (a, b) => { const x = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, y = b.getContext('2d').getImageData(0, 0, b.width, b.height).data; let n = 0; for (let i = 0; i < x.length; i += 4) if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 60) n++; return n / (x.length / 4); };
    for (const L of out) {
      const s = BX && BX.set(L.id, 2);
      L.has = !!(s && BX.has(L.id));
      if (!s) continue;
      L.n = [s.closed.length, s.hit.length, s.empty ? 1 : 0];
      L.fill = Math.round(Math.min(...s.closed.map(blank), blank(s.empty)) * 100);
      L.diff = Math.round(diff(s.closed[0], s.empty) * 100);
    }
    return out;
  });
  check(`22 lands in the game (${lands.length})`, lands.length >= 22, lands.map(l => l.id));   // (>=: the hidden lands of the road to 200 add their own)
  for (const L of lands) check(`${L.name}: its own box, 4 idle + 8 hit frames + empty, painted, empty differs from closed`, L.has && L.n && L.n.join() === '4,8,1' && L.fill >= 25 && L.diff >= 10, L);

  /* ---------- the contact sheets ---------- */
  if (!checksOnly && !want.length && lands.some(l => l.has)) {
    const sheets = await ev(() => {
      const BX = window.BRADY_BOXES, B = window.BRADY, ids = Object.keys(BX.LANDS), S = 4;
      const cell = (32 + 20) * S, rowH = (32 + 28) * S + 34, labW = 210, colW = cell + 16, half = Math.ceil(ids.length / 2);
      const c = document.createElement('canvas'); c.width = 2 * (labW + 3 * colW) + 30; c.height = half * rowH + 60; const x = c.getContext('2d');
      x.fillStyle = '#5b6b86'; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = '#fff'; x.font = 'bold 26px sans-serif'; x.fillText('Prize boxes: closed (idle frame 1) · hit (halfway) · empty', 16, 36);
      ids.forEach((id, n) => {
        const col = n < half ? 0 : 1, row = n % half, ox = col * (labW + 3 * colW + 30), oy = 60 + row * rowH;
        x.fillStyle = row % 2 ? '#64758f' : '#56657f'; x.fillRect(ox, oy, labW + 3 * colW, rowH);
        x.fillStyle = '#fff'; x.font = 'bold 22px sans-serif'; x.fillText(BX.LANDS[id].name, ox + 10, oy + rowH / 2);
        const s = BX.set(id, S);
        const place = (img, k, pad) => { const cx = ox + labW + k * colW; x.drawImage(img, cx + (cell - img.width) / 2, oy + 8 + (22 - pad[1]) * S); };
        place(s.closed[0], 0, [6, 6]); place(s.hit[3], 1, BX.PAD_H); place(s.empty, 2, [6, 6]);
        // the tile square the box occupies, for scale
        x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 1; for (let k = 0; k < 3; k++) x.strokeRect(ox + labW + k * colW + (cell - 32 * S) / 2, oy + 8 + 22 * S, 32 * S, 32 * S);
      });
      const S2 = 2, w2 = (32 + 20) * S2, h2 = (32 + 28) * S2;
      const d = document.createElement('canvas'); d.width = 200 + 13 * (w2 + 6); d.height = 40 + ids.length * (h2 + 6); const y = d.getContext('2d');
      y.fillStyle = '#5b6b86'; y.fillRect(0, 0, d.width, d.height); y.fillStyle = '#fff'; y.font = 'bold 18px sans-serif'; y.fillText('closed x4 idle frames · 8 hit frames (' + BX.HIT + ' s) · empty', 10, 26);
      ids.forEach((id, n) => {
        const s = BX.set(id, S2), oy = 40 + n * (h2 + 6);
        y.fillStyle = '#fff'; y.font = 'bold 15px sans-serif'; y.fillText(BX.LANDS[id].name, 8, oy + h2 / 2);
        const imgs = [...s.closed, ...s.hit, s.empty];
        imgs.forEach((im, k) => { const pt = (k >= 4 && k < 12) ? 22 : 6; y.drawImage(im, 200 + k * (w2 + 6) + (w2 - im.width) / 2, oy + (22 - pt) * S2); });
      });
      return [c.toDataURL('image/png'), d.toDataURL('image/png')];
    });
    save('boxes-sheet.png', sheets[0]); save('boxes-hits.png', sheets[1]);
  }

  /* ---------- in every land: hit a real box from below, prize, empty; a phone shot ---------- */
  let n = 0;
  for (const L of lands) {
    n++;
    if (want.length && !want.includes(L.id)) continue;
    await pin();
    const r = await ev((L) => {
      const B = window.BRADY, T = B.T, BX = window.BRADY_BOXES || { stats: { hits: 0, overlay: 0 }, live: () => [], set: () => ({}), landOf: () => null };   // (a build without the boxes: 'before' shots)
      fresh();
      const list = findBoxes(L.world);
      for (const f of list) {
      const g = play(f.level), p = P(), A = g.area, b = f.hit;
      // Brady stands on the floor under the box and jumps (the real jump, through the game loop)
      p.x = b.x * 32 + 16 - p.w / 2; p.y = f.hit.fy * 32 - p.h; p.vx = p.vy = 0; p.ride = null;
      g.camX = Math.max(0, Math.min(A.W * 32 - B.Game.viewW, p.cx - B.Game.viewW * 0.45)); g.camY = g.camTargetY(true);
      sim(0.15);
      const items0 = g.entities.filter(e => e.item && !e.remove).length, picks0 = g.picks || 0, built0 = BX.stats.hits;
      let tileAfter = null, hitAt = -1, hitDrawn = 0;
      for (let k = 0; k < 120 && hitAt < 0; k++) { sim(1 / 120, k < 40 ? { jump: true, jumpPressed: k === 0 } : null); if (A.tiles[b.y * A.W + b.x] !== T.QBLOCK) hitAt = k; }
      tileAfter = A.tiles[b.y * A.W + b.x];
      const live = (BX.live(g) || []).length;
      // draw a frame during the hit: the hit frames are used
      g.draw(B.Game.ctx); hitDrawn = BX.stats.hits - built0;
      const items1 = g.entities.filter(e => e.item && !e.remove).length, picks1 = g.picks || 0;
      sim(0.5);
      const ov0 = BX.stats.overlay; g.draw(B.Game.ctx);
      // after the hit: still USED, drawn from the land's overlay atlas (the empty box)
      const s = BX.set(L.id, B.Game.S), atlas = (() => { BX.cur = L.id; try { return B.TileArt.get(g.themeKey, B.Game.S); } finally { BX.cur = null; } })();
      const res = { level: f.level, box: [b.x, b.y], it: b.it, other: f.other && [f.other.x, f.other.y], hitAt, used: tileAfter === T.USED, stillUsed: A.tiles[b.y * A.W + b.x] === T.USED, live, hitDrawn,
        prize: items1 > items0 || picks1 > picks0 || g.entities.some(e => !e.remove && /Pop|Item/.test(e.constructor.name)), items: [items0, items1], picks: [picks0, picks1],
        overlay: BX.stats.overlay > ov0, emptyIsLand: atlas.used === s.empty && atlas.qblock === s.closed, land: BX.landOf(g) };
      if (hitAt >= 0 || f === list[list.length - 1]) return res;   // (a level where the jump cannot reach, e.g. on a scooter: the next box)
      }
      return { none: true };
    }, L);
    check(`${L.name}: a real box hit from below gives its prize, turns empty, plays the hit frames, draws as ${L.id}'s empty box`, !r.none && r.hitAt >= 0 && r.used && r.stillUsed && r.prize && r.live === 1 && r.hitDrawn >= 1 && r.overlay && r.emptyIsLand && r.land === L.id, r);
    if (checksOnly || r.none) continue;
    // the phone shot: Brady in front of the empty box and the closed one
    await ev((r) => {
      const B = window.BRADY, g = S(), p = P(), A = g.area, [bx] = r.box; let ox = r.other ? r.other[0] : bx;
      // a land whose levels put one box per screen (no closed box within 16 tiles of a hittable one): for the picture
      // only, a closed box of the same land is set 4 tiles along the same row (the level itself is not changed)
      if (!r.other) { const y = r.box[1]; for (const d of [4, -4, 5, -5, 3, -3]) { const x = bx + d; if (A.tiles[y * A.W + x] === B.T.EMPTY) { A.tiles[y * A.W + x] = B.T.QBLOCK; ox = x; r.staged = true; break; } } }
      const mid = (bx + ox) / 2, stand = bx < ox ? bx - 1 : bx + 1;
      // the floor under the empty box, one tile to the side
      let fy = -1; for (let y = r.box[1] + 2; y < A.H; y++) { const t = A.tiles[y * A.W + stand]; if (B.SOLID[t] || t === B.T.SEMI) { fy = y; break; } }
      for (const e of g.entities) { if (e.item && !e.remove) e.remove = true; if (typeof e.drawBubble === 'function' && 'text' in e) e.drawBubble = () => {}; }   // (no hint bubbles over the boxes)
      if (fy > 0) { p.x = stand * 32 + 16 - p.w / 2; p.y = fy * 32 - p.h; } p.vx = p.vy = 0; p.facing = ox >= bx ? 1 : -1;
      sim(0.25);
      g.camX = Math.max(0, Math.min(A.W * 32 - B.Game.viewW, mid * 32 + 16 - B.Game.viewW * 0.5)); g.camY = g.camTargetY(true);
      g.player.invuln = 0;
      return !!r.staged;
    }, r).then(st => { if (st) console.log('NOTE ' + L.name + ': picture staged (the closed box beside the hit one is added for the picture only)'); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(out, String(n).padStart(2, '0') + '-' + L.id + '.png') });
  }
  check('no page errors', !errors.length, errors.slice(0, 5));
  await browser.close();
  console.log(failures ? `FAILED ${failures}` : 'ALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
