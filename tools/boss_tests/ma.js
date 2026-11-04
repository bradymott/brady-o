// Morocco 5-5: the Djinn of the Teapot. Put him back in the pot: kick the pot across the riad, and when he
// dives in to refill, stomp the lid. Stomping him in the air bounces off.
module.exports = async ({ page, check, shot }) => {
  const r = await page.evaluate(() => {
    const out = {}, TSZ = 32;
    start('5-5'); clearEnemies();
    const g = S(), p = P(), b = boss();
    const pot = g.entities.find(e => e.pot);
    out.potThere = !!pot && pot.onGround === false;
    enterArena(); p.invuln = 99;
    out.woke = b.state === 'fight'; out.name = b.name; out.hp0 = b.hp;
    // a stomp on the flying djinn just bounces off
    b.go('walk'); sim(0.05); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; sim(0.5); out.stompHp = b.hp;
    // Brady kicks the pot across the room
    p.x = pot.x - p.w - 70; p.y = b.floorY - p.h; p.vy = 0; const px0 = pot.x; sim(0.7, { right: true }); sim(0.8);
    out.kicked = Math.round(pot.x - px0);
    // he runs dry and chases the pot, dives in: the lid is the weak moment
    b.go('refill'); let n = 0; while (!b.inside && n++ < 1200) sim(1 / 120);
    out.chased = b.inside && Math.abs(b.cx - pot.cx) < 24 && b.vuln;
    p.x = pot.cx - p.w / 2; p.y = pot.y - p.h - 30; p.vy = 0; sim(0.5); out.lidHp = b.hp; out.lidAct = b.act;
    // phase 2 (the first hit): sandstorm and mirage pots
    sim(0.2); out.phase2 = b.phase === 2; out.mirages = g.entities.filter(e => e.mirage && !e.remove).length; out.gale = !!g.entities.find(e => e.zone && e.zone.kind === 'storm');
    // a mirage breaks when stomped
    const m = g.entities.find(e => e.mirage); p.x = m.cx - p.w / 2; p.y = m.y - p.h - 30; p.vy = 0; sim(0.5); out.mirageBroke = !!m.remove;
    // phase 3: he grows, the pot flies, a carpet appears
    sim(1.0); b.damage(1); sim(0.8);
    out.phase3 = b.phase === 3 && b.big === 1 && pot.fly; out.carpet = !!g.entities.find(e => e.kind === 'sig:carpet' && !e.remove);
    return out;
  });
  check('Djinn wakes when Brady walks in; the teapot sits on the floor', r.woke && /DJINN/.test(r.name) && r.potThere, r);
  check('stomping the djinn in the air bounces off', r.stompHp === r.hp0, r);
  check('Brady kicks the pot across the room', r.kicked > 60, r);
  check('the djinn chases the kicked pot and dives in (weak moment)', r.chased, r);
  check('stomping the lid while he is inside traps him: damage', r.lidHp === r.hp0 - 1, r);
  check('phase 2: sandstorm zone and two mirage pots', r.phase2 && r.mirages === 2 && r.gale, r);
  check('a stomped mirage pops', r.mirageBroke, r);
  check('phase 3: the djinn grows, the pot flies, a carpet appears', r.phase3 && r.carpet, r);
  // the spectacular moment: giant djinn flinging teacups while the pot hovers and Brady rides the carpet
  await page.evaluate(() => {
    const g = S(), p = P(), b = boss(); p.collect('sig:carpet'); const pot = g.entities.find(e => e.pot);
    p.x = pot.cx - p.w / 2 - 110; p.y = pot.y - 20; p.vy = 0; b.go('cups'); sim(0.72);
  });
  await page.waitForTimeout(120);
  await shot('ma-01-djinn-phase3.png');
  const r2 = await page.evaluate(() => {
    const out = {}, g = S(), p = P(), b = boss(), pot = g.entities.find(e => e.pot);
    // the flying pot can still be trapped: Brady rides the carpet up and holds DOWN to drop onto the lid
    b.go('refill'); let n = 0; while (!b.inside && n++ < 1500) sim(1 / 120);
    out.inside3 = b.inside && pot.fly;
    p.x = pot.cx - p.w / 2; p.y = pot.y - p.h - 20; p.vy = 0; for (let k = 0; k < 60; k++) { if (b.hurtT <= 0) p.x = pot.cx - p.w / 2; sim(1 / 120, { down: true }); } out.hp = b.hp;
    // the last hit: the lid slams and he is sealed in
    sim(1.2); b.go('refill'); n = 0; while (!b.inside && n++ < 1500) sim(1 / 120);
    p.x = pot.cx - p.w / 2; p.y = pot.y - p.h - 20; p.vy = 0; for (let k = 0; k < 60; k++) { if (b.hurtT <= 0) p.x = pot.cx - p.w / 2; sim(1 / 120, { down: true }); }
    out.trapped = b.act === 'trapped' && pot.sealed; out.hpEnd = b.hp;
    return out;
  });
  check('in phase 3 the flying pot can still be trapped', r2.inside3 && r2.hp === 1, r2);
  check('the last lid stomp seals him in the pot', r2.trapped && r2.hpEnd <= 0.01, r2);
  await page.waitForTimeout(120);
  await shot('ma-02-djinn-sealed.png');
  const r3 = await page.evaluate(() => {
    const g = S(), p = P(), b = boss(); const doorX = b.doorX, row = b.floorY / 32 - 1;
    sim(6);
    const out = { removed: !!b.remove, door: g.area.tiles[row * g.area.W + doorX] === 0, sealed: !!g.entities.find(e => e.pot && e.sealed) };
    p.x = (doorX + 8) * 32; p.y = b.floorY - p.h; p.vy = 0; sim(2.5); out.state = g.state;
    return out;
  });
  check('the djinn is gone, the pot stays sealed, the door opens and the level can be finished', r3.removed && r3.door && r3.sealed && /clear|tally|results/.test(r3.state), r3);
};
