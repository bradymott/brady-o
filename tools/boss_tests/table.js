// Table for Two 36-5: Madame Manners, a serving fork with immaculate posture. Every hit is a courtesy returned with
// THROW from a saucer on the booth's table; a stomp is bad manners (it bounces off). Three phases, each with its tell:
// 1 THE BREAD: one tine curls (tell) before she jabs the bread along the table; it lands on Brady's saucer: THROW.
// 2 THE PICKLE (after two hits): she hovers over the middle; two tines tap (tell), she sweeps the pickle at Brady;
//   she turns to watch it go and the saucer on her open side lights: THROW from there (under her).
// 3 THE OLIVE (after four hits): all four tines dip (tell), a feint (THROW now: she snatches it and jabs), then the
//   tines spread: THROW. Six hits; she eats the olive and the booth is Brady's.
// Every THROW is a real button press on the saucer's mark (the game's own prop hook), as a thumb would do it.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('36-5'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  // helpers in the page: the saucers, standing Brady on one, a THROW press
  await ev(() => {
    window.saucers = () => S().entities.filter(e => e.constructor.name === 'TabSaucer').sort((a, b) => a.x - b.x);
    window.standOn = s => { const p = P(); p.x = s.cx - p.w / 2; p.y = s.fy * 32 - p.h - 1; p.vx = p.vy = 0; sim(0.15); return p.onGround && p.groundTy === s.fy; };
    window.throwPress = () => { sim(1 / 120, { action: true, actionPressed: true }); sim(0.05); };
  });
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style, saucers: saucers().length }; });
  check('table: Madame Manners wakes in the booth (6 hp), two saucers on the table', r.state === 'fight' && r.hp === 6 && r.style === 'table_manners' && r.saucers === 2, r);
  await ev(() => sim(0.6));
  await snap('table_manners_wake.png');
  // a stomp is bad manners: it bounces off
  r = await ev(() => { const b = boss(), p = P(); b.hurtT = 0; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.05); return { hp: b.hp }; });
  check('table: a stomp bounces off (ELBOWS OFF!)', r.hp === 6, r);
  // phase 1: the curl tell, the jab, the bread on Brady's saucer, THROW from it
  const bread = () => ev(() => {
    const b = boss(), S0 = saucers(), hp0 = b.hp; b.hurtT = 0; standOn(S0[0]); b.go('curl'); sim(1 / 120);
    let tell = 0; while (b.act === 'curl' && tell < 3) { sim(1 / 60); tell += 1 / 60; }
    const jabbed = b.act === 'jab'; const shotOut = S().entities.some(e => e.constructor.name === 'TourShot' && !e.remove);
    // he hops the bread as it comes along the table
    const p = P(); for (let k = 0; k < 90 && b.act === 'jab'; k++) { const sh = S().entities.find(e => e.constructor.name === 'TourShot' && !e.remove); if (sh && Math.abs(sh.cx - p.cx) < 80 && p.onGround) { sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.25, { jump: true }); } else sim(1 / 60); }
    for (let k = 0; k < 60 && !p.onGround; k++) sim(1 / 60);
    const waiting = b.act === 'wait', onSaucer = S0.find(s => s.item === 'bread');
    if (onSaucer) standOn(onSaucer);
    throwPress(); sim(1.2);
    return { tell: +tell.toFixed(2), jabbed, shotOut, waiting, breadOn: onSaucer ? (onSaucer === S0[0] ? 'near' : 'far') : null, hp0, hp: b.hp, phase: b.phase, hurt: P().invuln < 900 };
  });
  for (let k = 1; k <= 2; k++) { r = await bread(); check(`table hit ${k}: a tine curls (tell over half a second), she jabs the bread, it lands on Brady's saucer, THROW offers it back`, r.tell >= 0.5 && r.jabbed && r.shotOut && r.waiting && r.breadOn && r.hp === r.hp0 - 1, r); }
  check('table: PHASE 2 after two hits (THE PICKLE)', r.phase === 2, r);
  await ev(() => { sim(1.6); }); await snap('table_manners_phase2_hover.png');
  // THROW from the wrong saucer (not her open side) does nothing
  const pickle = (wrongFirst) => ev(wf => {
    const b = boss(), S0 = saucers(), hp0 = b.hp; b.hurtT = 0; sim(1.5); standOn(S0[0]); b.go('tap'); sim(1 / 120);
    let tell = 0; while (b.act === 'tap' && tell < 3) { sim(1 / 60); tell += 1 / 60; }
    const p = P(); let jumped = false;
    for (let k = 0; k < 120 && (b.act === 'sweep' || b.act === 'tap'); k++) { const sh = S().entities.find(e => e.constructor.name === 'TourShot' && !e.remove); if (sh && Math.abs(sh.cx - p.cx) < 90 && p.onGround) { jumped = true; sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.3, { jump: true }); } else sim(1 / 60); }
    for (let k = 0; k < 60 && !p.onGround; k++) sim(1 / 60);
    const open = S0.find(s => s.lit), other = S0.find(s => !s.lit), hovering = b.y + b.h < b.floorY - 2 * 32;
    let wrongHp = null; if (wf && other) { standOn(other); throwPress(); wrongHp = b.hp; }
    // under her, to her open side
    if (open) standOn(open);
    throwPress(); sim(1.2);
    return { tell: +tell.toFixed(2), jumped, open: !!open, openBehind: open ? Math.sign(open.cx - b.cx) === -b.sweepDir : null, hovering, wrongHp, hp0, hp: b.hp, phase: b.phase };
  }, wrongFirst);
  r = await pickle(true);
  check('table hit 3: two tines tap (tell), the pickle sweeps at Brady (he jumps it), the saucer on her open side lights; THROW from the other saucer does nothing, from her open side it counts', r.tell >= 0.5 && r.jumped && r.open && r.openBehind && r.hovering && r.wrongHp === r.hp0 && r.hp === r.hp0 - 1, r);
  r = await pickle(false);
  check('table hit 4: the pickle again, THROW from her open side', r.hp === r.hp0 - 1, r);
  check('table: PHASE 3 after four hits (THE LAST OLIVE)', r.phase === 3, r);
  await ev(() => { const b = boss(); b.go('dip'); sim(0.5); }); await snap('table_manners_phase3_dip.png');
  // the olive: the dip tell, the feint (THROW now and she snatches it), then the spread: THROW
  const olive = (eager) => ev(e => {
    const b = boss(), S0 = saucers(), hp0 = b.hp; b.hurtT = 0; sim(1.4); standOn(S0[1]); b.go('dip'); sim(1 / 120);
    let tell = 0; while (b.act === 'dip' && tell < 3) { sim(1 / 60); tell += 1 / 60; }
    const feint = b.act === 'feint';
    let snatched = null; if (e) { sim(0.3); throwPress(); snatched = b.act === 'snatch' && b.hp === hp0; const p = P(); for (let k = 0; k < 120 && b.act === 'snatch'; k++) { const sh = S().entities.find(x => x.constructor.name === 'TourShot' && !x.remove); if (sh && Math.abs(sh.cx - p.cx) < 90 && p.onGround) { sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.3, { jump: true }); } else sim(1 / 60); } for (let k = 0; k < 200 && b.act !== 'dip'; k++) sim(1 / 60); for (let k = 0; k < 200 && b.act !== 'feint'; k++) sim(1 / 60); standOn(S0[1]); }
    for (let k = 0; k < 200 && b.act !== 'spread'; k++) sim(1 / 60);
    const spread = b.act === 'spread'; sim(0.3); throwPress(); sim(1.4);
    return { tell: +tell.toFixed(2), feint, snatched, spread, hp0, hp: b.hp, state: b.state };
  }, eager);
  r = await olive(true);
  check('table hit 5: all four tines dip (tell), the feint: THROW then and she snatches the olive back; when her tines spread, THROW counts', r.tell >= 0.5 && r.feint && r.snatched && r.spread && r.hp === r.hp0 - 1, r);
  await ev(() => { const b = boss(); b.go('spread'); sim(0.2); }); await snap('table_manners_spread.png');
  r = await olive(false);
  check('table hit 6: the real offer again: she finally eats the olive (beaten)', r.hp <= 0.01 && (r.state === 'dying' || r.state === undefined), r);
  await ev(() => { sim(0.8); }); await snap('table_manners_eats.png');
  r = await ev(() => { for (let k = 0; k < 40 && boss() && !boss().remove; k++) sim(0.1); sim(2.5); const card = S().entities.find(e => e.constructor.name === 'TabPostcardLive'); return { gone: !S().entities.some(e => e.boss && !e.remove), lastWord: !!(card && card.said2), bill: !!(card && card.bill) }; });
  check('table: she is gone; Chinka-O\'s live postcard has the last word and Brady gets the bill', r.gone && r.lastWord && r.bill, r);
  await snap('table_manners_last_word.png');
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('table: the gate clears 36-5 like any boss level', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
