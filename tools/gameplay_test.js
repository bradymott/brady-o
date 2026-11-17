// Scripted gameplay checks for Super Brady-O World (the world tour) in headless Chromium.
// Drives the real game objects and asserts on outcomes; saves screenshots along the way.
// usage: node tools/gameplay_test.js [shotsDir]   (BRADY_DIST=<folder> to test a private build)
//        tests <dist>/site/super-brady-o-world/index.html (falls back to <dist>/brady-o.html)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const shots = process.argv[2] || path.join(__dirname, '..', 'shots');
fs.mkdirSync(shots, { recursive: true });
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const appPage = [path.join(dist, 'site', 'super-brady-o-world', 'index.html'), path.join(dist, 'brady-o.html')].find(f => fs.existsSync(f));
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) failures++; };

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + appPage);
  await page.waitForTimeout(1500);
  const shot = n => page.screenshot({ path: path.join(shots, n), timeout: 60000 });
  await page.evaluate(() => {
    window.sim = (sec, inp) => {
      const B = window.BRADY, G = B.Game, I = B.Input;
      const steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (inp.jumpPressed && k > 0) I.jumpPressed = false; if (inp.actionPressed && k > 0) I.actionPressed = false; }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) I[key] = false;
    };
    window.T = window.BRADY_TOUR;
    window.start = (id, opts) => { const B = window.BRADY; const [w, i] = id.split('-').map(Number); B.Save.data.lives = 5; B.Game.setScene(new B.Play(B.getLevel(w, i), opts || {})); window.sim(2); };
    // v2 boss levels: a lead-in area, then the arena area (role 'arena'): go straight through its door
    window.toArena = () => {
      const g = window.S(), L = g.level, k = (L.areas || []).findIndex(a => a.role === 'arena');
      if (k <= 0 || g.area.idx === k) return;
      const an = (L.areas[k].anchors || {}).in; if (!an) return;
      g.state = 'play'; g.player.state = 'play'; g.enterPortal({ kind: 'door', target: { area: k, x: an.x, y: an.y } }); window.sim(3);
    };
    window.P = () => window.BRADY.Game.scene.player;
    window.S = () => window.BRADY.Game.scene;
    window.ctor = type => window.BRADY_TYPES[type];
    // a v2 boss level keeps its boss in an arena area: take Brady there (legacy castles have it in the first area)
    window.arenaBoss = () => {
      const g = S(); let b = g.entities.find(e => e.boss); if (b) return b;
      const k = g.level.areas.findIndex(a => a.role === 'arena' || a.spawns.some(s => s.type === 'boss')); if (k < 0) return null;
      const a = g.level.areas[k], an = (a.anchors && (a.anchors.in || a.anchors.start)) || { x: 3 * 32 + 16, y: (a.H - 4) * 32 };
      const inv = g.player.invuln || 0; g.loadArea(k, an.x, an.y, g.player.power || 0); g.player.invuln = Math.max(g.player.invuln || 0, inv); return g.entities.find(e => e.boss);
    };
    window.clearEnemies = () => { const g = window.S(); for (const e of g.entities) if (e.enemy && !e.boss) e.remove = true; sim(0.02); };
    // drop an entity right in front of Brady, on his floor
    window.near = (type, dx, props) => { const g = S(), p = P(); const C = ctor(type); const e = new C(g, Object.assign({ x: p.cx + (dx || 60), y: p.y + p.h, dir: -1 }, props || {})); g.spawn(e); return e; };
  });

  // 1. Title -> TAP TO PLAY (the plane takes off) -> intro story -> world map
  await page.waitForTimeout(1200);   // the logo drops in
  const card = await page.evaluate(() => { const s = window.BRADY.Game.scene; return { app: window.BRADY.APP, name: s.constructor.name, label: s.ctaLabel, c: s.cta && { x: s.cta.x + s.cta.w / 2, y: s.cta.y + s.cta.h / 2 } }; });
  check('the world app title is the title show, with TAP TO PLAY for a new player', card.app === 'world' && card.name === 'TitleScene' && card.label === 'TAP TO PLAY' && !!card.c, card);
  await shot('01-title.png');
  await page.mouse.click(card.c.x, card.c.y);
  await page.waitForFunction(() => { const s = window.BRADY.Game.scene; return s.constructor.name === 'StoryScene' || (s.inner && s.inner.constructor.name === 'StoryScene'); }, null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600);
  const story = await page.evaluate(() => window.BRADY.Game.scene.constructor.name);
  check('tapping play flies off into the intro story', story === 'StoryScene', story);
  await page.mouse.click(437, 150); await page.waitForTimeout(700);
  await shot('02-story.png');
  for (let k = 0; k < 8; k++) { const n = await page.evaluate(() => window.BRADY.Game.scene.constructor.name); if (n !== 'StoryScene') break; await page.mouse.click(437, 150); await page.waitForTimeout(700); }
  const map = await page.evaluate(() => { const s = S(); return { name: s.constructor.name, sel: s.sel, card: !!s.card }; });
  check('the story leads to the world map, starting in Mexico', map.name === 'TourMapScene' && map.sel === 'mx', map);
  await page.waitForTimeout(500);
  await shot('03-map-postcard.png');
  await page.mouse.click(437, 200); await page.waitForTimeout(600);
  // the walkable overworld: Brady lands on the airstrip and walks to 1-1 by himself
  await page.waitForFunction(() => { const s = S(); return s.ow && s.ow.walker.at === '1-1' && s.ow.idle(); }, null, { timeout: 15000 }).catch(() => {});
  await shot('04-map.png');
  const stamp = await page.evaluate(() => { const s = S(), p = s.ow && s.ow.nodeScreen('1-1'); return p ? { x: p.x, y: p.y, at: s.ow.walker.at, locked2: !T.TourProgress.isUnlocked('1-2') } : null; });
  check('only the first level is open at the start; Brady walks from the airstrip to it', stamp && stamp.locked2 && stamp.at === '1-1', stamp);
  await page.mouse.click(stamp.x, stamp.y); await page.waitForTimeout(1500);
  const lvl = await page.evaluate(() => { const s = S(); return { name: s.constructor.name, id: s.id, tour: !!(s.level && s.level.tour) }; });
  check('tapping the stop Brady stands on starts that level', lvl.name === 'Play' && lvl.id === '1-1' && lvl.tour, lvl);

  // 2. Moving and jumping
  const mv = await page.evaluate(() => { start('1-1'); clearEnemies(); const p = P(), x0 = p.x; sim(0.8, { right: true }); const x1 = p.x; sim(0.05, { jump: true, jumpPressed: true }); sim(0.2, { jump: true }); const air = !p.onGround; sim(1.5); return { dx: x1 - x0, air, ground: p.onGround }; });
  check('Brady walks and jumps', mv.dx > 100 && mv.air && mv.ground, mv);

  // 3. Core power-ups
  const mush = await page.evaluate(() => { start('1-1'); const p = P(), g = S(); p.collect('mushroom'); sim(0.8); return { big: p.power === 1, dizzy: g.dizzy > 0 }; });
  check('the magic mushroom makes Brady big and the screen dizzy', mush.big && mush.dizzy, mush);
  await shot('05-power-mushroom.png');
  const joint = await page.evaluate(() => {
    start('1-1'); clearEnemies(); const p = P(), g = S(); p.collect('joint'); sim(0.3);
    const e = near('mxElote', 90); sim(0.05);
    for (let k = 0; k < 6 && !e.dead; k++) sim(0.3, { actionPressed: true });
    return { power: p.power, puffs: g.entities.filter(x => x.constructor.name === 'SmokePuff').length, ko: e.dead || e.remove };
  });
  check('the joint lets Brady blow smoke puffs that knock out enemies', joint.power === 2 && joint.ko, joint);
  const lsd = await page.evaluate(() => {
    start('7-1'); clearEnemies(); const p = P(), g = S(); const y0 = p.y; p.collect('lsd'); sim(1.2, { up: true }); const rose = y0 - p.y;
    // hover back down to the street and zap a baguette with a rainbow laser
    p.y = y0; p.vy = 0; const e = near('frBaguette', 120, {}); e.cool = 99; sim(0.05);
    for (let k = 0; k < 6 && !e.dead; k++) sim(0.2, { actionPressed: true });
    const ko = e.dead || e.remove;
    sim(9.5); const gliding = p.glideT > 0 || p.onGround; const trail = p.trail.length;
    return { rose, ko, flying: p.lsdT, gliding, trail };
  });
  check('the LSD tab gives free flight and rainbow lasers, then a glide down', lsd.rose > 80 && lsd.ko && lsd.gliding, lsd);
  await page.evaluate(() => { start('7-1'); clearEnemies(); P().collect('lsd'); sim(0.6, { up: true, right: true }); sim(0.3, { right: true, actionPressed: true }); });
  await shot('06-power-lsd.png');
  const star = await page.evaluate(() => { start('1-1'); clearEnemies(); const p = P(); p.collect('star'); const e = near('mxPepper', 30); sim(0.6, { right: true }); return { star: p.star > 0, ko: e.dead || e.remove, alive: !p.dead }; });
  check('invincibility knocks enemies away', star.star && star.ko && star.alive, star);
  const life = await page.evaluate(() => { start('1-1'); const B = window.BRADY, l0 = B.Save.data.lives; P().collect('oneup'); return { l0, l1: B.Save.data.lives }; });
  check('the water bottle gives an extra life', life.l1 === life.l0 + 1, life);

  // 4. Signature power-ups: Mexico's taco toss and France's meringue piping bag
  const taco = await page.evaluate(() => {
    start('1-1'); clearEnemies(); const p = P(), g = S(); p.collect('sig:taco');
    const e = near('mxElote', 110); sim(0.02);
    for (let k = 0; k < 8 && !(e.stunT > 0); k++) sim(0.25, { actionPressed: true });
    return { sig: p.sig && p.sig.id, stunned: e.stunT > 0 };
  });
  check('Taco Toss: tacos (and salsa) stun enemies', taco.sig === 'taco' && taco.stunned, taco);
  await shot('07-power-taco.png');
  const piping = await page.evaluate(() => {
    start('7-1'); clearEnemies(); const p = P(), g = S(), A = g.area; p.collect('sig:piping'); sim(0.2);
    const tx = Math.floor((p.x + p.w + 6) / 32), ty = Math.floor((p.y + p.h - 2) / 32);
    sim(0.05, { actionPressed: true });
    const wall = A.tiles[ty * A.W + tx] === 5;
    sim(0.6, { right: true }); const blocked = p.x + p.w <= tx * 32 + 2;
    sim(7); const gone = A.tiles[ty * A.W + tx] === 0;
    return { sig: p.sig && p.sig.id, wall, blocked, gone };
  });
  check('the Meringue Piping Bag pipes a wall that blocks, then crumbles', piping.sig === 'piping' && piping.wall && piping.blocked && piping.gone, piping);
  await page.evaluate(() => { start('7-1'); clearEnemies(); P().collect('sig:piping'); sim(0.2); sim(0.05, { actionPressed: true }); sim(0.3); });
  await shot('08-power-piping.png');
  // Ecuador's booby boots: higher jumps, and a big landing knocks out enemies nearby
  const boots = await page.evaluate(() => {
    const jumpH = () => { const p = P(), y0 = p.y; let top = y0; sim(0.05, { jump: true, jumpPressed: true }); for (let k = 0; k < 120; k++) { sim(1 / 120, { jump: true }); top = Math.min(top, p.y); } sim(1); return y0 - top; };
    start('2-1'); clearEnemies(); const h0 = jumpH();
    start('2-1'); clearEnemies(); const p = P(), g = S(); p.collect('sig:boots'); sim(0.1); const h1 = jumpH();
    const e = near('ecBanana', 40); e.vx = 0; sim(0.02); p.y -= 6 * 32; p.vy = 0; sim(1.2);
    return { sig: p.sig && p.sig.id, h0: Math.round(h0), h1: Math.round(h1), ko: e.dead || e.remove };
  });
  check('Booby Boots: higher jumps, and big landings knock out enemies nearby', boots.sig === 'boots' && boots.h1 > boots.h0 * 1.25 && boots.ko, boots);
  await page.evaluate(() => { start('2-1'); clearEnemies(); P().collect('sig:boots'); sim(0.1); sim(0.05, { jump: true, jumpPressed: true, right: true }); sim(0.35, { jump: true, right: true }); });
  await shot('08b-power-boots.png');
  // Brazil's football: kick it and it knocks out enemies, ricocheting
  const ball = await page.evaluate(() => {
    start('3-1'); clearEnemies(); const p = P(), g = S(); p.collect('sig:ball'); sim(0.1);
    const e = near('brCrab', 150); e.vx = 0; sim(0.02);
    sim(0.05, { actionPressed: true }); sim(1.2);
    return { sig: p.sig && p.sig.id, ko: e.dead || e.remove };
  });
  check('Football: a kicked ball knocks out enemies', ball.sig === 'ball' && ball.ko, ball);
  await page.evaluate(() => { start('3-1'); clearEnemies(); const p = P(); p.collect('sig:ball'); sim(0.1); near('brCrab', 220); sim(0.05, { actionPressed: true }); sim(0.25); });
  await shot('08c-power-football.png');
  // a coati steals coins, and gives them back when stomped
  const coati = await page.evaluate(() => {
    start('3-3'); clearEnemies(); const p = P(), g = S(); g.picks = 10; p.invuln = 0;
    const c = near('brCoati', 0); c.x = p.cx - c.w / 2; c.y = p.y + p.h - c.h; sim(0.05); const after = g.picks;
    sim(0.3); c.flee = 0; c.stunT = 0; c.x = p.cx - c.w / 2; c.y = p.y + p.h - c.h; c.vx = 0; p.y = c.y - p.h - 50; p.vy = 0; sim(0.6);
    return { after, back: g.picks, dead: c.dead || c.remove };
  });
  check('Coatis steal coins, and stomping one gets them back', coati.after === 5 && coati.back === 10 && coati.dead, coati);
  // Mozambique's piri-piri: fire breath knocks out enemies and burns thorn hedges
  const piri = await page.evaluate(() => {
    start('4-1'); clearEnemies(); const p = P(), g = S(), A = g.area; p.collect('sig:piri'); sim(0.1);
    const tx = Math.floor((p.cx + 70) / 32), ty = Math.floor((p.y + p.h - 4) / 32); A.tiles[ty * A.W + tx] = 2;
    const e = near('mzPrawn', 60); e.vx = 0; e.cool = 99; sim(0.02);
    for (let k = 0; k < 4; k++) sim(0.25, { actionPressed: true });
    return { sig: p.sig && p.sig.id, burnt: A.tiles[ty * A.W + tx] === 0, ko: e.dead || e.remove, timed: p.sig && p.sig.t > 0 && p.sig.t < 10 };
  });
  check('Piri-piri: ten seconds of fire breath that knocks out enemies and burns thorn hedges', piri.sig === 'piri' && piri.burnt && piri.ko && piri.timed, piri);
  await page.evaluate(() => { start('4-1'); clearEnemies(); P().collect('sig:piri'); sim(0.1); sim(0.05, { actionPressed: true }); sim(0.12); });
  await shot('08d-power-piri.png');
  // Morocco's flying carpet: free flight
  const carpet = await page.evaluate(() => { start('5-1'); clearEnemies(); const p = P(), y0 = p.y; p.collect('sig:carpet'); sim(1.2, { up: true }); const rose = y0 - p.y; sim(0.5, { right: true }); return { sig: p.sig && p.sig.id, rose: Math.round(rose), air: !p.onGround }; });
  check('Flying carpet: Brady flies freely', carpet.sig === 'carpet' && carpet.rose > 100 && carpet.air, carpet);
  await page.evaluate(() => { start('5-1'); clearEnemies(); P().collect('sig:carpet'); sim(0.8, { up: true, right: true }); });
  await shot('08e-power-carpet.png');
  // Spain's tomatoes: a direct hit knocks out, a splat makes a puddle that sends enemies sliding
  const tomato = await page.evaluate(() => {
    start('6-1'); clearEnemies(); const p = P(), g = S(); p.collect('sig:tomato'); sim(0.1);
    const e = near('esHorchata', 110); e.vx = 0; sim(0.02);
    for (let k = 0; k < 6 && !(e.dead || e.remove); k++) sim(0.3, { actionPressed: true });
    const ko = e.dead || e.remove;
    const puddles = g.entities.filter(x => x.constructor.name === 'EsPuddle').length;
    const e2 = near('esHorchata', 40); sim(0.02); const P2 = g.entities.find(x => x.constructor.name === 'EsPuddle');
    let slid = false; if (P2) { e2.x = P2.cx - e2.w / 2; e2.y = P2.y + P2.h - e2.h; sim(0.1); slid = e2.slideT > 0 || e2.dead || e2.remove; }
    return { sig: p.sig && p.sig.id, ko, puddles, slid };
  });
  check('Tomato fight: tomatoes knock enemies out and the splats make them slide', tomato.sig === 'tomato' && tomato.ko && tomato.puddles >= 1 && tomato.slid, tomato);
  await page.evaluate(() => { start('6-1'); clearEnemies(); P().collect('sig:tomato'); sim(0.1); sim(0.05, { actionPressed: true }); sim(0.35); });
  await shot('08f-power-tomato.png');
  // Amsterdam's bike: faster, and the bell stuns enemies nearby
  const bike = await page.evaluate(() => {
    const run = sig => { start('8-1'); clearEnemies(); const p = P(); if (sig) p.collect('sig:bike'); sim(0.1); const x0 = p.x; sim(0.8, { right: true }); return p.x - x0; };
    const d0 = run(false), d1 = run(true);
    const p = P(), e = near('nlClog', 90); e.vx = 0; sim(0.02); sim(0.05, { actionPressed: true });
    return { sig: p.sig && p.sig.id, d0: Math.round(d0), d1: Math.round(d1), stunned: e.stunT > 0 };
  });
  check('Dutch bike: Brady rides faster and the bell stuns enemies', bike.sig === 'bike' && bike.d1 > bike.d0 * 1.2 && bike.stunned, bike);
  await page.evaluate(() => { start('8-1'); clearEnemies(); P().collect('sig:bike'); sim(0.1); sim(0.6, { right: true }); });
  await shot('08g-power-bike.png');
  // Antarctica's penguin slide bowls enemies over
  const slide = await page.evaluate(() => { start('13-1'); clearEnemies(); const p = P(); p.collect('sig:slide'); sim(0.1); const e = near('aqSnowball', 120); e.vx = 0; e.cool = 99; sim(0.02); const x0 = p.x; sim(0.05, { actionPressed: true }); sim(0.5); return { sig: p.sig && p.sig.id, dx: Math.round(p.x - x0), ko: e.dead || e.remove, alive: !p.dead }; });
  check('Penguin slide: Brady whooshes along on his belly and bowls enemies over', slide.sig === 'slide' && slide.dx > 150 && slide.ko && slide.alive, slide);
  await page.evaluate(() => { start('13-1'); clearEnemies(); P().collect('sig:slide'); sim(0.1); sim(0.05, { actionPressed: true }); sim(0.3); });
  await shot('08h-power-slide.png');
  // World 22's dream tricks: the echo follows 1.4 s behind; Mirror Lake is played leftwards
  const dream = await page.evaluate(() => {
    start('22-1'); clearEnemies(); const g = S(), p = P(); const echo = g.entities.find(e => e.constructor.name === 'W22Echo');
    p.x = echo.home.x + 40; p.y = echo.home.y + echo.h - p.h; p.vy = 0; sim(0.3); const early = echo.on; sim(1.6, { right: true }); const later = echo.on;
    const B = window.BRADY, C22 = T.Tour.countries.w22, mi = C22.levels.findIndex(S => S.mirror || (S.areas || []).some(a => a.mirror)) + 1, L = B.getLevel(22, mi || 2), A = L.areas[0], gate = A.spawns.find(s => s.type === 'gate' && !s.secret);
    return { early, later, mirrored: !!A.mirrored, startRight: L.start.x > A.W * 16, goalLeft: gate.x < A.W * 16 };
  });
  check('World 22: your echo appears behind you, and Mirror Lake runs right to left', !dream.early && dream.later && dream.mirrored && dream.startRight && dream.goalLeft, dream);
  await page.evaluate(() => { start('22-1'); clearEnemies(); const g = S(), p = P(); const echo = g.entities.find(e => e.constructor.name === 'W22Echo'); p.x = echo.home.x + 40; p.y = echo.home.y + echo.h - p.h; sim(1.8, { right: true }); });
  await shot('08i-world22-echo.png');

  // 5. Enemies: stomping, and a two-hit piñata burro
  const stomp = await page.evaluate(() => {
    start('1-1'); clearEnemies(); const p = P(); const e = near('mxPepper', 0); e.cool = 99; e.x = p.cx - e.w / 2; e.y = p.y + p.h - e.h;
    p.y = e.y - p.h - 60; p.vy = 0; sim(0.6);
    const b = near('mxBurro', 0); b.x = p.cx - b.w / 2; b.y = p.y + p.h - b.h; p.y = b.y - p.h - 60; p.vy = 0; sim(0.5); const hp1 = b.hp; p.y = b.y - p.h - 60; p.vy = 0; sim(0.5);
    return { pepper: e.dead || e.remove, burroFirst: hp1 === 1, burro: b.dead || b.remove };
  });
  check('stomping defeats enemies (a piñata burro takes two)', stomp.pepper && stomp.burroFirst && stomp.burro, stomp);

  // 6. A postcard and the goal
  const card2 = await page.evaluate(() => { start('1-1'); const g = S(), p = P(); const gold = g.entities.find(e => e.constructor.name === 'Gold'); p.x = gold.cx - p.w / 2; p.y = gold.y; p.vy = 0; sim(0.2); return { got: (window.BRADY.Save.data.gold['1-1'] || []).filter(Boolean).length }; });
  check('collecting a postcard from Chinka counts', card2.got >= 1, card2);
  const clear = await page.evaluate(() => {
    start('1-1'); clearEnemies(); const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret);
    p.x = gate.cx - 80; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(0.8, { right: true }); const st1 = g.state; sim(8); const st2 = g.state;
    return { st1, st2, done: !!window.BRADY.Save.data.done['1-1'], next: T.TourProgress.isUnlocked('1-2') };
  });
  check('the passport stamp ends the level and opens the next one', clear.st1 === 'clear' && clear.st2 === 'results' && clear.done && clear.next, clear);
  await shot('09-results.png');

  // 6b. Mexico 1-2 (RAIL): Brady starts standing in the boat and it carries him with no input (he used to start on the
  //     dock beside it; the boat left without him and the scrolling screen pushed him into the canal every time)
  const boat = await page.evaluate(() => {
    start('1-2'); const g = S(), p = P(), cart = g.entities.find(e => e.carrier);
    const onStart = p.ride === cart; sim(6);
    return { onStart, ride: p.ride === cart, alive: !p.dead && g.state === 'play', x: Math.round(p.x / 32) };
  });
  check('1-2: Brady starts in the trajinera and rides it hands-off', boat.ride && boat.alive && boat.x > 15, boat);

  // 7. Every level loads, runs and draws
  const all = await page.evaluate(() => {
    const B = window.BRADY, bad = [];
    for (const id of T.Tour.allLevelIds()) {
      try { const [w, i] = id.split('-').map(Number); const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g); for (let k = 0; k < 240; k++) g.update(1 / 120); g.draw(B.Game.ctx); if (g.state === 'dead') bad.push(id + ' died'); }
      catch (e) { bad.push(id + ': ' + e.message); }
    }
    return { n: T.Tour.allLevelIds().length, bad };
  });
  check('every tour level loads, simulates and renders', all.n >= 10 && all.bad.length === 0, all);

  // 8. Castle bosses: Mexico's piñata, then France's soufflé; beating Mexico flies Brady to the next country
  for (const [id, name, tag] of [['1-5', 'PIÑATÓN', 'mx'], ['2-5', 'TORTUG', 'ec'], ['3-5', 'TUCAN', 'br'], ['4-5', 'EREMITA', 'mz'], ['5-5', 'BERRAD', 'ma'], ['6-5', 'PAELLASAURUS', 'es'], ['7-5', 'SOUFFLÉ', 'fr'], ['8-5', 'CHEESE KING', 'nl'], ['9-5', 'KERA', 'id'], ['10-5', 'PHIN', 'vn'], ['11-5', 'KAPPA', 'jp'], ['13-4', 'BIG TUSK', 'aq'], ['22-4', 'OTHER BRADY', 'w22']]) {
    const boss = await page.evaluate(([id]) => {
      start(id); clearEnemies(); const b = arenaBoss(), g = S(), p = P();
      p.x = b.arenaX0 + 64; p.y = b.floorY - p.h - 4; p.vy = 0; p.invuln = 99; sim(2.5);
      const woke = b.state !== 'sleep', nm = b.name;
      const doorRow = Math.floor(b.floorY / 32) - 1, before = g.area.tiles[doorRow * g.area.W + b.doorX];
      for (let k = 0; k < 12 && b.hp > 0.01; k++) { b.hurtT = 0; b.state = 'fight'; b.damage(1); sim(0.3); }
      // the finish sequences (candy rain, a sealed pot, a goal...) take a few seconds before the door opens
      for (let k = 0; k < 60 && g.area.tiles[doorRow * g.area.W + b.doorX] === 5; k++) sim(0.25);
      const after = g.area.tiles[doorRow * g.area.W + b.doorX];
      const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret);
      p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; sim(1, { right: true }); sim(8);
      return { woke, nm, removed: b.remove, before, after, state: g.state };
    }, [id]);
    check(`${name} wakes up, can be beaten and opens the way out (${id})`, boss.woke && new RegExp(name).test(boss.nm) && boss.removed && boss.before === 5 && boss.after === 0 && boss.state === 'results', boss);
    await page.evaluate(([id]) => { start(id); clearEnemies(); const b = arenaBoss(), g = S(), p = P(); p.x = b.arenaX0 + 160; p.y = b.floorY - p.h - 4; p.invuln = 99; sim(3.5); }, [id]);
    await shot('10-boss-' + tag + '.png');
  }
  // the boss fights themselves (mechanics, phases, weak moments) are checked per country by tools/boss_test.js
  // Bali, Vietnam, Japan and Nepal: each signature item works in its own country
  const sigs4 = await page.evaluate(() => {
    const out = {};
    for (const [id, sig] of [['9-1', 'surf'], ['10-1', 'noodle'], ['11-1', 'nunchuck'], ['12-2', 'yak']]) {
      start(id); clearEnemies(); const x0 = P().x; P().collect('sig:' + sig); sim(0.2);
      for (let k = 0; k < 10; k++) sim(0.25, { right: true, actionPressed: k % 2 === 0 });
      const p = P(); out[sig] = { has: !!(p.sig && p.sig.id === sig), moved: Math.round(p.x - x0), alive: !p.dead };
    }
    return out;
  });
  check('surfboard, noodle lasso, nunchucks and yak ride all work in their countries', Object.values(sigs4).every(s => s.has && s.alive && s.moved > 60), sigs4);
  // the finale: Baron Bric-a-Brac's three phases in Nepal, then home together, the ending and the credits
  const fin = await page.evaluate(() => {
    start('12-5'); clearEnemies(); const b = arenaBoss(), g = S(), p = P();
    p.x = b.arenaX0 + 64; p.y = b.floorY - p.h - 4; p.invuln = 999; sim(3);
    const phases = new Set();
    for (let k = 0; k < 80 && !b.remove && b.state !== 'dying'; k++) { b.hurtT = 0; b.state = 'fight'; phases.add(b.phase); b.damage(1); sim(0.25); }
    sim(2.5);
    const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); const q = P(); q.invuln = 0; q.x = gate.cx - 60; q.y = gate.y + gate.h - q.h - 4; q.vy = 0;
    sim(1, { right: true }); sim(8);
    const results = g.state, btn = (g.resultsUI || []).find(x => /HOME TOGETHER/.test(x.label)); if (btn) btn.fn();
    const E = window.BRADY.Game.scene, ending = E.constructor.name;
    for (let k = 0; k < 120; k++) E.update(1 / 60);
    const I = window.BRADY.Input; for (let k = 0; k < 40 && window.BRADY.Game.scene === E; k++) { I.jumpPressed = true; E.update(1 / 60); I.jumpPressed = false; }
    return { name: b.name, phases: [...phases].join(','), beaten: !!b.remove, results, ending, credits: window.BRADY.Game.scene.constructor.name };
  });
  check('Baron Bric-a-Brac fights in three phases; beating him leads home, to the ending and the credits', fin.phases === '1,2,3' && fin.beaten && fin.results === 'results' && fin.ending === 'TourEndingScene' && fin.credits === 'CreditsScene', fin);
  // the route on the map: Mexico to Nepal in order, and the postcard count across all lands
  // level totals come from the game data: 68 main levels (5 per country, 4 in each secret land) plus however many
  // secret levels the countries have so far
  const order = await page.evaluate(() => { const Ws = T.Tour.worldList(), C = w => T.Tour.byWorld[w]; return { route: T.Tour.mainCountries().map(C => C.id).join(','), secret: Ws.filter(w => C(w).secret).join(','), levels: T.Tour.allLevelIds().length, listed: Ws.reduce((n, w) => n + C(w).levels.length, 0), main: Ws.reduce((n, w) => n + C(w).mainCount, 0), mainOk: Ws.every(w => C(w).mainCount === (C(w).secret ? 4 : 5)) }; });
  check(`the map route runs Mexico to Nepal with both secret lands, 68 main levels (${order.levels} in all)`, order.route === 'mx,ec,br,mz,ma,es,fr,nl,id,vn,jp,np' && order.secret === '13,22' && order.main === 68 && order.mainOk && order.levels === order.listed, order);
  // the secret lands: hidden on the map until found; Antarctica behind a cracked wall in 8-4, World 22 behind door 22 in 5-2 (22 postcards)
  const secrets = await page.evaluate(() => {
    const B = window.BRADY, d = B.Save.data, TP = T.TourProgress, M = T.TourMapScene;
    d.tour = { at: 'nl', seen: {}, freed: {}, lands: {} }; d.gold = {};
    const st = id => { const s = T.Tour.stops[id]; return { aq: 0, w22: 0 } && TP.countryUnlocked(T.Tour.countries[id]) ? 'shown' : 'hidden'; };
    const hiddenAtFirst = st('aq') === 'hidden' && st('w22') === 'hidden';
    const viaDoor = (id, room) => {
      start(id); clearEnemies(); const g = S(), p = P(); p.invuln = 99;
      // the door into the area that holds the level's secret gate (the bonus room in 8-4, the oasis camp in 5-2)
      const sa = g.level.areas.findIndex(a => a.spawns.some(s => s.type === 'gate' && (s.secret || (s.exit && s.exit !== 'main'))));
      const door = g.entities.find(e => e.constructor.name === 'Portal' && e.s.target && e.s.target.area === sa); if (!door) return { noDoor: sa }; g.enterPortal(door); sim(1.5);
      const gate = g.entities.find(e => e.constructor.name === 'Gate' && e.secret); if (!gate) return { noGate: true };
      const q = P(); q.invuln = 99; q.x = gate.cx - 50; q.y = gate.y + gate.h - q.h - 4; q.vy = 0; sim(0.8, { right: true }); const s1 = g.state; sim(8); return { s1, s2: g.state };
    };
    const aq = viaDoor('8-4');
    const aqOpen = TP.countryUnlocked(T.Tour.countries.aq) && TP.isUnlocked('13-1');
    const w0 = viaDoor('5-2'); const lockedOut = w0.s1 === 'play' && !TP.countryUnlocked(T.Tour.countries.w22);
    // the shut door is remembered: World 22's ghost pin shows on the map, and tapping it says what the door wants
    const gm = new M({}); B.Game.setScene(gm); gm.card = null; gm.openRoute({}); const ws = T.Tour.stops.w22; gm.rRevealQ = []; gm.cam.lon = ws.lon + 12; gm.cam.lat = ws.lat;
    B.Input.taps.push({ x: gm.sx(ws.lon), y: gm.sy(ws.lat) }); gm.update(1 / 60);
    const ghost = { door: !!(d.tour.doors || {}).w22, pins: gm.ghostPins().map(s => s.id).join(), toast: gm.toastMsg };
    for (const w of [1, 2, 3, 4, 5, 6, 7, 8]) d.gold[w + '-1'] = [true, true, true];
    const w1 = viaDoor('5-2'); const w22Open = TP.countryUnlocked(T.Tour.countries.w22) && TP.isUnlocked('22-1');
    // the new land is revealed on the route map, then the plane flies there
    const map = new M({ from: '5-2' }); B.Game.setScene(map); map.card = null; let flying = false; for (let k = 0; k < 3000 && !(map.mode === 'land' && map.sel === 'w22'); k++) { map.update(1 / 120); if (map.flight) flying = true; if (map.card) map.card = null; }
    return { hiddenAtFirst, aq, aqOpen, lockedOut, ghost, w1, w22Open, flying, sel: map.sel, gold: TP.totals().gold, ghostAfter: map.ghostPins().length };
  });
  check('secret lands stay hidden until found; a cracked wall in 8-4 opens Antarctica; door 22 in 5-2 opens World 22 only with 22 postcards', secrets.hiddenAtFirst && secrets.aqOpen && secrets.lockedOut && secrets.w22Open && secrets.flying && secrets.sel === 'w22', secrets);
  check('the shut door in 5-2 leaves a "22?" ghost pin on the world map; tapping it tells how many postcards it wants; it goes once World 22 opens', secrets.ghost.door && secrets.ghost.pins === 'w22' && /WANTS 22 POSTCARDS/.test(secrets.ghost.toast) && secrets.ghostAfter === 0, secrets.ghost);
  await page.evaluate(() => {
    const B = window.BRADY, d = B.Save.data, keep = JSON.stringify(d.tour), keepGold = JSON.stringify(d.gold), keepUn = JSON.stringify(d.unlocked);
    d.tour = Object.assign(JSON.parse(keep), { lands: {}, doors: { w22: true }, pending: [], at: 'ma' }); d.gold = {};
    for (const id in d.unlocked) if (/^22-/.test(id)) delete d.unlocked[id];
    const m = new T.TourMapScene({}); B.Game.setScene(m); m.card = null; m.openRoute({}); m.rRevealQ = []; const ws = T.Tour.stops.w22; m.cam.lon = ws.lon + 12; m.cam.lat = ws.lat; m.update(1 / 60); m.cam.lon = ws.lon + 12; m.cam.lat = ws.lat; m.draw(B.Game.ctx); m.update = function () {};
    window.__ghostRestore = () => { d.tour = JSON.parse(keep); d.gold = JSON.parse(keepGold); d.unlocked = JSON.parse(keepUn); };
  });
  await shot('12c-map-ghost22.png');
  await page.evaluate(() => window.__ghostRestore());
  await page.evaluate(() => { const s = S(); s.card = null; s.update(1 / 60); s.draw(window.BRADY.Game.ctx); });
  await shot('12b-map-world22.png');
  // the whole route flows: each boss opens its land's port; boarding there offers the next built country
  const route = await page.evaluate(() => {
    const B = window.BRADY, d = B.Save.data, out = [];
    d.tour = { at: 'mx', seen: {}, freed: {}, lands: {} }; d.done = {}; d.unlocked = {};
    for (const C of T.Tour.mainCountries()) {
      for (let i = 1; i <= C.mainCount; i++) { d.done[C.world + '-' + i] = true; T.TourProgress.complete(C.world + '-' + i, false); }
      const N = T.Tour.nextCountry(C); const M = new T.TourMapScene({ from: C.world + '-' + C.mainCount }); B.Game.setScene(M); M.card = null;
      for (let k = 0; k < 1200 && !(M.mode === 'land' && M.ow.idle()); k++) M.update(1 / 60);
      const at = M.ow.walker.at; M.ow.enter(true);
      out.push(C.id + '>' + (N ? (at === 'port' && M.mode === 'route' && M.dest === N.id ? N.id : 'STUCK') : (at === 'port' ? 'end' : 'STUCK')));
    }
    d.tour = { at: null, seen: {}, freed: {}, lands: {} }; d.done = {}; d.unlocked = {}; d.gold = {};
    return out;
  });
  check('the route flows country to country: each boss opens the port, Brady walks there and boards for the next land', route.every(r => !/STUCK/.test(r)) && route[route.length - 1] === 'np>end', route);
  const fly = await page.evaluate(() => {
    const B = window.BRADY, d = B.Save.data; for (let i = 1; i <= 5; i++) d.done['1-' + i] = true; T.TourProgress.complete('1-5', false);
    const M = new T.TourMapScene({ from: '1-5' }); B.Game.setScene(M); M.card = null;
    for (let k = 0; k < 1200 && !(M.mode === 'land' && M.ow.idle()); k++) M.update(1 / 60);
    M.ow.enter(true); M.go(); const flying = !!M.flight;
    for (let k = 0; k < 70; k++) M.update(1 / 60);
    window.__flyScene = M;
    const next = T.Tour.nextCountry(T.Tour.countries.mx);
    return { flying, next: next.id, unlocked: T.TourProgress.isUnlocked(next.world + '-1') };
  });
  await page.evaluate(() => { const s = S(); s.draw(window.BRADY.Game.ctx); s._u = s.update; s.update = function () {}; });
  await shot('12-map-flight.png');
  const landed = await page.evaluate(() => { const M = S(); M.update = M._u; for (let k = 0; k < 600 && M.flight; k++) M.update(1 / 60); return { sel: M.sel, mode: M.mode, at: M.ow && M.ow.walker.at }; });
  check('beating Mexico\'s boss: from the port Brady flies on to the next country and lands on its airstrip', fly.flying && landed.sel === fly.next && fly.next === 'ec' && fly.unlocked && landed.mode === 'land' && landed.at === 'start', Object.assign({}, fly, landed));
  await page.evaluate(() => { const s = S(); s.card = null; s.update(1 / 60); s.draw(window.BRADY.Game.ctx); });

  // 9. Pause, credits and the ending
  const pause = await page.evaluate(() => { start('7-2'); const g = S(); g.openPause(); const labels = g.pauseUI.map(b => b.label); g.closePause(); return labels; });
  check('pause offers the world map', pause.includes('WORLD MAP'), pause);
  const credits = await page.evaluate(() => { const B = window.BRADY; const c = new B.CreditsScene('world'); B.Game.setScene(c); for (let k = 0; k < 60; k++) c.update(1 / 60); c.draw(B.Game.ctx); return c.lines.map(l => l[0]).join(' | '); });
  check('the credits tell the world-tour story', /Baron Bric-a-Brac/.test(credits) && /postcards/i.test(credits) && !/playa|Burning|the Man\b/.test(credits), credits.slice(0, 160));
  const ending = await page.evaluate(() => { const B = window.BRADY; const e = new T.TourEndingScene(); B.Game.setScene(e); for (let k = 0; k < 30; k++) e.update(1 / 60); e.draw(B.Game.ctx); return e.lines.length; });
  check('the ending scene plays', ending >= 3, ending);
  await shot('13-ending.png');
  const settings = await page.evaluate(() => { const B = window.BRADY; const s = new B.SettingsScene(null); return s.btns.map(b => b.label).join(' | '); });
  check('settings include a reduced-motion switch', /MOTION EFFECTS/.test(settings), settings);
  check('no page errors', errors.length === 0, errors.slice(0, 5));
  console.log(failures ? `${failures} CHECK(S) FAILED` : 'ALL CHECKS PASSED');
  await browser.close();
  process.exit(failures ? 1 : 0);
})();
