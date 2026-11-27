/* ============================================================
   POSTMARK SOUND: the secret rooms (world 27), one per stage: B6 to B10 of the relay (docs/design/CHATGPT_RELAY.md
   §B) re-skinned for the printed harbour, and the sixth stage's own room from §F, every one a different game in a
   different place, with its own floor, walls and arrangement:
     postGap    27-1 MIND THE GAP          the stamp press: four stamps print in a row, then again with a gap: jump on
                                           the stamp that fills it (twice)
     postFake   27-2 COUNTERFEIT POSTMARK  the inspector's bureau: three postmarks; the card turns over and back: one
                                           has changed: stand under it and THROW
     postEcho   27-3 ECHO IN AN INKWELL    the ink cellar: three inkwells puff a tall, a short and a rippled cloud:
                                           play their three-puff phrase back with THROW
     postDrop   27-4 THE LAST DROP         the pen shop: two nibs drip into one bottle: THROW to cap it when the ink
                                           meets the etched line
     postFlip   27-5 PICTURE SIDE UP       the chute room: a postcard tumbles: THROW to slide the tray under while its
                                           picture is up, twice
     postPeel   27-6 PEEL HERE             the collector's den: a stamp with one loose corner: THROW at the corner, then
                                           steer along the curling edge with the stick; a wrong turn held too long tears it
   Every room fits one landscape phone view, shows its rule in motion as Brady comes in, opens its prize cage the
   moment it is won, and a miss only restarts the turn. Each room's door back out leads further along the stage.
   ============================================================ */
(function () {
if (typeof TourRooms === 'undefined') return;
const K = Tour.postKit, INK = K.INK, PA = K.PostArt, COBALT = K.COBALT, CORAL = K.CORAL, BLACK = K.BLACK, WHITE = K.WHITE, PAPER = K.PAPER, RK = TourRoomKit;
const Y = 6, F = 7;
// the shared frame: a 28 x 14 room; the door left or right, the cage right or left (optionally on a plinth)
function frame(keep, A, o, opts) {
  opts = opts || {};
  const g = RK.room(28, 14, F);
  g.fill(22, 1, 26, Y, '#');
  if (opts.roof) g.fill(1, 1, 21, opts.roof, '#');
  if (opts.doorRight) { g.put(19, Y, '@'); if (keep.door) g.door(20, Y, keep.door); }
  else g.west(keep, Y);
  const items = RK.prize(o, keep);
  if (opts.cageLeft) {
    const y = opts.plinth ? Y - 1 : Y, h = opts.cageH || 4, w = 3, x = 2, top = y - h + 1;
    if (opts.plinth) g.fill(1, Y, 6, Y, '#');
    g.fill(1, top - 1, x + w, top - 1, '#'); g.fill(x, top, x + w - 1, y, '.');
    g.vline(x + w, top, y, g.L(['lock', 'room:' + A.id]));
    items.forEach((it, k) => g.box(x + 1 + k, top, it));
    g.data.cage = { x: x + w, top, y, w };
  } else g.cage(A.id, opts.cageX || 17, Y, items, { w: 3, h: opts.cageH || 4 });
  return { g };
}
const fail = (play, txt) => { TourKit.sfx('fizz', 'bump', { vol: 0.5, pitch: 0.6 }); const p = play.player; if (p) K.pill(play, p.cx, p.y - 24, txt, '#ffb0a0'); };
const good = (play, txt) => { TourKit.sfx('chime', 'pick', { vol: 0.5, pitch: 1.2 }); const p = play.player; if (p) K.pill(play, p.cx, p.y - 24, txt, '#ffe08a'); };
// the room's counter / prompt: one pill in a fixed spot just above the room's game (never over it), after the title
// and the rule have gone
const hud = (play, ctx, str, y) => {
  if (play.bannerT > 0 || play.toastT > 0) return;
  const x = play.camX + Game.viewW / 2, yy = Math.max(y || 100, play.camY + 62);
  ctx.save(); ctx.font = '12px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(str).width + 22;
  ctx.fillStyle = 'rgba(22,20,40,0.88)'; rr(ctx, x - w / 2, yy - 11, w, 22, 11); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.fillText(str, x, yy + 1); ctx.restore();
};
// the camera holds still on the room
{
  const uc0 = Play.prototype.updateCamera;
  Play.prototype.updateCamera = function (dt) {
    const r = uc0.call(this, dt), A = this.area;
    if (A && A.post && A.post.room) { this.camX = clamp(11.5 * TS - Game.viewW / 2, 0, Math.max(0, A.W * TS - Game.viewW)); this.camY = clamp(1 * TS, 0, Math.max(0, A.H * TS - Game.viewH)); }
    return r;
  };
  const ct0 = Play.prototype.camTargetY;
  Play.prototype.camTargetY = function (snap) { const A = this.area; if (A && A.post && A.post.room) return clamp(1 * TS, 0, Math.max(0, A.H * TS - Game.viewH)); return ct0.call(this, snap); };
}
// a room prop: drawn by its role; the ones Brady plays with THROW claim the button while he touches them
class PostRoomProp extends Ent {
  constructor(g, s) { super(g, s, (s.w || 1) * TS, (s.h || 2) * TS); this.x = s.x - this.w / 2; this.y = s.y - this.h; this.friendly = true; this.role = s.role; this.k = s.k || 0; this.back = true; this.anim = 0; this.claims = ['well', 'capper', 'tray', 'peel', 'lens'].indexOf(s.role) >= 0; }
  postClaim(p) { return !!this.claims && overlap(p, { x: this.x - 10, y: this.y, w: this.w + 20, h: this.h + 4 }); }
  update(dt) { this.t += dt; this.anim = Math.max(0, this.anim - dt); }
  touchPlayer() {}
  draw(ctx) { const R = this.g.area && this.g.area.roomState; const D = DRAW[this.role]; if (D) D(ctx, this, R || {}); }
}
ENTITY_TYPES.postRoomProp = PostRoomProp;
const DRAW = {};
const landed = (play, R) => { const p = play.player, l = p.onGround && !R.wasG; R.wasG = p.onGround; return l; };
const padAt = (play, xs) => { const p = play.player; return xs.findIndex(x => Math.abs(p.cx - (x * TS + TS / 2)) < TS * 0.9); };
const pad = (ctx, x, y, lit, n) => { ctx.save(); ctx.fillStyle = lit ? '#ffe08a' : 'rgba(255,255,255,0.25)'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 2, 22, 6, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); };

/* ================= postGap: MIND THE GAP (the stamp press) ================= */
const GAP_PADS = [6, 10, 14], SHAPES = [0, 1, 3, 4, 5];
TourRooms.def('postGap', {
  title: 'MIND THE GAP', rule: 'JUMP ON THE STAMP THAT FILLS THE GAP', need: 'FILL THE GAP FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, {});
    g.spawn(10, 5, 'postRoomProp', { role: 'press', w: 10, h: 2 });
    GAP_PADS.forEach((x, k) => g.spawn(x, Y, 'postRoomProp', { role: 'gapPad', k, w: 2, h: 2 }));
    g.winSpot(A.id, GAP_PADS[1], Y);
    return g;
  },
  enter(play, A, R) { R.round = R.round || 0; this.deal(R); },
  deal(R) { const pool = SHAPES.slice().sort(() => Math.random() - 0.5); R.seq = pool.slice(0, 4); R.blank = Math.floor(Math.random() * 4); const wrong = pool[4]; const others = R.seq.filter((q, i) => i !== R.blank); const choices = [R.seq[R.blank], wrong, others[Math.floor(Math.random() * 3)]].sort(() => Math.random() - 0.5); R.choices = choices; R.show = 0; R.phase = 'show'; },
  update(play, dt, A, R) {
    if (R.won) return;
    R.show += dt;
    if (R.phase === 'show' && R.show > 4.6) R.phase = 'pick';
    const l = landed(play, R);
    if (R.phase !== 'pick' || !l) return;
    const i = padAt(play, GAP_PADS); if (i < 0) return;
    if (R.choices[i] === R.seq[R.blank]) { R.round++; if (R.round >= 2) TourRooms.win(play, A, R, { text: 'THE GAP IS FILLED! (TWICE)', coins: 3 }); else { good(play, 'THAT ONE! AGAIN...'); this.deal(R); } }
    else { fail(play, 'NOT THAT ONE: WATCH AGAIN'); R.show = 0; R.phase = 'show'; }
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'FILLED!' : 'ROUND ' + Math.min(2, (R.round || 0) + 1) + ' / 2', 100); }
});
DRAW.press = (ctx, e, R) => {
  // the press's sheet: four stamp places in a row; pass 1 prints them one by one, pass 2 again with a gap
  const x0 = e.x, y0 = e.y, t = R.show || 0;
  ctx.save(); ctx.fillStyle = '#e8e4d8'; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, x0, y0, e.w, e.h, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5a6478'; ctx.fillRect(x0 - 8, y0 - 10, e.w + 16, 10); ctx.strokeRect(x0 - 8, y0 - 10, e.w + 16, 10);
  if (!R.seq) { ctx.restore(); return; }
  for (let i = 0; i < 4; i++) {
    const sx = x0 + 34 + i * 70, sy = y0 + 10;
    let show = false, blank = false;
    if (R.won || R.phase === 'pick') { show = true; blank = !R.won && i === R.blank; }
    else if (t < 2.2) show = t > 0.4 + i * 0.45;
    else if (t > 2.6) { show = t > 2.8 + i * 0.45; blank = i === R.blank; }
    if (!show) { ctx.strokeStyle = 'rgba(26,22,48,0.3)'; ctx.setLineDash([4, 4]); ctx.strokeRect(sx, sy, 36, 44); ctx.setLineDash([]); continue; }
    if (blank) { ctx.fillStyle = 'rgba(244,122,90,0.25)'; ctx.fillRect(sx, sy, 36, 44); ctx.strokeStyle = CORAL; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.strokeRect(sx, sy, 36, 44); ctx.setLineDash([]); ctx.fillStyle = CORAL; ctx.font = '18px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('?', sx + 18, sy + 29); continue; }
    PA.stamp(ctx, sx, sy, 36, 44, R.seq[i], [COBALT, CORAL, '#3a8a5a', '#8a5ac8'][i]);
  }
  ctx.restore();
};
DRAW.gapPad = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h, c = R.choices ? R.choices[e.k] : null;
  pad(ctx, x, y, false);
  if (c == null) return;
  ctx.save(); PA.stamp(ctx, x - 12, y - 34, 24, 28, c, '#5a6478'); if (R.phase === 'pick' && !R.won) { ctx.strokeStyle = `rgba(255,224,138,${0.5 + 0.5 * Math.sin(e.t * 6)})`; ctx.lineWidth = 3; ctx.strokeRect(x - 16, y - 38, 32, 36); } ctx.restore();
};

/* ================= postFake: COUNTERFEIT POSTMARK (the inspector's bureau) ================= */
const FAKE_X = [6, 11, 16];
TourRooms.def('postFake', {
  title: 'COUNTERFEIT POSTMARK', rule: 'WATCH THE CARD. THROW UNDER THE CHANGED MARK', need: 'SPOT THE FAKE FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { doorRight: true, cageLeft: true, plinth: true, cageH: 3 });
    g.spawn(11, 5, 'postRoomProp', { role: 'card', w: 14, h: 2 });
    FAKE_X.forEach((x, k) => g.spawn(x, Y, 'postRoomProp', { role: 'lens', k, w: 2, h: 2 }));
    g.winSpot(A.id, FAKE_X[1], Y);
    return g;
  },
  enter(play, A, R) { R.odd = Math.floor(Math.random() * 3); R.t0 = 0; R.marks = [0, 1, 2].map(() => ({ bars: 3, ring: 2 })); R.changeTo = Math.random() < 0.5 ? 'bars' : 'ring'; },
  update(play, dt, A, R) {
    if (R.won) return;
    R.t0 += dt;
    const I = play.postIn; if (!I || !I.pressed || !(I.by instanceof PostRoomProp) || I.by.role !== 'lens') return;
    if (R.t0 < 4.2) { fail(play, 'WAIT FOR THE CARD TO TURN BACK'); return; }
    if (I.by.k === R.odd) TourRooms.win(play, A, R, { text: 'A COUNTERFEIT! WELL SPOTTED', coins: 3 });
    else { fail(play, 'GENUINE! LOOK AGAIN'); R.t0 = 0; R.odd = (R.odd + 1 + Math.floor(Math.random() * 2)) % 3; }
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'CASE CLOSED' : (R.t0 || 0) < 2.4 ? 'STUDY THEM...' : (R.t0 || 0) < 4.2 ? 'TURNING OVER...' : 'WHICH ONE CHANGED?', 106); }
});
DRAW.card = (ctx, e, R) => {
  // the big postcard; at 2.4 s it turns over (it squashes to its back and back again), then one mark is different
  const t = R.t0 || 0, x0 = e.x, y0 = e.y;
  let sx = 1; if (t > 2.4 && t < 4.2) sx = Math.abs(Math.cos((t - 2.4) / 1.8 * Math.PI));
  const back = t > 2.85 && t < 3.75;
  ctx.save(); ctx.translate(x0 + e.w / 2, 0); ctx.scale(Math.max(0.04, sx), 1); ctx.translate(-(x0 + e.w / 2), 0);
  ctx.fillStyle = back ? '#e8dcc0' : WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; rr(ctx, x0, y0, e.w, e.h, 6); ctx.fill(); ctx.stroke();
  if (!back) for (let i = 0; i < 3; i++) {
    const cx = (FAKE_X[i] + 1) * TS - 4, cy = y0 + e.h / 2, changed = !R.won && t >= 4.2 && i === R.odd;
    ctx.strokeStyle = BLACK; ctx.lineWidth = 3; const rings = changed && R.changeTo === 'ring' ? 1 : 2;
    for (let q = 0; q < rings; q++) { ctx.beginPath(); ctx.arc(cx - 14, cy, 18 - q * 6, 0, TAU); ctx.stroke(); }
    const bars = changed && R.changeTo === 'bars' ? 2 : 3;
    for (let q = 0; q < bars; q++) { ctx.beginPath(); for (let k = 0; k <= 8; k++) ctx.lineTo(cx + 8 + k * 5, cy - 12 + q * 12 + Math.sin(k) * 3); ctx.stroke(); }
  } else { ctx.fillStyle = 'rgba(26,22,48,0.4)'; ctx.font = '12px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('POST CARD', x0 + e.w / 2, y0 + e.h / 2 + 4); }
  ctx.restore();
};
DRAW.lens = (ctx, e, R) => { const x = e.cx, y = e.y + e.h; pad(ctx, x, y, (R.t0 || 0) >= 4.2 && !R.won); ctx.save(); ctx.strokeStyle = '#d8b04a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y - 34, 11, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(200,230,255,0.3)'; ctx.fill(); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 2, y - 23, 4, 18); ctx.restore(); };

/* ================= postEcho: ECHO IN AN INKWELL (the ink cellar) ================= */
const WELL_X = [5, 10, 15], CLOUD = ['TALL', 'SHORT', 'RIPPLED'];
TourRooms.def('postEcho', {
  title: 'ECHO IN AN INKWELL', rule: 'WATCH THE PUFFS, THEN PUFF THEM BACK', need: 'ECHO THE PHRASE FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { cageX: 18 });
    WELL_X.forEach((x, k) => g.spawn(x, Y, 'postRoomProp', { role: 'well', k, w: 2, h: 2 }));
    g.winSpot(A.id, WELL_X[1], Y);
    return g;
  },
  enter(play, A, R) { R.seq = [0, 1, 2].map(() => Math.floor(Math.random() * 3)); if (R.seq[0] === R.seq[1] && R.seq[1] === R.seq[2]) R.seq[1] = (R.seq[1] + 1) % 3; R.play = 0; R.got = []; R.puff = [0, 0, 0]; },
  update(play, dt, A, R) {
    R.puff = R.puff.map(v => Math.max(0, v - dt));
    if (R.won) return;
    if (R.play < 3.6) { const before = R.play; R.play += dt; for (let i = 0; i < 3; i++) { const at = 0.6 + i * 0.9; if (before < at && R.play >= at) { R.puff[R.seq[i]] = 0.8; TourKit.sfx('puff', 'select', { vol: 0.5, pitch: [0.7, 1.3, 1.0][R.seq[i]] }); } } return; }
    const I = play.postIn; if (!I || !I.pressed || !(I.by instanceof PostRoomProp) || I.by.role !== 'well') return;
    const k = I.by.k; R.puff[k] = 0.8; TourKit.sfx('puff', 'select', { vol: 0.5, pitch: [0.7, 1.3, 1.0][k] });
    R.got.push(k);
    if (R.got[R.got.length - 1] !== R.seq[R.got.length - 1]) { fail(play, 'THAT ECHO WAS OFF: LISTEN AGAIN'); R.got = []; R.play = 0; return; }
    if (R.got.length >= 3) TourRooms.win(play, A, R, { text: 'A PERFECT ECHO!', coins: 3 });
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'ECHOED!' : (R.play || 0) < 3.6 ? 'WATCH...' : 'YOUR TURN: ' + (R.got ? R.got.length : 0) + ' / 3', 96); }
});
DRAW.well = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h, k = e.k, pf = (R.puff && R.puff[k]) || 0;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = ['#1e3490', '#16141e', '#8a2a3a'][k]; rr(ctx, x - 18, y - 30, 36, 30, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8b898'; ctx.fillRect(x - 8, y - 38, 16, 9); ctx.strokeRect(x - 8, y - 38, 16, 9);
  ctx.fillStyle = WHITE; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(CLOUD[k], x, y - 12);
  if (pf > 0) { ctx.save(); ctx.strokeStyle = `rgba(255,224,138,${Math.min(1, pf * 1.5)})`; ctx.lineWidth = 5; rr(ctx, x - 24, y - 44, 48, 48, 10); ctx.stroke(); ctx.restore(); }
  if (pf > 0) {
    ctx.globalAlpha = Math.min(1, pf * 2); ctx.fillStyle = ['#5a7ae8', '#3a3a5a', '#c85a6a'][k];
    const h = k === 0 ? 90 : k === 1 ? 36 : 60, top = y - 40 - h * (1 - pf * 0.5);
    if (k === 2) for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.arc(x + Math.sin(q * 2 + e.t * 8) * 8, top + q * 14, 10, 0, TAU); ctx.fill(); }
    else if (k === 0) { ctx.beginPath(); ctx.ellipse(x, top + h / 2, 12, h / 2, 0, 0, TAU); ctx.fill(); }
    else { ctx.beginPath(); ctx.ellipse(x, y - 52, 34, 12, 0, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
};

/* ================= postDrop: THE LAST DROP (the pen shop) ================= */
const BOT_X = 10, CAP_X = 13, LINE = 0.72;
TourRooms.def('postDrop', {
  title: 'THE LAST DROP', rule: 'THROW TO CAP IT AT THE LINE', need: 'CAP IT AT THE LINE FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { doorRight: true, cageLeft: true });
    g.spawn(BOT_X, Y, 'postRoomProp', { role: 'bottle', w: 3, h: 4 });
    g.spawn(CAP_X, Y, 'postRoomProp', { role: 'capper', w: 1, h: 2 });
    g.winSpot(A.id, CAP_X, Y);
    return g;
  },
  enter(play, A, R) { R.lvl = 0; R.drip = 0; R.over = 0; },
  update(play, dt, A, R) {
    if (R.won) return;
    if (R.over > 0) { R.over -= dt; if (R.over <= 0) R.lvl = 0; return; }
    R.drip += dt; if (R.drip > 0.42) { R.drip = 0; R.lvl += 0.045; TourKit.sfx('drip', 'select', { vol: 0.2, pitch: 1.4 }); }
    if (R.lvl > 1) { fail(play, 'OVERFLOWED! IT EMPTIES AND STARTS AGAIN'); R.over = 1; return; }
    const I = play.postIn; if (!I || !I.pressed || !(I.by instanceof PostRoomProp) || I.by.role !== 'capper') return;
    if (Math.abs(R.lvl - LINE) <= 0.05) TourRooms.win(play, A, R, { text: 'CAPPED AT THE LINE!', coins: 3 });
    else { fail(play, R.lvl < LINE ? 'TOO SOON: NOT UP TO THE LINE' : 'TOO LATE: OVER THE LINE'); R.over = 0.8; }
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'THE LAST DROP!' : 'CAP IT AT THE LINE', 76); }
});
DRAW.bottle = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h, w = 50, h = 72, lv = clamp(R.lvl || 0, 0, 1);
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
  // the two nibs above, dripping
  for (const dx of [-12, 12]) { ctx.fillStyle = '#c8c8d0'; ctx.beginPath(); ctx.moveTo(x + dx - 6, y - h - 38); ctx.lineTo(x + dx + 6, y - h - 38); ctx.lineTo(x + dx, y - h - 22); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = BLACK; ctx.fillRect(x + dx - 4, y - h - 60, 8, 22); const d = ((R.drip || 0) / 0.42); ctx.beginPath(); ctx.arc(x + dx, y - h - 20 + d * 20, 3, 0, TAU); ctx.fill(); }
  ctx.fillStyle = 'rgba(220,235,255,0.5)'; rr(ctx, x - w / 2, y - h, w, h, 8); ctx.fill(); ctx.stroke();
  ctx.save(); rr(ctx, x - w / 2, y - h, w, h, 8); ctx.clip(); ctx.fillStyle = '#1e1e48'; ctx.fillRect(x - w / 2, y - h * lv, w, h * lv); ctx.restore();
  const ly = y - h * LINE; ctx.strokeStyle = CORAL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - w / 2 - 8, ly); ctx.lineTo(x + w / 2 + 8, ly); ctx.stroke();
  ctx.strokeStyle = 'rgba(244,122,90,0.4)'; ctx.lineWidth = 1.5; for (const dy of [-0.05, 0.05]) { ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * (LINE + dy)); ctx.lineTo(x + w / 2, y - h * (LINE + dy)); ctx.stroke(); }
  if (R.won) { ctx.fillStyle = CORAL; rr(ctx, x - 16, y - h - 12, 32, 14, 4); ctx.fill(); ctx.strokeStyle = INK; ctx.stroke(); }
  ctx.restore();
};
DRAW.capper = (ctx, e, R) => { const x = e.cx, y = e.y + e.h; pad(ctx, x, y, !R.won); ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#8a5a3a'; ctx.fillRect(x - 3, y - 46, 6, 46); ctx.strokeRect(x - 3, y - 46, 6, 46); ctx.fillStyle = CORAL; rr(ctx, x - 12, y - 56, 24, 12, 4); ctx.fill(); ctx.stroke(); ctx.restore(); };

/* ================= postFlip: PICTURE SIDE UP (the chute room) ================= */
const TRAY_X = 11;
TourRooms.def('postFlip', {
  title: 'PICTURE SIDE UP', rule: 'THROW WHEN THE PICTURE IS UP. TWICE', need: 'CATCH IT PICTURE UP FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { cageX: 18, roof: 1 });
    g.spawn(TRAY_X, Y, 'postRoomProp', { role: 'tray', w: 3, h: 2 });
    g.winSpot(A.id, TRAY_X, Y);
    return g;
  },
  enter(play, A, R) { R.n = R.n || 0; R.a = 0; R.cool = 0; },
  up(R) { return Math.cos(R.a) > 0.35; },
  update(play, dt, A, R) {
    if (R.won) return;
    R.a += dt * 3.2; if (R.cool > 0) R.cool -= dt;
    const I = play.postIn; if (!I || !I.pressed || !(I.by instanceof PostRoomProp) || I.by.role !== 'tray' || R.cool > 0) return;
    R.cool = 0.5;
    if (this.up(R)) { R.n++; R.caught = 0.6; if (R.n >= 2) TourRooms.win(play, A, R, { text: 'PICTURE SIDE UP! (TWICE)', coins: 3 }); else good(play, 'PICTURE UP! ONE MORE'); }
    else { fail(play, 'BLANK SIDE UP! WATCH IT TURN'); R.n = 0; }
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'SORTED!' : 'PICTURE UP: ' + (R.n || 0) + ' / 2', 76); }
});
DRAW.tray = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h, a = R.a || 0, up = Math.cos(a) > 0.35;
  ctx.save(); pad(ctx, x, y, !R.won);
  // the tumbling card over the tray: it squashes as it turns; picture (sea and sun) or blank back
  const cy = y - 96 + Math.sin(a * 0.5) * 6, sx = Math.cos(a);
  ctx.translate(x, cy); ctx.scale(Math.max(0.05, Math.abs(sx)), 1); ctx.rotate(Math.sin(a * 0.7) * 0.15);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
  if (sx > 0) { ctx.fillStyle = WHITE; rr(ctx, -34, -24, 68, 48, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#9ad0f0'; ctx.fillRect(-29, -19, 58, 38); ctx.fillStyle = CORAL; ctx.beginPath(); ctx.arc(10, -4, 8, 0, TAU); ctx.fill(); PA.scallops(ctx, -29, 22, 6, 5, COBALT); }
  else { ctx.fillStyle = '#e8dcc0'; rr(ctx, -34, -24, 68, 48, 4); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(26,22,48,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 18); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#c8a04a'; rr(ctx, x - 40, y - 20, 80, 12, 3); ctx.fill(); ctx.stroke(); ctx.restore();
  if (up && !R.won) { ctx.save(); ctx.strokeStyle = 'rgba(255,224,138,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y - 96, 46, 34, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
};

/* ================= postPeel: PEEL HERE (the collector's den) ================= */
// the stamp's edge is a loop of four sides; the curl moves along it while the stick points the way the edge goes
const PEEL_X = 11, PEEL_DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]], PEEL_NAMES = ['RIGHT', 'DOWN', 'LEFT', 'UP'];
TourRooms.def('postPeel', {
  title: 'PEEL HERE', rule: 'PEEL THE STAMP: FOLLOW THE CURL', need: 'PEEL IT FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { doorRight: true, cageLeft: true, plinth: true, cageH: 3 });
    g.spawn(PEEL_X, Y, 'postRoomProp', { role: 'peel', w: 2, h: 2 });
    g.spawn(11, 5, 'postRoomProp', { role: 'bigstamp', w: 6, h: 2 });
    g.winSpot(A.id, PEEL_X, Y);
    return g;
  },
  enter(play, A, R) { R.on = false; R.prog = 0; R.wrong = 0; R.torn = 0; },
  update(play, dt, A, R) {
    if (R.won) return;
    if (R.torn > 0) { R.torn -= dt; return; }
    const p = play.player, I = play.postIn;
    if (!R.on) { if (I && I.pressed && I.by instanceof PostRoomProp && I.by.role === 'peel') { R.on = true; R.prog = 0; R.wrong = 0; good(play, 'PEELING... FOLLOW THE EDGE'); } return; }
    // mounted: Brady stays at the mark while the stick steers the peel
    p.vx = 0; p.x = PEEL_X * TS + TS / 2 - p.w / 2;
    const inp = play.postInp || p.inp || {}, side = Math.min(3, Math.floor(R.prog)), [dx, dy] = PEEL_DIRS[side];
    const sx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), sy = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    if (sx === dx && sy === dy) { R.prog += dt * 0.55; R.wrong = Math.max(0, R.wrong - dt); }
    else if (sx || sy) { R.wrong += dt; if (R.wrong > 0.7) { fail(play, 'RIIIP! IT TORE: START AGAIN'); R.on = false; R.torn = 0.8; R.prog = 0; } }
    if (R.prog >= 4) TourRooms.win(play, A, R, { text: 'PEELED IN ONE PIECE!', coins: 4 });
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'IN ONE PIECE!' : R.on ? 'PEEL: ' + PEEL_NAMES[Math.min(3, Math.floor(R.prog || 0))] : 'THROW AT THE CORNER', 100); }
});
DRAW.peel = (ctx, e, R) => { pad(ctx, e.cx, e.y + e.h, !R.on && !R.won); };
DRAW.bigstamp = (ctx, e, R) => {
  // the big stamp on the velvet: the peeled part lifts away along its edge; the curl and an arrow show where next
  const x0 = e.x - 10, y0 = e.y - 4, w = e.w + 20, h = e.h + 6, P = clamp(R.prog || 0, 0, 4);
  ctx.save(); PA.stamp(ctx, x0, y0, w, h, 5, CORAL, false);
  const pt = q => { const s = Math.min(3, Math.floor(q)), f = q - s; return s === 0 ? [x0 + w * f, y0] : s === 1 ? [x0 + w, y0 + h * f] : s === 2 ? [x0 + w * (1 - f), y0 + h] : [x0, y0 + h * (1 - f)]; };
  ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 5; ctx.beginPath(); for (let q = 0; q <= P; q += 0.05) { const [x, y] = pt(q); q ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  const [cx, cy] = pt(P), side = Math.min(3, Math.floor(P)), [dx, dy] = PEEL_DIRS[side];
  if (!R.won) {
    PA.corner(ctx, cx + 6, cy + 6, e.t, P < 1 ? 0 : side * Math.PI / 2, 1.8);
    const k = 0.5 + 0.5 * Math.sin(e.t * 8); ctx.fillStyle = R.torn > 0 ? '#ff6a5a' : `rgba(255,224,138,${0.6 + 0.4 * k})`; ctx.save(); ctx.translate(cx + dx * 30, cy + dy * 30); ctx.rotate(Math.atan2(dy, dx)); ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -9); ctx.lineTo(-6, 9); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.restore();
};

/* the room test's scripted wins (tools/sbw_rooms_test.js calls K.testWin(g, A, R, kit, frame) for a kind it has no
   script for): each plays its game through the room's own entities with the buttons a player uses */
const steps = (g, frame, n, keys) => { for (let k = 0; k < n; k++) frame(g, keys || {}); };
const stand = (g, tx) => { const p = g.player; p.x = tx * TS + TS / 2 - p.w / 2; p.y = F * TS - p.h; p.vx = p.vy = 0; };
const hop = (g, frame, tx) => { stand(g, tx); steps(g, frame, 20); frame(g, { jump: true, jumpPressed: true }); steps(g, frame, 30, { jump: true }); steps(g, frame, 60); };
const press = (g, frame) => { frame(g, { action: true, actionPressed: true }); steps(g, frame, 10); };
const until = (g, frame, fn, sec) => { for (let k = 0; k < 120 * (sec || 10) && !fn(); k++) frame(g, {}); };
TourRooms.kinds.postGap.testWin = function (g, A, R, kit, frame) {
  let missed = false;
  for (let round = 0; round < 6 && !R.won; round++) {
    until(g, frame, () => R.phase === 'pick');
    const ok = R.choices.indexOf(R.seq[R.blank]);
    if (!missed) { missed = true; hop(g, frame, GAP_PADS[(ok + 1) % 3]); continue; }
    hop(g, frame, GAP_PADS[ok]);
  }
};
TourRooms.kinds.postFake.testWin = function (g, A, R, kit, frame) {
  until(g, frame, () => R.t0 >= 4.3); stand(g, FAKE_X[(R.odd + 1) % 3]); steps(g, frame, 10); press(g, frame);
  until(g, frame, () => R.t0 >= 4.3); stand(g, FAKE_X[R.odd]); steps(g, frame, 10); press(g, frame); steps(g, frame, 20);
};
TourRooms.kinds.postEcho.testWin = function (g, A, R, kit, frame) {
  until(g, frame, () => R.play >= 3.6); stand(g, WELL_X[(R.seq[0] + 1) % 3]); steps(g, frame, 10); press(g, frame);
  until(g, frame, () => R.play >= 3.6);
  for (let i = 0; i < 3; i++) { stand(g, WELL_X[R.seq[i]]); steps(g, frame, 10); press(g, frame); steps(g, frame, 20); }
};
TourRooms.kinds.postDrop.testWin = function (g, A, R, kit, frame) {
  stand(g, CAP_X); steps(g, frame, 10); press(g, frame);
  for (let k = 0; k < 60 * 30 && !R.won; k++) { if (R.over <= 0 && Math.abs(R.lvl - LINE) < 0.02) press(g, frame); else frame(g, {}); }
};
TourRooms.kinds.postFlip.testWin = function (g, A, R, kit, frame) {
  stand(g, TRAY_X); steps(g, frame, 10);
  for (let k = 0; k < 60 * 20 && !R.won; k++) { if (Math.cos(R.a) < -0.8 && R.n === 0 && !R.missed) { R.missed = true; press(g, frame); } else if (Math.cos(R.a) > 0.9 && R.cool <= 0) press(g, frame); else frame(g, {}); }
};
TourRooms.kinds.postPeel.testWin = function (g, A, R, kit, frame) {
  stand(g, PEEL_X); steps(g, frame, 10); press(g, frame);
  steps(g, frame, 110, { left: true });
  stand(g, PEEL_X); steps(g, frame, 120); press(g, frame);
  for (let k = 0; k < 120 * 12 && !R.won; k++) { const s = Math.min(3, Math.floor(R.prog)); frame(g, [{ right: true }, { down: true }, { left: true }, { up: true }][s]); }
};
// title first, then the rule: the kit toasts the rule as the banner shows; ours waits for the banner to go
for (const k of ['postGap', 'postFake', 'postEcho', 'postDrop', 'postFlip', 'postPeel']) {
  const Kd = TourRooms.kinds[k], e0 = Kd.enter, u0 = Kd.update;
  Kd.enter = function (play, A, R, kit) { play.toastT = 0; R.ruleAt = true; if (e0) return e0.apply(this, arguments); };
  Kd.update = function (play, dt, A, R, kit) { if (R.ruleAt && !(play.bannerT > 0)) { R.ruleAt = false; if (!R.won) { play.toast(kit.rule); play.toastT = 4; } } if (u0) return u0.apply(this, arguments); };
}
Tour.postKit.ROOMS = { GAP_PADS, FAKE_X, WELL_X, CAP_X, TRAY_X, PEEL_X, LINE };
try { if (typeof window !== 'undefined') window.__roomKinds = TourRooms.kinds; } catch (e) { /* not in a browser */ }
})();
