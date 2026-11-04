// Nepal 12-5: Baron Bric-a-Brac, the finale. Mechanic: the stolen landmarks. He throws them; Brady kicks them back.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  // Brady stays unhurtable while the test waits around (a thrown landmark would flatten an idle small Brady)
  const SAFE = 999.07;
  const safe = () => ev(v => { P().invuln = v; }, SAFE);
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  // Brady should never die during the test: if he does, the level restarts and a fresh boss appears (record why)
  const watch = () => ev(() => { const p = P(); if (p.__watched) return; p.__watched = true; const d = p.die.bind(p); window.__died = null; p.die = function (reason) { window.__died = { reason, x: Math.round(p.x), y: Math.round(p.y), h: p.h, t: Math.round(S().t) }; return d(reason); }; });
  const died = () => ev(() => window.__died);
  await ev(() => { start('12-5'); enterArena(); }); await safe(); await watch();
  let r = await ev(() => { const b = boss(); return { state: b.state, phase: b.phase, act: b.act, hp: b.hp, name: b.name, roof: !!S().entities.find(e => e.npRoof) }; });
  check('np: the Baron wakes on the summit (phase 1, airship)', r.state === 'fight' && r.phase === 1 && r.hp === 7 && r.roof, r);

  // (b) a stomp bounces off the airship and does nothing
  r = await ev(() => { const b = boss(), p = P(); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.1); return { hp: b.hp, alive: !p.dead }; });
  check('np: stomping the Baron bounces off (no damage)', r.hp === 7, r);

  // the Baron throws a landmark: wait for it, then kick it back into him
  const kickBack = async (label) => {
    // wait for a landmark to be thrown and come to rest
    let out = await ev(() => { for (let k = 0; k < 120; k++) { const e = S().entities.find(e => e.landmark && !e.remove); if (e && e.onGround && Math.abs(e.vx) < 48) return { ok: true, id: e.lm.id, x: e.x }; sim(0.1); } return { ok: false }; });
    check(label + ': a landmark lands as a world object', out.ok, out);
    if (!out.ok) return false;
    // put the prop a little way from the Baron, Brady behind it, run into it: the kick lobs it back at him
    const hit = await ev(() => {
      const b = boss(), p = P(); const e = S().entities.find(e => e.landmark && !e.remove);
      const mid = (b.arenaX0 + b.arenaX1) / 2, hold = b.act === 'taunt' ? 'taunt' : 'walk';
      for (let tries = 0; tries < 4 && !e.remove && b.state === 'fight'; tries++) {
        const hp0 = b.hp, side = b.cx < mid ? 1 : -1;  // approach from the open side
        // the Baron is pinned where he stands for the kick (in the game he moves; the lob leads him)
        const bx = Math.max(b.arenaX0 + 2 * 32, Math.min(b.arenaX1 - b.w - 2 * 32, b.x)), by = b.y;
        e.x = Math.max(b.arenaX0 + 40, Math.min(b.arenaX1 - 70, bx + b.w / 2 + side * (b.w / 2 + 40))) - e.w / 2; e.y = b.floorY - e.h; e.vx = 0; e.vy = 0; e.thrownBy = null; e.lobbed = false; e.rest = 1;
        p.x = Math.max(b.arenaX0 + 8, Math.min(b.arenaX1 - p.w - 8, e.x + side * 50)); p.y = b.floorY - p.h; p.vy = 0; p.vx = 0; p.facing = -side;
        const inp = side > 0 ? { left: true } : { right: true };
        for (let k = 0; k < 40 && b.hp === hp0 && !e.remove; k++) { b.x = bx; if (b.phase === 1) b.y = by; b.vx = 0; if (b.act !== hold) b.go(hold); b.at = 0; sim(0.05, inp); }
        if (b.hp < hp0) return { ok: true, hp: b.hp, tries, thrownBy: 'p' };
        sim(0.5);
      }
      return { ok: false, hp: b.hp, remove: e.remove, state: b.state, dead: p.dead, died: window.__died, bx: Math.round(b.x), ex: Math.round(e.x), px: Math.round(p.x) };
    });
    check(label + ': a kicked landmark returns to the Baron and hurts him', hit.ok, hit);
    return hit.ok;
  };
  await ev(() => { for (let k = 0; k < 80; k++) { const b = boss(); if (b.act === 'throw' && b.at > 0.4) break; sim(0.05); } });
  await snap('np_airship.png');
  await kickBack('np phase 1');
  r = await ev(() => { const roof = S().entities.find(e => e.npRoof); return { freed: roof.n, hp: boss().hp }; });
  check('np: the returned landmark is restored behind the summit', r.freed === 1 && r.hp === 6, r);

  // (c) phases: two more hits through the mechanic (shortcut) bring the mech
  r = await ev(() => { const b = boss(); sim(1.2); b.damage(1); sim(1.2); b.damage(1); sim(0.1); const chinka = !!S().entities.find(e => e.npChinka); sim(3.5); return { phase: b.phase, act: b.act, h: b.h, w: b.w, chinka, hp: b.hp }; });
  check('np: phase 2, the Baron crashes and climbs into the bric-a-brac mech', r.phase === 2 && r.h === 120 && r.chinka && r.hp === 4, r);
  await snap('np_mech.png');
  await kickBack('np phase 2 (mech)');
  r = await ev(() => { const b = boss(); sim(1.2); b.damage(1); sim(1.2); b.damage(1); sim(0.2); return { phase: b.phase, act: b.act, hp: b.hp, gale: !!S().entities.find(e => e.npGale) }; });
  check('np: phase 3, the mech breaks and the gales start', r.phase === 3 && r.hp === 1 && r.gale, r);
  r = await ev(() => { const b = boss(); sim(1.8); return { h: b.h, act: b.act }; });
  check('np: the Baron is on foot and running', r.h === 90 && ['run', 'taunt', 'throw', 'flash', 'hop'].includes(r.act), r);
  // the wind blows Brady
  r = await ev(() => { const g = S(), p = P(); let maxWind = 0; for (let k = 0; k < 80; k++) { sim(0.1); maxWind = Math.max(maxWind, Math.abs(g.windForce || 0)); } return { maxWind }; });
  check('np: the gale pushes Brady on the ledge', r.maxWind > 32, r);
  await snap('np_ledge.png');

  // (d) the last landmark, returned for real: he holds still to taunt, the kick does the rest
  r = await ev(() => { const b = boss(); for (let k = 0; k < 100 && !S().entities.find(e => e.landmark && !e.remove); k++) sim(0.1); for (let k = 0; k < 60; k++) { const e = S().entities.find(e => e.landmark && !e.remove); if (e && e.onGround && Math.abs(e.vx) < 48) break; sim(0.1); } b.go('taunt'); b.vx = 0; return { out: !!S().entities.find(e => e.landmark && !e.remove) }; });
  const last = await kickBack('np phase 3 (the last landmark)');
  if (!last) await ev(() => boss().damage(1));
  r = await ev(() => { const b = boss(); sim(0.1); return { act: b.act, hp: b.hp }; });
  check('np: the killing blow starts the finale gag', r.act === 'finale', r);
  r = await ev(() => { sim(3.2); const roof = S().entities.find(e => e.npRoof), c = S().entities.find(e => e.npChinka); return { freed: roof.n, chinka: c && c.state }; });
  check('np: every landmark is restored and Chinka arrives', r.freed === 12 && (r.chinka === 'run' || r.chinka === 'hug'), r);
  await snap('np_finale.png');
  r = await ev(() => { const b = boss(); const doorX = b.doorX; sim(5); const g = S(); const T = window.BRADY.T || { EMPTY: 0 }; let open = true; for (let y = 3; y < g.area.H - 4; y++) if (g.area.tiles[y * g.area.W + doorX] !== 0) open = false; return { gone: !boss(), open, lock: !!g.bossLock }; });
  check('np: the Baron falls and the summit door opens', r.gone && r.open && !r.lock, r);
  // the ending hand-off: the castle is the finale, and finishing it goes to the ending scene
  r = await ev(() => { const g = S(); const fin = T.Tour.isFinale(g.id); const gate = g.entities.find(e => e.constructor && e.constructor.name === 'Gate'); const p = P(); if (gate) { p.x = gate.cx - p.w / 2; p.y = gate.y + gate.h - p.h; p.vy = 0; } sim(3); const st = g.state; return { fin, gateFound: !!gate, state: st }; });
  check('np: 12-5 is the finale and the gate ends the level', r.fin && r.gateFound && (r.state === 'clear' || r.state === 'tally' || r.state === 'results' || r.state === 'done'), r);
  r = await ev(() => { const g = S(); try { g.goNext(null); } catch (e) { return { err: String(e) }; } return { ending: window.BRADY.Game.scene instanceof T.TourEndingScene }; });
  check('np: after the finale, the tour ending scene plays', r.ending === true, r);
  check('np: Brady never died during the test', !(await died()), await died());
};
