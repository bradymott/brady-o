/* ============================================================
   ART CART — royale arena: THE SAND PIT (id 'sandpit', Dune Chomper's arena; level agent "shark", Nov 19 2026)
   A sunken desert bowl ringed by banded sandstone cliffs, red mesas beyond. In the middle THE CHOMPER (the giant sand
   sculpture of a land-shark from Shark Dunes); round it rolling dunes to jump, sandstone boulders and lifeguard towers
   for cover, beach umbrellas and buoys, five patches of damp sand that hide quicksand.
   Its hazards (all telegraphed, all readable on a phone):
     · FIN PACK: three fins prowl the sand. One picks a car and circles it: a red ring closes round where the car is
       (1.7 s, it follows slowly), then the fin BITES up out of the sand at the middle: 12 HP and launched.
       Drive out of the ring before it closes.
     · DUST DEVILS: whirlwinds brew on the spot (a swirl and a red ring, 1.4 s), then wander the pit for 12 s. The
       core whirls you up (10 HP); the edge shoves you aside.
     · QUICKSAND: five damp patches. One churns (red rings closing in, 1.5 s), then sinks for 3.5 s: it drags cars
       down, and the middle bogs you in (8 HP). Steer round it or hop it.
   DUNE CHOMPER's SAND DIVE is in everyone's gift boxes here (arena levelCar). Registers itself; globals are prefixed
   SPT_, state lives on s.spt. Shapes shared with the track (shdFin, shdTumble, shdSculpture, shdTower, shdMesa,
   SHD_KINDS) live in 43_cart_j_sharkdunes.js (one bundle scope; used only at run time, after every file loaded).
   Start it: BRADY_CART.debug.start({ mode: 'royale', arena: 'sandpit' }). All designs here are original.
   ============================================================ */
const SPT = {
  R: 178, pitR: 92, pitN: 5,
  fin: { n: 3, first: 14, lock: 1.7, r0: 14, r1: 4.6, bite: 4.6, follow: 1.1, cool: 7, scan: 55, scale: 1.5 },
  devil: { n: 3, first: 9, brew: 1.4, go: 12, rest: 5, core: 2.6, R: 7 },
  qs: { period: 9, churn: 1.5, sink: 3.5, r: 6.5, core: 2.4 },
  C: { sand: [0.93, 0.8, 0.58], sandDark: [0.7, 0.52, 0.32], mud: [0.42, 0.3, 0.18], white: [1, 1, 1], black: [0, 0, 0], hot: [1, 0.3, 0.2], warn: [1, 0.6, 0.15], teal: [0.2, 0.85, 0.85] }
};
const SPT_T = { p: { x: 0, y: 0 } };

/* ---------------- the world ---------------- */
CartWorlds.arena_sandpit = function (A, night) {
  const S = SPT, R = S.R, E = this.base(2143, [-260, -260, 260, 260], '#e2c08a', 0);
  const sky = Object.assign({}, CART_SKIES.day(), { zen: '#2f6ad0', hor: '#ffe2b4', sky: '#9cc8f0', fog: '#f0d8b0', fogD: 0.0022, haze: 0.35, clouds: 0.25, mid: '#e8b888', midK: 0.25, key: '#fff0d8', keyK: 1.05, gnd: '#e8cc98' });
  Object.assign(E, { id: 'sandpit', arena: A, sky, tod: 'day', music: 'kart3', night: false, R });
  const api = E.api, T = E.terrain, rng = mulberry32(2143);
  const ang = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  const pitA = i => (i + 0.5) / S.pitN * TAU + 0.35;
  E.sptPits = []; for (let i = 0; i < S.pitN; i++) { const [x, z] = ang(pitA(i), S.pitR); E.sptPits.push({ x, z }); }
  // ---- ground paint: wind ripples, the damp quicksand patches, a sand mandala round the sculpture, fin trails ----
  api.paint((ctx, P, sc) => {
    for (let i = 0; i < 1000; i++) { const x = (rng() - 0.5) * 500, z = (rng() - 0.5) * 500, q = P(x, z), L = (4 + rng() * 10) * sc; ctx.strokeStyle = rng() < 0.5 ? 'rgba(170,120,70,0.16)' : 'rgba(255,240,210,0.22)'; ctx.lineWidth = (0.25 + rng() * 0.3) * sc; ctx.beginPath(); ctx.moveTo(q[0] - L, q[1]); ctx.quadraticCurveTo(q[0], q[1] - L * 0.25, q[0] + L, q[1]); ctx.stroke(); }
    for (const p of E.sptPits) { const c = P(p.x, p.z); ctx.fillStyle = 'rgba(140,95,50,0.32)'; ctx.beginPath(); ctx.arc(c[0], c[1], (S.qs.r + 1.5) * sc, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([1.2 * sc, 1.2 * sc]); ctx.lineWidth = 0.4 * sc; ctx.beginPath(); ctx.arc(c[0], c[1], (S.qs.r + 1.2) * sc, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
    const c0 = P(0, 0);
    for (let r = 22; r < 40; r += 4) { ctx.strokeStyle = r % 8 ? 'rgba(255,120,80,0.28)' : 'rgba(46,200,200,0.28)'; ctx.lineWidth = 1.0 * sc; ctx.beginPath(); ctx.arc(c0[0], c0[1], r * sc, 0, TAU); ctx.stroke(); }
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, p = P(...ang(a, 24)), q = P(...ang(a, 38)); ctx.strokeStyle = 'rgba(255,240,210,0.35)'; ctx.lineWidth = 0.5 * sc; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
    for (let i = 0; i < 8; i++) { let a = rng() * TAU, r = 50 + rng() * 100; ctx.strokeStyle = 'rgba(150,100,55,0.18)'; ctx.lineWidth = 1.2 * sc; ctx.beginPath(); for (let k = 0; k < 30; k++) { a += 0.03 + Math.sin(k * 0.4 + i) * 0.03; r += Math.sin(k * 0.3 + i * 2) * 1.5; const q = P(...ang(a, r)); if (k) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); } ctx.stroke(); }
  });
  CartDecor.protos(E);
  CartKit.kinds(E, SHD_KINDS);
  // ---- THE CHOMPER in the middle ----
  CartScene.mesh(api, 0, 0, 0.6, shdSculpture, { hi: true }); E.art.push({ x: 0, z: 0, r: 15.5 });
  api.sign('THE SAND PIT', 0, -22, { yaw: Math.PI, h: 1.2, y: 1.2, post: true, maxW: 5, style: { bg: '#ffffff', fg: '#ff4a3a', border: '#2ec8c8' } });
  // ---- cover: lifeguard towers, sandstone boulder clusters, umbrellas; dunes and kickers to jump ----
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.15, [x, z] = ang(a, 58); CartScene.mesh(api, x, z, a + Math.PI, shdTower, { hi: true }); E.art.push({ x, z, r: 2.6 }); }
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + Math.PI / 6, [x, z] = ang(a, 120);
    for (let k = 0; k < 3; k++) { const b = a + (k - 1) * 0.05, r = 120 + (k % 2) * 6, [rx, rz] = ang(b, r), sc = 1.6 + ((i + k) % 3) * 0.5; CartKit.put(E, 'shd_rock', rx, rz, b * 3 + k, ['#d8905a', '#c8784a', '#e0a070'][(i + k) % 3], { scale: sc }); }
    E.art.push({ x, z, r: 7.5 });
  }
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.4, [x, z] = ang(a, 76 + (i % 2) * 8); CartKit.put(E, 'shd_umbrella', x, z, a, ['#ff5a7a', '#2ec8c8', '#ffd23a', '#ff8a2a'][i % 4]); CartKit.put(E, 'shd_buoy', x + 4, z - 3, a, '#ffffff'); }
  for (let i = 0; i < 18; i++) { const a = rng() * TAU, r = 30 + rng() * 140; const [x, z] = ang(a, r); if (Math.hypot(x, z) < 22 || E.sptPits.some(p => Math.hypot(p.x - x, p.z - z) < 12)) continue; CartKit.put(E, i % 2 ? 'shd_cactus' : 'shd_buoy', x, z, a, i % 2 ? '#5aa860' : '#ffffff', { scale: 1 + rng() * 0.3 }); E.art.push({ x, z, r: 1.1 }); }
  for (const [a, r, rr, h] of [[0.0, 100, 18, 3.6], [1.25, 150, 16, 3.0], [2.3, 104, 18, 4.0], [3.4, 150, 15, 3.0], [4.3, 102, 17, 3.4], [5.4, 150, 16, 3.2], [0.7, 62, 10, 2.2], [3.0, 64, 10, 2.4], [5.0, 66, 10, 2.0], [1.9, 160, 12, 4.5], [4.0, 160, 12, 4.5]]) { const [x, z] = ang(a + 0.62, r); T.add(CartFeat.mound(x, z, rr, h, { col: '#d8ac72', res: 1.6 })); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.8, [x, z] = ang(a, 42); T.add(CartFeat.ramp(x, z, a + Math.PI / 2 * (i % 2 ? 1 : -1), 6, 7, 2.0, { col: '#c8925a', stripe: i % 2 ? '#ff6a4a' : '#2ec8c8' })); }
  // ---- the cliff ring (the fence): banded sandstone slabs, cliffs and mesas beyond ----
  const n = 48, poly = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; poly.push([Math.sin(a) * R, Math.cos(a) * R]); }
  E.walls = poly;
  api.instanceProto('spt_cliff', m => {
    // a 25 m run of banded sandstone, about 10 m tall: rounded strata stepping back, a cap, a talus of boulders in
    // front; the face (+z) looks into the pit
    const C = ['#c8643a', '#e09058', '#b85432', '#d87a48', '#e8a868'], sg = m.lo ? 10 : 16;
    for (let i = 0; i < 5; i++) { m.color(C[i]).shine(0); m.ellipsoid(Math.sin(i * 2.1) * 1.2, 1.4 + i * 2.1, -i * 0.7, 13.4 - i * 1.0, 1.75, 4.4 - i * 0.45, { seg: sg, rings: 6 }); }
    m.color('#d89a68'); for (const [x, r] of [[-7, 1.6], [-2, 1.1], [4, 1.8], [9, 1.2]]) m.ellipsoid(x, r * 0.5, 3.8, r * 1.4, r, r * 1.2, { seg: 8, rings: 5 });
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 12.5, hz: 3.2, y0: 0, y1: 10 }] };
  }, { r: 14, near: 70, mid: 200, farD: 460, lo: true, far: m => { m.color('#c8643a'); m.ellipsoid(0, 4, 0, 13, 6, 4, { seg: 8, rings: 4 }); } });
  for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * TAU, [x, z] = ang(a, R + 3.5); api.instance('spt_cliff', x, z, { y: 0, yaw: a + Math.PI, scale: 1 + ((i * 7) % 5) * 0.05, tint: cartTintOf('#ffffff') }); }
  // three sandstone arches out on the sand: drive under them
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + 1.25, [x, z] = ang(a, 108), yaw = a + Math.PI / 2, W = 15, H = 10;
    CartScene.mesh(api, x, z, yaw, m => {
      const C = ['#c8643a', '#e09058', '#d87a48'];
      for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { m.color(C[k % 3]).shine(0); m.ellipsoid(sd * W / 2 + Math.sin(k * 1.7) * 0.3, 1.2 + k * 2.2, 0, 2.6 - k * 0.2, 1.5, 2.4 - k * 0.15, { seg: 12, rings: 6 }); }
      let px = 0, py = 0; m.color('#d87a48'); for (let k = 0; k <= 12; k++) { const u = k / 12, ax = lerp(-W / 2, W / 2, u), ay = 8.2 + Math.sin(u * Math.PI) * 2.6; if (k) m.limb(px, py, 0, ax, ay, 0, 1.9, 1.9, { seg: 10 }); px = ax; py = ay; }
      m.color('#e8a868'); m.ellipsoid(0, H + 1.1, 0, 4, 0.9, 1.8, { seg: 12, rings: 5 });
      return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 2.6, y0: 0, y1: 9, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 2.6, y0: 0, y1: 9, camPass: true }] };
    }, { hi: true });
    const c = Math.cos(yaw), sn = Math.sin(yaw); for (const sd of [-1, 1]) E.art.push({ x: x + sd * W / 2 * c, z: z - sd * W / 2 * sn, r: 2.8 });
  }
  // a little striped barrier in front of the cliffs, so the edge reads
  for (let i = 0; i < n; i++) { const a0 = poly[i], b0 = poly[(i + 1) % n], L = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]), k = Math.round(L / 7), yaw = Math.atan2(b0[0] - a0[0], b0[1] - a0[1]); for (let j = 0; j < k; j++) { const u = (j + 0.5) / k; CartDecor.put(E, 'rail', lerp(a0[0], b0[0], u), lerp(a0[1], b0[1], u), yaw, (i + j) % 3 === 0 ? '#2ec8c8' : (i + j) % 3 === 1 ? '#ffffff' : '#ff7a5a', { y: 0, noLights: true }); } }
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, [x, z] = ang(a, 300 + (i % 3) * 40); CartScene.mesh(api, x, z, a, m => shdMesa(m, 60 + (i % 3) * 18, 44 + (i % 4) * 12, 91 + i), { noAO: true }); }
  for (const a of [0.55, 2.65, 4.75]) { const [x, z] = ang(a, R + 12); E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 22, 4, rng)); }
  E.heroes.push({ type: 'ranger', x: 3, z: -20, yaw: Math.PI, anim: 'wave' });
  // ---- royale spots: gift boxes, repair kits, spawns, the storm's end points ----
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU, 30); E.gifts.push({ x, z }); }
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU + 0.5, 100); E.gifts.push({ x, z }); const [x2, z2] = ang(i / 6 * TAU + 0.15, 150); E.gifts.push({ x: x2, z: z2 }); }
  const repairs = []; for (let i = 0; i < 6; i++) repairs.push(ang(i / 6 * TAU + 0.9, 135)); repairs.push(ang(Math.PI / 2, 66), ang(-Math.PI / 2, 66));
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, [x, z] = ang(a, 145); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 30 + rng() * 135; E.orbSpots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.zones = [{ x: 0, z: 0, r: 16, name: 'THE CHOMPER' }]; E.flagSpots = [{ x: 0, z: 60 }]; E.captures = [{ x: 0, z: -90, r: 9 }];
  E.royale = { R: R - 4, x: 0, z: 0, ends: [0, 1, 2, 3, 4].map(i => ang(i / 5 * TAU + 0.9, 80)), repairs, storm: { name: 'SANDSTORM', col: '#e8a860' }, avoid: [[0, 0, 19]] };
  return this.finish(E);
};

/* ---------------- the hazards ---------------- */
CART_ARENA_RULES.sandpit = {
  music: 'kart3',
  onLoad(s) {
    const S = SPT, E = s.E;
    const G = CartKit.group(s, [['fins', m => shdFin(m, true), S.fin.n], ['tumble', shdTumble, S.devil.n]]);
    const D = s.spt = { t: 0, fins: [], devils: [], pits: [] };
    for (let i = 0; i < S.fin.n; i++) { const a = i / S.fin.n * TAU; D.fins.push({ i, obj: G.fins[i], st: 'prowl', t: 0, cool: S.fin.first + i * 4, ph: i * 2.1, x: Math.sin(a) * 90, z: Math.cos(a) * 90, yaw: 0, tgt: null, cx: 0, cz: 0, r: 0, a: 0, last: null }); }
    for (let i = 0; i < S.devil.n; i++) D.devils.push({ i, obj: G.tumble[i], st: 'rest', t: S.devil.first - S.devil.rest + i * 4, ph: i * 2.3, x: 0, z: 0, spin: 0, mask: 0, gmask: 0, u: 0 });
    E.sptPits.forEach((p, i) => D.pits.push({ i, x: p.x, z: p.z, off: i * 1.8 + 4, st: 'firm', u: 0, c: -1, mask: 0, hmask: 0 }));
  },
  onUpdate(s, dt, racing) {
    const D = s.spt; if (!D) return;
    const live = racing && s.state === 'race' && !(s.obj && s.obj.ended);
    if (live) D.t += dt;
    sptFins(s, D, dt, live); sptDevils(s, D, dt, live); sptPits(s, D, dt, live);
  },
  // the AI: drive out of a closing fin ring, away from a devil, round a sinking pit (by skill)
  onStep(s, k, dt, racing) {
    const D = s.spt; if (!D || (k.player && !s.autoDrive) || !racing || k.out || s.state !== 'race') return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, luck = ((k.slot * 7 + Math.floor(D.t * 0.7)) % 10) / 10;
    if (luck > 0.5 + (sk - 0.85) * 3) return;
    const steerTo = a => { const d = cartWrap(a - k.yaw); I.steer = clamp(-d * 2.4, -1, 1); };
    for (const f of D.fins) if (f.st === 'lock' && Math.hypot(k.x - f.cx, k.z - f.cz) < f.r + 1.5) { steerTo(Math.atan2(k.x - f.cx, k.z - f.cz)); I.gas = 1; return; }
    for (const v of D.devils) if ((v.st === 'go' || v.st === 'brew') && Math.hypot(k.x - v.x, k.z - v.z) < SPT.devil.R + 4) { steerTo(Math.atan2(k.x - v.x, k.z - v.z)); I.gas = 1; return; }
    for (const p of D.pits) { if (p.st === 'firm') continue; const d = Math.hypot(k.x - p.x, k.z - p.z); if (d < SPT.qs.r + 6) { if (p.st === 'sink' && d < SPT.qs.r + 2.5 && !k.air && k.speed > 12) { I.driftPress = true; I.drift = false; } else steerTo(Math.atan2(k.x - p.x, k.z - p.z)); I.gas = 1; return; } }
  },
  draw(s, R, Sp, t) { const D = s.spt; if (D) sptDraw(s, D, R, Sp, t); },
  lights(s, add) {},
  radar(s, ctx, P, sc) {
    const q = CART_ROY_T.p, D = s.spt; if (!D) return;
    P(0, 0, q); ctx.fillStyle = 'rgba(230,190,120,0.8)'; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(3, 15 * sc), 0, TAU); ctx.fill();
    for (const p of D.pits) { P(p.x, p.z, q); ctx.fillStyle = p.st === 'sink' ? 'rgba(120,70,30,0.95)' : p.st === 'churn' ? 'rgba(255,90,60,0.9)' : 'rgba(150,100,55,0.5)'; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(2.5, SPT.qs.r * sc), 0, TAU); ctx.fill(); }
    for (const f of D.fins) { if (f.st !== 'lock') continue; P(f.cx, f.cz, q); ctx.strokeStyle = 'rgba(255,70,50,0.95)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(3, f.r * sc), 0, TAU); ctx.stroke(); }
  }
};

// ---- fins: prowl; lock onto a car (a closing ring that follows it slowly); bite at the middle; dive and cool off ----
function sptFins(s, D, dt, live) {
  const C = SPT.fin;
  for (const f of D.fins) {
    f.t += dt; let tx, tz, sp;
    if (f.st === 'prowl') {
      const pa = D.t * 0.09 + f.ph; tx = Math.sin(pa) * (70 + 50 * Math.sin(pa * 0.6 + f.i)); tz = Math.cos(pa * 1.2) * (75 + 45 * Math.cos(pa * 0.5 + f.i)); sp = 9;
      if (live) f.cool -= dt;
      if (live && f.cool <= 0) {
        let best = null, bd = C.scan;
        for (const k of s.karts) { if (k.out || k.hidden || k.sunk || k.invT > 0.5) continue; if (D.fins.some(o => o !== f && o.tgt === k && o.st === 'lock')) continue; const d = Math.hypot(k.x - f.x, k.z - f.z) + (k === f.last ? 30 : 0); if (d < bd) { bd = d; best = k; } }
        if (best) { f.st = 'lock'; f.t = 0; f.tgt = best; f.cx = best.x; f.cz = best.z; f.a = Math.atan2(f.x - best.x, f.z - best.z); f.r = C.r0; f.mask = 0; cartIxSound(s, 'dust', best.x, best.z, best.player ? 0.8 : 0.3, 0.8); if (best.player) s.banner('FIN CIRCLING!', '#ff5a3a', 1.2, 'drive out of the ring', true); }
        else f.cool = 1;
      }
    } else if (f.st === 'lock') {
      const k = f.tgt, u = Math.min(1, f.t / C.lock);
      if (k && !k.out) { const g = 1 - Math.exp(-C.follow * dt); f.cx = lerp(f.cx, k.x, g); f.cz = lerp(f.cz, k.z, g); }
      f.r = lerp(C.r0, C.r1, u * u * (3 - 2 * u)); f.a += dt * (1.6 + u * 3.5);
      tx = f.cx + Math.sin(f.a) * f.r; tz = f.cz + Math.cos(f.a) * f.r; sp = 0;
      f.x = tx; f.z = tz;
      if (f.t >= C.lock) {
        f.st = 'bite'; f.t = 0; f.last = k; f.tgt = null;
        if (live) for (const o of s.karts) { if (o.out || o.sunk || o.y > s.terrain.height(o.x, o.z) + 2) continue; const dx = o.x - f.cx, dz = o.z - f.cz, d = Math.hypot(dx, dz); if (d < C.bite) s.hit(o, 'launch', null, { item: 'spt_fin', dx: dx / (d || 1), dz: dz / (d || 1), power: 6, vy: 10, banner: 'FIN BITE!' }); }
        const P = s.player, near = P && Math.hypot(P.x - f.cx, P.z - f.cz); cartIxSound(s, 'cartChomp', f.cx, f.cz, near < 50 ? 1 : 0.3, 0.8); if (near < 25) s.shakeIt(0.5);
        if (s.fx) { s.fx.dust(f.cx, 0.5, f.cz, 24, '#e0c088'); s.fx.burst(f.cx, 1, f.cz, 'ring', 12, '#ffd0a0'); }
      }
    } else {
      tx = f.cx; tz = f.cz; sp = 0;
      if (f.t > 1.0) { f.st = 'prowl'; f.t = 0; f.cool = C.cool + (s.rng ? s.rng() : 0.5) * 3; }
    }
    if (sp > 0) { const dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz); if (d > 0.1) { const m = Math.min(d, sp * dt); f.x += dx / d * m; f.z += dz / d * m; } }
    // the wall: keep inside
    const rr = Math.hypot(f.x, f.z); if (rr > SPT.R - 8) { f.x *= (SPT.R - 8) / rr; f.z *= (SPT.R - 8) / rr; }
    const yaw = f.st === 'lock' ? f.a + Math.PI / 2 : Math.atan2(f.x - (f.px === undefined ? f.x : f.px), f.z - (f.pz === undefined ? f.z : f.pz) + 1e-5); if (f.st !== 'bite') f.yaw = yaw || f.yaw; f.px = f.x; f.pz = f.z;
    const o = f.obj; if (o) {
      o.live = true; o.visible = true;
      if (f.st === 'bite') { const u = Math.min(1, f.t / 0.35), down = Math.max(0, (f.t - 0.5) / 0.5); o.x = f.cx; o.z = f.cz; o.y = s.terrain.height(f.cx, f.cz) - 1.6 + Math.sin(u * Math.PI * 0.5) * 3.2 - down * 4; o.pitch = -0.5 * (1 - down); o.yaw = f.yaw; o.roll = 0; o.scale = C.scale * 1.15; }
      else { o.x = f.x; o.z = f.z; o.y = s.terrain.height(f.x, f.z) - 1.2 + (f.st === 'lock' ? 0.8 : 0) + Math.sin(s.time * 2 + f.i) * 0.08; o.yaw = f.yaw; o.pitch = 0; o.roll = f.st === 'lock' ? 0.25 : 0.08; o.scale = C.scale; }
    }
  }
}
// ---- dust devils: rest (gone); brew in place (1.4 s); wander the pit for 12 s ----
function sptDevils(s, D, dt, live) {
  const C = SPT.devil;
  for (const v of D.devils) {
    if (live) v.t += dt;
    const pa = D.t * 0.045 + v.ph, px = Math.sin(pa * 1.3 + v.i) * (60 + 70 * Math.abs(Math.sin(pa * 0.7))), pz = Math.cos(pa + v.i * 2) * (60 + 70 * Math.abs(Math.cos(pa * 0.5)));
    if (v.st === 'rest' && v.t > C.rest) { v.st = 'brew'; v.t = 0; v.mask = 0; v.gmask = 0; v.x = px; v.z = pz; }
    else if (v.st === 'brew' && v.t > C.brew) { v.st = 'go'; v.t = 0; const P = s.player; cartIxSound(s, 'wind', v.x, v.z, P && Math.hypot(P.x - v.x, P.z - v.z) < 50 ? 0.7 : 0.2, 0.9); }
    else if (v.st === 'go' && v.t > C.go) { v.st = 'rest'; v.t = 0; }
    if (v.st === 'go') { const dx = px - v.x, dz = pz - v.z, d = Math.hypot(dx, dz); if (d > 0.1) { const m = Math.min(d, 7 * dt); v.x += dx / d * m; v.z += dz / d * m; } if (v.t % 4 < dt) { v.mask = 0; v.gmask = 0; } }
    v.u = v.st === 'brew' ? v.t / C.brew : v.st === 'go' ? Math.min(1, v.t * 3, (C.go - v.t) * 2) : 0;
    v.spin += dt * (v.st === 'go' ? 9 : v.st === 'brew' ? 9 * v.u : 1);
    if (v.st === 'go' && live && v.u > 0.3) for (const k of s.karts) {
      if (k.out || k.sunk) continue;
      const dx = k.x - v.x, dz = k.z - v.z, d = Math.hypot(dx, dz); if (d > C.R) continue;
      if (d < C.core && !(v.mask & (1 << k.slot))) { v.mask |= 1 << k.slot; s.hit(k, 'whirl', null, { item: 'spt_devil', dur: 1.1, vy: 8, banner: 'DUST DEVIL!' }); continue; }
      if (!(v.gmask & (1 << k.slot)) && !k.air && !(k.invT > 0)) { v.gmask |= 1 << k.slot; const nx = dx / (d || 1), nz = dz / (d || 1); k.vx += (nx * 5 - nz * 6) * v.u; k.vz += (nz * 5 + nx * 6) * v.u; }
    }
    const o = v.obj; if (o) { const on = v.st !== 'rest'; o.live = on; o.visible = on; if (on) { const r = 2 + v.u * 1.4, a = v.spin * 0.8; o.x = v.x + Math.cos(a) * r; o.z = v.z + Math.sin(a) * r; o.y = s.terrain.height(o.x, o.z) + 0.6 + (v.st === 'go' ? 2.5 + Math.sin(v.spin * 0.5) * 1.5 : v.u * 1.5); o.yaw = -a; o.pitch = v.spin * 1.3; o.roll = v.spin * 0.7; o.scale = 0.9; } }
  }
}
// ---- quicksand pits: firm; churn (1.5 s); sink (3.5 s): drags, the middle bogs you in ----
function sptPits(s, D, dt, live) {
  const C = SPT.qs;
  for (const p of D.pits) {
    const tt = D.t + p.off, c = Math.floor(tt / C.period), ph = tt - c * C.period, firm = C.period - C.churn - C.sink;
    p.st = !live && D.t < 1 ? 'firm' : ph < firm ? 'firm' : ph < firm + C.churn ? 'churn' : 'sink'; p.u = p.st === 'churn' ? (ph - firm) / C.churn : p.st === 'sink' ? (ph - firm - C.churn) / C.sink : 0;
    if (p.st === 'sink' && p.c !== c) { p.c = c; p.mask = 0; p.hmask = 0; const P = s.player; if (P && Math.hypot(P.x - p.x, P.z - p.z) < 50) cartIxSound(s, 'dust', p.x, p.z, 0.6, 0.5); }
    if (p.st === 'sink' && live) for (const k of s.karts) {
      if (k.out || k.air || k.sunk) continue;
      const d = Math.hypot(k.x - p.x, k.z - p.z); if (d > C.r + 0.6) continue;
      const drag = Math.exp(-2.4 * dt); k.vx *= drag; k.vz *= drag; k.slowT = Math.max(k.slowT || 0, 0.35);
      if (d < C.core && !(p.hmask & (1 << k.slot))) { p.hmask |= 1 << k.slot; s.hit(k, 'goo', null, { item: 'spt_sink', dur: 1.2, banner: 'QUICKSAND!' }); }
    }
  }
}
// ---- sprites ----
function sptDraw(s, D, R, Sp, t) {
  const C = SPT.C, cam = s.cam, near = (x, z, r) => (x - cam.x) ** 2 + (z - cam.z) ** 2 < r * r;
  for (const f of D.fins) {
    if (!near(f.x, f.z, 220)) continue;
    if (f.st === 'lock') {
      const u = Math.min(1, f.t / SPT.fin.lock), fl = 0.55 + 0.45 * Math.max(0, Math.sin(t * (12 + u * 14)));
      R.flat.flat(f.cx, 0.12, f.cz, f.r * 2, f.r * 2, -f.a, Sp.ring, C.hot, fl, false);
      R.flat.flat(f.cx, 0.11, f.cz, f.r * 2.15, f.r * 2.15, 0, Sp.ring, C.white, 0.6 * fl, false);
      R.flat.flat(f.cx, 0.1, f.cz, SPT.fin.bite * 2, SPT.fin.bite * 2, t * 2, Sp.reticle || Sp.warn, C.hot, 0.5 + 0.4 * u, false);
      R.bbs.bb(f.x, 0.8, f.z, 3.6, 2, Sp.puff, C.sand, 0.85, false, t * 3);
    } else if (f.st === 'bite') { const a = Math.max(0, 1 - f.t); R.flat.flat(f.cx, 0.1, f.cz, 11, 11, 0, Sp.ring, C.sand, a, false); R.flat.flat(f.cx, 0.09, f.cz, 8, 8, 0, Sp.shadow, C.black, 0.5 * a, false); }
    else R.flat.flat(f.x, 0.1, f.z, 4, 6, f.yaw, Sp.shadow, C.sandDark, 0.4, false);
  }
  for (const v of D.devils) {
    if (v.st === 'rest' || !near(v.x, v.z, 240)) continue;
    const gy = s.terrain.height(v.x, v.z) + 0.1;
    if (v.st === 'brew') {
      const a = v.u, fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 14));
      R.flat.flat(v.x, gy, v.z, 4 + a * 10, 4 + a * 10, -v.spin, Sp.swirl, C.mud, 0.85 * fl, false);
      R.flat.flat(v.x, gy + 0.01, v.z, SPT.devil.R * 2, SPT.devil.R * 2, 0, Sp.ring, C.hot, 0.8 * fl * a, false);
      for (let i = 0; i < 4; i++) R.bbs.bb(v.x, gy + 1 + i * 1.6 * a, v.z, 2 + i * a * 1.2, 2.6, Sp.puff, C.sandDark, 0.75 * a, false, -v.spin * (1 + i * 0.3));
    } else {
      const f = v.u;
      R.flat.flat(v.x, gy, v.z, SPT.devil.R * 2, SPT.devil.R * 2, -v.spin, Sp.swirl, C.sandDark, 0.6 * f, false);
      R.bbs.bb(v.x, gy + 1.2, v.z, 9, 3, Sp.puff, C.sandDark, 0.8 * f, false, v.spin);
      for (let i = 0; i < 9; i++) { const h = i * 1.9, w = 2.2 + i * 1.2, wob = Math.sin(t * 3 + i * 0.7) * (0.3 + i * 0.14); R.bbs.bb(v.x + wob, gy + 0.8 + h, v.z + wob * 0.6, w * 1.1, 3.0, Sp.puff, i % 2 ? C.sandDark : C.mud, (0.85 - i * 0.06) * f, false, -v.spin * (1 + i * 0.12)); R.bbs.bb(v.x + wob, gy + 0.8 + h, v.z + wob * 0.6, w, 2.6, Sp.swirl, C.white, (0.6 - i * 0.04) * f, false, -v.spin * (1 + i * 0.15)); }
    }
  }
  for (const p of D.pits) {
    if (p.st === 'firm' || !near(p.x, p.z, 200)) continue;
    const r = SPT.qs.r;
    if (p.st === 'churn') {
      const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 15));
      for (let i = 0; i < 3; i++) { const u = 1 - ((p.u * 1.6 + i / 3) % 1), rr = 1 + u * r; R.flat.flat(p.x, 0.1, p.z, rr * 2, rr * 2, t, Sp.ring, C.hot, (1 - u * 0.4) * fl, false); }
      R.flat.flat(p.x, 0.105, p.z, r * 2.1, r * 2.1, 0, Sp.ring, C.white, 0.7 * fl, false);
      R.flat.flat(p.x, 0.09, p.z, r * 2, r * 2, -t * 2, Sp.swirl, C.mud, 0.8 * p.u, false);
    } else {
      const a = Math.min(1, p.u * 8, (1 - p.u) * 6);
      R.flat.flat(p.x, 0.075, p.z, r * 2.1, r * 2.1, 0, Sp.glow, C.mud, a, false);
      R.flat.flat(p.x, 0.08, p.z, r * 2.3, r * 2.3, -t * 1.5, Sp.swirl, C.mud, a, false);
      R.flat.flat(p.x, 0.09, p.z, r * 1.5, r * 1.5, -t * 2.6, Sp.swirl, C.sandDark, a, false);
      R.flat.flat(p.x, 0.07, p.z, SPT.qs.core * 2.6, SPT.qs.core * 2.6, 0, Sp.shadow, C.black, 0.6 * a, false);
      R.flat.flat(p.x, 0.11, p.z, r * 2.1, r * 2.1, 0, Sp.ring, C.warn, 0.85 * a, false);
      for (let i = 0; i < 5; i++) { const ang = -t * 1.8 + i * 1.25, rr = 1 + ((i * 0.618 + p.u * 2) % 1) * (r - 1); R.bbs.bb(p.x + Math.cos(ang) * rr, 0.35, p.z + Math.sin(ang) * rr, 1.4, 0.8, Sp.puff, C.sandDark, 0.7 * a, false, ang); }
    }
  }
}

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'sandpit', name: 'THE SAND PIT', sub: 'Battle royale: circling fins, dust devils, quicksand', objectives: ['royale'], royale: true, levelCar: 'shark',
  col: '#e8a860', tod: 'day', blurb: 'Dune Chomper\'s pit. Get out of the fin\'s ring, dodge the dust devils, keep off the quicksand. Last car running wins.'
});
CART_ROYALE_ARENAS.shark = 'sandpit';
CART_ARENA_ICONS.sandpit = (ctx, s, t, col) => {
  // a sand-coloured disc, a red ring closing round it, a fin cutting through the middle
  ctx.save(); ctx.fillStyle = '#e8c890'; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill(); ctx.stroke();
  const r = s * (0.3 + 0.3 * (1 - (t * 0.5 % 1))); ctx.strokeStyle = '#ff4a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, s * 0.05, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(150,100,55,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, s * 0.3, s * 0.5, s * 0.1, 0, 0, TAU); ctx.stroke();
  const x = Math.sin(t * 1.5) * s * 0.12;
  ctx.fillStyle = '#4a6a8a'; ctx.beginPath(); ctx.moveTo(x - s * 0.3, s * 0.28); ctx.quadraticCurveTo(x - s * 0.05, -s * 0.1, x + s * 0.2, -s * 0.45); ctx.quadraticCurveTo(x + s * 0.12, 0, x + s * 0.28, s * 0.28); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3af0e0'; for (const [u, v] of [[-0.1, 0.12], [0.02, -0.02], [0.1, -0.16]]) { ctx.beginPath(); ctx.arc(x + u * s, v * s, s * 0.035, 0, TAU); ctx.fill(); }
  ctx.restore();
};
