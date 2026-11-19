/* ============================================================
   ART CART — royale arena: THE BIG TUB (id 'bigtub', Quackzilla's arena; level agent "duck", Nov 19 2026)
   The inside of a round bathtub the size of a town, drained down to a slick enamel floor. The tub's white wall and
   rolled rim are the fence; the giant bathroom (tiles, towels, toothbrushes) looms beyond it. In the middle THE SOAP
   DISH (a giant bar of soap on its dish) beside the plughole; round it a ring of cover: rubber ducks, foam islands,
   a toy sailboat, a fallen shampoo bottle; sponge kickers on the outer floor; the great golden TAP on the north rim.
   Its hazards (all telegraphed, all readable on a phone):
     · DUCK ARMADA: three giant rubber ducks paddle about. One turns to face a car, wiggles and QUACKS while a pink
       lane flashes on the floor (1.3 s), then charges straight down it: 12 HP and a shove. Sidestep the lane.
     · THE SLOSH: the tap swivels to aim and shudders while a blue lane flashes across the tub (1.8 s), then a wave
       of bathwater rolls down the lane: 11 HP and washed along. HOP the wave or get out of the lane.
     · BATH BOMBS: a fizzy bath bomb falls on a car (a target and a growing shadow, 1.5 s), lands, FIZZES (0.8 s:
       still time to drive off), then bursts in coloured foam: 10 HP and foamed.
   QUACKZILLA's BUBBLE BATH SURF is in everyone's gift boxes here (arena levelCar). Registers itself; globals are
   prefixed BTB_, state lives on s.btb. Start it: BRADY_CART.debug.start({ mode: 'royale', arena: 'bigtub' }).
   ============================================================ */
const BTB = {
  R: 178, wallH: 21, dish: [0, 6], drain: [0, -30], tap: [0, 181],
  duck: { n: 3, aim: 1.3, charge: 1.5, speed: 30, rest: 2.4, cool: 6.5, reach: 4.4, lane: 7, scale: 2.3 },
  slosh: { first: 16, period: 15, aim: 1.8, speed: 46, width: 30, band: 3.2 },
  bomb: { first: 11, period: 5.5, fall: 1.5, fizz: 0.8, r: 6.5, n: 3 },
  C: { white: [1, 1, 1], foam: [0.95, 0.98, 1], pink: [1, 0.4, 0.7], hot: [1, 0.2, 0.5], aqua: [0.35, 0.85, 1], blue: [0.3, 0.6, 1], deep: [0.12, 0.4, 0.85], water: [0.55, 0.85, 1], yellow: [1, 0.85, 0.25], black: [0, 0, 0], warn: [1, 0.66, 0.2], red: [1, 0.25, 0.3] },
  bombCol: ['#ff8ac0', '#b48cff', '#7aeec0'], fizz: [[1, 0.5, 0.75], [0.7, 0.55, 1], [0.5, 1, 0.8], [1, 0.9, 0.4], [0.45, 0.85, 1]]
};
const BTB_T = { v: [0, 0] };

/* ---------------- the world ---------------- */
CartWorlds.arena_bigtub = function (A, night) {
  const S = BTB, R = S.R, E = this.base(2113, [-260, -260, 260, 260], '#7cc4dc', 0);
  const sky = Object.assign(CART_SKIES.day(), { zen: '#5aa8f0', hor: '#ffe4f2', sky: '#bfe4ff', fog: '#c8e2f0', fogD: 0.0014, haze: 0.15, clouds: 0.6, key: '#fff4e8', keyK: 1.0, gnd: '#cfeaf0' });
  Object.assign(E, { id: 'bigtub', arena: A, sky, tod: 'day', music: 'kart2', night: false, R });
  const api = E.api, T = E.terrain, rng = mulberry32(2113);
  const ang = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  // ---- the floor: glossy enamel inside the tub (soft aqua puddles, a ring of anti-slip daisies), tiles outside ----
  api.paint((ctx, P, sc) => {
    const c0 = P(0, 0);
    for (let x = -260; x < 260; x += 10) for (let z = -260; z < 260; z += 10) { if (Math.hypot(x + 5, z + 5) < R + 6) continue; const q = P(x, z); ctx.fillStyle = ((x + z) / 10) & 1 ? 'rgba(255,255,255,0.5)' : 'rgba(150,215,228,0.35)'; ctx.fillRect(q[0], q[1] - 10 * sc, 9.4 * sc, 9.4 * sc); }
    const g = ctx.createRadialGradient(c0[0], c0[1], 10 * sc, c0[0], c0[1], R * sc); g.addColorStop(0, 'rgba(170,226,242,0.9)'); g.addColorStop(0.55, 'rgba(110,196,226,0.9)'); g.addColorStop(1, 'rgba(60,150,200,0.92)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c0[0], c0[1], R * sc, 0, TAU); ctx.fill();
    for (let i = 0; i < 46; i++) { const a = rng() * TAU, r = 30 + rng() * 135, q = P(...ang(a, r)); ctx.fillStyle = `rgba(120,200,235,${0.12 + rng() * 0.12})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (4 + rng() * 12) * sc, (2 + rng() * 6) * sc, rng() * 3, 0, TAU); ctx.fill(); }
    // anti-slip daisies in a ring
    for (let i = 0; i < 36; i++) { const a = i / 36 * TAU, q = P(...ang(a, 120)), rr = 2.4 * sc; ctx.fillStyle = i % 2 ? 'rgba(255,138,192,0.55)' : 'rgba(122,216,240,0.55)'; for (let p = 0; p < 6; p++) { const b = p / 6 * TAU; ctx.beginPath(); ctx.ellipse(q[0] + Math.cos(b) * rr, q[1] + Math.sin(b) * rr, rr * 0.75, rr * 0.4, b, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(255,220,80,0.8)'; ctx.beginPath(); ctx.arc(q[0], q[1], rr * 0.5, 0, TAU); ctx.fill(); }
    // the drain: rings of grout round it
    const d0 = P(S.drain[0], S.drain[1]); for (let r = 6; r < 20; r += 3.5) { ctx.strokeStyle = 'rgba(90,170,210,0.4)'; ctx.lineWidth = 1 * sc; ctx.beginPath(); ctx.arc(d0[0], d0[1], r * sc, 0, TAU); ctx.stroke(); }
  });
  // ---- the tub's wall and rolled rim (one lathe ring); the fence polygon just inside it ----
  CartScene.mesh(api, 0, 0, 0, m => {
    m.color('#fbfdff').shine(3); m.lathe([[R + 0.5, 0], [R + 0.5, S.wallH - 1], [R + 1.6, S.wallH + 0.8], [R + 3.4, S.wallH + 1.1], [R + 4.6, S.wallH - 0.2], [R + 4.4, 0]], { seg: 120 });
    m.color('#ff9ac8').shine(2); m.lathe([[R + 0.45, 2.2], [R + 0.45, 5.2], [R + 0.3, 5.2], [R + 0.3, 2.2]], { seg: 120 });
    m.color('#4ab8e0'); m.lathe([[R + 0.45, 6.2], [R + 0.45, 7.4], [R + 0.3, 7.4], [R + 0.3, 6.2]], { seg: 120 });
    return { cols: [] };
  }, { hi: true, noAO: true });
  const poly = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; poly.push([Math.sin(a) * R, Math.cos(a) * R]); }
  E.walls = poly; CartDecor.protos(E);
  // ---- THE SOAP DISH: a giant pink bar of soap on a ribbed dish (central cover, something to circle) ----
  CartScene.mesh(api, S.dish[0], S.dish[1], 0.25, m => {
    m.color('#7ad8f0').shine(3); m.roundBox(0, 0.7, 0, 40, 1.4, 26, 1.2);
    m.color('#ffffff').shine(2); for (let i = -4; i <= 4; i++) m.roundBox(i * 4, 1.5, 0, 1.2, 0.4, 22, 0.18);
    m.color('#ff8ac0').shine(4); m.roundBox(0, 5.4, 0, 26, 7.6, 14, 3.4);
    m.color('#ffb0d4').shine(3); m.roundBox(0, 9.2, 0, 20, 0.3, 9, 0.15);
    m.color('#ff8ac0'); m.push(); m.tf(0, 9.3, 0, 0.6, 0, 0, 2.2, 0.35, 2.2); btmDuck(m, '#ff8ac0', '#ff8ac0', false); m.pop();
    m.color('#ffffff').shine(1); for (let i = 0; i < 14; i++) { const x = -11 + (i * 0.618 % 1) * 22, z = (i % 2 ? 1 : -1) * (4 + (i * 0.37 % 1) * 3), r = 0.8 + (i % 4) * 0.45; m.ball(x, 9.3 + r * 0.3, z, r, { seg: 10, rings: 7 }); }
    m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 20, hz: 13, y0: 0, y1: 9.5 }] };
  }, { hi: true });
  E.art.push({ x: S.dish[0], z: S.dish[1], r: 22 });
  // the plughole south of the dish
  CartScene.mesh(api, S.drain[0], S.drain[1], 0, m => { m.color('#e6eef4').shine(4); m.torus(0, 0.05, 0, 5, 0.45, { seg: 40, tseg: 6, sy: 0.3 }); m.color('#5a6a78').shine(2); m.disc(0, 0.03, 0, 4.7, 32); m.color('#d8e0e8').shine(4); for (let i = 0; i < 6; i++) { m.push(); m.tf(0, 0, 0, i / 6 * Math.PI); m.box(0, 0.07, 0, 0.42, 0.08, 9.2); m.pop(); } m.ball(0, 0.1, 0, 0.8, { seg: 10, rings: 6 }); m.shine(0); return { cols: [] }; }, { hi: true, noAO: true });
  // ---- the cover ring (r ≈ 92): rubber ducks, foam islands, a toy sailboat, a fallen shampoo bottle ----
  const ring = 92, kinds = ['duck', 'foam', 'boat', 'foam', 'duck', 'bottle', 'foam', 'duck'];
  for (let i = 0; i < kinds.length; i++) {
    const a = (i + 0.5) / kinds.length * TAU, r = ring + (i % 2) * 10, [x, z] = ang(a, r), yaw = a + Math.PI / 2 + (rng() - 0.5) * 0.8, kd = kinds[i];
    if (kd === 'duck') { CartScene.mesh(api, x, z, yaw, m => { btmDuck(m, ['#ffd23a', '#ff9ac8', '#7ad8f0'][i % 3], '#ff8a2a', false); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.5, y0: 0, y1: 2.6 }] }; }, { hi: true, scale: 6.2 }); E.art.push({ x, z, r: 9.6 }); }
    else if (kd === 'foam') { CartScene.mesh(api, x, z, yaw, m => { m.color('#ffffff').shine(1); for (let j = 0; j < 11; j++) { const b = j / 11 * TAU, d = j ? 3 + (j % 3) * 2.2 : 0, rr = j ? 2.2 + (j % 4) * 0.7 : 4.2; m.ball(Math.sin(b) * d, rr * 0.6, Math.cos(b) * d, rr, { seg: 14, rings: 10 }); } m.color('#d8f4ff'); m.ball(1.5, 5.2, 0.5, 1.8, { seg: 12, rings: 8 }); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 7, y0: 0, y1: 5 }] }; }, { hi: true, scale: 1.5 }); E.art.push({ x, z, r: 12 }); }
    else if (kd === 'boat') { CartScene.mesh(api, x, z, yaw, btbBoat, { hi: true, scale: 1.4 }); E.art.push({ x, z, r: 12 }); }
    else { CartScene.mesh(api, x, z, yaw, btbBottle, { hi: true, scale: 1.3 }); E.art.push({ x, z, r: 12 }); }
  }
  // ---- inflatable swim rings lying on the floor (cover you can see over) ----
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.95, [x, z] = ang(a, 60 + (i % 2) * 70), col = ['#ff6aa8', '#5adca0', '#ffb84a', '#6ab8ff', '#c08aff'][i];
    CartScene.mesh(api, x, z, a, m => { m.color(col).shine(3); m.torus(0, 2.0, 0, 6.5, 2.1, { seg: 32, tseg: 12 }); m.color('#ffffff'); for (let j = 0; j < 4; j++) for (let q = 0; q < 3; q++) { const a0 = j / 4 * TAU + q * 0.14, a1 = a0 + 0.14; m.limb(Math.sin(a0) * 6.5, 2.0, Math.cos(a0) * 6.5, Math.sin(a1) * 6.5, 2.0, Math.cos(a1) * 6.5, 2.16, 2.16, { seg: 12, ends: false }); } return { cols: [{ t: 'cyl', x: 0, z: 0, r: 8.6, y0: 0, y1: 4 }] }; }, { hi: true }); E.art.push({ x, z, r: 9.5 }); }
  // ---- sponge kickers and loofahs on the outer floor ----
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3, [x, z] = ang(a, 138); T.add(CartFeat.ramp(x, z, a + Math.PI / 2 * (i % 2 ? 1 : -1), 7, 7, 2.1, { col: '#ffd84a', stripe: '#5adca0' })); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 1.05, [x, z] = ang(a, 150); CartScene.mesh(api, x, z, a, m => { m.color(['#ffb0d4', '#9af0c0', '#b8a0ff', '#ffd23a'][i]).shine(0); for (let j = 0; j < 9; j++) { const b = j / 9 * TAU; m.push(); m.tf(Math.sin(b) * 1.6, 2.4 + Math.cos(b * 2) * 0.6, Math.cos(b) * 1.6, b, 0.6, 0.3); m.torus(0, 0, 0, 1.4, 0.55, { seg: 10, tseg: 6 }); m.pop(); } m.color('#ffffff'); m.limb(0, 4.6, 0, 0.8, 7.5, 0.3, 0.12, 0.12, { seg: 5 }); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.2, y0: 0, y1: 4.5 }] }; }, { hi: true }); E.art.push({ x, z, r: 4.5 }); }
  // ---- THE TAP on the north rim (the spout is a moving part: it swivels to aim the slosh) ----
  CartScene.mesh(api, S.tap[0], S.tap[1], Math.PI, m => {
    m.color('#f0c050').shine(4); m.roundCyl(0, S.wallH, 0, 6, 2, 0.6); m.limb(0, S.wallH + 2, 0, 0, S.wallH + 9, 0, 2.2, 2.0, { seg: 16 }); m.ball(0, S.wallH + 9.4, 0, 2.6, { seg: 16, rings: 12 });
    for (const sx of [-1, 1]) { m.limb(sx * 9, S.wallH, 0, sx * 9, S.wallH + 4, 0, 0.9, 0.9, { seg: 12 }); m.ball(sx * 9, S.wallH + 4.8, 0, 1.6, { seg: 12, rings: 10 }); m.limb(sx * 9 - 3, S.wallH + 4.8, 0, sx * 9 + 3, S.wallH + 4.8, 0, 0.45, 0.45, { seg: 8 }); m.limb(sx * 9, S.wallH + 4.8, -3, sx * 9, S.wallH + 4.8, 3, 0.45, 0.45, { seg: 8 }); }
    m.color('#ff6a8a', 0.2); m.ball(-9, S.wallH + 6.6, 0, 0.7, { seg: 10, rings: 8 }); m.color('#5ab8ff', 0.2); m.ball(9, S.wallH + 6.6, 0, 0.7, { seg: 10, rings: 8 }); m.emissive(0).shine(0);
    return { cols: [] };
  }, { hi: true });
  api.sign('THE BIG TUB', 0, R - 3, { yaw: Math.PI, h: 1.6, y: 3.0, post: false, maxW: 9, style: { bg: '#ffffff', fg: '#2a8ac8', border: '#ff8ac0' } });
  api.sign('THE BIG TUB', 0, -R + 3, { yaw: 0, h: 1.6, y: 3.0, post: false, maxW: 9, style: { bg: '#ffffff', fg: '#2a8ac8', border: '#ff8ac0' } });
  // ---- beyond the rim: the bathroom floor, toiletries, towels, the tiled walls; spectators on the rim ----
  for (let i = 0; i < 8; i++) { const a = (i + 0.3) / 8 * TAU, [x, z] = ang(a, R + 26); if (Math.abs(cartWrap(a)) < 0.3) continue; const k = i % 3; CartScene.mesh(api, x, z, a + Math.PI, k === 0 ? btbBigBottle : k === 1 ? btmTowels : btmMug, { hi: false, scale: k === 0 ? 1.6 : 1.4 }); }
  CartScene.mesh(api, 0, 255, Math.PI, m => btmWall(m, 640, 150), { noAO: true });
  CartScene.mesh(api, 255, 0, -Math.PI / 2, m => btmWall(m, 640, 150), { noAO: true });
  for (const a of [0.9, 2.6, 3.7, 5.4]) { const [x, z] = ang(a, R + 7); E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 22, 3, rng)); }
  // ---- royale spots: gift boxes, repair kits, spawns, the storm's end points ----
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU + 0.5, 45); E.gifts.push({ x, z }); }
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU, 72); E.gifts.push({ x, z }); }
  for (let i = 0; i < 6; i++) { const [x, z] = ang(i / 6 * TAU + 0.26, 125); E.gifts.push({ x, z }); }
  const repairs = []; for (let i = 0; i < 6; i++) repairs.push(ang(i / 6 * TAU + 0.78, 112)); repairs.push([40, -40], [-40, 50]);
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, [x, z] = ang(a, 144); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 35 + rng() * 130, [x, z] = ang(a, r); if (Math.hypot(x - S.dish[0], z - S.dish[1]) > 24) E.orbSpots.push({ x, z }); }
  E.zones = [{ x: S.drain[0], z: S.drain[1], r: 10, name: 'THE PLUGHOLE' }]; E.flagSpots = [{ x: 0, z: 60 }]; E.captures = [{ x: 0, z: -90, r: 9 }];
  E.royale = { R: R - 4, x: 0, z: 0, ends: [[0, -70], [75, 30], [-75, 30], [60, -60], [-60, -60]], repairs, storm: { name: 'STEAM STORM', col: '#e8f6ff' }, avoid: [[S.dish[0], S.dish[1], 22]] };
  return this.finish(E);
};
// a toy sailboat (cover): a round red hull, a mast, a striped sail
function btbBoat(m) {
  m.color('#ff5a6a').shine(3); m.push(); m.tf(0, 0, 0, 0, 0, 0, 1, 0.55, 2.0); m.ball(0, 2.2, 0, 4.4, { seg: 18, rings: 10 }); m.pop();
  m.color('#ffffff').shine(2); m.roundBox(0, 3.1, 0, 7.2, 0.5, 14, 0.25);
  m.color('#ffd23a').shine(3); m.limb(0, 3.2, 0.5, 0, 16, 0.5, 0.35, 0.28, { seg: 10 }); m.ball(0, 16.2, 0.5, 0.6, { seg: 10, rings: 8 });
  for (let i = 0; i < 5; i++) { m.color(i % 2 ? '#ffffff' : '#7ad8f0').shine(0); const y0 = 4.2 + i * 2.2, w = 7.5 - i * 1.3; m.poly([[0, y0, 0.2], [0, y0 + 2.2, 0.2], [0, y0 + 2.2, 0.2 - (w - 1.3)], [0, y0, 0.2 - w]], null, [1, y0 + 1, -w / 2]); m.poly([[0, y0, 0.2 - w], [0, y0 + 2.2, 0.2 - (w - 1.3)], [0, y0 + 2.2, 0.2], [0, y0, 0.2]], null, [-1, y0 + 1, -w / 2]); }
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.8, hz: 8, y0: 0, y1: 4 }] };
}
// a shampoo bottle lying on its side, a puddle of pink shampoo out of its pump
function btbBottle(m) {
  m.color('#b48cff').shine(3); m.push(); m.tf(0, 2.6, 0, 0, Math.PI / 2, 0); m.roundBox(0, 0, 0, 7, 15, 4.6, 2.2); m.pop();
  m.color('#ffffff').shine(1); m.push(); m.tf(0, 2.6, 0.5, 0, Math.PI / 2, 0); m.roundBox(0, 0, 2.32, 4.6, 6.5, 0.1, 0.5); m.pop();
  m.color('#ffffff').shine(3); m.limb(0, 2.6, 7.4, 0, 2.6, 9.4, 1.2, 1.2, { seg: 14 }); m.limb(0, 2.6, 9.4, 0, 2.6, 10.8, 0.6, 0.6, { seg: 10 }); m.roundBox(0, 3.0, 11.6, 1.4, 1.0, 2.2, 0.35);
  m.color('#ff9ac8', 0.05).shine(4); m.push(); m.tf(0.6, 0.06, 13.6, 0, 0, 0, 1.6, 1, 1.1); m.disc(0, 0, 0, 2.2, 18); m.pop(); m.emissive(0);
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 1.5, hx: 3.6, hz: 9.5, y0: 0, y1: 5 }] };
}
// a tall bottle outside the tub (scenery)
function btbBigBottle(m) {
  m.color('#7aeec0').shine(3); m.roundBox(0, 9, 0, 9, 18, 5.4, 2.6);
  m.color('#ffffff').shine(1); m.roundBox(0, 9.5, 2.72, 6, 7, 0.1, 0.6);
  m.color('#ffffff').shine(3); m.cyl(0, 18, 0, 1.8, 1.8, 2, 18); m.cyl(0, 20, 0, 1, 1, 2.6, 14); m.roundBox(0, 23, 1.2, 2, 1.3, 4.4, 0.5);
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 4.5, hz: 2.7, y0: 0, y1: 23 }] };
}

/* ---------------- the moving parts ---------------- */
const BtbMesh = {
  // a charging duck: the shared rubber duck with an angry brow (forward = +z)
  duck(m, i) {
    btmDuck(m, ['#ffd23a', '#ffd23a', '#ff9ac8'][i % 3], '#ff8a2a', false);
    m.color('#1a1418'); for (const sd of [-1, 1]) { m.push(); m.tf(sd * 0.36, 2.42, 1.22, 0, 0, sd * 0.45); m.roundBox(0, 0, 0, 0.42, 0.09, 0.12, 0.04); m.pop(); }
  },
  // a fizzy bath bomb: a speckled ball with a moulded seam
  bomb(m, i) {
    const c = BTB.bombCol[i % 3]; m.color(c).shine(1); m.ball(0, 0, 0, 1.6, { seg: 16, rings: 12 });
    m.color('#ffffff'); m.torus(0, 0, 0, 1.6, 0.12, { seg: 22, tseg: 4 });
    for (let j = 0; j < 22; j++) { const a = j * 2.39996, y = 1 - (j + 0.5) / 22 * 2, r = Math.sqrt(1 - y * y) * 1.6; m.color(j % 3 ? '#ffe24a' : '#ffffff'); m.ball(Math.cos(a) * r, y * 1.6, Math.sin(a) * r, 0.13, { seg: 5, rings: 3 }); }
  },
  // the tap's spout: a golden swan neck (pivot at the tap, pointing along +z into the tub)
  spout(m) {
    m.color('#f0c050').shine(4);
    m.limb(0, 0, 0, 0, 2.5, 4, 1.7, 1.6, { seg: 14 }); m.limb(0, 2.5, 4, 0, 1.8, 10, 1.6, 1.5, { seg: 14 }); m.limb(0, 1.8, 10, 0, -2.4, 13.5, 1.5, 1.4, { seg: 14 });
    m.color('#cfa040'); m.push(); m.tf(0, -2.6, 13.7, 0, -0.6, 0); m.torus(0, 0, 0, 1.4, 0.3, { seg: 16, tseg: 5 }); m.pop();
    m.shine(0);
  }
};

/* ---------------- the rules ---------------- */
CART_ARENA_RULES.bigtub = {
  music: 'kart2',
  onLoad(s) {
    const S = BTB;
    const G = CartKit.group(s, [['ducks', BtbMesh.duck, S.duck.n], ['bombs', BtbMesh.bomb, S.bomb.n], ['spout', BtbMesh.spout, 1]]);
    const D = s.btb = { t: 0, ducks: [], bombs: [], slosh: { st: 'idle', t: 0, next: S.slosh.first, a: Math.PI, ax: 0, az: -1, front: 0, mask: 0, aimA: Math.PI, warned: false }, bombNext: S.bomb.first, spout: G.spout[0], lastTgt: null };
    for (let i = 0; i < S.duck.n; i++) { const a = i / S.duck.n * TAU + 0.6; D.ducks.push({ i, obj: G.ducks[i], st: 'roam', t: 0, cool: 6 + i * 3.5, x: Math.sin(a) * 60, z: Math.cos(a) * 60, yaw: a, ph: i * 2.1, ra: a, tgt: null, dx: 0, dz: 1, mask: 0, wig: 0 }); }
    for (let i = 0; i < S.bomb.n; i++) D.bombs.push({ obj: G.bombs[i], st: 'off', t: 0, x: 0, z: 0, y: 0, tgt: null });
  },
  onUpdate(s, dt, racing) {
    const D = s.btb; if (!D) return;
    const live = racing && s.state === 'race' && !(s.obj && s.obj.ended);
    if (live) D.t += dt;
    btbDucks(s, D, dt, live); btbSlosh(s, D, dt, live); btbBombs(s, D, dt, live);
  },
  // the AI: sidestep a duck's lane, hop or leave the slosh's lane, drive off a fizzing bomb (by skill)
  onStep(s, k, dt, racing) {
    const D = s.btb; if (!D || (k.player && !s.autoDrive) || !racing || k.out || s.state !== 'race') return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, luck = ((k.slot * 7 + Math.floor(D.t * 0.7)) % 10) / 10, ok = luck < 0.5 + (sk - 0.85) * 3;
    if (!ok) return;
    const steerTo = a => { const d = cartWrap(a - k.yaw); I.steer = clamp(-d * 2.4, -1, 1); };
    for (const d of D.ducks) {
      if (d.st !== 'aim' && d.st !== 'charge') continue;
      const rx = k.x - d.x, rz = k.z - d.z, along = rx * d.dx + rz * d.dz, side = rx * d.dz - rz * d.dx;
      if (along > -2 && along < 52 && Math.abs(side) < BTB.duck.lane + 2) { steerTo(Math.atan2(d.dz * (side >= 0 ? 1 : -1), -d.dx * (side >= 0 ? 1 : -1))); I.gas = 1; return; }
    }
    const W = D.slosh;
    if (W.st === 'aim' || W.st === 'wave') {
      const rx = k.x - BTB.tap[0], rz = k.z - BTB.tap[1], along = rx * W.ax + rz * W.az, side = rx * W.az - rz * W.ax;
      if (Math.abs(side) < BTB.slosh.width / 2 + 2 && along > W.front) {
        const gap = along - W.front;
        if (W.st === 'wave' && gap < 2.5 + k.speed * 0.05 && !k.air) { I.driftPress = true; I.drift = false; }
        else if (W.st === 'aim' || gap > 25) steerTo(Math.atan2(W.az * (side >= 0 ? 1 : -1), -W.ax * (side >= 0 ? 1 : -1)));
        return;
      }
    }
    for (const b of D.bombs) { if (b.st !== 'fall' && b.st !== 'fizz') continue; const dd = Math.hypot(k.x - b.x, k.z - b.z); if (dd < BTB.bomb.r + 3) { steerTo(Math.atan2(k.x - b.x, k.z - b.z)); I.gas = 1; return; } }
  },
  draw(s, R, Sp, t) { const D = s.btb; if (D) btbDraw(s, D, R, Sp, t); },
  lights(s, add) { const D = s.btb; if (!D) return; for (const b of D.bombs) if (b.st === 'fizz') add(b.x, 1.5, b.z, 12, BTB.C.pink, 1.2, 1.5); },
  radar(s, ctx, P, sc) {
    const q = CART_ROY_T.p, D = s.btb;
    P(BTB.dish[0], BTB.dish[1], q); ctx.fillStyle = 'rgba(255,138,192,0.7)'; ctx.fillRect(q.x - 3, q.y - 2, 6, 4);
    if (D) { ctx.fillStyle = 'rgba(255,210,58,0.95)'; for (const d of D.ducks) { P(d.x, d.z, q); ctx.beginPath(); ctx.arc(q.x, q.y, 2.5, 0, TAU); ctx.fill(); } }
  }
};

// ---- the duck armada: paddle about; pick a car, turn and quack (aim), charge down the lane, rest ----
function btbDucks(s, D, dt, live) {
  const S = BTB.duck, R = BTB.R - 10;
  for (const d of D.ducks) {
    d.t += dt; if (d.cool > 0 && live) d.cool -= dt;
    if (d.st === 'roam') {
      d.ra += dt * 0.07 * (d.i % 2 ? 1 : -1); const rr = 60 + 35 * Math.sin(D.t * 0.05 + d.ph), gx = Math.sin(d.ra) * rr, gz = Math.cos(d.ra) * rr;
      const want = Math.atan2(gx - d.x, gz - d.z); d.yaw = d.yaw + cartWrap(want - d.yaw) * Math.min(1, dt * 1.5); d.x += Math.sin(d.yaw) * 5 * dt; d.z += Math.cos(d.yaw) * 5 * dt;
      if (live && d.cool <= 0) {
        let best = null, bd = 62; for (const k of s.karts) { if (k.out || k.hidden || k.invT > 0.5) continue; const dd = Math.hypot(k.x - d.x, k.z - d.z) + (k === d.tgt ? 30 : 0) + (D.ducks.some(o => o !== d && o.st !== 'roam' && o.tgt === k) ? 40 : 0); if (dd > 12 && dd < bd) { bd = dd; best = k; } }
        if (best) { d.st = 'aim'; d.t = 0; d.tgt = best; d.mask = 0; Sound.play('cartQuack', { vol: best.player ? 0.9 : Math.hypot(s.player.x - d.x, s.player.z - d.z) < 60 ? 0.4 : 0.1, pitch: 0.6 }); if (best.player) s.banner('DUCK CHARGE!', '#ffd23a', 1.2, 'sidestep the lane', true); }
        else d.cool = 1;
      }
    } else if (d.st === 'aim') {
      const k = d.tgt; if (k && !k.out) { const want = Math.atan2(k.x + k.vx * 0.5 - d.x, k.z + k.vz * 0.5 - d.z); d.yaw = d.yaw + cartWrap(want - d.yaw) * Math.min(1, dt * (d.t < 0.8 ? 6 : 1.5)); }
      d.dx = Math.sin(d.yaw); d.dz = Math.cos(d.yaw);
      if (d.t > S.aim) { d.st = 'charge'; d.t = 0; Sound.play('cartQuack', { vol: Math.hypot(s.player.x - d.x, s.player.z - d.z) < 60 ? 0.8 : 0.15, pitch: 0.9 }); }
    } else if (d.st === 'charge') {
      d.x += d.dx * S.speed * dt; d.z += d.dz * S.speed * dt;
      let stop = d.t > S.charge || Math.hypot(d.x, d.z) > R;
      for (const a of s.E.art) if (Math.hypot(d.x - a.x, d.z - a.z) < a.r + 2) stop = true;
      if (live) for (const k of s.karts) {
        if (k.out || (d.mask & (1 << k.slot)) || k.y > 3) continue;
        const dx = k.x - d.x, dz = k.z - d.z; if (dx * dx + dz * dz > S.reach * S.reach) continue;
        d.mask |= 1 << k.slot;
        if (s.hit(k, 'knock', null, { item: 'btbduck', dx: d.dx, dz: d.dz, power: 15, banner: 'DUCK CHARGE!' })) { Sound.play('cartQuack', { vol: k.player ? 1 : 0.3, pitch: 1.2 }); if (s.fx) s.fx.burst(k.x, k.y + 1.2, k.z, 'star', 10, '#ffd23a'); }
      }
      if (stop) { d.st = 'rest'; d.t = 0; if (s.fx) s.fx.dust(d.x, 0.5, d.z, 10, '#e8f4ff'); }
    } else if (d.st === 'rest') { if (d.t > S.rest) { d.st = 'roam'; d.t = 0; d.cool = S.cool + s.rng() * 3; } }
    // keep inside the tub and out of the cover
    const r0 = Math.hypot(d.x, d.z); if (r0 > R) { d.x *= R / r0; d.z *= R / r0; }
    for (const a of s.E.art) { const dx = d.x - a.x, dz = d.z - a.z, dd = Math.hypot(dx, dz), m = a.r + 1.5; if (dd < m) { d.x = a.x + dx / (dd || 1) * m; d.z = a.z + dz / (dd || 1) * m; } }
  }
}
// ---- the slosh: the tap swivels to aim and shudders (aim), a wave of bathwater rolls down the lane ----
function btbSlosh(s, D, dt, live) {
  const S = BTB.slosh, W = D.slosh, tx = BTB.tap[0], tz = BTB.tap[1];
  if (live) W.t += dt;
  if (W.st === 'idle' && live && D.t > W.next) {
    // aim at a car somewhere down the tub (not always the player)
    let best = null, bs = -1e9; for (const k of s.karts) { if (k.out || k.hidden) continue; const sc = s.rng() * 60 + (k === D.lastSlosh ? -40 : 0) - Math.abs(Math.hypot(k.x - tx, k.z - tz) - 150) * 0.3; if (sc > bs) { bs = sc; best = k; } }
    const a = best ? Math.atan2(best.x - tx, best.z - tz) : Math.PI; W.aimA = Math.PI + clamp(cartWrap(a - Math.PI), -0.62, 0.62); D.lastSlosh = best;
    W.st = 'aim'; W.t = 0; W.mask = 0; W.warned = false; Sound.play('cartGeyser', { vol: 0.5, pitch: 0.55 });
  }
  if (W.st === 'aim') {
    W.a = W.a + cartWrap(W.aimA - W.a) * Math.min(1, dt * 3); W.ax = Math.sin(W.a); W.az = Math.cos(W.a);
    const P = s.player; if (P && !P.out && !W.warned && W.t > 0.3) { const rx = P.x - tx, rz = P.z - tz, side = rx * W.az - rz * W.ax; if (Math.abs(side) < S.width / 2 + 4) { W.warned = true; s.banner('THE SLOSH!', '#7ad8f0', 1.2, 'hop the wave or get out of the lane', true); } }
    if (W.t > S.aim) { W.st = 'wave'; W.t = 0; W.front = 0; Sound.play('splash', { vol: 0.9, pitch: 0.5 }); Sound.play('wind', { vol: 0.5, pitch: 0.6 }); }
  } else if (W.st === 'wave') {
    W.front = W.t * S.speed;
    if (live) for (const k of s.karts) {
      if (k.out || (W.mask & (1 << k.slot))) continue;
      const rx = k.x - tx, rz = k.z - tz, along = rx * W.ax + rz * W.az, side = rx * W.az - rz * W.ax;
      if (Math.abs(side) > S.width / 2 || Math.abs(along - W.front) > S.band) continue;
      W.mask |= 1 << k.slot;
      if (k.air && k.y > s.terrain.height(k.x, k.z) + 0.3) { if (k.player) s.banner('NICE HOP!', '#7aff8a', 0.7, null, true); continue; }
      if (s.hit(k, 'knock', null, { item: 'btbslosh', dx: W.ax, dz: W.az, power: 17, banner: 'SLOSHED!' })) { if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'ring', 12, '#bfe8ff'); }
    }
    if (W.front > BTB.R * 2 + 10) { W.st = 'idle'; W.next = D.t + S.period * (0.85 + s.rng() * 0.3); }
  }
  const o = D.spout; if (o) { const shud = W.st === 'aim' ? Math.sin(s.time * 38) * 0.04 : 0; o.live = true; o.visible = true; o.x = tx; o.y = BTB.wallH + 8.5; o.z = tz - 1; o.yaw = W.a + shud; o.pitch = shud; o.roll = 0; o.scale = 1; }
}
// ---- bath bombs: fall on a car (target + shadow), land and fizz, burst in foam ----
function btbBombs(s, D, dt, live) {
  const S = BTB.bomb;
  if (live && D.t > D.bombNext) {
    D.bombNext = D.t + S.period * (0.8 + s.rng() * 0.4);
    const b = D.bombs.find(q => q.st === 'off');
    let best = null, bs = -1e9; for (const k of s.karts) { if (k.out || k.hidden || k.invT > 1) continue; const sc = s.rng() * 10 - (D.bombs.some(q => q.st !== 'off' && q.tgt === k) ? 50 : 0) - (k === D.lastBomb ? 20 : 0); if (sc > bs) { bs = sc; best = k; } }
    if (b && best) { D.lastBomb = best; b.tgt = best; b.st = 'fall'; b.t = 0; const lead = 0.9 + s.rng() * 0.4; b.x = best.x + best.vx * lead + (s.rng() - 0.5) * 6; b.z = best.z + best.vz * lead + (s.rng() - 0.5) * 6; const r = Math.hypot(b.x, b.z); if (r > BTB.R - 8) { b.x *= (BTB.R - 8) / r; b.z *= (BTB.R - 8) / r; } b.y = 34; if (best.player) Sound.play('throw', { vol: 0.6, pitch: 0.8 }); }
  }
  for (const b of D.bombs) {
    if (b.st === 'off') { if (b.obj) { b.obj.live = false; b.obj.visible = false; } continue; }
    b.t += dt;
    if (b.st === 'fall') { const u = Math.min(1, b.t / S.fall); b.y = 34 * (1 - u * u) + 1.6; if (u >= 1) { b.st = 'fizz'; b.t = 0; b.y = 1.6; Sound.play('stomp', { vol: Math.hypot(s.player.x - b.x, s.player.z - b.z) < 50 ? 0.6 : 0.1, pitch: 1.3 }); if (s.fx) s.fx.dust(b.x, 0.3, b.z, 8, '#ffffff'); } }
    else if (b.st === 'fizz') {
      if (s.fx && Math.random() < 0.8) s.fx.add(b.x, 2.2, b.z, (Math.random() - 0.5) * 8, 4 + Math.random() * 5, (Math.random() - 0.5) * 8, 0.8, 0.6, 0.2, BTB.fizz[Math.floor(Math.random() * 5)], 1, 'bubble', 0, 0, 0);
      if (b.t > S.fizz) {
        b.st = 'off';
        if (live) for (const k of s.karts) { if (k.out || k.y > 4) continue; if (Math.hypot(k.x - b.x, k.z - b.z) < S.r) s.hit(k, 'foam', null, { item: 'btbbomb', dur: 2.0, banner: 'BATH BOMB!' }); }
        if (s.fx) { s.fx.burst(b.x, 1.5, b.z, 'ring', 16, '#ff8ac0'); s.fx.burst(b.x, 2, b.z, 'star', 14, '#ffe24a'); s.fx.smoke(b.x, 1, b.z, 6, '#ffffff'); }
        const P = s.player; Sound.play('cartBoom', { vol: P && Math.hypot(P.x - b.x, P.z - b.z) < 50 ? 0.7 : 0.15, pitch: 1.5 }); Sound.play('cartBubble', { vol: P && Math.hypot(P.x - b.x, P.z - b.z) < 50 ? 0.6 : 0.1, pitch: 0.8 });
      }
    }
    const o = b.obj; if (o) { const on = b.st !== 'off'; o.live = on; o.visible = on; o.x = b.x + (b.st === 'fizz' ? Math.sin(s.time * 40) * 0.08 : 0); o.y = b.y; o.z = b.z; o.yaw = s.time * (b.st === 'fall' ? 3 : 0.5); o.pitch = b.st === 'fall' ? s.time * 2 : 0; o.roll = 0; o.scale = b.st === 'fizz' ? 1 + Math.sin(s.time * 30) * 0.04 + b.t * 0.12 : 1; }
  }
}
// ---- sprites: the duck lanes, the slosh lane and its wave, the bomb targets and fizz ----
function btbDraw(s, D, R, Sp, t) {
  const C = BTB.C, S = BTB;
  for (const d of D.ducks) {
    const o = d.obj; if (!o) continue;
    const bob = Math.sin(t * 2 + d.ph) * 0.12, wig = d.st === 'aim' ? Math.sin(t * 30) * 0.12 : 0;
    o.live = true; o.visible = true; o.x = d.x; o.y = bob; o.z = d.z; o.yaw = d.yaw + wig; o.pitch = d.st === 'charge' ? 0.18 : d.st === 'rest' ? -0.05 : 0; o.roll = Math.sin(t * 1.4 + d.ph) * 0.06 + wig; o.scale = S.duck.scale;
    if (d.st === 'aim') {
      // the lane flashes pink, chevrons run down it
      const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 18)), L = 48, a = Math.atan2(d.dx, d.dz);
      R.flat.flat(d.x + d.dx * L / 2, 0.08, d.z + d.dz * L / 2, S.duck.lane * 2, L, a, Sp.square, C.pink, 0.45 * fl, false);
      for (const sd of [-1, 1]) R.flat.flat(d.x + d.dx * L / 2 + d.dz * sd * S.duck.lane, 0.09, d.z + d.dz * L / 2 - d.dx * sd * S.duck.lane, 0.5, L, a, Sp.square, C.hot, 0.85 * fl, false);
      for (let i = 0; i < 6; i++) { const u = (i / 6 + t * 1.4) % 1; R.flat.flat(d.x + d.dx * (6 + u * (L - 6)), 0.1, d.z + d.dz * (6 + u * (L - 6)), 4, 4, a, Sp.arrow, C.hot, 0.9 * fl, false); }
      R.bbs.bb(d.x, 8.4, d.z, 3.4, 3.4, Sp.warn, C.warn, 0.6 + 0.4 * fl, true);
    } else if (d.st === 'charge') {
      for (let i = 1; i <= 5; i++) R.bbs.bb(d.x - d.dx * i * 2, 0.8, d.z - d.dz * i * 2, 4 - i * 0.5, 2.4 - i * 0.3, Sp.foam || Sp.puff, C.foam, 0.85 - i * 0.14, false, t * 4 + i);
    }
    R.flat.flat(d.x, 0.06, d.z, 9, 9, 0, Sp.shadow, C.black, 0.3, false);
  }
  const W = D.slosh, tx = S.tap[0], tz = S.tap[1];
  if (W.st === 'aim' || W.st === 'wave') {
    const L = S.R * 2, a = W.a;
    if (W.st === 'aim') {
      const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 16));
      R.flat.flat(tx + W.ax * L / 2, 0.07, tz + W.az * L / 2, S.slosh.width, L, a, Sp.square, C.blue, 0.42 * fl, false);
      for (const sd of [-1, 1]) R.flat.flat(tx + W.ax * L / 2 + W.az * sd * S.slosh.width / 2, 0.08, tz + W.az * L / 2 - W.ax * sd * S.slosh.width / 2, 0.7, L, a, Sp.square, C.aqua, 0.9 * fl, false);
      for (let i = 0; i < 8; i++) { const u = (i / 8 + t * 0.9) % 1, r = 8 + u * (L - 16); R.flat.flat(tx + W.ax * r, 0.09, tz + W.az * r, 6, 6, a, Sp.arrow, C.aqua, 0.8 * fl, false); }
      // drips from the spout
      for (let i = 0; i < 4; i++) { const u = (t * 1.5 + i * 0.25) % 1, sx = tx + W.ax * 13.5, sz = tz - 1 + W.az * 13.5; R.bbs.bb(sx, S.wallH + 6 - u * (S.wallH + 6), sz, 0.6, 1.1, Sp.drop, C.water, 0.95, false); }
    } else {
      // the wave: a wall of foam and water rolling along the lane, wet floor behind it, the torrent from the spout
      const f = W.front, cx = tx + W.ax * f, cz = tz + W.az * f;
      if (f > 3 && f < L) {
        R.flat.flat(tx + W.ax * f / 2, 0.06, tz + W.az * f / 2, S.slosh.width, f, a, Sp.square, C.deep, 0.22, false);
        R.flat.flat(cx, 0.08, cz, S.slosh.width + 2, 6, a, Sp.square, C.water, 0.55, false);
        for (let i = 0; i <= 10; i++) { const u = i / 10 - 0.5, x = cx + W.az * u * S.slosh.width, z = cz - W.ax * u * S.slosh.width, h = 2.6 + Math.sin(t * 9 + i * 1.7) * 0.6; R.bbs.bb(x, h * 0.55, z, 4.4, h * 1.4, Sp.puff, C.water, 0.85, false, t * 3 + i); R.bbs.bb(x - W.ax * 0.8, h + 0.2, z - W.az * 0.8, 3.4, 2.2, Sp.foam || Sp.puff, C.foam, 0.9, false, i); }
      }
      const sx = tx + W.ax * 13.5, sz = tz - 1 + W.az * 13.5; if (W.t < 1.6) { const k2 = 1 - W.t / 1.6; R.bbs.streak(sx, (S.wallH + 6) / 2, sz, 0, 1, 0, S.wallH + 6, 4 * k2 + 1, Sp.streak, C.water, 0.8 * k2); R.flat.flat(sx, 0.1, sz, 14, 14, t, Sp.ring, C.white, 0.6 * k2, false); }
    }
  }
  for (const b of D.bombs) {
    if (b.st === 'fall') { const u = Math.min(1, b.t / S.bomb.fall), bl = 0.55 + 0.45 * Math.sin(t * (10 + u * 20)), sz = S.bomb.r * 2 * (1.4 - u * 0.4); R.flat.flat(b.x, 0.1, b.z, sz, sz, t * 2, Sp.reticle || Sp.ring, C.hot, 0.8 * bl, false); R.flat.flat(b.x, 0.08, b.z, 2 + u * 4, 2 + u * 4, 0, Sp.shadow, C.black, 0.3 + u * 0.4, false); }
    else if (b.st === 'fizz') { const bl = 0.5 + 0.5 * Math.sin(t * 26); R.flat.flat(b.x, 0.1, b.z, S.bomb.r * 2, S.bomb.r * 2, 0, Sp.reticle || Sp.ring, C.red, 0.9 * bl, false); R.flat.flat(b.x, 0.09, b.z, S.bomb.r * 2, S.bomb.r * 2, 0, Sp.glow, C.pink, 0.35, true); for (let i = 0; i < 5; i++) R.bbs.bb(b.x + Math.sin(t * 5 + i * 1.3) * 1.6, 2 + i * 0.5 + Math.sin(t * 9 + i) * 0.3, b.z + Math.cos(t * 5 + i * 1.3) * 1.6, 2.2, 2.2, Sp.foam || Sp.bubble, BTB.fizz[i], 0.85, false, t * 3 + i); }
  }
}

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'bigtub', name: 'THE BIG TUB', sub: 'Battle royale: charging rubber ducks, the slosh, bath bombs', objectives: ['royale'], royale: true, levelCar: 'duck',
  col: '#7ad8f0', tod: 'day', blurb: 'Quackzilla\'s tub. Sidestep the duck armada, hop the slosh, drive off the bath bombs. Last car running wins.'
});
CART_ROYALE_ARENAS.duck = 'bigtub';
CART_ARENA_ICONS.bigtub = (ctx, s, t, col) => {
  // a round tub seen from above, water rippling, a rubber duck bobbing in it
  const b = Math.sin(t * 3) * s * 0.04;
  ctx.save(); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#9ae2f6'; ctx.beginPath(); ctx.arc(0, 0, s * 0.64, 0, TAU); ctx.fill();
  for (let i = 1; i <= 2; i++) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, s * (0.18 + i * 0.16 + (t * 0.1 % 0.16)), 0, TAU); ctx.stroke(); }
  ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(-s * 0.04, s * 0.1 + b, s * 0.3, s * 0.2, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(s * 0.16, -s * 0.12 + b, s * 0.16, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.ellipse(s * 0.34, -s * 0.1 + b, s * 0.09, s * 0.05, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a1418'; ctx.beginPath(); ctx.arc(s * 0.2, -s * 0.16 + b, s * 0.03, 0, TAU); ctx.fill(); ctx.restore();
};
