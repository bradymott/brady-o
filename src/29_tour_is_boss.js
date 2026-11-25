/* ============================================================
   ICELAND: the boss (17-5): THE NIGHT TROLL, the act nobody cancelled. He has waited weeks in his cave by the
   fjord for his big number; trolls turn to stone in sunlight, so he only ever plays before dawn, and dawn is coming.
   The fight: the sun is coming up behind the sea stacks and two old polished shields stand on posts at the cave
   mouth. Stand on a shield's stepping stone: the shield glints (0.6 s: the sunny spot it will hit shows on the floor)
   and throws a beam of sunrise onto that spot for 1.4 s. Lure the troll onto the spot: caught in the sun he turns
   to stone (his weak moment): stomp his stony head. The stone cracks off and he is cross.
   His acts: LUMBER after Brady; CLUB (he raises his club for 0.7 s, then slams: a ripple of rocks runs along the
   floor both ways: jump it); BOULDER (he winds up 0.6 s, a shadow marks where it lands); phase 2 (3 hp): he lumbers
   faster and throws two; phase 3 (1 hp): every slam shakes stalactites loose (their shadows show 0.8 s first).
   The last stomp: the sun clears the horizon and he sets for good, a new sea stack on the shore.
   ============================================================ */
(function () {
const C = Tour.countries.is;
if (!C) return;
const KIT = Tour.isKit, IsArt = KIT.IsArt, INK = KIT.INK, K = TourKit;
const TROLL = { beam: 1.4, glint: 0.6, cool: 3.0, stone: 3.2, patchW: 4 };
const say = (b, t) => K.say(b.g, b, t, '#e8f0ff');

/* the sunlit shields: { patch: tile x of the sunny spot's left edge } */
class IsSunShield extends Ent {
  constructor(g, s) {
    super(g, s, 2 * TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.floor = s.y; this.patchX = s.patch * TS; this.state = 'idle'; this.st = 0; this.always = true; this.back = true;
    this.broken = false;
  }
  get patch() { return { x: this.patchX, y: this.floor - 4 * TS, w: TROLL.patchW * TS, h: 4 * TS }; }
  get beaming() { return this.state === 'beam'; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    const onStone = p && !p.dead && p.onGround && p.cx > this.x && p.cx < this.x + this.w && Math.abs(p.y + p.h - this.y) < 6;
    if (this.state === 'idle' && onStone && !this.broken) { this.state = 'glint'; this.st = 0; K.sfx('glint', 'select', { vol: 0.5, pitch: 1.6 }); }
    else if (this.state === 'glint') { this.st += dt; if (this.st > TROLL.glint) { this.state = 'beam'; this.st = 0; K.sfx('sunbeam', 'powerup', { vol: 0.45, pitch: 1.3 }); } }
    else if (this.state === 'beam') { this.st += dt; if (this.st > TROLL.beam) { this.state = 'cool'; this.st = 0; } }
    else if (this.state === 'cool') { this.st += dt; if (this.st > TROLL.cool) this.state = 'idle'; }
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, t = this.t, P = this.patch, g = this.g;
    const sx = x + w / 2, sy = y - 3.2 * TS;
    // the sunny spot: a dotted target while it glints, a blaze of light while it beams
    if (this.state === 'glint') { ctx.save(); ctx.strokeStyle = 'rgba(255,220,120,' + (0.5 + 0.5 * Math.sin(t * 30)) + ')'; ctx.setLineDash([6, 5]); ctx.lineWidth = 3; ctx.strokeRect(P.x + 2, P.y, P.w - 4, P.h - 2); ctx.setLineDash([]); ctx.restore(); }
    if (this.state === 'beam') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const k = Math.min(1, this.st * 6) * Math.min(1, (TROLL.beam - this.st) * 4);
      const gr = ctx.createLinearGradient(sx, sy, P.x + P.w / 2, P.y + P.h);
      gr.addColorStop(0, 'rgba(255,240,180,' + 0.75 * k + ')'); gr.addColorStop(1, 'rgba(255,200,90,' + 0.5 * k + ')');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(sx - 10, sy - 4); ctx.lineTo(sx + 10, sy + 4); ctx.lineTo(P.x + P.w, P.y + P.h); ctx.lineTo(P.x, P.y + P.h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,230,150,' + 0.35 * k + ')'; ctx.fillRect(P.x, P.y, P.w, P.h);
      // the light coming in from the sunrise (top right) to the shield
      ctx.strokeStyle = 'rgba(255,230,160,' + 0.6 * k + ')'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(g.camX + Game.viewW + 40, g.camY + 20); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.restore();
    }
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    // the stepping stone
    ctx.fillStyle = '#6a6876'; rr(ctx, x + 2, y + 2, w - 4, TS - 2, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = this.state === 'idle' ? '#ffd84a' : '#8a8494'; ctx.beginPath(); ctx.arc(x + w / 2, y + 12, 4, 0, TAU); ctx.fill();
    // the post and the round shield (a polished one: it shines)
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(sx - 3, sy, 6, y - sy + 2); ctx.strokeRect(sx - 3, sy, 6, y - sy + 2);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(this.state === 'beam' || this.state === 'glint' ? -0.5 : -0.15);
    ctx.fillStyle = '#c8ccd6'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 22, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#eef2f8'; ctx.beginPath(); ctx.ellipse(-4, -5, 9, 11, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8902a'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill(); ctx.stroke();
    if (this.state === 'glint' && Math.floor(t * 12) % 2 === 0) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); K.star(ctx, -6, -8, 12, 3, 4); ctx.fill(); }
    ctx.restore();
    ctx.restore();
  }
}

/* the troll's brain */
const rockShot = (ctx, s, t) => { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillStyle = '#6a6474'; ctx.translate(s.x + s.w / 2, s.y + s.h / 2); ctx.rotate(t * 8 * (s.vx > 0 ? 1 : -1)); ctx.beginPath(); ctx.moveTo(-s.w / 2, 2); ctx.lineTo(-4, -s.h / 2); ctx.lineTo(s.w / 2 - 2, -3); ctx.lineTo(s.w / 2, s.h / 2 - 2); ctx.lineTo(-2, s.h / 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); };
const trollBrain = {
  phases: [3, 1],
  guardText: 'TOO TOUGH!',
  shields(b) { return b.g.entities.filter(e => e instanceof IsSunShield); },
  wake(b) { b.phase = 1; say(b, 'WHO WAKES THE TROLL? ...IS IT MORNING YET? NO? THEN DANCE!'); },
  hit(b, kind) {
    if (kind === 'stomp' || kind === 'spin') { if (b.act === 'stone') { b.damage(1, { text: 'CRACK!', col: '#ffe8b0' }); return true; } return 'bounce'; }
    if (kind === 'star') { b.damage(1); return true; }
    return false;
  },
  phase(b, n) {
    const g = b.g;
    if (n === 2) { g.bannerText = 'THE SKY IS GETTING LIGHTER!'; g.bannerT = 2.2; say(b, 'NO SUN! NOT YET! I HAVE AN ENCORE!'); }
    if (n === 3) { g.bannerText = 'DAWN IS COMING!'; g.bannerT = 2.2; say(b, 'THE ROOF WILL COME DOWN ON YOU!'); }
    b.go('shake');
  },
  hurt(b) { say(b, pick(['MY NOSE!', 'OOF! STONY!', 'THAT TICKLES! ...IT DOES NOT!'])); b.go('shake'); },
  // stomping on him while he's stone is his weak moment; touching him otherwise hurts
  touch(b, p) { if (b.act === 'stone' || b.act === 'shake') { if (!(p.vy > 0 && p.prevBottom <= b.y + b.h * 0.35)) { p.x += (p.cx < b.cx ? -1 : 1) * 2; return true; } } return false; },
  sunlit(b) { return this.shields(b).some(s => s.beaming && b.x + b.w > s.patch.x + 8 && b.x < s.patch.x + s.patch.w - 8); },
  slam(b) {
    const g = b.g, ph = b.phase || 1; g.shake(8); Sound.play('stomp', { pitch: 0.4 });
    for (const d of [-1, 1]) tourFire(g, b.cx + d * (b.w / 2 + 6), b.floorY - 12, { vx: d * (4.6 + ph * 0.4) * TS, w: 22, h: 22, ground: true, life: 3, col: '#6a6474', art: rockShot });
    if (ph >= 3) for (let k = 0; k < 3; k++) { const x = b.arenaX0 + TS * 2 + Math.random() * (b.arenaX1 - b.arenaX0 - 4 * TS); b.g.spawn(new IsStalactite(b.g, x, b.floorY)); }
  },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1;
    b.guard = 'bounce';
    // caught in a sunbeam (any act but stone and his shake): he sets like a statue
    if (b.act !== 'stone' && b.act !== 'shake' && this.sunlit(b)) { b.go('stone'); b.vx = 0; say(b, 'NOOO... SUNLIGHT...'); K.sfx('stone', 'crumble', { vol: 0.7, pitch: 0.4 }); g.shake(4); }
    if (b.act === 'walk') {
      b.pose = 'walk'; b.face(); b.walk(ph >= 2 ? 1.5 : 1.1); b.fall(dt);
      if (b.at > (ph >= 2 ? 1.6 : 2.2)) { b.cycle++; const seq = ph >= 2 ? ['club', 'throw', 'walk2', 'club', 'throw'] : ['club', 'walk2', 'throw']; b.go(seq[b.cycle % seq.length]); }
    } else if (b.act === 'walk2') { b.go('walk'); }
    else if (b.act === 'club') {
      b.vx = 0; b.fall(dt);
      if (b.first) { b.slammed = false; say(b, 'HRRRMM...'); }
      b.pose = b.at < 0.7 ? 'raise' : 'slam';
      if (b.at > 0.7 && !b.slammed) { b.slammed = true; this.slam(b); }
      if (b.at > 1.4) b.go('walk');
    } else if (b.act === 'throw') {
      b.vx = 0; b.fall(dt); b.face();
      if (b.first) { b.thrown = 0; }
      b.pose = 'throw';
      const n = ph >= 2 ? 2 : 1;
      if (b.thrown < n && b.at > 0.6 + b.thrown * 0.5) {
        b.thrown++; Sound.play('throw', { pitch: 0.6 });
        const tx = p ? p.cx + (b.thrown - 1) * b.dir * -1.5 * TS : b.cx, dx = tx - b.cx, T = 1.1;
        const s = tourFire(g, b.cx + b.dir * 20, b.y + 10, { vx: dx / T, vy: -10 * TS, grav: (2 * (b.floorY - b.y - 10 + 10 * TS * T) / (T * T)), w: 26, h: 26, life: 3, thru: true, col: '#6a6474', art: rockShot });
        s.isBoulder = true; s.landX = tx; s.landY = b.floorY;
      }
      if (b.at > 0.6 + n * 0.5 + 0.4) b.go('walk');
    } else if (b.act === 'stone') {
      b.vx = 0; b.pose = 'stone'; b.vuln = true; b.fall(dt);
      if (b.at > TROLL.stone - (ph - 1) * 0.3) { b.go('shake'); say(b, 'BRRR! STILL DARK ENOUGH!'); }
    } else if (b.act === 'shake') {
      b.vx = 0; b.pose = 'shake'; b.fall(dt);
      if (b.first) { for (let k = 0; k < 10; k++) g.burst(b.x + Math.random() * b.w, b.y + Math.random() * b.h, 2, '#8a8494', 'dust'); }
      if (b.at > 0.9) b.go('walk');
    } else b.go('walk');
  },
  draw(b, ctx, t) {
    const P = b.pose || 'walk', d = b.dir, x = b.cx, y = b.y + b.h;
    const stone = P === 'stone', k = stone ? Math.min(1, b.at * 3) : 0;
    const skin = stone ? '#8a8494' : '#7a9a6a', skin2 = stone ? '#6a6474' : '#5a7a4a', hair = stone ? '#7a7484' : '#3a2a22';
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
    if (P === 'shake') ctx.translate(Math.sin(t * 50) * 3, 0);
    const step = P === 'walk' ? Math.sin(t * 6) : 0;
    // legs and big feet
    ctx.fillStyle = skin2; ctx.fillRect(-22, -30, 16, 30 - Math.max(0, step) * 6); ctx.strokeRect(-22, -30, 16, 30 - Math.max(0, step) * 6); ctx.fillRect(6, -30, 16, 30 + Math.min(0, step) * 6); ctx.strokeRect(6, -30, 16, 30 + Math.min(0, step) * 6);
    ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(-16, -2, 16, 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(16, -2, 16, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // the body: a big round belly, a sheepskin wrapped round it
    ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(0, -56, 40, 36, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = stone ? '#9a94a4' : '#e8e0cc'; ctx.beginPath(); ctx.moveTo(-38, -50); ctx.quadraticCurveTo(0, -36, 38, -50); ctx.lineTo(34, -28); ctx.quadraticCurveTo(0, -18, -34, -28); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!stone) { ctx.fillStyle = '#d0c6b0'; for (let q = -28; q < 30; q += 9) { ctx.beginPath(); ctx.arc(q, -32, 3, 0, TAU); ctx.fill(); } }
    // the head: a huge nose, small eyes, a mossy tuft of hair, tusks
    ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(8, -96, 24, 22, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = hair; ctx.beginPath(); ctx.ellipse(2, -114, 20, 8, -0.2, Math.PI, 0); ctx.fill(); ctx.stroke();
    if (!stone) { ctx.fillStyle = '#6aa83a'; ctx.beginPath(); ctx.ellipse(-2, -118, 8, 3, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = skin2; ctx.beginPath(); ctx.ellipse(28, -90, 14, 10, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = stone ? '#5a5464' : '#ffd84a'; ctx.beginPath(); ctx.arc(14, -101, 3.4, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; if (!stone) { ctx.beginPath(); ctx.arc(15, -101, 1.6, 0, TAU); ctx.fill(); }
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(6, P === 'raise' || P === 'throw' ? -110 : -107); ctx.lineTo(20, -106); ctx.stroke(); ctx.lineWidth = 2.6;
    ctx.fillStyle = stone ? '#b8b2c0' : '#f6f0dc'; ctx.beginPath(); ctx.moveTo(14, -80); ctx.lineTo(16, -70); ctx.lineTo(19, -79); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the arm with the club (a driftwood log)
    ctx.save(); ctx.translate(30, -66);
    ctx.rotate(P === 'raise' ? -2.2 : P === 'slam' ? 0.6 : P === 'throw' ? -1.6 : P === 'stone' ? -0.4 : -0.3 + step * 0.2);
    ctx.fillStyle = skin; ctx.fillRect(-7, 0, 14, 30); ctx.strokeRect(-7, 0, 14, 30);
    if (P === 'throw') { ctx.fillStyle = '#6a6474'; ctx.beginPath(); ctx.arc(0, 38, 14, 0, TAU); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle = stone ? '#8a8494' : '#8a6a42'; ctx.beginPath(); ctx.moveTo(-6, 26); ctx.lineTo(-10, 70); ctx.quadraticCurveTo(0, 80, 10, 70); ctx.lineTo(6, 26); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    // stone cracks creeping over him
    if (stone) { ctx.strokeStyle = 'rgba(40,36,50,0.7)'; ctx.lineWidth = 1.6; for (let q = 0; q < 6; q++) { const a = q * 1.1; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 30, -56 + Math.sin(a) * 26); ctx.lineTo(Math.cos(a) * 18, -60 + Math.sin(a) * 14); ctx.stroke(); } ctx.globalAlpha = k * 0.3; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, -60, 40, 56, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
    if (P === 'shake') K.dizzy(ctx, b.cx, b.y - 20, t);
  }
};
// a stalactite shaken loose (phase 3): its shadow on the floor for 0.8 s, then it drops
class IsStalactite extends Ent {
  constructor(g, x, floorY) { super(g, null, 20, 30); this.x = x - 10; this.y = g.camY - 10; this.floorY = floorY; this.state = 'warn'; this.st = 0; this.enemy = true; this.vy = 0; }
  update(dt) {
    this.t += dt; this.st += dt;
    if (this.state === 'warn') { if (this.st > 0.8) this.state = 'fall'; return; }
    this.vy += PHYS.gDown * 0.7 * dt; this.y += this.vy * dt;
    if (this.y + this.h >= this.floorY) { this.remove = true; this.g.burst(this.cx, this.floorY, 8, '#8a8494', 'dust'); }
  }
  hit() { return false; }
  touchPlayer(p) { if (this.state === 'fall') p.hurt(this); }
  draw(ctx) {
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,' + (0.2 + 0.25 * Math.min(1, this.st / 0.8)) + ')'; ctx.beginPath(); ctx.ellipse(this.cx, this.floorY - 2, 14, 4, 0, 0, TAU); ctx.fill();
    if (this.state === 'fall') { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#7a7484'; ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + this.w, this.y); ctx.lineTo(this.cx, this.y + this.h); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
}
// the boulder's landing shadow (drawn over the world while one is in the air)
TourHooks.on('afterEntities', (play, ctx) => {
  if (!play.boss || play.boss.style !== 'is_troll') return;
  for (const e of play.entities) if (e.isBoulder && !e.remove) { const k = clamp(1 - (e.landY - (e.y + e.h)) / (6 * TS), 0.2, 1); ctx.save(); ctx.fillStyle = 'rgba(0,0,0,' + (0.35 * k) + ')'; ctx.beginPath(); ctx.ellipse(e.landX, e.landY - 2, 18 * k + 6, 5, 0, 0, TAU); ctx.fill(); ctx.restore(); }
});
const boss = { id: 'is_troll', name: 'The Night Troll', hp: 5, dims: [84, 120], music: 'tour_is_boss', country: 'is', brain: trollBrain };
Tour.boss(boss);
C.boss = boss;
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.is_troll = [70, 70, 50, 12];
// the cave mouth before dawn: the troll's lair at the left, two shields with their stepping stones at the right,
// stone ledges to keep out of his way
Tour.pieces['is.arena_cave'] = (st, o) => {
  const B = st.B, { x0, w, GY } = o;
  for (let q = 0; q < 3; q++) { B.set(x0 + 3 + q, GY - 4, T.SEMI); B.set(x0 + Math.floor(w / 2) - 1 + q, GY - 5, T.SEMI); }
  for (const [sx, px] of [[x0 + w - 4, x0 + 5], [x0 + w - 9, x0 + Math.floor(w / 2) - 2]]) { B.set(sx, GY - 1, T.SEMI); B.set(sx + 1, GY - 1, T.SEMI); B.spawn('isSunShield', sx, GY - 1, { patch: px }); }
  B.decorAt('isTrollStone', x0 + 2, GY, 1);
  B.decorAt('isRock', x0 + Math.floor(w / 2) + 3, GY, 2);
};
Object.assign(ENTITY_TYPES, { isSunShield: IsSunShield, isStalactite: IsStalactite });
Object.assign(Tour.isKit, { TROLL, trollBrain, IsSunShield });
})();
