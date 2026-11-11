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

/* ---------- music: the game's main motif, helpers for writing songs, the title and the map ----------
   Every song is original. The main "Brady-O" motif is the scale-degree figure 5 6 | 1 3 2 1 6 | 5
   (a two-note pick-up, then a 3+3+2 "tresillo" kick up to the third and back down to the fifth below).
   The title states it, the map hums it, and each land quotes it in its own key, metre and band
   (Mexico: 6/8 son, trumpets in thirds). Songs that set v2: 1 use the newer voices, kit and mixer of
   src/01_audio.js; see docs/MUSIC.md. */
const TourTune = (() => {
  const PCS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }, NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const num = x => { const r = /^([A-G])([#b]?)(-?\d)$/.exec(x); return r ? 12 * (+r[3] + 1) + PCS[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0) : null; };
  const nm = m => NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  const pc = x => ((x % 12) + 12) % 12;
  const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10], HARM = [0, 2, 3, 5, 7, 8, 11], DOR = [0, 2, 3, 5, 7, 9, 10];
  // bars given as an array -> one line ("NOTE:steps[:velocity]" tokens, '.' rest, '|' bar line)
  const L = bars => bars.join(' | ');
  const rest = (n, spBar) => Array(n).fill('.:' + spBar);
  // run every note of a line through fn(midi) -> midi, or null for a rest
  function mapNotes(line, fn) {
    return line.replace(/\|/g, ' | ').trim().split(/\s+/).map(tk => {
      if (tk === '|') return tk;
      const p = tk.split(':'), m = num(p[0]);
      if (m == null) return tk;
      const x = fn(m);
      if (x == null) return '.:' + p[1];
      p[0] = nm(x); return p.join(':');
    }).join(' ');
  }
  const tr = (line, n) => mapNotes(line, m => m + n);
  // a second voice `steps` scale steps away (-2 a third below, -5 a sixth below) in the key (tonic pitch class, scale)
  function dia(line, steps, tonic, scale) {
    scale = scale || MAJ;
    return mapNotes(line, m => {
      let rel = pc(m - tonic), anchor = m - rel, i = scale.indexOf(rel);
      for (let k = 1; i < 0 && k < 12; k++) { let r2 = rel - k; if (r2 < 0) { r2 += 12; anchor -= 12; rel += 12; } i = scale.indexOf(r2); }
      const n = scale.length, j = i + steps;
      return anchor + scale[((j % n) + n) % n] + 12 * Math.floor(j / n);
    });
  }
  // chord symbol -> { r root pitch class, t third, f fifth } (semitones above the root)
  function chord(sym) {
    const r = /^([A-G])([#b]?)(.*)$/.exec(sym), q = r[3];
    const root = pc(PCS[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0));
    const t = /^sus4|^7sus4/.test(q) ? 5 : /^sus2/.test(q) ? 2 : (/^m(?!aj)/.test(q) || /^dim/.test(q)) ? 3 : 4;
    return { r: root, t, f: /dim|b5/.test(q) ? 6 : /aug/.test(q) ? 8 : 7 };
  }
  // a bass line from a chord string (one token per bar, "A,B" = two halves) and a per-bar rhythm template
  // (string, or function(bar) -> string) of tokens R root, F fifth, T third, O octave, L low fifth,
  // A approach (a semitone under the next chord's root), N next root, '.' rest; each "TOKEN:steps".
  function bass(chords, tpl, spBar, lo) {
    const bars = chords.trim().split(/\s+/).map(b => b.split(',').map(chord));
    const at = (b, s) => { const cs = bars[Math.min(b, bars.length - 1)]; return cs[Math.min(cs.length - 1, Math.floor(s / (spBar / cs.length)))]; };
    const place = r => lo + pc(r - lo);
    const out = [];
    for (let b = 0; b < bars.length; b++) {
      const t = typeof tpl === 'function' ? tpl(b) : tpl; let pos = 0; const toks = [];
      for (const tk of t.trim().split(/\s+/)) {
        const [k, d] = tk.split(':'), n = +d, c = at(b, pos);
        const nxt = pos + n >= spBar ? at(b + 1 >= bars.length ? 0 : b + 1, 0) : at(b, pos + n);
        let m = null; const R = place(c.r);
        if (k === 'R') m = R; else if (k === 'F') m = R + c.f > lo + 16 ? R + c.f - 12 : R + c.f; else if (k === 'T') m = R + c.t;
        else if (k === 'O') m = R + 12; else if (k === 'L') m = R + c.f - 12 >= lo - 5 ? R + c.f - 12 : R + c.f;
        else if (k === 'A') { const nr = place(nxt.r); m = nr === R ? R + c.f - 12 : nr - 1; if (m < lo - 3) m += 12; }
        else if (k === 'N') m = place(nxt.r);
        toks.push(m == null ? '.:' + n : nm(m) + ':' + n); pos += n;
      }
      out.push(toks.join(' '));
    }
    return L(out);
  }
  // a pattern lane built section by section: seq(spBar, [pattern, bars], ...); a pattern may span several bars
  function seq(spBar, ...parts) { let s = ''; for (const [p, n] of parts) { const len = n * spBar; for (let i = 0; i < len; i++) s += p[i % p.length]; } return s; }
  return { num, nm, tr, dia, chord, bass, seq, L, rest, MAJ, MIN, HARM, DOR, MOTIF: '5 6 | 1 3 2 1 6 | 5' };
})();

/* the title: the main theme. C major, 116 bpm, 32 bars (2 intro + 30 looping, ~62 s):
   intro | A hook (trumpets in thirds) | B lift (violins sing, trumpets answer) | A again under a violin
   counter-melody | bridge (the motif in A minor on celesta) | turnaround, back to A */
(() => {
  const T = TourTune, S = 16;
  const CH = 'C G7 ' + 'C Em7 F G Am7 Fmaj7 Dm7,G7 C ' + 'F G Em7 Am7 Dm7 G Fmaj7,Em7 Dm7,G7 ' + 'C Em7 F G Am7 Fmaj7 Dm7,G7 C ' + 'Am F Dm E7 ' + 'F,G G7';
  const hookA = ['C5:3:1.1 E5:3 D5:2 C5:4 A4:4', 'G4:8 .:4 G4:2 A4:2', 'C5:3:1.1 E5:3 G5:2 A5:4 G5:4', 'E5:4 D5:4 .:4 A4:2 C5:2',
    'D5:3:1.1 E5:3 G5:2 E5:4 D5:4', 'C5:3 A4:3 C5:2 D5:4 E5:4', 'F5:3:1.1 E5:3 D5:2 B4:4 D5:4', 'C5:12 .:4'];
  const tpt = T.L([...T.rest(1, S), '.:12 G4:2 A4:2', ...hookA,
    '.:16', '.:8 D5:3 E5:3 G5:2', '.:16', '.:4 C5:3 E5:3 D5:2 C5:4', '.:16', '.:8 B4:3 D5:3 G5:2', '.:16', '.:12 G4:2 A4:2',
    ...hookA, ...T.rest(4, S), 'F5:4:1.1 E5:4 D5:4 B4:4', 'G5:8:1.15 .:4 G4:2 A4:2']);
  const vln = T.L([...T.rest(10, S),
    'A5:6 G5:2 A5:4 C6:4', 'B5:6 A5:2 G5:8', 'G5:6 E5:2 G5:4 B5:4', 'A5:12 .:4', 'F5:6 E5:2 F5:4 A5:4', 'G5:6 F5:2 E5:4 D5:4', 'E5:4 F5:4 G5:4 A5:4', 'B5:4 D6:8 .:4',
    'G5:16', 'G5:4 A5:4 B5:8', 'C6:16', 'B5:4 A5:4 G5:4 .:4', 'C6:8 B5:8', 'A5:16', 'A5:8 G5:4 F5:4', 'E5:12 .:4',
    'E5:16:0.8', 'F5:16:0.8', 'A5:16:0.8', 'G#5:16:0.85', 'A5:8 B5:8', 'B5:12 .:4']);
  const vln2 = T.L([...T.rest(10, S), ...T.dia(T.L(['A5:6 G5:2 A5:4 C6:4', 'B5:6 A5:2 G5:8', 'G5:6 E5:2 G5:4 B5:4', 'A5:12 .:4', 'F5:6 E5:2 F5:4 A5:4', 'G5:6 F5:2 E5:4 D5:4', 'E5:4 F5:4 G5:4 A5:4', 'B5:4 D6:8 .:4']), -2, 0).split(' | '), ...T.rest(14, S)]);
  const motifMinor = ['A5:3 C6:3 B5:2 A5:4 E5:4', 'F5:3 A5:3 G5:2 F5:4 C6:4', 'D6:3 F6:3 E6:2 D6:4 A5:4', 'G#5:4 B5:4 D6:4 E6:4'];
  const cel = T.L(['G5:2 A5:2 C6:4 E6:4 D6:4', 'C6:4 A5:4 G5:4 .:4', ...T.rest(7, S), '.:12 G5:2 A5:2', ...T.rest(7, S), '.:8 C6:2 E6:2 G6:2 C7:2', ...T.rest(7, S), '.:12 E6:2 G6:2', ...motifMinor, ...T.rest(2, S)]);
  const pizz = T.L([...T.rest(26, S), ...motifMinor.map(b => T.tr(b, -12)), ...T.rest(2, S)]);
  const bassTpl = b => b === 0 ? '.:16' : b === 1 ? 'R:8 .:4 F:4' : b < 10 || (b >= 18 && b < 26) ? 'R:3 R:3 F:2 O:4 A:4' : b < 18 ? 'R:4 F:4 R:4 A:4' : b < 30 ? 'R:8 F:4 A:4' : b === 30 ? 'R:4 R:4 R:4 R:4' : 'R:4 F:4 R:2 R:2 A:4';
  const S16 = (...p) => T.seq(S, ...p);
  Sound.addTrack && Sound.addTrack('tour_title', {
    v2: 1, bpm: 116, bars: 32, lb: 2, rv: 0.5, dl: 0.22, dtb: 0.75,
    ch: CH,
    parts: [
      { n: 'tpt1', ln: tpt, i: 'tpt', v: 0.27, g: 0.9, pan: 0.12, rv: 0.8, dl: 0.5 },
      { n: 'tpt2', ln: T.dia(tpt, -2, 0), i: 'tpt', v: 0.15, g: 0.9, pan: -0.12, rv: 0.8, low: 1 },
      { n: 'vln1', ln: vln, i: 'vln', v: 0.17, pan: -0.28, rv: 1.1, dl: 0.4 },
      { n: 'vln2', ln: vln2, i: 'vln', v: 0.1, pan: 0.3, rv: 1.1, low: 1 },
      { n: 'cel', ln: cel, i: 'celesta', v: 0.08, pan: 0.35, rv: 1, dl: 1 },
      { n: 'pizz', ln: pizz, i: 'pizz', v: 0.34, pan: -0.35, rv: 0.8 },
      { n: 'bass', ln: T.bass(CH, bassTpl, S, 36), i: 'upright', v: 0.2, g: 0.95, pan: 0, rv: 0.05 }
    ],
    a2: S16(['C...............', 1], ['................', 1], ['C.u.x.uuC.u.x.u.', 8], ['C.u.C.u.C.u.C.u.', 8], ['C.u.x.uuC.u.x.u.', 8], ['C...............', 4], ['C.C.C.C.C.C.C.C.', 2]),
    a2i: 'guitar', a2v: 0.36, a2o: 52,
    pd: S16(['................', 2], ['c---------------', 28], ['c-------c-------', 2]), pi: 'pad2', pv: 0.05, po: 55,
    mix: { C: { pan: -0.22, rv: 0.5 }, P: { pan: 0.05, rv: 1.3 } },
    dr: [
      S16(['................', 1], ['............k.k.', 1], ['k.....k.....k...', 8], ['k.......k.......', 8], ['k.....k.....k...', 8], ['................', 3], ['k...........k...', 1], ['k...k...k...k...', 2]),
      S16(['................', 2], ['....s.......s...', 8], ['....s.......s...', 8], ['....s..g....s.g.', 8], ['................', 4], ['....s.......s...', 1], ['s...s...s.s.ssss', 1]),
      S16(['................', 2], ['h.h.h.h.h.h.h.h.', 8], ['..h...h...h...h.', 8], ['h.hhh.h.h.hhh.h.', 8], ['................', 4], ['h.h.h.h.h.h.h.h.', 2]),
      S16(['................', 10], ['n.n.n.n.n.n.n.n.', 8], ['....j.......j...', 8], ['................', 6]),
      S16(['................', 2], ['x...............', 1], ['................', 7], ['x...............', 1], ['................', 7], ['x...............', 1], ['................', 7], ['i...............', 1], ['................', 2], ['........t.t.m.m.', 1], ['x...............', 1], ['................', 1])
    ], dv: 0.44
  });
})();

/* the map: the motif hummed for travelling. F major, 100 bpm with a gentle shuffle, 32 bars (~77 s):
   A (accordion) | A' (flute) | B (the two trade phrases) | A'' (both, in thirds). Each land can ask for its
   own flavour of the same tune (another lead, strum, bass and kit): TourTune.mapSong({...}). */
TourTune.mapSong = o => {
  const T = TourTune, S = 16; o = o || {};
  const A = 'F Dm7 Bb C7 Gm7 Bbmaj7 Gm7,C7 F ', CH = A + A + 'Bbmaj7 C7 Am7 Dm7 Gm7 C7 Am7,D7 Gm7,C7 ' + A.trim();
  const a = ['F5:4:1.1 A5:4 G5:2 F5:2 D5:4', 'C5:8 .:4 C5:2 D5:2', 'F5:4:1.1 A5:4 C6:2 D6:2 C6:4', 'A5:4 G5:4 .:4 D5:2 F5:2',
    'G5:4:1.1 A5:4 C6:2 A5:2 G5:4', 'F5:4 D5:4 F5:2 G5:2 A5:4', 'Bb5:4 A5:4 G5:4 E5:4', 'F5:12 C5:2 D5:2'];
  const a2 = a.slice(0, 7).concat(['F5:12 A5:2 C6:2']);
  const call = ['D6:6:1.1 C6:2 A5:4 F5:4', 'G5:6 A5:2 Bb5:8'], call2 = ['Bb5:6:1.1 A5:2 G5:4 D5:4', 'E5:4 G5:4 C6:8'];
  const resp = ['C6:6 Bb5:2 G5:4 E5:4', 'F5:6 E5:2 D5:8'], resp2 = ['C6:4 A5:4 F#5:4 A5:4', 'G5:4 Bb5:4 E5:4 C5:2 D5:2'];
  const R2 = T.rest(2, S);
  const lead1 = T.L([...a, ...T.rest(8, S), ...call, ...R2, ...call2, ...R2, ...a]);
  const lead2 = T.L([...T.rest(8, S), ...a2, ...R2, ...resp, ...R2, ...resp2, ...T.dia(T.L(a), -2, 5).split(' | ')]);
  const bell = T.L([...T.rest(7, S), '.:8 C6:2 F6:2 A6:2 C7:2', ...T.rest(7, S), '.:12 F6:2 A6:2', ...T.rest(7, S), '.:8 D6:2 F6:2 A6:2 .:2', ...T.rest(8, S)]);
  const bassTpl = b => b >= 16 && b < 24 ? 'R:4 T:4 F:4 A:4' : 'R:6 R:2 F:4 A:4';
  const S16 = (...p) => T.seq(S, ...p);
  return {
    v2: 1, bpm: o.bpm || 100, bars: 32, rv: 0.45, dl: 0.18, dtb: 0.75, sw8: o.sw8 == null ? 0.4 : o.sw8,
    ch: CH,
    parts: [
      { n: 'lead1', ln: lead1, i: o.lead || 'accord', v: o.leadV || 0.2, g: 0.88, pan: 0.15, rv: 0.7, dl: 0.6 },
      { n: 'lead2', ln: lead2, i: o.lead2 || 'flute', v: o.lead2V || 0.17, g: 0.9, pan: -0.2, rv: 0.9, dl: 0.5 },
      { n: 'bell', ln: bell, i: o.bell || 'celesta', v: 0.09, pan: 0.35, rv: 1, dl: 1, low: 1 },
      { n: 'bass', ln: T.bass(CH, o.bassTpl || bassTpl, S, o.bassLo || 36), i: o.bass || 'upright', v: o.bassV || 0.26, pan: 0, rv: 0.05 }
    ].concat(o.extraParts ? o.extraParts(T, lead1, lead2) : []),
    a2: o.strumPat || S16(['C...x.u.C...x.u.', 16], ['C.u.C.u.C.u.C.u.', 8], ['C...x.u.C...x.u.', 8]),
    a2i: o.strum || 'uke', a2v: o.strumV || 0.4, a2o: o.strumO || 60,
    pd: S16(['c-------c-------', 32]), pi: 'pad2', pv: o.padV == null ? 0.035 : o.padV, po: 53,
    dr: o.drums || [
      S16(['k.......k.......', 32]),
      S16(['....s.......s...', 16], ['....s.......s.g.', 8], ['....s.......s...', 8]),
      S16(['h.h.h.h.h.h.h.h.', 32]),
      S16(['................', 16], ['n.n.n.n.n.n.n.n.', 8], ['................', 8]),
      S16(['x...............', 1], ['................', 15], ['i...............', 1], ['................', 15])
    ], dv: o.dv || 0.36
  };
};
Sound.addTrack && Sound.addTrack('tour_map', TourTune.mapSong());
// Super Brady-O World's title screen asks the shared code for 'title': play the world's own main theme there
Sound.alias && Sound.alias('title', 'tour_title');

// test hook (tools/gameplay_test.js)
try { window.BRADY_TOUR = { Tour, TourProgress, TourPowers, TourBuild, TourMapScene, TourEndingScene, TourIntroPanels, TourItem, TourEnemy, TourFlyer, TourSwimmer, TourLeaper, TourFriend, TourProp, TourSprite, TourKit, tourCreditsLines, TourGear }; } catch (e) { /* not in a browser */ }
