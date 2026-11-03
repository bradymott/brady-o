/* ============================================================
   BRADY GOES TO BURNING MAN — World 17 cast: the tipi-village friends,
   Root Society's crew and the Man's Men (all original characters).
     w17Kev     KOMBUCHA KEV    camp chef, fermentation evangelist, big heart
     w17Pixel   PIXEL           LED tinkerer, deadpan, solders things for fun
     w17Nebula  AUNTIE NEBULA   25th Burn, tea, gossip, cosmic shawl
     w17Granny  GRANNY GRIP     74, roller-disco legend, rides on her skates
     w17Sparky  SPARKY          burn-crew pyro nerd, no eyebrows, safety third
     w17Lookout THE MAN'S MEN   the effigy's fan club: foam Man-head masks, binoculars
   (Jefr, the canonical camp dad, is defined in 42_burns_world17.js so it loads after World 11.)
   Behaviours: w17Helper (a friend joins the fight), w17Lookout (a fan-club scout),
   w17Streamer (the influencer filming her "authentic moments").
   ============================================================ */

(() => {
  if (typeof BurnsRig === 'undefined' || !BurnsRig.defineType) return;
  const R = BurnsRig, B = BURNS_BONES, HD = BurnsRound.HD, hp = BurnsRound.headPt;

  /* ---------- gear ---------- */
  R.defineAcc('w17Apron', (m, A) => {   // Kev's chef apron: bib + skirt, neck strap, waist ties
    const h = A.h, w = A.w;
    m.setBone(B.CHEST); m.color('#f4efe2').shine(0);
    const p = A.torsoPt(0, 0.25 * h, 0.014);
    m.roundBox(p[0], p[1], p[2], 0.25 * w, 0.22 * h, 0.022, 0.01);
    if (!A.lo) { m.color('#c86a3a'); m.roundBox(p[0], p[1] + 0.02, p[2] + 0.013, 0.09, 0.06, 0.008, 0.004); }
    m.color('#e8e0d0'); for (const sd of [-1, 1]) { const a = A.torsoPt(sd * 0.32, 0.36 * h, 0.012), b = A.torsoPt(sd * 0.95, 0.46 * h, 0.012); m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.012, 0.012, { seg: 4 }); }
    m.setBone(B.HIPS); m.color('#f4efe2');
    m.roundBox(0, -0.15, 0.15 * w + 0.03, 0.34 * w, 0.32, 0.024, 0.012);
    m.color('#e8e0d0'); m.push(); m.tf(0, 0.03, 0, 0, 0, 0, 1, 1, 0.8); m.torus(0, 0, 0, 0.185 * w, 0.012, { seg: A.lo ? 10 : 16, tseg: 3 }); m.pop();
    m.shine(0);
  });
  R.defineAcc('w17Skates', (m, A) => {  // Granny's roller skates: plates, four wheels, a toe stop
    for (const sd of [1, -1]) {
      m.setBone(sd > 0 ? B.FOOT_L : B.FOOT_R);
      m.color('#d8d8e2').shine(2); m.roundBox(0, -0.085, 0.05, 0.075, 0.026, 0.25, 0.01);
      m.color('#ff4fd8').shine(1);
      for (const z of [-0.045, 0.145]) for (const x of [-0.04, 0.04]) { m.push(); m.tf(x, -0.11, z, 0, 0, Math.PI / 2); m.roundCyl(0, -0.012, 0, 0.033, 0.024, 0.008, { seg: A.lo ? 6 : 10 }); m.pop(); }
      m.color('#ff3b5c'); m.ball(0, -0.085, 0.2, 0.026, { seg: 6, rings: 4 });
      m.shine(0);
    }
  });
  R.defineAcc('w17ManHead', (m, A) => { // a foam Man-head mask: a soft diamond with a neon outline
    m.setBone(B.HEAD);
    const cy = HD.cy + 0.02, cz = HD.cz + 0.01, H0 = -0.16, H1 = 0.56, W = 0.27;
    m.color('#8a5a34').shine(0);
    m.push(); m.tf(0, cy, cz); m.lathe([[0, H0], [W, 0.18], [0, H1]], { seg: 4 }); m.pop();
    // neon outline along the four front edges + eyes
    const pts = [[0, cy + H1, cz + 0.002], [-W * 1.0, cy + 0.18, cz], [0, cy + H0, cz + 0.002], [W * 1.0, cy + 0.18, cz]];
    m.color('#38f2ff', 1);
    for (let i = 0; i < 4; i++) { const a = pts[i], b = pts[(i + 1) % 4], f = 0.02; m.limb(a[0] * 0.98, a[1], a[2] + W * 0.55 * (1 - Math.abs(a[1] - cy - 0.18) / 0.4) + f, b[0] * 0.98, b[1], b[2] + W * 0.55 * (1 - Math.abs(b[1] - cy - 0.18) / 0.4) + f, 0.012, 0.012, { seg: 4 }); }
    m.color('#ff4fd8', 1); for (const sx of [-1, 1]) m.ball(sx * 0.07, cy + 0.2, cz + W * 0.62, 0.028, { seg: 6, rings: 4 });
    m.emissive(0);
  });
  R.defineAcc('w17Binocs', (m, A) => {  // binoculars on a strap
    m.setBone(B.CHEST); const h = A.h, p = A.torsoPt(0, 0.3 * h, 0.06);
    m.color('#1a1a20').shine(2);
    for (const sx of [-0.035, 0.035]) { m.push(); m.tf(p[0] + sx, p[1], p[2], 0, Math.PI / 2); m.roundCyl(0, -0.05, 0, 0.03, 0.1, 0.008, { seg: A.lo ? 6 : 10 }); m.pop(); }
    m.color('#3a2a1a'); const a = A.torsoPt(-0.6, 0.45 * h, 0.01), b = A.torsoPt(0.6, 0.45 * h, 0.01);
    m.limb(a[0], a[1], a[2], p[0] - 0.04, p[1] + 0.03, p[2], 0.008, 0.008, { seg: 3 }); m.limb(b[0], b[1], b[2], p[0] + 0.04, p[1] + 0.03, p[2], 0.008, 0.008, { seg: 3 });
    m.shine(0);
  });
  R.defineAcc('w17Keys', (m, A) => {    // a carabiner with forty keys on the hip (Jefr knows what every one opens)
    m.setBone(B.HIPS); const w = A.w;
    m.color('#c8c8d0').shine(3); m.push(); m.tf(0.19 * w, -0.04, 0.05, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.035, 0.007, { seg: 10, tseg: 3 }); m.pop();
    if (!A.lo) { m.color('#d8b84a'); for (let i = 0; i < 5; i++) m.roundBox(0.2 * w + (i - 2) * 0.012, -0.1 - (i % 2) * 0.01, 0.06 + (i - 2) * 0.006, 0.012, 0.05, 0.004, 0.003); }
    m.shine(0);
  });
  R.defineHat('w17Headlamp', (m, A, H) => {  // Pixel's headlamp band
    m.color('#1a1a22').shine(1);
    m.push(); m.tf(0, HD.cy + 0.09, HD.cz, 0, -0.12); m.torus(0, 0, 0, 0.205, 0.016, { seg: A.lo ? 12 : 18, tseg: 3, sy: 1.4 }); m.pop();
    const p = hp(0, 0.95, 0.03); m.color('#2a2a32'); m.roundBox(p[0], p[1], p[2], 0.08, 0.05, 0.04, 0.012);
    m.color('#fff6d8', 1); m.roundCyl(p[0], p[1] - 0.02, p[2] + 0.018, 0.022, 0.012, 0.004, { seg: 8 }); m.emissive(0); m.shine(0);
  });
  R.defineProp('w17Jar', (m, A) => {    // Kev's kombucha jar (a cloth lid, a rubber band, a SCOBY floating)
    m.push(); m.tf(0, -0.12, 0.07);
    m.color('#d8a24a', 0.08).shine(3); m.lathe([[0, 0], [0.068, 0], [0.074, 0.03], [0.074, 0.15], [0.05, 0.18], [0.05, 0.2], [0, 0.2]], { seg: A.lo ? 8 : 12 });
    m.color('#f4ead0').shine(0); m.ellipsoid(0, 0.205, 0, 0.065, 0.02, 0.065, { seg: 8, rings: 3, phi1: Math.PI / 2 });
    m.color('#e85a8a'); m.push(); m.tf(0, 0.19, 0); m.torus(0, 0, 0, 0.052, 0.006, { seg: 10, tseg: 3 }); m.pop();
    m.pop(); m.shine(0); m.emissive(0);
  });
  R.defineProp('w17Igniter', (m, A) => {  // Sparky's long-reach lighter wand
    m.color('#c83a2a').shine(2); m.roundBox(0, -0.06, 0.03, 0.035, 0.05, 0.12, 0.012);
    m.color('#c8c8d0').shine(3); m.limb(0, -0.05, 0.09, 0, -0.05, 0.42, 0.01, 0.008, { seg: 5 });
    m.color('#ff9a3a', 1); m.ball(0, -0.05, 0.44, 0.022, { seg: 6, rings: 4 }); m.emissive(0); m.shine(0);
  });
  R.defineProp('w17Teacup', (m, A) => {   // a tiny clay teacup
    m.push(); m.tf(0, -0.07, 0.06); m.color('#a8603a').shine(1); m.lathe([[0, 0], [0.03, 0], [0.045, 0.05], [0.042, 0.055], [0, 0.04]], { seg: A.lo ? 8 : 12 }); m.pop(); m.shine(0);
  });
  R.defineProp('w17HugSign', (m, A) => {  // a cardboard FREE HUGS sign on a stick
    m.color('#8a6a4a'); m.limb(0, -0.05, 0.05, 0, 0.55, 0.05, 0.012, 0.012, { seg: 4 });
    m.color('#e8c890'); m.roundBox(0, 0.62, 0.06, 0.42, 0.26, 0.012, 0.01);
    m.color('#ff3b7a', 0.3); m.push(); m.tf(-0.1, 0.62, 0.068); m.extrude([[0.06, 0.0], [0.03, 0.05], [0, 0.02], [-0.03, 0.05], [-0.06, 0.0], [0, -0.06]], 0.008, { convex: false }); m.pop(); m.emissive(0);
  });

  /* ---------- the friends ---------- */
  R.defineType('w17Kev', { anim: 'idle', lines: ['Everything is alive if you ferment it long enough.', 'Hydrate. With kombucha. It counts.', 'My SCOBY has a name. Don\'t make it weird.'],
    spec(s) {
      s.face = 'goofy'; s.skin = '#e8b48c'; s.skinSh = '#c8906a'; s.body = { h: 1.0, w: 1.2 };
      s.hair = { style: 'curly', col: '#c8642a', hi: '#ea8a4c' }; s.beard = { col: '#c8642a', len: 0.07 };
      s.hat = { kind: 'bandana', col: '#3a8a5a' }; s.glasses = null; s.goggles = false;
      s.top = { kind: 'tank', col: '#efe6d6', pattern: 'tiedye' }; s.bottom = { kind: 'shorts', col: '#3a5a3a', cargo: true };
      s.shoes = { kind: 'sandals', col: '#6a4a2a' }; s.acc = ['w17Apron', 'beads', 'kandi']; s.prop = 'w17Jar';
    } });
  R.defineType('w17Pixel', { anim: 'idle', lines: ['I soldered my bike to my bike. It\'s a better bike.', 'Everything here runs on LEDs and spite.', 'Brightness is a moral choice.'],
    spec(s) {
      s.face = 'smug'; s.skin = '#d9a27c'; s.skinSh = '#b87e5a'; s.body = { h: 0.96, w: 0.9 };
      s.hair = { style: 'spiky', col: '#38d8c8', hi: '#a8fff4' }; s.beard = null;
      s.hat = { kind: 'w17Headlamp', col: '#1a1a22' }; s.glasses = 'round'; s.goggles = false;
      s.top = { kind: 'hoodie', col: '#2a2a3a' }; s.led = '#38f2ff'; s.bottom = { kind: 'cargo', col: '#1c1c24', cargo: true };
      s.shoes = { kind: 'hightops', col: '#ff4fd8', laces: true }; s.acc = ['toolbelt', 'crossbag', 'kandi']; s.prop = 'flashlight';
    } });
  R.defineType('w17Nebula', { anim: 'idle', lines: ['Twenty-fifth Burn, sweetie. I\'ve seen things. Mostly sunrises.', 'Tea fixes everything except dust. Dust fixes nothing.', 'Did you hear about the guy at the dome? Of course you didn\'t. Sit.'],
    spec(s) {
      s.face = 'mom'; s.skin = '#c99268'; s.skinSh = '#a87048'; s.body = { h: 0.95, w: 1.08, fem: true };
      s.hair = { style: 'bun', col: '#dcdce8', hi: '#ffffff' }; s.glasses = 'round'; s.lensCol = '#9a6bff'; s.goggles = false; s.beard = null;
      s.top = { kind: 'long', col: '#4a2e7a' }; s.coat = { kind: 'kimono', col: '#6e44a6', pattern: 'sequin' };
      s.bottom = { kind: 'leggings', col: '#26264a', pattern: 'rainbow' }; s.shoes = { kind: 'sneakers', col: '#ff8ad8' };
      s.acc = ['beads', 'ledNecklace', 'bracelets', 'kandi']; s.prop = 'w17Teacup';
    } });
  R.defineType('w17Granny', { anim: 'idle', lines: ['Seventy-four years old and I\'ve never once walked anywhere.', 'Hips are a state of mind, honey.', 'Roll with it. Literally.'],
    spec(s) {
      s.face = 'toothy'; s.skin = '#f0caa8'; s.skinSh = '#d4a684'; s.body = { h: 0.92, w: 0.96, fem: true };
      s.hair = { style: 'curly', col: '#f4f4fa', hi: '#ffffff' }; s.hat = { kind: 'bandana', col: '#ff3b5c' }; s.glasses = 'shades'; s.goggles = false; s.beard = null;
      s.top = { kind: 'tank', col: '#ffd84a' }; s.bottom = { kind: 'shorts', col: '#ff4fd8', fade: '#ffd84a' };
      s.socks = { col: '#ffffff', stripe: '#ff3b5c' }; s.shoes = { kind: 'sneakers', col: '#ffffff' };
      s.acc = ['w17Skates', 'kneepads', 'bracelets', 'watch']; s.prop = null;
    } });
  R.defineType('w17Sparky', { anim: 'idle', lines: ['Safety third! First is vibes. Second is also vibes.', 'I haven\'t had eyebrows since 2019.', 'Everything burns eventually. Art just does it on purpose.'],
    spec(s) {
      s.face = 'toothy'; s.skin = '#b47c54'; s.skinSh = '#92603c'; s.body = { h: 1.04, w: 1.0 };
      s.hair = { style: 'buzz', col: '#2a2018' }; s.beard = { col: '#2a2018', len: 0.03, trim: true }; s.goggles = 'brass'; s.glasses = null;
      s.top = { kind: 'long', col: '#c8a878' }; s.vest = 'patches'; s.vestCol = '#5a4a3a';
      s.bottom = { kind: 'cargo', col: '#6a5a44', cargo: true }; s.shoes = { kind: 'workboots', col: '#5a3a22', laces: true }; s.gloves = '#3a3a3a';
      s.acc = ['utilityBelt', 'bandana']; s.prop = 'w17Igniter';
    } });
  // the Man's Men: the effigy's fan club (cardboard-and-foam Man heads, binoculars, matching tees)
  R.defineType('w17Lookout', { anim: 'idle', lines: ['Have you seen a guy with a bun? Asking for a giant.', 'The Man is my hero. He\'s so... tall.', 'Fan club rules: no autographs until he burns.'],
    spec(s, r) {
      s.face = 'friendly'; s.hood = true; s.hat = null; s.glasses = null; s.goggles = false; s.beard = null;
      s.top = { kind: 'tee', col: r.pick(['#c89a62', '#b8865a', '#d0a46a']) }; s.bottom = { kind: 'cargo', col: r.pick(['#5a4a3a', '#4a3a2a']) };
      s.shoes = { kind: 'boots', col: '#3a2a1a' }; s.acc = ['w17ManHead', 'w17Binocs']; s.prop = null;
    } });
})();

/* ---------------- behaviours ---------------- */
(() => {
  if (typeof BurnsBehaviors === 'undefined') return;
  const RB = BurnsBehaviors;
  // a friend joins the fight: run to the nearest lookout, wind up, bonk (the player still does most of the work)
  RB.register('w17Helper', {
    init(a) { a.data.cd = 1.5 + Math.random() * 2; a.data.tgt = null; },
    update(a, g, dt) {
      const D = a.data; D.cd -= dt;
      if (!D.tgt || D.tgt.defeated || D.tgt.removed || D.tgt.hidden) { D.tgt = null; let bd = 26; for (const o of g.actors) { if (o.def.tag !== 'w17lookout' || o.defeated || o.hidden || o.removed) continue; const d = Math.hypot(o.x - a.x, o.z - a.z); if (d < bd) { bd = d; D.tgt = o; } } }
      const t = D.tgt;
      if (!t) { const p = g.player, d = a.moveTo(p.x + 2, p.z + 2, 3.5, dt, 2.5); a.ch.play(d > 2.6 ? 'run' : 'cheer'); a.physics(dt); return; }
      const d = a.moveTo(t.x, t.z, a.def.helpSpeed || 4.2, dt, 1.3);
      if (d > 1.5) a.ch.play('run', { rate: 0.9 });
      else {
        a.face(t.x, t.z, dt, 8);
        if (D.cd <= 0) { D.cd = 3.2 + Math.random() * 1.6; a.ch.play(a.def.helpAnim || 'spin', null, true); a.say(a.def.helpLine || 'HEY!', 1.2); g.fx.burst(t.x, t.y + 1.2, t.z, 'star', 8, a.def.helpCol || '#ffd84a'); burnsSfx('spin', { vol: 0.4 }); t.hit('spin', a.x, a.z); }
        else a.ch.play('idle');
      }
      a.physics(dt);
    }
  });
  // a fan-club lookout: creeps about with binoculars, then charges when he spots the bun
  RB.register('w17Lookout', {
    init(a) { a.data.mode = 'sneak'; a.data.t = Math.random() * 3; a.data.cd = 0; },
    update(a, g, dt) {
      const D = a.data, p = g.player, d = a.distP(); D.t -= dt; D.cd -= dt;
      if (D.mode === 'sneak') {
        if (!D.tx || D.t <= 0) { D.t = 2 + Math.random() * 2; const th = Math.random() * TAU; D.tx = a.home.x + Math.cos(th) * 5; D.tz = a.home.z + Math.sin(th) * 5; }
        const dd = a.moveTo(D.tx, D.tz, 1.6, dt, 0.5); a.ch.play(dd > 0.6 ? 'walk' : 'photo');
        if (d < (a.def.aggro || 10) && !g.cine) { D.mode = 'charge'; a.say(['BUN SPOTTED!', 'IT\'S HIM! THE BUN!', 'For the Man!', 'Tell him I said hi!'][Math.floor(Math.random() * 4)], 1.4); burnsSfx('yell', { vol: 0.5 }); }
      } else {
        a.moveTo(p.x, p.z, a.def.chaseSpeed || 3.5, dt, 0.5); a.ch.play('run', { rate: 0.85 });
        if (d > 18) D.mode = 'sneak';
        RB.contact(a, g, 1);
      }
      a.physics(dt);
    }
  });
  // the influencer: films her set facing one way (a vision cone); from behind she never notices you
  RB.register('w17Streamer', {
    init(a) { a.data.t = 0; a.data.look = a.yaw; },
    update(a, g, dt) {
      const D = a.data; D.t += dt;
      // she sways her aim a little while she narrates
      a.yaw = (a.def.aimYaw !== undefined ? a.def.aimYaw : a.home.yaw) + Math.sin(D.t * 0.7) * 0.45;
      a.ch.play(a.def.hasPhone === false ? 'idle' : 'photo');
      if (a.def.hasPhone !== false && Math.random() < dt * 0.25) a.say(['Hey besties! LIVE from the playa!', 'Like and subscribe for more authenticity!', 'This dust is SO on brand.', 'Tag me in your awakening!'][Math.floor(Math.random() * 4)], 2);
      a.vx = a.vz = 0; a.physics(dt);
    }
  });
})();
