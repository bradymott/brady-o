// Japan 11-5, The Great Kappa: his shell bounces stomps. Crouch (hold DOWN) facing him while he glares and he bows back,
// spilling his dish: weak until he refills at the pond. Stones pushed onto the pond stall the refill. Phase 2 koi leap,
// phase 3 the pond floods the garden. Beaten, he bows and hands over a cucumber.
module.exports = async ({ page, check, shot }) => {
  // (a) he wakes; the garden has the pond and three stepping stones
  const woke = await page.evaluate(() => {
    start('11-5'); clearEnemies(); const b = enterArena(); const g = S();
    const stones = g.entities.filter(e => e.prop && e.cfg && e.cfg.stone && e.cx > b.arenaX0 && e.cx < b.arenaX1).length;
    return { state: b.state, hp: b.hp, lock: !!g.bossLock, pond: !!b.pond, stones, water: b.water };
  });
  check('jp: the Great Kappa wakes at his pond with three stepping stones', woke.state === 'fight' && woke.lock && woke.pond && woke.stones === 3 && woke.hp === 5 && woke.water === 1, woke);

  // (b) a stomp on the shell bounces; a glare without a bow turns into an attack; a bow makes him spill and go weak
  const stomp = await page.evaluate(() => {
    const b = boss(), p = P(); b.go('walk'); b.x = b.arenaX0 + 8 * 32; b.y = b.floorY - b.h; b.vx = 0; sim(0.05);
    p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; p.invuln = 0; const hp0 = b.hp, lives0 = window.BRADY.Save.data.lives, pw0 = p.power;
    let bounced = false; for (let k = 0; k < 40 && !bounced; k++) { sim(0.02); if (p.vy < -100) bounced = true; }
    const hurt = p.power < pw0 || window.BRADY.Save.data.lives < lives0 || p.dead; p.invuln = 99; p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; sim(0.3);
    return { hp0, hp: b.hp, bounced, hurt, state: b.state };
  });
  check('jp: stomping the shell bounces off harmlessly', stomp.hp === stomp.hp0 && stomp.bounced && !stomp.hurt && stomp.state === 'fight', stomp);
  const noBow = await page.evaluate(() => {
    const b = boss(), p = P(); p.invuln = 99; b.go('walk'); b.x = b.arenaX0 + 10 * 32; b.y = b.floorY - b.h; sim(0.05);
    p.x = b.cx - 3 * 32 - p.w / 2; p.y = b.floorY - p.h; p.facing = 1; b.go('glare'); sim(2.2);
    return { act: b.act, water: b.water };
  });
  check('jp: a glare that gets no bow becomes an attack (no spill)', noBow.act !== 'bow' && noBow.act !== 'weak' && noBow.water === 1, noBow);
  const bow = await page.evaluate(() => {
    const b = boss(), p = P(); p.invuln = 99; b.go('walk'); b.x = b.arenaX0 + 10 * 32; b.y = b.floorY - b.h; sim(0.05);
    p.x = b.cx - 3 * 32 - p.w / 2; p.y = b.floorY - p.h; p.facing = 1; b.go('glare'); sim(0.5, { down: true });
    const bowed = b.act === 'bow'; sim(1.3); const weak = b.act === 'weak' && b.vuln;
    // now a stomp lands
    const hp0 = b.hp; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; p.vx = 0; let n = 0; while (b.hp === hp0 && n++ < 60) sim(0.02);
    return { bowed, weak, water: b.water, hp0, hp: b.hp, act: b.act };
  });
  check('jp: crouching at his glare makes him bow back, spill his dish and go weak; then a stomp lands', bow.bowed && bow.weak && bow.water === 0 && bow.hp === bow.hp0 - 1, bow);
  await page.evaluate(() => { const b = boss(), p = P(); sim(1.2); b.go('walk'); b.x = b.arenaX0 + 10 * 32; b.y = b.floorY - b.h; sim(0.05); p.x = b.cx - 3 * 32 - p.w / 2; p.y = b.floorY - p.h; p.facing = 1; b.go('glare'); sim(0.5, { down: true }); sim(0.5, { down: true }); });
  await shot('jp-1-kappa-bow.png');

  // (c) a stone pushed onto the pond stalls the refill; he shoves it out
  const stones = await page.evaluate(() => {
    const b = boss(), g = S(), pond = b.pond; sim(1.5); b.water = 0;
    const st = g.entities.find(e => e.prop && e.cfg && e.cfg.stone && !e.remove); st.x = pond.cx - st.w / 2; st.y = b.floorY - st.h; st.vx = 0; st.vy = 0; sim(0.05);
    const inPond = pond.stonesIn().length; b.go('walk'); b.x = pond.cx - b.w / 2; b.y = b.floorY - b.h; sim(0.02); b.go('refill'); sim(0.05);
    const need = b.need, vuln = b.vuln; let shoved = false; for (let k = 0; k < 80; k++) { sim(0.02); if (Math.abs(st.vx) > 50 || Math.abs(st.vy) > 50) shoved = true; }
    let n = 0; while (b.act === 'refill' && n++ < 400) sim(0.02);
    return { inPond, need, vuln, shoved, water: b.water, act: b.act };
  });
  check('jp: a stepping stone on the pond makes the refill long (he shoves it out) and he stays weak meanwhile', stones.inPond === 1 && stones.need > 2 && stones.vuln && stones.shoved && stones.water === 1, stones);

  // (d) phases: koi leap in phase 2, the garden floods in phase 3
  const ph2 = await page.evaluate(() => {
    const b = boss(), g = S(); while (b.hp > 3.01) b.damage(1); sim(1.5); b.go('walk'); b.x = b.arenaX0 + 10 * 32; b.y = b.floorY - b.h; sim(0.05); b.go('koi'); sim(1.6);
    return { phase: b.phase, koi: g.entities.filter(e => e.kind === 'koi' && !e.remove).length };
  });
  check('jp: phase 2 calls leaping koi from the pond', ph2.phase === 2 && ph2.koi >= 2, ph2);
  const ph3 = await page.evaluate(() => {
    const b = boss(), g = S(); sim(1.5); while (b.hp > 1.01) b.damage(1); sim(3);
    const row = Math.floor(b.floorY / 32) - 1; let water = 0; for (let tx = Math.floor(b.arenaX0 / 32); tx < Math.floor(b.arenaX1 / 32); tx++) if (g.area.tiles[row * g.area.W + tx] === 10) water++;
    b.go('walk'); b.x = b.arenaX0 + 10 * 32; b.y = b.floorY - b.h; sim(0.05); b.go('koi'); sim(1.0);
    return { phase: b.phase, water, koi: g.entities.filter(e => e.kind === 'koi' && !e.remove).length };
  });
  check('jp: phase 3 floods the garden floor and the koi leap from anywhere', ph3.phase === 3 && ph3.water >= 20 && ph3.koi >= 1, ph3);
  await shot('jp-2-kappa-flood.png');

  // (e) the last stomp: a final deep bow, a cucumber, the water drains and the door opens
  const end = await page.evaluate(() => {
    const b = boss(), g = S(), p = P(); sim(1.5); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; b.go('walk'); b.x = b.arenaX0 + 10 * 32; b.y = b.floorY - b.h; sim(0.05);
    const doorRow = Math.floor(b.floorY / 32) - 1, before = g.area.tiles[doorRow * g.area.W + b.doorX];
    b.damage(1); const act = b.act; sim(2.0); const gift = g.entities.some(e => e.constructor.name === 'JpCucumberGift' && !e.remove); sim(3.5);
    let water = 0; for (let tx = Math.floor(b.arenaX0 / 32); tx < Math.floor(b.arenaX1 / 32); tx++) if (g.area.tiles[doorRow * g.area.W + tx] === 10) water++;
    return { act, gift, removed: !!b.remove, before, after: g.area.tiles[doorRow * g.area.W + b.doorX], lock: !!g.bossLock, water };
  });
  check('jp: beaten, he bows deeply, gives a cucumber, the pond drains and the door opens', end.act === 'finalbow' && end.gift && end.removed && end.before === 5 && end.after === 0 && !end.lock && end.water === 0, end);
};
