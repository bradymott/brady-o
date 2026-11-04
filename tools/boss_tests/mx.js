// Mexico 1-5: El Gran Piñatón. Break the piñata from below: stomps bounce, headbutts land; the rope shortens
// (phase 2, cones and blindfold dark pulses); the rope snaps and he rolls as a spiky ball (phase 3): stomp him dizzy.
module.exports = async ({ page, check, shot }) => {
  await page.evaluate(() => {
    const TS = 32;
    window.waitFor = (fn, max) => { const n = Math.round((max || 5) * 120); for (let k = 0; k < n; k++) { if (fn()) return true; sim(1 / 120); } return !!fn(); };
    // Brady drops onto the boss (tracking him); true if he bounced off
    window.stompBoss = (b, p) => { let bounced = false; p.y = b.y - p.h - 4; p.vy = 4 * TS; p.vx = 0; for (let k = 0; k < 60; k++) { if (b.hurtT > 0) break; if (k < 20) p.x = b.cx - p.w / 2; sim(1 / 120); if (p.vy < -8 * TS) bounced = true; } return bounced; };
    // Brady headbutts the boss from underneath
    window.bumpBoss = (b, p) => { for (let k = 0; k < 120; k++) { if (b.hurtT > 0) return true; p.x = b.cx - p.w / 2; p.y = b.y + b.h + 2; p.vy = -9 * TS; sim(1 / 120); } return false; };
    window.doorTile = (b) => { const g = S(); const row = Math.floor(b.floorY / TS) - 1; return g.area.tiles[row * g.area.W + b.doorX]; };
    window.finish = () => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; sim(1, { right: true }); sim(8); return g.state; };
  });
  // (a) wake: the piñata is hoisted up the pulley rope when Brady walks in
  const a = await page.evaluate(() => {
    start('1-5'); clearEnemies(); const p = P(); p.invuln = 99; const b = (window.B1 = enterArena(64));
    waitFor(() => b.act === 'swing', 3);
    const rail = S().entities.some(e => e.constructor.name === 'MxRail');
    return { state: b.state, hang: b.hang, act: b.act, rail, aboveFloor: b.y + b.h < b.floorY - 2 * 32, name: b.name };
  });
  check('Piñatón wakes, is hoisted onto the pulley rail and swings', a.state === 'fight' && a.hang && a.act === 'swing' && a.rail && a.aboveFloor && /PIÑAT/.test(a.name), a);
  // (b) the mechanic: a stomp bounces off (no damage); a headbutt from below lands
  const b1 = await page.evaluate(() => {
    const b = boss(), p = P(); const hp0 = b.hp;
    const bounced = stompBoss(b, p); sim(0.3); const afterStomp = b.hp;
    const hit = bumpBoss(b, p); sim(0.3);
    return { hp0, bounced, afterStomp, hit, hp: b.hp, phase: b.phase, doorBefore: doorTile(b) };
  });
  check('stomping the hanging piñata bounces off and does nothing', b1.bounced && b1.afterStomp === b1.hp0, b1);
  check('a headbutt from below breaks the piñata (one hit) and starts phase 2', b1.hit && b1.hp === b1.hp0 - 1 && b1.phase === 2, b1);
  // candy is collectible: his spit drops candies and Brady picks one up for points
  const candy = await page.evaluate(() => {
    const b = boss(), p = P(), g = S(); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; p.vy = 0;
    waitFor(() => b.act === 'spit' && b.fired, 12); sim(0.1);
    const n = g.entities.filter(e => e.constructor.name === 'MxCandy' && !e.remove).length;
    const c = g.entities.find(e => e.constructor.name === 'MxCandy' && !e.remove); const s0 = window.BRADY.Save.data.score;
    if (c) { c.x = p.x; c.y = p.y + 10; c.vx = 0; c.vy = 0; sim(0.05); }
    return { n, gained: window.BRADY.Save.data.score - s0, gone: c ? c.remove : false };
  });
  check('he spits candy and Brady collects it for points', candy.n > 0 && candy.gone && candy.gained >= 100, candy);
  // (c) phase 2: the rope is shorter (he hangs higher), he throws cones and the lights go blindfold-dark in pulses
  const ph2 = await page.evaluate(() => {
    const b = boss(), g = S(), p = P(); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h;
    waitFor(() => Math.abs(b.rope - b.ropeTarget) < 2, 3);
    const high = b.y + b.h < b.floorY - 5 * 32;
    const cones = waitFor(() => g.entities.some(e => e.kind === 'cone'), 10);
    const dark = waitFor(() => b.act === 'blind' && b.at > 0.7, 10) && g.area.dark === true;
    sim(1.2); const litAgain = g.area.dark === false;
    return { high, cones, dark, litAgain, rope: Math.round(b.rope) };
  });
  check('phase 2: the rope shortens, he throws cones and the patio goes dark in a short pulse', ph2.high && ph2.cones && ph2.dark && ph2.litAgain, ph2);
  await page.evaluate(() => { const b = boss(); waitFor(() => b.act === 'cones' && b.at > 0.8, 10); });
  await shot('mx-1-high-swing.png');
  // two more headbutts: the rope snaps (phase 3) and he drops to the floor as a spiky ball
  const ph3 = await page.evaluate(() => {
    const b = boss(), p = P(); p.invuln = 99;
    bumpBoss(b, p); sim(1.2); const hpMid = b.hp;
    bumpBoss(b, p); sim(0.2);
    const snapped = b.phase === 3 && !b.hang;
    waitFor(() => b.act === 'roll', 4);
    // a stomp on the rolling spiky ball does nothing to him
    const hpRoll = b.hp; stompBoss(b, p); sim(0.2);
    return { hpMid, snapped, act: b.act, hpRoll, hpAfterRollStomp: b.hp };
  });
  check('phase 3: the rope snaps, he rolls as a spiky ball and stomping the ball does not hurt him', ph3.hpMid === 2 && ph3.snapped && ph3.hpRoll === 1 && ph3.hpAfterRollStomp === 1, ph3);
  // (d) beaten through the mechanic: stomp him while he is dizzy from the wall; candy rain; the door opens
  const fin = await page.evaluate(() => {
    const b = boss(), p = P(), g = S(); p.invuln = 99;
    const dizzy = waitFor(() => b.act === 'dizzy', 8);
    stompBoss(b, p); sim(0.1);
    const burst = b.act === 'burst'; sim(0.9);
    const candies = g.entities.filter(e => e.constructor.name === 'MxCandy' && !e.remove).length;
    return { dizzy, burst, hp: b.hp, candies, banner: g.bannerText };
  });
  check('dizzy against the wall he takes the final stomp and bursts into a candy rain', fin.dizzy && fin.burst && fin.hp <= 0.01 && fin.candies > 20 && /PIÑATA/.test(fin.banner), fin);
  // (e) the spectacular moment
  await shot('mx-2-candy-rain.png');
  const door = await page.evaluate(() => { const b = B1; const before = doorTile(b); sim(4.5); const after = doorTile(b); const removed = b.remove; const state = finish(); return { before, after, removed, state }; });
  check('Piñatón is gone, the door opens and Brady leaves the hacienda', door.before === 5 && door.after === 0 && door.removed && door.state === 'results', door);
};
