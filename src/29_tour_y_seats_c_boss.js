/* ============================================================
   BELOW THE CHEAP SEATS: 33-6 JUST ONE MORE BOW, the lead-in and the boss.
   The lead-in (encore): an overenthusiastic actor (an empty tailcoat, the boss's understudy) struts up and down the
   stage taking bows. A gold applause paddle on its mark: THROW claps, and the coat stops and bows deeply wherever it
   stands. Clap while it stands over the open prop basket and it bows straight into it (flushed through the scenery):
   the way on opens. The last bow is so deep it only hears clapping from below the stage: its paddle is under the
   boards, straight under the basket.
   THE ENCORE COAT, a tailcoat with nobody inside, in front of the house curtain. Two open prop baskets on the stage,
   a gold applause paddle by each (on little risers), a trap down to the understage with a third paddle straight under
   the first basket. Touching the coat never hurts; its moves do. Two hits a phase.
   1 THE TAILS RISE (1 s) before a sweeping bow: it sweeps across the boards to where Brady stood when its tails rose
     and bows there. Stand by the first basket to lure it, hop up onto the paddle's riser while the tails rise (the
     sweep runs under it), then THROW at the paddle while it bows over the basket: the tails go in.
   2 ONE SLEEVE POINTS (1 s) before a cartwheel right across the stage (jump it, or wait on a riser). It ends by the
     basket on the side it pointed to and gets its breath; when that is the far basket, THROW at the far paddle.
   3 BOTH SLEEVES SPREAD (1.4 s) before the deep bow over the first basket: a gust sweeps the whole stage. Drop through
     the trap to the understage while the sleeves spread and THROW at the paddle straight under the basket. The coat
     folds itself neatly into it, and still reaches back for its flowers.
   ============================================================ */
(function () {
const SK = Tour.seatsKit, INK = SK.INK, SA = SK.SeatsArt;
const say = (g, b, text, col) => SK.say(g, b ? b.cx : 0, b ? b.y : 0, text, col || '#ffffff', 'boss');

/* ---------------- the coat itself (the boss and the lead-in's understudy) ---------------- */
// pose: 'stand' | 'tails' (tails raised) | 'bow' (k: 0..1 how deep) | 'point' (dir) | 'spread' | 'wheel' (spin)
function coat(ctx, x, y, s, pose, t, o) {
  o = o || {}; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
  if (pose === 'wheel') { ctx.translate(0, -40); ctx.rotate(o.spin || 0); ctx.translate(0, 40); }
  const bow = pose === 'bow' ? (o.k == null ? 1 : o.k) : 0, tails = pose === 'tails' ? 1 : pose === 'bow' ? 0.6 : 0.1;
  // the tails behind (rising before the sweep)
  ctx.fillStyle = SA.MUL_D;
  for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * 8, -30); ctx.rotate(d * 0.15 - tails * 1.3 * (d > 0 ? 1 : 0.8)); ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(4, 44); ctx.lineTo(-6, 40); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = SA.GOLD; ctx.fillRect(-6, 34, 10, 4); ctx.fillStyle = SA.MUL_D; ctx.restore(); }
  // the body: hinged at the waist for a bow
  ctx.save(); ctx.translate(0, -30); ctx.rotate(bow * 1.25);
  ctx.fillStyle = SA.MUL; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-24, -52); ctx.quadraticCurveTo(0, -64, 24, -52); ctx.lineTo(20, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  // the empty collar (nobody inside), the gold lapels and buttons
  ctx.fillStyle = '#1a0a14'; ctx.beginPath(); ctx.ellipse(0, -56, 14, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = SA.GOLD; ctx.beginPath(); ctx.moveTo(-12, -54); ctx.lineTo(-3, -24); ctx.lineTo(-10, -26); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(12, -54); ctx.lineTo(3, -24); ctx.lineTo(10, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const [bx, by] of [[-7, -16], [7, -16], [-7, -6], [7, -6]]) { ctx.beginPath(); ctx.arc(bx, by, 2.6, 0, TAU); ctx.fill(); ctx.stroke(); }
  // the sleeves with white gloves
  const arm = (d, a) => { ctx.save(); ctx.translate(d * 20, -46); ctx.rotate(a); ctx.fillStyle = SA.MUL; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(5, 34); ctx.lineTo(-5, 34); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff8ea'; ctx.beginPath(); ctx.ellipse(0, 40, 8, 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); };
  let aL = 0.25, aR = -0.25;
  if (pose === 'point') { if ((o.dir || 1) > 0) aR = -1.75; else aL = 1.75; }
  if (pose === 'spread' || pose === 'wheel') { aL = 1.9; aR = -1.9; }
  if (pose === 'bow') { aL = -0.6; aR = 0.9; }
  if (o.reach) aR = -2.6 + Math.sin(t * 6) * 0.2;
  arm(-1, aL); arm(1, aR);
  ctx.restore();
  ctx.restore();
}
// an open prop basket (a teal rope trunk, lid up), its centre at x on the floor y
function basket(ctx, x, y, t, hot, n) {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
  ctx.fillStyle = SA.TEAL_D; ctx.save(); ctx.translate(x + 34, y - 30); ctx.rotate(-0.25); rr(ctx, -4, -46, 10, 48, 3); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.fillStyle = SA.TEAL; rr(ctx, x - 34, y - 34, 68, 34, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a0a14'; ctx.fillRect(x - 28, y - 32, 56, 8);
  for (const cx of [x - 34, x + 34 - 8]) { ctx.fillStyle = SA.RUST; ctx.fillRect(cx, y - 34, 8, 8); ctx.fillRect(cx, y - 8, 8, 8); }
  ctx.strokeStyle = SA.CREAM; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 20, y - 18); ctx.quadraticCurveTo(x, y - 6, x + 20, y - 18); ctx.stroke();
  if (n) { ctx.fillStyle = SA.MUL_D; for (let k = 0; k < Math.min(3, n); k++) { ctx.beginPath(); ctx.moveTo(x - 18 + k * 12, y - 32); ctx.lineTo(x - 12 + k * 12, y - 46); ctx.lineTo(x - 6 + k * 12, y - 32); ctx.fill(); } }
  if (hot) { const k = 0.5 + 0.5 * Math.sin(t * 8); ctx.strokeStyle = `rgba(255,216,74,${0.5 + 0.5 * k})`; ctx.lineWidth = 3; ctx.strokeRect(x - 38, y - 38, 76, 40); }
  ctx.restore();
}
// a gold applause paddle on a stick (two flat hands that clap)
function paddle(ctx, x, y, t, clapT, hot) {
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x - 2, y - 40, 4, 40); ctx.strokeRect(x - 2, y - 40, 4, 40);
  const c = clapT > 0 ? Math.abs(Math.sin(clapT * 20)) : 0.6;
  for (const d of [-1, 1]) { ctx.save(); ctx.translate(x, y - 44); ctx.rotate(d * c * 0.5); ctx.fillStyle = SA.GOLD; ctx.beginPath(); ctx.ellipse(d * 7, -8, 7, 11, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  if (clapT > 0) { ctx.strokeStyle = '#ffe68a'; ctx.lineWidth = 2.5; for (const a of [-0.6, 0, 0.6]) { ctx.beginPath(); ctx.moveTo(x + Math.sin(a) * 20, y - 64 - Math.cos(a) * 6); ctx.lineTo(x + Math.sin(a) * 30, y - 72 - Math.cos(a) * 10); ctx.stroke(); } }
  ctx.restore();
}
Object.assign(SK, { coatArt: coat, basketArt: basket, paddleArt: paddle });

/* ================= the lead-in: the understudy and its baskets ================= */
// { x0, x1 (px: where it struts), sp, basket (px), gy (the floor), id (the lock it opens), low (only hears from below) }
class SeatsActor extends Ent {
  constructor(g, s) { super(g, s, 50, 90); Object.assign(this, { x0: s.x0, x1: s.x1, sp: s.sp || 1.2 * TS, bx: s.bx, gy: s.gy, id: s.id, low: !!s.low }); this.px = s.x0 + 20; this.d = 1; this.bowT = 0; this.gone = false; this.fallT = 0; this.friendly = true; this.back = true; this.place(); }
  place() { this.x = this.px - this.w / 2; this.y = this.gy * TS - this.h - (this.fallT * 60); }
  over() { return Math.abs(this.px - this.bx) < 0.7 * TS; }
  clap(fromBelow) {
    if (this.gone || this.bowT > 0) return;
    if (this.low && !fromBelow) { SK.say(this.g, this.px, this.y - 10, 'WHAT? I CAN\'T HEAR YOU UP THERE!', '#ffffff'); return; }
    this.bowT = 1.3; Sound.play('select', { vol: 0.5, pitch: 1.3 });
    if (this.over()) { this.px = this.bx; this.gone = true; SK.say(this.g, this.bx, this.y - 10, 'THANK YOU, YOU\'RE TOO KIND...', '#ffffff'); }
    else SK.say(this.g, this.px, this.y - 10, pick(['THANK YOU! THANK YOU!', 'ONE MORE!', 'YOU ARE TOO KIND!']), '#ffffff');
  }
  update(dt) {
    this.t += dt;
    if (this.gone) { this.fallT = Math.min(1.5, this.fallT + dt * (this.bowT > 0.6 ? 0 : 1.6)); this.bowT = Math.max(0, this.bowT - dt); if (this.fallT >= 1.5 && !this.opened) { this.opened = true; this.g.keys.add(this.id); this.g.burst(this.bx, this.gy * TS - 20, 16, SA.GOLD, 'confetti'); } this.place(); return; }
    if (this.bowT > 0) { this.bowT -= dt; this.place(); return; }
    this.px += this.d * this.sp * dt; if (this.px > this.x1) { this.px = this.x1; this.d = -1; } if (this.px < this.x0) { this.px = this.x0; this.d = 1; }
    this.place();
  }
  touchPlayer() {}
  draw(ctx) {
    if (this.fallT >= 1.5) return;
    const y = this.gy * TS + this.fallT * 60, k = this.bowT > 0 ? Math.sin(Math.min(1, (1.3 - this.bowT) / 0.4) * Math.PI / 2) : 0;
    ctx.save(); if (this.gone) { ctx.beginPath(); ctx.rect(this.bx - 200, 0, 400, this.gy * TS - 30); ctx.clip(); }
    coat(ctx, this.px, y, 0.95, k > 0 ? 'bow' : 'stand', this.t, { k });
    ctx.restore();
  }
}
// the lead-in's basket (drawn), its lock (a curtain beyond it) and its paddle (a mark): { bx (px), gy, actor }
class SeatsLeadPaddle extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.friendly = true; this.back = true; this.seatsProp = true; this.below = !!s.below; this.aid = s.aid; this.clapT = 0; }
  actor() { return this.g.entities.find(e => e instanceof SeatsActor && e.id === this.aid); }
  seatsTouch(p) { const a = this.actor(); return !!a && !a.gone && SK.onMark(p, this.tx, this.fy, 0.8); }
  seatsInput(p, inp) { if (inp.actionPressed) { this.clapT = 0.5; TourKit.sfx('clap', 'kick', { vol: 0.5, pitch: 1.6 }); const a = this.actor(); if (a) a.clap(this.below); } }
  update(dt) { this.t += dt; if (this.clapT > 0) this.clapT -= dt; }
  touchPlayer() {}
  draw(ctx) {
    const p = this.g.player, hot = p && this.seatsTouch(p), a = this.actor();
    paddle(ctx, this.cx - 18, this.fy * TS, this.t, this.clapT, hot);
    if (a && !a.gone) { SA.ring(ctx, this.cx, this.fy * TS, this.t, hot, 17); if (hot) SA.cue(ctx, this.cx, this.fy * TS - 2.8 * TS, this.t, 'THROW: APPLAUD'); }
  }
}
class SeatsLeadBasket extends Ent {
  constructor(g, s) { super(g, s, 2 * TS, TS); this.bx = s.bx; this.gy = s.gy; this.aid = s.aid; this.back = true; this.x = this.bx - TS; this.y = (this.gy - 1) * TS; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) { const a = this.g.entities.find(e => e instanceof SeatsActor && e.id === this.aid); basket(ctx, this.bx, this.gy * TS, this.t, a && !a.gone && a.over(), a && a.gone ? 1 : 0); }
}
class SeatsLeadCurtain extends ENTITY_TYPES.lock {
  update(dt) { super.update(dt); if (!this.open && this.g.keys.has(this.id) && this.g.player) this.touchPlayer(this.g.player); }
  touchPlayer(p) { if (this.open) return; if (this.g.keys.has(this.id)) return super.touchPlayer(p); if (this.msgT <= 0) { this.msgT = 2.5; SK.say(this.g, this.cx, this.y - 10, 'THE ACTOR WON\'T GET OFF!', '#ffd84a'); } }
  draw(ctx) { const k = this.open ? clamp(1 - (this.openT || 0) / 0.6, 0, 1) : 0, x = this.x + 2, y = this.y - k * this.h, w = TS + 8, h = this.h; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = SA.MUL; rr(ctx, x, y, w, h, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = SA.MUL_D; for (let xx = x + 6; xx < x + w; xx += 10) ctx.fillRect(xx, y + 4, 3, h - 8); ctx.fillStyle = SA.GOLD; ctx.fillRect(x, y + h - 8, w, 6); ctx.restore(); }
}
Object.assign(ENTITY_TYPES, { seatsActor: SeatsActor, seatsLeadPaddle: SeatsLeadPaddle, seatsLeadBasket: SeatsLeadBasket, seatsLeadCurtain: SeatsLeadCurtain });
let aN = 0;
Object.assign(Tour.pieces, {
  // an encore scene: the letter is the basket's centre on the floor row; { strut: [dx0, dx1], sp, paddle: dx (on the
  // floor) or below: [dx, dy] (under the boards), gate: dx (the curtain beyond), h }
  'seats.encore'(st, o) {
    const B = st.B, x = st.x, gy = st.gy, id = 'seats:encore' + (++aN), bx = (x + 0.5) * TS;
    B.spawn('seatsActor', x, gy - 1, { x0: (x + o.strut[0]) * TS, x1: (x + o.strut[1]) * TS, sp: (o.sp || 1.2) * TS, bx, gy, id, low: !!o.below });
    B.spawn('seatsLeadBasket', x, gy - 1, { bx, gy, aid: id });
    if (o.below) B.spawn('seatsLeadPaddle', x + o.below[0], gy - 1 + o.below[1], { aid: id, below: true });
    else B.spawn('seatsLeadPaddle', x + o.paddle, gy - 1, { aid: id });
    const pk = o.below ? [x + o.below[0], gy - 1 + o.below[1]] : [x + o.paddle, gy - 1];
    B.vkey(id, [pk], 'any');
    const gx = x + o.gate, n = B.spawns.length; B.lock(gx, gy - (o.h || 6), gy - 1, id, 'door'); for (let k = n; k < B.spawns.length; k++) if (B.spawns[k].type === 'lock') B.spawns[k].type = 'seatsLeadCurtain';
    return st.x;
  }
});

/* ================= the arena: the stage in front of the house curtain ================= */
// columns from the arena's left (all between the stick and the buttons): basket 1 round 11 (its riser and paddle at
// 7-8), the trap at 13-14 down to the understage (rows GY+1..GY+2 from 7 to 14, its paddle at 10 straight under basket
// 1), basket 2 round 17 (its riser and the far paddle at 18-19)
const AR = { b1: 11, r1: [7, 8], trap: [13, 14], und: [7, 14], up: 10, b2: 17, r2: [18, 19] };
Tour.pieces['seats.arena_encore'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o;
  for (const x of AR.r1) B.set(x0 + x, GY - 2, T.SEMI);
  for (const x of AR.r2) B.set(x0 + x, GY - 2, T.SEMI);
  for (let x = AR.und[0]; x <= AR.und[1]; x++) for (let y = GY + 1; y <= GY + 2; y++) B.set(x0 + x, y, T.EMPTY);
  for (const x of AR.trap) B.set(x0 + x, GY, T.EMPTY);
};

const LINES1 = ['ANOTHER BOW? IF YOU INSIST!', 'THE TAILS, DARLING, THE TAILS!', 'FROM THE TOP!'];
const brain = {
  phases: [4, 2],
  guardText: 'NOBODY HOME!',
  wake(b) {
    b.phase = 1; const x0 = b.arenaX0 / TS; b.X = k => (x0 + k) * TS; b.fy = b.floorY;
    b.b1 = b.X(AR.b1); b.b2 = b.X(AR.b2) ; b.px = b.X(AR.b2 - 3); b.dir = -1; b.in = [0, 0]; b.clapT = [0, 0, 0];
    say(b.g, b, 'LADIES, GENTLEMEN, OWLS... MY ENCORE!', '#ffffff');
    b.go('idle');
  },
  phase(b, n) {
    const g = b.g; b.go('idle'); b.at = -1.2;
    if (n === 2) { g.bannerText = 'THE CARTWHEEL'; g.bannerT = 1.8; say(g, b, 'WATCH THE SLEEVE, DARLING.', '#ffffff'); }
    if (n === 3) { g.bannerText = 'THE DEEP BOW'; g.bannerT = 1.8; say(g, b, 'AND NOW... THE DEEPEST BOW!', '#ffffff'); }
  },
  hurt(b) { b.go('idle'); },
  touch(b, p) { return true; },   // touching the coat never hurts (its sweep, cartwheel and gust do)
  hit(b, kind) { if (kind === 'stomp' || kind === 'spin') return 'bounce'; return false; },
  lastHit(b) { say(b.g, b, 'FOLDED NEATLY. BUT... MY FLOWERS?', '#ffd84a'); b.folded = true; return false; },
  // THROW at a paddle: 0 by basket 1, 1 the far one, 2 under the boards
  clap(b, k) {
    b.clapT[k] = 0.5; TourKit.sfx('clap', 'kick', { vol: 0.6, pitch: 1.6 });
    const ph = b.phase || 1, g = b.g;
    if (b.act !== 'bow') { if (!(b.saidT > 0)) { say(g, b, pick(['NOT YET! I HAVEN\'T BOWED!', 'HOLD YOUR APPLAUSE!']), '#ffffff'); b.saidT = 1.5; } return; }
    const atB1 = Math.abs(b.px - b.b1) < 1.0 * TS, atB2 = Math.abs(b.px - b.b2) < 1.0 * TS;
    const ok = ph === 1 ? (k === 0 && atB1) : ph === 2 ? (k === 1 && atB2) : (k === 2 && atB1);
    if (!ok) { if (!(b.saidT > 0)) { say(g, b, ph === 3 && k !== 2 ? 'I CAN ONLY HEAR YOU FROM BELOW!' : 'THANK YOU! (NOT IN A BASKET)', '#ffffff'); b.saidT = 1.5; } return; }
    b.in[atB1 ? 0 : 1]++; g.burst(atB1 ? b.b1 : b.b2, b.fy - TS, 16, SA.GOLD, 'confetti'); g.shake(4);
    b.go('dunk'); b.damage(1, { quiet: true });
  },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1, fy = b.fy || b.floorY;
    b.guard = 'bounce';
    if (!b.X) this.wake(b);
    for (let k = 0; k < 3; k++) if (b.clapT[k] > 0) b.clapT[k] -= dt;
    if (b.saidT > 0) b.saidT -= dt;
    // its body box follows it (drawn standing on the boards; the bar above it)
    b.x = b.px - b.w / 2; b.y = fy - b.h;
    if (b.folded) { b.px = approach(b.px, b.b1, 3 * TS * dt); return; }
    const A = b.act;
    if (A === 'walk') return b.go('idle');
    if (A === 'idle') {
      // it struts a little to and fro between moves (to the first basket before a deep bow)
      const home = ph === 3 ? b.b1 : b.X(AR.b2 - 4), d = home - b.px; if (Math.abs(d) > 4) { b.px += Math.sign(d) * Math.min(Math.abs(d), 2.2 * TS * dt); b.dir = Math.sign(d); }
      if (b.at > (ph === 3 ? 1.6 : 1.3) && (ph !== 3 || Math.abs(d) <= 4)) b.go('tell');
      return;
    }
    if (A === 'tell') {
      if (b.first) {
        if (ph === 1) { b.target = clamp(p ? p.cx : b.b1, b.X(3), b.X(25)); say(g, b, pick(LINES1), '#ffffff'); }
        else if (ph === 2) { b.wdir = b.wdir === 1 ? -1 : 1; if (b.cw && b.cw % 3 === 2) b.wdir = 1; b.cw = (b.cw || 0) + 1; say(g, b, b.wdir > 0 ? 'THAT WAY! A CARTWHEEL!' : 'THIS WAY! A CARTWHEEL!', '#ffffff'); }
        else say(g, b, 'ARMS WIDE... AND...', '#ffffff');
        TourKit.sfx('ahem', 'select', { vol: 0.4, pitch: 0.6 });
      }
      const T = ph === 3 ? 1.4 : 1.0;
      if (b.at >= T) { b.sx = b.px; b.go('move'); if (ph === 3) { g.shake(8); TourKit.sfx('gust', 'powerdown', { vol: 0.5 }); } }
      return;
    }
    if (A === 'move') {
      if (ph === 1) {
        // the sweeping bow: low tails sweep along the boards to the target
        const dur = 0.7, k = Math.min(1, b.at / dur); b.px = lerp(b.sx, b.target, k); b.dir = Math.sign(b.target - b.sx) || b.dir;
        const box = { x: b.px - 46, y: fy - 1.3 * TS, w: 92, h: 1.3 * TS };
        if (p && !p.dead && overlap(p, box)) p.hurt(box);
        if (k >= 1) b.go('bow');
      } else if (ph === 2) {
        // the cartwheel: right across the stage the way the sleeve pointed, ending by that side's basket
        const to = b.wdir > 0 ? b.b2 : b.b1 - 1.2 * TS, dur = 1.1, k = Math.min(1, b.at / dur);
        if (b.first) b.from = b.wdir > 0 ? b.X(4) : b.X(24);
        b.px = lerp(b.from, to, k); b.spin = k * TAU * 2 * b.wdir;
        const box = { x: b.px - 30, y: fy - 1.6 * TS, w: 60, h: 1.6 * TS };
        if (p && !p.dead && overlap(p, box)) p.hurt(box);
        if (k >= 1) { b.spin = 0; b.go('bow'); }
      } else {
        // the deep bow's gust: anyone on the stage (above the boards) is blown over
        const k = b.at;
        if (k < 0.35 && p && !p.dead && p.y + p.h <= fy + 4 && p.cx > b.arenaX0 && p.cx < b.arenaX1) p.hurt({ x: p.x - 10, w: p.w + 20 });
        if (k >= 0.35) b.go('bow');
      }
      return;
    }
    if (A === 'bow') {
      // it holds its bow (deep in phase 3); the basket under it pulses; then it straightens and struts on
      const hold = ph === 1 ? 1.7 : ph === 2 ? 1.9 : 2.2;
      if (b.at > hold) { say(g, b, ph === 3 ? 'NOBODY CLAPPED BELOW? ONE MORE!' : 'TOO SLOW! AGAIN!', '#ffffff'); b.go('idle'); }
      return;
    }
    if (A === 'dunk') {
      // into the basket, a moment, and out again
      if (b.at > 1.2) { say(g, b, 'I\'M BACK! THEY LOVE ME!', '#ffffff'); b.go('idle'); }
      return;
    }
    b.go('idle');
  },
  draw(b, ctx, t) {}
};
// the coat, the baskets, the paddles and the tells, in the world over the stage
TourHooks.on('afterEntities', (play, ctx) => {
  const b = play.boss; if (!b || b.style !== 'seats_encore' || b.remove || !b.X) return;
  const fy = b.fy, t = play.t, ph = b.phase || 1, p = play.player, A = b.act;
  // the baskets and paddles (their risers are tiles), the understage paddle and the trap's lip
  basket(ctx, b.b1, fy, t, A === 'bow' && Math.abs(b.px - b.b1) < TS && ph !== 2, b.in[0]);
  basket(ctx, b.b2, fy, t, A === 'bow' && Math.abs(b.px - b.b2) < TS && ph === 2, b.in[1]);
  const pads = [[b.X(AR.r1[0] + 1), fy - 2 * TS, 0], [b.X(AR.r2[0] + 1), fy - 2 * TS, 1], [b.X(AR.up) + TS / 2, fy + 3 * TS, 2]];
  for (const [x, y, k] of pads) { const on = p && SK.onMark(p, Math.floor(x / TS), y / TS, 0.8); paddle(ctx, x - 16, y, t, b.clapT[k], on); SA.ring(ctx, x, y, t, on && A === 'bow', 15); if (on && A === 'bow') SA.cue(ctx, x, y - 2.8 * TS, t, 'THROW: APPLAUD'); }
  ctx.save(); ctx.fillStyle = 'rgba(20,8,14,0.6)'; ctx.fillRect(b.X(AR.trap[0]), fy, 2 * TS, 8); ctx.restore();
  // the tells: the sweep's lane, the cartwheel's lane, the gust (the whole stage) with the safe trap glowing
  if (A === 'tell') {
    const k = Math.min(1, b.at / (ph === 3 ? 1.4 : 1.0));
    ctx.save();
    if (ph === 1) { const x0 = Math.min(b.px, b.target), x1 = Math.max(b.px, b.target); ctx.fillStyle = `rgba(255,90,110,${0.12 + 0.2 * k})`; ctx.fillRect(x0 - 46, fy - 1.3 * TS, x1 - x0 + 92, 1.3 * TS); ctx.strokeStyle = '#ffd84a'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.target, fy - 3 * TS); ctx.lineTo(b.target, fy); ctx.stroke(); }
    if (ph === 2) { ctx.fillStyle = `rgba(255,90,110,${0.12 + 0.2 * k})`; ctx.fillRect(b.arenaX0, fy - 1.6 * TS, b.arenaX1 - b.arenaX0, 1.6 * TS); SA.pill(ctx, b.px + (b.wdir || 1) * 80, fy - 4 * TS, (b.wdir || 1) > 0 ? 'CARTWHEEL  >>>' : '<<<  CARTWHEEL', '#ffd84a'); }
    if (ph === 3) { ctx.fillStyle = `rgba(255,90,110,${0.1 + 0.18 * k})`; ctx.fillRect(b.arenaX0, fy - 6 * TS, b.arenaX1 - b.arenaX0, 6 * TS); ctx.fillStyle = `rgba(154,255,138,${0.3 + 0.3 * Math.sin(t * 10)})`; ctx.fillRect(b.X(AR.trap[0]), fy - 6, 2 * TS, 10); SA.pill(ctx, b.X(AR.trap[0]) + TS, fy - 2.4 * TS, 'DOWN BELOW!', '#9aff8a'); }
    ctx.restore();
  }
  if (A === 'move' && ph === 3) { ctx.save(); ctx.fillStyle = `rgba(255,240,200,${0.4 * (1 - b.at / 0.35)})`; ctx.fillRect(b.arenaX0, fy - 6 * TS, b.arenaX1 - b.arenaX0, 6 * TS); ctx.restore(); }
  // the coat
  const pose = b.folded ? 'bow' : A === 'tell' ? (ph === 1 ? 'tails' : ph === 2 ? 'point' : 'spread') : A === 'move' ? (ph === 2 ? 'wheel' : ph === 1 ? 'bow' : 'bow') : A === 'bow' ? 'bow' : 'stand';
  const dunk = A === 'dunk' ? Math.sin(Math.min(1, b.at / 1.2) * Math.PI) : b.folded ? 1 : 0;
  ctx.save(); if (dunk > 0) { ctx.beginPath(); ctx.rect(b.arenaX0, 0, b.arenaX1 - b.arenaX0, fy - 30); ctx.clip(); }
  coat(ctx, b.px, fy + dunk * 80, 1.15, pose, t, { k: A === 'move' && ph === 1 ? 0.6 : 1, dir: b.wdir, spin: b.spin, reach: b.folded });
  ctx.restore();
});
// the paddles: Brady's THROW on one of the three marks (a prop like every Cheap Seats prop)
class SeatsPaddleMark extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.seatsProp = true; this.friendly = true; this.back = true; }
  update(dt) { this.t += dt; }
  which(p) { const b = this.g.boss; if (!b || b.style !== 'seats_encore' || !b.X || b.state !== 'fight') return -1; const fy = b.fy; const L = [[AR.r1[0] + 1, fy / TS - 2], [AR.r2[0] + 1, fy / TS - 2], [AR.up, fy / TS + 3]]; for (let k = 0; k < 3; k++) if (SK.onMark(p, b.arenaX0 / TS + L[k][0], L[k][1], 0.8)) return k; return -1; }
  seatsTouch(p) { return this.which(p) >= 0; }
  seatsInput(p, inp) { if (!inp.actionPressed) return; const k = this.which(p); if (k >= 0) brain.clap(this.g.boss, k); }
  touchPlayer() {}
  draw() {}
}
ENTITY_TYPES.seatsPaddleMark = SeatsPaddleMark;
{
  const up0 = brain.update;
  brain.update = function (b, dt) { if (!b.g.entities.some(e => e instanceof SeatsPaddleMark)) b.g.spawn(new SeatsPaddleMark(b.g, { x: b.cx, y: b.floorY })); return up0.call(this, b, dt); };
}
const boss = { id: 'seats_encore', name: 'The Encore Coat', hp: 6, dims: [70, 100], floats: true, music: 'tour_seats_boss', country: 'seats', brain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.seats_encore = [20, 20, 20, 20];
Object.assign(TourLandscape.ARCH_LABEL, { encore: 'ENCORE' });
Tour.seatsKit.encore = brain; Tour.seatsKit.AR = AR;
// the arena's camera: three rows lower than usual, so the understage and its paddle are in view
{
  const ct0 = Play.prototype.camTargetY;
  Play.prototype.camTargetY = function (snap) { const v = ct0.call(this, snap), b = this.boss; if (b && b.style === 'seats_encore' && this.area && this.area.role === 'arena') return clamp(v + 3 * TS, 0, Math.max(0, this.area.H * TS - Game.viewH)); return v; };
}
})();
