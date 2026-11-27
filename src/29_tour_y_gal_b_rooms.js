/* ============================================================
   THE UNFLATTERING GALLERY: the secret rooms (world 30), one per stage: B21 to B25 of the relay
   (docs/design/CHATGPT_RELAY.md §B) re-skinned for the gallery, and the sixth stage's own room from §F. Each a different
   game in a different place, with its own floor, walls and arrangement of door, game and cage:
     galSteps   30-1 THREE STEPS SHORT  the pigeon loft: a toy pigeon walks a row of six slabs, one or two per hop on
                                        the 1 and 2 pads, exactly three hops, and never onto the wet-varnish slab
     galNest    30-2 SEAT THE FRAMES    the framer's workshop: three frames that fit one inside the next: pick them
                                        outside-in (THROW at each easel), twice
     galQueue   30-3 THE POLITE QUEUE   the cloakroom: three critters each picture whose back they want to stand behind
                                        (the leader: the empty doorway): THROW between two to swap them, three swaps
     galChange  30-4 SHORT CHANGE       the paint store: pour exactly two pots (1, 2 or 4 dabs) to fill the palette's
                                        wells, twice
     galSold    30-5 SOLD CORNERS       the catalogue press: a page rocks under the SOLD stamp: THROW when a blank
                                        corner is right under it, one in each corner
     galEyes    30-6 EYES FRONT         the private collection: two portraits' pupils follow Brady; stand where both
                                        gaze lines fall on the same vase and THROW to strike a pose
   Every room fits one landscape phone view, shows its rule in motion as Brady comes in, opens its prize cage the
   moment it is won, and a miss only restarts the turn. Each room's door out leads further along the stage.
   ============================================================ */
(function () {
if (typeof TourRooms === 'undefined') return;
const K = Tour.galKit, INK = K.INK, GA = K.GalArt, RK = TourRoomKit;
const AUB = K.AUB, MUS = K.MUS, MUS_HI = K.MUS_HI, BLUE = K.BLUE, BLUE_LO = K.BLUE_LO, WHITE = K.WHITE, CHALK = K.CHALK;
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
// a small word on its own dark pill (labels inside a room's picture)
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
    if (A && A.gal && A.gal.room) { this.camX = clamp(11.5 * TS - Game.viewW / 2, 0, Math.max(0, A.W * TS - Game.viewW)); this.camY = clamp(1 * TS, 0, Math.max(0, A.H * TS - Game.viewH)); }
    return r;
  };
  const ct0 = Play.prototype.camTargetY;
  Play.prototype.camTargetY = function (snap) { const A = this.area; if (A && A.gal && A.gal.room) return clamp(1 * TS, 0, Math.max(0, A.H * TS - Game.viewH)); return ct0.call(this, snap); };
}
// a room prop: drawn by its role; the THROW ones claim the button while Brady touches them
class GalRoomProp extends Ent {
  constructor(g, s) { super(g, s, (s.w || 1) * TS, (s.h || 2) * TS); this.x = s.x - this.w / 2; this.y = s.y - this.h; this.friendly = true; this.role = s.role; this.k = s.k || 0; this.back = true; this.claims = ['easel', 'swap', 'pot', 'press', 'pose'].indexOf(s.role) >= 0; }
  galClaim(p) { return !!this.claims && overlap(p, { x: this.x - 6, y: this.y, w: this.w + 12, h: this.h + 4 }); }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) { const R = this.g.area && this.g.area.roomState; const D = DRAW[this.role]; if (D) D(ctx, this, R || {}); }
}
ENTITY_TYPES.galRoomProp = GalRoomProp;
const DRAW = {};
// a real landing: back on the ground after a moment in the air (a placed or teleported Brady never counts)
const landed = (play, R) => { const p = play.player; if (!p.onGround) R.airN = (R.airN || 0) + 1; const l = p.onGround && !R.wasG && R.airN > 8; if (p.onGround) R.airN = 0; R.wasG = p.onGround; return l; };
const padAt = (play, xs) => { const p = play.player; return xs.findIndex(x => Math.abs(p.cx - (x * TS + TS / 2)) < TS * 0.9); };
const pressed = (play, role) => { const I = play.galIn; return I && I.pressed && I.by instanceof GalRoomProp && I.by.role === role ? I.by : null; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ================= galSteps: THREE STEPS SHORT (the pigeon loft) ================= */
const STEP_PADS = [5, 8], SLAB0 = 10, WET = 3, GOAL = 5;
TourRooms.def('galSteps', {
  title: 'THREE STEPS SHORT', rule: 'THREE HOPS TO THE CRUMB. NOT THE WET SLAB', need: 'WALK THE PIGEON FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { cageX: 18 });
    STEP_PADS.forEach((x, k) => g.spawn(x, Y, 'galRoomProp', { role: 'stepPad', k, w: 2, h: 1 }));
    g.spawn(SLAB0 + 3, Y, 'galRoomProp', { role: 'slabs', w: 6, h: 2 });
    g.winSpot(A.id, STEP_PADS[1], Y);
    return g;
  },
  enter(play, A, R) { R.pos = 0; R.taps = 0; R.anim = 0; R.demo = 0; },
  update(play, dt, A, R) {
    if (R.won) return;
    R.demo += dt; if (R.anim > 0) R.anim -= dt;
    if (!landed(play, R)) return;
    const i = padAt(play, STEP_PADS); if (i < 0 || R.anim > 0) return;
    R.from = R.pos; R.pos += i + 1; R.taps++; R.anim = 0.4; TourKit.sfx('hop', 'jump', { vol: 0.3, pitch: 1.6 });
    if (R.pos === WET) { fail(play, 'STUCK IN WET VARNISH! AGAIN'); R.pos = 0; R.taps = 0; return; }
    if (R.pos > GOAL) { fail(play, 'TOO FAR! BACK TO THE START'); R.pos = 0; R.taps = 0; return; }
    if (R.taps >= 3) { if (R.pos === GOAL) TourRooms.win(play, A, R, { text: 'CRUMB! THREE HOPS EXACTLY', coins: 3 }); else { fail(play, 'THREE HOPS, NOT THERE YET. AGAIN'); R.pos = 0; R.taps = 0; } }
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'WELL HOPPED' : 'HOPS ' + (R.taps || 0) + ' / 3', 100); }
});
DRAW.stepPad = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h, n = e.k + 1;
  ctx.save(); ctx.fillStyle = MUS; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 3, 24, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = AUB; ctx.font = '18px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText(String(n), x, y - 16);
  for (let k = 0; k < n; k++) { ctx.fillStyle = WHITE; ctx.beginPath(); ctx.ellipse(x - 8 + k * 16 - (n - 1) * 0 , y - 38, 5, 3, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
DRAW.slabs = (ctx, e, R) => {
  const y = e.y + e.h, x0 = SLAB0 * TS, t = e.t;
  ctx.save();
  for (let k = 0; k <= GOAL; k++) {
    const x = x0 + k * TS; ctx.fillStyle = k === WET ? MUS : k % 2 ? '#c8b8a0' : '#d8c8b0'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.fillRect(x + 1, y - 8, TS - 2, 8); ctx.strokeRect(x + 1, y - 8, TS - 2, 8);
    if (k === WET) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x + 6, y - 7, 10, 2); ctx.fillStyle = WHITE; ctx.font = '8px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('WET', x + TS / 2, y - 12); }
    ctx.fillStyle = 'rgba(28,20,38,0.6)'; ctx.font = '9px ' + FONT_DISPLAY; ctx.textAlign = 'center'; if (k !== WET) ctx.fillText(String(k), x + TS / 2, y - 12);
  }
  // the crumb on the last slab
  ctx.fillStyle = '#e8c890'; ctx.beginPath(); ctx.ellipse(x0 + GOAL * TS + TS / 2, y - 12, 6, 4, 0.3, 0, TAU); ctx.fill(); ctx.stroke();
  // the toy pigeon on wheels: hops from slab to slab (before the first hop it shows the rule: a demo hop)
  let pos = R.pos || 0, hopK = 0;
  if (R.anim > 0) { hopK = 1 - R.anim / 0.4; pos = lerp(R.from || 0, R.pos, hopK); }
  else if (!R.won && (R.taps || 0) === 0 && R.demo < 2.4) { const k = (R.demo % 1.2) / 1.2; pos = k * 2; hopK = (k * 2) % 1; }
  const px = x0 + pos * TS + TS / 2, py = y - 10 - Math.sin(hopK * Math.PI) * 26;
  ctx.save(); ctx.translate(px, py); ctx.scale(0.8, 0.8); Tour.countries.gal && (Tour.countries.gal.enemies ? 0 : 0);
  ctx.fillStyle = BLUE; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -10, 12, 9, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(8, -22, 6, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = MUS; ctx.beginPath(); ctx.moveTo(13, -23); ctx.lineTo(19, -21); ctx.lineTo(13, -19); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(9, -23, 1.4, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5a4a3a'; for (const dx of [-6, 6]) { ctx.beginPath(); ctx.arc(dx, 0, 3, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.restore();
};

/* ================= galNest: SEAT THE FRAMES (the framer's workshop) ================= */
const NEST_X = [7, 11, 15];
TourRooms.def('galNest', {
  title: 'SEAT THE FRAMES', rule: 'BIGGEST FIRST: THROW AT EACH EASEL', need: 'NEST THE FRAMES FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { doorRight: true, cageLeft: true, plinth: true, cageH: 3 });
    NEST_X.forEach((x, k) => g.spawn(x, Y, 'galRoomProp', { role: 'easel', k, w: 2, h: 3 }));
    g.spawn(11, 2, 'galRoomProp', { role: 'nestRack', w: 4, h: 1 });
    g.winSpot(A.id, NEST_X[1], Y);
    return g;
  },
  enter(play, A, R) { R.round = R.round || 0; this.deal(R); },
  deal(R) { R.sizes = shuffle([0, 1, 2]); R.next = 2; R.got = []; },
  update(play, dt, A, R) {
    if (R.won) return;
    const e = pressed(play, 'easel'); if (!e) return;
    const sz = R.sizes[e.k]; if (R.got.indexOf(sz) >= 0) return;
    if (sz !== R.next) { fail(play, 'CLATTER! THE BIG ONE GOES FIRST'); R.got = []; R.next = 2; return; }
    R.got.push(sz); R.next--; TourKit.sfx('clack', 'select', { vol: 0.4, pitch: 1 + sz * 0.2 });
    if (R.next < 0) { R.round++; if (R.round >= 2) TourRooms.win(play, A, R, { text: 'SEATED! EVERY FRAME', coins: 3 }); else { good(play, 'NESTED! ONCE MORE'); this.deal(R); } }
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'ALL SEATED' : 'ROUND ' + Math.min(2, (R.round || 0) + 1) + ' / 2', 100); }
});
const nestSize = s => 20 + s * 13;
DRAW.easel = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h, sz = R.sizes ? R.sizes[e.k] : e.k, gone = R.got && R.got.indexOf(sz) >= 0;
  ctx.save(); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x, y - 70); ctx.lineTo(x + 14, y); ctx.stroke();
  ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x - 20, y - 30, 40, 4);
  if (!gone) { const s = nestSize(sz); GA.frame(ctx, x - s / 2, y - 30 - s, s, s, null, { b: 4 + sz, ground: '#e8dcc0' }); }
  const I = e.g.galIn; if (I && I.by === e && !R.won) K.hint(e, ctx, x, e.y - 30, 'THROW: PICK');
  ctx.restore();
};
DRAW.nestRack = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h + 20;
  ctx.save(); ctx.fillStyle = '#5a3a2a'; ctx.fillRect(x - 60, y, 120, 6);
  // the nest so far (the rule in motion on the way in: the three frames drop in, biggest first)
  const got = R.got || [], demo = !R.won && got.length === 0 && (R.t || 0) < 3, n = demo ? Math.floor(((R.t || 0) % 3) / 0.8) : got.length;
  for (let q = 0; q < Math.min(3, n); q++) { const s = nestSize(2 - q); GA.frame(ctx, x - s / 2, y - s, s, s, null, { b: 4 + (2 - q), ground: 'rgba(0,0,0,0)' }); }
  ctx.restore();
};

/* ================= galQueue: THE POLITE QUEUE (the cloakroom) ================= */
const Q_X = [8, 12, 16], SWAP_X = [10, 14];
TourRooms.def('galQueue', {
  title: 'THE POLITE QUEUE', rule: 'THROW BETWEEN TWO TO SWAP THEM', need: 'SORT THE QUEUE FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { cageX: 18, roof: 1 });
    Q_X.forEach((x, k) => g.spawn(x, Y, 'galRoomProp', { role: 'queuer', k, w: 2, h: 2 }));
    SWAP_X.forEach((x, k) => g.spawn(x, Y, 'galRoomProp', { role: 'swap', k, w: 1, h: 2 }));
    g.spawn(Q_X[0] - 3, Y, 'galRoomProp', { role: 'doorway', w: 2, h: 3 });
    g.winSpot(A.id, SWAP_X[0], Y);
    return g;
  },
  enter(play, A, R) {
    // who wants whom: a fixed wish list (0 wants the doorway, 1 wants 0's back, 2 wants 1's back); the queue starts
    // muddled (never already sorted)
    if (!R.start) { let q; do q = shuffle([0, 1, 2]); while (q.join() === '0,1,2'); R.start = q; }
    R.q = R.start.slice(); R.swaps = 0;
  },
  update(play, dt, A, R) {
    if (R.won) return;
    const e = pressed(play, 'swap'); if (!e) return;
    const i = e.k; [R.q[i], R.q[i + 1]] = [R.q[i + 1], R.q[i]]; R.swaps++; R.swapT = 0.3; R.swapK = i; TourKit.sfx('swap', 'select', { vol: 0.4, pitch: 1.2 });
    if (R.q.join() === '0,1,2') { TourRooms.win(play, A, R, { text: 'NOBODY IS TUTTING!', coins: 3 }); return; }
    if (R.swaps >= 3) { fail(play, 'TUT TUT TUT! BACK TO THE START'); R.q = R.start.slice(); R.swaps = 0; }
  },
  draw(play, ctx, A, R) { if (R.swapT > 0) R.swapT -= 1 / 60; hud(play, ctx, R.won ? 'A POLITE QUEUE' : 'SWAPS ' + (R.swaps || 0) + ' / 3', 100); }
});
const critter = (ctx, who, x, y, t, dir) => {
  const C = Tour.countries.gal, E = C && C.enemies, art = [Tour.galKit.gnatArt, null, null][who];
  ctx.save();
  if (who === 0) { ctx.translate(x, y - 22); Tour.galKit.gnatArt(ctx, { dir, gst: 'fly' }, 0, 0, 'fly', t); }
  else {
    const T0 = who === 1 ? ENTITY_TYPES.galPigeon : ENTITY_TYPES.galVarnish, cfg = T0 && T0.cfg;
    if (cfg) cfg.art(ctx, { dir, state: 'walk', tst: 'wait' }, x, y, 'idle', t);
  }
  ctx.restore();
};
DRAW.queuer = (ctx, e, R) => {
  if (!R.q) return;
  const who = R.q[e.k], x = e.cx, y = e.y + e.h, t = e.t;
  critter(ctx, who, x, y, t, -1);
  // the thought bubble: who it wants in front of it (a little picture of that one's tail); the leader wants the door
  const want = who - 1, ok = e.k === 0 ? who === 0 : R.q[e.k - 1] === want;
  ctx.save(); ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y - 62, 15, 12, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x - 4, y - 46, 3, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(x, y - 58); ctx.scale(0.5, 0.5);
  if (want < 0) { ctx.fillStyle = AUB; ctx.fillRect(-10, -26, 20, 26); ctx.strokeRect(-10, -26, 20, 26); ctx.fillStyle = '#ffe8a0'; ctx.fillRect(-6, -22, 12, 22); }
  else critter(ctx, want, 0, 6, 0, -1);
  ctx.restore();
  if (!ok && !R.won) tag(ctx, x + 24, y - 76 + Math.sin(t * 8) * 2, 'TUT!', '#ffb0a0', 11);
  else { ctx.fillStyle = '#7aff9a'; ctx.font = '11px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('♥', x + 17, y - 70); }
  ctx.restore();
};
DRAW.swap = (ctx, e, R) => { const x = e.cx, y = e.y + e.h; ctx.save(); ctx.fillStyle = MUS; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 3, 14, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = AUB; ctx.font = '12px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('⇄', x, y - 12); const I = e.g.galIn; if (I && I.by === e && !R.won) K.hint(e, ctx, x, e.y - 34, 'THROW: SWAP'); ctx.restore(); };
DRAW.doorway = (ctx, e) => { const x = e.cx, y = e.y + e.h; ctx.save(); ctx.fillStyle = AUB; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, x - 18, y - 78, 36, 78, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffe8a0'; ctx.fillRect(x - 12, y - 70, 24, 70); tag(ctx, x, y - 90, 'OPENING', '#ffe08a', 10); ctx.restore(); };

/* ================= galChange: SHORT CHANGE (the paint store) ================= */
const POT_X = [7, 11, 15], POTS = [1, 2, 4], WELLS = [6, 5];
TourRooms.def('galChange', {
  title: 'SHORT CHANGE', rule: 'TWO POTS FILL THE PALETTE. NO MORE', need: 'FILL THE PALETTE FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { doorRight: true, cageLeft: true });
    POT_X.forEach((x, k) => g.spawn(x, Y, 'galRoomProp', { role: 'pot', k, w: 2, h: 2 }));
    g.spawn(11, 3, 'galRoomProp', { role: 'palette', w: 6, h: 1 });
    g.winSpot(A.id, POT_X[1], Y);
    return g;
  },
  enter(play, A, R) { R.round = R.round || 0; R.used = []; R.fill = 0; },
  update(play, dt, A, R) {
    if (R.won) return;
    const e = pressed(play, 'pot'); if (!e || R.used.indexOf(e.k) >= 0) return;
    R.used.push(e.k); R.fill += POTS[e.k]; TourKit.sfx('pour', 'select', { vol: 0.4, pitch: 0.8 + e.k * 0.2 });
    const need = WELLS[R.round];
    if (R.used.length < 2) { if (R.fill >= need) { fail(play, 'SPILT! TWO POTS, EXACTLY'); R.used = []; R.fill = 0; } return; }
    if (R.fill === need) { R.round++; if (R.round >= 2) TourRooms.win(play, A, R, { text: 'EVERY WELL, NOT A DROP OVER', coins: 3 }); else { good(play, 'FULL! NOW FIVE WELLS'); R.used = []; R.fill = 0; } }
    else { fail(play, R.fill > need ? 'SPILT! TOO MUCH' : 'SHORT! NOT ENOUGH'); R.used = []; R.fill = 0; }
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'FULL PALETTE' : 'POTS ' + (R.used ? R.used.length : 0) + ' / 2', 100); }
});
DRAW.pot = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h, n = POTS[e.k], used = R.used && R.used.indexOf(e.k) >= 0;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = used ? '#8a8a8a' : ['#c84a3a', '#3a6ac8', '#4a9a5a'][e.k];
  rr(ctx, x - 14, y - 34, 28, 34, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(x - 16, y - 38, 32, 6); ctx.strokeRect(x - 16, y - 38, 32, 6);
  ctx.fillStyle = WHITE; for (let k = 0; k < n; k++) { ctx.beginPath(); ctx.arc(x - 9 + (k % 2) * 18 * (n > 1 ? 1 : 0) + (n === 1 ? 9 : 0), y - 26 + Math.floor(k / 2) * 12, 4, 0, TAU); ctx.fill(); ctx.stroke(); }
  const I = e.g.galIn; if (I && I.by === e && !R.won && !used) K.hint(e, ctx, x, e.y - 30, 'THROW: POUR ' + n);
  ctx.restore();
};
DRAW.palette = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h, need = WELLS[Math.min(1, R.round || 0)], fill = R.won ? need : R.fill || 0, t = e.t;
  // on the way in the palette fills and empties by itself (the rule in motion)
  const demo = !R.won && !(R.used && R.used.length) && (R.t || 0) < 3.4 ? Math.min(need, Math.floor(((R.t || 0) % 1.7) / 0.25)) : fill;
  ctx.save(); ctx.fillStyle = '#d8b890'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, 96, 30, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8d8c0'; ctx.beginPath(); ctx.ellipse(x + 70, y + 8, 10, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
  for (let k = 0; k < need; k++) { const wx = x - 66 + k * 24, wy = y - 4 + (k % 2) * 8; ctx.fillStyle = k < demo ? ['#c84a3a', '#3a6ac8', '#4a9a5a', '#e8c83a', '#8a4ac8', '#e87a3a'][k] : '#8a6a4a'; ctx.beginPath(); ctx.ellipse(wx, wy, 9, 7, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};

/* ================= galSold: SOLD CORNERS (the catalogue press) ================= */
const PRESS_X = 11;
TourRooms.def('galSold', {
  title: 'SOLD CORNERS', rule: 'THROW WHEN A BLANK CORNER IS UNDER THE STAMP', need: 'STAMP BOTH CORNERS FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { cageX: 18 });
    g.spawn(PRESS_X, Y, 'galRoomProp', { role: 'press', w: 2, h: 2 });
    g.spawn(PRESS_X, 4, 'galRoomProp', { role: 'page', w: 8, h: 1 });
    g.winSpot(A.id, PRESS_X, Y);
    return g;
  },
  enter(play, A, R) { R.a = 0; R.marks = []; R.cool = 0; },
  pageX(R) { return Math.sin(R.a) * 70; },
  update(play, dt, A, R) {
    R.a = (R.a || 0) + dt * 1.6; if (R.cool > 0) R.cool -= dt;
    if (R.won) return;
    const e = pressed(play, 'press'); if (!e || R.cool > 0) return;
    R.cool = 0.5; const px = this.pageX(R); TourKit.sfx('stamp', 'stomp', { vol: 0.5, pitch: 1.1 });
    // the corners are 56 px either side of the page's middle: the stamp lands at the press's x
    const c = [-56, 56].findIndex(cx => Math.abs(px + cx) < 10);
    if (c < 0 || R.marks.indexOf(c) >= 0) { fail(play, 'SMUDGED! A FRESH PAGE'); R.marks = []; R.smudge = -px; return; }
    R.marks.push(c);
    if (R.marks.length >= 2) TourRooms.win(play, A, R, { text: 'SOLD! BOTH CORNERS', coins: 3 }); else good(play, 'SOLD! NOW THE OTHER CORNER');
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'SOLD, SOLD' : 'CORNERS ' + ((R.marks && R.marks.length) || 0) + ' / 2', 100); }
});
DRAW.page = (ctx, e, R) => {
  const K2 = TourRooms.kinds.galSold, px = e.cx + (R.a != null ? K2.pageX(R) : 0), y = e.y + e.h + 14;
  ctx.save(); ctx.fillStyle = '#f2ecdc'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(px - 80, y - 22, 160, 44); ctx.strokeRect(px - 80, y - 22, 160, 44);
  ctx.fillStyle = '#b8b0a0'; for (let k = 0; k < 4; k++) ctx.fillRect(px - 30, y - 14 + k * 8, 60 - k * 10, 3);
  for (const [k, cx] of [[0, -56], [1, 56]]) { const m = R.marks && R.marks.indexOf(k) >= 0; ctx.strokeStyle = m ? '#c83a3a' : BLUE_LO; ctx.lineWidth = 2; ctx.setLineDash(m ? [] : [4, 3]); ctx.strokeRect(px + cx - 14, y - 14, 28, 28); ctx.setLineDash([]); if (m) { ctx.fillStyle = '#c83a3a'; ctx.font = '8px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('SOLD', px + cx, y + 3); } }
  if (R.smudge != null && !(R.marks && R.marks.length)) { ctx.fillStyle = 'rgba(200,58,58,0.35)'; ctx.beginPath(); ctx.arc(px + R.smudge, y, 12, 0, TAU); ctx.fill(); }
  ctx.restore();
};
DRAW.press = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h, down = R.cool > 0.3 ? 1 : 0, top = e.y - 3.2 * TS;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = '#5a6070'; ctx.fillRect(x - 6, top - 20, 12, 30); ctx.strokeRect(x - 6, top - 20, 12, 30);
  ctx.fillStyle = '#c83a3a'; rr(ctx, x - 16, top + 8 + down * 12, 32, 14, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = WHITE; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('SOLD', x, top + 18 + down * 12);
  // the aim: a dashed line straight down to the page
  ctx.strokeStyle = 'rgba(255,240,160,0.8)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x, top + 24); ctx.lineTo(x, top + 50); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = MUS; ctx.strokeStyle = INK; ctx.beginPath(); ctx.ellipse(x, y - 3, 20, 6, 0, 0, TAU); ctx.fill(); ctx.stroke();
  const I = e.g.galIn; if (I && I.by === e && !R.won) K.hint(e, ctx, x + 60, y - 70, 'THROW: STAMP');
  ctx.restore();
};

/* ================= galEyes: EYES FRONT (the private collection) ================= */
// two portraits, the upper one's eyes at E1, the lower one's at E2; the gaze lines run from each eye through Brady's
// chest (his feet less 22 px) on to the floor. Both land on one spot only where his chest is on the line through both
// eyes: the vase there is the one.
const E1 = [6.5 * TS, 3.5 * TS], E2 = [9.5 * TS, 5.3 * TS], FLOOR = F * TS, CHEST = 22;
const landX = (E, hx) => E[0] + (hx - E[0]) * (FLOOR - E[1]) / (FLOOR - CHEST - E[1]);
// where the chest meets the eyes' line, and where that line meets the floor
const SOL_H = E2[0] + (E2[0] - E1[0]) * (FLOOR - CHEST - E2[1]) / (E2[1] - E1[1]), SOL_X = landX(E1, SOL_H);
const VASES = [SOL_X - 5 * TS, SOL_X - 2.5 * TS, SOL_X, SOL_X + 2.5 * TS].filter(x => x > 4 * TS && x < 19 * TS);
TourRooms.def('galEyes', {
  title: 'EYES FRONT', rule: 'BOTH GAZES ON ONE VASE. THEN THROW', need: 'STRIKE THE POSE FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { cageX: 16 });
    g.spawn(8, Y, 'galRoomProp', { role: 'eyes', w: 6, h: 6 });
    g.spawn(Math.floor(SOL_H / TS), Y, 'galRoomProp', { role: 'pose', w: 16, h: 2 });
    g.winSpot(A.id, Math.floor(SOL_H / TS), Y);
    return g;
  },
  enter(play, A, R) { R.cool = 0; },
  lands(play) { const p = play.player, hx = p.cx; return [landX(E1, hx), landX(E2, hx)]; },
  vaseOf(x) { return VASES.findIndex(v => Math.abs(x - v) < 16); },
  update(play, dt, A, R) {
    if (R.cool > 0) R.cool -= dt; if (R.won) return;
    const I = play.galIn; if (!I || !I.pressed || !(I.by instanceof GalRoomProp) || I.by.role !== 'pose' || R.cool > 0) return;
    R.cool = 0.4; const [a, b] = this.lands(play), va = this.vaseOf(a), vb = this.vaseOf(b);
    if (va >= 0 && va === vb) TourRooms.win(play, A, R, { text: 'WHAT A POSE! THEY BOTH ADMIRE THE VASE', coins: 3 });
    else fail(play, 'THEY\'RE LOOKING AT DIFFERENT THINGS');
  },
  draw(play, ctx, A, R) { hud(play, ctx, R.won ? 'EYES FRONT!' : 'FIND THE SPOT, THEN THROW', 100); }
});
DRAW.eyes = (ctx, e, R) => {
  const p = e.g.player, t = e.t, hx = p ? p.cx : SOL_H, hy = p ? p.y + p.h - CHEST : FLOOR - CHEST, Kd = TourRooms.kinds.galEyes;
  ctx.save();
  // the two portraits of Piwi (one high, one low), their pupils following Brady
  for (const [E, s] of [[E1, 1.05], [E2, 0.95]]) {
    const w = 26 * s + 18, h = 30 * s + 18;
    GA.frame(ctx, E[0] - w / 2, E[1] - h / 2 + 3 * s, w, h, (c, ix, iy, iw, ih) => { c.fillStyle = '#2a3a4a'; c.fillRect(ix, iy, iw, ih); GA.piwi(c, E[0], E[1] + 4 * s, s, t, { jaw: 3, look: clamp((hx - E[0]) / 120, -1, 1), lookY: 0.6 }); }, { b: 7 });
  }
  // the gaze lines: from each eye, through Brady's chest, on to the floor; where each lands, a powder-blue dot
  const [a, b] = p ? Kd.lands(e.g) : [SOL_X, SOL_X], va = Kd.vaseOf(a), vb = Kd.vaseOf(b), both = va >= 0 && va === vb;
  for (const [E, L] of [[E1, a], [E2, b]]) { ctx.strokeStyle = both ? MUS_HI : BLUE; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.lineDashOffset = -t * 12; ctx.beginPath(); ctx.moveTo(E[0], E[1]); ctx.lineTo(hx, hy); ctx.lineTo(L, FLOOR); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = both ? MUS_HI : BLUE; ctx.beginPath(); ctx.arc(L, FLOOR - 3, 4, 0, TAU); ctx.fill(); }
  // the vases
  VASES.forEach((vx, k) => { const lit = (k === va) + (k === vb); ctx.fillStyle = lit === 2 ? MUS_HI : lit ? '#d8e4f8' : CHALK; ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(vx - 6, FLOOR); ctx.quadraticCurveTo(vx - 13, FLOOR - 14, vx - 5, FLOOR - 24); ctx.lineTo(vx - 7, FLOOR - 30); ctx.lineTo(vx + 7, FLOOR - 30); ctx.lineTo(vx + 5, FLOOR - 24); ctx.quadraticCurveTo(vx + 13, FLOOR - 14, vx + 6, FLOOR); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = BLUE_LO; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(vx - 8, FLOOR - 14); ctx.lineTo(vx + 8, FLOOR - 14); ctx.stroke(); });
  ctx.restore();
};
DRAW.pose = () => {};

/* the room test's scripted wins (tools/sbw_rooms_test.js calls K.testWin(g, A, R, kit, frame) for a kind it has no
   script for): each plays its game through the room's own entities with the buttons a player uses */
const steps = (g, frame, n, keys) => { for (let k = 0; k < n; k++) frame(g, keys || {}); };
const stand = (g, tx) => { const p = g.player; p.x = tx * TS + TS / 2 - p.w / 2; p.y = F * TS - p.h; p.vx = p.vy = 0; };
const standPx = (g, x) => { const p = g.player; p.x = x - p.w / 2; p.y = F * TS - p.h; p.vx = p.vy = 0; };
const hop = (g, frame, tx) => { stand(g, tx); steps(g, frame, 20); frame(g, { jump: true, jumpPressed: true }); steps(g, frame, 30, { jump: true }); steps(g, frame, 60); };
const press = (g, frame) => { frame(g, { action: true, actionPressed: true }); steps(g, frame, 10); };
const until = (g, frame, fn, sec) => { for (let k = 0; k < 120 * (sec || 10) && !fn(); k++) frame(g, {}); };
TourRooms.kinds.galSteps.testWin = function (g, A, R, kit, frame) {
  // a miss first: 1 + 2 lands on the wet slab; then 2, 2, 1
  hop(g, frame, STEP_PADS[0]); hop(g, frame, STEP_PADS[1]);
  for (const k of [1, 1, 0]) hop(g, frame, STEP_PADS[k]);
};
TourRooms.kinds.galNest.testWin = function (g, A, R, kit, frame) {
  stand(g, NEST_X[R.sizes.indexOf(0)]); steps(g, frame, 10); press(g, frame);
  for (let round = 0; round < 3 && !R.won; round++) for (const sz of [2, 1, 0]) { stand(g, NEST_X[R.sizes.indexOf(sz)]); steps(g, frame, 10); press(g, frame); }
};
TourRooms.kinds.galQueue.testWin = function (g, A, R, kit, frame) {
  // a miss: three swaps of the same pair (never sorted: the start isn't sorted, and two swaps undo each other)
  for (let k = 0; k < 3; k++) { stand(g, SWAP_X[0]); steps(g, frame, 6); if (R.q && [R.q[1], R.q[0], R.q[2]].join() === '0,1,2' && k === 0) { stand(g, SWAP_X[1]); steps(g, frame, 6); } press(g, frame); }
  // then sort it: bubble the queue with adjacent swaps
  for (let k = 0; k < 6 && !R.won; k++) { const i = R.q[0] > R.q[1] ? 0 : 1; stand(g, SWAP_X[i]); steps(g, frame, 6); press(g, frame); }
};
TourRooms.kinds.galChange.testWin = function (g, A, R, kit, frame) {
  const pour = k => { stand(g, POT_X[k]); steps(g, frame, 8); press(g, frame); };
  pour(0); pour(1);            // 1 + 2 = 3 of 6: short
  pour(1); pour(2);            // 2 + 4 = 6
  pour(0); pour(2);            // 1 + 4 = 5
};
TourRooms.kinds.galSold.testWin = function (g, A, R, kit, frame) {
  const Kd = TourRooms.kinds.galSold;
  stand(g, PRESS_X); steps(g, frame, 8);
  until(g, frame, () => Math.abs(Kd.pageX(R)) < 3 && R.cool <= 0); press(g, frame);   // the page's middle: a smudge
  for (let k = 0; k < 120 * 20 && !R.won; k++) { const px = Kd.pageX(R); if (R.cool <= 0 && [-56, 56].some((cx, i) => Math.abs(px + cx) < 4 && R.marks.indexOf(i) < 0)) press(g, frame); else frame(g, {}); }
};
TourRooms.kinds.galEyes.testWin = function (g, A, R, kit, frame) {
  standPx(g, SOL_H + 3 * TS); steps(g, frame, 20); press(g, frame); steps(g, frame, 60);
  standPx(g, SOL_H); steps(g, frame, 20); press(g, frame); steps(g, frame, 20);
};
// title first, then the rule: the kit toasts the rule as the banner shows; ours waits for the banner to go
for (const k of ['galSteps', 'galNest', 'galQueue', 'galChange', 'galSold', 'galEyes']) {
  const Kd = TourRooms.kinds[k], e0 = Kd.enter, u0 = Kd.update;
  Kd.enter = function (play, A, R, kit) { play.toastT = 0; R.ruleAt = true; if (e0) return e0.apply(this, arguments); };
  Kd.update = function (play, dt, A, R, kit) { if (R.ruleAt && !(play.bannerT > 0)) { R.ruleAt = false; if (!R.won) { play.toast(kit.rule); play.toastT = 4; } } if (u0) return u0.apply(this, arguments); };
}
Tour.galKit.ROOMS = { STEP_PADS, NEST_X, Q_X, SWAP_X, POT_X, PRESS_X, SOL_H, VASES };
try { if (typeof window !== 'undefined') window.__roomKinds = TourRooms.kinds; } catch (e) { /* not in a browser */ }
})();
