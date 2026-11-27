// The Unflattering Gallery 30-6: THE RETOUCHER. Mechanic: stomps only bounce; every hit is his own paint put on his
// worst portrait (on the easel at the left). Phase 1: the drip's dashed line and ring (the tell): roll the posing mark
// under it (it loads), jump the paint sweep, THROW at the easel: a moustache. Phase 2: the palette flourish and the
// dashed flight line (the tell): crouch on the mark at the ear spot: the blot skims over and lands as a second ear.
// Phase 3: the chin rises (the tell): crouch on the mark under his chin; both chins meet; THROW at the easel.
// Played with Brady's buttons.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('30-6'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style }; });
  check('gal: the Retoucher wakes in his frame', r.state === 'fight' && r.hp === 6 && r.style === 'gal_retoucher', r);
  await ev(() => sim(0.6));
  await snap('gal_retoucher_wake.png');
  r = await ev(() => { const b = boss(), p = P(); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.08); sim(1); return { hp: b.hp }; });
  check('gal: a stomp on the Retoucher just bounces off', r.hp === 6, r);
  const G = () => ev(() => window.BRADY_TOUR.Tour.galKit.retoucherBrain.geo(boss()));
  // walk with the stick to pixel x (the mark rolls along under Brady while he stands on it)
  const walkTo = x => ev(x => { const p = P(); for (let k = 0; k < 600; k++) { const d = x - p.cx, brake = p.vx * p.vx / (2 * 30 * 32) + 4; if (Math.abs(d) < 5 && Math.abs(p.vx) < 20) break; sim(1 / 120, { left: d < -brake, right: d > brake }); } sim(0.05); }, x);
  const toMark = async () => { const m = await ev(() => boss().markX); await walkTo(m); };
  const throwAtEasel = async () => { const g = await G(); await walkTo(g.easel); return ev(() => { const b = boss(), hp = b.hp; sim(1 / 120, { action: true, actionPressed: true }); sim(0.2); return hp - b.hp; }); };
  // PHASE 1: the loaded brush
  const brush = async (label, catchIt) => {
    await ev(() => { boss().go('pause1'); boss().loaded = false; sim(0.05); });
    await toMark();
    await ev(() => { boss().go('raise'); sim(0.05); });
    const drip = await ev(() => boss().dripX);
    const g = await G();
    if (catchIt) await walkTo(drip);   // a miss: Brady stays put (the drip falls three tiles off)
    let q = await ev(() => { const b = boss(); for (let k = 0; k < 240 && b.act !== 'drip'; k++) sim(1 / 120); sim(0.25); return { act: b.act }; });
    check(label + ': the drip\'s dashed line and ring show where it falls (a tell)', q.act === 'drip', q);
    // the sweep: jump the wave as it comes
    q = await ev(() => { const b = boss(), p = P(); p.invuln = 0; const pw = p.power; let jumped = false, hold = 0; for (let k = 0; k < 120 * 6 && b.act !== 'pause1'; k++) { const w = b.act === 'sweep' ? b.waveX : null; if (w != null && w > p.cx && w - p.cx < 60 && p.onGround && !jumped) { jumped = true; hold = 0.35; sim(1 / 120, { jump: true, jumpPressed: true }); } else { sim(1 / 120, hold > 0 ? { jump: true } : {}); hold -= 1 / 120; } } const safe = !p.dead && p.power === pw; p.invuln = 999.07; return { loaded: b.loaded, jumped, safe, act: b.act }; });
    check(label + ': ' + (catchIt ? 'the mark rolled under the drip is loaded' : 'the drip missed the mark') + ', and Brady hops the sweep', q.loaded === catchIt && q.jumped && q.safe, q);
    const hit = await throwAtEasel();
    return { hit, loaded: q.loaded };
  };
  let q = await brush('gal miss', false);
  check('gal: THROW at the easel without paint on the mark is no hit', q.hit === 0, q);
  q = await brush('gal hit 1', true);
  check('gal hit 1: the loaded mark, THROW at the easel: a moustache', q.hit === 1, q);
  await ev(() => { const b = boss(); b.go('raise'); sim(0.7); }); await snap('gal_retoucher_drip_tell.png');
  q = await brush('gal hit 2', true);
  r = await ev(() => ({ phase: boss().phase }));
  check('gal: phase 2 after two moustaches', q.hit === 1 && r.phase === 2, { q, r });
  // PHASE 2: the blot over the ear spot
  const blot = async (label) => {
    const g = await G();
    await ev(() => { boss().go('pause2'); sim(0.05); });
    await toMark(); await walkTo(g.ear);
    await ev(() => { boss().go('flourish'); sim(0.05); });
    let q = await ev(() => { const b = boss(); for (let k = 0; k < 240 && b.act !== 'flourish'; k++) sim(1 / 120); sim(0.6); return { act: b.act }; });
    check(label + ': the palette flourish and the dashed flight line (a tell)', q.act === 'flourish', q);
    return ev(() => { const b = boss(), p = P(), hp = b.hp; p.invuln = 0; const pw = p.power; for (let k = 0; k < 120 * 4 && b.act !== 'pause2' && b.hp === hp; k++) sim(1 / 120, { down: true }); sim(0.1, { down: true }); const safe = !p.dead && p.power === pw; p.invuln = 999.07; return { hit: hp - b.hp, safe, phase: b.phase }; });
  };
  q = await blot('gal hit 3');
  check('gal hit 3: crouched on the mark at the ear spot, the blot skims over: a second ear', q.hit === 1 && q.safe, q);
  await ev(() => { const b = boss(); b.go('flourish'); sim(0.7); }); await snap('gal_retoucher_blot_tell.png');
  q = await blot('gal hit 4');
  check('gal: phase 3 after the ear', q.hit === 1 && q.phase === 3, q);
  // PHASE 3: the chins
  const chins = async (label) => {
    const g = await G();
    await ev(() => { boss().go('pause3'); boss().window = 0; sim(0.05); });
    await toMark(); await walkTo(g.chin);
    await ev(() => { boss().go('chin'); sim(0.05); });
    let q = await ev(() => { const b = boss(); sim(0.6); return { act: b.act }; });
    check(label + ': the chin rises, the dashed lunge line (a tell)', q.act === 'chin', q);
    q = await ev(() => { const b = boss(), p = P(); p.invuln = 0; const pw = p.power; for (let k = 0; k < 120 * 3 && !(b.window > 0); k++) sim(1 / 120, { down: true }); const met = b.window > 0; const safe = !p.dead && p.power === pw; p.invuln = 999.07; return { met, safe }; });
    check(label + ': crouched on the mark under his chin, both chins meet (the easel glows NOW)', q.met && q.safe, q);
    const hit = await throwAtEasel();
    return { hit };
  };
  q = await chins('gal hit 5');
  check('gal hit 5: THROW at the easel while it glows: the likeness', q.hit === 1, q);
  await ev(() => { const b = boss(); b.go('lunge'); sim(0.5); }); await snap('gal_retoucher_lunge.png');
  await ev(() => sim(3));
  q = await chins('gal hit 6');
  check('gal: the last improvement sells the portrait', q.hit === 1, q);
  await ev(() => sim(0.8)); await snap('gal_retoucher_sold.png');
  r = await ev(() => { for (let k = 0; k < 60 && boss() && !boss().remove; k++) sim(0.1); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying' }; });
  check('gal: the fight is over', r.gone, r);
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('gal: the gate clears 30-6', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
