// The Moon 18-5: Madame Moo, the headliner (the last boss of the game). Three phases:
// 1 THE BIG JUMP: a crouch (the tell, her shadow on the floor), a sky-high jump, she lands on the shadow with a
//   shockwave both ways, then her hooves are STUCK in the dust (the weak spot: stomp her head).
// 2 THE MILKY WAY (after two hits): the stage's gravity drops; she snorts (tell) and charges across in the air; into
//   the wall she goes DIZZY (stomp her).
// 3 THE GRAND FINALE (after four hits): gravity back; two jumps in a row with a MOO ring and golf balls on target
//   rings, then STUCK again. Six hits. Clearing the stage goes to the results like any boss level.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('18-5'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style, g: S().area.gravity }; });
  check('moon: Madame Moo wakes on the lunar stage (6 hp, the stage in low gravity)', r.state === 'fight' && r.hp === 6 && r.style === 'moon_moo' && r.g < 1, r);
  await ev(() => sim(0.6));
  await snap('moon_moo_wake.png');
  // the big jump: a crouch first (the tell: at least half a second), her shadow under Brady, then she lands there
  r = await ev(() => {
    const b = boss(), p = P(); b.go('crouch'); sim(1 / 120); const tx = b.tx; let crouchT = 0;
    while (b.act === 'crouch' && crouchT < 3) { sim(1 / 60); crouchT += 1 / 60; }
    const leapt = b.act === 'leap'; let peak = b.y; for (let k = 0; k < 300 && b.act === 'leap'; k++) { sim(1 / 120); peak = Math.min(peak, b.y); }
    const waves = S().entities.filter(e => e.ground && !e.remove).length; sim(1 / 120);
    return { crouchT: +crouchT.toFixed(2), leapt, high: Math.round((b.floorY - b.h - peak) / 32), landedAt: Math.round(Math.abs(b.cx - tx)), act: b.act, vuln: b.vuln, waves };
  });
  check('moon: THE BIG JUMP: a crouch tell over half a second, a sky-high jump, she lands on her shadow with a shockwave each way', r.crouchT >= 0.5 && r.leapt && r.high >= 6 && r.landedAt < 8 && r.waves >= 2, r);
  check('moon: after the landing her hooves are STUCK in the dust (the weak spot is open)', r.act === 'stuck' && r.vuln, r);
  await snap('moon_moo_stuck.png');
  // a stomp on her outside the weak moments bounces off
  r = await ev(() => { const b = boss(), p = P(); b.go('trot'); sim(0.1); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.05); return { hp: b.hp }; });
  check('moon: a stomp while she trots bounces off', r.hp === 6, r);
  const stompStuck = () => ev(() => {
    const b = boss(), p = P(), hp0 = b.hp; for (const e of S().entities) if (e.constructor && e.constructor.name === 'TourShot') e.remove = true;
    b.go('crouch'); b.hurtT = 0; for (let k = 0; k < 600 && b.act !== 'stuck'; k++) sim(1 / 120); sim(1 / 120);
    const stuck = b.act === 'stuck' && b.vuln;
    p.x = b.cx + 30 - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.06);
    const hp = b.hp; sim(1.2); return { stuck, hp0, hp, phase: b.phase, g: S().area.gravity };
  });
  for (let k = 1; k <= 2; k++) { r = await stompStuck(); check(`moon hit ${k}: stuck in the dust, a stomp on her head counts`, r.stuck && r.hp === r.hp0 - 1, r); }
  check('moon: PHASE 2 after two hits: the stage gravity drops low (THE MILKY WAY)', r.phase === 2 && r.g < 0.3, r);
  await snap('moon_moo_phase2.png');
  // the charge: a snort (tell), then across the stage in the air; into the wall: DIZZY
  const charge = () => ev(() => {
    const b = boss(), p = P(), hp0 = b.hp; b.hurtT = 0; b.go('snort'); let snortT = 0; while (b.act === 'snort' && snortT < 3) { sim(1 / 60); snortT += 1 / 60; }
    const charged = b.act === 'charge' || b.act === 'dizzy'; for (let k = 0; k < 600 && b.act === 'charge'; k++) sim(1 / 120); sim(1 / 120);
    const dizzy = b.act === 'dizzy' && b.vuln; sim(0.5);
    p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.06);
    const hp = b.hp; sim(1.2); return { snortT: +snortT.toFixed(2), charged, dizzy, hp0, hp, phase: b.phase, g: S().area.gravity };
  });
  r = await charge();
  check('moon hit 3: a snort tell, the charge across the stage, into the wall: DIZZY, and a stomp counts', r.snortT >= 0.5 && r.charged && r.dizzy && r.hp === r.hp0 - 1, r);
  await ev(() => { const b = boss(); b.go('snort'); sim(0.5); }); await snap('moon_moo_snort.png');
  r = await charge();
  check('moon hit 4: a second charge and stomp', r.dizzy && r.hp === r.hp0 - 1, r);
  check('moon: PHASE 3 after four hits: gravity back on (THE GRAND FINALE)', r.phase === 3 && r.g > 0.5, r);
  // the finale: two jumps in a row, the MOO ring, a golf-ball target ring; then stuck
  r = await ev(() => {
    const b = boss(); b.hurtT = 0; b.jumps = 0; b.rainT = 0; b.go('crouch'); let leaps = 0, ring = false, target = false, last = b.act;
    for (let k = 0; k < 120 * 8 && b.act !== 'stuck'; k++) { sim(1 / 120); if (b.act === 'leap' && last !== 'leap') leaps++; last = b.act; if (S().entities.some(e => e.art && e.vx && !e.ground && e.h === 34)) ring = true; if (S().entities.some(e => e.constructor.name === 'RainSpot')) target = true; }
    return { leaps, ring, target, act: b.act };
  });
  check('moon: THE GRAND FINALE: two jumps in a row, a MOO ring rolls across, golf balls on target rings, then STUCK', r.leaps >= 2 && r.ring && r.target && r.act === 'stuck', r);
  await snap('moon_moo_finale.png');
  for (let k = 5; k <= 6; k++) { r = await stompStuck(); check(`moon hit ${k}: stuck again, the stomp counts`, r.stuck && r.hp === r.hp0 - 1, r); }
  r = await ev(() => { for (let k = 0; k < 40 && boss() && !boss().remove; k++) sim(0.1); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying', g: S().area.gravity }; });
  check('moon: the sixth stomp: she takes her bow and is gone (the stage gravity is back)', r.gone && r.g > 0.5, r);
  await snap('moon_moo_beaten.png');
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('moon: the gate clears 18-5 to the results like any boss level', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
