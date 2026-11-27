/* ============================================================
   POSTMARK SOUND: the hidden way in (the land's best secret), in Vietnam 10-3 HOI AN LANTERNS.
   ChatGPT's entrance: "stand on the reverse side of the last waterside postcard rack and walk into its lowest card.
   One printed wave continues across the card's white border."
   Right of the night market's first stair stools, a gap in the street floor drops to the river steps under the
   market: a little stone landing at the water's edge with three postcard racks on it. Every card on every rack keeps
   its picture inside its white border, except the LOWEST card on the LAST rack (the one nearest the water), whose
   printed wave runs on across the border. Stand on that rack's reverse side (between it and the water), crouch and
   push into the lowest card (stick down and toward the rack): Brady slips into the card, and the harbour is found.
   No sign, no arrow, no coin trail, nothing on the level card. The host level's exits, postcards and totals are as
   they were; its own files are not touched: this file re-registers 10-3 with its market stamp four rows deeper (the
   river steps), everything that was there in the same place.
   ============================================================ */
(function () {
const VN = Tour.countries.vn, K = Tour.postKit;
if (!VN || !K || !VN.levels[2]) return;
const INK = K.INK, PA = K.PostArt;

/* ---------------- the props: the river steps' postcard racks ---------------- */
// one card: white border, a sky-and-sea picture; odd: the printed wave runs on across the white border
const card = (ctx, x, y, w, h, kind, odd) => {
  ctx.fillStyle = '#fbf8ee'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
  const m = 4, ix = x + m, iy = y + m, iw = w - 2 * m, ih = h - 2 * m;
  ctx.fillStyle = ['#9ad0f0', '#f2c890', '#a8d8c0'][kind % 3]; ctx.fillRect(ix, iy, iw, ih);
  ctx.save();
  if (!odd) { ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip(); }
  ctx.fillStyle = '#2f4fc8';
  if (kind % 3 === 1) { ctx.fillStyle = '#f47a5a'; ctx.beginPath(); ctx.arc(ix + iw * 0.6, iy + ih * 0.45, ih * 0.25, 0, TAU); ctx.fill(); ctx.fillStyle = '#2f4fc8'; ctx.fillRect(ix, iy + ih * 0.7, iw, ih * 0.3); }
  else {
    // a curling wave: on the odd card it reaches out past the picture onto the white border
    const reach = odd ? 7 : 0;
    ctx.beginPath(); ctx.moveTo(ix - reach, iy + ih); ctx.quadraticCurveTo(ix + iw * 0.35, iy + ih * 0.1 - reach * 0.6, ix + iw * 0.75 + reach, iy + ih * 0.15 - reach * 0.4);
    ctx.quadraticCurveTo(ix + iw * 0.55, iy + ih * 0.35, ix + iw * 0.65, iy + ih * 0.6); ctx.lineTo(ix + iw + reach, iy + ih); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
};
Object.assign(Decor, {
  // a wire postcard rack on a wooden post and a round iron foot, three tiers of cards (d.odd: the odd lowest card)
  postVnRack(ctx, x, y, t, th, d) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.ellipse(x, y - 3, 16, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x - 3, y - 76, 6, 73); ctx.strokeRect(x - 3, y - 76, 6, 73);
    for (let k = 0; k < 3; k++) {
      const cy = y - 80 + k * 25, w = 34, h = 23;
      card(ctx, x - w / 2, cy, w, h, k === 2 ? 0 : (d.seed + k) % 3, k === 2 && d.odd);
      ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - w / 2 - 2, cy + h - 3); ctx.lineTo(x - w / 2 - 2, cy + h + 1); ctx.lineTo(x + w / 2 + 2, cy + h + 1); ctx.lineTo(x + w / 2 + 2, cy + h - 3); ctx.stroke();
    }
    ctx.restore();
  },
  // the river steps' worn stone and a lantern's glow on the water
  // (drawn from the cell above the landing's middle: a stone vault under the street, an arch onto the river)
  postVnSteps(ctx, x, y) {
    const x0 = x - 6.5 * TS, x1 = x + 9.5 * TS, y0 = y - TS, y1 = y + 3 * TS;
    ctx.save(); ctx.fillStyle = '#2a2232'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.lineTo(x0 + 2 * TS, y1); ctx.lineTo(x0 + 2 * TS, y0 + 2 * TS); ctx.lineTo(x0, y0 + 2 * TS); ctx.closePath(); ctx.fill(); ctx.clip();
    ctx.strokeStyle = '#3a3044'; ctx.lineWidth = 2; for (let yy = y0 + 16; yy < y1; yy += 16) { ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke(); for (let xx = x0 + ((yy - y0) / 16 % 2) * 20; xx < x1; xx += 40) { ctx.beginPath(); ctx.moveTo(xx, yy - 16); ctx.lineTo(xx, yy); ctx.stroke(); } }
    const ax = x + 7.5 * TS; ctx.fillStyle = '#1a3048'; ctx.beginPath(); ctx.moveTo(ax - 2 * TS, y1); ctx.lineTo(ax - 2 * TS, y0 + 40); ctx.quadraticCurveTo(ax, y0 - 10, ax + 2 * TS, y0 + 40); ctx.lineTo(ax + 2 * TS, y1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,190,110,0.35)'; for (let k = 0; k < 6; k++) ctx.fillRect(ax - 40 + k * 14, y1 - 30 + (k % 2) * 8, 8, 2);
    ctx.fillStyle = 'rgba(255,190,110,0.16)'; ctx.beginPath(); ctx.ellipse(x, y1 - 40, 120, 50, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
});

/* ---------------- the way in: crouch into the lowest card from the rack's reverse side ---------------- */
class PostRackGate extends ENTITY_TYPES.gate {
  constructor(g, s) {
    super(g, s); this.exitKey = s.exit || 'post'; this.secret = true;
    this.w = TS; this.h = TS; this.x = s.x - TS / 2; this.y = s.y - TS; this.slip = null; this.friendly = false; this.push = 0; this.rackX = s.rackX;
  }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    if (this.slip == null) {
      // on the reverse side (right of the rack, on the landing), stick down and toward the rack
      const at = p && !p.dead && p.state === 'play' && p.onGround && Math.abs(p.cx - this.cx) < 22 && Math.abs(p.y + p.h - (this.y + this.h)) < 6;
      const inp = p && p.inp;
      this.push = at && inp && inp.down && inp.left ? this.push + dt : 0;
      if (this.push > 0.3 && !this.used && g.state === 'play') { this.used = true; this.slip = 0; p.state = 'portal'; p.portalT = 0; p.vx = 0; p.vy = 0; p.invuln = 3; Sound.play('bump', { vol: 0.4, pitch: 1.4 }); }
      return;
    }
    this.slip += dt;
    if (p && p.state === 'portal') { p.x = lerp(p.x, this.rackX - p.w / 2, Math.min(1, dt * 5)); p.y = lerp(p.y, this.y + this.h - p.h - 4, Math.min(1, dt * 5)); p.squeezeK = Math.min(1, this.slip / 0.8); }
    if (this.slip > 0.4 && !this.named) { this.named = true; g.bannerText = 'POSTMARK SOUND'; g.bannerT = 2.2; TourKit.sfx('secret', 'secret', { vol: 0.8 }); g.burst(this.rackX, this.y + 10, 20, '#2f4fc8', 'spark'); }
    if (this.slip > 1.8 && !this.cleared) { this.cleared = true; if (p) p.squeezeK = 1; g.levelClear(this); }
  }
  touchPlayer() {}
  draw(ctx) {
    if (this.slip == null) return;
    // the card's printed sea spills out as he goes in
    const k = Math.min(1, this.slip / 0.8), x = this.rackX, y = this.y + this.h - 30;
    ctx.save(); ctx.globalAlpha = 0.9 * (1 - Math.max(0, this.slip - 1.2)); PA.scallops(ctx, x - 20 - k * 20, x + 20 + k * 20, y - k * 8, 5, '#2f4fc8'); ctx.restore();
  }
  get light() { return null; }
}
ENTITY_TYPES.postRackGate = PostRackGate;
VALIDATOR_EXITS.postRackGate = { w: TS, h: TS };
// Brady going into the card: flattened to a card's thickness and fading (the arrival's first second)
{
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    if (!(this.squeezeK > 0) || this.state !== 'portal' || !this.g || !this.g.entities.some(e => e instanceof PostRackGate && e.slip != null)) return dr0.call(this, ctx, t);
    ctx.save(); const k = this.squeezeK; ctx.globalAlpha *= Math.max(0, 1 - k * 0.95);
    ctx.translate(this.cx, this.y + this.h); ctx.scale(1 - k * 0.7, 1 - k * 0.35); ctx.translate(-this.cx, -(this.y + this.h));
    const r = dr0.call(this, ctx, t); ctx.restore(); return r;
  };
}
TourHooks.exitKind('postRack', { title: 'A HIDDEN LAND!', marksDone: false });

/* ---------------- 10-3 again, with the river steps under the market ---------------- */
const L0 = VN.levels[2];
const main = L0.areas[0];
const S0 = TourStamp.get(main.stamp, 'vn');
if (!S0) { Tour.problems.push('post: 10-3 has no market stamp to dig the river steps under'); return; }
const W = S0.rows[0].length, H0 = S0.rows.length;
const g = S0.rows.map(r => r.split('')).concat(Array.from({ length: 4 }, () => Array(W).fill('#')));
const put = (x, y, s) => { for (let k = 0; k < s.length; k++) g[y][x + k] = s[k]; };
const fill = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch; };
// the gap in the street floor at the far left (x 1-2), a stone step under it, the landing, the river at its end
const F = S0.floor;   // the street's ground row (19)
fill(1, F, 2, F, '.'); fill(1, F + 1, 16, F + 4, '.'); fill(1, F + 3, 2, F + 4, '#');
fill(3, F + 5, 12, H0 + 3, '#'); fill(13, F + 5, 16, H0 + 3, 'W'); fill(17, F + 1, 17, H0 + 3, '#');
put(7, F + 1, 'U'); put(5, F + 4, 'j'); put(8, F + 4, 'j'); put(11, F + 4, 'J'); put(12, F + 4, 'V');
const rack = (odd) => ['piece', (st) => { st.B.prop('postVnRack', st.x, st.gy - 3, 1, 3, null, { odd }); return st.x; }];
const S1 = Object.assign({}, S0, {
  rows: g.map(r => r.join('')),
  legend: Object.assign({}, S0.legend, {
    j: rack(false), J: rack(true), U: ['decor', 'postVnSteps'],
    V: ['piece', (st) => { st.B.spawn('postRackGate', st.x, st.gy - 1, { exit: 'post', rackX: (st.x - 1) * TS + TS / 2 }); return st.x; }]
  })
});
const L1 = Object.assign({}, L0, {
  n: 3,
  exits: Object.assign({}, L0.exits, { post: { to: 'land:post', via: 'postRack' } }),
  areas: [Object.assign({}, main, { stamp: S1 })].concat(L0.areas.slice(1))
});
delete L1.index; delete L1.kind; delete L1.v2; delete L1.legacySecret;
Tour.amend('vn', { levels: [L1] });
Tour.postKit.hostLevel = '10-3';
Tour.postKit.hostRows = { floor: F, gateX: 12, gateRow: F + 4, rackX: 11 };
})();
