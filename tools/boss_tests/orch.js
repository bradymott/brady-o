// The Orchard After Closing 28-6: THE WINDFALL COMMITTEE, three pears on one stalk. Pears can't be stomped. Every
// hit is a vote: a pear sits on a sprung branch, Brady stands under it on its mark and presses THROW (plucks it from
// underneath): the spring flicks the pear into the voting basket. Two votes per member.
// 1 THE CHAIR raises its leaf (0.9 s, a shadow on the lawn) and drops onto the branch nearest Brady: stand clear.
// 2 THE TREASURER blushes on one cheek (1.0 s) and lunges along that half of the lawn: wait on the other half.
// 3 THE SECRETARY points its stalk at Brady (1.0 s) and lunges AWAY from him: only a pear on the basket's (left)
//   half flicks into the basket, so stand on the far (right) side.
// The player here is a thumb on the stick and the two buttons, through the game loop, no retries, damage ON.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const snap = async n => { await ev(() => { const s = S(); s._u = s.update; s.update = () => {}; }); await shot(n); await ev(() => { const s = S(); s.update = s._u; }); };
  await ev(() => { start('28-6'); enterArena(); P().invuln = 0; P().setPower(1, true); sim(0.5); });
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style, perches: b.perches && b.perches.length }; });
  check('orch: the Windfall Committee wakes over the lawn (6 hp, four sprung branches)', r.state === 'fight' && r.hp === 6 && r.style === 'orch_committee' && r.perches === 4, r);
  await snap('orch_committee_wake.png');
  // a stomp on the committee just bounces
  r = await ev(() => { const b = boss(), p = P(), hp = b.hp; p.invuln = 999; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 4; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.05); sim(1.0); p.invuln = 0; return { hp, hp2: b.hp }; });
  check('orch: a stomp on the committee just bounces (NOT THE FRUIT!)', r.hp === r.hp2, r);
  // the thumb: walk to a spot; a step of the fight, one act at a time (real inputs through the game loop)
  await ev(() => {
    window.orchStep = () => {
      const b = boss(), p = P(), br = window.BRADY_TOUR.orchKit.committee, Pa = br.active(b), ph = b.phase || 1, mid = (b.arenaX0 + b.arenaX1) / 2;
      let target = null, inp = {};
      if (b.act === 'sit') target = Pa.perch.x;
      else if (ph === 1 && b.act === 'tell' && Pa.perch) target = Pa.perch.x + (Pa.perch.x < mid ? 3 : -3) * 32;
      else if (ph === 2 && (b.act === 'tell' || b.act === 'move')) target = Pa.side < 0 ? b.arenaX1 - 3 * 32 : b.arenaX0 + 4 * 32;
      else if (ph === 3 && b.act !== 'sit') target = b.arenaX1 - 3 * 32;
      if (b.act === 'sit' && Math.abs(p.cx - Pa.perch.x) < 10 && p.onGround) inp = { action: true, actionPressed: true };
      else if (target != null && Math.abs(p.cx - target) > 8) inp = { right: p.cx < target, left: p.cx > target };
      sim(1 / 120, inp);
    };
    window.fightUntil = (cond, sec) => { const b = boss(); let tell = 0, a0 = null; for (let k = 0; k < (sec || 40) * 120 && !cond(b); k++) { if (b.act === 'tell') tell = Math.max(tell, b.at); orchStep(); } return tell; };
  });
  // ① THE CHAIR
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; const tell = fightUntil(b => b.act === 'sit'); return { tell: +tell.toFixed(2), act: b.act, hurt: p.power !== pw }; });
  check('orch: the Chair raises its leaf (a 0.9 s tell, a shadow) and drops onto a branch; Brady stands clear', r.tell >= 0.85 && r.act === 'sit' && !r.hurt, r);
  await snap('orch_committee_chair_sits.png');
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; fightUntil(b => b.hp <= 4); sim(0.5); return { hp: b.hp, phase: b.phase, votes: b.votes, hurt: p.power !== pw }; });
  check('orch hits 1-2: plucked from underneath twice, the Chair flicks into the basket: PHASE 2', r.hp === 4 && r.phase === 2 && r.votes === 2 && !r.hurt, r);
  // ② THE TREASURER
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; let tell = 0; for (let k = 0; k < 120 * 20 && b.act !== 'sit'; k++) { if (b.act === 'tell') tell = Math.max(tell, b.at); orchStep(); } return { tell: +tell.toFixed(2), act: b.act, hurt: p.power !== pw }; });
  check('orch: the Treasurer blushes (a 1.0 s tell) and lunges along its side; Brady waits on the other half', r.tell >= 0.95 && r.act === 'sit' && !r.hurt, r);
  await snap('orch_committee_treasurer.png');
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; fightUntil(b => b.hp <= 2); sim(0.5); return { hp: b.hp, phase: b.phase, hurt: p.power !== pw }; });
  check('orch hits 3-4: the Treasurer plucked twice: PHASE 3', r.hp === 2 && r.phase === 3 && !r.hurt, r);
  // ③ THE SECRETARY: from the basket's side it lunges away: its flick misses (TABLED); from the far side it scores
  r = await ev(() => {
    const b = boss(), p = P(), br = window.BRADY_TOUR.orchKit.committee, Pa = br.active(b), pw = p.power;
    // first the wrong way: stand on the basket's half while it points
    for (let k = 0; k < 120 * 10 && b.act !== 'tell'; k++) { const x = b.arenaX0 + 5 * 32; sim(1 / 120, Math.abs(p.cx - x) > 8 ? { right: p.cx < x, left: p.cx > x } : {}); }
    let tell = 0; for (let k = 0; k < 120 * 3 && b.act === 'tell'; k++) { tell = b.at; sim(1 / 120); }
    for (let k = 0; k < 120 * 4 && b.act !== 'sit'; k++) sim(1 / 120);
    const side = Pa.perch && Pa.perch.x > (b.arenaX0 + b.arenaX1) / 2 ? 'far' : 'basket', hp0 = b.hp;
    for (let k = 0; k < 120 * 8 && b.act === 'sit'; k++) orchStep();
    for (let k = 0; k < 120 * 3 && b.act === 'flick'; k++) sim(1 / 120);
    return { tell: +tell.toFixed(2), side, hp0, hp: b.hp, hurt: p.power !== pw };
  });
  check('orch: the Secretary points (a 1.0 s tell) and lunges AWAY from Brady; plucked on the far side, its flick misses: TABLED', r.tell >= 0.95 && r.side === 'far' && r.hp === r.hp0 && !r.hurt, r);
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; fightUntil(b => b.state === 'dying' || b.remove, 60); return { gone: b.state === 'dying' || b.remove, hurt: p.power !== pw, votes: b.votes }; });
  check('orch hits 5-6: from the far side the Secretary lunges toward the basket, plucked twice: MOTION CARRIED', r.gone && r.votes === 6 && !r.hurt, r);
  await ev(() => sim(0.6)); await snap('orch_committee_beaten.png');
  r = await ev(() => { const g = S(), p = P(); for (let k = 0; k < 30 && g.entities.some(e => e.boss && !e.remove); k++) sim(0.1); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 999; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('orch: the gate clears 28-6 to the results like any boss level', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
