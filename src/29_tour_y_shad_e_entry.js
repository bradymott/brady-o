/* ============================================================
   THE DEPARTMENT OF UNCLAIMED SHADOWS: the hidden way in (the land's best secret), on the Moon, 18-1 ONE SMALL HOP.
   ChatGPT's entrance: "walk all the way into the shadow of the sample locker, past the point where Brady's shoes
   disappear. The locker's shadow has a keyhole."
   Just left of where Brady lands on the Moon, a little way back from the start, a grey sample locker stands on the dust
   (labelled like the Moon's own crates, painted the way 18-1's props are). The low sun throws its shadow long across the
   ground to the left, black as the sky. Deep in that shadow, at its far end, there is a keyhole-shaped patch of light: the
   only odd thing in the scene. Walk left into the shadow: first Brady's shoes go dark, then at the far end, standing on the
   keyhole, keep pushing left a moment: he slips through it.
   No sign, no arrow, no coin trail, nothing on the level card. The host level's exits, postcards and totals are as they
   were; its own files are not touched: this file copies 18-1's stamp with twelve plain columns of dust added on its left
   (the locker and its shadow stand there) and adds the 'shad' exit.
   ============================================================ */
(function () {
const MOON = Tour.countries.moon, K = Tour.shadKit;
if (!MOON || !K || !MOON.levels[0]) return;
const INK = '#1a1426', STEEL = '#b8bcc8', STEEL_HI = '#dfe2ea', STEEL_LO = '#7e8292', DUST_LO = '#8e889c', PIWI = '#d6307a';
const PAD = 12, LOCKER_TX = 7;   // twelve columns of dust on the left; the locker's left edge column (in the new stamp)

/* ---------------- the locker and its long black shadow ---------------- */
Object.assign(Decor, {
  // a steel sample locker on four stubby feet, the Moon crates' stencil on its door (feet-centre at its middle)
  shadLocker(ctx, x, y, t) {
    const w = 52, h = 84, x0 = x - w / 2, y0 = y - h - 6;
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.fillStyle = STEEL_LO; for (const fx of [x0 + 4, x0 + w - 10]) { ctx.fillRect(fx, y - 7, 6, 7); ctx.strokeRect(fx, y - 7, 6, 7); }
    ctx.fillStyle = STEEL; ctx.fillRect(x0, y0, w, h); ctx.strokeRect(x0, y0, w, h);
    ctx.fillStyle = STEEL_HI; ctx.fillRect(x0 + 3, y0 + 3, 5, h - 6);
    ctx.fillStyle = STEEL_LO; ctx.fillRect(x0 + w - 6, y0 + 2, 4, h - 4);
    ctx.strokeRect(x0 + 6, y0 + 6, w - 12, h - 12);
    // the hinges, the latch
    ctx.fillStyle = STEEL_HI; for (const hy of [y0 + 14, y0 + h - 22]) { ctx.fillRect(x0 + w - 9, hy, 5, 10); ctx.strokeRect(x0 + w - 9, hy, 5, 10); }
    ctx.fillStyle = STEEL_LO; rr(ctx, x0 + 8, y0 + h / 2 - 5, 16, 9, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x0 + 13, y0 + h / 2 - 0.5, 1.8, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; ctx.font = '6px ' + FONT_DISPLAY; ctx.textAlign = 'center'; ctx.fillText('SAMPLES', x + 2, y0 + 20); ctx.fillText('KEEP SHUT', x + 2, y0 + h - 14);
    ctx.fillStyle = PIWI; ctx.font = '9px ' + FONT_DISPLAY; ctx.fillText('P', x + 2, y0 + 32);
    ctx.restore();
  }
});
// the shadow, drawn over Brady (so his shoes go dark in it): a black wedge lying on the dust from the locker's foot to
// the far left, thicker the further it reaches; at its far end, a keyhole of light
const shadowOf = (ctx, g, gate, t) => {
  const fy = gate.fy, x1 = gate.lockerX - 22, x0 = 0, far = 10;
  ctx.save();
  ctx.fillStyle = 'rgba(6,4,12,0.96)';
  ctx.beginPath(); ctx.moveTo(x1, fy + 2); ctx.lineTo(x1, fy - 2); ctx.lineTo(x0 + 40, fy - far); ctx.lineTo(x0, fy - far); ctx.lineTo(x0, fy + 14); ctx.lineTo(x1 - 20, fy + 14); ctx.closePath(); ctx.fill();
  // the keyhole: a round head and a flared foot, pale as the sunlit dust, lying in the shadow
  const kx = gate.cx, ky = fy + 3;
  ctx.fillStyle = '#f2eee0'; ctx.beginPath(); ctx.arc(kx, ky - 4, 4.6, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(kx - 2.4, ky - 2); ctx.lineTo(kx + 2.4, ky - 2); ctx.lineTo(kx + 5, ky + 9); ctx.lineTo(kx - 5, ky + 9); ctx.closePath(); ctx.fill();
  ctx.restore();
};

/* ---------------- the way in: stand on the keyhole at the shadow's deep end and keep pushing left ---------------- */
class ShadKeyholeGate extends ENTITY_TYPES.gate {
  constructor(g, s) {
    super(g, s); this.exitKey = s.exit || 'shad'; this.secret = true;
    this.w = TS; this.h = TS; this.x = s.x - TS / 2; this.y = s.y - TS; this.dive = null; this.friendly = false; this.pushT = 0; this.row = Math.round(s.y / TS); this.fy = this.row * TS;
    this.lockerX = s.lockerX || (this.cx + 6 * TS);
  }
  at(p) { return p && !p.dead && p.state === 'play' && p.onGround && p.groundTy === this.row && p.cx < this.cx + 30; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    if (this.dive == null) {
      const inp = p && p.inp;
      this.pushT = this.at(p) && inp && inp.left && !inp.right ? this.pushT + dt : 0;
      if (this.pushT > 0.45 && !this.used && g.state === 'play') {
        this.used = true; this.dive = 0; p.state = 'portal'; p.portalT = 0; p.vx = 0; p.vy = 0; p.invuln = 3; this.px = p.cx; this.py = p.y;
        TourKit.sfx('keyhole', 'secret', { vol: 0.5, pitch: 0.7 }); g.burst(this.cx, this.fy, 14, '#f2eee0', 'spark');
      }
      return;
    }
    this.dive += dt;
    if (p && p.state === 'portal') { p.x = lerp(this.px, this.cx, Math.min(1, this.dive / 0.3)) - p.w / 2; p.y = this.py + Math.max(0, this.dive - 0.3) * 60; p.shadSlipK = Math.min(1, this.dive / 1.0); }
    if (this.dive > 0.6 && !this.named) { this.named = true; g.bannerText = 'THE DEPARTMENT OF UNCLAIMED SHADOWS'; g.bannerT = 2.6; TourKit.sfx('secret', 'secret', { vol: 0.8 }); g.burst(this.cx, this.fy - 20, 18, '#f6dc7a', 'confetti'); }
    if (this.dive > 2.0 && !this.cleared) { this.cleared = true; g.levelClear(this); }
  }
  touchPlayer() {}
  draw(ctx) {}
  get light() { return null; }
}
ENTITY_TYPES.shadKeyholeGate = ShadKeyholeGate;
VALIDATOR_EXITS.shadKeyholeGate = { w: TS, h: TS };
TourHooks.on('afterEntities', (play, ctx) => {
  if (!play.entities || !play.area || !play.area.shadMoon) return;
  const e = play.shadKey && play.shadKey.g === play && !play.shadKey.remove ? play.shadKey : (play.shadKey = play.entities.find(q => q instanceof ShadKeyholeGate) || null);
  if (e) shadowOf(ctx, play, e, play.t || 0);
});
// Brady slipping through the keyhole: squeezed thin and sinking into the light
{
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    if (!(this.shadSlipK > 0) || this.state !== 'portal') return dr0.call(this, ctx, t);
    const k = this.shadSlipK; ctx.save(); ctx.globalAlpha *= Math.max(0, 1 - k * 1.05);
    ctx.translate(this.cx, this.y + this.h); ctx.scale(Math.max(0.15, 1 - k * 0.85), 1); ctx.translate(-this.cx, -(this.y + this.h));
    const r = dr0.call(this, ctx, t); ctx.restore(); return r;
  };
}
TourHooks.exitKind('shadKeyhole', { title: 'A HIDDEN LAND!', marksDone: false });
// the locker piece: the locker (a decor prop) and the keyhole's exit at the shadow's far end
Tour.pieces['shad.locker'] = function (st, o) {
  const B = st.B, x = st.x, gy = st.gy;
  B.decorAt('shadLocker', x + 1, gy, 0);
  B.spawn('shadKeyholeGate', 1, gy - 1, { exit: 'shad', lockerX: (x + 1) * TS });
  return x + 2;
};

/* ---------------- 18-1, amended: twelve columns of dust on the left, the locker, the 'shad' exit ---------------- */
{
  const L0 = MOON.levels[0], S0 = TourStamp.get('moonHop', 'moon');
  if (L0 && L0.areas && S0 && !L0.exits.shad) {
    const rows = S0.rows.map((r, y) => { const c = r[0] === '#' || r[0] === 'H' ? '#' : '.'; let pad = c.repeat(PAD); if (y === S0.floor - 1) pad = pad.slice(0, LOCKER_TX) + '!' + pad.slice(LOCKER_TX + 1); return pad + r; });
    const S1 = Object.assign({}, S0, { rows, legend: Object.assign({}, S0.legend, { '!': ['piece', 'shad.locker', {}] }) });
    const spec = JSON.parse(JSON.stringify(Object.assign({}, L0, { index: undefined, kind: undefined, v2: undefined, legacySecret: undefined })));
    spec.n = 1; spec.secret = L0.secret;
    spec.exits = Object.assign({}, JSON.parse(JSON.stringify(L0.exits)), { shad: { to: 'land:shad', via: 'shadKeyhole' } });
    const A = spec.areas.find(a => a.id === 'surface'); A.stamp = 'shadMoonHop'; A.shadMoon = true;
    Tour.amend('moon', { stamps: { shadMoonHop: S1 }, levels: [spec] });
    K.hostLevel = '18-1'; K.hostPad = PAD;
  }
}
// the area flag rides onto the built area (the shadow is drawn only there)
if (TourBuild.SYSTEMS.indexOf('shadMoon') < 0) TourBuild.SYSTEMS.push('shadMoon');
{
  const px0 = Validator.proxyArea;
  Validator.proxyArea = function (area, mask) { const A = px0.call(this, area, mask); if (area.shadMoon) A.shadMoon = true; return A; };
}
})();
