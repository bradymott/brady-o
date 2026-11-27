// Pupo Standard Time 32-6: The Interrupter (the great dream parrot). Three phases, two hits each; every hit is the
// full stop pushed (by walking into it, real inputs) into the right slot of Pupo's sentence at the right moment:
// 1 THE COMMAS  it sucks in its cheeks (tell >= 0.5 s) and spits comma seeds; with the stop behind Pupo's first word
//               the seeds plop on the desk and it takes the hit
// 2 THE CLAUSE  it raises a wing (tell) and sweeps a clause along the floor; the stop behind the second word cuts it off
// 3 THE SHOUT   its beak opens round an empty bubble (tell) before the shout; a stop placed before Pupo says "please"
//               is knocked away; stand quietly by the blank until he says it, then push the stop in: the hit
// A stomp never hurts it. At the end it passes the biscuits; the gate clears 32-6.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('32-6'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style, stop: !!S().entities.find(e => e.constructor.name === 'PstStop') }; });
  check('pst: The Interrupter wakes on its inkstand (6 hp); the full stop waits on Pupo\'s sentence', r.state === 'fight' && r.hp === 6 && r.style === 'pst_parrot' && r.stop, r);
  await ev(() => sim(1.2)); await snap('pst_parrot_wake.png');
  // push the full stop into slot k with real inputs (walk into it from the left, let go near the slot)
  await ev(() => {
    window.pushTo = k => {
      const g = S(), p = P(), st = g.entities.find(e => e.constructor.name === 'PstStop'), sx = st.slots[k] * 32 + 16;
      if (st.slotIn === k) return true;
      // stand behind it, then walk it along
      p.x = st.x - p.w - 6; p.y = st.y + st.h - p.h; p.vx = 0; p.vy = 0; sim(0.2);
      for (let q = 0; q < 900 && st.slotIn !== k; q++) { sim(1 / 120, { right: true }); if (st.cx > sx + 20) break; }
      sim(0.3); window.__push = { slotIn: st.slotIn, cx: Math.round(st.cx), sx, px: Math.round(P().cx), lock: st.lockT, left: st.leftT }; return st.slotIn === k;
    };
  });
  // a stomp on it just bounces
  r = await ev(() => { const b = boss(), p = P(); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.05); const hp = b.hp; sim(0.6); return { hp }; });
  check('pst: a stomp on the parrot only bounces off (EXCUSE ME!)', r.hp === 6, r);
  // PHASE 1: the cheeks tell, the commas; the stop after the first word: the seeds plop, the hit
  r = await ev(() => { const b = boss(); b.go('perch'); let t = 0; for (let k = 0; k < 120 * 6 && b.act !== 'suck'; k++) sim(1 / 120); const t0 = S().t; while (b.act === 'suck' && t < 3) { sim(1 / 60); t += 1 / 60; } const shots = S().entities.filter(e => e.constructor.name === 'TourShot').length; return { tell: +t.toFixed(2), shots }; });
  check('pst phase 1: it sucks in its cheeks (a tell over half a second), then spits comma seeds', r.tell >= 0.5 && r.shots >= 3, r);
  await ev(() => { const b = boss(); b.go('suck'); sim(0.5); }); await snap('pst_parrot_commas.png');
  const hitPhase = (k, act) => ev(([k, act]) => {
    const b = boss(), hp0 = b.hp; for (const e of S().entities) if (e.constructor.name === 'TourShot') e.remove = true;
    b.hurtT = 0; const ok = pushTo(k); b.go('perch'); let tell = 0;
    for (let q = 0; q < 120 * 8 && b.act !== act; q++) sim(1 / 120);
    while (b.act === act && tell < 3) { sim(1 / 60); tell += 1 / 60; }
    sim(0.2); return { ok, hp0, hp: b.hp, phase: b.phase, tell: +tell.toFixed(2), push: window.__push };
  }, [k, act]);
  for (let n = 1; n <= 2; n++) { r = await hitPhase(0, 'suck'); check(`pst hit ${n}: the full stop after "I": the seeds plop on the desk, the parrot chokes on its interruption`, r.ok && r.hp === r.hp0 - 1, r); }
  check('pst: PHASE 2 after two hits (THE CLAUSE)', r.phase === 2, r);
  r = await ev(() => { const b = boss(); for (const e of S().entities) if (e.constructor.name === 'TourShot') e.remove = true; b.go('perch'); let t = 0; for (let k = 0; k < 120 * 6 && b.act !== 'wing'; k++) sim(1 / 120); while (b.act === 'wing' && t < 3) { sim(1 / 60); t += 1 / 60; } const sweep = S().entities.some(e => e.constructor.name === 'TourShot' && e.w === 50); return { tell: +t.toFixed(2), sweep }; });
  check('pst phase 2: a wing goes up (a tell over half a second), then a clause sweeps along the floor', r.tell >= 0.5 && r.sweep, r);
  await ev(() => sim(0.4)); await snap('pst_parrot_clause.png');
  // the sweep can be jumped (a real jump over it)
  r = await ev(() => { const g = S(), p = P(), sh = g.entities.find(e => e.constructor.name === 'TourShot' && e.w === 50); if (!sh) return { none: true }; for (const e of g.entities) if (e.constructor.name === 'TourShot' && e !== sh) e.remove = true; const b = boss(); b.go('perch'); b.at = -3; p.x = (b.arenaX0 + b.arenaX1) / 2 - 60; p.y = 14 * 32 - p.h; p.vx = 0; sim(0.1); p.invuln = 0; const pw = p.power; for (let k = 0; k < 240 && sh.x + sh.w > p.x - 10 && !sh.remove; k++) { const d = sh.x - (p.x + p.w); sim(1 / 120, d < 36 && d > 0 && p.onGround ? { jump: true, jumpPressed: true } : { jump: !p.onGround }); } const hurt = p.power !== pw || (p.invuln > 0 && p.invuln < 5) || p.dead; p.invuln = 999; return { hurt, dead: p.dead }; });
  check('pst phase 2: the sweeping clause can be jumped', !r.hurt && !r.none, r);
  for (let n = 3; n <= 4; n++) { r = await hitPhase(1, 'wing'); check(`pst hit ${n}: the full stop after "WOULD" cuts the sweep off`, r.ok && r.hp === r.hp0 - 1, r); }
  check('pst: PHASE 3 after four hits (THE SHOUT)', r.phase === 3, r);
  // too early: the stop in the last slot before "please" is knocked away by the shout
  r = await ev(() => { const b = boss(), st = S().entities.find(e => e.constructor.name === 'PstStop'); for (const e of S().entities) if (e.constructor.name === 'TourShot') e.remove = true; b.please = false; b.quietT = 0; const ok = pushTo(2); const p = P(); p.x -= 120; sim(0.3); b.go('perch'); let t = 0; for (let k = 0; k < 120 * 6 && b.act !== 'beak'; k++) sim(1 / 120); const hp0 = b.hp; while (b.act === 'beak' && t < 3) { sim(1 / 60); t += 1 / 60; } sim(0.3); return { ok, tell: +t.toFixed(2), hp0, hp: b.hp, slot: st.slotIn }; });
  check('pst phase 3: the beak opens round an empty bubble (a tell), and a stop placed before Pupo says "please" is knocked away', r.ok && r.tell >= 0.5 && r.hp === r.hp0 && r.slot === -1, r);
  await ev(() => { const b = boss(); b.go('beak'); sim(0.6); }); await snap('pst_parrot_shout.png');
  for (let n = 5; n <= 6; n++) {
    r = await ev(() => {
      const b = boss(), p = P(), g = S(); for (const e of g.entities) if (e.constructor.name === 'TourShot') e.remove = true;
      b.hurtT = 0; b.go('perch'); b.at = 0;
      // stand quietly beside the blank space until Pupo says please
      const blank = (b.arenaX0 / 32 + 15) * 32 + 16; p.x = blank - p.w / 2; p.y = 14 * 32 - p.h; p.vx = 0; p.vy = 0;
      let t = 0; while (!b.please && t < 6) { sim(1 / 60); t += 1 / 60; if (b.act !== 'perch') b.go('perch'); }
      const please = b.please, hp0 = b.hp, ok = pushTo(2);
      for (let k = 0; k < 120 * 6 && b.act !== 'beak'; k++) sim(1 / 120);
      for (let k = 0; k < 240 && b.hp === hp0; k++) sim(1 / 120);
      sim(0.2); return { please, wait: +t.toFixed(2), ok, hp0, hp: b.hp, state: b.state };
    });
    check(`pst hit ${n}: quiet by the blank until Pupo says "please", then the stop in the last slot`, r.please && r.ok && r.hp === r.hp0 - 1, r);
  }
  await snap('pst_parrot_biscuits.png');
  r = await ev(() => { for (let k = 0; k < 40 && boss() && !boss().remove; k++) sim(0.1); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying' }; });
  check('pst: the sixth hit: the parrot passes the biscuits and is gone', r.gone, r);
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('pst: the gate clears 32-6 to the results like any boss level', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
