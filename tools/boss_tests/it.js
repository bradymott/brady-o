// Italy 14-5: Il Polpettone, the meatball tenor. Mechanic: he is too saucy to stomp (a stomp bounces off) except when
// he is dizzy: after a ROLL (a tell: he rocks back and spins, HUP!) he bowls across the stage into the wall and sees
// stars. SING: a deep breath, then rings of song roll along the floor both ways. Phase 2 (after two hits): cheese
// graters drop from the flies over a shadow and shower parmesan. Phase 3 (after four): he spits little meatballs and
// rolls twice in a row. Six hits; then a bow.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(() => { P().invuln = 0; }); await shot(n); await ev(v => { P().invuln = v; }, SAFE); };
  await ev(() => { start('14-5'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style }; });
  check('it: Il Polpettone wakes on the grand stage', r.state === 'fight' && r.hp === 6 && r.style === 'it_tenor', r);
  await ev(() => sim(0.5));
  await snap('it_tenor_wake.png');
  // a stomp while he is not dizzy bounces off
  r = await ev(() => { const b = boss(), p = P(); b.go('walk'); sim(0.05); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; let minVy = 1e9; for (let k = 0; k < 10; k++) { sim(1 / 120); minVy = Math.min(minVy, p.vy); } return { hp: b.hp, minVy: Math.round(minVy), act: b.act }; });
  check('it: TOO SAUCY: a stomp on him bounces off', r.hp === 6 && r.minVy < -8 * 32, r);
  // the song: a breath, then rings both ways along the floor
  r = await ev(() => { const b = boss(); b.go('sing'); sim(0.4); const breath = b.pose === 'breathe'; sim(0.7); const rings = S().entities.filter(e => e.ground && e.thru && !e.remove).length; return { breath, rings }; });
  check('it: SING: a deep breath (the tell), then rings of song roll out both ways', r.breath && r.rings >= 2, r);
  await snap('it_tenor_sing.png');
  // one hit: the roll (tell), the crash into the wall, dizzy, a stomp counts
  const hitOnce = async label => {
    const r = await ev(() => {
      const b = boss(), p = P(), hp0 = b.hp;
      for (const e of S().entities) if ((e.ground && e.thru) || e.itChorus || e.constructor.name === 'ItGrater') e.remove = true;
      b.hurtT = 0; b.x = (b.arenaX0 + b.arenaX1) / 2 - b.w / 2; p.x = b.arenaX0 + 40; p.y = b.floorY - 4 * 32 - p.h; p.vy = 0; b.go('roll'); sim(0.3);
      const tell = b.pose === 'tuck';
      let dazed = false; for (let k = 0; k < 160 && !dazed; k++) { sim(0.05); dazed = b.act === 'dazed'; }
      const vuln = b.vuln;
      p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.08);
      const hp = b.hp; sim(1.3);
      return { tell, dazed, vuln, hp0, hp, phase: b.phase, state: b.state };
    });
    check(label + ': HUP! (the tell), he rolls into the wall, dizzy, and a stomp counts', r.tell && r.dazed && r.vuln && r.hp === r.hp0 - 1, r);
    return r;
  };
  for (let k = 1; k <= 6; k++) {
    const r2 = await hitOnce('it hit ' + k);
    if (k === 1) { await ev(() => { const b = boss(); b.go('roll'); sim(0.3); }); await snap('it_tenor_tuck.png'); await ev(() => { const b = boss(); sim(0.4); }); await snap('it_tenor_roll.png'); await ev(() => { const b = boss(); for (let q = 0; q < 80 && b.act !== 'dazed'; q++) sim(0.05); sim(0.2); }); await snap('it_tenor_dazed.png'); await ev(() => { boss().go('walk'); sim(0.2); }); }
    if (k === 2) {
      check('it: phase 2 after two hits', r2.phase === 2, r2);
      r = await ev(() => { const b = boss(); b.go('cheese'); sim(0.5); const gr = S().entities.filter(e => e.constructor.name === 'ItGrater' && !e.remove); const shadow = gr.length && gr[0].state === 'drop'; sim(0.6); return { graters: gr.length, shadow, grating: S().entities.some(e => e.constructor.name === 'ItGrater' && e.state === 'grate') }; });
      check('it: phase 2: PARMIGIANO! graters drop over a shadow, then shower the floor', r.graters >= 1 && r.shadow && r.grating, r);
      await snap('it_tenor_parmesan.png');
    }
    if (k === 4) {
      check('it: phase 3 after four hits', r2.phase === 3, r2);
      r = await ev(() => { const b = boss(); b.go('spit'); sim(1.4); return { chorus: S().entities.filter(e => e.itChorus && !e.remove).length }; });
      check('it: phase 3: he spits little meatballs', r.chorus >= 1, r);
      await snap('it_tenor_chorus.png');
    }
    if (r2.hp <= 0) break;
  }
  r = await ev(() => { for (let k = 0; k < 60 && boss() && !boss().remove; k++) sim(0.1); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying' }; });
  check('it: the last stomp: he takes his bow and leaves the stage', r.gone, r);
  await snap('it_tenor_beaten.png');
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('it: the gate clears 14-5', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
