// Pupo, PU-2: the stretch arms and the level objects (docs/design/PUPO.md §2, §7.10). Node only: the real game modules
// in a VM, the lab fixture (tools/fixtures/sbw_pupo_lab.js, level 'reach') as a Play scene stepped at 1/120 s.
// Sections: geometry (line of sight with grilles, the aim and cone, the target priority, the swing release), poke
// (enemies, belly buttons, boxes, the boop, the cooldown, cousins), swing (hooks, hand over hand, the release), zip (posts),
// climb, hang, ledge, pull (handles: locks and toggle groups), tickle, fetch (items high up, through a grille, a snatch,
// coins), draw (the arm is drawn outside the ink pass; every mode draws)
// usage: node tools/sbw_pupo_reach_test.js [section ...]
const { boot, checker } = require('./sbw_pupo_lib');
const G = boot(), C = checker(), want = process.argv.slice(2);
const { T, TS } = G;
const R0 = G.run('PupoRide'), PR = G.run('PupoReach'), K = PR.K;
const near = (a, b, eps) => Math.abs(a - b) <= eps;
const put = (g, tx, feetY) => { const p = g.player; p.x = tx * TS + TS / 2 - p.w / 2; p.y = feetY - p.h; p.vx = 0; p.vy = 0; p.onGround = false; p.runT = 0; };
const FLOOR = 14 * TS;
// the reach lab, riding (the box opened and Pupo mounted right away), standing at column tx
function ride(tx) {
  const g = G.lab('reach'); G.step(g, 0.2);
  g.bumpBlock(5, 13, false, g.player); G.step(g, 1.3);
  const f = g.pupo.free; R0.mount(g.player, true, { x: f.cx, y: f.y + f.h }); f.remove = true; G.step(g, 0.1);
  if (tx != null) { put(g, tx, FLOOR); G.step(g, 0.3); }
  return g;
}
const foe = (g, dx, type, feet) => { const p = g.player, E = G.run('ENTITY_TYPES.' + (type || 'mxElote')); const e = new E(g, { type: type || 'mxElote', x: p.cx + dx, y: feet || p.y + p.h, dir: -1 }); g.spawn(e); e.vx = 0; e.speed = 0; e.cool = 99; return e; };

C.section(want, 'geometry', () => {
  const g = ride(26), A = g.area;
  C.check('line of sight: open air is clear, a wall blocks it', PR.los(A, 3 * TS, 12 * TS, 7 * TS, 12 * TS, null) && !PR.los(A, 45 * TS, 10 * TS, 55 * TS, 10 * TS, null));
  const gr = A.pupoGrilles;
  C.check('line of sight: grille tiles let arms through (and only grille tiles)', PR.los(A, 106 * TS, 12.5 * TS, 110.5 * TS, 12.5 * TS, gr) && !PR.los(A, 106 * TS, 12.5 * TS, 110.5 * TS, 12.5 * TS, null) && !PR.los(A, 114 * TS, 12.5 * TS, 110.5 * TS, 12.5 * TS, gr), gr);
  PR.aim({ right: true }, 1); const a1 = [PR.ax, PR.ay, PR.neutral];
  PR.aim({ up: true, left: true }, 1); const a2 = [PR.ax, PR.ay];
  PR.aim({}, -1); const a3 = [PR.ax, PR.ay, PR.neutral];
  C.check('the aim: the stick in 8 ways, the facing when it is still', a1[0] === 1 && a1[1] === 0 && !a1[2] && near(a2[0], -Math.SQRT1_2, 1e-6) && near(a2[1], -Math.SQRT1_2, 1e-6) && a3[0] === -1 && a3[2], { a1, a2, a3 });
  C.check('the score: dist / reach + 0.5 * angle / cone, enemies 0.2 lower', near(PR.score(2 * TS, 4 * TS, 0.2, 0.7, true), 0.5 + 0.5 * 0.2 / 0.7 - 0.2, 1e-9));
  // the priority: an enemy within 2 tiles beats a hook that scores better
  const p = g.player; put(g, 8, FLOOR); G.step(g, 0.3);
  const e = foe(g, -1.6 * TS); const tg = PR.scan(p, g, g.pupo, { up: true, right: true });
  C.check('safety first: a hostile enemy within 2 tiles is picked over the hook he aims at', tg.kind === 'enemy' && tg.e === e, tg.kind);
  e.remove = true; G.step(g, 0.05);
  const tg2 = PR.scan(p, g, g.pupo, { up: true, right: true });
  C.check('otherwise the hook in the cone is picked', tg2.kind === 'hook', tg2.kind);
  const tg3 = PR.scan(p, g, g.pupo, { left: true });
  C.check('nothing in the cone: no target (the press is a boop into the air)', !tg3.kind, tg3.kind);
  // the release
  PR.release(0, 3, 2.5 * TS, false); const r1 = [PR.rvx / TS, PR.rvy / TS];
  PR.release(0, 10, 2.5 * TS, false); const r2 = Math.hypot(PR.rvx, PR.rvy) / TS;
  PR.release(0, 10, 2.5 * TS, true); const r3 = Math.hypot(PR.rvx, PR.rvy) / TS;
  C.check('the swing release: speed along the swing x1.15 plus 3 t/s up, capped at 14 (10 drowsy)', near(r1[0], 3 * 2.5 * 1.15, 1e-6) && near(r1[1], -3, 1e-6) && near(r2, 14, 1e-6) && near(r3, 10, 1e-6), { r1, r2, r3 });
});

C.section(want, 'poke', () => {
  let g = ride(24), p = g.player;
  const m0 = g.pupo.meter, e = foe(g, 3 * TS);
  let t = 0; G.step(g, 1 / 120, { actionPressed: true });
  while (!e.dead && t < 1) { G.step(g, 1 / 120); t += 1 / 120; }
  C.check(`Action pokes the enemy 3 tiles ahead: the arm lands in ${t.toFixed(2)} s (30 t/s out) and defeats it`, e.dead && t < 0.16, { t, dead: e.dead });
  C.check('a poke defeat adds 0.10 to the meter', near(g.pupo.meter - m0, 0.10, 0.02), g.pupo.meter - m0);
  const a = g.pupo.arm; G.step(g, 0.05);
  const out = a.phase !== 0; G.step(g, 0.3);
  C.check('the arm holds 0.10 s, comes back at 22 t/s and is ready again after 0.20 s', out && a.phase === 0 && a.cool > 0, { phase: a.phase, cool: a.cool });
  // the cooldown: a second press inside it does nothing
  const e2 = foe(g, 2.5 * TS); G.step(g, 1 / 120, { actionPressed: true }); const fired = a.phase !== 0;
  G.step(g, 0.5); G.step(g, 1 / 120, { actionPressed: true }); G.step(g, 0.3);
  C.check('a press during the cooldown is ignored, the next one pokes', !fired && e2.dead, { fired, dead: e2.dead });
  // belly buttons: a mammal gets the ring in its belly button, the rest a nose boop
  G.step(g, 0.6); const E3 = foe(g, 2.5 * TS); E3.cfg = Object.assign({}, E3.cfg, { belly: true }); G.step(g, 1 / 120, { actionPressed: true }); G.step(g, 0.2);
  C.check('a mammal (belly: true) is booped in the belly button (the ring), and defeated', E3.dead && a.belly === true);
  G.step(g, 0.5); const E4 = foe(g, 2.5 * TS); G.step(g, 1 / 120, { actionPressed: true }); G.step(g, 0.2);
  C.check('a non-mammal gets a nose boop, the same defeat', E4.dead && a.belly === false);
  // an enemy whose hit() says no just shrugs
  G.step(g, 0.5); const E5 = foe(g, 2.5 * TS); E5.hit = () => false; G.step(g, 1 / 120, { actionPressed: true }); G.step(g, 0.3);
  C.check('a curled or armoured enemy (hit() -> false) is not defeated', !E5.dead); E5.remove = true;
  // the brSloth ceiling-droppers are Pupo's cousins: befriended
  G.step(g, 0.6); const E6 = foe(g, 2.5 * TS, 'brSloth'); G.step(g, 0.5); G.step(g, 1 / 120, { actionPressed: true }); G.step(g, 0.3);
  C.check('a brSloth is befriended, never hostile again', E6.friendT > 0 && !E6.enemy, { friend: E6.friendT, enemy: E6.enemy });
  // a gift box in reach opens on a poke
  g = ride(24); p = g.player; const A = g.area; A.tiles[11 * A.W + 26] = T.QBLOCK; A.contents['26,11'] = 'oneup';
  G.step(g, 0.1); G.step(g, 1 / 120, { up: true, right: true, actionPressed: true }); G.step(g, 0.3);
  C.check('a poke opens a gift box (the item comes out)', A.tiles[11 * A.W + 26] === T.USED && g.entities.some(e => e.item && e.kind === 'oneup'));
  // the boop into the air: out 4 tiles and back
  G.step(g, 1); const b0 = g.pupo.arm; G.step(g, 1 / 120, { left: true, actionPressed: true }); G.step(g, 0.13);
  C.check('nothing in range: a boop into the air at 4 tiles', b0.kind === 'air' && near(b0.dist, 4 * TS, 2), { kind: b0.kind, dist: b0.dist });
  // drowsy: a shorter reach and a longer cooldown
  G.step(g, 1); g.pupo.drowsyT = 5; const E7 = foe(g, 3.8 * TS); const tg = PR.scan(p, g, g.pupo, {});
  C.check('drowsy: the reach drops to 3.5 tiles', tg.e !== E7, tg.kind);
  E7.remove = true; G.step(g, 0.6); p.facing = 1; const E8 = foe(g, 2.5 * TS); G.step(g, 1 / 120, { actionPressed: true }); G.step(g, 0.45);
  C.check('drowsy: the cooldown is 0.5 s', g.pupo.arm.cool > 0.2, { cool: g.pupo.arm.cool, ride: p.pupoRide, E8: E8.dead, mode: g.pupo.mode, kind: g.pupo.tg.kind, items: g.entities.filter(e => e.item).length });
});

C.section(want, 'swing', () => {
  const g = ride(8), p = g.player;
  G.step(g, 1 / 120, { up: true, right: true, actionPressed: true }); G.step(g, 0.3);
  C.check('Action at the hook: the arm grabs it and Pupo swings', g.pupo.mode === 'swing' && g.pupo.sw.e.kind === 'hook', g.pupo.mode);
  let L = 0; for (let i = 0; i < 60; i++) { G.step(g, 1 / 120); L = g.pupo.sw.L; }
  C.check('the arm reels in to 2.5 tiles', near(L, 2.5 * TS, 2), L / TS);
  // pump toward the right, then Action at the next hook: hand over hand
  let passed = false;
  for (let i = 0; i < 240 && !passed; i++) { G.step(g, 1 / 120, { right: true }); const s = g.pupo.sw; if (s.om > 0 && s.th > 0.3) { const e0 = s.e; G.step(g, 1 / 120, { right: true, actionPressed: true }); passed = g.pupo.sw.e !== e0; } }
  C.check('Action at the next hook passes him hand over hand, still swinging', passed && g.pupo.mode === 'swing');
  // let go on the forward swing: flies across the pit
  let let0 = null;
  for (let i = 0; i < 900 && g.pupo.mode === 'swing'; i++) {
    G.step(g, 1 / 120, { right: true }); const s = g.pupo.sw;
    if (s.e.hx < 19 * TS && s.om > 0 && s.th > 0.3) { G.step(g, 1 / 120, { right: true, actionPressed: true }); continue; }
    if (s.e.hx > 19 * TS && s.om > 0 && s.th > 0.15 && s.th < 0.6) { const v = Math.abs(s.om * s.L); G.step(g, 1 / 120, { jumpPressed: true, right: true }); let0 = { v: v / TS, vx: p.vx / TS, vy: p.vy / TS }; } }
  G.step(g, 0.4, { right: true }); G.step(g, 0.8);
  C.check('Jump lets go with the swing\'s speed (x1.15, +3 t/s up) and he flies on across the pit', let0 && g.pupo.mode !== 'swing' && p.vx >= 0 && p.cx > 21 * TS && p.onGround && p.pupoRide, { let0, x: p.cx / TS, ground: p.onGround });
  // a nap in mid-air near a hook: he dangles asleep from it
  const g2 = ride(14); const p2 = g2.player; p2.y = 9.5 * TS; p2.vy = 0; p2.onGround = false; g2.pupo.drowsyT = 3; g2.pupo.shieldT = 0; p2.hurt({ x: p2.x, w: 10 });
  const f = g2.pupo.free;
  C.check('a nap in mid-air: he dangles asleep from the nearest hook within 5 tiles', f && f.hangAt && f.mode === 'sleep', f && f.hangAt);
});

C.section(want, 'zip', () => {
  const g = ride(27), p = g.player;
  G.step(g, 1 / 120, { right: true, actionPressed: true }); G.step(g, 0.25);
  C.check('Action at a post across the gap: the arm grabs it and he zips along it', g.pupo.mode === 'zip', { mode: g.pupo.mode, tg: g.pupo.tg && g.pupo.tg.kind });
  G.step(g, 1.0);
  C.check('...and pulls himself up onto its top and stands there', !g.pupo.mode && p.onGround && near(p.y + p.h, 13 * TS, 2) && near(p.cx, 32.5 * TS, 6), { feet: (p.y + p.h) / TS, x: p.cx / TS });
  G.step(g, 1 / 120, { right: true, actionPressed: true }); G.step(g, 1.2);
  C.check('from post to post', p.onGround && near(p.cx, 36.5 * TS, 6), p.cx / TS);
  G.step(g, 0.1); G.step(g, 0.6, { right: true, jump: true, jumpPressed: true }); G.step(g, 0.5, { right: true });
  C.check('and on over to the far side', p.cx > 39 * TS && p.onGround && p.pupoRide, p.cx / TS);
});

C.section(want, 'climb', () => {
  let g = ride(44), p = g.player;
  G.step(g, 1.0, { right: true });
  C.check('walking into a climb strip: he grips it on his own', g.pupo.mode === 'climb', g.pupo.mode);
  const y0 = p.y; G.step(g, 0.5, { up: true }); const up = (y0 - p.y) / 0.5 / TS;
  C.check(`Up climbs at ${up.toFixed(2)} t/s (3.2)`, near(up, 3.2, 0.25), up);
  G.step(g, 2.5, { up: true });
  C.check('at the top he pulls up onto the wall top and stands there', !g.pupo.mode && p.onGround && near(p.y + p.h, 7 * TS, 2) && p.cx > 48 * TS, { feet: (p.y + p.h) / TS, x: p.cx / TS });
  // leap off
  g = ride(44); p = g.player; G.step(g, 1.0, { right: true }); G.step(g, 0.4, { up: true });
  G.step(g, 1 / 120, { jumpPressed: true }); const lv = [p.vx / TS, p.vy / TS];
  C.check('Jump leaps off away from the strip (6.5 t/s away, 13 t/s up)', !g.pupo.mode && near(lv[0], -6.5, 0.3) && lv[1] < -11, lv);
  // Brady alone does not climb
  const g2 = G.lab('reach'); put(g2, 44, FLOOR); G.step(g2, 0.3); G.step(g2, 1.0, { right: true }); G.step(g2, 0.6, { up: true });
  C.check('Brady alone slides off: the strip is not climbable without Pupo', !g2.player.pupoRide && g2.player.onGround && near(g2.player.y + g2.player.h, FLOOR, 2));
});

C.section(want, 'hang', () => {
  const g = ride(58), p = g.player;
  G.step(g, 0.05, { right: true, jump: true, jumpPressed: true }); G.step(g, 0.6, { right: true, jump: true });
  C.check('jumping into a bar: his head touches it and he hangs upside down from it', g.pupo.mode === 'hang', g.pupo.mode);
  const x0 = p.cx; G.step(g, 1.0, { right: true }); const sh = (p.cx - x0) / TS;
  C.check(`Left / Right shimmies at ${sh.toFixed(2)} t/s (2.6), over the spikes`, near(sh, 2.6, 0.2) && p.pupoRide && !(g.pupo.drowsyT > 0), sh);
  G.step(g, 3.8, { right: true });
  G.step(g, 0.1, { down: true }); G.step(g, 1.0);
  C.check('Down drops him; the bar carried him past the spikes unhurt', !g.pupo.mode && p.onGround && p.cx > 70 * TS && !(g.pupo.drowsyT > 0), { x: p.cx / TS, drowsy: g.pupo.drowsyT });
});

C.section(want, 'ledge', () => {
  const g = ride(120), p = g.player, A = g.area;
  for (let y = 10; y <= 13; y++) for (let x = 124; x <= 127; x++) A.tiles[y * A.W + x] = T.HARD;   // a ledge 4 tiles up
  put(g, 122, FLOOR); G.step(g, 0.3);
  // just short: a jump up and toward it, falling past the lip
  p.vy = -12.5 * TS; p.onGround = false; let caught = false;
  for (let i = 0; i < 120; i++) { G.step(g, 1 / 120, { right: true, jump: true }); if (g.pupo.mode === 'ledge') caught = true; }
  C.check('the ledge catch: near the top of a jump, stick toward a lip within reach: he hauls himself up', caught && p.onGround && near(p.y + p.h, 10 * TS, 2), { caught, feet: (p.y + p.h) / TS });
});

C.section(want, 'pull', () => {
  let g = ride(76), p = g.player, A = g.area;
  G.step(g, 1 / 120, { up: true, right: true, actionPressed: true }); G.step(g, 0.25);
  C.check('Action at a pull handle: the arm grabs it and he tugs', g.pupo.mode === 'pull', g.pupo.mode);
  G.step(g, 0.6);
  C.check('after the tug the lock opens and the arm snaps back', !g.pupo.mode && A.tiles[12 * A.W + 84] === T.EMPTY && g.keys.has('pull:lab'));
  // a toggle-group handle flips the group on each pull
  g = ride(76); A = g.area; const h = g.entities.find(e => e.pupoHandle); h.lock = null; h.once = false; h.g0 = 3;
  A.toggles = A.toggles || {}; A.toggles[3] = { A: [], B: [[90, 5, 92, 5]], switches: [] };
  G.step(g, 1 / 120, { up: true, right: true, actionPressed: true }); G.step(g, 1.2);
  const on1 = g.toggleBit(3) && A.tiles[5 * A.W + 91] !== T.EMPTY;
  G.step(g, 1 / 120, { up: true, right: true, actionPressed: true }); G.step(g, 1.2);
  C.check('a toggle-group handle flips the group (back and forth on each pull)', on1 && !g.toggleBit(3) && A.tiles[5 * A.W + 91] === T.EMPTY, { on1, bit: g.toggleBit(3) });
});

C.section(want, 'tickle', () => {
  const g = ride(89), p = g.player, A = g.area, tk = g.entities.find(e => e.pupoTickle);
  tk.tickle(p, tk.bx + 30, tk.by - 20);
  C.check('a poke away from the belly button does nothing ("...not... there.")', !tk.awake && !(tk.giggle > 0));
  G.step(g, 1 / 120, { right: true, actionPressed: true }); G.step(g, 0.3);
  C.check('a poke in its belly button: it giggles in its sleep', tk.giggle > 0 || tk.awake, { giggle: tk.giggle });
  G.step(g, 1.6);
  C.check('...rolls over and ambles off; the lock opens', tk.remove && A.tiles[12 * A.W + 93] === T.EMPTY);
  // Brady alone only bounces off it
  const g2 = G.lab('reach'), tk2 = g2.entities.find(e => e.pupoTickle); put(g2, 90, FLOOR); G.step(g2, 1.5, { right: true });
  C.check('Brady alone cannot get past (zzz)', !tk2.awake && g2.player.x + g2.player.w <= 93 * TS + 1);
});

C.section(want, 'fetch', () => {
  let g = ride(104), p = g.player, A = g.area;
  G.step(g, 1 / 120, { up: true, actionPressed: true }); G.step(g, 0.8);
  C.check('a key 6 tiles up: fetched (the arm brings it back and it is collected)', g.keys.has('highKey'));
  g = ride(106); A = g.area; g.player.facing = 1;
  G.step(g, 1 / 120, { right: true, actionPressed: true }); G.step(g, 0.8);
  C.check('a key behind a grille: the arm reaches through the bars', g.keys.has('grilleKey'));
  g = ride(106); A = g.area; A.pupoGrilles.length = 0; const tg = PR.scan(g.player, g, g.pupo, { right: true });
  C.check('...and without the grille the wall hides it', tg.kind !== 'key');
  // the snatch: a key on a path, fetched when it passes in reach
  g = ride(127); const sn = g.entities.find(e => e.pupoSnatch); let got = false;
  for (let i = 0; i < 8 * 60 && !got; i++) { G.step(g, 1 / 60); const t2 = PR.scan(g.player, g, g.pupo, { up: true }); if (t2.kind === 'snatch' && g.pupo.arm.phase === 0) { G.step(g, 1 / 120, { up: true, actionPressed: true }); G.step(g, 0.6); got = g.keys.has('snatchKey'); } }
  C.check('a snatch key travelling on its path is fetched as it passes', got && sn.remove);
  // coins: fetched only when nothing else is in reach
  g = ride(118); A = g.area; A.tiles[10 * A.W + 118] = T.PICK; const n0 = g.picks;
  G.step(g, 1 / 120, { up: true, actionPressed: true }); G.step(g, 0.6);
  C.check('a coin within reach is fetched', A.tiles[10 * A.W + 118] === T.EMPTY && g.picks > n0, { picks: g.picks - n0 });
  // an item on the floor
  g = ride(124); const TI = G.run('TourItem'); const it = new TI(g, 127 * TS, FLOOR - 24, 'oneup'); it.emerge = 0; it.speedX = 0; it.hoverY = it.y; g.spawn(it); const l0 = G.run('Save.data.lives');
  G.step(g, 1 / 120, { right: true, actionPressed: true }); G.step(g, 0.6);
  C.check('a pickup is fetched and collected as if Brady had touched it', it.remove && G.run('Save.data.lives') === l0 + 1);
});

C.section(want, 'draw', () => {
  const g = ride(24), p = g.player, ctx = G.run("document.createElement('canvas').getContext('2d')"), Ink = G.run('Ink');
  let n = 0; const a0 = Ink.around; Ink.around = function () { n++; return a0.apply(this, arguments); };
  let err = null; const draw = () => { try { g.draw(ctx); } catch (e) { err = err || String(e.stack).slice(0, 400); } };
  g.entities.filter(e => e.enemy).forEach(e => { e.remove = true; }); G.step(g, 0.1);
  n = 0; p.draw(ctx, g.t); const idle = n;
  G.step(g, 1 / 120, { left: true, actionPressed: true }); G.step(g, 0.05);
  n = 0; p.draw(ctx, g.t); const out = n;
  Ink.around = a0;
  C.check('the stretched arm is drawn outside the ink pass (no extra Ink.around)', g.pupo.arm.phase !== 0 && out === idle, { idle, out });
  draw();
  const g2 = ride(8); G.step(g2, 1 / 120, { up: true, right: true, actionPressed: true }); G.step(g2, 0.4); try { g2.draw(ctx); } catch (e) { err = err || String(e.stack).slice(0, 400); }
  const g3 = ride(44); G.step(g3, 1.0, { right: true }); G.step(g3, 0.3, { up: true }); try { g3.draw(ctx); } catch (e) { err = err || String(e.stack).slice(0, 400); }
  const g4 = ride(58); G.step(g4, 0.05, { right: true, jump: true, jumpPressed: true }); G.step(g4, 0.6, { right: true, jump: true }); try { g4.draw(ctx); } catch (e) { err = err || String(e.stack).slice(0, 400); }
  C.check('swinging, climbing, hanging and the marker draw without errors; the button shows the verb', !err && G.run('PupoArms').actionArt(ctx, { r: 30 }) === true, err);
});

C.done();
