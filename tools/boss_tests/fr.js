// France 7-5: Le Grand Soufflé. The oven and the mirrors: stomps bounce off the puff; Brady bumps both wall mirrors
// from below (from the balcony under each one) so they aim at the oven, the oven charges and flashes, and the soufflé is baked if it is in the light.
module.exports = async ({ page, check, shot }) => {
  const r = await page.evaluate(() => {
    const out = {}, TSZ = 32;
    start('7-5');
    // the ballroom is its own area (v2 LAIR): go through the ballroom door
    { const g0 = S(), ai = g0.level.areas.findIndex(a => a.role === 'arena'), door = g0.entities.find(e => e.s && e.s.target && e.s.target.area === ai); if (door) { g0.enterPortal(door); sim(2); } }
    clearEnemies();
    const g = S(), p = P(), b = boss(); window.__frBoss = b;
    const oven = g.entities.find(e => e.constructor.name === 'FrOven'), ms = g.entities.filter(e => e.constructor.name === 'FrMirror' && Math.abs(e.cx - oven.cx) < 20 * TSZ);
    out.room = !!oven && ms.length === 2;
    enterArena(); p.invuln = 99;
    out.woke = b.state === 'fight'; out.name = b.name; out.hp0 = b.hp;
    // a stomp on the puff bounces off
    b.go('walk'); sim(0.05); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; sim(0.5); out.stompHp = b.hp;
    // Brady jumps under the left mirror: it tilts up (aimed). One mirror alone does nothing
    // (the soufflé trails Brady, so the test parks it at the far wall first: in play you dodge it)
    // the mirrors hang too high to reach from the floor: Brady jumps from the balcony under each one
    const fromFloor = m => { p.x = m.cx - p.w / 2; p.y = b.floorY - p.h; p.vy = 0; p.vx = 0; sim(0.3); sim(0.05, { jumpPressed: true, jump: true }); sim(0.7, { jump: true }); sim(0.4); return m.aimed; };
    const bump = m => { b.x = m.side === 'left' ? b.arenaX1 - 4 * TSZ : b.arenaX0 + 2 * TSZ; b.go('walk'); p.x = m.cx - p.w / 2; p.y = b.floorY - 3 * TSZ - p.h; p.vy = 0; p.vx = 0; sim(0.3); sim(0.05, { jumpPressed: true, jump: true }); sim(0.7, { jump: true }); sim(0.4); return m.aimed; };
    const L = ms.find(m => m.side === 'left'), R = ms.find(m => m.side === 'right');
    b.x = b.arenaX1 - 4 * TSZ; out.floorMiss = !fromFloor(L);
    out.aimL = bump(L); sim(0.3); out.oneOnly = oven.state === 'idle';
    // the second mirror: both aimed, the oven charges; the soufflé freezes in the light and is baked at the flash
    out.aimR = bump(R); sim(0.1); out.charge = oven.state === 'charge';
    b.x = oven.cx - b.w / 2; p.x = oven.cx + 5 * TSZ; p.y = b.floorY - p.h; p.vy = 0;
    let n = 0; const f0 = oven.flashes; while (oven.flashes === f0 && n++ < 400) sim(1 / 120);
    out.panic = b.act === 'collapse' || b.act === 'panic'; out.bakedHp = b.hp; out.phase2 = b.phase === 2; out.drooped = !L.aimed && !R.aimed;
    // phase 2: the meringue walls appear
    sim(3); b.go('wall'); sim(0.3); out.meringue = g.entities.some(e => e.meringue && !e.remove);
    return out;
  });
  check('the ballroom has the oven and two mirrors; the soufflé wakes when Brady walks in', r.room && r.woke && /SOUFFL/.test(r.name), r);
  check('stomping the puff bounces off', r.stompHp === r.hp0, r);
  check('a mirror is out of reach from the floor; a jump from its balcony aims it; one mirror alone does not fire the oven', r.floorMiss && r.aimL && r.oneOnly, r);
  check('both mirrors aimed: the oven charges', r.aimR && r.charge, r);
  check('the flash bakes the soufflé standing in the light (damage), the mirrors droop again', r.bakedHp === r.hp0 - 1 && r.drooped && r.panic, r);
  check('phase 2: meringue walls', r.phase2 && r.meringue, r);
  const r2 = await page.evaluate(() => {
    const out = {}, g = S(), p = P(), b = boss(), TSZ = 32;
    const oven = g.entities.find(e => e.constructor.name === 'FrOven'), ms = g.entities.filter(e => e.constructor.name === 'FrMirror' && Math.abs(e.cx - oven.cx) < 20 * TSZ);
    b.damage(1); sim(2); b.damage(1); sim(1.5);
    const decoys = () => g.entities.filter(e => e.constructor.name === 'FrDecoy' && !e.remove);
    out.phase3 = b.phase === 3; out.decoys = decoys().length;
    // a stomped decoy pops; the real one still bounces
    const d = decoys()[0]; if (d) { p.x = d.cx - p.w / 2; p.y = d.y - p.h - 30; p.vy = 0; sim(0.5); out.popped = !!d.remove; }
    // (Brady waits on the right gallery so he does not land on the newcomer)
    p.x = b.arenaX1 - 9 * TSZ + 16 - p.w / 2; p.y = b.floorY - 4 * TSZ - p.h; p.vy = 0; let w = 0; while (decoys().length < 2 && w++ < 960) sim(1 / 120); out.respawn = decoys().length === 2;
    // the oven again, with the real one in the light and a decoy elsewhere: only the real one takes the hit
    for (const m of ms) m.bump(); b.x = oven.cx - b.w / 2; for (const e of decoys()) e.x = oven.cx - 8 * TSZ; p.x = oven.cx + 5 * TSZ; p.y = b.floorY - p.h; p.vy = 0;
    sim(0.9); out.beams = oven.state === 'charge';
    return out;
  });
  check('phase 3: two decoys; a stomped one pops and comes back', r2.phase3 && r2.decoys === 2 && r2.popped && r2.respawn, r2);
  check('the oven charges again with three soufflés in the hall', r2.beams, r2);
  await page.waitForTimeout(120);
  await shot('fr-01-souffle-oven.png');
  const r3 = await page.evaluate(() => {
    const out = {}, g = S(), p = P(), b = window.__frBoss, TSZ = 32;
    const oven = g.entities.find(e => e.constructor.name === 'FrOven'), ms = g.entities.filter(e => e.constructor.name === 'FrMirror' && Math.abs(e.cx - oven.cx) < 20 * TSZ);
    // (the page's own clock runs on during screenshots, so the hit count is measured from here)
    const hp = b.hp;
    const bake = () => { for (const m of ms) m.bump(); b.go('walk'); sim(0.05); const f0 = oven.flashes; let n = 0; while (oven.flashes === f0 && n++ < 900) { b.x = oven.cx - b.w / 2; p.x = oven.cx + 5 * TSZ; p.y = b.floorY - p.h; sim(1 / 120); } };
    bake(); out.hp3 = b.hp; out.hpBefore = hp;
    // the last hit: he deflates with a long whistle
    if (b.hp > 0.01) { sim(3.5); bake(); }
    out.deflate = b.act === 'deflate' && b.hp <= 0.01; out.decoysGone = !g.entities.some(e => e.constructor.name === 'FrDecoy' && !e.remove);
    sim(0.6);
    return out;
  });
  check('in phase 3 only the real soufflé is baked', r3.hp3 === r3.hpBefore - 1, r3);
  check('the last bake deflates him and the decoys pop', r3.deflate && r3.decoysGone, r3);
  await page.waitForTimeout(120);
  await shot('fr-02-souffle-deflate.png');
  const r4 = await page.evaluate(() => {
    const g = S(), p = P(), b = window.__frBoss; const doorX = b.doorX, row = b.floorY / 32 - 1;
    sim(6);
    const out = { removed: !!b.remove, door: g.area.tiles[row * g.area.W + doorX] === 0 };
    p.x = (doorX + 8) * 32; p.y = b.floorY - p.h; p.vy = 0; sim(2.5); out.state = g.state;
    return out;
  });
  check('the soufflé is gone, the door opens and the level can be finished', r4.removed && r4.door && /clear|tally|results/.test(r4.state), r4);
};
