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
     seatsEgg     33-3 THE PROPS TABLE        EGG ON END: on the mark the stick nudges the wooden prop egg against its
                                             lean; let go when it stands straight and it must stay up two seconds.
     seatsGap     33-4 THE GREEN ROOM         PERFECT GAP: walking on the plank over the tureen tips the soup; the two
                                             crackers slide (the current spreads them); the olive sits on both while
                                             the gap is narrow: a slow count of three. If the gap opens, it plops in.
     seatsRest    33-5 THE BAND PIT           LEAVE ME A REST: four tin stagehands, the fourth naps. A count-in bar, then
                                             two bars: THROW on beats 1, 2, 3; thumb off the fourth.
     seatsCall    33-6 THE CURTAIN CALL       CURTAIN CALL SHEET: four bows under the curtain (three stagehands and one
                                             cheeky sleeve that bows twice); a flower to each DIFFERENT pair of shoes.
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

/* ================= seatsEgg: EGG ON END (the props table) ================= */
// the way in on a raised shelf (the room on posts); the props table's top is the stage at row 8 from column 6; the
// wooden prop egg stands on its point by the table's middle (column 11); the mark beside it (column 9)
const EGG = { x: 12.5, mark: 9 };
TourRooms.def('seatsEgg', {
  title: 'EGG ON END', rule: 'NUDGE AGAINST THE LEAN. LET GO WHEN STRAIGHT', need: 'STAND THE EGG UP FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 16, shelf: true });
    mk(g, EGG.mark, 7, 0, 'STICK: NUDGE', true);
    g.winSpot(A.id, 10, 7);
    g.coins(9, 14, 3);
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.a = 0.25; R.w = 0; R.up = 0; R.push = 0; } },
  input(play, A, R, kit, m, p, inp, dt) { R.push = quiet(play, R) ? (inp.right ? 1 : 0) - (inp.left ? 1 : 0) : 0; },
  reset(play, A, R, why) { R.fails = (R.fails || 0) + 1; RK.raspberry(play, why); R.a = (R.fails % 2 ? -0.25 : 0.25); R.w = 0; R.up = 0; },
  update(play, dt, A, R, kit) {
    if (R.won) { R.a = approach(R.a, 0, dt); return; }
    if (R.a == null) this.enter(play, A, R);
    const p = P(play), m = marks(play)[0], onIt = m && p.seatsProp === m;
    if (!onIt) R.push = 0;
    R.t2 = (R.t2 || 0) + dt;
    if (!quiet(play, R)) return;
    // a wobbling egg on its point: it leans further the more it leans; a nudge pushes against the lean
    const wob = Math.sin(R.t2 * 1.7) * 0.25 + Math.sin(R.t2 * 3.1 + 2) * 0.12;
    R.w += (0.8 * R.a + wob * 0.35 * Math.min(1, Math.abs(R.a) * 6) - R.push * 2.2 - R.w * 1.2) * dt; R.a += R.w * dt;
    if (Math.abs(R.a) > 0.95) { this.reset(play, A, R, 'IT TOPPLED! STAND IT AGAIN'); return; }
    const straight = Math.abs(R.a) < 0.09 && Math.abs(R.w) < 0.35 && !R.push;
    if (straight) { R.up += dt; if (Math.floor(R.up * 2) !== Math.floor((R.up - dt) * 2)) chime(Math.floor(R.up * 2), true); if (R.up >= 2) TourRooms.win(play, A, R, { text: 'BALANCED ON ITS END!', coins: 3 }); }
    else R.up = 0;
  },
  draw(play, ctx, A, R, kit) {
    const y8 = 8 * TS, x = EGG.x * TS, a = R.a || 0, straight = Math.abs(a) < 0.09;
    // the props table's clutter (dull): a teapot, a crown, a rubber chicken, all behind the egg
    ctx.save(); ctx.globalAlpha = 0.85; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.fillStyle = '#9a8a6a'; ctx.beginPath(); ctx.ellipse(7.2 * TS, y8 - 14, 16, 13, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b89a4a'; ctx.beginPath(); ctx.moveTo(15.2 * TS - 14, y8); ctx.lineTo(15.2 * TS - 14, y8 - 14); ctx.lineTo(15.2 * TS - 7, y8 - 6); ctx.lineTo(15.2 * TS, y8 - 18); ctx.lineTo(15.2 * TS + 7, y8 - 6); ctx.lineTo(15.2 * TS + 14, y8 - 14); ctx.lineTo(15.2 * TS + 14, y8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // the plumb line: where straight is (green when the egg stands straight)
    ctx.save(); ctx.setLineDash([6, 5]); ctx.strokeStyle = straight ? 'rgba(154,255,138,0.95)' : 'rgba(255,236,170,0.6)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y8 - 4); ctx.lineTo(x, y8 - 3.2 * TS); ctx.stroke(); ctx.restore();
    // the egg: a big wooden egg on its point, its grain, a painted gold band
    ctx.save(); ctx.translate(x, y8 - 2); ctx.rotate(a); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.fillStyle = '#d8a86a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-34, -6, -30, -84, 0, -86); ctx.bezierCurveTo(30, -84, 34, -6, 0, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#b8884a'; ctx.lineWidth = 1.4; for (const k of [-10, 0, 10]) { ctx.beginPath(); ctx.moveTo(k * 0.6, -6); ctx.quadraticCurveTo(k * 1.6, -44, k * 0.8, -80); ctx.stroke(); }
    ctx.fillStyle = SA.TEAL; ctx.fillRect(-27, -42, 54, 8); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(-27, -42, 54, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(-12, -60, 5, 12, 0.2, 0, TAU); ctx.fill();
    ctx.restore();
    // the lean's arrow (which way it is going), the count
    if (!R.won && Math.abs(a) > 0.09) SA.pill(ctx, x + Math.sign(a) * 50, y8 - 3.6 * TS, Math.sign(a) > 0 ? 'LEANING >' : '< LEANING', '#ffd84a', 0.9);
    if (R.up > 0 && !R.won) { ctx.save(); ctx.strokeStyle = '#9aff8a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y8 - 3.9 * TS, 12, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, R.up / 2)); ctx.stroke(); ctx.restore(); }
    if (!R.won && quiet(play, R)) hud(play, ctx, R.up > 0 ? 'HANDS OFF... HOLDING ' + Math.min(2, R.up).toFixed(1) + ' S' : 'STAND IT UP STRAIGHT, THEN LET GO');
  },
  testWin(g, A, R, kit, frame) {
    const p = g.player, m = marks(g)[0]; hold(p, m.cx, 8 * TS);
    for (let q = 0; q < 240; q++) frame(g, {});
    for (let q = 0; q < 120 * 20 && !R.won; q++) { hold(p, m.cx, 8 * TS); const u = R.a * 1.6 + R.w * 0.9, d = Math.abs(u) < 0.06 ? 0 : Math.sign(u); frame(g, { right: d > 0, left: d < 0 }); }
  }
});

/* ================= seatsGap: PERFECT GAP (the green room) ================= */
// mirrored. A big tureen of soup on the stage, a plank across its rim the stage itself; Brady's weight on the plank
// tips the tureen toward him: the two crackers floating on it slide that way (the soup's current spreads them
// apart). The olive sits on them while the gap between them is narrow: a slow count of three wins; if the gap opens
// under it, the olive plops in (a miss)
const GAP = { c: 11, half: 5 * TS, cw: 40, oliveMax: 18 };
TourRooms.def('seatsGap', {
  title: 'PERFECT GAP', rule: 'WALK TO TIP THE SOUP. OLIVE ON BOTH, COUNT THREE', need: 'BRIDGE THE CRACKERS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 17 });
    g.winSpot(A.id, 11, 7);
    g.coins(7, 9, 4); g.coins(13, 15, 4);
    mirror(g, []);
    return g;
  },
  cx(A) { return ((A.roomKit.data && A.roomKit.data.mirror ? W - 1 - GAP.c : GAP.c) + 0.5) * TS; },
  enter(play, A, R) { if (!R.won) { R.c1 = -70; R.c2 = 70; R.v1 = 0; R.v2 = 0; R.n = 0; R.tilt = 0; R.on = false; } },
  reset(play, A, R, why) { R.fails = (R.fails || 0) + 1; RK.raspberry(play, why); R.c1 = -70; R.c2 = 70; R.v1 = R.v2 = 0; R.n = 0; R.on = false; },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    if (R.c1 == null) this.enter(play, A, R);
    const p = P(play), cx = this.cx(A), onPlank = p.onGround && p.groundTy === 8 && Math.abs(p.cx - cx) < GAP.half + 20;
    R.tilt = approach(R.tilt, onPlank ? clamp((p.cx - cx) / GAP.half, -1, 1) : 0, dt * 2.5);
    if (!quiet(play, R)) return;
    // each cracker: down the tilt, the current spreading them from the middle, drag; the rims stop them
    const step = (c, v) => { v += (R.tilt * 150 + Math.sign(c || 1) * 26 - v * 1.6) * dt; c += v * dt; const L = GAP.half - GAP.cw / 2 - 6; if (c < -L) { c = -L; v = Math.max(0, v) * 0; } if (c > L) { c = L; v = 0; } return [c, v]; };
    [R.c1, R.v1] = step(R.c1, R.v1); [R.c2, R.v2] = step(R.c2, R.v2);
    if (R.c2 - R.c1 < GAP.cw) { const m = (R.c1 + R.c2) / 2, v = (R.v1 + R.v2) / 2; R.c1 = m - GAP.cw / 2; R.c2 = m + GAP.cw / 2; R.v1 = R.v2 = v; }
    const gap = R.c2 - R.c1 - GAP.cw;
    if (gap <= GAP.oliveMax) { if (!R.on) { R.on = true; R.n = 0; Sound.play('pick', { vol: 0.3 }); } R.n += dt; if (Math.floor(R.n) !== Math.floor(R.n - dt)) chime(Math.floor(R.n), true); if (R.n >= 3) TourRooms.win(play, A, R, { text: 'A PERFECT GAP!', coins: 3 }); }
    else if (R.on) { this.reset(play, A, R, 'PLOP! THE OLIVE FELL IN'); }
  },
  draw(play, ctx, A, R, kit) {
    const y8 = 8 * TS, cx = this.cx(A), tilt = R.tilt || 0, a = tilt * 0.12;
    // the tureen: a big cream bowl sunk in the stage under the plank
    ctx.save(); ctx.translate(cx, y8 + 6); ctx.rotate(a); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.fillStyle = '#f0e8d0'; ctx.beginPath(); ctx.moveTo(-GAP.half - 16, -10); ctx.quadraticCurveTo(-GAP.half, 70, 0, 74); ctx.quadraticCurveTo(GAP.half, 70, GAP.half + 16, -10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0a050'; ctx.beginPath(); ctx.ellipse(0, -10, GAP.half + 10, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,200,0.4)'; ctx.beginPath(); ctx.ellipse(-GAP.half * 0.4, -12, 30, 3, 0, 0, TAU); ctx.fill();
    // the crackers and the olive (on a stagehand's cocktail stick until it can sit on both)
    const gap = (R.c2 || 70) - (R.c1 || -70) - GAP.cw, ok = gap <= GAP.oliveMax;
    for (const c of [R.c1 == null ? -70 : R.c1, R.c2 == null ? 70 : R.c2]) { ctx.fillStyle = '#e8c070'; rr(ctx, c - GAP.cw / 2, -18, GAP.cw, 10, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#b8883a'; for (const d of [-10, 0, 10]) { ctx.beginPath(); ctx.arc(c + d, -13, 1.5, 0, TAU); ctx.fill(); } }
    const ox = ((R.c1 || -70) + (R.c2 || 70)) / 2;
    if (ok || R.won) { ctx.fillStyle = '#5a8a3a'; ctx.beginPath(); ctx.ellipse(ox, -26, 11, 9, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d84a3a'; ctx.beginPath(); ctx.arc(ox + 4, -28, 3, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (!(ok || R.won)) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#5a8a3a'; const oy = y8 - 3 * TS; ctx.beginPath(); ctx.ellipse(cx + ox, oy, 11, 9, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = SA.CREAM; ctx.beginPath(); ctx.moveTo(cx + ox, oy - 9); ctx.lineTo(cx + ox, oy - 40); ctx.stroke(); ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(255,236,170,0.7)'; ctx.beginPath(); ctx.moveTo(cx + ox, oy + 10); ctx.lineTo(cx + ox, y8 - 10); ctx.stroke(); ctx.restore(); }
    if (!R.won && quiet(play, R)) hud(play, ctx, R.on ? 'COUNT: ' + Math.min(3, Math.floor(R.n) + 1) + '...' : 'CLOSE THE GAP: ' + Math.max(0, Math.round(gap - GAP.oliveMax)));
  },
  testWin(g, A, R, kit, frame) {
    const p = g.player, cx = this.cx(A); hold(p, cx, 8 * TS);
    for (let q = 0; q < 240; q++) frame(g, {});
    // stand over the crackers' middle, nudging toward the far one
    const want = cx + GAP.half * 0.7; for (let q = 0; q < 120 * 25 && !R.won; q++) frame(g, { right: p.cx < want - 6, left: p.cx > want + 6 });
  }
});

/* ================= seatsRest: LEAVE ME A REST (the band pit) ================= */
// the way in on the right (mirrored); the band (four tin stagehands) on a riser at the back; the beat lamps over them;
// the mark in front. A count-in bar first (watch: three bob, the fourth naps), then two bars to play: THROW on beats
// 1, 2 and 3; keep your thumb off the fourth
const BEAT = 0.75, TAP = 0.2;
TourRooms.def('seatsRest', {
  title: 'LEAVE ME A REST', rule: 'TAP THROW ON THREE BEATS. NOT THE FOURTH', need: 'PLAY TWO BARS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 17 });
    mk(g, 11, 7, 0, 'TAP THROW');
    g.winSpot(A.id, 11, 7);
    g.coins(8, 9, 5); g.coins(13, 14, 5);
    mirror(g, []);
    return g;
  },
  cx(A) { return ((A.roomKit.data && A.roomKit.data.mirror ? W - 1 - 11 : 11) + 0.5) * TS; },
  enter(play, A, R) { if (!R.won) { R.ph = 'wait'; R.k0 = 0; R.hits = {}; } },
  restart(play, A, R) { R.ph = 'count'; R.t0 = play.t; R.hits = {}; },
  reset(play, A, R, why) { R.fails = (R.fails || 0) + 1; RK.raspberry(play, why); R.ph = 'wait'; R.hits = {}; R.waitT = play.t + 1.2; },
  beatAt(play, R) { return (play.t - R.t0) / BEAT; },
  mark(play, A, R, kit, m, p) {
    if (R.ph !== 'play') return;
    const b = this.beatAt(play, R) - 4, k = Math.round(b), off = (b - k) * BEAT;
    if (k < 0 || k > 7 || Math.abs(off) > TAP) return;
    if (k % 4 === 3) { this.reset(play, A, R, 'SHH! THAT ONE IS A REST'); return; }
    if (!R.hits[k]) { R.hits[k] = true; chime(k % 4, true); play.burst(this.cx(A), 6 * TS, 6, SA.GOLD, 'spark'); }
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    if (!R.ph) this.enter(play, A, R);
    const p = P(play), on = Math.abs(p.cx - this.cx(A)) < TS && p.onGround;
    if (R.ph === 'wait') { if (on && quiet(play, R) && !(play.t < (R.waitT || 0))) this.restart(play, A, R); return; }
    const b = this.beatAt(play, R), kb = Math.floor(b);
    if (kb !== R.lastB) { R.lastB = kb; if (kb >= 0 && kb < 12 && kb % 4 !== 3) Sound.play('select', { vol: kb < 4 ? 0.25 : 0.12, pitch: kb % 4 === 0 ? 1.0 : 0.8 }); }
    if (R.ph === 'count' && b >= 3.6) R.ph = 'play';
    if (R.ph === 'play') {
      if (!on) { this.reset(play, A, R, 'STAY ON YOUR MARK!'); return; }
      const k = Math.floor(b - 4 - TAP / BEAT);
      for (let q = 0; q <= Math.min(7, k); q++) if (q % 4 !== 3 && !R.hits[q]) { this.reset(play, A, R, 'MISSED A BEAT! FROM THE TOP'); return; }
      if (b - 4 > 8) { TourRooms.win(play, A, R, { text: 'TWO BARS, ONE PERFECT REST!', coins: 3 }); }
    }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, cx = this.cx(A), y = 6.2 * TS, b = R.ph === 'count' || R.ph === 'play' ? this.beatAt(play, R) : -1, kb = Math.floor(b), q = ((kb % 4) + 4) % 4, fr = b - kb;
    // the riser and the band: four tin stagehands; the one whose beat it is bobs; the fourth naps
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#3a3a52'; ctx.fillRect(cx - 4.2 * TS, y - 6, 8.4 * TS, 12); ctx.strokeRect(cx - 4.2 * TS, y - 6, 8.4 * TS, 12); ctx.restore();
    for (let k = 0; k < 4; k++) {
      const hx = cx + (k - 1.5) * 2 * TS, now = b >= 0 && kb < 12 && q === k && fr < 0.4, nap = k === 3;
      SA.hand(ctx, hx, y - 6, t, nap ? '#8a8aa0' : SA.GOLD, now && !nap ? 'bow' : 'stand', 1, 1.1);
      if (nap) { ctx.save(); ctx.font = TourBackstage.F9; ctx.fillStyle = '#c8d8ff'; ctx.fillText('z', hx + 14, y - 52 - Math.sin(t * 2) * 3); ctx.fillText('Z', hx + 22, y - 64 - Math.sin(t * 2 + 1) * 3); ctx.restore(); }
      // its beat lamp (the fourth is a little pillow: a rest)
      const ly = 3.4 * TS, lit = now;
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (nap) { ctx.fillStyle = lit ? '#c8d8ff' : '#6a6a88'; rr(ctx, hx - 16, ly - 9, 32, 18, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('REST', hx, ly + 1); }
      else { ctx.fillStyle = lit ? '#ffe68a' : '#5a4a2a'; ctx.beginPath(); ctx.arc(hx, ly, 13, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = lit ? INK : '#c8b890'; ctx.font = TourBackstage.F9; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(k + 1), hx, ly + 1); }
      ctx.restore();
    }
    // the bars: a dot per beat played
    if (R.ph === 'play' || R.ph === 'count') for (let k = 0; k < 8; k++) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillStyle = k % 4 === 3 ? '#6a6a88' : R.hits[k] ? '#9aff8a' : '#3a3a4a'; ctx.beginPath(); ctx.arc(cx + (k - 3.5) * 22, 4.6 * TS, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (!R.won && quiet(play, R)) hud(play, ctx, R.ph === 'wait' ? 'STAND ON THE MARK' : R.ph === 'count' ? 'LISTEN: ONE, TWO, THREE, REST' : 'BAR ' + (b < 8 ? 1 : 2) + ' OF 2');
  },
  testWin(g, A, R, kit, frame) {
    const p = g.player, cx = this.cx(A); hold(p, cx, 8 * TS);
    for (let q = 0; q < 240; q++) frame(g, {});
    const m = marks(g)[0];
    for (let q = 0; q < 120 * 16 && !R.won; q++) { hold(p, cx, 8 * TS); if (R.ph === 'play') { const b = this.beatAt(g, R) - 4, k = Math.round(b); if (k >= 0 && k % 4 !== 3 && !R.hits[k] && Math.abs(b - k) * BEAT < 0.05) this.mark(g, A, R, kit, m, p); } frame(g, {}); }
  }
});

/* ================= seatsCall: CURTAIN CALL SHEET (the curtain call) ================= */
// the way in on the left; the curtain's hem along the stage; four bows, one at a time, a pair of shoes stepping out
// under the hem each time: three stagehands, and one cheeky sleeve that bows twice (the same shoes, two places).
// Then THROW at a pair's mark gives it a flower: one to each DIFFERENT pair (a second flower to the same shoes is a
// miss)
const CALL = { slots: [8, 11, 14, 17] };
TourRooms.def('seatsCall', {
  title: 'CURTAIN CALL SHEET', rule: 'A FLOWER FOR EACH DIFFERENT PAIR OF SHOES', need: 'FINISH THE CURTAIN CALL FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 9, cx: 18, s0: 6 });
    for (const x of CALL.slots) mk(g, x, 8, x, 'GIVE A FLOWER');
    g.winSpot(A.id, 12, 8);
    g.coins(9, 16, 5);
    return g;
  },
  enter(play, A, R) { if (!R.won) this.deal(play, A, R); },
  deal(play, A, R) {
    R.n = (R.n || 0) + 1;
    // the four pairs: kinds 0, 2, 3 (stagehands) and 1 twice (the sleeve), shuffled by the attempt
    const order = [[1, 0, 1, 2], [0, 1, 3, 1], [1, 3, 2, 1], [2, 1, 0, 1]][R.n % 4], kinds = order.map(k => [0, 1, 2, 3][k] === 1 ? 1 : k);
    R.kinds = kinds.map(k => (k === 0 ? 0 : k === 1 ? 1 : k === 2 ? 2 : 3)); R.given = {}; R.flowers = []; R.ph = 'bows'; R.t0 = play.t;
  },
  reset(play, A, R, why) { R.fails = (R.fails || 0) + 1; RK.raspberry(play, why); this.deal(play, A, R); },
  slot(m) { return CALL.slots.indexOf(m.k); },
  mark(play, A, R, kit, m, p) {
    if (R.ph !== 'give') return;
    const i = this.slot(m); if (i < 0 || R.flowers.includes(i)) return;
    const kd = R.kinds[i];
    if (R.given[kd]) { this.reset(play, A, R, 'THOSE SHOES ALREADY HAVE A FLOWER!'); return; }
    R.given[kd] = true; R.flowers.push(i); chime(R.flowers.length, true);
    const need = new Set(R.kinds).size;
    if (Object.keys(R.given).length >= need) TourRooms.win(play, A, R, { text: 'BRAVO! EVERYONE HAS A FLOWER', coins: 3 });
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    if (!R.kinds) this.deal(play, A, R);
    if (!quiet(play, R)) { R.t0 = play.t; return; }
    if (R.ph === 'bows' && play.t - R.t0 > 4 * 1.1 + 0.4) R.ph = 'give';
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, y9 = 9 * TS, el = R.ph === 'bows' ? (play.t - R.t0) : 99, cur = Math.floor(el / 1.1);
    // the curtain: mulberry folds down to a gold hem a little over the stage
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    const x0 = 6.5 * TS, x1 = 19.2 * TS, hem = y9 - 26;
    ctx.fillStyle = SA.MUL; ctx.fillRect(x0, 1 * TS, x1 - x0, hem - 1 * TS); ctx.strokeRect(x0, 1 * TS, x1 - x0, hem - 1 * TS);
    ctx.fillStyle = SA.MUL_D; for (let x = x0 + 12; x < x1; x += 26) ctx.fillRect(x, 1 * TS + 4, 6, hem - 1 * TS - 8);
    for (let i = 0; i < 4; i++) {
      const sx = (CALL.slots[i] + 0.5) * TS, bowing = el < 4.4 && cur === i, k = bowing ? Math.sin((el - i * 1.1) / 1.1 * Math.PI) : 0;
      // a bow: the curtain bulges where someone bows behind it
      if (k > 0) { ctx.fillStyle = SA.MUL_L; ctx.beginPath(); ctx.ellipse(sx, hem - 50, 26, 40 * k, 0, 0, TAU); ctx.fill(); }
    }
    ctx.fillStyle = SA.GOLD; ctx.fillRect(x0, hem - 8, x1 - x0, 8); ctx.strokeRect(x0, hem - 8, x1 - x0, 8);
    ctx.restore();
    // the shoes under the hem: each pair shows once its bow has happened (all four once the bows are done)
    for (let i = 0; i < 4; i++) {
      const sx = (CALL.slots[i] + 0.5) * TS, shown = R.ph !== 'bows' || cur >= i;
      if (shown && R.kinds) SA.shoes(ctx, sx, y9 - 2, R.kinds[i], 1.1);
      if (R.flowers && R.flowers.includes(i)) { ctx.save(); ctx.strokeStyle = '#3a8a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, y9 - 8); ctx.lineTo(sx + 2, y9 - 30); ctx.stroke(); ctx.fillStyle = '#ff7ab0'; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.arc(sx + 2 + Math.cos(q * 1.26) * 5, y9 - 32 + Math.sin(q * 1.26) * 5, 4, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.fillStyle = SA.GOLD; ctx.beginPath(); ctx.arc(sx + 2, y9 - 32, 3, 0, TAU); ctx.fill(); ctx.restore(); }
    }
    if (!R.won && quiet(play, R)) hud(play, ctx, R.ph === 'bows' ? 'WATCH THE BOWS...' : 'FLOWERS: ' + (R.flowers ? R.flowers.length : 0) + ' OF ' + (R.kinds ? new Set(R.kinds).size : 3));
  },
  hideMark(play, A, R) { return R.ph !== 'give'; },
  hideCue(play, A, R) { return R.ph !== 'give'; },
  testWin(g, A, R, kit, frame) {
    const p = g.player; for (let q = 0; q < 120 * 7; q++) frame(g, {});
    const seen = {};
    for (let i = 0; i < 4 && !R.won; i++) { const kd = R.kinds[i]; if (seen[kd]) continue; seen[kd] = true; const m = marks(g).find(e => e.k === CALL.slots[i]); this.mark(g, A, R, kit, m, p); frame(g, {}); }
  }
});

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
