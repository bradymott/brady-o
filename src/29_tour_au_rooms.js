/* ============================================================
   AUSTRALIA: the secret rooms (docs/design/SECRET_ROOMS.md kit, SECRETS_BRIEF.md). Five rooms, five kinds, each
   with something to do, each built from the land, most with a second way out:
   16-1 THE KOOKABURRA CHORUS (auEcho, new): four kookaburras laugh a tune on four hollow logs; play it back by
        landing on the logs in the same order. Out: the wombat's back tunnel, further along the red centre.
   16-2 MUSTER! (auMuster, new): four sheep loose in the van; walk at them and they shuffle away from you: get all
        four into the pen before the clock runs out. Out: the roof hatch, up onto the next van's roof.
   16-3 THE OPAL SEAM (auOpals, new): a pitch-black cave; six opals show only in the platypus's ping. Grab all six
        before the clock runs out.
   16-4 THE POSSUM'S BILLY CANS (auShell: the shell game, re-skinned): a possum hides a prize under one of three billy
        cans. Out: down the hollow's trunk, onto a limb further on.
   16-6 SPOT THE ODD BIG THING (auOddOne, new): five fibreglass giants on plinths, one of them not quite right; three
        rounds (bananas, prawns, pineapples).
   The land's tell for every hidden way in: a little puff of red dust (AuPuff), every two seconds or so.
   ============================================================ */
(function () {
const C = Tour.countries.au;
if (!C || typeof TourRooms === 'undefined') return;
const { INK } = Tour.auKit;
const K = TourRoomKit;
const ARCH = (o, keep) => K.eastW(keep, o);

/* ---------- the land's tell: a puff of red dust from a crack ---------- */
class AuPuff extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.back = true; this.clock = 0.5 + Math.random(); this.down = !!s.down; }
  update(dt) {
    this.t += dt; this.clock -= dt;
    if (this.clock <= 0) { this.clock = 2.2; const n = 4; for (let k = 0; k < n; k++) this.g.burst(this.cx + (Math.random() - 0.5) * 12, this.down ? this.y + 4 : this.y + this.h - 4, 1, k % 2 ? '#d8683a' : '#e8a070', 'debris'); }
  }
  touchPlayer() {}
}

/* ================= 16-1: THE KOOKABURRA CHORUS ================= */
const KOOKA_COLS = ['#ff5a4a', '#ffd23a', '#4aa8ff', '#5ad86a'];
TourRooms.def('auEcho', {
  title: 'THE KOOKABURRA CHORUS', rule: 'LISTEN TO THE KOOKABURRAS, THEN LAND ON THEIR LOGS IN THE SAME ORDER', need: 'SING THE TUNE BACK FIRST!',
  make(o, keep, ctx, A, rng) {
    const W = 36 + ARCH(o, keep), g = K.room(W), Y = K.Y;
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o);
    const logs = []; for (let k = 0; k < 4; k++) { const x = x0 + 2 + k * 6; g.hline(x, x + 1, 8, '-'); logs.push(x); }
    g.data.logs = logs;
    g.winSpot(A.id, x1 - 3, Y);
    if (o.exit) g.door(x1 - 1, Y, { to: o.exit, look: 'tourDoorHidden' });
    g.coins(x0 + 4, x0 + 20, 3);
    g.dress(keep, [x0, x1 - 5], Y);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.phase = 'wait'; R.pt = 0; R.seq = null; R.at = 0; R.onLog = -1; R.sing = -1; } },
  logAt(play, kit) {
    const p = play.player; if (!p.onGround || p.groundTy !== 8) return -1;
    const tx = Math.floor(p.cx / TS);
    return kit.data.logs.findIndex(x => tx >= x && tx <= x + 1);
  },
  update(play, dt, A, R, kit) {
    R.pt += dt; if (R.singT > 0) R.singT -= dt;
    if (R.won) return;
    const sing = k => { R.sing = k; R.singT = 0.45; Sound.play('select', { vol: 0.6, pitch: 0.7 + k * 0.25 }); };
    if (R.phase === 'wait') { if (TourRoomKit.inside(play, A, R) && R.t > 1) { if (!R.seq) { const n = 4 + (kit.d > 0.9 ? 1 : 0); R.seq = []; for (let k = 0; k < n; k++) { let v; do { v = Math.floor(Math.random() * 4); } while (k && v === R.seq[k - 1]); R.seq.push(v); } } R.phase = 'show'; R.pt = 0; R.i = 0; } return; }
    if (R.phase === 'show') {
      // one laugh every 0.75 s, then Brady's turn
      if (R.pt > 0.75) { R.pt = 0; if (R.i < R.seq.length) { sing(R.seq[R.i]); R.i++; } else { R.phase = 'play'; R.at = 0; R.onLog = -1; play.parts.text(play.player.cx, play.player.y - 20, 'YOUR TURN!', '#ffd84a'); } }
      return;
    }
    if (R.phase === 'play') {
      const k = this.logAt(play, kit);
      if (k < 0) { R.onLog = -1; return; }
      if (k === R.onLog) return;
      R.onLog = k;
      if (k === R.seq[R.at]) { sing(k); R.at++; if (R.at >= R.seq.length) TourRooms.win(play, A, R, { text: 'WHAT A CHORUS!', coins: 6 }); }
      else { TourRoomKit.raspberry(play, 'KOOKA-HA-HA! WRONG LOG'); R.phase = 'show'; R.pt = -0.6; R.i = 0; }
    }
  },
  draw(play, ctx, A, R, kit) {
    // the four birds on a branch over their logs, each its own colour and band; the one singing glows and laughs
    const t = play.t;
    kit.data.logs.forEach((lx, k) => {
      const x = (lx + 1) * TS, y = 6 * TS - 6, on = R.sing === k && R.singT > 0;
      Ink.around(ctx, x - 26, y - 34, 52, 44, c => {
        c.fillStyle = '#6a4a2a'; c.fillRect(x - 24, y + 4, 48, 5);
        c.fillStyle = '#f0e6d0'; c.beginPath(); c.ellipse(x, y - 8, 11, 12, 0, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = '#6a4a2a'; c.beginPath(); c.ellipse(x - 6, y - 8, 6, 10, 0.3, 0, TAU); c.fill();
        c.fillStyle = KOOKA_COLS[k]; c.fillRect(x - 10, y - 2, 20, 4);
        c.fillStyle = '#f0e6d0'; c.beginPath(); c.arc(x + 3, y - 20, 7, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = '#3a3a40'; c.beginPath(); c.moveTo(x + 8, y - 22); c.lineTo(x + 20, on ? -27 + y : y - 19); c.lineTo(x + 8, y - 17); c.closePath(); c.fill();
        if (on) { c.beginPath(); c.moveTo(x + 8, y - 17); c.lineTo(x + 18, y - 12); c.lineTo(x + 8, y - 15); c.closePath(); c.fill(); }
        c.fillStyle = INK; c.beginPath(); c.arc(x + 4, y - 22, 1.5, 0, TAU); c.fill();
      }, { pad: 6 });
      if (on) { ctx.save(); ctx.fillStyle = KOOKA_COLS[k]; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(x, y - 12, 26, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.font = `13px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.fillText(['KOO!', 'KA!', 'HA!', 'HOO!'][k], x, y - 40); ctx.restore(); }
      // the log's colour band (so the logs match the birds)
      ctx.save(); ctx.fillStyle = KOOKA_COLS[k]; ctx.fillRect(lx * TS + 6, 8 * TS + 2, 2 * TS - 12, 4); ctx.restore();
    });
    if (!R.won && R.phase === 'play') TourRooms.counter(play, ctx, R.at, R.seq.length, null);
  }
});

/* ================= 16-2: MUSTER! ================= */
class AuRoomSheep extends Ent {
  constructor(g, s) { super(g, s, 30, 26); this.k = s.k || 0; this.penX = s.penX; this.home = this.x; this.wander = 0; this.friendly = true; this.penned = false; this.dir = 1; }
  update(dt) {
    this.t += dt; const p = this.g.player;
    let vx = 0;
    if (p && !p.dead) {
      const dx = this.cx - p.cx, dy = Math.abs((this.y + this.h) - (p.y + p.h));
      if (Math.abs(dx) < 2.8 * TS && dy < 2.2 * TS) { vx = sign(dx || 1) * 3.4 * TS; this.scared = 0.4; }
    }
    if (!vx) { this.wander -= dt; if (this.wander <= 0) { this.wander = 1 + Math.random() * 2; this.dir = Math.random() < 0.5 ? -1 : 1; this.idle = Math.random() < 0.5; } if (!this.idle) vx = this.dir * 0.7 * TS; }
    if (this.scared > 0) this.scared -= dt;
    this.vx = vx; if (vx) this.dir = sign(vx);
    this.vy = Math.min((this.vy || 0) + PHYS.gDown * dt, PHYS.maxFall);
    moveBody(this, this.g.area, dt, { semis: true });
    if (!this.penned && this.cx > this.penX) { this.penned = true; this.g.parts.text(this.cx, this.y - 10, 'BAA!', '#ffffff'); Sound.play('select', { vol: 0.4, pitch: 1.6 }); }
    if (this.penned && this.x < this.penX + 2) this.x = this.penX + 2;
  }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y + this.h, t = this.t, st = Math.abs(this.vx) > 10 ? Math.sin(t * 18) * 3 : 0;
    Ink.around(ctx, x - 22, y - 34, 44, 36, c => {
      c.save(); c.translate(x, y); c.scale(this.dir, 1);
      c.fillStyle = '#2a2a2e'; c.fillRect(-9 + st, -8, 4, 8); c.fillRect(5 - st, -8, 4, 8);
      c.fillStyle = '#f4f0e6'; for (const [dx, dy] of [[-8, -16], [0, -20], [8, -16], [-3, -12], [5, -11]]) { c.beginPath(); c.arc(dx, dy, 8, 0, TAU); c.fill(); }
      c.fillStyle = '#2a2a2e'; c.beginPath(); c.ellipse(14, -18, 6, 8, 0.2, 0, TAU); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(16, -20, 1.6, 0, TAU); c.fill();
      c.restore();
    }, { pad: 6 });
    if (this.scared > 0) { ctx.save(); ctx.fillStyle = '#ffffff'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('!', x, y - 38); ctx.restore(); }
  }
}
TourRooms.def('auMuster', {
  title: 'MUSTER!', rule: 'WALK AT THE SHEEP AND THEY SHUFFLE AWAY: GET ALL FOUR INTO THE PEN', need: 'PEN THE SHEEP FIRST!',
  make(o, keep, ctx, A, rng) {
    const W = 44 + ARCH(o, keep), g = K.room(W), Y = K.Y;
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o);
    g.data.penX = x1 - 6; g.data.sheep = [x0 + 9, x0 + 14, x0 + 20, x0 + 26];
    g.winSpot(A.id, x1 - 2, Y);
    // the roof hatch: two hay shelves up to it (always there, a way out the other side of the van)
    g.hline(x0 + 4, x0 + 7, 7, '-'); g.hline(x0 + 9, x0 + 13, 4, '-');
    if (o.exit) g.door(x0 + 11, 3, { to: o.exit, look: 'tourDoorHidden' });
    g.coins(x0 + 4, x0 + 7, 5);
    g.dress(keep, [x0 + 2], Y);
    return g;
  },
  enter(play, A, R, kit) {
    for (const e of play.entities) if (e instanceof AuRoomSheep) e.remove = true;
    if (R.won) return;
    R.sheep = kit.data.sheep.map((x, k) => TourRooms.add(play, 'auRoomSheep', x, K.Y, { k, penX: kit.data.penX * TS }));
    R.clock = null;
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    if (R.clock == null) { if (TourRoomKit.inside(play, A, R) && R.t > 1) R.clock = 45; return; }
    R.clock -= dt;
    const n = R.sheep.filter(s => s && s.penned).length;
    if (n >= R.sheep.length) { TourRooms.win(play, A, R, { text: 'ALL MUSTERED!', coins: 6 }); return; }
    if (R.clock <= 0) { TourRoomKit.raspberry(play, 'THE SHEEP WANDERED OFF! AGAIN!'); this.enter(play, A, R, kit); }
  },
  draw(play, ctx, A, R, kit) {
    // the pen's gate posts and rails at the pen's left edge
    const x = kit.data.penX * TS, y = (K.Y + 1) * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#a87a4a';
    ctx.fillRect(x - 4, y - 40, 8, 40); ctx.strokeRect(x - 4, y - 40, 8, 40);
    ctx.fillRect(x, y - 34, 6 * TS - 6, 5); ctx.strokeRect(x, y - 34, 6 * TS - 6, 5); ctx.fillRect(x, y - 18, 6 * TS - 6, 5); ctx.strokeRect(x, y - 18, 6 * TS - 6, 5);
    ctx.fillStyle = '#ffffff'; ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('PEN', x + 3 * TS, y - 46);
    ctx.restore();
    if (!R.won && R.clock != null) { TourRooms.clock(play, ctx, Math.max(0, R.clock), 45); TourRooms.counter(play, ctx, R.sheep.filter(s => s && s.penned).length, R.sheep.length, null); }
  }
});

/* ================= 16-3: THE OPAL SEAM ================= */
class AuOpal extends Ent {
  constructor(g, s) { super(g, s, 20, 20); this.y = s.y - 26; this.friendly = true; this.k = s.k; this.got = false; }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) {
    if (this.got) return;
    const g = this.g, p = g.player, lit = Math.max(Tour.auKit.AuSonar.litAt(g, this.cx, this.cy), p ? clamp(1 - Math.hypot(p.cx - this.cx, p.cy - this.cy) / 80, 0, 1) : 0);
    if (lit < 0.03) return;
    const x = this.cx, y = this.cy, h = (this.t * 120 + this.k * 60) % 360;
    ctx.save(); ctx.globalAlpha = lit;
    ctx.fillStyle = `hsla(${h},90%,70%,0.35)`; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = `hsl(${h},85%,65%)`; ctx.beginPath(); ctx.ellipse(x, y, 9, 7, 0.3, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = `hsl(${(h + 120) % 360},90%,75%)`; ctx.beginPath(); ctx.ellipse(x - 2, y - 1, 4, 3, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4, y - 4, 2, 2);
    ctx.restore();
  }
}
TourRooms.def('auOpals', {
  title: 'THE OPAL SEAM', rule: 'PING TO SEE! GRAB ALL SIX OPALS BEFORE THE CLOCK RUNS OUT', need: 'FIND ALL SIX OPALS!',
  make(o, keep, ctx, A, rng) {
    const W = 34 + ARCH(o, keep), g = K.room(W), Y = K.Y;
    g.area = { dark: true };
    const x0 = g.west(keep);
    const ids = []; for (let k = 0; k < 6; k++) ids.push('opal:' + A.id + ':' + k);
    const x1 = K.east(g, keep, A, o, { needsAll: ids }), span = x1 - x0, at = f => x0 + Math.round(span * f);
    g.hline(at(0.2) - 2, at(0.2) + 2, 8, '-'); g.hline(at(0.45) - 2, at(0.45) + 2, 5, '-'); g.hline(at(0.7) - 2, at(0.7) + 2, 8, '-'); g.hline(at(0.85) - 1, at(0.85) + 1, 5, '-');
    g.fill(at(0.33), 9, at(0.33), 10, '#'); g.fill(at(0.58), 8, at(0.58), 10, '#');
    const spots = [[at(0.1), Y], [at(0.2), 7], [at(0.45), 4], [at(0.62), Y], [at(0.7), 7], [at(0.85), 4]];
    spots.forEach(([x, y], k) => { g.put(x, y, g.L(['vkey', ids[k]])); g.need('opal ' + k, x, y); });
    g.data.opals = spots;
    g.dress(keep, [x0 + 1], Y);
    return g;
  },
  enter(play, A, R, kit) {
    for (const e of play.entities) if (e instanceof AuOpal) e.remove = true;
    if (R.won) return;
    R.opals = kit.data.opals.map(([x, y], k) => TourRooms.add(play, 'auOpal', x, y, { k }));
    R.clock = null;
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const p = play.player;
    for (const o of R.opals) if (o && !o.got && overlap(p, o)) { o.got = true; Sound.play('coin', { pitch: 1.5 }); play.burst(o.cx, o.cy, 10, '#9affe8', 'spark'); if (R.clock == null) R.clock = 30; }
    if (R.clock == null) { if (TourRoomKit.inside(play, A, R) && R.t > 1.5) R.clock = 30; return; }
    R.clock -= dt;
    if (R.opals.every(o => o && o.got)) { A.dark = false; TourRooms.win(play, A, R, { text: 'A FORTUNE IN OPALS!', coins: 4 }); return; }
    if (R.clock <= 0) { TourRoomKit.raspberry(play, 'THE OPALS SANK BACK INTO THE ROCK!'); this.enter(play, A, R, kit); }
  },
  draw(play, ctx, A, R, kit) { if (!R.won && R.clock != null) { TourRooms.clock(play, ctx, Math.max(0, R.clock), 30, '#9affe8'); TourRooms.counter(play, ctx, R.opals.filter(o => o && o.got).length, R.opals.length, null); } }
});

/* ================= 16-4: THE POSSUM'S BILLY CANS (the shell game, re-skinned, with a second way out) ================= */
if (TourRoomCritters.CUPS) TourRoomCritters.CUPS.auBilly = { body: '#b8bcc4', band: '#3a3a40', w: 28, h: 30 };
TourRoomCritters.dealers.auPossum = (ctx, x, y, t) => {
  Ink.around(ctx, x - 26, y - 50, 52, 52, c => {
    c.strokeStyle = INK; c.lineWidth = 1.6;
    c.fillStyle = '#8a8a96'; c.beginPath(); c.moveTo(-0 + x - 14, y - 6); c.quadraticCurveTo(x - 34, y - 20, x - 22, y - 36); c.lineTo(x - 18, y - 32); c.quadraticCurveTo(x - 26, y - 18, x - 10, y - 10); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(x, y - 16, 13, 15, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#f0ece4'; c.beginPath(); c.ellipse(x, y - 12, 7, 10, 0, 0, TAU); c.fill();
    c.fillStyle = '#8a8a96'; c.beginPath(); c.arc(x, y - 34, 10, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#f0b0b8'; c.beginPath(); c.ellipse(x - 8, y - 43, 4, 6, -0.4, 0, TAU); c.ellipse(x + 8, y - 43, 4, 6, 0.4, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(x - 4, y - 35 + Math.sin(t * 2) * 0.5, 3, 0, TAU); c.arc(x + 4, y - 35, 3, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.fillRect(x - 5, y - 37, 1.5, 1.5); c.fillRect(x + 3, y - 37, 1.5, 1.5);
    c.fillStyle = '#e8909a'; c.beginPath(); c.arc(x, y - 30, 2, 0, TAU); c.fill();
  }, { pad: 6 });
};
{
  const SH = TourRooms.kinds.shell;
  TourRooms.def('auShell', Object.assign({}, SH, {
    title: 'THE POSSUM\'S BILLY CANS',
    make(o, keep, ctx, A, rng) {
      const g = SH.make(Object.assign({ cup: 'auBilly', dealer: 'auPossum', joke: ['banana', 'sock'] }, o), keep, ctx, A, rng);
      // down the hollow's trunk: a second door on the floor, on the far side of the dealer's table
      if (o.exit) for (let x = g.W - 2; x > 2; x--) { const cage = g.data.cage; if (cage && x >= cage.x - 1) continue; if (g.get(x, K.Y) === '.' && g.get(x, K.Y - 1) === '.' && g.get(x, K.Y + 1) === '#') { g.door(x, K.Y, { to: o.exit, look: 'tourDoorHidden' }); break; } }
      return g;
    }
  }));
}

/* ================= 16-6: SPOT THE ODD BIG THING ================= */
const ODD_KINDS = ['banana', 'prawn', 'pineapple'];
const drawGiant = (ctx, kind, x, y, odd, t) => {
  Ink.around(ctx, x - 44, y - 96, 88, 98, c => {
    c.strokeStyle = INK; c.lineWidth = 2.2;
    if (kind === 'banana') {
      c.save(); c.translate(x, y); if (odd) c.scale(-1, 1);
      c.fillStyle = '#ffe04a'; c.beginPath(); c.moveTo(-26, -8); c.quadraticCurveTo(10, -6, 24, -86); c.quadraticCurveTo(0, -34, -24, -26); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#6a4a2a'; c.fillRect(20, -94, 7, 10); c.restore();
    } else if (kind === 'prawn') {
      c.fillStyle = '#ff8a5a'; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x - 18 + k * 9, y - 18 - Math.sin(k * 0.8) * 22, 10, 14, -0.4 + k * 0.3, 0, TAU); c.fill(); c.stroke(); }
      c.beginPath(); c.ellipse(x + 20, y - 48, 14, 11, 0.3, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = INK; c.beginPath(); c.arc(x + 26, y - 52, 2.5, 0, TAU); c.fill();
      c.strokeStyle = '#c8322a'; c.lineWidth = 2; const n = odd ? 1 : 2; for (let k = 0; k < n; k++) { c.beginPath(); c.moveTo(x + 30, y - 54 + k * 6); c.quadraticCurveTo(x + 50, y - 86 + k * 10, x + 40, y - 92 + k * 14); c.stroke(); }
    } else {
      c.fillStyle = '#4aa83a'; const n = odd ? 3 : 5; for (let k = 0; k < n; k++) { const a = -0.9 + k * (1.8 / (n - 1)); c.save(); c.translate(x, y - 58); c.rotate(a); c.beginPath(); c.ellipse(0, -14, 4, 15, 0, 0, TAU); c.fill(); c.stroke(); c.restore(); }
      c.fillStyle = '#ffc83a'; c.beginPath(); c.ellipse(x, y - 30, 22, 30, 0, 0, TAU); c.fill(); c.stroke();
      c.strokeStyle = '#c8901a'; c.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x - 20 + k * 6, y - 52); c.lineTo(x + 12 + k * 6, y - 4); c.stroke(); }
    }
  }, { pad: 6 });
};
TourRooms.def('auOddOne', {
  title: 'SPOT THE ODD BIG THING', rule: 'FOUR GIANTS MATCH, ONE IS NOT QUITE RIGHT: STAND ON ITS PLINTH. THREE ROUNDS', need: 'SPOT ALL THREE FIRST!',
  make(o, keep, ctx, A, rng) {
    const W = 36 + ARCH(o, keep), g = K.room(W), Y = K.Y;
    const x0 = g.west(keep), x1 = K.east(g, keep, A, o);
    const pl = []; for (let k = 0; k < 5; k++) { const x = x0 + 2 + k * 5; g.fill(x, 9, x + 2, 10, 'H'); pl.push(x); }
    g.data.plinths = pl;
    g.winSpot(A.id, x1 - 2, Y);
    if (o.exit) g.door(x1 - 1, Y, { to: o.exit, look: 'tourDoorHidden' });
    g.dress(keep, [x0], Y);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.round = R.round || 0; this.deal(R); R.on = -1; } },
  deal(R) { R.odd = Math.floor(Math.random() * 5); R.cheer = 0; },
  update(play, dt, A, R, kit) {
    if (R.cheer > 0) R.cheer -= dt;
    if (R.won) return;
    const p = play.player;
    let k = -1;
    if (p.onGround && p.groundTy === 9) { const tx = Math.floor(p.cx / TS); k = kit.data.plinths.findIndex(x => tx >= x && tx <= x + 2); }
    if (k < 0) { R.on = -1; return; }
    if (k === R.on) return;
    R.on = k;
    if (k === R.odd) { R.round++; Sound.play('checkpoint', { vol: 0.6 }); play.burst(p.cx, p.y, 16, '#ffd84a', 'confetti'); if (R.round >= 3) TourRooms.win(play, A, R, { text: 'SHARP EYES!', coins: 6 }); else { play.bannerText = 'YES! NEXT ROUND'; play.bannerT = 1.2; this.deal(R); R.on = k; } }
    else { TourRoomKit.raspberry(play, 'NOPE: THAT ONE\'S FINE'); this.deal(R); R.on = k; }
  },
  draw(play, ctx, A, R, kit) {
    const kind = ODD_KINDS[Math.min(2, R.round || 0)];
    kit.data.plinths.forEach((x, k) => drawGiant(ctx, R.won ? 'pineapple' : kind, (x + 1.5) * TS, 9 * TS - 2, !R.won && k === R.odd, play.t));
    if (!R.won) TourRooms.counter(play, ctx, R.round || 0, 3, null);
  }
});

Object.assign(ENTITY_TYPES, { auPuff: AuPuff, auRoomSheep: AuRoomSheep, auOpal: AuOpal });
Tour.auKit.rooms = { AuRoomSheep, AuOpal, ODD_KINDS };
})();
