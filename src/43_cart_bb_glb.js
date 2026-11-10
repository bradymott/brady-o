/* ============================================================
   ART CART — Blender-made art cars (.glb) on the car rig.
   CartGLB loads models/<stem>.glb (showroom) and models/<stem>_lo.glb (race)
   through the engine's BurnsGLTF and hands CartModels a model in the same
   shape its procedural builders make, so the rest of the game can't tell.
   The procedural cars stay as fallbacks (no file, no network, no WebGL2).

   Rig convention (see docs/BURNS_GUIDE.md §6.8): root nodes named
     body · wheel_FL · wheel_FR · wheel_RL · wheel_RR · steer · part_<name>…
   are the bones (car faces +Z, +X is its left); empties `seat`, `muzzle`
   and `light_<n>` (extras: color, size, big/head/tail/led) are markers;
   extras on the scene or `body` node may set len, w, h, wheelR, steerTilt,
   driverScale, seatYaw. Part animations live here, in CART_GLB_PARTS.
   ============================================================ */
const CART_GLB = {   // car id -> file stem under models/ (hi: <stem>.glb, race: <stem>_lo.glb)
  heart: 'bass_valentine', fish: 'glitterfin', octo: 'calamari_inferno', dragon: 'sir_scorchalot', duck: 'quackzilla',
  pyramid: 'pyramid_scheme', cupcake: 'frosted_fury', galleon: 'dusty_doubloon', snail: 'turbo_escargot', jelly: 'jelly_jolt',
  shark: 'dune_chomper', whale: 'whale_of_a_time'
};
// part node name (without "part_") -> fn(o, s): the same pose functions as the procedural cars (43_cart_b_models.js,
// 43_cart_ba_cars.js), so a Blender part must be authored in the same local frame as the procedural K.part build.
// A body extra `rigV` picks a newer table, CART_GLB_PARTS['<id>:<rigV>'], so a rebuilt .glb can change its parts
// while an older file on a phone's cache keeps the poses it was made for.
const CART_GLB_PARTS = {
  // Bass Valentine before the quality-bar rebuild: its heart is shrunk and lowered here so it no longer hides the road
  heart: {
    heart: (o, s) => { const k = cartHeartBeat(o, s, 0.78); o.y = -0.45 + 0.02 * k; }
  },
  // the rebuilt Bass Valentine (tools/blender/bass_valentine.py, rigV 2): a heart at its final size, pumping cones
  'heart:2': {
    heart: (o, s) => { cartHeartBeat(o, s, 1); },
    coneL0: (o, s) => cartConePump(o, s, 1, 0, 0), coneL1: (o, s) => cartConePump(o, s, 1, 0, 0.12), coneL2: (o, s) => cartConePump(o, s, 1, 0, 0.24),
    coneR0: (o, s) => cartConePump(o, s, -1, 0, 0), coneR1: (o, s) => cartConePump(o, s, -1, 0, 0.12), coneR2: (o, s) => cartConePump(o, s, -1, 0, 0.24),
    subL: (o, s) => cartConePump(o, s, 0, -1, 0.05), subR: (o, s) => cartConePump(o, s, 0, -1, 0.05)
  },
  fish: {
    finL: (o, st) => { o.roll = 1 * (0.25 + Math.sin(st.t * 6 + 1) * 0.25 * (0.4 + st.speed)); },
    finR: (o, st) => { o.roll = -1 * (0.25 + Math.sin(st.t * 6 - 1) * 0.25 * (0.4 + st.speed)); },
    tail: (o, st) => { o.yaw = Math.sin(st.t * (3 + st.speed * 7)) * (0.25 + 0.25 * st.speed); }
  },
  // the rebuilt Glitterfin (tools/blender/glitterfin.py, rigV 2): the mirror-tiled fish swims on its hull (the tiles
  // shimmer as it turns), the fins and tail ride on it and swish, the chin mirror ball spins
  'fish:2': {
    fish: (o, s) => { const p = cartFishSwim(s); o.yaw = p.yaw; o.pitch = p.pitch; o.roll = p.roll; o.y = p.y; },
    finL: (o, s) => { cartFollow(o, CART_FISH_J.finL, CART_FISH_J.fish, cartFishSwim(s)); o.roll += 0.22 + Math.sin(s.t * 5 + 1) * 0.3 * (0.5 + s.speed); },
    finR: (o, s) => { cartFollow(o, CART_FISH_J.finR, CART_FISH_J.fish, cartFishSwim(s)); o.roll -= 0.22 + Math.sin(s.t * 5 - 1) * 0.3 * (0.5 + s.speed); },
    tail: (o, s) => { cartFollow(o, CART_FISH_J.tail, CART_FISH_J.fish, cartFishSwim(s)); o.yaw += Math.sin(s.t * 4.2 - 0.8) * (0.3 + 0.2 * Math.min(1, s.speed)); },
    ball: (o, s) => { cartFollow(o, CART_FISH_J.ball, CART_FISH_J.fish, cartFishSwim(s)); o.yaw += s.t * (1.3 + 7 * s.fire); }
  },
  octo: Object.assign({ head: (o, s) => { o.y = Math.sin(s.t * 2.2) * 0.06; o.pitch = -0.12 + Math.sin(s.t * 1.1) * 0.05; o.yaw = s.steer * 0.12; } },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = (i + 0.5) / 8 * TAU, ph = i * 0.8; return { ['arm' + i]: (o, s) => { const w = Math.sin(s.t * 2.6 + ph); o.yaw = a; o.pitch = -0.15 + w * 0.18 - s.fire * 0.5; o.roll = Math.sin(s.t * 1.9 + ph) * 0.15; } }; })),
  // the rebuilt Calamari Inferno (tools/blender/calamari_inferno.py, rigV 2): the mantle bobs and looks around, the eight
  // arms (authored along +Z, yawed into place here) curl and uncurl, wave, and rear up with their torches when firing
  'octo:2': Object.assign({ head: (o, s) => { o.y = Math.sin(s.t * 2.2) * 0.05; o.pitch = -0.05 + Math.sin(s.t * 1.1) * 0.05; o.yaw = s.steer * 0.15 + Math.sin(s.t * 0.6) * 0.1; o.roll = Math.sin(s.t * 1.4) * 0.03; } },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ ['arm' + i]: (o, s) => cartOctoArm(o, s, i) }))),
  dragon: {
    neck: (o, s) => { o.pitch = -0.1 + Math.sin(s.t * 2.4) * 0.06 - s.fire * 0.45; o.yaw = s.steer * 0.3 + Math.sin(s.t * 0.7) * 0.08; },
    wingL: (o, st) => { const k = 0.35 + 0.6 * Math.max(st.boost, st.air); o.roll = 1 * (0.25 + Math.sin(st.t * (3 + 9 * k)) * 0.45 * k); },
    wingR: (o, st) => { const k = 0.35 + 0.6 * Math.max(st.boost, st.air); o.roll = -1 * (0.25 + Math.sin(st.t * (3 + 9 * k)) * 0.45 * k); },
    tail: (o, s) => { o.yaw = Math.sin(s.t * (2 + s.speed * 4)) * 0.35; }
  },
  // the rebuilt Sir Scorchalot (tools/blender/sir_scorchalot.py, rigV 2): the neck sways and rears back when firing, the
  // jaw rides on it and gapes (with a few idle chomps), the wings flap gently (hard on boost / in the air), the tail wags
  // and its spade end follows a beat later
  'dragon:2': {
    neck: (o, s) => { const p = cartDragonNeck(s); o.pitch = p.pitch; o.yaw = p.yaw; },
    jaw: (o, s) => { cartFollow(o, CART_DRAGON_J.jaw, CART_DRAGON_J.neck, cartDragonNeck(s)); o.pitch += 0.03 + 0.06 * Math.pow(Math.max(0, Math.sin(s.t * 1.3)), 8) + 0.5 * s.fire; },
    wingL: (o, s) => cartDragonWing(o, s, 1), wingR: (o, s) => cartDragonWing(o, s, -1),
    tail: (o, s) => { o.yaw = Math.sin(s.t * 2.6) * (0.26 + 0.1 * Math.min(1, s.speed)) - s.steer * 0.12; },
    tailTip: (o, s) => {
      const P = CART_DRAGON_P; P.yaw = Math.sin(s.t * 2.6) * (0.26 + 0.1 * Math.min(1, s.speed)) - s.steer * 0.12; P.pitch = 0; P.roll = 0; P.x = P.y = P.z = 0;
      cartFollow(o, CART_DRAGON_J.tailTip, CART_DRAGON_J.tail, P); o.yaw += Math.sin(s.t * 2.6 - 1.1) * 0.38; o.pitch += Math.sin(s.t * 1.3) * 0.06;
    }
  },
  duck: {
    wingL: (o, st) => { o.roll = 1 * (0.1 + Math.max(0, Math.sin(st.t * 14)) * 0.5 * Math.max(st.boost, st.air)); },
    wingR: (o, st) => { o.roll = -1 * (0.1 + Math.max(0, Math.sin(st.t * 14)) * 0.5 * Math.max(st.boost, st.air)); },
    head: (o, s) => { o.pitch = Math.sin(s.t * 3.1) * 0.08 - s.fire * 0.25; o.roll = Math.sin(s.t * 1.7) * 0.1; o.yaw = s.steer * 0.25; }
  },
  // the rebuilt Quackzilla (tools/blender/quackzilla.py, rigV 2): the duck floats on its bath water (bobs, rocks, leans
  // into turns, lifts its chest at speed); the wings, head and party hat ride on it, the head tilts and looks into turns,
  // the hat wobbles on the head, the foam drifts and the ripples breathe
  'duck:2': {
    duck: (o, s) => cartChain(o, CART_DUCK2.duck, cartDuckFloat(s)),
    wingL: (o, s) => cartChain(o, CART_DUCK2.wingL, cartDuckFloat(s), cartDuckWing(s, 1)),
    wingR: (o, s) => cartChain(o, CART_DUCK2.wingR, cartDuckFloat(s), cartDuckWing(s, -1)),
    head: (o, s) => cartChain(o, CART_DUCK2.head, cartDuckFloat(s), cartDuckHead(s)),
    hat: (o, s) => cartChain(o, CART_DUCK2.hat, cartDuckFloat(s), cartDuckHead(s), cartDuckHat(s)),
    foam: (o, s) => { o.y = Math.sin(s.t * 1.7 + 0.5) * 0.025; o.yaw = Math.sin(s.t * 0.45) * 0.07; },
    ripple: (o, s) => { const k = 1 + 0.045 * Math.sin(s.t * 2.2) + 0.03 * Math.min(1, s.speed); o.sx = k; o.sz = k; }
  },
  pyramid: { turret: (o, s) => { o.yaw = s.t * (1.2 + s.fire * 9); } },
  // the rebuilt Pyramid Scheme (tools/blender/pyramid_scheme.py, rigV 2): the capstone turns, its four laser emitters
  // ride it and sweep, the laser-line rings pulse tier by tier, the tower subs pump
  'pyramid:2': {
    cap: (o, s) => cartChain(o, CART_PYR2.cap, cartPyrCap(s)),
    emit0: (o, s) => cartChain(o, CART_PYR2.emit[0], cartPyrCap(s), cartPyrEmit(s, 0)),
    emit1: (o, s) => cartChain(o, CART_PYR2.emit[1], cartPyrCap(s), cartPyrEmit(s, 1)),
    emit2: (o, s) => cartChain(o, CART_PYR2.emit[2], cartPyrCap(s), cartPyrEmit(s, 2)),
    emit3: (o, s) => cartChain(o, CART_PYR2.emit[3], cartPyrCap(s), cartPyrEmit(s, 3)),
    glow0: (o, s) => cartPyrGlow(o, s, 0), glow1: (o, s) => cartPyrGlow(o, s, 1), glow2: (o, s) => cartPyrGlow(o, s, 2), glow3: (o, s) => cartPyrGlow(o, s, 3),
    subs: (o, s) => cartConePump(o, s, 0, -1, 0.05)
  },
  cupcake: { cherry: (o, s) => { const b = Math.abs(Math.sin(s.t * 7)) * (0.05 + 0.15 * s.speed); o.y = b; o.roll = Math.sin(s.t * 5) * 0.1; } },
  // the rebuilt Frosted Fury (tools/blender/frosted_fury.py, rigV 2): jiggling frosting, a cherry riding it, twinkling glints
  'cupcake:2': {
    frosting: (o, s) => cartCupPose(o, s, 1),
    cherry: (o, s) => cartCupCherry(o, s),
    glintA: (o, s) => cartCupGlint(o, s, 0), glintB: (o, s) => cartCupGlint(o, s, 0.5)
  },
  galleon: {
    sailFore: (o, s) => { o.sz = 0.75 + 0.5 * s.speed + Math.sin(s.t * 3 + 0.9) * 0.06; o.yaw = s.steer * 0.12; },
    sailMain: (o, s) => { o.sz = 0.75 + 0.5 * s.speed + Math.sin(s.t * 3 - 0.6) * 0.06; o.yaw = s.steer * 0.12; },
    flag: (o, s) => { o.yaw = Math.PI + Math.sin(s.t * 6) * 0.25; }
  },
  // the rebuilt Dusty Doubloon (tools/blender/dusty_doubloon.py, rigV 2): the hull rocks on its trailer like a ship at
  // anchor (about the captain's deck, so the driver stays put); the sails billow with speed and gusts, the pennant
  // streams and flutters, the stern lanterns swing; all of them ride the hull's rock
  'galleon:2': {
    hull: (o, s) => cartChain(o, CART_GALLEON.hull, cartGalleonRock(s)),
    sailFore: (o, s) => { cartChain(o, CART_GALLEON.sailFore, cartGalleonRock(s), cartGalleonSail(s, 0)); o.sz = cartGalleonBillow(s, 0.9); },
    sailMain: (o, s) => { cartChain(o, CART_GALLEON.sailMain, cartGalleonRock(s), cartGalleonSail(s, 1)); o.sz = cartGalleonBillow(s, -0.6); },
    flag: (o, s) => cartChain(o, CART_GALLEON.flag, cartGalleonRock(s), cartGalleonFlag(s)),
    lanternL: (o, s) => cartChain(o, CART_GALLEON.lanternL, cartGalleonRock(s), cartGalleonLantern(s, 0)),
    lanternR: (o, s) => cartChain(o, CART_GALLEON.lanternR, cartGalleonRock(s), cartGalleonLantern(s, 1))
  },
  // the rebuilt Turbo Escargot (tools/blender/turbo_escargot.py, rigV 2): the slug squashes and stretches in a slow
  // wave (longer at speed), the eye stalks sway and bob, the shell wobbles and its chase lights flow out along the spiral
  // (faster with speed, racing on a boost); the eyes and shell ride the squash
  'snail:2': {
    slug: (o, s) => cartSnailSquash(o, s),
    eyeL: (o, s) => cartChain(o, CART_SNAIL.eyeL, cartSnailRide(s, CART_SNAIL.eyeL, 0), cartSnailEye(s, 0)),
    eyeR: (o, s) => cartChain(o, CART_SNAIL.eyeR, cartSnailRide(s, CART_SNAIL.eyeR, 1), cartSnailEye(s, 1)),
    shell: (o, s) => cartChain(o, CART_SNAIL.shell, cartSnailRide(s, CART_SNAIL.shell, 2), cartSnailShell(s)),
    chase: (o, s) => { const ph = cartSnailChase(s); cartChain(o, CART_SNAIL.chase, cartSnailRide(s, CART_SNAIL.shell, 2), cartSnailShell(s), CART_SNAIL_L.chase); o.sx = o.sy = o.sz = Math.exp(-0.12 * ph); }
  },
  snail: {
    eyeL: (o, st) => { o.pitch = -0.3 + Math.sin(st.t * 4 + 1) * 0.18 - st.speed * 0.3; o.roll = 1 * (0.2 + Math.sin(st.t * 3.1 + 2) * 0.15); },
    eyeR: (o, st) => { o.pitch = -0.3 + Math.sin(st.t * 4 - 1) * 0.18 - st.speed * 0.3; o.roll = -1 * (0.2 + Math.sin(st.t * 3.1 - 2) * 0.15); },
    shell: (o, s) => { o.roll = Math.sin(s.t * 2.2) * 0.05; o.pitch = -s.boost * 0.06; }
  },
  jelly: Object.assign({ bell: (o, s) => { const p = Math.sin(s.t * 3.2); o.sy = 1 + p * 0.07 + s.fire * 0.15; o.sx = o.sz = 1 - p * 0.05 + s.fire * 0.08; } },
    ...[0, 1, 3, 4, 5].map(i => ({ ['tentacle' + i]: (o, s) => { o.pitch = Math.sin(s.t * 2.2 + i) * 0.25 + s.speed * 0.5; o.roll = Math.sin(s.t * 1.7 + i * 2) * 0.2; } }))),
  // the rebuilt Jelly Jolt (tools/blender/jelly_jolt.py, rigV 2): the bell pulses (a quick contraction, a slow relax)
  // and hovers, leaning into its swim; the static bolts flicker on and off and jump about (always on when it fires);
  // four two-jointed tentacles sway and trail back with speed, the lower half lagging the upper
  'jelly:2': Object.assign({
    bell: (o, s) => { const K = cartJellyPulse(s); cartChain(o, CART_JELLY.bell, cartJellyFloat(s, CART_JELLY.bell, 4)); o.sx = o.sz = K[0]; o.sy = K[1]; },
    zap: (o, s) => { cartChain(o, CART_JELLY.zap, cartJellyFloat(s, CART_JELLY.zap, 5), cartJellyZap(s)); o.sx = o.sy = o.sz = CART_JELLY_L.zapK; }
  }, ...[0, 1, 2, 3].map(i => ({
    ['tent' + i + 'a']: (o, s) => cartChain(o, CART_JELLY.tent[i], cartJellyFloat(s, CART_JELLY.tent[i], i), cartJellyTent(s, i, 0)),
    ['tent' + i + 'b']: (o, s) => cartChain(o, CART_JELLY.knee[i], cartJellyFloat(s, CART_JELLY.tent[i], i), cartJellyTent(s, i, 0), cartJellyTent(s, i, 1))
  }))),
  shark: {
    jaw: (o, s) => { o.pitch = 0.08 + s.fire * 0.75 + Math.max(0, Math.sin(s.t * 10)) * 0.05 * s.speed; },
    tail: (o, s) => { o.yaw = Math.sin(s.t * (3 + s.speed * 6)) * 0.4; }
  },
  // the rebuilt Dune Chomper (tools/blender/dune_chomper.py, rigV 2): the jaw chomps (eases open, snaps shut; gapes when
  // firing), the tail sweeps, the dorsal fin flexes after it and leans into turns, the pectoral fins paddle
  'shark:2': {
    jaw: (o, s) => {
      const ph = (s.t * 0.85) % 1, c = ph < 0.7 ? 0.5 - 0.5 * Math.cos(ph / 0.7 * Math.PI) : ph < 0.8 ? 1 : Math.max(0, 1 - (ph - 0.8) / 0.07);
      o.pitch = 0.04 + 0.26 * c * (1 - s.fire) + 0.62 * s.fire + Math.max(0, Math.sin(s.t * 10)) * 0.04 * s.speed;
    },
    tail: (o, s) => { const w = s.t * 4.2; o.yaw = Math.sin(w) * (0.3 + 0.14 * Math.min(1, s.speed)); o.roll = Math.sin(w) * 0.05; },
    dorsal: (o, s) => { const w = s.t * 4.2 - 1.1; o.roll = Math.sin(w) * 0.07 - s.steer * 0.1; o.yaw = Math.sin(w) * 0.05; },
    pecL: (o, s) => { o.roll = Math.sin(s.t * 2.6) * 0.14 - 0.05 * s.speed; o.pitch = -0.06 * s.speed; },
    pecR: (o, s) => { o.roll = -Math.sin(s.t * 2.6) * 0.14 + 0.05 * s.speed; o.pitch = -0.06 * s.speed; }
  },
  whale: {
    flipperL: (o, st) => { o.roll = 1 * (-0.2 + Math.sin(st.t * 3 + 1) * 0.3); },
    flipperR: (o, st) => { o.roll = -1 * (-0.2 + Math.sin(st.t * 3 - 1) * 0.3); },
    tail: (o, s) => { o.pitch = Math.sin(s.t * (2 + s.speed * 3)) * 0.3; }
  },
  // the rebuilt Whale of a Time (tools/blender/whale_of_a_time.py, rigV 2): flippers paddle, flukes beat, the spout
  // burbles and puffs (and erupts when firing), the eyes blink, alternate rail bulbs twinkle (shrunk across the rail)
  'whale:2': Object.assign({
    flipperL: (o, s) => { o.roll = -0.15 + Math.sin(s.t * 3 + 1) * 0.32; o.pitch = Math.sin(s.t * 3 + 2.2) * 0.08; },
    flipperR: (o, s) => { o.roll = 0.15 - Math.sin(s.t * 3 + 1) * 0.32; o.pitch = Math.sin(s.t * 3 + 2.2) * 0.08; },
    tail: (o, s) => { o.pitch = Math.sin(s.t * 2.6) * (0.22 + 0.12 * Math.min(1, s.speed)); },
    spout: (o, s) => {
      const ph = (s.t * 0.45) % 1, puff = ph < 0.16 ? Math.sin(ph / 0.16 * Math.PI) : 0;
      const k = 0.5 + 0.05 * Math.sin(s.t * 9) + 0.45 * puff + 1.1 * s.fire;
      o.sy = k; o.sx = o.sz = 0.7 + 0.3 * k;
    },
    eyes: (o, s) => { const ph = (s.t * 0.29) % 1, b = ph > 0.955 ? Math.sin((ph - 0.955) / 0.045 * Math.PI) : 0; o.sy = 1 - 0.88 * b; }
  }, ...[['twLA', 0], ['twLB', Math.PI], ['twRA', Math.PI / 2], ['twRB', Math.PI * 1.5]].map(([n, p]) => ({
    [n]: (o, s) => { const k = 0.4 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(s.t * 5.3 + p), 2.5) + 0.08 * Math.sin(s.t * 13 + p * 2); o.sx = k; o.sy = k; }
  })))
};
// ---- part-on-part helpers for the Glitterfin / Calamari Inferno / Sir Scorchalot rebuilds (rigV 2) ----
// Every part bone hangs off the body, so a part that rides on another part (a fin on the swimming fish, a jaw on the
// neck) copies its parent's pose: cartFollow sets o's angles to the parent's and its offset so that the part (joint J)
// turns rigidly about the parent's joint P; the caller then adds its own angles on top (exact for an extra pitch when
// the parent has no roll, and close for the small parent angles used here).
const CART_FOLLOW_M = new Float32Array(12);
function cartFollow(o, J, P, p) {
  const A = CART_FOLLOW_M; BurnsM.a34Set(A, 0, 0, 0, 0, p.yaw, p.pitch, p.roll, 1, 1, 1);
  const dx = J[0] - P[0], dy = J[1] - P[1], dz = J[2] - P[2];
  o.x = A[0] * dx + A[1] * dy + A[2] * dz - dx + p.x; o.y = A[4] * dx + A[5] * dy + A[6] * dz - dy + p.y; o.z = A[8] * dx + A[9] * dy + A[10] * dz - dz + p.z;
  o.yaw = p.yaw; o.pitch = p.pitch; o.roll = p.roll;
}
// Glitterfin's joints (tools/blender/glitterfin.py FJ, FIN_J, TAIL_J, BALL_J) and its swim: a gentle S-sway, roll and bob
const CART_FISH_J = { fish: [0, 2.4, 0.1], finL: [1.1, 1.75, 0.6], finR: [-1.1, 1.75, 0.6], tail: [0, 1.95, -2.2], ball: [0, 0.98, 2.3] };
const CART_FISH_P = { yaw: 0, pitch: 0, roll: 0, x: 0, y: 0, z: 0 };
function cartFishSwim(s) {
  const p = CART_FISH_P, k = 1 + 0.6 * Math.min(1, s.speed);
  p.yaw = Math.sin(s.t * 2.3) * 0.05 * k + s.steer * 0.04; p.roll = Math.sin(s.t * 1.7 + 1) * 0.03 - s.steer * 0.03;
  p.pitch = Math.sin(s.t * 1.3) * 0.015 - s.fire * 0.04; p.y = Math.sin(s.t * 2.6) * 0.025;
  return p;
}
// one Calamari Inferno arm: yawed to its place round the body, a slow wave (pitch) and sideways sweep (roll), a curl that
// bunches the arm up (taller, shorter: the curled tip tightens) and lets it stretch out again, a tremble that jiggles the
// torch flame at its tip (harder while firing), and every arm rears up when the car fires
function cartOctoArm(o, s, i) {
  const a = (i + 0.5) / 8 * TAU, ph = i * 0.8, w = Math.sin(s.t * 2.4 + ph), c = Math.sin(s.t * 1.6 + ph * 1.3);
  o.yaw = a + Math.sin(s.t * 1.9 + ph) * 0.1;
  o.pitch = -0.05 + w * 0.14 - s.fire * 0.4 + Math.sin(s.t * 19 + i * 2.1) * 0.008 * (1 + 2 * s.fire);
  o.roll = Math.sin(s.t * 1.7 + ph) * 0.12;
  o.sy = 1 + 0.12 * c; o.sz = 1 - 0.07 * c;
}
// Sir Scorchalot's joints (tools/blender/sir_scorchalot.py NECK_J, its printed JAW_J, TAIL_J, TIP_J) and the neck's sway
const CART_DRAGON_J = { neck: [0, 2.0, 1.6], jaw: [0, 2.9196, 2.7229], tail: [0, 1.45, -2.25], tailTip: [0, 1.25, -3.45] };
const CART_DRAGON_P = { yaw: 0, pitch: 0, roll: 0, x: 0, y: 0, z: 0 }, CART_DRAGON_N = { yaw: 0, pitch: 0, roll: 0, x: 0, y: 0, z: 0 };
function cartDragonNeck(s) {
  const p = CART_DRAGON_N;
  p.pitch = -0.08 + Math.sin(s.t * 2.4) * 0.05 - s.fire * 0.3; p.yaw = s.steer * 0.3 + Math.sin(s.t * 0.7) * 0.12;
  return p;
}
// a wing (side 1 = left): a slow, gentle flap with a little sweep; beats harder and faster on boost or in the air
function cartDragonWing(o, s, side) {
  const k = Math.max(s.boost, s.air), f = Math.sin(s.t * 3.2) * (1 - k) + Math.sin(s.t * 9) * k;
  o.roll = side * (0.18 + f * (0.16 + 0.3 * k)); o.yaw = side * Math.sin(s.t * 3.2 - 0.8) * 0.05;
}
// ---- chained parts for the Quackzilla / Pyramid Scheme / Frosted Fury rebuilds (rigV 2) ----
// cartChain poses a part that rides a chain of other parts' motions, exactly: each link L is { j: [x, y, z] (its joint,
// car space at rest), x, y, z (offset), yaw, pitch, roll } and turns everything after it about its joint; the outermost
// link comes first and the part's own motion last. The part's joint J then gets the composed offset and angles.
// A link with `ax` turns in a frame yawed by ax (its pitch then tips about the horizontal axis across direction ax).
const CART_CHAIN = { m: new Float32Array(12), a: new Float32Array(12), t: new Float32Array(12), q: new Float32Array(12) };
function cartChain(o, J, l0, l1, l2) {
  const M = CART_CHAIN.m, A = CART_CHAIN.a, T = CART_CHAIN.t, Q = CART_CHAIN.q;
  BurnsM.a34Set(M, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1);
  for (const L of [l0, l1, l2]) {
    if (!L) continue;
    const j = L.j;
    if (L.ax) {
      BurnsM.a34Set(T, 0, j[0] + (L.x || 0), j[1] + (L.y || 0), j[2] + (L.z || 0), L.ax, 0, 0, 1, 1, 1);
      BurnsM.a34Set(Q, 0, 0, 0, 0, L.yaw || 0, L.pitch || 0, L.roll || 0, 1, 1, 1); BurnsM.a34Mul(A, 0, T, 0, Q, 0);
      BurnsM.a34Set(Q, 0, 0, 0, 0, -L.ax, 0, 0, 1, 1, 1); BurnsM.a34Mul(T, 0, A, 0, Q, 0); A.set(T);
    } else BurnsM.a34Set(A, 0, j[0] + (L.x || 0), j[1] + (L.y || 0), j[2] + (L.z || 0), L.yaw || 0, L.pitch || 0, L.roll || 0, 1, 1, 1);
    A[3] -= A[0] * j[0] + A[1] * j[1] + A[2] * j[2]; A[7] -= A[4] * j[0] + A[5] * j[1] + A[6] * j[2]; A[11] -= A[8] * j[0] + A[9] * j[1] + A[10] * j[2];
    BurnsM.a34Mul(T, 0, M, 0, A, 0); M.set(T);
  }
  o.x = M[0] * J[0] + M[1] * J[1] + M[2] * J[2] + M[3] - J[0];
  o.y = M[4] * J[0] + M[5] * J[1] + M[6] * J[2] + M[7] - J[1];
  o.z = M[8] * J[0] + M[9] * J[1] + M[10] * J[2] + M[11] - J[2];
  o.pitch = Math.asin(Math.max(-1, Math.min(1, -M[6]))); o.yaw = Math.atan2(M[2], M[10]); o.roll = Math.atan2(M[4], M[5]);
}
// Pyramid Scheme's joints (tools/blender/pyramid_scheme.py CAP_J, the emitters, the laser rings, SUBS_J) and motions
const CART_PYR2 = { cap: [0, 2.58, 0.5], emit: [0, 1, 2, 3].map(k => { const a = TAU * (k + 0.5) / 4; return [Math.sin(a) * 0.5, 2.73, 0.5 + Math.cos(a) * 0.5]; }) };
const CART_PYR2_L = { c: { j: CART_PYR2.cap }, e: [0, 1, 2, 3].map(k => ({ j: CART_PYR2.emit[k], ax: TAU * (k + 0.5) / 4 })) };
function cartPyrCap(s) { const L = CART_PYR2_L.c; L.yaw = s.t * 0.7; return L; }
// an emitter sweeps its beam up and down (out of step with the others); firing, all four scan fast across the road
function cartPyrEmit(s, k) {
  const L = CART_PYR2_L.e[k];
  L.pitch = (0.32 * Math.sin(s.t * 2.2 + k * 1.57) - 0.12) * (1 - s.fire) + s.fire * (0.1 + 0.3 * Math.sin(s.t * 11 + k));
  return L;
}
// a tier's bright laser ring: lit (scale 1, standing just proud of the face) or sunk back into the tier (scale 0.8);
// the rings chase bottom to top, all light on the music's beat and while firing
function cartPyrGlow(o, s, i) {
  const ph = ((s.t * 1.4 - i * 0.22) % 1 + 1) % 1, v = 0.5 + 0.5 * Math.cos(ph * TAU);
  const on = Math.max(Math.min(1, Math.max(0, (v - 0.35) / 0.3)), s.beat || 0, s.fire);
  const k = 0.8 + 0.2 * on; o.sx = k; o.sz = k;
}
// Frosted Fury's joints (tools/blender/frosted_fury.py FROST_J, CHERRY): the frosting jiggles (squash and stretch, a sway
// into turns, wilder at speed and when firing), the cherry rides it and bounces, the glints twinkle in turn
const CART_CUP2 = { frost: [0, 1.6, 0.75], cherry: [0, 3.25, 0.75] };
const CART_CUP2_L = { f: { j: CART_CUP2.frost }, c: { j: CART_CUP2.cherry } };
function cartCupFrost(s) {
  const L = CART_CUP2_L.f, a = 0.03 + 0.04 * Math.min(1, s.speed) + 0.08 * s.fire, w = Math.sin(s.t * 6.5);
  L.sy = 1 + a * w; L.sxz = 1 - 0.5 * a * w;
  L.roll = 0.04 * Math.sin(s.t * 3.1) - 0.05 * s.steer; L.pitch = 0.03 * Math.sin(s.t * 2.3 + 1);
  return L;
}
function cartCupPose(o, s, g) {
  const L = cartCupFrost(s); o.sx = o.sz = L.sxz * g; o.sy = L.sy * g; o.roll = L.roll; o.pitch = L.pitch;
}
function cartCupGlint(o, s, ph0) {
  const ph = ((s.t * 0.8 + ph0) % 1 + 1) % 1, on = Math.max(0, 1 - Math.abs(ph - 0.1) / 0.1, s.fire);
  cartCupPose(o, s, 0.84 + 0.16 * on);
}
function cartCupCherry(o, s) {
  const F = cartCupFrost(s), C = CART_CUP2_L.c;
  C.roll = Math.sin(s.t * 5) * 0.12; C.pitch = Math.sin(s.t * 4.3 + 1) * 0.08;
  cartChain(o, CART_CUP2.cherry, F, C);
  o.y += (CART_CUP2.cherry[1] - CART_CUP2.frost[1]) * (F.sy - 1) + Math.abs(Math.sin(s.t * 7)) * (0.03 + 0.1 * Math.min(1, s.speed));
}
// Quackzilla's joints (tools/blender/quackzilla.py PIVOT, WING_J, HEAD_J, HAT_J) and its float, wing, head and hat motions
const CART_DUCK2 = { duck: [0, 1.0, 0], wingL: [1.12, 1.86, 0.32], wingR: [-1.12, 1.86, 0.32], head: [0, 2.3, 1.3], hat: [0.17, 3.67, 1.45] };
const CART_DUCK2_L = { f: { j: CART_DUCK2.duck }, h: { j: CART_DUCK2.head }, t: { j: CART_DUCK2.hat }, wL: { j: CART_DUCK2.wingL }, wR: { j: CART_DUCK2.wingR } };
function cartDuckFloat(s) {
  const L = CART_DUCK2_L.f, sp = Math.min(1, s.speed);
  L.y = 0.045 * Math.sin(s.t * 1.8) + 0.015 * Math.sin(s.t * 4.3 + 1) + 0.03 * s.fire;
  L.pitch = 0.03 * Math.sin(s.t * 1.3 + 0.6) - 0.04 * sp + 0.05 * s.fire;
  L.roll = 0.04 * Math.sin(s.t * 1.1) - 0.07 * s.steer; L.yaw = 0.025 * Math.sin(s.t * 0.7);
  return L;
}
function cartDuckWing(s, side) {
  const L = side > 0 ? CART_DUCK2_L.wL : CART_DUCK2_L.wR;
  L.roll = side * (0.04 + 0.04 * Math.sin(s.t * 2.3 + side) + Math.max(0, Math.sin(s.t * 14)) * 0.5 * Math.max(s.boost, s.air));
  return L;
}
function cartDuckHead(s) {
  const L = CART_DUCK2_L.h;
  L.pitch = Math.sin(s.t * 3.1) * 0.05 - s.fire * 0.22; L.roll = Math.sin(s.t * 1.7) * 0.09; L.yaw = s.steer * 0.3 + Math.sin(s.t * 0.8) * 0.08;
  return L;
}
function cartDuckHat(s) {
  const L = CART_DUCK2_L.t, k = 0.7 + 0.5 * Math.min(1, s.speed) + 0.6 * s.fire;
  L.roll = Math.sin(s.t * 5.3 - 0.8) * 0.1 * k; L.pitch = Math.sin(s.t * 4.1 + 0.4) * 0.07 * k;
  return L;
}
// Dusty Doubloon's joints (tools/blender/dusty_doubloon.py: hull at the origin, SAIL_FORE / SAIL_MAIN pivots, the flag
// at the main mast top, LANT hooks) and its motions. The rock pivot sits at the captain's seat on the stern deck.
const CART_GALLEON = { hull: [0, 0, 0], sailFore: [0, 3.1, 1.08], sailMain: [0, 3.35, -0.42], flag: [0, 4.97, -0.5], lanternL: [1.13, 3.28, -2.58], lanternR: [-1.13, 3.28, -2.58] };
const CART_GALLEON_L = { rock: { j: [0, 2.9, -1.85] }, sail: [{ j: CART_GALLEON.sailFore }, { j: CART_GALLEON.sailMain }], flag: { j: CART_GALLEON.flag }, lant: [{ j: CART_GALLEON.lanternL }, { j: CART_GALLEON.lanternR }] };
function cartGalleonRock(s) {   // a slow roll and pitch, a lean out of turns, the bow lifting with speed
  const L = CART_GALLEON_L.rock, sp = Math.min(1, s.speed);
  L.roll = 0.02 * Math.sin(s.t * 1.3) + 0.008 * Math.sin(s.t * 0.47 + 2) - 0.03 * s.steer;
  L.pitch = 0.012 * Math.sin(s.t * 0.9 + 1) - 0.014 * sp - 0.02 * s.boost + 0.03 * s.fire * Math.sin(s.t * 20);
  return L;
}
function cartGalleonSail(s, i) {   // the sails lean a little into turns and luff in the gusts
  const L = CART_GALLEON_L.sail[i]; L.yaw = s.steer * 0.1 + Math.sin(s.t * 1.1 + i * 2) * 0.03; L.roll = Math.sin(s.t * 2.3 + i) * 0.015;
  return L;
}
function cartGalleonBillow(s, ph) {   // the canvas fills with speed (z scale of the billow), breathing in the gusts
  return 0.8 + 0.42 * Math.min(1.2, s.speed) + Math.sin(s.t * 3 + ph) * 0.06 + Math.sin(s.t * 7.7 + ph * 3) * 0.025 * (0.4 + s.speed);
}
function cartGalleonFlag(s) {   // streaming back from the mast top, flicking side to side
  const L = CART_GALLEON_L.flag; L.yaw = Math.PI + Math.sin(s.t * 6) * 0.2 + Math.sin(s.t * 13.1) * 0.06 + s.steer * 0.25; L.roll = Math.sin(s.t * 9.5) * 0.14;
  return L;
}
function cartGalleonLantern(s, i) {   // a pendulum: swings back as the ship speeds up, out of the turns, and keeps swaying
  const L = CART_GALLEON_L.lant[i], ph = i * 1.7;
  L.pitch = 0.18 * Math.min(1, s.speed) + Math.sin(s.t * 2.3 + ph) * 0.1; L.roll = Math.sin(s.t * 1.9 + ph) * 0.12 + s.steer * 0.3;
  return L;
}
// Turbo Escargot's joints (tools/blender/turbo_escargot.py: slug at the origin, eye stalk roots, SHELL_AT, the spiral's
// centre) and motions. The slug squashes about its sole (SOLE_Y, SOLE_Z); a part riding it moves with that point.
const CART_SNAIL = { eyeL: [0.22, 2.3, 2.55], eyeR: [-0.22, 2.3, 2.55], shell: [0, 1.15, -0.55], chase: [0, 2.45, -0.55], sole: [0.45, 0.3], da2: 1.261357 };
const CART_SNAIL_L = { ride: [{ j: CART_SNAIL.eyeL }, { j: CART_SNAIL.eyeR }, { j: CART_SNAIL.shell }], eye: [{ j: CART_SNAIL.eyeL }, { j: CART_SNAIL.eyeR }], shell: { j: CART_SNAIL.shell }, chase: { j: CART_SNAIL.chase }, k: [1, 1, 1] };
function cartSnailK(s) {   // the squash: [sx, sy, sz], a peristaltic wave; the body stretches longer with speed
  const K = CART_SNAIL_L.k, w = Math.sin(s.t * 3.4), sp = Math.min(1, s.speed);
  K[0] = 1 - 0.012 * w; K[1] = 1 + 0.03 * w - 0.015 * sp; K[2] = 1 - 0.022 * w + 0.03 * sp + 0.03 * s.boost;
  return K;
}
function cartSnailSquash(o, s) {
  const K = cartSnailK(s), so = CART_SNAIL.sole;
  o.sx = K[0]; o.sy = K[1]; o.sz = K[2]; o.y = so[0] * (1 - K[1]); o.z = so[1] * (1 - K[2]);
}
function cartSnailRide(s, J, i) {   // where the squash carries a riding part's joint J
  const L = CART_SNAIL_L.ride[i], K = cartSnailK(s), so = CART_SNAIL.sole;
  L.x = J[0] * (K[0] - 1); L.y = (J[1] - so[0]) * (K[1] - 1); L.z = (J[2] - so[1]) * (K[2] - 1);
  return L;
}
function cartSnailEye(s, i) {   // the stalks lean back at speed, sway out of phase and bob as the eyes look around
  const L = CART_SNAIL_L.eye[i], side = i ? -1 : 1, ph = i * 1.9;
  L.pitch = -0.2 + Math.sin(s.t * 2.6 + ph) * 0.14 - 0.3 * Math.min(1, s.speed) - 0.2 * s.boost;
  L.roll = side * (0.16 + Math.sin(s.t * 1.9 + ph) * 0.13) - s.steer * 0.2; L.yaw = Math.sin(s.t * 1.3 + ph) * 0.25;
  L.y = 0.04 * Math.sin(s.t * 4.4 + ph);
  return L;
}
function cartSnailShell(s) {   // a gentle wobble, rocking back on a boost
  const L = CART_SNAIL_L.shell; L.roll = Math.sin(s.t * 2.2) * 0.035 - s.steer * 0.03; L.pitch = -s.boost * 0.06 + Math.sin(s.t * 1.7) * 0.012;
  return L;
}
function cartSnailChase(s) {   // the chase lights' phase: turning back along the spiral (outward), looping every two slots
  const dt = s._snT === undefined ? 0 : Math.max(0, Math.min(0.1, s.t - s._snT)); s._snT = s.t;
  s._snPh = ((s._snPh || 0) + dt * (0.7 + 1.1 * Math.min(1, s.speed) + 3 * s.boost + 2 * s.fire)) % CART_SNAIL.da2;
  CART_SNAIL_L.chase.pitch = -s._snPh;
  return -s._snPh;
}
// Jelly Jolt's joints (tools/blender/jelly_jolt.py: BELL_AT, the core, TENT_A roots at TENT_R / TENT_Y, knees SEG1
// below) and motions. The bell scales about BELL_AT; a riding part's joint moves with that scale.
const CART_JELLY = (() => {
  const B = [0, 2.1, 0.45], tent = [40, 140, 220, 320].map(d => [Math.sin(d * Math.PI / 180) * 1.22, 2.2, B[2] + Math.cos(d * Math.PI / 180) * 1.22]);
  return { bell: B, zap: [0, B[1] + 0.72, B[2]], tent, knee: tent.map(p => [p[0], p[1] - 0.56, p[2]]) };
})();
const CART_JELLY_L = { k: [1, 1], float: [0, 1, 2, 3, 4, 5].map(() => ({ j: CART_JELLY.bell })), zap: { j: CART_JELLY.zap }, zapK: 1,
  tent: [0, 1, 2, 3].map(i => [{ j: CART_JELLY.tent[i] }, { j: CART_JELLY.knee[i] }]) };
function cartJellyC(s) {   // the swim stroke: 0..1, a quick contraction then a slow relax (about 0.8 strokes a second)
  const ph = (s.t * 0.8) % 1;
  return ph < 0.22 ? 0.5 - 0.5 * Math.cos(ph / 0.22 * Math.PI) : Math.exp(-(ph - 0.22) * 5);
}
function cartJellyPulse(s) {   // [radial, vertical] scale of the bell: narrower and taller on the stroke, puffed up when firing
  const K = CART_JELLY_L.k, c = cartJellyC(s);
  K[0] = 1 - 0.085 * c + 0.07 * s.fire; K[1] = 1 + 0.07 * c + 0.12 * s.fire;
  return K;
}
function cartJellyFloat(s, J, i) {   // the hover (rises on the stroke, leans into its swim) plus where the pulse carries J
  const L = CART_JELLY_L.float[i], K = cartJellyPulse(s), c = cartJellyC(s), B = CART_JELLY.bell, sp = Math.min(1, s.speed);
  L.x = (J[0] - B[0]) * (K[0] - 1); L.z = (J[2] - B[2]) * (K[0] - 1);
  L.y = (J[1] - B[1]) * (K[1] - 1) + 0.06 * c - 0.03 + 0.02 * Math.sin(s.t * 1.3);
  L.pitch = 0.07 * sp + 0.02 * Math.sin(s.t * 0.9); L.roll = -0.05 * s.steer + 0.025 * Math.sin(s.t * 0.7 + 1);
  return L;
}
function cartJellyZap(s) {   // static: on and off in a jittery rhythm, a new direction each flick, always crackling when it fires
  const n = Math.floor(s.t * 13), f = Math.abs((Math.sin(n * 91.7 + 0.3) * 43758.5453) % 1), L = CART_JELLY_L.zap;
  L.yaw = n * 2.39996; L.pitch = (f - 0.5) * 0.2;
  CART_JELLY_L.zapK = s.fire > 0.05 || f > 0.45 ? 0.85 + 0.35 * ((f * 7.3) % 1) + 0.3 * s.fire : 0.001;
  return L;
}
function cartJellyTent(s, i, seg) {   // seg 0: the upper half sways and trails; seg 1: the lower half follows a beat later
  const L = CART_JELLY_L.tent[i][seg], sp = Math.min(1.2, s.speed), c = cartJellyC(s), ph = i * 1.6 - seg * 1.1;
  L.pitch = (seg ? 0.3 : 0.42) * sp + (seg ? 0.26 : 0.17) * Math.sin(s.t * 2.2 + ph) - (seg ? 0.1 : 0.16) * c;
  L.roll = (seg ? 0.2 : 0.14) * Math.sin(s.t * 1.7 + i * 2 - seg * 0.9) + (seg ? 0 : 0.12 * s.steer);
  return L;
}
// per-car points the race sim reads from M.extra (the procedural values; a glb's body extras.extra JSON overrides)
// sight: [y, z] of the top of a tall sculpture, car-local: the chase camera rises just enough to see the road over it
const CART_GLB_EXTRA = {
  heart: { sight: [3.66, 0.8] },
  octo: { arms: 8, armZ: 0.55, chimney: [0, 4.7, -0.15] },
  galleon: { cannons: [[1.6, 1.55, -0.7], [1.6, 1.55, 0.6], [-1.6, 1.55, -0.7], [-1.6, 1.55, 0.6]] },
  snail: { rockets: [[0.95, 1.9, -1.75], [-0.95, 1.9, -1.75]] }
};
const CartGLB = {
  rigs: {},          // id -> { hi, lo } (BurnsGLTF.rig results)
  models: {},        // id+':lo' -> model object (built once)
  ready: false,
  _p: null,
  base() { return 'models/'; },
  // bone index for a root node name: the fixed car bones, then the parts in sorted name order
  boneFn(partNames) {
    const fixed = { body: CART_BONES.BODY, wheel_FL: CART_BONES.FL, wheel_FR: CART_BONES.FR, wheel_RL: CART_BONES.RL, wheel_RR: CART_BONES.RR, steer: CART_BONES.STEER };
    return name => {
      if (fixed[name] !== undefined) return fixed[name];
      if (name.startsWith('part_')) { const i = partNames.indexOf(name.slice(5)); return i < 0 ? null : CART_BONES.P0 + i; }
      return null;
    };
  },
  partNames(doc) {
    const nodes = doc.json.nodes || [], out = [];
    for (const r of doc.roots) { const n = nodes[r].name || ''; if (n.startsWith('part_') && BurnsGLTF.subtreeHasMesh(doc, r)) out.push(n.slice(5)); }
    return out.sort();
  },
  build(doc, lo) {
    const parts = this.partNames(doc);
    if (CART_BONES.P0 + parts.length > 16) throw new Error('cart glb: too many parts');
    const R = BurnsGLTF.rig(doc, { bone: this.boneFn(parts), minBones: CART_BONES.P0 + parts.length, ao: !lo, aoRes: 30 });
    R.partNames = parts;
    return R;
  },
  preload() {
    if (this._p) return this._p;
    // no loader, no fetch, or a file:// page (fetch can't read files and logs an error): keep the procedural cars
    if (typeof BurnsGLTF === 'undefined' || typeof fetch !== 'function' || (typeof location !== 'undefined' && location.protocol === 'file:')) { this.ready = true; return (this._p = Promise.resolve()); }
    // models/index.json (written by tools/build.js) lists the files that exist, so nothing missing is requested
    this._p = fetch(this.base() + 'index.json').then(r => r.ok ? r.json() : []).catch(() => []).then(list => {
      const have = new Set(Array.isArray(list) ? list : []), jobs = [];
      for (const [id, stem] of Object.entries(CART_GLB)) {
        for (const lo of [false, true]) {
          // the build ships .glb.gz (inflated in the browser); a plain .glb is accepted too
          let file = stem + (lo ? '_lo' : '') + '.glb';
          if (have.has(file + '.gz') && BurnsGLTF.canInflate()) file += '.gz';
          else if (!have.has(file)) { if (have.has(file + '.gz')) console.warn('cart: this browser cannot inflate ' + file + '.gz; using the procedural car'); continue; }
          jobs.push(BurnsGLTF.fetch(this.base() + file)
            .then(doc => { const R = this.build(doc, lo); (this.rigs[id] = this.rigs[id] || {})[lo ? 'lo' : 'hi'] = R; })
            .catch(e => { console.warn('cart: glb failed for ' + id + (lo ? ' (lo)' : '') + ': ' + (e && e.message || e)); }));
        }
      }
      return Promise.all(jobs);
    }).then(() => { this.ready = true; });
    return this._p;
  },
  // a model in CartModels.build's shape, or null (not loaded, or glb models switched off)
  model(id, lo) {
    if (typeof window !== 'undefined' && window.__cartNoGLB) return null;
    const rigs = this.rigs[id]; if (!rigs) return null;
    const R = lo ? (rigs.lo || rigs.hi) : (rigs.hi || rigs.lo); if (!R) return null;
    const key = id + (R === rigs.lo ? ':lo' : ':hi');
    if (this.models[key]) return this.models[key];
    const E = R.empties, X = R.extras || {}, b = R.bounds, fns = (X.rigV && CART_GLB_PARTS[id + ':' + X.rigV]) || CART_GLB_PARTS[id] || {};
    const pt = (n, d) => E[n] ? [E[n].x, E[n].y, E[n].z] : d;
    const lights = [];
    for (const [n, e] of Object.entries(E)) {
      if (!n.startsWith('light')) continue;
      const x = e.extras || {}, c = x.color || '#ffffff', L = { x: e.x, y: e.y, z: e.z, s: +x.size || 1, c, cc: burnsRGBf(c) };
      for (const k of ['big', 'head', 'tail', 'led']) if (x[k]) L[k] = 1;
      lights.push(L);
    }
    const parts = R.partNames.map((n, i) => ({ b: CART_BONES.P0 + i, fn: fns[n] || (() => {}) }));
    const M = {
      id, geo: R.geo, nb: R.nb, J: R.J, parts, seat: pt('seat', [0, 1.3, 0.8]), seatYaw: +X.seatYaw || 0,
      lights, muzzle: pt('muzzle', [0, 1.6, 2.6]), len: +X.len || (b[5] - b[2]), w: +X.w || (b[3] - b[0]), h: +X.h || b[4],
      wheelR: +X.wheelR || 0.5, steerTilt: X.steerTilt === undefined ? 0.45 : +X.steerTilt, driverScale: +X.driverScale || 1,
      extra: (typeof X.extra === 'string' ? JSON.parse(X.extra) : X.extra) || CART_GLB_EXTRA[id] || {}, glb: true, lo: R === rigs.lo
    };
    this.models[key] = M;
    return M;
  }
};
if (typeof window !== 'undefined') {
  window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { CartGLB, CART_CARS, CartModels });
  // declared later in the bundle: getters, so they resolve when asked for (tests drive the app through these)
  for (const k of ['CART_TRACK_ORDER', 'CART_ARENAS', 'CART_CUPS', 'CART_ITEMS', 'CART_OBJECTIVES', 'CART_ARENA_RULES', 'CART_ITEM_FX', 'cartSave', 'cartRollItem', 'cartArenaMastered', 'CartRaceScene', 'KartMenuScene']) Object.defineProperty(window.BRADY_BURNS, k, { get: () => eval(k), configurable: true });
}
