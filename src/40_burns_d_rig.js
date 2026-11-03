/* ============================================================
   BRADY GOES TO BURNING MAN — character rigs
   Rigid-part puppets (beveled boxes, capsules) skinned to 16 bones.
   One model (geometry) per spec, cached; many BurnsChar instances can
   share a model. Animation is procedural: BURNS_ANIMS[name](P, t, k)
   writes per-bone Euler angles + root offsets; instances cross-fade.
   Bone-local authoring: each part is built with its joint at the origin.
   Limb conventions (limbs hang along -Y, character faces +Z):
     forward swing = negative rx, knee bend = positive rx (shin),
     elbow bend = negative rx (forearm), left arm (+X) out = positive rz.
   ============================================================ */

const BURNS_BONES = { HIPS: 0, CHEST: 1, HEAD: 2, UARM_L: 3, FARM_L: 4, UARM_R: 5, FARM_R: 6, THIGH_L: 7, SHIN_L: 8, FOOT_L: 9, THIGH_R: 10, SHIN_R: 11, FOOT_R: 12, PROP: 13, HAIR: 14, TAIL: 15 };
const BURNS_PARENT = [-1, 0, 1, 1, 3, 1, 5, 0, 7, 8, 0, 10, 11, 6, 2, 0];
const BURNS_NB = 16;

function burnsBody(p) {
  p = p || {};
  const h = p.h || 1, w = p.w || 1;
  return {
    h, w,
    off: [
      [0, 0.88 * h, 0], [0, 0.06 * h, 0], [0, 0.50 * h, 0],
      [0.21 * w + 0.02, 0.43 * h, 0], [0, -0.27 * h, 0], [-(0.21 * w + 0.02), 0.43 * h, 0], [0, -0.27 * h, 0],
      [0.1 * w, -0.02, 0], [0, -0.41 * h, 0], [0, -0.39 * h, 0], [-0.1 * w, -0.02, 0], [0, -0.41 * h, 0], [0, -0.39 * h, 0],
      [0, -0.27 * h, 0.03], [0, 0.34, -0.12], [0, 0.02, -0.13]
    ],
    headY: 0.88 * h + 0.06 * h + 0.5 * h + 0.18,
    height: 0.88 * h + 0.06 * h + 0.5 * h + 0.4
  };
}

/* ---------------- model building ---------------- */
const BurnsRig = {
  cache: {},
  model(spec) {
    const key = spec.key || JSON.stringify(spec);
    let m = this.cache[key];
    if (!m) { m = this.buildHuman(spec); this.cache[key] = m; }
    return m;
  },
  // Brady from Save.data.look + costume id
  bradySpec(costume) {
    const look = (Save.data && Save.data.look) || {};
    const skin = SKIN_TONES[look.skin] || SKIN_TONES[1], hair = HAIR_COLORS[look.hair] || HAIR_COLORS[0];
    return {
      kind: 'brady', face: look.beard === false ? 'bradyClean' : 'brady', skin: skin.base, skinSh: skin.sh,
      hair: { style: look.style === 'down' ? 'down' : 'bun', col: hair.base, hi: hair.hi },
      glasses: look.glasses || 'shades', tattoos: look.tattoos !== false,
      top: { kind: 'tee', col: '#17161d' }, bottom: { kind: 'jeans', col: '#14141c' }, shoes: { kind: 'sneakers', col: '#0d0d11', sole: '#3a3a46' },
      costume: costume || 'none', body: { h: 1, w: 1.04 }
    };
  },
  chinkaSpec() {
    return {
      kind: 'chinka', face: 'chinka', skin: '#dcaa86', skinSh: '#b8835e', hair: { style: 'wavy', col: '#241612', hi: '#5a3a2c' },
      glasses: 'shades', top: { kind: 'tee', col: '#7a5644' }, bottom: { kind: 'leggings', col: '#141218' }, shoes: { kind: 'sneakers', col: '#f4f4f0', sole: '#c8c8d0' },
      acc: ['ledNecklace', 'bracelets'], body: { h: 0.94, w: 0.88 }
    };
  },
  /* NPC archetypes. type: burner | furcoat | tutu | ledsuit | greeter | gate | campLead | driver | ranger | dpw |
     techbro | sparklepony | influencer | crusty. seed varies colours/accessories. */
  npcSpec(type, seed) {
    const r = mulberry32(hashStr(type + ':' + (seed || 0)));
    const skinT = SKIN_TONES[Math.floor(r() * SKIN_TONES.length)];
    const hairC = HAIR_COLORS[Math.floor(r() * 8)];
    const neon = () => r.pick(BURNS_NEON);
    const s = { kind: type, seed, skin: skinT.base, skinSh: skinT.sh, hair: { style: r.pick(['short', 'long', 'pony', 'short', 'bald', 'mohawk', 'afro', 'buzz']), col: hairC.base, hi: hairC.hi }, face: r.pick(['friendly', 'goofy', 'lashes', 'friendly']), body: { h: 0.92 + r() * 0.14, w: 0.88 + r() * 0.24 }, acc: [] };
    const pickTop = (kinds) => ({ kind: r.pick(kinds), col: neon(), col2: neon() });
    switch (type) {
      case 'burner':
        s.top = r.chance(0.45) ? { kind: 'none' } : pickTop(['tank', 'crop', 'vest', 'tee']);
        if (s.top.kind === 'none' && r.chance(0.6)) s.paint = r.pick(['led', 'rainbow', 'tiedye']);
        s.bottom = { kind: r.pick(['shorts', 'kilt', 'leggings', 'shorts']), col: r.pick(['#2a2a34', '#5a3a2a', neon(), '#1a1a1a']) };
        s.shoes = { kind: r.pick(['boots', 'sneakers', 'furboots']), col: r.pick(['#3a2a1a', '#1a1a1a', neon()]) };
        s.hat = r.chance(0.5) ? { kind: r.pick(['cowboy', 'furhat', 'bandana', 'cap', 'tophat']), col: r.pick(['#8a5a2a', '#f4f0ff', neon(), '#1a1a1a']) } : null;
        s.goggles = r.chance(0.5); s.glasses = r.chance(0.4) ? 'shades' : null;
        if (r.chance(0.4)) s.acc.push('ledNecklace');
        if (r.chance(0.3)) s.acc.push('cape');
        break;
      case 'furcoat':
        s.top = { kind: 'tee', col: '#1a1a1a' }; s.coat = { kind: 'fur', col: r.pick(['#ff8ad8', '#f4f0ff', '#9a6bff', '#ffd84a', '#38f2ff', '#c8a070']), trim: '#ffffff' };
        s.bottom = { kind: 'jeans', col: '#1a1a22' }; s.shoes = { kind: 'boots', col: '#1a1a1a' };
        s.hat = r.chance(0.5) ? { kind: 'furhat', col: '#f4f0ff' } : null; s.glasses = 'shades'; s.goggles = !s.hat && r.chance(0.5);
        break;
      case 'tutu':
        s.top = { kind: r.pick(['tank', 'crop']), col: neon() }; s.bottom = { kind: 'tutu', col: r.pick(['#ff9ad0', '#9adcff', '#ffe28a', '#c8a0ff']) };
        s.shoes = { kind: 'furboots', col: r.pick(['#ff9ad0', '#ffffff', '#38f2ff']) }; s.goggles = true; s.hair.style = r.pick(['long', 'pony', 'afro', 'wig']);
        if (s.hair.style === 'wig') s.hair.col = r.pick(['#ff9ad0', '#9adcff', '#c8a0ff']);
        break;
      case 'ledsuit':
        s.top = { kind: 'tee', col: '#14141c' }; s.bottom = { kind: 'leggings', col: '#14141c' }; s.shoes = { kind: 'sneakers', col: '#14141c', sole: '#333' };
        s.led = neon(); s.acc.push('ledNecklace'); s.glasses = 'shades';
        break;
      case 'greeter':
        s.top = { kind: 'tee', col: '#ff8a3a', pattern: 'tiedye' }; s.bottom = { kind: r.pick(['shorts', 'kilt', 'tutu']), col: r.pick(['#3a6aff', '#ff4fd8', '#2a2a34']) };
        s.shoes = { kind: 'boots', col: '#6a4a2a' }; s.face = 'greeter'; s.acc.push('lei'); s.prop = 'bell'; s.hat = r.chance(0.5) ? { kind: 'cowboy', col: '#f4e8d0' } : null;
        s.body.w = 1.0 + r() * 0.25;
        break;
      case 'gate':
        s.top = { kind: 'tee', col: '#2a2a34' }; s.vest = 'hivis'; s.bottom = { kind: 'cargo', col: '#4a4a3a' }; s.shoes = { kind: 'boots', col: '#2a1a10' };
        s.hat = { kind: 'cap', col: '#1a1a2a' }; s.face = 'stern'; s.prop = 'radio';
        break;
      case 'campLead':
        s.top = { kind: 'tee', col: r.pick(['#ff4fd8', '#ffe24a', '#38f2ff', '#ff7a2a']) }; s.bottom = { kind: 'cargo', col: '#6a6a4a' };
        s.shoes = { kind: 'boots', col: '#3a2a1a' }; s.face = 'stressed'; s.prop = 'clipboard'; s.acc.push('headset');
        break;
      case 'driver':
        s.top = { kind: 'hoodie', col: r.pick(['#5a5a64', '#3a4a5a', '#5a3a3a', '#4a5a3a']) }; s.bottom = { kind: 'jeans', col: '#3a3a4a' };
        s.shoes = { kind: 'sneakers', col: '#8a8a8a' }; s.face = 'tired'; s.prop = 'coffee'; s.hair.style = r.pick(['short', 'long', 'buzz']);
        break;
      case 'ranger':
        s.top = { kind: 'button', col: '#b8a070' }; s.bottom = { kind: 'cargo', col: '#6a5a3a' }; s.shoes = { kind: 'boots', col: '#3a2a1a' };
        s.hat = { kind: 'ranger', col: '#8a6a3a' }; s.face = 'stern'; s.prop = 'radio'; s.glasses = 'shades';
        break;
      case 'dpw':
        s.top = { kind: 'tee', col: '#6a5a4a' }; s.vest = 'hivis'; s.bottom = { kind: 'cargo', col: '#5a4a3a' }; s.shoes = { kind: 'boots', col: '#2a1a10' };
        s.hat = { kind: 'hardhat', col: '#ff8a1a' }; s.face = 'beard'; s.hair.col = '#5a4a3a'; s.acc.push('toolbelt'); s.body.w = 1.1 + r() * 0.2;
        break;
      case 'techbro':
        s.top = { kind: 'button', col: '#9ac0e8' }; s.vest = 'fleece'; s.vestCol = r.pick(['#2a3a5a', '#4a4a52', '#1a2a3a']);
        s.bottom = { kind: 'chinos', col: '#c8b48a' }; s.shoes = { kind: 'sneakers', col: '#f4f4f4', sole: '#e0e0e0' };
        s.face = 'smug'; s.prop = 'phone'; s.acc.push('earbuds'); s.hair.style = r.pick(['short', 'buzz']); s.glasses = r.chance(0.3) ? 'shades' : null;
        break;
      case 'sparklepony':
        s.top = { kind: 'crop', col: r.pick(['#ff9ad0', '#c8a0ff', '#9adcff']), pattern: 'sequin' }; s.bottom = { kind: 'shorts', col: '#f4f0ff', pattern: 'sequin' };
        s.shoes = { kind: 'furboots', col: r.pick(['#ff9ad0', '#ffffff', '#c8a0ff']) }; s.hair = { style: 'wig', col: r.pick(['#ff9ad0', '#c8a0ff', '#9adcff', '#ffe28a']), hi: '#ffffff' };
        s.face = 'lashes'; s.acc.push('wings'); s.glasses = r.chance(0.5) ? 'heart' : null; s.body.w = 0.85; s.body.h = 0.94;
        break;
      case 'influencer':
        s.top = { kind: 'tee', col: '#f4f0e8' }; s.coat = { kind: 'kimono', col: r.pick(['#ffd0e0', '#e8d0ff', '#fff0c8']), trim: '#ffffff' };
        s.bottom = { kind: 'shorts', col: '#e8d8c0' }; s.shoes = { kind: 'sneakers', col: '#ffffff', sole: '#e8e8e8' }; s.face = 'lashes'; s.prop = 'ringlight'; s.glasses = 'shades';
        s.hair = { style: r.pick(['long', 'wig', 'pony']), col: r.pick(['#e8c870', '#3a2a1a', '#ff9ad0']), hi: '#ffffff' }; s.hat = r.chance(0.5) ? { kind: 'cowboy', col: '#f4f0e8' } : null;
        break;
      case 'crusty':
        s.top = { kind: 'tee', col: '#6a5a4a' }; s.vest = 'patches'; s.bottom = { kind: 'cargo', col: '#5a5040' }; s.shoes = { kind: 'boots', col: '#3a2a1a' };
        s.coat = r.chance(0.5) ? { kind: 'duster', col: '#8a7a5a', trim: '#6a5a40' } : null;
        s.hat = { kind: 'cowboy', col: '#7a6a4a' }; s.goggles = true; s.face = r.pick(['beard', 'grumpy']); s.hair = { style: 'long', col: '#b8b8b8', hi: '#e8e8e8' };
        break;
      default:
        s.top = pickTop(['tee', 'tank']); s.bottom = { kind: 'shorts', col: '#2a2a34' }; s.shoes = { kind: 'sneakers', col: '#2a2a2a' };
    }
    s.key = 'npc:' + type + ':' + (seed || 0);
    return s;
  },
  buildHuman(S) {
    const m = new BurnsMesh(4096), B = BURNS_BONES;
    const body = burnsBody(S.body);
    const h = body.h, w = body.w;
    const skin = S.skin || '#e8b996', skinSh = S.skinSh || shade(skin, -0.12);
    const costume = S.costume && S.costume !== 'none' ? S.costume : null;
    let top = Object.assign({ kind: 'tee', col: '#222' }, S.top || {});
    let bot = Object.assign({ kind: 'jeans', col: '#222' }, S.bottom || {});
    let shoe = Object.assign({ kind: 'sneakers', col: '#222', sole: '#444' }, S.shoes || {});
    const C = { top: top.col, bot: bot.col, shoe: shoe.col, sole: shoe.sole || shade(shoe.col, -0.3) };
    // costume recolours (Brady)
    if (costume === 'spaceman') { C.top = '#e8eef8'; C.bot = '#e8eef8'; C.shoe = '#b8c0d0'; C.sole = '#6a7080'; }
    if (costume === 'unicorn') { C.top = '#f6f0ff'; C.bot = '#f6f0ff'; C.shoe = '#ffb0e0'; C.sole = '#ff8ad0'; }
    if (costume === 'disco') { C.top = '#c8d0e0'; C.bot = '#c8d0e0'; C.shoe = '#e8e8f0'; C.sole = '#9aa0b0'; }
    const topSkin = top.kind === 'none';
    const tatt = S.tattoos ? BURNS_ATLAS.pattern('tattoo') : null;
    const cosPat = costume === 'disco' ? BURNS_ATLAS.pattern('disco') : costume === 'unicorn' ? null : null;
    const topPat = top.pattern ? BURNS_ATLAS.pattern(top.pattern) : cosPat;
    const botPat = bot.pattern ? BURNS_ATLAS.pattern(bot.pattern) : costume === 'disco' ? BURNS_ATLAS.pattern('disco') : bot.kind === 'jeans' ? BURNS_ATLAS.pattern('denim') : null;
    const paint = S.paint ? BURNS_ATLAS.pattern(S.paint) : null;

    /* ---------- hips / pelvis ---------- */
    m.setBone(B.HIPS).color(C.bot);
    m.bbox(0, -0.03, 0, 0.36 * w, 0.2, 0.23, 0.045);
    if (bot.kind === 'jeans' || bot.kind === 'cargo' || bot.kind === 'chinos') { m.color('#0a0a0e'); m.box(0, 0.065, 0, 0.365 * w, 0.035, 0.235); m.color('#8a8a90'); m.box(0, 0.065, 0.118, 0.05, 0.03, 0.01); }
    if (bot.kind === 'kilt') { m.color(bot.col); m.box(0, -0.2, 0, 0.42 * w, 0.32, 0.3, { taper: 0.85 }); }
    if (bot.kind === 'tutu') {
      m.color(bot.col); m.cyl(0, -0.12, 0, 0.36, 0.2, 0.1, 12, { caps: true });
      m.color(shade(bot.col, 0.25)); m.cyl(0, -0.06, 0, 0.32, 0.18, 0.08, 12, { yaw0: 0.26 });
    }
    if (costume === 'tutu') {
      m.color('#ff9ad0'); m.cyl(0, -0.13, 0, 0.38, 0.22, 0.11, 14, {});
      m.color('#ffd0ea'); m.cyl(0, -0.06, 0, 0.34, 0.2, 0.09, 14, { yaw0: 0.22 });
      m.color('#ff6ac0'); m.cyl(0, -0.17, 0, 0.4, 0.3, 0.05, 14, { yaw0: 0.11 });
    }
    if (S.acc && S.acc.indexOf('toolbelt') >= 0) { m.color('#5a3a1a'); m.box(0, 0.04, 0, 0.4 * w, 0.06, 0.27); m.color('#9a9a9a'); m.box(0.17 * w, -0.04, 0.08, 0.05, 0.12, 0.06); m.color('#c83a2a'); m.box(-0.17 * w, -0.03, 0.08, 0.04, 0.1, 0.05); }
    if (costume === 'pirate') { m.color('#c8202a'); m.box(0, 0.05, 0, 0.4 * w, 0.09, 0.27); m.box(0.12, -0.1, 0.13, 0.08, 0.22, 0.03); m.color('#c8c8d0'); m.push(); m.tf(-0.2 * w, -0.1, 0.06, 0, 0, 0.35); m.box(0, -0.2, 0, 0.025, 0.42, 0.06); m.color('#d8a020'); m.box(0, 0.02, 0, 0.1, 0.03, 0.08); m.pop(); }

    /* ---------- torso ---------- */
    m.setBone(B.CHEST);
    const torsoCol = topSkin ? skin : C.top;
    m.color(torsoCol);
    const uvTop = topPat ? { uv: topPat, uvFaces: 'sides' } : (paint && topSkin ? { uv: paint, uvFaces: 'pz' } : null);
    m.box(0, 0.12 * h, 0, 0.36 * w, 0.24 * h, 0.23, uvTop || undefined);
    m.bbox(0, 0.345 * h, 0, 0.45 * w, 0.29 * h, 0.26, 0.06, uvTop ? { uv: uvTop.uv, uvFaces: 'pz' } : undefined);
    if (top.kind === 'crop') { m.color(skin); m.box(0, 0.1 * h, 0, 0.34 * w, 0.2 * h, 0.21); }
    if (top.kind === 'tank' || top.kind === 'crop') { m.color(skin); m.box(0, 0.46 * h, 0, 0.43 * w, 0.06, 0.2); }
    if (top.kind === 'tee' || top.kind === 'hoodie' || top.kind === 'button') { m.color(skin); m.box(0, 0.475 * h, 0.06, 0.13, 0.05, 0.12); } // neckline
    if (top.kind === 'hoodie') { m.color(shade(C.top, -0.15)); m.box(0, 0.5 * h, -0.1, 0.36 * w, 0.14, 0.12); m.box(0, 0.18 * h, 0.12, 0.24 * w, 0.12, 0.03); }
    if (top.kind === 'button') { m.color('#ffffff'); for (let i = 0; i < 4; i++) m.box(0, 0.12 + i * 0.09, 0.131, 0.02, 0.02, 0.01); m.color(shade(C.top, -0.1)); m.box(0, 0.47 * h, 0.1, 0.2, 0.05, 0.08); }
    // neck
    m.color(skin); m.cyl(0, 0.44 * h, 0, 0.065, 0.06, 0.1, 7, { smooth: true });
    if (S.vest) {
      const vc = S.vest === 'hivis' ? '#d8ff3a' : S.vest === 'fleece' ? (S.vestCol || '#2a3a5a') : '#5a4a3a';
      m.color(vc);
      const vuv = S.vest === 'hivis' ? { uv: BURNS_ATLAS.pattern('hivis'), uvFaces: 'sides' } : undefined;
      m.box(0, 0.32 * h, -0.07, 0.47 * w, 0.42 * h, 0.13, vuv); // back
      m.box(0.15 * w, 0.32 * h, 0.075, 0.15, 0.42 * h, 0.12, vuv); m.box(-0.15 * w, 0.32 * h, 0.075, 0.15, 0.42 * h, 0.12, vuv);
      if (S.vest === 'patches') { BURNS_NEON.slice(0, 5).forEach((c, i) => { m.color(c); m.box(-0.12 + (i % 3) * 0.12, 0.22 + Math.floor(i / 3) * 0.14, -0.137, 0.08, 0.08, 0.01); }); }
    }
    if (S.led) { m.color(S.led, 1); m.box(0, 0.3 * h, 0.132, 0.03, 0.4 * h, 0.01); m.box(0, 0.48 * h, 0.0, 0.47 * w, 0.025, 0.27); m.box(0, 0.02, 0.0, 0.37 * w, 0.025, 0.25); m.emissive(0); }
    // LED necklace / lei
    if (S.acc && S.acc.indexOf('ledNecklace') >= 0) { for (let i = 0; i < 9; i++) { const a = -1.2 + i / 8 * 2.4; m.color(BURNS_NEON[i % 5], 1); m.box(Math.sin(a) * 0.14, 0.44 * h - Math.cos(a) * 0.05, 0.12 + Math.cos(a) * 0.03, 0.035, 0.035, 0.035); } m.emissive(0); }
    if (S.acc && S.acc.indexOf('lei') >= 0) { for (let i = 0; i < 11; i++) { const a = -1.4 + i / 10 * 2.8; m.color(['#ff4f8a', '#ffe24a', '#ff8a2a', '#ffffff'][i % 4]); m.bbox(Math.sin(a) * 0.17, 0.43 * h - Math.cos(a) * 0.09, 0.1 + Math.cos(a) * 0.05, 0.07, 0.06, 0.06, 0.015); } }
    if (S.acc && S.acc.indexOf('wings') >= 0) { m.color('#f0e0ff', 0.25); m.push(); m.tf(0.12, 0.35, -0.16, 0.5, 0, 0.3); m.box(0.18, 0.05, 0, 0.36, 0.42, 0.015); m.pop(); m.push(); m.tf(-0.12, 0.35, -0.16, -0.5, 0, -0.3); m.box(-0.18, 0.05, 0, 0.36, 0.42, 0.015); m.pop(); m.emissive(0); }
    if (S.acc && S.acc.indexOf('cape') >= 0) { m.color(BURNS_NEON[(S.seed || 0) % 7]); m.box(0, 0.12, -0.17, 0.5 * w, 0.75, 0.03, { taper: 0.7 }); }
    // coats: fur / kimono / duster / pirate (costume)
    const coat = costume === 'furcoat' ? { kind: 'fur', col: '#ff8ad8', trim: '#ffffff' } : costume === 'pirate' ? { kind: 'pirate', col: '#5a2a14', trim: '#d8a020' } : S.coat;
    if (coat) this.coat(m, coat, h, w);
    if (costume === 'spaceman') {
      m.color('#d0d8e8'); m.box(0, 0.3, -0.2, 0.32, 0.36, 0.14); // life support pack
      m.color('#38f2ff', 1); m.box(0.08, 0.38, -0.271, 0.05, 0.05, 0.01); m.color('#ff4fd8', 1); m.box(-0.08, 0.38, -0.271, 0.05, 0.05, 0.01); m.color('#7aff5a', 1); m.box(0, 0.26, -0.271, 0.16, 0.025, 0.01);
      m.color('#38f2ff', 1); m.box(0.14 * w, 0.3 * h, 0.133, 0.025, 0.36 * h, 0.01); m.box(-0.14 * w, 0.3 * h, 0.133, 0.025, 0.36 * h, 0.01); m.emissive(0);
      m.color('#c8d0e0'); m.cyl(0, 0.44 * h, 0, 0.17, 0.15, 0.08, 10, {}); // helmet collar
    }
    if (costume === 'unicorn') { m.color('#ffd0ec'); m.box(0, 0.2 * h, 0.122, 0.22 * w, 0.28 * h, 0.02); }
    if (costume === 'disco') { m.color('#2a1a3a'); m.box(0, 0.47 * h, 0.08, 0.36, 0.06, 0.14, { taper: 1.4 }); }

    /* ---------- head ---------- */
    m.setBone(B.HEAD);
    m.color(skin);
    m.bbox(0, 0.19, 0.0, 0.34, 0.37, 0.33, 0.05);
    m.decal(0, 0.18, 0.1665, 0.26, 0.28, BURNS_ATLAS.face(S.face || 'friendly'));
    m.color(skinSh); m.box(0.175, 0.17, -0.01, 0.04, 0.09, 0.07); m.box(-0.175, 0.17, -0.01, 0.04, 0.09, 0.07); // ears
    m.color(shade(skin, -0.04)); m.box(0, 0.155, 0.18, 0.05, 0.075, 0.045, { taper: 0.6 }); // nose
    this.hair(m, S, costume);
    this.headwear(m, S, costume);

    /* ---------- arms ---------- */
    const sleeve = top.kind === 'tee' || top.kind === 'button' || top.kind === 'hoodie' || costume === 'spaceman' || costume === 'unicorn' || costume === 'disco';
    const longSleeve = top.kind === 'hoodie' || top.kind === 'button' || costume === 'spaceman' || costume === 'unicorn' || costume === 'disco';
    for (const side of [1, -1]) {
      const UA = side > 0 ? B.UARM_L : B.UARM_R, FA = side > 0 ? B.FARM_L : B.FARM_R;
      m.setBone(UA);
      m.color(longSleeve ? C.top : skin);
      m.box(0, -0.135, 0, 0.125, 0.27, 0.125, tatt && !longSleeve ? { uv: tatt, uvFaces: 'sides' } : (longSleeve && topPat ? { uv: topPat, uvFaces: 'sides' } : undefined));
      if (sleeve && !longSleeve) { m.color(C.top); m.bbox(0, -0.045, 0, 0.155, 0.12, 0.155, 0.03); }
      if (S.led) { m.color(S.led, 1); m.box(0, -0.13, 0.064, 0.02, 0.26, 0.01); m.emissive(0); }
      if (costume === 'spaceman') { m.color('#38f2ff', 1); m.box(0.064 * side, -0.13, 0, 0.01, 0.24, 0.025); m.emissive(0); }
      m.setBone(FA);
      m.color(longSleeve ? C.top : skin);
      m.box(0, -0.12, 0, 0.112, 0.245, 0.112, tatt && !longSleeve ? { uv: tatt, uvFaces: 'sides' } : (longSleeve && topPat ? { uv: topPat, uvFaces: 'sides' } : undefined));
      if (longSleeve) { m.color(shade(C.top, -0.12)); m.box(0, -0.235, 0, 0.12, 0.03, 0.12); }
      if (S.led) { m.color(S.led, 1); m.box(0, -0.12, 0.058, 0.02, 0.22, 0.01); m.emissive(0); }
      if (costume === 'tutu') { m.color('#ff9ad0'); m.box(0, -0.13, 0, 0.13, 0.16, 0.13, { uv: BURNS_ATLAS.pattern('fur'), uvFaces: 'sides' }); }
      if (S.acc && S.acc.indexOf('bracelets') >= 0) { m.color(side > 0 ? '#ffd84a' : '#ff7ad8', 0.6); m.box(0, -0.21, 0, 0.125, 0.025, 0.125); m.emissive(0); }
      m.color(costume === 'spaceman' ? '#d0d8e8' : skin); m.bbox(0, -0.29, 0.012, 0.105, 0.11, 0.12, 0.03);
    }
    /* ---------- legs ---------- */
    const legSkin = bot.kind === 'shorts' || bot.kind === 'kilt' || bot.kind === 'tutu';
    for (const side of [1, -1]) {
      const TH = side > 0 ? B.THIGH_L : B.THIGH_R, SH = side > 0 ? B.SHIN_L : B.SHIN_R, FT = side > 0 ? B.FOOT_L : B.FOOT_R;
      m.setBone(TH);
      if (legSkin && costume !== 'unicorn' && costume !== 'spaceman' && costume !== 'disco') { m.color(C.bot); m.box(0, -0.08, 0, 0.18, 0.16, 0.19, botPat ? { uv: botPat, uvFaces: 'sides' } : undefined); m.color(skin); m.box(0, -0.28, 0, 0.155, 0.26, 0.165); }
      else { m.color(C.bot); m.box(0, -0.2, 0, 0.17, 0.42, 0.18, botPat ? { uv: botPat, uvFaces: 'sides' } : undefined); }
      if (S.led) { m.color(S.led, 1); m.box(0.087 * side, -0.2, 0, 0.01, 0.38, 0.025); m.emissive(0); }
      m.setBone(SH);
      const flare = costume === 'disco' ? 1.35 : 1;
      if (legSkin && costume !== 'unicorn' && costume !== 'spaceman' && costume !== 'disco') { m.color(skin); m.box(0, -0.19, 0, 0.14, 0.39, 0.15); }
      else { m.color(C.bot); m.box(0, -0.19, 0, 0.15, 0.4, 0.16, Object.assign({ taper: 1 / flare }, botPat ? { uv: botPat, uvFaces: 'sides' } : {})); }
      if (shoe.kind === 'furboots' || costume === 'tutu') { m.color(costume === 'tutu' ? '#ff9ad0' : shoe.col); m.box(0, -0.25, 0.005, 0.2, 0.3, 0.21, { uv: BURNS_ATLAS.pattern('fur'), uvFaces: 'sides' }); }
      if (shoe.kind === 'boots' || costume === 'pirate') { m.color(costume === 'pirate' ? '#3a2010' : shoe.col); m.box(0, -0.28, 0.005, 0.165, 0.24, 0.175); }
      if (S.led) { m.color(S.led, 1); m.box(0.077 * side, -0.19, 0, 0.01, 0.36, 0.025); m.emissive(0); }
      m.setBone(FT);
      m.color(costume === 'pirate' ? '#3a2010' : (shoe.kind === 'furboots' ? shoe.col : C.shoe));
      m.bbox(0, -0.005, 0.05, 0.15, 0.1, 0.28, 0.035);
      m.color(C.sole); m.box(0, -0.052, 0.05, 0.155, 0.025, 0.285);
      if (shoe.kind === 'sneakers' && !costume) { m.color(shade(C.shoe, 0.25)); m.box(0.077 * side, 0.0, 0.06, 0.005, 0.03, 0.12); }
    }
    /* ---------- held prop ---------- */
    this.prop(m, S.prop);
    /* ---------- tail (unicorn) ---------- */
    if (costume === 'unicorn') { m.setBone(B.TAIL); ['#ff3b5c', '#ffe24a', '#38c8ff', '#9a6bff'].forEach((c, i) => { m.color(c); m.push(); m.tf((i - 1.5) * 0.04, 0, 0, 0, 0.5 + i * 0.08, 0); m.box(0, -0.18, 0, 0.04, 0.38, 0.04); m.pop(); }); }
    const geo = m.geo();
    return { geo, nb: BURNS_NB, body, headY: body.headY, height: body.height, spec: S };
  },
  coat(m, c, h, w) {
    const fur = c.kind === 'fur', B = BURNS_BONES;
    const uv = fur ? { uv: BURNS_ATLAS.pattern(c.col === '#c8a070' ? 'leopard' : 'fur'), uvFaces: 'sides' } : undefined;
    const T = fur ? 0.1 : 0.05;
    m.setBone(B.CHEST); m.color(c.col);
    m.box(0, 0.26 * h, -0.13, 0.5 * w + T, 0.56 * h, 0.06 + T, uv);
    m.box(0.19 * w, 0.26 * h, 0.1, 0.13 + T * 0.5, 0.56 * h, 0.08 + T * 0.5, uv); m.box(-0.19 * w, 0.26 * h, 0.1, 0.13 + T * 0.5, 0.56 * h, 0.08 + T * 0.5, uv);
    m.box(0.25 * w, 0.26 * h, 0, 0.06 + T * 0.5, 0.56 * h, 0.26, uv); m.box(-0.25 * w, 0.26 * h, 0, 0.06 + T * 0.5, 0.56 * h, 0.26, uv);
    m.color(c.trim || '#ffffff');
    if (fur) m.box(0, 0.5 * h, -0.02, 0.56 * w, 0.12, 0.36, { uv: BURNS_ATLAS.pattern('fur'), uvFaces: 'sides' });
    else if (c.kind === 'pirate') { m.box(0.135 * w, 0.26 * h, 0.145, 0.03, 0.56 * h, 0.02); m.box(-0.135 * w, 0.26 * h, 0.145, 0.03, 0.56 * h, 0.02); }
    // skirt panels on the hips
    m.setBone(B.HIPS); m.color(c.col);
    const L = c.kind === 'kimono' ? 0.55 : c.kind === 'duster' || c.kind === 'pirate' ? 0.62 : 0.5;
    m.box(0, -L / 2 + 0.05, -0.15, 0.5 * w + T, L, 0.05 + T * 0.5, uv);
    m.box(0.2 * w, -L / 2 + 0.05, 0.12, 0.13, L, 0.05 + T * 0.5, uv); m.box(-0.2 * w, -L / 2 + 0.05, 0.12, 0.13, L, 0.05 + T * 0.5, uv);
    // sleeves
    for (const side of [1, -1]) {
      m.setBone(side > 0 ? B.UARM_L : B.UARM_R); m.color(c.col); m.box(0, -0.13, 0, 0.16 + T * 0.6, 0.29, 0.16 + T * 0.6, uv);
      m.setBone(side > 0 ? B.FARM_L : B.FARM_R); m.color(c.col); m.box(0, -0.11, 0, 0.15 + T * 0.6, 0.23, 0.15 + T * 0.6, uv);
      m.color(c.trim || c.col); m.box(0, -0.22, 0, 0.17 + T * 0.6, 0.05, 0.17 + T * 0.6, fur ? { uv: BURNS_ATLAS.pattern('fur'), uvFaces: 'sides' } : undefined);
    }
  },
  hair(m, S, costume) {
    const H = S.hair || { style: 'short', col: '#3a2a1a' }, B = BURNS_BONES;
    const col = H.col, hi = H.hi || shade(col, 0.3);
    if (costume === 'spaceman' || costume === 'unicorn') {
      // hood / helmet covers most hair; keep the bun peeking out of the unicorn hood
      if (costume === 'unicorn' && H.style === 'bun') { m.setBone(B.HAIR); m.color(col); m.sphere(0, 0.1, 0.0, 0.085, 7, 5, { smooth: true }); }
      return;
    }
    m.setBone(B.HEAD); m.color(col);
    const style = H.style;
    if (style === 'bald') { m.color(shade(S.skin || '#e8b996', 0.06)); m.box(0, 0.385, -0.01, 0.3, 0.02, 0.28); return; }
    // cap of hair over the skull (leaves the face free)
    const capH = style === 'buzz' ? 0.05 : 0.1;
    m.bbox(0, 0.36 + capH / 2 - 0.02, -0.02, 0.36, capH, 0.35, 0.03);
    m.box(0, 0.24, -0.17, 0.355, 0.26, 0.04);                        // back of the head
    m.box(0.172, 0.27, -0.06, 0.03, 0.16, 0.2); m.box(-0.172, 0.27, -0.06, 0.03, 0.16, 0.2); // sides above the ears
    if (style === 'buzz') return;
    m.color(hi); m.box(0.06, 0.4, 0.06, 0.12, 0.03, 0.14); m.color(col);  // highlight streak
    if (style === 'mohawk') { m.color(BURNS_NEON[(S.seed || 1) % 7]); m.box(0, 0.47, -0.02, 0.06, 0.16, 0.34, { taper: 0.6 }); return; }
    if (style === 'afro') { m.sphere(0, 0.36, -0.04, 0.26, 9, 6, { smooth: true, squash: 0.85 }); return; }
    if (style === 'short') return;
    m.setBone(B.HAIR); m.color(col);
    if (style === 'bun') {
      // Brady's man bun: tight knot at the crown, a hair tie, a couple of loose ends
      m.sphere(0, 0.06, 0.02, 0.09, 8, 6, { smooth: true });
      m.color('#0a0a0e'); m.cyl(0, -0.02, 0.03, 0.055, 0.055, 0.03, 8, {});
      m.color(hi); m.push(); m.tf(0.03, 0.1, -0.02, 0.4, -0.6, 0.3); m.box(0, 0.02, 0, 0.03, 0.07, 0.025); m.pop();
      m.push(); m.tf(-0.04, 0.09, -0.03, -0.5, -0.8, -0.4); m.box(0, 0.02, 0, 0.025, 0.06, 0.025); m.pop();
      return;
    }
    if (style === 'pony') { m.box(0, -0.12, -0.06, 0.08, 0.3, 0.07, { taper: 0.6 }); m.color('#0a0a0e'); m.box(0, 0.02, -0.05, 0.085, 0.03, 0.075); return; }
    if (style === 'down' || style === 'long' || style === 'wig') {
      m.box(0, -0.16, -0.05, 0.36, 0.48, 0.06, { taper: 1.05 });
      m.color(hi); m.box(0, -0.16, -0.085, 0.2, 0.4, 0.01); m.color(col);
      if (style === 'wig') { m.box(0, 0.06, 0.02, 0.4, 0.12, 0.2); }
      return;
    }
    if (style === 'wavy') {
      // Chinka: long dark wavy hair, layered zig-zag panels down the back + front locks
      for (let i = 0; i < 6; i++) { const y = -0.02 - i * 0.09, x = (i % 2 ? 0.02 : -0.02); m.box(x, y, -0.05 - i * 0.004, 0.38 - i * 0.012, 0.11, 0.07); }
      m.color(hi); for (let i = 0; i < 5; i++) m.box((i % 2 ? -0.06 : 0.07), -0.05 - i * 0.09, -0.09, 0.05, 0.08, 0.01);
      m.setBone(B.HEAD); m.color(col);
      for (const sd of [1, -1]) { for (let i = 0; i < 4; i++) m.box(sd * (0.165 + (i % 2) * 0.012), 0.16 - i * 0.1, 0.06, 0.05, 0.12, 0.08); }
      return;
    }
  },
  headwear(m, S, costume) {
    const B = BURNS_BONES;
    m.setBone(B.HEAD);
    // glasses
    const g = costume === 'spaceman' ? 'visor' : S.glasses;
    if (g === 'shades' || g === 'heart') {
      // dark square sunglasses (Brady)
      m.color('#0a0a10');
      m.box(0, 0.215, 0.183, 0.32, 0.03, 0.025);
      const lens = g === 'heart' ? '#ff3b7a' : '#141824';
      m.color(lens, g === 'heart' ? 0.4 : 0.05); m.box(0.075, 0.19, 0.182, 0.12, 0.085, 0.02); m.box(-0.075, 0.19, 0.182, 0.12, 0.085, 0.02); m.emissive(0);
      m.color('#3a4060'); m.box(0.105, 0.215, 0.193, 0.04, 0.012, 0.004); m.box(-0.045, 0.215, 0.193, 0.04, 0.012, 0.004); // glint
      m.color('#0a0a10'); m.box(0.168, 0.21, 0.07, 0.015, 0.02, 0.24); m.box(-0.168, 0.21, 0.07, 0.015, 0.02, 0.24);
    } else if (g === 'clear') {
      m.color('#1a1a22');
      for (const sx of [0.075, -0.075]) { m.box(sx, 0.235, 0.182, 0.12, 0.014, 0.015); m.box(sx, 0.148, 0.182, 0.12, 0.014, 0.015); m.box(sx + 0.058, 0.19, 0.182, 0.012, 0.09, 0.015); m.box(sx - 0.058, 0.19, 0.182, 0.012, 0.09, 0.015); }
      m.box(0.168, 0.22, 0.07, 0.012, 0.016, 0.24); m.box(-0.168, 0.22, 0.07, 0.012, 0.016, 0.24);
    } else if (g === 'visor') {
      m.color('#38f2ff', 0.9); m.box(0, 0.2, 0.18, 0.34, 0.1, 0.03); m.emissive(0);
    }
    // goggles on the forehead
    if (S.goggles || costume === 'tutu') {
      m.color('#1a1a1a'); m.box(0, 0.3, -0.005, 0.365, 0.045, 0.345);
      for (const sx of [0.075, -0.075]) { m.color('#3a3a3a'); m.push(); m.tf(sx, 0.3, 0.17, 0, Math.PI / 2, 0); m.cyl(0, -0.02, 0, 0.06, 0.06, 0.05, 8, {}); m.pop(); m.color(costume === 'tutu' ? '#ff8a2a' : '#ffb040', 0.35); m.push(); m.tf(sx, 0.3, 0.2, 0, Math.PI / 2, 0); m.cyl(0, 0, 0, 0.048, 0.048, 0.012, 8, {}); m.pop(); m.emissive(0); }
    }
    // hats
    const hat = costume === 'pirate' ? { kind: 'tricorn', col: '#1a1010' } : costume === 'furcoat' ? null : S.hat;
    if (hat) {
      const c = hat.col;
      m.color(c);
      switch (hat.kind) {
        case 'cowboy': m.cyl(0, 0.37, -0.01, 0.34, 0.33, 0.025, 12, {}); m.bbox(0, 0.47, -0.01, 0.26, 0.17, 0.27, 0.05); m.color(shade(c, -0.35)); m.box(0, 0.4, -0.01, 0.27, 0.035, 0.28); break;
        case 'hardhat': m.sphere(0, 0.37, 0.0, 0.2, 9, 6, { hemi: true, smooth: true }); m.cyl(0, 0.36, 0.03, 0.22, 0.22, 0.02, 10, {}); m.color(shade(c, -0.15)); m.box(0, 0.5, 0, 0.04, 0.05, 0.36); break;
        case 'cap': m.bbox(0, 0.42, -0.01, 0.36, 0.1, 0.35, 0.04); m.box(0, 0.385, 0.22, 0.28, 0.02, 0.16); break;
        case 'ranger': m.cyl(0, 0.37, -0.01, 0.3, 0.3, 0.02, 12, {}); m.cyl(0, 0.38, -0.01, 0.17, 0.12, 0.14, 8, {}); m.color('#3a2a1a'); m.cyl(0, 0.39, -0.01, 0.175, 0.17, 0.025, 8, {}); break;
        case 'tophat': m.cyl(0, 0.37, -0.01, 0.26, 0.26, 0.02, 12, {}); m.cyl(0, 0.38, -0.01, 0.15, 0.16, 0.26, 10, {}); m.color(BURNS_NEON[(S.seed || 0) % 7]); m.cyl(0, 0.4, -0.01, 0.155, 0.155, 0.04, 10, {}); break;
        case 'furhat': m.sphere(0, 0.42, -0.01, 0.22, 9, 6, { smooth: true, squash: 0.75 }); break;
        case 'bandana': m.bbox(0, 0.39, -0.01, 0.37, 0.09, 0.36, 0.03); m.box(0, 0.36, -0.2, 0.06, 0.1, 0.04); break;
        case 'tricorn': {
          m.bbox(0, 0.46, -0.01, 0.26, 0.15, 0.26, 0.04);
          for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + Math.PI; m.push(); m.tf(Math.sin(a) * 0.17, 0.42, Math.cos(a) * 0.17 - 0.01, a, 0, 0); m.box(0, 0, 0, 0.34, 0.1, 0.04); m.pop(); }
          m.color('#d8a020'); m.box(0, 0.49, 0.13, 0.08, 0.06, 0.02); break;
        }
      }
    }
    if (costume === 'furcoat') { m.color('#ff8ad8'); m.sphere(0, 0.42, -0.01, 0.22, 9, 6, { smooth: true, squash: 0.7 }); }
    if (costume === 'spaceman') {
      m.color('#e8eef8'); m.box(0, 0.36, -0.02, 0.4, 0.12, 0.38); m.box(0.2, 0.2, -0.02, 0.04, 0.32, 0.38); m.box(-0.2, 0.2, -0.02, 0.04, 0.32, 0.38); m.box(0, 0.2, -0.19, 0.4, 0.32, 0.04);
      m.color('#9aa0b0'); m.cyl(0.12, 0.42, -0.05, 0.012, 0.012, 0.22, 5, {}); m.color('#ff4fd8', 1); m.sphere(0.12, 0.66, -0.05, 0.035, 6, 4, {}); m.emissive(0);
    }
    if (costume === 'unicorn') {
      m.color('#f6f0ff'); m.box(0, 0.37, -0.03, 0.4, 0.1, 0.38); m.box(0.195, 0.2, -0.04, 0.04, 0.34, 0.34); m.box(-0.195, 0.2, -0.04, 0.04, 0.34, 0.34); m.box(0, 0.2, -0.19, 0.4, 0.36, 0.05);
      m.color('#ffd84a', 0.25); m.push(); m.tf(0, 0.42, 0.1, 0, 0.45, 0); m.cyl(0, 0, 0, 0.05, 0, 0.26, 6, {}); m.pop(); m.emissive(0);
      m.color('#ffb0e0'); m.push(); m.tf(0.13, 0.44, -0.02, 0, 0, -0.3); m.box(0, 0.04, 0, 0.06, 0.1, 0.03); m.pop(); m.push(); m.tf(-0.13, 0.44, -0.02, 0, 0, 0.3); m.box(0, 0.04, 0, 0.06, 0.1, 0.03); m.pop();
      ['#ff3b5c', '#ff8a2a', '#ffe24a', '#7aff5a', '#38c8ff', '#9a6bff'].forEach((c, i) => { m.color(c); m.box(0, 0.4 - i * 0.065, -0.225, 0.07, 0.07, 0.04); });
    }
    if (S.acc && S.acc.indexOf('headset') >= 0) { m.color('#1a1a1a'); m.box(0, 0.4, -0.01, 0.37, 0.025, 0.05); m.box(0.18, 0.18, 0, 0.04, 0.08, 0.08); m.box(0.14, 0.12, 0.12, 0.012, 0.012, 0.14); }
    if (S.acc && S.acc.indexOf('earbuds') >= 0) { m.color('#ffffff'); m.box(0.19, 0.16, 0.0, 0.03, 0.04, 0.03); m.box(-0.19, 0.16, 0.0, 0.03, 0.04, 0.03); }
  },
  prop(m, p) {
    if (!p) return;
    m.setBone(BURNS_BONES.PROP);
    switch (p) {
      case 'clipboard': m.color('#8a6a3a'); m.box(0, 0.02, 0.06, 0.2, 0.27, 0.015); m.color('#f4f4ec'); m.box(0, 0.0, 0.069, 0.17, 0.22, 0.004); m.color('#9a9aa0'); m.box(0, 0.14, 0.07, 0.07, 0.03, 0.02); break;
      case 'phone': m.color('#1a1a22'); m.box(0, 0.02, 0.06, 0.075, 0.14, 0.012); m.color('#5ab0ff', 0.9); m.box(0, 0.02, 0.0665, 0.065, 0.12, 0.002); m.emissive(0); break;
      case 'bell': m.color('#6a4a2a'); m.box(0, 0.06, 0.02, 0.03, 0.14, 0.03); m.color('#ffd84a', 0.2); m.cyl(0, -0.12, 0.02, 0.1, 0.04, 0.14, 10, {}); m.emissive(0); break;
      case 'coffee': m.color('#f4f0e8'); m.cyl(0, -0.06, 0.06, 0.045, 0.05, 0.12, 8, {}); m.color('#6a3a1a'); m.cyl(0, -0.02, 0.06, 0.047, 0.047, 0.035, 8, {}); break;
      case 'radio': m.color('#1a1a1a'); m.box(0, 0.0, 0.05, 0.06, 0.13, 0.04); m.color('#3a3a3a'); m.box(0.02, 0.1, 0.05, 0.01, 0.1, 0.01); m.color('#ff3b3b', 1); m.box(-0.015, 0.05, 0.072, 0.012, 0.012, 0.004); m.emissive(0); break;
      case 'ringlight': m.color('#2a2a2a'); m.box(0, 0.35, 0.05, 0.02, 0.8, 0.02); m.color('#ffffff', 1); m.push(); m.tf(0, 0.8, 0.06, 0, Math.PI / 2, 0); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; m.box(Math.sin(a) * 0.14, 0, Math.cos(a) * 0.14, 0.06, 0.02, 0.03); } m.pop(); m.emissive(0); m.color('#1a1a22'); m.box(0, 0.8, 0.06, 0.07, 0.13, 0.012); break;
      case 'bottle': m.color('#3a9a3a'); m.cyl(0, -0.08, 0.04, 0.04, 0.04, 0.14, 8, {}); m.cyl(0, 0.06, 0.04, 0.04, 0.015, 0.06, 8, {}); break;
      case 'water': m.color('#9ad8ff', 0.15); m.cyl(0, -0.08, 0.04, 0.04, 0.04, 0.16, 8, {}); m.color('#3a6aff'); m.cyl(0, 0.08, 0.04, 0.025, 0.025, 0.03, 8, {}); m.emissive(0); break;
    }
  }
};

/* ---------------- procedural animation ---------------- */
// P: pose { r: Float32Array(16*3) [rx,ry,rz per bone], y, pitch, roll, yaw, sq, face, pivot }
function burnsPoseNew() { return { r: new Float32Array(BURNS_NB * 3), y: 0, pitch: 0, roll: 0, yaw: 0, sq: 1, face: 0, pivot: 0.9 }; }
function burnsPoseClear(P) { P.r.fill(0); P.y = 0; P.pitch = 0; P.roll = 0; P.yaw = 0; P.sq = 1; P.face = 0; P.pivot = 0.9; return P; }
const BURNS_ANIMS = (() => {
  const B = BURNS_BONES;
  const S = (P, b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  const arms = (P, lx, lz, lfx, rx, rz, rfx) => { S(P, B.UARM_L, lx, 0, lz); S(P, B.FARM_L, lfx); S(P, B.UARM_R, rx, 0, rz); S(P, B.FARM_R, rfx); };
  const legs = (P, lt, ls, rt, rs, lf, rf) => { S(P, B.THIGH_L, lt); S(P, B.SHIN_L, ls); S(P, B.THIGH_R, rt); S(P, B.SHIN_R, rs); S(P, B.FOOT_L, lf || 0); S(P, B.FOOT_R, rf || 0); };
  const A = {
    idle(P, t) {
      const b = Math.sin(t * 2.2);
      S(P, B.CHEST, 0.02 + b * 0.015); S(P, B.HEAD, -0.02 + b * 0.01, Math.sin(t * 0.37) * 0.25 * BurnsM.smoothstep(0.3, 1, Math.sin(t * 0.21)));
      arms(P, 0.05, 0.12 + b * 0.02, -0.2, 0.05, -0.12 - b * 0.02, -0.2);
      legs(P, 0, 0, 0, 0);
      P.y = b * 0.006; S(P, B.HAIR, b * 0.05);
    },
    walk(P, t, k) {
      const sp = k && k.rate || 1, ph = t * 7.5 * sp, s = Math.sin(ph), c = Math.cos(ph);
      legs(P, -s * 0.55, Math.max(0, -c) * 0.7 + 0.08, s * 0.55, Math.max(0, c) * 0.7 + 0.08, s * 0.2, -s * 0.2);
      arms(P, s * 0.45, 0.1, -0.35, -s * 0.45, -0.1, -0.35);
      S(P, B.CHEST, 0.05, s * 0.08); S(P, B.HIPS, 0, -s * 0.06); S(P, B.HEAD, -0.03, -s * 0.05);
      P.y = Math.abs(c) * 0.035 - 0.01; S(P, B.HAIR, 0.1 + s * 0.08);
    },
    run(P, t, k) {
      const sp = k && k.rate || 1, ph = t * 11 * sp, s = Math.sin(ph), c = Math.cos(ph);
      legs(P, -s * 0.95, Math.max(0, -c) * 1.4 + 0.2, s * 0.95, Math.max(0, c) * 1.4 + 0.2, s * 0.35 + 0.1, -s * 0.35 + 0.1);
      arms(P, s * 0.9, 0.18, -1.3, -s * 0.9, -0.18, -1.3);
      S(P, B.CHEST, 0.2, s * 0.14); S(P, B.HIPS, 0.06, -s * 0.12); S(P, B.HEAD, -0.12, -s * 0.08);
      P.y = Math.abs(c) * 0.08 - 0.04; S(P, B.HAIR, 0.35 + s * 0.15);
    },
    jump(P, t) {
      const k = Math.min(1, t * 6);
      legs(P, -1.1 * k, 1.5 * k, 0.35 * k, 0.5 * k, 0.3, 0.2);
      arms(P, -2.5 * k, 0.4, -0.3, -0.6 * k, -0.6, -0.8);
      S(P, B.CHEST, -0.08); S(P, B.HEAD, -0.15); S(P, B.HAIR, -0.3);
      P.sq = 1 + 0.12 * (1 - k);
    },
    flip(P, t) {
      const u = Math.min(1, t / 0.42);
      legs(P, -1.6, 2.1, -1.5, 2.0, 0.3, 0.3); arms(P, -1.0, 0.5, -1.6, -1.0, -0.5, -1.6);
      S(P, B.CHEST, 0.5); S(P, B.HEAD, 0.4);
      P.pitch = easeInOut(u) * TAU; P.pivot = 0.9;
    },
    fall(P, t) {
      const w = Math.sin(t * 13) * 0.25;
      legs(P, -0.45, 0.6, 0.25, 0.3, 0.2, 0.2);
      arms(P, -0.4 + w, 1.4, -0.4, -0.4 - w, -1.4, -0.4);
      S(P, B.CHEST, -0.05); S(P, B.HEAD, -0.1); S(P, B.HAIR, -0.5);
    },
    land(P, t) {
      const k = Math.max(0, 1 - t / 0.18);
      legs(P, -0.6 * k, 1.0 * k, -0.6 * k, 1.0 * k, 0, 0); arms(P, 0.4 * k, 0.5, -0.4, 0.4 * k, -0.5, -0.4);
      S(P, B.CHEST, 0.25 * k);
      P.sq = 1 - 0.25 * k; P.y = -0.12 * k;
    },
    spin(P, t) {
      const u = Math.min(1, t / 0.45);
      arms(P, 0, 1.45, -0.1, 0, -1.45, -0.1); legs(P, -0.2, 0.3, 0.2, 0.3);
      S(P, B.CHEST, 0.08); S(P, B.HEAD, 0.05);
      P.yaw = easeOut(u) * TAU * 2; P.y = Math.sin(u * Math.PI) * 0.12;
    },
    pound(P, t, k) {
      if (k && k.slam) { legs(P, -0.3, 0.5, -0.3, 0.5); arms(P, -2.8, 0.3, 0, -2.8, -0.3, 0); P.sq = 1.15; return; }
      const u = Math.min(1, t / 0.2);
      legs(P, -2.0, 2.3, -2.0, 2.3, 0.4, 0.4); arms(P, -1.2, 0.6, -1.8, -1.2, -0.6, -1.8);
      S(P, B.CHEST, 0.7); S(P, B.HEAD, 0.4);
      P.pitch = u * TAU; P.pivot = 0.8;
    },
    hurt(P, t) {
      const k = Math.min(1, t * 8), w = Math.sin(t * 20) * 0.3;
      legs(P, -0.5 * k, 0.6, 0.2, 0.3); arms(P, -1.2 + w, 1.0, -0.8, -1.2 - w, -1.0, -0.8);
      S(P, B.CHEST, -0.45 * k); S(P, B.HEAD, -0.35 * k);
      P.face = 2;
    },
    dance(P, t, k) {
      const st = (k && k.style) || 0, b = t * (k && k.bpm ? k.bpm / 60 * TAU : 2.1 * TAU), s = Math.sin(b), c = Math.cos(b), s2 = Math.sin(b * 0.5);
      switch (st % 6) {
        case 0: // groove: hips sway, arms pump
          legs(P, -0.15 + s * 0.15, 0.3 + Math.abs(s) * 0.2, -0.15 - s * 0.15, 0.3 + Math.abs(c) * 0.2); S(P, B.HIPS, 0, s * 0.25, s * 0.08);
          arms(P, -1.1 + s * 0.6, 0.3, -1.4, -1.1 - s * 0.6, -0.3, -1.4); S(P, B.CHEST, 0.1, -s * 0.2); S(P, B.HEAD, Math.abs(s) * 0.2 - 0.05);
          P.y = -Math.abs(s) * 0.06; break;
        case 1: // hands in the air
          arms(P, -2.9 + s * 0.2, 0.3 + c * 0.2, -0.3, -2.9 - s * 0.2, -0.3 - c * 0.2, -0.3); S(P, B.CHEST, -0.1, s * 0.15, s * 0.08);
          legs(P, -0.1, 0.25 + Math.abs(s) * 0.25, -0.1, 0.25 + Math.abs(c) * 0.25); P.y = -Math.abs(s) * 0.08; S(P, B.HEAD, -0.2 + Math.abs(s) * 0.25); break;
        case 2: // disco point
          arms(P, s > 0 ? -2.6 : -0.4, s > 0 ? 0.6 : 0.1, -0.1, -0.3, -0.2, -1.6); S(P, B.HIPS, 0, s * 0.3); S(P, B.CHEST, 0, -s * 0.15, s * 0.12);
          legs(P, -0.3, 0.4, 0.1, 0.2); S(P, B.HEAD, 0.05, s * 0.3); break;
        case 3: // robot
          { const q = Math.floor(t * 4) % 4; arms(P, q === 0 ? -1.5 : -0.2, 0.2, q === 1 ? -1.5 : -1.2, q === 2 ? -1.5 : -0.2, -0.2, q === 3 ? -1.5 : -1.2); S(P, B.HEAD, 0, (q - 1.5) * 0.3); S(P, B.CHEST, 0, (q % 2 - 0.5) * 0.4); legs(P, 0, 0.1, 0, 0.1); } break;
        case 4: // shuffle
          legs(P, -s * 0.5, 0.4 + Math.max(0, s) * 0.6, s * 0.5, 0.4 + Math.max(0, -s) * 0.6); arms(P, -0.6, 0.4 + s * 0.2, -1.6, -0.6, -0.4 + s * 0.2, -1.6);
          S(P, B.CHEST, 0.15, s * 0.1); P.y = Math.abs(c) * 0.08 - 0.05; break;
        default: // wiggle + head bob
          S(P, B.HIPS, 0, 0, s * 0.2); S(P, B.CHEST, 0, 0, -s * 0.3); arms(P, -0.8, 0.9 + s * 0.4, -0.8, -0.8, -0.9 + s * 0.4, -0.8);
          legs(P, -0.1, 0.3, -0.1, 0.3); S(P, B.HEAD, Math.abs(s2) * 0.3, 0, s * 0.15); P.y = -Math.abs(s) * 0.05;
      }
      S(P, B.HAIR, Math.abs(s) * 0.3); P.face = 3 * (st === 5 ? 1 : 0);
    },
    bike(P, t, k) {
      const ph = t * (k && k.rate ? k.rate : 8), s = Math.sin(ph), c = Math.cos(ph);
      S(P, B.HIPS, -0.15); S(P, B.CHEST, 0.42); S(P, B.HEAD, -0.3);
      legs(P, -1.35 + s * 0.45, 1.5 - s * 0.35, -1.35 - s * 0.45, 1.5 + s * 0.35, 0.2 + c * 0.2, 0.2 - c * 0.2);
      arms(P, -1.25, 0.25, -0.35, -1.25, -0.25, -0.35);
      P.y = -0.05; S(P, B.HAIR, 0.4);
    },
    drive(P, t, k) {
      const st = k && k.steer || 0;
      S(P, B.HIPS, -0.1); S(P, B.CHEST, 0.1); S(P, B.HEAD, -0.05, st * 0.3);
      legs(P, -1.5, 1.5, -1.5, 1.5); arms(P, -1.2 + st * 0.3, 0.3, -0.6, -1.2 - st * 0.3, -0.3, -0.6);
    },
    sit(P, t) { S(P, B.HIPS, 0); legs(P, -1.55, 1.55, -1.5, 1.5); arms(P, -0.3, 0.2, -0.9, -0.3, -0.2, -0.9); S(P, B.CHEST, 0.05 + Math.sin(t * 2) * 0.02); S(P, B.HEAD, Math.sin(t * 0.5) * 0.1, Math.sin(t * 0.3) * 0.3); P.y = -0.42; },
    sleep(P, t) { A.sit(P, t); S(P, B.HEAD, 0.45 + Math.sin(t * 1.3) * 0.08, 0.2, 0.35); S(P, B.CHEST, 0.25 + Math.sin(t * 1.3) * 0.03); arms(P, 0.1, 0.25, -0.2, 0.1, -0.25, -0.2); P.face = 2; },
    victory(P, t) {
      const b = Math.abs(Math.sin(t * 6));
      arms(P, -2.9, 0.35, -0.2, -2.9, -0.35, -0.2); legs(P, -0.2, 0.3, 0.1, 0.2);
      S(P, B.CHEST, -0.12); S(P, B.HEAD, -0.25); P.y = b * 0.18; P.face = 3;
    },
    cheer(P, t) { const s = Math.sin(t * 9); arms(P, -2.7 + s * 0.3, 0.3, -0.4, -2.7 - s * 0.3, -0.3, -0.4); legs(P, -0.1, 0.2, -0.1, 0.2); S(P, B.HEAD, -0.2); P.y = Math.abs(s) * 0.08; P.face = 3; },
    talk(P, t, k) {
      A.idle(P, t);
      const g = Math.sin(t * 3.1), g2 = Math.sin(t * 2.3 + 1);
      arms(P, -0.5 + g * 0.3, 0.25, -1.2 + g2 * 0.3, -0.2 + g2 * 0.2, -0.2, -0.6);
      S(P, B.HEAD, Math.sin(t * 4) * 0.08 - 0.05, Math.sin(t * 1.3) * 0.15);
      P.face = (Math.sin(t * 18) > 0) ? 1 : 0;
    },
    wave(P, t) { A.idle(P, t); arms(P, -0.2, 2.6 + Math.sin(t * 10) * 0.35, -0.6, 0.05, -0.12, -0.2); P.face = 3; },
    shuffle(P, t, k) {
      const ph = t * 4 * (k && k.rate || 1), s = Math.sin(ph);
      legs(P, -s * 0.25, 0.15 + Math.max(0, -s) * 0.25, s * 0.25, 0.15 + Math.max(0, s) * 0.25, 0.2, 0.2);
      arms(P, -1.4 + s * 0.08, 0.1, -0.1, -1.4 - s * 0.08, -0.1, -0.1);
      S(P, B.CHEST, 0.28, s * 0.1); S(P, B.HEAD, 0.35 + Math.sin(t * 1.7) * 0.1, 0, Math.sin(t * 1.1) * 0.25); S(P, B.HIPS, 0, 0, s * 0.05);
      P.y = -0.03;
    },
    yell(P, t) {
      const s = Math.sin(t * 14) * 0.12;
      arms(P, -1.6 + s, 0.4, -0.4, -1.1 - s, -0.6, -1.0); legs(P, -0.35, 0.4, 0.3, 0.1);
      S(P, B.CHEST, 0.3); S(P, B.HEAD, -0.15 + s);
      P.face = 1;
    },
    hug(P, t) { arms(P, -1.5, -0.35, -1.1, -1.5, 0.35, -1.1); legs(P, -0.3, 0.3, 0.2, 0.2); S(P, B.CHEST, 0.25); S(P, B.HEAD, 0.05); P.face = 3; },
    charge(P, t) { A.run(P, t * 1.3); arms(P, -1.6, -0.4, -0.9, -1.6, 0.4, -0.9); S(P, B.CHEST, 0.45); P.face = 3; },
    bell(P, t) { A.idle(P, t); const s = Math.sin(t * 22); arms(P, 0.05, 0.12, -0.2, -2.6, -0.3 + s * 0.25, -0.4 + s * 0.3); P.face = 1; },
    phone(P, t) { A.idle(P, t); arms(P, 0.05, 0.12, -0.2, -0.75, -0.25, -1.55); S(P, B.HEAD, 0.35, -0.1); },
    photo(P, t) { A.idle(P, t); arms(P, -0.6, 0.3, -1.6, -1.8, -0.2, -0.9); S(P, B.HEAD, -0.05, 0.3); P.face = 3; },
    clipboard(P, t) { A.idle(P, t); arms(P, -0.6, 0.15, -1.8 + Math.sin(t * 9) * 0.08, -0.85, -0.2, -1.5); S(P, B.HEAD, 0.35); },
    throw(P, t) { const u = Math.min(1, t / 0.25); arms(P, -0.2, 0.3, -0.5, -2.6 + u * 3.2, -0.3, -0.4); S(P, B.CHEST, -0.2 + u * 0.5, 0.3 - u * 0.6); legs(P, -0.4, 0.3, 0.3, 0.2); },
    climb(P, t) { const u = Math.min(1, t / 0.28); arms(P, -2.8 + u * 2.4, 0.3, -0.2, -2.8 + u * 2.4, -0.3, -0.2); legs(P, -1.2 + u, 1.4 - u, -0.3, 0.6); S(P, B.CHEST, 0.3); },
    float(P, t) { const s = Math.sin(t * 2); arms(P, -0.2, 1.2 + s * 0.2, -0.3, -0.2, -1.2 - s * 0.2, -0.3); legs(P, -0.3, 0.5, 0.1, 0.3); S(P, B.CHEST, -0.05); S(P, B.HEAD, -0.2); P.y = s * 0.05; P.face = 3; },
    fly(P, t) { arms(P, -3.0, 0.2, 0, -0.3, -0.5, -0.3); legs(P, 0.2, 0.3, 0.5, 0.6); S(P, B.CHEST, 0.6); S(P, B.HEAD, -0.6); P.pitch = 0.5; P.face = 3; },
    captive(P, t) { const s = Math.sin(t * 6); arms(P, -2.8 + s * 0.3, 0.6, -0.4, -2.8 - s * 0.3, -0.6, -0.4); legs(P, -0.3 + s * 0.3, 0.6, 0.2 - s * 0.3, 0.5); S(P, B.HEAD, -0.2); P.face = 1; },
    knocked(P, t) { const u = Math.min(1, t * 3); legs(P, -1.5 * u, 0.3, -1.4 * u, 0.4); arms(P, -0.5, 1.2, -0.3, -0.5, -1.2, -0.3); P.pitch = -1.4 * u; P.pivot = 0.2; P.y = -0.05 * u; P.face = 2; },
    /* ---- idle flavours for the NPC types ---- */
    // fire spinning: k.tool = poi | fans | staff | hoop (props spin on the PROP / TAIL bones)
    firespin(P, t, k) {
      const tool = k && k.tool || 'poi', w = 9 * (k && k.rate || 1), s = Math.sin(t * w), c = Math.cos(t * w), b = Math.sin(t * 2.4);
      legs(P, -0.2 + b * 0.08, 0.35, 0.15 - b * 0.08, 0.25); S(P, B.HIPS, 0, b * 0.15); S(P, B.CHEST, 0.08, -b * 0.18); S(P, B.HEAD, 0.05, b * 0.2);
      if (tool === 'poi') { arms(P, -1.0 + s * 0.35, 0.35 + c * 0.25, -0.4, -1.0 - s * 0.35, -0.35 + c * 0.25, -0.4); S(P, B.PROP, 0, 0, t * w); S(P, B.TAIL, 0, 0, -t * w + 1.2); }
      else if (tool === 'fans') { arms(P, -1.2 + s * 0.6, 0.7 + c * 0.5, -0.6, -1.2 - s * 0.6, -0.7 + c * 0.5, -0.6); S(P, B.PROP, 0, 0, s * 0.8); S(P, B.TAIL, 0, 0, -s * 0.8); }
      else if (tool === 'staff') { arms(P, -0.3, 0.3, -0.5, -1.35, -0.2, -0.3); S(P, B.PROP, 0, 0, t * w); }
      else { arms(P, -0.3, 0.4, -0.4, -0.5, -1.2, -0.2); S(P, B.PROP, 0, 0, t * w * 0.8); }
      P.y = -Math.abs(b) * 0.03;
    },
    // the cast arm raised, pointing up; the other hand on the hip (bad idea guy)
    dare(P, t) { A.idle(P, t); const s = Math.sin(t * 3); arms(P, 0.05, 0.6, -1.6, -2.85 + s * 0.08, -0.15, -0.1); S(P, B.CHEST, -0.05, 0.15); S(P, B.HEAD, -0.15, -0.2 + Math.sin(t * 0.7) * 0.15); },
    think(P, t) { A.idle(P, t); arms(P, -0.3, 0.25, -1.3, -0.55, -0.15, -2.45); S(P, B.HEAD, 0.1, 0.1, 0.08 + Math.sin(t * 0.8) * 0.05); },
    radio(P, t) { A.idle(P, t); arms(P, 0.05, 0.12, -0.2, -0.95, -0.35, -2.1); S(P, B.HEAD, 0.05, -0.2); P.face = (Math.sin(t * 16) > 0.2) ? 1 : 0; },
    lantern(P, t) { A.idle(P, t); const s = Math.sin(t * 1.4); arms(P, -0.75, 0.2, -1.55, -0.75, -0.2, -1.55); S(P, B.CHEST, 0.02 + s * 0.01); S(P, B.HEAD, -0.05 + s * 0.02, Math.sin(t * 0.4) * 0.2); },
    dj(P, t, k) {
      const bpm = (k && k.bpm) || 128, b = t * bpm / 60 * TAU, s = Math.sin(b), pump = Math.max(0, Math.sin(b * 0.5));
      arms(P, -2.0 - pump * 0.8, 0.4, -0.6, -1.1, -1.25, -2.0); legs(P, -0.15, 0.3 + Math.abs(s) * 0.25, -0.15, 0.3 + Math.abs(s) * 0.25);
      S(P, B.CHEST, 0.12 + Math.abs(s) * 0.08); S(P, B.HEAD, Math.abs(s) * 0.3 - 0.1, 0, 0.05 * s); P.y = -Math.abs(s) * 0.06; P.face = pump > 0.6 ? 1 : 3;
    },
    dazed(P, t) {
      const s = Math.sin(t * 0.9), s2 = Math.sin(t * 1.7 + 1);
      legs(P, -0.15, 0.3, 0.05, 0.2); arms(P, 0.1 + s * 0.15, 0.15, -0.2, 0.1 - s * 0.15, -0.15, -0.25);
      S(P, B.CHEST, 0.15, s * 0.1, s * 0.12); S(P, B.HEAD, 0.35 + s2 * 0.12, s * 0.2, s2 * 0.2); S(P, B.HIPS, 0, 0, -s * 0.06); P.y = -0.03;
    },
    welcome(P, t) { const s = Math.sin(t * 1.6); arms(P, -0.35 + s * 0.08, 1.35 + s * 0.12, -0.2, -0.35 - s * 0.08, -1.35 - s * 0.12, -0.2); legs(P, -0.05, 0.08, 0.05, 0.08); S(P, B.CHEST, -0.12, s * 0.08); S(P, B.HEAD, -0.2 + s * 0.05, s * 0.1); P.y = Math.abs(s) * 0.02; P.face = 3; },
    robot(P, t) { A.dance(P, t, { style: 3, bpm: 110 }); }
  };
  return A;
})();

/* ---------------- character instance ---------------- */
class BurnsChar {
  constructor(model) {
    this.model = model; this.nb = model.nb;
    this.x = 0; this.y = 0; this.z = 0; this.yaw = 0; this.scale = 1;
    this.anim = 'idle'; this.animT = 0; this.k = {};
    this.P = burnsPoseNew(); this.from = burnsPoseNew(); this.tmp = burnsPoseNew();
    this.blend = 1; this.blendDur = 0.16;
    this.bones = new Float32Array(this.nb * 12);
    this.face = 0; this.faceOverride = -1;
    this.tint = null; this.visible = true; this.rim = 0.35;
    this._r = new Float32Array(12); this._a = new Float32Array(12); this._w = new Float32Array(this.nb * 12); this._t2 = new Float32Array(12); this._root = new Float32Array(12);
    this.hairV = 0; this.hairA = 0; this.hairBV = 0; this.hairB = 0; this._py = null; this._pvy = 0; this._pyaw = null;
  }
  setModel(model) { this.model = model; this.nb = model.nb; }
  play(name, k, instant) {
    if (k) this.k = k;
    if (name === this.anim) return this;
    // remember the current pose as the blend source
    const f = this.from, P = this.P;
    f.r.set(P.r); f.y = P.y; f.pitch = P.pitch; f.roll = P.roll; f.yaw = P.yaw; f.sq = P.sq;
    this.anim = name; this.animT = 0; this.blend = instant ? 1 : 0;
    return this;
  }
  update(dt) {
    this.animT += dt;
    if (this.blend < 1) this.blend = Math.min(1, this.blend + dt / this.blendDur);
    const P = burnsPoseClear(this.tmp);
    const fn = this.poseFn || BURNS_ANIMS[this.anim] || BURNS_ANIMS.idle;
    fn(P, this.animT, this.k);
    const out = this.P;
    if (this.blend < 1) {
      const w = easeInOut(this.blend), f = this.from;
      for (let i = 0; i < out.r.length; i++) out.r[i] = lerp(f.r[i], P.r[i], w);
      out.y = lerp(f.y, P.y, w); out.sq = lerp(f.sq, P.sq, w);
      out.pitch = Math.abs(P.pitch) > 0.01 ? P.pitch : lerp(f.pitch % TAU, 0, w);
      out.yaw = Math.abs(P.yaw) > 0.01 ? P.yaw : 0; out.roll = lerp(f.roll, P.roll, w);
    } else { out.r.set(P.r); out.y = P.y; out.sq = P.sq; out.pitch = P.pitch; out.yaw = P.yaw; out.roll = P.roll; }
    out.pivot = P.pivot; out.face = P.face;
    this.face = this.faceOverride >= 0 ? this.faceOverride : P.face;
    // secondary motion: the HAIR bone (bun, long hair) is a damped spring driven by vertical
    // bounce (landing, jumping, walk bob) and by turning, so hair keeps moving after the body stops
    const hb = BURNS_BONES.HAIR * 3;
    if (dt > 0) {
      const y = this.y + out.y * this.scale;
      if (this._py === null) { this._py = y; this._pyaw = this.yaw; }
      const vy = clamp((y - this._py) / dt, -30, 30), ay = clamp((vy - this._pvy) / dt, -400, 400);
      let dyaw = this.yaw - this._pyaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
      this._py = y; this._pvy = vy; this._pyaw = this.yaw;
      this.hairV += (-this.hairA * 60 - this.hairV * 8 + ay * 0.012) * dt;
      this.hairBV += (-this.hairB * 70 - this.hairBV * 8 - clamp(dyaw / dt, -12, 12) * 3) * dt;
      this.hairA = clamp(this.hairA + this.hairV * dt, -0.7, 0.7); this.hairB = clamp(this.hairB + this.hairBV * dt, -0.5, 0.5);
    }
    out.r[hb] += this.hairA; out.r[hb + 2] += this.hairB;
  }
  kick(v) { this.hairV += v; }
  // bone matrices (Float32Array nb*12) for the renderer
  compute() {
    const P = this.P, off = this.model.body.off, W = this._w, r = this._r, a = this._a, PAR = this.model.parent || BURNS_PARENT;
    const s = this.scale, sq = P.sq, sxz = 1 / Math.sqrt(Math.max(0.2, sq));
    // root: T(pos) * Ry(yaw) * [pivot] Rx(pitch) Rz(roll) * S
    BurnsM.a34Set(a, 0, this.x, this.y + P.y * s, this.z, this.yaw + P.yaw, 0, 0, 1, 1, 1);
    if (P.pitch || P.roll) {
      const c = P.pivot * s;
      BurnsM.a34Set(r, 0, 0, c, 0, 0, P.pitch, P.roll, 1, 1, 1);
      const t2 = this._t2; BurnsM.a34Mul(t2, 0, a, 0, r, 0);
      BurnsM.a34Set(r, 0, 0, -c, 0, 0, 0, 0, 1, 1, 1); BurnsM.a34Mul(a, 0, t2, 0, r, 0);
    }
    BurnsM.a34Set(r, 0, 0, 0, 0, 0, 0, 0, s * sxz, s * sq, s * sxz);
    const root = this._root; BurnsM.a34Mul(root, 0, a, 0, r, 0);
    for (let b = 0; b < this.nb; b++) {
      const o = off[b], R = P.r;
      BurnsM.a34Set(r, 0, o[0], o[1], o[2], R[b * 3 + 1], R[b * 3], R[b * 3 + 2], 1, 1, 1);
      const p = PAR[b];
      if (p < 0) BurnsM.a34Mul(W, b * 12, root, 0, r, 0);
      else BurnsM.a34Mul(W, b * 12, W, p * 12, r, 0);
    }
    this.bones.set(W); this.computed = true;
    return this.bones;
  }
  // world position of a point in a bone's local frame (after compute())
  bonePoint(b, x, y, z, out) { return BurnsM.a34Pt(this.bones, b * 12, x, y, z, out || [0, 0, 0]); }
  headPos(out) { return this.bonePoint(BURNS_BONES.HEAD, 0, 0.2, 0, out); }
}
