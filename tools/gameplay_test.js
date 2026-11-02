// Scripted gameplay checks for Super Brady-O World in headless Chromium (iPhone landscape size).
// Drives the real game objects and asserts on outcomes.
// usage: node tools/gameplay_test.js [shotsDir]     (BRADY_DIST=<folder> to test a private build)
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
  await page.goto('file://' + path.join(process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist'), 'brady-o.html'));
  await page.waitForTimeout(1500);
  // fast-forward helpers: run the simulation without waiting for frames
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
    window.ctor = type => window.BRADY_TYPES[type];
    // put Brady on open ground with nothing but sky above him
    window.openSky = () => {
      const g = window.S(), A = g.area, p = window.P(), TS = 32;
      const gy = Math.round((p.y + p.h) / TS), tx0 = Math.floor(p.cx / TS);
      for (let tx = tx0 + 2; tx < Math.min(A.W - 2, tx0 + 80); tx++) {
        let ok = A.tiles[gy * A.W + tx] === 1;
        for (let y = 0; y < gy && ok; y++) for (let dx = -1; dx <= 1; dx++) { const t = A.tiles[y * A.W + tx + dx]; if (t !== 0 && t !== 14) ok = false; }
        if (ok) { p.x = tx * TS + TS / 2 - p.w / 2; p.y = gy * TS - p.h; p.vy = 0; return tx; }
      }
      return -1;
    };
    window.clearEnemies = () => { const g = window.S(); for (const e of g.entities) if (e.enemy && !e.boss) e.remove = true; sim(0.02); };
    window.clearStage = () => { const g = window.S(); for (const e of g.entities) if ((e.enemy && !e.boss) || e.constructor.name === 'Hammock') e.remove = true; sim(0.02); };
  });

  // 1. Title → SUPER BRADY-O WORLD card → intro story → the overworld map → a level
  const card = await page.evaluate(() => { const c = window.BRADY.Game.scene.cards.find(c => c.id === 'world'); return c ? { x: c.x + c.w / 2, y: c.y + c.h / 2 } : null; });
  check('title has a Super Brady-O World card', !!card, card);
  if (card) {
    await page.mouse.click(card.x, card.y);
    await page.waitForTimeout(400);
    for (let k = 0; k < 10; k++) {
      const n = await page.evaluate(() => window.BRADY.Game.scene.constructor.name);
      if (n !== 'StoryScene') break;
      await page.mouse.click(874 / 2, 402 / 2); await page.waitForTimeout(450);
    }
  }
  const mapName = await page.evaluate(() => window.BRADY.Game.scene.constructor.name);
  check('card + story lead to the overworld map', /Map/.test(mapName), mapName);
  await page.screenshot({ path: path.join(shots, 'map.png') });
  const started = await page.evaluate(() => { window.BRADY.WorldGame.play('41-1'); return { scene: window.BRADY.Game.scene.constructor.name, id: window.BRADY.Game.scene.id }; });
  check('the map starts 41-1', started.scene === 'Play' && started.id === '41-1', started);

  // 2. Walking and jumping
  const walk = await page.evaluate(() => { start(41, 1); clearEnemies(); const x0 = P().x; sim(1.0, { right: true }); const x1 = P().x; sim(0.04, { jump: true, jumpPressed: true }); const air = !P().onGround && P().vy < 0; sim(0.2, { jump: true }); sim(1.5); return { dx: x1 - x0, air, ground: P().onGround }; });
  check('Brady walks right', walk.dx > 150, walk);
  check('Brady jumps and lands', walk.air && walk.ground, walk);

  // 3. Stomp a six-day driver
  const stomp = await page.evaluate(() => {
    start(41, 1); clearEnemies();
    const g = S(), p = P();
    const en = new (ctor('driver'))(g, { x: p.cx, y: p.y + p.h, type: 'driver' });
    en.vx = 0; en.speed = 0; g.spawn(en);
    p.y -= 90; p.vy = 0;
    sim(0.6);
    return { dead: en.dead, score: window.BRADY.Save.data.score };
  });
  check('stomping a six-day driver defeats him', stomp.dead, stomp);

  // 4. Power-ups: mushroom grows Brady, liquor lets him throw, hits step down
  const power = await page.evaluate(() => {
    start(41, 1); clearEnemies();
    const p = P(), g = S();
    p.collect('coffee'); sim(0.8);
    const big = p.power === 1 && p.h === 54;
    p.collect('vinyl'); sim(0.8);
    const n0 = g.entities.filter(e => e.constructor.name === 'Disc').length;
    sim(0.05, { action: true, actionPressed: true });
    const n1 = g.entities.filter(e => e.constructor.name === 'Disc').length;
    p.kandi = 0;
    p.hurt({ x: p.x + 50, w: 10 }); const after1 = p.power; sim(2.2);
    p.hurt({ x: p.x + 50, w: 10 }); const after2 = p.power;
    return { big, throws: n1 > n0, after1, after2, h: p.h };
  });
  check('the mushroom makes Brady big', power.big, power);
  check('the liquor bottle throws puke balls', power.throws, power);
  check('getting hit steps power down', power.after1 === 1 && power.after2 === 0 && power.h === 28, power);

  // 5. The pack holds a spare power-up; tapping the HUD slot uses it
  const pack = await page.evaluate(() => {
    start(41, 1); clearEnemies();
    const B = window.BRADY, p = P(), g = S();
    p.pack = null;
    p.collect('coffee'); sim(0.8);
    p.collect('coffee');                 // already big: goes to the pack
    const stored = p.pack;
    p.kandi = 0; p.hurt({ x: p.x + 50, w: 10 }); sim(2.2);
    const small = p.power === 0;
    g.draw(B.Game.ctx);                  // the HUD lays out the pack slot
    const r = g.packRect;
    // a real touch on the slot
    const c = B.Game.canvas, rect = c.getBoundingClientRect();
    const ev = type => c.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', clientX: rect.left + r.x + r.w / 2, clientY: rect.top + r.y + r.h / 2, bubbles: true, cancelable: true }));
    ev('pointerdown'); sim(0.05); ev('pointerup'); sim(0.9);
    return { stored, small, usedBig: p.power === 1, packAfter: p.pack, rect: !!r, stickStill: !B.Input.stick.active };
  });
  check('a second power-up goes into the pack', pack.stored === 'coffee', pack);
  check('tapping the pack slot in the HUD uses the spare power-up', pack.small && pack.usedBig && !pack.packAfter && pack.rect && pack.stickStill, pack);

  // 6. Spin jump: tap jump again in mid-air to headbang; it breaks bricks below and bounces off fire
  const spin = await page.evaluate(() => {
    start(41, 1); clearStage(); openSky(); sim(0.3);
    const p = P(), g = S(), A = g.area;
    p.collect('coffee'); sim(0.8);
    sim(0.3, { jump: true, jumpPressed: true });               // jump and keep holding
    sim(0.04, { jump: true, jumpPressed: true }); const spinning = p.spin;   // tap again near the top
    sim(1.5);
    const landedClears = !p.spin;
    // a spinning landing on bricks breaks them
    const tx = Math.floor(p.cx / 32), ty = Math.floor((p.y + p.h) / 32) - 3;
    A.tiles[ty * A.W + tx] = 2; A.tiles[ty * A.W + tx + 1] = 2;
    p.y = (ty - 3) * 32 - p.h; p.vy = 0; p.onGround = false; p.spin = true;
    sim(1.0);
    const broke = A.tiles[ty * A.W + tx] === 0 || A.tiles[ty * A.W + tx + 1] === 0;
    return { spinning, landedClears, broke };
  });
  check('tapping jump in mid-air starts a headbang spin', spin.spinning && spin.landedClears, spin);
  check('a spin landing breaks bricks below', spin.broke, spin);
  const spinFire = await page.evaluate(() => {
    start(48, 2); clearStage(); openSky(); sim(0.2);
    const g = S(), p = P();
    const en = new (ctor('spinner'))(g, { x: p.cx + 120, y: p.y + p.h }); en.speed = 0; en.vx = 0; g.spawn(en);
    const test = spin => {
      en.ang = -Math.PI / 2;                              // a poi straight above his head
      const [px, py] = en.poi()[0];
      p.x = px - p.w / 2; p.y = py - p.h - 2; p.vy = 4 * 32; p.onGround = false; p.invuln = 0; p.kandi = 0; p.spin = spin; p.dead = false;
      const before = p.power; p.setPower(1, true); en.collidePlayer(p);
      return { bounced: p.vy < 0, hurt: p.power < 1 || p.dead };
    };
    const withSpin = test(true); p.invuln = 0;
    const without = test(false);
    return { withSpin, without };
  });
  check('a headbang bounces safely off fire poi (a plain stomp gets burned)', spinFire.withSpin.bounced && !spinFire.withSpin.hurt && spinFire.without.hurt, spinFire);

  // 7. Hitting a mystery block from below gives a glow stick
  const block = await page.evaluate(() => {
    start(41, 1); clearEnemies(); openSky(); sim(0.2);
    const g = S(), p = P(), A = g.area;
    const tx = Math.floor(p.cx / 32), ty = Math.floor(p.y / 32) - 3;
    A.tiles[ty * A.W + tx] = 3; A.contents[tx + ',' + ty] = 'pick';
    const picks0 = g.picks;
    sim(0.05, { jump: true, jumpPressed: true }); sim(0.6, { jump: true }); sim(0.8);
    return { used: A.tiles[ty * A.W + tx] === 4, picks: g.picks - picks0 };
  });
  check('bumping a mystery block pays out', block.used && block.picks >= 1, block);

  // 8. Falling in a pit costs a life and restarts
  const death = await page.evaluate(() => {
    start(41, 1);
    const lives0 = window.BRADY.Save.data.lives;
    const p = P(); p.y = S().area.H * 32 + 40;
    sim(0.1); const dying = p.dead;
    sim(4.0);
    const s2 = S();
    return { dying, lives0, lives1: window.BRADY.Save.data.lives, newScene: s2 !== null && s2.player !== p };
  });
  check('falling in a pit kills Brady and restarts the level', death.dying && death.lives1 === death.lives0 - 1 && death.newScene, death);

  // 9. Level clear → tally → results → the next node unlocks
  const clear = await page.evaluate(() => {
    start(41, 1); clearEnemies();
    const g = S(), p = P();
    const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret);
    p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4;
    sim(1.0, { right: true });
    const st1 = g.state;
    sim(6);
    const S0 = window.BRADY.Save.data;
    return { st1, st2: g.state, unlocked: !!S0.unlocked['41-2'], done: !!S0.done['41-1'] };
  });
  check('touching the Encore Gate clears the level', clear.st1 === 'clear', clear);
  check('tally ends on the results screen and the next level unlocks', clear.st2 === 'results' && clear.unlocked && clear.done, clear);
  await page.screenshot({ path: path.join(shots, 'results.png') });

  // 10. Pause menu
  const pause = await page.evaluate(() => { start(41, 1); window.BRADY.Input.pausePressed = true; sim(0.02); const p1 = S().paused; window.BRADY.Input.pausePressed = true; sim(0.02); return { p1, p2: S().paused }; });
  check('pause opens and closes', pause.p1 === true && pause.p2 === false, pause);

  // 11. Porta-potty portal into a bonus room
  const portal = await page.evaluate(() => {
    for (const id of ['41-1', '41-5', '42-1', '43-1', '43-2', '44-1', '45-1']) {
      const [w, i] = id.split('-').map(Number);
      start(w, i); clearEnemies();
      const g = S();
      const por = g.entities.find(e => e.constructor.name === 'Portal' && e.target && e.target.area !== g.area.idx);
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
  check('a porta-potty leads into a bonus room', portal.area === 1 && portal.bonus, portal);
  await page.screenshot({ path: path.join(shots, 'bonus.png') });

  // 12. A castle boss: wake, defeat, the door opens
  const boss = await page.evaluate(() => {
    start(41, 6); clearEnemies();
    const g = S(), p = P();
    const b = g.entities.find(e => e.boss);
    p.x = b.arenaX0 + 64; p.y = b.y + b.h - p.h - 4; p.vy = 0;
    sim(2.5);
    const woke = b.state !== 'sleep', name = b.name;
    const doorRow = Math.floor((b.floorY) / 32) - 1;
    const doorBefore = g.area.tiles[doorRow * g.area.W + b.doorX];
    for (let k = 0; k < 10 && b.hp > 0; k++) { b.hurtT = 0; b.state = 'fight'; b.damage(1); sim(0.3); }
    sim(2.5);
    const doorAfter = g.area.tiles[doorRow * g.area.W + b.doorX];
    return { woke, name, hp: b.hp, removed: b.remove, doorBefore, doorAfter, lock: g.bossLock };
  });
  check('the Head Greeter wakes when Brady enters the arena', boss.woke && /GREETER/.test(boss.name), boss);
  check('defeating the boss opens the exit door', boss.removed && boss.doorBefore === 5 && boss.doorAfter === 0 && boss.lock === null, boss);
  await page.screenshot({ path: path.join(shots, 'boss.png') });

  // 13. THE MAN: saucer phase, then he grows giant; beating him is the finale
  const man = await page.evaluate(() => {
    start(48, 5); clearEnemies();
    const g = S(), p = P();
    const b = g.entities.find(e => e.boss);
    p.x = b.arenaX0 + 64; p.y = b.floorY - p.h - 4; p.vy = 0; p.invuln = 99;
    sim(2.5);
    const p1 = b.phase;
    for (let k = 0; k < 3; k++) { b.hurtT = 0; b.vuln = true; b.hit('stomp', p); sim(0.3); }
    const p2 = b.phase;
    sim(3);
    const giant = b.giant;
    for (let k = 0; k < 6 && b.state !== 'dying'; k++) { b.hurtT = 0; b.state = 'fight'; b.vuln = true; b.hit('stomp', p); sim(0.2); }
    sim(4);
    const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret);
    p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; sim(1, { right: true }); sim(7);
    return { name: b.name, p1, p2, giant, dead: b.remove, state: g.state, beat: !!window.BRADY.Save.data.beatGame };
  });
  check('THE MAN fights from his saucer, then grows giant', man.name === 'THE MAN' && man.p1 === 1 && man.p2 === 2 && man.giant > 0.9, man);
  check('beating the Man clears the finale', man.dead && man.beat, man);
  await page.screenshot({ path: path.join(shots, 'man.png') });

  // 14. A secret exit opens the hidden path to a gift camp; the gift camp gives a permanent gift
  const secret = await page.evaluate(() => {
    const B = window.BRADY;
    start(41, 3);
    const g = S();
    const gate = g.level.areas.flatMap(a => a.spawns).find(s => s.type === 'gate' && s.secret);
    if (!gate) return { noGate: true };
    g.secretClear = 'world'; g.recordProgress();
    return { found: !!B.Save.data.secretExits['41-3'], opened: B.WorldGame.isUnlocked('41-7') };
  });
  check('the 41-3 secret exit opens Kandi Camp', secret.found && secret.opened, secret);
  const gift = await page.evaluate(() => {
    const B = window.BRADY; B.Save.data.gifts = {};
    start(41, 7); clearEnemies();
    const g = S(), p = P();
    const booth = g.entities.find(e => e.constructor.name === 'GiftBooth');
    p.x = booth.cx - p.w / 2; p.y = booth.y + booth.h - p.h - 2; sim(0.3);
    const got = !!(B.Save.data.gifts && B.Save.data.gifts.kandi);
    start(41, 1); const k = P().kandi;
    P().invuln = 0; P().hurt({ x: P().x + 40, w: 10 }); const stillAlive = !P().dead && P().kandi === 0;
    B.Save.data.gifts = {};
    return { got, kandi: k, stillAlive };
  });
  check('Kandi Camp grants kandi bracelets', gift.got, gift);
  check('kandi bracelets absorb the first hit of a level', gift.kandi === 1 && gift.stillAlive, gift);

  // 15. Haunted house: the key opens the locked door
  const haunt = await page.evaluate(() => {
    start(41, 4); clearEnemies();
    const g = S(), p = P();
    const key = g.entities.find(e => e.constructor.name === 'Key' && e.id === 'exit');
    const lock = g.entities.find(e => e.constructor.name === 'Lock' && e.id === 'exit');
    if (!key || !lock) return { missing: true };
    p.x = lock.x - p.w - 1; p.y = lock.y + lock.h - p.h - 1; sim(0.3, { right: true });
    const blocked = !lock.open;
    p.x = key.cx - p.w / 2; p.y = key.y; p.vy = 0; sim(0.2);
    const has = g.keys.has('exit');
    p.x = lock.x - p.w - 1; p.y = lock.y + lock.h - p.h - 1; sim(0.6, { right: true });
    return { blocked, has, open: lock.open };
  });
  check('a locked door stays shut without the key', haunt.blocked, haunt);
  check('the key opens the haunted house door', haunt.has && haunt.open, haunt);

  // 16. Swimming rises; geysers launch
  const swim = await page.evaluate(() => {
    start(45, 2);
    const p = P(); const y0 = p.y;
    for (let k = 0; k < 8; k++) { sim(0.02, { jump: true, jumpPressed: true }); sim(0.2, { jump: true }); }
    return { rose: y0 - p.y, inWater: p.inWater };
  });
  check('Brady swims upward in the hot pools', swim.inWater && swim.rose > 40, swim);
  const geyser = await page.evaluate(() => {
    start(45, 3); clearEnemies();
    const g = S(); const gy = g.entities.find(e => e.constructor.name === 'Geyser');
    if (!gy) return { none: true };
    const p = P(); p.x = gy.cx - p.w / 2; p.y = gy.y - p.h - 2; p.vy = 0; p.invuln = 10;
    let minY = p.y; for (let k = 0; k < 120 * 4; k++) { sim(1 / 120, { jump: true }); minY = Math.min(minY, p.y); }
    return { launched: gy.y - p.h - minY };
  });
  check('a geyser launches Brady high', geyser.none || geyser.launched > 150, geyser);

  // 17. Slothy, the bufo toad, the joint
  const sloth = await page.evaluate(() => {
    for (const id of ['41-1', '41-2', '41-5', '42-1']) {
      const [w, i] = id.split('-').map(Number); start(w, i); clearEnemies();
      const g = S(); const h = g.entities.find(e => e.constructor.name === 'Hammock');
      if (!h) continue;
      const p = P(); p.x = h.cx - p.w / 2; p.y = h.y + h.h - p.h; sim(0.3);
      const mounted = p.mounted;
      sim(0.02, { action: true, actionPressed: true }); sim(0.3);
      p.invuln = 0; p.kandi = 0; p.hurt(null); sim(0.2);
      return { id, mounted, afterHit: p.mounted, dead: p.state === 'dying', loose: g.entities.some(e => e.constructor.name === 'Hammock' && e.loose) };
    }
    return { none: true };
  });
  check('Brady rides Slothy and a hit knocks him off (not dead)', sloth.mounted && !sloth.afterHit && !sloth.dead && sloth.loose, sloth);
  const fly = await page.evaluate(() => {
    start(41, 1); clearEnemies(); const p = P();
    openSky(); sim(0.3);
    p.collect('bufo'); const y0 = p.y;
    sim(0.02, { jump: true, jumpPressed: true }); sim(1.0, { jump: true });
    const rose = y0 - p.y;
    start(41, 1); clearEnemies(); const p2 = P(); openSky(); sim(0.3); p2.collect('joint'); const y1 = p2.y;
    sim(1.6, {});
    return { rose, floaty: p2.floaty > 0, floatUp: y1 - p2.y };
  });
  check('the bufo toad lets Brady fly', fly.rose > 100, fly);
  check('the joint makes Brady float', fly.floaty && fly.floatUp > 30, fly);

  // 18. The baggies: Love Bomb befriends, K-Hole slows the world, Party Powder speeds, LSD reveals
  const bags = await page.evaluate(() => {
    start(41, 1); clearEnemies(); openSky(); sim(0.2);
    const g = S(), p = P();
    p.collect('molly');
    const en = new (ctor('driver'))(g, { x: p.cx + 4, y: p.y + p.h });
    en.speed = 0; en.vx = 0; g.spawn(en); sim(0.2);
    const friend = !!en.friendT && !p.dead;
    p.fx.molly = 0;
    p.collect('khole'); const slow = g.worldScale();
    p.fx.khole = 0;
    start(41, 1); clearEnemies(); const q = P(); openSky(); sim(0.2);
    let x0 = q.x; sim(1.2, { right: true, action: true }); const plain = q.x - x0;
    start(41, 1); clearEnemies(); const r = P(); openSky(); sim(0.2); r.collect('powder');
    x0 = r.x; sim(1.2, { right: true, action: true }); const fast = r.x - x0;
    r.collect('lsd');
    return { friend, slow, plain, fast, lsd: r.fx.lsd > 0 || r.pack === 'lsd' };
  });
  check('Love Bomb turns a burner into a dancing friend', bags.friend, bags);
  check('K-Hole slows the world down', bags.slow < 0.5, bags);
  check('Party Powder makes Brady faster', bags.fast > bags.plain * 1.15, bags);
  check('LSD can be picked up', bags.lsd, bags);

  // 19. A greeter's hug: wriggle free by mashing jump
  const hug = await page.evaluate(() => {
    start(41, 1); clearEnemies(); sim(0.2);
    const g = S(), p = P();
    const gr = new (ctor('greeter'))(g, { x: p.cx + 40, y: p.y + p.h, dir: -1 }); g.spawn(gr);
    p.invuln = 0; p.kandi = 0; gr.vx = 0;
    p.x = gr.x - p.w + 4; p.y = gr.y + gr.h - p.h; sim(0.1);
    const grabbed = !!p.grabbedBy;
    for (let k = 0; k < 6; k++) { sim(0.02, { jump: true, jumpPressed: true }); sim(0.05); }
    return { grabbed, free: !p.grabbedBy, alive: !p.dead };
  });
  check('a greeter hug grabs Brady and mashing frees him', hug.grabbed && hug.free && hug.alive, hug);

  // 20. Every level loads, runs for a few seconds and renders
  const all = await page.evaluate(() => {
    const B = window.BRADY, bad = [];
    let n = 0;
    for (const w of B.WORLD3_REGIONS) for (let i = 1; i <= B.WORLDS[w].plan.length; i++) {
      n++;
      try { start(w, i); sim(1.5, { right: true }); sim(0.5, { right: true, jump: true, jumpPressed: true }); B.Game.scene.draw(B.Game.ctx); }
      catch (e) { bad.push(w + '-' + i + ': ' + e.message); }
    }
    return { n, bad };
  });
  check(`all ${all.n} Super Brady-O World levels load, simulate and render`, all.n === 60 && all.bad.length === 0, all.bad.slice(0, 5));
  check('no page errors', errors.length === 0, errors.slice(0, 5));
  console.log(failures ? `${failures} FAILURES` : 'ALL CHECKS PASSED');
  await browser.close();
})();
