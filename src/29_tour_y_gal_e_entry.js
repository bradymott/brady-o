/* ============================================================
   THE UNFLATTERING GALLERY: the hidden way in (the land's best secret), in Italy 14-1 SCOOTER DASH.
   ChatGPT's entrance: "press up against the frame reflected in the gallery-side fountain, then jump. The reflection
   has an extra nail."
   After the last olive-oil spill and its trench, the alley opens into a little piazza before the finish: an arcade of
   ochre plaster with a small gallery's framed still life hung on the wall under it, and a long stone fountain basin in
   front of it, its still water reflecting the arcade and the frame. The real frame hangs on two nails; its reflection
   shows three. Brake on the scooter over the reflected frame (stick down), then push UP against it (the scooter stays
   braked while UP is held there) and press JUMP: Brady dives into the reflection, and the gallery is found.
   No sign, no arrow, no coin trail, nothing on the level card; everything in the piazza is plain Italian street (the
   arcade, the basin, a geranium pot), painted the way 14-1's alleys are. The host level's exits, postcards and totals
   are as they were; its own files are not touched: this file adds the piazza piece before 14-1's gate.
   ============================================================ */
(function () {
const IT = Tour.countries.it, K = Tour.galKit;
if (!IT || !K || !IT.levels[0]) return;
const INK = '#1a1426', OCHRE = '#e8b04a', PLASTER = '#f0c878', PLASTER_LO = '#d8a858', STONE = '#e8dcc0', STONE_LO = '#c8b898', TERRA = '#d8693a', WOOD = '#8a5a2a', WOOD_LO = '#6a4020';
const FW = 54, FH = 46;   // the framed picture (px)

/* ---------------- the piazza: an arcade, a framed still life, the fountain basin and its reflection ---------------- */
const stillLife = (c, ix, iy, iw, ih) => {
  c.fillStyle = '#f2e6c8'; c.fillRect(ix, iy, iw, ih);
  c.fillStyle = '#c8a070'; c.fillRect(ix, iy + ih * 0.7, iw, ih * 0.3);
  c.fillStyle = '#5a8ac8'; c.beginPath(); c.ellipse(ix + iw / 2, iy + ih * 0.7, iw * 0.3, ih * 0.12, 0, 0, Math.PI); c.fill();
  c.fillStyle = '#f2d23a'; for (const [dx, dy] of [[-0.12, 0.6], [0.06, 0.56], [0.18, 0.62]]) { c.beginPath(); c.ellipse(ix + iw * (0.5 + dx), iy + ih * dy, iw * 0.09, ih * 0.08, 0.3, 0, TAU); c.fill(); }
  c.fillStyle = '#4a8a3a'; c.beginPath(); c.ellipse(ix + iw * 0.58, iy + ih * 0.48, iw * 0.07, ih * 0.04, -0.6, 0, TAU); c.fill();
};
const woodFrame = (c, x, y, nails) => {
  c.save(); c.strokeStyle = INK; c.lineWidth = 1.8;
  c.fillStyle = WOOD; c.fillRect(x, y, FW, FH); c.strokeRect(x, y, FW, FH);
  c.fillStyle = WOOD_LO; c.fillRect(x + 3, y + FH - 9, FW - 6, 6);
  stillLife(c, x + 8, y + 8, FW - 16, FH - 16); c.strokeRect(x + 8, y + 8, FW - 16, FH - 16);
  for (const [nx, ny] of nails) K.GalArt.nail(c, x + nx, y + ny, 3.4);
  c.restore();
};
// nails on the real frame: its two top corners; the reflection (upside down) shows those two at its bottom corners and a
// third one between them that the real frame doesn't have
const REAL_NAILS = [[5, 5], [FW - 5, 5]];
const REFL_NAILS = [[5, FH - 5], [FW - 5, FH - 5], [FW / 2, FH - 5]];
Object.assign(Decor, {
  // drawn from the piazza's middle cell (x: the basin's centre, y: the street's top): 16 tiles wide
  galPiazza(ctx, x, y, t) {
    const x0 = x - 8 * TS, x1 = x + 8 * TS, wallTop = y - 7.4 * TS, waterTop = y - 2.5 * TS;
    ctx.save();
    // the arcade wall: ochre plaster, patches of bare stone, two round arches with columns
    ctx.fillStyle = PLASTER; ctx.fillRect(x0, wallTop, x1 - x0, y - wallTop);
    ctx.fillStyle = PLASTER_LO; ctx.fillRect(x0, wallTop, x1 - x0, 8); ctx.fillStyle = TERRA; ctx.fillRect(x0 - 6, wallTop - 10, x1 - x0 + 12, 10);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(x0 - 6, wallTop - 10, x1 - x0 + 12, 10);
    ctx.fillStyle = 'rgba(200,170,130,0.5)'; for (const [dx, dy, w, h] of [[-6.2, -5.6, 30, 18], [5.1, -4.2, 26, 14], [-2.6, -2.4, 22, 12]]) ctx.fillRect(x + dx * TS, y + dy * TS, w, h);
    for (const ax of [x - 4.6 * TS, x + 4.6 * TS]) {
      ctx.fillStyle = '#c89048'; ctx.beginPath(); ctx.moveTo(ax - 44, waterTop); ctx.lineTo(ax - 44, y - 4.6 * TS); ctx.arc(ax, y - 4.6 * TS, 44, Math.PI, 0); ctx.lineTo(ax + 44, waterTop); ctx.closePath(); ctx.fill();
      ctx.fillStyle = STONE; ctx.strokeStyle = INK; ctx.lineWidth = 1.5; for (const cx of [ax - 52, ax + 44]) { ctx.fillRect(cx, y - 5.4 * TS, 8, waterTop - (y - 5.4 * TS)); ctx.strokeRect(cx, y - 5.4 * TS, 8, waterTop - (y - 5.4 * TS)); }
    }
    // the framed still life on the wall between the arches, on its two nails
    const fx = x - FW / 2, fy = y - 5.2 * TS;
    woodFrame(ctx, fx, fy, REAL_NAILS);
    // the basin: still water with the reflection (upside down, a little dim and rippled), a stone rim in front
    ctx.save(); ctx.beginPath(); ctx.rect(x0 + 10, waterTop, x1 - x0 - 20, y - waterTop - 8); ctx.clip();
    ctx.fillStyle = '#7aa8b0'; ctx.fillRect(x0, waterTop, x1 - x0, y - waterTop);
    ctx.save(); ctx.globalAlpha = 0.55; ctx.translate(0, 2 * waterTop); ctx.scale(1, -1);
    ctx.fillStyle = PLASTER; ctx.fillRect(x0, waterTop - 2.2 * TS, x1 - x0, 2.2 * TS);
    ctx.restore();
    // the reflected frame (drawn the right way round so its nails read: three of them along its lower edge)
    ctx.save(); ctx.globalAlpha = 0.82; const ry = waterTop + 3; ctx.translate(0, Math.sin(t * 1.3) * 0.6);
    ctx.save(); ctx.translate(fx, ry + FH); ctx.scale(1, -1); ctx.fillStyle = WOOD; ctx.fillRect(0, 0, FW, FH); stillLife(ctx, 8, 8, FW - 16, FH - 16); ctx.restore();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(fx, ry, FW, FH); ctx.strokeRect(fx + 8, ry + 8, FW - 16, FH - 16);
    for (const [nx, ny] of REFL_NAILS) K.GalArt.nail(ctx, fx + nx, ry + ny, 3.4);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; for (let k = 0; k < 6; k++) { const xx = x0 + 30 + ((k * 97 + t * 14) % (x1 - x0 - 60)); ctx.beginPath(); ctx.moveTo(xx, waterTop + 6 + (k % 3) * 9); ctx.lineTo(xx + 18, waterTop + 6 + (k % 3) * 9); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = STONE; ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.fillRect(x0 + 4, waterTop - 6, x1 - x0 - 8, 8); ctx.strokeRect(x0 + 4, waterTop - 6, x1 - x0 - 8, 8);
    ctx.fillStyle = STONE_LO; ctx.fillRect(x0 + 4, y - 10, x1 - x0 - 8, 10); ctx.strokeRect(x0 + 4, y - 10, x1 - x0 - 8, 10);
    ctx.restore();
  }
});

/* ---------------- the way in: brake over the reflected frame, push UP against it, then JUMP ---------------- */
class GalFountainGate extends ENTITY_TYPES.gate {
  constructor(g, s) {
    super(g, s); this.exitKey = s.exit || 'gal'; this.secret = true;
    this.w = TS; this.h = TS; this.x = s.x - TS / 2; this.y = s.y - TS; this.dive = null; this.friendly = false; this.upT = 0; this.row = Math.round(s.y / TS);
  }
  at(p) { return p && !p.dead && p.state === 'play' && p.onGround && p.groundTy === this.row && Math.abs(p.cx - this.cx) < 26; }
  update(dt) {
    this.t += dt; const g = this.g, p = g.player;
    if (this.dive == null) {
      const inp = p && p.inp;
      this.upT = this.at(p) && inp && inp.up && Math.abs(p.vx) < 1.5 * TS ? this.upT + dt : (p && !p.onGround && this.upT > 0 ? this.upT : 0);
      if (this.upT > 0.2 && inp && (inp.jumpPressed || (inp.jump && !this.wasJump)) && !this.used && g.state === 'play') {
        this.used = true; this.dive = 0; p.state = 'portal'; p.portalT = 0; p.vx = 0; p.vy = 0; p.invuln = 3; this.px = p.cx; this.py = p.y;
        Sound.play('splash', { vol: 0.5 }); g.burst(this.cx, this.y + this.h - 30, 16, '#bfe4f0', 'spark');
      }
      this.wasJump = !!(inp && inp.jump);
      return;
    }
    this.dive += dt;
    if (p && p.state === 'portal') { p.x = this.cx - p.w / 2; p.y = this.py - Math.sin(Math.min(1, this.dive / 0.5) * Math.PI) * 22 + Math.max(0, this.dive - 0.3) * 40; p.galDiveK = Math.min(1, this.dive / 0.9); }
    if (this.dive > 0.5 && !this.named) { this.named = true; g.bannerText = 'THE UNFLATTERING GALLERY'; g.bannerT = 2.4; TourKit.sfx('secret', 'secret', { vol: 0.8 }); g.burst(this.cx, this.y, 18, '#e2b33a', 'confetti'); }
    if (this.dive > 1.9 && !this.cleared) { this.cleared = true; g.levelClear(this); }
  }
  touchPlayer() {}
  draw(ctx) {
    if (this.dive == null) return;
    // rings spreading on the water where he went in
    const k = Math.min(1, this.dive / 1.2), x = this.cx, y = this.y + this.h - 26;
    ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 2; for (const r of [1, 0.6]) { ctx.beginPath(); ctx.ellipse(x, y, 12 + k * 60 * r, 3 + k * 10 * r, 0, 0, TAU); ctx.stroke(); } ctx.restore();
  }
  get light() { return null; }
}
ENTITY_TYPES.galFountainGate = GalFountainGate;
VALIDATOR_EXITS.galFountainGate = { w: TS, h: TS };
// on the scooter, UP held over the reflected frame brakes (pushing against it), so he can stand there and jump
{
  const up0 = Player.prototype.update;
  Player.prototype.update = function (dt, inp) {
    const g = this.g, A = g && g.area;
    if (inp && inp.up && A && A.scoot && g.entities) {
      const e = g.galFount || (g.galFount = g.entities.find(q => q instanceof GalFountainGate) || null);
      if (e && e.g === g && e.at(this)) inp = Object.assign({}, inp, { down: true });
    }
    return up0.call(this, dt, inp);
  };
}
// Brady diving into the reflection: tipped head first, fading into the water
{
  const dr0 = Player.prototype.draw;
  Player.prototype.draw = function (ctx, t) {
    if (!(this.galDiveK > 0) || this.state !== 'portal') return dr0.call(this, ctx, t);
    const k = this.galDiveK; ctx.save(); ctx.globalAlpha *= Math.max(0, 1 - k * 1.1);
    ctx.translate(this.cx, this.cy); ctx.rotate(k * Math.PI * 0.9); ctx.scale(1 - k * 0.3, 1 - k * 0.3); ctx.translate(-this.cx, -this.cy);
    const r = dr0.call(this, ctx, t); ctx.restore(); return r;
  };
}
TourHooks.exitKind('galFountain', { title: 'A HIDDEN LAND!', marksDone: false });

/* the piazza piece, run inside 14-1's alley strip: 18 tiles of plain paving with the arcade and the basin */
Tour.pieces['gal.piazza'] = function (st, o) {
  const B = st.B, x = st.x, gy = st.gy;
  st.floor(x, x + 17);
  B.decorAt('galPiazza', x + 9, gy, 0);
  B.decorAt('itGeranium', x + 1, gy, 1); B.decorAt('itGeranium', x + 16, gy, 2);
  B.spawn('galFountainGate', x + 9, gy - 1, { exit: 'gal' });
  return x + 18;
};

/* ---------------- 14-1, amended: the piazza before the gate, the 'gal' exit ---------------- */
{
  const L0 = IT.levels[0];
  if (L0 && L0.areas && !L0.exits.gal) {
    const spec = JSON.parse(JSON.stringify(Object.assign({}, L0, { index: undefined, kind: undefined, v2: undefined, legacySecret: undefined })));
    spec.n = 1; spec.secret = L0.secret;
    spec.exits = Object.assign({}, JSON.parse(JSON.stringify(L0.exits)), { gal: { to: 'land:gal', via: 'galFountain' } });
    const A = spec.areas.find(a => a.id === 'vicolo'), k = A.script.findIndex(s => Array.isArray(s) && s[0] === 'gate');
    A.script.splice(k, 0, ['gal.piazza', {}]); A.W = (A.W || 330) + 18;
    Tour.amend('it', { levels: [spec] });
    Tour.galKit.hostLevel = '14-1';
  }
}
})();
