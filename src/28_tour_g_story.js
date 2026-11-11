/* ============================================================
   World tour: the story.
   Brady and Chinka set off on the trip of a lifetime. In Mexico,
   BARON BRIC-A-BRAC, a greedy souvenir collector with a shrink-ray
   camera, snaps the Palace of Fine Arts down to snow-globe size and
   floats off in his snow-globe blimp. Chinka leaps onto his rope
   ladder and sends Brady postcards from every stop. Each country's
   castle boss guards one shrunken landmark; beating it pops the
   landmark back to size. The showdown is in Nepal, in the Himalayas.
   ============================================================ */
const TourVillain = {
  // the Baron: tiny, pompous, coat covered in souvenir pins, a snow globe on his top hat
  draw(ctx, x, y, s, t, pose) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const bob = Math.sin(t * 3) * 1.5;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 4, 0, 0, TAU); ctx.fill();
    // boots and coat
    ctx.fillStyle = '#2a1a2a'; rr(ctx, -10, -8, 9, 8, 3); ctx.fill(); rr(ctx, 1, -8, 9, 8, 3); ctx.fill();
    const cg = ctx.createLinearGradient(0, -48, 0, -6); cg.addColorStop(0, '#7a2ac8'); cg.addColorStop(1, '#4a1a8a');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(-15, -6); ctx.quadraticCurveTo(-18, -30 + bob, -11, -46 + bob); ctx.lineTo(11, -46 + bob); ctx.quadraticCurveTo(18, -30 + bob, 15, -6); ctx.closePath(); ctx.fill();
    // souvenir pins all over the coat
    const pins = ['#ffd84a', '#ff4f8a', '#38c8ff', '#5ad04a', '#ffffff', '#ff9a3a'];
    for (let k = 0; k < 9; k++) { ctx.fillStyle = pins[k % 6]; ctx.beginPath(); ctx.arc(-10 + (k % 3) * 9 + (k > 5 ? 3 : 0), -38 + Math.floor(k / 3) * 10 + bob, 2.2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ffd84a'; for (let k = 0; k < 3; k++) ctx.fillRect(-1, -40 + k * 10 + bob, 2, 2);
    // head, monocle, grin
    ctx.fillStyle = '#f2c8a8'; ctx.beginPath(); ctx.arc(0, -54 + bob, 10, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(4, -55 + bob, 3.6, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(7, -53 + bob); ctx.lineTo(9, -44 + bob); ctx.stroke();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(-4, -55 + bob, 1.4, 0, TAU); ctx.arc(4, -55 + bob, 1.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a1a1a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -50 + bob, 4.5, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.ellipse(-4, -49.5 + bob, 4, 1.4, 0.3, 0, TAU); ctx.ellipse(4, -49.5 + bob, 4, 1.4, -0.3, 0, TAU); ctx.fill();
    // the top hat with a snow globe on it
    ctx.fillStyle = '#1a1020'; ctx.fillRect(-11, -64 + bob, 22, 3); rr(ctx, -7, -80 + bob, 14, 17, 2); ctx.fill();
    ctx.fillStyle = '#ff4f8a'; ctx.fillRect(-7, -68 + bob, 14, 3);
    ctx.fillStyle = 'rgba(200,240,255,0.7)'; ctx.beginPath(); ctx.arc(0, -86 + bob, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) ctx.fillRect(-3 + ((t * 10 + k * 3) % 6), -89 + k * 1.5 + bob, 1, 1);
    // the Shrink-o-Matic camera
    if (pose !== 'empty') {
      ctx.save(); ctx.translate(14, -32 + bob);
      ctx.fillStyle = '#3a3a4a'; rr(ctx, -4, -6, 18, 12, 3); ctx.fill();
      ctx.fillStyle = '#8af0ff'; ctx.beginPath(); ctx.arc(9, 0, 4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(0, -9, 5, 3);
      if (pose === 'flash') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(12, 0, 2, 12, 0, 60); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(160,230,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(12, 0, 60, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.restore();
    }
    ctx.restore();
  },
  // the snow-globe blimp
  blimp(ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y + Math.sin(t * 1.5) * 4); ctx.scale(s, s);
    const g = ctx.createRadialGradient(-20, -20, 10, 0, 0, 70); g.addColorStop(0, 'rgba(230,250,255,0.95)'); g.addColorStop(1, 'rgba(120,190,230,0.85)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 70, 40, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.stroke();
    // a tiny shrunken landmark inside, with snow swirling
    ctx.fillStyle = '#e8b838'; ctx.beginPath(); ctx.arc(0, 14, 14, Math.PI, TAU); ctx.fill(); ctx.fillStyle = '#f2e2c8'; ctx.fillRect(-18, 14, 36, 12);
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 16; k++) { const a = k * 0.8 + t; ctx.fillRect(Math.cos(a) * (20 + k * 2) % 60, -20 + ((k * 7 + t * 12) % 40), 1.6, 1.6); }
    ctx.fillStyle = '#7a2ac8'; rr(ctx, -30, 36, 60, 16, 6); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.font = `8px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('BRIC-A-BRAC', 0, 47);
    for (const px of [-74, 74]) { ctx.fillStyle = '#4a1a8a'; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px + Math.sign(px) * 14, -12); ctx.lineTo(px + Math.sign(px) * 14, 12); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(20, 52); ctx.lineTo(28, 110); ctx.stroke();
    ctx.restore();
  }
};

/* ---------- backdrops ---------- */
Object.assign(BGPaint, {
  // a horizon of landmark silhouettes from all over the route (daylight, stylized)
  tourSkyline(ctx, L, rng, H) {
    const b = L.base, col = L.color;
    ctx.fillStyle = col;
    ctx.fillRect(0, b, BG_W, H - b);
    const draw = (kind, x, s) => {
      ctx.save(); ctx.translate(x, b); ctx.scale(s, s); ctx.fillStyle = col; ctx.beginPath();
      if (kind === 'volcano') { ctx.moveTo(-110, 0); ctx.quadraticCurveTo(-40, -10, -16, -86); ctx.lineTo(16, -86); ctx.quadraticCurveTo(40, -10, 110, 0); }
      else if (kind === 'sugarloaf') { ctx.moveTo(-50, 0); ctx.bezierCurveTo(-48, -70, -14, -96, 6, -94); ctx.bezierCurveTo(30, -90, 44, -50, 50, 0); }
      else if (kind === 'lattice') { ctx.moveTo(-34, 0); ctx.quadraticCurveTo(-14, -40, -6, -110); ctx.lineTo(-2, -150); ctx.lineTo(2, -150); ctx.lineTo(6, -110); ctx.quadraticCurveTo(14, -40, 34, 0); ctx.lineTo(16, 0); ctx.quadraticCurveTo(0, -24, -16, 0); }
      else if (kind === 'windmill') { ctx.moveTo(-12, 0); ctx.lineTo(-8, -46); ctx.lineTo(8, -46); ctx.lineTo(12, 0); ctx.fill(); ctx.beginPath(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; ctx.moveTo(0, -46); ctx.lineTo(Math.cos(a) * 34 - Math.sin(a) * 4, -46 + Math.sin(a) * 34 + Math.cos(a) * 4); ctx.lineTo(Math.cos(a) * 34 + Math.sin(a) * 4, -46 + Math.sin(a) * 34 - Math.cos(a) * 4); ctx.closePath(); } }
      else if (kind === 'fuji') { ctx.moveTo(-120, 0); ctx.quadraticCurveTo(-50, -30, -18, -80); ctx.lineTo(18, -80); ctx.quadraticCurveTo(50, -30, 120, 0); }
      else if (kind === 'peaks') { ctx.moveTo(-140, 0); ctx.lineTo(-90, -70); ctx.lineTo(-60, -40); ctx.lineTo(-10, -120); ctx.lineTo(30, -60); ctx.lineTo(60, -90); ctx.lineTo(140, 0); }
      else if (kind === 'palms') { for (const px of [-10, 14]) { ctx.rect(px - 2, -60, 4, 60); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.6; ctx.moveTo(px, -60); ctx.quadraticCurveTo(px + Math.cos(a) * 20, -60 + Math.sin(a) * 20 - 6, px + Math.cos(a) * 32, -56 + Math.sin(a) * 18); ctx.lineTo(px + Math.cos(a) * 28, -54 + Math.sin(a) * 16); ctx.quadraticCurveTo(px + Math.cos(a) * 16, -58 + Math.sin(a) * 14, px, -58); } } }
      ctx.closePath(); ctx.fill();
      if (kind === 'fuji' || kind === 'peaks' || kind === 'volcano') { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); if (kind === 'fuji') { ctx.moveTo(-18, -80); ctx.lineTo(18, -80); ctx.lineTo(30, -62); ctx.lineTo(14, -66); ctx.lineTo(0, -58); ctx.lineTo(-14, -66); ctx.lineTo(-30, -62); } else if (kind === 'peaks') { ctx.moveTo(-10, -120); ctx.lineTo(8, -93); ctx.lineTo(-4, -96); ctx.lineTo(-22, -100); } else { ctx.moveTo(-16, -86); ctx.lineTo(16, -86); ctx.lineTo(24, -72); ctx.lineTo(0, -66); ctx.lineTo(-24, -72); } ctx.closePath(); ctx.fill(); }
      ctx.restore();
    };
    const list = [['volcano', 80, 0.9], ['palms', 200, 0.8], ['sugarloaf', 300, 0.9], ['lattice', 470, 0.9], ['windmill', 560, 1], ['fuji', 700, 0.9], ['peaks', 880, 1]];
    for (const [k, x, s] of list) { draw(k, x, s); if (x > BG_W - 140) draw(k, x - BG_W, s); if (x < 140) draw(k, x + BG_W, s); }
  },
  // a calm ocean band
  tourOcean(ctx, L, rng, H) {
    const g = ctx.createLinearGradient(0, L.base, 0, H); g.addColorStop(0, L.color); g.addColorStop(1, shade(L.color, -0.35));
    ctx.fillStyle = g; ctx.fillRect(0, L.base, BG_W, H - L.base);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 50; i++) { const x = rng() * BG_W, y = L.base + 6 + rng() * (H - L.base - 10); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - 3, x + 12, y); ctx.stroke(); }
  }
});
THEMES.tour_title = {
  name: 'Around the World', music: 'tour_title', particles: 'petals',
  sky: ['#3a8ae8', '#8ac8f8', '#ffe4c0'], horizonGlow: '#ffd8a0',
  celestial: { type: 'sun', x: 0.78, y: 0.2, r: 44, color: '#fffbe0', glow: '#ffd27a' }, stars: 0, cloudsDyn: true,
  layers: [{ kind: 'tourSkyline', color: '#6a8ac8', base: 360, f: 0.06, blur: true }, { kind: 'tourOcean', color: '#2a7ad0', base: 392, f: 0.2 }],
  fog: '#ffe0c0', ground: { style: 'sand', cap: '#f2c97a', capHi: '#fff0c0', dirt: '#c48a4e', dirt2: '#9a6434', rock: '#d8a464' },
  brick: { style: 'brick', c1: '#e0a85e', c2: '#a8703a', mortar: '#7a4a24' }, hard: { c1: '#c89a6a', c2: '#8a643e' }, semi: { style: 'wood', c1: '#a8784a', c2: '#6e4a2a' },
  pillar: { c1: '#e2b070', c2: '#a8763e', cap: '#f6d49a', style: 'column' }, accent: '#ffd84a', tint: {}
};
THEMES.tour_dusk = Object.assign({}, THEMES.tour_title, { name: 'Dusk', sky: ['#2a1a5a', '#c85a8a', '#ffb07a'], celestial: { type: 'moon', x: 0.2, y: 0.2, r: 22, color: '#fff8e8', glow: '#ffc0a0' }, stars: 0.8, layers: [{ kind: 'tourSkyline', color: '#3a2a5a', base: 360, f: 0.06 }, { kind: 'tourOcean', color: '#3a3a8a', base: 392, f: 0.2 }] });
THEMES.tour_himalaya = Object.assign({}, THEMES.tour_title, { name: 'The Himalayas', sky: ['#3a6ac8', '#c8e0ff', '#fff2e0'], celestial: { type: 'sun', x: 0.7, y: 0.3, r: 50, color: '#fffbe8', glow: '#ffe0a0' },
  layers: [{ kind: 'mountains', color: '#8aa0d0', base: 300, amp: 170, f: 0.03, blur: true, snow: true }, { kind: 'mountains', color: '#5a70a8', base: 360, amp: 100, f: 0.1, snow: true }] });

/* ---------- title & menu art ---------- */
const TourTitle = {
  // the game card: a spinning globe, the plane looping it, Brady leaping past
  cardArt(ctx, t, x, y, w, h) {
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a78e0'); g.addColorStop(1, '#9ad8ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const R = Math.min(w, h) * 0.36, cx = w * 0.58, cy = h * 0.55;
    const og = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R); og.addColorStop(0, '#6ad0ff'); og.addColorStop(1, '#1a5ab8');
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    // continents drift across the globe face
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    TourMap.build();
    if (TourMap.paths) {
      const sc = R / 70, off = ((t * 14) % 360);
      for (const dx of [-360, 0]) { ctx.save(); ctx.translate(cx - (off + dx - 20) * sc, cy + 10 * sc); ctx.scale(sc, sc); ctx.fillStyle = '#5ac060'; for (const p of TourMap.paths.land) ctx.fill(p); ctx.restore(); }
    }
    const shade2 = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.2, cx, cy, R * 1.05); shade2.addColorStop(0, 'rgba(255,255,255,0.18)'); shade2.addColorStop(1, 'rgba(0,20,60,0.45)');
    ctx.fillStyle = shade2; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
    // the plane loops the globe on a dotted trail
    const a = t * 1.2, px = cx + Math.cos(a) * R * 1.25, py = cy + Math.sin(a) * R * 0.45 - R * 0.2;
    ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy - R * 0.2, R * 1.25, R * 0.45, 0, 0, TAU); ctx.stroke(); ctx.restore();
    if (Math.sin(a) > -0.2 || true) { ctx.save(); ctx.translate(px, py); ctx.rotate(a + Math.PI / 2); ctx.scale(0.8, 0.8); ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#ff4f8a'; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(3, -10); ctx.lineTo(6, -10); ctx.lineTo(4, 0); ctx.lineTo(6, 10); ctx.lineTo(3, 10); ctx.closePath(); ctx.fill(); ctx.restore(); }
    // a few landmark pins on the globe
    const pins = [[-0.5, -0.3, '#ff3d8b'], [0.15, -0.55, '#38c8ff'], [0.45, 0.05, '#ffd84a'], [-0.1, 0.35, '#5ad04a']];
    for (const [ux, uy, c] of pins) { const qx = cx + ux * R, qy = cy + uy * R + Math.sin(t * 3 + ux * 5) * 1.5; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(qx, qy - 6, 4.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(qx - 3, qy - 4); ctx.lineTo(qx, qy + 2); ctx.lineTo(qx + 3, qy - 4); ctx.fill(); }
    // Brady mid-leap with a postcard
    ctx.save(); ctx.translate(w * 0.2, h * 0.95); ctx.scale(h / 130, h / 130);
    drawBrady(ctx, { x: 0, y: -10 - Math.abs(Math.sin(t * 2.5)) * 12, facing: 1, small: false, power: 0, anim: { state: 'jump', t, phase: 0 }, hair: null, look: Save.data.look, time: t });
    ctx.restore();
    ctx.restore();
  }
};

/* ---------- the story panels ---------- */
function tourStage(ctx, W, H, t, theme) { return storyStage(ctx, W, H, t, theme); }
function TourIntroPanels() {
  const brady = (ctx, x, gy, s, t, st, f) => { ctx.save(); ctx.translate(x, gy); ctx.scale(s, s); drawBrady(ctx, { x: 0, y: 0, facing: f || 1, small: false, power: 0, anim: { state: st || 'idle', t, phase: t * 12, speed: 1 }, hair: null, look: Save.data.look, time: t }); ctx.restore(); };
  const chinka = (ctx, x, gy, s, t, pose, f) => drawChinka(ctx, { x, y: gy, scale: s, t, pose: pose || 'wave', facing: f || 1 });
  return [
    { text: 'Brady and Chinka finally booked it: the trip of a lifetime. Twelve countries, two passports and one very small plane.',
      scene(ctx, W, H, t) { const { gy, s } = tourStage(ctx, W, H, t, 'tour_title'); brady(ctx, W * 0.36, gy, s, t, 'idle', 1); chinka(ctx, W * 0.5, gy, s, t, 'cheer', -1); ctx.save(); ctx.translate(W * 0.75, gy - 30 * s); ctx.scale(s * 1.2, s * 1.2); TourMapScene.prototype.drawPlane.call({ t }, ctx, 0, 0, 0); ctx.restore(); } },
    { text: 'First stop: Mexico City. Then a giant snow globe floated over the plaza... and a tiny man with a big camera leaned out. "MAGNIFICENT! I\'LL TAKE IT!"',
      scene(ctx, W, H, t, pt) { const { gy, s } = tourStage(ctx, W, H, t, 'mx_mercado'); TourVillain.blimp(ctx, W * 0.66, gy - 120 * s, s * 0.9, t); TourVillain.draw(ctx, W * 0.66, gy - 150 * s, s * 0.6, t, pt > 1.4 ? 'flash' : 'camera'); brady(ctx, W * 0.28, gy, s, t, 'idle', 1); chinka(ctx, W * 0.38, gy, s, t, 'captive', 1); if (pt > 1.4 && pt < 1.9) { ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - (pt - 1.4) / 0.5)})`; ctx.fillRect(0, 0, W, H); } } },
    { text: 'FLASH! The Palace of Fine Arts shrank down to snow-globe size. Baron Bric-a-Brac popped it in his pocket. "The finest souvenir collection on Earth needs the finest landmarks!"',
      scene(ctx, W, H, t) { const { gy, s } = tourStage(ctx, W, H, t, 'mx_mercado'); TourVillain.blimp(ctx, W * 0.7, gy - 130 * s + Math.sin(t) * 6, s * 0.9, t); TourVillain.draw(ctx, W * 0.45, gy, s * 1.2, t, 'camera'); brady(ctx, W * 0.2, gy, s, t, 'idle', 1); } },
    { text: 'Chinka didn\'t wait. She grabbed the blimp\'s rope ladder as it lifted off. "Brady! I\'ll follow him. Watch for my postcards!"',
      scene(ctx, W, H, t, pt) { const { gy, s } = tourStage(ctx, W, H, t, 'tour_dusk'); const k = Math.min(1, pt * 0.35); TourVillain.blimp(ctx, W * (0.55 + k * 0.2), gy - 150 * s - k * 40 * s, s * 0.9, t); chinka(ctx, W * (0.58 + k * 0.2), gy - 40 * s - k * 40 * s, s * 0.9, t, 'wave', -1); brady(ctx, W * 0.25, gy, s, t, 'run', 1); } },
    { text: 'Every country he visits, he shrinks something else. Follow Chinka\'s postcards, beat the Baron\'s goons, put the world back to size and bring Chinka home.',
      scene(ctx, W, H, t) { const { gy, s } = tourStage(ctx, W, H, t, 'tour_title'); brady(ctx, W * 0.32, gy, s * 1.1, t, 'victory', 1); ctx.save(); ctx.translate(W * 0.62, gy - 60 * s); ctx.rotate(-0.1); ctx.scale(s * 1.6, s * 1.6); TourArt.postcard(ctx, 0, 0, t, false); ctx.restore(); } }
  ];
}

// arriving in a country for the first time: Chinka's postcard (shown on the map)
function tourArrivalCard(C) {
  return { title: 'POSTCARD FROM ' + C.name.toUpperCase(), text: C.arrival || ('Brady! The Baron\'s blimp landed in ' + C.name + '. Find his goon, save the landmark! ♥ C') };
}

/* ---------- the ending (after the showdown in Nepal) ---------- */
class TourEndingScene {
  constructor() {
    this.t = 0; this.stage = 0; Input.setMode('ui'); Sound.music(Sound.trackNames.indexOf('tour_ending') >= 0 ? 'tour_ending' : 'ending'); Sound.play('reunion');
    this.lines = [
      'The Baron\'s Shrink-o-Matic sputters... FLASH. Baron Bric-a-Brac is now exactly snow-globe sized.',
      'One by one, the landmarks pop back to full size all over the world. Somewhere, a volcano sighs with relief.',
      'Chinka: "You followed every postcard?"  Brady: "Every. Single. One. Your handwriting is beautiful."',
      'Sunrise over the Himalayas. Two passports full of stamps. Best. Trip. Ever.'
    ];
    this.parts = new Particles();
    Save.data.beatGame = true; Save.save();
  }
  update(dt) {
    this.t += dt; this.parts.update(dt);
    if (Math.random() < 0.06) this.parts.burst(Math.random() * Game.cssW, Game.cssH * (0.1 + Math.random() * 0.3), 24, '#fff', 'firework');
    if ((Input.taps.length || Input.uiKey === 'enter' || Input.jumpPressed) && this.t > 1) {
      this.stage++; this.t = 1;
      if (this.stage >= this.lines.length) { Game.setScene(new CreditsScene('world')); return; }
      Sound.play('cardFlip');
    }
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH;
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    const { gy, s } = storyStage(ctx, W, H, this.t, 'tour_himalaya');
    // prayer flags strung respectfully across the far ridge
    ctx.save(); ctx.strokeStyle = 'rgba(80,60,60,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, gy - 120 * s); ctx.quadraticCurveTo(W / 2, gy - 90 * s, W, gy - 130 * s); ctx.stroke();
    const fc = ['#3a7ad8', '#ffffff', '#e8483a', '#4ab05a', '#ffd84a'];
    for (let i = 0; i < 24; i++) { const k = i / 24, fx = k * W, fy = (1 - k) * (1 - k) * (gy - 120 * s) + 2 * (1 - k) * k * (gy - 90 * s) + k * k * (gy - 130 * s); ctx.fillStyle = fc[i % 5]; ctx.fillRect(fx, fy, 8 * s * 0.6, 10 * s * 0.6); }
    ctx.restore();
    const k = Math.min(1, this.t / 2.5);
    ctx.save(); ctx.translate(W * 0.5 - 40 * s * (1 - k), gy); ctx.scale(s * 1.1, s * 1.1);
    drawBrady(ctx, { x: 0, y: 0, facing: 1, small: false, power: 0, anim: { state: this.stage >= 3 ? 'victory' : 'idle', t: this.t, phase: 0 }, hair: null, look: Save.data.look, time: this.t });
    ctx.restore();
    drawChinka(ctx, { x: W * 0.5 + 30 * s + 40 * s * (1 - k), y: gy, scale: s * 1.1, t: this.t, pose: this.stage >= 3 ? 'cheer' : 'wave', facing: -1 });
    // the Baron, now a souvenir himself
    ctx.save(); ctx.translate(W * 0.78, gy - 8 * s); ctx.scale(s * 0.5, s * 0.5);
    ctx.fillStyle = 'rgba(200,240,255,0.55)'; ctx.beginPath(); ctx.arc(0, -40, 40, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#7a2ac8'; rr(ctx, -34, -4, 68, 14, 4); ctx.fill();
    TourVillain.draw(ctx, 0, -6, 0.5, this.t, 'empty');
    ctx.restore();
    if (k >= 1) for (let i = 0; i < 3; i++) { const hy = gy - 90 * s - ((this.t * 30 + i * 30) % 90); ctx.fillStyle = `rgba(255,80,140,${1 - ((this.t * 30 + i * 30) % 90) / 90})`; ctx.font = `${16 + i * 4}px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('♥', W * 0.5 + 10 * s + Math.sin(this.t * 2 + i) * 12, hy); }
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    this.parts.draw(ctx);
    const bw = Math.min(W - 40, 640), bx = (W - bw) / 2, by = Math.max(20, insets.t + 14);
    ctx.fillStyle = 'rgba(10,6,20,0.78)'; rr(ctx, bx, by, bw, 74, 14); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `${W < 600 ? 13 : 15}px ${FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = wrapText(ctx, this.lines[Math.min(this.stage, this.lines.length - 1)], bw - 40);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, by + 30 + (i - (lines.length - 1) / 2) * 19));
    ctx.font = `10px ${FONT_DISPLAY}`; ctx.fillStyle = '#ffd84a'; ctx.fillText('TAP', W / 2, by + 62);
  }
}

// the world app's credits
function tourCreditsLines() {
  const tot = TourProgress.totals();
  const bosses = [];
  for (const C of Tour.mainCountries()) if (C.boss) bosses.push(C.boss.name + '  ·  ' + C.name);
  return [
    ['Chinka is home. The world is back to size. The Baron is a snow globe.', 's'], ['', ''],
    ['STARRING', 'k'], ['Brady  ·  long hair, man bun, many passport stamps', 'v'], ['Chinka  ·  fearless, fast, excellent postcards', 'v'], ['', ''],
    ['AND INTRODUCING', 'k'], ['Baron Bric-a-Brac  ·  collector of other people\'s landmarks', 'v'], ['', ''],
    ['LOCALS WHO GOT IN THE WAY', 'k'], ['Jumping jalapeños and walking corn', 'v'], ['Piñata burros full of candy', 'v'], ['Marching baguettes and rolling croissants', 'v'], ['Crêpe pans with surprisingly good aim', 'v'], ['', ''],
    ['THE BARON\'S GOONS', 'k'], ...bosses.map(n => [n, 'v']), ['', ''],
    ['YOUR STATS', 'k'], [`Postcards from Chinka: ${tot.gold} / ${tot.goldTotal}`, 'v'], [`Levels cleared: ${tot.done} / ${tot.total}`, 'v'], [`Score: ${Save.data.score}`, 'v'], [`Times the Baron got you: ${Save.data.deaths || 0}`, 'v'], ['', ''],
    [tot.gold >= tot.goldTotal ? 'Every postcard found. Chinka framed them all.' : 'Some postcards are still out there, somewhere in the world...', 's'],
    [Tour.countries.w22 && TourProgress.countryUnlocked(Tour.countries.w22) ? 'You found World 22.' : 'Legend speaks of a World 22.', 's'], ['', ''],
    ['Pack light. Stay curious. Send postcards.', 's'], ['', ''], ['', '']
  ];
}

/* ---------- songs for the title and the map ---------- */
Sound.addTrack && Sound.addTrack('tour_title', {
  bpm: 120, bars: 8, rv: 0.25, dl: 0.12, pump: 0.3,
  ch: 'C G Am F C G F,G C',
  ld: 'E5:2 G5:2 C6:4 B5:2 A5:2 G5:4 | D5:2 G5:2 B5:4 A5:2 G5:2 D5:4 | C5:2 E5:2 A5:4 G5:2 E5:2 C5:4 | F5:4 A5:4 C6:8 |' +
      'E6:2 D6:2 C6:4 G5:2 A5:2 C6:4 | B5:2 A5:2 G5:4 D6:4 B5:4 | A5:2 C6:2 F6:4 E6:2 D6:2 B5:4 | C6:12 .:4',
  li: 'brass', lv: 0.13, hx: 0.05,
  l2: 'C5:16 | B4:16 | A4:16 | A4:16 | G4:16 | G4:16 | A4:8 B4:8 | C5:16', l2i: 'strings', l2v: 0.05,
  bp: 'r...r.f.r...o...', bi: 'pluckb', bv: 0.28,
  ap: '0.2.1.3.0.2.1.3.', ai: 'harp', av: 0.04, ao: 64,
  dr: ['k.......k..k....', '....c.......c...', 'h.h.h.h.h.h.h.h.', 'w...........w...'], dv: 0.42
});
Sound.addTrack && Sound.addTrack('tour_map', {
  bpm: 100, bars: 8, rv: 0.3, dl: 0.15, sw: 0.1,
  ch: 'F C Dm Bb F C Bb,C F',
  ld: 'A5:4 C6:2 A5:2 G5:4 F5:4 | E5:4 G5:2 C6:2 G5:8 | F5:4 A5:2 D6:2 C6:4 A5:4 | Bb5:6 A5:2 F5:8 |' +
      'A5:2 C6:2 F6:4 E6:2 C6:2 A5:4 | G5:4 C6:4 E6:8 | D6:2 C6:2 Bb5:4 A5:2 G5:2 E5:4 | F5:12 .:4',
  li: 'whistle', lv: 0.12,
  bp: 'r.......f...o...', bi: 'sub', bv: 0.28,
  ap: 'c-..c-....c-....', ai: 'ep', av: 0.05, ao: 57,
  dr: ['k.......k.......', '....c.......c...', '..h...h...h...h.', 'l.....l.....l...'], dv: 0.38
});

// test hook (tools/gameplay_test.js)
try { window.BRADY_TOUR = { Tour, TourProgress, TourPowers, TourBuild, TourMapScene, TourEndingScene, TourIntroPanels, TourItem, TourEnemy, TourFlyer, TourSwimmer, TourLeaper, TourFriend, TourProp, TourSprite, TourKit, tourCreditsLines, TourGear }; } catch (e) { /* not in a browser */ }
