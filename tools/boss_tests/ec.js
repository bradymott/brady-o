// Ecuador 2-5: El Tortugón. Flip him with the volcano vents: stomp the lever, a vent pops, he lands on his
// back (belly open). Stomps on the shell always bounce. Phase 2 disc spins and pulsing low-gravity bubbles;
// phase 3 drifting ice floes and vents firing in pairs. He sulks into his shell and rolls off.
module.exports = async ({ page, check, shot }) => {
  await page.evaluate(() => {
    const TS = 32;
    window.waitFor = (fn, max) => { const n = Math.round((max || 5) * 120); for (let k = 0; k < n; k++) { if (fn()) return true; sim(1 / 120); } return !!fn(); };
    window.stompBoss = (b, p) => { let bounced = false; p.y = b.y - p.h - 4; p.vy = 4 * TS; p.vx = 0; for (let k = 0; k < 60; k++) { if (b.hurtT > 0) break; if (k < 20) p.x = b.cx - p.w / 2; sim(1 / 120); if (p.vy < -8 * TS) bounced = true; } return bounced; };
    window.doorTile = (b) => { const g = S(); const row = Math.floor(b.floorY / TS) - 1; return g.area.tiles[row * g.area.W + b.doorX]; };
    window.finish = () => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; sim(1, { right: true }); sim(8); return g.state; };
    // only this arena's furniture (the castle builder lays out a second, unused arena further on)
    window.lever = () => S().entities.find(e => e.constructor.name === 'EcLever' && e.cx < B1.arenaX1);
    window.vents = () => S().entities.filter(e => e.constructor.name === 'EcVent' && e.cx < B1.arenaX1);
    // Brady jumps onto the lever
    window.pressLever = (p) => { const L = lever(); p.x = L.cx - p.w / 2; p.y = L.y - p.h - 6; p.vy = 4 * TS; p.vx = 0; sim(0.25); return L.cool > 0; };
    // the real flip: pop a vent, walk the tortoise over it, wait for him to land on his back
    window.flipHim = (b, p) => {
      pressLever(p); const v = vents().find(v => v.state !== 'idle'); if (!v) return 'no vent';
      b.go('walk'); b.x = v.cx - b.w / 2; b.vx = 0;
      const flipped = waitFor(() => b.act === 'flip', 2.5); const belly = waitFor(() => b.act === 'belly', 3);
      return flipped && belly ? 'belly' : b.act;
    };
  });
  // (a) wake: the arena has three vents, a lever and the equator bubbles; the fight starts
  const a = await page.evaluate(() => {
    start('2-5'); clearEnemies(); const p = P(); p.invuln = 99; const b = (window.B1 = enterArena(64));
    const zones = S().area.zones.filter(z => z.ecTag && z.x < b.arenaX1).length;
    return { state: b.state, act: b.act, vents: vents().length, lever: !!lever(), zones, name: b.name };
  });
  check('El Tortugón wakes in the vent cave (3 vents, a lever, 2 equator bubbles)', a.state === 'fight' && a.vents === 3 && a.lever && a.zones === 2 && /TORTUG/.test(a.name), a);
  // (b) the mechanic: the shell bounces stomps; the lever pops a vent; over the vent he lands on his back
  const b1 = await page.evaluate(() => {
    const b = boss(), p = P(); const hp0 = b.hp;
    b.go('walk'); sim(0.05); const bounced = stompBoss(b, p); sim(0.2); const afterStomp = b.hp;
    const r = flipHim(b, p); sim(1 / 120); const open = b.vuln;
    const hit = r === 'belly' ? stompBoss(b, p) : false; sim(0.3);
    return { hp0, bounced, afterStomp, r, open, hp: b.hp, phase: b.phase };
  });
  check('stomping the shell bounces off and does nothing', b1.bounced && b1.afterStomp === b1.hp0, b1);
  check('the lever pops a vent, the tortoise is launched onto his back and a belly stomp hurts him (phase 2)', b1.r === 'belly' && b1.open && b1.hp === b1.hp0 - 1 && b1.phase === 2, b1);
  await page.evaluate(() => { const b = boss(), p = P(); p.x = b.arenaX0 + 60; p.y = b.floorY - p.h; sim(0.2); });
  // (c) phase 2: the low-gravity bubbles switch on and off; he spins across the floor like a disc
  const ph2 = await page.evaluate(() => {
    const b = boss(), g = S(), p = P(); p.x = b.arenaX0 + 60; p.y = b.floorY - p.h;
    const bubbleOn = waitFor(() => g.area.zones.some(z => z.ecTag && !z.off), 8);
    const onTag = (g.area.zones.find(z => z.ecTag && !z.off) || {}).ecTag;
    const spun = waitFor(() => b.act === 'spin', 14);
    const off = waitFor(() => g.area.zones.every(z => !z.ecTag || z.off), 8);
    const other = waitFor(() => g.area.zones.some(z => z.ecTag && !z.off && z.ecTag !== onTag), 8);
    return { bubbleOn, onTag, spun, off, other };
  });
  check('phase 2: the equator bubbles pulse on and off (left, then right) and he spins across the floor', ph2.bubbleOn && ph2.spun && ph2.off && ph2.other, ph2);
  // a spinning tortoise over a popping vent is flipped too; (e) screenshot of him belly-up with a vent erupting
  const spinFlip = await page.evaluate(() => {
    const b = boss(), p = P(); p.invuln = 99;
    b.go('tuck'); sim(0.7); pressLever(p); const v = vents().find(v => v.state !== 'idle'); if (!v) return { r: 'no vent' };
    waitFor(() => v.state === 'erupt', 1); b.x = v.cx - b.w / 2;
    const flipped = waitFor(() => b.act === 'flip', 1); const belly = waitFor(() => b.act === 'belly', 3);
    return { r: flipped && belly ? 'belly' : b.act };
  });
  check('a vent catches him mid-spin as well', spinFlip.r === 'belly', spinFlip);
  await page.evaluate(() => { const b = boss(), p = P(); p.x = b.cx - p.w / 2 + 90; p.y = b.floorY - p.h; sim(0.4); pressLever(p); sim(0.6); });
  await shot('ec-1-belly-up.png');
  // the second belly stomp: phase 3 (ice floes drift in, the lever pops two vents at once)
  const ph3 = await page.evaluate(() => {
    const b = boss(), p = P(), g = S(); p.invuln = 99;
    if (b.act !== 'belly') { waitFor(() => b.act === 'walk', 4); flipHim(b, p); }
    stompBoss(b, p); sim(0.3);
    const floes = g.entities.filter(e => e.constructor.name === 'MovingPlatform' && e.skin === 'ecFloe').length;
    waitFor(() => b.act === 'walk' && lever().cool <= 0, 6); p.x = b.arenaX0 + 60; p.y = b.floorY - p.h;
    pressLever(p); const firing = vents().filter(v => v.state !== 'idle').length;
    return { hp: b.hp, phase: b.phase, floes, firing };
  });
  check('phase 3: ice floes drift in and the lever fires two vents at once', ph3.phase === 3 && ph3.hp === 2 && ph3.floes === 2 && ph3.firing === 2, ph3);
  await page.evaluate(() => { const b = boss(); waitFor(() => vents().some(v => v.state === 'erupt'), 1); });
  await shot('ec-2-tilting-floor.png');
  // (d) the last two hits and the sulk: the shell rolls off, the door opens, Brady leaves
  const fin = await page.evaluate(() => {
    const b = boss(), p = P(), g = S(); p.invuln = 99; p.x = b.arenaX0 + 60; p.y = b.floorY - p.h;
    waitFor(() => b.act === 'walk', 6); b.hurtT = 0; b.damage(1); sim(0.4); waitFor(() => b.act === 'walk', 6); b.hurtT = 0; b.damage(1); sim(0.05);
    const sulk = b.act === 'sulk'; const before = doorTile(b); sim(1.6); const rolling = b.act === 'sulk' && Math.abs(b.vx) > 2 * 32;
    waitFor(() => !boss(), 8); const after = doorTile(b); const state = finish();
    return { sulk, rolling, before, after, state };
  });
  check('beaten, he sulks into his shell and rolls off; the door opens and Brady leaves the fort', fin.sulk && fin.rolling && fin.before === 5 && fin.after === 0 && fin.state === 'results', fin);
};
