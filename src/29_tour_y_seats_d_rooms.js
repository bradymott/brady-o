/* ============================================================
   BELOW THE CHEAP SEATS: the six secret rooms (CHATGPT_RELAY.md B36-B40 and section F's Curtain Call Sheet), one per
   stage, in order. Each a 10-25 second game with a rule that reads in two seconds, played in ONE landscape view on a
   raised stage in the middle band (clear of the top bar, the stick and the buttons), each its own place with its own
   floor, walls and arrangement:
     seatsSpool   33-1 THE CABLE STORE       SPOOL SCHOOL: hop onto a big cable drum (THROW); the stick walks on it
                                             and it rolls the other way while its cable unwinds and tugs it. Keep the
                                             drum's hole over the brass peg until it drops on.
     seatsScale   33-2 THE COUNTERWEIGHT CAGE SAILMAKER'S SCALE: three sandbags go in the pan one at a time; on the
                                             mark the stick slides the brass weight along the arm. Keep the needle in
                                             its notch for each reading.
     (33-3 to 33-6: see their blocks below.)
   A miss costs nothing (a raspberry, the turn starts again). The prize cage opens at the win. Each kind scripts its
   own win for tools/sbw_rooms_test.js (testWin). The title comes alone first, then the rule on a pill, then the
   room's counter in one spot under the HUD.
   ============================================================ */
(function () {
if (typeof TourRooms === 'undefined' || !Tour.seatsKit) return;
const SK = Tour.seatsKit, INK = SK.INK, SA = SK.SeatsArt, RK = TourRoomKit;
const chime = (k, ok) => Sound.play('select', { vol: 0.5, pitch: ok === false ? 0.45 : Math.pow(2, [0, 4, 7, 12][k % 4] / 12) });
const W = 28, R1 = 20;   // the playable part is 21 columns: one landscape view (the rest of the 28 is rock)
// the room's shape: the way in on a raised ledge at the top left (clear of the stick), a stage (top row st) for the
// game, the cage on the stage at the right; L: { st, s0, shelf (a plank shelf on posts instead of a solid stage),
// tier: [x, st2] (a second, higher tier from column x), cx }
function stageRoom(keep, A, o, L) {
  L = Object.assign({ st: 8, s0: 6, cx: 17 }, L || {});
  const g = RK.room(W), st = L.st;
  g.west(keep);
  for (let x = 1; x < 6; x++) for (let y = 1; y <= 10; y++) { const c = g.get(x, y); if (c === '@' || c === 'D') { g.put(x, 5, c); if (c === 'D') { g.doorsAt[x + ',5'] = g.doorsAt[x + ',' + y]; delete g.doorsAt[x + ',' + y]; } g.put(x, y, '.'); } }
  g.fill(1, 6, 5, 10, '#');
  g.fill(R1 + 1, 1, W - 2, 10, '#');
  if (L.shelf) { g.hline(L.s0, R1, st, '-'); for (const x of [L.s0 + 1, Math.floor((L.s0 + R1) / 2), R1 - 1]) g.vline(x, st + 1, 10, 'H'); }
  else g.fill(L.s0, st, R1, 10, '#');
  if (L.tier) g.fill(L.tier[0], L.tier[1], R1, st, '#');
  const items = RK.prize(o, keep), cw = Math.max(3, items.length + 2), cst = L.tier ? L.tier[1] : st;
  g.cage(A.id, L.cx, cst - 1, items, { w: cw, h: 4 }); g.fill(L.cx + cw + 1, 1, R1, cst - 1, '#');
  g.data.st = st; g.data.cst = cst;
  return g;
}
// flip a finished room left to right (the way in on the right, the cage on the left)
function mirror(g, keys) {
  const Wd = g.W;
  g.g = g.g.map(r => r.slice().reverse());
  const flip = M => { const o = {}; for (const k in M) { const [x, y] = k.split(',').map(Number); o[(Wd - 1 - x) + ',' + y] = M[k]; } return o; };
  g.boxes = flip(g.boxes); g.doorsAt = flip(g.doorsAt);
  for (const q of g.needs) q.x = Wd * TS - q.x - q.w;
  for (const k of keys || []) { const v = g.data[k]; if (Array.isArray(v)) g.data[k] = v.map(x => Wd - 1 - x); else if (typeof v === 'number') g.data[k] = Wd - 1 - v; }
  g.data.mirror = true; return g;
}
// the room's counter: one spot just under the top bar, never over the game band; not while the rule is up
const hud = (play, ctx, str, col) => { if (play.toastT > 0) return; TourRooms.hudText(play, ctx, str, col, 13, 6); };
const quiet = (play, R) => !(play.bannerT > 0) && !R.ruleWait;
// a THROW mark on the stage: its seatsInput calls the room kind's input(...) or mark(...); 'lane' marks are live
// wherever the kind's inLane says (a mounted game)
class SeatsRoomMark extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.seatsProp = true; this.k = s.k; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.cue = s.cue || 'THROW'; this.stick = !!s.stick; }
  room() { const A = this.g.area; return A && A.roomKit ? { A, R: TourRooms.state(this.g, A), K: TourRooms.kinds[A.roomKit.kind] } : null; }
  get seatsStick() { const r = this.room(); return this.stick || !!(r && r.K.stickOn && r.K.stickOn(this.g, r.A, r.R, this)); }
  seatsTouch(p) { const r = this.room(); return !!r && !r.R.won && (this.k === 'lane' ? !!(r.K.inLane && r.K.inLane(this.g, r.A, r.R, p)) : SK.onMark(p, this.tx, this.fy, 0.8)); }
  seatsInput(p, inp, dt) { const r = this.room(); if (!r) return; if (r.K.input) r.K.input(this.g, r.A, r.R, r.A.roomKit, this, p, inp, dt); else if (inp.actionPressed && r.K.mark) r.K.mark(this.g, r.A, r.R, r.A.roomKit, this, p); }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) { if (this.k === 'lane') return; const p = this.g.player, r = this.room(); if (r && !r.R.won && !(r.K.hideMark && r.K.hideMark(this.g, r.A, r.R, this))) SA.ring(ctx, this.cx, this.fy * TS, this.t, p && this.seatsTouch(p), 17); if (p && this.seatsTouch(p) && !(r && r.K.hideCue && r.K.hideCue(this.g, r.A, r.R, this))) SA.cue(ctx, this.cx, this.fy * TS - 2.4 * TS, this.t, this.cue); }
}
ENTITY_TYPES.seatsRoomMark = SeatsRoomMark;
const marks = play => play.entities.filter(e => e instanceof SeatsRoomMark);
const P = play => play.player;
const mk = (g, x, y, k, cue, stick) => g.spawn(x, y, 'seatsRoomMark', { k, cue, stick });
// Brady standing still at a spot (the mounted games hold him there)
const hold = (p, x, y) => { p.x = x - p.w / 2; p.y = y - p.h; p.vx = 0; p.vy = 0; p.onGround = true; };

/* ================= seatsSpool: SPOOL SCHOOL (the cable store) ================= */
// the stage is row 8 (Brady on 7) from column 6; the drum rolls on it between columns 7 and 15; the brass peg at 12
const DRUM = { r: 1.35 * TS, x0: 7.2, x1: 15.6, start: 8.6, peg: 12.5 };
TourRooms.def('seatsSpool', {
  title: 'SPOOL SCHOOL', rule: 'ROLL THE DRUM. HOLE OVER THE PEG', need: 'DROP THE DRUM ON THE PEG FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 17 });
    mk(g, 7, 7, 0, 'THROW: HOP ON'); mk(g, 9, 7, 'lane', 'ROLL');
    g.winSpot(A.id, 10, 7);
    g.coins(8, 14, 4);
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.on = false; R.dx = DRUM.start * TS; R.hold = 0; R.v = 0; R.rot = 0; } },
  inLane(play, A, R, p) { return !!R.on; },
  hideMark(play, A, R) { return !!R.on; },
  stickOn(play, A, R) { return !!R.on; },
  input(play, A, R, kit, m, p, inp, dt) {
    if (m.k === 0) { if (!R.on && inp.actionPressed && quiet(play, R)) { R.on = true; R.v = 0; Sound.play('jump', { vol: 0.3 }); } return; }
    R.walk = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (inp.jumpPressed) { R.on = false; p.vy = -PHYS.jumpV * 0.6; }
  },
  reset(play, A, R, why) { R.fails = (R.fails || 0) + 1; RK.raspberry(play, why); R.on = false; R.dx = DRUM.start * TS; R.hold = 0; R.v = 0; const p = P(play); hold(p, 7.5 * TS, 8 * TS); },
  update(play, dt, A, R, kit) {
    if (R.won) { if (R.dropT != null && R.dropT < 1) R.dropT += dt * 2; return; }
    const p = P(play); R.t2 = (R.t2 || 0) + dt;
    if (R.dx == null) this.enter(play, A, R);
    const cy = 8 * TS - DRUM.r;
    if (!R.on) { R.walk = 0; return; }
    // the drum: Brady's walking rolls it the other way; the unwinding cable tugs it, now one way, now the other
    const tug = Math.sin(R.t2 * 0.9) * 0.9 * TS + Math.sin(R.t2 * 2.3 + 1) * 0.35 * TS;
    const want = -(R.walk || 0) * 2.3 * TS + tug;
    R.v = approach(R.v, want, 6 * TS * dt); R.dx += R.v * dt; R.rot += R.v * dt / DRUM.r;
    hold(p, R.dx, cy - DRUM.r + 2); if (R.walk) p.facing = R.walk;
    if (!quiet(play, R)) return;
    if (R.dx < DRUM.x0 * TS || R.dx > DRUM.x1 * TS) { this.reset(play, A, R, 'IT ROLLED OFF THE END! AGAIN'); return; }
    const on = Math.abs(R.dx - DRUM.peg * TS) < 10;
    if (on) { R.hold += dt; if (Math.floor(R.hold * 4) !== Math.floor((R.hold - dt) * 4)) chime(Math.floor(R.hold * 4), true); } else R.hold = Math.max(0, R.hold - dt * 1.5);
    if (R.hold >= 1.2) { R.dx = DRUM.peg * TS; R.on = false; R.dropT = 0; hold(p, R.dx + DRUM.r + 20, 8 * TS); TourRooms.win(play, A, R, { text: 'ON THE PEG!', coins: 3 }); }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, y8 = 8 * TS, x = R.dx == null ? DRUM.start * TS : R.dx, drop = R.won ? Math.min(1, R.dropT || 1) : 0, cy = y8 - DRUM.r + drop * 10, r = DRUM.r, px = DRUM.peg * TS;
    const aligned = !R.won && Math.abs(x - px) < 10;
    // the stops at both ends of the run (painted chocks), the peg
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    for (const sx of [DRUM.x0 * TS - r, DRUM.x1 * TS + r]) { ctx.fillStyle = SA.RUST_D; ctx.beginPath(); ctx.moveTo(sx - 10, y8); ctx.lineTo(sx, y8 - 16); ctx.lineTo(sx + 10, y8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = aligned ? '#ffe68a' : SA.GOLD; ctx.fillRect(px - 5, y8 - 26 + drop * 10, 10, 26); ctx.strokeRect(px - 5, y8 - 26 + drop * 10, 10, 26); ctx.beginPath(); ctx.arc(px, y8 - 26 + drop * 10, 5, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.restore();
    // the unwound cable lying on the stage behind the drum
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y8 - 3); ctx.bezierCurveTo(x + 60, y8 - 2, x + 90, y8 - 6, 15.8 * TS + 60, y8 - 3); ctx.stroke(); ctx.strokeStyle = SA.MUL_L; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    // the drum: two teal flanges, cream cable wound on it, rust spokes turning, the hole at its middle
    ctx.save(); ctx.translate(x, cy); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.fillStyle = SA.TEAL; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SA.MUL_L; ctx.beginPath(); ctx.arc(0, 0, r * 0.74, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = SA.MUL_D; ctx.lineWidth = 1.2; for (let k = 0.42; k < 0.74; k += 0.08) { ctx.beginPath(); ctx.arc(0, 0, r * k, 0, TAU); ctx.stroke(); }
    ctx.rotate(R.rot || 0); ctx.strokeStyle = INK; ctx.lineWidth = 6; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(k * Math.PI / 2) * r * 0.4, Math.sin(k * Math.PI / 2) * r * 0.4); ctx.stroke(); }
    ctx.strokeStyle = SA.RUST; ctx.lineWidth = 3.6; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(k * Math.PI / 2) * r * 0.4, Math.sin(k * Math.PI / 2) * r * 0.4); ctx.stroke(); }
    ctx.fillStyle = '#120a10'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    // the live line: from the hole straight down; it turns green over the peg; the hold fills a ring round the hole
    if (!R.won) {
      ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = aligned ? 'rgba(154,255,138,0.95)' : 'rgba(255,236,170,0.75)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, cy + 8); ctx.lineTo(x, y8); ctx.stroke(); ctx.restore();
      if (R.hold > 0) { ctx.save(); ctx.strokeStyle = '#9aff8a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, cy, 14, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, R.hold / 1.2)); ctx.stroke(); ctx.restore(); }
    }
    if (!R.won && quiet(play, R)) hud(play, ctx, R.on ? (aligned ? 'HOLD IT THERE...' : 'HOLE OVER THE PEG') : 'THROW BY THE DRUM TO HOP ON');
  },
  testWin(g, A, R, kit, frame) {
    const p = g.player; hold(p, 7.5 * TS, 8 * TS);
    for (let q = 0; q < 240; q++) frame(g, {});
    const m = marks(g).find(e => e.k === 0); this.input(g, A, R, kit, m, p, { actionPressed: true });
    for (let q = 0; q < 120 * 14 && !R.won; q++) { const d = DRUM.peg * TS - R.dx, want = clamp(d * 0.05, -1, 1); const wk = Math.abs(d) < 3 ? 0 : -Math.sign(want) * (Math.abs(R.v) > TS * 1.2 && Math.sign(R.v) === Math.sign(d) ? 0 : 1); frame(g, { right: wk > 0, left: wk < 0 }); }
  }
});

/* ================= seatsScale: SAILMAKER'S SCALE (the counterweight cage) ================= */
// mirrored (the way in on the right). The steelyard's pivot over column 9 (mirrored: 18), its pan on the short arm,
// the brass weight on the long arm; the mark under the arm. Bags 1, 2, 3 go in; balance: weight distance = bag x 2
// tiles. The needle must sit in its notch for 1 s per reading.
const SC = { piv: 9, panD: 2, maxD: 7.5, minD: 0.6, bags: [1, 1.8, 2.6] };
TourRooms.def('seatsScale', {
  title: 'SAILMAKER\'S SCALE', rule: 'STICK SLIDES THE WEIGHT. NEEDLE IN THE NOTCH', need: 'THREE READINGS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 16, tier: [16, 7] });
    mk(g, 11, 7, 0, 'STICK: SLIDE', true);
    g.winSpot(A.id, 12, 7);
    g.coins(13, 15, 4);
    mirror(g, []);
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.n = R.n || 0; R.d = 1.0 * TS; R.ang = 0; R.hold = 0; R.drop = 0; R.stopT = 0; } },
  px(A) { return (A.roomKit.data && A.roomKit.data.mirror ? W - 1 - SC.piv : SC.piv) * TS + TS / 2; },
  dirX(A) { return A.roomKit.data && A.roomKit.data.mirror ? -1 : 1; },
  input(play, A, R, kit, m, p, inp, dt) {
    if (!quiet(play, R) || R.drop > 0) return;
    const s = this.dirX(A), d = ((inp.right ? 1 : 0) - (inp.left ? 1 : 0)) * s;
    R.d = clamp(R.d + d * 2.2 * TS * dt, SC.minD * TS, SC.maxD * TS);
  },
  reset(play, A, R, why) { R.fails = (R.fails || 0) + 1; RK.raspberry(play, why); R.d = 1.0 * TS; R.hold = 0; R.stopT = 0; R.ang = 0; },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    if (R.d == null) this.enter(play, A, R);
    if (R.drop > 0) { R.drop -= dt; if (R.drop <= 0) R.drop = 0; }
    // the arm's tilt follows the torque, slowly (a heavy arm): + is the pan side down
    const bag = SC.bags[Math.min(R.n, 2)], tq = bag * SC.panD * TS - R.d;
    const want = clamp(tq / (3 * TS), -0.5, 0.5);
    R.ang = approach(R.ang, want, dt * (0.9 + Math.abs(want - R.ang) * 2));
    if (!quiet(play, R) || R.drop > 0) return;
    const inNotch = Math.abs(R.ang) < 0.06 && Math.abs(want) < 0.09;
    if (inNotch) { R.hold += dt; if (R.hold >= 1.0) { R.n++; chime(R.n, true); R.hold = 0; if (R.n >= 3) { TourRooms.win(play, A, R, { text: 'THREE TRUE READINGS!', coins: 3 }); return; } R.drop = 0.9; say0(play, A, 'READING ' + R.n + ' TRUE! NEXT BAG'); } }
    else R.hold = Math.max(0, R.hold - dt * 2);
    if (Math.abs(R.ang) >= 0.49) { R.stopT += dt; if (R.stopT > 1.0) this.reset(play, A, R, 'CLONK! THE ARM HIT THE STOP'); } else R.stopT = 0;
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, px = this.px(A), s = this.dirX(A), py = 3.4 * TS, ang = (R.ang || 0) * s, ca = Math.cos(ang), sa = Math.sin(ang);
    const at = d => [px + ca * d * s, py + sa * d * s];
    // the post and pivot
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = SA.TIN_D; ctx.fillRect(px - 6, py, 12, 8 * TS - py - 8); ctx.strokeRect(px - 6, py, 12, 8 * TS - py - 8);
    // the arm
    const [ax0, ay0] = at(-SC.panD * TS - 10), [ax1, ay1] = at(SC.maxD * TS + 14);
    SA.tube(ctx, ax0, ay0, ax1, ay1, 8, SA.RUST);
    // the pan on the short arm with its bags in it
    const [qx, qy] = at(-SC.panD * TS);
    SA.rope(ctx, qx, qy, qx - 18, qy + 60, 0); SA.rope(ctx, qx, qy, qx + 18, qy + 60, 0);
    ctx.fillStyle = SA.TIN; ctx.beginPath(); ctx.ellipse(qx, qy + 62, 26, 7, 0, 0, Math.PI); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(qx - 26, qy + 62); ctx.lineTo(qx + 26, qy + 62); ctx.stroke();
    const nIn = Math.min(R.won ? 3 : (R.n || 0) + 1, 3);
    for (let k = 0; k < nIn; k++) { const dropping = k === nIn - 1 && R.drop > 0 && !R.won, dy = dropping ? -R.drop * 80 : 0; SA.sandbag(ctx, qx - 12 + k * 12, qy + 60 + dy - k * 6, 0.55 + k * 0.12, false); }
    // the brass weight on the long arm
    const [wx, wy] = at(R.d || TS);
    ctx.fillStyle = SA.GOLD; rr(ctx, wx - 12, wy - 4, 24, 26, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = SA.GOLD_D; ctx.fillRect(wx - 9, wy + 14, 18, 3);
    // the dial at the pivot: the notch and the needle (green when it sits in the notch)
    const inN = Math.abs(R.ang || 0) < 0.06;
    ctx.fillStyle = '#f4ead4'; ctx.beginPath(); ctx.arc(px, py, 30, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = inN ? '#5ad84a' : '#d8c8a0'; ctx.beginPath(); ctx.moveTo(px, py); ctx.arc(px, py, 30, -Math.PI / 2 - 0.12, -Math.PI / 2 + 0.12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.sin(ang * 1.6) * 28, py - Math.cos(ang * 1.6) * 28); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(px, py, 4, 0, TAU); ctx.fill();
    if (R.hold > 0) { ctx.strokeStyle = '#9aff8a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(px, py, 36, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, R.hold)); ctx.stroke(); }
    ctx.restore();
    if (!R.won && quiet(play, R)) hud(play, ctx, 'READING ' + Math.min(3, (R.n || 0) + 1) + ' OF 3' + (inN ? ': HOLD IT' : ''));
  },
  testWin(g, A, R, kit, frame) {
    const p = g.player, m = marks(g).find(e => e.k === 0); hold(p, m.cx, m.fy * TS);
    for (let q = 0; q < 240; q++) frame(g, {});
    for (let q = 0; q < 120 * 30 && !R.won; q++) { hold(p, m.cx, m.fy * TS); const bag = SC.bags[Math.min(R.n, 2)], dWant = bag * SC.panD * TS, e = dWant - R.d, s = this.dirX(A); if (Math.abs(e) >= 3) this.input(g, A, R, kit, m, p, { right: e * s > 0, left: e * s < 0 }, 1 / 120); frame(g, {}); }
  }
});
const say0 = (play, A, txt) => SK.say(play, play.camX + Game.viewW / 2, 6 * TS, txt, '#9aff8a');

//ROOMS

// a Cheap Seats room's words in turn: the title alone (about 1.5 s), then the rule's pill; the room's lines after that
{
  const en0 = TourRooms.enter;
  TourRooms.enter = function (play, A) {
    en0.apply(this, arguments);
    const kit = A.roomKit; if (!(kit && /^seats/.test(kit.kind))) return;
    const R = this.state(play, A);
    play.toastT = 0; play.bannerT = Math.max(play.bannerT || 0, 1.5); R.ruleWait = !R.won && !!kit.rule;
  };
  const dr0 = TourRooms.draw;
  TourRooms.draw = function (play, ctx) {
    const kit = play.area && play.area.roomKit;
    if (!(kit && /^seats/.test(kit.kind)) || !(play.bannerT > 0)) return dr0.apply(this, arguments);
    ctx.save(); ctx.globalAlpha = clamp(1 - play.bannerT * 3, 0.15, 1); try { return dr0.apply(this, arguments); } finally { ctx.restore(); }
  };
  const up0 = TourRooms.update;
  TourRooms.update = function (play, dt) {
    const A = play.area, kit = A && A.roomKit;
    if (kit && /^seats/.test(kit.kind)) { const R = this.state(play, A); if (R.ruleWait && !(play.bannerT > 0)) { R.ruleWait = false; play.toast(kit.rule); } }
    return up0.apply(this, arguments);
  };
}
// the camera in a Cheap Seats room: the whole room's width in view, the stage band in the middle
TourHooks.on('camera', (play, dt) => {
  const A = play.area; if (!(A && A.roomKit && /^seats/.test(A.roomKit.kind))) return;
  const vw = (R1 + 1) * TS, mir = A.roomKit.data && A.roomKit.data.mirror;
  if (Game.viewW >= vw - 8) play.camX = clamp((mir ? A.W * TS - vw : 0) + (vw - Game.viewW) / 2, 0, Math.max(0, A.W * TS - Game.viewW));
});
{
  const ct0 = Play.prototype.camTargetY;
  Play.prototype.camTargetY = function (snap) { const A = this.area; if (A && A.roomKit && /^seats/.test(A.roomKit.kind)) return clamp(TS, 0, Math.max(0, A.H * TS - Game.viewH)); return ct0.call(this, snap); };
}
Tour.seatsKit.Rooms = TourRooms;
Object.assign(Tour.seatsKit, { stageRoom, mirror, hud, quiet, mk, marks, hold, chime, R1, W });
})();
