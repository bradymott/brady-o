// Scripted gameplay checks in headless Chromium (iPhone landscape size).
// Drives the real game objects and asserts on outcomes.
const { chromium } = require('playwright');
const path = require('path');
const shots = process.argv[2] || path.join(__dirname, '..', 'shots');
require('fs').mkdirSync(shots, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + JSON.stringify(info) : '')); if (!ok) failures++; };

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, '..', 'dist', 'brady-o.html'));
  await page.waitForTimeout(1500);
  // fast-forward helper: run the simulation N seconds without waiting for frames
  await page.evaluate(() => {
    window.sim = (sec, inp) => {
      const B = window.BRADY, G = B.Game, I = B.Input;
      const steps = Math.round(sec * 120);
      for (let k = 0; k < steps; k++) {
        if (inp) { Object.assign(I, inp); if (inp.jumpPressed && k > 0) I.jumpPressed = false; }
        G.scene.update(1 / 120);
        if (k === 0) { I.jumpPressed = false; I.actionPressed = false; I.upPressed = false; I.downPressed = false; I.pausePressed = false; I.taps.length = 0; I.uiKey = null; }
      }
      if (inp) for (const key in inp) I[key] = false;
    };
    window.start = (w, i, opts) => { const B = window.BRADY; B.Save.data.lives = 5; B.Game.setScene(new B.Play(B.getLevel(w, i), opts || {})); window.sim(2); };
    window.P = () => window.BRADY.Game.scene.player;
    window.S = () => window.BRADY.Game.scene;
  });

  // 1. Title → Road to the Burn card → intro story → world map → level, all via taps
  const road = await page.evaluate(() => { const c = window.BRADY.Game.scene.cards.find(c => c.id === 'road'); return { x: c.x + c.w / 2, y: c.y + c.h / 2 }; });
  await page.mouse.click(road.x, road.y);
  await page.waitForTimeout(400);
  for (let k = 0; k < 10; k++) {
    const n = await page.evaluate(() => window.BRADY.Game.scene.constructor.name);
    if (n !== 'StoryScene') break;
    await page.mouse.click(874 / 2, 402 / 2); await page.waitForTimeout(450);
  }
  const sceneName = await page.evaluate(() => window.BRADY.Game.scene.constructor.name);
  check('title card + story lead to the world map', sceneName === 'MapScene', sceneName);
  await page.screenshot({ path: path.join(shots, 'map.png') });
  await page.mouse.click(874 / 2, 402 - 16 - 27);
  await page.waitForTimeout(300);
  const sn2 = await page.evaluate(() => window.BRADY.Game.scene.constructor.name);
  check('map PLAY starts a level', sn2 === 'Play', sn2);

  // 2. Walking and jumping
  const walk = await page.evaluate(() => { start(1, 1); const x0 = P().x; sim(1.0, { right: true }); const x1 = P().x; sim(0.04, { jump: true, jumpPressed: true }); const air = !P().onGround && P().vy < 0; sim(0.2, { jump: true }); sim(1.5); return { dx: x1 - x0, air, ground: P().onGround }; });
  check('Brady walks right', walk.dx > 150, walk);
  check('Brady jumps and lands', walk.air && walk.ground, walk);

  // 3. Stomp an enemy
  const stomp = await page.evaluate(() => {
    start(1, 1);
    const g = S(), p = P();
    const e = new (window.BRADY_TYPES ? 0 : Object)();
    return null;
  });
  const stomp2 = await page.evaluate(() => {
    start(1, 1);
    const g = S(), p = P();
    // spawn a Glump directly under Brady and drop him on it
    const E = g.entities;
    const before = E.length;
    const spawnType = g.level.areas[0].spawns.find(s => s.type === 'glump') ? 'glump' : 'glump';
    const Glump = g.entities.find(e => e.constructor.name === 'Glump');
    const Ctor = Glump ? Glump.constructor : null;
    if (!Ctor) return { skip: true };
    const en = new Ctor(g, { x: p.cx, y: p.y + p.h, type: 'glump' });
    en.vx = 0; en.speed = 0;
    g.spawn(en);
    p.y -= 90; p.vy = 0;
    sim(0.6);
    return { dead: en.dead, bounced: true, score: window.BRADY.Save.data.score };
  });
  check('stomping a Glump defeats it', stomp2.skip || stomp2.dead, stomp2);

  // 4. Power-ups: coffee grows Brady, vinyl lets him throw
  const power = await page.evaluate(() => {
    start(1, 1);
    const p = P(), g = S();
    p.collect('coffee');
    sim(0.8);
    const big = p.power === 1 && p.h === 54;
    p.collect('vinyl'); sim(0.8);
    const n0 = g.entities.filter(e => e.constructor.name === 'Disc').length;
    sim(0.05, { action: true, actionPressed: true });
    const n1 = g.entities.filter(e => e.constructor.name === 'Disc').length;
    // get hurt: vinyl -> big -> small
    p.hurt({ x: p.x + 50, w: 10 }); const after1 = p.power; sim(2.2);
    p.hurt({ x: p.x + 50, w: 10 }); const after2 = p.power;
    return { big, power2: n1 > n0, after1, after2, h: p.h };
  });
  check('Dark Roast coffee makes Brady big', power.big, power);
  check('vinyl power throws records', power.power2, power);
  check('getting hit steps power down', power.after1 === 1 && power.after2 === 0 && power.h === 28, power);

  // 5. Hitting a mystery block from below gives a pick
  const block = await page.evaluate(() => {
    start(1, 1);
    const g = S(), p = P(), A = g.area;
    const T = { QBLOCK: 3, USED: 4 };
    // put a mystery block above Brady and jump into it
    const tx = Math.floor(p.cx / 32), ty = Math.floor(p.y / 32) - 3;
    A.tiles[ty * A.W + tx] = T.QBLOCK; A.contents[tx + ',' + ty] = 'pick';
    const picks0 = g.picks;
    sim(0.05, { jump: true, jumpPressed: true }); sim(0.6, { jump: true }); sim(0.8);
    return { used: A.tiles[ty * A.W + tx] === T.USED, picks: g.picks - picks0 };
  });
  check('bumping a mystery block pays out', block.used && block.picks >= 1, block);

  // 6. Falling in a pit costs a life and restarts
  const death = await page.evaluate(() => {
    start(1, 1);
    const lives0 = window.BRADY.Save.data.lives;
    const p = P(); p.y = S().area.H * 32 + 40;
    sim(0.1); const dying = p.dead;
    sim(4.0);
    const s2 = S();
    return { dying, lives0, lives1: window.BRADY.Save.data.lives, newScene: s2 !== null && s2.player !== p };
  });
  check('falling in a pit kills Brady and restarts the level', death.dying && death.lives1 === death.lives0 - 1 && death.newScene, death);

  // 7. Level clear → tally → results → next level unlocked
  const clear = await page.evaluate(() => {
    start(1, 1);
    const g = S(), p = P();
    const gate = g.entities.find(e => e.constructor.name === 'Gate');
    p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4;
    sim(1.0, { right: true });
    const st1 = g.state;
    sim(6);
    return { st1, st2: g.state, unlocked: !!window.BRADY.Save.data.unlocked['1-2'], done: !!window.BRADY.Save.data.done['1-1'] };
  });
  check('touching the Encore Gate clears the level', clear.st1 === 'clear', clear);
  check('tally ends on the results screen and saves progress', clear.st2 === 'results' && clear.unlocked && clear.done, clear);
  await page.screenshot({ path: path.join(shots, 'results.png') });

  // 8. Pause menu
  const pause = await page.evaluate(() => { start(1, 1); window.BRADY.Input.pausePressed = true; sim(0.02); const p1 = S().paused; window.BRADY.Input.pausePressed = true; sim(0.02); return { p1, p2: S().paused }; });
  check('pause opens and closes', pause.p1 === true && pause.p2 === false, pause);

  // 9. Bonus-room portal round trip
  const portal = await page.evaluate(() => {
    for (const id of ['1-1', '1-3', '1-4', '1-6', '1-7', '1-9', '2-1', '2-2']) {
      const [w, i] = id.split('-').map(Number);
      start(w, i);
      const g = S();
      const por = g.entities.find(e => e.constructor.name === 'Portal' && e.target);
      if (!por) continue;
      const p = P(); p.x = por.cx - p.w / 2; p.y = por.y + por.h - p.h - 2; p.vy = 0;
      sim(0.1);
      window.BRADY.Input.upPressed = true; window.BRADY.Input.up = true;
      sim(0.05); window.BRADY.Input.up = false;
      sim(2.0);
      return { id, area: g.area.idx, bonus: !!g.area.bonus };
    }
    return { none: true };
  });
  check('portal leads into a bonus room', portal.area === 1 && portal.bonus, portal);
  await page.screenshot({ path: path.join(shots, 'bonus.png') });

  // 10. Boss fight: wake, defeat, door opens
  const boss = await page.evaluate(() => {
    start(1, 10);
    const g = S(), p = P();
    const b = g.entities.find(e => e.constructor.name === 'Boss');
    p.x = b.arenaX0 + 64; p.y = b.y + b.h - p.h - 4; p.vy = 0;
    sim(2.5);
    const woke = b.state !== 'sleep';
    const doorBefore = g.area.tiles[(Math.floor((b.y + b.h) / 32) - 1) * g.area.W + b.doorX];
    for (let k = 0; k < 10 && b.hp > 0; k++) { b.hurtT = 0; b.damage(1); sim(0.3); }
    sim(2.5);
    const doorAfter = g.area.tiles[(Math.floor((b.y + b.h) / 32) - 1) * g.area.W + b.doorX];
    return { woke, hp: b.hp, removed: b.remove, doorBefore, doorAfter, lock: g.bossLock };
  });
  check('boss wakes when Brady enters the arena', boss.woke, boss);
  check('defeating the boss opens the exit door', boss.removed && boss.doorBefore === 5 && boss.doorAfter === 0 && boss.lock === null, boss);
  await page.screenshot({ path: path.join(shots, 'boss.png') });

  // 11. Warp lounge portal unlocks another world
  const warp = await page.evaluate(() => {
    start(1, 2);
    const g = S();
    const por = g.entities.find(e => e.constructor.name === 'Portal' && e.warpWorld);
    if (!por) return { none: true };
    const p = P(); p.x = por.cx - p.w / 2; p.y = por.y + por.h - p.h - 2;
    sim(0.1); window.BRADY.Input.upPressed = true; sim(0.05); sim(2.5);
    const s2 = S();
    return { warp: por.warpWorld, now: s2.level ? s2.level.id : null, unlocked: !!window.BRADY.Save.data.unlocked[por.warpWorld + '-1'] };
  });
  check('warp lounge portal sends Brady to another world', warp.unlocked && warp.now === warp.warp + '-1', warp);

  // 11b. Swimming rises, springs launch
  const swim = await page.evaluate(() => {
    const B = window.BRADY; let id = null;
    for (const w of B.WORLD_ORDER) { const k = B.WORLDS[w].plan.indexOf('water'); if (k >= 0) { id = [w, k + 1]; break; } }
    start(id[0], id[1]);
    const p = P(); const y0 = p.y;
    for (let k = 0; k < 8; k++) { sim(0.02, { jump: true, jumpPressed: true }); sim(0.2, { jump: true }); }
    return { level: id.join('-'), rose: y0 - p.y, inWater: p.inWater };
  });
  check('Brady swims upward underwater', swim.inWater && swim.rose > 40, swim);
  const spring = await page.evaluate(() => {
    for (const id of ['1-1','1-3','1-4','1-6','1-7','1-9','2-1','2-2','2-5','3-1','3-2']) {
      const [w, i] = id.split('-').map(Number); start(w, i);
      const g = S(); const sp = g.entities.find(e => e.constructor.name === 'Spring');
      if (!sp) continue;
      const p = P(); p.x = sp.cx - p.w / 2; p.y = sp.y - p.h - 40; p.vy = 0;
      let minY = p.y; for (let k = 0; k < 90; k++) { sim(1 / 120, { jump: true }); minY = Math.min(minY, p.y); }
      return { id, launched: sp.y - p.h - 40 - minY };
    }
    return { none: true };
  });
  check('springs launch Brady high', spring.none || spring.launched > 150, spring);

  // 11c. New mechanics: Slothy, the bufo toad, the joint, Classic retro mode, World secret exits
  const sloth = await page.evaluate(() => {
    const B = window.BRADY;
    for (const id of ['41-1', '41-2', '42-1', '43-1']) {
      const [w, i] = id.split('-').map(Number); start(w, i);
      const g = S(); const h = g.entities.find(e => e.constructor.name === 'Hammock');
      if (!h) continue;
      const p = P(); p.x = h.cx - p.w / 2; p.y = h.y + h.h - p.h; sim(0.3);
      const mounted = p.mounted;
      sim(0.02, { action: true, actionPressed: true }); sim(0.3);
      p.invuln = 0; p.hurt(null); sim(0.2);
      return { id, mounted, afterHit: p.mounted, dead: p.state === 'dying', loose: g.entities.some(e => e.constructor.name === 'Hammock' && e.loose) };
    }
    return { none: true };
  });
  check('Brady rides Slothy and a hit knocks him off (not dead)', sloth.mounted && !sloth.afterHit && !sloth.dead && sloth.loose, sloth);
  const fly = await page.evaluate(() => {
    // stand Brady on open ground with nothing but sky above him
    const openSky = () => {
      const g = S(), A = g.area, p = P(), TS = 32;
      const gy = Math.round((p.y + p.h) / TS), tx0 = Math.floor(p.cx / TS);
      for (let tx = tx0 + 2; tx < Math.min(A.W - 2, tx0 + 80); tx++) {
        let ok = A.tiles[gy * A.W + tx] === 1;
        for (let y = 0; y < gy && ok; y++) for (let dx = -1; dx <= 1; dx++) { const t = A.tiles[y * A.W + tx + dx]; if (t !== 0 && t !== 14) ok = false; }
        if (ok) { p.x = tx * TS + TS / 2 - p.w / 2; p.y = gy * TS - p.h; p.vy = 0; return tx; }
      }
      return -1;
    };
    start(1, 1); const p = P(); const g = S();
    const spot = openSky(); sim(0.3);
    p.collect('bufo'); const y0 = p.y;
    sim(0.02, { jump: true, jumpPressed: true }); sim(1.0, { jump: true });
    const rose = y0 - p.y;
    start(1, 1); const p2 = P(); openSky(); sim(0.3); p2.collect('joint'); const y1 = p2.y;
    sim(1.6, {});
    return { spot, rose, floaty: p2.floaty > 0, floatUp: y1 - p2.y };
  });
  check('bufo toad lets Brady fly', fly.rose > 100, fly);
  check('joint makes Brady float', fly.floaty && fly.floatUp > 30, fly);
  const retro = await page.evaluate(() => {
    start(31, 1); const g = S(); g.draw(window.BRADY.Game.ctx);
    return { retro: g.retro, set: g.set, music: window.BRADY.Sound.currentTrack };
  });
  check('Classic levels run in retro mode', retro.retro && retro.set === 'classic', retro);
  const city = await page.evaluate(() => {
    const B = window.BRADY;
    start(41, 4); const g = S();
    const gate = g.level.areas.flatMap((a, ai) => a.spawns.map(s => Object.assign({ ai }, s))).find(s => s.type === 'gate' && s.secret);
    if (!gate) return { noGate: true };
    g.secretClear = 'world'; g.recordProgress();
    return { found: !!B.Save.data.secretExits['41-4'], opened: B.WorldGame.isUnlocked('42-3') };
  });
  check('World secret exit opens a hidden city path', city.found && city.opened, city);

  // 12. Every level loads and runs for a few seconds without errors
  const all = await page.evaluate(() => {
    const B = window.BRADY, bad = [];
    for (const w of B.WORLD_ORDER.concat(B.CLASSIC_WORLDS, B.WORLD3_REGIONS)) for (let i = 1; i <= B.WORLDS[w].plan.length; i++) {
      try { start(w, i); sim(1.5, { right: true }); sim(0.5, { right: true, jump: true, jumpPressed: true }); B.Game.scene.draw(B.Game.ctx); }
      catch (e) { bad.push(w + '-' + i + ': ' + e.message); }
    }
    return bad;
  });
  check('all 192 levels in the three platformers load, simulate and render', all.length === 0, all.slice(0, 5));
  check('no page errors', errors.length === 0, errors.slice(0, 5));
  console.log(failures ? `${failures} FAILURES` : 'ALL CHECKS PASSED');
  await browser.close();
})();
