/* ============================================================
   KENYA's boss (15-5): BIG KIBOKO, the hippo who does water ballet. Her show at the waterhole was booked by Piwi
   weeks ago, nobody cancelled it, and she has been rehearsing ever since. She is very good. She is also very big.
   The arena: a waterhole between two sandy shores (reeds, a lily pad or two over each shore).
   - SWIM: only her ears, eyes and nostrils show; she glides under the water to where Brady is.
   - RISE (the tell, 0.9 s): bubbles boil up in a ring, a music note, the water heaves.
   - GRAND JETÉ: she bursts out of the pool and leaps onto a shore (her shadow marks the landing spot from the start),
     lands with a splash wave along the sand both ways (jump it), then takes a BOW: a deep curtsy, head down, eyes
     shut, for two seconds. That is the moment: stomp her head.
   - PIROUETTE (phase 2, from 3 hp): she rises onto one toe on the water, spins up (0.9 s), then flings rings of
     water drops in arcs over both shores.
   - Phase 3 (the last hp): the encore: a double jeté (shore to shore), faster spins.
   Five stomps; then she curtsies for real, the curtain (a reed curtain) comes down, and the snow cap goes home.
   ============================================================ */
(function () {
const C = Tour.countries.ke; if (!C) return;
const K = TourKit, INK = '#1c1426';
const KIB = { RISE: 0.9, BOW: [0, 2.2, 2.0, 1.6], JETE: 1.15, H: 4.6 };
const says = { jete: ['GRAND JETÉ!', 'AND... LEAP!', 'WATCH MY FORM!'], bow: ['THANK YOU, THANK YOU!', 'BRAVA, ME!', '*CURTSY*'], spin: ['PIROUETTE!', 'AND SPIN!', 'TWINKLE TOES!'] };
const pickOf = a => a[Math.floor(Math.random() * a.length)];
const pool = b => b.pool;
const drop = (ctx, s) => { ctx.save(); ctx.fillStyle = '#8ad8ff'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; const x = s.x + s.w / 2, y = s.y + s.h / 2; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.quadraticCurveTo(x + 7, y + 2, x, y + 6); ctx.quadraticCurveTo(x - 7, y + 2, x, y - 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, y - 2, 2, 3); ctx.restore(); };
const wave = (ctx, s) => { ctx.save(); ctx.fillStyle = '#8ad8ff'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; const x = s.x, y = s.y + s.h, w = s.w, h = s.h; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + w * 0.2, y - h, x + w * 0.5, y - h * 0.9); ctx.quadraticCurveTo(x + w * 0.85, y - h * 0.6, x + w, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + w * 0.45, y - h * 0.75, 3, 0, TAU); ctx.fill(); ctx.restore(); };
const brain = {
  phases: [3, 1],
  guardText: 'MIND THE TUTU!',
  wake(b) {
    b.phase = 1; b.tall = true;
    const P = b.g.area.kePool || [b.arenaX0 + 9 * TS, b.arenaX1 - 9 * TS];
    b.pool = { x0: P[0], x1: P[1], wl: b.floorY };
    K.say(b.g, b, 'THE SHOW MUST GO ON!', '#ffd0e8');
    b.g.bannerText = 'BIG KIBOKO\'S WATER BALLET'; b.g.bannerT = 2.2;
  },
  hit(b, kind) {
    if (kind === 'stomp' || kind === 'spin') {
      if (b.vuln) { b.damage(1, { text: 'BRAVO!', col: '#ffd84a' }); return true; }
      if (b.act === 'swim' || b.act === 'dive' || b.act === 'rise') return false;
      return 'bounce';
    }
    return undefined;
  },
  // under the water she is harmless to touch (she is busy swimming); a hit landing never stacks with the shove
  touch(b, p) { return b.act === 'swim' || b.act === 'dive' || b.act === 'rise'; },
  phase(b, n) {
    const g = b.g;
    if (n === 2) { g.bannerText = 'ACT TWO: THE PIROUETTE'; g.bannerT = 2.2; K.say(g, b, 'NOW FOR SOMETHING HARDER!', '#ffd0e8'); }
    if (n === 3) { g.bannerText = 'THE ENCORE!'; g.bannerT = 2.2; K.say(g, b, 'ENCORE! ENCORE! (THAT\'S ME SAYING IT)', '#ffd0e8'); }
    b.go('return');
  },
  hurt(b) { K.say(b.g, b, pickOf(['OOF! MY ARABESQUE!', 'NOT THE TUTU!', 'A CRITIC!']), '#ffd0e8'); b.go('return'); },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1, P = pool(b);
    if (!P) return;
    const mid = (P.x0 + P.x1) / 2, wl = P.wl;
    b.guard = 'bounce';
    if (b.act === 'walk') b.go('dive');
    if (b.act === 'dive') {
      // into the pool with a splash, then under
      b.pose = 'dive';
      if (b.first) { b.tx = clamp(b.cx, P.x0 + b.w / 2, P.x1 - b.w / 2); g.burst(b.tx, wl, 16, '#bfefff', 'bubble'); K.sfx('splash', 'swim', { vol: 0.6, pitch: 0.6 }); }
      b.x = approach(b.x, b.tx - b.w / 2, 6 * TS * dt); b.y = approach(b.y, wl - 12, 8 * TS * dt);
      if (b.at > 0.5) b.go('swim');
    } else if (b.act === 'swim') {
      b.pose = 'swim'; b.y = wl - 12;
      const tx = clamp(p ? p.cx : mid, P.x0 + b.w / 2 + 8, P.x1 - b.w / 2 - 8);
      b.x = approach(b.x, tx - b.w / 2, (ph >= 3 ? 4.6 : 3.6) * TS * dt); b.dir = tx > b.cx ? 1 : b.dir;
      if (Math.random() < 0.08) g.burst(b.cx + (Math.random() - 0.5) * 60, wl, 1, '#ffffff', 'bubble');
      if (b.at > (ph >= 3 ? 1.1 : 1.6)) b.go('rise');
    } else if (b.act === 'rise') {
      // the tell: a boiling ring of bubbles, a note, the water heaving
      b.pose = 'rise'; b.y = wl - 16 - Math.sin(b.at * 30) * 2;
      if (b.first) { b.cycle++; K.sfx('note', 'select', { vol: 0.4, pitch: 1.2 }); g.parts.text(b.cx, wl - 60, '♪', '#ffd0e8'); }
      if (Math.random() < 0.7) g.burst(b.cx + (Math.random() - 0.5) * b.w, wl + 2, 1, '#ffffff', 'bubble');
      if (b.at > KIB.RISE) b.go(ph >= 2 && b.cycle % 2 === 0 ? 'spin' : 'jete');
    } else if (b.act === 'jete') {
      // the leap: an arc from the water to the shore Brady is on (the nearer one if he is in the pool)
      if (b.first) {
        const left = p ? (p.cx < mid) : b.cx > mid;
        b.side = left ? -1 : 1;
        if (b.encore) b.side = b.cx < mid ? 1 : -1;
        const sx0 = left ? b.arenaX0 + TS : P.x1 + TS, sx1 = left ? P.x0 - TS : b.arenaX1 - TS;
        b.lx = clamp(p && p.cx > sx0 && p.cx < sx1 ? p.cx : (sx0 + sx1) / 2, sx0 + b.w / 2, sx1 - b.w / 2);
        b.jx0 = b.cx; b.jy0 = b.y + b.h; b.dir = b.side;
        K.say(g, b, pickOf(says.jete), '#ffd0e8'); K.sfx('whoosh', 'jump', { vol: 0.5, pitch: 0.6 });
        g.burst(b.cx, wl, 18, '#bfefff', 'bubble');
      }
      b.pose = 'jete';
      const T = KIB.JETE * (ph >= 3 ? 0.9 : 1), k = Math.min(1, b.at / T);
      const fx = lerp(b.jx0, b.lx, k), fy = lerp(b.jy0, b.floorY, k) - Math.sin(k * Math.PI) * KIB.H * TS;
      b.x = fx - b.w / 2; b.y = fy - b.h; b.shadowX = b.lx;
      if (k >= 1) {
        b.y = b.floorY - b.h; b.shadowX = null; g.shake(9); K.sfx('thud', 'stomp', { vol: 0.8, pitch: 0.5 }); g.burst(b.cx, b.floorY, 20, '#e8c890', 'dust');
        for (const d of [-1, 1]) tourFire(g, b.cx + d * (b.w / 2 + 6), b.floorY - 13, { vx: d * 5.2 * TS, w: 26, h: 26, life: 2.2, ground: true, col: '#8ad8ff', art: wave });
        if (ph >= 3 && !b.encore) { b.encore = true; b.go('jete'); }
        else { b.encore = false; b.go('bow'); }
      }
    } else if (b.act === 'bow') {
      // the curtsy: head down, eyes shut, soaking up the applause: the weak spot is open
      b.pose = 'bow'; b.vuln = b.at > 0.25; b.guard = 'hurt';
      if (b.first) K.say(g, b, pickOf(says.bow), '#ffe28a');
      if (b.at > KIB.BOW[ph]) b.go('return');
    } else if (b.act === 'return') {
      // waddle back to the pool on tiptoe and dive in
      b.pose = 'walk'; b.y = b.floorY - b.h;
      const tx = b.cx < mid ? P.x0 + b.w / 2 + 6 : P.x1 - b.w / 2 - 6; b.dir = tx > b.cx ? 1 : -1;
      b.x = approach(b.x, tx - b.w / 2, 3.4 * TS * dt);
      if (Math.abs(b.cx - tx) < 4 || b.at > 2.5) b.go('dive');
    } else if (b.act === 'spin') {
      // up on one toe on the water: spin up (the tell), then fling rings of drops over both shores
      b.pose = 'spin'; b.y = approach(b.y, wl - b.h + 6, 6 * TS * dt);
      if (b.first) { b.shots = 0; K.say(g, b, pickOf(says.spin), '#ffd0e8'); }
      const tell = 0.9 * (ph >= 3 ? 0.8 : 1), n = ph >= 3 ? 3 : 2;
      if (b.at > tell + b.shots * 0.4 && b.shots < n) {
        b.shots++; K.sfx('spray', 'swim', { vol: 0.5, pitch: 1.4 });
        for (let k = 0; k < 4; k++) for (const d of [-1, 1]) tourFire(g, b.cx + d * 30, b.y + 20, { vx: d * (3 + k * 1.6 + (b.shots % 2) * 0.8) * TS, vy: -(9 + (k % 2) * 2) * TS, grav: PHYS.gDown * 0.42, w: 16, h: 18, life: 3, thru: true, col: '#8ad8ff', art: drop });
      }
      if (b.at > tell + n * 0.4 + 0.5) b.go('dive');
    } else b.go('dive');
  },
  draw(b, ctx, t) {
    const P = b.pose, d = b.dir || 1, x = b.cx, y = b.y + b.h, wl = b.pool ? b.pool.wl : b.floorY;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    if (P === 'swim' || P === 'rise' || P === 'dive') {
      // just the top of her head over the water: ears, eyes, nostrils; a ripple ring
      const up = P === 'rise' ? 10 : 0, hx = x + d * 18;
      ctx.fillStyle = '#9a8ab0';
      ctx.beginPath(); ctx.ellipse(hx - d * 16, wl - 6 - up, 26, 12 + up, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(hx + d * 18, wl - 4 - up, 14, 8 + up * 0.5, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      for (const ox of [-30, -14]) { ctx.beginPath(); ctx.ellipse(hx + d * ox, wl - 18 - up, 5, 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#ffffff'; for (const ox of [-22, -6]) { ctx.beginPath(); ctx.arc(hx + d * ox, wl - 12 - up, 4.6, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = INK; for (const ox of [-21, -5]) { ctx.beginPath(); ctx.arc(hx + d * ox, wl - 12 - up, 2, 0, TAU); ctx.fill(); }
      // eyelashes (a ballerina's)
      ctx.lineWidth = 1.4; for (const ox of [-22, -6]) for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(hx + d * ox + k * 3, wl - 17 - up); ctx.lineTo(hx + d * ox + k * 4, wl - 21 - up); ctx.stroke(); }
      ctx.lineWidth = 2.6;
      ctx.fillStyle = INK; for (const ox of [14, 22]) { ctx.beginPath(); ctx.ellipse(hx + d * ox, wl - 8 - up, 2, 1.4, 0, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; const r = 30 + (t * 30) % 30; ctx.beginPath(); ctx.ellipse(x, wl + 2, r + 20, 5, 0, 0, TAU); ctx.stroke();
      if (P === 'rise') { ctx.fillStyle = '#ffd0e8'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.fillText('♪', x + Math.sin(t * 8) * 8, wl - 44); }
      ctx.restore(); return;
    }
    ctx.translate(x, y);
    if (P === 'spin') ctx.scale(Math.cos(t * 14) >= 0 ? 1 : -1, 1); else ctx.scale(d, 1);
    const bow = P === 'bow', jete = P === 'jete', spin = P === 'spin';
    if (jete) ctx.rotate(-0.15);
    // legs: tiptoe in a waddle; split in a jeté; one toe in a spin; a curtsy's crossed legs
    ctx.fillStyle = '#8a7aa0';
    if (jete) { ctx.beginPath(); rr(ctx, -50, -30, 30, 14, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); rr(ctx, 20, -34, 32, 14, 7); ctx.fill(); ctx.stroke(); }
    else if (spin) { ctx.beginPath(); rr(ctx, -6, -24, 12, 24, 6); ctx.fill(); ctx.stroke(); ctx.beginPath(); rr(ctx, 4, -34, 22, 11, 5); ctx.fill(); ctx.stroke(); }
    else { const s = P === 'walk' ? Math.sin(t * 12) * 4 : 0; for (const lx of [-24, 14]) { ctx.beginPath(); rr(ctx, lx + (lx < 0 ? s : -s), -22, 12, 22, 6); ctx.fill(); ctx.stroke(); } }
    // the ballet slippers' ribbons
    ctx.strokeStyle = '#ff7ab8'; ctx.lineWidth = 2; if (!jete) { ctx.beginPath(); ctx.moveTo(-22, -6); ctx.lineTo(-14, -14); ctx.moveTo(16, -6); ctx.lineTo(24, -14); ctx.stroke(); } ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    // the body: a barrel (it dips forward in the curtsy)
    ctx.save(); if (bow) { ctx.translate(0, 8); }
    ctx.fillStyle = '#9a8ab0'; ctx.beginPath(); ctx.ellipse(0, -44, 46, 28, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b8a8cc'; ctx.beginPath(); ctx.ellipse(-6, -58, 28, 8, -0.1, 0, TAU); ctx.fill();
    // the tutu: a stiff pink disc of net round her middle, scalloped, with a lighter layer on top
    const fr = spin ? Math.sin(t * 30) * 3 : 0;
    for (const [yy, rx, col] of [[-30, 62, '#ff8ac0'], [-34, 54, '#ffc0de']]) {
      ctx.fillStyle = col; ctx.beginPath();
      for (let k = 0; k <= 16; k++) { const a = Math.PI + k * Math.PI / 16, r = k % 2 ? 1 : 0.9; ctx.lineTo(Math.cos(a) * rx * r, yy + Math.sin(a) * -9 * r + fr * (k % 2 ? 1 : -1)); }
      for (let k = 16; k >= 0; k--) { const a = Math.PI + k * Math.PI / 16; ctx.lineTo(Math.cos(a) * rx * 0.7, yy - 8 + Math.sin(a) * -5); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // the arms: up in a spin and a jeté, out in a curtsy, on the hips walking
    ctx.fillStyle = '#9a8ab0';
    if (spin || jete) { ctx.beginPath(); rr(ctx, 18, -98, 12, 36, 6); ctx.fill(); ctx.stroke(); ctx.beginPath(); rr(ctx, -30, -98, 12, 36, 6); ctx.fill(); ctx.stroke(); }
    else if (bow) { ctx.beginPath(); rr(ctx, 26, -50, 26, 11, 5); ctx.fill(); ctx.stroke(); ctx.beginPath(); rr(ctx, -52, -50, 26, 11, 5); ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); rr(ctx, 32, -56, 10, 20, 5); ctx.fill(); ctx.stroke(); }
    // the head: a big muzzle, little ears, lashes; a flower behind one ear
    ctx.save(); ctx.translate(bow ? 44 : 36, bow ? -30 : -66); if (bow) ctx.rotate(0.5);
    ctx.fillStyle = '#9a8ab0'; ctx.beginPath(); ctx.ellipse(0, 0, 24, 20, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(20, 8, 22, 16, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(32, 2, 2.6, 1.8, 0, 0, TAU); ctx.ellipse(36, 8, 2.6, 1.8, 0, 0, TAU); ctx.fill();
    for (const ex of [-12, 6]) { ctx.fillStyle = '#9a8ab0'; ctx.beginPath(); ctx.ellipse(ex, -20, 5, 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
    if (bow) { ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(2, -4, 5, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(2, -6, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(4, -6, 3, 0, TAU); ctx.fill(); }
    ctx.lineWidth = 1.6; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(2 + k * 4, -12); ctx.lineTo(3 + k * 5, -17); ctx.stroke(); }
    ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(12, 18); ctx.quadraticCurveTo(24, 24, 36, 16); ctx.stroke();
    ctx.fillStyle = '#ff7ab8'; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; ctx.beginPath(); ctx.ellipse(-14 + Math.cos(a) * 5, -14 + Math.sin(a) * 5, 4, 3, a, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(-14, -14, 2.6, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
    if (spin) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(0, -50 + k * 14, 60 + k * 4, 8, 0, t * 8 + k, t * 8 + k + 2); ctx.stroke(); } }
    ctx.restore();
  }
};
// her landing spot: a shadow that grows as she comes down (drawn under her, over the sand)
TourHooks.on('afterEntities', (play, ctx) => {
  const b = play.boss; if (!b || b.style !== 'ke_kiboko' || b.remove || b.shadowX == null || b.act !== 'jete') return;
  const k = Math.min(1, b.at / KIB.JETE);
  ctx.save(); ctx.fillStyle = `rgba(30,20,50,${0.2 + 0.35 * k})`; ctx.beginPath(); ctx.ellipse(b.shadowX, b.floorY + 2, 30 + 30 * k, 6 + 3 * k, 0, 0, TAU); ctx.fill(); ctx.restore();
});
const boss = { id: 'ke_kiboko', name: 'Big Kiboko', hp: 5, dims: [92, 72], floats: true, music: 'tour_ke_boss', country: 'ke', brain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.ke_kiboko = [62, 64, 56, 8];
// the arena: a waterhole between two shores; reeds, lily-pad ledges, the reed curtain behind
Tour.pieces['ke.arena_pool'] = (st, o) => {
  const B = st.B, { x0, w, GY } = o, sh = 9, p0 = x0 + sh, p1 = x0 + w - sh - 1;
  for (let x = p0; x <= p1; x++) { for (let y = GY; y < B.H - 1; y++) B.set(x, y, T.WATER); B.set(x, B.H - 1, T.GROUND); }
  B.kePool = [p0 * TS, (p1 + 1) * TS];
  B.spawn('keRiver', p0, GY, { w: p1 - p0 + 1 });
  for (let q = 0; q < 3; q++) { B.set(x0 + 2 + q, GY - 4, T.SEMI); B.set(x0 + w - 5 + q, GY - 4, T.SEMI); }
  // lily pads floating on the pool: hop across them (or swim)
  for (let x = p0 + 2; x <= p1 - 2; x += 4) { B.set(x, GY - 1, T.SEMI); B.set(x + 1, GY - 1, T.SEMI); }
  B.decorAt('keReeds', x0 + 1, GY, 1); B.decorAt('keReeds', p0 - 1, GY, 2); B.decorAt('keReeds', p1 + 1, GY, 3); B.decorAt('keReeds', x0 + w - 2, GY, 4);
};
// the pool's span reaches the built area (the boss reads area.kePool)
{
  const b0 = AreaBuilder.prototype.build;
  AreaBuilder.prototype.build = function (props) { const A = b0.call(this, props); if (this.kePool) A.kePool = this.kePool; if (this.keWarren != null) { A.dig = true; A.surface = this.keWarren - 1; A.tunnelCol = '#4a1e0e'; } return A; };
}
Tour.keKit.KIB = KIB; Tour.keKit.kibBrain = brain;
})();
