// Australia 16-5: the Drop Bear. Mechanic: he lurks up in the gum tree's crown, out of reach, following Brady; his
// SHADOW on the ground is the tell: it stops and darkens (0.85 s), then he DROPS. Landing on Brady hurts; if he misses
// he lands winded (his weak spot is open): stomp him. Then he scrambles back up. Phase 2 (4 hp): he bounces at Brady
// twice after landing, and gumnuts fall (each with its own shadow first). Phase 3 (2 hp): double drops. Six stomps.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('16-5'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style }; });
  check('au: the Drop Bear wakes under his gum tree', r.state === 'fight' && r.hp === 6 && r.style === 'au_dropbear', r);
  r = await ev(() => { const b = boss(); sim(1.4); return { act: b.act, up: Math.round((b.floorY - b.y - b.h) / 32 * 10) / 10 }; });
  check('au: he climbs up into the crown, out of reach', (r.act === 'lurk' || r.act === 'aim') && r.up > 5, r);
  await snap('au_bear_lurk.png');
  // the tell: in 'aim' the shadow stops moving under him for 0.85 s before the drop
  r = await ev(() => { const b = boss(), p = P(); b.go('lurk'); sim(0.2); b.go('aim'); const x0 = b.x; p.x = b.cx + 200; sim(0.5); const still = Math.abs(b.x - x0) < 1, act1 = b.act; const sh = S().entities.find(e => e.constructor.name === 'AuShadow'); sim(0.5); return { still, act1, act2: b.act, shadow: !!sh }; });
  check('au: TELL: his shadow stops and darkens for a moment before he drops', r.still && r.act1 === 'aim' && (r.act2 === 'drop' || r.act2 === 'winded') && r.shadow, r);
  await snap('au_bear_drop.png');
  // landing on Brady hurts
  r = await ev(() => { const b = boss(), p = P(); b.go('climb'); sim(1.5); b.go('aim'); sim(0.3); p.invuln = 0; if (p.power === 0) p.setPower(1, true); p.x = b.cx - p.w / 2; p.y = b.floorY - p.h; p.vy = 0; const pw = p.power; for (let k = 0; k < 200 && b.act !== 'winded' && b.act !== 'bounce'; k++) { sim(1 / 120); p.x = b.cx - p.w / 2; } const res = { hit: p.power < pw || p.invuln > 0.3 }; p.invuln = 999; return res; });
  check('au: he lands on Brady if Brady stands in the shadow', r.hit, r);
  // one hit: make him miss (Brady to the side), then stomp him while he is winded
  const hitOnce = async label => {
    const r = await ev(() => {
      const b = boss(), p = P(), hp0 = b.hp;
      for (const e of S().entities) if (e.auNut) e.remove = true;
      b.hurtT = 0; b.go('climb'); sim(1.6); b.go('aim'); p.x = b.cx + 160; p.y = b.floorY - p.h; sim(0.1);
      for (let k = 0; k < 400 && b.act !== 'winded'; k++) { sim(1 / 120); if (b.act === 'hop') { } }
      const winded = b.act === 'winded', vuln = b.vuln;
      p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.08);
      const hp = b.hp; sim(1.2);
      return { winded, vuln, hp0, hp, phase: b.phase, state: b.state, act: b.act };
    });
    check(label + ': he misses, lands winded, and a stomp counts', r.winded && r.vuln && r.hp === r.hp0 - 1, r);
    return r;
  };
  for (let k = 1; k <= 6; k++) {
    const r2 = await hitOnce('au hit ' + k);
    if (k === 1) { await ev(() => { const b = boss(), p = P(); b.go('climb'); sim(1.6); b.go('aim'); p.x = b.cx + 160; sim(0.95); for (let q = 0; q < 200 && b.act !== 'winded'; q++) sim(1 / 120); sim(0.2); }); await snap('au_bear_winded.png'); }
    if (k === 2) {
      check('au: phase 2 after two hits', r2.phase === 2, r2);
      r = await ev(() => { const b = boss(), p = P(); b.go('climb'); sim(1.6); b.go('aim'); p.x = b.cx + 160; let bounced = false; for (let q = 0; q < 500; q++) { sim(1 / 120); if (b.act === 'bounce') bounced = true; if (b.act === 'winded') break; } b.go('lurk'); sim(1.2); const nuts = S().entities.filter(e => e.auNut && !e.remove).length; return { bounced, nuts }; });
      check('au: phase 2: he bounces at Brady after landing, and gumnuts fall', r.bounced && r.nuts >= 1, r);
      await snap('au_bear_gumnuts.png');
    }
    if (k === 4) {
      check('au: phase 3 after four hits', r2.phase === 3, r2);
      r = await ev(() => { const b = boss(), p = P(); b.go('climb'); sim(1.6); b.go('aim'); p.x = b.cx + 160; let hop = false; for (let q = 0; q < 600; q++) { sim(1 / 120); if (b.act === 'hop') hop = true; if (b.act === 'winded') break; } return { hop, act: b.act, drops: b.drops }; });
      check('au: phase 3: DOUBLE DROP (straight back up for a second drop)', r.hop && r.act === 'winded', r);
    }
    if (r2.hp <= 0) break;
  }
  r = await ev(() => { for (let k = 0; k < 40 && boss() && !boss().remove; k++) sim(0.1); const b = S().entities.find(e => e.boss); return { gone: !b || b.remove || b.state === 'dying' }; });
  check('au: the sixth stomp sends him packing', r.gone, r);
  await snap('au_bear_beaten.png');
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('au: the gate clears 16-5', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
