/* ============================================================
   ECUADOR AND THE GALÁPAGOS: the levels in the v2 format
   (LEVEL_OVERHAUL.md §2, world 2). Loads after 29_tour_ec.js and
   amends the registered country: new themes, stamps, country looks
   for library objects, pieces, the Souvenir Stand and the seven levels.
   2-1 Hemisphere Hop      FLIP     the yellow line flips gravity; walk the ceiling over the spikes
   2-2 Canopy of Baños     SWING    vine to vine, the swing at the end of the world, a rainbow in the mist
   2-3 Booby Dash          RACE     race a blue-footed booby; iguanas sneeze salt into stepping stones
   2-4 Cacao Works         FACTORY  belts, roasting presses, chocolate vats; the hard hat breaks the foil
   2-5 Cotopaxi Crater     LAIR     the cable car up the volcano, then El Tortugón's crater bowl
   2-6 Galápagos Snorkel   DIVE     (secret) penguins, the surge, puffers; Bottle Mail #1
   2-7 Devil's Cauldron    TIDE     (secret) the plunge pool rises and falls; a secret flight to Morocco
   ============================================================ */
(() => {
const C = Tour.countries.ec;
if (!C) return;
const K = TourKit, INK = '#22202a', WOVEN = ['#e8323a', '#ffd23a', '#2a8ad8', '#5ab84a', '#ff7a2a'];

/* ---------------- themes (procedural until their Blender scenes exist) ---------------- */
if (THEMES.ec_amazon && !THEMES.ec_amazon_dusk) {
  THEMES.ec_amazon_dusk = Object.assign({}, THEMES.ec_amazon, {
    name: 'Canopy of Baños', particles: 'fireflies',
    sky: ['#2a1a4a', '#a84a6a', '#ffb070'], horizonGlow: '#ffc890',
    celestial: { type: 'sun', x: 0.78, y: 0.62, r: 30, color: '#ffe0a0', glow: '#ff9a5a' }, stars: 0.25,
    layers: [{ kind: 'ecCanopy', color: '#3a2a4a', base: 300, f: 0.08 }, { kind: 'ecCanopy', color: '#1e1a2a', base: 355, f: 0.25 }],
    fog: '#ff9a7a', darkness: 0.18
  });
}
// 2-3's lava coast: black lava rock, a hot blue sea, a sun-bleached sky
if (THEMES.ec_galapagos && !THEMES.ec_islas) {
  THEMES.ec_islas = Object.assign({}, THEMES.ec_equator || THEMES.ec_galapagos, {
    name: 'Booby Dash', particles: 'sparkle', underwater: false,
    sky: ['#3ab8f0', '#9ae4ff', '#fff4d8'], horizonGlow: '#fff0c0',
    celestial: { type: 'sun', x: 0.7, y: 0.16, r: 34, color: '#fffbe8', glow: '#ffe08a' }, stars: 0, cloudsDyn: true,
    layers: [{ kind: 'ecIslands', color: '#5a5a66', base: 330, f: 0.05 }, { kind: 'ecSea', color: '#2a8ad8', base: 370, f: 0.15 }],
    fog: '#bfefff', darkness: 0,
    ground: { style: 'basalt', cap: '#3a3a44', capHi: '#7a7a88', dirt: '#2a2a32', dirt2: '#16161c', rock: '#4a4a56' },
    hard: { c1: '#4a4a56', c2: '#22222a' }, semi: { style: 'log', c1: '#8a7a6a', c2: '#5a4a3a' }, liquid: 'lava', decor: ['ecCactusI', 'ecRockPool']
  });
}
// 2-4's cacao works: brick walls, copper pipes, warm light
if (!THEMES.ec_fabrica && THEMES.ec_equator) {
  THEMES.ec_fabrica = Object.assign({}, THEMES.ec_equator, {
    name: 'Cacao Works', particles: 'dust',
    sky: ['#3a2418', '#6a3a24', '#a8643a'], horizonGlow: '#ffb070', celestial: { type: 'none' }, stars: 0, cloudsDyn: false,
    layers: [{ kind: 'ecFactoryWall', color: '#7a4a32', base: 420, f: 0.12 }],
    fog: '#8a5a3a', darkness: 0.12,
    ground: { style: 'basalt', cap: '#8a6a52', capHi: '#c8a07a', dirt: '#5a3a28', dirt2: '#3a2418', rock: '#6a4a36' },
    hard: { c1: '#9a6a4a', c2: '#5a3a28' }, semi: { style: 'wood', c1: '#8a6a52', c2: '#5a3a28' }, liquid: 'choc', decor: ['ecSack', 'ecPipe']
  });
}
// 2-7's waterfall gorge: deep green walls, mist, a white torrent
if (!THEMES.ec_pailon && THEMES.ec_amazon) {
  THEMES.ec_pailon = Object.assign({}, THEMES.ec_amazon, {
    name: "Devil's Cauldron", particles: 'mist',
    sky: ['#cfeff0', '#7ab8a8', '#2a5a4a'], horizonGlow: '#e8fff8', celestial: { type: 'none' }, stars: 0, darkness: 0.08,
    layers: [{ kind: 'ecGorge', color: '#2a5a3a', base: 0, f: 0.06 }, { kind: 'ecCanopy', color: '#1e3a2a', base: 380, f: 0.25 }],
    fog: '#d8fff0', liquid: 'canal'
  });
}
if (typeof LIQUIDS !== 'undefined' && !LIQUIDS.choc) LIQUIDS.choc = ['#a8643a', '#6a3418', '#3a1a0a', 'rgba(255,200,150,0.2)', null, 'rgba(255,230,200,0.5)'];
Object.assign(BGPaint, {
  // dark volcanic islands on the horizon
  ecIslands(ctx, L, rng, H) {
    for (let x = 0; x < BG_W; x += 180 + rng() * 120) { const w = 120 + rng() * 140, h = 30 + rng() * 60; ctx.fillStyle = shade(L.color, (rng() - 0.5) * 0.2); ctx.beginPath(); ctx.moveTo(x, L.base); ctx.quadraticCurveTo(x + w * 0.4, L.base - h, x + w * 0.55, L.base - h * 0.9); ctx.quadraticCurveTo(x + w * 0.8, L.base - h * 0.4, x + w, L.base); ctx.fill(); }
  },
  // the open sea with glints
  ecSea(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, L.base, H, L.color, shade(L.color, -0.35)); ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 50; i++) ctx.fillRect(rng() * BG_W, L.base + 4 + rng() * 60, 6 + rng() * 14, 1.5);
  },
  // the cacao works' back wall: brick, big copper pipes, roasting drums and a sign
  ecFactoryWall(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, 0, H, shade(L.color, -0.2), shade(L.color, -0.55)); ctx.fillRect(0, 0, BG_W, H);
    for (let y = 0; y < H; y += 16) for (let x = (y / 16) % 2 ? -16 : 0; x < BG_W; x += 32) { ctx.fillStyle = rgba(shade(L.color, (rng() - 0.5) * 0.25), 0.5); ctx.fillRect(x + 1, y + 1, 30, 14); }
    for (let x = 40; x < BG_W; x += 256) {
      ctx.fillStyle = '#c87a3a'; ctx.fillRect(x, 0, 18, L.base - 90); ctx.fillRect(x, L.base - 108, 120, 18); ctx.fillStyle = 'rgba(255,220,170,0.35)'; ctx.fillRect(x + 3, 0, 4, L.base - 90);
      ctx.fillStyle = '#5a3a2a'; rr(ctx, x + 130, L.base - 170, 90, 90, 12); ctx.fill(); ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.arc(x + 175, L.base - 125, 30, 0, TAU); ctx.fill(); ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.arc(x + 175, L.base - 125, 22, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd23a'; ctx.font = `bold 14px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('CACAO', x + 175, L.base - 185);
    }
  },
  // the gorge: tall mossy rock walls either side of a white torrent far away
  ecGorge(ctx, L, rng, H) {
    ctx.fillStyle = vgrad(ctx, 0, H, shade(L.color, 0.2), shade(L.color, -0.4)); ctx.fillRect(0, 0, BG_W, H);
    for (let x = 0; x < BG_W; x += 60 + rng() * 60) { ctx.fillStyle = rgba(shade(L.color, (rng() - 0.5) * 0.3), 0.7); ctx.fillRect(x, 0, 30 + rng() * 40, H); }
    for (let x = 100; x < BG_W; x += 340) { const g = ctx.createLinearGradient(x, 0, x + 50, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(240,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x, 0, 50, H); }
  }
});

/* ---------------- decor ---------------- */
Object.assign(Decor, {
  ecCactusI(ctx, x, y) { ctx.fillStyle = '#5a8a4a'; rr(ctx, x - 5, y - 40, 10, 40, 5); ctx.fill(); rr(ctx, x - 14, y - 30, 7, 16, 3.5); ctx.fill(); rr(ctx, x + 7, y - 26, 7, 14, 3.5); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(x, y - 41, 3, 0, TAU); ctx.fill(); },
  ecRockPool(ctx, x, y, t) { ctx.fillStyle = '#2a2a32'; ctx.beginPath(); ctx.ellipse(x, y - 3, 18, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3ab8d8'; ctx.beginPath(); ctx.ellipse(x, y - 3, 13, 3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - 6 + Math.sin(t * 2) * 3, y - 4, 5, 1); },
  ecSack(ctx, x, y) { ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.quadraticCurveTo(x - 14, y - 18, x - 6, y - 24); ctx.lineTo(x + 6, y - 24); ctx.quadraticCurveTo(x + 14, y - 18, x + 12, y); ctx.fill(); ctx.fillStyle = '#6a3418'; ctx.font = `bold 6px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('CACAO', x, y - 9); },
  ecPipe(ctx, x, y) { ctx.fillStyle = '#c87a3a'; ctx.fillRect(x - 4, y - 60, 8, 60); ctx.fillRect(x - 8, y - 64, 16, 6); ctx.fillStyle = 'rgba(255,230,190,0.4)'; ctx.fillRect(x - 3, y - 58, 2, 56); },
  // the equator monument (a civic monument: a tall stone obelisk with a globe), far behind the start
  ecMonument(ctx, x, y) {
    ctx.fillStyle = '#d8c8a8'; ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x - 18, y - 150); ctx.lineTo(x + 18, y - 150); ctx.lineTo(x + 30, y); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.arc(x, y - 172, 22, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#8a6a20'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y - 172, 22, 8, 0, 0, TAU); ctx.moveTo(x, y - 194); ctx.lineTo(x, y - 150); ctx.stroke();
    ctx.fillStyle = '#e8323a'; ctx.fillRect(x - 60, y - 6, 120, 3); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 60, y - 3, 120, 3);
  },
  // a chocolate bar sign over the factory exit
  ecExitSign(ctx, x, y, t) {
    ctx.fillStyle = '#5a2a14'; rr(ctx, x - 50, y - 150, 100, 34, 6); ctx.fill(); ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.stroke();
    for (let k = 0; k < 4; k++) { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(x - 50 + k * 25, y - 150); ctx.lineTo(x - 50 + k * 25, y - 116); ctx.stroke(); }
    ctx.fillStyle = '#ffd23a'; ctx.font = `bold 12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('SALIDA', x, y - 128);
  },
  // the hangar on the airstrip over the gorge (2-7's hidden flight)
  ecHangar(ctx, x, y, t) {
    ctx.fillStyle = '#8a9aa8'; ctx.beginPath(); ctx.moveTo(x - 90, y); ctx.lineTo(x - 90, y - 70); ctx.quadraticCurveTo(x, y - 130, x + 90, y - 70); ctx.lineTo(x + 90, y); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#3a4a5a'; ctx.fillRect(x - 50, y - 64, 100, 64);
    // the little plane waiting outside
    ctx.save(); ctx.translate(x + 40, y - 14);
    ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.ellipse(0, 0, 34, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e8323a'; ctx.fillRect(-6, -4, 12, 30); ctx.fillRect(-30, -12, 8, 12);
    ctx.fillStyle = '#5a5a6a'; ctx.save(); ctx.translate(34, 0); ctx.rotate(t * 20); ctx.fillRect(-1.5, -14, 3, 28); ctx.restore();
    ctx.restore();
    ctx.fillStyle = '#ffd23a'; ctx.font = `bold 9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('VUELOS', x, y - 78);
  }
});

/* ---------------- entities ---------------- */
// a roasting press: it slams down on its rhythm (a hiss and a shake 0.5 s before), then lifts; under it while it slams
// hurts. Between slams its plate is a platform. { period, phase, drop (tiles) }
class EcPress extends Ent {
  constructor(g, s) { super(g, s, 3 * TS, TS); this.x = s.x - 1.5 * TS; this.top = s.y - (s.drop || 4) * TS - TS; this.bottom = s.y - TS; this.y = this.top; this.period = s.period || 2.4; this.ph = s.phase || 0; this.isPlatform = true; this.dx = 0; this.dy = 0; }
  update(dt) {
    this.t += dt; const u = ((this.t + this.ph) % this.period) / this.period, oy = this.y;
    // up, the tell (0.5 s shake), a fast slam, a pause on the floor, a slow lift
    const tellU = 1 - 0.5 / this.period;
    this.warn = u > tellU - 0.25 && u < tellU;
    if (u < 0.2) this.y = this.top; else if (u < tellU - 0.25) this.y = this.top; else if (u < tellU) this.y = this.top + Math.sin(this.t * 60) * 1.5; else this.y = lerp(this.top, this.bottom, Math.min(1, (u - tellU) / 0.06));
    if (u >= 0 && u < 0.2) this.y = lerp(this.bottom, this.top, u / 0.2);
    this.dy = this.y - oy;
    if (this.warn && !this.told && this.g.onScreen(this)) { this.told = true; K.sfx('hiss', 'select', { vol: 0.35, pitch: 0.6 }); }
    if (!this.warn) this.told = false;
    const p = this.g.player, slamming = this.dy > 2;
    if (slamming && p && !p.dead && overlap(p, { x: this.x + 4, y: this.y + TS, w: this.w - 8, h: this.bottom - this.y })) p.hurt(this);
    if (Math.abs(this.y - this.bottom) < 1 && oy < this.bottom - 1 && this.g.onScreen(this)) { this.g.shake(2); this.g.burst(this.cx, this.bottom + TS, 8, '#c8a07a', 'dust'); K.sfx('stomp', 'stomp', { vol: 0.4, pitch: 0.6 }); }
  }
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w;
    ctx.fillStyle = '#5a5a66'; ctx.fillRect(this.cx - 5, this.top - 4 * TS, 10, y - this.top + 4 * TS);
    ctx.fillStyle = this.warn ? '#ff8a3a' : '#8a5a3a'; rr(ctx, x, y, w, TS, 5); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffd23a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x + 6 + k * 18, y + TS); ctx.lineTo(x + 14 + k * 18, y + TS); ctx.lineTo(x + 10 + k * 18, y + TS - 6); ctx.fill(); }
    if (this.warn) for (let k = 0; k < 3; k++) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x + 10 + k * 36, y - 6 - ((this.t * 40 + k * 7) % 14), 4, 0, TAU); ctx.fill(); }
  }
}
// a reverse lever: THROW (or a hit) flips the direction of every belt between x0 and x1
class EcBeltLever extends Ent {
  constructor(g, s) { super(g, s, 22, 40); this.y = s.y - 40; this.x0 = s.x0; this.x1 = s.x1; this.rows = s.rows; this.k = 0; this.cool = 0; this.lever = true; }
  update(dt) { this.t += dt; if (this.cool > 0) this.cool -= dt; this.k = approach(this.k, this.on ? 1 : 0, dt * 6); }
  touchPlayer(p) { if (this.cool > 0 || p.dead) return; if (Input.actionPressed || Input.upPressed) this.flip(); else if (!this.told) { this.told = true; this.g.parts.text(this.cx, this.y - 10, 'THROW: REVERSE THE BELTS', '#ffd84a'); } }
  hit(kind) { if (kind === 'plane' || kind === 'taco' || kind === 'prop') { this.flip(); return true; } return false; }
  flip() {
    this.on = !this.on; this.cool = 0.4; K.sfx('lever', 'select', { vol: 0.7 }); const A = this.g.area;
    for (const y of this.rows) for (let x = this.x0; x <= this.x1; x++) { const t = A.tiles[y * A.W + x]; if (t === T.CONV_L) this.g.setTile(x, y, T.CONV_R); else if (t === T.CONV_R) this.g.setTile(x, y, T.CONV_L); }
    this.g.burst(this.cx, this.y, 8, '#ffd84a', 'spark');
  }
  draw(ctx) {
    const x = this.cx, y = this.y + this.h;
    ctx.fillStyle = '#5a5a66'; rr(ctx, x - 9, y - 14, 18, 14, 3); ctx.fill();
    ctx.save(); ctx.translate(x, y - 12); ctx.rotate(-0.8 + this.k * 1.6); ctx.fillStyle = '#c8902a'; rr(ctx, -2, -26, 4, 26, 2); ctx.fill(); ctx.fillStyle = '#e8323a'; ctx.beginPath(); ctx.arc(0, -27, 5, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ffd23a'; ctx.font = `bold 8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText(this.on ? '◀◀' : '▶▶', x, y - 46);
  }
}
Object.assign(ENTITY_TYPES, { ecPress: EcPress, ecBeltLever: EcBeltLever });

/* ---------------- pieces ---------------- */
const P = {
  // a sign post with a tip: { text, n }
  tip(st, o) { const x = st.x, n = o.n || 3; st.floor(x, x + n - 1); st.sign(x + Math.floor(n / 2), o.text || ''); return x + n; },
  // 2-1: a high terrace right after a flip band, only reachable by dropping off the ceiling; a cracked wall on it
  //      hides the chocolate shop: { to, back }
  ceilingDrop(st, o) {
    const B = st.B, x = st.x, y = o.y || 5;
    st.floor(x, x + 10);
    B.fill(x - (o.reach || 6), y, x + 8, y, T.GROUND); B.fill(x + 9, y - 3, x + 9, y, T.HARD); B.fill(x + 9, y - 2, x + 9, y - 1, T.FAKE);
    B.spawn('tourDraft', x + 9, y - 1, { look: 'fake' });
    B.spawn('portal', x + 10, y - 1, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to || null, secretDoor: true });
    B.fill(x + 10, y, x + 11, y, T.GROUND);
    if (o.back) B.anchor(o.back, x + 4, y - 1);
    if (o.item) st.block(x + 2, y - 4, o.item);
    st.coins(x + 4, x + 7, y - 2);
    return x + 12;
  },
  // 2-1: a flip band over a pit: flip in mid air, cross on the ceiling, drop back down at the far side
  flipGap(st, o) {
    const B = st.B, x = st.x, w = o.w || 12;
    st.floor(x, x + 2);
    st.pit(x + 3, x + w + 2);
    B.zone(x + 2, 0, w + 2, B.H, 0, 0, 0, 'flip');
    B.spawn('flipLine', x + 2, B.H - 1, { w: w + 2, h: B.H, look: null });
    if (o.gold) st.gold(x + 3 + Math.floor(w / 2), 6, o.gold);
    st.coins(x + 4, x + w, 3);
    st.floor(x + w + 3, x + w + 6);
    return x + w + 7;
  },
  // a high block (L, S...) on a terrace: { item }
  highBlock(st, o) { const x = st.x; st.floor(x, x + 6); st.B.fill(x + 1, st.gy - 3, x + 5, st.gy - 1, T.HARD); st.block(x + 3, st.gy - 8, o.item || 'lsd'); st.coins(x + 1, x + 5, st.gy - 5); return x + 7; },
  // 2-3: a lava-rock stretch with a bubbling pool; press DOWN in the pool to slip into the lava tube: { to, back }
  bubblePool(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 8);
    for (let q = 2; q <= 5; q++) B.set(x + q, st.gy, T.WATER);
    B.decorAt('ecPoolRim', x + 4, st.gy, 0);
    B.spawn('mxBubbleCrack', x + 4, st.gy, {});
    B.spawn('portal', x + 4, st.gy, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to || null, secretDoor: true });
    if (o.back) B.anchor(o.back, x + 7, st.gy - 1);
    return x + 9;
  },
  // 2-3: an upper route of lava arches (the fast way): { n, gold }
  archRoute(st, o) {
    const B = st.B, x = st.x, n = o.n || 3; st.floor(x, x + n * 6 + 1);
    for (let k = 0; k < n; k++) { const ax = x + 1 + k * 6, ay = st.gy - 3 - (k % 2) * 2; for (let q = 0; q < 4; q++) B.set(ax + q, ay, T.SEMI); B.prop('ecLavaArch', ax, ay, 4, st.gy - ay, 'none', {}); st.coins(ax, ax + 3, ay - 2); }
    if (o.gold) st.gold(x + 3, st.gy - 7, o.gold);
    if (o.item) st.block(x + 9, st.gy - 9, o.item);
    return x + n * 6 + 2;
  },
  // 2-3: the sea-lion beach: tide pools to hop, sea lions belly-sliding across
  beach(st, o) {
    const B = st.B, x = st.x, n = o.n || 3; st.floor(x, x + n * 6 + 1);
    for (let k = 0; k < n; k++) { const px = x + 2 + k * 6; for (let q = 0; q < 2; q++) B.set(px + q, st.gy, T.WATER); B.decorAt('ecRockPool', px + 1, st.gy, k); }
    st.enemy('ecSeaLionLand', x + n * 6 - 2, st.gy);
    st.enemy('ecCrab', x + 4, st.gy);
    st.coins(x + 1, x + n * 6, st.gy - 3);
    return x + n * 6 + 2;
  },
  // a finish: a stamp-like goal with its own look: { look, exit }
  finish(st, o) {
    const B = st.B, x = st.x; st.floor(x, x + 12);
    if (o.look) B.decorAt(o.look, x + 6, st.gy, 0);
    B.fill(x + 3, st.gy - 1, x + 9, st.gy - 1, T.SEMI);
    B.spawn('gate', x + 8, st.gy - 2, { exit: o.exit || 'main' });
    return x + 13;
  },
  // 2-4: a long belt run with a roasting press (and a reverse lever before it): { n, dir, presses, lever }
  pressLine(st, o) {
    const B = st.B, x = st.x, n = o.n || 14, dir = o.dir || 1;
    st.floor(x, x + n + 3);
    for (let q = 2; q <= n + 1; q++) B.set(x + q, st.gy, dir > 0 ? T.CONV_R : T.CONV_L);
    const ps = o.presses || 1;
    for (let k = 0; k < ps; k++) B.spawn('ecPress', x + 4 + Math.floor((k + 0.5) * (n - 4) / ps), st.gy - 1, { period: o.period || 2.6, phase: k * 1.1, drop: 4 });
    if (o.lever) B.spawn('ecBeltLever', x + 1, st.gy - 1, { x0: x + 2, x1: x + n + 1, rows: [st.gy] });
    st.coins(x + 3, x + n, st.gy - 2);
    return x + n + 4;
  },
  // 2-4: a chocolate vat: a pit of hot chocolate with belts over it: { n, belts }
  vat(st, o) {
    const B = st.B, x = st.x, n = o.n || 8;
    st.floor(x, x + 1); st.pit(x + 2, x + n + 1);
    B.fill(x + 2, st.gy + 1, x + n + 1, st.H - 1, T.LAVA);
    const by = st.gy - 3;
    for (let q = 0; q < n; q++) B.set(x + 2 + q, by, q % 6 < 4 ? ((o.dir || 1) > 0 ? T.CONV_R : T.CONV_L) : T.EMPTY);
    for (let q = 0; q < n; q += 6) B.set(x + 2 + q, by, T.HARD);
    st.coins(x + 3, x + n, by - 2);
    st.floor(x + n + 2, x + n + 4);
    return x + n + 5;
  },
  // 2-4: the catwalk overhead (row 8): one-way planks with goodies: { n }
  catwalk8(st, o) { const x = st.x, n = o.n || 12, y = o.y || 8; st.floor(x, x + n); for (let q = 0; q < n; q++) st.B.set(x + q, y, T.SEMI); st.coins(x + 1, x + n - 2, y - 2); if (o.gold) st.gold(x + Math.floor(n / 2), y - 3, o.gold); if (o.item) st.block(x + 3, y - 4, o.item, o.hidden ? T.HIDDEN : null); st.spawn('spring', x, st.gy - 1, {}); st.B.springs.push([x, st.gy - 1]); for (let q = 0; q < n; q += 4) st.B.decorAt('ecPipe', x + q + 1, st.gy, q); return x + n + 1; },
  // 2-4: the foil crate stack (the hard hat breaks it), a vent behind it up to the wrapping room: { to, back }
  foilStack(st, o) {
    const B = st.B, x = st.x;
    const nx = Tour.pieces.breakwall(st, { needs: 'hat', h: 4, skin: 'ecFoil' });
    st.x = nx; st.floor(nx, nx + 5);
    B.decorAt('ecVentGrate', nx + 2, st.gy, 0);
    B.spawn('portal', nx + 2, st.gy - 1, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to || null, secretDoor: true });
    if (o.back) B.anchor(o.back, nx + 4, st.gy - 1);
    return nx + 6;
  },
  // 2-7: a hanging bridge (planks) over the plunge pool: { n, dippers }
  hangBridge(st, o) {
    const B = st.B, x = st.x, n = o.n || 10, y = st.gy - (o.dy || 4);
    st.floor(x, x + 1); st.pit(x + 2, x + n + 1);
    for (let q = 0; q < n; q++) B.set(x + 2 + q, y, T.SEMI);
    B.prop('ecRopeBridge', x + 2, y, n, 1, 'none', {});
    if (o.dippers) st.spawn('ecDipper', x + 2 + Math.floor(n / 2), y + 1, {});
    st.coins(x + 3, x + n, y - 2);
    if (o.gold) st.gold(x + 2 + Math.floor(n / 2), y - 3, o.gold);
    // a rope hanging off the far end of the bridge up the cliff (a way to the hidden airstrip)
    if (o.rope) { B.decorAt('ecRope', x + n + 1, y, 0); B.spawn('portal', x + n + 1, y - 1, { kind: 'door', look: 'tourDoorHidden', targetRef: o.rope, secretDoor: true }); if (o.back) B.anchor(o.back, x + n, y - 1); }
    st.floor(x + n + 2, x + n + 4);
    return x + n + 5;
  },
  // ride: an item block hanging over the line: { item, dy }
  airBlock(st, o) { const x = st.x, d = st.deck || st.gy; st.block(x + 1, d - (o.dy || 4), o.item || 'power'); st.coins(x, x + 2, d - (o.dy || 4) - 2); return x + 4; },
  // 2-7: a mist column (an updraft from the spray): { h }
  mist(st, o) { return Tour.pieces.fan(st, { w: 2, h: o.h || 8, force: o.force || 30, skin: 'ecMist' }); },
  // a sunken crate with Bottle Mail inside (swim): { n }
  sunkenBottle(st, o) { const x = st.x, F = st.floorY; st.rock(x, F - 2, x + 5, F - 1); st.B.decorAt('ecCrate', x + 3, F - 2, 0); st.spawn('bottle', x + 3, F - 4, { n: o.n || 1 }); return x + 7; },
  // swim: a fins stand on the sea bed with a tip
  finsStand(st, o) { const x = st.x; st.B.fill(x, st.floorY, x + 4, st.floorY, T.GROUND); Tour.pieces.gearStand(st, { item: 'fins', here: true }); const s = st.B.spawns[st.B.spawns.length - 1]; s.x = (x + 2) * TS + TS / 2; s.y = st.floorY * TS; st.B.vkeys[st.B.vkeys.length - 1].tiles = [[x + 2, st.floorY - 1], [x + 2, st.floorY - 2]]; if (o.sign) st.B.spawn('sign', x + 4, st.floorY - 1, { text: o.sign }); return x + 6; },
  // swim: an underwater door to a dry grotto: { to }
  grottoDoor(st, o) { const x = st.x, F = st.floorY; st.rock(x, F - 3, x + 6, F - 1); st.B.decorAt('ecGrottoMouth', x + 3, F - 3, 0); st.B.spawn('portal', x + 3, F - 4, { kind: 'door', look: 'tourDoorHidden', targetRef: o.to || null }); if (o.back) st.B.anchor(o.back, x + 3, F - 5); return x + 8; },
  // swim: the way out: up into a sunny cove with the gate
  coveExit(st, o) {
    const x = st.x, B = st.B, F = st.floorY, w = 16;
    B.fill(x, 0, x + w, 1, T.EMPTY); for (let xx = x; xx <= x + w; xx++) { B.setHide(xx, 0, 0); B.setHide(xx, 1, 0); }
    B.fill(x + 6, 6, x + 12, 6, T.GROUND);
    B.spawn('gate', x + 9, 5, { exit: o.exit || 'main' });
    st.coins(x + 2, x + 5, 9);
    B.fill(x + w + 1, 0, x + w + 2, B.H - 1, T.GROUND);
    return x + w + 1;
  },
  // ride: a mountain hut on the cable line (a door up on the catwalk): { to, back }
  hutDoor(st, o) {
    const x = st.x, B = st.B, cy = st.deck - 4, w = 7;
    for (let q = 0; q < w; q++) { B.set(x + q, cy, T.SEMI); B.setHide(x + q, cy, 1); }
    B.prop('ecCatwalk', x, cy, w, 1, 'none', {});
    B.decorAt('ecHut', x + 4, cy, 0);
    B.spawn('portal', x + 4, cy - 1, { kind: 'door', look: 'tourDoor', targetRef: o.to || null });
    if (o.back) B.anchor(o.back, x + 2, cy - 1);
    st.coins(x, x + w - 1, cy - 2);
    return x + w + 3;
  }
};
for (const k in P) Tour.pieces['ec.' + k] = P[k];
Object.assign(Decor, {
  ecPoolRim(ctx, x, y, t) { ctx.fillStyle = '#2a2a32'; ctx.beginPath(); ctx.ellipse(x, y + 2, 72, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3ab8d8'; ctx.beginPath(); ctx.ellipse(x, y + 4, 62, 6, 0, 0, TAU); ctx.fill(); },
  ecLavaArch(ctx, x, y, t, th, d) { const w = d.w, h = d.h, x0 = x - w / 2; ctx.fillStyle = '#3a3a44'; ctx.beginPath(); ctx.moveTo(x0 - 6, y); ctx.lineTo(x0 - 6, y - h); ctx.lineTo(x0 + w + 6, y - h); ctx.lineTo(x0 + w + 6, y); ctx.lineTo(x0 + w - 8, y); ctx.quadraticCurveTo(x, y - h + 26, x0 + 8, y); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x0 - 4, y - h + 2, w + 8, 3); },
  ecVentGrate(ctx, x, y, t) { ctx.fillStyle = '#3a3a44'; rr(ctx, x - 22, y - 46, 44, 46, 4); ctx.fill(); ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - 18, y - 40 + k * 9); ctx.lineTo(x + 18, y - 40 + k * 9); ctx.stroke(); } for (let q = 0; q < 3; q++) { const u = (t * 0.7 + q / 3) % 1; ctx.fillStyle = `rgba(200,150,110,${0.5 * (1 - u)})`; ctx.beginPath(); ctx.arc(x + Math.sin(q * 2 + t) * 8, y - 50 - u * 40, 6 + u * 8, 0, TAU); ctx.fill(); } },
  ecRopeBridge(ctx, x, y, t, th, d) { const w = d.w, x0 = x - w / 2, top = y - d.h; ctx.strokeStyle = '#a07a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 - 10, top - 30); ctx.quadraticCurveTo(x, top - 10, x0 + w + 10, top - 30); ctx.stroke(); for (let k = 0; k <= w / 16; k++) { const xx = x0 + k * 16; ctx.beginPath(); ctx.moveTo(xx, top); ctx.lineTo(xx, top - 22 + Math.sin((xx - x0) / w * Math.PI) * 12); ctx.stroke(); } },
  ecCrate(ctx, x, y) { ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x - 22, y - 28, 44, 28); ctx.strokeStyle = '#4a3418'; ctx.lineWidth = 2; ctx.strokeRect(x - 22, y - 28, 44, 28); ctx.beginPath(); ctx.moveTo(x - 22, y - 28); ctx.lineTo(x + 22, y); ctx.stroke(); },
  ecGrottoMouth(ctx, x, y, t) { ctx.fillStyle = '#0a1a24'; ctx.beginPath(); ctx.ellipse(x, y, 34, 22, 0, Math.PI, TAU); ctx.fill(); for (let q = 0; q < 4; q++) { const u = (t * 0.6 + q / 4) % 1; ctx.fillStyle = 'rgba(230,252,255,0.8)'; ctx.beginPath(); ctx.arc(x - 12 + q * 8, y - 10 - u * 60, 2.5, 0, TAU); ctx.fill(); } },
  ecRope(ctx, x, y, t) { ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 260); ctx.quadraticCurveTo(x + Math.sin(t) * 6, y - 130, x, y); ctx.stroke(); for (let k = 0; k < 12; k++) { ctx.fillStyle = '#a07a44'; ctx.fillRect(x - 4, y - 250 + k * 20, 8, 3); } },
  ecHut(ctx, x, y) { ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - 40, y - 60, 80, 60); ctx.fillStyle = '#c84a2a'; ctx.beginPath(); ctx.moveTo(x - 48, y - 58); ctx.lineTo(x, y - 90); ctx.lineTo(x + 48, y - 58); ctx.fill(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 20, y - 74); ctx.lineTo(x, y - 86); ctx.lineTo(x + 20, y - 74); ctx.fill(); ctx.fillStyle = '#ffd23a'; ctx.fillRect(x - 30, y - 44, 12, 12); }
});

/* ---------------- country looks for library objects ---------------- */
const leafy = (ctx, x0, y0, w, h, t, part) => {
  for (let k = 0; k < 7; k++) {
    const x = x0 + 3 + k * (w - 6) / 6, sway = Math.sin(t * 1.4 + k) * 2.5 * (1 + part * 3) * (k < 3.5 ? -1 : 1);
    ctx.strokeStyle = k % 2 ? '#2f7a34' : '#45984a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + sway * 0.5, y0 + h * 0.5, x + sway, y0 + h - 2); ctx.stroke();
    for (let q = 0; q < 7; q++) { const yy = y0 + 6 + q * (h - 10) / 6, xx = x + sway * (q / 7); ctx.fillStyle = q % 2 ? '#6ac850' : '#3e9440'; ctx.beginPath(); ctx.ellipse(xx + (q % 2 ? 3.5 : -3.5), yy, 4.2, 2, q % 2 ? 0.7 : -0.7, 0, TAU); ctx.fill(); }
  }
};
const skins = {
    // a curtain of leaves with a rope ladder half hidden in it (2-2's way up to the treehouse)
    ecLeafLadder(ctx, e, t) {
      const x0 = e.x, y0 = e.y, w = e.w, h = e.h;
      ctx.save(); ctx.globalAlpha = 1 - (e.part || 0) * 0.6;
      ctx.strokeStyle = '#a07a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + w / 2 - 8, y0 - 10); ctx.lineTo(x0 + w / 2 - 8, y0 + h); ctx.moveTo(x0 + w / 2 + 8, y0 - 10); ctx.lineTo(x0 + w / 2 + 8, y0 + h); ctx.stroke();
      for (let yy = y0; yy < y0 + h; yy += 12) { ctx.fillStyle = '#c8955a'; ctx.fillRect(x0 + w / 2 - 9, yy, 18, 3); }
      leafy(ctx, x0, y0 - 6, w, h + 6, t, e.part || 0);
      ctx.restore();
    },
    // the rope ladder back down from the treehouse (a door look)
    ecRopeLadder(ctx, e, t) {
      const x = e.cx, y = e.y + e.h;
      ctx.fillStyle = 'rgba(20,30,15,0.55)'; rr(ctx, x - 16, y - 52, 32, 52, 10); ctx.fill();
      ctx.strokeStyle = '#a07a44'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x - 9, y - 52); ctx.lineTo(x - 9, y); ctx.moveTo(x + 9, y - 52); ctx.lineTo(x + 9, y); ctx.stroke();
      for (let yy = y - 46; yy < y; yy += 10) { ctx.fillStyle = '#c8955a'; ctx.fillRect(x - 10, yy, 20, 3); }
      ctx.fillStyle = '#4e9d43'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(x - 14 + k * 6, y - 52 + (k % 2) * 3, 5, 2.4, k * 0.5, 0, TAU); ctx.fill(); }
    },
    // the back of the waterfall curtain (a door look in the cascada room)
    ecWaterCurtain(ctx, e, t) {
      const x = e.cx, y = e.y + e.h;
      const g = ctx.createLinearGradient(x - 16, 0, x + 16, 0); g.addColorStop(0, 'rgba(150,215,255,0.6)'); g.addColorStop(0.5, 'rgba(230,250,255,0.85)'); g.addColorStop(1, 'rgba(150,215,255,0.6)');
      ctx.fillStyle = g; rr(ctx, x - 16, y - 54, 32, 54, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.2; for (let k = 0; k < 5; k++) { const xx = x - 12 + k * 6, off = (t * 140 + k * 23) % 64; ctx.beginPath(); ctx.moveTo(xx, y - 54 + Math.max(0, off - 12)); ctx.lineTo(xx, y - 54 + Math.min(54, off)); ctx.stroke(); }
    },
    // the swing at the end of the world: a plank seat on two ropes from a giant branch (the catapult)
    ecTreeSwing(ctx, e, t) {
      const x = e.cx, y = e.y + e.h, k = e.k || 0, a = -0.25 - k * 1.2 + Math.sin(t * 1.5) * 0.06 * (1 - k);
      ctx.save();
      ctx.fillStyle = '#4a3020'; rr(ctx, x - 70, y - 150, 160, 14, 7); ctx.fill(); ctx.fillStyle = '#5a9a3a'; for (let q = 0; q < 8; q++) { ctx.beginPath(); ctx.ellipse(x - 60 + q * 20, y - 152, 14, 7, 0, 0, TAU); ctx.fill(); }
      ctx.translate(x, y - 140); ctx.rotate(a);
      ctx.strokeStyle = '#c8a070'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-14, 120); ctx.moveTo(14, 0); ctx.lineTo(14, 120); ctx.stroke();
      TourObj.plank(ctx, -24, 118, 48, 9);
      ctx.restore();
    },
    // a stack of crates wrapped in gold foil (the hard hat's wall)
    ecFoil(ctx, e, t) {
      const x = e.cx, y = e.y + e.h, h = (e.s.h || 4) * TS;
      if (e.broken) return;
      for (let k = 0; k < h / 26; k++) { const yy = y - 26 - k * 26; const g = ctx.createLinearGradient(x - 18, 0, x + 18, 0); g.addColorStop(0, '#c8902a'); g.addColorStop(0.5, '#fff0a0'); g.addColorStop(1, '#c8902a'); ctx.fillStyle = g; rr(ctx, x - 18, yy, 36, 24, 3); ctx.fill(); ctx.strokeStyle = '#8a5a14'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#5a2a14'; ctx.fillRect(x - 18, yy + 10, 36, 4); }
    },
    // a mist column from the falls (a fan's look)
    ecMist(ctx, e, t) {
      const x = e.cx, y = e.y + e.h;
      for (let q = 0; q < 8; q++) { const u = (t * 0.5 + q / 8) % 1; ctx.fillStyle = `rgba(240,255,255,${0.45 * (1 - u)})`; ctx.beginPath(); ctx.arc(x + Math.sin(q * 2 + t) * 14, y - u * 220, 10 + u * 18, 0, TAU); ctx.fill(); }
    }
};

Object.assign(Decor, {
  // the arch at the end of 2-1: a painted sign, HEMISFERIO SUR
  ecHemiArch(ctx, x, y, t) {
    ctx.fillStyle = '#d8c8a8'; for (const px of [x - 60, x + 48]) { ctx.fillRect(px, y - 120, 12, 120); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(px, y - 120, 12, 120); }
    ctx.fillStyle = '#e8323a'; rr(ctx, x - 70, y - 146, 140, 28, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd23a'; ctx.font = `bold 12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('HEMISFERIO SUR', x, y - 128);
  },
  // flags at the start and finish of the race
  ecRaceFlags(ctx, x, y, t) {
    ctx.fillStyle = '#4a4a56'; ctx.fillRect(x - 40, y - 110, 5, 110); ctx.fillRect(x + 36, y - 110, 5, 110);
    ctx.fillStyle = '#ffffff'; rr(ctx, x - 44, y - 124, 88, 22, 4); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
    for (let k = 0; k < 11; k++) for (let r = 0; r < 2; r++) if ((k + r) % 2) { ctx.fillStyle = '#1a1a22'; ctx.fillRect(x - 44 + k * 8, y - 124 + r * 11, 8, 11); }
    for (let k = 0; k < 6; k++) { ctx.fillStyle = WOVEN[k % 5]; ctx.beginPath(); ctx.moveTo(x - 34 + k * 13, y - 100); ctx.lineTo(x - 22 + k * 13, y - 100); ctx.lineTo(x - 28 + k * 13 + Math.sin(t * 3 + k) * 2, y - 88); ctx.fill(); }
  },
  // a giant kapok trunk and a plank platform: the start of the canopy
  ecBigTrunk(ctx, x, y) {
    ctx.fillStyle = '#5a3a24'; ctx.beginPath(); ctx.moveTo(x - 40, y + 300); ctx.lineTo(x - 26, y - 120); ctx.lineTo(x + 26, y - 120); ctx.lineTo(x + 40, y + 300); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 9, y - 110); ctx.lineTo(x + k * 12, y + 300); ctx.stroke(); }
    ctx.fillStyle = '#2a6a2a'; for (const [dx, dy, r] of [[-30, -130, 40], [20, -150, 46], [60, -120, 34], [-70, -110, 30]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, TAU); ctx.fill(); }
  }
});

/* ---------------- stamps ---------------- */
const stamps = {
  // 2-1's start: the plaza at the middle of the world, the monument far behind
  mitadPlaza: { floor: 7, rows: ['..............', '..............', '..............', '..............', '..............', '..............', '..@.....m.....', '##############'], legend: { m: ['decor', 'ecMonument'] } },
  // 2-1's chocolate shop behind the cracked wall on the high terrace
  chocolateria: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#..o.o.o.o.o...............#',
      '#................*.........#',
      '#..............-----.......#',
      '#.......?..................#',
      '#....-----.........-----...#',
      '#..........................#',
      '#..k......k.......k........#',
      '#.@D.......................#',
      '############################',
      '############################'
    ],
    legend: { k: ['decor', 'ecSack'] }, items: ['oneup'], doors: [{ to: 'mitad@shopBack' }], gold: { '*': 'hidden' }
  },
  // 2-2's start: a plank platform round a giant trunk
  copa: { floor: 4, rows: ['............', '............', '.....t......', '..@.........', '############'], legend: { t: ['decor', 'ecBigTrunk'] } },
  treehouse: {
    floor: 10,
    rows: [
      '##############################',
      '#............................#',
      '#....o.o.o.o.o.o.............#',
      '#............................#',
      '#............................#',
      '#.................*..........#',
      '#...............-----........#',
      '#.......?....................#',
      '#............................#',
      '#.@.D...........n.......n....#',
      '##############################',
      '##############################'
    ],
    legend: { n: ['decor', 'ecNest'] }, items: ['oneup'], doors: [{ to: 'canopy@treeBack', look: 'ecRopeLadder' }], gold: { '*': 'hidden' }
  },
  cascada: {
    floor: 12,
    rows: [
      '########################',
      '#......................#',
      '#..r......r......r.....#',
      '#......................#',
      '#...o.o.o.o.o.o.o......#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#.@.D............g.....#',
      '########################',
      '########################'
    ],
    legend: { r: ['decor', 'ecMistRainbow'] }, doors: [{ to: 'canopy@fallsBack', look: 'ecWaterCurtain' }]
  },
  // 2-3's starting line on the lava coast
  salida: { floor: 6, rows: ['............', '............', '............', '............', '..@...f.....', '............', '############'], legend: { f: ['decor', 'ecRaceFlags'] } },
  // 2-4's loading dock: sacks of beans, a pipe, the door in
  muelle: { floor: 6, rows: ['............', '............', '............', '..........p.', '.....k......', '..@......k..', '############'], legend: { k: ['decor', 'ecSack'], p: ['decor', 'ecPipe'] } },
  // 2-4's wrapping room behind the foil: the way out to the Souvenir Stand (a secret gate)
  envoltura: {
    floor: 10,
    rows: [
      '############################',
      '#..........................#',
      '#..o.o.o.o.................#',
      '#..............*...........#',
      '#............-----.........#',
      '#..........................#',
      '#....----..................#',
      '#..........................#',
      '#..k................k......#',
      '#.@D.................g.....#',
      '############################',
      '############################'
    ],
    legend: { k: ['decor', 'ecSack'] }, doors: [{ to: 'fabrica@foilBack' }], gold: { '*': 'hidden' }
  },
  // 2-5's mountain hut on the cable line
  refugio: {
    floor: 10,
    rows: [
      '##########################',
      '#........................#',
      '#..o.o.o.o...............#',
      '#...............*........#',
      '#.............-----......#',
      '#......?.................#',
      '#...-----................#',
      '#........................#',
      '#..a..........a..........#',
      '#.@D.....................#',
      '##########################',
      '##########################'
    ],
    legend: { a: ['decor', 'ecAgave'] }, items: ['oneup'], doors: [{ to: 'teleferico@hutBack' }], gold: { '*': 'hidden' }
  },
  // 2-6's grotto: a dry cave with a mushroom, a 1UP and P2
  grotto: {
    floor: 10,
    rows: [
      '##########################',
      '#........................#',
      '#..o.o.o.o.o.............#',
      '#.............*..........#',
      '#...........-----........#',
      '#......?..............?..#',
      '#....-----...............#',
      '#........................#',
      '#........................#',
      '#.@D.....................#',
      '##########################',
      '##########################'
    ],
    items: ['power', 'oneup'], doors: [{ to: 'mar@grottoBack' }], gold: { '*': 'hidden' }
  },
  // 2-7's plateau over the gorge: an old airstrip, the hangar, the plane (a secret flight to Morocco)
  pista: {
    floor: 10,
    rows: [
      '########################################',
      '#......................................#',
      '#......................................#',
      '#..o.o.o.o.o...........................#',
      '#.....?................................#',
      '#..............*.......................#',
      '#............-----.....................#',
      '#......................................#',
      '#..........................a...........#',
      '#.@D.......................g...........#',
      '########################################',
      '########################################'
    ],
    legend: { a: ['decor', 'ecHangar'] }, items: ['oneup'], doors: [{ to: 'pailon@ropeBack' }], gold: { '*': 'hidden' }
  },
  // La Tienda del Cacao: the booby keeps the stand ($ is the shop)
  stand: {
    floor: 9,
    rows: [
      '############################',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#..........................#',
      '#.@...k....$...q.....k..G..#',
      '############################',
      '############################'
    ],
    legend: { k: ['decor', 'ecSack'], q: ['decor', 'ecKeeperBooby'] }
  }
};

// decor the stamps use: a bird's nest of twigs with blue eggs, a rainbow in the mist
Object.assign(Decor, {
  ecNest(ctx, x, y, t) {
    ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.ellipse(x, y - 6, 15, 7, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#5a4020'; ctx.lineWidth = 1.2; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(x - 15 + k * 4, y - 9 + (k % 2) * 3); ctx.lineTo(x - 9 + k * 4, y - 3 - (k % 2) * 3); ctx.stroke(); }
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#7ad8f0'; ctx.beginPath(); ctx.ellipse(x - 6 + k * 6, y - 11, 3.4, 4.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - 7 + k * 6, y - 14, 1.4, 2); }
  },
  ecMistRainbow(ctx, x, y, t) {
    ctx.save(); ctx.globalAlpha = 0.28 + 0.08 * Math.sin(t * 1.3 + x);
    ['#ff4f6a', '#ffd84a', '#5ae07a', '#38c8ff', '#8a5aff'].forEach((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, y + 30, 40 - k * 3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
    ctx.restore();
  }
});

/* ---------------- the levels ---------------- */
const L1 = { n: 1, name: 'Hemisphere Hop', arch: 'flip', theme: 'ec_equator',
  gimmick: 'Cross the yellow equator line and gravity flips: walk the ceiling over the spikes, flip in mid air over the gaps',
  hint: 'Walk over the yellow line: you fall UP onto the ceiling. Cross the next line to drop back down',
  postcard: 'Brady! On the equator line I walked on the ceiling. My hair did too. ♥ C',
  enemies: [['ecBanana', 3], ['ecCacao', 2], ['ecHummingbird', 1]],
  mapCell: [0, 0], mapFrom: -1,
  exits: { main: { to: '2-2' } },
  areas: [
    { id: 'mitad', gen: 'strip', W: 200, H: 22, ceil: 1,
      script: [
        ['startStamp', { id: 'mitadPlaza' }],
        'booby',
        ['itemBlock', { item: 'power' }],
        ['tip', { text: 'THE YELLOW LINE FLIPS GRAVITY! WALK THE CEILING OVER THE SPIKES. CROSS THE NEXT LINE TO DROP BACK DOWN' }],
        // ① the first line: the ceiling over a spike floor
        ['flipline', { w: 14, spikes: true }],
        ['postcard', { kind: 'must', dx: -9, dy: -10 }],
        ['bananas', { n: 3 }],
        // ② banana-leaf platforms from both sides; a terrace you only reach by dropping off the ceiling
        ['flipline', { w: 16, spikes: true }],
        ['ceilingDrop', { to: 'chocolateria@in', back: 'shopBack', y: 6, item: 'power' }],
        ['enemies', { kind: 'ecBanana', n: 2, len: 10 }],
        'cp',
        // ③ mid-air flips over gaps; hummingbirds dart
        ['flipGap', { w: 12, gold: 'risky' }],
        ['enemies', { kind: 'ecHummingbird', n: 1, len: 8 }],
        'cacao',
        ['flipGap', { w: 10 }],
        ['highBlock', { item: 'lsd' }],
        ['flipline', { w: 10 }],
        ['finish', { look: 'ecHemiArch' }]
      ] },
    { id: 'chocolateria', gen: 'room', role: 'secret', stamp: 'chocolateria' }
  ] };

const L2 = { n: 2, name: 'Canopy of Baños', arch: 'swing', theme: 'ec_amazon_dusk',
  gimmick: 'No ground: swing vine to vine, then ride the swing at the end of the world',
  hint: 'Jump into a vine to grab it, jump again to let go at the top of the swing',
  postcard: 'Brady, the frogs here are see-through. I checked. Twice. ♥ C',
  enemies: [['ecFrog', 3], ['ecGlassFrog', 2], ['ecCondor', 1]],
  mapCell: [1, 0], mapFrom: 0,
  exits: { main: { to: '2-3' }, secret: { to: '2-7', hint: 'A rainbow hangs in the mist of the last waterfall...' } },
  areas: [
    { id: 'canopy', gen: 'islands', W: 210, H: 24, bottomKill: true,
      script: [
        ['startStamp', { id: 'copa' }],
        // ① vines between giant trees
        ['itemBlock', { item: 'power', y: 4 }],
        ['itemBlock', { item: 'cake', y: 4 }],   // a jump power (bonus)
        ['vines', { n: 3 }],
        ['branches', {}],
        ['secretDoor', { to: 'treehouse@in', look: 'ecLeafLadder', back: 'treeBack' }],
        ['postcard', { kind: 'must', dy: -4 }],
        'cp',
        // ② the glow: glass frogs only show in it; lily pads sink on the river below
        ['gearStand', { item: 'wand' }],
        ['tip', { text: 'GLASS FROGS ARE SEE-THROUGH: THEY SHOW IN THE GLOW OF THE MUSHROOMS. THE BUBBLE WAND MAKES BUBBLE STEPS' }],
        ['glow', {}],
        ['lilies', { n: 4 }],
        ['enemies', { kind: 'ecGlassFrog', n: 2 }],
        ['ring', { len: 3 }], ['ring', { len: 3 }],
        // ③ the swing at the end of the world, then vines across the falls
        ['catapult', { to: [16, -2], skin: 'ecTreeSwing' }],
        ['postcard', { kind: 'risky', dy: -7 }],
        ['vines', { n: 4 }],
        ['itemBlock', { item: 'oneup', y: 6, hidden: true }],
        ['secretDoor', { to: 'cascada@in', look: 'curtain', back: 'fallsBack' }],
        ['finish', {}]
      ] },
    { id: 'treehouse', gen: 'room', role: 'sub', theme: 'ec_amazon', stamp: 'treehouse' },
    { id: 'cascada', gen: 'room', role: 'secret', theme: 'ec_amazon', stamp: 'cascada' }
  ] };

const L3 = { n: 3, name: 'Booby Dash', arch: 'race', theme: 'ec_islas',
  gimmick: 'Race Pata Azul the blue-footed booby over the lava coast; iguanas sneeze salt into stepping stones',
  hint: 'Beat the booby to the flags! The salt the iguanas sneeze sets into stepping stones: the fast way up',
  postcard: 'Pata Azul says she wants a rematch. Her feet are SO blue. ♥ C',
  enemies: [['ecIguanaSalt', 2], ['ecCrab', 2], ['ecSeaLionLand', 1]],
  mapCell: [2, 0], mapFrom: 1,
  exits: { main: { to: '2-4' }, secret: { to: '2-6', hint: 'A pool bubbles in a lava tube...' } },
  areas: [
    { id: 'islas', gen: 'strip', W: 190, H: 20,
      script: [
        ['startStamp', { id: 'salida' }],
        'booby',
        ['rival', { name: 'PATA AZUL', type: 'ecBooby', speed: 5.4 }],
        // ① over the lava rock
        ['flat', { n: 6 }], 'gap',
        ['enemies', { kind: 'ecCrab', n: 1, len: 8 }],
        ['archRoute', { n: 3, gold: 'must', item: 'power' }],
        // ② the salt-sneezing iguanas: their salt makes the fast upper route
        ['tip', { text: 'MARINE IGUANAS SNEEZE SALT. IT SETS INTO STEPPING STONES FOR A FEW SECONDS!' }],
        ['enemies', { kind: 'ecIguanaSalt', n: 2, len: 12 }],
        ['archRoute', { n: 2, item: 'star' }],
        ['bubblePool', { to: 'tubo@in', back: 'tubeBack' }],
        'cp',
        // ③ the sea-lion beach, a sprint over the arches
        ['beach', { n: 3 }],
        ['enemies', { kind: 'ecIguanaSalt', n: 1, len: 8 }],
        ['archRoute', { n: 3, gold: 'risky' }],
        ['finish', { look: 'ecRaceFlags' }]
      ] },
    { id: 'tubo', gen: 'swim', role: 'secret', H: 14, width: 80, ending: false, theme: 'ec_galapagos',
      script: [['arches', {}], ['postcard', { kind: 'hidden', dx: -5, dy: -8 }], ['airBlock', { item: 'oneup', dy: 5 }], ['coveExit', { exit: 'secret' }]] }
  ] };

const L4 = { n: 4, name: 'Cacao Works', arch: 'factory', theme: 'ec_fabrica',
  gimmick: 'Ride the belts through a chocolate factory: roasting presses stamp, the vats bubble, a lever turns the belts round',
  hint: 'Presses hiss before they slam: wait for the hiss, then run under',
  postcard: 'I licked a chocolate press. It was hot. Worth it. ♥ C',
  enemies: [['ecCacao', 2], ['ecHummingbird', 1], ['ecIceCube', 2]],
  mapCell: [2, 1], mapFrom: [2, 5],
  exits: { main: { to: '2-5' }, secret: { to: 'house:ec-cacao', hint: 'A stack of foil crates hides a vent...' } },
  areas: [
    { id: 'fabrica', gen: 'strip', W: 200, H: 20,
      script: [
        ['startStamp', { id: 'muelle' }],
        ['itemBlock', { item: 'power' }],
        ['itemBlock', { item: 'socks', y: 4 }],   // a jump power (bonus)
        ['tip', { text: 'A HARD HAT! IT BREAKS FOIL WALLS AND SOAKS UP ONE HIT. TAP THROW TO SHOULDER-DASH' }],
        ['gearStand', { item: 'hat' }],
        // ① belts carry pods and Brady
        ['belt', { n: 10 }],
        ['pressLine', { n: 12, presses: 1 }],
        ['catwalk8', { n: 12, gold: 'must', item: 'sundial', hidden: true }],
        // ② roasting presses in rhythm, chocolate vats
        ['vat', { n: 10 }],
        ['pressLine', { n: 16, presses: 2 }],
        ['foilStack', { to: 'envoltura@in', back: 'foilBack' }],
        'cp',
        // ③ the reverse lever over the vats; the cooling tunnel
        ['pressLine', { n: 14, presses: 2, dir: -1, lever: true }],
        ['postcard', { kind: 'risky', dx: -8, dy: -2 }],
        ['vat', { n: 12, dir: 1 }],
        ['iceRun', { n: 12 }],
        ['enemies', { kind: 'ecIceCube', n: 2, len: 10 }],
        ['finish', { look: 'ecExitSign' }]
      ] },
    { id: 'envoltura', gen: 'room', role: 'secret', theme: 'ec_fabrica', stamp: 'envoltura' }
  ] };

const L5 = { n: 5, name: 'Cotopaxi Crater', arch: 'lair', theme: 'ec_andes', boss: 'ec_tortoise',
  gimmick: 'Ride the cable car up the volcano, then face El Tortugón in the crater bowl',
  hint: 'Stomp the lever to pop a vent under El Tortugón: flipped on his back, his belly is open!',
  postcard: 'The Equator monument is back where it belongs! The Baron flew to Brazil. Samba time! ♥ C',
  enemies: [['ecCondor', 1], ['ecAlpaca', 1]],
  mapCell: [1, 2], mapFrom: 3,
  exits: { main: { to: 'country:next' } },
  areas: [
    { id: 'teleferico', gen: 'ride', len: 120, H: 16, deck: 10, vehicle: 'ecGondola', vehicleW: 6, below: 'none', scroll: 2.4, endDoor: 'crater@in',
      script: [['airBlock', { item: 'power' }], 'tower', ['catwalk', { gold: true }], 'condors', ['hutDoor', { to: 'refugio@in', back: 'hutBack' }], 'cp', 'tower', ['airBlock', { item: 'sig', dy: 3 }], ['ridge', { w: 2 }], 'condors', 'tower'] },
    { id: 'refugio', gen: 'room', role: 'secret', theme: 'ec_andes', stamp: 'refugio' },
    { id: 'crater', gen: 'arena', role: 'arena', layout: 'vents', arenaW: 30, H: 18, roof: false, theme: 'ec_cotopaxi' }
  ] };

const L6 = { n: 6, name: 'Galápagos Snorkel', arch: 'dive', secret: true, theme: 'ec_galapagos',
  gimmick: 'Snorkel a sunlit sea: zipping penguins, the tidal surge, puffers that puff up (bounce on their tops)',
  hint: 'Puffers swell when you get close: their tops are bouncy',
  postcard: 'A message in a bottle! It says "keep looking". Bossy bottle. ♥ C',
  enemies: [['ecSeaLion', 1], ['ecPuffer', 2], ['ecPenguin', 1]],
  mapCell: [0, 1], mapFrom: 2,
  exits: { main: { to: 'node:2-4' } },
  areas: [
    { id: 'mar', gen: 'swim', H: 18, width: 360, ending: false,
      script: [
        'surface',
        ['finsStand', { sign: 'FLIPPER FINS! SWIM FASTER, TAP THROW TO DASH THROUGH THE SURGE' }],
        ['arches', { gold: true }],
        'puffers',
        ['penguins', { w: 12 }],
        ['grottoDoor', { to: 'grotto@in', back: 'grottoBack' }],
        'surge',
        ['postcard', { kind: 'risky', dx: -5, dy: -9 }],
        ['sunkenBottle', { n: 1 }],
        'cp',
        'puffers', 'surge',
        ['penguins', { w: 10, dir: -1 }],
        'arches',
        ['coveExit', {}]
      ] },
    { id: 'grotto', gen: 'room', role: 'secret', theme: 'ec_galapagos', stamp: 'grotto' }
  ] };

const L7 = { n: 7, name: "Devil's Cauldron", arch: 'tide', secret: true, theme: 'ec_pailon',
  gimmick: 'A waterfall gorge: the plunge pool rises and falls; swim up with the high water to the bridges',
  hint: 'Wait for the high water and swim up to the bridges you cannot jump to',
  postcard: "The waterfall roars like the Baron's blimp engine. Louder, actually. ♥ C",
  enemies: [['ecFrog', 2], ['ecHummingbird', 1], ['ecDipper', 1]],
  mapCell: [0, 2], mapFrom: 1,
  exits: { main: { to: null }, secret: { to: 'flight:ma', hint: 'A rope at the end of the last bridge leads up the cliff...' } },
  areas: [
    { id: 'pailon', gen: 'strip', W: 160, H: 22, GY: 16, tide: { low: 20, high: 12, period: 12, hold: 3 },
      script: [
        ['tip', { text: 'THE POOL RISES AND FALLS. FLIPPER FINS HELP YOU SWIM UP WITH THE HIGH WATER' }],
        ['gearStand', { item: 'fins' }],
        ['itemBlock', { item: 'power' }],
        // ① the falls surge
        'gap',
        ['hangBridge', { n: 8 }],
        // ② hanging bridges and mist columns
        ['mist', { h: 8 }],
        ['hangBridge', { n: 10, dippers: true, gold: 'must' }],
        ['enemies', { kind: 'ecFrog', n: 1, len: 8 }],
        'cp',
        // ③ bridges only the high water reaches
        ['hangBridge', { n: 10, dy: 5, gold: 'high' }],
        ['postcard', { kind: 'risky', dx: -6, dy: 3 }],
        ['mist', { h: 9 }],
        ['hangBridge', { n: 8, dy: 5, rope: 'pista@in', back: 'ropeBack' }],
        ['finish', {}]
      ] },
    { id: 'pista', gen: 'room', role: 'secret', theme: 'ec_andes', stamp: 'pista' }
  ] };

Tour.amend('ec', {
  stamps, skins,
  map: { fort: 'crater', start: [0, 0] },
  houses: [{ id: 'ec-cacao', kind: 'stand', name: 'La Tienda del Cacao', keeper: 'booby', stock: ['wand', 'hat', 'fins', 'kazoo', 'sundial', 'oneup'], mapCell: [2, 2], mapFrom: 3 }],
  levels: [L1, L2, L3, L4, L5, L6, L7]
});
})();
