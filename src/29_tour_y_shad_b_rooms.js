/* ============================================================
   THE DEPARTMENT OF UNCLAIMED SHADOWS: the secret rooms (world 35), one per stage: B46 to B50 of the relay
   (docs/design/CHATGPT_RELAY.md §B) re-skinned for the department. Each a different game in a different place, with its
   own floor, walls and arrangement of door, game and cage:
     shadBeat   35-1 DOWNBEAT DELIVERY  the parcel room: eight bulbs light one per beat, the last a big flash; a parcel
                                        passes along three pairs of oven mitts, one pair per beat, to Pupo. THROW at the
                                        bell on the beat that lands it in Pupo's paws on the big flash
     shadWindow 35-2 ONE WINDOW AJAR    the night corridor: four windows, every curtain stirring in the draught; one
                                        flutters OUTSIDE its frame. Stand under it and THROW to shut it, twice
     shadFoot   35-3 BORROWED FOOT      the boot room: four trails of round prints wind down to four cubbies; one trail
                                        has a single square print. Follow it to its cubby and THROW, twice
     shadCup    35-4 COLD CUP           the staff kitchen: three teapots steam, one has frost on its handle. THROW to
                                        pick it up, carry it to the mitten at the hatch, THROW to hand it over, twice
     shadFish   35-5 PRINT RUN          the cut-out workshop: a line of near-identical shadow fish; one has its scales
                                        pointing toward its head. Stand under it and THROW to lift it out, twice
   Every room fits one landscape phone view, shows its rule in motion as Brady comes in, opens its prize cage the
   moment it is won, and a miss only restarts the turn. Each room's door out leads further along the stage.
   ============================================================ */
(function () {
if (typeof TourRooms === 'undefined') return;
const K = Tour.shadKit, INK = K.INK, SA = K.ShadArt, RK = TourRoomKit;
const BUT = K.BUT, BUT_HI = K.BUT_HI, GRA = K.GRA, GRA_HI = K.GRA_HI, GRA_LO = K.GRA_LO, SAL = K.SAL, SAL_HI = K.SAL_HI, SAL_LO = K.SAL_LO, WHITE = K.WHITE;
const Y = 6, F = 7;
// the shared frame: a 28 x 14 room (21 playable columns); the door left or right, the cage right or left, either one
// optionally up on a plinth
function frame(keep, A, o, opts) {
  opts = opts || {};
  const g = RK.room(28, 14, F);
  g.fill(22, 1, 26, Y, '#');
  if (opts.roof) g.fill(opts.roof[0], 1, opts.roof[1], opts.roof[2], '#');
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
  } else {
    const y = opts.plinth ? Y - 1 : Y;
    if (opts.plinth) g.fill(opts.cageX - 1, Y, 21, Y, '#');
    g.cage(A.id, opts.cageX || 17, y, items, { w: 3, h: opts.cageH || 4 });
  }
  return { g };
}
const tag = (ctx, x, y, str, col, size) => { ctx.save(); ctx.font = (size || 10) + 'px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(str).width + 12, h = (size || 10) + 8; ctx.fillStyle = 'rgba(28,20,38,0.9)'; rr(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.fillStyle = col; ctx.fillText(str, x, y + 1); ctx.restore(); };
const fail = (play, txt) => { TourKit.sfx('fizz', 'bump', { vol: 0.5, pitch: 0.6 }); const p = play.player; if (p) K.pill(play, p.cx, p.y - 24, txt, '#ffb0a0'); };
const good = (play, txt) => { TourKit.sfx('chime', 'pick', { vol: 0.5, pitch: 1.2 }); const p = play.player; if (p) K.pill(play, p.cx, p.y - 24, txt, '#ffe08a'); };
// the room's counter / prompt: one pill in a fixed spot above the room's game (never over it), after the title and rule
const hud = (play, ctx, str, y) => {
  if (play.bannerT > 0 || play.toastT > 0) return;
  const x = play.camX + Game.viewW / 2, yy = Math.max(y || 100, play.camY + 62);
  ctx.save(); ctx.font = '12px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText(str).width + 22;
  ctx.fillStyle = 'rgba(28,20,38,0.9)'; rr(ctx, x - w / 2, yy - 11, w, 22, 11); ctx.fill(); ctx.fillStyle = '#ffe08a'; ctx.fillText(str, x, yy + 1); ctx.restore();
};
// the camera holds still on the room
{
  const uc0 = Play.prototype.updateCamera;
  Play.prototype.updateCamera = function (dt) {
    const r = uc0.call(this, dt), A = this.area;
    if (A && A.shad && A.shad.room) { this.camX = clamp(11.5 * TS - Game.viewW / 2, 0, Math.max(0, A.W * TS - Game.viewW)); this.camY = clamp(1 * TS, 0, Math.max(0, A.H * TS - Game.viewH)); }
    return r;
  };
  const ct0 = Play.prototype.camTargetY;
  Play.prototype.camTargetY = function (snap) { const A = this.area; if (A && A.shad && A.shad.room) return clamp(1 * TS, 0, Math.max(0, A.H * TS - Game.viewH)); return ct0.call(this, snap); };
}
// a room prop: drawn by its role; the THROW ones claim the button while Brady stands at them
class ShadRoomProp extends Ent {
  constructor(g, s) { super(g, s, (s.w || 1) * TS, (s.h || 2) * TS); this.x = s.x - this.w / 2; this.y = s.y - this.h; this.friendly = true; this.role = s.role; this.k = s.k || 0; this.back = true; this.claims = ['bell', 'window', 'cubby', 'pot', 'hatch', 'fish'].indexOf(s.role) >= 0; }
  shadClaim(p) { return !!this.claims && p.onGround && Math.abs(p.cx - this.cx) < (this.role === 'bell' || this.role === 'hatch' ? 26 : 18); }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) { const R = this.g.area && this.g.area.roomState; const D = DRAW[this.role]; if (D) D(ctx, this, R || {}); }
}
ENTITY_TYPES.shadRoomProp = ShadRoomProp;
const DRAW = {};
const pressed = (play, role) => { const I = play.shadIn; return I && I.pressed && I.by instanceof ShadRoomProp && I.by.role === role ? I.by : null; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (n, not) => { let k; do k = Math.floor(Math.random() * n); while (k === not && n > 1); return k; };
const markAt = (ctx, x, y, lit) => K.heels(ctx, x, y, lit);
const near = (e) => { const p = e.g.player; return p && Math.abs(p.cx - e.cx) < 18 && p.onGround; };

/* ================= shadBeat: DOWNBEAT DELIVERY (the parcel room) ================= */
const BEAT = 0.62, BULBS = 8, CYCLE = 10, MITTS = [15, 12, 9], PUPO_X = 7, BELL_X = 18, WIN_START = BULBS - 1 - MITTS.length;
TourRooms.def('shadBeat', {
  title: 'DOWNBEAT DELIVERY', rule: 'RING SO PUPO GETS IT ON THE BIG FLASH', need: 'DELIVER THE PARCEL FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { doorRight: true, cageLeft: true });
    g.spawn(12, Y, 'shadRoomProp', { role: 'beat', w: 14, h: 5 });
    g.spawn(BELL_X, Y, 'shadRoomProp', { role: 'bell', w: 1, h: 2 });
    g.winSpot(A.id, BELL_X, Y);
    return g;
  },
  enter(play, A, R) { R.clock = 0; R.sent = null; R.demo = !R.won; R.cool = 0; R.last = -1; },
  beat(R) { return Math.floor(R.clock / BEAT) % CYCLE; },
  update(play, dt, A, R) {
    R.clock += dt; if (R.cool > 0) R.cool -= dt;
    const b = this.beat(R);
    if (b !== R.last) {
      R.last = b;
      if (b < BULBS) TourKit.sfx(b === BULBS - 1 ? 'flash' : 'tick', b === BULBS - 1 ? 'secret' : 'select', { vol: b === BULBS - 1 ? 0.5 : 0.25, pitch: b === BULBS - 1 ? 1 : 1.6 });
      // the demo: on the first cycle the bell rings itself on the right beat
      if (R.demo && b === WIN_START) R.sent = { start: WIN_START, demo: true };
      if (R.sent && b === R.sent.start + MITTS.length) {
        const ok = R.sent.start === WIN_START;
        if (R.sent.demo) { R.demo = false; good(play, 'LIKE THAT! YOUR TURN'); }
        else if (ok && !R.won) TourRooms.win(play, A, R, { text: 'ON THE FLASH! PUPO HAS IT', coins: 3 });
        else if (!R.won) fail(play, R.sent.start < WIN_START ? 'TOO EARLY: IT BEAT THE FLASH' : 'TOO LATE: THE FLASH WENT BY');
        R.sent = null;
      }
      if (b === 0 && R.sent && R.sent.start >= BULBS) R.sent = null;
    }
    if (R.won || R.demo || R.sent) return;
    if (pressed(play, 'bell') && R.cool <= 0) {
      R.cool = 0.3; const q = R.clock / BEAT, nb = Math.round(q) % CYCLE;
      TourKit.sfx('ding', 'pick', { vol: 0.5, pitch: 1.5 });
      if (nb >= BULBS - MITTS.length) fail(play, 'TOO LATE FOR THIS ROUND');
      else R.sent = { start: nb };
    }
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'DELIVERED!' : R.demo ? 'WATCH THE DEMO' : 'COUNT THE BULBS. RING THE BELL', 100); }
});
DRAW.beat = (ctx, e, R) => {
  const t = e.t, fy = F * TS, b = R.clock != null ? Math.floor(R.clock / BEAT) % CYCLE : -1;
  ctx.save();
  // the eight bulbs over the counter (the eighth big): lit one per beat
  for (let k = 0; k < BULBS; k++) {
    const x = (6.5 + k * 1.55) * TS, y = 2.2 * TS, big = k === BULBS - 1, on = b === k, past = b > k && b < BULBS, r = big ? 14 : 9;
    ctx.fillStyle = on ? (big ? '#ffffff' : '#fff6a0') : past ? '#c8b060' : '#5a5040'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
    if (on) { ctx.fillStyle = big ? 'rgba(255,255,230,0.5)' : 'rgba(255,246,160,0.35)'; ctx.beginPath(); ctx.arc(x, y, r * (big ? 3 : 2), 0, TAU); ctx.fill(); }
    ctx.fillStyle = on ? INK : '#e8dcc0'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(k + 1), x, y + 1);
  }
  // the counter, the three pairs of oven mitts on stands, Pupo at the end with his paws out
  ctx.fillStyle = '#8a6a4a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(6 * TS, fy - 30, 11 * TS, 8); ctx.strokeRect(6 * TS, fy - 30, 11 * TS, 8);
  const pos = R.sent ? (b - R.sent.start) : -1;
  MITTS.forEach((mx, k) => {
    const x = mx * TS + TS / 2, holding = pos === k;
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 3, fy - 22, 6, 22);
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(x + s * 13, fy - 44); ctx.rotate(s * (holding ? 0.1 : 0.35)); ctx.fillStyle = k % 2 ? SAL : '#e86a8a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.8; rr(ctx, -8, -12, 16, 24, 7); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(s * -6, -4, 4, 7, s * 0.6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = WHITE; ctx.fillRect(-8, 8, 16, 4); ctx.restore(); }
  });
  if (typeof Pupo !== 'undefined') { try { Pupo.draw(ctx, { x: PUPO_X * TS + TS / 2, y: fy, scale: 1.0, t, pose: pos === MITTS.length ? 'happy' : 'idle', facing: 1 }); } catch (err) { /* drawn without him */ } }
  // the parcel: in the pair it has reached (or Pupo's paws), hopping one pair per beat
  if (pos >= 0 && pos <= MITTS.length) {
    const xs = MITTS.map(m => m * TS + TS / 2).concat([PUPO_X * TS + TS / 2 + 14]), frac = (R.clock / BEAT) % 1, k = Math.min(pos, xs.length - 1);
    const x = k > 0 && frac < 0.3 ? lerp(xs[k - 1], xs[k], frac / 0.3) : xs[k], y = fy - 56 - (k > 0 && frac < 0.3 ? Math.sin(frac / 0.3 * Math.PI) * 20 : 0);
    ctx.globalAlpha = R.sent && R.sent.demo ? 0.75 : 1;
    ctx.fillStyle = '#c89a62'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(x - 12, y - 10, 24, 20); ctx.strokeRect(x - 12, y - 10, 24, 20); ctx.fillStyle = '#a87a42'; ctx.fillRect(x - 2, y - 10, 4, 20); SA.tag(ctx, x + 14, y, 0.8);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};
DRAW.bell = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h, ring = R.sent && !R.sent.demo && R.clock != null;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = SAL_LO; ctx.fillRect(x - 4, y - 30, 8, 30); ctx.strokeRect(x - 4, y - 30, 8, 30);
  ctx.fillStyle = '#e8c84a'; ctx.beginPath(); ctx.arc(x, y - 30, 13, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y - 46, 3, 0, TAU); ctx.fill(); ctx.stroke();
  if (ring) { ctx.strokeStyle = BUT_HI; ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x, y - 36, 20, s > 0 ? -0.5 : Math.PI - 0.5 + 0.0, s > 0 ? 0.5 : Math.PI + 0.5); ctx.stroke(); } }
  if (near(e) && !R.won && !R.demo) K.hint(e, ctx, x, y - 70, 'THROW: RING');
  ctx.restore();
};

/* ================= shadWindow: ONE WINDOW AJAR (the night corridor) ================= */
const WIN_X = [5, 8, 11, 14];
TourRooms.def('shadWindow', {
  title: 'ONE WINDOW AJAR', rule: 'SHUT THE CURTAIN FLAPPING OUTSIDE ITS FRAME', need: 'SHUT THE WINDOW FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { cageX: 17 });
    WIN_X.forEach((x, k) => g.spawn(x, Y, 'shadRoomProp', { role: 'window', k, w: 2, h: 5 }));
    g.winSpot(A.id, WIN_X[1], Y);
    return g;
  },
  enter(play, A, R) { if (R.odd == null) { R.odd = pick(WIN_X.length); R.round = 0; R.shut = []; } R.cool = 0; },
  update(play, dt, A, R) {
    if (R.cool > 0) R.cool -= dt; if (R.won) return;
    const e = pressed(play, 'window'); if (!e || R.cool > 0) return; R.cool = 0.4;
    if (e.k === R.odd) {
      R.shut.push(e.k); R.round++; TourKit.sfx('shut', 'bump', { vol: 0.5, pitch: 1.2 });
      if (R.round >= 2) TourRooms.win(play, A, R, { text: 'SHUT TIGHT! NO MORE DRIZZLE', coins: 3 });
      else { good(play, 'SHUT! ANOTHER ONE\'S AJAR'); R.odd = pick(WIN_X.length, e.k); }
    } else fail(play, 'THAT CURTAIN STAYS IN ITS FRAME');
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'ALL SHUT' : 'SHUT ' + (R.round || 0) + ' / 2', 100); }
});
DRAW.window = (ctx, e, R) => {
  const x = e.cx, fy = F * TS, t = e.t, top = 1.7 * TS, w = 50, h = 74, odd = !R.won && R.odd === e.k, shut = R.won || (R.shut && R.shut.indexOf(e.k) >= 0 && !odd);
  ctx.save();
  // the frame and the rainy night outside
  ctx.fillStyle = '#1a2440'; ctx.fillRect(x - w / 2, top, w, h);
  ctx.strokeStyle = 'rgba(170,200,240,0.6)'; ctx.lineWidth = 1.2; for (let k = 0; k < 6; k++) { const xx = x - w / 2 + ((k * 13 + t * 40) % w), yy = top + ((k * 23 + t * 160) % h); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx - 2, yy + 8); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(x - w / 2, top, w, h); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x - w / 2 - 6, top - 6, w + 12, 6); ctx.fillRect(x - w / 2 - 6, top + h, w + 12, 6); ctx.strokeRect(x - w / 2 - 6, top + h, w + 12, 6);
  ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x - 1.5, top, 3, h);
  // the curtain: salmon, swaying inside the frame; the odd one billows out past the frame's edge and flaps
  const sway = Math.sin(t * 3 + e.k) * 3, out = odd ? 14 + Math.sin(t * 9) * 6 : 0;
  ctx.fillStyle = SAL; ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - w / 2 + 2, top + 2); ctx.lineTo(x - 4, top + 2); ctx.quadraticCurveTo(x - 8 + sway, top + h * 0.5, x - 6 + sway * 0.5, top + h - 2); ctx.lineTo(x - w / 2 + 2, top + h - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 4, top + 2); ctx.lineTo(x + w / 2 - 2, top + 2); ctx.quadraticCurveTo(x + w / 2 + out, top + h * 0.45, x + w / 2 - 2 + out * 1.2, top + h - 6 + (odd ? Math.sin(t * 11) * 6 : 0)); ctx.lineTo(x + 6 - sway * 0.5, top + h - 2); ctx.quadraticCurveTo(x + 8 - sway, top + h * 0.5, x + 4, top + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (shut) { ctx.strokeStyle = BUT_HI; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - w / 2, top + h / 2); ctx.lineTo(x + w / 2, top + h / 2); ctx.stroke(); }
  // the radiator under it and the spot to stand
  markAt(ctx, x, fy, near(e));
  if (near(e) && !R.won) K.hint(e, ctx, x, fy - 72, 'THROW: SHUT');
  ctx.restore();
};

/* ================= shadFoot: BORROWED FOOT (the boot room) ================= */
const CUB_X = [6, 9, 12, 15], TRACK_COL = ['#5a2a6a', '#3a5a8a', '#8a3a3a', '#3a6a3a'];
TourRooms.def('shadFoot', {
  title: 'BORROWED FOOT', rule: 'FOLLOW THE TRAIL WITH ONE SQUARE PRINT', need: 'FIND ITS CUBBY FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { cageX: 17, plinth: true });
    g.spawn(10, Y, 'shadRoomProp', { role: 'trails', w: 14, h: 5 });
    CUB_X.forEach((x, k) => g.spawn(x, Y, 'shadRoomProp', { role: 'cubby', k, w: 1, h: 1 }));
    g.winSpot(A.id, CUB_X[2], Y);
    return g;
  },
  deal(R) { R.map = shuffle([0, 1, 2, 3]); while (R.map.every((v, i) => v === i)) R.map = shuffle(R.map); R.odd = pick(4, R.odd); R.sq = 0.3 + Math.random() * 0.4; },
  enter(play, A, R) { if (R.map == null) { R.round = 0; this.deal(R); } R.cool = 0; },
  update(play, dt, A, R) {
    if (R.cool > 0) R.cool -= dt; if (R.won) return;
    const e = pressed(play, 'cubby'); if (!e || R.cool > 0) return; R.cool = 0.4;
    if (R.map[R.odd] === e.k) { R.round++; if (R.round >= 2) TourRooms.win(play, A, R, { text: 'FOUND THE BORROWED FOOT!', coins: 3 }); else { good(play, 'FOUND IT! NEW TRAILS'); this.deal(R); } }
    else fail(play, 'NOT THAT TRAIL. LOOK FOR THE SQUARE');
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'WELL TRACKED' : 'FOUND ' + (R.round || 0) + ' / 2', 100); }
});
// a trail from its start (top) to its cubby: a wiggly curve; pt(k, u) the point at u in 0..1
const trailPt = (R, k, u) => { const x0 = CUB_X[k] * TS + TS / 2, x1 = CUB_X[R.map[k]] * TS + TS / 2, y0 = 1.6 * TS, y1 = F * TS - 34, e = u * u * (3 - 2 * u); return [lerp(x0, x1, e) + Math.sin(u * Math.PI * 3 + k) * 10, lerp(y0, y1, u)]; };
DRAW.trails = (ctx, e, R) => {
  if (!R.map) return;
  ctx.save();
  // the bare patch: a pale board on the wall the trails cross
  ctx.fillStyle = 'rgba(240,232,200,0.85)'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(4.6 * TS, 1.2 * TS, 12 * TS, F * TS - 1.2 * TS - 26); ctx.strokeRect(4.6 * TS, 1.2 * TS, 12 * TS, F * TS - 1.2 * TS - 26);
  for (let k = 0; k < 4; k++) {
    const N = 15;
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N, [x, y] = trailPt(R, k, u), sq = k === R.odd && Math.abs(u - R.sq) < 0.5 / N;
      ctx.fillStyle = TRACK_COL[k];
      if (sq) { ctx.fillRect(x - 4.5, y - 4.5, 9, 9); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(x - 4.5, y - 4.5, 9, 9); }
      else { ctx.beginPath(); ctx.arc(x + (i % 2 ? 3 : -3), y, 4, 0, TAU); ctx.fill(); }
    }
  }
  ctx.restore();
};
DRAW.cubby = (ctx, e, R) => {
  const x = e.cx, fy = F * TS;
  ctx.save(); ctx.fillStyle = '#4a3a2a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(x - 15, fy - 26, 30, 26); ctx.strokeRect(x - 15, fy - 26, 30, 26); ctx.fillStyle = '#1a120a'; rr(ctx, x - 10, fy - 20, 20, 20, 8); ctx.fill();
  ctx.fillStyle = WHITE; for (const dx of [-4, 4]) { ctx.beginPath(); ctx.arc(x + dx, fy - 10, 2, 0, TAU); ctx.fill(); }
  if (near(e) && !R.won) K.hint(e, ctx, x, fy - 60, 'THROW: THIS ONE');
  ctx.restore();
};

/* ================= shadCup: COLD CUP (the staff kitchen) ================= */
const POT_X = [12, 15, 18], HATCH_X = 8;
TourRooms.def('shadCup', {
  title: 'COLD CUP', rule: 'GIVE THE MITTEN THE TEAPOT WITH THE FROSTY HANDLE', need: 'HAND OVER THE COLD ONE FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { doorRight: true, cageLeft: true, plinth: true });
    POT_X.forEach((x, k) => g.spawn(x, Y, 'shadRoomProp', { role: 'pot', k, w: 1, h: 2 }));
    g.spawn(HATCH_X, Y, 'shadRoomProp', { role: 'hatch', w: 2, h: 4 });
    g.winSpot(A.id, HATCH_X, Y);
    return g;
  },
  enter(play, A, R) { if (R.cold == null) { R.cold = pick(3); R.round = 0; } R.carry = null; R.cool = 0; },
  update(play, dt, A, R) {
    if (R.cool > 0) R.cool -= dt; if (R.won || R.cool > 0) return;
    const pot = pressed(play, 'pot'), hatch = pressed(play, 'hatch');
    if (pot) { R.cool = 0.3; if (R.carry === pot.k) { R.carry = null; return; } R.carry = pot.k; TourKit.sfx('lift', 'pick', { vol: 0.4, pitch: 1.3 }); return; }
    if (hatch) {
      R.cool = 0.4; if (R.carry == null) { fail(play, 'BRING A TEAPOT FIRST'); return; }
      if (R.carry === R.cold) { R.round++; R.carry = null; if (R.round >= 2) TourRooms.win(play, A, R, { text: 'THE MITTEN SAYS THANK YOU', coins: 3 }); else { good(play, 'COLD ONE DELIVERED! AGAIN'); R.cold = pick(3, R.cold); } }
      else { fail(play, 'TOO HOT! THE MITTEN WANTS THE FROSTY ONE'); R.carry = null; }
    }
  },
  draw(play, ctx, A, R) {
    hud(play, ctx, R.won ? 'TEA FOR THE MITTEN' : 'DELIVERED ' + (R.round || 0) + ' / 2', 100);
    if (R.carry != null && !R.won) { const p = play.player; potArt(ctx, p.cx, p.y - 4, R.carry === R.cold, play.t || 0, R.carry); }
  }
});
const potArt = (ctx, x, y, frost, t, k) => {
  ctx.save();
  SA.shape(ctx, 'pot', x, y, 1.15, { fill: ['#e8f0f4', '#f4e8d0', '#e0ecd8'][k % 3], lw: 2 });
  // steam from every spout (they all look hot)
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; for (let s = 0; s < 2; s++) { const q = (t * 0.8 + s * 0.5) % 1; ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.moveTo(x + 28, y - 32 - q * 20); ctx.quadraticCurveTo(x + 34, y - 38 - q * 20, x + 28, y - 44 - q * 20); ctx.stroke(); } ctx.globalAlpha = 1;
  if (frost) {
    // frost on the handle: white crystal spikes and a little snowflake
    ctx.strokeStyle = WHITE; ctx.lineWidth = 2.2; for (const [dx, dy] of [[-20, -20], [-24, -14], [-20, -9]]) { ctx.beginPath(); ctx.moveTo(x + dx, y + dy); ctx.lineTo(x + dx - 5, y + dy - 3); ctx.moveTo(x + dx, y + dy); ctx.lineTo(x + dx - 4, y + dy + 3); ctx.stroke(); }
    ctx.strokeStyle = '#a8e0ff'; ctx.lineWidth = 1.6; const sx = x - 30, sy = y - 26; for (let a = 0; a < 3; a++) { ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * 5, sy + Math.sin(a) * 5); ctx.lineTo(sx - Math.cos(a) * 5, sy - Math.sin(a) * 5); ctx.stroke(); }
  }
  ctx.restore();
};
DRAW.pot = (ctx, e, R) => {
  const x = e.cx, fy = F * TS;
  ctx.save(); ctx.fillStyle = '#8a6a4a'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(x - 14, fy - 16, 28, 5); ctx.strokeRect(x - 14, fy - 16, 28, 5); ctx.fillRect(x - 12, fy - 11, 4, 11); ctx.fillRect(x + 8, fy - 11, 4, 11);
  if (R.carry !== e.k) potArt(ctx, x, fy - 16, !R.won && R.cold === e.k, e.t, e.k);
  if (near(e) && !R.won) K.hint(e, ctx, x, fy - 78, R.carry === e.k ? 'THROW: PUT IT BACK' : 'THROW: PICK IT UP');
  ctx.restore();
};
DRAW.hatch = (ctx, e, R) => {
  const x = e.cx, fy = F * TS, t = e.t;
  ctx.save(); ctx.fillStyle = '#6a5a4a'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.fillRect(x - 30, fy - 118, 60, 50); ctx.strokeRect(x - 30, fy - 118, 60, 50); ctx.fillStyle = '#2a2018'; ctx.fillRect(x - 24, fy - 112, 48, 40);
  // the mitten, reaching out of the hatch, waving for its cold cup
  ctx.save(); ctx.translate(x, fy - 78 + Math.sin(t * 3) * 3); ctx.rotate(Math.sin(t * 2) * 0.15); ctx.fillStyle = '#c84a4a'; rr(ctx, -12, -16, 24, 30, 10); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(-12, -2, 5, 8, -0.5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = WHITE; ctx.fillRect(-12, 10, 24, 6); ctx.strokeRect(-12, 10, 24, 6); ctx.restore();
  ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x - 34, fy - 70, 68, 6); ctx.strokeRect(x - 34, fy - 70, 68, 6);
  if (near(e) && !R.won) K.hint(e, ctx, x, fy - 140, R.carry != null ? 'THROW: HAND IT OVER' : 'BRING THE FROSTY ONE');
  ctx.restore();
};

/* ================= shadFish: PRINT RUN (the cut-out workshop) ================= */
const FISH_X = [5, 8, 11, 14];
TourRooms.def('shadFish', {
  title: 'PRINT RUN', rule: 'LIFT THE FISH WHOSE SCALES POINT TO ITS HEAD', need: 'LIFT OUT THE ODD FISH FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { cageX: 16, roof: [1, 3, 1] });
    FISH_X.forEach((x, k) => g.spawn(x, Y, 'shadRoomProp', { role: 'fish', k, w: 2, h: 4 }));
    g.winSpot(A.id, FISH_X[2], Y);
    return g;
  },
  deal(R) { R.odd = pick(FISH_X.length, R.odd); R.face = FISH_X.map(() => Math.random() < 0.5 ? 1 : -1); },
  enter(play, A, R) { if (R.odd == null) { R.round = 0; this.deal(R); } R.cool = 0; },
  update(play, dt, A, R) {
    if (R.cool > 0) R.cool -= dt; if (R.won) return;
    const e = pressed(play, 'fish'); if (!e || R.cool > 0) return; R.cool = 0.4;
    if (e.k === R.odd) { R.round++; R.lift = { k: e.k, t: 0 }; if (R.round >= 2) TourRooms.win(play, A, R, { text: 'OUT OF THE PRINT RUN!', coins: 3 }); else { good(play, 'THAT\'S THE ODD ONE! NEXT SHEET'); this.deal(R); } }
    else fail(play, 'ITS SCALES POINT TO ITS TAIL');
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'ODD FISH OUT' : 'FOUND ' + (R.round || 0) + ' / 2', 100); }
});
DRAW.fish = (ctx, e, R) => {
  if (!R.face) return;
  const x = e.cx, fy = F * TS, t = e.t, d = R.face[e.k], y = 3.6 * TS + Math.sin(t * 2 + e.k) * 2, odd = R.odd === e.k && !R.won;
  ctx.save();
  // its peg on the line
  ctx.strokeStyle = 'rgba(255,253,242,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 40, 2.3 * TS); ctx.lineTo(x + 40, 2.3 * TS); ctx.stroke();
  ctx.fillStyle = '#d8b88a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.fillRect(x - 3, 2.3 * TS - 6, 6, 14); ctx.strokeRect(x - 3, 2.3 * TS - 6, 6, 14);
  // the paper fish: a grape shadow cut-out with its notch, an eye hole, scales as butter chevrons
  ctx.translate(x, y); ctx.scale(d, 1);
  ctx.fillStyle = GRA; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(26, 0); ctx.quadraticCurveTo(12, -18, -14, -6); ctx.lineTo(-28, -16); ctx.lineTo(-24, 0); ctx.lineTo(-28, 16); ctx.lineTo(-14, 6); ctx.quadraticCurveTo(12, 18, 26, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  SA.notch(ctx, 4, -11, 0.7, 0, '#3a2a4a');
  ctx.fillStyle = BUT_HI; ctx.beginPath(); ctx.arc(16, -3, 3, 0, TAU); ctx.fill();
  ctx.strokeStyle = BUT; ctx.lineWidth = 2; const s = odd ? 1 : -1;   // chevrons: pointing to the tail (-) or the head (+)
  for (const cx of [-6, 2]) for (const cy of [-4, 4]) { ctx.beginPath(); ctx.moveTo(cx - 3 * s, cy - 4); ctx.lineTo(cx + 3 * s, cy); ctx.lineTo(cx - 3 * s, cy + 4); ctx.stroke(); }
  ctx.restore();
  markAt(ctx, x, fy, near(e));
  if (near(e) && !R.won) K.hint(e, ctx, x, fy - 60, 'THROW: LIFT IT OUT');
};

/* the room test's scripted wins (tools/sbw_rooms_test.js calls K.testWin(g, A, R, kit, frame) for a kind it has no
   script for): each plays its game through the room's own entities with the buttons a player uses */
const steps = (g, frame, n, keys) => { for (let k = 0; k < n; k++) frame(g, keys || {}); };
const stand = (g, tx) => { const p = g.player; p.x = tx * TS + TS / 2 - p.w / 2; p.y = F * TS - p.h; p.vx = p.vy = 0; };
const press = (g, frame) => { frame(g, { action: true, actionPressed: true }); steps(g, frame, 10); };
const until = (g, frame, fn, sec) => { for (let k = 0; k < 120 * (sec || 10) && !fn(); k++) frame(g, {}); };
TourRooms.kinds.shadBeat.testWin = function (g, A, R, kit, frame) {
  stand(g, BELL_X); steps(g, frame, 10);
  const Kd = TourRooms.kinds.shadBeat;
  until(g, frame, () => !R.demo && !R.sent, 20);
  // a miss: ring on bulb 1, then the win on bulb 5
  until(g, frame, () => Kd.beat(R) === 0 && (R.clock / BEAT) % 1 < 0.3, 10); press(g, frame); until(g, frame, () => !R.sent, 10);
  until(g, frame, () => Kd.beat(R) === WIN_START && (R.clock / BEAT) % 1 < 0.3, 10); press(g, frame); until(g, frame, () => R.won, 6);
};
TourRooms.kinds.shadWindow.testWin = function (g, A, R, kit, frame) {
  stand(g, WIN_X[(R.odd + 1) % WIN_X.length]); steps(g, frame, 8); press(g, frame);
  for (let k = 0; k < 3 && !R.won; k++) { stand(g, WIN_X[R.odd]); steps(g, frame, 8); press(g, frame); steps(g, frame, 40); }
};
TourRooms.kinds.shadFoot.testWin = function (g, A, R, kit, frame) {
  stand(g, CUB_X[(R.map[R.odd] + 1) % 4]); steps(g, frame, 8); press(g, frame);
  for (let k = 0; k < 3 && !R.won; k++) { stand(g, CUB_X[R.map[R.odd]]); steps(g, frame, 8); press(g, frame); steps(g, frame, 40); }
};
TourRooms.kinds.shadCup.testWin = function (g, A, R, kit, frame) {
  const carry = k => { stand(g, POT_X[k]); steps(g, frame, 8); press(g, frame); stand(g, HATCH_X); steps(g, frame, 8); press(g, frame); steps(g, frame, 30); };
  carry((R.cold + 1) % 3);
  for (let k = 0; k < 3 && !R.won; k++) carry(R.cold);
};
TourRooms.kinds.shadFish.testWin = function (g, A, R, kit, frame) {
  stand(g, FISH_X[(R.odd + 1) % FISH_X.length]); steps(g, frame, 8); press(g, frame);
  for (let k = 0; k < 3 && !R.won; k++) { stand(g, FISH_X[R.odd]); steps(g, frame, 8); press(g, frame); steps(g, frame, 40); }
};
// title first, then the rule: the kit toasts the rule as the banner shows; ours waits for the banner to go
for (const k of ['shadBeat', 'shadWindow', 'shadFoot', 'shadCup', 'shadFish']) {
  const Kd = TourRooms.kinds[k], e0 = Kd.enter, u0 = Kd.update;
  Kd.enter = function (play, A, R, kit) { play.toastT = 0; R.ruleAt = true; if (e0) return e0.apply(this, arguments); };
  Kd.update = function (play, dt, A, R, kit) { if (R.ruleAt && !(play.bannerT > 0)) { R.ruleAt = false; if (!R.won) { play.toast(kit.rule); play.toastT = 4; } } if (u0) return u0.apply(this, arguments); };
}
Tour.shadKit.ROOMS = { BEAT, MITTS, BELL_X, WIN_START, WIN_X, CUB_X, POT_X, HATCH_X, FISH_X };
})();
