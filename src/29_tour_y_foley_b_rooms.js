/* ============================================================
   FOLEY BEACH: the secret rooms (B16-B20 of docs/design/CHATGPT_RELAY.md, one per stage, in order, then the sixth
   stage's own room, Rain for One). Six kinds, all new to the game, each its own place behind the seaside show with
   its own floor, wall and arrangement, each a game that fits one landscape view with the game on a raised stage in the
   middle band (clear of the stick, the buttons and the top bar). Every sound in them is drawn too.
     foleyTrim    29-1 A LITTLE OFF THE TOP  the clippers run along the Boom Crab's fluffy mic cover. Tap THROW at the
                                             lever to lift them over each of its two felt ears (an ear glows as it
                                             comes: that is the moment). Snip an ear, or lift for nothing (a tuft),
                                             and the cover is swapped for a fresh one.
     foleyLids    29-2 ONLY ONE LID          a heart, an oval and a crescent tin; their three lids hang edge-on on a
                                             turning rack. THROW at the crank turns the rack one place; THROW at the
                                             drop lever drops the lids. Fit all three (twice).
     foleyPerch   29-3 VACANT PERCH          three gulls, four perches in a ring. THROW under a gull: it hops into the
                                             empty perch next to it. Seat each gull over the fish of its bill's colour.
     foleyTicket  29-4 TWO-SIDED TICKET      a cue sheet with two dots. THROW at the fold lever folds it along one of
                                             its two creases; THROW under the sheet punches through both layers. Hit
                                             both dots with one punch (twice).
     foleyRecords 29-5 FRUIT FAMILY (the record cabin) three turntables, two half-records glued on each. THROW at a
                                             table turns it a quarter. Make each touching pair of halves match.
     foleyRain    29-6 RAIN FOR ONE          THROW takes the tray of dry rice, the stick tips it: the thin fall pours
                                             from its low end. Keep it on the tiny cloud's roof until its paper
                                             flower opens.
   A miss costs nothing (that turn starts again). The prize cage opens at the win (TourRooms.win). Four of the six
   let Brady out somewhere else. Each kind scripts its own win for tools/sbw_rooms_test.js (testWin).
   ============================================================ */
(function () {
if (typeof TourRooms === 'undefined' || !Tour.foleyKit) return;
const K = Tour.foleyKit, INK = K.INK, FA = K.FArt, FX = K.FX, RK = TourRoomKit;
const { APRI, APRI2, APRI3, TIN, TIN2, TIN3, IVORY, FELT, FELT2, FELT3, BRASS, WOOD, WOOD2 } = K;
const chime = (k, ok) => Sound.play('select', { vol: 0.5, pitch: ok === false ? 0.45 : Math.pow(2, [0, 4, 7, 12][k % 4] / 12) });
const W = 28, R1 = 22;
// the room's shape: 28 x 14 (26 columns fit a landscape phone's view), the way in raised onto a ledge at the top left
// (clear of the stick), a raised stage for the game. L: { st (stage top row), s0, s1 (stage columns), cx (the cage's
// column), cy (its floor row), hatch: 'cage' | [x, y] | null, ledge (the way-in ledge's top row) }
function stageRoom(keep, A, o, items, L) {
  L = Object.assign({ st: 8, s0: 6, s1: R1, cx: 19, hatch: 'cage', ledge: 6, ch: 4 }, L || {});
  const g = RK.room(W), st = L.st;
  g.west(keep);
  for (let x = 1; x < 6; x++) for (let y = 1; y <= 10; y++) { const c = g.get(x, y); if (c === '@' || c === 'D') { g.put(x, L.ledge - 1, c); if (c === 'D') { g.doorsAt[x + ',' + (L.ledge - 1)] = g.doorsAt[x + ',' + y]; delete g.doorsAt[x + ',' + y]; } g.put(x, y, '.'); } }
  g.fill(1, L.ledge, 5, 10, '#');
  g.fill(R1 + 1, 1, W - 2, 10, '#');
  g.fill(L.s0, st, L.s1, 10, '#');
  const cw = Math.max(3, items.length + 2), cx = L.cx, cy = L.cy != null ? L.cy : st - 1;
  if (L.shelf) g.fill(cx, cy + 1, cx + cw + 1, cy + 1, '#');
  g.cage(A.id, cx, cy, items, { w: cw, h: L.ch }); if (cx + cw + 1 <= R1) g.fill(cx + cw + 1, 1, R1, cy, '#');
  if (o.exit && L.hatch) { if (L.hatch === 'cage') g.door(cx - 2, cy, { to: o.exit, look: 'foleyDoor' }); else g.door(L.hatch[0], L.hatch[1], { to: o.exit, look: 'foleyDoor' }); }
  g.data.st = st;
  return g;
}
const prizeOf = (o, keep) => RK.prize(o, keep);
const hud = (play, ctx, str, col) => TourRooms.hudText(play, ctx, str, col, 15, 34);
const quiet = (play, R) => !(play.bannerT > 0) && !R.ruleWait;
// a THROW mark on the stage: an entity whose fInput hands the press (and the stick, if mounted) to the room's kind
class FoleyRoomMark extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.fProp = true; this.k = s.k; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.cue = s.cue || 'THROW'; this.mount = !!s.mount; this.mounted = false; }
  room() { const A = this.g.area; return A && A.roomKit ? { A, R: TourRooms.state(this.g, A), K: TourRooms.kinds[A.roomKit.kind] } : null; }
  fTouch(p) { const r = this.room(); return !!r && !r.R.won && K.onMark(p, this.tx, this.fy, 0.8); }
  fInput(p, inp, dt) {
    const r = this.room(); if (!r) return;
    if (this.mount && !this.mounted) { if (inp.actionPressed) { this.mounted = true; Sound.play('select', { vol: 0.4 }); } return; }
    if (r.K.input) r.K.input(this.g, r.A, r.R, r.A.roomKit, this, p, inp, dt);
    if (inp.actionPressed && r.K.mark) r.K.mark(this.g, r.A, r.R, r.A.roomKit, this, p, inp, dt);
  }
  update(dt) { this.t += dt; const r = this.room(); if (r && r.R.won) this.mounted = false; }
  touchPlayer() {}
  draw(ctx) { const p = this.g.player, r = this.room(); if (r && !r.R.won) K.markRing(ctx, this.cx, this.fy * TS, this.t, p && this.fTouch(p), 15); if (p && this.fTouch(p)) K.handCue(ctx, this.cx, this.y - TS - 22, this.t, this.mounted && this.cueM ? this.cueM : this.cue); }
}
ENTITY_TYPES.foleyRoomMark = FoleyRoomMark;
const marks = play => play.entities.filter(e => e instanceof FoleyRoomMark);
const markK = (play, k) => marks(play).find(e => e.k === k);
// stand Brady on a mark (tests only) and press THROW through the real input path
const pressAt = (g, m, frame, keys) => { const p = g.player; p.x = m.cx - p.w / 2; p.y = m.fy * TS - p.h - 0.5; p.vx = p.vy = 0; for (let q = 0; q < 8; q++) frame(g, {}); frame(g, Object.assign({ action: true, actionPressed: true }, keys || {})); frame(g, {}); };

/* ================= foleyTrim: A LITTLE OFF THE TOP ================= */
const TRIM = { speed: 1 / 7, lift: 0.8, ears: [0.38, 0.72], earW: 0.03, far: 0.17 };
TourRooms.def('foleyTrim', {
  title: 'A LITTLE OFF THE TOP', rule: 'THE CLIPPERS RUN ALONG THE MIC\'S FUR. TAP THROW AS AN EAR GLOWS TO LIFT THEM OVER IT', need: 'TRIM IT FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, prizeOf(o, keep), { st: 8, s0: 6, cx: 18 });
    g.spawn(7, 7, 'foleyRoomMark', { k: 0, cue: 'THROW: LIFT' }); g.need('the lever', 7, 7);
    g.winSpot(A.id, 9, 7); g.coins(10, 14, 7);
    return g;
  },
  enter(play, A, R) { if (!R.won) this.reset(R); },
  reset(R) { R.u = -0.06; R.up = 0; R.cool = 0; R.passed = 0; R.fail = 0; R.snips = []; },
  update(play, dt, A, R) {
    if (R.won) return;
    if (R.fail > 0) { R.fail -= dt; if (R.fail <= 0) this.reset(R); return; }
    if (!quiet(play, R)) return;
    R.u += TRIM.speed * dt; if (R.up > 0) R.up -= dt; else if (R.cool > 0) R.cool -= dt;
    // an ear under the clippers while they are down: snip!
    TRIM.ears.forEach((e, k) => {
      if (R.passed > k) return;
      if (Math.abs(R.u - e) < TRIM.earW && !(R.up > 0)) this.miss(play, R, 'SNIP! NOT THE EAR!');
      else if (R.u > e + TRIM.earW) { R.passed = k + 1; chime(k + 1, true); FX.noise(play, (8 + e * 10) * TS, 4 * TS, 'clack', { quiet: true }); }
    });
    if (R.fail > 0) return;
    if (R.u > 1.02 && R.passed >= 2) TourRooms.win(play, A, R, { text: 'A LOVELY EVEN TRIM!', coins: 4 });
  },
  miss(play, R, txt) { RK.raspberry(play, txt); R.fail = 1.0; FX.noise(play, (8 + clamp(R.u, 0, 1) * 10) * TS, 4 * TS, 'jag', { quiet: true }); },
  mark(play, A, R) {
    if (R.won || R.fail > 0 || R.up > 0 || R.cool > 0 || !quiet(play, R)) return;
    const next = TRIM.ears.find((e, k) => k >= R.passed);
    // a lift with no ear coming leaves a tuft
    if (next == null || next - R.u > TRIM.far) { R.up = 0.4; this.miss(play, R, 'A TUFT! LIFT ONLY FOR AN EAR'); return; }
    R.up = TRIM.lift; R.cool = 0.3; Sound.play('jump', { vol: 0.35, pitch: 1.6 });
  },
  draw(play, ctx, A, R) {
    const t = play.t, x0 = 8 * TS, x1 = 18 * TS, y = 5.9 * TS, u = clamp(R.u || 0, 0, 1), cx = x0 + u * (x1 - x0);
    ctx.save(); ctx.lineJoin = 'round';
    // the stand
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = WOOD2; for (const sx of [x0 + 10, x1 - 10]) { ctx.fillRect(sx - 3, y + 16, 6, 8 * TS - y - 16); ctx.strokeRect(sx - 3, y + 16, 6, 8 * TS - y - 16); }
    // the fluffy mic cover lying along: trimmed (neat, short) behind the clippers, shaggy ahead
    const fur = (a, b, long) => { ctx.fillStyle = long ? '#e8dcc0' : '#d8c8a0'; ctx.beginPath(); ctx.moveTo(a, y + 18); for (let xx = a; xx <= b; xx += 5) ctx.lineTo(xx, y - (long ? 14 + Math.sin(xx * 0.7 + t * 2) * 4 : 6)); ctx.lineTo(b, y + 18); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    fur(x0, cx, false); fur(cx, x1, true);
    ctx.fillStyle = '#3a3a44'; rr(ctx, x0 - 14, y - 4, 16, 22, 4); ctx.fill(); ctx.stroke();
    // the two felt ears sewn on top (an ear glows as it comes into the window)
    TRIM.ears.forEach((e, k) => {
      const ex = x0 + e * (x1 - x0), hot = !R.won && R.passed <= k && e - u > 0.02 && e - u < 0.11;
      if (hot) { ctx.fillStyle = 'rgba(255,216,74,0.5)'; ctx.beginPath(); ctx.arc(ex, y - 22, 18 + Math.sin(t * 14) * 3, 0, TAU); ctx.fill(); }
      ctx.fillStyle = FELT; ctx.beginPath(); ctx.moveTo(ex - 10, y - 8); ctx.lineTo(ex, y - 32); ctx.lineTo(ex + 10, y - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = FELT3; ctx.beginPath(); ctx.moveTo(ex - 5, y - 10); ctx.lineTo(ex, y - 24); ctx.lineTo(ex + 5, y - 10); ctx.closePath(); ctx.fill();
    });
    // the clippers on their rail: down (trimming) or lifted
    const lift = R.up > 0 ? 30 : 0;
    ctx.strokeStyle = '#5a5a64'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, y - 50); ctx.lineTo(x1, y - 50); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = BRASS; rr(ctx, cx - 9, y - 50, 18, 28 - lift, 3); ctx.fill(); ctx.stroke();
    // the lever by the mark (it tips up while the clippers lift), its cord up to the rail
    const lx = 7 * TS + TS / 2, ly = 8 * TS, la = R.up > 0 ? -0.9 : -0.3;
    ctx.fillStyle = '#5a5a64'; rr(ctx, lx - 10, ly - 8, 20, 8, 2); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(lx, ly - 6); ctx.rotate(la); ctx.fillStyle = WOOD; rr(ctx, -2, -30, 5, 30, 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = FELT; ctx.beginPath(); ctx.arc(0.5, -32, 5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx + Math.sin(-la) * -28, ly - 6 - Math.cos(la) * 30); ctx.lineTo(x0, y - 50); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#c8ccd8'; ctx.beginPath(); for (let k = 0; k < 6; k++) { ctx.moveTo(cx - 12 + k * 4.5, y - 22 - lift); ctx.lineTo(cx - 10 + k * 4.5, y - 12 - lift); ctx.lineTo(cx - 8 + k * 4.5, y - 22 - lift); } ctx.fill(); ctx.stroke();
    if (!R.up && !R.won && R.u > 0 && R.u < 1) for (let k = 0; k < 2; k++) { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(cx - 8 + ((t * 80 + k * 9) % 16), y - 10 + ((t * 60 + k * 7) % 20), 2, 4); }
    ctx.restore();
    if (!R.won && quiet(play, R)) hud(play, ctx, 'EARS ' + (R.passed || 0) + ' OF 2');
  },
  testWin(g, A, R, kit, frame) {
    const m = markK(g, 0); pressAt(g, m, frame, {}); for (let q = 0; q < 1800 && !R.won; q++) { const next = TRIM.ears[R.passed]; frame(g, next != null && next - R.u < 0.08 && next - R.u > 0.03 && !(R.up > 0) && !(R.cool > 0) ? { action: true, actionPressed: true } : {}); }
  }
});

/* ================= foleyLids: ONLY ONE LID ================= */
const SHAPES = ['heart', 'oval', 'moon'];
// a shape's outline: front-on (a tin's mouth) or edge-on (a lid seen from the side: its rim profile)
const shapePath = (ctx, sh, x, y, r) => {
  ctx.beginPath();
  if (sh === 'heart') { ctx.moveTo(x, y + r); ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4); ctx.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r); }
  else if (sh === 'oval') ctx.ellipse(x, y, r * 1.2, r * 0.75, 0, 0, TAU);
  else { ctx.arc(x, y, r, Math.PI * 0.25, Math.PI * 1.75); ctx.arc(x + r * 0.55, y, r * 0.75, Math.PI * 1.6, Math.PI * 0.4, true); }
  ctx.closePath();
};
TourRooms.def('foleyLids', {
  title: 'ONLY ONE LID', rule: 'THROW AT THE CRANK TURNS THE LID RACK. FIT EACH LID TO ITS TIN, THEN THROW AT THE LEVER TO DROP THEM', need: 'FIT THE LIDS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, prizeOf(o, keep), { st: 9, s0: 6, cx: 4, cy: 4, hatch: null, ledge: 8, shelf: true, ch: 3 });
    // (here the cage sits on a shelf high over the way in, the game takes the whole stage)
    g.fill(1, 6, 5, 7, '.'); g.fill(R1 - 2, 9, R1, 10, '#');
    g.spawn(8, 8, 'foleyRoomMark', { k: 'crank', cue: 'THROW: TURN' }); g.need('the crank', 8, 8);
    g.spawn(19, 8, 'foleyRoomMark', { k: 'drop', cue: 'THROW: DROP' }); g.need('the lever', 19, 8);
    g.winSpot(A.id, 12, 8); g.coins(10, 16, 7);
    // two rounds: the rack's order of lids, and how far round it starts
    g.data.rounds = [0, 1].map(() => { const order = SHAPES.slice().sort(() => rng() - 0.5); let off = 1 + Math.floor(rng() * 2); return { order, off }; });
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.round = R.round || 0; R.rot = kit.data.rounds[R.round].off; R.drop = -1; } },
  // the lid over tin k (tins in SHAPES order)
  lidAt(kit, R, k) { const rd = kit.data.rounds[R.round]; return rd.order[(k + R.rot) % 3]; },
  update(play, dt, A, R, kit) {
    if (R.won || R.drop < 0) return; R.drop += dt;
    if (R.drop > 0.8) {
      const ok = [0, 1, 2].every(k => this.lidAt(kit, R, k) === SHAPES[k]); R.drop = -1;
      if (ok) { R.round++; chime(R.round, true); FX.noise(play, 13 * TS, 6 * TS, 'clack', { quiet: true }); if (R.round >= 2) TourRooms.win(play, A, R, { text: 'EVERY TIN HAS ITS LID!', coins: 4 }); else { R.rot = kit.data.rounds[R.round].off; K.say(play, 13 * TS, 3 * TS, 'NEXT SHELF!', '#ffd84a', 'room'); } }
      else { RK.raspberry(play, 'CLANG! THEY DON\'T FIT'); FX.noise(play, 13 * TS, 6 * TS, 'jag', { quiet: true }); }
    }
  },
  mark(play, A, R, kit, m) {
    if (R.won || R.drop >= 0) return;
    if (m.k === 'crank') { R.rot = (R.rot + 1) % 3; Sound.play('select', { vol: 0.4, pitch: 1.3 }); FX.noise(play, 8 * TS, 6 * TS, 'clack', { quiet: true, scale: 0.6 }); }
    else { R.drop = 0; Sound.play('throw', { vol: 0.4 }); }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, xs = [10, 13, 16].map(x => x * TS + TS / 2), ty = 9 * TS, rackY = 3.6 * TS, k = R.drop >= 0 ? Math.min(1, R.drop / 0.5) : 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // the tins on the stage, each showing its mouth's shape on its front
    SHAPES.forEach((sh, i) => { const x = xs[i]; ctx.fillStyle = TIN; rr(ctx, x - 22, ty - 34, 44, 34, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = FELT; ctx.save(); shapePath(ctx, sh, x, ty - 17, 9); ctx.fill(); ctx.stroke(); ctx.restore(); });
    // the turning rack with its three lids, edge-on: each lid's rim profile shows its shape
    ctx.strokeStyle = '#5a5a64'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(xs[0] - 40, rackY - 30); ctx.lineTo(xs[2] + 40, rackY - 30); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = INK;
    [0, 1, 2].forEach(i => {
      const sh = this.lidAt(kit, R, i), x = xs[i], y = rackY + k * (ty - 40 - rackY);
      ctx.strokeStyle = '#8a8a94'; ctx.beginPath(); ctx.moveTo(x, rackY - 30); ctx.lineTo(x, y - 12); ctx.stroke(); ctx.strokeStyle = INK;
      // edge-on: a thin lid with its shape's profile cut along its lower edge
      ctx.fillStyle = TIN3; ctx.beginPath(); ctx.moveTo(x - 24, y - 10);
      if (sh === 'heart') { ctx.lineTo(x + 24, y - 10); ctx.lineTo(x + 24, y); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 8); ctx.lineTo(x - 6, y); ctx.lineTo(x - 24, y); }
      else if (sh === 'oval') { ctx.lineTo(x + 24, y - 10); ctx.quadraticCurveTo(x + 26, y + 6, x, y + 6); ctx.quadraticCurveTo(x - 26, y + 6, x - 24, y - 10); }
      else { ctx.lineTo(x + 24, y - 10); ctx.lineTo(x + 24, y + 6); ctx.quadraticCurveTo(x, y - 6, x - 24, y + 6); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // a small picture tag on its string: the shape it fits, drawn front-on (so it can be read at a glance)
      ctx.fillStyle = IVORY; rr(ctx, x - 9, y - 32, 18, 16, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = FELT; ctx.save(); shapePath(ctx, sh, x, y - 24, 4.5); ctx.fill(); ctx.restore();
    });
    ctx.restore();
    if (!R.won && quiet(play, R)) hud(play, ctx, 'SHELF ' + Math.min(2, (R.round || 0) + 1) + ' OF 2');
  },
  testWin(g, A, R, kit, frame) {
    for (let rd = 0; rd < 2 && !R.won; rd++) {
      for (let q = 0; q < 3 && ![0, 1, 2].every(k => this.lidAt(kit, R, k) === SHAPES[k]); q++) pressAt(g, markK(g, 'crank'), frame);
      pressAt(g, markK(g, 'drop'), frame); for (let q = 0; q < 140; q++) frame(g, {});
    }
  }
});

/* ================= foleyPerch: VACANT PERCH ================= */
const GULL_COL = ['#e0403a', '#3a6ad8', '#f2c23a'];
TourRooms.def('foleyPerch', {
  title: 'VACANT PERCH', rule: 'STAND UNDER A GULL AND THROW: IT HOPS TO THE EMPTY PERCH BESIDE IT. SEAT EACH GULL OVER ITS OWN FISH', need: 'SEAT THE GULLS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, prizeOf(o, keep), { st: 8, s0: 7, cx: 18, hatch: [17, 7], ledge: 5 });
    const xs = [8, 11, 14, 17].slice(0, 4);
    [8, 10, 12, 14].forEach((x, k) => { g.spawn(x, 7, 'foleyRoomMark', { k, cue: 'THROW: HOP' }); g.need('perch ' + k, x, 7); });
    g.winSpot(A.id, 11, 7); g.coins(9, 13, 4);
    g.data.px = [8, 10, 12, 14]; void xs;
    // fish under perches 0, 1, 3 (the gap's home is perch 2); the gulls start rotated round the ring
    g.data.fish = [0, 1, -1, 2];
    g.data.start = [-1, 2, 0, 1];
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) R.seat = kit.data.start.slice(); },
  mark(play, A, R, kit, m) {
    if (R.won) return;
    const k = m.k, S = R.seat, gull = S[k];
    if (gull < 0) { RK.raspberry(play, 'NOBODY ON THAT PERCH'); return; }
    // the empty perch next to it, round the ring (the wire runs from the last perch back to the first)
    const nb = [(k + 1) % 4, (k + 3) % 4].find(j => S[j] < 0);
    if (nb == null) { K.say(play, m.cx, m.y - 60, 'NO ROOM NEXT TO ME!', '#ffd8a0', 'room'); Sound.play('bump', { vol: 0.3 }); return; }
    S[nb] = gull; S[k] = -1; Sound.play('jump', { vol: 0.4, pitch: 1.5 }); FX.noise(play, kit.data.px[nb] * TS + 16, 4 * TS, 'squeak', { quiet: true });
    if (kit.data.fish.every((f, j) => f < 0 || S[j] === f)) TourRooms.win(play, A, R, { text: 'EVERY GULL ON ITS FISH!', coins: 5 });
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, px = kit.data.px.map(x => x * TS + TS / 2), py = 4.4 * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // the ring wire: along the perches and back round over the top
    ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px[0], py); ctx.lineTo(px[3], py); ctx.moveTo(px[3], py); ctx.bezierCurveTo(px[3] + 40, py - 90, px[0] - 40, py - 90, px[0], py); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    px.forEach((x, j) => {
      // the perch (a rope loop on a post) and the fish painted on the stage under it
      ctx.fillStyle = WOOD; ctx.fillRect(x - 3, py, 6, 8 * TS - py); ctx.strokeRect(x - 3, py, 6, 8 * TS - py);
      ctx.fillStyle = '#e8dcc0'; rr(ctx, x - 14, py - 4, 28, 7, 3); ctx.fill(); ctx.stroke();
      const f = kit.data.fish[j]; if (f >= 0) { ctx.fillStyle = GULL_COL[f]; ctx.beginPath(); ctx.ellipse(x, 8 * TS + 10, 11, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 10, 8 * TS + 10); ctx.lineTo(x - 17, 8 * TS + 5); ctx.lineTo(x - 17, 8 * TS + 15); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      const gl = R.seat ? R.seat[j] : -1;
      if (gl >= 0) {
        // a gull: white body, grey wing, its bill in its colour (pointing down at the fish it wants)
        const bob = Math.sin(t * 3 + j) * 1.5, y = py - 6 + bob;
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x, y - 12, 12, 10, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#b8c0cc'; ctx.beginPath(); ctx.ellipse(x - 3, y - 12, 9, 6, -0.3, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + 7, y - 24, 7, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + 9, y - 26, 1.5, 0, TAU); ctx.fill();
        ctx.fillStyle = GULL_COL[gl]; ctx.beginPath(); ctx.moveTo(x + 12, y - 24); ctx.lineTo(x + 22, y - 18); ctx.lineTo(x + 11, y - 20); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (kit.data.fish[j] === gl) { ctx.fillStyle = '#9aff9a'; ctx.beginPath(); ctx.arc(x, py - 40, 4, 0, TAU); ctx.fill(); ctx.stroke(); }
      }
    });
    ctx.restore();
    if (!R.won && quiet(play, R) && R.seat) hud(play, ctx, 'ON THEIR FISH: ' + kit.data.fish.filter((f, j) => f >= 0 && R.seat[j] === f).length + ' OF 3');
  },
  // a shortest sequence of hops (breadth-first over the 12 arrangements)
  solve(kit, S0) {
    const key = s => s.join(','), goal = s => kit.data.fish.every((f, j) => f < 0 || s[j] === f), seen = { [key(S0)]: null }, Q = [S0];
    while (Q.length) { const s = Q.shift(); if (goal(s)) { const out = []; let c = key(s); while (seen[c]) { out.unshift(seen[c][1]); c = seen[c][0]; } return out; } const e = s.indexOf(-1); for (const j of [(e + 1) % 4, (e + 3) % 4]) { const n = s.slice(); n[e] = n[j]; n[j] = -1; if (!(key(n) in seen)) { seen[key(n)] = [key(s), j]; Q.push(n); } } }
    return [];
  },
  testWin(g, A, R, kit, frame) { for (const j of this.solve(kit, R.seat)) pressAt(g, markK(g, j), frame); }
});

/* ================= foleyTicket: TWO-SIDED TICKET ================= */
// the cue sheet is 10 cells along the stage (columns 7-16); a crease between cells c-1 and c folds cell i onto 2c-1-i
TourRooms.def('foleyTicket', {
  title: 'TWO-SIDED TICKET', rule: 'THROW AT THE LEVER FOLDS THE CUE SHEET ON A CREASE. THROW UNDER THE SHEET PUNCHES BOTH LAYERS: HIT BOTH DOTS AT ONCE', need: 'PUNCH THE DOTS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, prizeOf(o, keep), { st: 8, s0: 6, cx: 19, hatch: null, ledge: 7 });
    for (let i = 0; i < 10; i++) { g.spawn(7 + i, 7, 'foleyRoomMark', { k: i, cue: 'THROW: PUNCH' }); g.need('punch ' + i, 7 + i, 7); }
    g.spawn(18, 7, 'foleyRoomMark', { k: 'fold', cue: 'THROW: FOLD' }); g.need('the fold lever', 18, 7);
    g.winSpot(A.id, 12, 7);
    // two rounds: two creases, the dots placed so that exactly one crease brings them together
    g.data.rounds = [0, 1].map(r => { const cr = [3 + Math.floor(rng() * 2), 6 + Math.floor(rng() * 2)], good = Math.floor(rng() * 2), c = cr[good]; let a = c - 1 - Math.floor(rng() * Math.min(c, 3)); const b = 2 * c - 1 - a; if (b > 9 || a < 0) a = c - 1; return { cr, dots: [a, 2 * c - 1 - a], good }; });
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.round = R.round || 0; R.fold = -1; R.holes = []; R.flash = 0; } },
  update(play, dt, A, R) { if (R.flash > 0) { R.flash -= dt; if (R.flash <= 0 && R.next) { R.next = false; R.fold = -1; R.holes = []; } } },
  mark(play, A, R, kit, m) {
    if (R.won || R.flash > 0) return;
    const rd = kit.data.rounds[R.round];
    if (m.k === 'fold') { R.fold = R.fold >= 1 ? -1 : R.fold + 1; R.holes = []; Sound.play('throw', { vol: 0.35, pitch: 1.2 }); return; }
    const i = m.k, c = R.fold >= 0 ? rd.cr[R.fold] : null, j = c != null ? 2 * c - 1 - i : null;
    R.holes = [i].concat(j != null && j >= 0 && j <= 9 ? [j] : []); FX.noise(play, m.cx, 4 * TS, 'clack', { quiet: true }); Sound.play('kick', { vol: 0.5, pitch: 1.8 });
    const hit = rd.dots.every(d => R.holes.indexOf(d) >= 0);
    R.flash = 0.9; R.next = true;
    if (hit) { R.round++; chime(R.round, true); if (R.round >= 2) TourRooms.win(play, A, R, { text: 'BOTH DOTS, ONE PUNCH!', coins: 4 }); else K.say(play, 12 * TS, 3 * TS, 'NEXT SHEET!', '#ffd84a', 'room'); }
    else RK.raspberry(play, R.holes.length < 2 ? 'ONE LAYER: FOLD IT FIRST' : 'MISSED A DOT');
  },
  draw(play, ctx, A, R, kit) {
    const rd = kit.data.rounds[Math.min(R.round || 0, 1)], x0 = 7 * TS, cw = TS, y = 4.3 * TS, h = 34;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the sheet; folded, the far part lies over the near part (drawn faint over it), the crease in burgundy
    const c = R.fold >= 0 ? rd.cr[R.fold] : null;
    const cell = (i, a, yy) => { ctx.globalAlpha = a; ctx.fillStyle = '#fbf6e8'; ctx.fillRect(x0 + i * cw, yy, cw, h); ctx.strokeStyle = 'rgba(40,40,60,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + i * cw, yy, cw, h); ctx.globalAlpha = 1; };
    for (let i = 0; i < 10; i++) cell(i, 1, y);
    // the dots
    for (const d of rd.dots) { ctx.fillStyle = FELT; ctx.beginPath(); ctx.arc(x0 + d * cw + cw / 2, y + h / 2, 7, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke(); }
    // the two creases (dashed); the folded one solid, with the folded-over half drawn mirrored on top, see-through
    rd.cr.forEach((cr, k) => { ctx.strokeStyle = k === R.fold ? '#7a2236' : 'rgba(122,34,54,0.6)'; ctx.lineWidth = k === R.fold ? 3 : 2; ctx.setLineDash(k === R.fold ? [] : [5, 4]); ctx.beginPath(); ctx.moveTo(x0 + cr * cw, y - 8); ctx.lineTo(x0 + cr * cw, y + h + 8); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#7a2236'; ctx.font = '8px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(k ? 'B' : 'A', x0 + cr * cw, y - 12); });
    if (c != null) { for (let i = c; i < 10; i++) { const j = 2 * c - 1 - i; if (j < 0) continue; ctx.globalAlpha = 0.55; ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x0 + j * cw + 3, y + 3, cw - 6, h - 6); if (rd.dots.indexOf(i) >= 0) { ctx.fillStyle = FELT3; ctx.beginPath(); ctx.arc(x0 + j * cw + cw / 2, y + h / 2, 7, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; } }
    // the holes punched this turn
    for (const hI of R.holes || []) { ctx.fillStyle = '#1a1426'; ctx.beginPath(); ctx.arc(x0 + hI * cw + cw / 2, y + h / 2, 5, 0, TAU); ctx.fill(); }
    // the punch on its rail over the sheet, above Brady
    const p = play.player, pc = clamp(Math.floor(p.cx / TS), 7, 16);
    ctx.fillStyle = '#5a5a64'; ctx.fillRect(x0, y - 30, 10 * cw, 4); ctx.fillStyle = BRASS; ctx.strokeStyle = INK; rr(ctx, pc * TS + 6, y - 28, 20, 18, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (!R.won && quiet(play, R)) hud(play, ctx, 'SHEET ' + Math.min(2, (R.round || 0) + 1) + ' OF 2');
  },
  testWin(g, A, R, kit, frame) {
    for (let rd = 0; rd < 2 && !R.won; rd++) {
      const D = kit.data.rounds[R.round]; while (R.fold !== D.good) pressAt(g, markK(g, 'fold'), frame);
      pressAt(g, markK(g, D.dots[0]), frame); for (let q = 0; q < 130; q++) frame(g, {});
    }
  }
});

/* ================= foleyRecords: FRUIT FAMILY, at the record cabin ================= */
const PATS = ['stripes', 'dots', 'waves', 'checks'];
const patFill = (ctx, pat, x, y, r, a0, a1, col) => {
  ctx.save(); ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a0, a1); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.5;
  if (pat === 'stripes') for (let k = -r; k < r; k += 7) { ctx.beginPath(); ctx.moveTo(x + k, y - r); ctx.lineTo(x + k, y + r); ctx.stroke(); }
  else if (pat === 'dots') for (let i = -r; i < r; i += 8) for (let j = -r; j < r; j += 8) { ctx.beginPath(); ctx.arc(x + i, y + j, 2, 0, TAU); ctx.fill(); }
  else if (pat === 'waves') for (let j = -r; j < r; j += 8) { ctx.beginPath(); for (let i = -r; i <= r; i += 3) ctx.lineTo(x + i, y + j + Math.sin(i * 0.4) * 2.5); ctx.stroke(); }
  else for (let i = -r; i < r; i += 8) for (let j = -r; j < r; j += 8) if (((i + j) / 8 & 1) === 0) ctx.fillRect(x + i, y + j, 8, 8);
  ctx.restore();
};
const REC_COL = { stripes: '#d85a70', dots: '#3a8ab0', waves: '#5a9a4a', checks: '#8a5ac8' };
TourRooms.def('foleyRecords', {
  title: 'FRUIT FAMILY', rule: 'THROW AT A TURNTABLE TURNS IT A QUARTER. WHERE TWO RECORDS TOUCH, THEIR HALVES MUST MATCH', need: 'MATCH THE RECORDS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, prizeOf(o, keep), { st: 9, s0: 6, cx: 19, hatch: [17, 8], ledge: 6, cy: 8 });
    [9, 13, 17].forEach((x, k) => { g.spawn(x - 1, 8, 'foleyRoomMark', { k, cue: 'THROW: TURN' }); g.need('table ' + k, x - 1, 8); });
    g.winSpot(A.id, 12, 8); g.coins(10, 15, 6);
    // halves [A, B] glued opposite each other; the solution turns are (2, 2, 0)
    g.data.tables = [['dots', 'stripes'], ['stripes', 'waves'], ['checks', 'waves']];
    g.data.start = [1, 3, 1];
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.rot = kit.data.start.slice(); R.spin = [0, 0, 0]; } },
  // what faces right / left on table k (null when its halves stand up and down)
  side(kit, R, k, s) { const r = R.rot[k] % 4, T2 = kit.data.tables[k]; if (r % 2) return null; const aRight = r === 0; return s > 0 ? (aRight ? T2[0] : T2[1]) : (aRight ? T2[1] : T2[0]); },
  matched(kit, R) { const a = this.side(kit, R, 0, 1), b = this.side(kit, R, 1, -1), c = this.side(kit, R, 1, 1), d = this.side(kit, R, 2, -1); return [a && a === b, c && c === d]; },
  update(play, dt, A, R) { if (R.spin) for (let k = 0; k < 3; k++) if (R.spin[k] > 0) R.spin[k] = Math.max(0, R.spin[k] - dt * 3); },
  mark(play, A, R, kit, m) {
    if (R.won) return;
    R.rot[m.k] = (R.rot[m.k] + 1) % 4; R.spin[m.k] = 1; Sound.play('select', { vol: 0.4, pitch: 1.2 }); FX.noise(play, m.cx + 16, 5 * TS, 'clack', { quiet: true, scale: 0.6 });
    const M = this.matched(kit, R); if (M[0] && M[1]) TourRooms.win(play, A, R, { text: 'A MATCHED SET!', coins: 5 });
  },
  draw(play, ctx, A, R, kit) {
    const xs = [9, 13, 17].map(x => x * TS), y = 5.6 * TS, r = 42, M = R.rot ? this.matched(kit, R) : [false, false];
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    xs.forEach((x, k) => {
      ctx.fillStyle = WOOD; rr(ctx, x - r - 6, y + r - 6, 2 * r + 12, 14, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, TAU); ctx.fill(); ctx.stroke();
      const T2 = kit.data.tables[k], a = ((R.rot ? R.rot[k] : 0) - (R.spin ? R.spin[k] : 0)) * Math.PI / 2;
      patFill(ctx, T2[0], x, y, r, a - Math.PI / 2, a + Math.PI / 2, REC_COL[T2[0]]);
      patFill(ctx, T2[1], x, y, r, a + Math.PI / 2, a + Math.PI * 1.5, REC_COL[T2[1]]);
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      ctx.fillStyle = IVORY; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); ctx.stroke();
    });
    // where two touch: a green tick or a red cross
    [0, 1].forEach(k => { const x = (xs[k] + xs[k + 1]) / 2; ctx.fillStyle = 'rgba(14,8,26,0.8)'; ctx.beginPath(); ctx.arc(x, y - r - 14, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = M[k] ? '#9aff9a' : '#ff9a9a'; ctx.lineWidth = 3; ctx.beginPath(); if (M[k]) { ctx.moveTo(x - 4, y - r - 14); ctx.lineTo(x - 1, y - r - 10); ctx.lineTo(x + 5, y - r - 19); } else { ctx.moveTo(x - 4, y - r - 18); ctx.lineTo(x + 4, y - r - 10); ctx.moveTo(x + 4, y - r - 18); ctx.lineTo(x - 4, y - r - 10); } ctx.stroke(); });
    ctx.restore();
  },
  testWin(g, A, R, kit, frame) { const goal = [2, 2, 0]; for (let k = 0; k < 3; k++) for (let q = 0; q < 4 && R.rot[k] !== goal[k] && !R.won; q++) pressAt(g, markK(g, k), frame); }
});

/* ================= foleyRain: RAIN FOR ONE ================= */
const RAIN = { need: 4.0, reach: 5 };
TourRooms.def('foleyRain', {
  title: 'RAIN FOR ONE', rule: 'THROW TAKES THE TRAY. TIP IT WITH THE STICK: KEEP THE RICE POURING ON THE LITTLE CLOUD\'S ROOF', need: 'OPEN THE FLOWER FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, prizeOf(o, keep), { st: 9, s0: 6, cx: 18, hatch: 'cage', ledge: 5, cy: 8 });
    g.spawn(8, 8, 'foleyRoomMark', { k: 0, cue: 'THROW: TAKE THE TRAY', mount: true }); g.need('the tray', 8, 8);
    g.winSpot(A.id, 10, 8);
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.tilt = 0; R.wet = 0; R.cx = 13 * TS; R.ct = 0; R.open = 0; } },
  // the fall's x: from the tray's low end (the tray spans columns 9-17 over the stage)
  fallX(R) { return 13 * TS + clamp(R.tilt, -1, 1) * RAIN.reach * TS; },
  input(play, A, R, kit, m, p, inp, dt) { if (!m.mounted || R.won) return; const d = (inp.right ? 1 : 0) - (inp.left ? 1 : 0); R.tilt = clamp(R.tilt + d * dt * 1.4, -1, 1); m.cueM = 'STICK TIPS · JUMP LETS GO'; },
  update(play, dt, A, R) {
    if (R.won || !quiet(play, R)) return;
    // the cloud drifts back and forth, a little faster as the flower opens
    R.ct += dt * (0.5 + R.wet / RAIN.need * 0.35); R.cx = 13 * TS + Math.sin(R.ct) * 3.8 * TS + Math.sin(R.ct * 2.3) * 0.8 * TS;
    const m = markK(play, 0), pouring = m && m.mounted, on = pouring && Math.abs(this.fallX(R) - R.cx) < 30;
    if (on) { R.wet += dt; if (Math.floor(R.wet * 4) !== Math.floor((R.wet - dt) * 4)) FX.noise(play, R.cx, 5.6 * TS, 'dots', { quiet: true, scale: 0.5 }); }
    else R.wet = Math.max(0, R.wet - dt * 0.35);
    if (R.wet >= RAIN.need) TourRooms.win(play, A, R, { text: 'A FLOWER, FOR ONE!', coins: 6 });
  },
  draw(play, ctx, A, R) {
    const t = play.t, m = markK(play, 0), pouring = m && m.mounted, ty = 3.2 * TS, cx = 13 * TS, a = (R.tilt || 0) * 0.32;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    // the tray on its pivot, its rope to the lever
    ctx.fillStyle = '#5a5a64'; ctx.fillRect(cx - 3, ty - 40, 6, 40);
    ctx.save(); ctx.translate(cx, ty); ctx.rotate(a); ctx.fillStyle = WOOD; rr(ctx, -4.5 * TS, -8, 9 * TS, 14, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f6eedc'; ctx.fillRect(-4.3 * TS, -12, 8.6 * TS, 5); ctx.restore();
    // the thin fall of rice (dots) from the low end
    const fx = this.fallX(R), fy = ty + Math.abs(R.tilt || 0) * 4.5 * TS * 0.32 + 6;
    if (pouring && Math.abs(R.tilt || 0) > 0.05) { ctx.fillStyle = '#fff8e0'; for (let k = 0; k < 18; k++) { const q = (t * 2.4 + k / 18) % 1, yy = fy + q * (8 * TS - fy); ctx.beginPath(); ctx.arc(fx + Math.sin(k * 7) * 2, yy, 2, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(26,20,38,0.5)'; ctx.lineWidth = 0.8; ctx.stroke(); } }
    // the tiny cloud (a painted cardboard cloud on a stick, with a paper flower in a pot on its roof)
    const cy = 6 * TS, k = clamp((R.wet || 0) / RAIN.need, 0, 1);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#5a5a64'; ctx.fillRect(R.cx - 2, cy + 10, 4, 8 * TS - cy - 10);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(R.cx, cy, 26, 12, 0, 0, TAU); ctx.ellipse(R.cx - 12, cy - 8, 12, 10, 0, 0, TAU); ctx.ellipse(R.cx + 10, cy - 10, 14, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = FELT; rr(ctx, R.cx - 5, cy - 30, 10, 10, 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#4a8a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(R.cx, cy - 30); ctx.lineTo(R.cx, cy - 40 - k * 8); ctx.stroke(); ctx.strokeStyle = INK;
    // the paper flower opening petal by petal
    const n = 6; for (let i = 0; i < n; i++) { const an = i / n * TAU, open = clamp(k * n - i, 0, 1); ctx.fillStyle = open > 0.5 ? '#ff9ab0' : '#f6ecd6'; ctx.beginPath(); ctx.ellipse(R.cx + Math.cos(an) * 6 * (0.3 + open), cy - 44 - k * 8 + Math.sin(an) * 6 * (0.3 + open), 3 + open * 3, 2.4 + open, an, 0, TAU); ctx.fill(); ctx.stroke(); }
    // the meter: a ring that fills round the cloud
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(R.cx, cy - 10, 40, -Math.PI / 2, -Math.PI / 2 + k * TAU); ctx.stroke();
    ctx.restore();
  },
  testWin(g, A, R, kit, frame) {
    const m = markK(g, 0); pressAt(g, m, frame);
    for (let q = 0; q < 2400 && !R.won; q++) { const d = R.cx - this.fallX(R); frame(g, { right: d > 8, left: d < -8 }); }
  }
});

// a foley room's words in turn: the title alone (about 1.5 s), then the rule's pill; the room's own lines after that
{
  const en0 = TourRooms.enter;
  TourRooms.enter = function (play, A) {
    en0.apply(this, arguments);
    const kit = A.roomKit; if (!(kit && /^foley/.test(kit.kind))) return;
    const R = this.state(play, A);
    play.toastT = 0; play.bannerT = Math.max(play.bannerT || 0, 1.5); R.ruleWait = !R.won && !!kit.rule;
  };
  const dr0 = TourRooms.draw;
  TourRooms.draw = function (play, ctx) {
    const kit = play.area && play.area.roomKit;
    if (!(kit && /^foley/.test(kit.kind)) || !(play.bannerT > 0)) return dr0.apply(this, arguments);
    ctx.save(); ctx.globalAlpha = clamp(1 - play.bannerT * 3, 0.15, 1); try { return dr0.apply(this, arguments); } finally { ctx.restore(); }
  };
  const up0 = TourRooms.update;
  TourRooms.update = function (play, dt) {
    const A = play.area, kit = A && A.roomKit;
    if (kit && /^foley/.test(kit.kind)) { const R = this.state(play, A); if (R.ruleWait && !(play.bannerT > 0)) { R.ruleWait = false; play.toast(kit.rule); } }
    return up0.apply(this, arguments);
  };
}
// the camera in a foley room: the whole room's width in view, the stage band in the middle
TourHooks.on('camera', (play, dt) => {
  const A = play.area; if (!(A && A.roomKit && /^foley/.test(A.roomKit.kind))) return;
  if (Game.viewW >= (R1 + 1) * TS - 8) play.camX = clamp(((R1 + 1) * TS - Game.viewW) / 2, 0, Math.max(0, A.W * TS - Game.viewW));
});
{
  const ct0 = Play.prototype.camTargetY;
  Play.prototype.camTargetY = function (snap) { const A = this.area; if (A && A.roomKit && /^foley/.test(A.roomKit.kind)) return clamp(TS, 0, Math.max(0, A.H * TS - Game.viewH)); return ct0.call(this, snap); };
}
})();
