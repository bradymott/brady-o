// Antarctica and World 22 (worlds 13 and 22, v2 levels): their mechanics run in the real game, not just in the validator.
// usage: BRADY_DIST=<dist> node tools/levels_aq_w22_test.js [shotsDir]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const shots = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'aq-w22'));
fs.mkdirSync(shots, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) failures++; };
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + appPage);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    window.sim = (sec, inp) => {
      const B = window.BRADY, G = B.Game, I = B.Input; const steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (inp.jumpPressed && k > 0) I.jumpPressed = false; if (inp.actionPressed && k > 0) I.actionPressed = false; if (inp.upPressed && k > 0) I.upPressed = false; }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) I[key] = false;
    };
    window.S = () => window.BRADY.Game.scene; window.P = () => window.BRADY.Game.scene.player;
    window.start = id => { const B = window.BRADY; B.Save.data.lives = 9; const [w, i] = id.split('-').map(Number); B.Game.setScene(new B.Play(B.getLevel(w, i), {})); sim(1.5); const g = S(); g.state = 'play'; if (g.introT != null) g.introT = 0; P().invuln = 999; return g; };
    window.ents = name => S().entities.filter(e => e.constructor.name === name && !e.remove);
    window.put = (x, y) => { const p = P(); p.x = x - p.w / 2; p.y = y - p.h; p.vx = p.vy = 0; };
  });
  const shot = async name => { await page.evaluate(() => { const G = window.BRADY.Game; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize(); const g = S(); g._u = g.update; g.update = () => {}; }); await page.waitForTimeout(300); await page.screenshot({ path: path.join(shots, name) }); await page.evaluate(() => { const g = S(); g.update = g._u; }); };

  // 13-1: a conga line follows its scarfed leader; stomp the leader and the line scatters
  let r = await page.evaluate(() => {
    const g = start('13-1'), p = P(); const L = g.entities.find(e => e.behavior === 'aqConga'); put(L.cx - 200, L.y + L.h); sim(0.4);
    const fol = L.followers.length, spread = Math.round(Math.max(...L.followers.map(f => Math.abs(f.cx - L.cx))));
    p.x = L.cx - p.w / 2; p.y = L.y - p.h - 4; p.vy = 4 * 32; p.prevBottom = p.y + p.h; sim(0.1); sim(1.2);
    return { fol, spread, leader: !!(L.dead || L.remove), scattered: L.followers.every(f => f.scatter || f.remove) };
  });
  check('13-1: a penguin conga line trails its leader, and stomping the leader scatters it', r.fol >= 3 && r.spread > 60 && r.leader && r.scattered, r);
  // 13-1: the snowball grows as it rolls and smashes the snow wall; a lost ball is replaced
  r = await page.evaluate(() => {
    const g = start('13-1'), p = P(); const pile = ents('AqSnowPile')[0]; put(pile.cx - 100, pile.y + pile.h); sim(1.5);
    const ball = pile.ball, wall = g.entities.filter(e => e.breakWall).sort((a, b) => a.x - b.x)[0];
    put(ball.x - 40, ball.y + ball.h); let t = 0; for (; t < 12 && !wall.remove; t += 0.1) { if (Math.abs(pile.ball.vx) < 20) sim(0.1, { right: true }); else sim(0.1); }
    const smashed = !!wall.remove, scale = +pile.ball.scale.toFixed(2);
    pile.ball.remove = true; sim(1.6);
    return { smashed, t: +t.toFixed(1), scale, replaced: !!(pile.ball && !pile.ball.remove) };
  });
  check('13-1: kicked along, the snowball grows and smashes a snow wall; a lost one is replaced at the heap', r.smashed && r.scale > 1.3 && r.replaced, r);
  // 13-2: walk into an aurora band: up the sky, along it, out the far side
  r = await page.evaluate(() => {
    const g = start('13-2'), p = P(); const b0 = ents('TourFlipLine').sort((a, b) => a.x - b.x)[0];
    put(b0.x - 3 * 32, 6 * 32); sim(1.2);
    let minY = 1e9; for (let k = 0; k < 60; k++) { sim(0.05, { right: true }); if (p.cx > b0.x + 32 && p.cx < b0.x + b0.w - 32) minY = Math.min(minY, p.y); }
    return { minRow: +(minY / 32).toFixed(1), past: p.cx > b0.x + b0.w, alive: !p.dead };
  });
  check('13-2: inside the aurora gravity turns over and Brady runs along the sky to the far side', r.minRow < 3 && r.past && r.alive, r);
  await page.evaluate(() => { const g = start('13-2'); const b0 = ents('TourFlipLine').sort((a, b) => a.x - b.x)[1]; put(b0.x + 5 * 32, 3 * 32); sim(0.6, { right: true }); });
  await shot('13-2-aurora.png');
  // 13-5: the egg: picked up at the nest, snatched back by a skua, delivered at the rookery (the gate's lock opens)
  r = await page.evaluate(() => {
    const g = start('13-5'), p = P(); const peds = ents('TourPedestal').sort((a, b) => a.x - b.x), st = peds[0];
    put(st.cx, st.y + st.h); sim(0.2); const carrying = !!p.carrying;
    ents('AqEggSkua')[0].touchPlayer(p); sim(0.1); const snatched = !p.carrying;
    const last = peds[peds.length - 1]; p.carrying = { item: 'aqEgg', from: st, fallY: p.y }; put(last.cx, last.y + last.h); sim(1.2);
    const lock = (g.area.locks || []).find(l => l.id === 'deliver');
    return { carrying, snatched, delivered: !!last.done, open: !!lock && lock.tiles.every(([x, y]) => g.area.tiles[y * g.area.W + x] === 0) };
  });
  check('13-5: Brady carries the egg; a skua snatches it back to its nest; delivered, the rookery gate opens', r.carrying && r.snatched && r.delivered && r.open, r);
  // 22-1: strike the station clock: 2:22 becomes 22:22, the theme and the slabs swap
  r = await page.evaluate(() => {
    const g = start('22-1'), p = P(); const sw = ents('TourToggleSwitch')[0]; put(sw.cx, sw.y + sw.h); sim(0.2);
    const slabs = ents('W22Slab'), before = slabs.map(s => s.solid), t0 = g.themeKey;
    sim(0.05, { upPressed: true }); sim(0.3);
    const ns = slabs.find(s => s.night); p.x = ns.x + 4; p.y = ns.y - p.h - 2; p.vy = 0; sim(0.6);
    return { night: !!g.area.night, themes: [t0, g.themeKey], swapped: slabs.every((s, k) => s.solid !== before[k]), standsOnLate: p.onGround && Math.abs(p.y + p.h - ns.y) < 3 };
  });
  check('22-1: striking the clock turns 2:22 into 22:22: the station, its theme and its slabs swap', r.night && r.themes[1] === 'w22_2222' && r.swapped && r.standsOnLate, r);
  await shot('22-1-2222.png');
  // 22-2: the loop room sends Brady back; door 22 leads behind it
  r = await page.evaluate(() => {
    const g = start('22-2'), p = P(); const loop = ents('W22Loop')[0]; put(loop.cx - 60, loop.floorY); sim(0.2); const x0 = p.x;
    sim(0.6, { right: true }); const looped = loop.loops > 0;
    const d = g.entities.find(e => e.s && e.s.look === 'w22Door22'); put(d.cx, d.y + d.h); sim(0.2); sim(0.05, { upPressed: true }); sim(1.5);
    return { looped, behind: g.area.aid };
  });
  check('22-2: the loop room sends Brady back down the same corridor; door 22 opens on the room behind it', r.looped && r.behind === 'beyond', r);
  // 22-3: played right to left; fall through the walkway, walk the reflection upside down, take the reflection's door
  r = await page.evaluate(() => {
    const g = start('22-3'), p = P(), A = g.area; const startRight = p.cx > A.W * 16;
    const z = A.zones.filter(z => z.kind === 'flip').sort((a, b) => b.x - a.x)[0], gy = Math.round(z.y / 32) - 1;
    let hx = -1; for (let x = Math.floor((z.x + z.w) / 32) - 1; x > z.x / 32; x--) if (A.tiles[gy * A.W + x] === 0) { hx = x; break; }
    put((hx + 0.5) * 32 + 16, (gy - 1) * 32); sim(0.2);
    let wasFlipped = false; for (let k = 0; k < 30; k++) { sim(0.05, { left: true }); if (p.flipped) wasFlipped = true; }
    const under = p.flipped && p.onGround && p.y < (gy + 3) * 32;
    const door = ents('W22ReflectDoor')[0]; p.x = door.cx - p.w / 2; p.y = door.y; p.vy = 0; sim(0.3); sim(0.05, { upPressed: true }); sim(1.5);
    return { startRight, wasFlipped, under, room: g.area.aid };
  });
  check('22-3: Mirror Lake runs right to left; through the walkway Brady walks upside down and the reflection\'s door leads under the lake', r.startRight && r.wasFlipped && r.under && r.room === 'under', r);
  await page.evaluate(() => { const g = start('22-3'), A = g.area; const z = A.zones.filter(z => z.kind === 'flip').sort((a, b) => b.x - a.x)[0]; const p = P(); p.x = z.x + z.w / 2; p.y = z.y + 2; p.vy = 0; sim(0.8, { left: true }); });
  await shot('22-3-reflection.png');
  // 22-5: an envelope sticks to Brady and lowers his jump; a typewriter key clacks and bounces him
  r = await page.evaluate(() => {
    const g = start('22-5'), p = P();
    const jump = () => { const y0 = p.y; let top = p.y; sim(0.05, { jump: true, jumpPressed: true }); for (let k = 0; k < 40; k++) { sim(0.025, { jump: true }); top = Math.min(top, p.y); } sim(1); return y0 - top; };
    put(8 * 32, 3 * 32); sim(1.5); const h0 = jump();
    const env = ents('W22Envelope')[0]; env.touchPlayer(p); const stuck = p.mailT > 0; const h1 = jump();
    const key = ents('W22Key')[0]; p.mailT = 0; put(key.cx, key.y); let minY = p.y; for (let k = 0; k < 70; k++) { sim(0.05); minY = Math.min(minY, p.y); }
    return { stuck, h0: Math.round(h0), h1: Math.round(h1), bounce: Math.round(key.y - p.h - minY) };
  });
  check('22-5: a stuck envelope lowers Brady\'s jump; a typewriter key clacks and bounces him up', r.stuck && r.h1 < r.h0 * 0.9 && r.bounce > 40, r);

  check('no page errors', errors.length === 0, errors.slice(0, 5));
  console.log(failures ? `${failures} CHECK(S) FAILED` : 'ALL AQ/W22 LEVEL CHECKS PASSED');
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
