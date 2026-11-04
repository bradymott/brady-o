// Bali 9-5, Boss Kera: the monkey king laughs at stomps; land on a branch of the tree he perches in and a durian
// drops down the trunk onto his head. Phase 2 calls the troop, phase 3 the vines; the last durian makes him surrender.
module.exports = async ({ page, check, shot }) => {
  // (a) he wakes when Brady walks in
  const woke = await page.evaluate(() => {
    start('9-5'); clearEnemies(); const b = enterArena(); const g = S();
    return { state: b.state, name: b.name, hp: b.hp, lock: !!g.bossLock, grove: !!b.grove, trees: b.grove ? b.grove.trees.length : 0 };
  });
  check('id: Boss Kera wakes, the grove has three durian trees', woke.state === 'fight' && woke.lock && woke.grove && woke.trees === 3 && woke.hp === 5, woke);

  // (b) a stomp on his head bounces off and costs him nothing; a durian on the head costs him a hit point
  const stomp = await page.evaluate(() => {
    const b = boss(), p = P(); b.go('walk'); b.x = b.arenaX0 + 8 * 32; b.y = b.floorY - b.h; b.vx = 0; sim(0.05);
    p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; p.invuln = 0; const hp0 = b.hp, lives0 = window.BRADY.Save.data.lives, pw0 = p.power;
    let bounced = false; for (let k = 0; k < 40 && !bounced; k++) { sim(0.02); if (p.vy < -100) bounced = true; }
    const hurt = p.power < pw0 || window.BRADY.Save.data.lives < lives0 || p.dead; p.invuln = 99; p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; sim(0.3);
    return { hp0, hp: b.hp, bounced, hurt, state: b.state };
  });
  check('id: stomping Kera bounces off harmlessly (no damage either way)', stomp.hp === stomp.hp0 && stomp.bounced && !stomp.hurt, stomp);
  const durian = await page.evaluate(() => {
    const b = boss(), p = P(); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; p.invuln = 99; b.go('walk'); b.vx = 0; sim(0.05);
    const hp0 = b.hp; const d = spawnAt('idDurianProp', b.cx, b.y - 40); d.vy = 200; sim(0.5);
    return { hp0, hp: b.hp, act: b.act, durianGone: d.remove };
  });
  check('id: a falling durian hurts him and knocks him off his feet', durian.hp === durian.hp0 - 1 && (durian.act === 'fall' || durian.act === 'dizzy') && durian.durianGone, durian);

  // (d) the real route: he perches at a trunk, Brady lands on a branch of that tree, the tree drops a durian on him
  const real = await page.evaluate(() => {
    const b = boss(), p = P(), g = S(), gr = b.grove; p.invuln = 99; for (const e of g.entities) if (e.prop) e.remove = true;
    b.go('walk'); b.x = b.arenaX0 + 8 * 32; b.y = b.floorY - b.h; sim(0.05); b.go('climb');
    let n = 0; while (b.act !== 'perch' && n++ < 400) sim(0.02);
    if (b.act !== 'perch') return { perched: false, act: b.act };
    const tr = b.perch.tree, br = tr.low, hp0 = b.hp, crown0 = tr.crown;
    // Brady drops onto the far end of the low branch (away from the trunk)
    p.x = (p.cx < tr.x ? br.x0 + 12 : br.x1 - 12) - p.w / 2; p.y = br.y - p.h - 40; p.vy = 0; p.vx = 0;
    let shook = false, dropped = false; for (let k = 0; k < 120; k++) { sim(0.02); if (tr.shake > 0) shook = true; if (tr.crown < crown0) dropped = true; if (b.hp < hp0) break; }
    return { perched: true, shook, dropped, hp0, hp: b.hp, act: b.act, crown0, crown: tr.crown };
  });
  check('id: landing on a branch shakes the tree and the durian lands on the perched Kera', real.perched && real.shook && real.dropped && real.hp === real.hp0 - 1, real);
  await page.evaluate(() => { const b = boss(); sim(1.6); b.go('climb'); let n = 0; while (b.act !== 'perch' && n++ < 400) sim(0.02); sim(0.9); });
  await shot('id-1-kera-perch.png');

  // (c) phases: the troop arrives at 3 hp, the vines at 1 hp
  const phases = await page.evaluate(() => {
    const b = boss(), g = S(); while (b.hp > 3.01) b.damage(1); sim(1.5);
    const troop = g.entities.filter(e => e.constructor.name === 'IdTroop' && !e.dead && !e.remove).length, ph2 = b.phase;
    while (b.hp > 1.01) b.damage(1); sim(0.2);
    return { ph2, troop, ph3: b.phase, vines: !!(boss().grove && boss().grove.vines), grovePhase: boss().grove.phase };
  });
  check('id: phase 2 calls the troop, phase 3 hangs the vines', phases.ph2 === 2 && phases.troop === 2 && phases.ph3 === 3 && phases.vines && phases.grovePhase === 3, phases);
  const troop = await page.evaluate(() => {
    const b = boss(), g = S(), p = P(); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; for (const e of g.entities) if (e.prop) e.remove = true; sim(0.05);
    const d = spawnAt('idDurianProp', b.arenaX0 + 12 * 32, b.floorY); sim(0.3);
    let carried = false; for (let k = 0; k < 450 && !d.remove; k++) { sim(0.02); if (d.carried) carried = true; }
    return { carried, gone: d.remove };
  });
  check('id: a troop monkey carries a fallen durian away up a trunk', troop.carried && troop.gone, troop);
  // (e) the vine swing
  await page.evaluate(() => { const b = boss(), p = P(); b.go('walk'); b.x = b.arenaX0 + 4 * 32; b.y = b.floorY - b.h; sim(0.05); b.go('vine'); p.x = b.arenaX1 - 5 * 32; p.y = b.floorY - p.h; sim(1.3); });
  const swing = await page.evaluate(() => { const b = boss(); return { act: b.act, pose: b.pose, a: b.vineA, y: b.y, floorY: b.floorY }; });
  check('id: in phase 3 he swings across the arena on a vine', swing.act === 'vine' && swing.pose === 'swing' && swing.a != null && swing.y < swing.floorY - 40, swing);
  await shot('id-2-kera-vine.png');

  // (d) the last durian: he eats it, surrenders, gives the coins back and the door opens
  const end = await page.evaluate(() => {
    const b = boss(), g = S(), p = P(); sim(2.5); b.go('walk'); b.x = b.arenaX0 + 10 * 32; b.y = b.floorY - b.h; b.loot = 4; sim(0.05);
    const picks0 = g.picks, doorRow = Math.floor(b.floorY / 32) - 1, before = g.area.tiles[doorRow * g.area.W + b.doorX];
    b.damage(1); const sur = b.act; sim(2.0); const gave = g.picks - picks0; sim(3.5);
    return { sur, gave, removed: !!b.remove, state: b.state, before, after: g.area.tiles[doorRow * g.area.W + b.doorX], lock: !!g.bossLock };
  });
  check('id: the last durian makes him surrender, give the coins back, and the door opens', end.sur === 'surrender' && end.gave === 4 && end.removed && end.before === 5 && end.after === 0 && !end.lock, end);
};
