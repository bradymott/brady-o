/* ============================================================
   PUPO STANDARD TIME: the six secret rooms (docs/design/CHATGPT_RELAY.md B31-B35 and the A7 finale room), each its
   own place and its own game, re-dressed as Pupo's dream. All are built with the toolkit's room kit (TourRooms.def):
   the prize cage opens the moment the room is won, a miss resets that turn and costs nothing.
     pstKnock    32-1 KNOCK KNOCK          a sleepy lamb strolls behind three pillow-fort windows; aim the cork
                                            popgun (stick), fire (THROW): knock at all three in order as it passes
     pstCore     32-2 THE PILLOW SAMPLE     a cutaway pillow drifts to and fro with three sleep bubbles in it; steer
                                            the hollow punch (stick), drive it down (THROW): one core through all three
     pstTray     32-3 ONE TRIP, THREE COCOAS steer the wobbling tray against its tilt (stick) as three mugs slide;
                                            serve (THROW) when the sleepwalking waiter's hands reach the counter
     pstCaps     32-4 NIGHTCAP STAND        move the bedpost (stick) under each falling nightcap; they land crooked:
                                            catch four and hold the tower through one full wobble
     pstPour     32-5 THE EVEN POUR         tilt the two-spouted warm-milk jug (stick) toward the lower mug; empty it
                                            with both mugs inside the marked band
     pstPrivacy  32-6 A LITTLE PRIVACY      hold THROW on the quilt's edge and walk it up over Pupo until only his
                                            nose sticks out; then stay still while his three snores embroider three
                                            little clouds in it
   A mounted game: stand on the honey mark and press THROW to take the prop; the stick aims or steers, THROW plays,
   JUMP lets go. While mounted Brady stands still.
   ============================================================ */
(function () {
const K = Tour.pstKit; if (!K || typeof TourRooms === 'undefined') return;
const { PstArt, INK, HONEY, HONEY_HI, HONEY_LO, PLUM, PLUM_HI, PLUM_LO, MINT, MINT_HI, MINT_LO, CREAM, CREAM_LO } = K;
const RK = TourRoomKit;
const ROW = TS;
const say = (play, txt, col) => { const p = play.player; if (p) play.parts.text(p.cx, p.y - 24, txt, col || '#fff4dc'); };
const miss = (play, txt) => { Sound.play('bump', { vol: 0.5, pitch: 0.7 }); play.bannerText = txt; play.bannerT = 1.2; };

/* ---------- the mount: stand on the mark, THROW takes the prop, JUMP lets go ---------- */
const mountStep = (play, A, R, kit, dt) => {
  const p = play.player, mx = kit.data.mark * TS + TS / 2;
  const on = p && p.onGround && !p.dead && Math.abs(p.cx - mx) < 20 && Math.abs(p.y + p.h - (kit.data.markRow + 1) * TS) < 6;
  if (!R.pstMount && on && Input.actionPressed && !R.won) { R.pstMount = true; R.mountT = 0; Sound.play('select', { vol: 0.5 }); }
  else if (R.pstMount && (Input.jumpPressed || R.won)) { R.pstMount = false; }
  if (R.pstMount) { R.mountT += dt || 1 / 120; p.x = approach(p.x, mx - p.w / 2, 4); p.vx = 0; }
  R.near = on;
  return R.pstMount;
};
// while mounted the stick and buttons belong to the prop: Brady holds still
{
  const pu0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const A = this.g && this.g.area, R = A && A.roomState;
    if (R && (R.pstMount || R.pstGrip != null) && inp) {
      if (R.pstMount) inp = { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false, action: false, actionPressed: false };
      else inp = Object.assign({}, inp, { action: false, actionPressed: false });
    }
    return pu0.call(this, dt, inp);
  };
}
// the mark on the floor (a honey cushion pad with the prop's icon) and the hint over it
const drawMark = (play, ctx, A, R, kit, label) => {
  const x = kit.data.mark * TS + TS / 2, y = (kit.data.markRow + 1) * TS;
  ctx.save(); PstArt.cushion(ctx, x - 20, y - 8, 40, 10, HONEY, HONEY_LO, HONEY_HI);
  if (!R.pstMount && !R.won && R.near) { ctx.fillStyle = '#ffffff'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(label || 'THROW: TAKE IT', x, y - 70); }
  ctx.restore();
};
// the common room: the way in on the left, the game's mark in the middle of the band, the cage at the right
const makeRoom = (keep, A, o, extra) => {
  const W = 30 + RK.eastW(keep, o), g = RK.room(W), Y = RK.Y;
  const x0 = g.west(keep), x1 = RK.east(g, keep, A, o);
  const mid = Math.max(x0 + 6, Math.min(x1 - 4, 15));
  g.winSpot(A.id, mid, Y);
  g.data.mark = mid; g.data.markRow = Y; g.data.x0 = x0; g.data.x1 = x1;
  if (extra) extra(g, mid, Y);
  return g;
};

/* ================= pstKnock: KNOCK KNOCK ================= */
const FORT_DX = [-6, 0, 6];
TourRooms.def('pstKnock', {
  title: 'KNOCK KNOCK', rule: 'STAND ON THE MARK, THROW TO TAKE THE POPGUN. AIM WITH THE STICK AND LOB A CORK INTO EACH WINDOW IN TURN AS THE LAMB PASSES IT', need: 'KNOCK AT ALL THREE FIRST!',
  make(o, keep, ctx, A, rng) { return makeRoom(keep, A, o, (g, mid) => { g.hline(mid - 8, mid + 8, 8, '-'); g.coins(mid - 2, mid + 2, 6); }); },
  enter(play, A, R, kit) { R.next = 0; R.aim = -Math.PI / 2; R.cork = null; R.lambT = 0; },
  lamb(kit, t) {
    // window 0 -> 1 -> 2 -> 1 -> 0 ...: 2.4 s at each, 1.0 s between
    const seq = [0, 1, 2, 1], seg = 3.4, q = t % (seq.length * seg), i = Math.floor(q / seg), f = q - i * seg;
    const a = seq[i], b = seq[(i + 1) % seq.length], k = f < 2.4 ? 0 : (f - 2.4) / 1.0;
    return { x: (kit.data.mark + lerp(FORT_DX[a], FORT_DX[b], easeInOut(k))) * TS + TS / 2, at: f < 2.4 ? a : -1 };
  },
  update(play, dt, A, R, kit) {
    R.lambT = (R.lambT || 0) + dt;
    if (R.won) return;
    const mounted = mountStep(play, A, R, kit, dt), p = play.player;
    if (mounted) {
      if (Input.left) R.aim -= 1.3 * dt; if (Input.right) R.aim += 1.3 * dt;
      R.aim = clamp(R.aim, -Math.PI * 0.88, -Math.PI * 0.12);
      if (Input.actionPressed && !R.cork && R.mountT > 0.1) { R.cork = { x: p.cx, y: p.y + 6, vx: Math.cos(R.aim) * 540, vy: Math.sin(R.aim) * 540 }; Sound.play('pick', { vol: 0.5, pitch: 1.6 }); }
    }
    if (R.cork) {
      const c = R.cork; c.vy += 760 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      const wy = 8 * TS - 44;
      for (let k = 0; k < 3; k++) {
        const wx = (kit.data.mark + FORT_DX[k]) * TS + TS / 2;
        if (c.vy > 0 && Math.abs(c.x - wx) < 16 && Math.abs(c.y - wy) < 16) {
          const L = this.lamb(kit, R.lambT);
          if (L.at === k && k === R.next) { R.next++; Sound.play('coin', { vol: 0.6, pitch: 1 + R.next * 0.2 }); play.parts.text(wx, wy - 20, 'KNOCK ' + R.next + '!', '#fff4dc'); if (R.next >= 3) TourRooms.win(play, A, R, { text: 'COME IN, COME IN!', coins: 4 }); }
          else { miss(play, L.at === k ? 'WRONG ORDER! FROM THE START' : 'NOBODY HOME! FROM THE START'); R.next = 0; }
          R.cork = null; return;
        }
      }
      if (c.y > (kit.data.markRow + 1) * TS || c.x < 0 || c.x > A.W * TS || c.y < -40) { if (c.y > 0) { miss(play, 'MISSED! FROM THE START'); R.next = 0; } R.cork = null; }
    }
  },
  draw(play, ctx, A, R, kit) {
    const mx = kit.data.mark, t = R.lambT || 0, wy = 8 * TS - 44;
    ctx.save(); ctx.lineJoin = 'round';
    // the lamb behind the windows (drawn first: the forts are in front)
    const L = this.lamb(kit, t);
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); for (let k = 0; k < 7; k++) ctx.arc(L.x - 12 + (k % 4) * 8, wy - 4 + Math.floor(k / 4) * 8, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a2a3a'; ctx.beginPath(); ctx.ellipse(L.x + 14, wy, 8, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(L.x + 12, wy - 1); ctx.lineTo(L.x + 14, wy); ctx.moveTo(L.x + 16, wy - 1); ctx.lineTo(L.x + 18, wy); ctx.stroke();
    // three pillow forts with round windows
    for (let k = 0; k < 3; k++) {
      const fx = (mx + FORT_DX[k]) * TS + TS / 2, done = k < R.next;
      ctx.fillStyle = k === 1 ? PLUM_HI : HONEY; ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(fx - 50, 8 * TS); ctx.lineTo(fx - 44, wy - 26); ctx.quadraticCurveTo(fx, wy - 70, fx + 44, wy - 26); ctx.lineTo(fx + 50, 8 * TS); ctx.closePath();
      ctx.save(); ctx.clip(); ctx.fillRect(fx - 60, wy - 80, 120, 120); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(fx, wy, 15, 0, TAU); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(fx - 50, 8 * TS); ctx.lineTo(fx - 44, wy - 26); ctx.quadraticCurveTo(fx, wy - 70, fx + 44, wy - 26); ctx.lineTo(fx + 50, 8 * TS); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.arc(fx, wy, 15, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = done ? MINT : CREAM; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = INK;
      ctx.fillStyle = INK; ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(String(k + 1), fx, wy - 30);
    }
    // the popgun on Brady's shoulder and its aim, the cork
    const p = play.player;
    if (R.pstMount && p && !R.won) {
      ctx.fillStyle = 'rgba(255,244,220,0.8)'; let x = p.cx, y = p.y + 6, vx = Math.cos(R.aim) * 540, vy = Math.sin(R.aim) * 540;
      for (let k = 0; k < 14; k++) { for (let s = 0; s < 4; s++) { vy += 760 / 120; x += vx / 120; y += vy / 120; } ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill(); }
      ctx.save(); ctx.translate(p.cx, p.y + 6); ctx.rotate(R.aim); ctx.fillStyle = MINT_LO; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, 0, -5, 26, 10, 4); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    if (R.cork) { ctx.fillStyle = '#c8a070'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(R.cork.x, R.cork.y, 6, 4.5, Math.atan2(R.cork.vy, R.cork.vx), 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    drawMark(play, ctx, A, R, kit, 'THROW: TAKE THE POPGUN');
    if (!R.won && R.pstMount) TourRooms.hudText(play, ctx, 'KNOCKS ' + R.next + ' / 3', '#ffd84a', 13);
  }
});
TourRooms.kinds.pstKnock.testWin = function (g, A, R, kit, frame) {
  const p = g.player; p.x = kit.data.mark * TS + TS / 2 - p.w / 2; p.y = (kit.data.markRow + 1) * TS - p.h; p.vy = 0;
  for (let k = 0; k < 20; k++) frame(g, {}); frame(g, { action: true, actionPressed: true }); for (let k = 0; k < 20; k++) frame(g, {});
  // fire at a window as the lamb settles at it (the aim is set where a player would steer it)
  const K0 = TourRooms.kinds.pstKnock;
  for (let n = 0; n < 3 && !R.won; n++) {
    // wait for the lamb to arrive at the window (a fresh arrival, so it stays while the cork flies)
    for (let k = 0; k < 120 * 12 && K0.lamb(kit, R.lambT).at === n; k++) frame(g, {});
    for (let k = 0; k < 120 * 12 && K0.lamb(kit, R.lambT).at !== n; k++) frame(g, {});
    for (let k = 0; k < 12; k++) frame(g, {});
    const wx = (kit.data.mark + FORT_DX[n]) * TS + TS / 2, wy = 8 * TS - 44, sx = p.cx, sy = p.y + 6;
    // the aim that drops the cork through the window (searched the way a player nudges the stick)
    let best = null; for (let a = -Math.PI * 0.88; a <= -Math.PI * 0.12; a += 0.005) { let x = sx, y = sy, vx = Math.cos(a) * 540, vy = Math.sin(a) * 540, dmin = 1e9; for (let s = 0; s < 240; s++) { vy += 760 / 120; x += vx / 120; y += vy / 120; if (vy > 0) dmin = Math.min(dmin, Math.hypot(x - wx, y - wy)); } if (!best || dmin < best.d) best = { a, d: dmin }; }
    R.aim = best.a; frame(g, { action: true, actionPressed: true });
    for (let k = 0; k < 120 && R.cork; k++) frame(g, {});
  }
};

/* ================= pstCore: THE PILLOW SAMPLE ================= */
TourRooms.def('pstCore', {
  title: 'THE PILLOW SAMPLE', rule: 'TAKE THE PUNCH ON THE MARK (THROW). STEER IT WITH THE STICK, THROW TO PUNCH: ONE CORE THROUGH ALL THREE SLEEP BUBBLES', need: 'TAKE A PERFECT CORE FIRST!',
  make(o, keep, ctx, A, rng) { return makeRoom(keep, A, o, (g, mid) => { g.coins(mid - 3, mid + 3, 4); }); },
  enter(play, A, R, kit) { R.px = kit.data.mark * TS + TS / 2; R.drop = null; R.st = 0; this.layout(R); },
  layout(R) { const r = Math.random; R.base = (r() - 0.5) * 4 * TS; R.d = [(r() - 0.5) * 14, (r() - 0.5) * 14, (r() - 0.5) * 14]; R.sample = null; },
  pillowX(kit, R) { return kit.data.mark * TS + TS / 2 + Math.sin((R.st || 0) * 0.5) * TS; },
  bubbles(kit, R) { const x = this.pillowX(kit, R) + R.base; return R.d.map((d, k) => ({ x: x + d, y: 5.5 * TS + 22 + k * 28 })); },
  update(play, dt, A, R, kit) {
    if (!R.drop) R.st = (R.st || 0) + dt;
    if (R.won) return;
    const mounted = mountStep(play, A, R, kit, dt);
    if (R.drop) {
      R.drop.t += dt;
      if (R.drop.t >= 0.35 && !R.drop.done) {
        R.drop.done = true;
        const hit = R.drop.hit;
        R.sample = hit;
        if (hit.every(Boolean)) TourRooms.win(play, A, R, { text: 'A PERFECT CORE!', coins: 4 });
        else { miss(play, hit.filter(Boolean).length + ' OF 3. A NEW PILLOW...'); }
      }
      if (R.drop.t > 1.1) { R.drop = null; if (!R.won) this.layout(R); }
      return;
    }
    if (mounted) {
      if (Input.left) R.px -= 3.2 * TS * dt; if (Input.right) R.px += 3.2 * TS * dt;
      const cx = kit.data.mark * TS + TS / 2; R.px = clamp(R.px, cx - 7 * TS, cx + 7 * TS);
      if (Input.actionPressed && R.mountT > 0.1) { R.drop = { t: 0, hit: this.bubbles(kit, R).map(b => Math.abs(b.x - R.px) < 13), at: R.st }; Sound.play('stomp', { vol: 0.5, pitch: 1.4 }); }
    }
  },
  draw(play, ctx, A, R, kit) {
    const px = this.pillowX(kit, R) + (R.base || 0), top = 5.5 * TS, w = 8 * TS, h = 3.4 * TS;
    ctx.save();
    // the cutaway pillow on its little stand: plum case, cream stuffing inside, three bubbles
    ctx.fillStyle = PLUM; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; rr(ctx, px - w / 2 - 6, top - 6, w + 12, h + 12, 22); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff4e0'; rr(ctx, px - w / 2, top, w, h, 18); ctx.fill();
    ctx.strokeStyle = CREAM_LO; ctx.lineWidth = 1; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(px - w / 2 + 20 + k * 26, top + 20 + (k % 3) * 26, 9, 0.5, 2.5); ctx.stroke(); }
    for (const b of this.bubbles(kit, R)) { ctx.fillStyle = 'rgba(160,220,255,0.85)'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(b.x, b.y, 13, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(b.x - 4, b.y - 4, 3, 0, TAU); ctx.fill(); }
    // the hollow punch: a brass tube on a rail above, its core column
    const k = R.drop ? Math.min(1, R.drop.t / 0.35) : 0, py = top - 26 + k * (h + 20);
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(kit.data.mark * TS - 7 * TS, top - 34); ctx.lineTo(kit.data.mark * TS + 8 * TS, top - 34); ctx.stroke();
    ctx.fillStyle = '#d8b060'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(R.px - 9, py - 30, 18, 40); ctx.strokeRect(R.px - 9, py - 30, 18, 40);
    ctx.fillStyle = '#1a0a14'; ctx.fillRect(R.px - 4, py + 4, 8, 6);
    if (!R.drop && R.pstMount) { ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(R.px, top); ctx.lineTo(R.px, top + h); ctx.stroke(); ctx.setLineDash([]); }
    // the sample just taken: a little column with the bubbles it caught
    if (R.sample) { const sx = kit.data.mark * TS + TS / 2 + 9 * TS, sy = top + 10; ctx.fillStyle = '#fff4e0'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(sx - 8, sy, 16, h); ctx.strokeRect(sx - 8, sy, 16, h); R.sample.forEach((hit, q) => { ctx.fillStyle = hit ? 'rgba(160,220,255,0.95)' : 'rgba(200,200,200,0.4)'; ctx.beginPath(); ctx.arc(sx, sy + 22 + q * 28, 6, 0, TAU); ctx.fill(); }); }
    ctx.restore();
    drawMark(play, ctx, A, R, kit, 'THROW: TAKE THE PUNCH');
    if (!R.won && R.pstMount) TourRooms.hudText(play, ctx, 'ONE CORE THROUGH ALL THREE', '#ffd84a', 13);
  }
});
TourRooms.kinds.pstCore.testWin = function (g, A, R, kit, frame) {
  const p = g.player, K0 = TourRooms.kinds.pstCore; p.x = kit.data.mark * TS + TS / 2 - p.w / 2; p.y = (kit.data.markRow + 1) * TS - p.h; p.vy = 0;
  for (let k = 0; k < 20; k++) frame(g, {}); frame(g, { action: true, actionPressed: true }); for (let k = 0; k < 20; k++) frame(g, {});
  // steer the punch over the column where the three overlap 0.35 s from now, then punch
  for (let tries = 0; tries < 4 && !R.won; tries++) {
    // follow the overlap with the stick (it sways with the pillow), punch when the punch is over it
    for (let k = 0; k < 900; k++) {
      const B = K0.bubbles(kit, R), lo = Math.max(...B.map(b => b.x)) - 12, hi = Math.min(...B.map(b => b.x)) + 12, target = (lo + hi) / 2;
      if (R.px > lo + 1 && R.px < hi - 1) break;
      frame(g, { left: R.px > target, right: R.px < target });
    }
    frame(g, { action: true, actionPressed: true }); for (let k = 0; k < 150; k++) frame(g, {});
  }
};

/* ================= pstTray: ONE TRIP, THREE COCOAS ================= */
TourRooms.def('pstTray', {
  title: 'ONE TRIP, THREE COCOAS', rule: 'TAKE THE TRAY ON THE MARK (THROW). TILT IT AGAINST THE WOBBLE WITH THE STICK. WHEN THE WAITER\'S HANDS REACH THE COUNTER: THROW TO SERVE', need: 'SERVE ALL THREE FIRST!',
  make(o, keep, ctx, A, rng) { return makeRoom(keep, A, o, (g, mid) => { g.coins(mid - 6, mid - 4, 8); g.coins(mid + 4, mid + 6, 8); }); },
  enter(play, A, R, kit) { this.reset(R); R.st = 0; },
  reset(R) { R.mugs = [-0.4, 0, 0.4].map(u => ({ u, v: 0, off: 0 })); R.tilt = 0; R.ctl = 0; R.prog = 0; R.serveT = null; },
  update(play, dt, A, R, kit) {
    R.st = (R.st || 0) + dt;
    if (R.won) return;
    const mounted = mountStep(play, A, R, kit, dt), t = R.st;
    const wob = 0.16 * Math.sin(t * 1.25) + 0.1 * Math.sin(t * 2.7 + 1) + 0.05 * Math.sin(t * 4.3);
    if (mounted) { if (Input.left) R.ctl -= 0.9 * dt; if (Input.right) R.ctl += 0.9 * dt; R.ctl = clamp(R.ctl, -0.5, 0.5); }
    else R.ctl = approach(R.ctl, 0, dt);
    R.tilt = wob + R.ctl;
    if (!mounted) return;
    // the mugs slide down the tilt (u: -1..1 along the tray); off the rim: it tips; that turn starts over
    for (const m of R.mugs) { m.v += Math.sin(R.tilt) * 1.6 * dt; m.v *= Math.pow(0.35, dt); m.u += m.v * dt; if (Math.abs(m.u) > 1) { miss(play, 'A COCOA SLID OFF! AGAIN...'); this.reset(R); return; } }
    if (R.serveT == null) { R.prog += dt / 11; if (R.prog >= 1) { R.serveT = 0; say(play, 'SERVE! (THROW)'); Sound.play('select', { vol: 0.6, pitch: 1.4 }); } }
    else { R.serveT += dt; if (Input.actionPressed) { TourRooms.win(play, A, R, { text: 'THREE COCOAS, NOT A DROP SPILT!', coins: 4 }); return; } if (R.serveT > 2.0) { miss(play, 'TOO LATE: THEY WENT COLD. AGAIN...'); this.reset(R); } }
  },
  draw(play, ctx, A, R, kit) {
    const cx = kit.data.mark * TS + TS / 2, ty = 6.6 * TS, half = 2.6 * TS;
    ctx.save(); ctx.lineJoin = 'round';
    // the counter at the right and the waiter's clock-hand arms reaching for it
    const kx = cx + 8 * TS; ctx.fillStyle = '#8a5a3a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(kx - 30, 7 * TS, 60, 4 * TS); ctx.strokeRect(kx - 30, 7 * TS, 60, 4 * TS); ctx.fillStyle = CREAM; ctx.fillRect(kx - 34, 7 * TS - 6, 68, 8); ctx.strokeRect(kx - 34, 7 * TS - 6, 68, 8);
    const wx = cx - 8 * TS; ctx.fillStyle = PLUM_HI; ctx.beginPath(); ctx.ellipse(wx, 8.2 * TS, 22, 34, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(wx, 6.6 * TS, 16, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(wx - 8, 6.6 * TS); ctx.lineTo(wx - 3, 6.6 * TS); ctx.moveTo(wx + 3, 6.6 * TS); ctx.lineTo(wx + 8, 6.6 * TS); ctx.stroke();
    const reach = (R.prog || 0) * (kx - wx - 50);
    PstArt.hand(ctx, wx + 16, 7.6 * TS, 30 + reach, 0, MINT, 4); PstArt.hand(ctx, wx + 16, 8.2 * TS, 26 + reach, 0.04, HONEY, 4);
    // the tray and its three mugs
    ctx.save(); ctx.translate(cx, ty); ctx.rotate(R.tilt || 0);
    ctx.fillStyle = '#c8c8d4'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; rr(ctx, -half - 8, 0, 2 * half + 16, 8, 4); ctx.fill(); ctx.stroke();
    for (const m of R.mugs || []) { const x = m.u * half; ctx.fillStyle = CREAM; ctx.lineWidth = 2; rr(ctx, x - 11, -24, 22, 24, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 12, -12, 6, -1.2, 1.2); ctx.stroke(); ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x - 8, -21, 16, 4); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(x - 2, -32 - Math.sin(R.st * 3 + x) * 3, 3, 0, TAU); ctx.fill(); }
    ctx.restore();
    // the tray's arms down to Brady's hands
    const p = play.player; if (R.pstMount && p) { ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.cx - 8, p.y + 20); ctx.lineTo(cx - 10, ty + 8); ctx.moveTo(p.cx + 8, p.y + 20); ctx.lineTo(cx + 10, ty + 8); ctx.stroke(); }
    ctx.restore();
    drawMark(play, ctx, A, R, kit, 'THROW: TAKE THE TRAY');
    if (!R.won && R.pstMount) TourRooms.hudText(play, ctx, R.serveT != null ? 'SERVE! (THROW)' : 'HOLD IT LEVEL...', R.serveT != null ? '#8fdcaa' : '#ffd84a', 13);
  }
});
TourRooms.kinds.pstTray.testWin = function (g, A, R, kit, frame) {
  const p = g.player; p.x = kit.data.mark * TS + TS / 2 - p.w / 2; p.y = (kit.data.markRow + 1) * TS - p.h; p.vy = 0;
  for (let k = 0; k < 20; k++) frame(g, {}); frame(g, { action: true, actionPressed: true });
  // steer against the tilt (and toward the middle of the mugs), like a player watching the tray
  for (let k = 0; k < 120 * 16 && !R.won; k++) {
    const mean = R.mugs.reduce((s, m) => s + m.u + m.v * 0.5, 0) / 3, want = -(R.tilt - R.ctl) - mean * 0.6;
    if (R.serveT != null && R.serveT > 0.2) { frame(g, { action: true, actionPressed: true }); continue; }
    frame(g, { left: R.ctl > want + 0.02, right: R.ctl < want - 0.02 });
  }
};

/* ================= pstCaps: NIGHTCAP STAND ================= */
TourRooms.def('pstCaps', {
  title: 'NIGHTCAP STAND', rule: 'TAKE THE BEDPOST ON THE MARK (THROW). STEER IT UNDER EACH FALLING NIGHTCAP: THEY LAND CROOKED. STACK FOUR AND HOLD THEM FOR ONE FULL WOBBLE', need: 'STACK FOUR NIGHTCAPS FIRST!',
  make(o, keep, ctx, A, rng) { return makeRoom(keep, A, o, (g, mid) => { g.coins(mid - 7, mid - 5, 4); g.coins(mid + 5, mid + 7, 4); }); },
  enter(play, A, R, kit) { R.post = kit.data.mark * TS + TS / 2; this.reset(R); R.st = 0; },
  reset(R) { R.caps = []; R.fall = null; R.holdT = 0; R.waitT = 0.8; },
  lean(R) { let x = 0, s = 0; for (const c of R.caps) { x += c.off; s += x; } return R.caps.length ? s / R.caps.length : 0; },
  update(play, dt, A, R, kit) {
    R.st = (R.st || 0) + dt;
    if (R.won) return;
    const mounted = mountStep(play, A, R, kit, dt), cx = kit.data.mark * TS + TS / 2;
    if (!mounted) return;
    const v0 = R.post;
    if (Input.left) R.post -= 3.4 * TS * dt; if (Input.right) R.post += 3.4 * TS * dt;
    R.post = clamp(R.post, cx - 6 * TS, cx + 6 * TS); R.pv = (R.post - v0) / dt;
    // the next cap: it drifts down from above at its own spot; the bedpost's stack top catches it
    if (!R.fall && R.caps.length < 4) { R.waitT -= dt; if (R.waitT <= 0) { const side = R.caps.length % 2 ? 1 : -1; R.fall = { x: clamp(R.post + side * (0.8 + Math.random() * 1.2) * TS, cx - 6 * TS, cx + 6 * TS), y: TS * 0.5, vy: 0 }; } }
    const topY = 8 * TS - 14 - R.caps.length * 16;
    if (R.fall) {
      const f = R.fall; f.vy = Math.min(f.vy + 120 * dt, 95); f.y += f.vy * dt; f.x += Math.sin(R.st * 3) * 8 * dt;
      if (f.y >= topY - 10) {
        const top = R.post + R.caps.reduce((s, c) => s + c.off, 0), off = f.x - top;
        if (Math.abs(off) < 0.75 * TS) { R.caps.push({ off: off * 0.55 + (Math.random() - 0.5) * 6 }); R.fall = null; R.waitT = 0.9; Sound.play('land', { vol: 0.5, pitch: 1.2 + R.caps.length * 0.1 }); }
        else if (f.y > 8 * TS) { miss(play, 'IT MISSED THE POST! AGAIN...'); this.reset(R); return; }
      }
    }
    // the tower's wobble grows with its lean and with sudden moves; too much and it topples
    const lean = this.lean(R) + clamp(R.pv || 0, -200, 200) * 0.04;
    R.wob = lean + Math.sin(R.st * 3.4) * Math.min(12, Math.abs(lean) * 0.4 + 3);
    if (R.caps.length && Math.abs(lean) > 0.9 * TS) { miss(play, 'THE TOWER TOPPLED! AGAIN...'); this.reset(R); return; }
    if (R.caps.length >= 4) { R.holdT += dt; if (R.holdT >= 3.0) TourRooms.win(play, A, R, { text: 'FOUR NIGHTCAPS, ONE FULL WOBBLE!', coins: 4 }); }
  },
  draw(play, ctx, A, R, kit) {
    const y0 = 8 * TS, x = R.post || kit.data.mark * TS + TS / 2;
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = INK;
    // the brass bedpost
    ctx.fillStyle = '#d8b040'; ctx.lineWidth = 2.5; ctx.fillRect(x - 5, y0, 10, 2 * TS); ctx.strokeRect(x - 5, y0, 10, 2 * TS); ctx.beginPath(); ctx.arc(x, y0 - 4, 8, 0, TAU); ctx.fill(); ctx.stroke();
    // the stack of nightcaps, leaning by their offsets and wobbling
    let cxp = x, wobk = R.caps && R.caps.length ? (R.wob - this.lean(R)) / Math.max(1, R.caps.length) : 0;
    (R.caps || []).forEach((c, k) => { cxp += c.off + wobk; const yy = y0 - 12 - k * 16; this.cap(ctx, cxp, yy, k); });
    if (R.fall) this.cap(ctx, R.fall.x, R.fall.y, (R.caps || []).length);
    ctx.restore();
    drawMark(play, ctx, A, R, kit, 'THROW: TAKE THE BEDPOST');
    if (!R.won && R.pstMount) TourRooms.hudText(play, ctx, (R.caps || []).length >= 4 ? 'HOLD IT... ' + Math.max(0, 3 - R.holdT).toFixed(1) : 'NIGHTCAPS ' + (R.caps || []).length + ' / 4', '#ffd84a', 13);
  },
  cap(ctx, x, y, k) {
    const col = [PLUM_HI, MINT, HONEY, '#8ab8f0'][k % 4];
    ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 16, y + 8); ctx.quadraticCurveTo(x - 10, y - 14, x + 12, y - 10); ctx.quadraticCurveTo(x + 20, y - 4, x + 18, y + 4); ctx.lineTo(x + 16, y + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 17, y + 4, 34, 6); ctx.strokeRect(x - 17, y + 4, 34, 6); ctx.beginPath(); ctx.arc(x + 19, y + 4, 4, 0, TAU); ctx.fill(); ctx.stroke();
  }
});
TourRooms.kinds.pstCaps.testWin = function (g, A, R, kit, frame) {
  const p = g.player, K0 = TourRooms.kinds.pstCaps; p.x = kit.data.mark * TS + TS / 2 - p.w / 2; p.y = (kit.data.markRow + 1) * TS - p.h; p.vy = 0;
  for (let k = 0; k < 20; k++) frame(g, {}); frame(g, { action: true, actionPressed: true });
  // steer the stack's top under each falling cap, catching it on the side that evens the lean
  for (let k = 0; k < 120 * 30 && !R.won; k++) {
    let want = R.post;
    if (R.fall) { const top = R.post + R.caps.reduce((s, c) => s + c.off, 0), lean = K0.lean(R); want = R.post + (R.fall.x - top) + clamp(lean, -20, 20) * 0.9; }
    frame(g, { left: R.post > want + 3, right: R.post < want - 3 });
  }
};

/* ================= pstPour: THE EVEN POUR ================= */
TourRooms.def('pstPour', {
  title: 'THE EVEN POUR', rule: 'TAKE THE JUG ON THE MARK (THROW). TILT IT WITH THE STICK TOWARD WHICHEVER MUG IS LOWER. EMPTY IT WITH BOTH MUGS IN THE MARKED BAND', need: 'POUR IT EVENLY FIRST!',
  make(o, keep, ctx, A, rng) { return makeRoom(keep, A, o, (g, mid) => { g.coins(mid - 2, mid + 2, 2); }); },
  enter(play, A, R, kit) { this.reset(R); R.st = 0; },
  reset(R) { R.jug = 1; R.L = 0; R.Rv = 0; R.tau = 0; R.ph = Math.random() * 6; R.done = null; },
  update(play, dt, A, R, kit) {
    R.st = (R.st || 0) + dt;
    if (R.won) return;
    const mounted = mountStep(play, A, R, kit, dt);
    if (!mounted) return;
    if (R.done != null) { R.done += dt; if (R.done > 1.4) this.reset(R); return; }
    if (Input.left) R.tau -= 1.6 * dt; if (Input.right) R.tau += 1.6 * dt; R.tau = clamp(R.tau, -1, 1);
    // one spout runs faster than the other, and which one drifts as the jug empties
    const bias = 0.22 * Math.sin(R.st * 0.55 + R.ph), share = clamp(0.5 + 0.38 * R.tau + bias, 0.05, 0.95), F = Math.min(R.jug, dt / 10);
    R.jug -= F; R.Rv += F * share; R.L += F * (1 - share);
    if (R.L > 0.62 || R.Rv > 0.62) { miss(play, 'IT OVERFLOWED! AGAIN...'); R.done = 0; return; }
    if (R.jug <= 0.0005) {
      if (Math.abs(R.L - 0.5) <= 0.07 && Math.abs(R.Rv - 0.5) <= 0.07) TourRooms.win(play, A, R, { text: 'PERFECTLY EVEN!', coins: 4 });
      else { miss(play, 'NOT EVEN! A FRESH JUG...'); R.done = 0; }
    }
  },
  draw(play, ctx, A, R, kit) {
    const cx = kit.data.mark * TS + TS / 2, jy = 4.9 * TS, my = 8.4 * TS, gap = 3 * TS;
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = INK;
    // the shelf with the two mugs (Brady's black one, Pupo's honey one), their marked bands and milk levels
    ctx.fillStyle = '#8a5a3a'; ctx.lineWidth = 2; ctx.fillRect(cx - 5 * TS, my, 10 * TS, 10); ctx.strokeRect(cx - 5 * TS, my, 10 * TS, 10);
    [[cx - gap, R.L || 0, '#2a2a34'], [cx + gap, R.Rv || 0, HONEY]].forEach(([x, lv, col]) => {
      const h = 2.3 * TS, w = 46, top = my - h;
      ctx.fillStyle = col; ctx.lineWidth = 2.5; rr(ctx, x - w / 2, top, w, h, 6); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x + w / 2 + 6, top + h / 2, 12, -1.3, 1.3); ctx.stroke();
      ctx.fillStyle = '#fff8ec'; const fh = (h - 8) * clamp(lv / 0.62, 0, 1); ctx.fillRect(x - w / 2 + 5, my - 4 - fh, w - 10, fh);
      const b0 = my - 4 - (h - 8) * (0.43 / 0.62), b1 = my - 4 - (h - 8) * (0.57 / 0.62); ctx.strokeStyle = MINT; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(x - w / 2 - 4, b0); ctx.lineTo(x + w / 2 + 4, b0); ctx.moveTo(x - w / 2 - 4, b1); ctx.lineTo(x + w / 2 + 4, b1); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = INK;
    });
    // the two-spouted jug, tilted, and its two streams
    const tau = R.tau || 0, bias = 0.22 * Math.sin((R.st || 0) * 0.55 + (R.ph || 0)), share = clamp(0.5 + 0.38 * tau + bias, 0.05, 0.95);
    ctx.save(); ctx.translate(cx, jy); ctx.rotate(tau * 0.25);
    ctx.fillStyle = CREAM; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-34, -30); ctx.lineTo(34, -30); ctx.lineTo(42, 22); ctx.lineTo(-42, 22); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PLUM; ctx.fillRect(-36, -8, 72, 8);
    for (const s of [-1, 1]) { ctx.fillStyle = CREAM; ctx.beginPath(); ctx.moveTo(s * 40, 10); ctx.lineTo(s * 58, 18); ctx.lineTo(s * 42, 22); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#fff8ec'; ctx.fillRect(-30, 18 - 40 * (R.jug || 0), 60, 40 * (R.jug || 0));
    ctx.restore();
    if ((R.jug || 0) > 0.001 && R.pstMount && R.done == null) for (const [s, w] of [[-1, 1 - share], [1, share]]) { ctx.strokeStyle = 'rgba(255,248,236,0.95)'; ctx.lineWidth = 1 + 8 * w; ctx.beginPath(); ctx.moveTo(cx + s * 56, jy + 18); ctx.quadraticCurveTo(cx + s * (gap - 10), jy + 30, cx + s * gap, my - 2.3 * TS); ctx.stroke(); }
    ctx.restore();
    drawMark(play, ctx, A, R, kit, 'THROW: TAKE THE JUG');
    if (!R.won && R.pstMount) TourRooms.hudText(play, ctx, 'JUG ' + Math.round((R.jug || 0) * 100) + '%', '#ffd84a', 13);
  }
});
TourRooms.kinds.pstPour.testWin = function (g, A, R, kit, frame) {
  const p = g.player; p.x = kit.data.mark * TS + TS / 2 - p.w / 2; p.y = (kit.data.markRow + 1) * TS - p.h; p.vy = 0;
  for (let k = 0; k < 20; k++) frame(g, {}); frame(g, { action: true, actionPressed: true });
  for (let k = 0; k < 120 * 16 && !R.won; k++) {
    // tilt toward the lower mug, against the drifting spout
    const bias = 0.22 * Math.sin(R.st * 0.55 + R.ph), want = clamp((R.L - R.Rv) * 6 - bias / 0.38, -1, 1);
    frame(g, { left: R.tau > want + 0.03, right: R.tau < want - 0.03 });
  }
};

/* ================= pstPrivacy: A LITTLE PRIVACY ================= */
TourRooms.def('pstPrivacy', {
  title: 'A LITTLE PRIVACY', rule: 'HOLD THROW ON THE QUILT\'S EDGE AND WALK IT UP OVER PUPO UNTIL ONLY HIS NOSE SHOWS. THEN STAY QUITE STILL FOR THREE SNORES', need: 'TUCK HIM IN FIRST!',
  make(o, keep, ctx, A, rng) { return makeRoom(keep, A, o, (g, mid) => { g.coins(mid - 1, mid + 1, 3); }); },
  enter(play, A, R, kit) { R.cov = 0.25; R.pstGrip = null; R.snores = 0; R.stillT = 0; R.st = 0; R.wake = 0; },
  // the bed lies on the floor from the mark: the quilt's edge starts at the mark, Pupo's nose is 5.2 tiles on
  update(play, dt, A, R, kit) {
    R.st = (R.st || 0) + dt;
    if (R.won) { R.pstGrip = null; return; }
    const p = play.player, x0 = kit.data.mark * TS + TS / 2, span = 5 * TS;
    if (R.wake > 0) { R.wake -= dt; return; }
    const edgeX = x0 + (R.cov - 0.25) / 0.75 * span;
    const at = p && p.onGround && Math.abs(p.cx - edgeX) < 26 && Math.abs(p.y + p.h - (kit.data.markRow + 1) * TS) < 6;
    if (R.pstGrip == null && at && Input.action) { R.pstGrip = p.cx - edgeX; Sound.play('select', { vol: 0.4 }); }
    if (R.pstGrip != null) {
      if (!Input.action) R.pstGrip = null;
      else { R.cov = clamp(0.25 + (p.cx - R.pstGrip - x0) / span * 0.75, 0.25, 1.05); }
    }
    // pulled over his nose: he wakes with a snort and kicks it off
    if (R.cov > 0.96) { R.cov = 0.25; R.pstGrip = null; R.snores = 0; R.stillT = 0; R.wake = 1.2; miss(play, 'SNORT! NOT OVER THE NOSE!'); return; }
    // tucked in (only the nose shows) and Brady quite still: the snores come, each one embroiders a cloud
    const tucked = R.cov >= 0.8 && R.pstGrip == null;
    const moving = Input.left || Input.right || Input.jump || Input.action || Input.down || Input.up || (p && (Math.abs(p.vx) > 10 || !p.onGround));
    if (tucked && !moving) { R.stillT += dt; if (R.stillT >= 1.7) { R.stillT = 0; R.snores++; Sound.play('float', { vol: 0.5, pitch: 0.6 + R.snores * 0.1 }); play.parts.text(x0 + span, 6 * TS, 'SNOOORE', '#fff4dc'); if (R.snores >= 3) TourRooms.win(play, A, R, { text: 'SWEET DREAMS, PUPO', coins: 4 }); } }
    else if (moving && R.snores && tucked) { R.snores = 0; R.stillT = 0; miss(play, 'SHH! YOU MOVED. START THE SNORES AGAIN'); }
    else if (!tucked) { R.stillT = 0; }
  },
  draw(play, ctx, A, R, kit) {
    const x0 = kit.data.mark * TS + TS / 2, y = (kit.data.markRow + 1) * TS, span = 5 * TS, t = R.st || 0;
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = INK;
    // the bed: a low wooden frame, a big pillow at the right
    ctx.fillStyle = '#7a4a2a'; ctx.lineWidth = 2.5; ctx.fillRect(x0 - 30, y - 30, span + 110, 26); ctx.strokeRect(x0 - 30, y - 30, span + 110, 26);
    ctx.fillRect(x0 + span + 70, y - 90, 14, 86); ctx.strokeRect(x0 + span + 70, y - 90, 14, 86);
    PstArt.cushion(ctx, x0 + span + 10, y - 66, 64, 34, '#ffffff', CREAM_LO, '#ffffff');
    // Pupo under the quilt, asleep, his head on the pillow
    const br = Math.sin(t * 1.6) * 0.04;
    ctx.save(); ctx.translate(x0 + span + 20, y - 26); ctx.scale(1, 1 + br); ctx.translate(-(x0 + span + 20), -(y - 26));
    Ink.around(ctx, x0 - 20, y - 110, span + 110, 110, c => Pupo.draw(c, { x: x0 + span - 6, y: y - 26, scale: 0.85, facing: 1, t, pose: 'sleep', mood: R.wake > 0 ? 'puzzled' : 'sleep' }), { pad: 4, width: 1.6 });
    ctx.restore();
    // the quilt: honey patchwork, pulled up to `cov` (its top edge), with the clouds embroidered so far
    const edge = x0 + (R.cov - 0.25) / 0.75 * span, qy = y - 58;
    ctx.fillStyle = HONEY; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x0 - 34, y - 6); ctx.lineTo(x0 - 34, qy + 10); ctx.quadraticCurveTo(edge - 30, qy - 6, edge, qy + 4); ctx.lineTo(edge + 6, y - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip(); ctx.strokeStyle = HONEY_LO; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]); for (let x = x0 - 30; x < edge; x += 26) { ctx.beginPath(); ctx.moveTo(x, qy - 10); ctx.lineTo(x, y); ctx.stroke(); } ctx.setLineDash([]); ctx.restore();
    ctx.fillStyle = PLUM; ctx.fillRect(edge - 6, qy + 2, 12, y - qy - 8);
    for (let k = 0; k < (R.snores || 0); k++) { const cxk = x0 - 10 + k * 34; PstArt.bubble(ctx, cxk - 14, y - 40, 28, 14, '#ffffff', PLUM); }
    // the target: where the quilt's edge leaves only his nose out (a faint dotted line on the bed)
    const nx0 = x0 + (0.8 - 0.25) / 0.75 * span, nx1 = x0 + (0.95 - 0.25) / 0.75 * span; ctx.strokeStyle = 'rgba(143,220,170,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([3, 4]); ctx.strokeRect(nx0, y - 32, nx1 - nx0, 24); ctx.setLineDash([]);
    if (R.pstGrip != null) { const p = play.player; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.cx, p.y + 22); ctx.lineTo(edge, qy + 14); ctx.stroke(); }
    ctx.restore();
    if (!R.won) TourRooms.hudText(play, ctx, R.cov >= 0.8 && R.pstGrip == null ? 'SHHH... SNORES ' + (R.snores || 0) + ' / 3' : 'TUCK HIM IN', '#ffd84a', 13);
  }
});
TourRooms.kinds.pstPrivacy.testWin = function (g, A, R, kit, frame) {
  const p = g.player, x0 = kit.data.mark * TS + TS / 2; p.x = x0 - p.w / 2; p.y = (kit.data.markRow + 1) * TS - p.h; p.vy = 0;
  for (let k = 0; k < 20; k++) frame(g, {});
  // hold THROW at the edge, walk right until only the nose shows, let go, then stand still
  for (let k = 0; k < 600 && R.cov < 0.86; k++) frame(g, { action: true, right: R.pstGrip != null });
  for (let k = 0; k < 60; k++) frame(g, {});
  for (let k = 0; k < 120 * 8 && !R.won; k++) frame(g, {});
};
Tour.pstKit.rooms = { FORT_DX };
})();
