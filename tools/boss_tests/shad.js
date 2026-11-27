// The Department of Unclaimed Shadows 35-5: THE UNDERSTUDY. Mechanic: stomps only bounce (it is a shadow on the wall);
// every hit is a claim slot closing on part of it. Phase 1: the palm flattens and a dashed reach line runs along the
// skirting (the tell): stand on the HAND slot, jump the reaching hand, then walk past lamp L: the hand is claimed.
// Phase 2: the heel lifts (the tell): stand on the BOOT slot, jump the kick, walk back past lamp R. Phase 3: stand
// between the lamps where both halves' feet sit on their FEET slots while the hats rise (the tell), jump the rush.
// Played with Brady's buttons.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('35-5'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style }; });
  check('shad: the Understudy wakes on the wall', r.state === 'fight' && r.hp === 6 && r.style === 'shad_understudy', r);
  await ev(() => sim(0.6));
  await snap('shad_understudy_wake.png');
  r = await ev(() => { const b = boss(), p = P(); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.08); sim(1); return { hp: b.hp }; });
  check('shad: a stomp on the Understudy just bounces off (it is a shadow)', r.hp === 6, r);
  const G = () => ev(() => window.BRADY_TOUR.Tour.shadKit.understudyBrain.geo(boss()));
  const walkTo = x => ev(x => { const p = P(); for (let k = 0; k < 600; k++) { const d = x - p.cx, brake = p.vx * p.vx / (2 * 30 * 32) + 4; if (Math.abs(d) < 5 && Math.abs(p.vx) < 20) break; sim(1 / 120, { left: d < -brake, right: d > brake }); } sim(0.05); }, x);
  // one reach (phase 1) or kick (phase 2): stand at x during the tell, jump the limb, then cross the lamp to `cross`
  const limb = async (label, tell, move, x, cross) => {
    await ev(() => { boss().go('wait'); });
    await walkTo(x);
    await ev(t => { boss().go(t); sim(0.05); }, tell);
    let q = await ev(t => { const b = boss(); for (let k = 0; k < 240 && b.act === t; k++) sim(1 / 120); return { act: b.act, tx: Math.round(b.tx) }; }, tell);
    check(label + ': the tell (a dashed line along the floor to Brady), then the ' + move, q.act === move, q);
    q = await ev(() => { const b = boss(), p = P(), hp = b.hp; p.invuln = 0; const pw = p.power; sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.4, { jump: true }); for (let k = 0; k < 240 && b.act !== 'hold'; k++) sim(1 / 120); sim(0.5); const safe = !p.dead && p.power === pw; p.invuln = 999.07; return { safe, lined: b.lined, act: b.act, hp }; });
    check(label + ': Brady jumps it; it ends ' + (x === cross ? '' : 'lined up with its slot'), q.safe, q);
    if (cross != null) await walkTo(cross);
    return ev(h => { sim(0.3); return { hit: h - boss().hp, phase: boss().phase }; }, q.hp);
  };
  const g = await G();
  // PHASE 1: a miss first (Brady stands off the slot), then two claims
  let q = await limb('shad miss', 'palm', 'reach', g.hand + 3 * 32, g.L + 48);
  check('shad: the hand not on its slot: crossing the lamp claims nothing', q.hit === 0, q);
  await ev(() => sim(2));
  q = await limb('shad hit 1', 'palm', 'reach', g.hand, g.L + 48);
  check('shad hit 1: the hand lay over the HAND slot; across lamp L: claimed', q.hit === 1, q);
  await ev(() => { const b = boss(); b.go('palm'); sim(0.7); }); await snap('shad_understudy_reach_tell.png');
  await ev(() => sim(3));
  q = await limb('shad hit 2', 'palm', 'reach', g.hand, g.L + 48);
  check('shad: phase 2 after two hands', q.hit === 1 && q.phase === 2, q);
  // PHASE 2: the kick and the boot slot
  await ev(() => sim(1.5));
  q = await limb('shad hit 3', 'heel', 'kick', g.boot, g.R - 48);
  check('shad hit 3: the shoe in the BOOT slot; back across lamp R: claimed', q.hit === 1, q);
  await ev(() => { const b = boss(); b.go('heel'); sim(0.7); }); await snap('shad_understudy_kick_tell.png');
  await ev(() => sim(3));
  q = await limb('shad hit 4', 'heel', 'kick', g.boot, g.R - 48);
  check('shad: phase 3 after two boots', q.hit === 1 && q.phase === 3, q);
  // PHASE 3: the split
  const split = async (label, x) => {
    await ev(() => { boss().go('wait'); });
    await walkTo(x);
    await ev(() => { boss().go('split'); sim(0.05); });
    let q = await ev(() => { const b = boss(); for (let k = 0; k < 400 && b.act !== 'hats'; k++) sim(1 / 120); sim(0.3); return { act: b.act }; });
    check(label + ': both hats rise (the tell)', q.act === 'hats', q);
    return ev(() => { const b = boss(), p = P(), hp = b.hp; p.invuln = 0; const pw = p.power; for (let k = 0; k < 240 && b.act === 'hats'; k++) sim(1 / 120); sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.4, { jump: true }); for (let k = 0; k < 240 && b.act === 'rush'; k++) sim(1 / 120); sim(0.2); const safe = !p.dead && p.power === pw; p.invuln = 999.07; return { hit: hp - b.hp, safe, act: b.act }; });
  };
  q = await split('shad miss 3', g.at + 40);
  check('shad: off the spot, the feet miss the slots: the rush claims nothing (and Brady jumped it)', q.hit === 0 && q.safe, q);
  q = await split('shad hit 5', g.at);
  check('shad hit 5: both feet on their slots as the hats rose: both halves claimed', q.hit === 1 && q.safe, q);
  await ev(() => { const b = boss(); b.go('hats'); sim(0.6); }); await snap('shad_understudy_split_tell.png');
  await ev(() => sim(2));
  q = await split('shad hit 6', g.at);
  check('shad: the last claim: the Understudy is signed for', q.hit === 1, q);
  await ev(() => sim(1)); await snap('shad_understudy_gone.png');
  r = await ev(() => { for (let k = 0; k < 60 && boss() && !boss().remove; k++) sim(0.1); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying' }; });
  check('shad: the fight is over', r.gone, r);
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('shad: the gate clears 35-5', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
