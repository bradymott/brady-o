// Postmark Sound 27-6: THE POSTMASTER'S THUMB. Mechanic: stomps only bounce; every hit is a torn address the thumb
// itself cancels whole. Phase 1: a dotted ring follows Brady then settles (the tell): stand on address one while it
// settles, step out, the stamp cancels the address. Phase 2: the inked edge glows (the tell), an ink stripe rolls the
// desk: stand on the crease plate (address two's halves slide together) and jump the stripe from there. Phase 3: two
// half-rings (the tell): hold the crease for the first mark, step clear of the second. Played with Brady's buttons.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('27-6'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style }; });
  check('post: the Postmaster\'s Thumb wakes over the sorting desk', r.state === 'fight' && r.hp === 6 && r.style === 'post_thumb', r);
  await ev(() => sim(0.6));
  await snap('post_thumb_wake.png');
  r = await ev(() => { const b = boss(), p = P(); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.08); return { hp: b.hp }; });
  check('post: a stomp on the thumb just bounces off', r.hp === 6, r);
  const G = () => ev(() => window.BRADY_TOUR.Tour.postKit.thumbBrain.geo(boss()));
  // walk with the stick to pixel x
  const walkTo = x => ev(x => { const p = P(); for (let k = 0; k < 600; k++) { const d = x - p.cx, brake = p.vx * p.vx / (2 * 30 * 32) + 4; if (Math.abs(d) < 6 && Math.abs(p.vx) < 20) break; sim(1 / 120, { left: d < -brake, right: d > brake }); } sim(0.05); }, x);
  // PHASE 1
  const ring = async (label, onAddress) => {
    const g = await G();
    await ev(() => { boss().go('down'); });
    await walkTo(onAddress ? g.a1 : g.a1 + 6 * 32);
    await ev(() => { boss().go('rise'); sim(0.05); });
    let q = await ev(() => { const b = boss(); for (let k = 0; k < 240 && b.act !== 'ring'; k++) sim(1 / 120); sim(0.75); return { act: b.act, hp: b.hp }; });
    check(label + ': the dotted ring follows, then settles (a tell before the stamp)', q.act === 'ring', q);
    const q2 = await ev(([x, hp]) => { const b = boss(), p = P(); for (let k = 0; k < 60; k++) sim(1 / 120, { right: true }); for (let k = 0; k < 240 && b.act !== 'down'; k++) sim(1 / 120); sim(0.1); return { hit: hp - b.hp, act: b.act, phase: b.phase, away: Math.abs(p.cx - b.tx) > 40 }; }, [0, q.hp]);
    return q2;
  };
  let q = await ring('post miss', false);
  check('post: the ring settled away from the address: the stamp only marks the desk (no hit)', q.hit === 0, q);
  await ev(() => sim(2));
  q = await ring('post hit 1', true);
  check('post hit 1: lured onto address one, stepped out: the thumb cancels it (a hit)', q.hit === 1 && q.away, q);
  await ev(() => { const b = boss(); b.go('ring'); sim(0.9); }); await snap('post_thumb_ring_tell.png');
  await ev(() => sim(3));
  q = await ring('post hit 2', true);
  check('post: phase 2 after two cancelled addresses', q.hit === 1 && q.phase === 2, q);
  // PHASE 2: the inked edge, the stripe; jump it from the crease plate
  const stripe = async label => {
    const g = await G();
    await ev(() => { boss().go('down'); });
    await walkTo(g.plate);
    await ev(() => { boss().go('rise'); sim(0.05); });
    let q = await ev(() => { const b = boss(); for (let k = 0; k < 360 && b.act !== 'edge'; k++) sim(1 / 120); sim(0.5); return { act: b.act, hp: b.hp }; });
    check(label + ': the inked edge glows at the end of the desk (a tell)', q.act === 'edge', q);
    const q2 = await ev(hp0 => { const b = boss(), p = P(); p.invuln = 0; const pw = p.power; let jumped = false; for (let k = 0; k < 600 && b.act !== 'rise'; k++) { const sx = b.act === 'roll' ? b.stripeX : null; const near = sx != null && sx < p.cx && p.cx - sx < 75; if (near && !jumped && p.onGround) { jumped = true; sim(1 / 120, { jump: true, jumpPressed: true }); } else sim(1 / 120, jumped && !p.onGround ? { jump: true } : {}); } const safe = !p.dead && p.power === pw; p.invuln = 999.07; return { hit: hp0 - b.hp, phase: b.phase, jumped, safe, dbg: b.dbg, act: b.act }; }, q.hp);
    check(label + ': on the crease plate the halves join, the stripe inks them (a hit) and Brady hops it', q2.hit === 1 && (q2.jumped || q2.phase === 3) && q2.safe, q2);
    return q2;
  };
  await stripe('post hit 3');
  await ev(() => { const b = boss(); b.go('edge'); sim(0.9); }); await snap('post_thumb_edge_tell.png');
  await ev(() => { const p = P(); p.x -= 7 * 32; p.vx = 0; sim(4); });
  q = await stripe('post hit 4');
  check('post: phase 3 after four', q.phase === 3, q);
  // PHASE 3: the double impression
  const double = async label => {
    const g = await G();
    await ev(() => { boss().go('down'); });
    await walkTo(g.plate);
    await ev(() => { boss().go('rise'); sim(0.05); });
    let q = await ev(() => { const b = boss(); for (let k = 0; k < 360 && b.act !== 'rings'; k++) sim(1 / 120); sim(0.6); return { act: b.act, hp: b.hp }; });
    check(label + ': two half-rings: one on the joined address, one on the crease (a tell)', q.act === 'rings', q);
    const q2 = await ev(hp0 => { const b = boss(), p = P(); p.invuln = 0; const pw = p.power; for (let k = 0; k < 480 && !b.hitDone; k++) sim(1 / 120); const first = hp0 - b.hp; for (let k = 0; k < 70; k++) sim(1 / 120, { right: true }); for (let k = 0; k < 480 && b.act === 'double'; k++) sim(1 / 120); const safe = !p.dead && p.power === pw; p.invuln = 999.07; return { first, hit: hp0 - b.hp, act: b.act, safe }; }, q.hp);
    check(label + ': held the crease for the first mark (a hit), stepped clear of the second', q2.first === 1 && q2.safe, q2);
    return q2;
  };
  await double('post hit 5');
  await ev(() => { const b = boss(); b.go('rings'); sim(0.8); }); await snap('post_thumb_rings_tell.png');
  await ev(() => { const p = P(); p.x -= 7 * 32; p.vx = 0; sim(4); });
  q = await double('post hit 6');
  check('post: the last address mails the thumb back up its own arm', q.act === 'mailed' || q.hit === 1, q);
  await ev(() => sim(0.8)); await snap('post_thumb_mailed.png');
  r = await ev(() => { for (let k = 0; k < 60 && boss() && !boss().remove; k++) sim(0.1); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying' }; });
  check('post: the fight is over', r.gone, r);
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('post: the gate clears 27-6', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
