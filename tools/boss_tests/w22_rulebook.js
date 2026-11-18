// World 22's bonus level 22-6: The Rulebook (mini-boss, src/29_tour_w22_zrulebook.js). Mechanic: it flies (stomps
// bounce off its hard cover), aims (red marks on the floor under its stamps), slams down and falls open: a stomp then
// tears out a page. Phase 2 splashes two ink blots per slam; phase 3 slams twice before it falls open. Three pages.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('22-6'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style }; });
  check('w22_rulebook: the Rulebook wakes in its arena (3 pages)', r.state === 'fight' && r.hp === 3 && r.style === 'w22_rulebook', r);
  await ev(() => sim(0.8));
  await snap('w22_rulebook_fly.png');
  // a stomp while it flies bounces off
  r = await ev(() => { const b = boss(), p = P(); b.go('walk'); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; let up = 0; for (let q = 0; q < 6; q++) { sim(1 / 120); up = Math.min(up, p.vy); } const hp = b.hp; p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; p.vx = p.vy = 0; sim(0.2); return { hp, up }; });
  check('w22_rulebook: a stomp while it flies bounces off its cover (no page)', r.hp === 3 && r.up < -6 * 32, r);
  // aim (the tell), slam, open, stomp: one page each time
  const round = async (k, label) => {
    const r2 = await ev(k => {
      const b = boss(), p = P(); const hp0 = b.hp;
      for (const e of S().entities) if (e.constructor.name === 'TourShot') e.remove = true;
      b.hurtT = 0; b.go('walk'); b.at = 9;
      let aimed = false, slams = 0;
      for (let q = 0; q < 12 * 120 && b.act !== 'open'; q++) { sim(1 / 120); if (b.act === 'aim') aimed = true; slams = Math.max(slams, b.slams || 0); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; p.vy = 0; }
      sim(1 / 120);
      const blots = S().entities.filter(e => e.constructor.name === 'TourShot' && !e.remove).length, open = b.act === 'open', vuln = b.vuln;
      p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.1);
      return { aimed, open, vuln, blots, slams: b.slams, hp0, hp: b.hp, phase: b.phase || 1, act: b.act };
    }, k);
    check(label + ': it aims, slams and falls open, and a stomp tears a page out', r2.aimed && r2.open && r2.vuln && r2.hp === r2.hp0 - 1, r2);
    return r2;
  };
  await ev(() => { const b = boss(); b.go('aim'); sim(0.5); });
  await snap('w22_rulebook_aim.png');
  await ev(() => { const b = boss(), p = P(); for (let q = 0; q < 240 && b.act !== 'open'; q++) { sim(1 / 120); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; p.vy = 0; } sim(0.3); p.x = b.arenaX0 + 40; p.y = b.floorY - p.h; });
  await snap('w22_rulebook_open.png');
  const r1 = await round(1, 'w22_rulebook page 1');
  check('w22_rulebook: phase 2 after the first page', r1.phase === 2, r1);
  await ev(() => sim(0.3)); await snap('w22_rulebook_torn_page.png');
  const r2 = await round(2, 'w22_rulebook page 2');
  check('w22_rulebook: phase 2 slams splash ink blots', r2.blots >= 2, r2);
  check('w22_rulebook: phase 3 after the second page', r2.phase === 3, r2);
  await ev(() => { const b = boss(); b.hurtT = 0; b.go('walk'); b.at = 9; for (let q = 0; q < 6 * 120 && !(b.act === 'slam' && b.slams >= 1); q++) sim(1 / 120); sim(0.05); });
  await snap('w22_rulebook_phase3_double_slam.png');
  const r3 = await round(3, 'w22_rulebook page 3');
  check('w22_rulebook: phase 3 slams twice before it falls open', r3.slams >= 2, r3);
  r = await ev(() => { const b = S().entities.find(e => e.boss); return { act: b && b.act, state: b && b.state }; });
  check('w22_rulebook: the last page (RULE 1) and it snaps shut', r.act === 'exit' || r.state === 'dying', r);
  await ev(() => sim(0.6)); await snap('w22_rulebook_exit.png');
  r = await ev(() => { for (let k = 0; k < 80 && S().entities.some(e => e.boss && !e.remove); k++) sim(0.1); sim(1); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove }; });
  check('w22_rulebook: it is gone and the way out opens', r.gone, r);
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('w22_rulebook: the gate clears 22-6', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
