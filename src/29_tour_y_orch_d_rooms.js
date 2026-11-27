/* ============================================================
   THE ORCHARD AFTER CLOSING: the six secret rooms (CHATGPT_RELAY.md B11-B15 and section F's One Loose Pip), one per
   stage, in order. Each a 10-25 second game with a rule that reads in two seconds, played in ONE landscape view on a
   raised stage in the middle band (clear of the top bar, the stick and the buttons), each its own place with its own
   floor, walls and arrangement:
     orchUmbrella 28-1 THE POTTING SHED      BORROWED UMBRELLA: walk the bench under three shelves to the return stand.
                                             Big drips fall between the shelves: hold THROW to open the rhubarb leaf
                                             there, close it under a shelf (it snags). Arrive with the receipt dry.
     orchPeel     28-2 THE PRESERVING PANTRY CLEAN CUT: a pear peel feeds past the snips; THROW to snip as each of its
                                             three joints passes. Three tidy curls in the saucer.
     orchOwl      28-3 THE HAY LOFT          THE OWL'S SHUTTER: a sleepy toy owl lifts its wing feathers off its face one
                                             at a time; THROW the camera during its one uncovered grin. Twice.
     orchSorbet   28-4 THE SORBET PARLOUR    DO US A FLAVOUR: hold THROW to pipe pear sorbet into a turning cone; let go
                                             as the curl's tip stands upright. Two cones that stand tall.
     orchStamp    28-5 THE LABEL OFFICE      UNDER THE STAMP: a Bark Snail clerk lifts and drops the big stamp over the
                                             belt; THROW nudges a blank label on so it arrives under the stamp as it
                                             drops. Two punched labels.
     orchPip      28-6 THE PIP CELLAR        ONE LOOSE PIP: THROW the shaker and watch the three pears' cutaway windows;
                                             when they settle, one pip keeps rattling: THROW under that pear. Twice.
   A miss costs nothing (a raspberry, the turn starts again). The prize cage opens at the win. Each kind scripts its
   own win for tools/sbw_rooms_test.js (testWin). The title comes alone first, then the rule on a pill, then the
   room's counter in one spot under the HUD.
   ============================================================ */
(function () {
if (typeof TourRooms === 'undefined' || !Tour.orchKit) return;
const OK = Tour.orchKit, INK = OK.INK, OA = OK.OrchArt, RK = TourRoomKit;
const chime = (k, ok) => Sound.play('select', { vol: 0.5, pitch: ok === false ? 0.45 : Math.pow(2, [0, 4, 7, 12][k % 4] / 12) });
const W = 28, R1 = 23;
// the room's shape: the way in on a raised ledge at the top left (clear of the stick), a stage (top row st) for the
// game, the cage on the stage at the right; mirror: everything flipped (the way in at the top right). L: { st, s0,
// shelf (a plank shelf on posts instead of a solid stage), tier: [x, st2] (a second, higher tier from column x), cx }
function stageRoom(keep, A, o, L) {
  L = Object.assign({ st: 8, s0: 6, cx: 19 }, L || {});
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
// a THROW mark on the stage: its orchInput calls the room kind's mark(...)
class OrchRoomMark extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.orchProp = true; this.k = s.k; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.cue = s.cue || 'THROW'; this.hold = !!s.hold; }
  room() { const A = this.g.area; return A && A.roomKit ? { A, R: TourRooms.state(this.g, A), K: TourRooms.kinds[A.roomKit.kind] } : null; }
  orchTouch(p) { const r = this.room(); return !!r && !r.R.won && (this.k === 'lane' ? !!(r.K.inLane && r.K.inLane(this.g, r.A, r.R, p)) : OK.onMark(p, this.tx, this.fy, 0.8)); }
  orchInput(p, inp, dt) { const r = this.room(); if (!r) return; if (r.K.input) r.K.input(this.g, r.A, r.R, r.A.roomKit, this, p, inp, dt); else if (inp.actionPressed && r.K.mark) r.K.mark(this.g, r.A, r.R, r.A.roomKit, this, p); }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) { if (this.k === 'lane') return; const p = this.g.player, r = this.room(); if (r && !r.R.won) OA.ring(ctx, this.cx, this.fy * TS, this.t, p && this.orchTouch(p), 17); if (p && this.orchTouch(p)) OA.cue(ctx, this.cx, this.fy * TS - 2.4 * TS, this.t, this.cue); }
}
ENTITY_TYPES.orchRoomMark = OrchRoomMark;
const marks = play => play.entities.filter(e => e instanceof OrchRoomMark);
const P = play => play.player;
const mk = (g, x, y, k, cue, hold) => g.spawn(x, y, 'orchRoomMark', { k, cue, hold });

/* ================= orchUmbrella: BORROWED UMBRELLA (the potting shed) ================= */
// the bench is the stage (row 8, Brady on 7) from column 6; three shelves over it; the drips fall in the two gaps;
// the return stand at the bench's end by the cage
const SHELVES = [[6, 8], [11, 12], [16, 17]], GAPS = [[9, 10], [13, 15]];
TourRooms.def('orchUmbrella', {
  title: 'BORROWED UMBRELLA', rule: 'HOLD THROW TO OPEN THE LEAF BETWEEN THE SHELVES ONLY. GET THE RECEIPT TO THE STAND DRY', need: 'RETURN THE UMBRELLA FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 20 });
    mk(g, 7, 7, 'lane', 'HOLD THROW');
    g.need('the return stand', 18, 7); g.winSpot(A.id, 18, 7);
    g.coins(9, 10, 5); g.coins(13, 15, 5);
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.open = false; R.wet = 0; R.drip = 0; } },
  inLane(play, A, R, p) { const tx = p.cx / TS; return p.groundTy === 8 && tx >= 6 && tx <= 19; },
  input(play, A, R, kit, m, p, inp) { R.open = !!inp.action; },
  shelfAt(x) { return SHELVES.some(([a, b]) => x >= a * TS - 4 && x <= (b + 1) * TS + 4); },
  reset(play, A, R, why) { R.fails = (R.fails || 0) + 1; RK.raspberry(play, why); const p = P(play); p.x = 6.5 * TS - p.w / 2; p.y = 8 * TS - p.h; p.vx = p.vy = 0; R.open = false; },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const p = P(play); R.t2 = (R.t2 || 0) + dt;
    if (!this.inLane(play, A, R, p)) R.open = false;
    // the drips: each gap drips on its own beat (a drip swells for 0.7 s, then falls 0.3 s)
    R.drops = GAPS.map(([a, b], k) => { const c = (R.t2 + k * 0.8) % 1.7; return { x: (a + b + 1) / 2 * TS, swell: c < 0.7 ? c / 0.7 : 1, fall: c >= 0.7 && c < 1.0 ? (c - 0.7) / 0.3 : c >= 1.0 ? 1 : 0, splash: c >= 1.0 && c < 1.2 }; });
    if (!quiet(play, R)) return;
    if (R.open && this.shelfAt(p.cx)) { this.reset(play, A, R, 'SNAGGED ON THE SHELF! BACK TO THE DOOR'); return; }
    for (const d of R.drops) if (d.fall > 0.7 && d.fall < 1 && Math.abs(p.cx - d.x) < TS * 1.1 && !R.open) { this.reset(play, A, R, 'SPLASH! THE RECEIPT IS SOGGY'); return; }
    if (p.onGround && p.groundTy === 8 && p.cx >= 18 * TS && p.cx <= 19.2 * TS) { chime(2, true); TourRooms.win(play, A, R, { text: 'RETURNED, BONE DRY!', coins: 3 }); }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, p = P(play), y8 = 8 * TS;
    // the shelves (pots on them) and the drips from the leaky roof between them
    for (const [a, b] of SHELVES) { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#8a6a4a'; ctx.fillRect(a * TS - 4, 5.2 * TS, (b - a + 1) * TS + 8, 10); ctx.strokeRect(a * TS - 4, 5.2 * TS, (b - a + 1) * TS + 8, 10);
      for (let x = a * TS + 8; x < (b + 1) * TS; x += 22) { ctx.fillStyle = '#c86a3a'; ctx.beginPath(); ctx.moveTo(x - 8, 5.2 * TS); ctx.lineTo(x + 8, 5.2 * TS); ctx.lineTo(x + 6, 5.2 * TS - 16); ctx.lineTo(x - 6, 5.2 * TS - 16); ctx.closePath(); ctx.fill(); ctx.stroke(); OA.leaf(ctx, x - 2, 5.2 * TS - 18, 0.8, -1.4); } ctx.restore(); }
    for (const d of R.drops || []) {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillStyle = 'rgba(120,190,255,0.9)';
      const dy = d.fall > 0 ? lerp(4.6 * TS, y8 - 10, Math.min(1, d.fall)) : 4.6 * TS + d.swell * 8, r = d.fall > 0 ? 9 : 4 + d.swell * 6;
      if (d.fall < 1) { ctx.beginPath(); ctx.moveTo(d.x, dy - r * 1.6); ctx.quadraticCurveTo(d.x + r, dy, d.x, dy + r); ctx.quadraticCurveTo(d.x - r, dy, d.x, dy - r * 1.6); ctx.fill(); ctx.stroke(); }
      if (d.splash) { ctx.strokeStyle = 'rgba(120,190,255,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(d.x, y8 - 2, 20, 5, 0, 0, TAU); ctx.stroke(); }
      ctx.restore();
    }
    // the roof's leak marks
    ctx.save(); ctx.fillStyle = 'rgba(40,30,30,0.5)'; for (const [a, b] of GAPS) { ctx.beginPath(); ctx.ellipse((a + b + 1) / 2 * TS, 4.4 * TS, 14, 5, 0, 0, TAU); ctx.fill(); } ctx.restore();
    // the return stand (a little counter with a bell) at the end of the bench
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#b8945a'; ctx.fillRect(18 * TS - 2, y8 - 26, TS + 4, 26); ctx.strokeRect(18 * TS - 2, y8 - 26, TS + 4, 26); ctx.fillStyle = '#e8c840'; ctx.beginPath(); ctx.arc(18.5 * TS, y8 - 30, 6, Math.PI, 0); ctx.fill(); ctx.stroke(); ctx.restore();
    if (!R.won) OA.pill(ctx, 18.5 * TS, y8 - 50, 'RETURN', '#ffffff', 0.85);
    // the leaf over Brady (open) or furled under his arm, the receipt in his hand
    if (p && !R.won && this.inLane(play, A, R, p)) {
      const x = p.cx, y = p.y - 6;
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (R.open) { ctx.fillStyle = '#5a9a3a'; ctx.beginPath(); ctx.moveTo(x - 30, y + 2); ctx.quadraticCurveTo(x, y - 30, x + 30, y + 2); ctx.quadraticCurveTo(x, y - 8, x - 30, y + 2); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#c83a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x, y + 24); ctx.stroke(); }
      else { ctx.strokeStyle = '#c83a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 10, y + 30); ctx.lineTo(x + 12, y + 4); ctx.stroke(); ctx.fillStyle = '#5a9a3a'; ctx.beginPath(); ctx.ellipse(x + 10, y + 6, 5, 9, 0.6, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#fff8e0'; ctx.fillRect(x + 8, y + 18, 9, 11); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(x + 8, y + 18, 9, 11);
      ctx.restore();
    }
  },
  testWin(g, A, R, kit, frame) {
    const p = g.player; p.x = 6.5 * TS - p.w / 2; p.y = 8 * TS - p.h; p.vx = p.vy = 0;
    for (let q = 0; q < 240; q++) frame(g, {});
    // walk right: open the leaf in the gaps, close it under the shelves
    for (let q = 0; q < 900 && !R.won; q++) { const sh = this.shelfAt(p.cx + 10) || this.shelfAt(p.cx); frame(g, { right: true, action: !sh }); }
  }
});

/* ================= orchPeel: CLEAN CUT (the preserving pantry) ================= */
// the peel feeds right to left along row 4 over the stage; the snips hang over column 12; the saucer under them
const SNIP = 12;
TourRooms.def('orchPeel', {
  title: 'CLEAN CUT', rule: 'THROW TO SNIP WHEN A JOINT IN THE PEEL IS UNDER THE SNIPS. THREE TIDY CURLS', need: 'THREE CURLS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 19 });
    mk(g, SNIP, 7, 0, 'SNIP');
    g.winSpot(A.id, SNIP, 7);
    g.coins(15, 17, 5);
    mirror(g, []); g.data.snip = W - 1 - SNIP;
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.n = 0; R.u = 0; } },
  // the joints' x (px): the strip enters from the far side and runs past the snips
  joints(A, R, kit) { const sx = (kit.data.snip + 0.5) * TS, dir = kit.data.mirror ? 1 : -1, x0 = sx - dir * 9 * TS; return [0, 3, 6].map(k => x0 + dir * (R.u - k * 3 * TS)); },
  update(play, dt, A, R, kit) {
    if (R.won || !quiet(play, R)) return;
    R.u = (R.u || 0) + 1.2 * TS * dt;
    // the whole strip has gone past: it feeds again from the start (the curls cut so far stay)
    if (R.u > 20 * TS) { R.u = 0; R.cut = []; }
  },
  mark(play, A, R, kit) {
    if (R.won) return;
    const sx = (kit.data.snip + 0.5) * TS, J = this.joints(A, R, kit); R.cut = R.cut || [];
    const k = J.findIndex((x, i) => Math.abs(x - sx) < 16 && !R.cut.includes(i));
    if (k >= 0) { R.cut.push(k); R.n++; chime(R.n, true); OK.say(play, sx, 4.6 * TS, R.n >= 3 ? 'THREE TIDY CURLS!' : 'SNIP! A CURL', '#ffd84a'); if (R.n >= 3) TourRooms.win(play, A, R, { text: 'A CLEAN CUT!', coins: 4 }); }
    else { R.fails = (R.fails || 0) + 1; RK.raspberry(play, 'RAGGED! NEW PEEL'); R.n = 0; R.u = 0; R.cut = []; }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, sx = (kit.data.snip + 0.5) * TS, y = 5.6 * TS, dir = kit.data.mirror ? 1 : -1;
    // the peel: a long pale-green ribbon with three dark notched joints
    if (!R.won) {
      const J = this.joints(A, R, kit), x0 = J[0] + dir * 1.5 * TS, x1 = J[2] - dir * 1.5 * TS;
      ctx.save(); ctx.beginPath(); ctx.rect(6 * TS, y - 20, 16 * TS, 40); ctx.clip();
      ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(x0, y); for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x += 8) ctx.lineTo(x, y + Math.sin(x * 0.05) * 3); ctx.stroke();
      ctx.strokeStyle = '#c8d870'; ctx.lineWidth = 12; ctx.stroke();
      (R.cut || []).length;
      J.forEach((x, i) => { if ((R.cut || []).includes(i)) return; const near = Math.abs(x - sx) < 16; ctx.fillStyle = near ? '#ffd84a' : OA.BARK_D; ctx.beginPath(); ctx.moveTo(x - 6, y - 8); ctx.lineTo(x, y); ctx.lineTo(x - 6, y + 8); ctx.lineTo(x + 6, y + 8); ctx.lineTo(x, y); ctx.lineTo(x + 6, y - 8); ctx.closePath(); ctx.fill(); });
      ctx.restore();
      // the rollers it feeds from
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#a89878'; for (const x of [6.4 * TS, 21.6 * TS]) { ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.restore();
    }
    // the snips hanging over the strip (they close on a THROW)
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#c8ccd8';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx, y - 28); ctx.lineTo(sx + s * 7, y - 4); ctx.lineTo(sx + s * 2, y - 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = OA.RUST; ctx.beginPath(); ctx.arc(sx - 8, y - 40, 7, 0, TAU); ctx.arc(sx + 8, y - 40, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    // the saucer on a shelf beside the snips with the curls in it
    const qx = sx + (kit.data.mirror ? -2 : 2) * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(qx, 8 * TS - 6, 26, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    for (let k = 0; k < (R.won ? 3 : R.n || 0); k++) { ctx.strokeStyle = '#9ab83a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(qx - 12 + k * 12, 8 * TS - 14, 6, 0, TAU * 0.8); ctx.stroke(); }
    ctx.restore();
    if (!R.won && quiet(play, R)) hud(play, ctx, 'CURLS ' + (R.n || 0) + ' OF 3');
  },
  testWin(g, A, R, kit, frame) {
    const m = marks(g)[0], p = g.player; p.x = m.cx - p.w / 2; p.y = m.fy * TS - p.h; p.vy = 0;
    for (let q = 0; q < 240; q++) frame(g, {});
    const sx = (kit.data.snip + 0.5) * TS;
    for (let q = 0; q < 120 * 30 && !R.won; q++) { const J = this.joints(A, R, kit); const hit = J.some((x, i) => Math.abs(x - sx) < 6 && !(R.cut || []).includes(i)); frame(g, hit ? { action: true, actionPressed: true } : {}); }
  }
});

/* ================= orchOwl: THE OWL'S SHUTTER (the hay loft) ================= */
// a plank shelf for a stage; the camera on its tripod at column 9; the owl on the beam at column 15
TourRooms.def('orchOwl', {
  title: 'THE OWL\'S SHUTTER', rule: 'THE SLEEPY OWL LIFTS ITS FEATHERS ONE BY ONE. THROW THE CAMERA DURING ITS GRIN. TWICE', need: 'TWO GOOD PHOTOS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 19, shelf: true });
    mk(g, 9, 7, 0, 'SNAP');
    g.winSpot(A.id, 9, 7);
    g.coins(12, 16, 5);
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.n = 0; R.c = 0; } },
  // the owl's cycle: 4 feathers lift (0.6 s each), the grin (0.8 s), the wings back over its face (0.8 s), asleep (1.2 s)
  phase(R) { const c = (R.c || 0) % 4.6; if (c < 2.4) return { st: 'lift', f: Math.floor(c / 0.6) + 1 }; if (c < 3.2) return { st: 'grin', f: 4 }; if (c < 3.6) return { st: 'cover', f: 4 }; return { st: 'sleep', f: 0 }; },
  update(play, dt, A, R) { if (R.won || !quiet(play, R)) return; R.c = (R.c || 0) + dt; R.flash = Math.max(0, (R.flash || 0) - dt); },
  mark(play, A, R) {
    if (R.won) return; R.flash = 0.3; Sound.play('select', { vol: 0.5, pitch: 2 });
    if (this.phase(R).st === 'grin') { R.n++; chime(R.n, true); OK.say(play, 15 * TS, 2 * TS, R.n >= 2 ? 'FRAME IT!' : 'CAUGHT GRINNING!', '#ffd84a'); R.c = 3.6; if (R.n >= 2) TourRooms.win(play, A, R, { text: 'A LOVELY PORTRAIT!', coins: 4 }); }
    else { R.fails = (R.fails || 0) + 1; RK.raspberry(play, 'ALL WINGS. TRY AGAIN'); R.c = 3.6; }
  },
  draw(play, ctx, A, R) {
    const t = play.t, ph = this.phase(R), x = 15 * TS, y = 5.0 * TS;
    // the beam, the owl (a carved wooden toy), its wings over its face, feathers lifting one by one
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#5a3e26'; ctx.fillRect(10 * TS, y + 30, 10 * TS, 10); ctx.strokeRect(10 * TS, y + 30, 10 * TS, 10);
    ctx.fillStyle = '#b8864a'; ctx.beginPath(); ctx.ellipse(x, y, 28, 32, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d8a860'; ctx.beginPath(); ctx.ellipse(x, y + 8, 16, 18, 0, 0, TAU); ctx.fill();
    // the face: eyes shut, and the grin when uncovered
    ctx.strokeStyle = INK; ctx.lineWidth = 2.4; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * 10, y - 8, 5, 0.2, Math.PI - 0.2); ctx.stroke(); }
    ctx.fillStyle = '#e8b830'; ctx.beginPath(); ctx.moveTo(x - 4, y - 2); ctx.lineTo(x + 4, y - 2); ctx.lineTo(x, y + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (!R.won) { ctx.beginPath(); ctx.arc(x, y + 6, 9, 0.2, Math.PI - 0.2); ctx.stroke(); }
    // the wings (four feathers each side) over its face; ph.f feathers lifted
    const cover = ph.st === 'sleep' || ph.st === 'cover', up = R.won ? 4 : cover ? 0 : ph.f;
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
      const lifted = k < up, a = lifted ? s * (1.2 + k * 0.1) : s * (0.15 + k * 0.08);
      ctx.save(); ctx.translate(x + s * 24, y + 14 - k * 8); ctx.rotate(-a); ctx.fillStyle = k % 2 ? '#8a5a2a' : '#9a6a3a'; ctx.beginPath(); ctx.ellipse(-s * 14, -6, 18, 6, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    // the camera on its tripod over the mark
    const cx = 9.5 * TS, cy = 8 * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(cx, cy - 2 * TS - 8); ctx.lineTo(cx - 16, cy); ctx.moveTo(cx, cy - 2 * TS - 8); ctx.lineTo(cx + 16, cy); ctx.moveTo(cx, cy - 2 * TS - 8); ctx.lineTo(cx + 4, cy); ctx.stroke();
    ctx.fillStyle = '#3a2a2a'; rr(ctx, cx - 18, cy - 2 * TS - 30, 36, 24, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#8ab8d8'; ctx.beginPath(); ctx.arc(cx + 8, cy - 2 * TS - 18, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    if (R.flash > 0) { ctx.save(); ctx.fillStyle = `rgba(255,255,255,${R.flash * 2})`; ctx.fillRect(play.camX, play.camY, Game.viewW, Game.viewH); ctx.restore(); }
    if (!R.won && quiet(play, R)) hud(play, ctx, 'PHOTOS ' + (R.n || 0) + ' OF 2');
  },
  testWin(g, A, R, kit, frame) {
    const m = marks(g)[0], p = g.player; p.x = m.cx - p.w / 2; p.y = m.fy * TS - p.h; p.vy = 0;
    for (let q = 0; q < 240; q++) frame(g, {});
    for (let q = 0; q < 120 * 20 && !R.won; q++) frame(g, this.phase(R).st === 'grin' && (R.c % 4.6) > 2.7 ? { action: true, actionPressed: true } : {});
  }
});

/* ================= orchSorbet: DO US A FLAVOUR (the sorbet parlour) ================= */
// a two-tier counter: the dispenser's mark on the high tier (column 15); the cone turns under the nozzle
TourRooms.def('orchSorbet', {
  title: 'DO US A FLAVOUR', rule: 'HOLD THROW TO PIPE THE PEAR SORBET. LET GO WHEN THE CURL\'S TIP STANDS UP STRAIGHT. TWO CONES', need: 'TWO TALL CONES FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 9, cx: 19, tier: [13, 7] });
    mk(g, 15, 6, 0, 'HOLD THROW', true);
    g.winSpot(A.id, 15, 6); g.coins(8, 10, 6);
    mirror(g, []); g.data.nz = W - 1 - 15;
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.n = 0; R.h = 0; R.piping = false; } },
  // the tip's sway (radians): it swings back and forth as the cone turns; upright when near 0
  sway(R) { return Math.sin((R.h || 0) * 4) * 0.9; },
  input(play, A, R, kit, m, p, inp) {
    if (R.won || !quiet(play, R)) return;
    if (inp.action) { R.piping = true; R.h = Math.min(1.7, (R.h || 0) + 1 / 120 * 0.35); return; }
    if (R.piping) {
      R.piping = false;
      if (R.h > 0.5 && Math.abs(this.sway(R)) < 0.28) { R.n++; chime(R.n, true); OK.say(play, (kit.data.nz + 0.5) * TS, 2 * TS, R.n >= 2 ? 'TWO TALL CONES!' : 'IT STANDS TALL!', '#ffd84a'); R.h = 0; if (R.n >= 2) TourRooms.win(play, A, R, { text: 'DO US A FLAVOUR!', coins: 4 }); }
      else { R.fails = (R.fails || 0) + 1; RK.raspberry(play, 'IT FLOPPED OVER'); R.h = 0; }
    }
  },
  update(play, dt, A, R) { if (R.won) return; const p = P(play); if (!(p && p.orchProp && p.orchProp.room)) R.piping = R.piping && false; },
  draw(play, ctx, A, R, kit) {
    const t = play.t, x = (kit.data.nz + 0.5) * TS, base = 6.6 * TS;
    // the dispenser on the counter wall: a plum box, a nozzle
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; const bx = x + (kit.data.mirror ? -34 : 34); ctx.fillStyle = '#f4ecd4'; ctx.beginPath(); ctx.moveTo(bx - 14, base - 74); ctx.lineTo(bx + 14, base - 74); ctx.lineTo(bx + (kit.data.mirror ? 14 : -14), base - 30); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = OA.PLUM; ctx.fillRect(bx - 14, base - 80, 28, 8); ctx.strokeRect(bx - 14, base - 80, 28, 8);
    // the cone on its turning stand, the curl growing in it, its tip swaying
    const h = R.won ? 1 : (R.h || 0), sw = R.won ? 0 : this.sway(R), up = Math.abs(sw) < 0.28 && h > 0.5;
    ctx.fillStyle = '#d8a860'; ctx.beginPath(); ctx.moveTo(x - 14, base - 20); ctx.lineTo(x + 14, base - 20); ctx.lineTo(x, base + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,80,40,0.6)'; ctx.lineWidth = 1; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 6, base - 20); ctx.lineTo(x + k * 2, base + 8); ctx.stroke(); }
    if (h > 0) {
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#e4f0a0';
      const n = Math.max(1, Math.floor(h * 4));
      for (let k = 0; k < n; k++) { const r = 14 - k * 2.4, yy = base - 24 - k * 10; ctx.beginPath(); ctx.ellipse(x + Math.sin(sw) * k * 3, yy, r, 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      const tipY = base - 24 - n * 10, tx = x + Math.sin(sw) * (n * 3 + 10);
      ctx.beginPath(); ctx.moveTo(x + Math.sin(sw) * n * 3 - 5, tipY + 6); ctx.quadraticCurveTo(tx, tipY - 6, tx + Math.sin(sw) * 8, tipY - 14); ctx.lineTo(x + Math.sin(sw) * n * 3 + 5, tipY + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (up) { ctx.strokeStyle = `rgba(255,216,74,${0.6 + 0.4 * Math.sin(t * 10)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tx, tipY - 8, 12, 0, TAU); ctx.stroke(); }
    }
    // the cones already served, on the counter
    for (let k = 0; k < (R.won ? 2 : R.n || 0); k++) { const cx2 = x + (kit.data.mirror ? 3 + k : -3 - k) * TS; OA.pear(ctx, cx2, 7 * TS - 22, 0.7, '#e4f0a0', false); ctx.fillStyle = '#d8a860'; ctx.beginPath(); ctx.moveTo(cx2 - 9, 7 * TS - 22); ctx.lineTo(cx2 + 9, 7 * TS - 22); ctx.lineTo(cx2, 7 * TS); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.restore();
    if (!R.won && quiet(play, R)) hud(play, ctx, 'CONES ' + (R.n || 0) + ' OF 2');
  },
  testWin(g, A, R, kit, frame) {
    const m = marks(g)[0], p = g.player; p.x = m.cx - p.w / 2; p.y = m.fy * TS - p.h; p.vy = 0;
    for (let q = 0; q < 240; q++) frame(g, {});
    for (let n = 0; n < 4 && !R.won; n++) { for (let q = 0; q < 600; q++) { frame(g, { action: true }); if (R.h > 0.6 && Math.abs(this.sway(R)) < 0.08) break; } frame(g, {}); frame(g, {}); }
  }
});

/* ================= orchStamp: UNDER THE STAMP (the label office) ================= */
// the belt runs left to right over the stage from column 8 to 20; the tray's mark at column 7; the stamp over 15
const BELT0 = 8, BELT1 = 20, STAMPX = 15;
TourRooms.def('orchStamp', {
  title: 'UNDER THE STAMP', rule: 'THROW AT THE TRAY TO SEND A BLANK LABEL DOWN THE BELT. GET IT UNDER THE STAMP AS IT DROPS. TWO', need: 'TWO PUNCHED LABELS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 20 });
    mk(g, 7, 7, 0, 'SEND');
    g.winSpot(A.id, 7, 7); g.coins(9, 12, 4);
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.n = 0; R.c = 0; R.labels = []; } },
  // the stamp: up 1.5 s, drops 0.2 s, stays down 0.4 s, lifts 0.3 s (its height 0 down .. 1 up)
  stampH(R) { const c = (R.c || 0) % 2.4; if (c < 1.5) return 1; if (c < 1.7) return 1 - (c - 1.5) / 0.2; if (c < 2.1) return 0; return (c - 2.1) / 0.3; },
  update(play, dt, A, R) {
    if (R.won || !quiet(play, R)) return;
    R.c = (R.c || 0) + dt; const h = this.stampH(R), sx = (STAMPX + 0.5) * TS;
    for (const L of R.labels) {
      if (L.done) continue;
      L.x += 2.4 * TS * dt;
      if (h < 0.05 && Math.abs(L.x - sx) < 20 && !L.punched) { L.punched = true; R.n++; chime(R.n, true); OK.say(play, sx, 2.2 * TS, R.n >= 2 ? 'TWO PUNCHED!' : 'KER-CHUNK!', '#ffd84a'); if (R.n >= 2) TourRooms.win(play, A, R, { text: 'STAMPED AND FILED!', coins: 4 }); }
      if (L.x > (BELT1 + 0.5) * TS) { L.done = true; if (!L.punched) { R.fails = (R.fails || 0) + 1; RK.raspberry(play, 'UNSTAMPED! IT FELL IN THE BIN'); } }
    }
    R.labels = R.labels.filter(L => !L.done || L.punched && L.x < (BELT1 + 1) * TS);
  },
  mark(play, A, R) { if (R.won) return; if (R.labels.some(L => !L.done && L.x < (BELT0 + 2) * TS)) return; R.labels.push({ x: (BELT0 + 0.3) * TS, punched: false }); TourKit.sfx('swish', 'select', { vol: 0.3, pitch: 1.6 }); },
  draw(play, ctx, A, R) {
    const t = play.t, by = 6.2 * TS, sx = (STAMPX + 0.5) * TS, h = R.won ? 1 : this.stampH(R);
    // the belt on its legs
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#4a4a5a'; ctx.fillRect(BELT0 * TS, by, (BELT1 - BELT0 + 1) * TS, 10); ctx.strokeRect(BELT0 * TS, by, (BELT1 - BELT0 + 1) * TS, 10);
    ctx.strokeStyle = '#7a7a8a'; ctx.lineWidth = 1.5; for (let x = BELT0 * TS + ((t * 2.4 * TS) % 16); x < (BELT1 + 1) * TS; x += 16) { ctx.beginPath(); ctx.moveTo(x, by + 1); ctx.lineTo(x - 4, by + 9); ctx.stroke(); }
    ctx.fillStyle = '#3a3a48'; for (const x of [BELT0 + 0.5, BELT1 + 0.5]) ctx.fillRect(x * TS - 3, by + 10, 6, 8 * TS - by - 10);
    // the labels riding it
    for (const L of R.labels || []) { ctx.fillStyle = IV; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillRect(L.x - 12, by - 14, 24, 14); ctx.strokeRect(L.x - 12, by - 14, 24, 14); if (L.punched) { ctx.fillStyle = OA.RUST; ctx.beginPath(); ctx.arc(L.x, by - 7, 4, 0, TAU); ctx.fill(); } }
    // the tray of blank labels by the mark
    ctx.fillStyle = '#8a6a4a'; ctx.fillRect(6.6 * TS, 8 * TS - 16, 30, 16); ctx.strokeStyle = INK; ctx.strokeRect(6.6 * TS, 8 * TS - 16, 30, 16); ctx.fillStyle = IV; ctx.fillRect(6.6 * TS + 4, 8 * TS - 20, 22, 6);
    // the stamp on its column; the clerk (a Bark Snail in a visor) at the handle
    const sy = by - 18 - h * 1.3 * TS;
    ctx.fillStyle = '#5a5a6a'; ctx.fillRect(sx - 4, 3.6 * TS, 8, sy - 3.6 * TS); ctx.fillStyle = OA.PLUM; rr(ctx, sx - 22, sy - 26, 44, 26, 4); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = OA.RUST; ctx.fillRect(sx - 18, sy - 4, 36, 6);
    if (h > 0.98 && (R.c % 2.4) > 1.0) { ctx.strokeStyle = `rgba(255,216,74,${0.5 + 0.5 * Math.sin(t * 16)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx - 26, sy - 30); ctx.lineTo(sx + 26, sy - 30); ctx.stroke(); }
    OK.snailArt(ctx, { dir: -1 }, sx + 2.2 * TS, 8 * TS - 2, h > 0.5 ? 'notice' : 'walk', t);
    ctx.restore();
    if (!R.won && quiet(play, R)) hud(play, ctx, 'PUNCHED ' + (R.n || 0) + ' OF 2');
  },
  testWin(g, A, R, kit, frame) {
    const m = marks(g)[0], p = g.player; p.x = m.cx - p.w / 2; p.y = m.fy * TS - p.h; p.vy = 0;
    for (let q = 0; q < 240; q++) frame(g, {});
    // a label takes (STAMPX - BELT0 - 0.2) / 2.4 s to reach the stamp: send it that long before the drop's end
    const travel = (STAMPX + 0.2 - BELT0) / 2.4, want = ((1.62 - travel) % 2.4 + 2.4) % 2.4;
    let c0 = R.c % 2.4;
    for (let q = 0; q < 120 * 20 && !R.won; q++) { const c = R.c % 2.4, go = c0 < want && c >= want; c0 = c; frame(g, go ? { action: true, actionPressed: true } : {}); }
  }
});
const IV = OA.IVORY;

/* ================= orchPip: ONE LOOSE PIP (the pip cellar) ================= */
// three pears hang over the stage at columns 10, 13, 16, each with a mark under it; the shaker's mark at column 7
const PEARS = [10, 13, 16];
TourRooms.def('orchPip', {
  title: 'ONE LOOSE PIP', rule: 'THROW THE SHAKER, WATCH THE WINDOWS. ONE PIP KEEPS RATTLING AFTER THE OTHERS STOP: THROW UNDER THAT PEAR. TWICE', need: 'FIND THE LOOSE PIP FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 19 });
    mk(g, 7, 7, 's', 'SHAKE');
    PEARS.forEach((x, k) => { mk(g, x, 7, k, 'THIS ONE'); g.need('pear ' + k, x, 7); });
    g.winSpot(A.id, 13, 7);
    mirror(g, []); g.data.pears = PEARS.map(x => W - 1 - x); g.data.shaker = W - 1 - 7;
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.n = 0; R.st = 'idle'; R.loose = R.loose != null ? R.loose : 2; } },
  update(play, dt, A, R) { if (R.won) return; R.tt = (R.tt || 0) + dt; if (R.st === 'shake' && R.tt > 1.2) { R.st = 'settle'; R.tt = 0; } if (R.st === 'settle' && R.tt > 1.8) { R.st = 'pick'; } },
  mark(play, A, R, kit, m) {
    if (R.won) return;
    if (m.k === 's') { if (R.st === 'shake' || R.st === 'settle') return; R.st = 'shake'; R.tt = 0; TourKit.sfx('rattle', 'kick', { vol: 0.4, pitch: 1.8 }); return; }
    if (R.st !== 'settle' && R.st !== 'pick') { OK.say(play, m.cx, 3 * TS, 'SHAKE THEM FIRST', '#ffffff'); return; }
    if (m.k === R.loose) { R.n++; chime(R.n, true); OK.say(play, m.cx, 2 * TS, R.n >= 2 ? 'THE LOOSE ONE AGAIN!' : 'THAT\'S THE ONE!', '#ffd84a'); R.st = 'idle'; R.loose = (R.loose + 2) % 3; if (R.n >= 2) TourRooms.win(play, A, R, { text: 'ONE LOOSE PIP!', star: true, coins: 3 }); }
    else { R.fails = (R.fails || 0) + 1; RK.raspberry(play, 'ALL ITS PIPS ARE STILL'); R.st = 'idle'; R.loose = (R.loose + 1) % 3; }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t;
    // the shaker: a lever on a post linked to the pears' rail
    const sx = (kit.data.shaker + 0.5) * TS; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, 8 * TS - 4); ctx.lineTo(sx + (R.st === 'shake' ? Math.sin(t * 40) * 12 : 8), 8 * TS - 54); ctx.stroke(); ctx.fillStyle = OA.RUST; ctx.beginPath(); ctx.arc(sx + (R.st === 'shake' ? Math.sin(t * 40) * 12 : 8), 8 * TS - 56, 7, 0, TAU); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = '#6a5048'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(Math.min(...kit.data.pears) * TS - 10, 3.6 * TS); ctx.lineTo((Math.max(...kit.data.pears) + 1) * TS + 10, 3.6 * TS); ctx.stroke(); ctx.restore();
    kit.data.pears.forEach((x, k) => {
      const cx = (x + 0.5) * TS, shake = R.st === 'shake' ? Math.sin(t * 30 + k) * 0.18 : 0, py = 6.0 * TS;
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, 3.6 * TS); ctx.lineTo(cx, py - 1.6 * TS); ctx.stroke();
      OA.pear(ctx, cx, py, 1.9, OA.PEAR, true, shake);
      // the cutaway window with three pips inside
      ctx.translate(cx, py - 19); ctx.rotate(shake); ctx.fillStyle = '#fff6dc'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(0, 0, 13, 16, 0, 0, TAU); ctx.fill(); ctx.stroke();
      const loose = k === R.loose && (R.st === 'settle' || R.st === 'pick');
      for (let q = 0; q < 3; q++) {
        let dx = (q - 1) * 7, dy = 4 + (q === 1 ? -6 : 0), a = 0.3;
        if (R.st === 'shake') { dx += Math.sin(t * 37 + q * 2 + k) * 4; dy += Math.cos(t * 41 + q + k) * 4; a = t * 9 + q; }
        if (loose && q === 2) { dx += Math.sin(t * 26) * 3.5; dy += Math.cos(t * 31) * 2.5; a = t * 8; }
        ctx.save(); ctx.translate(dx, dy); ctx.rotate(a); ctx.fillStyle = '#3a2214'; ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 4.2, 0, 0, TAU); ctx.fill(); ctx.restore();
      }
      ctx.restore();
    });
    if (!R.won && quiet(play, R)) hud(play, ctx, R.st === 'idle' ? 'THROW THE SHAKER (' + (R.n || 0) + ' OF 2)' : 'WHICH PIP IS LOOSE? (' + (R.n || 0) + ' OF 2)');
  },
  testWin(g, A, R, kit, frame) {
    for (let n = 0; n < 3 && !R.won; n++) {
      const sh = marks(g).find(m => m.k === 's'); this.mark(g, A, R, kit, sh); for (let q = 0; q < 120 * 1.6; q++) frame(g, {});
      const m = marks(g).find(e => e.k === R.loose); this.mark(g, A, R, kit, m); frame(g, {});
    }
  }
});

// an orchard room's words in turn: the title alone (about 1.5 s), then the rule's pill; the room's lines after that
{
  const en0 = TourRooms.enter;
  TourRooms.enter = function (play, A) {
    en0.apply(this, arguments);
    const kit = A.roomKit; if (!(kit && /^orch/.test(kit.kind))) return;
    const R = this.state(play, A);
    play.toastT = 0; play.bannerT = Math.max(play.bannerT || 0, 1.5); R.ruleWait = !R.won && !!kit.rule;
  };
  const dr0 = TourRooms.draw;
  TourRooms.draw = function (play, ctx) {
    const kit = play.area && play.area.roomKit;
    if (!(kit && /^orch/.test(kit.kind)) || !(play.bannerT > 0)) return dr0.apply(this, arguments);
    ctx.save(); ctx.globalAlpha = clamp(1 - play.bannerT * 3, 0.15, 1); try { return dr0.apply(this, arguments); } finally { ctx.restore(); }
  };
  const up0 = TourRooms.update;
  TourRooms.update = function (play, dt) {
    const A = play.area, kit = A && A.roomKit;
    if (kit && /^orch/.test(kit.kind)) { const R = this.state(play, A); if (R.ruleWait && !(play.bannerT > 0)) { R.ruleWait = false; play.toast(kit.rule); } }
    return up0.apply(this, arguments);
  };
}
// the camera in an orchard room: the whole room's width in view, the stage band in the middle
TourHooks.on('camera', (play, dt) => {
  const A = play.area; if (!(A && A.roomKit && /^orch/.test(A.roomKit.kind))) return;
  const vw = (R1 + 1) * TS, mir = A.roomKit.data && A.roomKit.data.mirror;
  if (Game.viewW >= vw - 8) play.camX = mir ? clamp(A.W * TS - vw - (Game.viewW - vw) / 2, 0, Math.max(0, A.W * TS - Game.viewW)) : clamp((vw - Game.viewW) / 2, 0, Math.max(0, A.W * TS - Game.viewW));
});
{
  const ct0 = Play.prototype.camTargetY;
  Play.prototype.camTargetY = function (snap) { const A = this.area; if (A && A.roomKit && /^orch/.test(A.roomKit.kind)) return clamp(TS, 0, Math.max(0, A.H * TS - Game.viewH)); return ct0.call(this, snap); };
}
Tour.orchKit.Rooms = TourRooms;
})();
