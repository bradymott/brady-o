// Brazil 3-5: O Tucanão. Only a football reaches him: kick one along the floor into his low swoop, or stomp a
// ball to volley it up. A ball knocks him out of the air (stagger: stomp bonus). Phase 2 he dives on the beat
// and gets his beak stuck (bump from below hurts double); phase 3 toucanitos and a cracking pitch. GOOOOL.
module.exports = async ({ page, check, shot }) => {
  await page.evaluate(() => {
    const TS = 32;
    window.waitFor = (fn, max) => { const n = Math.round((max || 5) * 120); for (let k = 0; k < n; k++) { if (fn()) return true; sim(1 / 120); } return !!fn(); };
    window.stompBoss = (b, p) => { let bounced = false; p.y = b.y - p.h - 4; p.vy = 4 * TS; p.vx = 0; for (let k = 0; k < 60; k++) { if (b.hurtT > 0) break; if (k < 20) p.x = b.cx - p.w / 2; sim(1 / 120); if (p.vy < -8 * TS) bounced = true; } return bounced; };
    window.bumpBoss = (b, p) => { for (let k = 0; k < 120; k++) { if (b.hurtT > 0) return true; p.x = b.cx - p.w / 2; p.y = b.y + b.h + 2; p.vy = -9 * TS; sim(1 / 120); } return false; };
    window.doorTile = (b) => { const g = S(); const row = Math.floor(b.floorY / TS) - 1; return g.area.tiles[row * g.area.W + b.doorX]; };
    window.finish = () => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; sim(1, { right: true }); sim(8); return g.state; };
    window.balls = () => S().entities.filter(e => e.constructor.name === 'BrFootball' || (e.prop && e.cfg && e.cfg.kick === 9)).filter(e => !e.remove);
    window.newBall = (x, y) => { const C = ctor('brFootball'); const e = new C(S(), { x, y }); S().spawn(e); return e; };
    // 3-5 is a v2 lair: the players' tunnel first, then the pitch (the area with role 'arena')
    window.startArena = (id) => { start(id); const g = S(); const k = g.level.areas.findIndex(a => a.role === 'arena'); if (k >= 0 && g.area !== g.rt[k]) { const an = g.level.areas[k].anchors.in; g.loadArea(k, an.x, an.y); sim(0.5); } };
  });
  // (a) wake: he takes to the air over the pitch; the ball cannon starts serving balls
  const a = await page.evaluate(() => {
    startArena('3-5'); clearEnemies(); const p = P(); p.invuln = 99; const b = (window.B1 = enterArena(64));
    const cannon = S().entities.some(e => e.constructor.name === 'BrBallCannon');
    waitFor(() => balls().length > 0, 4);
    return { state: b.state, act: b.act, cannon, balls: balls().length, high: b.y + b.h < b.floorY - 3 * 32, name: b.name };
  });
  check('O Tucanão wakes and flies; the ball cannon serves footballs onto the pitch', a.state === 'fight' && a.cannon && a.balls > 0 && a.high && /TUCAN/.test(a.name), a);
  // (b) the mechanic: stomps bounce off; the cannon's own balls do nothing; a ball Brady kicks knocks him down
  const b1 = await page.evaluate(() => {
    const b = boss(), p = P(); const hp0 = b.hp; p.x = b.arenaX0 + 100; p.y = b.floorY - p.h;
    b.go('fly'); sim(0.05); const bounced = stompBoss(b, p); sim(0.2); const afterStomp = b.hp;
    // a cannon ball (nobody kicked it) flies through him
    const loose = newBall(b.cx, b.y + b.h + 10); loose.fling(0, -9 * 32, null); sim(0.5); const afterLoose = b.hp;
    // Brady's kick: he swoops low along the floor, the ball rolls into his face
    p.x = b.arenaX0 + 60; p.y = b.floorY - p.h; b.go('aim'); const swooping = waitFor(() => b.act === 'swoop', 4);
    const ball = newBall(b.cx + b.side * 5 * 32, b.floorY); ball.kick(-b.side, p);
    const hit = waitFor(() => b.hurtT > 0, 1.5); const floored = waitFor(() => b.act === 'stagger', 3);
    return { hp0, bounced, afterStomp, afterLoose, swooping, hit, floored, hp: b.hp, phase: b.phase };
  });
  check('stomps bounce off the toucan and the cannon\'s own balls do not count', b1.bounced && b1.afterStomp === b1.hp0 && b1.afterLoose === b1.hp0, b1);
  check('a ball Brady kicks into his low swoop knocks him to the floor (phase 2 starts)', b1.swooping && b1.hit && b1.floored && b1.hp === b1.hp0 - 1 && b1.phase === 2, b1);
  await shot('br-1-floored.png');
  // the bonus: while he staggers on the floor a stomp lands
  const bonus = await page.evaluate(() => { const b = boss(), p = P(); waitFor(() => b.hurtT <= 0, 2); const hp0 = b.hp, staggering = b.act === 'stagger'; stompBoss(b, p); sim(0.2); return { hp0, staggering, hp: b.hp }; });
  check('a stomp lands while he staggers (bonus hit)', bonus.hp === bonus.hp0 - 1, bonus);
  // the volley: a stomped ball rockets straight up
  const volley = await page.evaluate(() => {
    const b = boss(), p = P(); p.x = b.arenaX0 + 200; p.y = b.floorY - p.h; sim(0.3);
    const ball = newBall(p.cx, b.floorY); sim(0.1); p.x = ball.cx - p.w / 2; p.y = ball.y - p.h - 2; p.vy = 4 * 32;
    waitFor(() => ball.volley, 0.5); const vy = ball.vy; sim(0.5);
    return { volley: ball.volley, vy: Math.round(vy / 32), high: ball.y < b.floorY - 3 * 32 };
  });
  check('stomping a ball volleys it high into the air', volley.volley && volley.vy <= -15 && volley.high, volley);
  // (c) phase 2: he dives on the beat; stuck on a ledge, a bump from below hurts him double (phase 3)
  const ph2 = await page.evaluate(() => {
    const b = boss(), p = P(), g = S(); p.invuln = 99;
    const x0 = Math.round(b.arenaX0 / 32), GY = Math.round(b.floorY / 32);
    p.x = (x0 + 3) * 32; p.y = (GY - 5) * 32 - p.h; p.vy = 0; sim(0.3);
    waitFor(() => b.act === 'fly', 6); b.go('dive'); const stuck = waitFor(() => b.act === 'stuck', 5);
    const onLedge = Math.abs((b.y + b.h) - (GY - 5) * 32) < 3; const hp0 = b.hp;
    const bumped = bumpBoss(b, p); sim(0.3);
    return { stuck, onLedge, hp0, bumped, hp: b.hp, phase: b.phase };
  });
  check('phase 2: he dives on the beat and gets his beak stuck; a bump from below hurts him double', ph2.stuck && ph2.bumped && ph2.hp === ph2.hp0 - 2 && ph2.phase === 3, ph2);
  const ph3 = await page.evaluate(() => {
    const b = boss(), g = S(), p = P(); p.x = b.arenaX0 + 100; p.y = b.floorY - p.h;
    const cracks = g.entities.filter(e => e.constructor.name === 'BrCrack').length;
    const x0 = Math.round(b.arenaX0 / 32), GY = Math.round(b.floorY / 32);
    sim(1.6); const pit = g.area.tiles[GY * g.area.W + x0 + 9] === 0 && g.area.tiles[GY * g.area.W + x0 + 15] === 0;
    // the toucanitos are an anonymous TourFlyer class: spot them by their config
    const flock = waitFor(() => g.entities.filter(e => e.cfg && e.cfg.swoop && e.cfg.burst === '#ffd23a' && !e.remove).length >= 2, 6);
    return { cracks, pit, flock };
  });
  check('phase 3: the pitch cracks open into pits and a flock of toucanitos joins in', ph3.cracks === 2 && ph3.pit && ph3.flock, ph3);
  // (d) the last ball: GOOOOL into the net, the door opens
  const fin = await page.evaluate(() => {
    const b = boss(), p = P(), g = S(); p.invuln = 99;
    while (b.hp > 1.01) { b.hurtT = 0; b.damage(1); sim(0.3); }
    b.hurtT = 0; b.damage(1); sim(0.3);
    const goal = b.act === 'goal'; const before = doorTile(b);
    waitFor(() => b.netted, 4); sim(0.3);
    return { goal, before, banner: g.bannerText, netted: b.netted, nearNet: b.cx > b.arenaX1 - 4 * 32 };
  });
  check('the last ball sends him flying into the goal net: GOOOOL', fin.goal && fin.netted && fin.nearNet && /GOOO/.test(fin.banner), fin);
  await shot('br-2-goooool.png');
  const door = await page.evaluate(() => { const b = B1; const before = doorTile(b); waitFor(() => b.remove, 6); const after = doorTile(b); const state = finish(); return { before, after, state }; });
  check('the door opens and Brady leaves the warehouse', door.before === 5 && door.after === 0 && door.state === 'results', door);
};
