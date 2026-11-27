/* ============================================================
   THE TABLE SALT SEA: the hidden way in (the land's best secret), in Morocco 5-3 CHEFCHAOUEN BLUE.
   ChatGPT's entrance: "crouch on the salt saucer at the last citrus stall until Brady slips through its rim. One salt
   crystal on the rim has a tiny blue horizon inside it."
   In the medina's first (day) stretch, after the second laundry gap, the lane passes three little citrus stalls,
   painted the way Morocco paints its props (flat warm colours, no ink line): plank counters under striped cloth
   awnings, baskets of oranges, a terracotta jar. On the counter of the LAST stall sits a clay saucer heaped with salt;
   one crystal on its rim holds a tiny blue sea and its horizon: the only odd thing there. No sign, no arrow, no coins,
   nothing on the level card. Hop up onto that counter, stand on the saucer and crouch (stick down) for a moment: Brady
   sinks into the salt, slips through the rim, the land's name comes up and 5-3 clears through its new 'salt' exit,
   which opens the land.
   The host level's files are not touched: this file re-registers 5-3 with one piece added in its first stretch and
   one exit added; its other exits, postcards and totals are as they were.
   The checker: an exit box standing on the saucer's counter (crouching there is the only way in).
   ============================================================ */
(function () {
const MA = Tour.countries.ma, SK = Tour.saltKit;
if (!MA || !SK || !MA.levels[2]) return;

/* ---------------- the stalls, in Morocco's own painting: flat colours, soft shading, no ink ---------------- */
const MC = { plank: '#a8703a', plank2: '#8a5a2a', post: '#7a4a22', cloth: '#f4ead2', stripe: '#3a5ab0', basket: '#c8a060', basket2: '#a8803c', orange: '#f0902a', orange2: '#d8701a', leaf: '#3a8a4a', clay: '#c0643a', clay2: '#a04e2a', salt: '#f8f6f0', salt2: '#dcd8d0', jar: '#d87a40', jarBlue: '#3a5ab0' };
const oranges = (ctx, x, y, n) => { for (let k = 0; k < n; k++) { const ox = x - (n - 1) * 6 + k * 12 + (k % 2) * 2, oy = y - (k % 2 ? 10 : 4); ctx.fillStyle = MC.orange; ctx.beginPath(); ctx.arc(ox, oy, 6.5, 0, TAU); ctx.fill(); ctx.fillStyle = MC.orange2; ctx.beginPath(); ctx.arc(ox + 2, oy + 2, 3.5, 0, TAU); ctx.fill(); } ctx.fillStyle = MC.leaf; ctx.beginPath(); ctx.ellipse(x + 4, y - 16, 6, 3, -0.5, 0, TAU); ctx.fill(); };
// a stall: counter top at (x0..x1, y), its awning, a basket of oranges; jar on the left one
function stall(ctx, x0, x1, y, gy, k) {
  // posts, awning (cream cloth with blue stripes, a fringe), counter planks
  ctx.fillStyle = MC.post; ctx.fillRect(x0 + 2, y - 86, 6, gy - y + 86); ctx.fillRect(x1 - 8, y - 86, 6, gy - y + 86);
  ctx.fillStyle = MC.cloth; ctx.beginPath(); ctx.moveTo(x0 - 8, y - 92); ctx.lineTo(x1 + 8, y - 92); ctx.lineTo(x1 + 4, y - 70); ctx.lineTo(x0 - 4, y - 70); ctx.closePath(); ctx.fill();
  ctx.fillStyle = MC.stripe; for (let x = x0; x < x1; x += 22) ctx.fillRect(x + 4, y - 92, 5, 22);
  ctx.fillStyle = MC.cloth; for (let x = x0 - 4; x < x1 + 4; x += 7) ctx.fillRect(x, y - 70, 3, 5);
  ctx.fillStyle = MC.plank2; ctx.fillRect(x0, y + 4, x1 - x0, gy - y - 4);
  ctx.fillStyle = MC.plank; ctx.fillRect(x0 - 4, y, x1 - x0 + 8, 8); ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = x0 + 14; x < x1; x += 18) ctx.fillRect(x, y + 10, 2, gy - y - 12);
  // a basket of oranges
  const bx = k === 2 ? x0 + 30 : (x0 + x1) / 2;
  ctx.fillStyle = MC.basket; ctx.beginPath(); ctx.moveTo(bx - 22, y - 14); ctx.lineTo(bx + 22, y - 14); ctx.lineTo(bx + 17, y); ctx.lineTo(bx - 17, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = MC.basket2; for (let q = -2; q <= 2; q++) ctx.fillRect(bx + q * 8 - 1, y - 13, 2, 12);
  oranges(ctx, bx, y - 12, k === 1 ? 4 : 3);
  if (k === 0) { ctx.fillStyle = MC.jar; ctx.beginPath(); ctx.ellipse(x1 - 18, y - 14, 11, 14, 0, 0, TAU); ctx.fill(); ctx.fillRect(x1 - 23, y - 34, 10, 8); ctx.fillStyle = MC.jarBlue; ctx.fillRect(x1 - 29, y - 16, 22, 3); }
}
// the saucer (its centre x, its foot y): a clay dish heaped with salt; one crystal on its rim holds a blue horizon
function saucer(ctx, x, y, t, sink) {
  ctx.fillStyle = MC.clay2; ctx.beginPath(); ctx.ellipse(x, y - 3, 22, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = MC.clay; ctx.beginPath(); ctx.moveTo(x - 24, y - 9); ctx.quadraticCurveTo(x, y + 2, x + 24, y - 9); ctx.lineTo(x + 22, y - 11); ctx.lineTo(x - 22, y - 11); ctx.closePath(); ctx.fill();
  // the salt heaped in it (it sinks a little while Brady crouches on it)
  ctx.fillStyle = MC.salt; ctx.beginPath(); ctx.moveTo(x - 20, y - 10); ctx.quadraticCurveTo(x - 6, y - 20 + sink * 6, x + 2, y - 19 + sink * 6); ctx.quadraticCurveTo(x + 12, y - 18 + sink * 6, x + 20, y - 10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = MC.salt2; for (const [dx, dy] of [[-12, -13], [-4, -16], [6, -15], [13, -12], [0, -12]]) ctx.fillRect(x + dx, y + dy + sink * 4, 3, 3);
  // the crystal on the rim (right): clear, a tiny sea and its horizon inside
  const cx = x + 17, cy = y - 15;
  ctx.fillStyle = '#eef6ff'; ctx.beginPath(); ctx.moveTo(cx - 5, cy + 4); ctx.lineTo(cx - 5, cy - 3); ctx.lineTo(cx, cy - 6); ctx.lineTo(cx + 5, cy - 3); ctx.lineTo(cx + 5, cy + 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8ac8f4'; ctx.fillRect(cx - 4, cy - 2, 8, 2.5); ctx.fillStyle = '#1a4ab8'; ctx.fillRect(cx - 4, cy + 0.5, 8, 3);
  ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 2.2)})`; ctx.fillRect(cx - 4, cy + 0.2, 8, 0.9);
}

/* ---------------- the last stall's saucer and the way in ---------------- */
class SaltMaSaucer extends Ent {
  constructor(g, s) {
    super(g, s, TS, TS); this.tx = Math.round((s.x - TS / 2) / TS); this.crow = Math.round(s.y / TS); this.x0 = s.dx0.map(d => this.tx + d); this.x1 = s.dx1.map(d => this.tx + d); this.gy = this.crow + 2; this.x = this.x0[0] * TS - 16; this.w = (this.x1[2] - this.x0[0] + 2) * TS; this.y = (this.crow - 4) * TS; this.h = (this.gy - this.crow + 4) * TS; this.back = true; this.friendly = true;
    this.exitKey = 'salt'; this.secret = true; this.arr = -1; this.crouchT = 0; this.sx = (this.tx + 0.5) * TS;
  }
  update(dt) {
    this.t += dt;
    const g = this.g, p = g.player;
    if (!p || p.dead) return;
    if (this.arr >= 0) {
      this.arr += dt; p.vx = 0; p.vy = 0; p.x = this.sx - p.w / 2; p.y = this.crow * TS - p.h + Math.min(p.h + 6, this.arr * 50); p.invuln = Math.max(p.invuln || 0, 0.5);
      if (this.arr > 0.3 && !this.named) { this.named = true; g.bannerText = 'THE TABLE SALT SEA'; g.bannerT = 2.6; TourKit.sfx('secret', 'secret', { vol: 0.9 }); if (g.toast) g.toast('A HIDDEN LAND! DOWN THROUGH THE SAUCER\'S RIM...'); }
      if (this.arr > 2.3 && g.state === 'play') { p.state = 'play'; g.levelClear(this); }
      return;
    }
    // crouching on the saucer (on the counter, over it): it sinks; a full second and Brady slips through the rim
    const on = p.onGround && p.groundTy === this.crow && Math.abs(p.cx - this.sx) < 0.6 * TS;
    const down = !!(p.inp ? p.inp.down : Input.down) || p.crouch;
    if (on && down) { this.crouchT += dt; if (this.crouchT >= 1.0) { this.arr = 0; p.stunT = 3; g.burst(this.sx, this.crow * TS - 10, 14, '#ffffff', 'dust'); TourKit.sfx('crunch', 'bump', { vol: 0.6, pitch: 1.3 }); } }
    else this.crouchT = Math.max(0, this.crouchT - dt * 2);
  }
  touchPlayer() {}
  draw(ctx) {
    // the three stalls behind everything; the saucer on the last counter
    const y = this.crow * TS, gy = this.gy * TS;
    for (let k = 0; k < 3; k++) { const a = this.x0[k], b = this.x1[k]; stall(ctx, a * TS, (b + 1) * TS, y, gy, k); }
    saucer(ctx, this.sx, y, this.t, Math.min(1, this.crouchT));
  }
}
ENTITY_TYPES.saltMaSaucer = SaltMaSaucer;
// while slipping in, Brady sinks into the saucer (clipped at its rim)
{
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx) {
    const e = this.g && this.g.entities && this.g.entities.find(q => q instanceof SaltMaSaucer && q.arr >= 0);
    if (!e) return dr0.apply(this, arguments);
    ctx.save(); ctx.beginPath(); ctx.rect(this.x - 60, this.y - 400, this.w + 120, e.crow * TS - 12 - (this.y - 400)); ctx.clip(); dr0.apply(this, arguments); ctx.restore();
  };
}
// the checker: an exit box standing on the saucer's counter
if (typeof VALIDATOR_EXITS !== 'undefined') VALIDATOR_EXITS.saltMaSaucer = { w: 20, h: 40 };

/* the stalls piece, run inside 5-3's strip: 24 tiles of lane, three stalls with counters 2 rows up (one-way planks) */
Tour.pieces['salt.maStalls'] = function (st, o) {
  const B = st.B, x = st.x, gy = st.gy, cy = gy - 2;
  st.floor(x, x + 23);
  const x0 = [x + 2, x + 9, x + 16], x1 = [x + 5, x + 12, x + 20];
  for (let k = 0; k < 3; k++) for (let q = x0[k]; q <= x1[k]; q++) B.set(q, cy, T.SEMI);
  const tx = x0[2] + 2;
  B.spawn('saltMaSaucer', tx, cy - 1, { dx0: x0.map(v => v - tx), dx1: x1.map(v => v - tx), exit: 'salt' });
  return x + 24;
};

/* ---------------- 5-3, amended: the stalls in the first (day) stretch, the 'salt' exit ---------------- */
{
  const L0 = MA.levels[2];
  if (L0 && L0.areas && !L0.exits.salt) {
    const spec = JSON.parse(JSON.stringify(Object.assign({}, L0, { index: undefined, kind: undefined, v2: undefined, legacySecret: undefined })));
    spec.n = 3; spec.secret = L0.secret;
    spec.exits = Object.assign({}, JSON.parse(JSON.stringify(L0.exits)), { salt: { to: 'land:salt' } });
    const A = spec.areas.find(a => a.id === 'medina'), k = A.script.findIndex(s2 => Array.isArray(s2) && s2[0] === 'lines' && s2[1] && s2[1].dayY === 3);
    A.script.splice(k + 1, 0, ['salt.maStalls', {}]);
    Tour.amend('ma', { levels: [spec] });
  }
}
// the level card's exit pips: the way through the saucer is not counted until it has been found
{
  const ef0 = TourProgress.exitsFound;
  TourProgress.exitsFound = function (id) {
    const r = ef0.call(this, id), L = Tour.specOf(id);
    if (!L || !L.exits || !L.exits.salt || L.exits.salt.to !== 'land:salt') return r;
    const E = (Save.data.exits || {})[id] || {};
    return E.salt ? r : { found: r.found, total: Math.max(0, r.total - 1) };
  };
}
})();
