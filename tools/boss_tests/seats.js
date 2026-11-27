// Below the Cheap Seats 33-6: THE ENCORE COAT, a tailcoat with nobody inside. Touching it never hurts; its moves do.
// Every hit is applause from a paddle while it bows over an open prop basket. Two hits a phase.
// 1 THE TAILS RISE (1 s): it sweeps along the boards to where Brady stood and bows there. Lure it to basket 1, hop
//   up on the paddle's riser during the tell (the sweep runs under), clap while it bows in the basket.
// 2 ONE SLEEVE POINTS (1 s): a cartwheel right across the stage that way; wait on the far riser (it passes under);
//   when it ends by the far basket, clap at the far paddle.
// 3 BOTH SLEEVES SPREAD (1.4 s): the deep bow's gust sweeps the whole stage. Drop through the trap to the understage
//   and clap at the paddle straight under basket 1.
// The player here is a thumb on the stick and the two buttons, through the game loop, no retries, damage ON.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const snap = async n => { await ev(() => { const s = S(); s._u = s.update; s.update = () => {}; }); await shot(n); await ev(() => { const s = S(); s.update = s._u; }); };
  await ev(() => { start('33-6'); enterArena(); P().invuln = 0; P().setPower(1, true); sim(0.5); });
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style }; });
  check('seats: the Encore Coat takes the stage (6 hp)', r.state === 'fight' && r.hp === 6 && r.style === 'seats_encore', r);
  await snap('seats_encore_wake.png');
  r = await ev(() => { const b = boss(), p = P(), hp = b.hp; p.invuln = 999; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 4; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.05); sim(1.0); p.invuln = 0; return { hp, hp2: b.hp }; });
  check('seats: a stomp on the coat just bounces (NOBODY HOME!)', r.hp === r.hp2, r);
  await ev(() => {
    // the thumb: walk to a spot (hop onto a riser or down the trap when needed); one frame at a time
    window.seatsGo = (x, row) => {
      const p = P(), b = boss(), fy = b.fy, feet = Math.round((p.y + p.h) / 32), inp = {};
      const under = feet > fy / 32 + 0.5;
      if (row === 'under' && !under) { const tx = b.X(window.BRADY_TOUR.seatsKit.AR.trap[0]) + 32; inp.right = p.cx < tx - 4; inp.left = p.cx > tx + 4; return inp; }
      if (row !== 'under' && under) { const tx = b.X(window.BRADY_TOUR.seatsKit.AR.trap[0]) + 32; if (Math.abs(p.cx - tx) > 6) { inp.right = p.cx < tx; inp.left = p.cx > tx; } else { inp.jump = true; inp.jumpPressed = p.onGround; } return inp; }
      if (row === 'riser' && p.onGround && feet === fy / 32 && Math.abs(p.cx - x) < 3 * 32) { inp.jump = true; inp.jumpPressed = true; }
      if (row === 'riser' && !p.onGround) inp.jump = true;
      if (Math.abs(p.cx - x) > 5) { inp.right = p.cx < x; inp.left = p.cx > x; }
      return inp;
    };
    window.seatsStep = () => {
      const b = boss(), p = P(), ph = b.phase || 1, A = b.act, AR = window.BRADY_TOUR.seatsKit.AR;
      const r1 = b.X(AR.r1[0] + 1), r2 = b.X(AR.r2[0] + 1), up = b.X(AR.up) + 16;
      let inp = {};
      if (ph === 1) {
        if (A === 'idle' || A === 'dunk') inp = seatsGo(b.b1, 'floor');
        else if (A === 'tell' || A === 'move') inp = seatsGo(r1, 'riser');
        else if (A === 'bow') { inp = seatsGo(r1, 'riser'); if (Math.abs(p.cx - r1) < 8 && p.onGround && Math.abs(b.px - b.b1) < 32) inp = { action: true, actionPressed: true }; }
      } else if (ph === 2) {
        inp = seatsGo(r2, 'riser');
        if (A === 'bow' && Math.abs(p.cx - r2) < 8 && p.onGround && Math.abs(b.px - b.b2) < 32) inp = { action: true, actionPressed: true };
      } else {
        inp = seatsGo(up, 'under');
        if (A === 'bow' && Math.abs(p.cx - up) < 8 && p.onGround) inp = { action: true, actionPressed: true };
      }
      sim(1 / 120, inp);
    };
    window.fightUntil = (cond, sec) => { const b = boss(); let tell = 0; for (let k = 0; k < (sec || 40) * 120 && !cond(b); k++) { if (b.act === 'tell') tell = Math.max(tell, b.at); seatsStep(); } return tell; };
  });
  // ① the tails
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; fightUntil(b => b.act === 'idle'); const tell = fightUntil(b => b.act === 'bow'); return { tell: +tell.toFixed(2), act: b.act, at: Math.round(Math.abs(b.px - b.b1)), hurt: p.power !== pw }; });
  check('seats: the tails rise (a 1 s tell) and it sweeps to where Brady stood (basket 1); Brady hops up on the riser, the sweep runs under', r.tell >= 0.95 && r.act === 'bow' && r.at < 32 && !r.hurt, r);
  await snap('seats_encore_bow_in_basket.png');
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; fightUntil(b => b.hp <= 4); sim(0.5); return { hp: b.hp, phase: b.phase, hurt: p.power !== pw }; });
  check('seats hits 1-2: applause while it bows over basket 1: the tails go in twice: PHASE 2', r.hp === 4 && r.phase === 2 && !r.hurt, r);
  // ② the cartwheel
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; let tell = 0; for (let k = 0; k < 120 * 20 && b.act !== 'move'; k++) { if (b.act === 'tell') tell = Math.max(tell, b.at); seatsStep(); } return { tell: +tell.toFixed(2), act: b.act, hurt: p.power !== pw }; });
  check('seats: one sleeve points (a 1 s tell), then a cartwheel right across the stage', r.tell >= 0.95 && r.act === 'move' && !r.hurt, r);
  await ev(() => sim(0.4)); await snap('seats_encore_cartwheel.png');
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; const log = []; for (let k = 0; k < 60 * 120 && b.hp > 2; k++) { seatsStep(); if (k % 60 === 0 && log.length < 30) log.push([b.act, Math.round(b.px / 32 - b.arenaX0 / 32), b.wdir, Math.round(p.cx / 32 - b.arenaX0 / 32), Math.round((p.y + p.h) / 32 - b.fy / 32), p.seatsProp ? 1 : 0].join(',')); } sim(0.5); return { hp: b.hp, phase: b.phase, hurt: p.power !== pw, log }; });
  check('seats hits 3-4: waiting on the far riser while it cartwheels under, applause when it ends by the far basket: PHASE 3', r.hp === 2 && r.phase === 3 && !r.hurt, r);
  // ③ the deep bow
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; let tell = 0; for (let k = 0; k < 120 * 20 && b.act !== 'move'; k++) { if (b.act === 'tell') tell = Math.max(tell, b.at); seatsStep(); } sim(0.1); const under = p.y + p.h > b.fy + 16; return { tell: +tell.toFixed(2), under, hurt: p.power !== pw }; });
  check('seats: both sleeves spread (a 1.4 s tell); Brady drops to the understage before the gust', r.tell >= 1.35 && r.under && !r.hurt, r);
  await snap('seats_encore_understage.png');
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; fightUntil(b => b.state === 'dying' || b.remove, 60); return { gone: b.state === 'dying' || b.remove, hurt: p.power !== pw }; });
  check('seats hits 5-6: applause from straight under the basket during the deep bow: the coat folds itself into it', r.gone && !r.hurt, r);
  await ev(() => sim(0.6)); await snap('seats_encore_beaten.png');
  r = await ev(() => { const g = S(), p = P(); for (let k = 0; k < 30 && g.entities.some(e => e.boss && !e.remove); k++) sim(0.1); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 999; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('seats: the gate clears 33-6 to the results like any boss level', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
