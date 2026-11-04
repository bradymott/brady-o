// World 22 (22-4): The Other Brady. Mechanic: the mirror. He mirrors Brady; walk him into the hazards on his side, and
// stomp him once each time the clock strikes 22:22.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const safe = () => ev(v => { P().invuln = v; }, SAFE);
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  // Brady should never die during the test: if he does, the level restarts and a fresh boss appears (record why)
  const watch = () => ev(() => { const p = P(); if (p.__watched) return; p.__watched = true; const d = p.die.bind(p); window.__died = null; p.die = function (reason) { window.__died = { reason, x: Math.round(p.x), y: Math.round(p.y), h: p.h, t: Math.round(S().t), state: p.state, stack: new Error().stack.split('\n').slice(1, 4).join(' | ') }; return d(reason); }; });
  const died = () => ev(() => window.__died);
  // a neutral spot: its reflection (either mirror) stands between the two pits
  await ev(() => { window.neutral = () => { const b = boss(), p = P(); p.x = b.arenaX0 + 6.5 * 32 - p.w / 2; p.y = b.floorY - p.h; p.vy = 0; p.vx = 0; };
    // on his feet the reflection refuses to cross a pit: a jump from the neutral spot carries him over to where he belongs
    window.settle = () => { const b = boss(); neutral(); b.go('walk'); b.shardT = 0; b.clockT = 0; sim(0.3); sim(0.05, { jump: true, jumpPressed: true }); sim(0.5, { jump: true }); sim(0.8); b.go('walk'); b.shardT = 0; }; });
  await ev(() => { start('22-4'); enterArena(); }); await safe(); await watch();
  let r = await ev(() => { const b = boss(), g = S(); settle(); return { state: b.state, hp: b.hp, mode: b.mode, act: b.act, pane: !!g.entities.find(e => e.w22Pane), strike: !!g.entities.find(e => e.w22Strike), pend: (g.entities.find(e => e.w22Pendulum) || {}).on }; });
  check('w22: the Other Brady steps out of the mirror (plain mirror, pendulum still)', r.state === 'fight' && r.hp === 6 && r.mode === 'reflect' && r.pane && r.strike && r.pend === false, r);

  // (b) he mirrors Brady across the pane
  r = await ev(() => { const b = boss(), p = P(); const mid = (b.arenaX0 + b.arenaX1) / 2; settle(); p.x = b.arenaX0 + 5 * 32; p.y = b.floorY - p.h; p.vy = 0; sim(0.6); const x0 = b.cx; sim(0.4, { right: true }); sim(0.3); return { dx: b.cx - x0, err: Math.abs(b.cx - (2 * mid - p.cx)), dir: b.dir, facing: p.facing, act: b.act, hp: b.hp }; });
  check('w22: when Brady walks right, the reflection walks left to the mirrored spot', r.dx < -40 && r.err < 40 && r.dir === -r.facing, r);
  r = await ev(() => { const b = boss(), p = P(); settle(); sim(0.5); b.go('walk'); b.shardT = 0; const ground = b.onGround; sim(0.05, { jump: true, jumpPressed: true }); sim(0.1, { jump: true }); return { ground, bvy: b.vy, pvy: p.vy, act: b.act }; });
  check('w22: when Brady jumps, the reflection jumps', r.ground && r.bvy < -100 && r.pvy < -100, r);
  r = await ev(() => { const b = boss(), p = P(); sim(0.8); neutral(); sim(0.4); b.go('walk'); b.vx = 0; const hp0 = b.hp; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.1); const act0 = b.act; sim(0.3); const act = b.act; neutral(); sim(0.6); return { hp: b.hp, hp0, act0, act }; });
  check('w22: stomping the reflection bounces off, and he stomps back', r.hp === r.hp0 && (r.act0 === 'counter' || r.act === 'counter'), r);
  r = await ev(() => { const b = boss(), p = P(), g = S(); const pane = g.entities.find(e => e.w22Pane); const mid = (b.arenaX0 + b.arenaX1) / 2; settle(); b.gateT = 0; p.x = mid - 70; p.y = b.floorY - p.h; p.vy = 0; p.vx = 0; const xs = []; for (let k = 0; k < 10; k++) { sim(0.1, { right: true }); xs.push([Math.round(p.cx - mid), pane.open, +(b.gateT || 0).toFixed(1), b.act]); } const blocked = p.cx < mid; neutral(); return { blocked, xs, paneX: pane.x - mid, friendly: pane.friendly }; });
  check('w22: the mirror pane does not let Brady through', r.blocked, r);
  // the hazard: stand on the mirror spot of a spike pit, the reflection walks into the pit
  const pitHit = async (label, which) => {
    const r = await ev(w => {
      const b = boss(), p = P(), g = S(); const st = g.entities.find(e => e.w22Strike), mid = (b.arenaX0 + b.arenaX1) / 2, half = (b.arenaX1 - b.arenaX0) / 2;
      const [px0, px1] = st.pits[w], pc = (px0 + px1) / 2; const spot = b.mode === 'invert' ? pc - half : 2 * mid - pc;
      // on his feet he refuses the pit edge; so Brady jumps and lands on the spot: the mirrored jump lands in the pit
      settle(); p.x = spot - p.w / 2 + (spot < p.cx ? 40 : -40); p.y = b.floorY - p.h; p.vy = 0; p.vx = 0; sim(0.3);
      const hp0 = b.hp; const refused = b.hp === hp0;
      p.x = spot - p.w / 2; p.y = b.floorY - p.h; p.vy = 0; sim(0.2);
      sim(0.05, { jump: true, jumpPressed: true });
      let k = 0; for (; k < 60 && b.hp === hp0; k++) sim(0.05, k < 10 ? { jump: true } : null);
      const glazed = st.glazed.length; neutral(); sim(0.1);
      return { hp: b.hp, hp0, act: b.act, k, bx: Math.round(b.cx), pit: pc, glazed, refused };
    }, which);
    // (a jumping reflection can be caught by the pendulum first from phase 2 on: that is a hazard hit too)
    check(label + ': the mirrored jump lands the reflection in a spike pit (or the pendulum): hurt' + (which === 0 ? ', and the pit glazes over' : ''), r.hp === r.hp0 - 1 && (r.act === 'climb' || r.act === 'free' || r.act === 'walk') && (which !== 0 || r.glazed >= 1), r);
    return r.hp === r.hp0 - 1;
  };
  await pitHit('w22 pit', 0);
  // the same spot again does nothing while the pit is glazed
  r = await ev(() => { const b = boss(), p = P(), g = S(); const st = g.entities.find(e => e.w22Strike), mid = (b.arenaX0 + b.arenaX1) / 2; sim(2.6); b.go('walk'); const [px0, px1] = st.pits[0], pc = (px0 + px1) / 2; p.x = 2 * mid - pc - p.w / 2; p.y = b.floorY - p.h; p.vy = 0; sim(0.2); const hp0 = b.hp; sim(0.05, { jump: true, jumpPressed: true }); sim(0.5, { jump: true }); sim(2.0); neutral(); return { hp: b.hp, hp0, glazed: st.glazed.length }; });
  check('w22: a glazed pit cannot be farmed', r.hp === r.hp0 && r.glazed >= 1, r);
  await snap('w22_mirror.png');

  // (c) phases
  r = await ev(() => { const b = boss(), p = P(), g = S(); sim(0.5); const hp0 = b.hp; while (b.hp > 4) { b.damage(1); sim(1.2); } sim(0.2); const pd = g.entities.find(e => e.w22Pendulum); sim(2.6); settle(); p.x = b.arenaX0 + 5 * 32; p.y = b.floorY - p.h; p.vy = 0; sim(0.6); const x0 = b.cx; sim(0.4, { right: true }); sim(0.3); const dx = b.cx - x0; neutral(); return { phase: b.phase, hp: b.hp, hp0, mode: b.mode, pend: pd && pd.on, dx }; });
  check('w22: phase 2, the mirror inverts (he copies the direction) and the pendulum swings', r.phase === 2 && r.hp <= 4 && r.mode === 'invert' && r.pend === true && r.dx > 40, r);
  await pitHit('w22 inverted pit', 1);
  r = await ev(() => { const b = boss(), g = S(); sim(1); while (b.hp > 2) { b.damage(1); sim(1.2); } let copy = null; for (let k = 0; k < 80 && !copy; k++) { sim(0.1); copy = g.entities.find(e => e.w22Copy && !e.dead); } neutral(); return { phase: b.phase, hp: b.hp, copies: b.copies, copy: !!copy, copyMode: copy && copy.mode }; });
  check('w22: phase 3, two mirrors: a third copy through the other mirror', r.phase === 3 && r.hp <= 2 && r.copies === 1 && r.copy && r.copyMode === 'reflect', r);

  // (d) 22:22: time stops, the pane opens, Brady crosses and stomps him
  const strike = async label => {
    const r = await ev(() => {
      const b = boss(), p = P(), g = S(); const pane = g.entities.find(e => e.w22Pane);
      neutral(); b.go('walk'); for (let k = 0; k < 40 && b.hurtT > 0; k++) sim(0.05); b.clockT = 21.7; sim(0.5);
      return { act: b.act, open: pane.open, vuln: b.vuln, freezeT: b.freezeT };
    });
    check(label + ': the clock strikes 22:22, time stops and the mirror opens', r.act === 'frozen' && r.open && r.vuln && r.freezeT > 1, r);
    return r.act === 'frozen';
  };
  await ev(() => { const b = boss(); if (b.hp < 2) b.hp = 2; });   // the strike sequence needs two hits left
  await strike('w22 strike');
  await snap('w22_2222.png');
  r = await ev(() => { const b = boss(), p = P(), g = S(); for (const c of g.entities) if (c.w22Copy) c.x = b.arenaX1 - 60; const hp0 = b.hp; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.15); const act = b.act; neutral(); return { hp: b.hp, hp0, act, hurtT: b.hurtT }; });
  check('w22: a stomp through the open mirror lands while time stands still', r.hp === r.hp0 - 1, r);
  r = await ev(() => { const b = boss(); sim(2.5); const clock = b.clockT, act = b.act; while (b.hp > 1) { b.damage(1); sim(1.2); } return { act, clock, hp: b.hp }; });
  check('w22: afterwards the clock starts again from 22:00', r.clock < 5 && r.act !== 'frozen' && r.hp === 1, r);
  await strike('w22 last strike');
  r = await ev(() => { const b = boss(), p = P(), g = S(); const pane = g.entities.find(e => e.w22Pane); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.15); const act = b.act; sim(0.5); return { act, hp: b.hp, cracked: pane.gone }; });
  check('w22: the last stomp cracks the mirror and he waves goodbye', r.act === 'crack' && r.cracked, r);
  await snap('w22_crack.png');
  r = await ev(() => { const b = boss(), doorX = b.doorX; sim(5); const g = S(); let open = true; for (let y = 3; y < g.area.H - 4; y++) if (g.area.tiles[y * g.area.W + doorX] !== 0) open = false; return { gone: !boss(), open, lock: !!g.bossLock }; });
  check('w22: the Other Brady is gone and the 22nd door opens', r.gone && r.open && !r.lock, r);
  check('w22: Brady never died during the test', !(await died()), await died());
};
