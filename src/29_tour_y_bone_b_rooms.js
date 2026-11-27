/* ============================================================
   THE SPARE BONE QUARRY: the secret rooms (world 37), one per stage, B56 to B60 of the relay (docs/design/
   CHATGPT_RELAY.md §B, the trick rooms), every one a different game in a different place:
     boneGiant  37-1 RESERVED FOR A GIANT   the great hall's height chart says you're too short: stand under the bar
                                            and JUMP: it measures the top of your jump
     boneQueue  37-2 THE BACK OF THE QUEUE  cardboard skeletons queue at a closed counter: walk behind the last one
                                            and THROW to lift its hinged ribcage coat: the only open hatch
     boneOrder  37-3 OUT OF ORDER           the cast dispenser's blank placard hides the real slot: bump it from
                                            below, then take the prize behind it
     boneFish   37-4 NO FISHING             a wooden fish holds a line out of the tar pool: from the dry end, jump on
                                            its float and the fish reels BRADY in
     boneJar    37-5 THE CLEARLY EMPTY JAR  three EMPTY jars, one with a bump under its paper liner: THROW to turn it
                                            upside down and catch what falls out of the lid
   Every room fits one landscape phone view (20 tiles of play, the floor raised into the middle band, the camera
   held still), shows its rule in motion as Brady comes in, and opens its prize cage at the moment it is won. A miss
   costs nothing: the turn resets. The checker sees each room's game as a virtual key on the spot where it is won.
   ============================================================ */
(function () {
if (typeof TourRooms === 'undefined') return;
const K = Tour.boneKit, INK = K.INK, BA = K.BoneArt, BONE = K.BONE, PERS = K.PERS, PETROL = K.PETROL, RK = TourRoomKit;
const Y = 8, F = 9;   // the row Brady stands on, the floor's top row
// the shared frame: a 28 x 14 room, play between columns 1 and 21, the way in at the left, the cage at the right
function frame(keep, A, o, opts) {
  opts = opts || {};
  const g = RK.room(28, 14, F);
  g.fill(22, 1, 26, Y, '#');
  if (opts.roof) g.fill(1, 1, 21, opts.roof, '#');
  const x0 = g.west(keep, Y);
  g.cage(A.id, opts.cageX || 17, Y, RK.prize(o, keep), { w: 3, h: opts.cageH || 4 });
  return { g, x0 };
}
const fail = (play, txt) => { TourKit.sfx('fizz', 'bump', { vol: 0.5, pitch: 0.6 }); const p = play.player; if (p) play.parts.text(p.cx, p.y - 24, txt, '#ffb0a0'); };
// the room's counter / hint line in its one fixed spot (after the title banner)
const hud = (play, ctx, str) => { if (play.bannerT > 0) return; TourRooms.hudText(play, ctx, str, '#ffd88a', 13, 0); };
// the camera holds still on the room (the play band in the middle of a landscape phone view)
{
  const uc0 = Play.prototype.updateCamera;
  Play.prototype.updateCamera = function (dt) {
    const r = uc0.call(this, dt), A = this.area;
    if (A && A.bone && A.bone.room) { this.camX = clamp(11.5 * TS - Game.viewW / 2, 0, Math.max(0, A.W * TS - Game.viewW)); this.camY = clamp(1 * TS, 0, Math.max(0, A.H * TS - Game.viewH)); }
    return r;
  };
  const ct0 = Play.prototype.camTargetY;
  Play.prototype.camTargetY = function (snap) { const A = this.area; if (A && A.bone && A.bone.room) return clamp(1 * TS, 0, Math.max(0, A.H * TS - Game.viewH)); return ct0.call(this, snap); };
}
// the room's own props take THROW where Brady touches them (the land's claim in 29_tour_y_bone_a_mech.js)
class BoneRoomProp extends Ent {
  constructor(g, s) { super(g, s, (s.w || 1) * TS, (s.h || 2) * TS); this.x = s.x - this.w / 2; this.y = s.y - this.h; this.friendly = true; this.role = s.role; this.k = s.k || 0; this.back = true; this.anim = 0; this.flip = 0; }
  boneClaim(p) { return !!this.claims && overlap(p, { x: this.x - 6, y: this.y, w: this.w + 12, h: this.h }); }
  update(dt) { this.t += dt; this.anim = Math.max(0, this.anim - dt); }
  touchPlayer() {}
  draw(ctx) { const R = this.g.area && this.g.area.roomState; const D = DRAW[this.role]; if (D) D(ctx, this, R || {}); }
}
ENTITY_TYPES.boneRoomProp = BoneRoomProp;
const props = (play, role) => play.entities.filter(e => e instanceof BoneRoomProp && e.role === role && !e.remove);
const DRAW = {};

/* ================= boneGiant: RESERVED FOR A GIANT ================= */
const GIANT_X = 10, BAR_ROW = 5;   // the measuring bar: Brady's head must reach the top of row 5 (a full jump does)
TourRooms.def('boneGiant', {
  title: 'RESERVED FOR A GIANT', rule: 'TOO SHORT? STAND UNDER THE BAR AND JUMP: IT MEASURES THE TOP OF YOUR JUMP', need: 'MEASURE UP FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o);
    g.spawn(GIANT_X, Y, 'boneRoomProp', { role: 'chart', w: 3, h: 7 });
    g.winSpot(A.id, GIANT_X, Y);
    g.coins(12, 14, 4);
    return g;
  },
  enter(play, A, R) { R.demo = 2.2; R.air = false; R.top = null; },
  update(play, dt, A, R) {
    if (R.demo > 0) R.demo -= dt;
    if (R.won) return;
    const p = play.player, under = Math.abs(p.cx - (GIANT_X * TS + TS / 2)) < TS * 1.3;
    if (!p.onGround && under) { R.air = true; R.top = Math.min(R.top == null ? 1e9 : R.top, p.y); }
    if (p.onGround && R.air) {
      R.air = false;
      if (R.top <= BAR_ROW * TS) TourRooms.win(play, A, R, { text: 'TALL ENOUGH! (AT THE TOP)', coins: 4 });
      else fail(play, 'TOO SHORT! JUMP HIGHER (HOLD JUMP)');
      R.mark = R.top; R.markT = 1.5; R.top = null;
    }
    if (R.markT > 0) R.markT -= dt;
  }
});
DRAW.chart = (ctx, e, R) => {
  const x = e.cx, y0 = e.y + e.h, t = e.t, barY = BAR_ROW * TS;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  // the post with its height marks: GIANT up top, VERY TALL, then a little "you?" far below
  ctx.fillStyle = '#e8dcc0'; rr(ctx, x - 40, e.y + 4, 14, e.h - 4, 3); ctx.fill(); ctx.stroke();
  for (let yy = e.y + 14; yy < y0 - 4; yy += 16) { ctx.fillStyle = INK; ctx.fillRect(x - 40, yy, 7, 2); }
  ctx.fillStyle = '#fbf4e0'; rr(ctx, x - 24, e.y + 8, 72, 18, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('YOU MUST BE THIS TALL', x + 12, e.y + 17);
  // the bar: a bone on a slider; it drops to the top of Brady's last jump for a moment, then back up
  let by = barY; if (R.markT > 0 && R.mark != null) by = R.won ? barY : lerp(barY, R.mark, Math.min(1, R.markT));
  if (R.demo > 0) by = barY + Math.abs(Math.sin(t * 3)) * 0;
  BA.bone(ctx, x - 34, by, x + 30, by, 10, true);
  ctx.fillStyle = R.won ? '#3a8a4a' : PERS; ctx.font = '9px ' + FONT_DISPLAY; ctx.fillText(R.won ? 'GIANT!' : 'GIANT', x + 50, by);
  // the demo in motion: a ghost of Brady jumps up under the bar and touches it with his bun
  if (R.demo > 0 && !R.won) {
    const k = Math.abs(Math.sin((2.2 - R.demo) * 2.4)), gy = y0 - k * 3.4 * TS;
    ctx.globalAlpha = 0.45; ctx.fillStyle = '#ffffff'; rr(ctx, x - 9, gy - 54, 18, 54, 6); ctx.fill(); ctx.beginPath(); ctx.arc(x, gy - 58, 6, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
  // a dashed line where his head reached last time
  if (R.markT > 0 && R.mark != null && !R.won) { ctx.strokeStyle = '#ffb0a0'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x - 30, R.mark); ctx.lineTo(x + 30, R.mark); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
};

/* ================= boneQueue: THE BACK OF THE QUEUE ================= */
const Q_X = [8, 10, 12, 14], COUNTER_X = 6;
TourRooms.def('boneQueue', {
  title: 'THE BACK OF THE QUEUE', rule: 'THE COUNTER IS CLOSED. FIND THE ONE OPEN HATCH (THROW TO LIFT A COAT)', need: 'FIND THE OPEN HATCH FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o);
    g.spawn(COUNTER_X, Y, 'boneRoomProp', { role: 'counter', w: 2, h: 3 });
    Q_X.forEach((x, k) => g.spawn(x, Y, 'boneRoomProp', { role: 'cutout', k, w: 1, h: 3 }));
    g.winSpot(A.id, 15, Y);
    return g;
  },
  enter(play, A, R) { R.demo = 2; for (const e of play.entities) if (e instanceof BoneRoomProp) e.claims = true; },
  update(play, dt, A, R) {
    if (R.demo > 0) R.demo -= dt;
    const I = play.boneIn; if (!I || !I.pressed || R.won) return;
    const e = I.by, p = play.player;
    if (!(e instanceof BoneRoomProp)) return;
    if (e.role === 'counter') { fail(play, 'CLOSED! THE QUEUE STARTS AT THE BACK'); e.anim = 0.5; return; }
    const last = e.k === Q_X.length - 1;
    if (last && p.cx > e.cx + 4) { e.flip = 1; TourRooms.win(play, A, R, { text: 'AN OPEN HATCH! (BEHIND THE LAST ONE)', coins: 4 }); }
    else { e.anim = 0.6; fail(play, last ? 'FROM THE BACK, PLEASE' : 'NO PUSHING IN!'); }
  }
});
DRAW.counter = (ctx, e, R) => {
  const x = e.x, y = e.y, w = e.w, h = e.h, sh = e.anim > 0 ? Math.sin(e.t * 50) * 2 : 0;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x - 4, y + 34, w + 8, h - 34); ctx.strokeRect(x - 4, y + 34, w + 8, h - 34);
  ctx.fillStyle = '#c8b898'; ctx.fillRect(x + sh, y - 10, w, 44); ctx.strokeRect(x + sh, y - 10, w, 44);
  ctx.strokeStyle = '#8a7a5a'; for (let yy = y - 4; yy < y + 32; yy += 6) { ctx.beginPath(); ctx.moveTo(x + 2 + sh, yy); ctx.lineTo(x + w - 2 + sh, yy); ctx.stroke(); }
  ctx.fillStyle = '#c83a2a'; rr(ctx, x + 6 + sh, y + 4, w - 12, 16, 3); ctx.fill(); ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.font = '8px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CLOSED', x + w / 2 + sh, y + 12);
  ctx.restore();
};
DRAW.cutout = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h, t = e.t, last = e.k === Q_X.length - 1, sh = e.anim > 0 ? Math.sin(t * 40) * 3 : 0;
  // cardboard skeleton standees facing the counter (left): each a different invented beast, a stand at the back
  ctx.save(); ctx.translate(x + sh, y); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = '#a8784a'; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(14, -40); ctx.lineTo(10, -40); ctx.lineTo(2, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8c890'; rr(ctx, -12, -86, 24, 86, 5); ctx.fill(); ctx.stroke();
  // the skeleton printed on the front (it faces left: head on the left)
  ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-2, -78); ctx.lineTo(-2, -20); ctx.stroke();
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-2, -64 + k * 9, 8, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke(); }
  ctx.fillStyle = BONE; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(-8 - e.k % 2 * 2, -80, 7, 5 + e.k % 3, -0.2, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-11, -81, 1.4, 0, TAU); ctx.fill();
  // the last one's hinged coat: a flap over its ribcage at the BACK; the demo flaps it once; a win swings it open
  if (last) {
    const open = e.flip ? Math.min(1, (e.flipT = (e.flipT || 0) + 0.02)) : (R.demo > 0 ? Math.max(0, Math.sin((2 - R.demo) * 4)) * 0.25 : 0);
    ctx.save(); ctx.translate(12, -70); ctx.scale(1 - open * 1.6, 1);
    ctx.fillStyle = '#d8a870'; ctx.strokeStyle = INK; ctx.lineWidth = 2; rr(ctx, -2, 0, 12, 44, 3); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (open > 0.3) { ctx.fillStyle = '#2a140a'; rr(ctx, 4, -64, 10, 30, 3); ctx.fill(); ctx.fillStyle = '#ffd88a'; ctx.fillRect(6, -60, 6, 4); }
  }
  ctx.restore();
};

/* ================= boneOrder: OUT OF ORDER ================= */
const SLOT_X = 13, PLAC_X = 16;   // the fake coin slot; the placard hangs in front of the cage
TourRooms.def('boneOrder', {
  title: 'OUT OF ORDER', rule: 'THE CAST DISPENSER IS OUT OF ORDER... OR IS THAT PLACARD JUST LOOSE?', need: 'THE PLACARD IS IN THE WAY!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { cageX: 17 });
    g.spawn(SLOT_X, Y, 'boneRoomProp', { role: 'machine', w: 4, h: 6 });
    g.spawn(PLAC_X, 5, 'boneRoomProp', { role: 'placard', w: 2, h: 1 });
    g.winSpot(A.id, PLAC_X, Y);
    return g;
  },
  enter(play, A, R) { R.demo = 1.6; for (const e of props(play, 'machine')) e.claims = true; },
  update(play, dt, A, R) {
    if (R.demo > 0) R.demo -= dt;
    const p = play.player, I = play.boneIn;
    if (I && I.pressed && I.by && I.by.role === 'machine' && !R.won) { fail(play, 'OUT OF ORDER. (CLUNK.)'); I.by.anim = 0.4; }
    const pl = props(play, 'placard')[0]; if (!pl) return;
    pl.swing = Math.max(0, (pl.swing || 0) - dt / 3);
    // a bump from below: Brady's head comes up into the placard's bottom edge
    if (p.vy < 0 && p.y < pl.y + pl.h + 4 && p.y > pl.y && p.cx > pl.x - 6 && p.cx < pl.x + pl.w + 6 && !(pl.swing > 0.6)) {
      pl.swing = 1; p.vy = Math.max(p.vy, 2 * TS); Sound.play('bump', { vol: 0.6 });
      if (!R.won) TourRooms.win(play, A, R, { text: 'THE REAL SLOT WAS BEHIND IT!', coins: 3 });
    }
  }
});
DRAW.machine = (ctx, e, R) => {
  const x = e.x, y = e.y, w = e.w, h = e.h, sh = e.anim > 0 ? Math.sin(e.t * 50) * 2 : 0;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2;
  ctx.fillStyle = '#7a9a9a'; rr(ctx, x + sh, y, w, h, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8e0e0'; rr(ctx, x + 10 + sh, y + 10, w - 20, h * 0.45, 4); ctx.fill(); ctx.stroke();
  // little plaster casts on display inside the glass
  for (let k = 0; k < 3; k++) BA.print(ctx, x + 26 + k * 26 + sh, y + 40 + (k % 2) * 12, k, 0, 1, '#8a7a6a');
  ctx.fillStyle = '#ffd84a'; rr(ctx, x + w / 2 - 30 + sh, y + h * 0.6, 60, 14, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OUT OF ORDER', x + w / 2 + sh, y + h * 0.6 + 7);
  ctx.fillStyle = '#3a4a4a'; rr(ctx, x + w / 2 - 4 + sh, y + h * 0.78, 8, 14, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.font = '6px ' + FONT_DISPLAY; ctx.fillText('INSERT BONE', x + w / 2 + sh, y + h - 6);
  ctx.restore();
};
DRAW.placard = (ctx, e, R) => {
  // a blank placard on two rings: it swings up (from below) for a moment; the demo nudges it on the way in
  const s = Math.max(e.swing || 0, R.demo > 0 ? Math.abs(Math.sin((1.6 - R.demo) * 5)) * 0.25 : 0), a = -s * 1.9;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = '#5a5a5a'; ctx.beginPath(); ctx.arc(e.x + 8, e.y - 6, 3, 0, TAU); ctx.arc(e.x + e.w - 8, e.y - 6, 3, 0, TAU); ctx.fill();
  ctx.translate(e.x + e.w / 2, e.y - 4); ctx.rotate(a); ctx.scale(1, Math.max(0.15, Math.cos(s * 1.4)));
  ctx.fillStyle = '#fbf4e0'; rr(ctx, -e.w / 2, 0, e.w, e.h + 18, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8dcc0'; ctx.fillRect(-e.w / 2 + 4, e.h + 10, e.w - 8, 4);
  ctx.restore();
};

/* ================= boneFish: NO FISHING ================= */
const DRY1 = 7, POOL0 = 8, POOL1 = 13, ISLE0 = 14;
TourRooms.def('boneFish', {
  title: 'NO FISHING', rule: 'THE TAR WON\'T HOLD YOU. JUMP ON THE FLOAT AND LET THE FISH REEL YOU IN', need: 'GET REELED IN FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o, { roof: 0 });
    // a low rock ceiling over the pool: no jumping across it
    g.fill(POOL0 - 1, 1, POOL1 + 1, 6, '#');
    g.spawn(POOL0, Y, 'boneRoomProp', { role: 'pool', w: POOL1 - POOL0 + 1, h: 1 });
    g.spawn(15, Y, 'boneRoomProp', { role: 'fish', w: 2, h: 2 });
    g.winSpot(A.id, 15, Y);
    return g;
  },
  enter(play, A, R) { R.demo = 2; R.reel = null; },
  update(play, dt, A, R) {
    if (R.demo > 0) R.demo -= dt;
    const p = play.player;
    if (R.reel != null) {
      R.reel += dt; const k = Math.min(1, R.reel / 1.6);
      p.x = lerp(POOL0, ISLE0 + 1, k * k * (3 - 2 * k)) * TS + TS / 2 - p.w / 2; p.vx = 0; p.stunT = 0.05; p.invuln = Math.max(p.invuln, 0.3);
      if (k >= 1) { R.reel = null; if (!R.won) TourRooms.win(play, A, R, { text: 'REELED IN! (THE FISH CAUGHT YOU)', coins: 3 }); }
      return;
    }
    if (!p.onGround || p.groundTy !== F) { R.wasAir = !p.onGround; return; }
    const tx = Math.floor(p.cx / TS);
    if (tx === POOL0 && R.wasAir) { R.reel = 0; TourKit.sfx('reel', 'select', { vol: 0.5, pitch: 1.6 }); play.parts.text(p.cx, p.y - 20, 'A BITE!', '#ffd88a'); }
    else if (tx > POOL0 && tx <= POOL1) { play.burst(p.cx, p.y + p.h, 10, '#2a1a10', 'dust'); fail(play, 'SPLOSH! THE FISH SPITS YOU BACK'); RK.raspberry(play, 'SPLOSH!'); p.x = 4 * TS + TS / 2 - p.w / 2; p.y = F * TS - p.h; p.vx = p.vy = 0; }
    R.wasAir = false;
  }
});
DRAW.pool = (ctx, e, R) => {
  const x = e.x, y = F * TS, w = e.w, t = e.t;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = '#1e1410'; ctx.fillRect(x, y - 4, w, 14); ctx.strokeRect(x, y - 4, w, 14);
  ctx.fillStyle = 'rgba(120,180,200,0.35)'; for (let q = 0; q < 4; q++) { const xx = x + ((t * 20 + q * 60) % w); ctx.fillRect(xx, y - 2, 18, 2); }
  // the float: a persimmon-and-white bobber on the tar by the dry end, the line up to the fish's rod
  const reel = R.reel != null ? Math.min(1, R.reel / 1.6) : 0, fx = lerp(x + TS / 2, (ISLE0 + 1) * TS + TS / 2, reel), fy = y - 6 + Math.sin(t * 3) * 2;
  const p = e.g.player;
  ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(fx, fy - 8); ctx.quadraticCurveTo((fx + 15.5 * TS) / 2, fy - 30 + (R.demo > 0 ? Math.sin(t * 8) * 6 : 0), 15.5 * TS + 10, y - 50); ctx.stroke();
  if (!(reel > 0 && p)) { ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.fillStyle = PERS; ctx.beginPath(); ctx.arc(fx, fy - 4, 6, Math.PI, 0); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(fx, fy - 4, 6, 0, Math.PI); ctx.fill(); ctx.stroke(); }
  ctx.restore();
};
DRAW.fish = (ctx, e, R) => {
  // a wooden replica fish sitting up on its tail on the island, a little rod in its fin
  const x = e.cx, y = e.y + e.h, t = e.t, wink = Math.sin(t * 1.3) > 0.95;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.fillStyle = '#b8743a'; ctx.beginPath(); ctx.ellipse(x, y - 26, 14, 22, 0.15, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 4, y - 6); ctx.lineTo(x - 14, y); ctx.lineTo(x + 8, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#8a4a1e'; for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.arc(x - 2, y - 28 + q * 7, 8, 0.3, 2.8); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + 2, y - 40, 4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; if (wink) ctx.fillRect(x - 2, y - 41, 8, 2); else { ctx.beginPath(); ctx.arc(x + 1, y - 40, 1.8, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 10, y - 24); ctx.lineTo(x - 2, y - 52); ctx.stroke();
  ctx.restore();
};

/* ================= boneJar: THE CLEARLY EMPTY JAR ================= */
const JAR_X = [8, 11, 14];
TourRooms.def('boneJar', {
  title: 'THE CLEARLY EMPTY JAR', rule: 'THREE EMPTY JARS. ONE HAS A BUMP UNDER ITS LABEL: THROW TO TIP IT, CATCH WHAT FALLS OUT', need: 'CATCH IT FIRST!',
  make(o, keep, ctx, A, rng) {
    const { g } = frame(keep, A, o);
    const odd = o.odd != null ? o.odd : 1;
    JAR_X.forEach((x, k) => g.spawn(x, Y, 'boneRoomProp', { role: 'jar', k, w: 1, h: 2, odd: k === odd }));
    g.data.odd = odd;
    g.winSpot(A.id, JAR_X[odd], Y);
    return g;
  },
  enter(play, A, R) { R.demo = 1.8; R.drop = null; for (const e of props(play, 'jar')) e.claims = true; },
  update(play, dt, A, R, kit) {
    if (R.demo > 0) R.demo -= dt;
    const p = play.player, I = play.boneIn;
    for (const e of props(play, 'jar')) { if (e.tip > 0) { e.tip -= dt; if (e.tip <= 0 && !(R.won && e.s.odd)) e.flip = 0; } }
    if (R.drop) {
      // the key out of the lid: up in an arc and down 3 tiles along; catch it before it reaches the floor
      const D = R.drop; D.t += dt; const k = D.t / 1.4;
      D.x = lerp(D.x0, D.x1, Math.min(1, k)); D.y = D.y0 - Math.sin(Math.min(1, k) * Math.PI) * 2.2 * TS + k * k * 1.2 * TS;
      if (Math.abs(p.cx - D.x) < 22 && Math.abs(p.cy - D.y) < 34) { R.drop = null; TourRooms.win(play, A, R, { text: 'CAUGHT IT! NOT SO EMPTY', coins: 4 }); return; }
      if (k >= 1 || D.y > F * TS - 8) { R.drop = null; fail(play, 'IT ROLLED BACK IN! TRY AGAIN'); for (const e of props(play, 'jar')) if (e.s.odd) { e.flip = 0; e.tip = 0; } }
      return;
    }
    if (!I || !I.pressed || R.won || !(I.by && I.by.role === 'jar')) return;
    const e = I.by; if (e.flip) return;
    e.flip = 1; e.tip = 1.2; TourKit.sfx('clink', 'select', { vol: 0.5, pitch: 1.3 });
    if (e.s.odd) { const dir = p.cx < e.cx ? -1 : 1; R.drop = { t: 0, x0: e.cx, y0: e.y + e.h - 6, x1: e.cx + dir * 3 * TS, x: e.cx, y: e.y }; e.tip = 9; play.parts.text(e.cx, e.y - 20, 'SOMETHING FELL OUT!', '#ffd88a'); }
    else { play.burst(e.cx, e.y + e.h, 8, '#e8dcc0', 'dust'); fail(play, 'CLEARLY EMPTY. (A LITTLE DUST.)'); }
  },
  draw(play, ctx, A, R) {
    if (R.drop) { const D = R.drop; ctx.save(); ctx.translate(D.x, D.y); ctx.rotate(D.t * 8); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(-6, 0, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillRect(0, -2.5, 14, 5); ctx.strokeRect(0, -2.5, 14, 5); ctx.fillRect(9, 2, 3, 5); ctx.restore(); }
  }
});
DRAW.jar = (ctx, e, R) => {
  const x = e.cx, y = e.y + e.h, t = e.t, odd = !!e.s.odd, fl = e.flip ? 1 : 0;
  const wob = odd && R.demo > 0 ? Math.sin(t * 18) * 0.12 : 0;
  ctx.save(); ctx.translate(x, y - 28); ctx.rotate(fl * Math.PI + wob); ctx.strokeStyle = INK; ctx.lineWidth = 2;
  // the glass jar, its screw lid, the paper label EMPTY (the odd one's label bulges over something)
  ctx.fillStyle = 'rgba(200,235,235,0.55)'; rr(ctx, -15, -22, 30, 48, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c8a060'; rr(ctx, -13, -30, 26, 9, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fbf4e0'; ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(14, -6); if (odd) { ctx.lineTo(14, 4); ctx.quadraticCurveTo(4, 14, -2, 4); ctx.lineTo(-14, 6); } else { ctx.lineTo(14, 8); ctx.lineTo(-14, 8); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.font = '7px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('EMPTY', 0, -1);
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(-11, -18, 3, 30);
  ctx.restore();
};

/* the room test's scripted wins (tools/sbw_rooms_test.js calls K.testWin(g, A, R, kit, frame) for a kind it has no
   script for): each plays its game through the room's own entities with the buttons a player uses */
const steps = (g, frame, n, keys) => { for (let k = 0; k < n; k++) frame(g, keys || {}); };
const stand = (g, tx) => { const p = g.player; p.x = tx * TS + TS / 2 - p.w / 2; p.y = F * TS - p.h; p.vx = p.vy = 0; };
TourRooms.kinds.boneGiant.testWin = function (g, A, R, kit, frame) {
  stand(g, GIANT_X); steps(g, frame, 30);
  // a tap: too short (a miss resets the turn), then a full held jump
  frame(g, { jump: true, jumpPressed: true }); steps(g, frame, 110);
  frame(g, { jump: true, jumpPressed: true }); steps(g, frame, 60, { jump: true }); steps(g, frame, 120);
};
TourRooms.kinds.boneQueue.testWin = function (g, A, R, kit, frame) {
  stand(g, 13); steps(g, frame, 10); frame(g, { action: true, actionPressed: true }); steps(g, frame, 20);
  stand(g, 15); steps(g, frame, 10); frame(g, { action: true, actionPressed: true }); steps(g, frame, 20);
};
TourRooms.kinds.boneOrder.testWin = function (g, A, R, kit, frame) {
  stand(g, SLOT_X); steps(g, frame, 10); frame(g, { action: true, actionPressed: true }); steps(g, frame, 20);
  stand(g, PLAC_X); steps(g, frame, 10); frame(g, { jump: true, jumpPressed: true }); steps(g, frame, 40, { jump: true }); steps(g, frame, 60);
};
TourRooms.kinds.boneFish.testWin = function (g, A, R, kit, frame) {
  stand(g, 11); steps(g, frame, 4); steps(g, frame, 30);
  stand(g, 6); steps(g, frame, 10); frame(g, { jump: true, jumpPressed: true, right: true }); steps(g, frame, 14, { jump: true, right: true }); for (let q = 0; q < 240 && R.reel == null; q++) frame(g, {}); steps(g, frame, 260);
};
TourRooms.kinds.boneJar.testWin = function (g, A, R, kit, frame) {
  const odd = kit.data.odd, wrong = (odd + 1) % 3;
  stand(g, JAR_X[wrong]); steps(g, frame, 10); frame(g, { action: true, actionPressed: true }); steps(g, frame, 180);
  stand(g, JAR_X[odd] - 1); steps(g, frame, 10); frame(g, { action: true, actionPressed: true });
  for (let q = 0; q < 200 && R.drop && !R.won; q++) { const D = R.drop, p = g.player; p.x = D.x - p.w / 2; frame(g, {}); }
  steps(g, frame, 20);
};
Tour.boneKit.roomRows = frame;
})();
