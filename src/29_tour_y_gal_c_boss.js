/* ============================================================
   THE UNFLATTERING GALLERY: the boss, THE RETOUCHER (30-6). Piwi Squirmin' as a vain portrait painter, leaning out
   of his own gilt frame at the right of his studio with a loaded brush and a palette, touching up his own
   unflattering portraits. At the left stands his easel with the worst one (mouth wide open). Brady never stomps him:
   he gets the Retoucher's own paint onto the portrait, and every improvement (a moustache, a second ear, the likeness)
   is a hit. The posing mark (a gilt plate on castors) rolls along the floor with Brady standing on it.
   1 THE LOADED BRUSH  he raises a dripping brush (the tell: a dashed drop line and a ring on the floor, 1 s), the drip
                       falls: roll the posing mark under it to load the mark with paint; then he pulls the brush back
                       (the tell: glowing bristles, 0.7 s) and sweeps a wave of paint along the floor: jump it. While
                       the mark is loaded, THROW at the easel paints a moustache on the portrait (a hit).
   2 THE PALETTE       he flourishes his palette (the tell: a dashed flight line at ear height, 1 s), then flings a round
                       blot along it at the easel. Crouch on the posing mark at the gold ear spot in front of the easel:
                       it skims over Brady and lands as a splendid second ear (a hit). Standing in its way hurts.
   3 THE CHIN          his chin rises (the tell: a dashed lunge line, 1 s), then he lunges out of his frame at chest
                       height, right across the studio. Crouch on the posing mark under the tip of his chin (the low
                       mark): when he is fully out, both chins overlap and the easel glows NOW: dash to it and THROW to
                       fix the likeness (a hit). Chinka-O buys the picture at once.
   Touching the Retoucher never hurts; only the paint wave, the blot and the lunge do. Every window is generous.
   ============================================================ */
(function () {
const K = Tour.galKit, INK = K.INK, GA = K.GalArt, AUB = K.AUB, AUB_HI = K.AUB_HI, MUS = K.MUS, MUS_HI = K.MUS_HI, MUS_LO = K.MUS_LO, BLUE = K.BLUE, WHITE = K.WHITE, CHALK = K.CHALK;
const say = (b, t, c) => { b.line = { text: t, col: c || '#fff0d0', t: 0 }; };
const PAINT = '#e8b84a';
const brain = {
  phases: [4, 2],
  guardText: 'TOO VAIN TO NOTICE',
  // the studio's furniture (pixels): the easel, the posing mark's rail, the ear spot, the chin's tip
  geo(b) {
    if (b.geoC) return b.geoC;
    const x0 = b.arenaX0, x1 = b.arenaX1;
    return (b.geoC = { x0, x1, easel: x0 + 2.5 * TS, r0: x0 + 5 * TS, r1: x1 - 7 * TS, ear: x0 + 5 * TS, chin: x0 + 9 * TS, frameX: x1 - 3.5 * TS });
  },
  wake(b) {
    const G = this.geo(b); b.phase = 1; b.markX = G.r0 + 4 * TS; b.loaded = false; b.window = 0; b.lunge = 0;
    b.x = G.frameX - b.w / 2; b.y = b.floorY - b.h - 1.5 * TS;
    b.galClaim = p => Math.abs(p.cx - G.easel) < 1.3 * TS && p.onGround;
    say(b, 'MY MOUTH WAS OPEN IN EVERY ONE. I SHALL FIX THEM ALL.'); b.go('raise');
  },
  phase(b, n) {
    const g = b.g; b.loaded = false; b.window = 0;
    if (n === 2) { g.bannerText = 'THE PALETTE!'; g.bannerT = 2; say(b, 'ONE EAR? I DESERVE TWO.'); }
    if (n === 3) { g.bannerText = 'THE CHIN!'; g.bannerT = 2; say(b, 'MY GOOD SIDE IS THE CHIN. LOOK.'); }
    b.go(n === 2 ? 'flourish' : 'chin');
  },
  hurt(b) {},
  hit(b, kind) { return 'bounce'; },
  touch(b, p) { return true; },
  lastHit(b) { b.go('sold'); b.state = 'fight'; return true; },
  improve(b, text) { b.damage(1, { text, col: '#ffe08a' }); b.window = 0; b.loaded = false; Sound.play('secret', { vol: 0.5 }); b.g.burst(this.geo(b).easel, b.floorY - 3 * TS, 18, MUS_HI, 'confetti'); },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1, G = this.geo(b), A = b.act;
    if (b.line) b.line.t += dt;
    if (b.window > 0) b.window -= dt;
    // the posing mark rolls along with Brady while he stands on it
    if (p && !p.dead && p.onGround && p.y + p.h > b.floorY - 4 && Math.abs(p.cx - b.markX) < 26) b.markX = clamp(p.cx, G.r0, G.r1);
    // the easel: THROW there while the portrait can take the improvement
    const I = g.galIn, at = I && I.by === b && I.pressed;
    if (at) {
      if (ph === 1 && b.loaded) this.improve(b, 'A MOUSTACHE! HE HATES IT');
      else if (ph === 3 && b.window > 0) this.improve(b, 'THE LIKENESS, FIXED!');
      else say(b, ph === 1 ? 'THE MARK NEEDS PAINT FIRST' : ph === 2 ? 'THE BLOT DOES THE EAR' : 'WAIT FOR BOTH CHINS', '#c8d8ff');
    }
    const onMark = p && !p.dead && p.onGround && Math.abs(p.cx - b.markX) < 26;
    const low = p && (p.crouch || (p.power === 0 && p.inp && p.inp.down));
    if (A === 'sold') {
      if (b.first) { say(b, 'SOLD?! TO CHINKA-O? FOR THE KITCHEN?!', '#ffe08a'); g.burst(b.cx, b.cy, 30, MUS_HI, 'confetti'); }
      b.y -= 2 * TS * dt; if (b.at > 2.2 && !b.done) { b.done = true; b.die(); }
      return;
    }
    if (A === 'raise') {
      if (b.first) { b.dripX = clamp((p ? p.cx : G.r0) + (Math.random() < 0.5 ? -3 : 3) * TS, G.r0 + TS, G.r1 - TS); say(b, 'A LITTLE DRIP OF GOLD...'); }
      if (b.at > 1.1) b.go('drip');
    } else if (A === 'drip') {
      if (b.at > 0.45 && !b.dripDone) {
        b.dripDone = true; g.burst(b.dripX, b.floorY, 10, PAINT, 'dust');
        if (Math.abs(b.markX - b.dripX) < 30) { b.loaded = true; say(b, 'NOT ON THE MARK! (IT IS LOADED NOW)', '#ffe08a'); }
        else say(b, 'MISSED YOUR LITTLE MARK.', '#c8d8ff');
      }
      if (b.at > 0.8) { b.dripDone = false; b.go('pullback'); }
    } else if (A === 'pullback') {
      if (b.first) say(b, 'AND A BROAD STROKE...');
      if (b.at > 0.8) { b.go('sweep'); b.waveX = G.x1 - 2 * TS; }
    } else if (A === 'sweep') {
      b.waveX -= 9 * TS * dt;
      if (p && !p.dead && Math.abs(p.cx - b.waveX) < 22 && p.y + p.h > b.floorY - 26) p.hurt(b);
      if (b.waveX < G.x0) { b.waveX = null; b.go('pause1'); if (b.loaded) say(b, 'MY EASEL... DON\'T YOU DARE.', '#ffe08a'); }
    } else if (A === 'pause1') {
      if (b.at > (b.loaded ? 3.2 : 1.2)) b.go('raise');
    } else if (A === 'flourish') {
      if (b.first) say(b, 'A SPLENDID BLOT FOR MY EAR...');
      if (b.at > 1.1) { b.go('fling'); b.blotX = b.x; b.blotHit = false; }
    } else if (A === 'fling') {
      const by = b.floorY - 44; b.blotX -= 8 * TS * dt;
      if (p && !p.dead && !b.blotHit && Math.abs(p.cx - b.blotX) < 18 && p.y < by + 10 && p.y + p.h > by - 10) { b.blotHit = true; p.hurt(b); }
      if (b.blotX < G.easel + 20) {
        b.blotX = null;
        if (onMark && low && Math.abs(b.markX - G.ear) < 30 && !b.blotHit) this.improve(b, 'A SPLENDID SECOND EAR!');
        else say(b, Math.abs(b.markX - G.ear) >= 30 ? 'THE MARK ISN\'T ON THE EAR SPOT' : 'IT HIT YOU, NOT THE EAR', '#c8d8ff');
        b.go('pause2');
      }
    } else if (A === 'pause2') {
      if (b.at > 1.4) b.go('flourish');
    } else if (A === 'chin') {
      if (b.first) say(b, 'BEHOLD THE CHIN...');
      if (b.at > 1.1) { b.go('lunge'); b.hitLunge = false; }
    } else if (A === 'lunge') {
      // out of the frame at chest height, across to the chin's tip, a hold, and back
      const out = b.at < 0.35 ? b.at / 0.35 : b.at < 1.6 ? 1 : Math.max(0, 1 - (b.at - 1.6) / 0.4);
      b.lunge = out; const tip = lerp(b.x, G.chin, out), top = b.floorY - 58, bot = b.floorY - 33;
      if (p && !p.dead && p.cx > tip - 14 && p.cx < b.x + b.w && p.y < bot && p.y + p.h > top) p.hurt(b);
      if (out >= 1 && !b.chinsMet && onMark && low && Math.abs(b.markX - G.chin) < 30) { b.chinsMet = true; b.window = 2.6; say(b, 'BOTH CHINS AT ONCE?! NO!', '#ffe08a'); TourKit.sfx('chime', 'pick', { vol: 0.6, pitch: 1.3 }); }
      if (b.at > 2.0) { b.lunge = 0; b.chinsMet = false; b.go('pause3'); }
    } else if (A === 'pause3') {
      if (b.at > (b.window > 0 ? 2.6 : 1.2)) b.go('chin');
    } else b.go('raise');
    b.x = G.frameX - b.w / 2;
  },
  draw(b, ctx, t) {
    const A = b.act, x = b.cx, y = b.y, w = b.w, h = b.h;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    // his own gilt frame, and Piwi leaning out of it (the lunge stretches him far out to the left)
    const lean = A === 'lunge' ? (b.lunge || 0) : 0, reach = lean * (b.x - this.geo(b).chin);
    GA.frame(ctx, b.x - 6, y, w + 12, h, (c, ix, iy, iw, ih) => { c.fillStyle = '#3a2a4a'; c.fillRect(ix, iy, iw, ih); c.fillStyle = '#5a4a6a'; for (let xx = ix; xx < ix + iw; xx += 12) c.fillRect(xx, iy, 5, ih); }, { b: 10 });
    const hx = x - 4 - reach, hy = y + h * 0.42 - (A === 'chin' ? Math.min(1, b.at) * 10 : 0);
    // the body: a magenta painter's smock out of the frame
    ctx.fillStyle = '#d6307a'; ctx.lineWidth = 2.5;
    if (reach > 4) { ctx.beginPath(); ctx.moveTo(x + 10, y + h * 0.5); ctx.lineTo(hx + 16, hy + 6); ctx.lineTo(hx + 16, hy + 26); ctx.lineTo(x + 10, y + h * 0.75); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { rr(ctx, x - 22, y + h * 0.5, 44, h * 0.42, 8); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#fff4e2'; ctx.beginPath(); ctx.arc(hx + 2, hy + 18, 8, 0, Math.PI); ctx.fill(); ctx.stroke();
    // a beret, his head (mouth shut tight: he is vain about it), the chin up in phase 3
    GA.piwi(ctx, hx, hy, 2.0, t, { jaw: A === 'sold' ? 6 : 0, look: -1, brow: A === 'raise' || A === 'flourish' || A === 'chin' ? 1 : 0 });
    ctx.fillStyle = AUB; ctx.beginPath(); ctx.ellipse(hx - 2, hy - 20, 20, 7, -0.15, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(hx + 2, hy - 28, 3, 0, TAU); ctx.fill();
    // the brush arm (raised in the tells) and the palette arm
    const bx = x - 30 - reach * 0.2, brushUp = A === 'raise' || A === 'drip' ? 1 : A === 'pullback' ? -1 : 0;
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 14, y + h * 0.55); ctx.lineTo(bx, y + h * 0.55 - brushUp * 46 + (brushUp < 0 ? 30 : 0)); ctx.stroke();
    ctx.fillStyle = A === 'pullback' ? MUS_HI : CHALK; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(bx, y + h * 0.55 - brushUp * 52 + (brushUp < 0 ? 36 : 0), 6, 10, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
    if (A === 'pullback') { const k = 0.5 + 0.5 * Math.sin(t * 16); ctx.strokeStyle = `rgba(255,224,120,${0.5 + 0.5 * k})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(bx, y + h * 0.55 + 4, 16, 0, TAU); ctx.stroke(); }
    const palUp = A === 'flourish' ? Math.sin(b.at * 12) * 0.6 : 0;
    ctx.save(); ctx.translate(x + 26, y + h * 0.62); ctx.rotate(palUp); ctx.fillStyle = '#d8b88a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.ellipse(0, 0, 20, 13, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
    for (const [dx, dy, c] of [[-9, -4, '#c84a3a'], [0, -7, MUS], [8, -3, '#3a6ac8'], [6, 5, '#4a9a5a']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(dx, dy, 3.2, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  }
};
// the studio's furniture and the tells on the floor: the easel and its portrait, the posing mark, the drip, the wave,
// the blot, the lunge line; one boss line at a time on a pill under the boss bar
TourHooks.on('afterEntities', (play, ctx) => {
  const b = play.boss; if (!b || b.style !== 'gal_retoucher' || b.remove || b.state !== 'fight') return;
  const G = brain.geo(b), A = b.act, t = b.t, fy = b.floorY, ph = b.phase || 1, k = 0.5 + 0.5 * Math.sin(t * 6);
  ctx.save();
  // the easel and his worst portrait (mouth wide open), improved hit by hit: a moustache, a second ear, the likeness
  const ex = G.easel, ey = fy - 3.6 * TS;
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ex - 26, fy); ctx.lineTo(ex, ey - 6); ctx.lineTo(ex + 26, fy); ctx.moveTo(ex, ey); ctx.lineTo(ex + 4, fy); ctx.stroke();
  const hits = 6 - b.hp, glow = (ph === 1 && b.loaded) || (ph === 3 && b.window > 0);
  GA.frame(ctx, ex - 40, ey - 40, 80, 76, (c, ix, iy, iw, ih) => {
    c.fillStyle = '#cfd8e8'; c.fillRect(ix, iy, iw, ih);
    GA.piwi(c, ix + iw / 2, iy + ih * 0.5, 2.1, t, { jaw: hits >= 6 ? 0 : 5, look: 0 });
    if (hits >= 1) { c.fillStyle = '#3a2a1a'; c.beginPath(); c.ellipse(ix + iw / 2 - 7, iy + ih * 0.5 + 7, 9, 3, 0.3, 0, TAU); c.ellipse(ix + iw / 2 + 9, iy + ih * 0.5 + 7, 9, 3, -0.3, 0, TAU); c.fill(); }
    if (hits >= 3) { c.fillStyle = PAINT; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.ellipse(ix + iw / 2 + 24, iy + ih * 0.5, 6, 9, 0, 0, TAU); c.fill(); c.stroke(); }
  }, { b: 7, lip: glow ? MUS_HI : MUS });
  if (glow) { ctx.strokeStyle = `rgba(255,224,120,${0.5 + 0.5 * k})`; ctx.lineWidth = 5; ctx.strokeRect(ex - 46, ey - 46, 92, 88); ctx.fillStyle = '#ffe08a'; ctx.font = '12px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(ph === 3 ? 'NOW! THROW' : 'THROW HERE', ex, ey - 54); }
  // the rail and the posing mark (gold paint on it once loaded); the ear spot (phase 2) and the chin spot (phase 3)
  ctx.strokeStyle = 'rgba(28,20,38,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(G.r0 - 26, fy + 4); ctx.lineTo(G.r1 + 26, fy + 4); ctx.stroke();
  const spot = ph === 2 ? G.ear : ph === 3 ? G.chin : null;
  if (spot != null) { ctx.strokeStyle = `rgba(255,224,120,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(spot, fy - 2, 30, 7, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#ffe08a'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(ph === 2 ? 'EAR' : 'CHIN', spot, fy + 22); }
  ctx.save(); ctx.translate(b.markX, fy); ctx.fillStyle = b.loaded ? PAINT : MUS; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, -26, -9, 52, 9, 3); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = AUB; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(8, -1); ctx.moveTo(8, -8); ctx.lineTo(-8, -1); ctx.stroke();
  if (b.loaded) { ctx.fillStyle = PAINT; ctx.beginPath(); ctx.ellipse(0, -10, 14, 5, 0, Math.PI, 0); ctx.fill(); }
  ctx.restore();
  // phase 1: the drop line and its ring, the drip falling, the paint wave
  if (A === 'raise' || (A === 'drip' && b.at < 0.45)) {
    const dx = b.dripX, top = b.y + b.h * 0.55 - 52, yy = A === 'drip' ? lerp(top, fy, b.at / 0.45) : top + Math.sin(t * 6) * 2;
    ctx.strokeStyle = BLUE; ctx.lineWidth = 2.5; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(dx, top); ctx.lineTo(dx, fy); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(255,224,120,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(dx, fy - 2, 26, 6, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = PAINT; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(dx, yy - 12); ctx.quadraticCurveTo(dx + 8, yy, dx, yy + 6); ctx.quadraticCurveTo(dx - 8, yy, dx, yy - 12); ctx.fill(); ctx.stroke();
  }
  if (A === 'sweep' && b.waveX != null) { const wx = b.waveX; ctx.fillStyle = PAINT; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx - 22, fy); ctx.quadraticCurveTo(wx - 14, fy - 30, wx + 6, fy - 26); ctx.quadraticCurveTo(wx + 2, fy - 14, wx + 26, fy - 8); ctx.lineTo(wx + 60, fy); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // phase 2: the flight line at ear height, the blot
  if (A === 'flourish') { ctx.strokeStyle = BLUE; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.lineDashOffset = t * 14; ctx.beginPath(); ctx.moveTo(b.x, fy - 44); ctx.lineTo(G.easel + 20, fy - 44); ctx.stroke(); ctx.setLineDash([]); }
  if (A === 'fling' && b.blotX != null) { ctx.fillStyle = '#c84a3a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); for (let q = 0; q < 10; q++) { const a = q * TAU / 10, r = 13 + (q % 2) * 4 + Math.sin(t * 20 + q) * 1.5; ctx.lineTo(b.blotX + Math.cos(a) * r, fy - 44 + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // phase 3: the lunge line at chest height
  if (A === 'chin') { ctx.strokeStyle = BLUE; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(b.x, fy - 46); ctx.lineTo(G.chin, fy - 46); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = `rgba(255,120,90,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x, fy - 58); ctx.lineTo(G.chin, fy - 58); ctx.moveTo(b.x, fy - 33); ctx.lineTo(G.chin, fy - 33); ctx.stroke(); }
  if (b.line) {
    const L = b.line, a = Math.min(1, (2.8 - L.t) * 3); if (a <= 0) b.line = null;
    else { ctx.save(); ctx.globalAlpha = a; ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const x = play.camX + Game.viewW / 2, y = play.camY + 74, w = ctx.measureText(L.text).width + 22; ctx.fillStyle = 'rgba(28,20,38,0.92)'; rr(ctx, x - w / 2, y - 11, w, 22, 11); ctx.fill(); ctx.fillStyle = L.col; ctx.fillText(L.text, x, y + 1); ctx.restore(); }
  }
  ctx.restore();
});
const boss = { id: 'gal_retoucher', name: 'The Retoucher', hp: 6, dims: [96, 150], music: 'tour_gal_boss', country: 'gal', brain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.gal_retoucher = [60, 60, 60, 20];
// the studio: a bust and a plant at the ends (the easel and the frame are the boss's own)
Tour.pieces['gal.arena_studio'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o;
  B.decorAt('galPlant', x0 + 1, GY, 1); B.decorAt('galBust', x0 + w - 2, GY, 2);
};
Tour.galKit.retoucherBrain = brain;
})();
