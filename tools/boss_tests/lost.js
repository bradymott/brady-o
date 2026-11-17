// Lost & Found 24-4: The Sock Hydra. Mechanic: a heap of odd socks with sock heads. Stomps bounce off, except on a head
// hanging dizzy after a pounce: then it pops off as a LOOSE SOCK (its twin grows back, and one more head). Kick (or
// fling) a loose sock into the heap: if a head is the same sock it pairs up (one hit); a different sock bounces off.
// Five pairs; at three left it crackles with static (sparks); the last pair folds the heap up.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('24-4'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style, heads: (b.heads || []).length, socks: S().entities.filter(e => e.isSock && !e.remove).length }; });
  check('lost: the Sock Hydra wakes in the warehouse with three heads and a loose sock on the floor', r.state === 'fight' && r.hp === 5 && r.style === 'lost_hydra' && r.heads === 3 && r.socks >= 1, r);
  await snap('lost_hydra_wake.png');
  // a stomp on a lively head bounces off (no damage, no sock)
  r = await ev(() => { const b = boss(), p = P(); b.go('walk'); b.vx = 0; const n0 = S().entities.filter(e => e.isSock && !e.remove).length; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(3 / 120); const vy = p.vy; sim(0.1); return { hp: b.hp, socks: S().entities.filter(e => e.isSock && !e.remove).length, n0, vy }; });
  check('lost: a stomp on a lively head bounces off (no damage, no loose sock)', r.hp === 5 && r.socks === r.n0 && r.vy < 0, r);
  // the heads spit lint balls
  r = await ev(() => { const b = boss(); b.go('spit'); sim(1.3); return { n: S().entities.filter(e => e.constructor.name === 'TourShot' && !e.remove).length }; });
  check('lost: a head spits lint balls at Brady', r.n >= 1, r);
  await snap('lost_hydra_spit.png');
  // the pounce: it leaps, lands with a thump (waves of fluff both ways), and one head hangs dizzy
  r = await ev(() => { const b = boss(); for (const e of S().entities) if (e.constructor.name === 'TourShot') e.remove = true; b.x = (b.arenaX0 + b.arenaX1) / 2; b.go('pounce'); let k = 0; while (k++ < 60 && b.act !== 'dizzy') sim(0.05); sim(0.3); return { act: b.act, vuln: b.vuln, droop: b.droop, waves: S().entities.filter(e => e.constructor.name === 'TourShot' && !e.remove).length }; });
  check('lost: the pounce lands with a thump and a head hangs dizzy (the stomp window)', r.act === 'dizzy' && r.vuln && r.droop != null && r.waves >= 2, r);
  await snap('lost_hydra_dizzy.png');
  // stomp the dizzy head: it pops off as a loose sock, the twin grows back, one more head grows; no damage
  r = await ev(() => {
    const b = boss(), p = P(); for (const e of S().entities) if (e.constructor.name === 'TourShot') e.remove = true;
    const n0 = S().entities.filter(e => e.isSock && !e.remove).length, h0 = b.heads.length, col = b.heads[b.droop].col;
    p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.1);
    const socks = S().entities.filter(e => e.isSock && !e.remove);
    return { hp: b.hp, n0, n: socks.length, newCol: socks.length ? socks[socks.length - 1].sock : null, col, h0, h: b.heads.length, act: b.act, twin: b.heads.some(H => H.col === col) };
  });
  check('lost: stomping the dizzy head pops it off as a loose sock of its kind; its twin grows back (and one more head); no damage', r.hp === 5 && r.n === r.n0 + 1 && r.newCol === r.col && r.twin && r.h >= r.h0 && r.act === 'regrow', r);
  await snap('lost_hydra_popped.png');
  // a sock no head matches bounces off ("NOT A MATCH")
  r = await ev(() => {
    const b = boss(), g = S(); b.hurtT = 0; b.go('walk'); b.vx = 0;
    b.heads = [{ col: 0, grow: 1, sway: 0, pair: 0 }, { col: 1, grow: 1, sway: 1, pair: 0 }];
    b.t = Math.floor(b.t * 2) / 2 + 0.01;   // well clear of the heap's twice-a-second "grow a twin" check
    const s = new (ctor('lostSock'))(g, { x: b.x - 40, y: b.floorY, sock: 3 }); g.spawn(s); s.fling(9 * 32, -32, P());
    sim(0.25); return { hp: b.hp, there: !s.remove };
  });
  check('lost: a sock that matches no head bounces off (no damage)', r.hp === 5 && r.there, r);
  // pair them up: each loose sock kicked into its twin is one hit
  const pairOne = async label => {
    const r = await ev(() => {
      const b = boss(), g = S(); for (const e of g.entities) if (e.constructor.name === 'TourShot' || (e.isSock && !e.moving)) e.remove = true;
      b.hurtT = 0; if (b.act !== 'exit') { b.go('walk'); b.vx = 0; }
      const H = b.heads.find(h => !h.pair); if (!H) return { none: true, heads: b.heads.length, act: b.act };
      const hp0 = b.hp, s = new (ctor('lostSock'))(g, { x: b.x - 40, y: b.floorY, sock: H.col }); g.spawn(s); s.fling(9 * 32, -32, P());
      sim(0.4); const hp = b.hp; sim(1.0);
      return { hp0, hp, act: b.act, phase: b.phase || 1, paired: s.remove };
    });
    check(label + ': a loose sock kicked into its twin pairs them up (one hit)', !r.none && r.paired && r.hp === r.hp0 - 1, r);
    return r;
  };
  for (let k = 1; k <= 5; k++) {
    const r2 = await pairOne('lost pair ' + k);
    if (k === 2) { check('lost: phase 2 (static) after two pairs', r2.phase === 2, r2); await ev(() => { const b = boss(); b.go('static'); sim(0.9); }); await snap('lost_hydra_static.png'); }
    if (r2.hp <= 0 || r2.act === 'exit') break;
  }
  r = await ev(() => { const b = boss(); return { act: b && b.act, state: b && b.state }; });
  check('lost: the last pair folds the heap up (its exit)', r.act === 'exit' || r.state === 'dying', r);
  await snap('lost_hydra_folded.png');
  r = await ev(() => { for (let k = 0; k < 80 && boss() && boss().state !== 'dying' && !boss().remove; k++) sim(0.1); sim(2.5); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying' }; });
  check('lost: the heap is beaten and the way out opens', r.gone, r);
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('lost: the gate clears 24-4', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
