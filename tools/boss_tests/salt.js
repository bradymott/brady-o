// The Table Salt Sea 34-5: A PINCH, the cork who considers himself a chef. He can't be stomped. Every hit is a
// perfect pinch: Brady's weight holds the great weighing spoon level while the chef pours; stepping (or hopping) off
// with the needle in the gold band tips the pinch into his soup.
// 1 ONE FINGER (1.0 s tell): a dusting; step off in the gold. Between measures three crystals' shadows (1.0 s): step out.
// 2 TWO FINGERS (1.0 s): a coarse pour first (be OFF the spoon: the lumps roll away both ways, jump them), then a
//   dusting (back on, off in the gold).
// 3 THE RUB (1.0 s): three trickles; Brady's own weight counts on the needle: off after the third (at the shoe).
// The player here is a thumb on the stick and the two buttons, through the game loop, no retries, damage ON.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const snap = async n => { await ev(() => { const s = S(); s._u = s.update; s.update = () => {}; }); await shot(n); await ev(() => { const s = S(); s.update = s._u; }); };
  await ev(() => { start('34-5'); enterArena(); P().invuln = 0; P().setPower(1, true); sim(0.5); });
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style, spoon: b.sp1 - b.sp0 }; });
  check('salt: A Pinch wakes behind his pot (6 hp), the weighing spoon on the floor', r.state === 'fight' && r.hp === 6 && r.style === 'salt_pinch' && r.spoon > 100, r);
  await snap('salt_pinch_wake.png');
  r = await ev(() => { const b = boss(), p = P(), hp = b.hp; p.invuln = 999; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 4; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.05); sim(1.0); p.invuln = 0; p.x = b.arenaX0 + 64; p.y = b.floorY - p.h - 2; sim(0.5); return { hp, hp2: b.hp }; });
  check('salt: a stomp on the chef just bounces (MIND THE HAT!)', r.hp === r.hp2, r);
  await ev(() => {
    // the thumb: one frame of the fight
    window.saltStep = () => {
      const b = boss(), p = P(), br = window.BRADY_TOUR.saltKit.pinch, ph = b.phase || 1, TS = 32;
      const spoonX = b.sp0 + 1.5 * TS, offX = b.sp0 - 2.2 * TS;
      let target = null, jump = false;
      if (b.act === 'tell' || b.act === 'idle' || b.act === 'season') target = ph === 2 && b.act !== 'season' ? offX : spoonX;
      if (b.act === 'coarse') target = offX;
      if (b.act === 'gap') target = spoonX;
      if (b.act === 'pour') { target = spoonX; const want = ph === 3 ? 1.0 : 0.95; if (br.on(b) && b.S >= want) jump = true; }
      // dodge: a shadow on Brady (move out of it), a lump rolling at him (jump it)
      const sh = b.crystals.find(c => c.t < 1.0 && Math.abs(c.x - p.cx) < 1.3 * TS);
      if (sh) target = sh.x + (p.cx <= sh.x ? -1.9 : 1.9) * TS;
      if (b.lumps.some(L => (p.cx - L.x) * L.d > 0 && Math.abs(p.cx - L.x) < 2.0 * TS) && p.onGround) jump = true;
      const inp = {};
      if (target != null && Math.abs(p.cx - target) > 8) { inp.right = p.cx < target; inp.left = p.cx > target; }
      if (jump && p.onGround) { inp.jump = true; inp.jumpPressed = true; }
      sim(1 / 120, inp);
    };
    window.fightUntil = (cond, sec) => { const b = boss(); let tell = 0; for (let k = 0; k < (sec || 40) * 120 && !cond(b); k++) { if (b.act === 'tell') tell = Math.max(tell, b.at); saltStep(); } return tell; };
  });
  // ① ONE FINGER
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; const tell = fightUntil(b => b.act === 'pour'); return { tell: +tell.toFixed(2), act: b.act, hurt: p.power !== pw }; });
  check('salt: one finger held up (a 1.0 s tell), then a dusting into the spoon', r.tell >= 0.95 && r.act === 'pour' && !r.hurt, r);
  await ev(() => { for (let k = 0; k < 120 * 1.6; k++) saltStep(); }); await snap('salt_pinch_pouring.png');
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; fightUntil(b => b.act === 'season'); return { hp: b.hp, hurt: p.power !== pw }; });
  check('salt hit 1: off the spoon in the gold: PERFECT, a pinch in the soup', r.hp === 5 && !r.hurt, r);
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; let shadow = false; for (let k = 0; k < 120 * 1.2; k++) { if (b.crystals.some(c => c.t < 1)) shadow = true; saltStep(); } return { shadow, hurt: p.power !== pw }; });
  check('salt: between measures the crystals\' shadows come first (1.0 s): Brady steps out of them', r.shadow && !r.hurt, r);
  await snap('salt_pinch_season.png');
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; fightUntil(b => b.hp <= 4); sim(0.5); return { hp: b.hp, phase: b.phase, hurt: p.power !== pw }; });
  check('salt hit 2: PHASE 2 (two fingers)', r.hp === 4 && r.phase === 2 && !r.hurt, r);
  // ② a miss first: stay ON the spoon for the coarse pour: too salty, no hit
  r = await ev(() => { const b = boss(), p = P(), hp = b.hp, pw = p.power; for (let k = 0; k < 120 * 8 && b.act !== 'tell'; k++) saltStep(); for (let k = 0; k < 120 * 3 && b.act !== 'season'; k++) { const x = b.sp0 + 1.5 * 32; sim(1 / 120, Math.abs(p.cx - x) > 8 ? { right: p.cx < x, left: p.cx > x } : {}); } return { act: b.act, hp0: hp, hp: b.hp, hurt: p.power !== pw }; });
  check('salt phase 2: standing on the spoon for the coarse pour: TOO SALTY, no hit', r.act === 'season' && r.hp === r.hp0 && !r.hurt, r);
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; fightUntil(b => b.act === 'coarse'); let lumps = 0; for (let k = 0; k < 120 * 1.6; k++) { lumps = Math.max(lumps, b.lumps.length); saltStep(); } return { lumps, hurt: p.power !== pw }; });
  check('salt phase 2: off the spoon, the coarse pour bounces off and two lumps roll away; Brady jumps them', r.lumps === 2 && !r.hurt, r);
  await snap('salt_pinch_lumps.png');
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; fightUntil(b => b.hp <= 2, 60); sim(0.5); return { hp: b.hp, phase: b.phase, hurt: p.power !== pw }; });
  check('salt hits 3-4: back on for the fine pour, off in the gold twice: PHASE 3 (the rub)', r.hp === 2 && r.phase === 3 && !r.hurt, r);
  // ③ off after the second trickle: BLAND
  r = await ev(() => { const b = boss(), p = P(), hp = b.hp, pw = p.power, br = window.BRADY_TOUR.saltKit.pinch; fightUntil(b => b.act === 'pour'); let tr = 0; for (let k = 0; k < 120 * 6 && b.act === 'pour'; k++) { const jump = br.on(b) && b.S >= 0.65 && p.onGround; const x = b.sp0 + 1.5 * 32; sim(1 / 120, Object.assign(Math.abs(p.cx - x) > 8 ? { right: p.cx < x, left: p.cx > x } : {}, jump ? { jump: true, jumpPressed: true } : {})); } return { act: b.act, hp0: hp, hp: b.hp, hurt: p.power !== pw }; });
  check('salt phase 3: off after the second trickle (his weight gone, the needle falls short): BLAND, no hit', r.hp === r.hp0 && !r.hurt, r);
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; fightUntil(b => b.act === 'pour'); for (let k = 0; k < 120 * 3.4; k++) saltStep(); return { read: +b.read.toFixed(2), S: +b.S.toFixed(2), hurt: p.power !== pw }; });
  check('salt phase 3: after the third trickle the needle sits on the shoe mark with Brady on the spoon', r.read > 1.3 && r.S > 1.0 && !r.hurt, r);
  await snap('salt_pinch_shoe.png');
  r = await ev(() => { const b = boss(), p = P(), pw = p.power; fightUntil(b => b.state === 'dying' || b.remove, 60); return { gone: b.state === 'dying' || b.remove, hurt: p.power !== pw }; });
  check('salt hits 5-6: off at the shoe twice: PERFECT; the chef tastes his soup', r.gone && !r.hurt, r);
  await ev(() => sim(0.6)); await snap('salt_pinch_beaten.png');
  r = await ev(() => { const g = S(), p = P(); for (let k = 0; k < 30 && g.entities.some(e => e.boss && !e.remove); k++) sim(0.1); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 999; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('salt: the gate clears 34-5 to the results like any boss level', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
