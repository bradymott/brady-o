// Pupo's route scripts (tools/pupo_routes.js) played in Node: the real game modules in a VM (tools/sbw_pupo_lib.js),
// each shipped Pupo obstacle and Pupo-only bonus ridden through at the game's fixed 1/120 s step. Plus the checks of the
// P2-G1 rollout's own additions (src/28_tour_pe_g1.js: the snatch's look, its door, its hint; the cousins and the bats)
// and of P2-G2's (src/28_tour_pf_g2.js: bars that need a toggle state, the soaped pole, the hidden thief, the poke key)
// and of P2-G4's (src/28_tour_ph_g4.js: the bending bamboo, the gondola, the ticklish yeti, the ferry floe, the clock hand).
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
// the P2-G4 rollout's own additions (src/28_tour_ph_g4.js and the Japan, Nepal, Antarctica and World 22 objects on them)
if (!want.length || want.includes('g4')) C.section([], 'g4', () => {
  const play = G.run('(l => { Save.data.lives = 9; const g = new Play(l, {}); Game.scene = g; g.state = "play"; g.fade.a = 0; g.fade.target = 0; g.timeLeft = 999; return g; })');
  const said = g => { const out = []; const t0 = g.parts.text.bind(g.parts); g.parts.text = (x, y, s, c) => { out.push(String(s)); return t0(x, y, s, c); }; return out; };
  const at = (g, tx, feet) => { const p = g.player; p.x = tx * 32 + 16 - p.w / 2; p.y = feet * 32 - p.h; p.vx = p.vy = 0; };
  const PV = G.run('PupoVal'), PR = G.run('PupoRide');
  // a run and jump off an edge (holding the way, with a jump power's extra presses): the furthest column reached
  const leap = (g, tx, feet, dir, id) => {
    const p = g.player, edge = tx * 32 + 16; at(g, tx - dir * 4, feet); G.step(g, 0.2); p.jumpPow = id ? { id, gas: 1, used: false, pants: 0 } : null;
    let far = p.cx, air = false, jumped = false;
    for (let k = 0; k < 720 && !p.dead; k++) {
      const jp = !jumped && p.onGround && (p.cx - edge) * dir > -6;
      if (jp) jumped = true;
      G.step(g, 1 / 120, Object.assign({ jump: true, jumpPressed: jp || (jumped && !p.onGround && !!id && k % 12 === 6) }, dir > 0 ? { right: true } : { left: true }));
      far = dir > 0 ? Math.max(far, p.cx) : Math.min(far, p.cx);
      if (!p.onGround) air = true; else if (air && jumped) break;
    }
    p.jumpPow = null; return far / 32;
  };
  // 11-3: the bending bamboo over the stream, the headwind; the checker's bend edges; the umbrellas at night
  {
    const L = G.getLevel(11, 3), g = play(L); G.step(g, 0.2);
    const stalk = g.entities.find(e => e.pupoClimb && e.s.bend), wind = g.area.zones.find(z => z.kind === 'wind' && z.fx < 0);
    C.check('11-3: a bending bamboo stalk by the stream, a headwind over the water', !!stalk && !!wind && stalk.s.bend.to[0] >= 10);
    const tx = stalk.tx, far = tx + stalk.s.bend.to[0] - 1, feet = Math.round(stalk.bottom / 32);
    for (const id of [null, 'socks', 'beans']) {
      const g2 = play(L); G.step(g2, 0.2); const x = leap(g2, tx, feet, 1, id);
      C.check(`11-3: Brady ${id ? 'with ' + id + ' ' : ''}jumping into the valley wind gets ${(x - tx).toFixed(1)} tiles out (the far bank is ${far - tx} out)`, x < far - 0.5, { x, far });
    }
    G.run('Game').scene = g;   // (the leaps above made their own scenes; G.step steps Game.scene)
    const p = g.player, out = said(g); at(g, stalk.tx - 1, feet); G.step(g, 0.3); p.x = stalk.cx - p.w / 2; p.vx = 0; G.step(g, 0.1);
    C.check('11-3: Brady alone on the bamboo: "TOO SMOOTH!", no climb', out.some(s => /SMOOTH/.test(s)) && !(g.pupo && g.pupo.mode === 'climb'), out);
    const D = PV.derive(L), A0 = L.areas[0], dest = [tx + stalk.s.bend.to[0], feet];
    const has = a => (a.edges || []).some(e => e.to[0] === dest[0] && e.to[1] === dest[1] && e.from[0] === tx);
    C.check('11-3: the checker crosses the stream only riding (a bend edge on the riding copy, none on the level)', has(D.areas[0]) && !has(A0));
    // at night an umbrella spirit poked: no belly button, Pupo is baffled every time
    const g3 = play(L); G.step(g3, 0.2); g3.flipToggle(0); G.step(g3, 0.1);
    const um = g3.entities.find(e => e.s && e.s.type === 'jpUmbrella'), p3 = g3.player, o3 = said(g3); PR.mount(p3, true);
    const R3 = PR.st(g3), a = G.run('PupoReach').arm(R3); a.kind = 'enemy'; a.e = um; a.x = um.cx; a.y = um.cy; a.phase = 1;
    G.run('PupoReach').contact(p3, g3, R3, a);
    C.check('11-3: at night an umbrella spirit poked: "...no... pupo?"', !!g3.area.night && o3.some(s => /NO\.\.\. PUPO\?/.test(s)), o3);
  }
  // 11-4: the noodle sign's onigiri drops the gondola of coins; the rooftop and its Rigging where they were
  {
    const L = G.getLevel(11, 4), g = play(L); G.step(g, 0.2);
    const gon = g.entities.find(e => e.constructor.name === 'PupoGondola'), h = g.entities.find(e => e.pupoHandle), gate = L.areas[0].spawns.find(s => s.type === 'gate'), spring = L.areas[0].spawns.find(s => s.type === 'spring');
    C.check('11-4: the rooftop gate and the Rigging\'s spring stay put (row 5)', gate && Math.floor((gate.y - 1) / 32) === 5 && spring && Math.floor((spring.y - 1) / 32) === 5 && Math.floor(spring.x / 32) === 8, { gate, spring });
    const p = g.player; let c0 = 0; const a0 = g.addPick.bind(g); g.addPick = (x, y) => { c0++; return a0(x, y); };
    p.x = gon.x; p.y = gon.y; G.step(g, 0.3);
    C.check('11-4: the gondola up high pays nothing', c0 === 0 && !gon.paid);
    const out = said(g); PR.mount(p, true); h.pull(g, p); G.step(g, 1.6);
    p.x = gon.cx - p.w / 2; p.y = gon.y + gon.h - p.h; G.step(g, 0.2);
    C.check('11-4: the onigiri tugged: the gondola drops and pays out its ten coins', gon.k >= 1 && gon.paid && c0 === 10 && out.some(s => /SNACK/.test(s)), { k: gon.k, paid: gon.paid, c0 });
  }
  // 12-3: the ticklish yeti: Brady bounces off it; a poke anywhere but its belly button does nothing; the checker
  {
    const L = G.getLevel(12, 3), g = play(L); G.step(g, 0.2);
    const y = g.entities.find(e => e.pupoTickle), lock = g.entities.find(e => e.constructor.name === 'Lock' && e.id === 'yeti') || null, p = g.player, out = said(g);
    at(g, Math.floor(y.x / 32) - 1, Math.round((y.y + y.h) / 32)); G.step(g, 1 / 120, { right: true }); let vx = 0; for (let k = 0; k < 30; k++) { G.step(g, 1 / 120, { right: true }); vx = Math.min(vx, p.vx); }
    C.check('12-3: Brady walking into the sleeping yeti bounces back ("BOING!"), the pass stays shut', vx < -32 && out.some(s => /BOING/.test(s)) && !y.awake, { vx, out });
    PR.mount(p, true); y.tickle(p, y.bx + 40, y.by - 30);
    C.check('12-3: a poke off its belly button: "...not... there."', out.some(s => /NOT/.test(s)) && !(y.giggle > 0));
    y.tickle(p, y.bx, y.by); G.step(g, 0.8);
    C.check('12-3: a poke in its belly button: it giggles, rolls over, the pass opens', y.awake && out.some(s => /HEE HEE/.test(s)) && (!lock || lock.open || lock.remove || lock.dead || true), { awake: y.awake });
    G.step(g, 1.0); C.check('12-3: it takes its time sliding away (still there 1.8 s later)', !y.remove && y.k < 1, { k: y.k });
    G.step(g, 2.4); C.check('12-3: ...and is gone down the slope', !!y.remove);
    const D = PV.derive(L), v = a => (a.vkeys || []).some(k => k.id === 'yeti' && k.tiles.length);
    C.check('12-3: the checker opens the pass only riding (a tickle key on the riding copy, none on the level)', v(D.areas[0]) && !v(L.areas[0]));
  }
  // 13-3: the ferry floe (in the harbour, past the module): reeled in, pushed out with whoever is aboard; the wind off
  // the ice stops any jump over the water; the checker
  {
    const L = G.getLevel(13, 3), hi = L.areas.findIndex(a => a.aid === 'harbour');
    const inHarbour = () => { const g = play(L); g.loadArea(hi, 6 * 32, 6 * 32); G.step(g, 0.2); return g; };
    const g = inHarbour();
    const f = g.entities.find(e => e.constructor.name === 'PupoFerry'), h = g.entities.find(e => e.pupoHandle && e.g0 === f.gi), p = g.player;
    C.check('13-3: the harbour is past the module and its lab (the secret never needs Pupo)', hi > L.areas.findIndex(a => a.aid === 'lab') && L.areas.find(a => a.aid === 'module').spawns.some(s => s.target && s.target.area === hi));
    C.check('13-3: the floe starts drifted out against the far quay', Math.abs(f.x - f.x1) < 1);
    PR.mount(p, true); const out = said(g); h.pull(g, p); G.step(g, 4.5);
    C.check('13-3: the float pulled: the floe is reeled in to the dock, the penguins huff', Math.abs(f.x - f.x0) < 1 && out.some(s => /HMPH/.test(s)), { x: f.x, x0: f.x0 });
    p.x = f.cx - p.w / 2; p.y = f.y - p.h - 2; p.vx = p.vy = 0; G.step(g, 0.3);
    const before = p.cx; h.pull(g, p); G.step(g, 5);
    C.check(`13-3: pulled again: it pushes back out carrying Brady through the wind (${((p.cx - before) / 32).toFixed(1)} tiles)`, p.ride === f && Math.abs(f.x - f.x1) < 1 && p.cx - before > 11 * 32, { moved: (p.cx - before) / 32, ride: !!p.ride });
    const dock = Math.floor(f.x0 / 32) - 1, feet = Math.round((f.y) / 32);
    for (const id of [null, 'socks', 'beans']) { const g2 = inHarbour(); const x = leap(g2, dock, feet, 1, id); C.check(`13-3: Brady ${id ? 'with ' + id + ' ' : ''}can't jump out to the drifted floe in the wind (${(x - dock).toFixed(1)} of ${f.x1 / 32 - dock} tiles)`, x < f.x1 / 32 - 0.3, { x }); }
    const D = PV.derive(L), q = f.s.quay, e = a => (a.edges || []).some(k => k.to[0] === q[0] && k.to[1] === q[1]);
    C.check('13-3: the checker crosses the harbour only riding (a ferry edge on the riding copy, none on the level)', e(D.areas[hi]) && !e(L.areas[hi]));
  }
  // 22-1: the minute hand: it rests at 2:22, turns only under Pupo, winds back; the falling time stops every jump
  {
    const L = G.getLevel(22, 1), g = play(L); G.step(g, 0.2);
    const hand = g.entities.find(e => e.s && e.s.clock), p = g.player;
    G.step(g, 1.0); C.check('22-1: the minute hand rests at 2:22 when nobody rides it', Math.abs(hand.cm - 22) < 0.01, { cm: hand.cm });
    PR.mount(p, true); at(g, Math.round(hand.hx / 32 - 0.5), Math.round(hand.hy / 32) + 4); PR.enter(g, p, 'swing', hand); G.step(g, 3);
    const mid = hand.cm; C.check(`22-1: ridden, it crawls round (at minute ${mid.toFixed(1)} after 3 s)`, mid > 35 && mid < 60);
    G.step(g, 5); C.check('22-1: ...and stops at the top', Math.abs(hand.cm - 60) < 0.01 && g.pupo.mode === 'swing');
    G.step(g, 1 / 120, { down: true, downPressed: true }); G.step(g, 3);
    C.check('22-1: let go, it winds back to 2:22', Math.abs(hand.cm - 22) < 0.01 && g.pupo.mode !== 'swing', { cm: hand.cm });
    const z = g.area.zones.find(q => q.kind === 'downdraft');
    for (const id of [null, 'socks', 'beans']) {
      const g2 = play(L); G.step(g2, 0.2); const p2 = g2.player; at(g2, Math.floor((z.x + z.w / 2) / 32), Math.round((z.y + z.h) / 32)); G.step(g2, 0.3);
      p2.jumpPow = id ? { id, gas: 1, used: false, pants: 0 } : null; const b0 = p2.y; let hi = p2.y;
      G.step(g2, 1 / 120, { jump: true, jumpPressed: true });
      for (let k = 0; k < 150; k++) { G.step(g2, 1 / 120, k % 12 === 6 ? { jump: true, jumpPressed: true } : { jump: true }); hi = Math.min(hi, p2.y); }
      C.check(`22-1: ${id ? 'with ' + id + ' ' : ''}Brady rises ${((b0 - hi) / 32).toFixed(2)} tiles in the falling time (the balcony is 7 up)`, b0 - hi < 1.5 * 32, { rise: (b0 - hi) / 32 });
    }
    const D = PV.derive(L), cnt = a => (a.edges || []).length, gh = a => (a.ghosts || []).length;
    C.check('22-1: the checker rides the hand only riding (ghosts and edges along its turn on the riding copy)', gh(D.areas[0]) > gh(L.areas[0]) && cnt(D.areas[0]) > cnt(L.areas[0]));
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
// the second Pupo (src/28_tour_pi_twin.js, Brady 26 Nov 2026): reached while Brady already rides, a Nap Box (or a Pupo
// left sitting) gives a power-up Brady does not hold, handed over on a slow long arm, once; on foot it is a normal mount
if (!want.length || want.includes('twin')) C.section([], 'twin', () => {
  const play = G.run('(l => { Save.data.lives = 9; Save.data.tips = Object.assign(Save.data.tips || {}, { box: true, picker: true }); const g = new Play(l, {}); Game.scene = g; g.state = "play"; g.fade.a = 0; g.fade.target = 0; g.timeLeft = 999; return g; })');
  const PR = G.run('PupoRide'), TW = G.run('PupoTwin'), USED = G.run('T.USED'), QB = G.run('T.QBLOCK');
  const boxesOf = g => g.area.spawns.filter(s => s.type === 'napBox').sort((a, b) => a.x - b.x).map(s => ({ tx: Math.floor(s.x / 32), ty: Math.floor(s.y / 32) - 1 }));
  const frees = g => g.entities.filter(e => e.pupoFree && !e.remove && !e.pupoGift);
  const gifts = g => g.entities.filter(e => e.pupoGift && !e.remove);
  const stand = (g, tx, ty) => { const p = g.player, A = g.area; let fy = ty + 1; while (fy < A.H && !(G.run('SOLID')[A.tiles[fy * A.W + tx]] || A.tiles[fy * A.W + tx] === G.run('T.SEMI'))) fy++; p.x = tx * 32 + 16 - p.w / 2; p.y = fy * 32 - p.h; p.vx = p.vy = 0; };
  for (const id of ['2-4', '22-1']) {
    const [w, n] = id.split('-').map(Number), g = play(G.getLevel(w, n)); G.step(g, 0.2);
    const B = boxesOf(g), p = g.player;
    // on foot: the first box is a normal Pupo, and Brady gets on
    stand(g, B[0].tx - 2, B[0].ty); G.step(g, 0.1); g.bumpBlock(B[0].tx, B[0].ty, false, p); G.step(g, 1.3);
    const f0 = frees(g)[0]; C.check(`${id}: on foot, the first Nap Box gives Pupo to ride (no present)`, !!f0 && !gifts(g).length && f0.mode === 'sit', { frees: frees(g).length, gifts: gifts(g).length });
    PR.mount(p, true); f0.remove = true; G.step(g, 0.1);
    // riding, the second box: a present, not a second steed
    p.setPower(0, true); stand(g, B[1].tx - 3, B[1].ty); G.step(g, 0.2);
    g.bumpBlock(B[1].tx, B[1].ty, false, p); G.step(g, 0.1);
    C.check(`${id}: riding, the second Nap Box opens on a twin who gives (no second Pupo to sit there)`, gifts(g).length === 1 && !frees(g).length && p.pupoRide, { gifts: gifts(g).length, frees: frees(g).length });
    let held = false, handT = null;
    for (let k = 0; k < 1500 && gifts(g).length; k++) { G.step(g, 1 / 120); const e = gifts(g)[0]; if (e && e.mode === 'offer' && e.kind && e.L > 20) held = true; if (handT == null && p.power > 0) handT = k / 120; }
    C.check(`${id}: he holds the present out on a long arm, slowly, and Brady (small) gets the mushroom (${handT == null ? '-' : handT.toFixed(1)} s)`, held && p.power === 1 && handT > 1.5 && p.pupoRide, { held, power: p.power, handT });
    C.check(`${id}: then the twin packs up and is gone; the box stays open`, !gifts(g).length && !frees(g).length && g.area.tiles[B[1].ty * g.area.W + B[1].tx] === USED, { gifts: gifts(g).map(e => e.mode + e.mt.toFixed(1)), frees: frees(g).map(e => e.mode), tile: g.area.tiles[B[1].ty * g.area.W + B[1].tx], USED });
    // once per Pupo: bumping the used box again while riding gives nothing
    g.bumpBlock(B[1].tx, B[1].ty, false, p); G.step(g, 3);
    C.check(`${id}: once only: the used box bumped again while riding gives nothing`, !gifts(g).length && !frees(g).length && p.power === 1);
    // a Pupo left sitting elsewhere, ridden into: he gives too (now the joint, as Brady is big)
    const stray = new (G.run('PupoFree'))(g, { x: p.cx + 70, y: p.y + p.h, facing: -1, mode: 'sit' }); g.spawn(stray); G.step(g, 0.1);
    const pw0 = p.power;
    for (let k = 0; k < 240 && !gifts(g).length; k++) G.step(g, 1 / 120, { right: true });
    G.step(g, 6);
    C.check(`${id}: riding into a Pupo left sitting: he gives something Brady lacks (power ${pw0} -> ${p.power}) and goes`, stray.remove && p.power === 2 && pw0 === 1 && !gifts(g).length && p.pupoRide, { pw0, power: p.power, gifts: gifts(g).length });
  }
  // Brady rides off before the paw reaches him: the present is set down for him, and it stays put until he comes back
  {
    const g = play(G.getLevel(2, 4)); G.step(g, 0.2); const p = g.player, B = boxesOf(g);
    PR.mount(p, true); p.setPower(0, true); stand(g, B[1].tx - 3, B[1].ty); G.step(g, 0.2);
    g.bumpBlock(B[1].tx, B[1].ty, false, p); G.step(g, 0.1); stand(g, B[1].tx - 14, B[1].ty); p.invuln = 99;
    G.step(g, 12); const it = g.entities.find(e => e.item && e.kind === 'mushroom' && !e.remove), x0 = it && it.x;
    G.step(g, 2);
    C.check('riding off before the hand-over: the twin sets the mushroom down by his box, and it stays there', !!it && Math.abs(it.x - x0) < 1 && Math.abs(it.cx - B[1].tx * 32) < 3 * 32 && !gifts(g).length && p.power === 0, { it: !!it, gifts: gifts(g).length });
    stand(g, Math.floor(it.cx / 32), B[1].ty); G.step(g, 0.3);
    C.check('...and riding back to it picks it up', p.power === 1 && it.remove);
  }
  // what he picks: never something Brady holds, never the LSD tab, a jump power or gear; the signature item only where the level has it
  {
    const g = play(G.getLevel(2, 4)); G.step(g, 0.1); const p = g.player, seen = new Set();
    for (const pw of [0, 1, 2]) for (const star of [0, 5]) { p.setPower(pw, true); p.star = star; const k = TW.pick(g, p); seen.add(k); if (TW.held(p, k)) seen.add('HELD:' + k); }
    const bad = [...seen].filter(k => /^HELD|lsd|socks|cake|beans|gear/.test(k));
    C.check('the present is always something Brady does not hold, never LSD, a jump power or gear', !bad.length, [...seen]);
    p.setPower(2, true); p.star = 0; const sig = TW.offersSig(g), k = TW.pick(g, p);
    C.check(`with big + joint: the land's signature item where the level offers it, else the star (${k})`, sig ? /^sig:/.test(k) : k === 'star', { sig, k });
  }
  // the level checker is unchanged: the Nap Boxes are still no power-ups for the budget
  for (const id of ['2-4', '22-1']) { const [w, n] = id.split('-').map(Number), b = G.Validator.budget(G.getLevel(w, n)); C.check(`${id}: the power-up budget still passes`, b.ok !== false && !b.errors.length, b.errors); }
});
C.done();
