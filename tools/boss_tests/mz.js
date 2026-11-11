// Mozambique 4-5: O Eremita. Take away his shells: piri-piri fire heats the shell he hides in until he
// jumps out, hot and soft (stomp him); kick the empty shells into the sea. Phase 2 the tide floods the edges
// and coconuts drop from the baobab; phase 3 shell-less (claw sweeps, sprints). He leaves with a thimble.
module.exports = async ({ page, check, shot }) => {
  await page.evaluate(() => {
    const TS = 32;
    window.waitFor = (fn, max) => { const n = Math.round((max || 5) * 120); for (let k = 0; k < n; k++) { if (fn()) return true; sim(1 / 120); } return !!fn(); };
    window.stompBoss = (b, p) => { let bounced = false; p.y = b.y - p.h - 4; p.vy = 4 * TS; p.vx = 0; for (let k = 0; k < 60; k++) { if (b.hurtT > 0) break; if (k < 20) p.x = b.cx - p.w / 2; sim(1 / 120); if (p.vy < -8 * TS) bounced = true; } return bounced; };
    window.doorTile = (b) => { const g = S(); const row = Math.floor(b.floorY / TS) - 1; return g.area.tiles[row * g.area.W + b.doorX]; };
    window.finish = () => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; sim(1, { right: true }); sim(8); return g.state; };
    // only this arena's shells (the castle builder lays out a second, unused arena further on)
    window.shells = () => S().entities.filter(e => e.kindName && e.prop && !e.remove && e.cx < B1.arenaX1);
    // Brady stands beside the boss, facing him, and breathes fire n times
    // 4-5 is a v2 lair: the ramparts first, then the tide pool (the area with role 'arena')
    window.startArena = (id) => { start(id); const g = S(); const k = g.level.areas.findIndex(a => a.role === 'arena'); if (k >= 0 && g.area !== g.rt[k]) { const an = g.level.areas[k].anchors.in; g.loadArea(k, an.x, an.y); sim(0.5); } };
    window.breathe = (b, p, n) => { for (let k = 0; k < n; k++) { const side = b.cx < (b.arenaX0 + b.arenaX1) / 2 ? 1 : -1; p.x = b.cx + side * 70 - p.w / 2; p.y = b.floorY - p.h; p.vy = 0; p.facing = -side; sim(0.1, { actionPressed: true }); sim(0.3); } };
  });
  // (a) wake: he runs for the nearest shell (the bottle) and climbs in; the arena has three shells and the sea
  const a = await page.evaluate(() => {
    startArena('4-5'); clearEnemies(); const p = P(); p.invuln = 99; const b = (window.B1 = enterArena(64));
    const n = shells().length; const basket = S().entities.some(e => e.constructor.name === 'MzChiliBasket');
    const got = waitFor(() => !!b.shell, 4);
    const g = S(), x0 = Math.round(b.arenaX0 / 32), GY = Math.round(b.floorY / 32);
    const x1 = Math.round(b.arenaX1 / 32); const sea = g.area.tiles[GY * g.area.W + x0 + 1] === 10 && g.area.tiles[GY * g.area.W + x1 - 2] === 10;
    return { state: b.state, n, basket, got, kind: b.shell && b.shell.kind, sea, name: b.name };
  });
  check('O Eremita wakes, scuttles into the nearest borrowed shell (the bottle); three shells, the sea on both sides', a.state === 'fight' && a.n === 3 && a.basket && a.got && a.kind === 'bottle' && a.sea && /EREMITA/.test(a.name), a);
  // (b) the mechanic: stomps on the shell bounce; fire heats the shell until he jumps out; then a stomp lands
  const b1 = await page.evaluate(() => {
    const b = boss(), p = P(); const hp0 = b.hp;
    waitFor(() => b.act === 'inshell', 3); const bounced = stompBoss(b, p); sim(0.2); const afterStomp = b.hp;
    p.collect('sig:piri'); const sig = p.sig && p.sig.id;
    breathe(b, p, 2); const heat2 = b.heat; breathe(b, p, 3);
    const ejected = waitFor(() => b.act === 'eject', 2); sim(0.5); const soft = b.vuln;
    const hit = ejected ? stompBoss(b, p) : false; sim(0.3);
    return { hp0, bounced, afterStomp, sig, heat2, ejected, soft, hit, hp: b.hp, phase: b.phase, shellFree: !b.shell };
  });
  check('stomping the shelled crab bounces off and does nothing', b1.bounced && b1.afterStomp === b1.hp0, b1);
  check('piri-piri fire heats the shell until he jumps out hot and soft; a stomp then hurts him (phase 2)', b1.sig === 'piri' && b1.heat2 >= 2 && b1.ejected && b1.soft && b1.hp === b1.hp0 - 1 && b1.phase === 2 && b1.shellFree, b1);
  await page.evaluate(() => { const b = boss(), p = P(); p.x = b.arenaX0 + 100; p.y = b.floorY - p.h; sim(0.05); });
  // kick an empty shell into the sea: it is gone for good
  const kick = await page.evaluate(() => {
    const b = boss(), p = P(); const n0 = shells().length;
    const pot = shells().find(s => s.kind === 'pot'); if (!pot) return { n0, err: 'no pot' };
    p.x = pot.x + pot.w + 4; p.y = b.floorY - p.h; p.vy = 0; p.vx = -7 * 32; p.facing = -1; sim(0.1, { left: true });
    const kicked = pot.vx < -3 * 32; sim(2.5);
    return { n0, kicked, gone: pot.remove, n: shells().length };
  });
  check('Brady kicks the empty clay pot into the sea and it is gone (SPLOOSH)', kick.kicked && kick.gone && kick.n === kick.n0 - 1, kick);
  // (c) phase 2: the tide floods the floor edges; he hides again and whistles coconuts down from the baobab
  const ph2 = await page.evaluate(() => {
    const b = boss(), p = P(), g = S(); p.x = b.arenaX0 + 200; p.y = b.floorY - p.h;
    const x0 = Math.round(b.arenaX0 / 32), x1 = Math.round(b.arenaX1 / 32), GY = Math.round(b.floorY / 32);
    const flooded = waitFor(() => g.area.tiles[GY * g.area.W + x0 + 3] === 10 && g.area.tiles[GY * g.area.W + x1 - 4] === 10, 4);
    const back = waitFor(() => !!b.shell, 6);
    const rain = waitFor(() => b.act === 'rain' && b.fired, 12); sim(0.1);
    const coconuts = g.entities.filter(e => e.kind === 'coconut' && !e.remove).length, shadows = g.entities.filter(e => e.constructor.name === 'MzShadow').length;
    return { flooded, back, kind: b.shell && b.shell.kind, rain, coconuts, shadows };
  });
  check('phase 2: high tide floods the edges, he borrows another shell and coconuts fall from the baobab (with shadows)', ph2.flooded && ph2.back && ph2.rain && ph2.coconuts === 3 && ph2.shadows === 3, ph2);
  // heat him out again for the spectacular moment
  await page.evaluate(() => { const b = boss(), p = P(); p.invuln = 99; p.collect('sig:piri'); waitFor(() => b.act === 'inshell', 4); breathe(b, p, 2); });
  await shot('mz-1-shell-heating.png');
  const ph3 = await page.evaluate(() => {
    const b = boss(), p = P(), g = S(); breathe(b, p, 3); const ejected = waitFor(() => b.act === 'eject', 2); sim(0.4);
    if (ejected) stompBoss(b, p); sim(0.3);
    return { ejected, hp: b.hp, phase: b.phase, exposed: b.exposed, noShell: !b.shell, act: b.act };
  });
  check('phase 3: hurt again he throws his shell away and goes shell-less', ph3.ejected && ph3.hp === 2 && ph3.phase === 3 && ph3.exposed && ph3.noShell, ph3);
  await shot('mz-2-shell-less.png');
  // shell-less he is soft while scuttling but guards during the claw sweep
  const expo = await page.evaluate(() => {
    const b = boss(), p = P(); p.invuln = 99; p.x = b.arenaX0 + 200; p.y = b.floorY - p.h;
    const sweep = waitFor(() => b.act === 'sweep', 16); sim(0.1); const guarded = sweep && !b.vuln; const hp0 = b.hp; stompBoss(b, p); sim(0.2); const hpSweep = b.hp;
    waitFor(() => b.act === 'dash' || b.act === 'dazed', 8); sim(1 / 120); const soft = b.vuln; waitFor(() => b.hurtT <= 0, 2); stompBoss(b, p); sim(0.3);
    return { guarded, hp0, hpSweep, soft, hp: b.hp };
  });
  check('shell-less: claws up he bounces stomps, scuttling he is soft', expo.guarded && expo.hpSweep === expo.hp0 && expo.soft && expo.hp === expo.hp0 - 1, expo);
  // (d) the last hit: he grabs a thimble and runs off into the sea; the door opens
  const fin = await page.evaluate(() => {
    const b = boss(), p = P(), g = S(); p.invuln = 99;
    waitFor(() => b.hurtT <= 0, 3); b.state = 'fight'; b.damage(1); sim(0.05); const thimble = b.act === 'thimble'; const before = doorTile(b);
    waitFor(() => B1.remove, 8); const after = doorTile(b); const state = finish();
    return { thimble, before, after, state };
  });
  check('beaten, O Eremita leaves with a thimble; the door opens and Brady leaves the fortress', fin.thimble && fin.before === 5 && fin.after === 0 && fin.state === 'results', fin);
};
