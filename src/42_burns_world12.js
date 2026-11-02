/* ============================================================
   BRADY-O BURNS — World 12: THE TEMPLE (dawn, deep playa)
   After the dust storm (World 9) Brady has only Chinka's LED necklace and
   fears the worst. At dawn he walks out to the Temple to write her name.
   Quiet, tender, respectful: no enemies, no combat, no jokes at the Temple.
   Missions (Burn Tokens, all gentle; awarded quietly):
     lamps   Lamps at Dawn          put out the last five lamps for Ollie the lamp lighter -> a marker
     carry   Carried Together       help Wren carry her grandfather's boat to the Temple
     notes   Scattered Words        six storm-blown notes, pinned back up at the Temple gate
     view    A Quiet Place to See   climb the Sunrise Stair
     name    Her Name               trace CHINKA onto the Temple wood (real tracing)
     hope    Not Gone               the message tucked into the wood -> the Workshops (finishes the world)
   The Temple is an original design: a ring of curved timber ribs and message
   walls around a nine-post sanctuary under a twisting lattice lantern tower.
   ============================================================ */

const BW12 = {
  TC: { x: 0, z: -82 }, RO: 20, RI: 8,
  CAMP: { x: 2, z: 154 },
  WRITE_A: 40 * Math.PI / 180,          // the sanctuary side Brady writes on (outer face)
  NOTE_GIVE: { x: -7.0, z: -64.6 },     // the note board inside the south gate
  OFFER: { x: 9.5, z: -66.5 },          // where Wren sets her boat down
  STAIR: { x: 60, z: -14 },
  BELLS: { x: -58, z: 88 },
  TABLE: { x: -34, z: 14 },
  TREE: { x: 74, z: 62 },
  state: null
};
BW12.SKY_A = { zen: '#1c2454', mid: '#5a4c8e', midK: 0.38, hor: '#f2a286', fog: '#a898b4', fogD: 0.0072, fogH: 0.05, haze: 0.62, fogMax: 0.9,
  sun: [195, -3], sunCol: '#ffb080', sunSize: 0.002, moon: [25, 30], moonK: 0.6, stars: 0.45, mtnCol: '#4a3a5e', mtnH: 3.0,
  city: [0, 0], cityCol: '#ff8ad0', cityK: 0.22, sky: '#9a96c4', gnd: '#a07a70', key: '#e0bcc0', keyK: 0.6, emB: 1.45, rim: '#d8b8ff',
  clouds: 0.38, cloudCol: '#e8a8b4', cloudScale: 0.5 };
BW12.SKY_B = { zen: '#3a5aa8', mid: '#d0a0c0', midK: 0.42, hor: '#ffcf9a', fog: '#f0c8ac', fogD: 0.0062, fogH: 0.05, haze: 0.66, fogMax: 0.88,
  sun: [195, 7], sunCol: '#ffd090', sunSize: 0.0028, moon: [25, 18], moonK: 0.1, stars: 0, mtnCol: '#7a5a7a', mtnH: 3.0,
  city: [0, 0], cityCol: '#ff9ad0', cityK: 0.05, sky: '#c8b8d8', gnd: '#c09080', key: '#ffcc90', keyK: 1.0, emB: 1.25, rim: '#ffd8b0',
  clouds: 0.5, cloudCol: '#ffc8b8', cloudScale: 0.5 };
BW12.pol = (a, r) => [BW12.TC.x + Math.sin(a) * r, BW12.TC.z + Math.cos(a) * r];

/* single-stroke handwriting glyphs for the tracing (letter height 1, baseline 0) */
BW12.GLYPHS = (() => {
  const arc = (cx, cy, rx, ry, a0, a1, n) => { const out = []; for (let i = 0; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return out; };
  return {
    C: { w: 0.8, strokes: [arc(0.44, 0.5, 0.4, 0.5, 52, 308, 22)] },
    H: { w: 0.76, strokes: [[[0.06, 1], [0.06, 0]], [[0.7, 1], [0.7, 0]], [[0.06, 0.52], [0.7, 0.52]]] },
    I: { w: 0.26, strokes: [[[0.13, 1], [0.13, 0]]] },
    N: { w: 0.76, strokes: [[[0.06, 0], [0.06, 1], [0.7, 0], [0.7, 1]]] },
    K: { w: 0.72, strokes: [[[0.08, 1], [0.08, 0]], [[0.68, 1], [0.1, 0.44], [0.7, 0]]] },
    A: { w: 0.82, strokes: [[[0.02, 0], [0.41, 1], [0.8, 0]], [[0.17, 0.4], [0.65, 0.4]]] }
  };
})();

BurnsWorlds.register({
  id: 12, name: 'The Temple', sub: 'Dawn on the deep playa',
  sky: BW12.SKY_A, sky2: BW12.SKY_B, tod: 0,
  music: 'w9',
  bounds: [-110, -150, 110, 176],
  spawn: { x: 0, y: 0, z: 150, yaw: Math.PI },
  ground: { base: '#dcc4ac', crack: 0.14, mottle: 0.3, res: 0.4 },
  dust: 0.7,
  missions: [
    { id: 'lamps', name: 'Lamps at Dawn', short: 'Put out the last five lamps', type: 'custom', count: 5, giver: 'ollie', start: 'manual', tokenDirect: true, progressLabel: 'Lamps', marker: { x: -2, z: 100 },
      desc: 'Ollie kept the lamps burning all night for the people walking out in the storm. Five are still lit. Jump up and give each flame a goodnight, then go back to him.', hint: 'The lamp line, north of where the storm ended (Ollie)',
      onComplete(g) { g.flag('marker', true); g.setTod(Math.max(g.tod, g.tod + 0.12), 0.03); } },
    { id: 'carry', name: 'Carried Together', short: 'Carry Wren\'s boat to the Temple', type: 'escort', companion: 'wren', giver: 'wren', start: 'manual', target: { x: BW12.OFFER.x, z: BW12.OFFER.z, r: 4.5 }, tokenDirect: true, marker: { x: 48, z: 88 },
      desc: 'Wren\'s grandfather built boats all his life. She promised to bring his last one to the Temple. It takes two to carry it.', hint: 'The Lantern Garden, east of the lamp line',
      onStart(g) { BW12.carryStart(g); }, onComplete(g) { BW12.carryDone(g); } },
    { id: 'notes', name: 'Scattered Words', short: 'Gather the storm-blown notes', type: 'custom', count: 6, giver: 'juniper', start: 'manual', tokenDirect: true, progressLabel: 'Notes', marker: { x: BW12.NOTE_GIVE.x, z: BW12.NOTE_GIVE.z },
      desc: 'The storm tore six notes off the Temple walls and scattered them across the playa. Gather them, then pin them back up on the board inside the Temple gate.', hint: 'Caught on the art all over the playa; the board is inside the south gate',
      onEvent(g, m, name, data) { if (name === 'pickup' && data.mission === 'notes') { m.n++; if (m.n >= 6) { g.banner('ALL SIX NOTES', 'Pin them back up inside the Temple gate.', { col: '#ffe0a8', small: true }); } else g.toast(`Notes: ${m.n}/6`); return true; } } },
    { id: 'view', name: 'A Quiet Place to See', short: 'Climb the Sunrise Stair', type: 'climb', start: 'trigger', target: { x: BW12.STAIR.x, z: BW12.STAIR.z, r: 3.2, y: 15.0 }, tokenDirect: true, marker: { x: BW12.STAIR.x, z: BW12.STAIR.z },
      desc: 'An old spiral stair, built for one thing: watching the sun come up behind the Temple.', hint: 'East of the Temple, the tall spiral stair',
      onComplete(g) { BW12.viewDone(g); } },
    { id: 'name', name: 'Her Name', short: 'Write her name on the Temple', type: 'custom', start: 'manual', requires: ['lamps'], tokenDirect: true, marker: { x: 5.5, z: -75 },
      desc: 'Find a quiet place on the wood and write her name.', hint: 'Inside the Temple: the pale plank on the sanctuary wall', lockedDesc: 'You need something to write with. The lamp lighter might have a spare marker.' },
    { id: 'hope', name: 'Not Gone', short: 'Something is tucked in the wood', type: 'find', start: 'manual', requires: ['name'], tokenDirect: true, marker: { x: 2.9, z: -74 },
      desc: 'A folded slip of paper, tucked into a crack in the post beside her name.', hint: 'The post right beside where you wrote her name',
      onComplete(g) { BW12.ending(g); } }
  ],
  build(api, g) {
    const R = api.rng, TC = BW12.TC;
    BW12.state = { introDone: !!BurnsSave.flag(12, 'intro'), timers: [], lamps: [], bells: [], rung: {}, trace: null, ink: null, carry: null, motes: [], windT: 6, writeAt: null };
    const S = BW12.state;
    /* ---------------- custom textures (allocated first so the atlas layout is stable) ---------------- */
    S.tx = {
      msgA: BW1213.tex('w12msgA', 600, 212, (x, w, h) => BW1213.paintMessages(x, w, h, 11)),
      msgB: BW1213.tex('w12msgB', 600, 212, (x, w, h) => BW1213.paintMessages(x, w, h, 23)),
      msgC: BW1213.tex('w12msgC', 600, 212, (x, w, h) => BW1213.paintMessages(x, w, h, 37)),
      note: BW1213.tex('w12note', 580, 400, (x, w, h) => BW1213.paintNote(x, w, h, ['B —', 'Not gone. The big guy carried me', 'off in the storm, but I\'m okay.', 'Find me where lost loves are found:', '9:00, the Workshops.', '— C'], { heart: true, ink: '#2a2a6a' })),
      carve: BW1213.tex('w12carve', 256, 64, (x, w, h) => BW1213.paintCarving(x, w, h)),
      photos: BW1213.tex('w12photos', 256, 80, (x, w, h) => BW1213.paintPhotos(x, w, h)),
      pinned: BW1213.tex('w12pinned', 240, 120, (x, w, h) => { const r = mulberry32(5); for (let i = 0; i < 6; i++) { const px = 10 + (i % 3) * 76 + r() * 8, py = 8 + Math.floor(i / 3) * 56 + r() * 6; x.save(); x.translate(px + 30, py + 22); x.rotate(r.range(-0.2, 0.2)); x.fillStyle = r.pick(['#fff4c8', '#ffd8e0', '#e0f0ff', '#fbf8ec']); x.fillRect(-30, -22, 60, 44); x.strokeStyle = 'rgba(40,30,60,0.7)'; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(-24, -12 + k * 9); x.lineTo(r.range(4, 24), -12 + k * 9); x.stroke(); } x.fillStyle = '#c83a3a'; x.beginPath(); x.arc(0, -20, 3, 0, TAU); x.fill(); x.restore(); } })
    };
    const msgRegs = [S.tx.msgA, S.tx.msgB, S.tx.msgC];
    const msgSub = (i, w) => { const reg = msgRegs[i % 3], fw = Math.min(1, w); return BW1213.sub(reg, (i * 0.37) % (1 - fw + 0.001), 0, fw, 1); };
    /* ---------------- ground ---------------- */
    api.paint((c, P, sc) => {
      for (let i = 0; i < 170; i++) { const [px, pz] = P(R.range(-110, 110), R.range(-150, 176)), r = R.range(2, 10) * sc; const g2 = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.5; g2.addColorStop(0, dark ? 'rgba(150,120,110,0.18)' : 'rgba(245,228,210,0.22)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; c.fillRect(px - r, pz - r, r * 2, r * 2); }
      // the walk out: a soft trail of footprints from the storm camp to the Temple gate
      c.strokeStyle = 'rgba(160,128,110,0.28)'; c.lineWidth = 3.2 * sc; c.lineCap = 'round';
      c.beginPath(); for (let z = 160; z > -60; z -= 4) { const [px, pz] = P(Math.sin(z * 0.03) * 2.2, z); z === 160 ? c.moveTo(px, pz) : c.lineTo(px, pz); } c.stroke();
      c.strokeStyle = 'rgba(160,128,110,0.16)'; c.lineWidth = 1.6 * sc;
      for (const [a, b] of [[[0, 110], [-58, 88]], [[0, 96], [50, 92]], [[0, 30], [-34, 16]], [[2, 0], [60, -14]], [[-4, -20], [-64, -34]], [[2, 40], [12, 34]]]) { const [x0, z0] = P(a[0], a[1]), [x1, z1] = P(b[0], b[1]); c.beginPath(); c.moveTo(x0, z0); c.quadraticCurveTo((x0 + x1) / 2 + 12 * sc, (z0 + z1) / 2, x1, z1); c.stroke(); }
      // footprints along the main trail
      c.fillStyle = 'rgba(120,96,86,0.22)';
      for (let z = 150; z > -56; z -= 1.1) { const side = Math.round(z / 1.1) % 2 ? 0.35 : -0.35, [px, pz] = P(Math.sin(z * 0.03) * 2.2 + side, z); c.beginPath(); c.ellipse(px, pz, 0.12 * sc, 0.2 * sc, 0, 0, TAU); c.fill(); }
      // the Temple forecourt and courtyard: raked, paler dust
      const [tx, tz] = P(TC.x, TC.z);
      let gg = c.createRadialGradient(tx, tz, 2 * sc, tx, tz, 34 * sc); gg.addColorStop(0, 'rgba(250,236,214,0.6)'); gg.addColorStop(0.62, 'rgba(244,226,204,0.5)'); gg.addColorStop(1, 'rgba(244,226,204,0)'); c.fillStyle = gg; c.beginPath(); c.arc(tx, tz, 34 * sc, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(170,140,120,0.22)'; c.lineWidth = 0.18 * sc;
      for (let r = 9.5; r < 19; r += 0.9) { c.beginPath(); c.arc(tx, tz, r * sc, 0, TAU); c.stroke(); }
      // light falling through the lattice (warm stripes along the sun's ground direction)
      const sd = [-Math.sin(195 * Math.PI / 180), -Math.cos(195 * Math.PI / 180)];
      for (let i = 0; i < 26; i++) { const a = R() * TAU, rr = R.range(9.5, 18.5), [px, pz] = P(TC.x + Math.sin(a) * rr, TC.z + Math.cos(a) * rr); c.save(); c.translate(px, pz); c.rotate(Math.atan2(sd[1], sd[0])); const lg = c.createRadialGradient(0, 0, 0, 0, 0, 2.6 * sc); lg.addColorStop(0, 'rgba(255,226,170,0.42)'); lg.addColorStop(1, 'rgba(255,226,170,0)'); c.fillStyle = lg; c.scale(1, 0.32); c.beginPath(); c.arc(0, 0, 2.6 * sc, 0, TAU); c.fill(); c.restore(); }
      // where the storm ended: a churned patch of dust
      const [sx, sz] = P(BW12.CAMP.x, BW12.CAMP.z); gg = c.createRadialGradient(sx, sz, 0, sx, sz, 12 * sc); gg.addColorStop(0, 'rgba(200,170,150,0.45)'); gg.addColorStop(1, 'rgba(200,170,150,0)'); c.fillStyle = gg; c.fillRect(sx - 12 * sc, sz - 12 * sc, 24 * sc, 24 * sc);
      for (let i = 0; i < 18; i++) { const a = R() * TAU, len = R.range(3, 9) * sc; c.strokeStyle = 'rgba(150,120,100,0.25)'; c.lineWidth = 0.25 * sc; c.beginPath(); c.moveTo(sx, sz); c.quadraticCurveTo(sx + Math.cos(a + 0.6) * len * 0.5, sz + Math.sin(a + 0.6) * len * 0.5, sx + Math.cos(a) * len, sz + Math.sin(a) * len); c.stroke(); }
    });
    /* ---------------- the Temple ---------------- */
    BW12.buildTemple(api, R, msgSub, S);
    /* ---------------- the storm camp (start) ---------------- */
    const C = BW12.CAMP;
    api.mesh(C.x + 6.5, C.z + 3, m => { // Juniper's little dawn camp: a dome tent, a crate, a kettle on a stove
      const M = BW1213.M;
      m.color('#7a8ab0'); m.ellipsoid(0, 0, 0, 1.6, 1.25, 1.4, { phi1: Math.PI / 2 }); m.color('#5a6a90'); m.ellipsoid(0, 0.02, 1.36, 0.5, 0.75, 0.08, { phi1: Math.PI / 2 });
      m.color('#3a3a44'); m.limb(-1.5, 0, 0, 1.5, 0, 0, 0.03, 0.03);
      m.push(); m.tf(-2.4, 0, -1.6); m.color('#a07a4a'); m.roundBox(0, 0.3, 0, 0.7, 0.6, 0.5, 0.06); m.color('#3a3a44'); m.roundCyl(0, 0.6, 0, 0.18, 0.12, 0.03); m.color('#c84a3a').shine(2); m.lathe([[0.13, 0.72], [0.15, 0.82], [0.12, 0.95], [0.04, 1.0], [0, 1.0]], { seg: 10 }); m.limb(0.12, 0.88, 0, 0.24, 0.94, 0, 0.018, 0.012); m.shine(0); m.pop();
      M.lantern(m, -1.2, 0.95, -2.6, 0.18, '#ffe0b0', 0.8);
      m.color('#3a2a1a'); m.limb(-1.2, 0, -2.6, -1.2, 0.75, -2.6, 0.02, 0.02);
      return { cols: [{ t: 'dome', x: 0, z: 0, r: 1.5, y0: 0 }, { t: 'box', x: -2.4, z: -1.6, hx: 0.35, hz: 0.25, y0: 0, y1: 0.6 }], lights: [{ x: -1.2, y: 0.95, z: -2.6, s: 1.2, c: '#ffd8a0', pool: 5 }] };
    });
    api.mesh(C.x + 3.6, C.z - 2.4, m => { const cl = BW1213.M.chair(m, '#5a7a9a'); return { cols: cl }; }, { yaw: -2.4 });
    api.checkpoint('cp_dust', C.x - 6, C.z + 2, { yaw: Math.PI, name: 'Where the Storm Ended' });
    S.necklace = api.mover(m => { for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; m.color(BURNS_NEON[i % 7], 1); m.ball(Math.sin(a) * 0.11, Math.cos(a) * 0.05, Math.cos(a) * 0.11 * 0.6, 0.022); } m.emissive(0); m.color('#2a2a30'); m.torus(0, 0, 0, 0.11, 0.006); return { cols: [] }; });
    S.necklace.visible = false;
    api.npc({ id: 'juniper', name: 'JUNIPER', spec: Object.assign(BW1213.base(4, { face: 'friendly', skin: '#e2b496', skinSh: '#c29476', hair: { style: 'long', col: '#c8c4c0', hi: '#e8e4e0' }, top: { kind: 'tee', col: '#e8dcc8' }, coat: { kind: 'kimono', col: '#8a6a9a', trim: '#b89ac8' }, bottom: { kind: 'kilt', col: '#6a5a4a' }, shoes: { kind: 'boots', col: '#5a4030' }, glasses: 'clear', acc: ['bracelets'] }), { key: 'bw12:juniper' }),
      x: C.x + 3.4, z: C.z - 1.8, yaw: -2.2, behavior: 'bw12still', anim: 'bw1213_floorsit', chatter: false,
      talk(g, a) {
        const st = g.missions.state('notes');
        if (st === 'available') g.say(a, ['The storm tore some notes right off the Temple walls. If you find any out there, carry them home with you?'], () => { g.missions.start('notes', true); g.banner('SCATTERED WORDS', 'Gather the six storm-blown notes.', { col: '#ffe0a8', small: true }); });
        else if (st === 'active') g.say(a, ['Take your time, sweetheart. The notes will wait. So will the Temple.']);
        else if (g.missions.isDone('hope')) g.say(a, ['Look at you. You walked out here carrying a goodbye and you\'re walking back with a hello.']);
        else g.say(a, ['The Temple holds the not-knowing, too. Go on. Water first, always water first.']);
      } });
    /* ---------------- the lamp line (Ollie, the lamp lighter) ---------------- */
    const lampZ = [140, 122, 104, 86, 68, 50, 32, 14, -4, -22, -40];
    const lampDone = BurnsSave.hasToken(12, 'lamps');
    for (const z of lampZ) {
      const lit = z === 104 || z === 50 || z === -22, H = lit ? (z === 50 ? 4.1 : 4.9) : 3.6;
      BW12.lampPost(api, -3.2, z, H, lit && !lampDone);
      if (z === 50) api.roundBox(-4.5, 0, 50.6, 1.0, 1.0, 1.0, '#a07a4a', { r: 0.12 });
    }
    api.npc({ id: 'ollie', name: 'OLLIE, LAMP LIGHTER', type: 'lamplighter', seed: 3, x: -1.4, z: 112, yaw: Math.PI, behavior: 'walk', path: [[-1.4, 128], [-1.4, 62]], pingpong: true, speed: 0.75, chatter: false,
      talk(g, a) {
        const st = g.missions.state('lamps'), m = g.missions.get('lamps');
        if (st === 'available' || st === 'locked') g.say(a, ['Morning, friend. These lamps burned all night for everyone walking out in the storm.', 'Five are still lit, and my knees have walked this line for twenty-two years.', 'Would you give each flame a goodnight? Jump up and touch the lantern. They\'ve done their work.'], () => { g.missions.start('lamps'); });
        else if (st === 'active' && m.n < 5) g.say(a, [`${5 - m.n} still burning. One up the line, one at the Bell Garden, one at the Long Table, one by the Temple. Gently, now.`]);
        else if (st === 'active') g.say(a, ['All of them. Thank you. They can rest now.', 'Here. Everybody needs a pen at the Temple. Write true.'], () => { g.missions.complete('lamps'); g.banner('TEMPLE MARKER', 'Something to write with.', { col: '#ffe0a8' }); burnsSfx('gift', { vol: 0.6 }, 'pick'); });
        else g.say(a, ['Go on. The sun waits for no one. Not even out here.']);
      } });
    /* ---------------- the Bell Garden ---------------- */
    BW12.buildBells(api, R, S);
    /* ---------------- the Lantern Garden, the cairns and the Lantern Tree (Wren) ---------------- */
    BW12.buildLanterns(api, R, S);
    /* ---------------- the Long Table ---------------- */
    BW12.buildTable(api, R, S);
    /* ---------------- the Sunrise Stair ---------------- */
    BW12.buildStair(api, R, S);
    /* ---------------- paper cranes ---------------- */
    api.mesh(-64, -34, m => {
      const cols = [];
      for (const sx of [-5, 5]) { m.color('#8a6440'); m.limb(sx, 0, 0, sx, 5.2, 0, 0.12, 0.09); m.color('#6a4a30'); m.roundCyl(sx, 0, 0, 0.32, 0.18, 0.06); cols.push({ t: 'cyl', x: sx, z: 0, r: 0.15, y0: 0, y1: 5.2, camPass: true }); }
      const rr = mulberry32(77);
      for (let s = 0; s < 5; s++) {
        const y = 2.0 + s * 0.62;
        m.color('#d8c8b0'); m.limb(-5, y + 0.12, 0, 5, y + 0.12, 0, 0.006, 0.006);
        for (let k = 0; k < 14; k++) {
          const t = (k + 0.5) / 14, x = lerp(-5, 5, t), yy = y + 0.12 - Math.sin(t * Math.PI) * 0.35 - 0.18;
          m.color(rr.pick(['#ff9ab8', '#ffd890', '#a8d8ff', '#c8a8ff', '#ffffff', '#a8f0c8']));
          m.push(); m.tf(x, yy, (rr() - 0.5) * 0.25, rr() * TAU, 0, 0, 0.9 + rr() * 0.3);
          m.extrude([[-0.13, 0], [0, -0.05], [0.13, 0], [0, 0.04]], 0.04); m.push(); m.tf(0, 0.01, 0, 0, 0, 0.4); m.extrude([[0, 0], [0.12, 0.06], [0.02, 0.01]], 0.08); m.pop(); m.push(); m.tf(0, 0.01, 0, 0, 0, -0.4); m.extrude([[0, 0], [-0.02, 0.01], [-0.12, 0.06]], 0.08); m.pop();
          m.pop();
        }
      }
      return { cols };
    });
    api.sign('FLY THEM HOME', -64, -29.5, { h: 0.8, style: { bg: '#f8f0e0', fg: '#4a3a5a', size: 40, border: '#a89070', font: BW1213.HAND } });
    /* ---------------- Sunrise Chai (gifting) ---------------- */
    api.mesh(12, 34, m => {
      m.color('#8a5a8a'); m.roundBox(0, 0.85, 0, 2.0, 1.0, 1.0, 0.12); m.color('#f4e8d0'); m.roundBox(0, 1.38, 0, 2.1, 0.08, 1.1, 0.03);
      m.color('#3a3a40'); for (const sx of [-0.7, 0.7]) { m.push(); m.tf(sx, 0.32, 0.55, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.26, 0.06); m.pop(); }
      m.color('#d8b070'); for (const sx of [-1, 1]) m.limb(sx * 0.95, 1.4, 0.45, sx * 0.95, 2.6, 0.45, 0.03, 0.03);
      BW1213.M.sail(m, [-1.2, 2.6, 0.7], [1.2, 2.6, 0.7], [1.2, 2.3, -0.6], [-1.2, 2.3, -0.6], '#ffb088', 0.15);
      m.color('#c8c8d0').shine(3); m.lathe([[0.16, 1.42], [0.2, 1.55], [0.17, 1.72], [0.05, 1.78], [0, 1.78]], { seg: 10 }); m.shine(0);
      for (let i = 0; i < 4; i++) { m.color(['#ffffff', '#ff9ab8', '#a8d8ff', '#ffd890'][i]); m.roundCyl(-0.7 + i * 0.22, 1.42, 0.2, 0.06, 0.1, 0.02); }
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.05, hz: 0.55, y0: 0, y1: 1.42 }], lights: [{ x: 0, y: 2.2, z: 0.6, s: 1.4, c: '#ffd0a0', pool: 6 }] };
    }, { yaw: -0.3 });
    api.sign('SUNRISE CHAI\nFREE', 13.4, 36.2, { yaw: -0.3, h: 0.9, style: { bg: '#5a2a5a', fg: '#ffe0b0', size: 38, border: '#ffd0a0' } });
    api.npc({ id: 'mira', name: 'MIRA', spec: Object.assign(BW1213.base(8, { face: 'lashes', skin: '#b87850', skinSh: '#985830', hair: { style: 'bun', col: '#1a1010' }, top: { kind: 'tee', col: '#f4b8a0' }, bottom: { kind: 'kilt', col: '#4a3a6a' }, shoes: { kind: 'sneakers', col: '#e8e0d0' }, acc: ['bracelets'], prop: 'coffee' }), { key: 'bw12:mira' }),
      x: 11.4, z: 35.4, yaw: 2.8, chatter: false,
      lines: ['Chai? It\'s mostly hot water and kindness. Mostly kindness.', 'People walk out to the Temple all morning. I just make sure nobody does it thirsty.'], gift: { kind: 'water' } });
    api.npc({ name: 'BEAU', type: 'burner', seed: 210, x: 14.6, z: 33.2, yaw: 2.2, chatter: false, lines: ['First time out here at sunrise?', 'Have some glow sticks. They light the way back, too.'], gift: { kind: 'glowstick', n: 12 } });
    api.checkpoint('cp_table', -20, 28, { yaw: Math.PI, name: 'The Long Table' });
    api.checkpoint('cp_temple', 9, -40, { yaw: Math.PI, name: 'The Temple Forecourt' });
    /* ---------------- quiet walkers on the playa ---------------- */
    const walkers = [[[18, 120], [6, -44]], [[-24, 90], [-6, -46]], [[30, 10], [10, -48]], [[-40, -10], [-9, -50]]];
    walkers.forEach((w, i) => api.npc({ type: R.pick(['burner', 'furcoat', 'burner']), seed: 300 + i, x: w[0][0], z: w[0][1], behavior: 'walk', path: [w[0], w[1]], pingpong: true, speed: 0.8 + i * 0.08, chatter: false, lines: [['Morning.', 'Peaceful out here, huh?'], ['Walking out to see my brother\'s name.', 'Every year.'], ['The light through the Temple at sunrise... you\'ll see.'], ['Hi. Sorry. I\'m just... walking.']][i] }));
    api.npc({ type: 'burner', seed: 341, name: 'TWO FRIENDS', x: -16, z: 60, yaw: 2.4, behavior: 'bw12still', anim: 'bw1213_hug', chatter: false, lines: ['(They hold each other and don\'t say anything. That\'s the whole conversation.)'] });
    api.npc({ type: 'tutu', seed: 342, x: -15.3, z: 60.6, yaw: -0.74, behavior: 'bw12still', anim: 'bw1213_hug', chatter: false, noTalk: true });
    /* ---------------- notes (Scattered Words) ---------------- */
    const noteAt = [[-6, 0.9, 138], [S.bellTop[3][0], S.bellTop[3][1] + 0.9, S.bellTop[3][2]], [-30, 1.8, 14], [S.cairnTop[3][0], S.cairnTop[3][1] + 0.9, S.cairnTop[3][2]], [-64, 2.5, -34], [S.stairStep[9][0], S.stairStep[9][1] + 0.9, S.stairStep[9][2]]];
    noteAt.forEach((p, i) => { const P = api.pickup('item:note', p[0], p[1], p[2], { mission: 'notes', gate: true, label: 'NOTE', icon: 'heart', col: '#fffbe8', id: 'note' + i, follow(g2, Pk) { Pk.x = p[0] + Math.sin(g2.time * 1.3 + i) * 0.18; Pk.z = p[2] + Math.cos(g2.time * 1.1 + i * 2) * 0.12; Pk.y0 = p[1] + Math.sin(g2.time * 2.1 + i) * 0.1; } }); void P; });
    /* ---------------- the message in the wood ---------------- */
    const pa = BW12.WRITE_A - 20 * Math.PI / 180, pp = BW12.pol(pa, BW12.RI + 0.42);
    S.hopeAt = { x: pp[0], y: 2.45, z: pp[1] };
    api.pickup('item:note', pp[0], 2.45, pp[1], { mission: 'hope', gate: true, label: 'A NOTE?', icon: 'heart', col: '#fff4e0', id: 'hopeNote', persist: false });
    /* ---------------- collectibles + gentle ground score ---------------- */
    api.pickup('photo', BW12.TREE.x, 6.6, BW12.TREE.z, { id: 'p1' });
    api.pickup('photo', S.ledge[0], S.ledge[1] + 1.0, S.ledge[2], { id: 'p2' });
    api.pickup('photo', BW12.BELLS.x, 7.6, BW12.BELLS.z, { id: 'p3' });
    api.pickup('water', 4, 0.9, 118); api.pickup('water', -30, 0.9, 40); api.pickup('water', 40, 0.9, 50); api.pickup('water', -8, 0.9, -44);
    api.pickup('bag:weed', 66, 0.9, -6);
    api.pickup('bag:molly', -48, 0.9, 30);
    // glow sticks: soft lines of light along the walk and up the art
    api.glowLine(1.2, 146, 1.2, 70, 18);
    api.glowLine(1.2, 60, 1.2, -36, 20);
    api.glowArc(1, 0.9, 112, -50, 0.9, 92, 2.5, 12);
    api.glowArc(2, 0.9, 98, 44, 0.9, 92, 2.5, 10);
    api.glowRing(BW12.BELLS.x, BW12.BELLS.z, 7.6, 12);
    api.glowLine(-42.5, 14, -25.5, 14, 12, 1.9);
    api.glowLine(-40, 26, -6, 30, 8);
    for (let i = 0; i < 7; i++) api.pickup('glowstick', S.cairnTop[i][0], S.cairnTop[i][1] + 0.9, S.cairnTop[i][2]);
    for (let k = 2; k < 34; k += 3) api.pickup('glowstick', S.stairStep[k][0], S.stairStep[k][1] + 0.9, S.stairStep[k][2]);
    api.glowRing(-64, -34, 7, 10);
    api.glowArc(-4, 0.9, -20, -56, 0.9, -32, 2, 9);
    api.glowArc(4, 0.9, -4, 54, 0.9, -12, 2, 9);
    api.glowRing(TC.x, TC.z, 24.5, 22);
    /* ---------------- markers ---------------- */
    api.marker('temple', TC.x, TC.z, 'Temple', { col: '#ffe0a8' });
    api.marker('bells', BW12.BELLS.x, BW12.BELLS.z, 'Bells', { col: '#ffd890' });
    api.marker('table', BW12.TABLE.x, BW12.TABLE.z, 'Table', { col: '#ffc8a0' });
    api.marker('stair', BW12.STAIR.x, BW12.STAIR.z, 'Stair', { col: '#c8b0ff' });
    api.marker('lanterns', 50, 92, 'Lanterns', { col: '#ffb0c8' });
    api.region('temple', TC.x, TC.z, 22);
    // the Sunrise Stair starts its mission when you reach its foot
    api.trigger({ x: BW12.STAIR.x, z: BW12.STAIR.z, r: 7, once: true, when: g2 => g2.missions.state('view') === 'available', onEnter: g2 => { g2.missions.start('view', true); g2.banner('A QUIET PLACE TO SEE', 'Climb the Sunrise Stair.', { col: '#c8b0ff' }); } });
    // interactables: write her name, pin the notes
    const wa = BW12.WRITE_A, wn = [Math.sin(wa), Math.cos(wa)], wp = BW12.pol(wa, BW12.RI * Math.cos(Math.PI / 9));
    S.board = { a: wa, n: wn, r: [Math.cos(wa), -Math.sin(wa)], c: [wp[0] + wn[0] * 0.115, 1.38, wp[1] + wn[1] * 0.115] };
    g.interactables = [
      { x: wp[0] + wn[0] * 1.1, z: wp[1] + wn[1] * 1.1, r: 2.4, label: 'WRITE', when: g2 => !g2.missions.isDone('name') && !g2.cine, fn: g2 => BW12.tryWrite(g2) },
      { x: BW12.NOTE_GIVE.x, z: BW12.NOTE_GIVE.z, r: 2.4, label: 'PIN NOTES', when: g2 => g2.missions.state('notes') === 'active' && g2.missions.get('notes').n >= 6, fn: g2 => BW12.pinNotes(g2) }
    ];
  },
  onStart(g) {
    const S = BW12.state;
    g.awardToken = id => BW1213.quietToken(g, id);
    g.tod = g.missions.isDone('hope') ? 1 : Math.min(0.8, BurnsSave.tokenCount(12) * 0.13);
    if (g.missions.isDone('carry')) BW12.placeBoat(g);
    if (g.missions.isDone('notes')) S.pinned.visible = true;
    if (BurnsSave.flag(12, 'wrote')) BW12.inkFull(BurnsSave.flag(12, 'wroteLayout') || 'row');
    if (!S.introDone) BW12.intro(g);
    else {
      g.banner(BurnsWorlds.label(12).toUpperCase() + ' · THE TEMPLE', g.missions.isDone('hope') ? 'The sun is up. She\'s out there.' : 'Walk out at dawn. Write her name.', { col: '#ffe0a8' });
      BW1213.after(S, 0.2, () => { if (g.missions.state('notes') === 'available') g.missions.start('notes', true); });
    }
  },
  onRespawn(g) { const p = g.player; p.animOverride = null; p.locked = false; },
  env(g, env) {
    const S = BW12.state;
    if (S && S.glowK) { env.emB += S.glowK * 0.3; }
  },
  update(g, dt) {
    const S = BW12.state, p = g.player;
    BW1213.tick(S, dt);
    BW1213.gateLabels(g);
    BW12.updateLamps(g, dt);
    BW12.updateBells(g, dt);
    BW12.updateCarry(g, dt);
    if (S.necklace.visible) {
      if (S.neckFollow) { const ch = p.ch, a = ch.bonePoint(BURNS_BONES.FARM_L, 0, -0.27, 0.05), b = ch.bonePoint(BURNS_BONES.FARM_R, 0, -0.27, 0.05); S.necklace.x = (a[0] + b[0]) / 2; S.necklace.y = (a[1] + b[1]) / 2 + 0.02; S.necklace.z = (a[2] + b[2]) / 2; S.necklace.yaw = p.yaw; S.necklace.pitch = -0.5; }
    }
    // dawn: tokens push the sun up
    const want = g.missions.isDone('hope') ? 1 : Math.min(0.8, BurnsSave.tokenCount(12) * 0.13);
    if (g.tod < want && g.todTarget === null) g.setTod(want, 0.02);
    // a little wind now and then
    S.windT -= dt; if (S.windT <= 0) { S.windT = 12 + Math.random() * 10; burnsSfx('wind', { vol: 0.12 }, 'dust'); }
    // the hope note glints once it's there to be found
    if (g.missions.state('hope') === 'active' && Math.random() < dt * 4) g.fx.glint(S.hopeAt.x, S.hopeAt.y + 0.1, S.hopeAt.z, '#ffe8b0');
  },
  drawSprites(g, R) { BW12.drawSprites(g, R); }
});

/* a quiet "just play this pose" behaviour (sitting, kneeling, writing, hugging) */
BurnsBehaviors.register('bw12still', {
  update(a, g, dt) {
    a.ch.play(a.def.anim || 'idle');
    a.vx = a.vz = 0;
    if (a.def.notes && Math.random() < dt * 0.8) g.fx.notes(a.x, a.y + 1.2, a.z);
  }
});
/* cutscenes move this actor themselves */
BurnsBehaviors.register('bw12cine', { update(a, g, dt) { } });
/* Wren: follows Brady while they carry the boat together, otherwise waits by it */
BurnsBehaviors.register('bw12carry', {
  update(a, g, dt) {
    const S = BW12.state, p = g.player, C = S.carry;
    if (C && C.on) {
      const d = a.distP(), dist = 2.3;
      if (d > 30) { a.x = p.x - Math.sin(p.yaw) * 2; a.z = p.z - Math.cos(p.yaw) * 2; a.y = p.y; }
      if (d > dist) { const sp = d > 8 ? 6.5 : d > 4 ? 4.5 : 2.6; a.moveTo(p.x, p.z, sp, dt, dist * 0.85); a.ch.play(d > 6 ? 'run' : 'bw1213_carry', { rate: 0.9 }); }
      else { a.moveTo(a.x, a.z, 0, dt); a.face(p.x, p.z, dt, 4); a.ch.play('bw1213_carryIdle'); }
      if (a.grounded && p.grounded && p.y > a.y + 1.2 && d < 4) { a.vy = 11; a.grounded = false; }
    } else {
      a.ch.play(a.def.anim || 'idle'); a.vx = a.vz = 0;
      if (a.distP() < 5 && !a.def.lookAway) a.face(g.player.x, g.player.z, dt, 2);
    }
    a.physics(dt);
  }
});

/* ---------------- builders ---------------- */
BW12.lampPost = function (api, x, z, H, lit) {
  const S = BW12.state;
  api.mesh(x, z, m => {
    m.color('#6a4a30'); m.roundCyl(0, 0, 0, 0.28, 0.16, 0.05); m.color('#7a5634'); m.limb(0, 0, 0, 0, H, 0, 0.085, 0.065);
    m.limb(0, H - 0.05, 0, 0.52, H + 0.12, 0, 0.04, 0.032); m.color('#2a2a2a'); m.limb(0.55, H + 0.1, 0, 0.55, H - 0.18, 0, 0.008, 0.008);
    BW1213.M.lantern(m, 0.55, H - 0.4, 0, 0.21, lit ? '#ffe2b0' : '#e8dcc8', lit ? 0.85 : 0.08);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.12, y0: 0, y1: H, camPass: true }] };
  });
  if (lit) S.lamps.push({ x: x + 0.55, y: H - 0.4, z, lit: true, k: 1 });
};
BW12.buildTemple = function (api, R, msgSub, S) {
  const TC = BW12.TC, RO = BW12.RO, RI = BW12.RI, deg = Math.PI / 180;
  const wood = '#cfa878', wood2 = '#b88a5a', wood3 = '#8a5a34', pale = '#e8d0a8';
  const carve = S.tx.carve, photos = S.tx.photos;
  const entrance = j => j === 0 || j === 5 || j === 10 || j === 15;
  const rib = (m, a) => { // one curved timber rib from the ground ring up to the crown ring
    let prev = null;
    for (let i = 0; i <= 5; i++) { const t = i / 5, r = RO - 5.4 * t * t, y = 9.3 * t, pt = [Math.sin(a) * r, y, Math.cos(a) * r]; if (prev) m.limb(prev[0], prev[1], prev[2], pt[0], pt[1], pt[2], 0.32 - 0.1 * (t - 0.2), 0.32 - 0.1 * t); prev = pt; }
  };
  // 1) ribs + crown ring
  api.mesh(TC.x, TC.z, m => {
    const cols = [];
    m.color(wood2).shine(1);
    for (let j = 0; j < 20; j++) { const a = (j * 18 - 9) * deg; rib(m, a); cols.push({ t: 'cyl', x: Math.sin(a) * RO, z: Math.cos(a) * RO, r: 0.36, y0: 0, y1: 3.4, camPass: true }); }
    m.color(wood3); m.push(); m.tf(0, 9.3, 0); m.torus(0, 0, 0, RO - 5.4, 0.3, { seg: 60, tseg: 8 }); m.pop();
    m.color(wood); m.push(); m.tf(0, 8.6, 0); m.torus(0, 0, 0, RO - 5.0, 0.16, { seg: 60, tseg: 6 }); m.pop();
    // little hanging lanterns along the crown ring
    for (let j = 0; j < 20; j++) { const a = j * 18 * deg, r = RO - 5.4; m.color('#3a2a1a'); m.limb(Math.sin(a) * r, 9.0, Math.cos(a) * r, Math.sin(a) * r, 8.2, Math.cos(a) * r, 0.01, 0.01); m.lo = true; BW1213.M.lantern(m, Math.sin(a) * r, 7.95, Math.cos(a) * r, 0.2, '#ffe2b0', 0.75); m.lo = false; }
    m.shine(0);
    return { cols, lights: [] };
  });
  for (let j = 0; j < 20; j++) { const a = j * 18 * deg, r = RO - 5.4; api.glow(TC.x + Math.sin(a) * r, 7.95, TC.z + Math.cos(a) * r, 0.9, '#ffd8a0'); }
  // 2) message walls + carved friezes between the ribs (the four gates stay open)
  api.mesh(TC.x, TC.z, m => {
    const cols = [], w = 5.62, h = 2.7, d = 0.18;
    for (let j = 0; j < 20; j++) {
      if (entrance(j)) continue;
      const a = j * 18 * deg, rc = RO * Math.cos(9 * deg);
      m.push(); m.tf(Math.sin(a) * rc, 0, Math.cos(a) * rc, a);
      m.color(pale); m.roundBox(0, 0.1 + h / 2, 0, w, h, d, 0.06);
      m.color('#ffffff'); m.decal(0, 0.1 + h / 2, d / 2 + 0.004, w - 0.2, h - 0.2, msgSub(j, 0.78));
      m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 0.1 + h / 2, d / 2 + 0.004, w - 0.2, h - 0.2, msgSub(j + 1, 0.78)); m.pop();
      m.color(wood); m.roundBox(0, 3.15, 0, w + 0.3, 0.55, 0.26, 0.08);
      m.color('#ffffff'); m.decal(0, 3.15, 0.135, w, 0.42, carve); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 3.15, 0.135, w, 0.42, carve); m.pop();
      m.color(wood3); m.roundBox(0, 0.05, 0, w + 0.2, 0.1, 0.3, 0.03);
      m.pop();
      cols.push({ t: 'box', x: Math.sin(a) * rc, z: Math.cos(a) * rc, hx: w / 2 + 0.1, hz: 0.14, y0: 0, y1: 3.45, yaw: a });
    }
    return { cols };
  });
  // 3) the four gates: carved lintels, medallions, wind chimes, a low threshold
  api.mesh(TC.x, TC.z, m => {
    const cols = [];
    for (const j of [0, 5, 10, 15]) {
      const a = j * 18 * deg, rc = RO * Math.cos(9 * deg);
      m.push(); m.tf(Math.sin(a) * rc, 0, Math.cos(a) * rc, a);
      m.color(wood3); let prev = null;
      for (let i = 0; i <= 8; i++) { const t = i / 8, x = lerp(-3.05, 3.05, t), y = 4.4 + Math.sin(t * Math.PI) * 0.9, pt = [x, y, 0]; if (prev) m.limb(prev[0], prev[1], 0, pt[0], pt[1], 0, 0.2, 0.2); prev = pt; }
      m.color(wood); m.roundBox(0, 4.1, 0, 6.2, 0.36, 0.3, 0.1); m.color('#ffffff'); m.decal(0, 4.1, 0.155, 5.9, 0.3, carve); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 4.1, 0.155, 5.9, 0.3, carve); m.pop();
      m.color(wood2); m.push(); m.tf(0, 5.05, 0, 0, Math.PI / 2, 0); m.roundCyl(0, -0.1, 0, 0.62, 0.2, 0.06); m.pop();
      m.color('#ffffff'); m.decal(0, 5.05, 0.105, 1.0, 1.0, BW1213.sub(carve, 0, 0, 0.25, 1)); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 5.05, 0.105, 1.0, 1.0, BW1213.sub(carve, 0.25, 0, 0.25, 1)); m.pop();
      m.color('#d8c8a0').shine(3); for (let k = 0; k < 6; k++) { const x = -1.2 + k * 0.48; m.limb(x, 3.9, 0, x, 3.9 - 0.4 - (k % 3) * 0.15, 0, 0.022, 0.022); } m.shine(0);
      m.color(wood3); m.roundBox(0, 0, 0, 5.4, 0.14, 1.4, 0.05);
      m.pop();
    }
    return { cols };
  });
  // 4) the sanctuary: nine posts, six message boards (one with a pale plank kept clear for writing), lattice, ring beam
  api.mesh(TC.x, TC.z, m => {
    const cols = [], ap = RI * Math.cos(20 * deg), side = 2 * RI * Math.sin(20 * deg);
    for (let k = 0; k < 9; k++) {
      const a = (20 + 40 * k) * deg, x = Math.sin(a) * RI, z = Math.cos(a) * RI;
      m.color(wood3).shine(1); m.roundCyl(x, 0, z, 0.58, 0.42, 0.12); m.color(wood2); m.limb(x, 0.3, z, x, 6.3, z, 0.36, 0.33); m.color(wood3); m.roundCyl(x, 6.0, z, 0.52, 0.34, 0.1); m.shine(0);
      cols.push({ t: 'cyl', x, z, r: 0.42, y0: 0, y1: 6.4, camPass: true });
    }
    for (let k = 0; k < 9; k++) {
      const c = 40 * k * deg, open = k === 0 || k === 3 || k === 6;
      m.push(); m.tf(Math.sin(c) * ap, 0, Math.cos(c) * ap, c);
      m.color(wood); m.roundBox(0, 6.42, 0, side + 0.3, 0.42, 0.34, 0.1);
      m.color('#ffffff'); m.decal(0, 6.42, 0.175, side, 0.34, carve); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 6.42, 0.175, side, 0.34, carve); m.pop();
      // lattice above the boards (and over the openings)
      m.color(wood2); for (let i = 0; i < 7; i++) { const x = -side / 2 + 0.55 + i * (side - 1.1) / 6; m.box(x, 4.5, 0, 0.1, open ? 3.0 : 3.4, 0.08); }
      m.box(0, open ? 3.05 : 2.85, 0, side - 0.6, 0.12, 0.1); m.box(0, 4.65, 0, side - 0.6, 0.08, 0.08);
      if (!open) {
        const w = side - 0.7;
        m.color(pale); m.roundBox(0, 1.45, 0, w, 2.6, 0.16, 0.05);
        const writing = Math.abs(c - BW12.WRITE_A) < 0.01;
        m.color('#ffffff'); m.decal(0, 1.45, 0.084, w - 0.15, 2.45, msgSub(k + 5, 0.66)); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 1.45, 0.084, w - 0.15, 2.45, msgSub(k + 7, 0.66)); m.pop();
        if (writing) { m.color('#f6e8cc'); m.roundBox(0, 1.38, 0.1, 2.5, 0.95, 0.04, 0.015); }
        cols.push({ t: 'box', x: Math.sin(c) * ap, z: Math.cos(c) * ap, hx: w / 2, hz: 0.1, y0: 0, y1: 2.9, yaw: c });
      }
      m.pop();
    }
    m.color(wood3); m.push(); m.tf(0, 6.65, 0); m.torus(0, 0, 0, RI - 0.3, 0.2, { seg: 36, tseg: 6 }); m.pop();
    return { cols };
  });
  // 5) the lattice lantern tower: six twisting tiers of slats and rings, then a teardrop crown
  api.mesh(TC.x, TC.z, m => {
    for (let i = 0; i < 6; i++) {
      const rb = 7.4 - i * 1.0, rt = rb - 0.9, y0 = 6.8 + i * 3.4, y1 = y0 + 3.4, n = 22 - 2 * i, tw = i * 0.13;
      m.color(i % 2 ? wood : wood2);
      for (let k = 0; k < n; k++) { const a = k / n * TAU + tw, b = a + 0.16; m.beam(Math.sin(a) * rb, y0, Math.cos(a) * rb, Math.sin(b) * rt, y1, Math.cos(b) * rt, 0.13, 0.09); }
      m.color(wood3); m.push(); m.tf(0, y0, 0); m.torus(0, 0, 0, rb, 0.11, { seg: 28, tseg: 5 }); m.pop();
      // tier lanterns
      for (let q = 0; q < 4; q++) { const a = q / 4 * TAU + tw + 0.4; m.lo = true; BW1213.M.lantern(m, Math.sin(a) * (rt + 0.1), y1 - 0.5, Math.cos(a) * (rt + 0.1), 0.18, '#ffe2b0', 0.8); m.lo = false; }
    }
    m.color(wood3); m.push(); m.tf(0, 27.2, 0); m.torus(0, 0, 0, 1.5, 0.12, { seg: 20, tseg: 5 }); m.pop();
    m.color(wood2);
    for (let k = 0; k < 8; k++) {
      const a = k / 8 * TAU; let prev = null;
      for (let i = 0; i <= 4; i++) { const t = i / 4, r = 1.5 * (1 - t) * (1 + 0.75 * Math.sin(t * Math.PI)), y = 27.2 + 6.2 * t, pt = [Math.sin(a) * r, y, Math.cos(a) * r]; if (prev) m.limb(prev[0], prev[1], prev[2], pt[0], pt[1], pt[2], 0.09, 0.07); prev = pt; }
    }
    m.color('#ffe8c0', 0.5); m.ball(0, 30.0, 0, 0.55); m.emissive(0);
    m.color(wood3); m.limb(0, 33.2, 0, 0, 35.0, 0, 0.08, 0.02);
    return { cols: [] };
  });
  for (let i = 0; i < 6; i++) { const rt = 7.4 - i * 1.0 - 0.9, y1 = 6.8 + i * 3.4 + 3.4, tw = i * 0.13; for (let q = 0; q < 4; q++) { const a = q / 4 * TAU + tw + 0.4; api.glow(TC.x + Math.sin(a) * (rt + 0.1), y1 - 0.5, TC.z + Math.cos(a) * (rt + 0.1), 0.8, '#ffd8a0'); } }
  api.glow(TC.x, 30.0, TC.z, 3.2, '#ffe0b0');
  // 6) the altar: three round steps, candles, a small lantern shrine and gentle offerings
  api.mesh(TC.x, TC.z, m => {
    m.color(wood2); m.roundCyl(0, 0, 0, 2.6, 0.32, 0.08); m.color(wood); m.roundCyl(0, 0.3, 0, 1.85, 0.32, 0.08); m.color(wood2); m.roundCyl(0, 0.6, 0, 1.1, 0.34, 0.08);
    m.color(wood3); m.push(); m.tf(0, 0.94, 0); m.lathe([[0.32, 0], [0.36, 0.08], [0.3, 0.9], [0.4, 1.05], [0.06, 1.35], [0, 1.4]], { seg: 9 }); m.pop();
    m.color('#ffe2b0', 0.85); m.ellipsoid(0, 1.45, 0, 0.18, 0.24, 0.18); m.emissive(0);
    const r = mulberry32(12), lights = [];
    m.lo = true;
    for (let i = 0; i < 26; i++) { const tier = i % 3, a = r() * TAU, rr = [2.25, 1.5, 0.82][tier], y = [0.32, 0.62, 0.94][tier]; const f = BW1213.M.candle(m, Math.sin(a) * rr, y, Math.cos(a) * rr, 0.045 + r() * 0.02, 0.12 + r() * 0.2, r.pick(['#f4ecd8', '#fff4e0', '#f0d8b0'])); if (i % 2 === 0) lights.push({ x: f[0], y: f[1] + 0.05, z: f[2], s: 0.45, c: '#ffcf80' }); }
    for (let i = 0; i < 14; i++) { const a = r() * TAU, rr = r.range(1.2, 2.4), y = rr > 1.85 ? 0.32 : 0.62; BW12.offering(m, Math.sin(a) * rr, y, Math.cos(a) * rr, a, r, photos); }
    m.lo = false;
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffc070', pool: 7, i: 0.5 });
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.6, y0: 0, y1: 0.32 }, { t: 'cyl', x: 0, z: 0, r: 1.85, y0: 0, y1: 0.62 }, { t: 'cyl', x: 0, z: 0, r: 1.1, y0: 0, y1: 0.94 }, { t: 'cyl', x: 0, z: 0, r: 0.4, y0: 0, y1: 2.3, camPass: true }], lights };
  });
  // 7) offerings along the inside of the walls and around the sanctuary
  for (let half = 0; half < 2; half++) api.mesh(TC.x, TC.z, m => {
    const r = mulberry32(40 + half);
    m.lo = true;
    for (let j = half * 10; j < half * 10 + 10; j++) {
      if (entrance(j)) continue;
      const a0 = j * 18 * deg;
      for (let q = 0; q < 6; q++) { const a = a0 + (r() - 0.5) * 15 * deg, rr = RO * Math.cos(9 * deg) - 0.55 - r() * 0.4; BW12.offering(m, Math.sin(a) * rr, 0, Math.cos(a) * rr, a + Math.PI, r, photos); }
    }
    for (let k = half * 5; k < Math.min(9, half * 5 + 5); k++) {
      if (k === 0 || k === 3 || k === 6) continue;
      const c = 40 * k * deg;
      for (let q = 0; q < 4; q++) { const a = c + (r() - 0.5) * 30 * deg, rr = RI * Math.cos(20 * deg) + 0.55 + r() * 0.3; if (Math.abs(a - BW12.WRITE_A) < 0.32 && rr < 9) continue; BW12.offering(m, Math.sin(a) * rr, 0, Math.cos(a) * rr, a, r, photos); }
    }
    m.lo = false;
    return { cols: [] };
  });
  // the note board inside the south gate (the storm-blown notes are pinned back here)
  const nb = BW12.NOTE_GIVE;
  api.mesh(nb.x, nb.z - 0.9, m => { m.color(wood3); m.limb(-0.8, 0, 0, -0.8, 2.1, 0, 0.06, 0.05); m.limb(0.8, 0, 0, 0.8, 2.1, 0, 0.06, 0.05); m.color('#c8a070'); m.roundBox(0, 1.5, 0, 1.9, 1.0, 0.08, 0.03); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.95, hz: 0.1, y0: 0, y1: 2.0, walk: false }] }; }, { yaw: 0.25 });
  S.pinned = api.mover(m => { m.color('#ffffff'); m.decal(0, 0, 0, 1.7, 0.85, S.tx.pinned); return { cols: [] }; });
  S.noteCard = api.mover(m => { m.color('#f4ead0'); m.roundBox(0, 0, -0.004, 0.43, 0.3, 0.006, 0.002); m.color('#ffffff'); m.decal(0, 0, 0.0005, 0.41, 0.283, S.tx.note); return { cols: [] }; });
  S.noteCard.visible = false;
  S.pinned.x = nb.x + Math.sin(0.25) * 0.05; S.pinned.y = 1.5; S.pinned.z = nb.z - 0.9 + Math.cos(0.25) * 0.05; S.pinned.yaw = 0.25; S.pinned.visible = false;
  api.sign('THE STORM TOOK SOME\nNOTES. PIN THEM HERE.', nb.x - 1.9, nb.z - 0.4, { yaw: 0.5, h: 0.8, y: 0.6, style: { bg: '#f8f0e0', fg: '#4a3a5a', size: 34, border: '#a89070', font: BW1213.HAND } });
  // the marker table at the gate (all used up overnight)
  api.mesh(6.5, TC.z + RO + 2.2, m => { m.color('#a07a50'); m.roundBox(0, 0.78, 0, 1.6, 0.08, 0.7, 0.03); for (const [x, z] of [[0.7, 0.28], [-0.7, 0.28], [0.7, -0.28], [-0.7, -0.28]]) m.limb(x, 0, z, x, 0.76, z, 0.035, 0.035); m.color('#2a2a30'); for (let i = 0; i < 5; i++) { m.push(); m.tf(-0.5 + i * 0.25, 0.86, (i % 2) * 0.1, i * 0.7, 0, Math.PI / 2); m.roundCyl(0, -0.07, 0, 0.018, 0.14, 0.005); m.pop(); } return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.8, hz: 0.35, y0: 0, y1: 0.82 }] }; });
  api.sign('MARKERS\n(all used up overnight)', 6.5, TC.z + RO + 3.1, { h: 0.7, y: 1.0, post: true, style: { bg: '#f8f0e0', fg: '#4a3a5a', size: 34, border: '#a89070', font: BW1213.HAND } });
  // light pools
  for (let k = 0; k < 9; k++) { const a = (40 * k) * deg; api.light(TC.x + Math.sin(a) * 13, TC.z + Math.cos(a) * 13, 6, '#ffd8a0', 0.22); }
  api.light(TC.x, TC.z, 10, '#ffc070', 0.35);
  /* ---------------- people at the Temple (quiet; no chatter) ---------------- */
  const sit = (x, z, yaw, seed, type, lines, anim, o) => api.npc(Object.assign({ type: type || 'burner', seed, x, z, yaw, behavior: 'bw12still', anim: anim || 'bw1213_floorsit', chatter: false, lines: lines || ['(They smile at you softly, and go back to the quiet.)'] }, o || {}));
  const P = BW12.pol;
  let q = P(196 * deg, 13.5); sit(q[0], q[1], 196 * deg + Math.PI, 401, 'burner', ['I come every year for my brother. He\'d have loved this sky.']);
  q = P(150 * deg, 12.5); sit(q[0], q[1], 150 * deg + Math.PI, 402, 'furcoat', ['First burn without my mom. She\'d have hated the dust. And loved everything else.']);
  q = P(250 * deg, 14.5); sit(q[0], q[1], 250 * deg, 403, 'burner', null, 'bw1213_kneel');
  q = P(300 * deg, 12.0); sit(q[0], q[1], 300 * deg + Math.PI, 404, 'tutu', ['Take your time. Nobody\'s in a hurry here.']);
  q = P(100 * deg, 15.5); sit(q[0], q[1], 100 * deg + Math.PI, 405, 'ledsuit', null);
  q = P(210 * deg, 4.2); sit(q[0], q[1], 210 * deg + Math.PI, 406, 'burner', ['(She\'s holding a photo against her chest. She nods at you.)'], 'bw1213_kneel');
  q = P(130 * deg, 4.3); sit(q[0], q[1], 130 * deg + Math.PI, 407, 'crusty', ['Twenty-six years I\'ve been coming out here. It never gets lighter. It gets... shared.']);
  q = P(272 * deg, 11.0); sit(q[0], q[1], 272 * deg + Math.PI, 408, 'burner', ['(She plays a few soft notes on a little thumb piano for you.)'], 'bw1213_floorsit', { notes: true, name: 'KALIMBA PLAYER' });
  q = P(166 * deg, 18.7); sit(q[0], q[1], 166 * deg, 409, 'burner', ['I wrote "thank you." Took me nine years to know who to say it to.'], 'bw1213_write');
  q = P(228 * deg, 18.7); sit(q[0], q[1], 228 * deg, 410, 'furcoat', null, 'bw1213_write');
  q = P(34 * deg, 16.5); sit(q[0], q[1], 34 * deg + 2.2, 411, 'burner', ['(They hold each other. You give them space.)'], 'bw1213_hug'); sit(q[0] + Math.sin(34 * deg + 2.2) * 0.75, q[1] + Math.cos(34 * deg + 2.2) * 0.75, 34 * deg + 2.2 + Math.PI, 412, 'tutu', null, 'bw1213_hug', { noTalk: true });
  api.npc({ id: 'sol', name: 'SOL, TEMPLE GUARDIAN', spec: Object.assign(BW1213.base(9, { face: 'friendly', skin: '#a8704c', skinSh: '#88502c', hair: { style: 'buzz', col: '#1a1410' }, top: { kind: 'button', col: '#f0e6d4' }, bottom: { kind: 'chinos', col: '#e0d0b8' }, shoes: { kind: 'sneakers', col: '#c8b8a0' }, acc: ['bracelets'] }), { key: 'bw12:sol' }),
    x: -3.4, z: TC.z + RO - 2.6, yaw: 0.2, behavior: 'idle', chatter: false,
    talk(g, a) { BW12.solTalk(g, a); } });
  // Wren (offering carrier) lives in the Lantern Garden until she walks with you
};
// a small generic offering at (x, y, z) in local space, facing yaw (photos, candles, flowers, hearts, letters, boots, a bear)
BW12.offering = function (m, x, y, z, yaw, r, photos) {
  const k = r.int(0, 8);
  m.push(); m.tf(x, y, z, yaw);
  switch (k) {
    case 0: case 1: { m.color(r.pick(['#5a3a2a', '#c8a070', '#2a2a30', '#f4f0e8'])); m.roundBox(0, 0.22, 0, 0.3, 0.38, 0.04, 0.02); m.color('#ffffff'); m.decal(0, 0.23, 0.022, 0.24, 0.3, BW1213.sub(photos, r.int(0, 3) * 0.25, 0, 0.25, 1)); m.push(); m.tf(0, 0.1, -0.06, 0, -0.3, 0); m.box(0, 0, 0, 0.04, 0.2, 0.02); m.pop(); break; }
    case 2: { const f = BW1213.M.candle(m, 0, 0, 0, 0.05, 0.16 + r() * 0.12, '#f4ecd8'); void f; break; }
    case 3: { m.color('#7aa868'); for (let i = 0; i < 4; i++) m.limb(0, 0, 0, (i - 1.5) * 0.04, 0.32, (i % 2) * 0.04, 0.008, 0.008); for (let i = 0; i < 4; i++) { m.color(r.pick(['#ff7ab0', '#ffe24a', '#ffffff', '#ff9a5a', '#c8a0ff'])); m.ball((i - 1.5) * 0.04, 0.34, (i % 2) * 0.04, 0.045); } m.color('#c8d8e8').shine(3); m.roundCyl(0, 0, 0, 0.06, 0.16, 0.02); m.shine(0); break; }
    case 4: { m.color(r.pick(['#c83a4a', '#e85a8a', '#b88a5a'])); m.push(); m.tf(0, 0.16, 0); m.extrude(BW1213.M.heartPts(0.15), 0.05); m.pop(); break; }
    case 5: { m.color('#fbf6e8'); m.push(); m.tf(0, 0.012, 0, r() * 0.6, -Math.PI / 2 + 0.05); m.roundBox(0, 0, 0, 0.24, 0.32, 0.01, 0.004); m.pop(); m.color('#c83a3a'); m.ball(0, 0.03, 0, 0.025); break; }
    case 6: { m.color(r.pick(['#6a4a30', '#3a2a24', '#8a6a4a'])); for (const sx of [-0.08, 0.08]) { m.roundBox(sx, 0.06, 0.04, 0.12, 0.12, 0.3, 0.04); m.roundBox(sx, 0.2, -0.06, 0.11, 0.24, 0.12, 0.04); } break; }
    case 7: { const c = r.pick(['#c89a6a', '#f4e8d8', '#a8784a']); m.color(c); m.ball(0, 0.14, 0, 0.13); m.ball(0, 0.34, 0, 0.1); m.ball(0.07, 0.42, 0, 0.04); m.ball(-0.07, 0.42, 0, 0.04); m.color('#2a1a14'); m.ball(0, 0.33, 0.09, 0.015); break; }
    default: { m.color(r.pick(['#ff7ab0', '#38c8ff', '#ffe24a', '#7aff5a'])); m.push(); m.tf(0, 0.02, 0, 0, Math.PI / 2 - 0.1); m.torus(0, 0, 0, 0.11, 0.015); m.pop(); m.color('#f4f0e8'); m.roundBox(0, 0.1, -0.05, 0.16, 0.2, 0.02, 0.01); }
  }
  m.pop();
};
BW12.buildBells = function (api, R, S) {
  const B = BW12.BELLS; S.bellTop = [];
  api.mesh(B.x, B.z, m => {
    const cols = [];
    for (let i = 0; i < 7; i++) {
      const a = 0.6 + i * 0.8, rr = 3.0 + i * 0.3, h = 1.0 + i * 0.72, x = Math.sin(a) * rr, z = Math.cos(a) * rr;
      m.color('#8a6440').shine(1); m.roundCyl(x, 0, z, 0.36, h - 0.18, 0.1); m.color('#6a4428'); m.roundCyl(x, h - 0.2, z, 0.64, 0.2, 0.08); m.shine(0);
      const ox = Math.sin(a) * 0.72, oz = Math.cos(a) * 0.72;
      m.color('#4a3020'); m.limb(x + ox * 0.6, h - 0.15, z + oz * 0.6, x + ox * 1.05, h - 0.15, z + oz * 1.05, 0.03, 0.03);
      BW1213.M.bell(m, x + ox * 1.05, h - 0.75, z + oz * 1.05, 0.26 + i * 0.015, ['#c89a3a', '#d8aa4a', '#b88a2a'][i % 3]);
      cols.push({ t: 'cyl', x, z, r: 0.64, y0: 0, y1: h, bw12bell: i });
      S.bellTop.push([B.x + x, h, B.z + z]);
    }
    m.color('#7a5634'); m.limb(0, 0, 0, 0, 6.4, 0, 0.22, 0.16); m.color('#6a4428'); m.roundCyl(0, 6.4, 0, 1.05, 0.22, 0.08);
    m.color('#4a3020'); m.limb(0, 6.3, 0.9, 0, 6.3, 1.25, 0.03, 0.03);
    cols.push({ t: 'cyl', x: 0, z: 0, r: 0.26, y0: 0, y1: 6.4, camPass: true }, { t: 'cyl', x: 0, z: 0, r: 1.05, y0: 6.4, y1: 6.62 });
    return { cols };
  });
  BW12.lampPostAt(api, B.x, 5.2, B.z + 1.25, 1.15);
  api.sign('THE BELL GARDEN\nring softly', B.x + 6.5, B.z + 6.5, { yaw: 0.8, h: 0.8, style: { bg: '#f8f0e0', fg: '#4a3a5a', size: 36, border: '#a89070', font: BW1213.HAND } });
  api.light(B.x, B.z, 9, '#ffe0b0', 0.25);
};
// a lit lantern hanging at an exact spot (no post): the Bell Garden's centre lamp
BW12.lampPostAt = function (api, x, y, z, cord) {
  const S = BW12.state, lit = !BurnsSave.hasToken(12, 'lamps');
  api.mesh(x, z, m => { m.color('#2a2a2a'); m.limb(0, 0.3 + (cord || 0.12), 0, 0, 0.3, 0, 0.008, 0.008); BW1213.M.lantern(m, 0, 0, 0, 0.21, lit ? '#ffe2b0' : '#e8dcc8', lit ? 0.85 : 0.08); return { cols: [] }; }, { y });
  if (lit) S.lamps.push({ x, y, z, lit: true, k: 1 });
};
BW12.buildLanterns = function (api, R, S) {
  const r = mulberry32(61);
  api.mesh(50, 92, m => {
    const lights = [];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU + r() * 0.3, rr = 4 + r() * 3.5, x = Math.sin(a) * rr, z = Math.cos(a) * rr, h = 2.2 + r() * 0.8;
      m.color('#6a4a30'); m.limb(x, 0, z, x, h + 0.4, z, 0.05, 0.04); m.limb(x, h + 0.35, z, x + 0.35, h + 0.45, z, 0.025, 0.02);
      BW1213.M.lantern(m, x + 0.36, h, z, 0.22 + r() * 0.08, r.pick(['#ffd0d8', '#ffe2b0', '#d8d0ff', '#ffe8c8']), 0.55);
      lights.push({ x: x + 0.36, y: h, z, s: 1.1, c: '#ffd8b0' });
    }
    m.color('#8a4a3a'); m.roundBox(-2, 0.02, -4.5, 2.4, 0.04, 1.6, 0.02);
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffd0b0', pool: 9, i: 0.3 });
    return { cols: [], lights };
  });
  api.sign('THE LANTERN GARDEN', 56.5, 99, { yaw: -0.6, h: 0.75, style: { bg: '#f8f0e0', fg: '#4a3a5a', size: 36, border: '#a89070', font: BW1213.HAND } });
  // Wren + her grandfather's boat
  S.boat = api.mover(m => {
    m.color('#8a5a32').shine(1); m.ellipsoid(0, 0.2, 0, 0.32, 0.22, 0.86, { phi0: Math.PI / 2, phi1: Math.PI });
    m.color('#a87a4a'); m.roundBox(0, 0.19, 0, 0.56, 0.05, 1.5, 0.02);
    m.color('#5a3a20'); m.roundBox(0, 0.26, -0.55, 0.42, 0.1, 0.06, 0.02);
    m.color('#6a4426'); m.limb(0, 0.2, 0.12, 0, 1.28, 0.12, 0.025, 0.02);
    m.color('#f4ecd8'); m.push(); m.tf(0, 0.3, 0.1, Math.PI / 2); m.extrude([[0, 0], [0.62, 0], [0, 0.92]], 0.012); m.pop();
    m.color('#c83a4a'); m.push(); m.tf(0.012, 0.62, -0.12, Math.PI / 2); m.extrude(BW1213.M.heartPts(0.07), 0.02); m.pop();
    m.color('#ffd890', 0.9); m.ball(0, 0.3, 0.78, 0.05); m.emissive(0); m.shine(0);
    return { cols: [], lights: [{ x: 0, y: 0.3, z: 0.8, s: 0.5, c: '#ffd890' }] };
  });
  S.boatHome = { x: 47.6, z: 87.6, yaw: 0.6 };
  S.boat.x = S.boatHome.x; S.boat.y = 0; S.boat.z = S.boatHome.z; S.boat.yaw = S.boatHome.yaw;
  api.npc({ id: 'wren', name: 'WREN', spec: Object.assign(BW1213.base(12, { face: 'lashes', skin: '#f0c8a8', skinSh: '#d0a888', hair: { style: 'pony', col: '#a8582a', hi: '#d88a4a' }, top: { kind: 'hoodie', col: '#5a7a8a' }, bottom: { kind: 'cargo', col: '#6a6a54' }, shoes: { kind: 'boots', col: '#6a4a30' }, acc: ['bracelets'] }), { key: 'bw12:wren' }),
    x: 49.2, z: 86.4, yaw: -2.6, behavior: 'bw12carry', anim: 'bw1213_kneel', chatter: false,
    talk(g, a) {
      const st = g.missions.state('carry');
      if (st === 'available') g.say(a, ['Morning. Would you... help me carry this?', 'It\'s my grandpa\'s. He built boats his whole life. I promised him I\'d bring his last one to the Temple.', 'It\'s heavier than it looks. Most things are, out here.', { who: 'brady', text: 'Of course. I\'ll take the front.' }], () => g.missions.start('carry'));
      else if (st === 'active') g.say(a, ['Slow is fine. He was never in a hurry either.']);
      else g.say(a, ['I\'m going to stay with him a while. Thank you for walking with me.']);
    } });
  // cairns (stacked stones) rising toward the Lantern Tree
  S.cairnTop = [];
  api.mesh(64, 74, m => {
    const cols = [], rr = mulberry32(19);
    for (let i = 0; i < 7; i++) {
      const t = i / 6, x = lerp(-7.5, 7.0, t) + Math.sin(t * Math.PI) * 2.2, z = lerp(8.5, -8.6, t) + Math.sin(t * Math.PI) * 1.6, top = 0.7 * (i + 1);
      const y = BW1213.M.cairn(m, x, z, top, rr);
      cols.push({ t: 'cyl', x, z, r: 0.9, y0: 0, y1: y });
      S.cairnTop.push([64 + x, y, 74 + z]);
    }
    return { cols };
  });
  // the Lantern Tree
  const T = BW12.TREE;
  api.mesh(T.x, T.z, m => {
    m.color('#6a4a30').shine(1); m.limb(0, 0, 0, 0, 5.5, 0, 0.48, 0.3);
    const rr = mulberry32(23), lights = [];
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3, y0 = 3.4 + rr() * 1.6, len = 2.0 + rr() * 1.4, x1 = Math.sin(a) * len, z1 = Math.cos(a) * len, y1 = y0 + 0.8 + rr() * 1.4; m.color('#6a4a30'); m.limb(0, y0, 0, x1, y1, z1, 0.16, 0.06); m.color('#2a2a2a'); m.limb(x1, y1, z1, x1, y1 - 0.5, z1, 0.008, 0.008); BW1213.M.lantern(m, x1, y1 - 0.75, z1, 0.22, rr.pick(['#ffd0d8', '#ffe2b0', '#d8d0ff']), 0.6); lights.push({ x: x1, y: y1 - 0.75, z: z1, s: 1.0, c: '#ffd8b0' }); }
    m.color('#7a5634'); m.roundCyl(0, 5.4, 0, 1.15, 0.24, 0.08); m.shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.45, y0: 0, y1: 5.4, camPass: true }, { t: 'cyl', x: 0, z: 0, r: 1.15, y0: 5.4, y1: 5.64 }], lights };
  });
  api.light(T.x, T.z, 8, '#ffd0b0', 0.25);
};
BW12.buildTable = function (api, R, S) {
  const T = BW12.TABLE;
  api.mesh(T.x, T.z, m => {
    const cols = [], rr = mulberry32(51), lights = [];
    m.color('#a87a50').shine(1); m.roundBox(0, 0.86, 0, 18, 0.12, 1.3, 0.05); m.color('#f4ece0'); m.roundBox(0, 0.93, 0, 17.6, 0.02, 1.1, 0.008); m.shine(0);
    m.color('#7a5634'); for (let i = 0; i < 6; i++) { const x = -8.6 + i * 3.44; for (const z of [-0.5, 0.5]) m.limb(x, 0, z, x, 0.82, z, 0.06, 0.05); }
    cols.push({ t: 'box', x: 0, z: 0, hx: 9, hz: 0.65, y0: 0, y1: 0.92 });
    m.lo = true;
    for (let i = 0; i < 9; i++) for (const sd of [-1, 1]) {
      const x = -8 + i * 2, z = sd * 1.05;
      m.push(); m.tf(x + (rr() - 0.5) * 0.2, 0, z, sd > 0 ? Math.PI : 0); const cl = BW1213.M.chair(m, rr.pick(['#c8a070', '#8ab0c8', '#e8b8c8', '#a8c8a0', '#f0e0b0', '#9a7a5a'])); m.pop();
      cols.push(Object.assign({}, cl[0], { x: x, z: z + sd * 0.0 }));
      // place setting
      m.push(); m.tf(x, 0, sd * 0.32); m.color('#f8f4ec'); m.lathe([[0, 0.94], [0.17, 0.95], [0.19, 0.975], [0, 0.96]], { seg: 10 }); m.color(rr.pick(['#c8d8e8', '#f4d8c8', '#e8e8f0'])); m.roundCyl(0.25, 0.94, 0.05, 0.04, 0.1, 0.01); m.pop();
    }
    for (let i = 0; i < 6; i++) { const f = BW1213.M.candle(m, -7.5 + i * 3, 0.95, (rr() - 0.5) * 0.2, 0.05, 0.2, '#f4ecd8'); lights.push({ x: f[0], y: f[1] + 0.05, z: f[2], s: 0.45, c: '#ffcf80' }); }
    for (let i = 0; i < 4; i++) BW12.offering(m, -6.2 + i * 4.1, 0.95, 0.15, 0, rr, S.tx.photos);
    m.lo = false;
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffc890', pool: 9, i: 0.3 });
    return { cols, lights };
  });
  api.sign('FOR EVERYONE WHO\nCOULDN\'T COME.\nSIT AWHILE.', T.x, T.z + 5.5, { h: 1.1, style: { bg: '#f8f0e0', fg: '#4a3a5a', size: 34, border: '#a89070', font: BW1213.HAND } });
  BW12.lampPost(api, T.x - 10.6, T.z, 4.8, !BurnsSave.hasToken(12, 'lamps'));
  api.npc({ type: 'burner', seed: 520, name: 'SOMEONE AT THE TABLE', x: T.x + 4, z: T.z + 1.05, yaw: Math.PI, behavior: 'bw12still', anim: 'sit', chatter: false, lines: ['I set a place for my dad. He always took the seat facing the sunrise.'] });
  api.npc({ type: 'crusty', seed: 521, x: T.x - 3.9, z: T.z - 1.05, yaw: 0, behavior: 'bw12still', anim: 'sit', chatter: false, lines: ['(He raises his cup to the empty chair beside him.)'] });
};
BW12.buildStair = function (api, R, S) {
  const T = BW12.STAIR; S.stairStep = [];
  api.mesh(T.x, T.z, m => {
    const cols = [];
    m.color('#7a5634').shine(1); m.roundCyl(0, 0, 0, 0.42, 16.0, 0.1);
    for (let k = 0; k < 34; k++) {
      const th = k * 0.27, y = 0.45 * (k + 1), x = Math.sin(th) * 1.55, z = Math.cos(th) * 1.55, yaw = th - Math.PI / 2;
      m.color(k % 2 ? '#c8a070' : '#b88a5a'); m.push(); m.tf(x, y - 0.09, z, yaw); m.roundBox(0, 0, 0, 2.3, 0.18, 0.82, 0.05); m.pop();
      cols.push({ t: 'box', x, z, hx: 1.15, hz: 0.41, y0: y - 0.18, y1: y, yaw });
      S.stairStep.push([T.x + Math.sin(th) * 1.9, y, T.z + Math.cos(th) * 1.9]);
      if (k % 4 === 0) { m.color('#6a4428'); m.limb(Math.sin(th) * 2.6, y, Math.cos(th) * 2.6, Math.sin(th) * 2.6, y + 1.0, Math.cos(th) * 2.6, 0.04, 0.035); }
    }
    // the top platform, railing, a bench facing the Temple
    m.color('#a87a50'); m.roundCyl(0, 15.3, 0, 2.9, 0.26, 0.08);
    m.color('#6a4428'); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; m.limb(Math.sin(a) * 2.75, 15.5, Math.cos(a) * 2.75, Math.sin(a) * 2.75, 16.5, Math.cos(a) * 2.75, 0.04, 0.04); }
    m.push(); m.tf(0, 16.5, 0); m.torus(0, 0, 0, 2.75, 0.05, { seg: 32, tseg: 5 }); m.pop();
    for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * TAU; cols.push({ t: 'box', x: Math.sin(a) * 2.78, z: Math.cos(a) * 2.78, hx: 0.75, hz: 0.06, y0: 15.5, y1: 16.6, yaw: a, walk: false, camPass: true }); }
    m.push(); m.tf(-0.8, 15.56, -1.2, Math.PI + 1.0); BW1213.M.bench(m, 1.8, '#9a7a5a'); m.pop();
    cols.push({ t: 'cyl', x: 0, z: 0, r: 2.9, y0: 15.3, y1: 15.56 }, { t: 'cyl', x: 0, z: 0, r: 0.42, y0: 0, y1: 15.3 });
    // a lantern bracket hanging off the side (a quiet ledge with a photo)
    const la = 26 * 0.27 + 0.9, lx = Math.sin(la) * 4.1, lz = Math.cos(la) * 4.1;
    m.color('#6a4428'); m.limb(Math.sin(la) * 0.4, 12.2, Math.cos(la) * 0.4, lx, 12.0, lz, 0.05, 0.05); m.color('#a87a50'); m.roundCyl(lx, 11.75, lz, 0.75, 0.2, 0.06);
    cols.push({ t: 'cyl', x: lx, z: lz, r: 0.75, y0: 11.75, y1: 11.95 });
    S.ledge = [T.x + lx, 11.95, T.z + lz];
    m.shine(0);
    return { cols, lights: [{ x: 0, y: 16.0, z: 0, s: 0, c: '#ffd0a0', pool: 5, i: 0.2 }] };
  });
  api.sign('THE SUNRISE STAIR', T.x + 3.6, T.z + 3.4, { yaw: 0.7, h: 0.75, style: { bg: '#f8f0e0', fg: '#4a3a5a', size: 36, border: '#a89070', font: BW1213.HAND } });
};

/* ---------------- the intro: dawn after the storm ---------------- */
BW12.intro = function (g) {
  const S = BW12.state, p = g.player, C = BW12.CAMP, J = g.actor('juniper');
  const sitAt = { x: C.x, z: C.z };
  p.teleport(sitAt.x, 0, sitAt.z, Math.PI - 0.15); p.locked = true; p.animOverride = 'bw1213_floorsit';
  S.necklace.visible = true; S.neckFollow = true;
  if (J) { J.x = C.x + 9; J.z = C.z + 4; J.yaw = -2.4; J.setBehavior('bw12cine'); J.ch.play('idle'); }
  const camA = { x: C.x + 14, y: 3.2, z: C.z + 14, tx: C.x - 4, ty: 3, tz: C.z - 60, fov: 0.95 };
  const camB = { x: C.x + 1.6, y: 1.25, z: C.z - 2.2, tx: C.x, ty: 0.75, tz: C.z + 0.2, fov: 0.85 };
  const camC = { x: C.x + 4.2, y: 1.9, z: C.z + 3.2, tx: C.x + 1.4, ty: 0.9, tz: C.z - 0.4, fov: 0.9 };
  const camD = { x: C.x - 1.5, y: 2.2, z: C.z + 5, tx: 0, ty: 12, tz: BW12.TC.z, fov: 0.75 };
  g.cutscene([
    { music: 'w9' },
    { cam: camA },
    { banner: [BurnsWorlds.label(12).toUpperCase(), 'THE TEMPLE · DAWN', { col: '#ffe0a8', big: true, dur: 3.4 }] },
    { wait: 1.2 },
    { cam: { from: camA, to: camB, dur: 4.2 } },
    { say: ['brady', ['The storm\'s gone.', '...So is she.']] },
    { say: ['brady', ['All I found was her necklace. Half buried in the dust. Still blinking.']] },
    { cam: camC },
    { move: { actor: 'juniper', x: C.x + 2.6, z: C.z + 1.4, speed: 1.3 } },
    { say: [J, ['Rough night, sweetheart?']] },
    { say: ['brady', ['I lost someone. In the storm. This is all that\'s left of her.']] },
    { say: [J, ['Oh, honey.', 'When we lose someone out here, we walk out to the Temple, and we write their name on the wood.', 'On the last night it burns, and the fire carries what we can\'t.']] },
    { say: ['brady', ['I don\'t even know if she\'s... I don\'t know anything.']] },
    { say: [J, ['Then write that. The Temple holds the not-knowing, too.', 'Here. Water first. Always water first.']] },
    { do: g2 => { p.heal(p.maxHydration); g2.fx.burst(p.x, p.y + 1.2, p.z, 'drop', 8, '#5ad0ff'); burnsSfx('hydrate', { vol: 0.5 }, 'powerup'); } },
    { say: [J, ['And if you see notes blowing around out there... the storm tore some right off the Temple walls. Carry them home with you?']] },
    { say: ['brady', ['I will.']] },
    { cam: { from: camC, to: camD, dur: 4.5 } },
    { do: g2 => { BurnsSave.flag(12, 'intro', true); S.introDone = true; S.necklace.visible = false; S.neckFollow = false; p.locked = false; p.animOverride = null; p.teleport(C.x - 1, 0, C.z - 1.5, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; const j = g2.actor('juniper'); if (j) { j.x = C.x + 3.4; j.z = C.z - 1.8; j.yaw = -2.2; j.setBehavior('bw12still'); } } },
    { do: g2 => { if (g2.missions.state('notes') === 'available') g2.missions.start('notes', true); } },
    { banner: ['THE TEMPLE', 'Walk out at dawn. Write her name.', { col: '#ffe0a8' }] }
  ], null);
};

/* ---------------- lamps at dawn ---------------- */
BW12.updateLamps = function (g, dt) {
  const S = BW12.state, p = g.player;
  for (const L of S.lamps) {
    if (!L.lit) { L.k = Math.max(0, L.k - dt * 1.6); continue; }
    if (g.missions.state('lamps') !== 'active') continue;
    if (Math.hypot(p.x - L.x, p.z - L.z) < 1.15 && Math.abs(p.y + 0.95 - L.y) < 1.15) {
      L.lit = false;
      const m = g.missions.get('lamps'); m.n++;
      burnsSfx('pick', { pitch: 0.62, vol: 0.45 }); g.fx.smoke(L.x, L.y + 0.2, L.z, 6, '#f0e8e0'); g.fx.glint(L.x, L.y, L.z, '#ffe0a0');
      if (m.n >= 5) g.banner('ALL FIVE ARE OUT', 'Go back to Ollie on the lamp line.', { col: '#ffe0a8', small: true });
      else g.toast(['Goodnight, little light.', 'Rest now.', 'Thank you for the night.', 'Sleep well.'][m.n % 4] + `  ${m.n}/5`);
    }
  }
};
/* ---------------- the Bell Garden ---------------- */
BW12.updateBells = function (g, dt) {
  const S = BW12.state, p = g.player, c = p.grounded ? p.groundCol : null;
  const i = c && c.bw12bell !== undefined ? c.bw12bell : -1;
  if (i >= 0 && S.lastBell !== i) {
    S.lastBell = i;
    const pitch = [1, 1.12, 1.26, 1.5, 1.68, 2, 2.24][i];
    burnsSfx('pick', { pitch: pitch * 0.5, vol: 0.5 });
    const t = S.bellTop[i]; g.fx.ring(t[0], t[1] + 0.05, t[2], 1.4, '#ffe0a0', 0.6); g.fx.notes(t[0], t[1] + 1.6, t[2]);
    if (!S.rung[i]) { S.rung[i] = true; if (Object.keys(S.rung).length === 7 && !S.bellsGift) { S.bellsGift = true; g.addGlow(15); g.banner('THE BELL GARDEN HUMS', '+15 glow sticks', { col: '#ffd890', small: true }); for (const q of S.bellTop) g.fx.notes(q[0], q[1] + 1.4, q[2]); } }
  } else if (i < 0 && p.grounded) S.lastBell = -1;
};
/* ---------------- carried together (Wren's boat) ---------------- */
BW12.carryStart = function (g) {
  const S = BW12.state, w = g.actor('wren');
  S.carry = { on: true };
  if (w) { w.def.anim = 'idle'; w.def.noTalk = true; w.setBehavior('bw12carry'); }
  g.bossSay(null, 'Carry it together: Wren follows your lead', 3);
};
BW12.updateCarry = function (g, dt) {
  const S = BW12.state, C = S.carry, p = g.player, w = g.actor('wren');
  if (!C || !C.on || !w) return;
  const dx = p.x - w.x, dz = p.z - w.z, d = Math.hypot(dx, dz), b = S.boat;
  if (d < 4.6 && Math.abs(p.y - w.y) < 1.2) {
    const ux = dx / (d || 1), uz = dz / (d || 1);
    const ax = p.x - ux * 0.38, az = p.z - uz * 0.38, bx = w.x + ux * 0.38, bz = w.z + uz * 0.38;
    b.x = (ax + bx) / 2; b.z = (az + bz) / 2; b.y = Math.min(p.y, w.y) + 0.72; b.yaw = Math.atan2(ux, uz); b.pitch = (p.y - w.y) * -0.25;
    if (p.grounded && !g.cine) p.animOverride = Math.hypot(p.vx, p.vz) > 0.6 ? 'bw1213_carry' : 'bw1213_carryIdle';
    else if (!g.cine) p.animOverride = null;
  } else {
    b.x = w.x + Math.sin(w.yaw) * 0.75; b.z = w.z + Math.cos(w.yaw) * 0.75; b.y = w.y + 0.72; b.yaw = w.yaw + Math.PI / 2; b.pitch = 0;
    if (!g.cine) p.animOverride = null;
  }
};
BW12.carryDone = function (g) {
  const S = BW12.state, p = g.player, w = g.actor('wren');
  if (S.carry) S.carry.on = false;
  if (w) w.def.noTalk = false;
  p.animOverride = null;
  const O = BW12.OFFER;
  g.cutscene([
    { do: g2 => { p.teleport(O.x - 1.6, 0, O.z + 1.4, 2.3); if (w) { w.x = O.x + 1.0; w.z = O.z + 1.1; w.yaw = -2.6; w.def.anim = 'bw1213_kneel'; w.def.lookAway = true; w.setBehavior('bw12carry'); } BW12.placeBoat(g2); } },
    { cam: { x: O.x - 3.2, y: 1.8, z: O.z + 4.2, tx: O.x, ty: 0.6, tz: O.z, fov: 0.85 } },
    { wait: 0.8 },
    { say: [w, ['He used to say every boat is a promise to come back.', '...This one doesn\'t have to keep it.']] },
    { wait: 0.6 },
    { say: [w, ['Thank you. Whoever you\'re carrying today, I hope the wood holds them gently.']] }
  ], () => {});
};
BW12.placeBoat = function (g) {
  const S = BW12.state, O = BW12.OFFER, b = S.boat;
  b.x = O.x; b.y = 0.02; b.z = O.z; b.yaw = 2.2; b.pitch = 0;
  const w = g.actor('wren');
  if (w && g.missions.isDone('carry') && !S.carry) { w.x = O.x + 1.0; w.z = O.z + 1.1; w.yaw = -2.6; w.def.anim = 'bw1213_kneel'; w.def.lookAway = true; }
};
/* ---------------- the Sunrise Stair ---------------- */
BW12.viewDone = function (g) {
  const p = g.player, T = BW12.STAIR, TC = BW12.TC;
  const bx = T.x - 0.8 + Math.sin(Math.PI + 1.0) * 0.1, bz = T.z - 1.2;
  g.cutscene([
    { do: g2 => { p.teleport(bx, 15.56 + 0.05, bz, Math.atan2(TC.x - T.x, TC.z - T.z)); p.animOverride = 'sit'; } },
    { cam: { x: T.x + 2.6, y: 17.6, z: T.z + 2.8, tx: TC.x, ty: 8, tz: TC.z, fov: 0.8 } },
    { wait: 1.4 },
    { say: ['brady', ['She\'d have loved this.', 'She always made me get up for the sunrise. I always complained. She was always right.']] },
    { cam: { from: { x: T.x + 2.6, y: 17.6, z: T.z + 2.8, tx: TC.x, ty: 8, tz: TC.z, fov: 0.8 }, to: { x: T.x - 1.0, y: 16.8, z: T.z + 0.6, tx: TC.x - 10, ty: 6, tz: TC.z - 40, fov: 0.7 }, dur: 3.5 } },
    { do: g2 => { p.animOverride = null; } }
  ], () => { p.animOverride = null; });
};
/* ---------------- notes pinned back ---------------- */
BW12.pinNotes = function (g) {
  const S = BW12.state, p = g.player, sol = g.actor('sol');
  p.yaw = Math.atan2(BW12.NOTE_GIVE.x - p.x, BW12.NOTE_GIVE.z - 0.9 - p.z);
  p.animOverride = 'bw1213_write';
  BW1213.after(S, 1.2, () => { p.animOverride = null; S.pinned.visible = true; burnsSfx('gift', { vol: 0.5 }, 'pick'); g.fx.glint(S.pinned.x, 1.5, S.pinned.z, '#ffe8b0'); g.missions.complete('notes'); if (sol) g.say(sol, ['Every one of them home. Thank you. Somebody\'s goodbye almost blew away.']); });
};
BW12.solTalk = function (g, a) {
  const st = g.missions.state('notes'), nm = g.missions.get('notes');
  if (g.missions.isDone('hope')) { g.say(a, ['Looks like that one\'s still writing her own story.', 'Go find her.']); return; }
  if (g.missions.isDone('name')) { g.say(a, ['She\'s part of this place now. Whatever happens next.']); return; }
  if (st === 'active' && nm.n >= 6) { g.say(a, ['You found them. Pin them back up on the board by the gate, would you?']); return; }
  if (!g.flag('marker')) { g.say(a, ['Welcome. Stay as long as you need.', 'The markers ran dry overnight. The storm kept people writing until dawn.', 'Ollie, the lamp lighter, always carries a spare. Out on the lamp line.']); return; }
  g.say(a, ['Anyone can write here. Names, wishes, goodbyes, thank-yous.', 'There\'s a pale plank on the sanctuary wall, on the sunrise side. It\'s been waiting for someone.']);
};

/* ---------------- her name: real tracing on the wood ---------------- */
BW12.tryWrite = function (g) {
  const S = BW12.state, p = g.player, sol = g.actor('sol');
  if (!g.flag('marker') && !g.missions.isDone('lamps')) { p.say('I don\'t have anything to write with.', 2); if (sol) sol.say('Ollie the lamp lighter has a spare marker!', 3); return; }
  if (g.missions.state('name') === 'available') g.missions.start('name', true);
  BW12.writeScene(g);
};
// build the glyph strokes in world space on the pale plank. layout: 'row' or 'two'
BW12.layoutName = function (layout) {
  const S = BW12.state, B = S.board, L = layout === 'two' ? 0.27 : 0.31, gap = 0.2;
  const word = layout === 'two' ? ['CHI', 'NKA'] : ['CHINKA'];
  const strokes = [];
  word.forEach((w, row) => {
    let width = 0; for (const ch of w) width += BW12.GLYPHS[ch].w + gap; width -= gap;
    let u = -width / 2;
    const v0 = word.length === 2 ? (row === 0 ? 0.05 : -L - 0.08) : -L / 2;
    for (const ch of w) {
      const G = BW12.GLYPHS[ch];
      for (const st of G.strokes) {
        const pts = [], sid = strokes.length;
        let acc = 0;
        for (let i = 0; i < st.length - 1; i++) {
          const a = st[i], b = st[i + 1], seg = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(seg * L / 0.008));
          for (let k = (i === 0 ? 0 : 1); k <= n; k++) {
            const t = k / n, gu = lerp(a[0], b[0], t), gv = lerp(a[1], b[1], t), s = acc + seg * t;
            // a human hand: a slight slant, a slow wobble and a little drift per stroke
            const wob = Math.sin(s * 7.3 + sid * 1.9) * 0.018 + Math.sin(s * 19.1 + sid) * 0.007;
            const lu = (u + gu + gv * 0.13 + wob) * L, lv = v0 + (gv + Math.cos(s * 6.1 + sid * 2.3) * 0.014 + Math.sin(sid * 3.7) * 0.02) * L;
            pts.push([B.c[0] + B.r[0] * lu + B.n[0] * 0.04, B.c[1] + lv, B.c[2] + B.r[1] * lu + B.n[1] * 0.04]);
          }
          acc += seg;
        }
        const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
        strokes.push({ pts, cum, total: cum[cum.length - 1] });
      }
      u += G.w + gap;
    }
  });
  return { strokes, L, rows: word.length, halfW: Math.max(...word.map(w => { let x = 0; for (const ch of w) x += BW12.GLYPHS[ch].w + gap; return (x - gap) * L / 2; })), halfH: word.length === 2 ? L + 0.1 : L / 2 };
};
BW12.inkFull = function (layout) {
  const S = BW12.state, Lt = BW12.layoutName(layout);
  S.ink = { strokes: Lt.strokes, done: Lt.strokes.length, s: 0 };
};
BW12.writeScene = function (g) {
  const S = BW12.state, p = g.player, B = S.board;
  const W = Game.cssW, H = Game.cssH, asp = W / H, layout = asp < 1 ? 'two' : 'row';
  const Lt = BW12.layoutName(layout);
  const tanY = Math.tan(0.45), tanX = tanY * asp, d = Math.max(1.4, (Lt.halfW + 0.55) / tanX, (Lt.halfH + 0.42) / (tanY * 0.8));
  const eye = { x: B.c[0] + B.n[0] * d, y: B.c[1] + 0.02, z: B.c[2] + B.n[1] * d, tx: B.c[0], ty: B.c[1], tz: B.c[2], fov: 0.9 };
  const stand = { x: B.c[0] + B.n[0] * 0.75 - B.r[0] * 1.45, z: B.c[2] + B.n[1] * 0.75 - B.r[1] * 1.45 };
  const wide = { x: B.c[0] + B.n[0] * 4.2 + B.r[0] * 1.6, y: 2.2, z: B.c[2] + B.n[1] * 4.2 + B.r[1] * 1.6, tx: B.c[0] - B.r[0] * 0.4, ty: 1.3, tz: B.c[2] - B.r[1] * 0.4, fov: 0.85 };
  const yawToBoard = Math.atan2(-B.n[0], -B.n[1]);
  S.trace = { strokes: Lt.strokes, si: 0, s: 0, idle: 0, blip: 0, layout, done: false, t: 0 };
  S.ink = { strokes: Lt.strokes, done: 0, s: 0 };
  g.cutscene([
    { do: g2 => { p.teleport(stand.x, 0, stand.z, yawToBoard + 0.5); p.animOverride = 'bw1213_write'; } },
    { cam: wide },
    { say: ['brady', ['Okay.', 'Okay, Chinka.']] },
    { cam: { from: wide, to: eye, dur: 1.6 } },
    { do: g2 => { burnsMusic(null); g2.banner('HER NAME', Input.usingTouch ? 'Trace each glowing stroke with your finger' : 'Drag along each glowing stroke (or hold JUMP)', { col: '#ffe0a8', dur: 4 }); g2.bossSay(null, 'Trace her name', 9999); } },
    { until: g2 => BW12.traceStep(g2, 1 / 120) },
    { do: g2 => { BW12.traceFinish(g2); } },
    { wait: 1.6 },
    { cam: { from: eye, to: wide, dur: 2.2 } },
    { do: g2 => { p.animOverride = 'bw1213_kneel'; } },
    { wait: 0.8 },
    { say: ['brady', ['Chinka.', 'I don\'t know where you are. I don\'t know if you can hear me.', 'But I\'m not done looking.']] },
    { wait: 1.0 },
    { music: 'w9' },
    { do: g2 => { p.animOverride = null; g2.missions.complete('name'); } }
  ], g2 => { p.animOverride = null; BW12.afterName(g2); });
};
// one simulation step of the tracing. Returns true when every stroke is written.
BW12.traceStep = function (g, dt) {
  const S = BW12.state, T = S.trace; if (!T || T.done) return true;
  T.t += dt;
  const st = T.strokes[T.si]; if (!st) { T.done = true; return true; }
  // find a finger/mouse that is down
  let touch = null; for (const t of Input.touches.values()) { touch = t; break; }
  const keys = Input.jump || Input.action || Input.up || Input.right || Input.left || Input.down || (Input.keys && Input.keys.enter);
  const W = Game.cssW, H = Game.cssH, o = {}, before = T.s;
  if (touch && g.R) {
    const tol = clamp(Math.min(W, H) * 0.075, 24, 52), look = 0.09;
    let best = -1, bd = 1e9;
    for (let s = T.s; s <= Math.min(st.total, T.s + look); s += 0.004) {
      const q = BW12.strokeAt(st, s);
      if (!g.R.project(q[0], q[1], q[2], W, H, o)) continue;
      const dd = Math.hypot(o.x - touch.x, o.y - touch.y); if (dd < bd) { bd = dd; best = s; }
    }
    if (best >= 0 && bd < tol) { if (best > T.s) T.s = best; T.idle = 0; }
    else { T.idle += dt; if (T.idle > 0.7) T.s += 0.16 * dt; }
  } else if (keys) T.s += 0.42 * dt;
  if (T.s > before) { T.blip += T.s - before; if (T.blip > 0.07) { T.blip = 0; burnsSfx('dialogue_blip', { vol: 0.14, pitch: 0.5 + Math.random() * 0.15 }); } }
  S.ink.done = T.si; S.ink.s = T.s;
  if (T.s >= st.total - 0.002) {
    T.si++; T.s = 0; S.ink.done = T.si; S.ink.s = 0;
    burnsSfx('pick', { pitch: 0.75, vol: 0.3 });
    if (T.si >= T.strokes.length) { T.done = true; return true; }
  }
  return false;
};
BW12.strokeAt = function (st, s) {
  const c = st.cum; let lo = 0, hi = c.length - 1;
  if (s <= 0) return st.pts[0]; if (s >= st.total) return st.pts[st.pts.length - 1];
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (c[mid] <= s) lo = mid; else hi = mid; }
  const t = (s - c[lo]) / Math.max(1e-6, c[hi] - c[lo]), a = st.pts[lo], b = st.pts[hi];
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
};
BW12.traceFinish = function (g) {
  const S = BW12.state;
  if (S.trace) { S.trace.done = true; S.ink.done = S.trace.strokes.length; S.ink.s = 0; BurnsSave.flag(12, 'wrote', true); BurnsSave.flag(12, 'wroteLayout', S.trace.layout); }
  g.bossLine = null;
  burnsSfx('secret', { vol: 0.35 });
  const B = S.board; for (let i = 0; i < 7; i++) g.fx.glint(B.c[0] + B.r[0] * (Math.random() - 0.5) * 2, B.c[1] + (Math.random() - 0.5) * 0.5, B.c[2] + B.r[1] * (Math.random() - 0.5) * 2, '#ffe8b0');
};
BW12.afterName = function (g) {
  const S = BW12.state, p = g.player;
  BW1213.after(S, 2.4, () => {
    burnsSfx('wind', { vol: 0.25 }, 'dust');
    for (let i = 0; i < 10; i++) g.fx.glint(S.hopeAt.x, S.hopeAt.y + 0.1, S.hopeAt.z, '#fff0c0');
    p.say('...What\'s that? Tucked into the wood.', 2.6);
    if (g.missions.state('hope') === 'available') g.missions.start('hope');
  });
};

/* ---------------- the turn: her message ---------------- */
BW12.ending = function (g) {
  const S = BW12.state, p = g.player, TC = BW12.TC, sol = g.actor('sol'), card = S.noteCard;
  // read facing outward into the open courtyard (away from the sanctuary)
  let ox = p.x - TC.x, oz = p.z - TC.z; const ol = Math.hypot(ox, oz) || 1; const fx = ox / ol, fz = oz / ol, sx = fz, sz = -fx;
  const W = Game.cssW, H = Game.cssH, asp = W / H, tanY = Math.tan(0.4), tanX = tanY * asp;
  const dd = Math.max(0.55, 0.3 / tanX, 0.21 / (tanY * 0.8));
  const hand = { x: p.x + fx * 0.42, y: p.y + 1.22, z: p.z + fz * 0.42 };
  const ins = { x: p.x + fx * 1.5, y: p.y + 3.3, z: p.z + fz * 1.5 };
  const camOver = { x: p.x + sx * 1.5 + fx * 0.3, y: p.y + 1.75, z: p.z + sz * 1.5 + fz * 0.3, tx: hand.x, ty: hand.y, tz: hand.z, fov: 0.85 };
  const camRead = { x: ins.x - fx * dd, y: ins.y, z: ins.z - fz * dd, tx: ins.x, ty: ins.y, tz: ins.z, fov: 0.8 };
  const camWide = { x: TC.x + 9, y: 3.5, z: TC.z + 34, tx: TC.x, ty: 11, tz: TC.z, fov: 0.85 };
  const cardYaw = Math.atan2(-fx, -fz);
  g.cutscene([
    { do: g2 => { p.locked = true; p.yaw = Math.atan2(fx, fz); p.animOverride = 'bw1213_read'; card.visible = true; card.x = hand.x; card.y = hand.y; card.z = hand.z; card.yaw = cardYaw; card.pitch = -0.35; card.scale = 0.55; } },
    { cam: camOver },
    { wait: 0.7 },
    { say: ['brady', ['That\'s... that\'s her handwriting.']] },
    { do: g2 => { card.x = ins.x; card.y = ins.y; card.z = ins.z; card.pitch = 0; card.scale = 1; } },
    { cam: camRead },
    { wait: 4.2 },
    { say: [{ name: 'CHINKA (THE NOTE)', model: BurnsRig.model(BurnsRig.chinkaSpec()) }, ['"B. Not gone. The big guy carried me off in the storm, but I\'m okay."', '"Find me where lost loves are found: 9:00, the Workshops."']] },
    { do: g2 => { card.visible = false; p.animOverride = null; g2.setTod(1, 0.35); S.glowK = 1; burnsSfx('reunion', { vol: 0.5 }, 'secret'); burnsMusic('w9'); } },
    { cam: { from: camRead, to: camWide, dur: 3.2 } },
    { wait: 1.0 },
    { say: ['brady', ['She\'s alive.', '...She\'s alive.']] },
    { say: ['brady', ['I\'ll leave your name up there anyway. Not as a goodbye.', 'As a promise.']] },
    { say: [sol || 'SOL', ['Looks like that one\'s still writing her own story.']] },
    { say: ['brady', ['The Workshops. Nine o\'clock.', 'Hold on, Chinka. I\'m coming.']] },
    { do: g2 => { card.visible = false; p.locked = false; p.animOverride = null; p.victoryT = 2.4; } },
    { wait: 1.6 }
  ], g2 => g2.finishWorld());
};

/* ---------------- sprites: light through the lattice, lamps, ink ---------------- */
BW12.drawSprites = function (g, R) {
  const S = BW12.state, SP = BURNS_SPRITES.R, env = g.env, t = g.time, TC = BW12.TC, cam = g.cam;
  // lit lamps (and the fade as they go out)
  for (const L of S.lamps) { if (L.k <= 0.01) continue; const f = L.k * (0.85 + Math.sin(t * 7 + L.x) * 0.06); R.bbs.bb(L.x, L.y, L.z, 2.0 * f, 2.0 * f, SP.glow, [1, 0.78, 0.45], 0.8 * f, true); R.bbs.bb(L.x, L.y, L.z, 0.5, 0.6, SP.core, [1, 0.9, 0.7], 0.9 * f, true); }
  // light shafts through the Temple lattice (stronger as the sun rises)
  const dTemple = Math.hypot(cam.x - TC.x, cam.z - TC.z);
  if (dTemple < 90 && env && env.sunDir) {
    const sd = env.sunDir, up = Math.max(0, sd[1] + 0.05), k = clamp(g.tod * 1.1, 0.25, 1) * (0.6 + up * 4);
    const L = 15, col = [1, 0.84, 0.6];
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * TAU + 0.3, rr = 10 + (i % 3) * 3.2, fx = TC.x + Math.sin(a) * rr, fz = TC.z + Math.cos(a) * rr;
      const cx = fx + sd[0] * L * 0.5, cy = 0.1 + Math.max(0.2, sd[1]) * L * 0.5 + 3.5, cz = fz + sd[2] * L * 0.5;
      const flick = 0.75 + 0.25 * Math.sin(t * 0.6 + i * 1.7);
      R.bbs.streak(cx, cy, cz, sd[0], Math.max(0.35, sd[1] + 0.3), sd[2], L, 1.3 + (i % 2) * 0.6, SP.streak, col, 0.07 * k * flick);
    }
    // dust motes drifting in the light
    for (let i = 0; i < 40; i++) { const a = i * 2.39996, rr = 9 + (i * 37 % 11), ph = (t * 0.05 + i * 0.137) % 1; const x = TC.x + Math.sin(a) * rr + Math.sin(t * 0.3 + i) * 0.6, z = TC.z + Math.cos(a) * rr + Math.cos(t * 0.27 + i) * 0.6, y = 0.6 + ph * 6; R.bbs.bb(x, y, z, 0.07, 0.07, SP.glow, [1, 0.9, 0.7], 0.5 * Math.sin(ph * Math.PI) * k, true); }
  }
  // the necklace still blinking in Brady's hands
  if (S.necklace.visible) { const n = S.necklace; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 0.5; if (Math.sin(t * 5 + i * 2) < 0) continue; R.bbs.bb(n.x + Math.sin(a) * 0.1, n.y, n.z + Math.cos(a) * 0.07, 0.18, 0.18, SP.glow, burnsRGBf(BURNS_NEON[i % 7]), 0.7, true); } }
  // the name in marker ink (and the tracing guides)
  const I = S.ink;
  if (I && I.strokes) {
    const ink = [0.1, 0.07, 0.14], tr = S.trace && !S.trace.done ? S.trace : null;
    for (let k = 0; k < I.strokes.length; k++) {
      const st = I.strokes[k];
      const upto = k < I.done ? st.pts.length : k === I.done ? Math.floor(st.pts.length * Math.min(1, I.s / Math.max(1e-6, st.total))) : 0;
      for (let i = 0; i < upto; i++) { const q = st.pts[i]; R.bbs.bb(q[0], q[1], q[2], 0.034, 0.034, SP.dot, ink, 1, false); }
      if (tr && k >= I.done) {
        const cur = k === I.done, step = cur ? 3 : 5, al = cur ? 0.32 : 0.1;
        for (let i = upto; i < st.pts.length; i += step) { const q = st.pts[i]; R.bbs.bb(q[0], q[1], q[2], 0.03, 0.03, SP.glow, [1, 0.85, 0.55], al, true); }
        if (cur) {
          const q = BW12.strokeAt(st, tr.s), pulse = 0.7 + 0.3 * Math.sin(t * 8);
          R.bbs.bb(q[0], q[1], q[2], 0.16 * pulse, 0.16 * pulse, SP.glow, [1, 0.8, 0.45], 0.9, true);
          if (tr.s <= 0.0001) { const e = st.pts[st.pts.length - 1]; R.bbs.bb(e[0], e[1], e[2], 0.06, 0.06, SP.glow, [1, 0.6, 0.4], 0.35, true); }
        }
      }
    }
  }
};
