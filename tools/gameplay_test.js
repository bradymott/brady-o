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
    window.P = () => window.BRADY.Game.scene.player;
    window.S = () => window.BRADY.Game.scene;
    window.ctor = type => window.BRADY_TYPES[type];
    window.clearEnemies = () => { const g = window.S(); for (const e of g.entities) if (e.enemy && !e.boss) e.remove = true; sim(0.02); };
    // drop an entity right in front of Brady, on his floor
    window.near = (type, dx, props) => { const g = S(), p = P(); const C = ctor(type); const e = new C(g, Object.assign({ x: p.cx + (dx || 60), y: p.y + p.h, dir: -1 }, props || {})); g.spawn(e); return e; };
  });

  // 1. Title -> card -> intro story -> world map
  const card = await page.evaluate(() => { const s = window.BRADY.Game.scene; return { app: window.BRADY.APP, n: s.cards.length, c: { x: s.cards[0].x + s.cards[0].w / 2, y: s.cards[0].y + s.cards[0].h / 2 } }; });
  check('the world app title has one Super Brady-O World card', card.app === 'world' && card.n === 1, card.app);
  await shot('01-title.png');
  await page.mouse.click(card.c.x, card.c.y); await page.waitForTimeout(500);
  const story = await page.evaluate(() => window.BRADY.Game.scene.constructor.name);
  check('the card opens the intro story', story === 'StoryScene', story);
  await page.mouse.click(437, 150); await page.waitForTimeout(700);
  await shot('02-story.png');
  for (let k = 0; k < 8; k++) { const n = await page.evaluate(() => window.BRADY.Game.scene.constructor.name); if (n !== 'StoryScene') break; await page.mouse.click(437, 150); await page.waitForTimeout(700); }
  const map = await page.evaluate(() => { const s = S(); return { name: s.constructor.name, sel: s.sel, card: !!s.card }; });
  check('the story leads to the world map, starting in Mexico', map.name === 'TourMapScene' && map.sel === 'mx', map);
  await page.waitForTimeout(500);
  await shot('03-map-postcard.png');
  await page.mouse.click(437, 200); await page.waitForTimeout(600);
  await shot('04-map.png');
  const stamp = await page.evaluate(() => { const s = S(); return s.stamps && s.stamps[0] ? { x: s.stamps[0].x + 30, y: s.stamps[0].y + 12, locked2: !T.TourProgress.isUnlocked('1-2') } : null; });
  check('only the first level is open at the start', stamp && stamp.locked2, stamp);
  await page.mouse.click(stamp.x, stamp.y); await page.waitForTimeout(1500);
  const lvl = await page.evaluate(() => { const s = S(); return { name: s.constructor.name, id: s.id, tour: !!(s.level && s.level.tour) }; });
  check('tapping a level stamp starts it', lvl.name === 'Play' && lvl.id === '1-1' && lvl.tour, lvl);

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

  // 4. Signature power-ups: Mexico's taco toss and Paris's mime gloves
  const taco = await page.evaluate(() => {
    start('1-1'); clearEnemies(); const p = P(), g = S(); p.collect('sig:taco');
    const e = near('mxElote', 110); sim(0.02);
    for (let k = 0; k < 8 && !(e.stunT > 0); k++) sim(0.25, { actionPressed: true });
    return { sig: p.sig && p.sig.id, stunned: e.stunT > 0 };
  });
  check('Taco Toss: tacos (and salsa) stun enemies', taco.sig === 'taco' && taco.stunned, taco);
  await shot('07-power-taco.png');
  const mime = await page.evaluate(() => {
    start('7-1'); clearEnemies(); const p = P(), g = S(), A = g.area; p.collect('sig:mime'); sim(0.2);
    const tx = Math.floor((p.x + p.w + 6) / 32), ty = Math.floor((p.y + p.h - 2) / 32);
    sim(0.05, { actionPressed: true });
    const wall = A.tiles[ty * A.W + tx] === 5;
    sim(0.6, { right: true }); const blocked = p.x + p.w <= tx * 32 + 2;
    sim(7); const gone = A.tiles[ty * A.W + tx] === 0;
    return { sig: p.sig && p.sig.id, wall, blocked, gone };
  });
  check('Mime Gloves draw an invisible wall that blocks, then fades', mime.sig === 'mime' && mime.wall && mime.blocked && mime.gone, mime);
  await page.evaluate(() => { start('7-1'); clearEnemies(); P().collect('sig:mime'); sim(0.2); sim(0.05, { actionPressed: true }); sim(0.3); });
  await shot('08-power-mime.png');

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

  // 8. Castle bosses: Mexico's piñata, then Paris's soufflé; beating Mexico flies Brady to the next country
  for (const [id, name, tag] of [['1-5', 'PIÑATÓN', 'mx'], ['7-5', 'SOUFFLÉ', 'fr']]) {
    const boss = await page.evaluate(([id]) => {
      start(id); clearEnemies(); const g = S(), p = P(); const b = g.entities.find(e => e.boss);
      p.x = b.arenaX0 + 64; p.y = b.floorY - p.h - 4; p.vy = 0; p.invuln = 99; sim(2.5);
      const woke = b.state !== 'sleep', nm = b.name;
      const doorRow = Math.floor(b.floorY / 32) - 1, before = g.area.tiles[doorRow * g.area.W + b.doorX];
      for (let k = 0; k < 12 && b.hp > 0.01; k++) { b.hurtT = 0; b.state = 'fight'; b.damage(1); sim(0.3); }
      sim(2.5);
      const after = g.area.tiles[doorRow * g.area.W + b.doorX];
      const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret);
      p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; sim(1, { right: true }); sim(8);
      return { woke, nm, removed: b.remove, before, after, state: g.state };
    }, [id]);
    check(`${name} wakes up, can be beaten and opens the way out (${id})`, boss.woke && new RegExp(name).test(boss.nm) && boss.removed && boss.before === 5 && boss.after === 0 && boss.state === 'results', boss);
    if (tag === 'mx') {
      await page.evaluate(() => { start('1-5'); clearEnemies(); const g = S(), p = P(); const b = g.entities.find(e => e.boss); p.x = b.arenaX0 + 200; p.y = b.floorY - p.h - 4; p.invuln = 99; sim(3.5); });
      await shot('10-boss-pinaton.png');
    } else {
      await page.evaluate(() => { start('7-5'); clearEnemies(); const g = S(), p = P(); const b = g.entities.find(e => e.boss); p.x = b.arenaX0 + 200; p.y = b.floorY - p.h - 4; p.invuln = 99; sim(3.2); });
      await shot('11-boss-souffle.png');
    }
  }
  const fly = await page.evaluate(() => {
    const B = window.BRADY, d = B.Save.data; for (let i = 1; i <= 5; i++) d.done['1-' + i] = true; T.TourProgress.complete('1-5', false);
    const M = new T.TourMapScene({ from: '1-5' }); B.Game.setScene(M); const flying = !!M.flight; for (let k = 0; k < 600 && M.flight; k++) M.update(1 / 120);
    return { flying, sel: M.sel, unlocked: T.TourProgress.isUnlocked('7-1') };
  });
  check('beating Mexico\'s boss flies Brady on to the next country (Paris)', fly.flying && fly.sel === 'fr' && fly.unlocked, fly);
  await page.evaluate(() => { const s = S(); s.card = null; s.update(1 / 60); s.draw(window.BRADY.Game.ctx); });
  await shot('12-map-paris.png');

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
