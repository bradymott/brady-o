/* ============================================================
   BRADY-O BURNS — World 15 (secret): EXODUS
   Monday morning. The Man has burned, Chinka is back, and the Party
   Barge has to get out of the playa and down the highway to Gerlach.
   Departing burners hand over their last bags (every one cranks the
   TRIP METER and the world gets wonkier), and the highway patrol is
   watching: keep it together.
   Missions (Burn Tokens):
     pulse       Survive the Pulse           the Exodus line's pulses + THE BIG PULSE
     bags        Every Last Bag              collect all 8 last bags
     together    Keep It Together            get through the checkpoint without getting busted
     undercover  Shake the Undercover Cop    lose the jester-hat convertible
     pony        Pony Express                give a stranded sparkle pony a ride to Gerlach
     springs     Scenic Detour (hidden)      find the hot springs off the highway
     gerlach     Reach Gerlach               breakfast at the diner, then home
   Files: 42_burns_w15_a_kit.js (models, road, terrain), 42_burns_w15_b_drive.js
   (Party Barge + trip), 42_burns_w15_c_cops.js (cops, sky, HUD), this file.
   ============================================================ */

const BW15W = {
  PAL_A: { zen: '#1c2456', hor: '#d8889a', fog: '#b898a8', fogD: 0.0085, fogH: 0.05, haze: 0.62, fogMax: 0.9, sun: [92, -3], sunCol: '#ff9a6a', sunSize: 0.0022, moon: [250, 24], moonK: 0.55, stars: 0.35, mtnCol: '#3e2e52', mtnH: 3.4, city: [180, 0], cityCol: '#ff6ab0', cityK: 0.18, sky: '#9a8ab8', gnd: '#8a6a68', key: '#ffb0a0', keyK: 0.7, emB: 1.35, rim: '#ffb8d0', clouds: 0.4, cloudCol: '#e8a0b0', mid: '#a06a9a', midK: 0.35 },
  PAL_B: { zen: '#3a70c8', hor: '#ffd0a0', fog: '#ecc8a8', fogD: 0.0065, fogH: 0.045, haze: 0.58, fogMax: 0.86, sun: [96, 9], sunCol: '#ffe0a8', sunSize: 0.0024, moon: [250, 20], moonK: 0.12, stars: 0, mtnCol: '#7a6a82', mtnH: 3.3, city: [180, 0], cityCol: '#000000', cityK: 0, sky: '#c8d0e8', gnd: '#c8a888', key: '#ffe8c8', keyK: 0.95, emB: 1.15, rim: '#fff0e0', clouds: 0.45, cloudCol: '#fff0e0', mid: '#f0b0a0', midK: 0.3 },
  GIVERS: [
    { type: 'partiedtoohard', seed: 3, name: 'DUSTY DAN', power: 'powder', hello: 'Hey! HEY! Party barge!', line: 'We\'re leaving, man. Can\'t take it with us. What day is it? Take it. I\'m DONE done.', thanks: 'Free at last! Is it Tuesday?' },
    { type: 'sparklepony', seed: 8, name: 'GLIMMER', power: 'molly', hello: 'Ooh! Stickers! Wait up!', line: 'We\'re leaving! Can\'t take it with us! It doesn\'t go with my outfit anyway.', thanks: 'Byeee! Hydrate! Or whatever!' },
    { type: 'crusty', seed: 21, name: 'OLD SAGE', power: 'shrooms', hello: 'Kid. Kid! C\'mere.', line: 'Back in \'98 we didn\'t even HAVE baggies. Here. Can\'t take it with us. Never could.', thanks: 'It peaked on Baker Beach, kid. Remember that.' },
    { type: 'burnermom', seed: 5, name: 'SOMEONE\'S MOM', power: 'weed', hello: 'Yoo-hoo! Sweetie!', line: 'My son said "Mom, get rid of this before the highway!" Is it a mint? Take it, sweetie!', thanks: 'Drive safe! Call your mother!' },
    { type: 'furry', seed: 2, name: 'FUZZWICK', power: 'lsd', hello: '*muffled waving*', line: '*muffled* CAN\'T FIT IT IN THE SUIT! TAKE IT! TAKE IT!', thanks: '*happy muffled noises*' },
    { type: 'techbro', seed: 9, name: 'CHADWICK', power: 'khole', hello: 'Yo! Party barge! Quick pitch!', line: 'I\'m liquidating my position before the default world. Consider it a gift. Like, an exit gift.', thanks: 'Circle back next year, bro!' },
    { type: 'healer', seed: 4, name: 'RAINBOW', power: 'bufo', hello: 'Namaste, beautiful barge!', line: 'The springs told me to let go. Of everything. Starting with this.', thanks: 'I am lighter. I am steam.' },
    { type: 'sparklepony', seed: 12, name: 'GLITTER', power: 'liquor', hello: '', line: '', thanks: '' }
  ],
  /* ---------------- terrain features (baked once into the height grid) ---------------- */
  terrain() {
    const T = BW15_TERR; if (T.G) return;
    const R = BW15_ROAD.build(), at = (s, lat) => R.at(s, lat, {});
    const gas = at(BW15.S.gas, -24), spr = at(790, 52), hill = at(985, 70);
    T.pads.push({ x: gas.x, z: gas.z, r: 24, h: R.height(BW15.S.gas), edge: 16 });
    T.pads.push({ x: spr.x, z: spr.z, r: 22, h: R.height(790) - 0.5, edge: 18 });
    T.pads.push({ x: -14, z: 700, r: 78, h: R.height(BW15.S.welcome), edge: 26 });
    const ckp = at(BW15.S.check, 0); T.pads.push({ x: ckp.x, z: ckp.z, r: 30, h: R.height(BW15.S.check), edge: 20 });
    T.bumps.push({ x: hill.x, z: hill.z, r: 40, h: 11, base: 1.5 });
    const a = at(BW15.S.springsOut, 0), b = at(BW15.S.springsIn, 0);
    T.tracks.push({ w: 4.5, pts: [[a.x, a.z, R.height(BW15.S.springsOut)], [spr.x - 30, spr.z - 6, R.height(790) - 0.2], [spr.x - 8, spr.z, R.height(790) - 0.5], [spr.x + 6, spr.z + 22, R.height(790) - 0.3], [b.x, b.z, R.height(BW15.S.springsIn)]] });
    BW15W.springs = spr; BW15W.gas = gas; BW15W.hill = hill;
    T.build();
  },
  tracker() {
    const S = BW15.state; if (!S) return 'Drive to Gerlach';
    if (S.chase) return 'Lose the cops! Dust · trucks · traffic';
    if (S.enc) return 'KEEP IT TOGETHER!';
    if (S.tail) return 'Shake the undercover cop!';
    if (S.ponyAboard) return 'Drive Glitter to the Gerlach diner';
    if (S.s > BW15.S.welcome - 30) return 'Park at the diner (right side)';
    if (S.s > BW15.S.check - 130 && S.s < BW15.S.check + 10) return 'Checkpoint ahead: crawl through';
    return 'Drive to Gerlach';
  },
  pulseShort() {
    const S = BW15.state, ph = S ? S.pulse.phase : 'hold1';
    if (ph === 'big' || ph === 'count') return 'THE BIG PULSE: make the gate!';
    if (ph === 'go1') return 'Roll with the pulse';
    if (ph === 'retry' || ph === 'wait' || ph === 'missed') return 'Get ready for the next pulse';
    return 'Hold for the pulse · take the last bags';
  }
};

BurnsWorlds.register({
  id: 15, name: 'Exodus', sub: 'Monday morning. Gerlach or bust.',
  secret: true, hidden: true, unlockAfter: 10,
  sky: BW15W.PAL_A, sky2: BW15W.PAL_B, tod: 0,
  music: 'burns_w15',
  bounds: [-190, -580, 190, 800],
  spawn: { x: -3.5, y: 0, z: -506, yaw: 0 },
  ground: { base: '#cfae8a', crack: 0.24, mottle: 0.38, res: 0.72, height: (x, z) => BW15_TERR.h(x, z) },
  dust: 1.4,
  missions: [
    { id: 'bags', name: 'Every Last Bag', type: 'custom', count: 8, start: 'auto', progressLabel: 'Last bags', tokenDirect: true, short: 'Collect every last bag',
      desc: 'Departing burners can\'t take their last bags with them. Take all eight. Every bag cranks the TRIP METER, and the world gets wonkier.', hint: 'Line stops, a hitchhiker, the gas station, the hot springs, and a stranded sparkle pony' },
    { id: 'springs', name: 'Scenic Detour', type: 'custom', start: 'manual', secret: true, tokenDirect: true, short: 'Take the scenic detour',
      desc: 'Hot springs, off the road behind the hills. Very scenic. Very steamy.', hint: 'A dirt track left of the highway, after the checkpoint' },
    { id: 'pony', name: 'Pony Express', type: 'custom', start: 'manual', tokenDirect: true, short: 'Drive Glitter to the Gerlach diner',
      desc: 'A sparkle pony got left behind at the gas station. Give her a ride to Gerlach. She brought her own glitter.', hint: 'The tiny gas station on the highway', marker: { x: -132, z: 220 } },
    { id: 'together', name: 'Keep It Together', type: 'custom', start: 'auto', requires: ['pulse'], silent: true, tokenDirect: true, short: 'Get through the checkpoint',
      desc: 'A checkpoint on the highway. Crawl through, hold your lane, and tap STEADY on the beat while the trip peaks.', hint: 'The checkpoint past the gas station', marker: { x: -25, z: 371 } },
    { id: 'undercover', name: 'Shake the Undercover Cop', type: 'custom', start: 'manual', tokenDirect: true, short: 'Shake the undercover cop',
      desc: 'A beige convertible, a jester hat and a gold badge he keeps flashing by accident. Lose him in the dust, behind trucks or in the traffic.', hint: 'He starts following you after the checkpoint' },
    { id: 'pulse', name: 'Survive the Pulse', type: 'custom', start: 'auto', tokenDirect: true, get short() { return BW15W.pulseShort(); },
      desc: 'The Exodus line moves in pulses. Hold, take the last bags, roll. Then THE BIG PULSE: weave through the lanes and make the gate before it closes.', hint: 'The Exodus line on the playa', marker: { x: 0, z: -214 } },
    { id: 'gerlach', name: 'Reach Gerlach', type: 'custom', start: 'auto', requires: ['pulse'], tokenDirect: true, get short() { return BW15W.tracker(); },
      desc: 'Drive the Party Barge to the little desert town of Gerlach. There is a diner. There are pancakes.', hint: 'Follow the highway all the way', marker: { x: -31, z: 692 } }
  ],
  build(api, g) {
    BW15W.terrain();
    const S = BW15D.init(g), R = BW15_ROAD.build(), H = (x, z) => api.height(x, z), rng = mulberry32(15151);
    const at = (s, lat) => R.at(s, lat, {});
    const L = BW15.LANES;
    // place a static mesh on the terrain, facing yaw
    const put = (x, z, fn, yaw, extra) => api.mesh(x, z, fn, Object.assign({ y: H(x, z), yaw: yaw || 0 }, extra || {}));
    const prop = (kind, o) => api.prop(kind, Object.assign({ y: H(o.x, o.z) }, o));
    const glow = (x, z, n, dx, dz, y) => { for (let i = 0; i < n; i++) { const px = x + dx * i, pz = z + dz * i; api.pickup('glowstick', px, H(px, pz) + (y || 1.1), pz); } };
    const glowRoad = (s0, s1, lat, n) => { for (let i = 0; i < n; i++) { const a = at(lerp(s0, s1, n === 1 ? 0.5 : i / (n - 1)), lat); api.pickup('glowstick', a.x, H(a.x, a.z) + 1.2, a.z); } };
    const facing = (a) => Math.atan2(a.x0 - a.x, a.z0 - a.z);
    const tsign = (text, x, z, o) => put(x, z, m => BurnsProps.sign(m, Object.assign({ text }, o, { y: undefined })), o.yaw || 0);
    /* ================= ground paint ================= */
    api.paint((c, P, sc) => {
      const B = [-190, -580, 190, 800];
      // desert soil past the playa
      { const [, za] = P(0, -40), [, zb] = P(0, 90); const gr = c.createLinearGradient(0, za, 0, zb); gr.addColorStop(0, 'rgba(150,120,90,0)'); gr.addColorStop(1, 'rgba(150,118,86,0.5)'); c.fillStyle = gr; const [x0] = P(B[0] - 40, 0), [x1] = P(B[2] + 40, 0), [, z1] = P(0, B[3] + 40); c.fillRect(x0, za, x1 - x0, z1 - za); }
      for (let i = 0; i < 520; i++) { const x = rng.range(-230, 230), z = rng.range(-620, 840), [px, pz] = P(x, z), r = rng.range(2, 10) * sc; const dark = rng() < 0.5; const g2 = c.createRadialGradient(px, pz, 0, px, pz, r); g2.addColorStop(0, z > 40 ? (dark ? 'rgba(110,105,80,0.28)' : 'rgba(220,190,150,0.25)') : (dark ? 'rgba(120,85,65,0.22)' : 'rgba(240,215,180,0.25)')); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; c.fillRect(px - r, pz - r, r * 2, r * 2); }
      // sage speckles on the desert
      for (let i = 0; i < 2600; i++) { const x = rng.range(-230, 230), z = rng.range(30, 840); const pr = R.project(x, z, null, {}); if (pr.d < 9) continue; const [px, pz] = P(x, z); c.fillStyle = rng() < 0.5 ? 'rgba(110,125,90,0.45)' : 'rgba(150,140,110,0.35)'; c.beginPath(); c.arc(px, pz, (0.4 + rng() * 0.8) * sc, 0, TAU); c.fill(); }
      // the Exodus line: rutted lanes + tyre tracks
      { const [x0, z0] = P(-17, -600), [x1, z1] = P(17, BW15.GATE_Z + 4); c.fillStyle = 'rgba(160,120,92,0.35)'; c.fillRect(x0, z0, x1 - x0, z1 - z0); }
      c.strokeStyle = 'rgba(95,68,52,0.35)'; c.lineWidth = 0.45 * sc;
      for (const lx of L) for (const o of [-0.85, 0.85]) { const [a, b] = P(lx + o, -620), [, d] = P(lx + o, -150); c.beginPath(); c.moveTo(a, b); c.lineTo(a, d); c.stroke(); }
      // pulse stop lines
      c.fillStyle = 'rgba(255,255,255,0.75)'; for (const z of [BW15.STOP_A, BW15.STOP_B]) { const [x0, za] = P(-16, z), [x1] = P(16, z); c.fillRect(x0, za - 0.3 * sc, x1 - x0, 0.6 * sc); }
      // the dust bowl past the gate
      { const [px, pz] = P(0, -176), r = 36 * sc; const gg = c.createRadialGradient(px, pz, 0, px, pz, r); gg.addColorStop(0, 'rgba(240,215,180,0.6)'); gg.addColorStop(1, 'rgba(240,215,180,0)'); c.fillStyle = gg; c.fillRect(px - r, pz - r, r * 2, r * 2); }
    });
    // dirt gate road + dusty highway shoulders + the springs track
    const pts = (s0, s1, lat, step) => { const o = []; for (let s = s0; s <= s1; s += step) { const a = at(s, lat || 0); o.push([a.x, a.z]); } return o; };
    api.road(pts(0, BW15.S.pave + 8, 0, 6), 11, { col: 'rgba(200,170,135,0.6)', edge: 'rgba(120,90,70,0.3)', tracks: [-2.6, -1.2, 1.2, 2.6] });
    api.road(pts(BW15.S.pave - 4, R.len, 0, 6), 12.5, { col: 'rgba(170,150,125,0.55)', edge: 'rgba(110,90,70,0.3)' });
    { const T = BW15_TERR.tracks[0].pts.map(p => [p[0], p[1]]); api.road(T, 6.5, { col: 'rgba(200,175,140,0.6)', edge: 'rgba(120,95,75,0.3)', tracks: [-1.1, 1.1] }); }
    /* ================= the paved highway (rounded edges, lines, shoulders) ================= */
    for (let s0 = BW15.S.pave; s0 < R.len - 2; s0 += 40) {
      const s1 = Math.min(R.len - 1, s0 + 40), mid = at((s0 + s1) / 2, 0), cx = mid.x, cz = mid.z;
      api.mesh(cx, cz, m => {
        const q = (a, b, c2, d) => m.poly([a, b, c2, d], null, [(a[0] + c2[0]) / 2, Math.min(a[1], c2[1]) - 1, (a[2] + c2[2]) / 2]);
        const P = (s, lat, dy) => { const a = at(s, lat); return [a.x - cx, H(a.x, a.z) + dy, a.z - cz]; };
        for (let s = s0; s < s1 - 0.01; s += 2) {
          const t = Math.min(s1, s + 2);
          m.color('#a8987e'); q(P(s, 4.9, 0.03), P(t, 4.9, 0.03), P(t, 3.7, 0.055), P(s, 3.7, 0.055)); q(P(s, -3.7, 0.055), P(t, -3.7, 0.055), P(t, -4.9, 0.03), P(s, -4.9, 0.03));
          m.color('#3e3e48'); q(P(s, 3.7, 0.06), P(t, 3.7, 0.06), P(t, -3.7, 0.06), P(s, -3.7, 0.06));
          m.color('#ecece4', 0.2); q(P(s, 3.55, 0.075), P(t, 3.55, 0.075), P(t, 3.4, 0.075), P(s, 3.4, 0.075)); q(P(s, -3.4, 0.075), P(t, -3.4, 0.075), P(t, -3.55, 0.075), P(s, -3.55, 0.075));
          if (Math.floor(s / 3) % 3 === 0) { m.color('#ffd23a', 0.3); q(P(s, 0.08, 0.075), P(t, 0.08, 0.075), P(t, -0.08, 0.075), P(s, -0.08, 0.075)); }
          m.emissive(0);
        }
        return { cols: [] };
      });
    }
    /* ================= the Exodus line ================= */
    for (let z = -600; z < BW15.GATE_Z - 4; z += 20) { api.prop('fence', { x: -BW15.FENCE_X, z: z + 10, yaw: Math.PI / 2, len: 20 }); api.prop('fence', { x: BW15.FENCE_X, z: z + 10, yaw: Math.PI / 2, len: 20 }); }
    api.collider({ t: 'box', x: -BW15.FENCE_X, z: -400, hx: 0.3, hz: 200, y0: 0, y1: 1.3, walk: false });
    api.collider({ t: 'box', x: BW15.FENCE_X, z: -400, hx: 0.3, hz: 200, y0: 0, y1: 1.3, walk: false });
    for (let z = -560; z < BW15.GATE_Z - 10; z += 26) for (const x of [-16.2, 16.2]) api.prop('cone', { x, z: z + rng.range(-3, 3) });
    const kinds = ['rv', 'van', 'car', 'boxtruck', 'rv', 'camper', 'bus', 'car', 'trailer', 'rv', 'artcar', 'van', 'car'];
    S.line = api.traffic({ seed: 15, lanes: L.map((x, i) => ({ id: 'L' + i, points: [[x, BW15.LINE_BACK], [x, BW15.LINE_END]], vehicles: 30, gap: [1.6, 3.2], speed: 0.9, waveRate: 0.28 + i * 0.03, kindAt: k => kinds[(k + i * 5) % kinds.length] })) });
    BW15D.layoutLine(S, S.line, BW15.SPAWN_Z);
    // pulse towers + flaggers at both stop lines
    S.lights = []; S.flaggers = [];
    for (const z of [BW15.STOP_A, BW15.STOP_B]) {
      for (const sx of [-1, 1]) {
        const x = sx * 19.6;
        put(x, z, m => BW15M.pulseTower(m), Math.PI);
        const red = api.mover(m => BW15M.lamp(m, { col: '#ff2a3a' })), green = api.mover(m => BW15M.lamp(m, { col: '#3aff6a' }));
        red.x = green.x = x; red.z = green.z = z - 0.75; red.y = 6.95; green.y = 5.85; red.yaw = green.yaw = Math.PI; green.visible = false;
        S.lights.push({ red, green });
      }
      S.flaggers.push(api.npc({ type: 'gatestaff', seed: z === BW15.STOP_A ? 3 : 4, name: 'PULSE FLAGGER', x: 14.2, z: z + 2, yaw: -Math.PI / 2, behavior: 'idle', chat: ['Pulse goes when it goes!', 'Hold! HOLD!', 'Thank you for your patience. Your patience is noted.'] }));
      api.sign(z === BW15.STOP_A ? 'PULSE STOP 1' : 'PULSE STOP 2', -19.6, z + 1.5, { yaw: 0, h: 1.0, style: { bg: '#1a1a22', fg: '#ffe24a', size: 40, border: '#ffe24a' } });
    }
    // goodbye-sayers between the vehicles
    S.walkers = [];
    const wTypes = ['burner', 'tutu', 'furcoat', 'sparklepony', 'crusty', 'ledsuit', 'greeter_f', 'greeter_m', 'burner', 'tutu', 'darkwad', 'badideaguy'];
    const byes = ['BYE! LOVE YOU!', 'SEE YOU NEXT YEAR!', 'Drive safe! Hydrate!', 'Who has my other shoe?!', 'Welcome home... wait. Wrong way.', 'Don\'t cry. Okay, cry a little.', 'Group hug before the pulse!', 'Same time next year?!'];
    for (let i = 0; i < 18; i++) {
      const cx = BW15.CORRIDORS[i % 5], z = -545 + i * 17 + rng.range(-4, 4);
      if (Math.abs(cx) < 1 && Math.abs(z - BW15.SPAWN_Z) < 12) continue;
      const tp = wTypes[i % wTypes.length];
      const d = Object.assign(BW15_CAST.who(tp, 30 + i), { x: cx + rng.range(-0.6, 0.6), z, yaw: rng() * TAU, behavior: 'bw15Walker', chat: byes, speed: 1.2 + rng() * 0.4, name: 'BURNER' });
      S.walkers.push(d);
    }
    S.walkers.forEach(d => api.npc(d));
    // packing-up camps beyond the fences, art cars, a porta-potty bank
    for (const [x, z, k] of [[-34, -520, 'rv'], [-30, -440, 'boxtruck'], [36, -500, 'trailer'], [32, -410, 'bus'], [-36, -330, 'camper'], [34, -300, 'van']]) {
      prop(k === 'rv' || k === 'bus' || k === 'trailer' || k === 'van' || k === 'camper' || k === 'boxtruck' ? k : 'vehicle', { x, z, yaw: rng.range(-0.3, 0.3), seed: Math.floor(rng() * 999) });
      prop('crate', { x: x + (x < 0 ? 6 : -6), z: z + 2, s: 1.2 }); prop('crate', { x: x + (x < 0 ? 6.4 : -6.4), z: z + 3.3, y: 1.2, s: 1.0 });
    }
    prop('artcar', { x: -44, z: -470, yaw: 0.5, len: 10, col: '#ff4fd8' }); prop('artcar', { x: 46, z: -360, yaw: -0.4, len: 9, col: '#38f2ff' });
    for (let i = 0; i < 4; i++) prop('portapotty', { x: 22.5, z: -560 + i * 1.35, yaw: -Math.PI / 2, col: i % 2 ? '#2a6ac8' : '#3a8a3a' });
    api.sign('LAST CHANCE\nMOOP CHECK', -22, -545, { yaw: Math.PI / 2, h: 1.2, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 36, border: '#3a1a10' } });
    api.sign('EXODUS\n← THAT WAY', 21, -530, { yaw: -Math.PI / 2, h: 1.2, style: { bg: '#ff8a3a', fg: '#ffffff', size: 40 } });
    api.crowd(-46, -470, 3, 4, { behaviors: ['dance'] }); api.crowd(48, -360, 3, 4, { behaviors: ['dance'] });
    // the Man's ashes far behind, still smoking
    put(-62, -655, m => { m.color('#4a4248'); m.lathe([[0, 0], [20, 0], [14, 2.2], [6, 4.6], [0, 5.2]], { seg: 24, rMod: th => 1 + Math.sin(th * 5) * 0.05 }); m.color('#ff6a2a', 0.9); for (let i = 0; i < 26; i++) { const a = i / 26 * TAU, r = 3 + (i % 5) * 2.4; m.ball(Math.sin(a) * r, 3.4 - r * 0.18, Math.cos(a) * r, 0.5, { seg: 6, rings: 4 }); } m.emissive(0); return { cols: [], lights: [{ x: 0, y: 5, z: 0, s: 14, c: '#ff7a3a' }] }; });
    /* ================= the exit gate ================= */
    prop('gateArch', { x: 0, z: BW15.GATE_Z - 1.4, w: 34, h: 9, text: 'SEE YOU NEXT YEAR!' });
    BW15.CORRIDORS.forEach((x, i) => put(x, BW15.GATE_Z, m => BW15M.booth(m, { col: BURNS_NEON[i % 7] })));
    for (const sx of [-1, 1]) { api.box(sx * 16.2, 0, BW15.GATE_Z, 2.6, 1.2, 0.4, '#ff8a3a', { bevel: 0.08 }); }
    S.arms = []; S.barriers = [];
    for (const x of L) {
      const mv = api.mover(m => BW15M.barrier(m)); mv.x = x - 2.6; mv.y = 1.1; mv.z = BW15.GATE_Z + 1.3; mv.yaw = 0; S.arms.push(mv);
      S.barriers.push(api.collider({ t: 'box', x, z: BW15.GATE_Z + 1.3, hx: 2.7, hz: 0.35, y0: 0, y1: 3, walk: false }));
    }
    for (const [x, s] of [[-14, 1], [-7, 2], [0, 3], [7, 4], [14, 5]]) api.npc({ type: 'gatestaff', seed: 40 + s, name: 'GATE CREW', x: x + (x > 0 ? -1.2 : 1.2), z: BW15.GATE_Z + 1.8, yaw: Math.PI, behavior: 'idle', anim: 'wave', chat: ['BYE! Drive safe!', 'See you next year!', 'Welcome... back? To the world?', 'Hydrate on the highway!'] });
    S.zones.push({ x: 0, z: -176, r: 30, fog: 0.022, why: 'THE DUST BOWL', rate: 0.5 });
    /* ================= gate road ================= */
    tsign('THANK YOU FOR\nLEAVING NO TRACE', at(40, -8).x, at(40, -8).z, { yaw: facing(Object.assign(at(40, -8), { x0: at(40, 0).x, z0: at(40, 0).z })), h: 1.2, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 36, border: '#3a1a10' } });
    tsign('NO SPECTATORS\n(ANYMORE)', at(170, 8).x, at(170, 8).z, { yaw: facing(Object.assign(at(170, 8), { x0: at(170, 0).x, z0: at(170, 0).z })), h: 1.1, style: { bg: '#ff4fd8', fg: '#ffffff', size: 38 } });
    glowRoad(90, 140, -1.85, 8); glowRoad(150, 200, 1.85, 8);
    /* ================= highway furniture ================= */
    for (let s = BW15.S.pave + 10; s < BW15.S.welcome; s += 34) for (const lat of [5.6, -5.6]) { const a = at(s, lat); put(a.x, a.z, m => BW15M.reflector(m), a.yaw + (lat > 0 ? Math.PI : 0)); }
    // utility poles + sagging wires along the left side
    const poleS = []; for (let s = BW15.S.pave + 20; s < BW15.S.welcome + 60; s += 46) poleS.push(s);
    poleS.forEach((s, i) => {
      const a = at(s, 13), nx = i < poleS.length - 1 ? at(poleS[i + 1], 13) : null, y0 = H(a.x, a.z);
      api.mesh(a.x, a.z, m => {
        const info = BW15M.pole(m);
        if (nx) { const ny = H(nx.x, nx.z) - y0; m.color('#2a2a30'); for (const sx of [-1, 1]) { const ex = nx.x - a.x, ez = nx.z - a.z, mx = ex / 2, mz = ez / 2; m.limb(sx * Math.cos(a.yaw), 7.98, -sx * Math.sin(a.yaw), mx, 7.0 + ny / 2, mz, 0.025, 0.025, { seg: 4 }); m.limb(mx, 7.0 + ny / 2, mz, ex + sx * Math.cos(nx.yaw), 7.98 + ny, ez - sx * Math.sin(nx.yaw), 0.025, 0.025, { seg: 4 }); } }
        return info;
      }, { y: y0, yaw: 0 });
    });
    // sagebrush on the hills
    for (let i = 0; i < 70; i++) { const s = rng.range(BW15.S.pave, BW15.S.welcome + 120), lat = (rng() < 0.5 ? -1 : 1) * rng.range(13, 70), a = at(s, lat); put(a.x, a.z, m => BW15M.sage(m, rng, 4 + Math.floor(rng() * 4), 5)); }
    for (let i = 0; i < 26; i++) { const s = rng.range(BW15.S.pave, BW15.S.welcome), lat = (rng() < 0.5 ? -1 : 1) * rng.range(16, 60), a = at(s, lat), sz = rng.range(0.8, 2.2); put(a.x, a.z, m => BW15M.rock(m, rng, sz), rng() * TAU); }
    // talking signs (they only talk once the trip kicks in)
    const signDefs = [
      [120, -6.5, 'YOU ARE NOW\nLEAVING THE PLAYA', null, ['Bye! Don\'t forget to hydrate!', 'Psst. You have glitter on your soul.', 'I\'m a sign. Signs are... signs. Whoa.']],
      [244, -7, 'HIGHWAY →\nGERLACH 12', { bg: '#2a7a4a', fg: '#ffffff', border: '#ffffff' }, ['Gerlach! That way! Probably!', 'I point. It\'s what I do. I love it.']],
      [330, -6, 'SPEED LIMIT\n45', null, ['Forty-five. FORTY. FIVE. You got this.', 'Psst... there\'s a cop behind that billboard.', 'I believe in you. Mostly.']],
      [436, -6, 'GAS · ICE\n1/4 MILE', { bg: '#2a5aa8', fg: '#ffffff', border: '#ffffff' }, ['Snacks! Gas! A stranded sparkle pony!', 'Turn in, turn in, turn iiin!']],
      [606, -6, 'CHECKPOINT\nAHEAD', { bg: '#ff8a2a', fg: '#1a1a22', border: '#1a1a22' }, ['Be cool. Be cool. Be... a cucumber.', 'Inhale. Steady hands. Tap tap tap.']],
      [728, 6.5, '← HOT SPRINGS\nSCENIC DETOUR', { bg: '#6a3a1a', fg: '#ffe8c0', border: '#ffe8c0' }, ['Steam! Great for hiding! And pores!', 'Scenic detour! Scenic! Detour!']],
      [930, -6, 'SPEED LIMIT\n45', null, ['Me again! Different sign, same limit!', 'There\'s ANOTHER cop up there. Classic.']],
      [1012, -7, 'GERLACH\nTOWN LIMIT', { bg: '#2a7a4a', fg: '#ffffff', border: '#ffffff' }, ['Welcome! Pancakes are that way!', 'You made it! I\'m a sign and I\'m PROUD.']]
    ];
    S.signDefs = [];
    for (const [s, lat, text, style, lines] of signDefs) {
      const a = at(s, lat), road = at(s, 0), yaw = Math.atan2(road.x - a.x, road.z - a.z) * 0.35 + (a.yaw + Math.PI) * 0.65;
      const sYaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
      const info = put(a.x, a.z, m => BW15M.roadSign(m, { text, style, w: 2.4, y: 2.1 }), sYaw);
      S.signDefs.push({ x: a.x, z: a.z, y: H(a.x, a.z), yaw: sYaw, top: H(a.x, a.z) + info.top, h: info.h, lines });
    }
    /* ================= speed trap 1 ================= */
    const trapAt = (s) => {
      const bb = at(s, -12), road = at(s, 0), yawBB = Math.atan2(road.x - bb.x, road.z - bb.z);
      put(bb.x, bb.z, m => BW15M.billboard(m, { text: s < 600 ? 'WELCOME BACK TO\nTHE DEFAULT WORLD' : 'HYDRATE.\nSERIOUSLY.' }), yawBB);
      const cp = at(s + 6, -17.5), cop = BW15C.makeCop(api, { id: 'trap' + s, x: cp.x, z: cp.z, yaw: Math.atan2(road.x - cp.x, road.z - cp.z) + 0.5 });
      const o = at(s + 9, -15);
      const officer = api.npc(Object.assign(BW15_CAST.who('cop', s), { x: o.x, z: o.z, yaw: Math.atan2(road.x - o.x, road.z - o.z), behavior: 'idle', name: 'HIGHWAY PATROL', chat: ['...', 'Mm-hm.', 'Radar says... interesting.'], always: true }));
      return { cop, officer };
    };
    const t1 = trapAt(BW15.S.trap1), t2 = trapAt(BW15.S.trap2);
    /* ================= the tiny gas station + the stranded sparkle pony ================= */
    const gas = BW15W.gas, gasRoad = at(BW15.S.gas, 0), gasYaw = Math.atan2(gasRoad.x - gas.x, gasRoad.z - gas.z);
    put(gas.x, gas.z, m => BW15M.gasStation(m), gasYaw);
    const gasL = (lx, lz) => ({ x: gas.x + lx * Math.cos(gasYaw) + lz * Math.sin(gasYaw), z: gas.z - lx * Math.sin(gasYaw) + lz * Math.cos(gasYaw) });
    { const p1 = gasL(-8.5, -4), p2 = gasL(9, 2); prop('car', { x: p1.x, z: p1.z, yaw: gasYaw + 0.3, seed: 81 }); prop('van', { x: p2.x, z: p2.z, yaw: gasYaw - 0.2, seed: 82 }); }
    const ponyPos = gasL(5.2, 7.5);
    S.ponyDef = api.npc(Object.assign(BW15_CAST.who('sparklepony', 12), { id: 'w15pony', name: 'GLITTER', x: ponyPos.x, z: ponyPos.z, yaw: gasYaw, behavior: 'idle', anim: 'wave', noTalk: true, always: true, chat: ['GERLACH OR BUST! ...Please?', 'My camp left without me! Rude!', 'I have glitter! I can pay in glitter!'] }));
    put(ponyPos.x + 0.6, ponyPos.z + 0.3, m => BW15M.roadSign(m, { text: 'GERLACH\nOR BUST ✨', style: { bg: '#f4e8c8', fg: '#ff4fa8', size: 34, border: '#ff4fa8' }, w: 0.9, y: 0.9 }), gasYaw);
    { const tp = gasL(-3.2, 1.8); S.techDef = { x: tp.x, z: tp.z }; }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, p = gasL(Math.sin(a) * 9, Math.cos(a) * 6 + 1); api.pickup('glowstick', p.x, H(p.x, p.z) + 1.2, p.z); }
    /* ================= furry hitchhiker ================= */
    const fz = at(BW15.S.furry, -6.5);
    put(fz.x + 0.8, fz.z, m => BW15M.roadSign(m, { text: 'ANYWHERE\nBUT HERE', style: { bg: '#f4e8c8', fg: '#3a1a10', size: 34 }, w: 0.9, y: 0.9 }), fz.yaw + Math.PI / 2);
    // a crusty hitchhiker who would rather walk (ambient)
    { const hh = at(880, -6.8), road = at(880, 0); api.npc(Object.assign(BW15_CAST.who('crusty', 33), { x: hh.x, z: hh.z, yaw: Math.atan2(road.x - hh.x, road.z - hh.z), behavior: 'idle', anim: 'wave', name: 'HITCHHIKER', chat: ['No thanks, man. Walking is the journey.', 'It was better when we hitchhiked IN.', 'Is that RV... a unicorn? Respect.'] })); put(hh.x - 0.9, hh.z + 0.4, m => BW15M.roadSign(m, { text: 'BAKER BEACH\nOR BUST', style: { bg: '#f4e8c8', fg: '#3a1a10', size: 34 }, w: 0.9, y: 0.9 }), Math.atan2(road.x - hh.x, road.z - hh.z)); }
    /* ================= the checkpoint ================= */
    const ck = BW15.S.check;
    for (let s = ck - 48; s <= ck + 26; s += 4) { for (const lat of [0.05, -4.15]) { const a = at(s, lat); put(a.x, a.z, m => BW15M.cone(m), a.yaw); } }
    const ckL = at(ck - 2, -9), ckR = at(ck + 10, 8.5), ckRoad = at(ck, 0);
    const cc1 = BW15C.makeCop(api, { id: 'check1', x: ckL.x, z: ckL.z, yaw: ckRoad.yaw + 0.6, lights: true });
    const cc2 = BW15C.makeCop(api, { id: 'check2', x: ckR.x, z: ckR.z, yaw: ckRoad.yaw + Math.PI - 0.5, lights: true });
    cc1.homeLights = cc2.homeLights = true;
    { const lt = at(ck - 6, -13); prop('lightTower', { x: lt.x, z: lt.z, yaw: Math.atan2(ckRoad.x - lt.x, ckRoad.z - lt.z), aim: 0 }); }
    { const tb = at(ck + 4, -11); put(tb.x, tb.z, m => { m.color('#e8e8ec').shine(1); m.roundBox(0, 0.72, 0, 1.8, 0.08, 0.8, 0.03); m.color('#8a8a92'); for (const sx of [0.8, -0.8]) m.limb(sx, 0, 0, sx, 0.7, 0, 0.03, 0.03, { seg: 4 }); m.color('#f4f4f0'); m.roundCyl(0.4, 0.76, 0, 0.06, 0.14, 0.02, { seg: 8 }); m.color('#ff8a2a'); m.roundBox(-0.3, 0.8, 0, 0.5, 0.06, 0.35, 0.02); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.9, hz: 0.4, y0: 0, y1: 0.8 }] }; }, ckRoad.yaw); }
    const ckSign = at(ck - 60, -6.5);
    tsign('CHECKPOINT\nPREPARE TO STOP', ckSign.x, ckSign.z, { yaw: facing(Object.assign(ckSign, { x0: at(ck - 60, 0).x, z0: at(ck - 60, 0).z })) + 0.6, h: 1.3, style: { bg: '#ff8a2a', fg: '#1a1a22', size: 40, border: '#1a1a22' } });
    const ofc = at(ck + 2, -6.3);
    const checkOfficer = api.npc(Object.assign(BW15_CAST.who('cop', 77), { x: ofc.x, z: ofc.z, yaw: Math.atan2(ckRoad.x - ofc.x, ckRoad.z - ofc.z), behavior: 'idle', name: 'OFFICER', always: true, chat: ['Evening. Morning. Whatever.', 'Slow it down, folks.', 'Anybody got coffee?'] }));
    { const o2 = at(ck + 12, -11); api.npc(Object.assign(BW15_CAST.who('cop', 78), { x: o2.x, z: o2.z, yaw: Math.atan2(ckRoad.x - o2.x, ckRoad.z - o2.z), behavior: 'idle', name: 'OFFICER', chat: ['Keep it moving.', 'Nice... stickers.'] })); }
    // the undercover cop waits in his convertible in a pull-out past the checkpoint
    const uc = at(BW15.S.tailStart - 8, -12);
    S.undercover = BW15C.makeCop(api, { id: 'undercover', kind: 'unmarked', x: uc.x, z: uc.z, yaw: at(BW15.S.tailStart, 0).yaw });
    S.ucDriverDef = api.npc(Object.assign(BW15_CAST.who('undercovercop', 1), { id: 'w15uc', name: 'TOTALLY A BURNER', x: uc.x, z: uc.z, behavior: 'bw15CarSeat', noTalk: true, always: true, fixedY: true, collide: false, chatter: false }));
    /* ================= hot springs (hidden scenic detour) ================= */
    const spr = BW15W.springs, sprH = H(spr.x, spr.z);
    for (const [dx, dz, r] of [[0, 0, 5.5], [9, 7, 3.6], [-7, 9, 3.0], [6, -9, 2.8]]) put(spr.x + dx, spr.z + dz, m => BW15M.pool(m, { r }));
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = 15 + rng.range(-2, 3), x = spr.x + Math.sin(a) * r, z = spr.z + Math.cos(a) * r, sz = rng.range(0.7, 1.6); if (Math.abs(a - 4.3) < 0.5) continue; put(x, z, m => BW15M.rock(m, rng, sz), rng() * TAU); }
    tsign('HOT SPRINGS\nDON\'T BOIL YOURSELF', spr.x - 12, spr.z - 3, { yaw: -Math.PI / 2 + 0.4, h: 1.1, style: { bg: '#6a3a1a', fg: '#ffe8c0', size: 34, border: '#ffe8c0' } });
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.6; api.npc(Object.assign(BW15_CAST.who('soaker', 50 + i), { x: spr.x + Math.sin(a) * 3.6, z: spr.z + Math.cos(a) * 3.6, y: sprH - 0.55, fixedY: true, yaw: a + Math.PI, behavior: 'sit', chatter: true, chat: ['Ahhh. Exodus who?', 'Scenic detour! Scenic!', 'My pores are SO open.', 'Is that a party barge? Respect.'] })); }
    S.zones.push({ x: spr.x, z: spr.z, r: 19, y: sprH, steam: true, fog: 0.012, why: 'HOT SPRINGS STEAM', rate: 0.7 });
    { const T = BW15_TERR.tracks[0].pts; for (let i = 0; i < T.length - 1; i++) for (let k = 1; k <= 4; k++) { const u = k / 5, x = lerp(T[i][0], T[i + 1][0], u), z = lerp(T[i][1], T[i + 1][1], u); api.pickup('glowstick', x, H(x, z) + 1.2, z); } }
    api.pickup('photo', spr.x + 16, sprH + 2.0, spr.z + 10, { id: 'p2' });
    api.light(spr.x, spr.z, 22, '#7affe8', 0.25);
    /* ================= dust devils (great for hiding) ================= */
    S.devils = [
      { base: 400, amp: 16, r: 7.5, ph: 0.3, sp: 0.16 }, { base: 560, amp: 14, r: 7, ph: 2.1, sp: 0.2 },
      { base: 700, amp: 12, r: 8, ph: 1.0, sp: 0.18 }, { base: 860, amp: 15, r: 8, ph: 2.6, sp: 0.15 }, { base: 920, amp: 12, r: 7.5, ph: 4.2, sp: 0.22 },
      { base: 150, amp: 12, r: 7, ph: 0.6, sp: 0.2 }
    ].map(D => Object.assign(D, { x: 0, z: 0 }));
    /* ================= Gerlach ================= */
    const wc = at(BW15.S.welcome, -9.5), wRoad = at(BW15.S.welcome, 0);
    put(wc.x, wc.z, m => BW15M.welcomeSign(m), Math.atan2(wRoad.x - wc.x, wRoad.z - wc.z) - 0.5);
    const diner = at(BW15.S.diner, -24), dRoad = at(BW15.S.diner, 0), dYaw = Math.atan2(dRoad.x - diner.x, dRoad.z - diner.z);
    put(diner.x, diner.z, m => BW15M.diner(m), dYaw);
    BW15W.diner = diner; BW15W.dinerYaw = dYaw;
    const dL = (lx, lz) => ({ x: diner.x + lx * Math.cos(dYaw) + lz * Math.sin(dYaw), z: diner.z - lx * Math.sin(dYaw) + lz * Math.cos(dYaw) });
    BW15W.lot = dL(0, 13);
    api.paint((c, P, sc) => { c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 0.15 * sc; for (let i = -3; i <= 3; i++) { const a = dL(i * 3.2, 8), b = dL(i * 3.2, 11.5), [ax, az] = P(a.x, a.z), [bx, bz] = P(b.x, b.z); c.beginPath(); c.moveTo(ax, az); c.lineTo(bx, bz); c.stroke(); } const [px, pz] = P(BW15W.lot.x, BW15W.lot.z), r = 16 * sc; const g2 = c.createRadialGradient(px, pz, 0, px, pz, r); g2.addColorStop(0, 'rgba(70,70,80,0.45)'); g2.addColorStop(1, 'rgba(70,70,80,0)'); c.fillStyle = g2; c.fillRect(px - r, pz - r, r * 2, r * 2); });
    const tables = [dL(-9, 6.5), dL(9.5, 6.8), dL(14, 11)];
    BW15W.tables = tables;
    tables.forEach((p, i) => put(p.x, p.z, m => BW15M.picnic(m, { food: true }), dYaw + Math.PI / 2 + (i === 2 ? 0.3 : 0)));
    { const r1 = dL(-21, 5), r2 = dL(22, 4); prop('rv', { x: r1.x, z: r1.z, yaw: dYaw + Math.PI / 2 + 0.15, seed: 91 }); prop('bus', { x: r2.x, z: r2.z, yaw: dYaw - Math.PI / 2 - 0.2, seed: 92, col: '#9a6bff' }); }
    const eaters = [['tutu', 61], ['crusty', 62], ['furcoat', 63], ['burner', 64], ['ledsuit', 65], ['greeter_m', 66]];
    eaters.forEach(([tp, sd], i) => { const tb = tables[1 + (i % 2)], side = i % 2 ? 1 : -1; const off = (Math.floor(i / 2) - 1) * 0.7; api.npc(Object.assign(BW15_CAST.who(tp, sd), { x: tb.x + Math.cos(dYaw) * off + Math.sin(dYaw) * side * 0.75, z: tb.z - Math.sin(dYaw) * off + Math.cos(dYaw) * side * 0.75, yaw: dYaw + (side > 0 ? Math.PI : 0) + Math.PI / 2, behavior: 'sit', chat: ['Pancakes! Real pancakes!', 'A chair! With a back!', 'Running water. I could cry.', 'Same time next year!'] })); });
    api.npc(Object.assign(BW15_CAST.who('diner', 1), { x: dL(3, 6).x, z: dL(3, 6).z, yaw: dYaw, behavior: 'idle', name: 'DINER COOK', chat: ['Order up!', 'Exodus Monday. Busiest day of the year.', 'Hash browns? Hash browns.'] }));
    const motelP = at(1092, 26), motelRoad = at(1092, 0);
    put(motelP.x, motelP.z, m => BW15M.motel(m), Math.atan2(motelRoad.x - motelP.x, motelRoad.z - motelP.z));
    const gas2 = at(1052, 24), gas2Road = at(1052, 0);
    put(gas2.x, gas2.z, m => BW15M.gasStation(m), Math.atan2(gas2Road.x - gas2.x, gas2Road.z - gas2.z), { scale: 0.85 });
    const tower = at(1140, 44); put(tower.x, tower.z, m => BW15M.waterTower(m), 0.3);
    for (const [s, lat, sd] of [[1060, -34, 1], [1130, -30, 2], [1150, 28, 3], [1080, 50, 4], [1158, -48, 5], [1120, 58, 6]]) { const p = at(s, lat), road = at(s, 0), hr = mulberry32(700 + sd); put(p.x, p.z, m => BW15M.house(m, hr), Math.atan2(road.x - p.x, road.z - p.z)); }
    { const b = at(1180, 0); put(b.x, b.z, m => { m.color('#f4f4f0').shine(1); m.roundBox(0, 0.9, 0, 9, 0.5, 0.4, 0.15); m.color('#ff3a2a'); for (let i = -3; i <= 3; i++) m.roundBox(i * 1.25, 0.9, 0.05, 0.6, 0.52, 0.42, 0.12); m.color('#8a8a92'); for (const sx of [-4, 4]) m.roundCyl(sx, 0, 0, 0.12, 0.9, 0.04, { seg: 8 }); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 6, hz: 0.4, y0: 0, y1: 1.4 }] }; }, b.yaw); tsign('ROAD CLOSED\nBREAKFAST IN PROGRESS', b.x + 6, b.z, { yaw: b.yaw + Math.PI, h: 1.2, style: { bg: '#ffe24a', fg: '#1a1a22', size: 32 } }); }
    glowRoad(BW15.S.welcome + 10, BW15.S.diner - 12, -1.85, 10);
    api.light(diner.x, diner.z, 26, '#ffd0a0', 0.3);
    // the scenic hill above town: photo at the top
    const hill = BW15W.hill;
    api.pickup('photo', hill.x, H(hill.x, hill.z) + 2.2, hill.z, { id: 'p3' });
    for (let i = 0; i < 8; i++) { const u = i / 7, x = lerp(at(985, 8).x, hill.x, u), z = lerp(at(985, 8).z, hill.z, u); api.pickup('glowstick', x, H(x, z) + 1.3, z); }
    /* ================= trip visions + the RV ================= */
    for (let i = 0; i < 20; i++) { const mv = api.mover(m => BW15M.ribbonSeg(m, { col: BW15_RAINBOW[i % 7] })); mv.visible = false; S.ribbon.segs.push(mv); }
    for (let i = 0; i < 5; i++) { const mv = api.mover(m => BW15M.jellyfish(m, { hue: 280 + i * 50 })); mv.visible = false; S.jelly.push({ mv, k: 0, x: 0, z: 0, placed: false }); }
    for (const s of [410, 712, 905]) { const a = at(s, 0), mv = api.mover(m => BW15M.rainbowArch(m, { R: 30 })); mv.x = a.x; mv.z = a.z; mv.y = H(a.x, a.z) - 2; mv.yaw = a.yaw; mv.visible = false; S.arches.push({ mv, k: 0 }); }
    for (const D of S.signDefs) {
      const c = Math.cos(D.yaw), sn = Math.sin(D.yaw), W2 = (lx, ly, lz) => ({ x: D.x + lx * c + lz * sn, y: D.y + ly, z: D.z - lx * sn + lz * c });
      const mk = (fn, lx, ly, lz) => { const p = W2(lx, ly, lz), mv = api.mover(fn); mv.x = p.x; mv.y = p.y; mv.z = p.z; mv.yaw = D.yaw; mv.visible = false; return mv; };
      const topY = D.top - D.y;
      S.signs.push({ x: D.x, z: D.z, top: D.top, lines: D.lines, k: 0, said: false, talkT: 0, blink: 0,
        eyeL: mk(m => BW15M.eye(m), 0.45, topY + 0.12, 0.08), eyeR: mk(m => BW15M.eye(m), -0.45, topY + 0.12, 0.08),
        mouthO: mk(m => BW15M.mouthOpen(m), 0, topY - D.h + 0.25, 0.09), mouthC: mk(m => BW15M.mouthShut(m), 0, topY - D.h + 0.22, 0.09),
        ahead(rv) { return (this.x - rv.x) * Math.sin(rv.yaw) + (this.z - rv.z) * Math.cos(rv.yaw) > 5; } });
    }
    const rv = S.rv = api.artCar({ x: L[BW15.PLAYER_LANE], z: BW15.SPAWN_Z, yaw: 0, build: m => BW15M.rv(m), maxSpeed: 24, drivable: false, label: 'DRIVE' });
    S.parts.uni = api.mover(m => BW15M.unicorn(m)); S.parts.uni.visible = false;
    S.parts.legs = [0, 1, 2, 3].map(() => { const mv = api.mover(m => BW15M.unicornLeg(m)); mv.visible = false; return mv; });
    S.parts.wingL = api.mover(m => BW15M.wing(m, 1)); S.parts.wingR = api.mover(m => BW15M.wing(m, -1)); S.parts.wingL.visible = S.parts.wingR.visible = false;
    S.chinkaDef = api.npc({ id: 'w15chinka', type: 'chinka', name: 'CHINKA', x: rv.x, z: rv.z, behavior: 'bw15Seat', seat: [-0.62, BW15M.DECK, BW15M.SEAT_Z], noTalk: true, chatter: false, always: true, fixedY: true, collide: false });
    /* ================= cops ================= */
    S.cops.push(t1.cop, t2.cop, cc1, cc2, S.undercover);
    S.traps.push({ kind: 'trap', s: BW15.S.trap1, pre: 50, cop: t1.cop, officer: t1.officer });
    S.traps.push({ kind: 'check', s: BW15.S.check, pre: 34, cop: cc1, officer: checkOfficer });
    S.traps.push({ kind: 'trap', s: BW15.S.trap2, pre: 50, cop: t2.cop, officer: t2.officer });
    /* ================= highway traffic ================= */
    const outPts = [], onPts = [];
    for (let s = 0; s <= R.len; s += 6) { const a = at(s, -BW15.LANE_W / 2), b = at(s, BW15.LANE_W / 2); outPts.push([a.x, a.z]); onPts.push([b.x, b.z]); }
    onPts.reverse();
    const outK = ['rv', 'boxtruck', 'car', 'bus', 'trailer', 'van', 'rv', 'camper', 'boxtruck', 'car'], onK = ['boxtruck', 'car', 'van', 'boxtruck', 'car'];
    S.hwy = api.traffic({ seed: 151, lanes: [
      { id: 'out', s0: 0, points: outPts, vehicles: 13, gap: [30, 60], speed: 10.5, wave: false, kindAt: k => outK[k % outK.length] },
      { id: 'on', s0: 0, points: onPts, vehicles: 7, gap: [60, 100], speed: 12.5, wave: false, kindAt: k => onK[k % onK.length] }
    ] });
    S.hwy.lanes.forEach((lane, li) => { const n = lane.cars.length; lane.cars.forEach((car, i) => { car.s = lane.len - 20 - i * (lane.len - 40) / n - (li ? 37 : 0); S.hwy.place(lane, car); }); });
    /* ================= collectibles, camp flags, markers ================= */
    // glow sticks: corridors of the line (weave bait), passing lanes, the hill
    for (const x of [0, -7, 7]) glow(x, -470 + (x === 0 ? 0 : 40), 9, 0, 22);
    for (let i = 0; i < 7; i++) api.pickup('glowstick', -14, 1.2, -320 + i * 12);
    glowRoad(300, 340, 1.85, 6); glowRoad(470, 520, 1.85, 8); glowRoad(700, 750, 1.85, 8); glowRoad(870, 920, 1.85, 8);
    glowRoad(560, 600, -1.85, 6);
    api.pickup('photo', -7, 1.7, -284, { id: 'p1' });
    // the last bags (handed over or tossed by the givers; hidden until then)
    S.bagDefs = BW15W.GIVERS.map((G, i) => api.pickup('bag:' + G.power, 0, -60, -3000 - i * 10, { id: 'bag' + (i + 1), onTake: (g2, P) => { if (BW15.state) BW15.state.lastBagId = P.id; } }));
    // givers
    const gPos = [[0.2, -488], [-0.4, -526], [0.3, -418], [-0.2, -446]];
    S.giverDefs = BW15W.GIVERS.map((G, i) => {
      if (i === 7) return null;
      let x, z, extra = {};
      if (i < 4) { x = gPos[i][0]; z = gPos[i][1]; }
      else if (i === 4) { x = fz.x; z = fz.z; extra = { anim: 'wave' }; }
      else if (i === 5) { x = S.techDef.x; z = S.techDef.z; }
      else { x = spr.x + 2.5; z = spr.z - 1.5; extra = { y: sprH - 0.4, fixedY: false }; }
      return api.npc(Object.assign(BW15_CAST.who(G.type, G.seed), { id: 'w15giver' + i, name: G.name, x, z, yaw: Math.PI, behavior: 'idle', noTalk: true, always: i < 4, chatter: i === 4, chat: i === 4 ? ['*muffled* ...hot in here.', '*thumbs up*'] : undefined }, extra));
    });
    // camp flags (the Party Barge touches them by driving past)
    const flag = (id, s, name) => { const a = at(s, -7.5); const cp = api.checkpoint(id, a.x, a.z, { y: H(a.x, a.z), yaw: a.yaw, name }); cp.s = s; S.cps.push(cp); return cp; };
    { const cp = api.checkpoint('cp_line', -15.6, -514, { yaw: 0, name: 'The Exodus Line' }); cp.s = 0; S.cps.push(cp); }
    flag('cp_gate', 74, 'Gate Road'); flag('cp_hwy', 256, 'The Highway'); flag('cp_gas', 446, 'Tiny Gas Station'); flag('cp_check', 590, 'Before the Checkpoint');
    api.marker('gate', 0, BW15.GATE_Z, 'Exit', { col: '#ffe24a' });
    api.marker('gas', gas.x, gas.z, 'Gas', { col: '#38c8ff' });
    api.marker('check', ckRoad.x, ckRoad.z, 'Checkpoint', { col: '#ff4a6a' });
    api.marker('gerlach', diner.x, diner.z, 'Gerlach', { col: '#ff9a4a' });
    api.region('springs', spr.x, spr.z, 20);
    api.light(gas.x, gas.z, 18, '#fff4d8', 0.25);
  },
  onStart(g) { BW15W.start(g); },
  update(g, dt) { BW15W.update(g, dt); },
  env(g, env) { BW15C.env(g, env); },
  drawSprites(g, R) { BW15C.sprites(g, R); },
  onRespawn(g) { const S = BW15.state; if (S && S.rv) BW15C.retry(g, S); }
});

/* ---------------- the undercover cop rides in his convertible ---------------- */
BurnsBehaviors.register('bw15CarSeat', {
  update(a, g, dt) {
    const S = BW15.state; if (!S || !S.undercover) return;
    const car = S.undercover, c = Math.cos(car.yaw), s = Math.sin(car.yaw);
    a.x = car.x + 0.5 * c + 0.1 * s; a.z = car.z - 0.5 * s + 0.1 * c; a.y = car.y + 0.45; a.yaw = car.yaw;
    a.ch.play(a.bubbleText && a.bubbleT > 0 ? 'talk' : 'drive', { steer: 0 });
  }
});

/* ---------------- start, update, story ---------------- */
Object.assign(BW15W, {
  start(g) {
    const S = BW15.state, p = g.player, rv = S.rv;
    S.chinka = g.actor('w15chinka'); S.pony = g.actor('w15pony'); S.ucDriver = g.actor('w15uc');
    S.flaggers = (S.flaggers || []).map(d => g.actors.find(a => a.def === d)).filter(Boolean);
    S.walkers = (S.walkers || []).map(d => g.actors.find(a => a.def === d)).filter(Boolean);
    for (const T of S.traps) if (T.officer) T.officer = g.actors.find(a => a.def === T.officer) || null;
    // the Party Barge: Brady is always at the helm (EXIT is politely declined)
    const proto = BurnsVehicle.prototype;
    rv.ride = function (pp, dt) { BW15D.ride(g, this, pp, dt); };
    rv.dismount = function (pp, crash) { const S2 = BW15.state; if (S2 && S2.allowExit) return proto.dismount.call(this, pp, crash); BW15D.quip(g, 'exit', ['We are NOT walking to Gerlach, babe.', 'Nope. Captain stays at the helm.', 'Out THERE? With the dust? No.'], true); };
    rv.idle = function () { };
    rv.rider = p; p.vehicle = rv; p.pound = 0; p.spinT = 0;
    // last bags feed the trip meter, never a power-up
    const give0 = p.givePower.bind(p);
    p.givePower = (id) => { const P = BURNS_POWERUPS[id]; if (P && !P.instant && BW15.state && BW15.state.g === g) { BW15D.bagTaken(g, BW15.state, id); return; } give0(id); };
    // the ACTION button label follows what Brady can do right now
    S.it = { x: p.x, z: p.z, y: p.y, r: 99, get label() { return BW15D.actionLabel(g); }, when: () => true, fn: () => BW15D.action(g, BW15.state) };
    g.interactables = [S.it];
    // givers
    S.givers = BW15W.GIVERS.map((G, i) => {
      const a = i === 7 ? S.pony : g.actor('w15giver' + i);
      const P = g.pickups.items.find(q => q.id === 'bag' + (i + 1));
      return Object.assign({}, G, { i, id: 'bag' + (i + 1), a, pick: P, state: 'wait', t: 0, side: i === 4 ? -1 : 1, when: BW15W.giverWhen(i) });
    });
    S.givers[7].state = 'done';
    // where are we starting? fresh = back of the Exodus line
    const sv = BurnsSave.get(), cpId = sv.checkpoint[15];
    const cp = cpId && S.cps.find(c => c.id === cpId && c.s > 5);
    const pulseDone = g.missions.isDone('pulse');
    if (cp) {
      const a = BW15_ROAD.at(cp.s, -BW15.LANE_W / 2, {});
      BW15D.placeRV(g, S, { x: a.x, z: a.z, yaw: a.yaw });
      S.pulse.phase = 'done'; S.pulse.gate = false;
      for (let i = 0; i < 4; i++) S.givers[i].state = 'done';
      for (const a2 of S.walkers) a2.data.clear = true;
      // resuming mid-trip: the bags you already had still count for the wonk
      S.trip.bags = Math.min(8, Object.keys(sv.flags).filter(k => /^15:bag\d$/.test(k) && sv.flags[k]).length);
      S.trip.level = BW15D.tripTarget(S);
      for (const c2 of S.cps) if (c2.s <= cp.s) c2.passed = true;
      BW15C.resetAfter(g, S, cp.s);
    } else {
      BW15D.placeRV(g, S, { x: BW15.LANES[BW15.PLAYER_LANE], z: BW15.SPAWN_Z, yaw: 0 });
      if (pulseDone) S.pulse.tries = 0;
    }
    // persistent bag progress
    const m = g.missions.get('bags');
    if (m && m.state === 'active') m.n = Object.keys(sv.flags).filter(k => /^15:bag\d$/.test(k) && sv.flags[k]).length;
    burnsMusic('burns_w15', 'burns_w7');
    g.tod = cp ? clamp(0.15 + cp.s / 1150 * 0.85, 0, 1) : 0.02;
    if (!BurnsSave.flag(15, 'intro')) BW15W.intro(g);
    else g.banner('EXODUS', cp ? 'Back on the road. Gerlach or bust.' : 'Monday morning. Gerlach or bust.', { col: '#ffb04a' });
  },
  giverWhen(i) {
    return (g, S) => {
      const rv = S.rv, P = S.pulse, still = Math.abs(S.v) < 1.5;
      switch (i) {
        case 0: return P.phase === 'hold1' && P.t > 3 && !g.cine;
        case 1: return P.phase === 'hold1' && S.givers[0].state === 'done';
        case 2: return P.phase === 'hold2' && P.t > 1.5;
        case 3: return P.phase === 'hold2' && S.givers[2].state === 'done';
        default: { const a = S.givers[i].a; return a && still && Math.hypot(a.x - rv.x, a.z - rv.z) < 17; }
      }
    };
  },
  update(g, dt) {
    const S = BW15.state; if (!S || !S.rv || S.g !== g) return;
    S.t += dt;
    BW15D.runTimers(dt);
    if (S.honkT > 0) S.honkT -= dt;
    S.trip.level = approach(S.trip.level, BW15D.tripTarget(S), dt * 0.14);
    const p = g.player; if (S.it) { S.it.x = p.x; S.it.z = p.z; S.it.y = p.y; }
    BW15D.updateLine(g, S, dt);
    BW15D.updateHighway(g, S, dt);
    S.capAhead = BW15D.aheadCap(g, S);
    BW15D.updateGivers(g, S, dt);
    BW15C.update(g, S, dt);
    BW15D.updateRibbon(g, S);
    BW15D.updateVisions(g, S, dt);
    BW15W.devils(g, S, dt);
    BW15W.ponyLogic(g, S, dt);
    BW15W.flags(g, S);
    BW15W.landmarks(g, S, dt);
    BW15W.shove(g, S);
    // sunrise as we go
    const want = S.zone === 'line' ? 0.02 + clamp((S.rv.z - BW15.SPAWN_Z) / 300, 0, 1) * 0.1 : clamp(0.15 + S.s / 1150 * 0.85, 0, 1);
    if (!S.ending) g.tod = approach(g.tod, want, dt * 0.03);
  },
  devils(g, S, dt) {
    const rv = S.rv;
    for (const D of S.devils) {
      const lat = Math.sin(S.t * D.sp + D.ph) * D.amp, a = BW15_ROAD.at(D.base + Math.sin(S.t * D.sp * 0.5 + D.ph) * 10, lat, D._a || (D._a = {}));
      D.x = a.x; D.z = a.z;
      const d = Math.hypot(D.x - rv.x, D.z - rv.z);
      if (d < 60 && Math.random() < dt * 30) { const t = Math.random() * TAU, r = Math.random() * D.r; g.fx.add(D.x + Math.cos(t) * r, g.world.height(D.x, D.z) + 0.5 + Math.random() * 6, D.z + Math.sin(t) * r, -Math.sin(t) * 5, 1.5 + Math.random() * 2, Math.cos(t) * 5, 1.4, 1.2, 3.5, [0.86, 0.74, 0.6], 0.35, 'puff', 4, Math.random() * 6, 2); }
      if (d < D.r && Math.random() < dt) BW15D.quip(g, 'devil', ['Dust devil! We\'re invisible!', 'Whee! Spin cycle!'], false);
    }
  },
  ponyLogic(g, S, dt) {
    const a = S.pony; if (!a) return;
    if (S.ponyAboard) return;
    if (BW15D.ponyReady(g, S)) { S.ponyWait = (S.ponyWait || 0) + dt; if (S.ponyWait > 3.5) BW15W.boardPony(g, S); if (!a.bubbleText && Math.random() < dt * 0.5) a.say(['Ooh! A party barge! Room for one more?', 'Gerlach? Please? I have glitter!'][Math.floor(Math.random() * 2)], 2.4); }
    else S.ponyWait = 0;
  },
  boardPony(g, S) {
    const a = S.pony; if (!a || S.ponyAboard) return;
    S.ponyAboard = true; S.ponyWait = 0;
    g.fx.confetti(a.x, a.y + 2, a.z, 30); burnsSfx('appear', null, 'secret');
    a.def.seat = [0.15, BW15M.DECK, 1.5]; a.def.seatAnim = 'dance'; a.def.seatYaw = Math.PI * 0.85; a.setBehavior('bw15Seat');
    a.say('YAY! Gerlach! I call the disco ball!', 2.6);
    if (g.missions.state('pony') === 'available') g.missions.start('pony');
    BW15D.quip(g, 'pony', ['Welcome aboard! Mind the glitter. ...More glitter.', 'Every party barge needs a pony.'], true);
  },
  flags(g, S) {
    if (S.ending) return;
    for (const cp of S.cps) {
      if (cp.passed || cp.s < 5) continue;
      if (S.s >= cp.s && S.onRoad) { cp.passed = true; g.checkpointTouch(cp); if (cp.id === 'cp_hwy') g.toast('TIP: LET GO OF THE STICK TO CRUISE · PULL BACK TO BRAKE'); }
    }
  },
  landmarks(g, S, dt) {
    const rv = S.rv;
    // hidden: the hot springs detour
    const spr = BW15W.springs;
    if (spr && Math.hypot(rv.x - spr.x, rv.z - spr.z) < 18 && !g.missions.isDone('springs')) { g.missions.start('springs', true); g.missions.complete('springs'); BW15D.quip(g, 'springs', ['Ooh. Steam. So scenic. So detour.', 'Hot springs! Everybody\'s pores are so happy!'], true); }
    // a little commentary at the big moments
    if (S.zone === 'road' && S.s > 60 && S.s < 80) BW15D.quip(g, 'gateroad', ['We\'re out! We\'re OUT of the playa!', 'Bye, playa. I\'ll miss your dust. Not all of it.'], false);
    if (S.s > BW15.S.gas - 60 && S.s < BW15.S.gas - 40 && S.pony && !S.ponyAboard) BW15D.quip(g, 'gasnear', ['Gas station! And a stranded sparkle pony! Pull in, babe!', 'Somebody\'s holding a sign. GERLACH OR BUST. Same, girl.'], false);
    if (S.jelly.some(J => J.k > 0.5)) BW15D.quip(g, 'jelly', ['Jellyfish. Above the highway. Wave!', 'Are those jellyfish? They look so CALM.'], false);
    // arrival at the Gerlach diner
    const lot = BW15W.lot;
    if (lot && !S.ending && g.missions.state('gerlach') === 'active' && Math.hypot(rv.x - lot.x, rv.z - lot.z) < 11) BW15W.arrive(g, S);
  },
  // nobody gets run over: people step (or hop) out of the Party Barge's way
  shove(g, S) {
    const rv = S.rv, c = Math.cos(rv.yaw), s = Math.sin(rv.yaw);
    for (const a of g.actors) {
      if (a.hidden || a === S.chinka || (a === S.pony && S.ponyAboard) || a.def.fixedY) continue;
      const dx = a.x - rv.x, dz = a.z - rv.z; if (dx > 7 || dx < -7 || dz > 7 || dz < -7) continue;
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) < 1.75 && Math.abs(lz) < 5.3) {
        const push = (lx >= 0 ? 1 : -1) * (1.8 - Math.abs(lx));
        a.x += push * c; a.z -= push * s;
        if (Math.abs(S.v) > 2 && !a.bubbleText) { a.say(['WHOA!', 'Watch the barge!', 'Hey! Toes!', 'Love you too!'][Math.floor(Math.random() * 4)], 1.2); a.vy = 4; a.grounded = false; }
      }
    }
  },
  /* ---------------- intro: Monday morning ---------------- */
  intro(g) {
    const S = BW15.state, rv = S.rv, ch = S.chinka;
    const cx = rv.x, cz = rv.z, D = BW15M.DECK;
    g.cutscene([
      { music: 'burns_ending' },
      { cam: { x: -22, y: 14, z: -612, tx: -60, ty: 3, tz: -660, fov: 0.8 } },
      { banner: [BurnsWorlds.label(15).toUpperCase(), 'EXODUS · MONDAY MORNING', { col: '#ffb04a', big: true, dur: 3.2 }] },
      { wait: 2.2 },
      { cam: { from: { x: -22, y: 14, z: -612, tx: -60, ty: 3, tz: -660, fov: 0.8 }, to: { x: cx + 9, y: D + 6, z: cz - 14, tx: cx, ty: D + 1, tz: cz + 4, fov: 0.85 }, dur: 4.2 } },
      { say: [ch, ['Babe. We did it. You got me back from a giant wooden man.']] },
      { say: ['brady', ['And then he burned. Which I feel... complicated about.']] },
      { say: [ch, ['He\'ll be back next year. They always are.', 'Now: Gerlach. Pancakes. It\'s, like, twelve miles.']] },
      { cam: { from: { x: cx + 9, y: D + 6, z: cz - 14, tx: cx, ty: D + 1, tz: cz + 4, fov: 0.85 }, to: { x: cx + 26, y: 30, z: cz - 10, tx: 0, ty: 0, tz: BW15.GATE_Z, fov: 0.85 }, dur: 3.2 } },
      { say: ['brady', ['How long can twelve miles take?']] },
      { say: [ch, ['It\'s Exodus, babe. Nine hours. Minimum.']] },
      { do: g2 => { BurnsSave.flag(15, 'intro', true); g2.camYaw = rv.yaw; g2.snapCam = true; burnsMusic('burns_w15', 'burns_w7'); } },
      { banner: ['GERLACH OR BUST', 'Wait for the pulse · TAKE the last bags · hold to drive', { col: '#ffd84a', dur: 3 }] }
    ], null);
  },
  /* ---------------- the end: sunrise breakfast in Gerlach ---------------- */
  arrive(g, S) {
    S.ending = true; S.enc = null; if (S.chase) { S.chase.cop.state = 'return'; S.chase.cop.lights = false; S.chase = null; }
    if (S.tail) { S.tail.cop.state = 'return'; S.tail = null; }
    S.scripted = { v: 0, acc: 9 };
    const p = g.player, rv = S.rv, ch = S.chinka, pony = S.pony, tb = BW15W.tables[0], dYaw = BW15W.dinerYaw;
    const ponyAboard = S.ponyAboard;
    const steps = [
      { do: () => { burnsMusic('burns_ending'); g.setTod(1, 0.25); } },
      { banner: ['GERLACH!', 'Population: small. Pancakes: many.', { col: '#ffb04a', big: true, dur: 2.6 }] },
      { cam: { x: rv.x + Math.cos(rv.yaw) * 14 - Math.sin(rv.yaw) * 8, y: rv.y + 6, z: rv.z - Math.sin(rv.yaw) * 14 - Math.cos(rv.yaw) * 8, tx: rv.x, ty: rv.y + 3, tz: rv.z, fov: 0.9 } },
      { wait: 1.2 }
    ];
    if (ponyAboard && pony) steps.push(
      { say: [pony, ['GERLACH! You beautiful barge people! Here: my last bag. Don\'t tell my camp.']] },
      { do: () => { const G = S.givers[7]; S.lastBagId = G.id; if (G.pick && !G.pick.taken) { G.pick.taken = true; G.pick.obj.visible = false; } BW15D.bagTaken(g, S, G.power); S.ponyAboard = false; pony.setBehavior('idle'); const q = BW15W.tables[2]; pony.x = q.x + 1.5; pony.z = q.z; pony.y = g.world.height(q.x, q.z); if (!g.missions.isDone('pony')) g.missions.complete('pony'); } }
    );
    steps.push(
      { fade: 'out', dur: 0.6 },
      { do: () => {
        S.allowExit = true; S.form.mode = 'rv'; S.form.k = 0; S.trip.peak = 0;
        if (p.vehicle) p.vehicle.dismount(p);
        rv.mv.visible = true;
        p.teleport(tb.x + Math.sin(dYaw) * 0.75, g.world.height(tb.x, tb.z), tb.z + Math.cos(dYaw) * 0.75, dYaw + Math.PI); p.locked = true; p.animOverride = 'sit';
        if (ch) { ch.def.seat = null; ch.setBehavior('sit'); ch.def.fixedY = true; ch.x = tb.x - Math.sin(dYaw) * 0.75; ch.z = tb.z - Math.cos(dYaw) * 0.75; ch.y = g.world.height(tb.x, tb.z); ch.yaw = dYaw; }
      } },
      { cam: { x: tb.x + Math.cos(dYaw) * 4.5 + Math.sin(dYaw) * 1.5, y: g.world.height(tb.x, tb.z) + 2.0, z: tb.z - Math.sin(dYaw) * 4.5 + Math.cos(dYaw) * 1.5, tx: tb.x, ty: g.world.height(tb.x, tb.z) + 1.0, tz: tb.z, fov: 0.85 } },
      { fade: 'in', dur: 0.8 },
      { say: [ch, ['We made it. Gerlach. Actual pancakes.']] },
      { say: ['brady', ['The pancakes are... breathing.']] },
      { say: [ch, ['That\'s steam, babe.']] },
      { say: ['brady', ['Oh. Good. Great. Normal pancakes.']] },
      { say: [ch, ['You walked through fire for me this week. And dust. And, like, four lines.', '...Same time next year?']] },
      { say: ['brady', ['Same time next year.']] },
      { do: () => { g.fx.hearts(tb.x, g.world.height(tb.x, tb.z) + 1.6, tb.z, 18); burnsSfx('reunion', null, 'secret'); } },
      { cam: { to: { x: tb.x + Math.cos(dYaw) * 12, y: g.world.height(tb.x, tb.z) + 9, z: tb.z - Math.sin(dYaw) * 12, tx: tb.x, ty: g.world.height(tb.x, tb.z) + 2, tz: tb.z, fov: 0.9 }, dur: 3 } },
      { do: () => { S.card = { t: 0 }; } },
      { wait: 6.5 },
      { do: () => { if (!g.missions.isDone('gerlach')) g.missions.complete('gerlach'); } }
    );
    g.missions.complete('gerlach');
    g.cutscene(steps, g2 => { S.card = null; p.locked = false; p.animOverride = null; BurnsSave.flag(15, 'done', true); g2.finishWorld(); });
  }
});

/* ---------------- debug + test hooks ---------------- */
window.BW15_DEBUG = {
  S: () => BW15.state,
  state() {
    const S = BW15.state; if (!S || !S.rv) return null;
    return { x: S.rv.x, z: S.rv.z, yaw: S.rv.yaw, v: S.v, s: S.s, lat: S.lat, zone: S.zone, paved: S.paved, phase: S.pulse.phase, bigT: S.pulse.bigT, bags: S.trip.bags, level: S.trip.level, vis: BW15D.tripVis(S), form: S.form.mode, enc: S.enc ? { kind: S.enc.kind, susp: S.enc.susp, t: S.enc.t } : null, chase: S.chase ? { lock: S.chase.lock, close: S.chase.close } : null, tail: S.tail ? { lock: S.tail.lock } : null, ribbon: S.ribbon.amp, hide: S.hideWhy, pony: S.ponyAboard, ending: S.ending, givers: S.givers.map(G => G.state), label: BW15D.actionLabel(S.g) };
  },
  // autopilot: {lat, speed, look} follows the road; {x, z, speed} heads to a point; null = off
  ap(o) { BW15.state.ap = o; },
  place(s, lat) { const S = BW15.state, a = BW15_ROAD.at(s, lat === undefined ? -1.85 : lat, {}); BW15D.placeRV(S.g, S, { x: a.x, z: a.z, yaw: a.yaw }); S.s = s; },
  placeXZ(x, z, yaw) { const S = BW15.state; BW15D.placeRV(S.g, S, { x, z, yaw: yaw || 0 }); },
  take() { const S = BW15.state, G = BW15D.readyGiver(S); if (G) { BW15D.takeBag(S.g, S, G); return true; } return false; },
  // tap STEADY on every beat with the given accuracy (0..1) for sec seconds of sim
  steady(acc) { BW15.state.autoSteady = acc; },
  speed(v) { BW15.state.v = v; },
  // key places for scripted tests: pony, furry, techbro, gas, springs, lot, check, devils, hill
  pos(name) {
    const S = BW15.state, g = S.g, A = n => { const a = g.actor(n); return a ? { x: a.x, z: a.z } : null; };
    switch (name) {
      case 'pony': return A('w15pony'); case 'furry': return A('w15giver4'); case 'tech': return A('w15giver5'); case 'healer': return A('w15giver6');
      case 'gas': return { x: BW15W.gas.x, z: BW15W.gas.z }; case 'springs': return { x: BW15W.springs.x, z: BW15W.springs.z }; case 'lot': return { x: BW15W.lot.x, z: BW15W.lot.z };
      case 'hill': return { x: BW15W.hill.x, z: BW15W.hill.z }; case 'devils': return S.devils.map(D => ({ x: D.x, z: D.z, r: D.r }));
      case 'track': return BW15_TERR.tracks[0].pts.map(p => ({ x: p[0], z: p[1] }));
      default: return null;
    }
  },
  bags(n) { const S = BW15.state; for (let i = 0; i < n; i++) { S.lastBagId = null; BW15D.bagTaken(S.g, S, 'molly'); } }
};
// test helper: auto-tap STEADY close to each beat (runs inside the sim step)
(() => {
  const prev = BW15C.updateEnc;
  BW15C.updateEnc = function (g, S, dt) {
    if (S.autoSteady !== undefined && S.autoSteady !== null && S.enc) { const E = S.enc; for (const b of E.beats) if (!b.res && Math.abs(b.t - E.t) < 0.02) { if (Math.random() < S.autoSteady) BW15C.encTap(g, S); } }
    return prev.call(this, g, S, dt);
  };
})();
