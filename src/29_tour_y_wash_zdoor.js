/* ============================================================
   WRONG SIDE OF THE WASH: the hidden entrance (docs/handoff/HIDDEN_LAND_BRIEF.md, SHEET_KEY A1). In France 7-1,
   Paris Morning Rounds, the bakery errand: past the delivery hatch, before the bakery's back door, the bakery's rear
   balcony stands over the street, three stone steps up. A washing line runs from the bakery wall to a pole over it:
   a striped tea towel, a pillowcase, and a cream sheet held by ONE red peg. Ordinary pegs cast no shadow on the
   cloth; that peg's shadow falls on the FRONT of the sheet (something is lit up on the other side).
   Climb the balcony and jump up through the sheet's low hem: Brady slips through to the wrong side of the wash. The
   land's name comes up, 7-1 clears through its exit 'wash' (to: 'land:wash'), the land opens and appears on the route
   map, and its first stage can be entered from there from then on.
   France's own files are not touched: 7-1 is amended from here (its bakery strip gains the balcony piece, the level
   gains the exit). Its postcards, its other exits and their pips on the level card stay as they were: this exit's
   pip only shows once it has been taken.
   ============================================================ */
(function () {
const FR = Tour.countries.fr, WK = Tour.washKit;
if (!FR || !WK || !FR.levels[0]) return;
const INK = WK.INK, WA = WK.WashArt;

/* ---------------- the balcony: stone steps, a slab on brackets, an iron railing, the bakery's back wall ---------------- */
Decor.washBalcony = function (ctx, x, y, t, th, d) {
  // x: the prop's middle, y: the street; the prop is 14 wide, 12 tall
  const x0 = x - 7 * TS, gy = y, S = TS;
  ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  // the bakery's back wall (warm stone blocks) behind the whole balcony and its line, a blue door onto the balcony,
  // an arched window on the ground floor under it
  const wx0 = x0 + 1 * S, wx1 = x0 + 14 * S, wy0 = gy - 10 * S;
  ctx.fillStyle = '#e8d2a6'; ctx.fillRect(wx0, wy0, wx1 - wx0, gy - wy0);
  ctx.strokeStyle = 'rgba(150,120,80,0.45)'; ctx.lineWidth = 1.2;
  for (let r = 0; r < 10; r++) { const yy = wy0 + r * S; ctx.beginPath(); ctx.moveTo(wx0, yy); ctx.lineTo(wx1, yy); ctx.stroke(); for (let c = (r % 2) * 0.5; c < 13; c++) { const xx = wx0 + c * S * 1.5; if (xx > wx0 && xx < wx1) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + S); ctx.stroke(); } } }
  ctx.fillStyle = 'rgba(210,180,130,0.5)'; for (let k = 0; k < 14; k++) { const bx = wx0 + ((k * 97) % 12) * S + 6, by = wy0 + ((k * 53) % 9) * S + 6; ctx.fillRect(bx, by, S * 1.2, S - 12); }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.strokeRect(wx0, wy0, wx1 - wx0, gy - wy0);
  ctx.fillStyle = '#c87a5a'; ctx.fillRect(wx0 - 6, wy0 - 10, wx1 - wx0 + 12, 12); ctx.strokeRect(wx0 - 6, wy0 - 10, wx1 - wx0 + 12, 12);
  ctx.fillStyle = '#3a3040'; ctx.beginPath(); ctx.moveTo(x0 + 6 * S, gy); ctx.lineTo(x0 + 6 * S, gy - 1.4 * S); ctx.arc(x0 + 7.5 * S, gy - 1.4 * S, 1.5 * S, Math.PI, 0); ctx.lineTo(x0 + 9 * S, gy); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd89a'; ctx.beginPath(); ctx.arc(x0 + 7.5 * S, gy - 1.2 * S, 1.1 * S, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#6a8ac0'; rr(ctx, x0 + 1.5 * S, gy - 6 * S - 10, 2 * S, 3 * S + 10, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a6aa0'; for (let k = 0; k < 3; k++) ctx.fillRect(x0 + 1.5 * S + 6, gy - 6 * S - 2 + k * 24, 2 * S - 12, 4);
  ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x0 + 3.5 * S - 8, gy - 4.5 * S, 2.5, 0, TAU); ctx.fill();
  // the line's bracket on the wall
  ctx.fillStyle = '#5a5a64'; ctx.fillRect(x0 + 4 * S + 8, gy - 8 * S - 6, 10, 12); ctx.strokeRect(x0 + 4 * S + 8, gy - 8 * S - 6, 10, 12);
  // the steps (three stone blocks)
  ctx.fillStyle = '#c8b090';
  for (let k = 1; k <= 2; k++) { ctx.fillRect(x0 + k * S, gy - k * S, S, k * S); ctx.strokeRect(x0 + k * S, gy - k * S, S, k * S); }
  ctx.fillStyle = '#e0ccaa'; for (let k = 1; k <= 2; k++) ctx.fillRect(x0 + k * S + 1, gy - k * S + 1, S - 2, 4);
  // the slab, its brackets underneath, the moss on its lip
  ctx.fillStyle = '#d8c4a0'; ctx.fillRect(x0 + 3 * S, gy - 3 * S, 10 * S, 14); ctx.strokeRect(x0 + 3 * S, gy - 3 * S, 10 * S, 14);
  ctx.fillStyle = '#8ab06a'; for (let k = 0; k < 6; k++) ctx.fillRect(x0 + 3 * S + 10 + k * 50, gy - 3 * S + 9, 14, 4);
  ctx.fillStyle = '#c8b090'; for (const bx of [6, 9, 12]) { ctx.beginPath(); ctx.moveTo(x0 + bx * S - 12, gy - 3 * S + 12); ctx.lineTo(x0 + bx * S + 4, gy - 3 * S + 12); ctx.lineTo(x0 + bx * S - 4, gy - 3 * S + 30); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // the iron railing (scrolls), behind Brady
  ctx.strokeStyle = '#2a2a34'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(x0 + 3 * S + 4, gy - 3 * S - 30); ctx.lineTo(x0 + 13 * S - 4, gy - 3 * S - 30); ctx.stroke();
  for (let k = 0; k <= 9; k++) { const rx = x0 + 3 * S + 6 + k * (10 * S - 12) / 9; ctx.beginPath(); ctx.moveTo(rx, gy - 3 * S); ctx.lineTo(rx, gy - 3 * S - 30); ctx.stroke(); if (k % 2) { ctx.beginPath(); ctx.arc(rx, gy - 3 * S - 20, 5, Math.PI * 0.5, Math.PI * 2.2); ctx.stroke(); } }
  // a pot of red geraniums on the slab's corner (the bakery's)
  ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.fillStyle = '#c86a3a'; ctx.beginPath(); ctx.moveTo(x0 + 12 * S - 14, gy - 3 * S); ctx.lineTo(x0 + 12 * S + 14, gy - 3 * S); ctx.lineTo(x0 + 12 * S + 18, gy - 3 * S - 16); ctx.lineTo(x0 + 12 * S - 18, gy - 3 * S - 16); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a8a3a'; ctx.beginPath(); ctx.arc(x0 + 12 * S - 8, gy - 3 * S - 22, 8, 0, TAU); ctx.arc(x0 + 12 * S + 8, gy - 3 * S - 22, 8, 0, TAU); ctx.fill();
  ctx.fillStyle = '#e8442e'; for (const [dx, dy] of [[-10, -28], [0, -32], [10, -27]]) { ctx.beginPath(); ctx.arc(x0 + 12 * S + dx, gy - 3 * S + dy, 4.5, 0, TAU); ctx.fill(); ctx.stroke(); }
  // the line's pole on the right
  ctx.fillStyle = '#7a6a52'; ctx.fillRect(x0 + 14 * S - 4, gy - 8 * S - 10, 7, 8 * S + 10); ctx.strokeRect(x0 + 14 * S - 4, gy - 8 * S - 10, 7, 8 * S + 10);
  ctx.restore();
};

/* ---------------- the line, its washing and the sheet with the odd peg (the way through) ---------------- */
class WashHem extends ENTITY_TYPES.gate {
  constructor(g, s) {
    super(g, s);
    this.exitKey = s.exit || 'wash'; this.secret = true; this.isWashDoor = true;
    // the validator's box (VALIDATOR_EXITS.washHem): the air under the hem, 4 tiles wide, 2 rows
    this.w = 4 * TS; this.h = 2 * TS; this.x = s.x - this.w / 2; this.y = s.y - this.h;
    this.lx0 = s.lx0; this.lx1 = s.lx1; this.ly = s.ly; this.used = false; this.slip = null; this.near = 0;
  }
  update(dt) {
    this.t += dt;
    const p = this.g.player;
    if (p && !p.dead) this.near = Math.abs(p.cx - this.cx) < 3 * TS && p.y < this.y + 5 * TS ? Math.min(1, this.near + dt * 3) : Math.max(0, this.near - dt * 3);
    if (this.slip != null) {
      this.slip += dt;
      if (p && p.state === 'portal') { p.x = lerp(p.x, this.cx - p.w / 2, Math.min(1, dt * 8)); p.y -= 2.2 * TS * dt; }
      if (this.slip > 0.25 && !this.named) { this.named = true; this.g.bannerText = 'WRONG SIDE OF THE WASH'; this.g.bannerT = 2.6; }
      if (this.slip > 1.4 && !this.cleared) { this.cleared = true; this.g.levelClear(this); }
    }
  }
  touchPlayer(p) {
    // through the hem from underneath only: a jump up into it (never a fall onto it, never a walk past)
    if (this.used || p.dead || p.state !== 'play' || this.g.state !== 'play' || !(p.vy < 0)) return;
    this.used = true; this.slip = 0;
    p.state = 'portal'; p.portalT = 0; p.vx = 0; p.vy = 0; p.invuln = 3;
    TourKit.sfx('swish', 'portal', { vol: 0.6, pitch: 1.4 }); this.g.burst(this.cx, this.y + this.h, 14, WA.CREAM, 'confetti');
  }
  draw(ctx) {
    const t = this.t, ly = this.ly, x0 = this.lx0, x1 = this.lx1, sw = Math.sin(t * 1.4) * 2;
    ctx.save();
    // the line, sagging between the wall bracket and the pole
    WA.line(ctx, x0, ly, x1, ly, 10, '#6a5a4a');
    const lineY = x => ly + 10 * (1 - Math.pow((x - (x0 + x1) / 2) / ((x1 - x0) / 2), 2));
    // a striped tea towel and a pillowcase (their pegs cast no shadow on the cloth: only the sheet's red one does)
    const item = (cx, w, h, paint) => {
      const top = lineY(cx);
      ctx.fillStyle = 'rgba(60,40,30,0.22)'; ctx.fillRect(cx - w / 2 + 7, top + 6, w, h);   // the item's own shadow on the wall
      paint(cx - w / 2, top, w, h);
      for (const px of [cx - w / 2 + 6, cx + w / 2 - 6]) WA.peg(ctx, px, top + 8, 0.75);   // ordinary pegs: no shadow on the cloth
    };
    const towel = this.cx - 3.6 * TS, pillow = this.cx + 2.9 * TS;
    item(towel, 34, 44, (x, y, w, h) => { ctx.fillStyle = '#f4ead2'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#c83a2a'; ctx.fillRect(x, y + 8, w, 4); ctx.fillRect(x, y + h - 12, w, 4); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h); });
    item(pillow, 38, 30, (x, y, w, h) => { ctx.fillStyle = '#eef0f8'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#b8c0d8'; ctx.lineWidth = 1; ctx.strokeRect(x + 4, y + 4, w - 8, h - 8); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h); });
    // the sheet: cream, one red peg in the middle of its top; its hem hangs low over the balcony
    const sx0 = this.cx - 2.1 * TS, sx1 = this.cx + 2.1 * TS, top = lineY(this.cx), bot = this.y + this.h - 8;
    const lift = this.slip != null ? Math.min(1, this.slip * 2) * 10 : 0;
    ctx.fillStyle = 'rgba(60,40,30,0.18)'; ctx.fillRect(sx0 + 8, top + 8, sx1 - sx0, bot - top);
    ctx.fillStyle = '#f6eedb'; ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(sx0 + 2, top + 2); ctx.quadraticCurveTo(this.cx, top + 8, sx1 - 2, top + 2);
    ctx.lineTo(sx1 + sw, bot); ctx.quadraticCurveTo(this.cx + sw, bot + 6 - lift, sx0 + sw, bot); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,140,100,0.35)'; ctx.lineWidth = 2; for (const fx of [-0.6, -0.15, 0.35, 0.7]) { ctx.beginPath(); ctx.moveTo(this.cx + fx * (sx1 - sx0) / 2, top + 10); ctx.quadraticCurveTo(this.cx + fx * (sx1 - sx0) / 2 + 4, (top + bot) / 2, this.cx + fx * (sx1 - sx0) / 2 + sw, bot - 4); ctx.stroke(); }
    // THE CLUE: this peg's shadow lies on the FRONT of the sheet, up and to the left (lit from behind the cloth)
    ctx.save(); ctx.globalAlpha = 0.36; ctx.translate(this.cx - 4, top + 12); ctx.rotate(-0.35); ctx.scale(1, 1.7); WA.peg(ctx, 0, 14, 0.95, 0, '#3a2a20'); ctx.restore();
    WA.peg(ctx, this.cx, top + 9, 0.95);
    // a faint warm glow along the hem when Brady is close (as if it's bright on the other side), the slip through
    if (this.near > 0) { ctx.fillStyle = `rgba(255,236,190,${0.25 * this.near * (0.6 + 0.4 * Math.sin(t * 3))})`; ctx.fillRect(sx0 + 4, bot - 10, sx1 - sx0 - 8, 8); }
    ctx.restore();
  }
}
ENTITY_TYPES.washHem = WashHem;
VALIDATOR_EXITS.washHem = { w: 4 * TS, h: 2 * TS };
if (typeof TourHats !== 'undefined') { /* sorted in 28_tour_sc_hats.js's wash block */ }

// the balcony piece in a strip: { w } (16 wide). The forced path runs on under the slab.
Tour.pieces['wash.balcony'] = function (st, o) {
  const B = st.B, x = st.x, gy = st.gy;
  st.floor(x, x + 15);
  B.prop('washBalcony', x, gy - 12, 14, 12, 'none', {});
  // two stone steps and the slab (solid: no jumping up through it from the street below), under the prop's drawing
  for (let k = 1; k <= 2; k++) for (let y = gy - k; y < gy; y++) { B.set(x + k, y, T.HARD); B.setHide(x + k, y, 1); }
  for (let q = 3; q <= 12; q++) { B.set(x + q, gy - 3, T.HARD); B.setHide(x + q, gy - 3, 1); }
  // the line over the slab, the sheet in the middle of it: the hem's box is the air just over Brady's head up there
  const hx = x + 9;
  B.spawn('washHem', hx, gy - 6, { exit: 'wash', lx0: (x + 4) * TS + 18, lx1: (x + 14) * TS, ly: (gy - 8) * TS });
  return x + 16;
};

/* ---------------- 7-1, amended: the balcony in the bakery strip, the exit to the land ---------------- */
{
  const L0 = FR.levels[0];
  const areas = L0.areas.map(a => {
    if (a.id !== 'boulangerie' || !Array.isArray(a.script)) return a;
    const sc = a.script.slice(), k = sc.findIndex(s => Array.isArray(s) && s[0] === 'door');
    sc.splice(k >= 0 ? k : sc.length, 0, ['wash.balcony', {}]);
    return Object.assign({}, a, { script: sc, W: (a.W || 74) + 16 });
  });
  const exits = Object.assign({}, L0.exits, { wash: { to: 'land:wash' } });
  Tour.amend('fr', { levels: [Object.assign({}, L0, { n: 1, areas, exits })] });
}
// the level card's exit pips: the way through the sheet is not counted until it has been found
{
  const ef0 = TourProgress.exitsFound;
  TourProgress.exitsFound = function (id) {
    const r = ef0.call(this, id), L = Tour.specOf(id);
    if (!L || !L.exits || !L.exits.wash || L.exits.wash.to !== 'land:wash') return r;
    const E = (Save.data.exits || {})[id] || {};
    return E.wash ? r : { found: r.found, total: Math.max(0, r.total - 1) };
  };
}
})();
