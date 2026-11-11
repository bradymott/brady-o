// Antarctica 13-4: Big Tusk. Mechanic: icicles bumped down from the ice ceiling, and ice blocks kicked into his slide.
// Then 13-3's mini-boss, the Snow-Plough Bot: it shoves snow walls across the hangar; after three shoves it overheats
// and a stomp on it counts.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const safe = () => ev(v => { P().invuln = v; }, SAFE);
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  // Brady should never die during the test: if he does, the level restarts and a fresh boss appears (record why)
  const watch = () => ev(() => { const p = P(); if (p.__watched) return; p.__watched = true; const d = p.die.bind(p); window.__died = null; p.die = function (reason) { window.__died = { reason, x: Math.round(p.x), y: Math.round(p.y), h: p.h, t: Math.round(S().t) }; return d(reason); }; });
  const died = () => ev(() => window.__died);
  await ev(() => { start('13-4'); enterArena(); }); await safe(); await watch();
  // (the castle builder appends a second arena after the first; everything here is scoped to the first one)
  let r = await ev(() => { const b = boss(), g = S(); const inA = e => e.x >= b.arenaX0 && e.x < b.arenaX1; return { state: b.state, phase: b.phase, hp: b.hp, icicles: g.entities.filter(e => e.aqIcicle && inA(e)).length, blocks: g.entities.filter(e => e.iceBlock && !e.remove && inA(e)).length, floe: !!g.entities.find(e => e.aqFloe && inA(e)) }; });
  check('aq: Big Tusk wakes on a floe with icicles above and ice blocks about', r.state === 'fight' && r.phase === 1 && r.hp === 6 && r.icicles === 6 && r.blocks === 2 && r.floe, r);

  // (b) stomps bounce off the blubber
  r = await ev(() => { const b = boss(), p = P(); b.go('walk'); b.vx = 0; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.1); return { hp: b.hp, act: b.act }; });
  check('aq: stomping Big Tusk bounces off (no damage)', r.hp === 6, r);

  // an icicle: Brady bumps it with his head, it shivers and drops on the walrus underneath
  const icicleHit = async label => {
    const r = await ev(() => {
      const b = boss(), p = P(), g = S();
      const f = g.entities.find(e => e.aqFloe && e.x >= b.arenaX0); const overWater = x => f && f.cracked && f.gaps.some(gx => x > gx * 32 - 40 && x < (gx + 2) * 32 + 40);
      const ic = g.entities.find(e => e.aqIcicle && e.state === 'hang' && Math.abs(e.cx - (b.arenaX0 + b.arenaX1) / 2) < 8 * 32 && !overWater(e.cx));
      if (!ic) return { noIcicle: true };
      const hp0 = b.hp;
      b.go('tusks'); b.vx = 0; b.x = ic.cx - b.w / 2; b.y = b.floorY - b.h;     // he digs his tusks in right under it
      p.x = ic.cx - p.w / 2; p.y = ic.y + ic.h + 1; p.vy = -9 * 32; p.prevBottom = p.y + p.h + 6; sim(1 / 60);
      const shaking = ic.state === 'shake';
      for (let k = 0; k < 40 && b.hp === hp0; k++) { b.x = ic.cx - b.w / 2; b.vx = 0; if (b.act !== 'tusks') { b.go('tusks'); } sim(0.05); }
      p.x = b.arenaX0 + 4.5 * 32; p.y = b.floorY - 4 * 32 - p.h; p.vy = 0; sim(0.05);
      return { shaking, hp: b.hp, hp0, icState: ic.state, act: b.act };
    });
    check(label + ': a head-bumped icicle drops on Big Tusk and hurts him', r.shaking && r.hp === r.hp0 - 1, r);
    return r.hp === r.hp0 - 1;
  };
  await ev(() => { const b = boss(), p = P(), g = S(); const ic = g.entities.find(e => e.aqIcicle && e.state === 'hang'); if (ic) { b.go('walk'); b.x = ic.cx - b.w / 2; b.vx = 0; p.x = ic.cx - p.w / 2 - 60; p.y = b.floorY - p.h; ic.drop(); sim(0.42); } });
  await snap('aq_icicle.png');
  await icicleHit('aq icicle');

  // an ice block kicked into his belly-slide: he tumbles
  const blockHit = async label => {
    const r = await ev(() => {
      const b = boss(), p = P(), g = S();
      sim(1.5);
      let blk = g.entities.find(e => e.iceBlock && !e.remove); if (!blk) return { noBlock: true };
      const hp0 = b.hp, mid = (b.arenaX0 + b.arenaX1) / 2;
      for (let tries = 0; tries < 4 && b.hp === hp0; tries++) {
        blk = g.entities.find(e => e.iceBlock && !e.remove); if (!blk) return { noBlock: true, tries };
        // the walrus slides in from the right; the block waits in the middle, Brady runs into it from the left
        b.x = b.arenaX1 - b.w - 20; b.y = b.floorY - b.h; b.dir = -1; b.go('slide'); b.at = 0.61; b.turns = 0;
        blk.x = mid - blk.w / 2; blk.y = b.floorY - blk.h; blk.vx = 0; blk.vy = 0; blk.thrownBy = null;
        p.x = blk.x - 70; p.y = b.floorY - p.h; p.vy = 0; p.vx = 0; p.facing = 1;
        for (let k = 0; k < 30 && b.hp === hp0; k++) sim(0.05, { right: true });
        sim(0.3);
      }
      return { hp: b.hp, hp0, act: b.act };
    });
    check(label + ': an ice block kicked into his slide tumbles him', r.hp === r.hp0 - 1 && (r.act === 'tumble' || r.act === 'walk' || r.act === 'call' || r.act === 'bigflop'), r);
    return r.hp === r.hp0 - 1;
  };
  await blockHit('aq block');
  // two real hits bring hp to 4: that is the phase 2 threshold, he calls the penguins
  r = await ev(() => { const b = boss(), g = S(); const act = b.act; sim(1.0); return { phase: b.phase, hp: b.hp, act, skidders: g.entities.filter(e => e.aqSkidder && !e.remove).length, all: g.entities.filter(e => e.aqSkidder).map(e => [e.remove, e.dead, e.knocked, Math.round(e.x), e.passes, +e.life.toFixed(1)]) }; });
  check('aq: phase 2, he calls the penguin squad', r.phase === 2 && r.hp === 4 && r.act === 'call' && r.skidders === 2, r);
  await snap('aq_penguins.png');
  // a block into a walrus that is NOT sliding does nothing
  r = await ev(() => { const b = boss(), p = P(), g = S(); sim(1.5); const blk = g.entities.find(e => e.iceBlock && !e.remove); if (!blk) return { noBlock: true }; const hp0 = b.hp; b.go('tusks'); b.vx = 0; b.x = (b.arenaX0 + b.arenaX1) / 2 - b.w / 2; blk.x = b.x - 80; blk.y = b.floorY - blk.h; blk.vx = 0; blk.vy = 0; p.x = blk.x - 60; p.y = b.floorY - p.h; p.vx = 0; p.facing = 1; for (let k = 0; k < 16; k++) { if (b.act !== 'tusks') b.go('tusks'); b.vx = 0; sim(0.05, { right: true }); } return { hp: b.hp, hp0 }; });
  check('aq: a block into a walrus that is not sliding does not hurt him', r.hp === r.hp0, r);

  // (c) phases
  r = await ev(() => { const b = boss(), g = S(), p = P(); p.x = b.arenaX0 + 4.5 * 32; p.y = b.floorY - 4 * 32 - p.h; p.vy = 0; b.damage(1); sim(1.2); b.damage(1); sim(0.2); const act = b.act; const floe = () => g.entities.find(e => e.aqFloe && e.x >= b.arenaX0); for (let k = 0; k < 60 && !floe().cracked; k++) sim(0.1); const f = floe(); const A = g.area, GY = f.GY; const gapTile = A.tiles[GY * A.W + f.gaps[0]], water = A.tiles[(GY + 2) * A.W + f.gaps[0]]; return { phase: b.phase, hp: b.hp, act, cracked: f.cracked, gapTile, water, fplats: g.entities.filter(e => e instanceof window.BRADY_TYPES.fplat && e.x >= b.arenaX0 && e.x < b.arenaX1).length }; });
  check('aq: phase 3, the big flop cracks the floe into sinking sections over water', r.phase === 3 && r.hp === 2 && r.act === 'bigflop' && r.cracked && r.gapTile === 0 && r.water === 9 && r.fplats === 3, r);
  await ev(() => { const b = boss(), p = P(); b.go('slide'); sim(1.0); p.x = b.arenaX0 + 3.5 * 32; p.y = b.floorY - p.h; p.vy = 0; sim(0.05); });
  await snap('aq_cracked.png');
  await ev(() => { const p = P(), b = boss(); p.x = b.arenaX0 + 4.5 * 32; p.y = b.floorY - 4 * 32 - p.h; p.vy = 0; sim(0.05); });

  // (d) beaten through the mechanic: two more icicles
  const okA = await icicleHit('aq phase 3 icicle');
  if (!okA) await ev(() => boss().damage(1));
  r = await ev(() => { const b = boss(); sim(1.5); return { hp: b.hp }; });
  if (await ev(() => boss().hp > 0)) { const okB = await icicleHit('aq last icicle'); if (!okB) await ev(() => boss().damage(1)); }
  r = await ev(() => { const b = boss(); sim(0.1); return { act: b.act, hp: b.hp }; });
  check('aq: the last hit sends him sliding off', r.act === 'exit', r);
  r = await ev(() => { const b = boss(), p = P(); sim(3.6); p.x = b.arenaX1 - 5 * 32 - p.w / 2; p.y = b.floorY - p.h; p.vy = 0; sim(0.05); return { splashed: b.splashed, sunk: b.sunk }; });
  check('aq: he splashes into the water hole with a thumbs-up', r.splashed && r.sunk >= 1, r);
  await snap('aq_exit.png');
  r = await ev(() => { const b = boss(), doorX = b.doorX; sim(4); const g = S(); let open = true; for (let y = 3; y < g.area.H - 4; y++) if (g.area.tiles[y * g.area.W + doorX] !== 0) open = false; return { gone: !boss(), open, lock: !!g.bossLock }; });
  check('aq: Big Tusk is gone and the door opens', r.gone && r.open && !r.lock, r);
  check('aq: Brady never died during the test', !(await died()), await died());

  // ---------------- 13-3: the Snow-Plough Bot (FORT mini-boss) ----------------
  await ev(() => { start('13-3'); enterArena(); }); await safe();
  await ev(() => { const p = P(); window.__hurts = 0; const h = p.hurt.bind(p); p.hurt = function (src) { if (src && src.aqWall) { window.__hurts++; return; } return h(src); }; });
  r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, mid: b.mid, name: b.name, act: b.act }; });
  check('aq plough: the Snow-Plough Bot wakes in the hangar (a mini-boss, 3 hits)', r.state === 'fight' && r.hp === 3 && r.mid && /PLOUGH/.test(r.name), r);
  r = await ev(() => { const b = boss(), p = P(); b.go('back'); b.vx = 0; sim(0.05); p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.1); return { hp: b.hp }; });
  check('aq plough: a stomp while it runs cool bounces off', r.hp === 3, r);
  r = await ev(() => {
    const b = boss(), g = S(), p = P(); const mid = (b.arenaX0 + b.arenaX1) / 2;
    p.x = b.arenaX0 + 3 * 32; p.y = b.floorY - p.h; p.vy = 0;
    b.go('rev'); let k = 0; while (b.act !== 'plough' && k++ < 300) sim(1 / 60);
    sim(0.05); const walls = g.entities.filter(e => e.aqWall && !e.remove); const w = walls[0]; const x0 = w ? w.cx : 0; sim(0.6);
    return { act: b.act, n: walls.length, toward: w ? Math.sign(w.cx - x0) === Math.sign(mid - b.cx) : false, rows: w ? +w.rows.toFixed(2) : 0 };
  });
  check('aq plough: after the rev tell it shoves a growing snow wall across the floor', r.n === 1 && r.toward && r.rows > 1, r);
  r = await ev(() => { const g = S(), p = P(); const w = g.entities.find(e => e.aqWall && !e.remove); p.invuln = 0; p.x = w.cx - p.w / 2; p.y = w.floorY - p.h; p.vy = 0; sim(0.05); p.invuln = 999.07; for (const e of g.entities) if (e.aqWall) e.remove = true; sim(0.05); return { hurts: window.__hurts }; });
  check('aq plough: the snow wall hurts Brady if he does not jump it', r.hurts >= 1, r);
  r = await ev(() => { const b = boss(), p = P(); p.x = b.arenaX0 + 3 * 32; p.y = b.floorY - p.h; let k = 0; while (b.act !== 'hot' && k++ < 40) { for (const e of S().entities) if (e.aqWall) e.remove = true; sim(0.25); } return { act: b.act, vuln: b.vuln, pushes: b.pushes }; });
  check('aq plough: after three shoves it overheats (the weak moment)', r.act === 'hot' && r.vuln, r);
  await snap('aq_plough_hot.png');
  r = await ev(() => { const b = boss(), p = P(); p.x = b.cx - 30 - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.1); return { hp: b.hp, phase: b.phase }; });
  check('aq plough: a stomp on the overheated bot hurts it, and phase 2 begins', r.hp === 2 && r.phase === 2, r);
  r = await ev(() => { const b = boss(), g = S(), p = P(); p.x = b.arenaX0 + 3 * 32; p.y = b.floorY - p.h; let k = 0; while (b.act !== 'plough' && k++ < 120) sim(0.05); let most = 0, dirs = new Set(); for (let q = 0; q < 40; q++) { sim(0.05); const ws = g.entities.filter(e => e.aqWall && !e.remove); most = Math.max(most, ws.length); for (const w of ws) dirs.add(w.dir); } return { act: b.act, most, dirs: [...dirs] }; });
  check('aq plough: in phase 2 a second wall comes from the far chute the other way', r.most >= 2 && r.dirs.length === 2, r);
  await snap('aq_plough_walls.png');
  r = await ev(() => { const b = boss(), p = P(); for (let h = 0; h < 2; h++) { let k = 0; while (b.act !== 'hot' && k++ < 200) { for (const e of S().entities) if (e.aqWall) e.remove = true; sim(0.1); } p.x = b.cx - 30 - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.1); sim(1.4); } return { act: b.act, hp: b.hp }; });
  check('aq plough: the last stomp melts it into a puddle', r.hp <= 0 && (r.act === 'melt' || !boss()), r);
  r = await ev(() => { const b = boss(); const doorX = b ? b.doorX : null; sim(5); const g = S(); let open = true; if (doorX != null) for (let y = 3; y < g.area.H - 4; y++) if (g.area.tiles[y * g.area.W + doorX] !== 0) open = false; return { gone: !boss(), open, lock: !!g.bossLock }; });
  check('aq plough: the bot is gone and the hangar door opens', r.gone && r.open && !r.lock, r);
};
