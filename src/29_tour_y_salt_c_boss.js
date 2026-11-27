/* ============================================================
   THE TABLE SALT SEA: 34-5 SEASON TO TASTE, and A PINCH, the cork who considers himself a chef.
   The lead-in (the kitchen's long counter): weighing spoons (29_tour_y_salt_a_mech.js, salt.weigh). The boss: a tangerine cork
   in a chef's hat and apron behind his soup pot at the right of his kitchen. In the middle of the floor lies the great
   weighing spoon; on the wall at the left, its dial: a big needle, a gold PINCH band and (phase 3) a little shoe mark
   one weight above it. He is cork: stomping just bounces. Every hit is a correct measure in his soup, by the land's
   own trick: Brady's weight holds the spoon level while A Pinch pours into its bowl; when Brady steps off (both feet
   off it), the spoon tips whatever is in it into the soup. In the gold band: "PERFECT!" (a hit). Short: "BLAND!";
   over it while he stands there: "TOO SALTY!" (no harm done either way, the next measure comes).
     1 ONE FINGER    he holds up one finger (1.0 s), then a steady dusting: stand on the spoon and step off when the
                     needle reaches the gold band. Between measures he seasons the floor: three big crystals' shadows
                     (1.0 s) where they will land, round Brady: step out of them.
     2 TWO FINGERS   two fingers (1.0 s), then a pair of pours: the first is coarse rock salt. Be OFF the spoon for it:
                     the lumps bounce off the tipped spoon and roll away both ways along the floor (jump them). Jump
                     back on for the second, a dusting, and step off at the band.
     3 THE RUB       he rubs finger and thumb (1.0 s), then three tiny trickles; now Brady's own weight counts on the
                     needle: it reads one shoe heavy while he stands there. After the third trickle the needle sits on
                     the shoe mark: step off and it falls back into the band. Off after the second: BLAND.
   Two good measures a phase. At the end he tastes the soup, takes off his hat and gives the shaker the afternoon off.
   ============================================================ */
(function () {
const SK = Tour.saltKit, INK = SK.INK, SA = SK.SaltArt;
const say = (g, b, text, col) => SK.say(g, g.camX + Game.viewW / 2, -1e4, text, col || '#ffffff', 'boss');
// the arena (relative columns, arenaW 24): the spoon from SP0 to SP1 (its bowl the last three), the pot, his stool
const SP0 = 8, SP1 = 14, POT = 16, STOOL = 19;
const BAND = [0.85, 1.15], SHOE = 0.4;

Tour.pieces['salt.arena_kitchen'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o;
  // his stool behind the pot: a block he stands on (out of Brady's way)
  for (let q = STOOL; q < STOOL + 3; q++) B.set(x0 + q, GY - 1, T.HARD);
};

const brain = {
  phases: [4, 2],
  guardText: 'MIND THE HAT!',
  wake(b) {
    b.phase = 1; const x0 = b.arenaX0;
    b.sp0 = x0 + SP0 * TS; b.sp1 = x0 + (SP1 + 1) * TS; b.potX = x0 + (POT + 1) * TS; b.homeX = x0 + (STOOL + 1.5) * TS;
    b.S = 0; b.read = 0; b.tip = 0; b.crystals = []; b.lumps = []; b.good = 0; b.needs = 0;
    say(b.g, b, 'A PINCH, CHEF. STAND ON THE SPOON, PLEASE.', '#ffffff');
    b.go('idle');
  },
  phase(b, n) {
    const g = b.g; b.go('idle'); b.at = -0.8;
    if (n === 2) { g.bannerText = 'TWO FINGERS'; g.bannerT = 2.0; say(g, b, 'THE FIRST POUR IS COARSE. STAY OFF FOR IT.', '#ffffff'); }
    if (n === 3) { g.bannerText = 'THE RUB'; g.bannerT = 2.0; say(g, b, 'YOUR WEIGHT COUNTS NOW. STEP OFF AT THE SHOE.', '#ffffff'); }
  },
  hurt(b) { b.go('season'); },
  touch(b, p) { return true; },   // touching the chef never hurts (his crystals and lumps do)
  hit(b, kind) { if (kind === 'stomp' || kind === 'spin') return 'bounce'; return false; },
  lastHit(b) { say(b.g, b, 'MMM. PERFECT. THE SHAKER HAS THE AFTERNOON OFF.', SA.GOLD); return false; },
  // Brady on the spoon: on the floor, his centre over it
  on(b) { const p = b.g.player; return !!(p && !p.dead && p.onGround && p.cx > b.sp0 && p.cx < b.sp1 && p.y + p.h > b.floorY - 6); },
  // what the needle reads: the salt in the bowl, and in phase 3 Brady's own weight while he stands there
  reading(b) { return b.S + ((b.phase || 1) === 3 && this.on(b) ? SHOE : 0); },
  // the measure is over: tip the spoon into the soup and judge it
  judge(b) {
    const g = b.g, S = b.S; b.tip = 1; b.S = 0;
    if (S >= BAND[0] && S <= BAND[1]) { g.burst(b.potX, b.floorY - 2 * TS, 18, SA.GOLD, 'confetti'); TourKit.sfx('ding', 'secret', { vol: 0.6 }); b.damage(1, { quiet: true }); if (b.state === 'dying' || b.remove) return; say(g, b, pick(['PERFECT! A PINCH EXACTLY.', 'MMM! MAGNIFIQUE.', 'NOW THAT IS SEASONING.']), SA.GOLD); if (b.act !== 'idle') b.go('season'); return; }
    say(g, b, S < BAND[0] ? (S < 0.05 ? 'NOTHING IN THE SPOON?' : 'BLAND! NOT ENOUGH.') : 'TOO SALTY! START AGAIN.', '#ffffff'); b.go('season');
  },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1, fy = b.floorY;
    b.guard = 'bounce';
    if (!b.crystals) this.wake(b);
    b.x = b.homeX - b.w / 2; b.y = fy - TS - b.h + Math.sin(b.t * 3) * 1.5;
    b.tip = Math.max(0, b.tip - dt * 1.5);
    const on = this.on(b);
    b.read = approach(b.read, this.reading(b), dt * 2.5);
    this.hazards(b, dt);
    if (b.act !== 'pour') b.flowing = false;
    if (b.act === 'walk') b.go('idle');
    if (b.act === 'idle') { b.S = 0; if (b.at > 1.4) b.go('tell'); return; }
    if (b.act === 'tell') {
      if (b.first) { say(g, b, ph === 1 ? 'ONE FINGER: A DUSTING.' : ph === 2 ? 'TWO FINGERS: COARSE, THEN FINE.' : 'A RUB: THREE TINY TRICKLES.', '#ffffff'); TourKit.sfx('ahem', 'select', { vol: 0.4, pitch: 0.7 }); }
      if (b.at >= 1.0) { b.S = 0; b.pourK = 0; b.go(ph === 2 ? 'coarse' : 'pour'); }
      return;
    }
    // phase 2's first pour: coarse rock salt. On a level spoon (Brady on it) it lands in the bowl: far too much.
    // On the tipped spoon it bounces off and two lumps roll away along the floor, both ways
    if (b.act === 'coarse') {
      if (b.first) { b.coarseOn = false; b.coarseDone = false; }
      if (b.at > 0.5 && !b.coarseDone) { b.coarseDone = true; if (on) { b.S += 1.3; b.coarseOn = true; this.judge(b); return; } else { const cx = (b.sp0 + b.sp1) / 2; b.lumps.push({ x: cx - TS, d: -1, t: 0 }, { x: cx + TS, d: 1, t: 0 }); TourKit.sfx('thud', 'bump', { vol: 0.6, pitch: 0.6 }); } }
      if (b.at > 1.2) { b.coarseDone = false; b.go('gap'); }
      return;
    }
    if (b.act === 'gap') { if (b.at > 1.4) { b.pourK = 0; b.go('pour'); } return; }
    if (b.act === 'pour') {
      // phase 1 and 2: a steady dusting for 3 s; phase 3: three trickles of 0.4 (0.5 s each, 0.6 s apart)
      let flowing;
      if (ph === 3) { const c = b.at % 1.1; flowing = b.at < 3.3 && c < 0.5; }
      else flowing = b.at < 3.2;
      b.flowing = flowing;
      if (flowing && on) b.S += (ph === 3 ? 0.7 : 0.4) * dt;
      // Brady steps off with salt in the bowl: it tips into the soup
      if (b.wasOn && !on && b.S > 0.05) { this.judge(b); b.wasOn = false; return; }
      b.wasOn = on;
      if (on && this.reading(b) - (ph === 3 ? SHOE : 0) > BAND[1] + 0.02) { this.judge(b); return; }
      // the pour is done and nobody stepped off: in phase 3 he waits a little for Brady (the needle on the shoe mark)
      if (b.at > (ph === 3 ? 6.5 : 4.4)) { if (b.S > 0.05) this.judge(b); else { say(g, b, 'NOBODY ON THE SPOON? TSK.', '#ffffff'); b.go('season'); } }
      return;
    }
    // between measures: he seasons the floor; three crystals' shadows round Brady (1.0 s), then they drop
    if (b.act === 'season') {
      if (b.first) { b.flowing = false; const px = p ? p.cx : b.cx; const xs = [px, px - 3.5 * TS, px + 3.5 * TS].map(x => clamp(x, b.arenaX0 + TS, b.potX - TS)); for (const x of xs) b.crystals.push({ x, t: 0 }); }
      if (b.at > 2.0) b.go('idle');
      return;
    }
    b.go('idle');
  },
  // the falling crystals and the rolling lumps (they hurt; each has its tell)
  hazards(b, dt) {
    const g = b.g, p = g.player, fy = b.floorY;
    for (const c of b.crystals) {
      c.t += dt;
      if (c.t >= 1.0 && !c.hit) { c.hit = true; g.burst(c.x, fy - 4, 10, '#ffffff', 'dust'); TourKit.sfx('crunch', 'bump', { vol: 0.5, pitch: 0.9 }); if (p && !p.dead && Math.abs(p.cx - c.x) < 0.85 * TS && p.y + p.h > fy - 2.2 * TS) p.hurt({ x: c.x - 16, w: 32 }); }
    }
    b.crystals = b.crystals.filter(c => c.t < 1.5);
    for (const L of b.lumps) {
      L.t += dt; L.x += L.d * 3.4 * TS * dt;
      const box = { x: L.x - 12, y: fy - 22, w: 24, h: 22 };
      if (p && !p.dead && overlap(p, box)) p.hurt(box);
    }
    b.lumps = b.lumps.filter(L => L.x > b.arenaX0 + 10 && L.x < b.potX - 10);
  },
  draw(b, ctx, t) {
    // A Pinch: a tangerine cork in a chef's hat and an apron, a little moustache; he holds a shaker over the bowl
    const x = b.cx, y = b.y + b.h, ph = b.phase || 1, tell = b.act === 'tell';
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    SA.cork(ctx, x, y, 58, 74);
    // apron
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x - 20, y - 38); ctx.lineTo(x + 20, y - 38); ctx.lineTo(x + 24, y - 4); ctx.lineTo(x - 24, y - 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the hat
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 22, y - 86, 44, 14); ctx.strokeRect(x - 22, y - 86, 44, 14);
    for (const dx of [-14, 0, 14]) { ctx.beginPath(); ctx.arc(x + dx, y - 92, 13, 0, TAU); ctx.fill(); ctx.stroke(); }
    // face: stern brows, a twirled moustache, eyes on Brady
    const p = b.g.player, look = p ? clamp((p.cx - x) / 200, -1, 1) * 2 : 0;
    ctx.fillStyle = '#ffffff'; for (const dx of [-10, 10]) { ctx.beginPath(); ctx.arc(x + dx, y - 58, 6, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = INK; for (const dx of [-10, 10]) { ctx.beginPath(); ctx.arc(x + dx + look, y - 58, 2.6, 0, TAU); ctx.fill(); }
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 17, y - 68); ctx.lineTo(x - 4, y - 64); ctx.moveTo(x + 17, y - 68); ctx.lineTo(x + 4, y - 64); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(x, y - 47); ctx.quadraticCurveTo(x - 10, y - 51, x - 16, y - 44); ctx.quadraticCurveTo(x - 8, y - 47, x, y - 44); ctx.quadraticCurveTo(x + 8, y - 47, x + 16, y - 44); ctx.quadraticCurveTo(x + 10, y - 51, x, y - 47); ctx.fill();
    ctx.restore();
  }
};
// the spoon, its dial, the pot, the shadows, the crystals and the lumps, in the world over the floor
TourHooks.on('afterEntities', (play, ctx) => {
  const b = play.boss; if (!b || b.style !== 'salt_pinch' || b.remove || !b.crystals) return;
  const fy = b.floorY, t = play.t, on = brain.on(b), ph = b.phase || 1;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
  // the pot (steaming) between the spoon and the chef
  ctx.fillStyle = SA.CHAR; rr(ctx, b.potX - 34, fy - 52, 68, 52, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8a050'; ctx.fillRect(b.potX - 28, fy - 50, 56, 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3; for (let q = -1; q <= 1; q++) { ctx.beginPath(); ctx.moveTo(b.potX + q * 14, fy - 56); ctx.quadraticCurveTo(b.potX + q * 14 + Math.sin(t * 2 + q) * 8, fy - 74, b.potX + q * 14, fy - 92); ctx.stroke(); }
  // the weighing spoon on the floor: a long silver handle, the bowl at the pot end; level with Brady on it, tipped
  // (bowl up toward the pot) while he is off; pulsing gold when it wants him
  const tilt = on ? 0 : 0.08 + b.tip * 0.3, cxs = (b.sp0 + b.sp1) / 2;
  ctx.save(); ctx.translate(cxs, fy - 6); ctx.rotate(-tilt); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
  ctx.fillStyle = '#d8dce8'; rr(ctx, b.sp0 - cxs, -5, b.sp1 - b.sp0 - 2.4 * TS, 9, 4); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(b.sp1 - cxs - 1.4 * TS, -2, 1.5 * TS, 12, 0, 0, TAU); ctx.fill(); ctx.stroke();
  if (b.S > 0.02) { ctx.fillStyle = SA.CRYS; ctx.beginPath(); ctx.ellipse(b.sp1 - cxs - 1.4 * TS, -8, Math.min(1.3, b.S) * TS, 6 + Math.min(1.3, b.S) * 6, 0, Math.PI, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  const want = (b.act === 'pour' && !on) || (b.act === 'gap');
  if (want || (b.act === 'tell' && ph !== 2 && !on)) SA.ring(ctx, cxs, fy, t, true, 3 * TS);
  // the dial on the wall at the left: a big needle over a scale, the gold PINCH band, the shoe mark in phase 3
  const dx = b.arenaX0 + 4.5 * TS, dy = fy - 4.3 * TS, R = 1.8 * TS, ang = v => Math.PI + clamp(v / 1.6, 0, 1) * Math.PI;
  ctx.fillStyle = '#f6f2e8'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dx, dy, R, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 14; ctx.strokeStyle = SA.GOLD; ctx.beginPath(); ctx.arc(dx, dy, R - 12, ang(BAND[0]), ang(BAND[1])); ctx.stroke();
  ctx.lineWidth = 2; ctx.strokeStyle = INK; for (let v = 0; v <= 1.6; v += 0.2) { const a = ang(v); ctx.beginPath(); ctx.moveTo(dx + Math.cos(a) * (R - 4), dy + Math.sin(a) * (R - 4)); ctx.lineTo(dx + Math.cos(a) * (R - 20), dy + Math.sin(a) * (R - 20)); ctx.stroke(); }
  if (ph === 3) { const a = ang(1.05 + SHOE); const sx = dx + Math.cos(a) * (R - 12), sy = dy + Math.sin(a) * (R - 12); ctx.fillStyle = '#c84a3a'; rr(ctx, sx - 9, sy - 5, 18, 10, 4); ctx.fill(); ctx.stroke(); }
  const a = ang(b.read); ctx.lineWidth = 5; ctx.strokeStyle = '#c8323a'; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + Math.cos(a) * (R - 8), dy + Math.sin(a) * (R - 8)); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(dx, dy, 7, 0, TAU); ctx.fill();
  SA.pill(ctx, dx, dy + 16, ph === 3 ? 'STEP OFF AT THE SHOE' : 'STEP OFF IN THE GOLD', SA.GOLD);

  // his arm: the tell held up big (one finger, two fingers, the rub) or the shaker held out over the spoon's bowl
  { const x = b.cx, y = b.y + b.h, tell = b.act === 'tell', hx = x - 46, hy = y - 78;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineCap = 'round';
    if (tell) {
      ctx.beginPath(); ctx.moveTo(x - 26, y - 40); ctx.lineTo(hx, hy + 18); ctx.stroke(); ctx.lineWidth = 2.4; ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(hx, hy + 14, 13, 0, TAU); ctx.fill(); ctx.stroke();
      const n = ph === 3 ? 2 : ph;
      for (let q = 0; q < n; q++) { const fx = hx - 5 + q * 10 + (ph === 3 ? Math.sin(t * 30) * 2.5 * (q ? 1 : -1) : 0); rr(ctx, fx - 4.5, hy - 16 + (ph === 3 && q ? 10 : 0), 9, 28, 4.5); ctx.fill(); ctx.stroke(); }
      if (ph === 3) for (let q = 0; q < 3; q++) { ctx.fillStyle = SA.CRYS; ctx.fillRect(hx - 3 + Math.sin(t * 9 + q) * 6, hy + 30 + ((t * 40 + q * 9) % 26), 3, 3); }
      SA.pill(ctx, hx, hy - 34, ph === 1 ? 'ONE FINGER' : ph === 2 ? 'TWO FINGERS' : 'THE RUB', SA.GOLD);
    } else {
      const sx = b.sp1 - 1.4 * TS, sy = fy - 4.4 * TS;
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 26, y - 40); ctx.quadraticCurveTo(x - 60, sy - 30, sx + 16, sy - 14); ctx.stroke(); ctx.lineWidth = 2.4;
      ctx.fillStyle = SA.COBALT; ctx.fillRect(sx - 16, sy - 32, 32, 28); ctx.strokeRect(sx - 16, sy - 32, 32, 28); ctx.fillStyle = SA.CHAR; ctx.beginPath(); ctx.ellipse(sx, sy - 4, 19, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
      if (b.flowing) SA.stream(ctx, sx, sy + 2, fy - 14, t, ph === 3 ? 0.3 : 0.7);
      if (b.act === 'coarse' && b.at < 0.6) for (let q = 0; q < 3; q++) { const u = Math.min(1, b.at / 0.5); SA.cube(ctx, sx - 16 + q * 11, sy + 12 + u * (fy - sy - 22), 13); }
    }
    ctx.restore(); }
  // the crystals' shadows (the tell) and the crystals falling into them
  for (const c of b.crystals) {
    if (c.t < 1.0) { const k = c.t; ctx.fillStyle = `rgba(20,20,50,${0.25 + 0.35 * k})`; ctx.beginPath(); ctx.ellipse(c.x, fy - 2, 20 + 6 * k, 6, 0, 0, TAU); ctx.fill(); if (c.t > 0.7) SA.cube(ctx, c.x - 14, lerp(fy - 7 * TS, fy, (c.t - 0.7) / 0.3), 28); }
    else SA.cube(ctx, c.x - 14, fy, 28, 1 - (c.t - 1.0) / 0.5);
  }
  for (const L of b.lumps) { ctx.save(); ctx.translate(L.x, fy - 12); ctx.rotate(L.t * 8 * L.d); SA.cube(ctx, -12, 12, 24); ctx.restore(); }
  ctx.restore();
});
const boss = { id: 'salt_pinch', name: 'A Pinch', hp: 6, dims: [70, 100], floats: true, music: 'tour_salt_boss', country: 'salt', brain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.salt_pinch = [20, 20, 20, 20];
Tour.saltKit.pinch = brain;
})();
