/* ============================================================
   World tour: the secret rooms' code-drawn art (docs/design/SECRET_ROOMS.md): the tokens and ingredients
   (keys with a look, TourMaze.KEYS), the pop-up critters, the shell-game cups and the jokes under them, the
   prank chest's gags, the shop keepers' heads and the Wormhole. Flat fills with the dark ink line, like the rest
   of the Fiesta Toon look.
   ============================================================ */
const TourRoomCritters = {
  INK: '#1c1426',
  // pop-up and keeper heads: body colour, belly, ears, snout, extras
  LOOKS: {
    mole: { body: '#7a5a48', belly: '#c8a088', ear: 'none', nose: '#ff8aa8', claws: true },
    axolotl: { body: '#ff9ac0', belly: '#ffd0e0', ear: 'gills', gill: '#ff5a8a', smile: true },
    tomato: { body: '#e8402a', belly: '#ff6a4a', ear: 'leaf', leaf: '#3a9a3a' },
    rat: { body: '#9a8a80', belly: '#d8c8c0', ear: 'round', nose: '#ff8aa8', whiskers: true },
    crab: { body: '#e86a3a', belly: '#ffb08a', ear: 'stalks', claws: true },
    frog: { body: '#5ac85a', belly: '#c8f0a8', ear: 'none', bulge: true, smile: true },
    skua: { body: '#8a6a50', belly: '#d8c0a0', ear: 'none', beak: '#3a3a3a' },
    penguin: { body: '#2a2a3a', belly: '#ffffff', ear: 'none', beak: '#ffa83a' },
    seal: { body: '#8a9aa8', belly: '#c8d4e0', ear: 'none', nose: '#2a2a3a', whiskers: true },
    herring: { body: '#a8c0d8', belly: '#e8f0f8', ear: 'fin', smile: true },
    gopher: { body: '#c8904a', belly: '#f0d0a0', ear: 'round', nose: '#5a3a2a', teeth: true },
    keeper: { body: '#c8a070', belly: '#f0dcc0', ear: 'pointy', nose: '#2a1a1a' },
    xolo: { body: '#5a4a52', belly: '#7a6a72', ear: 'pointy', nose: '#1a1a1a' },
    coati: { body: '#a8683a', belly: '#e8c090', ear: 'round', nose: '#2a1a1a', mask: true },
    stork: { body: '#f4f4f0', belly: '#ffffff', ear: 'none', beak: '#ff6a3a' },
    yak: { body: '#4a3a30', belly: '#7a6250', ear: 'horns', nose: '#2a1a1a' },
    tanuki: { body: '#8a6a4a', belly: '#e8d0a8', ear: 'round', nose: '#2a1a1a', mask: true },
    owl: { body: '#a8885a', belly: '#e8d8b0', ear: 'tufts', beak: '#e8a83a' },
    dealer: { body: '#e8b84a', belly: '#fff0c0', ear: 'pointy', nose: '#2a1a1a', bow: true }
  },
  draw(c, look, x, y, s, t, hit, asleep) {
    const L = this.LOOKS[look] || this.LOOKS.mole, k = s || 1, I = this.INK;
    c.save(); c.translate(x, y); c.scale(k, k);
    const bob = Math.sin((t || 0) * 6) * 1;
    // ears behind the head
    c.lineWidth = 1.5; c.strokeStyle = I;
    if (L.ear === 'round') for (const sx of [-1, 1]) { c.fillStyle = L.body; c.beginPath(); c.arc(sx * 9, -24 + bob, 5, 0, TAU); c.fill(); c.stroke(); }
    if (L.ear === 'pointy') for (const sx of [-1, 1]) { c.fillStyle = L.body; c.beginPath(); c.moveTo(sx * 4, -24 + bob); c.lineTo(sx * 13, -33 + bob); c.lineTo(sx * 12, -18 + bob); c.closePath(); c.fill(); c.stroke(); }
    if (L.ear === 'tufts') for (const sx of [-1, 1]) { c.fillStyle = L.body; c.beginPath(); c.moveTo(sx * 5, -26 + bob); c.lineTo(sx * 11, -34 + bob); c.lineTo(sx * 12, -22 + bob); c.closePath(); c.fill(); c.stroke(); }
    if (L.ear === 'horns') for (const sx of [-1, 1]) { c.fillStyle = '#e8e0c8'; c.beginPath(); c.moveTo(sx * 8, -24 + bob); c.quadraticCurveTo(sx * 20, -26 + bob, sx * 16, -36 + bob); c.lineTo(sx * 12, -26 + bob); c.closePath(); c.fill(); c.stroke(); }
    if (L.ear === 'gills') for (const sx of [-1, 1]) for (let j = 0; j < 3; j++) { c.fillStyle = L.gill; c.beginPath(); c.ellipse(sx * (12 + j * 2), -24 + j * 5 + bob, 6, 2.5, sx * (0.6 - j * 0.4), 0, TAU); c.fill(); c.stroke(); }
    if (L.ear === 'stalks') for (const sx of [-1, 1]) { c.strokeStyle = I; c.lineWidth = 2; c.beginPath(); c.moveTo(sx * 5, -20 + bob); c.lineTo(sx * 7, -32 + bob); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(sx * 7, -33 + bob, 3.5, 0, TAU); c.fill(); c.lineWidth = 1.5; c.stroke(); c.fillStyle = I; c.beginPath(); c.arc(sx * 7, -33 + bob, 1.6, 0, TAU); c.fill(); }
    if (L.ear === 'fin') { c.fillStyle = L.body; c.beginPath(); c.moveTo(-4, -28 + bob); c.lineTo(6, -38 + bob); c.lineTo(8, -26 + bob); c.closePath(); c.fill(); c.stroke(); }
    // the head
    c.fillStyle = L.body; c.beginPath(); c.ellipse(0, -14 + bob, 14, 15, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = L.belly; c.beginPath(); c.ellipse(0, -8 + bob, 9, 8, 0, 0, TAU); c.fill();
    if (L.ear === 'leaf') { c.fillStyle = L.leaf; for (let j = -2; j <= 2; j++) { c.beginPath(); c.ellipse(j * 4, -29 + bob, 3, 6, j * 0.5, 0, TAU); c.fill(); } }
    if (L.mask) { c.fillStyle = 'rgba(30,20,20,0.75)'; c.beginPath(); c.ellipse(-6, -17 + bob, 6, 4, 0.2, 0, TAU); c.ellipse(6, -17 + bob, 6, 4, -0.2, 0, TAU); c.fill(); }
    // eyes: x x when bonked, closed when asleep
    for (const sx of [-1, 1]) {
      const ex = sx * 5.5, ey = -17 + bob;
      if (hit) { c.strokeStyle = I; c.lineWidth = 1.8; c.beginPath(); c.moveTo(ex - 2.5, ey - 2.5); c.lineTo(ex + 2.5, ey + 2.5); c.moveTo(ex + 2.5, ey - 2.5); c.lineTo(ex - 2.5, ey + 2.5); c.stroke(); }
      else if (asleep) { c.strokeStyle = I; c.lineWidth = 1.6; c.beginPath(); c.arc(ex, ey, 2.6, 0.2, Math.PI - 0.2); c.stroke(); }
      else { c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, 3.6, 0, TAU); c.fill(); c.fillStyle = I; c.beginPath(); c.arc(ex + sx * 0.6, ey + 0.4, 1.9, 0, TAU); c.fill(); }
    }
    if (L.bulge) { c.fillStyle = L.body; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 6, -25 + bob, 4, Math.PI, 0); c.fill(); } }
    if (L.beak) { c.fillStyle = L.beak; c.beginPath(); c.moveTo(-4, -11 + bob); c.lineTo(4, -11 + bob); c.lineTo(0, -5 + bob); c.closePath(); c.fill(); c.strokeStyle = I; c.lineWidth = 1.2; c.stroke(); }
    if (L.nose) { c.fillStyle = L.nose; c.beginPath(); c.ellipse(0, -11 + bob, 3, 2.2, 0, 0, TAU); c.fill(); }
    if (L.smile || L.teeth) { c.strokeStyle = I; c.lineWidth = 1.4; c.beginPath(); c.arc(0, -9 + bob, 4, 0.3, Math.PI - 0.3); c.stroke(); }
    if (L.teeth) { c.fillStyle = '#fff'; c.fillRect(-2, -7 + bob, 4, 3); }
    if (L.whiskers) { c.strokeStyle = I; c.lineWidth = 0.8; for (const sx of [-1, 1]) for (const dy of [-1, 1.5]) { c.beginPath(); c.moveTo(sx * 4, -10 + bob); c.lineTo(sx * 14, -11 + dy * 2 + bob); c.stroke(); } }
    if (L.claws) for (const sx of [-1, 1]) { c.fillStyle = L.belly; c.beginPath(); c.ellipse(sx * 13, -2 + bob, 5, 3.5, 0, 0, TAU); c.fill(); c.strokeStyle = I; c.lineWidth = 1.2; c.stroke(); }
    if (L.bow) { c.fillStyle = '#c0392b'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-7, -4); c.lineTo(-7, 4); c.closePath(); c.moveTo(0, 0); c.lineTo(7, -4); c.lineTo(7, 4); c.closePath(); c.fill(); }
    c.restore();
  },
  dealers: {},

  /* ---------- the shell game ---------- */
  CUPS: {
    cup: { body: '#f4ece0', band: '#4a8ad8', w: 30, h: 28 },
    pot: { body: '#c8703a', band: '#f4d04a', w: 32, h: 30 },
    coconut: { body: '#7a4a2a', band: '#5a3418', w: 30, h: 26, round: true },
    mug: { body: '#a8b0b8', band: '#5a6068', w: 28, h: 30 },
    bowl: { body: '#e85a4a', band: '#1c1426', w: 34, h: 22, round: true },
    tin: { body: '#c8c8d0', band: '#e84a4a', w: 28, h: 30 },
    basket: { body: '#d8a85a', band: '#8a5a2a', w: 32, h: 26 }
  },
  cup(c, look, x, y, t, glow) {
    const C = this.CUPS[look] || this.CUPS.cup, w = C.w, h = C.h;
    if (glow) { c.save(); c.globalAlpha = 0.25 + 0.15 * Math.sin(t * 6); c.fillStyle = '#fff4a0'; c.beginPath(); c.ellipse(x, y - h / 2, w * 0.75, h * 0.8, 0, 0, TAU); c.fill(); c.restore(); }
    Ink.around(c, x - w / 2 - 4, y - h - 6, w + 8, h + 8, g => {
      g.fillStyle = C.body; g.beginPath();
      if (C.round) g.ellipse(x, y, w / 2, h, 0, Math.PI, 0); else { g.moveTo(x - w / 2, y); g.lineTo(x - w / 2 + 4, y - h); g.lineTo(x + w / 2 - 4, y - h); g.lineTo(x + w / 2, y); g.closePath(); }
      g.fill();
      g.fillStyle = C.band; g.fillRect(x - w / 2 + 2, y - h * 0.45, w - 4, 5);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x - w / 2 + 6, y - h + 4, 3, h - 10);
    }, { pad: 6 });
  },
  joke(c, what, x, y, t) {
    const I = this.INK;
    c.save(); c.translate(x, y); c.lineWidth = 1.5; c.strokeStyle = I;
    if (what === 'sock') { c.fillStyle = '#e8e0c8'; c.beginPath(); c.moveTo(-4, -22); c.lineTo(4, -22); c.lineTo(4, -8); c.lineTo(10, -4); c.lineTo(8, 0); c.lineTo(-4, -2); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#c0392b'; c.fillRect(-4, -22, 8, 4); c.fillStyle = '#8a9a50'; c.globalAlpha = 0.6; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(-2 + k * 5, -28 - Math.sin(t * 3 + k) * 3, 2, 0, TAU); c.fill(); } }
    else if (what === 'chicken') { c.fillStyle = '#ffd84a'; c.beginPath(); c.ellipse(0, -8, 12, 5, 0, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.ellipse(-12, -12, 4, 4, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#e84a3a'; c.beginPath(); c.arc(-12, -17, 2.5, 0, TAU); c.fill(); }
    else if (what === 'fish') { c.fillStyle = '#9ab0c0'; c.beginPath(); c.ellipse(0, -8, 11, 5, 0, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.moveTo(10, -8); c.lineTo(16, -13); c.lineTo(16, -3); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = I; c.beginPath(); c.moveTo(-7, -10); c.lineTo(-5, -8); c.moveTo(-5, -10); c.lineTo(-7, -8); c.stroke(); }
    else if (what === 'boot') { c.fillStyle = '#6a4a2a'; c.beginPath(); c.moveTo(-6, -22); c.lineTo(4, -22); c.lineTo(4, -6); c.lineTo(12, -4); c.lineTo(12, 0); c.lineTo(-6, 0); c.closePath(); c.fill(); c.stroke(); }
    else if (what === 'banana') { c.strokeStyle = '#e8c83a'; c.lineWidth = 6; c.beginPath(); c.arc(0, -16, 10, 0.3, Math.PI - 0.3); c.stroke(); }
    else { c.fillStyle = '#c8c0b0'; c.beginPath(); c.arc(0, -8, 7, 0, TAU); c.fill(); c.stroke(); c.font = `10px ${FONT_DISPLAY}`; c.fillStyle = I; c.textAlign = 'center'; c.fillText('?', 0, -4); }
    c.restore();
  },

  /* ---------- the prank chest's gags ---------- */
  gagStart(g, ch, p) {
    const gag = ch.gag;
    if (gag === 'glove') { p.vx = -sign(ch.cx - p.cx || 1) * -7 * TS; p.vx = (p.cx < ch.cx ? -1 : 1) * 7 * TS; p.vy = -7 * TS; p.onGround = false; Sound.play('kick'); g.shake(4); g.parts.text(ch.cx, ch.y - 30, 'BOING!', '#ffffff'); }
    else if (gag === 'cushion') { Sound.play('splat', { pitch: 0.45 }); g.parts.text(ch.cx, ch.y - 30, 'PFFFRRT!', '#c8e870'); }
    else if (gag === 'chicken') { Sound.play('bump', { pitch: 2.2 }); g.parts.text(ch.cx, ch.y - 30, 'SQUEAK!', '#ffd84a'); }
    else if (gag === 'jack') { Sound.play('spring'); g.parts.text(ch.cx, ch.y - 40, 'BOO!', '#ff6a8a'); }
    else if (gag === 'snakes') { Sound.play('spring'); g.parts.text(ch.cx, ch.y - 30, 'SPROING!', '#7aff9a'); g.burst(ch.cx, ch.y - 10, 12, '#5ac85a', 'confetti'); }
    else if (gag === 'pie') { Sound.play('splat'); g.roomPieT = 1.6; g.parts.text(ch.cx, ch.y - 30, 'SPLAT!', '#ffffff'); }
    else { Sound.play('pick', { pitch: 0.6 }); g.burst(ch.cx, ch.y - 10, 40, '#ffd84a', 'confetti'); g.parts.text(ch.cx, ch.y - 30, 'HA!', '#ffd84a'); }
  },
  gagDraw(c, ch, x, y, k, t) {
    const I = this.INK, gag = ch.gag, out = Math.min(1, k * 4), wob = Math.sin(k * 18) * Math.max(0, 1 - k) * 6;
    c.save(); c.lineWidth = 1.5; c.strokeStyle = I;
    if (gag === 'glove' || gag === 'jack' || gag === 'snakes') {
      // the spring
      c.strokeStyle = '#a8a8b0'; c.lineWidth = 3; c.beginPath(); for (let j = 0; j <= 8; j++) c.lineTo(x + (j % 2 ? 6 : -6) + wob * (j / 8), y - j * out * 4); c.stroke();
      const hy = y - 32 * out;
      c.lineWidth = 1.5; c.strokeStyle = I;
      if (gag === 'glove') { c.fillStyle = '#e83a3a'; c.beginPath(); c.ellipse(x + wob, hy - 8, 12, 10, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.fillRect(x - 8 + wob, hy, 16, 5); }
      else if (gag === 'jack') { c.fillStyle = '#fff4e0'; c.beginPath(); c.arc(x + wob, hy - 10, 11, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#e83a3a'; c.beginPath(); c.arc(x + wob, hy - 9, 3, 0, TAU); c.fill(); c.fillStyle = I; c.beginPath(); c.arc(x - 4 + wob, hy - 13, 1.6, 0, TAU); c.arc(x + 4 + wob, hy - 13, 1.6, 0, TAU); c.fill(); c.fillStyle = '#5a4ad8'; c.beginPath(); c.moveTo(x - 10 + wob, hy - 18); c.lineTo(x + wob, hy - 32); c.lineTo(x + 10 + wob, hy - 18); c.fill(); c.stroke(); }
      else { for (let j = 0; j < 3; j++) { const a = -Math.PI / 2 + (j - 1) * 0.6; c.strokeStyle = ['#5ac85a', '#ffd84a', '#ff6a8a'][j]; c.lineWidth = 6; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * 30 * out, y + Math.sin(a) * 50 * out, x + Math.cos(a) * 26 * out + wob, y + Math.sin(a) * 70 * out); c.stroke(); } }
    } else if (gag === 'cushion') {
      c.fillStyle = '#ff6a8a'; c.beginPath(); c.ellipse(x, y - 4, 16, 6 * (1 - out * 0.6), 0, 0, TAU); c.fill(); c.stroke();
      c.globalAlpha = Math.max(0, 1 - k * 0.5); c.fillStyle = '#b8d870'; for (let j = 0; j < 5; j++) { c.beginPath(); c.arc(x - 16 + j * 8, y - 16 - k * 30 - j % 2 * 6, 6 + k * 6, 0, TAU); c.fill(); }
    } else if (gag === 'chicken') {
      c.translate(x, y - 20 * out); c.rotate(Math.sin(k * 10) * 0.4); this.joke(c, 'chicken', 0, 0, t);
    } else if (gag === 'pie') {
      c.fillStyle = '#f4e8c8'; c.beginPath(); c.ellipse(x, y - 30 * out, 14, 6, 0, 0, TAU); c.fill(); c.stroke();
    } else { c.fillStyle = '#5a4a6a'; c.fillRect(x - 6, y - 14, 12, 14); }
    c.restore();
  }
};
// the cream pie on the screen (the prank's 'pie' gag): a splat over the view for a moment
TourHooks.on('afterEntities', (play, ctx) => {
  if (!(play.roomPieT > 0)) return;
  play.roomPieT -= 1 / 60;
  const a = clamp(play.roomPieT, 0, 1), x = play.camX + Game.viewW / 2, y = play.camY + Game.viewH / 2;
  ctx.save(); ctx.globalAlpha = a * 0.85; ctx.fillStyle = '#fff8ec';
  for (let k = 0; k < 9; k++) { const r = 40 + (k * 37) % 50, aa = k * 0.7; ctx.beginPath(); ctx.arc(x + Math.cos(aa) * 60, y + Math.sin(aa) * 30 + (1 - a) * 40, r, 0, TAU); ctx.fill(); }
  ctx.restore();
});

/* ---------- tokens and ingredients: keys with a look (TourMaze.KEYS draws them; 28_tour_ra_kinds.js picks them up quietly) ---------- */
{
  const I = '#1c1426';
  const ol = (c, w) => { c.strokeStyle = I; c.lineWidth = w || 1.5; c.stroke(); };
  const looks = {
    tokChili: ['CHILI', '#e83a2a', (c, x, y) => { c.fillStyle = '#e83a2a'; c.beginPath(); c.moveTo(x - 9, y - 4); c.quadraticCurveTo(x + 6, y - 6, x + 9, y + 9); c.quadraticCurveTo(x - 2, y + 4, x - 9, y + 2); c.closePath(); c.fill(); ol(c); c.fillStyle = '#3a9a3a'; c.fillRect(x - 12, y - 4, 4, 5); }],
    tokCacao: ['CACAO POD', '#c8782a', (c, x, y) => { c.fillStyle = '#d8882a'; c.beginPath(); c.ellipse(x, y, 7, 11, 0.3, 0, TAU); c.fill(); ol(c); c.strokeStyle = '#8a4a1a'; c.lineWidth = 1; for (const d of [-3, 0, 3]) { c.beginPath(); c.moveTo(x + d, y - 9); c.lineTo(x + d + 2, y + 9); c.stroke(); } }],
    tokTomato: ['TOMATO', '#e8402a', (c, x, y) => { c.fillStyle = '#e8402a'; c.beginPath(); c.arc(x, y + 1, 9, 0, TAU); c.fill(); ol(c); c.fillStyle = '#3a9a3a'; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + Math.cos(k * 1.26) * 3, y - 7 + Math.sin(k * 1.26) * 2, 3, 1.5, k * 1.26, 0, TAU); c.fill(); } }],
    tokBall: ['FOOTBALL', '#ffffff', (c, x, y) => { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); ol(c); c.fillStyle = I; c.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5; c.lineTo(x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5); } c.fill(); }],
    tokCashew: ['CASHEW', '#e8c890', (c, x, y) => { c.strokeStyle = '#e8c890'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.arc(x, y - 2, 6, 0.4, Math.PI + 0.8); c.stroke(); c.lineCap = 'butt'; }],
    tokMint: ['MINT', '#3ab85a', (c, x, y) => { c.fillStyle = '#3ab85a'; for (const [dx, dy, a] of [[-4, 2, -0.6], [4, 2, 0.6], [0, -5, 0]]) { c.beginPath(); c.ellipse(x + dx, y + dy, 4, 7, a, 0, TAU); c.fill(); ol(c, 1.2); } c.fillStyle = '#2a7a3a'; c.fillRect(x - 1, y + 2, 2, 9); }],
    tokSugar: ['SUGAR', '#ffffff', (c, x, y) => { c.fillStyle = '#ffffff'; c.beginPath(); c.rect(x - 7, y - 7, 14, 14); c.fill(); ol(c); c.fillStyle = '#e8e8f0'; c.fillRect(x - 7, y - 7, 14, 4); }],
    tokTeapot: ['TEAPOT', '#d8c070', (c, x, y) => { c.fillStyle = '#d8c070'; c.beginPath(); c.ellipse(x, y + 2, 9, 7, 0, 0, TAU); c.fill(); ol(c); c.beginPath(); c.moveTo(x + 8, y); c.lineTo(x + 14, y - 5); c.lineWidth = 3; c.strokeStyle = '#d8c070'; c.stroke(); c.fillStyle = '#d8c070'; c.beginPath(); c.moveTo(x - 5, y - 4); c.lineTo(x, y - 12); c.lineTo(x + 5, y - 4); c.fill(); ol(c, 1.2); }],
    tokCroissant: ['CROISSANT', '#e8a84a', (c, x, y) => { c.fillStyle = '#e8a84a'; c.beginPath(); c.moveTo(x - 12, y + 4); c.quadraticCurveTo(x, y - 14, x + 12, y + 4); c.quadraticCurveTo(x, y - 2, x - 12, y + 4); c.fill(); ol(c); c.strokeStyle = '#a8681a'; c.lineWidth = 1; for (const d of [-5, 0, 5]) { c.beginPath(); c.moveTo(x + d, y - 6); c.lineTo(x + d * 1.2, y + 1); c.stroke(); } }],
    tokEggplant: ['AUBERGINE', '#6a3a8a', (c, x, y) => { c.fillStyle = '#6a3a8a'; c.beginPath(); c.ellipse(x, y + 2, 7, 10, 0.4, 0, TAU); c.fill(); ol(c); c.fillStyle = '#3a9a3a'; c.beginPath(); c.ellipse(x - 4, y - 8, 5, 3, 0.4, 0, TAU); c.fill(); }],
    tokZucchini: ['COURGETTE', '#3a8a3a', (c, x, y) => { c.fillStyle = '#4a9a3a'; c.beginPath(); c.ellipse(x, y, 5, 12, 0.8, 0, TAU); c.fill(); ol(c); c.fillStyle = '#e8d84a'; c.beginPath(); c.arc(x + 8, y - 7, 3, 0, TAU); c.fill(); }],
    tokTulip: ['TULIP', '#ff4a6a', (c, x, y) => { c.fillStyle = '#3a9a3a'; c.fillRect(x - 1, y, 2, 11); c.fillStyle = '#ff4a6a'; c.beginPath(); c.moveTo(x - 7, y - 8); c.lineTo(x - 3, y - 3); c.lineTo(x, y - 9); c.lineTo(x + 3, y - 3); c.lineTo(x + 7, y - 8); c.lineTo(x + 6, y + 2); c.lineTo(x - 6, y + 2); c.closePath(); c.fill(); ol(c); }],
    tokCheese: ['CHEESE', '#ffd23a', (c, x, y) => { c.fillStyle = '#ffd23a'; c.beginPath(); c.moveTo(x - 10, y + 6); c.lineTo(x + 10, y + 6); c.lineTo(x + 10, y - 2); c.lineTo(x - 10, y - 8); c.closePath(); c.fill(); ol(c); c.fillStyle = '#e8b82a'; c.beginPath(); c.arc(x - 2, y + 2, 2, 0, TAU); c.arc(x + 5, y, 1.5, 0, TAU); c.fill(); }],
    tokFlower: ['FRANGIPANI', '#ffffff', (c, x, y) => { for (let k = 0; k < 5; k++) { const a = k * TAU / 5; c.fillStyle = '#fff8e8'; c.beginPath(); c.ellipse(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 5, 3, a, 0, TAU); c.fill(); ol(c, 1); } c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); }],
    tokMango: ['MANGO', '#ffb82a', (c, x, y) => { c.fillStyle = '#ffb82a'; c.beginPath(); c.ellipse(x, y, 8, 10, 0.5, 0, TAU); c.fill(); ol(c); c.fillStyle = '#e8602a'; c.beginPath(); c.ellipse(x + 3, y + 3, 4, 5, 0.5, 0, TAU); c.fill(); c.fillStyle = '#3a9a3a'; c.beginPath(); c.ellipse(x - 4, y - 10, 4, 2, -0.4, 0, TAU); c.fill(); }],
    tokRice: ['RICE BALL', '#ffffff', (c, x, y) => { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x, y - 10); c.lineTo(x + 10, y + 7); c.lineTo(x - 10, y + 7); c.closePath(); c.fill(); ol(c); c.fillStyle = '#1a2a1a'; c.fillRect(x - 6, y + 1, 12, 6); }],
    tokMomo: ['MOMO', '#f4ecd8', (c, x, y) => { c.fillStyle = '#f4ecd8'; c.beginPath(); c.arc(x, y + 2, 9, Math.PI, 0); c.lineTo(x + 9, y + 6); c.lineTo(x - 9, y + 6); c.closePath(); c.fill(); ol(c); c.strokeStyle = '#c8b898'; c.lineWidth = 1; for (const d of [-4, 0, 4]) { c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + d, y + 2); c.stroke(); } }],
    tokEgg: ['EGG', '#f8f4ec', (c, x, y) => { c.fillStyle = '#f8f4ec'; c.beginPath(); c.ellipse(x, y, 7, 10, 0, 0, TAU); c.fill(); ol(c); c.fillStyle = 'rgba(160,190,220,0.6)'; c.beginPath(); c.arc(x - 2, y - 3, 1.5, 0, TAU); c.arc(x + 3, y + 2, 1.2, 0, TAU); c.fill(); }],
    tokGear: ['CLOCK GEAR', '#d8b84a', (c, x, y) => { c.fillStyle = '#d8b84a'; c.beginPath(); for (let k = 0; k < 16; k++) { const a = k * TAU / 16, r = k % 2 ? 7 : 10; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); ol(c); c.fillStyle = I; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); }],
    tokTea: ['TEA LEAVES', '#4a8a3a', (c, x, y) => { c.fillStyle = '#4a8a3a'; for (const [dx, a] of [[-4, -0.5], [4, 0.5]]) { c.beginPath(); c.ellipse(x + dx, y, 4, 9, a, 0, TAU); c.fill(); ol(c, 1.2); } }],
    tokMilk: ['MILK', '#ffffff', (c, x, y) => { c.fillStyle = '#ffffff'; c.beginPath(); c.rect(x - 6, y - 6, 12, 16); c.fill(); ol(c); c.fillStyle = '#4a8ad8'; c.fillRect(x - 6, y, 12, 4); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x - 6, y - 6); c.lineTo(x, y - 12); c.lineTo(x + 6, y - 6); c.fill(); ol(c, 1.2); }],
    tokGinger: ['GINGER', '#d8b070', (c, x, y) => { c.fillStyle = '#d8b070'; c.beginPath(); c.ellipse(x - 3, y + 2, 7, 4, 0.2, 0, TAU); c.ellipse(x + 5, y - 3, 3, 6, 0.6, 0, TAU); c.fill(); ol(c); }],
    tokFish: ['FISH', '#7ab0d8', (c, x, y) => { c.fillStyle = '#7ab0d8'; c.beginPath(); c.ellipse(x - 2, y, 9, 5, 0, 0, TAU); c.fill(); ol(c); c.beginPath(); c.moveTo(x + 6, y); c.lineTo(x + 12, y - 5); c.lineTo(x + 12, y + 5); c.closePath(); c.fill(); ol(c); c.fillStyle = I; c.beginPath(); c.arc(x - 6, y - 1, 1.3, 0, TAU); c.fill(); }],
    tokCoconut: ['COCONUT', '#7a4a2a', (c, x, y) => { c.fillStyle = '#7a4a2a'; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); ol(c); c.fillStyle = I; for (const [dx, dy] of [[-3, -2], [3, -2], [0, 3]]) { c.beginPath(); c.arc(x + dx, y + dy, 1.4, 0, TAU); c.fill(); } }],
    tokStroop: ['STROOPWAFEL', '#c8883a', (c, x, y) => { c.fillStyle = '#d89a4a'; c.beginPath(); c.arc(x, y, 10, 0, TAU); c.fill(); ol(c); c.strokeStyle = '#a8682a'; c.lineWidth = 1; for (let k = -6; k <= 6; k += 4) { c.beginPath(); c.moveTo(x + k, y - 9); c.lineTo(x + k, y + 9); c.moveTo(x - 9, y + k); c.lineTo(x + 9, y + k); c.stroke(); } }],
    tokLantern: ['LANTERN', '#e8402a', (c, x, y) => { c.fillStyle = '#e8402a'; c.beginPath(); c.ellipse(x, y, 8, 10, 0, 0, TAU); c.fill(); ol(c); c.fillStyle = '#ffd23a'; c.fillRect(x - 5, y - 12, 10, 3); c.fillRect(x - 5, y + 9, 10, 3); }],
    tokPeach: ['PEACH', '#ffa88a', (c, x, y) => { c.fillStyle = '#ffa88a'; c.beginPath(); c.arc(x, y + 1, 9, 0, TAU); c.fill(); ol(c); c.strokeStyle = '#e8786a'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y - 7); c.quadraticCurveTo(x + 3, y, x, y + 8); c.stroke(); c.fillStyle = '#3a9a3a'; c.beginPath(); c.ellipse(x + 4, y - 9, 4, 2, -0.4, 0, TAU); c.fill(); }],
    tokSnowflake: ['SNOWFLAKE', '#c8e8ff', (c, x, y) => { c.strokeStyle = '#e8f4ff'; c.lineWidth = 3; for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; c.beginPath(); c.moveTo(x - Math.cos(a) * 10, y - Math.sin(a) * 10); c.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10); c.stroke(); } c.strokeStyle = '#6a9ac8'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; c.beginPath(); c.moveTo(x - Math.cos(a) * 10, y - Math.sin(a) * 10); c.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10); c.stroke(); } }]
  };
  const map = {};
  for (const k in looks) { const [name, col, icon] = looks[k]; map[k] = { name, col, toast: name + '!', icon: (c, x, y, t) => icon(c, x, y, t) }; }
  TourMaze.addKeys(map);
}

/* ---------- the Wormhole: a swirl in a ring of stars (DoorArt look 'roomWormhole') ---------- */
{
  const draw0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look !== 'roomWormhole') return draw0.call(this, ctx, x, y, look, t, near);
    const cy = y - 28;
    ctx.save();
    for (let k = 5; k >= 0; k--) {
      const r = 8 + k * 5, a = t * (2.4 - k * 0.25) + k;
      ctx.fillStyle = ['#1c1030', '#3a1a6a', '#6a2aa8', '#a84ad8', '#e87aff', '#ffd8ff'][5 - k];
      ctx.beginPath(); ctx.ellipse(x, cy, r, r * 1.15, a, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const a = t * 3 + k * 2.1; ctx.beginPath(); ctx.arc(x, cy, 30, a, a + 1.2); ctx.stroke(); }
    ctx.fillStyle = '#fff8c0';
    for (let k = 0; k < 6; k++) { const a = -t * 1.5 + k * TAU / 6; TourRoomArt.star(ctx, x + Math.cos(a) * 34, cy + Math.sin(a) * 38, 3.5); }
    ctx.restore();
  };
}
