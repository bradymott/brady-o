/* ============================================================
   THE MOON: the headliner, MADAME MOO (18-5), the cow who jumped over the moon. Piwi booked her for the last
   tour date months ago and nobody cancelled. She has been warming up on the lunar stage for weeks, in her sequined
   cape and her golden bell, and she is in a mood. The stage is a crater floor under a big prop crescent moon.
   Three real phases, each with its own tells:
   1 THE BIG JUMP     she paws and lowers her head (0.9 s), a shadow marks where she'll land; she jumps sky-high
                      over the crescent and comes down on it: a shockwave runs both ways (jump it). Her hooves sink
                      in the moon dust: STUCK, stomp her head.
   2 THE MILKY WAY    the stage's gravity generator cuts out (Brady floats, the big jumps reach the rafters). She
                      floats too: she snorts (red eyes, 0.8 s) and charges horns first across the stage; miss her
                      and she rams the wall: DIZZY, stomp her. Between charges, a big jump again.
   3 THE GRAND FINALE gravity back on; two jumps in a row, faster; golf balls rain on target rings; her MOO rolls
                      across the stage as a ring of sound at head height (jump it). After the second landing she is
                      STUCK again.
   Six stomps. At the end she takes a bow, jumps over the moon one last time and is gone.
   ============================================================ */
(function () {
const MK = Tour.moonKit, INK = MK.INK, K = TourKit;
const MOO = { lowG: 0.24, stageG: MK.MOON_G || 0.55 };
const moos = ['MOOO!', 'ENCORE!', 'MOO-VE OVER!', 'THE SHOW MUST GO ON!'];
const ringArt = (c, s) => { c.save(); c.strokeStyle = 'rgba(255,170,220,0.95)'; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(s.x + s.w / 2 - s.vx * 0.012 * k, s.y + s.h / 2, 10 + k * 5, -0.9, 0.9); if (s.vx < 0) { c.beginPath(); c.arc(s.x + s.w / 2 + k * 4, s.y + s.h / 2, 10 + k * 5, Math.PI - 0.9, Math.PI + 0.9); } c.stroke(); } c.fillStyle = '#ffd8f0'; c.font = TourBackstage.F8; c.textAlign = 'center'; c.fillText('MOO', s.x + s.w / 2, s.y - 4); c.restore(); };
const waveArt = (c, s) => { c.save(); c.fillStyle = 'rgba(236,232,246,0.9)'; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(s.x, s.y + s.h); c.quadraticCurveTo(s.x + s.w / 2, s.y - 8, s.x + s.w, s.y + s.h); c.closePath(); c.fill(); c.stroke(); c.restore(); };
const brain = {
  phases: [4, 2],
  guardText: 'MOO-T!',
  wake(b) { b.tall = true; b.phase = 1; K.say(b.g, b, 'FINALLY! AN AUDIENCE! MOOO!', '#ffd8f0'); b.homeX = b.x; },
  setG(b, g) { const A = b.g.area; if (A) A.gravity = g; },
  phase(b, n) {
    const g = b.g;
    if (n === 2) { g.bannerText = 'THE MILKY WAY!'; g.bannerT = 2.2; K.say(g, b, 'CUT THE GRAVITY! I FLOAT BETTER!', '#ffd8f0'); this.setG(b, MOO.lowG); }
    if (n === 3) { g.bannerText = 'THE GRAND FINALE!'; g.bannerT = 2.2; K.say(g, b, 'GRAVITY BACK ON! ONE MORE TIME, WITH FEELING!', '#ffd8f0'); this.setG(b, MOO.stageG); }
    b.go('recover');
  },
  hurt(b) { K.say(b.g, b, pick(['MY CAPE!', 'NOT THE BELL!', 'I NEED A MOO-MENT!', 'HOW DARE MOO!']), '#ffd8f0'); b.go('recover'); },
  lastHit(b) { this.setG(b, MOO.stageG); return false; },
  // the floor under Brady (where the shadow goes): his x, kept on the stage
  target(b) { const p = b.g.player; return clamp(p ? p.cx : (b.arenaX0 + b.arenaX1) / 2, b.arenaX0 + b.w / 2 + 8, b.arenaX1 - b.w / 2 - 8); },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1;
    b.guard = 'bounce';
    if (b.act === 'walk') b.go('trot');
    if (b.act === 'trot') {
      b.pose = 'walk'; b.face(); b.walk(ph >= 3 ? 2.2 : 1.6); this.ground(b, dt);
      if (b.at > (ph >= 3 ? 0.8 : 1.3)) { b.cycle++; b.go(ph === 2 ? (b.cycle % 2 ? 'snort' : 'crouch') : 'crouch'); }
    } else if (b.act === 'recover') {
      // after a hit (or a phase change): she shakes it off and gets her feet back under her
      b.pose = 'walk'; b.vx = 0; this.ground(b, dt); if (b.at > 1.0) b.go('trot');
    } else if (b.act === 'crouch') {
      // the tell: she paws the dust, lowers her head; the shadow appears where she will come down
      b.pose = 'crouch'; b.vx = 0; this.ground(b, dt);
      if (b.first) { b.tx = this.target(b); b.jumps = b.jumps || 0; K.say(g, b, pick(moos), '#ffd8f0'); TourKit.sfx('moo', 'bump', { vol: 0.5, pitch: 0.5 }); }
      if (Math.random() < 0.3) g.burst(b.cx + b.dir * 20, b.y + b.h, 1, '#e8e2f2', 'dust');
      if (b.at > (ph >= 3 ? 0.65 : 0.9)) { b.go('leap'); b.vy = -26 * TS; b.sx = b.cx; Sound.play('spring', { pitch: 0.6, vol: 0.6 }); g.shake(3); }
    } else if (b.act === 'leap') {
      // up, up and over the moon; then down onto the shadow (the time aloft is fixed, so the shadow is honest)
      b.pose = 'jump'; const T = ph >= 3 ? 1.3 : ph === 2 ? 2.0 : 1.6, k = Math.min(1, b.at / T);
      const h = (ph === 2 ? 12 : 9) * TS, top = b.floorY - b.h;
      b.x = lerp(b.sx, b.tx, k) - b.w / 2; b.y = top - Math.sin(k * Math.PI) * h;
      if (k >= 1) { b.y = top; this.land(b); }
    } else if (b.act === 'stuck') {
      // hooves sunk in the dust up to her knees: the weak spot is open (her head)
      b.pose = 'stuck'; b.vuln = true; b.vx = 0;
      if (b.first) K.say(g, b, pick(['MY HOOVES!', 'STUCK IN THE DUST!', 'A LITTLE HELP?']), '#ffe28a');
      if (b.at > (ph >= 3 ? 1.6 : 2.0)) { b.vuln = false; b.go('trot'); }
    } else if (b.act === 'snort') {
      // phase 2's tell: she snorts, her eyes go red, steam; then she charges horns first through the air
      b.pose = 'snort'; b.vx = 0;
      if (b.first) { b.face(); K.say(g, b, 'SNORT!', '#ff8a8a'); TourKit.sfx('snort', 'bump', { vol: 0.5, pitch: 0.4 }); }
      this.ground(b, dt);
      if (b.at > 0.8) { b.go('charge'); b.cdir = b.dir; b.cy0 = p ? clamp(p.y + p.h - b.h, b.floorY - 6 * TS, b.floorY - b.h) : b.floorY - b.h; }
    } else if (b.act === 'charge') {
      b.pose = 'charge'; b.dir = b.cdir; b.x += b.cdir * 7.5 * TS * dt; b.y = approach(b.y, b.cy0, 3 * TS * dt);
      if (Math.random() < 0.5) g.burst(b.cx - b.cdir * 30, b.cy, 1, '#ffffff', 'dust');
      if ((b.cdir > 0 && b.x + b.w >= b.arenaX1 - 2) || (b.cdir < 0 && b.x <= b.arenaX0 + 2)) { g.shake(8); Sound.play('stomp', { pitch: 0.4 }); g.burst(b.cdir > 0 ? b.x + b.w : b.x, b.cy, 14, '#ffd84a', 'spark'); b.go('dizzy'); }
    } else if (b.act === 'dizzy') {
      // she rammed the wall: she floats down, dizzy: stomp her
      b.pose = 'dizzy'; b.vuln = true; this.ground(b, dt);
      if (b.first) K.say(g, b, 'SO MANY STARS... AND THE MOON...', '#ffe28a');
      if (b.at > 2.2) { b.vuln = false; b.go('trot'); }
    } else b.go('trot');
    // phase 3's extras: golf balls on target rings and the MOO ring across the stage
    if (ph >= 3 && b.act !== 'recover') {
      b.rainT = (b.rainT || 0) - dt;
      if (b.rainT <= 0) { b.rainT = 2.6; const x = p ? clamp(p.cx + (Math.random() - 0.5) * 6 * TS, b.arenaX0 + TS, b.arenaX1 - TS) : b.cx; g.spawn(new RainSpot(g, x, b.floorY)); }
    }
    b.clampArena();
  },
  // walking on the floor in whatever gravity the stage has now
  ground(b, dt) { const A = b.g.area, gm = (A && A.gravity) || 1; b.vy = Math.min((b.vy || 0) + PHYS.gDown * gm * dt, PHYS.maxFall); b.y += b.vy * dt; if (b.y + b.h >= b.floorY) { b.y = b.floorY - b.h; b.vy = 0; } b.x += (b.vx || 0) * dt; },
  land(b) {
    const g = b.g, ph = b.phase || 1;
    g.shake(9); Sound.play('stomp', { pitch: 0.45 }); g.burst(b.cx, b.floorY, 20, '#ece8f2', 'dust');
    for (const d of [-1, 1]) tourFire(g, b.cx + d * (b.w / 2 + 6), b.floorY - 12, { vx: d * (ph >= 3 ? 7 : 5.5) * TS, w: 26, h: 22, ground: true, life: 3, col: '#ece8f2', art: waveArt });
    if (ph >= 3) {
      b.jumps = (b.jumps || 0) + 1;
      // the MOO: a ring of sound rolling across the stage at head height
      const p = g.player, d = p && p.cx < b.cx ? -1 : 1;
      tourFire(g, b.cx + d * 30, b.floorY - 2.2 * TS, { vx: d * 6 * TS, w: 30, h: 34, life: 3.2, thru: true, col: '#ffb8e0', art: ringArt });
      if (b.jumps % 2 === 1) { b.go('crouch'); return; }
    }
    b.go('stuck');
  },
  draw(b, ctx, t) {
    const P = b.pose, d = b.dir || 1, x = b.cx, y = b.y + b.h;
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    const sink = P === 'stuck' ? 14 : 0, crouch = P === 'crouch' ? 6 : 0, lean = P === 'charge' ? 0.25 : P === 'jump' ? -0.15 : 0;
    if (P === 'dizzy') ctx.rotate(Math.sin(t * 6) * 0.12);
    ctx.scale(d, 1); ctx.rotate(lean);
    // the cape behind her, flapping
    ctx.fillStyle = '#c83a8a'; ctx.beginPath(); ctx.moveTo(-10, -52 + crouch); ctx.quadraticCurveTo(-44, -60 + Math.sin(t * 5) * 6, -52, -24 + Math.sin(t * 4) * 4); ctx.lineTo(-30, -26); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-24 - k * 6, -44 + k * 5, 1.8, 0, TAU); ctx.fill(); }
    // legs (tucked up in a jump, sunk in the dust when stuck)
    ctx.fillStyle = '#f6f2ea';
    const legs = [[-24, 0], [-12, 1], [14, 0], [24, 1]];
    for (const [lx, ph] of legs) {
      let ly = 0, len = 20 - crouch;
      if (P === 'jump') { len = 10; ly = -6; }
      else if (P === 'walk') ly = -Math.abs(Math.sin(t * 9 + ph * 2)) * 4;
      ctx.fillRect(lx - 4, -20 + crouch + ly, 8, len); ctx.strokeRect(lx - 4, -20 + crouch + ly, 8, len);
      if (!sink) { ctx.fillStyle = '#3a2a2a'; ctx.fillRect(lx - 4.5, -20 + crouch + ly + len - 4, 9, 5); ctx.fillStyle = '#f6f2ea'; }
    }
    // the body with its black patches
    ctx.fillStyle = '#f6f2ea'; ctx.beginPath(); ctx.ellipse(0, -36 + crouch, 36, 20, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, -36 + crouch, 36, 20, 0, 0, TAU); ctx.clip();
    ctx.fillStyle = '#2a2430'; ctx.beginPath(); ctx.ellipse(-14, -44 + crouch, 12, 9, 0.4, 0, TAU); ctx.ellipse(12, -28 + crouch, 10, 7, -0.3, 0, TAU); ctx.ellipse(-30, -26 + crouch, 7, 9, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffb8c8'; ctx.beginPath(); ctx.ellipse(-4, -18 + crouch, 9, 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // the tail
    ctx.beginPath(); ctx.moveTo(-34, -42 + crouch); ctx.quadraticCurveTo(-46, -36, -44, -22 + Math.sin(t * 3) * 3); ctx.stroke();
    // the head: down for the charge and the crouch, up and proud otherwise
    const hx = 36, hy = (P === 'charge' || P === 'crouch' || P === 'snort' ? -34 : -50) + crouch;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(P === 'charge' ? 0.5 : P === 'crouch' ? 0.35 : -0.1);
    // horns
    ctx.fillStyle = '#fff4d8'; ctx.beginPath(); ctx.moveTo(-6, -14); ctx.quadraticCurveTo(-12, -26, -2, -30); ctx.lineTo(-2, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -14); ctx.quadraticCurveTo(14, -26, 6, -30); ctx.lineTo(3, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
    // ears
    ctx.fillStyle = '#2a2430'; ctx.beginPath(); ctx.ellipse(-14, -8, 8, 4, -0.5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(16, -8, 8, 4, 0.5, 0, TAU); ctx.fill(); ctx.stroke();
    // face
    ctx.fillStyle = '#f6f2ea'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 18, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffb8c8'; ctx.beginPath(); ctx.ellipse(2, 12, 14, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(-3, 12, 2, 3, 0, 0, TAU); ctx.ellipse(7, 12, 2, 3, 0, 0, TAU); ctx.fill();
    // eyes: star glasses (the headliner), red behind them for the snort, crosses when dizzy
    if (P === 'dizzy') { ctx.lineWidth = 2; ctx.beginPath(); for (const ex of [-6, 7]) { ctx.moveTo(ex - 3, -6); ctx.lineTo(ex + 3, 0); ctx.moveTo(ex + 3, -6); ctx.lineTo(ex - 3, 0); } ctx.stroke(); }
    else {
      ctx.fillStyle = P === 'snort' || P === 'charge' ? '#ff4a4a' : '#ff8ac8';
      for (const ex of [-6, 7]) { ctx.beginPath(); K.star(ctx, ex, -3, 6.5, 3.2, 5); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-8, -6, 2, 2); ctx.fillRect(5, -6, 2, 2);
    }
    if (P === 'snort') { ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 3; k++) { const ph = (t * 2 + k / 3) % 1; ctx.beginPath(); ctx.arc(8 + ph * 16, 16 + ph * 4, 3 + ph * 4, 0, TAU); ctx.fill(); } }
    // the golden bell on its ribbon
    ctx.fillStyle = '#c83a8a'; ctx.fillRect(-10, 20, 20, 4); ctx.strokeRect(-10, 20, 20, 4);
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(-6, 24); ctx.quadraticCurveTo(-7, 34, -9, 36); ctx.lineTo(9, 36); ctx.quadraticCurveTo(7, 34, 6, 24); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // the dust she is stuck in
    if (sink) { ctx.fillStyle = '#d8d2e2'; ctx.beginPath(); ctx.ellipse(0, -2, 50, 14, 0, Math.PI, 0); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ece8f2'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(k * 18, -10 - Math.abs(Math.sin(t * 3 + k)) * 4, 6, 0, TAU); ctx.fill(); } }
    ctx.restore();
    if (P === 'dizzy') K.dizzy(ctx, b.cx, b.y - 24, t);
  }
};
// her landing shadow, drawn on the floor while she is in the air (the tell for where she comes down)
TourHooks.on('afterEntities', (play, ctx) => {
  const b = play.boss; if (!b || b.style !== 'moon_moo' || b.remove) return;
  if ((b.act === 'leap' || b.act === 'crouch') && b.tx != null) {
    const k = b.act === 'leap' ? Math.min(1, b.at / 1.6) : 0.2, r = 26 + k * 26;
    ctx.save(); ctx.fillStyle = `rgba(20,10,40,${0.25 + 0.35 * k})`; ctx.beginPath(); ctx.ellipse(b.tx, b.floorY - 2, r, r * 0.22, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(255,90,140,${0.4 + 0.4 * k})`; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }
});
// a golf-ball target ring for phase 3 (1 s of warning, then the ball)
class RainSpot extends Ent {
  constructor(g, x, floorY) { super(g, null, 40, 10); this.x = x - 20; this.y = floorY - 10; this.life = 1.0; this.friendly = true; this.t = 0; }
  update(dt) {
    this.t += dt;
    if (this.t >= this.life && !this.fired) { this.fired = true; tourFire(this.g, this.cx, this.g.camY - 20, { vx: 0, vy: 18 * TS, w: 16, h: 16, life: 3, col: '#ffffff', art: (c, s) => MK.MoonArt.golf(c, s.x + s.w / 2, s.y + s.h / 2, 8) }); }
    if (this.t > this.life + 1.2) this.remove = true;
  }
  touchPlayer() {}
  draw(ctx) { if (this.fired) return; const q = this.t / this.life; ctx.save(); ctx.strokeStyle = `rgba(255,90,90,${0.5 + 0.5 * q})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(this.cx, this.y + 7, 22 - q * 10, 6 - q * 2, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
}
const boss = { id: 'moon_moo', name: 'Madame Moo', hp: 6, dims: [80, 64], music: 'tour_moon_boss', country: 'moon', brain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.moon_moo = [60, 70, 40, 10];
// the stage: a crater floor, two low risers to jump from, the big prop crescent moon hung over the middle
Tour.pieces['moon.arena_stage'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o;
  for (let q = 0; q < 4; q++) { B.set(x0 + 2 + q, GY - 3, T.SEMI); B.set(x0 + w - 6 + q, GY - 3, T.SEMI); }
  B.spawn('moonCrescent', x0 + Math.floor(w / 2), GY - 1, {});
  B.decorAt('moonLamp', x0 + 1, GY, 1); B.decorAt('moonLamp', x0 + w - 2, GY, 2); B.decorAt('moonPoster', x0 + 8, GY, 3);
};
// the prop crescent moon over the stage (on wires from the rig)
class MoonCrescent extends Ent {
  constructor(g, s) { super(g, s, 120, 120); this.x = s.x - 60; this.y = s.y - 10 * TS; this.back = true; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y + 40 + Math.sin(this.t * 0.8) * 4;
    ctx.save(); ctx.strokeStyle = 'rgba(200,200,220,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 20, y - 50); ctx.lineTo(x - 20, this.g.camY - 10); ctx.moveTo(x + 24, y - 30); ctx.lineTo(x + 24, this.g.camY - 10); ctx.stroke();
    ctx.fillStyle = '#ffe8a0'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, 48, 0.9, -0.9 + TAU, false); ctx.arc(x + 22, y - 12, 40, -1.25 + TAU, 1.25, true); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f2d070'; ctx.beginPath(); ctx.arc(x - 26, y + 6, 6, 0, TAU); ctx.arc(x - 18, y - 22, 4, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
ENTITY_TYPES.moonCrescent = MoonCrescent;
TourHats.NOT && TourHats.NOT.add('moonCrescent');
Tour.moonKit.MOO = MOO; Tour.moonKit.mooBrain = brain;
})();
