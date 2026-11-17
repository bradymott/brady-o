// Festival Fields 23-4: The Sound Limiter. Mechanic: stomps bounce off its dial, except while it stops to LISTEN (the
// dial lights up); hush waves roll along the stage (jump them); phase 3 adds feedback notes. Six stomps in all.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('23-4'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style }; });
  check('fest: the Sound Limiter wakes on the main stage', r.state === 'fight' && r.hp === 6 && r.style === 'fest_limiter', r);
  await snap('fest_limiter_wake.png');
  // a stomp while it walks bounces off
  r = await ev(() => { const b = boss(), p = P(); b.go('walk'); b.vx = 0; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.1); return { hp: b.hp, vy: p.vy }; });
  check('fest: a stomp while it walks bounces off its dial (no damage)', r.hp === 6 && r.vy < 0, r);
  // a shush sends hush waves both ways along the floor
  r = await ev(() => { const b = boss(); b.go('shush'); sim(0.75); const n = S().entities.filter(e => e.constructor.name === 'TourShot' && !e.remove).length; return { n, act: b.act }; });
  check('fest: SHHH! hush waves roll out both ways', r.n >= 2, r);
  await snap('fest_limiter_shush.png');
  // listening: the dial lights up and a stomp counts
  const stompListening = async label => {
    const r = await ev(() => {
      const b = boss(), p = P(); const hp0 = b.hp;
      for (const e of S().entities) if (e.constructor.name === 'TourShot') e.remove = true;
      b.go('listen'); b.x = (b.arenaX0 + b.arenaX1) / 2 - b.w / 2; b.vx = 0; b.hurtT = 0; sim(0.4);
      const vuln = b.vuln;
      p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.1);
      const hp = b.hp; sim(1.6);
      return { vuln, hp0, hp, state: b.state, phase: b.phase };
    });
    check(label + ': while it listens the dial lights up and a stomp turns it down', r.vuln && r.hp === r.hp0 - 1, r);
    return r;
  };
  await ev(() => { const b = boss(); b.go('listen'); sim(0.5); });
  await snap('fest_limiter_listen.png');
  for (let k = 1; k <= 6; k++) {
    const r2 = await stompListening('fest stomp ' + k);
    if (k === 2) check('fest: phase 2 after two stomps', r2.phase === 2, r2);
    if (k === 4) { check('fest: phase 3 after four stomps', r2.phase === 3, r2); await ev(() => { const b = boss(); b.go('feedback'); sim(0.9); }); await snap('fest_limiter_feedback.png'); }
    if (r2.hp <= 0) break;
  }
  r = await ev(() => { const b = boss(); return { act: b.act, state: b.state }; });
  check('fest: the last stomp turns it up to eleven (its exit)', r.act === 'exit' || r.state === 'dying', r);
  await snap('fest_limiter_eleven.png');
  r = await ev(() => { for (let k = 0; k < 80 && boss() && boss().state !== 'dying' && !boss().remove; k++) sim(0.1); sim(2.5); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying' }; });
  check('fest: it blows its fuse and the way out opens', r.gone, r);
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('fest: the gate clears 23-4', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
