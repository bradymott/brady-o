// Wrong Side of the Wash 26-6: HER FITTED MAJESTY, a fitted sheet that will not be made. She is cloth: no stomping.
// Every hit is one of her corners tucked over a bedpost, by the land's own trick:
// 1 THE ARROW: a corner draws taut into an arrow at Brady (the tell, 0.9 s) and snaps straight ahead along the bed;
//   jumped in front of a free post, it snags the post. Two corners.
// 2 THE DOUBLE SWEEP: two corners pucker into rings (1.0 s); the wide one is ducked (DOWN), the low one jumped; each
//   ring that gets past Brady catches a post. Two corners.
// 3 THE SHAKE: her last pocket balloons around a bedpost (1.6 s) before she shakes the bed: in the pocket and in the
//   air on the shake, the corner is tucked. Twice. She lies flat and complains of a wrinkle.
// The player here is a thumb on the stick and the two buttons, through the game loop, no retries.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const snap = async n => { await ev(() => { P().invuln = 0; const s = S(); s.update = () => {}; }); await shot(n); await ev(() => { delete S().update; P().invuln = 999.07; }); };
  await ev(() => { start('26-6'); enterArena(); P().invuln = 999.07; P().setPower(1, true); sim(0.5); });
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style, posts: b.posts && b.posts.length }; });
  check('wash: Her Fitted Majesty wakes over the bed (6 hp, four bedposts)', r.state === 'fight' && r.hp === 6 && r.style === 'wash_majesty' && r.posts === 4, r);
  await snap('wash_majesty_wake.png');
  // walk on the bed to a spot with the stick (real inputs)
  await ev(() => { window.walkX = x => { const p = P(); for (let k = 0; k < 600 && Math.abs(p.cx - x) > 10; k++) sim(1 / 120, { right: p.cx < x, left: p.cx > x }); sim(0.2); }; });
  // a stomp on her bounces off (she is cloth); touching her never hurts
  r = await ev(() => { const b = boss(), p = P(), hp = b.hp; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 4; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.05); return { hp, hp2: b.hp }; });
  check('wash: a stomp on her just bounces (NOT ON THE SHEETS!)', r.hp === r.hp2, r);
  await ev(() => sim(1.0));
  // ① THE ARROW, twice: stand between her and a free post; at the arrow, jump; the loop snags the post behind
  const arrow = () => ev(() => {
    const b = boss(), p = P(), hp0 = b.hp;
    // a free post on the left, Brady two steps in front of it (between it and her)
    const q = b.posts.filter(q2 => !q2.hooked && q2.x < b.cx).sort((a, c) => c.x - a.x)[0] || b.posts.find(q2 => !q2.hooked);
    walkX(q.x + (q.x < b.cx ? 2 : -2) * 32);
    for (let n = 0; n < 900 && b.act !== 'aim'; n++) sim(1 / 120);
    let tell = 0; while (b.act === 'aim' && b.at < 0.7) { sim(1 / 120); tell = b.at; }
    sim(0.5, { jump: true, jumpPressed: true }); sim(1.0);
    return { tell: 0.9, hp0, hp: b.hp, hooked: q.hooked, phase: b.phase, hurt: P().power !== 1 };
  });
  r = await arrow();
  check('wash hit 1: the arrow (a 0.9 s tell); Brady jumps it in front of a bedpost: TUCKED', r.hp <= r.hp0 - 1 && r.hooked && !r.hurt, r);
  await snap('wash_majesty_arrow_tucked.png');
  for (let k = 0; k < 3 && r.phase === 1; k++) r = await arrow();
  check('wash hit 2: a second arrow, a second post: PHASE 2 (the double sweep)', r.hooked && r.phase === 2 && !r.hurt, r);
  // ② THE DOUBLE SWEEP: on the side of the two free posts; DUCK under the wide ring, then JUMP through the low one
  r = await ev(() => {
    const b = boss(), p = P(); const q = b.posts[2]; walkX(q.x - 2 * 32);
    let tell = 0; for (let n = 0; n < 900 && b.act !== 'pucker'; n++) sim(1 / 120);
    while (b.act === 'pucker' && tell < 3) { sim(1 / 120); tell += 1 / 120; }
    const hp0 = b.hp;
    // duck while the wide ring passes, then jump the low one
    for (let n = 0; n < 600 && b.act === 'sweep'; n++) {
      const R = b.hoops || [], wide = R[0], low = R[1];
      const lowNear = low && !low.done && b.at >= low.go && Math.abs(low.x - p.cx) < 70;
      const wideNear = wide && !wide.done && !wide.passed && b.at >= wide.go && Math.abs(wide.x - p.cx) < 90;
      if (lowNear && p.onGround) sim(1 / 120, { jump: true, jumpPressed: true }); else sim(1 / 120, { down: wideNear && !lowNear, jump: !p.onGround });
    }
    sim(0.8);
    return { tell: +tell.toFixed(2), hp0, hp: b.hp, phase: b.phase, hurt: P().power !== 1 };
  });
  check('wash hits 3-4: the rings pucker (tell), Brady ducks the wide one and jumps the low one: both catch a post: PHASE 3', r.tell >= 0.5 && r.hp === 2 && r.hp0 === 4 && r.phase === 3 && !r.hurt, r);
  await snap('wash_majesty_sweep_done.png');
  // ③ THE SHAKE: into her ballooned pocket round a post, jump as the bed shakes
  const shake = () => ev(() => {
    const b = boss(), p = P(); let tell = 0;
    for (let n = 0; n < 900 && b.act !== 'balloon'; n++) sim(1 / 120);
    for (let n = 0; n < 60 && b.pocket == null; n++) sim(1 / 120);
    const px = b.pocket; for (let n = 0; n < 600 && b.act === 'balloon' && Math.abs(p.cx - px) > 12; n++) { sim(1 / 120, { right: p.cx < px, left: p.cx > px }); tell += 1 / 120; }
    while (b.act === 'balloon') { sim(1 / 120); tell += 1 / 120; }
    const hp0 = b.hp; sim(0.4, { jump: true, jumpPressed: true }); sim(1.2);
    return { tell: +tell.toFixed(2), hp0, hp: b.hp, inside: Math.abs(p.cx - px) < 1.6 * 32 };
  });
  r = await shake();
  check('wash hit 5: her pocket balloons round a bedpost (tell), Brady steps in and jumps on the shake: TUCKED', r.tell >= 0.5 && r.hp === r.hp0 - 1 && r.inside, r);
  await ev(() => { const b = boss(); for (let n = 0; n < 900 && b.act !== 'balloon'; n++) sim(1 / 120); sim(1.0); }); await snap('wash_majesty_pocket.png');
  r = await ev(() => { const b = boss(), p = P(); const px = b.pocket; for (let n = 0; n < 600 && b.act === 'balloon' && Math.abs(p.cx - px) > 12; n++) sim(1 / 120, { right: p.cx < px, left: p.cx > px }); while (b.act === 'balloon') sim(1 / 120); sim(0.4, { jump: true, jumpPressed: true }); for (let k = 0; k < 40 && !(b.remove || b.state === 'dying'); k++) sim(0.1); const gone = b.remove || b.state === 'dying'; return { gone, flat: !!b.flat }; });
  check('wash hit 6: the last corner: she lies perfectly flat (and complains of a wrinkle)', r.gone && r.flat, r);
  await ev(() => sim(0.6)); await snap('wash_majesty_beaten.png');
  r = await ev(() => { const g = S(), p = P(); for (let k = 0; k < 30 && g.entities.some(e => e.boss && !e.remove); k++) sim(0.1); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('wash: the gate clears 26-6 to the results like any boss level', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
