// The Red-Eye 25-4: Captain Gull. Mechanic: he keeps out of reach in the air with his sack of stolen pretzels dangling
// under him on a string; stomping the SACK yanks him down to the floor, dazed (his weak spot is open); then a stomp on
// HIM counts. Stomps on him in the air bounce off. Phase 2 (after two hits) calls his crew; phase 3 (after four) flaps a
// gale. Five hits in all.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('25-4'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style, sack: !!b.hasSack }; });
  check('eye: Captain Gull wakes in the cargo hold with his sack of pretzels', r.state === 'fight' && r.hp === 5 && r.style === 'eye_gull' && r.sack, r);
  await ev(() => sim(0.6));
  await snap('eye_gull_wake.png');
  // a stomp on him while he flies bounces off
  r = await ev(() => { const b = boss(), p = P(); b.go('circle'); sim(0.1); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.08); return { hp: b.hp, act: b.act }; });
  check('eye: a stomp on him in the air bounces off (no damage)', r.hp === 5, r);
  // the swoop: he skims low across the hold, the sack trailing behind him
  r = await ev(() => { const b = boss(); b.go('swoop'); for (let k = 0; k < 40 && b.stage !== 1; k++) sim(0.1); sim(0.25); return { stage: b.stage, low: Math.round((b.floorY - (b.y + b.h)) / 32 * 10) / 10 }; });
  check('eye: SWOOP: after his squawk he skims low across the hold', r.stage === 1 && r.low < 4, r);
  await snap('eye_gull_swoop.png');
  // the boomerang pretzels
  r = await ev(() => { const b = boss(); for (const e of S().entities) if (e.boomer) e.remove = true; b.go('fling'); sim(1.0); return { n: S().entities.filter(e => e.boomer && !e.remove).length }; });
  check('eye: he flings pretzels that boomerang', r.n >= 1, r);
  await snap('eye_gull_pretzels.png');
  // one hit: stomp the sack (he crashes down dazed), then stomp him
  const hitOnce = async label => {
    const r = await ev(() => {
      const b = boss(), p = P(), K = window.BRADY_TOUR.Tour.eyeKit, hp0 = b.hp;
      for (const e of S().entities) if (e.boomer || e.crewLife != null) e.remove = true;
      b.go('circle'); b.hurtT = 0; sim(0.3);
      const s = K.gullBrain.sack(b);
      p.x = s.x + s.w / 2 - p.w / 2; p.y = s.y - p.h - 4; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.05);
      const yanked = b.act === 'yanked';
      for (let k = 0; k < 30 && b.act !== 'dazed'; k++) sim(0.1);
      const dazed = b.act === 'dazed', vuln = b.vuln;
      p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.08);
      const hp = b.hp; sim(1.4);
      return { yanked, dazed, vuln, hp0, hp, phase: b.phase, state: b.state };
    });
    check(label + ': stomping the sack yanks him down dazed, and a stomp on him counts', r.yanked && r.dazed && r.vuln && r.hp === r.hp0 - 1, r);
    return r;
  };
  for (let k = 1; k <= 5; k++) {
    const r2 = await hitOnce('eye hit ' + k);
    if (k === 1) { await ev(() => { const b = boss(); b.go('circle'); sim(0.2); const K = window.BRADY_TOUR.Tour.eyeKit; const s = K.gullBrain.sack(b); const p = P(); p.x = s.x + s.w / 2 - p.w / 2; p.y = s.y - p.h - 4; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.05); for (let q = 0; q < 30 && b.act !== 'dazed'; q++) sim(0.1); sim(0.3); }); await snap('eye_gull_dazed.png'); await ev(() => { const b = boss(); b.go('flee'); sim(1.2); }); }
    if (k === 2) { check('eye: phase 2 after two hits', r2.phase === 2, r2); await ev(() => { const b = boss(); b.go('crew'); sim(1.0); }); r = await ev(() => ({ crew: S().entities.filter(e => e.crewLife != null && !e.remove).length })); check('eye: phase 2: he calls two of his crew', r.crew === 2, r); await snap('eye_gull_crew.png'); }
    if (k === 4) { check('eye: phase 3 after four hits', r2.phase === 3, r2); r = await ev(() => { const b = boss(), p = P(); p.x = (b.arenaX0 + b.arenaX1) / 2; p.y = b.floorY - p.h; p.vx = 0; const x0 = p.x; b.go('gust'); sim(1.6); return { moved: Math.round(Math.abs(p.x - x0)) }; }); check('eye: phase 3: his gale pushes Brady across the hold', r.moved > 40, r); await snap('eye_gull_gust.png'); }
    if (r2.hp <= 0) break;
  }
  r = await ev(() => { for (let k = 0; k < 40 && boss() && !boss().remove; k++) sim(0.1); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying' }; });
  check('eye: the last stomp sends him off without his pretzels', r.gone, r);
  await snap('eye_gull_beaten.png');
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('eye: the gate clears 25-4', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
