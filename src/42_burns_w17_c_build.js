/* ============================================================
   BRADY GOES TO BURNING MAN — World 17 builders: the district around Root Society.
   All original designs, rounded and soft; each returns world-space hooks the quests use.
     studio      DUST & GLAMOUR portrait studio (Butt IDs while u wait)
     radio       DUST FM 94.5 (playa radio, lost & found)
     teaLounge   THE STEEPING SLOTH tea lounge + the PHONE JAIL
     contentHouse  #CONTENTHOUSE (the influencer's set)
     kiosk       gifting kiosks (bacon, grilled cheese, pancakes)
     rink        THE GLIDE roller disco
     iceDepot    ICE ICE PLAYA
     bikeShop    SPOKE & MIRRORS bike repair
     duck        THE DISCO DUCK (a broken-down art car that drives once it's fixed)
     heartCar    the heart-topped sound car for the sunrise set (a silhouette DJ, no likeness)
     workShade   Root Society's work shade (Shade Patrol) + crate steps
     generator, ampRack, cableRamp, kitchen stations, Brady's tipi decor (movers)
   ============================================================ */

BW17.B = {};

/* a soft sign helper with our house style */
BW17.sign = function (api, text, x, z, yaw, o) {
  o = o || {};
  return api.sign(text, x, z, Object.assign({ yaw, h: o.h || 1.0, y: o.y || 1.7, maxW: o.maxW || 4.2, style: Object.assign({ bg: o.bg || '#2a1430', fg: o.fg || '#ffe0a0', size: o.size || 40, border: o.border || '#ffb347' }, o.style || {}) }, o.glow ? { glow: o.glow } : {}, o.post === false ? { post: false } : {}));
};

/* ---------------- DUST & GLAMOUR portrait studio ---------------- */
BW17.B.studio = function (api, x, z, yaw) {
  const out = {};
  api.mesh(x, z, m => {
    const cols = [], lights = [];
    // a white canvas studio: back + side walls, a soft roof, open to the street (+Z)
    m.color('#f4efe6').shine(0);
    m.roundBox(0, 1.6, -3, 8.2, 3.2, 0.25, 0.1); m.roundBox(-4, 1.6, 0, 0.25, 3.2, 6.2, 0.1); m.roundBox(4, 1.6, 0, 0.25, 3.2, 6.2, 0.1);
    m.color('#ece4d8'); m.push(); m.tf(0, 3.25, 0, 0, 0, 0); m.roundBox(0, 0, 0, 8.6, 0.22, 6.6, 0.1); m.pop();
    cols.push({ t: 'box', x: 0, z: -3, hx: 4.1, hz: 0.15, y0: 0, y1: 3.2 }, { t: 'box', x: -4, z: 0, hx: 0.15, hz: 3.1, y0: 0, y1: 3.2 }, { t: 'box', x: 4, z: 0, hx: 0.15, hz: 3.1, y0: 0, y1: 3.2 }, { t: 'box', x: 0, z: 0, hx: 4.3, hz: 3.3, y0: 3.14, y1: 3.36 });
    // the sequin backdrop + a posing stool on a pink rug
    m.color('#ff7ab8', 0.12).shine(2); m.roundBox(0, 1.55, -2.78, 5.4, 2.8, 0.08, 0.03, { uv: BURNS_ATLAS.pattern('sequin') }); m.emissive(0);
    m.color('#ff9ad0').shine(0); m.roundCyl(0, 0, -0.9, 1.5, 0.04, 0.02, { seg: 20 });
    m.color('#c8c8d0').shine(3); m.limb(0, 0, -1.2, 0, 0.62, -1.2, 0.04, 0.04, { seg: 6 }); m.color('#ff3b7a').shine(2); m.roundCyl(0, 0.62, -1.2, 0.26, 0.08, 0.03, { seg: 14 }); m.shine(0);
    // two softboxes on tripods
    for (const sx of [-1, 1]) {
      const bx = sx * 2.4, bz = 0.2;
      m.color('#2a2a30'); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; m.limb(bx + Math.sin(a) * 0.45, 0, bz + Math.cos(a) * 0.45, bx, 1.4, bz, 0.02, 0.02, { seg: 4 }); }
      m.limb(bx, 1.4, bz, bx, 2.3, bz, 0.025, 0.025, { seg: 4 });
      m.push(); m.tf(bx, 2.35, bz, sx * -0.6 + Math.PI, 0.25); m.color('#1a1a20'); m.roundBox(0, 0, -0.18, 0.9, 0.9, 0.36, 0.06); m.color('#fffaf0', 1); m.roundBox(0, 0, 0.0, 0.82, 0.82, 0.03, 0.02); m.pop(); m.emissive(0);
      lights.push({ x: bx, y: 2.35, z: bz, s: 1.4, c: '#fff4e0' });
    }
    // the big camera on its tripod, aimed at the stool
    m.color('#2a2a30'); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.3; m.limb(Math.sin(a) * 0.4, 0, 2.2 + Math.cos(a) * 0.4, 0, 1.25, 2.2, 0.02, 0.02, { seg: 4 }); }
    m.color('#1a1a1e').shine(2); m.roundBox(0, 1.45, 2.2, 0.42, 0.32, 0.36, 0.06); m.color('#3a3a44').shine(3); m.push(); m.tf(0, 1.45, 1.95, 0, Math.PI / 2); m.roundCyl(0, -0.08, 0, 0.12, 0.22, 0.03, { seg: 12 }); m.pop();
    m.color('#ff3b3b', 1); m.ball(0.14, 1.64, 2.2, 0.025, { seg: 6, rings: 4 }); m.emissive(0); m.shine(0);
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffd6ec', pool: 8, i: 0.45 });
    return { cols, lights };
  }, { yaw });
  const W = (lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  const sg = W(0, 3.7); BW17.sign(api, 'DUST & GLAMOUR\nPORTRAIT STUDIO', sg[0], sg[1], yaw, { h: 1.1, bg: '#fff0f8', fg: '#c82a6a', border: '#ff7ab8', glow: '#ff7ab8' });
  const sg2 = W(-4.9, 3.2); BW17.sign(api, 'BUTT IDs\nWHILE U WAIT', sg2[0], sg2[1], yaw + 0.3, { h: 0.9, y: 1.1, bg: '#f4e8c8', fg: '#3a1a10', border: '#3a1a10', size: 34 });
  out.stool = W(0, -1.2); out.camera = W(0.9, 2.4); out.front = W(0, 4.6);
  return out;
};

/* ---------------- DUST FM 94.5 ---------------- */
BW17.B.radio = function (api, x, z, yaw) {
  api.mesh(x, z, m => {
    const cols = [], lights = [];
    // the studio: a painted shipping container with a window and an awning
    m.color('#2a6a8a').shine(1); m.roundBox(0, 1.3, -1, 6.2, 2.6, 2.5, 0.08); cols.push({ t: 'box', x: 0, z: -1, hx: 3.1, hz: 1.25, y0: 0, y1: 2.6 });
    m.color('#1a3a4a'); for (let i = -6; i <= 6; i++) m.roundBox(i * 0.46, 1.3, 0.27, 0.06, 2.4, 0.04, 0.01);
    m.color('#ffe0a0', 0.85); m.roundBox(-1.2, 1.5, 0.29, 1.6, 0.8, 0.04, 0.02); m.emissive(0);
    m.color('#ffb347'); m.push(); m.tf(0, 2.75, 0.9, 0, -0.15); m.roundBox(0, 0, 0, 6.4, 0.1, 2.0, 0.04); m.pop();
    for (const sx of [-3, 3]) { m.color('#5a5a62'); m.limb(sx, 0, 1.85, sx, 2.6, 1.85, 0.04, 0.04, { seg: 5 }); }
    // the desk with a mic out front, two chairs
    m.color('#6a4a2a'); m.roundBox(1.3, 0.75, 1.0, 1.8, 0.08, 0.8, 0.03); for (const sx of [0.5, 2.1]) for (const sz of [0.7, 1.3]) m.limb(sx, 0, sz, sx, 0.74, sz, 0.03, 0.03, { seg: 4 });
    m.color('#1a1a1e').shine(2); m.limb(1.3, 0.8, 1.0, 1.3, 1.15, 1.05, 0.012, 0.012, { seg: 4 }); m.ball(1.3, 1.2, 1.08, 0.05, { seg: 8, rings: 6 }); m.shine(0);
    cols.push({ t: 'box', x: 1.3, z: 1.0, hx: 0.9, hz: 0.4, y0: 0, y1: 0.8 });
    // the antenna mast: a tapered lattice with a blinking red light
    const H = 13, mx = -2.4, mz = -1.6;
    m.color('#c8c8d0').shine(2);
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; m.limb(mx + Math.sin(a) * 0.45, 2.6, mz + Math.cos(a) * 0.45, mx + Math.sin(a) * 0.08, H, mz + Math.cos(a) * 0.08, 0.035, 0.02, { seg: 4 }); }
    for (let y = 3.2; y < H - 0.5; y += 1.4) { const r = lerp(0.45, 0.08, (y - 2.6) / (H - 2.6)); m.push(); m.tf(mx, y, mz); m.torus(0, 0, 0, r, 0.015, { seg: 6, tseg: 3 }); m.pop(); }
    m.shine(0); m.color('#ff2a2a', 1); m.ball(mx, H + 0.15, mz, 0.12, { seg: 8, rings: 6 }); m.emissive(0);
    lights.push({ x: mx, y: H + 0.15, z: mz, s: 1.4, c: '#ff3a3a', blink: 3 });
    lights.push({ x: 0, y: 0, z: 1, s: 0, c: '#9adcff', pool: 7, i: 0.4 });
    cols.push({ t: 'cyl', x: mx, z: mz, r: 0.5, y0: 0, y1: H, camPass: true });
    return { cols, lights };
  }, { yaw });
  const W = (lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  const s1 = W(-0.6, 2.6); BW17.sign(api, 'DUST FM 94.5\n· ON AIR ·', s1[0], s1[1], yaw, { h: 1.0, y: 2.9, post: false, bg: '#1a0a12', fg: '#ff4a4a', border: '#ff4a4a', glow: '#ff3a3a' });
  return { mic: W(1.3, 1.9), front: W(0, 3.4) };
};

/* ---------------- THE STEEPING SLOTH tea lounge + PHONE JAIL ---------------- */
BW17.B.teaLounge = function (api, x, z, yaw) {
  api.mesh(x, z, m => {
    const cols = [], lights = [];
    // a low wooden deck with rugs, a shade sail on four poles
    m.color('#8a6440').shine(1); m.roundBox(0, 0.12, 0, 9, 0.24, 7, 0.06, { top: '#a07a52' }); cols.push({ t: 'box', x: 0, z: 0, hx: 4.5, hz: 3.5, y0: 0, y1: 0.24 });
    m.color('#b84a3a').shine(0); m.roundBox(-1.8, 0.25, 0.6, 3.4, 0.02, 2.6, 0.01, { uv: BURNS_ATLAS.pattern('plaid') }); m.color('#3a6a8a'); m.roundBox(2.0, 0.25, 0.4, 3.0, 0.02, 2.4, 0.01, { uv: BURNS_ATLAS.pattern('tiedye') });
    for (const [px, pz] of [[-4.3, -3.3], [4.3, -3.3], [-4.3, 3.3], [4.3, 3.3]]) { m.color('#6a5040'); m.limb(px, 0, pz, px, pz < 0 ? 3.6 : 2.9, pz, 0.06, 0.05, { seg: 6 }); cols.push({ t: 'cyl', x: px, z: pz, r: 0.08, y0: 0, y1: 3.4, camPass: true }); }
    m.color('#efe2c4'); m.push(); m.tf(0, 3.25, 0, 0, -0.1); m.roundBox(0, 0, 0, 9.2, 0.08, 7.2, 0.04, { uv: BURNS_ATLAS.pattern('canvas') }); m.pop();
    // low tables + floor cushions
    for (const [tx, tz] of [[-1.8, 0.6], [2.0, 0.4]]) {
      m.color('#5a3a22').shine(1); m.roundCyl(tx, 0.26, tz, 0.6, 0.3, 0.05, { seg: 14 }); m.shine(0);
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; m.color(['#ff9a5a', '#9a6bff', '#38c8a8', '#ffd84a'][k]); m.ellipsoid(tx + Math.sin(a) * 1.05, 0.38, tz + Math.cos(a) * 1.05, 0.38, 0.14, 0.38, { seg: 10, rings: 5 }); }
      m.color('#e8e0d0').shine(2); m.push(); m.tf(tx, 0.56, tz); m.lathe([[0, 0], [0.11, 0], [0.13, 0.12], [0.08, 0.2], [0.03, 0.25], [0, 0.26]], { seg: 10 }); m.pop(); m.shine(0);
    }
    // the tea bar at the back: kettles, jars, a sloth on the counter
    m.color('#6a4428').shine(1); m.roundBox(0, 0.75, -2.8, 5.0, 1.0, 0.8, 0.08, { top: '#8a6040' }); cols.push({ t: 'box', x: 0, z: -2.8, hx: 2.5, hz: 0.4, y0: 0, y1: 1.25 });
    for (let k = 0; k < 4; k++) { m.color(['#c8c8d0', '#c87a3a', '#3a8a6a', '#d8d0c0'][k]).shine(k === 0 ? 3 : 1); m.push(); m.tf(-1.8 + k * 1.2, 1.25, -2.8); m.lathe([[0, 0], [0.14, 0], [0.17, 0.12], [0.12, 0.24], [0.04, 0.28], [0, 0.3]], { seg: 10 }); m.pop(); }
    m.shine(0);
    m.color('#8a6a4a'); m.push(); m.tf(1.9, 1.25, -2.7); m.ellipsoid(0, 0.2, 0, 0.22, 0.2, 0.18, { seg: 10, rings: 6 }); m.ball(0, 0.48, 0.06, 0.13, { seg: 10, rings: 6 }); m.color('#e8d8c0'); m.ellipsoid(0, 0.47, 0.17, 0.09, 0.07, 0.03, { seg: 8, rings: 4 }); m.color('#2a1a10'); m.ball(-0.04, 0.5, 0.19, 0.018, { seg: 5, rings: 3 }); m.ball(0.04, 0.5, 0.19, 0.018, { seg: 5, rings: 3 }); m.pop();
    // lanterns from the sail
    for (const [lx, lz] of [[-2.5, -1], [0, 1.4], [2.5, -1]]) { m.color('#5a4030'); m.limb(lx, 3.1, lz, lx, 2.6, lz, 0.01, 0.01, { seg: 3 }); BW17.lantern(m, lx, 2.4, lz, '#ffcf8a', 1); lights.push({ x: lx, y: 2.4, z: lz, s: 0.8, c: '#ffcf8a' }); }
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffb070', pool: 9, i: 0.5 });
    // the PHONE JAIL: a striped box with bars on a stout post, front-right of the deck
    const jx = 4.2, jz = 3.9;
    m.color('#5a4030'); m.limb(jx, 0, jz, jx, 1.0, jz, 0.07, 0.07, { seg: 6 });
    m.color('#f4f4f0').shine(1); m.roundBox(jx, 1.3, jz, 0.9, 0.6, 0.6, 0.06);
    m.color('#1a1a20'); for (let i = 0; i < 4; i++) m.roundBox(jx, 1.08 + i * 0.15, jz, 0.92, 0.06, 0.62, 0.02);
    m.color('#8a8a92').shine(3); for (let i = 0; i < 5; i++) m.limb(jx - 0.32 + i * 0.16, 1.02, jz + 0.31, jx - 0.32 + i * 0.16, 1.58, jz + 0.31, 0.012, 0.012, { seg: 4 }); m.shine(0);
    cols.push({ t: 'cyl', x: jx, z: jz, r: 0.45, y0: 0, y1: 1.6 });
    return { cols, lights };
  }, { yaw });
  const W = (lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  const s1 = W(-2.6, 4.4); BW17.sign(api, 'THE STEEPING SLOTH\nTEA LOUNGE', s1[0], s1[1], yaw, { h: 1.0, bg: '#2a3a24', fg: '#e8f4c8', border: '#9adc8a', glow: '#9adc8a' });
  const s2 = W(4.2, 4.7); BW17.sign(api, 'PHONE JAIL\nDO YOUR TIME', s2[0], s2[1], yaw, { h: 0.6, y: 1.75, post: false, bg: '#f4f4f0', fg: '#1a1a20', border: '#1a1a20', size: 32 });
  return { cushion: W(-1.8, 1.65), jail: W(4.2, 4.6), bar: W(0, -1.6), front: W(0, 4.6) };
};

/* ---------------- #CONTENTHOUSE: the influencer's set ---------------- */
BW17.B.contentHouse = function (api, x, z, yaw) {
  api.mesh(x, z, m => {
    const cols = [], lights = [];
    m.color('#f8f4f0').shine(2); m.roundBox(0, 0.3, 0, 7, 0.6, 5, 0.12); cols.push({ t: 'box', x: 0, z: 0, hx: 3.5, hz: 2.5, y0: 0, y1: 0.6 });
    m.shine(0);
    // a balloon arch over the set + a flower wall behind
    for (let i = 0; i <= 18; i++) { const t = i / 18, a = lerp(-1.25, 1.25, t), r = 3.1; m.color(['#ff9ad0', '#ffffff', '#ffd0e8', '#ffb0c8'][i % 4]).shine(2); m.ball(Math.sin(a) * r, 0.6 + Math.cos(a) * r * 1.05, -1.6, 0.34, { seg: 10, rings: 7 }); }
    m.color('#fff0f6').shine(0); m.roundBox(0, 1.9, -2.3, 5.4, 2.6, 0.2, 0.06);
    for (let i = 0; i < 26; i++) { const fx = -2.5 + (i % 9) * 0.62, fy = 0.9 + Math.floor(i / 9) * 0.85 + (i % 2) * 0.2; m.color(i % 3 ? '#ff7ab8' : '#ffffff'); m.ball(fx, fy, -2.16, 0.2, { seg: 8, rings: 5 }); }
    cols.push({ t: 'box', x: 0, z: -2.3, hx: 2.7, hz: 0.12, y0: 0, y1: 3.2 });
    // a ring-light tower aimed back at the set
    const rx = 0.2, rz = 2.9;
    m.color('#2a2a30'); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; m.limb(rx + Math.sin(a) * 0.4, 0.6, rz + Math.cos(a) * 0.4, rx, 1.6, rz, 0.02, 0.02, { seg: 4 }); } m.limb(rx, 1.6, rz, rx, 2.0, rz, 0.025, 0.025, { seg: 4 });
    m.color('#ffffff', 1); m.push(); m.tf(rx, 2.35, rz, 0, Math.PI / 2); m.torus(0, 0, 0, 0.42, 0.05, { seg: 20, tseg: 4 }); m.pop(); m.emissive(0);
    lights.push({ x: rx, y: 2.35, z: rz, s: 1.8, c: '#ffffff' });
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffc0e0', pool: 8, i: 0.45 });
    return { cols, lights };
  }, { yaw });
  const W = (lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  const s1 = W(-3.9, 3.0); BW17.sign(api, '#CONTENTHOUSE\n#BLESSED', s1[0], s1[1], yaw + 0.35, { h: 1.0, bg: '#ffffff', fg: '#ff3b8a', border: '#ff9ad0', glow: '#ff7ab8' });
  return { stage: W(0, 0.2), behind: W(0, -1.0), front: W(0, 4.2) };
};

/* ---------------- gifting kiosks ---------------- */
BW17.B.kiosk = function (api, x, z, yaw, o) {
  api.mesh(x, z, m => {
    const cols = [], lights = [];
    m.color(o.col || '#c84a3a').shine(1); m.roundBox(0, 0.55, 0, 3.2, 1.1, 1.0, 0.1, { top: '#e8dcc8' }); cols.push({ t: 'box', x: 0, z: 0, hx: 1.6, hz: 0.5, y0: 0, y1: 1.12 });
    // a striped awning on posts
    for (const sx of [-1.5, 1.5]) { m.color('#e8e0d0'); m.limb(sx, 0, -0.5, sx, 2.6, -0.5, 0.04, 0.04, { seg: 5 }); cols.push({ t: 'cyl', x: sx, z: -0.5, r: 0.06, y0: 0, y1: 2.6, camPass: true }); }
    for (let i = 0; i < 7; i++) { m.color(i % 2 ? '#f4f0e8' : (o.col || '#c84a3a')); m.push(); m.tf(-1.6 + (i + 0.5) * (3.2 / 7), 2.55, 0.1, 0, 0.32); m.roundBox(0, 0, 0, 3.2 / 7, 0.05, 1.5, 0.02); m.pop(); }
    // the griddle and whatever is on it
    m.color('#2a2a30').shine(2); m.roundBox(0, 1.14, -0.05, 1.4, 0.06, 0.6, 0.02); m.shine(0);
    const food = o.food || 'bacon';
    for (let i = 0; i < 4; i++) {
      const fx = -0.5 + i * 0.33;
      if (food === 'bacon') { m.color('#c8583a'); m.roundBox(fx, 1.19, -0.05, 0.08, 0.025, 0.42, 0.01); m.color('#f4c8a0'); m.roundBox(fx + 0.02, 1.2, -0.05, 0.02, 0.026, 0.4, 0.008); }
      else if (food === 'cheese') { m.color('#d8a050'); m.roundBox(fx, 1.2, -0.05, 0.26, 0.05, 0.26, 0.02); m.color('#ffd84a'); m.roundBox(fx, 1.2, -0.05, 0.27, 0.02, 0.27, 0.008); }
      else { m.color('#e0a868'); m.roundCyl(fx, 1.17, -0.05, 0.13, 0.04, 0.015, { seg: 10 }); m.color('#f4d8a0'); m.roundCyl(fx, 1.21, -0.05, 0.12, 0.03, 0.012, { seg: 10 }); }
    }
    lights.push({ x: 0, y: 2.3, z: 0.4, s: 0.8, c: '#ffcf8a' });
    lights.push({ x: 0, y: 0, z: 1.2, s: 0, c: '#ffb070', pool: 5, i: 0.45 });
    return { cols, lights };
  }, { yaw });
  const W = (lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  const s1 = W(0, 1.1); BW17.sign(api, o.name, s1[0], s1[1], yaw, { h: 0.7, y: 2.75, post: false, bg: o.bg || '#fff4e0', fg: o.fg || '#8a2a1a', border: o.col || '#c84a3a', size: 34 });
  return { host: W(0, -1.1), front: W(0, 1.7) };
};

/* ---------------- THE GLIDE roller disco ---------------- */
BW17.B.rink = function (api, x, z, yaw) {
  const RX = 17, RZ = 9.5;
  api.paint((c, P, S) => {
    const [px, pz] = P(x, z); c.save(); c.translate(px, pz); c.rotate(-yaw);
    c.fillStyle = 'rgba(70,52,72,0.85)'; c.beginPath(); c.ellipse(0, 0, RX * S, RZ * S, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,79,216,0.55)'; c.lineWidth = 0.4 * S; c.beginPath(); c.ellipse(0, 0, (RX - 2) * S, (RZ - 2) * S, 0, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(56,242,255,0.45)'; c.beginPath(); c.ellipse(0, 0, (RX - 5) * S, (RZ - 4.5) * S, 0, 0, TAU); c.stroke();
    c.restore();
  });
  api.mesh(x, z, m => {
    const cols = [], lights = [];
    // the floor (a thin glossy oval) + a padded rail with gaps at both ends
    m.color('#3a2a44').shine(2); m.push(); m.tf(0, 0, 0, 0, 0, 0, 1, 1, RZ / RX); m.roundCyl(0, 0, 0, RX, 0.06, 0.03, { seg: 40 }); m.pop();
    const n = 34;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, am = (a0 + a1) / 2;
      if (Math.abs(Math.sin(am)) > 0.985) continue;   // openings at the two ends (local ±X)
      const p0 = [Math.sin(a0) * (RX + 0.4), Math.cos(a0) * (RZ + 0.4)], p1 = [Math.sin(a1) * (RX + 0.4), Math.cos(a1) * (RZ + 0.4)];
      m.color(i % 2 ? '#ff4fd8' : '#38f2ff', 0.3).shine(2); m.limb(p0[0], 0.85, p0[1], p1[0], 0.85, p1[1], 0.07, 0.07, { seg: 6 }); m.emissive(0);
      m.color('#d8d8e0'); m.limb(p0[0], 0, p0[1], p0[0], 0.85, p0[1], 0.035, 0.035, { seg: 4 });
      const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2, len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      cols.push({ t: 'box', x: mx, z: mz, hx: len / 2, hz: 0.08, y0: 0, y1: 0.95, yaw: Math.atan2(p1[0] - p0[0], p1[1] - p0[1]) + Math.PI / 2, walk: false });
    }
    // a truss arch with a giant disco ball over the middle
    m.color('#c8c8d0').shine(3);
    for (const sx of [-1, 1]) m.limb(sx * 8, 0, 0, sx * 6.5, 7.6, 0, 0.12, 0.1, { seg: 6 });
    m.limb(-6.5, 7.6, 0, 6.5, 7.6, 0, 0.1, 0.1, { seg: 6 }); m.limb(0, 7.6, 0, 0, 6.6, 0, 0.02, 0.02, { seg: 3 });
    m.color('#e8eef8', 0.25).shine(3); m.ball(0, 5.9, 0, 0.85, { seg: 16, rings: 10, uv: BURNS_ATLAS.pattern('disco') }); m.emissive(0); m.shine(0);
    lights.push({ x: 0, y: 5.9, z: 0, s: 2.6, c: '#e8f0ff' });
    cols.push({ t: 'cyl', x: -8, z: 0, r: 0.2, y0: 0, y1: 7.6, camPass: true }, { t: 'cyl', x: 8, z: 0, r: 0.2, y0: 0, y1: 7.6, camPass: true });
    // the DJ booth + skate rental counter on the near side
    m.color('#1a1a22').shine(1); m.roundBox(0, 0.6, RZ + 2.4, 3.0, 1.2, 1.1, 0.12, { top: '#2a2a34' }); m.color('#ff4fd8', 1); m.roundBox(0, 0.9, RZ + 3.0, 2.8, 0.08, 0.04, 0.02); m.emissive(0);
    cols.push({ t: 'box', x: 0, z: RZ + 2.4, hx: 1.5, hz: 0.55, y0: 0, y1: 1.2 });
    m.color('#ffd84a').shine(1); m.roundBox(-6, 0.55, RZ + 2.6, 2.6, 1.1, 0.9, 0.1, { top: '#f4f0e8' }); cols.push({ t: 'box', x: -6, z: RZ + 2.6, hx: 1.3, hz: 0.45, y0: 0, y1: 1.1 });
    for (let k = 0; k < 4; k++) { m.color(['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a'][k]).shine(1); m.roundBox(-7 + k * 0.6, 1.2, RZ + 2.6, 0.18, 0.2, 0.3, 0.05); }
    // benches
    for (const sx of [-12, 12]) { m.color('#6a4a2a'); m.roundBox(sx, 0.42, RZ + 2.2, 3, 0.1, 0.5, 0.04); cols.push({ t: 'box', x: sx, z: RZ + 2.2, hx: 1.5, hz: 0.25, y0: 0, y1: 0.46 }); }
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ff70d0', pool: 16, i: 0.45 }, { x: 10, y: 0, z: 0, s: 0, c: '#38c8ff', pool: 10, i: 0.35 }, { x: -10, y: 0, z: 0, s: 0, c: '#9a6bff', pool: 10, i: 0.35 });
    return { cols, lights };
  }, { yaw });
  const W = (lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  const s1 = W(4.5, RZ + 4.2); BW17.sign(api, 'THE GLIDE\n· ROLLER DISCO ·', s1[0], s1[1], yaw, { h: 1.1, bg: '#1a0a2a', fg: '#ff9ad8', border: '#38f2ff', glow: '#ff4fd8' });
  // the ring course: 8 points round the oval (counter-clockwise from the near opening)
  const ring = []; for (let i = 0; i < 8; i++) { const a = Math.PI * 0.5 + i / 8 * TAU; ring.push(W(Math.sin(a) * (RX - 3.5), Math.cos(a) * (RZ - 3))); }
  return { center: W(0, 0), rental: W(-6, RZ + 3.7), booth: W(0, RZ + 3.6), rings: ring, RX, RZ };
};

/* ---------------- ICE ICE PLAYA ---------------- */
BW17.B.iceDepot = function (api, x, z, yaw) {
  api.mesh(x, z, m => {
    const cols = [], lights = [];
    m.color('#eef4f8').shine(2); m.roundBox(0, 1.45, -1.2, 11, 2.9, 2.6, 0.12); cols.push({ t: 'box', x: 0, z: -1.2, hx: 5.5, hz: 1.3, y0: 0, y1: 2.9 });
    m.color('#bfe8ff', 0.2); for (let i = -5; i <= 5; i++) m.roundBox(i, 0.25, 0.12, 0.7, 0.4 + (i % 3) * 0.1, 0.06, 0.03); m.emissive(0);
    m.color('#1a3a5a'); m.roundBox(0, 1.6, 0.11, 2.4, 1.1, 0.06, 0.04); m.color('#9adcff', 0.6); m.roundBox(0, 1.6, 0.13, 2.2, 0.9, 0.04, 0.03); m.emissive(0);
    m.color('#5a5a62'); m.roundBox(0, 1.0, 0.45, 2.6, 0.08, 0.7, 0.03);
    // bags of ice stacked on the counter + a cooler pile
    for (let k = 0; k < 5; k++) { m.color('#e8f8ff', 0.15).shine(2); m.ellipsoid(-0.9 + k * 0.45, 1.16, 0.45, 0.2, 0.1, 0.16, { seg: 8, rings: 5 }); } m.emissive(0).shine(0);
    for (let k = 0; k < 4; k++) { m.color(['#2a8ac8', '#c83a2a', '#e8e8e8', '#2aa86a'][k]).shine(1); m.roundBox(3.6 + (k % 2) * 0.9, 0.28 + Math.floor(k / 2) * 0.56, 1.0, 0.8, 0.5, 0.48, 0.06); } m.shine(0);
    // the queue rope
    m.color('#c8a050'); for (let k = 0; k < 4; k++) m.limb(-1.6 - k * 1.6, 0, 2.2, -1.6 - k * 1.6, 0.9, 2.2, 0.04, 0.04, { seg: 5 });
    m.color('#c83a3a'); for (let k = 0; k < 3; k++) m.limb(-1.6 - k * 1.6, 0.85, 2.2, -3.2 - k * 1.6, 0.85, 2.2, 0.025, 0.025, { seg: 4 });
    lights.push({ x: 0, y: 0, z: 1.5, s: 0, c: '#9adcff', pool: 8, i: 0.45 }, { x: 0, y: 2.4, z: 0.4, s: 1.0, c: '#bff0ff' });
    return { cols, lights };
  }, { yaw });
  const W = (lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  const s1 = W(0, 0.2); BW17.sign(api, 'ICE ICE PLAYA\nICE · CASH · NO CHIT-CHAT', s1[0], s1[1], yaw, { h: 0.95, y: 2.95, post: false, bg: '#0a2a4a', fg: '#bff0ff', border: '#9adcff', glow: '#9adcff', size: 34 });
  return { window: W(0, 1.3), line: W(-3, 2.9) };
};

/* ---------------- SPOKE & MIRRORS bike repair ---------------- */
BW17.B.bikeShop = function (api, x, z, yaw) {
  api.prop('shade', { x, z, yaw, w: 7, d: 5, h: 2.8, col: '#e8d8b8' });
  api.mesh(x, z, m => {
    const cols = [];
    m.color('#5a4a3a').shine(1); m.roundBox(0, 0.45, -1.8, 4.4, 0.9, 0.8, 0.06, { top: '#7a6a5a' }); cols.push({ t: 'box', x: 0, z: -1.8, hx: 2.2, hz: 0.4, y0: 0, y1: 0.9 });
    // spare wheels on a rack, a bike on a work stand, a floor pump
    for (let k = 0; k < 5; k++) { m.color('#1a1a1e').shine(1); m.push(); m.tf(-2.6 + k * 0.5, 1.6, -2.3, 0, 0, 0); m.push(); m.tf(0, 0, 0, Math.PI / 2, 0, Math.PI / 2); m.torus(0, 0, 0, 0.34, 0.03, { seg: 14, tseg: 4 }); m.pop(); m.pop(); }
    m.color('#9a9aa2').shine(3); m.limb(-2.8, 2.0, -2.3, -0.6, 2.0, -2.3, 0.03, 0.03, { seg: 4 }); m.limb(1.6, 0, 0.2, 1.6, 1.0, 0.2, 0.04, 0.04, { seg: 5 });
    m.color('#ffd21a').shine(2); m.limb(1.0, 1.05, 0.2, 2.2, 1.05, 0.2, 0.04, 0.04, { seg: 5 }); m.limb(1.6, 1.05, 0.2, 1.4, 1.5, 0.2, 0.035, 0.035, { seg: 5 });
    m.color('#1a1a1e'); for (const wx of [0.9, 2.3]) { m.push(); m.tf(wx, 1.0, 0.2, Math.PI / 2, 0, Math.PI / 2); m.torus(0, 0, 0, 0.32, 0.03, { seg: 14, tseg: 4 }); m.pop(); }
    m.color('#c83a2a').shine(2); m.limb(-1.2, 0, 0.6, -1.2, 0.7, 0.6, 0.035, 0.035, { seg: 5 }); m.roundBox(-1.2, 0.03, 0.6, 0.3, 0.05, 0.12, 0.02); m.shine(0);
    return { cols, lights: [{ x: 0, y: 0, z: 0, s: 0, c: '#ffcf8a', pool: 6, i: 0.4 }] };
  }, { yaw });
  const W = (lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  const s1 = W(-2.2, 2.9); BW17.sign(api, 'SPOKE & MIRRORS\nBIKE REPAIR · GIFTED', s1[0], s1[1], yaw + 0.25, { h: 0.9, bg: '#f4e8c8', fg: '#2a2a30', border: '#ffd21a', size: 34 });
  return { bench: W(0, -0.9), front: W(0, 3.2) };
};

/* ---------------- THE DISCO DUCK: a broken-down art car (drivable once it's fixed) ---------------- */
BW17.B.duckModel = function (m) {
  const cols = [], lights = [];
  const L = 7.4, Wd = 3.4;
  // chassis + wheels
  const lo0 = m.lo;
  m.color('#2a2a30').shine(1); m.roundBox(0, 0.6, 0, Wd - 0.5, 0.4, L - 0.6, 0.1);
  for (const wz of [-2.4, 2.4]) for (const sx of [-1, 1]) { m.push(); m.tf(sx * 1.45, 0.5, wz, 0, 0, Math.PI / 2); m.color('#18181c').shine(1); m.roundCyl(0, -0.25, 0, 0.5, 0.5, 0.14, { seg: m.lo ? 10 : 16 }); m.color('#ffd21a').shine(2); m.roundCyl(0, sx > 0 ? 0.24 : -0.3, 0, 0.24, 0.06, 0.02, { seg: m.lo ? 8 : 12 }); m.pop(); }
  // the duck: a big glossy yellow body, a head, an orange beak, wing bumps, a deck at the tail
  m.color('#ffd21a').shine(2);
  m.push(); m.tf(0, 1.75, -0.4); m.ellipsoid(0, 0, 0, 1.7, 1.15, 3.1, { seg: m.lo ? 14 : 22, rings: m.lo ? 8 : 12 }); m.pop();
  m.ball(0, 3.7, 2.0, 1.15, { seg: m.lo ? 14 : 20, rings: m.lo ? 8 : 12 });
  m.limb(0, 2.4, 1.6, 0, 3.3, 1.95, 0.85, 0.8, { seg: m.lo ? 10 : 14 });
  m.color('#ff8a1a'); m.push(); m.tf(0, 3.55, 3.0, 0, -0.1); m.ellipsoid(0, 0, 0, 0.55, 0.22, 0.55, { seg: 12, rings: 6 }); m.pop();
  m.color('#1a1a20').shine(3); for (const sx of [-1, 1]) m.ball(sx * 0.55, 4.0, 2.85, 0.16, { seg: 10, rings: 6 }); m.color('#ffffff', 0.6); for (const sx of [-1, 1]) m.ball(sx * 0.6, 4.05, 2.97, 0.05, { seg: 6, rings: 4 }); m.emissive(0);
  m.color('#ffc800').shine(2); for (const sx of [-1, 1]) { m.push(); m.tf(sx * 1.45, 2.0, -0.6, 0, 0, sx * 0.25); m.ellipsoid(0, 0, 0, 0.35, 0.7, 1.5, { seg: 10, rings: 6 }); m.pop(); }
  // a disco ball on its head
  m.color('#dfe6f4', 0.2).shine(3); m.ball(0, 5.15, 2.0, 0.42, { seg: m.lo ? 10 : 14, rings: m.lo ? 6 : 9, uv: BURNS_ATLAS.pattern('disco') }); m.emissive(0); m.shine(0);
  // the tail deck (walkable) with a rail + LED skirt
  m.color('#6a4a2a'); m.roundBox(0, 2.0, -3.0, 2.8, 0.14, 2.0, 0.04, { top: '#8a6a44' });
  m.color('#ff4fd8', 1); for (let i = 0; i < 12; i++) m.roundBox(-1.6, 0.85, -3.3 + i * 0.6, 0.04, 0.08, 0.3, 0.01); for (let i = 0; i < 12; i++) m.roundBox(1.6, 0.85, -3.3 + i * 0.6, 0.04, 0.08, 0.3, 0.01); m.emissive(0);
  m.color('#2a2a30'); m.limb(-1.35, 2.07, -3.9, 1.35, 2.07, -3.9, 0.03, 0.03, { seg: 4 }); m.limb(-1.35, 2.07, -3.9, -1.35, 2.6, -3.9, 0.03, 0.03, { seg: 4 }); m.limb(1.35, 2.07, -3.9, 1.35, 2.6, -3.9, 0.03, 0.03, { seg: 4 }); m.limb(-1.35, 2.6, -3.9, 1.35, 2.6, -3.9, 0.03, 0.03, { seg: 4 });
  // the driver's seat on the deck
  m.color('#ff4fd8').shine(1); m.roundBox(0, 2.35, -2.4, 0.7, 0.5, 0.6, 0.12); m.shine(0);
  m.lo = lo0;
  cols.push({ t: 'box', x: 0, z: -0.3, hx: 1.6, hz: 3.4, y0: 0, y1: 2.0, cover: true }, { t: 'box', x: 0, z: 2.0, hx: 0.9, hz: 0.9, y0: 2.0, y1: 4.8 });
  lights.push({ x: 0, y: 5.15, z: 2.0, s: 2.0, c: '#e8f0ff' });
  return { cols, lights, seat: [0, 2.15, -2.4], w: Wd, len: L, top: 2.07 };
};

/* ---------------- the heart-topped sound car for the sunrise set (parked on the deep playa) ----------------
   car-local: cab at +Z, the deck behind it; the DJ riser and the speaker stacks face the crowd at the tail (-Z) */
BW17.B.heartCar = function (api, x, z, yaw) {
  const out = {};
  api.mesh(x, z, m => {
    const cols = [], lights = [];
    m.color('#2a2228').shine(1); m.roundBox(0, 0.7, 0, 4.4, 0.6, 13, 0.12);
    for (const wz of [-4.6, -2.9, 4.6]) for (const sx of [-1, 1]) { m.push(); m.tf(sx * 1.9, 0.62, wz, 0, 0, Math.PI / 2); m.color('#18181c'); m.roundCyl(0, -0.3, 0, 0.62, 0.6, 0.16, { seg: 14 }); m.pop(); }
    // cab (its roof is a lookout), glossy windscreen
    m.color('#e84a8a').shine(2); m.roundBox(0, 1.9, 5.4, 4.0, 2.2, 2.4, 0.4); m.color('#2a2a34').shine(3); m.roundBox(0, 2.3, 6.55, 3.4, 0.9, 0.1, 0.1); m.shine(0);
    m.color('#ffd0e4', 1); m.roundBox(0, 3.02, 5.4, 3.6, 0.06, 2.0, 0.02); m.emissive(0);
    // the deck
    m.color('#5a3a3a').shine(1); m.roundBox(0, 1.15, -1.3, 4.6, 0.3, 10.2, 0.1, { top: '#7a5a4a' });
    cols.push({ t: 'box', x: 0, z: -1.3, hx: 2.3, hz: 5.1, y0: 0, y1: 1.3 }, { t: 'box', x: 0, z: 5.4, hx: 2.0, hz: 1.2, y0: 0, y1: 3.0 });
    // speaker stacks at the tail corners, cones facing the crowd (-Z)
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
      m.color('#16161a').shine(1); m.roundBox(sx * 1.65, 1.3 + 0.55 + k * 1.1, -5.6, 1.0, 1.1, 1.0, 0.08);
      m.color('#3a3a44').shine(2); m.push(); m.tf(sx * 1.65, 1.85 + k * 1.1, -6.12, 0, -Math.PI / 2); m.roundCyl(0, -0.02, 0, 0.36, 0.05, 0.02, { seg: 12 }); m.pop(); m.shine(0);
    }
    cols.push({ t: 'box', x: 1.65, z: -5.6, hx: 0.5, hz: 0.5, y0: 1.3, y1: 4.6 }, { t: 'box', x: -1.65, z: -5.6, hx: 0.5, hz: 0.5, y0: 1.3, y1: 4.6 });
    // the DJ riser + decks, an LED strip on the crowd side
    m.color('#1a1a20').shine(1); m.roundBox(0, 1.75, -4.4, 2.0, 0.9, 1.2, 0.08); m.color('#ff7ab8', 1); m.roundBox(0, 1.9, -5.01, 1.8, 0.1, 0.04, 0.02); m.emissive(0);
    m.color('#2a2a32').shine(2); m.roundBox(0, 2.24, -4.6, 1.6, 0.08, 0.6, 0.03); m.shine(0);
    cols.push({ t: 'box', x: 0, z: -4.4, hx: 1.0, hz: 0.6, y0: 1.3, y1: 2.2 });
    // the giant heart on a truss over the middle of the deck
    const heart = []; for (let i = 0; i < 28; i++) { const t = i / 28 * TAU, hx = 16 * Math.pow(Math.sin(t), 3), hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); heart.push([hx * 0.2, hy * 0.2]); } heart.reverse();   // counter-clockwise for the earcut
    m.color('#c8c8d0').shine(3); m.limb(-1.0, 1.3, -0.4, -0.5, 6.6, -0.4, 0.08, 0.08, { seg: 6 }); m.limb(1.0, 1.3, -0.4, 0.5, 6.6, -0.4, 0.08, 0.08, { seg: 6 }); m.shine(0);
    m.color('#ff3b7a', 0.85); m.push(); m.tf(0, 9.0, -0.4, Math.PI); m.extrude(heart, 0.7, { convex: false }); m.pop();
    m.color('#ffd0e4', 1); for (const fz of [-0.78, -0.02]) { m.push(); m.tf(0, 9.0, fz, Math.PI); for (let i = 0; i < heart.length; i++) { const a = heart[i], b = heart[(i + 1) % heart.length]; m.limb(a[0], a[1], 0, b[0], b[1], 0, 0.07, 0.07, { seg: 4 }); } m.pop(); } m.emissive(0);
    lights.push({ x: 0, y: 9.0, z: -1.0, s: 7, c: '#ff5a9a' }, { x: 0, y: 0, z: -12, s: 0, c: '#ff70b0', pool: 22, i: 0.6 });
    // a side ramp up onto the deck
    m.color('#6a6a72').shine(1); m.push(); m.tf(2.9, 0.65, -1.0, 0, 0, -0.42); m.roundBox(0, 0, 0, 1.6, 0.08, 1.4, 0.03); m.pop(); m.shine(0);
    cols.push({ t: 'ramp', x: 2.95, z: -1.0, hx: 0.7, hz: 0.8, y0: 0, ya: 0.05, yb: 1.3, yaw: -Math.PI / 2 });
    return { cols, lights };
  }, { yaw });
  const W = (lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  out.booth = W(0, -4.2); out.boothY = 2.2; out.top = W(0, 5.4); out.topY = 3.05; out.floor = W(0, -16); out.ramp = W(4.2, -1.0); out.heart = W(0, -0.4);
  return out;
};
// the DJ: a small backlit silhouette at the decks (no face, no name, no lines)
BW17.B.heartDJ = function (api, x, y, z, yaw) {
  api.mesh(x, z, m => {
    m.color('#0c0a10').shine(0);
    m.limb(-0.1, 0, 0, -0.1, 0.85, 0, 0.09, 0.1, { seg: 6 }); m.limb(0.1, 0, 0, 0.1, 0.85, 0, 0.09, 0.1, { seg: 6 });
    m.ellipsoid(0, 1.2, 0, 0.24, 0.42, 0.16, { seg: 10, rings: 7 });
    m.limb(-0.22, 1.45, 0, -0.32, 1.05, 0.25, 0.06, 0.05, { seg: 5 }); m.limb(0.22, 1.45, 0, 0.36, 1.85, 0.12, 0.06, 0.05, { seg: 5 });
    m.ball(0, 1.78, 0.02, 0.16, { seg: 10, rings: 7 }); m.push(); m.tf(0, 1.8, 0.02, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.17, 0.025, { seg: 12, tseg: 3 }); m.pop();
    return { cols: [], lights: [{ x: 0, y: 1.6, z: -0.5, s: 2.2, c: '#ff9ad0' }] };
  }, { y, yaw, noAO: true });
};

/* ---------------- Root Society's work shade (Shade Patrol) ---------------- */
// 9 x 7 m frame, 4.6 m posts, a walkable perimeter beam and canvas top; crates make a stair up one side
BW17.B.workShade = function (api, x, z, yaw) {
  const H = 4.6, w = 9, d = 7;
  api.mesh(x, z, m => {
    const cols = [], lights = [];
    m.color('#8a8a92').shine(2);
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { m.limb(sx * w / 2, 0, sz * d / 2, sx * w / 2, H, sz * d / 2, 0.09, 0.08, { seg: 6 }); cols.push({ t: 'cyl', x: sx * w / 2, z: sz * d / 2, r: 0.1, y0: 0, y1: H, camPass: true }); }
    // perimeter beams (walkable): a box truss look with round chords
    for (const [ax, az, bx, bz] of [[-w / 2, -d / 2, w / 2, -d / 2], [-w / 2, d / 2, w / 2, d / 2], [-w / 2, -d / 2, -w / 2, d / 2], [w / 2, -d / 2, w / 2, d / 2]]) {
      m.color('#9a9aa2'); m.limb(ax, H, az, bx, H, bz, 0.06, 0.06, { seg: 5 }); m.limb(ax, H - 0.35, az, bx, H - 0.35, bz, 0.04, 0.04, { seg: 4 });
      const len = Math.hypot(bx - ax, bz - az), n = Math.round(len / 0.9);
      for (let i = 0; i <= n; i++) { const t = i / n; m.limb(lerp(ax, bx, t), H - 0.35, lerp(az, bz, t), lerp(ax, bx, t), H, lerp(az, bz, t), 0.02, 0.02, { seg: 3 }); }
      cols.push({ t: 'box', x: (ax + bx) / 2, z: (az + bz) / 2, hx: Math.abs(bx - ax) / 2 + 0.25, hz: Math.abs(bz - az) / 2 + 0.25, y0: H - 0.4, y1: H + 0.08 });
    }
    // the canvas, sagging a little; its corners are the flaps (movers) that come loose
    m.color('#e8dcc0').shine(0); m.push(); m.tf(0, H - 0.02, 0); m.roundBox(0, 0, 0, w - 1.2, 0.07, d - 1.2, 0.03, { uv: BURNS_ATLAS.pattern('canvas') }); m.pop();
    cols.push({ t: 'box', x: 0, z: 0, hx: w / 2 - 0.6, hz: d / 2 - 0.6, y0: H - 0.1, y1: H + 0.04 });
    // crate stairs up the near side (+Z): 1.1, 2.2, 3.3 m
    for (let k = 0; k < 3; k++) { const s = 1.1, cx = -w / 2 + 1.0 + k * 1.15, cz = d / 2 + 1.0; m.color(['#a07a4a', '#8a6a3a', '#b08a5a'][k]); for (let j = 0; j <= k; j++) { m.roundBox(cx, s / 2 + j * s, cz, s, s, s, 0.08, { uv: BURNS_ATLAS.pattern('wood') }); } cols.push({ t: 'box', x: cx, z: cz, hx: s / 2, hz: s / 2, y0: 0, y1: s * (k + 1) }); }
    // a work table + tools under the shade
    m.color('#6a4a2a').shine(1); m.roundBox(1.5, 0.85, -1.5, 3.0, 0.1, 1.1, 0.04); for (const sx of [0.2, 2.8]) for (const sz of [-2.0, -1.0]) m.limb(sx, 0, sz, sx, 0.85, sz, 0.04, 0.04, { seg: 4 });
    m.color('#c83a2a').shine(2); m.roundBox(0.8, 0.98, -1.5, 0.5, 0.18, 0.25, 0.04); m.color('#ffd21a'); m.roundBox(2.1, 0.96, -1.3, 0.4, 0.12, 0.2, 0.03); m.shine(0);
    cols.push({ t: 'box', x: 1.5, z: -1.5, hx: 1.5, hz: 0.55, y0: 0, y1: 0.9 });
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ffcf8a', pool: 8, i: 0.4 });
    return { cols, lights };
  }, { yaw });
  const W = (lx, lz) => [x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z - lx * Math.sin(yaw) + lz * Math.cos(yaw)];
  const corners = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => { const q = W(sx * (w / 2 - 0.3), sz * (d / 2 - 0.3)); return { x: q[0], z: q[1], y: H, sx, sz }; });
  return { corners, H, w, d, yaw, x, z, steps: W(-w / 2 + 1.0, d / 2 + 2.4), sign: W(w / 2 + 1.2, d / 2 + 0.8) };
};
// a flapping corner of shade cloth (a mover): a triangle of canvas that waves until it's tied
BW17.B.flap = function (api, c, yaw) {
  const mv = api.mover(m => {
    m.color('#e8dcc0').shine(0);
    m.poly([[0, 0, 0], [-c.sx * 1.4, 0, 0], [0, 0, -c.sz * 1.4]]); m.poly([[0, 0, 0], [0, 0, -c.sz * 1.4], [-c.sx * 1.4, 0, 0]]);
    m.color('#ff7a2a', 0.3); m.ball(0, 0, 0, 0.09, { seg: 6, rings: 4 }); m.emissive(0);
    return { cols: [] };
  });
  mv.x = c.x; mv.y = c.y + 0.05; mv.z = c.z; mv.yaw = yaw; mv.bw17flap = true;
  return mv;
};

/* ---------------- generator, amp rack, cable ramps ---------------- */
BW17.B.generator = function (api, x, z, yaw) {
  api.mesh(x, z, m => {
    m.color('#3a6a3a').shine(2); m.roundBox(0, 1.1, 0, 2.2, 1.6, 3.6, 0.12); m.color('#2a2a30'); m.roundBox(0, 0.25, 0, 2.0, 0.3, 3.4, 0.06);
    for (const wz of [-1.0, 1.0]) for (const sx of [-1, 1]) { m.push(); m.tf(sx * 1.12, 0.35, wz, 0, 0, Math.PI / 2); m.color('#18181c'); m.roundCyl(0, -0.12, 0, 0.35, 0.24, 0.06, { seg: 12 }); m.pop(); }
    m.color('#9a9aa2').shine(3); m.limb(0.6, 1.9, -1.2, 0.6, 2.8, -1.2, 0.09, 0.08, { seg: 8 }); m.shine(0);
    m.color('#1a2a1a'); for (let i = 0; i < 6; i++) m.roundBox(1.11, 1.1, -1.2 + i * 0.45, 0.02, 1.0, 0.18, 0.01);
    m.color('#7aff5a', 1); m.roundBox(-1.11, 1.5, 0.8, 0.02, 0.12, 0.12, 0.02); m.emissive(0);
    // the cable reel beside it
    m.color('#ffb347').shine(1); m.push(); m.tf(-2.0, 0.6, 0.6, 0, 0, Math.PI / 2); m.roundCyl(0, -0.35, 0, 0.6, 0.7, 0.06, { seg: 14 }); m.color('#1a1a1e'); m.roundCyl(0, -0.3, 0, 0.45, 0.6, 0.05, { seg: 14 }); m.pop(); m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.1, hz: 1.8, y0: 0, y1: 1.9 }, { t: 'cyl', x: -2.0, z: 0.6, r: 0.62, y0: 0, y1: 1.2 }], lights: [{ x: -1.12, y: 1.5, z: 0.8, s: 0.4, c: '#7aff5a' }] };
  }, { yaw });
};
BW17.B.ampRack = function (api, x, z, yaw) {
  api.mesh(x, z, m => {
    m.color('#1a1a20').shine(1); m.roundBox(0, 0.85, 0, 1.2, 1.7, 0.8, 0.08);
    for (let i = 0; i < 5; i++) { m.color('#2a2a32').shine(2); m.roundBox(0, 0.35 + i * 0.3, 0.41, 1.1, 0.22, 0.03, 0.02); m.color(i % 2 ? '#38f2ff' : '#7aff5a', 1); m.roundBox(-0.42, 0.35 + i * 0.3, 0.43, 0.06, 0.04, 0.02, 0.01); m.emissive(0); }
    m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.6, hz: 0.4, y0: 0, y1: 1.7 }], lights: [{ x: 0, y: 1.1, z: 0.5, s: 0.5, c: '#38f2ff' }] };
  }, { yaw });
};

/* ---------------- Brady's tipi: decorations (movers, toggled from the save) ---------------- */
// t = { x, z, yaw (door direction), r (tipi radius) }; returns { id: mover }
BW17.B.decor = function (api, t) {
  const D = {}, c = Math.cos(t.yaw), s = Math.sin(t.yaw);
  const at = (lx, lz) => [t.x + lx * c + lz * s, t.z - lx * s + lz * c];   // tipi-local -> world (+Z = out the door)
  const put = (id, lx, lz, build, y) => { const mv = api.mover(build); const q = at(lx, lz); mv.x = q[0]; mv.z = q[1]; mv.y = y || 0; mv.yaw = t.yaw; mv.visible = false; mv.noCollide = true; D[id] = mv; return mv; };
  // a pink lawn flamingo by the door
  put('flamingo', 1.4, t.r + 0.8, m => { m.color('#ff7ab8').shine(2); m.ellipsoid(0, 0.62, 0, 0.16, 0.12, 0.24, { seg: 10, rings: 6 }); m.limb(0, 0.68, 0.16, 0.02, 1.0, 0.2, 0.035, 0.03, { seg: 5 }); m.ball(0.02, 1.05, 0.2, 0.06, { seg: 8, rings: 5 }); m.color('#1a1a1a'); m.limb(0.02, 1.05, 0.25, 0.03, 0.98, 0.34, 0.02, 0.008, { seg: 4 }); m.color('#d8d8e0').shine(3); m.limb(0, 0, 0, 0, 0.55, 0, 0.012, 0.012, { seg: 3 }); m.limb(0.06, 0, 0, 0.03, 0.55, 0, 0.012, 0.012, { seg: 3 }); m.shine(0); return { cols: [] }; });
  // a pirate flag high on a pole
  put('pirate', -1.5, t.r + 0.6, m => { m.color('#6a4a2a'); m.limb(0, 0, 0, 0, 3.2, 0, 0.04, 0.03, { seg: 5 }); m.color('#1a1a20'); m.roundBox(0.45, 2.85, 0, 0.9, 0.6, 0.02, 0.01); m.color('#f4f4f0', 0.2); m.ball(0.45, 2.9, 0.02, 0.1, { seg: 8, rings: 5 }); m.roundBox(0.45, 2.72, 0.02, 0.26, 0.05, 0.01, 0.01); m.emissive(0); return { cols: [] }; });
  // a disco ball hanging over the door
  put('disco', 0, t.r - 0.2, m => { m.color('#3a3a40'); m.limb(0, 2.25, 0, 0, 2.7, 0, 0.01, 0.01, { seg: 3 }); m.color('#e8eef8', 0.3).shine(3); m.ball(0, 2.05, 0, 0.22, { seg: 12, rings: 8, uv: BURNS_ATLAS.pattern('disco') }); m.emissive(0); m.shine(0); return { cols: [], lights: [{ x: 0, y: 2.05, z: 0, s: 0.9, c: '#e8f0ff' }] }; });
  // a heart flag from the sunrise set
  put('heartflag', 2.0, t.r - 0.1, m => { m.color('#c8c8d0').shine(2); m.limb(0, 0, 0, 0, 2.8, 0, 0.03, 0.025, { seg: 5 }); m.shine(0); m.color('#ff3b7a', 0.5); const H = []; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; H.push([16 * Math.pow(Math.sin(a), 3) * 0.02, (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 0.02]); } H.reverse(); m.push(); m.tf(0.38, 2.45, 0); m.extrude(H, 0.05, { convex: false }); m.pop(); m.emissive(0); return { cols: [], lights: [{ x: 0.38, y: 2.45, z: 0, s: 0.7, c: '#ff5a9a' }] }; });
  // fairy lights round the tipi (from the darkwads)
  put('fairy', 0, 0, m => { const lights = [], n = 22; for (let i = 0; i < n; i++) { const a = i / n * TAU, r = t.r * 0.9, y = 1.0 + Math.sin(i * 1.7) * 0.15; m.color(BURNS_NEON[i % 7], 1); m.ball(Math.sin(a) * r, y, Math.cos(a) * r, 0.06, { seg: 6, rings: 4 }); if (i % 3 === 0) lights.push({ x: Math.sin(a) * r, y, z: Math.cos(a) * r, s: 0.5, c: BURNS_NEON[i % 7] }); } m.emissive(0); return { cols: [], lights }; });
  // roller skates hanging by the door (Granny's spares)
  put('skates', -1.2, t.r + 0.25, m => { m.color('#5a4030'); m.limb(0, 0, 0, 0, 1.4, 0, 0.03, 0.03, { seg: 4 }); for (const sx of [-0.12, 0.12]) { m.color('#ffffff').shine(1); m.roundBox(sx, 1.1, 0.08, 0.1, 0.18, 0.24, 0.04); m.color('#ff4fd8'); for (const z of [-0.02, 0.16]) m.ball(sx, 0.98, z, 0.04, { seg: 6, rings: 4 }); } m.shine(0); return { cols: [] }; });
  // the framed Butt ID, on an easel inside
  put('idframe', 1.0, -0.4, m => { m.color('#6a4a2a'); m.limb(0, 0, 0.1, 0, 0.9, 0, 0.02, 0.02, { seg: 3 }); m.limb(-0.2, 0, -0.1, 0, 0.9, 0, 0.02, 0.02, { seg: 3 }); m.limb(0.2, 0, -0.1, 0, 0.9, 0, 0.02, 0.02, { seg: 3 }); m.color('#d8b84a').shine(2); m.roundBox(0, 0.95, 0.02, 0.5, 0.36, 0.04, 0.02); m.color('#ffa86a', 0.3); m.roundBox(0, 0.95, 0.045, 0.4, 0.27, 0.01, 0.01); m.emissive(0); m.shine(0); return { cols: [] }; });
  return D;
};
