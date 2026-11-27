/* ============================================================
   TABLE FOR TWO: the hidden entrance, in Spain 6-1 (La Tomatina). The host level is not edited: this file amends
   it, adding one café after the third plaza and one exit, `table: { to: 'land:table' }`.
   The café: a striped awning over a terrace, a flower box to climb on, and one café table laid for ONE (a plate, a
   fork, a knife, a napkin) whose shadow on the paving is two joined hands. That is the only clue: no sign, no arrow,
   no coins, nothing on the level card. Walking past (or over the shadow) does nothing; climb onto the awning and
   drop from it through the shadow (walk off its end or drop through it) and Brady slips through the shadow: the
   land's name comes up and the level clears through the 'table' exit, which opens the land on the route map.
   The checker sees a warp-like exit box in the air over the shadow (only a fall from above reaches it).
   ============================================================ */
(function () {
const ES = Tour.countries.es, TT = Tour.countries.table;
if (!ES || !TT || !Tour.tableKit) return;
const TK = Tour.tableKit, INK = TK.INK, TabArt = TK.TabArt;

/* ---------------- the café's art ---------------- */
Object.assign(Decor, {
  // the café front: a cream wall with a dark doorway, the red-and-cream striped awning (its scalloped hem), a lamp
  tabCafeFront(ctx, x, y, t) {
    // painted like the street's own houses: a whitewashed wall with a little shading and wear, a terracotta tiled gable
    // roof, green shutters, a dark arched doorway; the same soft line as the town behind it
    ctx.save(); ctx.strokeStyle = '#5a4a44'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    const l = x - 150, r = x + 150, top = y - 190;
    ctx.fillStyle = '#f6eedc'; ctx.fillRect(l, top, 300, 190);
    ctx.fillStyle = 'rgba(120,90,60,0.08)'; ctx.fillRect(l, top, 300, 24); ctx.fillStyle = 'rgba(120,90,60,0.12)'; ctx.fillRect(l, y - 36, 300, 36);
    ctx.fillStyle = 'rgba(160,130,100,0.18)'; for (const [px, py, w] of [[l + 40, top + 60, 26], [r - 70, top + 110, 30], [l + 150, top + 40, 18]]) { ctx.beginPath(); ctx.ellipse(px, py, w, w * 0.35, 0, 0, TAU); ctx.fill(); }
    ctx.strokeRect(l, top, 300, 190);
    // the gable roof of round terracotta tiles
    ctx.fillStyle = '#c8603a'; ctx.beginPath(); ctx.moveTo(l - 12, top + 2); ctx.lineTo(x, top - 44); ctx.lineTo(r + 12, top + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#9a4428'; ctx.lineWidth = 1.2; for (let k = 1; k < 4; k++) { const yy = top + 2 - k * 11, hw = 162 - k * 40; ctx.beginPath(); for (let xx = x - hw; xx < x + hw; xx += 12) ctx.arc(xx + 6, yy, 6, Math.PI, 0); ctx.stroke(); }
    ctx.strokeStyle = '#5a4a44'; ctx.lineWidth = 1.6;
    // the arched doorway
    ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.moveTo(l + 32, y); ctx.lineTo(l + 32, y - 80); ctx.quadraticCurveTo(l + 60, y - 116, l + 88, y - 80); ctx.lineTo(l + 88, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    // two windows with green shutters (one over the awning, one high)
    const win = (wx, wy) => { ctx.fillStyle = '#4a3a3a'; ctx.fillRect(wx, wy, 26, 34); ctx.strokeRect(wx, wy, 26, 34); ctx.fillStyle = '#2a7a4a'; ctx.fillRect(wx - 13, wy, 12, 34); ctx.fillRect(wx + 27, wy, 12, 34); ctx.strokeRect(wx - 13, wy, 12, 34); ctx.strokeRect(wx + 27, wy, 12, 34); ctx.fillStyle = '#e8424a'; ctx.fillRect(wx - 3, wy + 34, 32, 5); };
    win(x + 10, top + 22); win(x + 90, top + 22);
    ctx.restore();
  },
  // the awning: its top edge is the walking line (the semi tiles), the striped canvas hangs below with a scalloped hem
  tabAwning(ctx, x, y, t, th, d) {
    const w = (d && d.w) || 7 * TS, l = x - w / 2, n = Math.round(w / 20);
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#5a3a2a'; ctx.fillRect(l - 6, y - 4, w + 8, 6); ctx.strokeRect(l - 6, y - 4, w + 8, 6);
    for (let k = 0; k < n; k++) { ctx.fillStyle = k % 2 ? '#fbf0dc' : '#d8403a'; ctx.fillRect(l + k * w / n, y + 2, w / n, 30); }
    ctx.strokeRect(l, y + 2, w, 30);
    for (let k = 0; k < n; k++) { ctx.fillStyle = k % 2 ? '#fbf0dc' : '#d8403a'; ctx.beginPath(); ctx.arc(l + (k + 0.5) * w / n, y + 32, w / n / 2, 0, Math.PI); ctx.fill(); ctx.stroke(); }
    // the iron bracket down to the wall
    ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(l + 6, y + 30); ctx.quadraticCurveTo(l + 6, y + 70, l - 14, y + 74); ctx.stroke();
    ctx.restore();
  },
  // a flower box on a stool (the step up to the awning)
  tabFlowerBox(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.fillStyle = '#c86a3a'; ctx.fillRect(x - 28, y - 12, 56, 12); ctx.strokeRect(x - 28, y - 12, 56, 12);
    for (let k = 0; k < 5; k++) { ctx.fillStyle = '#3a8a3a'; ctx.beginPath(); ctx.ellipse(x - 22 + k * 11, y - 16, 7, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = k % 2 ? '#ff5aa0' : '#ffffff'; ctx.beginPath(); ctx.arc(x - 22 + k * 11, y - 20, 3.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(x - 24, y, 5, 64); ctx.fillRect(x + 19, y, 5, 64);
    ctx.restore();
  },
  // the reserved café table, laid for ONE. The low sun throws its shadow up onto the café wall behind it and long
  // across the paving; in the wall shadow, over the table's top, are two hands joined (the clue: there is one place)
  tabCafeTable(ctx, x, y, t) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    // on the paving: the long shadow where it falls
    ctx.fillStyle = 'rgba(40,20,20,0.26)'; ctx.beginPath(); ctx.moveTo(x - 4, y - 1); ctx.quadraticCurveTo(x + 100, y - 10, x + 220, y - 4); ctx.quadraticCurveTo(x + 100, y + 4, x - 4, y + 2); ctx.closePath(); ctx.fill();
    // the iron foot and the post
    ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.quadraticCurveTo(x, y - 10, x + 16, y); ctx.lineTo(x + 12, y); ctx.quadraticCurveTo(x, y - 6, x - 12, y); ctx.fill(); ctx.fillRect(x - 2, y - 40, 4, 34);
    // the cloth over the round top
    ctx.fillStyle = '#fbf3e0'; ctx.beginPath(); ctx.ellipse(x, y - 44, 30, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 30, y - 44); ctx.lineTo(x - 28, y - 26); ctx.quadraticCurveTo(x, y - 22, x + 28, y - 26); ctx.lineTo(x + 30, y - 44); ctx.fill(); ctx.stroke();
    // one place: a plate, a fork, a knife, a folded napkin with a red stripe
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x - 8, y - 46, 9, 2.6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8ccd8'; ctx.fillRect(x + 4, y - 51, 1.6, 7); ctx.fillRect(x + 8, y - 51, 1.6, 7);
    ctx.fillStyle = '#fbf3e0'; ctx.fillRect(x + 13, y - 50, 8, 6); ctx.strokeRect(x + 13, y - 50, 8, 6); ctx.fillStyle = '#d8403a'; ctx.fillRect(x + 13, y - 48, 8, 1.2);
    ctx.restore();
  },
  // the reserved table's shadow thrown up on the café wall by the low sun (drawn before the awning): the table's
  // silhouette, and over its top, two hands joined
  tabCafeWallShadow(ctx, x, y) {
    ctx.save(); const sh = 'rgba(48,22,26,0.3)';
    const sx = x + 24;
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(sx, y - 50, 32, 7, 0, 0, TAU); ctx.fill(); ctx.fillRect(sx - 3, y - 46, 6, 46);
    ctx.beginPath(); ctx.moveTo(sx - 32, y - 50); ctx.lineTo(sx - 30, y - 34); ctx.quadraticCurveTo(sx, y - 30, sx + 30, y - 34); ctx.lineTo(sx + 32, y - 50); ctx.fill();
    TabArt.hands(ctx, sx, y - 66, 1.0, 'rgba(48,22,26,0.62)');
    ctx.restore();
  },
  // a bentwood chair at the reserved table
  tabCafeChair(ctx, x, y) {
    ctx.save(); ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x - 8, y - 22); ctx.lineTo(x + 10, y - 22); ctx.lineTo(x + 10, y); ctx.moveTo(x + 8, y - 22); ctx.quadraticCurveTo(x + 14, y - 46, x + 2, y - 50); ctx.quadraticCurveTo(x - 8, y - 46, x - 6, y - 22); ctx.stroke();
    ctx.fillStyle = '#c8a050'; ctx.fillRect(x - 10, y - 25, 21, 4);
    ctx.restore();
  }
});

/* ---------------- the way through ---------------- */
// the shadow spot: Brady landing on it from the awning slips through (a short arrival, then the 'table' exit)
class TabShadowDoor extends Ent {
  constructor(g, s) {
    super(g, s, 2 * TS, TS); this.x = s.x - TS / 2; this.y = s.y - TS; this.friendly = true; this.back = true;
    this.fy = Math.round(s.y / TS) + (s.dy || 0); this.ax0 = s.ax0; this.ax1 = s.ax1; this.ay = s.ay; this.sx0 = s.sx0; this.sx1 = s.sx1;
    this.exitKey = s.exit || 'table'; this.secret = true; this.awnT = -9; this.arr = -1;
  }
  update(dt) {
    this.t += dt;
    const g = this.g, p = g.player;
    if (!p || p.dead) return;
    if (this.arr >= 0) {
      this.arr += dt;
      // Brady sinks into the shadow; the land's name comes up; then the level clears through the exit
      p.vx = 0; p.vy = 0; p.x = this.slipX - p.w / 2; p.invuln = Math.max(p.invuln || 0, 0.5);
      if (this.arr > 0.25 && !this.named) { this.named = true; g.bannerText = 'TABLE FOR TWO'; g.bannerT = 2.6; TourKit.sfx('secret', 'secret', { vol: 0.9 }); g.toast && g.toast('A HIDDEN LAND! ONE QUIET TABLE...'); }
      if (this.arr > 2.2 && g.state === 'play') { p.state = 'play'; g.levelClear(this); }
      return;
    }
    // on the awning (its top row, between its ends) a moment ago?
    const cx = p.cx / TS;
    if (p.onGround && p.groundTy === this.ay && cx >= this.ax0 && cx <= this.ax1 + 1) this.awnT = g.t;
    if (p.onGround && !this.wasG && p.groundTy === this.fy && cx >= this.sx0 && cx <= this.sx1 + 1 && g.t - this.awnT < 1.6) {
      this.arr = 0; this.slipX = p.cx; p.stunT = 3;
      g.burst(p.cx, p.y + p.h, 18, '#3a1a20', 'dust');
    }
    this.wasG = p.onGround;
  }
  touchPlayer() {}
  draw(ctx) {
    if (this.arr < 0) return;
    const p = this.g.player; if (!p) return;
    // a dark ripple spreading from the shadow, a heart rising from it
    const k = Math.min(1, this.arr / 0.8), x = this.slipX, y = this.fy * TS;
    ctx.save(); ctx.fillStyle = `rgba(30,10,16,${0.5 * k})`; ctx.beginPath(); ctx.ellipse(x, y - 2, 20 + k * 40, 5 + k * 6, 0, 0, TAU); ctx.fill();
    TabArt.heart(ctx, x, y - 30 - this.arr * 40, 8 + this.arr * 3, `rgba(255,120,140,${Math.max(0, 1 - this.arr / 2.2)})`);
    ctx.restore();
  }
}
ENTITY_TYPES.tabShadowDoor = TabShadowDoor;
// the checker: an exit box in the air over the shadow (a fall through it from above reaches it; walking past never)
if (typeof VALIDATOR_EXITS !== 'undefined') VALIDATOR_EXITS.tabShadowDoor = { w: 44, h: 36 };
// while Brady sinks through the shadow he is drawn sinking (squashed into it)
{
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx) {
    const g = this.g, e = g && g.entities && g.entities.find(q => q instanceof TabShadowDoor && q.arr >= 0);
    if (!e) return dr0.apply(this, arguments);
    const k = Math.min(1, e.arr / 1.2), by = this.y + this.h;
    ctx.save(); ctx.beginPath(); ctx.rect(this.x - 60, this.y - 80, this.w + 120, this.h + 80 - 2); ctx.clip();
    ctx.translate(0, k * this.h); dr0.apply(this, arguments); ctx.restore();
  };
}

/* the café piece, run inside the host level's strip: { } -> 20 tiles of terrace */
Tour.pieces['table.cafe'] = function (st, o) {
  const B = st.B, x = st.x, gy = st.gy;
  st.floor(x, x + 19);
  B.decorAt('tabCafeFront', x + 7, gy, 1);
  // the flower box (a step: one-way, 2 rows up) and the awning (one-way, 4 rows up, 7 wide)
  for (let q = 0; q < 2; q++) B.set(x + 2 + q, gy - 2, T.SEMI);
  B.prop('tabFlowerBox', x + 2, gy - 2, 2, 0.01, 'none', {});
  const ax0 = x + 4, ax1 = x + 12, ay = gy - 4;
  B.decorAt('tabCafeWallShadow', x + 9, gy, 0);
  for (let q = ax0; q <= ax1; q++) { B.set(q, ay, T.SEMI); B.setHide(q, ay, 1); }
  B.decor.push({ kind: 'tabAwning', x: (ax0 + ax1 + 1) / 2 * TS, y: ay * TS, seed: 0, w: (ax1 - ax0 + 1) * TS });
  // the reserved table under the awning's far end, laid for one; its shadow (two hands) lies on the paving beside it
  B.decorAt('tabCafeChair', x + 7, gy, 2);
  B.decorAt('tabCafeTable', x + 9, gy, 3);
  // the way through: landing in the table's long shadow (x+9..x+16) from the awning; the checker's box in the air over it
  B.spawn('tabShadowDoor', x + 12, ay + 1, { exit: 'table', dy: 2, ax0, ax1, ay, sx0: x + 9, sx1: x + 16 });
  st.coins(x + 17, x + 19, gy - 3);
  return x + 20;
};
// the checker's box: VALIDATOR_EXITS boxes sit on the spawn's feet line (s.y): rows ay+1 (just under the awning) down
// into the air; a standing body never reaches it (its head stays below), a fall from the awning through it does

/* ---------------- 6-1, amended: the café after the third plaza, the 'table' exit ---------------- */
{
  const L0 = ES.levels[0];
  if (L0 && L0.areas && !L0.exits.table) {
    const spec = JSON.parse(JSON.stringify(Object.assign({}, L0, { index: undefined, kind: undefined, v2: undefined, legacySecret: undefined })));
    spec.n = 1; spec.secret = L0.secret;
    spec.exits = Object.assign({}, JSON.parse(JSON.stringify(L0.exits)), { table: { to: 'land:table' } });
    const A = spec.areas.find(a => a.id === 'bunol'), k = A.script.findIndex(s => s === 'end' || (Array.isArray(s) && s[0] === 'end'));
    A.script.splice(k, 0, ['table.cafe', {}]);
    Tour.amend('es', { levels: [spec] });
  }
}
})();
