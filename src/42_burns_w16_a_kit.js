/* ============================================================
   BRADY GOES TO BURNING MAN — World 16 kit (1/3): RHYTHM WAVE
   Shared data for the world: layout, palettes (golden afternoon ->
   glowing night), the camp's own music, the cast (Wolfie, Bam Bam,
   Guru Gary, Doug of Shroom Security) and their gear, plus the
   dance-contest and carrying animations.
   World file: 42_burns_world16.js · geometry: 42_burns_w16_b_build.js
   · runtime effects + contest: 42_burns_w16_c_fx.js
   ============================================================ */

const BW16 = {
  ID: 16,
  F: { x: 0, z: -70, r: 9.6, h: 0.55 },            // the bamboo dance floor (deck top y = h)
  WAVE: { x0: -11, x1: 11, n: 10 },                 // the bamboo Wave canopy over the floor's north half
  TRAILER: { x: -24, z: -101 },                     // bamboo pile: pole 1
  CONTAINER: { x: -38, z: -86, top: 2.6 },          // shipping container: pole 2 on the roof
  LIMBO: { x: 21, z: -52 },                         // the limbo pole: pole 3
  RV: { x: -46, z: -60 },                           // camp RV: pole 4 is its roof flagpole
  RACK: { x: -13.5, z: -92 },                       // drop-off at the Wave's west foot
  LOUNGE: { x: 27, z: -74 },                        // the shade-sail lounge
  HAMMOCK: { x: 46, z: -96, y: 4.55 },               // the Sky Hammock (photo 3: out of reach without Party Powder)
  KITCHEN: { x: -25, z: -55 },
  DOME: { x: -30, z: -34 },
  TREE: { x: 13, z: -38 },                          // the bike tree (the yellow bike)
  JUDGES: { x: 0, z: -57.2 },
  ARCH: { x: 0, z: -117 },
  BARTER: { x: -21, z: 96 },                        // Uncle Barter's reciprocal-gifting rug
  PINATA: { x: 34, z: 140 },
  GROVE: { x: 0, z: 240 },                          // the Glowshroom Grove
  GATE: { x: 0, z: 219 },                           // Shroom Security's gate (vibe field radius 21)
  FIELD_R: 21,
  SPAWN: { x: 0, z: -164, yaw: 0 },
  BUILD: ['haul', 'lash', 'sails', 'lanterns'],
  state: null
};

/* ---------------- small helpers ---------------- */
BW16.err = function (e) { try { if (Game.reportError) Game.reportError(e); else console.error(e); } catch (x) { /* ignore */ } };
BW16.has = function (name) { try { return !!(window.Sound && Sound.trackNames && Sound.trackNames.indexOf(name) >= 0); } catch (e) { return false; } };
BW16.track = function (a, b) { return BW16.has(a) ? a : b; };
// reduced motion: the screen-shake setting off, or the OS asks for less motion
BW16.calm = function () {
  try { if (Save.data && Save.data.settings && Save.data.settings.shake === false) return true; } catch (e) { /* ignore */ }
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
};
// game-time timers (pause with the game; ticked from the world update)
BW16.after = function (g, sec, fn) { const S = BW16.state; if (S) S.timers.push({ t: sec, fn }); };
BW16.tick = function (g, dt) {
  const S = BW16.state; if (!S || !S.timers.length) return;
  for (const t of S.timers.slice()) { t.t -= dt; if (t.t <= 0 && !t.done) { t.done = true; try { t.fn(g); } catch (e) { BW16.err(e); } } }
  S.timers = S.timers.filter(t => !t.done);
};

/* ---------------- palettes: golden afternoon -> glowing night ---------------- */
BW16.SKY_DAY = {
  zen: '#2c5fc8', hor: '#ffbf66', fog: '#efc28c', fogD: 0.0048, fogH: 0.05, haze: 0.42, fogMax: 0.8,
  sun: [292, 14], sunCol: '#ffc26e', sunSize: 0.0026, moon: [120, -10], moonK: 0, stars: 0,
  mtnCol: '#8e6a86', mtnH: 3.1, city: [180, 0], cityCol: '#000000', cityK: 0,
  sky: '#a8bde2', gnd: '#e2a866', key: '#ffc27a', keyK: 1.1, emB: 1.2, rim: '#ffd8a0',
  clouds: 0.36, cloudCol: '#fff0d6', mid: '#ffd29a', midK: 0.32
};
BW16.SKY_NIGHT = {
  zen: '#070524', hor: '#3e1554', fog: '#2a1642', fogD: 0.0088, fogH: 0.06, haze: 0.55, fogMax: 0.92,
  sun: [292, -16], sunCol: '#000000', sunSize: 0.0001, moon: [150, 34], moonK: 1.1, stars: 1,
  mtnCol: '#150a2a', mtnH: 3.0, city: [180, 0], cityCol: '#ff4fd8', cityK: 0.65,
  sky: '#5a4aa2', gnd: '#3a2a52', key: '#9aa6ff', keyK: 0.48, emB: 1.95, rim: '#c08aff',
  clouds: 0.22, cloudCol: '#382a5c', mid: '#28104a', midK: 0.35
};

/* ---------------- music: warm bamboo-floor house + its wonky twin ----------------
   Original compositions in the engine's song format (src/01_audio.js). */
(() => {
  try {
    if (!(window.Sound && Sound.addTrack)) return;
    const dots = n => '.'.repeat(n), rp = (s, n) => s.repeat(n);
    // Rhythm Wave: D dorian marimba house, 118 BPM. Bamboo clicks (rim), hand drums, shaker.
    Sound.addTrack('burns_w16', {
      bpm: 118, bars: 16, rv: 0.3, dl: 0.16, sw: 0.1, pump: 0.32,
      ch: 'Dm9 Gm9 Cmaj7 Fmaj7 Dm9 Gm9 Bbmaj7 A7 Dm9 Gm9 Cmaj7 Fmaj7 Bbmaj7 Am7 Gm9 A7',
      ld: 'A5:2 .:1 C6:1 D6:2 .:2 F6:2 E6:2 D6:2 C6:2 | D6:2 .:1 Bb5:1 A5:2 .:2 G5:4 .:4 | E6:2 .:1 D6:1 C6:2 .:2 G5:2 B5:2 C6:2 E6:2 | F6:3 E6:3 C6:2 A5:4 .:4 |' +
          'A5:2 .:1 C6:1 D6:2 .:2 F6:2 A6:2 G6:2 F6:2 | G6:2 .:1 F6:1 D6:2 .:2 Bb5:4 .:4 | D6:2 .:1 C6:1 Bb5:2 .:2 F5:2 A5:2 Bb5:2 D6:2 | C#6:3 E6:3 G6:2 A6:6 .:2 |' +
          'F6:2 E6:2 D6:2 A5:2 .:2 D6:2 E6:2 F6:2 | G6:4 F6:2 D6:2 .:4 Bb5:4 | E6:2 G6:2 .:2 E6:2 D6:2 C6:2 B5:2 G5:2 | A5:3 C6:3 E6:2 F6:8 |' +
          'D6:2 .:1 F6:1 A6:2 .:2 F6:2 D6:2 Bb5:4 | C6:2 .:1 E6:1 G6:2 .:2 E6:2 C6:2 A5:4 | Bb5:2 D6:2 F6:2 A6:2 G6:4 F6:4 | E6:4 C#6:4 A5:8',
      li: 'vibes', lv: 0.15, lg: 0.7, hx: 0.04, hi: 'vibes',
      bp: 'r-..r.r-..o-r.f.', bi: 'sub', bv: 0.31,
      ap: dots(128) + rp('..0.2...1.3...2.', 8), ai: 'harp', av: 0.035, ao: 64,
      a2: rp('..c...c...c..c..', 16), a2i: 'vibes', a2v: 0.026, a2o: 58,
      pd: 'c---------------', pi: 'pad', pv: 0.03, po: 52,
      dr: ['k...k...k...k...', '....c.......c...', '..r..r.r..r...r.', 'b..d..b.b..d.b..', 'n.n.n.n.n.n.n.n.', '..o...o...o...o.', 'x' + dots(127)], dv: 0.42,
      fill: ['k...k...k...k.k.', '....c...c.c.cccc', 'rrr.r.r.rr.rrrrr'], fe: 8
    });
    // the same tune after a whole sassafras: half-time, warbling, bubbling
    Sound.addTrack('burns_w16_wonk', {
      bpm: 98, bars: 8, rv: 0.45, dl: 0.32, wr: 1.5, pump: 0.2,
      ch: 'Dm9 Gm9 Cmaj7 Fmaj7 Dm9 Gm9 Bbmaj7 A7',
      ld: 'A5:2 .:1 C6:1 D6:2 .:2 F6:2 E6:2 D6:2 C6:2 | D6:2 .:1 Bb5:1 A5:2 .:2 G5:4 .:4 | E6:2 .:1 D6:1 C6:2 .:2 G5:2 B5:2 C6:2 E6:2 | F6:3 E6:3 C6:2 A5:4 .:4 |' +
          'A5:2 .:1 C6:1 D6:2 .:2 F6:2 A6:2 G6:2 F6:2 | G6:2 .:1 F6:1 D6:2 .:2 Bb5:4 .:4 | D6:2 .:1 C6:1 Bb5:2 .:2 F5:2 A5:2 Bb5:2 D6:2 | C#6:3 E6:3 G6:2 A6:6 .:2',
      li: 'wobl', lv: 0.13,
      bp: 'r-------r-----o-', bi: 'wob', bv: 0.2,
      ap: '0.2.1.3.2.4.3.5.', ai: 'glass', av: 0.035, ao: 64,
      pd: 'c---------------', pi: 'pad', pv: 0.035, po: 52,
      dr: ['k.........k.....', '........c.......', '..r...r...r.r...', 'u.....u.......u.', 'n.n.n.n.n.n.n.n.', 'z.......z...z...'], dv: 0.4
    });
  } catch (e) { BW16.err(e); }
})();

/* ---------------- the cast: gear ---------------- */
(() => {
  const B = BURNS_BONES;
  // Wolfie's faux-fur wolf hood: a grey fur cap, pointed ears with pink felt, a little muzzle brim
  BurnsRig.defineHat('bw16WolfHood', (m, A, H) => {
    const c = H.col || '#9a9aa4', HD = A.HD, lo = A.lo;
    m.color(c);
    m.ellipsoid(HD.cx, HD.cy + 0.035, HD.cz - 0.012, HD.rx + 0.03, HD.ry + 0.025, HD.rz + 0.032, { phi1: Math.PI * 0.56, seg: lo ? 12 : 22, rings: lo ? 5 : 9 });
    // side and back flaps (fur down to the shoulders)
    m.push(); m.tf(0, HD.cy + 0.02, HD.cz - 0.03); m.lathe([[0.215, 0.05], [0.226, -0.07], [0.205, -0.2], [0.17, -0.25]], { seg: lo ? 10 : 18, theta0: Math.PI * 0.32, theta1: Math.PI * 1.68 }); m.pop();
    // ears
    for (const sd of [1, -1]) {
      m.push(); m.tf(sd * 0.12, HD.cy + 0.2, HD.cz - 0.03, 0, -0.1, -sd * 0.32);
      m.color(c); m.lathe([[0.075, 0], [0.068, 0.06], [0.04, 0.13], [0.0, 0.19]], { seg: lo ? 6 : 10, sz: 0.55 });
      if (!lo) { m.color('#ff9ab8'); m.push(); m.tf(0, 0.012, 0.018); m.lathe([[0.05, 0], [0.045, 0.05], [0.025, 0.11], [0, 0.155]], { seg: 8, sz: 0.3 }); m.pop(); }
      m.pop();
    }
    // the muzzle brim over the forehead, with a black nose and two button eyes
    m.color('#e8e4dc'); m.ellipsoid(0, HD.cy + 0.2, HD.cz + HD.rz - 0.01, 0.1, 0.05, 0.085, { seg: lo ? 8 : 14, rings: lo ? 4 : 7 });
    if (!lo) {
      m.color('#1a1416').shine(3); m.ball(0, HD.cy + 0.215, HD.cz + HD.rz + 0.075, 0.022, { seg: 8, rings: 5 });
      for (const sd of [1, -1]) m.ball(sd * 0.075, HD.cy + 0.27, HD.cz + HD.rz - 0.02, 0.014, { seg: 6, rings: 4 });
      m.shine(0);
    }
  });
  // Bam Bam's one-shoulder fur tunic (warm brown faux fur, a darker strap over the left shoulder)
  BurnsRig.defineAcc('bw16Tunic', (m, A) => {
    const h = A.h, lo = A.lo, fur = BURNS_ATLAS.pattern('fur');
    m.setBone(B.CHEST);
    const prof = [];
    for (let i = 0; i <= 5; i++) { const y = -0.06 + i * (0.34 * h) / 5; prof.push([A.torsoR(Math.max(0, y)) + 0.024, y]); }
    m.color('#8a5a32');
    m.lathe(prof, { seg: lo ? 12 : 22, sz: A.TZ + 0.03, uv: fur, uvRepeat: 3 });
    // the strap over the left shoulder, front to back
    const pts = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6, th = lerp(0.55, Math.PI - 0.55, t), y = lerp(0.3, 0.3, t) * h + Math.sin(t * Math.PI) * 0.2 * h; pts.push(A.torsoPt(th + (t < 0.5 ? 0 : 0), y, 0.03)); }
    m.color('#6a4224');
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; m.limb(a[0] + 0.05, a[1], a[2], b[0] + 0.05, b[1], b[2], 0.05, 0.05, { seg: lo ? 5 : 8, sz: 0.45 }); }
    // ragged hem tufts
    if (!lo) { m.color('#7a4e2a'); for (let i = 0; i < 12; i++) { const th = i / 12 * TAU, p = A.torsoPt(th, -0.05, 0.03); m.push(); m.tf(p[0], p[1], p[2], th); m.ellipsoid(0, -0.03, 0, 0.035, 0.05, 0.02, { seg: 6, rings: 4 }); m.pop(); } }
  });
  // a necklace of white foam "bones" with one big bone in the middle
  BurnsRig.defineAcc('bw16Bones', (m, A) => {
    const h = A.h, n = A.lo ? 5 : 9;
    m.color('#f2ead8').shine(1);
    for (let i = 0; i < n; i++) {
      const a = -1.25 + i / (n - 1) * 2.5, p = A.torsoPt(a * 0.55, 0.455 * h - Math.cos(a) * 0.06, 0.02);
      m.push(); m.tf(p[0], p[1], p[2], a * 0.55, 0, Math.PI / 2);
      m.limb(0, -0.022, 0, 0, 0.022, 0, 0.008, 0.008, { seg: 5 });
      if (!A.lo) { m.ball(0.006, -0.026, 0, 0.009, { seg: 5, rings: 3 }); m.ball(-0.006, -0.026, 0, 0.009, { seg: 5, rings: 3 }); m.ball(0.006, 0.026, 0, 0.009, { seg: 5, rings: 3 }); m.ball(-0.006, 0.026, 0, 0.009, { seg: 5, rings: 3 }); }
      m.pop();
    }
    const c = A.torsoPt(0, 0.34 * h, 0.035);
    m.push(); m.tf(c[0], c[1], c[2], 0, 0, Math.PI / 2);
    m.limb(0, -0.06, 0, 0, 0.06, 0, 0.014, 0.014, { seg: 6 });
    for (const sy of [1, -1]) for (const sx of [1, -1]) m.ball(sx * 0.011, sy * 0.066, 0, 0.017, { seg: 6, rings: 4 });
    m.pop(); m.shine(0);
  });
  // a foam bone stuck through the wild hair, tilted like it landed there in a fight with a mammoth
  BurnsRig.defineAcc('bw16HairBone', (m, A) => {
    const HD = A.HD, lo = A.lo;
    m.setBone(B.HEAD);
    m.push(); m.tf(HD.cx + 0.03, HD.cy + HD.ry + 0.1, HD.cz + 0.02, 0.15, 0.35, 0.42);
    m.color('#f4ecd8').shine(1);
    m.limb(-0.15, 0, 0, 0.15, 0, 0, 0.018, 0.018, { seg: lo ? 5 : 7 });
    for (const sx of [1, -1]) for (const sz of [1, -1]) m.ball(sx * 0.16, sz * 0.012, sz * 0.012, 0.027, { seg: lo ? 5 : 7, rings: lo ? 3 : 5 });
    m.pop(); m.shine(0);
  });
  // a giant foam club (soft, lumpy, slightly ridiculous)
  BurnsRig.defineProp('bw16Club', (m, A) => {
    const lo = A.lo;
    m.color('#7a5230'); m.limb(0, -0.12, 0.05, 0, 0.2, 0.05, 0.028, 0.034, { seg: lo ? 6 : 8 });
    m.color('#e3a862').shine(1); m.limb(0, 0.18, 0.05, 0.01, 0.82, 0.07, 0.05, 0.13, { seg: lo ? 8 : 14, mid: 0.12 });
    if (!lo) { m.color('#d39452'); for (let i = 0; i < 7; i++) { const a = i * 2.3, y = 0.5 + (i % 3) * 0.1; m.ball(Math.sin(a) * 0.1, y, 0.06 + Math.cos(a) * 0.1, 0.045, { seg: 7, rings: 5 }); } }
    m.shine(0);
  });
  // Wolfie's megaphone
  BurnsRig.defineProp('bw16Megaphone', (m, A) => {
    m.color('#2a2a30'); m.limb(0, -0.05, 0.05, 0, 0.08, 0.05, 0.02, 0.02, { seg: 6 });
    m.color('#ff8a2a').shine(2); m.push(); m.tf(0, 0.1, 0.06, 0, Math.PI / 2 - 0.2); m.lathe([[0.03, -0.05], [0.045, 0.05], [0.12, 0.26], [0.125, 0.27], [0.1, 0.27]], { seg: A.lo ? 8 : 14 }); m.pop(); m.shine(0);
  });
  // a bamboo pole carried over the shoulder (Brady's "held item" while hauling)
  BurnsRig.defineProp('bw16Pole', (m, A) => {
    const a = [0, -0.46, 0.34], b = [0, 1.62, -1.22], n = A.lo ? 3 : 6;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      m.color(i % 2 ? '#d8b46a' : '#cfa95e');
      m.limb(lerp(a[0], b[0], t0), lerp(a[1], b[1], t0), lerp(a[2], b[2], t0), lerp(a[0], b[0], t1), lerp(a[1], b[1], t1), lerp(a[2], b[2], t1), 0.042, 0.042, { seg: A.lo ? 5 : 8 });
      if (i > 0 && !A.lo) { m.color('#9c7434'); const p = [lerp(a[0], b[0], t0), lerp(a[1], b[1], t0), lerp(a[2], b[2], t0)], d = 0.03; m.limb(p[0], p[1] - d * 0.8, p[2] + d * 0.6, p[0], p[1] + d * 0.8, p[2] - d * 0.6, 0.047, 0.047, { seg: 8 }); }
    }
  });
  // a bundle of paper lanterns on a string (the lantern mission)
  BurnsRig.defineProp('bw16Lanterns', (m, A) => {
    m.color('#3a2a1a'); m.limb(0, -0.02, 0.05, 0, 0.32, 0.05, 0.006, 0.006, { seg: 4 });
    const cols = ['#ff7a3a', '#ffd04a', '#ff5a8a', '#ffb04a'];
    for (let i = 0; i < (A.lo ? 2 : 4); i++) { const a = i * 1.7; m.color(cols[i], 0.55); m.ellipsoid(Math.sin(a) * 0.09, 0.42 + (i % 2) * 0.05, 0.05 + Math.cos(a) * 0.09, 0.07, 0.085, 0.07, { seg: A.lo ? 6 : 10, rings: A.lo ? 4 : 7 }); }
    m.emissive(0);
  });
})();

/* ---------------- the cast: types ---------------- */
// WOLFIE: Rhythm Wave's camp lead. Grey wolf hood, mirrored round shades, sunset kimono, megaphone.
BurnsRig.defineType('bw16Wolfie', {
  anim: 'idle', lines: ['AWOOOO!', 'Bamboo doesn\'t lie, man.', 'Floor\'s gotta be lashed by sundown.'],
  spec(s, r) {
    s.face = 'partydad'; s.skin = '#c99a74'; s.skinSh = '#a8785a';
    s.hair = { style: 'long', col: '#a6a6ae', hi: '#e2e2e8' }; s.beard = { col: '#a6a6ae', len: 0.055, trim: true };
    s.hat = { kind: 'bw16WolfHood', col: '#8e8e9a' }; s.glasses = 'round'; s.lensCol = '#38d8ff';
    s.top = { kind: 'tank', col: '#24242c' }; s.coat = { kind: 'kimono', col: '#ff7a3a', trim: '#ffd84a' };
    s.bottom = { kind: 'shorts', col: '#3a6a8a', pattern: 'tiedye' }; s.shoes = { kind: 'boots', col: '#4a3a2a', sole: '#2a1e14' };
    s.acc = ['beads', 'kandi', 'ledNecklace']; s.prop = 'bw16Megaphone';
    s.body.h = 1.04; s.body.w = 1.02;
  }
});
// BAM BAM: an original caveman costume. A grown man in a fur tunic with a bone necklace, a giant
// foam club and wild dark hair and beard. (Not a toddler; no tufts; no spotted anything.)
BurnsRig.defineType('bw16BamBam', {
  anim: 'idle', lines: ['BAM! BAM!', 'Ooga booga, brother.', 'The club is foam. The love is real.'],
  spec(s, r) {
    s.face = 'toothy'; s.skin = '#c88c62'; s.skinSh = '#a46a44';
    s.hair = { style: 'afro', col: '#3a2416', hi: '#6a4428' };   // no beard: the big grin has to show
    s.top = { kind: 'none' }; s.paint = null;
    s.bottom = { kind: 'kilt', col: '#7e522c', pattern: 'fur' };
    s.shoes = { kind: 'furboots', col: '#6a4a30' };
    s.acc = ['bw16Tunic', 'bw16Bones', 'bw16HairBone', 'kandi']; s.prop = 'bw16Club';
    s.body.h = 1.08; s.body.w = 1.2;
  }
});
// GURU GARY: the contest's master of ceremonies. Saffron robe, headset mic, enormous calm.
BurnsRig.defineType('bw16Guru', {
  anim: 'welcome', lines: ['Breathe in. Breathe out. Now DANCE.', 'Namaste on the one and the three.', 'Your chakras are unlashed, my friend.'],
  spec(s, r) {
    s.face = 'beatific'; s.skin = '#b88a64'; s.skinSh = '#946644';
    s.hair = { style: 'bald', col: '#2a1e18' }; s.beard = { col: '#e8e4dc', len: 0.09 };
    s.top = { kind: 'long', col: '#ffb040' }; s.coat = { kind: 'robe', col: '#ff9a2a', trim: '#ffd84a' };
    s.bottom = { kind: 'pants', col: '#ffb040' }; s.shoes = { kind: 'sandals', col: '#7a5a3a' };
    s.acc = ['headset', 'beads', 'lei']; s.prop = null; s.glasses = 'round'; s.lensCol = '#ffd84a';
  }
});
// DOUG of SHROOM SECURITY: a safety captain who never once had fun. Grumpy until hugged.
BurnsRig.defineType('bw16Doug', {
  anim: 'clipboard', lines: ['No waiver, no bounce.', 'Waivers are closed. Forever.', 'I have a clipboard. That makes it official.'],
  spec(s, r, o) {
    const T = BURNS_NPC_TYPES.safetycaptain; if (T && T.spec) T.spec(s, r, o);
    s.face = 'grumpy'; s.beard = { col: '#5a4434', len: 0.04, trim: true };
    s.hat = { kind: 'hardhat', col: '#b07aff' };
  }
});

/* ---------------- animations: contest poses, carrying, the guard's hug ---------------- */
(() => {
  const B = BURNS_BONES, S = (P, b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  const A = BURNS_ANIMS;
  // Brady in the contest: grooves between notes, snaps into a pose on every hit (BW16.dance.pose)
  // 1 SUN SALUTE (arms up in a V), 2 LOTUS TWIST (knee up, palms together), 3 ROOT DROP (squat), 4 COSMIC WAVE
  A.bw16Yoga = (P, t, k) => {
    const D = BW16.dance || {}, pose = D.pose || 0, pt = D.poseT === undefined ? 9 : D.poseT;
    const bpm = D.bpm || 118, b = t * bpm / 60 * TAU, s = Math.sin(b), c = Math.cos(b);
    if (!pose || pt > 0.42) { A.dance(P, t, { style: (D.groove || 0) % 6, bpm }); return; }
    const e = Math.min(1, pt / 0.08), w = Math.sin(t * 9) * 0.05;
    if (pose === 1) {
      S(P, B.UARM_L, -0.2, 0, 2.75 * e); S(P, B.FARM_L, -0.1); S(P, B.UARM_R, -0.2, 0, -2.75 * e); S(P, B.FARM_R, -0.1);
      S(P, B.CHEST, -0.18 * e); S(P, B.HEAD, -0.35 * e); S(P, B.THIGH_L, -0.05); S(P, B.THIGH_R, -0.05); P.y = 0.06 * e; P.face = 3;
    } else if (pose === 2) {
      S(P, B.THIGH_L, -1.45 * e, 0, 0.55 * e); S(P, B.SHIN_L, 1.9 * e); S(P, B.THIGH_R, 0.02); S(P, B.SHIN_R, 0.05);
      S(P, B.UARM_L, -1.15, 0, -0.55 + w); S(P, B.FARM_L, -1.6); S(P, B.UARM_R, -1.15, 0, 0.55 - w); S(P, B.FARM_R, -1.6);
      S(P, B.CHEST, 0.02, 0.5 * e * Math.sin(t * 3)); P.yaw = 0.35 * e; P.face = 3;
    } else if (pose === 3) {
      S(P, B.THIGH_L, -1.5 * e, 0, 0.45 * e); S(P, B.SHIN_L, 1.9 * e); S(P, B.THIGH_R, -1.5 * e, 0, -0.45 * e); S(P, B.SHIN_R, 1.9 * e);
      S(P, B.UARM_L, -1.3, 0, 0.9); S(P, B.FARM_L, -0.6); S(P, B.UARM_R, -1.3, 0, -0.9); S(P, B.FARM_R, -0.6); S(P, B.CHEST, 0.35 * e); P.y = -0.45 * e; P.face = 1;
    } else {
      const wv = Math.sin(t * 14);
      S(P, B.UARM_L, -0.3, 0, 1.4 + wv * 0.3); S(P, B.FARM_L, -0.4 - wv * 0.4); S(P, B.UARM_R, -0.3, 0, -1.4 + wv * 0.3); S(P, B.FARM_R, -0.4 + wv * 0.4);
      S(P, B.CHEST, 0.05 * s, 0, 0.25 * wv); S(P, B.HIPS, 0, 0, -0.2 * wv); S(P, B.THIGH_L, -0.15); S(P, B.SHIN_L, 0.3); S(P, B.THIGH_R, -0.15); S(P, B.SHIN_R, 0.3); P.face = 3;
    }
    S(P, B.HAIR, Math.abs(s) * 0.3 + c * 0.1);
  };
  // the healer's "aura dance": eyes closed, palms together, a slow sway that ends in a tiny levitation
  A.bw16Aura = (P, t) => {
    const s = Math.sin(t * 1.4), lev = Math.max(0, Math.min(1, (t - 1.6) / 1.2));
    S(P, B.UARM_L, -1.0, 0, -0.5); S(P, B.FARM_L, -1.7); S(P, B.UARM_R, -1.0, 0, 0.5); S(P, B.FARM_R, -1.7);
    S(P, B.CHEST, 0.02, 0, s * 0.08); S(P, B.HEAD, -0.15 + s * 0.05, 0, s * 0.1);
    S(P, B.THIGH_L, -0.05 - lev * 0.4); S(P, B.SHIN_L, 0.1 + lev * 0.7); S(P, B.THIGH_R, -0.05 - lev * 0.4); S(P, B.SHIN_R, 0.1 + lev * 0.7);
    P.y = lev * 0.22 + Math.sin(t * 2.2) * 0.02 * lev; P.face = 3;
  };
  // the furry overheating: a robot dance that slows, sags and finally flops over
  A.bw16Melt = (P, t) => {
    if (t < 2.6) { A.dance(P, t * (1 - t * 0.12), { style: 3, bpm: 118 }); return; }
    A.knocked(P, t - 2.6);
  };
  // glitter spin: hands up, spinning, then a stumble
  A.bw16Twirl = (P, t) => {
    if (t < 2.4) { A.dance(P, t, { style: 1, bpm: 124 }); P.yaw = t * 7; return; }
    A.hurt(P, t - 2.4); P.yaw = 0.4;
  };
  // judges holding up score cards
  A.bw16Card = (P, t) => { A.idle(P, t); S(P, B.UARM_R, -2.6, 0, -0.2); S(P, B.FARM_R, -0.2); S(P, B.UARM_L, -2.5, 0, 0.25); S(P, B.FARM_L, -0.25); P.face = 3; };
  // Bam Bam drumming his club on his own head (gently; it's foam)
  A.bw16Bonk = (P, t) => { A.idle(P, t); const s = Math.max(0, Math.sin(t * 7)); S(P, B.UARM_R, -2.4 + s * 0.9, 0, -0.35); S(P, B.FARM_R, -1.0 - s * 0.6); S(P, B.HEAD, 0.05 + s * 0.1); P.face = 3; };
  // hoisting a sail: both hands pulling a rope down, hand over hand
  A.bw16Hoist = (P, t) => { const s = Math.sin(t * 12); S(P, B.UARM_L, -2.5 + s * 0.6, 0, 0.3); S(P, B.FARM_L, -0.4); S(P, B.UARM_R, -2.5 - s * 0.6, 0, -0.3); S(P, B.FARM_R, -0.4); S(P, B.CHEST, -0.15); S(P, B.THIGH_L, -0.35); S(P, B.SHIN_L, 0.5); S(P, B.THIGH_R, 0.1); S(P, B.SHIN_R, 0.2); P.y = -0.05; P.face = 1; };
})();
