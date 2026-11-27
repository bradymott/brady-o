/* ============================================================
   WRONG SIDE OF THE WASH: the six secret rooms (HIDDEN_LAND_BRIEF.md, CHATGPT_RELAY.md B1-B5 and section F's Sock
   Divorce). Each a 10-25 second game with a rule that reads in two seconds, played in one landscape view on a raised
   stage in the middle band (clear of the top bar, the stick and the buttons), each in its own place:
     washCups     26-1 THE BASKET STALL      CUP WITH A LIMP: the lost sock goes under the basket that rocks on a
                                             chipped foot; follow it through the shuffle, jump on it. Twice.
     washWindows  26-2 THE LAUNDERETTE       ROOM WITH A VIEW: three critters tumble past three portholes; when the
                                             doors shut, jump on their pictures in the order they came.
     washPegs     26-3 THE PEG LOFT          ONE MORE PETAL: the line snaps shut and opens with one new peg; jump
                                             under the new one. Three mornings running.
     washBag      26-4 LOST PROPERTY         STILL PACKED?: peek in the laundry bag; when it shuts, jump on the one
                                             thing on the shelf that was inside. Twice.
     washSeats    26-5 THE DRYING ROOM       YOUR SEAT, SIR: three moths settle on three cushions and fly up; each
                                             comes back to you in turn: jump on its own cushion.
     washDivorce  26-6 THE SOCK DRAWER       SOCK DIVORCE: hold THROW on a cuff and walk away until the damp socks peel
                                             apart, then let go before the sock stretches past its stitched toe mark.
   A miss resets that turn and costs nothing. A win opens the prize cage at once (29_tour_zz_lamps.js). The checker
   sees each game's spots as places Brady must reach (the room kit's needs and its win spot).
   The camera: a wash room shows the whole room in one landscape view (12 rows for a 26-wide room), fixed; the title
   first, then the rule, the counters in one spot under the HUD.
   ============================================================ */
(function () {
const WK = Tour.washKit, INK = WK.INK, WA = WK.WashArt;
const RK = () => TourRoomKit;
const STAGE = 9;            // the stage's top row (Brady stands on row 8)
const ON = STAGE - 1;       // the row things stand on, on the stage (their tops one-way: row ON, stood on from ON - 1)

/* ---------------- the frame: the whole room in one view, the words in turn ---------------- */
{
  const vr0 = Play.prototype.viewRows;
  Play.prototype.viewRows = function () {
    const A = this.area;
    if (A && A.roomKit && A.washRoom) { const gr = Game.gameRect; if (gr && gr.w > gr.h * 1.3) return Math.max(12, Math.min(A.H, A.W / (gr.w / gr.h))); return A.H; }
    return vr0.call(this);
  };
  TourHooks.on('camera', (play) => {
    const A = play.area; if (!(A && A.roomKit && A.washRoom)) return;
    play.camY = Math.max(0, A.H * TS - Game.viewH);
    const maxX = Math.max(0, A.W * TS - Game.viewW), p = play.player;
    play.camX = maxX <= 2 ? 0 : clamp((p ? p.cx : 0) - Game.viewW / 2, 0, maxX);
  });
  const en0 = TourRooms.enter;
  TourRooms.enter = function (play, A) {
    en0.apply(this, arguments);
    if (!A.washRoom) return;
    const R = this.state(play, A), rule = A.roomKit && A.roomKit.rule;
    if (rule && play.toastT > 0 && play.toastText === rule) { R.ruleQ = rule; play.toastT = 0; }
  };
  const up0 = TourRooms.update;
  TourRooms.update = function (play, dt) {
    const A = play.area;
    if (A && A.washRoom && A.roomKit) { const R = this.state(play, A); if (R.ruleQ && !(play.bannerT > 0.1)) { play.toast(R.ruleQ); R.ruleQ = null; } }
    return up0.apply(this, arguments);
  };
  // an area spec's `wash: { ... }` lands on the built area (washRoom: this room's framing)
  const gv0 = TourBuild.generateV2;
  TourBuild.generateV2 = function (Cc, spec) {
    const L = gv0.apply(this, arguments);
    if (Cc && Cc.id === 'wash' && L && spec && spec.areas) spec.areas.forEach((A, k) => { if (L.areas[k]) { if (A.wash) Object.assign(L.areas[k], A.wash); if (A.room && /^wash/.test(A.room)) L.areas[k].washRoom = true; } });
    return L;
  };
}
// the counters' one spot: under the HUD pills, top left
const hud = (play, ctx, str, i) => {
  const k = Game.viewH / Math.max(1, Game.gameRect ? Game.gameRect.h : Game.viewH);
  const x = play.camX + 18 * k, y = play.camY + (100 + (i || 0) * 36) * k;
  ctx.save(); ctx.font = `${Math.round(14 * k)}px ${FONT_DISPLAY}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(str).width + 24 * k, h = 26 * k;
  ctx.fillStyle = 'rgba(14,8,26,0.78)'; rr(ctx, x, y - h / 2, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,216,74,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#ffd84a'; ctx.fillText(str, x + 12 * k, y + 1);
  ctx.restore();
};
const winRoom = (play, A, R, opts) => { TourRooms.win(play, A, R, opts); for (const e of play.entities) if (e instanceof ENTITY_TYPES.roomCage) e.update(0); };
const shuffle = (rng, L) => { for (let k = L.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [L[k], L[j]] = [L[j], L[k]]; } return L; };
// Brady has just landed on one of the slot tops (row ON) at these columns: its index, or -1
const landedOn = (play, R, xs, ON) => {
  const p = play.player, g0 = R.wasG; R.wasG = p.onGround;
  if (!p.onGround || g0 || p.groundTy !== ON) return -1;
  return xs.findIndex(x => Math.abs(p.cx - (x * TS + TS / 2)) < TS * 0.7);
};
// the room shape, each room its own: the way in on the floor, a stage (solid, sh rows high, or a plank shelf on two
// posts) with the game's slots on it (one-way tops one row over the stage), the cage at the far end; mirror: the door
// on the right and the cage on the left. Returns { g, slots }; g.data.stage / g.data.on: the stage's top row and the
// row things stand on (the kinds read these)
function stageRoom(o, keep, A, n, gap, opts) {
  opts = opts || {};
  const Kt = RK(), W = opts.W || 26, g = Kt.room(W, 15, 11), sh = opts.sh || 2, STG = 11 - sh, ONR = STG - 1;
  const xa = g.west(keep);
  const x1 = Kt.east(g, keep, A, o);
  const s0 = xa + 1, s1 = x1;
  if (opts.shelf) { g.hline(s0, s1, STG, '-'); g.vline(s0 + 1, STG + 1, 10, 'H'); g.vline(s1 - 1, STG + 1, 10, 'H'); }
  else { g.fill(s0, STG, s1, 10, '#'); for (let k = 1; k < sh; k++) g.fill(xa - (sh - 1) + k, 11 - k, xa - (sh - 1) + k, 10, '#'); }
  const span = (n - 1) * gap, c0 = Math.round((s0 + 2 + s1 - 1 - span) / 2);
  const slots = []; for (let k = 0; k < n; k++) { const x = c0 + k * gap; slots.push(x); if (!opts.noTops) g.put(x, ONR, '-'); g.need('a slot of the game', x, ONR - 1); }
  g.winSpot(A.id, slots[0], opts.noTops ? ONR : ONR - 1);
  g.data.stage = STG; g.data.on = ONR;
  return { g, slots };
}
// a room built left to right, flipped (the door on the right, the cage on the left): rows, boxes, doors, needs, slots
function mirrorRoom(g, keys) {
  const W = g.W;
  g.g = g.g.map(r => r.slice().reverse());
  const flipKeys = M => { const o = {}; for (const k in M) { const [x, y] = k.split(',').map(Number); o[(W - 1 - x) + ',' + y] = M[k]; } return o; };
  g.boxes = flipKeys(g.boxes); g.doorsAt = flipKeys(g.doorsAt);
  for (const q of g.needs) q.x = W * TS - q.x - q.w;
  for (const k of keys || []) { const v = g.data[k]; if (Array.isArray(v)) g.data[k] = v.map(x => W - 1 - x); else if (typeof v === 'number') g.data[k] = W - 1 - v; }
  g.data.mirror = true;
  return g;
}
const ROOM_SEED = (play, A) => mulberry32(hashStr('wash:' + A.roomKit.aid + ':' + ((A.roomState && A.roomState.visits) || 0) + ':' + ((A.roomState && A.roomState.fails) || 0) + ':' + Math.floor(play.t * 7)));

/* ======================= B1 CUP WITH A LIMP (26-1): three laundry baskets ======================= */
TourRooms.def('washCups', {
  title: 'CUP WITH A LIMP', rule: 'THE SOCK IS UNDER THE BASKET WITH THE WOBBLY FOOT. FOLLOW IT, THEN JUMP ON IT. TWICE!', need: 'FIND THE SOCK FIRST!',
  make(o, keep, ctx, A, rng) { const S = stageRoom(o, keep, A, 3, 4); S.g.data.slots = S.slots; return S.g; },   // door left, cage right, a solid stage
  enter(play, A, R, kit) { if (!R.won) { R.round = 0; this.start(play, A, R); } },
  start(play, A, R) { R.phase = 'show'; R.pt = 0; R.at = [0, 1, 2]; R.sock = Math.floor(ROOM_SEED(play, A)() * 3); R.swaps = []; R.pick = -1; },
  update(play, dt, A, R, kit) { const ON = kit.data.on, STAGE = kit.data.stage;
    if (R.won) return;
    if (play.bannerT > 0.1 && R.phase === 'show') return;
    const xs = kit.data.slots;
    R.pt += dt;
    if (R.phase === 'show' && R.pt > 2.4) {
      // the shuffle: swaps of two baskets (they slide past each other), quicker in the second round
      const rng = ROOM_SEED(play, A), n = R.round ? 6 : 5; R.swaps = [];
      for (let k = 0; k < n; k++) { const a = Math.floor(rng() * 3), b = (a + 1 + Math.floor(rng() * 2)) % 3; R.swaps.push([a, b]); }
      R.phase = 'shuffle'; R.pt = 0; R.dur = R.round ? 0.5 : 0.62; R.si = 0;
    }
    if (R.phase === 'shuffle') {
      if (R.pt >= R.dur) { const [a, b] = R.swaps[R.si]; const ia = R.at.indexOf(a), ib = R.at.indexOf(b); R.at[ia] = b; R.at[ib] = a; R.si++; R.pt = 0; TourKit.sfx('swish', 'select', { vol: 0.25, pitch: 1.4 }); if (R.si >= R.swaps.length) { R.phase = 'pick'; R.pt = 0; R.wasG = play.player.onGround; } }
    }
    if (R.phase === 'pick') {
      const k = landedOn(play, R, xs, kit.data.on); if (k < 0) return;
      // basket R.at[k] stands at slot k
      R.pick = k; R.phase = 'reveal'; R.pt = 0; R.right = R.at[k] === R.sock;
      if (R.right) { Sound.play('coin', { vol: 0.6 }); Tour.washKit.say(play, xs[k] * TS + 16, ON * TS - 30, 'THE SOCK!', '#ffffff'); }
      else { R.fails = (R.fails || 0) + 1; RK().raspberry(play, 'A MOTH! TRY AGAIN'); }
    }
    if (R.phase === 'reveal' && R.pt > 1.1) {
      if (R.right) { R.round++; if (R.round >= 2) { winRoom(play, A, R, { text: 'A MATCHED PAIR!', coins: 6 }); return; } }
      this.start(play, A, R);
    }
  },
  // where each basket is drawn: at its slot, or sliding between two
  basketX(R, kit, b) {
    const xs = kit.data.slots, i = R.at.indexOf(b), x = xs[i] * TS + TS / 2;
    if (R.phase !== 'shuffle') return { x, lift: 0 };
    const [a, c] = R.swaps[R.si] || [0, 0]; if (b !== a && b !== c) return { x, lift: 0 };
    const o = b === a ? c : a, xo = xs[R.at.indexOf(o)] * TS + TS / 2, k = Math.min(1, R.pt / R.dur), e = k * k * (3 - 2 * k);
    return { x: lerp(x, xo, e), lift: (b === a ? -1 : 1) * Math.sin(k * Math.PI) * 14 };
  },
  draw(play, ctx, A, R, kit) { const ON = kit.data.on, STAGE = kit.data.stage;
    const t = play.t, y = ON * TS + TS;
    for (let b = 0; b < 3; b++) {
      const P = this.basketX(R, kit, b), up = R.phase === 'reveal' && R.at[R.pick] === b ? Math.min(1, R.pt * 4) * 30 : R.won ? 30 : 0;
      const limp = b === R.sock && (R.phase === 'show') ? Math.sin(t * 9) * 0.12 : 0;
      // under it: the sock (or, lifted wrong, a moth)
      if (up > 0) { if (b === R.sock) WA.sock(ctx, P.x - 4, y - 22, 0.7, WA.CREAM, WA.NAVY, false); else WK.mothArt(ctx, { dir: 1 }, P.x, y - 4, 'fly', t); }
      if (R.phase === 'show' && b === R.sock && R.pt < 1.2) { const k = Math.min(1, R.pt / 1.0); WA.sock(ctx, P.x - 4, y - 70 + k * 46, 0.7, WA.CREAM, WA.NAVY, false); }
      ctx.save(); ctx.translate(P.x, y - up + P.lift * 0); ctx.rotate(limp); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      // an upturned wicker basket; the limping one has a chipped foot
      ctx.fillStyle = '#c8a06a'; ctx.beginPath(); ctx.moveTo(-17, -32); ctx.lineTo(17, -32); ctx.lineTo(20, -4); ctx.lineTo(-20, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 6, -31); ctx.lineTo(k * 7, -5); ctx.stroke(); } for (const yy of [-24, -14]) { ctx.beginPath(); ctx.moveTo(-18, yy); ctx.lineTo(18, yy); ctx.stroke(); }
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#a87a4a';
      ctx.fillRect(-18, -4, 8, 4); ctx.strokeRect(-18, -4, 8, 4);
      if (b === R.sock && R.phase === 'show') { ctx.fillRect(10, -4, 8, 2); ctx.strokeRect(10, -4, 8, 2); } else { ctx.fillRect(10, -4, 8, 4); ctx.strokeRect(10, -4, 8, 4); }
      ctx.fillStyle = '#e8442e'; ctx.fillRect(-6, -36, 12, 4); ctx.strokeRect(-6, -36, 12, 4);
      ctx.restore();
    }
    if (!R.won && !(play.bannerT > 0.1)) hud(play, ctx, (R.phase === 'pick' ? 'WHICH ONE?  ' : R.phase === 'show' ? 'WATCH THE WOBBLE...  ' : 'FOLLOW IT...  ') + 'ROUND ' + (R.round + 1) + ' / 2', 0);
  },
  testWin(g, A, R, kit, frame) { const ON = kit.data.on, STAGE = kit.data.stage; for (let n = 0; n < 2 && !R.won; n++) { for (let k = 0; k < 2000 && R.phase !== 'pick'; k++) frame(g, {}); pickSlot(g, kit.data.slots[R.at.indexOf(R.sock)], frame, kit.data.on); for (let k = 0; k < 400 && R.phase !== 'show' && !R.won; k++) frame(g, {}); } }
});
// the rooms test (and the shots tool): land on a slot's top from just above it
function pickSlot(g, x, frame, on) { const p = g.player; p.x = x * TS + TS / 2 - p.w / 2; p.y = on * TS - p.h - 10; p.vx = 0; p.vy = 2 * TS; p.onGround = false; for (let k = 0; k < 60 && !p.onGround; k++) frame(g, {}); frame(g, {}); }

/* ======================= B2 ROOM WITH A VIEW (26-2): the launderette's portholes ======================= */
const RIDERS = [
  { name: 'LAMB', art: (c, x, y, t) => WK.lambArt(c, { dir: 1, fleece: 0.7 }, x, y, 'walk', t) },
  { name: 'BEETLE', art: (c, x, y, t) => WK.beetleArt(c, { dir: 1 }, x, y, 'walk', t) },
  { name: 'MOTH', art: (c, x, y, t) => WK.mothArt(c, { dir: 1 }, x, y - 12, 'fly', t) },
  { name: 'HERON', art: (c, x, y, t) => { c.save(); c.translate(x, y); c.scale(0.7, 0.7); WK.heronArt(c, { dir: 1 }, 0, 0, 'walk', t); c.restore(); } }
];
TourRooms.def('washWindows', {
  title: 'ROOM WITH A VIEW', rule: 'THREE TUMBLE PAST THE PORTHOLES. WHEN THE DOORS SHUT, JUMP ON THEIR PICTURES IN THE ORDER THEY CAME', need: 'REMEMBER THE ORDER FIRST!',
  make(o, keep, ctx, A, rng) { const S = stageRoom(o, keep, A, 4, 3, { sh: 1 }); S.g.data.slots = S.slots; return mirrorRoom(S.g, ['slots']); },   // door right, cage left, a low step of a stage
  enter(play, A, R, kit) { if (!R.won) this.start(play, A, R); },
  start(play, A, R) { const rng = ROOM_SEED(play, A); R.order = shuffle(rng, [0, 1, 2, 3]).slice(0, 3); R.pics = shuffle(rng, [0, 1, 2, 3]); R.phase = 'ride'; R.pt = 0; R.got = 0; R.wasG = true; },
  update(play, dt, A, R, kit) { const ON = kit.data.on, STAGE = kit.data.stage;
    if (R.won) return;
    if (play.bannerT > 0.1 && R.phase === 'ride') return;
    R.pt += dt;
    if (R.phase === 'ride' && R.pt > 1.0 + 3 * 1.3 + 0.6) { R.phase = 'pick'; R.pt = 0; R.wasG = play.player.onGround; TourKit.sfx('door', 'bump', { vol: 0.4 }); }
    if (R.phase === 'pick') {
      const k = landedOn(play, R, kit.data.slots, kit.data.on); if (k < 0) return;
      if (R.pics[k] === R.order[R.got]) { R.got++; Sound.play('pick', { vol: 0.6, pitch: 1 + R.got * 0.2 }); Tour.washKit.say(play, kit.data.slots[k] * TS + 16, ON * TS - 34, String(R.got), '#ffffff'); if (R.got >= 3) winRoom(play, A, R, { text: 'ALL ABOARD!', coins: 6 }); }
      else { R.fails = (R.fails || 0) + 1; RK().raspberry(play, 'NOT THAT ONE! WATCH AGAIN'); this.start(play, A, R); }
    }
  },
  draw(play, ctx, A, R, kit) { const ON = kit.data.on, STAGE = kit.data.stage;
    const t = play.t, xs = kit.data.slots, cx = (xs[0] + xs[3] + 1) / 2 * TS, wy = 3.4 * TS;
    // three portholes on the machines' front, side by side; the riders tumble past them left to right in turn
    const px = [cx - 3.2 * TS, cx, cx + 3.2 * TS], shut = R.phase === 'pick' || R.won;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.fillStyle = '#f4f4f0'; rr(ctx, cx - 5 * TS, wy - 1.6 * TS, 10 * TS, 3.2 * TS, 10); ctx.fill(); ctx.stroke();
    for (const x of px) { ctx.fillStyle = '#9ab8c8'; ctx.beginPath(); ctx.arc(x, wy, 1.2 * TS, 0, TAU); ctx.fill(); ctx.stroke(); }
    if (R.phase === 'ride') for (let i = 0; i < 3; i++) {
      const u = (R.pt - 0.6 - i * 1.3) / 1.6; if (u < 0 || u > 1) continue;
      const x = lerp(cx - 5.5 * TS, cx + 5.5 * TS, u);
      ctx.save(); ctx.beginPath(); for (const q of px) { ctx.moveTo(q + 1.1 * TS, wy); ctx.arc(q, wy, 1.1 * TS, 0, TAU); } ctx.clip();
      ctx.translate(x, wy + 14); ctx.rotate(Math.sin(t * 5 + i) * 0.4); RIDERS[R.order[i]].art(ctx, 0, 0, t); ctx.restore();
    }
    for (const x of px) {
      ctx.strokeStyle = '#c8ccd4'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, wy, 1.2 * TS, 0, TAU); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, wy, 1.32 * TS, 0, TAU); ctx.stroke();
      if (shut) { ctx.fillStyle = '#5a7a9a'; ctx.beginPath(); ctx.arc(x, wy, 1.1 * TS, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x - 10, wy - 10, 8, 0, TAU); ctx.fill(); }
    }
    // the pictures on the stage: one rider each, on little framed boards (their tops are what you land on)
    xs.forEach((x, k) => {
      const bx = x * TS + TS / 2, by = ON * TS + TS, hit = R.phase === 'pick' && R.got > 0 && R.order.slice(0, R.got).indexOf(R.pics[k]) >= 0;
      ctx.fillStyle = hit ? '#ffe8a0' : '#fff8ea'; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, bx - 15, by - 30, 30, 30, 4); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.translate(bx, by - 4); ctx.scale(0.62, 0.62); RIDERS[R.pics[k]].art(ctx, 0, 0, 0); ctx.restore();
    });
    ctx.restore();
    if (!R.won && !(play.bannerT > 0.1)) hud(play, ctx, R.phase === 'ride' ? 'WATCH WHO COMES FIRST...' : 'JUMP ON THEM IN ORDER  ' + R.got + ' / 3', 0);
  },
  testWin(g, A, R, kit, frame) { const ON = kit.data.on, STAGE = kit.data.stage; for (let k = 0; k < 2400 && R.phase !== 'pick'; k++) frame(g, {}); for (let i = 0; i < 3 && !R.won; i++) pickSlot(g, kit.data.slots[R.pics.indexOf(R.order[R.got])], frame, kit.data.on); }
});

/* ======================= B3 ONE MORE PETAL (26-3): the peg loft ======================= */
const PEG_COLS = ['#e8442e', '#ffd84a', '#4aa8e8', '#5ad86a', '#c86ad8', '#ff8a3a', '#f4ead2'];
TourRooms.def('washPegs', {
  title: 'ONE MORE PEG', rule: 'THE TOWEL DROPS, THEN LIFTS WITH ONE NEW PEG ON THE LINE. JUMP ON THE STOOL UNDER THE NEW ONE. THREE TIMES!', need: 'SPOT THE NEW PEG FIRST!',
  make(o, keep, ctx, A, rng) { const S = stageRoom(o, keep, A, 6, 2, { shelf: true, sh: 3 }); S.g.data.slots = S.slots; return mirrorRoom(S.g, ['slots']); },   // door right: a plank shelf on posts over the loft floor
  enter(play, A, R, kit) { if (!R.won) { R.round = 0; this.start(play, A, R); } },
  start(play, A, R) { const rng = ROOM_SEED(play, A); R.has = shuffle(rng, [0, 1, 2, 3, 4, 5]).slice(0, 2 + R.round); R.cols = shuffle(rng, PEG_COLS.slice()); R.phase = 'look'; R.pt = 0; R.newer = -1; },
  update(play, dt, A, R, kit) { const ON = kit.data.on, STAGE = kit.data.stage;
    if (R.won) return;
    if (play.bannerT > 0.1 && R.phase === 'look') return;
    R.pt += dt;
    if (R.phase === 'look' && R.pt > 2.0) { R.phase = 'shut'; R.pt = 0; TourKit.sfx('swish', 'select', { vol: 0.3, pitch: 0.8 }); }
    if (R.phase === 'shut' && R.pt > 1.0) {
      const free = [0, 1, 2, 3, 4, 5].filter(k => R.has.indexOf(k) < 0), rng = ROOM_SEED(play, A);
      R.newer = free[Math.floor(rng() * free.length)]; R.has.push(R.newer); R.phase = 'pick'; R.pt = 0; R.wasG = play.player.onGround;
    }
    if (R.phase === 'pick') {
      const k = landedOn(play, R, kit.data.slots, kit.data.on); if (k < 0) return;
      if (k === R.newer) { R.round++; Sound.play('pick', { vol: 0.6, pitch: 1.2 + R.round * 0.15 }); Tour.washKit.say(play, kit.data.slots[k] * TS + 16, ON * TS - 40, 'NEW!', '#ffffff'); if (R.round >= 3) { winRoom(play, A, R, { text: 'A FULL LINE!', coins: 6 }); return; } R.phase = 'look'; R.pt = 0.4; }
      else { R.fails = (R.fails || 0) + 1; RK().raspberry(play, 'THAT ONE WAS ALREADY THERE!'); this.start(play, A, R); }
    }
  },
  draw(play, ctx, A, R, kit) { const ON = kit.data.on, STAGE = kit.data.stage;
    const t = play.t, xs = kit.data.slots, ly = 4.2 * TS, lx0 = Math.min(...xs) * TS - 20, lx1 = Math.max(...xs) * TS + TS + 20;
    WA.line(ctx, lx0, ly, lx1, ly, 8, '#8a7a62');
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#5a4a3a'; ctx.fillRect(lx0 - 6, ly - 6, 8, 2.6 * TS); ctx.strokeRect(lx0 - 6, ly - 6, 8, 2.6 * TS); ctx.fillRect(lx1 - 2, ly - 6, 8, 2.6 * TS); ctx.strokeRect(lx1 - 2, ly - 6, 8, 2.6 * TS); ctx.restore();
    xs.forEach((x, k) => {
      const px = x * TS + TS / 2, i = R.has.indexOf(k);
      if (i >= 0) WA.peg(ctx, px, ly + 26, 1.1, Math.sin(t * 2 + k) * 0.05, R.cols[k % R.cols.length]);
      // the stool under each slot
      const by = ON * TS + TS; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#b8784a'; ctx.fillRect(px - 14, by - 30, 28, 8); ctx.strokeRect(px - 14, by - 30, 28, 8); ctx.fillRect(px - 12, by - 22, 5, 22); ctx.strokeRect(px - 12, by - 22, 5, 22); ctx.fillRect(px + 7, by - 22, 5, 22); ctx.strokeRect(px + 7, by - 22, 5, 22); ctx.restore();
    });
    // the towel over the line while it is shut
    if (R.phase === 'shut') { const k = Math.min(1, R.pt * 4) * (R.pt > 0.75 ? Math.max(0, (1 - R.pt) * 4) : 1); ctx.save(); ctx.globalAlpha = 1; WA.gingham(ctx, lx0, ly - 6, lx1 - lx0, 2.4 * TS * k, 10, 0.55, '#f2c0b0'); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(lx0, ly - 6, lx1 - lx0, 2.4 * TS * k); ctx.restore(); }
    if (!R.won && !(play.bannerT > 0.1)) hud(play, ctx, (R.phase === 'pick' ? 'WHICH ONE IS NEW?  ' : 'LOOK AT THE LINE...  ') + 'MORNING ' + (R.round + 1) + ' / 3', 0);
  },
  testWin(g, A, R, kit, frame) { const ON = kit.data.on, STAGE = kit.data.stage; for (let n = 0; n < 3 && !R.won; n++) { for (let k = 0; k < 2000 && R.phase !== 'pick'; k++) frame(g, {}); pickSlot(g, kit.data.slots[R.newer], frame, kit.data.on); } }
});

/* ======================= B4 STILL PACKED? (26-4): the lost property counter ======================= */
const THINGS = [
  { name: 'SOCK', draw(c, x, y) { WA.sock(c, x - 4, y - 26, 0.75, WA.CREAM, WA.NAVY, false); } },
  { name: 'PEG', draw(c, x, y) { WA.peg(c, x, y - 2, 1.1); } },
  { name: 'BUTTON', draw(c, x, y) { Tour.countries.wash.coin.draw(c, x, y - 12); } },
  { name: 'SPOOL', draw(c, x, y) { Decor.washSpool(c, x, y, 0, null, null); } },
  { name: 'HANGER', draw(c, x, y) { c.save(); c.strokeStyle = '#8a92a6'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, y - 24); c.quadraticCurveTo(x + 5, y - 30, x, y - 32); c.moveTo(x, y - 24); c.lineTo(x - 14, y - 8); c.lineTo(x + 14, y - 8); c.closePath(); c.stroke(); c.restore(); } },
  { name: 'GLOVE', draw(c, x, y) { c.save(); c.strokeStyle = INK; c.lineWidth = 1.6; c.fillStyle = '#ffd84a'; c.beginPath(); c.moveTo(x - 9, y - 2); c.lineTo(x - 10, y - 18); for (let k = 0; k < 4; k++) { c.lineTo(x - 8 + k * 5, y - 28 + (k % 3)); c.lineTo(x - 5 + k * 5, y - 18); } c.lineTo(x + 12, y - 12); c.lineTo(x + 9, y - 2); c.closePath(); c.fill(); c.stroke(); c.restore(); } }
];
TourRooms.def('washBag', {
  title: 'STILL PACKED?', rule: 'PEEK IN THE LAUNDRY BAG. WHEN IT SHUTS, JUMP ON THE ONE THING ON THE SHELF THAT WAS INSIDE. TWICE!', need: 'FIND WHAT WAS PACKED FIRST!',
  make(o, keep, ctx, A, rng) { const S = stageRoom(o, keep, A, 4, 3, { sh: 3 }); S.g.data.slots = S.slots; return mirrorRoom(S.g, ['slots']); },   // door right, a tall counter
  enter(play, A, R, kit) { if (!R.won) { R.round = 0; this.start(play, A, R); } },
  start(play, A, R) {
    const rng = ROOM_SEED(play, A), L = shuffle(rng, [0, 1, 2, 3, 4, 5]);
    // in the bag: three things; on the shelf: one of them and three that were not
    R.bag = L.slice(0, 3); const keepOne = R.bag[Math.floor(rng() * 3)];
    R.shelf = shuffle(rng, [keepOne].concat(L.slice(3, 6))); R.answer = R.shelf.indexOf(keepOne); R.phase = 'peek'; R.pt = 0;
  },
  update(play, dt, A, R, kit) { const ON = kit.data.on, STAGE = kit.data.stage;
    if (R.won) return;
    if (play.bannerT > 0.1 && R.phase === 'peek') return;
    R.pt += dt;
    if (R.phase === 'peek' && R.pt > 3.0) { R.phase = 'pick'; R.pt = 0; R.wasG = play.player.onGround; TourKit.sfx('zip', 'select', { vol: 0.3, pitch: 1.6 }); }
    if (R.phase === 'pick') {
      const k = landedOn(play, R, kit.data.slots, kit.data.on); if (k < 0) return;
      if (k === R.answer) { R.round++; Sound.play('pick', { vol: 0.6, pitch: 1.3 }); Tour.washKit.say(play, kit.data.slots[k] * TS + 16, ON * TS - 40, 'PACKED!', '#ffffff'); if (R.round >= 2) { winRoom(play, A, R, { text: 'ALL ACCOUNTED FOR!', coins: 6 }); return; } this.start(play, A, R); }
      else { R.fails = (R.fails || 0) + 1; RK().raspberry(play, 'THAT WASN\'T IN THE BAG!'); this.start(play, A, R); }
    }
  },
  draw(play, ctx, A, R, kit) { const ON = kit.data.on, STAGE = kit.data.stage;
    const t = play.t, xs = kit.data.slots, cx = (xs[0] + xs[3] + 1) / 2 * TS, by = 4.6 * TS;
    // the laundry bag: open (its three things showing over the drawstring) or pulled shut
    const open = R.phase === 'peek';
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
    ctx.fillStyle = '#e8e2f2'; ctx.beginPath(); ctx.moveTo(cx - 2.6 * TS, by - 1.2 * TS); ctx.quadraticCurveTo(cx - 3.2 * TS, by + 1.2 * TS, cx, by + 1.3 * TS); ctx.quadraticCurveTo(cx + 3.2 * TS, by + 1.2 * TS, cx + 2.6 * TS, by - 1.2 * TS); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (open) { ctx.fillStyle = '#3a3048'; ctx.beginPath(); ctx.ellipse(cx, by - 1.2 * TS, 2.6 * TS, 0.5 * TS, 0, 0, TAU); ctx.fill(); ctx.stroke(); R.bag.forEach((k, i) => THINGS[k].draw(ctx, cx + (i - 1) * 1.6 * TS, by - 1.1 * TS)); }
    else { ctx.fillStyle = '#d8d0e8'; ctx.beginPath(); ctx.moveTo(cx - 2.6 * TS, by - 1.2 * TS); ctx.quadraticCurveTo(cx, by - 0.6 * TS, cx + 2.6 * TS, by - 1.2 * TS); ctx.lineTo(cx + 0.4 * TS, by - 0.4 * TS); ctx.lineTo(cx - 0.4 * TS, by - 0.4 * TS); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#e8442e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 0.5 * TS, by - 0.45 * TS); ctx.lineTo(cx + 0.5 * TS, by - 0.45 * TS); ctx.stroke(); }
    ctx.fillStyle = '#5a4a3a'; ctx.font = TourBackstage.F8; ctx.textAlign = 'center'; ctx.fillText('LOST PROPERTY', cx, by + 0.6 * TS);
    // the shelf: four things, each on a little tag box (the tops you land on)
    xs.forEach((x, k) => { const bx = x * TS + TS / 2, yy = ON * TS + TS; ctx.fillStyle = '#c8b088'; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, bx - 15, yy - 30, 30, 30, 3); ctx.fill(); ctx.stroke(); if (R.phase === 'pick' || R.won) THINGS[R.shelf[k]].draw(ctx, bx, yy - 2); });
    ctx.restore();
    if (!R.won && !(play.bannerT > 0.1)) hud(play, ctx, (R.phase === 'peek' ? 'PEEK INSIDE...  ' : 'WHICH WAS PACKED?  ') + (R.round + 1) + ' / 2', 0);
  },
  testWin(g, A, R, kit, frame) { const ON = kit.data.on, STAGE = kit.data.stage; for (let n = 0; n < 2 && !R.won; n++) { for (let k = 0; k < 2000 && R.phase !== 'pick'; k++) frame(g, {}); pickSlot(g, kit.data.slots[R.answer], frame, kit.data.on); } }
});

/* ======================= B5 YOUR SEAT, SIR (26-5): the drying room's cushions ======================= */
const MOTH_COLS = ['#e8442e', '#4aa8e8', '#5ad86a'];
TourRooms.def('washSeats', {
  title: 'YOUR SEAT, SIR', rule: 'THREE MOTHS TAKE A CUSHION EACH, THEN FLY UP. WHEN ONE FLIES TO YOU, JUMP ON ITS OWN CUSHION', need: 'SEAT THE MOTHS FIRST!',
  make(o, keep, ctx, A, rng) { const S = stageRoom(o, keep, A, 4, 3, { shelf: true, sh: 2 }); S.g.data.slots = S.slots; return S.g; },   // a drying rack's plank, the cushions on it
  enter(play, A, R, kit) { if (!R.won) this.start(play, A, R); },
  start(play, A, R) { const rng = ROOM_SEED(play, A); R.seat = shuffle(rng, [0, 1, 2, 3]).slice(0, 3); R.queue = shuffle(rng, [0, 1, 2]); R.qi = 0; R.sat = []; R.phase = 'settle'; R.pt = 0; },
  update(play, dt, A, R, kit) { const ON = kit.data.on, STAGE = kit.data.stage;
    if (R.won) return;
    if (play.bannerT > 0.1 && R.phase === 'settle') return;
    R.pt += dt;
    if (R.phase === 'settle' && R.pt > 2.6) { R.phase = 'fly'; R.pt = 0; TourKit.sfx('flap', 'jump', { vol: 0.3, pitch: 2 }); }
    if (R.phase === 'fly' && R.pt > 1.4) { R.phase = 'seat'; R.pt = 0; R.wasG = play.player.onGround; }
    if (R.phase === 'seat') {
      const k = landedOn(play, R, kit.data.slots, kit.data.on); if (k < 0) return;
      const m = R.queue[R.qi];
      if (k === R.seat[m]) { R.sat.push(m); R.qi++; Sound.play('pick', { vol: 0.6, pitch: 1.1 + R.qi * 0.2 }); Tour.washKit.say(play, kit.data.slots[k] * TS + 16, ON * TS - 40, 'SEATED!', '#ffffff'); if (R.qi >= 3) winRoom(play, A, R, { text: 'EVERYONE SEATED!', coins: 6 }); }
      else { R.fails = (R.fails || 0) + 1; RK().raspberry(play, 'NOT MY SEAT! EVERYBODY UP!'); this.start(play, A, R); }
    }
  },
  draw(play, ctx, A, R, kit) { const ON = kit.data.on, STAGE = kit.data.stage;
    const t = play.t, xs = kit.data.slots, p = play.player;
    // four cushions on the stage (their tops are what you land on)
    xs.forEach((x, k) => { const bx = x * TS + TS / 2, yy = ON * TS + TS; ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = ['#f2c0b0', '#c8c8f0', '#bfe8d6', '#ffe0a0'][k]; rr(ctx, bx - 17, yy - 24, 34, 24, 9); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(bx, yy - 12, 2.2, 0, TAU); ctx.fill(); ctx.restore(); });
    // the moths: on their cushions, then circling up high, then (one at a time) hovering over Brady's head
    for (let m = 0; m < 3; m++) {
      let x, y;
      const home = xs[R.seat[m]] * TS + TS / 2, hy = ON * TS - 8;
      if (R.sat.indexOf(m) >= 0 || R.phase === 'settle' && R.pt > 1.2 + m * 0.4 || R.won) { x = home; y = hy; }
      else if (R.phase === 'settle') { const k = Math.min(1, R.pt / (1.2 + m * 0.4)); x = lerp(home + (m - 1) * 120, home, k); y = lerp(2 * TS, hy, k); }
      else if (R.phase === 'seat' && R.queue[R.qi] === m) { x = p.cx + Math.sin(t * 4) * 10; y = p.y - 26 + Math.sin(t * 7) * 4; }
      else { const a = t * 1.8 + m * 2.1; x = (xs[0] + xs[3] + 1) / 2 * TS + Math.cos(a) * 3 * TS; y = 2.6 * TS + Math.sin(a) * 0.6 * TS; }
      ctx.save(); ctx.translate(x, y); WK.mothArt(ctx, { dir: 1 }, 0, 0, 'fly', t + m);
      ctx.fillStyle = MOTH_COLS[m]; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -22, 5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    if (!R.won && !(play.bannerT > 0.1)) hud(play, ctx, R.phase === 'seat' ? 'JUMP ON ITS CUSHION  ' + R.qi + ' / 3' : 'WHO SITS WHERE?', 0);
  },
  testWin(g, A, R, kit, frame) { const ON = kit.data.on, STAGE = kit.data.stage; for (let k = 0; k < 2400 && R.phase !== 'seat'; k++) frame(g, {}); for (let i = 0; i < 3 && !R.won; i++) pickSlot(g, kit.data.slots[R.seat[R.queue[R.qi]]], frame, kit.data.on); }
});

/* ======================= SOCK DIVORCE (26-6): the sock drawer ======================= */
TourRooms.def('washDivorce', {
  title: 'SOCK DIVORCE', rule: 'HOLD THROW ON THE CUFF AND WALK AWAY TILL THE SOCKS PEEL APART. LET GO BEFORE THE TOE MARK! TWO PAIRS', need: 'PART THE SOCKS FIRST!',
  make(o, keep, ctx, A, rng) {
    const S = stageRoom(o, keep, A, 2, 9, { noTops: true, sh: 1 });
    // the post the socks are pegged to (at the stage's left), the cuff Brady takes hold of beside it
    S.g.data.post = S.slots[0]; S.g.data.far = S.slots[1];
    return S.g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.pair = 0; this.start(play, A, R); } },
  start(play, A, R) { const rng = ROOM_SEED(play, A); R.phase = 'wait'; R.hold = false; R.str = 0; R.peelAt = (3.2 + rng() * 1.6) * TS; R.toe = R.peelAt + (R.pair ? 1.7 : 2.2) * TS; R.peeled = false; R.snapT = 0; },
  update(play, dt, A, R, kit) { const ON = kit.data.on, STAGE = kit.data.stage;
    if (R.won) return;
    const p = play.player, cuffX = (kit.data.post + 1) * TS + 8, I = p.inp || {};
    if (R.snapT > 0) { R.snapT -= dt; R.str = Math.max(0, R.str - dt * 14 * TS); return; }
    if (!R.hold) {
      // take the cuff: THROW while touching it (Brady standing at the post)
      if (I.actionPressed && p.onGround && Math.abs(p.cx - cuffX) < TS * 0.9 && p.groundTy === STAGE) { R.hold = true; R.x0 = p.cx; R.peeled = false; R.str = 0; TourKit.sfx('grip', 'select', { vol: 0.4, pitch: 1.2 }); }
      return;
    }
    // holding: the damp socks are heavy (a slow walk), they stretch as he walks away
    p.vx = clamp(p.vx, -2.4 * TS, 2.4 * TS);
    R.str = Math.max(0, p.cx - R.x0);
    if (!R.peeled && R.str >= R.peelAt) { R.peeled = true; TourKit.sfx('rip', 'kick', { vol: 0.5, pitch: 1.6 }); Tour.washKit.say(play, p.cx, p.y - 20, 'PEEL!', '#ffffff'); }
    if (R.str > R.toe) { R.hold = false; R.snapT = 0.6; R.fails = (R.fails || 0) + 1; RK().raspberry(play, 'TWANG! TOO FAR. BACK THEY GO'); this.start(play, A, R); R.snapT = 0.6; return; }
    if (!I.action) {
      R.hold = false;
      if (R.peeled) { R.pair++; Sound.play('pick', { vol: 0.6, pitch: 1.3 }); Tour.washKit.say(play, p.cx, p.y - 24, 'DIVORCED!', '#ffffff'); if (R.pair >= 2) { winRoom(play, A, R, { text: 'AMICABLE!', coins: 6 }); return; } this.start(play, A, R); }
      else { R.fails = (R.fails || 0) + 1; RK().raspberry(play, 'STILL STUCK! HOLD ON LONGER'); R.snapT = 0.5; }
    }
  },
  draw(play, ctx, A, R, kit) { const ON = kit.data.on, STAGE = kit.data.stage;
    const t = play.t, post = kit.data.post, px = post * TS + TS / 2, sy = STAGE * TS, cuffX = (post + 1) * TS + 8;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the post with its peg
    ctx.fillStyle = '#8a6a4a'; ctx.fillRect(px - 5, sy - 3 * TS, 10, 3 * TS); ctx.strokeRect(px - 5, sy - 3 * TS, 10, 3 * TS);
    WA.peg(ctx, px + 6, sy - 1.4 * TS, 1, 1.4);
    // the two socks, stuck together along their length, stretching from the peg to Brady's hand
    const len = 1.2 * TS + (R.won ? 0 : R.str), x0 = cuffX - 10, y0 = sy - 1.3 * TS, x1 = x0 + len;
    const peelK = R.peeled ? 1 : clamp(R.str / R.peelAt, 0, 1);
    const sockBand = (dy, col, bend) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, y0 + dy - 7); ctx.quadraticCurveTo((x0 + x1) / 2, y0 + dy - 7 + bend, x1, y0 + dy - 6); ctx.lineTo(x1, y0 + dy + 6); ctx.quadraticCurveTo((x0 + x1) / 2, y0 + dy + 7 + bend, x0, y0 + dy + 7); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    sockBand(-3 - peelK * 8, WA.CREAM, peelK * 10); sockBand(5 + peelK * 8, '#f2c0b0', -peelK * 10);
    ctx.fillStyle = WA.NAVY; ctx.fillRect(x0, y0 - 14 - peelK * 8, 8, 24 + peelK * 16);
    // the stitched toe mark on the stage (how far the sock may stretch), the damp seam where they're stuck
    const tx = R.toe + x0 + 1.2 * TS;
    ctx.strokeStyle = '#e8442e'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(tx, sy); ctx.lineTo(tx, sy - 2.2 * TS); ctx.stroke(); ctx.setLineDash([]);
    WA.pill(ctx, tx, sy - 2.5 * TS, 'TOE MARK', '#ff8a7a');
    if (!R.peeled && R.hold) { ctx.fillStyle = 'rgba(120,160,220,0.6)'; for (let k = 0; k < 4; k++) { const dx = ((t * 40 + k * 30) % Math.max(10, len)); ctx.beginPath(); ctx.arc(x0 + dx, y0 + 1, 2.5, 0, TAU); ctx.fill(); } }
    if (!R.hold && !R.won) { const k = 0.5 + 0.5 * Math.sin(t * 6); WA.pill(ctx, cuffX, y0 - 30, 'HOLD THROW', '#ffd84a', 0.7 + 0.3 * k); }
    ctx.restore();
    if (!R.won && !(play.bannerT > 0.1)) hud(play, ctx, (R.hold ? (R.peeled ? 'LET GO NOW!  ' : 'KEEP WALKING...  ') : 'HOLD THROW ON THE CUFF  ') + 'PAIR ' + (R.pair + 1) + ' / 2', 0);
  },
  testWin(g, A, R, kit, frame) { const ON = kit.data.on, STAGE = kit.data.stage;
    const p = g.player, cuffX = (kit.data.post + 1) * TS + 8;
    for (let n = 0; n < 2 && !R.won; n++) {
      p.x = cuffX - p.w / 2; p.y = STAGE * TS - p.h; p.vx = 0; p.vy = 0; for (let k = 0; k < 30; k++) frame(g, {});
      frame(g, { action: true, actionPressed: true });
      for (let k = 0; k < 900 && !R.peeled; k++) frame(g, { action: true, right: true });
      frame(g, {}); for (let k = 0; k < 30; k++) frame(g, {});
    }
  }
});
})();
