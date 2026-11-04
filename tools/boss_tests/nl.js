// Amsterdam 8-5: the Cheese King. Cheese-wheel volley: he rolls Gouda wheels down the loft ramps; Brady runs into
// a wheel to kick it back (or stomps it to launch it) and a returned wheel knocks him off his throne. Stomps bounce.
module.exports = async ({ page, check, shot }) => {
  const r = await page.evaluate(() => {
    const out = {}, TSZ = 32;
    start('8-5'); clearEnemies();
    const g = S(), p = P(), b = boss(); window.__nlBoss = b;
    out.hatches = g.entities.filter(e => e.constructor.name === 'NlHatch').length;
    enterArena(); p.invuln = 99;
    out.woke = b.state === 'fight'; out.name = b.name; out.hp0 = b.hp;
    // a stomp on the crown bounces off
    b.go('walk'); sim(0.05); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; sim(0.5); out.stompHp = b.hp;
    const wheels = () => g.entities.filter(e => e.prop && e.cfg.wheel && !e.remove);
    const clearW = () => { for (const w of wheels()) w.remove = true; sim(0.02); };
    // he pulls the rope: the hatch rattles (the tell), then a wheel rolls down the ramp toward Brady
    p.x = b.arenaX0 + 3 * TSZ; p.y = b.floorY - p.h; p.vy = 0;
    b.go('roll'); sim(0.3); out.tell = !!g.entities.find(e => e.constructor.name === 'NlHatch' && e.arm > 0);
    let n = 0; while (!wheels().length && n++ < 300) sim(1 / 120);
    let w = wheels()[0]; out.wheelOut = !!w;
    n = 0; while (w && !(w.onGround && w.cx < b.x - 3 * TSZ) && n++ < 600) sim(1 / 120);
    out.rolling = !!w && w.onGround && w.vx < -60 && w.thrownBy === b;
    // the King's own wheel passing him does nothing; Brady runs into it and kicks it back; it knocks him off the throne
    const hpBefore = b.hp;
    p.x = w.x - p.w - 50; p.y = b.floorY - p.h; p.vy = 0; n = 0; while (w.thrownBy !== p && n++ < 240) sim(1 / 120, { right: true });
    out.kicked = w.thrownBy === p && w.vx > 0;
    n = 0; while (b.hp === hpBefore && n++ < 600) sim(1 / 120);
    out.hitHp = b.hp; out.knocked = b.act === 'knocked'; out.hpBefore = hpBefore;
    sim(2.5); out.backOnThrone = b.act === 'walk' || b.act === 'roll' || b.act === 'quake' || b.act === 'climb';
    // the bike bell stops a rolling wheel
    clearW(); p.collect('sig:bike'); b.go('roll'); n = 0; while (!wheels().length && n++ < 300) sim(1 / 120); w = wheels()[0];
    n = 0; while (w && !(w.onGround && w.cx < b.x - 3 * TSZ) && n++ < 600) sim(1 / 120);
    p.x = w.cx - 3 * TSZ - p.w; p.y = b.floorY - p.h; p.vy = 0; sim(0.05, { actionPressed: true }); sim(0.1);
    out.belled = !!w && w.stunT > 0 && Math.abs(w.vx) < 60; p.sig = null; clearW();
    // phase 2 came with the first hit: the floor froze and the left ramp is live
    out.phase2 = b.phase === 2;
    const row = b.floorY / 32; let ice = 0; for (let tx = Math.floor(b.arenaX0 / 32); tx < Math.floor(b.arenaX1 / 32); tx++) if (g.area.tiles[row * g.area.W + tx] === 11) ice++;
    out.ice = ice;
    let fromLeft = false; for (let k = 0; k < 2 && !fromLeft; k++) { b.go('roll'); sim(1.0); fromLeft = wheels().some(e => e.vx > 0 && e.cx < b.arenaX0 + 8 * TSZ); clearW(); }
    out.leftRamp = fromLeft;
    return out;
  });
  check('the Cheese King wakes when Brady walks in; two loft hatches wait at the top of the ramps', r.woke && /CHEESE/.test(r.name) && r.hatches >= 2, r);
  check('stomping his crown bounces off', r.stompHp === r.hp0, r);
  check('the rope-pull tell rattles the hatch, then a wheel rolls down the ramp at Brady', r.tell && r.wheelOut && r.rolling, r);
  check('running into the wheel kicks it back, and the returned wheel knocks him off his throne', r.kicked && r.hitHp === r.hpBefore - 1 && r.knocked, r);
  check('he climbs back onto the throne', r.backOnThrone, r);
  check('the bike bell stops a rolling wheel', r.belled, r);
  check('phase 2: the canal floor freezes and the left ramp rolls wheels too', r.phase2 && r.ice >= 8 && r.leftRamp, r);
  const r2 = await page.evaluate(() => {
    const out = {}, g = S(), p = P(), b = boss();
    b.damage(1); sim(3);
    out.phase3 = b.phase === 3 && !!b.plat; let n = 0; while (b.act !== 'walk' && n++ < 1500) sim(1 / 120); let yMin = b.y, yMax = b.y; for (let k = 0; k < 480; k++) { sim(1 / 120); yMin = Math.min(yMin, b.y); yMax = Math.max(yMax, b.y); } out.rides = yMax - yMin > 40 && Math.abs(b.y - (b.plat.y - b.h)) < 8;
    // wait for the bridge to be up, then down: a wheel only reaches him when he is down
    n = 0; while (b.plat.y > b.floorY - 60 && n++ < 1200) sim(1 / 120); out.up = b.plat.y <= b.floorY - 60;
    b.go('roll'); sim(0.9); p.x = b.arenaX0 + 4 * 32; p.y = b.floorY - p.h; p.vy = 0;
    return out;
  });
  check('phase 3: the throne rides a drawbridge up and down', r2.phase3 && r2.rides && r2.up, r2);
  await page.waitForTimeout(120);
  await shot('nl-01-cheese-king-bridge.png');
  const r3 = await page.evaluate(() => {
    const out = {}, g = S(), p = P(), b = boss();
    const wheels = () => g.entities.filter(e => e.prop && e.cfg.wheel && !e.remove);
    // a kicked wheel while the bridge is up passes under him; when it comes down, the volley lands
    for (const w of wheels()) w.remove = true; sim(0.02);
    const hp = b.hp;
    const volley = () => { const w = spawnAt('nlGouda', b.cx - 6 * 32, b.floorY); w.fling(9 * 32, -2 * 32, p); let n = 0; while (!w.remove && n++ < 300) sim(1 / 120); };
    let n = 0; while (b.plat.y > b.floorY - 60 && n++ < 1200) sim(1 / 120); volley(); out.missedUp = b.hp === hp;
    n = 0; while (b.plat.y < b.floorY - 12 && n++ < 1200) sim(1 / 120); volley(); out.hitDown = b.hp === hp - 1;
    sim(3); n = 0; while (b.plat.y < b.floorY - 12 && n++ < 1200) sim(1 / 120); if (b.act !== 'walk') { n = 0; while (b.act !== 'walk' && n++ < 1200) sim(1 / 120); n = 0; while (b.plat.y < b.floorY - 12 && n++ < 1200) sim(1 / 120); }
    volley(); out.buried = b.act === 'buried' && b.hp <= 0.01; sim(1.2);
    out.pile = wheels().length;
    return out;
  });
  check('with the bridge up a returned wheel passes under him; when it is down the volley lands', r3.missedUp && r3.hitDown, r3);
  check('the last wheel buries him under his own cheese', r3.buried && r3.pile >= 3, r3);
  await page.waitForTimeout(120);
  await shot('nl-02-cheese-king-buried.png');
  const r4 = await page.evaluate(() => {
    const g = S(), p = P(), b = window.__nlBoss; const doorX = b.doorX, row = b.floorY / 32 - 1;
    sim(6);
    const out = { removed: !!b.remove, door: g.area.tiles[row * g.area.W + doorX] === 0 };
    p.x = (doorX + 8) * 32; p.y = b.floorY - p.h; p.vy = 0; sim(2.5); out.state = g.state;
    return out;
  });
  check('the Cheese King is gone, the door opens and the level can be finished', r4.removed && r4.door && /clear|tally|results/.test(r4.state), r4);
};
