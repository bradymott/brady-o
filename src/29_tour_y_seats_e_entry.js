/* ============================================================
   BELOW THE CHEAP SEATS: the hidden way in (the land's best secret), in Festival Fields 23-1 CAMPSITE SCRAMBLE.
   ChatGPT's entrance: "climb down the back of the last bench and press down between its two middle legs. A single seat
   faces the ground underneath."
   In guy-rope alley (the campsite field next to the main stage) a little grandstand of three benches steps up toward
   the stage, painted the way Festival Fields paints its props (bright flat fills, the soft dark ink). Every bench has
   its folding seats upright on top, facing the stage. Under the LAST (highest) bench, between its two middle legs, ONE
   plain folding seat hangs facing the ground: the only odd thing there. No sign, no arrow, no coins, nothing on the
   level card. Climb the benches, drop down behind the last one, and press DOWN standing under that seat: Brady folds
   down through it, the land's name comes up and 23-1 clears through its new 'seats' exit, which opens the land.
   The host level's files are not touched: this file re-registers 23-1 with the flag decor in that field swapped for the
   grandstand piece and one exit added; its other exits, postcards and totals are as they were.
   The checker: an exit box on the boards under the last bench (standing there).
   ============================================================ */
(function () {
const FE = Tour.countries.fest, SK = Tour.seatsKit;
if (!FE || !SK || !FE.levels[0]) return;

/* ---------------- the grandstand, in Festival Fields' own painting ---------------- */
const FC = { ink: '#2a1a22', wood: '#c8945a', wood2: '#a8743a', leg: '#a8a8b4', leg2: '#7a7a88', seat: '#2a9a8a', seat2: '#1e7a6e', seatHi: '#5ac8b8' };
// a folding seat upright on a bench (back up, pan open), its feet at (x, y)
function upSeat(ctx, x, y) {
  ctx.save(); ctx.strokeStyle = FC.ink; ctx.lineWidth = 1.6;
  ctx.fillStyle = FC.leg; ctx.fillRect(x - 9, y - 22, 3, 22); ctx.strokeRect(x - 9, y - 22, 3, 22); ctx.fillRect(x + 6, y - 22, 3, 22); ctx.strokeRect(x + 6, y - 22, 3, 22);
  ctx.fillStyle = FC.seat; rr(ctx, x - 11, y - 34, 22, 16, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = FC.seatHi; ctx.fillRect(x - 8, y - 32, 14, 3);
  ctx.fillStyle = FC.seat; rr(ctx, x - 12, y - 8, 24, 6, 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// the odd one: a folding seat hung upside down under a bench's plank (pan toward the ground), hinge at (x, y)
function downSeat(ctx, x, y, t) {
  ctx.save(); ctx.strokeStyle = FC.ink; ctx.lineWidth = 1.6; ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.1) * 0.03);
  ctx.fillStyle = FC.leg; ctx.fillRect(-9, 0, 3, 18); ctx.strokeRect(-9, 0, 3, 18); ctx.fillRect(6, 0, 3, 18); ctx.strokeRect(6, 0, 3, 18);
  ctx.fillStyle = FC.seat; rr(ctx, -11, 12, 22, 16, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = FC.seat2; ctx.fillRect(-8, 24, 14, 2);
  ctx.fillStyle = FC.seat; rr(ctx, -12, 2, 24, 6, 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// a bench: a plank on four legs from row `ty`'s top down to the floor gy; w tiles wide from column tx
function bench(ctx, tx, ty, w, gy) {
  const x0 = tx * TS, x1 = (tx + w) * TS, y = ty * TS, fy = gy * TS;
  ctx.save(); ctx.strokeStyle = FC.ink; ctx.lineWidth = 1.8;
  for (let k = 0; k < 4; k++) { const lx = x0 + 4 + k * (x1 - x0 - 12) / 3; ctx.fillStyle = FC.leg; ctx.fillRect(lx, y + 6, 4, fy - y - 6); ctx.strokeRect(lx, y + 6, 4, fy - y - 6); ctx.fillStyle = FC.leg2; ctx.fillRect(lx - 2, fy - 3, 8, 3); }
  ctx.fillStyle = FC.wood; ctx.fillRect(x0 - 2, y, x1 - x0 + 4, 8); ctx.strokeRect(x0 - 2, y, x1 - x0 + 4, 8);
  ctx.fillStyle = FC.wood2; ctx.fillRect(x0, y + 5, x1 - x0, 2);
  ctx.restore();
}
// the stand: three benches stepping up (rows gy-2, gy-3, gy-4) from column tx; the seats upright on top, the one under
// the last bench facing the ground
const BENCHES = [[0, 2, 2], [3, 3, 2], [5, 4, 2]];
function stand(ctx, tx, gy, t) {
  for (const [dx, up, w] of BENCHES) bench(ctx, tx + dx, gy - up, w, gy);
  for (const [dx, up, w] of BENCHES) for (let q = 0; q < w; q++) upSeat(ctx, (tx + dx + q + 0.5) * TS, (gy - up) * TS + 1);
  const [dx, up, w] = BENCHES[2];
  downSeat(ctx, (tx + dx + w / 2) * TS, (gy - up) * TS + 8, t);
}

class SeatsFestStand extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS); this.tx = s.tx; this.gy = s.gy; this.back = true; this.friendly = true; this.exitKey = 'seats'; this.secret = true; this.arr = -1;
    const [dx, up, w] = BENCHES[2]; this.midX = (this.tx + dx + w / 2) * TS; this.seatY = (this.gy - up) * TS + 8; this.x = this.midX - TS / 2; this.y = (this.gy - 2) * TS; this.h = 2 * TS; this.downT = 0;
  }
  update(dt) {
    this.t += dt;
    const g = this.g, p = g.player;
    if (!p || p.dead) return;
    if (this.arr >= 0) {
      this.arr += dt; p.vx = 0; p.vy = 0; p.x = this.midX - p.w / 2; p.y = this.gy * TS - p.h + Math.min(this.arr * 70, p.h + 10); p.invuln = Math.max(p.invuln || 0, 0.5);
      if (this.arr > 0.3 && !this.named) { this.named = true; g.bannerText = 'BELOW THE CHEAP SEATS'; g.bannerT = 2.6; TourKit.sfx('secret', 'secret', { vol: 0.9 }); if (g.toast) g.toast('A HIDDEN LAND! DOWN UNDER THE GRANDSTAND...'); }
      if (this.arr > 2.3 && g.state === 'play') { p.state = 'play'; g.levelClear(this); }
      return;
    }
    // standing on the boards under the last bench, between its two middle legs, pressing DOWN
    const under = p.onGround && Math.abs(p.cx - this.midX) < 0.55 * TS && Math.abs((p.y + p.h) - this.gy * TS) < 4;
    if (under && p.__seatsDown) this.downT += dt; else this.downT = 0;
    if (this.downT > 0.12) { this.arr = 0; p.stunT = 3; g.burst(this.midX, this.gy * TS - 10, 12, FC.seatHi, 'confetti'); TourKit.sfx('creak', 'select', { vol: 0.5, pitch: 0.7 }); }
  }
  touchPlayer() {}
  draw(ctx) {
    // while Brady folds down through it, the hanging seat swings down over him
    stand(ctx, this.tx, this.gy, this.t);
    if (this.arr >= 0) { const k = Math.min(1, this.arr * 1.5); ctx.save(); ctx.fillStyle = `rgba(40,20,30,${0.5 * k})`; ctx.beginPath(); ctx.ellipse(this.midX, this.gy * TS - 2, 22, 5, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  }
}
ENTITY_TYPES.seatsFestStand = SeatsFestStand;
// the DOWN on the stick, for the stand (the entity reads it next frame)
{
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) { this.__seatsDown = !!(inp && inp.down); return up0.call(this, dt, inp); };
  // while folding down, Brady is drawn sinking into the boards (clipped at the floor)
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx) {
    const e = this.g && this.g.entities && this.g.entities.find(q => q instanceof SeatsFestStand && q.arr >= 0);
    if (!e) return dr0.apply(this, arguments);
    ctx.save(); ctx.beginPath(); ctx.rect(this.x - 60, e.gy * TS - 400, this.w + 120, 400); ctx.clip(); dr0.apply(this, arguments); ctx.restore();
  };
}
// the checker: an exit box on the boards right under the hanging seat
if (typeof VALIDATOR_EXITS !== 'undefined') VALIDATOR_EXITS.seatsFestStand = { w: 20, h: 30 };

/* the stand piece: the letter is the first bench's left column on the floor row; benches are one-way planks */
Tour.pieces['seats.festStand'] = function (st, o) {
  const B = st.B, x = st.x, gy = st.gy;
  for (const [dx, up, w] of BENCHES) for (let q = 0; q < w; q++) B.set(x + dx + q, gy - up, T.SEMI);
  const [dx, up, w] = BENCHES[2];
  const s = B.spawn('seatsFestStand', x + dx + 1, gy - 1, { tx: x, gy, exit: 'seats' });
  s.x = (x + dx + w / 2) * TS; s.y = gy * TS;
  return st.x;
};

/* ---------------- 23-1, amended: the grandstand in guy-rope alley, the 'seats' exit ---------------- */
{
  const L0 = FE.levels[0];
  if (L0 && L0.areas && !L0.exits.seats) {
    const spec = JSON.parse(JSON.stringify(Object.assign({}, L0, { index: undefined, kind: undefined, v2: undefined, legacySecret: undefined })));
    spec.n = 1; spec.secret = L0.secret;
    spec.exits = Object.assign({}, JSON.parse(JSON.stringify(L0.exits)), { seats: { to: 'land:seats' } });
    const A = spec.areas.find(a => a.id === 'campsite'), cellR = A.script[0][1];
    // the flag decor at the right of the alley gives way to the stand (its letter at column 20 of the floor row)
    const r11 = cellR.rows[11].split(''); r11[24] = '.'; r11[20] = 'Y'; cellR.rows[11] = r11.join('');
    cellR.legend = Object.assign({}, cellR.legend || {}, { Y: ['piece', 'seats.festStand', {}] });
    Tour.amend('fest', { levels: [spec] });
  }
}
})();
