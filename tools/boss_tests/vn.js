// Vietnam 10-5, Ong Phin: too hot to stomp. Jump on a foot pedal, the great kettle swings across the courtyard and
// steams him when it crashes into him. Phase 2 goes dark (he blows the lanterns out), phase 3 raises the water puppets.
module.exports = async ({ page, check, shot }) => {
  // (a) he wakes when Brady walks in; the courtyard has the kettle, two pedals, six lanterns and three puppets
  const woke = await page.evaluate(() => {
    start('10-5'); clearEnemies(); const b = enterArena(); const g = S();
    const pedals = g.entities.filter(e => e.constructor.name === 'VnPedal' && e.cx > b.arenaX0 && e.cx < b.arenaX1).length;
    return { state: b.state, hp: b.hp, lock: !!g.bossLock, kettle: !!b.kettle, pedals, lanterns: b.lanterns.length, puppets: b.puppets.length, dark: !!g.area.dark };
  });
  check('vn: Ong Phin wakes under the kettle (2 pedals, 6 lanterns, 3 puppets)', woke.state === 'fight' && woke.lock && woke.kettle && woke.pedals === 2 && woke.lanterns === 6 && woke.puppets === 3 && woke.hp === 5 && !woke.dark, woke);

  // (b) a stomp bounces off the hot lid; the kettle hurts him
  const stomp = await page.evaluate(() => {
    const b = boss(), p = P(); b.go('walk'); b.x = b.arenaX0 + 8 * 32; b.y = b.floorY - b.h; b.vx = 0; sim(0.05);
    p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; p.invuln = 0; const hp0 = b.hp, lives0 = window.BRADY.Save.data.lives, pw0 = p.power;
    let bounced = false; for (let k = 0; k < 40 && !bounced; k++) { sim(0.02); if (p.vy < -100) bounced = true; }
    const hurt = p.power < pw0 || window.BRADY.Save.data.lives < lives0 || p.dead; p.invuln = 99; p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; sim(0.3);
    return { hp0, hp: b.hp, bounced, hurt, state: b.state };
  });
  check('vn: stomping the hot lid bounces off harmlessly', stomp.hp === stomp.hp0 && stomp.bounced && !stomp.hurt && stomp.state === 'fight', stomp);
  const kettle = await page.evaluate(() => {
    const b = boss(), p = P(), g = S(), k = b.kettle; p.invuln = 99;
    // he stands dripping on the right of the courtyard; Brady drops onto the left pedal
    b.go('drips'); b.x = b.arenaX0 + 17 * 32; b.y = b.floorY - b.h; b.vx = 0; b.perchT = 99; sim(0.05);
    const pedal = g.entities.find(e => e.constructor.name === 'VnPedal' && e.cx > b.arenaX0 && e.cx < b.arenaX0 + 100);
    p.x = pedal.cx - p.w / 2; p.y = pedal.y - p.h - 40; p.vy = 0; p.vx = 0;
    let swung = false, hitAt = -1, hp0 = b.hp, rose = 0; const acts = {};
    for (let k2 = 0; k2 < 220; k2++) { sim(0.02); if (k.swinging) swung = true; rose = Math.max(rose, k.a < 0 ? -k.a : 0); acts[b.act] = 1; if (b.hp < hp0 && hitAt < 0) { hitAt = k2; break; } if (b.act === 'drips' && b.at > 2) b.go('drips'); }
    return { pressed: pedal.press > 0 || swung, swung, rose: +rose.toFixed(2), hp0, hp: b.hp, hitAt, act: b.act, acts: Object.keys(acts) };
  });
  check('vn: a pedal stomp swings the kettle up and across, and it steams him (OVER-BREWED)', kettle.swung && kettle.rose > 0.5 && kettle.hp === kettle.hp0 - 1 && kettle.act === 'scald', kettle);
  await shot('vn-1-phin-kettle.png');

  // (c) phase 2 goes dark: he blows the lanterns out; phase 3 raises the puppets
  const ph2 = await page.evaluate(() => {
    const b = boss(), g = S(); sim(1.8); while (b.hp > 3.01) b.damage(1); sim(1.8);
    const dark = !!g.area.dark, lit0 = b.lanterns.filter(l => l.lit).length;
    b.go('walk'); b.x = b.arenaX0 + 12 * 32; b.y = b.floorY - b.h; sim(0.05); b.go('blow'); sim(1.6);
    const litAfter = b.lanterns.filter(l => l.lit).length; for (let k = 0; k < 170; k++) { if (b.act !== "wobble") b.go("wobble"); sim(0.02); } const relit = b.lanterns.filter(l => l.lit).length;
    return { phase: b.phase, dark, lit0, litAfter, relit };
  });
  check('vn: phase 2 is dark and his breath blows the lanterns out (they relight)', ph2.phase === 2 && ph2.dark && ph2.lit0 === 6 && ph2.litAfter <= 1 && ph2.relit === 6, ph2);
  await page.evaluate(() => { const b = boss(); b.go('blow'); sim(1.1); });
  await shot('vn-2-phin-lanterns.png');
  const ph3 = await page.evaluate(() => {
    const b = boss(), g = S(); while (b.hp > 1.01) b.damage(1); sim(1.8);
    const active = b.puppets.filter(q => q.active).length; let up = 0; for (let k = 0; k < 250; k++) { sim(0.02); up = Math.max(up, b.puppets.filter(q => q.state === 'up').length); }
    return { phase: b.phase, active, up };
  });
  check('vn: phase 3 raises the water puppets from the courtyard floor', ph3.phase === 3 && ph3.active === 3 && ph3.up >= 1, ph3);

  // (d) the last blast: he drips empty, sits down for a cup, and the door opens
  const end = await page.evaluate(() => {
    const b = boss(), g = S(), p = P(); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; b.go('walk'); b.x = b.arenaX0 + 12 * 32; b.y = b.floorY - b.h; sim(0.05);
    const doorRow = Math.floor(b.floorY / 32) - 1, before = g.area.tiles[doorRow * g.area.W + b.doorX];
    b.damage(1); const act = b.act; sim(1.6); const pose = b.pose; sim(3.5);
    return { act, pose, removed: !!b.remove, before, after: g.area.tiles[doorRow * g.area.W + b.doorX], lock: !!g.bossLock, dark: !!g.area.dark };
  });
  check('vn: the last steam blast empties him, he sits down for a cup, the door opens, the lights come back', end.act === 'empty' && end.pose === 'sit' && end.removed && end.before === 5 && end.after === 0 && !end.lock && !end.dark, end);
};
