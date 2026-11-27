/* ============================================================
   THE TABLE SALT SEA: the five secret rooms (CHATGPT_RELAY.md B41-B45, all rhythm games), one per stage, in order.
   Each a 10-25 second game with a rule that reads in two seconds, played in ONE landscape view on a raised stage in
   the middle band (clear of the top bar, the stick and the buttons), each its own place with its own floor, walls and
   arrangement. Every beat has a visible cue: they play with the sound off.
     saltKettle 34-1 THE STOVE ALCOVE  LONG AND SHORT OF IT: the kettle puffs a row of four, dots and ribbons; then
                                       the row's slots light one by one: tap THROW for a dot, hold it for a ribbon.
     saltLamps  34-2 THE LAMP LOFT     HALF-TIME: the lamp flashes; the Grain Wren claps on every flash, the big Cork
                                       claps on every second one (he lifts his hands the flash before). Clap (THROW)
                                       with the Cork, four slow claps in a row; never on the wren's.
     saltMitts  34-3 THE MITT COUNTER  THE OTHER MITT: two oven mitts take turns, the one about to slap lifts first;
                                       JUMP for the left mitt's print, THROW for the right's. Four prints in a row.
     saltRattle 34-4 THE POD PANTRY    FINISH THE RATTLE: a salt shaker rattles on two rings and the third ring stays
                                       empty: THROW on the third. Three turns.
     saltStand  34-5 THE MUSIC STAND   ACCOMPANIST WANTED: a cork dancer steps unevenly across the music stand, each
                                       foot lifting before it lands; THROW as each one lands, with the slow stretch at
                                       the end of her phrase. One whole phrase.
   A miss costs nothing (a raspberry, the turn starts again). The prize cage opens at the win. Each kind scripts its
   own win for tools/sbw_rooms_test.js (testWin). The title comes alone first, then the rule on a pill, then the
   room's counter in one spot under the HUD.
   ============================================================ */
(function () {
if (typeof TourRooms === 'undefined' || !Tour.saltKit) return;
const SK = Tour.saltKit, INK = SK.INK, SA = SK.SaltArt, RK = TourRoomKit;
const chime = (k, ok) => Sound.play('select', { vol: 0.5, pitch: ok === false ? 0.45 : Math.pow(2, [0, 4, 7, 12][k % 4] / 12) });
const tick = k => Sound.play('select', { vol: 0.25, pitch: 1.6 + k * 0.1 });
const W = 28, R1 = 20;   // the playable part is 21 columns: one landscape view (the rest of the 28 is rock)
const WIN = 0.2;         // a press counts within 0.2 s of its beat
// the room's shape: the way in on a raised ledge at the top left (clear of the stick), a stage (top row st) for the
// game, the cage at cx on the stage (or on a higher tier); L: { st, s0, cx, tier: [x, st2], shelf, mark }
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
const hud = (play, ctx, str, col) => { if (play.toastT > 0) return; TourRooms.hudText(play, ctx, str, col, 13, 20); };
const quiet = (play, R) => !(play.bannerT > 0) && !R.ruleWait;
// the mark on the stage: while Brady stands on it the room kind gets the buttons (input: pressed and held)
class SaltRoomMark extends Ent {
  constructor(g, s) { super(g, s, TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true; this.saltProp = true; this.tx = Math.round(this.x / TS); this.fy = Math.round(s.y / TS); this.cue = s.cue || 'THROW'; this.eatJump = !!s.eatJump; }
  room() { const A = this.g.area; return A && A.roomKit ? { A, R: TourRooms.state(this.g, A), K: TourRooms.kinds[A.roomKit.kind] } : null; }
  saltTouch(p) { const r = this.room(); return !!r && !r.R.won && SK.onMark(p, this.tx, this.fy, 0.9); }
  saltInput(p, inp, dt) { const r = this.room(); if (r && r.K.input && quiet(this.g, r.R)) r.K.input(this.g, r.A, r.R, r.A.roomKit, this, p, inp, dt); }
  update(dt) { this.t += dt; }
  touchPlayer() {}
  draw(ctx) { const p = this.g.player, r = this.room(); if (r && !r.R.won) SA.ring(ctx, this.cx, this.fy * TS, this.t, p && this.saltTouch(p), 17); if (p && r && !r.R.won && !this.saltTouch(p)) SA.cue(ctx, this.cx, this.fy * TS - 2.4 * TS, this.t, 'STAND HERE'); }
}
ENTITY_TYPES.saltRoomMark = SaltRoomMark;
const P = play => play.player;
const mk = (g, x, y, o) => g.spawn(x, y, 'saltRoomMark', o || {});
const markX = play => { const m = play.entities.find(e => e instanceof SaltRoomMark); return m ? m.cx : 0; };
const onIt = play => { const m = play.entities.find(e => e instanceof SaltRoomMark), p = P(play); return !!(m && p && m.saltTouch(p)); };
// a press near a beat time (within WIN): the nearest unclaimed beat index, or -1
const near = (beats, t, used) => { let best = -1, bd = WIN; beats.forEach((b, i) => { if (used[i]) return; const d = Math.abs(t - b); if (d <= bd) { bd = d; best = i; } }); return best; };
const pill = (ctx, x, y, s, col) => SA.pill(ctx, x, y, s, col || '#ffffff');
// the testWin helper: step frames, pressing the button(s) at given times of the room's clock (R.t)
const stepTo = (g, R, frame, until, inp) => { for (let q = 0; q < 2400 && R.t < until && !R.won; q++) frame(g, inp || {}); };
// testWin's start: Brady stood on the mark, the title and the rule gone by
const ready = (g, R, frame) => { const m = g.entities.find(e => e instanceof SaltRoomMark), p = g.player; if (m) { p.x = m.cx - p.w / 2; p.y = m.fy * TS - p.h; p.vx = p.vy = 0; } for (let q = 0; q < 120 * 6 && !quiet(g, R); q++) frame(g, {}); for (let q = 0; q < 30; q++) frame(g, {}); };

/* ================= saltKettle: LONG AND SHORT OF IT (the stove alcove) ================= */
// the kettle on its burner on the stage; the row of four puff slots over the stage; the mark left of the kettle
const KET = { mark: 9, kettle: 13, beat: 0.9 };
TourRooms.def('saltKettle', {
  title: 'LONG AND SHORT OF IT', rule: 'TAP FOR A DOT, HOLD FOR A RIBBON', need: 'MATCH THE KETTLE FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 17 });
    mk(g, KET.mark, 7, {}); g.winSpot(A.id, KET.mark, 7); g.coins(14, 16, 5);
    return g;
  },
  enter(play, A, R) { if (!R.won) this.turn(R); },
  turn(R) { const pat = R.pats ? R.pats[(R.fails || 0) % 3] : null; R.pats = R.pats || [[0, 1, 0, 1], [1, 0, 0, 1], [0, 0, 1, 1]]; R.pat = R.pats[(R.fails || 0) % 3]; R.ph = 'demo'; R.t = 0; R.got = []; R.down = -1; R.lk = -1; },
  // the four slots of Brady's turn start at 4 beats + a breath after the demo's start
  slot(R, k) { return 4 * KET.beat + 1.2 + k * KET.beat; },
  input(play, A, R, kit, m, p, inp) {
    if (R.ph !== 'play') return;
    if (inp.actionPressed) { const k = R.got.length; if (k < 4 && Math.abs(R.t - this.slot(R, k)) <= WIN + 0.1) { R.down = R.t; } else this.miss(play, A, R, 'NOT ON ITS SLOT! LISTEN AGAIN'); }
    R.held = !!inp.action;
  },
  miss(play, A, R, why) { R.fails = (R.fails || 0) + 1; RK.raspberry(play, why); this.turn(R); },
  update(play, dt, A, R, kit) {
    if (R.won || !quiet(play, R)) return;
    R.t += dt; if (!onIt(play)) R.held = false;
    if (R.ph === 'demo') { const k = Math.floor(R.t / KET.beat); if (k !== R.lk) { R.lk = k; if (k < 4) tick(R.pat[k]); } if (R.t >= 4 * KET.beat + 1.2 - WIN - 0.1) R.ph = 'play'; return; }
    const k = R.got.length; if (k >= 4) return;
    const s0 = this.slot(R, k);
    // a press is down: it is a ribbon once held 0.45 s, a dot if let go before
    if (R.down >= 0) {
      const held = R.t - R.down;
      if (!R.held || held >= 0.45) { const long = held >= 0.45; if (long !== !!R.pat[k]) { this.miss(play, A, R, R.pat[k] ? 'THAT ONE WAS A RIBBON! HOLD IT' : 'THAT ONE WAS A DOT! JUST A TAP'); return; } R.got.push(long ? 1 : 0); R.down = -1; chime(k, true); if (R.got.length >= 4) TourRooms.win(play, A, R, { text: 'THE KETTLE SINGS ALONG!', coins: 3 }); }
      return;
    }
    if (R.t > s0 + WIN + 0.1) this.miss(play, A, R, 'MISSED ONE! LISTEN AGAIN');
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, y8 = 8 * TS, kx = (KET.kettle + 0.5) * TS;
    // the burner and the cobalt enamel kettle, its spout to the left, steam from it
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.fillStyle = SA.CHAR; ctx.fillRect(kx - 40, y8 - 14, 80, 14); ctx.strokeRect(kx - 40, y8 - 14, 80, 14);
    ctx.fillStyle = '#ff8a3a'; for (let q = -2; q <= 2; q++) { ctx.beginPath(); ctx.moveTo(kx + q * 12 - 4, y8 - 14); ctx.lineTo(kx + q * 12, y8 - 22 - Math.sin(t * 20 + q) * 3); ctx.lineTo(kx + q * 12 + 4, y8 - 14); ctx.fill(); }
    ctx.fillStyle = SA.COBALT; ctx.beginPath(); ctx.ellipse(kx, y8 - 46, 36, 30, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(kx - 30, y8 - 52); ctx.lineTo(kx - 58, y8 - 74); ctx.lineTo(kx - 52, y8 - 78); ctx.lineTo(kx - 24, y8 - 62); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SA.CORK; ctx.beginPath(); ctx.arc(kx, y8 - 78, 7, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(kx + 12, y8 - 56, 8, 14, 0.4, 0, TAU); ctx.fill();
    ctx.restore();
    if (R.won) return;
    // the row of four slots across the top of the band: a dot or a ribbon in each as the kettle puffs it (demo), then
    // Brady's slots light one by one (the lit one pulses gold)
    const x0 = 7 * TS, y = 3.2 * TS;
    for (let k = 0; k < 4; k++) {
      const x = x0 + k * 2.4 * TS, shown = R.ph === 'demo' ? R.t >= k * KET.beat : true, long = R.pat && R.pat[k];
      ctx.save(); ctx.fillStyle = 'rgba(20,14,30,0.72)'; rr(ctx, x - 6, y - 22, 2 * TS + 12, 44, 12); ctx.fill();
      const cur = R.ph === 'play' && R.got.length === k && Math.abs(R.t - this.slot(R, k)) < 0.6;
      if (cur) { ctx.strokeStyle = SA.GOLD; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (shown) { if (long) { rr(ctx, x + 2, y - 7, 2 * TS - 4, 14, 7); ctx.fill(); ctx.stroke(); } else { ctx.beginPath(); ctx.arc(x + TS, y, 9, 0, TAU); ctx.fill(); ctx.stroke(); } }
      if (R.got && R.got[k] != null) { ctx.fillStyle = '#7aff9a'; ctx.beginPath(); ctx.arc(x + 2 * TS - 4, y - 16, 6, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
    // the puff leaving the spout in the demo (the same shape as its slot)
    if (R.ph === 'demo') { const k = Math.floor(R.t / KET.beat), u = (R.t % KET.beat) / KET.beat; if (k < 4) { ctx.save(); ctx.globalAlpha = 1 - u * 0.6; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = 2; const sx = kx - 60 - u * 40, sy = y8 - 84 - u * 60; if (R.pat[k]) { rr(ctx, sx - 30, sy - 7, 60, 14, 7); } else { ctx.beginPath(); ctx.arc(sx, sy, 10, 0, TAU); } ctx.fill(); ctx.stroke(); ctx.restore(); } }
    if (R.ph === 'play' && R.down >= 0) { const k = Math.min(1, (play.t, R.t - R.down) / 0.45); pill(ctx, markX(play), 5.2 * TS, k >= 1 ? 'RIBBON!' : 'HOLDING...', SA.GOLD); }
    hud(play, ctx, R.ph === 'demo' ? 'THE KETTLE PUFFS...' : 'YOUR TURN: ' + R.got.length + ' / 4');
  },
  testWin(g, A, R, kit, frame) {
    ready(g, R, frame);
    for (let n = 0; n < 3 && !R.won; n++) {
      this.turn(R);
      for (let k = 0; k < 4 && !R.won; k++) {
        const s0 = this.slot(R, k); stepTo(g, R, frame, s0);
        frame(g, { action: true, actionPressed: true });
        if (R.pat[k]) stepTo(g, R, frame, s0 + 0.6, { action: true }); else frame(g, {});
        stepTo(g, R, frame, s0 + 0.4);
      }
      for (let q = 0; q < 120 && !R.won; q++) frame(g, {});
    }
  }
});

/* ================= saltLamps: HALF-TIME (the lamp loft) ================= */
// the lamp hangs in the middle of the band; the wren on a perch to its left, the Cork to its right; the mark under the
// lamp on a plank shelf; mirrored (the way in at the top right, the cage on the left)
const LAMP = { beat: 0.75, mark: 10 };
TourRooms.def('saltLamps', {
  title: 'HALF-TIME', rule: 'CLAP WITH THE BIG CORK, NOT THE WREN', need: 'FOUR SLOW CLAPS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 17, shelf: true });
    mk(g, LAMP.mark, 7, {}); g.winSpot(A.id, LAMP.mark, 7);
    mirror(g, []); g.data.mark = W - 1 - LAMP.mark;
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.t = 0; R.n = 0; R.lastOk = -1; } },
  // flash k at k * beat (from 1.0 s); the Cork claps on the even ones
  flashAt: k => 1.0 + k * LAMP.beat,
  input(play, A, R, kit, m, p, inp) {
    if (!inp.actionPressed) return;
    const k = Math.round((R.t - 1.0) / LAMP.beat), d = Math.abs(R.t - this.flashAt(k));
    if (k < 0 || d > WIN) { this.miss(play, R, 'NOT ON A FLASH! WATCH THE CORK'); return; }
    if (k % 2) { this.miss(play, R, 'THAT WAS THE WREN\'S CLAP!'); return; }
    if (k === R.lastOk) return;
    if (R.lastOk >= 0 && k !== R.lastOk + 2) R.n = 0;
    R.lastOk = k; R.n++; chime(R.n - 1, true); R.pop = 0.3;
    if (R.n >= 4) TourRooms.win(play, A, R, { text: 'IN TIME WITH THE CORK!', coins: 3 });
  },
  miss(play, R, why) { R.fails = (R.fails || 0) + 1; R.n = 0; R.lastOk = -1; RK.raspberry(play, why); R.t = 0; },
  update(play, dt, A, R, kit) {
    if (R.won || !quiet(play, R)) return;
    R.t += dt; if (R.pop > 0) R.pop -= dt;
    // a slow clap missed (Brady on the mark, the Cork clapped without him): the count starts again
    const k = Math.round((R.t - 1.0) / LAMP.beat);
    if (R.lastOk >= 0 && k >= R.lastOk + 2 && R.t > this.flashAt(R.lastOk + 2) + WIN + 0.05) { R.n = 0; R.lastOk = -1; }
    if (k !== R.lk && R.t >= this.flashAt(Math.max(0, k)) && k >= 0) { R.lk = k; tick(k % 2 ? 0 : 3); }
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, cx = (W - 1 - LAMP.mark + 0.5) * TS, y = 3.4 * TS;
    const k = Math.round((R.t - 1.0) / LAMP.beat), d = R.t - this.flashAt(k), lit = R.t >= 1.0 && Math.abs(d) < 0.12, even = k % 2 === 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    // the lamp on its chain: a cobalt shade, a big bulb that flashes
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, y - 24); ctx.stroke();
    if (lit) { ctx.fillStyle = 'rgba(255,240,160,0.35)'; ctx.beginPath(); ctx.arc(cx, y, 64, 0, TAU); ctx.fill(); }
    ctx.fillStyle = lit ? '#fff4b0' : '#8a8466'; ctx.beginPath(); ctx.arc(cx, y + 4, 14, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SA.COBALT; ctx.beginPath(); ctx.moveTo(cx - 26, y); ctx.lineTo(cx + 26, y); ctx.lineTo(cx + 12, y - 24); ctx.lineTo(cx - 12, y - 24); ctx.closePath(); ctx.fill(); ctx.stroke();
    // the wren (left): claps her wings on every flash
    const wx = cx - 3.5 * TS, wy = 5.2 * TS, wclap = lit ? 1 : 0;
    ctx.fillStyle = SA.COBALT_D; ctx.fillRect(wx - 3, wy + 10, 6, 7 * TS - wy - 10 + 1.2 * TS); ctx.strokeRect(wx - 3, wy + 10, 6, 1.2 * TS);
    SK.wrenArt(ctx, { dir: 1 }, wx, wy + 16, 'fly', wclap ? 0 : t);
    if (wclap) pill(ctx, wx, wy - 26, 'CLAP', '#cfe0ff');
    // the Cork (right): big; lifts his hands on the odd flash (the tell), claps on the even
    const ox = cx + 3 * TS, oy = 8 * TS - 2, up = R.t >= 1.0 && !even && Math.abs(d) < LAMP.beat * 0.9, clap = lit && even;
    SA.cork(ctx, ox, oy, 48, 66);
    ctx.fillStyle = '#ffffff'; for (const dx of [-9, 9]) { ctx.beginPath(); ctx.arc(ox + dx, oy - 44, 5, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.fillStyle = INK; for (const dx of [-9, 9]) { ctx.beginPath(); ctx.arc(ox + dx, oy - 43, 2.2, 0, TAU); ctx.fill(); }
    const hy = clap ? oy - 76 : up ? oy - 84 : oy - 40, hs = clap ? 0 : up ? 18 : 30;
    ctx.fillStyle = '#ffffff'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(ox + s * hs, hy, 9, 0, TAU); ctx.fill(); ctx.stroke(); }
    if (clap) pill(ctx, ox, oy - 104, 'CLAP!', SA.GOLD);
    ctx.restore();
    if (R.pop > 0) pill(ctx, (W - 1 - LAMP.mark + 0.5) * TS, 5.6 * TS, 'CLAP!', '#7aff9a');
    if (!R.won) hud(play, ctx, 'SLOW CLAPS: ' + R.n + ' / 4');
  },
  testWin(g, A, R, kit, frame) {
    ready(g, R, frame); R.t = 0; R.n = 0; R.lastOk = -1;
    for (let k = 0; k < 8 && !R.won; k += 2) { stepTo(g, R, frame, this.flashAt(k)); frame(g, { action: true, actionPressed: true }); frame(g, {}); }
  }
});

/* ================= saltMitts: THE OTHER MITT (the mitt counter) ================= */
// the counter top over the stage; two oven mitts hang over it, left and right; the row of four prints between them;
// the cage on a higher tier at the right
const MIT = { beat: 1.1, mark: 10 };
TourRooms.def('saltMitts', {
  title: 'THE OTHER MITT', rule: 'JUMP FOR THE LEFT MITT, THROW FOR RIGHT', need: 'FOUR PRINTS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 8, cx: 17, tier: [16, 6] });
    mk(g, MIT.mark, 7, { eatJump: true }); g.winSpot(A.id, MIT.mark, 7);
    return g;
  },
  enter(play, A, R) { if (!R.won) this.turn(R); },
  turn(R) { R.pats = R.pats || [[0, 1, 0, 0], [1, 0, 1, 1], [0, 0, 1, 0]]; R.pat = R.pats[(R.fails || 0) % 3]; R.t = 0; R.got = []; },
  slapAt: k => 1.6 + k * MIT.beat,
  input(play, A, R, kit, m, p, inp) {
    const btn = inp.jumpPressed ? 0 : inp.actionPressed ? 1 : -1; if (btn < 0) return;
    const k = R.got.length; if (k >= 4) return;
    if (Math.abs(R.t - this.slapAt(k)) > WIN) { this.miss(play, R, 'NOT ON THE SLAP!'); return; }
    if (btn !== R.pat[k]) { this.miss(play, R, R.pat[k] ? 'THAT WAS THE RIGHT MITT: THROW' : 'THAT WAS THE LEFT MITT: JUMP'); return; }
    R.got.push(btn); chime(k, true);
    if (R.got.length >= 4) TourRooms.win(play, A, R, { text: 'FOUR PRINTS, NO SMUDGES!', coins: 3 });
  },
  miss(play, R, why) { R.fails = (R.fails || 0) + 1; RK.raspberry(play, why); this.turn(R); },
  update(play, dt, A, R, kit) {
    if (R.won || !quiet(play, R)) return;
    R.t += dt; const k = R.got.length;
    if (k < 4 && R.t > this.slapAt(k) + WIN + 0.05) this.miss(play, R, 'MISSED A SLAP!');
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, y8 = 8 * TS, k = R.got ? R.got.length : 0;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    // the four print spots on a tea towel along the band's top
    for (let q = 0; q < 4; q++) {
      const x = (7.2 + q * 2.2) * TS, y = 3.0 * TS;
      ctx.fillStyle = '#ffffff'; rr(ctx, x - 26, y - 22, 52, 44, 8); ctx.fill(); ctx.stroke();
      if (R.got && R.got[q] != null) { ctx.fillStyle = R.got[q] ? SA.CORK : SA.COBALT; ctx.beginPath(); ctx.ellipse(x, y + 2, 14, 16, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + (R.got[q] ? 14 : -14), y - 6, 6, 9, R.got[q] ? 0.5 : -0.5, 0, TAU); ctx.fill(); }
      else if (q === k && !R.won) { ctx.strokeStyle = SA.GOLD; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.ellipse(x, y + 2, 14, 16, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; }
    }
    // the mitts: cobalt (left, JUMP) and tangerine (right, THROW); the one that slaps next lifts high first
    for (const side of [0, 1]) {
      const mx = side ? 15.2 * TS : 5.6 * TS, my0 = y8 - 1.8 * TS;
      let lift = 0; const s0 = k < 4 && R.pat ? this.slapAt(k) : -9, mine = R.pat && R.pat[k] === side;
      if (mine && !R.won) { const d = s0 - R.t; lift = d > 0 && d < 0.8 ? 1 - Math.abs(d - 0.4) / 0.4 * 0.0 : 0; if (d > 0 && d < 0.8) lift = Math.min(1, (0.8 - d) / 0.4); if (d <= 0.06 && d > -0.15) lift = -0.3; }
      const my = my0 - lift * 1.6 * TS;
      ctx.fillStyle = side ? SA.CORK : SA.COBALT; ctx.beginPath(); ctx.ellipse(mx, my, 26, 32, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(mx + (side ? 26 : -26), my - 8, 10, 16, side ? 0.5 : -0.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(mx - 26, my + 22, 52, 10); ctx.strokeRect(mx - 26, my + 22, 52, 10);
      pill(ctx, mx, my0 + 50, side ? 'THROW' : 'JUMP', side ? SA.CORK_L : '#cfe0ff');
    }
    ctx.restore();
    if (!R.won) hud(play, ctx, 'PRINTS: ' + k + ' / 4');
  },
  testWin(g, A, R, kit, frame) {
    ready(g, R, frame);
    for (let n = 0; n < 2 && !R.won; n++) {
      this.turn(R);
      for (let k = 0; k < 4 && !R.won; k++) { stepTo(g, R, frame, this.slapAt(k)); frame(g, R.pat[k] ? { action: true, actionPressed: true } : { jump: true, jumpPressed: true }); frame(g, {}); }
    }
  }
});

/* ================= saltRattle: FINISH THE RATTLE (the pod pantry) ================= */
// a big salt shaker on a pantry shelf; three rings over it light in turn; the mark on the low stage; mirrored
const RAT = { beat: 0.8, mark: 10 };
TourRooms.def('saltRattle', {
  title: 'FINISH THE RATTLE', rule: 'THROW ON THE EMPTY THIRD RING', need: 'THREE TURNS FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 9, cx: 16 });
    mk(g, RAT.mark, 8, {}); g.winSpot(A.id, RAT.mark, 8);
    mirror(g, []);
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.t = 0; R.n = 0; R.done = -1; } },
  // turn k: rings at 1.0 + k * 3.2 + (0, 1, 2) * beat; the third is Brady's
  ringAt: (k, r) => 1.0 + k * 4 * RAT.beat + r * RAT.beat,
  input(play, A, R, kit, m, p, inp) {
    if (!inp.actionPressed) return;
    const k = Math.max(0, Math.round((R.t - 1.0 - 2 * RAT.beat) / (4 * RAT.beat))), d = Math.abs(R.t - this.ringAt(k, 2));
    if (d > WIN || k === R.done) { this.miss(play, R, R.t < this.ringAt(k, 2) - WIN ? 'TOO SOON! ONLY THE THIRD RING' : 'NOT ON THE RING!'); return; }
    R.done = k; R.n++; R.pop = 0.4; chime(R.n, true);
    if (R.n >= 3) TourRooms.win(play, A, R, { text: 'RATTLED IN TIME!', coins: 3 });
  },
  miss(play, R, why) { R.fails = (R.fails || 0) + 1; RK.raspberry(play, why); R.t = 0; R.n = 0; R.done = -1; },
  update(play, dt, A, R, kit) {
    if (R.won || !quiet(play, R)) return;
    R.t += dt; if (R.pop > 0) R.pop -= dt;
    const k = R.n; if (R.done < k && R.t > this.ringAt(k, 2) + WIN + 0.05 && R.done !== k) this.miss(play, R, 'THE THIRD RING STAYED EMPTY!');
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, cx = (W - 1 - RAT.mark + 0.5) * TS, y9 = 9 * TS, k = R.n || 0;
    const r = [0, 1, 2].map(q => R.t - this.ringAt(k, q));
    const shake = (r[0] > 0 && r[0] < 0.25) || (r[1] > 0 && r[1] < 0.25);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    // the shaker (jiggling on its rattles) on a shelf behind the mark
    const sx = cx + 3.2 * TS + (shake ? Math.sin(t * 60) * 4 : 0), sy = y9 - 0.6 * TS;
    ctx.fillStyle = '#8a5a30'; ctx.fillRect(sx - 40, sy, 80, 10); ctx.strokeRect(sx - 40, sy, 80, 10);
    ctx.fillStyle = 'rgba(220,230,250,0.9)'; rr(ctx, sx - 22, sy - 64, 44, 64, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SA.CRYS; ctx.fillRect(sx - 18, sy - 30, 36, 28);
    ctx.fillStyle = SA.CHAR; ctx.beginPath(); ctx.ellipse(sx, sy - 64, 24, 10, 0, Math.PI, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
    // the three rings across the top of the band: ring 1 and 2 flash with the rattle; ring 3 is dashed and empty, it
    // fills with Brady's THROW (gold) as its turn comes round
    for (let q = 0; q < 3; q++) {
      const x = (8 + q * 3) * TS, y = 3.3 * TS, lit = r[q] > -0.05 && r[q] < 0.25, soon = q === 2 && r[2] > -0.8 && r[2] < 0.25;
      ctx.save(); ctx.strokeStyle = q === 2 ? (soon ? SA.GOLD : '#ffffff') : INK; ctx.lineWidth = q === 2 ? 4 : 3;
      ctx.fillStyle = 'rgba(20,14,30,0.7)'; ctx.beginPath(); ctx.arc(x, y, 30, 0, TAU); ctx.fill();
      if (q === 2) ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.arc(x, y, 24 + (lit ? 4 : 0), 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      if (lit && q < 2) { ctx.fillStyle = SA.CRYS; for (let n = 0; n < 6; n++) { const a = n / 6 * TAU + t * 4; ctx.fillRect(x + Math.cos(a) * 14 - 2, y + Math.sin(a) * 14 - 2, 5, 5); } }
      if (q === 2 && R.pop > 0) { ctx.fillStyle = SA.GOLD; ctx.beginPath(); ctx.arc(x, y, 18, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    if (!R.won) hud(play, ctx, 'TURNS: ' + k + ' / 3');
  },
  testWin(g, A, R, kit, frame) {
    ready(g, R, frame); R.t = 0; R.n = 0; R.done = -1;
    for (let k = 0; k < 3 && !R.won; k++) { stepTo(g, R, frame, this.ringAt(k, 2)); frame(g, { action: true, actionPressed: true }); frame(g, {}); }
  }
});

/* ================= saltStand: ACCOMPANIST WANTED (the music stand) ================= */
// a cork dancer steps across a big music stand over the stage; each foot lifts (0.35 s) before it lands; the last step
// is a slow stretch. The mark at the stage's left; two tiers (the cage high on the right)
const STEPS = [0, 0.7, 1.05, 1.75, 2.1, 2.8, 4.2];
TourRooms.def('saltStand', {
  title: 'ACCOMPANIST WANTED', rule: 'THROW EACH TIME A FOOT LANDS', need: 'ONE WHOLE PHRASE FIRST!',
  make(o, keep, ctx, A, rng) {
    const g = stageRoom(keep, A, o, { st: 9, cx: 17, tier: [16, 7] });
    mk(g, 8, 8, {}); g.winSpot(A.id, 8, 8);
    return g;
  },
  enter(play, A, R) { if (!R.won) { R.t = 0; R.used = []; } },
  landAt: k => 1.4 + STEPS[k],
  input(play, A, R, kit, m, p, inp) {
    if (!inp.actionPressed) return;
    const i = near(STEPS.map((_, k) => this.landAt(k)), R.t, R.used);
    if (i < 0) { this.miss(play, R, 'NO FOOT LANDED THEN!'); return; }
    if (R.used.filter(Boolean).length !== i) { this.miss(play, R, 'MISSED A STEP!'); return; }
    R.used[i] = true; chime(i, true); R.pop = 0.3;
    if (R.used.filter(Boolean).length >= STEPS.length) TourRooms.win(play, A, R, { text: 'SHE TAKES A BOW!', coins: 4 });
  },
  miss(play, R, why) { R.fails = (R.fails || 0) + 1; RK.raspberry(play, why); R.t = 0; R.used = []; },
  update(play, dt, A, R, kit) {
    if (R.won || !quiet(play, R)) return;
    R.t += dt; if (R.pop > 0) R.pop -= dt;
    const n = R.used.filter(Boolean).length;
    if (n < STEPS.length && R.t > this.landAt(n) + WIN + 0.05) this.miss(play, R, 'A FOOT LANDED ALONE!');
  },
  draw(play, ctx, A, R, kit) {
    const t = play.t, n = R.used ? R.used.filter(Boolean).length : 0;
    // the music stand: a wide tilted desk with staves; the dancer walks along its ledge
    const x0 = 6.5 * TS, x1 = 15 * TS, ly = 5.2 * TS;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.fillStyle = SA.CHAR; ctx.fillRect((x0 + x1) / 2 - 4, ly, 8, 9 * TS - ly); ctx.fillRect((x0 + x1) / 2 - 30, 9 * TS - 8, 60, 8);
    ctx.fillStyle = '#f6f2e8'; ctx.beginPath(); ctx.moveTo(x0, ly); ctx.lineTo(x1, ly); ctx.lineTo(x1 - 14, ly - 2.4 * TS); ctx.lineTo(x0 + 14, ly - 2.4 * TS); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,40,60,0.45)'; ctx.lineWidth = 1.2; for (let q = 0; q < 5; q++) { const y = ly - 0.5 * TS - q * 7; ctx.beginPath(); ctx.moveTo(x0 + 20, y); ctx.lineTo(x1 - 20, y); ctx.stroke(); }
    ctx.fillStyle = SA.CHAR; ctx.fillRect(x0 - 6, ly, x1 - x0 + 12, 8);
    // the cork dancer: her position follows the steps; the next foot lifts in the 0.35 s before it lands
    const k = Math.min(STEPS.length - 1, n), land = this.landAt(k), d = land - R.t, prog = (n + clamp(1 - d / 0.7, 0, 1)) / STEPS.length;
    const dx = lerp(x0 + 30, x1 - 30, Math.min(1, prog)), fy = ly - 2;
    const lifting = d > 0 && d < (k === STEPS.length - 1 ? 1.0 : 0.35), foot = k % 2;
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    for (const s of [0, 1]) { const up = lifting && s === foot; ctx.beginPath(); ctx.moveTo(dx + (s ? 6 : -6), fy - 26); ctx.lineTo(dx + (s ? 10 : -10) + (up ? 8 : 0), fy - (up ? 16 : 0)); ctx.stroke(); }
    SA.cork(ctx, dx, fy - 24, 26, 34, Math.sin(t * 3) * 0.08);
    ctx.fillStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dx - 18, fy - 30); ctx.lineTo(dx + 18, fy - 30); ctx.lineTo(dx + 10, fy - 40); ctx.lineTo(dx - 10, fy - 40); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(dx - 5, fy - 48, 2, 0, TAU); ctx.arc(dx + 5, fy - 48, 2, 0, TAU); ctx.fill();
    if (lifting) pill(ctx, dx + (foot ? 26 : -26), fy - 26, k === STEPS.length - 1 ? 'S-T-R-E-T-C-H...' : 'LIFT', '#ffffff');
    ctx.restore();
    // the phrase's footprints along the ledge: done ones gold
    for (let q = 0; q < STEPS.length; q++) { ctx.save(); ctx.fillStyle = q < n ? SA.GOLD : 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(lerp(x0 + 30, x1 - 30, (q + 1) / STEPS.length), ly + 18, 6, 4, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    if (R.pop > 0) pill(ctx, markX(play), 6.2 * TS, 'TAP!', '#7aff9a');
    if (!R.won) hud(play, ctx, 'STEPS: ' + n + ' / ' + STEPS.length);
  },
  testWin(g, A, R, kit, frame) {
    ready(g, R, frame); R.t = 0; R.used = [];
    for (let k = 0; k < STEPS.length && !R.won; k++) { stepTo(g, R, frame, this.landAt(k)); frame(g, { action: true, actionPressed: true }); frame(g, {}); }
  }
});

// a salt room's words in turn: the title alone (about 1.5 s), then the rule's pill; the room's lines after that
{
  const en0 = TourRooms.enter;
  TourRooms.enter = function (play, A) {
    en0.apply(this, arguments);
    const kit = A.roomKit; if (!(kit && /^salt/.test(kit.kind))) return;
    const R = this.state(play, A);
    play.toastT = 0; play.bannerT = Math.max(play.bannerT || 0, 1.5); R.ruleWait = !R.won && !!kit.rule;
  };
  const dr0 = TourRooms.draw;
  TourRooms.draw = function (play, ctx) {
    const kit = play.area && play.area.roomKit;
    if (!(kit && /^salt/.test(kit.kind)) || !(play.bannerT > 0)) return dr0.apply(this, arguments);
    ctx.save(); ctx.globalAlpha = clamp(1 - play.bannerT * 3, 0.15, 1); try { return dr0.apply(this, arguments); } finally { ctx.restore(); }
  };
  const up0 = TourRooms.update;
  TourRooms.update = function (play, dt) {
    const A = play.area, kit = A && A.roomKit;
    if (kit && /^salt/.test(kit.kind)) { const R = this.state(play, A); if (R.ruleWait && !(play.bannerT > 0)) { R.ruleWait = false; play.toast(kit.rule); } }
    return up0.apply(this, arguments);
  };
}
// the camera in a salt room: the whole room's width in view, the stage band in the middle
TourHooks.on('camera', (play, dt) => {
  const A = play.area; if (!(A && A.roomKit && /^salt/.test(A.roomKit.kind))) return;
  const vw = (R1 + 1) * TS, mir = A.roomKit.data && A.roomKit.data.mirror;
  if (Game.viewW >= vw - 8) play.camX = clamp((mir ? A.W * TS - vw : 0) + (vw - Game.viewW) / 2, 0, Math.max(0, A.W * TS - Game.viewW));
});
{
  const ct0 = Play.prototype.camTargetY;
  Play.prototype.camTargetY = function (snap) { const A = this.area; if (A && A.roomKit && /^salt/.test(A.roomKit.kind)) return clamp(TS, 0, Math.max(0, A.H * TS - Game.viewH)); return ct0.call(this, snap); };
}
Tour.saltKit.Rooms = TourRooms;
})();
