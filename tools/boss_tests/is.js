// Iceland 17-5: the Night Troll. Mechanic: he turns to stone in sunlight. Two polished shields stand at the cave mouth;
// stepping on a shield's stone makes it glint (the sunny spot shows on the floor), then throw the sunrise onto that
// spot. Caught in it, the troll sets to stone: his weak moment (a stomp on his stony head counts; stomps otherwise
// bounce off). His acts: lumber, club slam (a ripple of rocks both ways), boulder (a shadow marks the landing);
// phase 2 (3 hp) throws two; phase 3 (1 hp) slams shake stalactites loose. Five hits.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('17-5'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style, shields: S().entities.filter(e => e.constructor.name === 'IsSunShield').length }; });
  check('is: the Night Troll wakes in his cave, two shields at the mouth', r.state === 'fight' && r.hp === 5 && r.style === 'is_troll' && r.shields === 2, r);
  await ev(() => sim(0.6));
  await snap('is_troll_wake.png');
  // stomps bounce off him while he is flesh
  r = await ev(() => { const b = boss(), p = P(); b.go('walk'); sim(0.1); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.08); return { hp: b.hp }; });
  check('is: a stomp on him while he is flesh bounces off', r.hp === 5, r);
  // the club: a raise (tell), then a ripple of rocks both ways
  r = await ev(() => { const b = boss(); b.go('club'); sim(0.5); const raised = b.pose === 'raise'; sim(0.4); const rocks = S().entities.filter(e => e.ground && !e.remove).length; return { raised, rocks }; });
  check('is: CLUB: he raises it (the tell), then slams a ripple of rocks both ways', r.raised && r.rocks >= 2, r);
  await snap('is_troll_club.png');
  r = await ev(() => { const b = boss(); for (const e of S().entities) if (e.ground) e.remove = true; b.go('throw'); sim(0.8); return { n: S().entities.filter(e => e.isBoulder && !e.remove).length }; });
  check('is: BOULDER: he throws a boulder (its landing shadow shows)', r.n >= 1, r);
  await snap('is_troll_boulder.png');
  // one hit: Brady steps on a shield's stone, the troll stands on its sunny spot, the beam turns him to stone; stomp
  const hitOnce = async label => {
    const r = await ev(() => {
      const b = boss(), p = P(), hp0 = b.hp;
      for (const e of S().entities) if (e.ground || e.isBoulder || e.constructor.name === 'IsStalactite') e.remove = true;
      const sh = S().entities.filter(e => e.constructor.name === 'IsSunShield')[b.hp % 2];
      sh.state = 'idle'; b.go('walk'); b.hurtT = 0;
      b.x = sh.patch.x + sh.patch.w / 2 - b.w / 2; b.vx = 0;
      p.x = sh.x + sh.w / 2 - p.w / 2; p.y = sh.y - p.h - 1; p.vy = 0; sim(0.05);
      const glint = sh.state === 'glint';
      for (let k = 0; k < 40 && b.act !== 'stone'; k++) { b.x = sh.patch.x + sh.patch.w / 2 - b.w / 2; sim(0.05); }
      const stone = b.act === 'stone', vuln = b.vuln;
      p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.08);
      const hp = b.hp; sim(1.2);
      return { glint, stone, vuln, hp0, hp, phase: b.phase, state: b.state };
    });
    check(label + ': the shield glints and beams; in the sun the troll turns to stone and a stomp on his head counts', r.glint && r.stone && r.vuln && r.hp === r.hp0 - 1, r);
    return r;
  };
  for (let k = 1; k <= 5; k++) {
    if (k === 1) { await ev(() => { const b = boss(), p = P(), sh = S().entities.filter(e => e.constructor.name === 'IsSunShield')[1]; b.x = sh.patch.x + sh.patch.w / 2 - b.w / 2; b.go('walk'); p.x = sh.x + sh.w / 2 - p.w / 2; p.y = sh.y - p.h - 1; sim(0.75); }); await snap('is_troll_sunbeam.png'); await ev(() => { sim(0.6); }); await snap('is_troll_stone.png'); await ev(() => { boss().go('walk'); for (const e of S().entities) if (e.constructor.name === 'IsSunShield') e.state = 'idle'; sim(0.2); }); }
    const r2 = await hitOnce('is hit ' + k);
    if (k === 2) check('is: phase 2 after two hits', r2.phase === 2, r2);
    if (k === 4) {
      check('is: phase 3 after four hits', r2.phase === 3, r2);
      r = await ev(() => { const b = boss(); for (const e of S().entities) if (e.constructor.name === 'IsSunShield') { e.state = 'cool'; e.st = 0; } b.x = b.arenaX0 + 64; b.go('club'); sim(0.8); return { st: S().entities.filter(e => e.constructor.name === 'IsStalactite').length }; });
      check('is: phase 3: his slam shakes stalactites loose (shadows first)', r.st >= 1, r);
      await snap('is_troll_stalactites.png');
    }
    if (r2.hp <= 0) break;
  }
  r = await ev(() => { for (let k = 0; k < 40 && boss() && !boss().remove; k++) sim(0.1); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying' }; });
  check('is: the last stomp at sunrise sets him for good', r.gone, r);
  await snap('is_troll_beaten.png');
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('is: the gate clears 17-5', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
