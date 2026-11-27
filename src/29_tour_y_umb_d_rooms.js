/* ============================================================
   THE UMBRELLA REPAIR DISTRICT: the six secret rooms (HIDDEN_LAND_BRIEF.md, CHATGPT_RELAY.md B26-B30 and section F's
   Missing Rib). Each a 10-25 second game with a rule that reads in two seconds, played in one landscape view, the game
   in the middle band (clear of the top bar, the stick and the buttons), each in its own place with its own floor,
   walls and arrangement. Every game is a MOUNTED prop: stand on its station and press THROW to take it; then the
   stick aims or steers, THROW plays the prop, JUMP steps off.
     umbLunch   31-1 THE LUNCH NOOK      LONG LUNCH: a pea-flicker on the counter. Stick UP/DOWN tilts it; THROW flicks
                                         a pea at the toy Drip Finch's open beak (he never catches anything himself).
                                         Once straight in; then an enamel plate stands in the way: bank it off the
                                         enamel tray on the ceiling.
     umbThread  31-2 THE SEWING LOFT     THREADBARE: a stiff thread end, steered with the stick. Through the patch's top
                                         buttonhole, then back through the bottom one. Brushing the patch snags it
                                         (back to the start).
     umbMagnet  31-3 THE FERRULE TRAY    FINDERS KEEPERS: a magnet on a gantry: stick LEFT/RIGHT runs it, DOWN/UP
                                         lowers and raises it. Lift the steel key clear of the tray of coral ferrules
                                         without a second piece of metal clinking on.
     umbCamera  31-4 THE PHOTO BOOTH     BUN IN THE VIEWFINDER: pan the viewfinder with the stick. Brady's bun shows in
                                         the shop mirror; Pupo swings past it on an umbrella crook. THROW snaps: both
                                         the bun and Pupo's whole smile in one small picture.
     umbSlice   31-5 THE PATCH CAROUSEL  SEED THE SLICE: an open canopy turns on the wall with three bare wedges. Point
                                         the stick, THROW flicks a patch from the hub that way: one in each bare wedge
                                         before the canopy makes a full turn.
     umbRib     31-6 THE TEST SHOWER     MISSING RIB: Brady holds an umbrella up to the rain. Stick LEFT/RIGHT turns it
                                         one spoke at a time; THROW tucks the patch over the wedge at the top: it must
                                         be the one the drops come through. Twice.
   A miss resets that turn and costs nothing. A win opens the prize cage at once (29_tour_zz_lamps.js). The words come in
   turn: the title alone, then the rule on a dark pill, then the counter in one spot under the HUD.
   ============================================================ */
(function () {
if (typeof TourRooms === 'undefined' || !Tour.umbKit) return;
const UK = Tour.umbKit, INK = UK.INK, UA = UK.UmbArt, RKit = TourRoomKit;
const isUmb = kit => !!(kit && /^umb/.test(kit.kind));
const chime = (k, ok) => Sound.play('select', { vol: 0.5, pitch: ok === false ? 0.45 : Math.pow(2, [0, 4, 7, 12][k % 4] / 12) });
const hud = (play, ctx, str, col) => { if (!(play.toastT > 0)) TourRooms.hudText(play, ctx, str, col, 13, 72); };   // (not while the rule's pill shows: one line at a time)   // under the HUD's row of pills
const W = 26;

/* ---------------- the room's shape ----------------
   L: { ledge (the arrival ledge's standing row), stage: [x0, x1, top] (a solid stage), shelf (a plank stage on posts
   instead), station: [x, row] (where Brady stands to take the prop), cage: [x, row, w], mirror (door on the right) }.
   The arrival and its door move up onto a ledge at the top left, clear of the stick. */
function shell(keep, A, o, L) {
  const g = RKit.room(W, 15, 11), items = RKit.prize(o, keep);
  g.west(keep);
  const ly = L.ledge;
  for (let x = 1; x < 6; x++) for (let y = 1; y <= 10; y++) { const c = g.get(x, y); if (c === '@' || c === 'D') { g.put(x, ly, c); if (c === 'D') { g.doorsAt[x + ',' + ly] = g.doorsAt[x + ',' + y]; delete g.doorsAt[x + ',' + y]; } g.put(x, y, '.'); } }
  g.fill(1, ly + 1, 5, 10, '#');
  const [s0, s1, st] = L.stage;
  if (L.shelf) { g.hline(s0, s1, st, '-'); g.vline(s0 + 1, st + 1, 10, 'H'); g.vline(s1 - 1, st + 1, 10, 'H'); }
  else g.fill(s0, st, s1, 10, '#');
  // a step down from the ledge to the stage when they differ by more than two rows
  if (L.step) g.fill(L.step[0], L.step[1], L.step[0] + (L.step[2] || 0), 10, '#');
  const [cx, cy, cw] = L.cage;
  g.cage(A.id, cx, cy, items, { w: cw || Math.max(3, items.length + 2), h: 4 });
  const cwd = cw || Math.max(3, items.length + 2);
  if (cy < 10) g.fill(cx - 1, cy + 1, cx + cwd, 10, '#');
  const [sx, sy] = L.station;
  g.spawn(sx, sy, 'umbStation', { k: o.kind || A.room });
  g.need('the station', sx, sy);
  g.winSpot(A.id, sx, sy);
  g.data.station = [sx, sy];
  if (L.mirror) mirror(g, ['station']);
  return g;
}
function mirror(g, keys) {
  const Wd = g.W;
  g.g = g.g.map(r => r.slice().reverse());
  const flipKeys = M => { const o = {}; for (const k in M) { const [x, y] = k.split(',').map(Number); o[(Wd - 1 - x) + ',' + y] = M[k]; } return o; };
  g.boxes = flipKeys(g.boxes); g.doorsAt = flipKeys(g.doorsAt);
  for (const q of g.needs) q.x = Wd * TS - q.x - q.w;
  for (const k of keys || []) { const v = g.data[k]; if (Array.isArray(v)) g.data[k] = [Wd - 1 - v[0], v[1]]; }
  if (g.data.cage) g.data.cage.x = Wd - 1 - g.data.cage.x - g.data.cage.w;
  g.data.mirror = true;
  return g;
}
const ROOM_SEED = (play, A) => mulberry32(hashStr('umb:' + A.roomKit.aid + ':' + ((A.roomState && A.roomState.visits) || 0) + ':' + ((A.roomState && A.roomState.fails) || 0)));

/* ---------------- mounting a prop: THROW on the station takes it; the stick and buttons then play it ---------------- */
// p.umbRaw: the raw input this frame (the room reads it); while mounted Brady stands still
{
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g, A = g && g.area, kit = A && A.roomKit;
    this.umbRaw = inp;
    if (isUmb(kit) && A.roomState && A.roomState.mounted && inp) {
      const R = A.roomState;
      if (inp.jumpPressed || R.won) { R.mounted = false; if (!R.won) chime(0, false); }
      else return up0.call(this, dt, Object.assign({}, inp, { left: false, right: false, up: false, down: false, jump: false, jumpPressed: false, action: false, actionPressed: false, upPressed: false, downPressed: false }));
    }
    return up0.call(this, dt, inp);
  };
}
class UmbStation extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.back = true; }
  room() { const A = this.g.area; return A && A.roomKit ? { A, R: TourRooms.state(this.g, A), K: TourRooms.kinds[A.roomKit.kind] } : null; }
  on(p) { return p && !p.dead && p.onGround && p.groundTy === this.fy && Math.abs(p.cx - (this.tx * TS + TS / 2)) < TS * 0.9; }
  update(dt) {
    this.t += dt; const r = this.room(), p = this.g.player; if (!r || r.R.won) return;
    const I = (p && p.umbRaw) || {};
    if (!r.R.mounted && this.on(p) && I.actionPressed && !(this.g.bannerT > 0) && !r.R.ruleWait) {
      r.R.mounted = true; p.vx = 0; p.x = this.tx * TS + TS / 2 - p.w / 2; chime(1, true);
      if (r.K.mount) r.K.mount(this.g, r.A, r.R, r.A.roomKit);
    }
  }
  touchPlayer() {}
  draw(ctx) {
    const r = this.room(), p = this.g.player; if (!r || r.R.won) return;
    const x = this.tx * TS + TS / 2, y = this.fy * TS;
    if (!r.R.mounted) {
      UA.ring(ctx, x, y, this.t, this.on(p), 18);
      if (this.on(p) && !(this.g.bannerT > 0)) { const k = 0.5 + 0.5 * Math.sin(this.t * 7); UA.pill(ctx, x, y - 2.6 * TS, 'THROW: TAKE IT', UA.GOLD_L, 0.7 + 0.3 * k); }
    }
  }
}
ENTITY_TYPES.umbStation = UmbStation;
// the controls while mounted, in one line under the counter
// while a prop is held: a small separate hint at the bottom middle, between the thumbs
TourHooks.on('afterEntities', (play, ctx) => { const A = play.area, kit = A && A.roomKit; if (!isUmb(kit) || !A.roomState || !A.roomState.mounted || A.roomState.won) return; TourRooms.hudText(play, ctx, 'JUMP: STEP OFF', '#ffffff', 10, Game.viewH - 20); });

/* ======================= B26 LONG LUNCH (31-1): the pea-flicker and the toy finch ======================= */
// geometry in tiles: the flicker at the station's hand height, the beak at the right; round 2: the plate in the way, the
// enamel tray along the ceiling to bank off
const LUNCH = { beak: [19, 7.0], plate: [13.2, 6.0, 13.2, 9.0], tray: [10.5, 4.7, 17, 4.7], r: 0.85 };
TourRooms.def('umbLunch', {
  title: 'LONG LUNCH', rule: 'TILT, THEN THROW A PEA IN THE BEAK', need: 'FEED THE FINCH FIRST!',
  make(o, keep, ctx, A, rng) { return shell(keep, A, o, { ledge: 6, stage: [6, 21, 9], station: [7, 8], cage: [21, 10, 3] }); },
  enter(play, A, R, kit) { if (!R.won) { R.round = R.round || 0; R.ang = R.ang == null ? -0.3 : R.ang; R.pea = null; } },
  origin(kit) { const [sx, sy] = kit.data.station; return [sx + 0.9, sy - 0.4]; },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const I = (play.player && play.player.umbRaw) || {};
    if (R.mounted) {
      if (I.up) R.ang = Math.max(-1.1, R.ang - dt * 0.55); if (I.down) R.ang = Math.min(0.5, R.ang + dt * 0.55);
      if (I.actionPressed && !R.pea) { const [ox, oy] = this.origin(kit); R.pea = { x: ox, y: oy, vx: Math.cos(R.ang) * 11, vy: Math.sin(R.ang) * 11, t: 0, b: 0 }; TourKit.sfx('flick', 'kick', { vol: 0.4, pitch: 1.8 }); }
    }
    const P = R.pea; if (!P) return;
    const st = 6; for (let s = 0; s < st && R.pea; s++) {
      const h = dt / st; P.x += P.vx * h; P.y += P.vy * h; P.t += h;
      // the ceiling tray (round 2): a bounce
      if (R.round >= 1 && P.vy < 0 && P.y <= LUNCH.tray[1] && P.x >= LUNCH.tray[0] && P.x <= LUNCH.tray[2]) { P.y = LUNCH.tray[1]; P.vy = -P.vy; P.b++; TourKit.sfx('ting', 'select', { vol: 0.4, pitch: 2.2 }); }
      // the plate in the way (round 2): a clang, a miss
      if (R.round >= 1 && Math.abs(P.x - LUNCH.plate[0]) < 0.25 && P.y > LUNCH.plate[1] && P.y < LUNCH.plate[3]) { this.miss(play, R, 'CLANG! THE PLATE'); return; }
      if (Math.hypot(P.x - LUNCH.beak[0], P.y - LUNCH.beak[1]) < LUNCH.r) {
        R.pea = null; R.round++; chime(R.round, true); UK.say(play, LUNCH.beak[0] * TS, (LUNCH.beak[1] - 1.6) * TS, R.round >= 2 ? 'GULP!' : 'CHOMP! FIRST ONE EVER', UA.GOLD_L, 'room');
        if (R.round >= 2) { R.mounted = false; TourRooms.win(play, A, R, { text: 'LUNCH IS SERVED!', coins: 5 }); }
        return;
      }
      if (P.x > 24 || P.x < 2 || P.y < 3.5 || P.y > 10.5 || P.t > 3) { this.miss(play, R, 'MISSED THE BEAK'); return; }
    }
  },
  miss(play, R, msg) { R.pea = null; R.fails = (R.fails || 0) + 1; RKit.raspberry(play, msg); },
  draw(play, ctx, A, R, kit) {
    const t = play.t, [ox, oy] = this.origin(kit);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the counter's back: a lunch shelf with the toy finch (on a little stand, beak wide open)
    const bx = LUNCH.beak[0] * TS, by = LUNCH.beak[1] * TS;
    ctx.fillStyle = '#2e7a5a'; ctx.fillRect(bx - 30, by + 26, 64, 8); ctx.strokeRect(bx - 30, by + 26, 64, 8);
    ctx.save(); ctx.translate(bx - 14, by + 22); ctx.scale(-2.1, 2.1); UK.finchArt(ctx, { dir: 1 }, 0, 0, 'swoop', 0); ctx.restore();
    UA.ring(ctx, bx, by, t, true, 20);
    // round 2: the enamel plate stood up in the way, the enamel tray along the ceiling
    if (R.round >= 1 && !R.won) {
      ctx.fillStyle = '#f4f1e8'; ctx.fillRect(LUNCH.plate[0] * TS - 6, LUNCH.plate[1] * TS, 12, (LUNCH.plate[3] - LUNCH.plate[1]) * TS); ctx.strokeRect(LUNCH.plate[0] * TS - 6, LUNCH.plate[1] * TS, 12, (LUNCH.plate[3] - LUNCH.plate[1]) * TS);
      ctx.strokeStyle = '#3a6a9a'; ctx.lineWidth = 2; ctx.strokeRect(LUNCH.plate[0] * TS - 3, LUNCH.plate[1] * TS + 4, 6, (LUNCH.plate[3] - LUNCH.plate[1]) * TS - 8);
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#e8eef4'; ctx.fillRect(LUNCH.tray[0] * TS, LUNCH.tray[1] * TS - 10, (LUNCH.tray[2] - LUNCH.tray[0]) * TS, 10); ctx.strokeRect(LUNCH.tray[0] * TS, LUNCH.tray[1] * TS - 10, (LUNCH.tray[2] - LUNCH.tray[0]) * TS, 10);
      ctx.fillStyle = '#3a6a9a'; ctx.fillRect(LUNCH.tray[0] * TS, LUNCH.tray[1] * TS - 3, (LUNCH.tray[2] - LUNCH.tray[0]) * TS, 3);
    }
    // the pea-flicker: a bent rib on a cork, tilted by the stick; a short dotted guide
    ctx.save(); ctx.translate(ox * TS, oy * TS); ctx.rotate(R.ang || 0);
    ctx.fillStyle = UA.NAVY_L; ctx.fillRect(-6, -5, 34, 10); ctx.strokeRect(-6, -5, 34, 10); ctx.fillStyle = UA.CORAL; ctx.beginPath(); ctx.arc(28, 0, 5, 0, TAU); ctx.fill(); ctx.stroke();
    if (R.mounted && !R.pea) { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.setLineDash([5, 7]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(36, 0); ctx.lineTo(36 + 3.5 * TS, 0); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
    ctx.fillStyle = '#8a5a3a'; ctx.fillRect(ox * TS - 10, oy * TS + 2, 20, (kit.data.station[1] + 1 - oy) * TS - 2); ctx.strokeRect(ox * TS - 10, oy * TS + 2, 20, (kit.data.station[1] + 1 - oy) * TS - 2);
    if (R.pea) { ctx.fillStyle = '#7ac850'; ctx.beginPath(); ctx.arc(R.pea.x * TS, R.pea.y * TS, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    if (!R.won && !(play.bannerT > 0) && !R.ruleWait) { hud(play, ctx, 'PEA ' + Math.min(2, (R.round || 0) + 1) + ' OF 2' + (R.round >= 1 ? ': OFF THE TRAY' : '')); }
  },
  // the angle that lands the pea for this round (for the tests' stick)
  aim(kit, R) {
    const [ox, oy] = this.origin(kit);
    if (!R.round) return Math.atan2(LUNCH.beak[1] - oy, LUNCH.beak[0] - ox);
    const my = 2 * LUNCH.tray[1] - LUNCH.beak[1]; return Math.atan2(my - oy, LUNCH.beak[0] - ox);
  },
  testWin(g, A, R, kit, frame) { R.mounted = true; for (let n = 0; n < 2 && !R.won; n++) { const tg = this.aim(kit, R); for (let k = 0; k < 900 && Math.abs(R.ang - tg) > 0.006; k++) frame(g, { up: R.ang > tg, down: R.ang < tg }); frame(g, { action: true, actionPressed: true }); for (let k = 0; k < 400 && R.pea; k++) frame(g, {}); } }
});

/* ======================= B27 THREADBARE (31-2): the stiff thread and the two-hole patch ======================= */
// in tiles: the box the thread end moves in, the patch's x, its two buttonholes (y ranges)
// (the sewing loft is mirrored: the station on the right, the thread goes left through the top hole first)
const THR = { box: [5, 4.8, 16, 8.6], bx: 10.5, holes: [[5.0, 6.0], [7.4, 8.4]], start: [15.5, 6.8], sp: 3.2, first: -1 };
TourRooms.def('umbThread', {
  title: 'THREADBARE', rule: 'THREAD BOTH BUTTONHOLES. DON\'T TOUCH THE PATCH', need: 'MEND THE PATCH FIRST!',
  make(o, keep, ctx, A, rng) { return shell(keep, A, o, { ledge: 5, stage: [7, 9, 9], station: [8, 8], cage: [21, 8, 3], step: [6, 8, 0], mirror: true }); },
  enter(play, A, R, kit) { if (!R.won) this.reset(R, kit); },
  reset(R, kit) { R.tip = THR.start.slice(); R.trail = [THR.start.slice()]; R.stage = 0; },
  geom(kit) { return kit.data.mirror ? { flip: true } : { flip: false }; },
  // the room is mirrored: x in the game box runs from the station's side (the right) toward the patch
  wx(kit, x) { return x; },
  update(play, dt, A, R, kit) {
    if (R.won || !R.mounted) return;
    const I = (play.player && play.player.umbRaw) || {}, f = 1;
    let dx = (I.right ? 1 : 0) - (I.left ? 1 : 0), dy = (I.down ? 1 : 0) - (I.up ? 1 : 0); dx *= f;
    if (!dx && !dy) return;
    const n = Math.hypot(dx, dy), [x0, y0] = R.tip, x1 = clamp(x0 + dx / n * THR.sp * dt, THR.box[0], THR.box[2]), y1 = clamp(y0 + dy / n * THR.sp * dt, THR.box[1], THR.box[3]);
    // crossing the patch's line: through a hole (the right one for this stage) or a snag
    if ((x0 - THR.bx) * (x1 - THR.bx) <= 0 && x0 !== x1) {
      const yc = y0 + (y1 - y0) * (THR.bx - x0) / (x1 - x0), want = R.stage === 0 ? 0 : 1, H = THR.holes[want], going = x1 > x0 ? 1 : -1;
      const inHole = k => yc > THR.holes[k][0] && yc < THR.holes[k][1];
      if (inHole(want) && going === (R.stage === 0 ? THR.first : -THR.first)) {
        R.stage++; chime(R.stage, true); UK.say(play, this.wx(kit, THR.bx) * TS, (H[0] - 0.8) * TS, R.stage === 1 ? 'THROUGH! NOW BACK THROUGH THE BOTTOM' : 'STITCHED!', UA.GOLD_L, 'room');
        if (R.stage >= 2) { R.tip = [x1, y1]; R.trail.push([x1, y1]); R.mounted = false; TourRooms.win(play, A, R, { text: 'A NEAT DARN!', coins: 5 }); return; }
      } else { R.fails = (R.fails || 0) + 1; RKit.raspberry(play, inHole(0) || inHole(1) ? 'WRONG HOLE: IT SNAGS!' : 'SNAGGED ON THE PATCH!'); this.reset(R, kit); return; }
    }
    R.tip = [x1, y1]; const L = R.trail[R.trail.length - 1]; if (Math.hypot(L[0] - x1, L[1] - y1) > 0.25) R.trail.push([x1, y1]);
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, X = x => this.wx(kit, x) * TS, Y = y => y * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the giant needle stuck in the top of the patch, the patch (a marigold wedge) with its two stitched buttonholes
    const px = X(THR.bx), top = Y(THR.box[1] - 0.2), bot = Y(THR.box[3] + 0.2);
    ctx.fillStyle = UA.GOLD; ctx.fillRect(px - 14, top, 28, bot - top); ctx.strokeRect(px - 14, top, 28, bot - top);
    ctx.strokeStyle = UA.NAVY; ctx.setLineDash([3, 3]); ctx.strokeRect(px - 10, top + 3, 20, bot - top - 6); ctx.setLineDash([]);
    THR.holes.forEach(([a, b], k) => { const lit = R.stage === k && !R.won; ctx.fillStyle = '#f4dce8'; ctx.fillRect(px - 15, Y(a), 30, Y(b) - Y(a)); ctx.strokeStyle = lit ? UA.GOLD_L : INK; ctx.lineWidth = lit ? 3 : 2; ctx.strokeRect(px - 15, Y(a), 30, Y(b) - Y(a)); if (lit && R.mounted) { const q = 0.5 + 0.5 * Math.sin(t * 7); ctx.strokeStyle = `rgba(255,216,74,${0.4 + 0.5 * q})`; ctx.beginPath(); ctx.ellipse(px, (Y(a) + Y(b)) / 2, 22 + q * 3, (Y(b) - Y(a)) / 2 + 8, 0, 0, TAU); ctx.stroke(); } });
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#d8dce8'; ctx.beginPath(); ctx.moveTo(px + 14, top + 4); ctx.lineTo(px + 40, top - 6); ctx.lineTo(px + 40, top - 1); ctx.lineTo(px + 14, top + 8); ctx.closePath(); ctx.fill(); ctx.stroke();   // a pin through the patch's corner
    // the thread: from the spool at the station to the stiff tip
    const [sx, sy] = kit.data.station, spx = sx * TS + TS / 2, spy = sy * TS - 10;
    ctx.fillStyle = '#c86a9a'; ctx.fillRect(spx - 10, spy - 6, 20, 14); ctx.strokeRect(spx - 10, spy - 6, 20, 14);
    ctx.strokeStyle = '#c83a7a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(spx, spy); for (const [x, y] of R.trail || []) ctx.lineTo(X(x), Y(y)); if (R.tip) ctx.lineTo(X(R.tip[0]), Y(R.tip[1])); ctx.stroke();
    if (R.tip && !R.won) { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(X(R.tip[0]), Y(R.tip[1]), 5, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke(); }
    ctx.restore();
    if (!R.won && !(play.bannerT > 0) && !R.ruleWait) { hud(play, ctx, R.stage ? 'BACK THROUGH THE BOTTOM HOLE' : 'THROUGH THE TOP HOLE'); }
  },
  testWin(g, A, R, kit, frame) { R.mounted = true; const f = 1, go = (x, y) => { for (let k = 0; k < 600 && Math.hypot(R.tip[0] - x, R.tip[1] - y) > 0.12 && !R.won; k++) { const dx = x - R.tip[0], dy = y - R.tip[1]; frame(g, { right: dx * f > 0.06, left: dx * f < -0.06, down: dy > 0.06, up: dy < -0.06 }); } }; go(14, 5.5); go(7, 5.5); go(7, 7.9); go(14, 7.9); }
});

/* ======================= B28 FINDERS KEEPERS (31-3): the magnet over the ferrule tray ======================= */
const MAG = { rail: 4.6, x0: 9, x1: 19, trayTop: 7.9, trayBot: 9.0, clear: 6.9 };
TourRooms.def('umbMagnet', {
  title: 'FINDERS KEEPERS', rule: 'LIFT OUT THE KEY. NOTHING ELSE!', need: 'FISH OUT THE KEY FIRST!',
  make(o, keep, ctx, A, rng) { return shell(keep, A, o, { ledge: 6, stage: [6, 21, 9], station: [7, 8], cage: [21, 8, 3] }); },
  enter(play, A, R, kit) { if (!R.won) this.reset(play, A, R); },
  reset(play, A, R) {
    const rng = ROOM_SEED(play, A), kx = 11.5 + Math.floor(rng() * 4) * 1.6;
    R.items = [{ x: kx, y: 8.45, key: true }];
    for (const dx of [-1.15, 1.15, -2.6, 2.4, 3.6, -3.7]) { const x = kx + dx; if (x > MAG.x0 + 0.3 && x < MAG.x1 + 0.6) R.items.push({ x, y: 8.45 + (dx > 0 ? 0 : 0.05), key: false }); }
    R.buttons = [[10.2, 8.55], [13.4, 8.6], [16.8, 8.55], [18.9, 8.6]];
    R.mx = 10; R.my = MAG.rail + 1; R.held = [];
  },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const I = (play.player && play.player.umbRaw) || {};
    if (R.mounted) {
      R.mx = clamp(R.mx + ((I.right ? 1 : 0) - (I.left ? 1 : 0)) * 2.6 * dt, MAG.x0, MAG.x1);
      R.my = clamp(R.my + ((I.down ? 1 : 0) - (I.up ? 1 : 0)) * 2.2 * dt, MAG.rail + 0.6, 8.25);
    }
    // whatever metal the magnet's face touches clinks on
    const fy = R.my + 0.45;
    for (const it of R.items) if (R.held.indexOf(it) < 0 && Math.abs(it.x - R.mx) < 0.55 && Math.abs(it.y - fy) < 0.45) { R.held.push(it); TourKit.sfx('clink', 'select', { vol: 0.4, pitch: it.key ? 1.6 : 1.1 }); }
    R.held.forEach((it, k) => { it.x = R.mx + (k - (R.held.length - 1) / 2) * 0.5; it.y = fy + 0.3; });
    if (R.held.length > 1 || (R.held.length === 1 && !R.held[0].key)) { R.fails = (R.fails || 0) + 1; RKit.raspberry(play, R.held.some(i => i.key) ? 'CLINK! A FERRULE CAME UP TOO' : 'THAT\'S A FERRULE, NOT THE KEY'); const keep = R.mounted; this.reset(play, A, R); R.mounted = keep; return; }
    if (R.held.length === 1 && R.held[0].key && R.my < MAG.clear - 0.6) { chime(2, true); R.mounted = false; TourRooms.win(play, A, R, { text: 'FINDERS KEEPERS!', coins: 5 }); }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, X = x => x * TS, Y = y => y * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the gantry rail, the trolley, the cable, the magnet (a coral horseshoe)
    ctx.fillStyle = '#3a3a46'; ctx.fillRect(X(MAG.x0 - 1), Y(MAG.rail) - 6, X(MAG.x1 - MAG.x0 + 2), 8); ctx.strokeRect(X(MAG.x0 - 1), Y(MAG.rail) - 6, X(MAG.x1 - MAG.x0 + 2), 8);
    const mx = X(R.mx || 10), my = Y(R.my || 4);
    ctx.fillStyle = '#9aa4b8'; ctx.fillRect(mx - 14, Y(MAG.rail) - 10, 28, 12); ctx.strokeRect(mx - 14, Y(MAG.rail) - 10, 28, 12);
    ctx.beginPath(); ctx.moveTo(mx, Y(MAG.rail)); ctx.lineTo(mx, my - 6); ctx.stroke();
    ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(mx, my + 2, 10, Math.PI, 0); ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = UA.CORAL; ctx.beginPath(); ctx.arc(mx, my + 2, 10, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = '#e8eef4'; ctx.fillRect(mx - 14, my + 2, 8, 8); ctx.fillRect(mx + 6, my + 2, 8, 8); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(mx - 14, my + 2, 8, 8); ctx.strokeRect(mx + 6, my + 2, 8, 8);
    // the tray (the "clear" line above it is dashed: lift the key past it)
    ctx.fillStyle = '#5a5a68'; ctx.fillRect(X(MAG.x0 - 0.4), Y(MAG.trayTop), X(MAG.x1 - MAG.x0 + 1.4), Y(MAG.trayBot - MAG.trayTop)); ctx.lineWidth = 2; ctx.strokeRect(X(MAG.x0 - 0.4), Y(MAG.trayTop), X(MAG.x1 - MAG.x0 + 1.4), Y(MAG.trayBot - MAG.trayTop));
    ctx.strokeStyle = 'rgba(255,216,74,0.6)'; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(X(MAG.x0 - 0.4), Y(MAG.clear - 0.6)); ctx.lineTo(X(MAG.x1 + 1), Y(MAG.clear - 0.6)); ctx.stroke(); ctx.setLineDash([]);
    for (const [bx, by] of R.buttons || []) { ctx.fillStyle = '#e8c8a0'; ctx.beginPath(); ctx.arc(X(bx), Y(by), 7, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke(); ctx.fillStyle = INK; ctx.fillRect(X(bx) - 2, Y(by) - 1, 1.6, 1.6); ctx.fillRect(X(bx) + 1, Y(by) - 1, 1.6, 1.6); }
    for (const it of R.items || []) {
      const x = X(it.x), y = Y(it.y); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      if (it.key) { ctx.fillStyle = '#c8d0dc'; ctx.beginPath(); ctx.arc(x - 7, y, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillRect(x - 2, y - 2, 14, 4); ctx.strokeRect(x - 2, y - 2, 14, 4); ctx.fillRect(x + 7, y, 3, 5); ctx.fillRect(x + 11, y, 2, 4); }
      else { ctx.fillStyle = UA.CORAL; ctx.beginPath(); ctx.moveTo(x - 5, y - 6); ctx.lineTo(x + 5, y - 6); ctx.lineTo(x + 3, y + 6); ctx.lineTo(x - 3, y + 6); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    }
    ctx.restore();
    if (!R.won && !(play.bannerT > 0) && !R.ruleWait) { hud(play, ctx, R.held && R.held.length ? 'UP! LIFT IT CLEAR' : 'THE STEEL KEY'); }
  },
  testWin(g, A, R, kit, frame) { R.mounted = true; const k = R.items.find(i => i.key); for (let n = 0; n < 900 && Math.abs(R.mx - k.x) > 0.04; n++) frame(g, { right: R.mx < k.x, left: R.mx > k.x }); for (let n = 0; n < 900 && R.held.length === 0; n++) frame(g, { down: true }); for (let n = 0; n < 900 && !R.won; n++) frame(g, { up: true }); }
});

/* ======================= B29 BUN IN THE VIEWFINDER (31-4): the camera, the mirror, Pupo on a crook ======================= */
// in tiles: the scene's box, the mirror with Brady's bun reflected, Pupo's swing (a crook from the ceiling), the frame
const CAM = { box: [10, 4.6, 19.6, 8.9], bun: [13.6, 5.8], pivot: [16.5, 4.4], len: 2.6, fw: 3.4, fh: 2.8 };
TourRooms.def('umbCamera', {
  title: 'BUN IN THE VIEWFINDER', rule: 'SNAP YOUR BUN AND PUPO\'S SMILE', need: 'TAKE THE PICTURE FIRST!',
  make(o, keep, ctx, A, rng) { return shell(keep, A, o, { ledge: 6, stage: [7, 20, 9], shelf: true, station: [9, 8], cage: [21, 10, 3], step: [6, 8, 0] }); },
  enter(play, A, R, kit) { if (!R.won) { R.fx = R.fx || 18; R.fy = R.fy || 6; R.flash = 0; } },
  // Pupo's smile at time t (he swings on the crook, back and forth past the mirror)
  smile(t) { const a = Math.sin(t * 1.25) * 0.85; return [CAM.pivot[0] + Math.sin(a) * CAM.len, CAM.pivot[1] + Math.cos(a) * CAM.len + 0.55]; },
  inFrame(R, p, pad) { return Math.abs(p[0] - R.fx) < CAM.fw / 2 - (pad || 0) && Math.abs(p[1] - R.fy) < CAM.fh / 2 - (pad || 0); },
  update(play, dt, A, R, kit) {
    if (R.flash > 0) R.flash -= dt;
    if (R.won) return;
    const I = (play.player && play.player.umbRaw) || {};
    if (!R.mounted) return;
    R.fx = clamp(R.fx + ((I.right ? 1 : 0) - (I.left ? 1 : 0)) * 3 * dt, CAM.box[0] + CAM.fw / 2, CAM.box[2] - CAM.fw / 2);
    R.fy = clamp(R.fy + ((I.down ? 1 : 0) - (I.up ? 1 : 0)) * 3 * dt, CAM.box[1] + CAM.fh / 2, CAM.box[3] - CAM.fh / 2);
    if (I.actionPressed) {
      const sm = this.smile(play.t), bun = this.inFrame(R, CAM.bun, 0.2), smile = this.inFrame(R, sm, 0.3);
      R.flash = 0.35; TourKit.sfx('shutter', 'select', { vol: 0.5, pitch: 2.4 }); R.shot = { fx: R.fx, fy: R.fy, t: play.t };
      if (bun && smile) { chime(3, true); R.mounted = false; TourRooms.win(play, A, R, { text: 'A KEEPER!', coins: 5 }); }
      else { R.fails = (R.fails || 0) + 1; RKit.raspberry(play, !bun && !smile ? 'A LOVELY PICTURE OF THE WALL' : !bun ? 'NO BUN IN IT!' : 'PUPO\'S SMILE IS OUT OF THE PICTURE'); }
    }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, X = x => x * TS, Y = y => y * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the shop mirror (gilt frame)
    ctx.fillStyle = '#ffd060'; rr(ctx, X(12.2), Y(4.8), X(2.8), Y(3.4), 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#bcd8e8'; rr(ctx, X(12.4), Y(5.0), X(2.4), Y(3), 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(X(12.6), Y(5.2), 6, Y(2.4));
    // Brady himself in the glass, in profile at the camera (the game's own Brady: man bun, shades), clipped to the mirror
    { const by0 = Y(CAM.bun[1]) + 83; ctx.save(); rr(ctx, X(12.4), Y(5.0), X(2.4), Y(3), 6); ctx.clip();
      if (typeof drawBrady === 'function') { ctx.translate(X(CAM.bun[0]), by0); ctx.scale(1.3, 1.3); try { drawBrady(ctx, { x: 0, y: 0, facing: -1, small: false, power: 0, anim: { state: 'idle', t, phase: 0 }, hair: null, look: Save.data.look, time: t }); } catch (e) { /* drawing slip: the glass stays empty */ } }
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(X(12.6), Y(5.2), 6, Y(2.4)); }
    // the crook from the ceiling and Pupo swinging on it, upside down, grinning
    const a = Math.sin(t * 1.25) * 0.85, px = X(CAM.pivot[0]), py = Y(CAM.pivot[1]), ex = px + Math.sin(a) * X(CAM.len), ey = py + Math.cos(a) * Y(CAM.len);
    ctx.fillStyle = '#5a5a6a'; ctx.fillRect(px - 20, py - 8, 40, 8); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(px - 20, py - 8, 40, 8);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(ex, ey - 8); ctx.stroke();
    ctx.strokeStyle = UA.CORAL; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ex - 7, ey - 8, 7, 0, Math.PI); ctx.stroke();
    if (typeof Pupo !== 'undefined') { ctx.save(); ctx.translate(ex - 7, ey - 2); ctx.rotate(-a * 0.6); ctx.scale(0.5, 0.5); try { Pupo.draw(ctx, { x: 0, y: 0, scale: 1, facing: 1, t, pose: 'hang', mood: 'happy' }); } catch (e) { /* no Pupo here */ } ctx.restore(); }
    // the viewfinder: a small frame with corner marks (bright while mounted), the flash
    const fx = X(R.fx || 18), fy = Y(R.fy || 6), fw = X(CAM.fw), fh = Y(CAM.fh);
    ctx.strokeStyle = R.mounted ? '#ffffff' : 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.moveTo(fx + sx * fw / 2, fy + sy * (fh / 2 - 12)); ctx.lineTo(fx + sx * fw / 2, fy + sy * fh / 2); ctx.lineTo(fx + sx * (fw / 2 - 12), fy + sy * fh / 2); ctx.stroke(); }
    ctx.fillStyle = R.mounted ? 'rgba(255,60,60,0.9)' : 'rgba(255,60,60,0.4)'; ctx.beginPath(); ctx.arc(fx + fw / 2 - 10, fy - fh / 2 + 10, 3.5, 0, TAU); ctx.fill();
    if (R.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${R.flash * 2})`; ctx.fillRect(fx - fw / 2, fy - fh / 2, fw, fh); }
    // the camera on its tripod at the station
    const [sx, sy] = kit.data.station, cx = sx * TS + TS / 2 + 26, cy = sy * TS - 30;
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx - 12, (sy + 1) * TS); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx + 12, (sy + 1) * TS); ctx.stroke();
    ctx.fillStyle = '#2a2a36'; rr(ctx, cx - 16, cy - 10, 32, 22, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#5a6a8a'; ctx.beginPath(); ctx.arc(cx + 4, cy + 1, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (!R.won && !(play.bannerT > 0) && !R.ruleWait) { hud(play, ctx, 'THE BUN AND THE WHOLE SMILE'); }
  },
  testWin(g, A, R, kit, frame) {
    R.mounted = true; const tx = 14.7, ty = 6.75;
    for (let n = 0; n < 900 && (Math.abs(R.fx - tx) > 0.08 || Math.abs(R.fy - ty) > 0.08); n++) frame(g, { right: R.fx < tx - 0.05, left: R.fx > tx + 0.05, down: R.fy < ty - 0.05, up: R.fy > ty + 0.05 });
    for (let n = 0; n < 1200 && !R.won; n++) { const ok = this.inFrame(R, CAM.bun, 0.2) && this.inFrame(R, this.smile(g.t), 0.3); frame(g, ok ? { action: true, actionPressed: true } : {}); }
  }
});

/* ======================= B30 SEED THE SLICE (31-5): the turning canopy and its three bare wedges ======================= */
const SLC = { c: [16, 6.6], r: 2.0, n: 8, turn: 11 };
TourRooms.def('umbSlice', {
  title: 'SEED THE SLICE', rule: 'PATCH THE THREE BARE WEDGES', need: 'PATCH THE CANOPY FIRST!',
  make(o, keep, ctx, A, rng) { return shell(keep, A, o, { ledge: 5, stage: [8, 12, 9], station: [10, 8], cage: [15, 10, 3], step: [6, 8, 1] }); },
  enter(play, A, R, kit) { if (!R.won) this.reset(play, A, R); },
  reset(play, A, R) { const rng = ROOM_SEED(play, A), first = Math.floor(rng() * 8); R.bare = [first, (first + 3) % 8, (first + 5) % 8]; R.rot = 0; R.go = false; R.spun = 0; R.flies = []; R.dir = [0, -1]; },
  wedgeAt(R, ang) { const a = ((ang - R.rot) % TAU + TAU) % TAU; return Math.floor(a / (TAU / SLC.n)); },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    if (R.go) { R.rot += TAU / SLC.turn * dt; R.spun += TAU / SLC.turn * dt; if (R.spun >= TAU && R.bare.length) { R.fails = (R.fails || 0) + 1; RKit.raspberry(play, 'A FULL TURN! START AGAIN'); this.reset(play, A, R); return; } }
    const I = (play.player && play.player.umbRaw) || {};
    if (R.mounted) {
      const dx = (I.right ? 1 : 0) - (I.left ? 1 : 0), dy = (I.down ? 1 : 0) - (I.up ? 1 : 0);
      if (dx || dy) R.dir = [dx, dy];
      if (I.actionPressed) { R.flies.push({ a: Math.atan2(R.dir[1], R.dir[0]), u: 0 }); R.go = true; TourKit.sfx('flick', 'kick', { vol: 0.4, pitch: 1.6 }); }
    }
    for (let i = R.flies.length - 1; i >= 0; i--) {
      const f = R.flies[i]; f.u += dt / 0.35; if (f.u < 1) continue;
      R.flies.splice(i, 1);
      const w = this.wedgeAt(R, f.a), k = R.bare.indexOf(w);
      if (k >= 0) { R.bare.splice(k, 1); chime(3 - R.bare.length, true); if (!R.bare.length) { R.mounted = false; TourRooms.win(play, A, R, { text: 'GOOD AS NEW!', coins: 5 }); return; } }
      else { R.fails = (R.fails || 0) + 1; RKit.raspberry(play, 'THAT WEDGE WAS FINE: IT BOUNCES OFF'); }
    }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, cx = SLC.c[0] * TS, cy = SLC.c[1] * TS, r = SLC.r * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the canopy seen from above: eight wedges, ink-blue ribs, the hub; bare wedges show the wire frame only
    for (let k = 0; k < SLC.n; k++) {
      const a0 = R.rot + k * TAU / SLC.n, a1 = a0 + TAU / SLC.n, bare = R.bare && R.bare.indexOf(k) >= 0;
      ctx.fillStyle = bare ? 'rgba(255,240,216,0.35)' : (k % 2 ? UA.GOLD : UA.GOLD_L);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fill();
      if (bare) { ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = UA.CORAL; ctx.stroke(); ctx.restore(); }
    }
    ctx.strokeStyle = UA.NAVY; ctx.lineWidth = 3; for (let k = 0; k < SLC.n; k++) { const a = R.rot + k * TAU / SLC.n; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    for (let k = 0; k < SLC.n; k++) { const a = R.rot + k * TAU / SLC.n; UA.rivet(ctx, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 4); }
    UA.rivet(ctx, cx, cy, 9);
    // the pointer from the hub (the stick's direction) and the patches in flight
    if (R.mounted) { const a = Math.atan2(R.dir[1], R.dir[0]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14); ctx.lineTo(cx + Math.cos(a) * (r * 0.7), cy + Math.sin(a) * (r * 0.7)); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75, 6, 0, TAU); ctx.fill(); }
    for (const f of R.flies || []) { const d = 14 + f.u * (r * 0.62 - 14); ctx.fillStyle = UA.CORAL; ctx.save(); ctx.translate(cx + Math.cos(f.a) * d, cy + Math.sin(f.a) * d); ctx.rotate(f.a); ctx.fillRect(-8, -6, 16, 12); ctx.strokeStyle = INK; ctx.strokeRect(-8, -6, 16, 12); ctx.restore(); }
    // the turn clock: a little arc of the turn used so far
    if (R.go && !R.won) { ctx.strokeStyle = 'rgba(255,90,90,0.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, r + 10, -Math.PI / 2, -Math.PI / 2 + R.spun); ctx.stroke(); }
    ctx.restore();
    if (!R.won && !(play.bannerT > 0) && !R.ruleWait) { hud(play, ctx, 'BARE WEDGES LEFT: ' + (R.bare ? R.bare.length : 3)); }
  },
  testWin(g, A, R, kit, frame) {
    R.mounted = true; const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    for (let n = 0; n < 3000 && !R.won; n++) {
      // flick when some direction will meet a bare wedge on arrival
      let pick = null; for (const d of dirs) { const a = Math.atan2(d[1], d[0]), w = this.wedgeAt({ rot: R.rot + TAU / SLC.turn * 0.36 }, a), mid = (((a - R.rot - TAU / SLC.turn * 0.36) % (TAU / 8)) + TAU / 8) % (TAU / 8); if (R.bare.indexOf(w) >= 0 && mid > 0.12 && mid < TAU / 8 - 0.12 && !R.flies.length) { pick = d; break; } }
      if (pick) { frame(g, { right: pick[0] > 0, left: pick[0] < 0, down: pick[1] > 0, up: pick[1] < 0 }); frame(g, { right: pick[0] > 0, left: pick[0] < 0, down: pick[1] > 0, up: pick[1] < 0, action: true, actionPressed: true }); }
      else frame(g, {});
    }
  }
});

/* ======================= MISSING RIB (31-6): turn the umbrella under the rain, tuck the patch ======================= */
// (the test shower is mirrored: the door on the right, the cage up on the left)
const RIBR = { c: [12.5, 5.9], r: 1.9, n: 8 };
TourRooms.def('umbRib', {
  title: 'MISSING RIB', rule: 'TURN THE LEAK TO THE TOP, THEN THROW', need: 'MEND THE UMBRELLA FIRST!',
  make(o, keep, ctx, A, rng) { return shell(keep, A, o, { ledge: 6, stage: [9, 17, 9], shelf: true, station: [13, 8], cage: [21, 8, 3], step: [6, 8, 2], mirror: true }); },
  enter(play, A, R, kit) { if (!R.won) { R.round = R.round || 0; this.start(play, A, R); } },
  start(play, A, R) { const rng = ROOM_SEED(play, A); R.turn = 0; R.show = 0; R.leak = 1 + Math.floor(rng() * 7); R.cool = 0; },
  // which wedge is at the top (under the patch) now
  top(R) { return ((R.leak - R.turn) % RIBR.n + RIBR.n) % RIBR.n === 0; },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    if (R.cool > 0) R.cool -= dt;
    R.show = approach(R.show || 0, R.turn, dt * 6);
    const I = (play.player && play.player.umbRaw) || {};
    if (!R.mounted) return;
    if (R.cool <= 0 && (I.left || I.right)) { R.turn += I.right ? 1 : -1; R.cool = 0.28; TourKit.sfx('tick', 'select', { vol: 0.3, pitch: 1.3 }); }
    if (I.actionPressed) {
      if (this.top(R) && Math.abs(R.show - R.turn) < 0.2) { R.round++; chime(R.round, true); UK.say(play, RIBR.c[0] * TS, (RIBR.c[1] - RIBR.r - 0.8) * TS, R.round >= 2 ? 'BONE DRY!' : 'TUCKED! AND ANOTHER...', UA.GOLD_L, 'room'); if (R.round >= 2) { R.mounted = false; TourRooms.win(play, A, R, { text: 'A FULL SET OF RIBS!', coins: 6 }); return; } R.leak = (R.leak + 3) % RIBR.n || 5; R.turn = 0; R.show = 0; }
      else { R.fails = (R.fails || 0) + 1; RKit.raspberry(play, 'THE PATCH SLIPS OFF: THE DROPS ARE COMING THROUGH ELSEWHERE'); }
    }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, cx = RIBR.c[0] * TS, cy = RIBR.c[1] * TS, r = RIBR.r * TS, n = RIBR.n, rot = -(R.show || 0) * TAU / n;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    // the shower rose overhead and its rain
    // the umbrella seen from underneath (the building blocks' radial ribs with the crossing collar), held up by Brady
    const leakA = rot + (R.leak + 0.5) * TAU / n - Math.PI / 2;
    for (let k = 0; k < n; k++) { const a0 = rot + k * TAU / n - Math.PI / 2 - TAU / n / 2 + TAU / n / 2, a1 = a0 + TAU / n; ctx.fillStyle = k === R.leak ? '#e8c890' : (k % 2 ? UA.GOLD : UA.GOLD_D); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = UA.NAVY; ctx.lineWidth = 3.4; for (let k = 0; k < n; k++) { const a = rot + k * TAU / n - Math.PI / 2; if (k === R.leak) continue; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.stroke(); }
    // the missing rib: a stub, the wedge sagging (lighter), and the drops coming through it
    { const a = rot + R.leak * TAU / n - Math.PI / 2; ctx.strokeStyle = UA.NAVY; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r * 0.35, cy + Math.sin(a) * r * 0.35); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    UA.rivet(ctx, cx, cy, 9);
    for (let q = 0; q < 4; q++) { const ph = (t * 1.4 + q / 4) % 1, d = r * (0.45 + 0.4 * ((q * 37) % 10) / 10); UA.drop(ctx, cx + Math.cos(leakA) * d, cy + Math.sin(leakA) * d + ph * 2.2 * TS, 3.5); }
    // the patch, held over the top wedge (where THROW tucks it)
    const k2 = 0.5 + 0.5 * Math.sin(t * 6); ctx.fillStyle = UA.CORAL; ctx.save(); ctx.translate(cx, cy - r * 0.62 - 4 * k2); ctx.fillRect(-14, -9, 28, 18); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(-14, -9, 28, 18); ctx.setLineDash([3, 3]); ctx.strokeRect(-10, -5, 20, 10); ctx.setLineDash([]); ctx.restore();
    ctx.strokeStyle = `rgba(255,216,74,${0.4 + 0.4 * k2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r + 6, -Math.PI / 2 - TAU / n / 2, -Math.PI / 2 + TAU / n / 2); ctx.closePath(); ctx.stroke();
    // the shaft down to Brady's hands
    const [sx, sy] = kit.data.station; ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sx * TS + TS / 2, sy * TS - 4); ctx.stroke(); ctx.strokeStyle = '#a0a8c0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sx * TS + TS / 2, sy * TS - 4); ctx.stroke();
    ctx.restore();
    if (!R.won && !(play.bannerT > 0) && !R.ruleWait) { hud(play, ctx, 'UMBRELLA ' + Math.min(2, (R.round || 0) + 1) + ' OF 2'); }
  },
  testWin(g, A, R, kit, frame) { R.mounted = true; for (let n = 0; n < 2 && !R.won; n++) { for (let k = 0; k < 40 && !this.top(R); k++) { frame(g, { right: true }); for (let q = 0; q < 40; q++) frame(g, {}); } for (let q = 0; q < 40; q++) frame(g, {}); frame(g, { action: true, actionPressed: true }); frame(g, {}); } }
});

/* ---------------- the words in turn: the title alone (1.5 s), then the rule's pill; the room's own lines after ---------------- */
{
  const en0 = TourRooms.enter;
  TourRooms.enter = function (play, A) {
    en0.apply(this, arguments);
    const kit = A.roomKit; if (!isUmb(kit)) return;
    const R = this.state(play, A);
    play.toastT = 0; play.bannerT = Math.max(play.bannerT || 0, 1.5); R.ruleWait = !R.won && !!kit.rule; R.mounted = false;
  };
  const dr0 = TourRooms.draw;
  TourRooms.draw = function (play, ctx) {
    const kit = play.area && play.area.roomKit;
    if (!isUmb(kit) || !(play.bannerT > 0)) return dr0.apply(this, arguments);
    ctx.save(); ctx.globalAlpha = clamp(1 - play.bannerT * 3, 0.15, 1); try { return dr0.apply(this, arguments); } finally { ctx.restore(); }
  };
  const up0 = TourRooms.update;
  TourRooms.update = function (play, dt) {
    const A = play.area, kit = A && A.roomKit;
    if (isUmb(kit)) { const R = this.state(play, A); if (R.ruleWait && !(play.bannerT > 0)) { R.ruleWait = false; play.toast(kit.rule); } }
    return up0.apply(this, arguments);
  };
}
// the camera in a room: the whole room's width in view, the stage band in the middle
{
  const vr0 = Play.prototype.viewRows;
  Play.prototype.viewRows = function () {
    const A = this.area;
    if (A && isUmb(A.roomKit)) { const gr = Game.gameRect; if (gr && gr.w > gr.h * 1.3) return Math.max(12, Math.min(A.H, A.W / (gr.w / gr.h))); return A.H; }
    return vr0.call(this);
  };
  TourHooks.on('camera', (play) => {
    const A = play.area; if (!(A && isUmb(A.roomKit))) return;
    play.camY = Math.max(0, A.H * TS - Game.viewH);
    const maxX = Math.max(0, A.W * TS - Game.viewW), p = play.player;
    play.camX = maxX <= 2 ? 0 : clamp((p ? p.cx : 0) - Game.viewW / 2, 0, maxX);
  });
}
Tour.umbRooms = true;
})();
