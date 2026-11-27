// Nepal 12-5: Piwi Squirmin', the Grand Finale (and 12-7's Tin Yak at the end). Mechanic: the stolen landmarks. He throws them; Brady kicks them back.
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
  check('np: Piwi wakes on the summit (phase 1, the Showtrunk)', r.state === 'fight' && r.phase === 1 && r.hp === 7 && r.roof, r);

  // (b) a stomp bounces off the Showtrunk and does nothing
  r = await ev(() => { const b = boss(), p = P(); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.1); return { hp: b.hp, alive: !p.dead }; });
  check('np: stomping Piwi bounces off (no damage)', r.hp === 7, r);

  // Piwi throws a landmark: wait for it, then kick it back into him
  const kickBack = async (label) => {
    // wait for a landmark to be thrown and come to rest
    let out = await ev(() => { for (let k = 0; k < 120; k++) { const e = S().entities.find(e => e.landmark && !e.remove); if (e && e.onGround && Math.abs(e.vx) < 48) return { ok: true, id: e.lm.id, x: e.x }; sim(0.1); } return { ok: false }; });
    check(label + ': a landmark lands as a world object', out.ok, out);
    if (!out.ok) return false;
    // put the prop a little way from Piwi, Brady behind it, run into it: the kick lobs it back at him
    const hit = await ev(() => {
      const b = boss(), p = P(); const e = S().entities.find(e => e.landmark && !e.remove);
      const mid = (b.arenaX0 + b.arenaX1) / 2, hold = b.act === 'taunt' ? 'taunt' : 'walk';
      for (let tries = 0; tries < 4 && !e.remove && b.state === 'fight'; tries++) {
        const hp0 = b.hp, side = b.cx < mid ? 1 : -1;  // approach from the open side
        // Piwi is pinned where he stands for the kick (in the game he moves; the lob leads him)
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
    check(label + ': a kicked landmark returns to Piwi and hurts him', hit.ok, hit);
    return hit.ok;
  };
  await ev(() => { for (let k = 0; k < 80; k++) { const b = boss(); if (b.act === 'throw' && b.at > 0.4) break; sim(0.05); } });
  await snap('np_showtrunk.png');
  await kickBack('np phase 1');
  r = await ev(() => { const roof = S().entities.find(e => e.npRoof); return { freed: roof.n, hp: boss().hp }; });
  check('np: the returned landmark is restored behind the summit', r.freed === 1 && r.hp === 6, r);

  // (c) phases: two more hits through the mechanic (shortcut) bring the mech
  r = await ev(() => { const b = boss(); sim(1.2); b.damage(1); sim(1.2); b.damage(1); sim(0.1); const chinka = !!S().entities.find(e => e.npChinka); sim(3.5); return { phase: b.phase, act: b.act, h: b.h, w: b.w, chinka, hp: b.hp }; });
  check('np: phase 2, the Showtrunk crashes and Piwi climbs into the Showstopper mech', r.phase === 2 && r.h === 120 && r.chinka && r.hp === 4, r);
  await snap('np_mech.png');
  await kickBack('np phase 2 (mech)');
  r = await ev(() => { const b = boss(); sim(1.2); b.damage(1); sim(1.2); b.damage(1); sim(0.2); return { phase: b.phase, act: b.act, hp: b.hp, gale: !!S().entities.find(e => e.npGale) }; });
  check('np: phase 3, the mech breaks and the gales start', r.phase === 3 && r.hp === 1 && r.gale, r);
  r = await ev(() => { const b = boss(); sim(1.8); return { h: b.h, act: b.act }; });
  check('np: Piwi is on foot and running', r.h === 90 && ['run', 'taunt', 'throw', 'flash', 'hop'].includes(r.act), r);
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
  check('np: Piwi falls and the summit door opens', r.gone && r.open && !r.lock, r);
  // the ending hand-off: the castle is the finale, and finishing it goes to the ending scene
  r = await ev(() => { const g = S(); const fin = T.Tour.isFinale(g.id); const gate = g.entities.find(e => e.constructor && e.constructor.name === 'Gate'); const p = P(); if (gate) { p.x = gate.cx - p.w / 2; p.y = gate.y + gate.h - p.h; p.vy = 0; } sim(3); const st = g.state; return { fin, gateFound: !!gate, state: st }; });
  check('np: 12-5 is the finale and the gate ends the level', r.fin && r.gateFound && (r.state === 'clear' || r.state === 'tally' || r.state === 'results' || r.state === 'done'), r);
  r = await ev(() => { const g = S(); try { g.goNext(null); } catch (e) { return { err: String(e) }; } return { ending: window.BRADY.Game.scene instanceof T.TourEndingScene }; });
  check('np: after the finale, the tour ending scene plays', r.ending === true, r);
  check('np: Brady never died during the test', !(await died()), await died());

  // ---- fairness (26 Nov): the hurt box is the drawn body; he hovers to one side; he gloats after a throw; mercy after a hit ----
  await ev(() => { start('12-5'); enterArena(); });
  // the drawn art of each form (pixels, no ink) must contain its hurt box; just outside the hurt box Brady is safe, inside he is hit
  const fair = async (label, setup) => ev(([label, setup]) => {
    const b = boss(), p = P(); eval(setup)(b); sim(0.05);
    const c = document.createElement('canvas'); c.width = 700; c.height = 700; const x = c.getContext('2d'); const ox = 350 - b.cx, oy = 350 - (b.y + b.h / 2); x.translate(ox, oy); b.brain.draw(b, x, b.t);
    const d = x.getImageData(0, 0, 700, 700).data, R = b.brain.body(b); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let py = 0; py < 700; py++) for (let px = 0; px < 700; px++) if (d[(py * 700 + px) * 4 + 3] > 100) { const wx = px - ox, wy = py - oy; x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); y0 = Math.min(y0, wy); y1 = Math.max(y1, wy); }
    const inside = R.x >= x0 - 1 && R.x + R.w <= x1 + 1 && R.y >= y0 - 1 && R.y + R.h <= y1 + 1;
    // touch tests: big Brady level with the middle of the hurt box, 4 px clear of its side (safe) and 6 px into it (hit)
    const probe = dx => { p.setPower(1, true); p.growT = 0; p.invuln = 0; p.state = 'play'; p.dead = false; b.hurtT = 0; b.vuln = false; p.vx = 0; p.vy = 0;
      p.x = dx < 0 ? R.x - p.w - 4 : R.x + R.w - 6; p.y = R.y + R.h / 2 - p.h / 2; p.prevBottom = p.y + p.h; const pw = p.power; b.touchPlayer(p); return p.power < pw; };
    const clear = probe(-1), hit = probe(1);
    p.invuln = 999; p.setPower(1, true);
    return { label, inside, clear, hit, body: [Math.round(R.x - b.x), Math.round(R.y - b.y), R.w, Math.round(R.h)], box: [b.w, b.h], art: [Math.round(x0 - b.x), Math.round(y0 - b.y), Math.round(x1 - x0), Math.round(y1 - y0)] };
  }, [label, setup.toString()]);
  for (const [label, setup] of [
    ['Showtrunk', b => { b.go('walk'); }],
    ['Showtrunk swooping', b => { b.go('swoop'); sim(1); }],
    ['Showstopper mech', b => { b.hurtT = 0; b.damage(1); b.hurtT = 0; b.damage(1); b.hurtT = 0; b.damage(1); sim(4); b.go('walk'); }],
    ['mech charging', b => { b.go('charge'); sim(1); }],
    ['Piwi on foot', b => { b.hurtT = 0; b.damage(1); b.hurtT = 0; b.damage(1); b.hurtT = 0; b.damage(1); sim(2); b.go('taunt'); }],
  ]) {
    r = await fair(label, setup);
    check(`np: ${label}: the hurt box sits inside the drawn body; 4 px beside it is safe, touching it hurts`, r.inside && !r.clear && r.hit, r);
  }
  // phase 1 from a fresh fight: he hovers to one side of Brady, high enough for big Brady to stand on a landmark under him, slower than Brady walks
  await ev(() => { start('12-5'); enterArena(); });
  r = await ev(() => { const b = boss(), p = P(); p.setPower(1, true); p.growT = 0; p.invuln = 999; let minDx = 1e9, maxV = 0, low = 1e9;
    // Brady stands at a spot across the summit; Piwi comes over: his top speed on the way, how close he settles, how low he flies
    for (const f of [0.2, 0.8, 0.5, 0.1]) { p.x = b.arenaX0 + f * (b.arenaX1 - b.arenaX0); p.y = b.floorY - p.h; p.vx = 0; let ox = b.x;
      for (let k = 0; k < 100; k++) { sim(1 / 40); if (b.act !== 'walk') b.go('walk'); maxV = Math.max(maxV, Math.abs(b.x - ox) * 40); ox = b.x; const R = b.brain.body(b); low = Math.min(low, b.floorY - (R.y + R.h)); if (k > 80) minDx = Math.min(minDx, Math.abs(R.x + R.w / 2 - p.cx)); } }
    return { minDx: Math.round(minDx), maxSpeed: Math.round(maxV), lowest: Math.round(low), bigOnJar: 32 + p.h, walk: 6.2 * 32 }; });
  check('np: the Showtrunk keeps to one side of Brady (never over him), slower than he walks, above big Brady on a landmark', r.minDx > 33 + 11 && r.maxSpeed < r.walk && r.lowest > r.bigOnJar, r);
  // after a throw he holds still to gloat: the opening to kick the landmark back
  r = await ev(() => { const b = boss(); b.thrown = 0; b.go('throw'); let t = 0; while (b.act === 'throw' && t < 3) { sim(0.05); t += 0.05; } const x0 = b.x, a = b.act; let still = 0; while (b.act === 'gloat' && still < 5) { sim(0.05); still += 0.05; } return { after: a, still: +still.toFixed(2), moved: Math.round(Math.abs(b.x - x0)) }; });
  check('np: after a throw Piwi gloats in place for over a second (the opening)', r.after === 'gloat' && r.still >= 1.2 && r.moved < 8, r);
  // mercy: once he hurts Brady he starts no new attack for a moment
  r = await ev(() => { const b = boss(), p = P(); for (const e of S().entities) if (e.landmark) e.remove = true; b.go('walk'); b.at = 1.4; p.invuln = 0; p.setPower(1, true); sim(0.02); b.go('walk'); b.at = 1.4; p.hurt(b); const acts = []; for (let k = 0; k < 30; k++) { sim(0.05); acts.push(b.act); } p.invuln = 999; return { acts: [...new Set(acts)] }; });
  check('np: after Piwi hurts Brady he backs off and starts no attack for 1.5 s', r.acts.length === 1 && r.acts[0] === 'walk', r);

  // ---- the walls (26 Nov: Brady popped through the door wall and walked out to the gate mid-fight) ----
  for (const [label, side, setup, hit] of [
    ['the Showtrunk crashes on Brady at the door wall', 1, b => { b.hp = 5; b.x = b.arenaX1 - b.w; b.go('walk'); }, b => b.damage(1)],
    ['the Showtrunk crashes on Brady at the entrance', -1, b => { b.hp = 5; b.x = b.arenaX0; b.go('walk'); }, b => b.damage(1)],
    ['the mech is hit standing over Brady at the door wall', 1, b => { b.hurtT = 0; b.damage(1); b.hurtT = 0; b.damage(1); b.hurtT = 0; b.damage(1); sim(4); b.x = b.arenaX1 - b.w; b.go('walk'); }, b => { b.hurtT = 0; b.damage(1); }],
  ]) {
    await ev(() => { start('12-5'); enterArena(); });
    r = await ev(([side, setup, hit]) => {
      const b = boss(), p = P(), g = S(); p.setPower(1, true); p.growT = 0; eval(setup)(b); sim(0.05);
      p.x = side > 0 ? b.arenaX1 - p.w : b.arenaX0; p.y = b.floorY - p.h; p.vx = 0; p.vy = 0; p.invuln = 999; eval(hit)(b);
      let lo = p.x, hi = p.x + p.w; for (let k = 0; k < 100; k++) { sim(0.05); lo = Math.min(lo, p.x); hi = Math.max(hi, p.x + p.w); }
      for (let k = 0; k < 40; k++) sim(0.05, side > 0 ? { right: true } : { left: true });
      return { outBy: Math.round(Math.max(b.arenaX0 - lo, hi - b.arenaX1, 0)), x: Math.round(p.x), arena: [b.arenaX0, b.arenaX1], state: g.state, fighting: b.state };
    }, [side, setup.toString(), hit.toString()]);
    check(`np: walls: ${label}: Brady is never pushed through it`, r.outBy === 0 && r.state === 'play', r);
  }
  // and even if Brady stood past the door, the gate would not end the level while Piwi fights
  r = await ev(() => { const b = boss(), g = S(), p = P(); const gate = g.entities.find(e => e.constructor && e.constructor.name === 'Gate'); p.x = gate.cx - p.w / 2; p.y = gate.y + gate.h - p.h; p.vy = 0; sim(0.5); return { state: g.state, fighting: b.state, x: Math.round(p.x), x1: b.arenaX1 }; });
  check('np: walls: the summit gate does nothing while Piwi still fights (Brady is held in the arena)', r.state === 'play' && r.x + 22 <= r.x1, r);

  // ---- the yak (26 Nov: Brady was drawn twice, one on the yak and one running behind it) ----
  // every drawing of Brady reads Save.data.look once: riding the yak must not add a read per frame
  const looks = () => page.evaluate(() => new Promise(res => { const D = window.BRADY.Save.data, v = D.look; let n = 0, f = 0; Object.defineProperty(D, 'look', { configurable: true, enumerable: true, get() { n++; return v; }, set() {} }); const tick = () => { if (++f < 13) requestAnimationFrame(tick); else { delete D.look; D.look = v; res(n / 12); } }; requestAnimationFrame(tick); }));
  for (const pw of [0, 1, 2]) {
    await ev(pw => { start('12-2', { lead: true }); const p = P(); p.collect('sig:yak'); p.setPower(pw, true); p.growT = 0; p.invuln = 0; sim(0.4, { right: true }); }, pw);
    const ride = await looks();
    await ev(() => { window.__sig = P().sig; P().sig = null; });
    const walk = await looks();
    await ev(() => { P().sig = window.__sig; });
    if (pw === 1) await shot('np_yak_big.png');
    check(`np: riding the yak (power ${pw}) Brady is drawn once`, Math.abs(ride - walk) < 0.5, { ride, walk });
  }

  // ---- 12-7 FORT: the Tin Yak (mini-boss, 3 hp, 2 phases): dodge its charge so it rams a crate wall, stomp it while stuck ----
  await ev(() => { start('12-7'); enterArena(); }); await safe(); await watch();
  r = await ev(() => { const b = boss(), g = S(); return { state: b.state, hp: b.hp, name: b.name, walls: g.entities.filter(e => e.crateWall && !e.remove).length, mid: b.mid }; });
  check('np: the Tin Yak wakes in the depot bay between two crate walls', r.state === 'fight' && r.hp === 3 && /TIN YAK/.test(r.name) && r.walls === 2 && r.mid, r);
  r = await ev(() => { const b = boss(), p = P(); b.go('walk'); sim(0.05); const hp0 = b.hp; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; sim(0.5); return { hp0, hp: b.hp }; });
  check('np: a stomp on the Tin Yak while it walks just bounces off', r.hp === r.hp0, r);
  // Brady waits beyond the left crate wall: the yak paws (the tell), charges at him and rams the wall
  const ram = () => ev(() => {
    const b = boss(), g = S(), p = P(), w = g.entities.filter(e => e.crateWall && !e.remove).sort((a, c) => a.x - c.x)[0];
    p.x = b.arenaX0 + 8; p.y = b.floorY - p.h; p.vy = 0; p.vx = 0;
    b.x = w.x + w.w + 4 * 32; b.y = b.floorY - b.h; b.vx = 0; b.go('paw');
    const acts = []; for (let k = 0; k < 80 && b.act !== 'stuck'; k++) { sim(0.05); p.x = b.arenaX0 + 8; acts.push(b.act); }
    return { seq: [...new Set(acts)], stuck: b.act === 'stuck', vuln: b.vuln, dents: w.dents, wx: w.tx };
  });
  r = await ram();
  check('np: the Tin Yak paws the floor (the tell), charges and gets stuck in a crate wall', r.seq.includes('paw') && r.seq.includes('charge') && r.stuck && r.vuln && r.dents >= 1, r);
  await snap('np_tinyak_stuck.png');
  r = await ev(() => { const b = boss(), p = P(), g = S(); const hp0 = b.hp; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 30; p.vy = 0; let n = 0; while (b.hp === hp0 && n++ < 60) sim(0.02);
    const walls0 = g.entities.filter(e => e.crateWall).map(w => w.tx); p.x = b.arenaX0 + 8; p.y = b.floorY - p.h; sim(1.2); const walls1 = g.entities.filter(e => e.crateWall).map(w => w.tx);
    return { hp0, hp: b.hp, phase: b.phase, moved: walls0.join() !== walls1.join(), walls0, walls1 }; });
  check('np: stomped while stuck, it takes a dent; phase 2 sends the crate walls along the conveyor', r.hp === r.hp0 - 1 && r.phase === 2 && r.moved, r);
  // phase 2: a charge that meets the bare wall turns straight into a second charge
  r = await ev(() => { const b = boss(), g = S(), p = P(); const ws = g.entities.filter(e => e.crateWall); for (const w of ws) { w.clear(); w.place(b.arenaX1 / 32 - 3); } p.x = b.arenaX0 + 8; p.y = b.floorY - 5 * 32 - p.h; p.vy = 0;
    b.x = b.arenaX0 + 6 * 32; b.y = b.floorY - b.h; b.dir = -1; b.go('charge'); const acts = []; for (let k = 0; k < 60; k++) { sim(0.05); acts.push(b.act); } return { acts: acts.filter((a, i) => a !== acts[i - 1]) }; });
  check('np: in phase 2 the Tin Yak charges twice in a row', r.acts.indexOf('paw') > 0 && r.acts.indexOf('charge', r.acts.indexOf('paw')) > 0, r);
  // the finish: it rattles to a stop, a chime, and the bay door opens
  r = await ev(() => { const b = boss(), g = S(), p = P(); p.x = b.arenaX0 + 8; p.y = b.floorY - p.h; sim(1); b.hurtT = 0; b.damage(1); sim(1.2); b.hurtT = 0; b.state = 'fight'; b.damage(1); const act = b.act; sim(5);
    const row = Math.floor(b.floorY / 32) - 1; return { act, removed: !!b.remove, door: g.area.tiles[row * g.area.W + b.doorX], lock: !!g.bossLock }; });
  check('np: beaten, the Tin Yak rattles to a stop and the bay door opens', r.act === 'rattle' && r.removed && r.door === 0 && !r.lock, r);
  check('np: Brady never died in the depot', !(await died()), await died());
};
