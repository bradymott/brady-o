// Morocco 5-5: Berrad the Magnificent, a grand brass teapot. Kick his brazier across the riad; when he runs out of
// steam and sinks into it to reboil, stomp his lid. Stomping him in the air bounces off.
// Morocco 5-4: the Brass Owl (mini-boss). Pull a chain while it looks away: the tagine lid drops on it.
module.exports = async ({ page, check, shot }) => {
  const r = await page.evaluate(() => {
    const out = {}, TSZ = 32;
    start('5-5'); clearEnemies();
    const g = S(), p = P(), b = boss();
    const pot = g.entities.find(e => e.pot);
    sim(0.3); out.potThere = !!pot && pot.onGround === true;
    enterArena(); p.invuln = 99;
    out.woke = b.state === 'fight'; out.name = b.name; out.hp0 = b.hp;
    // a stomp on Berrad in the air just bounces off
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
  check('Berrad wakes when Brady walks in; his brazier sits on the floor', r.woke && /BERRAD/.test(r.name) && r.potThere, r);
  check('stomping Berrad in the air bounces off', r.stompHp === r.hp0, r);
  check('Brady kicks the brazier across the room', r.kicked > 60, r);
  check('Berrad chases the kicked brazier and sinks in to reboil (weak moment)', r.chased, r);
  check('stomping his lid while he reboils: damage', r.lidHp === r.hp0 - 1, r);
  check('phase 2: sandstorm zone and two mirage braziers', r.phase2 && r.mirages === 2 && r.gale, r);
  check('a stomped mirage brazier pops', r.mirageBroke, r);
  check('phase 3: Berrad swells, the brazier flies, a carpet appears', r.phase3 && r.carpet, r);
  // the spectacular moment: Berrad swollen up flinging tea glasses while the brazier flies and Brady rides the carpet
  await page.evaluate(() => {
    const g = S(), p = P(), b = boss(); p.collect('sig:carpet'); const pot = g.entities.find(e => e.pot);
    p.x = pot.cx - p.w / 2 - 110; p.y = pot.y - 20; p.vy = 0; b.go('cups'); sim(0.72);
  });
  await page.waitForTimeout(120);
  await shot('ma-01-berrad-phase3.png');
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
  check('in phase 3 the flying brazier can still be reached', r2.inside3 && r2.hp === 1, r2);
  check('the last lid stomp clamps him in the brazier', r2.trapped && r2.hpEnd <= 0.01, r2);
  await page.waitForTimeout(120);
  await shot('ma-02-berrad-sealed.png');
  const r3 = await page.evaluate(() => {
    const g = S(), p = P(), b = boss(); const doorX = b.doorX, row = b.floorY / 32 - 1;
    sim(6);
    const out = { removed: !!b.remove, door: g.area.tiles[row * g.area.W + doorX] === 0, sealed: !!g.entities.find(e => e.pot && e.sealed) };
    p.x = (doorX + 8) * 32; p.y = b.floorY - p.h; p.vy = 0; sim(2.5); out.state = g.state;
    return out;
  });
  check('Berrad is gone, the brazier stays clamped, the door opens and the level can be finished', r3.removed && r3.door && r3.sealed && /clear|tally|results/.test(r3.state), r3);
  // ---- 5-4: the Brass Owl ----
  const o = await page.evaluate(() => {
    const out = {}; start('5-4'); clearEnemies(); const g = S(), p = P(), b = boss();
    out.arena = g.area.aid; enterArena(); p.invuln = 99; out.woke = b.state === 'fight'; out.name = b.name; out.hp0 = b.hp;
    // a stomp on brass just clanks
    b.go('perch'); sim(0.05); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; sim(0.5); out.stompHp = b.hp;
    const hooks = g.entities.filter(e => e.constructor.name === 'MaLidHook').sort((a, c) => a.hx - c.hx), chains = g.entities.filter(e => e.constructor.name === 'MaChain');
    const chainFor = h => chains.find(c => c.id === h.id);
    const settle = k => { b.brain.perchAt(b, k); b.x = b.tx; b.y = b.floorY - b.h; b.go('perch'); b.turnT = 0; b.featherT = 9; sim(0.05); };
    // pulled while it watches: it hops clear (no damage) and blows feathers
    settle(1); let c = chainFor(hooks[1]); p.x = c.cx - p.w / 2; p.y = b.floorY - p.h; p.vy = 0; b.look = Math.sign(p.cx - b.cx) || 1; sim(0.05);
    c.pull(p); sim(0.1); out.dodged = b.act === 'dodge'; sim(1.5); out.seenHp = b.hp; out.feathers = g.entities.filter(e => e.kind === 'feather').length;
    // pulled while it looks away: the lid lands on it
    sim(3.5); settle(1); c = chainFor(hooks[1]); p.x = c.cx - p.w / 2; p.y = b.floorY - p.h; p.vy = 0; b.look = -(Math.sign(p.cx - b.cx) || 1); sim(0.05);
    c.pull(p); sim(1.2); out.hitHp = b.hp; out.phase2 = b.phase === 2;
    // phase 2: it flies a lap and lands under another lid
    let n = 0, lap = false; while (n++ < 900) { sim(1 / 60); if (b.act === 'lap') lap = true; if (lap && b.act === 'perch') break; } out.lap = lap; out.landed = b.act === 'perch';
    return out;
  });
  check('the Brass Owl wakes in its tower arena', o.woke && /BRASS OWL/.test(o.name) && o.hp0 === 3, o);
  check('stomping the brass owl just clanks', o.stompHp === o.hp0, o);
  check('pulling a chain while the owl watches: it hops clear and answers with feathers', o.dodged && o.seenHp === o.hp0 && o.feathers > 0, o);
  check('pulling a chain while it looks away drops the lid on it: damage, phase 2', o.hitHp === o.hp0 - 1 && o.phase2, o);
  check('phase 2: the owl flies a lap and lands under a lid', o.lap && o.landed, o);
  await page.waitForTimeout(100);
  await shot('ma-03-owl.png');
  const o2 = await page.evaluate(() => {
    const g = S(), b = boss(), p = P(); for (let k = 0; k < 6 && b.hp > 0.01; k++) { b.hurtT = 0; b.state = 'fight'; b.damage(1); sim(0.3); }
    const out = { apart: b.act === 'apart' || b.state === 'dying' || !!b.remove }; sim(5);
    const row = b.floorY / 32 - 1; out.door = g.area.tiles[row * g.area.W + b.doorX] === 0; out.removed = !!b.remove; return out;
  });
  check('the owl falls apart into teaspoons and the tower door opens', o2.apart && o2.removed && o2.door, o2);
};
