// Regression for the procedural walk/run (src/40_burns_d_rig.js): cadence follows the ground covered, planted stance
// feet, arms opposite the legs, hip/hair motion, and no freezing when the character can't move. No browser needed.
// Run: node tools/npc_gait_test.js   (exits non-zero on failure)
const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const ctx = { Math, Float32Array, Number, TAU: Math.PI * 2, clamp: (x, a, b) => Math.max(a, Math.min(b, x)), lerp: (a, b, t) => a + (b - a) * t, easeInOut: t => t, BurnsM: { smoothstep: (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); } } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/40_burns_d_rig.js'), 'utf8') + ';globalThis.Char=BurnsChar;globalThis.body=burnsBody;globalThis.pose=burnsPoseNew;globalThis.travel=burnsTravelPose;globalThis.GAIT=BURNS_GAIT;globalThis.BB=BURNS_BONES;', ctx);
const B = ctx.BB;
let cases = 0;
for (const run of [false, true]) for (const fps of [30, 60, 120]) for (const h of [0.85, 1, 1.2]) for (const scale of [1, 2]) {
  const body = ctx.body({ h }), ch = new ctx.Char({ nb: 16, body }); ch.scale = scale; ch.play(run ? 'run' : 'walk', { rate: 1 }, true); ch.update(0);
  const legH = (Math.abs(body.off[B.SHIN_L][1]) + Math.abs(body.off[B.FOOT_L][1])) / 0.8, cycle = (run ? ctx.GAIT.run.cycle : ctx.GAIT.walk.cycle) * legH;
  // 0.75 cycles of ground at a normal pace: the stride phase advances by exactly that
  const speed = cycle * scale * (run ? 1.6 : 1.2);
  const n = Math.round(fps * 0.75 * cycle * scale / speed); for (let i = 0; i < n; i++) { ch.z += cycle * scale * 0.75 / n; ch.update(1 / fps); }
  assert(Math.abs(ch._stridePhase - 0.75) < 1e-6, 'cadence follows distance: ' + ch._stridePhase);
  // blocked (pushing into a wall, a dialogue portrait): the cycle keeps going on the clock, it doesn't freeze
  const p0 = ch._stridePhase; ch.update(0.1); const adv = (ch._stridePhase - p0 + 1) % 1;
  assert(Math.abs(adv - 0.1 * (run ? ctx.GAIT.run.cps : ctx.GAIT.walk.cps)) < 1e-6, 'blocked: clock cadence, got ' + adv);
  // a teleport doesn't spin the legs
  const p1 = ch._stridePhase; ch.z += 100; ch.update(1 / 60); const adv2 = (ch._stridePhase - p1 + 1) % 1;
  assert(adv2 < 0.05, 'teleport advanced the stride by ' + adv2);
  assert(Array.from(ch.P.r).every(Number.isFinite), 'finite pose');
  cases++;
}
// planted stance foot during the walk's contact phase (stance travel = root travel, foot on the ground)
for (const h of [0.85, 1, 1.2]) {
  const body = ctx.body({ h }), l1 = Math.abs(body.off[B.SHIN_L][1]), l2 = Math.abs(body.off[B.FOOT_L][1]);
  const legH = (l1 + l2) / 0.8, contact = 0.6, span = ctx.GAIT.walk.cycle * legH * contact;
  for (let i = 0; i < 50; i++) {
    const u = i / 50 * contact, P = ctx.pose(); ctx.travel(P, u, body);
    const t = P.r[B.THIGH_L * 3], k = P.r[B.SHIN_L * 3];
    const z = -l1 * Math.sin(t) - l2 * Math.sin(t + k), y = P.y - l1 * Math.cos(t) - l2 * Math.cos(t + k);
    assert(Math.abs(z - span * (0.5 - u / contact)) < 1e-6, 'stance travel');
    assert(Math.abs(y + l1 + l2) < 1e-6, 'stance height');
    cases++;
  }
  // arms opposite the legs: at the left heel strike the left leg is forward (negative x) and the left arm back
  const P = ctx.pose(); ctx.travel(P, 0, body);
  assert(P.r[B.THIGH_L * 3] < -0.2 && P.r[B.UARM_L * 3] > 0.3 && P.r[B.UARM_R * 3] < -0.3, 'arm phase at left heel strike');
  const Q = ctx.pose(); ctx.travel(Q, 0.5, body);
  assert(Q.r[B.THIGH_R * 3] < -0.2 && Q.r[B.UARM_R * 3] > 0.3 && Q.r[B.UARM_L * 3] < -0.3, 'arm phase at right heel strike');
  // hips turn and the hair moves through the cycle
  const hips = [], hair = []; for (let i = 0; i < 8; i++) { const R = ctx.pose(); ctx.travel(R, i / 8, body); hips.push(R.r[B.HIPS * 3 + 1]); hair.push(R.r[B.HAIR * 3]); }
  assert(Math.max(...hips) - Math.min(...hips) > 0.08 && Math.max(...hair) - Math.min(...hair) > 0.05, 'hip and hair motion');
  cases += 3;
}
// the run keeps main's real stride: a wide leg split and a body that bounces (the airborne phase)
{
  const ch = new ctx.Char({ nb: 16, body: ctx.body() }); ch.play('run', { rate: 1 }, true);
  let split = 0, y0 = 1, y1 = -1; for (let i = 0; i < 60; i++) { ch.update(1 / 60); split = Math.max(split, Math.abs(ch.P.r[B.THIGH_L * 3] - ch.P.r[B.THIGH_R * 3])); y0 = Math.min(y0, ch.P.y); y1 = Math.max(y1, ch.P.y); }
  assert(split > 1.5 && y1 - y0 > 0.06, 'run stride ' + split + ' bounce ' + (y1 - y0));
  cases++;
}
// a crowd bank (never moves) still animates
const crowd = new ctx.Char({ nb: 16, body: ctx.body() }); crowd.play('walk', null, true); crowd.update(0.2);
assert(crowd._stridePhase > 0, 'a shared crowd pose stays animated');
console.log('PASS', cases, 'gait cases: distance cadence, clock fallback when blocked, teleport, planted feet, arm phase, hips/hair, run stride, crowd');
