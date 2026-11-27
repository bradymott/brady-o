/* ============================================================
   POSTMARK SOUND: the boss, THE POSTMASTER'S THUMB (27-6). A huge cartoon thumb in a coral cuff, its pad black with
   franking ink, that cancels everything on the sorting desk. Brady never stomps it: he gets it to cancel a torn
   address, and every address it completes posts it a little further back along its own arm (a hit).
   1 THE DOTTED RING  a dotted ring follows Brady across the desk, then settles (the tell, 1.2 s in all) and the
                      thumb stamps straight down on it. Stand on the first torn address (the card on the left) while the
                      ring settles, then step out: the thumb cancels the address.
   2 THE INKED EDGE   the thumb tilts at one end of the desk, its inked edge glowing (the tell, 1.1 s), then rolls an
                      ink stripe along the desk. Stand on the crease plate (the second address's halves slide
                      together) and jump the stripe from there: it inks the joined address on its way.
   3 TWO HALF-RINGS   two pale half-rings appear, one on the joined address, one on the crease plate (the tell, 1.3
                      s): a double impression. Hold the crease for the first mark, then step clear before the second.
   The last completed address mails the thumb back to the other end of its own arm. Touching the thumb never hurts;
   only the stamp's impact under its ring and the rolling stripe do. Every window is generous.
   ============================================================ */
(function () {
const K = Tour.postKit, INK = K.INK, PA = K.PostArt, CORAL = K.CORAL, COBALT = K.COBALT, BLACK = K.BLACK, WHITE = K.WHITE, PAPER = K.PAPER;
const say = (b, t, c) => { b.line = { text: t, col: c || '#fff4cc', t: 0 }; };
const SKIN = '#f2c4a8', SKIN_LO = '#d89a80';
const stripeArt = (c, s) => { c.save(); c.fillStyle = BLACK; c.strokeStyle = COBALT; c.lineWidth = 2; c.beginPath(); c.moveTo(s.x, s.y + s.h); c.quadraticCurveTo(s.x + s.w / 2, s.y - 8, s.x + s.w, s.y + s.h); c.closePath(); c.fill(); c.stroke(); c.restore(); };
const brain = {
  phases: [4, 2],
  guardText: 'CANCELLED!',
  // the desk's furniture (pixels): the first address (a card), the second address's join and its crease plate
  geo(b) {
    if (b.geoC) return b.geoC;
    const x0 = b.arenaX0, x1 = b.arenaX1, W = x1 - x0;
    return (b.geoC = { a1: x0 + W * 0.2, a1w: 2.6 * TS, join: x0 + W * 0.52, plate: x0 + W * 0.52 + 4 * TS, rest: 4.5 * TS, x0, x1 });
  },
  wake(b) { b.phase = 1; b.hoverY = b.floorY - b.h - 3 * TS; b.y = b.hoverY; b.joinK = 0; b.linger = 0; b.a1Torn = 1; say(b, 'EVERYTHING ON THIS DESK GETS CANCELLED. EVERYTHING.'); b.go('hover'); },
  phase(b, n) {
    const g = b.g;
    if (n === 2) { g.bannerText = 'THE INKED EDGE!'; g.bannerT = 2; say(b, 'ADDRESS TWO IS IN TWO PIECES. HOW UNTIDY.'); }
    if (n === 3) { g.bannerText = 'A DOUBLE IMPRESSION!'; g.bannerT = 2; say(b, 'TWICE AS CANCELLED. HOLD STILL.'); }
    b.go('rise');
  },
  hurt(b) { if (b.act !== 'roll') b.go('rise'); },
  hit(b, kind) { return 'bounce'; },
  touch(b, p) { return true; },
  lastHit(b) { b.go('mailed'); b.state = 'fight'; return true; },
  cancel(b, text) { const g = b.g; b.damage(1, { text, col: '#ffe08a' }); TourKit.sfx('stamp', 'bump', { vol: 0.8, pitch: 0.7 }); Sound.play('secret', { vol: 0.4 }); },
  together(b) { return b.joinK > 0.95; },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1, G = this.geo(b);
    if (b.line) b.line.t += dt;
    // the crease plate: standing on it slides address two's halves together; they stay a moment after he hops
    const onPlate = p && !p.dead && Math.abs(p.cx - G.plate) < 0.9 * TS && p.y + p.h > b.floorY - 6;
    if (onPlate) b.linger = 1.2; else b.linger = Math.max(0, (b.linger || 0) - dt);
    b.joinK = clamp(b.joinK + (b.linger > 0 ? 2.4 : -1.4) * dt, 0, 1);
    if (b.imp) for (const q of b.imp) q.t += dt;
    if (b.imp) b.imp = b.imp.filter(q => q.t < 1.6);
    const impact = (x, r) => {
      const im = b.imp || (b.imp = []); im.push({ x, t: 0 }); g.shake(6); Sound.play('stomp', { pitch: 0.5, vol: 0.7 }); g.burst(x, b.floorY, 14, '#2a2850', 'dust');
      if (p && !p.dead && Math.abs(p.cx - x) < r && p.y + p.h > b.floorY - 2.2 * TS) p.hurt(b);
    };
    const A = b.act;
    if (A === 'mailed') {
      // the completed address posts the thumb back up its own arm: off it goes, up and away
      if (b.first) { say(b, 'RETURN TO SENDER?! THAT IS... MY OWN ADDRESS...', '#ffe08a'); g.burst(b.cx, b.cy, 24, '#f47a5a', 'confetti'); }
      b.x += 3 * TS * dt * Math.min(1, b.at); b.y -= 9 * TS * dt * Math.min(1, b.at);
      if (b.at > 2.0 && !b.done) { b.done = true; b.die(); }
      return;
    }
    if (A === 'hover' || A === 'rise') {
      b.y = lerp(b.y, b.hoverY, Math.min(1, dt * 4));
      if (p) b.x = lerp(b.x, clamp(p.cx - b.w / 2, G.x0, G.x1 - b.w), Math.min(1, dt * 1.2));
      if (b.at > (A === 'rise' ? 1.2 : 0.9)) b.go(ph === 1 ? 'ring' : ph === 2 ? 'edge' : 'rings');
    } else if (A === 'ring') {
      // phase 1's tell: a dotted ring follows Brady, then settles where he stands (it stops following at 0.65 s)
      if (b.first) { say(b, 'HOLD STILL FOR YOUR POSTMARK...'); }
      if (b.at < 0.65 && p) b.tx = clamp(p.cx, G.x0 + 40, G.x1 - 40);
      b.x = lerp(b.x, b.tx - b.w / 2, Math.min(1, dt * 6)); b.y = lerp(b.y, b.hoverY, Math.min(1, dt * 4));
      if (b.at > 1.25) b.go('stamp');
    } else if (A === 'stamp') {
      const k = Math.min(1, b.at / 0.18); b.x = b.tx - b.w / 2; b.y = lerp(b.hoverY, b.floorY - b.h, k);
      if (k >= 1 && !b.hitDone) {
        b.hitDone = true; impact(b.tx, 1.3 * TS);
        if (Math.abs(b.tx - G.a1) < G.a1w / 2 + 6 && b.a1Torn >= 1) { b.a1Torn = 0; this.cancel(b, 'ADDRESS ONE: CANCELLED! IT POSTS ITSELF BACK'); }
        b.go('down');
      }
    } else if (A === 'down') {
      b.y = b.floorY - b.h; if (b.first) b.hitDone = false;
      if (b.at > 1.5) { b.go('rise'); b.a1Torn = 1; }
    } else if (A === 'edge') {
      // phase 2's tell: the thumb goes to the end of the desk farthest from the plate and tilts; its inked edge glows
      if (b.first) { b.side = G.x0 + 1.5 * TS; say(b, 'A NICE STRAIGHT LINE OF INK...'); }
      b.x = lerp(b.x, b.side - b.w / 2 + b.w / 2, Math.min(1, dt * 5)); b.y = lerp(b.y, b.floorY - b.h - 0.5 * TS, Math.min(1, dt * 5));
      if (b.at > 1.4) { b.go('roll'); b.sx = b.cx + b.w / 2; b.passed = false; b.stripeX = b.sx; Sound.play('spring', { pitch: 0.5, vol: 0.5 }); }
    } else if (A === 'roll') {
      const x = b.sx + 4.6 * TS * b.at; b.stripeX = x;
      // the stripe: a low rolling wave of ink along the desk (jump it)
      if (p && !p.dead && Math.abs(p.cx - x) < 20 && p.y + p.h > b.floorY - 20) p.hurt(b);
      if (!b.passed && x >= G.join) { b.passed = true; if (this.together(b)) this.cancel(b, 'ADDRESS TWO, JOINED AND INKED! POSTED BACK'); else say(b, 'HA! STILL IN TWO PIECES.', '#c8d8ff'); }
      if (x > G.x1) { b.stripeX = null; b.go('rise'); }
    } else if (A === 'rings') {
      // phase 3's tell: two pale half-rings: the first over the join, the second over the crease plate
      if (b.first) { say(b, 'ONE... AND TWO.'); b.tx = G.join; b.tx2 = G.plate; b.hitDone = false; b.hit2 = false; }
      b.x = lerp(b.x, b.tx - b.w / 2, Math.min(1, dt * 5)); b.y = lerp(b.y, b.hoverY, Math.min(1, dt * 4));
      if (b.at > 1.3) b.go('double');
    } else if (A === 'double') {
      // the first impression on the join, then the second on the plate
      const t = b.at;
      if (t < 0.18) { b.x = b.tx - b.w / 2; b.y = lerp(b.hoverY, b.floorY - b.h, t / 0.18); }
      else if (!b.hitDone) { b.hitDone = true; b.y = b.floorY - b.h; impact(b.tx, 1.1 * TS); if (this.together(b)) this.cancel(b, 'FIRST MARK ON THE JOINED ADDRESS!'); else say(b, 'MISSED THE ADDRESS. AGAIN!', '#c8d8ff'); }
      else if (t < 0.8) { const k = (t - 0.18) / 0.62; b.x = lerp(b.tx, b.tx2, k) - b.w / 2; b.y = b.floorY - b.h - Math.sin(k * Math.PI) * 3 * TS; }
      else if (!b.hit2) { b.hit2 = true; b.x = b.tx2 - b.w / 2; b.y = b.floorY - b.h; impact(b.tx2, 1.1 * TS); }
      else if (t > 1.9) b.go('rise');
    } else b.go('hover');
    b.x = clamp(b.x, G.x0 - b.w / 2, G.x1 - b.w / 2);
  },
  draw(b, ctx, t) {
    const A = b.act, x = b.cx, yb = b.y + b.h, ph = b.phase || 1;
    ctx.save(); ctx.translate(x, yb); ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineWidth = 3;
    if (A === 'edge') ctx.rotate(-0.35 * Math.min(1, b.at * 1.5));
    if (A === 'mailed') ctx.rotate(-0.6);
    // the arm going up out of the view: a coral cuff with a button, a sleeve beyond
    ctx.fillStyle = '#5a6a9a'; ctx.fillRect(-34, -b.h - 400, 68, 400 - 70);
    ctx.fillStyle = CORAL; rr(ctx, -44, -b.h + 6, 88, 30, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff4cc'; ctx.beginPath(); ctx.arc(30, -b.h + 21, 5, 0, TAU); ctx.fill(); ctx.stroke();
    // the thumb, pointing down: a rounded column, two knuckle creases, the nail on its back (facing us), the inky pad
    const sq = A === 'stamp' || A === 'down' || (A === 'double' && b.at > 0.15 && b.at < 0.3) ? 0.9 : 1;
    ctx.save(); ctx.scale(1, sq);
    ctx.fillStyle = SKIN; ctx.beginPath(); ctx.moveTo(-38, -b.h + 34); ctx.lineTo(38, -b.h + 34); ctx.lineTo(40, -36); ctx.quadraticCurveTo(40, 0, 0, 0); ctx.quadraticCurveTo(-40, 0, -40, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = SKIN_LO; ctx.lineWidth = 2.5; for (const yy of [-b.h + 52, -b.h + 60]) { ctx.beginPath(); ctx.moveTo(-24, yy); ctx.quadraticCurveTo(0, yy + 5, 24, yy); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.fillStyle = '#ffe8e0'; rr(ctx, -20, -54, 40, 40, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; rr(ctx, -12, -48, 10, 22, 5); ctx.fill();
    // the ink on the pad, and the inked edge glowing in phase 2's tell
    ctx.fillStyle = BLACK; ctx.beginPath(); ctx.ellipse(0, -4, 32, 7, 0, 0, Math.PI); ctx.fill();
    if (A === 'edge') { const k = 0.5 + 0.5 * Math.sin(t * 14); ctx.strokeStyle = `rgba(90,122,232,${0.5 + 0.5 * k})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(38, -40); ctx.quadraticCurveTo(38, -2, 0, 0); ctx.stroke(); }
    // a stern little face: two dots and a flat mouth on the pad side (comic, not a person)
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-12, -70, 3.5, 0, TAU); ctx.arc(12, -70, 3.5, 0, TAU); ctx.fill();
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-10, b.hurtT > 0 ? -60 : -62); ctx.lineTo(10, b.hurtT > 0 ? -58 : -62); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
};
// the desk's furniture and the tells on the floor: the first address, the second's halves and crease plate, the
// dotted ring, the half-rings, the impressions; the boss's lines on a pill under the boss bar
TourHooks.on('afterEntities', (play, ctx) => {
  const b = play.boss; if (!b || b.style !== 'post_thumb' || b.remove || b.state !== 'fight') return;
  const G = brain.geo(b), A = b.act, t = b.t, fy = b.floorY;
  ctx.save();
  // the first torn address: a card with a torn corner, pulsing while it can be cancelled
  const k = 0.5 + 0.5 * Math.sin(t * 5);
  const card = (cx, w, tag, glow) => { ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(cx - w / 2, fy - 14, w, 14); ctx.strokeRect(cx - w / 2, fy - 14, w, 14); ctx.fillStyle = COBALT; for (let q = 0; q < 3; q++) ctx.fillRect(cx - w / 2 + 8, fy - 11 + q * 3.5, w - 16 - q * 10, 1.8); if (glow) { ctx.strokeStyle = `rgba(255,224,138,${0.4 + 0.5 * k})`; ctx.lineWidth = 3; ctx.strokeRect(cx - w / 2 - 4, fy - 18, w + 8, 20); } if (tag) { ctx.fillStyle = CORAL; ctx.font = '8px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(tag, cx, fy - 30); } };
  if (b.phase === 1) card(G.a1, G.a1w, 'ADDRESS 1', b.a1Torn >= 1);
  // the second address's halves sliding together over the join, and the crease plate (big, pulsing)
  if (b.phase >= 2) {
    const j = b.joinK, w = 1.4 * TS, l = lerp(G.join - G.rest - w, G.join - w, j), r = lerp(G.join + G.rest, G.join, j);
    card(l + w / 2, w, null, false); card(r + w / 2, w, null, false);
    if (j > 0.95) { ctx.strokeStyle = `rgba(255,224,138,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.strokeRect(G.join - w - 4, fy - 18, 2 * w + 8, 20); }
    ctx.fillStyle = CORAL; ctx.font = '8px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('ADDRESS 2', G.join, fy - 38);
    const pk = 0.5 + 0.5 * Math.sin(t * 6);
    ctx.fillStyle = j > 0.5 ? '#ffe08a' : CORAL; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(G.plate, fy - 2, 22 + pk * 3, 6 + pk, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(G.plate, fy - 30); ctx.lineTo(G.plate, fy + 4); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = WHITE; ctx.font = '7px ' + FONT_DISPLAY; ctx.fillText('CREASE', G.plate, fy - 40);
  }
  // the dotted ring (phase 1), the half-rings (phase 3)
  if (A === 'ring') { const q = Math.min(1, b.at / 1.25), settled = b.at >= 0.65; ctx.strokeStyle = settled ? `rgba(255,80,60,${0.6 + 0.4 * k})` : 'rgba(22,20,30,0.6)'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.ellipse(b.tx, fy - 3, 70 - 30 * q, 11 - 4 * q, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
  if (A === 'rings' || (A === 'double' && !b.hit2)) { for (const [xx, n] of [[b.tx, 1], [b.tx2, 2]]) { if (A === 'double' && n === 1 && b.hitDone) continue; ctx.strokeStyle = n === 1 ? 'rgba(255,240,200,0.8)' : `rgba(255,120,90,${0.5 + 0.5 * k})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(xx, fy - 3, 40, 9, 0, Math.PI, 0); ctx.stroke(); ctx.fillStyle = WHITE; ctx.font = '10px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(String(n), xx, fy - 18); } }
  if (A === 'roll' && b.stripeX != null) stripeArt(ctx, { x: b.stripeX - 17, y: fy - 22, w: 34, h: 22 });
  for (const q of b.imp || []) PA.postmark(ctx, q.x - 14, fy - 10, 16, BLACK, Math.max(0, 1 - q.t / 1.6));
  if (b.line) {
    const L = b.line, a = Math.min(1, (2.8 - L.t) * 3); if (a <= 0) b.line = null;
    else { ctx.save(); ctx.globalAlpha = a; ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const x = play.camX + Game.viewW / 2, y = play.camY + 74, w = ctx.measureText(L.text).width + 22; ctx.fillStyle = 'rgba(22,20,40,0.9)'; rr(ctx, x - w / 2, y - 11, w, 22, 11); ctx.fill(); ctx.fillStyle = L.col; ctx.fillText(L.text, x, y + 1); ctx.restore(); }
  }
  ctx.restore();
});
const boss = { id: 'post_thumb', name: 'The Postmaster\'s Thumb', hp: 6, dims: [84, 130], music: 'tour_post_boss', country: 'post', brain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.post_thumb = [60, 60, 60, 20];
// the sorting desk: inkwells and parcels at its ends, two low letter-trays to hop on
Tour.pieces['post.arena_desk'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o;
  B.decorAt('postInkwell', x0 + 1, GY, 1); B.decorAt('postCrateS', x0 + w - 2, GY, 2); B.decorAt('postInkwell', x0 + w - 4, GY, 3);
};
Tour.postKit.thumbBrain = brain;
})();
