// Brazil and Mozambique (worlds 3 and 4, v2 levels): their mechanics run in the real game, not just in the validator.
// usage: BRADY_DIST=<dist> node tools/levels_br_mz_test.js [shotsDir]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const shots = path.resolve(process.argv[2] || path.join(__dirname, '..', 'shots', 'br-mz'));
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
    window.start = id => { const B = window.BRADY; B.Save.data.lives = 9; const [w, i] = id.split('-').map(Number); B.Game.setScene(new B.Play(B.getLevel(w, i), {})); sim(1.5); P().invuln = 999; return S(); };
    window.ents = name => S().entities.filter(e => e.constructor.name === name && !e.remove);
    window.put = (x, y) => { const p = P(); p.x = x - p.w / 2; p.y = y - p.h; p.vx = p.vy = 0; };
    window.toArea = aid => { const g = S(); const k = g.level.areas.findIndex(a => a.aid === aid); const A = g.level.areas[k], an = (A.anchors && (A.anchors.in || A.anchors.start || Object.values(A.anchors)[0])) || { x: 6 * 32, y: (A.H - 3) * 32 }; g.loadArea(k, an.x, an.y); sim(0.4); P().invuln = 999; return g.area; };
  });

  // 3-1: the floats step once per bar; the kazoo's honk opens a bell gate
  const r31 = await page.evaluate(() => {
    const g = start('3-1'); const f = ents('BrBeatFloat')[0]; const xs = [];
    for (let k = 0; k < 6; k++) { sim(60 / 124 * 2); xs.push(Math.round(f.x)); }
    const moved = new Set(xs).size > 1;
    const wall = ents('TourBreakWall')[0]; const p = P(); p.collect('gear:kazoo'); put(wall.x - 40, wall.y + wall.h); sim(0.3); p.facing = 1;
    sim(0.05, { actionPressed: true }); sim(0.3);
    return { moved, xs, gateOpen: wall.remove, cannons: ents('BrBeatCannon').length };
  });
  check('3-1: parade floats step on the bar, the kazoo honk swings a bell gate open', r31.moved && r31.gateOpen && r31.cannons >= 2, r31);
  // 3-2: Quati snatches the stamps; three catches open the stamp gate; the hollow tree rustles at stamp 2
  const r32 = await page.evaluate(() => {
    const g = start('3-2'); const th = ents('TourThief')[0], p = P();
    put(th.cx - 120, th.y + th.h); sim(2.5);
    const out = { snatched: th.stop >= 1 };
    for (let n = 1; n <= 3; n++) {
      for (let k = 0; k < 40 && th.hop; k++) sim(0.1);
      const tgtY = th.y; put(th.cx, th.y - 40); p.vy = 2 * 32; sim(0.25); out['c' + n] = th.caught;
      if (n === 2) { sim(0.2); out.tell = ents('BrHollowTell')[0].k >= 0; }
    }
    sim(1); const sh = g.entities.find(e => e.shutter && e.id === 'stamp3');
    out.gate = !!(sh && sh.open); return out;
  });
  check('3-2: Quati snatches the stamps, three catches open the stamp gate, the hollow tree rustles at the second', r32.snatched && r32.c3 === 3 && r32.gate && r32.tell, r32);
  // 3-5: a kicked training ball hits the target and the shutter rolls up
  const r35 = await page.evaluate(() => {
    const g = start('3-5'); const ball = ents('BrTrainingBall')[0], tg = ents('BrKickTarget')[0], p = P();
    put(ball.x - 30, ball.y + ball.h); p.vx = 7 * 32; sim(0.05, { right: true }); ball.kick(1, p); sim(2.5);
    const sh = g.entities.find(e => e.shutter && e.id === tg.id);
    return { hit: tg.done, open: !!(sh && sh.open) };
  });
  check('3-5: a football kicked into the tunnel target rolls the shutter up', r35.hit && r35.open, r35);
  // 4-1: the ostrich counts down and runs the course
  const r41 = await page.evaluate(() => { start('4-1'); const r = ents('TourRival')[0]; const x0 = r.cx; sim(9); return { state: r.state, ran: Math.round((r.cx - x0) / 32), path: r.path.length }; });
  check('4-1: the ostrich counts down, then runs the course', r41.state === 'run' && r41.ran > 15 && r41.path > 100, r41);
  // 4-2: the stampede's dust front advances behind Brady
  const r42 = await page.evaluate(() => { start('4-2'); const d = ents('TourDoom')[0]; const f0 = d.front; sim(3); return { doom: !!d, advanced: Math.round((d.front - f0) / 32) }; });
  check('4-2: the stampede front chases Brady', r42.doom && r42.advanced >= 8, r42);
  // 4-4: carry the hatchling; the farol door won't take it; set it on the stone, pull the lamp lever, the jetty opens
  const r44 = await page.evaluate(() => {
    const g = start('4-4'); const p = P(); const peds = ents('TourPedestal');
    const nest = peds[0]; put(nest.cx, nest.y + nest.h); sim(0.3); const carrying = !!p.carrying;
    const door = g.entities.find(e => e.constructor.name === 'Portal' && e.s.look === 'mzFarolDoor');
    put(door.cx, door.y + door.h); sim(0.1, { upPressed: true, up: true }); sim(0.5); const refused = g.area.aid === 'praia' && !!P().carrying;
    const stone = peds.find(q => !q.start && !q.deliver && Math.abs(q.cx - door.cx) < 12 * 32);
    put(stone.cx, stone.y + stone.h); sim(0.05, { actionPressed: true }); sim(0.3); const setDown = !P().carrying && stone.has;
    put(door.cx, door.y + door.h); sim(0.1, { upPressed: true, up: true }); sim(3); const inFarol = S().area.aid === 'farol';
    const lever = S().entities.find(e => e.lever || e.constructor.name === 'TourLever'); put(lever.cx, lever.y + lever.h); sim(0.1, { actionPressed: true }); sim(0.3);
    const lit = S().keys.has('beam');
    toArea('praia'); sim(0.5); const sh = S().entities.find(e => e.constructor.name === 'MzKeyShutter'); const beam = ents('MzBeam')[0];
    return { carrying, refused, setDown, inFarol, lit, open: !!(sh && sh.open), beamLit: !!(beam && beam.lit) };
  });
  check('4-4: carry the hatchling, set it on the stone before the farol, the lamp lever relights the beam and opens the jetty', r44.carrying && r44.refused && r44.setDown && r44.inFarol && r44.lit && r44.open && r44.beamLit, r44);
  // 4-4: ghost crabs scuttle in the dark and freeze into statues in the beam (not in Brady's own glow)
  const r44b = await page.evaluate(() => {
    const g = start('4-4'); const crab = g.entities.find(e => e.constructor.name !== 'TourPedestal' && e.cfg && e.cfg.behavior === 'lightFrozen');
    const beam = ents('MzBeam')[0]; beam.lx = -99999; put(crab.cx - 40, crab.y + crab.h); sim(0.4); const darkMode = crab.bst;
    beam.lx = crab.cx; beam.span = 0; beam.groundY = crab.y + crab.h; sim(0.3); return { darkMode, litMode: crab.bst };
  });
  check('4-4: ghost crabs walk next to Brady in the dark and freeze in the beam', r44b.darkMode !== 'statue' && r44b.litMode === 'statue', r44b);
  // 4-6: the hard hat's dash breaks the rock before the captain's cabin
  const r46 = await page.evaluate(() => {
    const g = start('4-6'); const w = ents('TourBreakWall')[0], p = P(); p.collect('gear:hat'); sim(0.1);
    put(w.x - 50, w.y + w.h); sim(0.3); p.facing = 1; sim(0.05, { actionPressed: true }); sim(0.5); return { broken: w.remove };
  });
  check('4-6: the hard-hat dash breaks the rock to the captain\'s cabin', r46.broken, r46);
  // every Brazil and Mozambique level loads, runs ten seconds of a held-right run and draws, every area too
  const runs = await page.evaluate(() => {
    const out = {}, B = window.BRADY;
    for (const id of ['3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '4-1', '4-2', '4-3', '4-4', '4-5', '4-6']) {
      const g = start(id); P().invuln = 0; for (let k = 0; k < 50; k++) sim(0.2, { right: true, jump: k % 3 === 0, jumpPressed: k % 3 === 0 });
      g.draw(B.Game.ctx);
      for (const a of g.level.areas.slice(1)) { toArea(a.aid); sim(0.5); S().draw(B.Game.ctx); }
      out[id] = { areas: g.level.areas.length, v2: !!g.level.v2 };
    }
    return out;
  });
  check('every Brazil and Mozambique level runs and draws in each of its areas', Object.values(runs).every(r => r.v2 && r.areas >= 2), runs);
  check('no page errors', errors.length === 0, errors.slice(0, 5));
  console.log(failures ? `${failures} CHECK(S) FAILED` : 'ALL BR/MZ CHECKS PASSED');
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
