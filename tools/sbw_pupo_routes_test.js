// Pupo's route scripts (tools/pupo_routes.js) played in Node: the real game modules in a VM (tools/sbw_pupo_lib.js),
// each shipped Pupo obstacle and Pupo-only bonus ridden through at the game's fixed 1/120 s step. Plus the checks of the
// P2-G1 rollout's own additions (src/28_tour_pe_g1.js: the snatch's look, its door, its hint; the cousins and the bats).
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
C.done();
