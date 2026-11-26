/* ============================================================
   ITALY: the secret rooms (docs/design/SECRET_ROOMS.md, /home/user/wt/SECRETS_BRIEF.md). Six rooms, no two alike,
   most of them found by curiosity, several leaving by a different way than they were entered:
   14-1 THE BACK-ALLEY TIME TRIAL (new kind itLap): a boost off the first ramp reaches the pigeon loft high over the
        roofs; inside, ride the scooter through three flags in order before the clock runs out. Out through the
        garage's roller door onto the street further on.
   14-2 THE PIZZA ORDER (new kind itPizza): a full dough fling up through the flour vent in the kitchen ceiling, a run
        along the top of the cupboards, the pantry hatch at its end; inside, bump the three toppings on the order
        ticket (a wrong jar burns the pizza). The way on to 14-6 is in here; the door drops back into the kitchen.
   14-3 THE BELL ECHO (new kind itBells): walk into the cracked stretch of wall; the bells ring a tune, ring it back.
        A second door comes out a storey higher.
   14-4 THE OPERA HATS (shell, re-skinned): a column of song rises through a gap in the ceiling into the gantry above
        the house (a real run with sour notes and a spike pit); the royal box is off the gantry; the gantry's end
        drops back into the house by a rope.
   14-5 THE TENOR'S DRESSING ROOM (prank, re-skinned): behind the velvet curtain in the wings.
   14-6 THE BEAN STORE (rush, re-skinned): one pit in the bar has no coffee in it, only soft sacks of beans: drop
        in. Grab the beans in time. The door comes out further along.
   The land's tell is always the same: a pigeon that sits and stares at the secret, coos, and flaps off toward it when
   Brady comes close (in Italy, the pigeons know everything); each spot has one small clue of its own as well.
   ============================================================ */
(function () {
const C = Tour.countries.it;
if (!C) return;
const K = TourKit, IK = Tour.itKit, INK = IK.INK, ItArt = IK.ItArt;

/* ---------------- the tell: a pigeon who stares at the secret ---------------- */
class ItPigeonTell extends Ent {
  constructor(g, s) { super(g, s, 28, 20); this.friendly = true; this.dir = s.dir || 1; this.look = s.look || 'up'; this.hx = this.x; this.hy = this.y; this.state = 'sit'; this.st = 0; this.mode = 'walk'; }
  update(dt) {
    this.t += dt; const p = this.g.player;
    if (this.state === 'sit') {
      this.mode = 'walk';
      if (p && Math.abs(p.cx - this.cx) < 2.5 * TS && Math.abs(p.cy - this.cy) < 3 * TS) { this.state = 'fly'; this.st = 0; K.sfx('flap', 'jump', { vol: 0.2, pitch: 2.4 }); }
      else if (Math.floor(this.t / 2.6) !== Math.floor((this.t - dt) / 2.6) && this.g.onScreen(this)) this.g.parts.text(this.cx + this.dir * 8, this.y - 10, 'COO?', '#ffffff');
    } else if (this.state === 'fly') {
      // it flaps off toward the secret (up, down or ahead), then comes back to its spot
      this.mode = 'fly'; this.st += dt;
      const k = Math.min(1, this.st / 1.2), dy = this.look === 'up' ? -6 : this.look === 'down' ? 3 : -2, dx = this.look === 'ahead' ? 5 : this.dir * 2;
      this.x = this.hx + dx * TS * k; this.y = this.hy + dy * TS * Math.sin(k * Math.PI * (this.look === 'down' ? 0.5 : 1));
      if (this.st > 4) { this.state = 'back'; this.st = 0; }
    } else { this.mode = 'fly'; this.st += dt; this.x = approach(this.x, this.hx, 4 * TS * dt); this.y = approach(this.y, this.hy, 4 * TS * dt); if (this.x === this.hx && this.y === this.hy) this.state = 'sit'; }
  }
  touchPlayer() {}
  draw(ctx) {
    const P = IK.pigeonArt, x = this.cx, y = this.cy, t = this.t;
    Ink.around(ctx, this.x - 10, this.y - 24, this.w + 20, this.h + 30, c => {
      c.save(); c.translate(x, y);
      // sitting: head tipped toward the secret
      if (this.state === 'sit') c.rotate(this.look === 'up' ? -0.35 * this.dir : this.look === 'down' ? 0.35 * this.dir : 0);
      c.translate(-x, -y); P(c, this, x, y, this.mode, t); c.restore();
    }, { pad: 4 });
  }
}
// clue: flour trickling down out of a vent in the ceiling (14-2)
class ItFlourTell extends Ent {
  constructor(g, s) { super(g, s, (s.w || 3) * TS, (s.h || 6) * TS); this.x = s.x - TS / 2; this.y = s.y - this.h; this.back = true; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y, w = this.w, h = this.h, t = this.t;
    ctx.save(); ctx.fillStyle = 'rgba(255,252,240,0.85)';
    for (let k = 0; k < 14; k++) { const ph = (t * 0.6 + k / 14) % 1, px = x + w / 2 + Math.sin(k * 2.3 + t) * w * 0.25; ctx.globalAlpha = 0.9 * (1 - ph); ctx.beginPath(); ctx.arc(px, y + ph * h, 1.6 + (k % 3) * 0.6, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
// the Under-Stage tell for 14-6's sack pit: soft burlap sacks of beans heaped at the bottom, no coffee
class ItSackTell extends Ent {
  constructor(g, s) { super(g, s, (s.w || 3) * TS, TS); this.x = s.x - (s.w || 3) * TS / 2; this.y = s.y - TS; this.back = true; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.x, y = this.y + this.h, w = this.w;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    for (let k = 0; k < 4; k++) { const sx = x + 8 + k * (w - 16) / 3, sy = y - 4 - (k % 2) * 8; ctx.fillStyle = k % 2 ? '#b08a52' : '#c09a62'; ctx.beginPath(); ctx.ellipse(sx, sy, 16, 11, 0.1 * k, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.ellipse(sx - 3, sy - 2, 2.2, 3, 0.5, 0, TAU); ctx.ellipse(sx + 4, sy + 1, 2.2, 3, 0.5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}
// the gantry's rope down into the opera house (the 14-4 loggione's way back): a rope ladder over the hole
class ItRopeTell extends Ent {
  constructor(g, s) { super(g, s, 3 * TS, 3 * TS); this.x = s.x - 1.5 * TS; this.y = s.y - 3 * TS; this.back = true; }
  touchPlayer() {}
  draw(ctx) {
    const x = this.cx, y = this.y, t = this.t;
    ctx.save(); ctx.strokeStyle = '#c8945a'; ctx.lineWidth = 3;
    for (const s of [-8, 8]) { ctx.beginPath(); ctx.moveTo(x + s, y - 2 * TS); ctx.quadraticCurveTo(x + s + Math.sin(t * 2) * 4, y + TS, x + s, y + 4 * TS); ctx.stroke(); }
    for (let k = 0; k < 6; k++) { const yy = y - TS + k * 22; ctx.beginPath(); ctx.moveTo(x - 8, yy); ctx.lineTo(x + 8, yy); ctx.stroke(); }
    ctx.fillStyle = '#ffd24a'; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('↓', x, y - 2.3 * TS);
    ctx.restore();
  }
}
Object.assign(ENTITY_TYPES, { itPigeonTell: ItPigeonTell, itFlourTell: ItFlourTell, itSackTell: ItSackTell, itRopeTell: ItRopeTell });
TourSeams.TELLS.itSackTell = true; TourSeams.TELLS.itRopeTell = true;

// a portal you walk into (no Up needed): the cracked stretch of wall in the tower
{
  const tp0 = Portal.prototype.touchPlayer;
  Portal.prototype.touchPlayer = function (p) {
    if (this.s && this.s.walkIn && !p.dead && p.state === 'play' && p.onGround && (Input.left || Input.right || (p.inp && (p.inp.left || p.inp.right)))) { this.near = true; this.g.enterPortal(this); return; }
    return tp0.call(this, p);
  };
}
// a pigeon-loft door (14-1, high over the roofs)
{
  const dr0 = DoorArt.draw;
  DoorArt.draw = function (ctx, x, y, look, t, near) {
    if (look === 'itLoft') {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#c8945a'; ctx.beginPath(); ctx.moveTo(x - 26, y); ctx.lineTo(x - 26, y - 52); ctx.lineTo(x, y - 70); ctx.lineTo(x + 26, y - 52); ctx.lineTo(x + 26, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = near ? '#1a1410' : '#3a2a1a'; rr(ctx, x - 11, y - 40, 22, 40, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8424a'; ctx.fillRect(x - 26, y - 56, 52, 5);
      for (const hx of [-18, 18]) { ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(x + hx, y - 30, 5, 0, TAU); ctx.fill(); }
      ctx.restore(); return;
    }
    return dr0.call(this, ctx, x, y, look, t, near);
  };
}
// the shell game's cups in the opera: top hats
if (typeof TourRoomArt !== 'undefined' && TourRoomArt.CUPS) TourRoomArt.CUPS.tophat = { body: '#2a2236', band: '#c8283a', w: 30, h: 32 };
// the bean store's tokens: coffee beans
TourMaze.addKeys({ tokBean: { name: 'COFFEE BEAN', col: '#6a3a1e', toast: 'BEAN!', icon: (c, x, y) => { c.fillStyle = '#6a3a1e'; c.beginPath(); c.ellipse(x, y, 7, 10, 0.4, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); c.strokeStyle = '#c8945a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 3, y - 7); c.quadraticCurveTo(x + 3, y, x - 2, y + 8); c.stroke(); } } });

/* ======================= room kinds ======================= */
const RK = () => TourRoomKit;
// a won room: the cage opens at once, even when it is off to the side of the view (it does not wait to be on screen)
const winRoom = (play, A, R, opts) => { TourRooms.win(play, A, R, opts); for (const e of play.entities) if (e instanceof ENTITY_TYPES.roomCage) e.update(0); };
const TOPPINGS = [
  { name: 'TOMATO', col: '#e83a2a', draw(c, x, y) { c.fillStyle = '#e83a2a'; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#4aa84a'; c.fillRect(x - 3, y - 10, 6, 3); } },
  { name: 'MOZZARELLA', col: '#ffffff', draw(c, x, y) { c.fillStyle = '#fffaf0'; c.beginPath(); c.ellipse(x, y, 9, 7, 0, 0, TAU); c.fill(); c.stroke(); } },
  { name: 'BASIL', col: '#4aa84a', draw(c, x, y) { c.fillStyle = '#4aa84a'; c.beginPath(); c.ellipse(x, y, 5, 9, 0.6, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x - 4, y + 6); c.lineTo(x + 4, y - 6); c.stroke(); } },
  { name: 'OLIVE', col: '#2a2a1a', draw(c, x, y) { c.fillStyle = '#3a3a24'; c.beginPath(); c.ellipse(x, y, 7, 9, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#e8424a'; c.beginPath(); c.arc(x, y, 2.5, 0, TAU); c.fill(); } },
  { name: 'MUSHROOM', col: '#d8c0a0', draw(c, x, y) { c.fillStyle = '#e8d8c0'; c.fillRect(x - 3, y - 1, 6, 8); c.strokeRect(x - 3, y - 1, 6, 8); c.fillStyle = '#b08a62'; c.beginPath(); c.arc(x, y, 9, Math.PI, 0); c.closePath(); c.fill(); c.stroke(); } },
  { name: 'PEPPER', col: '#ffd24a', draw(c, x, y) { c.fillStyle = '#ffd24a'; c.beginPath(); c.moveTo(x - 7, y - 6); c.quadraticCurveTo(x + 10, y - 8, x + 6, y + 8); c.quadraticCurveTo(x - 4, y + 4, x - 7, y - 6); c.fill(); c.stroke(); c.fillStyle = '#4aa84a'; c.fillRect(x - 8, y - 9, 3, 4); } }
];

/* ---- itLap: THE BACK-ALLEY TIME TRIAL (14-1). The garage is a scooter room: three flags in order on the clock ---- */
TourRooms.def('itLap', {
  title: 'THE BACK-ALLEY TIME TRIAL', rule: 'RIDE THROUGH THE THREE FLAGS IN ORDER BEFORE THE CLOCK RUNS OUT', need: 'WIN THE TIME TRIAL FIRST!', timed: true,
  make(o, keep, ctx, A, rng) {
    const Kt = RK(), W = 46 + Kt.eastW(keep, o);
    const g = Kt.room(W), Y = Kt.Y;
    const x0 = g.west(keep), x1 = Kt.east(g, keep, A, o);
    // flag 1 on the floor; a crate hop; a shelf with flag 2; a bouncy washing-line patch in the floor that throws
    // Brady up to the high shelf with flag 3; the roller door out next to the cage
    const f1 = [x0 + 5, Y];
    g.fill(x0 + 10, 9, x0 + 11, 10, 'H');
    g.hline(x0 + 14, x0 + 20, 7, '-'); const f2 = [x0 + 17, 6];
    g.hline(x0 + 23, x0 + 25, 11, 'b');
    g.hline(x0 + 27, x0 + 32, 4, '-'); const f3 = [x0 + 30, 3];
    g.coins(x0 + 14, x0 + 20, 5); g.coinsArc(x0 + 22, x0 + 27, 8, 4);
    if (keep.gold) { g.hline(x0 + 2, x0 + 5, 5, '-'); g.put(x0 + 3, 4, '*'); }
    if (o.exit) { g.door(x1 - 1, Y, { to: o.exit, look: 'itGarage' }); g.need('the roller door out', x1 - 1, Y); }
    g.winSpot(A.id, f3[0], f3[1]);
    for (const f of [f1, f2]) g.need('a flag', f[0], f[1]);
    g.data.flags = [f1, f2, f3]; g.data.t = o.t || 11;
    g.dress(keep, [x0 + 7, x1 - 4], Y);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) { R.next = 0; R.left = null; } },
  update(play, dt, A, R, kit) {
    if (R.won) return;
    const p = play.player, F = kit.data.flags;
    const f = F[R.next];
    if (f && overlap(p, { x: f[0] * TS, y: (f[1] - 1) * TS, w: TS, h: 2 * TS })) {
      R.next++; Sound.play('checkpoint', { vol: 0.6, pitch: 1 + R.next * 0.15 }); play.burst(f[0] * TS + 16, f[1] * TS, 12, '#ffd24a', 'confetti');
      if (R.next === 1) R.left = kit.data.t;
      if (R.next >= F.length) { winRoom(play, A, R, { text: 'NEW RECORD!', coins: 8 }); return; }
    }
    if (R.left != null) { R.left -= dt; if (R.left <= 0) { R.left = null; R.next = 0; R.fails = (R.fails || 0) + 1; RK().raspberry(play, 'TOO SLOW! BACK TO FLAG 1'); } }
  },
  draw(play, ctx, A, R, kit) {
    const F = kit.data.flags, t = play.t;
    F.forEach((f, k) => {
      const x = f[0] * TS + TS / 2, y = (f[1] + 1) * TS, done = R.won || k < R.next, cur = !R.won && k === R.next;
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.fillStyle = '#5a5a64'; ctx.fillRect(x - 2, y - 58, 4, 58);
      const wv = Math.sin(t * 8 + k) * 3;
      ctx.fillStyle = done ? '#7ad86a' : cur ? '#ffd24a' : '#e8424a'; ctx.beginPath(); ctx.moveTo(x + 2, y - 58); ctx.quadraticCurveTo(x + 18, y - 52 + wv, x + 28, y - 50); ctx.lineTo(x + 2, y - 40); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.font = TourBackstage.F8; ctx.textAlign = 'center'; ctx.fillText(String(k + 1), x + 13, y - 46);
      if (cur) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 6); ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(x - 8, y - 72); ctx.lineTo(x + 8, y - 72); ctx.lineTo(x, y - 62); ctx.fill(); }
      ctx.restore();
    });
    if (!R.won && R.left != null) TourRooms.clock(play, ctx, Math.max(0, R.left), kit.data.t);
  }
});

/* ---- itPizza: THE PIZZA ORDER (14-2). The ticket shows three toppings: bump those jars (from below) ---- */
TourRooms.def('itPizza', {
  title: 'THE PIZZA ORDER', rule: 'THE TICKET SAYS WHICH THREE TOPPINGS: BUMP THOSE JARS FROM BELOW. NOT THE OTHERS!', need: 'MAKE THE PIZZA FIRST!',
  make(o, keep, ctx, A, rng) {
    const Kt = RK(), W = 34 + Kt.eastW(keep, o);
    const g = Kt.room(W), Y = Kt.Y;
    const x0 = g.west(keep), x1 = Kt.east(g, keep, A, o);
    // six jars on a shelf at row 6, three tiles apart; the oven and the ticket (drawn) between the jars and the cage
    const jars = []; for (let k = 0; k < 6; k++) { const jx = x0 + 2 + k * 3; g.put(jx, 7, 'H'); jars.push(jx); g.need('under a jar', jx, Y); }
    g.hline(x0 + 1, x0 + 18, 4, '-'); g.coins(x0 + 2, x0 + 17, 3);
    if (keep.gold) g.put(x0 + 19, 3, '*');
    g.hline(x0 + 18, x0 + 21, 4, '-');
    g.winSpot(A.id, Math.min(x1 - 2, x0 + 22), Y);
    g.data.jars = jars; g.data.row = 7;
    g.dress(keep, [x1 - 3], Y);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) this.order(play, R); },
  order(play, R) { const L = [0, 1, 2, 3, 4, 5]; for (let k = L.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [L[k], L[j]] = [L[j], L[k]]; } R.order = L.slice(0, 3); R.got = []; R.burnT = 0; },
  // a jar bumped from below (Play.bumpBlock below): right topping onto the pizza, wrong one burns it
  bump(play, A, R, k) {
    if (R.won) return;
    if (R.order.indexOf(k) >= 0) { if (R.got.indexOf(k) < 0) { R.got.push(k); Sound.play('pick', { vol: 0.6 }); play.parts.text(play.player.cx, play.player.y - 20, TOPPINGS[k].name + '!', '#ffffff'); } if (R.got.length >= 3) winRoom(play, A, R, { text: 'PERFETTA!', coins: 6 }); }
    else { R.fails = (R.fails || 0) + 1; R.burnT = 1.2; RK().raspberry(play, 'BURNT! ' + TOPPINGS[k].name + ' WAS NOT ON THE ORDER'); this.order(play, R); }
  },
  update(play, dt, A, R) { if (R.burnT > 0) R.burnT -= dt; },
  draw(play, ctx, A, R, kit) {
    const D = kit.data, t = play.t;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    // the jars: a glass jar on each shelf block, its topping inside, its picture
    D.jars.forEach((jx, k) => {
      const x = jx * TS + TS / 2, y = D.row * TS + TS - 2, on = R.got && R.got.indexOf(k) >= 0;
      ctx.fillStyle = on ? 'rgba(255,240,180,0.9)' : 'rgba(220,240,250,0.85)'; rr(ctx, x - 13, y - 30, 26, 30, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c8ccd4'; ctx.fillRect(x - 11, y - 34, 22, 5); ctx.strokeRect(x - 11, y - 34, 22, 5);
      TOPPINGS[k].draw(ctx, x, y - 14);
    });
    // the order ticket pinned on the wall: the three toppings wanted (ticked when on)
    if (!R.won && R.order) {
      const x = play.camX + Game.viewW - 120, y = TourRooms.hudY(play, 0) + 70;
      ctx.fillStyle = R.burnT > 0 ? '#ffb0a0' : '#fffaf0'; rr(ctx, x - 50, y - 26, 100, 60, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.font = TourBackstage.F7; ctx.textAlign = 'center'; ctx.fillText('ORDER #14', x, y - 14);
      R.order.forEach((k, i) => { const tx = x - 30 + i * 30; TOPPINGS[k].draw(ctx, tx, y + 8); if (R.got.indexOf(k) >= 0) { ctx.strokeStyle = '#2aa84a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx - 8, y + 8); ctx.lineTo(tx - 2, y + 15); ctx.lineTo(tx + 9, y - 1); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6; } });
    }
    ctx.restore();
  }
});
{
  const bb0 = Play.prototype.bumpBlock;
  Play.prototype.bumpBlock = function (tx, ty, big, src) {
    const A = this.area, kit = A && A.roomKit;
    if (kit && kit.kind === 'itPizza' && src === this.player && ty === kit.data.row) { const k = kit.data.jars.indexOf(tx); if (k >= 0) { TourRooms.kinds.itPizza.bump(this, A, TourRooms.state(this, A), k); Sound.play('bump', { vol: 0.4 }); return; } }
    return bb0.apply(this, arguments);
  };
}

/* ---- itBells: THE BELL ECHO (14-3). Three bells ring a tune; ring it back by jumping into them ---- */
const BELL_PITCH = [0.7, 0.95, 1.3];
TourRooms.def('itBells', {
  title: 'THE BELL ECHO', rule: 'LISTEN TO THE BELLS, THEN RING THEM BACK IN THE SAME ORDER (JUMP INTO THEM)', need: 'RING THE TUNE BACK FIRST!',
  make(o, keep, ctx, A, rng) {
    const Kt = RK(), W = 34 + Kt.eastW(keep, o);
    const g = Kt.room(W), Y = Kt.Y;
    const x0 = g.west(keep), x1 = Kt.east(g, keep, A, o);
    const mid = Math.floor((x0 + x1) / 2), bells = [mid - 7, mid, mid + 7];
    for (const bx of bells) g.need('under a bell', bx, Y);
    if (keep.gold) { g.hline(x0 + 1, x0 + 4, 7, '-'); g.hline(x0 + 3, x0 + 6, 4, '-'); g.put(x0 + 4, 3, '*'); }
    if (o.exit) { g.door(x1 - 1, Y, { to: o.exit, look: 'itTowerDoor' }); g.need('the door up', x1 - 1, Y); }
    g.winSpot(A.id, mid + 3, Y);
    g.data.bells = bells; g.data.n = o.n || 4;
    g.dress(keep, [x0 + 1, x1 - 3], Y);
    return g;
  },
  enter(play, A, R, kit) { if (!R.won) this.newTune(R, kit); },
  newTune(R, kit) { R.tune = []; for (let k = 0; k < kit.data.n; k++) { let b; do { b = Math.floor(Math.random() * 3); } while (k && b === R.tune[k - 1]); R.tune.push(b); } R.phase = 'wait'; R.pt = 0; R.i = 0; R.ring = [0, 0, 0]; R.was = [false, false, false]; },
  ring(play, R, k) { R.ring[k] = 1; Sound.play('checkpoint', { vol: 0.55, pitch: BELL_PITCH[k] }); },
  update(play, dt, A, R, kit) {
    for (let k = 0; k < 3; k++) R.ring[k] = Math.max(0, R.ring[k] - dt * 1.5);
    if (R.won) return;
    const p = play.player, D = kit.data;
    R.pt += dt;
    if (R.phase === 'wait') { if (RK().inside(play, A, R) && R.pt > 0.8) { R.phase = 'play'; R.pt = 0; R.i = 0; } return; }
    if (R.phase === 'play') {
      // the bells ring the tune, 0.75 s apart
      const k = Math.floor(R.pt / 0.75);
      if (k < R.tune.length && Math.floor((R.pt - dt) / 0.75) !== k) this.ring(play, R, R.tune[k]);
      if (R.pt > R.tune.length * 0.75 + 0.4) { R.phase = 'echo'; R.i = 0; play.toast('YOUR TURN!'); }
      return;
    }
    if (R.phase === 'echo') {
      D.bells.forEach((bx, k) => {
        const box = { x: bx * TS - 8, y: 4 * TS, w: TS + 16, h: 2 * TS }, hit = overlap(p, box) && p.vy < 0;
        if (hit && !R.was[k]) {
          this.ring(play, R, k);
          if (R.tune[R.i] === k) { R.i++; if (R.i >= R.tune.length) winRoom(play, A, R, { text: 'BRAVO!', coins: 6 }); }
          else { R.fails = (R.fails || 0) + 1; RK().raspberry(play, 'CLANG! LISTEN AGAIN'); R.phase = 'play'; R.pt = -0.8; R.i = 0; }
        }
        R.was[k] = hit || (R.was[k] && p.vy < 0 && overlap(p, box));
      });
    }
  },
  draw(play, ctx, A, R, kit) {
    const D = kit.data, t = play.t;
    D.bells.forEach((bx, k) => {
      const x = bx * TS + TS / 2, y = 4 * TS, sw = Math.sin(t * 14) * (R.ring ? R.ring[k] : 0) * 0.5, col = ['#c8783a', '#d8a83a', '#e8d070'][k];
      ctx.save(); ctx.strokeStyle = '#7a5430'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, TS); ctx.lineTo(x, y - 20); ctx.stroke();
      ctx.translate(x, y - 20); ctx.rotate(sw); ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (R.ring && R.ring[k] > 0.2) { ctx.fillStyle = 'rgba(255,240,170,0.45)'; ctx.beginPath(); ctx.arc(0, 26, 34, 0, TAU); ctx.fill(); }
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(0, -8, 10, 0); ctx.quadraticCurveTo(18, 22, 24, 34); ctx.lineTo(-24, 34); ctx.quadraticCurveTo(-18, 22, -10, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.arc(0, 38, 5, 0, TAU); ctx.fill(); ctx.stroke();
      // the bell's mark (colour AND shape: the tune reads without colour vision)
      TourRoomArt.sym(ctx, k, 0, 18, 6);
      ctx.restore();
    });
    if (!R.won && R.tune) {
      const x = play.camX + Game.viewW / 2, y = TourRooms.hudY(play, 0) + 72;
      ctx.save(); ctx.fillStyle = 'rgba(14,8,26,0.72)'; rr(ctx, x - 70, y - 14, 140, 28, 14); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = TourBackstage.F8; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(R.phase === 'echo' ? 'RING IT BACK: ' + R.i + ' / ' + R.tune.length : 'LISTEN...', x, y + 1); ctx.restore();
    }
  }
});

/* ======================= pieces ======================= */
// 14-2: the flour loft over the kitchen. A dough pad under a vent in the kitchen ceiling; a full fling goes up
// through the vent onto the top of the cupboards: a run with a moka pot, a tomato and a gap (back down into the
// kitchen), the pantry hatch at its end. { to, back }
Tour.pieces['it.loft'] = (st, o) => {
  const B = st.B, x = st.x, n = 42, gy = st.gy, slab = gy - 8;
  st.floor(x, x + n);
  // the slab: the kitchen ceiling under the loft (two rows), from x + 2 to the end
  B.fill(x + 2, slab, x + n, slab + 1, T.HARD);
  // the vent (three wide) with the dough pad right under it, over a little pot
  const vx = x + 6; B.fill(vx, slab, vx + 2, slab + 1, T.EMPTY);
  st.pit(vx, vx + 2); B.fill(vx, slab, vx + 2, slab + 1, T.EMPTY); B.fill(x + 2, slab, vx - 1, slab + 1, T.HARD); B.fill(vx + 3, slab, x + n, slab + 1, T.HARD);
  B.fill(vx, st.H - 2, vx + 2, st.H - 1, T.LAVA);
  B.spawn('itDough', vx, gy - 1, { pw: 3 }); for (let q = 0; q < 3; q++) B.ghosts.push([vx + q, gy]);
  for (let q = 0; q < 3; q++) B.edge([vx + q, gy - 1], [vx + 5, slab]);
  B.spawn('itFlourTell', vx + 1, gy - 1, { w: 3, h: gy - slab - 2 });
  B.decorAt('itSaucePot', vx, st.H - 2, 3);
  B.spawn('itPigeonTell', x + 2, gy - 1, { dir: 1, look: 'up' });
  for (let y = slab - 2; y > slab - 6; y--) B.pickAt(vx + 1, y);
  // the loft run on top of the slab: coins, a moka pot, a tomato, a gap down to the kitchen
  B.picksRow(vx + 4, vx + 10, slab - 2);
  st.enemy('itMoka', vx + 14, slab);
  B.fill(vx + 18, slab, vx + 20, slab + 1, T.EMPTY);
  B.picksArc(vx + 17, vx + 21, slab - 2, 2);
  st.enemy('itTomato', vx + 25, slab);
  B.picksRow(vx + 27, vx + 30, slab - 2);
  // the pantry hatch at the loft's end; the way back from the pantry lands on the kitchen floor below
  B.spawn('portal', x + n - 3, slab - 1, { kind: 'door', look: 'itPantry', targetRef: o.to || null });
  if (o.back) B.anchor(o.back, x + n - 2, gy - 1);
  // the kitchen floor under the loft: a tomato, coins
  st.coins(x + 12, x + 30, gy - 2); st.enemy('itTomato', x + 22, gy);
  return x + n + 1;
};
// 14-6: the one pit with no coffee in it: soft sacks of beans at the bottom; drop in (a bottom seam into the bean
// store). { to }
Tour.pieces['it.sackPit'] = (st, o) => {
  const B = st.B, x = st.x; st.floor(x, x + 3);
  const px = x + 4; st.pit(px, px + 2);
  TourSeams.add(B, { side: 'bottom', a: px, b: px + 2, to: o.to });
  B.spawn('itSackTell', px + 1, st.H - 1, { w: 3, tell: true });
  B.spawn('itPigeonTell', x + 2, st.gy - 1, { dir: 1, look: 'down' });
  st.floor(px + 3, px + 7);
  st.coins(px + 4, px + 6, st.gy - 2);
  return px + 8;
};
Tour.itSecrets = { TOPPINGS, BELL_PITCH };
})();
