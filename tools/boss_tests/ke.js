// Kenya 15-5: Big Kiboko, the hippo who does water ballet. Mechanic: she swims under the waterhole (only her ears and
// eyes show), RISES with a tell (bubbles, a note, 0.9 s), then either leaps a GRAND JETÉ onto a shore (her shadow marks
// the landing spot; a splash wave runs both ways along the sand) and takes a BOW (head down: the weak spot is open),
// or (phase 2, from 3 hp) does a PIROUETTE on the water, flinging rings of drops over both shores. Phase 3 (the last
// hp): the encore, a double jeté shore to shore. Stomps while she is up and not bowing bounce off. Five hits in all.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('15-5'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style, pool: !!b.pool }; });
  check('ke: Big Kiboko wakes at the waterhole', r.state === 'fight' && r.hp === 5 && r.style === 'ke_kiboko' && r.pool, r);
  await ev(() => sim(0.8));
  await snap('ke_kiboko_wake.png');
  // the rise: a tell of at least half a second before she comes out
  r = await ev(() => { const b = boss(); b.go('swim'); sim(0.05); let n = 0; while (b.act === 'swim' && n++ < 400) sim(1 / 120); const t0 = S().t; let m = 0; while (b.act === 'rise' && m++ < 400) sim(1 / 120); return { rose: n < 400, tell: Math.round((S().t - t0) * 100) / 100, next: b.act }; });
  check('ke: she rises with a tell (bubbles, a note) of at least 0.5 s', r.rose && r.tell >= 0.5 && (r.next === 'jete' || r.next === 'spin'), r);
  // the jeté: Brady on the left shore; her shadow marks where she lands (on his shore); the splash waves
  r = await ev(() => {
    const b = boss(), p = P(), g = S(); for (const e of g.entities) if (e.constructor.name === 'TourShot') e.remove = true;
    p.x = b.arenaX0 + 4 * 32; p.y = b.floorY - p.h; p.vx = p.vy = 0;
    b.go('jete'); sim(0.3); const shadow = b.shadowX, side = shadow < b.pool.x0;
    let n = 0; while (b.act === 'jete' && n++ < 400) sim(1 / 120);
    const waves = g.entities.filter(e => e.constructor.name === 'TourShot' && e.ground).length;
    return { shadow: !!shadow, side, act: b.act, waves, landedLeft: b.cx < b.pool.x0 };
  });
  check('ke: GRAND JETÉ: her shadow marks a landing spot on Brady\'s shore; she lands there with splash waves both ways, then bows', r.shadow && r.side && r.landedLeft && r.waves >= 2 && r.act === 'bow', r);
  await snap('ke_kiboko_bow.png');
  // a stomp while she walks back (not bowing) bounces off
  r = await ev(() => { const b = boss(), p = P(); b.go('return'); sim(0.1); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.08); return { hp: b.hp }; });
  check('ke: a stomp while she is up but not bowing bounces off', r.hp === 5, r);
  await ev(() => { const b = boss(); b.go('jete'); sim(0.5); });
  await snap('ke_kiboko_jete.png');
  const hitOnce = async label => {
    const r = await ev(() => {
      const b = boss(), p = P(), g = S(), hp0 = b.hp;
      for (const e of g.entities) if (e.constructor.name === 'TourShot') e.remove = true;
      b.hurtT = 0; b.x = b.arenaX0 + 3 * 32; b.y = b.floorY - b.h; b.go('bow'); sim(0.4);
      const vuln = b.vuln;
      p.x = b.cx + 20 - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.08);
      const hp = b.hp; sim(1.2);
      return { vuln, hp0, hp, phase: b.phase, state: b.state, ps: p.state, inv: Math.round(p.invuln), py: Math.round((p.y + p.h) / 32), bx: Math.round(b.cx / 32), by: Math.round(b.y / 32), act: b.act };
    });
    check(label + ': in her bow the weak spot is open, and a stomp counts', r.vuln && r.hp === r.hp0 - 1, r);
    return r;
  };
  for (let k = 1; k <= 5; k++) {
    const r2 = await hitOnce('ke hit ' + k);
    if (k === 2) {
      check('ke: phase 2 after two hits', r2.phase === 2, r2);
      r = await ev(() => { const b = boss(), g = S(); b.x = (b.pool.x0 + b.pool.x1) / 2 - b.w / 2; b.go('spin'); const t0 = g.t; let first = -1; for (let q = 0; q < 300; q++) { sim(1 / 120); if (first < 0 && g.entities.some(e => e.constructor.name === 'TourShot' && !e.ground)) first = g.t - t0; } return { drops: g.entities.filter(e => e.constructor.name === 'TourShot' && !e.ground).length, tell: Math.round(first * 100) / 100 }; });
      check('ke: phase 2: the PIROUETTE spins up (a tell over 0.5 s), then flings drops over both shores', r.drops >= 6 && r.tell >= 0.5, r);
      await ev(() => { const b = boss(); b.go('spin'); sim(1.1); });
      await snap('ke_kiboko_pirouette.png');
      await ev(() => { const b = boss(); b.go('dive'); sim(0.6); });
    }
    if (k === 4) {
      check('ke: phase 3 after four hits', r2.phase === 3, r2);
      r = await ev(() => { const b = boss(), p = P(); p.x = b.arenaX0 + 4 * 32; p.y = b.floorY - p.h; b.x = (b.pool.x0 + b.pool.x1) / 2 - b.w / 2; b.go('jete'); const sides = []; for (let q = 0; q < 600 && b.act !== 'bow'; q++) { const a = b.act, n = b.goN; sim(1 / 120); if (b.act === 'jete' && b.goN !== n) sides.push(b.cx < b.pool.x0 ? 'L' : 'R'); } return { act: b.act, sides, end: b.cx < b.pool.x0 ? 'L' : 'R' }; });
      check('ke: phase 3: the encore is a double jeté, shore to shore, before the bow', r.act === 'bow' && r.sides.length >= 1, r);
    }
    if (r2.hp <= 0) break;
  }
  r = await ev(() => { for (let k = 0; k < 40 && boss() && !boss().remove; k++) sim(0.1); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying' }; });
  check('ke: the fifth stomp ends the show', r.gone, r);
  await snap('ke_kiboko_beaten.png');
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('ke: the gate clears 15-5', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
