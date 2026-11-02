/* ============================================================
   BRADY-O BURNS — World 14 "Skydive Into the Burn": shared base
   Config + layout, small math helpers, a rigid multi-bone puppet
   (drawn by the engine's boss pass), the models (our own generic
   high-wing single-prop plane "Dust Bunny", a rainbow ram-air
   canopy, festival drones, rings, windsock, fuel truck) and the
   extra animations (pilot, freefall, canopy hang, tumble).
   Everything here is prefixed BW14_ / bw14.
   ============================================================ */

const BW14_CFG = {
  ID: 14,
  BOUNDS: [-600, -600, 600, 600],
  // the clock city: the Man at the origin; 12:00 = -Z (toward the Temple + deep playa)
  ESP: 140,                                   // Esplanade radius
  STREETS: [152, 176, 200, 224, 248, 272, 296, 320],
  CITY_R1: 330,
  H0: 2, H1: 10,                              // city spans 2:00 .. 10:00 (through 6:00)
  TEMPLE: { x: 0, z: -142 },
  MAN: { x: 0, z: 0 },
  // the airstrip east of the city: runway along -Z (north)
  RWY: { x: 410, z0: 252, z1: 22, w: 20 },
  APRON: { x: 452, z: 150 },
  SPAWN: { x: 462, z: 240, yaw: Math.PI },
  PARK: { x: 433, z: 140, yaw: -Math.PI / 2 },   // the Dust Bunny, parked facing the runway
  HANGAR: { x: 484, z: 118 },
  SHACK: { x: 458, z: 196 },
  SOCK: { x: 428, z: 66 },
  FUEL: { x: 506, z: 62 },
  RIGGER: { x: 474, z: 82 },
  BRIEF: { x: 486, z: 176 },
  // landing zone: the Glow Crew's camp at 4:40 & Esplanade (inner playa side)
  LZ: { x: 77, z: 92 },
  WIND: { x: -0.6, z: 2.9 },                  // m/s, blowing from ~12:00 toward 6:00
  // altitudes (m). The HUD shows feet x FT (an arcade scale: 400 m reads 12,000 ft)
  FT: 30,
  EXIT_ALT: 400, PULL_HI: 160, PULL_LO: 100, PULL_DEAD: 64, HARD_DECK: 40
};

/* ---------------- helpers ---------------- */
// clock position: hour (0..12, 12:00 = -Z), radius -> {x, z}
function bw14Clock(h, r) { const a = h / 12 * TAU; return { x: Math.sin(a) * r, z: -Math.cos(a) * r }; }
// clock hour of a world point (0..12)
function bw14Hour(x, z) { let a = Math.atan2(x, -z); if (a < 0) a += TAU; return a / TAU * 12; }
const bw14Tmp = new Float32Array(12);
// rotate a local vector by (yaw, pitch, roll) like BurnsM.a34Set (R = Ry * Rx * Rz)
function bw14Rot(yaw, pitch, roll, x, y, z, out) {
  BurnsM.a34Set(bw14Tmp, 0, 0, 0, 0, yaw, pitch, roll, 1, 1, 1);
  out = out || [0, 0, 0];
  out[0] = bw14Tmp[0] * x + bw14Tmp[1] * y + bw14Tmp[2] * z;
  out[1] = bw14Tmp[4] * x + bw14Tmp[5] * y + bw14Tmp[6] * z;
  out[2] = bw14Tmp[8] * x + bw14Tmp[9] * y + bw14Tmp[10] * z;
  return out;
}
function bw14Flag(k, v) { return BurnsSave.flag(BW14_CFG.ID, k, v); }
// a world-safe timer list (runs inside the world's update, pauses with the game)
function bw14After(g, sec, fn) { const S = g.bw14; if (!S) return; (S.timers || (S.timers = [])).push({ t: sec, fn }); }
function bw14Timers(g, dt) {
  const S = g.bw14; if (!S || !S.timers || !S.timers.length) return;
  for (const t of S.timers.slice()) { t.t -= dt; if (t.t <= 0 && !t.done) { t.done = true; try { t.fn(g); } catch (e) { if (Game.reportError) Game.reportError(e); else console.error(e); } } }
  S.timers = S.timers.filter(t => !t.done);
}

/* ---------------- rigid multi-bone puppet ----------------
   Registered with g.addBoss(p): the engine updates it every step and draws it
   with one skinned draw call. No .x field on purpose (the minimap marks bosses). */
class BW14_Puppet {
  constructor(g, geo, nb) {
    this.g = g; this.nb = nb; this.model = { geo }; this.ch = { bones: new Float32Array(nb * 12), nb, face: 0 };
    this.hidden = false; this._m = new Float32Array(12); this.tick = null;
    for (let i = 0; i < nb; i++) this.off(i);
  }
  set(i, x, y, z, yaw, pitch, roll, s) { const k = s === undefined ? 1 : s; BurnsM.a34Set(this.ch.bones, i * 12, x, y, z, yaw || 0, pitch || 0, roll || 0, k, k, k); return this; }
  // bone i = bone pi * T(x,y,z) R(yaw,pitch,roll) S
  child(i, pi, x, y, z, yaw, pitch, roll, s) { const k = s === undefined ? 1 : s; BurnsM.a34Set(this._m, 0, x, y, z, yaw || 0, pitch || 0, roll || 0, k, k, k); BurnsM.a34Mul(this.ch.bones, i * 12, this.ch.bones, pi * 12, this._m, 0); return this; }
  off(i) { const B = this.ch.bones, k = i * 12; B.fill(0, k, k + 12); B[k + 7] = -999; return this; }
  point(i, x, y, z, out) { return BurnsM.a34Pt(this.ch.bones, i * 12, x, y, z, out || [0, 0, 0]); }
  update(dt) { if (this.tick) this.tick(dt); }
}

/* ---------------- models ---------------- */
const BW14_PLANE = {
  GEAR_H: 1.62,               // origin height above the ground when parked (tyre bottoms at -GEAR_H)
  PROP: [0, 0.02, 3.02],      // prop hub (bone 1)
  AIL: [3.55, 0.79, -0.3],    // aileron hinge (bone 2 = left/+X, bone 3 = right/-X)
  ELEV: [0, 0.42, -4.3],      // elevator hinge (bone 4)
  RUD: [0, 0.5, -4.36],       // rudder hinge (bone 5)
  STEP: [-0.95, -0.98, 0.42], // the climb-out step on the right gear leg
  NB: 6
};
const BW14_Model = {
  // Catmull-Rom through rows [z, a, b, c...] at z
  rows(R, z) {
    if (z <= R[0][0]) return R[0].slice(1);
    for (let i = 0; i < R.length - 1; i++) {
      const A = R[i], B = R[i + 1];
      if (z <= B[0]) {
        const P0 = R[Math.max(0, i - 1)], P3 = R[Math.min(R.length - 1, i + 2)], t = (z - A[0]) / (B[0] - A[0]);
        const out = []; for (let k = 1; k < A.length; k++) { const p0 = P0[k], p1 = A[k], p2 = B[k], p3 = P3[k]; out.push(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)); }
        return out;
      }
    }
    return R[R.length - 1].slice(1);
  },
  /* The "Dust Bunny": a chubby, generic high-wing single-prop with bunny ears (our own design).
     o: { skinned (bones 0..5 as BW14_PLANE), body, belly, stripe, trim, name, ears, led } */
  plane(m, o) {
    o = o || {};
    const P = BW14_PLANE, sk = !!o.skinned;
    const body = o.body || '#f4ecd8', belly = o.belly || '#2fa8b8', stripe = o.stripe || '#ff7a3a', trim = o.trim || '#ff5a9a';
    const part = (bone, h, fn) => { m.push(); if (sk) { m.setBone(bone); } else m.tf(h[0], h[1], h[2]); fn(); m.pop(); if (sk) m.setBone(0); };
    if (sk) m.setBone(0);
    // fuselage: superelliptic sections swept along +Z; the tail cone rises
    const FUS = [[-4.5, 0.06, 0.07, 0.46], [-3.8, 0.16, 0.2, 0.38], [-2.8, 0.31, 0.39, 0.25], [-1.6, 0.47, 0.57, 0.1], [-0.4, 0.57, 0.69, 0.02], [0.8, 0.6, 0.72, 0], [1.7, 0.57, 0.64, -0.02], [2.4, 0.5, 0.54, -0.04], [2.86, 0.42, 0.44, -0.04], [3.0, 0.33, 0.33, -0.03]];
    const Z0 = -4.5, Z1 = 3.0, se = (s, n) => Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    m.shine(2);
    m.surf(m.lo ? 14 : 28, m.lo ? 10 : 20, (u, v, out) => {
      const z = lerp(Z0, Z1, v), r = BW14_Model.rows(FUS, z), th = u * TAU;
      out[0] = se(Math.sin(th), 2.5) * r[0]; out[1] = r[2] + se(Math.cos(th), 2.5) * r[1]; out[2] = z;
    }, { wrapU: true, out: [0, 0.1, -0.5], colFn: (u, v) => { const c = Math.cos(u * TAU); return c < -0.32 ? belly : c < -0.12 ? stripe : body; } });
    // tail cap + cowling face
    m.color(body); m.ball(0, 0.46, -4.5, 0.075, { seg: 8, rings: 5 });
    m.color('#2a2630').shine(1); m.push(); m.tf(0, -0.03, 2.99, 0, Math.PI / 2, 0); m.lathe([[0.33, 0], [0.3, 0.02], [0.12, 0.03], [0, 0.03]], { seg: m.lo ? 10 : 18 }); m.pop();
    m.color('#3a3a44').shine(2); m.limb(0.22, -0.4, 2.5, 0.26, -0.47, 1.6, 0.045, 0.04, { seg: 6 });
    // windows + windshield (dark glossy glass)
    m.color('#1c2a46', 0.06).shine(3);
    for (const sd of [1, -1]) {
      m.roundBox(sd * 0.585, 0.33, 0.62, 0.05, 0.4, 0.98, 0.07);
      m.roundBox(sd * 0.565, 0.31, -0.42, 0.05, 0.36, 0.8, 0.07);
    }
    m.push(); m.tf(0, 0.5, 1.62, 0, 0.62, 0); m.roundBox(0, 0, 0, 1.0, 0.06, 0.82, 0.03); m.pop();
    m.emissive(0);
    // door seam + the stripe's LED piping
    m.color('#3a2a30').shine(0); m.roundBox(-0.6, -0.02, 0.62, 0.03, 0.9, 0.04, 0.012); m.roundBox(-0.6, -0.02, 0.1, 0.03, 0.9, 0.04, 0.012);
    if (o.led !== false) { for (const sd of [1, -1]) { m.color(sd > 0 ? '#38f2ff' : '#ff4fd8', 1); m.limb(sd * 0.52, -0.2, 2.2, sd * 0.28, 0.08, -3.0, 0.022, 0.018, { seg: 4 }); } m.emissive(0); }
    // name decals on the rear fuselage
    if (o.name !== false && typeof BURNS_ATLAS !== 'undefined' && BURNS_ATLAS.sign) {
      const reg = BURNS_ATLAS.sign(o.name || 'DUST BUNNY', { bg: null, fg: '#2a1a30', size: 30, pad: 2 });
      if (reg) { const w = 1.5, h = w / (reg.aspect || 4); m.color(body); for (const sd of [1, -1]) { m.push(); m.tf(sd * 0.36, 0.3, -2.15, sd * Math.PI / 2); m.decal(0, 0, 0, w, h, reg); m.pop(); } }
    }
    // the high wing (+ root fairing, flaps, tips, LED leading edge)
    m.color(body).shine(2);
    m.roundBox(0, 0.9, 0.41, 10.8, 0.24, 1.38, 0.11);
    m.roundBox(0, 0.77, 0.38, 1.12, 0.16, 1.5, 0.07);
    m.color(shade(body, -0.06)); for (const sd of [1, -1]) m.roundBox(sd * 1.42, 0.84, -0.5, 1.7, 0.1, 0.46, 0.04);
    m.color(trim); for (const sd of [1, -1]) m.roundBox(sd * 5.12, 0.9, 0.36, 0.7, 0.27, 1.5, 0.12);
    m.color(stripe); for (const sd of [1, -1]) m.roundBox(sd * 3.2, 1.025, 0.62, 2.6, 0.02, 0.18, 0.008);
    if (o.led !== false) { m.color('#ff4fd8', 1); m.limb(-5.2, 0.9, 1.1, -0.6, 0.9, 1.1, 0.03, 0.03, { seg: 4 }); m.color('#38f2ff', 1); m.limb(0.6, 0.9, 1.1, 5.2, 0.9, 1.1, 0.03, 0.03, { seg: 4 }); m.emissive(0); }
    // struts
    m.color('#b8b8c4').shine(2);
    for (const sd of [1, -1]) m.limb(sd * 0.52, -0.4, 0.38, sd * 2.75, 0.78, 0.38, 0.055, 0.05, { seg: 6 });
    // ailerons
    for (const sd of [1, -1]) part(sd > 0 ? 2 : 3, [sd * P.AIL[0], P.AIL[1], P.AIL[2]], () => { m.color(shade(body, -0.08)).shine(2); m.roundBox(0, 0, -0.22, 2.5, 0.1, 0.44, 0.04); });
    // tail: stabilizer, fin + heart, elevator, rudder
    m.color(body).shine(2);
    m.roundBox(0, 0.42, -3.95, 3.4, 0.1, 0.72, 0.045);
    m.push(); m.tf(0, 1.02, -3.86, 0, -0.32, 0); m.roundBox(0, 0, 0, 0.1, 1.25, 0.82, 0.045); m.pop();
    m.color(trim, 0.35); for (const sd of [1, -1]) { m.push(); m.tf(sd * 0.06, 1.05, -3.84, sd * Math.PI / 2); m.extrude([[0, -0.2], [0.21, 0.02], [0.17, 0.15], [0.08, 0.17], [0, 0.08], [-0.08, 0.17], [-0.17, 0.15], [-0.21, 0.02]], 0.02, { convex: false }); m.pop(); } m.emissive(0);
    part(4, P.ELEV, () => { m.color(stripe).shine(2); m.roundBox(0, 0, -0.18, 3.2, 0.08, 0.38, 0.035); });
    part(5, P.RUD, () => { m.color(trim).shine(2); m.push(); m.tf(0, 0.6, -0.12, 0, -0.18, 0); m.roundBox(0, 0, 0, 0.08, 1.15, 0.34, 0.035); m.pop(); });
    // landing gear: spring legs, wheel pants, tyres; nose gear
    m.color('#4a4a54').shine(2);
    for (const sd of [1, -1]) m.limb(sd * 0.45, -0.52, 0.02, sd * 1.28, -1.3, 0.02, 0.05, 0.045, { seg: 6 });
    m.limb(0, -0.42, 2.18, 0, -1.33, 2.36, 0.045, 0.04, { seg: 6 });
    m.color('#1a1a1e').shine(1);
    for (const sd of [1, -1]) { m.push(); m.tf(sd * 1.3, -1.36, 0.0, 0, 0, Math.PI / 2); m.roundCyl(0, -0.08, 0, 0.26, 0.16, 0.06, { seg: m.lo ? 8 : 14 }); m.pop(); }
    m.push(); m.tf(0, -1.38, 2.36, 0, 0, Math.PI / 2); m.roundCyl(0, -0.07, 0, 0.24, 0.14, 0.05, { seg: m.lo ? 8 : 12 }); m.pop();
    m.color(stripe).shine(2);
    for (const sd of [1, -1]) m.ellipsoid(sd * 1.3, -1.3, 0.06, 0.16, 0.25, 0.5, { seg: m.lo ? 8 : 12, rings: m.lo ? 5 : 8 });
    m.ellipsoid(0, -1.32, 2.38, 0.12, 0.2, 0.34, { seg: m.lo ? 8 : 10, rings: m.lo ? 5 : 7 });
    // the climb-out step (right side)
    m.color('#c8c8d0'); m.roundBox(P.STEP[0], P.STEP[1], P.STEP[2], 0.34, 0.05, 0.26, 0.02);
    // bunny ears on the wing (furry cream with pink insides)
    if (o.ears !== false) for (const sd of [1, -1]) {
      m.push(); m.tf(sd * 0.3, 1.02, 0.42, sd * 0.12, -0.08, -sd * 0.22);
      m.color(body).shine(1); m.ellipsoid(0, 0.6, 0, 0.15, 0.62, 0.075, { seg: m.lo ? 8 : 12, rings: m.lo ? 6 : 9 });
      m.color('#ff8ac0'); m.ellipsoid(0, 0.62, 0.05, 0.085, 0.46, 0.035, { seg: m.lo ? 8 : 10, rings: m.lo ? 5 : 7 });
      m.pop();
    }
    // propeller (spinner with a pink bunny nose + two blades)
    part(1, P.PROP, () => {
      m.push(); m.tf(0, 0, 0, 0, Math.PI / 2, 0); m.color(trim).shine(3); m.lathe([[0, 0], [0.27, 0], [0.27, 0.06], [0.2, 0.26], [0.08, 0.42], [0, 0.45]], { seg: m.lo ? 10 : 16 }); m.pop();
      m.color('#ff3a7a', 0.3).shine(2); m.ball(0, 0, 0.45, 0.07, { seg: 8, rings: 5 }); m.emissive(0);
      for (const sd of [1, -1]) {
        m.push(); m.tf(0, sd * 0.84, 0.1, sd * 0.32, 0, 0);
        m.color('#2a2a32').shine(2); m.roundBox(0, 0, 0, 0.19, 1.36, 0.05, 0.025);
        m.color('#ffd84a'); m.roundBox(0, sd * 0.62, 0, 0.19, 0.16, 0.056, 0.025);
        m.pop();
      }
    });
    m.shine(0).emissive(0);
    return { cols: [] };
  },
  // colliders for a parked plane (local, origin on the ground under the wing)
  planeCols() {
    const h = BW14_PLANE.GEAR_H;
    return [
      { t: 'box', x: 0, z: -0.5, hx: 0.62, hz: 3.6, y0: 0.2, y1: h + 0.75 },                 // fuselage (walkable roof)
      { t: 'box', x: 0, z: 0.41, hx: 5.4, hz: 0.7, y0: h + 0.78, y1: h + 1.02, solid: false }, // wing (stand on it)
      { t: 'cyl', x: 1.3, z: 0.05, r: 0.28, y0: 0, y1: 0.6, camPass: true }, { t: 'cyl', x: -1.3, z: 0.05, r: 0.28, y0: 0, y1: 0.6, camPass: true }
    ];
  },
  /* rainbow ram-air canopy. Origin at the canopy centre; risers meet at (0, -5.0, 0).
     Bones: 0 canopy + lines, 1 left trailing-edge flap, 2 right flap (rotate pitch < 0 = pulled down). */
  canopy(m) {
    const RA = 6.6, HALF = 3.6, CH = 1.45, cols = ['#ff4f6a', '#ff8a3a', '#ffd84a', '#7ae85a', '#38c8ff', '#9a6bff', '#ff4fd8'];
    const pt = (s, ph, out) => { // s: span -1..1, ph: around the airfoil
      const a = s * HALF / RA, nx = Math.sin(a), ny = Math.cos(a);
      const z = CH * Math.cos(ph) + 0.15, sp = Math.sin(ph), h = sp * (sp > 0 ? 0.3 : 0.1) * (0.72 + 0.28 * Math.cos(ph));
      out[0] = RA * nx + nx * h; out[1] = RA * ny - RA + ny * h; out[2] = z; return out;
    };
    m.setBone(0); m.shine(1);
    for (let c = 0; c < 7; c++) {
      const s0 = -1 + c * 2 / 7, s1 = s0 + 2 / 7;
      m.color(cols[c]);
      m.surf(3, m.lo ? 10 : 16, (u, v, out) => pt(lerp(s0, s1, u), v * TAU, out), { wrapV: true, out: true });
      // cell ribs (darker seams) on the underside
      m.color(shade(cols[c], -0.25)); const q = pt(s0, -Math.PI / 2, [0, 0, 0]); m.limb(q[0], q[1] - 0.02, -1.2, q[0], q[1] - 0.02, 1.4, 0.03, 0.03, { seg: 4 });
    }
    // end cells (closed sides)
    m.color('#ff4fd8'); for (const s of [-1, 1]) { const q = pt(s, 0, [0, 0, 0]); m.ellipsoid(q[0], q[1], 0.15, 0.06, 0.2, CH, { seg: 8, rings: 6 }); }
    // lines to the risers
    m.color('#3a3440').shine(0);
    const L = [0, 0, 0];
    for (const s of [-0.9, -0.55, -0.2, 0.2, 0.55, 0.9]) for (const zz of [1.1, 0.2, -0.75]) {
      const a = s * HALF / RA, x = RA * Math.sin(a), y = RA * Math.cos(a) - RA - 0.1, side = s > 0 ? 1 : -1;
      L[0] = side * 0.2; L[1] = -5.0; L[2] = 0.05;
      m.limb(x, y, zz, L[0], L[1], L[2], 0.02, 0.02, { seg: 3 });
    }
    // slider + risers
    m.color('#ffd84a').shine(1); m.roundBox(0, -3.9, 0.05, 0.9, 0.04, 0.7, 0.02);
    m.color('#2a2a30'); for (const sd of [1, -1]) m.limb(sd * 0.2, -5.0, 0.05, sd * 0.24, -5.6, 0.1, 0.03, 0.03, { seg: 4 });
    // pilot chute + bridle
    m.color('#ff4fd8'); m.limb(0, 0.3, -0.2, 0, 1.2, -1.4, 0.015, 0.015, { seg: 3 }); m.push(); m.tf(0, 1.3, -1.5, 0, -0.9, 0); m.ellipsoid(0, 0, 0, 0.42, 0.26, 0.42, { phi1: Math.PI / 2, seg: 10, rings: 4 }); m.pop();
    // trailing-edge flaps (toggles)
    for (const sd of [1, -1]) {
      m.setBone(sd > 0 ? 1 : 2);
      m.color(sd > 0 ? cols[6] : cols[0]).shine(1); m.roundBox(0, 0, -0.25, 2.3, 0.07, 0.5, 0.03);
    }
    m.setBone(0); m.shine(0);
  },
  canopyFlapHinge(sd) { const RA = 6.6, a = sd * 0.62 * 3.6 / RA; return [RA * Math.sin(a), RA * Math.cos(a) - RA - 0.05, -1.25]; },
  // a festival drone: body, 4 arms + rotors, LED ring (local, ~1 m across before scale)
  drone(m, col) {
    m.color('#2a2a34').shine(2); m.roundBox(0, 0, 0, 0.42, 0.14, 0.42, 0.06);
    m.color('#5a5a66'); for (const a of [0.785, 2.356, 3.927, 5.498]) { const x = Math.sin(a) * 0.42, z = Math.cos(a) * 0.42; m.limb(0, 0, 0, x, 0.02, z, 0.025, 0.025, { seg: 4 }); m.color('#d8d8e0'); m.roundCyl(x, 0.04, z, 0.18, 0.02, 0.01, { seg: 10 }); m.color('#5a5a66'); }
    m.color(col || '#38f2ff', 1); m.torus(0, -0.08, 0, 0.16, 0.035, { seg: 10, tseg: 4 }); m.ball(0, -0.11, 0, 0.06, { seg: 6, rings: 4 }); m.emissive(0).shine(0);
  },
  // glowing hoop (stands up facing +Z unless flat)
  ring(m, col, flat) {
    m.push(); if (!flat) m.tf(0, 0, 0, 0, Math.PI / 2, 0);
    m.color(col, 1).shine(2); m.torus(0, 0, 0, 1, 0.07, { seg: 28, tseg: 6 });
    m.color('#ffffff', 1); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; m.ball(Math.sin(a) * 1, 0, Math.cos(a) * 1, 0.1, { seg: 6, rings: 4 }); }
    m.pop(); m.emissive(0).shine(0);
  },
  // windsock (local origin at the pivot ring, sock streams along +Z)
  sock(m) {
    const prof = []; for (let i = 0; i <= 5; i++) { const t = i / 5, c = i % 2 ? '#f4f0e8' : '#ff6a1a'; prof.push([lerp(0.48, 0.17, t), t * 2.8, c]); if (i < 5) prof.push([lerp(0.48, 0.17, (i + 1) / 5), (i + 1) / 5 * 2.8, c]); }
    m.push(); m.tf(0, 0, 0, 0, Math.PI / 2, 0); m.color('#ff6a1a').shine(1); m.lathe(prof, { seg: 12 }); m.lathe(prof.map(p => [p[0] * 0.96, p[1], p[2]]), { seg: 12, flip: true }); m.pop();
    m.color('#c8c8d0').shine(2); m.torus(0, 0, 0, 0.5, 0.03, { seg: 12, tseg: 4 }); m.shine(0);
  },
  // the fuel truck (drivable art-car build: front +Z, seat on the left of the cab)
  fuelTruck(m) {
    m.color('#e8e4dc').shine(2);
    m.roundBox(0, 1.25, 2.15, 2.3, 1.7, 1.9, 0.32);                       // cab
    m.color('#1c2a46', 0.05).shine(3); m.roundBox(0, 1.55, 3.06, 1.9, 0.7, 0.08, 0.05); for (const sd of [1, -1]) m.roundBox(sd * 1.14, 1.55, 2.2, 0.06, 0.6, 1.0, 0.05);
    m.emissive(0);
    m.color('#ff3a2a').shine(2); m.roundBox(0, 0.62, 2.15, 2.36, 0.26, 1.96, 0.1);
    m.color('#3a3a44').shine(1); m.roundBox(0, 0.55, -0.6, 2.0, 0.3, 5.6, 0.08);   // chassis
    m.color('#d8dce4').shine(3); m.push(); m.tf(0, 1.75, -0.9, 0, Math.PI / 2, 0); m.lathe([[0, 0], [0.95, 0.02], [1.05, 0.25], [1.05, 4.0], [0.95, 4.25], [0, 4.28]], { seg: 18, sx: 1.12, sz: 0.95 }); m.pop();
    m.color('#ff3a2a'); for (const zz of [-2.1, -0.4, 1.2]) { m.push(); m.tf(0, 1.75, zz, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 1.1, 0.06, { seg: 18, tseg: 4, sy: 1 }); m.pop(); }
    m.color('#1a1a1e').shine(1);
    for (const [x, z] of [[1.05, 2.2], [-1.05, 2.2], [1.05, -1.6], [-1.05, -1.6], [1.05, -2.6], [-1.05, -2.6]]) { m.push(); m.tf(x, 0.5, z, 0, 0, Math.PI / 2); m.roundCyl(0, -0.2, 0, 0.5, 0.4, 0.12, { seg: 12 }); m.pop(); }
    m.color('#ffe24a', 1); m.ball(0.8, 1.0, 3.1, 0.12, { seg: 8, rings: 5 }); m.ball(-0.8, 1.0, 3.1, 0.12, { seg: 8, rings: 5 }); m.color('#ff8a1a', 1); m.roundBox(0, 2.2, 2.0, 0.8, 0.14, 0.3, 0.06); m.emissive(0);
    if (typeof BURNS_ATLAS !== 'undefined') { const reg = BURNS_ATLAS.sign('AV FUEL', { bg: '#d8dce4', fg: '#c82a1a', size: 30, pad: 4 }); if (reg) { m.color('#ffffff'); for (const sd of [1, -1]) { m.push(); m.tf(sd * 1.2, 1.75, -0.9, sd * Math.PI / 2); m.decal(0, 0, 0, 2.6, 2.6 / (reg.aspect || 3), reg); m.pop(); } } }
    m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: -0.3, hx: 1.2, hz: 3.4, y0: 0, y1: 2.8 }], seat: [0.45, 1.05, 2.2], poofers: [], w: 2.4, len: 7, top: 2.8 };
  }
};

/* ---------------- animations (Brady in the plane, in freefall, under canopy) ---------------- */
(() => {
  const B = BURNS_BONES;
  const S = (P, b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  BURNS_ANIMS.bw14Pilot = (P, t, k) => {
    const st = (k && k.steer) || 0;
    S(P, B.HIPS, -0.1); S(P, B.CHEST, 0.08); S(P, B.HEAD, -0.05 + Math.sin(t * 1.7) * 0.03, st * 0.35);
    S(P, B.THIGH_L, -1.5); S(P, B.SHIN_L, 1.45); S(P, B.THIGH_R, -1.5); S(P, B.SHIN_R, 1.45);
    S(P, B.UARM_L, -1.05 + st * 0.25, 0, 0.25); S(P, B.FARM_L, -0.7); S(P, B.UARM_R, -1.05 - st * 0.25, 0, -0.25); S(P, B.FARM_R, -0.7);
    P.y = -0.42; P.face = (k && k.happy) ? 3 : 0;
  };
  // belly-to-earth box position: body flat, head toward the direction of travel
  BURNS_ANIMS.bw14Free = (P, t, k) => {
    const w = Math.sin(t * 9) * 0.06, tr = (k && k.track) || 0, turn = (k && k.turn) || 0;
    P.pitch = Math.PI / 2 - 0.08 + tr * 0.25; P.pivot = 0.95; P.roll = -turn * 0.35;
    S(P, B.CHEST, -0.28 + tr * 0.2); S(P, B.HEAD, -0.75 - tr * 0.1);
    const ax = tr > 0.3 ? 0.9 : 0;       // tracking: arms sweep back along the body
    S(P, B.UARM_L, -0.35 + ax * 0.9 + w, 0, 1.45 - ax * 1.1 + turn * 0.3); S(P, B.FARM_L, -1.25 + ax * 1.1);
    S(P, B.UARM_R, -0.35 + ax * 0.9 - w, 0, -1.45 + ax * 1.1 + turn * 0.3); S(P, B.FARM_R, -1.25 + ax * 1.1);
    S(P, B.THIGH_L, 0.2, 0, 0.22); S(P, B.SHIN_L, 1.25 - tr * 0.9 + w); S(P, B.THIGH_R, 0.2, 0, -0.22); S(P, B.SHIN_R, 1.25 - tr * 0.9 - w);
    S(P, B.HAIR, -0.8); P.face = 3;
  };
  // hanging in the harness under the canopy; k.l / k.r = toggle pulls 0..1
  BURNS_ANIMS.bw14Hang = (P, t, k) => {
    const l = (k && k.l) || 0, r = (k && k.r) || 0, sw = Math.sin(t * 1.6) * 0.05;
    S(P, B.HIPS, 0.1); S(P, B.CHEST, -0.05); S(P, B.HEAD, -0.15);
    S(P, B.THIGH_L, -0.55 + sw); S(P, B.SHIN_L, 0.5); S(P, B.THIGH_R, -0.45 - sw); S(P, B.SHIN_R, 0.45);
    S(P, B.UARM_L, lerp(-2.75, -0.55, l), 0, lerp(0.35, 0.25, l)); S(P, B.FARM_L, lerp(-0.25, -0.5, l));
    S(P, B.UARM_R, lerp(-2.75, -0.55, r), 0, lerp(-0.35, -0.25, r)); S(P, B.FARM_R, lerp(-0.25, -0.5, r));
    P.roll = (k && k.roll) || 0; P.pivot = 1.5; P.face = 3;
  };
  BURNS_ANIMS.bw14Tumble = (P, t) => {
    const s = Math.sin(t * 16);
    S(P, B.THIGH_L, -1.2 + s * 0.6); S(P, B.SHIN_L, 1.4); S(P, B.THIGH_R, -0.4 - s * 0.6); S(P, B.SHIN_R, 1.0);
    S(P, B.UARM_L, -2.4 + s, 0, 0.9); S(P, B.UARM_R, -2.0 - s, 0, -0.9); S(P, B.CHEST, 0.6); S(P, B.HEAD, 0.4);
    P.pitch = t * 11; P.pivot = 0.6; P.face = 2;
  };
  BURNS_ANIMS.bw14Splat = (P, t) => {
    const u = Math.min(1, t * 5);
    S(P, B.THIGH_L, 0.25, 0, 0.35); S(P, B.SHIN_L, 1.5 * u); S(P, B.THIGH_R, 0.25, 0, -0.35); S(P, B.SHIN_R, 1.4 * u);
    S(P, B.UARM_L, -0.3, 0, 1.4); S(P, B.UARM_R, -0.3, 0, -1.4); S(P, B.HEAD, -0.5);
    P.pitch = Math.PI / 2 * u; P.pivot = 0.12; P.y = -0.05; P.face = 2;
  };
  BURNS_ANIMS.bw14Climb = (P, t) => { // hanging off the wing strut before the jump
    const s = Math.sin(t * 7) * 0.05;
    S(P, B.UARM_L, -2.9, 0, 0.35); S(P, B.FARM_L, -0.2); S(P, B.UARM_R, -2.6, 0, -0.2); S(P, B.FARM_R, -0.4);
    S(P, B.THIGH_L, -0.3 + s); S(P, B.SHIN_L, 0.4); S(P, B.THIGH_R, 0.3 - s); S(P, B.SHIN_R, 0.2);
    S(P, B.CHEST, -0.1); S(P, B.HEAD, -0.3); S(P, B.HAIR, -0.6); P.face = 3;
  };
})();

/* ---------------- gear: Dusty's leather flight cap, Brady's parachute rig ---------------- */
(() => {
  if (typeof BurnsRig === 'undefined' || !BurnsRig.defineHat) return;
  BurnsRig.defineHat('bw14FlightCap', (m, A, H) => {
    const c = H.col || '#6a3a1e', B = BURNS_BONES;
    m.color(c).shine(1); m.ellipsoid(0, 0.25, 0.0, 0.205, 0.2, 0.215, { phi1: Math.PI * 0.56, seg: A.lo ? 12 : 18, rings: A.lo ? 5 : 8 });
    for (const sd of [1, -1]) { m.ellipsoid(sd * 0.19, 0.16, -0.01, 0.045, 0.1, 0.07, { seg: 8, rings: 5 }); }
    m.color('#3a2410'); m.torus(0, 0.33, 0.0, 0.2, 0.016, { seg: A.lo ? 10 : 16, tseg: 4 });
    // goggles pushed up on the cap
    m.color('#2a2420'); m.limb(-0.16, 0.37, 0.1, 0.16, 0.37, 0.1, 0.02, 0.02, { seg: 5 });
    m.color('#7ad8ff', 0.15).shine(3); for (const sd of [1, -1]) { m.push(); m.tf(sd * 0.075, 0.38, 0.15, 0, -0.5, 0); m.roundCyl(0, 0, 0, 0.055, 0.04, 0.012, { seg: 10 }); m.pop(); }
    m.emissive(0).shine(0); void B;
  });
  BurnsRig.defineAcc('bw14Rig', (m, A) => {
    const h = A.h;
    m.color('#2a2a34').shine(1);
    m.roundBox(0, 0.26 * h, -A.torsoR(0.26 * h) * A.TZ - 0.1, 0.34, 0.42 * h, 0.2, 0.07);           // container
    m.color('#ff4fd8'); m.roundBox(0, 0.42 * h, -A.torsoR(0.26 * h) * A.TZ - 0.21, 0.28, 0.07, 0.02, 0.01); // flap
    m.color('#ffd84a', 0.3); m.roundBox(-0.12, 0.08 * h, -A.torsoR(0.08 * h) * A.TZ - 0.12, 0.07, 0.06, 0.04, 0.02); m.emissive(0); // the pilot-chute handle
    m.color('#1a1a20'); for (const sd of [1, -1]) { const a = A.torsoPt(sd * 0.5, 0.47 * h, 0.012), b = A.torsoPt(sd * 0.4, 0.02, 0.03); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.018, 0.018, { seg: 4, sz: 0.5 }); }
    m.color('#ff3a3a', 0.2); { const p = A.torsoPt(0.25, 0.22 * h, 0.04); m.roundBox(p[0], p[1], p[2], 0.06, 0.08, 0.03, 0.015); } m.emissive(0); // red cutaway pillow
    m.shine(0);
  });
})();

/* ---------------- play order: make sure World 14 sits right before the finale ----------------
   (the engine's BURNS_WORLD_ORDER lists id 14 once the engine author adds it; this only fills the
   gap if it isn't there yet, so the hub and unlocking work either way) */
(() => {
  try {
    if (BURNS_WORLD_ORDER.indexOf(14) < 0) { const i = BURNS_WORLD_ORDER.indexOf(10); BURNS_WORLD_ORDER.splice(i < 0 ? BURNS_WORLD_ORDER.length : i, 0, 14); }
    if (!BURNS_WORLD_META.find(m => m.id === 14)) BURNS_WORLD_META.push({ id: 14, name: 'Skydive Into the Burn', sub: 'Fly in. Fall in. Land on your bike.', hub: { x: 0.72, y: 0.6 }, col: '#ff8a3a' });
  } catch (e) { /* engine data not available: nothing to fix */ }
})();
