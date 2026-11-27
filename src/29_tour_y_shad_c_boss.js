/* ============================================================
   THE DEPARTMENT OF UNCLAIMED SHADOWS: the boss, THE UNDERSTUDY (35-5), a shadow that signs for everything.
   A flat grape shadow-clerk on the wall of the claims counter: a bowler hat (with the department's notch in its brim),
   a green visor, salmon sleeve garters, long thin arms, a pen behind one ear. An office silhouette, not Brady's shape,
   not a person: it is a shadow nobody claimed, and it has been signing for everyone else's ever since. Touching it never
   hurts (it is only a shadow on the wall); its reach, its kick and its rush along the floor do. Two clerks' lamps stand
   on the floor: L (left) and R (right); claim slots are cut into the skirting board.
   1 THE REACH   it flattens one palm (the tell: a dashed reach line along the skirting, 1.1 s), then its arm shoots along
                 the wall to wherever Brady stands: jump the hand. If Brady stood on the HAND slot, the hand lies over it:
                 cross lamp L (walk past it) and the light swings round and pulls the hand into the slot (a hit).
   2 THE KICK    it lifts a heel (the tell: a dashed line at ankle height, 1.1 s), then a long flat kick along the floor to
                 wherever Brady stands: jump the shoe. If he stood on the BOOT slot, the shoe lies in it: cross back over
                 lamp R and the boot is claimed (a hit).
   3 THE SPLIT   between the two lamps it splits in two halves, each with its own hat; their feet follow Brady. Both
                 hats rise (the tell, 1.1 s), then the halves swap heads and rush flat along the floor: jump them. If both
                 halves' feet were on their claim slots when the hats rose, both claims stamp shut on them (a hit).
   Brady gets his own shadow back at the end, complete with the bun.
   ============================================================ */
(function () {
const K = Tour.shadKit, INK = K.INK, SA = K.ShadArt, BUT = K.BUT, BUT_HI = K.BUT_HI, GRA = K.GRA, GRA_HI = K.GRA_HI, GRA_LO = K.GRA_LO, SAL = K.SAL, SAL_LO = K.SAL_LO, WHITE = K.WHITE;
const say = (b, t, c) => { const L = { text: t, col: c || '#fff0d0', t: 0 }; if (b.line && b.line.t < 1.1 && b.line.text !== t) b.lineNext = L; else b.line = L; };
const VISOR = '#3a9a6a';
const TELL = 1.1, OUT = 0.38, HOLD = 2.6;
const brain = {
  phases: [4, 2],
  guardText: ' ',
  // the counter's furniture (pixels): the lamps, the hand and boot slots, the two foot slots, the clerk's place
  geo(b) {
    if (b.geoC) return b.geoC;
    const x0 = b.arenaX0, x1 = b.arenaX1, L = x0 + 9 * TS, R = x0 + 12.5 * TS, at = x0 + 10.5 * TS, feet = K.splitFeet(L, R, at);
    // everything Brady plays with stays clear of the stick (left) and the two buttons (right)
    return (b.geoC = { x0, x1, L, R, hand: x0 + 6.5 * TS, boot: x0 + 15 * TS, at, feet, home: x0 + 18.4 * TS, lo: x0 + 5.5 * TS });
  },
  wake(b) {
    const G = this.geo(b); b.phase = 1; b.ext = 0; b.claimed = false;
    b.x = G.home - b.w / 2; b.y = b.floorY - b.h;
    say(b, 'SIGN HERE. AND HERE. AND THIS ONE IS YOURS NOW.'); b.go('palm');
  },
  phase(b, n) {
    const g = b.g; b.ext = 0; b.claimed = false;
    if (n === 2) { g.bannerText = 'THE KICK!'; g.bannerT = 2; say(b, 'I SIGN WITH MY FEET TOO, YOU KNOW.'); b.go('rest2'); }
    if (n === 3) { g.bannerText = 'THE SPLIT!'; g.bannerT = 2; say(b, 'TWO LAMPS? THEN THERE ARE TWO OF ME.'); b.go('split'); }
  },
  hurt(b) {},
  hit(b, kind) { if (!(b.flatT > b.t)) { b.flatT = b.t + 1.5; say(b, 'I\'M A SHADOW. YOU CAN\'T STAND ON ME.', '#c8d8ff'); } return kind === 'stomp' || kind === 'spin' ? 'bounce' : false; },
  touch(b, p) { return true; },
  lastHit(b) { b.go('gone'); b.state = 'fight'; return true; },
  claim(b, text) { b.line = null; say(b, text, '#ffe08a'); b.claimed = true; const ph = b.phase; b.damage(1, { col: BUT_HI }); if (b.phase !== ph) b.claimed = false; Sound.play('secret', { vol: 0.5 }); },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1, G = this.geo(b), A = b.act, alive = p && !p.dead;
    if (b.line) b.line.t += dt;
    if ((!b.line || b.line.t > 2.6) && b.lineNext) { b.line = b.lineNext; b.lineNext = null; }
    b.x = G.home - b.w / 2;
    const band = (top, tipX) => alive && Math.abs(p.cx - tipX) < 20 && p.y + p.h > b.floorY - top;
    if (A === 'gone') {
      if (b.first) { say(b, 'FINE. HERE\'S YOUR SHADOW BACK. BUN AND ALL.', '#ffe08a'); g.burst(b.cx, b.cy, 30, BUT_HI, 'confetti'); }
      b.fade = Math.min(1, b.at / 2); if (b.at > 2.4 && !b.done) { b.done = true; b.die(); }
      return;
    }
    /* ---- phase 1: the reach (to the left, toward lamp L and the hand slot) ---- */
    if (A === 'palm') { if (b.first) say(b, 'ONE MOMENT... I\'LL JUST REACH FOR THAT.'); b.tx = clamp(alive ? p.cx : G.hand, G.lo, G.home - 3 * TS); if (b.at > TELL) { b.go('reach'); b.hitArm = false; } }
    else if (A === 'reach') { b.ext = Math.min(1, b.at / OUT); const tip = lerp(G.home - 30, b.tx, b.ext); if (!b.hitArm && band(30, tip)) { b.hitArm = true; p.hurt(b); } if (b.ext >= 1) { b.go('hold'); b.side0 = alive ? Math.sign(p.cx - G.L) : 0; b.lined = Math.abs(b.tx - G.hand) < 30; if (b.lined) say(b, 'HEY, THAT\'S A SLOT. I DON\'T LIKE SLOTS.', '#ffe08a'); } }
    else if (A === 'hold') {
      const Lx = ph === 1 ? G.L : G.R;
      if (b.lined && !b.claimed && alive && Math.sign(p.cx - Lx) !== b.side0 && b.side0 !== 0) { this.claim(b, ph === 1 ? 'MY HAND! IT\'S BEEN CLAIMED!' : 'MY BOOT! SIGNED, SEALED, CLAIMED!'); b.pullT = 0; if (b.act !== 'hold') return; }
      if (b.claimed) b.pullT = (b.pullT || 0) + dt;
      if (b.at > HOLD || (b.claimed && b.pullT > 0.9)) b.go('back');
    }
    else if (A === 'back') { b.ext = Math.max(0, 1 - b.at / 0.4); if (b.at > 0.45) { b.ext = 0; b.claimed = false; b.go(ph === 1 ? 'rest1' : 'rest2'); } }
    else if (A === 'rest1') { if (b.at > 1.0) b.go('palm'); }
    /* ---- phase 2: the kick (toward lamp R and the boot slot) ---- */
    else if (A === 'rest2') { if (b.at > 1.0) b.go('heel'); }
    else if (A === 'heel') { if (b.first) say(b, 'A LONG STRIDE FOR A SHORT SIGNATURE...'); b.tx = clamp(alive ? p.cx : G.boot, G.lo, G.home - 3 * TS); if (b.at > TELL) { b.go('kick'); b.hitArm = false; } }
    else if (A === 'kick') { b.ext = Math.min(1, b.at / OUT); const tip = lerp(G.home - 30, b.tx, b.ext); if (!b.hitArm && band(26, tip)) { b.hitArm = true; p.hurt(b); } if (b.ext >= 1) { b.go('hold'); b.side0 = alive ? Math.sign(p.cx - G.R) : 0; b.lined = Math.abs(b.tx - G.boot) < 30; if (b.lined) say(b, 'MY SHOE IS IN A SLOT. WHY IS MY SHOE IN A SLOT?', '#ffe08a'); } }
    /* ---- phase 3: the split ---- */
    else if (A === 'split') { if (b.first) say(b, 'WHICH OF US IS THE REAL ONE? NEITHER!'); if (b.at > 1.6) b.go('hats'); }
    else if (A === 'hats') {
      if (b.first) say(b, 'HATS OFF... AND SWAP!');
      if (b.at > TELL) { const f = this.halves(b); b.locked = !!f && Math.abs(f[0] - G.feet[0]) < 16 && Math.abs(f[1] - G.feet[1]) < 16; b.rushFrom = f || G.feet.slice(); b.go('rush'); b.hitArm = false; if (b.locked) say(b, 'BOTH FEET IN THE SLOTS?! WAIT...', '#ffe08a'); }
    }
    else if (A === 'rush') {
      const k = Math.min(1, Math.max(0, b.at - 0.1) / 0.5), xa = lerp(b.rushFrom[0], b.rushFrom[1], k), xb = lerp(b.rushFrom[1], b.rushFrom[0], k);
      if (!b.hitArm && b.at > 0.14 && (band(26, xa) || band(26, xb))) { b.hitArm = true; p.hurt(b); }
      if (k >= 1) { if (b.locked) { this.claim(b, 'BOTH HALVES CLAIMED! THAT\'S ME SIGNED FOR!'); if (b.act === 'rush') b.go('stamp'); } else { say(b, 'MISSED THE SLOTS. AGAIN!', '#c8d8ff'); b.go('split'); } }
    }
    else if (A === 'stamp') { if (b.at > 1.4) { b.claimed = false; b.go('split'); } }
    else if (A === 'wait') { /* held still (the boss test walks Brady into place) */ }
    else b.go(ph === 1 ? 'palm' : ph === 2 ? 'heel' : 'split');
  },
  // phase 3: where the two halves' feet are (they follow Brady while he stands between the lamps), or null
  halves(b) {
    const G = this.geo(b), p = b.g.player; if (!p || p.dead || p.cx <= G.L + 6 || p.cx >= G.R - 6) return null;
    return K.splitFeet(G.L, G.R, p.cx);
  },
  // the clerk: a shadow cast on the wall at (x, feet y), height h. Painted flat into its own little canvas (grape, no ink,
  // no modelling, no eyes: the visor's green band and the hat's notch are its face), its feet fading out into the
  // skirting, then laid on the wall see-through and leaning like a cast shadow. o: { palm, heel, hat (lift px), half
  // (-1 / 1: one half only), a (alpha), arm < 0 (the arm is down along the wall, drawn by the attack) }
  clerk(ctx, x, y, h, t, o) {
    o = o || {}; const s = h / 150, W = 200, H = 250, R = 2, FY = 236;
    const C = this.canvas || (this.canvas = (() => { const c = document.createElement('canvas'); c.width = W * R; c.height = H * R; return c; })()), c = C.getContext('2d');
    c.setTransform(R, 0, 0, R, 0, 0); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H);
    c.save(); c.translate(W / 2, FY); c.scale(s, s);
    if (o.half) { c.beginPath(); c.rect(o.half < 0 ? -100 : 0, -260, 100, 280); c.clip(); }
    c.fillStyle = GRA;
    const heel = o.heel ? 10 : 0;
    c.fillRect(-20, -60, 16, 60 - heel); c.fillRect(4, -60, 16, 60);
    c.beginPath(); c.ellipse(-12, -2 - heel, 14, 6, 0, 0, TAU); c.ellipse(14, -2, 14, 6, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-26, -60); c.lineTo(-30, -112); c.lineTo(30, -112); c.lineTo(26, -60); c.closePath(); c.fill();
    if (o.arm < 0) c.fillRect(-36, -106, 12, 90);
    else { c.fillRect(-36, -106, 12, 46); c.beginPath(); c.ellipse(-30, -56, o.palm ? 15 : 8, o.palm ? 6 : 8, 0, 0, TAU); c.fill(); }
    c.fillRect(24, -106, 12, 46); c.beginPath(); c.arc(30, -56, 8, 0, TAU); c.fill();
    c.fillStyle = SAL; c.fillRect(-36, -100, 12, 6); c.fillRect(24, -100, 12, 6);
    c.fillStyle = GRA; c.beginPath(); c.ellipse(0, -130, 20, 19, 0, 0, TAU); c.fill();
    c.fillStyle = VISOR; c.beginPath(); c.moveTo(-22, -140); c.lineTo(26, -140); c.lineTo(30, -133); c.lineTo(-18, -133); c.closePath(); c.fill();
    const hl = o.hat || 0;
    c.fillStyle = GRA; c.beginPath(); c.ellipse(0, -146 - hl, 30, 6, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(-18, -148 - hl); c.quadraticCurveTo(-18, -172 - hl, 0, -172 - hl); c.quadraticCurveTo(18, -172 - hl, 18, -148 - hl); c.closePath(); c.fill();
    c.fillStyle = BUT; c.fillRect(-18, -154 - hl, 36, 5);
    // the department's notch: a bite out of the brim (the wall shows through)
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(16, -147 - hl); c.lineTo(28, -147 - hl); c.lineTo(22, -139 - hl); c.closePath(); c.fill();
    c.restore();
    // the feet fade into the skirting
    c.globalCompositeOperation = 'destination-out'; const gr = c.createLinearGradient(0, FY - 34 * s, 0, FY + 2); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.95)'); c.fillStyle = gr; c.fillRect(0, FY - 34 * s, W, 40 * s + 4);
    c.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha *= 0.72 * (o.a == null ? 1 : o.a); ctx.translate(x, y); ctx.transform(1, 0, -0.16, 1, 0, 0);
    ctx.drawImage(C, -W / 2, -FY, W, H); ctx.restore();
  },
  draw(b, ctx, t) {
    const A = b.act, G = this.geo(b), ph = b.phase || 1;
    if (ph === 3 && A !== 'gone') return;   // the halves are drawn with the floor tells (they move with Brady)
    const reaching = A === 'reach' || (A === 'hold' && ph === 1) || (A === 'back' && ph === 1);
    const kicking = A === 'kick' || (A === 'hold' && ph === 2) || (A === 'back' && ph === 2);
    const fade = A === 'gone' ? 1 - (b.fade || 0) : 1;
    this.clerk(ctx, G.home, b.floorY, b.h, t, { palm: A === 'palm', arm: reaching ? -1 : 0, heel: A === 'heel', a: fade });
  }
};
// the counter's lamps, slots and tells; the reach and the kick along the floor; the two halves; one line at a time on
// a pill under the boss bar
TourHooks.on('afterEntities', (play, ctx) => {
  const b = play.boss; if (!b || b.style !== 'shad_understudy' || b.remove || b.state !== 'fight') return;
  const G = brain.geo(b), A = b.act, t = b.t, fy = b.floorY, ph = b.phase || 1, k = 0.5 + 0.5 * Math.sin(t * 6), p = play.player;
  ctx.save();
  // the two clerks' lamps and their cones (L throws to the right, R to the left)
  SA.cone(ctx, G.L, fy - 2.6 * TS + 16, fy, 2.6 * TS, 0.7, 1); SA.cone(ctx, G.R, fy - 2.6 * TS + 16, fy, 2.6 * TS, 0.7, -1);
  const slot = (x, kind, lit, label) => {
    ctx.fillStyle = lit ? BUT_HI : SAL; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillRect(x - 26, fy - 22, 52, 22); ctx.strokeRect(x - 26, fy - 22, 52, 22);
    ctx.fillStyle = GRA_LO;
    if (kind === 'hand') { ctx.beginPath(); ctx.ellipse(x, fy - 9, 9, 7, 0, 0, TAU); ctx.fill(); for (let f = -2; f <= 1; f++) ctx.fillRect(x - 14 + (f + 2) * 0, fy - 13 + f * 3, 10, 2.5); }
    else if (kind === 'boot') { ctx.beginPath(); ctx.moveTo(x - 12, fy - 4); ctx.lineTo(x - 12, fy - 18); ctx.lineTo(x - 2, fy - 18); ctx.lineTo(x, fy - 10); ctx.lineTo(x + 18, fy - 6); ctx.lineTo(x + 18, fy - 4); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.ellipse(x, fy - 8, 14, 5, 0, 0, TAU); ctx.fill(); }
    if (label) { ctx.fillStyle = lit ? '#ffe08a' : 'rgba(255,253,242,0.95)'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(label, x, fy + 16); }
  };
  if (ph === 1) slot(G.hand, 'hand', A === 'hold' && b.lined, 'HAND');
  if (ph === 2) slot(G.boot, 'boot', A === 'hold' && b.lined, 'BOOT');
  // the tell lines: the reach along the skirting (a dashed line to Brady), the kick at ankle height
  if (A === 'palm' || A === 'heel') {
    const y = fy - (A === 'palm' ? 18 : 12); ctx.strokeStyle = 'rgba(255,253,242,0.95)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.lineDashOffset = t * 14;
    ctx.beginPath(); ctx.moveTo(G.home - 40, y); ctx.lineTo(b.tx, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = `rgba(255,120,90,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(b.tx, fy - 2, 22, 6, 0, 0, TAU); ctx.stroke();
  }
  // the reach: a long thin arm along the skirting and its flat palm
  if (ph === 1 && (A === 'reach' || A === 'hold' || A === 'back')) {
    const tip = lerp(G.home - 30, b.tx, b.ext || 0);
    ctx.fillStyle = GRA; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.fillRect(tip + 12, fy - 26, G.home - 36 - tip, 11); ctx.strokeRect(tip + 12, fy - 26, G.home - 36 - tip, 11);
    ctx.beginPath(); ctx.ellipse(tip, fy - 18, 16, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
    for (let f = 0; f < 4; f++) { ctx.beginPath(); ctx.ellipse(tip - 14, fy - 27 + f * 6, 8, 3, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    if (A === 'reach') { ctx.strokeStyle = BUT_HI; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(tip - 4, fy - 18, 22, 14, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = SAL; ctx.fillRect(tip + 20, fy - 26, 6, 11);
  }
  // the kick: a long flat leg along the floor and its pointed shoe
  if (ph === 2 && (A === 'kick' || A === 'hold' || A === 'back')) {
    const tip = lerp(G.home - 30, b.tx, b.ext || 0);
    ctx.fillStyle = GRA; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.fillRect(tip + 10, fy - 22, G.home - 30 - tip, 14); ctx.strokeRect(tip + 10, fy - 22, G.home - 30 - tip, 14);
    ctx.beginPath(); ctx.moveTo(tip + 12, fy - 24); ctx.lineTo(tip - 22, fy - 4); ctx.lineTo(tip + 14, fy - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (A === 'kick') { ctx.strokeStyle = BUT_HI; ctx.lineWidth = 3; ctx.stroke(); }
  }
  // the claim pulling the hand or the boot into its slot
  if (A === 'hold' && b.claimed) { const x = ph === 1 ? G.hand : G.boot; ctx.strokeStyle = `rgba(255,240,150,${0.6 + 0.4 * k})`; ctx.lineWidth = 5; ctx.strokeRect(x - 30, fy - 26, 60, 28); }
  // the prompt when lined up: cross the lamp (on a pill over the lamp, never over Brady)
  if (A === 'hold' && b.lined && !b.claimed) { const Lx = ph === 1 ? G.L : G.R; K.ShadArt && tag(ctx, Lx, fy - 3.4 * TS, ph === 1 ? 'CROSS THIS LAMP ▶' : '◀ CROSS THIS LAMP', '#ffe08a'); ctx.strokeStyle = `rgba(255,240,150,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.moveTo(Lx, fy - 2.9 * TS); ctx.lineTo(Lx, fy); ctx.stroke(); ctx.setLineDash([]); }
  // phase 3: the two foot slots, the two halves (their feet follow Brady between the lamps), the hats, the rush
  if (ph === 3) {
    const f = brain.halves(b), on = f ? [Math.abs(f[0] - G.feet[0]) < 16, Math.abs(f[1] - G.feet[1]) < 16] : [false, false];
    G.feet.forEach((x, i) => { slot(x, 'foot', on[i] || A === 'stamp', 'FEET'); if (on[i]) K.tick(ctx, x, fy - 40, 0.75); });
    let xs = f || [G.feet[0] + 2 * TS, G.feet[1] - 2 * TS];
    if (A === 'rush') { const q = Math.min(1, Math.max(0, b.at - 0.1) / 0.5); xs = [lerp(b.rushFrom[0], b.rushFrom[1], q), lerp(b.rushFrom[1], b.rushFrom[0], q)]; }
    if (A === 'stamp') xs = G.feet.slice();
    const hat = A === 'hats' ? Math.min(1, b.at / 0.4) * 24 : 0, flat = A === 'rush';
    xs.forEach((x, i) => {
      if (flat) { ctx.save(); ctx.fillStyle = GRA; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x, fy - 12, 40, 13, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = BUT_HI; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
      else brain.clerk(ctx, x, fy, b.h * 0.86, t, { half: i ? 1 : -1, hat, a: A === 'stamp' ? 1 - Math.min(1, b.at / 1.2) * 0.6 : 0.95 });
    });
    if (A === 'stamp') for (const x of G.feet) { ctx.fillStyle = '#c84a4a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.save(); ctx.translate(x, fy - 60); ctx.rotate(-0.2); ctx.fillRect(-30, -10, 60, 20); ctx.strokeRect(-30, -10, 60, 20); ctx.fillStyle = WHITE; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('CLAIMED', 0, 4); ctx.restore(); }
    if ((A === 'split' || A === 'hats') && p && !p.dead) { const inn = !!f; if (!inn) tag(ctx, (G.L + G.R) / 2, fy - 3.6 * TS, 'STAND BETWEEN THE LAMPS', '#ffe08a'); }
  }
  for (const x of [G.L, G.R]) SA.floorLamp(ctx, x, fy, 2.6 * TS, true, t);
  if (b.line) {
    const L = b.line, a = Math.min(1, (2.8 - L.t) * 3); if (a <= 0) b.line = null;
    else { ctx.save(); ctx.globalAlpha = a; ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const x = play.camX + Game.viewW / 2, y = play.camY + 74, w = ctx.measureText(L.text).width + 22; ctx.fillStyle = 'rgba(28,20,38,0.92)'; rr(ctx, x - w / 2, y - 11, w, 22, 11); ctx.fill(); ctx.fillStyle = L.col; ctx.fillText(L.text, x, y + 1); ctx.restore(); }
  }
  ctx.restore();
});
const tag = (ctx, x, y, str, col) => { ctx.save(); ctx.font = '10px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(str).width + 16; ctx.fillStyle = 'rgba(28,20,38,0.9)'; rr(ctx, x - w / 2, y - 10, w, 20, 10); ctx.fill(); ctx.fillStyle = col; ctx.fillText(str, x, y + 1); ctx.restore(); };
const boss = { id: 'shad_understudy', name: 'The Understudy', hp: 6, dims: [80, 150], music: 'tour_shad_boss', country: 'shad', brain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.shad_understudy = [60, 60, 60, 20];
// the counter: a bell and a parcel at the ends (the lamps and the slots are the boss's own)
Tour.pieces['shad.arena_counter'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o;
  B.decorAt('shadBell', x0 + 1, GY, 1); B.decorAt('shadCrate', x0 + w - 2, GY, 2);
};
Tour.shadKit.understudyBrain = brain;
})();
