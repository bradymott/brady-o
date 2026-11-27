// The Spare Bone Quarry 37-5: THE APPROXIMATELY CORRECT ANIMAL. Mechanic: stomps only bounce off its plaster back;
// each phase it loses a bone (the paddle it slaps with, the heel it hops on, the curly "neck" it sweeps with) and the
// bone lies loose for a moment: THROW at the right spot seats it in the socket it suits (a hit). Six seatings in all,
// two per phase; then it sits down comfortably and refuses to get up. Played with Brady's own buttons (the THROW press
// goes through the land's THROW claim, as on a phone).
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('37-5'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style }; });
  check('bone: the Approximately Correct Animal wakes in the dig', r.state === 'fight' && r.hp === 6 && r.style === 'bone_animal', r);
  await ev(() => sim(0.6));
  await snap('bone_animal_wake.png');
  // a stomp bounces off (no damage)
  r = await ev(() => { const b = boss(), p = P(); b.go('trot'); sim(0.1); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.08); return { hp: b.hp }; });
  check('bone: a stomp on its plaster back just bounces off', r.hp === 6, r);
  // brings Brady to (x, on the floor) and presses THROW once
  const press = () => ev(() => { sim(1 / 120, { action: true, actionPressed: true }); sim(0.3); });
  // PHASE 1: the paddle spins (tell), slaps down in front; under the empty shoulder, THROW seats it
  const paddle = async (label, wrongFirst) => {
    let q = await ev(() => { const b = boss(), p = P(); for (const e of S().entities) if (e.constructor.name === 'TourShot') e.remove = true; b.go('wind'); sim(0.5); const tell = b.act === 'wind'; sim(0.8); return { tell, act: b.act, tx: b.tx }; });
    check(label + ': the paddle spins over its head before the slap (a tell), then lies where it slapped', q.tell && q.act === 'paddleDown', q);
    if (wrongFirst) {
      q = await ev(() => { const b = boss(), p = P(), hp = b.hp; p.x = b.tx - p.w / 2 + (b.tx > b.cx ? 20 : -20); p.y = b.floorY - p.h; p.vy = 0; sim(0.05); sim(1 / 120, { action: true, actionPressed: true }); sim(0.1); return { hp: hp - b.hp, act: b.act }; });
      check(label + ': THROW standing by the paddle (not under the shoulder): nothing', q.hp === 0, q);
    }
    q = await ev(() => { const b = boss(), p = P(), hp = b.hp, s = window.BRADY_TOUR.Tour.boneKit.animalBrain.shoulder(b); p.x = s.x - p.w / 2; p.y = b.floorY - p.h; p.vy = 0; sim(0.05); return { hp, claim: !!(S().boneIn && S().boneIn.by === b) }; });
    await press();
    const q2 = await ev(hp0 => { const b = boss(); sim(1.3); return { hit: hp0 - b.hp, phase: b.phase }; }, q.hp);
    check(label + ': under the empty shoulder, THROW seats the paddle there: a hit', q.claim && q2.hit === 1, Object.assign(q, q2));
    return q2;
  };
  await paddle('bone hit 1', true);
  await ev(() => { const b = boss(); b.go('wind'); sim(0.7); }); await snap('bone_animal_paddle_tell.png');
  await ev(() => { sim(0.5); }); await snap('bone_animal_paddle_down.png');
  await ev(() => sim(2.5));
  let q = await paddle('bone hit 2');
  check('bone: phase 2 after two seatings', q.phase === 2, q);
  // PHASE 2: the heel kicks dust (tell), a headfirst hop onto the footprint; ripples run both ways (jump them); the
  // heel pops off: touch it and THROW, back to the hip
  const heel = async label => {
    let q = await ev(() => { const b = boss(), p = P(); for (const e of S().entities) if (e.constructor.name === 'TourShot') e.remove = true; p.x = (b.arenaX0 + b.arenaX1) / 2 + 120; p.y = b.floorY - p.h; b.go('kick'); sim(0.5); const tell = b.act === 'kick'; for (let k = 0; k < 300 && b.act !== 'heelDown'; k++) sim(1 / 120); sim(0.05); const waves = S().entities.filter(e => e.constructor.name === 'TourShot' && !e.remove).length; return { tell, act: b.act, waves, loose: b.loose && b.loose.kind }; });
    check(label + ': the heel kicks up dust (tell), a headfirst hop, ripples both ways, the heel pops off', q.tell && q.act === 'heelDown' && q.waves >= 2 && q.loose === 'heel', q);
    q = await ev(() => { const b = boss(), p = P(), hp = b.hp; for (const e of S().entities) if (e.constructor.name === 'TourShot') e.remove = true; p.x = b.loose.x - p.w / 2; p.y = b.floorY - p.h; p.vy = 0; sim(0.05); return { hp }; });
    await press();
    const q2 = await ev(hp0 => { const b = boss(); sim(1.3); return { hit: hp0 - b.hp, phase: b.phase }; }, q.hp);
    check(label + ': touching the heel, THROW returns it to the empty hip: a hit', q2.hit === 1, q2);
    return q2;
  };
  await heel('bone hit 3');
  await ev(() => { const b = boss(); b.go('kick'); sim(0.6); }); await snap('bone_animal_heel_tell.png');
  await ev(() => { const b = boss(); for (let k = 0; k < 300 && b.act !== 'heelDown'; k++) sim(1 / 120); sim(0.1); }); await snap('bone_animal_heel_ripples.png');
  await ev(() => sim(3));
  q = await heel('bone hit 4');
  check('bone: phase 3 after four seatings', q.phase === 3, q);
  // PHASE 3: the curly neck tucks under (tell, a ring on the floor), it sits and sweeps (stand clear), the curl lies
  // at its back: THROW slots it into the tail socket
  const curl = async label => {
    let q = await ev(() => { const b = boss(), p = P(); for (const e of S().entities) if (e.constructor.name === 'TourShot') e.remove = true; b.go('curl'); sim(0.5); const tell = b.act === 'curl'; p.x = b.cx + (b.cx < (b.arenaX0 + b.arenaX1) / 2 ? 1 : -1) * 6 * 32; p.y = b.floorY - p.h; p.invuln = 0; const lives = window.BRADY.Save.data.lives, pw = p.power; for (let k = 0; k < 240 && b.act !== 'curlDown'; k++) sim(1 / 120); const safe = !p.dead && p.power === pw; p.invuln = 999.07; return { tell, act: b.act, safe, loose: b.loose && b.loose.kind }; });
    check(label + ': the neck curls under (tell); it sits and sweeps; standing clear is safe; the curl lies loose', q.tell && q.act === 'curlDown' && q.safe && q.loose === 'curl', q);
    q = await ev(() => { const b = boss(), p = P(), hp = b.hp; p.x = b.loose.x - p.w / 2; p.y = b.floorY - p.h; p.vy = 0; sim(0.05); return { hp }; });
    await press();
    const q2 = await ev(hp0 => { const b = boss(); sim(1.3); return { hit: hp0 - b.hp, act: b.act, state: b.state }; }, q.hp);
    check(label + ': touching the curl, THROW slots it into the tail socket: a hit', q2.hit === 1, q2);
    return q2;
  };
  await curl('bone hit 5');
  await ev(() => { const b = boss(); b.go('curl'); sim(0.7); }); await snap('bone_animal_curl_tell.png');
  await ev(() => sim(3));
  q = await curl('bone hit 6');
  check('bone: the last bone seated: it sits down comfortably', q.act === 'sit', q);
  await ev(() => sim(0.6)); await snap('bone_animal_sits.png');
  r = await ev(() => { for (let k = 0; k < 60 && boss() && !boss().remove; k++) sim(0.1); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying' }; });
  check('bone: it refuses to get up (the fight is over)', r.gone, r);
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('bone: the gate clears 37-5', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
