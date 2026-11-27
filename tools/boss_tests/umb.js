// The Umbrella Repair District 31-6: THE INSPECTOR OF UNLIKELY WEATHER, a big marigold umbrella. He is cloth and wire:
// stomping only bounces. Every hit is his runner walked home along his shaft while his tip is caught in a collar:
// 1 THE POKE: his crook curls back (the tell, 1.0 s), then a full-width poke at standing height; Brady waits in the
//   BIG collar's glow, just past it: the tip lodges in the collar. Two catches.
// 2 THE SCOOP: the canopy flips to bare spokes (1.0 s), then a low wide scoop; behind the MEDIUM collar it wedges.
// 3 THE JAB: the tip points, the panels fold (1.0 s), then a narrow jab; baited into the SMALL collar.
// Caught: hold THROW at the runner's mark and walk back two steps: the runner passes the notch. At the end a single
// drop of rain lands on him and he reopens, flawlessly.
// The player here is a thumb on the stick and the two buttons, through the game loop, with damage on, no retries.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const snap = async n => { await ev(() => { const s = S(); s.update = () => {}; }); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('31-6'); enterArena(); P().invuln = 0; P().setPower(1, true); sim(0.5); });
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style, collars: b.collars && b.collars.length }; });
  check('umb: the Inspector wakes in the hall (6 hp, three collars)', r.state === 'fight' && r.hp === 6 && r.style === 'umb_inspector' && r.collars === 3, r);
  await snap('umb_inspector_wake.png');
  await ev(() => { window.walkX = x => { const p = P(); for (let k = 0; k < 900 && Math.abs(p.cx - x) > 8; k++) sim(1 / 120, { right: p.cx < x, left: p.cx > x }); }; });
  // a stomp only bounces
  r = await ev(() => { const b = boss(), p = P(), hp = b.hp; p.invuln = 2; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 4; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.05); sim(1.0); p.invuln = 0; return { hp, hp2: b.hp }; });
  check('umb: a stomp on his canopy only bounces', r.hp === r.hp2, r);
  // one catch: stand just past this phase's collar (away from him); wait for the tell and the attack; once caught,
  // hold THROW at the runner and walk back
  const catchOne = () => ev(() => {
    const b = boss(), p = P(), hp0 = b.hp, ph = b.phase, hurt0 = P().power; let tell = 0, sawTell = false;
    for (let n = 0; n < 120 * 20 && b.act !== 'caught' && b.hp === hp0; n++) {
      const C = b.collars[b.phase - 1], side = p.cx < (b.arenaX0 + b.arenaX1) / 2 ? -1 : 1;
      // the spot just past the collar, on the far side from where he hovers
      const away = b.act === 'back' ? (C.x < (b.arenaX0 + b.arenaX1) / 2 ? -1 : 1) : b.dir, spot = C.x + away * 1.4 * 32;
      if (b.act === 'tell') { sawTell = true; tell += 1 / 120; }
      const go = Math.abs(p.cx - spot) > 6 && b.act !== 'poke' && b.act !== 'scoop' && b.act !== 'jab';
      sim(1 / 120, go ? { right: p.cx < spot, left: p.cx > spot } : {});
    }
    const caught = b.act === 'caught', at = b.act;
    if (caught) {
      const side = b.dir; for (let n = 0; n < 240 && Math.abs(p.cx - b.markX) > 6; n++) sim(1 / 120, { right: p.cx < b.markX, left: p.cx > b.markX });
      sim(1 / 120, { action: true, actionPressed: true });
      for (let n = 0; n < 240 && b.hp === hp0; n++) sim(1 / 120, { action: true, right: side > 0, left: side < 0 });
    }
    sim(0.6);
    return { ph, caught, at, tell: +tell.toFixed(2), sawTell, hp0, hp: b.hp, hurt: P().power !== hurt0 || P().dead };
  });
  const names = ['the poke, caught in the BIG collar', 'the poke again', 'the scoop, wedged in the MEDIUM collar', 'the scoop again', 'the jab, baited into the SMALL collar'];
  for (let k = 0; k < 5; k++) {
    r = await catchOne();
    check(`umb hit ${k + 1}: ${names[k]} (a ${r.tell} s tell); hold THROW at the runner, walk back: NOTCH`, r.caught && r.sawTell && r.tell >= 0.5 && r.hp === r.hp0 - 1 && !r.hurt, r);
    if (k === 0) await snap('umb_inspector_caught.png');
    if (k === 2) await snap('umb_inspector_scoop.png');
  }
  r = await catchOne();
  check('umb hit 6: the last notch: a single drop lands on him and he reopens, flawlessly', r.caught && !r.hurt, r);
  r = await ev(() => { const b = boss(); for (let k = 0; k < 40 && !(b.remove || b.state === 'dying'); k++) sim(0.1); return { gone: b.remove || b.state === 'dying', reopened: !!b.reopened }; });
  check('umb: he is beaten (and reopened before he goes)', r.gone && r.reopened, r);
  await ev(() => sim(0.6)); await snap('umb_inspector_beaten.png');
  r = await ev(() => { const g = S(), p = P(); for (let k = 0; k < 30 && g.entities.some(e => e.boss && !e.remove); k++) sim(0.1); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 3; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('umb: the gate clears 31-6 to the results like any boss level', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
