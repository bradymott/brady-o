/* ============================================================
   THE SPARE BONE QUARRY: the hidden way in (the land's best secret), in Ecuador 2-1 HEMISPHERE HOP.
   ChatGPT's entrance: "walk behind the trail's last exposed rock ledge and jump up into the underside of the fossil
   slab. One footprint on its face has pressed toes but a RAISED heel."
   At the end of 2-1, past the last equator line, the trail climbs two rock ledges and runs along the top of a
   fossil slab that juts out over the path down to the finish arch. The slab's face carries a little trackway of
   three-toed prints; every one is pressed in, toes and heel, except the middle one, whose toes are pressed in but
   whose heel stands UP out of the rock (lit on top, shadowed under: wrong). Behind the last ledge, under the slab,
   is a low recess the trail never needs. Jump up into the slab's underside below the odd print: Brady slips up
   through a crack, and the quarry is found.
   No sign, no arrow, no coin trail, nothing on the level card. The host level's exits, postcards and totals are as
   they were; its own files are not touched: this file re-registers 2-1 with one piece added before the finish.
   ============================================================ */
(function () {
const EC = Tour.countries.ec, K = Tour.boneKit;
if (!EC || !K || !EC.levels[0]) return;
const INK = K.INK, BA = K.BoneArt;

/* ---------------- the props: the rock ledges and the fossil slab ---------------- */
Object.assign(Decor, {
  // a lump of the Andean trail rock (grey-brown with lichen), the size of its box
  boneEcLedge(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2, y0 = y - h;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.fillStyle = '#8a7462'; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 2, y0 + 8); ctx.lineTo(x0 + 10, y0); ctx.lineTo(x0 + w - 8, y0 + 1); ctx.lineTo(x0 + w, y0 + 10); ctx.lineTo(x0 + w, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a8907a'; ctx.beginPath(); ctx.moveTo(x0 + 6, y0 + 6); ctx.lineTo(x0 + 12, y0 + 2); ctx.lineTo(x0 + w - 10, y0 + 3); ctx.lineTo(x0 + w - 6, y0 + 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5a4a3c'; ctx.lineWidth = 1.5; for (let yy = y0 + 22; yy < y - 6; yy += 22) { ctx.beginPath(); ctx.moveTo(x0 + 4, yy); ctx.lineTo(x0 + w * 0.6, yy + 4); ctx.stroke(); }
    ctx.fillStyle = '#c8d0a0'; ctx.beginPath(); ctx.arc(x0 + w * 0.7, y0 + h * 0.5, 3, 0, TAU); ctx.arc(x0 + w * 0.3, y0 + h * 0.75, 2.4, 0, TAU); ctx.fill();
    // a tuft of paramo grass on top
    ctx.strokeStyle = '#7a9a3a'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x0 + w * 0.4 + k * 2, y0 + 2); ctx.lineTo(x0 + w * 0.4 + k * 4, y0 - 10 + Math.abs(k) * 2); ctx.stroke(); }
    ctx.restore();
  },
  // the fossil slab jutting out over the trail: ochre sandstone with a trackway of three-toed prints along its face;
  // the middle print (d.odd: its index) has a RAISED heel
  boneEcSlab(ctx, x, y, t, th, d) {
    const w = d.w, h = d.h, x0 = x - w / 2, y0 = y - h;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    ctx.fillStyle = '#c8903e'; ctx.beginPath(); ctx.moveTo(x0, y0 + 2); ctx.lineTo(x0 + w - 10, y0); ctx.lineTo(x0 + w, y0 + 12); ctx.lineTo(x0 + w - 6, y); ctx.lineTo(x0 + 4, y - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e0aa58'; ctx.fillRect(x0 + 2, y0 + 3, w - 12, 7);
    ctx.strokeStyle = '#9a6a2a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0 + 6, y0 + 30); ctx.lineTo(x0 + w * 0.3, y0 + 28); ctx.lineTo(x0 + w * 0.55, y0 + 32); ctx.lineTo(x0 + w - 8, y0 + 29); ctx.stroke();
    ctx.fillStyle = '#d8d0a8'; ctx.beginPath(); ctx.arc(x0 + 12, y0 + 16, 3, 0, TAU); ctx.arc(x0 + w - 20, y0 + 48, 2.5, 0, TAU); ctx.fill();
    // the trackway: three-toed prints walking right along the face
    for (let k = 0; k < 3; k++) {
      const px = x0 + (2.5 + k * 3) * TS, py = y0 + 34 + (k % 2) * 6, raised = k === d.odd;
      ctx.save(); ctx.translate(px, py); ctx.rotate(Math.PI / 2);
      // the toes: three pressed grooves (dark inside, a light lip below)
      ctx.lineCap = 'round';
      for (const [ex, ey] of [[0, -11], [-7, -8], [7, -8]]) { ctx.strokeStyle = '#7a4a18'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(ex, ey); ctx.stroke(); ctx.strokeStyle = 'rgba(255,230,170,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(1.5, 0); ctx.lineTo(ex + 1.5, ey + 1); ctx.stroke(); }
      // the heel: pressed (a dark hollow with a lit lower lip) or RAISED (a lit bump with a shadow under it)
      if (!raised) { ctx.fillStyle = '#7a4a18'; ctx.beginPath(); ctx.ellipse(0, 4, 4.5, 5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,230,170,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 4, 4.5, 5, 0, -0.4, 1.6); ctx.stroke(); }
      else { ctx.fillStyle = '#f2c070'; ctx.strokeStyle = '#7a4a18'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 4, 4.5, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff0c8'; ctx.beginPath(); ctx.ellipse(-1.6, 3, 1.8, 2.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(80,40,10,0.45)'; ctx.beginPath(); ctx.ellipse(2.6, 5, 2.4, 4, 0, -1.2, 1.2); ctx.fill(); }
      ctx.restore();
    }
    // the underside: a fine crack runs up into the rock right under the odd print (seen from the recess)
    const cx = x0 + (2.5 + d.odd * 3) * TS;
    ctx.strokeStyle = '#4a2a0a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx - 6, y - 1); ctx.lineTo(cx - 1, y - 8); ctx.lineTo(cx + 3, y - 4); ctx.lineTo(cx + 7, y - 12); ctx.stroke();
    ctx.restore();
  }
});

/* ---------------- the way in: jump up into the underside under the odd print ---------------- */
// a tour gate with exit 'bone': it only goes when Brady's head comes up into the slab's underside here (a jump from
// the recess below). Then he slips up through the crack, the land's name shows, and the level clears through it.
class BoneSlabGate extends ENTITY_TYPES.gate {
  constructor(g, s) {
    super(g, s); this.exitKey = s.exit || 'bone'; this.secret = true;
    this.w = 2 * TS; this.h = TS; this.x = s.x - TS; this.y = s.y - TS; this.slip = null; this.friendly = false;
  }
  update(dt) {
    this.t += dt;
    if (this.slip == null) return;
    this.slip += dt; const g = this.g, p = g.player;
    if (p && p.state === 'portal') { p.x = lerp(p.x, this.cx - p.w / 2, Math.min(1, dt * 8)); p.y = Math.max(this.y - p.h - 4, p.y - 70 * dt); p.squeezeK = Math.min(1, this.slip / 0.8); }
    if (this.slip > 0.4 && !this.named) { this.named = true; g.bannerText = 'THE SPARE BONE QUARRY'; g.bannerT = 2.2; TourKit.sfx('secret', 'secret', { vol: 0.8 }); g.burst(this.cx, this.y + this.h, 20, '#f4ead2', 'dust'); }
    if (this.slip > 1.8 && !this.cleared) { this.cleared = true; if (p) p.squeezeK = 1; g.levelClear(this); }
  }
  touchPlayer(p) {
    if (this.used || p.dead || p.state !== 'play' || this.g.state !== 'play') return;
    // only a jump up into the underside (head first): never a walk-in, never from above
    if (!(p.vy < 0 && p.y <= this.y + this.h + 2)) return;
    this.used = true; this.slip = 0;
    p.state = 'portal'; p.portalT = 0; p.vx = 0; p.vy = 0; p.invuln = 3;
    Sound.play('bump', { vol: 0.5, pitch: 0.6 }); this.g.shake(3);
  }
  draw(ctx) {
    if (this.slip == null) return;
    // the crack opens a little as he goes through it
    const k = Math.min(1, this.slip / 0.6);
    ctx.save(); ctx.fillStyle = '#2a140a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(this.cx, this.y + this.h - 2, 4 + 14 * k, 2 + 4 * k, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  get light() { return null; }
}
ENTITY_TYPES.boneSlabGate = BoneSlabGate;
// the checker: a jump in the recess reaches this box (the top row of the recess, right under the slab)
VALIDATOR_EXITS.boneSlabGate = { w: 2 * TS, h: TS };
// Brady going through the crack: squeezed thin and fading upwards (the arrival's first second)
{
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    if (!(this.squeezeK > 0) || this.state !== 'portal') return dr0.call(this, ctx, t);
    ctx.save(); const k = this.squeezeK; ctx.globalAlpha *= Math.max(0, 1 - k * 0.9);
    ctx.translate(this.cx, this.y + this.h); ctx.scale(1 - k * 0.55, 1 + k * 0.25); ctx.translate(-this.cx, -(this.y + this.h));
    const r = dr0.call(this, ctx, t); ctx.restore(); return r;
  };
}
TourHooks.exitKind('boneSlab', { title: 'A HIDDEN LAND!', marksDone: false });

// the piece: the trail's last stretch: a low rock ledge, the last (tall) ledge, the fossil slab jutting out from it
// over a recess, the trail down to the finish. { odd: the slab's odd print (0-2) }
Tour.pieces['ec.boneTrail'] = function (st, o) {
  const B = st.B, x = st.x, gy = st.gy;
  st.floor(x, x + 26);
  B.prop('boneEcLedge', x + 4, gy - 2, 2, 2, 'body');
  B.prop('boneEcLedge', x + 8, gy - 3, 3, 3, 'body');
  // the slab: 11 wide, 2 thick, resting on the last ledge and jutting out over a recess 3 rows high (open to the
  // right); the gate sits under the odd print (5.5 tiles along the slab)
  B.prop('boneEcSlab', x + 8, gy - 5, 11, 2, 'body', { odd: 1 });
  B.spawn('boneSlabGate', x + 13, gy - 3, { exit: 'bone' });
  st.coins(x + 12, x + 17, gy - 7);
  return x + 27;
};

/* ---------------- 2-1 again, with the trail's end added ---------------- */
const L0 = EC.levels[0];
const main = L0.areas[0];
const fi = main.script.findIndex(s => Array.isArray(s) && s[0] === 'finish');
if (fi < 0) { Tour.problems.push('bone: 2-1 has no finish to put the slab before'); return; }
const script = main.script.slice(0, fi).concat([['boneTrail', {}]], main.script.slice(fi));
const L1 = Object.assign({}, L0, {
  n: 1,
  exits: Object.assign({}, L0.exits, { bone: { to: 'land:bone', via: 'boneSlab' } }),
  areas: [Object.assign({}, main, { script })].concat(L0.areas.slice(1))
});
delete L1.index; delete L1.kind; delete L1.v2; delete L1.legacySecret;
Tour.amend('ec', { levels: [L1] });
Tour.boneKit.hostLevel = '2-1';
})();
