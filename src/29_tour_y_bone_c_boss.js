/* ============================================================
   THE SPARE BONE QUARRY: the boss, THE APPROXIMATELY CORRECT ANIMAL (37-5). A replica skeleton that put itself
   together from memory: a museum label on its head, persimmon caps on every joint, each bone not quite where it
   goes. Brady does not beat it by stomping (a stomp just bounces off a plaster back): he helps it fit, one wrong
   bone at a time, and each time a bone is seated it shudders (a hit). Three phases, two seatings each:
   1 THE PADDLE   a broad paddle stuck on its head spins faster and faster (the tell, 1 s; a shadow where it will
                  land, in front of it), then SLAPS down. It lies there a moment: stand under the empty SHOULDER
                  socket (the dashed ring on its side, away from the slap) and THROW to seat it there.
   2 THE HEEL     one enormous heel kicks up dust (the tell; a footprint marks where it will come down), then a
                  headfirst HOP: a ripple of dust runs both ways along the floor (jump it). The heel pops off as it
                  lands: touch it and THROW to send it back to the empty HIP.
   3 THE NECK     its "neck" (a tail really) curls under (the tell; a ring on the floor shows how far it reaches),
                  then it SITS and SWEEPS: stand clear (or jump the curl). The curl is left lying at its back: touch
                  it and THROW to slot it into the TAIL socket. It sits down comfortably and refuses to get up.
   Every window is generous (1.8 s); touching it while a bone lies loose never hurts.
   ============================================================ */
(function () {
const K = Tour.boneKit, INK = K.INK, BA = K.BoneArt, BONE = K.BONE, PERS = K.PERS;
const say = (b, t, c) => TourKit.say(b.g, b, t, c || '#fbf4e0');
const WIN = 1.8;
const waveArt = (c, s) => { c.save(); c.fillStyle = 'rgba(240,220,180,0.95)'; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(s.x, s.y + s.h); c.quadraticCurveTo(s.x + s.w / 2, s.y - 6, s.x + s.w, s.y + s.h); c.closePath(); c.fill(); c.stroke(); c.restore(); };
const nothing = () => {};
const brain = {
  phases: [4, 2],
  guardText: 'PLASTER!',
  wake(b) { b.phase = 1; b.homeX = b.x; say(b, 'I AM A VERY ACCURATE ANIMAL. PROBABLY.'); b.boneClaim = p => brain.claim(b, p); },
  // where its sockets and its loose bone are (pixels)
  shoulder(b) { return { x: b.cx + b.dir * 22, y: b.y + 34 }; },
  hip(b) { return { x: b.cx - b.dir * 30, y: b.y + 30 }; },
  tailSock(b) { return { x: b.cx - b.dir * (b.w / 2 + 2), y: b.y + 40 }; },
  // THROW belongs to the fight while a loose bone can be seated from where Brady stands
  claim(b, p) {
    if (!p || p.dead || b.state !== 'fight') return false;
    if (b.act === 'paddleDown') { const s = this.shoulder(b); return Math.abs(p.cx - s.x) < 1.5 * TS && p.onGround; }
    if ((b.act === 'heelDown' || b.act === 'curlDown') && b.loose) return Math.abs(p.cx - b.loose.x) < 34 && Math.abs(p.y + p.h - b.floorY) < 2 * TS;
    return false;
  },
  phase(b, n) {
    const g = b.g;
    if (n === 2) { g.bannerText = 'THE HEEL!'; g.bannerT = 2; say(b, 'THAT WAS A LEG? THEN WHAT IS THIS HEEL FOR?'); }
    if (n === 3) { g.bannerText = 'THE NECK!'; g.bannerT = 2; say(b, 'MY NECK FEELS... CURLY.'); }
    b.go('recover');
  },
  hurt(b) { b.go('recover'); },
  hit(b, kind) { if (kind === 'stomp' || kind === 'spin') return 'bounce'; if (kind === 'star') return 'bounce'; return false; },
  // a loose bone, a seated bone, recovering: touching it never hurts then
  touch(b, p) { return b.act === 'paddleDown' || b.act === 'heelDown' || b.act === 'curlDown' || b.act === 'recover' || b.act === 'seated'; },
  lastHit(b) { b.go('sit'); b.state = 'fight'; b.sitting = true; return true; },
  seat(b, text) { const g = b.g; b.loose = null; b.damage(1, { text, col: '#ffd88a' }); TourKit.sfx('click', 'select', { vol: 0.8, pitch: 0.7 }); g.burst(b.cx, b.cy, 16, BONE, 'dust'); },
  update(b, dt) {
    const g = b.g, p = g.player, ph = b.phase || 1, I = g.boneIn, pressed = I && I.by === b && I.pressed;
    b.guard = 'bounce';
    if (b.act === 'sit') {
      // the end: it sits down at last, very pleased, and will not get up
      b.vx = 0; this.ground(b, dt);
      if (b.first) { say(b, 'OH. OH THAT\'S NICE. I\'M NOT GETTING UP.', '#ffd88a'); g.burst(b.cx, b.floorY, 20, '#f2c070', 'dust'); }
      if (b.at > 2.2 && !b.done) { b.done = true; b.die(); }
      return;
    }
    if (b.act === 'walk') b.go('trot');
    if (b.act === 'trot') {
      b.face(); b.walk(ph >= 3 ? 1.5 : 1.2); this.ground(b, dt);
      if (b.at > (ph >= 3 ? 0.9 : 1.3)) b.go(ph === 1 ? 'wind' : ph === 2 ? 'kick' : 'curl');
    } else if (b.act === 'recover') {
      b.vx = 0; this.ground(b, dt); if (b.at > 1.1) b.go('trot');
    } else if (b.act === 'wind') {
      // phase 1's tell: the paddle spins over its head, faster; a shadow where it will come down (in front)
      b.vx = 0; this.ground(b, dt);
      if (b.first) { b.face(); b.tx = clamp(b.cx + b.dir * (b.w / 2 + 44), b.arenaX0 + 30, b.arenaX1 - 30); say(b, 'A WING! NO, A FIN! NO...'); TourKit.sfx('whirr', 'select', { vol: 0.4, pitch: 0.5 }); }
      if (b.at > 1.0) { b.go('slap'); g.shake(5); Sound.play('stomp', { pitch: 0.5 }); tourFire(g, b.tx, b.floorY - 30, { vx: 0, w: 72, h: 30, life: 0.3, art: nothing }); g.burst(b.tx, b.floorY, 14, '#f2c070', 'dust'); }
    } else if (b.act === 'slap') {
      b.vx = 0; this.ground(b, dt); if (b.at > 0.2) b.go('paddleDown');
    } else if (b.act === 'paddleDown') {
      // the paddle lies where it slapped; under the empty shoulder, THROW seats it
      b.vx = 0; this.ground(b, dt);
      if (b.first) say(b, 'WHERE DOES THIS GO...', '#ffd88a');
      if (pressed) { b.go('seated'); this.seat(b, 'THE SHOULDER! A FRONT LEG!'); return; }
      if (b.at > WIN) b.go('trot');
    } else if (b.act === 'kick') {
      // phase 2's tell: the big heel scrapes, dust flies; a footprint where it will come down (under Brady)
      b.vx = 0; this.ground(b, dt);
      if (b.first) { b.face(); b.tx = clamp(p ? p.cx : b.cx, b.arenaX0 + b.w / 2 + 8, b.arenaX1 - b.w / 2 - 8); b.sx = b.cx; say(b, 'STAMP STAMP!'); }
      if (Math.random() < 0.4) g.burst(b.cx - b.dir * 30, b.floorY, 1, '#e8c898', 'dust');
      if (b.at > 0.9) { b.go('hop'); Sound.play('spring', { pitch: 0.6, vol: 0.6 }); }
    } else if (b.act === 'hop') {
      // a headfirst hop onto the footprint (a fixed time aloft, so the footprint is honest)
      const T = 0.9, k = Math.min(1, b.at / T), top = b.floorY - b.h;
      b.x = lerp(b.sx, b.tx, k) - b.w / 2; b.y = top - Math.sin(k * Math.PI) * 5 * TS;
      if (k >= 1) {
        b.y = top; g.shake(8); Sound.play('stomp', { pitch: 0.45 }); g.burst(b.cx, b.floorY, 18, '#e8c898', 'dust');
        for (const d of [-1, 1]) tourFire(g, b.cx + d * (b.w / 2 + 6), b.floorY - 20, { vx: d * 5.2 * TS, w: 24, h: 20, ground: true, life: 2.2, col: '#f0dcb4', art: waveArt });
        // the heel pops off and lands a little behind it
        b.loose = { x: clamp(b.cx - b.dir * (b.w / 2 + 40), b.arenaX0 + 20, b.arenaX1 - 20), kind: 'heel' };
        b.go('heelDown');
      }
    } else if (b.act === 'heelDown') {
      b.vx = 0; this.ground(b, dt);
      if (b.first) say(b, 'I SEEM TO HAVE DROPPED A HEEL.', '#ffd88a');
      if (pressed) { b.go('seated'); this.seat(b, 'THE HIP! A BACK LEG!'); return; }
      if (b.at > WIN + 0.6) { b.loose = null; b.go('trot'); }
    } else if (b.act === 'curl') {
      // phase 3's tell: the curly "neck" tucks under; a ring on the floor shows the sweep
      b.vx = 0; this.ground(b, dt);
      if (b.first) { b.face(); say(b, 'TIME FOR A SIT. A BIG SIT.'); }
      if (b.at > 1.0) {
        b.go('sweep'); g.shake(4); Sound.play('stomp', { pitch: 0.6 });
        for (const d of [-1, 1]) tourFire(g, b.cx + d * (b.w / 2 + 34), b.floorY - 12, { vx: d * 1 * TS, w: 68, h: 22, life: 0.45, art: nothing });
      }
    } else if (b.act === 'sweep') {
      b.vx = 0; this.ground(b, dt);
      if (b.at > 0.5) { b.loose = { x: clamp(b.cx - b.dir * (b.w / 2 + 26), b.arenaX0 + 20, b.arenaX1 - 20), kind: 'curl' }; b.go('curlDown'); }
    } else if (b.act === 'curlDown') {
      b.vx = 0; this.ground(b, dt);
      if (b.first) say(b, 'THAT WAS NEVER A NECK, WAS IT.', '#ffd88a');
      if (pressed) { b.go('seated'); this.seat(b, 'THE TAIL SOCKET! A TAIL!'); return; }
      if (b.at > WIN + 0.6) { b.loose = null; b.go('trot'); }
    } else if (b.act === 'seated') {
      b.vx = 0; this.ground(b, dt); if (b.at > 0.9) b.go('recover');
    } else b.go('trot');
    b.clampArena();
  },
  ground(b, dt) { b.vy = Math.min((b.vy || 0) + PHYS.gDown * dt, PHYS.maxFall); b.y += b.vy * dt; if (b.y + b.h >= b.floorY) { b.y = b.floorY - b.h; b.vy = 0; } b.x += (b.vx || 0) * dt; },
  draw(b, ctx, t) {
    const A = b.act, d = b.dir || 1, ph = b.phase || 1, x = b.cx, y = b.y + b.h;
    const sit = A === 'sit' || A === 'sweep' || A === 'curlDown', crouch = A === 'wind' || A === 'kick' || A === 'curl' ? 4 : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(d, 1); ctx.strokeStyle = INK; ctx.lineJoin = 'round';
    if (A === 'hop') ctx.rotate(0.35 * Math.sin(Math.min(1, b.at / 0.9) * Math.PI));
    const hipY = sit ? -24 : -54 + crouch, shY = -58 + crouch;
    // legs: front pair at x 26, back pair at x -26 (sitting: the back legs fold)
    const step = A === 'trot' ? Math.sin(t * 10) * 6 : 0;
    const leg = (lx, ly, fx, big) => { BA.bone(ctx, lx, ly, fx, -6, 9, true); ctx.fillStyle = BONE; ctx.lineWidth = 2; if (big) { ctx.beginPath(); ctx.ellipse(fx + 4, -6, 16, 9, 0, 0, TAU); ctx.fill(); ctx.stroke(); } else { ctx.beginPath(); ctx.ellipse(fx + 3, -4, 8, 4, 0, 0, TAU); ctx.fill(); ctx.stroke(); } };
    if (sit) { BA.bone(ctx, -30, hipY, -10, -6, 10, true); BA.bone(ctx, -44, hipY, -40, -6, 10, true); }
    else { leg(-34, hipY, -38 + step, false); leg(-22, hipY, -20 - step, false); }
    leg(22, shY, 18 - step, false);
    leg(32, shY, 34 + step, ph === 2 && !b.loose && A !== 'seated');
    // the spine and the ribs
    ctx.lineWidth = 2.4; BA.bone(ctx, -40, hipY - 4, 34, shY - 6, 11, false);
    for (let k = 0; k < 5; k++) { const rx = -22 + k * 11, ry = lerp(hipY - 2, shY - 4, (k + 1) / 6); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(rx, ry + 12, 14, Math.PI * 1.15, Math.PI * 1.85, false); ctx.stroke(); ctx.strokeStyle = BONE; ctx.lineWidth = 3.4; ctx.stroke(); }
    for (const [jx, jy] of [[-40, hipY - 4], [34, shY - 6]]) BA.joint(ctx, jx, jy, 7);
    // the sockets it is missing: dashed rings (shoulder phase 1, hip phase 2, tail phase 3)
    const ring = (rx, ry, on) => { ctx.save(); ctx.lineWidth = 3; ctx.setLineDash([4, 4]); ctx.strokeStyle = on ? '#ffd84a' : 'rgba(40,20,10,0.8)'; ctx.fillStyle = 'rgba(40,20,10,0.6)'; ctx.beginPath(); ctx.arc(rx, ry, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); };
    const open = A === 'paddleDown' || A === 'heelDown' || A === 'curlDown';
    if (ph === 1) ring(22, shY + 6, open && Math.sin(t * 10) > 0);
    if (ph === 2) ring(-30, hipY + 4, open && Math.sin(t * 10) > 0);
    if (ph === 3) ring(-52, hipY + 2, open && Math.sin(t * 10) > 0);
    // the tail (phase 1-2: a short stub; phase 3: it is missing, its socket shows)
    if (ph < 3) BA.bone(ctx, -44, hipY - 2, -66, hipY - 16, 7, true);
    // the neck and the head: phase 3's neck is a curly tail (it curls under for the sweep)
    const hx = 52, hy = shY - 26;
    if (ph === 3 && A !== 'sit') {
      const cu = A === 'curl' ? Math.min(1, b.at) : A === 'sweep' ? 1 : 0;
      ctx.strokeStyle = INK; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(34, shY - 6);
      for (let k = 1; k <= 10; k++) { const a = -1.2 + k * 0.5 * (1 + cu), r = 26 - k * 1.6; ctx.lineTo(40 + Math.cos(a) * r, shY - 14 + Math.sin(a) * r + cu * 30); } ctx.stroke();
      ctx.strokeStyle = BONE; ctx.lineWidth = 7; ctx.stroke();
      for (let k = 1; k <= 10; k += 2) { const a = -1.2 + k * 0.5 * (1 + cu), r = 26 - k * 1.6; BA.joint(ctx, 40 + Math.cos(a) * r, shY - 14 + Math.sin(a) * r + cu * 30, 4); }
    } else BA.bone(ctx, 34, shY - 6, hx - 6, hy + 8, 10, true);
    // the skull: a long comic head, a big toothy grin, a museum label on a stick on top
    const hyy = ph === 3 && A !== 'sit' ? hy - 10 : hy;
    ctx.fillStyle = BONE; ctx.lineWidth = 2.4; ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.moveTo(hx - 14, hyy - 12); ctx.quadraticCurveTo(hx + 8, hyy - 20, hx + 30, hyy - 6); ctx.lineTo(hx + 30, hyy + 6); ctx.quadraticCurveTo(hx + 8, hyy + 14, hx - 14, hyy + 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(hx + 4 + k * 6, hyy + 4); ctx.lineTo(hx + 7 + k * 6, hyy + 10); ctx.lineTo(hx + 10 + k * 6, hyy + 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(hx + 2, hyy - 6, 5, b.hurtT > 0 ? 1.5 : 6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(hx + 3, hyy - 8, 1.8, 0, TAU); ctx.fill();
    // the label stick (in phase 1 the paddle is stuck on it instead, spinning)
    ctx.save(); ctx.translate(hx - 4, hyy - 16);
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-1.5, -20, 3, 20); ctx.strokeRect(-1.5, -20, 3, 20);
    if (ph === 1 && A !== 'slap' && A !== 'paddleDown' && A !== 'seated') {
      ctx.rotate(A === 'wind' ? t * (6 + b.at * 14) : Math.sin(t * 2) * 0.3);
      ctx.fillStyle = BONE; ctx.beginPath(); ctx.ellipse(0, -24, 30, 9, 0, 0, TAU); ctx.fill(); ctx.stroke(); BA.joint(ctx, 0, -24, 5);
    } else { ctx.fillStyle = '#fbf4e0'; rr(ctx, -22, -36, 44, 16, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(A === 'sit' ? 'COMFY' : 'APPROX.', 0, -28); }
    ctx.restore();
    ctx.restore();
    // the loose bone on the floor (glowing: it can be seated now)
    if (b.loose) { const L = b.loose, k = 0.5 + 0.5 * Math.sin(t * 8); ctx.save(); ctx.strokeStyle = `rgba(255,216,138,${0.5 + 0.4 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(L.x, b.floorY - 8, 26, 10, 0, 0, TAU); ctx.stroke(); if (L.kind === 'heel') { ctx.fillStyle = BONE; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(L.x, b.floorY - 10, 18, 10, 0, 0, TAU); ctx.fill(); ctx.stroke(); BA.joint(ctx, L.x - 12, b.floorY - 14, 5); } else { ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(L.x, b.floorY - 14, 12, 0.5, TAU - 0.3); ctx.stroke(); ctx.strokeStyle = BONE; ctx.lineWidth = 6; ctx.stroke(); } ctx.restore(); }
  }
};
// the tells on the floor: the paddle's shadow, the footprint, the sweep ring; and the paddle lying where it slapped
TourHooks.on('afterEntities', (play, ctx) => {
  const b = play.boss; if (!b || b.style !== 'bone_animal' || b.remove || b.state !== 'fight') return;
  const A = b.act, t = b.t;
  ctx.save();
  if (A === 'wind' || A === 'slap' || A === 'paddleDown') {
    const k = A === 'wind' ? Math.min(1, b.at) : 1;
    ctx.fillStyle = `rgba(30,15,5,${0.2 + 0.35 * k})`; ctx.beginPath(); ctx.ellipse(b.tx, b.floorY - 2, 30 + 10 * k, 7, 0, 0, TAU); ctx.fill();
    if (A !== 'wind') { ctx.fillStyle = BONE; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(b.tx, b.floorY - 8, 32, 9, 0, 0, TAU); ctx.fill(); ctx.stroke(); BA.joint(ctx, b.tx - 28, b.floorY - 8, 5); }
    if (A === 'paddleDown') { const s = brain.shoulder(b), k2 = 0.5 + 0.5 * Math.sin(t * 8); ctx.strokeStyle = `rgba(255,216,138,${0.5 + 0.4 * k2})`; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.ellipse(s.x, b.floorY - 3, 1.5 * TS, 7, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
  }
  if (A === 'kick') { const k = Math.min(1, b.at / 0.9); ctx.fillStyle = `rgba(30,15,5,${0.2 + 0.4 * k})`; ctx.save(); ctx.translate(b.tx, b.floorY - 3); ctx.scale(1, 0.4); BA.print(ctx, 0, 0, 2, 0, 2.4, 'rgba(60,30,10,0.7)'); ctx.restore(); ctx.strokeStyle = `rgba(255,90,60,${0.4 + 0.5 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(b.tx, b.floorY - 3, 28, 7, 0, 0, TAU); ctx.stroke(); }
  if (A === 'curl') { const k = Math.min(1, b.at); ctx.strokeStyle = `rgba(255,90,60,${0.4 + 0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(b.cx, b.floorY - 3, b.w / 2 + 68, 9, 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
});
const boss = { id: 'bone_animal', name: 'The Approximately Correct Animal', hp: 6, dims: [104, 78], music: 'tour_bone_boss', country: 'bone', brain };
Tour.boss(boss);
if (typeof BOSS_INK_REACH !== 'undefined') BOSS_INK_REACH.bone_animal = [80, 90, 70, 20];
// the dig: a pit floor with string lines, two low trestles to jump the ripples from, lamps
Tour.pieces['bone.arena_dig'] = function (st, o) {
  const B = st.B, { x0, w, GY } = o;
  for (let q = 0; q < 3; q++) { B.set(x0 + 3 + q, GY - 3, T.SEMI); B.set(x0 + w - 6 + q, GY - 3, T.SEMI); }
  B.decorAt('boneLamp', x0 + 1, GY, 1); B.decorAt('boneLamp', x0 + w - 2, GY, 2); B.decorAt('boneLabel', x0 + 9, GY, 3); B.decorAt('boneCrate', x0 + w - 12, GY, 4);
};
Tour.boneKit.animalBrain = brain;
})();
