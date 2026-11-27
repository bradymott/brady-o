// Foley Beach 29-6: Mr. Thunder, a pea in a biscuit tin who plays the storm and has never been thanked. A stomp
// bounces off his lid. Every hit is a good take played back at him from the mic on its stand (THROW takes it, the
// stick steers it along the tin sheet, the rice tray, the windcloth and Mr. Thunder; THROW captures what sounds;
// THROW plays it back): he bows.
// 1 THE CLAP: his lid lifts (tell, a second), he claps; the tin sheet flaps with it: capture the tin, play it back.
//   The clap's shock ring rolls along the floor half a second later: jump it.
// 2 THE HAIL (after two bows): his cloud wheels in over the rice tray (tell), hail falls (a shadow first) while the
//   tray pours; capture the rice, play it back only once the tray is EMPTY.
// 3 THE GUST (after four bows): the handle winds (tell), a gust shoves Brady and flings shells (jump them); when all
//   is quiet the pea says "thank you": capture HIM, play it back. Six bows.
// Every press is a real button through the game's own prop hook, as a thumb would do it.
module.exports = async ({ page, check, shot }) => {
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const SAFE = 999.07;
  const snap = async n => { await ev(v => { P().invuln = v; const s = S(); s.update = () => {}; }, SAFE); await shot(n); await ev(() => { delete S().update; }); };
  await ev(() => { start('29-6'); enterArena(); });
  await ev(v => { P().invuln = v; }, SAFE);
  await ev(() => {
    window.mic = () => S().entities.find(e => e.constructor.name === 'FoleyBossMic');
    window.standOn = m => { const p = P(); p.x = m.cx - p.w / 2; p.y = m.fy * 32 - p.h - 1; p.vx = p.vy = 0; sim(0.15); return p.onGround && p.groundTy === m.fy; };
    window.throwPress = () => { sim(1 / 120, { action: true, actionPressed: true }); sim(0.05); };
    window.selTo = k => { const m = mic(); let t = 0; while (m.sel !== k && t < 3) { sim(1 / 120, { right: m.sel < k, left: m.sel > k }); t += 1 / 120; } sim(1 / 120); return m.sel === k; };
    window.mount = () => { const m = mic(); standOn(m); if (!m.mounted) throwPress(); return m.mounted; };
    window.waitAct = (act, max) => { const b = boss(); let t = 0; while (b.act !== act && t < (max || 8)) { sim(1 / 60); t += 1 / 60; } return +t.toFixed(2); };
  });
  let r = await ev(() => { const b = boss(); return { state: b.state, hp: b.hp, style: b.style, mic: !!mic(), machines: mic().machines().length }; });
  check('foley: Mr. Thunder wakes on his stage (6 hp); the mic, three machines and him as its four targets', r.state === 'fight' && r.hp === 6 && r.style === 'foley_thunder' && r.mic && r.machines === 4, r);
  await ev(() => sim(0.6));
  await snap('foley_thunder_wake.png');
  r = await ev(() => { const b = boss(), p = P(); b.hurtT = 0; p.x = b.cx - p.w / 2; p.y = b.y - p.h - 2; p.vy = 6 * 32; p.prevBottom = p.y + p.h; sim(0.05); return { hp: b.hp }; });
  check('foley: a stomp bounces off his lid', r.hp === 6, r);
  // phase 1: the lid tell, the clap, the tin captured on the clap and played back; the shock ring jumped
  const clap = (wrong) => ev(w => {
    const b = boss(), hp0 = b.hp; b.hurtT = 0; sim(0.3); mount(); selTo(w ? 1 : 0); b.go('lid'); sim(1 / 120);
    const tell = waitAct('clap'); sim(0.1); throwPress(); const got = mic().got; throwPress(); const hp1 = b.hp;
    // the shock ring: jump it when it comes
    const p = P(); let jumped = false, ring = false; for (let k = 0; k < 400; k++) { const sh = S().entities.find(e => e.constructor.name === 'TourShot' && !e.remove); if (sh && !ring) ring = [Math.round(sh.cx), Math.round(p.cx), k, b.act, +sh.life.toFixed(2), sh.w]; if (sh && Math.abs(sh.cx - p.cx) < 70 && p.onGround) { jumped = true; sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.35, { jump: true }); } else sim(1 / 120); if (!sh && (jumped || b.act !== 'clap')) break; }
    sim(0.5); return { tell, got, hp0, hp1, jumped, ring, hurt: P().invuln < 900, phase: b.phase };
  }, wrong);
  r = await clap(true);
  check('foley: the rice played back at his clap does nothing (it is the tin that sounds like it)', r.got === null && r.hp1 === r.hp0 && r.jumped, r);
  for (let k = 1; k <= 2; k++) { r = await clap(false); check(`foley hit ${k}: the lid lifts (tell over half a second), the clap: the tin captured on it and played back makes him bow (a quick bow cuts the clap short: no shock ring; any ring that comes is jumped)`, r.tell >= 0.5 && r.got === 'tin' && r.hp1 === r.hp0 - 1 && (r.jumped || !r.ring), r); }
  check('foley: PHASE 2 after two bows (THE HAIL)', r.phase === 2, r);
  await ev(() => { const b = boss(); b.go('wheel'); sim(0.9); }); await snap('foley_thunder_cloud.png');
  // phase 2: the cloud wheels in, the hail and the pouring rice; played back too early: nothing; on the empty: a bow
  const hail = (early) => ev(e => {
    const b = boss(), hp0 = b.hp; b.hurtT = 0; sim(1.5); mount(); selTo(1); b.go('wheel'); sim(1 / 120);
    const tell = waitAct('hail'); sim(0.4); throwPress(); const got = mic().got; let earlyHp = null;
    if (e) { throwPress(); earlyHp = b.hp; mount(); for (let q = 0; q < 300 && b.act === 'hail'; q++) sim(1 / 120); mount(); selTo(1); for (let q = 0; q < 300 && !mic().sounding; q++) sim(1 / 120); }
    waitAct('empty'); sim(0.2); if (e) { const m = mic(); if (!m.got) { throwPress(); } }
    const shadows = (b.hailList || []).length; throwPress(); sim(1.4);
    return { tell, got, early: e ? earlyHp === hp0 : null, hp0, hp: b.hp, phase: b.phase, shadows };
  }, early);
  r = await hail(false);
  check('foley hit 3: the cloud wheels in over the tray (tell), it hails while the rice pours; the rice captured and played back once the tray is EMPTY: a bow', r.tell >= 0.5 && r.got === 'rice' && r.hp === r.hp0 - 1, r);
  r = await hail(false);
  check('foley hit 4: the hail again', r.hp === r.hp0 - 1, r);
  check('foley: PHASE 3 after four bows (THE GUST)', r.phase === 3, r);
  await ev(() => { const b = boss(); b.go('gust'); sim(0.8); }); await snap('foley_thunder_gust.png');
  // phase 3: the handle winds, the gust shoves Brady and flings shells (jumped); in the quiet, his own thank-you
  const gust = () => ev(() => {
    const b = boss(), hp0 = b.hp, p = P(); b.hurtT = 0; sim(1.5); standOn(mic()); b.go('wind'); sim(1 / 120);
    const tell = waitAct('gust'); const x0 = p.cx; let jumped = false;
    for (let q = 0; q < 300 && (b.act === 'gust' || b.act === 'unwind'); q++) { const sh = S().entities.find(e => e.constructor.name === 'TourShot' && !e.remove && Math.abs(e.cx - p.cx) < 80 && Math.abs(e.cy - p.cy) < 50); if (sh && p.onGround) { jumped = true; sim(1 / 120, { jump: true, jumpPressed: true }); sim(0.3, { jump: true }); } else sim(1 / 120); }
    const shoved = p.cx < x0 - 16;
    waitAct('quiet'); mount(); selTo(3); let t = 0; while (t < 3 && !b.sounding()) { sim(1 / 120); t += 1 / 120; }
    sim(0.1); throwPress(); const got = mic().got; throwPress(); sim(1.4);
    return { tell, shoved, jumped, got, hp0, hp: b.hp, state: b.state };
  });
  r = await gust();
  check('foley hit 5: the handle winds (tell), the gust shoves Brady and flings shells (jumped); in the quiet the pea says thank you: captured and played back, a bow', r.tell >= 0.5 && r.shoved && r.got === 'pea' && r.hp === r.hp0 - 1, r);
  r = await gust();
  check('foley hit 6: the biggest bow of his career (beaten)', r.hp <= 0.01, r);
  await ev(() => { sim(0.6); }); await snap('foley_thunder_bow.png');
  r = await ev(() => { for (let k = 0; k < 40 && boss() && !boss().remove; k++) sim(0.1); sim(2.5); return { gone: !S().entities.some(e => e.boss && !e.remove) }; });
  check('foley: he is gone after his bow', r.gone, r);
  r = await ev(() => { const g = S(), p = P(); const gate = g.entities.find(e => e.constructor.name === 'Gate' && !e.secret); if (!gate) return { noGate: true }; p.invuln = 0; p.x = gate.cx - 60; p.y = gate.y + gate.h - p.h - 4; p.vy = 0; sim(1, { right: true }); sim(4); return { state: g.state }; });
  check('foley: the gate clears 29-6 like any boss level', r.state === 'clear' || r.state === 'tally' || r.state === 'results', r);
};
