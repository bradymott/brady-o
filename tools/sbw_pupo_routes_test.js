// Pupo's route scripts (tools/pupo_routes.js) played in Node: the real game modules in a VM (tools/sbw_pupo_lib.js),
// each shipped Pupo obstacle and Pupo-only bonus ridden through at the game's fixed 1/120 s step. Plus the checks of the
// P2-G1 rollout's own additions (src/28_tour_pe_g1.js: the snatch's look, its door, its hint; the cousins and the bats)
// and of P2-G2's (src/28_tour_pf_g2.js: bars that need a toggle state, the soaped pole, the hidden thief, the poke key).
// usage: node tools/sbw_pupo_routes_test.js [route name prefix or level id ...]
const { boot, checker } = require('./sbw_pupo_lib');
const { ROUTES, RUNNER_SRC } = require('./pupo_routes');
const G = boot(), C = checker(), want = process.argv.slice(2);
G.run(RUNNER_SRC);
const R = G.run('__pupoRoute');

for (const route of ROUTES) {
  if (want.length && !want.some(w => route.name.startsWith(w) || route.level === w)) continue;
  console.log('== ' + route.name);
  let res;
  try {
    R.start(route);
    let first = null;
    for (let k = 0; k < 50; k++) { res = R.go(); if (res.shot && first == null && !res.shot.startsWith("box-")) first = R.riding; if (res.done) break; }
    if (first != null && route.start.box && !route.steps.some(s => s.put)) console.log(`     riding from Nap Box ${route.start.box} to the obstacle: ${first.toFixed(1)} s (a bot at full lope; PUPO.md §4.2 asks for 15 s)`);
  } catch (e) { C.check(route.name + ' runs', false, String(e.stack).slice(0, 600)); continue; }
  for (const p of res.passes) C.check(route.name + ': ' + p, true);
  for (const f of res.fails) C.check(route.name + ': ' + f, false);
  C.check(`${route.name}: the route ends (${res.info.t} s, ${res.info.riding} s riding)`, res.done && res.ok, res.info);
}

// the rollout's small engine additions
if (!want.length || want.includes('g1')) C.section([], 'g1', () => {
  const g = G.run('(l => { Save.data.lives = 9; const g = new Play(l, {}); Game.scene = g; g.state = "play"; g.fade.a = 0; g.fade.target = 0; g.timeLeft = 999; return g; })')(G.getLevel(2, 4));
  G.step(g, 0.2);
  const pod = g.entities.find(e => e.pupoSnatch), door = g.entities.find(e => e.shutter && e.id === 'goldpod'), belt = g.entities.find(e => e.constructor.name === 'EcPodBelt');
  C.check('2-4: the golden pod is a pupoSnatch with its own look, and the belt finds it', !!pod && pod.s.look === 'ecGoldenPod' && !!door && !!belt && belt.gold === pod);
  // Brady alone touching it: a hint, no key
  const p = g.player; p.x = pod.x; p.y = pod.y; p.vx = p.vy = 0; const said = []; const t0 = g.parts.text.bind(g.parts); g.parts.text = (x, y, s, c) => { said.push(s); return t0(x, y, s, c); };
  G.step(g, 1 / 120); C.check('Brady alone touching the pod gets the hint, not the key', said.some(s => /PUPO/.test(s)) && !g.keys.has('goldpod'), said);
  // Pupo's arm brings it in: the key, the door rolls up, the toast
  let toast = null; const to0 = g.toast.bind(g); g.toast = s => { toast = s; return to0(s); };
  pod.give(p); G.step(g, 0.5);
  C.check('the pod brought in: the key, the cold-store door opens at once, the toast names it', g.keys.has('goldpod') && door.open && /GOLDEN POD/.test(toast || ''), { open: door.open, toast });
  // the belt's pods follow the snatch's own path and clock
  const b2 = G.run('(l => { const g = new Play(l, {}); Game.scene = g; return g; })')(G.getLevel(2, 4)), bb = b2.entities.find(e => e.constructor.name === 'EcPodBelt'), pp = b2.entities.find(e => e.pupoSnatch);
  let worst = 0; for (let k = 0; k < 40; k++) { b2.t = k * 0.37; pp.place(); bb.at(b2.t / bb.period); worst = Math.max(worst, Math.hypot(bb.px - pp.cx, bb.py - pp.cy)); }
  C.check(`the belt's pod slots ride the golden pod's own path (worst ${worst.toFixed(2)} px)`, worst < 0.5, worst);
});
// the P2-G2 rollout's own additions (src/28_tour_pf_g2.js and the Morocco, Spain and France objects built on them)
if (!want.length || want.includes('g2')) C.section([], 'g2', () => {
  const play = G.run('(l => { Save.data.lives = 9; const g = new Play(l, {}); Game.scene = g; g.state = "play"; g.fade.a = 0; g.fade.target = 0; g.timeLeft = 999; return g; })');
  const said = g => { const out = []; const t0 = g.parts.text.bind(g.parts); g.parts.text = (x, y, s, c) => { out.push(String(s)); return t0(x, y, s, c); }; return out; };
  const at = (g, tx, feet) => { const p = g.player; p.x = tx * 32 + 16 - p.w / 2; p.y = feet * 32 - p.h; p.vx = p.vy = 0; };
  // 5-3: the washing line is hung out by day only; night falls on Pupo hanging from it and he drops
  {
    const g = play(G.getLevel(5, 3)); G.step(g, 0.2); const bar = g.entities.find(e => e.pupoBar && e.s.need);
    C.check('5-3: the washing line is a bar that needs the day', !!bar && bar.s.need.on === false);
    G.step(g, 0.1); const day = bar.up; g.flipToggle(0); G.step(g, 0.1);
    C.check('5-3: up by day, gone by night (not grabbable)', day === true && bar.up === false && bar.cool > 0, { day, up: bar.up, cool: bar.cool });
    g.flipToggle(0); G.step(g, 0.2);
    const p = g.player, R = G.run('PupoRide'); R.mount(p, true); at(g, Math.floor(bar.x / 32) + 2, Math.floor(bar.y / 32) + 4); R.enter(g, p, 'hang', bar); G.step(g, 0.1);
    const was = g.pupo.mode, out = said(g); g.flipToggle(0); G.step(g, 0.2);
    C.check('5-3: night falls on Pupo hanging from the line: he drops, "...oh. night."', was === 'hang' && g.pupo.mode !== 'hang' && out.some(s => /NIGHT/.test(s)), { was, now: g.pupo.mode, out });
  }
  // 6-7: the Giant's sail is grabbable only with the wind off, and its sails stop with one arm flat
  {
    const g = play(G.getLevel(6, 7)); G.step(g, 0.2); const bar = g.entities.find(e => e.pupoBar && e.s.need), brake = g.entities.find(e => e.constructor.name === 'EsSailBrake');
    G.step(g, 0.1); const windy = bar.up; g.flipToggle(0); G.step(g, 2.5);
    const a = brake && brake.d ? brake.d.a : NaN, q = Math.PI / 2, flat = Math.abs(a - Math.round(a / q) * q) < 0.01;
    C.check('6-7: the sail bar is out of reach while the wind blows, up when it drops', windy === false && bar.up === true, { windy, up: bar.up });
    C.check('6-7: with the wind off the Giant\'s sails ease to a stop, one sail flat out', !!brake && flat, { a });
  }
  // 6-1: the soaped pole and the ham
  {
    const g = play(G.getLevel(6, 1)); G.step(g, 0.2); const pole = g.entities.find(e => e.pupoClimb), ham = g.entities.find(e => e.pupoSnatch), gate = g.entities.find(e => e.shutter && e.id === 'ham');
    C.check('6-1: the soaped pole, the ham (a snatch with its own look) and plaza three\'s gate', !!pole && !!ham && ham.s.look === 'esHam' && !!gate && !gate.open);
    const p = g.player, out = said(g); p.x = pole.cx - p.w / 2; p.y = pole.bottom - p.h - 40; p.vx = p.vy = 0; G.step(g, 1 / 120);
    C.check('6-1: Brady alone on the pole gets "TOO SOAPY!" and slides', out.some(s => /SOAPY/.test(s)) && !p.pupoRide && !(g.pupo && g.pupo.mode === 'climb'), out);
    p.x = ham.x; p.y = ham.y; p.vx = p.vy = 0; G.step(g, 1 / 120);
    C.check('6-1: Brady alone touching the ham: a hint, never the ham', out.some(s => /PUPO/.test(s)) && !g.keys.has('ham'), out);
    ham.give(p); G.step(g, 0.5);
    C.check('6-1: the ham brought in by the arm: the key, plaza three\'s gate rolls up', g.keys.has('ham') && gate.open);
  }
  // 7-2: the dovecote hides the magpie until Pupo pokes the right hole
  {
    const g = play(G.getLevel(7, 2)); G.step(g, 0.2);
    const th = g.entities.find(e => e.catchIt && e.route), dv = g.entities.find(e => e.constructor.name === 'FrDovecote'), r = th.route[2];
    th.caught = 2; th.stop = 3; th.cool = 0; th.hop = null; th.state = 'wait'; th.x = r.x - th.w / 2; th.y = r.y - th.h;
    at(g, Math.floor(dv.x / 32) - 2, Math.floor(dv.y / 32) + 7); G.step(g, 0.3);
    C.check('7-2: the magpie on the dovecote\'s roof dives in and hides', dv.dove && th.dove);
    C.check('7-2: hidden, it can\'t be kazooed or hit', th.hit('kazoo') === false && th.hit('plane') === false && th.caught === 2);
    const p = g.player; p.x = th.x; p.y = th.y - p.h + 4; p.vy = 300; p.prevBottom = p.y + p.h - 6; th.collidePlayer(p);
    C.check('7-2: hidden, it can\'t be stomped', th.caught === 2);
    let k = 0; while (!dv.peeking && k++ < 600) G.step(g, 1 / 120);
    const out = said(g), h = dv.cur, other = dv.holes.find(q => q !== h);
    dv.tickle(p, other.x, other.y);
    C.check('7-2: a poke into an empty hole: "...not... there.", no stamp', out.some(s => /NOT/.test(s)) && th.caught === 2 && !g.keys.has('stamp3'), out);
    dv.tickle(p, dv.bx, dv.by); G.step(g, 0.5);
    C.check('7-2: a poke where it peeks: stamp 3, the gate\'s shutter opens, it flies off', th.caught === 3 && g.keys.has('stamp3') && g.entities.some(e => e.shutter && e.id === 'stamp3' && e.open) && !th.dove);
    C.check('7-2: the poke key: the level checker holds stamp 3 only riding (a vkey on the riding copy, none on the level)', (() => {
      const L = G.getLevel(7, 2), PV = G.run('PupoVal'), D = PV.derive(L);
      return !L.areas[0].vkeys.some(v => v.id === 'stamp3') && D.areas[0].vkeys.some(v => v.id === 'stamp3' && v.tiles.length > 0);
    })());
  }
  // 5-4: the downdraft over the beam-end ladder: Brady alone can't jump up it
  {
    const g = play(G.getLevel(5, 4)); G.step(g, 0.2); const z = g.area.zones.find(q => q.kind === 'downdraft'), post = g.entities.find(e => e.pupoGrabPt && e.kind === 'post');
    C.check('5-4: a downdraft over the tower\'s face, beam ends to zip to', !!z && z.fy > 0 && !!post);
    const p = g.player; at(g, Math.floor(post.hx / 32) - 1, Math.floor(z.y / 32) + Math.round(z.h / 32)); G.step(g, 0.3);
    const y0 = p.y; let top = p.y; G.step(g, 1 / 120, { jump: true, jumpPressed: true }); for (let k = 0; k < 60; k++) { G.step(g, 1 / 120, { jump: true }); top = Math.min(top, p.y); }
    C.check(`5-4: a jump in the downdraft rises ${((y0 - top) / 32).toFixed(2)} tiles (less than one)`, y0 - top < 32, { rise: (y0 - top) / 32 });
    // the jump powers Brady may carry in: a spring sock's second jump, six puffs of magic beans
    for (const id of ['socks', 'beans']) {
      at(g, Math.floor(post.hx / 32) - 1, Math.floor(z.y / 32) + Math.round(z.h / 32)); G.step(g, 0.3);
      p.jumpPow = { id, gas: 1, used: false, pants: 0 }; const b0 = p.y; let hi = p.y;
      G.step(g, 1 / 120, { jump: true, jumpPressed: true });
      for (let k = 0; k < 150; k++) { G.step(g, 1 / 120, k % 12 === 6 ? { jump: true, jumpPressed: true } : { jump: true }); hi = Math.min(hi, p.y); }
      C.check(`5-4: with ${id} in the downdraft Brady rises ${((b0 - hi) / 32).toFixed(2)} tiles (the first beam end is two up)`, b0 - hi < 1.5 * 32, { rise: (b0 - hi) / 32 });
      p.jumpPow = null;
    }
  }
});
// ---- the P2-G3 rollout's checks (owner: the P2-G3 group): the Netherlands, Indonesia and Vietnam objects, and the
// camera box of src/28_tour_pg_g3.js. Brady alone (plain, a spring sock, magic beans) never gets past a Pupo obstacle.
if (!want.length || want.includes('g3')) C.section([], 'g3', () => {
  const play = G.run('(l => { Save.data.lives = 9; const g = new Play(l, {}); Game.scene = g; g.state = "play"; g.fade.a = 0; g.fade.target = 0; g.timeLeft = 999; return g; })');
  const said = g => { const out = []; const t0 = g.parts.text.bind(g.parts); g.parts.text = (x, y, s, c) => { out.push(String(s)); return t0(x, y, s, c); }; return out; };
  const at = (g, tx, feet) => { const p = g.player; p.x = tx * 32 + 16 - p.w / 2; p.y = feet * 32 - p.h; p.vx = p.vy = 0; p.dead = false; };
  // Brady alone runs from column tx0 (feet on row feet) to the edge at column edge and jumps right, with power `pow`
  // (null, 'socks', 'beans'); true if he ever stands at or past column far
  const leap = (g, tx0, feet, edge, far, pow) => {
    at(g, tx0, feet); G.step(g, 0.3); const p = g.player; p.invuln = 99;
    p.jumpPow = pow ? { id: pow, gas: 1, used: false, pants: 0 } : null;
    let jumped = false, k = 0, past = false;
    for (let f = 0; f < 600; f++) {
      const q = g.player; if (q !== p || q.dead) break;
      const inp = { right: true, jump: true };
      if (!jumped && q.cx >= (edge + 0.2) * 32) { inp.jumpPressed = true; jumped = true; k = 0; }
      else if (jumped && pow === 'socks' && ++k === 30) inp.jumpPressed = true;
      else if (jumped && pow === 'beans' && ++k % 14 === 0) inp.jumpPressed = true;
      G.step(g, 1 / 120, inp);
      if (q.onGround && q.cx >= far * 32) past = true;
    }
    p.jumpPow = null; return past;
  };
  // 8-1: the drawbridge chain
  {
    const g = play(G.getLevel(8, 1)); G.step(g, 0.2);
    const h = g.entities.find(e => e.pupoHandle && e.s.look === 'nlBridgeChain'), gates = g.entities.filter(e => e.s && e.s.look === 'nlDrawbridge'), herons = g.entities.filter(e => e.constructor.name === 'NlHeron');
    C.check('8-1: the pull chain, two drawbridge leaves and two herons', !!h && gates.length === 2 && herons.length === 2);
    const c0 = gates[0].s.rect[0], d = gates[0].s.rect[1], c1 = gates[1].s.rect[2], A = g.area, T = G.run('T');
    C.check('8-1: the deck is not there until the chain is pulled', A.tiles[d * A.W + c0 + 3] === T.EMPTY && !g.toggleBit(3));
    for (const pow of [null, 'socks', 'beans']) C.check(`8-1: Brady alone (${pow || 'a plain jump'}) never gets over the canal in the sea wind`, !leap(g, c0 - 5, d, c0 - 1, c1 + 1, pow));
    // in the canal: the current carries him back, at high water (swimming) and at low water (on the bed)
    for (const high of [true, false]) {
      if (g.toggleBit(1) !== high) { g.flipToggle(1); G.step(g, 4); }
      const feet = high ? d + 3 : d + 8; at(g, c0 + 4, feet); g.player.invuln = 99; const x0 = g.player.cx; let maxX = x0;
      for (let f = 0; f < 360; f++) { G.step(g, 1 / 120, { right: true, jump: f % 30 === 0, jumpPressed: f % 30 === 0 }); maxX = Math.max(maxX, g.player.cx); }
      C.check(`8-1: in the canal at ${high ? 'high water (swimming)' : 'low water (on the bed)'} the current carries Brady back (from column ${(x0 / 32).toFixed(1)} to ${(g.player.cx / 32).toFixed(1)}, never past ${(maxX / 32).toFixed(1)})`, g.player.cx < x0 && maxX < (c0 + 6) * 32);
    }
    const out = said(g), p = g.player; h.pull(g, p); G.step(g, 0.3);
    C.check('8-1: the chain pulled: the deck is down (one-way, hidden under the drawn leaves), the herons squawk', g.toggleBit(3) && A.tiles[d * A.W + c0 + 3] === T.SEMI && A.hide[d * A.W + c0 + 3] === 1 && out.some(s => /KRAAK/.test(s)));
    at(g, c0 - 2, d); g.player.invuln = 99; G.step(g, 3, { right: true });
    C.check('8-1: on the deck the wind leaves Brady be: he walks across to the far dike', g.player.cx >= (c1 + 1) * 32 && g.player.onGround, g.player.cx / 32);
    h.pull(g, p); G.step(g, 0.3);
    C.check('8-1: pulled again, the drawbridge lifts', !g.toggleBit(3) && A.tiles[d * A.W + c0 + 3] === T.EMPTY);
  }
  // 8-6: the old mill's sail is slick for Brady alone
  {
    const g = play(G.getLevel(8, 6)); G.step(g, 0.2); const pole = g.entities.find(e => e.pupoClimb && e.s.look === 'nlSailLattice'), out = said(g);
    const p = g.player; p.x = pole.cx - p.w / 2; p.y = pole.bottom - p.h - 40; p.vx = p.vy = 0; G.step(g, 1 / 120);
    C.check('8-6: Brady alone on the lattice sail: "THE SAIL IS SLIPPERY!", no climbing', !!pole && out.some(s => /SLIPPERY/.test(s)) && !(g.pupo && g.pupo.mode === 'climb'), out);
  }
  // 9-6: thorny rattan
  {
    const g = play(G.getLevel(9, 6)); G.step(g, 0.2);
    const hooks = g.entities.filter(e => e.pupoGrabPt && e.s.look === 'idRattan').sort((a, b) => a.hx - b.hx), A = g.area, T = G.run('T');
    const spiky = hooks.every(e => { const tx = Math.floor(e.hx / 32), ty = Math.floor(e.hy / 32); return A.tiles[(ty - 1) * A.W + tx] === T.SPIKES_CEIL; });
    C.check('9-6: five rattan hooks, each at the tip of a cane of spike tiles', hooks.length === 5 && spiky);
    const x0 = Math.floor(hooks[0].hx / 32) - 2, gy = Math.floor(hooks[0].hy / 32) + 5, far = Math.floor(hooks[4].hx / 32) + 3;
    for (const pow of [null, 'socks', 'beans']) C.check(`9-6: Brady alone (${pow || 'a plain jump'}) never gets over the ravine in its wind`, !leap(g, x0 - 4, gy, x0 - 1, far, pow));
    // a cane hurts Brady
    const p = g.player, cane = hooks[1]; p.x = cane.hx + 16 - 1; p.y = cane.hy - 32 - p.h + 20; p.vx = p.vy = 0;
    C.check('9-6: Brady touching a rattan cane is touching spikes', G.run('spikeContact')(p, A));
    const mum = g.entities.find(e => e.constructor.name === 'IdMotherOrangutan');
    C.check('9-6: the mother orangutan waits past the ravine', !!mum && mum.cx > far * 32 - 64);
  }
  // 10-4: the cave pearl, and the camera box over the chamber
  {
    const g = play(G.getLevel(10, 4)); G.step(g, 0.2);
    const pearl = g.entities.find(e => e.pupoSnatch && e.s.look === 'vnPearl'), gate = g.entities.find(e => e.shutter && e.id === 'pearl'), gr = g.entities.find(e => e.pupoGrille);
    C.check('10-4: the pearl (a snatch key) behind a grille, the skylight gate shut', !!pearl && !!gr && !!gate && !gate.open);
    const A = g.area, SOL = G.run('SOLID'), tx = Math.floor(pearl.cx / 32), ty = Math.floor(pearl.cy / 32);
    let walled = true; for (let y = ty - 3; y <= ty + 1; y++) for (let x = 0; x <= 5; x++) { const inside = x >= 1 && x <= 4 && y >= ty - 2 && y <= ty; if (!inside && !SOL[A.tiles[y * A.W + x]]) walled = false; }
    C.check('10-4: the pool is walled in (rock, the floor, the grille): Brady alone never touches the pearl', walled);
    const C0 = gr.s.camBox[4] + 1, F = C0 + 4, VH = G.run('Game.viewH');
    at(g, 8, F); G.step(g, 1.5);
    const top = (C0 - 1) * 32 - g.camY;
    C.check(`10-4: the camera keeps the rock shelf on screen over the chamber (the shelf ${Math.round(top)} px down a ${Math.round(VH)} px view)`, top >= VH * 0.2 && top <= VH * 0.5, { top, camY: g.camY });
    const p = g.player; pearl.give(p); G.step(g, 0.5);
    C.check('10-4: the pearl brought in: the key, the skylight gate opens', g.keys.has('pearl') && gate.open);
  }
  // 10-6: the rain over the lantern lane: no sock jump gets onto the teahouse roof
  {
    const g = play(G.getLevel(10, 6)); G.step(g, 0.2);
    const kenh = g.level.areas.findIndex(a => a.aid === 'kenh'); g.loadArea ? g.loadArea(kenh, 'in') : null; G.step(g, 0.3);
    const hooks = g.entities.filter(e => e.pupoGrabPt && e.s.look === 'vnLanternHook').sort((a, b) => a.hx - b.hx);
    C.check('10-6: six lantern hooks over the canal lane', hooks.length === 6, hooks.length);
    if (hooks.length === 6) {
      const roofRow = Math.floor(hooks[0].hy / 32) + 5, r0 = Math.floor(hooks[5].hx / 32) - 1, gy = roofRow + 5;
      let onRoof = false;
      for (const sx of [r0 - 3, r0 + 9, r0 + 10]) for (const dir of [-1, 1]) {
        at(g, sx, gy); G.step(g, 0.2); const p = g.player; p.invuln = 99; p.jumpPow = { id: 'socks', gas: 1, used: false, pants: 0 };
        for (let f = 0; f < 240; f++) { const inp = { right: dir > 0, left: dir < 0, jump: true }; if (f === 2 || f === 50) inp.jumpPressed = true; G.step(g, 1 / 120, inp); if (g.player.onGround && g.player.y + g.player.h <= roofRow * 32 + 2 && g.player.cx > r0 * 32 && g.player.cx < (r0 + 7) * 32) onRoof = true; }
        p.jumpPow = null;
      }
      C.check('10-6: in the rain a spring sock\'s double jump from the lane never lands on the teahouse roof', !onRoof);
      // and from the lantern seller's roof straight across
      const nearEdge = Math.floor(hooks[0].hx / 32) - 2;
      C.check('10-6: Brady alone (a spring sock) never gets across from the lantern seller\'s roof', !leap(g, nearEdge - 3, roofRow, nearEdge, r0, 'socks'));
    }
  }
});
C.done();
