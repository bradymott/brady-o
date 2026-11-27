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
// every Australian room is one phone screen wide and is shown whole (AuRoomView below)
const ROOM_W = 30;
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
// a kookaburra on its branch: a big square head, the dark stripe through the eye, a heavy two-tone beak, brown
// wings flecked with blue, a barred tail; laughing, the head tips back and the beak opens. k: its colour band
const drawKooka = (c, x, y, on, k, t) => {
  c.strokeStyle = INK; c.lineWidth = 1.6; c.lineJoin = 'round';
  c.fillStyle = '#6a4a2a'; c.fillRect(x - 26, y + 6, 52, 5); c.strokeRect(x - 26, y + 6, 52, 5);
  // tail, body, wing
  c.fillStyle = '#8a5a32'; c.beginPath(); c.moveTo(x - 10, y + 2); c.lineTo(x - 20, y + 20); c.lineTo(x - 12, y + 22); c.lineTo(x - 4, y + 4); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = '#2a1a10'; c.lineWidth = 1; for (let q = 0; q < 3; q++) { c.beginPath(); c.moveTo(x - 17 + q * 2, y + 10 + q * 4); c.lineTo(x - 11 + q * 2, y + 10 + q * 4); c.stroke(); }
  c.strokeStyle = INK; c.lineWidth = 1.6;
  c.fillStyle = '#efe4cc'; c.beginPath(); c.ellipse(x, y - 6, 11, 14, 0, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = '#7a4a26'; c.beginPath(); c.ellipse(x - 5, y - 6, 8, 12, 0.25, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = '#4ab0e8'; for (const [dx, dy] of [[-8, -12], [-4, -9], [-7, -4], [-3, -2]]) c.fillRect(x + dx, y + dy, 3, 2);
  c.fillStyle = KOOKA_COLS[k]; c.fillRect(x - 7, y + 4, 14, 3);
  // the head (tipped back when laughing)
  c.save(); c.translate(x + 2, y - 20); c.rotate(on ? -0.35 + Math.sin(t * 30) * 0.05 : 0);
  c.fillStyle = '#efe4cc'; c.beginPath(); c.ellipse(0, -4, 12, 10, 0, 0, TAU); c.fill(); c.stroke();
  c.fillStyle = '#7a5a3a'; c.beginPath(); c.ellipse(-2, -10, 9, 4, 0, 0, TAU); c.fill();
  c.fillStyle = '#3a2416'; c.beginPath(); c.moveTo(-10, -5); c.lineTo(10, -6); c.lineTo(10, -2); c.lineTo(-10, -1); c.closePath(); c.fill();
  c.fillStyle = INK; c.beginPath(); c.arc(4, -4, 1.8, 0, TAU); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(4, -5.5, 1, 1);
  c.fillStyle = '#2a2a30'; c.beginPath(); c.moveTo(9, -6); c.lineTo(26, on ? -10 : -3); c.lineTo(9, -1); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#e8dcc0'; c.beginPath(); c.moveTo(9, -1); c.lineTo(on ? 22 : 24, on ? 6 : -1); c.lineTo(9, 1); c.closePath(); c.fill(); c.stroke();
  c.restore();
};
TourRooms.def('auEcho', {
  title: 'THE KOOKABURRA CHORUS', rule: 'LISTEN TO THE KOOKABURRAS, THEN LAND ON THEIR LOGS IN THE SAME ORDER', need: 'SING THE TUNE BACK FIRST!',
  make(o, keep, ctx, A, rng) {
    // the whole room fits one phone screen (AuRoomView): the game on a raised walkway in the middle band
    const W = ROOM_W, g = K.room(W), Y = K.Y;
    g.west(keep); const x1 = K.east(g, keep, A, o);
    g.hline(4, x1, 8, '-');
    const logs = []; for (let k = 0; k < 4; k++) { const x = 6 + k * 4; g.hline(x, x + 1, 5, '-'); logs.push(x); }
    g.data.logs = logs; g.data.logRow = 5;
    g.winSpot(A.id, x1 - 1, Y);
    if (o.exit) g.door(x1 - 3, Y, { to: o.exit, look: 'tourDoorHidden' });
    g.decor(8, Y, 'auArmchair'); g.decor(16, Y, 'auRug'); g.decor(13, Y, 'auLantern');
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.phase = 'wait'; R.pt = 0; R.seq = null; R.at = 0; R.onLog = -1; R.sing = -1; } },
  logAt(play, kit) {
    const p = play.player; if (!p.onGround || p.groundTy !== kit.data.logRow) return -1;
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
      const x = (lx + 1) * TS, y = (kit.data.logRow - 1) * TS - 4, on = R.sing === k && R.singT > 0;
      Ink.around(ctx, x - 30, y - 50, 66, 60, c => drawKooka(c, x, y, on, k, play.t), { pad: 6 });
      if (on) { ctx.save(); ctx.fillStyle = KOOKA_COLS[k]; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(x, y - 12, 26, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.font = `13px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.fillText(['KOO!', 'KA!', 'HA!', 'HOO!'][k], x, y - 50); ctx.restore(); }
      // the log's colour band (so the logs match the birds)
      ctx.save(); ctx.fillStyle = KOOKA_COLS[k]; ctx.fillRect(lx * TS + 6, kit.data.logRow * TS + 2, 2 * TS - 12, 4); ctx.restore();
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
    // the sheep on a raised board floor across the middle of the shed, a low rail at each end, the pen on the right
    const W = ROOM_W, g = K.room(W), Y = K.Y;
    g.west(keep); const x1 = K.east(g, keep, A, o);
    g.hline(6, x1, 7, '#'); g.put(6, 6, 'H'); g.put(x1, 6, 'H');
    g.hline(2, 4, 9, '-');
    g.data.penX = x1 - 5; g.data.sheep = [8, 10, 12, 14]; g.data.stage = 6;
    g.winSpot(A.id, x1 - 2, 6);
    // the roof hatch over the board floor (always there: the other way out)
    g.hline(9, 11, 4, '-');
    if (o.exit) g.door(10, 3, { to: o.exit, look: 'tourDoorHidden' });
    g.decor(9, Y, 'auWoolBale'); g.decor(13, Y, 'auWoolBale'); g.decor(17, Y, 'auShears');
    return g;
  },
  enter(play, A, R, kit) {
    for (const e of play.entities) if (e instanceof AuRoomSheep) e.remove = true;
    if (R.won) return;
    R.sheep = kit.data.sheep.map((x, k) => TourRooms.add(play, 'auRoomSheep', x, kit.data.stage, { k, penX: kit.data.penX * TS }));
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
    const x = kit.data.penX * TS, y = (kit.data.stage + 1) * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#a87a4a';
    ctx.fillRect(x - 4, y - 40, 8, 40); ctx.strokeRect(x - 4, y - 40, 8, 40);
    ctx.fillRect(x, y - 34, 5 * TS - 6, 5); ctx.strokeRect(x, y - 34, 5 * TS - 6, 5); ctx.fillRect(x, y - 18, 5 * TS - 6, 5); ctx.strokeRect(x, y - 18, 5 * TS - 6, 5);
    ctx.fillStyle = '#ffffff'; ctx.font = `11px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillText('PEN', x + 2.5 * TS, y - 46);
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
    const W = ROOM_W, g = K.room(W), Y = K.Y;
    g.area = { dark: true };
    g.west(keep);
    const ids = []; for (let k = 0; k < 6; k++) ids.push('opal:' + A.id + ':' + k);
    K.east(g, keep, A, o, { needsAll: ids });
    // the seam: timber props, a ladder of ledges up the middle
    g.hline(9, 11, 9, '-'); g.hline(13, 15, 6, '-'); g.hline(17, 19, 3, '-'); g.hline(20, 22, 8, '-'); g.hline(21, 23, 5, '-');
    const spots = [[10, 8], [14, 5], [18, 2], [21, 7], [22, 4], [16, Y]];
    spots.forEach(([x, y], k) => { g.put(x, y, g.L(['vkey', ids[k]])); g.need('opal ' + k, x, y); });
    g.data.opals = spots;
    g.decor(7, Y, 'auMineProp'); g.decor(12, Y, 'auMineProp'); g.decor(19, Y, 'auMineProp'); g.decor(5, Y, 'auLantern');
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
      // the possum's camp table in the middle of the hollow, raised: the three billy cans on it, the possum behind
      const W = ROOM_W, g = K.room(W), Y = K.Y;
      g.west(keep); const x1 = K.east(g, keep, A, o), mid = 16;
      g.hline(mid - 6, mid + 6, 6, '-');
      g.hline(5, 8, 8, '-');
      g.put(mid, 5, g.L(['spawn', 'roomDealer', { look: o.dealer || 'auPossum' }]));
      g.winSpot(A.id, mid - 3, 5);
      g.data.slots = [mid - 4, mid, mid + 4]; g.data.row = 5; g.data.cup = o.cup || 'auBilly'; g.data.joke = o.joke || ['banana', 'sock']; g.data.swaps = o.swaps || 6;
      if (o.exit) g.door(x1 - 1, Y, { to: o.exit, look: 'tourDoorHidden' });
      g.decor(6, Y, 'auCampShelf'); g.decor(25, 4, 'auGumLeaves');
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
    // five small plinths on a raised walkway across the middle of the souvenir yard
    const W = ROOM_W, g = K.room(W), Y = K.Y;
    g.west(keep); const x1 = K.east(g, keep, A, o);
    g.hline(4, x1, 8, '-');
    const pl = []; for (let k = 0; k < 5; k++) { const x = 5 + k * 4; g.fill(x, 6, x + 2, 7, 'H'); pl.push(x); }
    g.data.plinths = pl; g.data.plinthRow = 6;
    g.winSpot(A.id, x1 - 1, Y);
    if (o.exit) g.door(x1 - 3, Y, { to: o.exit, look: 'tourDoorHidden' });
    g.decor(8, Y, 'auSouvenirStand'); g.decor(18, Y, 'auSouvenirStand');
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.round = R.round || 0; this.deal(R); R.on = -1; } },
  deal(R) { R.odd = Math.floor(Math.random() * 5); R.cheer = 0; },
  update(play, dt, A, R, kit) {
    if (R.cheer > 0) R.cheer -= dt;
    if (R.won) return;
    const p = play.player;
    let k = -1;
    if (p.onGround && p.groundTy === kit.data.plinthRow) { const tx = Math.floor(p.cx / TS); k = kit.data.plinths.findIndex(x => tx >= x && tx <= x + 2); }
    if (k < 0) { R.on = -1; return; }
    if (k === R.on) return;
    R.on = k;
    if (k === R.odd) { R.round++; Sound.play('checkpoint', { vol: 0.6 }); play.burst(p.cx, p.y, 16, '#ffd84a', 'confetti'); if (R.round >= 3) TourRooms.win(play, A, R, { text: 'SHARP EYES!', coins: 6 }); else { play.bannerText = 'YES! NEXT ROUND'; play.bannerT = 1.2; this.deal(R); R.on = k; } }
    else { TourRoomKit.raspberry(play, 'NOPE: THAT ONE\'S FINE'); this.deal(R); R.on = k; }
  },
  draw(play, ctx, A, R, kit) {
    const kind = ODD_KINDS[Math.min(2, R.round || 0)];
    kit.data.plinths.forEach((x, k) => { ctx.save(); const gx = (x + 1.5) * TS, gy = kit.data.plinthRow * TS - 2; ctx.translate(gx, gy); ctx.scale(0.72, 0.72); ctx.translate(-gx, -gy); drawGiant(ctx, R.won ? 'pineapple' : kind, gx, gy, !R.won && k === R.odd, play.t); ctx.restore(); });
    if (!R.won) TourRooms.counter(play, ctx, R.round || 0, 3, null);
  }
});


/* ---------- each room its own place: five backdrops, their props, the one-screen view ---------- */
{
  const S = Tour.auKit.sets;
  Object.assign(BGPaint, {
    // the wombat's lounge: packed-earth walls, roots, two framed pictures (a moon, a patch of grass), a warm lamp glow
    auLoungeWall(ctx, L, rng, H) {
      ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
      ctx.strokeStyle = shade(L.color, 0.12); ctx.lineWidth = 3; for (let k = 0; k < 10; k++) { const x = rng() * BG_W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 20, 40, x - 20, 70, x + 10, 110); ctx.stroke(); }
      for (let x = 60; x < BG_W; x += 260) { ctx.fillStyle = '#5a3a20'; ctx.fillRect(x, 140, 70, 54); ctx.fillStyle = x % 520 < 260 ? '#1a2244' : '#6a9a4a'; ctx.fillRect(x + 6, 146, 58, 42); ctx.fillStyle = '#fff4d0'; if (x % 520 < 260) { ctx.beginPath(); ctx.arc(x + 35, 162, 9, 0, TAU); ctx.fill(); } else for (let k = 0; k < 6; k++) ctx.fillRect(x + 10 + k * 9, 172, 2, 10); }
      ctx.fillStyle = 'rgba(255,210,140,0.12)'; for (let x = 180; x < BG_W; x += 340) { ctx.beginPath(); ctx.arc(x, 120, 90, 0, TAU); ctx.fill(); }
      ctx.fillStyle = shade(L.color, -0.2); ctx.fillRect(0, L.base, BG_W, H - L.base);
    },
    // the shearing shed: corrugated iron walls, timber posts, a window onto the paddock, bales stacked at the back
    auShedWall(ctx, L, rng, H) {
      ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
      for (let x = 0; x < BG_W; x += 8) { ctx.fillStyle = x % 16 ? shade(L.color, 0.08) : shade(L.color, -0.1); ctx.fillRect(x, 0, 4, H); }
      ctx.fillStyle = 'rgba(120,70,40,0.25)'; for (let k = 0; k < 8; k++) ctx.fillRect(rng() * BG_W, 30 + rng() * 200, 40 + rng() * 60, 12);
      for (let x = 0; x < BG_W; x += 200) { ctx.fillStyle = '#8a6a48'; ctx.fillRect(x, 0, 16, H); ctx.fillStyle = '#6a4a30'; ctx.fillRect(x + 12, 0, 4, H); }
      for (let x = 70; x < BG_W; x += 400) { ctx.fillStyle = '#6a4a30'; ctx.fillRect(x - 4, 76, 108, 68); ctx.fillStyle = '#8ac8f0'; ctx.fillRect(x, 80, 100, 60); ctx.fillStyle = '#9ac86a'; ctx.fillRect(x, 118, 100, 22); ctx.fillStyle = '#6a4a30'; ctx.fillRect(x + 48, 80, 4, 60); }
      ctx.fillStyle = '#6a4a30'; ctx.fillRect(0, 20, BG_W, 10);
      ctx.fillStyle = shade(L.color, -0.25); ctx.fillRect(0, L.base, BG_W, H - L.base);
    },
    // the opal mine: a rough rock face, timber props and beams, glints of opal colour in the rock
    auMineWall(ctx, L, rng, H) {
      ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
      ctx.fillStyle = shade(L.color, 0.1); for (let k = 0; k < 40; k++) { ctx.beginPath(); ctx.ellipse(rng() * BG_W, rng() * H, 14 + rng() * 30, 8 + rng() * 14, rng(), 0, TAU); ctx.fill(); }
      for (let k = 0; k < 30; k++) { ctx.fillStyle = `hsl(${Math.floor(rng() * 360)},80%,65%)`; ctx.fillRect(rng() * BG_W, rng() * H, 3, 2); }
      for (let x = 40; x < BG_W; x += 180) { ctx.fillStyle = '#7a5a34'; ctx.fillRect(x, 30, 14, H); ctx.fillRect(x - 20, 30, 54, 12); ctx.fillStyle = '#5a4024'; ctx.fillRect(x + 10, 30, 4, H); }
    },
    // inside the gum's hollow: curved wood-grain walls, growth rings, a knot hole with daylight
    auHollowWall(ctx, L, rng, H) {
      ctx.fillStyle = L.color; ctx.fillRect(0, 0, BG_W, H);
      ctx.strokeStyle = shade(L.color, 0.14); ctx.lineWidth = 2;
      for (let k = 0; k < 14; k++) { const y = 20 + k * 22; ctx.beginPath(); for (let x = 0; x <= BG_W; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.01 + k) * 8); ctx.stroke(); }
      for (let x = 150; x < BG_W; x += 330) { ctx.fillStyle = shade(L.color, -0.25); ctx.beginPath(); ctx.ellipse(x, 100, 30, 40, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#bfe4ff'; ctx.beginPath(); ctx.ellipse(x, 100, 18, 26, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#7a9a5a'; ctx.beginPath(); ctx.ellipse(x - 4, 112, 10, 5, 0.4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = shade(L.color, -0.18); ctx.fillRect(0, L.base, BG_W, H - L.base);
    },
    // the souvenir yard of the big things: blue sky, a picket fence, strings of bunting, a far giant banana
    auSouvenirYard(ctx, L, rng, H) {
      ctx.fillStyle = '#7ac8ff'; ctx.fillRect(0, 0, BG_W, H);
      ctx.fillStyle = '#c8e8ff'; for (let k = 0; k < 6; k++) { const x = rng() * BG_W, y = 30 + rng() * 60; ctx.beginPath(); ctx.ellipse(x, y, 40, 14, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#e8c83a'; ctx.beginPath(); ctx.ellipse(780, 200, 30, 90, 0.5, 0, TAU); ctx.fill();
      const cols = ['#e8423a', '#ffd23a', '#3a8ae8', '#5ac84a'];
      for (let r = 0; r < 2; r++) { const y0 = 40 + r * 60; ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = 0; x <= BG_W; x += 16) ctx.lineTo(x, y0 + Math.sin(x / BG_W * TAU * 4) * 14); ctx.stroke(); for (let x = 8, k = 0; x < BG_W; x += 22, k++) { const y = y0 + Math.sin(x / BG_W * TAU * 4) * 14; ctx.fillStyle = cols[(k + r) % 4]; ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 14); ctx.closePath(); ctx.fill(); } }
      ctx.fillStyle = '#ffffff'; for (let x = 0; x < BG_W; x += 18) { ctx.fillRect(x, L.base - 40, 10, 40); ctx.beginPath(); ctx.moveTo(x, L.base - 40); ctx.lineTo(x + 5, L.base - 48); ctx.lineTo(x + 10, L.base - 40); ctx.fill(); }
      ctx.fillRect(0, L.base - 30, BG_W, 5); ctx.fillStyle = '#8ad05a'; ctx.fillRect(0, L.base, BG_W, H - L.base);
    }
  });
  const room = (set, name, layer, extra) => Object.assign({}, set, { name, music: 'tour_au', particles: 'none', rays: null, sky: ['#2a1a12', '#3a2418', '#4a2e1e'], horizonGlow: '#8a5a3a', celestial: { type: 'none' }, stars: 0, layers: [layer], fog: '#8a5a3a', decor: [] }, extra || {});
  Object.assign(THEMES, {
    au_lounge: room(S.outback, 'The Wombat\'s Lounge', { kind: 'auLoungeWall', color: '#6a4028', base: 360, f: 0.1 }, { darkness: 0.18, sky: ['#4a2c1a', '#5a3420', '#6a4028'] }),
    au_shed: room(S.big, 'The Shearing Shed', { kind: 'auShedWall', color: '#a8acb2', base: 380, f: 0.1 }, { fog: '#d8d0c0', sky: ['#5a5048', '#6a6058', '#8a8478'] }),
    au_mine: room(S.creek, 'The Opal Mine', { kind: 'auMineWall', color: '#4a3a34', base: 400, f: 0.1 }, { music: 'tour_au_night', sky: ['#2a201c', '#3a2c26', '#4a3a34'] }),
    au_hollowroom: room(S.canopy, 'The Possum\'s Hollow', { kind: 'auHollowWall', color: '#8a6440', base: 380, f: 0.1 }, { music: 'tour_au_night', darkness: 0.15, sky: ['#5a3c24', '#6a4a2e', '#7a5434'] }),
    au_yard: room(S.big, 'The Souvenir Yard', { kind: 'auSouvenirYard', color: '#9ac86a', base: 380, f: 0.1 }, { sky: ['#2a8ae8', '#7ac8ff', '#e8f8ff'], fog: '#e8f8ff', celestial: { type: 'sun', x: 0.8, y: 0.12, r: 22, color: '#fff8d8', glow: '#ffffff' } })
  });
  Object.assign(Decor, {
    auArmchair(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#a8443a'; rr(ctx, x - 26, y - 46, 52, 46, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c85a4a'; rr(ctx, x - 18, y - 24, 36, 16, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#5a3a20'; ctx.fillRect(x - 24, y - 4, 6, 4); ctx.fillRect(x + 18, y - 4, 6, 4); ctx.restore(); },
    auRug(ctx, x, y) { ctx.save(); ctx.fillStyle = '#c8783a'; ctx.beginPath(); ctx.ellipse(x, y - 2, 60, 6, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 2, 46, 4, 0, 0, TAU); ctx.stroke(); ctx.restore(); },
    auWoolBale(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#efe8d8'; rr(ctx, x - 22, y - 40, 44, 40, 6); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#a89a80'; ctx.lineWidth = 2; for (const dy of [-30, -14]) { ctx.beginPath(); ctx.moveTo(x - 22, y + dy); ctx.lineTo(x + 22, y + dy); ctx.stroke(); } ctx.fillStyle = '#3a6ac8'; ctx.font = TourBackstage.F6; ctx.textAlign = 'center'; ctx.fillText('WOOL', x, y - 19); ctx.restore(); },
    auShears(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#6a4a30'; ctx.fillRect(x - 2, y - 60, 4, 60); ctx.fillStyle = '#e8e0c8'; rr(ctx, x - 34, y - 78, 68, 22, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.font = TourBackstage.F6; ctx.textAlign = 'center'; ctx.fillText('SHEARING', x, y - 69); ctx.fillText('SHED', x, y - 61); ctx.restore(); },
    auMineProp(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#8a6a40'; ctx.fillRect(x - 5, y - 120, 10, 120); ctx.strokeRect(x - 5, y - 120, 10, 120); ctx.fillRect(x - 24, y - 128, 48, 10); ctx.strokeRect(x - 24, y - 128, 48, 10); ctx.restore(); },
    auCampShelf(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#7a5a34'; ctx.fillRect(x - 36, y - 60, 72, 6); ctx.strokeRect(x - 36, y - 60, 72, 6); ctx.fillRect(x - 34, y - 54, 5, 54); ctx.fillRect(x + 29, y - 54, 5, 54); for (let k = 0; k < 3; k++) { const bx = x - 22 + k * 22; ctx.fillStyle = '#b8bcc4'; rr(ctx, bx - 8, y - 80, 16, 20, 3); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#5a5a60'; ctx.beginPath(); ctx.arc(bx, y - 80, 7, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = INK; } ctx.restore(); },
    auSouvenirStand(ctx, x, y) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 30, y - 40, 60, 40); ctx.strokeRect(x - 30, y - 40, 60, 40); ctx.fillStyle = '#e8423a'; for (let k = 0; k < 4; k++) { ctx.fillRect(x - 34 + k * 18, y - 56, 9, 14); } ctx.strokeRect(x - 34, y - 56, 68, 14); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(x - 12, y - 46 + 20, 4, 10, 0.5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ff8a5a'; ctx.beginPath(); ctx.arc(x + 12, y - 24, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  });
  // the whole room in one view: as many rows as the room is tall, the camera fixed on its middle
  const isAu = A => !!(A && A.roomKit && /^au[A-Z]/.test(A.roomKit.kind));
  const vr0 = Play.prototype.viewRows;
  Play.prototype.viewRows = function () { return isAu(this.area) ? this.area.H : vr0.call(this); };
  TourHooks.on('camera', play => { const A = play.area; if (!isAu(A)) return; play.camX = (A.W * TS - Game.viewW) / 2; play.camY = (A.H * TS - Game.viewH) / 2; });
}

Object.assign(ENTITY_TYPES, { auPuff: AuPuff, auRoomSheep: AuRoomSheep, auOpal: AuOpal });
Tour.auKit.rooms = { AuRoomSheep, AuOpal, ODD_KINDS };
})();
